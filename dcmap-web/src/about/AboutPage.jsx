import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { useMapLang } from '../i18n/mapLang.js'
import LineIcon from '../components/LineIcon.jsx'
import { FACILITIES } from '../data/facilities.js'
import { GRID_HEADROOM, GRID_HEADROOM_META } from '../data/gridHeadroom.js'
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
    title_en: 'Capital-region “supply not possible”',
    desc: '수도권 DC 1차 기술검토 522건 중 53.4%가 “전력 공급 불가” — 전국 공급불가의 91%가 수도권(’25.8–’26.3, 기후부 공표).',
    desc_en: 'Of 522 capital-region DC first-stage technical reviews, 53.4% were judged “power supply not possible” — 91% of all nationwide “not possible” cases are in the capital region (Aug ’25–Mar ’26, Ministry of Climate, Energy and Environment).',
  },
  {
    num: '1.9%',
    title: '수도권 신청 대비 최종 통과',
    title_en: 'Final pass vs. capital-region applications',
    desc: '본심사 통과는 수도권 10/24건 — 신청(522건) 대비 1.9%. 비수도권 본심사 통과율은 89.7%(26/29).',
    desc_en: 'Main-review passes in the capital region were 10 of 24 — just 1.9% against applications (522). The non-capital main-review pass rate was 89.7% (26/29).',
  },
  {
    num: '1–1.5억',
    title: '평가 대행비 / 10MW',
    title_en: 'Assessment agency fee / 10MW',
    desc: '계통영향평가 대행 수수료는 10MW당 약 1–1.5억 원(국정감사 지적) + 심의 리드타임.',
    desc_en: 'The PSIA agency fee runs about KRW 100–150M per 10MW (flagged in a National Assembly audit), plus the review lead time.',
  },
]

