#!/usr/bin/env node
/*
 * 관측지점 좌표 검증 파이프라인 — verified:false 부채 해소
 * ─────────────────────────────────────────────────────────────
 * 기상청 API허브 지점정보(stn_inf)로 src/verify/stationsData.js 의 근사 좌표를
 * 공식 지점 메타데이터 좌표로 교체하고 STATIONS_META.verified=true 로 갱신한다.
 *
 * 실행 (로컬/CI 수동 실행 전용 — 빌드에 연결하지 말 것):
 *   KMA_APIHUB_KEY=<인증키> node scripts/verify-stations.mjs
 *
 * AWS 모드 (관측망 확대 로드맵 1단계 — docs/appraisal-standard-notes.md ③ 참조):
 *   STN_INF=AWS KMA_APIHUB_KEY=<인증키> node scripts/verify-stations.mjs
 *   → stn_inf.php inf=AWS 로 AWS 지점 목록을 받아 src/verify/awsStationsData.js 를
 *     '생성'한다(ASOS stationsData.js 교체 로직과 별개 — 기존 파일은 건드리지 않음).
 *
 * 안전장치 (하나라도 미달이면 파일에 아무것도 쓰지 않는다):
 *   - 파싱 좌표는 한국 bbox(위도 32~40, 경도 123~132) 안에 있어야 함
 *   - ASOS 모드: 기존 73지점 중 60개 이상이 상류 데이터와 매칭돼야 함
 *   - AWS 모드: 유효 지점 300개 이상이어야 함(전국 약 500지점 대비 하한)
 *
 * 정직성:
 *   - 가짜 값 금지 — 상류에서 못 받은 지점은 좌표를 지어내지 않고 목록에서 제거·보고.
 *   - STN_INF_URL 은 문서 기반의 합리적 추정 엔드포인트(가정). 다르면 아래 상수만 교체.
 *     (docs/verify-stations-pipeline.md 참조)
 */
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATIONS_FILE = resolve(__dirname, '../src/verify/stationsData.js')

// ── 상류 엔드포인트 (가정 — 실행 검증 전. 실제 경로가 다르면 이 상수만 교체) ──
const STN_INF_URL = 'https://apihub.kma.go.kr/api/typ01/url/stn_inf.php'
const STN_INF_PARAMS = { inf: 'SFC', tm: '', stn: '' } // SFC=지상(ASOS) 지점정보
const AWS_INF_PARAMS = { inf: 'AWS', tm: '', stn: '' } // AWS 지점정보 — inf=AWS 역시 가정

// ── 모드: 환경변수 STN_INF=AWS 지정 시 AWS 지점 목록 생성 모드 ──────────────
const MODE = process.env.STN_INF === 'AWS' ? 'AWS' : 'ASOS'
const AWS_FILE = resolve(__dirname, '../src/verify/awsStationsData.js')

// ── 안전장치 상수 ───────────────────────────────────────────────────────────
const KR_BBOX = { latMin: 32, latMax: 40, lonMin: 123, lonMax: 132 }
const MIN_MATCH = 60 // ASOS: 기존 73지점 중 최소 매칭 수 — 미달 시 쓰기 금지
const MIN_AWS = 300 // AWS: 유효 지점 최소 수 — 미달 시 쓰기 금지

const KEY = process.env.KMA_APIHUB_KEY

function usage() {
  console.log(`사용법: KMA_APIHUB_KEY=<인증키> node scripts/verify-stations.mjs
       STN_INF=AWS KMA_APIHUB_KEY=<인증키> node scripts/verify-stations.mjs  (AWS 지점 목록 생성)

KMA_APIHUB_KEY 환경변수가 없어 실행하지 않았습니다(에러 아님).
인증키 발급: apihub.kma.go.kr 가입 → 마이페이지 인증키.
상세: docs/verify-stations-pipeline.md, docs/appraisal-standard-notes.md`)
}

function inBbox(lat, lon) {
  return (
    lat >= KR_BBOX.latMin && lat <= KR_BBOX.latMax &&
    lon >= KR_BBOX.lonMin && lon <= KR_BBOX.lonMax
  )
}

// 하버사인 거리(km) — 스크립트 자체 구현(verifyEngine 미의존)
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

