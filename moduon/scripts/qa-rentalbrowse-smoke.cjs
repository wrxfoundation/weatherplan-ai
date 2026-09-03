// 스모크 — 렌탈 브랜드 브라우저(9브랜드 호버 카테고리 · 정수기 냉온/얼음 · 렌트/리스) + 계산기 프리필
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
  const items = () => page.locator('[data-t="rental-items"] > div').count()
  // 실제 사용자처럼 마우스를 단계적으로 옮긴다 — hover()/click() 은 순간이동이라 호버 메뉴의 틈 버그를 못 잡는다
  const glide = async (loc, steps = 25) => { const bb = await loc.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps }); await page.waitForTimeout(150) }

  await page.goto('http://localhost:4173/category/rental', { waitUntil: 'networkidle' }); await page.waitForTimeout(400)
  check(await page.locator('[data-t="rental-browser"]').count() === 1, '렌더: 브랜드 브라우저')
  check(await page.locator('[data-t="rental-brands"] button').count() === 10, '탭: 전체 + 9브랜드')
  check(await page.locator('[data-t="rental-browser"]').getAttribute('data-mode') === 'rent', '기본 모드 렌트')
  check(!(await page.locator('[data-t="rental-mode"]').isVisible()), 'PC: 렌트/리스 토글 숨김 (GNB 에서 고른다)')
  check((await page.locator('[data-t="rental-mode-label"]').innerText()).includes('렌트 기준'), 'PC: 현재 모드 라벨 표시')
  check(await items() === 20, `전체 품목 ${await items()}`)

  // 호버 → 카테고리 드롭다운
  await page.mouse.move(640, 700)
  await glide(page.locator('[data-t="rental-brands"] button', { hasText: 'LG퓨리케어' }), 10); await page.waitForTimeout(200)
  check(await page.locator('[data-t="rental-hover"] [role="menuitem"]').count() === 8, 'LG퓨리케어 호버 → 카테고리 8')
  const hv = await page.locator('[data-t="rental-hover"]').innerText()
  check(hv.includes('냉장고/김치냉장고') && hv.includes('스타일러') && hv.includes('안마의자'), '호버 카테고리 원문 일치')
  await glide(page.locator('[data-t="rental-hover"] [role="menuitem"]', { hasText: /^정수기$/ }))
  check(await page.locator('[data-t="rental-hover"]').count() === 1, '천천히 내려가도 드롭다운 유지')
  await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(200)
  check(await page.locator('[data-t="rental-water"]').count() === 1, '정수기 선택 → 우상단 냉온만/얼음냉온 필터')
  const wt = await page.locator('[data-t="rental-water"]').innerText()
  check(wt.includes('냉온만') && wt.includes('얼음냉온'), '필터 라벨')
  check(await items() === 1, `LG 정수기 ${await items()}종`)
  await page.locator('[data-t="rental-water"] button', { hasText: '얼음냉온' }).click(); await page.waitForTimeout(150)
  check(await items() === 1 && (await page.locator('[data-t="rental-items"]').innerText()).includes('얼음'), '얼음냉온 필터 → 얼음정수기')
  await page.locator('[data-t="rental-water"] button', { hasText: '냉온만' }).click(); await page.waitForTimeout(150)
  check(await items() === 0, 'LG 냉온만 → 품목 없음 → 상담 안내')

  // 다른 브랜드 — 청호 정수기/제빙기
  await page.locator('[data-t="rental-brands"] button', { hasText: '청호나이스' }).click(); await page.waitForTimeout(200)
  check((await page.locator('[data-t="rental-cats"]').innerText()).includes('정수기/제빙기'), '청호 카테고리 칩에 정수기/제빙기')
  await page.locator('[data-t="rental-cats"] button', { hasText: '정수기/제빙기' }).click(); await page.waitForTimeout(150)
  check(await items() === 2 && await page.locator('[data-t="rental-water"]').count() === 1, '정수기/제빙기도 정수기 필터 대상 (2종)')

  // 렌트 → 리스(?mode=): 월 요금 상향 + 소유권 이전 배지. PC 토글이 없으므로 URL 로 전환한다
  const firstPrice = async () => num((await page.locator('[data-t="rental-items"] > div').first().innerText()).match(/월\s*([\d,]+)원/)?.[1])
  await page.goto('http://localhost:4173/category/rental?brand=cuckoo&type=' + encodeURIComponent('정수기'), { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
  const rent = await firstPrice()
  await page.goto('http://localhost:4173/category/rental?brand=cuckoo&type=' + encodeURIComponent('정수기') + '&mode=lease', { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
  check(await page.locator('[data-t="rental-browser"]').getAttribute('data-mode') === 'lease', '?mode=lease → 리스 모드')
  const lease = await firstPrice()
  check(lease === Math.round((rent * 1.12) / 100) * 100, `리스 → 월 ${rent} → ${lease} (×1.12)`)
  check((await page.locator('[data-t="rental-items"] > div').first().innerText()).includes('소유권 이전'), '리스는 소유권 이전 배지')

  // GNB 딥링크 프리필
  await page.goto('http://localhost:4173/category/rental?brand=coway&type=' + encodeURIComponent('매트리스/프레임'), { waitUntil: 'networkidle' }); await page.waitForTimeout(300)
  check((await page.locator('[data-t="rental-brands"] button[aria-pressed="true"]').innerText()) === '코웨이', '?brand= 프리필')
  check((await page.locator('[data-t="rental-cats"] button[aria-pressed="true"]').innerText()) === '매트리스/프레임', '?type= 프리필')
  check(await items() === 1, '코웨이 매트리스 1종')

  // 자세히 계산 → 계산기에 품목·모드 프리필
  await page.locator('[data-t="rental-items"] a', { hasText: '자세히 계산' }).first().click(); await page.waitForTimeout(600)
  check(page.url().includes('/calculator/rental') && page.url().includes('item=coway-mattress'), `자세히 계산 → ${page.url().split('?')[1]}`)
  const body = await page.evaluate(() => document.body.innerText)
  check(body.includes('코웨이 매트리스'), '계산기가 그 품목으로 열림 (코웨이 매트리스)')
  check(await page.locator('[data-t="calc-mode"]').count() === 1, '계산기에도 렌트/리스 토글')

  // 모바일: 토글 유지(메가메뉴가 없어 유일한 전환 수단) — 누르면 실제로 모드가 바뀐다
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://localhost:4173/category/rental', { waitUntil: 'networkidle' }); await page.waitForTimeout(400)
  check(await page.locator('[data-t="rental-mode"]').isVisible(), '모바일: 렌트/리스 토글 노출')
  await page.locator('[data-t="rental-mode"] button', { hasText: '리스' }).click(); await page.waitForTimeout(200)
  check(await page.locator('[data-t="rental-browser"]').getAttribute('data-mode') === 'lease', '모바일: 토글로 리스 전환')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
