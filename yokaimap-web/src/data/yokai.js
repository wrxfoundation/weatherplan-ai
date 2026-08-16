import bundle from '../../public/data/yokai.json'

export const META = {
  version: bundle.version,
  generated_at: bundle.generated_at,
  count: bundle.count,
  siteCount: bundle.site_count,
  license: bundle.license,
  stats: bundle.stats,
}

export const YOKAI = bundle.entries
export const CATEGORIES = bundle.categories
export const RARITY = bundle.rarity
export const VERIFICATION = bundle.verification
export const REGIONS = bundle.regions

export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))
export const RAR = Object.fromEntries(RARITY.map((r) => [r.id, r]))
export const VER = Object.fromEntries(VERIFICATION.map((v) => [v.id, v]))
export const SIDO_BY_SLUG = Object.fromEntries(REGIONS.map((r) => [r.slug, r]))
export const SIDO_BY_NAME = Object.fromEntries(REGIONS.map((r) => [r.name, r]))

export const slugOf = (e) => e.id.replace(/^kr-/, '')
export const byId = (id) => YOKAI.find((e) => e.id === id)
export const bySlug = (slug) => YOKAI.find((e) => slugOf(e) === slug)

export const DISTRIBUTION_LABEL = {
  nationwide: '전국 광포',
  regional: '권역 전승',
  local: '단일 지역',
  online: '온라인 발생',
}

export const PRECISION_LABEL = {
  parcel: '지점(필지)',
  dong: '읍면동',
  sigungu: '시군구 중심점',
  sido: '시도 중심점',
}

// 시군구 이하 중심점은 실제 전승 지점이 아니다 — 지도에서 점선 링으로 구분 표기한다.
export const isApprox = (precision) => precision === 'sigungu' || precision === 'sido'

/** 전승지 마커 목록 — 요괴 1체가 여러 전승지를 가질 수 있으므로 평탄화한다. */
export const SITES = YOKAI.flatMap((e) =>
  e.sites.map((s, i) => ({ ...s, key: `${e.id}#${i}`, yokai: e })),
)

/** 전승지가 없는 개체(광포설화·관념형) — 지도에 못 찍지만 도감에는 남는다. */
export const UNMAPPED = YOKAI.filter((e) => e.sites.length === 0)

export function applyFilters(list, { cats, rarities, sido, q, showLowConfidence, onlyMapped }) {
  const needle = (q ?? '').trim().toLowerCase()
  return list.filter((e) => {
    if (cats?.size && !cats.has(e.category)) return false
    if (rarities?.size && !rarities.has(e.rarity)) return false
    if (sido && !e.sites.some((s) => s.sido === sido)) return false
    if (!showLowConfidence && e.confidence === 'low') return false
    if (onlyMapped && e.sites.length === 0) return false
    if (needle) {
      const hay = [e.canonical, ...e.aliases, e.names?.en, e.summary, ...(e.traits ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
}

export const countByCategory = (list) =>
  list.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + 1 }), {})

export const inSido = (name) => YOKAI.filter((e) => e.sites.some((s) => s.sido === name))
