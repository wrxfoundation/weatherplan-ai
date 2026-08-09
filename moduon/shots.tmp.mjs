// 임시 QA — 히어로 와이드 지오메트리 검증 (플레이스홀더 씬)
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
const base = 'http://localhost:4173'
const out = '/tmp/claude-0/-home-user-weatherplan-ai/dc3bc4bb-0107-5c51-8610-56b4d0ff9dbb/scratchpad/shots5'
mkdirSync(out, { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [name, w, h] of [['hero-1440', 1440, 900], ['hero-1920', 1920, 950], ['hero-2560', 2560, 1000]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.goto(base + '/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${out}/${name}.png` })
  await p.close()
}
await b.close()
console.log('hero shots done')
