// ─── 통신사 정책 카드 — 단말 판매가(가격표) + 리베이트(R/B) ─────────────────
// 2026-09-22 수령한 「KT K1」 2차 시트부터 표의 의미가 바뀌었다.
//   이전: 칸 = 수수료(리베이트)      →  REBATE_CARD
//   이번: 칸 = 고객 단말 판매가       →  PRICE_CARD   ← 지금 화면 가격의 원천
// 둘 다 단위가 만원이라 파일에서 원으로 환산한다(× 10,000). 화면·계산은 전부 원으로 돈다.
//
// [가격표가 이긴다] 가격표에 값이 있으면 그 값이 곧 할부원금이다.
//   출고가 − 공시지원금 − 추가지원금 을 계산하지 않는다 — 회사 마진은 이미 가격에 반영돼 있다.
//   화면의 지원금 줄은 표시용으로 출고가 − 판매가 를 역산해 채운다(합이 어긋나지 않게).
//
// [세 가지 상태] 한 조합은 셋 중 하나다. 화면은 이걸 구분해서 보여 줘야 한다.
//   covered  — 표에 값이 있다        → 그 값을 쓴다
//   blocked  — 표가 다루는 단말인데 칸이 'X'(또는 그 요금제에 없는 가입유형) → 취급 불가
//   unlisted — 표에 없는 단말        → 기존 계산 경로(출고가 − 지원금)로 떨어진다
//
// [통신사] 가격표는 KT 전용이다. 다른 통신사로 견적을 내면 가격표를 쓰지 않는다(unlisted 취급).
//
// [R/B] 2차 시트에는 리베이트 열이 없다. 사업자 R/B 가 근거를 잃지 않도록 직전 수령분(1차 시트)을
//   REBATE_CARD 로 남겨 둔다. 새 리베이트 표를 받으면 REBATE_CARD 만 교체한다.
//
// ※ 가격표가 바뀌면 PRICE_CARD.plans / devices 만 교체한다. 요금제 목록·가격·스모크가 함께 갱신된다.

const M = 10000 // 표 단위(만원) → 원

