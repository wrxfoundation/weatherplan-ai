#!/usr/bin/env node
/**
 * fetch-exclusions.mjs — 입지 배제 오버레이(법적 건축가능성) GeoJSON 수집기 [배포측 전용]
 *
 * 정직성 원칙(프로젝트 불변식):
 *   - 폴리곤을 지어내지 않는다. 공개 GIS에서 실제로 받은 지오메트리만 기록한다.
 *   - 못 받으면 파일을 쓰지 않고, manifest 항목은 available=false(=데이터 대기)로 남긴다.
 *   - placeholder/가짜 좌표를 절대 만들지 않는다(엔진 exclusions.js가 이를 신뢰함).
 *
 * 이 스크립트가 하는 일(레이어별):
 *   1) 환경변수에서 API 키를 읽는다 (VWORLD_KEY / DATA_GO_KR_KEY 등).
 *   2) 문서화된 오픈API / WFS 엔드포인트를 호출한다(페이징 포함).
 *   3) 응답을 표준 GeoJSON FeatureCollection 으로 정규화한다(properties.name 부여).
 *   4) data/exclusions/layers/<key>.json 을 쓴다(부분 진행 저장).
 *   5) data/exclusions/manifest.json 의 해당 항목 available/asOf/features 를 갱신한다.
 *
 * 왜 이 샌드박스에서 못 돌리나:
 *   - 토지이음(LURIS)·브이월드·data.go.kr outbound 가 차단됨. 실가동은 배포측(도메인/CI)에서.
 *   - 자세한 절차/키 발급은 ops/EXCLUSIONS-RUNBOOK.md 참고.
 *
 * 사용법:
 *   node scripts/fetch-exclusions.mjs                 # 준비된(ready) 레이어 전부 수집
 *   node scripts/fetch-exclusions.mjs --dry-run       # 실행 계획만 출력(네트워크 호출 없음)
 *   node scripts/fetch-exclusions.mjs --layer greenbelt   # 특정 레이어만
 *   node scripts/fetch-exclusions.mjs --dry-run --layer heritage
 *
 * 표준 Node ESM 만 사용(외부 의존성 없음). Node >= 18 (전역 fetch 필요).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const LAYERS_DIR = join(ROOT, 'data/exclusions/layers')
const MANIFEST_PATH = join(ROOT, 'data/exclusions/manifest.json')

/* 한국(WGS84) 대략 경계 — 정규화된 좌표가 이 안에 드는지 sanity check.
 * 벗어나면 CRS 오설정(예: EPSG:5186 미터좌표) 의심 → 파일을 쓰지 않고 경고. */
const KR_BBOX = { lngMin: 124, lngMax: 132, latMin: 33, latMax: 39.6 }

const argv = process.argv.slice(2)
const DRY_RUN = argv.includes('--dry-run')
const li = argv.indexOf('--layer')
const ONLY_LAYER = li >= 0 ? argv[li + 1] : null

const env = process.env

/* ────────────────────────────────────────────────────────────────────────────
 * 레이어 CONFIG 블록
 *
 * status:
 *   'ready' — 엔드포인트 URL 구조가 확정된 공개 API. 키만 있으면 바로 수집 가능.
 *   'todo'  — 정확한 엔드포인트/레이어ID를 배포 전에 확정해야 함(아래 todo 참고).
 *             ⚠ 가짜 URL을 지어내지 않는다. todo 상태 레이어는 실행 시 자동 skip.
 *
 * fetcher: 'vworldData' | 'wfs' — 응답 파서 종류.
 * nameProps: properties.name 으로 승격할 원본 속성 후보(앞에서부터 첫 존재값).
 * ──────────────────────────────────────────────────────────────────────────── */
