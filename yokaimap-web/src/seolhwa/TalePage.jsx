import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TALES, KIND, taleBySlug, taleById, taleSlug, charactersOf } from '../data/tales.js'
import { CAT, slugOf, VER, PRECISION_LABEL, isApprox, SIDO_BY_NAME } from '../data/yokai.js'
import Seal from '../ui/Seal.jsx'
import Icon from '../ui/Icon.jsx'
import { VerificationBadge } from '../ui/Badges.jsx'
import ShareRow from '../ui/ShareRow.jsx'
import AdSlot from '../ui/AdSlot.jsx'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'
import { songsOfTale, songSlug, GENRE } from '../data/songs.js'

const SENSITIVITY_TEXT = {
  living_faith:
    '현재도 믿고 모시는 신앙과 관련된 항목입니다. 이 서술은 문화·엔터테인먼트 목적이며 신앙을 권하거나 폄하할 의도가 없습니다.',
  private_property: '실존 시설·사유지와 관련될 수 있어 개별 장소를 특정해 싣지 않습니다. 무단 방문을 권하지 않습니다.',
  tragedy_linked: '실제 사건·사고와 결부되는 소재입니다. 특정 사건이나 피해자를 연상시키는 서술을 싣지 않습니다.',
  ethnic_slur_risk: '특정 집단에 대한 편견으로 읽힐 수 있는 표현이 전승에 포함된 항목입니다.',
}

