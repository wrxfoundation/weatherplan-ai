#!/usr/bin/env node
/**
 * 지가변동률 자동 갱신 — 배포된 프록시(/api/landprice?kind=kosis)로 KOSIS 원본을 받아
 *   ① data/land_price_dong_v0.json (읍면동, scripts/land_dong.mjs 재사용)
 *   ② data/land_price_v0.json      (시군구·시도 스냅샷)
 * 두 파일을 같은 시점으로 갱신한다.
 *
 * 실행: node scripts/fetch-land.mjs --base https://<배포도메인>   (GitHub Action이 주 1회)
 *
 * 왜 표 하나로 두 파일을 만드나:
 *   ②는 원래 DT_1YL20881E(orgId 101)에서 받았지만, 같은 통계(한국부동산원 지가변동률)라
 *   DT_31501N_010의 시군구·시도 행과 값이 같다 — 2026.05 데이터로 33개 시군구 전부 일치 확인.
 *
 * 안전장치(데이터를 망가뜨리지 않기):
 *   - 키 미설정·오류면 아무것도 쓰지 않고 정상 종료(exit 0) — 주간 점검을 막지 않는다.
 *   - 받은 시점이 지금 데이터보다 새롭지 않으면 쓰지 않는다.
 *   - 기존 시군구 키의 90% 이상을 새 데이터에서 찾지 못하면(형식 변화 의심) ②를 쓰지 않는다.
 *   - 값은 원문 그대로. 빠진 키는 이전 값으로 채우지 않는다(시점이 섞이면 거짓이 되므로).
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const argBase = process.argv.indexOf('--base')
const BASE = (argBase > -1 ? process.argv[argBase + 1] : process.env.DCMAP_BASE || '').replace(/\/$/, '')
const DONG = join(ROOT, 'data/land_price_dong_v0.json')
const SGG = join(ROOT, 'data/land_price_v0.json')

const note = (m) => console.log(`[fetch-land] ${m}`)
if (!BASE) {
  note('배포 주소(--base 또는 DCMAP_BASE)가 없어 건너뜀')
  process.exit(0)
}

let body
try {
  const r = await fetch(`${BASE}/api/landprice?kind=kosis`, { signal: AbortSignal.timeout(60000) })
  body = await r.json()
} catch (e) {
  note(`프록시 호출 실패(${e.message}) — 건너뜀`)
  process.exit(0)
}
if (!body?.available) {
  note(
    body?.reason === 'not_configured'
      ? 'KOSIS_KEY가 배포 환경(Vercel env)에 없음 — 키를 넣으면 다음 점검부터 자동 갱신'
      : `KOSIS 응답 없음(${body?.reason}) — 건너뜀`,
  )
  process.exit(0)
}

const current = JSON.parse(readFileSync(DONG, 'utf8')).period
if (!(body.period > current)) {
  note(`최신 시점 ${body.period} — 보유 데이터(${current})와 같거나 이전이라 그대로 둠`)
  process.exit(0)
}
const rows = body.rows.filter((r) => r.PRD_DE === body.period)
note(`새 시점 ${current} → ${body.period} (${rows.length}행)`)

// ① 읍면동: 기존 파이프라인 재사용
const tmp = join(mkdtempSync(join(tmpdir(), 'kosis-')), `dong_${body.period}.json`)
writeFileSync(tmp, JSON.stringify(rows))
execFileSync(process.execPath, [join(ROOT, 'scripts/land_dong.mjs'), tmp], { stdio: 'inherit' })

// ② 시군구·시도 스냅샷: 기존 키 집합을 같은 시점 값으로 교체
const dong = JSON.parse(readFileSync(DONG, 'utf8'))
const sgg = JSON.parse(readFileSync(SGG, 'utf8'))
const sidoRate = Object.fromEntries(
  rows.filter((r) => r.C1.length === 2 && r.C1 !== '10').map((r) => [r.C1_NM, Number.parseFloat(r.DT)]),
)
const next = {}
const missing = []
for (const key of Object.keys(sgg.entries)) {
  const v = key.includes(' ') ? dong.entries[key]?.rate : sidoRate[key]
  if (Number.isFinite(v)) next[key] = v
  else missing.push(key)
}
const coverage = Object.keys(next).length / Object.keys(sgg.entries).length
if (coverage < 0.9) {
  note(`시군구 스냅샷: 기존 키 ${Math.round(coverage * 100)}%만 찾음 — 형식 변화 의심, land_price_v0.json은 그대로 둠`)
  process.exitCode = 0
} else {
  writeFileSync(SGG, JSON.stringify({ ...sgg, period: body.period, entries: next }, null, 2) + '\n')
  note(`시군구 스냅샷 갱신 ${Object.keys(next).length}건${missing.length ? ` (빠진 키 ${missing.join(', ')} — 시도 값으로 폴백됨)` : ''}`)
}
note('완료 — LAND PULSE 기사·docs/land-price-tracking.md의 기준월 문구는 사람이 확인')
