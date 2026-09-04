// ─── 렌트/리스 견적 엔진 (장기렌터카 · 오토리스) ────────────────────────────
// 오토클래스 구조를 우리 규격으로: 제조사 → 차종 → 트림 → 선택옵션 →
// 초기부담금 · 계약기간 · 선납금/보증금 기준 → 월 리스료 / 월 렌트료.
//
// ⚠ 캐피탈사 실단가표 미수령. 아래 산식은 업계 표준형(잔존가치 + 원리금)에
//   공개 견적 1건(팰리세이드 가솔린 2.5 익스클루시브 9인승 43,830,000원 ·
//   초기부담금 30% · 36개월 → 리스 203,700 / 렌트 288,400)으로 계수를 맞춘 것이다.
//   실단가표가 오면 RESIDUAL · LEASE_APR · MAINT_RATE · DEPOSIT_EFF 만 바꾸면
//   목록·상세·상담 프리필 전부에 반영된다.

export const CAR_BRANDS = [
  // 국산차 제조사
  { key: 'hyundai', name: '현대', origin: 'dom' },
  { key: 'genesis', name: '제네시스', origin: 'dom' },
  { key: 'kia', name: '기아', origin: 'dom' },
  { key: 'chevrolet', name: '쉐보레', origin: 'dom' },
  { key: 'kgm', name: 'KGM', origin: 'dom' },
  { key: 'renault', name: '르노', origin: 'dom' },
  // 수입차 제조사
  { key: 'benz', name: '벤츠', origin: 'imp' },
  { key: 'bmw', name: 'BMW', origin: 'imp' },
  { key: 'tesla', name: '테슬라', origin: 'imp' },
  { key: 'porsche', name: '포르쉐', origin: 'imp' },
  { key: 'volvo', name: '볼보', origin: 'imp' },
  { key: 'lexus', name: '렉서스', origin: 'imp' },
  { key: 'landrover', name: '랜드로버', origin: 'imp' },
  { key: 'audi', name: '아우디', origin: 'imp' },
  { key: 'toyota', name: '도요타', origin: 'imp' },
  { key: 'cadillac', name: '캐딜락', origin: 'imp' },
  { key: 'honda', name: '혼다', origin: 'imp' },
  { key: 'ford', name: '포드', origin: 'imp' },
  { key: 'jeep', name: 'Jeep', origin: 'imp' },
  { key: 'mini', name: '미니', origin: 'imp' },
  { key: 'polestar', name: '폴스타', origin: 'imp' },
  { key: 'vw', name: '폭스바겐', origin: 'imp' },
]
export const ORIGINS = [{ key: 'dom', label: '국산차 제조사' }, { key: 'imp', label: '수입차 제조사' }]
export const carBrand = (key) => CAR_BRANDS.find((b) => b.key === key)

