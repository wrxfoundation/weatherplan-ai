// 스모크 — 아정당식 3문항 온보딩 위저드 (/onboard/internet · /onboard/phone)
// 렌더뿐 아니라 실제로 3문항을 끝까지 답해 계산기로 프리필이 넘어가는지 완주 검증.
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  // 진행률만 집는다 — 헤더 대표번호(1660-0000)도 .tnum이라 첫 매치를 쓰면 안 된다
  const pct = () => page.evaluate(() => {
    const el = [...document.querySelectorAll('.tnum')].find((x) => /^\d+%$/.test(x.innerText.trim()))
    return el ? Number(el.innerText.replace(/\D/g, '')) : -1
  })

  // ── 인터넷 완주 ──
  await page.goto('http://localhost:4173/onboard/internet', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  let text = await page.evaluate(() => document.body.innerText)
  check(text.includes('가입하려는 통신사가 있으신가요?'), 'Q1 질문 렌더')
  check(text.includes('여러 개 선택 가능'), '복수 선택 안내')
  check(text.includes('알뜰'), '알뜰 배지')
  check(text.includes('💡'), '교육형 팁 노출')
  const p1 = await pct()
  check(p1 === 25, `진행률 25% (${p1})`)

  // 선택 전에는 다음이 막혀야 한다
  const nextDisabled = await page.locator('button:has-text("다음")').first().isDisabled()
  check(nextDisabled, '미선택 시 다음 비활성')

  await page.locator('button[aria-pressed]').first().click()
  await page.waitForTimeout(200)
  await page.locator('button:has-text("다음")').first().click()
  await page.waitForTimeout(400)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('인터넷 속도는 얼마나'), 'Q2 진입')
  check(text.includes('500Mbps'), 'Q2 속도 보기')
  const p2 = await pct()
  check(p2 === 50, `진행률 50% (${p2})`)
  check((await page.locator('button:has-text("이전")').count()) > 0, '이전 버튼 등장')

  await page.locator('button[aria-pressed]').nth(1).click()
  await page.waitForTimeout(200)
  await page.locator('button:has-text("다음")').first().click()
  await page.waitForTimeout(400)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('추가로 필요하신 상품'), 'Q3 진입')
  const p3 = await pct()
  check(p3 === 75, `진행률 75% (${p3})`)
  // 선택 문항이므로 미선택이어도 결과보기가 열려야 한다
  const resultEnabled = !(await page.locator('button:has-text("결과보기")').first().isDisabled())
  check(resultEnabled, '선택 문항은 미선택도 진행 가능')

  await page.locator('button:has-text("결과보기")').first().click()
  await page.waitForTimeout(800)
  const url = page.url()
  check(url.includes('/calculator?'), `결과 → 인터넷 계산기 (${url.split('/').pop().slice(0, 40)})`)
  check(url.includes('speed=') && url.includes('carrier=') && url.includes('from=onboard'), '답변이 프리필 쿼리로 전달')

  // ── 휴대폰 1문항만 확인(스키마 분리 확인) ──
  await page.goto('http://localhost:4173/onboard/phone', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('어느 통신사를 쓰실 건가요?'), '휴대폰 Q1 별도 스키마')
  check(text.includes('알뜰폰은 통화 품질'), '휴대폰 전용 팁')

  // ── 카테고리 진입 동선 ──
  await page.goto('http://localhost:4173/category/internet', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('통신사별 요금제 추천'), '카테고리 통신사 그리드')
  check(text.includes('나에게 맞는 상품 찾기'), '맞춤 찾기 배너')
  await page.locator('text=나에게 맞는 상품 찾기').first().click()
  await page.waitForTimeout(600)
  check(page.url().includes('/onboard/internet'), '배너 → 온보딩 진입')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