/* wow 포인트 — 실제로 지금 동작하는 기능만(예정 기능은 '예정' 명시 없이는 싣지 않음) */
const WOWS = [
  {
    num: '01',
    icon: 'target',
    title: '지도 아무 곳이나 클릭 → 5축 부지 스코어',
    title_en: 'Click anywhere on the map → 5-axis site score',
    desc: '전력·토지·리스크·네트워크·기상 5축으로 즉시 스코어링. 근거가 확보된 항목만 점수화하고, 나머지는 점수를 지어내는 대신 “데이터 대기”로 표시합니다.',
    desc_en: 'Instant scoring across five axes — power, land, risk, network, weather. Only items with a secured basis are scored; the rest are marked “data pending” instead of inventing a number.',
    links: [{ label: '맵에서 클릭해 보기', label_en: 'Try clicking on the map', to: '/' }],
  },
  {
    num: '02',
    icon: 'power',
    title: '계통영향평가 통과 전망 + AIDC 특별법 시나리오',
    title_en: 'PSIA pass outlook + AIDC Special Act scenario',
    desc: '입지·계통 여유·승인율·변전소·용량 5요소 가중 스코어카드로 심의 통과 전망을 제시하고, AIDC 특별법 면제 상한(대통령령 미정)을 슬라이더로 시뮬레이션합니다.',
    desc_en: 'A weighted scorecard over five factors — region, grid headroom, approval rate, substation, capacity — gives a review-pass outlook, and a slider simulates the AIDC Special Act exemption cap (presidential decree pending).',
    links: [
      { label: '부지 클릭 → 전망 보기', label_en: 'Click a site → see outlook', to: '/' },
      { label: '면제 시나리오', label_en: 'Exemption scenario', to: '/calc' },
    ],
  },
  {
    num: '03',
    icon: 'cooling',
    title: 'GPU → 전력·비용·탄소 계산기',
    title_en: 'GPU → power, cost, carbon calculator',
    desc: 'GB200 NVL72 포함 최신 랙 기준으로 GPU 수를 MW로 환산하고, PUE·전력비·탄소배출·RE100/PPA 조달까지 시나리오 저장·비교. URL로 그대로 공유됩니다.',
    desc_en: 'Convert GPU count into MW against current racks including GB200 NVL72, then save and compare scenarios across PUE, power cost, carbon and RE100/PPA procurement. Shareable straight from the URL.',
    links: [{ label: 'GPU 계산기', label_en: 'GPU calculator', to: '/calc' }],
  },
  {
    num: '04',
    icon: 'risk',
    title: '법령 원문을 인용하는 AI 브리프',
    title_en: 'AI briefs that cite statute text',
    desc: 'Claude가 부지 브리프·Q&A·비교평을 생성하되, 국가법령정보센터(law.go.kr) 원문을 확보했을 때만 조문을 인용하고 출처 링크를 답니다. 원문이 없으면 인용하지 않습니다.',
    desc_en: 'Claude generates site briefs, Q&A and comparisons, but cites a provision only when the original text from the National Law Information Center (law.go.kr) is secured, always with a source link. No source text, no citation.',
    links: [{ label: '맵에서 AI 열기', label_en: 'Open AI on the map', to: '/' }],
  },
  {
    num: '05',
    icon: 'site',
    title: `전국 ${FACILITIES.length}개 시설 — 전수 검증 데이터`,
    title_en: `${FACILITIES.length} facilities nationwide — full-census verified data`,
    desc: '운영·건설·계획 시설의 주소를 전수 조사해 필지 단위로 지오코딩했고, 모든 수치에 출처와 갱신일을 답니다. 위치 정밀도가 낮으면 낮다고 표시합니다.',
    desc_en: 'Every operating, under-construction and planned facility address was fully surveyed and geocoded to the parcel, with a source and update date on every figure. Where location precision is low, we say so.',
    links: [
      { label: '데이터 탐색기', label_en: 'Data explorer', to: '/data' },
      { label: '통계', label_en: 'Statistics', to: '/stats' },
    ],
  },
  {
    num: '06',
    icon: 'arrowUR',
    title: `인허가 로드맵 ${PROCESS_NODES.length}단계 + 온톨로지 맵`,
    title_en: `${PROCESS_NODES.length}-node permitting roadmap + ontology map`,
    desc: `부지 검토부터 운영까지 절차를 병목·분기점·서류·리드타임 단위로 분해하고, 용어 ${GLOSSARY.length}개·법령·절차를 3층 온톨로지 맵으로 연결했습니다.`,
    desc_en: `We break the process from site review to operation into bottlenecks, branch points, documents and lead times, and connect ${GLOSSARY.length} terms, statutes and procedures in a three-layer ontology map.`,
    links: [
      { label: '인허가 로드맵', label_en: 'Permitting roadmap', to: '/roadmap' },
      { label: '온톨로지 맵', label_en: 'Ontology map', to: '/glossary' },
    ],
  },
]

const STEPS = [
  { n: '1', title: '검색하거나 클릭', title_en: 'Search or click', desc: '주소를 검색하거나 지도의 임의 지점을 클릭하면 그 자리가 곧 후보 부지입니다.', desc_en: 'Search an address or click any point on the map, and that spot becomes a candidate site.' },
  { n: '2', title: '판정과 전망', title_en: 'Verdict and outlook', desc: '5축 스코어, 수전전압 트랙(22.9/154/345kV), 계통영향평가 통과 전망이 한 패널에 뜹니다.', desc_en: 'The 5-axis score, supply-voltage track (22.9/154/345kV) and PSIA pass outlook appear in a single panel.' },
  { n: '3', title: '브리프와 리포트', title_en: 'Brief and report', desc: 'AI 임원 브리프·PDF로 정리하고, 더 깊은 검토가 필요하면 정밀 리포트를 요청하세요.', desc_en: 'Wrap it up as an AI executive brief / PDF, and request a detailed report when a deeper review is needed.' },
]

/* 사업 실현가능성 5관문 — 입지(어디)만이 아니라 지을 수 있나·채울 수 있나까지. 정직성: 우리가 점수화하는 건 1·2관문뿐.
 * cov: 'us' 우리가 정량화 / 'market' 시장 데이터로 맥락화 / 'own' 사업자 고유 역량(우리 밖) */
