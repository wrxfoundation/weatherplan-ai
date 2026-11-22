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
  user: '일반 사용자 지갑', arb: '사고팔기만 한 지갑', other: '그 밖의 지갑', bot: 'Wellbian bot 계정',
  kweather: 'KWeather 계정', company: 'Wellbian 그 밖의 계정', sweep: '10월 24일 잔액이 모인 주소',
};
// 소속 칩. 사이트가 이름을 붙여 공개한 계정 가운데 kweather 는 KWeather, 나머지(treasury · operations · staking · seed · match · bot)는 Wellbian.
// 화면은 owner 로 칩을 그리고 그 뒤에 label 을 붙인다. 글로만 쓸 때는 온전한 이름(group · who · where)을 쓴다.
const OWN = { wellbian: 'Wellbian', kweather: 'KWeather' };
const GOWN = { bot: 'wellbian', company: 'wellbian', kweather: 'kweather' };
const GLAB = { bot: 'bot 계정', company: '그 밖의 계정', kweather: '계정' };

// 건강 신호의 기준. 최근 7일(오늘 제외)을 직전 7일과 견준다. 숫자는 여기 한 곳에서만 고친다.
// [왼쪽 끝, 주의↔지켜봄 경계, 지켜봄↔좋음 경계, 오른쪽 끝] — 값이 클수록 좋은 쪽으로 맞춰 둔 값이다.
const HEALTH = {
  days: 7,
  join: [-0.30, -0.05, 0.05, 0.30],    // 참여: 보상 받은 지갑 수 변화(직전 7일 대비)
  pay: [0, 5, 7, 7],                   // 보상: 7일 가운데 지급된 날 수
  hold: [-0.50, 0.10, 0.50, 1.00],     // 보유: 받은 양 가운데 팔지 않은 비율 (= 1 − 판 비율)
  pool: [-0.30, -0.10, 0, 0.30],       // 유동성: 두 풀에 든 RLUSD · XRP 변화
  demand: [0, 0.50, 1.00, 1.50],       // 수요: 판 양 가운데 밖에서(Wellbian bot · 사고팔기 지갑 말고) 산 비율
  price: [-0.30, -0.15, -0.05, 0.30],  // 가격: 7일 변화
  runway: [0, 7, 30, 60],              // 여력: 잔액 ÷ 하루 평균(일)
};
const ST = { ok: '좋음', warn: '지켜봄', bad: '주의', na: '자료 없음' };

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
  // 이름이 붙은 계정의 소속과 이름. 같은 이름의 계정이 여럿이면(kweather) 계정 하나를 가리킬 때 주소 앞뒤를 덧붙인다.
  const named = new Set(labelAccts), perLabel = {};
  for (const a of labelAccts) add(perLabel, L[a], 1);
  const ownerOf = (a) => (named.has(a) ? (L[a] === 'kweather' ? 'kweather' : 'wellbian') : null);
  const labelName = (lab) => (lab === 'kweather' ? '계정' : lab + ' 계정');
  const labelOwner = (lab) => (lab === 'kweather' ? 'kweather' : 'wellbian');
  const acctLabel = (a) => labelName(L[a]) + (perLabel[L[a]] > 1 ? ' ' + short(a) : '');
  const tagged = (owner, label) => ({ owner, label, full: OWN[owner] + ' ' + label });
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
        group: NAME[g], key: g, owner: GOWN[g] || null, label: GLAB[g] || NAME[g], wallets: aa.length, sold: r0(sum(aa, 'sold')), bought: r0(sum(aa, 'bought')), paid: r0(sum(aa, 'paid') + sum(aa, 'paidco')),
        got_rlusd: r0(sum(aa, 'gotR')), got_xrp: r0(sum(aa, 'gotX')), paid_rlusd: r0(sum(aa, 'payR')), paid_xrp: r0(sum(aa, 'payX')), cash_rlusd: r0(sum(aa, 'cash')),
      };
      row.net_sold = row.sold - row.bought; groups.push(row);
      const s = sum(aa, 'sold'), b = sum(aa, 'bought'), tR = sum(aa, 'toR'), tX = sum(aa, 'toX'), fR = sum(aa, 'fromR'), fX = sum(aa, 'fromX');
      if (s >= 0.5) flowSell.push({ key: g, name: NAME[g], owner: GOWN[g] || null, label: GLAB[g] || NAME[g], R: r0(tR), X: r0(tX), O: r0(Math.max(s - tR - tX, 0)) });
      if (b >= 0.5) flowBuy.push({ key: g, name: NAME[g], owner: GOWN[g] || null, label: GLAB[g] || NAME[g], R: r0(fR), X: r0(fX), O: r0(Math.max(b - fR - fX, 0)) });
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
    // Wellbian · KWeather 계정
    const opsOut = r0(sum(all, 'paid') + sum(all, 'paidco'));
    const accounts = labelAccts.map((a) => {
      const o = acc[a] || {};
      return {
        name: L[a], owner: ownerOf(a), wallet: short(a), balance: r0(Math.max(g2(S.bal, a), 0)), rlusd: liveBal[a] ? r0(liveBal[a].rlusd) : null, xrp: liveBal[a] ? r0(liveBal[a].xrp) : null,
        paid_out: a === C.OPS ? opsOut : 0, received: r0(o.paidco || 0),
        bought: r0(o.bought || 0), sold: r0(o.sold || 0), paid_rlusd: r0(o.payR || 0), paid_xrp: r0(o.payX || 0),
        pool_wlbn: r0(o.lpw || 0), pool_rlusd: r0(o.lpr || 0), pool_xrp: r0(o.lpx || 0),
      };
    }).sort((x, y) => y.balance - x.balance);
    // 풀에 넣은 양(순) — 누가
    const lpRows = [];
    const lpAdd = (who, list, t) => {
      const w = sum(list, 'lpw'), r = sum(list, 'lpr'), x = sum(list, 'lpx');
      if (Math.abs(w) + Math.abs(r) + Math.abs(x) >= 0.5) lpRows.push({ who, owner: t ? t.owner : null, label: t ? t.label : who, wlbn: r0(w), rlusd: r0(r), xrp: r0(x) });
    };
    for (const lab of Object.keys(perLabel)) {
      const t = tagged(labelOwner(lab), labelName(lab));
      lpAdd(t.full, labelAccts.filter((a) => L[a] === lab && acc[a]), t);
    }
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
  const whoOf = (a) => { const o = ownerOf(a); if (!o) return { who: short(a), owner: null, label: short(a) }; const t = tagged(o, acctLabel(a)); return { who: t.full, owner: o, label: t.label }; };
  const dayTop = {};
  for (const k of Object.keys(dayAgg)) {
    const top = (m) => Object.keys(m).map((a) => Object.assign(whoOf(a), { g: G[a] || 'other', w: r0(m[a][0]), rlusd: r0(m[a][1]), xrp: r0(m[a][2]) })).filter((x) => x.w > 0).sort((x, y) => y.w - x.w);
    const s = top(dayAgg[k].sell), b = top(dayAgg[k].buy);
    dayTop[k] = { sell: s.slice(0, 5), buy: b.slice(0, 5), sellers: s.length, buyers: b.length };
  }

  // 지금 풀의 몫 — 풀 지분 증표를 누가 들고 있나
  const lpShares = []; let lpCompany = 0, lpWell = 0, lpKw = 0, lpUser = 0, lpAll = 0;
  if (live.lp) {
    const agg = {};
    for (const pk of ['X', 'R']) {
      const P = live.lp[pk];
      if (!P || !(P.total > 0)) continue;
      for (const a of Object.keys(P.holders)) {
        const own = ownerOf(a), kind = own ? 'company' : (users.has(a) ? 'user' : 'other');
        const t = own ? tagged(own, labelName(L[a])) : null;
        const who = t ? t.full : (kind === 'user' ? NAME.user : '그 밖의 지갑');
        const o = agg[who] || (agg[who] = { X: 0, R: 0, kind, owner: own, label: t ? t.label : who });
        o[pk] += P.holders[a] / P.total;
      }
    }
    for (const who of Object.keys(agg)) {
      const o = agg[who], w = o.X * S.pools.X.w + o.R * S.pools.R.w;
      lpShares.push({ who, owner: o.owner, label: o.label, x_share: r4(o.X), x_wlbn: r0(o.X * S.pools.X.w), x_xrp: r0(o.X * S.pools.X.q), r_share: r4(o.R), r_wlbn: r0(o.R * S.pools.R.w), r_rlusd: r0(o.R * S.pools.R.q), wlbn: r0(w) });
      lpAll += w; if (o.kind === 'company') { lpCompany += w; if (o.owner === 'kweather') lpKw += w; else lpWell += w; } else if (o.kind === 'user') lpUser += w;
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
  const lab = (k) => { const t = tagged(labelOwner(k), labelName(k)); return [k, t.full, byLabel[k] || 0, t]; };
  const pos = [['locked', '잠금(에스크로)', locked], lab('treasury'), lab('seed'), lab('staking'), ['pools', '풀 두 곳', poolW], lab('match'), lab('kweather'), lab('bot'), lab('operations'), ['user', NAME.user, userW]];
  const known = pos.reduce((t, p) => t + p[2], 0);
  pos.push(['other', '그 밖의 지갑', Math.max(total - known, 0)]);
  const positions = pos.map((p) => ({ key: p[0], where: p[1], owner: p[3] ? p[3].owner : null, label: p[3] ? p[3].label : p[1], amount: r0(p[2]), share: total > 0 ? Math.round(p[2] / total * 1e6) / 1e6 : null }));

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
    lp_wellbian_share: lpAll > 0 ? r3(lpWell / lpAll) : null, lp_kweather_share: lpAll > 0 ? r3(lpKw / lpAll) : null,
    price_usd_dex: e.price_usd_dex ?? null, pool_value_rlusd: e.pool_value_rlusd ?? null, dex_h24_buys: e.dex_h24_buys ?? null, dex_h24_sells: e.dex_h24_sells ?? null,
    dex_h24_volume_usd: e.dex_h24_volume_usd ?? null, dex_liquidity_usd: e.dex_liquidity_usd ?? null, holders: e.holders ?? null, trustlines: e.trustlines ?? null,
    devices_total: e.devices_total ?? null, devices_active: e.devices_active ?? null, operators: e.operators ?? null, kweather_devices: e.kweather_devices ?? null,
    epoch_budget: e.epoch_budget ?? null, epoch_distributed: e.epoch_distributed ?? null, epoch_date: e.epoch_date ?? null, circulating: e.circulating ?? null,
  };
  // ── 건강 신호 · 선순환 고리 · 그날 요약
  const buildHealth = () => {
    const H = HEALTH, fullDays = daily.filter((r) => !r.partial && r.date >= C.POOL_OPEN);
    const W = fullDays.slice(-H.days), P = fullDays.slice(-2 * H.days, -H.days);
    if (W.length < 3) return null;
    const base = fullDays[fullDays.length - W.length - 1] || null;     // 창 바로 앞 날(가격 · 풀의 출발 값)
    const from = W[0].date, to = W[W.length - 1].date, hasPrev = P.length === W.length;
    const pFrom = hasPrev ? P[0].date : null, pTo = hasPrev ? P[P.length - 1].date : null;
    const n = (x) => Math.round(x).toLocaleString('en-US');
    const p1 = (x) => (Math.abs(x) * 100).toFixed(1) + '%', sp = (x) => (x < 0 ? '−' : '+') + p1(x);
    const f4 = (x) => Number(x).toFixed(4), d1 = (x) => (x >= 100 ? n(x) : String(Math.round(x * 10) / 10));
    const sumOf = (rows, f) => rows.reduce((t, r) => t + (r[f] || 0), 0), inWin = (k, a, b) => k >= a && k <= b;
    const place = (v, T) => {
      const seg = (a, b) => (b > a ? Math.min(1, Math.max(0, (v - a) / (b - a))) : 1);
      return v < T[1] ? seg(T[0], T[1]) / 3 : v < T[2] ? (1 + seg(T[1], T[2])) / 3 : (2 + seg(T[2], T[3])) / 3;
    };
    const mk = (key, name, ask, v, T, o) => {
      const ok = v !== null && v !== undefined && isFinite(v);
      return Object.assign({ key, name, ask, status: !ok ? 'na' : v < T[1] ? 'bad' : v < T[2] ? 'warn' : 'ok', pos: ok ? r3(place(v, T)) : 0 }, o);
    };

    // 원장 기록에서 창 안의 값
    const firstPaid = {}, paidW = new Set(), paidP = new Set(); let newW = 0, botR = 0, botX = 0, opsOut = 0;
    for (const e of EV) if (e.kind === 'paid' && e.g === 'user' && (!firstPaid[e.a] || e.k < firstPaid[e.a])) firstPaid[e.a] = e.k;
    for (const e of EV) {
      const inW = inWin(e.k, from, to);
      if (e.kind === 'paid' && e.g === 'user') { if (inW) paidW.add(e.a); else if (hasPrev && inWin(e.k, pFrom, pTo)) paidP.add(e.a); }
      if (!inW) continue;
      if (e.kind === 'buy' && e.g === 'bot') { botR += e.v[4] || 0; botX += e.v[5] || 0; }
      if (e.kind === 'paid' || e.kind === 'paidco') opsOut += e.v[0];
    }
    for (const a of Object.keys(firstPaid)) if (inWin(firstPaid[a], from, to)) newW++;
    const paid = sumOf(W, 'paid_user'), sold = sumOf(W, 'sell_user'), pPaid = sumOf(P, 'paid_user'), pSold = sumOf(P, 'sell_user');
    const payDays = W.filter((r) => r.paid_user > 0).length, botBuy = sumOf(W, 'buy_bot');
    const sellX = sumOf(W, 'sell_total') - sumOf(W, 'sell_arb');                                   // 사고팔기 지갑을 뺀 판 양
    const buyOut = sumOf(W, 'buy_user') + sumOf(W, 'buy_other');                                   // 밖에서 산 양
    const end = W[W.length - 1], start = base || W[0], rate = S.pR && S.pX ? S.pR / S.pX : 0;
    const quote = (r) => (r.pool_r_rlusd === null || r.pool_x_xrp === null ? null : r.pool_r_rlusd + r.pool_x_xrp * rate);
    const q0 = quote(start), q1 = quote(end), lpNet = sumOf(W, 'lp_user');
    const pr0 = start.price_rlusd, pr1 = end.price_rlusd, prs = W.map((r) => r.price_rlusd).filter((x) => x !== null);
    const trim = (t) => t.replace('.0%', '%'), tp = (x) => trim(p1(x)), ts = (x) => (x === 0 ? '0%' : trim(sp(x)));   // 경계값 표기
    const tick = (T, f) => [f(T[1]), f(T[2])];

    const links = [];
    const dj = hasPrev && paidP.size ? paidW.size / paidP.size - 1 : null;
    links.push(mk('join', '참여', '보상을 받는 지갑이 늘고 있나', dj, H.join, {
      value: dj === null ? '—' : sp(dj), metric: '보상 받은 지갑 수 · 직전 7일 대비', ticks: tick(H.join, ts),
      read: '지갑 ' + n(paidW.size) + '곳이 보상을 받았다' + (hasPrev ? '(직전 7일 ' + n(paidP.size) + '곳)' : '') + '. 처음 받은 지갑은 ' + n(newW) + '곳이다.',
      short: '보상 받은 지갑 ' + n(paidW.size) + '곳' + (dj === null ? '' : '(' + sp(dj) + ')'),
    }));
    links.push(mk('pay', '보상', '지급이 끊기지 않았나', payDays + (H.days - W.length), H.pay, {
      value: payDays + '일', metric: W.length + '일 가운데 지급된 날', ticks: [H.pay[1] + '일', H.pay[2] + '일'],
      read: '하루 평균 ' + n(paid / W.length) + '개가 일반 사용자 지갑으로 지급됐다' + (hasPrev ? '(직전 7일 ' + n(pPaid / P.length) + '개)' : '') + '.',
      short: W.length + '일 가운데 ' + payDays + '일 지급',
    }));
    const sr = paid > 0 ? sold / paid : null;
    links.push(mk('hold', '보유', '받은 만큼 들고 있나', sr === null ? null : 1 - sr, H.hold, {
      value: sr === null ? '—' : p1(sr), metric: '받은 양 가운데 판 비율', ticks: [tp(1 - H.hold[1]), tp(1 - H.hold[2])],
      read: '받은 ' + n(paid) + '개 가운데 ' + n(sold) + '개를 팔았다' + (hasPrev && pPaid > 0 ? '. 직전 7일은 ' + p1(pSold / pPaid) + '였다' : '') + '.',
      short: sr === null ? '받은 양이 없다' : '받은 양의 ' + p1(sr) + '를 팔았다',
    }));
    const dq = q0 && q1 !== null ? q1 / q0 - 1 : null;
    links.push(mk('pool', '유동성', '풀이 깊어지고 있나', dq, H.pool, {
      value: dq === null ? '—' : sp(dq), metric: '두 풀에 든 RLUSD · XRP 변화', ticks: tick(H.pool, ts),
      read: dq === null ? '풀 기록이 모자라다.' : 'RLUSD 풀의 RLUSD ' + n(start.pool_r_rlusd) + ' → ' + n(end.pool_r_rlusd) + ', XRP 풀의 XRP ' + n(start.pool_x_xrp) + ' → ' + n(end.pool_x_xrp) + '. 일반 사용자 지갑이 풀에 넣은 양(순) ' + (lpNet < 0 ? '−' : '+') + n(Math.abs(lpNet)) + ' WLBN.',
      short: dq === null ? '풀 기록이 모자라다' : '풀에 든 RLUSD · XRP ' + sp(dq),
    }));
    const dm = sellX > 0.5 ? buyOut / sellX : null;
    links.push(mk('demand', '수요', '판 양을 밖에서 사 주나', dm, H.demand, {
      value: dm === null ? '—' : p1(dm), metric: '판 양 가운데 밖에서 산 비율', ticks: tick(H.demand, tp),
      read: '판 양 ' + n(sellX) + '개, 밖에서 산 양 ' + n(buyOut) + '개(사고팔기 지갑 제외). ' + (botBuy > 0 ? 'Wellbian bot 계정이 ' + n(botBuy) + '개를 샀다.' : 'Wellbian bot 계정은 사지 않았다.'),
      short: dm === null ? '판 양이 없다' : '판 양의 ' + p1(dm) + '만 밖에서 샀다',
    }));
    const dp = pr0 && pr1 ? pr1 / pr0 - 1 : null;
    links.push(mk('price', '가격', '값이 버티고 있나', dp, H.price, {
      value: dp === null ? '—' : sp(dp), metric: W.length + '일 가격 변화', ticks: tick(H.price, ts),
      read: dp === null ? '가격 기록이 모자라다.' : f4(pr0) + ' → ' + f4(pr1) + ' RLUSD. 이 기간 최저 ' + f4(Math.min.apply(null, prs)) + ' · 최고 ' + f4(Math.max.apply(null, prs)) + '.',
      short: dp === null ? '가격 기록이 모자라다' : '가격 ' + sp(dp),
    }));

    // 운용 여력: 지금 잔액 ÷ 최근 하루 평균
    const reserves = [], ops = Math.max(g2(S.bal, C.OPS), 0), outDay = opsOut / W.length;
    const payRun = outDay > 0 ? ops / outDay : null;
    reserves.push(mk('payrun', '지급 여력', '지급 계정에 며칠 치가 남았나', payRun, H.runway, {
      value: payRun === null ? '—' : d1(payRun) + '일분', metric: '지급 계정 WLBN ÷ 하루 평균 지급', ticks: [H.runway[1] + '일', H.runway[2] + '일'],
      owner: 'wellbian', label: 'operations 계정',
      read: '지금 ' + n(ops) + '개가 있고, 최근 ' + W.length + '일 하루 평균 ' + n(outDay) + '개를 지급했다.',
      short: payRun === null ? '최근 지급이 없다' : '지급 계정 WLBN ' + d1(payRun) + '일분',
    }));
    const bots = Object.keys(G).filter((a) => G[a] === 'bot'), bl = bots.map((a) => liveBal[a]).filter(Boolean);
    const bR = bl.reduce((t, x) => t + (x.rlusd || 0), 0), bX = bl.reduce((t, x) => t + (x.xrp || 0), 0);
    const spendDay = (botR + botX * rate) / W.length, buyRun = bl.length && spendDay > 0 ? (bR + bX * rate) / spendDay : null;
    reserves.push(mk('buyrun', '매입 여력', 'bot 계정에 며칠 치가 남았나', buyRun, H.runway, {
      value: buyRun === null ? '—' : d1(buyRun) + '일분', metric: 'bot 잔액 ÷ 하루 평균 지출(RLUSD 환산)', ticks: [H.runway[1] + '일', H.runway[2] + '일'],
      owner: 'wellbian', label: 'bot 계정',
      read: !bl.length ? '지금 잔액을 받지 못했다.' : '지금 ' + n(bR) + ' RLUSD와 ' + n(bX) + ' XRP가 있고, ' + (spendDay > 0 ? '최근 ' + W.length + '일 하루 평균 ' + n(botR / W.length) + ' RLUSD와 ' + n(botX / W.length) + ' XRP를 썼다.' : '최근 ' + W.length + '일은 사지 않았다.'),
      short: buyRun === null ? (bl.length ? '최근 매수가 없다' : '잔액을 받지 못했다') : 'Wellbian bot 계정 잔액 ' + d1(buyRun) + '일분',
    }));

    // 종합: 빨강 둘 이상이면 주의, 빨강 하나 또는 노랑 둘 이상이면 지켜봄
    const cnt = { ok: 0, warn: 0, bad: 0, na: 0 }; for (const l of links) cnt[l.status]++;
    const overall = cnt.na === links.length ? 'na' : cnt.bad >= 2 ? 'bad' : (cnt.bad === 1 || cnt.warn >= 2) ? 'warn' : 'ok';
    const parts = ['초록 ' + cnt.ok]; if (cnt.warn) parts.push('노랑 ' + cnt.warn); if (cnt.bad) parts.push('빨강 ' + cnt.bad); if (cnt.na) parts.push('자료 없음 ' + cnt.na);
    const names = (st) => links.filter((l) => l.status === st).map((l) => l.name);
    const blocked = names('bad'), watch = names('warn');
    let headline = '선순환 여섯 고리 가운데 ' + parts.join(' · ') + '.';
    headline += blocked.length ? ' ' + blocked.join(' · ') + ' 고리가 막혀 있다.' : watch.length ? ' ' + watch.join(' · ') + ' 고리를 지켜볼 때다.' : ' 막힌 고리가 없다.';

    // 그날 요약: 마지막으로 하루가 다 찬 날 + 오늘 지금까지
    const comments = [], D = end, Dp = fullDays[fullDays.length - 2] || null, T = daily[daily.length - 1];
    let dBotR = 0, dBotX = 0; for (const e of EV) if (e.k === D.date && e.kind === 'buy' && e.g === 'bot') { dBotR += e.v[4] || 0; dBotX += e.v[5] || 0; }
    let c = md(D.date) + ' 하루: 일반 사용자 지갑은 ' + n(D.paid_user) + '개를 받고 ' + n(D.sell_user) + '개를 팔았다(판 지갑 ' + n(D.user_sellers) + '곳). ';
    c += D.buy_bot > 0 ? 'Wellbian bot 계정이 ' + n(D.buy_bot) + '개를 사는 데 ' + n(dBotR) + ' RLUSD와 ' + n(dBotX) + ' XRP를 썼다.' : 'Wellbian bot 계정은 사지 않았다.';
    if (Dp && Dp.price_rlusd && D.price_rlusd) c += ' 가격은 ' + f4(Dp.price_rlusd) + '에서 ' + f4(D.price_rlusd) + ' RLUSD로 ' + sp(D.price_rlusd / Dp.price_rlusd - 1) + '.';
    comments.push(c);
    if (T && T.partial) comments.push(md(T.date) + ' ' + kstamp(S.asof).slice(11) + '까지: 받은 양 ' + n(T.paid_user) + ' · 판 양 ' + n(T.sell_user) + (T.buy_bot > 0 ? ' · Wellbian bot 매수 ' + n(T.buy_bot) : '') + (T.price_rlusd ? ' · 가격 ' + f4(T.price_rlusd) + ' RLUSD' : '') + '.');
    comments.push('최근 ' + W.length + '일 하루 평균: 받은 양 ' + n(paid / W.length) + '개' + (hasPrev ? '(직전 7일 ' + n(pPaid / P.length) + '개)' : '') + ' · 판 양 ' + n(sold / W.length) + '개' + (hasPrev ? '(직전 7일 ' + n(pSold / P.length) + '개)' : '') + '.');
    const why = (st) => links.filter((l) => l.status === st).map((l) => l.name + ' — ' + l.short).join(' / ');
    if (blocked.length) comments.push('막힌 고리: ' + why('bad') + '.');
    if (watch.length) comments.push('지켜볼 고리: ' + why('warn') + '.');
    const low = reserves.filter((r) => r.status === 'bad' || r.status === 'warn');
    if (low.length) comments.push('여력: ' + low.map((r) => r.short + '(' + ST[r.status] + ')').join(' / ') + '.');

    const rng = (T, f) => ({ ok: f(T[2]) + ' 이상', warn: f(T[1]) + ' ~ ' + f(T[2]), bad: f(T[1]) + ' 미만' });
    const rules = [
      Object.assign({ name: '참여', metric: '보상 받은 지갑 수가 직전 7일보다 얼마나 늘었나' }, rng(H.join, ts)),
      { name: '보상', metric: '7일 가운데 일반 사용자 지갑으로 지급된 날 수', ok: H.pay[2] + '일 모두', warn: H.pay[1] + '~' + (H.pay[2] - 1) + '일', bad: H.pay[1] + '일 미만' },
      { name: '보유', metric: '받은 양 가운데 판 비율(판 양 ÷ 받은 양)', ok: tp(1 - H.hold[2]) + ' 이하', warn: tp(1 - H.hold[2]) + ' ~ ' + tp(1 - H.hold[1]), bad: tp(1 - H.hold[1]) + ' 초과' },
      Object.assign({ name: '유동성', metric: '두 풀에 든 RLUSD와 XRP(지금 환율로 합침)의 7일 변화' }, rng(H.pool, ts)),
      Object.assign({ name: '수요', metric: '판 양 가운데 Wellbian bot · 사고팔기 지갑 말고 다른 지갑이 산 비율' }, rng(H.demand, tp)),
      Object.assign({ name: '가격', metric: '7일 전 마감 가격 대비 변화' }, rng(H.price, ts)),
      { name: '여력 둘', metric: '지금 잔액 ÷ 최근 7일 하루 평균(지급 · 지출)', ok: H.runway[2] + '일분 이상', warn: H.runway[1] + ' ~ ' + H.runway[2] + '일분', bad: H.runway[1] + '일분 미만' },
    ];
    return {
      from, to, prev_from: pFrom, prev_to: pTo, days: W.length, day: D.date,
      overall: { status: overall, label: ST[overall], ok: cnt.ok, warn: cnt.warn, bad: cnt.bad, na: cnt.na, total: links.length, counts: parts.join(' · ') },
      headline, comments, links, reserves, rules, labels: ST,
    };
  };
  const health = buildHealth();

  const out = { summary: [summary], daily, ranges, positions, dayTop };
  if (health) out.health = health;
  if (lpShares.length) out.lpShares = lpShares;
  if (opts.showBefore) {
    const sumB = (aa, key) => aa.reduce((t, a) => t + g2(B[key], a), 0);
    const before = [];
    for (const g of ['user', 'sweep', 'arb', 'other', 'bot', 'kweather']) {
      const aa = accts.filter((a) => G[a] === g && a !== C.OPS && (g2(B.sold, a) + g2(B.bought, a) + g2(B.paid, a) + g2(B.paidco, a) > 0));
      if (!aa.length) continue;
      const r = { group: NAME[g], key: g, owner: GOWN[g] || null, label: GLAB[g] || NAME[g], wallets: aa.length, sold: r0(sumB(aa, 'sold')), bought: r0(sumB(aa, 'bought')) };
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
