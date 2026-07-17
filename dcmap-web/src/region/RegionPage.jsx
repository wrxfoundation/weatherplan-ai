import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL, slugOf } from '../data/facilities.js'
import AiBriefButton from '../ai/AiBriefButton.jsx'
import { SLUG_TO_SIDO } from '../content/sido_slugs.js'
import { LAND_DONG, LAND_DONG_PERIOD } from '../data/landPriceDong.js'
import { fmtRate } from '../data/landPrice.js'
import { POWER_BALANCE, selfSufficiencyLabel } from '../data/powerBalance.js'
import { CAPITAL_PIPELINE, CAPITAL_PIPELINE_META } from '../data/capitalPipeline.js'
import { SIDO_METRO_CD } from '../data/genLicenses.js'
import { powerUsageFor } from '../data/liveApi.js'
import { RENEWABLE_ESS, RENEWABLE_ESS_META, RENEWABLE_ESS_TOTAL } from '../data/renewableEss.js'
import { useMapLang } from '../i18n/mapLang.js'

const STATUS_EN = { operating: 'Operating', construction: 'Construction', planned: 'Planned', delayed: 'Delayed', cancelled: 'Cancelled' }

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
    const sk = f.status === 'delayed' ? 'planned' : f.status
    if (by[sk] != null) by[sk] += 1 // cancelled(무산)은 운영/건설/계획 집계 제외 (대시보드와 동일 가드)
    if (f.power_mw_public != null) mw += f.power_mw_public
  }
  return { list, by, mw }
}

export function regionDescription(sido, { list, by, mw }) {
  return `${sido} 데이터센터 ${list.length}곳 — 운영 ${by.operating} · 건설 ${by.construction} · 계획 ${by.planned}${
    mw > 0 ? ` · 공개 전력 합계 ${mw}MW` : ''
  }. 공개 소스 기반 현황, AI InfraMap.`
}

