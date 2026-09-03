// ─── 인터넷 셀프견적 빌더 데이터 (아정당식 4필터) ─────────────────────
// 통신사 → 조합(단독/인터넷+TV, +전화) → 속도(+공유기) → TV채널 순으로 고르면
// 우측에 예상 월요금·기본요금·카드할인가·사은품이 실시간으로 선다.
//
// ⚠ 단가는 "제로노트 단가표" 미수령 상태의 대표값이다. 단가표가 오면 이 파일의
//   NET_TIERS · TV_TIERS · ADDON · CARD_DC 만 바꾸면 빌더·GNB·상담 프리필 전부에 반영된다.
//   engine.js SPEED_MAP(구 견적계산기)은 KT 단가와 같게 유지해 두 화면의 숫자가 어긋나지 않게 한다.
// 사은품은 engine.js(GIFT_MAP·CARRIER_GIFT_ADD)의 단일 출처를 그대로 쓴다 — 여기서 새로 정하지 않는다.
import { GIFT_MAP, CARRIER_GIFT_ADD } from './engine'
import { NET_CARRIERS } from './onboard'

// 빌더에 노출하는 통신사 — 스펙: KT / LG U+ / SK / 스카이라이프 / 헬로비전
export const INTERNET_CARRIERS = NET_CARRIERS.filter((c) => c.key !== 'skb-budget')
export const netCarrier = (key) => INTERNET_CARRIERS.find((c) => c.key === key) ?? INTERNET_CARRIERS[0]

export const COMBOS = [
  { key: 'net', label: '인터넷 단독', desc: '인터넷만 필요해요' },
  { key: 'net-tv', label: '인터넷 + TV', desc: '실시간 채널·VOD까지' },
]

// 통신사별 속도 티어 (월 요금, 3년 약정, VAT 포함 — 대표값)
export const NET_TIERS = {
  'KT':          [{ key: '100M', label: '100Mbps', monthly: 33000, fit: '1~2인 · 웹서핑' }, { key: '500M', label: '500Mbps', monthly: 44000, fit: '가장 인기 · 3인 이상' }, { key: '1G', label: '1Gbps', monthly: 55000, fit: '재택·4K·게임' }],
  'SK브로드밴드': [{ key: '100M', label: '100Mbps', monthly: 31900, fit: '1~2인 · 웹서핑' }, { key: '500M', label: '500Mbps', monthly: 42900, fit: '가장 인기 · 3인 이상' }, { key: '1G', label: '1Gbps', monthly: 53900, fit: '재택·4K·게임' }],
  'LG U+':       [{ key: '100M', label: '100Mbps', monthly: 33000, fit: '1~2인 · 웹서핑' }, { key: '500M', label: '500Mbps', monthly: 44000, fit: '가장 인기 · 3인 이상' }, { key: '1G', label: '1Gbps', monthly: 55000, fit: '재택·4K·게임' }],
  'skylife':     [{ key: '100M', label: '100Mbps', monthly: 19800, fit: '알뜰 · 1~2인' }, { key: '500M', label: '500Mbps', monthly: 27500, fit: '알뜰 · 가족' }, { key: '1G', label: '1Gbps', monthly: 33000, fit: '알뜰 · 재택' }],
  'hellovision': [{ key: '100M', label: '100Mbps', monthly: 18700, fit: '알뜰 · 1~2인' }, { key: '500M', label: '500Mbps', monthly: 26400, fit: '알뜰 · 가족' }, { key: '1G', label: '1Gbps', monthly: 30800, fit: '알뜰 · 재택' }],
}

// 통신사별 TV 요금제 (채널 수는 대표값)
export const TV_TIERS = {
  'KT':          [{ key: 'basic', label: '베이직', channels: 189, monthly: 12100 }, { key: 'lite', label: '라이트', channels: 233, monthly: 15400 }, { key: 'prem', label: '프리미엄', channels: 267, monthly: 22000 }],
  'SK브로드밴드': [{ key: 'lite', label: 'B tv 라이트', channels: 190, monthly: 13200 }, { key: 'std', label: 'B tv 스탠다드', channels: 230, monthly: 16500 }, { key: 'prem', label: 'B tv 프리미엄', channels: 260, monthly: 20900 }],
  'LG U+':       [{ key: 'basic', label: '베이직', channels: 180, monthly: 12100 }, { key: 'prem', label: '프리미엄', channels: 240, monthly: 16500 }, { key: 'vip', label: 'VIP', channels: 270, monthly: 23100 }],
  'skylife':     [{ key: 'eco', label: '이코노미', channels: 150, monthly: 9900 }, { key: 'std', label: '스탠다드', channels: 200, monthly: 13200 }],
  'hellovision': [{ key: 'basic', label: '베이직', channels: 160, monthly: 9900 }, { key: 'prem', label: '프리미엄', channels: 210, monthly: 14300 }],
}

