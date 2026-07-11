import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL, DATA_VERSION, slugOf } from '../data/facilities.js'
import { LAND_PRICE, fmtRate } from '../data/landPrice.js'
import { LAND_DONG } from '../data/landPriceDong.js'
import { filingsRecent, epsisCapacity } from '../data/liveApi.js'

const TITLE = '대시보드 — 명당 AI 한국 데이터센터 인텔리전스'
const DESC =
  '한국 데이터센터 현황 대시보드: 상태별 시설 수, 지역별 공개 전력 분포, 건설·계획 파이프라인, 입지 시군구 지가 펄스 — 전부 공개 데이터 기준.'

/* 하프서클 게이지 — 밝은 겉테두리 아크 + 반투명 속 아크 (레퍼런스 게이지 문법)
 * 아크 경로 반지름 50, 반원 길이 = π×50 ≈ 157.08 */
const ARC = 'M 12 66 A 50 50 0 0 1 112 66'
const ARC_LEN = Math.PI * 50

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

export default function DashboardPage() {
  const [now, setNow] = useState(() => new Date())
  const [filings, setFilings] = useState(null)
  const [epsis, setEpsis] = useState(null)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let alive = true
    filingsRecent().then((v) => alive && setFilings(v))
    epsisCapacity().then((v) => alive && setEpsis(v))
    return () => {
      alive = false
    }
  }, [])

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
      by[f.status === 'delayed' ? 'planned' : f.status] += 1
      if (f.power_mw_public != null) {
        totalMw += f.power_mw_public
        regionMw.set(f.sido, (regionMw.get(f.sido) ?? 0) + f.power_mw_public)
      }
    }
    const regions = [...regionMw.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
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

  const maxRegion = d.regions[0]?.[1] ?? 1
  const maxLand = Math.max(...d.landTop.map(([, v]) => Math.abs(v)), 0.01)

  return (
    <>
      <TopBar />
      <main className="page dashboard">
        <div className="eyebrow">KOREA DATA CENTER INTELLIGENCE</div>
        <h1>대시보드</h1>
        <p className="sub">
          공개 데이터 기준 현황 — 시드 v{DATA_VERSION.version} · {DATA_VERSION.date} · KOSIS {LAND_PRICE.period.slice(0, 4)}.
          {LAND_PRICE.period.slice(4)}
          <span className="dash-clock">
            {now.toLocaleTimeString('en-GB')} · {now.toLocaleDateString('ko-KR')}
          </span>
        </p>

        <div className="dash-grid">
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
            {d.regions.map(([sido, mw]) => (
              <div key={sido} className="hbar-row">
                <span className="hbar-label">{sido}</span>
                <span className="hbar-track">
                  <span className="hbar-fill" style={{ width: `${(mw / maxRegion) * 100}%` }} />
                </span>
                <span className="hbar-value">{mw.toLocaleString()}MW</span>
              </div>
            ))}
            <p className="chart-note">공개 용량(power_mw_public) 확인 시설만 집계 — 계획·건설 포함.</p>
          </section>

          <section className="calc-card">
            <div className="chart-title">CONSTRUCTION PIPELINE — 건설 중 {d.pipeline.length}곳</div>
            <div className="facility-list">
              {d.pipeline.slice(0, 6).map((f) => (
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
              ))}
            </div>
            <p className="chart-note">공정률은 사업자 미공개 — 목표 연도 기준. 이벤트 타임라인은 D2 어댑터 가동 후.</p>
          </section>

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
            <div className="chart-title">최근 DC 공시 — DART 전자공시 (D2)</div>
            {filings?.available ? (
              <div className="facility-list">
                {filings.filings.slice(0, 6).map((f, i) => (
                  <a key={i} className="facility-row" href={f.url} target="_blank" rel="noreferrer">
                    <span className="dot construction" />
                    <span>
                      <span className="name">{f.title}</span>
                      <span className="meta">
                        {f.corp} · {f.date}
                      </span>
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="chart-note">
                사업자 공시(투자·착공·설비 신설)는 언론보다 선행하는 1차 출처 — DART API 연동 시 실시간 표시.
                현재 <span className="badge verify">연동 대기</span> (env 설정 후 활성).
              </p>
            )}
          </section>

          <section className="calc-card">
            <div className="chart-title">발전설비 현황 — EPSIS/KPX (발전소 용량)</div>
            {epsis?.available ? (
              <>
                {(epsis.byFuel || []).slice(0, 8).map((f) => {
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
                })}
                <p className="chart-note">
                  연료원별 설비용량 — {epsis.count?.toLocaleString?.() || 0}개 설비{' '}
                  {epsis.totalMw ? `· 합계 ${epsis.totalMw.toLocaleString()}MW` : ''}. 발전소 레이어 capacity 정합 소스(D3).
                </p>
              </>
            ) : (
              <p className="chart-note">
                발전소별·연료원별 공식 설비용량(MW) — 발전소 레이어의 용량 공백과 집단에너지 좌표 공백을 메우는 소스.
                data.go.kr 인증키(무인증 EPSIS 열람 별개) 연동 시 활성. 현재 <span className="badge verify">연동 대기</span>.
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