async function fetchStnInf(params = STN_INF_PARAMS) {
  const qs = new URLSearchParams({ ...params, authKey: KEY })
  const url = `${STN_INF_URL}?${qs}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`상류 HTTP ${r.status} — ${STN_INF_URL}`)
  // typ01 텍스트 응답은 EUC-KR인 경우가 많음 — 바이트로 받아 디코딩 시도
  const buf = await r.arrayBuffer()
  try {
    return new TextDecoder('euc-kr').decode(buf)
  } catch {
    return new TextDecoder('utf-8').decode(buf)
  }
}

/* 공백 구분 텍스트 파싱.
 * 헤더 주석행(# 시작)에서 STN/LON/LAT/STN_KO 컬럼 인덱스를 찾고,
 * 헤더를 못 찾으면 문서화된 순서(STN LON LAT ...)로 위치 기반 파싱한다. */
function parseStnInf(text) {
  const lines = text.split(/\r?\n/)
  let idx = { STN: 0, LON: 1, LAT: 2, STN_KO: -1, STN_EN: -1 }
  for (const line of lines) {
    if (!line.startsWith('#')) continue
    const cols = line.slice(1).trim().split(/\s+/)
    const iStn = cols.indexOf('STN')
    const iLon = cols.indexOf('LON')
    const iLat = cols.indexOf('LAT')
    if (iStn >= 0 && iLon >= 0 && iLat >= 0) {
      idx = {
        STN: iStn,
        LON: iLon,
        LAT: iLat,
        STN_KO: cols.indexOf('STN_KO'),
        STN_EN: cols.indexOf('STN_EN'),
      }
      break
    }
  }
  const rows = []
  let skipped = 0
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const cols = t.split(/\s+/)
    const id = Number(cols[idx.STN])
    const lon = Number(cols[idx.LON])
    const lat = Number(cols[idx.LAT])
    if (!Number.isInteger(id) || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      skipped++
      continue
    }
    if (!inBbox(lat, lon)) {
      skipped++
      continue
    }
    const nameKo = idx.STN_KO >= 0 ? cols[idx.STN_KO] : null
    const nameEn = idx.STN_EN >= 0 ? cols[idx.STN_EN] : null
    rows.push({ id, lat, lon, nameKo, nameEn })
  }
  return { rows, skipped }
}

function renderStationsFile(stations, updatedYm) {
  const body = stations
    .map(
      (s) =>
        `  { id: ${s.id}, name: '${s.name}', nameEn: '${s.nameEn}', lat: ${s.lat}, lon: ${s.lon}, since: ${s.since} },`
    )
    .join('\n')
  return `/* 기상청 ASOS(종관기상관측) 주요 지점 목록 — 과거 기상 검증(verify) 매칭 엔진용.
 * 정직성 원칙: 지점번호·지점명은 기상청 공개 지점 메타데이터 기준의 실존 지점만 수록.
 * 좌표(lat/lon)는 기상청 API허브 지점정보(stn_inf) 공식값으로 검증·교체됨.
 * 이 파일은 scripts/verify-stations.mjs 가 재작성한다 — 수동 편집은 다음 실행에서 덮어써짐. */

export const ASOS_STATIONS = [
${body}
]

export const STATIONS_META = {
  source: '기상청 API허브 지점정보(stn_inf)',
  verified: true,
  note: '공식 지점 메타데이터 기준',
  updated: '${updatedYm}',
}
`
}

/* ── AWS 모드: src/verify/awsStationsData.js 생성 ──────────────────────────
 * ASOS 파일(stationsData.js) 교체 로직과 완전히 별개 — 기존 파일은 읽지도 쓰지도 않는다.
 * 스키마는 ASOS 와 동일 + kind:'AWS'. 상류에서 못 받은 값(nameEn·since)은
 * 지어내지 않고 null 로 둔다(정직성). */
function renderAwsFile(stations, updatedYm) {
  const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "\\'")}'`)
  const body = stations
    .map(
      (s) =>
        `  { id: ${s.id}, name: ${q(s.name)}, nameEn: ${q(s.nameEn)}, lat: ${s.lat}, lon: ${s.lon}, since: ${s.since == null ? 'null' : s.since}, kind: 'AWS' },`
    )
    .join('\n')
  return `/* 기상청 AWS(방재기상관측) 지점 목록 — 과거 기상 검증(verify) 매칭 엔진용.
 * 스키마는 stationsData.js(ASOS)와 동일 + kind:'AWS'.
 * 좌표는 기상청 API허브 지점정보(stn_inf, inf=AWS) 공식값. 상류에서 제공되지 않은
 * 항목(nameEn·since 등)은 값을 지어내지 않고 null — 정직성 원칙.
 * 이 파일은 scripts/verify-stations.mjs (STN_INF=AWS) 가 생성한다 — 수동 편집은 다음 실행에서 덮어써짐. */

export const AWS_STATIONS = [
${body}
]

export const AWS_STATIONS_META = {
  source: '기상청 API허브 지점정보(stn_inf, inf=AWS)',
  kind: 'AWS',
  verified: true,
  note: '공식 지점 메타데이터 기준 — nameEn·since 는 상류 미제공 시 null',
  updated: '${updatedYm}',
}
`
}

