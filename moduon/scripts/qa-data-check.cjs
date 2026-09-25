// 정적 검사 — 가격 데이터 무결성 (브라우저 없이 소스 모듈을 직접 불러 본다)
// 화면에 찍히는 숫자끼리 어긋나는 사고를 데이터 단계에서 막는다.
//
//  ① 단말 기본값 정합 — 이름의 용량 · device.price · storages[0] 이 한 몸이어야 한다.
//     2026-09-23: 폴드8 이 이름 '1TB'·price 1TB(315만)인데 storages[0] 은 256GB 라, 카드에는
//     '256GB · 출고가 315만 · 할인 56%' 로 떠서 할인율이 부풀려 보였다(실제 256GB 는 257만 → 46%).
//  ② 견적의 용량 라벨과 출고가가 같은 항목에서 나온다 — 전 단말 × 용량 전수
//  ③ 가격표·리베이트 표가 가리키는 단말·요금제가 실제로 존재한다
const esbuild = require('esbuild')
const { join } = require('node:path')

const root = join(__dirname, '..')
const load = (entry) => {
  const out = esbuild.buildSync({ entryPoints: [join(root, entry)], bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent' })
  const mod = { exports: {} }
  new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require)
  return mod.exports
}
let fail = 0
const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }

const phones = load('src/lib/phones.js')
const card = load('src/lib/ratecard.js')
const { PHONE_DEVICES, PHONE_PLANS, calcPhoneQuote } = phones

// ①
const bad1 = PHONE_DEVICES.filter((d) => {
  const st0 = d.storages?.[0]
  if (!st0) return false
  const cap = d.name.match(/(\d+(?:GB|TB))$/)?.[1]
  return d.price !== st0.price || (cap && cap !== st0.key)
}).map((d) => `${d.id}(이름 ${d.name.match(/\S+$/)[0]} · price ${d.price} · storages[0] ${d.storages[0].key}/${d.storages[0].price})`)
check(bad1.length === 0, `단말 ${PHONE_DEVICES.length}종 — 이름 용량·기본 출고가 = 첫 용량${bad1.length ? ` ← ${bad1.join(', ')}` : ''}`)

// ②
const bad2 = []
for (const d of PHONE_DEVICES) {
  for (const st of [null, ...(d.storages ?? []).map((s) => s.key)]) {
    const q = calcPhoneQuote({ deviceId: d.id, storage: st })
    const want = d.storages?.find((s) => s.key === q.storage)?.price ?? d.price
    if (q.price !== want) bad2.push(`${d.id}/${st ?? '기본'}: 라벨 ${q.storage} 인데 출고가 ${q.price}(기대 ${want})`)
  }
}
check(bad2.length === 0, `견적 용량 라벨 ↔ 출고가 한 항목에서 (${PHONE_DEVICES.reduce((a, d) => a + 1 + (d.storages?.length ?? 0), 0)}조합)${bad2.length ? ` ← ${bad2.slice(0, 3).join(' | ')}` : ''}`)

// ③
const ids = new Set(PHONE_DEVICES.map((d) => d.id))
const planIds = new Set(PHONE_PLANS.map((p) => p.id))
const ghostPrice = Object.keys(card.PRICE_ROW).filter((k) => !ids.has(k))
const ghostRebate = Object.keys(card.REBATE_ROW).filter((k) => !ids.has(k))
check(ghostPrice.length === 0 && ghostRebate.length === 0, `가격표·리베이트 매핑이 실제 단말만 가리킴${ghostPrice.length + ghostRebate.length ? ` ← ${[...ghostPrice, ...ghostRebate].join(',')}` : ''}`)
check(card.PRICE_CARD.plans.every((p) => planIds.has(p.key)), `가격표 요금제 ${card.PRICE_CARD.plans.length}종이 화면 요금제 목록에 존재`)

console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
process.exit(fail === 0 ? 0 : 1)
