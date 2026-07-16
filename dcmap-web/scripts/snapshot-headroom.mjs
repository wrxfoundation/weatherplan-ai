#!/usr/bin/env node
/*
 * P1 · 변전소 여유 월별 스냅샷 수집기 (데이터 자산화)
 * ─────────────────────────────────────────────────────────────
 * 한전ON 변전소 여유용량을 배포된 프록시(api/headroom.js)로 받아
 * data/headroom_snapshots/<YYYY-MM>.json 으로 버전 저장한다.
 * 시점 스냅샷이 쌓이면 → 시계열/변화 피드(P3)·모니터링 구독 상품의 기반이 된다.
 *
 * 실행:
 *   SNAPSHOT_BASE="https://<배포도메인>" node scripts/snapshot-headroom.mjs
 * 스케줄(권장): GitHub Action(월 1회, workflow_dispatch 포함) 또는 Vercel Cron.
 *
 * 정직성/보안:
 *   - API 키(KEPCO/data.go.kr)는 프록시(서버)의 env에만 둔다. 이 스크립트·레포엔 키 금지.
 *   - 프록시 응답을 그대로 스냅샷에 담고, captured='auto'/asOf 태깅. 값 가공·조작 금지.
 *   - 여유 0 == 당해 여유 없음(정상값). 전기사용신청 후 최종 확정 — 원문 유의사항 유지.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../data/headroom_snapshots')
const BASE = process.env.SNAPSHOT_BASE || 'http://localhost:3000'
const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032]

// 수집 대상: [라벨, 법정동코드(admCd 10자리), 시도, 시군구]. 확장 시 여기에 추가.
const TARGETS = [
  ['가평', '4182025000', '경기', '가평군 가평읍'],
  ['미금', '4182025000', '경기', '가평군 가평읍'],
  // TODO: 수도권/비수도권 주요 시군구 법정동코드로 확장(자동 대상 목록화).
]

function ym() {
  // 스냅샷 월(YYYY-MM). CI 환경변수 SNAPSHOT_MONTH로 오버라이드 가능.
  if (process.env.SNAPSHOT_MONTH) return process.env.SNAPSHOT_MONTH
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

async function fetchOne([label, admCd, sido, area]) {
  const url = `${BASE}/api/headroom?trans=1&admCd=${admCd}&kv=154`
  try {
    const r = await fetch(url, { headers: { accept: 'application/json' } })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const j = await r.json()
    // 프록시 스키마(api/headroom.js transHandler): { supply, renew, ... }
    const list = j?.supply?.list || j?.renew?.list || []
    const hit = list.find((e) => (e.name || '').includes(label)) || list[0]
    if (!hit) return null
    const series = YEARS.map((y) => Number(hit.byYear?.[y] ?? hit[String(y)] ?? 0) || 0)
    return { name: label, sido, area, series, genMw: Number(hit.genMw || 0), applicants: Number(hit.applicants || 0) }
  } catch (e) {
    console.warn(`  ! ${label}(${admCd}) 실패: ${e.message} — 스킵`)
    return null
  }
}

async function main() {
  const month = ym()
  console.log(`▶ 변전소 여유 스냅샷 ${month} — 대상 ${TARGETS.length}건, base=${BASE}`)
  const entries = (await Promise.all(TARGETS.map(fetchOne))).filter(Boolean)
  if (!entries.length) {
    console.error('수집 0건 — 프록시/네트워크 확인. 기존 스냅샷 보존(덮어쓰기 안 함).')
    process.exit(1)
  }
  const snapshot = {
    asOf: month,
    version: 1,
    source: '한국전력공사 한전ON — 전력계통 통합정보 변전소 검색(송전망 여유용량)',
    captured: 'auto',
    note: `자동 수집(${entries.length}건). 0=당해 여유 없음, 전기사용신청 후 확정.`,
    years: YEARS,
    entries,
  }
  await mkdir(OUT_DIR, { recursive: true })
  const file = resolve(OUT_DIR, `${month}.json`)
  await writeFile(file, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')
  console.log(`✓ 저장 ${file} (${entries.length}건)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
