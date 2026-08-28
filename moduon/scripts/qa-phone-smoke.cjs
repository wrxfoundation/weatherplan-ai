// 스모크 — /calculator/phone: 전체 요금 비교표 · 가족결합 · 약정/위약금 안내
// 렌더뿐 아니라 "표의 최저가 열이 실제 최소값인지", "결합 토글이 금액을 낮추는지"까지 검증한다.
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }

const num = (s) => Number(String(s).replace(/[^0-9]/g, '')) || 0

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('http://localhost:4173/calculator/phone', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }

  let text = await page.evaluate(() => document.body.innerText)
  for (const m of ['전체 요금 안내', '월 청구금액(A+B)', '프리미엄 가족결합', '약정·위약금은 이렇게 걸려요', '차액 정산금', '할부수수료']) {
    check(text.includes(m), `렌더: ${m}`)
  }
  check(text.includes('최저'), '최저가 배지 표기')

  // 비교표 마지막 행(월 청구금액) 값들을 뽑아 최저가 배지 열과 일치하는지 검증
  const table = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('table tbody tr')]
    const last = rows[rows.length - 1]
    const heads = [...document.querySelectorAll('table thead th')].slice(1).map((th) => th.innerText.trim())
    const cells = [...last.querySelectorAll('td')].slice(1).map((td) => td.innerText.trim())
    return { heads, cells }
  })
  const totals = table.cells.map(num)
  check(totals.length === 4 && totals.every((v) => v > 0), `비교표 4개 요금제 금액 산출 (${totals.join(' / ')})`)
  const minIdx = totals.indexOf(Math.min(...totals))
  check(table.heads[minIdx].includes('최저'), `최저가 배지가 실제 최소값 열에 붙음 (${table.heads[minIdx].split('\n')[0]})`)

  // 가족결합 토글 — 기본 요금제(초이스110, 11만원)는 대상이므로 켜면 총액이 내려가야 한다
  const before = num(await page.locator('aside .tnum.text-\\[32px\\]').first().innerText())
  await page.click('text=프리미엄 가족결합')
  await page.waitForTimeout(400)
  const after = num(await page.locator('aside .tnum.text-\\[32px\\]').first().innerText())
  check(after < before, `가족결합 적용 시 월납부금 감소 (${before} → ${after})`)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('추가 절감'), '결합 절감액 안내 노출')

  // 비대상 요금제(슬림55, 5.5만)로 바꾸면 토글이 비활성 + 사유 노출
  await page.click('text=5G 슬림 55')
  await page.waitForTimeout(400)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('이 요금제는 대상이 아니에요'), '비대상 요금제 사유 안내')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
