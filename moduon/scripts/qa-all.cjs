// ─── 원커맨드 QA (sip 반사신경 실체화) ───────────────────────────────
// "만들었으면 맛본다" — 변경 직후 이 한 명령으로 빌드+스모크 전부를 돌린다.
//   npm run qa          : 빌드 → preview 기동 → 스모크(arena·press) → 정리
//   npm run qa -- --full: 위 + 모비 패널·퍼널 워크스루(자체 preview 스폰형)까지
// 종료 코드 0 = 전부 통과. 실패 시 어떤 하네스가 죽었는지 요약한다.
const { execSync, spawn } = require('node:child_process')
const { join } = require('node:path')

const root = join(__dirname, '..')
const full = process.argv.includes('--full')
const run = (cmd, opts = {}) => execSync(cmd, { cwd: root, stdio: 'inherit', ...opts })

const results = []
const step = (name, fn) => {
  process.stdout.write(`\n━━ ${name} ━━\n`)
  try { fn(); results.push([name, true]) } catch { results.push([name, false]) }
}

;(async () => {
  step('빌드', () => run('npm run build'))

  // preview 기동 (외부 preview를 쓰는 스모크용) — 기존 프로세스가 있으면 재사용
  let preview = null
  const boot = () => new Promise((resolve) => {
    preview = spawn('npx', ['vite', 'preview', '--port', '4173'], { cwd: root, stdio: 'ignore', detached: true })
    setTimeout(resolve, 2500)
  })
  await boot()

  step('스모크: 어드민 4-아레나', () => run('node scripts/qa-arena-smoke.cjs'))
  step('스모크: 프레스룸', () => run('node scripts/qa-press-smoke.cjs'))
  step('스모크: 휴대폰 계산기', () => run('node scripts/qa-phone-smoke.cjs'))
  step('스모크: 렌탈 계산기·가망고객', () => run('node scripts/qa-rental-smoke.cjs'))

  if (preview) { try { process.kill(-preview.pid) } catch { /* 이미 종료 */ } }

  if (full) {
    // 아래 둘은 스스로 preview를 띄우고 내리는 하네스
    step('모비 페르소나 패널(12턴×6인)', () => run('node scripts/qa-mobi-panel.cjs'))
    step('퍼널 워크스루(3경로)', () => run('node scripts/qa-funnel-walk.cjs'))
  }

  const fail = results.filter(([, ok]) => !ok)
  process.stdout.write('\n━━ QA 요약 ━━\n')
  for (const [name, ok] of results) process.stdout.write(`${ok ? 'PASS' : 'FAIL'}  ${name}\n`)
  process.stdout.write(fail.length === 0 ? '✔ 전부 통과 — 커밋해도 됩니다\n' : `✘ ${fail.length}개 실패 — 커밋 전에 고치세요\n`)
  process.exit(fail.length === 0 ? 0 : 1)
})()
