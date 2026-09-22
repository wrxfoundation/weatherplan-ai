// ─── 통신사 정책 단가표 (리베이트) — 셀프개통 가격과 사업자 R/B 의 단일 소스 ──────
// 2026-09-22 수령한 「KT 정책 단가표 K1」(2026.09.18~) 시트를 그대로 옮긴 것.
// 표의 숫자는 만원 단위라 여기서 원으로 환산해 둔다(× 10,000). 화면·계산은 전부 원으로 돈다.
//
// [읽는 법] 리베이트 = 단말 × 요금제 × 가입유형.  ← 요금제는 '구간'이 아니라 '고정 목록'이다.
//   이전 판(구간표)은 월정액 하한으로 구간을 골랐지만, 이번 표는 요금제를 이름으로 못 박았다.
//   그래서 월정액으로 추론하지 않는다 — planId 로만 찾는다. 표에 없는 요금제는 애초에 고를 수 없다.
//
// [요금제 고정] 화면의 요금제 선택지(phones.PHONE_PLANS)가 이 파일의 plans 에서 나온다.
//   단가표를 갈아끼우면 요금제 목록까지 같이 바뀐다 — 값이 없는 요금제를 고를 수 있는 경우가 사라진다.
//
// [단말] 표에 이름이 있는 모델만 그 줄을 쓴다. 나머지는 전부 '그 외' 줄로 떨어진다(DEVICE_ROW 참조).
//
// [셀프개통] 회사가 고정 마진만 남기고 나머지 리베이트를 고객 지원금으로 푼다.
//   고객 지원금 = 리베이트 − 고정 마진(db.policies.selfMargin · 기본 10만원)
//   이 금액이 출고가에서 빠져 할부원금이 되므로 월 납부금이 자동으로 따라 움직인다.
//   기존 '추가지원금 = 공시지원금의 15%' 규칙과 겹쳐 쓰지 않는다(이중 계상 방지 · phones.calcPhoneQuote).
//
// [사업자 R/B] 같은 표를 그대로 보여 준다 — 셀프개통 화면과 숫자가 어긋나면 안 된다.
//
// [미반영] 인터넷 결합 수수료는 이 표에 넣지 않는다(정책상 미반영). 고객이 보는 '가족결합 요금할인'
//   (phones.BUNDLE)은 통신요금 할인이라 리베이트와 무관하다 — 둘을 섞지 않는다.
//
// ※ 단가표가 바뀌면 이 파일의 plans / devices 만 교체한다. 요금제 목록·셀프개통·R/B·스모크가 함께 갱신된다.

const M = 10000 // 단가표 단위(만원) → 원

export const RATE_CARD = {
  id: 'kt-k1-20260918',
  carrier: 'KT',
  name: 'KT 정책 단가표 K1',
  effectiveFrom: '2026-09-18',

  // 요금제 — 단가표 열 순서 그대로. 화면 요금제 목록의 원천이다.
  // monthly 는 시트에 없어 월 납부금 계산용으로 채워 둔 값이다. assumed:true 인 줄은 확인이 필요하다.
  plans: [
    { key: 'choice110', col: 0, name: '초이스 110', sub: '유튜브 프리미엄', monthly: 110000, desc: '데이터 무제한 · 유튜브 프리미엄 포함' },
    { key: 'choice90', col: 1, name: '초이스 90', sub: '유튜브 프리미엄', monthly: 90000, desc: '데이터 무제한 · 유튜브 프리미엄 포함' },
    { key: 'basic4g', col: 2, name: '베이직 4GB', sub: '', monthly: 37000, assumed: true, desc: '4GB + 소진 시 1Mbps' },
  ],

  // 가입유형 — 단가표 열 순서(010 · MNP · 기변)
  joins: [
    { key: 'new', label: '010 신규', col: 0 },
    { key: 'mnp', label: '번호이동', col: 1 },
    { key: 'chg', label: '기기변경', col: 2 },
  ],

  // 단말 × 요금제 → [010, MNP, 기변] (만원). 시트의 행 순서 그대로.
  devices: [
    { key: 'flip8', label: '갤럭시 Z플립8', capacity: '256G', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 'fold8', label: '갤럭시 Z폴드8', capacity: '256G', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 'fold8u', label: '갤럭시 Z폴드8 Ultra', capacity: '256G', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 's26', label: '갤럭시 S26', capacity: '256G', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 's26p', label: '갤럭시 S26+', capacity: '256G', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 's26u', label: '갤럭시 S26 Ultra', capacity: '256G', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 'ip18p', label: '아이폰18 P/PM', capacity: '', rows: { choice110: [20, 30, 27], choice90: [18, 25, 25], basic4g: [0, 5, 5] } },
    { key: 'a376', label: 'A376', capacity: '', rows: { choice110: [33, 45, 40], choice90: [32, 44, 39], basic4g: [0, 12, 12] } },
    { key: 'a276', label: 'A276', capacity: '', rows: { choice110: [33, 45, 40], choice90: [32, 44, 39], basic4g: [0, 12, 12] } },
    // 그 외 — 단가표에 이름이 없는 모델은 전부 이 줄로 떨어진다.
    // 시트에 '그 외' 행이 없어 각 칸의 최솟값으로 채워 두었다(= 아이폰18 P/PM 줄과 같다).
    // 낮게 잡아야 안전하다 — 높게 잡으면 고객 지원금을 과다 약속해 셀러가 손해를 본다. 확정값 받으면 이 줄만 교체.
    { key: 'etc', label: '그 외', capacity: '', fallback: true, assumed: true, rows: { choice110: [20, 30, 27], choice90: [18, 25, 25], basic4g: [0, 5, 5] } },
  ],

  // 환수·차감 조건 — 화면 고지에 그대로 쓴다
  notes: [
    'M+5월 이내 해지(타사 번호이동 포함) 시 리베이트 전액 환수 · 010 신규는 M+6월 이내',
    'D+123일 이내 요금제 하향 시 차액 환수',
    '서식지 부적격(7일 이내) 건당 2만원 차감 · 신분증 미첨부 건당 10만원 차감',
    'D+3일 이내 증빙서류 미첨부 시 건당 10만원 환수 · M+3월 이내 할부 중도완납 건당 10만원 환수',
  ],
  // 이 단가표가 다루지 않는 것 — 화면에서 "왜 없나" 를 묻지 않게 명시해 둔다
  excludes: ['인터넷 결합 수수료 (정책상 미반영)'],
}

