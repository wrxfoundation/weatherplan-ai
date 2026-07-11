import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES } from '../data/facilities.js'
import { KPI, COMPOSITION, POWER_AVG, COOLING, BACKUP, CUSTOMERS, KEPCO_REGION, GEN_PIPELINE, STATS_SOURCE } from '../content/stats.js'

const TITLE = '국내 데이터센터 통계 — 수도권 집중과 전력 수요 · 명당 AI'
const DESC =
  '국내 데이터센터 165개소(2024) 중 60%가 수도권에 집중. 전체 수전용량 약 1,913MW, 민간 평균 17.7MW — KEEI·KDCC 공개 통계로 보는 한국 데이터센터 현황.'

const CAPITAL_SIDOS = new Set(['서울', '경기', '인천'])

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function StatTile({ value, unit, label, sub }) {
  return (
    <div className="stat-tile">
      <div className="stat-value">
        {value}
        <small>{unit}</small>
      </div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

/* 강조 1색(accent) + 비강조 그레이 트랙, 직접 라벨 상시 노출 — 2세그먼트 구성비 */
function SplitBar({ title, a, b, note }) {
  return (
    <div className="chart-block">
      <div className="chart-title">{title}</div>
      <div className="split-bar" role="img" aria-label={`${a.label} ${a.pct}%, ${b.label} ${b.pct}%`}>
        <span className="seg fill" style={{ width: `${a.pct}%` }} />
        <span className="seg track" style={{ width: `${b.pct}%` }} />
      </div>
      <div className="split-legend">
        <span>
          <i className="swatch fill" /> {a.label} <strong>{a.pct}%</strong>
        </span>
        <span>
          <i className="swatch track" /> {b.label} <strong>{b.pct}%</strong>
        </span>
      </div>
      {note && <p className="chart-note">{note}</p>}
    </div>
  )
}

/* 단일색 수평 바 — 크기 비교, 값 라벨 상시 노출 */
function HBars({ title, bars, note, unit = '%' }) {
  const max = Math.max(...bars.map((b) => b.value))
  return (
    <div className="chart-block">
      <div className="chart-title">{title}</div>
      {bars.map((b) => (
        <div key={b.label} className="hbar-row">
          <span className="hbar-label">{b.label}</span>
          <span className="hbar-track">
            <span className="hbar-fill" style={{ width: `${(b.value / max) * 100}%` }} />
          </span>
          <span className="hbar-value">
            {b.value}
            {b.unit ?? unit}
          </span>
        </div>
      ))}
      {note && <p className="chart-note">{note}</p>}
    </div>
  )
}

export default function StatsPage() {
  const myeongdang = useMemo(() => {
    const total = FACILITIES.length
    const capital = FACILITIES.filter((f) => CAPITAL_SIDOS.has(f.sido)).length
    return { total, capital, pct: Math.round((capital / total) * 100) }
  }, [])

  const regionMw = useMemo(() => {
    const by = new Map()
    for (const f of FACILITIES) {
      if (f.power_mw_public != null) by.set(f.sido, (by.get(f.sido) ?? 0) + f.power_mw_public)
    }
    return [...by.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }))
  }, [])

  useEffect(() => {
    document.title = TITLE
    setMeta('name', 'description', DESC)
    setMeta('property', 'og:title', TITLE)
    setMeta('property', 'og:description', DESC)
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: '국내 데이터센터 현황 통계 (2023~2024)',
      description: DESC,
      creator: { '@type': 'Organization', name: '명당 AI' },
      isBasedOn: STATS_SOURCE.base,
      citation: STATS_SOURCE.publication,
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [])

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="eyebrow">MARKET DATA</div>
        <h1>국내 데이터센터 통계</h1>
        <p className="sub">수도권 집중과 전력 수요 — {STATS_SOURCE.publication} 기준</p>

        <div className="stat-grid">
          {KPI.map((k) => (
            <StatTile key={k.key} {...k} />
          ))}
        </div>

        <div className="calc-card">
          {COMPOSITION.map((c) => (
            <SplitBar key={c.key} {...c} />
          ))}
          <HBars {...POWER_AVG} unit="MW" />
        </div>

        <div className="calc-card">
          <HBars {...COOLING} />
          <div className="stat-grid three">
            {BACKUP.map((k) => (
              <StatTile key={k.label} {...k} />
            ))}
          </div>
          <HBars {...CUSTOMERS} unit="개" />
        </div>

        <div className="calc-card">
          <HBars {...KEPCO_REGION} unit="MW" />
        </div>

        <div className="calc-card">
          <div className="chart-title">발전사업 허가 파이프라인 — {GEN_PIPELINE.headline}</div>
          <p className="chart-note">{GEN_PIPELINE.detail}</p>
          <p className="chart-note" style={{ opacity: 0.7 }}>{GEN_PIPELINE.source}</p>
        </div>

        <div className="calc-card">
          <HBars
            title={`명당 시드 기준 지역별 공개 전력 분포 (계획 포함, 총 ${regionMw.reduce((s, b) => s + b.value, 0).toLocaleString()}MW)`}
            bars={regionMw}
            unit="MW"
            note="공개 전력 규모(power_mw_public)가 확인된 시설만 집계. 전남(솔라시도 1GW 구상)·경기(파주 AIDC)·울산 등 계획·건설 단계의 비수도권 대형 프로젝트가 분포를 주도한다."
          />
          <div className="chart-title">명당 AI 맵 데이터와 교차 확인</div>
          <p className="chart-note">
            명당 시드 v0.1이 추적 중인 시설 {myeongdang.total}곳(운영·건설·계획 포함) 중 수도권(서울·경기·인천)은{' '}
            <strong>
              {myeongdang.capital}곳({myeongdang.pct}%)
            </strong>{' '}
            — KEEI/KDCC의 "전체 60%·민간 75%+" 집중 구도와 정합합니다. 계획·건설 단계까지 포함하면 비수도권(해남·새만금·울산·포항 등)의
            대형 프로젝트가 늘어나는 추세도 함께 보입니다.
          </p>
          <div className="card-actions">
            <Link className="btn primary" to="/">
              맵에서 보기
            </Link>
            <Link className="btn" to="/glossary">
              용어집
            </Link>
          </div>
        </div>

        <p className="footer-note">
          출처: {STATS_SOURCE.publication} · {STATS_SOURCE.base.join(' · ')} ({STATS_SOURCE.url})
          <br />
          {STATS_SOURCE.note}
        </p>
      </main>
    </>
  )
}
