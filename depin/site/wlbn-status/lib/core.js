'use strict';
// WLBN 운용현황 — 원장(XRPL)에서 WLBN 이 움직인 거래를 지갑별 흐름으로 쌓고(applyTx), 화면용 표를 만든다(buildDatasets).
// depin/tools/wlbn-cashout/metrics.py 와 같은 규칙이다. 날짜는 한국 시간.
// 지갑의 WLBN 이 줄고 RLUSD · XRP 가 늘면 매도, 반대면 매수. 한 거래 안의 경로 거래(지갑 잔액 불변)는 세지 않는다.

const C = {
  WL: '574C424E00000000000000000000000000000000',
  RL: '524C555344000000000000000000000000000000',
  ISSUER: 'rDJz8WJhsKgydqJzSZXMpsJot3eRmSkR5',
  RL_ISSUER: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
  AMM_R: 'rpd3CDzqNRRkgJBMDwEKvzF4kKisbZLxVW',      // WLBN / RLUSD 풀
  AMM_X: 'rpXbdqWU5RbCycRAcxinyX6cCsRnU5RXgm',      // WLBN / XRP 풀
  OPS: 'rhTTtx8YyKzcmPDsoroYXuHdGMThrnweb1',        // 사이트 표시: operations (지급 계정)
  SWEEP: 'rajm3n7GwwFhvqUAVAWPQnB35njZaJ4y93',      // 10/24 밤 잔액이 모인 주소
  PRIOR_KW: 'rVDBQ8i1HjkkvtVpmCGqaYEmRuvaNevUG',    // 10/24 까지 kweather 물량을 받던 지갑
  NOW_FROM: '2026-10-26',                           // 이 날짜부터 「지금 기간」
  POOL_OPEN: '2026-10-27',                          // 새 풀 두 곳이 열린 날
};
const RIPPLE_EPOCH = 946684800;
const EPS = 1e-7;
const KEYS = ['sold', 'bought', 'cash', 'cash_r', 'cash_x', 'spent', 'spent_r', 'spent_x', 'lpw', 'lpq', 'lpr', 'lpx', 'paid', 'paidco', 'tin', 'tout', 'esc', 'burn'];
const GR = ['user', 'arb', 'other', 'bot', 'kweather', 'company'];
const NAME = {
  user: '일반 사용자 지갑', arb: '사고팔기만 한 지갑', other: '그 밖의 지갑', bot: 'bot 표시 계정',
  kweather: 'kweather 표시 계정', company: '그 밖의 회사 표시 계정', sweep: '10월 24일 잔액이 모인 주소',
};

function kday(sec) { return new Date((sec + RIPPLE_EPOCH + 9 * 3600) * 1000).toISOString().slice(0, 10); }
function kstamp(sec) { return new Date((sec + RIPPLE_EPOCH + 9 * 3600) * 1000).toISOString().slice(0, 16).replace('T', ' '); }
function md(k) { return String(+k.slice(5, 7)) + '/' + String(+k.slice(8, 10)); }
function add(o, k, v) { o[k] = (o[k] || 0) + v; }

function newState() {
  const period = () => { const o = {}; KEYS.forEach((k) => { o[k] = {}; }); return o; };
  return {
    v: 2, ledger: 0, asof: 0, bal: {}, st: { before: period(), now: period() }, lastSell: {}, edges: {}, amms: {}, paidN: {},
    ev: {}, pools: { R: { w: 0, q: 0 }, X: { w: 0, q: 0 } }, eod: {}, eodX: {}, eodPool: {}, pR: 0, pX: 0, labels: {}, ext: {},
  };
}

// 거래 한 건이 지갑마다 바꾼 잔액: [WLBN, RLUSD, XRP(수수료 제외)]
function deltas(tx, meta) {
  const d = new Map(), amms = [];
  const at = (a) => { let v = d.get(a); if (!v) { v = [0, 0, 0]; d.set(a, v); } return v; };
  for (const n of meta.AffectedNodes || []) {
    const kind = Object.keys(n)[0], node = n[kind], t = node.LedgerEntryType;
    const fin = node.FinalFields || node.NewFields || {}, prev = node.PreviousFields || {};
    if (t === 'AccountRoot') {
      const a = fin.Account;
      if (!a) continue;
      if (fin.AMMID) amms.push(a);
      if (kind === 'CreatedNode') at(a)[2] += Number(fin.Balance || 0) / 1e6;
      else if (prev.Balance !== undefined) at(a)[2] += (Number(fin.Balance || 0) - Number(prev.Balance)) / 1e6;
    } else if (t === 'RippleState') {
      const cur = (fin.Balance || {}).currency, lo = (fin.LowLimit || {}).issuer, hi = (fin.HighLimit || {}).issuer;
      let i, iss;
      if (cur === C.WL && (lo === C.ISSUER || hi === C.ISSUER)) { i = 0; iss = C.ISSUER; }
      else if (cur === C.RL && (lo === C.RL_ISSUER || hi === C.RL_ISSUER)) { i = 1; iss = C.RL_ISSUER; }
      else continue;
      let f = Number((fin.Balance || {}).value || 0), p;
      if (kind === 'CreatedNode') p = 0;
      else if (prev.Balance !== undefined) p = Number(prev.Balance.value);
      else continue;
      if (kind === 'DeletedNode') f = 0;
      const holder = lo === iss ? hi : lo;
      at(holder)[i] += (f - p) * (holder === lo ? 1 : -1);
    }
  }
  at(tx.Account)[2] += Number(tx.Fee || 0) / 1e6;
  return { d, amms };
}

