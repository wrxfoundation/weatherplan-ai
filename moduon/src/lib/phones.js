// ─── 휴대폰 견적 엔진 (주다식: 단말 할부금 A + 요금 B = 월 납부 A+B) ──
// 할부수수료: 원리금균등 연 5.9% (레퍼런스 검증 — 할부원금 2,652,600 · 24개월 → 월 117,450원)

export const ANNUAL_RATE = 0.059

import { PRICE_CARD, priceDetail, selfSupport, SELF_MARGIN_DEFAULT } from './ratecard'
import { specLine } from './phoneSpecs'

export const JOIN_TYPES = [
  { key: 'mnp', label: '번호이동' },
  { key: 'chg', label: '기기변경' },
  { key: 'new', label: '010신규' },
]

// 브랜드·용량·색상은 온라인구매(/phone/shop) 브라우저용. price 는 기본 용량 출고가(구 계산기 호환),
// storages 에 용량별 출고가를 따로 둔다. 지원금은 가입유형별(번호이동·기변·신규) 기준값 — 통신사 보정은 CARRIER_SUPPORT_ADJ.
// ※ 출고가는 제조사 국내 출고가(2026-09-28 확인 — 폴드8·플립8 2026-07 발표, S26 시리즈 2026-02 발표, 아이폰 17 2025-09 발표).
//   근거는 docs/PHONE_SPECS.md. 지원금은 대표값. 통신사 공시 갱신 시 이 표만 바꾸면 계산기·샵·상세·GNB 전부에 반영된다.
//   (2026-09-28 교정: 폴드8 256·512GB 에 폴드8 '울트라' 출고가가, S26·플립8 에 전작 출고가가 들어가 있었다)
// 설명(사양·특징·구성품)은 phoneSpecs.js — spec 한 줄 요약도 거기서 가져온다.
export const PHONE_BRANDS = [
  { key: 'samsung', label: '삼성' },
  { key: 'apple', label: '애플' },
]
export const STORAGES = ['128GB', '256GB', '512GB', '1TB']

