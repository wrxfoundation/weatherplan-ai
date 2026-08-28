// ─── 렌탈 견적 엔진 (정수기·비데·공기청정기) ─────────────────────────
// 렌탈은 "월 렌탈료"만 보면 함정이다. 관리 방식(방문형/셀프형) · 약정 기간 ·
// 제휴카드 청구할인 · 동시렌탈 할인이 겹쳐 실부담이 3배까지 갈린다.
// 이 엔진은 그 네 축을 모두 계산해 "카드할인 후 실부담"과 "총 부담"을 함께 낸다.
// ※ 금액은 데모 기준값 — 실제 제휴 단가표 수령 시 이 파일만 교체하면 전 화면에 반영된다.

export const CARE_TYPES = [
  { key: 'visit', label: '방문형', desc: '전문가가 8개월마다 방문 관리' },
  { key: 'self', label: '셀프형', desc: '필터를 직접 교체, 12개월 주기 점검' },
]
export const TERMS = [36, 60]

export const RENTAL_ITEMS = [
  {
    id: 'water-inspure', cat: 'water', brand: '쿠쿠', name: '인스퓨어 냉온정수기', short: '정수기(냉온)',
    features: ['정수', '살균', '3단계 필터', '탈부착 물받이', '자동 살균'],
    monthly: { visit: { 36: 25900, 60: 18900 }, self: { 36: 21900, 60: 15900 } },
    cardDc: 13000, commission: 180000, filterCycle: 8,
  },
  {
    id: 'water-slim', cat: 'water', brand: '코웨이', name: '슬림 직수 정수기', short: '정수기(슬림)',
    features: ['직수', '컴팩트', '2단계 필터'],
    monthly: { visit: { 36: 21900, 60: 16900 }, self: { 36: 17900, 60: 13900 } },
    cardDc: 11000, commission: 150000, filterCycle: 8,
  },
  {
    id: 'bidet', cat: 'rental', brand: '쿠쿠', name: '스마트 비데', short: '비데',
    features: ['온수 세정', '탈취', '자동 노즐 살균'],
    monthly: { visit: { 36: 15900, 60: 11900 }, self: { 36: 12900, 60: 9900 } },
    cardDc: 9000, commission: 110000, filterCycle: 12,
  },
  {
    id: 'air', cat: 'rental', brand: 'LG', name: '퓨리케어 공기청정기', short: '공기청정기',
    features: ['H13 헤파', '極미세먼지', '펫 모드'],
    monthly: { visit: { 36: 23900, 60: 17900 }, self: { 36: 19900, 60: 14900 } },
    cardDc: 12000, commission: 160000, filterCycle: 12,
  },
]

// 동시렌탈(2대 이상) — 대당 월 할인. 우리 결합 논리와 같은 구조의 크로스셀.
export const COMBO_DC = { 2: 2000, 3: 4000 }
export const OWNERSHIP_TERM = 60 // 이 기간 이상 사용 시 소유권 이전
// 할인 중복 하한 — 카드·동시할인을 겹쳐도 월 부담이 이 아래로는 내려가지 않는다.
// (실제 제휴 약관의 최소 청구 원칙. 하한이 없으면 월 900원 같은 비현실적 숫자가 나와
//  견적 전체의 신뢰를 깎는다.)
export const MIN_REAL = 2900

export const rentalItem = (id) => RENTAL_ITEMS.find((r) => r.id === id) ?? RENTAL_ITEMS[0]

/**
 * care: 'visit' | 'self' · term: 36 | 60
 * card: 제휴카드 청구할인 적용 여부 · combo: 동시 렌탈 대수(1~3)
 */
export function calcRental({ itemId = 'water-inspure', care = 'visit', term = 60, card = false, combo = 1 } = {}) {
  const item = rentalItem(itemId)
  const base = item.monthly[care]?.[term] ?? 0
  const rawCombo = COMBO_DC[Math.min(3, Math.max(1, combo))] ?? 0
  const rawCard = card ? item.cardDc : 0
  // 하한에 걸리면 실제로 적용된 할인만 표기한다 — 표시 할인과 청구액이 어긋나지 않게.
  const capped = Math.max(0, base - Math.max(MIN_REAL, base - rawCombo - rawCard))
  const comboDc = Math.min(rawCombo, capped)
  const cardDc = Math.min(rawCard, capped - comboDc)
  const real = base - comboDc - cardDc
  const floored = comboDc + cardDc < rawCombo + rawCard

  return {
    item, care, term, card, combo,
    base,                      // 정가 월 렌탈료
    comboDc, cardDc, floored,  // floored: 할인 하한(MIN_REAL)에 걸려 일부만 적용됨
    real,                      // 카드·동시할인 후 월 실부담
    totalBase: base * term,    // 약정 총액(정가 기준)
    totalReal: real * term,    // 약정 총액(실부담 기준)
    saved: (base - real) * term,
    ownership: term >= OWNERSHIP_TERM,
  }
}

// 관리방식 × 기간 4조합 비교 — 어떤 조합이 총 부담 최저인지 한 번에 보여준다
export function rentalMatrix({ itemId, card, combo }) {
  const rows = []
  for (const c of CARE_TYPES) {
    for (const t of TERMS) {
      const q = calcRental({ itemId, care: c.key, term: t, card, combo })
      rows.push({ key: `${c.key}-${t}`, care: c.key, careLabel: c.label, term: t, base: q.base, real: q.real, totalReal: q.totalReal, ownership: q.ownership })
    }
  }
  const min = Math.min(...rows.map((r) => r.totalReal))
  return rows.map((r) => ({ ...r, cheapest: r.totalReal === min }))
}