// fuel: gas | hev | ev  ·  price: 최저 트림 기준 차량가격(원)
// rent: false 면 렌트는 상담으로만 안내한다(전기차 등 렌터카 물량 미확보 케이스)
export const CAR_MODELS = [
  // ── 현대
  { id: 'palisade', brand: 'hyundai', name: '팰리세이드', seg: 'SUV', fuel: 'gas', price: 43830000 },
  { id: 'palisade-hev', brand: 'hyundai', name: '팰리세이드 하이브리드', seg: 'SUV', fuel: 'hev', price: 46200000 },
  { id: 'grandeur', brand: 'hyundai', name: '그랜저', seg: '세단', fuel: 'gas', price: 38900000 },
  { id: 'grandeur-hev', brand: 'hyundai', name: '그랜저 하이브리드', seg: '세단', fuel: 'hev', price: 43100000 },
  { id: 'santafe', brand: 'hyundai', name: '싼타페', seg: 'SUV', fuel: 'gas', price: 36500000 },
  { id: 'santafe-hev', brand: 'hyundai', name: '싼타페 하이브리드', seg: 'SUV', fuel: 'hev', price: 39800000 },
  { id: 'ioniq5', brand: 'hyundai', name: '아이오닉5', seg: 'SUV', fuel: 'ev', price: 47150000, rent: false },
  { id: 'ioniq6', brand: 'hyundai', name: '아이오닉6', seg: '세단', fuel: 'ev', price: 49700000, rent: false },
  { id: 'ioniq9', brand: 'hyundai', name: '아이오닉9', seg: 'SUV', fuel: 'ev', price: 67000000, rent: false },
  { id: 'tucson', brand: 'hyundai', name: '투싼', seg: 'SUV', fuel: 'gas', price: 29500000 },
  { id: 'tucson-hev', brand: 'hyundai', name: '투싼 하이브리드', seg: 'SUV', fuel: 'hev', price: 33400000 },
  { id: 'sonata', brand: 'hyundai', name: '쏘나타', seg: '세단', fuel: 'gas', price: 29300000 },
  { id: 'sonata-hev', brand: 'hyundai', name: '쏘나타 하이브리드', seg: '세단', fuel: 'hev', price: 33200000 },
  { id: 'kona', brand: 'hyundai', name: '코나', seg: 'SUV', fuel: 'gas', price: 25200000 },
  { id: 'kona-hev', brand: 'hyundai', name: '코나 하이브리드', seg: 'SUV', fuel: 'hev', price: 29100000 },
  { id: 'kona-ev', brand: 'hyundai', name: '코나 일렉트릭', seg: 'SUV', fuel: 'ev', price: 41900000, rent: false },
  { id: 'avante', brand: 'hyundai', name: '아반떼', seg: '세단', fuel: 'gas', price: 21400000 },
  { id: 'avante-hev', brand: 'hyundai', name: '아반떼 하이브리드', seg: '세단', fuel: 'hev', price: 25500000 },
  { id: 'staria', brand: 'hyundai', name: '스타리아', seg: 'MPV', fuel: 'gas', price: 28600000 },
  { id: 'staria-hev', brand: 'hyundai', name: '스타리아 하이브리드', seg: 'MPV', fuel: 'hev', price: 33900000 },
  // ── 제네시스
  { id: 'g80', brand: 'genesis', name: 'G80', seg: '세단', fuel: 'gas', price: 58500000, special: { badge: '특가판매', trim: '가솔린 2.5T' } },
  { id: 'gv80', brand: 'genesis', name: 'GV80', seg: 'SUV', fuel: 'gas', price: 71000000, special: { badge: '특가판매', trim: '2.5 가솔린 터보' } },
  { id: 'g90', brand: 'genesis', name: 'G90', seg: '세단', fuel: 'gas', price: 94000000 },
  { id: 'gv70', brand: 'genesis', name: 'GV70', seg: 'SUV', fuel: 'gas', price: 52700000 },
  // ── 기아
  { id: 'sorento', brand: 'kia', name: '쏘렌토', seg: 'SUV', fuel: 'gas', price: 36400000 },
  { id: 'carnival', brand: 'kia', name: '카니발', seg: 'MPV', fuel: 'gas', price: 36800000 },
  { id: 'k8', brand: 'kia', name: 'K8', seg: '세단', fuel: 'gas', price: 34600000 },
  { id: 'sportage', brand: 'kia', name: '스포티지', seg: 'SUV', fuel: 'gas', price: 28700000 },
  { id: 'ev6', brand: 'kia', name: 'EV6', seg: 'SUV', fuel: 'ev', price: 48600000, rent: false },
  // ── 쉐보레 · KGM · 르노
  { id: 'trailblazer', brand: 'chevrolet', name: '트레일블레이저', seg: 'SUV', fuel: 'gas', price: 25400000 },
  { id: 'trax', brand: 'chevrolet', name: '트랙스 크로스오버', seg: 'SUV', fuel: 'gas', price: 21500000 },
  { id: 'torres', brand: 'kgm', name: '토레스', seg: 'SUV', fuel: 'gas', price: 27600000 },
  { id: 'actyon', brand: 'kgm', name: '액티언', seg: 'SUV', fuel: 'gas', price: 29200000 },
  { id: 'grandkoleos', brand: 'renault', name: '그랑 콜레오스', seg: 'SUV', fuel: 'hev', price: 33500000 },
  // ── 수입
  { id: 'e-class', brand: 'benz', name: 'E-Class', seg: '세단', fuel: 'gas', price: 76000000 },
  { id: 's-class', brand: 'benz', name: 'S-Class', seg: '세단', fuel: 'gas', price: 156000000, special: { badge: '특가판매', trim: 'S350 d 4MATIC' } },
  { id: 'gle', brand: 'benz', name: 'GLE', seg: 'SUV', fuel: 'gas', price: 112000000 },
  { id: '5-series', brand: 'bmw', name: '5시리즈', seg: '세단', fuel: 'gas', price: 72500000 },
  { id: 'x5', brand: 'bmw', name: 'X5', seg: 'SUV', fuel: 'gas', price: 118000000 },
  { id: 'model-y', brand: 'tesla', name: 'Model Y', seg: 'SUV', fuel: 'ev', price: 52990000, rent: false },
  { id: 'model-3', brand: 'tesla', name: 'Model 3', seg: '세단', fuel: 'ev', price: 46990000, rent: false },
  { id: 'xc60', brand: 'volvo', name: 'XC60', seg: 'SUV', fuel: 'hev', price: 74600000 },
  { id: 'es300h', brand: 'lexus', name: 'ES 300h', seg: '세단', fuel: 'hev', price: 68900000 },
  { id: 'q5', brand: 'audi', name: 'Q5', seg: 'SUV', fuel: 'gas', price: 73800000 },
  { id: 'camry', brand: 'toyota', name: '캠리', seg: '세단', fuel: 'hev', price: 45600000 },
  { id: 'defender', brand: 'landrover', name: '디펜더', seg: 'SUV', fuel: 'gas', price: 98000000 },
  { id: 'cooper', brand: 'mini', name: '쿠퍼', seg: '해치백', fuel: 'gas', price: 41200000 },
  { id: 'polestar4', brand: 'polestar', name: '폴스타 4', seg: 'SUV', fuel: 'ev', price: 59000000, rent: false },
  { id: 'tiguan', brand: 'vw', name: '티구안', seg: 'SUV', fuel: 'gas', price: 47900000 },
  { id: 'macan', brand: 'porsche', name: '마칸', seg: 'SUV', fuel: 'gas', price: 94800000 },
  { id: 'wrangler', brand: 'jeep', name: '랭글러', seg: 'SUV', fuel: 'gas', price: 69900000 },
  { id: 'explorer', brand: 'ford', name: '익스플로러', seg: 'SUV', fuel: 'gas', price: 65900000 },
  { id: 'crv', brand: 'honda', name: 'CR-V', seg: 'SUV', fuel: 'hev', price: 48900000 },
  { id: 'xt5', brand: 'cadillac', name: 'XT5', seg: 'SUV', fuel: 'gas', price: 69800000 },
]
export const carModel = (id) => CAR_MODELS.find((m) => m.id === id)
export const modelsOf = (brandKey) => CAR_MODELS.filter((m) => m.brand === brandKey)