const GATES = [
  {
    n: '1', phase: '지을 수 있나', phase_en: 'Can you build it', title: '부지 확보', title_en: 'Securing the site', cov: 'us',
    q: '땅이 있어도 인허가·주민 수용성에서 막힌다.',
    q_en: 'Even with the land, permitting and community acceptance can block you.',
    fact: '수도권 계통 심사 최종 승인율 1.9% · 세종·고양 등 수용성 무산 사례',
    fact_en: 'Capital-region grid-review final approval rate 1.9% · acceptance failures in Sejong, Goyang and elsewhere',
    links: [{ to: '/', label: '맵에서 지점 스코어', label_en: 'Score a point on the map' }, { to: '/insights/dc-coexistence-2026', label: '수용성 축', label_en: 'Acceptance axis' }],
  },
  {
    n: '2', phase: '지을 수 있나', phase_en: 'Can you build it', title: '전력 수전', title_en: 'Power intake', cov: 'us',
    q: '10MW↑ 계통영향평가, 40MW↑ 154kV. 수도권은 절반 넘게 공급 불가.',
    q_en: 'PSIA above 10MW, 154kV above 40MW. In the capital region over half get “not possible”.',
    fact: '수도권 1차 기술검토 공급불가 53.4% · 울산 SK LNG 자가발전 우회',
    fact_en: 'Capital-region first-stage “not possible” 53.4% · Ulsan SK LNG self-generation workaround',
    links: [{ to: '/?layers=headroom', label: '변전소 여유 레이어', label_en: 'Substation headroom layer' }, { to: '/calc', label: 'GPU→MW 계산', label_en: 'GPU→MW calc' }],
  },
  {
    n: '3', phase: '지을 수 있나', phase_en: 'Can you build it', title: '자금 조달', title_en: 'Financing', cov: 'market',
    q: '하이퍼스케일 1채 총사업비 1조 안팎. 되팔 그림(Exit)이 서야 PF가 돈다.',
    q_en: 'One hyperscale build is around KRW 1 trillion total. Project finance only moves once a resale (exit) path is clear.',
    fact: '매수자 풀 국내기관→글로벌인프라→DC전문자본(Keppel) · 3~8년 Exit',
    fact_en: 'Buyer pool: domestic institutions → global infra → DC-specialist capital (Keppel) · 3–8 yr exit',
    links: [{ to: '/insights/cbre-exit-scarcity-2026', label: '투자·Exit 진단', label_en: 'Investment · exit read' }],
  },
  {
    n: '4', phase: '채울 수 있나', phase_en: 'Can you fill it', title: 'GPU 조달·규격', title_en: 'GPU procurement & spec', cov: 'market',
    q: 'GPU를 구해도 건물이 구형 설계면 최신 GPU를 물리적으로 못 받는다.',
    q_en: 'Even with GPUs in hand, an old building design physically can’t host the latest GPUs.',
    fact: '랙당 40~100kW·하중 2.5톤/㎡·액체냉각 · 완전설비형=임대인 부담',
    fact_en: '40–100kW per rack · 2.5 t/㎡ load · liquid cooling · fully-fitted = landlord’s burden',
    links: [{ to: '/insights/build-reality-2026', label: '물리적 진부화', label_en: 'Physical obsolescence' }, { to: '/calc', label: '규격·MW 계산', label_en: 'Spec · MW calc' }],
  },
  {
    n: '5', phase: '채울 수 있나', phase_en: 'Can you fill it', title: '가동률(소화)', title_en: 'Utilization (absorption)', cov: 'own',
    q: '다 지어도 채워야 돈이 된다. 선임차 없으면 빈 건물은 부채다.',
    q_en: 'Built is not paid — it has to be filled. Without pre-leasing, an empty building is a liability.',
    fact: '국내 GPU 가동률 30~40% · 우량 앵커 선임차 확보분만 안 빈다',
    fact_en: 'Domestic GPU utilization 30–40% · only pre-leased blue-chip anchor space stays full',
    links: [{ to: '/insights/gpu-utilization-2026', label: '수요측 신호', label_en: 'Demand-side signal' }],
  },
]
const GATE_COV = {
  us: { label: '우리가 정량화', label_en: 'We quantify', cls: 'gate-us' },
  market: { label: '시장 데이터로 맥락화', label_en: 'Contextualized with market data', cls: 'gate-market' },
  own: { label: '사업자 고유 역량', label_en: 'Operator-specific capability', cls: 'gate-own' },
}

