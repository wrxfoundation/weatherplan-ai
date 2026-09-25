// ─── R/B (리베이트/백마진) — 사업자 회원 전용 표시 ──────────────────────
// 소비자가 보는 "월 납부요금"과는 완전히 분리된 별도 블록이다.
// 같은 계산기를 개인회원이 열면 이 블록 자체가 렌더되지 않는다(bizIdentity 가 null).
//
// [원칙] 단가(R/B 총액)는 총판·대리점·셀러 누가 봐도 같은 값이다.
//   계층별 몫만 각자 화면에서 가산된다 — 상위는 하위의 최종 마진을, 하위는 상위 몫을 몰라도 된다.
//   그래서 rows 는 "내 등급이 볼 자격이 있는 줄"만 담아 돌려준다. 화면은 판단하지 않는다.
import { rateItem, supportRange, JOIN_ADJ, JOIN_ADJ_LABEL } from './commission'
import { rebateDetail } from './ratecard'

// 계산기 선택값 → 정책 단가표 상품. 단가의 단일 소스는 commission.RATE_CARD.
const DEVICE_RATE = { fold8: 'mno-fold', flip8: 'mno-fold', s26u: 'mno-fold', s26: 'mno-fold', a56: 'mno-fold', ip17p: 'mno-air', ip17pm: 'mno-air', ip17: 'mno-air' }
const RENTAL_RATE = (itemId = '') => (itemId.startsWith('water') || itemId.includes('-ice') || itemId.includes('-cold') ? 'rental-water' : 'rental-air')

export const rbRateIdFor = ({ kind, deviceId, itemId, mvno }) =>
  mvno ? 'mvno' : kind === 'phone' ? (DEVICE_RATE[deviceId] ?? 'mno-fold') : RENTAL_RATE(itemId)

/**
 * 한 건의 R/B 분해.
 * @param viewer  org.bizIdentity() 결과. null 이면 호출부가 렌더 자체를 하지 않는다.
 * @param planId  요금제 id. 단가표가 요금제를 이름으로 고정하므로 월정액이 아니라 id 로 찾는다.
 * @param support 매장이 고객에게 얹어 주는 추가지원금(셀러 재량). 통신사 공시지원금은 여기 들어오면 안 된다 —
 *                그건 통신사가 내는 돈이라 R/B 와 무관하고, 넣으면 셀러 수당이 늘 0 으로 깎인다.
 */
export function rbFor({ kind = 'phone', deviceId, itemId, mvno = false, join = 'mnp', support = 0, planId = null, viewer }) {
  const item = rateItem(rbRateIdFor({ kind, deviceId, itemId, mvno }))
  // 휴대폰(알뜰폰 제외)은 실제 수령한 통신사 정책 단가표를 쓴다 — 셀프개통 화면과 같은 숫자여야 한다.
  // 단가표에 없는 조합이면 0 이 되므로, 그때만 기존 데모 단가표로 받친다.
  const card = kind === 'phone' && !mvno ? rebateDetail({ deviceId, planId, join }) : null
  const adj = kind === 'phone' ? (JOIN_ADJ[join] ?? 1) : 1
  // 단가표가 아는 요금제면 그 값이 곧 단가다 — 0 원도 단가표의 답이므로 데모 단가로 덮으면 안 된다.
  // 데모 단가표(commission)는 단가표가 모르는 요금제일 때만 받친다.
  const rebate = card?.covered ? card.rebate : Math.round(item.rebate * adj)
  const hidden = {
    agency: Math.round(item.hidden.agency * adj),
    distributor: Math.round(item.hidden.distributor * adj),
    hq: Math.round(item.hidden.hq * adj),
  }
  const range = supportRange({ ...item, rebate })
  const customer = Math.min(range.max, Math.max(range.min, Math.round(support)))
  const seller = Math.max(0, rebate - customer - hidden.agency - hidden.distributor - hidden.hq)

  const tier = viewer?.tier ?? 'seller'
  const mine = tier === 'seller' ? seller : tier === 'agency' ? hidden.agency : tier === 'distributor' ? hidden.distributor : hidden.hq
  const mineLabel = tier === 'seller' ? '내 수당 (셀러)' : tier === 'hq' ? '본사 몫' : `건당 영업비 (${tier === 'agency' ? '대리점' : '총판'})`

  // 내 등급이 볼 자격이 있는 줄만 — 셀러는 고객 지원금 재량이 있으니 그 줄을 본다.
  const rows = [{ key: 'rebate', label: 'R/B 단가', value: rebate, tone: 'ink' }]
  if (tier === 'seller' || tier === 'hq') rows.push({ key: 'customer', label: '고객 추가지원 (매장 부담)', value: -customer, tone: 'minus' })
  if (tier === 'hq') {
    rows.push({ key: 'seller', label: '셀러 수당', value: seller, tone: 'ink' })
    rows.push({ key: 'agency', label: '대리점 영업비', value: hidden.agency, tone: 'ink' })
    rows.push({ key: 'distributor', label: '총판 영업비', value: hidden.distributor, tone: 'ink' })
  }
  rows.push({ key: 'mine', label: mineLabel, value: mine, tone: 'mine' })

  return {
    item, rebate, customer, seller, hidden, range, mine, mineLabel, rows, tier,
    joinLabel: card ? card.joinLabel : (kind === 'phone' ? (JOIN_ADJ_LABEL[join] ?? '') : ''),
    adjusted: !card?.covered && adj !== 1,
    card, // 정책 단가표 근거(기기군·구간·단가표명) — 화면이 출처를 밝힌다
  }
}
