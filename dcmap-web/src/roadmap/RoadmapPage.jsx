import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'

const TITLE = 'AI 데이터센터 구축 A–Z 로드맵 — AI InfraMap'
const DESC =
  '한국에서 AI 데이터센터를 구축하는 전 과정 — 부지 선정부터 전력 확보·계통영향평가·송변전 인프라·발전 조달·냉각·리스크·네트워크·건설·운영까지. 공개 규정·데이터 기준 단계별 가이드.'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// 한국전력 송변전 건설 사업현황 (kepco.co.kr 정보공개, 단계별 건수) — 2026.07 조회
const TRANS = { plan: 442, approved: 188, underway: 202, done: 14, total: 442 + 188 + 202 + 14 }

const STEPS = [
  {
    n: 1, axis: '토지', title: '부지 선정 — 용도지역·면적·지가',
    what: '공업지역·계획관리 등 데이터센터가 허용되는 용도지역인지, 필요 면적·형상, 지가·거래가를 확인. 절차 하자 하나가 프로젝트를 멈춘다(버지니아 QTS 사례).',
    source: 'vworld 용도지역·토지이음 · KOSIS/부동산원 지가',
    links: [{ to: '/', label: '지점 분석(빈 곳 클릭)' }, { to: '/land', label: 'LAND PULSE 지가' }],
  },
  {
    n: 2, axis: '전력', title: '수전전압 트랙 결정 — 계약전력→전압',
    what: '필요 용량이 전압 트랙을 결정한다: 20MW까지 22.9kV, 20~40MW 한전 협의, 40MW 초과 154kV 의무. GPU 대수→MW 환산으로 트랙을 먼저 가늠.',
    source: '한전 기본공급약관 제23조',
    links: [{ to: '/calc', label: 'GPU→MW 계산기' }, { to: '/insights/power-track-40mw', label: '40MW의 벽' }],
  },
  {
    n: 3, axis: '전력', title: '계통 연계·계통영향평가',
    what: '10MW 이상은 전력계통영향평가 대상. 2025.11 개편으로 적정전압이 필수 요건이 되고 입지별 최대 ±15점 가감점(수도권 억제)·자가발전/에너지효율 의무가 정량화됐다. 비수도권은 AIDC 특별법(2027.2) 면제 가능 + 국가기간 전력망 특별법(2025.9)이 인프라 구축을 앞당긴다. 계통 여유용량이 큰 권역을 먼저 본다.',
    source: '기후에너지환경부 공고 제2025-139호(±15점 개편) · 국가기간 전력망 확충 특별법 · AIDC 특별법',
    links: [{ to: '/power', label: '전력지도(발전·여유)' }, { to: '/insights/market-2025h2', label: '±15점 시대' }, { to: '/insights/psia-exemption-2027', label: '계통영향평가·특례' }],
  },
  {
    n: 4, axis: '전력', title: '송·변전 인프라 확인 — 한전 건설 4단계',
    what: `접속 가능한 154kV+ 변전소·송전선로가 있는지, 인근 송변전 건설사업이 진행 중인지. 한전 송변전 건설 정보공개 플랫폼에 전국 ${TRANS.total}건이 단계별로 공개된다: 계획확정~사업승인전 ${TRANS.plan} · 사업승인~공사착수전 ${TRANS.approved} · 공사착수~완료전 ${TRANS.underway} · 완료~준공후1년 ${TRANS.done}.`,
    source: '한전 송변전 건설 정보공개 플랫폼(kepco.co.kr) · 345kV 여유 변전소 정보 공개(정부 예고)',
    links: [{ to: '/insights/mega-project-aidc', label: '345kV 정보 공개' }],
  },
  {
    n: 5, axis: '전력', title: '발전 조달 — PPA·자가발전·재생E',
    what: '유틸리티가 "발전기를 직접 들고 오라"는 시대. PPA 직결·자가발전·SMR·ESS로 전력을 확보한다. 발전사업 허가대장에서 신규 허가의 86.5%가 신재생 — 전남·경북·강원 벨트에 몰린다.',
    source: '3MW 초과 발전사업 허가대장(2026-04) · EPSIS 발전설비',
    links: [{ to: '/power', label: '발전 공급 지도' }, { to: '/insights/power-permit-battle', label: '전력·허가가 승부' }],
  },
  {
    n: 6, axis: '냉각', title: '냉각·용수 설계',
    what: 'GPU TDP 1.5~2kW는 액체냉각 전환점. 냉각은 용수 확보·수질·기상(프리쿨링·습구온도)에 종속된 입지 문제다. 외기도입 여지가 큰 권역·용수원 근접을 본다.',
    source: 'OCP 공개 기술자료 · 기상청 공공',
    links: [{ to: '/insights/liquid-cooling-brief', label: '액체냉각 전환' }, { to: '/insights/cooling-platform-ma', label: '냉각 M&A' }],
  },
  {
    n: 7, axis: '리스크', title: '리스크 검토 — 침수·민원·재해·군사',
    what: '침수(홍수위험지도)·반경 주거 인구(민원 프록시)·재해 이력·군사/문화재/상수원 제약을 확인. 데이터센터에 침수는 치명적이다.',
    source: '홍수위험지도 · SGIS 인구격자 · 재난안전 재해연보',
    links: [{ to: '/', label: '지점 분석 리스크 셀' }, { to: '/insights/national-infrastructure', label: '복원력·지정학' }],
  },
  {
    n: 8, axis: '네트워크', title: '네트워크 — 백본·해저케이블',
    what: '백본 국사/IX 근접성과 해저케이블 육양국(부산 송정·거제 등)까지의 경로가 지연시간·다중 리전 구성을 좌우한다.',
    source: '공개 통신 인프라(근사·검증 대기)',
    links: [{ to: '/', label: '지점 분석 네트워크 셀' }],
  },
  {
    n: 9, axis: '인허가', title: '건설 인허가·환경영향평가·준공',
    what: '건축허가·환경영향평가·소방·정보통신공사 등 개별 인허가를 병렬 처리. AIDC 특별법의 통합 창구·타임아웃제가 리드타임을 줄인다.',
    source: 'AIDC 특별법 · 지자체 인허가',
    links: [{ to: '/glossary', label: '인허가 용어집' }],
  },
  {
    n: 10, axis: '운영', title: '운영 — PUE·RE100·복원력',
    what: '준공 후 PUE·전력비(LCOE)·RE100 조달률이 장기 경쟁력을 가른다. 다중 리전·재해복구는 국가 신뢰도 경쟁의 조건이 된다.',
    source: '사업자 공시(DART) · KDCC/KEEI',
    links: [{ to: '/dashboard', label: '대시보드' }, { to: '/stats', label: '통계' }],
  },
]

