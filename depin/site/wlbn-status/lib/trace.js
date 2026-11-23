'use strict';
// 부정 쪽(부담) 지갑의 자금 흐름 추적에 쓸 계정 내역을 받아 둔다(11/23 15차 — 서우 「부정적 지갑은 2-3depth 로 자금 이동 흐름 추적」 「유입되기 전 주소나 전단계」).
//   · 부정 쪽 지갑(0단계)마다: 풀이 열린 뒤 보낸 송금 · 받은 송금, 계정을 만든(처음 채운) 송금
//   · 처음 채운 곳 · 돈을 보내 준 곳(-1단계): 거래가 많은 계정인지만 본다(한 쪽만 읽는다)
//   · 그 지갑이 보낸 곳(1단계) → 그곳이 다시 보낸 곳(2단계)의 송금까지 받는다. 화면이 보여 주는 3단계의 끝은 2단계 계정이 보낸 곳이다
//   · 하루 한 번만 새로 받는다(S.trace.day — 한국 날짜). 시간이 모자라면 남은 계정을 다음 호출에서 이어 받는다(S.trace.job)
// 읽기만 한다(account_tx). 정리 · 분류는 lib/core.js 의 buildTrace 가 한다.
const core = require('./core');
const xrpl = require('./xrpl');
const C = core.C, T = core.TRACE;
const EPOCH = 946684800;

function amt(a) {
  if (typeof a === 'string') return { cur: 'XRP', v: Number(a) / 1e6 };
  if (a && a.currency === C.RL && a.issuer === C.RL_ISSUER) return { cur: 'RL', v: Number(a.value) };
  if (a && a.currency === C.WL && a.issuer === C.ISSUER) return { cur: 'WL', v: Number(a.value) };
  return null;                                   // 그 밖의 토큰은 값을 매길 수 없어 세지 않는다
}
const r2 = (x) => Math.round(x * 100) / 100;
// 값이 큰 순으로 keep 개만 남긴다(상태가 불어나지 않게). 전체 합은 tot 에 따로 둔다
function trim(map, keep) {
  const out = {};
  Object.keys(map).sort((a, b) => map[b][0] - map[a][0]).slice(0, keep).forEach((k) => { out[k] = map[k].map(r2); });
  return out;
}
const delivered = (tx, meta) => (meta.delivered_amount !== undefined ? meta.delivered_amount : (tx.Amount !== undefined ? tx.Amount : tx.DeliverMax));
// 계정 하나: 풀이 열린 뒤의 송금을 보낸 곳 · 받은 곳별로 더한다
//   out[받는 곳] = [RLUSD 환산, 건수, 목적지 태그가 붙은 건수, XRP, RLUSD, WLBN] · in[보낸 곳] = [RLUSD 환산, 건수, XRP, RLUSD, WLBN]
//   tot = [보낸 돈 합(환산), 보낸 건수, 받은 돈 합(환산), 받은 건수] — 잘라 내기 전 전체
async function fetchNode(rpc, acct, depth, xr, price) {
  const fromSec = Date.parse(C.NOW_FROM + 'T00:00:00+09:00') / 1000 - EPOCH, maxPages = depth < 0 ? 1 : (T.pages[depth] || 2);
  const node = { d: depth, n: 0, more: false, out: {}, in: {}, tot: [0, 0, 0, 0], first: null };
  let marker = null, pages = 0;
  do {
    const res = await rpc('account_tx', Object.assign({ account: acct, ledger_index_min: -1, ledger_index_max: -1, limit: 200, forward: false }, marker ? { marker } : {}), 12000);
    pages += 1; let old = false;
    for (const t of res.transactions || []) {
      const tx = t.tx || t.tx_json || {}, meta = t.meta || {};
      if ((tx.date || 0) < fromSec) { old = true; break; }
      node.n += 1;
      if (depth < 0) continue;                   // 처음 채운 곳은 거래 수만 센다
      if (meta.TransactionResult !== 'tesSUCCESS' || tx.TransactionType !== 'Payment' || !tx.Destination || tx.Destination === tx.Account) continue;
      const a = amt(delivered(tx, meta)); if (!a || !(a.v > 0)) continue;
      const eq = a.cur === 'XRP' ? a.v * xr : a.cur === 'RL' ? a.v : a.v * price, ci = a.cur === 'XRP' ? 0 : a.cur === 'RL' ? 1 : 2;
      if (tx.Account === acct) { const o = node.out[tx.Destination] || (node.out[tx.Destination] = [0, 0, 0, 0, 0, 0]); o[0] += eq; o[1] += 1; if (tx.DestinationTag !== undefined) o[2] += 1; o[3 + ci] += a.v; node.tot[0] += eq; node.tot[1] += 1; }
      else if (tx.Destination === acct) { const o = node.in[tx.Account] || (node.in[tx.Account] = [0, 0, 0, 0, 0]); o[0] += eq; o[1] += 1; o[2 + ci] += a.v; node.tot[2] += eq; node.tot[3] += 1; }
    }
    marker = old ? null : (res.marker || null);
  } while (marker && pages < maxPages);
  node.more = !!marker;                          // 거래가 많아 다 못 읽었다 = 거래소 · 서비스 계정으로 본다
  node.out = trim(node.out, T.keep); node.in = trim(node.in, T.keep); node.tot = node.tot.map(r2);
  if (depth === 0) {                             // 계정을 만든 송금: 맨 처음 거래에서 이 계정이 「새로 생긴」 것만 인정한다(노드에 옛 기록이 없으면 비워 둔다)
    try {
      const f = await rpc('account_tx', { account: acct, ledger_index_min: -1, ledger_index_max: -1, limit: 2, forward: true }, 10000);
      for (const t of f.transactions || []) {
        const tx = t.tx || t.tx_json || {}, meta = t.meta || {};
        if (tx.TransactionType !== 'Payment' || tx.Destination !== acct || meta.TransactionResult !== 'tesSUCCESS') continue;
        const born = (meta.AffectedNodes || []).some((x) => x.CreatedNode && x.CreatedNode.LedgerEntryType === 'AccountRoot' && x.CreatedNode.NewFields && x.CreatedNode.NewFields.Account === acct);
        if (!born) continue;
        const a = amt(delivered(tx, meta));
        node.first = [tx.Account, a && a.cur === 'XRP' ? r2(a.v) : 0, core.kday(tx.date || 0)]; break;
      }
    } catch (e) { /* 처음 채운 곳을 모르는 채로 둔다 */ }
  }
  return node;
}

