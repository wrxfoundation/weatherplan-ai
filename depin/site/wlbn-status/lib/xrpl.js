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
    if (w > 0 && q > 0) {
      S.pools[key] = { w, q, fee: Number(res.amm.trading_fee || 0) / 100000, lpCur: res.amm.lp_token && res.amm.lp_token.currency };
      if (key === 'R') S.pR = q / w; else S.pX = q / w;
    }
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

// 판매 대금 기록: 지급 계정(operations)의 거래 내역을 본 상태가 온 원장까지 이어 받는다.
async function updateFund(S, opts) {
  opts = opts || {};
  if (!S.fund) S.fund = core.newFund();
  const rpc = makeRpc(opts.fetchImpl || fetch), t0 = Date.now(), budget = opts.budgetMs || 10000, L = S.ledger, F = S.fund;
  if (!(L > F.ledger)) return { changed: false, ledger: F.ledger, fetched: 0, complete: true };
  let marker, items = [], complete = true, pages = 0;
  for (;;) {
    const p = { account: C.OPS, ledger_index_min: F.ledger + 1, ledger_index_max: L, limit: 400, forward: true, api_version: 1 };
    if (marker) p.marker = marker;
    const res = await rpc('account_tx', p, 20000);
    for (const t of res.transactions || []) items.push(t);
    marker = res.marker; pages++;
    if (!marker) break;
    if (Date.now() - t0 > budget) { complete = false; break; }
  }
  let upto = L;
  if (!complete) {
    let last = 0;
    for (const t of items) { const n = core.normalize(t); if (n && n.li > last) last = n.li; }
    upto = last - 1;
    if (!(upto > F.ledger)) return { changed: false, ledger: F.ledger, fetched: 0, complete: false, pages };
    items = items.filter((t) => { const n = core.normalize(t); return n && n.li <= upto; });
  }
  const n = core.applyFundBatch(S, items);
  F.ledger = upto;
  return { changed: true, ledger: F.ledger, fetched: n, complete, pages };
}

// 지금 값: 풀 지분 증표를 누가 들고 있는지, 회사 표시 계정의 RLUSD · XRP 잔액. 못 받은 것은 지난 값을 그대로 둔다.
async function fetchLive(S, opts) {
  opts = opts || {};
  const rpc = makeRpc(opts.fetchImpl || fetch), L = S.ledger, budget = opts.budgetMs || 9000;
  const lp = {}, bal = {}, tasks = [];
  for (const [key, acct] of [['R', C.AMM_R], ['X', C.AMM_X]]) {
    tasks.push((async () => {
      const cur = S.pools[key] && S.pools[key].lpCur, holders = {};
      let total = 0, marker, pages = 0;
      do {
        const p = { account: acct, ledger_index: L, limit: 400 };
        if (marker) p.marker = marker;
        const res = await rpc('account_lines', p, 8000);
        for (const ln of res.lines || []) {
          if (cur ? ln.currency !== cur : !/^03/.test(ln.currency)) continue;
          const v = -Number(ln.balance);
          if (v > 0) { holders[ln.account] = v; total += v; }
        }
        marker = res.marker; pages++;
      } while (marker && pages < 8);
      if (!marker && total > 0) lp[key] = { total, holders };
    })().catch(() => {}));
  }
  for (const a of Object.keys(S.labels)) {
    if (a === C.ISSUER || S.amms[a]) continue;
    tasks.push((async () => {
      const [info, lines] = await Promise.all([
        rpc('account_info', { account: a, ledger_index: L }, 8000),
        rpc('account_lines', { account: a, peer: C.RL_ISSUER, ledger_index: L }, 8000),
      ]);
      const ln = (lines.lines || []).find((x) => x.currency === C.RL);
      bal[a] = { xrp: Number(info.account_data.Balance) / 1e6, rlusd: ln ? Number(ln.balance) : 0 };
    })().catch(() => {}));
  }
  // 잠금 해제 일정: 에스크로를 든 계정(상태의 잠금 합계가 남은 곳)의 에스크로 목록. 20시간 안에 받은 것이 있으면 건너뛴다(하루 한 번이면 충분하다)
  //   줄 = [받는 곳, 조건 여부(0/1), 풀리는 시각(리플 초 · 없으면 0), 취소할 수 있는 시각, 수량] — 정리는 lib/core.js 의 buildUnlock 이 한다
  const prev = S.live || {}; let esc = null;
  const escSum = {}; for (const P of [S.st && S.st.before, S.st && S.st.now]) for (const a of Object.keys((P && P.esc) || {})) escSum[a] = (escSum[a] || 0) + P.esc[a];
  const escOwners = Object.keys(escSum).filter((a) => escSum[a] > 1);
  if (escOwners.length && !(prev.esc && S.asof - prev.esc.at < 72000 && !opts.forceEsc)) {
    tasks.push((async () => {
      const rows = [];
      for (const a of escOwners) {
        let marker, pages = 0;
        do {
          const res = await rpc('account_objects', Object.assign({ account: a, type: 'escrow', ledger_index: L, limit: 400 }, marker ? { marker } : {}), 8000);
          for (const o of res.account_objects || []) {
            const am = o.Amount; if (!am || typeof am !== 'object' || am.currency !== C.WL || am.issuer !== C.ISSUER) continue;
            rows.push([o.Destination, o.Condition ? 1 : 0, o.FinishAfter || 0, o.CancelAfter || 0, Number(am.value)]);
          }
          marker = res.marker; pages++;
        } while (marker && pages < 6);
        if (marker) return;                     // 다 못 읽었으면 지난 값을 그대로 둔다
      }
      if (rows.length) esc = { at: S.asof, ledger: L, rows };
    })().catch(() => {}));
  }
  await Promise.race([Promise.all(tasks), new Promise((r) => setTimeout(r, budget))]);
  S.live = { at: S.asof, lp: Object.assign({}, prev.lp, lp), bal: Object.assign({}, prev.bal, bal) };
  if (esc || prev.esc) S.live.esc = esc || prev.esc;
  return { pools: Object.keys(lp).length, accounts: Object.keys(bal).length, escrows: esc ? esc.rows.length : 0 };
}

module.exports = { update, updateFund, makeRpc, resyncPools, fetchLive };
