/**
 * RFC 3161 외부 타임스탬프 앵커 — 해시체인 머리를 제3자 TSA에 공증한다.
 *
 * 왜: 커밋 히스토리 공증은 리포 소유자가 force-push로 재작성할 수 있다는
 * 반론이 가능하다. 독립 TSA(공인 타임스탬프 기관)의 서명은 "이 체인 머리가
 * 이 시각에 존재했다"를 소유자와 무관하게 증명한다 — 시간해자의 외부 닻.
 *
 * 산출물 (data/<id>/):
 *   anchors/<ts>.tsr   TSA 응답 원본 (DER TimeStampResp)
 *   anchors.jsonl      {anchored_at, chain_length, chain_hash, tsa, proof} — append-only
 *
 * 검증 (오프라인, 제3자 도구만으로):
 *   openssl ts -reply -in data/<id>/anchors/<ts>.tsr -text
 *     → genTime과 messageImprint가 integrity.json의 chain_hash와 일치하는지
 *   openssl ts -verify -digest <chain_hash> -in <ts>.tsr -CAfile <TSA CA>
 *
 * best-effort 계약: TSA 장애가 수집을 막으면 안 된다 — CLI는 어떤 실패에도
 * 종료코드 0으로 끝나고, 다음 실행에서 자연 재시도된다(멱등: 같은 체인
 * 머리는 두 번 앵커하지 않음).
 *
 * CLI: npm run anchor -- <source-id> [--data-dir <path>] [--root <path>]
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { canonicalJson } from "./integrity.js";
import { loadIntegrity, sourcePaths } from "./store.js";

/** 폴백 순서대로 시도 — 하나만 살아있으면 앵커가 붙는다. */
const DEFAULT_TSA_URLS = [
  "http://timestamp.digicert.com",
  "https://freetsa.org/tsr",
  "http://timestamp.sectigo.com",
];

export interface AnchorOptions {
  sourceId: string;
  dataDir: string;
  /** 시도할 TSA 목록 (순차 폴백). 생략 시 기본 3곳, 환경변수 CHRONICLE_TSA_URL(쉼표 구분)로 재정의. */
  tsaUrls?: string[];
  log?: (message: string) => void;
  /** 테스트 주입 지점 — 생략 시 전역 fetch. */
  fetchImpl?: typeof fetch;
  now?: () => Date;
}

export type AnchorResult = "anchored" | "already-anchored" | "no-chain" | "skipped";

/** openssl로 RFC 3161 TimeStampReq(DER)를 만든다 — 논스·인증서 요청 포함. */
export function buildTimestampQuery(sha256Hex: string): Buffer {
  if (!/^[0-9a-f]{64}$/i.test(sha256Hex)) throw new Error(`SHA-256 hex가 아닙니다: ${sha256Hex}`);
  return execFileSync("openssl", ["ts", "-query", "-sha256", "-digest", sha256Hex, "-cert"]);
}

/**
 * TSA 응답 검증 — 파싱 가능한 TimeStampResp이면서 상태가 Granted여야 한다.
 * (임시파일 경유 — /dev/stdin은 일부 실행 환경에서 신뢰할 수 없다)
 */
