// 스모크 — KT 정책 단가표(K1) → 셀프개통 가격 · 사업자 R/B
// ① 단가표 값이 엑셀 원본과 일치하는가(대표 조합 스팟체크 + 표 전문)
// ①-b 요금제가 단가표에서 나오는가(표에 열이 없는 요금제를 고를 수 없어야 한다)
// ② 셀프개통: 리베이트 − 고정 마진 = 고객 지원금 → 할부원금 → 월 납부금까지 자동으로 따라오는가
// ③ 어드민에서 마진을 바꾸면 소비자 온라인구매 가격이 실제로 움직이는가
// ④ 사업자가 설계하면 같은 단가표 값이 R/B 로 보이는가 (개인에게는 안 보이는가)
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
const BASE = process.env.QA_BASE ?? 'http://localhost:4173'
const num = (s) => Number(String(s).replace(/[^0-9]/g, '')) || 0

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  const wait = (ms) => page.waitForTimeout(ms)
  const go = async (path) => {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('main, header', { timeout: 5000 }).catch(() => {})
    await wait(400)
  }
  const session = async (s) => page.evaluate((v) => {
    try { v ? localStorage.setItem('moduon_session_v1', JSON.stringify(v)) : localStorage.removeItem('moduon_session_v1') } catch { /* noop */ }
  }, s)
  // 어드민 미리보기 표 → [{조합, 리베이트, 마진, 고객지원, 월}]
  const previewRows = async () => {
    try {
      return await page.locator('[data-t="self-margin-row"]').evaluateAll((trs) => trs.map((tr) => {
        const td = [...tr.querySelectorAll('td')].map((x) => x.textContent.trim())
        return { label: td[0], rebate: td[1], margin: td[2], customer: td[3], total: td[4] }
      }))
    } catch { return [] }
  }

  await go('/login')
  await page.evaluate(() => {
    try {
      ;['moduon_db_v1', 'moduon_session_v1'].forEach((k) => localStorage.removeItem(k))
      sessionStorage.clear()
    } catch { /* noop */ }
  })

  // ───────────── ① 단가표 값 — 엑셀 원본 스팟체크 ─────────────
  console.log('\n── ① 단가표 값이 엑셀과 일치 ──')
  await session({ role: 'admin' })
  await go('/admin/policies')
  const body = await page.evaluate(() => document.body.innerText)
  check(body.includes('KT 정책 단가표 K1'), '단가표 출처 표기(KT 정책 단가표 K1)')
  check(body.includes('2026-09-18'), '단가표 적용일 표기')
  let rows = await previewRows()
  check(rows.length === 4, `미리보기 대표 조합 4행 (${rows.length})`)
  // 엑셀 원본(만원): Z폴드8 × 초이스110 × MNP = 47 / S26 × 초이스90 × MNP = 45
  //                  아이폰17프로는 표에 없다 → '그 외' 줄 × 초이스110 × 기변 = 27
  //                  Z플립8 × 베이직4GB × 010신규 = 0  ← 0 원도 단가표의 답이다(데모 단가로 덮이면 안 된다)
  const expect = [
    ['Z 폴드8', '번호이동', 470000],
    ['S26', '번호이동', 450000],
    ['아이폰 17 프로', '기기변경', 270000],
    ['Z 플립8', '010 신규', 0],
  ]
  expect.forEach(([dev, join, rebate], i) => {
    const r = rows[i] ?? {}
    check(r.label?.includes(dev) && r.label?.includes(join) && num(r.rebate) === rebate,
      `${dev} · ${join} → 리베이트 ${rebate.toLocaleString()} (표: ${r.rebate ?? '-'})`)
  })
  // 단가표에 없는 단말은 '그 외' 로 떨어졌다고 화면이 밝혀야 한다
  check(rows[2]?.label?.includes('그 외'), `아이폰17프로 — '그 외' 적용 표기 (${rows[2]?.label ?? '-'})`)
  check(!rows[0]?.label?.includes('그 외'), 'Z폴드8 — 단가표 수록 단말이라 그 외 표기 없음')

  // 표 전문이 시트와 같은 모양으로 올라와 있는가 (9행 + 그 외 1행)
  const cardRows = await page.locator('[data-t="rate-card-row"]').count()
  check(cardRows === 10, `단가표 전문 10행(수록 9 + 그 외 1) (${cardRows})`)
  const etcCells = await page.locator('[data-t="rate-card-row"][data-row="etc"] td').allInnerTexts().catch(() => [])
  check(etcCells.slice(1).join(',') === '20,30,27,18,25,25,0,5,5',
    `'그 외' 줄 = 각 칸 최솟값 20/30/27 · 18/25/25 · 0/5/5 (${etcCells.slice(1).join(',')})`)
  const flipCells = await page.locator('[data-t="rate-card-row"][data-row="flip8"] td').allInnerTexts().catch(() => [])
  check(flipCells.slice(1).join(',') === '36,47,43,33,45,40,0,12,12',
    `Z플립8 줄 = 엑셀 36/47/43 · 33/45/40 · 0/12/12 (${flipCells.slice(1).join(',')})`)
  // 인터넷 결합 수수료는 미반영 — 화면이 그 사실을 밝힌다
  check(body.includes('인터넷 결합 수수료') && body.includes('미반영'), '인터넷 결합 수수료 미반영 고지')

  // ───────────── ①-b 요금제가 단가표에서 나온다 ─────────────
  console.log('\n── ①-b 요금제 목록 = 단가표 열 ──')
  await go('/calculator/phone')
  const planIds = await page.locator('[data-t="calc-plan"]').evaluateAll((bs) => bs.map((b) => b.dataset.id))
  check(planIds.join(',') === 'choice110,choice90,basic4g',
    `요금제 선택지가 단가표 열 3개와 일치 (${planIds.join(',') || '-'})`)

  // ───────────── ② 10만원 고정 마진 자동 계산 ─────────────
  console.log('\n── ② 리베이트 − 마진 = 고객 지원금 (기본 10만원) ──')
  await go('/admin/policies') // ①-b 가 계산기로 옮겨 놨다 — 정책 화면으로 돌아와서 읽는다
  rows = await previewRows()
  const marginVal = await page.locator('[data-t="self-margin-input"]').inputValue().catch(() => '')
  check(num(marginVal) === 100000, `기본 고정 마진 100,000 (${marginVal})`)
  rows.forEach((r) => {
    check(num(r.rebate) - num(r.margin) === num(r.customer),
      `${r.label.split('·')[0].trim()}: ${num(r.rebate).toLocaleString()} − ${num(r.margin).toLocaleString()} = ${num(r.customer).toLocaleString()}`)
  })
  check(rows.every((r) => num(r.margin) === Math.min(100000, num(r.rebate))), '마진은 100,000 고정 — 단, 리베이트가 더 작으면 거기까지만')
  // 리베이트 0 인 조합: 고객 지원금 0 · 마진 0 — 마이너스가 생기면 안 된다
  const zero = rows.find((r) => num(r.rebate) === 0)
  check(zero && num(zero.customer) === 0 && num(zero.margin) === 0,
    `리베이트 0 조합 → 고객 지원금 0 · 마진 0 (마이너스 없음) (${zero ? `${zero.customer} / ${zero.margin}` : '행 없음'})`)
  check(rows.every((r) => num(r.total) > 0), `월 납부금 자동 산출 (${rows.map((r) => r.total).join(' / ')})`)

  // ───────────── ③ 마진을 바꾸면 소비자 가격이 따라오는가 ─────────────
  console.log('\n── ③ 마진 변경 → 소비자 온라인구매 가격 반영 ──')
  await go('/phone/shop')
  const shopPrice = async () => num(await page.locator('[data-t="shop-card"]').first().locator('.tnum.text-\\[15px\\]').first().innerText().catch(() => ''))
  const shopBefore = await shopPrice()
  await session({ role: 'admin' })
  await go('/admin/policies')
  await page.locator('[data-t="self-margin-input"]').fill('300000')
  await page.locator('[data-t="self-margin-save"]').click()
  await wait(600)
  rows = await previewRows()
  check(rows.every((r) => num(r.margin) === Math.min(300000, num(r.rebate))),
    `마진 300,000 반영 (${rows.map((r) => r.margin).join(' / ')})`)
  const r0 = rows[0]
  check(num(r0.customer) === num(r0.rebate) - 300000, `Z폴드8 고객 지원금 ${(num(r0.rebate) - 300000).toLocaleString()} 로 감소 (${r0.customer})`)
  await go('/phone/shop')
  const shopAfter = await shopPrice()
  check(shopBefore > 0 && shopAfter > shopBefore && shopAfter - shopBefore === 200000,
    `마진 +200,000 → 실구매가 정확히 200,000 상승 (${shopBefore.toLocaleString()} → ${shopAfter.toLocaleString()})`)
  // 되돌리기 — 뒤 단계가 기본값을 보도록
  await session({ role: 'admin' })
  await go('/admin/policies')
  await page.locator('[data-t="self-margin-input"]').fill('100000')
  await page.locator('[data-t="self-margin-save"]').click()
  await wait(500)
  check(num((await previewRows())[0]?.margin) === 100000, '마진 100,000 으로 복원')

  // ───────────── ④ 사업자 R/B 에 단가표가 그대로 ─────────────
  console.log('\n── ④ 사업자 설계 시 단가표 리베이트 노출 ──')
  await session({ role: 'member', memberId: 'MB3', type: '사업자', tier: 'seller', code: 'A1N7742' })
  await go('/calculator/phone')
  check((await page.locator('[data-t="rb-panel"]').count()) === 1, '사업자 — R/B 블록 노출')
  const rbCard = await page.locator('[data-t="rb-panel"]').innerText().catch(() => '')
  check(rbCard.includes('KT 정책 단가표 K1'), 'R/B 근거에 단가표명 표기')
  check(rbCard.includes('갤럭시 Z폴드8'), 'R/B 근거에 단가표 단말 행 표기')
  check(rbCard.includes('초이스 110'), 'R/B 근거에 요금제명 표기')
  const rbRebate = num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => ''))
  check(rbRebate === 470000, `R/B 단가 = 단가표 470,000 (계산기 기본: 폴드8·번호이동·초이스110) (${rbRebate.toLocaleString()})`)
  // 가입유형을 바꾸면 단가표의 다른 열을 읽어야 한다 — 기기변경 43만
  await page.locator('[data-t="calc-join"][data-id="chg"]').click().catch(() => {})
  await wait(500)
  const rbChg = num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => ''))
  check(rbChg === 430000, `기기변경으로 바꾸면 430,000 (단가표 기변 열) (${rbChg.toLocaleString()})`)
  // 요금제를 바꾸면 단가표의 다른 열을 읽는다 — 베이직 4GB · 번호이동 = 12만
  await page.locator('[data-t="calc-join"][data-id="mnp"]').click().catch(() => {})
  await wait(300)
  await page.locator('[data-t="calc-plan"][data-id="basic4g"]').click().catch(() => {})
  await wait(500)
  const rbBasic = num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => ''))
  check(rbBasic === 120000, `베이직 4GB 로 내리면 120,000 (${rbBasic.toLocaleString()})`)
  // 010 신규 + 베이직 4GB = 0 원. 데모 단가표로 덮이지 않고 0 이 그대로 나와야 한다.
  await page.locator('[data-t="calc-join"][data-id="new"]').click().catch(() => {})
  await wait(500)
  const rbZero = num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => ''))
  check(rbZero === 0, `010 신규 + 베이직 4GB = 0 원 (데모 단가 대체 없음) (${rbZero.toLocaleString()})`)
  // 단가표에 없는 단말 — '그 외' 줄로 떨어졌다고 근거에 밝힌다 (초이스110 · 번호이동 = 30만)
  await page.locator('[data-t="calc-plan"][data-id="choice110"]').click().catch(() => {})
  await page.locator('[data-t="calc-join"][data-id="mnp"]').click().catch(() => {})
  await page.locator('[data-t="calc-device"][data-id="ip17p"]').click().catch(() => {})
  await wait(500)
  const rbEtc = num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => ''))
  const rbEtcNote = await page.locator('[data-t="rb-panel"]').innerText().catch(() => '')
  check(rbEtc === 300000, `아이폰17프로 → '그 외' 줄 300,000 (${rbEtc.toLocaleString()})`)
  check(rbEtcNote.includes('단가표 미수록 → 그 외 적용'), "R/B 근거에 '그 외 적용' 명시")

  // 개인회원에게는 여전히 안 보인다
  await session({ role: 'member', memberId: 'MB1', type: '개인' })
  await go('/calculator/phone')
  check((await page.locator('[data-t="rb-panel"]').count()) === 0, '개인회원 — R/B 비노출(기존 규칙 유지)')

  check(errors.length === 0, `pageerror 0 (${errors.length}${errors[0] ? ` — ${errors[0].slice(0, 100)}` : ''})`)
  await browser.close()
  console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
