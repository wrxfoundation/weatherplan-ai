// 정적 검사 — 가격 데이터 무결성 (브라우저 없이 소스 모듈을 직접 불러 본다)
// 화면에 찍히는 숫자끼리 어긋나는 사고를 데이터 단계에서 막는다.
//
//  ① 단말 기본값 정합 — 이름의 용량 · device.price · storages[0] 이 한 몸이어야 한다.
//     2026-09-23: 폴드8 이 이름 '1TB'·price 1TB(315만)인데 storages[0] 은 256GB 라, 카드에는
//     '256GB · 출고가 315만 · 할인 56%' 로 떠서 할인율이 부풀려 보였다(실제 256GB 는 257만 → 46%).
//  ② 견적의 용량 라벨과 출고가가 같은 항목에서 나온다 — 전 단말 × 용량 전수
//  ③ 가격표·리베이트 표가 가리키는 단말·요금제가 실제로 존재한다
//  ④ 제품 정보(phoneSpecs) — 전 단말에 설명이 있고, 한 줄 요약(device.spec)이 같은 곳에서 나오며,
//     용량별 RAM 은 그 단말의 용량 키만 쓴다. 가격표가 있는 단말(KT)은 KT 모델명(…NK)이 있어야 한다.
//  ⑤ 출고가 기준점 — 제조사 국내 출고가(docs/PHONE_SPECS.md). 2026-09-28 에 폴드8 256GB 가 폴드8 '울트라' 값(257만)
//     으로 들어가 있던 사고를 다시 막는다. 바꿀 땐 문서의 근거와 이 표를 같이 고친다.
//  ⑥ 리베이트 시드 = 원본 시트를 업로드 인식기로 읽은 결과 (scripts/fixtures/kt-k1-rebate-20260918.xlsx)
//     인식기가 망가지거나 시드를 손으로 고치면 여기서 갈라진다. 우리 단말은 전부 어느 행엔가(대체 행 포함) 붙어야 한다.
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
const ghostRebate = card.REBATE_SEED.groups.flatMap((g) => g.devices).filter((k) => !ids.has(k))
check(ghostPrice.length === 0 && ghostRebate.length === 0, `가격표·리베이트 매핑이 실제 단말만 가리킴${ghostPrice.length + ghostRebate.length ? ` ← ${[...ghostPrice, ...ghostRebate].join(',')}` : ''}`)
check(card.PRICE_CARD.plans.every((p) => planIds.has(p.key)), `가격표 요금제 ${card.PRICE_CARD.plans.length}종이 화면 요금제 목록에 존재`)

// ④
const specs = load('src/lib/phoneSpecs.js')
const noSpec = PHONE_DEVICES.filter((d) => !specs.PHONE_SPECS[d.id]).map((d) => d.id)
check(noSpec.length === 0, `제품 정보 — 단말 ${PHONE_DEVICES.length}종 전부 설명 있음${noSpec.length ? ` ← 없음: ${noSpec.join(',')}` : ''}`)
const lineBad = PHONE_DEVICES.filter((d) => !d.spec || d.spec !== specs.specLine(d.id)).map((d) => d.id)
check(lineBad.length === 0, `한 줄 요약(device.spec) = phoneSpecs.line${lineBad.length ? ` ← ${lineBad.join(',')}` : ''}`)
const ramBad = []
for (const d of PHONE_DEVICES) {
  const ram = specs.PHONE_SPECS[d.id]?.spec?.ram
  if (ram && typeof ram === 'object') {
    const keys = (d.storages ?? []).map((s) => s.key)
    const extra = Object.keys(ram).filter((k) => !keys.includes(k)), missing = keys.filter((k) => !(k in ram))
    if (extra.length || missing.length) ramBad.push(`${d.id}(없는 용량 ${extra.join('/') || '-'} · 빠진 용량 ${missing.join('/') || '-'})`)
  }
}
check(ramBad.length === 0, `용량별 RAM 은 그 단말의 용량과 1:1${ramBad.length ? ` ← ${ramBad.join(', ')}` : ''}`)
const ktBad = Object.keys(card.PRICE_ROW).filter((id) => !/^SM-\w+NK$/.test(specs.PHONE_SPECS[id]?.model ?? ''))
check(ktBad.length === 0, `KT 가격표 단말은 KT 모델명(SM-…NK) 표기${ktBad.length ? ` ← ${ktBad.join(',')}` : ''}`)
const keyBad = Object.entries(specs.PHONE_SPECS).flatMap(([id, x]) => [
  ...Object.keys(x.spec ?? {}).filter((k) => !specs.SPEC_KEYS.some((s) => s.key === k)).map((k) => `${id}.spec.${k}`),
  ...Object.keys(x.attrs ?? {}).filter((k) => !specs.ATTR_KEYS.some((s) => s.key === k)).map((k) => `${id}.attrs.${k}`),
])
check(keyBad.length === 0, `사양·속성 칸 이름이 표 머리(SPEC_KEYS·ATTR_KEYS)에 있는 것만${keyBad.length ? ` ← 오타? ${keyBad.join(',')}` : ''}`)

