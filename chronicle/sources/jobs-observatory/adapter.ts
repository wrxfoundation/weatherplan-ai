/**
 * #13 워크넷 채용 관측소 (jobs-observatory) — API 레코드형 어댑터. 한국.
 *
 * 워크넷 채용정보 API(data.go.kr 3038225)로 한국 AI·데이터 채용공고를 일간 박제한다.
 * 공고는 마감 즉시 소멸 — 지금 찍은 자만 소유. #18(글로벌 랩 채용)과 노동시장 관측소 쌍.
 * 엔티티: wanted:<구인인증번호>.
 *
 * ── 방어 설계 ──────────────────────────────────────────────────────────────
 *   키(DATA_GO_KR_KEY) 없으면 휴면(0건, 정상). 응답은 XML/JSON 양쪽을 관용 파싱하고
 *   필드명은 후보군에서 첫 존재값을 취한다(정확한 태그명은 첫 실행이 자백 → 핫에디트).
 *   1페이지부터 실패면 중단(지오블록·인증오류 자가진단). 중간 페이지 실패는 이번 회차
 *   삭제판정을 보류해 부분수집 오탐을 막는다. 원본 응답은 스냅샷에 전량 보존.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { BaseAdapter } from "../../engine/adapters/base.js";
import type { CollectContext, CollectResult, NormalizedRecord } from "../../engine/types.js";

type Json = Record<string, unknown>;

/** 여러 후보 키(태그/JSON) 중 첫 존재하는 문자열 값. */
function pickField(map: Record<string, string>, ...candidates: string[]): string | null {
  for (const key of candidates) {
    const v = map[key];
    if (typeof v === "string" && v.trim() !== "") return v.trim();
  }
  return null;
}

/** XML <wanted>…</wanted> 블록들을 태그→값 맵 배열로. CDATA·개행 관용. */
function parseXmlRecords(text: string): Record<string, string>[] {
  const blocks = text.match(/<wanted\b[^>]*>[\s\S]*?<\/wanted>/gi) ?? [];
  return blocks.map((block) => {
    // 바깥 <wanted> 래퍼를 벗겨야 내부 필드 태그가 잡힌다(안 그러면 wanted 하나만 매치됨).
    const inner = block.replace(/^<wanted\b[^>]*>/i, "").replace(/<\/wanted>\s*$/i, "");
    const map: Record<string, string> = {};
    const tagRe = /<([a-zA-Z0-9_]+)>([\s\S]*?)<\/\1>/g;
    for (let m = tagRe.exec(inner); m; m = tagRe.exec(inner)) {
      const raw = m[2].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
      map[m[1]] = raw;
    }
    return map;
  });
}

/** JSON 응답에서 구인 레코드 배열을 방어적으로 찾는다(중첩 봉투 관용). */
function parseJsonRecords(body: unknown): Record<string, string>[] {
  const flatten = (obj: Json): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) if (v != null && typeof v !== "object") out[k] = String(v);
    return out;
  };
  const looksLikeWanted = (o: unknown): o is Json =>
    !!o && typeof o === "object" && Object.keys(o as Json).some((k) => /wantedAuthNo|wantedauthno|authNo/i.test(k));
  const found: Record<string, string>[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      if (node.some(looksLikeWanted)) for (const el of node) { if (looksLikeWanted(el)) found.push(flatten(el)); }
      else for (const el of node) walk(el);
    } else if (node && typeof node === "object") {
      for (const v of Object.values(node as Json)) walk(v);
    }
  };
  walk(body);
  return found;
}

function extractRecords(text: string): { records: Record<string, string>[]; format: "json" | "xml" } {
  const trimmed = text.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return { records: parseJsonRecords(JSON.parse(text)), format: "json" };
    } catch {
      /* JSON 파싱 실패 → XML 시도 */
    }
  }
  return { records: parseXmlRecords(text), format: "xml" };
}

/** 응답이 명백한 오류(인증·차단·서비스오류)인지 — 첫 페이지 자가진단용. */
function looksLikeError(text: string): boolean {
  return /<cmmMsgHeader>|errMsg|SERVICE[_ ]ERROR|인증|허용되지|Host not in allowlist|<html/i.test(text) &&
    !/<wanted\b/i.test(text);
}

export class JobsObservatoryAdapter extends BaseAdapter {
  readonly id = "jobs-observatory";
  readonly family = "api-records" as const;