// 하루 한 번: 부정 쪽 지갑에서 시작해 단계별로 받는다. budgetMs 안에서 하는 만큼 하고 남은 것은 다음 호출이 잇는다
//   opts.start === false 이면 새 날의 일을 시작하지 않고, 하다 만 일만 잇는다 · opts.force 는 오늘 받았어도 처음부터 다시 받는다
async function update(S, opts) {
  opts = opts || {};
  const budget = opts.budgetMs || 8000, t0 = Date.now(), today = core.kday(Math.floor(Date.now() / 1000) - EPOCH);
  const tr = S.trace || (S.trace = { v: 1, day: '', at: 0, roots: [], nodes: {}, job: null });
  if (opts.force) { tr.day = ''; tr.job = null; }     // 배포용 자료를 만들 때: 오늘 받았어도 처음부터 다시
  if (tr.day === today && !tr.job) return { changed: false, done: true, fetched: 0 };
  if (!tr.job || tr.job.day !== today) {
    if (opts.start === false && !tr.job) return { changed: false, done: false, fetched: 0, waiting: true };
    const roots = core.traceRoots(S);
    if (!roots.length) { tr.day = today; tr.at = Date.now(); tr.roots = []; tr.nodes = {}; tr.job = null; return { changed: true, done: true, fetched: 0 }; }
    tr.job = { day: today, roots, nodes: {}, queue: roots.map((a) => [a, 0]), seen: roots.slice(), cnt: [roots.length, 0, 0], fseen: [] };
  }
  const job = tr.job, rpc = xrpl.makeRpc(opts.fetchImpl || fetch), xr = S.pX > 0 ? S.pR / S.pX : 0, price = S.pR || 0;
  const skip = (a) => a === C.ISSUER || !!S.labels[a] || !!(S.amms && S.amms[a]);          // 회사 표시 계정 · 풀 · 발행 계정은 따라가지 않는다
  let fetched = 0, failed = 0;
  while (job.queue.length && Date.now() - t0 < budget) {
    const batch = job.queue.splice(0, T.conc).filter((q) => !(q[1] < 0 && job.nodes[q[0]]));      // 처음 채운 곳이 이미 행선지로 읽혔으면 다시 읽지 않는다
    const got = await Promise.all(batch.map((q) => fetchNode(rpc, q[0], q[1], xr, price).then((n) => [q[0], q[1], n], () => [q[0], q[1], null])));
    for (const g of got) {
      const a = g[0], d = g[1], n = g[2]; fetched += 1;
      if (d < 0 && job.nodes[a] && job.nodes[a].d >= 0) continue;
      if (!n) { failed += 1; job.nodes[a] = { d, n: 0, more: false, out: {}, in: {}, tot: [0, 0, 0, 0], first: null, err: 1 }; continue; }
      job.nodes[a] = n;
      if (d === 0) {                               // 유입 전 단계: 계정을 만든 곳과 돈을 보내 준 곳이 「거래가 많은 계정」인지만 살핀다
        const cand = n.first ? [n.first[0]] : [];
        for (const b of Object.keys(n.in)) if (n.in[b][0] >= T.inMin) cand.push(b);
        for (const b of cand) if (!skip(b) && job.roots.indexOf(b) < 0 && job.fseen.indexOf(b) < 0 && job.fseen.length < T.funders) { job.fseen.push(b); job.queue.push([b, -1]); }
      }
      if (d < 0 || d + 1 >= T.depth || n.more) continue;
      for (const to of Object.keys(n.out)) {       // 값이 큰 순(trim 이 정렬해 둔다). 태그가 붙은 곳(거래소 입금 꼴)은 거기서 끝
        const o = n.out[to];
        if (o[0] < T.min || o[2] > 0 || skip(to) || job.seen.indexOf(to) >= 0) continue;
        if (job.cnt[d + 1] >= T.caps[d + 1]) break;
        job.seen.push(to); job.cnt[d + 1] += 1; job.queue.push([to, d + 1]);
      }
    }
  }
  const done = !job.queue.length;
  if (done) { tr.nodes = job.nodes; tr.roots = job.roots; tr.day = today; tr.at = Date.now(); tr.xr = Math.round(xr * 1e4) / 1e4; tr.price = Math.round(price * 1e4) / 1e4; tr.job = null; }
  return { changed: fetched > 0, done, fetched, failed, left: done ? 0 : job.queue.length };
}

module.exports = { update, fetchNode };
