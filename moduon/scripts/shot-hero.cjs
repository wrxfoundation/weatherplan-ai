// 히어로 시각 확인용 캡처 — 유리 패널이 실제로 뒤를 뭉개는지 눈으로 본다.
// (카테고리 아이콘은 CDN이라 로컬에선 비지만, 패널·배경 관계는 그대로 확인 가능)
let pw
try { pw = require('/opt/node22/lib/node_modules/playwright') } catch { pw = require('playwright') }
const out = process.argv[2] || '/tmp/hero.png'

;(async () => {
  const b = await pw.chromium.launch()
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
  await p.goto('http://localhost:4173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  await p.locator('section').first().screenshot({ path: out })
  await b.close()
  console.log('saved', out)
})()
