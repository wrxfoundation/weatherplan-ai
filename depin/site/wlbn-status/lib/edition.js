'use strict';
// 상품판(외부 구독 서비스로 내는 판) 전환. 환경변수 EDITION=watch 이거나 넘길 묶음의 표식 파일(lib/edition-on.json)이 있을 때만 켜진다 — 켜지 않으면 내부 현황판 그대로이고 이 파일은 아무 일도 하지 않는다.
//   · 요금제(무료 · 라이트 · 스탠더드 · 프로)마다 열리는 구역이 다르다. **자료는 서버가 걸러서 준다** — 잠긴 구역의 자료는 응답에 넣지 않는다(화면에서만 가리는 것이 아니다)
//   · 이용권 = 운영자가 결제 뒤 건네는 글 한 줄. 요금제와 끝나는 날을 담고 WATCH_SECRET 으로 서명한다(scripts/mint-token.js 로 만든다). 서버는 서명과 날짜만 본다 — 회원 정보를 두지 않는다
//   · 상품판에 내지 않는 것: 부정 쪽 지갑 자금 추적(개인 지갑에 낙인이 될 수 있다) · 이전 풀 기간 표 · 발표 모드(긍정 지표만 모은 화면은 홍보로 읽힌다)
const crypto = require('crypto');

// 넘길 묶음에는 scripts/build-watch.js 가 lib/edition-on.json 을 넣는다 — 그 묶음은 환경변수를 빠뜨려도 상품판으로 돈다(모든 자료가 열린 채 나가는 일이 없게). 이 저장소에는 그 파일이 없다
let PINNED = false;
try { PINNED = require('./edition-on.json').watch === true; } catch (e) { PINNED = false; }
const ON = PINNED || process.env.EDITION === 'watch';
const PLANS = [
  { key: 'free', name: '무료', month: 0, year: 0, who: '가입 없이 보는 오늘 요약' },
  { key: 'lite', name: '라이트', month: 1900, year: 19000, who: '관심자 · 가볍게 보는 보유자' },
  { key: 'std', name: '스탠더드', month: 4900, year: 49000, who: '기기 구매자 · 보유자' },
  { key: 'pro', name: '프로', month: 9900, year: 99000, who: '여러 대 운영자 · 적극 보유자' },
];
const RANK = { free: 0, lite: 1, std: 2, pro: 3 };
// 구역 → 그 구역이 열리는 요금제(그 요금제부터). never = 상품판에는 내지 않는다
const SECTIONS = {
  sum: 'free', where: 'free', facts: 'free', notes: 'free',
  board: 'lite', today: 'lite', plan: 'lite',
  market: 'std', flow: 'std', daily: 'std', pool: 'std', wtable: 'std',
  accounts: 'pro', impact: 'pro', deep: 'pro', wallets: 'pro',
  trace: 'never', before: 'never',
};
const can = (plan, sec) => SECTIONS[sec] !== 'never' && RANK[SECTIONS[sec]] !== undefined && RANK[SECTIONS[sec]] <= (RANK[plan] || 0);

// RLUSD 결제(lib/pay.js · api/pay.js). 값 = 원화 정가 ÷ 고정 환율(WATCH_KRW_PER_RLUSD · 없으면 1,400 — 가정값, 운영자가 정한다), 센트 올림
const TERMS = { month: { days: 31, name: '1개월' }, year: { days: 366, name: '1년' } };
const payRate = () => { const r = Number(process.env.WATCH_KRW_PER_RLUSD); return r >= 100 && r <= 100000 ? r : 1400; };
const payCents = (plan, term) => { const p = PLANS.find((x) => x.key === plan); if (!p || !p.month || !TERMS[term]) return 0; return Math.ceil((term === 'year' ? p.year : p.month) * 100 / payRate() - 1e-9); };
// 받는 주소: 꼴뿐 아니라 검사 글자(체크섬)까지 본다 — 한 글자라도 틀린 주소로 주문이 나가면 보낸 돈을 찾을 수 없다
const B58 = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
function validAddress(a) {
  if (typeof a !== 'string' || !/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)) return false;
  let n = 0n, lead = 0;
  for (const ch of a) { const i = B58.indexOf(ch); if (i < 0) return false; n = n * 58n + BigInt(i); }
  while (lead < a.length && a[lead] === 'r') lead++;
  let hex = n.toString(16); if (hex.length % 2) hex = '0' + hex;
  const buf = Buffer.concat([Buffer.alloc(lead), n === 0n ? Buffer.alloc(0) : Buffer.from(hex, 'hex')]);
  if (buf.length !== 25 || buf[0] !== 0) return false;
  const sha = (b) => crypto.createHash('sha256').update(b).digest();
  return sha(sha(buf.subarray(0, 21))).subarray(0, 4).equals(buf.subarray(21));
}
const payAddr = () => { const a = String(process.env.WATCH_PAY_ADDRESS || '').trim(); return validAddress(a) ? a : ''; };
const payDemo = () => process.env.WATCH_PAY_DEMO === '1';
const payOn = () => !!process.env.WATCH_SECRET && (!!payAddr() || payDemo());
function payMeta() {
  const on = payOn(), prices = {}, c2 = (c) => (c / 100).toFixed(2);
  if (on) PLANS.forEach((p) => { if (p.month) prices[p.key] = { month: c2(payCents(p.key, 'month')), year: c2(payCents(p.key, 'year')) }; });
  return { on, live: !!payAddr(), demo: on && payDemo(), currency: 'RLUSD', rate: payRate(), prices, terms: { month: TERMS.month.name, year: TERMS.year.name } };      // 받는 주소는 여기 싣지 않는다(주문을 만들 때만 준다)
}