// ⑤
const MSRP = {
  fold8: { '256GB': 2278100, '512GB': 2531100, '1TB': 3152600 },
  flip8: { '256GB': 1683000, '512GB': 1936000 },
  s26u: { '256GB': 1797400, '512GB': 2050400, '1TB': 2545400 },
  s26: { '256GB': 1254000, '512GB': 1507000 },
  ip17: { '256GB': 1452000, '512GB': 1760000 }, // 2026-09 인상분(KT 공시변동 09-22 · 머니투데이·ZDNet 09-10)
}
const msrpBad = []
for (const [id, want] of Object.entries(MSRP)) {
  const d = PHONE_DEVICES.find((x) => x.id === id)
  for (const [k, v] of Object.entries(want)) {
    const got = d?.storages?.find((s) => s.key === k)?.price
    if (got !== v) msrpBad.push(`${id} ${k} ${got?.toLocaleString() ?? '없음'}(기준 ${v.toLocaleString()})`)
  }
}
check(msrpBad.length === 0, `출고가 = 제조사 국내 출고가 (${Object.keys(MSRP).length}종)${msrpBad.length ? ` ← ${msrpBad.join(', ')}` : ''}`)
// 공시변동으로 받은 KT 공통지원금이 견적에 그대로 쓰인다(추정 보정값으로 덮이지 않는다)
const ipq = calcPhoneQuote({ deviceId: 'ip17', planId: 'choice110', join: 'mnp', method: 'support', carrier: 'KT', extra15: false })
const ipc = calcPhoneQuote({ deviceId: 'ip17', planId: 'choice110', join: 'chg', method: 'support', carrier: 'KT', extra15: false })
check(ipq.publicSupport === 500000 && ipc.publicSupport === 450000 && ipq.price === 1452000, `아이폰 17 KT 공통지원금 MNP 500,000 · 기변 450,000 · 출고가 1,452,000 (${ipq.publicSupport.toLocaleString()} · ${ipc.publicSupport.toLocaleString()} · ${ipq.price.toLocaleString()})`)

// ⑥ (인식기는 비동기 — 압축 해제)
;(async () => {
  const imp = load('src/lib/rebateImport.js')
  const { readFileSync } = require('node:fs')
  const r = await imp.importRebateWorkbook(readFileSync(join(root, 'scripts/fixtures/kt-k1-rebate-20260918.xlsx')), { fileName: 'KT 단가표.xlsx' })
  const t = r.tables[0]
  const seed = card.REBATE_SEED
  check(!!t && t.carrier === 'KT' && t.code === 'K1' && t.effectiveFrom === '2026-09-18' && t.unit === 10000, `원본 시트 인식 — KT · K1 · 2026-09-18 · 만원 (${t?.carrier} · ${t?.code} · ${t?.effectiveFrom} · ${t?.unit})`)
  const pick = (c) => JSON.stringify({ tiers: c.tiers.map(({ key, min }) => ({ key, min })), groups: c.groups.map(({ label, devices, fallback, values }) => ({ label, devices: [...devices].sort(), fallback, values })), notes: c.notes })
  check(!!t && pick(t) === pick(seed), `리베이트 시드 = 원본 시트 인식 결과 (구간 ${t?.tiers.length} · 행 ${t?.groups.length} · 고지 ${t?.notes.length})`)
  const orphan = PHONE_DEVICES.filter((d) => !card.rebateDetail({ deviceId: d.id, planId: 'choice110', join: 'mnp' }).covered).map((d) => d.id)
  check(orphan.length === 0, `우리 단말 전부 리베이트 행 있음(대체 행 포함)${orphan.length ? ` ← ${orphan.join(',')}` : ''}`)
  const ip = card.rebateDetail({ deviceId: 'ip17p', planId: 'choice110', join: 'mnp' })
  check(ip.rebate === 250000 && ip.device?.label === '아이폰17류(전체)', `아이폰17 프로 → '아이폰17류(전체)' 행 · 110K MNP 250,000 (${ip.device?.label} · ${ip.rebate.toLocaleString()})`)
  const a56 = card.rebateDetail({ deviceId: 'a56', planId: 'basic4g', join: 'chg' })
  check(a56.rebate === 120000 && !a56.listed, `A56 → 그외 5G(대체 행) · 37K 기변 120,000 (${a56.device?.label} · ${a56.rebate.toLocaleString()})`)
  console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})().catch((e) => { console.log(`FAIL  인식기 실행 오류 — ${e.message}`); process.exit(1) })
