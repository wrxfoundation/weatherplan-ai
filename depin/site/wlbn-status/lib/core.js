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
const KEYS = ['sold', 'bought', 'cash', 'cash_r', 'cash_x', 'spent', 'lpw', 'lpq', 'paid', 'paidco', 'tin', 'tout', 'esc', 'burn'];
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
    v: 1, ledger: 0, asof: 0, bal: {}, st: { before: period(), now: period() }, lastSell: {}, edges: {}, amms: {}, paidN: {},
    ev: {}, pools: { R: { w: 0, q: 0 }, X: { w: 0, q: 0 } }, eod: {}, pR: 0, pX: 0, labels: {}, ext: {},
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
    if (S.pools.X.w > 0 && S.pools.X.q > 0) S.pX = S.pools.X.q / S.pools.X.w;
  }
  const rate = per === 'now' && S.pR > 0 && S.pX > 0 ? S.pR / S.pX : 0;   // XRP 1개당 RLUSD

  const mv = [];
  for (const [a, v] of d) if (Math.abs(v[0]) > EPS && a !== C.ISSUER) { mv.push([a, v]); add(S.bal, a, v[0]); }
  if (!mv.length) return;
  const ev = (a, kind, w, val) => {
    if (per !== 'now') return;
    const key = k + '|' + a + '|' + kind, e = S.ev[key] || (S.ev[key] = [0, 0]);
    e[0] += w; e[1] += val;
  };

  if (ty.startsWith('AMM')) {
    for (const [a, v] of mv) {
      if (S.amms[a]) continue;
      const q = v[1] + v[2] * rate;
      add(P.lpw, a, -v[0]); add(P.lpq, a, q); ev(a, 'lp', -v[0], q);
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
      if (src === C.OPS && !S.labels[a]) { add(P.paid, a, v[0]); add(S.paidN, per + '|' + a, 1); ev(a, 'paid', v[0], 0); }
      else { add(P.tin, a, v[0]); if (src === C.OPS) add(P.paidco, a, v[0]); }
      if (src) (S.edges[src] || (S.edges[src] = {}))[a] = 1;
    }
    for (const [a, v] of neg) if (a !== C.OPS || pos.some(([b]) => S.labels[b])) add(P.tout, a, -v[0]);
    return;
  }
  for (const [a, v] of mv) {
    if (S.amms[a]) continue;
    if (v[0] < 0) {
      const w = -v[0], got = v[1] + v[2] * rate;
      const val = (got > 0 || per === 'before') ? got : w * S.pR;
      add(P.sold, a, w); add(P.cash, a, Math.max(val, 0)); add(P.cash_r, a, Math.max(v[1], 0)); add(P.cash_x, a, Math.max(v[2], 0));
      S.lastSell[a] = k; ev(a, 'sell', w, Math.max(val, 0));
    } else {
      const cost = -(v[1] + v[2] * rate);
      add(P.bought, a, v[0]); add(P.spent, a, Math.max(cost, 0)); ev(a, 'buy', v[0], Math.max(cost, 0));
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

  // 날짜별
  const day = {}, sellers = {};
  const dget = (k) => day[k] || (day[k] = {});
  let repay = 0;
  for (const key of Object.keys(S.ev)) {
    const [k, a, kind] = key.split('|'), [w, v] = S.ev[key], g = G[a] || 'other', m = dget(k);
    if (kind === 'sell') {
      add(m, 'sell_' + g, w); add(m, 'sell_total', w);
      if (g === 'user') { add(m, 'cash_user', v); (sellers[k] || (sellers[k] = new Set())).add(a); }
    } else if (kind === 'buy') {
      add(m, 'buy_' + g, w); add(m, 'buy_total', w);
      if (g === 'user') add(m, 'spent_user', v);
    } else if (kind === 'paid' && g === 'user') { add(m, 'paid_user', w); if (k === C.NOW_FROM) repay += w; }
    else if (kind === 'lp' && g === 'user') add(m, 'lp_user', w);
  }
  const lastDay = kday(S.asof), days = [];
  for (let t = Date.parse(C.NOW_FROM + 'T00:00:00Z'); ; t += 86400000) {
    const k = new Date(t).toISOString().slice(0, 10);
    if (k > lastDay) break;
    days.push(k);
  }
  const daily = []; let cp = 0, cs = 0, lastp = null;
  for (const k of days) {
    const v = day[k] || {}, f = (x) => v[x] || 0;
    cp += f('paid_user'); cs += f('sell_user') - f('buy_user');
    if (S.eod[k] !== undefined) lastp = S.eod[k];
    const r = { date: k };
    for (const g of GR) { r['sell_' + g] = r0(f('sell_' + g)); r['buy_' + g] = r0(f('buy_' + g)); }
    Object.assign(r, {
      sell_total: r0(f('sell_total')), buy_total: r0(f('buy_total')), net_sell_total: r0(f('sell_total') - f('buy_total')),
      net_sell_user: r0(f('sell_user') - f('buy_user')), cash_user_rlusd: r0(f('cash_user')), spent_user_rlusd: r0(f('spent_user')),
      user_sellers: sellers[k] ? sellers[k].size : 0, paid_user: r0(f('paid_user')), lp_user: r0(f('lp_user')),
      cum_paid_user: r0(cp), cum_net_sold_user: r0(cs), price_rlusd: lastp === null ? null : Math.round(lastp * 1e4) / 1e4, partial: k === lastDay,
    });
    daily.push(r);
  }

  // 일반 사용자 지갑별
  const ul = accts.filter((a) => G[a] === 'user').sort();
  const wallets = [];
  for (const a of ul) {
    const act = g2(N.paid, a) + g2(N.tin, a) + g2(N.sold, a) + g2(N.bought, a) + Math.abs(g2(N.lpw, a));
    if (act < 0.01 && g2(S.bal, a) < 0.01) continue;
    const ls = S.lastSell[a] || '';
    const row = {
      wallet: a.slice(0, 6) + '…' + a.slice(-4), paid: r0(g2(N.paid, a)), payouts: g2(S.paidN, 'now|' + a), moved_in: r0(g2(N.tin, a)), moved_out: r0(g2(N.tout, a)),
      sold: r0(g2(N.sold, a)), bought: r0(g2(N.bought, a)), net_sold: r0(g2(N.sold, a) - g2(N.bought, a)), cash_rlusd: r0(g2(N.cash, a)),
      pool_in: r0(g2(N.lpw, a)), pool_cash_rlusd: r0(Math.max(g2(N.lpq, a), 0)), balance: r0(Math.max(g2(S.bal, a), 0)), last_sell: ls >= C.NOW_FROM ? ls : '',
    };
    if (opts.withAddress) row.address = a;
    wallets.push(row);
  }
  wallets.sort((x, y) => (y.sold - x.sold) || (y.paid - x.paid));

  // 묶음별
  const grpRows = (P, per, order) => {
    const out = [];
    for (const g of order) {
      const aa = accts.filter((a) => G[a] === g && a !== C.OPS && (g2(P.sold, a) + g2(P.bought, a) + g2(P.paid, a) + g2(P.paidco, a) > 0));
      if (!aa.length) continue;
      const sum = (key) => aa.reduce((t, a) => t + g2(P[key], a), 0);
      const r = { group: NAME[g], key: g, wallets: aa.length, sold: r0(sum('sold')), bought: r0(sum('bought')) };
      r.net_sold = r.sold - r.bought; r.paid = r0(sum('paid') + sum('paidco'));
      if (per === 'now') r.cash_rlusd = r0(sum('cash'));
      else { r.got_rlusd = r0(sum('cash_r')); r.got_xrp = r0(sum('cash_x')); }
      out.push(r);
    }
    return out;
  };
  const groups = grpRows(N, 'now', GR);
  const before = grpRows(B, 'before', ['user', 'sweep', 'arb', 'other', 'bot', 'kweather']);
  const sweepFrom = Object.keys(B.tout).filter((a) => (S.edges[a] || {})[C.SWEEP]).map((a) => B.tout[a]).sort((x, y) => y - x);

  // 요약
  const usum = (key) => ul.reduce((t, a) => t + g2(N[key], a), 0);
  const uPaid = usum('paid'), uSold = usum('sold'), uBought = usum('bought'), uLp = usum('lpw'), uCash = usum('cash'), uSpent = usum('spent');
  const uBal = ul.reduce((t, a) => t + Math.max(g2(S.bal, a), 0), 0), uLpCash = ul.reduce((t, a) => t + Math.max(g2(N.lpq, a), 0), 0);
  const full = daily.filter((r) => !r.partial && r.date >= C.POOL_OPEN), last7 = full.slice(-7), prev7 = full.slice(-14, -7);
  const avg = (rows, key) => (rows.length ? r0(rows.reduce((t, r) => t + r[key], 0) / rows.length) : null);
  let tb = 0, ts = 0; for (const k of Object.keys(day)) { tb += day[k].buy_total || 0; ts += day[k].sell_total || 0; }
  const kw = accts.filter((a) => G[a] === 'kweather');
  const botB = accts.filter((a) => G[a] === 'bot').reduce((t, a) => t + g2(N.bought, a), 0);
  const s7 = avg(last7, 'sell_user'), p7 = prev7.length === 7 ? avg(prev7, 'sell_user') : null;
  const r3 = (x) => Math.round(x * 1e3) / 1e3, r4 = (x) => Math.round(x * 1e4) / 1e4;
  const e = S.ext || {};
  const summary = {
    as_of: kstamp(S.asof), period_from: C.NOW_FROM, last_day: lastDay,
    wallets: ul.filter((a) => g2(N.paid, a) > 0).length, wallets_sold: ul.filter((a) => g2(N.sold, a) > 0).length, wallets_holding: ul.filter((a) => g2(S.bal, a) >= 1).length,
    user_paid: r0(uPaid), user_repaid_1026: r0(repay), user_paid_after: r0(uPaid) - r0(repay),
    user_sold: r0(uSold), user_bought: r0(uBought), user_net_sold: r0(uSold) - r0(uBought),
    user_sold_share: uPaid ? r3(uSold / uPaid) : null, user_sold_vs_new_paid: uPaid > repay ? r3(uSold / (uPaid - repay)) : null,
    user_cash_rlusd: r0(uCash), user_spent_rlusd: r0(uSpent), user_pool_cash_rlusd: r0(uLpCash), user_avg_sell_price: uSold ? r3(uCash / uSold) : null,
    user_pool_in: r0(uLp), user_balance: r0(uBal),
    win_from: last7.length ? md(last7[0].date) : null, win_to: last7.length ? md(last7[last7.length - 1].date) : null,
    user_sell_7d_avg: s7, user_sell_prev7d_avg: p7, user_sell_7d_change: p7 ? r3(s7 / p7 - 1) : null,
    user_paid_7d_avg: avg(last7, 'paid_user'), user_cash_7d_avg: avg(last7, 'cash_user_rlusd'), user_sellers_7d_avg: avg(last7, 'user_sellers'),
    sell_total: r0(ts), buy_total: r0(tb), net_bought_total: r0(tb) - r0(ts), bot_bought: r0(botB), bot_buy_share: tb ? r3(botB / tb) : null,
    net_sold_ex_bot: r0(ts) - (r0(tb) - r0(botB)),
    kweather_paid: r0(kw.reduce((t, a) => t + g2(N.paidco, a), 0)), kweather_repaid_1027: r0(g2(B.tout, C.PRIOR_KW)), kweather_sold: r0(kw.reduce((t, a) => t + g2(N.sold, a), 0)),
    price_rlusd: S.pR ? r4(S.pR) : null, xrp_per_wlbn: S.pX ? r4(S.pX) : null, xrp_rate_rlusd: S.pR && S.pX ? r4(S.pR / S.pX) : null,
    pool_r_wlbn: r0(S.pools.R.w), pool_r_rlusd: r0(S.pools.R.q), pool_x_wlbn: r0(S.pools.X.w), pool_x_xrp: r0(S.pools.X.q),
    price_usd_dex: e.price_usd_dex ?? null, pool_value_rlusd: e.pool_value_rlusd ?? null, dex_h24_buys: e.dex_h24_buys ?? null, dex_h24_sells: e.dex_h24_sells ?? null,
    dex_h24_volume_usd: e.dex_h24_volume_usd ?? null, dex_liquidity_usd: e.dex_liquidity_usd ?? null, holders: e.holders ?? null, trustlines: e.trustlines ?? null,
    devices_total: e.devices_total ?? null, devices_active: e.devices_active ?? null, operators: e.operators ?? null, kweather_devices: e.kweather_devices ?? null,
    epoch_budget: e.epoch_budget ?? null, epoch_distributed: e.epoch_distributed ?? null, epoch_date: e.epoch_date ?? null, circulating: e.circulating ?? null,
  };
  const out = { summary: [summary], daily, wallets, groups };
  if (opts.showBefore) {
    const sw = before.find((r) => r.key === 'sweep') || { sold: 0, got_rlusd: 0, got_xrp: 0 };
    Object.assign(summary, {
      sweep_sold: sw.sold, sweep_got_rlusd: sw.got_rlusd, sweep_got_xrp: sw.got_xrp, sweep_from_wallets: sweepFrom.length,
      sweep_largest_source: sweepFrom.length ? r0(sweepFrom[0]) : null, repaid_total: r0(repay) + r0(g2(B.tout, C.PRIOR_KW)),
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
