// ─── 휴대폰 견적 엔진 (주다식: 단말 할부금 A + 요금 B = 월 납부 A+B) ──
// 할부수수료: 원리금균등 연 5.9% (레퍼런스 검증 — 할부원금 2,652,600 · 24개월 → 월 117,450원)

export const ANNUAL_RATE = 0.059

export const JOIN_TYPES = [
  { key: 'mnp', label: '번호이동' },
  { key: 'chg', label: '기기변경' },
  { key: 'new', label: '010신규' },
]

// 브랜드·용량·색상은 온라인구매(/phone/shop) 브라우저용. price 는 기본 용량 출고가(구 계산기 호환),
// storages 에 용량별 출고가를 따로 둔다. 지원금은 가입유형별(번호이동·기변·신규) 기준값 — 통신사 보정은 CARRIER_SUPPORT_ADJ.
// ※ 출고가·지원금은 대표값. 통신사 공시 갱신 시 이 표만 바꾸면 계산기·샵·상세·GNB 전부에 반영된다.
export const PHONE_BRANDS = [
  { key: 'samsung', label: '삼성' },
  { key: 'apple', label: '애플' },
]
export const STORAGES = ['128GB', '256GB', '512GB', '1TB']

export const PHONE_DEVICES = [
  { id: 'fold8', brand: 'samsung', name: '갤럭시 Z 폴드8 1TB', short: 'Z 폴드8', price: 3152600, support: { mnp: 500000, chg: 400000, new: 450000 }, tag: '최신 폴더블', spec: '스냅드래곤 8 Elite 5세대 · 7.6" · 16GB · 4,800mAh',
    storages: [{ key: '256GB', price: 2577300 }, { key: '512GB', price: 2745600 }, { key: '1TB', price: 3152600 }],
    colors: [{ name: '제트블랙', hex: '#2B2B2E' }, { name: '실버섀도', hex: '#C9CBD1' }, { name: '블루섀도', hex: '#5D7AA8' }] },
  { id: 'flip8', brand: 'samsung', name: '갤럭시 Z 플립8 256GB', short: 'Z 플립8', price: 1485000, support: { mnp: 450000, chg: 380000, new: 420000 }, tag: '폴더블', spec: '3.4" 외부 화면 · 6.7" · 12GB',
    storages: [{ key: '256GB', price: 1485000 }, { key: '512GB', price: 1628000 }],
    colors: [{ name: '코랄레드', hex: '#D9534F' }, { name: '제트블랙', hex: '#2B2B2E' }, { name: '블루섀도', hex: '#5D7AA8' }] },
  { id: 's26u', brand: 'samsung', name: '갤럭시 S26 울트라 512GB', short: 'S26 울트라', price: 1969000, support: { mnp: 450000, chg: 350000, new: 400000 }, tag: '플래그십', spec: '2억 화소 카메라 · 6.9" · 12GB',
    storages: [{ key: '256GB', price: 1826000 }, { key: '512GB', price: 1969000 }, { key: '1TB', price: 2255000 }],
    colors: [{ name: '티타늄블랙', hex: '#2E2E33' }, { name: '티타늄실버', hex: '#BFC3CA' }, { name: '티타늄네이비', hex: '#3F4C6B' }] },
  { id: 's26', brand: 'samsung', name: '갤럭시 S26 256GB', short: 'S26', price: 1155000, support: { mnp: 380000, chg: 300000, new: 340000 }, tag: '인기', spec: '6.2" · 12GB · 콤팩트 플래그십',
    storages: [{ key: '256GB', price: 1155000 }, { key: '512GB', price: 1298000 }],
    colors: [{ name: '아이시블루', hex: '#A9C6E8' }, { name: '네이비', hex: '#2F3A5A' }, { name: '민트', hex: '#9ED9C5' }] },
  { id: 'a56', brand: 'samsung', name: '갤럭시 A56 128GB', short: 'A56', price: 598400, support: { mnp: 400000, chg: 350000, new: 380000 }, tag: '가성비 0원폰', spec: '5G · 6.7" · 대화면 실속형',
    storages: [{ key: '128GB', price: 598400 }, { key: '256GB', price: 648400 }],
    colors: [{ name: '어썸그라파이트', hex: '#3A3A3F' }, { name: '어썸라이트그레이', hex: '#D7D8DC' }, { name: '어썸올리브', hex: '#8A9A6B' }] },
  { id: 'ip17p', brand: 'apple', name: '아이폰 17 프로 256GB', short: '아이폰 17 프로', price: 1750000, support: { mnp: 280000, chg: 220000, new: 250000 }, tag: '인기', spec: 'A19 Pro · 6.3" ProMotion',
    storages: [{ key: '256GB', price: 1750000 }, { key: '512GB', price: 2050000 }, { key: '1TB', price: 2350000 }],
    colors: [{ name: '코스믹오렌지', hex: '#E2733A' }, { name: '딥블루', hex: '#2E4A7A' }, { name: '실버', hex: '#D9D9DE' }] },
  { id: 'ip17pm', brand: 'apple', name: '아이폰 17 프로 맥스 256GB', short: '아이폰 17 프로 맥스', price: 1990000, support: { mnp: 280000, chg: 220000, new: 250000 }, tag: '최대 화면', spec: 'A19 Pro · 6.9" · 최장 배터리',
    storages: [{ key: '256GB', price: 1990000 }, { key: '512GB', price: 2290000 }, { key: '1TB', price: 2590000 }],
    colors: [{ name: '코스믹오렌지', hex: '#E2733A' }, { name: '딥블루', hex: '#2E4A7A' }, { name: '실버', hex: '#D9D9DE' }] },
  { id: 'ip17', brand: 'apple', name: '아이폰 17 256GB', short: '아이폰 17', price: 1290000, support: { mnp: 300000, chg: 240000, new: 270000 }, tag: '표준', spec: 'A19 · 6.3" · 120Hz',
    storages: [{ key: '256GB', price: 1290000 }, { key: '512GB', price: 1590000 }],
    colors: [{ name: '라벤더', hex: '#B9A7D6' }, { name: '세이지', hex: '#9BB59C' }, { name: '블랙', hex: '#2B2B2E' }, { name: '화이트', hex: '#EDEDEF' }] },
]
export const phoneDevice = (id) => PHONE_DEVICES.find((d) => d.id === id) ?? PHONE_DEVICES[0]

