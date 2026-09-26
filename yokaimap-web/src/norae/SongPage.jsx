import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SONGS, GENRE, songBySlug, songById, songSlug, castOf, talesOfSong } from '../data/songs.js'
import { CAT, slugOf, VER, PRECISION_LABEL, isApprox, SIDO_BY_NAME } from '../data/yokai.js'
import { taleSlug } from '../data/tales.js'
import Seal from '../ui/Seal.jsx'
import Icon from '../ui/Icon.jsx'
import { VerificationBadge } from '../ui/Badges.jsx'
import ShareRow from '../ui/ShareRow.jsx'
import AdSlot from '../ui/AdSlot.jsx'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'

const SCRIPT_LABEL = {
  hyangchal: '향찰 표기',
  hanmun: '한문',
  hangul: '한글 기록',
  oral: '구전 — 정본 없음',
}

const SENSITIVITY_TEXT = {
  living_faith:
    '현재도 믿고 모시는 신앙과 관련된 항목입니다. 이 서술은 문화·엔터테인먼트 목적이며 신앙을 권하거나 폄하할 의도가 없습니다.',
  private_property: '실존 시설·사유지와 관련될 수 있어 개별 장소를 특정해 싣지 않습니다.',
  tragedy_linked: '실제 사건·사고와 결부되는 소재입니다.',
  ethnic_slur_risk: '특정 집단에 대한 편견으로 읽힐 수 있는 표현이 전승에 포함된 항목입니다.',
}

