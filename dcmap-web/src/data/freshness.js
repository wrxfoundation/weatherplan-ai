/* 데이터 최신성 레지스트리 — "이 숫자는 언제 기준이고, 지금 얼마나 늦었나"를 한 곳에서.
 *
 * 왜: 데이터셋마다 기준일 표기 방식이 제각각(asOf·period·주석 속 날짜)이라, 무엇이 낡았는지 아무도
 * 알 수 없었다. 2026.10 점검 때 지가는 4개월, 신재생 ESS는 1년 넘게 밀려 있었는데 화면엔 표시가 없었다.
 *
 * 구조:
 *  - DATASETS: 데이터셋별 기준일(asOf)·출처 갱신 주기(cadence)·갱신 방식(method)·갱신 절차(how).
 *    asOf는 가능하면 데이터 파일에서 직접 읽는다(freshnessSources.js → data/freshness_asof.json, 빌드 전 자동 재생성).
 *  - evaluateFreshness(today): 오늘 날짜 기준 상태 판정. 브라우저에서 돌므로 재배포 없이도 '지연'이 정직하게 뜬다.
 *  - Node(GitHub Action 주간 점검 scripts/freshness-report.mjs)와 사이트(/data)가 같은 파일을 쓴다.
 *    그래서 JSON은 import 속성(with { type: 'json' })으로 읽고, Vite 전용 기능(import.meta.glob)은 쓰지 않는다.
 *
 * 정직성:
 *  - lagDays(출처 공표 지연)는 관행 기반 '추정'이다. 화면에도 추정으로 표기한다.
 *  - 기준일이 기록되지 않은 데이터는 날짜를 지어내지 않고 status='unknown'(기준일 미기록)으로 둔다.
 */
// 원본에서 뽑은 기준일만 담은 작은 JSON — 메인 번들에 원본 데이터가 끌려오지 않도록(freshnessSources.js 참고)
import ASOF from '../../data/freshness_asof.json' with { type: 'json' }

/* 갱신 방식 */
export const METHODS = {
  live: { ko: '실시간', en: 'Live', desc: '조회할 때마다 서버 프록시가 원천에서 받아온다' },
  auto: { ko: '자동 수집', en: 'Automated', desc: 'GitHub Action이 주기적으로 수집해 커밋한다' },
  'auto-key': { ko: '자동(키 필요)', en: 'Automated (key needed)', desc: '자동화는 준비됨 — 원천 API 키를 Vercel env에 넣으면 동작' },
  script: { ko: '스크립트', en: 'Script', desc: '갱신 스크립트를 사람이 실행한다' },
  manual: { ko: '수동', en: 'Manual', desc: '원문(PDF·화면·보고서)을 사람이 판독해 반영한다' },
}

/* 출처 갱신 주기
 *  periodic: 다음 기간 자료가 나오는 주기(일) + 기간 종료 후 공표 지연(lagDays, 추정)
 *  review:   정해진 공표 주기가 없어(비정기·보고서·큐레이션) reviewDays마다 재확인
 *  live / static: 판정 대상 아님 */
const MONTHLY = 31
const QUARTERLY = 92
const ANNUAL = 366

// 그룹: 화면 묶음
export const GROUPS = {
  power: { ko: '전력·계통', en: 'Power & grid' },
  land: { ko: '토지·입지', en: 'Land & siting' },
  market: { ko: '시장·시설', en: 'Market & facilities' },
  geo: { ko: '공간·기반', en: 'Geospatial base' },
  live: { ko: '실시간 연동', en: 'Live integrations' },
}