export default function RegionPage() {
  const { slug } = useParams()
  const sido = SLUG_TO_SIDO[slug]
  const summary = useMemo(() => (sido ? regionSummary(sido) : null), [sido])
  const en = useMapLang() === 'en'
  const statusLabel = (s) => (en ? STATUS_EN[s] ?? STATUS_LABEL[s] ?? s : STATUS_LABEL[s] ?? s)
  const [usage, setUsage] = useState(null) // 한전 계약종별(일반용) 시군구 집계 — 수요측 라이브

  useEffect(() => {
    let alive = true
    setUsage(null)
    powerUsageFor(SIDO_METRO_CD[sido]).then((v) => alive && setUsage(v))
    return () => {
      alive = false
    }
  }, [sido])

  useEffect(() => {
    if (!sido || !summary) return
    const title = en ? `${sido} Data Center Status — AI InfraMap` : `${sido} 데이터센터 현황 — AI InfraMap`
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
  }, [sido, summary, en])

  if (!sido || !summary || summary.list.length === 0) {
    return (
      <>
        <TopBar />
        <main className="page">
          <h1>{en ? 'No registered facilities in this region' : '등록된 시설이 없는 지역입니다'}</h1>
          <p className="sub">
            <Link className="back-link" to="/">
              {en ? '← Back to map' : '← 맵으로 돌아가기'}
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
          {en ? '← Back to map' : '← 맵으로 돌아가기'}
        </Link>
        <div className="eyebrow">REGION</div>
        <h1>{en ? `${sido} Data Center Status` : `${sido} 데이터센터 현황`}</h1>
        <p className="sub">
          {en
            ? `Total ${list.length} sites — Operating ${by.operating} · Construction ${by.construction} · Planned ${by.planned}`
            : `총 ${list.length}곳 — 운영 ${by.operating} · 건설 ${by.construction} · 계획 ${by.planned}`}
          {mw > 0 && (en ? ` · public power total ${mw} MW` : ` · 공개 전력 합계 ${mw} MW`)}
          {POWER_BALANCE[sido] &&
            (en
              ? ` · power self-sufficiency ${POWER_BALANCE[sido].ratio}% (${selfSufficiencyLabel(POWER_BALANCE[sido].ratio)}, ’25)`
              : ` · 전력 자급률 ${POWER_BALANCE[sido].ratio}% (${selfSufficiencyLabel(POWER_BALANCE[sido].ratio)}, ’25)`)}
        </p>

        {/* 상태 비율 바 — 맵 사이드패널의 요약 문법 재사용 */}
        <div className="status-summary" style={{ maxWidth: 420 }}>
          <div className="status-bar" role="img" aria-label={en ? `Operating ${by.operating}, Construction ${by.construction}, Planned ${by.planned}` : `운영 ${by.operating}, 건설 ${by.construction}, 계획 ${by.planned}`}>
            {by.operating > 0 && <span className="seg op" style={{ flexGrow: by.operating }} />}
            {by.construction > 0 && <span className="seg co" style={{ flexGrow: by.construction }} />}
            {by.planned > 0 && <span className="seg pl" style={{ flexGrow: by.planned }} />}
          </div>
        </div>

        <div className="card-actions">
          <Link className="btn primary" to={`/?sido=${encodeURIComponent(sido)}`}>
            {en ? 'View on map' : '맵에서 보기'}
          </Link>
          <Link className="btn" to="/land">
            {en ? 'Full land-price list' : '지가 전체 리스트'}
          </Link>
        </div>

        <AiBriefButton
          label={en ? `✨ ${sido} AI infrastructure brief` : `✨ ${sido} AI 인프라 브리핑`}
          query={en ? `Data center & power infrastructure brief for ${sido}` : `${sido}의 데이터센터·전력 인프라 브리핑`}
          data={{
            시도: sido,
            시설수: list.length,
            상태별: by,
            공개전력합MW: mw,
            시설: list.slice(0, 24).map((f) => ({
              name: f.name,
              시군구: f.sigungu ?? null,
              상태: STATUS_LABEL[f.status] ?? f.status,
              유형: f.type,
              MW: f.power_mw_public ?? null,
            })),
          }}
        />

        {/* 전력 수요 밀도 — 한전 계약종별(일반용) 시군구 계약전력 라이브. 여유용량(공급측)의 보완 지표 */}
        {usage?.available && usage.cities?.length > 0 && (
          <div className="calc-card">
            <div className="chart-title">
              {en
                ? `${sido} power demand density — top sigungu by general-use contracted power (${usage.year}.${usage.month}, 한전 live)`
                : `${sido} 전력 수요 밀도 — 일반용 계약전력 상위 시군구 (${usage.year}.${usage.month}, 한전 라이브)`}
            </div>
            {(() => {
              const top = usage.cities.slice(0, 10)
              const max = Math.max(...top.map((c) => c.cntrPwrMw), 1)
              return top.map((c) => (
                <div key={c.city} className="hbar-row">
                  <span className="hbar-label">{c.city}</span>
                  <span className="hbar-track">
                    <span className="hbar-fill" style={{ width: `${Math.max((c.cntrPwrMw / max) * 100, 2)}%` }} />
                  </span>
                  <span className="hbar-value">
                    {Math.round(c.cntrPwrMw).toLocaleString()}MW{c.unitCost != null ? ` · ${c.unitCost}원/kWh` : ''}
                  </span>
                </div>
              ))
            })()}
            <p className="chart-note">
              {en
                ? `General-use contracted power total (demand-side density) and average sales unit price — the larger the contracted power, the thicker a sigungu's commercial/business power infrastructure. Only the general-use contract class (as used by private DCs) is aggregated. Source: ${usage.source}.`
                : `일반용 계약전력 합계(수요측 밀도)와 평균판매단가 — 계약전력이 큰 시군구일수록 상업·업무 전력 인프라가 두터운 곳. 민간 DC 전기요금 계약종(일반용)만 집계. 출처: ${usage.source}.`}
            </p>
          </div>
        )}

        {(() => {
          // 수도권 시도만 데이터가 존재 — 공급예정 민간 DC 집계(삼일PwC·KDCC)
          const pipe = CAPITAL_PIPELINE.filter((p) => p.loc.startsWith(sido)).sort((a, b) => a.due - b.due)
          if (!pipe.length) return null
          const mwSum = pipe.reduce((s, p) => s + p.itMw, 0)
          const maxMw = Math.max(...pipe.map((p) => p.itMw), 1)
          return (
            <div className="calc-card">
              <div className="chart-title">
                {en
                  ? `${sido} upcoming private data centers — ${pipe.length} sites · IT capacity total ${mwSum.toLocaleString()}MW`
                  : `${sido} 공급예정 민간 데이터센터 — ${pipe.length}곳 · IT용량 합계 ${mwSum.toLocaleString()}MW`}
              </div>
              {pipe.map((p) => (
                <div key={p.name} className="hbar-row">
                  <span className="hbar-label" title={`${p.operator} · ${p.loc}`}>
                    {p.name}
                  </span>
                  <span className="hbar-track">
                    <span className="hbar-fill" style={{ width: `${Math.max((p.itMw / maxMw) * 100, 2)}%` }} />
                  </span>
                  <span className="hbar-value">
                    {p.itMw}MW · ’{String(p.due).slice(2)}
                  </span>
                </div>
              ))}
              <p className="chart-note">
                {en ? 'By IT capacity (not receiving capacity) · scheduled completion is by planned date. Source: ' : 'IT용량 기준(수전용량 아님) · 준공예정은 계획 시점 기준. 출처: '}
                {CAPITAL_PIPELINE_META.source}.{' '}
                <Link to="/data?tab=capital">{en ? 'Full list · CSV →' : '전체 목록·CSV →'}</Link>
              </p>
            </div>
          )
        })()}

        {(() => {
          const re = RENEWABLE_ESS[sido]
          if (!re) return null
          const solarRank =
            Object.values(RENEWABLE_ESS)
              .sort((a, b) => b.solar - a.solar)
              .findIndex((r) => r.sido === sido) + 1
          const pct = (v) => (v / RENEWABLE_ESS_TOTAL.solar) * 100
          const bars = [
            { k: '태양광', label: en ? 'Solar' : '태양광', v: re.solar, max: RENEWABLE_ESS_TOTAL.solar },
            { k: '풍력', label: en ? 'Wind' : '풍력', v: re.wind, max: 3500 },
            { k: 'ESS 저장', label: en ? 'ESS storage' : 'ESS 저장', v: re.ess, max: RENEWABLE_ESS_TOTAL.ess },
          ]
          return (
            <div className="calc-card">
              <div className="chart-title">
                {en
                  ? `${sido} renewable · ESS installed capacity (national solar rank #${solarRank}, ${RENEWABLE_ESS_META.asOf})`
                  : `${sido} 재생에너지·ESS 설비용량 (전국 태양광 ${solarRank}위, ${RENEWABLE_ESS_META.asOf})`}
              </div>
              {bars.map((b) => (
                <div key={b.k} className="hbar-row">
                  <span className="hbar-label">{b.label}</span>
                  <span className="hbar-track">
                    <span
                      className="hbar-fill"
                      style={{ width: b.v == null ? '0%' : `${Math.max((b.v / b.max) * 100, 1.5)}%` }}
                    />
                  </span>
                  <span className="hbar-value">
                    {b.v == null ? (en ? 'source outlier · excluded' : '원본 이상치·제외') : `${Math.round(b.v).toLocaleString()}MW`}
                    {b.k === '태양광' && b.v != null ? (en ? ` · ${pct(b.v).toFixed(1)}% of national` : ` · 전국비 ${pct(b.v).toFixed(1)}%`) : ''}
                  </span>
                </div>
              ))}
              <p className="chart-note">
                {en
                  ? `Regional signal for RE100·PPA renewable-procurement proximity and grid storage conditions (by generation installed capacity, not receiving headroom). Source: ${RENEWABLE_ESS_META.source} (${RENEWABLE_ESS_META.asOf}).${re.wind == null ? ' Jeju wind excluded as a source outlier.' : ''}`
                  : `RE100·PPA 재생조달 근접성과 계통 저장 여건의 지역 신호(발전 설비용량 기준, 수전여유 아님). 출처: ${RENEWABLE_ESS_META.source} (${RENEWABLE_ESS_META.asOf}).${re.wind == null ? ' 제주 풍력은 원본 이상치로 제외.' : ''}`}
              </p>
            </div>
          )
        })()}

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
                {en
                  ? `${sido} sigungu land-price change rate (${LAND_DONG_PERIOD} monthly, KOSIS)`
                  : `${sido} 입지 시군구 지가변동률 (${LAND_DONG_PERIOD} 월간, KOSIS)`}
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
                  {f.sigungu ?? f.sido} · {statusLabel(f.status)} · {f.type}
                  {f.power_mw_public != null && ` · ${f.power_mw_public}MW`}
                  {f.needs_verify && (en ? ' · needs verification' : ' · 검증 필요')}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <p className="footer-note">
          {en
            ? 'Status based on public sources (operator announcements, press reports, government notices); items marked “needs verification” are still being confirmed. Sigungu-level coordinates are the centroid of the administrative area.'
            : '공개 소스(사업자 공식·언론 보도·정부 공고) 기반 현황이며, ‘검증 필요’ 항목은 확인 중인 정보입니다. 시군구 수준 좌표는 행정구역 중심점입니다.'}
        </p>
      </main>
    </>
  )
}
