import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { INSIGHTS } from '../content/insights_meta.js'
import DcLocalImpact from './articles/DcLocalImpact.jsx'
import MegaProjectAidc from './articles/MegaProjectAidc.jsx'
import LiquidCoolingBrief from './articles/LiquidCoolingBrief.jsx'
import LandPulseMethod from './articles/LandPulseMethod.jsx'
import PowerTrack40mw from './articles/PowerTrack40mw.jsx'
import PsiaExemption from './articles/PsiaExemption.jsx'
import GpuToMw from './articles/GpuToMw.jsx'
import SeoulConcentration from './articles/SeoulConcentration.jsx'
import PowerPermitBattle from './articles/PowerPermitBattle.jsx'
import OrbitalBottleneck from './articles/OrbitalBottleneck.jsx'
import CoolingPlatformMA from './articles/CoolingPlatformMA.jsx'
import NationalInfrastructure from './articles/NationalInfrastructure.jsx'
import UtilityAcquisition from './articles/UtilityAcquisition.jsx'
import OceanDatacenter from './articles/OceanDatacenter.jsx'
import Market2025H2 from './articles/Market2025H2.jsx'
import LandingEdge from './articles/LandingEdge.jsx'
import PowerSupplyChain from './articles/PowerSupplyChain.jsx'
import PowerWaterMega from './articles/PowerWaterMega.jsx'
import HyperscaleJukjeon from './articles/HyperscaleJukjeon.jsx'
import PwcValueChain from './articles/PwcValueChain.jsx'
import RsquareRealEstate from './articles/RsquareRealEstate.jsx'
import GpuUtilization from './articles/GpuUtilization.jsx'
import CbreExitScarcity from './articles/CbreExitScarcity.jsx'