// ─── 트림 ────────────────────────────────────────────────────────────────
// 팰리세이드는 공개 견적의 실제 트림표. 나머지는 최저 트림가에 등급 배수를 적용해
// 3등급으로 생성한다(실표 수령 시 TRIMS 에 모델별로 채우면 그대로 우선한다).
export const TRIMS = {
  palisade: [
    { name: '가솔린 2.5 익스클루시브 9인승', price: 43830000 },
    { name: '가솔린 2.5 프레스티지 9인승', price: 49360000 },
    { name: '가솔린 2.5 캘리그래피 9인승', price: 55860000 },
    { name: '가솔린 2.5 익스클루시브 7인승', price: 45100000 },
    { name: '가솔린 2.5 프레스티지 7인승', price: 50930000 },
    { name: '가솔린 2.5 캘리그래피 7인승', price: 57870000 },
  ],
}
const GRADE = [{ suffix: '기본형', mult: 1 }, { suffix: '중급형', mult: 1.13 }, { suffix: '최상급형', mult: 1.27 }]
export function trimsOf(modelId) {
  if (TRIMS[modelId]) return TRIMS[modelId]
  const m = carModel(modelId)
  if (!m) return []
  return GRADE.map((g) => ({ name: `${m.name} ${g.suffix}`, price: Math.round((m.price * g.mult) / 10000) * 10000 }))
}

