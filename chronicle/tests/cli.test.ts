/**
 * CLI 풀스택 e2e — 에뮬레이터가 아니라 진짜를 쓴다:
 *   - 127.0.0.1에 mock 소스 HTTP 서버 (첫 요청 500 → 재시도 검증)
 *   - 실제 프로세스로 collect/verify CLI 실행 (동적 어댑터 로드·config 검증 포함)
 *   - 산출물·로그 전체에서 시크릿(DATA_GO_KR_KEY) 유출 수색
 *   - 변조 후 verify CLI가 비0으로 종료하는지
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { after, before, test } from "node:test";

const execFileAsync = promisify(execFile);
const chronicleRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SECRET = "QA-SUPER-SECRET-KEY-do-not-leak-4821";

let server: http.Server;
let baseUrl: string;
let requestCount = 0;
let unauthorizedCount = 0;
let rows: Array<Record<string, unknown>> = [
  { id: 1, name: "첫 레코드", price: 100 },
  { id: 2, name: "둘째 레코드", price: 200 },
];

let qaRoot: string;
let dataDir: string;

before(async () => {
  server = http.createServer((req, res) => {
    requestCount += 1;
    const auth = req.headers.authorization ?? "";
    if (auth !== `Infuser ${SECRET}`) {
      unauthorizedCount += 1;
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    if (requestCount === 1) {
      // 첫 요청은 일부러 죽여서 재시도 경로를 태운다
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("transient failure");
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ rows }));
  });
  await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${address.port}`;

  // 임시 루트에 self-contained 소스(qa-local) 생성 — import 없는 어댑터라 어디서든 로드된다
  qaRoot = mkdtempSync(join(tmpdir(), "chronicle-cli-root-"));
  dataDir = mkdtempSync(join(tmpdir(), "chronicle-cli-data-"));
  const sourceDir = join(qaRoot, "sources", "qa-local");
  mkdirSync(sourceDir, { recursive: true });
  writeFileSync(
    join(sourceDir, "config.yml"),
    [
      "id: qa-local",
      "family: api-records",
      "title: CLI e2e mock 소스",
      `base_url: ${baseUrl}`,
      "rate_limit_ms: 0",
    ].join("\n"),
  );
  writeFileSync(
    join(sourceDir, "adapter.ts"),
    `
export default {
  id: "qa-local",
  family: "api-records",
  async collect(ctx) {
    const base = ctx.config.base_url;
    const key = process.env.DATA_GO_KR_KEY;
    if (!key) throw new Error("DATA_GO_KR_KEY 환경변수가 없습니다.");
    const body = await ctx.http.json(base + "/rows", { headers: { Authorization: "Infuser " + key } });
    return {
      raw: body,
      records: body.rows.map((row) => ({
        entityId: "r:" + row.id,
        sourceUrl: base + "/rows",
        fields: row,
      })),
    };
  },
};
`,
  );
});

after(() => {
  server?.close();
});

function cli(args: string[], env: Record<string, string> = {}) {
  return execFileAsync(
    process.execPath,
    ["--import", "tsx", ...args],
    { cwd: chronicleRoot, timeout: 120_000, env: { ...process.env, DATA_GO_KR_KEY: SECRET, ...env } },
  );
}

const collectArgs = (extra: string[] = []) => [
  "engine/run.ts",
  "qa-local",
  "--root",
  "",
  "--data-dir",
  "",
  ...extra,
];

function withPaths(args: string[]): string[] {
  const out = [...args];
  out[out.indexOf("--root") + 1] = qaRoot;
  out[out.indexOf("--data-dir") + 1] = dataDir;
  return out;
}

function* walkFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walkFiles(path);
    else yield path;
  }
}

test("collect CLI: 재시도를 거쳐 수집·봉인하고, 산출물·로그에 시크릿이 없다", async () => {
  const { stdout, stderr } = await cli(withPaths(collectArgs()));
  const summary = JSON.parse(stdout);
  assert.equal(summary.wrote, true);
  assert.equal(summary.added, 2);
  assert.ok(requestCount >= 2, "첫 500 이후 재시도가 있어야 한다");
  assert.equal(unauthorizedCount, 0, "Infuser 키가 헤더로 전달되어야 한다");

  // 시크릿 유출 수색: 표준출력·표준에러·모든 산출물 파일
  assert.ok(!stdout.includes(SECRET), "stdout에 키가 새면 안 된다");
  assert.ok(!stderr.includes(SECRET), "stderr에 키가 새면 안 된다");
  for (const file of walkFiles(dataDir)) {
    assert.ok(!readFileSync(file, "utf8").includes(SECRET), `${file} 에 키가 새면 안 된다`);
  }
});

test("verify CLI: 온전한 체인은 0으로 종료한다", async () => {
  const { stdout } = await cli(withPaths(["engine/verify.ts", "qa-local", "--root", "", "--data-dir", ""]));
  assert.ok(stdout.includes("체인 온전"));
});

test("collect CLI 재실행: 변경이 없으면 아무것도 쓰지 않는다", async () => {
  const snapshotsBefore = readdirSync(join(dataDir, "qa-local", "snapshots")).length;
  const { stdout } = await cli(withPaths(collectArgs()));
  const summary = JSON.parse(stdout);
  assert.equal(summary.wrote, false);
  assert.equal(readdirSync(join(dataDir, "qa-local", "snapshots")).length, snapshotsBefore);
});

test("collect CLI --dry-run: 변경을 계산하되 쓰지 않는다", async () => {
  rows = [...rows, { id: 3, name: "셋째 레코드", price: 300 }];
  const changesBefore = readFileSync(join(dataDir, "qa-local", "changes.jsonl"), "utf8");

  const dry = await cli(withPaths(collectArgs(["--dry-run"])));
  const drySummary = JSON.parse(dry.stdout);
  assert.equal(drySummary.added, 1);
  assert.equal(drySummary.wrote, false);
  assert.equal(readFileSync(join(dataDir, "qa-local", "changes.jsonl"), "utf8"), changesBefore, "dry-run은 무기록");

  const real = await cli(withPaths(collectArgs()));
  assert.equal(JSON.parse(real.stdout).wrote, true);
});

test("verify CLI: 변조된 원장은 비0으로 종료한다", async () => {
  const changesPath = join(dataDir, "qa-local", "changes.jsonl");
  const intact = readFileSync(changesPath, "utf8");
  writeFileSync(changesPath, intact.replace('"price":100', '"price":1'));
  try {
    await assert.rejects(
      () => cli(withPaths(["engine/verify.ts", "qa-local", "--root", "", "--data-dir", ""])),
      (error: Error & { code?: number }) => error.code === 1,
    );
  } finally {
    writeFileSync(changesPath, intact);
  }
});

test("collect CLI: 소스 id가 없으면 사용법을 안내하며 2로 종료한다", async () => {
  await assert.rejects(
    () => cli(["engine/run.ts"]),
    (error: Error & { code?: number; stderr?: string }) => error.code === 2 && (error.stderr ?? "").includes("사용법"),
  );
});
