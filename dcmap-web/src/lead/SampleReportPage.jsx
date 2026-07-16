import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'

const TITLE = '정밀 부지 리포트 — 견본 | AI InfraMap'
const DESC =
  '정밀 부지 리포트 견본 — 계통영향평가 통과 전망, 변전소 실측 여유, 수전전압 트랙, 인허가 리드타임, 리스크를 한 부에 담은 임원용 산출물 예시(가상 부지·예시 데이터).'

/* 세일즈 담보물 — 정밀 리포트가 실제로 어떤 산출물인지 보여주는 견본.
 * 정직성: 가상 부지 + 예시 데이터임을 상단 배너·각 수치 옆에 명시. 실제 판정 아님. */
const AXES = [
  { key: '전력', label: '전력 (계통·수전)', got: 34, max: 40, note: '관할 변전소 실측 여유 240MW·154kV 트랙 — 실계산' },
  { key: '토지', label: '토지·부지', got: 19, max: 25, note: '산업단지 지정용지·지목 공장용지 — 예시' },
  { key: '리스크', label: '리스크 (인구·갈등)', got: 12, max: 15, note: '반경 1km 인구 저밀·갈등 이력 없음 — 예시' },
  { key: '네트워크', label: '네트워크', got: 6, max: 10, note: '백본 8~20km 요건 충족 추정 — 데이터 일부 대기' },
  { key: '기상', label: '기상 (냉각)', got: 7, max: 10, note: '연평균 기온·프리쿨링 일수 — 예시' },
]
const GATE = [
  { label: '입지(수도권 억제 배점)', v: '비수도권 +10', tone: 'good' },
  { label: '계통 공급여유', v: '시도 여유 충분', tone: 'good' },
  { label: '관할 변전소 실측 여유', v: '240MW (154kV)', tone: 'good' },
  { label: '지역 승인율(참고)', v: '비수도권 89.7%', tone: 'good' },
  { label: '필요 수전용량', v: '60MW → 154kV 의무', tone: 'warn' },
]
const TIMELINE = [
  { t: '0–2개월', k: '사전검토·수전예정통지서 적정성', s: '착수' },
  { t: '2–7개월', k: '전력계통영향평가(사전→기술→본심사)', s: '핵심 관문' },
  { t: '4–10개월', k: '건축 인허가·개발행위(병행)', s: '병행' },
  { t: '10–14개월', k: '수전계약·착공', s: '' },
  { t: '~46개월', k: '준공·시운전', s: '' },
]

export default function SampleReportPage() {
  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  return (
    <>
      <TopBar />
      <main className="page report-page">
        <div className="report-flag" role="note">
          <b>견본(SAMPLE)</b> · 가상 부지 · 예시 데이터입니다. 실제 부지 판정이 아니며, 수치는 산출물 형식을
          보여주기 위한 예시입니다. 내 부지로 받으려면{' '}
          <Link to="/pricing">정밀 리포트 요청</Link>.
        </div>

        <header className="report-head">
          <div className="eyebrow">정밀 부지 리포트 · SAMPLE</div>
          <h1>○○ 산업단지 내 데이터센터 부지 — 계통·인허가 정밀 진단</h1>
          <div className="report-meta">
            <span>검토 용량 <b>60MW</b> (IT 40MW급)</span>
            <span>수전전압 <b>154kV</b></span>
            <span>발행 <b>예시</b></span>
            <span>등급 <b className="grade-a">유망(A−)</b></span>
          </div>
        </header>

        <section className="report-sec">
          <h2>1 · 종합 판정</h2>
          <div className="report-verdict">
            <div className="rv-score">
              <span className="rv-num">78<small>/100</small></span>
              <span className="rv-cov">근거 확보 커버리지 82%</span>
            </div>
            <p className="rv-text">
              비수도권 산업단지 입지로 <b>수도권 억제 배점을 피하고</b>, 관할 변전소 실측 여유(예시 240MW)가 충분해{' '}
              <b>계통영향평가 통과 전망이 우호적</b>입니다. 다만 60MW는 <b>154kV 수전 의무</b> 구간이라 수전 설비·
              리드타임을 초기에 확정해야 합니다. 네트워크 백본 거리는 일부 데이터 대기 — 실측 검증 권고.
            </p>
          </div>
        </section>

        <section className="report-sec">
          <h2>2 · 계통영향평가 통과 전망</h2>
          <p className="report-sub">5요소 가중 스코어카드 — 각 항목은 공개 근거로 산출(예시).</p>
          <div className="gate-scorecard">
            {GATE.map((g) => (
              <div key={g.label} className={`gsc-row gsc-${g.tone}`}>
                <span className="gsc-label">{g.label}</span>
                <span className="gsc-val">{g.v}</span>
              </div>
            ))}
          </div>
          <p className="report-note">
            판정은 확률적 전망이며 확정이 아닙니다. 실제 심사 결과·모수와 시점에 따라 달라질 수 있어, 근거와
            불확실성을 함께 표기합니다.
          </p>
        </section>

        <section className="report-sec">
          <h2>3 · 5축 스코어 상세</h2>
          <div className="report-axes">
            {AXES.map((a) => (
              <div key={a.key} className="rax-row">
                <span className="rax-label">{a.label}</span>
                <span className="rax-track">
                  <span className="rax-fill" style={{ width: `${(a.got / a.max) * 100}%` }} />
                </span>
                <span className="rax-val">{a.got}<small>/{a.max}</small></span>
                <span className="rax-note">{a.note}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="report-sec">
          <h2>4 · 인허가 리드타임</h2>
          <ol className="report-timeline">
            {TIMELINE.map((t) => (
              <li key={t.t}>
                <span className="rt-t">{t.t}</span>
                <span className="rt-k">{t.k}</span>
                {t.s && <span className="rt-s">{t.s}</span>}
              </li>
            ))}
          </ol>
          <p className="report-note">순서·기간은 표준 절차 기준 예시. 지자체·계통 상황에 따라 병행·지연 가능.</p>
        </section>

        <section className="report-sec">
          <h2>5 · 리스크 · 권고</h2>
          <ul className="report-risks">
            <li><b>수전(154kV)</b> — 60MW는 154kV 의무. 수전 설비·인입 경로·리드타임을 초기에 확정. <span className="rk-hi">우선</span></li>
            <li><b>네트워크</b> — 백본 거리 데이터 일부 대기. 실측 검증 필요. <span className="rk-mid">점검</span></li>
            <li><b>수용성</b> — 산업단지 입지로 갈등 리스크 낮음(예시). 사전 주민 커뮤니케이션 권고. <span className="rk-lo">양호</span></li>
            <li><b>물리적 진부화</b> — 최신 GPU 수용 위해 하중 2.5톤/㎡·랙 40~50kW·액랭 설계 반영 권고. <span className="rk-mid">설계</span></li>
          </ul>
        </section>

        <section className="report-cta">
          <h2>이 리포트를, 당신의 실제 부지로.</h2>
          <p>
            검토 중인 부지 1곳을 무료로 진단해 드립니다. 계통 통과 여부를 애널리스트 2주 대신 정밀 리포트로 —
            잘못된 부지를 먼저 파는 비용은 조 단위입니다.
          </p>
          <div className="report-cta-row">
            <Link className="btn primary" to="/pricing">무료 부지 진단 신청</Link>
            <Link className="btn" to="/">맵에서 지점 클릭</Link>
            <Link className="btn" to="/insights/build-reality-2026">사업 5관문 보기</Link>
          </div>
        </section>
      </main>
    </>
  )
}