// ─── 선택옵션 ─────────────────────────────────────────────────────────────
// 팰리세이드는 공개 견적의 실제 옵션표. 나머지는 세그먼트 공통 옵션.
export const OPTIONS = {
  palisade: [
    { id: '4wd', name: '4WD', price: 2280000 },
    { id: 'smartsense', name: '현대스마트센스', price: 1330000 },
    { id: 'sunroof', name: '듀얼 와이드 선루프', price: 850000 },
    { id: 'paint', name: '크리미 화이트 펄 외장컬러', price: 90000 },
    { id: 'comfort', name: '컴포트', price: 1330000 },
    { id: 'cam2', name: '빌트인 캠 2 Plus, 증강현실 내비게이션', price: 660000 },
    { id: 'sidestep', name: 'HGA 사이드 스텝', price: 430000 },
    { id: 'mat1', name: 'HGA 프로텍션 매트 패키지 I', price: 240000 },
    { id: 'mat2', name: 'HGA 프로텍션 매트 패키지 II', price: 160000 },
    { id: 'airpure', name: 'HGA 빌트인 공기청정기', price: 520000 },
  ],
}
const COMMON_OPTIONS = [
  { id: 'sunroof', name: '파노라마 선루프', price: 1200000 },
  { id: 'adas', name: '주행보조 패키지', price: 1500000 },
  { id: 'paint', name: '유광 외장컬러', price: 900000 },
  { id: 'seat', name: '통풍·열선 시트 패키지', price: 800000 },
  { id: 'nav', name: '빌트인 내비·후방카메라', price: 700000 },
  { id: 'mat', name: '프로텍션 매트 패키지', price: 250000 },
]
export const optionsOf = (modelId) => OPTIONS[modelId] ?? COMMON_OPTIONS

// ─── 계약 조건 ────────────────────────────────────────────────────────────
export const DOWN_RATES = [0, 0.1, 0.2, 0.3, 0.4, 0.5]   // 초기부담금
export const TERMS = [36, 48, 60]                          // 계약기간(개월)
export const BASIS = [
  { key: 'prepay', label: '선납금 기준', desc: '미리 낸 만큼 월 납입금이 크게 내려가요 (반환 없음)' },
  { key: 'deposit', label: '보증금 기준', desc: '계약 종료 시 돌려받아요 (월 인하 폭은 선납금보다 작아요)' },
]

// 잔존가치(기간별) · 리스 금리 · 렌트 월 유지비율 · 보증금의 월 인하 효율
export const RESIDUAL = { 36: 0.55, 48: 0.46, 60: 0.36 }
export const LEASE_APR = 0.039
export const MAINT_RATE = 0.00193 // 렌트에만 포함: 보험료 + 자동차세 등 월 환산
export const DEPOSIT_EFF = 0.55   // 보증금은 반환되므로 선납금 대비 이만큼만 월 납입금을 낮춘다
export const ACQ_RATE = 0.07      // 취등록세·공채 — 렌트는 월 요금에 녹아 있고, 리스는 별도 안내
// 초기부담금이 커지면 (초기부담 + 잔존가치)가 차량가를 넘어 월 납입금이 0 이하가 된다.
// 실제 상품에도 선납금 상한이 있다 — 총차량가격의 이만큼은 반드시 월 납입으로 회수한다.
export const MIN_AMORT = 0.05

const round100 = (n) => Math.round(n / 100) * 100

/**
 * modelId · trimName(미지정 시 최저 트림) · options(id 배열)
 * down: DOWN_RATES · term: TERMS · basis: 'prepay' | 'deposit'
 */
export function calcCar({ modelId = 'palisade', trimName = null, options = [], down = 0.3, term = 36, basis = 'prepay' } = {}) {
  const model = carModel(modelId) ?? CAR_MODELS[0]
  const trims = trimsOf(model.id)
  const trim = trims.find((t) => t.name === trimName) ?? trims[0]
  const pool = optionsOf(model.id)
  const picked = pool.filter((o) => options.includes(o.id))
  const optionPrice = picked.reduce((s, o) => s + o.price, 0)

  const carPrice = trim.price                 // 실제차량가격
  const total = carPrice + optionPrice        // 총차량가격
  const upfront = Math.round(total * down)    // 초기부담금(선납금 또는 보증금)
  const residual = total * (RESIDUAL[term] ?? RESIDUAL[36])
  const rawEff = basis === 'deposit' ? upfront * DEPOSIT_EFF : upfront
  // 상한: 초기부담이 이보다 크면 초과분은 월 납입금을 더 낮추지 못하고 계약 종료 정산에 반영된다
  const maxEff = Math.max(0, total - residual - total * MIN_AMORT)
  const effUpfront = Math.min(rawEff, maxEff)
  const upfrontCapped = rawEff > maxEff
  // 감가분(총차량가격 − 초기부담 − 잔존가치)에 약정기간 이자를 얹어 월로 나눈다
  const financed = Math.max(0, total - effUpfront - residual)
  const lease = round100((financed * (1 + LEASE_APR * (term / 12))) / term)
  // 렌트는 취등록세·자동차세·보험료가 월 요금에 포함된다
  const maint = round100(total * MAINT_RATE)
  const rent = model.rent === false ? null : lease + maint

  return {
    model, trim, trims, pool, picked,
    carPrice, optionPrice, total, down, term, basis,
    upfront, upfrontCapped, deposit: basis === 'deposit' ? upfront : 0, prepay: basis === 'prepay' ? upfront : 0,
    residual: Math.round(residual), financed: Math.round(financed),
    lease, rent, maint,
    acquisition: Math.round(total * ACQ_RATE),
  }
}

