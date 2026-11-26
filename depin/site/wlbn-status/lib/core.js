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
  FUND_FROM: 107764000,                             // 판매 대금 기록을 받기 시작하는 원장(10/20 무렵)
};
const RIPPLE_EPOCH = 946684800;
const EPS = 1e-7;
const KEYS = ['sold', 'bought', 'cash', 'cash_r', 'cash_x', 'spent', 'spent_r', 'spent_x', 'lpw', 'lpq', 'lpr', 'lpx', 'paid', 'paidco', 'tin', 'tout', 'esc', 'burn'];
const GR = ['user', 'arb', 'other', 'bot', 'kweather', 'company'];
const NAME = {
  user: '일반 사용자 지갑', arb: '사고팔기 지갑', other: '그 밖의 지갑', bot: 'Wellbian bot 계정',
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
  sale: [-0.60, -0.30, 0, 0.60],       // 판매: 밖의 지갑이 operations 계정으로 보낸 RLUSD 변화(직전 7일 대비)
  join: [-0.30, -0.05, 0.05, 0.30],    // 보상: 보상 받은 지갑 수 변화(직전 7일 대비)
  pay: [0, 5, 7, 7],                   // 보상: 7일 가운데 지급된 날 수(끊기면 신호를 낮춘다)
  hold: [-0.50, 0.10, 0.50, 1.00],     // 보유: 받은 양 가운데 팔지 않은 비율 (= 1 − 판 비율)
  pool: [-0.30, -0.10, 0, 0.30],       // 유동성: 두 풀에 든 RLUSD · XRP 변화
  demand: [0, 0.50, 1.00, 2.00],       // 수요: 판 양 대비 산 양(밖의 지갑 + Wellbian bot, 사고팔기 지갑 제외)
  price: [-0.30, -0.15, -0.05, 0.30],  // 가격: 7일 변화
  runway: [0, 7, 30, 60],              // 여력: 잔액 ÷ 하루 평균(일)
  cover: [-3, -2, -1, 0],              // 매입 재원: −(매입 지출 ÷ 판매 대금). 판매 대금 안이면 좋음
  // 선순환 지수(0~100). 고리 점수: 주의 기준선 = bands[0]점, 좋음 기준선 = bands[1]점, 그 사이와 바깥은 비례.
  // 지수 = 지수에 넣는 고리(지금은 보상 · 보유 · 유동성 · 수요) 평균 × (1 − weak) + 가장 낮은 고리 × weak — 고리는 가장 약한 곳만큼만 돈다. trend = 추이에 넣는 날 수
  // weights: 고리별 가중치. 1 = 그대로 · 0 = 지수에서 뺀다(참고로만 보여 준다) · 0~1 사이 = 평균에서만 그만큼 세고 「가장 낮은 고리」로는 치지 않는다.
  //   판매 = 0 (11/23 서우 「판매매출이 부정확 — 카드매출도 있고 주말이슈도 있고 — 배점을 약화하거나 제외」): 원장에는 RLUSD 결제분만 남아 판매의 일부만 보이고,
  //   큰 건 한두 번 · 요일에 따라 7일 합이 크게 흔들린다. 카드 판매 자료를 같이 넣게 되면 1 로 되돌린다.
  //   가격 = 0 + plain (11/24 서우 「가격은 평가하지말자」 「선순환지수 가격고리 변경해」): 가격은 평가하지 않는다 — 지수에 넣지 않고 점수 · 좋음/주의도 매기지 않는다. 변화 숫자만 보여 준다.
  //   plain: 점수를 아예 매기지 않는 고리(참고 고리 가운데서도 숫자만 보여 주는 것)
  index: { bands: [40, 70], weak: 0.5, trend: 21, weights: { sale: 0, price: 0 }, plain: { price: 1 },
    why: { price: '가격은 평가하지 않는다. 변화 숫자만 보여 준다', sale: '원장에는 RLUSD로 결제한 판매만 남는다(카드 · 계좌 결제 제외). 판매의 일부만 보이고 큰 건 한두 번 · 요일에 따라 크게 흔들려 지수에는 넣지 않고 참고로만 보여 준다' } },
  // bot 계정에 RLUSD · XRP 를 보낸 적이 있는 계정(11/22 원장 확인: operations 60,000 RLUSD, treasury 22,000 RLUSD + 24,600 XRP)
  funders: ['operations', 'treasury'],
};
const ST = { ok: '좋음', warn: '지켜봄', bad: '주의', na: '자료 없음' };
// 지갑이 생태계에 도움을 주나 부담을 주나(11/22 서우 「도움 주는 유저와 악영향 주는 유저 구분」). 숫자는 여기 한 곳에서만 고친다.
// 가져간 돈 = WLBN 을 팔아 받은 돈(RLUSD 환산). 되돌린 돈 = WLBN 을 사며 낸 돈(RLUSD 환산) + operations 계정으로 보낸 RLUSD(다시 산 돈)
//   + 회사 계정(match · treasury 등)에 넣은 돈(XRP · RLUSD — 11/23 16차 · 서우 「다시 들어간 돈이라면 부정한 게 아니니」. 회사 계정 쪽 내역에서 읽는다: S.trace.dep).
//   도움: 받은 양의 절반 넘게 들고 있다 / 되돌린 돈이 가져간 돈 이상이다 / 풀에 넣어 두었다(판 양보다 많이)
//   부담: 받은 양의 90% 이상을 팔고 되돌린 돈이 가져간 돈의 10% 미만이다. 받은 기록이 없는 지갑은 「가진 양 가운데 판 비율」로 본다
//         = 판 양 ÷ (판 양 + 다른 지갑으로 옮긴 양 + 지금 잔액) — 옮겨 둔 물량은 판 것이 아니다(16차. 전에는 받은 기록 없이 팔기만 해도 부담이었다)
//   중간: 그 밖(일부만 판 지갑 · 두 풀 사이를 오가는 지갑 등)
// 카드 · 계좌로 다시 산 것은 원장에 없으므로, 그렇게 다시 산 지갑은 「부담」으로 잘못 보일 수 있다.
const IMPACT = { hold: 0.5, dump: 0.9, back: 0.1, lp: 100 };
const IMPACT_NAME = { help: '도움', mid: '중간', load: '부담' };
// 부정 쪽(부담) 지갑 자금 흐름 추적(lib/trace.js 가 하루 한 번 받아 S.trace 에 둔다 · 정리는 buildTrace)
//   depth: 지갑이 보낸 곳을 몇 단계까지 읽나(0 = 부정 쪽 지갑 · 1 · 2단계 계정의 내역을 읽으면 3단계 행선지까지 보인다)
//   pages: 단계별로 계정 하나에서 읽는 쪽 수(한 쪽 200건 — 넘으면 「거래가 많은 계정」) · keep: 계정마다 남기는 상대 수
//   min: 이 값(RLUSD 환산) 미만으로 보낸 곳은 더 따라가지 않는다 · caps: 단계별로 읽는 계정 수 상한
//   funders: 처음 채운 곳 · 돈을 보내 준 곳 가운데 「거래가 많은 계정」인지 살피는 수 · inMin: 이 값 이상 보내 준 곳만 살핀다
//   depPages: 회사 계정에 들어온 돈을 읽을 때 계정마다 읽는 쪽 수(날마다 쌓는다) · depPagesFull: 배포용 자료를 만들 때(처음부터 다시)
const TRACE = { depth: 3, pages: [10, 2, 2], keep: 12, conc: 6, min: 5, caps: [0, 30, 24], funders: 40, inMin: 50, depPages: 8, depPagesFull: 80 };
// ── 설계 대조(11/24 30차 — 서우 「백서나 토크노믹스에서 차용해서 반영할게 있음 반영해줘」)
//   공개 문서의 약속을 여기 한 곳에 옮겨 적고, 원장의 지금 값과 나란히 놓는다. 문서가 바뀌면 이 표만 고친다.
//   출처: 토크노믹스 정책(tokenomics.wellbianlabs.io · 배분표 v2 · 2026-10-02 개정) · 백서 초안 v1.1(paper.wellbianlabs.io · 2026-11-01 갱신 · 원장 기준일 2026-11-01 07:16 UTC). 읽은 날 2026-11-24.
//   백서 7장: 「정책 수치의 정본은 토크노믹스 정책 페이지이고, 원장 수치의 정본은 XRPL 원장이다」
const PLAN = {
  src: { tk: '토크노믹스 정책(배분표 v2 · 2026-10-02 개정본)', wp: '백서 초안 v1.1(2026-11-01 갱신본)', doc_day: '2026-11-01', read: '2026-11-24' },
  total: 1e10,
  // 배분표 v2. where = 백서 7.3(11/01 원장 기준)에 적힌 곳 · live = 이 화면의 「위치」에서 지금 값을 붙일 묶음
  alloc: [
    { key: 'r1', name: '노드 홀더 리워드 1기(Phase 1~5)', qty: 1e9, cond: '에폭마다 정량 방출 · Phase 1~5 누적 약 9.68억', where: '1기 · 2기 합쳐 에스크로 17건 45.68억(시간 8 · 게이트 조건 9)' },
    { key: 'r2', name: '노드 홀더 리워드 2기(Phase 6~)', qty: 3.6e9, cond: '1기 소진 뒤 단계 게이트를 통과하면 개방 · 열리지 않은 몫은 소각으로', where: '위와 같은 묶음' },
    { key: 'burn', name: '소각 예정', qty: 1.5e9, cond: '분할 방식은 따로 공지', where: '집행 전 · treasury 계정에 있다(백서 7.4)' },
    { key: 'resv', name: '전략 라운드 예비', qty: 1e9, cond: '배정 전까지 잠금 · 배정할 때 조건 공개', where: '에스크로 전략 묶음(2건 13.39억 · 조건) 가운데 10억' },
    { key: 'stake', name: '스테이킹 재원', qty: 8e8, cond: '방식은 추후 공지', where: '에스크로 48건 8억 · 2026-11-02~2030-10-02 매월 풀림', live: 'staking' },
    { key: 'team', name: '팀 · 기여자', qty: 6e8, cond: '12개월 클리프 + 48개월 선형', where: '에스크로 48건 6억 · 2027-11-02~2031-10-02 매월 풀림' },
    { key: 'eco', name: '생태계 · 지역 파트너', qty: 5e8, cond: '권역 진입 마일스톤마다 조건부 해제', where: '에스크로 5건 5억 · 조건' },
    { key: 'inv', name: '전략 투자', qty: 5e8, cond: '투자 계약 베스팅 · 시드 라운드는 즉시 10% + 7~24개월 월 5%', where: '에스크로: 전략 묶음의 잔여 3.39억 + 시드 투자자 18건 1.449억(2027-05-02~2028-10-02 매월)', live: 'seed' },
    { key: 'liq', name: '유동성 · 준비금', qty: 5e8, cond: '두 풀(WLBN/RLUSD · WLBN/XRP)의 초기 · 추가 예치', where: '에스크로 묶음에 없다 — treasury 계정 잔액에 든 것으로 보인다', live: 'pools' },
  ],
  escrow: { locked: 7951900000, n: 138 },                                    // 백서 7.3 — 11/01 에스크로 잠금
  burn: { planned: 1.5e9, device: 0.1, pass: 0.1, data: 0.5, doc_burned: 125.574954 },   // 매출 연동 매입 소각: 기기 10% · 이용권 10% · 데이터 매출 50%, 매월 집행 · 전량 소각
  reward: { base: 7, step: 0.78, grade: 1.2, best: 8.4, per_site: 7.14, cap: 10.5, emit: 2.665e9, tx: [0.8, 0.95] },
  pass: { per_day: 5, days: 1095 },                                         // AI 팩토리 이용권: 한 장당 하루 5개 · 3년(사이트 이용권 페이지 — content/site-canon-0910.md 「지급」 줄)
  sites: { phase1: 25000, goal: 1e6 },
  uptime: 0.8,                                                              // G4 조건: 3개월 가동률 80%
  pool_doc: { day: '2026-11-08', liq: 387860 },
  // 잠금 해제 달력: 원장의 에스크로를 백서 7.3 의 묶음(건수 · 합계 · 일정)에 맞추는 규칙. 받는 계정에 이름표가 있으면 label 로, 없으면 한 건 수량(each)으로 가린다. 어디에도 안 맞으면 「그 밖의 잠금」
  unlock: [
    { key: 'stake', name: '스테이킹 재원', short: '스테이킹', label: 'staking' },
    { key: 'reward', name: '노드 홀더 리워드', short: '노드 리워드', label: 'operations' },
    { key: 'seed', name: '시드 투자자', short: '시드', label: 'seed' },
    { key: 'team', name: '팀 · 기여자', short: '팀', each: [12500000] },
    { key: 'eco', name: '생태계 · 지역 파트너', short: '생태계', each: [100000000] },
    { key: 'resv', name: '전략 묶음', short: '전략', each: [1000000000, 339000000] },
  ],                             // 토크노믹스 11장: 두 풀 합산 유동성(2026-11-08 16:29 UTC)
  // 마일스톤 게이트(달력이 아니라 달성으로 넘어간다). n = 공급 조건의 지점 수(숫자로 적힌 것만)
  gates: [
    { g: 'G0', name: '출시 전', supply: '등록 · 검증 체계', demand: '유료 고객 1곳', etc: '' },
    { g: 'G1', name: '제네시스 출시', supply: '접수 개시', demand: '—', etc: '보상 가중: 품질' },
    { g: 'G2', name: '유동성 확보', supply: '초기 물량 판매', demand: '—', etc: 'XRPL DEX 풀 개방' },
    { g: 'G3', name: '수요 입증', supply: 'NFT 5,000개', n: 5000, demand: 'B2B 계약 3건 + 재구매', etc: '보상 가중에 희소성 추가 · 유동성 추가 예치' },
    { g: 'G4', name: '완판', supply: 'NFT 25,000개 · 3개월 가동률 80%', n: 25000, demand: '국내 매출', etc: '유동성 추가 예치' },
    { g: 'G5', name: '첫 해외', supply: '6만', n: 60000, demand: '해외 매출', etc: '' },
    { g: 'G6', name: '실외 라인', supply: '12만', n: 120000, demand: '연 매출 10억 원', etc: '보상 가중에 실사용 추가' },
    { g: 'G7', name: '소각 시작', supply: '22만', n: 220000, demand: '연 매출 20억 원', etc: '소각 시작' },
    { g: 'G8', name: '전환', supply: '35만', n: 350000, demand: '연 매출 40억 원', etc: '소각 본격화' },
    { g: 'G9', name: '자립', supply: '65만', n: 650000, demand: '사업 매출로 보상 전액', etc: '' },
    { g: 'G10', name: '성숙', supply: '100만', n: 1000000, demand: '잉여 매출', etc: '' },
  ],
};
const TRACE_KIND = { exch: '거래소 입금으로 보이는 주소', hub: '거래가 많은 계정', ours: '지갑별 표의 다른 지갑', root: '다른 부정 쪽 지갑', company: '회사 계정', other: '표에 없는 다른 주소', kept: '받은 지갑에 머묾', back: '보낸 지갑으로 되돌아옴', pool: '풀', issuer: '발행 계정' };
const TRACE_ORIGIN = { reward: '보상으로 받음', bought: '풀에서 삼', moved: '다른 지갑에서 옮겨 받음', none: '기록 없음' };
const TRACE_SIDE = { help: '긍정 쪽', mid: '보통', load: '부정 쪽' };      // 화면은 다섯 단계로 보여 주므로 글에서는 쪽으로만 부른다
const TRACE_ORDER = ['exch', 'hub', 'ours', 'root', 'company', 'kept', 'other', 'back', 'pool', 'issuer'];
// 원장으로 볼 수 없는 것. 화면 곳곳의 「집계 한계」 글이 이 문장을 쓴다.
const LIMIT_CARD = '카드 · 계좌로 결제한 기기와 이용권은 원장에 기록되지 않는다. 여기서 「판매 대금」은 RLUSD로 결제된 것만이라 실제 판매보다 적다.';

function kday(sec) { return new Date((sec + RIPPLE_EPOCH + 9 * 3600) * 1000).toISOString().slice(0, 10); }
function kstamp(sec) { return new Date((sec + RIPPLE_EPOCH + 9 * 3600) * 1000).toISOString().slice(0, 16).replace('T', ' '); }
function md(k) { return String(+k.slice(5, 7)) + '/' + String(+k.slice(8, 10)); }
function add(o, k, v) { o[k] = (o[k] || 0) + v; }

