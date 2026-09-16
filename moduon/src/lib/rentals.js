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

// ─── 브랜드 × 카테고리 (스펙 원문 순서 그대로) ─────────────────────────
// GNB 렌탈 메가메뉴와 /category/rental 브라우저가 같은 표를 쓴다.
export const RENTAL_BRANDS = [
  { key: 'lg', name: 'LG퓨리케어', cats: ['정수기', '공기청정기', '주방가전', '냉장고/김치냉장고', '스타일러', '세탁/건조', '에어컨/청소기', '안마의자'] },
  { key: 'skmagic', name: 'SK매직', cats: ['정수기', '공기청정기', '주방가전', '생활가전', '비데'] },
  { key: 'coway', name: '코웨이', cats: ['정수기', '공기청정기', '생활가전', '비데/연수기', '매트리스/프레임'] },
  { key: 'cuming', name: '현대큐밍', cats: ['정수기', '공기청정기', '주방가전', '생활가전', '비데'] },
  { key: 'uverse', name: '유버스(현대미래)', cats: ['정수기', '공기청정기', '비데/연수기'] },
  { key: 'cuckoo', name: '쿠쿠', cats: ['정수기', '공기청정기/제습기', '주방가전', '생활가전/펫드라이룸', '비데/연수기', '안마의자'] },
  { key: 'chungho', name: '청호나이스', cats: ['정수기/제빙기', '공기청정기', '주방가전', '비데/연수기'] },
  { key: 'ruhens', name: '루헨스', cats: ['정수기', '공기청정기', '비데'] },
  { key: 'general', name: '종합렌탈', cats: ['TV', '냉장고', '냉난방기'] },
]
export const rentalBrand = (key) => RENTAL_BRANDS.find((b) => b.key === key)
// 정수기 계열 카테고리인지 — '정수기', '정수기/제빙기' 모두 정수기 필터(냉온/얼음)를 받는다
export const isWaterCat = (cat = '') => cat.startsWith('정수기')
export const WATER_TYPES = [
  { key: 'cold-hot', label: '냉온만', desc: '냉수·온수·정수' },
  { key: 'ice', label: '얼음냉온', desc: '얼음까지 · 제빙' },
]

