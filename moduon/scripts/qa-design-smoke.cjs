// 스모크 — /office/design 수당 설계기
// 회의 결정사항이 실제로 지켜지는지 검증한다:
//  ① 지원금을 늘리면 내 수당이 정확히 그만큼 줄어든다(단가 = 지원금 + 계층 배분)
//  ② 히든(상위 계층 몫)은 기본 숨김 — 버튼을 눌러야 보인다
//  ③ 대리점 직영이면 셀러+대리점 몫을 합산 수령
//  ④ 인터넷은 지원금 고정(재량 슬라이더 없음)
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }

const num = (s) => Number(String(s).replace(/[^0-9]/g, '')) || 0

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript(() => localStorage.setItem('moduon_session_v1', JSON.stringify({ role: 'partner', tenantId: 'T1' })))
  await page.goto('http://localhost:4173/office/design', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  const take = () => page.locator('aside .tnum.text-\\[32px\\]').first().innerText().then(num)

  let text = await page.evaluate(() => document.body.innerText)
  for (const m of ['수당 설계기', '정책 단가표', '고객 지원금 설계', '분배 내역', '대리점 직영 판매', '내 수당', 'MNO', '렌탈']) {
    check(text.includes(m), `렌더: ${m}`)
  }

  // ② 히든 기본 숨김
  check(!text.includes('계층') || !/총판\s*\n?\s*[\d,]+원/.test(text), '히든 분배표 기본 숨김')
  check(text.includes('상세 보기'), '상세 보기 버튼 존재')
  await page.click('text=상세 보기')
  await page.waitForTimeout(300)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('총판') && text.includes('본사'), '상세 보기 시 계층 분배 노출')

  // ① 지원금 ↑ → 내 수당 ↓ (동액만큼)
  const before = await take()
  const slider = page.locator('input[type=range]').first()
  const cur = Number(await slider.inputValue())
  await slider.fill(String(cur + 100000))
  await page.waitForTimeout(350)
  const after = await take()
  check(before - after === 100000, `지원금 +10만 → 내 수당 정확히 −10만 (${before} → ${after})`)

  // ③ 직영 해제 → 대리점 몫만큼 감소
  // 금액 셀(td[1])만 집어낸다 — 행 전체를 문자열로 합치면 옆 칸의 비중(%)까지 숫자로 딸려온다
  const agencyAmt = num(await page.evaluate(() => {
    const tr = [...document.querySelectorAll('table tbody tr')].find((r) => r.cells[0]?.innerText.includes('대리점'))
    return tr ? tr.cells[1].innerText : '0'
  }))
  const withDirect = await take()
  await page.click('text=대리점 직영 판매')
  await page.waitForTimeout(350)
  const noDirect = await take()
  check(withDirect - noDirect === agencyAmt && agencyAmt > 0, `직영 해제 시 대리점 몫(${agencyAmt}) 차감 (${withDirect} → ${noDirect})`)

  // ④ 인터넷 = 지원금 고정, 슬라이더 없음
  await page.click('text=U+ 인터넷')
  await page.waitForTimeout(400)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('통신사가 고객 지원금 상한'), '인터넷 고정 지원금 안내')
  check((await page.locator('input[type=range]').count()) === 0, '인터넷은 재량 슬라이더 없음')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
