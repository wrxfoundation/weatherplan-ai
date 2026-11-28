'use strict';
// 상품판 결제 — RLUSD(XRP Ledger)로 받는다. 회원 · 주문 기록을 서버에 두지 않는다.
//   주문 = 서버가 서명한 글(요금제 · 기간 · 금액 · 태그 · 만든 때). 화면이 간직했다가 확인을 청할 때 내민다
//   확인 = 받는 주소의 원장 기록에서 「그 태그 · 그 금액 이상 · RLUSD」 입금을 찾는다 → 찾으면 이용권을 만들어 준다
//          끝나는 때 = 입금 시각 + 기간. 그래서 몇 번을 물어도 같은 이용권이 나온다(서버가 「이미 줬다」를 기억할 필요가 없다)
//   태그는 원장에 공개되지만, 그 태그가 든 서명 주문 없이는 확인을 청할 수 없다 — 원장을 지켜보는 사람이 남의 입금으로 이용권을 받지 못한다
//   받은 양은 거래의 Amount 가 아니라 실제로 들어온 양(meta.delivered_amount)으로 본다 — 부분 결제(tfPartialPayment)로 적게 보내고 많이 보낸 척하는 것을 막는다
//   데모(WATCH_PAY_DEMO=1): 보내지 않아도 「보낸 것으로 치기」로 30분짜리 이용권이 나온다. 실제 운영에서는 끈다(켜 두면 누구나 무료로 연다)
const crypto = require('crypto');
const edition = require('./edition');
const { C } = require('./core');
const { makeRpc } = require('./xrpl');

const ORDER_DAYS = 40;            // 주문으로 확인을 청할 수 있는 기간(그 뒤에는 새 주문을 만든다 — 값이 바뀌었을 수 있다)
const DEMO_SECONDS = 30 * 60;     // 데모 결제로 나오는 이용권의 길이
const PAY_WINDOW = 24 * 3600;     // 주문을 만든 뒤 이 안에 보낸 입금만 인정한다(얼리버드 마지막 날 만든 주문으로 한참 뒤에 내는 것을 막는다)
const SKEW = 600;                 // 주문을 만든 시각보다 이만큼 앞선 입금까지 본다(시계 차이)
const RIPPLE_EPOCH = 946684800;