// 이용권: base64url(JSON{p: 요금제, x: 끝나는 때(유닉스 초), n: 메모}) + '.' + HMAC-SHA256
function sign(payload, secret) {
  if (!secret) throw new Error('WATCH_SECRET 이 없다');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + crypto.createHmac('sha256', secret).update(body).digest('base64url');
}
function verify(token, secret, nowSec) {
  if (!token || !secret || typeof token !== 'string' || token.length > 600) return { plan: 'free', state: token ? 'bad' : 'none' };
  const i = token.lastIndexOf('.'); if (i < 1) return { plan: 'free', state: 'bad' };
  const body = token.slice(0, i), mac = Buffer.from(token.slice(i + 1)), want = Buffer.from(crypto.createHmac('sha256', secret).update(body).digest('base64url'));
  if (mac.length !== want.length || !crypto.timingSafeEqual(mac, want)) return { plan: 'free', state: 'bad' };
  let p; try { p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (e) { return { plan: 'free', state: 'bad' }; }
  if (!p || RANK[p.p] === undefined || p.p === 'free' || !(p.x > 0)) return { plan: 'free', state: 'bad' };
  if (p.x < (nowSec || Math.floor(Date.now() / 1000))) return { plan: 'free', state: 'expired', exp: p.x };
  return { plan: p.p, state: 'ok', exp: p.x, note: typeof p.n === 'string' ? p.n : '' };
}
// 요청에서 이용권을 읽는다(Authorization: Bearer …). 주소에 붙이지 않는다 — 주소는 기록 · 보관본에 남는다
function who(req) {
  const h = (req && req.headers && (req.headers.authorization || req.headers.Authorization)) || '';
  const m = /^Bearer\s+(\S+)$/i.exec(String(h));
  return verify(m ? m[1] : '', process.env.WATCH_SECRET || '');
}

// 화면용 자료에서 그 요금제가 못 보는 구역의 자료를 뺀다. 받은 객체는 건드리지 않는다(얕게 베껴서 고친다)
function prune(out, plan, st) {
  const open = (id) => can(plan, id), o = Object.assign({}, out);
  delete o.trace;                                                    // 상품판에는 내지 않는다
  if (!open('today') && !open('board')) delete o.health;
  if (!open('market')) delete o.market;
  if (!open('deep')) delete o.deep;
  if (!open('plan')) { delete o.plan; delete o.unlock; }
  if (!open('daily')) { delete o.weekly; o.dayTop = {}; }
  if (!open('pool')) delete o.lpShares;
  if (!open('wtable')) o.walletDays = { days: ((out.walletDays || {}).days || []).slice(), w: {} };
  if (!open('board')) o.daily = [];                                  // 날짜별 자료는 모아보기(라이트)부터
  o.ranges = {};
  for (const k of Object.keys(out.ranges || {})) {
    if (k === 'custom' && !open('daily')) continue;                  // 날짜 지정은 스탠더드부터
    const R = Object.assign({}, out.ranges[k]);
    if (!open('flow')) { R.groups = []; R.flow = null; }
    if (!open('pool')) R.lp = [];
    if (!open('wtable')) { R.wallets = []; R.types = []; }
    if (!open('wtable') && !open('impact')) R.impact = null;         // 스탠더드는 지갑별 표가 기여 단계를 쓰므로 남긴다(구역만 잠근다)
    if (!open('wallets')) { R.dist = []; R.cohorts = []; R.conc = null; }
    if (!open('accounts')) R.accounts = [];
    o.ranges[k] = R;
  }
  // 전체 주소: 상품판에서는 lib/run.js 가 처음부터 넣지 않는다. 다른 길로 만든 자료가 들어와도 한 번 더 지운다(받은 객체는 그대로 두려고 베낀 것에서 지운다)
  let r = o;
  if (process.env.SHOW_ADDR === '1') {
    const strip = (v) => { if (Array.isArray(v)) v.forEach(strip); else if (v && typeof v === 'object') { delete v.addr; Object.keys(v).forEach((k) => strip(v[k])); } };
    r = JSON.parse(JSON.stringify(o)); strip(r);
  }
  r.edition = meta(plan, st);
  return r;
}
function meta(plan, st) {
  const ids = Object.keys(SECTIONS), pl = PLANS.find((p) => p.key === plan) || PLANS[0];
  return {
    on: true, name: process.env.WATCH_NAME || 'WLBN 워치', operator: process.env.WATCH_OPERATOR || '', plan: pl.key, plan_name: pl.name,
    exp: st && st.exp ? new Date(st.exp * 1000).toISOString().slice(0, 10) : null, exp_at: st && st.exp ? st.exp : null, key_state: (st && st.state) || 'none', demo_key: !!(st && st.state === 'ok' && st.note === 'demo'),
    plans: PLANS, sections: SECTIONS,
    locked: ids.filter((id) => SECTIONS[id] !== 'never' && !can(plan, id)), hidden: ids.filter((id) => SECTIONS[id] === 'never'),
    pay_url: process.env.WATCH_PAY_URL || '', origin: process.env.WATCH_ORIGIN || '', pay: payMeta(),
  };
}
module.exports = { ON, PLANS, RANK, SECTIONS, TERMS, can, sign, verify, who, prune, meta, payRate, payCents, payAddr, payDemo, payOn, validAddress };
