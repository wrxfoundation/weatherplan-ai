import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SIDO_BY_SLUG, REGIONS, inSido, PRECISION_LABEL, isApprox, slugOf } from '../data/yokai.js'
import YokaiCard from '../ui/YokaiCard.jsx'
import OmenPanel from '../map/OmenPanel.jsx'
import AdSlot from '../ui/AdSlot.jsx'
import { useHead, SITE_ORIGIN } from '../ui/useHead.js'
import { regionJsonLd } from '../seo.js'

export default function RegionPage() {
  const { slug } = useParams()
  const region = SIDO_BY_SLUG[slug]
  const list = useMemo(() => (region ? inSido(region.name) : []), [region])

  useHead(
    region
      ? {
          title: `${region.full} 요괴 전승지 — 한국요괴지도`,
          description: `${region.full}에 전승지가 기록된 요괴·신격 ${list.length}체. 공개 자료 기반 출처·검증등급 표기.`,
          canonical: `/region/${slug}`,
          jsonLd: regionJsonLd(region, list, SITE_ORIGIN),
        }
      : { title: '지역을 찾을 수 없음 — 한국요괴지도' },
  )

  if (!region) {
    return (
      <main className="page">
        <h1>없는 지역입니다</h1>
        <p>
          <Link to="/dogam">도감으로</Link>
        </p>
      </main>
    )
  }

  const sites = list.flatMap((e) => e.sites.filter((s) => s.sido === region.name).map((s) => ({ ...s, entry: e })))

  return (
    <main className="page">
      <p className="crumbs">
        <Link to="/dogam">도감</Link> · 지역
      </p>
      <h1 style={{ margin: '4px 0 var(--sp-2)', fontSize: 'var(--text-h1)' }}>{region.full} 요괴 전승지</h1>
      <p className="body-text" style={{ maxWidth: 'var(--read-max)' }}>
        전승지가 기록된 {list.length}체 · 전승지 {sites.length}곳. 시군구·시도 중심점으로 표시된 항목은 실제 지점이
        아니라 권역 근사입니다.
      </p>

      <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--sp-4)', marginTop: 'var(--sp-4)' }}>
        <OmenPanel lat={region.lat} lng={region.lng} sido={region.name} />
        <div className="panel" style={{ padding: 'var(--sp-4)', flex: '1 1 320px' }}>
          <div className="section-head" style={{ marginBottom: 'var(--sp-2)' }}>
            <h2 style={{ fontSize: 'var(--text-body)', fontFamily: 'var(--font-sans)' }}>전승지 목록</h2>
          </div>
          <ul className="src-list">
            {sites.map((s, i) => (
              <li key={i}>
                <Link to={`/yokai/${slugOf(s.entry)}`}>{s.entry.canonical}</Link> — {s.name}
                <span className="muted">
                  {' '}
                  ({PRECISION_LABEL[s.precision]}
                  {isApprox(s.precision) ? ' · 근사' : ''})
                </span>
              </li>
            ))}
          </ul>
          <p className="small muted" style={{ margin: 'var(--sp-3) 0 0' }}>
            <Link to="/map">지도에서 보기 →</Link>
          </p>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: 'var(--sp-5)' }}>
        {list.map((e) => (
          <YokaiCard key={e.id} entry={e} />
        ))}
      </div>

      {list.length === 0 && <div className="empty">이 지역에 좌표가 확정된 전승지가 아직 없습니다.</div>}

      <AdSlot slot="region-footer" />

      {/* 지역 페이지는 담당 공무원·기관 유입 경로 — B2B 리드를 여기서 잡는다(MONETIZATION.md §2) */}
      <section className="section">
        <div className="notice accent">
          <strong>{region.full} 관련 기관이신가요?</strong> 권역 요괴 콘텐츠 팩, 스탬프 투어 코스 설계, 안내판·리플릿
          원고를 근거표와 함께 납품합니다. <Link to="/business">협업 안내 보기 →</Link>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>다른 지역</h2>
        </div>
        <div className="row">
          {REGIONS.filter((r) => r.slug !== slug).map((r) => (
            <Link key={r.slug} className="chip" to={`/region/${r.slug}`}>
              {r.name}
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