export const DATASETS = [
  // ── 토지 ────────────────────────────────────────────────
  {
    id: 'land-sgg', group: 'land', name: '지가변동률 (시군구)', nameEn: 'Land-price change (sigungu)',
    source: 'KOSIS · 국토교통부/한국부동산원 (DT_1YL20881E)', asOf: ASOF['land-sgg'],
    cadence: { kind: 'periodic', days: MONTHLY, lagDays: 25 }, method: 'auto-key',
    file: 'data/land_price_v0.json', usedIn: ['LAND PULSE', '부지 패널 토지축', '시설 상세'],
    how: 'KOSIS 키를 Vercel env(KOSIS_KEY)에 넣으면 주간 점검 Action이 /api/landprice?kind=kosis로 수집',
  },
  {
    id: 'land-dong', group: 'land', name: '지가변동률 (읍면동)', nameEn: 'Land-price change (eup/myeon/dong)',
    source: 'KOSIS · 한국부동산원 (DT_31501N_010)', asOf: ASOF['land-dong'],
    cadence: { kind: 'periodic', days: MONTHLY, lagDays: 25 }, method: 'auto-key',
    file: 'data/land_price_dong_v0.json', usedIn: ['LAND PULSE 상세', '시설 상세 지가 맥박'],
    how: '위와 동일 — 수집 후 scripts/land_dong.mjs가 DC 입지 시군구만 추려 재생성',
  },
  // ── 전력·계통 ───────────────────────────────────────────
  {
    id: 'headroom-snap', group: 'power', name: '변전소 여유 월별 스냅샷', nameEn: 'Substation headroom monthly snapshots',
    source: '한전ON 변전소 검색 (배포 프록시 경유)', asOf: 'HEADROOM_LATEST',
    cadence: { kind: 'periodic', days: MONTHLY, lagDays: 7 }, method: 'auto',
    file: 'data/headroom_snapshots/<YYYY-MM>.json', usedIn: ['대시보드', '시설 상세', '지역 상세', '데이터 탐색기', '변화 감지(월간)'],
    how: '주간 점검 Action이 매월 1회 scripts/snapshot-headroom.mjs 실행 → 커밋. 대상 = DC 입지 시군구 42곳(data/headroom_targets.json v2, 좌표→법정동코드→한전ON scope 일치 검증)',
  },
  {
    id: 'psia-review', group: 'power', name: '계통영향평가 1차 기술검토 현황', nameEn: 'PSIA 1st technical review (DC)',
    source: '한국전력공사', asOf: ASOF['psia-review'],
    cadence: { kind: 'review', days: 120 }, method: 'manual',
    file: 'src/data/gridAssessment.js', usedIn: ['승인율 레이어', '부지 패널 전력축', '대시보드'],
    how: '한전 공표 자료 판독 후 gridAssessment.js 갱신(비정기 공표)',
  },
  {
    id: 'grid-construction', group: 'power', name: '송변전 건설 사업현황', nameEn: 'KEPCO T&D construction pipeline',
    source: '한전 송변전 건설 정보공개 플랫폼', asOf: ASOF['grid-construction'],
    cadence: { kind: 'review', days: 90 }, method: 'manual',
    file: 'src/data/gridConstruction.js', usedIn: ['로드맵', '데이터 탐색기'],
    how: '복사 불가 화면이라 캡쳐 판독 → gridConstruction.js',
  },
  {
    id: 'grid-headroom-map', group: 'power', name: '계통 공급여유 지도 (2027 전망)', nameEn: 'Regional grid headroom map (2027 outlook)',
    source: '한전 연계가능용량 지도', asOf: null,
    cadence: { kind: 'review', days: ANNUAL }, method: 'manual',
    file: 'src/data/gridHeadroom.js', usedIn: ['계통 여유 레이어', '부지 패널'],
    how: '수집 시점이 기록되지 않음 — 다음 갱신 때 gridHeadroom.js META에 asOf를 남길 것',
  },
  {
    id: 'gen-licenses', group: 'power', name: '발전사업 허가대장', nameEn: 'Generation business licences',
    source: '산업통상자원부 허가대장 (PDF)', asOf: '2026-04-17',
    cadence: { kind: 'review', days: 90 }, method: 'script',
    file: 'data/gen_licenses_v2.json', usedIn: ['발전허가 레이어', '통계'],
    how: '새 PDF를 받아 파싱 → gen_licenses_v2.json 교체',
  },
  {
    id: 'power-reserve', group: 'power', name: '월별 공급예비율', nameEn: 'Monthly supply reserve margin',
    source: '전력거래소 · 한전 전력수급 실적', asOf: ASOF['power-reserve'],
    cadence: { kind: 'periodic', days: MONTHLY, lagDays: 20 }, method: 'manual',
    file: 'src/data/powerReserve.js', usedIn: ['대시보드'],
    how: 'RESERVE_12M에 새 달을 추가하고 가장 오래된 달을 뺀다',
  },
  {
    id: 'renewable-ess', group: 'power', name: '신재생·ESS 설비용량 (시도)', nameEn: 'Renewables & ESS capacity (by province)',
    source: '한국전력거래소', asOf: ASOF['renewable-ess'],
    cadence: { kind: 'periodic', days: MONTHLY, lagDays: 45 }, method: 'manual',
    file: 'src/data/renewableEss.js', usedIn: ['지역 페이지', '대시보드'],
    how: '전력거래소 시계열 최신월로 교체',
  },
  {
    id: 'substations-kepco', group: 'power', name: '변전설비현황 (지역본부별)', nameEn: 'KEPCO substation inventory',
    source: '한국전력공사', asOf: '2026-07-13',
    cadence: { kind: 'review', days: ANNUAL }, method: 'manual',
    file: 'src/data/substations.js', usedIn: ['대시보드'],
    how: '한전 변전설비현황 공표 시 교체',
  },
  {
    id: 'power-balance', group: 'power', name: '지역 전력 자급률', nameEn: 'Regional power self-sufficiency',
    source: '한전 전력통계 (거래량·판매량)', asOf: '2025',
    cadence: { kind: 'periodic', days: ANNUAL, lagDays: 90 }, method: 'manual',
    file: 'src/data/powerBalance.js', usedIn: ['지역 페이지', '지도 지역 정보'],
    how: '연간 전력통계 공표 후 교체',
  },
  {
    id: 'power-market', group: 'power', name: '한전 전력구입 실적', nameEn: 'KEPCO power purchase record',
    source: '「한국전력통계」 (KOSIS DT_31002N_A003)', asOf: '2024',
    cadence: { kind: 'periodic', days: ANNUAL, lagDays: 180 }, method: 'manual',
    file: 'src/data/powerMarket.js', usedIn: ['계산기 전력비 맥락'],
    how: '「한국전력통계」 새 연보의 전력구입 실적으로 교체',
  },
  {
    id: 'chp', group: 'power', name: '집단에너지(열병합) 발전소', nameEn: 'District-energy (CHP) plants',
    source: '공개 CSV', asOf: '2025-07-01',
    cadence: { kind: 'periodic', days: ANNUAL, lagDays: 60 }, method: 'script',
    file: 'data/chp_plants_v0.json', usedIn: ['통계'],
    how: '새 CSV로 chp_plants_v0.json 교체',
  },
  {
    id: 'nuclear', group: 'power', name: '원전 호기별 현황', nameEn: 'Nuclear units',
    source: '원안위 · 한수원', asOf: ASOF.nuclear,
    cadence: { kind: 'review', days: 180 }, method: 'manual',
    file: 'data/nuclear_units_v0.json', usedIn: ['발전소 레이어', '통계'],
    how: '신규 상업운전·영구정지 호기 반영',
  },
  {
    id: 'new-plants', group: 'power', name: '연간 신규 발전소', nameEn: 'New power plants (annual)',
    source: '공개 통계', asOf: '2025',
    cadence: { kind: 'periodic', days: ANNUAL, lagDays: 60 }, method: 'manual',
    file: 'data/new_plants_2025_v0.json', usedIn: ['통계'],
    how: '다음 연도 통계로 새 파일 추가',
  },
  // ── 시장·시설 ───────────────────────────────────────────
  {
    id: 'dc-facilities', group: 'market', name: '데이터센터 시설 (큐레이션)', nameEn: 'Data-centre facilities (curated)',
    source: 'AI InfraMap 큐레이션 (공시·보도·인허가)', asOf: ASOF['dc-facilities'],
    cadence: { kind: 'review', days: 60 }, method: 'script',
    file: 'data/dc_seed_v0.1.json → dc_centers.json', usedIn: ['지도', '전 페이지'],
    how: 'dc_seed 수정 후 scripts/geocode.mjs로 dc_centers.json 재생성',
  },
  {
    id: 'capital-pipeline', group: 'market', name: '공급예정 민간 데이터센터', nameEn: 'Upcoming private data centres',
    source: '삼일PwC · 알스퀘어 리포트 교차', asOf: ASOF['capital-pipeline'],
    cadence: { kind: 'review', days: 180 }, method: 'manual',
    file: 'src/data/capitalPipeline.js', usedIn: ['공급예정 레이어', '지역 페이지'],
    how: '새 업계 리포트 공표 시 교차 갱신',
  },
  {
    id: 'dc-deals', group: 'market', name: 'DC 거래 사례 · 랙 임대료', nameEn: 'DC deals & rack rates',
    source: '알스퀘어 리서치센터 연간 리포트', asOf: ASOF['dc-deals'],
    cadence: { kind: 'periodic', days: ANNUAL, lagDays: 30 }, method: 'manual',
    file: 'src/data/dcRealEstate.js', usedIn: ['데이터 탐색기', '인사이트'],
    how: '연간 리포트 신간 반영',
  },
  {
    id: 'public-dc', group: 'market', name: '공공기관 정보시스템 운영시설', nameEn: 'Public-sector IT facilities',
    source: '행정안전부 (data.go.kr 15080581)', asOf: '2026-06-04',
    cadence: { kind: 'periodic', days: ANNUAL, lagDays: 30 }, method: 'script',
    file: 'data/public_dc_v0.json', usedIn: ['공공DC 레이어'],
    how: '새 CSV 파싱 → public_dc_v0.json',
  },
  // ── 공간·기반 ───────────────────────────────────────────
  {
    id: 'osm', group: 'geo', name: 'OSM 기반 레이어 (변전소·송전선·산단·재생·통신)', nameEn: 'OSM layers (substations, lines, industrial, RE, telecom)',
    source: 'OpenStreetMap / OpenInfraMap export', asOf: '2026-07',
    cadence: { kind: 'review', days: 180 }, method: 'script',
    file: 'src/data/substationPoints.js 외', usedIn: ['지도 레이어', '부지 패널 근접 거리'],
    how: 'OSM export 재수행 후 각 모듈 교체',
  },
  {
    id: 'semi-clusters', group: 'geo', name: '반도체·AI 메가클러스터', nameEn: 'Semiconductor / AI mega-clusters',
    source: '국민보고회(2026.6.29) · 언론', asOf: '2026-06-29',
    cadence: { kind: 'review', days: 180 }, method: 'manual',
    file: 'src/data/semiClusters.js', usedIn: ['반도체 레이어'],
    how: '정부·기업 공식 발표 시 반영(추정치 금지)',
  },
  {
    id: 'wind', group: 'geo', name: '풍력발전소 위치', nameEn: 'Wind farm locations',
    source: '전국풍력발전소 현황정보 (shapefile)', asOf: '2023',
    cadence: { kind: 'review', days: ANNUAL }, method: 'script',
    file: 'data/wind_plants_v0.json', usedIn: ['재생 레이어'],
    how: '최신 연도판 shapefile이 있으면 교체',
  },
  {
    id: 'exclusions', group: 'geo', name: '입지 배제 오버레이', nameEn: 'Siting exclusion overlays',
    source: '토지이음 등 (scripts/fetch-exclusions.mjs)', asOf: ASOF.exclusions,
    cadence: { kind: 'review', days: 180 }, method: 'script',
    file: 'data/exclusions/', usedIn: ['배제구역 레이어', '부지 판정'],
    how: '아직 미수집 — fetch-exclusions.mjs로 레이어를 채우면 자동 활성화',
    notCollected: true,
  },
  {
    id: 'climate-normals', group: 'geo', name: '기후 평년값 (1991–2020)', nameEn: 'Climate normals (1991–2020)',
    source: '기상청', asOf: '2020',
    cadence: { kind: 'static', note: '30년 평년값 — 다음 개정(2001–2030)은 2031년' }, method: 'manual',
    file: 'src/score/climateIndex.js', usedIn: ['냉각 지수', '기후 바'],
    how: '2031년 새 평년값 공표 시 교체',
  },
  // ── 실시간 ─────────────────────────────────────────────
  { id: 'live-kepco', group: 'live', name: '한전ON 변전소 여유 (조회 시점)', nameEn: 'KEPCO ON substation headroom (on query)', source: '한전ON', asOf: null, cadence: { kind: 'live' }, method: 'live', usedIn: ['부지 패널'], how: 'api/headroom.js — KEPCO_API_KEY' },
  { id: 'live-kpx', group: 'live', name: '전력수급 · SMP · 발전원 (5분)', nameEn: 'Power supply, SMP, fuel mix (5-min)', source: '전력거래소 (data.go.kr)', asOf: null, cadence: { kind: 'live' }, method: 'live', usedIn: ['대시보드', '지도'], how: 'api/power.js — DATA_GO_KR_KEY' },
  { id: 'live-weather', group: 'live', name: '케이웨더 현재·3일 예보', nameEn: 'K-weather current & 3-day forecast', source: '케이웨더', asOf: null, cadence: { kind: 'live' }, method: 'live', usedIn: ['기후 바'], how: 'api/kweather.js — KWEATHER_API_KEY' },
  { id: 'live-vworld', group: 'live', name: '주소 · 용도지역 · 지적', nameEn: 'Address, zoning, cadastral', source: 'vworld', asOf: null, cadence: { kind: 'live' }, method: 'live', usedIn: ['부지 패널', '검색'], how: '브라우저 직접(VITE_VWORLD_KEY) 우선, 실패 시 api/revgeo·landuse' },
  { id: 'live-landprice', group: 'live', name: '개별공시지가', nameEn: 'Official parcel land price', source: '국토교통부 (data.go.kr)', asOf: null, cadence: { kind: 'live' }, method: 'live', usedIn: ['부지 패널'], how: 'api/landprice.js — DATA_GO_KR_KEY' },
  { id: 'live-sgis', group: 'live', name: '인구 · 침수 · 산사태', nameEn: 'Population, flood, landslide', source: '통계청 SGIS', asOf: null, cadence: { kind: 'live' }, method: 'live', usedIn: ['부지 패널 리스크축'], how: 'api/sgis.js — SGIS_KEY/SECRET' },
  { id: 'live-dart', group: 'live', name: '전자공시 (DART)', nameEn: 'Corporate filings (DART)', source: '금융감독원', asOf: null, cadence: { kind: 'live' }, method: 'live', usedIn: ['대시보드 공시'], how: 'api/filings.js — DART_API_KEY' },
]

