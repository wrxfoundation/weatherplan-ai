import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import VerifyShell from './VerifyShell.jsx'
import LeadDialog from '../lead/LeadDialog.jsx'
import LineIcon from '../components/LineIcon.jsx'
import { useMapLang } from '../i18n/mapLang.js'
import { geocodeAddr } from '../data/liveApi.js'
import { STATIONS_META } from './stationsData.js'
import { nearestStations, coverageGrade, USE_CASES } from './verifyEngine.js'
import { PROCESS_STEPS, PRICING_TIERS, FAQ } from './verifyContent.js'
import './verify.css'

const TITLE = '웨더팩트 — 기상 사실확인·감정지원 리포트'
const TITLE_EN = 'WeatherFact — Weather Fact-Check & Appraisal Support Reports'
const DESC = '특정 지점·기간의 기상 사실을 관측 기록 기반으로 확인 — 손해사정·건설 클레임·법률 감정 지원.'
const DESC_EN = 'Verify weather facts for a specific point and period from observation records — for insurance adjusting, construction claims and legal appraisal.'

/* 웨더팩트 메인 페이지 — 조회 폼(위경도+기간+용도) → 최근접 관측지점 매칭 → 리포트 미리보기/감정사 검수 문의.
 * 정직성: 실데이터 파이프라인 미연동 상태를 '데이터 대기'로 명시, 지점 좌표는 근사값(STATIONS_META.note),
 * 법적 효력은 감정사 검수본 기준임을 하단 박스에 고지. */
