import centers from '../../data/dc_centers.json'

export const FACILITIES = centers.facilities

export const DATA_VERSION = { version: centers.version, date: centers.generated_at }

export const STATUS_LABEL = {
  operating: '운영',
  construction: '건설',
  planned: '계획',
  delayed: '지연',
}

export const GEOCODE_LABEL = {
  parcel: '필지(사업자 공개주소)',
  sigungu: '시군구 중심점',
  sido: '시도 중심점',
}

// 하이퍼스케일 분류 기준: 공개 용량 100MW 이상 (aidatacentermap 등 업계 통용 기준)
export const HYPERSCALE_MW = 100

export const slugOf = (f) => f.id.replace(/^kr-/, '')

export const findBySlug = (slug) => FACILITIES.find((f) => slugOf(f) === slug)

export const SIDOS = [...new Set(FACILITIES.map((f) => f.sido))].sort((a, b) => a.localeCompare(b, 'ko'))

export const TYPES = [...new Set(FACILITIES.map((f) => f.type))].sort((a, b) => a.localeCompare(b, 'ko'))

export function applyFilters(list, { statuses, type, sido, minMw, q }) {
  const needle = q?.toLowerCase() ?? ''
  return list.filter((f) => {
    if (statuses.size && !statuses.has(f.status === 'delayed' ? 'planned' : f.status)) return false
    if (type && f.type !== type) return false
    if (sido && f.sido !== sido) return false
    if (minMw != null && !(f.power_mw_public >= minMw)) return false
    if (needle) {
      const haystack = [f.name, f.name_en, f.operator, f.sido, f.sigungu].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })
}