const AXIS_ORDER = ['토지', '전력', '냉각', '리스크', '네트워크', '인허가', '운영']

/* ---------- 프로세스 프레임(스윔레인) 모델 ---------- */
// 레인 = 참여 주체, 게이트 = 단계. 공개 규정 기준 표준 흐름(사업별 상이).
const LANES = [
  { id: 'biz', label: '사업자(개발·운영)' },
  { id: 'gov', label: '지자체(인허가권자)' },
  { id: 'kepco', label: '한전(계통·송변전)' },
  { id: 'psia', label: '전기위·기후에너지환경부' },
  { id: 'gen', label: '발전사·투자자' },
]
const GATES = [
  { id: 'g0', label: 'G0 입지검토' },
  { id: 'g1', label: 'G1 부지·인허가' },
  { id: 'g2', label: 'G2 전력계통' },
  { id: 'g3', label: 'G3 조달·설계' },
  { id: 'g4', label: 'G4 건설·준공' },
  { id: 'g5', label: 'G5 운영' },
]
const st = (n) => STEPS[n - 1]
// gatekeeper: 실제 사업을 멈추는 핵심 관문(계통 접속·계통영향평가)
const NODES = [
  { id: 'P01', lane: 'biz', gate: 'g0', axis: st(1).axis, title: '부지·용도지역 검토', note: st(1).what, basis: st(1).source, links: st(1).links },
  { id: 'P02', lane: 'biz', gate: 'g0', axis: st(2).axis, title: '수전전압 트랙 산정(GPU→MW)', note: st(2).what, basis: st(2).source, links: st(2).links },
  { id: 'P03', lane: 'biz', gate: 'g0', axis: st(8).axis, title: '네트워크·백본 경로 검토', note: st(8).what, basis: st(8).source, links: st(8).links },
  { id: 'P04', lane: 'biz', gate: 'g1', axis: st(7).axis, title: '리스크 스크리닝(침수·민원·재해)', note: st(7).what, basis: st(7).source, links: st(7).links },
  { id: 'P05', lane: 'gov', gate: 'g1', axis: '인허가', title: '부지 확보·건축 인허가 협의', note: '용도지역 적합·건축허가 사전협의. 절차 하자 하나가 사업을 멈춘다(버지니아 QTS 사례).', basis: '국토계획법·건축법·지자체 조례', links: [{ to: '/glossary', label: '인허가 용어집' }] },
  { id: 'P06', lane: 'gov', gate: 'g1', axis: '인허가', title: '환경영향평가', note: '사업 규모별 환경영향평가/소규모 환경영향평가 대상 판단·협의.', basis: '환경영향평가법', links: [] },
  { id: 'P07', lane: 'kepco', gate: 'g2', axis: '전력', title: '한전 접속 신청·기술검토', note: '수전전압 트랙(22.9/154kV)별 접속 신청과 기술검토. 40MW 초과는 154kV 의무.', basis: '한전 기본공급약관 제23조', links: [{ to: '/calc', label: 'GPU→MW 계산기' }], gatekeeper: true },
  { id: 'P08', lane: 'psia', gate: 'g2', axis: '전력', title: '전력계통영향평가 심의(±15점)', note: st(3).what, basis: st(3).source, links: st(3).links, gatekeeper: true },
  { id: 'P09', lane: 'kepco', gate: 'g2', axis: '전력', title: '송·변전 인프라 확인·확충', note: st(4).what, basis: st(4).source, links: st(4).links },
  { id: 'P10', lane: 'gen', gate: 'g3', axis: '전력', title: '발전 조달(PPA·자가발전·재생E)', note: st(5).what, basis: st(5).source, links: st(5).links },
  { id: 'P11', lane: 'gen', gate: 'g3', axis: '운영', title: '금융·투자 조달', note: '대규모 CAPEX 투자·금융 조달. DART 공시로 착공·투자 신호를 읽는다.', basis: '사업자 공시(DART)', links: [{ to: '/dashboard', label: '대시보드' }] },
  { id: 'P12', lane: 'biz', gate: 'g3', axis: st(6).axis, title: '냉각·용수 설계', note: st(6).what, basis: st(6).source, links: st(6).links },
  { id: 'P13', lane: 'biz', gate: 'g4', axis: '인허가', title: '착공·건설', note: '소방·정보통신공사 등 개별 인허가를 병렬 처리 후 착공.', basis: 'AIDC 특별법 통합창구·타임아웃제', links: [] },
  { id: 'P14', lane: 'gov', gate: 'g4', axis: '인허가', title: '준공·사용승인', note: st(9).what, basis: st(9).source, links: st(9).links },
  { id: 'P15', lane: 'biz', gate: 'g5', axis: st(10).axis, title: '운영(PUE·RE100·복원력)', note: st(10).what, basis: st(10).source, links: st(10).links },
]