// 거래 한 건을 상태에 반영한다. 원장 순서대로 한 번씩만 불러야 한다.
function applyTx(S, tx, meta) {
  if (!meta || meta.TransactionResult !== 'tesSUCCESS') return;
  const { d, amms } = deltas(tx, meta);
  for (const a of amms) S.amms[a] = 1;
  const sec = tx.date, k = kday(sec), per = k >= C.NOW_FROM ? 'now' : 'before', P = S.st[per], ty = tx.TransactionType;
  if (sec > S.asof) S.asof = sec;

  // 풀에 든 양과 가격 (RLUSD 풀: WLBN 1개당 RLUSD, XRP 풀: WLBN 1개당 XRP)
  const dr = d.get(C.AMM_R), dx = d.get(C.AMM_X);
  if (dr) {
    S.pools.R.w += dr[0]; S.pools.R.q += dr[1];
    if (S.pools.R.w > 0 && S.pools.R.q > 0) { S.pR = S.pools.R.q / S.pools.R.w; S.eod[k] = S.pR; }
  }
  if (dx) {
    S.pools.X.w += dx[0]; S.pools.X.q += dx[2] - (tx.Account === C.AMM_X ? Number(tx.Fee || 0) / 1e6 : 0);
    if (S.pools.X.w > 0 && S.pools.X.q > 0) { S.pX = S.pools.X.q / S.pools.X.w; S.eodX[k] = S.pX; }
  }
  if ((dr || dx) && per === 'now') S.eodPool[k] = [Math.round(S.pools.R.w), Math.round(S.pools.R.q), Math.round(S.pools.X.w), Math.round(S.pools.X.q)];
  const rate = per === 'now' && S.pR > 0 && S.pX > 0 ? S.pR / S.pX : 0;   // XRP 1개당 RLUSD

  const mv = [];
  for (const [a, v] of d) if (Math.abs(v[0]) > EPS && a !== C.ISSUER) { mv.push([a, v]); add(S.bal, a, v[0]); }
  if (!mv.length) return;
  // 날짜 · 지갑 · 종류별 합계. sell: [WLBN, 대금 환산, RLUSD 풀로, XRP 풀로, 받은 RLUSD, 받은 XRP]
  // buy: [WLBN, 든 돈 환산, RLUSD 풀에서, XRP 풀에서, 낸 RLUSD, 낸 XRP] · lp: [넣은 WLBN, 받은 대금 환산, 넣은 RLUSD, 넣은 XRP] · paid/paidco: [WLBN]
  const ev = (a, kind, arr) => {
    if (per !== 'now') return;
    const key = k + '|' + a + '|' + kind, e = S.ev[key] || (S.ev[key] = arr.map(() => 0));
    for (let i = 0; i < arr.length; i++) e[i] = (e[i] || 0) + arr[i];
  };

  if (ty.startsWith('AMM')) {
    for (const [a, v] of mv) {
      if (S.amms[a]) continue;
      const q = v[1] + v[2] * rate;
      add(P.lpw, a, -v[0]); add(P.lpq, a, q); add(P.lpr, a, -v[1]); add(P.lpx, a, -v[2]); ev(a, 'lp', [-v[0], q, -v[1], -v[2]]);
    }
    return;
  }
  if (ty.startsWith('Escrow')) { for (const [a, v] of mv) add(P.esc, a, -v[0]); return; }

  let trade = false;
  for (const v of d.values()) {
    if ((v[0] > EPS && (v[2] < -1e-5 || v[1] < -EPS)) || (v[0] < -EPS && (v[2] > 1e-5 || v[1] > EPS))) { trade = true; break; }
  }
  if (!trade) {
    const neg = mv.filter(([, v]) => v[0] < 0), pos = mv.filter(([, v]) => v[0] > 0);
    const src = neg.length === 1 ? neg[0][0] : null;
    if (!pos.length && src && tx.Destination === C.ISSUER) add(P.burn, src, -neg[0][1][0]);
    for (const [a, v] of pos) {
      if (src === C.OPS && !S.labels[a]) { add(P.paid, a, v[0]); add(S.paidN, per + '|' + a, 1); ev(a, 'paid', [v[0]]); }
      else { add(P.tin, a, v[0]); if (src === C.OPS) { add(P.paidco, a, v[0]); ev(a, 'paidco', [v[0]]); } }
      if (src) (S.edges[src] || (S.edges[src] = {}))[a] = 1;
    }
    for (const [a, v] of neg) if (a !== C.OPS || pos.some(([b]) => S.labels[b])) add(P.tout, a, -v[0]);
    return;
  }
  // 이 거래에서 WLBN 이 어느 풀로 들어가고 어느 풀에서 나왔는지(지갑별로 나눠 적기 위해)
  const inR = dr && dr[0] > EPS ? dr[0] : 0, inX = dx && dx[0] > EPS ? dx[0] : 0;
  const outR = dr && dr[0] < -EPS ? -dr[0] : 0, outX = dx && dx[0] < -EPS ? -dx[0] : 0;
  let sellW = 0, buyW = 0;
  for (const [a, v] of mv) { if (S.amms[a]) continue; if (v[0] < 0) sellW -= v[0]; else buyW += v[0]; }
  const capS = Math.min(sellW, inR + inX), capB = Math.min(buyW, outR + outX);
  const sR = inR + inX > 0 ? capS * inR / (inR + inX) : 0, sX = inR + inX > 0 ? capS * inX / (inR + inX) : 0;
  const bR = outR + outX > 0 ? capB * outR / (outR + outX) : 0, bX = outR + outX > 0 ? capB * outX / (outR + outX) : 0;
  for (const [a, v] of mv) {
    if (S.amms[a]) continue;
    if (v[0] < 0) {
      const w = -v[0], got = v[1] + v[2] * rate;
      const val = (got > 0 || per === 'before') ? got : w * S.pR;
      add(P.sold, a, w); add(P.cash, a, Math.max(val, 0)); add(P.cash_r, a, Math.max(v[1], 0)); add(P.cash_x, a, Math.max(v[2], 0));
      S.lastSell[a] = k; ev(a, 'sell', [w, Math.max(val, 0), sR * w / sellW, sX * w / sellW, Math.max(v[1], 0), Math.max(v[2], 0)]);
    } else {
      const cost = -(v[1] + v[2] * rate);
      add(P.bought, a, v[0]); add(P.spent, a, Math.max(cost, 0)); add(P.spent_r, a, Math.max(-v[1], 0)); add(P.spent_x, a, Math.max(-v[2], 0));
      ev(a, 'buy', [v[0], Math.max(cost, 0), bR * v[0] / buyW, bX * v[0] / buyW, Math.max(-v[1], 0), Math.max(-v[2], 0)]);
    }
  }
}

