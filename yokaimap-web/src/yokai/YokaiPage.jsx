import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  bySlug,
  byId,
  slugOf,
  CAT,
  VER,
  PRECISION_LABEL,
  isApprox,
  SIDO_BY_NAME,
  DISTRIBUTION_LABEL,
} from '../data/yokai.js'
import { CategoryBadge, RarityBadge, VerificationBadge, DistributionBadge } from '../ui/Badges.jsx'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'
import { titleOf, descriptionOf, entryJsonLd } from '../seo.js'
import { WEATHER_LABEL, TIME_LABEL, SEASON_LABEL } from '../engine/omen.js'

const SENSITIVITY_TEXT = {
  living_faith:
    '현재도 믿고 모시는 신앙과 관련된 항목입니다. 이 서술은 문화·엔터테인먼트 목적이며 신앙을 권하거나 폄하할 의도가 없습니다.',
  private_property: '실존 시설·사유지와 관련될 수 있어 개별 장소를 특정해 싣지 않습니다. 무단 방문을 권하지 않습니다.',
  tragedy_linked: '실제 사건·사고와 결부되는 소재입니다. 특정 사건이나 피해자를 연상시키는 서술을 싣지 않습니다.',
  ethnic_slur_risk: '특정 집단에 대한 편견으로 읽힐 수 있는 표현이 전승에 포함된 항목입니다.',
}

export default function YokaiPage() {
  const { slug } = useParams()
  const entry = bySlug(slug)

  const head = useMemo(() => {
    if (!entry) return { title: '찾을 수 없음 — 한국요괴지도' }
    return {
      title: titleOf(entry),
      description: descriptionOf(entry),
      canonical: `/yokai/${slugOf(entry)}`,
      jsonLd: entryJsonLd(entry, SITE_ORIGIN),
    }
  }, [entry])
  useHead(head)

  if (!entry) {
    return (
      <main className="page page-narrow">
        <h1>찾을 수 없는 항목입니다</h1>
        <p className="muted">
          <Link to="/dogam">도감으로 돌아가기</Link>
        </p>
      </main>
    )
  }

  const cat = CAT[entry.category]
  const ver = VER[entry.verification]
  const related = entry.related.map(byId).filter(Boolean)

  return (
    <main className="page page-narrow">
      <p className="small muted" style={{ margin: 0 }}>
        <Link to="/dogam">도감</Link> · <Link to={`/category/${cat.id}`}>{cat.name}</Link>
      </p>

      <div className="detail-head">
        <h1>{entry.canonical}</h1>
        <div className="row" style={{ gap: 6 }}>
          <CategoryBadge id={entry.category} />
          <RarityBadge id={entry.rarity} />
          <DistributionBadge id={entry.distribution} />
          <VerificationBadge id={entry.verification} confidence={entry.confidence} />
        </div>
      </div>

      <p className="body-text" style={{ fontSize: 'var(--text-title)', marginTop: 'var(--sp-4)' }}>
        {entry.summary}
      </p>
      <p className="body-text">{entry.body}</p>

      {entry.sensitivity && (
        <p className="notice warn">{SENSITIVITY_TEXT[entry.sensitivity.kind] ?? entry.sensitivity.note}</p>
      )}

      {entry.confidence === 'low' && (
        <p className="notice warn">
          근거가 약한 항목입니다. 현재 유통되는 서술이 근현대 정리물에서 정착했을 가능성이 있어 채록 원자료 대조가
          끝나지 않았습니다. 지도 기본 레이어에서는 숨겨지고 &lsquo;이설·미검증 포함&rsquo;을 켜야 보입니다.
        </p>
      )}

      <div className="section">
        <h2>기본 정보</h2>
        <dl className="kv">
          {entry.aliases.length > 0 && (
            <>
              <dt>이표기</dt>
              <dd>{entry.aliases.join(' · ')}</dd>
            </>
          )}
          {entry.names?.en && (
            <>
              <dt>표기(영문)</dt>
              <dd>
                {entry.names.en}
                {entry.names.roman ? ` · ${entry.names.roman}` : ''}
              </dd>
            </>
          )}
          <dt>분포</dt>
          <dd>{DISTRIBUTION_LABEL[entry.distribution]}</dd>
          {entry.traits.length > 0 && (
            <>
              <dt>표지</dt>
              <dd>{entry.traits.join(' · ')}</dd>
            </>
          )}
          {entry.habitat.length > 0 && (
            <>
              <dt>출몰 장소</dt>
              <dd>{entry.habitat.join(' · ')}</dd>
            </>
          )}
          <dt>도상</dt>
          <dd className="muted">
            {entry.art.status === 'final' ? '제작 완료' : '제작 예정'} · 아트디렉션 {entry.art.direction}
            {entry.art.status !== 'final' && ' (한국에는 대응 도감 판화가 없어 신규 제작합니다)'}
          </dd>
        </dl>
      </div>

      {(entry.omens.weather.length > 0 || entry.omens.time.length > 0 || entry.omens.season.length > 0) && (
        <div className="section">
          <h2>출몰 조건</h2>
          <div className="row" style={{ gap: 6 }}>
            {entry.omens.weather.map((w) => (
              <span key={w} className="badge" style={{ color: 'var(--dancheong-indigo)' }}>
                {WEATHER_LABEL[w]}
              </span>
            ))}
            {entry.omens.time.map((t) => (
              <span key={t} className="badge" style={{ color: 'var(--dancheong-violet)' }}>
                {TIME_LABEL[t]}
              </span>
            ))}
            {entry.omens.season.map((s) => (
              <span key={s} className="badge" style={{ color: 'var(--dancheong-jade)' }}>
                {SEASON_LABEL[s]}
              </span>
            ))}
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>
            전승 기록에 조건이 명시된 경우에만 표시합니다. 이 값이 날씨 연동(괴담지수) 계산에 그대로 쓰입니다.
          </p>
        </div>
      )}

      {entry.sites.length > 0 && (
        <div className="section">
          <h2>전승지</h2>
          <ul className="src-list">
            {entry.sites.map((s, i) => (
              <li key={i}>
                <strong style={{ color: 'var(--text)' }}>{s.name}</strong> — {s.sido}
                {s.sigungu ? ` ${s.sigungu}` : ''} · {PRECISION_LABEL[s.precision]}
                {isApprox(s.precision) && <span style={{ color: 'var(--warn)' }}> (근사 좌표 — 실제 지점 아님)</span>}
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
        <h2>출처</h2>
        <ul className="src-list">
          {entry.sources.map((s, i) => (
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
          검증등급 <strong style={{ color: `var(--ver-${entry.verification})` }}>{ver?.name}</strong> — {ver?.desc}
        </p>
      </div>

      {related.length > 0 && (
        <div className="section">
          <h2>관련 항목</h2>
          <div className="card-grid">
            {related.map((r) => (
              <Link key={r.id} className="card" to={`/yokai/${slugOf(r)}`}>
                <h3>{r.canonical}</h3>
                <p>{r.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
