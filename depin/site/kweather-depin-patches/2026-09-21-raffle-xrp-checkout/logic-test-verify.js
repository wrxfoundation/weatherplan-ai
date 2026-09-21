/* 결제 확정(verifyRaffleEntry) 서버 규칙 점검 - 메모리 목 DB (2026-09-21 대점검).
   1) 정원 2: A·B 확정(#1·#2) → C 입금은 OVERFLOW(해시 보존·환불 대상), 같은 해시 재호출 멱등, A 재호출은 already
   2) 정원 찬 뒤 새 응모 시작은 거부(SOLD_OUT)  3) 기간 마감 유예 10분: 5분 지난 입금은 확정, 11분 지난 입금은 OVERFLOW
   4) 다른 응모가 쓴 해시는 거부  5) raffleState 의 count 는 PAID 만 */
const path = require("path"), fs = require("fs"), Module = require("module"), assert = require("assert");
const PROJ = path.resolve(__dirname, "..", "kweather-depin-master");
const ts = require(path.join(PROJ, "node_modules", "typescript"));
const db = { entries: [], passes: [] }; let CONFIG_ROW = null;
const match = (row, where) => Object.entries(where).every(([k, v]) => {
  if (k === "event_wallet") return row.event === v.event && row.wallet === v.wallet;
  if (k === "wallet_kind") return row.wallet === v.wallet && row.kind === v.kind;
  if (v && typeof v === "object" && "in" in v) return v.in.includes(row[k]);
  return row[k] === v;
});
const raffleEntry = {
  findUnique: async ({ where }) => db.entries.find((r) => match(r, where)) ?? null,
  findUniqueOrThrow: async ({ where }) => { const r = db.entries.find((r) => match(r, where)); if (!r) throw new Error("not found"); return r; },
  count: async ({ where }) => db.entries.filter((r) => match(r, where)).length,
  aggregate: async ({ where }) => { const ns = db.entries.filter((r) => match(r, where)).map((r) => r.entryNo ?? 0); return { _max: { entryNo: ns.length ? Math.max(...ns) : null } }; },
  updateMany: async ({ where, data }) => { const rows = db.entries.filter((r) => match(r, where)); rows.forEach((r) => Object.assign(r, data)); return { count: rows.length }; },
  create: async ({ data }) => { const r = { id: "e" + (db.entries.length + 1), status: "PENDING", entryNo: null, txHash: null, ticketCode: null, prize: null, redeemedAt: null, paidAt: null, createdAt: new Date(), ...data }; db.entries.push(r); return r; },
};
const genesisPass = { upsert: async ({ where, create }) => { let p = db.passes.find((r) => match(r, where)); if (!p) { p = { id: "p" + (db.passes.length + 1), mintTxId: null, ...create }; db.passes.push(p); } return p; }, findUnique: async ({ where }) => db.passes.find((r) => match(r, where)) ?? null };
const prisma = { raffleEntry, genesisPass, xrplTransaction: { findFirst: async () => null }, adminConfig: { findUnique: async () => CONFIG_ROW }, $transaction: async (fn) => fn(prisma) };
const MOCKS = {
  "@/lib/db": { prisma }, "@/lib/xrpl/outbox": { enqueueTx: async () => ({}), drainOutbox: async () => ({ processed: 0 }), hotWalletAddress: () => "rHOT" },
  "@/lib/xrpl/client": { xrplRead: async () => ({ result: {} }) }, "@/lib/xrpl/config": { ISSUER_ADDRESS: "rISS" },
  "@/lib/launch/xrpl-pay": { newDestTag: () => 1000 + db.entries.length, verifyXrpPayment: async () => ({ ok: true, amount: 5, sender: "rX" }) },
};
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) { if (MOCKS[request]) return "mock:" + request; if (request.startsWith("@/")) return origResolve.call(this, path.join(PROJ, "src", request.slice(2)), parent, ...rest); return origResolve.call(this, request, parent, ...rest); };
const origLoad = Module._load;
Module._load = function (request, parent, isMain) { if (MOCKS[request]) return MOCKS[request]; return origLoad.call(this, request, parent, isMain); };
for (const ext of [".ts", ".tsx"]) Module._extensions[ext] = (m, filename) => { const out = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, fileName: filename }); m._compile(out.outputText, filename); };
process.env.SESSION_SECRET = "x";
const raffle = require(path.join(PROJ, "src/lib/raffle.ts"));
const H = (c) => c.repeat(64);
const min = (n) => new Date(Date.now() + n * 60_000).toISOString();
(async () => {
  CONFIG_ROW = { value: { maxEntries: 2, open: min(-60), close: min(60) } };
  for (const w of ["rA", "rB", "rC"]) assert.ok((await raffle.createRaffleEntry(w)).ok, "create " + w);
  const a = await raffle.verifyRaffleEntry("rA", H("A"), "http://x"); assert.ok(a.ok && a.entry.entryNo === 1 && a.entry.status === "PAID", "A #1");
  const b = await raffle.verifyRaffleEntry("rB", H("B"), "http://x"); assert.ok(b.ok && b.entry.entryNo === 2, "B #2");
  const c = await raffle.verifyRaffleEntry("rC", H("C"), "http://x");
  assert.ok(!c.ok && c.pending === false && /환불/.test(c.error), "C rejected with refund notice: " + JSON.stringify(c));
  const rowC = db.entries.find((r) => r.wallet === "rC"); assert.strictEqual(rowC.status, "OVERFLOW"); assert.strictEqual(rowC.txHash, H("C")); assert.strictEqual(rowC.entryNo, null);
  const c2 = await raffle.verifyRaffleEntry("rC", H("C"), "http://x"); assert.ok(!c2.ok && /환불/.test(c2.error), "C idempotent"); assert.strictEqual(rowC.status, "OVERFLOW");
  const a2 = await raffle.verifyRaffleEntry("rA", H("A"), "http://x"); assert.ok(a2.ok && a2.already === true, "A already");
  const d = await raffle.createRaffleEntry("rD"); assert.ok(!d.ok && /정원/.test(d.error), "D cannot start when sold out");
  const st = await raffle.raffleState("rC"); assert.strictEqual(st.count, 2); assert.strictEqual(st.phase, "SOLD_OUT"); assert.strictEqual(st.mine.status, "OVERFLOW");
  console.log("1-2) capacity: A#1 B#2, C→OVERFLOW(hash kept), idempotent, A already, D blocked, count=2 SOLD_OUT  ✓");

  CONFIG_ROW = { value: { maxEntries: 100, open: min(-60), close: min(60) } };
  for (const w of ["rE", "rF", "rG"]) assert.ok((await raffle.createRaffleEntry(w)).ok, "create " + w);
  CONFIG_ROW = { value: { maxEntries: 100, open: min(-60), close: min(-5) } };
  const e = await raffle.verifyRaffleEntry("rE", H("E"), "http://x"); assert.ok(e.ok && e.entry.entryNo === 3, "E within 10-min grace → PAID #3: " + JSON.stringify(e));
  CONFIG_ROW = { value: { maxEntries: 100, open: min(-60), close: min(-11) } };
  const f = await raffle.verifyRaffleEntry("rF", H("F"), "http://x"); assert.ok(!f.ok && /환불/.test(f.error), "F after grace → OVERFLOW");
  assert.strictEqual(db.entries.find((r) => r.wallet === "rF").status, "OVERFLOW");
  console.log("3) close grace: -5min → PAID, -11min → OVERFLOW  ✓");

  CONFIG_ROW = { value: { maxEntries: 100, open: min(-60), close: min(60) } };
  const g = await raffle.verifyRaffleEntry("rG", H("A"), "http://x"); assert.ok(!g.ok && /다른 응모/.test(g.error), "G reusing A's hash rejected");
  console.log("4) duplicate hash rejected  ✓");
  const st2 = await raffle.raffleState(null); assert.strictEqual(st2.count, 3); assert.strictEqual(st2.phase, "OPEN");
  console.log("5) count = PAID only (3), OVERFLOW rows not counted  ✓");
  console.log("ALL PASS");
})().catch((err) => { console.error("FAIL", err); process.exit(1); });
