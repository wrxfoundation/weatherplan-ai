'use strict';
// 공개 XRPL 노드에서 마지막으로 반영한 원장 이후의 거래만 받아 상태에 더한다.
const core = require('./core');
const C = core.C;
const NODES = (process.env.XRPL_NODES || 'https://s1.ripple.com/,https://s2.ripple.com/,https://xrplcluster.com/').split(',').map((s) => s.trim()).filter(Boolean);

function makeRpc(fetchImpl) {
  return async function rpc(method, params, timeoutMs) {
    let lastErr;
    for (const url of NODES) {
      try {
        const r = await fetchImpl(url, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ method, params: [params] }), signal: AbortSignal.timeout(timeoutMs || 15000),
        });
        const j = await r.json(), res = j && j.result;
        if (!res || res.status !== 'success') throw new Error((res && (res.error_message || res.error)) || 'rpc ' + method + ' failed');
        return res;
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('no XRPL node answered');
  };
}

function amount(a) {
  if (a && typeof a === 'object') return { cur: a.currency, v: Number(a.value) };
  return { cur: 'XRP', v: Number(a) / 1e6 };
}
// 풀에 든 양을 원장 값으로 다시 맞춘다(한쪽 자산만 넣고 뺀 거래는 WLBN 거래 내역에 안 잡히기 때문).
async function resyncPools(S, rpc, ledger) {
  const wl = { currency: C.WL, issuer: C.ISSUER };
  for (const [key, other] of [['R', { currency: C.RL, issuer: C.RL_ISSUER }], ['X', { currency: 'XRP' }]]) {
    const res = await rpc('amm_info', { asset: wl, asset2: other, ledger_index: ledger }, 10000);
    const a = amount(res.amm.amount), b = amount(res.amm.amount2);
    const w = a.cur === C.WL ? a.v : b.v, q = a.cur === C.WL ? b.v : a.v;
    if (w > 0 && q > 0) { S.pools[key] = { w, q }; if (key === 'R') S.pR = q / w; else S.pX = q / w; }
  }
}

async function update(S, opts) {
  opts = opts || {};
  const rpc = makeRpc(opts.fetchImpl || fetch), t0 = Date.now(), budget = opts.budgetMs || 35000;
  const led = await rpc('ledger', { ledger_index: 'validated' }, 10000);
  const L = Number(led.ledger_index || (led.ledger && led.ledger.ledger_index));
  if (!(L > S.ledger)) return { changed: false, ledger: S.ledger, fetched: 0, complete: true };
  let marker, items = [], complete = true, pages = 0;
  for (;;) {
    const p = { account: C.ISSUER, ledger_index_min: S.ledger + 1, ledger_index_max: L, limit: 400, forward: true, api_version: 1 };
    if (marker) p.marker = marker;
    const res = await rpc('account_tx', p, 20000);
    for (const t of res.transactions || []) items.push(t);
    marker = res.marker; pages++;
    if (!marker) break;
    if (Date.now() - t0 > budget) { complete = false; break; }
  }
  let upto = L;
  if (!complete) {
    // 시간 한도에 걸리면 끝까지 받은 원장까지만 반영하고 다음 실행에서 이어 받는다.
    let last = 0;
    for (const t of items) { const n = core.normalize(t); if (n && n.li > last) last = n.li; }
    upto = last - 1;
    if (!(upto > S.ledger)) return { changed: false, ledger: S.ledger, fetched: 0, complete: false, pages };
    items = items.filter((t) => { const n = core.normalize(t); return n && n.li <= upto; });
  }
  const n = core.applyBatch(S, items);
  S.ledger = upto;
  if (complete) { try { await resyncPools(S, rpc, L); } catch (e) { /* 다음 실행에서 다시 맞춘다 */ } }
  return { changed: true, ledger: S.ledger, fetched: n, complete, pages };
}

module.exports = { update, makeRpc, resyncPools };