  async collect(ctx: CollectContext): Promise<CollectResult> {
    const cfg = ctx.config;
    const endpoint = String(cfg.endpoint ?? "");
    if (!endpoint) throw new Error("config.yml에 endpoint가 없습니다.");
    const keyEnv = String(cfg.key_env ?? "DATA_GO_KR_KEY");
    const keyParam = String(cfg.key_param ?? "authKey");
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
    const apiKey = env[keyEnv];

    if (!apiKey) {
      ctx.log(`[${this.id}] 휴면 — 키(${keyEnv}) 미설정. 워크넷 API 활용신청 + 시크릿 추가 시 라이브.`);
      return { raw: { dormant: true }, records: [], removalScope: () => false };
    }

    const query = (cfg.query as Record<string, unknown> | undefined) ?? {};
    const pageSize = Number(cfg.page_size ?? 100) || 100;
    const maxPages = Number(cfg.max_pages ?? 20) || 20;
    const userAgent = typeof cfg.user_agent === "string" ? cfg.user_agent : undefined;
    const init: RequestInit | undefined = userAgent ? { headers: { "User-Agent": userAgent } } : undefined;

    const records: NormalizedRecord[] = [];
    const rawPages: unknown[] = [];
    const seen = new Set<string>();
    let complete = true;
    let reachedEnd = false;
    let format = "";

    for (let page = 1; page <= maxPages; page++) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) params.set(k, String(v));
      params.set("startPage", String(page));
      params.set("display", String(pageSize));
      // 키는 verbatim 부착(data.go.kr 인코딩 키 대비 — 재인코딩 금지). 자가진단으로 형태 교정.
      const url = `${endpoint}?${keyParam}=${apiKey}&${params.toString()}`;

      let text: string;
      try {
        text = await ctx.http.text(url, init);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (page === 1) throw new Error(`[${this.id}] 1페이지 요청 실패 — 지오블록/인증 의심(자가진단): ${msg}`);
        ctx.log(`[${this.id}] ${page}페이지 실패 — 부분수집으로 삭제판정 보류: ${msg}`);
        complete = false;
        break;
      }

      if (page === 1 && looksLikeError(text)) {
        throw new Error(`[${this.id}] 오류 응답(인증/지오블록 의심) — ${text.replace(/\s+/g, " ").slice(0, 200)}`);
      }

      const parsed = extractRecords(text);
      format = parsed.format;
      rawPages.push({ page, count: parsed.records.length });
      if (parsed.records.length === 0) {
        reachedEnd = true; // 빈 페이지 = 데이터 끝(완전 수집)
        break;
      }

      for (const r of parsed.records) {
        const id = pickField(r, "wantedAuthNo", "wantedauthno", "authNo");
        if (!id || seen.has(id)) continue;
        seen.add(id);
        records.push({
          entityId: `wanted:${id}`,
          sourceUrl: pickField(r, "wantedInfoUrl", "wantedMobileInfoUrl") ?? endpoint,
          fields: {
            title: pickField(r, "title"),
            company: pickField(r, "company"),
            region: pickField(r, "region"),
            salary: pickField(r, "sal", "salary"),
            salary_type: pickField(r, "salTpNm", "salTp"),
            employment_type: pickField(r, "empTpNm", "empTp"),
            career: pickField(r, "career", "careerNm"),
            education: pickField(r, "minEdubg", "minEdubgNm", "maxEdubg"),
            close_date: pickField(r, "closeDt", "closeDate"),
            jobs_code: pickField(r, "jobsCd", "jobsCode"),
          },
        });
      }
      // "< pageSize"를 종료 신호로 쓰지 않는다(서버 캡 시 조기종료+거짓 마감). 빈 페이지/상한으로만 종료.
    }
    // 빈 페이지를 못 만나고 max_pages 소진 = 부분 수집(더 있는데 잘림) → 삭제판정 보류.
    if (!reachedEnd) {
      complete = false;
      ctx.log(`[${this.id}] max_pages(${maxPages}) 소진 — 부분수집, 삭제판정 보류.`);
    }

    ctx.log(`[${this.id}] 공고 ${records.length}건 수신 (형식 ${format || "?"}${complete ? "" : ", 부분수집"})`);

    return {
      raw: { format, pages: rawPages, count: records.length, complete },
      records,
      // 부분수집이면 이번 회차 삭제 판정을 전면 보류(마감 오탐 방지).
      removalScope: complete ? undefined : () => false,
    };
  }
}

export default new JobsObservatoryAdapter();