// ─────────────────────────────────────────────────────────────────────────
// 1) 단말 가격표 — 칸 = 고객이 내는 단말 판매가(할부원금)
//    rows[요금제][가입유형] = [공시지원가, 선택약정가]  ·  null = 'X'(취급 불가)
// ─────────────────────────────────────────────────────────────────────────
export const PRICE_CARD = {
  id: 'kt-k1-price-20260918',
  carrier: 'KT',
  name: 'KT 단말 가격표 K1',
  effectiveFrom: '2026-09-18',

  // 요금제 — 화면 요금제 목록의 원천. joins 는 그 요금제가 시트에서 다루는 가입유형.
  // monthly 는 시트에 없어 월 납부금 계산용으로 채운 값이다(assumed).
  plans: [
    { key: 'choice110', name: '초이스 110', sub: '유튜브 프리미엄', monthly: 110000, joins: ['mnp', 'chg'], desc: '데이터 무제한 · 유튜브 프리미엄 포함' },
    { key: 'basic4g', name: '베이직 4GB', sub: '', monthly: 37000, assumed: true, joins: ['new', 'mnp', 'chg'], desc: '4GB + 소진 시 1Mbps' },
  ],

  joins: [
    { key: 'new', label: '010 신규' },
    { key: 'mnp', label: '번호이동' },
    { key: 'chg', label: '기기변경' },
  ],

  // 할인방식 — 시트의 [공시지원 | 선택약정] 두 열. 계산기의 method 와 같은 축이다.
  methods: [
    { key: 'support', label: '공시지원', col: 0 },
    { key: 'select', label: '선택약정', col: 1 },
  ],

  devices: [
    { key: 'flip8', code: 'F776', label: '갤럭시 Z플립8', capacity: '256G', rows: { choice110: { mnp: [81, null], chg: [86, null] }, basic4g: { new: [null, null], mnp: [null, null], chg: [null, null] } } },
    { key: 'fold8', code: 'F971', label: '갤럭시 Z폴드8', capacity: '256G', rows: { choice110: { mnp: [140, null], chg: [145, null] }, basic4g: { new: [null, null], mnp: [null, null], chg: [null, null] } } },
    { key: 'fold8u', code: 'F976', label: '갤럭시 Z폴드8 Ultra', capacity: '256G', rows: { choice110: { mnp: [170, null], chg: [175, null] }, basic4g: { new: [null, null], mnp: [null, null], chg: [null, null] } } },
    { key: 's26', code: 'S942', label: '갤럭시 S26', capacity: '256G', rows: { choice110: { mnp: [38, null], chg: [42, null] }, basic4g: { new: [null, null], mnp: [null, null], chg: [null, null] } } },
    { key: 's26p', code: 'S947', label: '갤럭시 S26+', capacity: '256G', rows: { choice110: { mnp: [58, null], chg: [62, null] }, basic4g: { new: [null, null], mnp: [null, null], chg: [null, null] } } },
    { key: 's26u', code: 'S948', label: '갤럭시 S26 Ultra', capacity: '256G', rows: { choice110: { mnp: [92, null], chg: [96, null] }, basic4g: { new: [null, null], mnp: [null, null], chg: [null, null] } } },
    { key: 'ip18p', code: 'AIP18P', label: '아이폰18 Pro', capacity: '', rows: { choice110: { mnp: [117, 162], chg: [120, 159] }, basic4g: { new: [null, null], mnp: [null, null], chg: [null, null] } } },
    { key: 'ip18pm', code: 'AIP18PM', label: '아이폰18 Pro Max', capacity: '', rows: { choice110: { mnp: [163, 183], chg: [166, 180] }, basic4g: { new: [null, null], mnp: [null, null], chg: [null, null] } } },
    { key: 'a376', code: 'A376', label: 'A37 5G', capacity: '', rows: { choice110: { mnp: [0, null], chg: [0, null] }, basic4g: { new: [0, null], mnp: [0, null], chg: [10, null] } } },
    { key: 'a276', code: 'A276', label: '갤럭시 Jump5 5G', capacity: '', rows: { choice110: { mnp: [0, null], chg: [0, null] }, basic4g: { new: [0, null], mnp: [0, null], chg: [10, null] } } },
  ],

  notes: [
    '표의 금액은 고객이 부담하는 단말 판매가(할부원금)입니다 — 별도 추가지원금을 더 빼지 않습니다',
    "'X' 는 해당 조합 취급 불가입니다",
  ],
  excludes: ['인터넷 결합 수수료 (정책상 미반영)'],
}

// 우리 단말 id → 가격표 행. 표에 이름이 있는 모델만 매핑한다.
// 용량 표기가 달라도(우리 폴드8=1TB / 표=256G) 같은 모델이면 그 줄을 쓴다.
// a56 · ip17 · ip17p · ip17pm 은 가격표 미수록 → 기존 계산 경로.
export const PRICE_ROW = { flip8: 'flip8', fold8: 'fold8', s26: 's26', s26u: 's26u' }

export const pricePlan = (planId) => PRICE_CARD.plans.find((p) => p.key === planId) ?? null
export const priceDevice = (deviceId) => PRICE_CARD.devices.find((d) => d.key === PRICE_ROW[deviceId]) ?? null
export const methodCol = (method) => PRICE_CARD.methods.find((m) => m.key === method)?.col ?? 0
export const isPriced = (deviceId) => Boolean(PRICE_ROW[deviceId])

/**
 * 한 조합의 단말 판매가(원)와 상태.
 * @returns { price, state: 'covered'|'blocked'|'unlisted', device, plan, methodLabel, joinLabel }
 *   price 는 covered 일 때만 숫자다. blocked/unlisted 면 null.
 */