function validateReply(tsr: Buffer): { ok: boolean; reason?: string } {
  const dir = mkdtempSync(join(tmpdir(), "chronicle-tsa-"));
  const file = join(dir, "reply.tsr");
  try {
    writeFileSync(file, tsr);
    const out = execFileSync("openssl", ["ts", "-reply", "-in", file, "-text"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (!/Status: Granted/i.test(out)) {
      const status = out.match(/Status: [^\n]+/)?.[0]?.trim() ?? "상태 불명";
      return { ok: false, reason: `TSA가 거절함 (${status})` };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "TimeStampResp 파싱 실패" };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function anchorSource(options: AnchorOptions): Promise<AnchorResult> {
  const log = options.log ?? ((message: string) => console.error(message));
  const tsaUrls =
    options.tsaUrls ??
    (process.env.CHRONICLE_TSA_URL
      ? process.env.CHRONICLE_TSA_URL.split(",").map((url) => url.trim()).filter(Boolean)
      : DEFAULT_TSA_URLS);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());

  const paths = sourcePaths(options.dataDir, options.sourceId);
  const integrity = loadIntegrity(paths);
  if (!integrity || integrity.length === 0) {
    log(`[${options.sourceId}] 아직 체인이 없음 — 앵커 생략`);
    return "no-chain";
  }

  const anchorsPath = join(paths.dir, "anchors.jsonl");
  if (existsSync(anchorsPath) && readFileSync(anchorsPath, "utf8").includes(`"chain_hash":"${integrity.chain_hash}"`)) {
    log(`[${options.sourceId}] 현재 체인 머리는 이미 앵커됨 (${integrity.chain_hash.slice(0, 16)}…)`);
    return "already-anchored";
  }

  const tsq = buildTimestampQuery(integrity.chain_hash);
  let tsr: Buffer | null = null;
  let tsaUrl = "";
  const failures: string[] = [];
  for (const candidate of tsaUrls) {
    try {
      const response = await fetchImpl(candidate, {
        method: "POST",
        headers: { "Content-Type": "application/timestamp-query" },
        body: new Uint8Array(tsq),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = Buffer.from(await response.arrayBuffer());
      const verdict = validateReply(body);
      if (!verdict.ok) {
        // 원인 규명용 응답 메타 — 다음 실행 로그가 스스로 자백하게 한다
        const contentType = response.headers.get("content-type") ?? "?";
        const head = body.subarray(0, 8).toString("hex");
        throw new Error(`${verdict.reason} [HTTP ${response.status}, ${contentType}, ${body.length}B, head=${head}]`);
      }
      tsr = body;
      tsaUrl = candidate;
      break;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push(`${candidate}: ${reason}`);
      log(`[${options.sourceId}] TSA 실패 — ${candidate}: ${reason}`);
    }
  }
  if (!tsr) throw new Error(`모든 TSA(${tsaUrls.length}곳) 실패 — ${failures.join(" | ")}`);

  const anchoredAt = now().toISOString();
  const compact = anchoredAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const proofRel = join("anchors", `${compact}.tsr`);
  mkdirSync(join(paths.dir, "anchors"), { recursive: true });
  writeFileSync(join(paths.dir, proofRel), tsr);
  appendFileSync(
    anchorsPath,
    `${canonicalJson({
      anchored_at: anchoredAt,
      chain_length: integrity.length,
      chain_hash: integrity.chain_hash,
      tsa: tsaUrl,
      proof: proofRel,
    })}\n`,
  );
  log(`[${options.sourceId}] 체인 머리 앵커 완료: ${integrity.chain_hash.slice(0, 16)}… → ${proofRel}`);
  return "anchored";
}

/** GitHub Actions 실행 요약(run 페이지 첫 화면)에 결과를 노출 — 로그를 파헤치지 않아도 보인다. */
function stepSummary(line: string): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  try {
    appendFileSync(summaryPath, `${line}\n\n`);
  } catch {
    /* 요약 실패는 무시 */
  }
}

const isCliEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCliEntry) {
  const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { "data-dir": { type: "string" }, root: { type: "string" } },
  });
  const sourceId = positionals[0];
  if (!sourceId) {
    console.error("사용법: npm run anchor -- <source-id> [--data-dir <path>] [--root <path>]");
    process.exit(2);
  }
  const root = values.root ? resolve(values.root) : defaultRoot;
  const dataDir = values["data-dir"] ? resolve(values["data-dir"]) : join(root, "data");
  try {
    const result = await anchorSource({ sourceId, dataDir });
    if (result === "anchored") stepSummary(`⚓ **${sourceId}**: 체인 머리 TSA 앵커 완료`);
    if (result === "already-anchored") stepSummary(`⚓ ${sourceId}: 현재 머리 이미 앵커됨`);
  } catch (error) {
    // best-effort: 앵커 실패가 수집 파이프라인을 막으면 안 된다.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`앵커 실패(생략, 다음 실행에서 재시도): ${message}`);
    stepSummary(`⚠️ **${sourceId} 앵커 실패** (수집은 정상): ${message}`);
  }
}