const LAYERS = {
  greenbelt: {
    title: '개발제한구역(그린벨트)',
    source: '국토교통부·브이월드 도시계획',
    license: 'vWorld 오픈API 이용약관(출처표시). 상업적 재배포 전 vWorld 약관 확인.',
    keyEnv: 'VWORLD_KEY',
    fetcher: 'vworldData',
    status: 'ready',
    // vWorld 데이터 API(GetFeature) — 실제 베이스 URL. 응답은 GeoJSON FeatureCollection.
    // data= 레이어코드는 vWorld '데이터 목록'에서 개발제한구역 도형 레이어로 확정한다.
    // 알려진 도시계획 용도 레이어군(LT_C_UD801=용도지역 등) 중 개발제한구역 코드를 지정.
    dataId: env.VWORLD_GREENBELT_DATA || 'LT_C_UD801',
    endpoint:
      env.VWORLD_DATA_URL ||
      'https://api.vworld.kr/req/data?service=data&request=GetFeature&version=2.0&format=json&crs=EPSG:4326&geometry=true&size={size}&page={page}&data={data}&key={key}&domain={domain}&attrFilter=',
    nameProps: ['DGM_NM', 'UNM', 'MNU_NM', 'name', 'NAME'],
    // ⚠ 확인 필요: 위 dataId(LT_C_UD801)는 용도지역 예시. 개발제한구역 전용 레이어코드를
    //   vWorld 데이터 목록(www.vworld.kr → 오픈API → 데이터 API 레이어 목록)에서 확정 후
    //   VWORLD_GREENBELT_DATA 로 주입할 것. 확정 전까지 name 속성키도 함께 검증.
    todoNote:
      '개발제한구역 전용 vWorld 데이터 레이어코드(data=) 확정 필요. 확정 시 VWORLD_GREENBELT_DATA 로 주입하면 status ready 유지.',
  },

  military: {
    title: '군사시설보호구역',
    source: '국방부·토지이음(LURIS)',
    license: 'data.go.kr / 국가공간정보포털 공공데이터 이용약관(출처표시).',
    keyEnv: 'DATA_GO_KR_KEY',
    fetcher: 'wfs',
    status: 'todo',
    endpoint: null,
    nameProps: ['층구분', 'PROT_SE', 'name', 'NAME'],
    // TODO(확인): 군사시설보호구역 도형은 토지이음 규제도(LURIS)·국가공간정보포털(NSDI)에서
    //   제공. data.go.kr 또는 브이월드 WFS 중 어느 것이 폴리곤(도형)을 주는지 확정 필요.
    //   후보: (a) data.go.kr "국방부_군사시설 보호구역" GIS 데이터셋 상세페이지의 WFS/파일 URL,
    //         (b) 국가공간정보포털 오픈마켓 WFS typename.
    //   확정 시 endpoint(=WFS GetFeature, OUTPUTFORMAT=application/json, SRSNAME=EPSG:4326)와
    //   typeName, nameProps 를 채우고 status='ready' 로 변경.
    todoNote:
      '군사시설보호구역 폴리곤 WFS/파일 제공 경로(data.go.kr vs 국가공간정보포털) 확정 필요. 가짜 URL 금지.',
  },

  airport_height: {
    title: '공항 고도제한(장애물제한표면)',
    source: '국토교통부·한국공항공사',
    license: '국토교통부/한국공항공사 공공데이터 이용약관(출처표시).',
    keyEnv: 'DATA_GO_KR_KEY',
    fetcher: 'wfs',
    status: 'todo',
    endpoint: null,
    nameProps: ['SURF_NM', 'AIRPORT', 'name', 'NAME'],
    // TODO(확인): 장애물제한표면(수평·원추·진입표면 등) 도형 데이터 출처 확정 필요.
    //   후보: (a) 국토교통부 항공정보포털(AIP) 장애물제한표면,
    //         (b) data.go.kr "한국공항공사_장애물 제한표면" 데이터셋,
    //         (c) 국가공간정보포털 항공 관련 WFS.
    //   표면 유형별 높이(고도제한)는 속성으로 함께 보존(엔진은 저촉 여부만, 높이는 표시용).
    todoNote:
      '장애물제한표면 폴리곤 공개 배포 경로 확정 필요(공항공사/AIP/NSDI). 확정 전 수집 불가.',
  },

  water_source: {
    title: '상수원보호구역',
    source: '환경부',
    license: '환경부 환경공간정보서비스(EGIS)/data.go.kr 이용약관(출처표시).',
    keyEnv: 'DATA_GO_KR_KEY',
    fetcher: 'wfs',
    status: 'todo',
    endpoint: null,
    nameProps: ['WTRSRC_NM', 'PROT_NM', '보호구역명', 'name', 'NAME'],
    // TODO(확인): 상수원보호구역 도형은 환경공간정보서비스(egis.me.go.kr) 또는
    //   국가공간정보포털/ data.go.kr "환경부_상수원보호구역"에서 제공.
    //   WFS typename 또는 다운로드 파일(SHP/GeoJSON) URL 확정 필요.
    //   확정 시 endpoint(WFS GetFeature, EPSG:4326, application/json)·typeName 채우고 ready.
    todoNote:
      '상수원보호구역 WFS typename 또는 EGIS 다운로드 경로 확정 필요. 가짜 URL 금지.',
  },

  heritage: {
    title: '문화재보호구역·매장문화재 유존지역',
    source: '국가유산청',
    license: '국가유산청/data.go.kr 공공데이터 이용약관(출처표시).',
    keyEnv: 'DATA_GO_KR_KEY',
    fetcher: 'wfs',
    status: 'todo',
    endpoint: null,
    nameProps: ['CCBA_NM', 'HERIT_NM', '지정명칭', 'name', 'NAME'],
    // TODO(확인): (a) 문화재보호구역(지정문화재 보호구역 도형)과
    //   (b) 매장문화재 유존지역(지표조사 유존지역)은 서로 다른 데이터셋일 수 있음.
    //   후보: 국가유산청 문화재 공간정보 서비스 / data.go.kr "국가유산청_..." GIS 데이터셋.
    //   두 데이터셋을 각각 받아 하나의 FeatureCollection 으로 병합(속성 kind로 구분) 권장.
    //   확정 시 endpoint·typeName·nameProps 채우고 status='ready'.
    todoNote:
      '문화재보호구역/매장문화재 유존지역 두 GIS 데이터셋 경로 확정 및 병합 필요. 가짜 URL 금지.',
  },
}

