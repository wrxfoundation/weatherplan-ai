// ─── PreToolUse(Bash) 가드 ────────────────────────────────────────────
// ECC의 hooks/ 구조를 우리 규모로 가져온 것. 문서에만 있던 규칙 중
// "이 세션에서 실제로 당한" 4가지만 실행 가능한 차단으로 바꿨다.
// 규칙을 늘리려면 근거가 있어야 한다 — 겪지 않은 실패는 여기 넣지 않는다.
//
// 원칙: 내부 오류·판단 불가 시 무조건 통과(fail open).
//       훅이 일을 막는 것은 훅이 없는 것보다 나쁘다.
const { execFileSync } = require('node:child_process')
const { join } = require('node:path')

const REPO = join(__dirname, '..', '..')
const MODUON = join(REPO, 'moduon')

const allow = () => process.exit(0)
const deny = (reason) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }))
  process.exit(0)
}

let raw = ''
process.stdin.on('data', (c) => { raw += c })
process.stdin.on('end', () => { try { main(JSON.parse(raw || '{}')) } catch { allow() } })
setTimeout(allow, 8000).unref() // stdin이 안 닫혀도 매달리지 않는다

function main(input) {
  const cmd = String(input?.tool_input?.command ?? '')
  if (!cmd.trim()) allow()

  // ① 자기 자신을 죽이는 pkill — 패턴이 이 명령줄 자체에 매칭돼 셸이 먼저 죽는다.
  //    이 세션에서 두 번 당했다(exit 144). 대괄호 한 글자로 자기매칭을 끊는다.
  const selfKill = /\bpkill\s+(-\w+\s+)*-\w*f\w*\s+(["']?)([^"'|;&]*?)\2(\s|$)/.exec(cmd)
  if (selfKill) {
    const pat = selfKill[3]
    // 대괄호가 있으면 이미 자기매칭을 끊은 것
    if (pat && !pat.includes('[') && new RegExp(escapeRe(pat)).test(cmd)) {
      deny(`pkill 패턴 "${pat}" 이 이 명령줄 자체에 매칭돼 셸이 먼저 죽습니다 (exit 144).\n`
        + `대괄호로 자기매칭을 끊으세요: ${suggestBracket(pat)}`)
    }
  }

  // ② 레포 루트에서 npm run build/qa/dev — 루트는 Next(weatherplan), moduon은 Vite.
  //    루트에서 돌리면 엉뚱한 앱을 빌드한다.
  if (/^\s*npm\s+(run\s+)?(build|qa|dev|preview)\b/.test(cmd) && !/\bcd\s+\S*moduon/.test(cmd)) {
    deny('레포 루트에서 실행하려 합니다. 루트는 Next(Weather Plan AI), moduon은 Vite로 별개 앱입니다.\n'
      + '`cd moduon && ' + cmd.trim() + '` 로 실행하세요.')
  }

  if (!/\bgit\s+commit\b/.test(cmd)) allow()

  // ③ -m 메시지에 괄호 — 이 세션에서 커밋이 조용히 실패했다. 파일로 넘긴다.
  const m = /\bgit\s+commit\b[^\n]*?\s-\w*m\w*\s+(["'])([\s\S]*?)\1/.exec(cmd)
  if (m && /[()`$]/.test(m[2])) {
    deny('커밋 메시지에 괄호·백틱·$ 가 있어 셸 파싱이 깨집니다 (이 세션에서 커밋이 조용히 실패한 원인).\n'
      + '메시지를 파일에 쓰고 `git commit -F <파일>` 로 넘기세요.')
  }

  // ④ QA 합격 도장 — moduon 소스를 건드린 커밋은 npm run qa 통과본이어야 한다.
  let stamp
  try { stamp = require(join(MODUON, 'scripts', 'lib', 'qa-stamp.cjs')) } catch { allow() }

  let touched, current, recorded
  try {
    const staged = git(['diff', '--cached', '--name-only'])
    // -a / -am 이나 경로 인자를 쓰면 인덱스 밖의 수정본도 함께 들어간다
    const sweeping = /\bgit\s+commit\b[^\n]*\s-\w*a\w*(\s|$)/.test(cmd)
    const names = sweeping ? staged.concat(git(['diff', '--name-only'])) : staged
    touched = names.some((f) => stamp.WATCHED.some((w) => f.startsWith(`moduon/${w}`)))
    if (!touched) allow() // 문서·에셋만 고친 커밋은 게이트 대상이 아니다
    current = stamp.sourceHash()
    recorded = stamp.read()
  } catch { allow() }

  if (recorded === current) allow()
  deny(recorded === null
    ? 'moduon 소스를 건드린 커밋인데 이 소스로 QA를 돌린 적이 없습니다.\n'
      + '`cd moduon && npm run qa` 로 8개 스모크를 통과시킨 뒤 커밋하세요.'
    : 'QA 통과 이후 moduon 소스가 다시 바뀌었습니다 — 지금 상태는 검증되지 않았습니다.\n'
      + '`cd moduon && npm run qa` 를 다시 돌린 뒤 커밋하세요.')
}

function git(args) {
  return execFileSync('git', args, { cwd: REPO }).toString('utf8').split('\n').filter(Boolean)
}
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// 첫 알파벳 한 글자를 [x] 로 감싸 자기매칭만 끊는다 (의미는 그대로)
function suggestBracket(pat) {
  const i = pat.search(/[A-Za-z]/)
  if (i < 0) return pat
  return `"${pat.slice(0, i)}[${pat[i]}]${pat.slice(i + 1)}"`
}
