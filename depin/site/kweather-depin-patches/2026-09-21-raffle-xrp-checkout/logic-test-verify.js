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
  if (v && typeof v === "object") {
    if ("in" in v) return v.in.includes(row[k]);
    if ("not" in v) return row[k] !== v.not;
    if ("gt" in v) return row[k] > v.gt;
  }
  return row[k] === v;
});
const raffleEntry = {
  findUnique: async ({ where }) => db.entries.find((r) => match(r, where)) ?? null,
  findUniqueOrThrow: async ({ where }) => { const r = db.entries.find((r) => match(r, where)); if (!r) throw new Error("not found"); return r; },
  count: async ({ where }) => db.entries.filter((r) => match(r, where)).length,
  aggregate: async ({ where }) => { const ns = db.entries.filter((r) => match(r, where)).map((r) => r.entryNo ?? 0); return { _max: { entryNo: ns.length ? Math.max(...ns) : null } }; },
  update: async ({ where, data }) => { const r = db.entries.find((r) => match(r, where)); if (!r) throw new Error("not found"); Object.assign(r, data); return r; },
  updateMany: async ({ where, data }) => { const rows = db.entries.filter((r) => match(r, where)); rows.forEach((r) => Object.assign(r, data)); return { count: rows.length }; },
  create: async ({ data }) => { const r = { id: "e" + (db.entries.length + 1), status: "PENDING", entryNo: null, txHash: null, ticketCode: null, prize: null, redeemedAt: null, paidAt: null, createdAt: new Date(), ...data }; db.entries.push(r); return r; },
};
const genesisPass = { upsert: async ({ where, create }) => { let p = db.passes.find((r) => match(r, where)); if (!p) { p = { id: "p" + (db.passes.length + 1), mintTxId: null, ...create }; db.passes.push(p); } return p; }, findUnique: async ({ where }) => db.passes.find((r) => match(r, where)) ?? null };
db.contacts = {};
const prisma = { raffleEntry, genesisPass, xrplTransaction: { findFirst: async () => null }, adminConfig: { findUnique: async () => CONFIG_ROW }, $transaction: async (fn) => fn(prisma), $executeRaw: async () => 0,
  accountContact: { upsert: async ({ where, create }) => { db.contacts[where.address] = create.email; return create; } } };
