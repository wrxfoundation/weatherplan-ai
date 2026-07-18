import { Link, useSearchParams } from 'react-router-dom'
import VerifyShell from './VerifyShell.jsx'
import LineIcon from '../components/LineIcon.jsx'
import { useMapLang } from '../i18n/mapLang.js'
import { STATIONS_META } from './stationsData.js'
import { nearestStations, coverageGrade, USE_CASES } from './verifyEngine.js'
import './verify.css'

/* 웨더팩트 증빙 리포트 '초안' — /verify/report?lat=..&lon=..&from=..&to=..&use=..
 * 프린트 친화(A4 감각) 문서 렌더. 정직성 원칙:
 *  - 실데이터 미연동 → 기상 데이터 섹션은 '데이터 대기' 상태 블록 + 값 칸 '—' 스켈레톤
 *  - 예시 표는 접힌 <details> 안에서만, "예시 데이터 — 실측 아님" 라벨과 함께
 *  - 감정사 검수 전 초안 — 법적 효력 없음 워터마크성 배지 상시 노출 */

/* 리포트 전용 스타일 — verify.css 토큰 위에 문서(A4)·프린트 오버라이드만 추가 */
const REPORT_CSS = `
.vr-doc {
  max-width: 820px; /* A4 감각의 문서 폭 */
  margin: 0 auto;
}
.vr-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.vr-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--grey);
  font-size: var(--text-sm);
  text-decoration: none;
}
.vr-back:hover { color: var(--accent); }

/* 표지 */
.vr-cover { position: relative; padding: 26px 26px 22px; }
.vr-cover h1 {
  font-size: var(--text-h1);
  font-weight: var(--weight-bold);
  line-height: var(--lh-tight);
  margin: 8px 0 4px;
}
.vr-cover .vr-sub-en { color: var(--grey); font-size: var(--text-sm); margin: 0 0 16px; }
.vr-draft-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px dashed color-mix(in srgb, var(--orange) 55%, var(--line));
  color: var(--orange);
  background: color-mix(in srgb, var(--orange) 10%, transparent);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: 0.02em;
}
.vr-cover-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 22px;
  margin: 0;
}
.vr-cover-grid > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
}
.vr-cover-grid dt { color: var(--grey); font-size: var(--text-sm); }
.vr-cover-grid dd { margin: 0; font-size: var(--text-sm); font-weight: var(--weight-medium); text-align: right; }

/* 섹션 */
.vr-sec { margin-top: 26px; padding: 20px 24px; }
.vr-sec-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
}
.vr-sec-num {
  font-family: var(--font-latin), var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  color: var(--accent);
  letter-spacing: 0.08em;
}
.vr-sec h2 { font-size: var(--text-title); font-weight: var(--weight-bold); margin: 0; }
.vr-sec .vf-muted { margin-bottom: 12px; }

/* 표 */
.vr-table-wrap { overflow-x: auto; }
.vr-table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.vr-table th, .vr-table td {
  padding: 8px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
  text-align: left;
  white-space: nowrap;
}
.vr-table th { color: var(--grey); font-weight: var(--weight-medium); font-size: var(--text-xs); }
.vr-table td.vr-num { font-family: var(--font-latin), var(--font-sans); }
.vr-table td.vr-pending { color: var(--grey); text-align: center; }
.vr-grade-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

/* 데이터 대기 블록 */
.vr-wait {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 18px;
  margin-bottom: 14px;
  border-radius: var(--radius-md);
  border: 1px dashed color-mix(in srgb, var(--orange) 45%, var(--line));
  background: color-mix(in srgb, var(--orange) 7%, transparent);
}
.vr-wait .lni { color: var(--orange); flex: none; margin-top: 2px; }
.vr-wait b { font-size: var(--text-body); color: var(--orange); }
.vr-wait p { margin: 4px 0 0; font-size: var(--text-sm); color: var(--grey); line-height: var(--lh-base); }

/* 예시 미리보기 */
.vr-demo { margin-top: 14px; border: 1px solid var(--line); border-radius: var(--radius-md); overflow: hidden; }
.vr-demo summary {
  cursor: pointer;
  list-style: none;
  padding: 11px 14px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--grey);
}
.vr-demo summary::-webkit-details-marker { display: none; }
.vr-demo[open] summary { color: var(--accent); border-bottom: 1px solid color-mix(in srgb, var(--line) 70%, transparent); }
.vr-demo-body { padding: 12px 14px; }
.vr-demo-label {
  display: inline-block;
  padding: 2px 9px;
  margin-bottom: 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--orange) 45%, var(--line));
  color: var(--orange);
  background: color-mix(in srgb, var(--orange) 10%, transparent);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}

/* 방법론·고지 본문 */
.vr-prose { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 8px; }
.vr-prose li { font-size: var(--text-sm); color: var(--grey); line-height: var(--lh-base); }
.vr-prose li b { color: var(--text); }
.vr-src { margin: 12px 0 0; font-size: var(--text-xs); color: var(--grey); line-height: var(--lh-base); }

/* 파라미터 누락 안내 */
.vr-missing { max-width: 560px; margin: 60px auto 0; text-align: center; padding: 30px 26px; }
.vr-missing h1 { font-size: var(--text-title); margin: 10px 0 8px; }
.vr-missing p { color: var(--grey); font-size: var(--text-sm); line-height: var(--lh-base); margin: 0 0 18px; }

@media (max-width: 640px) {
  .vr-cover-grid { grid-template-columns: 1fr; }
}

/* ── 프린트(A4) ── 다크 화면 테마 → 백지 문서로 반전, 크롬 요소 제거 */
@media print {
  .topbar, .vr-noprint, footer { display: none !important; }
  body, .verify-page.vr-page { background: #fff !important; color: #111 !important; }
  .verify-page.vr-page {
    --text: #111;
    --grey: #444;
    --accent: #1d2f6f; /* 남색 — 프린트 잉크 */
    --accent-deep: #1d2f6f;
    --orange: #8a4b00;
    --line: #bbb;
    --glass-border: #bbb;
    --glass-surface: transparent;
    --glass-surface-strong: transparent;
    --glass-specular: none;
    --glass-specular-soft: none;
    --elev-2: none;
    --corner-wash: none;
    max-width: none;
    padding: 0;
  }
  .vr-doc { max-width: none; }
  .vf-card { background: #fff; box-shadow: none; background-image: none; border-color: #bbb; break-inside: avoid; }
  .vr-sec { break-inside: avoid; }
  .vr-demo { display: none; } /* 예시 데이터는 인쇄물에서 제외 — 실측 오인 방지 */
  a { color: inherit; text-decoration: none; }
}
`