// 사이트 공개 API 응답에서 이름 붙은 계정을 읽는다.
function labelsFromExt(ext) {
  const L = {};
  const ex = ext && ext.explorer, net = ext && ext.network;
  if (ex && Array.isArray(ex.richList)) for (const r of ex.richList) if (r && r.label && r.account) L[r.account] = r.label;
  if (net) for (const o of [].concat(net.topOperators || [], net.topEarners || [])) if (o && o.known && !L[o.known]) L[o.known] = 'kweather';
  return L;
}
function setLabels(S, ext) {
  Object.assign(S.labels, labelsFromExt(ext));
  S.labels[C.ISSUER] = 'issuer';
  S.labels[C.PRIOR_KW] = 'kweather';
}

function pickExt(S, ext) {
  // 받은 값이 있으면 상태에 남기고, 없으면 마지막으로 받은 값을 쓴다.
  const e = S.ext || (S.ext = {});
  const ex = ext && ext.explorer, net = ext && ext.network, sup = ext && ext.supply, fees = ext && ext.fees, dex = ext && ext.dex && ext.dex.pairs && ext.dex.pairs[0];
  try { if (ex && ex.holders !== undefined) { e.holders = ex.holders; e.trustlines = ex.trustlines; } } catch (_) { /* keep last */ }
  try {
    if (net && net.devices) {
      e.devices_total = net.devices.total; e.devices_active = net.devices.active; e.operators = net.devices.operators;
      const L = S.labels; let kd = 0;
      for (const o of net.topOperators || []) if (o && L[o.known] === 'kweather' && o.devices > kd) kd = o.devices;
      e.kweather_devices = kd;
      if (net.epochs && net.epochs[0]) { e.epoch_budget = net.epochs[0].budget; e.epoch_distributed = Math.round(net.epochs[0].distributed); e.epoch_date = md(net.epochs[0].date); }
    }
  } catch (_) { /* keep last */ }
  try { if (sup && sup.circulating !== undefined) e.circulating = Math.round(sup.circulating); } catch (_) { /* keep last */ }
  try { if (fees && fees.all) e.pool_value_rlusd = Math.round(fees.all.valueRlusd); } catch (_) { /* keep last */ }
  try {
    if (dex && dex.priceUsd) {
      e.price_usd_dex = Math.round(Number(dex.priceUsd) * 1e4) / 1e4; e.dex_h24_buys = dex.txns.h24.buys; e.dex_h24_sells = dex.txns.h24.sells;
      e.dex_h24_volume_usd = Math.round(dex.volume.h24); e.dex_liquidity_usd = Math.round(dex.liquidity.usd);
    }
  } catch (_) { /* keep last */ }
  return e;
}