// 목록 카드용 — 최저 트림·옵션 없음·30%·36개월 기준 "월 X만원 ~"
export function carFrom(modelId) {
  const q = calcCar({ modelId, down: 0.3, term: 36, basis: 'prepay' })
  return { lease: q.lease, rent: q.rent, total: q.total, trim: q.trim }
}
export const manwon = (n) => Math.floor(n / 10000) // 만원 단위 절사 — "월 20만원 ~"

// 금주의 특가차량 — special 이 달린 모델
export const SPECIALS = CAR_MODELS.filter((m) => m.special).map((m) => ({ model: m, ...carFrom(m.id) }))

// 비교 대상 캐피탈사 — "모든 리스·렌트사 견적을 비교 후 최저가 선정"의 근거 표시
export const CAPITALS = ['현대캐피탈', '롯데캐피탈', '메리츠캐피탈', '아주캐피탈', 'JB우리캐피탈', 'KB캐피탈', '하나캐피탈', 'BNK캐피탈', 'NH농협캐피탈', 'ORIX', '효성캐피탈']
export const EXTRA_DC = '3~5%'

// ─── 차량 이미지 ──────────────────────────────────────────────────────────
// 우선순위: ① 자체 호스팅(public/assets/cars/{id}.jpg) ② 없으면 SVG 실루엣.
// 제휴사(에이씨렌트카) 이미지는 핫링크하지 않는다 — 상대 서버 대역폭을 쓰고,
// 그쪽이 경로를 바꾸거나 잠깐 죽으면 우리 상품 목록이 통째로 빈다.
// 대신 scripts/fetch-car-images.mjs 로 빌드 시점에 내려받아 자체 호스팅한다.
// PARTNER_IMAGES 는 "우리 차종 id → 제휴사 이미지 경로" 매핑이다. 비어 있으면
// 전부 SVG 폴백이라 화면은 정상 동작한다 — 매핑을 채운 만큼만 사진으로 바뀐다.
export const PARTNER_BASE = 'https://acrentcar.com/data/car'
// scripts/map-car-images.mjs 가 아래 두 마커 사이를 통째로 다시 쓴다.
/* PARTNER_IMAGES:START */
export const PARTNER_IMAGES = {
  'avante': '00000000582_detail_1',
  'avante-hev': '00000000583_detail_1',
  'grandeur': '00000000498_detail_1',
  'grandeur-hev': '00000000503_detail_1',
  'ioniq5': '00000000558_detail_1',
  'ioniq6': '00000000618_detail_1',
  'ioniq9': '00000000667_detail_1',
  'kona': '00000000429_detail_1',
  'kona-ev': '00000000637_detail_1',
  'kona-hev': '00000000485_detail_1',
  'palisade': '00000000461_detail_1',
  'palisade-hev': '00000000665_detail_1',
  'santafe': '00000000447_detail_1',
  'santafe-hev': '00000000562_detail_1',
  'sonata': '00000000474_detail_1',
  'sonata-hev': '00000000223_detail_1',
  'staria': '00000000554_detail_1',
  'staria-hev': '00000000653_detail_1',
  'tucson': '00000000537_detail_1',
  'tucson-hev': '00000000539_detail_1',
}
/* PARTNER_IMAGES:END */
// 자동 매칭이 틀렸거나 못 잡은 차종만 여기서 바로잡는다 — 스크립트가 건드리지 않는다.
export const MANUAL_IMAGES = {}
export const carImagePath = (id) => `/assets/cars/${id}.jpg`
export const imagePathOf = (id) => MANUAL_IMAGES[id] ?? PARTNER_IMAGES[id] ?? null
export const partnerImageUrl = (id) => (imagePathOf(id) ? `${PARTNER_BASE}/${imagePathOf(id)}` : null)
// 자체 호스팅본이 받아졌는지는 빌드 산출물에만 있으므로, 화면은 <img onError> 로 SVG 폴백한다.
export const hasPartnerImage = (id) => Boolean(imagePathOf(id))