export const RENTAL_ITEMS = [
  {
    id: 'water-inspure', cat: 'water', brand: '쿠쿠', brandKey: 'cuckoo', category: '정수기', waterType: 'cold-hot', name: '인스퓨어 냉온정수기', short: '정수기(냉온)',
    features: ['정수', '살균', '3단계 필터', '탈부착 물받이', '자동 살균'],
    monthly: { visit: { 36: 25900, 60: 18900 }, self: { 36: 21900, 60: 15900 } },
    cardDc: 13000, commission: 180000, filterCycle: 8,
  },
  {
    id: 'water-slim', cat: 'water', brand: '코웨이', brandKey: 'coway', category: '정수기', waterType: 'cold-hot', name: '슬림 직수 정수기', short: '정수기(슬림)',
    features: ['직수', '컴팩트', '2단계 필터'],
    monthly: { visit: { 36: 21900, 60: 16900 }, self: { 36: 17900, 60: 13900 } },
    cardDc: 11000, commission: 150000, filterCycle: 8,
  },
  {
    id: 'bidet', cat: 'rental', brand: '쿠쿠', brandKey: 'cuckoo', category: '비데/연수기', name: '스마트 비데', short: '비데',
    features: ['온수 세정', '탈취', '자동 노즐 살균'],
    monthly: { visit: { 36: 15900, 60: 11900 }, self: { 36: 12900, 60: 9900 } },
    cardDc: 9000, commission: 110000, filterCycle: 12,
  },
  {
    id: 'air', cat: 'rental', brand: 'LG퓨리케어', brandKey: 'lg', category: '공기청정기', name: '퓨리케어 공기청정기', short: '공기청정기',
    features: ['H13 헤파', '極미세먼지', '펫 모드'],
    monthly: { visit: { 36: 23900, 60: 17900 }, self: { 36: 19900, 60: 14900 } },
    cardDc: 12000, commission: 160000, filterCycle: 12,
  },
  // ─── 브랜드 브라우저용 추가 품목(대표값) — 각 브랜드에 정수기 1종 이상 ───
  { id: 'lg-ice', cat: 'water', brand: 'LG퓨리케어', brandKey: 'lg', category: '정수기', waterType: 'ice', name: '오브제 얼음정수기', short: '정수기(얼음)',
    features: ['얼음', '냉온정수', 'UV 살균', '오브제 디자인'], monthly: { visit: { 36: 46900, 60: 39900 }, self: { 36: 42900, 60: 35900 } }, cardDc: 15000, commission: 260000, filterCycle: 6 },
  { id: 'lg-styler', cat: 'rental', brand: 'LG퓨리케어', brandKey: 'lg', category: '스타일러', name: '스타일러 오브제', short: '스타일러',
    features: ['스팀 살균', '3벌', '바지 칼주름'], monthly: { visit: { 36: 39900, 60: 32900 }, self: { 36: 36900, 60: 29900 } }, cardDc: 15000, commission: 240000, filterCycle: 12 },
  { id: 'lg-massage', cat: 'rental', brand: 'LG퓨리케어', brandKey: 'lg', category: '안마의자', name: '힐링미 안마의자', short: '안마의자',
    features: ['전신 마사지', '무중력', '음성 제어'], monthly: { visit: { 36: 79900, 60: 59900 }, self: { 36: 74900, 60: 54900 } }, cardDc: 20000, commission: 400000, filterCycle: 0 },
  { id: 'skm-cold', cat: 'water', brand: 'SK매직', brandKey: 'skmagic', category: '정수기', waterType: 'cold-hot', name: '올인원 직수 정수기', short: '정수기(냉온)',
    features: ['직수', '냉온정수', '살균'], monthly: { visit: { 36: 23900, 60: 17900 }, self: { 36: 19900, 60: 14900 } }, cardDc: 12000, commission: 170000, filterCycle: 8 },
  { id: 'skm-ice', cat: 'water', brand: 'SK매직', brandKey: 'skmagic', category: '정수기', waterType: 'ice', name: '스스로 얼음정수기', short: '정수기(얼음)',
    features: ['얼음', '냉온정수', '자동 세척'], monthly: { visit: { 36: 42900, 60: 35900 }, self: { 36: 38900, 60: 31900 } }, cardDc: 15000, commission: 250000, filterCycle: 6 },
  { id: 'coway-ice', cat: 'water', brand: '코웨이', brandKey: 'coway', category: '정수기', waterType: 'ice', name: '아이콘 얼음정수기', short: '정수기(얼음)',
    features: ['얼음', '초슬림', '냉온정수', '3단 온도'], monthly: { visit: { 36: 44900, 60: 37900 }, self: { 36: 40900, 60: 33900 } }, cardDc: 15000, commission: 260000, filterCycle: 6 },
  { id: 'coway-mattress', cat: 'rental', brand: '코웨이', brandKey: 'coway', category: '매트리스/프레임', name: '비렉스 매트리스 Q', short: '매트리스',
    features: ['퀸', '4개월 케어', '진드기 관리'], monthly: { visit: { 36: 35900, 60: 28900 }, self: { 36: 32900, 60: 25900 } }, cardDc: 13000, commission: 220000, filterCycle: 4 },
  { id: 'cuming-cold', cat: 'water', brand: '현대큐밍', brandKey: 'cuming', category: '정수기', waterType: 'cold-hot', name: '더슬림 냉온정수기', short: '정수기(냉온)',
    features: ['직수', '냉온정수', '슬림'], monthly: { visit: { 36: 22900, 60: 16900 }, self: { 36: 18900, 60: 13900 } }, cardDc: 11000, commission: 150000, filterCycle: 8 },
  { id: 'uverse-cold', cat: 'water', brand: '유버스(현대미래)', brandKey: 'uverse', category: '정수기', waterType: 'cold-hot', name: '유버스 냉온정수기', short: '정수기(냉온)',
    features: ['직수', '냉온정수', '3단계 필터'], monthly: { visit: { 36: 21900, 60: 15900 }, self: { 36: 17900, 60: 12900 } }, cardDc: 11000, commission: 140000, filterCycle: 8 },
  { id: 'cuckoo-ice', cat: 'water', brand: '쿠쿠', brandKey: 'cuckoo', category: '정수기', waterType: 'ice', name: '인스퓨어 얼음정수기', short: '정수기(얼음)',
    features: ['얼음', '냉온정수', '살균', '자동 살균'], monthly: { visit: { 36: 41900, 60: 34900 }, self: { 36: 37900, 60: 30900 } }, cardDc: 15000, commission: 250000, filterCycle: 6 },
  { id: 'cuckoo-pet', cat: 'rental', brand: '쿠쿠', brandKey: 'cuckoo', category: '생활가전/펫드라이룸', name: '넬로 펫 드라이룸', short: '펫드라이룸',
    features: ['저소음', '음이온', '자동 건조'], monthly: { visit: { 36: 29900, 60: 22900 }, self: { 36: 26900, 60: 19900 } }, cardDc: 12000, commission: 180000, filterCycle: 12 },
  { id: 'chungho-ice', cat: 'water', brand: '청호나이스', brandKey: 'chungho', category: '정수기/제빙기', waterType: 'ice', name: '이과수 얼음정수기', short: '정수기(얼음)',
    features: ['얼음', '냉온정수', '제빙 1위'], monthly: { visit: { 36: 43900, 60: 36900 }, self: { 36: 39900, 60: 32900 } }, cardDc: 15000, commission: 250000, filterCycle: 6 },
  { id: 'chungho-cold', cat: 'water', brand: '청호나이스', brandKey: 'chungho', category: '정수기/제빙기', waterType: 'cold-hot', name: '이과수 냉온정수기', short: '정수기(냉온)',
    features: ['냉온정수', '역삼투압', '살균'], monthly: { visit: { 36: 25900, 60: 19900 }, self: { 36: 21900, 60: 16900 } }, cardDc: 12000, commission: 170000, filterCycle: 8 },
  { id: 'ruhens-cold', cat: 'water', brand: '루헨스', brandKey: 'ruhens', category: '정수기', waterType: 'cold-hot', name: '루헨스 직수 냉온정수기', short: '정수기(냉온)',
    features: ['직수', '냉온정수', '컴팩트'], monthly: { visit: { 36: 20900, 60: 14900 }, self: { 36: 16900, 60: 11900 } }, cardDc: 10000, commission: 130000, filterCycle: 8 },
  { id: 'gen-tv', cat: 'rental', brand: '종합렌탈', brandKey: 'general', category: 'TV', name: '65형 4K QLED TV', short: 'TV 65형',
    features: ['65형', '4K', '스마트'], monthly: { visit: { 36: 32900, 60: 24900 }, self: { 36: 32900, 60: 24900 } }, cardDc: 12000, commission: 200000, filterCycle: 0 },
  { id: 'gen-ac', cat: 'rental', brand: '종합렌탈', brandKey: 'general', category: '냉난방기', name: '냉난방 인버터 에어컨', short: '냉난방기',
    features: ['냉난방', '인버터', '설치 포함'], monthly: { visit: { 36: 36900, 60: 27900 }, self: { 36: 36900, 60: 27900 } }, cardDc: 13000, commission: 220000, filterCycle: 12 },
]

// 동시렌탈(2대 이상) — 대당 월 할인. 우리 결합 논리와 같은 구조의 크로스셀.
export const COMBO_DC = { 2: 2000, 3: 4000 }
export const OWNERSHIP_TERM = 60 // 이 기간 이상 사용 시 소유권 이전
// 할인 중복 하한 — 카드·동시할인을 겹쳐도 월 부담이 이 아래로는 내려가지 않는다.
// (실제 제휴 약관의 최소 청구 원칙. 하한이 없으면 월 900원 같은 비현실적 숫자가 나와
//  견적 전체의 신뢰를 깎는다.)
export const MIN_REAL = 2900

export const rentalItem = (id) => RENTAL_ITEMS.find((r) => r.id === id) ?? RENTAL_ITEMS[0]
// 브랜드·카테고리·정수기타입으로 걸러 목록을 만든다. 카테고리 미지정이면 브랜드 전체.
export function browseRentals({ brand, category, waterType } = {}) {
  return RENTAL_ITEMS.filter((r) =>
    (!brand || r.brandKey === brand) &&
    (!category || r.category === category) &&
    (!waterType || !isWaterCat(r.category) || r.waterType === waterType))
}

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