/* 실제 코드가 호출·집계에 사용하는 공개 소스만 나열(장식용 로고월 금지) */
const SOURCES = ['한전', '전력거래소 EPSIS', 'KOSIS', 'SGIS', 'vworld', '기상청', 'K-water', '국가법령정보센터', 'DART', 'OSM']

/* AEO: 자주 묻는 질문 — 답변엔진(AI 검색)이 그대로 인용할 Q&A. 확정 사실만, postbuild FAQPage와 동일 내용 */
const FAQ = [
  {
    q: 'AI InfraMap은 어떤 서비스인가요?',
    q_en: 'What is AI InfraMap?',
    a: `전국 데이터센터·발전·계통·규제 공개 데이터를 한 장의 지도로 모아, 임의 지점의 데이터센터 부지 적합성을 전력·토지·리스크·네트워크·기상 5축으로 즉시 판정하는 부지 인텔리전스입니다. 검증 시설 ${FACILITIES.length}곳, 회원가입 없이 무료로 사용합니다.`,
    a_en: `Site intelligence that gathers nationwide public data on datacenters, generation, the grid and regulation into a single map, and instantly assesses any point’s datacenter-site suitability across five axes — power, land, risk, network, weather. ${FACILITIES.length} verified facilities, free and no sign-up.`,
  },
  {
    q: '전력계통영향평가가 무엇이고 왜 중요한가요?',
    q_en: 'What is the power-system impact assessment (PSIA) and why does it matter?',
    a: '분산에너지 활성화 특별법에 따라 계약전력 10MW 이상 대규모 전력수요의 계통 영향을 심사하는 제도입니다. 시범운영(2025.8–2026.3)에서 수도권 1차 기술검토 522건 중 53.4%가 전력 공급 불가 판정을 받았고, 본심사 통과는 수도권 10/24건 대 비수도권 26/29건이었습니다. 데이터센터 부지 선정의 최대 관문입니다.',
    a_en: 'Under the Distributed Energy Activation Special Act, it reviews the grid impact of large loads with contracted capacity of 10MW or more. In the pilot (Aug 2025–Mar 2026), 53.4% of 522 capital-region first-stage technical reviews were judged “power supply not possible”, and main-review passes were 10/24 in the capital region vs. 26/29 outside it. It is the biggest gate in datacenter site selection.',
  },
  {
    q: '데이터센터 부지는 왜 비수도권이 유리한가요?',
    q_en: 'Why are non-capital regions more favorable for datacenter sites?',
    a: '전력계통영향평가에 수도권 억제 배점(±15점)이 있고, 전국 공급불가 판정의 91%가 수도권에 집중돼 있습니다. 여기에 AIDC 특별법(2027.3.10 시행)이 비수도권 신·증축에 평가 면제 트랙을 열어줍니다(면제 용량 상한은 대통령령 미정).',
    a_en: 'The PSIA carries a capital-region suppression score (±15 points), and 91% of nationwide “not possible” verdicts are concentrated in the capital region. On top of this, the AIDC Special Act (effective 2027.3.10) opens an assessment-exemption track for non-capital new-builds and expansions (the exemption capacity cap is pending a presidential decree).',
  },
  {
    q: '데이터는 어디서 오고 믿을 수 있나요?',
    q_en: 'Where does the data come from, and can it be trusted?',
    a: '한전, 전력거래소(EPSIS), KOSIS, SGIS, vworld, 기상청, K-water, 국가법령정보센터, DART 등 공개 데이터만 사용합니다. 산출 근거가 없는 항목은 점수화하지 않고 "데이터 대기"로 명시하며, 수치에는 출처와 갱신일을 표기합니다.',
    a_en: 'We use only public data — KEPCO, the Korea Power Exchange (EPSIS), KOSIS, SGIS, vworld, the Korea Meteorological Administration, K-water, the National Law Information Center, DART and more. Items without a computable basis are not scored but marked “data pending”, and every figure carries a source and update date.',
  },
  {
    q: '이용 비용은 얼마인가요?',
    q_en: 'How much does it cost?',
    a: '맵·부지 스코어링·GPU 계산기·AI 브리프는 무료(베타)입니다. 정밀 부지 리포트와 데이터·API 제휴는 요금·문의 페이지 또는 kwangdol@gmail.com으로 문의하세요.',
    a_en: 'The map, site scoring, GPU calculator and AI briefs are free (beta). For detailed site reports and data/API partnerships, see the pricing/contact page or reach out at kwangdol@gmail.com.',
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
  const en = useMapLang() === 'en'
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
    const headroomTotalGw = (Object.values(GRID_HEADROOM).reduce((s, v) => s + (typeof v === 'number' ? v : v?.mw || 0), 0) / 1000)
    return [
      {
        v: headroomTotalGw.toFixed(1),
        unit: 'GW',
        lbl: en
          ? `Nationwide grid headroom total — 17 provinces (KEPCO connectable capacity ${GRID_HEADROOM_META.year} outlook) · large variance by district and site`
          : `전국 계통 공급여유 합계 — 17개 시도 (한전 연계가능용량 ${GRID_HEADROOM_META.year} 전망) · 시군구·부지별 편차 큼`,
        hero: true,
      },
      { v: FACILITIES.length, unit: en ? 'sites' : '곳', lbl: en ? 'Verified facilities (operating · building · planned)' : '검증 시설 (운영·건설·계획)' },
      { v: operating, unit: en ? 'sites' : '곳', lbl: en ? 'Facilities in operation' : '운영 중 시설' },
      {
        v: (mwPublic / 1000).toFixed(1),
        unit: 'GW+',
        lbl: en
          ? `Sum of individually disclosed facility power (${mwPublic.toLocaleString()}MW · incl. ${mwOperating.toLocaleString()}MW operating) — excludes undisclosed-scale and aggregate-plan items. The individually disclosed share of the national AIDC build plan of 18.4GW.`
          : `개별 시설 공개 전력 합계 (${mwPublic.toLocaleString()}MW · 운영 ${mwOperating.toLocaleString()}MW 포함) — 규모 미공개·집합계획 제외분. 국가 AIDC 구축계획 18.4GW의 개별 공개분.`,
      },
      { v: PROCESS_NODES.length, unit: en ? 'nodes' : '단계', lbl: en ? 'Permitting-process roadmap' : '인허가 절차 로드맵' },
      { v: GLOSSARY.length, unit: en ? 'terms' : '개', lbl: en ? 'Power · permitting terms' : '전력·인허가 용어' },
    ]
  }, [en])

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
          <div className="about-lang">
            <span className="alang-on">KO</span>
            <Link to="/global">English →</Link>
          </div>
          <div className="eyebrow">ABOUT · AI INFRAMAP</div>
          <h1>
            {en ? (
              <>
                The first question for an AI datacenter, <em>“where do you build it”</em> — answered
              </>
            ) : (
              <>
                AI 데이터센터의 첫 질문, <em>“어디에 짓는가”</em>에 답합니다
              </>
            )}
          </h1>
          <p className="sub about-lede">
            {en ? (
              <>
                What you must secure before GPUs is power and permitting. AI InfraMap is{' '}
                <b>site intelligence</b> that gathers nationwide datacenters, generation, the grid and regulation into a
                single map and instantly judges — from public data alone — whether any single point of land holds up as a
                datacenter site.
              </>
            ) : (
              <>
                GPU보다 먼저 확보해야 하는 것은 전력과 인허가입니다. AI InfraMap은 전국 데이터센터·발전·계통·규제를 한
                장의 지도로 모아, 임의의 땅 한 점이 데이터센터 부지로 성립하는지를 공개 데이터만으로 즉시 판정하는{' '}
                <b>부지 인텔리전스</b>입니다.
              </>
            )}
          </p>

          <div className="about-hook">
            <span className="about-hook-stat">1.9%</span>
            <span className="about-hook-copy">
              {en ? (
                <>
                  Capital-region PSIA final approval rate — 2 of every 100 applications. <b>Is your site one of the
                  two?</b> We’ll assess one site you’re reviewing, free.
                </>
              ) : (
                <>
                  수도권 계통영향평가 최종 승인율 — 100곳 신청에 2곳. <b>당신 부지가 그 2곳인가?</b> 검토 중인 부지
                  1곳을 무료로 판정해 드립니다.
                </>
              )}
            </span>
            <span className="about-hook-cta">
              <Link className="btn primary" to="/pricing">{en ? 'Free site diagnosis' : '무료 부지 진단'}</Link>
              <Link className="btn" to="/report-sample">{en ? 'Sample report' : '견본 리포트'}</Link>
            </span>
          </div>

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
          <h2>{en ? 'The site is the bottleneck' : '부지가 병목입니다'}</h2>
          <p className="about-sec-sub">
            {en
              ? 'With the PSIA piloted in 2026, site selection became a “grid” problem, not a “land price” one.'
              : '전력계통영향평가가 2026년 시범 시행되면서, 부지 선정은 “땅값”이 아니라 “계통”의 문제가 됐습니다.'}
          </p>
          <div className="pain-grid">
            {PAINS.map((p) => (
              <div key={p.num} className="pain-card">
                <b className="pain-num">{p.num}</b>
                <span className="pain-title">{en ? p.title_en : p.title}</span>
                <p>{en ? p.desc_en : p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-sec">
          <div className="eyebrow">WOW POINTS</div>
          <h2>{en ? 'What other maps can’t do' : '다른 지도가 못 하는 것'}</h2>
          <div className="wow-grid">
            {WOWS.map((w) => (
              <article key={w.num} className="wow-card">
                <div className="wow-top">
                  <span className="wow-num">{w.num}</span>
                  <span className="wow-ic">
                    <LineIcon name={w.icon} size={16} />
                  </span>
                </div>
                <h3>{en ? w.title_en : w.title}</h3>
                <p>{en ? w.desc_en : w.desc}</p>
                <div className="wow-links">
                  {w.links.map((l) => (
                    <Link key={l.to + l.label} to={l.to}>
                      {en ? l.label_en : l.label}
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
          <h2>{en ? 'Three steps is enough' : '3단계면 충분합니다'}</h2>
          <div className="steps-row">
            {STEPS.map((s) => (
              <div key={s.n} className="step-card">
                <span className="step-n">{s.n}</span>
                <b>{en ? s.title_en : s.title}</b>
                <p>{en ? s.desc_en : s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-sec">
          <div className="eyebrow">REALITY CHECK</div>
          <h2>{en ? 'Location is only the first gate — the 5 gates of project feasibility' : '입지는 첫 관문일 뿐 — 사업 실현가능성 5관문'}</h2>
          <p className="about-sec-sub">
            {en ? (
              <>
                Finding good land is the start. A datacenter project must clear <b>can you build it</b> (site · power ·
                capital) and <b>can you fill it</b> (GPU spec · utilization) in order, and one blocked gate ends it. We
                score gates 1–2; the rest we contextualize with market data or leave to operator-specific capability — and
                our principle is not to blur that line.
              </>
            ) : (
              <>
                좋은 땅을 찾는 건 시작입니다. 데이터센터 사업은 <b>지을 수 있나</b>(부지·전력·자금)와{' '}
                <b>채울 수 있나</b>(GPU 규격·가동률)를 차례로 통과해야 하고, 하나라도 막히면 끝입니다. 우리가 점수 매기는
                건 1·2관문이고, 나머지는 시장 데이터로 맥락화하거나 사업자 고유 역량으로 남깁니다 — 그 경계를 흐리지
                않는 게 원칙입니다.
              </>
            )}
          </p>
          <div className="gates-row">
            {GATES.map((g) => {
              const cov = GATE_COV[g.cov]
              return (
                <article key={g.n} className={`gate-card ${cov.cls}`}>
                  <div className="gate-top">
                    <span className="gate-n">{g.n}</span>
                    <span className="gate-phase">{en ? g.phase_en : g.phase}</span>
                  </div>
                  <h3>{en ? g.title_en : g.title}</h3>
                  <p className="gate-q">{en ? g.q_en : g.q}</p>
                  <p className="gate-fact">{en ? g.fact_en : g.fact}</p>
                  <div className="gate-foot">
                    <span className={`gate-cov ${cov.cls}`}>{en ? cov.label_en : cov.label}</span>
                    <span className="gate-links">
                      {g.links.map((l) => (
                        <Link key={l.to + l.label} to={l.to}>
                          {en ? l.label_en : l.label}
                          <LineIcon name="arrowUR" size={10} />
                        </Link>
                      ))}
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
          <p className="about-sec-sub" style={{ marginTop: 14 }}>
            {en ? (
              <>
                The real answer: “absorbable datacenters” do exist — but only those with <b>pre-leased blue-chip anchors
                + current specs</b> (AWS Incheon 650MW · Jukjeon CSP 5 floors · Keppel Ansan). Speculative small builds get
                caught at gates 4–5.{' '}
                <Link to="/insights/build-reality-2026">Full 5-gate analysis →</Link>
              </>
            ) : (
              <>
                현실 답: “소화 가능한 데이터센터”는 실재합니다 — 단 <b>우량 앵커 선임차 + 최신 규격</b>을 갖춘 것만
                (AWS 인천 650MW·죽전 CSP 5개층·Keppel 안산). 투기적 소형 개발은 4·5관문에서 걸립니다.{' '}
                <Link to="/insights/build-reality-2026">5관문 전체 분석 →</Link>
              </>
            )}
          </p>
        </section>

        <section className="about-sec about-honest">
          <div className="eyebrow">HONESTY</div>
          <h2>{en ? 'Honesty principles' : '정직성 원칙'}</h2>
          <ul className="honest-list">
            {en ? (
              <>
                <li>
                  <b>We don’t invent scores.</b> An axis with no computable basis is left as “data pending” instead of a
                  plausible-looking total, and we show the secured score and coverage as they are.
                </li>
                <li>
                  <b>Coordinates, figures and links are verified against public sources.</b> Facility locations are fully
                  geocoded, figures carry a source and update date, and where precision is low we say so.
                </li>
                <li>
                  <b>AI cites only when the source text exists.</b> Statute provisions are cited only when the original
                  text was pulled from the National Law Information Center, always with a source link.
                </li>
              </>
            ) : (
              <>
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
              </>
            )}
          </ul>
          <div className="src-chips" aria-label={en ? 'Data sources' : '데이터 소스'}>
            {SOURCES.map((s) => (
              <span key={s} className="src-chip">
                {s}
              </span>
            ))}
          </div>
        </section>

        <section className="about-sec">
          <div className="eyebrow">FAQ</div>
          <h2>{en ? 'Frequently asked questions' : '자주 묻는 질문'}</h2>
          <div className="about-faq">
            {FAQ.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{en ? f.q_en : f.q}</summary>
                <p>{en ? f.a_en : f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="about-cta">
          <h2>
            {en ? (
              <>
                Start <em>on the map</em> now
              </>
            ) : (
              <>
                지금 <em>지도에서</em> 시작하세요
              </>
            )}
          </h2>
          <p>{en ? 'Use it right away, no sign-up. For team rollout, detailed reports and data partnerships, get in touch.' : '회원가입 없이 바로 씁니다. 팀 도입·정밀 리포트·데이터 제휴는 문의로.'}</p>
          <div className="about-cta-row">
            <Link className="btn primary" to="/">
              {en ? 'Open the map' : '맵 열기'}
            </Link>
            <Link className="btn" to="/calc">
              {en ? 'GPU calculator' : 'GPU 계산기'}
            </Link>
            <Link className="btn" to="/pricing">
              {en ? 'Pricing · contact' : '요금 · 문의'}
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
