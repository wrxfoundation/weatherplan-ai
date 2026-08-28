// ─── 휴대폰 견적 엔진 (주다식: 단말 할부금 A + 요금 B = 월 납부 A+B) ──
// 할부수수료: 원리금균등 연 5.9% (레퍼런스 검증 — 할부원금 2,652,600 · 24개월 → 월 117,450원)

export const ANNUAL_RATE = 0.059

export const JOIN_TYPES = [
  { key: 'mnp', label: '번호이동' },
  { key: 'chg', label: '기기변경' },
  { key: 'new', label: '010신규' },
]

export const PHONE_DEVICES = [
  { id: 'fold8', name: '갤럭시 Z 폴드8 1TB', short: 'Z 폴드8', price: 3152600, support: { mnp: 500000, chg: 400000, new: 450000 }, tag: '최신 폴더블', spec: '스냅드래곤 8 Elite 5세대 · 7.6" · 16GB · 4,800mAh' },
  { id: 's26u', name: '갤럭시 S26 울트라 512GB', short: 'S26 울트라', price: 1969000, support: { mnp: 450000, chg: 350000, new: 400000 }, tag: '플래그십', spec: '2억 화소 카메라 · 6.9" · 12GB' },
  { id: 'ip17', name: '아이폰 17 프로 256GB', short: '아이폰 17 프로', price: 1750000, support: { mnp: 280000, chg: 220000, new: 250000 }, tag: '인기', spec: 'A19 Pro · 6.3" ProMotion' },
  { id: 'a56', name: '갤럭시 A56 128GB', short: 'A56', price: 598400, support: { mnp: 400000, chg: 350000, new: 380000 }, tag: '가성비 0원폰', spec: '5G · 6.7" · 대화면 실속형' },
]

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
export function calcPhoneQuote({ deviceId = 'fold8', planId = 'choice110', join = 'mnp', method = 'support', months = 24, extra15 = true, bundle = false } = {}) {
  const device = PHONE_DEVICES.find((d) => d.id === deviceId) ?? PHONE_DEVICES[0]
  const plan = PHONE_PLANS.find((p) => p.id === planId) ?? PHONE_PLANS[0]

  const publicSupport = method === 'support' ? device.support[join] ?? 0 : 0
  const extraSupport = method === 'support' && extra15 ? Math.floor((device.support[join] ?? 0) * 0.15 / 10) * 10 : 0
  const principal = Math.max(0, device.price - publicSupport - extraSupport)

  const { monthly: deviceMonthly, interest } = pmt(principal, months)
  const planDiscount = method === 'select' ? Math.round(plan.monthly * 0.25) : 0
  const bundleOn = bundle && bundleEligible(plan)
  const bundleDiscount = bundleOn ? Math.round(plan.monthly * BUNDLE.rate) : 0
  const planMonthly = Math.max(0, plan.monthly - planDiscount - bundleDiscount)
  const upfront = months === 0 ? principal : 0
  const total = deviceMonthly + planMonthly

  return {
    device, plan, join, method, months, publicSupport, extraSupport,
    principal, deviceMonthly, interest, planMonthly, planDiscount,
    bundleOn, bundleDiscount, upfront, total,
  }
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