export function priceDetail({ deviceId, planId, join = 'mnp', method = 'support', carrier = null } = {}) {
  const device = priceDevice(deviceId)
  const plan = pricePlan(planId)
  const base = {
    device, plan,
    methodLabel: PRICE_CARD.methods.find((m) => m.key === method)?.label ?? method,
    joinLabel: PRICE_CARD.joins.find((j) => j.key === join)?.label ?? join,
    carrier: PRICE_CARD.carrier, cardName: PRICE_CARD.name, effectiveFrom: PRICE_CARD.effectiveFrom,
  }
  // 가격표는 KT 전용 — 다른 통신사 견적에는 쓰지 않는다
  if (carrier && carrier !== PRICE_CARD.carrier) return { ...base, price: null, state: 'unlisted' }
  if (!device || !plan) return { ...base, price: null, state: 'unlisted' }
  if (!plan.joins.includes(join)) return { ...base, price: null, state: 'blocked' } // 그 요금제엔 없는 가입유형
  const cell = device.rows[plan.key]?.[join]?.[methodCol(method)]
  if (cell == null) return { ...base, price: null, state: 'blocked' } // 시트의 'X'
  return { ...base, price: cell * M, state: 'covered' }
}

/** 판매가(원) 또는 null. 상태까지 필요하면 priceDetail 을 쓴다. */
export const priceOf = (args) => priceDetail(args).price