export const PHONE_DEVICES = [
  { id: 'fold8', brand: 'samsung', name: '갤럭시 Z 폴드8 256GB', short: 'Z 폴드8', price: 2278100, support: { mnp: 500000, chg: 400000, new: 450000 }, tag: '최신 폴더블', spec: specLine('fold8'),
    storages: [{ key: '256GB', price: 2278100 }, { key: '512GB', price: 2531100 }, { key: '1TB', price: 3152600 }],
    colors: [{ name: '라벤더', hex: '#CFC6E4' }, { name: '그라파이트', hex: '#5B5C60' }, { name: '크림', hex: '#EEEAE2' }] },
  { id: 'flip8', brand: 'samsung', name: '갤럭시 Z 플립8 256GB', short: 'Z 플립8', price: 1683000, support: { mnp: 450000, chg: 380000, new: 420000 }, tag: '폴더블', spec: specLine('flip8'),
    storages: [{ key: '256GB', price: 1683000 }, { key: '512GB', price: 1936000 }],
    colors: [{ name: '핑크', hex: '#F1C9D3' }, { name: '그라파이트', hex: '#5B5C60' }, { name: '크림', hex: '#EEEAE2' }] },
  { id: 's26u', brand: 'samsung', name: '갤럭시 S26 울트라 256GB', short: 'S26 울트라', price: 1797400, support: { mnp: 450000, chg: 350000, new: 400000 }, tag: '플래그십', spec: specLine('s26u'),
    storages: [{ key: '256GB', price: 1797400 }, { key: '512GB', price: 2050400 }, { key: '1TB', price: 2545400 }],
    colors: [{ name: '코발트 바이올렛', hex: '#6B5E9C' }, { name: '블랙', hex: '#2B2B2E' }, { name: '화이트', hex: '#F1F1F3' }, { name: '스카이 블루', hex: '#A9C8E6' }] },
  { id: 's26', brand: 'samsung', name: '갤럭시 S26 256GB', short: 'S26', price: 1254000, support: { mnp: 380000, chg: 300000, new: 340000 }, tag: '인기', spec: specLine('s26'),
    storages: [{ key: '256GB', price: 1254000 }, { key: '512GB', price: 1507000 }],
    colors: [{ name: '코발트 바이올렛', hex: '#6B5E9C' }, { name: '스카이 블루', hex: '#A9C8E6' }, { name: '블랙', hex: '#2B2B2E' }, { name: '화이트', hex: '#F1F1F3' }] },
  { id: 'a56', brand: 'samsung', name: '갤럭시 A56 128GB', short: 'A56', price: 598400, support: { mnp: 400000, chg: 350000, new: 380000 }, tag: '가성비 0원폰', spec: specLine('a56'),
    storages: [{ key: '128GB', price: 598400 }, { key: '256GB', price: 648400 }],
    colors: [{ name: '어썸그라파이트', hex: '#3A3A3F' }, { name: '어썸라이트그레이', hex: '#D7D8DC' }, { name: '어썸올리브', hex: '#8A9A6B' }] },
  { id: 'ip17p', brand: 'apple', name: '아이폰 17 프로 256GB', short: '아이폰 17 프로', price: 1790000, support: { mnp: 280000, chg: 220000, new: 250000 }, tag: '인기', spec: specLine('ip17p'),
    storages: [{ key: '256GB', price: 1790000 }, { key: '512GB', price: 2090000 }, { key: '1TB', price: 2390000 }],
    colors: [{ name: '코스믹 오렌지', hex: '#E2733A' }, { name: '딥 블루', hex: '#2E4A7A' }, { name: '실버', hex: '#D9D9DE' }] },
  { id: 'ip17pm', brand: 'apple', name: '아이폰 17 프로 맥스 256GB', short: '아이폰 17 프로 맥스', price: 1990000, support: { mnp: 280000, chg: 220000, new: 250000 }, tag: '최대 화면', spec: specLine('ip17pm'),
    storages: [{ key: '256GB', price: 1990000 }, { key: '512GB', price: 2290000 }, { key: '1TB', price: 2590000 }],
    colors: [{ name: '코스믹 오렌지', hex: '#E2733A' }, { name: '딥 블루', hex: '#2E4A7A' }, { name: '실버', hex: '#D9D9DE' }] },
  // 2026-09 애플 국내 가격 인상(256GB 1,287,000 → 1,452,000 · 512GB 1,584,000 → 1,760,000) — KT 공시변동(09-22) '아이폰 17 (NEW)' 와 같은 값
  { id: 'ip17', brand: 'apple', name: '아이폰 17 256GB', short: '아이폰 17', price: 1452000, support: { mnp: 300000, chg: 240000, new: 270000 }, tag: '표준', spec: specLine('ip17'),
    supportBy: { KT: { mnp: 500000, chg: 450000, new: 450000, from: '2026-09-22', src: 'KT 공시변동(제로노트 주요 변동사항 2026-09-22)' } },
    storages: [{ key: '256GB', price: 1452000 }, { key: '512GB', price: 1760000 }],
    colors: [{ name: '라벤더', hex: '#B9A7D6' }, { name: '미스트 블루', hex: '#A7BCD3' }, { name: '세이지', hex: '#9BB59C' }, { name: '블랙', hex: '#2B2B2E' }, { name: '화이트', hex: '#EDEDEF' }] },
]
export const phoneDevice = (id) => PHONE_DEVICES.find((d) => d.id === id) ?? PHONE_DEVICES[0]
// 이름의 기본 용량 꼬리('… 256GB')를 떼고 고른 용량을 붙인 표시 이름 — 512GB 를 골랐는데 견적에 256GB 로 찍히지 않게
export const deviceTitle = (device, storage) => `${device.name.replace(/\s*\d+(GB|TB)$/, '')}${storage ? ` ${storage}` : ''}`

// 통신사별 지원금 보정(대표값) — 온보딩 태그와 같은 방향: LG U+ '#지원금강세', KT 보수적.
export const MNO = ['SKT', 'KT', 'LG U+']
export const CARRIER_SUPPORT_ADJ = { SKT: 1.0, KT: 0.95, 'LG U+': 1.08 }

// 파손보험 — 가입 시 1회 부담금. 모두온 전용 혜택으로 면제(아정당 동일 구조).
export const INSURANCE = { once: 50000, label: '파손보험', waivedLabel: '모두온 전용 혜택 · 무료' }
// 부가서비스(선택) — 기본 꺼짐. 켜면 요금제에 더해진다.
export const ADDONS = [{ id: 'care', name: '안심케어 부가서비스', monthly: 3500, keep: '3개월 유지' }]