/* 데모 표 — 예시 데이터(실측 아님). 실관측처럼 보이지 않도록 날짜는 '예시일', 비고에 라벨 반복 */
const DEMO_ROWS = [
  { d: '예시일 1', dEn: 'Sample day 1', rain: '42.5', gust: '18.3', note: '예시값' },
  { d: '예시일 2', dEn: 'Sample day 2', rain: '87.0', gust: '24.1', note: '예시값' },
  { d: '예시일 3', dEn: 'Sample day 3', rain: '3.5', gust: '9.8', note: '예시값' },
]

export default function VerifyReportPage() {
  const [sp] = useSearchParams()
  const en = useMapLang() === 'en'

  const lat = parseFloat(sp.get('lat'))
  const lon = parseFloat(sp.get('lon'))
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const useKey = sp.get('use') || ''
  const useCase = USE_CASES.find((u) => u.key === useKey) || null

  const valid =
    Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && !!from && !!to && !!useCase

  const issued = new Date()
  const issuedStr = issued.toLocaleDateString(en ? 'en-US' : 'ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })

  /* 파라미터 누락·비정상 → 안내 후 /verify로 */
  if (!valid) {
    return (
      <>
        <style>{REPORT_CSS}</style>
        <VerifyShell>
        <main className="page verify-page vr-page">
          <div className="vf-card vr-missing">
            <LineIcon name="risk" size={22} />
            <h1>{en ? 'Report parameters are missing' : '리포트 파라미터가 없습니다'}</h1>
            <p>
              {en
                ? 'This page renders a draft report for a specific point, period and use case. Coordinates (lat, lon), a period (from, to) and a use case (use) are all required — start from the WeatherFact lookup.'
                : '이 페이지는 특정 좌표·기간·용도의 리포트 초안을 렌더합니다. 좌표(lat·lon)·기간(from·to)·용도(use)가 모두 필요합니다 — 웨더팩트 조회 화면에서 시작해 주세요.'}
            </p>
            <Link className="btn primary" to="/verify">
              {en ? 'Go to WeatherFact lookup' : '웨더팩트 조회로 이동'}
            </Link>
          </div>
        </main>
      </VerifyShell>
      </>
    )
  }

  const stations = nearestStations(lat, lon, 3)
  const grade = stations.length ? coverageGrade(stations[0].distKm) : null
  const elements = en ? useCase.elementsEn : useCase.elementsKo
  const coord = `${lat.toFixed(4)}, ${lon.toFixed(4)}`

  return (
    <>
      <style>{REPORT_CSS}</style>
      <VerifyShell>
      <main className="page verify-page vr-page">
        <div className="vr-doc">
          {/* 툴바 — 인쇄물에서는 숨김 */}
          <div className="vr-toolbar vr-noprint">
            <Link className="vr-back" to="/verify">
              ← {en ? 'Back to WeatherFact' : '웨더팩트로 돌아가기'}
            </Link>
            <button type="button" className="btn primary" onClick={() => window.print()}>
              {en ? 'Print / save as PDF' : '인쇄 / PDF 저장'}
            </button>
          </div>

          {/* ① 표지 */}
          <section className="vf-card vr-cover">
            <span className="vr-draft-badge">
              <LineIcon name="risk" size={12} />
              {en ? 'DRAFT — before appraiser review · no legal effect' : '감정사 검수 전 초안 — 법적 효력 없음'}
            </span>
            <h1>{en ? 'Weather Fact-Check Report (Draft)' : '기상 사실확인 리포트 (초안)'}</h1>
            <p className="vr-sub-en">{en ? '기상 사실확인 리포트 · WeatherFact' : 'Weather Fact-Check Report · WeatherFact'}</p>
            <dl className="vr-cover-grid">
              <div>
                <dt>{en ? 'Target coordinates' : '대상 좌표'}</dt>
                <dd className="vr-num">{coord}</dd>
              </div>
              <div>
                <dt>{en ? 'Period' : '대상 기간'}</dt>
                <dd className="vr-num">
                  {from} ~ {to}
                </dd>
              </div>
              <div>
                <dt>{en ? 'Use case' : '용도'}</dt>
                <dd>{en ? useCase.en : useCase.ko}</dd>
              </div>
              <div>
                <dt>{en ? 'Issued' : '발행일'}</dt>
                <dd>{issuedStr}</dd>
              </div>
            </dl>
          </section>

          {/* ② 관측 근거 */}
          <section className="vf-card vr-sec">
            <div className="vr-sec-head">
              <span className="vr-sec-num">01</span>
              <h2>{en ? 'Observation Basis — Nearest Stations' : '관측 근거 — 최근접 관측지점'}</h2>
            </div>
            <p className="vf-muted">
              {en
                ? 'The three KMA ASOS stations nearest to the target point, by haversine distance. Observations in this report are anchored to these stations, not to the point itself.'
                : '대상 지점에서 하버사인 거리 기준 최근접 기상청 ASOS 관측지점 3곳. 본 리포트의 관측값은 대상 지점이 아닌 이 지점들의 기록에 근거합니다.'}
            </p>
            <div className="vr-table-wrap">
              <table className="vr-table">
                <thead>
                  <tr>
                    <th>{en ? 'Station no.' : '지점번호'}</th>
                    <th>{en ? 'Station' : '지점명'}</th>
                    <th>{en ? 'Distance (km)' : '거리 (km)'}</th>
                    <th>{en ? 'Obs. since' : '관측개시'}</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((s, i) => (
                    <tr key={s.id}>
                      <td className="vr-num">{s.id}</td>
                      <td>
                        {en ? s.nameEn : s.name}
                        {i === 0 && <span className="vf-chip" style={{ marginLeft: 8 }}>{en ? 'nearest' : '최근접'}</span>}
                      </td>
                      <td className="vr-num">{s.distKm.toFixed(1)}</td>
                      <td className="vr-num">{s.since}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {grade && (
              <div className="vr-grade-row">
                <span className={`vf-grade vf-grade-${grade.grade}`}>
                  {en ? 'Coverage' : '커버리지'} {grade.grade}
                </span>
                <span className="vf-muted" style={{ margin: 0 }}>
                  {en ? grade.en : grade.ko}
                </span>
              </div>
            )}
            <p className="vr-src">
              {en ? 'Station metadata: ' : '지점 메타데이터: '}
              {STATIONS_META.source} · {STATIONS_META.note} ({en ? 'updated' : '기준'} {STATIONS_META.updated})
            </p>
          </section>

          {/* ③ 기상 데이터 — 데이터 대기 */}
          <section className="vf-card vr-sec">
            <div className="vr-sec-head">
              <span className="vr-sec-num">02</span>
              <h2>{en ? 'Weather Data for the Period' : '대상 기간 기상 데이터'}</h2>
            </div>
            <div className="vr-wait" role="status">
              <LineIcon name="risk" size={18} />
              <div>
                <b>{en ? 'Data pending — observation pipeline not yet connected' : '데이터 대기 — 관측자료 파이프라인 미연동'}</b>
                <p>
                  {en
                    ? 'Live retrieval of KMA observation records is not yet wired into this service. The table below shows only the elements that will be included for this use case; no observed values are displayed. Values will be filled from official station records once the pipeline is connected.'
                    : '기상청 관측 기록의 실시간 조회는 아직 본 서비스에 연동되지 않았습니다. 아래 표는 이 용도에서 수록될 항목만 보여주며, 관측값은 표시하지 않습니다. 파이프라인 연동 후 공식 지점 기록으로 채워집니다.'}
                </p>
              </div>
            </div>
            <p className="vf-muted">
              {en
                ? `Elements to be included — ${useCase.en}: `
                : `수록 예정 항목 — ${useCase.ko}: `}
              {en ? useCase.descEn : useCase.descKo}
            </p>
            <div className="vr-table-wrap">
              <table className="vr-table">
                <thead>
                  <tr>
                    <th>{en ? 'Element' : '항목'}</th>
                    <th>{en ? 'Observed value' : '관측값'}</th>
                    <th>{en ? 'Source station' : '출처 지점'}</th>
                    <th>{en ? 'Status' : '상태'}</th>
                  </tr>
                </thead>
                <tbody>
                  {elements.map((el) => (
                    <tr key={el}>
                      <td style={{ whiteSpace: 'normal' }}>{el}</td>
                      <td className="vr-pending">—</td>
                      <td className="vr-pending">—</td>
                      <td>
                        <span className="vf-soon-badge">{en ? 'Data pending' : '데이터 대기'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details className="vr-demo vr-noprint">
              <summary>{en ? 'Sample report preview (sample data — not observed)' : '예시 리포트 미리보기 (예시 데이터 — 실측 아님)'}</summary>
              <div className="vr-demo-body">
                <span className="vr-demo-label">{en ? 'SAMPLE DATA — NOT OBSERVED' : '예시 데이터 — 실측 아님'}</span>
                <p className="vf-muted">
                  {en
                    ? 'Illustration of the final report layout only. Every value below is fabricated for demonstration and must not be cited.'
                    : '완성 리포트의 표 형식을 보여주기 위한 예시일 뿐입니다. 아래 모든 수치는 시연용으로 만든 값이며 인용해서는 안 됩니다.'}
                </p>
                <div className="vr-table-wrap">
                  <table className="vr-table">
                    <thead>
                      <tr>
                        <th>{en ? 'Date' : '날짜'}</th>
                        <th>{en ? 'Daily precip. (mm)' : '일 강수량 (mm)'}</th>
                        <th>{en ? 'Max inst. wind (m/s)' : '최대순간풍속 (m/s)'}</th>
                        <th>{en ? 'Note' : '비고'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_ROWS.map((r) => (
                        <tr key={r.d}>
                          <td>{en ? r.dEn : r.d}</td>
                          <td className="vr-num">{r.rain}</td>
                          <td className="vr-num">{r.gust}</td>
                          <td>{en ? 'sample value (not observed)' : '예시값 (실측 아님)'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </section>

          {/* ④ 방법론 */}
          <section className="vf-card vr-sec">
            <div className="vr-sec-head">
              <span className="vr-sec-num">03</span>
              <h2>{en ? 'Methodology' : '방법론'}</h2>
            </div>
            <ul className="vr-prose">
              <li>
                <b>{en ? 'Station selection.' : '관측지점 선정.'}</b>{' '}
                {en
                  ? 'Candidate stations are drawn from the KMA ASOS network. The k nearest stations to the target point are selected and all of them are cited — never a single station in isolation.'
                  : '후보 지점은 기상청 ASOS 관측망에서 취합니다. 대상 지점 최근접 k개 지점을 선정하며, 단일 지점이 아닌 복수 지점을 함께 인용합니다.'}
              </li>
              <li>
                <b>{en ? 'Distance calculation.' : '거리 계산.'}</b>{' '}
                {en
                  ? 'Great-circle (haversine) distance on a spherical Earth (R = 6,371 km), rounded to 0.1 km. Station coordinates are approximate pending pipeline verification, so distances are treated as approximate.'
                  : '구면 지구(R = 6,371km) 기준 대권(하버사인) 거리를 0.1km 단위로 반올림합니다. 지점 좌표는 파이프라인 검증 전 근사값이므로 거리 역시 근사치로 취급합니다.'}
              </li>
              <li>
                <b>{en ? 'Interpolation principle.' : '보간 원칙.'}</b>{' '}
                {en
                  ? 'The target point itself is not an observation site. Weather at the point is never asserted from a single station; adjacent stations are presented side by side, and where they disagree the discrepancy is stated rather than averaged away. Localized phenomena (convective rain, terrain effects) may differ from all cited stations — this is stated, not hidden.'
                  : '대상 지점 자체는 관측지점이 아닙니다. 지점의 기상을 단일 관측지점만으로 단정하지 않으며, 인접 지점 관측값을 병기합니다. 지점 간 값이 다를 경우 평균으로 뭉개지 않고 차이를 그대로 기술합니다. 국지 현상(대류성 강수·지형 효과)은 인용 지점 모두와 다를 수 있으며, 이 가능성을 명시합니다.'}
              </li>
              <li>
                <b>{en ? 'Coverage grade.' : '커버리지 등급.'}</b>{' '}
                {en
                  ? 'Grades A–D reflect only the distance to the nearest station (A < 5 km, B < 15 km, C < 30 km, D beyond) as a rough proxy for representativeness. The grade has no bearing on the legal standing of the underlying observations.'
                  : '등급 A~D는 최근접 지점 거리(A 5km 미만, B 15km 미만, C 30km 미만, D 그 이상)만 반영한 대표성의 근사 지표입니다. 등급은 원 관측값의 법적 지위와 무관합니다.'}
              </li>
            </ul>
          </section>

          {/* ⑤ 한계·고지 */}
          <section className="vf-card vr-sec">
            <div className="vr-sec-head">
              <span className="vr-sec-num">04</span>
              <h2>{en ? 'Limitations & Notices' : '한계·고지'}</h2>
            </div>
            <ul className="vr-prose">
              <li>
                <b>{en ? 'This is a draft.' : '본 문서는 초안입니다.'}</b>{' '}
                {en
                  ? 'It is generated automatically before appraiser review and carries no legal effect. It must not be submitted as evidence in adjusting, claims, litigation or arbitration in its current form.'
                  : '감정사 검수 전에 자동 생성된 문서로, 법적 효력이 없습니다. 현재 상태로는 손해사정·클레임·소송·중재에 증빙으로 제출할 수 없습니다.'}
              </li>
              <li>
                <b>{en ? 'Data not yet connected.' : '실데이터 미연동.'}</b>{' '}
                {en
                  ? 'Observed values are not yet retrieved; all value cells are intentionally blank ("data pending"). No number in this draft is a measurement.'
                  : '관측값 조회가 아직 연동되지 않아 모든 값 칸은 의도적으로 비워져 있습니다("데이터 대기"). 본 초안의 어떤 숫자도 실측값이 아닙니다.'}
              </li>
              <li>
                <b>{en ? 'Appraiser review procedure.' : '감정사 검수 절차.'}</b>{' '}
                {en
                  ? 'For a report intended for submission, a qualified appraiser cross-checks station selection, period, element definitions and the official record, then signs off. Request review from the WeatherFact page — the reviewed edition replaces this draft.'
                  : '제출용 리포트는 감정사가 지점 선정·기간·항목 정의·공식 기록 대조를 검수하고 서명한 뒤 발행됩니다. 검수는 웨더팩트 페이지에서 요청할 수 있으며, 검수본이 본 초안을 대체합니다.'}
              </li>
              <li>
                <b>{en ? 'Station representativeness.' : '지점 대표성.'}</b>{' '}
                {en
                  ? 'All values (once connected) are station observations, not point measurements at the target coordinates. Distance and coverage grade above quantify this gap.'
                  : '(연동 후에도) 모든 값은 관측지점의 기록이며 대상 좌표에서의 직접 측정값이 아닙니다. 위의 거리·커버리지 등급이 그 간극을 정량화합니다.'}
              </li>
            </ul>
            <p className="vr-src">
              {en ? 'Sources: ' : '출처: '}
              {en
                ? 'KMA (Korea Meteorological Administration) station observation records · KWeather'
                : '기상청 관측자료 · 케이웨더'}{' '}
              · {en ? 'station metadata as of' : '지점 메타데이터 기준'} {STATIONS_META.updated} · {en ? 'draft issued' : '초안 발행'}{' '}
              {issuedStr}
            </p>
          </section>

          <div className="vr-toolbar vr-noprint" style={{ marginTop: 22 }}>
            <Link className="vr-back" to="/verify">
              ← {en ? 'Back to WeatherFact' : '웨더팩트로 돌아가기'}
            </Link>
            <button type="button" className="btn" onClick={() => window.print()}>
              {en ? 'Print / save as PDF' : '인쇄 / PDF 저장'}
            </button>
          </div>
        </div>
      </main>
    </VerifyShell>
    </>
  )
}
