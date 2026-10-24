import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  SONGS,
  SONG_GENRES,
  GENRE,
  SONG_META,
  FUNCTIONS,
  filterSongs,
  songCountByGenre,
  songSlug,
} from '../data/songs.js'
import AdSlot from '../ui/AdSlot.jsx'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'
import { VerificationBadge } from '../ui/Badges.jsx'

/**
 * 노래·시가 목록.
 *
 * 갈래(향가·무가·민요…)만으로는 좁혀지지 않아서 '기능'을 함께 축으로 둔다 —
 * 벽사냐 기원이냐 참요냐가 실제로 사람들이 찾는 기준이다.
 * '원문 있는 것만' 필터를 둔 이유는 인용하려는 사람에게 그게 첫 조건이기 때문이다.
 */
export default function NoraePage() {
  const [params, setParams] = useSearchParams()
  const [genres, setGenres] = useState(() => new Set(params.get('genre') ? params.get('genre').split(',') : []))
  const [fn, setFn] = useState(params.get('fn') ?? '')
  const [onlyOriginal, setOnlyOriginal] = useState(params.get('orig') === '1')
  const [q, setQ] = useState(params.get('q') ?? '')

  useHead({
    title: `설화 속 노래 — 향가·무가·민요 ${SONG_META.count}편`,
    description: `요괴·설화에 붙어 전하는 노래와 시가 ${SONG_META.count}편. 처용가·구지가·헌화가 등 원문이 남아 있는 ${SONG_META.withOriginal}편은 원문을 함께 싣고, 뜻풀이는 직접 써서 특정 해독안을 옮기지 않습니다.`,
    canonical: '/norae',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '설화 속 노래 — 향가·무가·민요',
      url: `${SITE_ORIGIN}/norae`,
      numberOfItems: SONG_META.count,
      isPartOf: { '@type': 'WebSite', name: '한국요괴지도', url: SITE_ORIGIN },
    },
  })

  const list = useMemo(() => filterSongs(SONGS, { genres, fn, q, onlyOriginal }), [genres, fn, q, onlyOriginal])
  const counts = useMemo(() => songCountByGenre(SONGS), [])

  const toggleGenre = (id) => {
    const next = new Set(genres)
    next.has(id) ? next.delete(id) : next.add(id)
    setGenres(next)
    const p = new URLSearchParams(params)
    next.size ? p.set('genre', [...next].join(',')) : p.delete('genre')
    setParams(p, { replace: true })
  }
  const reset = () => {
    setGenres(new Set())
    setFn('')
    setOnlyOriginal(false)
    setQ('')
    setParams({}, { replace: true })
  }

  return (
    <main className="page">
      <p className="eyebrow">요괴와 설화에 붙어 전하는 노래</p>
      <h1>향가·무가·민요 {SONG_META.count}편</h1>
      <p className="lede" style={{ maxWidth: 'var(--read-max)' }}>
        처용가로 역신을 물리고, 구지가로 하늘에서 알을 불러내리고, 비형랑의 이름을 적어 문에 붙였습니다.
        <Link to="/dogam"> 도감</Link>과 <Link to="/seolhwa">설화</Link>가 무엇이 있었는지를 말한다면, 노래는 그때
        사람들이 실제로 무슨 소리를 냈는지를 남깁니다.
      </p>

      {/* 이 데이터셋에서 가장 조심해야 할 경계라 목록 맨 위에 둔다 */}
      <div className="notice accent" style={{ marginTop: 'var(--sp-4)' }}>
        <strong>원문과 뜻풀이는 다릅니다</strong> — 향찰·한문 <b>원문</b>은 퍼블릭 도메인이라 그대로 싣습니다. 아래의{' '}
        <b>뜻풀이</b>는 이 프로젝트가 직접 쓴 산문 풀이이며, 특정 학자의 향찰 해독안이나 현대어 번역을 옮긴 것이
        아닙니다. 향가 해독은 학자마다 갈리므로 축자역이 필요하면 원문과 학술 해독본을 따로 보셔야 합니다.
      </div>

      <div className="panel" style={{ padding: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
        <div className="row">
          <input
            className="input"
            placeholder="제목·기능·뜻풀이 검색 (예: 벽사, 참요, 거북)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="row" style={{ marginTop: 'var(--sp-3)' }}>
          {SONG_GENRES.filter((g) => counts[g.id]).map((g) => (
            <button
              key={g.id}
              className={`chip${genres.has(g.id) ? ' on' : ''}`}
              onClick={() => toggleGenre(g.id)}
              title={g.blurb}
            >
              {g.name} <span className="num">{counts[g.id]}</span>
            </button>
          ))}
          <button
            className={`chip${onlyOriginal ? ' on' : ''}`}
            onClick={() => setOnlyOriginal((v) => !v)}
            title="향찰·한문 원문이 실린 항목만"
          >
            원문 있는 것만 <span className="num">{SONG_META.withOriginal}</span>
          </button>
          <span className="spacer" />
          <span className="small muted num">{list.length}편</span>
          {(genres.size > 0 || fn || onlyOriginal || q) && (
            <button className="chip" onClick={reset}>
              초기화
            </button>
          )}
        </div>
        <div className="row" style={{ marginTop: 'var(--sp-3)' }}>
          {FUNCTIONS.slice(0, 12).map((f) => (
            <button
              key={f.name}
              className={`chip${fn === f.name ? ' on' : ''}`}
              onClick={() => setFn(fn === f.name ? '' : f.name)}
            >
              {f.name} <span className="num">{f.n}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="song-grid" style={{ marginTop: 'var(--sp-4)' }}>
        {list.map((g) => (
          <SongCard key={g.id} song={g} />
        ))}
      </div>

      {list.length === 0 && (
        <div className="empty">
          조건에 맞는 노래가 없습니다.{' '}
          <button className="chip" onClick={reset}>
            필터 초기화
          </button>
        </div>
      )}

      <AdSlot slot="norae-footer" />
    </main>
  )
}

function SongCard({ song }) {
  const g = GENRE[song.genre]
  return (
    <Link className="song-card" to={`/norae/${songSlug(song)}`}>
      <div className="tale-card-top">
        <span className="song-genre">{g?.name ?? song.genre}</span>
        {song.original ? (
          <span className="song-orig-flag">원문</span>
        ) : (
          song.original_script === 'oral' && <span className="small muted">구전</span>
        )}
      </div>
      <h3>{song.title}</h3>
      {song.era && <div className="small muted">{song.era}</div>}
      {/* 원문이 있으면 카드에서 바로 보여 준다 — 이게 이 컬렉션의 물건이다 */}
      {song.original && <pre className="song-original-peek">{song.original.split('\n').slice(0, 4).join('\n')}</pre>}
      <p>{song.summary}</p>
      <div className="row" style={{ gap: 5, marginTop: 'var(--sp-3)' }}>
        <VerificationBadge id={song.verification} confidence={song.confidence} />
        {song.function.slice(0, 2).map((f) => (
          <span key={f} className="small muted">
            #{f}
          </span>
        ))}
      </div>
    </Link>
  )
}
