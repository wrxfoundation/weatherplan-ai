// ─── 알뜰폰(MVNO) 요금제 데이터 ────────────────────────────────────────
// 상단 대표 2종(featured) → 브랜드별 혜택 요금제(브랜드당 대표 1종) → 전체 목록.
// 상세에서는 가입유형·개통방법·유심 보유·유심 종류·고객유형을 고르고 온라인 신청으로 넘어간다.
//
// ⚠ 보유 요금제 전체 목록은 미수령 — 아래는 구조를 세우기 위한 대표 데이터다.
//   실제 목록이 오면 MVNO_PLANS 만 바꾸면 목록·상세·GNB·상담 프리필 전부에 반영된다.

export const MVNO_BRANDS = [
  { key: 'ktm', name: 'KT M모바일', network: 'KT', color: '#E60012', perk: 'KT 멤버십 일부 제공' },
  { key: 'seven', name: 'SK 세븐모바일', network: 'SKT', color: '#EA1917', perk: 'T멤버십 제휴 할인' },
  { key: 'umobile', name: 'U+유모바일', network: 'LG U+', color: '#ED008C', perk: '유플 결합 할인 가능' },
  { key: 'hello', name: '헬로모바일', network: 'KT', color: '#E4002B', perk: '헬로비전 인터넷 결합' },
  { key: 'freet', name: '프리티', network: 'SKT', color: '#1D4ED8', perk: '데이터 이월·나눔' },
  { key: 'iyagi', name: '이야기모바일', network: 'LG U+', color: '#0F766E', perk: '반값 프로모션 잦음' },
]
export const mvnoBrand = (key) => MVNO_BRANDS.find((b) => b.key === key)

// data: 월 기본 데이터(GB) · after: 소진 후 속도 · call: 통화 · monthly: 월 요금(VAT 포함)
// promo: 프로모션 요금(있으면 표시가) · months: 프로모션 개월 · newJoin: 신규가입 가능 여부 · esim: eSIM 지원
export const MVNO_PLANS = [
  { id: 'ktm-11g', brand: 'ktm', name: '모두안심 11GB+', data: 11, after: '1Mbps', call: '무제한', monthly: 22000, promo: 12000, months: 7, featured: true, newJoin: true, esim: true, tags: ['대표', '통화 무제한'] },
  { id: 'seven-100g', brand: 'seven', name: '세븐 100GB+', data: 100, after: '5Mbps', call: '무제한', monthly: 33000, promo: 19900, months: 6, featured: true, newJoin: true, esim: true, tags: ['대표', '대용량'] },
  { id: 'umobile-15g', brand: 'umobile', name: '유모바일 15GB+', data: 15, after: '3Mbps', call: '무제한', monthly: 24900, promo: 14900, months: 6, newJoin: true, esim: true, tags: ['브랜드 혜택'] },
  { id: 'hello-7g', brand: 'hello', name: '헬로 착한 7GB', data: 7, after: '1Mbps', call: '무제한', monthly: 17600, promo: null, months: 0, newJoin: false, esim: false, tags: ['번호이동 전용'] },
  { id: 'freet-3g', brand: 'freet', name: '프리티 3GB 실속', data: 3, after: '400Kbps', call: '100분', monthly: 7700, promo: 4400, months: 12, newJoin: true, esim: false, tags: ['최저가'] },
  { id: 'iyagi-71g', brand: 'iyagi', name: '이야기 71GB+', data: 71, after: '5Mbps', call: '무제한', monthly: 29700, promo: 16500, months: 6, newJoin: false, esim: true, tags: ['번호이동 전용', '반값'] },
  { id: 'ktm-1g', brand: 'ktm', name: '모두안심 1.5GB', data: 1.5, after: '400Kbps', call: '50분', monthly: 5500, promo: null, months: 0, newJoin: true, esim: true, tags: ['세컨폰'] },
  { id: 'seven-11g', brand: 'seven', name: '세븐 11GB+', data: 11, after: '1Mbps', call: '무제한', monthly: 23100, promo: 13900, months: 6, newJoin: true, esim: true, tags: [] },
  { id: 'umobile-100g', brand: 'umobile', name: '유모바일 100GB+', data: 100, after: '5Mbps', call: '무제한', monthly: 35200, promo: 21900, months: 6, newJoin: true, esim: true, tags: ['대용량'] },
  { id: 'hello-15g', brand: 'hello', name: '헬로 15GB+', data: 15, after: '3Mbps', call: '무제한', monthly: 25300, promo: 15900, months: 6, newJoin: true, esim: false, tags: [] },
  { id: 'freet-11g', brand: 'freet', name: '프리티 11GB+', data: 11, after: '1Mbps', call: '무제한', monthly: 21900, promo: 11900, months: 7, newJoin: true, esim: true, tags: [] },
  { id: 'iyagi-15g', brand: 'iyagi', name: '이야기 15GB+', data: 15, after: '3Mbps', call: '무제한', monthly: 24200, promo: 12100, months: 6, newJoin: true, esim: true, tags: ['반값'] },
  { id: 'ktm-100g', brand: 'ktm', name: '모두안심 100GB+', data: 100, after: '5Mbps', call: '무제한', monthly: 36300, promo: 24900, months: 6, newJoin: true, esim: true, tags: ['대용량'] },
  { id: 'seven-3g', brand: 'seven', name: '세븐 3GB 실속', data: 3, after: '400Kbps', call: '100분', monthly: 8800, promo: null, months: 0, newJoin: false, esim: true, tags: ['번호이동 전용'] },
]
export const mvnoPlan = (id) => MVNO_PLANS.find((p) => p.id === id)
export const FEATURED = MVNO_PLANS.filter((p) => p.featured).slice(0, 2)
// 브랜드별 혜택 요금제 — 브랜드당 프로모션 할인폭이 가장 큰 1종
export const BY_BRAND = MVNO_BRANDS.map((b) => {
  const plans = MVNO_PLANS.filter((p) => p.brand === b.key)
  const pick = [...plans].sort((x, y) => ((y.monthly - (y.promo ?? y.monthly)) - (x.monthly - (x.promo ?? x.monthly))))[0]
  return { brand: b, plan: pick, count: plans.length }
}).filter((x) => x.plan)

