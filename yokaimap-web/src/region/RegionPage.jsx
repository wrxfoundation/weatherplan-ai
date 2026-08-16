import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SIDO_BY_SLUG, REGIONS, inSido, PRECISION_LABEL } from '../data/yokai.js'
import YokaiCard from '../ui/YokaiCard.jsx'
import OmenPanel from '../map/OmenPanel.jsx'
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
        <Link to="/dogam">도감으로</Link>
      </main>
    )
  }

  return (
    <main className="page">
      <p className="small muted" style={{ margin: 0 }}>
        <Link to="/dogam">도감</Link>
      </p>
      <h1 style={{ margin: '4px 0', fontSize: 'var(--text-h1)' }}>{region.full} 요괴 전승지</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        전승지가 기록된 {list.length}체. 시군구·시도 중심점으로 표시된 항목은 실제 지점이 아니라 권역 근사입니다.
      </p>

      <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
        <OmenPanel lat={region.lat} lng={region.lng} sido={region.name} />
        <div className="panel" style={{ padding: 'var(--sp-3)', flex: 1, minWidth: 260 }}>
          <strong className="small">이 지역 전승지 목록</strong>
          <ul className="src-list" style={{ marginTop: 6 }}>
            {list.flatMap((e) =>
              e.sites
                .filter((s) => s.sido === region.name)
                .map((s, i) => (
                  <li key={`${e.id}-${i}`}>
                    <Link to={`/yokai/${e.id.replace(/^kr-/, '')}`}>{e.canonical}</Link> — {s.name} (
                    {PRECISION_LABEL[s.precision]})
                  </li>
                )),
            )}
          </ul>
        </div>
      </div>

      <div className="card-grid">
        {list.map((e) => (
          <YokaiCard key={e.id} entry={e} />
        ))}
      </div>

      <div className="section">
        <h2>다른 지역</h2>
        <div className="row">
          {REGIONS.filter((r) => r.slug !== slug).map((r) => (
            <Link key={r.slug} className="chip" to={`/region/${r.slug}`}>
              {r.name}
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