async function generateAwsStations() {
  console.log(`▶ AWS 지점 목록 생성 — 상류 ${STN_INF_URL} (inf=AWS, 실행 검증 전 가정 엔드포인트)`)
  const text = await fetchStnInf(AWS_INF_PARAMS)
  const { rows, skipped } = parseStnInf(text)
  console.log(`  상류 파싱: 유효 ${rows.length}행 / bbox·형식 제외 ${skipped}행`)

  // ── 안전장치: 최소 지점 수 미달이면 아무것도 쓰지 않는다 ──
  if (rows.length < MIN_AWS) {
    console.error(`✗ 유효 지점 ${rows.length} < 최소 ${MIN_AWS} — 파일 미작성.`)
    console.error('  진단: 엔드포인트/파라미터/컬럼 순서가 다를 수 있음. 응답 앞부분:')
    console.error(text.split(/\r?\n/).slice(0, 15).map((l) => `    | ${l}`).join('\n'))
    process.exit(1)
  }

  const updatedYm = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  const next = rows
    .map((r) => ({
      id: r.id,
      name: r.nameKo, // 상류 STN_KO — 없으면 null(창작 금지)
      nameEn: r.nameEn, // 상류 STN_EN — 없으면 null(창작 금지)
      lat: Number(r.lat.toFixed(5)),
      lon: Number(r.lon.toFixed(5)),
      since: null, // stn_inf 응답에서 관측개시 미확보 — null 유지
    }))
    .sort((a, b) => a.id - b.id)

  await writeFile(AWS_FILE, renderAwsFile(next, updatedYm), 'utf8')
  console.log(`✓ ${AWS_FILE} 생성 — ${next.length}지점(kind:'AWS'), updated:${updatedYm}`)
  console.log('  참고: 기존 src/verify/stationsData.js(ASOS)는 변경하지 않았습니다.')
}

async function main() {
  if (!KEY) {
    usage()
    return // 미설정은 에러 아님
  }

  if (MODE === 'AWS') {
    await generateAwsStations()
    return
  }

  const { ASOS_STATIONS } = await import(pathToFileURL(STATIONS_FILE).href)
  console.log(`▶ 지점 좌표 검증 — 기존 ${ASOS_STATIONS.length}지점, 상류 ${STN_INF_URL}`)

  const text = await fetchStnInf()
  const { rows, skipped } = parseStnInf(text)
  console.log(`  상류 파싱: 유효 ${rows.length}행 / bbox·형식 제외 ${skipped}행`)

  const byId = new Map(rows.map((r) => [r.id, r]))
  const matched = []
  const removed = []
  for (const s of ASOS_STATIONS) {
    const up = byId.get(s.id)
    if (up) matched.push({ ...s, newLat: up.lat, newLon: up.lon })
    else removed.push(s)
  }

  // ── 안전장치: 매칭 미달이면 아무것도 쓰지 않는다 ──
  if (matched.length < MIN_MATCH) {
    console.error(`✗ 매칭 ${matched.length}/${ASOS_STATIONS.length} < 최소 ${MIN_MATCH} — 파일 미변경.`)
    console.error('  진단: 엔드포인트/파라미터/컬럼 순서가 다를 수 있음. 응답 앞부분:')
    console.error(text.split(/\r?\n/).slice(0, 15).map((l) => `    | ${l}`).join('\n'))
    process.exit(1)
  }

  // 이동거리 요약 (상위 10)
  const moves = matched
    .map((s) => ({
      id: s.id,
      name: s.name,
      km: haversineKm(s.lat, s.lon, s.newLat, s.newLon),
    }))
    .sort((a, b) => b.km - a.km)
  console.log('  좌표 이동거리 상위 10:')
  for (const m of moves.slice(0, 10)) {
    console.log(`    ${String(m.id).padStart(3)} ${m.name}: ${m.km.toFixed(3)} km`)
  }

  const updatedYm = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  const next = matched.map((s) => ({
    id: s.id,
    name: s.name,
    nameEn: s.nameEn,
    lat: Number(s.newLat.toFixed(5)),
    lon: Number(s.newLon.toFixed(5)),
    since: s.since,
  }))

  await writeFile(STATIONS_FILE, renderStationsFile(next, updatedYm), 'utf8')
  console.log(`✓ ${STATIONS_FILE} 재작성 — ${next.length}지점, verified:true, updated:${updatedYm}`)

  if (removed.length) {
    console.log(`  상류 미매칭으로 제거된 지점 ${removed.length}건:`)
    for (const s of removed) console.log(`    ${String(s.id).padStart(3)} ${s.name} (${s.nameEn})`)
  } else {
    console.log('  제거된 지점 없음 — 전 지점 매칭.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
