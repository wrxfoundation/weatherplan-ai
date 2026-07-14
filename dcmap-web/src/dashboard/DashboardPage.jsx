import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL, DATA_VERSION, slugOf, CAPITAL_SIDOS } from '../data/facilities.js'
import { GEN_PERMIT_BUBBLES } from '../data/genLicenses.js'
import { NEW_PLANTS_2025 } from '../data/newPlants2025.js'
import { SUBSTATIONS, SUBSTATION_META } from '../data/substations.js'
import { POWER_MARKET_META, PURCHASE_PRICE_2024, PURCHASE_SUMMARY, PRICE_PEAK, PRICE_LOW } from '../data/powerMarket.js'
import { DC_ASSESSMENT, DC_ASSESSMENT_ROLLUP, GRID_ASSESSMENT_META, PSIA_REVIEW_2026, approvalLabel } from '../data/gridAssessment.js'
import { GRID_HEADROOM, GRID_HEADROOM_META, headroomLabel } from '../data/gridHeadroom.js'
import { RESERVE_12M, RESERVE_MIN, RESERVE_MAX, POWER_RESERVE_META } from '../data/powerReserve.js'
import { LAND_PRICE, fmtRate } from '../data/landPrice.js'
import { LAND_DONG } from '../data/landPriceDong.js'
import { filingsRecent, epsisCapacity, apiStatus, tradingMix, riskFor } from '../data/liveApi.js'

const TITLE = '대시보드 — AI InfraMap 한국 데이터센터 인텔리전스'
const DESC =
  '한국 데이터센터 현황 대시보드: 상태별 시설 수, 지역별 공개 전력 분포, 건설·계획 파이프라인, 입지 시군구 지가 펄스 — 전부 공개 데이터 기준.'

/* 하프서클 게이지 — 밝은 겉테두리 아크 + 반투명 속 아크 (레퍼런스 게이지 문법)
 * 아크 경로 반지름 50, 반원 길이 = π×50 ≈ 157.08 */
const ARC = 'M 12 66 A 50 50 0 0 1 112 66'
const ARC_LEN = Math.PI * 50

/* 대시보드 리스트 공통 — 기본 N행 + "전체 보기" 확장 토글 (풀리스트는 카드 안에서 펼침) */
function ExpandableList({ items, initial = 6, render, unit = '건' }) {
  const [open, setOpen] = useState(false)
  const shown = open ? items : items.slice(0, initial)
  return (
    <>
      {shown.map(render)}
      {items.length > initial && (
        <button type="button" className="btn list-expand" onClick={() => setOpen((v) => !v)}>
          {open ? '접기 ▲' : `전체 ${items.length.toLocaleString()}${unit} 상세보기 ▼`}
        </button>
      )}
    </>
  )
}

function Gauge({ pct, label, sub }) {
  const on = (ARC_LEN * pct) / 100
  return (
    <div className="gauge-wrap" role="img" aria-label={`${label} ${pct}%`}>
      <svg viewBox="0 0 124 72" className="gauge">
        {/* 트랙 */}
        <path d={ARC} className="gauge-track" />
        {/* 값: 밝은 엣지(굵게) 위에 반투명 코어(가늘게) — 유리관에 빛이 든 표현 */}
        <path d={ARC} className="gauge-edge" strokeDasharray={`${on} ${ARC_LEN}`} />
        <path d={ARC} className="gauge-core" strokeDasharray={`${on} ${ARC_LEN}`} />
      </svg>
      <div className="gauge-center">
        <span>{label}</span>
        <strong>{pct}%</strong>
        {sub && <em>{sub}</em>}
      </div>
    </div>
  )
}

/* 월별 미니 막대 — 상단 글라스 테두리 + 하단 페이드(마스크) + 월(月) 축 라벨.
 * bars: [{ key, mon(월 숫자), h(0~100), hot(강조), title }] */