// 주문 서명 열쇠: 이용권 서명 열쇠에서 갈라 낸다 — 주문 글을 이용권으로, 이용권을 주문으로 내밀 수 없다
const orderKey = () => { const s = process.env.WATCH_SECRET || ''; return s ? crypto.createHmac('sha256', s).update('wlbn-watch-order').digest() : null; };
function signOrder(o) {
  const k = orderKey(); if (!k) throw new Error('WATCH_SECRET 이 없다');
  const body = Buffer.from(JSON.stringify(o)).toString('base64url');
  return body + '.' + crypto.createHmac('sha256', k).update(body).digest('base64url');
}
function readOrder(blob, nowSec) {
  const k = orderKey(); if (!k || typeof blob !== 'string' || !blob || blob.length > 600) return { state: 'bad' };
  const i = blob.lastIndexOf('.'); if (i < 1) return { state: 'bad' };
  const body = blob.slice(0, i), mac = Buffer.from(blob.slice(i + 1)), want = Buffer.from(crypto.createHmac('sha256', k).update(body).digest('base64url'));
  if (mac.length !== want.length || !crypto.timingSafeEqual(mac, want)) return { state: 'bad' };
  let o; try { o = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (e) { return { state: 'bad' }; }
  if (!o || o.o !== 1 || !edition.TERMS[o.t] || !(o.a > 0) || !(o.g > 0) || !(o.i > 0) || edition.RANK[o.p] === undefined || o.p === 'free') return { state: 'bad' };
  if ((nowSec || Math.floor(Date.now() / 1000)) - o.i > ORDER_DAYS * 86400) return { state: 'old' };
  return { state: 'ok', o };
}
const money = (cents) => (cents / 100).toFixed(2);

// 주문 만들기 → 화면에 보여 줄 것(받는 주소 · 태그 · 금액)과 서명한 주문 글
function order(plan, term, nowSec) {
  const now = nowSec || Math.floor(Date.now() / 1000), pr = edition.price(plan, term, now); if (!pr || !edition.payOn()) return null;
  const pl = edition.PLANS.find((p) => p.key === plan), cents = pr.cents;
  const o = { o: 1, p: plan, t: term, a: cents, g: crypto.randomInt(100000000, 1000000000), i: now };      // 태그는 아홉 자리(읽고 옮겨 적기 쉽게) — 서버가 정한다
  if (pr.early) o.e = 1;
  return {
    order: signOrder(o), plan, plan_name: pl.name, term, term_name: edition.TERMS[term].name, days: edition.TERMS[term].days,
    amount: money(cents), list: money(pr.list), early: pr.early, currency: 'RLUSD', issuer: C.RL_ISSUER, to: edition.payAddr(), tag: o.g,
    pay_by: now + PAY_WINDOW, live: !!edition.payAddr(), demo: edition.payDemo(),
  };
}

// 원장의 거래 하나를 읽는다 → RLUSD 입금이면 { hash, from, to, tag, at(유닉스 초), cents }, 아니면 null
function parse(t) {
  const tx = t && (t.tx || t.tx_json), meta = t && t.meta;
  if (!tx || !meta || typeof meta !== 'object' || t.validated !== true) return null;
  if (tx.TransactionType !== 'Payment' || meta.TransactionResult !== 'tesSUCCESS' || tx.Account === tx.Destination) return null;
  const d = meta.delivered_amount;
  if (!d || typeof d !== 'object' || d.currency !== C.RL || d.issuer !== C.RL_ISSUER) return null;      // XRP · 다른 토큰 · 같은 이름을 쓴 다른 발행자의 토큰은 아니다
  const v = Number(d.value); if (!(v > 0)) return null;
  return { hash: tx.hash || t.hash || '', from: tx.Account, to: tx.Destination, tag: typeof tx.DestinationTag === 'number' ? tx.DestinationTag : null, at: (tx.date || 0) + RIPPLE_EPOCH, cents: Math.floor(v * 100 + 1e-6) };
}
// 받는 주소의 최근 기록에서 그 주문의 입금을 찾는다(새것부터 훑고, 주문보다 오래된 거래가 나오면 멈춘다). 여럿이면 가장 이른 것 — 이용권이 늘 같게
async function findPayment(rpc, q) {
  let marker, hit = null;
  for (let page = 0; page < 5; page++) {
    const p = { account: q.to, ledger_index_min: -1, ledger_index_max: -1, limit: 200, forward: false, api_version: 1 };
    if (marker) p.marker = marker;
    const res = await rpc('account_tx', p, 9000);
    let older = false;
    for (const t of res.transactions || []) {
      const tx = t && (t.tx || t.tx_json);
      if (tx && tx.date && tx.date + RIPPLE_EPOCH < q.since) { older = true; continue; }
      const x = parse(t);
      if (x && x.to === q.to && x.tag === q.tag && x.cents >= q.cents && (!q.until || x.at <= q.until)) hit = x;
    }
    marker = res.marker;
    if (!marker || older) break;
  }
  return hit;
}

let rpcImpl = null;                                  // 점검에서 가짜 원장을 끼울 자리
const ledger = () => rpcImpl || makeRpc(fetch);
function paid(o, at, extra) {
  const exp = at + edition.TERMS[o.t].days * 86400;
  return Object.assign({ ok: true, paid: true, plan: o.p, token: edition.sign({ p: o.p, x: exp, n: 'rlusd' }, process.env.WATCH_SECRET), exp_at: exp }, extra);
}
// 입금 확인
async function check(blob, nowSec) {
  const r = readOrder(blob, nowSec); if (r.state !== 'ok') return { ok: false, error: r.state };
  const to = edition.payAddr(); if (!to) return { ok: true, paid: false, live: false };      // 받는 주소가 없는 데모: 원장을 보지 않는다
  const hit = await findPayment(ledger(), { to, tag: r.o.g, cents: r.o.a, since: r.o.i - SKEW, until: r.o.i + PAY_WINDOW });
  if (!hit) return { ok: true, paid: false, live: true };
  return paid(r.o, hit.at, { live: true, tx: hit.hash, got: money(hit.cents) });
}
// 데모 결제: 보낸 것으로 치고 30분짜리 이용권을 준다(WATCH_PAY_DEMO=1 일 때만)
function demoPay(blob, nowSec) {
  if (!edition.payDemo()) return { ok: false, error: 'off' };
  const r = readOrder(blob, nowSec); if (r.state !== 'ok') return { ok: false, error: r.state };
  const exp = (nowSec || Math.floor(Date.now() / 1000)) + DEMO_SECONDS;
  return { ok: true, paid: true, demo: true, plan: r.o.p, token: edition.sign({ p: r.o.p, x: exp, n: 'demo' }, process.env.WATCH_SECRET), exp_at: exp };
}
module.exports = { order, check, demoPay, readOrder, parse, findPayment, money, DEMO_SECONDS, PAY_WINDOW, _setLedger: (fn) => { rpcImpl = fn; } };
