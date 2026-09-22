// ─── 통신사 정책 단가표 (리베이트) — 셀프개통 가격과 사업자 R/B 의 단일 소스 ──────
// 2026-09-22 수령한 「KT 동판 단가표 K1」(2026.09.18~ 즉개) 를 그대로 옮긴 것.
// 표의 숫자는 만원 단위라 여기서 원으로 환산해 둔다(× 10,000). 화면·계산은 전부 원으로 돈다.
//
// [읽는 법] 리베이트 = 기기군 × 요금제 구간 × 가입유형.
//   가입유형 순서는 단가표 열 순서와 같다: [010(신규), MNP(번호이동), 기변(기기변경)]
//
// [셀프개통] 회사가 고정 마진만 남기고 나머지 리베이트를 고객 지원금으로 푼다.
//   고객 지원금 = 리베이트 − 고정 마진(db.policies.selfMargin · 기본 10만원)
//   이 금액이 출고가에서 빠져 할부원금이 되므로 월 납부금이 자동으로 따라 움직인다.
//
// [사업자 R/B] 같은 표를 그대로 보여 준다 — 셀프개통 화면과 숫자가 어긋나면 안 된다.
//
// ※ 단가표가 바뀌면 이 파일의 GROUPS 만 교체한다. 셀프개통·R/B·스모크가 함께 갱신된다.

const M = 10000 // 단가표 단위(만원) → 원

export const RATE_CARD = {
  id: 'kt-k1',
  carrier: 'KT',
  name: 'KT 동판 단가표 K1',
  effectiveFrom: '2026-09-18',
  // 요금제 구간 — 월정액 하한으로 고른다(단가표 열 순서 그대로)
  tiers: [
    { key: 't110', label: '110K (초이스110)', min: 110000 },
    { key: 't90', label: '90K 이상 (초이스 90~100)', min: 90000 },
    { key: 't61', label: '61K 이상 베이직 (30~80GB)', min: 61000 },
    { key: 't49', label: '49K 이상 베이직 (10~21GB)', min: 49000 },
    { key: 't37', label: '37K 이상 베이직 (4~7GB)', min: 37000 },
  ],
  // 가입유형 — 단가표 열 순서(010 · MNP · 기변)
  joins: [
    { key: 'new', label: '010 신규', col: 0 },
    { key: 'mnp', label: '번호이동', col: 1 },
    { key: 'chg', label: '기기변경', col: 2 },
  ],
  // 기기군 × 구간 → [010, MNP, 기변] (만원)
  groups: [
    { key: 'flip8', label: '갤럭시 Z플립 8', rows: { t110: [36, 47, 43], t90: [33, 45, 40], t61: [23, 35, 30], t49: [18, 30, 25], t37: [0, 12, 12] } },
    { key: 'fold8', label: '갤럭시 Z폴드 8류', rows: { t110: [36, 47, 43], t90: [33, 45, 40], t61: [23, 35, 30], t49: [18, 30, 25], t37: [0, 12, 12] } },
    { key: 's26', label: '갤럭시 S26류', rows: { t110: [36, 47, 43], t90: [33, 45, 40], t61: [23, 35, 30], t49: [18, 30, 25], t37: [0, 12, 12] } },
    { key: 's25', label: '갤럭시 25류', rows: { t110: [36, 47, 43], t90: [33, 45, 40], t61: [23, 35, 30], t49: [18, 30, 25], t37: [0, 12, 12] } },
    { key: 'ip18p', label: '아이폰 18P/PM', rows: { t110: [20, 30, 27], t90: [18, 25, 25], t61: [5, 12, 12], t49: [0, 5, 5], t37: [0, 5, 5] } },
    { key: 'ip17', label: '아이폰 17류(전체)', rows: { t110: [18, 25, 25], t90: [16, 23, 23], t61: [5, 12, 12], t49: [0, 5, 5], t37: [0, 5, 5] } },
    { key: 'ip17e', label: '아이폰 17E', rows: { t110: [36, 47, 43], t90: [33, 45, 40], t61: [23, 35, 30], t49: [18, 30, 25], t37: [0, 12, 12] } },
    { key: 'flip7', label: '갤럭시 Z플립 7', rows: { t110: [33, 45, 40], t90: [32, 44, 39], t61: [23, 35, 30], t49: [18, 30, 25], t37: [0, 12, 12] } },
    { key: 'fold7', label: '갤럭시 Z폴드 7', rows: { t110: [33, 45, 40], t90: [32, 44, 39], t61: [23, 35, 30], t49: [18, 30, 25], t37: [0, 12, 12] } },
    { key: 'a256', label: 'A256 · A366 · M366', rows: { t110: [38, 50, 45], t90: [36, 48, 43], t61: [28, 40, 35], t49: [23, 35, 30], t37: [0, 12, 12] } },
    { key: 'a376', label: 'A376 · A276', rows: { t110: [33, 45, 40], t90: [32, 44, 39], t61: [23, 35, 30], t49: [18, 30, 25], t37: [0, 12, 12] } },
    { key: 'etc5g', label: '그외 5G', rows: { t110: [33, 45, 40], t90: [32, 44, 39], t61: [23, 35, 30], t49: [18, 30, 25], t37: [0, 12, 12] } },
    { key: 'lte', label: 'LTE 전모델(A17 포함)', rows: { t110: [18, 30, 25], t90: [15, 27, 22], t61: [10, 22, 17], t49: [5, 17, 12], t37: [0, 12, 12] } },
    { key: 'a165', label: 'SM-A165(LTE)', rows: { t110: [18, 30, 25], t90: [15, 27, 22], t61: [10, 22, 17], t49: [8, 20, 15], t37: [0, 12, 12] } },
  ],
  // 환수·차감 조건 — 화면 고지에 그대로 쓴다(표 하단 공지사항)
  notes: [
    'M+5월 이내 해지(타사 번호이동 포함) 시 리베이트 전액 환수 · 010 신규는 M+6월 이내',
    'D+123일 이내 요금제 하향 시 구간 차액 환수',
    '서식지 부적격(7일 이내) 건당 2만원 차감 · 신분증 미첨부 건당 10만원 차감',
    'D+3일 이내 증빙서류 미첨부 시 건당 10만원 환수 · M+3월 이내 할부 중도완납 건당 10만원 환수',
  ],
}