export default function VerifyPage() {
  const en = useMapLang() === 'en'
  const navigate = useNavigate()

  const [form, setForm] = useState({ lat: '', lon: '', from: '', to: '', use: USE_CASES[0]?.key ?? 'insurance' })
  const [result, setResult] = useState(null) // { lat, lon, stations, grade }
  const [err, setErr] = useState('')
  const [dlg, setDlg] = useState(false)
  const [addrQ, setAddrQ] = useState('')
  const [addrBusy, setAddrBusy] = useState(false)
  const [addrHit, setAddrHit] = useState(null) // { matched, matchType } — geocode 성공 시 확인 라벨용
  const [addrMiss, setAddrMiss] = useState(false) // 실패/미설정 — 에러가 아닌 정직 안내

  useEffect(() => {
    document.title = en ? TITLE_EN : TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', en ? DESC_EN : DESC)
  }, [en])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const selUse = useMemo(() => USE_CASES.find((u) => u.key === form.use) ?? USE_CASES[0], [form.use])

  /* 주소 → 좌표 (vworld 지오코딩). 성공 시 위경도 입력값을 자동 채우되 확정하지 않음 — 사용자 검증 후 조회.
   * 실패/미설정(geocodeAddr → null)은 에러가 아닌 '사용 불가' 정직 안내로 표시. */
  const onAddrSearch = async (e) => {
    e.preventDefault()
    const q = addrQ.trim()
    if (!q || addrBusy) return
    setAddrBusy(true)
    setAddrHit(null)
    setAddrMiss(false)
    const r = await geocodeAddr(q)
    setAddrBusy(false)
    if (r?.available && Number.isFinite(r.lat) && Number.isFinite(r.lng)) {
      setForm((f) => ({ ...f, lat: r.lat.toFixed(5), lon: r.lng.toFixed(5) }))
      setAddrHit({ matched: r.matched || q, matchType: r.matchType || null })
    } else {
      setAddrMiss(true)
    }
  }

  const onSearch = (e) => {
    e.preventDefault()
    const lat = parseFloat(form.lat)
    const lon = parseFloat(form.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setErr(en ? 'Enter a valid latitude (−90–90) and longitude (−180–180).' : '유효한 위도(−90~90)·경도(−180~180)를 입력해 주세요.')
      setResult(null)
      return
    }
    if (form.from && form.to && form.from > form.to) {
      setErr(en ? 'The start date must be on or before the end date.' : '시작일은 종료일보다 늦을 수 없습니다.')
      setResult(null)
      return
    }
    setErr('')
    const stations = nearestStations(lat, lon, 3)
    const grade = stations.length ? coverageGrade(stations[0].distKm) : null
    setResult({ lat, lon, stations, grade })
  }

  const reportHref = () => {
    const p = new URLSearchParams()
    if (result) {
      p.set('lat', String(result.lat))
      p.set('lon', String(result.lon))
    }
    if (form.from) p.set('from', form.from)
    if (form.to) p.set('to', form.to)
    p.set('use', form.use)
    return `/verify/report?${p.toString()}`
  }

  return (
    <VerifyShell>
      <main className="page verify-page">
        {/* ── 히어로 ─────────────────────────────── */}
        <section className="vf-hero">
          <div className="eyebrow">WEATHERFACT · 기상 사실확인</div>
          <h1>
            웨더팩트 <span className="vf-hero-en">WeatherFact</span>
          </h1>
          <p className="sub">
            {en
              ? 'Was it really raining there, then? — A weather fact-check and appraisal-support report for a specific point and period, built from observation records.'
              : '그날, 그 지점에 정말 비가 왔는가 — 특정 지점·기간의 기상 사실을 관측 기록으로 확인하는 사실확인·감정지원 리포트.'}{' '}
            <span className="vf-hero-sub-en">{en ? '기상 사실확인·감정지원 리포트' : 'Weather fact-check & appraisal support report'}</span>
          </p>
          <div className="vf-hero-badges">
            {USE_CASES.map((u) => (
              <span key={u.key} className="vf-badge">
                <LineIcon name={u.icon} size={13} />
                {en ? u.en : u.ko}
              </span>
            ))}
          </div>
        </section>

        {/* ── 조회 폼 ─────────────────────────────── */}
        <section className="vf-card vf-form-card">
          <h2 className="vf-h2">{en ? 'Look up the nearest observation stations' : '최근접 관측지점 조회'}</h2>
          <p className="vf-muted">
            {en
              ? 'Search an address or enter the coordinates of the incident point, plus the period to verify. An address is converted to coordinates — check them before looking up.'
              : '사고·분쟁 지점의 주소를 검색하거나 좌표를 직접 입력하고, 확인할 기간을 입력하세요. 주소는 좌표로 변환되므로 조회 전 값을 확인해 주세요.'}
          </p>
          <form className="vf-form" onSubmit={onAddrSearch} style={{ marginBottom: 14 }}>
            <label>
              {en ? 'Address search' : '주소 검색'}
              <span style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={addrQ}
                  onChange={(e) => setAddrQ(e.target.value)}
                  placeholder={en ? 'e.g. Sejong-daero 110, Jung-gu, Seoul' : '예: 서울 중구 세종대로 110'}
                  disabled={addrBusy}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn" disabled={addrBusy || !addrQ.trim()}>
                  {addrBusy ? (en ? 'Searching…' : '검색 중…') : en ? 'Search' : '검색'}
                </button>
              </span>
            </label>
            {addrHit && (
              <p className="vf-muted" style={{ margin: '8px 0 0' }}>
                “{addrHit.matched}”
                {addrHit.matchType ? (en ? ` (${addrHit.matchType === '지번' ? 'parcel' : 'road'} address)` : ` (${addrHit.matchType})`) : ''}{' '}
                {en
                  ? '→ converted to coordinates — verify the values below before looking up. Source: vworld geocoding, at query time.'
                  : '→ 좌표로 변환됨 — 아래 위도·경도 값을 검증 후 사용해 주세요. 출처: vworld 지오코딩, 조회 시점 기준.'}
              </p>
            )}
            {addrMiss && (
              <p className="vf-muted" style={{ margin: '8px 0 0' }}>
                {en
                  ? 'Address search is unavailable right now — please enter coordinates directly.'
                  : '주소 검색을 사용할 수 없습니다 — 좌표를 직접 입력해 주세요.'}
              </p>
            )}
          </form>
          <form className="vf-form" onSubmit={onSearch}>
            <div className="vf-form-grid">
              <label>
                {en ? 'Latitude' : '위도'}
                <input type="text" inputMode="decimal" value={form.lat} onChange={set('lat')} placeholder={en ? 'e.g. 37.5665' : '예: 37.5665'} />
              </label>
              <label>
                {en ? 'Longitude' : '경도'}
                <input type="text" inputMode="decimal" value={form.lon} onChange={set('lon')} placeholder={en ? 'e.g. 126.9780' : '예: 126.9780'} />
              </label>
              <label>
                {en ? 'From' : '기간 시작'}
                <input type="date" value={form.from} onChange={set('from')} />
              </label>
              <label>
                {en ? 'To' : '기간 종료'}
                <input type="date" value={form.to} onChange={set('to')} />
              </label>
              <label className="vf-span2">
                {en ? 'Use case' : '용도'}
                <select value={form.use} onChange={set('use')}>
                  {USE_CASES.map((u) => (
                    <option key={u.key} value={u.key}>
                      {en ? u.en : u.ko}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {selUse && (
              <div className="vf-usecase-hint">
                <span className="vf-usecase-desc">{en ? selUse.descEn : selUse.descKo}</span>
                <span className="vf-usecase-els">
                  {(en ? selUse.elementsEn : selUse.elementsKo).map((el) => (
                    <span key={el} className="vf-chip">
                      {el}
                    </span>
                  ))}
                </span>
              </div>
            )}
            <div className="vf-form-foot">
              <button type="submit" className="btn primary">
                {en ? 'Find stations' : '관측지점 조회'}
              </button>
            </div>
            {err && (
              <div className="vf-err" role="alert">
                {err}
              </div>
            )}
          </form>
        </section>

        {/* ── 조회 결과 ─────────────────────────────── */}
        {result && (
          <section className="vf-card vf-result">
            <div className="vf-result-head">
              <h2 className="vf-h2">
                {en
                  ? `Nearest stations to (${result.lat.toFixed(4)}, ${result.lon.toFixed(4)})`
                  : `(${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}) 최근접 관측지점`}
              </h2>
              {result.grade && (
                <span className={`vf-grade vf-grade-${result.grade.grade}`}>
                  {en ? 'Coverage' : '커버리지'} {result.grade.grade} · {en ? result.grade.en : result.grade.ko}
                </span>
              )}
            </div>
            <div className="vf-station-grid">
              {result.stations.map((s, i) => (
                <div key={s.id} className={`vf-station${i === 0 ? ' nearest' : ''}`}>
                  {i === 0 && <span className="vf-station-flag">{en ? 'Nearest' : '최근접'}</span>}
                  <div className="vf-station-name">
                    {en ? s.nameEn : s.name} <span className="vf-station-id">#{s.id}</span>
                  </div>
                  <dl className="vf-station-meta">
                    <div>
                      <dt>{en ? 'Distance' : '거리'}</dt>
                      <dd>{s.distKm} km</dd>
                    </div>
                    <div>
                      <dt>{en ? 'Observing since' : '관측 개시'}</dt>
                      <dd>{s.since}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
            <p className="vf-meta-note">
              {en ? 'Source: ' : '출처: '}
              {STATIONS_META.source} · {STATIONS_META.updated} — {STATIONS_META.note}
            </p>
            <div className="vf-cta-row">
              <button type="button" className="btn primary" onClick={() => navigate(reportHref())}>
                {en ? 'Preview report' : '리포트 미리보기'}
              </button>
              <button type="button" className="btn" onClick={() => setDlg(true)}>
                {en ? 'Request appraiser review' : '감정사 검수 문의'}
              </button>
            </div>
          </section>
        )}

        {/* ── 프로세스 4단계 ─────────────────────────────── */}
        <section className="vf-section">
          <h2 className="vf-h2">{en ? 'How it works' : '진행 방식'}</h2>
          <div className="vf-steps">
            {PROCESS_STEPS.map((s, i) => (
              <div key={s.ko} className="vf-card vf-step">
                <span className="vf-step-num">{String(i + 1).padStart(2, '0')}</span>
                <b>{en ? s.en : s.ko}</b>
                <p>{en ? s.descEn : s.descKo}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 요금 3티어 ─────────────────────────────── */}
        <section className="vf-section">
          <h2 className="vf-h2">{en ? 'Report tiers' : '리포트 구성'}</h2>
          <div className="vf-tier-grid">
            {PRICING_TIERS.map((tier) => (
              <div key={tier.key} className="vf-card vf-tier">
                <div className="vf-tier-name">{en ? tier.en : tier.ko}</div>
                <div className="vf-tier-price">{en ? tier.priceEn : tier.priceKo}</div>
                <ul>
                  {(en ? tier.itemsEn : tier.itemsKo).map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
                {tier.note && <p className="vf-tier-note">{tier.note}</p>}
                <button type="button" className="btn vf-tier-cta" onClick={() => setDlg(true)}>
                  {en ? 'Inquire' : '문의하기'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────── */}
        <section className="vf-section">
          <h2 className="vf-h2">FAQ</h2>
          <div className="vf-faq">
            {FAQ.map((f) => (
              <details key={f.qKo} className="vf-card vf-faq-item">
                <summary>{en ? f.qEn : f.qKo}</summary>
                <p>{en ? f.aEn : f.aKo}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── 정직성 고지 ─────────────────────────────── */}
        <section className="vf-card vf-honesty">
          <h3>
            <LineIcon name="risk" size={14} /> {en ? 'Honesty notice' : '정직성 고지'}
          </h3>
          <ul>
            <li>
              <span className="vf-soon-badge">{en ? 'Data pending' : '데이터 대기'}</span>{' '}
              {en
                ? 'The live observation-data pipeline is not yet connected. Until it is, this page matches stations only — no observed values are shown, and none are fabricated.'
                : '실측 관측 데이터 파이프라인은 아직 연동 전입니다. 연동 전까지 이 페이지는 관측지점 매칭까지만 제공하며, 관측값을 표시하지 않고 지어내지도 않습니다.'}
            </li>
            <li>
              {en
                ? `Station coordinates are approximate (${STATIONS_META.source}, ${STATIONS_META.updated}). ${STATIONS_META.note}`
                : `관측지점 좌표는 근사값입니다 (${STATIONS_META.source}, ${STATIONS_META.updated}). ${STATIONS_META.note}`}
            </li>
            <li>
              {en
                ? 'Self-service previews carry no legal effect. Only an appraiser-reviewed report is intended for submission in adjusting, claims or legal proceedings.'
                : '셀프 조회 결과물은 법적 효력이 없습니다. 손해사정·클레임·소송 제출용은 감정사 검수본 기준입니다.'}
            </li>
            <li>
              {en
                ? 'Any example figures shown anywhere in this service are labeled “example (not observed)” — never presented as measurements.'
                : '서비스 내 모든 예시 수치는 “예시 (실측 아님)” 라벨과 함께 표기되며, 실측처럼 제시하지 않습니다.'}
            </li>
          </ul>
        </section>
      </main>

      <LeadDialog open={dlg} defaultType="정밀 리포트 요청" context="weatherfact" onClose={() => setDlg(false)} />
    </VerifyShell>
  )
}
