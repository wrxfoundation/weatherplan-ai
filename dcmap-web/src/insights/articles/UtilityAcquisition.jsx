import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 1차 소스: KDCC/STRABASE 1Page Focus(2026.7.7), 「데이터센터 기업은 왜 전력회사를 사들이는가」.
 * 콘텐츠 등급 ④참고·인사이트. 수치·투자자 전략은 원문 인용. */
export default function UtilityAcquisition() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        As the competitive edge in the AI data-center industry shifts from securing GPUs to{' '}
        <strong>the ability to secure power</strong>, data-center companies and investors are expanding a{' '}
        <strong>vertical-integration strategy that directly secures generation assets as well</strong>. Global
        data-center power demand is projected to more than double within two years, from <strong>31GW</strong> in 2025
        to <strong>66GW</strong> in 2027, and at major hubs in the US and Europe, grid-connection delays have emerged
        as a new business bottleneck.
      </p>

      <h2>The capital market's response — a generation-asset portfolio</h2>
      <p>
        Major infrastructure investors are buying up power plants, power-development firms, and energy storage systems
        (ESS), erasing the boundary between the data-center and energy industries.{' '}
        <strong>DigitalBridge</strong> aims for stable power through generation-asset investment,{' '}
        <strong>Blackstone</strong> for supply-chain integration through combined data-center and energy investment,{' '}
        <strong>KKR</strong> for long-term competitiveness through energy-infrastructure investment, and{' '}
        <strong>Brookfield</strong> for minimizing power risk by expanding its generation-asset portfolio. Securing
        generation assets has shifted from a matter of cutting operating costs to a core strategy for{' '}
        <strong>business continuity and supply stability</strong>.
      </p>

      <h2>A realignment of the competitive structure — from IT infrastructure to energy infrastructure</h2>
      <p>
        The grammar of competition changes entirely. Securing GPUs → <strong>securing power</strong>, purchasing power
        → <strong>securing generation assets</strong>, data-center-centered investment →{' '}
        <strong>combined data-center + energy investment</strong>, IT infrastructure →{' '}
        <strong>IT + energy infrastructure</strong>. The old flow of "secure GPUs → build DC → purchase power" is now
        being realigned into "secure power → secure generation assets → combined DC + energy." The center of gravity in
        AI-infrastructure competition has moved from computing resources to <strong>power-supply capability</strong>.
      </p>

      <h2>AI InfraMap's perspective — the coordinates of domestic vertical integration</h2>
      <p>
        The domestic version of this vertical integration is already in the data. In the{' '}
        <Link to="/stats">power-generation business license register</Link> that AI InfraMap has absorbed, 86.5% of new
        licenses are renewables, and self-generation and PPA direct-connection projects are increasing — supply-side
        evidence of data centers becoming one body with power generators. The government's three mega-projects (
        <Link to="/insights/mega-project-aidc">8.4GW</Link>) also design SMR and renewable-energy procurement together.
        This is why AI InfraMap's power axis overlays grid headroom capacity and the generation pipeline on the same
        map — because when choosing a site, <strong>how to secure power</strong> is already decided at the same time.
        The technology-and-market narrative of the same shift is covered in{' '}
        <Link to="/insights/orbital-bottleneck">"The AI Bottleneck Toll"</Link>.
      </p>
    </>
  ) : (
    <>
      <p>
        AI 데이터센터 산업의 경쟁력이 GPU 확보에서 <strong>전력 확보 능력</strong>으로 이동하면서, 데이터센터
        기업과 투자자들이 <strong>발전 자산까지 직접 확보하는 수직 통합</strong> 전략을 확대하고 있다. 글로벌
        데이터센터 전력 수요는 2025년 <strong>31GW</strong>에서 2027년 <strong>66GW</strong>로 2년 안에 두 배 이상
        늘어날 전망이고, 미국·유럽 주요 허브에서는 전력망 연결 지연이 새로운 사업 병목으로 떠올랐다.
      </p>

      <h2>자본시장의 응답 — 발전 자산 포트폴리오</h2>
      <p>
        주요 인프라 투자자들은 발전소·전력개발사·에너지저장장치(ESS)까지 사들이며 데이터센터와 에너지 산업의 경계를
        허물고 있다. <strong>DigitalBridge</strong>는 발전 자산 투자로 안정적 전력을,{' '}
        <strong>Blackstone</strong>은 데이터센터·에너지 통합 투자로 공급망 통합을, <strong>KKR</strong>은 에너지
        인프라 투자로 장기 경쟁력을, <strong>Brookfield</strong>는 발전 자산 포트폴리오 확대로 전력 리스크 최소화를
        노린다. 발전 자산 확보는 운영비 절감이 아니라 <strong>사업 지속성과 공급 안정성</strong>을 위한 핵심
        전략으로 바뀌었다.
      </p>

      <h2>경쟁 구조의 재편 — IT 인프라에서 에너지 인프라로</h2>
      <p>
        경쟁의 문법이 통째로 바뀐다. GPU 확보 → <strong>전력 확보</strong>, 전력 구매 → <strong>발전 자산 확보</strong>,
        데이터센터 중심 투자 → <strong>데이터센터+에너지 통합 투자</strong>, IT 인프라 → <strong>IT+에너지 인프라</strong>.
        과거 ‘GPU 확보 → DC 건설 → 전력 구매’였던 흐름은 이제 ‘전력 확보 → 발전 자산 확보 → DC+에너지 통합’으로
        재편된다. AI 인프라 경쟁의 중심이 컴퓨팅 자원에서 <strong>전력 공급 능력</strong>으로 이동한 것이다.
      </p>

      <h2>AI InfraMap의 관점 — 국내 수직 통합의 좌표</h2>
      <p>
        이 수직 통합의 국내판은 이미 데이터에 있다. AI InfraMap이 흡수한{' '}
        <Link to="/stats">발전사업 허가대장</Link>에서 신규 허가의 86.5%가 신재생이고, 자가발전·PPA 직결형 프로젝트가
        늘어난다 — 데이터센터가 발전사업자와 한 몸이 되는 흐름의 공급측 증거다. 정부 3대 메가프로젝트(
        <Link to="/insights/mega-project-aidc">8.4GW</Link>)도 SMR·재생E 조달을 함께 설계한다. AI InfraMap의 전력축이
        계통 여유용량과 발전 파이프라인을 같은 지도 위에 얹는 이유가 여기 있다 — 부지를 고를 때 이미{' '}
        <strong>전력을 어떻게 확보할지</strong>가 함께 결정되기 때문이다. 같은 이동의 기술·시장 서사는{' '}
        <Link to="/insights/orbital-bottleneck">‘AI 병목 통행권’</Link>에서 다뤘다.
      </p>
    </>
  )
}
