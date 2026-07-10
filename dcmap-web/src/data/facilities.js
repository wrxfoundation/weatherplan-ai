import centers from '../../data/dc_centers.json'

export const FACILITIES = centers.facilities

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

export const slugOf = (f) => f.id.replace(/^kr-/, '')

export const findBySlug = (slug) => FACILITIES.find((f) => slugOf(f) === slug)

export const SIDOS = [...new Set(FACILITIES.map((f) => f.sido))].sort((a, b) => a.localeCompare(b, 'ko'))

export const TYPES = [...new Set(FACILITIES.map((f) => f.type))].sort((a, b) => a.localeCompare(b, 'ko'))

export function applyFilters(list, { statuses, type, sido, minMw }) {
  return list.filter((f) => {
    if (statuses.size && !statuses.has(f.status === 'delayed' ? 'planned' : f.status)) return false
    if (type && f.type !== type) return false
    if (sido && f.sido !== sido) return false
    if (minMw != null && !(f.power_mw_public >= minMw)) return false
    return true
  })
}
