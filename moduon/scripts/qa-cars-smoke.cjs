// 스모크 — 렌트/리스(자동차): 제조사·차종 브라우저 · 상세 견적 · 특가 · GNB 진입
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
const num = (s) => Number(String(s).replace(/[^\d]/g, ''))

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }
  const t = (sel) => page.locator(sel).innerText()
  const glide = async (loc, steps = 25) => { const bb = await loc.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps }); await page.waitForTimeout(150) }

  // ── 브라우저
  await page.goto('http://localhost:4173/cars', { waitUntil: 'networkidle' }); await page.waitForTimeout(500)
  const brands = await t('[data-t="car-brands"]')
  check(brands.includes('국산차 제조사') && brands.includes('수입차 제조사'), '제조사 2그룹')
  check(await page.locator('[data-t="car-brand"]').count() === 22, `제조사 ${await page.locator('[data-t="car-brand"]').count()}개`)
  for (const b of ['현대', '제네시스', '기아', '쉐보레', 'KGM', '르노', '벤츠', 'BMW', '테슬라', '포르쉐']) check(brands.includes(b), `제조사: ${b}`)
  check(await page.locator('[data-t="car-card"]').count() === 20, `현대 차종 ${await page.locator('[data-t="car-card"]').count()}종`)
  const grid = await t('[data-t="car-grid"]')
  for (const m of ['팰리세이드', '그랜저', '아이오닉5', '아반떼', '스타리아']) check(grid.includes(m), `차종: ${m}`)
  check(/리스 월 \d+ 만원 ~/.test(grid) && /렌트 월 \d+ 만원 ~/.test(grid), '카드에 리스·렌트 월 만원 표기')
  check(grid.includes('렌트상담'), '렌트 미제공 차종은 "렌트상담"')

  // 리스/렌트 필터
  await page.locator('[data-t="car-kind"] button', { hasText: '렌트' }).click(); await page.waitForTimeout(200)
  const rentOnly = await t('[data-t="car-grid"]')
  check(!rentOnly.includes('렌트상담'), '렌트 필터 → 미제공 차종 제외')
  check(!rentOnly.includes('리스 월'), '렌트 필터 → 리스 금액 숨김')
  await page.locator('[data-t="car-kind"] button', { hasText: '전체' }).click(); await page.waitForTimeout(200)

  // 제조사 전환
  await page.locator('[data-t="car-brand"]', { hasText: /^제네시스$/ }).click(); await page.waitForTimeout(250)
  check(page.url().includes('brand=genesis'), '제조사 선택이 URL 에 실림')
  const gen = await t('[data-t="car-grid"]')
  check(gen.includes('G80') && gen.includes('GV80') && !gen.includes('팰리세이드'), '제네시스 차종으로 교체')

  // 금주의 특가
  const sp = await t('[data-t="car-specials"]')
  check(sp.includes('금주의 특가차량'), '금주의 특가 섹션')
  check(sp.includes('특가판매') && sp.includes('한정수량'), '특가 배지 2종')
  check(await page.locator('[data-t="car-specials"] a', { hasText: '상세보기' }).count() === 3, '특가 3종 상세보기')
  const body = await page.evaluate(() => document.body.innerText)
  check(body.includes('최저가 선정') && body.includes('3~5%'), '캐피탈 비교 근거 문구')
  check(body.includes('현대캐피탈') && body.includes('KB캐피탈'), '비교 캐피탈사 목록')

  // ── 상세 — 공개 견적과 같은 조건에서 같은 금액이 나오는지
  await page.goto('http://localhost:4173/cars/palisade', { waitUntil: 'networkidle' }); await page.waitForTimeout(500)
  check(await page.locator('[data-t="car-trim"]').count() === 6, '팰리세이드 트림 6종')
  check(await page.locator('[data-t="car-option"]').count() === 10, '선택옵션 10종')
  check(await page.locator('[data-t="car-down"] button').count() === 6, '초기부담금 0~50% 6구간')
  check(await page.locator('[data-t="car-term"] button').count() === 3, '계약기간 36/48/60')
  const basis = await t('[data-t="car-basis"]')
  check(basis.includes('선납금 기준') && basis.includes('보증금 기준'), '선납금/보증금 기준')

  const lease = () => page.locator('[data-t="car-card"] [data-t="car-lease"]').innerText().then(num)
  const rent = () => page.locator('[data-t="car-card"] [data-t="car-rent"]').innerText().then(num)
  const L0 = await lease(), R0 = await rent()
  check(Math.abs(L0 - 203700) / 203700 < 0.03, `기본(30%·36개월·선납) 리스 ${L0.toLocaleString()} ≈ 공개견적 203,700`)
  check(Math.abs(R0 - 288400) / 288400 < 0.03, `렌트 ${R0.toLocaleString()} ≈ 공개견적 288,400`)
  check(R0 > L0, '렌트 > 리스 (보험·세금 포함)')
  const card = await t('[data-t="car-card"]')
  for (const k of ['총차량가격', '초기부담금', '잔존가치', '리스 월', '렌트 월']) check(card.includes(k), `요약 항목: ${k}`)

  // 옵션 → 총차량가격·월 상승
  await page.locator('[data-t="car-option"]', { hasText: '4WD' }).click(); await page.waitForTimeout(200)
  const L1 = await lease()
  check(L1 > L0, `옵션 추가 → 리스 ${L0.toLocaleString()} → ${L1.toLocaleString()}`)
  check((await page.evaluate(() => document.body.innerText)).includes('2,280,000'), '선택옵션가격 반영')
  await page.locator('[data-t="car-option"]', { hasText: '4WD' }).click(); await page.waitForTimeout(200)

  // 초기부담금 ↑ → 월 ↓, 0원이 되지 않는다
  await page.locator('[data-t="car-down"] button', { hasText: /^0 %$/ }).click(); await page.waitForTimeout(200)
  const Lz = await lease()
  await page.locator('[data-t="car-down"] button', { hasText: /^50 %$/ }).click(); await page.waitForTimeout(200)
  const Lm = await lease()
  check(Lz > Lm && Lm > 0, `초기부담금 0% ${Lz.toLocaleString()} > 50% ${Lm.toLocaleString()} > 0`)
  check(await page.locator('[data-t="car-capped"]').count() === 1, '상한 구간 안내 노출')
  await page.locator('[data-t="car-down"] button', { hasText: /^30 %$/ }).click(); await page.waitForTimeout(200)

  // 보증금 기준 → 월 인하 폭이 작다
  await page.locator('[data-t="car-basis"] button').nth(1).click(); await page.waitForTimeout(200)
  check(await lease() > L0, `보증금 기준이 선납금보다 월 높음 (${(await lease()).toLocaleString()} > ${L0.toLocaleString()})`)
  await page.locator('[data-t="car-basis"] button').nth(0).click(); await page.waitForTimeout(200)

  // 트림 변경
  await page.locator('[data-t="car-trim"]', { hasText: '캘리그래피 9인승' }).click(); await page.waitForTimeout(200)
  check(await lease() > L0, '상위 트림 → 월 상승')

  // 상담 분기
  await page.locator('[data-t="car-card"] [data-t="car-apply-rent"]').click(); await page.waitForTimeout(300)
  check(await page.locator('[data-t="apply-ai"]').count() === 1 && await page.locator('[data-t="apply-human"]').count() === 1, '렌트 상담신청 → AI/전문상담사 분기')
  await page.locator('[data-t="apply-human"]').click(); await page.waitForTimeout(600)
  check(page.url().includes('/consult') && page.url().includes('cat=car'), `상담 페이지로 (${page.url().split('/').pop()})`)

  // 전기차는 렌트상담
  await page.goto('http://localhost:4173/cars/ioniq5', { waitUntil: 'networkidle' }); await page.waitForTimeout(400)
  check((await t('[data-t="car-card"] [data-t="car-rent"]')).includes('렌트상담'), '아이오닉5 → 렌트상담')

  // ── GNB 진입
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' }); await page.mouse.move(640, 700); await page.waitForTimeout(300)
  const nav = await page.evaluate(() => [...document.querySelectorAll('header nav a')].map((a) => a.innerText.trim()))
  check(nav.join(',') === '인터넷,핸드폰,렌탈,렌트/리스,쇼핑몰', `GNB 5종 (${JSON.stringify(nav)})`)
  await glide(page.locator('header nav a', { hasText: '렌트/리스' }), 10); await page.waitForTimeout(250)
  check(await page.locator('[data-t="mega-groups"]').count() === 1, '렌트/리스 호버 → 제조사 패널')
  const mg = await t('[data-t="mega-groups"]')
  check(mg.includes('국산차 제조사') && mg.includes('수입차 제조사'), '패널에 국산/수입 그룹')
  await glide(page.locator('[data-t="mega-groups"] a', { hasText: /^테슬라$/ }))
  check(await page.locator('[data-t="mega-groups"]').count() === 1, '천천히 내려가도 패널 유지')
  await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(600)
  check(page.url().includes('brand=tesla'), `제조사 클릭 → ${page.url().split('?')[1]}`)

  // 히어로 타일 5종
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' }); await page.waitForTimeout(400)
  const strip = await page.evaluate(() => [...document.querySelectorAll('a')].filter((a) => a.querySelector('img[src*="/assets/cat-"]')).map((a) => a.innerText.trim()))
  check(strip.join(',') === '인터넷/TV,휴대폰,렌탈,렌트/리스,쇼핑몰', `히어로 타일 5종 (${JSON.stringify(strip)})`)
  await page.locator('a:has(img[src*="/assets/cat-car"])').first().click(); await page.waitForTimeout(600)
  check(page.url().endsWith('/cars'), `렌트/리스 타일 → /cars (${page.url().split('/').pop()})`)

  // 카테고리 슬러그는 상담용으로 살아 있고, 직접 접근하면 전용 브라우저로 보낸다
  await page.goto('http://localhost:4173/category/car', { waitUntil: 'networkidle' }); await page.waitForTimeout(400)
  check(page.url().endsWith('/cars'), '/category/car → /cars 리다이렉트')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