/** 이 단말·요금제에서 고를 수 있는 (가입유형 × 방식) 조합 — 화면이 불가 버튼을 끄는 데 쓴다. */
export function availableFor({ deviceId, planId, carrier = null } = {}) {
  const out = { joins: new Set(), methods: new Set(), any: false }
  if (!isPriced(deviceId)) return { joins: null, methods: null, any: false } // 미수록 → 기존 경로, 제한 없음
  for (const j of PRICE_CARD.joins) {
    for (const m of PRICE_CARD.methods) {
      if (priceDetail({ deviceId, planId, join: j.key, method: m.key, carrier }).state === 'covered') {
        out.joins.add(j.key); out.methods.add(m.key); out.any = true
      }
    }
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────
// 2) 리베이트 표 — 사업자 R/B 전용. 2차 시트에 리베이트 열이 없어 직전 수령분을 유지한다.
//    리베이트 = 단말 × 요금제 × 가입유형. 새 표를 받으면 이 블록만 교체한다.
// ─────────────────────────────────────────────────────────────────────────
export const REBATE_CARD = {
  id: 'kt-k1-rebate-20260918',
  carrier: 'KT',
  name: 'KT 정책 단가표 K1 (리베이트)',
  effectiveFrom: '2026-09-18',
  stale: true, // 2차 시트가 가격표로 바뀌며 리베이트 열이 빠졌다 — 새 표 수령 시 교체
  plans: [
    { key: 'choice110', name: '초이스 110' },
    { key: 'choice90', name: '초이스 90' },
    { key: 'basic4g', name: '베이직 4GB' },
  ],
  joins: [
    { key: 'new', label: '010 신규', col: 0 },
    { key: 'mnp', label: '번호이동', col: 1 },
    { key: 'chg', label: '기기변경', col: 2 },
  ],
  devices: [
    { key: 'flip8', label: '갤럭시 Z플립8', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 'fold8', label: '갤럭시 Z폴드8', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 'fold8u', label: '갤럭시 Z폴드8 Ultra', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 's26', label: '갤럭시 S26', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 's26p', label: '갤럭시 S26+', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 's26u', label: '갤럭시 S26 Ultra', rows: { choice110: [36, 47, 43], choice90: [33, 45, 40], basic4g: [0, 12, 12] } },
    { key: 'ip18p', label: '아이폰18 P/PM', rows: { choice110: [20, 30, 27], choice90: [18, 25, 25], basic4g: [0, 5, 5] } },
    { key: 'a376', label: 'A376', rows: { choice110: [33, 45, 40], choice90: [32, 44, 39], basic4g: [0, 12, 12] } },
    { key: 'a276', label: 'A276', rows: { choice110: [33, 45, 40], choice90: [32, 44, 39], basic4g: [0, 12, 12] } },
    // 그 외 — 표에 이름이 없는 모델. 시트에 그 외 행이 없어 각 칸 최솟값으로 임시 설정(확인 대기).
    { key: 'etc', label: '그 외', fallback: true, assumed: true, rows: { choice110: [20, 30, 27], choice90: [18, 25, 25], basic4g: [0, 5, 5] } },
  ],
  notes: [
    'M+5월 이내 해지(타사 번호이동 포함) 시 리베이트 전액 환수 · 010 신규는 M+6월 이내',
    'D+123일 이내 요금제 하향 시 차액 환수',
    '서식지 부적격(7일 이내) 건당 2만원 차감 · 신분증 미첨부 건당 10만원 차감',
    'D+3일 이내 증빙서류 미첨부 시 건당 10만원 환수 · M+3월 이내 할부 중도완납 건당 10만원 환수',
  ],
}

export const ETC_ROW = 'etc'
export const REBATE_ROW = { flip8: 'flip8', fold8: 'fold8', s26: 's26', s26u: 's26u' }

export const rebatePlan = (planId) => REBATE_CARD.plans.find((p) => p.key === planId) ?? null
export const rebateDevice = (deviceId) => REBATE_CARD.devices.find((d) => d.key === (REBATE_ROW[deviceId] ?? ETC_ROW)) ?? REBATE_CARD.devices.find((d) => d.key === ETC_ROW)
export const joinCol = (join) => REBATE_CARD.joins.find((j) => j.key === join)?.col ?? 1
export const isListed = (deviceId) => Boolean(REBATE_ROW[deviceId])

/** 한 건의 정책 리베이트(원). 표에 없는 요금제면 0. */
export function rebateOf({ deviceId, planId, join = 'mnp' } = {}) {
  if (!rebatePlan(planId)) return 0
  const row = rebateDevice(deviceId).rows[planId]
  return (row?.[joinCol(join)] ?? 0) * M
}

/** R/B 화면이 근거를 밝힐 수 있게 조합 정보까지 같이 돌려준다. */
export function rebateDetail({ deviceId, planId, join = 'mnp' } = {}) {
  const device = rebateDevice(deviceId)
  const plan = rebatePlan(planId)
  return {
    rebate: rebateOf({ deviceId, planId, join }),
    device, plan,
    listed: isListed(deviceId), // false = '그 외' 줄로 떨어진 건
    covered: Boolean(plan), // false = 표가 모르는 요금제(값 0 과 구분해야 한다)
    joinLabel: REBATE_CARD.joins.find((j) => j.key === join)?.label ?? join,
    carrier: REBATE_CARD.carrier, cardName: REBATE_CARD.name, effectiveFrom: REBATE_CARD.effectiveFrom,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 3) 셀프개통 고정 마진 — 가격표가 값을 주지 못하는 조합에서만 쓰인다.
//    가격표에 값이 있으면 그 가격이 이미 마진을 품고 있으므로 이 경로를 타지 않는다.
// ─────────────────────────────────────────────────────────────────────────
export const SELF_MARGIN_DEFAULT = 100000
export const selfMarginOf = (db) => db?.policies?.selfMargin ?? SELF_MARGIN_DEFAULT

/**
 * 리베이트에서 회사 고정 마진만 떼고 나머지를 고객 지원금으로.
 * 리베이트가 마진보다 작으면 지원금 0 · 마진도 리베이트까지만 — 마이너스 마진을 만들지 않는다.
 */
export function selfSupport({ deviceId, planId, join, margin = SELF_MARGIN_DEFAULT } = {}) {
  const rebate = rebateOf({ deviceId, planId, join })
  const customer = Math.max(0, rebate - margin)
  return { rebate, margin: Math.min(margin, rebate), customer, short: rebate < margin }
}
