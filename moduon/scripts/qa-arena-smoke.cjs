// 일회성 스모크 — /admin/biz 포트폴리오 4-아레나 카드 렌더 검증
// (vite preview는 외부에서 기동, playwright는 글로벌 설치본 우선)
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }

const MUST = [
  '포트폴리오 재배치 관제', 'Shape', 'Accelerate', 'Sustain', 'Participate',
  '자본 집중', '외국인 개통(공략안 v1.0)', '재배치 신호', '활성 분양몰',
  '신시장 확장 스코어보드', // 기존 섹션 미파손 확인
]

;(async () => {
  const browser = await pw.chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript(() => localStorage.setItem('moduon_session_v1', JSON.stringify({ role: 'admin' })))
  await page.goto('http://localhost:4173/admin/biz', { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const text = await page.evaluate(() => document.body.innerText)
  let fail = 0
  for (const m of MUST) {
    const ok = text.includes(m)
    if (!ok) fail++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${m}`)
  }
  // 리드 비중 라이브 수치 렌더 확인 (예: "리드 12건 · 비중 34%")
  const live = /리드 \d+건 · 비중 \d+%/.test(text)
  console.log(`${live ? 'PASS' : 'FAIL'}  라이브 리드 비중 수치`)
  if (!live) fail++
  if (errors.length) { console.log('PAGEERROR:', errors.join(' | ')); fail++ }
  await browser.close()
  console.log(fail === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${fail} FAIL`)
  process.exit(fail === 0 ? 0 : 1)
})()
