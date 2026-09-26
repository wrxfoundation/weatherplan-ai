import bundle from '../../public/data/songs.json'
import { byId } from './yokai.js'
import { taleById } from './tales.js'

/**
 * 세 번째 컬렉션 — 노래·시가.
 *
 * 개체(요괴)도 이야기(설화)도 아닌 텍스트다. 원문이 남아 있다는 점에서 인용 가치가
 * 가장 크지만 그만큼 경계가 필요하다. original은 향찰·한문 퍼블릭 도메인 원문이고,
 * gloss는 이 프로젝트가 직접 쓴 산문 뜻풀이다 — 특정 학자의 해독안이 아니다.
 * 이 구분이 흐려지면 남의 저작을 우리 데이터라고 배포하는 셈이 된다.
 */

export const SONG_META = {
  version: bundle.version,
  generated_at: bundle.generated_at,
  count: bundle.count,
  siteCount: bundle.site_count,
  withOriginal: bundle.with_original,
  note: bundle.note,
  stats: bundle.stats,
}

export const SONGS = bundle.songs
export const SONG_GENRES = bundle.genres
export const GENRE = Object.fromEntries(SONG_GENRES.map((g) => [g.id, g]))

export const songSlug = (g) => g.id.replace(/^song-/, '')
export const songById = (id) => SONGS.find((g) => g.id === id)
export const songBySlug = (slug) => SONGS.find((g) => songSlug(g) === slug)

/** 이 개체가 나오는 노래. 요괴 상세에서 역방향으로 찾는다. */
export const songsOf = (yokaiId) => SONGS.filter((g) => g.characters.includes(yokaiId))
/** 이 설화에 딸린 노래. 설화 상세에서 역방향으로 찾는다. */
export const songsOfTale = (taleId) => SONGS.filter((g) => g.tales.includes(taleId))

export const castOf = (song) => song.characters.map(byId).filter(Boolean)
export const talesOfSong = (song) => song.tales.map(taleById).filter(Boolean)

export const SONG_SITES = SONGS.flatMap((g) => g.sites.map((s, i) => ({ ...s, key: `${g.id}#${i}`, song: g })))

export const songCountByGenre = (list) =>
  list.reduce((acc, g) => ({ ...acc, [g.genre]: (acc[g.genre] ?? 0) + 1 }), {})

export function filterSongs(list, { genres, fn, q, onlyOriginal }) {
  const needle = (q ?? '').trim().toLowerCase()
  return list.filter((g) => {
    if (genres?.size && !genres.has(g.genre)) return false
    if (fn && !g.function.includes(fn)) return false
    if (onlyOriginal && !g.original) return false
    if (needle) {
      const hay = [g.title, ...g.aliases, g.summary, g.gloss, ...g.function].join(' ').toLowerCase()
      if (!hay.includes(needle)) return false
    }
    return true
  })
}

/** 기능 목록 — 벽사·기원·참요처럼 '노래가 하는 일'이 실질적인 탐색축이다. */
export const FUNCTIONS = Object.entries(
  SONGS.flatMap((g) => g.function).reduce((a, f) => ({ ...a, [f]: (a[f] ?? 0) + 1 }), {}),
)
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([name, n]) => ({ name, n }))
