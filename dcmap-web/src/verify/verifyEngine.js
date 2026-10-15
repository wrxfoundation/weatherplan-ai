/* 과거 기상 검증(verify) 매칭 엔진 — 임의 좌표 → 최근접 ASOS 관측지점 매칭(하버사인) + 커버리지 등급.
 * 순수 함수만 — UI 의존 없음. 지점 좌표는 근사값(stationsData.js STATIONS_META 참조)이므로
 * distKm도 근사치로 취급하고 화면에서는 '데이터 대기/근사' 맥락과 함께 표기할 것. */
import { ASOS_STATIONS, STATIONS_META } from './stationsData.js'

/* 다중 관측망 드롭인 — scripts/verify-stations.mjs(STN_INF=AWS)가 생성하는
 * ./awsStationsData.js 는 아직 없을 수 있으므로 import.meta.glob 옵션 로드로
 * '있으면 자동 합류'. 없으면 AWS는 null(데이터 대기) — 값 창작 금지. */
const awsGlob = import.meta.glob('./awsStationsData.js', { eager: true })
const awsMod = awsGlob['./awsStationsData.js'] ?? null
const AWS_STATIONS = awsMod?.AWS_STATIONS ?? null
const AWS_STATIONS_META = awsMod?.AWS_STATIONS_META ?? null

/* 전체 지점 — ASOS(각 항목 kind:'ASOS' 부여) + (있으면) AWS(kind:'AWS' 자체 보유).
 * 스키마는 stationsData.js 와 동일 + kind. */
export const ALL_STATIONS = [
  ...ASOS_STATIONS.map((s) => ({ ...s, kind: 'ASOS' })),
  ...(AWS_STATIONS ?? []),
]

/* 관측망 요약 — aws 는 파일 미생성 시 null(데이터 대기). */
export const NETWORKS = {
  asos: { count: ASOS_STATIONS.length, meta: STATIONS_META },
  aws: AWS_STATIONS ? { count: AWS_STATIONS.length, meta: AWS_STATIONS_META } : null,
}

const R_EARTH_KM = 6371
const toRad = (deg) => (deg * Math.PI) / 180

/* 하버사인 거리(km) */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(a))
}

/* 최근접 지점 k개 — [{...station, kind, distKm(소수1)}] 거리 오름차순.
 * ALL_STATIONS 기준(AWS 파일이 있으면 자동 포함) — 시그니처·반환 형태는 종전과 하위호환. */
export function nearestStations(lat, lon, k = 3) {
  return ALL_STATIONS.map((s) => ({
    ...s,
    distKm: Math.round(haversineKm(lat, lon, s.lat, s.lon) * 10) / 10,
  }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, Math.max(0, k))
}

/* 커버리지 등급 — 최근접 지점 거리 기준. A<5km, B<15km, C<30km, D 그 이상.
 * 등급은 '대표성 근사 지표'일 뿐 관측값의 법적 효력과는 별개(리포트에서 명시). */
export function coverageGrade(distKm) {
  if (distKm < 5) return { grade: 'A', ko: '5km 미만 — 지점 관측값의 대표성 높음', en: 'Under 5 km — high representativeness of station observations' }
  if (distKm < 15) return { grade: 'B', ko: '15km 미만 — 대표성 양호, 국지 현상은 보정 검토', en: 'Under 15 km — good representativeness; review adjustments for local phenomena' }
  if (distKm < 30) return { grade: 'C', ko: '30km 미만 — 참고 가능, 지형·국지성 검토 필요', en: 'Under 30 km — usable as reference; terrain and locality review needed' }
  return { grade: 'D', ko: '30km 이상 — 인접 지점 보간·보조 자료 병행 권장', en: '30 km or more — interpolation with adjacent stations and auxiliary data recommended' }
}

/* 용도별 리포트 프리셋 — 각 용도에서 리포트에 담기는 기상 요소가 다름.
 * icon은 LineIcon name(risk/site/target). */
export const USE_CASES = [
  {
    key: 'insurance',
    ko: '보험 손해사정',
    en: 'Insurance Claims Adjustment',
    icon: 'risk',
    elementsKo: ['시간·일 강수량', '최대순간풍속(돌풍)', '우박·뇌전(낙뢰) 현상', '적설·강설', '일기현상 기사'],
    elementsEn: ['Hourly/daily precipitation', 'Maximum instantaneous wind (gusts)', 'Hail and lightning phenomena', 'Snowfall and snow depth', 'Weather phenomena log'],
    descKo: '침수·풍수해·낙뢰 등 사고 시점의 관측값을 지점 근거와 함께 정리 — 손해사정 판단의 기상 근거 자료로.',
    descEn: 'Observed values at the time of loss — flooding, wind damage, lightning — organized with station provenance, as meteorological grounds for claims adjustment.',
  },
  {
    key: 'construction',
    ko: '건설 공기연장 클레임',
    en: 'Construction EOT Claims',
    icon: 'site',
    elementsKo: ['일 강수량·강수일수', '일 최고·최저기온(혹서·혹한)', '일 평균·최대풍속', '적설심', '작업불능일 판정 기준치 대비 집계'],
    elementsEn: ['Daily precipitation and rain-day counts', 'Daily max/min temperature (heat and cold extremes)', 'Daily mean and maximum wind speed', 'Snow depth', 'Tally against non-workable-day threshold criteria'],
    descKo: '공사 기간의 기상 불가동일을 기준치 대비 집계 — 공기연장(EOT) 클레임의 정량 근거로.',
    descEn: 'Weather-caused non-workable days over the construction period, tallied against thresholds — quantitative grounds for extension-of-time claims.',
  },
  {
    key: 'legal',
    ko: '소송·분쟁',
    en: 'Litigation & Disputes',
    icon: 'target',
    elementsKo: ['사고 시각 전후 시계열 관측값', '시정(안개)·일기현상', '기온(결빙 조건)', '강수·풍속', '관측지점 거리·대표성 명시'],
    elementsEn: ['Time-series observations around the incident time', 'Visibility (fog) and weather phenomena', 'Temperature (icing conditions)', 'Precipitation and wind speed', 'Station distance and representativeness stated'],
    descKo: '사고·계약 분쟁 시점의 기상 사실관계를 시계열로 재구성 — 출처·지점 거리·한계까지 명시해 다툼에 견디는 자료로.',
    descEn: 'The meteorological facts at the time of an incident or contract dispute, reconstructed as a time series — with sources, station distance and limitations stated, built to withstand challenge.',
  },
]
