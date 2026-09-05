#!/usr/bin/env node
// ─── 퍼널 워크스루 하네스 (MatrAIx Web 환경 차용) ─────────────────
// 가상 사용자 3인이 서로 다른 경로로 실제 퍼널(진입→탐색→상담 신청→완료)을
// 걷고, 단계 도달·리드 생성·페이지 무오류를 자동 검증한다.
//
// 실행: node scripts/qa-funnel-walk.cjs  → 콘솔 요약 + docs/QA_FUNNEL_WALK.md
const { spawn } = require('node:child_process')
const { writeFileSync } = require('node:fs')
const { join } = require('node:path')

let chromium
try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')) } catch { ({ chromium } = require('playwright')) }

const PORT = process.env.QA_PORT ?? 4178
const BASE = `http://localhost:${PORT}`
const ROOT = join(__dirname, '..')

async function fillConsult(page, name, phone) {
  await page.locator('input[placeholder="홍길동"]').fill(name)
  await page.locator('input[placeholder="010-0000-0000"]').fill(phone)
  await page.locator('select').first().selectOption({ index: 1 }) // 지역 첫 항목
  const cat = page.locator('button:has-text("인터넷/TV")').first() // 카테고리 미선택 경로 대비
  if ((await cat.count()) && !(await cat.getAttribute('class')).includes('bg-primary')) await cat.click()
  await page.locator('button:has-text("지금 바로"), button:has-text("오전")').first().click().catch(() => {}) // 희망 시간
  await page.locator('button:has-text("[필수] 개인정보 수집·이용 동의")').click()
  await page.locator('button:has-text("무료 상담 신청하기")').click()
  await page.waitForTimeout(900)
}

const WALKS = [
  {
    name: '검색형 · 강민서 (홈 검색 → 카테고리 → 상담)',
    lead: { name: '강민서', phone: '010-9001-0001' },
    steps: async (page) => {
      await page.goto(BASE + '/')
      await page.waitForTimeout(600)
      await page.locator('input[placeholder*="검색"]').first().fill('인터넷')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(800)
      if (!page.url().includes('/category/internet')) throw new Error('검색→카테고리 이동 실패: ' + page.url())
      await page.locator('a:has-text("무료 상담"), button:has-text("상담")').first().click()
      await page.waitForTimeout(800)
      if (!page.url().includes('/consult')) throw new Error('카테고리→상담 이동 실패: ' + page.url())
    },
  },
  {
    name: '비교형 · 조유리 (계산기 → 3사 비교 → 상담)',
    lead: { name: '조유리', phone: '010-9001-0002' },
    steps: async (page) => {
      await page.goto(BASE + '/calculator')
      await page.waitForTimeout(800)
      await page.locator('button:has(span:text("실질가 최저"))').first().click()
      await page.waitForTimeout(400)
      await page.locator('button:has-text("상담 신청하고 혜택 확정하기")').first().click()
      await page.waitForTimeout(800)
      if (!page.url().includes('/consult')) throw new Error('계산기→상담 이동 실패: ' + page.url())
    },
  },
  {
    name: '스캔형 · 문태호 (명세서 스캔 → 갈아타기 상담)',
    lead: { name: '문태호', phone: '010-9001-0003' },
    steps: async (page) => {
      await page.goto(BASE + '/calculator')
      await page.waitForTimeout(800)
      await page.setInputFiles('input[aria-label="명세서 업로드"]', { name: 'bill.png', mimeType: 'image/png', buffer: Buffer.alloc(50, 1) })
      await page.waitForTimeout(1800)
      await page.locator('button:has-text("이 조건으로 갈아타기 상담")').click()
      await page.waitForTimeout(800)
      if (!page.url().includes('/consult')) throw new Error('스캔→상담 이동 실패: ' + page.url())
    },
  },
]

;(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
  await new Promise((r) => setTimeout(r, 2500))
  const browser = await chromium.launch()
  const rows = []

  for (const w of WALKS) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    const t0 = Date.now()
    let fail = ''
    try {
      await w.steps(page)
      await fillConsult(page, w.lead.name, w.lead.phone)
      const done = await page.locator('h1:text-is("신청 완료!")').count()
      if (!done) fail = '완료 화면 미도달'
      else {
        const created = await page.evaluate((nm) => {
          const db = JSON.parse(localStorage.getItem('moduon_db_v1'))
          return (db.leads ?? []).some((l) => l.name === nm)
        }, w.lead.name)
        if (!created) fail = '리드 미생성'
      }
    } catch (e) { fail = String(e.message ?? e).slice(0, 90) }
    if (!fail && errors.length) fail = `pageerror: ${errors[0].slice(0, 60)}`
    rows.push({ name: w.name, ok: !fail, fail, ms: Date.now() - t0 })
    await ctx.close()
  }
  await browser.close()
  server.kill('SIGTERM')

  const pass = rows.filter((r) => r.ok).length
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const md = [
    '# 퍼널 워크스루 리포트',
    '',
    `- 실행: ${now} UTC · 경로 ${rows.length}개 (검색형/비교형/스캔형)`,
    `- 결과: **${pass}/${rows.length} PASS**`,
    '- 기준: 각 단계 도달 · "신청 완료!" 화면 · 리드 실제 생성 · 페이지 무오류',
    '',
    '| 경로 | 결과 | 소요 | 실패 사유 |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${(r.ms / 1000).toFixed(1)}s | ${r.fail || '—'} |`),
    '',
    '> 워크스루는 회귀 감지용이며 실제 사용자 행동 데이터를 대체하지 않습니다.',
    '',
  ].join('\n')
  writeFileSync(join(ROOT, 'docs', 'QA_FUNNEL_WALK.md'), md)
  rows.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'} — ${r.name} (${(r.ms / 1000).toFixed(1)}s)${r.fail ? ' :: ' + r.fail : ''}`))
  console.log(`\n=== ${pass}/${rows.length} PASS — docs/QA_FUNNEL_WALK.md 저장 ===`)
  process.exit(pass === rows.length ? 0 : 1)
})().catch((e) => { console.error('HARNESS', e); process.exit(2) })