export const ETC_ROW = 'etc'

// 우리 단말 id → 단가표 행. 표에 이름이 있는 모델만 매핑한다. 나머지는 '그 외'.
// 용량 표기가 달라도(우리 폴드8=1TB / 표=256G) 같은 모델이면 그 줄을 쓴다.
export const DEVICE_ROW = {
  flip8: 'flip8', fold8: 'fold8', s26: 's26', s26u: 's26u',
  // a56 · ip17p · ip17pm · ip17 — 단가표 미수록 → '그 외'
}

export const cardPlan = (planId) => RATE_CARD.plans.find((p) => p.key === planId) ?? null
export const cardDevice = (deviceId) => RATE_CARD.devices.find((d) => d.key === (DEVICE_ROW[deviceId] ?? ETC_ROW)) ?? RATE_CARD.devices.find((d) => d.key === ETC_ROW)
export const joinCol = (join) => RATE_CARD.joins.find((j) => j.key === join)?.col ?? 1
/** 이 단말이 단가표에 이름으로 올라 있는가(= '그 외'로 떨어지지 않았는가) */
export const isListed = (deviceId) => Boolean(DEVICE_ROW[deviceId])

/** 한 건의 정책 리베이트(원). 표에 없는 요금제면 0. */
export function rebateOf({ deviceId, planId, join = 'mnp' } = {}) {
  if (!cardPlan(planId)) return 0
  const row = cardDevice(deviceId).rows[planId]
  return (row?.[joinCol(join)] ?? 0) * M
}

/** 화면 표기에 필요한 근거까지 같이 — 어느 줄·어느 요금제로 잡혔는지 보여 줘야 검증이 된다. */
export function rebateDetail({ deviceId, planId, join = 'mnp' } = {}) {
  const device = cardDevice(deviceId)
  const plan = cardPlan(planId)
  return {
    rebate: rebateOf({ deviceId, planId, join }),
    device, plan,
    listed: isListed(deviceId), // false = '그 외' 줄로 떨어진 건
    covered: Boolean(plan), // false = 단가표가 모르는 요금제(값 0 과 구분해야 한다)
    joinLabel: RATE_CARD.joins.find((j) => j.key === join)?.label ?? join,
    carrier: RATE_CARD.carrier, cardName: RATE_CARD.name, effectiveFrom: RATE_CARD.effectiveFrom,
  }
}

export const SELF_MARGIN_DEFAULT = 100000 // 셀프개통 회사 고정 마진(원) — 어드민 정책에서 변경
export const selfMarginOf = (db) => db?.policies?.selfMargin ?? SELF_MARGIN_DEFAULT

/**
 * 셀프개통 지원금 — 정책 리베이트에서 회사 고정 마진만 떼고 전부 고객에게.
 * 리베이트가 마진보다 작으면 지원금은 0이고 마진도 그만큼만 남는다(마이너스 마진을 만들지 않는다).
 */
export function selfSupport({ deviceId, planId, join, margin = SELF_MARGIN_DEFAULT } = {}) {
  const rebate = rebateOf({ deviceId, planId, join })
  const customer = Math.max(0, rebate - margin)
  return { rebate, margin: Math.min(margin, rebate), customer, short: rebate < margin }
}