function MiniBars({ bars, ariaLabel }) {
  return (
    <div className="hbar-mini-wrap">
      <div className="hbar-mini" role="img" aria-label={ariaLabel}>
        {bars.map((b) => (
          <span key={b.key} className={`hbar-mini-bar${b.hot ? ' hot' : ''}`} title={b.title} style={{ height: `${b.h}%` }} />
        ))}
      </div>
      <div className="hbar-mini-x" aria-hidden>
        {bars.map((b) => (
          <span key={b.key}>{b.mon}</span>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [now, setNow] = useState(() => new Date())
  const [filings, setFilings] = useState(null)
  const [filingCorp, setFilingCorp] = useState('전체') // 공시 운영사 필터
  const [epsis, setEpsis] = useState(null)
  const [trading, setTrading] = useState(null)
  const [status, setStatus] = useState(null)
  const [riskRows, setRiskRows] = useState({})
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let alive = true
    filingsRecent().then((v) => alive && setFilings(v))
    epsisCapacity().then((v) => alive && setEpsis(v))
    tradingMix().then((v) => alive && setTrading(v))
    apiStatus(true).then((v) => alive && setStatus(v))
    return () => {
      alive = false
    }
  }, [])

  // 지역별 재해 리스크 — DC 입지 시군구별 SGIS 홍수·산사태 노출률(대표점=시군구 내 DC 좌표).
  // 시군구당 1회(kind=risk로 홍수+산사태 통합), 동시 4개 스로틀 + 엣지 캐시로 부하 최소화.
  const riskTargets = useMemo(() => {
    const m = new Map()
    for (const f of FACILITIES) {
      if (!f.sigungu || f.lat == null || f.lng == null) continue
      const key = `${f.sido} ${f.sigungu}`
      if (!m.has(key)) m.set(key, { key, sido: f.sido, sigungu: f.sigungu, lat: f.lat, lng: f.lng, dcCount: 0 })
      m.get(key).dcCount += 1
    }
    return [...m.values()]
  }, [])

  useEffect(() => {
    let alive = true
    let i = 0
    const worker = async () => {
      while (i < riskTargets.length && alive) {
        const t = riskTargets[i++]
        const r = await riskFor(t.lat, t.lng)
        if (!alive) return
        if (r?.available) {
          setRiskRows((prev) => ({ ...prev, [t.key]: { ...t, flood: r.flood, landslide: r.landslide, admNm: r.admNm } }))
        }
      }
    }
    Promise.all(Array.from({ length: 4 }, worker))
    return () => {
      alive = false
    }
  }, [riskTargets])

  const riskList = useMemo(
    () =>
      Object.values(riskRows)
        .map((r) => ({
          ...r,
          floodPct: r.flood?.exposurePct ?? null,
          lsPct: r.landslide?.exposurePct ?? null,
          maxPct: Math.max(r.flood?.exposurePct ?? 0, r.landslide?.exposurePct ?? 0),
        }))
        .sort((a, b) => b.maxPct - a.maxPct),
    [riskRows],
  )

  // KPX 수급예보(openapi.kpx.or.kr)는 클라우드 IP 차단으로 미연동 → 되는 데이터(전력거래실적)로
  // 공급측 신호를 대체 구성: 실제 발전 믹스에서 재생/원자력/화석 비중.
  const RENEW = new Set(['태양광', '풍력', '해상풍력', '수력', '바이오', '연료전지', '신재생·기타'])
  const mix = useMemo(() => {
    const bars = (trading?.available ? trading.byFuel : [])?.filter((f) => f.tradedMwh != null) || []
    const total = bars.reduce((s, f) => s + f.tradedMwh, 0)
    if (!total) return null
    const sum = (pred) => bars.filter(pred).reduce((s, f) => s + f.tradedMwh, 0)
    const renew = sum((f) => RENEW.has(f.fuel))
    const nuclear = sum((f) => f.fuel === '원자력')
    const fossil = Math.max(0, total - renew - nuclear)
    const pct = (v) => Math.round((v / total) * 100)
    return { total, renewPct: pct(renew), nuclearPct: pct(nuclear), fossilPct: pct(fossil), asOf: trading?.asOf }
  }, [trading])

  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  const d = useMemo(() => {
    const by = { operating: 0, construction: 0, planned: 0 }
    let totalMw = 0
    const regionMw = new Map()
    for (const f of FACILITIES) {
      const sk = f.status === 'delayed' ? 'planned' : f.status
      if (by[sk] != null) by[sk] += 1 // cancelled(무산)은 운영/건설/계획 집계 제외
      if (f.power_mw_public != null) {
        totalMw += f.power_mw_public
        regionMw.set(f.sido, (regionMw.get(f.sido) ?? 0) + f.power_mw_public)
      }
    }
    const regions = [...regionMw.entries()].sort((a, b) => b[1] - a[1])
    const pipeline = FACILITIES.filter((f) => f.status === 'construction').sort(
      (a, b) => (b.power_mw_public ?? -1) - (a.power_mw_public ?? -1),
    )
    const landRanked = Object.entries(LAND_PRICE.entries)
      .filter(([k]) => k.includes(' ')) // 시군구만
      .sort((a, b) => b[1] - a[1])
    const dongAll = Object.entries(LAND_DONG.entries).flatMap(([k, v]) =>
      v.dongs.map((d) => ({ sigungu: k, ...d })),
    )
    dongAll.sort((a, b) => b.rate - a.rate)
    return {
      by,
      total: FACILITIES.length,
      totalMw,
      opPct: Math.round((by.operating / FACILITIES.length) * 100),
      regions,
      pipeline,
      landTop: landRanked.slice(0, 4),
      landBottom: landRanked.slice(-4).reverse(),
      dongHot: dongAll[0],
      dongCold: dongAll[dongAll.length - 1],
      dongCount: dongAll.length,
    }
  }, [])

  // 지역별 '전력 + 데이터센터'를 한 눈에 — 어디 중심으로 준비가 진행되는지. 전부 공개 소스.
  const rollup = useMemo(() => {
    const m = new Map()
    const get = (s) => {
      if (!m.has(s)) m.set(s, { sido: s, dcCount: 0, dcMw: 0, genCount: 0, genMw: 0, newMw: 0 })
      return m.get(s)
    }
    for (const f of FACILITIES) {
      const r = get(f.sido)
      r.dcCount += 1
      r.dcMw += f.power_mw_public ?? 0
    }
    for (const b of GEN_PERMIT_BUBBLES) {
      const r = get(b.sido)
      r.genCount = b.count
      r.genMw = b.mw ?? 0
    }
    for (const n of NEW_PLANTS_2025) get(n.sido).newMw = Math.round((n.capacityKw ?? 0) / 1000)
    // 준비 집중도 = DC 공개용량 + 2025 신규 발전(MW) 기준 내림차순
    return [...m.values()].sort((a, b) => b.dcMw + b.newMw - (a.dcMw + a.newMw))
  }, [])
  const maxRollup = Math.max(...rollup.map((r) => Math.max(r.dcMw, r.newMw, 1)), 1)

  // 해석 코멘트 — "어디 중심으로 준비되는가"의 답을 실데이터에서 도출(가짜 수치 없음).
  const rollupInsight = useMemo(() => {
    const sum = (arr, k) => arr.reduce((a, r) => a + (r[k] || 0), 0)
    const cap = rollup.filter((r) => CAPITAL_SIDOS.has(r.sido))
    const non = rollup.filter((r) => !CAPITAL_SIDOS.has(r.sido))
    const totalDc = sum(rollup, 'dcCount') || 1
    const capDc = sum(cap, 'dcCount')
    const capPct = Math.round((capDc / totalDc) * 100)
    const nonNew = sum(non, 'newMw')
    const capNew = sum(cap, 'newMw')
    const topDc = [...rollup].sort((a, b) => b.dcCount - a.dcCount)[0]
    const topNew = [...rollup].filter((r) => r.newMw > 0).sort((a, b) => b.newMw - a.newMw)[0]
    return { totalDc, capDc, capPct, nonNew, capNew, topDc, topNew }
  }, [rollup])

  const maxRegion = d.regions[0]?.[1] ?? 1
  // landTop+landBottom 모두 포함해야 최대 절대값 기준 — landBottom(최대 음수)이 더 크면 바가 100% 초과
  const maxLand = Math.max(...[...d.landTop, ...d.landBottom].map(([, v]) => Math.abs(v)), 0.01)

  return (
    <>
      <TopBar />
      <main className="page dashboard">
        <div className="eyebrow">KOREA DATA CENTER INTELLIGENCE</div>
        <h1>대시보드</h1>
        <p className="sub">
          공개 데이터 기준 현황 — 시드 v{DATA_VERSION.version} · {DATA_VERSION.date} · KOSIS {LAND_PRICE.period.slice(0, 4)}.
          {LAND_PRICE.period.slice(4)}
          <span className="dash-clock" title="한국 표준시 (UTC+9)">
            {now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Seoul' })} · {now.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} <span className="dash-tz">KST</span>
          </span>
        </p>

        <div className="dash-grid">
          <div className="dash-section-head" style={{ gridColumn: '1 / -1' }}>
            <span className="dsh-num">01</span>
            <span className="dsh-title">데이터센터 현황</span>
            <span className="dsh-sub">어디에 얼마나 — 분포·상태·용량·파이프라인</span>
          </div>
          {/* 지역별 전력·데이터센터 한눈에 — 어디 중심으로 준비가 진행되는지(공개 소스) */}
          <section className="calc-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">지역별 전력·데이터센터 한눈에 — 어디 중심으로 준비되는가</div>
            <div className="rollup-table" role="table">
              <div className="rollup-head" role="row">
                <span>지역</span>
                <span>데이터센터</span>
                <span>2025 신규 발전</span>
                <span>발전허가(2024+)</span>
              </div>
              <ExpandableList
                items={rollup}
                initial={8}
                unit="개 지역"
                render={(r) => (
                  <div key={r.sido} className="rollup-row" role="row">
                    <span className="rollup-sido">
                      <Link to={`/?sido=${encodeURIComponent(r.sido)}`}>{r.sido}</Link>
                      {CAPITAL_SIDOS.has(r.sido) && <span className="badge" style={{ marginLeft: 6 }}>수도권</span>}
                    </span>
                    <span>
                      <b>{r.dcCount}</b>곳{r.dcMw > 0 ? ` · ${r.dcMw.toLocaleString()}MW` : ''}
                      <span className="rollup-bar">
                        <i style={{ width: `${(r.dcMw / maxRollup) * 100}%` }} />
                      </span>
                    </span>
                    <span>
                      {r.newMw > 0 ? <b>{r.newMw.toLocaleString()}MW</b> : <span className="muted">–</span>}
                      <span className="rollup-bar alt">
                        <i style={{ width: `${(r.newMw / maxRollup) * 100}%` }} />
                      </span>
                    </span>
                    <span>{r.genCount > 0 ? `${r.genCount}건` : <span className="muted">–</span>}</span>
                  </div>
                )}
              />
            </div>
            <div className="rollup-insight">
              <span className="ri-tag">해석</span>
              <p>
                데이터센터는 <strong>수도권에 {rollupInsight.capDc}곳({rollupInsight.capPct}%)</strong> 몰려 있는 반면,
                2025년 신규 발전설비는 <strong>비수도권에 {rollupInsight.nonNew.toLocaleString()}MW</strong>
                {rollupInsight.capNew > 0 ? `(수도권 ${rollupInsight.capNew.toLocaleString()}MW)` : ''} 신설 —
                <strong> 수요는 수도권, 신규 공급은 비수도권</strong>으로 갈린다.
                {rollupInsight.topDc && ` 최다 DC 밀집은 ${rollupInsight.topDc.sido}(${rollupInsight.topDc.dcCount}곳)`}
                {rollupInsight.topNew && `, 신규 발전은 ${rollupInsight.topNew.sido}(${rollupInsight.topNew.newMw.toLocaleString()}MW)에 집중`}.
                계통영향평가 ±15점(수도권 감점·비수도권 가점)까지 겹쳐, <strong>전력이 있는 비수도권으로 신규 AIDC가 내려갈 유인</strong>이
                수치로 드러난다.
              </p>
            </div>
            <p className="chart-note">
              데이터센터(공개 시드) · 2025 신규 발전 설비(설비현황) · 발전허가(3MW 초과 허가대장 2024+). 정렬: DC 공개용량 + 신규 발전
              합산 내림차순. 지역명 클릭 시 해당 지역 시설 맵으로. 출처: <strong>공개 데이터 기준</strong>(가짜 수치로 채우지 않음).
            </p>
          </section>
          <section className="calc-card">
            <div className="chart-title">DATA CENTER STATUS</div>
            <div className="dash-status">
              <div className="status-rows">
                <div className="dash-row">
                  <span className="dot operating" /> 운영 <strong>{d.by.operating}</strong>
                </div>
                <div className="dash-row">
                  <span className="dot construction" /> 건설 <strong>{d.by.construction}</strong>
                </div>
                <div className="dash-row">
                  <span className="dot planned" /> 계획 <strong>{d.by.planned}</strong>
                </div>
                <div className="dash-row total">
                  전체 <strong>{d.total}</strong>곳 · 공개 전력 <strong>{d.totalMw.toLocaleString()}</strong> MW
                </div>
              </div>
              <Gauge pct={d.opPct} label="OPERATIONAL" />
            </div>
          </section>

          <section className="calc-card">
            <div className="chart-title">CAPACITY DISTRIBUTION — 지역별 공개 전력</div>
            <ExpandableList
              items={d.regions}
              initial={6}
              unit="개 지역"
              render={([sido, mw]) => (
                <div key={sido} className="hbar-row">
                  <span className="hbar-label">{sido}</span>
                  <span className="hbar-track">
                    <span className="hbar-fill" style={{ width: `${(mw / maxRegion) * 100}%` }} />
                  </span>
                  <span className="hbar-value">{mw.toLocaleString()}MW</span>
                </div>
              )}
            />
            <p className="chart-note">공개 용량(power_mw_public) 확인 시설만 집계 — 계획·건설 포함.</p>
          </section>

          <section className="calc-card">
            <div className="chart-title">CONSTRUCTION PIPELINE — 건설 중 {d.pipeline.length}곳</div>
            <div className="facility-list">
              <ExpandableList
                items={d.pipeline}
                initial={6}
                unit="곳"
                render={(f) => (
                  <Link key={f.id} className="facility-row" to={`/dc/${slugOf(f)}`}>
                    <span className="dot construction" />
                    <span>
                      <span className="name">{f.name}</span>
                      <span className="meta">
                        {f.sigungu ?? f.sido} · 목표 {f.year ?? '미상'}
                        {f.power_mw_public != null && ` · ${f.power_mw_public}MW`}
                      </span>
                    </span>
                  </Link>
                )}
              />
            </div>
            <p className="chart-note">공정률은 사업자 미공개 — 목표 연도 기준. 이벤트 타임라인은 D2 어댑터 가동 후.</p>
          </section>

          <div className="dash-section-head" style={{ gridColumn: '1 / -1' }}>
            <span className="dsh-num">02</span>
            <span className="dsh-title">입지·시장 신호</span>
            <span className="dsh-sub">지가 흐름·사업자 공시 — 준비의 선행 지표</span>
          </div>
          <section className="calc-card">
            <div className="chart-title">LAND PULSE — 입지 시군구 지가변동률 (월간, KOSIS)</div>
            {[...d.landTop, ...d.landBottom].map(([k, v]) => (
              <div key={k} className="hbar-row">
                <span className="hbar-label">{k}</span>
                <span className="hbar-track">
                  <span
                    className={`hbar-fill${v < 0 ? ' neg' : ''}`}
                    style={{ width: `${(Math.abs(v) / maxLand) * 100}%` }}
                  />
                </span>
                <span className="hbar-value">{v >= 0 ? '+' : ''}{v}%</span>
              </div>
            ))}
            <p className="chart-note">
              상위 4 · 하위 4 — DC 입지 시군구만. 음수는 amber.{' '}
              <Link to="/land">시·군·구·동 전체 리스트 →</Link>
            </p>
            {d.dongHot && (
              <p className="chart-note">
                동 단위({d.dongCount}개 구역) 최고 <strong>{d.dongHot.sigungu} {d.dongHot.name} {fmtRate(d.dongHot.rate)}</strong> ·
                최저 <strong>{d.dongCold.sigungu} {d.dongCold.name} {fmtRate(d.dongCold.rate)}</strong> — 시설 상세에서 구역별 확인.
              </p>
            )}
          </section>

          <section className="calc-card">
            <div className="chart-title">DC 운영사 투자·공급·DC 공시 — DART 전자공시 (D2)</div>
            {filings?.available ? (
              <>
                {/* 운영사 필터 + 건수 — 공시 흐름을 회사별로 끊어 읽게 */}
                <div className="filing-corps" role="group" aria-label="공시 운영사 필터">
                  <button type="button" className={filingCorp === '전체' ? 'on' : ''} onClick={() => setFilingCorp('전체')}>
                    전체 {filings.filings.length}
                  </button>
                  {[...new Set(filings.filings.map((f) => f.corp))].map((c) => (
                    <button key={c} type="button" className={filingCorp === c ? 'on' : ''} onClick={() => setFilingCorp(filingCorp === c ? '전체' : c)}>
                      {c} {filings.filings.filter((f) => f.corp === c).length}
                    </button>
                  ))}
                </div>
                <div className="facility-list">
                  <ExpandableList
                    items={filings.filings.filter((f) => filingCorp === '전체' || f.corp === filingCorp)}
                    initial={6}
                    render={(f, i) => {
                      // 제목 키워드 태그(투자·설비 신호) + 7일 내 NEW — 제목만으로 읽히는 신호 강화
                      const kw = (String(f.title).match(/착공|증설|신설|수전|전력|투자|출자|유상증자|시설투자|공급계약|타법인/) || [])[0]
                      const isNew = f.date && (Date.now() - new Date(f.date).getTime()) / 86400000 <= 7
                      return (
                        <a key={i} className="facility-row" href={f.url} target="_blank" rel="noreferrer">
                          <span className={`dot ${f.type === '데이터센터' ? 'operating' : 'construction'}`} />
                          <span>
                            <span className="name">{f.title}</span>
                            <span className="meta">
                              {f.corp} · {f.date}
                              {isNew && <span className="badge f-new" style={{ marginLeft: 6 }}>NEW</span>}
                              {kw && <span className="badge f-kw" style={{ marginLeft: 6 }}>{kw}</span>}
                              {f.type && (
                                <span className={`badge ${f.type === '데이터센터' ? 'status-operating' : 'verify'}`} style={{ marginLeft: 6 }}>
                                  {f.type}
                                </span>
                              )}
                            </span>
                          </span>
                        </a>
                      )
                    }}
                  />
                </div>
                <p className="chart-note">
                  DC 운영·건설 상장사(삼성전자·SK·KT·LG U+·네이버·카카오·GS)의 최근 {filings.window_days ?? 90}일 공시.
                  DART 공시 제목은 유형만 담겨 '<strong>투자·공급</strong>'은 데이터센터 여부를 본문에서 확인해야 함(제목에 DC 명시 시 '데이터센터' 태그).
                </p>
              </>
            ) : (
              <p className="chart-note">
                사업자 공시(투자·착공·설비 신설)는 언론보다 선행하는 1차 출처 — DART API 연동 시 실시간 표시.
                현재 <span className="badge verify">연동 대기</span> (env 설정 후 활성).
              </p>
            )}
          </section>

          {/* 지역별 재해 리스크 — DC 입지 시군구별 SGIS 홍수·산사태 노출률(공개 소스) */}
          <section className="calc-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">지역별 재해 리스크 — DC 입지 시군구 (SGIS 홍수·산사태 영향구역 인구 노출률)</div>
            {riskList.length === 0 ? (
              <p className="chart-note">
                SGIS 국가 자연재해 위험지도 조회 중… (DC 입지 {riskTargets.length}개 시군구 · 서버 연동 시 표시)
              </p>
            ) : (
              <>
                <div className="rollup-table" role="table">
                  <div className="rollup-head" role="row">
                    <span>지역</span>
                    <span>홍수 노출</span>
                    <span>산사태 노출</span>
                    <span>DC</span>
                  </div>
                  <ExpandableList
                    items={riskList}
                    initial={10}
                    unit="개 지역"
                    render={(r) => (
                      <div key={r.key} className="rollup-row" role="row">
                        <span className="rollup-sido">
                          {r.sido} {r.sigungu}
                          {CAPITAL_SIDOS.has(r.sido) && <span className="badge" style={{ marginLeft: 6 }}>수도권</span>}
                        </span>
                        <span>
                          {r.floodPct != null ? <b>{r.floodPct}%</b> : <span className="muted">–</span>}
                          <span className="rollup-bar">
                            <i style={{ width: `${Math.min(100, r.floodPct ?? 0)}%` }} />
                          </span>
                        </span>
                        <span>
                          {r.lsPct != null ? <b>{r.lsPct}%</b> : <span className="muted">–</span>}
                          <span className="rollup-bar alt">
                            <i style={{ width: `${Math.min(100, r.lsPct ?? 0)}%` }} />
                          </span>
                        </span>
                        <span>{r.dcCount}곳</span>
                      </div>
                    )}
                  />
                </div>
                <p className="chart-note">
                  홍수·산사태 <strong>영향구역 인구 노출률</strong>(읍면동 기준, 값 클수록 리스크). 정렬: 최대 노출 내림차순.
                  대표점 = 시군구 내 DC 좌표. 출처: <strong>SGIS 국가 자연재해 위험지도</strong>
                  ({Object.keys(riskRows).length}/{riskTargets.length} 조회 완료).
                </p>
              </>
            )}
          </section>

          <div className="dash-section-head" style={{ gridColumn: '1 / -1' }}>
            <span className="dsh-num">03</span>
            <span className="dsh-title">전력·계통</span>
            <span className="dsh-sub">공급 여건 — 계통영향평가·설비·발전 믹스 (DC 입지의 핵심 제약)</span>
          </div>
          <section className="calc-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">전력계통영향평가 — 데이터센터 공급 가능/불가 (시도별, 한전 2026.3)</div>
            <div className="dash-status" style={{ marginBottom: 8 }}>
              <div className="status-rows">
                <div className="dash-row">
                  수도권 DC 승인율 <strong>{DC_ASSESSMENT_ROLLUP.수도권.ratePct}</strong>% (가능 {Math.round(DC_ASSESSMENT_ROLLUP.수도권.able).toLocaleString()}MW / 불가 {Math.round(DC_ASSESSMENT_ROLLUP.수도권.unable).toLocaleString()}MW)
                </div>
                <div className="dash-row">
                  비수도권 DC 승인율 <strong>{DC_ASSESSMENT_ROLLUP.비수도권.ratePct}</strong>% (가능 {Math.round(DC_ASSESSMENT_ROLLUP.비수도권.able).toLocaleString()}MW / 불가 {Math.round(DC_ASSESSMENT_ROLLUP.비수도권.unable).toLocaleString()}MW)
                </div>
                <div className="dash-row total">전국 {DC_ASSESSMENT_ROLLUP.전국.ratePct}% · DC 신청 {Math.round(DC_ASSESSMENT_ROLLUP.전국.able + DC_ASSESSMENT_ROLLUP.전국.unable).toLocaleString()}MW</div>
                <div className="dash-row">
                  본심사(위원회) 통과 — 수도권 <strong>{PSIA_REVIEW_2026.capital.passed}/{PSIA_REVIEW_2026.capital.reviewed}</strong>건 (신청 {PSIA_REVIEW_2026.capital.applied}건 대비 {Math.round((PSIA_REVIEW_2026.capital.passed / PSIA_REVIEW_2026.capital.applied) * 1000) / 10}%) · 비수도권 <strong>{PSIA_REVIEW_2026.nonCapital.passed}/{PSIA_REVIEW_2026.nonCapital.reviewed}</strong>건 ({Math.round((PSIA_REVIEW_2026.nonCapital.passed / PSIA_REVIEW_2026.nonCapital.reviewed) * 1000) / 10}%) <span className="muted" style={{ fontSize: '0.85em' }}>{PSIA_REVIEW_2026.asOf}</span>
                </div>
              </div>
              <Gauge pct={Math.round(DC_ASSESSMENT_ROLLUP.비수도권.ratePct)} label="비수도권 승인율" sub={`수도권 ${DC_ASSESSMENT_ROLLUP.수도권.ratePct}%`} />
            </div>
            <div className="rollup-table" role="table">
              <div className="rollup-head" role="row">
                <span>시도</span>
                <span>DC 공급 승인율</span>
                <span>가능</span>
                <span>불가</span>
              </div>
              {Object.values(DC_ASSESSMENT)
                .filter((a) => a.ratePct != null)
                .sort((a, b) => b.ratePct - a.ratePct)
                .map((a) => (
                  <div key={a.sido} className="rollup-row" role="row">
                    <span className="rollup-sido">
                      {a.sido}
                      {CAPITAL_SIDOS.has(a.sido) && <span className="badge" style={{ marginLeft: 6 }}>수도권</span>}
                    </span>
                    <span>
                      <b>{a.ratePct}%</b> <span className="muted" style={{ fontSize: '0.85em' }}>{approvalLabel(a.ratePct)}</span>
                      <span className="rollup-bar">
                        <i style={{ width: `${a.ratePct}%`, background: a.ratePct < 45 ? '#ef4444' : undefined }} />
                      </span>
                    </span>
                    <span>{Math.round(a.able).toLocaleString()}MW</span>
                    <span>{a.unable > 0 ? `${Math.round(a.unable).toLocaleString()}MW` : '–'}</span>
                  </div>
                ))}
            </div>
            <div className="note-stack">
              <p className="chart-note">
                분산에너지 특별법 <strong>전력계통영향평가</strong> 1차 기술검토(한전) — DC 신·증설 신청 대비 기술적 <strong>전력공급 가능/불가 용량(MW)</strong>. 승인율=가능/(가능+불가).
              </p>
              <p className="chart-note key">
                <strong>수도권 {DC_ASSESSMENT_ROLLUP.수도권.ratePct}% vs 비수도권 {DC_ASSESSMENT_ROLLUP.비수도권.ratePct}%</strong> — 수도권 계통 병목이 실측으로 드러남(경기·인천 신청의 절반 이상이 공급불가). 충북·경북·경남·대구·광주는 100% 가능.
              </p>
              <p className="chart-note">
                신청 시점 누적 심사치이며 부지별 확정은 개별 1차 기술검토(주소 기준). 출처: <strong>{GRID_ASSESSMENT_META.source}</strong>.
              </p>
            </div>
          </section>
          <section className="calc-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">지역 계통 공급여유 — 한전 연계가능용량 (시도별, 2027 전망)</div>
            {(() => {
              const rows = Object.values(GRID_HEADROOM).filter((g) => g.sido !== '광주')
              const maxMw = Math.max(...rows.map((g) => g.mw), 1)
              return (
                <div className="rollup-table" role="table">
                  <div className="rollup-head" role="row">
                    <span>시도</span>
                    <span>계통 공급여유</span>
                    <span>판정</span>
                  </div>
                  {[...rows]
                    .sort((a, b) => b.mw - a.mw)
                    .map((g) => (
                      <div key={g.sido} className="rollup-row" role="row">
                        <span className="rollup-sido">
                          {g.sido === '전남' ? '전남(광주통합)' : g.sido}
                          {CAPITAL_SIDOS.has(g.sido) && <span className="badge" style={{ marginLeft: 6 }}>수도권</span>}
                        </span>
                        <span>
                          <b>{g.mw.toLocaleString()}</b>MW
                          <span className="rollup-bar">
                            <i style={{ width: `${(g.mw / maxMw) * 100}%`, background: g.mw <= 10 ? '#ef4444' : undefined }} />
                          </span>
                        </span>
                        <span className="muted" style={{ fontSize: '0.9em' }}>{headroomLabel(g.mw)}</span>
                      </div>
                    ))}
                </div>
              )
            })()}
            <div className="note-stack">
              <p className="chart-note">
                한전 <strong>연계가능용량(공급여유)</strong> 시도 총량(2027 전망). DC 승인율(신청 대비)과 달리 <strong>잔여 연결 여력(MW)</strong>을 나타냄.
              </p>
              <p className="chart-note key">
                <strong>인천 5MW(계통 포화)</strong>는 자급률 165%(발전 잉여)와 정반대 — 발전 잉여 ≠ 수용 여유. 경북·충남·전남은 여유·승인율 모두 우수.
              </p>
              <p className="chart-note">
                시도 총량이라 시군구 편차 크며 부지별 확정은 한전 주소검색. 출처: <strong>{GRID_HEADROOM_META.source}</strong>.
              </p>
            </div>
          </section>

          {/* 지역별 송변전 인프라 — 한전 변전소 현황(154kV+). 설비 밀도(여유량 아님). 계통 수용력 그룹에 배치 */}
          <section className="calc-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">지역별 송변전 인프라 — 154kV+ 변전소·변압기 용량 (한전 변전설비현황 2026.7)</div>
            <div className="rollup-table" role="table">
              <div className="rollup-head" role="row">
                <span>지역(한전 본부)</span>
                <span>154kV+ 변전소</span>
                <span>변압기 용량</span>
                <span>345kV</span>
              </div>
              {[...SUBSTATIONS].sort((a, b) => b.hv - a.hv).map((s) => {
                const maxHv = Math.max(...SUBSTATIONS.map((x) => x.hv))
                return (
                  <div key={s.region} className="rollup-row" role="row">
                    <span className="rollup-sido">{s.region}</span>
                    <span>
                      <b>{s.hv}</b>개
                      <span className="rollup-bar">
                        <i style={{ width: `${(s.hv / maxHv) * 100}%` }} />
                      </span>
                    </span>
                    <span>{s.hvMva.toLocaleString()}MVA</span>
                    <span>{s.n345}개</span>
                  </div>
                )
              })}
            </div>
            <div className="note-stack">
              <p className="chart-note key">
                한전 지역본부 단위 변전소 <strong>설비 밀도</strong>(154kV·345kV) — 인프라 규모 지표이며 <strong>부지별 접속 여유용량과는 다름</strong>.
              </p>
              <p className="chart-note">
                여유는 <a href="https://recloud.energy.or.kr/" target="_blank" rel="noreferrer">RE클라우드</a>/한전 접속가능용량 조회. 출처: <strong>{SUBSTATION_META.source}</strong>.
              </p>
            </div>
          </section>
          <section className="calc-card">
            <div className="chart-title">발전설비 현황 — EPSIS 전력시장 등록설비 (연료원/구분별)</div>
            {epsis?.available ? (
              <>
                <ExpandableList
                  items={epsis.byFuel || []}
                  initial={8}
                  unit="개 구분"
                  render={(f) => {
                    const max = Math.max(...epsis.byFuel.map((x) => x.mw))
                    return (
                      <div key={f.fuel} className="hbar-row">
                        <span className="hbar-label">{f.fuel}</span>
                        <span className="hbar-track">
                          <span className="hbar-fill" style={{ width: `${(f.mw / max) * 100}%` }} />
                        </span>
                        <span className="hbar-value">{f.mw.toLocaleString()}MW</span>
                      </div>
                    )
                  }}
                />
                <p className="chart-note">
                  전력시장 등록 발전설비 연료원/구분별 설비용량 — 용량 기재 {epsis.capRows?.toLocaleString?.() ?? epsis.count?.toLocaleString?.() ?? 0}개
                  {epsis.total ? ` / 전체 ${epsis.total.toLocaleString()}개 등록` : ''}
                  {epsis.totalMw ? ` · 합계 ${epsis.totalMw.toLocaleString()}MW` : ''}. 설비용량 미기재 구분(DER·재생e공급 등)은 제외 —
                  이 데이터셋에 용량이 없는 것이지 실제 0MW가 아님. 발전소 레이어 capacity 정합 소스(D3).
                </p>
              </>
            ) : (
              <p className="chart-note">
                발전소별·연료원별 공식 설비용량(MW) — 발전소 레이어의 용량 공백과 집단에너지 좌표 공백을 메우는 소스.
                data.go.kr 인증키(무인증 EPSIS 열람 별개) 연동 시 활성. 현재 <span className="badge verify">연동 대기</span>.
              </p>
            )}
          </section>

          <section className="calc-card">
            <div className="chart-title">발전 믹스 — 재생·원자력·화석 비중 (거래실적 기준)</div>
            {mix ? (
              <>
                <div className="dash-status">
                  <div className="status-rows">
                    <div className="dash-row">
                      재생에너지 <strong>{mix.renewPct}</strong>%
                    </div>
                    <div className="dash-row">
                      원자력 <strong>{mix.nuclearPct}</strong>%
                    </div>
                    <div className="dash-row">
                      화석·기타 <strong>{mix.fossilPct}</strong>%
                    </div>
                    {mix.asOf && <div className="dash-row total">기준 {mix.asOf}</div>}
                  </div>
                  <Gauge pct={Math.max(0, Math.min(100, mix.renewPct))} label="재생 비중" />
                </div>
                {/* 재생-원자력-화석 스택 바 */}
                <div className="status-bar" role="img" aria-label={`재생 ${mix.renewPct}%, 원자력 ${mix.nuclearPct}%, 화석 ${mix.fossilPct}%`} style={{ marginTop: 4 }}>
                  {mix.renewPct > 0 && <span className="seg op" style={{ flexGrow: mix.renewPct }} />}
                  {mix.nuclearPct > 0 && <span className="seg co" style={{ flexGrow: mix.nuclearPct }} />}
                  {mix.fossilPct > 0 && <span className="seg pl" style={{ flexGrow: mix.fossilPct }} />}
                </div>
                <p className="chart-note">
                  KPX 수급예보(공급예비율)는 서버 제약으로 미연동 — 대신 <strong>실제 발전 믹스</strong>로 계통 특성을 표기.
                  재생 비중이 높을수록 간헐성 대응(ESS·계통)이 관건. 출처: <strong>KPX 전력거래실적</strong>(data.go.kr, 연료원별 실거래).{' '}
                  <Link to="/insights/market-2025h2">±15점 시대 →</Link>
                </p>
              </>
            ) : (
              <p className="chart-note">
                실제 발전 믹스의 재생·원자력·화석 비중 — 계통 특성 지표. KPX 전력거래실적(data.go.kr) 연동 시 활성. 현재{' '}
                <span className="badge verify">연동 대기</span>.
              </p>
            )}
          </section>

          <section className="calc-card">
            <div className="chart-title">발전 실적 — KPX 전력거래실적 (연료원별, 라이브)</div>
            {trading?.available && trading.byFuel?.length ? (
              <>
                {(() => {
                  const bars = trading.byFuel.filter((f) => f.tradedMwh != null)
                  const max = Math.max(...bars.map((f) => f.tradedMwh), 1)
                  return (
                    <ExpandableList
                      items={bars}
                      initial={8}
                      unit="개 연료원"
                      render={(f) => (
                        <div key={f.fuel} className="hbar-row">
                          <span className="hbar-label">{f.fuel}</span>
                          <span className="hbar-track">
                            <span className="hbar-fill" style={{ width: `${(f.tradedMwh / max) * 100}%` }} />
                          </span>
                          <span className="hbar-value">{f.tradedMwh.toLocaleString()}MWh</span>
                        </div>
                      )}
                    />
                  )
                })()}
                <p className="chart-note">
                  연료원별 실제 전력거래량{trading.asOf ? ` · ${trading.asOf}` : ''}
                  {trading.totalMwh ? ` · 합계 ${trading.totalMwh.toLocaleString()}MWh` : ''}. 설비용량(EPSIS)과 달리
                  실제 발전 믹스 — 값은 수정정산 변동 가능.
                </p>
              </>
            ) : (
              <p className="chart-note">
                일별 연료원별 실제 전력거래량(발전 실적) — 설비용량이 아니라 계통에서 실제 돌아간 발전 믹스.
                KPX 전력거래실적(data.go.kr) 연동 시 활성. 현재 <span className="badge verify">연동 대기</span>.
              </p>
            )}
          </section>

          {/* 전력 원가 환경 — 한전 구입단가(2024). DC OPEX 맥락 */}
          <section className="calc-card">
            <div className="chart-title">전력 원가 환경 — 한전 구입단가 (2024, DC OPEX 지표)</div>
            <div className="dash-status">
              <div className="status-rows">
                <div className="dash-row">
                  평균 구입단가 <strong>{PURCHASE_SUMMARY.avgPrice}</strong>원/kWh
                </div>
                <div className="dash-row">
                  여름 피크 <strong>{PRICE_PEAK.price}</strong>원 ({PRICE_PEAK.m}월) · 최저 <strong>{PRICE_LOW.price}</strong>원 ({PRICE_LOW.m}월)
                </div>
                <div className="dash-row">
                  PPA(직접계약) 비중 <strong>{PURCHASE_SUMMARY.ppaSharePct}</strong>% · 단가 {PURCHASE_SUMMARY.ppaPrice}원
                </div>
                <div className="dash-row total">구입량 {Math.round(PURCHASE_SUMMARY.totalMwh / 1e6)}TWh (2024)</div>
              </div>
              <Gauge pct={Math.round(((PRICE_PEAK.price - PRICE_LOW.price) / PRICE_LOW.price) * 100)} label="여름 원가 상승폭" />
            </div>
            {/* 월별 구입단가 미니 바 */}
            <MiniBars
              ariaLabel="2024 월별 한전 구입단가"
              bars={PURCHASE_PRICE_2024.map((p) => {
                const max = PRICE_PEAK.price
                const min = PRICE_LOW.price - 10
                return { key: p.m, mon: p.m, h: Math.max(6, ((p.price - min) / (max - min)) * 100), hot: p.price >= 150, title: `${p.m}월 ${p.price}원/kWh` }
              })}
            />
            <div className="note-stack">
              <p className="chart-note key">
                DC 운영비의 큰 축이 전력비 — <strong>냉방 수요가 겹치는 7~8월 구입단가가 최저월 대비 {Math.round(((PRICE_PEAK.price - PRICE_LOW.price) / PRICE_LOW.price) * 100)}% 급등</strong>(열 관리 설계·PUE가 원가에 직결).
              </p>
              <p className="chart-note">
                직접 재생조달(PPA)은 아직 {PURCHASE_SUMMARY.ppaSharePct}%로 RE100 조달 초기 단계. 전국 도매 구입단가(한전)로 개별 계약·지역 차등은 별개.
              </p>
              <p className="chart-note">출처: <strong>{POWER_MARKET_META.source}</strong>.</p>
            </div>
          </section>

          {/* 전국 전력수급 — 월별 공급예비율. 여름 계통 여력 최소 */}
          <section className="calc-card">
            <div className="chart-title">전력수급 안정성 — 전국 공급예비율 (최근 12개월)</div>
            <div className="dash-status" style={{ marginBottom: 8 }}>
              <div className="status-rows">
                <div className="dash-row">
                  여름 최저 예비율 <strong>{RESERVE_MIN.pct}</strong>% (&apos;{RESERVE_MIN.ym})
                </div>
                <div className="dash-row">
                  겨울 최고 <strong>{RESERVE_MAX.pct}</strong>% (&apos;{RESERVE_MAX.ym})
                </div>
                <div className="dash-row total">피크일 기준 공급예비율</div>
              </div>
              <Gauge pct={Math.round(RESERVE_MIN.pct)} label="여름 최저 예비율" sub={`겨울 ${RESERVE_MAX.pct}%`} />
            </div>
            <MiniBars
              ariaLabel="월별 공급예비율"
              bars={RESERVE_12M.map(([ym, pct]) => ({
                key: ym,
                mon: parseInt(ym.split('.')[1], 10),
                h: Math.max(6, (pct / RESERVE_MAX.pct) * 100),
                hot: pct < 11,
                title: `'${ym} · 예비율 ${pct}%`,
              }))}
            />
            <div className="note-stack">
              <p className="chart-note key">
                공급예비율이 낮을수록 계통 여력이 얇다 — <strong>DC 냉방부하가 최대인 여름(&apos;{RESERVE_MIN.ym})에 예비율 {RESERVE_MIN.pct}%로 최저</strong>.
              </p>
              <p className="chart-note">
                대형 신규부하 접속·수급 리스크가 여름에 집중된다는 신호(원가 급등과 같은 방향). 전국 지표로 지역 계통 제약과는 별개.
              </p>
              <p className="chart-note">출처: <strong>{POWER_RESERVE_META.source}</strong>.</p>
            </div>
          </section>

          <div className="dash-section-head" style={{ gridColumn: '1 / -1' }}>
            <span className="dsh-num">04</span>
            <span className="dsh-title">시스템 진단</span>
            <span className="dsh-sub">공개 API 연동 상태 — 값은 노출되지 않음</span>
          </div>
          <section className="calc-card" style={{ gridColumn: '1 / -1' }}>
            <div className="chart-title">API 연동 현황 — 서버 env 진단</div>
            {status?.sources ? (
              <>
                <div className="api-status-grid">
                  {status.sources.map((s) => {
                    const state = s.available ? 'live' : s.configured ? 'set' : 'wait'
                    const label = s.available ? '연동' : s.configured ? '설정됨' : 'env 대기'
                    return (
                      <div key={s.key} className="api-status-row">
                        <span className={`api-dot ${state}`} />
                        <span className="api-name">{s.label}</span>
                        <span className="api-axis">{s.axis}</span>
                        <span className={`api-state ${state}`}>
                          {label}
                          {!s.available && s.configured && s.reason ? ` · ${s.reason}` : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <p className="chart-note">
                  ● 연동(실응답) · ◐ 설정됨(env 있음, 업스트림 응답 대기/스키마 확인) · ○ env 대기. 값은 노출되지 않습니다.
                  {status.probed ? '' : ' (probe 미실행 — 설정 여부만)'} 스키마 보정은 각 프록시의 `*_URL` env로 재배포 없이 가능.
                </p>
                <p className="chart-note" style={{ marginTop: 6 }}>
                  ※ vworld(지번주소·용도지역)는 <strong>브라우저 직접 호출</strong>로 전환됨(서버 프록시 502는 정상) — 실제 동작은
                  상단 주소검색으로 확인. 활성 조건: Vercel env <code>VITE_VWORLD_KEY</code>(도메인 등록키).
                </p>
              </>
            ) : (
              <p className="chart-note">
                연동 현황은 서버리스(Vercel) 환경에서 표시됩니다. 정적 프리뷰에서는 <span className="badge verify">진단 대기</span>.
              </p>
            )}
          </section>
        </div>

        <p className="footer-note">
          PUE 평균·전력망 연결률은 사업자 미공개/어댑터 대기 항목 — 가짜 수치로 채우지 않습니다. 계통 여유용량(D3)·
          공시 알림(D2)은 API 연동 시 즉시 활성화됩니다.
        </p>
      </main>
    </>
  )
}
