#!/usr/bin/env node
/**
 * 화면 스모크 — 빌드 결과를 헤드리스 크로미움으로 열어 라우트마다 확인한다(CI 품질 게이트).
 *   - 런타임 예외(pageerror) 0
 *   - 본문이 실제로 그려짐(#root 텍스트)
 *   - 모바일 390px에서 가로 넘침 없음
 * /api/* 프록시는 vite preview에 없어 실패하는 게 정상 — 콘솔 오류·네트워크 실패는 판정에서 뺀다.
 *
 *   npx vite preview --port 4173 &   node scripts/smoke.mjs http://localhost:4173
 *   CHROME_PATH=/path/to/chrome 로 실행 파일 지정 가능
 */
const BASE = (process.argv[2] || 'http://localhost:4173').replace(/\/$/, '')
const ROUTES = ['/', '/map3d', '/calc', '/dashboard', '/data', '/stats', '/land', '/compare', '/pricing',
  '/insights', '/insights/ops-timing-2026', '/roadmap', '/benchmark', '/glossary', '/about', '/global',
  '/methodology', '/report-sample', '/dc/naver-gak-chuncheon', '/region/busan', '/region/gyeonggi']
const VIEWS = [
  { lang: 'ko', w: 1280 },
  { lang: 'ko', w: 390 },
  { lang: 'en', w: 1280 },
]

let pw
try {
  pw = await import('playwright')
} catch {
  pw = await import('playwright-core')
}
const browser = await pw.chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
const fails = []
for (const route of ROUTES) {
  for (const v of VIEWS) {
    const mobile = v.w < 600
    const ctx = await browser.newContext({ viewport: { width: v.w, height: 900 }, isMobile: mobile, hasTouch: mobile })
    await ctx.addInitScript((l) => localStorage.setItem('aimap-lang', l), v.lang)
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    const tag = `${route} [${v.lang} ${v.w}]`
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(2500)
      const textLen = await page.evaluate(() => document.getElementById('root')?.innerText.trim().length ?? 0)
      const overflow = mobile && (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1))
      if (errors.length) fails.push(`${tag} 예외: ${errors[0]}`)
      if (textLen < 50) fails.push(`${tag} 본문이 비어 있음(${textLen}자)`)
      if (overflow) fails.push(`${tag} 가로 넘침`)
    } catch (e) {
      fails.push(`${tag} 로드 실패: ${e.message}`)
    }
    await ctx.close()
  }
}
await browser.close()
const total = ROUTES.length * VIEWS.length
if (fails.length) {
  console.error(`스모크 실패 ${fails.length}/${total}\n- ${fails.join('\n- ')}`)
  process.exit(1)
}
console.log(`스모크 통과 ${total}/${total}`)