function newState() {
  const period = () => { const o = {}; KEYS.forEach((k) => { o[k] = {}; }); return o; };
  return {
    v: 4, ledger: 0, asof: 0, bal: {}, st: { before: period(), now: period() }, lastSell: {}, edges: {}, amms: {}, paidN: {}, tf: {},      // v4: tf = 날짜가 붙은 지갑 간 이동
    firstPaid: {}, firstSell: {}, swept: {}, repay: {},     // 지갑마다: 처음 보상받은 날 · 처음 판 날 · 10/24 에 옮겨진 양 · 10/26~27 첫 지급량
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
    // 날짜가 붙은 이동 기록(지금 기간): 그날|보낸 곳|받은 곳 → 양. 지급 계정이 보낸 것은 paid · paidco 로 따로 적으므로 뺀다. 받은 곳이 비면 원장 밖으로 나간 양(소각 · 수수료)
    if (per === 'now') {
      const tf = S.tf || (S.tf = {});
      if (src && src !== C.OPS) { let got = 0; for (const [a, v] of pos) { add(tf, k + '|' + src + '|' + a, v[0]); got += v[0]; } const gap = -neg[0][1][0] - got; if (gap > EPS) add(tf, k + '|' + src + '|', gap); }
      else if (!src) { for (const [a, v] of pos) add(tf, k + '||' + a, v[0]); for (const [a, v] of neg) add(tf, k + '|' + a + '|', -v[0]); }
    }
    for (const [a, v] of pos) {
      if (src === C.OPS && !S.labels[a]) {
        add(P.paid, a, v[0]); add(S.paidN, per + '|' + a, 1); ev(a, 'paid', [v[0]]);
        if (!S.firstPaid[a]) { S.firstPaid[a] = k; if (k >= C.NOW_FROM && k <= C.POOL_OPEN) S.repay[a] = v[0]; }
      }
      else { add(P.tin, a, v[0]); if (src === C.OPS) { add(P.paidco, a, v[0]); ev(a, 'paidco', [v[0]]); } }
      if (src) (S.edges[src] || (S.edges[src] = {}))[a] = 1;
      if (a === C.SWEEP && src && per === 'before') add(S.swept, src, v[0]);
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
      S.lastSell[a] = k; if (!S.firstSell[a]) S.firstSell[a] = k; ev(a, 'sell', [w, Math.max(val, 0), sR * w / sellW, sX * w / sellW, Math.max(v[1], 0), Math.max(v[2], 0)]);
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
// 지급 계정(operations)으로 들어오고 나간 RLUSD · XRP 를 날짜별로 쌓는다(계정 거래 내역을 따로 받는다).
// 밖의 지갑(이름 붙은 계정 · 풀이 아닌 곳)이 보낸 RLUSD = 판매 대금으로 본다. p = 보낸 지갑별 금액, o = 밖으로 나간 RLUSD.
function newFund() { return { ledger: C.FUND_FROM - 1, day: {} }; }
function applyFundTx(S, tx, meta) {
  if (!meta || meta.TransactionResult !== 'tesSUCCESS') return;
  const { d, amms } = deltas(tx, meta);
  for (const a of amms) S.amms[a] = 1;
  const me = d.get(C.OPS);
  if (!me) return;
  const k = kday(tx.date), F = S.fund;
  for (const i of [1, 2]) {
    const v = me[i];
    if (Math.abs(v) < (i === 2 ? 0.5 : 0.01)) continue;
    let peer = null, pv = 0;                       // 상대: 같은 거래에서 반대쪽으로 가장 크게 움직인 계정
    for (const [a, w] of d) { if (a !== C.OPS && w[i] * v < 0 && Math.abs(w[i]) > pv) { pv = Math.abs(w[i]); peer = a; } }
    if (peer && (S.labels[peer] || S.amms[peer])) continue;
    const m = F.day[k] || (F.day[k] = { r: 0, x: 0, n: 0, p: {}, o: 0 });
    if (v > 0) { if (i === 1) { m.r += v; m.n++; if (peer) m.p[peer] = (m.p[peer] || 0) + v; } else m.x += v; }
    else if (i === 1) m.o -= v;
  }
}
function applyFundBatch(S, items) {
  if (!S.fund) S.fund = newFund();
  const seen = new Set(), list = [];
  for (const t of items) { const n = normalize(t); if (!n || seen.has(n.hash)) continue; seen.add(n.hash); list.push(n); }
  list.sort((a, b) => (a.li - b.li) || (a.ti - b.ti));
  for (const n of list) applyFundTx(S, n.tx, n.meta);
  return list.length;
}

// ── 온체인 심층: 다른 코인 분석 사이트들이 보는 지표를 WLBN 원장 기록으로 옮길 때의 기준
const DEEP = {
  ages: [[7, 'b7', '7일 이내'], [14, 'b14', '8~14일'], [30, 'b30', '15~30일'], [90, 'b90', '31~90일'], [Infinity, 'b91', '91일 이상']],   // 보유 기간 띠(일)
  sizes: [[100, 's1', '100개 미만'], [1000, 's2', '100~1천 개'], [10000, 's3', '1천~1만 개'], [Infinity, 's4', '1만 개 이상']],       // 지갑 크기(WLBN)
  // 벤치마킹 대조: 원래 지표 · 주로 쓰는 곳 → 우리식 이름 · 상태(옮김 / 이미 있음 / 해당 없음)
  bench: [
    ['HODL Waves', 'Glassnode 등', '보유 기간 띠', '옮김', '코인이 마지막으로 움직인 뒤 지난 기간별 물량 → 지갑이 받은 뒤 들고 있는 기간별 물량'],
    ['Realized Price · MVRV', 'Glassnode · CryptoQuant', '평균 취득가 · 지금 값 ÷ 평균 취득가', '옮김', '마지막으로 움직인 날의 값 → 받은 날(산 날)의 값'],
    ['In/Out of the Money · Supply in Profit', 'IntoTheBlock · Glassnode', '받은 때보다 높은 값에 있는 물량', '옮김', '주소 수가 아니라 물량 기준'],
    ['SOPR', 'Glassnode · CryptoQuant', '판 값 ÷ 받은 때 값', '옮김', '1보다 크면 받은 때보다 높은 값에 팔았다'],
    ['Coin Days Destroyed · Age Consumed', 'Glassnode · Santiment', '판 물량의 평균 보유 기간', '옮김', '오래 들고 있던 물량이 나왔는지'],
    ['Supply Distribution · Concentration', 'Santiment · IntoTheBlock', '크기별 보유', '옮김', '달러 기준 대신 WLBN 수량 띠'],
    ['Accumulation Trend Score', 'Glassnode', '늘린 물량 비중', '옮김(단순화)', '최근 7일 늘린 양 ÷ (늘린 양 + 줄인 양)'],
    ['Daily Active Addresses · Network Growth', 'Santiment · Glassnode', '움직인 지갑 · 새 지갑', '옮김', '보상만 받은 지갑은 「움직인」에 넣지 않는다'],
    ['Exchange Reserve · Netflow', 'CryptoQuant', '풀에 든 양 · 판 양 − 산 양', '이미 있음', '거래소가 없어 풀로 본다(「풀」 · 「날짜별」)'],
    ['Smart Money · Entity labels', 'Nansen · Arkham', '소속 칩 · 지갑 유형 · 도움/부담', '이미 있음', '이름 붙은 계정은 wellbian.io 공개분만'],
    ['Fear & Greed · Bull-Bear 지수', 'alternative.me · CryptoQuant', '선순환 지수', '이미 있음', '시장 심리가 아니라 순환이 도는지'],
    ['Funding · Open Interest · Liquidations', 'Coinglass 등', '—', '해당 없음', '파생 시장이 없다'],
    ['ETF · 채굴자 흐름', 'Farside · CryptoQuant', '—', '해당 없음', '해당 상품 · 채굴이 없다'],
    ['Social Volume · Sentiment', 'Santiment 등', '—', '안 옮김', '원장 밖 자료 · 외부 집계는 쓰지 않는다'],
  ],
};

// ── 시장과 견주기(주요 코인 10종 · 전체 시장). 받은 값만 상태(S.mkt)에 남긴다 — 못 받으면 마지막으로 받은 값을 쓴다
const MARKET = {
  top: 10, retryMin: 60, keepDays: 400,
  // 다른 코인을 포장 · 예치한 것은 뺀다(값이 원래 코인을 그대로 따른다). 달러 고정 코인은 값으로 걸러 낸다
  skip: /^(steth|wsteth|wbtc|weth|wbeth|weeth|cbbtc|cbeth|reth|ezeth|rseth|meth|lbtc|solvbtc|btcb|bnsol|jitosol|msol|susde|susds)$/i,
};
function pickMarket(S, ext, nowMs) {
  const M = S.mkt || (S.mkt = { now: null, hist: {}, tried: 0 });
  if (!M.hist) M.hist = {};
  const t = ext && ext.tickers, g = ext && ext.cglobal;
  try {
    if (Array.isArray(t) && t.length) {
      const coins = [];
      for (const x of t.slice().sort((a, b) => a.rank - b.rank)) {
        const q = x && x.quotes && x.quotes.USD; if (!q || !(q.price > 0) || !(x.rank > 0)) continue;
        const stable = Math.abs(q.price - 1) < 0.03 && Math.abs(q.percent_change_30d || 0) < 2.5;
        if (stable || MARKET.skip.test(x.symbol)) continue;
        coins.push({ id: x.id, sym: x.symbol, name: x.name, rank: x.rank, price: q.price, mc: q.market_cap, d1: q.percent_change_24h / 100, d7: q.percent_change_7d / 100, d30: q.percent_change_30d / 100 });
        if (coins.length >= MARKET.top) break;
      }
      if (coins.length >= 5) M.now = Object.assign(M.now || {}, { at: nowMs || Date.now(), coins });
    }
  } catch (_) { /* keep last */ }
  try { if (g && g.market_cap_usd > 0 && M.now) M.now.global = { mc: g.market_cap_usd, btc_dom: g.bitcoin_dominance_percentage / 100, d1: g.market_cap_change_24h / 100 }; } catch (_) { /* keep last */ }
  return !!(M.now && M.now.coins && M.now.coins.length);
}
// 일별 기록(UTC 0시 값)이 모자란 코인과 받을 시작 날. 한 번 물은 뒤에는 retryMin 분 동안 다시 묻지 않는다
function marketNeeds(S, nowMs) {
  const M = S.mkt; if (!M || !M.now || !M.now.coins) return null;
  const now = nowMs || Date.now(), need = new Date(now - 30 * 60000).toISOString().slice(0, 10), out = [];
  if (now - (M.tried || 0) < MARKET.retryMin * 60000) return null;
  const dates = Object.keys(M.hist).sort();
  for (const c of M.now.coins) {
    if (M.hist[need] && M.hist[need][c.sym]) continue;
    let have = null; for (let i = dates.length - 1; i >= 0; i--) if (M.hist[dates[i]][c.sym]) { have = dates[i]; break; }
    out.push({ id: c.id, sym: c.sym, start: have || C.POOL_OPEN });
  }
  return out.length ? out : null;
}
function mergeHistory(S, sym, rows) {
  const M = S.mkt; let n = 0;
  if (!M || !Array.isArray(rows)) return 0;
  for (const r of rows) {
    const d = String((r && r.timestamp) || '').slice(0, 10); if (!/^\d{4}-\d\d-\d\d$/.test(d) || !(r.price > 0)) continue;
    const o = M.hist[d] || (M.hist[d] = {}); if (!o[sym] || o[sym][0] !== r.price) n++;
    o[sym] = [r.price, r.market_cap || 0];
  }
  const dates = Object.keys(M.hist).sort(); for (const d of dates.slice(0, Math.max(0, dates.length - MARKET.keepDays))) delete M.hist[d];
  return n;
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

// ── 웹 언급 · 소셜(38차): lib/buzz.js 가 하루 한 번 받아 S.buzz 에 둔 것을 화면용으로 정리한다. 기준 시각 = 받은 때(B.at). 판정 없이 숫자만
//   웹: 제목에 이름이 든 기사 수(최근 30일 · 그 앞 30일 · 최근 90일) · 주별 16주 · 최근 기사
//   소셜 지수: 「최근 ÷ 평소」를 갈래(웹 언급 수 · 채널 공지 글 수 · 글당 조회 수 — 최근 30일 ÷ 그 앞 60일의 한 달 평균 / wellbian.io 가 공개한 보상 대상 기기 수 — 쌓인 날에 따라 7일 ÷ 7일 또는 30일 ÷ 60일)마다 구해, 같으면 50 · 두 배 이상이면 100 으로 놓고 평균한다. 견줄 값이 없는 갈래는 뺀다
function buildBuzz(S) {
  const B = S.buzz; if (!B || !B.at) return null;
  const now = B.at, DAY = 86400, kd = (t) => new Date((t + 9 * 3600) * 1000).toISOString().slice(0, 10), out = {};
  const weeksOf = (list) => { const w = []; for (let i = 15; i >= 0; i--) { const to = now - i * 7 * DAY, from = to - 7 * DAY; w.push({ date: kd(from + DAY), from: kd(from + DAY), to: kd(to), n: list.filter((x) => x.at > from && x.at <= to).length }); } return w; };
  const items = Object.keys((B.web && B.web.items) || {}).map((id) => { const v = B.web.items[id]; return { at: v[0], title: v[1], src: v[2], url: v[3] }; }).filter((x) => x.at > now - 365 * DAY && x.at <= now + DAY).sort((a, b) => b.at - a.at);
  const cnt = (from, to) => items.filter((x) => x.at > now - from * DAY && x.at <= now - to * DAY).length;
  if (B.web && B.web.at) {
    const d90 = items.filter((x) => x.at > now - 90 * DAY);
    out.web = { at: kd(B.web.at), d30: cnt(30, 0), p30: cnt(60, 30), d90: d90.length, srcs90: new Set(d90.map((x) => x.src)).size, year: items.length, last: items.length ? kd(items[0].at) : null, weeks: weeksOf(items), items: items.slice(0, 12).map((x) => ({ date: kd(x.at), src: x.src, title: x.title, url: x.url })) };
  }
  const tg = B.tg && B.tg.at ? B.tg : null, site = B.site && B.site.at ? B.site : null;
  if (tg || site) {
    const posts = tg ? Object.keys(tg.posts || {}).map((id) => ({ id: Number(id), at: tg.posts[id][0], views: tg.posts[id][1] })).sort((a, b) => b.at - a.at) : [];
    const win = (from, to) => posts.filter((p) => p.at > now - from * DAY && p.at <= now - to * DAY);
    const med = (list) => { const v = list.map((p) => p.views).filter((x) => x !== null && x !== undefined).sort((a, b) => a - b); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : Math.round((v[v.length / 2 - 1] + v[v.length / 2]) / 2)) : null; };
    const r30 = win(30, 0), b60 = win(90, 30), parts = [], W36 = '최근 30일 ÷ 그 앞 60일의 한 달 평균';
    const add = (key, name, unit, a, b, w) => parts.push({ key, name, unit, now: a, base: b, win: w, ratio: a !== null && b !== null && b > 0 ? a / b : null });
    add('web', '웹 언급 수', '건', out.web ? out.web.d30 : null, out.web ? cnt(90, 30) / 2 : null, W36);
    if (tg) { add('posts', '채널 공지 글 수', '건', r30.length, b60.length / 2, W36); add('views', '글당 조회 수(가운데 값)', '회', med(r30), med(b60), W36); }
    // wellbian.io 공개 값: 날짜별 보상 대상 기기 수의 하루 평균. 쌓인 날이 90일이 되면 30일 ÷ 60일, 그 전에는 최근 7일 ÷ 그 앞 7일(14일 치가 있어야 견준다)
    let siteOut = null;
    if (site) {
      const eds = Object.keys(site.epochs || {}).sort(), ev = eds.map((d) => site.epochs[d][0]), avg = (a) => Math.round(a.reduce((x, y) => x + y, 0) / a.length);
      if (ev.length >= 90) add('nodes', '보상 대상 기기 수(하루 평균)', '대', avg(ev.slice(-30)), avg(ev.slice(-90, -30)), '최근 30일 ÷ 그 앞 60일');
      else if (ev.length >= 14) add('nodes', '보상 대상 기기 수(하루 평균)', '대', avg(ev.slice(-7)), avg(ev.slice(-14, -7)), '최근 7일 ÷ 그 앞 7일');
      else add('nodes', '보상 대상 기기 수(하루 평균)', '대', ev.length ? avg(ev) : null, null, '견줄 날이 모자란다(14일 치부터)');
      const days = Object.keys(site.log || {}).sort(), f = days.length ? site.log[days[0]] : null, nz = (v) => (v === undefined ? null : v);
      siteOut = {
        at: kd(site.at), devices_total: nz(site.devices_total), devices_active: nz(site.devices_active), operators: nz(site.operators), earners: nz(site.earners), holders: nz(site.holders), trustlines: nz(site.trustlines), claims: nz(site.claims),
        epochs: eds.slice(-30).map((d) => ({ date: d, nodes: site.epochs[d][0], distributed: site.epochs[d][1] })), days: days.length,
        first: f ? { date: days[0], devices_total: f[0], devices_active: f[1], operators: f[2], earners: f[3], holders: f[4], trustlines: f[5], claims: f[6] } : null,
      };
    }
    const sc = parts.filter((p) => p.ratio !== null).map((p) => Math.min(100, 50 * p.ratio));
    const log = tg ? Object.keys(tg.log || {}).sort().map((d) => ({ date: d, subs: tg.log[d][0], members: tg.log[d][1] })) : [];
    out.social = {
      at: kd(Math.max(tg ? tg.at : 0, site ? site.at : 0)), index: sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : null, parts, used: sc.length, has_tg: !!tg,
      subs: tg && tg.subs !== undefined ? tg.subs : null, members: tg && tg.members !== undefined ? tg.members : null, online: tg && tg.online !== undefined ? tg.online : null,
      posts30: r30.length, posts_prev60: b60.length, views_med: med(posts.slice(0, 10)), last_post: posts.length ? kd(posts[0].at) : null,
      weeks: weeksOf(posts), log, channel: (tg && tg.channel) || '', group: (tg && tg.group) || '', site: siteOut,
    };
  }
  return out;
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

  // 10/24 에 잔액이 옮겨진 옛 지갑과 10/26~27 에 처음 지급받은 새 지갑을 금액으로 잇는다(추정).
  // 두 쪽 모두에서 그 금액이 하나뿐일 때만 잇는다. 1,000개 이상은 0.1% 안쪽으로 하나만 맞아도 잇는다(그사이 하루치가 더해진 경우).
  const FP = S.firstPaid || {}, FS = S.firstSell || {}, linkOf = {};
  {
    const olds = Object.keys(S.swept || {}).filter((a) => !L[a]), news = Object.keys(S.repay || {}).filter((a) => !L[a]);
    const key = (v) => Math.round(v * 100), cO = {}, cN = {}, byN = {};
    for (const a of olds) add(cO, key(S.swept[a]), 1);
    for (const a of news) { add(cN, key(S.repay[a]), 1); byN[key(S.repay[a])] = a; }
    const usedO = new Set(), usedN = new Set();
    for (const o of olds) { const q = key(S.swept[o]); if (cO[q] === 1 && cN[q] === 1) { linkOf[byN[q]] = { old: o, exact: true }; usedO.add(o); usedN.add(byN[q]); } }
    for (const o of olds) {
      const v = S.swept[o]; if (usedO.has(o) || v < 1000) continue;
      const cn = news.filter((a) => !usedN.has(a) && Math.abs(S.repay[a] - v) <= v * 0.001);
      if (cn.length !== 1) continue;
      const co = olds.filter((x) => !usedO.has(x) && Math.abs(S.swept[x] - S.repay[cn[0]]) <= S.repay[cn[0]] * 0.001);
      if (co.length === 1) { linkOf[cn[0]] = { old: o, exact: false }; usedO.add(o); usedN.add(cn[0]); }
    }
  }
  const startOf = (a) => { const l = linkOf[a], f = FP[a] || null, o = l ? FP[l.old] || null : null; return o && (!f || o < f) ? o : f; };   // 옛 지갑까지 친 시작일
  const dayDiff = (x, y) => Math.round((Date.parse(y + 'T00:00:00Z') - Date.parse(x + 'T00:00:00Z')) / 86400000);

  // 날짜 · 지갑 · 종류별 기록을 풀어 둔다
  const EV = Object.keys(S.ev).map((key) => { const p = key.split('|'); return { k: p[0], a: p[1], kind: p[2], v: S.ev[key], g: G[p[1]] || 'other' }; });
  const lastDay = kday(S.asof), days = [];
  for (let t = Date.parse(C.NOW_FROM + 'T00:00:00Z'); ; t += 86400000) {
    const k = new Date(t).toISOString().slice(0, 10);
    if (k > lastDay) break;
    days.push(k);
  }

  // 판 양을 받은 통화로 나눈다: [RLUSD로 판 양, XRP로 판 양]. 지갑이 하루에 두 통화를 다 받았으면 대금(환산) 비율대로 나눈다.
  const byCur = (v) => {
    const gR = v[4] || 0, gX = v[5] || 0, vx = Math.max(v[1] - gR, 0);
    if (gX < 1e-6) return [v[0], 0];
    if (gR < 1e-6) return [0, v[0]];
    const wr = v[0] * gR / (gR + vx); return [wr, v[0] - wr];
  };

  // 날짜별
  const day = {}, sellers = {};
  const dget = (k) => day[k] || (day[k] = {});
  for (const e of EV) {
    const m = dget(e.k), v = e.v, g = e.g;
    if (e.kind === 'sell') {
      add(m, 'sell_' + g, v[0]); add(m, 'sell_total', v[0]); add(m, 'to_r', v[2] || 0); add(m, 'to_x', v[3] || 0);
      add(m, 'got_r', v[4] || 0); add(m, 'got_x', v[5] || 0);
      if (g === 'user') { const c2 = byCur(v); add(m, 'sell_user_r', c2[0]); add(m, 'sell_user_x', c2[1]); add(m, 'cash_user', v[1]); add(m, 'got_r_user', v[4] || 0); add(m, 'got_x_user', v[5] || 0); (sellers[e.k] || (sellers[e.k] = new Set())).add(e.a); }
    } else if (e.kind === 'buy') {
      add(m, 'buy_' + g, v[0]); add(m, 'buy_total', v[0]); add(m, 'from_r', v[2] || 0); add(m, 'from_x', v[3] || 0);
      if (g === 'user') add(m, 'spent_user', v[1]);
      if (g === 'bot') { add(m, 'bot_r', v[4] || 0); add(m, 'bot_x', v[5] || 0); }
    } else if (e.kind === 'paid' && g === 'user') add(m, 'paid_user', v[0]);
    else if (e.kind === 'lp' && g === 'user') add(m, 'lp_user', v[0]);
  }
  const FD = S.fund && S.fund.day ? S.fund.day : null, fundOk = !!(S.fund && S.fund.ledger >= S.ledger);   // 판매 대금 기록이 끝까지 왔나
  const daily = []; let cp = 0, cs = 0, lastp = null, lastx = null, lastPool = null;
  for (const k of days) {
    const v = day[k] || {}, f = (x) => v[x] || 0;
    cp += f('paid_user'); cs += f('sell_user') - f('buy_user');
    if (S.eod[k] !== undefined) lastp = S.eod[k];
    if (S.eodX[k] !== undefined) lastx = S.eodX[k];
    if (S.eodPool[k]) lastPool = S.eodPool[k];
    // 전체 풀 유동성: 풀에 든 자산을 양쪽 모두 RLUSD 로 환산한 값(wellbian.io 「보상 전환」의 「전체 풀 유동성」과 같은 기준).
    // 풀은 늘 양쪽 값이 같으므로 RLUSD · XRP 쪽의 두 배다. XRP 는 두 풀의 가격으로 계산한 그날 값으로 환산한다.
    const lqR = lastPool ? lastPool[1] * 2 : null, lqX = lastPool && lastp && lastx ? r0(lastPool[3] * (lastp / lastx) * 2) : null;
    const r = { date: k };
    for (const g of GR) { r['sell_' + g] = r0(f('sell_' + g)); r['buy_' + g] = r0(f('buy_' + g)); }
    Object.assign(r, {
      sell_total: r0(f('sell_total')), buy_total: r0(f('buy_total')), net_sell_total: r0(f('sell_total') - f('buy_total')),
      sell_user_rlusd: r0(f('sell_user_r')), sell_user_xrp: r0(f('sell_user')) - r0(f('sell_user_r')),
      net_sell_user: r0(f('sell_user') - f('buy_user')), cash_user_rlusd: r0(f('cash_user')), got_rlusd_user: r0(f('got_r_user')), got_xrp_user: r0(f('got_x_user')),
      user_sellers: sellers[k] ? sellers[k].size : 0, paid_user: r0(f('paid_user')), lp_user: r0(f('lp_user')),
      to_r: r0(f('to_r')), to_x: r0(f('to_x')), to_o: r0(Math.max(f('sell_total') - f('to_r') - f('to_x'), 0)),
      from_r: r0(f('from_r')), from_x: r0(f('from_x')), from_o: r0(Math.max(f('buy_total') - f('from_r') - f('from_x'), 0)),
      cum_paid_user: r0(cp), cum_net_sold_user: r0(cs),
      price_rlusd: lastp === null ? null : r4(lastp), price_xrp: lastx === null ? null : r4(lastx),
      xrp_rlusd: lastp && lastx ? r4(lastp / lastx) : null,     // 두 풀의 가격으로 계산한 1 XRP 의 RLUSD 값
      pool_r_wlbn: lastPool ? lastPool[0] : null, pool_r_rlusd: lastPool ? lastPool[1] : null, pool_x_wlbn: lastPool ? lastPool[2] : null, pool_x_xrp: lastPool ? lastPool[3] : null,
      pool_liq_r: lqR, pool_liq_x: lqX, pool_liq: lqR !== null && lqX !== null ? lqR + lqX : null,
      bot_pay_rlusd: r0(f('bot_r')), bot_pay_xrp: r0(f('bot_x')),
      sales_rlusd: FD ? r0((FD[k] || {}).r || 0) : null, sales_wallets: FD ? Object.keys((FD[k] || {}).p || {}).length : null,
      partial: k === lastDay,
    });
    daily.push(r);
  }

  // 지갑별 최근 7일(오늘 제외) · 직전 7일의 판 양 · 받은 양: [최근 판, 최근 받은, 직전 판, 직전 받은]
  const fullD = daily.filter((r) => !r.partial && r.date >= C.POOL_OPEN), W7 = fullD.slice(-7), P7 = fullD.slice(-14, -7), r7 = {};
  const w7 = { from: W7.length ? W7[0].date : null, to: W7.length ? W7[W7.length - 1].date : null, pFrom: P7.length === 7 ? P7[0].date : null, pTo: P7.length === 7 ? P7[6].date : null };
  for (const e of EV) {
    if (e.kind !== 'sell' && e.kind !== 'paid') continue;
    const inW = w7.from && e.k >= w7.from && e.k <= w7.to, inP = w7.pFrom && e.k >= w7.pFrom && e.k <= w7.pTo;
    if (!inW && !inP) continue;
    const o = r7[e.a] || (r7[e.a] = [0, 0, 0, 0]); o[(e.kind === 'sell' ? 0 : 1) + (inW ? 0 : 2)] += e.v[0];
  }
  const nf = (x) => Math.round(x).toLocaleString('en-US'), pf = (x) => (Math.abs(x) * 100).toFixed(1) + '%';

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
  // to 를 주면 그날까지만 센다(날짜를 직접 정한 기간 — 14차). 잔액 · 「지금」이 붙은 값은 어느 기간이든 지금 값이다
  const ROW = {};      // 주소 → 지갑 줄(전체 기간). 자금 흐름 정리(buildTrace)가 쓴다
  // 회사 계정에 넣은 돈: lib/trace.js 가 회사 계정 쪽 내역에서 하루 한 번 읽어 S.trace.dep.tx 에 둔다 — 거래 하나 = [날짜, 보낸 곳, 계정 이름, XRP, RLUSD]
  //   operations 계정의 RLUSD 는 판매 대금 기록(rebuy)이 이미 세므로 거기에는 XRP 만 들어 있다. XRP 는 그날의 XRP 값으로 환산한다
  const DEP = S.trace && S.trace.dep && S.trace.dep.tx ? Object.keys(S.trace.dep.tx).map((h) => S.trace.dep.tx[h]) : [];
  const xrOn = {}, xrNow = S.pX > 0 ? S.pR / S.pX : 0; for (const r of daily) if (r.xrp_rlusd) xrOn[r.date] = r.xrp_rlusd;
  const mkRange = (key, from, to) => {
    if (from < C.NOW_FROM) from = C.NOW_FROM;
    if (!to || to > lastDay) to = lastDay;
    if (from > to) from = to;
    const acc = {}, at = (a) => acc[a] || (acc[a] = { paid: 0, paidco: 0, sold: 0, bought: 0, cash: 0, spent: 0, toR: 0, toX: 0, fromR: 0, fromX: 0, gotR: 0, gotX: 0, payR: 0, payX: 0, lpw: 0, lpq: 0, lpr: 0, lpx: 0, wr: 0 });
    let repay = 0;
    for (const e of EV) {
      if (e.k < from || e.k > to) continue;
      const o = at(e.a), v = e.v;
      if (e.kind === 'sell') { o.sd = (o.sd || 0) + 1; o.wr += byCur(v)[0]; o.sold += v[0]; o.cash += v[1]; o.toR += v[2] || 0; o.toX += v[3] || 0; o.gotR += v[4] || 0; o.gotX += v[5] || 0; }
      else if (e.kind === 'buy') { o.bought += v[0]; o.spent += v[1]; o.fromR += v[2] || 0; o.fromX += v[3] || 0; o.payR += v[4] || 0; o.payX += v[5] || 0; }
      else if (e.kind === 'paid') { o.paid += v[0]; if (e.k === C.NOW_FROM && e.g === 'user') repay += v[0]; }
      else if (e.kind === 'paidco') o.paidco += v[0];
      else if (e.kind === 'lp') { o.lpw += v[0]; o.lpq += v[1]; o.lpr += v[2] || 0; o.lpx += v[3] || 0; }
    }
    const of = (g) => Object.keys(acc).filter((a) => (G[a] || 'other') === g);
    const sum = (list, f) => list.reduce((t, a) => t + (acc[a] ? acc[a][f] : 0), 0);
    const U = of('user');
    const rows = daily.filter((r) => r.date >= from && r.date <= to), full = rows.filter((r) => !r.partial && r.date >= C.POOL_OPEN);
    const avg = (f) => (full.length ? r0(full.reduce((t, r) => t + r[f], 0) / full.length) : null);
    const uPaid = sum(U, 'paid'), uSold = sum(U, 'sold'), uBought = sum(U, 'bought'), uCash = sum(U, 'cash');
    const all = Object.keys(acc), ts = sum(all, 'sold'), tb = sum(all, 'bought'), botB = sum(of('bot'), 'bought');
    const first = rows.find((r) => r.price_rlusd !== null), lastRow = rows[rows.length - 1];
    const kpi = {
      user_paid: r0(uPaid), user_repaid: r0(repay), user_paid_new: r0(uPaid) - r0(repay), wallets_paid: U.filter((a) => acc[a].paid > 0).length,
      user_sold: r0(uSold), user_bought: r0(uBought), user_net_sold: r0(uSold) - r0(uBought), wallets_sold: U.filter((a) => acc[a].sold > 0).length,
      user_sold_share: uPaid > 0 ? r3(uSold / uPaid) : null, user_sold_vs_new_paid: uPaid - repay > 0 ? r3(uSold / (uPaid - repay)) : null,
      user_sold_for_rlusd: r0(sum(U, 'wr')), user_sold_for_xrp: r0(uSold) - r0(sum(U, 'wr')),
      user_sold_for_rlusd_share: uSold > 0 ? r3(sum(U, 'wr') / uSold) : null, user_sold_for_xrp_share: uSold > 0 ? r3(1 - sum(U, 'wr') / uSold) : null,
      user_cash_rlusd: r0(uCash), user_got_rlusd: r0(sum(U, 'gotR')), user_got_xrp: r0(sum(U, 'gotX')), user_avg_sell_price: uSold > 0 ? r3(uCash / uSold) : null,
      user_pool_in: r0(sum(U, 'lpw')), user_balance: r0(ul.reduce((t, a) => t + Math.max(g2(S.bal, a), 0), 0)),
      user_sell_avg: avg('sell_user'), user_paid_avg: avg('paid_user'), full_days: full.length,
      sell_total: r0(ts), buy_total: r0(tb), net_bought_total: r0(tb) - r0(ts), bot_bought: r0(botB), bot_buy_share: tb > 0 ? r3(botB / tb) : null,
      // bot 을 뺀 수요: 산 양에서 Wellbian bot 계정이 산 양을 뺀 것이 판 양의 몇 %인가 · bot 이 산 날 수(판정하지 않는다 — 숫자만)
      buy_ex_bot: r0(tb) - r0(botB), buy_ex_bot_ratio: ts > 0 ? r3((tb - botB) / ts) : null, range_days: rows.filter((r) => r.date >= C.POOL_OPEN).length,
      bot_buy_days: rows.filter((r) => r.buy_bot > 0).length, bot_last_day: (rows.filter((r) => r.buy_bot > 0).pop() || {}).date || null,
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
    // 지갑별: 일반 사용자 지갑 전부 + 사고팔기 · 그 밖 · bot 가운데 이 기간에 거래한 곳. rebuy = 이 기간에 operations 계정으로 보낸 RLUSD(다시 산 돈)
    const rebuy = {};
    if (FD) for (const k of Object.keys(FD)) if (k >= from && k <= to) for (const a of Object.keys(FD[k].p || {})) add(rebuy, a, FD[k].p[a]);
    // dep = 이 기간에 회사 계정에 넣은 돈(RLUSD 환산) · depX = 그 가운데 XRP 개수 · depTo = 어느 계정에 · mvo = 이 기간에 다른 지갑으로 옮긴 WLBN
    const dep = {}, depX = {}, depTo = {}, mvo = {};
    for (const e of DEP) { if (e[0] < from || e[0] > to) continue; add(dep, e[1], e[3] * (xrOn[e[0]] || xrNow) + e[4]); add(depX, e[1], e[3]); (depTo[e[1]] || (depTo[e[1]] = {}))[e[2]] = 1; }
    for (const tk of Object.keys(S.tf || {})) { const p = tk.split('|'); if (p[0] < from || p[0] > to || !p[1] || !p[2]) continue; add(mvo, p[1], S.tf[tk]); }
    const wallets = [];
    for (const a of accts) {
      const g = G[a];
      if (g !== 'user' && g !== 'arb' && g !== 'other' && g !== 'bot') continue;
      const o = acc[a] || {}, bal = Math.max(g2(S.bal, a), 0), act = (o.paid || 0) + (o.sold || 0) + (o.bought || 0) + Math.abs(o.lpw || 0);
      if (g === 'user' ? (act < 0.5 && bal < 1) : ((o.sold || 0) + (o.bought || 0) < 0.5)) continue;
      const ls = S.lastSell[a] || '', row = {
        wallet: g === 'bot' ? 'Wellbian bot 계정' : short(a), g, paid: r0(o.paid || 0), sold: r0(o.sold || 0), bought: r0(o.bought || 0), net_sold: r0((o.sold || 0) - (o.bought || 0)),
        sold_rlusd: r0(o.wr || 0), sold_xrp: r0(o.sold || 0) - r0(o.wr || 0), sell_ratio: (o.paid || 0) >= 0.5 ? r3((o.sold || 0) / o.paid) : null, sell_days: o.sd || 0,
        cash_rlusd: r0(o.cash || 0), got_rlusd: r0(o.gotR || 0), got_xrp: r0(o.gotX || 0), rebuy_rlusd: r0(rebuy[a] || 0),
        dep_rlusd: r0(dep[a] || 0), dep_xrp: r0(depX[a] || 0), dep_to: Object.keys(depTo[a] || {}).map((l) => tagged(labelOwner(l), labelName(l)).full).join(' · '), moved_out: r0(mvo[a] || 0),
        pool_in: r0(o.lpw || 0), balance: r0(bal), last_sell: ls >= C.NOW_FROM ? ls : '', id: short(a),
        first_paid: FP[a] || '', start: startOf(a) || '', prev_wallet: linkOf[a] ? short(linkOf[a].old) : '', link_exact: linkOf[a] ? linkOf[a].exact : null,
        days_in: startOf(a) ? dayDiff(startOf(a), lastDay) : null, first_sell: FS[a] || '', sell_lag: FP[a] && FS[a] && FS[a] >= FP[a] ? dayDiff(FP[a], FS[a]) : null,
        act: r0(act), paid_rlusd: r0(o.payR || 0), paid_xrp: r0(o.payX || 0), spent_rlusd: r0(o.spent || 0), avg_price: (o.sold || 0) >= 1 ? r3((o.cash || 0) / o.sold) : null,
        sold_7d: r0((r7[a] || [0])[0] || 0), paid_7d: r0((r7[a] || [0, 0])[1] || 0), sold_prev7d: r0((r7[a] || [0, 0, 0])[2] || 0), paid_prev7d: r0((r7[a] || [0, 0, 0, 0])[3] || 0),
      };
      if (g === 'bot') { row.owner = 'wellbian'; row.label = 'bot 계정'; }
      if (opts.showAddr) row.addr = a;
      if (key === 'all') ROW[a] = row;
      wallets.push(row);
    }
    wallets.sort((x, y) => (y.sold - x.sold) || (y.paid - x.paid));
    // 지갑 유형 · 활동량 순위 · 한 줄 분석. 활동량 = 받은 양 + 판 양 + 산 양 + 풀에 넣고 뺀 양
    const typeOf = (w) => {
      if (w.g === 'bot') return ['bot', 'Wellbian bot'];
      if (w.g === 'arb') return ['arb', '사고팔기 지갑'];
      if (w.g === 'other') return w.sold >= 1 && w.bought >= 1 && Math.min(w.sold, w.bought) >= 0.8 * Math.max(w.sold, w.bought) ? ['flip', '조금 사고판 지갑'] : w.bought >= w.sold ? ['buyer', '사 모으는 지갑'] : ['seller', '받은 기록 없이 파는 지갑'];
      if (w.rebuy_rlusd > 0 && w.sold >= 1) return ['recycle', '팔고 다시 사는 지갑'];
      if (w.rebuy_rlusd > 0) return ['rebuy', '팔지 않고 다시 사는 지갑'];
      if (w.pool_in >= 100 && w.pool_in >= w.sold) return ['lp', '풀에 넣는 지갑'];
      if (w.paid < 1 && w.sold >= 1) return ['old', '이 기간에 받지 않고 파는 지갑'];
      if (w.sold < 1 || (w.sell_ratio !== null && w.sell_ratio < 0.1)) return ['hold', '모아 두는 지갑'];
      if (w.sell_ratio !== null && w.sell_ratio >= 0.9) return ['dump', '받는 대로 파는 지갑'];
      return ['part', '일부만 파는 지갑'];
    };
    const TYPE_ORDER = ['dump', 'part', 'hold', 'lp', 'recycle', 'rebuy', 'old', 'arb', 'flip', 'buyer', 'seller', 'bot'];
    const TYPE_DESC = {
      dump: '이 기간에 받은 양의 90% 이상을 팔았다', part: '받은 양의 10~90%를 팔았다', hold: '팔지 않았거나 받은 양의 10% 미만만 팔았다',
      lp: '풀에 100개 이상 넣었고 그 양이 판 양보다 많다', recycle: 'WLBN을 팔았고, operations 계정으로 RLUSD를 보내 다시 샀다', rebuy: 'WLBN을 팔지 않고 operations 계정으로 RLUSD를 보내 다시 샀다',
      old: '보상을 받는 지갑인데 이 기간에는 받은 것이 없고, 전에 갖고 있던 것을 팔았다', arb: '보상을 받지 않고, 산 양과 판 양이 거의 같다(두 풀 사이를 오간다)',
      flip: '보상을 받지 않는 지갑이 조금 사고팔았다(산 양과 판 양이 비슷하다)', buyer: '보상을 받지 않는 지갑이 판 양보다 많이 샀다', seller: '보상을 받은 적이 없는 지갑이 산 양보다 많이 팔았다', bot: '회사가 WLBN을 사들이는 계정',
    };
    const depTxt = (w) => (w.dep_to || '회사 계정') + '에 ' + (w.dep_xrp >= 1 ? 'XRP ' + nf(w.dep_xrp) + '개(' + nf(w.dep_rlusd) + ' RLUSD 환산)' : nf(w.dep_rlusd) + ' RLUSD') + '를 넣었다' + (w.cash_rlusd >= 1 ? ' — WLBN을 판 대금(환산 ' + nf(w.cash_rlusd) + ' RLUSD)' + (w.dep_rlusd > w.cash_rlusd ? '보다 많다.' : ' 안쪽이다.') : '.');
    const tell = (w) => {
      const t = [], cur = w.sold >= 1 ? (w.sold_xrp < 1 ? '전부 RLUSD로' : w.sold_rlusd < 1 ? '전부 XRP로' : 'XRP로 ' + pf(w.sold_xrp / w.sold) + ' · RLUSD로 ' + pf(w.sold_rlusd / w.sold)) : '';
      if (w.g === 'bot') { t.push(nf(w.bought) + '개를 사는 데 ' + nf(w.paid_rlusd) + ' RLUSD와 ' + nf(w.paid_xrp) + ' XRP를 썼다. 판 적은 없다.'); return t.join(' '); }
      if (w.g === 'arb') { t.push('산 양 ' + nf(w.bought) + '개 · 판 양 ' + nf(w.sold) + '개로 거의 같다. ' + nf(w.sell_days) + '일에 걸쳐 두 풀 사이를 오갔다(판 양은 ' + cur + '). 남긴 잔액은 ' + nf(w.balance) + '개다.'); return t.join(' '); }
      if (w.g === 'other') {
        t.push(w.bought >= w.sold ? '받은 기록 없이 ' + nf(w.bought) + '개를 샀고(낸 돈 ' + nf(w.paid_rlusd) + ' RLUSD · ' + nf(w.paid_xrp) + ' XRP) ' + (w.sold >= 1 ? nf(w.sold) + '개를 팔았다.' : '판 적은 없다.') : '받은 기록 없이 ' + nf(w.sold) + '개를 팔았다(' + cur + '). 산 양은 ' + nf(w.bought) + '개다.');
        if (w.moved_out >= 1) t.push('다른 지갑으로 ' + nf(w.moved_out) + '개를 옮겼다.');
        if (w.dep_rlusd >= 1) t.push(depTxt(w));
        t.push('지금 잔액 ' + nf(w.balance) + '개' + (w.pool_in >= 1 ? ', 풀에 넣은 양 ' + nf(w.pool_in) + '개.' : '.'));
        return t.join(' ');
      }
      if (w.paid >= 1) t.push(w.sold >= 1 ? (w.sell_ratio > 1 ? '받은 ' + nf(w.paid) + '개보다 많은 ' + nf(w.sold) + '개를 팔았다(' + cur + ').' : '받은 ' + nf(w.paid) + '개 가운데 ' + nf(w.sold) + '개(' + pf(w.sell_ratio) + ')를 팔았다(' + cur + ').') : '받은 ' + nf(w.paid) + '개를 팔지 않았다.');
      else if (w.sold >= 1) t.push('이 기간에 받은 것은 없는데 ' + nf(w.sold) + '개를 팔았다(' + cur + ').');
      else t.push('이 기간에 받거나 판 것이 없다.');
      if (w.sold >= 1 && uSold > 0 && w.sold / uSold >= 0.03) t.push('일반 사용자 판 양의 ' + pf(w.sold / uSold) + '를 차지한다.');
      if (w.sold >= 1 && w.sell_lag !== null) t.push(w.sell_lag === 0 ? '처음 받은 날 바로 팔기 시작했다.' : '처음 받고 ' + nf(w.sell_lag) + '일 뒤부터 팔았다.');
      if (w.rebuy_rlusd > 0) t.push('operations 계정으로 ' + nf(w.rebuy_rlusd) + ' RLUSD를 보내 다시 샀다' + (w.cash_rlusd >= 1 ? ' — WLBN을 판 대금(환산 ' + nf(w.cash_rlusd) + ' RLUSD)' + (w.rebuy_rlusd > w.cash_rlusd ? '보다 많다.' : ' 안쪽이다.') : '.'));
      if (w.dep_rlusd >= 1) t.push(depTxt(w));
      if (w.pool_in >= 1) t.push('풀에 ' + nf(w.pool_in) + '개를 넣어 두었다.'); else if (w.pool_in <= -1) t.push('풀에서 ' + nf(-w.pool_in) + '개를 뺐다.');
      if (w.sold_7d >= 1 || w.sold_prev7d >= 1) t.push('최근 7일 판 양 ' + nf(w.sold_7d) + '개(직전 7일 ' + nf(w.sold_prev7d) + '개).');
      t.push('지금 잔액 ' + nf(w.balance) + '개.');
      return t.join(' ');
    };
    const byAct = wallets.slice().sort((x, y) => (y.act - x.act) || (y.sold - x.sold));
    byAct.forEach((w, i) => { w.rank = i + 1; const ty = typeOf(w); w.type = ty[0]; w.type_name = ty[1]; w.insight = tell(w); });
    const tmap = {};
    for (const w of wallets) { const o = tmap[w.type] || (tmap[w.type] = { key: w.type, name: w.type_name, desc: TYPE_DESC[w.type] || '', wallets: 0, paid: 0, sold: 0, bought: 0, rebuy_rlusd: 0, pool_in: 0, balance: 0 }); o.wallets++; o.paid += w.paid; o.sold += w.sold; o.bought += w.bought; o.rebuy_rlusd += w.rebuy_rlusd; o.pool_in += w.pool_in; o.balance += w.balance; }
    const types = TYPE_ORDER.filter((k) => tmap[k]).map((k) => tmap[k]);
    // 도움 · 중간 · 부담(IMPACT). bot 계정은 회사 계정이라 넣지 않는다
    //   old = 16차 전 기준으로 다시 본다(1: 회사 계정에 넣은 돈을 빼고 · 2: 받은 기록이 없으면 팔기만 해도 부담 · 3: 둘 다) — 기준이 바뀌어 부담에서 빠진 지갑을 가려내는 데만 쓴다
    const impactOf = (w, old) => {
      const noDep = old === 1 || old === 3, oldPart = old === 2 || old === 3;
      const took = w.cash_rlusd, back = w.spent_rlusd + w.rebuy_rlusd + (noDep ? 0 : w.dep_rlusd), why = [];
      if (w.type === 'arb' || w.type === 'flip') return ['mid', ['산 양 ' + nf(w.bought) + '개 · 판 양 ' + nf(w.sold) + '개로 거의 같다(사고파는 거래 — 보상과 무관)']];
      const holds = w.paid >= 1 ? (w.sell_ratio !== null && w.sell_ratio < IMPACT.hold) : (w.sold < 1 && w.balance >= 1);
      const gives = back >= 1 && back >= took, lp = w.pool_in >= IMPACT.lp && w.pool_in >= w.sold;
      const parts = [w.spent_rlusd >= 1 ? ['매수', w.spent_rlusd] : null, w.rebuy_rlusd >= 1 ? ['다시 산 돈', w.rebuy_rlusd] : null, !noDep && w.dep_rlusd >= 1 ? ['회사 계정에 넣은 돈', w.dep_rlusd] : null].filter(Boolean);
      const backTxt = () => (parts.length > 1 ? parts.map((x) => x[0] + ' ' + nf(x[1])).join(' · ') : parts.length ? parts[0][0] : '매수');
      if (holds) why.push(w.paid >= 1 ? (w.sold < 1 ? '받은 ' + nf(w.paid) + '개를 팔지 않았다' : '받은 양의 ' + pf(w.sell_ratio) + '만 팔았다') : '팔지 않고 ' + nf(w.balance) + '개를 들고 있다');
      if (gives) why.push(took >= 1 ? '가져간 돈 ' + nf(took) + ' RLUSD보다 많은 ' + nf(back) + ' RLUSD를 되돌렸다(' + backTxt() + ')' : nf(back) + ' RLUSD를 넣었다(' + backTxt() + ')');
      if (lp) why.push('풀에 ' + nf(w.pool_in) + '개를 넣어 두었다');
      if (why.length) return ['help', why];
      // 받은 기록이 없는 지갑: 가진 양(판 양 + 다른 지갑으로 옮긴 양 + 지금 잔액) 가운데 판 비율
      const had = w.sold + w.moved_out + w.balance, part = had > 0 ? w.sold / had : 1, some = w.paid < 1 && part < 0.9995;
      const dumps = took >= 1 && (w.paid >= 1 ? w.sell_ratio >= IMPACT.dump : (oldPart ? true : part >= IMPACT.dump));
      if (dumps && back < IMPACT.back * took) return ['load', [(w.paid >= 1 ? '받은 양의 ' + pf(Math.min(w.sell_ratio, 9.99)) + '를 팔았고' : some ? '받은 기록 없이 가진 양의 ' + pf(part) + '(' + nf(w.sold) + '개)를 팔았고' : '받은 기록 없이 ' + nf(w.sold) + '개를 팔았고') + (back >= 1 ? ' 되돌린 돈은 가져간 돈의 ' + pf(back / took) + '뿐이다' : ' 되돌린 돈이 없다')]];
      if (took >= 1) why.push(w.paid >= 1 && w.sell_ratio !== null ? '받은 양의 ' + pf(Math.min(w.sell_ratio, 9.99)) + '를 팔았다' : some ? '가진 양의 ' + pf(part) + '(' + nf(w.sold) + '개)만 팔았다' + (w.moved_out >= 1 ? ' — ' + nf(w.moved_out) + '개는 다른 지갑으로 옮겼다' : '') : nf(w.sold) + '개를 팔았다');
      if (took >= 1 && back >= 1) why.push('가져간 돈 ' + nf(took) + ' RLUSD 가운데 ' + nf(back) + ' RLUSD(' + pf(back / took) + ')를 되돌렸다');
      if (!why.length) why.push('이 기간에 움직임이 거의 없다');
      return ['mid', why];
    };
    const imap = {}, iw = wallets.filter((w) => w.g !== 'bot');
    for (const k of ['help', 'mid', 'load']) imap[k] = { key: k, name: IMPACT_NAME[k], wallets: 0, paid: 0, sold: 0, bought: 0, took_rlusd: 0, back_rlusd: 0, rebuy_rlusd: 0, dep_rlusd: 0, pool_in: 0, balance: 0 };
    const cleared = [];      // 16차 기준으로 부담에서 빠진 지갑(why: dep — 회사 계정에 넣은 돈 · part — 가진 양의 일부만 팔았다)
    for (const w of iw) {
      const r = impactOf(w), o = imap[r[0]];
      w.impact = r[0]; w.impact_name = IMPACT_NAME[r[0]]; w.impact_why = r[1].join(' · '); w.took_rlusd = w.cash_rlusd; w.back_rlusd = w.spent_rlusd + w.rebuy_rlusd + w.dep_rlusd; w.net_rlusd = w.back_rlusd - w.took_rlusd;
      if (r[0] !== 'load' && impactOf(w, 3)[0] === 'load') { const why = impactOf(w, 2)[0] !== 'load' ? 'dep' : 'part'; w.cleared = why; cleared.push({ id: w.id, wallet: w.wallet, type_name: w.type_name, why, impact: r[0], took_rlusd: w.took_rlusd, dep_rlusd: w.dep_rlusd, dep_xrp: w.dep_xrp, dep_to: w.dep_to, sold: w.sold, moved_out: w.moved_out, balance: w.balance }); }
      o.wallets++; o.paid += w.paid; o.sold += w.sold; o.bought += w.bought; o.took_rlusd += w.took_rlusd; o.back_rlusd += w.back_rlusd; o.rebuy_rlusd += w.rebuy_rlusd; o.dep_rlusd += w.dep_rlusd; o.pool_in += Math.max(w.pool_in, 0); o.balance += w.balance;
    }
    const iRows = ['help', 'mid', 'load'].map((k) => imap[k]), iTot = {};
    for (const f of ['wallets', 'paid', 'sold', 'bought', 'took_rlusd', 'back_rlusd', 'rebuy_rlusd', 'dep_rlusd', 'pool_in', 'balance']) iTot[f] = iRows.reduce((t, r) => t + r[f], 0);
    for (const r of iRows) for (const f of Object.keys(iTot)) r[f + '_share'] = iTot[f] > 0 ? r3(r[f] / iTot[f]) : null;
    const iTop = (k, f) => iw.filter((w) => w.impact === k && w[f] >= 1).sort((x, y) => y[f] - x[f]).slice(0, 5).map((w) => ({ id: w.id, wallet: w.wallet, type_name: w.type_name, sold: w.sold, took_rlusd: w.took_rlusd, back_rlusd: w.back_rlusd, balance: w.balance, why: w.impact_why }));
    const iNotes = [], iH = imap.help, iL = imap.load, iM = imap.mid, topLoad = iTop('load', 'took_rlusd');
    if (iTot.wallets) {
      iNotes.push('분포: 지갑 ' + nf(iTot.wallets) + '곳 가운데 **도움 ' + nf(iH.wallets) + '곳(' + pf(iH.wallets_share || 0) + ')** · 중간 ' + nf(iM.wallets) + '곳(' + pf(iM.wallets_share || 0) + ') · **부담 ' + nf(iL.wallets) + '곳(' + pf(iL.wallets_share || 0) + ')**이다.');
      if (iTot.sold >= 1) iNotes.push('부담 몫: 부담 지갑이 **판 양의 ' + pf(iL.sold_share || 0) + '**(' + nf(iL.sold) + '개)를 팔았고, **가져간 돈의 ' + pf(iL.took_rlusd_share || 0) + '**(' + nf(iL.took_rlusd) + ' RLUSD 환산)를 가져갔다.' + (topLoad.length && iL.took_rlusd >= 1 ? ' 그 가운데 가장 많이 가져간 다섯 곳이 ' + pf(topLoad.reduce((t, w) => t + w.took_rlusd, 0) / iL.took_rlusd) + '다.' : ''));
      if (iTot.back_rlusd >= 1) iNotes.push('되돌린 돈: 모두 **' + nf(iTot.back_rlusd) + ' RLUSD**(가져간 돈 ' + nf(iTot.took_rlusd) + '의 ' + pf(iTot.took_rlusd > 0 ? iTot.back_rlusd / iTot.took_rlusd : 0) + ')이고, 그 **' + pf(iH.back_rlusd_share || 0) + '를 도움 지갑**이 냈다(다시 산 돈 ' + nf(iTot.rebuy_rlusd) + ' · 매수 ' + nf(iTot.back_rlusd - iTot.rebuy_rlusd - iTot.dep_rlusd) + (iTot.dep_rlusd >= 1 ? ' · 회사 계정에 넣은 돈 ' + nf(iTot.dep_rlusd) : '') + ').');
      else if (iTot.took_rlusd >= 1) iNotes.push('되돌린 돈: 가져간 돈은 ' + nf(iTot.took_rlusd) + ' RLUSD(환산)이고 원장에서 보이는 **되돌린 돈은 없다**.');
      if (iTot.balance >= 1) iNotes.push('보유: 지금 들고 있는 ' + nf(iTot.balance) + '개 가운데 **' + pf(iH.balance_share || 0) + '가 도움 지갑**에 있다.');
    }
    const impact = { rows: iRows.map((r) => { const o = {}; for (const f of Object.keys(r)) o[f] = typeof r[f] === 'number' && !/_share$/.test(f) ? r0(r[f]) : r[f]; return o; }), total: Object.keys(iTot).reduce((o, f) => { o[f] = r0(iTot[f]); return o; }, {}),
      top_help: iTop('help', 'back_rlusd'), top_hold: iTop('help', 'balance'), top_load: topLoad, cleared: cleared.sort((x, y) => (y.dep_rlusd - x.dep_rlusd) || (y.moved_out - x.moved_out)), notes: iNotes, limit: LIMIT_CARD + ' 카드로 다시 산 지갑은 되돌린 돈이 0으로 보여 「부담」으로 잘못 나뉠 수 있다.',
      rule: { hold: IMPACT.hold, dump: IMPACT.dump, back: IMPACT.back, lp: IMPACT.lp } };
    // 보상 받은 지갑은 얼마나 파나: 판 비율 구간별 지갑 수 · 물량, 그리고 쏠림
    const uw = wallets.filter((w) => w.g === 'user'), buckets = [['none', '팔지 않은 지갑'], ['low', '절반 미만으로 판 지갑'], ['mid', '절반 넘게 판 지갑(50~90%)'], ['high', '거의 다 판 지갑(90% 이상)'], ['extra', '이 기간에 받지 않고 판 지갑']];
    const bk = {}; for (const b of buckets) bk[b[0]] = { key: b[0], name: b[1], wallets: 0, paid: 0, sold: 0 };
    for (const w of uw) {
      const key = w.paid >= 1 ? (w.sold < 1 ? 'none' : w.sell_ratio < 0.5 ? 'low' : w.sell_ratio < 0.9 ? 'mid' : 'high') : (w.sold >= 1 ? 'extra' : null);
      if (!key) continue;
      bk[key].wallets++; bk[key].paid += w.paid; bk[key].sold += w.sold;
    }
    const nW = buckets.reduce((t, b) => t + bk[b[0]].wallets, 0), nS = buckets.reduce((t, b) => t + bk[b[0]].sold, 0);
    const dist = buckets.map((b) => Object.assign(bk[b[0]], { wallets_share: nW ? r3(bk[b[0]].wallets / nW) : null, sold_share: nS ? r3(bk[b[0]].sold / nS) : null }));
    // 언제 보상받기 시작한 지갑이 얼마나 파나: 시작 시기별로 묶는다(옛 지갑으로 이어진 곳은 옛 지갑의 시작일)
    const cohorts = [], cmap = {};
    const cohortOf = (w) => {
      if (!w.start) return null;
      if (w.start < C.NOW_FROM) return ['0', '10/24 이전에 시작'];
      if (w.start <= C.POOL_OPEN) return ['1', '10/26~27 재지급 때 시작(옛 지갑을 잇지 못한 곳)'];
      const first = shift(C.POOL_OPEN, 1), i = Math.floor(dayDiff(first, w.start) / 7), a0 = shift(first, i * 7), a1 = shift(a0, 6);
      return ['2' + a0, md(a0) + '~' + md(a1 > lastDay ? lastDay : a1) + '에 시작'];
    };
    for (const w of uw) {
      const c = cohortOf(w); if (!c) continue;
      const o = cmap[c[0]] || (cmap[c[0]] = { key: c[0], name: c[1], wallets: 0, paid: 0, sold: 0, sellers: 0, rebuyers: 0, lags: [] });
      o.wallets++; o.paid += w.paid; o.sold += w.sold; if (w.sold > 0) o.sellers++; if (w.rebuy_rlusd > 0) o.rebuyers++; if (w.sell_lag !== null) o.lags.push(w.sell_lag);
    }
    for (const key of Object.keys(cmap).sort()) {
      const o = cmap[key], lg = o.lags.sort((x, y) => x - y);
      cohorts.push({ key, name: o.name, wallets: o.wallets, paid: o.paid, sold: o.sold, sell_ratio: o.paid >= 1 ? r3(o.sold / o.paid) : null, sellers: o.sellers, rebuyers: o.rebuyers, lag_median: lg.length ? lg[Math.floor((lg.length - 1) / 2)] : null });
    }
    const topShare = (list, f, k) => { const v = list.map((w) => w[f]).filter((x) => x > 0).sort((x, y) => y - x), t = v.reduce((p, x) => p + x, 0); return t > 0 ? r3(v.slice(0, k).reduce((p, x) => p + x, 0) / t) : null; };
    const noBot = wallets.filter((w) => w.g !== 'bot');
    const conc = {
      sellers: uw.filter((w) => w.sold > 0).length, sell_top1: topShare(uw, 'sold', 1), sell_top5: topShare(uw, 'sold', 5), sell_top10: topShare(uw, 'sold', 10),
      buyers: noBot.filter((w) => w.bought > 0).length, buy_top1: topShare(noBot, 'bought', 1), buy_top5: topShare(noBot, 'bought', 5),
      rebuyers: uw.filter((w) => w.rebuy_rlusd > 0).length, rebuy_rlusd: r0(uw.reduce((t, w) => t + w.rebuy_rlusd, 0)),
      sold_then_rebuy: uw.filter((w) => w.rebuy_rlusd > 0 && w.sold > 0).length,
    };
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
    return { key, from, to, days: rows.length, kpi, prev, groups, flow: { sell: flowSell, buy: flowBuy }, wallets, types, impact, dist, conc, cohorts, accounts, lp: lpRows };
  };
  const ranges = { all: mkRange('all', C.NOW_FROM), d30: mkRange('d30', shift(lastDay, -29)), d7: mkRange('d7', shift(lastDay, -6)) };
  // 날짜를 직접 정한 기간: opts.range = { from, to }(YYYY-MM-DD). 화면이 /api/data?from=&to= 로 청하면 run() 이 넘겨 준다. 풀 기간 밖은 잘라 맞춘다
  const DAYRE = /^\d{4}-\d{2}-\d{2}$/, cr = opts && opts.range;
  const realDay = (v) => DAYRE.test(v || '') && !isNaN(Date.parse(v + 'T00:00:00Z'));
  if (cr && realDay(cr.from) && realDay(cr.to)) ranges.custom = mkRange('custom', cr.from <= cr.to ? cr.from : cr.to, cr.from <= cr.to ? cr.to : cr.from);

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
  const lqR0 = S.pools.R.q > 0 ? r0(S.pools.R.q) * 2 : null, lqX0 = S.pools.X.q > 0 && S.pR && S.pX ? r0(r0(S.pools.X.q) * (S.pR / S.pX) * 2) : null;   // 전체 풀 유동성(지금)
  const summary = {
    as_of: kstamp(S.asof), period_from: C.NOW_FROM, pool_open: C.POOL_OPEN, last_day: lastDay,
    win_from: last7.length ? md(last7[0].date) : null, win_to: last7.length ? md(last7[last7.length - 1].date) : null,
    user_sell_7d_avg: s7, user_sell_prev7d_avg: p7, user_sell_7d_change: p7 ? r3(s7 / p7 - 1) : null, user_paid_7d_avg: avgOf(last7, 'paid_user'),
    price_rlusd: S.pR ? r4(S.pR) : null, xrp_per_wlbn: S.pX ? r4(S.pX) : null, xrp_rate_rlusd: S.pR && S.pX ? r4(S.pR / S.pX) : null,
    pool_r_wlbn: r0(S.pools.R.w), pool_r_rlusd: r0(S.pools.R.q), pool_x_wlbn: r0(S.pools.X.w), pool_x_xrp: r0(S.pools.X.q),
    pool_liq_r: lqR0, pool_liq_x: lqX0, pool_liq: lqR0 !== null && lqX0 !== null ? lqR0 + lqX0 : null,
    pool_side_rlusd: lqR0 !== null && lqX0 !== null ? r0((lqR0 + lqX0) / 2) : null,     // 이 가운데 RLUSD · XRP 쪽(나머지 절반은 WLBN)
    total_supply: r0(total), fee_r: S.pools.R.fee ?? null, fee_x: S.pools.X.fee ?? null,
    lp_company_share: lpAll > 0 ? r3(lpCompany / lpAll) : null, lp_user_share: lpAll > 0 ? r3(lpUser / lpAll) : null,
    lp_wellbian_share: lpAll > 0 ? r3(lpWell / lpAll) : null, lp_kweather_share: lpAll > 0 ? r3(lpKw / lpAll) : null,
    price_usd_dex: e.price_usd_dex ?? null, pool_value_rlusd: e.pool_value_rlusd ?? null, dex_h24_buys: e.dex_h24_buys ?? null, dex_h24_sells: e.dex_h24_sells ?? null,
    dex_h24_volume_usd: e.dex_h24_volume_usd ?? null, dex_liquidity_usd: e.dex_liquidity_usd ?? null, holders: e.holders ?? null, trustlines: e.trustlines ?? null,
    devices_total: e.devices_total ?? null, devices_active: e.devices_active ?? null, operators: e.operators ?? null, kweather_devices: e.kweather_devices ?? null,
    epoch_budget: e.epoch_budget ?? null, epoch_distributed: e.epoch_distributed ?? null, epoch_date: e.epoch_date ?? null, circulating: e.circulating ?? null,
  };
  // 가진 양 가운데 풀에 넣어 둔 몫(일반 사용자 지갑 · 전체 기간 누계) · 풀에 넣은 지갑의 쏠림. 풀에 넣어 둔 양 = 넣은 양 − 뺀 양(「한눈에」 카드와 같은 값)
  {
    const ka = ranges.all.kpi, pin = ka.user_pool_in, ub = ka.user_balance;
    const lpw = ranges.all.wallets.filter((w) => (w.g === undefined || w.g === 'user') && w.pool_in > 0).map((w) => w.pool_in).sort((x, y) => y - x), lpt = lpw.reduce((t, v) => t + v, 0);
    Object.assign(summary, { user_pool_wlbn: pin > 0 ? pin : null, user_wallet_wlbn: ub, user_pool_hold_share: pin > 0 && pin + ub > 0 ? r3(pin / (pin + ub)) : null,
      lp_wallets: lpw.length, lp_top5_share: lpt > 0 && lpw.length > 5 ? r3(lpw.slice(0, 5).reduce((t, v) => t + v, 0) / lpt) : null, lp_top1_share: lpt > 0 && lpw.length > 1 ? r3(lpw[0] / lpt) : null });
  }
  // 신뢰선 → 보유: 사이트가 공시한 신뢰선 · 보유 지갑 수와, 이 화면의 원장 기록에서 WLBN 이 오간 적 있는 지갑(회사 계정 · 풀 · 발행 계정 제외)의 지금 잔액 구간. 두 출처는 세는 법이 달라 나란히만 놓는다
  {
    const h = summary.holders, tl = summary.trustlines, rec = accts.filter((a) => !L[a] && a !== C.SWEEP);
    let h1 = 0, dust = 0, zero = 0; for (const a of rec) { const b = g2(S.bal, a); if (b >= 1) h1++; else if (b > 0) dust++; else zero++; }
    Object.assign(summary, { trust_hold_share: h !== null && tl > 0 ? r3(h / tl) : null, trust_empty: h !== null && tl !== null ? Math.max(tl - h, 0) : null, rec_wallets: rec.length, rec_hold: h1, rec_dust: dust, rec_zero: zero });
  }
  // 주별 · 받은 양에 견준 순매도: 일반 사용자 지갑이 그 주에 새로 받은 양과 순매도(판 양 − 도로 산 양). 풀이 열린 날부터 7일씩, 온전한 날만 센다. 판정하지 않는다
  const weekly = [];
  for (let i = 0; i < full.length; i += 7) {
    const w = full.slice(i, i + 7), tsum = (f) => w.reduce((x, r) => x + (r[f] || 0), 0), wp = tsum('paid_user'), wsold = tsum('sell_user'), wb = tsum('buy_user');
    weekly.push({ date: w[0].date, from: w[0].date, to: w[w.length - 1].date, days: w.length, partial: w.length < 7, paid: r0(wp), sold: r0(wsold), bought: r0(wb), net_sold: r0(wsold) - r0(wb), ratio: wp > 0 ? r3((wsold - wb) / wp) : null });
  }
  // ── 시장과 견주기: WLBN 값(RLUSD 풀)을 주요 코인 10종 · 그 묶음과 같은 날짜 창으로 견준다. 지난 기록과 산수만 쓴다
  const buildMarket = () => {
    const M = S.mkt; if (!M || !M.now || !M.now.coins || !M.now.coins.length) return null;
    const hist = M.hist || {}, coins = M.now.coins.slice(0, MARKET.top), days = daily.filter((r) => !r.partial && r.date >= C.POOL_OPEN && r.price_rlusd);
    if (days.length < 3) return null;
    const last = days[days.length - 1], first = days[0], n = (x) => Math.round(x).toLocaleString('en-US');
    const p1 = (x) => (Math.abs(x) * 100).toFixed(1) + '%', sp = (x) => (x < 0 ? '−' : '+') + p1(x), pp = (x) => (x < 0 ? '−' : '+') + (Math.abs(x) * 100).toFixed(1) + '%p';
    // 같은 날짜의 일별 값을 쓴다. 풀에서 읽은 XRP 값(한국 시각 마감)과 대조하면 같은 날짜 값이 가장 가깝다(11/23 확인: 26일 평균 0.8%, 최대 1.7% 차이).
    // 마지막 날 값이 아직 없으면 지금 값을 쓴다
    const at = (c, d) => { const row = hist[d]; return row && row[c.sym] ? row[c.sym] : d === last.date ? [c.price, c.mc] : null; };
    const start = { d1: days[days.length - 2], d7: days[days.length - 8] || null, open: first };      // 창의 출발점(그날 마감 값)
    const ch = (a, b) => (a && b ? Math.round((a / b - 1) * 1e5) / 1e5 : null);      // 소수 다섯 자리(0.45% 같은 경계에서 다른 구역과 반올림이 갈리지 않게)
    const coinCh = (c, s0) => (s0 ? ch((at(c, last.date) || [])[0], (at(c, s0.date) || [])[0]) : null);
    const basketCh = (s0) => { if (!s0) return null; let a = 0, b = 0; for (const c of coins) { const x = at(c, last.date), y = at(c, s0.date); if (x && y && x[1] > 0 && y[1] > 0) { a += x[1]; b += y[1]; } } return b > 0 ? r4(a / b - 1) : null; };
    const W = { key: 'wlbn', kind: 'wlbn', name: 'WLBN', sym: 'WLBN', rank: null, price: S.pR ? r4(S.pR) : last.price_rlusd, mc: null };
    const K = { key: 'basket', kind: 'basket', name: '주요 ' + coins.length + '종 묶음', sym: '', rank: null, price: null, mc: r0(coins.reduce((t, c) => t + (c.mc || 0), 0)) };
    for (const k of ['d1', 'd7', 'open']) { W[k] = start[k] ? ch(last.price_rlusd, start[k].price_rlusd) : null; K[k] = basketCh(start[k]); }
    const sig = (x) => (x >= 1000 ? Math.round(x * 100) / 100 : x >= 1 ? r4(x) : Number(x.toPrecision(4)));
    const rows = [W, K].concat(coins.map((c) => ({ key: c.sym, kind: 'coin', name: c.name, sym: c.sym, rank: c.rank, price: sig(c.price), mc: r0(c.mc), d1: coinCh(c, start.d1), d7: coinCh(c, start.d7), open: coinCh(c, start.open) })));
    for (const r of rows) for (const k of ['d1', 'd7', 'open']) r['gap_' + k] = r.kind === 'wlbn' || r[k] === null || W[k] === null ? null : r4(W[k] - r[k]);   // WLBN − 그 줄(%p)
    // 값의 흐름: 첫날 = 100. 묶음은 모든 날에 값이 있는 코인의 시가총액 합
    const whole = coins.filter((c) => days.every((d) => at(c, d.date) && at(c, d.date)[1] > 0)), sum = (d) => whole.reduce((t, c) => t + at(c, d.date)[1], 0), base = whole.length ? sum(first) : 0;
    const series = days.map((d) => { const o = { date: d.date, wlbn: Math.round(d.price_rlusd / first.price_rlusd * 1000) / 10, basket: base ? Math.round(sum(d) / base * 1000) / 10 : null }; for (const c of coins) { const a = at(c, d.date), b = at(c, first.date); o[c.sym] = a && b ? Math.round(a[0] / b[0] * 1000) / 10 : null; } return o; });
    const has = (sym) => coins.some((c) => c.sym === sym), pickLines = ['BTC', 'XRP'].filter(has); for (const c of coins) if (pickLines.length < 2 && pickLines.indexOf(c.sym) < 0) pickLines.push(c.sym);
    // 하루 변화가 같은 방향이었던 날 · 상관계수
    const pair = (key) => { const a = [], b = []; for (let i = 1; i < series.length; i++) { const x0 = series[i - 1].wlbn, x1 = series[i].wlbn, y0 = series[i - 1][key], y1 = series[i][key]; if (x0 && x1 && y0 && y1) { a.push(x1 / x0 - 1); b.push(y1 / y0 - 1); } }
      if (a.length < 5) return null; const ma = a.reduce((t, x) => t + x, 0) / a.length, mb = b.reduce((t, x) => t + x, 0) / b.length; let sab = 0, saa = 0, sbb = 0, same = 0;
      for (let i = 0; i < a.length; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; if ((a[i] >= 0) === (b[i] >= 0)) same++; }
      return { n: a.length, same, corr: saa > 0 && sbb > 0 ? Math.round(sab / Math.sqrt(saa * sbb) * 100) / 100 : null }; };
    const stats = { basket: pair('basket'), xrp: has('XRP') ? pair('XRP') : null };
    const rankOf = (k) => { if (W[k] === null) return null; const list = rows.filter((r) => r.kind === 'coin' && r[k] !== null); return list.length ? { pos: 1 + list.filter((r) => r[k] > W[k]).length, of: list.length + 1 } : null; };
    const rank = { d1: rankOf('d1'), d7: rankOf('d7'), open: rankOf('open') }, G0 = M.now.global || null;
    const global = G0 ? { mc: r0(G0.mc), d1: r4(G0.d1), btc_dom: r4(G0.btc_dom), basket_share: G0.mc > 0 ? r3(K.mc / G0.mc) : null } : null;
    const byS = (sym) => rows.find((r) => r.key === sym), X = byS('XRP'), Bt = byS('BTC'), tri = (v) => (v >= 1e12 ? (v / 1e12).toFixed(2) + '조' : n(v / 1e8) + '억');
    const line = (k) => 'WLBN ' + sp(W[k]) + ' · ' + K.name + ' ' + (K[k] === null ? '—' : sp(K[k])) + (Bt && Bt[k] !== null ? ' · BTC ' + sp(Bt[k]) : '') + (X && X[k] !== null ? ' · XRP ' + sp(X[k]) : '');
    const notes = [], cf = (x) => (x < 0 ? '−' : '') + Math.abs(x);
    if (W.d7 !== null) notes.push('최근 7일(' + md(shift(start.d7.date, 1)) + '~' + md(last.date) + '): ' + line('d7') + '.' + (K.d7 !== null ? ' **WLBN이 묶음보다 ' + pp(W.d7 - K.d7) + (W.d7 >= K.d7 ? ' 높다' : ' 낮다') + '**' : '') + (rank.d7 ? ' — 주요 ' + coins.length + '종과 나란히 놓으면 ' + rank.d7.of + '개 가운데 ' + rank.d7.pos + '번째다.' : '.'));
    if (W.open !== null && days.length > 8) notes.push('풀이 열린 뒤(' + md(first.date) + '~' + md(last.date) + '): ' + line('open') + '.' + (K.open !== null ? ' **WLBN이 묶음보다 ' + pp(W.open - K.open) + (W.open >= K.open ? ' 높다' : ' 낮다') + '**' : '') + (rank.open ? ' — ' + rank.open.of + '개 가운데 ' + rank.open.pos + '번째다.' : K.open !== null ? '.' : ''));
    if (stats.basket) notes.push('같은 방향: 하루 변화가 묶음과 같은 방향이었던 날은 ' + stats.basket.n + '일 가운데 ' + stats.basket.same + '일' + (stats.basket.corr !== null ? '(상관계수 ' + cf(stats.basket.corr) + ')' : '') + (stats.xrp ? ', XRP와는 ' + stats.xrp.same + '일' + (stats.xrp.corr !== null ? '(' + cf(stats.xrp.corr) + ')' : '') : '') + '이다. ' + (stats.basket.corr !== null && Math.abs(stats.basket.corr) < 0.3 ? '**시장과 거의 따로 움직였다.**' : stats.basket.corr !== null && stats.basket.corr >= 0.6 ? '**시장과 같이 움직인 편이다.**' : '**시장과 느슨하게 같이 움직였다.**'));
    if (global) notes.push('전체 시황: 전체 시가총액은 **' + tri(global.mc) + ' 달러**(24시간 ' + sp(global.d1) + '), 비트코인 비중 ' + p1(global.btc_dom) + '다.' + (global.basket_share ? ' 주요 ' + coins.length + '종 묶음이 그 ' + p1(global.basket_share) + '다.' : ''));
    const bot = ranges.all.groups.find((g) => g.key === 'bot'), buyAll = ranges.all.kpi.buy_total, botShare = bot && buyAll > 0 ? bot.bought / buyAll : null;
    const limits = ['WLBN 값은 풀 두 곳에서 정해진 값이고' + (botShare !== null && botShare >= 0.2 ? ', 전체 기간(' + md(C.NOW_FROM) + '부터) 산 양의 ' + p1(botShare) + '를 Wellbian bot 계정이 샀다' : ' 거래가 얇다') + '. 시장과의 차이를 그대로 밖의 수요 차이로 읽지 않는다.',
      '코인 값은 CoinPaprika 공개 값이다. 하루 값의 기준 시각이 WLBN의 한국 시각 마감과 조금 어긋난다 — 풀에서 읽은 XRP 값과 대조하면 평균 1% 안팎 차이다. 묶음은 지금의 상위 ' + coins.length + '종을 지난 날에도 그대로 쓴다.',
      '지난 기록을 견준 값이고 앞날을 내다보는 값이 아니다.'];
    return { as_of: new Date(M.now.at + 9 * 3600000).toISOString().slice(0, 16).replace('T', ' '), from: first.date, to: last.date, d1_from: start.d1.date, d7_from: start.d7 ? start.d7.date : null,
      win: { d1: [last.date, last.date], d7: start.d7 ? [shift(start.d7.date, 1), last.date] : null, open: [first.date, last.date] },
      rows, series, lines: ['wlbn', 'basket'].concat(pickLines), coins: coins.map((c) => c.sym), stats, rank, global, notes, limits, source: 'CoinPaprika',
      short: W.d7 !== null && K.d7 !== null ? '같은 7일 ' + K.name + '은 ' + sp(K.d7) + (Bt && Bt.d7 !== null ? ', BTC는 ' + sp(Bt.d7) : '') + '였다' : null };
  };
  let market = null; try { market = buildMarket(); } catch (_) { market = null; }
  // ── 온체인 심층: 지갑마다 받은(산 · 옮겨 받은) 물량을 날짜별 묶음으로 쌓고, 나간 것은 오래된 묶음부터 덜어 낸다(선입선출).
  // 남은 묶음 = 지금 들고 있는 물량의 「받은 날 · 받은 때 값」. 지갑끼리 옮긴 물량은 묶음째 따라간다. 보는 지갑은 보상을 받는 지갑과 그 밖의 지갑(회사 계정 · 풀 · 사고팔기 지갑 제외)
  const buildDeep = () => {
    const rows = daily.filter((r) => r.date >= C.NOW_FROM); if (rows.length < 4 || !S.tf) return null;
    const idx = {}; rows.forEach((r, i) => { idx[r.date] = i; });
    const px = rows.map((r) => r.price_rlusd || null);       // 그날 마감 값. 없으면 가까운 날 값(10/26 은 풀이 열리기 전이라 10/27 값)
    for (let i = px.length - 2; i >= 0; i--) if (!px[i]) px[i] = px[i + 1]; for (let i = 1; i < px.length; i++) if (!px[i]) px[i] = px[i - 1];
    if (!px[0]) return null;
    const inPop = (a) => !!a && (G[a] === 'user' || G[a] === 'other'), Wd = {}, cell = (a, k) => { const d = Wd[a] || (Wd[a] = {}); return d[k] || (d[k] = [0, 0, 0, 0, 0, 0, 0]); };
    for (const e of EV) {            // 지갑 → 날짜 → [받은 양, 산 양, 든 돈, 판 양, 받은 돈, 풀에 넣음, 풀에서 뺌]
      if (!inPop(e.a) || idx[e.k] === undefined) continue; const c = cell(e.a, e.k);
      if (e.kind === 'paid') c[0] += e.v[0]; else if (e.kind === 'buy') { c[1] += e.v[0]; c[2] += e.v[1] || 0; } else if (e.kind === 'sell') { c[3] += e.v[0]; c[4] += e.v[1] || 0; }
      else if (e.kind === 'lp') { if (e.v[0] > 0) c[5] += e.v[0]; else c[6] -= e.v[0]; }
    }
    // 날짜가 붙은 이동: 그날 · 보낸 곳 · 받은 곳 · 양
    const moves = rows.map(() => []), net = {}, bump = (a, v) => { net[a] = (net[a] || 0) + v; };
    for (const key of Object.keys(S.tf)) { const p = key.split('|'), i = idx[p[0]], q = S.tf[key]; if (i === undefined || !(q > 1e-9)) continue; const a = inPop(p[1]) ? p[1] : null, b = inPop(p[2]) ? p[2] : null; if (!a && !b) continue;
      moves[i].push({ a, b, q }); if (a) { bump(a, -q); if (!Wd[a]) Wd[a] = {}; } if (b) { bump(b, q); if (!Wd[b]) Wd[b] = {}; } }
    for (const a of accts) if (inPop(a) && !Wd[a] && g2(S.bal, a) >= 1) Wd[a] = {};     // 기록 없이 들고만 있는 지갑
    const addrs = Object.keys(Wd), lots = {}, pooled = {}; for (const a of addrs) { lots[a] = []; pooled[a] = []; }
    const take = (L, q, sink) => { while (q > 1e-9 && L.length) { const l = L[0], t = Math.min(l.q, q); if (sink) sink(t, l); l.q -= t; q -= t; if (l.q <= 1e-9) L.shift(); } return q; };
    const have = (a) => lots[a].reduce((t, l) => t + l.q, 0);
    // 기간이 시작될 때 이미 들고 있던 양 = 지금 잔액 − 기간 안의 순증감. 「10/26 이전부터 보유」 묶음으로 깔아 둔다
    for (const a of addrs) { let f = net[a] || 0; for (const k of Object.keys(Wd[a])) { const c = Wd[a][k]; f += c[0] + c[1] + c[6] - c[3] - c[5]; } const open = Math.max(g2(S.bal, a), 0) - f; if (open > 1e-6) lots[a].push({ i: 0, q: open, p: px[0], s: 'old' }); }
    const bandOf = (l, i) => (l.s === 'old' || l.s === 'unk' ? l.s : DEEP.ages.find((x) => i - l.i <= x[0])[1]);
    const snap = (i) => { const p = px[i], b = { old: 0, unk: 0, lp: 0 }; for (const x of DEEP.ages) b[x[1]] = 0; let tot = 0, val = 0, up = 0;
      for (const a of addrs) { for (const l of lots[a]) { b[bandOf(l, i)] += l.q; tot += l.q; val += l.q * l.p; if (l.p < p) up += l.q; } for (const l of pooled[a]) b.lp += l.q; }
      return { b, tot, val, up, all: tot + b.lp }; };
    const out = [], raw = []; let prevTot = 0, forced = 0;
    for (let i = 0; i < rows.length; i++) {
      const day = rows[i].date, p = px[i]; let sold = 0, matched = 0, num = 0, den = 0, above = 0, cd = 0, movers = 0, sellers = 0, buyers = 0, recv = 0, fresh = 0, tin = 0, tout = 0;
      // ① 들어온 것: 보상 · 산 것 · 풀에서 뺀 것 · 보는 지갑 밖(회사 계정 등)에서 옮겨 받은 것
      for (const a of addrs) { const c = Wd[a][day]; if (!c) continue; const L = lots[a];
        if (c[0] > 0) { L.push({ i, q: c[0], p, s: day === C.NOW_FROM ? 'old' : 'paid' }); recv++; }       // 10/26 재지급분은 그 전부터 들고 있던 물량
        if (c[1] > 0) { L.push({ i, q: c[1], p: c[2] > 0 ? c[2] / c[1] : p, s: 'buy' }); buyers++; }
        if (c[6] > 0) { const left = take(pooled[a], c[6], (t, l) => { L.push({ i: l.i, q: t, p: l.p, s: l.s }); }); if (left > 1e-9) L.push({ i, q: left, p, s: 'in' }); } }
      for (const m of moves[i]) if (!m.a && m.b) { lots[m.b].push({ i, q: m.q, p, s: 'in' }); tin += m.q; }
      // ② 지갑끼리 옮긴 것: 묶음째 따라간다(받은 날 · 받은 때 값 그대로). 보낸 쪽 묶음이 모자라면 한 바퀴 더 돌려 본다
      let todo = moves[i].filter((m) => m.a && m.b);
      for (let pass = 0; pass < 4 && todo.length; pass++) { const rest = []; for (const m of todo) { if (have(m.a) + 1e-6 < m.q && pass < 3) { rest.push(m); continue; }
        const left = take(lots[m.a], m.q, (t, l) => { lots[m.b].push({ i: l.i, q: t, p: l.p, s: l.s }); }); if (left > 1e-6) { lots[m.b].push({ i, q: left, p, s: 'unk' }); forced += left; } } todo = rest; }
      // ③ 나간 것: 판 것 · 풀에 넣은 것 · 보는 지갑 밖으로 보낸 것
      for (const a of addrs) { const c = Wd[a][day]; if (!c) continue; const L = lots[a];
        if (c[3] > 0) { const sp = c[4] > 0 ? c[4] / c[3] : p; const left = take(L, c[3], (t, l) => { matched += t; num += t * sp; den += t * l.p; if (sp > l.p) above += t; cd += t * (i - l.i); }); forced += Math.max(left, 0); sold += c[3]; sellers++; }
        if (c[5] > 0) { const left = take(L, c[5], (t, l) => { pooled[a].push({ i: l.i, q: t, p: l.p, s: l.s }); }); if (left > 1e-6) { pooled[a].push({ i, q: left, p, s: 'unk' }); forced += left; } }   // 풀에 넣은 양은 판 것이 아니다
        if (c[1] > 0 || c[3] > 0 || c[5] > 0 || c[6] > 0) movers++;
        if (day > C.NOW_FROM && startOf(a) === day) fresh++; }
      for (const m of moves[i]) if (m.a && !m.b) { forced += Math.max(take(lots[m.a], m.q, null), 0); tout += m.q; }
      const sn = snap(i); raw.push({ num, den, matched, above, cd, sold });
      const o = { date: day, partial: !!rows[i].partial, price: rows[i].price_rlusd || null, total: r0(sn.all), cost: sn.tot > 0 ? r4(sn.val / sn.tot) : null, ratio: sn.val > 0 ? r3(p * sn.tot / sn.val) : null, above: sn.tot > 0 ? r3(sn.up / sn.tot) : null,
        sold: r0(sold), sold_ratio: den > 0 && matched >= 1 ? r3(num / den) : null, sold_above: matched >= 1 ? r3(above / matched) : null, sold_age: matched >= 1 ? Math.round(cd / matched * 10) / 10 : null,
        movers, sellers, buyers, receivers: recv, fresh, moved_in: r0(tin), moved_out: r0(tout), turnover: prevTot > 0 ? r4(sold / prevTot) : null };
      for (const k of Object.keys(sn.b)) o[k] = r0(sn.b[k]);
      out.push(o); prevTot = sn.tot;
    }
    // 맞춰 보기: 쌓은 묶음의 합과 실제 잔액. 어긋난 만큼만 덜거나 「기록 밖」으로 더한다
    const last = rows.length - 1; let drift = 0, actual = 0, holders = 0;
    for (const a of addrs) { const bal = Math.max(g2(S.bal, a), 0), m = have(a); actual += bal; if (bal >= 1) holders++;
      if (m > bal + 1e-6) { drift += m - bal; take(lots[a], m - bal, null); } else if (bal > m + 1e-6) { drift += bal - m; lots[a].push({ i: last, q: bal - m, p: px[last], s: 'unk' }); } }
    const fin = snap(last), keys = ['lp', 'old'].concat(DEEP.ages.map((x) => x[1]).reverse(), ['unk']), names = { lp: '풀에 넣어 둔 물량', old: '10/26 이전부터 보유(재지급분 포함)', unk: '기록이 맞지 않는 물량' }; for (const x of DEEP.ages) names[x[1]] = x[2];
    { const o = out[last]; for (const k of Object.keys(fin.b)) o[k] = r0(fin.b[k]); o.total = r0(fin.all); o.cost = fin.tot > 0 ? r4(fin.val / fin.tot) : null; o.ratio = fin.val > 0 ? r3(px[last] * fin.tot / fin.val) : null; o.above = fin.tot > 0 ? r3(fin.up / fin.tot) : null; }
    const now = { total: r0(fin.all), in_wallets: r0(fin.tot), holders, price: r4(px[last]), cost: fin.tot > 0 ? r4(fin.val / fin.tot) : null, ratio: fin.val > 0 ? r3(px[last] * fin.tot / fin.val) : null, above: fin.tot > 0 ? r3(fin.up / fin.tot) : null,
      bands: keys.filter((k) => out.some((o) => o[k] > 0)).map((k) => ({ key: k, name: names[k], amount: r0(fin.b[k]), share: fin.all > 0 ? r3(fin.b[k] / fin.all) : null })) };
    // 최근 7일(다 찬 날)과 직전 7일
    const fullI = rows.map((r, i) => (r.partial ? -1 : i)).filter((i) => i >= 0), w7 = fullI.slice(-7), p7 = fullI.slice(-14, -7);
    const agg = (ii) => { const t = { num: 0, den: 0, matched: 0, above: 0, cd: 0, sold: 0, movers: 0, fresh: 0, n: ii.length }; for (const i of ii) { for (const k of ['num', 'den', 'matched', 'above', 'cd', 'sold']) t[k] += raw[i][k]; t.movers += out[i].movers; t.fresh += out[i].fresh; } return t; };
    const A = agg(w7), P = agg(p7);
    const week = { from: w7.length ? rows[w7[0]].date : null, to: w7.length ? rows[w7[w7.length - 1]].date : null, sold: r0(A.sold), ratio: A.den > 0 ? r3(A.num / A.den) : null, above: A.matched >= 1 ? r3(A.above / A.matched) : null, age: A.matched >= 1 ? Math.round(A.cd / A.matched * 10) / 10 : null,
      prev_ratio: P.den > 0 ? r3(P.num / P.den) : null, prev_age: P.matched >= 1 ? Math.round(P.cd / P.matched * 10) / 10 : null, movers: A.n ? Math.round(A.movers / A.n * 10) / 10 : null, prev_movers: P.n === 7 ? Math.round(P.movers / P.n * 10) / 10 : null, fresh: A.fresh, prev_fresh: P.n === 7 ? P.fresh : null };
    // 크기별 보유와, 최근 7일 늘린 지갑 · 줄인 지갑(옮겨 받거나 보낸 것도 친다)
    const w7set = {}; for (const i of w7) w7set[i] = 1; const d7 = {}; for (const a of addrs) { let v = 0; for (const i of w7) { const c = Wd[a][rows[i].date]; if (c) v += c[0] + c[1] + c[6] - c[3] - c[5]; } d7[a] = v; }
    for (const i of w7) for (const m of moves[i]) { if (m.a) d7[m.a] -= m.q; if (m.b) d7[m.b] += m.q; }
    const sz = {}; for (const x of DEEP.sizes) sz[x[1]] = { key: x[1], name: x[2], wallets: 0, balance: 0, up: 0, down: 0, flat: 0, up_amt: 0, down_amt: 0 };
    let upAll = 0, downAll = 0, nUp = 0, nDown = 0;
    for (const a of addrs) { const bal = Math.max(g2(S.bal, a), 0), v = d7[a] || 0; if (bal < 1 && Math.abs(v) <= 1) continue; const o = sz[DEEP.sizes.find((x) => bal < x[0])[1]];
      if (bal >= 1) { o.wallets++; o.balance += bal; } if (v > 1) { o.up++; o.up_amt += v; upAll += v; nUp++; } else if (v < -1) { o.down++; o.down_amt -= v; downAll -= v; nDown++; } else if (bal >= 1) o.flat++; }
    const szRows = DEEP.sizes.map((x) => sz[x[1]]), nW = szRows.reduce((t, o) => t + o.wallets, 0), nB = szRows.reduce((t, o) => t + o.balance, 0);
    for (const o of szRows) { o.wallets_share = nW ? r3(o.wallets / nW) : null; o.balance_share = nB > 0 ? r3(o.balance / nB) : null; o.score = o.up_amt + o.down_amt > 0 ? Math.round(o.up_amt / (o.up_amt + o.down_amt) * 100) / 100 : null; o.balance = r0(o.balance); o.up_amt = r0(o.up_amt); o.down_amt = r0(o.down_amt); }
    const acc = { score: upAll + downAll > 0 ? Math.round(upAll / (upAll + downAll) * 100) / 100 : null, up: nUp, down: nDown, up_amt: r0(upAll), down_amt: r0(downAll) };
    // 요약 문장: 기록에 있는 사실과 산수만
    const n = (x) => Math.round(x).toLocaleString('en-US'), p1 = (x) => (x * 100).toFixed(1) + '%', f4 = (x) => Number(x).toFixed(4), notes = [], bd = (k) => now.bands.find((x) => x.key === k) || { amount: 0, share: 0 }, big = szRows[szRows.length - 1];
    if (now.total >= 1) {         // 셋 가운데 가장 큰 몫을 굵게
      const seg = [['b7', '받은 지 7일이 안 된 물량'], ['old', '10/26 이전부터 들고 있던 물량(재지급분 포함)'], ['lp', '풀에 넣어 둔 물량']].map(([k, t]) => ({ s: bd(k).share, t: p1(bd(k).share) + '가 ' + t }));
      const top = Math.max(...seg.map((x) => x.s));
      notes.push('보유 기간: 지갑과 풀에 있는 ' + n(now.total) + '개 가운데 ' + seg.map((x) => (x.s === top && top > 0 ? '**' + x.t + '**' : x.t)).join(', ') + '이다.');
    }
    if (now.cost) notes.push('취득가: 지갑에 든 물량의 평균 취득가(받은 날 값 기준)는 ' + f4(now.cost) + ' RLUSD, 지금 값은 ' + f4(now.price) + ' RLUSD다 — **지금 값이 평균 취득가의 ' + p1(now.ratio) + '**. 그 물량의 ' + p1(now.above) + '가 받은 때보다 높은 값에 있다.');
    if (week.ratio !== null) notes.push('판 물량: 최근 7일 판 ' + n(week.sold) + '개는 받은 때 값의 **' + week.ratio.toFixed(3) + '배**에 팔렸고' + (week.prev_ratio !== null ? '(직전 7일 ' + week.prev_ratio.toFixed(3) + '배)' : '') + ', 평균 **' + week.age + '일** 들고 있던 물량이다' + (week.prev_age !== null ? '(직전 7일 ' + week.prev_age + '일)' : '') + '.' + (week.age !== null && week.age <= 2 ? ' **받은 지 얼마 안 된 물량이 바로 나오는 흐름이다.**' : week.prev_age !== null && week.age >= week.prev_age + 3 ? ' **오래 들고 있던 물량이 나오기 시작했다.**' : ''));
    if (big && big.wallets) notes.push('쏠림: **' + big.name + ' 지갑 ' + big.wallets + '곳이 지갑에 든 물량의 ' + p1(big.balance_share) + '**를 들고 있다.' + (acc.score !== null ? ' 최근 7일 잔액을 늘린 지갑 ' + acc.up + '곳(' + n(acc.up_amt) + '개) · 줄인 지갑 ' + acc.down + '곳(' + n(acc.down_amt) + '개) — **늘린 물량 비중 ' + acc.score.toFixed(2) + '**.' : ''));
    if (week.movers !== null) notes.push('움직임: 스스로 움직인(사거나 팔거나 풀에 넣고 뺀) 지갑은 하루 평균 **' + week.movers + '곳**' + (week.prev_movers !== null ? '(직전 7일 ' + week.prev_movers + '곳)' : '') + ', 새로 들어온 지갑은 7일 동안 **' + week.fresh + '곳**' + (week.prev_fresh !== null ? '(직전 7일 ' + week.prev_fresh + '곳)' : '') + '이다.');
    const limits = ['「받은 때 값」은 보상을 받은 날 · 옮겨 받은 날의 마감 값(산 물량은 실제로 낸 값)이다. 보상은 돈을 내고 받은 것이 아니므로 손익이 아니라 받은 때와 지금의 값 차이로 읽는다.',
      '판 것은 오래된 물량부터 나간 것으로 본다(선입선출 — 가정). 지갑끼리 옮긴 물량은 받은 날과 값을 그대로 갖고 간다. 쌓은 기록과 실제 잔액이 어긋난 양은 잔액의 ' + (actual > 0 ? p1(drift / actual) : '—') + '다.',
      '10/26 이전부터 들고 있던 물량(재지급분 포함)은 받은 날을 알 수 없어 따로 묶었고, 값은 새 풀이 열린 날 값으로 매겼다. 지난 기록을 정리한 값이고 앞날을 내다보는 값이 아니다.'];
    return { from: rows[0].date, to: rows[last].date, bands: now.bands.map((x) => ({ key: x.key, name: x.name })), now, week, sizes: szRows, acc, days: out, notes, limits, quality: { drift: actual > 0 ? r4(drift / actual) : null, forced: r0(forced) },
      bench: DEEP.bench.map((x) => ({ metric: x[0], site: x[1], ours: x[2], status: x[3], note: x[4] })) };
  };
  let deep = null; try { deep = buildDeep(); } catch (_) { deep = null; }
  // ── 건강 신호 · 선순환 고리 · 그날 요약
  const buildHealth = (cut) => {
    const H = HEALTH, allDays = daily.filter((r) => !r.partial && r.date >= C.POOL_OPEN), fullDays = cut ? allDays.slice(0, -cut) : allDays;
    const W = fullDays.slice(-H.days), P = fullDays.slice(-2 * H.days, -H.days);
    if (W.length < 3) return null;
    const base = fullDays[fullDays.length - W.length - 1] || null;     // 창 바로 앞 날(가격 · 풀의 출발 값)
    const from = W[0].date, to = W[W.length - 1].date, hasPrev = P.length === W.length;
    const pFrom = hasPrev ? P[0].date : null, pTo = hasPrev ? P[P.length - 1].date : null;
    const n = (x) => Math.round(x).toLocaleString('en-US');
    const p1 = (x) => (Math.abs(x) * 100).toFixed(1) + '%', sp = (x) => (x < 0 ? '−' : '+') + p1(x);
    const f4 = (x) => Number(x).toFixed(4), d1 = (x) => (x >= 100 ? n(x) : String(Math.round(x * 10) / 10));
    const sumOf = (rows, f) => rows.reduce((t, r) => t + (r[f] || 0), 0), inWin = (k, a, b) => k >= a && k <= b;
    const B0 = H.index.bands[0] / 100, B1 = H.index.bands[1] / 100;
    const place = (v, T) => {
      const seg = (a, b) => (b > a ? Math.min(1, Math.max(0, (v - a) / (b - a))) : 1);
      return v < T[1] ? seg(T[0], T[1]) * B0 : v < T[2] ? B0 + seg(T[1], T[2]) * (B1 - B0) : B1 + seg(T[2], T[3]) * (1 - B1);
    };
    const pts = (p) => Math.floor(p * 100 + 1e-9);          // 점수는 내림 — 기준선에 못 미친 값이 기준 점수로 보이지 않게
    const mk = (key, name, ask, v, T, o) => {
      const ok = v !== null && v !== undefined && isFinite(v);
      return Object.assign({ key, name, ask, status: !ok ? 'na' : v < T[1] ? 'bad' : v < T[2] ? 'warn' : 'ok', pos: ok ? r3(place(v, T)) : 0, score: ok ? pts(place(v, T)) : null }, o);
    };

    // 원장 기록에서 창 안의 값
    const paidW = new Set(), paidP = new Set(); let newW = 0, botR = 0, botX = 0, opsOut = 0;
    for (const e of EV) {
      const inW = inWin(e.k, from, to);
      if (e.kind === 'paid' && e.g === 'user') { if (inW) paidW.add(e.a); else if (hasPrev && inWin(e.k, pFrom, pTo)) paidP.add(e.a); }
      if (!inW) continue;
      if (e.kind === 'buy' && e.g === 'bot') { botR += e.v[4] || 0; botX += e.v[5] || 0; }
      if (e.kind === 'paid' || e.kind === 'paidco') opsOut += e.v[0];
    }
    for (const a of ul) { const st0 = startOf(a); if (st0 && inWin(st0, from, to)) newW++; }
    const paid = sumOf(W, 'paid_user'), sold = sumOf(W, 'sell_user'), pPaid = sumOf(P, 'paid_user'), pSold = sumOf(P, 'sell_user');
    const payDays = W.filter((r) => r.paid_user > 0).length, botBuy = sumOf(W, 'buy_bot'), soldR = sumOf(W, 'sell_user_rlusd');
    const sellX = sumOf(W, 'sell_total') - sumOf(W, 'sell_arb');                                   // 사고팔기 지갑을 뺀 판 양
    const buyOut = sumOf(W, 'buy_user') + sumOf(W, 'buy_other');                                   // 밖에서 산 양
    const end = W[W.length - 1], start = base || W[0], rate = S.pR && S.pX ? S.pR / S.pX : 0;
    const quote = (r) => (r.pool_r_rlusd === null || r.pool_x_xrp === null ? null : r.pool_r_rlusd + r.pool_x_xrp * rate);
    const q0 = quote(start), q1 = quote(end), lpNet = sumOf(W, 'lp_user');
    const pr0 = start.price_rlusd, pr1 = end.price_rlusd, prs = W.map((r) => r.price_rlusd).filter((x) => x !== null);
    const trim = (t) => t.replace('.0%', '%'), tp = (x) => trim(p1(x)), ts = (x) => (x === 0 ? '0%' : trim(sp(x)));   // 경계값 표기
    const tick = (T, f) => [f(T[1]), f(T[2])];

    // 판매 대금: 밖의 지갑이 operations 계정으로 보낸 RLUSD
    const salesOf = (x, y) => {
      const o = { r: 0, n: 0, ru: 0, wallets: 0 }, ps = new Set();
      if (FD && x) for (const k of Object.keys(FD)) if (inWin(k, x, y)) { const m = FD[k]; o.r += m.r; o.n += m.n; for (const a of Object.keys(m.p || {})) { ps.add(a); if (users.has(a)) o.ru += m.p[a]; } }
      o.wallets = ps.size; return o;
    };
    const sW = salesOf(from, to), sP = salesOf(pFrom, pTo), spend = botR + botX * rate;        // spend = bot 이 쓴 돈(RLUSD 환산)
    const worse = (x, y) => (['ok', 'warn', 'bad'].indexOf(x) >= ['ok', 'warn', 'bad'].indexOf(y) ? x : y);

    const links = [];
    const ds = !fundOk ? null : hasPrev && sP.r > 0 ? sW.r / sP.r - 1 : sW.r > 0 ? 1 : null;      // 두 주 모두 0이면 견줄 수 없다(「100% 줄었다」가 아니다)
    links.push(mk('sale', '판매', '기기 · 이용권 판매 대금이 들어오나', ds, H.sale, {
      value: ds === null ? '—' : hasPrev && sP.r > 0 ? sp(ds) : n(sW.r), metric: hasPrev && sP.r > 0 ? '판매 대금 유입 · 직전 7일 대비' : '판매 대금 유입(RLUSD)', ticks: tick(H.sale, ts),
      read: !fundOk ? '판매 대금 기록을 아직 끝까지 받지 못했다.' : '지갑 ' + n(sW.wallets) + '곳이 operations 계정으로 ' + n(sW.r) + ' RLUSD를 보냈다' + (hasPrev ? '(직전 7일 ' + n(sP.r) + ')' : '') + '.' + (sW.r > 0 ? ' 이 가운데 보상을 받는 지갑이 낸 것이 ' + n(sW.ru) + ' RLUSD(' + p1(sW.ru / sW.r) + ')다.' : ''),
      short: !fundOk ? '판매 대금 기록이 모자라다' : '판매 대금 ' + n(sW.r) + ' RLUSD' + (hasPrev && sP.r > 0 ? '(직전 7일 대비 ' + sp(ds) + ')' : ''),
      caveat: 'RLUSD 결제분만 · 카드 결제는 원장에 없음',
    }));
    const dj = hasPrev && paidP.size ? paidW.size / paidP.size - 1 : null, payV = payDays + (H.days - W.length);
    const payL = mk('pay', '보상', '보상이 끊기지 않고 받는 지갑이 느나', dj === null ? payV : dj, dj === null ? H.pay : H.join, {
      value: dj === null ? payDays + '일' : sp(dj), metric: dj === null ? W.length + '일 가운데 지급된 날' : '보상 받은 지갑 수 · 직전 7일 대비', ticks: dj === null ? [H.pay[1] + '일', H.pay[2] + '일'] : tick(H.join, ts),
      read: '지갑 ' + n(paidW.size) + '곳이 보상을 받았다' + (hasPrev ? '(직전 7일 ' + n(paidP.size) + '곳)' : '') + '. 처음 받은 지갑은 ' + n(newW) + '곳이다. ' + W.length + '일 가운데 ' + payDays + '일 지급됐고 하루 평균 ' + n(paid / W.length) + '개다.',
      short: '보상 받은 지갑 ' + n(paidW.size) + '곳' + (dj === null ? '' : '(' + sp(dj) + ')') + ' · ' + W.length + '일 가운데 ' + payDays + '일 지급',
    });
    payL.status = worse(payL.status, payV < H.pay[1] ? 'bad' : payV < H.pay[2] ? 'warn' : 'ok');
    if (dj !== null) { const p2 = Math.min(place(dj, H.join), place(payV, H.pay)); payL.pos = r3(p2); payL.score = pts(p2); }
    links.push(payL);
    const sr = paid > 0 ? sold / paid : null;
    links.push(mk('hold', '보유', '받은 만큼 들고 있나', sr === null ? null : 1 - sr, H.hold, {
      value: sr === null ? '—' : p1(sr), metric: '받은 양 가운데 판 비율', ticks: [tp(1 - H.hold[1]), tp(1 - H.hold[2])],
      read: '받은 ' + n(paid) + '개 가운데 ' + n(sold) + '개를 팔았다' + (hasPrev && pPaid > 0 ? '. 직전 7일은 ' + p1(pSold / pPaid) + '였다' : '') + '.' + (sold > 0.5 ? ' 판 양은 RLUSD로 ' + n(soldR) + '개(' + p1(soldR / sold) + ') · XRP로 ' + n(sold - soldR) + '개(' + p1(1 - soldR / sold) + ')이고, 받은 대금은 ' + n(sumOf(W, 'got_rlusd_user')) + ' RLUSD와 ' + n(sumOf(W, 'got_xrp_user')) + ' XRP다.' : ''),
      short: sr === null ? '받은 양이 없다' : '받은 양의 ' + p1(sr) + '를 팔았다',
    }));
    const dq = q0 && q1 !== null ? q1 / q0 - 1 : null;
    links.push(mk('pool', '유동성', '풀이 깊어지고 있나', dq, H.pool, {
      value: dq === null ? '—' : sp(dq), metric: '두 풀에 든 RLUSD · XRP 변화', ticks: tick(H.pool, ts),
      read: dq === null ? '풀 기록이 모자라다.' : 'RLUSD 풀의 RLUSD ' + n(start.pool_r_rlusd) + ' → ' + n(end.pool_r_rlusd) + ', XRP 풀의 XRP ' + n(start.pool_x_xrp) + ' → ' + n(end.pool_x_xrp) + '. 일반 사용자 지갑이 풀에 넣은 양(순) ' + (lpNet < 0 ? '−' : '+') + n(Math.abs(lpNet)) + ' WLBN.',
      short: dq === null ? '풀 기록이 모자라다' : '풀에 든 RLUSD · XRP ' + sp(dq),
    }));
    const dm = sellX > 0.5 ? (buyOut + botBuy) / sellX : null;
    links.push(mk('demand', '수요', '판 양을 받아내고 있나', dm, H.demand, {
      value: dm === null ? '—' : p1(dm), metric: '판 양 대비 산 양', ticks: tick(H.demand, tp),
      read: '판 양 ' + n(sellX) + '개, 산 양 ' + n(buyOut + botBuy) + '개(밖의 지갑 ' + n(buyOut) + ' · Wellbian bot ' + n(botBuy) + ', 사고팔기 지갑 제외).' + (sellX > 0.5 ? ' 밖에서 산 양만 보면 판 양의 ' + p1(buyOut / sellX) + '다.' : ''),
      short: dm === null ? '판 양이 없다' : '산 양이 판 양의 ' + p1(dm) + (sellX > 0.5 ? '(밖의 지갑만 ' + p1(buyOut / sellX) + ')' : ''),
    }));
    const dp = pr0 && pr1 ? pr1 / pr0 - 1 : null;
    links.push(mk('price', '가격', '값은 얼마나 움직였나', dp, H.price, {
      value: dp === null ? '—' : sp(dp), metric: W.length + '일 가격 변화', ticks: tick(H.price, ts),
      read: dp === null ? '가격 기록이 모자라다.' : f4(pr0) + ' → ' + f4(pr1) + ' RLUSD. 이 기간 최저 ' + f4(Math.min.apply(null, prs)) + ' · 최고 ' + f4(Math.max.apply(null, prs)) + '.',
      short: dp === null ? '가격 기록이 모자라다' : '가격 ' + sp(dp),
    }));

    // 운용 점검: 지금 잔액이 며칠 치인지, 매입이 판매 대금 안인지
    const reserves = [], ops = Math.max(g2(S.bal, C.OPS), 0), outDay = opsOut / W.length;
    const payRun = outDay > 0 ? ops / outDay : null;
    reserves.push(mk('payrun', '지급 여력', '지급 계정에 며칠 치가 남았나', payRun, H.runway, {
      value: payRun === null ? '—' : d1(payRun) + '일분', metric: 'operations 계정 WLBN ÷ 하루 평균 지급', ticks: [H.runway[1] + '일', H.runway[2] + '일'],
      read: '지금 ' + n(ops) + '개가 있고, 최근 ' + W.length + '일 하루 평균 ' + n(outDay) + '개를 지급했다.',
      short: payRun === null ? '최근 지급이 없다' : '지급 계정 WLBN ' + d1(payRun) + '일분',
    }));
    const bots = Object.keys(G).filter((a) => G[a] === 'bot'), fund = labelAccts.filter((a) => H.funders.indexOf(L[a]) >= 0);
    const balOf = (list) => { const o = { r: 0, x: 0, n: 0 }; for (const a of list) if (liveBal[a]) { o.r += liveBal[a].rlusd || 0; o.x += liveBal[a].xrp || 0; o.n++; } return o; };
    const bB = balOf(bots), bF = balOf(fund), spendDay = spend / W.length;
    const buyRun = bB.n && spendDay > 0 ? (bB.r + bF.r + (bB.x + bF.x) * rate) / spendDay : null;
    reserves.push(mk('buyrun', '매입 여력', '매입에 쓸 돈이 며칠 치 남았나', buyRun, H.runway, {
      value: buyRun === null ? '—' : d1(buyRun) + '일분', metric: 'bot · ' + H.funders.join(' · ') + ' 잔액 ÷ 하루 평균 매입 지출', ticks: [H.runway[1] + '일', H.runway[2] + '일'],
      read: !bB.n ? '지금 잔액을 받지 못했다.' : 'bot 계정에 ' + n(bB.r) + ' RLUSD와 ' + n(bB.x) + ' XRP, bot에 돈을 보내 온 ' + H.funders.join(' · ') + ' 계정에 ' + n(bF.r) + ' RLUSD와 ' + n(bF.x) + ' XRP가 있다. ' + (spendDay > 0 ? '최근 ' + W.length + '일 하루 평균 ' + n(botR / W.length) + ' RLUSD와 ' + n(botX / W.length) + ' XRP를 썼다' + (bB.r + bB.x > 0 ? '(bot 계정만으로는 ' + d1((bB.r + bB.x * rate) / spendDay) + '일분)' : '') + '.' : '최근 ' + W.length + '일은 사지 않았다.'),
      short: buyRun === null ? (bB.n ? '최근 매입이 없다' : '잔액을 받지 못했다') : '매입에 쓸 잔액 ' + d1(buyRun) + '일분',
    }));
    const cov = !fundOk ? null : spend < 0.5 ? 0 : sW.r > 0 ? spend / sW.r : 9;
    reserves.push(mk('cover', '매입 재원', '판매 대금 안에서 사고 있나', cov === null ? null : -cov, H.cover, {
      value: cov === null ? '—' : spend < 0.5 ? '매입 없음' : sW.r > 0 ? p1(cov) : '판매 대금 없음', metric: '판매 대금 대비 매입 지출', ticks: [tp(-H.cover[1]), tp(-H.cover[2])],
      read: !fundOk ? '판매 대금 기록을 아직 끝까지 받지 못했다.' : 'Wellbian bot이 ' + n(botR) + ' RLUSD와 ' + n(botX) + ' XRP(환산 ' + n(spend) + ' RLUSD)를 썼고, 같은 기간 들어온 판매 대금은 ' + n(sW.r) + ' RLUSD다.',
      short: cov === null ? '판매 대금 기록이 모자라다' : spend < 0.5 ? '최근 매입이 없다' : sW.r > 0 ? '매입 지출이 판매 대금의 ' + p1(cov) : '판매 대금 없이 매입했다',
      caveat: '판매 대금은 RLUSD 결제분만 — 카드 결제분을 더하면 비율은 낮아진다',
    }));

    // ── 지표마다 결과에 따른 요약 인사이트. 기록에 있는 사실과 산수만 쓴다(앞날 전망 없음).
    const byKey = {}; for (const l of links.concat(reserves)) byKey[l.key] = l;
    const L3 = W.slice(-3), rowRate = (r) => (r.price_rlusd && r.price_xrp ? r.price_rlusd / r.price_xrp : rate);
    const spendOf = (rows) => rows.reduce((t, r) => t + (r.bot_pay_rlusd || 0) + (r.bot_pay_xrp || 0) * rowRate(r), 0);
    const s3 = sumOf(L3, 'sales_rlusd'), b3 = spendOf(L3);
    const DOW = ['일', '월', '화', '수', '목', '금', '토'], dow = (k) => new Date(k + 'T00:00:00Z').getUTCDay();
    const L3p = fullDays.slice(-10, -7), s3p = L3p.length === 3 && L3.length === 3 && dayDiff(L3p[0].date, L3[0].date) === 7 ? sumOf(L3p, 'sales_rlusd') : null;      // 한 주 전 같은 요일 사흘
    const wkend = L3.some((r) => dow(r.date) === 0 || dow(r.date) === 6), l3name = L3.length === 3 ? '최근 사흘(' + DOW[dow(L3[0].date)] + '~' + DOW[dow(L3[2].date)] + (wkend ? ' · 주말 포함' : '') + ')' : '최근 사흘';
    let topDay = null; for (const r of W) if (!topDay || (r.sales_rlusd || 0) > (topDay.sales_rlusd || 0)) topDay = r;
    const sellBy = {}, lpBy = { co: 0, user: 0 }; let kwPaid = 0;
    for (const e of EV) {
      if (!inWin(e.k, from, to)) continue;
      if (e.kind === 'sell' && e.g === 'user') add(sellBy, e.a, e.v[0]);
      else if (e.kind === 'lp' && (e.g === 'user' || GOWN[e.g])) lpBy[e.g === 'user' ? 'user' : 'co'] += (e.v[2] || 0) + (e.v[3] || 0) * rate;
      else if (e.kind === 'paidco' && e.g === 'kweather') kwPaid += e.v[0];
    }
    const sellList = Object.keys(sellBy).map((a) => sellBy[a]).sort((x, y) => y - x), top5 = sellList.slice(0, 5).reduce((t, x) => t + x, 0);
    const botShare = buyOut + botBuy > 0.5 ? botBuy / (buyOut + botBuy) : null, botDays = W.filter((r) => r.buy_bot > 0).length;
    let upBot = 1, upRest = 1, prevPr = start.price_rlusd;       // 가격 변화를 bot 이 산 날과 사지 않은 날로 나눈다
    for (const r of W) { if (prevPr && r.price_rlusd && r !== start) { if (r.buy_bot > 0) upBot *= r.price_rlusd / prevPr; else upRest *= r.price_rlusd / prevPr; } prevPr = r.price_rlusd || prevPr; }
    const slipOf = (P) => { const a = 10000 * (1 - (P.fee === undefined || P.fee === null ? 0.005 : P.fee)); return P.w > 0 && P.q > 0 ? (P.q * a / (P.w + a)) / 10000 / (P.q / P.w) - 1 : null; };
    const slX = slipOf(S.pools.X), slR = slipOf(S.pools.R);
    const xrpCh = start.price_rlusd && start.price_xrp && end.price_rlusd && end.price_xrp ? (end.price_rlusd / end.price_xrp) / (start.price_rlusd / start.price_xrp) - 1 : null;
    const st = (k) => byKey[k].status;
    {
      let t;                                       // 판매
      if (st('sale') === 'na') t = fundOk && sW.r === 0 && sP.r === 0 ? '최근 두 주 동안 RLUSD로 들어온 판매 대금이 없어 견주지 않았다. 카드 · 계좌 결제는 원장에 없다.' : '판매 대금 기록이 모자라 판단하지 않았다.';
      else {
        t = st('sale') === 'ok' ? 'RLUSD로 들어온 판매 대금이 직전 7일보다 늘었다.' : (st('sale') === 'warn' ? 'RLUSD로 들어온 판매 대금이 직전 7일보다 줄었다.' : 'RLUSD로 들어온 판매 대금이 직전 7일보다 크게 줄었다.') + ' 카드 · 계좌 결제는 원장에 없어, 전체 판매가 그만큼 줄었는지는 이 값만으로 알 수 없다.';
        if (L3.length === 3 && sW.r > 0 && s3 / sW.r < 0.1) t += ' ' + l3name + '은 ' + n(s3) + ' RLUSD다' + (s3p !== null ? ' — 한 주 전 같은 요일에는 ' + n(s3p) + ' RLUSD였다' + (s3p > 0 && s3 / s3p >= 0.5 ? '(요일 영향이 크다).' : s3p > 0 ? '.' : '(그때도 거의 없었다).') : '.');
        else if (sW.r > 0 && topDay && (topDay.sales_rlusd || 0) / sW.r >= 0.5) t += ' ' + p1(topDay.sales_rlusd / sW.r) + '가 ' + md(topDay.date) + ' 하루에 들어와, 큰 건 한두 번에 좌우된다.';
        if (sW.r > 0) t += sW.ru / sW.r >= 0.5 ? ' 들어온 돈의 ' + p1(sW.ru / sW.r) + '는 보상을 받는 지갑이 낸 것이라, 새 구매자보다 기존 참여자의 재구매가 중심이다.' : ' 보상을 받는 지갑이 낸 것은 ' + p1(sW.ru / sW.r) + '로, 새 지갑의 구매가 중심이다.';
      }
      byKey.sale.insight = t;
    }
    {
      let t = '';                                  // 보상
      const up = hasPrev && pPaid > 0 ? (paid / W.length) / (pPaid / P.length) - 1 : null;
      if (payDays < W.length) t = W.length + '일 가운데 ' + (W.length - payDays) + '일은 지급이 없었다. 지급 작업과 지급 계정 잔액을 확인할 일이다. ';
      if (dj !== null) t += dj >= H.join[2] ? '보상을 받는 지갑이 늘어 참여는 넓어지고 있다(처음 받은 지갑 ' + n(newW) + '곳).' : dj >= H.join[1] ? '보상을 받는 지갑 수가 제자리다. 새로 들어오는 참여자가 드물다(처음 받은 지갑 ' + n(newW) + '곳).' : '보상을 받는 지갑이 줄었다. 빠져나간 참여자가 있는지 볼 일이다.';
      else if (payDays === W.length) t += '지급은 끊기지 않았다. 견줄 직전 기간이 없어 지갑 수 변화는 보지 않았다.';
      if (up !== null && up >= 0.3) t += ' 하루 지급량도 ' + sp(up) + ' 늘어, 시장에 나올 수 있는 양이 그만큼 커졌다.';
      byKey.pay.insight = t.trim();
    }
    {
      let t;                                       // 보유
      if (sr === null) t = '받은 양이 없어 판단하지 않았다.';
      else {
        t = st('hold') === 'ok' ? '받은 양의 절반 넘게 들고 있다. 매도 압력이 작다.' : st('hold') === 'warn' ? '받은 양의 절반 넘게 판다. 보상이 쌓이기보다 흘러나가는 쪽이다.' : '받은 보상을 거의 그대로 팔아, 보상이 보유로 이어지지 않고 있다.';
        if (hasPrev && pPaid > 0 && Math.abs(sr - pSold / pPaid) >= 0.1) t += ' 판 비율이 직전 7일 ' + p1(pSold / pPaid) + '에서 ' + p1(sr) + '로 ' + (sr > pSold / pPaid ? '올랐다.' : '내렸다.');
        if (sold > 0.5) t += ' 판 지갑은 ' + n(sellList.length) + '곳이고 많이 판 다섯 곳이 판 양의 ' + p1(top5 / sold) + '다' + (top5 / sold >= 0.5 ? ' — 소수 지갑이 주도한다.' : ' — 여러 지갑에 퍼진 매도다.');
      }
      byKey.hold.insight = t;
    }
    {
      let t;                                       // 유동성
      if (dq === null) t = '풀 기록이 모자라 판단하지 않았다.';
      else {
        const dR = start.pool_r_rlusd ? end.pool_r_rlusd / start.pool_r_rlusd - 1 : null, dX = start.pool_x_xrp ? end.pool_x_xrp / start.pool_x_xrp - 1 : null;
        t = st('pool') === 'ok' ? '풀이 깊어져 같은 양을 팔아도 값이 덜 밀린다.' : st('pool') === 'warn' ? '풀에 든 RLUSD · XRP가 조금 줄었다. 같은 양을 팔 때 값이 더 밀린다.' : '풀에서 RLUSD · XRP가 많이 빠졌다. 같은 양을 팔 때 값이 눈에 띄게 더 밀린다.';
        if (dR !== null && dX !== null && Math.abs(dX - dR) >= 0.1) t += ' 달라진 것은 ' + (Math.abs(dX) >= Math.abs(dR) ? 'XRP 풀(' + sp(dX) + ')' : 'RLUSD 풀(' + sp(dR) + ')') + ' 쪽이다.';
        if (Math.abs(lpBy.co) + Math.abs(lpBy.user) > 1) t += ' 이 기간 풀에 넣은 돈(RLUSD 환산)은 Wellbian 계정 ' + (lpBy.co < 0 ? '−' : '') + n(Math.abs(lpBy.co)) + ' · 일반 사용자 지갑 ' + (lpBy.user < 0 ? '−' : '') + n(Math.abs(lpBy.user)) + ' — ' + (lpBy.co >= lpBy.user ? 'Wellbian 쪽이 채웠다.' : '일반 사용자 쪽이 채웠다.');
        if (slX !== null && slR !== null) t += ' 지금 1만 개를 한 번에 팔면 XRP 풀 ' + sp(slX) + ', RLUSD 풀 ' + sp(slR) + '다.';
      }
      byKey.pool.insight = t;
    }
    {
      let t;                                       // 수요
      if (dm === null) t = '판 양이 없어 판단하지 않았다.';
      else {
        const outShare = buyOut / sellX;
        if (st('demand') === 'ok') t = botShare !== null && botShare >= 0.5 ? '판 양은 다 받아냈지만 산 양의 ' + p1(botShare) + '가 Wellbian bot이다.' + (outShare < 1 ? ' 밖에서 산 양은 판 양의 ' + p1(outShare) + '라, bot이 사지 않는 날에는 받아낼 매수가 모자란다.' : '') : '밖의 지갑이 산 양만으로도 판 양을 받아냈다. 스스로 도는 수요가 있다.';
        else t = (st('demand') === 'warn' ? '산 양이 판 양에 못 미쳤다.' : '판 양의 절반도 받아내지 못했다.') + ' 남는 물량은 풀이 떠안아 값이 밀린다.' + (botShare !== null ? ' 산 양 가운데 Wellbian bot은 ' + p1(botShare) + '다.' : '');
        t += ' bot이 산 날은 ' + W.length + '일 가운데 ' + botDays + '일이다.';
      }
      byKey.demand.insight = t;
    }
    {
      let t;                                       // 가격
      if (dp === null) t = '가격 기록이 모자라다.';
      else {
        t = 'RLUSD 기준 값은 ' + W.length + '일 동안 ' + sp(dp) + '다.';      // 평가하는 말(버틴다 · 크게 내렸다)을 붙이지 않는다
        if (botDays > 0 && botDays < W.length) t += ' 나눠 보면 bot이 산 ' + botDays + '일 동안 ' + sp(upBot - 1) + ', 사지 않은 ' + (W.length - botDays) + '일 동안 ' + sp(upRest - 1) + '다' + (upBot - 1 > 0.01 && upRest - 1 <= 0.005 ? ' — 오른 폭은 bot이 산 날에 나왔다.' : '.');
        if (xrpCh !== null && start.price_xrp) t += ' XRP로 보면 ' + sp(end.price_xrp / start.price_xrp - 1) + '인데, XRP 값이 ' + sp(xrpCh) + ' 움직인 것이 겹쳐 있다.';
      }
      if (dp !== null && !cut && market && market.short) t += ' ' + market.short + '.';
      byKey.price.insight = t;
    }
    {
      let t;                                       // 지급 여력
      if (payRun === null) t = '최근 지급이 없어 계산하지 않았다.';
      else {
        t = st('payrun') === 'ok' ? '지급 계정에 한 달 치 넘게 있다. 당장 채울 일은 없다.' : st('payrun') === 'warn' ? '지급 계정 잔액이 한 달 치에 못 미친다. 최근 속도라면 ' + d1(payRun) + '일 안에 채워야 한다.' : '지급 계정 잔액이 일주일 치도 안 된다. 바로 채워야 지급이 끊기지 않는다.';
        if (kwPaid > 0.5 && opsOut > 0) t += ' 최근 지급 가운데 ' + n(kwPaid) + '개(' + p1(kwPaid / opsOut) + ')는 KWeather 계정으로 나간 것이라, 그런 지급이 없는 주에는 더 오래간다.';
      }
      byKey.payrun.insight = t;
    }
    {
      let t;                                       // 매입 여력
      const botOnly = bB.n && spendDay > 0 ? (bB.r + bB.x * rate) / spendDay : null;
      if (buyRun === null) t = bB.n ? '최근 ' + W.length + '일 매입이 없어 계산하지 않았다.' : '잔액을 받지 못해 계산하지 않았다.';
      else {
        t = st('buyrun') === 'ok' ? '매입에 쓸 돈이 한 달 치 넘게 있다.' : st('buyrun') === 'warn' ? '매입에 쓸 돈이 한 달 치에 못 미친다.' : '매입에 쓸 돈이 일주일 치도 안 된다.';
        if (botOnly !== null && botOnly < H.runway[1]) t += ' bot 계정에 든 것만으로는 ' + d1(botOnly) + '일분이라, 최근 속도로 사려면 그 안에 ' + H.funders.join(' · ') + ' 계정에서 옮겨 줘야 한다.';
        if (st('sale') === 'warn' || st('sale') === 'bad') t += ' 이 잔액을 채워 주는 판매 대금도 줄고 있다.';
      }
      byKey.buyrun.insight = t;
    }
    {
      let t;                                       // 매입 재원
      if (cov === null) t = '판매 대금 기록이 모자라 판단하지 않았다.';
      else if (spend < 0.5) t = '최근 ' + W.length + '일은 매입이 없었다.';
      else {
        t = st('cover') === 'ok' ? '매입에 쓴 돈이 같은 기간 판매 대금 안이다.' : st('cover') === 'warn' ? '매입에 쓴 돈이 판매 대금을 넘었다. 넘는 만큼은 쌓아 둔 잔액에서 나간다.' : '매입에 쓴 돈이 판매 대금의 두 배를 넘는다. 쌓아 둔 잔액이 빠르게 준다.';
        if (L3.length === 3 && b3 > 0.5) t += s3 > 0.5 ? (b3 > s3 ? ' 다만 ' + l3name + '만 보면 판매 대금 ' + n(s3) + ' RLUSD에 매입 지출 ' + n(b3) + ' RLUSD로 지출이 ' + d1(b3 / s3) + '배다.' : ' ' + l3name + '도 판매 대금 ' + n(s3) + ' RLUSD 안에서 ' + n(b3) + ' RLUSD를 썼다.') : ' 다만 ' + l3name + '은 판매 대금 없이 ' + n(b3) + ' RLUSD를 썼다.';
        t += ' 판매 대금 전체와 견준 값이라, 기기 원가 같은 다른 지출을 빼면 여유는 더 작다.';
      }
      byKey.cover.insight = t;
    }

    // 종합: 선순환 지수(0~100). 지수에 넣는 고리 점수의 평균과 가장 낮은 고리 점수를 섞는다(H.index). bands[0] 미만 주의 · bands[1] 이상 좋음
    const IX = H.index, pc = (x) => Math.round(x * 100) + '%', wOf = (l) => (IX.weights && IX.weights[l.key] !== undefined ? IX.weights[l.key] : 1);
    for (const l of links) { l.weight = wOf(l); if (l.weight < 1) { l.ref = l.weight === 0; l.ref_why = (IX.why && IX.why[l.key]) || ''; } if (IX.plain && IX.plain[l.key]) { l.plain = true; l.status = 'na'; l.score = null; l.pos = 0; } }
    const inIdx = links.filter((l) => l.weight > 0), refs = links.filter((l) => l.weight === 0), NUM = ['영', '한', '두', '세', '네', '다섯', '여섯', '일곱'], loopN = (NUM[inIdx.length] || inIdx.length) + ' 고리';
    const cnt = { ok: 0, warn: 0, bad: 0, na: 0 }; for (const l of inIdx) cnt[l.status]++;
    const scored = inIdx.filter((l) => l.score !== null);
    let index = null;
    if (scored.length) {
      const wSum = scored.reduce((t, l) => t + l.weight, 0), mean = Math.round(scored.reduce((t, l) => t + l.score * l.weight, 0) / wSum * 10) / 10;
      const full = scored.filter((l) => l.weight >= 1), pool = full.length ? full : scored;        // 가장 낮은 고리는 온전히 넣는 고리 가운데서만 고른다
      let weak = pool[0], top = pool[0]; for (const l of pool) { if (l.score < weak.score) weak = l; if (l.score > top.score) top = l; }
      const value = Math.round(mean * (1 - IX.weak) + weak.score * IX.weak);
      index = { value, status: value < IX.bands[0] ? 'bad' : value < IX.bands[1] ? 'warn' : 'ok', mean, min: weak.score, max: top.score, weak: { key: weak.key, name: weak.name, score: weak.score },
        bands: IX.bands, weak_weight: IX.weak, loops: inIdx.length, parts: links.map((l) => ({ key: l.key, name: l.name, score: l.score, status: l.status, weight: l.weight, ref: !!l.ref, plain: !!l.plain })),
        calc: (IX.weak === 0.5 ? '(평균 ' + mean + ' + 최저 ' + weak.score + ') ÷ 2' : '평균 ' + mean + ' × ' + pc(1 - IX.weak) + ' + 최저 ' + weak.score + ' × ' + pc(IX.weak)) + ' = ' + value,
        rules: ['선순환 지수 = ' + loopN + ' 점수의 평균 × ' + pc(1 - IX.weak) + ' + 가장 낮은 고리 점수 × ' + pc(IX.weak) + '. 고리는 가장 약한 곳만큼만 돌기 때문에 평균만 쓰지 않는다. ' + IX.bands[1] + '점 이상 좋음 · ' + IX.bands[0] + '~' + (IX.bands[1] - 1) + '점 지켜봄 · ' + IX.bands[0] + '점 미만 주의.',
          '고리 점수(0~100)는 보는 값이 기준선 사이 어디쯤인지를 옮긴 것이다. 주의 기준선이 ' + IX.bands[0] + '점, 좋음 기준선이 ' + IX.bands[1] + '점이고 그 사이와 바깥은 비례로 나눈다(온도계의 자리와 같다). 자료가 없는 고리는 뺀다.']
          .concat(refs.map((l) => l.name + ' 고리는 지수에 넣지 않는다 — ' + l.ref_why + (l.plain ? '. 점수도 매기지 않는다.' : '. 점수는 참고로 매긴다.'))) };
      if (!cut) {                                  // 추이: 같은 계산을 하루씩 앞당긴 창으로 되풀이한다(직전 7일과 견줄 수 있는 날부터)
        const series = [];
        for (let c = Math.min(IX.trend - 1, allDays.length - 1); c >= 1; c--) { const h = buildHealth(c); if (h && h.index && h.prev_from) series.push({ date: h.to, value: h.index.value, status: h.index.status, scores: h.index.parts.map((p) => p.score) }); }
        series.push({ date: to, value, status: index.status, scores: index.parts.map((p) => p.score) });
        const at = (k) => (series.length > k ? series[series.length - 1 - k] : null);
        index.series = series; index.prev = at(1); index.week = at(7); index.delta = index.prev ? value - index.prev.value : null;
        // 어제와 견줘 가장 많이 움직인 고리
        if (index.prev) { index.parts.forEach((p, i) => { const b = index.prev.scores[i]; p.prev = b; p.delta = p.score === null || b === null || b === undefined ? null : p.score - b; });
          const mv = index.parts.filter((p) => p.delta && p.weight > 0).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))[0]; index.moved = mv ? { key: mv.key, name: mv.name, from: mv.prev, to: mv.score } : null; }
      }
    }
    const overall = index ? index.status : 'na';
    const parts = [ST.ok + ' ' + cnt.ok]; if (cnt.warn) parts.push(ST.warn + ' ' + cnt.warn); if (cnt.bad) parts.push(ST.bad + ' ' + cnt.bad); if (cnt.na) parts.push('자료 없음 ' + cnt.na);
    const names = (st) => inIdx.filter((l) => l.status === st).map((l) => l.name);
    const blocked = names('bad'), watch = names('warn');
    const ida = (w) => w + ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? '이다' : '다');
    const idb = (w) => '**' + w + '**' + ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? '이다' : '다');      // 고리 이름만 굵게
    let headline = !index ? '선순환 ' + loopN + ' 가운데 ' + parts.join(' · ') + '.' : '**선순환 지수 ' + index.value + '점**(' + ST[index.status] + (index.prev ? ' · 어제 ' + index.prev.value + '점' : '') + ').';
    if (index) headline += index.mean - index.min >= 15 ? ' ' + loopN + ' 평균은 ' + Math.round(index.mean) + '점인데 **가장 약한 ' + index.weak.name + ' 고리가 ' + index.weak.score + '점**이라 지수를 끌어내렸다.' : ' ' + loopN + '가 **' + index.min + '~' + index.max + '점으로 고르다**.';
    headline += blocked.length ? ' 막힌 고리는 ' + (watch.length ? '**' + blocked.join(' · ') + '**, 지켜볼 고리는 ' + idb(watch.join(' · ')) : idb(blocked.join(' · '))) + '.' : watch.length ? ' 지켜볼 고리는 ' + idb(watch.join(' · ')) + '.' : ' **막힌 고리가 없다.**';
    if (refs.length) headline += ' ' + refs.map((l) => l.name + ' 고리는 ' + (l.plain ? '평가하지 않아' : '자료가 불완전해')).join(', ') + ' 지수에서 뺐다(참고 ' + refs.map((l) => l.name + ' ' + l.value).join(' · ') + ').';

    // 한 줄 정리: 고리끼리 이어서 읽는다
    const take = [];
    if (sr !== null) take.push(st('hold') === 'ok' ? '**받은 보상은 절반 넘게 보유**되고 있다.' : '**받은 보상의 ' + p1(sr) + '가 팔리고**' + (botShare !== null && botShare >= 0.5 ? ', 그 물량은 주로 **Wellbian bot 매입**이 받아낸다(산 양의 ' + p1(botShare) + ').' : ' 있다.'));
    if (st('sale') !== 'na') take.push('매입에 쓰는 기기 · 이용권 판매 대금(RLUSD 결제분만)은 ' + (st('sale') === 'ok' ? '늘었' : '직전 7일보다 **' + p1(Math.abs(ds)) + '** 줄었') + (L3.length === 3 && b3 > s3 && b3 > 0.5 ? '고, ' + l3name + '은 **매입 지출(' + n(b3) + ' RLUSD)이 판매 대금(' + n(s3) + ' RLUSD)을 넘었다**.' : '다.'));
    if (dq !== null && dp !== null) take.push('풀은 **' + (st('pool') === 'ok' ? '깊어졌고' : '얕아졌고') + '** RLUSD 기준 값은 **' + sp(dp) + '**다.');
    const takeaway = take.join(' ');

    // 그날 요약: 마지막으로 하루가 다 찬 날 + 오늘 지금까지
    const comments = [], D = end, Dp = fullDays[fullDays.length - 2] || null, T = daily[daily.length - 1];
    let dBotR = 0, dBotX = 0; for (const e of EV) if (e.k === D.date && e.kind === 'buy' && e.g === 'bot') { dBotR += e.v[4] || 0; dBotX += e.v[5] || 0; }
    let c = md(D.date) + ' 하루: 일반 사용자 지갑은 ' + n(D.paid_user) + '개를 받고 ' + n(D.sell_user) + '개를 팔았다(판 지갑 ' + n(D.user_sellers) + '곳). ';
    c += D.buy_bot > 0 ? 'Wellbian bot 계정이 ' + n(D.buy_bot) + '개를 사는 데 ' + n(dBotR) + ' RLUSD와 ' + n(dBotX) + ' XRP를 썼다.' : 'Wellbian bot 계정은 사지 않았다.';
    if (Dp && Dp.price_rlusd && D.price_rlusd) c += ' 가격은 ' + f4(Dp.price_rlusd) + '에서 ' + f4(D.price_rlusd) + ' RLUSD로 ' + sp(D.price_rlusd / Dp.price_rlusd - 1) + '.';
    if (fundOk && FD) c += ' 판매 대금은 ' + n((FD[D.date] || {}).r || 0) + ' RLUSD가 들어왔다.';
    comments.push(c);
    if (T && T.partial) comments.push(md(T.date) + ' ' + kstamp(S.asof).slice(11) + '까지: 받은 양 ' + n(T.paid_user) + ' · 판 양 ' + n(T.sell_user) + (T.buy_bot > 0 ? ' · Wellbian bot 매수 ' + n(T.buy_bot) : '') + (T.price_rlusd ? ' · 가격 ' + f4(T.price_rlusd) + ' RLUSD' : '') + '.');
    let c7 = '최근 ' + W.length + '일: 하루 평균 받은 양 ' + n(paid / W.length) + '개' + (hasPrev ? '(직전 7일 ' + n(pPaid / P.length) + ')' : '') + ' · 판 양 ' + n(sold / W.length) + '개' + (hasPrev ? '(직전 7일 ' + n(pSold / P.length) + ')' : '') + '.';
    if (fundOk) c7 += ' 판매 대금 ' + n(sW.r) + ' RLUSD' + (hasPrev ? '(직전 7일 ' + n(sP.r) + ')' : '') + '가 들어왔고, Wellbian bot이 매입에 ' + n(botR) + ' RLUSD와 ' + n(botX) + ' XRP를 썼다.';
    comments.push(c7);
    // XRP 값(RLUSD 기준)과, 그에 따라 달라진 「WLBN 1개로 받는 XRP」 · XRP로 판 비중
    const xr = (r) => (r && r.price_rlusd && r.price_xrp ? r.price_rlusd / r.price_xrp : null);
    const x0 = xr(start), x1 = xr(end), open = fullDays.find((r) => xr(r) !== null), xo = xr(open);
    const pSoldR = sumOf(P, 'sell_user_rlusd'), xShare = sold > 0.5 ? 1 - soldR / sold : null, pxShare = hasPrev && pSold > 0.5 ? 1 - pSoldR / pSold : null;
    let xrp = null;
    if (x0 && x1) {
      xrp = { from: r4(x0), to: r4(x1), change: r3(x1 / x0 - 1), open: xo ? r4(xo) : null, open_date: open ? open.date : null, since_open: xo ? r3(x1 / xo - 1) : null,
        wlbn_xrp_from: start.price_xrp, wlbn_xrp_to: end.price_xrp, sold_xrp_share: xShare === null ? null : r3(xShare), prev_sold_xrp_share: pxShare === null ? null : r3(pxShare) };
      let cx = 'XRP 값(두 풀의 가격으로 계산): 1 XRP가 ' + f4(x0) + ' → ' + f4(x1) + ' RLUSD(' + sp(x1 / x0 - 1) + ')' + (xo && open.date < start.date ? ', 풀이 열린 ' + md(open.date) + '(' + f4(xo) + ')보다는 ' + sp(x1 / xo - 1) : '') + '다.';
      cx += ' 그만큼 WLBN 1개로 받는 XRP는 ' + f4(start.price_xrp) + ' → ' + f4(end.price_xrp) + '개가 됐다.';
      if (xShare !== null) cx += ' 같은 기간 XRP로 판 비중은 ' + (pxShare !== null ? p1(pxShare) + ' → ' : '') + p1(xShare) + '다.';
      comments.push(cx);
    }
    if (!cut && market && market.notes.length) comments.push('시장과 견주면 — ' + market.notes[0].replace(/^최근 7일\([^)]*\): /, ''));
    const why = (st) => inIdx.filter((l) => l.status === st).map((l) => l.name + ' — ' + l.short).join(' / ');
    const refD = refs.filter((l) => !l.plain), refP = refs.filter((l) => l.plain);
    if (refD.length) comments.push('참고(지수 제외): ' + refD.map((l) => l.short).join(' / ') + '. 카드 · 계좌 결제는 원장에 없어 점수에 넣지 않는다.');
    for (const l of refP) if (l.value !== '—') comments.push(l.name + '(평가하지 않음): ' + l.metric + ' ' + l.value + ' · ' + l.read);
    if (blocked.length || watch.length) comments.push((blocked.length ? '막힌 고리: ' + why('bad') + '.' : '') + (blocked.length && watch.length ? ' ' : '') + (watch.length ? '지켜볼 고리: ' + why('warn') + '.' : ''));
    const low = reserves.filter((r) => r.status === 'bad' || r.status === 'warn');
    if (low.length) comments.push('운용 점검: ' + low.map((r) => r.short + '(' + ST[r.status] + ')').join(' / ') + '.');

    const rng = (T, f) => ({ ok: f(T[2]) + ' 이상', warn: f(T[1]) + ' ~ ' + f(T[2]), bad: f(T[1]) + ' 미만' });
    const rules = [
      Object.assign({ name: '판매', metric: '밖의 지갑이 operations 계정으로 보낸 RLUSD가 직전 7일보다 얼마나 늘었나(카드 · 계좌 결제는 원장에 없어 빠진다)' }, rng(H.sale, ts)),
      Object.assign({ name: '보상', metric: '보상 받은 지갑 수가 직전 7일보다 얼마나 늘었나. 지급된 날이 ' + H.pay[2] + '일에 못 미치면 지켜봄, ' + H.pay[1] + '일 미만이면 주의로 낮춘다' }, rng(H.join, ts)),
      { name: '보유', metric: '받은 양 가운데 판 비율(판 양 ÷ 받은 양)', ok: tp(1 - H.hold[2]) + ' 이하', warn: tp(1 - H.hold[2]) + ' ~ ' + tp(1 - H.hold[1]), bad: tp(1 - H.hold[1]) + ' 초과' },
      Object.assign({ name: '유동성', metric: '두 풀에 든 RLUSD와 XRP(지금 환율로 합침)의 7일 변화' }, rng(H.pool, ts)),
      Object.assign({ name: '수요', metric: '판 양 대비 산 양. 밖의 지갑과 Wellbian bot이 산 양을 더하고 사고팔기 지갑은 뺀다' }, rng(H.demand, tp)),
      { name: '가격', metric: '7일 전 마감 가격 대비 변화(평가하지 않는다 — 숫자만 보여 준다)', ok: '—', warn: '—', bad: '—' },
      { name: '지급 · 매입 여력', metric: '지금 잔액 ÷ 최근 7일 하루 평균(지급 · 매입 지출)', ok: H.runway[2] + '일분 이상', warn: H.runway[1] + ' ~ ' + H.runway[2] + '일분', bad: H.runway[1] + '일분 미만' },
      { name: '매입 재원', metric: 'Wellbian bot이 쓴 돈(RLUSD 환산) ÷ 같은 기간 판매 대금', ok: tp(-H.cover[2]) + ' 이하', warn: tp(-H.cover[2]) + ' ~ ' + tp(-H.cover[1]), bad: tp(-H.cover[1]) + ' 초과' },
    ];
    const ruleOf = { sale: '판매', pay: '보상', hold: '보유', pool: '유동성', demand: '수요', price: '가격', payrun: '지급 · 매입 여력', buyrun: '지급 · 매입 여력', cover: '매입 재원' };
    for (const l of links.concat(reserves)) { const r = rules.find((x) => x.name === ruleOf[l.key]); if (r) l.rule = { metric: r.metric, ok: r.ok, warn: r.warn, bad: r.bad }; }
    return {
      from, to, prev_from: pFrom, prev_to: pTo, days: W.length, day: D.date,
      overall: { status: overall, label: ST[overall], ok: cnt.ok, warn: cnt.warn, bad: cnt.bad, na: cnt.na, total: inIdx.length, loops: loopN, refs: refs.map((l) => l.name), counts: parts.join(' · ') },
      index, headline, takeaway, comments, links, reserves, rules, xrp, labels: ST,
      // 창 안의 값 그대로(발표 화면이 쓴다 — 고리 글에 든 숫자와 같은 값)
      facts: { paid_wallets: paidW.size, paid_wallets_prev: hasPrev ? paidP.size : null, new_wallets: newW, pay_days: payDays, win_days: W.length, paid_avg: Math.round(paid / W.length),
        sell_x: Math.round(sellX), buy_all: Math.round(buyOut + botBuy), buy_out: Math.round(buyOut), bot_buy: Math.round(botBuy), payrun: payRun === null ? null : Math.round(payRun * 10) / 10 },
      limits: [LIMIT_CARD + ' 판매 고리와 매입 재원은 그만큼 낮게(나쁘게) 보일 수 있다 — 하한으로 읽는다.', 'XRP 등 다른 통화로 낸 결제, operations 말고 다른 계정으로 받은 결제도 빠져 있다.'],
    };
  };
  const health = buildHealth();

  // 지갑별 날짜 기록: 지갑 하나를 골라 따라가 볼 때 쓴다. [날짜 번호, 받은 양, 판 양, 산 양, RLUSD로 판 양, 받은 RLUSD, 받은 XRP, 풀에 넣은 양, 다시 산 RLUSD]
  const wIds = {}; for (const w of ranges.all.wallets) wIds[w.id] = 1;
  const dayIx = {}; days.forEach((k, i) => { dayIx[k] = i; });
  const wd = {}, cell = (a, k) => { const id = short(a), i = dayIx[k]; if (!wIds[id] || i === undefined) return null; const m = wd[id] || (wd[id] = {}); return m[i] || (m[i] = [i, 0, 0, 0, 0, 0, 0, 0, 0]); };
  for (const e of EV) {
    const c = cell(e.a, e.k); if (!c) continue;
    if (e.kind === 'paid') c[1] += e.v[0];
    else if (e.kind === 'sell') { c[2] += e.v[0]; c[4] += byCur(e.v)[0]; c[5] += e.v[4] || 0; c[6] += e.v[5] || 0; }
    else if (e.kind === 'buy') c[3] += e.v[0];
    else if (e.kind === 'lp') c[7] += e.v[0];
  }
  if (FD) for (const k of Object.keys(FD)) for (const a of Object.keys(FD[k].p || {})) { const c = cell(a, k); if (c) c[8] += FD[k].p[a]; }
  const walletDays = { days, w: {} };
  for (const id of Object.keys(wd)) walletDays.w[id] = Object.keys(wd[id]).map((i) => wd[id][i].map(r0)).sort((x, y) => x[0] - y[0]);


  // ── 부정 쪽(부담) 지갑의 자금 흐름: 유입 전(어디서 왔나) · 행선지(어디로 갔나 — 3단계까지) ──
  //   · 원장 내역은 lib/trace.js 가 하루 한 번 받아 S.trace 에 둔다. 여기서는 정리 · 분류만 한다. 전체 기간 기준
  //   · 유입 전: WLBN 이 어디서 왔나(보상 · 풀에서 삼 · 다른 지갑에서 옮겨 받음 — 지금 풀이 열리기 전 기록까지) + 계정을 만든(처음 채운) 곳 + 기간에 받은 송금
  //   · 받은 만큼만 따라가기: 중간 지갑이 보낸 돈은 「그 지갑이 받은 금액」까지만, 보낸 곳 비율대로 나눠 따라간다. 덜 보냈으면 남은 만큼은 「받은 지갑에 머묾」
  //   · 끝나는 곳: 목적지 태그가 붙는 주소(거래소 입금 꼴) · 거래가 많은 계정 · 회사 계정 · 우리 표의 지갑 · 3단계
  const buildTrace = () => {
    const tr = S.trace; if (!tr || !tr.day || !tr.roots || !tr.roots.length) return null;
    const ND = tr.nodes || {}, isRoot = {}, TAG = {}, r1 = (x) => Math.round(x * 10) / 10;
    tr.roots.forEach((a) => { isRoot[a] = 1; });
    for (const a of Object.keys(ND)) for (const b of Object.keys(ND[a].out || {})) if (ND[a].out[b][2] > 0) TAG[b] = 1;
    const who = (a, self) => {
      let kind = 'other', name = '';
      if (a === C.ISSUER || L[a] === 'issuer') kind = 'issuer';                   // 발행 계정 · 풀 계정은 이름표가 있어도 회사 계정으로 치지 않는다(되돌린 돈이 아니다)
      else if (isAmm(a) || L[a] === 'amm' || L[a] === 'ammXrp') kind = 'pool';
      else if (L[a]) { kind = 'company'; name = tagged(labelOwner(L[a]), labelName(L[a])).full; }
      else if (TAG[a]) kind = 'exch';
      else if (isRoot[a] && a !== self) { kind = 'root'; name = ROW[a] ? ROW[a].type_name : ''; }
      else if (ROW[a] && a !== self) { kind = 'ours'; name = ROW[a].type_name; }
      else if (ND[a] && ND[a].more) kind = 'hub';
      const o = { id: short(a), kind, name: name || TRACE_KIND[kind] };
      if (kind === 'ours' || kind === 'root') o.impact = ROW[a] ? ROW[a].impact : null;
      if (opts.showAddr) o.addr = a;
      return o;
    };
    const rows = [], endTot = {}, endW = {}, hopTot = {}, hopW = {}, FUND = {}, links = [], toCo = {}, orig = { reward: [0, 0], bought: [0, 0], moved: [0, 0], none: [0, 0] };
    let took = 0, sent = 0, sx = 0, sr = 0, sw = 0, sentW = 0, quietW = 0, inX = 0, inR = 0, failed = 0, partial = 0;
    const srcSum = { paid: 0, bought: 0, moved: 0, before_paid: 0, before_bought: 0, before_moved: 0 };
    const movedIn = {}, sentTo = {};      // 받은 곳 → { 보낸 곳: WLBN 양 }(풀이 열린 뒤 지갑 사이 이동) · 받은 곳 → [WLBN 을 보낸 적 있는 곳](전 기간)
    for (const key of Object.keys(S.tf || {})) { const p = key.split('|'); if (p[0] < C.NOW_FROM || !p[1] || !p[2] || !isRoot[p[2]]) continue; add(movedIn[p[2]] || (movedIn[p[2]] = {}), p[1], S.tf[key]); }
    for (const s of Object.keys(S.edges || {})) for (const a of Object.keys(S.edges[s])) if (isRoot[a] && s !== C.OPS) (sentTo[a] || (sentTo[a] = [])).push(s);
    for (const a of tr.roots) {
      const w = ROW[a], n = ND[a];
      if (!w) continue;
      const row = { id: short(a), wallet: w.wallet, type_name: w.type_name, impact: w.impact, took: r0(w.took_rlusd || 0), sold: w.sold, paid: w.paid, bought: w.bought, balance: w.balance };
      if (opts.showAddr) row.addr = a;
      // 유입 전 ① WLBN 출처
      const mi = movedIn[a] || {}, miSum = Object.keys(mi).reduce((t, b) => t + mi[b], 0), bp = g2(B.paid, a), bb = g2(B.bought, a), bm = g2(B.tin, a);
      const by = { reward: w.paid + bp, bought: w.bought + bb, moved: miSum + bm }, ok = ['reward', 'bought', 'moved'].sort((x, y) => by[y] - by[x])[0], origin = by[ok] >= 0.5 ? ok : 'none';
      const fromIds = {}; for (const b of Object.keys(mi).filter((x) => mi[x] >= 0.5).sort((x, y) => mi[y] - mi[x])) fromIds[b] = mi[b]; for (const b of sentTo[a] || []) if (!(b in fromIds)) fromIds[b] = 0;
      row.src = { origin, origin_name: TRACE_ORIGIN[origin], paid: r0(w.paid), bought: r0(w.bought), moved: r0(miSum), before_paid: r0(bp), before_bought: r0(bb), before_moved: r0(bm),
        from: Object.keys(fromIds).slice(0, 5).map((b) => Object.assign(who(b, a), { wlbn: r0(fromIds[b]) })) };
      srcSum.paid += w.paid; srcSum.bought += w.bought; srcSum.moved += miSum; srcSum.before_paid += bp; srcSum.before_bought += bb; srcSum.before_moved += bm;
      orig[origin][0] += 1; orig[origin][1] += w.took_rlusd || 0; took += w.took_rlusd || 0;
      if (!n || n.err) { row.err = true; failed += 1; row.sent = 0; row.hop1 = []; row.ends = []; row.chains = []; row.ins = []; row.funder = null; row.main = null; rows.push(row); continue; }
      if (n.more) { row.partial = true; partial += 1; }
      row.txs = n.n;
      // 유입 전 ② 기간에 받은 송금(XRP · RLUSD · WLBN) ③ 계정을 만든 곳
      const inKeys = Object.keys(n.in || {});
      row.ins = inKeys.filter((b) => n.in[b][0] >= 1).slice(0, 5).map((b) => { const v = n.in[b]; return Object.assign(who(b, a), { v: r0(v[0]), n: v[1], xrp: r1(v[2]), rlusd: r1(v[3]), wlbn: r0(v[4]) }); });
      const ix = inKeys.filter((b) => !L[b]).reduce((t, b) => t + n.in[b][2], 0), ir = inKeys.filter((b) => !L[b]).reduce((t, b) => t + n.in[b][3], 0);
      row.in_xrp = r1(ix); row.in_rlusd = r1(ir); inX += ix; inR += ir;
      if (n.first) {
        const f = n.first[0], fo = who(f, a);
        row.funder = Object.assign({}, fo, { xrp: n.first[1], day: n.first[2], back: n.out && n.out[f] ? r0(n.out[f][0]) : 0 });
        (FUND[f] || (FUND[f] = { who: fo, ids: [] })).ids.push(row.id);
      } else row.funder = null;
      // 행선지: 1단계(직접 보낸 곳) → 받은 만큼만 2 · 3단계
      const ends = {}, chains = [], end = (kind, v, path) => { if (!(v >= 0.005)) return; add(ends, kind, v); if (path && path.length) chains.push({ v, end: kind, path }); };
      const follow = (b, v, hop, path, seen) => {
        const k = path[path.length - 1].kind;
        if (k !== 'other') return end(k, v, path);
        const m = ND[b];
        if (hop >= TRACE.depth || !m || m.err || m.d < 0) return end('other', v, path);
        const mt = m.tot ? m.tot[0] : 0, pass = Math.min(v, mt);
        if (v - pass >= 0.005) end('kept', v - pass, path);
        if (!(pass >= 0.005) || !(mt > 0)) return;
        let used = 0;
        for (const c of Object.keys(m.out)) {
          const part = pass * m.out[c][0] / mt; used += part;
          if (c === a || seen.indexOf(c) >= 0) { end('back', part, path); continue; }
          follow(c, part, hop + 1, path.concat([who(c, a)]), seen.concat([c]));
        }
        if (pass - used >= 0.005) end('other', pass - used, path);
      };
      const tot = n.tot || [0, 0, 0, 0], outs = Object.keys(n.out || {});
      row.sent = r0(tot[0]); row.sent_n = tot[1];
      row.sent_xrp = r1(outs.reduce((t, b) => t + n.out[b][3], 0)); row.sent_rlusd = r1(outs.reduce((t, b) => t + n.out[b][4], 0)); row.sent_wlbn = r0(outs.reduce((t, b) => t + n.out[b][5], 0));
      const h1 = {}; let listed = 0;
      row.hop1 = outs.map((b) => {
        const v = n.out[b], o = who(b, a); listed += v[0]; add(h1, o.kind, v[0]);
        follow(b, v[0], 1, [o], [b]);
        if ((o.kind === 'ours' || o.kind === 'root') && v[0] >= TRACE.min) links.push({ from: row.id, from_type: w.type_name, to: o.id, to_type: o.name, to_kind: o.kind, to_impact: o.impact, to_impact_name: o.impact ? TRACE_SIDE[o.impact] : '', v: r0(v[0]), wlbn: r0(v[5]) });
        if (o.kind === 'company' && v[0] >= TRACE.min) { const c = toCo[b] || (toCo[b] = { name: o.name, v: 0, xrp: 0, rlusd: 0, wlbn: 0, ids: [] }); c.v += v[0]; c.xrp += v[3]; c.rlusd += v[4]; c.wlbn += v[5]; c.ids.push(row.id); }
        return Object.assign({}, o, { v: r0(v[0]), n: v[1], tag: v[2], xrp: r1(v[3]), rlusd: r1(v[4]), wlbn: r0(v[5]) });
      });
      if (tot[0] - listed >= 0.5) { add(h1, 'other', tot[0] - listed); end('other', tot[0] - listed, null); }
      row.hop1 = row.hop1.slice(0, 8);
      row.to_company = r0(h1.company || 0);
      row.ends = TRACE_ORDER.filter((k) => ends[k] >= 0.5).map((k) => ({ key: k, name: TRACE_KIND[k], v: r0(ends[k]), share: tot[0] > 0 ? r3(ends[k] / tot[0]) : null })).sort((x, y) => y.v - x.v);
      row.main = row.ends.length ? row.ends[0].key : null;
      row.chains = chains.filter((c) => c.v >= 1).sort((x, y) => y.v - x.v).slice(0, 6).map((c) => ({ v: r0(c.v), end: c.end, end_name: TRACE_KIND[c.end], path: c.path.map((p) => ({ id: p.id, kind: p.kind, name: p.name })) }));
      row.reach = row.chains.reduce((t, c) => Math.max(t, c.path.length), 0);
      if (tot[0] >= 1) { sentW += 1; sent += tot[0]; sx += row.sent_xrp; sr += row.sent_rlusd; sw += row.sent_wlbn; for (const k of Object.keys(ends)) { add(endTot, k, ends[k]); if (ends[k] >= 1) add(endW, k, 1); } for (const k of Object.keys(h1)) { add(hopTot, k, h1[k]); if (h1[k] >= 1) add(hopW, k, 1); } }
      else quietW += 1;
      rows.push(row);
    }
    if (!rows.length) return null;
    rows.sort((x, y) => (y.took - x.took) || (y.sent - x.sent));
    const mix = (tot, cnt) => TRACE_ORDER.filter((k) => tot[k] >= 0.5).map((k) => ({ key: k, name: TRACE_KIND[k], v: r0(tot[k]), share: sent > 0 ? r3(tot[k] / sent) : null, wallets: cnt[k] || 0 })).sort((x, y) => y.v - x.v);
    const endMix = mix(endTot, endW), hopMix = mix(hopTot, hopW);
    // 계정을 만든 곳: 회사 계정이 열어 준 지갑 / 거래소 · 서비스로 보이는 주소 / 우리 표의 지갑 / 그 밖. 회사 계정이 아닌 같은 주소가 두 곳 이상을 채웠으면 한 묶음(같은 주인일 수 있다)
    const funders = Object.keys(FUND).map((f) => ({ id: FUND[f].who.id, kind: FUND[f].who.kind, name: FUND[f].who.name, impact: FUND[f].who.impact || null, wallets: FUND[f].ids.length, ids: FUND[f].ids })).sort((x, y) => y.wallets - x.wallets);
    const fKnown = funders.reduce((t, f) => t + f.wallets, 0), fKinds = {}; for (const f of funders) add(fKinds, f.kind, f.wallets);
    const fShared = funders.filter((f) => f.kind !== 'company' && f.wallets >= 2), fOurs = funders.filter((f) => f.kind === 'ours' || f.kind === 'root');
    const companyTo = Object.keys(toCo).map((b) => ({ name: toCo[b].name, v: r0(toCo[b].v), xrp: r0(toCo[b].xrp), rlusd: r0(toCo[b].rlusd), wlbn: r0(toCo[b].wlbn), wallets: toCo[b].ids.length, ids: toCo[b].ids })).sort((x, y) => y.v - x.v);
    links.sort((x, y) => y.v - x.v);
    const nowLoad = ranges.all.wallets.filter((w) => w.impact === 'load').length, stillLoad = rows.filter((r) => r.impact === 'load').length;
    const share = (k, list) => { const o = list.find((x) => x.key === k); return o ? o.share || 0 : 0; }, val = (k, list) => { const o = list.find((x) => x.key === k); return o ? o.v : 0; }, cnt = (k, list) => { const o = list.find((x) => x.key === k); return o ? o.wallets : 0; };
    // ── 양상: 지갑마다 유입 전 · 행선지를 한 가지 모습으로 읽는다(위에서부터 먼저 맞는 것). 원장에 보이는 움직임으로 붙인 이름이다
    //   company — 회사 계정에 넣은 돈이 가져간 돈 이상(100 RLUSD 환산 이상) · linked — 우리 표의 다른 지갑으로 옮긴 것이 가져간 돈 이상이거나, 그 지갑이 계정을 만들어 줬다
    //   quiet — 밖으로 보낸 송금이 없다 · outside — WLBN 출처가 보상이 아니다 · cashout — 끝 행선지의 절반 이상이 거래소 입금 꼴 · park — 그 밖(다른 지갑으로 옮김)
    const PAT = { cashout: '팔아서 거래소로 보내는 지갑', quiet: '팔고 대금을 지갑에 둔 지갑', park: '다른 지갑으로 옮겨 둔 지갑', company: '회사 계정에 돈을 넣은 지갑', linked: '지갑별 표의 다른 지갑과 이어진 지갑', outside: '밖에서 들어온 거래 지갑' };
    const linkOfRow = (r) => r.hop1.filter((h) => h.kind === 'ours' || h.kind === 'root');
    const patOf = (r) => {
      const lv = linkOfRow(r).reduce((t, h) => t + h.v, 0), ex = r.ends.find((e) => e.key === 'exch');
      if (r.to_company >= 100 && r.to_company >= r.took) return 'company';
      if ((lv >= 100 && lv >= r.took) || (r.funder && (r.funder.kind === 'ours' || r.funder.kind === 'root'))) return 'linked';
      if (!(r.sent >= 1)) return 'quiet';
      if (r.src.origin !== 'reward') return 'outside';
      return ex && ex.share >= 0.5 ? 'cashout' : 'park';
    };
    const pm = {};
    for (const r of rows) {
      const k = r.err ? 'quiet' : patOf(r); r.pattern = k; r.pattern_name = PAT[k]; r.review = k === 'company';
      const o = pm[k] || (pm[k] = { key: k, name: PAT[k], review: r.review, wallets: 0, took: 0, sent: 0, opened: 0, ids: [], rows: [] });
      o.wallets += 1; o.took += r.took; o.sent += r.sent || 0; if (r.funder && r.funder.kind === 'company') o.opened += 1; o.ids.push(r.id); o.rows.push(r);
    }
    const times = (a, b) => (b >= 1 ? (a / b >= 10 ? nf(a / b) : String(Math.round(a / b * 10) / 10)) + '배' : '');
    const patText = (o) => {
      const R = o.rows, opened = o.opened ? ' ' + (o.opened === o.wallets ? '모두' : nf(o.opened) + '곳이') + ' 회사 계정이 열어 준 지갑이다.' : '';
      if (o.key === 'cashout') {
        const direct = R.filter((r) => { const e = r.ends.find((x) => x.key === 'exch'), h = r.hop1.filter((x) => x.kind === 'exch').reduce((t, x) => t + x.v, 0); return e && h >= e.v * 0.5; }).length;
        return '보상을 받는 대로 팔고, 대금을 거래소 입금으로 보이는 주소로 보냈다. **바로 보낸 곳 ' + nf(direct) + '곳 · 다른 지갑을 한두 번 거쳐 보낸 곳 ' + nf(o.wallets - direct) + '곳.** 가져간 돈 ' + nf(o.took) + '에 보낸 돈 ' + nf(o.sent) + ' RLUSD 환산으로 규모가 비슷하다 — 판 대금이 거의 그대로 나간 모습이다.' + opened;
      }
      if (o.key === 'quiet') return 'WLBN을 팔았지만 **대금을 밖으로 보내지 않았다** — XRP · RLUSD가 지갑에 남아 있거나 송금이 아닌 방식으로 쓰였다. 지갑당 가져간 돈이 평균 ' + nf(o.took / o.wallets) + ' RLUSD 환산으로 작다.' + opened;
      if (o.key === 'park') return '판 대금을 태그가 없는 다른 지갑으로 옮겼다(' + nf(o.sent) + ' RLUSD 환산). 그 뒤로는 대부분 그 지갑에 머물러 있다 — 자기 다른 지갑이거나 태그를 쓰지 않는 곳일 수 있고, **거래소로 갔다고 볼 근거는 없다.**' + opened;
      if (o.key === 'company') {
        const hs = [].concat.apply([], R.map((r) => r.hop1.filter((h) => h.kind === 'company'))), v = hs.reduce((t, h) => t + h.v, 0), x = hs.reduce((t, h) => t + h.xrp, 0), rl = hs.reduce((t, h) => t + h.rlusd, 0), names = hs.map((h) => h.name).filter((n, i, a) => a.indexOf(n) === i);
        return '회사 계정(' + names.join(' · ') + ')으로 **' + [x >= 1 ? 'XRP ' + nf(x) + '개' : '', rl >= 1 ? 'RLUSD ' + nf(rl) : ''].filter(Boolean).join(' · ') + '**(' + nf(v) + ' RLUSD 환산)를 넣었다 — WLBN을 팔아 가져간 돈 ' + nf(o.took) + '의 ' + times(v, o.took) + '다. 「되돌린 돈」에 들어가는 돈인데도 부정 쪽에 남아 있다 — 회사 계정 쪽 기록에서 아직 읽지 못한 것일 수 있다. **판정을 다시 볼 대상이다.**';
      }
      if (o.key === 'linked') {
        const ps = {}; let wl = 0;
        for (const r of R) { for (const h of linkOfRow(r)) { ps[h.id] = h.impact; wl += h.wlbn; } if (r.funder && (r.funder.kind === 'ours' || r.funder.kind === 'root')) ps[r.funder.id] = r.funder.impact; }
        const ids = Object.keys(ps), pos = ids.filter((id) => ps[id] === 'help').length;
        return '「지갑별 표」의 다른 지갑 ' + nf(ids.length) + '곳과 이어져 있다(WLBN · 돈을 옮겼거나, 그 지갑이 계정을 만들어 줬다)' + (pos ? ' — ' + (pos === ids.length ? '**모두 긍정 쪽**이다' : '그 가운데 **' + nf(pos) + '곳이 긍정 쪽**이다') : '') + '.' + (wl >= 1 ? ' 옮긴 WLBN은 ' + nf(wl) + '개다.' : '') + ' **같은 주인이 파는 지갑과 모으는 지갑을 나눠 쓰는 것으로 보인다.** 다만 같은 주인이라는 것은 추정이라 묶어서 판정하지는 않는다 — 이 지갑은 자기 움직임(가진 양의 대부분을 팔았다)으로 부정 쪽에 남는다.';
      }
      return '보상 지갑이 아니다 — WLBN을 풀에서 샀거나 다른 지갑에서 옮겨 받아 판 밖의 지갑이다. 밖으로 보낸 돈 ' + nf(o.sent) + ' RLUSD 환산은 WLBN 판 대금 ' + nf(o.took) + '의 ' + times(o.sent, o.took) + '다 — **오간 돈 대부분은 WLBN과 무관한 자기 거래로 보인다.**';
    };
    const pats = Object.keys(pm).map((k) => pm[k]).sort((x, y) => (y.wallets - x.wallets) || (y.took - x.took)).map((o) => ({ key: o.key, name: o.name, review: o.review, wallets: o.wallets, share: r3(o.wallets / rows.length), took: r0(o.took), took_share: took > 0 ? r3(o.took / took) : null, sent: r0(o.sent), opened: o.opened, ids: o.ids, comment: patText(o) }));
    const comment = [];
    {
      const tk = rows.map((r) => r.took).sort((x, y) => x - y), med = tk.length % 2 ? tk[(tk.length - 1) / 2] : (tk[tk.length / 2 - 1] + tk[tk.length / 2]) / 2, topN = Math.min(4, rows.length), top = rows.slice(0, topN).reduce((t, r) => t + r.took, 0);
      const pg = (k) => pats.find((p) => p.key === k), rv = pats.filter((p) => p.review), rvW = rv.reduce((t, p) => t + p.wallets, 0), rvT = rv.reduce((t, p) => t + p.took, 0);
      comment.push('한 줄로: 부정 쪽 ' + nf(rows.length) + '곳은 한 덩어리가 아니라 **' + nf(pats.length) + '가지 양상**으로 갈린다 — ' + pats.map((p) => p.name + ' ' + nf(p.wallets) + '곳').join(' · ') + '.');
      if (took >= 1) comment.push('크기: 가져간 돈은 모두 ' + nf(took) + ' RLUSD 환산이고 **많이 가져간 ' + nf(topN) + '곳이 ' + pf(top / took) + '**다. 지갑 절반은 ' + nf(med) + ' RLUSD 환산 아래다 — 대부분 소액이다.');
      if (pg('cashout') || pg('quiet')) comment.push('돈의 방향: ' + [pg('cashout') ? '보상을 팔아 **거래소 입금으로 보이는 주소로 보낸 지갑이 ' + nf(pg('cashout').wallets) + '곳**(가져간 돈 ' + nf(pg('cashout').took) + ')' : '', pg('quiet') ? '팔고도 **대금을 지갑에 둔 곳이 ' + nf(pg('quiet').wallets) + '곳**(가져간 돈 ' + nf(pg('quiet').took) + ')' : ''].filter(Boolean).join(', ') + '이다. 거래소 안에서 무엇으로 바꿨는지는 볼 수 없다.');
      const cl = (ranges.all.impact && ranges.all.impact.cleared) || [], cd = cl.filter((c) => c.why === 'dep'), cp = cl.filter((c) => c.why === 'part');
      if (cl.length) comment.push('판정에서 뺀 지갑: ' + [cd.length ? '**회사 계정에 돈을 넣은 ' + nf(cd.length) + '곳**(' + nf(cd.reduce((t, c) => t + c.dep_rlusd, 0)) + ' RLUSD 환산 — 다시 들어간 돈은 되돌린 돈으로 친다)' : '', cp.length ? '**가진 양의 일부만 팔고 나머지는 옮겨 둔 ' + nf(cp.length) + '곳**(옮긴 WLBN ' + nf(cp.reduce((t, c) => t + c.moved_out, 0)) + '개 — 옮긴 물량은 판 것이 아니다)' : ''].filter(Boolean).join(' · ') + '은 부정 쪽에서 빠졌다. 그래서 여기서는 따라가지 않는다.');
      if (rvW) comment.push('판정: **' + nf(rvW) + '곳은 다시 볼 대상**이다 — 회사 계정에 돈을 넣었는데도 부정 쪽에 남아 있다. 이들을 빼면 부정 쪽은 ' + nf(rows.length - rvW) + '곳 · 가져간 돈 ' + nf(took - rvT) + ' RLUSD 환산이다.');
      comment.push('읽을 때: 양상은 원장에 보이는 움직임으로 붙인 이름이다. 지갑 주인과 의도는 알 수 없고, 한 사람이 지갑을 여러 개 쓸 수 있다.');
    }
    const sum = {
      patterns: pats, review_wallets: pats.filter((p) => p.review).reduce((t, p) => t + p.wallets, 0),
      roots: rows.length, sent_wallets: sentW, quiet_wallets: quietW, failed, partial, took: r0(took), sent: r0(sent), sent_xrp: r0(sx), sent_rlusd: r0(sr), sent_wlbn: r0(sw),
      src: Object.assign(Object.keys(srcSum).reduce((o, k) => { o[k] = r0(srcSum[k]); return o; }, {}), { in_xrp: r0(inX), in_rlusd: r0(inR),
        origins: ['reward', 'bought', 'moved', 'none'].filter((k) => orig[k][0]).map((k) => ({ key: k, name: TRACE_ORIGIN[k], wallets: orig[k][0], share: r3(orig[k][0] / rows.length), took: r0(orig[k][1]) })) }),
      hop1: hopMix, ends: endMix, funders: funders.slice(0, 12), funder_known: fKnown, funder_company: fKinds.company || 0, funder_groups: fShared.length, funder_shared: fShared.reduce((t, f) => t + f.wallets, 0),
      funder_kinds: TRACE_ORDER.filter((k) => fKinds[k]).map((k) => ({ key: k, name: k === 'company' ? '회사 계정이 열어 준 지갑' : TRACE_KIND[k], wallets: fKinds[k], share: r3(fKinds[k] / rows.length) })).sort((x, y) => y.wallets - x.wallets),
      company_to: companyTo, links: links.slice(0, 8), accounts: Object.keys(ND).length, pending: Math.max(nowLoad - stillLoad, 0), moved_on: rows.length - stillLoad,
    };
    const notes = [], top = (list, k) => list.slice(0, k).map((x) => x.name + ' ' + pf(x.share || 0) + '(' + nf(x.v) + ')').join(' · '), O = sum.src.origins, og = (k) => O.find((x) => x.key === k);
    {
      const t = ['유입 전(WLBN 출처): 부정 쪽 지갑 ' + nf(rows.length) + '곳 가운데 **' + nf(og('reward') ? og('reward').wallets : 0) + '곳은 보상으로 받은 WLBN**을 판 지갑이다(이 기간 받은 양 ' + nf(srcSum.paid) + '개).'];
      if (og('bought')) t.push('**' + nf(og('bought').wallets) + '곳은 풀에서 산 것**이 출처다 — 이 화면이 세기 시작한 날(' + md(C.NOW_FROM) + ') 전에 산 ' + nf(srcSum.before_bought) + '개 · 그 뒤 산 ' + nf(srcSum.bought) + '개.');
      if (og('moved')) t.push(nf(og('moved').wallets) + '곳은 다른 지갑에서 옮겨 받은 것이 가장 크다(열린 뒤 ' + nf(srcSum.moved) + '개).');
      notes.push(t.join(' '));
    }
    if (fKnown) {
      const t = ['처음 채운 곳(계정을 만든 송금): ' + nf(rows.length) + '곳 가운데 ' + nf(fKnown) + '곳을 원장에서 찾았다.'];
      if (sum.funder_company) t.push('**' + nf(sum.funder_company) + '곳은 회사 계정이 열어 준 지갑**이다(' + funders.filter((f) => f.kind === 'company').map((f) => f.name + ' ' + nf(f.wallets) + '곳').join(' · ') + ').');
      const rest = sum.funder_kinds.filter((x) => x.key !== 'company'); if (rest.length) t.push('나머지는 ' + rest.map((x) => x.name + ' ' + nf(x.wallets) + '곳').join(' · ') + '.');
      if (fOurs.length) t.push('**지갑별 표의 「' + fOurs[0].name + '」 ' + fOurs[0].id + ' 이 부정 쪽 지갑 ' + fOurs[0].ids.join(' · ') + ' 의 계정을 만들었다** — 같은 주인으로 볼 실마리.');
      if (fShared.length) t.push('회사 계정이 아닌 같은 주소가 두 곳 이상을 채운 묶음이 ' + nf(fShared.length) + '개(' + nf(sum.funder_shared) + '곳) 있다.');
      notes.push(t.join(' '));
    } else notes.push('처음 채운 곳(계정을 만든 송금): 원장에서 찾지 못했다(노드에 옛 기록이 없는 경우).');
    notes.push('행선지(1단계): ' + nf(rows.length) + '곳 가운데 **' + nf(sentW) + '곳이 밖으로 보냈고 ' + nf(quietW) + '곳은 보내지 않았다.**' + (sent >= 1 ? ' 보낸 돈 ' + nf(sent) + ' RLUSD 환산(XRP ' + nf(sx) + '개 · RLUSD ' + nf(sr) + ' · WLBN ' + nf(sw) + '개) — ' + top(hopMix, 4) + '.' : ''));
    if (sent >= 1 && endMix.length) notes.push('끝 행선지(3단계까지): 받은 만큼만 따라가면 ' + top(endMix, 4) + '.' + (val('exch', endMix) ? ' **거래소 입금으로 보이는 주소에 닿은 지갑은 ' + nf(cnt('exch', endMix)) + '곳**(1단계에서 바로 간 곳 ' + nf(cnt('exch', hopMix)) + '곳)이고, 금액은 ' + nf(val('exch', hopMix)) + ' → ' + nf(val('exch', endMix)) + ' RLUSD 환산이다.' : ' 거래소 입금으로 보이는 주소에 닿은 것은 없다.'));
    if (companyTo.length) notes.push('회사 계정으로 간 돈: 부정 쪽 지갑 ' + nf(companyTo.reduce((t, c) => t + c.wallets, 0)) + '곳이 **' + companyTo.map((c) => c.name + '으로 ' + [c.xrp ? 'XRP ' + nf(c.xrp) + '개' : '', c.rlusd ? 'RLUSD ' + nf(c.rlusd) : '', c.wlbn ? 'WLBN ' + nf(c.wlbn) + '개' : ''].filter(Boolean).join(' · ') + '(' + nf(c.v) + ' RLUSD 환산)').join(', ') + '**를 보냈다. 이 돈은 「되돌린 돈」에 들어간다(회사 계정 쪽 기록으로 센다) — 그래도 부정 쪽에 남았다면 가져간 돈의 10%에 못 미쳐서다.');
    const bigLinks = links.filter((l) => l.v >= 50);
    if (bigLinks.length) notes.push('이어진 지갑: ' + bigLinks.slice(0, 2).map((l) => '부정 쪽 ' + l.from + ' → ' + (l.to_kind === 'root' ? '다른 부정 쪽 지갑 ' : '지갑별 표의 「' + l.to_type + '」(' + l.to_impact_name + ') ') + l.to + ' 로 **' + (l.wlbn >= 1 ? 'WLBN ' + nf(l.wlbn) + '개(' + nf(l.v) + ' RLUSD 환산)' : nf(l.v) + ' RLUSD 환산') + '**').join(', ') + (bigLinks.length > 2 ? ' 등 ' + nf(bigLinks.length) + '건' : '') + '. 같은 주인일 수 있지만 추정이라 묶어서 판정하지는 않는다.');
    if (took >= 1 && sent >= 1) notes.push('견주기: 이 지갑들이 WLBN을 팔아 가져간 돈은 ' + nf(took) + ' RLUSD 환산, 밖으로 보낸 돈은 ' + nf(sent) + '다. 보낸 돈에는 **판 대금 말고 지갑에 원래 있던 돈 · 다른 곳에서 받은 돈(XRP ' + nf(inX) + '개 · RLUSD ' + nf(inR) + ') · WLBN 이체도 섞여 있다.**');
    if (sum.pending || sum.moved_on || partial || failed) notes.push('갱신: ' + [sum.pending ? '지금 부정 쪽인데 아직 따라가지 않은 지갑 ' + nf(sum.pending) + '곳은 다음 갱신에 들어온다' : '', sum.moved_on ? '따라간 뒤 판정이 바뀐 지갑 ' + nf(sum.moved_on) + '곳도 표에 남겨 두었다' : '', partial ? '거래가 아주 많아 내역을 끝까지 읽지 못한 지갑 ' + nf(partial) + '곳은 보낸 돈이 실제보다 적게 잡혔다' : '', failed ? '이번에 읽지 못한 지갑 ' + nf(failed) + '곳' : ''].filter(Boolean).join(' · ') + '.');
    const depPart = ((tr.dep && tr.dep.accts) || []).filter((x) => x[2]).map((x) => tagged(labelOwner(x[0]), labelName(x[0])).full).filter((n, i, a) => a.indexOf(n) === i);
    const limits = [
      '거래소 안에서 일어난 일과 지갑의 주인은 원장으로 볼 수 없다. 「거래소 입금으로 보이는 주소」는 목적지 태그(거래소 같은 곳이 입금자를 가리려고 붙이게 하는 번호)가 붙은 송금을 받은 주소라는 뜻이지 확인된 거래소 이름이 아니다.',
      '「거래가 많은 계정」은 기간 안 거래가 읽는 한도를 넘는 계정이다(거래소 · 서비스 · 자동 거래 계정일 수 있다). 거기서 멈춘다.',
      '중간 지갑이 보낸 돈은 그 지갑이 받은 금액까지만, 보낸 곳 비율대로 나눠 따라간다. 시간 순서는 따지지 않으므로 어림값이다.',
      '값은 받아 온 날(' + tr.day + ')의 가격으로 환산했다(XRP 1개 = ' + (tr.xr || 0) + ' RLUSD · WLBN 1개 = ' + (tr.price || 0) + ' RLUSD). XRP · RLUSD · WLBN 말고 다른 토큰은 세지 않는다.',
      nf(TRACE.min) + ' RLUSD 환산 미만으로 보낸 곳 · 계정마다 상위 ' + nf(TRACE.keep) + '곳 밖 · 단계별 상한(' + nf(TRACE.caps[1]) + ' · ' + nf(TRACE.caps[2]) + '곳) 밖은 더 따라가지 않고 「표에 없는 다른 주소」로 둔다.',
      '「처음 채운 곳」은 계정을 만든 첫 송금을 보낸 주소다. 「회사 계정이 열어 준 지갑」은 그 첫 송금을 회사 계정이 보냈다는 뜻이다. WLBN 출처는 이 화면이 세기 시작한 날(' + C.NOW_FROM + ') 전의 기록까지 본다.',
      '양상은 아래 순서로 먼저 맞는 것 하나를 붙인다. ① 회사 계정에 돈을 넣은 지갑 — 회사 계정에 넣은 돈이 가져간 돈 이상(100 RLUSD 환산 이상) ② 이어진 지갑 — 「지갑별 표」의 다른 지갑으로 옮긴 것이 가져간 돈 이상이거나 그 지갑이 계정을 만들어 줌 ③ 대금을 지갑에 둔 지갑 — 밖으로 보낸 송금이 없음 ④ 밖에서 들어온 거래 지갑 — WLBN 출처가 보상이 아님 ⑤ 거래소로 보내는 지갑 — 끝 행선지의 절반 이상이 거래소 입금으로 보이는 주소 ⑥ 옮겨 둔 지갑 — 그 밖.',
      '회사 계정에 넣은 돈(되돌린 돈에 들어간다)은 회사 계정 쪽 내역에서 읽는다 — 풀 계정 · 발행 계정은 빼고, operations 계정의 RLUSD 는 판매 대금 기록이 센다.' + (depPart.length ? ' ' + depPart.join(' · ') + '은 거래가 많아 최근 것만 읽고 날마다 쌓는다.' : ''),
      '하루 한 번(한국 날짜가 바뀐 뒤 첫 예약 실행) 다시 받는다. 전체 기간(' + C.NOW_FROM + '부터) 기준이며 위쪽 기간 단추 · 날짜 지정과 무관하다.',
    ];
    return { day: tr.day, at: tr.at || 0, from: C.NOW_FROM, xr: tr.xr || null, price: tr.price || null, rows, sum, comment, notes, limits };
  };
  const trace = opts.noTrace ? null : buildTrace();

  // 설계 대조: 공개 문서의 약속(PLAN) ↔ 원장의 지금 값. **판정하지 않고 나란히 놓기만 한다** — 지금 게이트가 몇 번인지도 판정하지 않는다(수요 조건은 원장에 없다)
  //   11/24 서우 「확인결정 필요한 운용현황은 하지말고」 → 확인이 필요하던 둘을 뺐다: bot 매입 지출 ↔ 정책 재원(판매의 10%) 대조, 활성 기기 비율을 G4 조건(가동률 80%)에 견준 판정. 다시 넣으려면 서우 확인 먼저
  const buildPlan = () => {
    const P = PLAN, s = summary, n = (x) => Math.round(x).toLocaleString('en-US'), p1 = (x) => (x * 100).toFixed(1) + '%', has = (v) => v !== null && v !== undefined && isFinite(v);
    const pos = (k) => (positions.find((x) => x.key === k) || {}).amount, eok = (x) => (x % 1e8 ? String(Math.round(x / 1e6) / 100) : String(x / 1e8)) + '억';
    const burned = has(s.total_supply) ? Math.max(0, P.total - s.total_supply) : null, locked = pos('locked'), freed = has(locked) ? P.escrow.locked - locked : null;
    const tot = s.devices_total, act = s.devices_active, up = has(tot) && has(act) && tot > 0 ? act / tot : null;
    const next = has(tot) ? P.gates.find((g) => g.n && tot < g.n) : null;
    const live = { staking: has(pos('staking')) ? ' — 지금 staking 계정 ' + n(pos('staking')) : '', seed: has(pos('seed')) ? ' — 지금 seed 계정 ' + n(pos('seed')) + '(시드 즉시 10%와 같은 수)' : '', pools: has(pos('pools')) ? ' · 지금 풀 두 곳에 든 WLBN은 ' + n(pos('pools')) : '' };
    const alloc = P.alloc.map((a) => ({ key: a.key, name: a.name, qty: a.qty, qty_text: eok(a.qty), share: a.qty / P.total, cond: a.cond, where: a.where + (a.live ? live[a.live] : '') }));
    const gates = P.gates.map((g) => ({ g: g.g, name: g.name, supply: g.supply, demand: g.demand, etc: g.etc, n: g.n || null, pct: g.n && has(tot) ? Math.round(Math.min(1, tot / g.n) * 1000) / 1000 : null, next: !!(next && next.g === g.g) }));
    const rows = [];
    // 지급 원칙: 기기 7개 · AI 이용권 5개를 그대로 지급 중(11/24 서우 확인). 사이트 공시 하루 배분을 활성 기기 수로 나누지 않는다 — 공시 값의 구성이 달라 「한 대당 3.3개」처럼 실제와 어긋난 숫자가 나왔다
    //   원장 근거: 지갑이 하루에 받은 양(walletDays 의 둘째 칸 · 정수로 반올림)이 7과 5의 조합인 건수. 첫날(재지급)은 세지 않는다
    const day0 = md(C.NOW_FROM), recs = [];
    for (const id of Object.keys(walletDays.w)) for (const r of walletDays.w[id]) if (r[0] >= 1 && r[1] > 0) recs.push(r[1]);
    const isMix = (v) => { for (let a = 0; P.reward.base * a <= v; a++) if ((v - P.reward.base * a) % P.pass.per_day === 0) return true; return false; };
    // 24개 이상은 어떤 정수든 7과 5로 만들 수 있다(만들 수 없는 가장 큰 수가 23) — 조합인지 따지는 것은 그보다 작은 값에서만 뜻이 있다
    const lim = (P.reward.base - 1) * (P.pass.per_day - 1), small = recs.filter((x) => x < lim);
    const cnt = (v) => recs.filter((x) => x === v).length, mixN = small.filter(isMix).length, both = P.reward.base + P.pass.per_day;
    rows.push({ key: 'fixed', topic: '지급 원칙', policy: '정해진 수량을 준다 — DePIN 기기(지점)는 한 대당 하루 ' + P.reward.base + '개 × ' + P.reward.step + '^(단계−1) × 품질 등급(0~' + P.reward.grade + ') · AI 이용권은 한 장당 하루 ' + P.pass.per_day + '개(이용권 페이지 · 3년). 가격 · 수익률 · 회수 기간은 약속하지 않는다.',
      now: '그대로 지급 중이다 — 기기 한 대당 하루 ' + P.reward.base + '개 · AI 이용권 한 장당 하루 ' + P.pass.per_day + '개(' + md(P.src.read) + ' 운영 확인).' + (small.length ? ' 원장에서 지갑이 하루에 받은 양 가운데 ' + lim + '개 미만인 ' + n(small.length) + '건을 보면 ' + n(mixN) + '건(' + p1(mixN / small.length) + ')이 ' + P.reward.base + '과 ' + P.pass.per_day + '의 조합이다 — ' + P.reward.base + '개 ' + n(cnt(P.reward.base)) + '건 · ' + (P.reward.base * 2) + '개 ' + n(cnt(P.reward.base * 2)) + '건 · ' + both + '개(' + P.reward.base + ' + ' + P.pass.per_day + ') ' + n(cnt(both)) + '건 · ' + P.pass.per_day + '개 ' + n(cnt(P.pass.per_day)) + '건.' : ''),
      pay_recs: small.length, pay_mix: mixN,
      note: lim + '개 이상(' + n(recs.length - small.length) + '건 · 여러 날 치나 여러 대 몫)은 어떤 수든 ' + P.reward.base + '과 ' + P.pass.per_day + '로 만들 수 있어 세지 않았다. 조합이 아닌 값은 대부분 ' + Math.round(P.reward.best) + '개(' + n(cnt(Math.round(P.reward.best))) + '건)다 — 문서의 우수 등급은 ' + P.reward.best + '개이고, 이 화면의 받은 양은 정수로 반올림한 값이다. 전송률(95% 이상 전액 · 80~95% 감액 · 80% 미만 0)에 따라 달라질 수 있고, 여러 날 치를 한 번에 받은 기록도 있다. 첫날(' + day0 + ' 재지급)은 세지 않았다.' });
    rows.push({ key: 'budget', topic: '하루 예산', policy: '에폭 예산 = 활성 지점 × ' + P.reward.per_site + ' × 단계 계수. 못 준 몫은 다시 나누되 지점당 ' + P.reward.cap + '개까지, 넘는 몫은 소각.',
      now: has(s.epoch_budget) ? '공시 하루 예산 ' + n(s.epoch_budget) + '개' + (has(s.epoch_distributed) ? ' · 공시 하루 배분 ' + n(s.epoch_distributed) + '개(' + s.epoch_date + ')' : '') : '공시 값을 받지 못했다',
      note: '공시 하루 예산은 1단계 목표 ' + n(P.sites.phase1) + '지점 × ' + P.reward.base + '개와 같은 수다. 두 값 모두 사이트가 공시한 값 그대로다.' });
    rows.push({ key: 'uptime', topic: '가동률', policy: 'G4 조건: 3개월 가동률 ' + p1(P.uptime).replace('.0%', '%') + '. 지켜보는 지표는 가격이 아니라 판매 완료 · 가동률 · 데이터 매출.',
      now: up === null ? '공시 값을 받지 못했다' : '등록 기기 ' + n(tot) + '대 가운데 활성 ' + n(act) + '대 — ' + p1(up),
      note: '등록 대비 활성 비율이다. 문서의 가동률(3개월)과는 재는 법이 다를 수 있어 견주어 판정하지 않는다. 데이터 매출은 원장에 없다.' });
    rows.push({ key: 'burn', topic: '소각', policy: '소각 예정 ' + eok(P.burn.planned) + '(15% · 분할은 따로 공지) + 매출 연동 매입 소각(기기 판매액 ' + p1(P.burn.device).replace('.0%', '%') + ' · 이용권 판매액 ' + p1(P.burn.pass).replace('.0%', '%') + ' · 데이터 매출 ' + p1(P.burn.data).replace('.0%', '%') + '로 사서 전량 소각 · 매월 집행) + 품질 미달 초과분 · 열리지 않은 2기 몫. 말할 때는 수량으로만.',
      now: burned === null ? '총 공급을 받지 못했다' : '소각 누계 ' + (Math.round(burned * 100) / 100).toLocaleString('en-US') + '개(100억 − 총 공급)', note: '백서 ' + md(P.src.doc_day) + ' 기준 누계 ' + P.burn.doc_burned + '개 · 소각 예정 ' + eok(P.burn.planned) + '은 집행 전(treasury 계정) · 매출 연동 매입 소각도 그날 현재 첫 집행 전.' });
    rows.push({ key: 'lock', topic: '잠금 · 유통', policy: '100억 개 전량 발행 · 발행 계정은 2026-10-05 블랙홀 전환(추가 발행 · 동결 · 회수 불가). 베스팅 일정 전부 공개.',
      now: (has(locked) ? '잠금(에스크로) ' + n(locked) + '개(' + p1(locked / P.total) + ')' : '잠금 값을 받지 못했다') + (has(s.circulating) ? ' · 유통량 ' + n(s.circulating) + '개(' + (s.circulating / P.total * 100).toFixed(3) + '%)' : ''),
      note: '백서 ' + md(P.src.doc_day) + ' 기준 잠금 ' + n(P.escrow.locked) + '개(' + P.escrow.n + '건)' + (has(freed) && freed > 0 ? ' → 그 뒤 ' + n(freed) + '개 풀림' : '') + '. 유통량은 사이트 공시 값.' });
    rows.push({ key: 'pool', topic: '유동성 공개', policy: '두 풀의 잔액은 늘 원장에서 보이고 한 숫자로 합쳐 공개한다. 유동성 · 준비금 ' + eok(P.alloc[8].qty) + '에서 추가 예치.',
      now: has(s.pool_liq) ? '전체 풀 유동성 ' + n(s.pool_liq) + ' RLUSD 환산(두 풀 · 양쪽)' : '풀 값을 받지 못했다', note: (() => { const r8 = daily.find((r) => r.date === P.pool_doc.day); return '토크노믹스 문서의 ' + md(P.pool_doc.day) + ' 값은 ' + n(P.pool_doc.liq) + ' RLUSD' + (r8 && has(r8.pool_liq) ? ' · 이 화면의 그날 값은 ' + n(r8.pool_liq) + '(차이 ' + n(Math.abs(r8.pool_liq - P.pool_doc.liq)) + ' — 재는 시각이 다르다)' : '') + '. 같은 기준(두 풀 · 양쪽 합)이다.'; })() });
    const tiles = [
      { label: '소각 누계', value: burned === null ? '—' : (Math.round(burned * 100) / 100).toLocaleString('en-US'), unit: '개', sub: '100억 − 총 공급 · 소각 예정 ' + eok(P.burn.planned) + '은 집행 전' },
      { label: '잠금(에스크로)', value: has(locked) ? p1(locked / P.total) : '—', unit: '', sub: has(locked) ? n(locked) + '개' + (has(freed) && freed > 0 ? ' · ' + md(P.src.doc_day) + ' 뒤 ' + n(freed) + '개 풀림' : '') : '' },
      { label: '활성 기기 비율', value: up === null ? '—' : p1(up), unit: '', sub: up === null ? '' : '등록 ' + n(tot) + '대 가운데 ' + n(act) + '대' },
      { label: next ? '다음 공급 조건 · ' + next.g + ' ' + next.name : '공급 조건', value: next ? p1(tot / next.n) : '—', unit: '', sub: next ? '등록 기기 ' + n(tot) + ' / ' + n(next.n) + ' · 1단계 목표 ' + n(P.sites.phase1) + '의 ' + p1(tot / P.sites.phase1) : '' },
    ];
    return { src: P.src, total: P.total, burned, locked: has(locked) ? locked : null, freed, uptime: up, devices: has(tot) ? tot : null, active: has(act) ? act : null,
      next: next ? { g: next.g, name: next.name, n: next.n, pct: Math.round(tot / next.n * 1000) / 1000 } : null,
      tiles, rows, alloc, gates,
      watch: '토크노믹스가 지켜본다고 적은 지표는 가격이 아니라 판매 완료 · 가동률 · 데이터 매출이다. 이 화면에서는 판매 대금(RLUSD 결제분 · 참고) · 활성 기기 비율이 그 자리에 있고, 데이터 매출은 원장에 없다.',
      limits: ['약속 쪽 숫자는 ' + P.src.tk + '과 ' + P.src.wp + '에서 ' + md(P.src.read) + '에 옮겨 적은 것이다. 문서가 바뀌면 lib/core.js 의 PLAN 을 고친다. 백서는 초안이다.',
        '정책 수치의 정본은 토크노믹스 정책 페이지, 원장 수치의 정본은 XRPL 원장이다(백서 7장). 등록 · 활성 기기 · 하루 예산 · 유통량은 사이트가 공시한 값을 그대로 쓴 것이다.',
        '지금 게이트가 몇 번인지는 이 화면이 판정하지 않는다 — 수요 조건(유료 고객 · B2B 계약 · 매출)은 원장으로 알 수 없다. 표의 진행률은 공급 조건의 지점 수에 등록 기기 수를 견준 것뿐이다.',
        '이 구역은 판정하지 않는다 — 약속한 것과 지금 값을 나란히 놓기만 한다. 문서와 재는 법이 같다고 볼 수 없는 값(가동률 등)이 있어서다.'] };
  };
  let plan = null; try { plan = buildPlan(); } catch (e) { plan = null; }

  // 잠금 해제 달력: 원장의 에스크로(S.live.esc — 하루 한 번 받는다)를 묶음별 · 연도별 · 월별로 모은다. **판정하지 않는다** — 일정과 수량만 놓는다
  //   줄 = [받는 곳, 조건 여부(0/1), 풀리는 시각(리플 초 · 없으면 0), 취소할 수 있는 시각, 수량]. 조건으로 풀리는 것은 시각이 없어 달력에 넣지 않는다
  const buildUnlock = () => {
    const E = S.live && S.live.esc; if (!E || !Array.isArray(E.rows) || !E.rows.length) return null;
    const n = (x) => Math.round(x).toLocaleString('en-US'), p1 = (x) => (x * 100).toFixed(1) + '%', eok = (x) => String(Math.round(x / 1e6) / 100) + '억', rules = PLAN.unlock;
    const ruleOf = (dest, v) => rules.find((g) => (g.label && L[dest] === g.label) || (g.each && g.each.indexOf(Math.round(v)) >= 0)) || { key: 'etc', name: '그 밖의 잠금', short: '그 밖' };
    const toOf = (dest) => (L[dest] ? tagged(labelOwner(L[dest]), labelName(L[dest])) : { full: '이름표가 없는 계정', owner: null, label: '이름표가 없는 계정' });
    const GG = {}, order = [], Y = {}, M = {}; let total = 0, tTime = 0, nTime = 0, tCond = 0, nCond = 0, cnt = 0;
    for (const r of E.rows) {
      const dest = r[0], fin = r[2] || 0, can = r[3] || 0, v = Number(r[4]); if (!(v > 0)) continue;
      const g = ruleOf(dest, v), kind = r[1] || !fin ? 'cond' : 'time', id = g.key + '|' + kind + '|' + dest;
      if (!GG[id]) { GG[id] = { key: g.key, name: g.name, short: g.short || g.name, kind, to: toOf(dest), n: 0, total: 0, vals: {}, fins: [], cancel: 0 }; order.push(id); }
      const o = GG[id]; o.n++; o.total += v; o.vals[Math.round(v)] = (o.vals[Math.round(v)] || 0) + 1; if (can > o.cancel) o.cancel = can; total += v; cnt++;
      if (kind === 'time') {
        o.fins.push(fin); tTime += v; nTime++;
        const d = kday(fin), y = d.slice(0, 4), m = d.slice(0, 7);
        if (!Y[y]) Y[y] = { date: y, qty: 0, n: 0, parts: {} }; Y[y].qty += v; Y[y].n++; Y[y].parts[g.key] = (Y[y].parts[g.key] || 0) + v;
        if (!M[m]) M[m] = { month: m, day: d, at: fin, qty: 0, n: 0, parts: {} }; M[m].qty += v; M[m].n++; M[m].parts[g.key] = (M[m].parts[g.key] || 0) + v; if (fin < M[m].at) { M[m].at = fin; M[m].day = d; }
      } else { tCond += v; nCond++; }
    }
    if (!cnt) return null;
    const stepOf = (f) => { if (f.length < 2) return ''; const gaps = []; for (let i = 1; i < f.length; i++) gaps.push((f[i] - f[i - 1]) / 86400); gaps.sort((a, b) => a - b); const mid = gaps[Math.floor(gaps.length / 2)]; return mid < 45 ? '매월' : mid < 120 ? '석 달마다' : mid < 240 ? '여섯 달마다' : '해마다'; };
    const nameOf = {}; rules.forEach((g) => { nameOf[g.key] = g.name; }); nameOf.etc = '그 밖의 잠금';
    const groups = order.map((id) => {
      const o = GG[id], f = o.fins.slice().sort((a, b) => a - b), each = Object.keys(o.vals).map(Number).sort((a, b) => o.vals[b] - o.vals[a] || b - a).map((v) => n(v) + ' × ' + o.vals[v]).join(' · ');
      return { key: o.key, name: o.name, short: o.short, kind: o.kind, how: o.kind === 'time' ? '시각' : '조건', to: o.to.full, owner: o.to.owner, label: o.to.label, n: o.n, total: r0(o.total), each, first: f.length ? kday(f[0]) : null, last: f.length ? kday(f[f.length - 1]) : null, step: stepOf(f) || null, cancel: o.cancel ? kday(o.cancel) : null };
    }).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'time' ? -1 : 1) || String(a.first).localeCompare(String(b.first)) || b.total - a.total);
    const keys = []; groups.forEach((g) => { if (g.kind === 'time' && !keys.some((k) => k.key === g.key)) keys.push({ key: g.key, name: g.name, short: g.short }); });
    const partsOf = (p) => keys.filter((k) => p[k.key] > 0).map((k) => ({ key: k.key, name: k.short, qty: r0(p[k.key]) }));
    const years = Object.keys(Y).sort().map((y) => Object.assign({ date: y, qty: r0(Y[y].qty), n: Y[y].n }, (() => { const o = {}; keys.forEach((k) => { o[k.key] = r0(Y[y].parts[k.key] || 0); }); return o; })()));
    const ahead = Object.keys(M).sort().map((m) => M[m]).filter((x) => x.at > S.asof), yearEnd = S.asof + 365 * 86400;
    const months = ahead.filter((x) => x.at <= yearEnd).map((x) => ({ month: x.month, day: x.day, at: kstamp(x.at), qty: r0(x.qty), n: x.n, what: partsOf(x.parts).map((p) => p.name + ' ' + n(p.qty)).join(', ') }));
    const y1 = months.reduce((t, x) => t + x.qty, 0), y1n = months.reduce((t, x) => t + x.n, 0), y1p = {}; ahead.filter((x) => x.at <= yearEnd).forEach((x) => { for (const k of Object.keys(x.parts)) y1p[k] = (y1p[k] || 0) + x.parts[k]; });
    const nx = ahead[0] || null, circ = summary.circulating, has = (v) => v !== null && v !== undefined && isFinite(v);
    const nxG = nx ? groups.filter((g) => g.kind === 'time' && nx.parts[g.key] > 0) : [];
    const next = nx ? { day: nx.day, at: kstamp(nx.at), qty: r0(nx.qty), n: nx.n, parts: partsOf(nx.parts), to: nxG.length === 1 ? nxG[0].to : null, vs_circ: has(circ) && circ > 0 ? r3(nx.qty / circ) : null } : null;
    const lockedPos = (positions.find((x) => x.key === 'locked') || {}).amount, diff = has(lockedPos) ? r0(total) - lockedPos : null;
    const timed = groups.filter((g) => g.kind === 'time'), tFirst = timed.map((g) => g.first).sort()[0] || null, tLast = timed.map((g) => g.last).sort().pop() || null;
    const tiles = [
      { label: next ? '다음 해제 · ' + md(next.day) : '다음 해제', value: next ? n(next.qty) : '—', unit: next ? '개' : '', sub: next ? next.parts.map((p) => p.name).join(', ') + (next.to ? ' → ' + next.to : '') + ' · 한국 시각 ' + next.at.slice(11) + (next.vs_circ !== null ? ' · 공시 유통량 ' + n(circ) + '개의 ' + p1(next.vs_circ) : '') : '시각으로 풀릴 잠금이 남아 있지 않다' },
      { label: '12개월 안에 풀리는 양', value: eok(y1), unit: '개', sub: n(y1) + '개 · ' + y1n + '건' + (Object.keys(y1p).length ? ' — ' + partsOf(y1p).map((p) => p.name + ' ' + eok(p.qty)).join(', ') : '') },
      { label: '시각으로 풀리는 잠금', value: eok(tTime), unit: '개', sub: nTime + '건 · 잠금의 ' + p1(tTime / total) + (tFirst ? ' · ' + tFirst + ' ~ ' + tLast : '') },
      { label: '조건으로 풀리는 잠금', value: eok(tCond), unit: '개', sub: nCond + '건 · 잠금의 ' + p1(tCond / total) + ' · 시각이 아니라 조건이 차야 풀린다(달력에 없음)' },
    ];
    const notes = [
      '**풀린다는 것은** 정해진 시각이 지나 받는 계정으로 넘길 수 있게 된다는 뜻이다. 넘어간 물량이 받는 계정에 그대로 있는지는 「위치」에서 본다 — 이 달력은 시장에 나오는 양을 말하지 않는다.',
      '**조건으로 풀리는 잠금**(' + nCond + '건 · ' + eok(tCond) + '개)은 시각이 없어 달력에 넣지 않았다. 토크노믹스는 이 묶음들을 단계 게이트 통과 · 권역 마일스톤 · 배정 조건에 따라 푼다고 적었다.',
      '묶음 이름은 백서 7.3이 적은 에스크로 묶음(건수 · 합계 · 일정)에 맞춰 붙였다. 받는 계정에 이름표가 없는 묶음은 한 건 수량으로 가렸다. 「노드 홀더 리워드」는 1기 · 2기를 합친 것이고, 「전략 묶음」은 전략 라운드 예비 10억과 전략 투자 잔여 3.39억이 한 계정 앞으로 잠긴 것이다.',
      (() => { const cd = groups.filter((g) => g.cancel).map((g) => g.cancel).sort(), tc = groups.filter((g) => g.kind === 'time' && g.cancel).length; return cd.length ? '**기한**은 원장에 적힌 취소 시각이다 — 그날까지 풀리지 않은 잠금은 그 뒤 잠근 계정(treasury)으로 되돌릴 수 있다. 조건으로 풀리는 잠금의 기한은 ' + cd[0] + (cd[cd.length - 1] !== cd[0] ? ' ~ ' + cd[cd.length - 1] : '') + (tc ? '다.' : '이고, 시각으로 풀리는 잠금에는 기한이 없다.') : '원장에 취소 시각이 적힌 잠금은 없다.'; })(),
      '에스크로 목록은 하루 한 번 원장에서 다시 읽는다(읽은 시각 ' + kstamp(E.at) + ' · 한국 시각). 합계 ' + n(total) + '개 · ' + cnt + '건' + (diff !== null && Math.abs(diff) > 1 ? ' — 「위치」의 잠금 값과 ' + n(Math.abs(diff)) + '개 다르다(읽은 시각이 다르다)' : diff !== null ? ' — 「위치」의 잠금 값과 같다' : '') + '.',
    ];
    return { at: kstamp(E.at), ledger: E.ledger || null, total: r0(total), n: cnt, time: { total: r0(tTime), n: nTime, first: tFirst, last: tLast }, cond: { total: r0(tCond), n: nCond }, next, y1: { qty: r0(y1), n: y1n }, groups, keys, years, months, tiles, notes, diff };
  };
  let unlock = null; try { unlock = buildUnlock(); } catch (e) { unlock = null; }

  const out = { summary: [summary], daily, ranges, positions, dayTop, walletDays };
  if (plan) out.plan = plan;
  if (unlock) out.unlock = unlock;
  const bz = buildBuzz(S); if (bz && bz.web) out.web = bz.web; if (bz && bz.social) out.social = bz.social;
  if (weekly.length) out.weekly = weekly;
  if (trace) out.trace = trace;
  if (health) out.health = health;
  if (market) out.market = market;
  if (deep) out.deep = deep;
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

// 따라갈 지갑(부정 쪽 = 전체 기간에 「부담」으로 판정된 지갑)의 주소. 가져간 돈이 큰 순
function traceRoots(S) {
  const d = buildDatasets(JSON.parse(JSON.stringify(S)), { showAddr: true, noTrace: true });
  return d.ranges.all.wallets.filter((w) => w.impact === 'load' && w.addr).sort((x, y) => (y.took_rlusd || 0) - (x.took_rlusd || 0)).map((w) => w.addr);
}

module.exports = { C, TRACE, newState, applyTx, applyBatch, applyFundBatch, newFund, normalize, buildDatasets, traceRoots, setLabels, pickExt, pickMarket, marketNeeds, mergeHistory, kday };