// 표시가: 프로모션이 있으면 프로모션가, 없으면 정가
export const showPrice = (p) => p.promo ?? p.monthly

// ─── 가입 옵션 ──────────────────────────────────────────────────────
export const JOIN = [
  { key: 'new', label: '신규가입', desc: '새 번호로 개통' },
  { key: 'mnp', label: '번호이동', desc: '쓰던 번호 그대로' },
]
export const ACTIVATION = [{ key: 'self', label: '셀프개통', desc: '유심 받고 직접 개통 · 10분' }]
export const SIM_OWN = [
  { key: 'have', label: '보유', desc: '쓰던 유심을 그대로 사용' },
  { key: 'none', label: '미보유', desc: '유심을 새로 받아요' },
]
export const SIM_TYPES = [
  { key: 'usim', label: '일반유심', fee: 7700 },
  { key: 'nfc', label: 'NFC유심', fee: 8800 },
  { key: 'esim', label: 'eSIM', fee: 2750 },
]
export const CUSTOMER = [{ key: 'personal', label: '개인' }]

// 옵션 조합 → 초기 비용·주의. 유심 보유면 유심비 0, 미보유면 종류별 유심비.
// eSIM 미지원 요금제에서 eSIM을 고르면 blocked. 신규 불가 요금제에서 신규를 고르면 blocked(팝업).
export function mvnoOrder({ planId, join = 'mnp', simOwn = 'none', simType = 'usim' }) {
  const plan = mvnoPlan(planId) ?? MVNO_PLANS[0]
  const brand = mvnoBrand(plan.brand)
  const sim = SIM_TYPES.find((s) => s.key === simType) ?? SIM_TYPES[0]
  const simFee = simOwn === 'have' ? 0 : sim.fee
  const blocked = []
  if (join === 'new' && !plan.newJoin) blocked.push({ code: 'no-new', msg: '신규로 개통이 불가능한 요금제예요. 번호이동으로만 가입할 수 있어요.' })
  // eSIM 제약은 유심을 새로 받을 때만 — 이미 가진 유심을 쓰면 종류는 무관하다
  if (simOwn === 'none' && simType === 'esim' && !plan.esim) blocked.push({ code: 'no-esim', msg: '이 요금제는 eSIM을 지원하지 않아요. 일반유심 또는 NFC유심을 골라주세요.' })
  const monthly = showPrice(plan)
  return { plan, brand, sim, simFee, monthly, firstMonth: monthly + simFee, blocked, ok: blocked.length === 0,
    promoNote: plan.promo ? `${plan.months}개월 ${monthly.toLocaleString('ko-KR')}원 → 이후 ${plan.monthly.toLocaleString('ko-KR')}원` : null }
}
