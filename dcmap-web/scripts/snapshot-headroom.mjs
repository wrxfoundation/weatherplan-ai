#!/usr/bin/env node
/*
 * 변전소 여유 월별 스냅샷 수집기 v2 (데이터 자산화)
 * ─────────────────────────────────────────────────────────────
 * 한전ON 변전소 여유용량을 배포된 프록시(api/headroom.js)로 받아
 * data/headroom_snapshots/<YYYY-MM>.json 으로 버전 저장한다.
 * 쌓인 스냅샷은 사이트의 「계통 여유 변화」 피드와 시군구별 수전 여유 표가 된다.
 *
 * 실행:
 *   SNAPSHOT_BASE="https://<배포도메인>" node scripts/snapshot-headroom.mjs [--force]
 *   GitHub Action(.github/workflows/dcmap-data.yml)이 매월 첫 주 자동 실행.
 *
 * 수집 대상: data/headroom_targets.json v2 — 시군구 단위(법정동코드 5자리). 시군구 안의 154kV 변전소 전부.
 *   (v1은 변전소 2곳을 이름으로 지정했다.)
 *
 * 정직성/보안:
 *   - API 키는 프록시(서버) env에만. 이 스크립트·저장소엔 키 금지.
 *   - 응답 값을 그대로 담는다. 0은 '당해 여유 없음'(정상값), 응답에 없던 흐름은 null.
 *   - 대상의 절반 넘게 실패하면 저장하지 않는다(부분 수집이 '여유 사라짐'처럼 보이는 것 방지).
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseTrans } from './lib/headroom-parse.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../data/headroom_snapshots')
const TARGETS_FILE = resolve(__dirname, '../data/headroom_targets.json')
const BASE = (process.env.SNAPSHOT_BASE || 'http://localhost:3000').replace(/\/$/, '')
const DEFAULT_YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function ym() {
  if (process.env.SNAPSHOT_MONTH) return process.env.SNAPSHOT_MONTH
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

async function fetchTarget(t) {
  const url = `${BASE}/api/headroom?trans=1&admCd=${t.admCd}&kv=154`
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(40000) })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const j = await r.json()
      if (!j.available) throw new Error(j.reason || 'unavailable')
      return j
    } catch (e) {
      if (attempt === 3) {
        console.warn(`  ! ${t.sido} ${t.sigungu}(${t.admCd}) 실패: ${e.message}`)
        return null
      }
      await sleep(1500 * attempt)
    }
  }
  return null
}

async function main() {
  const month = ym()
  const manifest = JSON.parse(await readFile(TARGETS_FILE, 'utf8'))
  const targets = manifest.targets || []
  console.log(`▶ 변전소 여유 스냅샷 ${month} — 대상 시군구 ${targets.length}곳, base=${BASE}`)

  const entries = []
  let ok = 0
  let years = DEFAULT_YEARS
  for (const t of targets) {
    const j = await fetchTarget(t)
    if (j) {
      ok++
      const ys = j.supply?.kv154?.[0]?.years || j.renew?.kv154?.[0]?.years
      if (Array.isArray(ys) && ys.length) years = ys
      entries.push(...parseTrans(j, t, years))
    }
    await sleep(250) // 한전 측 부하 배려
  }
  if (ok < Math.ceil(targets.length / 2)) {
    console.error(`성공 ${ok}/${targets.length} — 절반 미만이라 저장하지 않음(부분 수집이 '여유 소멸'로 보이는 것 방지).`)
    process.exit(1)
  }
  await mkdir(OUT_DIR, { recursive: true })
  const file = resolve(OUT_DIR, `${month}.json`)
  const snapshot = {
    asOf: month,
    version: 2,
    source: '한국전력공사 한전ON — 전력계통 통합정보 변전소 검색(송전망 여유용량)',
    captured: 'auto',
    capturedAt: new Date().toISOString().slice(0, 10),
    note: `시군구 ${ok}/${targets.length}곳 · 변전소 ${entries.length}곳. supply=154kV 수전 여유, supply23=22.9kV, renew=재생e 연계 여유. 0=당해 여유 없음, null=응답에 없음. 전기사용신청 후 확정.`,
    years,
    entries,
  }
  await writeFile(file, JSON.stringify(snapshot) + '\n', 'utf8')
  console.log(`✓ 저장 ${file} — 시군구 ${ok}/${targets.length} · 변전소 ${entries.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