// 요금제 목록은 가격표가 정한다 — 표에 열이 없는 요금제를 화면에서 고를 수 있으면 안 된다.
// 가격표(ratecard.js PRICE_CARD)를 갈아끼우면 이 목록도 같이 바뀐다.
export const PHONE_PLANS = PRICE_CARD.plans.map((p) => ({
  id: p.key,
  name: p.sub ? `${p.name} ${p.sub}` : p.name,
  monthly: p.monthly,
  desc: p.desc,
  assumed: p.assumed === true, // 월정액이 단가표에 없어 임시로 채운 값
}))

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
// policyMargin 을 숫자로 주면 '셀프개통 모드' 다 — 추가지원금을 공시의 15% 로 잡는 대신
// 정책 단가표(ratecard.js)의 리베이트에서 회사 고정 마진만 떼고 전부 고객 지원금으로 돌린다.
// 두 방식을 겹쳐 쓰지 않는다(이중 계상 방지). null 이면 기존 15% 규칙 그대로.
export function calcPhoneQuote({ deviceId = 'fold8', planId = 'choice110', join = 'mnp', method = 'support', months = 24, extra15 = true, bundle = false, storage = null, carrier = null, insurance = false, addon = false, policyMargin = null } = {}) {
  const device = phoneDevice(deviceId)
  const plan = PHONE_PLANS.find((p) => p.id === planId) ?? PHONE_PLANS[0]
  // 용량이 지정되면 그 용량, 아니면 첫 용량. 화면에 찍는 용량과 출고가를 반드시 같은 항목에서 꺼낸다 —
  // 예전엔 라벨은 storages[0](256GB), 가격은 device.price(1TB)라 폴드8 이 '256GB · 출고가 315만'으로 떴다.
  const st = device.storages?.find((s) => s.key === storage) ?? device.storages?.[0] ?? null
  const price = st?.price ?? device.price
  const adj = carrier ? (CARRIER_SUPPORT_ADJ[carrier] ?? 1) : 1
  // 통신사가 공시한 공통지원금(공시변동으로 받은 확정값)이 있으면 그 값 — 없으면 대표값 × 통신사 보정(추정)
  const fixed = carrier ? device.supportBy?.[carrier]?.[join] : undefined
  const baseSupport = fixed ?? Math.floor(((device.support[join] ?? 0) * adj) / 1000) * 1000

  // 가격표에 값이 있으면 그 값이 곧 할부원금이다 — 지원금을 따로 빼지 않는다(마진은 가격에 이미 반영).
  // 화면의 지원금 줄은 표시용으로 출고가 − 판매가 를 역산해 채운다(출고가 − 지원금 = 할부원금이 유지되게).
  const card = priceDetail({ deviceId, planId: plan.id, join, method, carrier })
  const priced = card.state === 'covered'

  // 셀프개통 모드: 리베이트 − 고정 마진 = 고객 지원금. 가격표가 값을 주면 이 경로를 타지 않는다.
  const policy = priced || policyMargin == null ? null : selfSupport({ deviceId, planId: plan.id, join, margin: policyMargin, carrier: carrier ?? 'KT' })
  const publicSupport = priced ? Math.max(0, price - card.price) : (method === 'support' ? baseSupport : 0)
  const extraSupport = priced || method !== 'support' ? 0
    : policy ? policy.customer
      : (extra15 ? Math.floor(baseSupport * 0.15 / 10) * 10 : 0)
  const principal = priced ? card.price : Math.max(0, price - publicSupport - extraSupport)

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
    price, storage: st?.key ?? null, carrier,
    // 가격표 근거 — 화면이 "이 가격은 어디서 왔나" 를 밝힐 수 있게
    card, priced, blocked: card.state === 'blocked',
    // 셀프개통 모드(가격표 미수록 조합)에서만 채워진다 — "리베이트 − 마진 = 고객 지원금"
    policy, rebate: policy?.rebate ?? 0, margin: policy?.margin ?? 0,
    insurance, insuranceOnce: insurance ? INSURANCE.once : 0, insuranceWaived: insurance, // 면제 → 실부담 0
    addonFee,
  }
}

