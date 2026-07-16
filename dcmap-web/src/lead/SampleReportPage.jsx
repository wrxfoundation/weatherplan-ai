import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import AcquirerNav from './AcquirerNav.jsx'
import { useMapLang, setMapLang } from '../i18n/mapLang.js'

const TITLE = '정밀 부지 리포트 — 견본 | AI InfraMap'
const DESC =
  '정밀 부지 리포트 견본(가상 부지·예시 데이터) — 계통영향평가 통과 전망, 변전소 실측 여유, 수전전압 트랙, 인허가 리드타임, 리스크. 한국어·English.'

/* 세일즈 담보물(KO/EN) — 정밀 리포트 산출물 견본. 정직성: 가상 부지 + 예시 데이터 명시, 실제 판정 아님. */
const AXES = [
  { got: 34, max: 40, ko: '전력 (계통·수전)', en: 'Power (grid·intake)', koNote: '관할 변전소 실측 여유 240MW·154kV 트랙 — 실계산', enNote: 'Substation reserve 240MW · 154kV track — computed' },
  { got: 19, max: 25, ko: '토지·부지', en: 'Land·site', koNote: '산업단지 지정용지·지목 공장용지 — 예시', enNote: 'Industrial-park zoned, factory land use — illustrative' },
  { got: 12, max: 15, ko: '리스크 (인구·갈등)', en: 'Risk (population·conflict)', koNote: '반경 1km 인구 저밀·갈등 이력 없음 — 예시', enNote: 'Low pop. density within 1km, no conflict record — illustrative' },
  { got: 6, max: 10, ko: '네트워크', en: 'Network', koNote: '백본 8~20km 요건 충족 추정 — 데이터 일부 대기', enNote: '8–20km backbone req. likely met — data partially pending' },
  { got: 7, max: 10, ko: '기상 (냉각)', en: 'Climate (cooling)', koNote: '연평균 기온·프리쿨링 일수 — 예시', enNote: 'Annual temp · free-cooling days — illustrative' },
]
const GATE = [
  { ko: '입지(수도권 억제 배점)', en: 'Location (capital-region penalty)', vKo: '비수도권 +10', vEn: 'Non-capital +10', tone: 'good' },
  { ko: '계통 공급여유', en: 'Regional grid headroom', vKo: '시도 여유 충분', tone: 'good', vEn: 'Ample provincial headroom' },
  { ko: '관할 변전소 실측 여유', en: 'Substation reserve (measured)', vKo: '240MW (154kV)', vEn: '240MW (154kV)', tone: 'good' },
  { ko: '지역 승인율(참고)', en: 'Regional approval rate (ref)', vKo: '비수도권 89.7%', vEn: 'Non-capital 89.7%', tone: 'good' },
  { ko: '필요 수전용량', en: 'Required capacity', vKo: '60MW → 154kV 의무', vEn: '60MW → 154kV mandatory', tone: 'warn' },
]
const TIMELINE = [
  { t: '0–2', ko: '사전검토·수전예정통지서 적정성', en: 'Pre-review · intake-notice validation', sKo: '착수', sEn: 'start' },
  { t: '2–7', ko: '전력계통영향평가(사전→기술→본심사)', en: 'PSIA (pre → technical → main)', sKo: '핵심 관문', sEn: 'key gate' },
  { t: '4–10', ko: '건축 인허가·개발행위(병행)', en: 'Building & development permits (parallel)', sKo: '병행', sEn: 'parallel' },
  { t: '10–14', ko: '수전계약·착공', en: 'Power contract · groundbreaking', sKo: '', sEn: '' },
  { t: '~46', ko: '준공·시운전', en: 'Completion · commissioning', sKo: '', sEn: '' },
]
const RISKS = [
  { ko: '수전(154kV)', en: 'Intake (154kV)', dKo: '60MW는 154kV 의무. 수전 설비·인입 경로·리드타임을 초기에 확정.', dEn: '60MW mandates 154kV. Fix intake equipment, route and lead time early.', tag: 'hi', tagKo: '우선', tagEn: 'priority' },
  { ko: '네트워크', en: 'Network', dKo: '백본 거리 데이터 일부 대기. 실측 검증 필요.', dEn: 'Backbone-distance data partially pending. Verify on site.', tag: 'mid', tagKo: '점검', tagEn: 'check' },
  { ko: '수용성', en: 'Acceptance', dKo: '산업단지 입지로 갈등 리스크 낮음(예시). 사전 주민 커뮤니케이션 권고.', dEn: 'Low conflict risk in industrial zone (illustrative). Early community comms advised.', tag: 'lo', tagKo: '양호', tagEn: 'ok' },
  { ko: '물리적 진부화', en: 'Physical obsolescence', dKo: '최신 GPU 수용 위해 하중 2.5톤/㎡·랙 40~50kW·액랭 설계 반영 권고.', dEn: 'For next-gen GPUs, design for 2.5t/㎡ load, 40–50kW racks, liquid cooling.', tag: 'mid', tagKo: '설계', tagEn: 'design' },
]

