import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL, slugOf } from '../data/facilities.js'
import { SLUG_TO_SIDO } from '../content/sido_slugs.js'
import { LAND_DONG, LAND_DONG_PERIOD } from '../data/landPriceDong.js'
import { fmtRate } from '../data/landPrice.js'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function regionSummary(sido) {
  const list = FACILITIES.filter((f) => f.sido === sido)
  const by = { operating: 0, construction: 0, planned: 0 }
  let mw = 0
  for (const f of list) {
    by[f.status === 'delayed' ? 'planned' : f.status] += 1
    if (f.power_mw_public != null) mw += f.power_mw_public
  }
  return { list, by, mw }
}

export function regionDescription(sido, { list, by, mw }) {
  return `${sido} 데이터센터 ${list.length}곳 — 운영 ${by.operating} · 건설 ${by.construction} · 계획 ${by.planned}${
    mw > 0 ? ` · 공개 전력 합계 ${mw}MW` : ''
  }. 공개 소스 기반 현황, 명당 AI.`
}

export default function RegionPage() {
  const { slug } = useParams()
  const sido = SLUG_TO_SIDO[slug]
  const summary = useMemo(() => (sido ? regionSummary(sido) : null), [sido])

  useEffect(() => {
    if (!sido || !summary) return
    const title = `${sido} 데이터센터 현황 — 명당 AI`
    const desc = regionDescription(sido, summary)
    document.title = title
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${sido} 데이터센터 목록`,
      description: desc,
      numberOfItems: summary.list.length,
      itemListElement: summary.list.map((f, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `/dc/${slugOf(f)}`,
        name: f.name,
      })),
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [sido, summary])

  if (!sido || !summary || summary.list.length === 0) {
    return (
      <>
        <TopBar />
        <main className="page">
          <h1>등록된 시설이 없는 지역입니다</h1>
          <p className="sub">
            <Link className="back-link" to="/">
              ← 맵으로 돌아가기
            </Link>
          </p>
        </main>
      </>
    )
  }

  const { list, by, mw } = summary

  return (
    <>
      <TopBar />
      <main className="page">
        <Link className="back-link" to="/">
          ← 맵으로 돌아가기
        </Link>
        <div className="eyebrow">REGION</div>
        <h1>{sido} 데이터센터 현황</h1>
        <p className="sub">
          총 {list.length}곳 — 운영 {by.operating} · 건설 {by.construction} · 계획 {by.planned}
          {mw > 0 && ` · 공개 전력 합계 ${mw} MW`}
        </p>

        {/* 상태 비율 바 — 맵 사이드패널의 요약 문법 재사용 */}
        <div className="status-summary" style={{ maxWidth: 420 }}>
          <div className="status-bar" role="img" aria-label={`운영 ${by.operating}, 건설 ${by.construction}, 계획 ${by.planned}`}>
            {by.operating > 0 && <span className="seg op" style={{ flexGrow: by.operating }} />}
            {by.construction > 0 && <span className="seg co" style={{ flexGrow: by.construction }} />}
            {by.planned > 0 && <span className="seg pl" style={{ flexGrow: by.planned }} />}
          </div>
        </div>

        <div className="card-actions">
          <Link className="btn primary" to={`/?sido=${encodeURIComponent(sido)}`}>
            맵에서 보기
          </Link>
          <Link className="btn" to="/land">
            지가 전체 리스트
          </Link>
        </div>

        {(() => {
          const rows = Object.entries(LAND_DONG.entries)
            .filter(([k]) => k.startsWith(`${sido} `))
            .map(([k, v]) => ({ label: k.slice(sido.length + 1), rate: v.rate }))
            .sort((a, b) => b.rate - a.rate)
          if (!rows.length) return null
          const maxAbs = Math.max(...rows.map((r) => Math.abs(r.rate)), 0.01)
          return (
            <div className="calc-card">
              <div className="chart-title">
                {sido} 입지 시군구 지가변동률 ({LAND_DONG_PERIOD} 월간, KOSIS)
              </div>
              {rows.map((r) => (
                <div key={r.label} className="hbar-row">
                  <span className="hbar-label">{r.label}</span>
                  <span className="hbar-track">
                    <span
                      className={`hbar-fill${r.rate < 0 ? ' neg' : ''}`}
                      style={{ width: `${Math.max((Math.abs(r.rate) / maxAbs) * 100, 2)}%` }}
                    />
                  </span>
                  <span className="hbar-value">{fmtRate(r.rate)}</span>
                </div>
              ))}
            </div>
          )
        })()}

        <div className="facility-list" style={{ marginTop: 16 }}>
          {list.map((f) => (
            <Link key={f.id} className="facility-row" to={`/dc/${slugOf(f)}`}>
              <span className={`dot ${f.status === 'delayed' ? 'planned' : f.status}`} />
              <span>
                <span className="name">{f.name}</span>
                <span className="meta">
                  {f.sigungu ?? f.sido} · {STATUS_LABEL[f.status] ?? f.status} · {f.type}
                  {f.power_mw_public != null && ` · ${f.power_mw_public}MW`}
                  {f.needs_verify && ' · 검증 필요'}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <p className="footer-note">
          공개 소스(사업자 공식·언론 보도·정부 공고) 기반 현황이며, ‘검증 필요’ 항목은 확인 중인 정보입니다. 시군구
          수준 좌표는 행정구역 중심점입니다.
        </p>
      </main>
    </>
  )
}
