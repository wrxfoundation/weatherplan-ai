// 스모크 — KT 정책 단가표(K1) → 셀프개통 가격 · 사업자 R/B
// ① 단가표 값이 엑셀 원본과 일치하는가(대표 조합 스팟체크)
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
  check(body.includes('KT 동판 단가표 K1'), '단가표 출처 표기(KT 동판 단가표 K1)')
  check(body.includes('2026-09-18'), '단가표 적용일 표기')
  let rows = await previewRows()
  check(rows.length === 3, `미리보기 대표 조합 3행 (${rows.length})`)
  // 엑셀 원본: Z폴드8류 × 110K × MNP = 47만 / S26류 × 90K이상 × MNP = 45만 / 아이폰17류 × 110K × 기변 = 25만
  const expect = [
    ['Z 폴드8', '번호이동', 470000],
    ['S26', '번호이동', 450000],
    ['아이폰 17 프로', '기기변경', 250000],
  ]
  expect.forEach(([dev, join, rebate], i) => {
    const r = rows[i] ?? {}
    check(r.label?.includes(dev) && r.label?.includes(join) && num(r.rebate) === rebate,
      `${dev} · ${join} → 리베이트 ${rebate.toLocaleString()} (표: ${r.rebate ?? '-'})`)
  })

  // ───────────── ② 10만원 고정 마진 자동 계산 ─────────────
  console.log('\n── ② 리베이트 − 마진 = 고객 지원금 (기본 10만원) ──')
  const marginVal = await page.locator('[data-t="self-margin-input"]').inputValue().catch(() => '')
  check(num(marginVal) === 100000, `기본 고정 마진 100,000 (${marginVal})`)
  rows.forEach((r) => {
    check(num(r.rebate) - num(r.margin) === num(r.customer),
      `${r.label.split('·')[0].trim()}: ${num(r.rebate).toLocaleString()} − ${num(r.margin).toLocaleString()} = ${num(r.customer).toLocaleString()}`)
  })
  check(rows.every((r) => num(r.margin) === 100000), '세 조합 모두 마진 100,000 고정')
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
  check(rows.every((r) => num(r.margin) === 300000 || num(r.margin) === num(r.rebate)),
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
  check(rbCard.includes('KT 동판 단가표 K1'), 'R/B 근거에 단가표명 표기')
  check(rbCard.includes('갤럭시 Z폴드 8류'), 'R/B 근거에 단가표 기기군 표기')
  check(rbCard.includes('110K'), 'R/B 근거에 요금제 구간 표기')
  const rbRebate = num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => ''))
  check(rbRebate === 470000, `R/B 단가 = 단가표 470,000 (계산기 기본: 폴드8·번호이동·초이스110) (${rbRebate.toLocaleString()})`)
  // 가입유형을 바꾸면 단가표의 다른 열을 읽어야 한다 — 기기변경 43만
  await page.locator('button', { hasText: /^기기변경$/ }).first().click().catch(() => {})
  await wait(500)
  const rbChg = num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => ''))
  check(rbChg === 430000, `기기변경으로 바꾸면 430,000 (단가표 기변 열) (${rbChg.toLocaleString()})`)
  // 요금제를 낮추면 구간이 내려간다 — 5G 슬림 55 → 49K 구간 30만(번호이동)
  await page.locator('button', { hasText: /^번호이동$/ }).first().click().catch(() => {})
  await wait(300)
  await page.locator('button', { hasText: '5G 슬림 55' }).first().click().catch(() => {})
  await wait(500)
  const rbSlim = num(await page.locator('[data-t="rb-rebate"]').innerText().catch(() => ''))
  check(rbSlim === 300000, `슬림55(49K 구간)로 내리면 300,000 (${rbSlim.toLocaleString()})`)

  // 개인회원에게는 여전히 안 보인다
  await session({ role: 'member', memberId: 'MB1', type: '개인' })
  await go('/calculator/phone')
  check((await page.locator('[data-t="rb-panel"]').count()) === 0, '개인회원 — R/B 비노출(기존 규칙 유지)')

  check(errors.length === 0, `pageerror 0 (${errors.length}${errors[0] ? ` — ${errors[0].slice(0, 100)}` : ''})`)
  await browser.close()
  console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