/* 출처 영문 표기(EN 모드) — id로 매핑. 갱신 방법(how)은 운영자용 메모라 KO 유지 */
const SOURCE_EN = {
  'land-sgg': 'KOSIS · MOLIT / Korea Real Estate Board (DT_1YL20881E)',
  'land-dong': 'KOSIS · Korea Real Estate Board (DT_31501N_010)',
  'headroom-snap': 'KEPCO ON substation search (via deployed proxy)',
  'psia-review': 'KEPCO',
  'grid-construction': 'KEPCO T&D construction disclosure',
  'grid-headroom-map': 'KEPCO interconnectable-capacity map',
  'gen-licenses': 'MOTIE licence register (PDF)',
  'power-reserve': 'KPX · KEPCO supply-demand record',
  'renewable-ess': 'Korea Power Exchange (KPX)',
  'substations-kepco': 'KEPCO',
  'power-balance': 'KEPCO power statistics',
  'power-market': 'KEPCO Statistics (KOSIS DT_31002N_A003)',
  chp: 'Public CSV',
  nuclear: 'NSSC · KHNP',
  'new-plants': 'Public statistics',
  'dc-facilities': 'AI InfraMap curation (filings, press, permits)',
  'capital-pipeline': 'Samil PwC · R.square reports (cross-checked)',
  'dc-deals': 'R.square Research annual report',
  'public-dc': 'Ministry of the Interior and Safety (data.go.kr 15080581)',
  osm: 'OpenStreetMap / OpenInfraMap export',
  'semi-clusters': 'Government briefing (2026-06-29) · press',
  wind: 'National wind-farm dataset (shapefile)',
  exclusions: 'Land-use plans (scripts/fetch-exclusions.mjs)',
  'climate-normals': 'KMA',
  'live-kepco': 'KEPCO ON',
  'live-kpx': 'KPX (data.go.kr)',
  'live-weather': 'K-weather',
  'live-vworld': 'vworld',
  'live-landprice': 'MOLIT (data.go.kr)',
  'live-sgis': 'Statistics Korea SGIS',
  'live-dart': 'FSS DART',
}
for (const d of DATASETS) d.sourceEn = SOURCE_EN[d.id] ?? d.source

