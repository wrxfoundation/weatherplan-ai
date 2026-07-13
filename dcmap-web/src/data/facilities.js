import centers from '../../data/dc_centers.json'

export const FACILITIES = centers.facilities

export const DATA_VERSION = { version: centers.version, date: centers.generated_at }

export const STATUS_LABEL = {
  operating: '운영',
  construction: '건설',
  planned: '계획',
  delayed: '지연',
  cancelled: '무산',
}

export const GEOCODE_LABEL = {
  road: '도로명주소(검증)',
  parcel: '필지(사업자 공개주소)',
  sigungu: '시군구 중심점',
  sido: '시도 중심점',
}

// 정밀 좌표(실제 부지) vs 근사 좌표(행정구역 중심점) 구분 — 정직한 위치 표기용.
export const PRECISE_GEOCODE = new Set(['road', 'parcel'])
export const isCoarseGeocode = (level) => !PRECISE_GEOCODE.has(level)

// 하이퍼스케일 분류 기준: 공개 용량 100MW 이상 (aidatacentermap 등 업계 통용 기준)
export const HYPERSCALE_MW = 100

export const slugOf = (f) => f.id.replace(/^kr-/, '')

export const findBySlug = (slug) => FACILITIES.find((f) => slugOf(f) === slug)

export const SIDOS = [...new Set(FACILITIES.map((f) => f.sido))].sort((a, b) => a.localeCompare(b, 'ko'))

export const TYPES = [...new Set(FACILITIES.map((f) => f.type))].sort((a, b) => a.localeCompare(b, 'ko'))

// 수도권(서울·경기·인천) — 계통영향평가 ±15점 감점·억제 권역
export const CAPITAL_SIDOS = new Set(['서울', '경기', '인천'])

// 주소 문자열(시도 접두)로 수도권 여부 판정 — vworld 지번주소 앞부분 기준(가장 정확).
export function isCapitalByAddr(addr) {
  const s = String(addr || '')
  if (/^(서울|인천)/.test(s)) return true
  if (/^경기/.test(s)) return true
  if (/^(강원|충|전|경(북|남|상)|부산|대구|대전|광주|울산|세종|제주)/.test(s)) return false
  return null // 판정 불가
}

// 좌표 대략 수도권 bbox — 주소 확보 전 잠정 기본값(경계 부정확, addr로 정정됨).
export function isCapitalByPoint(lat, lng) {
  return lat >= 36.9 && lat <= 38.35 && lng >= 126.0 && lng <= 127.55
}

export function applyFilters(list, { statuses, type, sido, minMw, q, zone }) {
  const needle = q?.toLowerCase() ?? ''
  return list.filter((f) => {
    if (statuses.size && !statuses.has(f.status === 'delayed' ? 'planned' : f.status)) return false
    if (type && f.type !== type) return false
    if (sido && f.sido !== sido) return false
    // zone: 'cap' 수도권만 · 'non' 비수도권만 · 그 외 전체
    if (zone === 'non' && CAPITAL_SIDOS.has(f.sido)) return false
    if (zone === 'cap' && !CAPITAL_SIDOS.has(f.sido)) return false
    if (minMw != null && !(f.power_mw_public >= minMw)) return false
    if (needle) {
      const haystack = [f.name, f.name_en, f.operator, f.sido, f.sigungu].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })
}
