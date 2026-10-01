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
// [R/B] 리베이트는 '리베이트 카드'(아래 2)가 따로 쥔다. 기본값은 KT K1 원본 시트(2026-09-18),
//   새 표는 어드민 › 정책 › 단가표 업로드로 반영한다 — 양식이 달라도 같은 주소로 들어온다(rebateImport.js).
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
// 2) 리베이트 카드 — 사업자 R/B · 셀프개통 마진의 원천
//    집주소 = 통신사 → 정책(차수·적용일) → 단말 행 → 요금구간(하한 월정액) → 가입유형  ⇒  금액(원)
//    · 단말 행은 시트 표기 그대로('갤럭시 S26류') 두고, 그 행에 속하는 우리 단말 id 를 devices 에 단다
//    · 요금구간은 이름이 아니라 '하한 월정액'으로 찾는다 — 요금제 월정액 ≥ min 인 가장 높은 구간.
//      그래서 시트마다 구간 이름이 달라도, 우리 요금제가 늘어도 매핑을 다시 하지 않는다
//    · '그외 5G' 같은 대체 행(fallback)은 어느 행에도 안 붙은 단말이 쓴다
//    어드민 › 정책 › 단가표 업로드(rebateImport.js)로 반영한 카드가 있으면 그것, 없으면 아래 시드.
//    적용일이 미래인 카드는 그날부터 자동으로 쓰인다(예약).
// ─────────────────────────────────────────────────────────────────────────
export const REBATE_JOINS = [
  { key: 'new', label: '010 신규' },
  { key: 'mnp', label: '번호이동' },
  { key: 'chg', label: '기기변경' },
]

// 시드 — KT 「K1」 동판 단가표(2026-09-18~) 원본 시트. 업로드 인식기로 뽑은 값을 그대로 옮겼고,
// scripts/qa-data-check.cjs 가 원본 파일(scripts/fixtures)을 인식기로 다시 읽어 이 시드와 같은지 매번 대조한다.
const SEED_TIERS = [
  { key: 't110000', label: '110K (초이스110)', min: 110000 },
  { key: 't90000', label: '90K이상 (초이스 90~100)', min: 90000 },
  { key: 't61000', label: '61K이상 베이직 (30GB~80)', min: 61000 },
  { key: 't49000', label: '49K 이상 베이직(10GB~21GB)', min: 49000 },
  { key: 't37000', label: '37K이상 베이직 (4GB~7GB)', min: 37000 },
]
// [시트 표기, 우리 단말, 대체 행(망), 망, …구간별 [010, MNP, 기변] 만원] — 구간 순서는 SEED_TIERS
const SEED_ROWS = [
  ['갤럭시 Z플립 8', ['flip8'], null, '5G', [36, 47, 43], [33, 45, 40], [23, 35, 30], [18, 30, 25], [0, 12, 12]],
  ['갤럭시 Z폴드 8류', ['fold8'], null, '5G', [36, 47, 43], [33, 45, 40], [23, 35, 30], [18, 30, 25], [0, 12, 12]],
  ['갤럭시 S26류', ['s26u', 's26'], null, '5G', [36, 47, 43], [33, 45, 40], [23, 35, 30], [18, 30, 25], [0, 12, 12]],
  ['갤럭시 25류', [], null, '5G', [36, 47, 43], [33, 45, 40], [23, 35, 30], [18, 30, 25], [0, 12, 12]],
  ['아이폰18P/PM', [], null, '5G', [20, 30, 27], [18, 25, 25], [5, 12, 12], [0, 5, 5], [0, 5, 5]],
  ['아이폰17류(전체)', ['ip17p', 'ip17pm', 'ip17'], null, '5G', [18, 25, 25], [16, 23, 23], [5, 12, 12], [0, 5, 5], [0, 5, 5]],
  ['아이폰17E', [], null, '5G', [36, 47, 43], [33, 45, 40], [23, 35, 30], [18, 30, 25], [0, 12, 12]],
  ['갤럭시 Z플립 7', [], null, '5G', [33, 45, 40], [32, 44, 39], [23, 35, 30], [18, 30, 25], [0, 12, 12]],
  ['갤럭시 Z폴드 7', [], null, '5G', [33, 45, 40], [32, 44, 39], [23, 35, 30], [18, 30, 25], [0, 12, 12]],
  ['A256, A366, M366', [], null, '5G', [38, 50, 45], [36, 48, 43], [28, 40, 35], [23, 35, 30], [0, 12, 12]],
  ['A376, A276', [], null, '5G', [33, 45, 40], [32, 44, 39], [23, 35, 30], [18, 30, 25], [0, 12, 12]],
  ['그외 5G', ['a56'], '5G', '5G', [33, 45, 40], [32, 44, 39], [23, 35, 30], [18, 30, 25], [0, 12, 12]],
  ['LTE 전모델(A17 포함)', [], 'LTE', 'LTE', [18, 30, 25], [15, 27, 22], [10, 22, 17], [5, 17, 12], [0, 12, 12]],
  ['SM-A165(LTE)', [], null, 'LTE', [18, 30, 25], [15, 27, 22], [10, 22, 17], [8, 20, 15], [0, 12, 12]],
]
const SEED_NOTES = [
  'M+5월 이내 해지시(타사 MNP 이동 포함) 리베이트 전액 환수/ 010신규의 경우, M+6월 이내 해지시 전액 환수',
  'D+123일 이내 요금제 변경시(고ARPU→저ARPU) 요금제 구간별 차액 금액 환수',
  '서식지 부적격(7일 이내) 건당 2만원 차감',
  '가입자 신분증 미첨부시(필요시 / 7일 이내) 건당 10만원 차감(서식지 부적격 중복 차감)',
  'D+3일 이내 증빙서류(카드영수증,현금영수증,입금통장사본) 미첨부시 건당 10만원 환수',
  'M+3월 이내 할부금 중도 완납시 건당 10만원 환수',
  '선개통 발생시, KT기준 차감',
  'VOC 차감 : VOC 접수 시점 9시간(KT업무 시간 기준) 이내 미처리시 건당 10만원 환수',
]
export const REBATE_SEED = {
  id: 'KT-K1-2026-09-18-seed',
  carrier: 'KT',
  code: 'K1',
  name: 'KT 정책 단가표 K1 (리베이트)',
  effectiveFrom: '2026-09-18',
  tiers: SEED_TIERS,
  joins: REBATE_JOINS.map((j) => j.key),
  groups: SEED_ROWS.map(([label, devices, fallback, net, ...t], i) => ({
    key: `g${i + 1}`, label, net, fallback, devices,
    values: Object.fromEntries(SEED_TIERS.map((tier, ti) => [tier.key, t[ti].map((v) => (v == null ? null : v * M))])),
  })),
  notes: SEED_NOTES,
  source: { file: 'KT K1 동판 단가표(2026-09-18) — 기본값', sheet: 'K1', unit: M, importedAt: null, seed: true },
}

