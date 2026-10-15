/* 빌드 디스패처 — vercel.json의 buildCommand('npm run build')는 고정(수정 금지 원칙).
 * 같은 레포·같은 폴더를 쓰는 두 Vercel 프로젝트를 env 하나로 분기한다:
 *   VITE_WEATHERFACT=1  → 웨더팩트 단독 빌드(build:weatherfact)
 *   (미설정)            → dcmap 기본 빌드(build:dcmap)
 * 새 프로젝트 세팅 시 빌드 커맨드 오버라이드 불필요 — env만 넣으면 된다. */
import { spawnSync } from 'node:child_process'

const wf = process.env.VITE_WEATHERFACT === '1'
const script = wf ? 'build:weatherfact' : 'build:dcmap'
console.log(`build-dispatch → ${script} (VITE_WEATHERFACT=${process.env.VITE_WEATHERFACT ?? 'unset'})`)
const r = spawnSync('npm', ['run', script], { stdio: 'inherit', env: process.env })
process.exit(r.status ?? 1)
