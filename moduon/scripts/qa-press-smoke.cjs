// 일회성 스모크 — /admin/press 프레스룸: 렌더 + 초안 생성(로컬 폴백) + 배포 예약 기록
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript(() => localStorage.setItem('moduon_session_v1', JSON.stringify({ role: 'admin' })))
  await page.goto('http://localhost:4173/admin/press', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)

  let fail = 0
  const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }

  let text = await page.evaluate(() => document.body.innerText)
  for (const m of ['프레스룸', 'AI 보도자료 생성기', '배포 채널', '자동화 파이프라인', '담당자 검수', '예상 집행액', '광고']) check(text.includes(m), `렌더: ${m}`)
  check(/건당 \d/.test(text.replace(/,/g, '')), '채널 단가 표기')

  // 초안 생성 (API 없음 → 데모 브레인 폴백)
  await page.click('text=초안 생성하기')
  await page.waitForTimeout(2500)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('[보도자료]'), '초안 생성(로컬 폴백)')
  check(text.includes('■ 문의'), '보도자료 구조(문의 블록)')
  check(text.includes('데모 브레인') || text.includes('Claude'), '소스 배지')

  // 배포 예약 → 기록 테이블
  await page.click('text=배포 예약 ·')
  await page.waitForTimeout(500)
  text = await page.evaluate(() => document.body.innerText)
  check(text.includes('배포 예약(데모)'), '배포 기록 행 생성')

  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
