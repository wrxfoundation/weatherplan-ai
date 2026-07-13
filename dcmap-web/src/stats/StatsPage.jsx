import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES } from '../data/facilities.js'
import { KPI, COMPOSITION, POWER_AVG, COOLING, BACKUP, CUSTOMERS, KEPCO_REGION, GEN_PIPELINE, STATS_SOURCE, MARKET_2025H2 } from '../content/stats.js'
import {
  GEN_LICENSE_META,
  GEN_RECENT,
  GEN_RECENT_BY_FUEL,
  GEN_RECENT_BY_SIDO,
  GEN_RECENT_NONCAPITAL_PCT,
} from '../data/genLicenses.js'
import { CHP_STATS, CHP_BY_OP, CHP_TOP_PLANTS, CHP_META } from '../data/chpPlants.js'
import { NUCLEAR_FLEET, NUCLEAR_META } from '../data/plants.js'
import { NEW_PLANTS_2025, NEW_PLANTS_2025_TOTALS, NEW_PLANTS_2025_META } from '../data/newPlants2025.js'

const TITLE = '국내 데이터센터 통계 — 수도권 집중과 전력 수요 · AI InfraMap'
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
      creator: { '@type': 'Organization', name: 'AI InfraMap' },
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

        <nav className="stats-subnav" aria-label="통계 섹션 바로가기">
          <a href="#overview">시장 개요</a>
          <a href="#facilities">시설 구성·설비</a>
          <a href="#power">전력·계통 공급측</a>
          <a href="#cross">맵 교차확인</a>
        </nav>

        <section id="overview" className="stats-section">
          <h2 className="stats-section-h">시장 개요</h2>
          <div className="stat-grid">
            {KPI.map((k) => (
              <StatTile key={k.key} {...k} />
            ))}
          </div>

        <div className="calc-card">
          <div className="chart-title">수도권 시장 최신 단면 — {MARKET_2025H2.asOf} (Cushman &amp; Wakefield/KDCC)</div>
          <div className="stat-grid" style={{ marginTop: 6 }}>
            {MARKET_2025H2.kpi.map((k) => (
              <StatTile key={k.label} {...k} />
            ))}
          </div>
          <p className="chart-note">{MARKET_2025H2.note}</p>
          <p className="chart-note">
            <strong>정책(2H 2025):</strong> {MARKET_2025H2.policy}
          </p>
          <p className="chart-note" style={{ opacity: 0.7 }}>
            출처: {MARKET_2025H2.source} · 스코프: 수도권 메이저 운영사(캡티브·ICT 제외) — 전국 165개소(500㎡+) 지표와 스코프 다름.
          </p>
        </div>

        </section>

        <section id="facilities" className="stats-section">
          <h2 className="stats-section-h">시설 구성·설비</h2>
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

        </section>

        <section id="power" className="stats-section">
          <h2 className="stats-section-h">전력·계통 공급측</h2>
        <div className="calc-card">
          <HBars {...KEPCO_REGION} unit="MW" />
        </div>

        <div className="calc-card">
          <div className="chart-title">발전사업 허가 파이프라인 — {GEN_PIPELINE.headline}</div>
          <p className="chart-note">{GEN_PIPELINE.detail}</p>
          <HBars
            title={`허가 2024+ 신규 파이프라인 연료 구성 (${GEN_RECENT.length}건)`}
            bars={GEN_RECENT_BY_FUEL.map((f) => ({ label: f.fuel, value: f.count, unit: '건' }))}
            unit="건"
            note="연료전지·풍력·태양광·해상풍력이 신규 허가를 주도 — AIDC RE100 조달의 공급측 파이프라인. 개별 용량은 참고치."
          />
          <HBars
            title={`허가 2024+ 지역 분포 — 비수도권 ${GEN_RECENT_NONCAPITAL_PCT}%`}
            bars={GEN_RECENT_BY_SIDO.map((s) => ({ label: s.sido, value: s.count, unit: '건' }))}
            unit="건"
            note="전남·경북·강원의 재생E 벨트에 집중 — AIDC 특별법 비수도권 유인과 계통영향평가 지역 배점이 지리적으로 정합한다. AI InfraMap 전력축이 읽는 공급측 신호."
          />
          <p className="chart-note" style={{ opacity: 0.7 }}>
            {GEN_PIPELINE.source} · 누적 {GEN_LICENSE_META.total.toLocaleString()}건
          </p>
        </div>

        <div className="calc-card">
          <div className="chart-title">
            집단에너지(열병합) 발전 설비 — {CHP_STATS.count}곳 · {CHP_STATS.totalMw.toLocaleString()}MW
          </div>
          <div className="note-stack">
            <p className="chart-note key">
              열병합·복합화력 {CHP_STATS.count}곳의 발전용량 합계 {CHP_STATS.totalMw.toLocaleString()}MW 중{' '}
              <strong>
                {CHP_STATS.new2025Count}곳({CHP_STATS.new2025Mw.toLocaleString()}MW)이 2025년 공급 개시
              </strong>{' '}
              — 신도시·산단 열수요와 붙은 LNG-열병합 신설 붐이 뚜렷하다.
            </p>
            <p className="chart-note">
              데이터센터 전원·계통 맥락의 공급측 단면(집단에너지는 도심·산단 근접 분산전원).
            </p>
          </div>
          <HBars
            title="발전사별 발전용량 상위 (MW)"
            bars={CHP_BY_OP.slice(0, 15).map((o) => ({ label: o.op, value: o.mw }))}
            unit="MW"
          />
          <HBars
            title="단일 발전소 발전용량 상위 (MW)"
            bars={CHP_TOP_PLANTS.map((p) => ({ label: `${p.plant} (${p.loc})`, value: Math.round(p.mw) }))}
            unit="MW"
            note={`${CHP_META.source} · 관리소는 비공식 지명이라 개별 좌표 미부여(맵 미배치).`}
          />
        </div>

        <div className="calc-card">
          <div className="chart-title">
            2025년 신규 발전소 설치 — {NEW_PLANTS_2025_TOTALS.totalMw.toLocaleString()}MW ·{' '}
            {NEW_PLANTS_2025_TOTALS.totalCount.toLocaleString()}개소 · 비수도권 {NEW_PLANTS_2025_TOTALS.nonCapitalPct}%
          </div>
          <div className="note-stack">
            <p className="chart-note key">
              2025년 한 해 신규 설치된 발전소 <strong>{NEW_PLANTS_2025_TOTALS.totalCount.toLocaleString()}개소</strong>,
              설비용량 합계 <strong>{NEW_PLANTS_2025_TOTALS.totalMw.toLocaleString()}MW</strong> 중{' '}
              <strong>{NEW_PLANTS_2025_TOTALS.nonCapitalPct}%(용량 기준)가 비수도권</strong> — 경북·충남·전남·경남·전북의
              재생E 벨트가 신규 공급을 주도한다.
            </p>
            <p className="chart-note">
              허가 파이프라인 비수도권 86.5%와 정확히 정합하는 실제 설치 실적.
            </p>
          </div>
          <HBars
            title="시도별 2025 신규 설비용량 상위 (MW)"
            bars={NEW_PLANTS_2025.slice(0, 12).map((r) => ({ label: r.sido, value: Math.round(r.capacityKw / 1000) }))}
            unit="MW"
            note={`${NEW_PLANTS_2025_META.source} · 개수 최다는 경북 ${NEW_PLANTS_2025.find((r) => r.sido === '경북')?.count.toLocaleString()}개소(소규모 태양광 다수).`}
          />
        </div>

        <div className="calc-card">
          <div className="chart-title">
            원전 설비용량 — 5본부 {NUCLEAR_FLEET.operatingUnits}호기 운영 · {NUCLEAR_FLEET.operatingMw.toLocaleString()}MW
          </div>
          <div className="note-stack">
            <p className="chart-note key">
              상업운전 중인 원전 {NUCLEAR_FLEET.operatingUnits}호기 합계{' '}
              <strong>{(NUCLEAR_FLEET.operatingMw / 1000).toFixed(1)}GW</strong>. 건설 중{' '}
              {NUCLEAR_FLEET.buildingUnits}호기({NUCLEAR_FLEET.buildingMw.toLocaleString()}MW, 새울 3·4/신한울 3·4)가 더해진다.
            </p>
            <p className="chart-note">
              24/7 무탄소 기저부하로 AIDC 입지의 계통 근접성 맥락. 원전은 특정 DC와 전원 매칭되지 않는 풀 계통 공급.
            </p>
          </div>
          <HBars
            title="원자력본부별 운영 설비용량 (MW)"
            bars={NUCLEAR_FLEET.rows.map((r) => ({ label: `${r.base} (${r.operatingUnits}호기)`, value: r.operatingMw }))}
            unit="MW"
            note={`${NUCLEAR_META.source}`}
          />
        </div>

        </section>

        <section id="cross" className="stats-section">
          <h2 className="stats-section-h">맵 교차확인</h2>
        <div className="calc-card">
          <HBars
            title={`AI InfraMap 시드 기준 지역별 공개 전력 분포 (계획 포함, 총 ${regionMw.reduce((s, b) => s + b.value, 0).toLocaleString()}MW)`}
            bars={regionMw}
            unit="MW"
            note="공개 전력 규모(power_mw_public)가 확인된 시설만 집계. 전남(솔라시도 1GW 구상)·경기(파주 AIDC)·울산 등 계획·건설 단계의 비수도권 대형 프로젝트가 분포를 주도한다."
          />
          <div className="chart-title">AI InfraMap 맵 데이터와 교차 확인</div>
          <p className="chart-note">
            AI InfraMap 시드 v0.1이 추적 중인 시설 {myeongdang.total}곳(운영·건설·계획 포함) 중 수도권(서울·경기·인천)은{' '}
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
        </section>

        <p className="footer-note">
          출처: {STATS_SOURCE.publication} · {STATS_SOURCE.base.join(' · ')} ({STATS_SOURCE.url})
          <br />
          {STATS_SOURCE.note}
        </p>
      </main>
    </>
  )
}
