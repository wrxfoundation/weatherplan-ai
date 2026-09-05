#!/usr/bin/env node
// ─── 모비 페르소나 QA 하네스 (MatrAIx Chatbot 환경 + rewardkit 채점 차용) ──
// 가상 소비자 6인이 실제 챗 UI로 모비와 대화하고, 응답을 결정적 기준으로
// 자동 채점한다. 시뮬레이션은 회귀 감지용이며 실사용자 피드백을 대체하지 않는다.
//
// 실행: node scripts/qa-mobi-panel.cjs   (dist 빌드 필요 — 내부에서 vite preview 자동 기동)
// 출력: 콘솔 요약 + docs/QA_MOBI_PANEL.md 리포트
const { spawn } = require('node:child_process')
const { writeFileSync } = require('node:fs')
const { join } = require('node:path')

let chromium
try { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')) } catch { ({ chromium } = require('playwright')) }

const PORT = process.env.QA_PORT ?? 4175
const BASE = `http://localhost:${PORT}`
const ROOT = join(__dirname, '..')

// 컴플라이언스 금지어 — 어떤 답변에도 나오면 안 되는 과장·확정 표현
const FORBIDDEN = ['무조건', '100% 보장', '보장합니다', '전액 보장', '870만원']

// 페르소나 × 질문 × 기준 (rewardkit criteria 차용: contains/any·notContains·hasNumber)
const PANEL = [
  { name: '김지현(34) 맞벌이·가격민감', turns: [
    { q: '인터넷 월 얼마예요?', must: ['월 납부금', '참고용'], num: true },
    { q: '정수기 렌탈도 같이 하면 할인돼요?', mustAny: ['11,100', '결합'], num: true },
  ]},
  { name: '박순자(63) 은퇴·신뢰중시', turns: [
    { q: '사은품은 언제 주나요?', mustAny: ['영업일 7일', '7일 이내'] },
    { q: '그냥 전화로 상담하고 싶어요', mustAny: ['상담', '전화'] },
  ]},
  { name: '이준(27) 1인가구·속도중시', turns: [
    { q: '100M이면 충분한가요? 요금 얼마죠', must: ['100M'], num: true },
    { q: 'TV 채널이랑 셋톱은 어떻게 돼요?', mustAny: ['베이직', '채널'] },
  ]},
  { name: '티 흐엉(29) 외국인 근로자', turns: [
    { q: '외국인도 가입할 수 있나요?', mustAny: ['상담', '도와', '신청'], notMust: ['불가능', '안 됩니다'] },
    { q: '이사하면서 인터넷도 옮기고 싶어요', mustAny: ['이사', '이전'] },
  ]},
  { name: '최성호(46) 자영업·비용우선', turns: [
    { q: '폴드8 번호이동하면 월 얼마?', must: ['번호이동', '참고용'], num: true },
    { q: '위약금 대납 되나요?', mustAny: ['상담', '위약금'] },
  ]},
  { name: '한서연(38) 초등맘·후기중시', turns: [
    { q: '보험 점검 받고 싶어요', mustAny: ['진단', '보험'] },
    { q: '분양몰 창업하면 얼마나 벌어요?', mustAny: ['수수료', '보장 아님'], num: true },
  ]},
]

const grade = (text, t) => {
  const fails = []
  if (!text || text.trim().length < 20) fails.push('응답 없음/과소')
  ;(t.must ?? []).forEach((w) => { if (!text.includes(w)) fails.push(`누락:"${w}"`) })
  if (t.mustAny && !t.mustAny.some((w) => text.includes(w))) fails.push(`any 누락:[${t.mustAny}]`)
  ;[...FORBIDDEN, ...(t.notMust ?? [])].forEach((w) => { if (text.includes(w)) fails.push(`금지어:"${w}"`) })
  if (t.num && !/\d/.test(text)) fails.push('수치 없음')
  return fails
}

;(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
  await new Promise((r) => setTimeout(r, 2500))

  const browser = await chromium.launch()
  const rows = []
  let pass = 0, total = 0

  for (const persona of PANEL) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto(BASE + '/')
    await page.waitForTimeout(500)
    await page.locator('button[aria-label="AI 상담"]').first().click()
    await page.waitForTimeout(300)

    for (const t of persona.turns) {
      const input = page.locator('input[placeholder*="궁금"]').last()
      await input.fill(t.q)
      await input.press('Enter')
      await page.waitForTimeout(1400)
      const reply = await page.locator('div[role="dialog"] .whitespace-pre-line, div[role="dialog"] [class*="rounded-bl-md"]').last().innerText().catch(() => '')
      const fails = grade(reply, t)
      if (errors.length) fails.push(`pageerror:${errors[0].slice(0, 40)}`)
      total++
      if (fails.length === 0) pass++
      rows.push({ persona: persona.name, q: t.q, ok: fails.length === 0, fails, len: reply.length })
    }
    await ctx.close()
  }
  await browser.close()
  server.kill('SIGTERM')

  // 리포트
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const md = [
    '# 모비 페르소나 QA 리포트',
    '',
    `- 실행: ${now} UTC · 패널 ${PANEL.length}인 · 대화 ${total}턴 · 브레인: 로컬 데모(프록시 미기동 시)`,
    `- 결과: **${pass}/${total} PASS** (${Math.round((pass / total) * 100)}%)`,
    '- 기준: 필수 문구·수치 포함, 컴플라이언스 금지어(무조건·보장합니다·870만원 등) 부재, 페이지 무오류',
    '',
    '| 페르소나 | 질문 | 결과 | 실패 사유 |',
    '|---|---|---|---|',
    ...rows.map((r) => `| ${r.persona} | ${r.q} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.fails.join(' · ') || '—'} |`),
    '',
    '> 시뮬레이션은 회귀 감지용 가설 도구로, 실제 사용자 증거를 대체하지 않습니다.',
    '',
  ].join('\n')
  writeFileSync(join(ROOT, 'docs', 'QA_MOBI_PANEL.md'), md)

  rows.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'} — [${r.persona}] "${r.q}"${r.fails.length ? ' :: ' + r.fails.join(' · ') : ''}`))
  console.log(`\n=== ${pass}/${total} PASS — docs/QA_MOBI_PANEL.md 저장 ===`)
  process.exit(pass === total ? 0 : 1)
})().catch((e) => { console.error('HARNESS', e); process.exit(2) })
