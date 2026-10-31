/* 순수 로직 점검: computeDraw 결과 형태 → 경품 배정 슬라이스 → 페이즈 전이. DB 는 메모리 목으로 */
const path = require("path"), fs = require("fs"), Module = require("module");
const PROJ = path.resolve(__dirname, "..", "kweather-depin-master");
const ts = require(path.join(PROJ, "node_modules", "typescript"));
const updates = []; let paidByEvent = {};
const fakePrisma = {
  adminConfig: { findUnique: async () => null },
  raffleEntry: {
    updateMany: async ({ where, data }) => { updates.push({ prize: data.prize, n: where.wallet.in.length, event: where.event }); return { count: where.wallet.in.length }; },
    count: async ({ where }) => (paidByEvent[where.event] ?? new Set()).size && where.wallet.in.filter((w) => paidByEvent[where.event].has(w)).length,
  },
};
const MOCKS = {
  "@/lib/db": { prisma: fakePrisma }, "@/lib/auth/device": { encryptDeviceKey: (s) => s, decryptDeviceKey: (s) => s }, "@/lib/integrations": { getIntegration: async () => null },
  "@/lib/xrpl/outbox": { enqueueTx: async () => ({}), drainOutbox: async () => ({}), hotWalletAddress: () => "rHOT" }, "@/lib/xrpl/client": { xrplRead: async () => ({ result: {} }) },
  "@/lib/xrpl/config": { ISSUER_ADDRESS: "rISS" }, "@/lib/launch/xrpl-pay": { newDestTag: () => 1, verifyXrpPayment: async () => ({ ok: true }) },
};
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (MOCKS[request]) return "mock:" + request;
  if (request.startsWith("@/")) return origResolve.call(this, path.join(PROJ, "src", request.slice(2)), parent, ...rest);
  return origResolve.call(this, request, parent, ...rest);
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) { if (MOCKS[request]) return MOCKS[request]; return origLoad.call(this, request, parent, isMain); };
for (const ext of [".ts", ".tsx"]) Module._extensions[ext] = (m, filename) => {
  const out = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename });
  m._compile(out.outputText, filename);
};
process.env.SESSION_SECRET = "x";
const blind = require(path.join(PROJ, "src/lib/blind/index.ts"));
const raffle = require(path.join(PROJ, "src/lib/raffle.ts"));
(async () => {
  // 1) computeDraw: ordered 는 문자열 배열
  const wallets = Array.from({ length: 500 }, (_, i) => `r${String(i).padStart(4, "0")}`);
  const res = blind.computeDraw("ab".repeat(32), wallets, {});
  console.log("ordered[0] type:", typeof res.ordered[0], "| len", res.ordered.length, "| unique", new Set(res.ordered).size);
  // 이전 코드의 읽기 방식(x.id) vs 수정 방식
  const oldWay = res.ordered.map((x) => x.id).filter(Boolean).length;
  const newWay = res.ordered.map((x) => (typeof x === "string" ? x : x?.id ?? "")).filter(Boolean).length;
  console.log("old parser wallets:", oldWay, "| new parser wallets:", newWay);
  // 2) 배정: 500명 → 290/10/50/150, 380명 → 290/10/50/30, 501명 → 거부
  for (const n of [500, 380, 501]) {
    updates.length = 0;
    const r = await raffle.assignPrizes("prod", res.ordered.slice(0, n).concat(n > 500 ? ["rEXTRA"] : []));
    console.log(`assign ${n}:`, r.ok ? JSON.stringify(r.byPrize) + ` assigned=${r.assigned}` : "REJECTED: " + r.error);
  }
  // 3) 장부 추론: 전원 prod → prod, 섞이면 null
  paidByEvent = { "xrpseoul-2026": new Set(wallets), "xrpseoul-2026-test": new Set(["rTEAM"]) };
  console.log("infer prod:", await raffle.inferRaffleMode(wallets.slice(0, 5)), "| infer mixed:", await raffle.inferRaffleMode(["r0001", "rTEAM"]), "| infer test:", await raffle.inferRaffleMode(["rTEAM"]));
  // 4) 페이즈 전이
  const cfg = await raffle.loadRaffleConfig("prod");
  const at = (iso, paid) => raffle.rafflePhaseAt(cfg, paid, new Date(iso));
  console.log("phase 9/22 17:59 KST:", at("2026-09-22T08:59:00Z", 0), "| 9/22 18:00:", at("2026-09-22T09:00:00Z", 0), "| 499 paid:", at("2026-09-25T00:00:00Z", 499), "| 500 paid:", at("2026-09-25T00:00:00Z", 500), "| 9/27 18:00:", at("2026-09-27T09:00:00Z", 120));
  console.log("ticket:", raffle.ticketCodeFor("xrpseoul-2026", "entryid", 129), "| test:", raffle.ticketCodeFor("xrpseoul-2026-test", "entryid", 3));
})();