// 우리 단말 id → 단가표 기기군. 표에 없는 모델은 '그외 5G' 로 떨어뜨린다(누락 시 0원이 되면 안 된다).
export const DEVICE_GROUP = {
  fold8: 'fold8', flip8: 'flip8', s26u: 's26', s26: 's26',
  a56: 'etc5g', ip17p: 'ip17', ip17pm: 'ip17', ip17: 'ip17',
}

export const groupOf = (deviceId) => RATE_CARD.groups.find((g) => g.key === (DEVICE_GROUP[deviceId] ?? 'etc5g')) ?? RATE_CARD.groups.at(-1)
// 요금제 구간 — 월정액이 속하는 가장 높은 구간. 최저 구간 미만이면 null(리베이트 없음)
export const tierOf = (monthly = 0) => RATE_CARD.tiers.find((t) => monthly >= t.min) ?? null
export const joinCol = (join) => RATE_CARD.joins.find((j) => j.key === join)?.col ?? 1

/** 한 건의 정책 리베이트(원). 단가표에 없는 조합이면 0. */
export function rebateOf({ deviceId, planMonthly = 0, join = 'mnp' } = {}) {
  const tier = tierOf(planMonthly)
  if (!tier) return 0
  const row = groupOf(deviceId).rows[tier.key]
  return (row?.[joinCol(join)] ?? 0) * M
}

/** 화면 표기에 필요한 조합 정보까지 같이 — 어느 기기군·어느 구간으로 잡혔는지 보여 줘야 검증이 된다. */
export function rebateDetail({ deviceId, planMonthly = 0, join = 'mnp' } = {}) {
  const group = groupOf(deviceId)
  const tier = tierOf(planMonthly)
  const rebate = rebateOf({ deviceId, planMonthly, join })
  return {
    rebate, group, tier,
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
export function selfSupport({ deviceId, planMonthly, join, margin = SELF_MARGIN_DEFAULT } = {}) {
  const rebate = rebateOf({ deviceId, planMonthly, join })
  const customer = Math.max(0, rebate - margin)
  return { rebate, margin: Math.min(margin, rebate), customer, short: rebate < margin }
}