// 통신사별 지원금 보정(대표값) — 온보딩 태그와 같은 방향: LG U+ '#지원금강세', KT 보수적.
export const MNO = ['SKT', 'KT', 'LG U+']
export const CARRIER_SUPPORT_ADJ = { SKT: 1.0, KT: 0.95, 'LG U+': 1.08 }

// 파손보험 — 가입 시 1회 부담금. 모두온 전용 혜택으로 면제(아정당 동일 구조).
export const INSURANCE = { once: 50000, label: '파손보험', waivedLabel: '모두온 전용 혜택 · 무료' }
// 부가서비스(선택) — 기본 꺼짐. 켜면 요금제에 더해진다.
export const ADDONS = [{ id: 'care', name: '안심케어 부가서비스', monthly: 3500, keep: '3개월 유지' }]

export const PHONE_PLANS = [
  { id: 'choice110', name: '초이스110 폰케어', monthly: 110000, desc: '무제한 · 폰케어 보험 포함' },
  { id: 'choice90', name: '초이스90', monthly: 90000, desc: '데이터 완전 무제한' },
  { id: 'basic69', name: '5G 베이직 69', monthly: 69000, desc: '110GB + 테더링 40GB' },
  { id: 'slim55', name: '5G 슬림 55', monthly: 55000, desc: '35GB + 밀리언트 1Mbps' },
]

export const INSTALLMENT_MONTHS = [
  { key: 0, label: '일시불' },
  { key: 12, label: '12개월' },
  { key: 24, label: '24개월' },
  { key: 36, label: '36개월' },
]

// 원리금균등 월 상환액
function pmt(principal, months) {
  if (months === 0 || principal <= 0) return { monthly: 0, interest: 0 }
  const r = ANNUAL_RATE / 12
  const m = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  const monthly = Math.round(m / 10) * 10
  return { monthly, interest: Math.max(0, monthly * months - principal) }
}

// ─── 가족결합(프리미엄) — 인터넷 결합 시 기본료 추가 할인 ──────────────
// 조건: 인터넷 결합 + 월정액 77,000원 이상 요금제 + 모바일 2회선 이상.
// 선택약정 25%와 별개로 기본료에 추가 적용된다(둘 다 기본료 기준 할인).
export const BUNDLE = { rate: 0.25, minPlan: 77000, minLines: 2, label: '프리미엄 가족결합' }
export const bundleEligible = (plan) => (plan?.monthly ?? 0) >= BUNDLE.minPlan

/**
 * method: 'support'(공시지원금) | 'select'(선택약정 25%)
 * extra15: 매장 추가지원금(공시의 15% 법정 한도) 적용 여부
 * bundle: 가족결합(인터넷+2회선) 적용 여부 — 조건 미충족 요금제면 무시된다
 */
