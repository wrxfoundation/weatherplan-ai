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

const ARTICLES = {
  'power-track-40mw': {
    component: PowerTrack40mw,
    sources: [
      '한국전력공사 기본공급약관 제23조 (공급방식·전압) — 20MW/40MW 경계와 22.9kV·154kV 트랙',
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
      '오버헤드 계수 1.2·PUE 산식: 명당 GPU 계산기 구현(src/calc) — 콘텐츠 등급 ③민간 가공(공개 스펙 기반)',
    ],
  },
  'seoul-concentration': {
    component: SeoulConcentration,
    sources: [
      'KEEI 김철현·김성균(2025), 「AI 시대 데이터센터 증가의 국내 에너지 소비 시사점」 — 165개소(2024)·수도권 60%·민간 평균 17.7MW',
      '명당 시드 v0.1 (dc_centers.json, 공개 소스 집계 80곳) — 상태·지역 분포는 맵과 동일 데이터',
    ],
  },
  'land-pulse-methodology': {
    component: LandPulseMethod,
    sources: [
      'KOSIS·한국부동산원, 「지가변동률」 시군구(DT_1YL20881E)·읍면동별(DT_31501N_010) 월간 통계 — 2026.05 시점, 명당 직접 집계 (data/land_price_v0.json · land_price_dong_v0.json)',
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
  'orbital-bottleneck': {
    component: OrbitalBottleneck,
    sources: [
      'KDDC Issue Focus, 「발전소가 필요 없는 데이터센터…SpaceX가 2조 달러로 산 ‘AI 병목 통행권’」 (2026.6.16, STRABASE) — SpaceX 상장(시총 2조 달러 초과)·AI1 궤도 데이터센터 구상',
      '수치 인용: 미국 DC 전력 41GW(≈전체 원전)·IEA 2030 945TWh·미국 전기요금 2019년 대비 +42%·자본 12~24개월 vs 전력망 4~10년·MS 스리마일 835MW/Amazon X-energy 5GW SMR/Google Kairos 500MW — 원문 기준',
      '콘텐츠 등급 ④참고·인사이트 — 해외 시장 분석 재인용. 국내 함의(재생E 86.5%·비수도권 86%)는 명당 발전 허가대장 집계',
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
      '한국 근거: 3MW 초과 발전사업 허가대장 v2(2026-04-17 기준, 4,652건) — 명당 직접 파싱·집계(data/gen_licenses_v2.json). 재생E 86.5%·2024+ 허가 633건·비수도권 86%는 누적 등재 건수 기준(용량 아님), 개별 MW는 참고치',
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
    const title = `${meta.title} — 명당 AI 인사이트`
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
      author: { '@type': 'Organization', name: '명당 AI' },
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