export default function SampleReportPage() {
  const lang = useMapLang()
  const en = lang === 'en'
  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])
  const t = (ko, enS) => (en ? enS : ko)

  return (
    <>
      <TopBar />
      <main className="page report-page">
        <AcquirerNav>
          <button type="button" className={`rlang-btn${!en ? ' on' : ''}`} onClick={() => setMapLang('ko')}>KO</button>
          <button type="button" className={`rlang-btn${en ? ' on' : ''}`} onClick={() => setMapLang('en')}>EN</button>
        </AcquirerNav>

        <div className="report-flag" role="note">
          <b>{t('견본(SAMPLE)', 'SAMPLE')}</b> ·{' '}
          {t('가상 부지 · 예시 데이터입니다. 실제 부지 판정이 아니며, 수치는 산출물 형식을 보여주기 위한 예시입니다. 내 부지로 받으려면 ',
            'Hypothetical site · illustrative data. Not a real assessment — figures show the deliverable format. For your site, ')}
          <Link to="/pricing">{t('정밀 리포트 요청', 'request a report')}</Link>.
        </div>

        <header className="report-head">
          <div className="eyebrow">{t('정밀 부지 리포트 · SAMPLE', 'SITE DUE-DILIGENCE REPORT · SAMPLE')}</div>
          <h1>{t('○○ 산업단지 내 데이터센터 부지 — 계통·인허가 정밀 진단', 'Datacenter site in ○○ industrial park — grid & permitting due diligence')}</h1>
          <div className="report-meta">
            <span>{t('검토 용량', 'Capacity')} <b>60MW</b> (IT 40MW)</span>
            <span>{t('수전전압', 'Voltage')} <b>154kV</b></span>
            <span>{t('발행', 'Issued')} <b>{t('예시', 'sample')}</b></span>
            <span>{t('등급', 'Grade')} <b className="grade-a">{t('유망(A−)', 'Promising (A−)')}</b></span>
          </div>
        </header>

        <section className="report-sec">
          <h2>1 · {t('종합 판정', 'Verdict')}</h2>
          <div className="report-verdict">
            <div className="rv-score">
              <span className="rv-num">78<small>/100</small></span>
              <span className="rv-cov">{t('근거 확보 커버리지 82%', 'Evidence coverage 82%')}</span>
            </div>
            <p className="rv-text">
              {t('비수도권 산업단지 입지로 수도권 억제 배점을 피하고, 관할 변전소 실측 여유(예시 240MW)가 충분해 계통영향평가 통과 전망이 우호적입니다. 다만 60MW는 154kV 수전 의무 구간이라 수전 설비·리드타임을 초기에 확정해야 합니다. 네트워크 백본 거리는 일부 데이터 대기 — 실측 검증 권고.',
                'A non-capital industrial-park location avoids the capital-region penalty, and substation reserve (240MW, illustrative) is ample — so the PSIA pass outlook is favorable. At 60MW the site mandates 154kV intake, so fix intake equipment and lead time early. Backbone distance is partly pending — verify on site.')}
            </p>
          </div>
        </section>

        <section className="report-sec">
          <h2>2 · {t('계통영향평가 통과 전망', 'PSIA pass outlook')}</h2>
          <p className="report-sub">{t('5요소 가중 스코어카드 — 각 항목은 공개 근거로 산출(예시).', 'Weighted 5-factor scorecard — each from public proxies (illustrative).')}</p>
          <div className="gate-scorecard">
            {GATE.map((g) => (
              <div key={g.ko} className={`gsc-row gsc-${g.tone}`}>
                <span className="gsc-label">{t(g.ko, g.en)}</span>
                <span className="gsc-val">{t(g.vKo, g.vEn)}</span>
              </div>
            ))}
          </div>
          <p className="report-note">{t('판정은 확률적 전망이며 확정이 아닙니다. 실제 심사 결과·모수와 시점에 따라 달라질 수 있어, 근거와 불확실성을 함께 표기합니다.',
            'This is a probabilistic outlook, not a decision. It varies with actual review results, sample and timing — so evidence and uncertainty are shown together.')}</p>
        </section>

        <section className="report-sec">
          <h2>3 · {t('5축 스코어 상세', '5-axis score detail')}</h2>
          <div className="report-axes">
            {AXES.map((a) => (
              <div key={a.ko} className="rax-row">
                <span className="rax-label">{t(a.ko, a.en)}</span>
                <span className="rax-track">
                  <span className="rax-fill" style={{ width: `${(a.got / a.max) * 100}%` }} />
                </span>
                <span className="rax-val">{a.got}<small>/{a.max}</small></span>
                <span className="rax-note">{t(a.koNote, a.enNote)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="report-sec">
          <h2>4 · {t('인허가 리드타임', 'Permitting lead time')}</h2>
          <ol className="report-timeline">
            {TIMELINE.map((x) => (
              <li key={x.t}>
                <span className="rt-t">{x.t}{t('개월', ' mo')}</span>
                <span className="rt-k">{t(x.ko, x.en)}</span>
                {(en ? x.sEn : x.sKo) && <span className="rt-s">{t(x.sKo, x.sEn)}</span>}
              </li>
            ))}
          </ol>
          <p className="report-note">{t('순서·기간은 표준 절차 기준 예시. 지자체·계통 상황에 따라 병행·지연 가능.', 'Order/durations are standard-process illustrative; parallelism and delays vary by locality and grid.')}</p>
        </section>

        <section className="report-sec">
          <h2>5 · {t('리스크 · 권고', 'Risks · recommendations')}</h2>
          <ul className="report-risks">
            {RISKS.map((r) => (
              <li key={r.ko}>
                <b>{t(r.ko, r.en)}</b> — {t(r.dKo, r.dEn)} <span className={`rk-${r.tag}`}>{t(r.tagKo, r.tagEn)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="report-cta">
          <h2>{t('이 리포트를, 당신의 실제 부지로.', 'This report — for your actual site.')}</h2>
          <p>{t('검토 중인 부지 1곳을 무료로 진단해 드립니다. 계통 통과 여부를 애널리스트 2주 대신 정밀 리포트로 — 잘못된 부지를 먼저 파는 비용은 조 단위입니다.',
            'We’ll diagnose one candidate site free. Grid-pass verdict in a report instead of two analyst-weeks — the cost of digging the wrong site first is measured in trillions of won.')}</p>
          <div className="report-cta-row">
            <Link className="btn primary" to="/pricing">{t('무료 부지 진단 신청', 'Free site diagnosis')}</Link>
            <Link className="btn" to="/global">{t('글로벌 파트너 소개', 'For partners (EN)')}</Link>
            <Link className="btn" to="/insights/build-reality-2026">{t('사업 5관문 보기', 'The 5 gates')}</Link>
          </div>
        </section>
      </main>
    </>
  )
}