const reset = () => { db.entries.length = 0; db.passes.length = 0; db.contacts = {}; };
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
  /* 1-2) 정원 3(확정 + 유효 예약): A·B·C 예약 → D 시작 불가 → A #1 · B #2 → C 예약 만료 → D 예약(자리 인계) → C 입금은 OVERFLOW(해시 보존) */
  CONFIG_ROW = { value: { maxEntries: 3, holdMinutes: 30, open: min(-60), close: min(60) } };
  for (const w of ["rA", "rB", "rC"]) assert.ok((await raffle.createRaffleEntry(w)).ok, "create " + w);
  const d0 = await raffle.createRaffleEntry("rD"); assert.ok(!d0.ok && d0.code === "SOLD_OUT", "D cannot start: 3 holds = capacity");
  const a = await raffle.verifyRaffleEntry("rA", H("A"), "http://x"); assert.ok(a.ok && a.entry.entryNo === 1 && a.entry.status === "PAID", "A #1");
  const b = await raffle.verifyRaffleEntry("rB", H("B"), "http://x"); assert.ok(b.ok && b.entry.entryNo === 2, "B #2");
  db.entries.find((r) => r.wallet === "rC").createdAt = new Date(Date.now() - 31 * 60_000);   // C 예약 만료
  assert.ok((await raffle.createRaffleEntry("rD")).ok, "D takes C's expired slot");
  const c = await raffle.verifyRaffleEntry("rC", H("C"), "http://x");
  assert.ok(!c.ok && c.pending === false && /환불/.test(c.error), "C rejected with refund notice: " + JSON.stringify(c));
  const rowC = db.entries.find((r) => r.wallet === "rC"); assert.strictEqual(rowC.status, "OVERFLOW"); assert.strictEqual(rowC.txHash, H("C")); assert.strictEqual(rowC.entryNo, null);
  const c2 = await raffle.verifyRaffleEntry("rC", H("C"), "http://x"); assert.ok(!c2.ok && /환불/.test(c2.error), "C idempotent"); assert.strictEqual(rowC.status, "OVERFLOW");
  const a2 = await raffle.verifyRaffleEntry("rA", H("A"), "http://x"); assert.ok(a2.ok && a2.already === true, "A already");
  const st = await raffle.raffleState("rC"); assert.strictEqual(st.count, 2); assert.strictEqual(st.holds, 1); assert.strictEqual(st.phase, "SOLD_OUT"); assert.strictEqual(st.mine.status, "OVERFLOW");
  console.log("1-2) capacity 3: A,B,C hold → D blocked; A#1 B#2; C expired → D holds; C pays → OVERFLOW(hash kept), idempotent; A already; count 2 / holds 1 SOLD_OUT  ✓");

  CONFIG_ROW = { value: { maxEntries: 100, holdMinutes: 30, open: min(-60), close: min(60) } };
  for (const w of ["rE", "rF", "rG"]) assert.ok((await raffle.createRaffleEntry(w)).ok, "create " + w);
  CONFIG_ROW = { value: { maxEntries: 100, holdMinutes: 30, open: min(-60), close: min(-5) } };
  const e = await raffle.verifyRaffleEntry("rE", H("E"), "http://x"); assert.ok(e.ok && e.entry.entryNo === 3, "E within 10-min grace → PAID #3: " + JSON.stringify(e));
  CONFIG_ROW = { value: { maxEntries: 100, holdMinutes: 30, open: min(-60), close: min(-11) } };
  const f = await raffle.verifyRaffleEntry("rF", H("F"), "http://x"); assert.ok(!f.ok && /환불/.test(f.error), "F after grace → OVERFLOW");
  assert.strictEqual(db.entries.find((r) => r.wallet === "rF").status, "OVERFLOW");
  console.log("3) close grace: -5min → PAID, -11min → OVERFLOW  ✓");

  CONFIG_ROW = { value: { maxEntries: 100, holdMinutes: 30, open: min(-60), close: min(60) } };
  const g = await raffle.verifyRaffleEntry("rG", H("A"), "http://x"); assert.ok(!g.ok && /다른 응모/.test(g.error), "G reusing A's hash rejected");
  console.log("4) duplicate hash rejected  ✓");
  const st2 = await raffle.raffleState(null); assert.strictEqual(st2.count, 3); assert.strictEqual(st2.phase, "OPEN");
  console.log("5) count = PAID only (3), OVERFLOW rows not counted  ✓");

  /* 6) 예약 정원(2026-09-21 결정: 500 이 되면 결제를 막는다) - 정원 = 확정 + 유효 예약, 예약 만료 30분 */
  reset(); CONFIG_ROW = { value: { maxEntries: 2, holdMinutes: 30, open: min(-60), close: min(60) } };
  const hA = await raffle.createRaffleEntry("rA", "prod", "a@example.com"); assert.ok(hA.ok, "A hold"); assert.strictEqual(db.contacts.rA, "a@example.com", "email saved to contact");
  assert.ok((await raffle.createRaffleEntry("rB")).ok, "B hold");
  const hC = await raffle.createRaffleEntry("rC"); assert.ok(!hC.ok && hC.code === "SOLD_OUT", "C blocked: 2 live holds fill the capacity: " + JSON.stringify(hC));
  let s6 = await raffle.raffleState("rB"); assert.strictEqual(s6.phase, "SOLD_OUT"); assert.strictEqual(s6.count, 0); assert.strictEqual(s6.holds, 2); assert.strictEqual(s6.remaining, 0);
  assert.ok(s6.mine.holdLive && s6.mine.holdUntil, "B hold live with holdUntil");
  console.log("6a) holds count toward capacity: A,B hold → C blocked, phase SOLD_OUT, count 0 / holds 2  ✓");
  db.entries.find((r) => r.wallet === "rA").createdAt = new Date(Date.now() - 31 * 60_000);   // A 예약 만료
  s6 = await raffle.raffleState(null); assert.strictEqual(s6.phase, "OPEN"); assert.strictEqual(s6.holds, 1);
  assert.ok((await raffle.createRaffleEntry("rC")).ok, "C gets A's expired slot");
  const vA = await raffle.verifyRaffleEntry("rA", H("1"), "http://x"); assert.ok(!vA.ok && /환불/.test(vA.error), "A (expired hold) pays while B,C hold → OVERFLOW");
  assert.strictEqual(db.entries.find((r) => r.wallet === "rA").status, "OVERFLOW");
  const renewB = await raffle.createRaffleEntry("rB"); assert.ok(renewB.ok && renewB.entry.status === "PENDING", "B renews own hold (self excluded)");
  const vB = await raffle.verifyRaffleEntry("rB", H("2"), "http://x"); assert.ok(vB.ok && vB.entry.entryNo === 1, "B pays #1");
  const vC = await raffle.verifyRaffleEntry("rC", H("3"), "http://x"); assert.ok(vC.ok && vC.entry.entryNo === 2, "C pays #2");
  const hD = await raffle.createRaffleEntry("rD"); assert.ok(!hD.ok && hD.code === "SOLD_OUT", "D blocked: 2 paid");
  const rA2 = await raffle.createRaffleEntry("rA"); assert.ok(!rA2.ok && rA2.code === "OVERFLOW", "A (overflow) cannot re-enter");
  console.log("6b) expired hold frees the slot; expired payer → OVERFLOW; live holders pay #1 #2; then SOLD_OUT  ✓");
  reset(); CONFIG_ROW = { value: { maxEntries: 3, holdMinutes: 30, open: min(-60), close: min(60) } };
  assert.ok((await raffle.createRaffleEntry("rE")).ok && (await raffle.createRaffleEntry("rF")).ok);
  db.entries.find((r) => r.wallet === "rE").createdAt = new Date(Date.now() - 31 * 60_000);
  const vE = await raffle.verifyRaffleEntry("rE", H("4"), "http://x"); assert.ok(vE.ok && vE.entry.entryNo === 1, "expired hold still confirms when a slot remains");
  console.log("6c) expired hold + free slot → still PAID  ✓");
  console.log("ALL PASS");
})().catch((err) => { console.error("FAIL", err); process.exit(1); });