function ProcessFrame() {
  const [selId, setSelId] = useState('P08') // 기본 선택 = 핵심 관문(계통영향평가)
  const sel = NODES.find((n) => n.id === selId) ?? NODES[0]
  const selLane = LANES.find((l) => l.id === sel.lane)
  const selGate = GATES.find((g) => g.id === sel.gate)
  const cols = `minmax(120px, 0.9fr) repeat(${GATES.length}, minmax(150px, 1fr))`

  return (
    <div className="frame-wrap">
      <div className="frame-scroll">
        <div className="swimlane" style={{ gridTemplateColumns: cols }}>
          <div className="sl-corner">
            레인 <span className="sl-slash">╲</span> 게이트
          </div>
          {GATES.map((g) => (
            <div key={g.id} className="sl-gate">
              {g.label}
            </div>
          ))}

          {LANES.map((lane) => (
            <div key={lane.id} className="sl-row" style={{ display: 'contents' }}>
              <div className="sl-lane">{lane.label}</div>
              {GATES.map((gate) => {
                const cell = NODES.filter((n) => n.lane === lane.id && n.gate === gate.id)
                return (
                  <div key={gate.id} className="sl-cell">
                    {cell.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className={`sl-node${n.id === selId ? ' active' : ''}${n.gatekeeper ? ' gate' : ''}`}
                        onClick={() => setSelId(n.id)}
                        aria-pressed={n.id === selId}
                      >
                        <span className="sl-node-head">
                          <span className="sl-node-id">{n.id}</span>
                          {n.gatekeeper && <span className="sl-badge">관문</span>}
                        </span>
                        <span className="sl-node-title">{n.title}</span>
                        <span className="sl-node-axis">{n.axis}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="frame-detail">
        <div className="fd-head">
          <span className="fd-eyebrow">노드 상세 · {sel.id}</span>
          {sel.gatekeeper && <span className="sl-badge">핵심 관문</span>}
        </div>
        <h2 className="fd-title">{sel.title}</h2>
        <div className="fd-meta">
          <span className="insight-tag">{sel.axis}</span>
          <span className="fd-path">
            {selGate?.label} · {selLane?.label}
          </span>
        </div>
        <p className="fd-note">{sel.note}</p>
        <div className="fd-basis">
          <strong>공개 근거:</strong> {sel.basis}
        </div>
        {sel.links.length > 0 && (
          <div className="fd-links">
            {sel.links.map((l) => (
              <Link key={l.to + l.label} className="btn" to={l.to}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const [mode, setMode] = useState(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('view') === 'frame'
      ? 'frame'
      : 'guide',
  ) // 'guide' | 'frame'
  useEffect(() => {
    document.title = TITLE
    setMeta('name', 'description', DESC)
    setMeta('property', 'og:title', TITLE)
    setMeta('property', 'og:description', DESC)
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'AI 데이터센터 구축 A–Z 로드맵 (한국)',
      description: DESC,
      step: STEPS.map((s) => ({ '@type': 'HowToStep', position: s.n, name: s.title, text: s.what })),
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [])

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="eyebrow">ROADMAP</div>
        <h1>AI 데이터센터 구축 A–Z 로드맵</h1>
        <p className="sub">
          한국에서 AI 데이터센터를 짓는 전 과정을 <strong>부지→전력→계통→송변전→발전 조달→냉각→리스크→네트워크→인허가→운영</strong>
          {' '}10단계로. 각 단계는 공개 규정·데이터에 근거하고, AI InfraMap의 해당 도구로 연결된다. (버지니아 QTS 백지화가
          보여주듯, 전력을 확보해도 절차 하나에서 멈춘다 — 그래서 전 과정이 하나의 지도다.)
        </p>

        <div className="seg-tabs roadmap-modes" role="tablist" aria-label="로드맵 보기 모드">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'guide'}
            className={mode === 'guide' ? 'active' : ''}
            onClick={() => setMode('guide')}
          >
            가이드 (10단계)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'frame'}
            className={mode === 'frame' ? 'active' : ''}
            onClick={() => setMode('frame')}
          >
            프로세스 프레임 (레인×게이트)
          </button>
        </div>

        {mode === 'frame' ? (
          <ProcessFrame />
        ) : (
          <ol className="roadmap">
            {STEPS.map((s) => (
              <li key={s.n} className="roadmap-step">
                <div className="rm-num">{s.n}</div>
                <div className="rm-body">
                  <div className="rm-head">
                    <span className="insight-tag">{s.axis}</span>
                    <h2 className="rm-title">{s.title}</h2>
                  </div>
                  <p className="rm-what">{s.what}</p>
                  <div className="rm-meta">
                    <span className="rm-source">공개 소스: {s.source}</span>
                    <span className="rm-links">
                      {s.links.map((l) => (
                        <Link key={l.to + l.label} className="btn" to={l.to}>
                          {l.label}
                        </Link>
                      ))}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="footer-note">
          단계 구분은 한전 송변전 건설 4단계(계획확정·사업승인·공사착수·사업완료)와 AIDC 특별법·전력계통영향평가 시범운영 공고,
          한전 기본공급약관을 참고한 공개 기준 정리입니다. 실제 사업은 부지·용량·시기에 따라 달라지며, 개별 인허가는 한전·기후에너지환경부·지자체
          최신 공고를 확인하세요. 소관 부처는 '25.10 조직개편으로 기후에너지환경부 우선 확인.
        </p>
      </main>
    </>
  )
}