// 업로드 반영분(최신 먼저) — StoreProvider 가 db.policies.rebateCards 를 렌더마다 넣어 준다.
// 계산 함수(가격·R/B)는 순수 함수라 스토어를 모르므로, 여기 한 곳에서 '지금 쓰는 카드'를 정한다.
let UPLOADED = []
export function setRebateCards(cards) { UPLOADED = Array.isArray(cards) ? cards : [] }
export const ymd = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const poolOf = (carrier) => [...UPLOADED.filter((c) => c.carrier === carrier), ...(REBATE_SEED.carrier === carrier ? [REBATE_SEED] : [])]
/** 그 통신사에 지금 유효한 카드 — 적용일이 지난 것 중 가장 최근(같은 날이면 나중에 올린 것) */
export function activeRebateCard(carrier = 'KT', on = ymd()) {
  return poolOf(carrier).filter((c) => !c.effectiveFrom || c.effectiveFrom <= on)
    .sort((a, b) => (b.effectiveFrom ?? '').localeCompare(a.effectiveFrom ?? ''))[0] ?? null
}
/** 적용일이 아직 오지 않은(예약) 카드 */
export const pendingRebateCards = (carrier = 'KT', on = ymd()) => poolOf(carrier).filter((c) => c.effectiveFrom && c.effectiveFrom > on)

export const cardGroup = (card, deviceId) =>
  card?.groups.find((g) => g.devices?.includes(deviceId)) ?? card?.groups.find((g) => g.fallback === '5G') ?? null
export const cardTier = (card, monthly) =>
  [...(card?.tiers ?? [])].filter((t) => t.min != null).sort((a, b) => b.min - a.min).find((t) => monthly >= t.min) ?? null

/**
 * 한 건의 정책 리베이트와 근거(카드·행·구간). 그 통신사 카드가 없으면 KT 카드로 받친다(기존 동작 유지).
 * covered — 행과 구간을 찾았다(0원도 표의 답이다). 칸이 'X'(취급 안 함)면 rebate 0 · blocked true.
 */
export function rebateDetail({ deviceId, planId, join = 'mnp', carrier = 'KT', card: given = null } = {}) {
  const card = given ?? activeRebateCard(carrier) ?? activeRebateCard('KT')
  const plan = pricePlan(planId)
  const group = cardGroup(card, deviceId)
  const tier = plan ? cardTier(card, plan.monthly) : null
  const v = group && tier ? group.values?.[tier.key]?.[card.joins.indexOf(join)] : undefined
  return {
    rebate: v ?? 0,
    device: group ? { key: group.key, label: group.label } : null,
    plan: tier ? { key: tier.key, name: tier.label } : null,
    listed: Boolean(group && !group.fallback), // false = 대체 행('그외 5G')으로 떨어진 건
    covered: Boolean(group && tier),
    blocked: v === null,
    joinLabel: REBATE_JOINS.find((j) => j.key === join)?.label ?? join,
    carrier: card?.carrier, cardName: card?.name, effectiveFrom: card?.effectiveFrom, cardId: card?.id,
  }
}
/** 한 건의 정책 리베이트(원). 표가 모르는 조합이면 0. */
export const rebateOf = (args) => rebateDetail(args).rebate

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
export function selfSupport({ deviceId, planId, join, margin = SELF_MARGIN_DEFAULT, carrier = 'KT' } = {}) {
  const rebate = rebateOf({ deviceId, planId, join, carrier: carrier ?? 'KT' })
  const customer = Math.max(0, rebate - margin)
  return { rebate, margin: Math.min(margin, rebate), customer, short: rebate < margin }
}