export default function SongPage() {
  const { slug } = useParams()
  const song = songBySlug(slug)

  useHead(
    useMemo(
      () =>
        song
          ? {
              title: `${song.title} — 설화 속 노래 | 한국요괴지도`,
              description: `${song.summary} ${GENRE[song.genre]?.name}${song.era ? ' · ' + song.era : ''} · 출처와 검증등급을 함께 싣습니다.`,
              canonical: `/norae/${songSlug(song)}`,
              jsonLd: {
                '@context': 'https://schema.org',
                // 원문이 있으면 시(詩)로, 없으면 일반 창작물로 표시한다
                '@type': song.original ? 'Poem' : 'CreativeWork',
                name: song.title,
                alternateName: song.aliases,
                genre: GENRE[song.genre]?.name,
                abstract: song.summary,
                inLanguage: 'ko',
                url: `${SITE_ORIGIN}/norae/${songSlug(song)}`,
                ...(song.original && { text: song.original }),
                temporalCoverage: song.era,
                keywords: song.function.join(', '),
                citation: song.sources.map((s) => [s.title, s.ref].filter(Boolean).join(' — ')),
                isPartOf: { '@type': 'WebSite', name: '한국요괴지도', url: SITE_ORIGIN },
              },
            }
          : { title: '찾을 수 없음 — 한국요괴지도' },
      [song],
    ),
  )

  const siblings = useMemo(
    () => (song ? SONGS.filter((g) => g.genre === song.genre).sort((a, b) => a.id.localeCompare(b.id)) : []),
    [song],
  )

  if (!song) {
    return (
      <main className="page page-narrow">
        <h1>찾을 수 없는 노래입니다</h1>
        <p>
          <Link to="/norae">노래 목록으로 돌아가기</Link>
        </p>
      </main>
    )
  }

  const genre = GENRE[song.genre]
  const ver = VER[song.verification]
  const cast = castOf(song)
  const tales = talesOfSong(song)
  const related = song.related.map(songById).filter(Boolean)
  const idx = siblings.findIndex((g) => g.id === song.id)
  const prev = siblings[idx - 1]
  const next = siblings[idx + 1]

  return (
    <main className="page page-narrow">
      <p className="crumbs">
        <Link to="/norae">노래</Link> · {genre?.name}
      </p>

      <h1>{song.title}</h1>
      {song.aliases.length > 0 && <div className="muted small">{song.aliases.join(' · ')}</div>}
      <div className="row" style={{ gap: 5, marginTop: 'var(--sp-2)' }}>
        <span className="song-genre">{genre?.name}</span>
        {song.era && <span className="small muted">{song.era}</span>}
        <VerificationBadge id={song.verification} confidence={song.confidence} />
      </div>

      <p className="lede" style={{ marginTop: 'var(--sp-4)' }}>
        {song.summary}
      </p>

      <ShareRow path={`/norae/${songSlug(song)}`} text={`${song.title} — ${song.summary}`} />

      {song.sensitivity && (
        <div className="notice accent">
          <strong>취급 주의</strong> — {SENSITIVITY_TEXT[song.sensitivity.kind]} {song.sensitivity.note}
        </div>
      )}

      {/* 원문 — 퍼블릭 도메인이므로 그대로 싣는다 */}
      {song.original ? (
        <div className="section">
          <div className="section-head">
            <Icon name="quote" size={17} />
            <h2>원문</h2>
            <span className="spacer" />
            <span className="small muted">{SCRIPT_LABEL[song.original_script]}</span>
          </div>
          <pre className="song-original">{song.original}</pre>
          {song.reading_note && <p className="small muted">{song.reading_note}</p>}
        </div>
      ) : (
        <div className="section">
          <div className="section-head">
            <Icon name="info" size={17} />
            <h2>원문</h2>
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            {song.original_script === 'oral'
              ? '구전이라 정본이 없습니다. 부르는 사람과 마을마다 사설이 달라지므로, 한 판본을 골라 원문으로 싣지 않습니다.'
              : '원문이 문헌에 전하지만 이 도감은 확인한 판본만 싣는 원칙이라 비워 둡니다.'}
            {song.reading_note ? ` ${song.reading_note}` : ''}
          </p>
        </div>
      )}

      {/* 뜻풀이 — 우리가 쓴 것. 원문과 같은 무게로 보이면 안 되므로 반드시 구분해 표시한다 */}
      <div className="section">
        <div className="section-head">
          <Icon name="book" size={17} />
          <h2>뜻풀이</h2>
        </div>
        <p className="body-text">{song.gloss}</p>
        <p className="small muted" style={{ marginBottom: 0 }}>
          이 뜻풀이는 한국요괴지도가 직접 쓴 산문 풀이입니다. 축자역이 아니며 특정 학자의 해독안이나 번역을 옮긴 것이
          아닙니다.
        </p>
      </div>

      {song.function.length > 0 && (
        <div className="section">
          <div className="section-head">
            <Icon name="layers" size={17} />
            <h2>노래가 하는 일</h2>
          </div>
          <div className="row" style={{ gap: 5 }}>
            {song.function.map((f) => (
              <Link key={f} className="chip" to={`/norae?fn=${encodeURIComponent(f)}`}>
                #{f}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(cast.length > 0 || tales.length > 0) && (
        <div className="section">
          <div className="section-head">
            <Icon name="link" size={17} />
            <h2>이 노래가 걸린 곳</h2>
          </div>
          <div className="row">
            {cast.map((e) => (
              <Link key={e.id} className="chip" to={`/yokai/${slugOf(e)}`} style={{ '--cat': CAT[e.category]?.color }}>
                <Seal category={e.category} size="sm" />
                {e.canonical}
              </Link>
            ))}
            {tales.map((t) => (
              <Link key={t.id} className="chip" to={`/seolhwa/${taleSlug(t)}`}>
                {t.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {song.sites.length > 0 && (
        <div className="section">
          <div className="section-head">
            <Icon name="pin" size={17} />
            <h2>부른 자리</h2>
          </div>
          <ul className="src-list">
            {song.sites.map((s, i) => (
              <li key={i}>
                <strong>{s.name}</strong> — {s.sido}
                {s.sigungu ? ` ${s.sigungu}` : ''} · {PRECISION_LABEL[s.precision]}
                {isApprox(s.precision) && <span style={{ color: 'var(--gold)' }}> (근사 좌표 — 실제 지점 아님)</span>}
                {s.note ? ` · ${s.note}` : ''}
                {SIDO_BY_NAME[s.sido] && (
                  <>
                    {' · '}
                    <Link to={`/region/${SIDO_BY_NAME[s.sido].slug}`}>{s.sido} 전승 보기</Link>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="section">
        <div className="section-head">
          <Icon name="quote" size={17} />
          <h2>출처</h2>
        </div>
        <ul className="src-list">
          {song.sources.map((s, i) => (
            <li key={i}>
              {s.title}
              {s.ref ? ` — ${s.ref}` : ''}
            </li>
          ))}
        </ul>
        <p className="small muted">
          검증등급 <strong style={{ color: `var(--ver-${song.verification})` }}>{ver?.name}</strong> — {ver?.desc}
        </p>
      </div>

      {related.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h2>함께 보는 노래</h2>
          </div>
          <div className="row">
            {related.map((g) => (
              <Link key={g.id} className="chip" to={`/norae/${songSlug(g)}`}>
                {g.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav className="pager">
        {prev ? (
          <Link to={`/norae/${songSlug(prev)}`}>
            <div className="dir row" style={{ gap: 4 }}>
              <Icon name="arrowLeft" size={13} />
              이전 · {genre?.name}
            </div>
            <div className="nm">{prev.title}</div>
          </Link>
        ) : (
          <span style={{ flex: 1 }} />
        )}
        {next ? (
          <Link to={`/norae/${songSlug(next)}`} style={{ textAlign: 'right' }}>
            <div className="dir row" style={{ gap: 4, justifyContent: 'flex-end' }}>
              다음 · {genre?.name}
              <Icon name="arrowRight" size={13} />
            </div>
            <div className="nm">{next.title}</div>
          </Link>
        ) : (
          <span style={{ flex: 1 }} />
        )}
      </nav>

      <AdSlot slot="song-footer" />
    </main>
  )
}