export function calcPhoneQuote({ deviceId = 'fold8', planId = 'choice110', join = 'mnp', method = 'support', months = 24, extra15 = true, bundle = false, storage = null, carrier = null, insurance = false, addon = false } = {}) {
  const device = phoneDevice(deviceId)
  const plan = PHONE_PLANS.find((p) => p.id === planId) ?? PHONE_PLANS[0]
  // 용량이 지정되면 그 출고가, 아니면 기본(price). 통신사가 지정되면 지원금 보정.
  const price = device.storages?.find((s) => s.key === storage)?.price ?? device.price
  const adj = carrier ? (CARRIER_SUPPORT_ADJ[carrier] ?? 1) : 1
  const baseSupport = Math.floor(((device.support[join] ?? 0) * adj) / 1000) * 1000

  const publicSupport = method === 'support' ? baseSupport : 0
  const extraSupport = method === 'support' && extra15 ? Math.floor(baseSupport * 0.15 / 10) * 10 : 0
  const principal = Math.max(0, price - publicSupport - extraSupport)

  const { monthly: deviceMonthly, interest } = pmt(principal, months)
  const planDiscount = method === 'select' ? Math.round(plan.monthly * 0.25) : 0
  const bundleOn = bundle && bundleEligible(plan)
  const bundleDiscount = bundleOn ? Math.round(plan.monthly * BUNDLE.rate) : 0
  const planMonthly = Math.max(0, plan.monthly - planDiscount - bundleDiscount)
  const upfront = months === 0 ? principal : 0
  const addonFee = addon ? ADDONS[0].monthly : 0
  const total = deviceMonthly + planMonthly + addonFee

  return {
    device, plan, join, method, months, publicSupport, extraSupport,
    principal, deviceMonthly, interest, planMonthly, planDiscount,
    bundleOn, bundleDiscount, upfront, total,
    price, storage: storage ?? device.storages?.[0]?.key ?? null, carrier,
    insurance, insuranceOnce: insurance ? INSURANCE.once : 0, insuranceWaived: insurance, // 면제 → 실부담 0
    addonFee,
  }
}

// ─── 온라인구매 AI 추천 — 현재 통신사 기준 "번호이동 vs 기기변경" 중 싼 쪽 ──────
// 3사 각각에 대해: 지금 쓰는 통신사면 기기변경, 아니면 번호이동으로 견적을 내고 월 납부금 최저를 고른다.
// 알뜰폰·미선택이면 3사 모두 번호이동 후보. 결과에는 "지금 통신사에서 기변" 대안과 차액도 담아
// 왜 그 추천인지 화면이 설명할 수 있게 한다.
export function bestOffer({ deviceId, cur = '', planId = 'choice90', months = 24, storage = null }) {
  const offers = MNO.map((carrier) => {
    const join = cur === carrier ? 'chg' : 'mnp'
    const q = calcPhoneQuote({ deviceId, planId, join, method: 'support', months, storage, carrier })
    return { carrier, join, total: q.total, support: q.publicSupport + q.extraSupport, q }
  }).sort((a, b) => a.total - b.total)
  const best = offers[0]
  const stay = offers.find((o) => o.join === 'chg') ?? null
  return { best, stay, offers, saving: stay ? Math.max(0, stay.total - best.total) : 0 }
}

// 요금제 전체 비교 — 같은 단말·조건에서 요금제만 바꿔 A+B를 한 줄씩. 최저가에 표식.
export function planMatrix({ deviceId, join, method, months, extra15, bundle }) {
  const rows = PHONE_PLANS.map((p) => {
    const q = calcPhoneQuote({ deviceId, planId: p.id, join, method, months, extra15, bundle })
    return {
      id: p.id, name: p.name, base: p.monthly,
      discount: q.planDiscount + q.bundleDiscount,
      planMonthly: q.planMonthly, deviceMonthly: q.deviceMonthly,
      principal: q.principal, support: q.publicSupport + q.extraSupport,
      total: q.total,
    }
  })
  const min = Math.min(...rows.map((r) => r.total))
  return rows.map((r) => ({ ...r, cheapest: r.total === min }))
}

// 단말지원 vs 선택약정 24개월 총액 비교 → 유리한 쪽 안내
export function compareMethods({ deviceId, planId, join, months = 24, extra15 = true }) {
  const m = months === 0 ? 24 : months
  const a = calcPhoneQuote({ deviceId, planId, join, method: 'support', months: m, extra15 })
  const b = calcPhoneQuote({ deviceId, planId, join, method: 'select', months: m, extra15 })
  const tcoA = a.principal + a.interest + a.plan.monthly * m
  const tcoB = b.principal + b.interest + (b.plan.monthly - b.planDiscount) * m
  const diff = Math.abs(tcoA - tcoB)
  return { better: tcoA <= tcoB ? 'support' : 'select', diff, months: m }
}