const isBudget = (key) => !!netCarrier(key).budget

// 부가: 전화(집전화 회선) · 공유기(임대). 1G 이상은 공유기 무료가 통례.
export const ADDON = {
  phone: { label: '전화와 함께', desc: '집전화 회선 추가', monthly: (key) => (isBudget(key) ? 2200 : 1100) },
  router: { label: '공유기와 함께', desc: '와이파이 공유기 임대', monthly: (key, speed) => (speed === '1G' ? 0 : 1100), freeNote: '1Gbps는 공유기 임대가 무료예요' },
}
// 인터넷+TV 결합 할인 / 제휴카드 청구할인(실적 조건) / TV·전화 사은품 가산
export const COMBO_DC = (key) => (isBudget(key) ? 3300 : 5500)
export const CARD_DC = (key) => (isBudget(key) ? 5500 : 11000)
export const TV_GIFT_ADD = (key) => (isBudget(key) ? 30000 : 50000)
export const PHONE_GIFT_ADD = 10000

export const tiersOf = (key) => NET_TIERS[key] ?? NET_TIERS.KT
export const tvTiersOf = (key) => TV_TIERS[key] ?? TV_TIERS.KT

/**
 * carrier: INTERNET_CARRIERS key · combo: 'net' | 'net-tv' · speed: tier key
 * tv: TV tier key(조합이 net-tv일 때만) · phone: 전화 추가 · router: 공유기 추가
 */
export function calcInternet({ carrier = 'KT', combo = 'net', speed = '500M', tv = null, phone = false, router = false } = {}) {
  const c = netCarrier(carrier)
  const tier = tiersOf(c.key).find((t) => t.key === speed) ?? tiersOf(c.key)[1]
  const withTv = combo === 'net-tv'
  const tvTier = withTv ? (tvTiersOf(c.key).find((t) => t.key === tv) ?? tvTiersOf(c.key)[0]) : null

  const base = tier.monthly                                  // 기본요금(인터넷)
  const tvFee = tvTier?.monthly ?? 0
  const phoneFee = phone ? ADDON.phone.monthly(c.key) : 0
  const routerFee = router ? ADDON.router.monthly(c.key, tier.key) : 0
  const comboDc = withTv ? COMBO_DC(c.key) : 0
  const total = base + tvFee + phoneFee + routerFee - comboDc  // 예상 월요금
  const cardDc = CARD_DC(c.key)
  const cardTotal = Math.max(0, total - cardDc)               // 카드할인가

  // 사은품 — engine 단일 출처 + TV·전화 가산. 알뜰 통신사는 기준가의 60%.
  const giftBase = Math.round((GIFT_MAP[tier.key] ?? 0) * (c.budget ? 0.6 : 1))
  const giftCarrier = CARRIER_GIFT_ADD[c.key] ?? 0
  const giftTv = withTv ? TV_GIFT_ADD(c.key) : 0
  const giftPhone = phone ? PHONE_GIFT_ADD : 0
  const gift = giftBase + giftCarrier + giftTv + giftPhone

  return {
    carrier: c, tier, tvTier, combo, phone, router,
    base, tvFee, phoneFee, routerFee, comboDc, total, cardDc, cardTotal,
    gift, giftBase, giftCarrier, giftTv, giftPhone,
    real36: total * 36 - gift,
  }
}

// 상담 프리필·공유 텍스트용 한 줄 요약
export const internetLabel = (q) =>
  `${q.carrier.name} 인터넷 ${q.tier.label}${q.tvTier ? ` + TV ${q.tvTier.label}` : ''}${q.phone ? ' + 전화' : ''}${q.router ? ' + 공유기' : ''}`

// 상태 → 쿼리 (GNB·공유 링크에서 같은 조건으로 열기)
export function internetQuery(s) {
  const p = new URLSearchParams()
  if (s.carrier) p.set('carrier', s.carrier)
  if (s.combo) p.set('combo', s.combo)
  if (s.speed) p.set('speed', s.speed)
  if (s.tv) p.set('tv', s.tv)
  if (s.phone) p.set('phone', '1')
  if (s.router) p.set('router', '1')
  return p.toString()
}