// ─── 온라인구매 AI 추천 — 현재 통신사 기준 "번호이동 vs 기기변경" 중 싼 쪽 ──────
// 3사 각각에 대해: 지금 쓰는 통신사면 기기변경, 아니면 번호이동으로 견적을 내고 월 납부금 최저를 고른다.
// 알뜰폰·미선택이면 3사 모두 번호이동 후보. 결과에는 "지금 통신사에서 기변" 대안과 차액도 담아
// 왜 그 추천인지 화면이 설명할 수 있게 한다.
export function bestOffer({ deviceId, cur = '', planId = 'choice110', months = 24, storage = null, margin = SELF_MARGIN_DEFAULT }) {
  const offers = MNO.map((carrier) => {
    const join = cur === carrier ? 'chg' : 'mnp'
    const q = calcPhoneQuote({ deviceId, planId, join, method: 'support', months, storage, carrier, policyMargin: margin })
    const support = q.publicSupport + q.extraSupport
    return {
      carrier, join, total: q.total, support, q,
      rebate: q.rebate, margin: q.margin,   // 정책 단가표 근거 — 화면이 출처를 밝힐 수 있게
      price: q.price,                  // 출고가(정가) — 카드에 취소선으로 표기
      principal: q.principal,          // 지원금 뺀 실구매가
      discountPct: q.price > 0 ? Math.round((support / q.price) * 100) : 0,
    }
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

// ─── 판매자 설계(사업자 전용) — 제로노트식 A · B · A+B 에 판매자 입력을 얹는다 ───────────────
// 기준값(출고가 · 공시지원금 또는 가격표 적용가 · 요금제 · 선택약정 · 결합)은 calcPhoneQuote 그대로 쓰고,
// 판매자가 직접 넣는 금액만 그 위에서 뺀다. 소비자 화면의 '추가지원금 15%' 자동 규칙은 여기서 쓰지 않는다 —
// 판매자 설계의 추가지원금은 판매자 부담(내 수당에서 나간다)이라 금액을 판매자가 정하고, 상한(내 수당 한도)
// 클램프는 호출부가 rbFor 결과로 한다. 이 함수는 순수 계산만 한다.
// 통신사는 KT 고정 — 현재 요금제·가격표가 모두 KT(K1) 기준이다.
export const DESIGN_DEFAULTS = {
  deviceId: 'fold8', storage: null, color: null, planId: 'choice110', join: 'mnp', method: 'support', months: 24, bundle: false, addon: false,
  extraSupport: 0, pointDc: 0, preCard: 0, prepay: 0, // A — 한 번에 빠지는 금액(원)
  cardDc: 0, welfareDc: 0, promoDc: 0, // B — 매달 빠지는 금액(원/월)
  joinFee: 0, usimFee: 0, // 별도 청구 — 개통 때 한 번(원)
}

const money = (v) => Math.max(0, Math.round(Number(String(v ?? '').replace(/[^0-9.-]/g, '')) || 0))

export function designPhoneQuote(input = {}) {
  const d = { ...DESIGN_DEFAULTS, ...input }
  const base = calcPhoneQuote({
    deviceId: d.deviceId, planId: d.planId, join: d.join, method: d.method, months: d.months,
    extra15: false, bundle: d.bundle, storage: d.storage, carrier: 'KT', addon: d.addon,
  })
  // A — 할부원금에서 한 번에 빠지는 판매자 입력
  const a = { extra: money(d.extraSupport), point: money(d.pointDc), preCard: money(d.preCard), prepay: money(d.prepay) }
  const aSum = a.extra + a.point + a.preCard + a.prepay
  const principal = Math.max(0, base.principal - aSum)
  const { monthly: deviceMonthly, interest } = pmt(principal, d.months)
  // B — 월 요금에서 매달 빠지는 판매자 입력(선택약정·결합 할인 뒤에 뺀다)
  const b = { card: money(d.cardDc), welfare: money(d.welfareDc), promo: money(d.promoDc) }
  const planMonthly = Math.max(0, base.planMonthly - b.card - b.welfare - b.promo)
  const total = deviceMonthly + planMonthly + base.addonFee
  const joinFee = money(d.joinFee), usimFee = money(d.usimFee)
  const upfront = d.months === 0 ? principal : 0
  return {
    ...base,
    input: d, a, b, aSum,
    principalBase: base.principal, // 판매자 입력 전 할부원금(가격표 적용가 또는 출고가 − 공시지원금)
    principal, deviceMonthly, interest,
    planMonthlyBase: base.planMonthly, planMonthly,
    total, joinFee, usimFee, upfront,
    oneTime: joinFee + usimFee + upfront, // 별도 청구(개통 때 한 번)
    total24: total * 24 + joinFee + usimFee + upfront, // 24개월 총 납부(비교용)
  }
}
