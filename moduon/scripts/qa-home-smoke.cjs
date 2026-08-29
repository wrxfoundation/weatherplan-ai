// 스모크 — 소비자 홈 히어로 개편(검색창 제거 · CTA 2열) + GNB 축소
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }

  // ① 히어로 검색창 제거
  check((await page.locator('input[placeholder*="검색"]').count()) === 0, '히어로 검색 입력 제거')
  check((await page.locator('button[aria-label="검색"]').count()) === 0, '히어로 검색 버튼 제거')

  // ② CTA 2열 — 같은 행(동일 y)에 좌우로 배치
  const ai = page.locator('text=AI와 먼저 상담').first()
  const human = page.locator('text=상담사 연결').first()
  check(await ai.isVisible(), 'CTA: AI와 먼저 상담')
  check(await human.isVisible(), 'CTA: 상담사 연결')
  const [a, h] = [await ai.boundingBox(), await human.boundingBox()]
  check(Math.abs(a.y - h.y) < 6, `2열 동일 행 배치 (y ${Math.round(a.y)} / ${Math.round(h.y)})`)
  check(a.x < h.x, `좌=AI · 우=상담사 (x ${Math.round(a.x)} < ${Math.round(h.x)})`)

  // ③ AI 버튼이 실제로 챗을 연다
  await ai.click()
  await page.waitForTimeout(600)
  const chatOpen = await page.evaluate(() => document.body.innerText.includes('모비') || !!document.querySelector('[aria-expanded="true"]'))
  check(chatOpen, 'AI 버튼 클릭 시 챗 위젯 열림')

  // ④ 상담사 연결 → /consult
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.locator('text=상담사 연결').first().click()
  await page.waitForTimeout(700)
  check(page.url().includes('/consult'), `상담사 연결 → 상담 페이지 (${page.url().split('/').pop()})`)

  // ⑤ 카테고리 스트립 — 취급 중인 3종만 노출
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const strip = await page.evaluate(() => [...document.querySelectorAll('a[href^="/category/"]')]
    .filter((a) => a.querySelector('img[src*="/assets/cat-"]'))
    .map((a) => a.innerText.trim()))
  check(strip.join(',') === '인터넷/TV,휴대폰,렌탈', `카테고리 스트립 3종만 (${JSON.stringify(strip)})`)
  for (const gone of ['이사', '정수기', '보험', '가전', '생활/기타']) {
    check(!strip.includes(gone), `스트립에서 숨김: ${gone}`)
  }

  // ⑥ 혜택 밴드 — 인터넷 · 핸드폰 · 렌탈 순서와 오브제 에셋
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const band = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter((i) => /obj-(wifi|phone|purifier|truck)/.test(i.getAttribute('src') || ''))
    return imgs.map((i) => {
      const card = i.closest('button, a, div')
      return { src: (i.getAttribute('src') || '').split('/').pop(), x: i.getBoundingClientRect().x, label: (card?.innerText || '').split('\n')[0] }
    }).sort((a, b) => a.x - b.x)
  })
  check(band.length === 3, `혜택 카드 3장 (${band.length})`)
  check(band.map((b) => b.src).join(',') === 'obj-wifi.webp,obj-phone.png,obj-purifier.webp',
    `오브제 순서 인터넷·핸드폰·렌탈 (${band.map((b) => b.src).join(' / ')})`)
  const bandText = await page.evaluate(() => document.body.innerText)
  check(bandText.includes('핸드폰') && !bandText.includes('이사 서비스'), '라벨 교체: 핸드폰 노출 · 이사 서비스 제거')
  check(bandText.includes('렌탈') && !bandText.includes('정수기 렌탈'), '라벨 교체: 렌탈(정수기 렌탈 아님)')

  // 핸드폰 카드 클릭 → /category/phone
  await page.locator('text=핸드폰').first().click()
  await page.waitForTimeout(700)
  check(page.url().includes('/category/phone'), `핸드폰 카드 → 휴대폰 카테고리 (${page.url().split('/').pop()})`)

  // ⑥ GNB — 쇼핑몰만 노출
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const navLabels = await page.evaluate(() => [...document.querySelectorAll('header nav a')].map((a) => a.innerText.trim()))
  check(navLabels.join(',') === '인터넷,핸드폰,렌탈,쇼핑몰', `GNB 인터넷·핸드폰·렌탈·쇼핑몰 순 (${JSON.stringify(navLabels)})`)

  // GNB 각 메뉴가 실제 카테고리로 이동하는지
  for (const [label, path] of [['인터넷', '/category/internet'], ['핸드폰', '/category/phone'], ['렌탈', '/category/rental']]) {
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    await page.locator('header nav a', { hasText: new RegExp(`^${label}$`) }).click()
    await page.waitForTimeout(500)
    check(page.url().includes(path), `GNB ${label} → ${path}`)
  }

  // 숨김 페이지는 살아 있어야 한다(삭제가 아니라 숨김)
  await page.goto('http://localhost:4173/payouts', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  check(!page.url().endsWith('/'), '숨긴 메뉴의 페이지는 직접 접근 시 정상 동작')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
