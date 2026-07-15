import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import LineIcon from '../components/LineIcon.jsx'
import { FACILITIES } from '../data/facilities.js'
import { GLOSSARY } from '../content/glossary.js'
import { PROCESS_NODES } from '../content/processOntology.js'

const TITLE = '서비스 소개 — AI InfraMap'
const DESC =
  'AI 데이터센터 부지 인텔리전스. 전국 시설·전력계통·인허가를 한 장의 지도로 — 임의 지점 5축 스코어, 계통영향평가 통과 전망, GPU→전력 계산기, 법령 원문 인용 AI 브리프. 공개 데이터만, 정직한 커버리지로.'

/* 시장 페인 수치 — 로드맵 P07·P08과 동일한 공개 근거 문자열을 재사용(수치 단일 출처 유지) */
const PAINS = [
  {
    num: '53.4%',
    title: '수도권 공급불가 판정',
    desc: '수도권 DC 1차 기술검토 522건 중 53.4%가 “전력 공급 불가” — 전국 공급불가의 91%가 수도권(’25.8–’26.3, 기후부 공표).',
  },
  {
    num: '1.9%',
    title: '수도권 신청 대비 최종 통과',
    desc: '본심사 통과는 수도권 10/24건 — 신청(522건) 대비 1.9%. 비수도권 본심사 통과율은 89.7%(26/29).',
  },
  {
    num: '1–1.5억',
    title: '평가 대행비 / 10MW',
    desc: '계통영향평가 대행 수수료는 10MW당 약 1–1.5억 원(국정감사 지적) + 심의 리드타임.',
  },
]

/* wow 포인트 — 실제로 지금 동작하는 기능만(예정 기능은 '예정' 명시 없이는 싣지 않음) */
const WOWS = [
  {
    num: '01',
    icon: 'target',
    title: '지도 아무 곳이나 클릭 → 5축 부지 스코어',
    desc: '전력·토지·리스크·네트워크·기상 5축으로 즉시 스코어링. 근거가 확보된 항목만 점수화하고, 나머지는 점수를 지어내는 대신 “데이터 대기”로 표시합니다.',
    links: [{ label: '맵에서 클릭해 보기', to: '/' }],
  },
  {
    num: '02',
    icon: 'power',
    title: '계통영향평가 통과 전망 + AIDC 특별법 시나리오',
    desc: '입지·계통 여유·승인율·변전소·용량 5요소 가중 스코어카드로 심의 통과 전망을 제시하고, AIDC 특별법 면제 상한(대통령령 미정)을 슬라이더로 시뮬레이션합니다.',
    links: [
      { label: '부지 클릭 → 전망 보기', to: '/' },
      { label: '면제 시나리오', to: '/calc' },
    ],
  },
  {
    num: '03',
    icon: 'cooling',
    title: 'GPU → 전력·비용·탄소 계산기',
    desc: 'GB200 NVL72 포함 최신 랙 기준으로 GPU 수를 MW로 환산하고, PUE·전력비·탄소배출·RE100/PPA 조달까지 시나리오 저장·비교. URL로 그대로 공유됩니다.',
    links: [{ label: 'GPU 계산기', to: '/calc' }],
  },
  {
    num: '04',
    icon: 'risk',
    title: '법령 원문을 인용하는 AI 브리프',
    desc: 'Claude가 부지 브리프·Q&A·비교평을 생성하되, 국가법령정보센터(law.go.kr) 원문을 확보했을 때만 조문을 인용하고 출처 링크를 답니다. 원문이 없으면 인용하지 않습니다.',
    links: [{ label: '맵에서 AI 열기', to: '/' }],
  },
  {
    num: '05',
    icon: 'site',
    title: `전국 ${FACILITIES.length}개 시설 — 전수 검증 데이터`,
    desc: '운영·건설·계획 시설의 주소를 전수 조사해 필지 단위로 지오코딩했고, 모든 수치에 출처와 갱신일을 답니다. 위치 정밀도가 낮으면 낮다고 표시합니다.',
    links: [
      { label: '데이터 탐색기', to: '/data' },
      { label: '통계', to: '/stats' },
    ],
  },
  {
    num: '06',
    icon: 'arrowUR',
    title: `인허가 로드맵 ${PROCESS_NODES.length}단계 + 온톨로지 맵`,
    desc: `부지 검토부터 운영까지 절차를 병목·분기점·서류·리드타임 단위로 분해하고, 용어 ${GLOSSARY.length}개·법령·절차를 3층 온톨로지 맵으로 연결했습니다.`,
    links: [
      { label: '인허가 로드맵', to: '/roadmap' },
      { label: '온톨로지 맵', to: '/glossary' },
    ],
  },
]

const STEPS = [
  { n: '1', title: '검색하거나 클릭', desc: '주소를 검색하거나 지도의 임의 지점을 클릭하면 그 자리가 곧 후보 부지입니다.' },
  { n: '2', title: '판정과 전망', desc: '5축 스코어, 수전전압 트랙(22.9/154/345kV), 계통영향평가 통과 전망이 한 패널에 뜹니다.' },
  { n: '3', title: '브리프와 리포트', desc: 'AI 임원 브리프·PDF로 정리하고, 더 깊은 검토가 필요하면 정밀 리포트를 요청하세요.' },
]

