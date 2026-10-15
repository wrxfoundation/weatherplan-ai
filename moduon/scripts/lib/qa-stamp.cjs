// ─── QA 합격 도장 ─────────────────────────────────────────────────────
// "이 소스 상태로 QA가 통과했다"를 한 줄 해시로 남긴다.
// qa-all.cjs 가 찍고, .claude/hooks/guard.cjs 가 읽는다 — 해시 계산은 여기 한 곳에만.
const { createHash } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const { readFileSync, existsSync, writeFileSync } = require('node:fs')
const { join } = require('node:path')

const MODUON = join(__dirname, '..', '..')
const STAMP = join(MODUON, '.qa-pass')
// QA가 실제로 검증하는 범위. 여기 밖(문서·에셋)만 고친 커밋은 게이트를 지나간다.
const WATCHED = ['src', 'scripts', 'index.html', 'package.json', 'vite.config.js', 'tailwind.config.js']

// 워킹트리 기준 해시 — 스테이징 여부와 무관하게 "지금 디스크에 있는 소스"를 본다.
// -c(추적) + -o(미추적) --exclude-standard(ignore 제외)를 함께 봐야 하는 이유:
//  · -c 만 보면 파일을 git add 하는 것만으로 해시가 바뀐다(코드는 그대로인데 게이트가 뜬다)
//  · 새로 만든 미추적 소스가 도장에서 빠져, QA가 검증한 범위와 도장이 어긋난다
function sourceHash() {
  const listed = execFileSync('git', ['ls-files', '-z', '-c', '-o', '--exclude-standard', '--', ...WATCHED], { cwd: MODUON })
  const files = [...new Set(listed.toString('utf8').split('\0').filter(Boolean))].sort()
  const h = createHash('sha256')
  for (const f of files) {
    h.update(f)
    h.update('\0')
    try { h.update(readFileSync(join(MODUON, f))) } catch { h.update('<missing>') } // 삭제된 추적 파일
    h.update('\0')
  }
  return h.digest('hex')
}

const write = () => writeFileSync(STAMP, sourceHash() + '\n')
const read = () => (existsSync(STAMP) ? readFileSync(STAMP, 'utf8').trim() : null)

module.exports = { MODUON, STAMP, WATCHED, sourceHash, write, read }
