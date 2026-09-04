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
  const ai = page.locator('text=AI와 상담할게요').first()
  const human = page.locator('text=전문 상담사랑 상담할게요').first()
  check(await ai.isVisible(), 'CTA: AI와 상담할게요')
  check(await human.isVisible(), 'CTA: 전문 상담사랑 상담할게요')
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
  await page.locator('text=전문 상담사랑 상담할게요').first().click()
  await page.waitForTimeout(700)
  check(page.url().includes('/consult'), `상담사 연결 → 상담 페이지 (${page.url().split('/').pop()})`)

  // ④-b 히어로에는 안심 문구만 — 통신사/기종은 휴대폰 파트로 내렸다
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('바꾸라고 하지 않아요'), '안심 문구: 바꾸라고 하지 않아요')
  check(text.includes('먼저 계산부터 해드려요'), '안심 문구: 먼저 계산부터')
  check(!text.includes('지금 쓰시는 통신사') && !text.includes('관심 있는 기종'),
    '히어로에서 휴대폰 전용 선택란 제거')

  // ④-c 휴대폰 카테고리로 이동했는지 + 선택값이 상담 쿼리로 전달되는지
  await page.goto('http://localhost:4173/category/phone', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('지금 쓰시는 통신사'), '휴대폰: 현 통신사 선택란')
  for (const c of ['SK', 'KT', 'LG U+', '알뜰폰']) check(text.includes(c), `휴대폰 통신사 보기: ${c}`)
  check(text.includes('관심 있는 기종'), '휴대폰: 기종 선택란')
  check(text.includes('원하는 기종이 없어요') && text.includes('상담 후 결정할게요'), '휴대폰: 기종 퇴로 2종')
  check(!text.includes('통신사별 요금제 추천'), '휴대폰: 중복 통신사 그리드 제거')

  await page.locator('button:has-text("KT")').first().click()
  await page.waitForTimeout(150)
  await page.locator('button:has-text("갤럭시 Z 폴드8")').first().click()
  await page.waitForTimeout(150)
  await page.locator('a:has-text("전문 상담사랑 상담할게요")').first().click()
  await page.waitForTimeout(700)
  check(page.url().includes('cur=KT') && page.url().includes('device=fold8'),
    `휴대폰 선택값이 상담 쿼리로 전달 (${decodeURIComponent(page.url().split('?')[1] || '')})`)

  // ⑤ 히어로 타일 — 인터넷/TV · 휴대폰 · 렌탈 · 쇼핑몰, 유리 패널 위에
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const strip = await page.evaluate(() => [...document.querySelectorAll('a')]
    .filter((a) => a.querySelector('img[src*="/assets/cat-"]'))
    .map((a) => a.innerText.trim()))
  check(strip.join(',') === '인터넷/TV,휴대폰,렌탈,렌트/리스,쇼핑몰', `히어로 타일 5종 (${JSON.stringify(strip)})`)
  for (const gone of ['이사', '정수기', '보험', '가전', '생활/기타']) {
    check(!strip.includes(gone), `타일에서 숨김: ${gone}`)
  }
  // 타일이 히어로(=CTA 아래) 안에 있고, 유리 패널(backdrop-filter)을 쓰는지
  const tileBox = await page.locator('a:has(img[src*="/assets/cat-"])').first().boundingBox()
  const ctaBox = await page.locator('text=AI와 상담할게요').first().boundingBox()
  check(tileBox.y > ctaBox.y, `타일이 AI 상담 버튼 아래 (cta ${Math.round(ctaBox.y)} < tile ${Math.round(tileBox.y)})`)
  const glass = await page.evaluate(() => {
    const a = [...document.querySelectorAll('a')].find((x) => x.querySelector('img[src*="/assets/cat-"]'))
    for (let el = a; el; el = el.parentElement) {
      const s = getComputedStyle(el)
      if ((s.backdropFilter && s.backdropFilter !== 'none') || (s.webkitBackdropFilter && s.webkitBackdropFilter !== 'none')) {
        return { blur: s.backdropFilter, bg: s.backgroundColor }
      }
    }
    return null
  })
  check(!!glass, `타일 배경이 반투명 유리 패널 (${glass ? glass.blur + ' / ' + glass.bg : '없음'})`)

  // 쇼핑몰 타일 → 더미 페이지
  await page.locator('a:has(img[src*="/assets/cat-shop"])').first().click()
  await page.waitForTimeout(600)
  check(page.url().includes('/shop'), `쇼핑몰 타일 → /shop (${page.url().split('/').pop()})`)
  const shopText = await page.evaluate(() => document.body.innerText)
  check(shopText.includes('준비 중') && shopText.includes('쇼핑몰을 준비하고'), '쇼핑몰 더미 페이지 내용')

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
  check(navLabels.join(',') === '인터넷,핸드폰,렌탈,렌트/리스,쇼핑몰', `GNB 5종 순서 (${JSON.stringify(navLabels)})`)

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
