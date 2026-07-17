import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 1차 소스: Cushman & Wakefield / KDCC, Korea Data Centre Market Report 2H 2025.
 * 콘텐츠 등급 ②공식 발간물. 수치·정책은 원문 인용. */
export default function Market2025H2() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        In the second half of 2025, the Seoul Capital Area data-center market
        recorded operating capacity of <strong>601MW</strong> (+16% YoY) and a
        development pipeline of <strong>921MW</strong> (<strong>+43%</strong>{' '}
        YoY). With the capital region’s power-availability constraints and high
        land costs, <strong>decentralization of development accelerated</strong>,
        and the pipeline share of other regions expanded to about{' '}
        <strong>31%</strong>. AI-infrastructure demand is pushing a market
        realignment — as part of ‘Stargate,’ OpenAI is advancing a domestic
        AI-dedicated DC in cooperation with Samsung Electronics and SK hynix (led
        by SKT, with Samsung SDS designing, building, and operating), and AWS has
        signaled $5 billion for an AI-specialized center.
      </p>

      <h2>Policy pushes the capital area out — the ±15-point PSIA overhaul</h2>
      <p>
        The <strong>Power System Impact Assessment</strong>, overhauled in
        November 2025, went beyond technical requirements to{' '}
        <strong>
          sharply strengthen non-technical evaluation such as regional
          acceptance and policy alignment
        </strong>
        . The core is that it sets <strong>maintaining proper voltage as a
        mandatory requirement</strong> and, depending on location, awards{' '}
        <strong>a maximum of ±15 points</strong> to curb capital-area
        concentration. Self-generation and energy-efficiency obligations were
        quantified, and a <strong>technical-review fee was newly established</strong>{' '}
        to prevent indiscriminate review applications, making operators’
        pre-review responsibility heavier. Meanwhile, the{' '}
        <strong>‘National Backbone Power Grid Expansion Special Act’</strong>,
        enforced in September, supports early grid buildout through streamlined
        permitting by a committee under the Prime Minister and environmental-impact-assessment
        special provisions — a device that unclogs the infrastructure bottleneck
        of non-capital development.
      </p>

      <h2>AI InfraMap’s view — ‘where’ became a score</h2>
      <p>
        The ±15-point adjustment is not an abstraction but a declaration that{' '}
        <strong>location is itself a score</strong>. This is exactly the same
        axis as the power-axis regional risk handled by AI InfraMap’s{' '}
        <Link to="/"> point analysis</Link> — the capital area is in the
        deduction direction, and the non-capital belt where generation headroom
        and renewable-energy supply are concentrated is in the award direction (
        <Link to="/power">power map</Link>). The 31% pipeline decentralization
        points to the same place as the 86% non-capital skew in the
        generation-permit register (<Link to="/stats">statistics</Link>). Add the
        National Backbone Power Grid Special Act, and even before the 2027
        enforcement of the AIDC Special Act, <strong>the shift toward
        non-capital regions is already underway on both the policy and data
        sides</strong>. The full buildout process continues in the{' '}
        <Link to="/roadmap">A–Z roadmap</Link>, and the reading of permitting in
        the <Link to="/insights/psia-exemption-2027">grid impact assessment and
        special provisions</Link>.
      </p>
    </>
  ) : (
    <>
      <p>
        2025년 하반기 수도권 데이터센터 시장은 운영 용량 <strong>601MW</strong>(전년比 +16%), 개발 파이프라인{' '}
        <strong>921MW</strong>(전년比 <strong>+43%</strong>)를 기록했다. 수도권 전력 가용성 제한과 높은 토지비로
        개발의 <strong>탈중심화가 가속</strong>돼, 기타 권역 파이프라인 비중이 약 <strong>31%</strong>까지 확대됐다.
        AI 인프라 수요가 시장 재편을 밀어붙인다 — OpenAI가 ‘Stargate’의 일환으로 삼성전자·SK하이닉스와 협력해
        국내 AI 전용 DC를 추진(SKT 주도·삼성SDS 설계·구축·운영)하고, AWS는 AI 특화 센터에 50억 달러를 예고했다.
      </p>

      <h2>정책이 수도권을 밀어낸다 — 계통영향평가 ±15점 개편</h2>
      <p>
        2025년 11월 개편된 <strong>전력계통영향평가</strong>는 기술 요건을 넘어 <strong>지역 수용성·정책 부합성 등
        비기술 평가를 대폭 강화</strong>했다. 핵심은 <strong>적정전압 유지를 필수 요건</strong>으로 두고, 입지에 따라
        <strong> 최대 ±15점의 가감점</strong>을 부여해 수도권 집중을 억제한다는 점이다. 자가발전·에너지 효율화 의무가
        정량화됐고, 무분별한 검토 신청을 막는 <strong>기술검토비용이 신설</strong>돼 사업자의 사전 검토 책임이
        무거워졌다. 한편 9월 시행된 <strong>‘국가기간 전력망 확충 특별법’</strong>은 국무총리 산하 위원회의 인허가
        간소화·환경영향평가 특례로 전력망 조기 구축을 지원 — 비수도권 개발의 인프라 병목을 푸는 장치다.
      </p>

      <h2>AI InfraMap의 관점 — ‘어디에’가 점수가 됐다</h2>
      <p>
        ±15점 가감점은 추상이 아니라 <strong>입지가 곧 점수</strong>가 됐다는 선언이다. 이는 AI InfraMap의
        <Link to="/"> 지점 분석</Link>이 다루는 전력축 지역 리스크와 정확히 같은 축이다 — 수도권은 감점, 발전 여유·
        재생E 공급이 몰린 비수도권 벨트는 가점 방향이다(<Link to="/power">전력지도</Link>). 파이프라인 탈중심화 31%는
        발전 허가대장의 비수도권 86% 쏠림(<Link to="/stats">통계</Link>)과 같은 곳을 가리킨다. 국가기간 전력망
        특별법까지 더하면, 2027년 AIDC 특별법 시행 전부터 이미 <strong>비수도권으로의 이동은 정책·데이터 양쪽에서
        진행 중</strong>이다. 구축 전 과정은 <Link to="/roadmap">A–Z 로드맵</Link>에서, 인허가 독법은{' '}
        <Link to="/insights/psia-exemption-2027">계통영향평가·특례</Link>에서 이어진다.
      </p>
    </>
  )
}