function buildDatasets(S, opts) {
  opts = opts || {};
  const L = S.labels, N = S.st.now, B = S.st.before, r0 = Math.round;
  const g2 = (o, a) => o[a] || 0;
  const allp = (key, a) => g2(B[key], a) + g2(N[key], a);
  const isAmm = (a) => !!S.amms[a];
  const short = (a) => a.slice(0, 6) + '…' + a.slice(-4);
  const r3 = (x) => Math.round(x * 1e3) / 1e3, r4 = (x) => Math.round(x * 1e4) / 1e4;

  // 지갑 분류
  const users = new Set();
  for (const P of [B, N]) for (const a of Object.keys(P.paid)) if (!L[a] && !isAmm(a) && a !== C.SWEEP) users.add(a);
  const front = Array.from(users);
  while (front.length) {
    const a = front.pop();
    for (const b of Object.keys(S.edges[a] || {})) {
      if (L[b] || isAmm(b) || b === C.SWEEP || users.has(b)) continue;
      users.add(b); front.push(b);
    }
  }
  const accts = Object.keys(S.bal).filter((a) => !isAmm(a) && a !== C.ISSUER);
  const group = (a) => {
    const lab = L[a];
    if (lab) return lab === 'bot' ? 'bot' : lab === 'kweather' ? 'kweather' : 'company';
    if (a === C.SWEEP) return 'sweep';
    if (users.has(a)) return 'user';
    const s = allp('sold', a), b = allp('bought', a);
    if (s + b > 500 && Math.min(s, b) >= 0.8 * Math.max(s, b)) return 'arb';
    return 'other';
  };
  const G = {}; for (const a of accts) G[a] = group(a);
  const ul = accts.filter((a) => G[a] === 'user').sort();

  // 날짜 · 지갑 · 종류별 기록을 풀어 둔다
  const EV = Object.keys(S.ev).map((key) => { const p = key.split('|'); return { k: p[0], a: p[1], kind: p[2], v: S.ev[key], g: G[p[1]] || 'other' }; });
  const lastDay = kday(S.asof), days = [];
  for (let t = Date.parse(C.NOW_FROM + 'T00:00:00Z'); ; t += 86400000) {
    const k = new Date(t).toISOString().slice(0, 10);
    if (k > lastDay) break;
    days.push(k);
  }

  // 날짜별
  const day = {}, sellers = {};
  const dget = (k) => day[k] || (day[k] = {});
  for (const e of EV) {
    const m = dget(e.k), v = e.v, g = e.g;
    if (e.kind === 'sell') {
      add(m, 'sell_' + g, v[0]); add(m, 'sell_total', v[0]); add(m, 'to_r', v[2] || 0); add(m, 'to_x', v[3] || 0);
      add(m, 'got_r', v[4] || 0); add(m, 'got_x', v[5] || 0);
      if (g === 'user') { add(m, 'cash_user', v[1]); add(m, 'got_r_user', v[4] || 0); add(m, 'got_x_user', v[5] || 0); (sellers[e.k] || (sellers[e.k] = new Set())).add(e.a); }
    } else if (e.kind === 'buy') {
      add(m, 'buy_' + g, v[0]); add(m, 'buy_total', v[0]); add(m, 'from_r', v[2] || 0); add(m, 'from_x', v[3] || 0);
      if (g === 'user') add(m, 'spent_user', v[1]);
    } else if (e.kind === 'paid' && g === 'user') add(m, 'paid_user', v[0]);
    else if (e.kind === 'lp' && g === 'user') add(m, 'lp_user', v[0]);
  }
  const daily = []; let cp = 0, cs = 0, lastp = null, lastx = null, lastPool = null;
  for (const k of days) {
    const v = day[k] || {}, f = (x) => v[x] || 0;
    cp += f('paid_user'); cs += f('sell_user') - f('buy_user');
    if (S.eod[k] !== undefined) lastp = S.eod[k];
    if (S.eodX[k] !== undefined) lastx = S.eodX[k];
    if (S.eodPool[k]) lastPool = S.eodPool[k];
    const r = { date: k };
    for (const g of GR) { r['sell_' + g] = r0(f('sell_' + g)); r['buy_' + g] = r0(f('buy_' + g)); }
    Object.assign(r, {
      sell_total: r0(f('sell_total')), buy_total: r0(f('buy_total')), net_sell_total: r0(f('sell_total') - f('buy_total')),
      net_sell_user: r0(f('sell_user') - f('buy_user')), cash_user_rlusd: r0(f('cash_user')), got_rlusd_user: r0(f('got_r_user')), got_xrp_user: r0(f('got_x_user')),
      user_sellers: sellers[k] ? sellers[k].size : 0, paid_user: r0(f('paid_user')), lp_user: r0(f('lp_user')),
      to_r: r0(f('to_r')), to_x: r0(f('to_x')), to_o: r0(Math.max(f('sell_total') - f('to_r') - f('to_x'), 0)),
      from_r: r0(f('from_r')), from_x: r0(f('from_x')), from_o: r0(Math.max(f('buy_total') - f('from_r') - f('from_x'), 0)),
      cum_paid_user: r0(cp), cum_net_sold_user: r0(cs),
      price_rlusd: lastp === null ? null : r4(lastp), price_xrp: lastx === null ? null : r4(lastx),
      pool_r_wlbn: lastPool ? lastPool[0] : null, pool_r_rlusd: lastPool ? lastPool[1] : null, pool_x_wlbn: lastPool ? lastPool[2] : null, pool_x_xrp: lastPool ? lastPool[3] : null,
      partial: k === lastDay,
    });
    daily.push(r);
  }

  // 기간별 합계 (전체 · 최근 30일 · 최근 7일)
  const shift = (k, n) => new Date(Date.parse(k + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
  const labelAccts = Object.keys(L).filter((a) => a !== C.ISSUER && !isAmm(a) && S.bal[a] !== undefined);
  const live = S.live || {}, liveBal = live.bal || {};
  const mkRange = (key, from) => {
    if (from < C.NOW_FROM) from = C.NOW_FROM;
    const acc = {}, at = (a) => acc[a] || (acc[a] = { paid: 0, paidco: 0, sold: 0, bought: 0, cash: 0, spent: 0, toR: 0, toX: 0, fromR: 0, fromX: 0, gotR: 0, gotX: 0, payR: 0, payX: 0, lpw: 0, lpq: 0, lpr: 0, lpx: 0 });
    let repay = 0;
    for (const e of EV) {
      if (e.k < from) continue;
      const o = at(e.a), v = e.v;
      if (e.kind === 'sell') { o.sold += v[0]; o.cash += v[1]; o.toR += v[2] || 0; o.toX += v[3] || 0; o.gotR += v[4] || 0; o.gotX += v[5] || 0; }
      else if (e.kind === 'buy') { o.bought += v[0]; o.spent += v[1]; o.fromR += v[2] || 0; o.fromX += v[3] || 0; o.payR += v[4] || 0; o.payX += v[5] || 0; }
      else if (e.kind === 'paid') { o.paid += v[0]; if (e.k === C.NOW_FROM && e.g === 'user') repay += v[0]; }
      else if (e.kind === 'paidco') o.paidco += v[0];
      else if (e.kind === 'lp') { o.lpw += v[0]; o.lpq += v[1]; o.lpr += v[2] || 0; o.lpx += v[3] || 0; }
    }
    const of = (g) => Object.keys(acc).filter((a) => (G[a] || 'other') === g);
    const sum = (list, f) => list.reduce((t, a) => t + (acc[a] ? acc[a][f] : 0), 0);
    const U = of('user');
    const rows = daily.filter((r) => r.date >= from), full = rows.filter((r) => !r.partial && r.date >= C.POOL_OPEN);
    const avg = (f) => (full.length ? r0(full.reduce((t, r) => t + r[f], 0) / full.length) : null);
    const uPaid = sum(U, 'paid'), uSold = sum(U, 'sold'), uBought = sum(U, 'bought'), uCash = sum(U, 'cash');
    const all = Object.keys(acc), ts = sum(all, 'sold'), tb = sum(all, 'bought'), botB = sum(of('bot'), 'bought');
    const first = rows.find((r) => r.price_rlusd !== null), lastRow = rows[rows.length - 1];
    const kpi = {
      user_paid: r0(uPaid), user_repaid: r0(repay), user_paid_new: r0(uPaid) - r0(repay), wallets_paid: U.filter((a) => acc[a].paid > 0).length,
      user_sold: r0(uSold), user_bought: r0(uBought), user_net_sold: r0(uSold) - r0(uBought), wallets_sold: U.filter((a) => acc[a].sold > 0).length,
      user_sold_share: uPaid > 0 ? r3(uSold / uPaid) : null, user_sold_vs_new_paid: uPaid - repay > 0 ? r3(uSold / (uPaid - repay)) : null,
      user_cash_rlusd: r0(uCash), user_got_rlusd: r0(sum(U, 'gotR')), user_got_xrp: r0(sum(U, 'gotX')), user_avg_sell_price: uSold > 0 ? r3(uCash / uSold) : null,
      user_pool_in: r0(sum(U, 'lpw')), user_balance: r0(ul.reduce((t, a) => t + Math.max(g2(S.bal, a), 0), 0)),
      user_sell_avg: avg('sell_user'), user_paid_avg: avg('paid_user'), full_days: full.length,
      sell_total: r0(ts), buy_total: r0(tb), net_bought_total: r0(tb) - r0(ts), bot_bought: r0(botB), bot_buy_share: tb > 0 ? r3(botB / tb) : null,
      net_sold_ex_bot: r0(ts) - (r0(tb) - r0(botB)), bot_paid_rlusd: r0(sum(of('bot'), 'payR')), bot_paid_xrp: r0(sum(of('bot'), 'payX')),
      kweather_paid: r0(sum(of('kweather'), 'paidco')), kweather_sold: r0(sum(of('kweather'), 'sold')),
      got_rlusd_total: r0(sum(all, 'gotR')), got_xrp_total: r0(sum(all, 'gotX')), paid_rlusd_total: r0(sum(all, 'payR')), paid_xrp_total: r0(sum(all, 'payX')),
      price_from: first ? first.price_rlusd : null, price_to: lastRow ? lastRow.price_rlusd : null,
      price_change: first && lastRow && first.price_rlusd ? r3(lastRow.price_rlusd / first.price_rlusd - 1) : null,
    };
    const groups = [], flowSell = [], flowBuy = [];
    for (const g of GR) {
      const aa = of(g).filter((a) => a !== C.OPS && acc[a].sold + acc[a].bought + acc[a].paid + acc[a].paidco > 0);
      if (!aa.length) continue;
      const row = {
        group: NAME[g], key: g, wallets: aa.length, sold: r0(sum(aa, 'sold')), bought: r0(sum(aa, 'bought')), paid: r0(sum(aa, 'paid') + sum(aa, 'paidco')),
        got_rlusd: r0(sum(aa, 'gotR')), got_xrp: r0(sum(aa, 'gotX')), paid_rlusd: r0(sum(aa, 'payR')), paid_xrp: r0(sum(aa, 'payX')), cash_rlusd: r0(sum(aa, 'cash')),
      };
      row.net_sold = row.sold - row.bought; groups.push(row);
      const s = sum(aa, 'sold'), b = sum(aa, 'bought'), tR = sum(aa, 'toR'), tX = sum(aa, 'toX'), fR = sum(aa, 'fromR'), fX = sum(aa, 'fromX');
      if (s >= 0.5) flowSell.push({ key: g, name: NAME[g], R: r0(tR), X: r0(tX), O: r0(Math.max(s - tR - tX, 0)) });
      if (b >= 0.5) flowBuy.push({ key: g, name: NAME[g], R: r0(fR), X: r0(fX), O: r0(Math.max(b - fR - fX, 0)) });
    }
    const wallets = [];
    for (const a of ul) {
      const o = acc[a] || {}, bal = Math.max(g2(S.bal, a), 0);
      if (!((o.paid || 0) + (o.sold || 0) + (o.bought || 0) + Math.abs(o.lpw || 0) >= 0.5) && bal < 1) continue;
      const ls = S.lastSell[a] || '';
      wallets.push({
        wallet: short(a), paid: r0(o.paid || 0), sold: r0(o.sold || 0), bought: r0(o.bought || 0), net_sold: r0((o.sold || 0) - (o.bought || 0)),
        cash_rlusd: r0(o.cash || 0), got_rlusd: r0(o.gotR || 0), got_xrp: r0(o.gotX || 0), pool_in: r0(o.lpw || 0), balance: r0(bal), last_sell: ls >= C.NOW_FROM ? ls : '',
      });
    }
    wallets.sort((x, y) => (y.sold - x.sold) || (y.paid - x.paid));
    // 회사 표시 계정
    const opsOut = r0(sum(all, 'paid') + sum(all, 'paidco'));
    const accounts = labelAccts.map((a) => {
      const o = acc[a] || {};
      return {
        name: L[a], wallet: short(a), balance: r0(Math.max(g2(S.bal, a), 0)), rlusd: liveBal[a] ? r0(liveBal[a].rlusd) : null, xrp: liveBal[a] ? r0(liveBal[a].xrp) : null,
        paid_out: a === C.OPS ? opsOut : 0, received: r0(o.paidco || 0),
        bought: r0(o.bought || 0), sold: r0(o.sold || 0), paid_rlusd: r0(o.payR || 0), paid_xrp: r0(o.payX || 0),
        pool_wlbn: r0(o.lpw || 0), pool_rlusd: r0(o.lpr || 0), pool_xrp: r0(o.lpx || 0),
      };
    }).sort((x, y) => y.balance - x.balance);
    // 풀에 넣은 양(순) — 누가
    const lpRows = [];
    const lpAdd = (who, list) => {
      const w = sum(list, 'lpw'), r = sum(list, 'lpr'), x = sum(list, 'lpx');
      if (Math.abs(w) + Math.abs(r) + Math.abs(x) >= 0.5) lpRows.push({ who, wlbn: r0(w), rlusd: r0(r), xrp: r0(x) });
    };
    for (const a of labelAccts) lpAdd(L[a] + ' 표시 계정', [a].filter((x) => acc[x]));
    lpAdd(NAME.user, U); lpAdd('그 밖의 지갑', of('arb').concat(of('other')));
    lpRows.sort((x, y) => Math.abs(y.wlbn) - Math.abs(x.wlbn));
    // 직전 같은 길이의 기간(풀이 열린 뒤에 온전히 들어갈 때만)
    let prev = null;
    if (key !== 'all') {
      const n = rows.length, f2 = shift(from, -n), t2 = shift(from, -1);
      if (f2 >= C.POOL_OPEN) {
        const p = { from: f2, to: t2, user_paid: 0, user_sold: 0, sell_total: 0, buy_total: 0, bot_bought: 0 };
        for (const e of EV) {
          if (e.k < f2 || e.k > t2) continue;
          if (e.kind === 'sell') { p.sell_total += e.v[0]; if (e.g === 'user') p.user_sold += e.v[0]; }
          else if (e.kind === 'buy') { p.buy_total += e.v[0]; if (e.g === 'bot') p.bot_bought += e.v[0]; }
          else if (e.kind === 'paid' && e.g === 'user') p.user_paid += e.v[0];
        }
        for (const f of ['user_paid', 'user_sold', 'sell_total', 'buy_total', 'bot_bought']) p[f] = r0(p[f]);
        prev = p;
      }
    }
    return { key, from, to: lastDay, days: rows.length, kpi, prev, groups, flow: { sell: flowSell, buy: flowBuy }, wallets, accounts, lp: lpRows };
  };
  const ranges = { all: mkRange('all', C.NOW_FROM), d30: mkRange('d30', shift(lastDay, -29)), d7: mkRange('d7', shift(lastDay, -6)) };

  // 날짜마다 많이 판 곳 · 많이 산 곳 (다섯 곳씩)
  const dayAgg = {};
  for (const e of EV) {
    if (e.kind !== 'sell' && e.kind !== 'buy') continue;
    const d = dayAgg[e.k] || (dayAgg[e.k] = { sell: {}, buy: {} }), o = d[e.kind][e.a] || (d[e.kind][e.a] = [0, 0, 0]);
    o[0] += e.v[0]; o[1] += e.v[4] || 0; o[2] += e.v[5] || 0;
  }
  const whoOf = (a) => (L[a] ? L[a] + ' 표시 계정' : short(a));
  const dayTop = {};
  for (const k of Object.keys(dayAgg)) {
    const top = (m) => Object.keys(m).map((a) => ({ who: whoOf(a), g: G[a] || 'other', w: r0(m[a][0]), rlusd: r0(m[a][1]), xrp: r0(m[a][2]) })).filter((x) => x.w > 0).sort((x, y) => y.w - x.w);
    const s = top(dayAgg[k].sell), b = top(dayAgg[k].buy);
    dayTop[k] = { sell: s.slice(0, 5), buy: b.slice(0, 5), sellers: s.length, buyers: b.length };
  }

  // 지금 풀의 몫 — 풀 지분 증표를 누가 들고 있나
  const lpShares = []; let lpCompany = 0, lpUser = 0, lpAll = 0;
  if (live.lp) {
    const agg = {};
    for (const pk of ['X', 'R']) {
      const P = live.lp[pk];
      if (!P || !(P.total > 0)) continue;
      for (const a of Object.keys(P.holders)) {
        const kind = L[a] ? 'company' : (users.has(a) ? 'user' : 'other');
        const who = L[a] ? L[a] + ' 표시 계정' : (kind === 'user' ? NAME.user : '그 밖의 지갑');
        const o = agg[who] || (agg[who] = { X: 0, R: 0, kind });
        o[pk] += P.holders[a] / P.total;
      }
    }
    for (const who of Object.keys(agg)) {
      const o = agg[who], w = o.X * S.pools.X.w + o.R * S.pools.R.w;
      lpShares.push({ who, x_share: r4(o.X), x_wlbn: r0(o.X * S.pools.X.w), x_xrp: r0(o.X * S.pools.X.q), r_share: r4(o.R), r_wlbn: r0(o.R * S.pools.R.w), r_rlusd: r0(o.R * S.pools.R.q), wlbn: r0(w) });
      lpAll += w; if (o.kind === 'company') lpCompany += w; else if (o.kind === 'user') lpUser += w;
    }
    lpShares.sort((x, y) => y.wlbn - x.wlbn);
  }

  // WLBN 이 지금 어디에 있나
  let locked = 0; for (const P of [B, N]) for (const a of Object.keys(P.esc)) locked += P.esc[a];
  const byLabel = {}; let labeled = 0;
  for (const a of labelAccts) { const b = Math.max(g2(S.bal, a), 0); add(byLabel, L[a], b); labeled += b; }
  const poolW = Math.max(g2(S.bal, C.AMM_R), 0) + Math.max(g2(S.bal, C.AMM_X), 0);
  const userW = ul.reduce((t, a) => t + Math.max(g2(S.bal, a), 0), 0);
  let allBal = 0; for (const a of Object.keys(S.bal)) if (a !== C.ISSUER) allBal += Math.max(S.bal[a], 0);
  const total = locked + allBal;
  const pos = [['locked', '잠금(에스크로)', locked], ['treasury', 'treasury 표시 계정', byLabel.treasury || 0], ['seed', 'seed 표시 계정', byLabel.seed || 0], ['staking', 'staking 표시 계정', byLabel.staking || 0],
    ['pools', '풀 두 곳', poolW], ['match', 'match 표시 계정', byLabel.match || 0], ['kweather', 'kweather 표시 계정', byLabel.kweather || 0], ['bot', 'bot 표시 계정', byLabel.bot || 0],
    ['operations', 'operations 표시 계정', byLabel.operations || 0], ['user', NAME.user, userW]];
  const known = pos.reduce((t, p) => t + p[2], 0);
  pos.push(['other', '그 밖의 지갑', Math.max(total - known, 0)]);
  const positions = pos.map((p) => ({ key: p[0], where: p[1], amount: r0(p[2]), share: total > 0 ? Math.round(p[2] / total * 1e6) / 1e6 : null }));

  // 요약 (지금 값 · 최근 7일 추세)
  const full = daily.filter((r) => !r.partial && r.date >= C.POOL_OPEN), last7 = full.slice(-7), prev7 = full.slice(-14, -7);
  const avgOf = (rows, key) => (rows.length ? r0(rows.reduce((t, r) => t + r[key], 0) / rows.length) : null);
  const s7 = avgOf(last7, 'sell_user'), p7 = prev7.length === 7 ? avgOf(prev7, 'sell_user') : null;
  const e = S.ext || {};
  const summary = {
    as_of: kstamp(S.asof), period_from: C.NOW_FROM, pool_open: C.POOL_OPEN, last_day: lastDay,
    win_from: last7.length ? md(last7[0].date) : null, win_to: last7.length ? md(last7[last7.length - 1].date) : null,
    user_sell_7d_avg: s7, user_sell_prev7d_avg: p7, user_sell_7d_change: p7 ? r3(s7 / p7 - 1) : null, user_paid_7d_avg: avgOf(last7, 'paid_user'),
    price_rlusd: S.pR ? r4(S.pR) : null, xrp_per_wlbn: S.pX ? r4(S.pX) : null, xrp_rate_rlusd: S.pR && S.pX ? r4(S.pR / S.pX) : null,
    pool_r_wlbn: r0(S.pools.R.w), pool_r_rlusd: r0(S.pools.R.q), pool_x_wlbn: r0(S.pools.X.w), pool_x_xrp: r0(S.pools.X.q),
    total_supply: r0(total), fee_r: S.pools.R.fee ?? null, fee_x: S.pools.X.fee ?? null,
    lp_company_share: lpAll > 0 ? r3(lpCompany / lpAll) : null, lp_user_share: lpAll > 0 ? r3(lpUser / lpAll) : null,
    price_usd_dex: e.price_usd_dex ?? null, pool_value_rlusd: e.pool_value_rlusd ?? null, dex_h24_buys: e.dex_h24_buys ?? null, dex_h24_sells: e.dex_h24_sells ?? null,
    dex_h24_volume_usd: e.dex_h24_volume_usd ?? null, dex_liquidity_usd: e.dex_liquidity_usd ?? null, holders: e.holders ?? null, trustlines: e.trustlines ?? null,
    devices_total: e.devices_total ?? null, devices_active: e.devices_active ?? null, operators: e.operators ?? null, kweather_devices: e.kweather_devices ?? null,
    epoch_budget: e.epoch_budget ?? null, epoch_distributed: e.epoch_distributed ?? null, epoch_date: e.epoch_date ?? null, circulating: e.circulating ?? null,
  };
  const out = { summary: [summary], daily, ranges, positions, dayTop };
  if (lpShares.length) out.lpShares = lpShares;
  if (opts.showBefore) {
    const sumB = (aa, key) => aa.reduce((t, a) => t + g2(B[key], a), 0);
    const before = [];
    for (const g of ['user', 'sweep', 'arb', 'other', 'bot', 'kweather']) {
      const aa = accts.filter((a) => G[a] === g && a !== C.OPS && (g2(B.sold, a) + g2(B.bought, a) + g2(B.paid, a) + g2(B.paidco, a) > 0));
      if (!aa.length) continue;
      const r = { group: NAME[g], key: g, wallets: aa.length, sold: r0(sumB(aa, 'sold')), bought: r0(sumB(aa, 'bought')) };
      r.net_sold = r.sold - r.bought; r.paid = r0(sumB(aa, 'paid') + sumB(aa, 'paidco')); r.got_rlusd = r0(sumB(aa, 'cash_r')); r.got_xrp = r0(sumB(aa, 'cash_x'));
      before.push(r);
    }
    const sweepFrom = Object.keys(B.tout).filter((a) => (S.edges[a] || {})[C.SWEEP]).map((a) => B.tout[a]).sort((x, y) => y - x);
    const sw = before.find((r) => r.key === 'sweep') || { sold: 0, got_rlusd: 0, got_xrp: 0 };
    Object.assign(summary, {
      sweep_sold: sw.sold, sweep_got_rlusd: sw.got_rlusd, sweep_got_xrp: sw.got_xrp, sweep_from_wallets: sweepFrom.length,
      sweep_largest_source: sweepFrom.length ? r0(sweepFrom[0]) : null, repaid_total: ranges.all.kpi.user_repaid + r0(g2(B.tout, C.PRIOR_KW)),
    });
    out.before = before;
  }
  return out;
}

// 한 묶음의 거래를 원장 순서로 정렬해 반영한다. (계정 거래 내역 응답의 한 줄 = {tx|tx_json, meta, hash?})
function normalize(t) {
  const tx = t.tx || t.tx_json, meta = t.meta;
  if (!tx || !meta || typeof meta !== 'object') return null;
  const hash = tx.hash || t.hash, li = tx.ledger_index !== undefined ? tx.ledger_index : t.ledger_index;
  if (tx.date === undefined || li === undefined) return null;
  return { tx, meta, hash, li, ti: meta.TransactionIndex || 0 };
}
function applyBatch(S, items) {
  const seen = new Set(), list = [];
  for (const t of items) { const n = normalize(t); if (!n || seen.has(n.hash)) continue; seen.add(n.hash); list.push(n); }
  list.sort((a, b) => (a.li - b.li) || (a.ti - b.ti));
  for (const n of list) applyTx(S, n.tx, n.meta);
  return list.length;
}

module.exports = { C, newState, applyTx, applyBatch, normalize, buildDatasets, setLabels, pickExt, kday };
