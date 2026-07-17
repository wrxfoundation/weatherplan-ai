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
import { useMapLang } from '../i18n/mapLang.js'

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

/* 단일색 수평 바 — 크기 비교, 값 라벨 상시 노출.
 * total(또는 share) 지정 시 각 행에 전체 대비 비중 (n%)을 병기 — 라벨은 1줄 고정. */
function HBars({ title, bars, note, unit = '%', total, share = false }) {
  const max = Math.max(...bars.map((b) => b.value))
  const denom = total ?? (share ? bars.reduce((s, b) => s + b.value, 0) : 0)
  const showShare = (share || total != null) && denom > 0
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
            {showShare && <em className="hbar-share"> ({Math.round((b.value / denom) * 100)}%)</em>}
          </span>
        </div>
      ))}
      {note && <p className="chart-note">{note}</p>}
    </div>
  )
}

export default function StatsPage() {
  const en = useMapLang() === 'en'
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
        <h1>{en ? 'Korea datacenter statistics' : '국내 데이터센터 통계'}</h1>
        <p className="sub">{en ? `Capital-region concentration and power demand — as of ${STATS_SOURCE.publication}` : `수도권 집중과 전력 수요 — ${STATS_SOURCE.publication} 기준`}</p>

        <nav className="stats-subnav" aria-label={en ? 'Jump to stats section' : '통계 섹션 바로가기'}>
          <a href="#overview">{en ? 'Market overview' : '시장 개요'}</a>
          <a href="#facilities">{en ? 'Facility mix · systems' : '시설 구성·설비'}</a>
          <a href="#power">{en ? 'Power · grid supply side' : '전력·계통 공급측'}</a>
          <a href="#cross">{en ? 'Map cross-check' : '맵 교차확인'}</a>
        </nav>

        <section id="overview" className="stats-section">
          <h2 className="stats-section-h">{en ? 'Market overview' : '시장 개요'}</h2>
          <div className="stat-grid">
            {KPI.map((k) => (
              <StatTile key={k.key} {...k} />
            ))}
          </div>

        <div className="calc-card">
          <div className="chart-title">{en ? 'Latest capital-region market snapshot' : '수도권 시장 최신 단면'} — {MARKET_2025H2.asOf} (Cushman &amp; Wakefield/KDCC)</div>
          <div className="stat-grid" style={{ marginTop: 6 }}>
            {MARKET_2025H2.kpi.map((k) => (
              <StatTile key={k.label} {...k} />
            ))}
          </div>
          <p className="chart-note">{MARKET_2025H2.note}</p>
          <p className="chart-note">
            <strong>{en ? 'Policy (2H 2025):' : '정책(2H 2025):'}</strong> {MARKET_2025H2.policy}
          </p>
          <p className="chart-note" style={{ opacity: 0.7 }}>
            {en
              ? `Source: ${MARKET_2025H2.source} · Scope: capital-region major operators (excl. captive · ICT) — scope differs from the nationwide 165-facility (500㎡+) metric.`
              : `출처: ${MARKET_2025H2.source} · 스코프: 수도권 메이저 운영사(캡티브·ICT 제외) — 전국 165개소(500㎡+) 지표와 스코프 다름.`}
          </p>
        </div>

        </section>

        <section id="facilities" className="stats-section">
          <h2 className="stats-section-h">{en ? 'Facility mix · systems' : '시설 구성·설비'}</h2>
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
          <h2 className="stats-section-h">{en ? 'Power · grid supply side' : '전력·계통 공급측'}</h2>
        <div className="calc-card">
          <HBars {...KEPCO_REGION} unit="MW" share />
        </div>

        <div className="calc-card">
          <div className="chart-title">{en ? 'Power-generation license pipeline' : '발전사업 허가 파이프라인'} — {GEN_PIPELINE.headline}</div>
          <p className="chart-note">{GEN_PIPELINE.detail}</p>
          <HBars
            title={en ? `Licensed 2024+ new-pipeline fuel mix (${GEN_RECENT.length} cases)` : `허가 2024+ 신규 파이프라인 연료 구성 (${GEN_RECENT.length}건)`}
            bars={GEN_RECENT_BY_FUEL.map((f) => ({ label: f.fuel, value: f.count, unit: '건' }))}
            unit="건"
            share
            note={en
              ? 'Fuel cells · wind · solar · offshore wind lead new licenses — the supply-side pipeline for AIDC RE100 procurement. Individual capacities are indicative.'
              : '연료전지·풍력·태양광·해상풍력이 신규 허가를 주도 — AIDC RE100 조달의 공급측 파이프라인. 개별 용량은 참고치.'}
          />
          <HBars
            title={en ? `Licensed 2024+ regional distribution — non-capital ${GEN_RECENT_NONCAPITAL_PCT}%` : `허가 2024+ 지역 분포 — 비수도권 ${GEN_RECENT_NONCAPITAL_PCT}%`}
            bars={GEN_RECENT_BY_SIDO.map((s) => ({ label: s.sido, value: s.count, unit: '건' }))}
            unit="건"
            share
            note={en
              ? 'Concentrated in the renewables belt of Jeonnam · Gyeongbuk · Gangwon — the AIDC Special Act non-capital incentive and grid-impact-assessment regional scoring align geographically. A supply-side signal read by the AI InfraMap power axis.'
              : '전남·경북·강원의 재생E 벨트에 집중 — AIDC 특별법 비수도권 유인과 계통영향평가 지역 배점이 지리적으로 정합한다. AI InfraMap 전력축이 읽는 공급측 신호.'}
          />
          <p className="chart-note" style={{ opacity: 0.7 }}>
            {GEN_PIPELINE.source} · {en ? `cumulative ${GEN_LICENSE_META.total.toLocaleString()} cases` : `누적 ${GEN_LICENSE_META.total.toLocaleString()}건`}
          </p>
        </div>

        <div className="calc-card">
          <div className="chart-title">
            {en ? 'District-energy (CHP) generation capacity' : '집단에너지(열병합) 발전 설비'} — {en ? `${CHP_STATS.count} sites` : `${CHP_STATS.count}곳`} · {CHP_STATS.totalMw.toLocaleString()}MW
          </div>
          <div className="note-stack">
            <p className="chart-note key">
              {en ? (
                <>
                  Of the {CHP_STATS.totalMw.toLocaleString()}MW total generation capacity across {CHP_STATS.count} CHP · combined-cycle sites,{' '}
                  <strong>
                    {CHP_STATS.new2025Count} sites ({CHP_STATS.new2025Mw.toLocaleString()}MW) began supply in 2025
                  </strong>{' '}
                  — a clear LNG-CHP build boom tied to new-town · industrial-complex heat demand.
                </>
              ) : (
                <>
                  열병합·복합화력 {CHP_STATS.count}곳의 발전용량 합계 {CHP_STATS.totalMw.toLocaleString()}MW 중{' '}
                  <strong>
                    {CHP_STATS.new2025Count}곳({CHP_STATS.new2025Mw.toLocaleString()}MW)이 2025년 공급 개시
                  </strong>{' '}
                  — 신도시·산단 열수요와 붙은 LNG-열병합 신설 붐이 뚜렷하다.
                </>
              )}
            </p>
            <p className="chart-note">
              {en
                ? 'A supply-side cross-section in the datacenter power · grid context (district energy is distributed generation near urban · industrial areas).'
                : '데이터센터 전원·계통 맥락의 공급측 단면(집단에너지는 도심·산단 근접 분산전원).'}
            </p>
          </div>
          <HBars
            title={en ? 'Top generation capacity by operator (MW)' : '발전사별 발전용량 상위 (MW)'}
            bars={CHP_BY_OP.slice(0, 15).map((o) => ({ label: o.op, value: o.mw }))}
            unit="MW"
            total={CHP_STATS.totalMw}
          />
          <HBars
            title={en ? 'Top single-plant generation capacity (MW)' : '단일 발전소 발전용량 상위 (MW)'}
            bars={CHP_TOP_PLANTS.map((p) => ({ label: `${p.plant} (${p.loc})`, value: Math.round(p.mw) }))}
            unit="MW"
            total={CHP_STATS.totalMw}
            note={en
              ? `${CHP_META.source} · share is against the district-energy total ${CHP_STATS.totalMw.toLocaleString()}MW · management offices are informal place names, so no individual coordinates are assigned (not placed on the map).`
              : `${CHP_META.source} · 비중은 집단에너지 총 ${CHP_STATS.totalMw.toLocaleString()}MW 대비 · 관리소는 비공식 지명이라 개별 좌표 미부여(맵 미배치).`}
          />
        </div>

        <div className="calc-card">
          <div className="chart-title">
            {en ? '2025 new power-plant installations' : '2025년 신규 발전소 설치'} — {NEW_PLANTS_2025_TOTALS.totalMw.toLocaleString()}MW ·{' '}
            {en ? `${NEW_PLANTS_2025_TOTALS.totalCount.toLocaleString()} sites` : `${NEW_PLANTS_2025_TOTALS.totalCount.toLocaleString()}개소`} · {en ? 'non-capital' : '비수도권'} {NEW_PLANTS_2025_TOTALS.nonCapitalPct}%
          </div>
          <div className="note-stack">
            <p className="chart-note key">
              {en ? (
                <>
                  Of the <strong>{NEW_PLANTS_2025_TOTALS.totalCount.toLocaleString()} plants</strong> newly installed during 2025,
                  totaling <strong>{NEW_PLANTS_2025_TOTALS.totalMw.toLocaleString()}MW</strong> of capacity,{' '}
                  <strong>{NEW_PLANTS_2025_TOTALS.nonCapitalPct}% (by capacity) is non-capital</strong> — the renewables belt of
                  Gyeongbuk · Chungnam · Jeonnam · Gyeongnam · Jeonbuk leads new supply.
                </>
              ) : (
                <>
                  2025년 한 해 신규 설치된 발전소 <strong>{NEW_PLANTS_2025_TOTALS.totalCount.toLocaleString()}개소</strong>,
                  설비용량 합계 <strong>{NEW_PLANTS_2025_TOTALS.totalMw.toLocaleString()}MW</strong> 중{' '}
                  <strong>{NEW_PLANTS_2025_TOTALS.nonCapitalPct}%(용량 기준)가 비수도권</strong> — 경북·충남·전남·경남·전북의
                  재생E 벨트가 신규 공급을 주도한다.
                </>
              )}
            </p>
            <p className="chart-note">
              {en
                ? 'Actual installation results that align precisely with the license pipeline non-capital 86.5%.'
                : '허가 파이프라인 비수도권 86.5%와 정확히 정합하는 실제 설치 실적.'}
            </p>
          </div>
          <HBars
            title={en ? 'Top 2025 new capacity by sido (MW)' : '시도별 2025 신규 설비용량 상위 (MW)'}
            bars={NEW_PLANTS_2025.slice(0, 12).map((r) => ({ label: r.sido, value: Math.round(r.capacityKw / 1000) }))}
            unit="MW"
            total={NEW_PLANTS_2025_TOTALS.totalMw}
            note={en
              ? `${NEW_PLANTS_2025_META.source} · share is against the 2025 new total ${NEW_PLANTS_2025_TOTALS.totalMw.toLocaleString()}MW · most by count is Gyeongbuk ${NEW_PLANTS_2025.find((r) => r.sido === '경북')?.count.toLocaleString()} sites (mostly small-scale solar).`
              : `${NEW_PLANTS_2025_META.source} · 비중은 2025 신규 총 ${NEW_PLANTS_2025_TOTALS.totalMw.toLocaleString()}MW 대비 · 개수 최다는 경북 ${NEW_PLANTS_2025.find((r) => r.sido === '경북')?.count.toLocaleString()}개소(소규모 태양광 다수).`}
          />
        </div>

        <div className="calc-card">
          <div className="chart-title">
            {en ? 'Nuclear capacity' : '원전 설비용량'} — {en ? `${NUCLEAR_FLEET.operatingUnits} units operating across 5 sites` : `5본부 ${NUCLEAR_FLEET.operatingUnits}호기 운영`} · {NUCLEAR_FLEET.operatingMw.toLocaleString()}MW
          </div>
          <div className="note-stack">
            <p className="chart-note key">
              {en ? (
                <>
                  {NUCLEAR_FLEET.operatingUnits} nuclear units in commercial operation total{' '}
                  <strong>{(NUCLEAR_FLEET.operatingMw / 1000).toFixed(1)}GW</strong>. Under construction,{' '}
                  {NUCLEAR_FLEET.buildingUnits} units ({NUCLEAR_FLEET.buildingMw.toLocaleString()}MW, Saeul 3·4 / Shin-Hanul 3·4) will be added.
                </>
              ) : (
                <>
                  상업운전 중인 원전 {NUCLEAR_FLEET.operatingUnits}호기 합계{' '}
                  <strong>{(NUCLEAR_FLEET.operatingMw / 1000).toFixed(1)}GW</strong>. 건설 중{' '}
                  {NUCLEAR_FLEET.buildingUnits}호기({NUCLEAR_FLEET.buildingMw.toLocaleString()}MW, 새울 3·4/신한울 3·4)가 더해진다.
                </>
              )}
            </p>
            <p className="chart-note">
              {en
                ? '24/7 carbon-free baseload as grid-proximity context for AIDC sites. Nuclear is full-grid supply, not power-matched to a specific DC.'
                : '24/7 무탄소 기저부하로 AIDC 입지의 계통 근접성 맥락. 원전은 특정 DC와 전원 매칭되지 않는 풀 계통 공급.'}
            </p>
          </div>
          <HBars
            title={en ? 'Operating capacity by nuclear site (MW)' : '원자력본부별 운영 설비용량 (MW)'}
            bars={NUCLEAR_FLEET.rows.map((r) => ({ label: en ? `${r.base} (${r.operatingUnits} units)` : `${r.base} (${r.operatingUnits}호기)`, value: r.operatingMw }))}
            unit="MW"
            total={NUCLEAR_FLEET.operatingMw}
            note={`${NUCLEAR_META.source}`}
          />
        </div>

        </section>

        <section id="cross" className="stats-section">
          <h2 className="stats-section-h">{en ? 'Map cross-check' : '맵 교차확인'}</h2>
        <div className="calc-card">
          <HBars
            title={en
              ? `Public power distribution by region on the AI InfraMap seed (incl. planned, total ${regionMw.reduce((s, b) => s + b.value, 0).toLocaleString()}MW)`
              : `AI InfraMap 시드 기준 지역별 공개 전력 분포 (계획 포함, 총 ${regionMw.reduce((s, b) => s + b.value, 0).toLocaleString()}MW)`}
            bars={regionMw}
            unit="MW"
            note={en
              ? 'Only facilities with a confirmed public power figure (power_mw_public) are counted. Large non-capital projects in planning · construction stages — Jeonnam (Solaseado 1GW concept) · Gyeonggi (Paju AIDC) · Ulsan, etc. — drive the distribution.'
              : '공개 전력 규모(power_mw_public)가 확인된 시설만 집계. 전남(솔라시도 1GW 구상)·경기(파주 AIDC)·울산 등 계획·건설 단계의 비수도권 대형 프로젝트가 분포를 주도한다.'}
          />
          <div className="chart-title">{en ? 'Cross-check with AI InfraMap map data' : 'AI InfraMap 맵 데이터와 교차 확인'}</div>
          <p className="chart-note">
            {en ? (
              <>
                Of the {myeongdang.total} facilities tracked by AI InfraMap seed v0.1 (incl. operating · construction · planned), the capital region (Seoul · Gyeonggi · Incheon) is{' '}
                <strong>
                  {myeongdang.capital} ({myeongdang.pct}%)
                </strong>{' '}
                — consistent with the KEEI/KDCC "60% overall · 75%+ private" concentration. Including planning · construction stages, the rising trend of large non-capital projects (Haenam · Saemangeum · Ulsan · Pohang, etc.) is also visible.
              </>
            ) : (
              <>
                AI InfraMap 시드 v0.1이 추적 중인 시설 {myeongdang.total}곳(운영·건설·계획 포함) 중 수도권(서울·경기·인천)은{' '}
                <strong>
                  {myeongdang.capital}곳({myeongdang.pct}%)
                </strong>{' '}
                — KEEI/KDCC의 "전체 60%·민간 75%+" 집중 구도와 정합합니다. 계획·건설 단계까지 포함하면 비수도권(해남·새만금·울산·포항 등)의
                대형 프로젝트가 늘어나는 추세도 함께 보입니다.
              </>
            )}
          </p>
          <div className="card-actions">
            <Link className="btn primary" to="/">
              {en ? 'View on map' : '맵에서 보기'}
            </Link>
            <Link className="btn" to="/glossary">
              {en ? 'Glossary' : '용어집'}
            </Link>
          </div>
        </div>
        </section>

        <p className="footer-note">
          {en ? 'Source:' : '출처:'} {STATS_SOURCE.publication} · {STATS_SOURCE.base.join(' · ')} ({STATS_SOURCE.url})
          <br />
          {STATS_SOURCE.note}
        </p>
      </main>
    </>
  )
}