const ARTICLES = {
  'cbre-exit-scarcity-2026': {
    component: CbreExitScarcity,
    sources: [
      'CBRE Research 「한국 데이터센터 투자 — 공급 제약이 만드는 희소성 프리미엄과 Exit 가능성 진단」(2026.7, 45p) — 공실률 1.4%·상면임대료 25만원/kW(2019 대비 +70%)·수요구조(글로벌 CSP 54%·국내 IT 34%·우량 앵커 88% 장기임차)·전력계통영향평가 최종 승인율 1.9%·캡레이트 5.3~6.5%',
      '캡레이트/스프레드 추이(서울수도권 5.3~6.5% vs 기준금리 2.5% / 미국 NAREIT DC 리츠 2005년 13~14%→2026년 5~6%, 스프레드 5~8%p→1.5~2%p): NAREIT·CBRE Research (Figure 29·30)',
      '한국 임대차 구조(3~8년 Exit 전제 PF·램프업 0~36개월·연 2.0% 고정 인상 vs 미국 15~20년 CPI 연동)·물리적 진부화 4축(하중 2.5톤/㎡·전력밀도 40~50kW·액랭·완전설비형): CBRE Research·Vertiv (Figure 31·32·33)',
      'NVIDIA GPU 로드맵(H100 ~15kW→블랙웰 15~25kW→루빈 25~50kW→파인만 50kW+·최대 피크 250~1,000kW): Vertiv·CBRE Research (Figure 33)',
      '매수자 풀 3분류·거래사례(하남 7,340억 이지스→맥쿼리·에포크 안양 8,400억 40MW·세종텔레콤 분당 IDC)·Keppel DC REIT(2014 AUM 10억→2025 63억 싱가포르달러, 한국 아태 핵심허브 명시): Keppel DC REIT IR·CBRE Research (Figure 27·36·37·38)',
      '안산 데이터센터(수전 60MW·IT 40MW·경기 반월국가산단 원시동·Keppel 펀드 3호·2026.5 SPA·총사업비 1조·현대건설 시공·2030 서비스): Keppel DC REIT IR·CBRE Research (Figure 39)',
      'AIDC 특별법 6개 특례(인허가 일괄처리 제18조·전력계통영향평가 면제 비수도권 제19조·재생e 직접공급 제20조·시설물 설치기준 제21조·산업입지항만 제22·23조·AI DC 특구 제24·26조)·지역 전력 자급률(경북·전남 200%+·서울 12%·경기 62%): CBRE Research (Figure 34·35)',
      '한국 AI 3축(수용 확산율 증가폭 6.4%p 세계1위·인구10만명당 AI특허 14.31건·모델 출시 세계3위): AI Index 2026 (Stanford HAI)·CBRE Research (Figure 24). 맵의 공급예정·변전소 여유 레이어는 AI InfraMap 자체 집계(삼일PwC·알스퀘어 교차·한전ON 실측)',
    ],
  },
  'gpu-utilization-2026': {
    component: GpuUtilization,
    sources: [
      'IT조선 「대규모 GPU 구축하는 韓 CSP, 그 다음은… "기업·개발자 선택받아야"」(정종길 기자, 2026.7.14) — 정부 GPU 사업 2조800억·9,704장(B300·베라루빈)·국가AI컴퓨팅센터 2.5조·국내 CSP GPUaaS·네오클라우드 비교',
      'GPU 가동률: 벤처비트 리서치 전세계 100인+ 기업 기술책임자 573명 조사(자체 GPU 운영 기업 86% 가동률 50% 이하) — IT조선 재인용 / 국내 사용률 30~40%: 국내 클라우드 업계 관계자, IT조선 재인용',
      '수요-공급 갭·전기사용신청 7,343MW: 삼일PwC(2026.3)·산업부 — 본 매체 別 인사이트 및 데이터 탐색기 수록. 계산기 MW=설계 수전용량(피크)이며 가동률 할인은 AI InfraMap 자체 프레임',
    ],
  },
  'rsquare-realestate-2025': {
    component: RsquareRealEstate,
    sources: [
      '알스퀘어 리서치센터 「2025 Data Center Report」(2025.11, 49p) — 인허가·착공·준공 추이(국토교통부 건축 데이터 기반)·거래 사례·랙 임대료·개발 갈등·수급 동향',
      '거래 사례 5건(드림마크원 490억~하남 7,340억·SK AX 판교 5,068억): 알스퀘어 집계 — /data 거래 사례 탭에 수록',
      '전자파 실측(DC 6곳 평균 ICNIRP 0.4%, 병원 0.68%·호텔 1.17%): 과학기술정보통신부 2025.8~9 측정 — 알스퀘어 재인용',
      '랙 밀도(일반 IDC 7.1kW vs AIDC 30~60kW/rack): Uptime Institute·NVIDIA·Vertiv — 알스퀘어 재인용. 수도권 예비율 5%(2024): 산업통상자원부·EPSIS',
    ],
  },
  'pwc-value-chain-2026': {
    component: PwcValueChain,
    sources: [
      '삼일PwC 「한국 AI 데이터센터 산업의 현재와 투자방향: AI 인프라 Value Chain 관점의 구조적 투자 기회」(2026.3, 공개 세미나 자료 28p) — 시장규모(2.42조→10.19조)·수도권 75.3%·공급예정 21곳·5개 사업모델·그룹사 투자 현황',
      'DC 수요-공급 갭(전기사용신청 906→7,343MW vs 공급가능 776→4,718MW): 산업통상자원부 제11차 전력수급기본계획·PwC analysis — 삼일PwC 리포트 p.19·21 재인용',
      '계통영향평가 권역별 통과율(수도권 21%/비수도권 71%): 산업부 접수 195건 중 심사 33건(2024.8~2025.6) — 국민의힘 김성원 의원실·산업통상자원부·한국전력·동아일보, 삼일PwC 재인용. AI InfraMap이 별도 추적하는 한전 1차 기술검토·본심사 통계와 시점·모수 상이',
      '전력자립도·증설 계획(164→200개): 산업통상자원부·에너지경제연구원 2024 지역에너지통계연보·KDCC — 맵의 자급률은 자체 보유 KEPCO 2025 데이터 사용',
    ],
  },
  'hyperscale-jukjeon': {
    component: HyperscaleJukjeon,
    sources: [
      '용인 죽전 퍼시픽써니 데이터센터 사양(수전 100MW·IT 64MW·연면적 99,125㎡·154kV 지중인입·PUE 1.3·TIER 3·이중화 시운전·포스트텐션·2톤/㎡·글로벌 CSP 5개층 추가·43개월): 현대건설 뉴스룸(hdec.kr) — 시공사 공식',
      'PUE·TIER 정의: The Green Grid(PUE)·Uptime Institute Tier 국제표준 — 콘텐츠 등급 ④참고·인사이트(사례 해부)',
      '입지·5축 연결: AI InfraMap 자체 프레임(전력계통영향평가 ±15점·154kV 트랙·냉각 기후지수)',
    ],
  },
  'power-water-mega-2026': {
    component: PowerWaterMega,
    sources: [
      '3대 메가프로젝트 국민보고회(2026.6.29): 광주·전남 반도체 800조·팹 4기·6.3GW·하루 65만t 공업용수 / 전국 AI DC 1000조·2035 — 주간조선 2915호',
      '용인 반도체 국가산단 현황(토지보상 45%·조속재결 35%·LH 공백 / 9.3GW·1단계 3GW LNG 자체조달·북천안 송전 40km·한강수계 복선화 관로): 주간조선 2916호(2026.7.5) 현장 취재',
      '제11차 전력수급기본계획 실무안(용인 전력공급 확정)·제12차 전력수급기본계획(하반기)·지역별/DC 전용 전기요금제 — 콘텐츠 등급 ④참고·인사이트(보도 종합)',
    ],
  },
  'power-supply-chain': {
    component: PowerSupplyChain,
    sources: [
      '전력계통 구조(발전→송전 765/345kV→변전 154kV+→DC 수전)·DC 내부 가동(수전·UPS·냉각·컴퓨트·네트워크): 전력공학 통용 지식 — 콘텐츠 등급 ③민간 가공',
      '변전소 788개(345kV 122·765kV 9): 한전 변전설비현황(2026.7) · 154kV+ 변전소 좌표 841개: OpenStreetMap/OpenInfraMap export',
      '계통 공급여유(시도별)·DC 전력공급 가능판정율(수도권 46%/비수도권 84%): 한전 연계가능용량(2027)·전력계통영향평가 1차 기술검토(2026.3) — AI InfraMap 집계',
    ],
  },
  'landing-edge': {
    component: LandingEdge,
    sources: [
      '수도권 계통 포화·신규 송변전 리드타임(7년+): 한전 송변전 건설 정보공개 플랫폼·전력계통 공개 보도 종합 — AI InfraMap 자체 정리',
      '해저케이블 육양국(부산 송정·거제 등)·글로벌 랜딩에지 사례(마르세유·버지니아 비치): 공개 해저케이블 지도·산업 공개 자료 기반 자체 분석 — 콘텐츠 등급 ④참고·인사이트',
      '±15점·비수도권 면제: 기후에너지환경부 공고 제2025-139호·AIDC 특별법 / 2025 신규 발전 설치 비수도권 86.5%: data/new_plants_2025_v0.json',
    ],
  },
  'power-track-40mw': {
    component: PowerTrack40mw,
    sources: [
      '한국전력공사 기본공급약관 제23조 (공급방식·전압) — 10MW/40MW 경계와 22.9kV·154kV 트랙',
      '수수료: 전력계통영향평가 시범운영 공고(기후에너지환경부 공고 제2025-139호) 기준 사전검토·기술검토 수수료 합산',
      '정량 룰 파일: data/power_rules_v0.json · docs/power-licensing-rulebook-v0.md — 콘텐츠 등급 ①법령·고시',
    ],
  },
  'psia-exemption-2027': {
    component: PsiaExemption,
    sources: [
      '전력계통영향평가 시범운영: 기후에너지환경부 공고 제2025-139호 (10MW 기준·지역 배점·절차)',
      'AI데이터센터 특별법: 비수도권 일정 규모 이하 계통영향평가 면제, 2027.2 시행 — 규모 기준은 대통령령 위임(미정, 추적 중)',
      '345kV 여유 변전소 정보 공개 예고: 산업통상부 참고자료(2026.6.29) — 콘텐츠 등급 ①법령·고시',
    ],
  },
  'gpu-to-mw': {
    component: GpuToMw,
    sources: [
      'GPU 보드 전력: NVIDIA 공개 스펙 (H100/H200 ~0.7kW · B200 ~1.0kW · GB200 슈퍼칩 ~1.2kW)',
      '오버헤드 계수 1.2·PUE 산식: AI InfraMap GPU 계산기 구현(src/calc) — 콘텐츠 등급 ③민간 가공(공개 스펙 기반)',
    ],
  },
  'seoul-concentration': {
    component: SeoulConcentration,
    sources: [
      'KEEI 김철현·김성균(2025), 「AI 시대 데이터센터 증가의 국내 에너지 소비 시사점」 — 165개소(2024)·수도권 60%·민간 평균 17.7MW',
      'AI InfraMap 시드 v0.1 (dc_centers.json, 공개 소스 집계 80곳) — 상태·지역 분포는 맵과 동일 데이터',
    ],
  },
  'land-pulse-methodology': {
    component: LandPulseMethod,
    sources: [
      'KOSIS·한국부동산원, 「지가변동률」 시군구(DT_1YL20881E)·읍면동별(DT_31501N_010) 월간 통계 — 2026.05 시점, AI InfraMap 직접 집계 (data/land_price_v0.json · land_price_dong_v0.json)',
      '방법론 문서: docs/land-price-tracking.md — 읍면동 승격 파이프라인(scripts/land_dong.mjs)과 정직성 규칙',
    ],
  },
  'liquid-cooling-brief': {
    component: LiquidCoolingBrief,
    sources: [
      'OCP Educational Webinar, Compact Thermal Management Solutions for High-Density AI Data Centers (Parker Hannifin, 2025.6.26) — 공개 기술 자료',
      'GPU TDP 한계선·유량(1.5→0.3L/min per kW)·시장 전망(2030년 ~149억 달러)·PFAS 과제: 상기 웨비나 자료 기준 — 콘텐츠 등급 ④참고·인사이트',
    ],
  },
  'national-infrastructure': {
    component: NationalInfrastructure,
    sources: [
      'KDCC/STRABASE Issue Focus, 「AI 인프라의 재분류, 데이터센터는 언제 국가 핵심 인프라가 되었나」 (인포그래픽)',
      '사건: 2026년 3월 이란 드론 공격으로 AWS 바레인·UAE 운영 차질·31개 서비스 영향(4월 말 기준)·Pure Data Centres 아부다비 파편 피해 — 원문 기준',
      '기준 변화(리스크 재인식·입지 평가 재정의·복원력/국가 신뢰도 경쟁): 원문 인용. 콘텐츠 등급 ④참고·인사이트 — 국내 함의는 AI InfraMap 해석',
    ],
  },
  'utility-acquisition': {
    component: UtilityAcquisition,
    sources: [
      'KDCC/STRABASE 1Page Focus, 「데이터센터 기업은 왜 전력회사를 사들이는가」 (2026.7.7)',
      '수치: 글로벌 DC 전력 수요 2025년 31GW→2027년 66GW(2년 2배)·투자자 발전자산 확보 전략(DigitalBridge·Blackstone·KKR·Brookfield) — 원문 기준',
      '콘텐츠 등급 ④참고·인사이트 — 국내 수직 통합 함의는 AI InfraMap 발전 허가대장 집계와 연결',
    ],
  },
  'orbital-bottleneck': {
    component: OrbitalBottleneck,
    sources: [
      'KDDC Issue Focus, 「발전소가 필요 없는 데이터센터…SpaceX가 2조 달러로 산 ‘AI 병목 통행권’」 (2026.6.16, STRABASE) — SpaceX 상장(시총 2조 달러 초과)·AI1 궤도 데이터센터 구상',
      '수치 인용: 미국 DC 전력 41GW(≈전체 원전)·IEA 2030 945TWh·미국 전기요금 2019년 대비 +42%·자본 12~24개월 vs 전력망 4~10년·MS 스리마일 835MW/Amazon X-energy 5GW SMR/Google Kairos 500MW — 원문 기준',
      '콘텐츠 등급 ④참고·인사이트 — 해외 시장 분석 재인용. 국내 함의(재생E 86.5%·비수도권 86%)는 AI InfraMap 발전 허가대장 집계',
    ],
  },
  'market-2025h2': {
    component: Market2025H2,
    sources: [
      'Cushman & Wakefield · KDCC, Korea Data Centre Market Report 2H 2025 — 수도권 운영 601MW(+16%)·파이프라인 921MW(+43%)·운영사 25/DC 55·기타권역 31%·공실 6.9%',
      '정책: 2025.11 전력계통영향평가 개편(적정전압 필수·비기술평가 강화·입지별 ±15점·자가발전/에너지효율 의무 정량화·기술검토비 신설) · 2025.9 국가기간 전력망 확충 특별법 시행 — 원문 기준',
      '콘텐츠 등급 ②공식 발간물 — 시장 수치·정책은 원문 인용, 국내 함의는 AI InfraMap 해석',
    ],
  },
  'ocean-datacenter': {
    component: OceanDatacenter,
    sources: [
      'KDCC/STRABASE Issue Focus, 「데이터센터는 왜 바다로 이동하는가」 (2026.6.23)',
      '사례: 상하이 앞바다 수중 DC ~2,000서버(해상풍력 직결·해수 냉각, 2026.5) · 피터 틸 부유식 DC 스타트업 1.4억 달러 투자(평가 10억 달러 근접) · Microsoft Project Natick — 원문 기준',
      '콘텐츠 등급 ④참고·인사이트 — 국내 함의(해상풍력·연안 입지)는 AI InfraMap 해석',
    ],
  },
  'cooling-platform-ma': {
    component: CoolingPlatformMA,
    sources: [
      'KDDC Issue Focus, 「액체냉각 M&A가 촉발한 AI 데이터센터 냉각 플랫폼 경쟁…Ecolab의 CoolIT 인수 사례 분석」 (2026.7.7, STRABASE)',
      '거래 내용: Ecolab(NYSE:ECL)의 CoolIT Systems 인수 47.5억 달러(2026.7.2 완료)·CoolIT 향후 12개월 매출 ~5.5억 달러·Ecolab Global High-Tech TAM 50억→100억 달러 — 원문 기준',
      '콘텐츠 등급 ④참고·인사이트 — 해외 M&A 분석 재인용',
    ],
  },
  'power-permit-battle': {
    component: PowerPermitBattle,
    sources: [
      '글로벌이코노믹 김주원(2026.7.6), 「AI 데이터센터, 이제는 ‘전력·허가’가 승부 가른다」 — Oilprice(2026.7.4) 재인용, QTS 디지털 게이트웨이 백지화·4대 투자 신호(청정E 확보율·송전망 유연성·임대료 상승률·LCOE)',
      '한국 근거: 3MW 초과 발전사업 허가대장 v2(2026-04-17 기준, 4,652건) — AI InfraMap 직접 파싱·집계(data/gen_licenses_v2.json). 재생E 86.5%·2024+ 허가 633건·비수도권 86%는 누적 등재 건수 기준(용량 아님), 개별 MW는 참고치',
      '콘텐츠 등급 ④참고·인사이트 — 해외 사례는 언론 재인용, 국내 수치는 1차 대장 집계',
    ],
  },
  'mega-project-aidc': {
    component: MegaProjectAidc,
    sources: [
      '산업통상부 참고자료, 「대한민국 대도약 3대 메가프로젝트 국민보고회」 개최 (2026.6.29)',
      '대한민국 정책브리핑(korea.kr), AI데이터센터 규제 확 푼다…인허가 절차 대폭 단축 (2026.5.8, 과학기술정보통신부)',
      '헤럴드경제, SK·삼성·앰코, 서남권 반도체·데이터센터에 896조원 투자 (2026.6.30)',
      '연합뉴스, 산업부, 산단 지원사업 10개 선정 (2026.7.10) · 뉴시스/KITA, 초광역산업협력과 신설 (2026.7.9)',
      '실행 리스크 프레임 재인용: 커넥트 기고(2026.6.30) — 콘텐츠 등급 ④참고·인사이트',
    ],
  },
  'dc-local-impact': {
    component: DcLocalImpact,
    sources: [
      'Dany Bahar & Greg Wright, 데이터센터의 지역 고용 효과 연구 (미국)',
      '미국 데이터센터 물 사용량·라우던 카운티 재산세: 미국 공개 통계·현지 보도',
      '재인용 경로: 서진호(AI 산업 전문가) 칼럼, 커넥트, 2026.7 — 콘텐츠 등급 ④참고·인사이트',
    ],
  },
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function InsightPage() {
  const { slug } = useParams()
  const meta = INSIGHTS.find((a) => a.slug === slug)
  const article = ARTICLES[slug]

  useEffect(() => {
    if (!meta) return
    const title = `${meta.title} — AI InfraMap 인사이트`
    document.title = title
    setMeta('name', 'description', meta.description)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', meta.description)
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: meta.title,
      description: meta.description,
      datePublished: meta.date,
      author: { '@type': 'Organization', name: 'AI InfraMap' },
    })
    document.head.appendChild(script)
    return () => script.remove()
  }, [meta])

  if (!meta || !article) {
    return (
      <>
        <TopBar />
        <main className="page">
          <h1>아티클을 찾을 수 없습니다</h1>
          <p className="sub">
            <Link className="back-link" to="/insights">
              ← 인사이트 목록
            </Link>
          </p>
        </main>
      </>
    )
  }

  const Body = article.component
  return (
    <>
      <TopBar />
      <main className="page">
        <Link className="back-link" to="/insights">
          ← 인사이트
        </Link>
        <div className="eyebrow">INSIGHT</div>
        <h1>{meta.title}</h1>
        <p className="sub">{meta.date}</p>
        <div className="prose">
          <Body />
        </div>
        <p className="footer-note">
          출처
          <br />
          {article.sources.map((s) => (
            <span key={s}>
              · {s}
              <br />
            </span>
          ))}
          본 아티클은 공개 연구·보도에 기반한 참고·인사이트 콘텐츠이며, 시설 데이터(현황 맵)와 분리 관리됩니다.
        </p>
      </main>
    </>
  )
}
