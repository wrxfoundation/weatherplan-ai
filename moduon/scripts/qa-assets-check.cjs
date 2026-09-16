// 스모크 — /assets/ 참조와 실제 공급원이 어긋나지 않는지 (브라우저 없이 정적 검사)
//
// 2026-09 사고: 시드가 가리키던 21:9 배너 7종이 생성 CDN 에서 사라져 빌드가 403 을 받았고,
// 에셋 스크립트가 경고만 남기고 통과해 히어로가 빈 그라디언트로 배포됐다.
// 빌드 쪽 방어는 fetch-assets.mjs 의 CRITICAL + ASSETS_STRICT 가 맡고,
// 여기서는 그 앞단 — "코드가 가리키는 파일을 아무도 공급하지 않는" 상태를 막는다.
//   공급원은 둘 중 하나여야 한다: ① fetch-assets.mjs 의 다운로드 목록 ② 레포에 커밋된 파일
const { readFileSync, readdirSync, existsSync, statSync } = require('node:fs')
const { join, relative } = require('node:path')

const root = join(__dirname, '..')
let fail = 0
const check = (ok, label) => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`) }

// ① 다운로드 목록
const fetchSrc = readFileSync(join(root, 'scripts/fetch-assets.mjs'), 'utf8')
const fetched = new Set([...fetchSrc.matchAll(/^\s*\['([\w.-]+)',/gm)].map((m) => m[1]))
check(fetched.size > 0, `fetch-assets 목록 ${fetched.size}종`)

// ② 레포에 커밋된 파일 (public/assets 이하 전부, cars/ 는 별도 스크립트 소관이라 제외)
const committed = new Set()
const walk = (dir, prefix = '') => {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { if (name !== 'cars') walk(p, `${prefix}${name}/`) } else committed.add(`${prefix}${name}`)
  }
}
walk(join(root, 'public/assets'))

// ③ 소스가 가리키는 /assets/ 경로 — 차량 이미지(cars/)는 제휴사 스크립트가 따로 채운다
const refs = new Map() // path → [where]
const scan = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { scan(p); continue }
    if (!/\.(jsx?|mjs|cjs|css|html)$/.test(name)) continue
    const text = readFileSync(p, 'utf8')
    for (const m of text.matchAll(/\/assets\/([\w./-]+\.(?:png|jpg|jpeg|webp|svg|mp4))/g)) {
      if (m[1].startsWith('cars/')) continue
      if (!refs.has(m[1])) refs.set(m[1], [])
      refs.get(m[1]).push(relative(root, p))
    }
  }
}
scan(join(root, 'src')) // src 만 훑는다 — dist/node_modules 를 긁으면 빌드 산출물의 옛 경로가 섞여 든다
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8')
for (const m of indexHtml.matchAll(/\/assets\/([\w./-]+\.(?:png|jpg|jpeg|webp|svg|mp4))/g)) {
  if (!refs.has(m[1])) refs.set(m[1], [])
  refs.get(m[1]).push('index.html')
}
check(refs.size > 0, `소스가 참조하는 에셋 ${refs.size}종`)

// ④ 공급원 없는 참조 = 배포에서 404
const orphans = [...refs.entries()].filter(([f]) => !fetched.has(f) && !committed.has(f))
check(orphans.length === 0, orphans.length === 0
  ? '모든 참조에 공급원 있음 (다운로드 목록 또는 커밋된 파일)'
  : `공급원 없는 참조 ${orphans.length}건 — ${orphans.map(([f, w]) => `${f} ← ${w[0]}`).join(' / ')}`)

// ⑤ 아무도 안 쓰는 다운로드 = 빌드 시간 낭비 (경고만 — 예비 에셋일 수 있다)
const unused = [...fetched].filter((f) => !refs.has(f))
if (unused.length) console.log(`INFO  참조되지 않는 다운로드 ${unused.length}종 (예비 가능): ${unused.join(' ')}`)

console.log(fail === 0 ? '\nSMOKE: ALL PASS' : `\nSMOKE: ${fail} FAIL`)
process.exit(fail === 0 ? 0 : 1)