/* ── 판정 ─────────────────────────────────────────────── */
const DAY = 86400000

/** 기준일 문자열 → 그 기간의 마지막 날(UTC). 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD' | 'YYYY.MM.DD' */
export function periodEnd(asOf) {
  if (!asOf) return null
  const s = String(asOf).replace(/\./g, '-')
  const m = s.match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/)
  if (!m) return null
  const y = +m[1]
  if (m[3]) return new Date(Date.UTC(y, +m[2] - 1, +m[3]))
  if (m[2]) return new Date(Date.UTC(y, +m[2], 0)) // 해당 월 말일
  return new Date(Date.UTC(y, 11, 31))
}

const fmtDate = (d) => d.toISOString().slice(0, 10)

/** 개별 판정 — { status, ageDays, due, behind } */
/** 표시용 기준일 정규화 — '2026.3.27' → '2026-03-27' (모듈마다 적는 방식이 달라 한 형식으로) */
export function normAsOf(asOf) {
  if (!asOf) return asOf
  const m = String(asOf).replace(/\./g, '-').match(/^(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/)
  if (!m) return asOf
  return [m[1], m[2]?.padStart(2, '0'), m[3]?.padStart(2, '0')].filter(Boolean).join('-')
}

export function judge(ds, today, ctx = {}) {
  const asOf = normAsOf(ds.asOf === 'HEADROOM_LATEST' ? ctx.headroomLatest ?? null : ds.asOf)
  const c = ds.cadence || {}
  if (c.kind === 'live') return { status: 'live', asOf }
  if (ds.notCollected && !asOf) return { status: 'pending', asOf }
  if (!asOf) return { status: 'unknown', asOf }
  const end = periodEnd(asOf)
  if (!end) return { status: 'unknown', asOf }
  const ageDays = Math.max(0, Math.floor((today - end) / DAY))
  if (c.kind === 'static') return { status: 'reference', asOf, ageDays }
  if (c.kind === 'review') {
    const due = new Date(end.getTime() + c.days * DAY)
    return { status: today > due ? 'review' : 'fresh', asOf, ageDays, due: fmtDate(due) }
  }
  // periodic — 다음 기간 자료의 예상 공표일 = 기간 말 + 주기 + 공표 지연(추정)
  const due = new Date(end.getTime() + (c.days + (c.lagDays || 0)) * DAY)
  if (today <= due) {
    const soon = due - today <= 14 * DAY
    return { status: soon ? 'soon' : 'fresh', asOf, ageDays, due: fmtDate(due) }
  }
  const behind = Math.floor((today - due) / (c.days * DAY)) + 1 // 밀린 기간 수
  return { status: 'overdue', asOf, ageDays, due: fmtDate(due), behind }
}

export const STATUS = {
  live: { ko: '실시간', en: 'Live', tone: 'good', rank: 5 },
  fresh: { ko: '최신', en: 'Current', tone: 'good', rank: 4 },
  soon: { ko: '곧 갱신', en: 'Due soon', tone: 'info', rank: 3 },
  reference: { ko: '고정 기준', en: 'Fixed baseline', tone: 'muted', rank: 3 },
  review: { ko: '재확인 필요', en: 'Needs re-check', tone: 'warn', rank: 2 },
  unknown: { ko: '기준일 미기록', en: 'As-of not recorded', tone: 'warn', rank: 1 },
  pending: { ko: '미수집', en: 'Not collected yet', tone: 'muted', rank: 3 },
  overdue: { ko: '갱신 지연', en: 'Overdue', tone: 'bad', rank: 0 },
}

const UNIT = { [MONTHLY]: ['개월', 'mo'], [QUARTERLY]: ['분기', 'qtr'], [ANNUAL]: ['년', 'yr'] }
/** '4개월 지연' / '4 mo behind' */
export function behindLabel(ds, r, en) {
  if (r.status !== 'overdue') return ''
  const u = UNIT[ds.cadence.days] ?? ['기간', 'periods']
  return en ? `${r.behind} ${u[1]} behind` : `${r.behind}${u[0]} 지연`
}

/** 전체 판정 + 요약 */
export function evaluateFreshness(today = new Date(), ctx = {}) {
  const rows = DATASETS.map((ds) => ({ ...ds, ...judge(ds, today, ctx) }))
  const count = {}
  for (const r of rows) count[r.status] = (count[r.status] ?? 0) + 1
  // 손볼 것 먼저: 지연 → 기준일 미기록 → 재확인 → 곧 갱신 → 최신·고정 → 실시간
  rows.sort((a, b) => STATUS[a.status].rank - STATUS[b.status].rank || (b.ageDays ?? 0) - (a.ageDays ?? 0))
  const attention = (count.overdue ?? 0) + (count.unknown ?? 0) + (count.review ?? 0)
  return { rows, count, attention, today: fmtDate(today) }
}