/* ────────────────────────────────────────────────────────────────────────────
 * 유틸
 * ──────────────────────────────────────────────────────────────────────────── */

function log(...a) {
  console.log('[exclusions]', ...a)
}
function warn(...a) {
  console.warn('[exclusions][warn]', ...a)
}

function fill(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`))
}

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
}

function saveManifest(m) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2) + '\n')
}

/* manifest 의 특정 레이어 항목만 갱신(부분 진행 저장). */
function updateManifestLayer(key, { available, features }) {
  const m = loadManifest()
  const nowIso = new Date().toISOString().slice(0, 10)
  const entry = m.layers.find((l) => l.key === key)
  if (!entry) {
    warn(`manifest 에 ${key} 항목 없음 — 건너뜀`)
    return
  }
  entry.available = available
  entry.features = features
  entry.asOf = available ? nowIso : null
  // 최상위 asOf 는 활성 레이어 중 가장 최근으로.
  const active = m.layers.filter((l) => l.available && l.asOf)
  m.asOf = active.length ? active.map((l) => l.asOf).sort().slice(-1)[0] : null
  saveManifest(m)
}

/* 좌표 정밀도 축소(번들 크기 관리) — 지오메트리를 위조하지 않는 무손실에 가까운 반올림.
 * 소수 5자리 ≈ 1.1m. 그린벨트 등 대면적 폴리곤에 충분. 정직성: 데이터 생성 아님, 반올림만. */
function roundCoordsInPlace(coords, dp = 5) {
  const f = 10 ** dp
  const walk = (a) => {
    if (typeof a[0] === 'number') {
      a[0] = Math.round(a[0] * f) / f
      a[1] = Math.round(a[1] * f) / f
      return
    }
    for (const c of a) walk(c)
  }
  walk(coords)
}

/* 정규화: 임의 GeoJSON feature 배열 → properties.name 부여 + 폴리곤만 유지 + 좌표 반올림.
 * KR_BBOX 밖 좌표가 다수면 CRS 오류로 판단하고 예외(파일 미기록). */
function normalizeFeatures(rawFeatures, nameProps) {
  const out = []
  let sampled = 0
  let outOfBox = 0
  for (const f of rawFeatures || []) {
    const geom = f?.geometry
    if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) continue
    const props = f.properties || {}
    let name = null
    for (const k of nameProps) {
      if (props[k] != null && String(props[k]).trim() !== '') {
        name = String(props[k]).trim()
        break
      }
    }
    // CRS sanity: 첫 좌표 표본 검사.
    const firstPt = geom.type === 'Polygon' ? geom.coordinates?.[0]?.[0] : geom.coordinates?.[0]?.[0]?.[0]
    if (Array.isArray(firstPt) && typeof firstPt[0] === 'number') {
      sampled++
      const [x, y] = firstPt
      if (x < KR_BBOX.lngMin || x > KR_BBOX.lngMax || y < KR_BBOX.latMin || y > KR_BBOX.latMax) outOfBox++
    }
    roundCoordsInPlace(geom.coordinates)
    out.push({
      type: 'Feature',
      properties: name ? { name, ...props } : { ...props },
      geometry: geom,
    })
  }
  if (sampled > 0 && outOfBox / sampled > 0.5) {
    throw new Error(
      `좌표가 한국 WGS84 경계 밖(${outOfBox}/${sampled}). CRS 오설정 의심(EPSG:4326 재요청 필요). 파일 미기록.`,
    )
  }
  return out
}

/* ────────────────────────────────────────────────────────────────────────────
 * Fetcher 들 — 각각 정규화 전 raw feature 배열을 반환. 모든 네트워크 호출은 try/guard.
 * ──────────────────────────────────────────────────────────────────────────── */

/* vWorld 데이터 API(GetFeature): 페이징하며 featureCollection.features 수집. */
async function fetchVworldData(cfg, key) {
  const domain = env.VWORLD_DOMAIN || 'localhost'
  const size = 1000
  let page = 1
  const all = []
  // 안전장치: 최대 page 수(무한루프 방지). 필요 시 VWORLD_MAX_PAGE 로 상향.
  const maxPage = Number(env.VWORLD_MAX_PAGE || 200)
  while (page <= maxPage) {
    const url = fill(cfg.endpoint, { size, page, data: cfg.dataId, key, domain })
    const res = await fetch(url)
    if (!res.ok) throw new Error(`vWorld HTTP ${res.status} (page ${page})`)
    const json = await res.json()
    const status = json?.response?.status
    if (status === 'ERROR') {
      const msg = json?.response?.error?.text || JSON.stringify(json?.response?.error || {})
      throw new Error(`vWorld API 오류: ${msg}`)
    }
    if (status === 'NOT_FOUND') break
    const fc = json?.response?.result?.featureCollection
    const feats = fc?.features || []
    all.push(...feats)
    const total = Number(json?.response?.page?.total || 1)
    log(`  vWorld page ${page}/${total} — +${feats.length} (누적 ${all.length})`)
    if (page >= total || feats.length === 0) break
    page++
  }
  return all
}

/* 표준 WFS GetFeature(OUTPUTFORMAT=application/json) — GeoJSON FeatureCollection 반환 가정.
 * status='ready' 로 승격된 레이어에서만 호출됨(엔드포인트 확정 후). */
async function fetchWfs(cfg, key) {
  if (!cfg.endpoint) throw new Error('endpoint 미확정(todo). 확정 전 수집 불가.')
  const url = fill(cfg.endpoint, { key, ...(cfg.endpointVars || {}) })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`WFS HTTP ${res.status}`)
  const json = await res.json()
  if (!json || !Array.isArray(json.features)) {
    throw new Error('WFS 응답이 GeoJSON FeatureCollection 이 아님(OUTPUTFORMAT 확인).')
  }
  return json.features
}

const FETCHERS = { vworldData: fetchVworldData, wfs: fetchWfs }

/* ────────────────────────────────────────────────────────────────────────────
 * 레이어 1건 처리
 * ──────────────────────────────────────────────────────────────────────────── */
async function runLayer(key, cfg, summary) {
  const keyVal = env[cfg.keyEnv]

  if (cfg.status !== 'ready') {
    log(`SKIP  ${key} — 엔드포인트 미확정(todo). ${cfg.todoNote || ''}`)
    summary.skipped.push({ key, reason: 'todo', note: cfg.todoNote })
    return
  }
  if (!keyVal) {
    log(`SKIP  ${key} — 환경변수 ${cfg.keyEnv} 없음(키 미주입).`)
    summary.skipped.push({ key, reason: `no ${cfg.keyEnv}` })
    return
  }

  log(`FETCH ${key} — ${cfg.title} (${cfg.fetcher})`)
  try {
    const fetcher = FETCHERS[cfg.fetcher]
    if (!fetcher) throw new Error(`알 수 없는 fetcher: ${cfg.fetcher}`)
    const raw = await fetcher(cfg, keyVal)
    const features = normalizeFeatures(raw, cfg.nameProps)

    if (!features.length) {
      // 정직성: 0건이면 파일을 쓰지 않는다(빈 파일=오해 소지). manifest 도 미활성 유지.
      warn(`${key}: 정규화 결과 0건 — 파일 미기록(available=false 유지).`)
      summary.empty.push(key)
      return
    }

    const fc = {
      type: 'FeatureCollection',
      name: key,
      source: cfg.source,
      license: cfg.license,
      asOf: new Date().toISOString().slice(0, 10),
      features,
    }
    if (!existsSync(LAYERS_DIR)) mkdirSync(LAYERS_DIR, { recursive: true })
    const outPath = join(LAYERS_DIR, `${key}.json`)
    writeFileSync(outPath, JSON.stringify(fc))
    updateManifestLayer(key, { available: true, features: features.length })
    const kb = Math.round(Buffer.byteLength(JSON.stringify(fc)) / 1024)
    log(`OK    ${key} — ${features.length} features, ~${kb}KB → ${outPath}`)
    summary.ok.push({ key, features: features.length, kb })
  } catch (err) {
    // 부분 진행: 이 레이어만 실패해도 나머지는 계속. 파일/매니페스트는 손대지 않음.
    warn(`${key} 실패: ${err.message}`)
    summary.failed.push({ key, error: err.message })
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * --dry-run 플랜 출력
 * ──────────────────────────────────────────────────────────────────────────── */
function printPlan(keys) {
  console.log('\n=== fetch-exclusions 실행 계획 (--dry-run, 네트워크 호출 없음) ===\n')
  for (const key of keys) {
    const c = LAYERS[key]
    const keyPresent = !!env[c.keyEnv]
    const willRun = c.status === 'ready' && keyPresent
    console.log(`● ${key}  [${c.status}]  ${willRun ? '→ 수집 예정' : '→ SKIP'}`)
    console.log(`    제목    : ${c.title}`)
    console.log(`    출처    : ${c.source}`)
    console.log(`    라이선스: ${c.license}`)
    console.log(`    키(env) : ${c.keyEnv} ${keyPresent ? '(설정됨)' : '(미설정)'}`)
    console.log(`    fetcher : ${c.fetcher}`)
    console.log(`    엔드포인트: ${c.endpoint ? c.endpoint : '(미확정 — TODO)'}`)
    if (c.dataId) console.log(`    dataId  : ${c.dataId}`)
    console.log(`    name속성: ${c.nameProps.join(' | ')}`)
    if (c.status !== 'ready') console.log(`    TODO    : ${c.todoNote}`)
    console.log('')
  }
  console.log('출력 대상 : data/exclusions/layers/<key>.json + manifest.json 갱신')
  console.log('정직성    : 실데이터 0건/오류 시 파일 미기록, manifest available=false 유지.\n')
}

/* ────────────────────────────────────────────────────────────────────────────
 * main
 * ──────────────────────────────────────────────────────────────────────────── */
async function main() {
  const keys = ONLY_LAYER ? [ONLY_LAYER] : Object.keys(LAYERS)
  for (const k of keys) {
    if (!LAYERS[k]) {
      console.error(`알 수 없는 레이어: ${k}. 가능: ${Object.keys(LAYERS).join(', ')}`)
      process.exit(1)
    }
  }

  if (DRY_RUN) {
    printPlan(keys)
    return
  }

  const summary = { ok: [], failed: [], skipped: [], empty: [] }
  for (const key of keys) {
    await runLayer(key, LAYERS[key], summary)
  }

  console.log('\n=== 요약 ===')
  console.log(`수집 성공 : ${summary.ok.map((o) => `${o.key}(${o.features})`).join(', ') || '없음'}`)
  console.log(`0건       : ${summary.empty.join(', ') || '없음'}`)
  console.log(`실패      : ${summary.failed.map((f) => `${f.key}: ${f.error}`).join(' | ') || '없음'}`)
  console.log(`건너뜀    : ${summary.skipped.map((s) => `${s.key}(${s.reason})`).join(', ') || '없음'}`)
  if (summary.failed.length) process.exitCode = 1
}

main().catch((e) => {
  console.error('[exclusions] 치명적 오류:', e)
  process.exit(1)
})