/* 실제 코드가 호출·집계에 사용하는 공개 소스만 나열(장식용 로고월 금지) */
const SOURCES = ['한전', '전력거래소 EPSIS', 'KOSIS', 'SGIS', 'vworld', '기상청', 'K-water', '국가법령정보센터', 'DART', 'OSM']

/* AEO: 자주 묻는 질문 — 답변엔진(AI 검색)이 그대로 인용할 Q&A. 확정 사실만, postbuild FAQPage와 동일 내용 */
const FAQ = [
  {
    q: 'AI InfraMap은 어떤 서비스인가요?',
    a: `전국 데이터센터·발전·계통·규제 공개 데이터를 한 장의 지도로 모아, 임의 지점의 데이터센터 부지 적합성을 전력·토지·리스크·네트워크·기상 5축으로 즉시 판정하는 부지 인텔리전스입니다. 검증 시설 ${FACILITIES.length}곳, 회원가입 없이 무료로 사용합니다.`,
  },
  {
    q: '전력계통영향평가가 무엇이고 왜 중요한가요?',
    a: '분산에너지 활성화 특별법에 따라 계약전력 10MW 이상 대규모 전력수요의 계통 영향을 심사하는 제도입니다. 시범운영(2025.8–2026.3)에서 수도권 1차 기술검토 522건 중 53.4%가 전력 공급 불가 판정을 받았고, 본심사 통과는 수도권 10/24건 대 비수도권 26/29건이었습니다. 데이터센터 부지 선정의 최대 관문입니다.',
  },
  {
    q: '데이터센터 부지는 왜 비수도권이 유리한가요?',
    a: '전력계통영향평가에 수도권 억제 배점(±15점)이 있고, 전국 공급불가 판정의 91%가 수도권에 집중돼 있습니다. 여기에 AIDC 특별법(2027.3.10 시행)이 비수도권 신·증축에 평가 면제 트랙을 열어줍니다(면제 용량 상한은 대통령령 미정).',
  },
  {
    q: '데이터는 어디서 오고 믿을 수 있나요?',
    a: '한전, 전력거래소(EPSIS), KOSIS, SGIS, vworld, 기상청, K-water, 국가법령정보센터, DART 등 공개 데이터만 사용합니다. 산출 근거가 없는 항목은 점수화하지 않고 "데이터 대기"로 명시하며, 수치에는 출처와 갱신일을 표기합니다.',
  },
  {
    q: '이용 비용은 얼마인가요?',
    a: '맵·부지 스코어링·GPU 계산기·AI 브리프는 무료(베타)입니다. 정밀 부지 리포트와 데이터·API 제휴는 요금·문의 페이지 또는 kwangdol@gmail.com으로 문의하세요.',
  },
]

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function AboutPage() {
  const videoRef = useRef(null)

  // 경량화: 탭이 백그라운드로 가면 룹 영상 디코딩 정지 — 다중 탭에서 디코더·메모리 점유 방지
  useEffect(() => {
    const onVis = () => {
      const v = videoRef.current
      if (!v) return
      if (document.hidden) v.pause()
      else v.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    document.title = TITLE
    setMeta('name', 'description', DESC)
    setMeta('property', 'og:title', TITLE)
    setMeta('property', 'og:description', DESC)
    // AEO: FAQPage JSON-LD — SPA 진입 경로에서도 유지(프리렌더 셸과 동일 내용)
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [])

  // 히어로 통계 — 화면의 숫자는 전부 데이터에서 산출(하드코딩 금지)
  const stats = useMemo(() => {
    const operating = FACILITIES.filter((f) => f.status === 'operating').length
    const mwPublic = Math.round(FACILITIES.reduce((s, f) => s + (f.power_mw_public ?? 0), 0))
    // 정직성: 공개 전력값은 수전·IT·계획 목표치(예: 솔라시도 파크 1,000MW)가 혼재된 참고 합계 —
    // '수전용량 합계'로 표기하면 과대 주장이라 운영분을 병기한다
    const mwOperating = Math.round(
      FACILITIES.filter((f) => f.status === 'operating').reduce((s, f) => s + (f.power_mw_public ?? 0), 0),
    )
    return [
      { v: FACILITIES.length, unit: '곳', lbl: '검증 시설 (운영·건설·계획)' },
      { v: operating, unit: '곳', lbl: '운영 중 시설' },
      { v: mwPublic.toLocaleString(), unit: 'MW+', lbl: `공개 전력 합계 (운영 ${mwOperating.toLocaleString()}MW + 건설·계획 목표치) · 미공개 제외` },
      { v: PROCESS_NODES.length, unit: '단계', lbl: '인허가 절차 로드맵' },
      { v: GLOSSARY.length, unit: '개', lbl: '전력·인허가 용어' },
    ]
  }, [])

  return (
    <>
      <TopBar />
      <main className="page about-page">
        <section className="about-hero">
          {/* 배경 루프 — 리퀴드 골드(힉스필드 생성, 사용자 선택). 그레이스케일 후 골드 오버레이로 단색톤 처리.
           * 실패(CDN 불가) 시 컨테이너째 숨김 → 기존 그라데이션만 남아 무해. 모션축소·좁은 화면 미표시.
           * TODO: CDN 링크 만료 대비 public/media/ 이전 권장(로컬 환경에서 mp4 커밋). */}
          {/* 번개 부유 아이콘은 번잡 피드백으로 제거(2026.7) — 배경은 골드 룹 영상만 */}
          <div className="about-hero-media" aria-hidden="true">
            <video
              ref={videoRef}
              src="https://d8j0ntlcm91z4.cloudfront.net/user_37c9Ks1OdY9EiCnbQ95G3YWq7EC/hf_20260709_004633_2ddc8857-ccd6-4a3c-994e-f16363558383.mp4"
              autoPlay
              muted
              loop
              playsInline
              disablePictureInPicture
              tabIndex={-1}
              onError={(e) => {
                const wrap = e.currentTarget.parentElement
                if (wrap) wrap.style.display = 'none'
              }}
            />
          </div>
          <div className="eyebrow">ABOUT · AI INFRAMAP</div>
          <h1>
            AI 데이터센터의 첫 질문, <em>“어디에 짓는가”</em>에 답합니다
          </h1>
          <p className="sub about-lede">
            GPU보다 먼저 확보해야 하는 것은 전력과 인허가입니다. AI InfraMap은 전국 데이터센터·발전·계통·규제를 한
            장의 지도로 모아, 임의의 땅 한 점이 데이터센터 부지로 성립하는지를 공개 데이터만으로 즉시 판정하는{' '}
            <b>부지 인텔리전스</b>입니다.
          </p>

          <div className="about-stats">
            {stats.map((s) => (
              <div key={s.lbl} className="about-stat">
                <b>
                  {s.v}
                  <small>{s.unit}</small>
                </b>
                <span>{s.lbl}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about-sec">
          <div className="eyebrow">WHY NOW</div>
          <h2>부지가 병목입니다</h2>
          <p className="about-sec-sub">
            전력계통영향평가가 2026년 시범 시행되면서, 부지 선정은 “땅값”이 아니라 “계통”의 문제가 됐습니다.
          </p>
          <div className="pain-grid">
            {PAINS.map((p) => (
              <div key={p.num} className="pain-card">
                <b className="pain-num">{p.num}</b>
                <span className="pain-title">{p.title}</span>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-sec">
          <div className="eyebrow">WOW POINTS</div>
          <h2>다른 지도가 못 하는 것</h2>
          <div className="wow-grid">
            {WOWS.map((w) => (
              <article key={w.num} className="wow-card">
                <div className="wow-top">
                  <span className="wow-num">{w.num}</span>
                  <span className="wow-ic">
                    <LineIcon name={w.icon} size={16} />
                  </span>
                </div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
                <div className="wow-links">
                  {w.links.map((l) => (
                    <Link key={l.to + l.label} to={l.to}>
                      {l.label}
                      <LineIcon name="arrowUR" size={11} />
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="about-sec">
          <div className="eyebrow">HOW IT WORKS</div>
          <h2>3단계면 충분합니다</h2>
          <div className="steps-row">
            {STEPS.map((s) => (
              <div key={s.n} className="step-card">
                <span className="step-n">{s.n}</span>
                <b>{s.title}</b>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-sec about-honest">
          <div className="eyebrow">HONESTY</div>
          <h2>정직성 원칙</h2>
          <ul className="honest-list">
            <li>
              <b>점수를 지어내지 않습니다.</b> 산출 근거가 없는 축은 그럴듯한 총점 대신 “데이터 대기”로 남기고, 확보
              점수와 커버리지를 그대로 보여줍니다.
            </li>
            <li>
              <b>좌표·수치·링크는 공개 출처로 검증합니다.</b> 시설 위치는 전수 지오코딩, 수치에는 출처·갱신일을
              표기하며, 정밀도가 낮으면 낮다고 씁니다.
            </li>
            <li>
              <b>AI는 원문이 있을 때만 인용합니다.</b> 법령 조문은 국가법령정보센터 원문을 가져온 경우에만 인용하고,
              항상 출처 링크를 함께 답니다.
            </li>
          </ul>
          <div className="src-chips" aria-label="데이터 소스">
            {SOURCES.map((s) => (
              <span key={s} className="src-chip">
                {s}
              </span>
            ))}
          </div>
        </section>

        <section className="about-sec">
          <div className="eyebrow">FAQ</div>
          <h2>자주 묻는 질문</h2>
          <div className="about-faq">
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="about-cta">
          <h2>
            지금 <em>지도에서</em> 시작하세요
          </h2>
          <p>회원가입 없이 바로 씁니다. 팀 도입·정밀 리포트·데이터 제휴는 문의로.</p>
          <div className="about-cta-row">
            <Link className="btn primary" to="/">
              맵 열기
            </Link>
            <Link className="btn" to="/calc">
              GPU 계산기
            </Link>
            <Link className="btn" to="/pricing">
              요금 · 문의
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
