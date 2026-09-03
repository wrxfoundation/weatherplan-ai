// 스모크 — 인터넷 셀프견적 빌더(4필터 + 우측 요약 + 3진입) + GNB 메가메뉴
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
  const total = async () => num(await page.locator('[data-t="net-total"]').innerText())
  // 실제 사용자처럼 마우스를 단계적으로 옮긴다 — hover()/click() 은 순간이동이라 호버 메뉴의 틈 버그를 못 잡는다
  const glide = async (loc, steps = 25) => { const bb = await loc.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps }); await page.waitForTimeout(150) }

  await page.goto('http://localhost:4173/category/internet', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check(await page.locator('[data-t="net-builder"]').count() === 1, '렌더: 셀프견적 빌더')
  check(await page.locator('[data-t="net-carriers"] button').count() === 5, '필터1 통신사 5종')
  check(await page.locator('[data-t="net-combos"] button').count() === 2, '필터2 조합 2종')
  check(await page.locator('[data-t="net-phone"]').count() === 1, '필터2 하단 [전화와 함께]')
  check(await page.locator('[data-t="net-speeds"] button').count() === 3, '필터3 속도 티어')
  check(await page.locator('[data-t="net-router"]').count() === 1, '필터3 하단 [공유기와 함께]')
  check(await page.locator('[data-t="net-tv"]').count() === 0, '필터4 TV는 인터넷 단독일 때 숨김')
  const t0 = await total()
  check(t0 === 44000, `기본 KT 500M 단독 → 월 ${t0}`)

  // 전화 +1,100 / 공유기 +1,100 / 1G 로 올리면 공유기 무료
  await page.locator('[data-t="net-phone"]').click(); await page.waitForTimeout(120)
  check(await total() === t0 + 1100, '전화와 함께 → +1,100')
  await page.locator('[data-t="net-router"]').click(); await page.waitForTimeout(120)
  check(await total() === t0 + 2200, '공유기와 함께 → +1,100')
  await page.locator('[data-t="net-speeds"] button', { hasText: '1Gbps' }).click(); await page.waitForTimeout(120)
  check(await total() === 55000 + 1100, '1G 선택 시 공유기 무료 → 56,100')
  check((await page.locator('[data-t="net-summary"]').innerText()).includes('무료'), '우측 요약에 공유기 "무료" 표기')

  // 인터넷+TV → 필터4 등장, 결합 할인
  await page.locator('[data-t="net-combos"] button', { hasText: '인터넷 + TV' }).click(); await page.waitForTimeout(150)
  check(await page.locator('[data-t="net-tv"] button').count() === 3, '필터4 TV채널 3종 등장')
  const t1 = await total()
  check(t1 === 55000 + 1100 + 12100 - 5500, `TV 베이직 + 결합할인 → 월 ${t1}`)
  const card = num(await page.locator('[data-t="net-card"]').innerText())
  check(card === t1 - 11000, `카드할인가 = 월요금 − 11,000 (${card})`)
  const gift = num(await page.locator('[data-t="net-gift"]').innerText())
  check(gift === 400000 + 50000 + 10000, `사은품 = 1G 40만 + TV 5만 + 전화 1만 = ${gift}`)

  // 우측 요약 항목 + 3진입 버튼
  const sum = await page.locator('[data-t="net-summary"]').innerText()
  for (const k of ['예상 월요금', '기본요금', '카드할인가', '사은품']) check(sum.includes(k), `요약 항목: ${k}`)
  for (const b of ['net-self', 'net-ai', 'net-human']) check(await page.locator(`[data-t="${b}"]`).count() === 1, `진입 버튼: ${b}`)
  const selfTxt = await page.locator('[data-t="net-self"]').innerText()
  check(selfTxt.includes('셀프가입'), '셀프가입 라벨')

  // 통신사 전환 → 티어 단가 교체 (스카이라이프 1G 33,000)
  await page.locator('[data-t="net-carriers"] button', { hasText: '스카이라이프' }).click(); await page.waitForTimeout(150)
  check((await page.locator('[data-t="net-speeds"]').innerText()).includes('33,000'), '스카이라이프 1G 단가 33,000')

  // AI 연결 → 챗 오픈
  await page.locator('[data-t="net-ai"]').click(); await page.waitForTimeout(700)
  check(await page.evaluate(() => document.body.innerText.includes('모비')), 'AI 연결 → 챗 위젯 열림')

  // 전문상담원 → /consult
  await page.goto('http://localhost:4173/category/internet', { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
  await page.locator('[data-t="net-human"]').click(); await page.waitForTimeout(600)
  check(page.url().includes('/consult') && page.url().includes('cat=internet'), `전문상담원 연결 → ${page.url().split('/').pop().slice(0, 40)}`)

  // GNB 통신사 프리필
  await page.goto('http://localhost:4173/category/internet?carrier=hellovision', { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
  const pressed = await page.locator('[data-t="net-carriers"] button[aria-pressed="true"]').innerText()
  check(pressed.includes('헬로비전'), `?carrier= 프리필 → ${pressed.replace(/\n/g, ' ')}`)

  // GNB 메가메뉴 — 호버 전엔 DOM 에 없고(링크 수 오염 없음), 호버 시 펼쳐진다
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
  check(await page.locator('[data-t="mega"]').count() === 0, '메가메뉴: 호버 전 미렌더')
  await page.locator('header nav a', { hasText: /^인터넷$/ }).hover(); await page.waitForTimeout(250)
  check(await page.locator('[data-t="mega"][data-mega="/category/internet"]').count() === 1, '인터넷 호버 → 통신사 패널')
  check(await page.locator('[data-t="mega-items"] a').count() === 5, '통신사 5종 링크')
  await page.locator('header nav a', { hasText: /^핸드폰$/ }).hover(); await page.waitForTimeout(250)
  const ph = await page.locator('[data-t="mega-items"]').innerText()
  check(ph.includes('온라인 구매') && ph.includes('알뜰폰 요금제'), '핸드폰 호버 → 온라인 구매 · 알뜰폰 요금제')
  await page.mouse.move(640, 640)
  await glide(page.locator('header nav a', { hasText: /^렌탈$/ }), 10); await page.waitForTimeout(200)
  check(await page.locator('[data-t="mega-brands"] a').count() === 9, '렌탈 호버 → 좌측 브랜드 9')
  const modes = await page.locator('[data-t="mega-modes"]').innerText()
  check(modes.includes('렌트') && modes.includes('리스'), '렌탈 패널 상단에 렌트 · 리스')
  const grid = await page.locator('[data-t="mega-grid"]').innerText()
  check(grid.includes('LG퓨리케어') && grid.includes('안마의자') && grid.includes('청호나이스') && grid.includes('정수기/제빙기'), '렌탈 그리드: 브랜드별 카테고리')
  // 커서를 천천히 패널까지 내려도 패널이 살아 있어야 한다(그노 리포트: 내려가는 동안 사라져 클릭 불가)
  await glide(page.locator('[data-t="mega-grid"] a', { hasText: /^스타일러$/ }))
  check(await page.locator('[data-t="mega"]').count() === 1, '천천히 내려가도 패널 유지 (nav↔패널 여백 통과)')
  await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(600)
  check(page.url().includes('brand=lg') && decodeURIComponent(page.url()).includes('type=스타일러'), `카테고리 클릭 → ${decodeURIComponent(page.url()).split('?')[1]}`)
  check(await page.locator('header nav a').count() === 4, 'GNB 링크 수는 여전히 4 (패널이 nav 바깥)')
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' }); await page.mouse.move(640, 640); await page.waitForTimeout(300)
  await glide(page.locator('header nav a', { hasText: /^렌탈$/ }), 10); await page.waitForTimeout(200)
  await glide(page.locator('[data-t="mega-modes"] a', { hasText: '리스' })); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(600)
  check(page.url().includes('mode=lease'), `패널의 리스 → ${page.url().split('?')[1]}`)
  check(await page.locator('[data-t="rental-browser"]').getAttribute('data-mode') === 'lease', '브라우저가 리스 모드로 열림')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