export default function TalePage() {
  const { slug } = useParams()
  const tale = taleBySlug(slug)

  useHead(
    useMemo(
      () =>
        tale
          ? {
              title: `${tale.title} — 한국 설화 | 한국요괴지도`,
              description: `${tale.summary} ${KIND[tale.kind]?.name} · 출처와 검증등급을 함께 싣습니다.`,
              canonical: `/seolhwa/${taleSlug(tale)}`,
              jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'CreativeWork',
                name: tale.title,
                alternateName: tale.aliases,
                genre: KIND[tale.kind]?.name,
                abstract: tale.summary,
                inLanguage: 'ko',
                url: `${SITE_ORIGIN}/seolhwa/${taleSlug(tale)}`,
                keywords: tale.motifs.join(', '),
                citation: tale.sources.map((s) => [s.title, s.ref].filter(Boolean).join(' — ')),
                ...(tale.sites.length > 0 && {
                  contentLocation: tale.sites.map((s) => ({
                    '@type': 'Place',
                    name: s.name,
                    address: { '@type': 'PostalAddress', addressRegion: s.sido, addressLocality: s.sigungu },
                    geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lng },
                  })),
                }),
                isPartOf: { '@type': 'WebSite', name: '한국요괴지도', url: SITE_ORIGIN },
              },
            }
          : { title: '찾을 수 없음 — 한국요괴지도' },
      [tale],
    ),
  )

  const siblings = useMemo(
    () => (tale ? TALES.filter((t) => t.kind === tale.kind).sort((a, b) => a.id.localeCompare(b.id)) : []),
    [tale],
  )

  if (!tale) {
    return (
      <main className="page page-narrow">
        <h1>찾을 수 없는 설화입니다</h1>
        <p>
          <Link to="/seolhwa">설화 목록으로 돌아가기</Link>
        </p>
      </main>
    )
  }

  const kind = KIND[tale.kind]
  const ver = VER[tale.verification]
  const cast = charactersOf(tale)
  const related = tale.related.map(taleById).filter(Boolean)
  const songs = songsOfTale(tale.id)
  const idx = siblings.findIndex((t) => t.id === tale.id)
  const prev = siblings[idx - 1]
  const next = siblings[idx + 1]

  return (
    <main className="page page-narrow" data-kind={tale.kind}>
      <p className="crumbs">
        <Link to="/seolhwa">설화</Link> · {kind?.name}
      </p>

      <h1>{tale.title}</h1>
      {tale.aliases.length > 0 && <div className="muted small">{tale.aliases.join(' · ')}</div>}
      <div className="row" style={{ gap: 5, marginTop: 'var(--sp-2)' }}>
        <span className="tale-kind" data-kind={tale.kind}>
          {kind?.name}
        </span>
        <VerificationBadge id={tale.verification} confidence={tale.confidence} />
      </div>

      <p className="lede" style={{ marginTop: 'var(--sp-4)' }}>
        {tale.summary}
      </p>

      {/* 공유는 요약을 읽은 직후가 가장 누르고 싶은 자리다 */}
      <ShareRow path={`/seolhwa/${taleSlug(tale)}`} text={`${tale.title} — ${tale.summary}`} />

      {tale.sensitivity && (
        <div className="notice accent">
          <strong>{'취급 주의'}</strong> — {SENSITIVITY_TEXT[tale.sensitivity.kind]} {tale.sensitivity.note}
        </div>
      )}

      {/* 유입 경로 논쟁은 숨기지 않는다. 도깨비에 뿔을 그리지 않는 것과 같은 이유다. */}
      {tale.foreign_origin && (
        <div className="notice warn">
          <strong>유입 경로 논쟁</strong> — {tale.foreign_origin.note}
        </div>
      )}

      <div className="section">
        <p className="body-text">{tale.body}</p>
      </div>

      {tale.motifs.length > 0 && (
        <div className="section">
          <div className="section-head">
            <Icon name="layers" size={17} />
            <h2>화소</h2>
          </div>
          <div className="row" style={{ gap: 5 }}>
            {tale.motifs.map((m) => (
              <Link key={m} className="chip" to={`/seolhwa?motif=${encodeURIComponent(m)}`}>
                #{m}
              </Link>
            ))}
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            화소(話素)는 이야기를 이루는 최소 단위입니다. 같은 화소를 공유하는 설화끼리 유형이 묶입니다.
          </p>
        </div>
      )}

      {cast.length > 0 && (
        <div className="section">
          <div className="section-head">
            <Icon name="book" size={17} />
            <h2>이 이야기에 나오는 개체</h2>
          </div>
          <div className="row">
            {cast.map((e) => (
              <Link
                key={e.id}
                className="chip"
                to={`/yokai/${slugOf(e)}`}
                style={{ '--cat': CAT[e.category]?.color }}
              >
                <Seal category={e.category} size="sm" />
                {e.canonical}
              </Link>
            ))}
          </div>
        </div>
      )}

      {tale.sites.length > 0 && (
        <div className="section">
          <div className="section-head">
            <Icon name="pin" size={17} />
            <h2>배경지</h2>
          </div>
          <ul className="src-list">
            {tale.sites.map((s, i) => (
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

      {tale.kind === 'folktale' && tale.sites.length === 0 && (
        <div className="section">
          <p className="small muted" style={{ marginBottom: 0 }}>
            민담이라 배경지 좌표가 없습니다. 때와 곳이 특정되지 않는 것이 민담의 성격이므로, 임의로 한 지역을 대표지로
            정하지 않습니다.
          </p>
        </div>
      )}

      <div className="section">
        <div className="section-head">
          <Icon name="quote" size={17} />
          <h2>출처</h2>
        </div>
        <ul className="src-list">
          {tale.sources.map((s, i) => (
            <li key={i}>
              {s.title}
              {s.ref ? ` — ${s.ref}` : ''}
              {s.url && (
                <>
                  {' '}
                  <a href={s.url} target="_blank" rel="noreferrer">
                    링크
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
        <p className="small muted">
          검증등급 <strong style={{ color: `var(--ver-${tale.verification})` }}>{ver?.name}</strong> — {ver?.desc}
        </p>
      </div>

      {related.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h2>이어지는 이야기</h2>
          </div>
          <div className="row">
            {related.map((t) => (
              <Link key={t.id} className="chip" to={`/seolhwa/${taleSlug(t)}`}>
                {t.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {songs.length > 0 && (
        <div className="section">
          <div className="section-head">
            <Icon name="flame" size={17} />
            <h2>이 이야기에 딸린 노래</h2>
          </div>
          <div className="row">
            {songs.map((g) => (
              <Link key={g.id} className="chip" to={`/norae/${songSlug(g)}`}>
                {g.title}
                <span className="muted small"> {GENRE[g.genre]?.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav className="pager">
        {prev ? (
          <Link to={`/seolhwa/${taleSlug(prev)}`}>
            <div className="dir row" style={{ gap: 4 }}>
              <Icon name="arrowLeft" size={13} />
              이전 · {kind?.name}
            </div>
            <div className="nm">{prev.title}</div>
          </Link>
        ) : (
          <span style={{ flex: 1 }} />
        )}
        {next ? (
          <Link to={`/seolhwa/${taleSlug(next)}`} style={{ textAlign: 'right' }}>
            <div className="dir row" style={{ gap: 4, justifyContent: 'flex-end' }}>
              다음 · {kind?.name}
              <Icon name="arrowRight" size={13} />
            </div>
            <div className="nm">{next.title}</div>
          </Link>
        ) : (
          <span style={{ flex: 1 }} />
        )}
      </nav>

      <AdSlot slot="tale-footer" />
    </main>
  )
}
