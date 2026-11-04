import bundle from '../../public/data/tales.json'
import { byId } from './yokai.js'

/**
 * 설화는 요괴와 다른 객체다.
 *
 * 삼년고개에 '출몰 시간'이나 '희귀도'를 붙이면 스키마가 거짓말을 하므로,
 * rarity·omens·habitat·art를 쓰지 않는 별도 컬렉션으로 둔다.
 * 대신 sites는 같은 모양이라 같은 지도에 올라가고, sources·verification도 같은 규칙이다.
 */

export const TALE_META = {
  version: bundle.version,
  generated_at: bundle.generated_at,
  count: bundle.count,
  siteCount: bundle.site_count,
  stats: bundle.stats,
}

export const TALES = bundle.tales
export const TALE_KINDS = bundle.kinds
export const KIND = Object.fromEntries(TALE_KINDS.map((k) => [k.id, k]))

export const taleSlug = (t) => t.id.replace(/^tale-/, '')
export const taleById = (id) => TALES.find((t) => t.id === id)
export const taleBySlug = (slug) => TALES.find((t) => taleSlug(t) === slug)

/** 이 개체가 나오는 설화. 요괴 상세에서 역방향으로 찾는다. */
export const talesOf = (yokaiId) => TALES.filter((t) => t.characters.includes(yokaiId))

/** 설화에 나오는 도감 개체(존재하는 것만). 참조 무결성은 빌드가 이미 검사했다. */
export const charactersOf = (tale) => tale.characters.map(byId).filter(Boolean)

/** 설화 배경지 마커. 요괴 전승지와 구분하려고 kind를 달아 둔다. */
export const TALE_SITES = TALES.flatMap((t) =>
  t.sites.map((s, i) => ({ ...s, key: `${t.id}#${i}`, tale: t })),
)

export const taleCountByKind = (list) =>
  list.reduce((acc, t) => ({ ...acc, [t.kind]: (acc[t.kind] ?? 0) + 1 }), {})

export function filterTales(list, { kinds, sido, q, motif }) {
  const needle = (q ?? '').trim().toLowerCase()
  return list.filter((t) => {
    if (kinds?.size && !kinds.has(t.kind)) return false
    if (sido && !t.sites.some((s) => s.sido === sido)) return false
    if (motif && !t.motifs.includes(motif)) return false
    if (needle) {
      const hay = [t.title, ...t.aliases, t.summary, ...t.motifs].join(' ').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
}

/** 화소 목록 — 많이 쓰인 순. 설화는 분류가 셋뿐이라 화소가 실질적인 탐색축이다. */
export const MOTIFS = Object.entries(
  TALES.flatMap((t) => t.motifs).reduce((a, m) => ({ ...a, [m]: (a[m] ?? 0) + 1 }), {}),
)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([name, n]) => ({ name, n }))
