import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 1차 소스: 주간조선 2916호(2026.7.5, 용인 반도체 메가 클러스터)·2915호(2026.6.29, 3대 메가프로젝트 국민보고회).
 * 정부 발표·현장 취재 인용. 콘텐츠 등급 ④참고·인사이트(보도 종합). 수치·정책은 원문 인용. */
export default function PowerWaterMega() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        At the June 29, 2026 national briefing on the "Republic of Korea Great Leap Three Mega-Projects" at the
        presidential office, Samsung Electronics and SK hynix announced they would invest <strong>800 trillion
        won</strong> in Gwangju and Jeonnam to build four cutting-edge semiconductor fabs, while SK, GS, Naver and
        others would invest <strong>more than 1,000 trillion won</strong> by 2035 to build{' '}
        <strong>gigawatt (GW)-class AI data centers</strong> across the country. The government said it would supply
        water and power "under national responsibility." Yet the success or failure of this vast blueprint converges
        on two things — <strong>water and electricity</strong>. This is why AI InfraMap, from the outset, placed
        power and water as hard gates in site evaluation among its five axes (power, land, risk, network, climate).
      </p>

      <h2>The bottleneck in numbers — 6.3GW, 650,000 tons per day</h2>
      <p>
        The government stated that the Honam-region semiconductor cluster requires <strong>6.3GW</strong> of power
        and <strong>650,000 tons of industrial water per day</strong>. The plan is to cover power with renewables,
        nuclear, and LNG, and water with <strong>dam surplus, power-plant water, and reused wastewater</strong>.
        Presidential Chief of Staff Kang Hoon-sik said that "if we efficiently connect water sources that can
        already be secured, supply of <strong>more than 1 million tons per day</strong> is possible." The crux is
        not "possible" but "on time" — coordination with existing residential and agricultural water, drought
        response, and the lead time for large-scale transmission grids all remain. AI InfraMap's{' '}
        <Link to="/">point analysis</Link> showing cooling-water (industrial water) conditions via the{' '}
        <strong>storage capacity of the nearest multipurpose and industrial-water dams</strong> and{' '}
        <strong>intake and purification facility capacity (K-water national waterworks information)</strong> is
        meant to answer the same question.
      </p>

      <h2>The Yongin paradox — "power and water were never the problem"</h2>
      <p>
        The Yongin national industrial complex, designated alongside Pyeongtaek as a "semiconductor mega-cluster" in
        2023, got tripped up by the "move it to Honam" argument. But the cause of delay the field points to is not
        power or water — <strong>land compensation is only about 45% agreed and complete</strong>, about 35% is
        under expedited-ruling applications to the Central Land Expropriation Committee, and on top of that came the{' '}
        <strong>vacancy of LH's president and vice president</strong> as executing entity. Power and water, in fact,
        have finished administrative and technical review. Of the total <strong>9.3GW</strong> required, the
        phase-1 portion is <strong>self-supplied by a 3GW LNG plant within the complex</strong>, and the shortfall
        needs only <strong>about a 40km additional connection</strong> from the high-capacity transmission line that
        already reaches Bukcheonan in Chungnam (reflected in the working draft of the 11th Basic Plan for Electricity
        Supply and Demand). For water too, a <strong>twin-line pipeline using the Han River watershed has been
        finalized</strong>, and detailed design for integrated water supply phases 1 and 2 is complete or underway.
        The lesson is clear — <strong>the real bottleneck of a mega-cluster is often not generation capacity but
        procedure, land, and governance</strong>. The gateways across the entire pre-construction process are
        confirmed step by step in the process frame of the <Link to="/roadmap">A–Z roadmap</Link>.
      </p>

      <h2>Gwangju is no better than Yongin either — the RE100 wall</h2>
      <p>
        <strong>RE100</strong>, the core card of the relocation argument, hits a wall of reality in Honam as well.
        Solar, the key renewable source in this area, generates only <strong>around 4 hours</strong> per day on
        average, and monsoons, intermittency, and instability are fatal. The industry consensus is that the ESS
        needed to fill this gap is premature due to cost and fire risk. Minister of Climate, Energy and Environment
        Kim Sung-hwan has also shifted his position toward a <strong>mixed power supply</strong> that "mobilizes
        every energy source — solar, wind, nuclear, SMR, and even the hydrogen conversion of LNG." This is why AI
        InfraMap keeps proximity to renewable generation complexes only as a "reference signal" for RE100
        procurement and <strong>does not include it in the 100-point total</strong> — because proximity does not
        equal 24/7 procurement (<Link to="/insights/utility-acquisition">why they are buying up power
        companies</Link>).
      </p>

      <h2>Signals reaching AI data centers — regional and DC-dedicated electricity tariffs</h2>
      <p>
        This announcement explicitly stated the introduction of a <strong>regional electricity tariff</strong> and a{' '}
        <strong>data-center-dedicated electricity tariff</strong> to supply power to AI data centers. Regional
        differentiated tariffs under the "local production for local consumption (jisan-jiso)" principle cement the
        incentive for non-capital siting into policy, and this points in exactly the same direction as the ±15-point
        grid impact assessment overhaul and the AIDC special act's non-capital exemption (<Link to="/insights/market-2025h2">the
        ±15-point era</Link>). In other words, an <strong>era in which the electricity tariff decides the site</strong>{' '}
        opens simultaneously on both the semiconductor and AI sides. The specifics are to be contained in the{' '}
        <strong>12th Basic Plan for Electricity Supply and Demand</strong> to be announced in the second half of the
        year, with transmission grid and nuclear expansion cited as remaining tasks.
      </p>

      <h2>AI InfraMap's perspective — bringing the blueprint down to the site level</h2>
      <p>
        800 trillion and 1,000 trillion are nation-scale numbers, but the actual success or failure is decided by{' '}
        <strong>the power interconnection headroom, water intake, and risk of each individual site</strong>. AI
        InfraMap brings that blueprint down to coordinates — overlaying, on one screen, the nation's{' '}
        <Link to="/power">substations, grid supply headroom, and DC supply-feasibility determination rates</Link>,
        the nearest <strong>multipurpose and industrial-water dams and waterworks intake and purification facility
        capacity</strong>, and the direction of policy and data heading toward the non-capital region. It is a tool
        that asks whether the very water and electricity the government promised to "supply without disruption"{' '}
        <strong>actually reach a specific site</strong>. Related context continues in the{' '}
        <Link to="/insights/power-supply-chain">power supply chain schematic</Link> and{' '}
        <Link to="/insights/power-permit-battle">power and permitting as the battleground</Link>.
      </p>
    </>
  ) : (
    <>
      <p>
        2026년 6월 29일 청와대 ‘대한민국 대도약 3대 메가프로젝트’ 국민보고회에서 삼성전자·SK하이닉스는 광주·전남에{' '}
        <strong>800조원</strong>을 투자해 최첨단 반도체 팹 4기를, SK·GS·네이버 등은 2035년까지 <strong>1,000조원 이상</strong>을
        투자해 전국에 <strong>기가와트(GW)급 AI 데이터센터</strong>를 짓겠다고 발표했다. 정부는 물과 전력을 “국가가 책임지고
        공급”하겠다고 했다. 그러나 이 거대한 청사진의 성패는 단 두 글자로 수렴한다 — <strong>물과 전기</strong>. AI InfraMap이
        처음부터 5축(전력·토지·리스크·네트워크·기상) 중 전력·용수를 부지 평가의 하드 게이트로 둔 이유가 여기 있다.
      </p>

      <h2>숫자로 본 병목 — 6.3GW·하루 65만t</h2>
      <p>
        정부가 밝힌 호남권 반도체 클러스터의 소요는 전력 <strong>6.3GW</strong>, 공업용수 <strong>하루 65만t</strong>이다. 전력은
        재생에너지·원전·LNG로, 용수는 <strong>댐 여유량·발전용수·하수 재이용수</strong>로 충당한다는 구상이다. 강훈식 대통령비서실장은
        “이미 확보 가능한 수원을 효율적으로 연결하면 <strong>하루 100만t 이상</strong> 공급이 가능하다”고 했다. 관건은 ‘가능’이
        아니라 ‘적기’다 — 기존 생활·농업용수와의 조정, 가뭄 대응, 대규모 송전망 리드타임이 남는다. AI InfraMap의{' '}
        <Link to="/">지점 분석</Link>이 냉각수(용수) 여건을 <strong>최근접 다목적·용수댐 저수용량</strong>과{' '}
        <strong>취수·정수 시설용량(K-water 국가상수도정보)</strong>으로 보여주는 것도 같은 질문에 답하기 위해서다.
      </p>

      <h2>용인의 역설 — “전력·용수는 원래 문제없었다”</h2>
      <p>
        2023년 평택과 함께 ‘반도체 메가 클러스터’로 낙점된 용인 국가산단은 ‘호남 이전론’에 발목이 잡혔다. 그러나 현장이 지목하는
        지연의 원인은 전력·용수가 아니다 — <strong>토지보상이 전체의 약 45%만 협의 완료</strong>, 약 35%가 중앙토지수용위 조속
        재결 신청, 여기에 시행 주체 <strong>LH의 사장·부사장 공백</strong>이 겹쳤다. 정작 전력·용수는 행정·기술 검토가 끝난
        상태다. 총 <strong>9.3GW</strong> 소요 중 1단계 분량은 산단 내 <strong>3GW LNG 발전소로 자체 조달</strong>하고, 부족분은
        충남 북천안까지 들어온 대전력 송전선로에서 <strong>약 40㎞만 추가 연결</strong>하면 된다(제11차 전력수급기본계획 실무안
        반영). 용수도 한강 수계를 활용한 <strong>복선화 관로가 확정</strong>돼 통합 용수공급 1·2단계 실시설계가 완료·진행 중이다.
        교훈은 분명하다 — <strong>메가 클러스터의 실제 병목은 발전용량이 아니라 절차·부지·거버넌스</strong>일 때가 많다. 구축 전
        과정의 관문은 <Link to="/roadmap">A–Z 로드맵</Link>의 프로세스 프레임에서 단계별로 확인된다.
      </p>

      <h2>광주가 용인보다 낫지도 않다 — RE100의 벽</h2>
      <p>
        이전론의 핵심 카드인 <strong>RE100</strong>은 호남에서도 현실의 벽에 부딪힌다. 이 일대 핵심 재생원인 태양광은 하루 평균
        발전이 <strong>4시간 내외</strong>에 불과하고, 장마·간헐성·불안정성이 치명적이다. 이를 메울 ESS는 비용·화재 위험으로
        시기상조라는 게 업계 중론이다. 김성환 기후에너지환경부 장관도 “태양광·풍력·원전·SMR·LNG의 수소 전환까지 모든 에너지원을
        총동원”하는 <strong>혼합형 전력 공급</strong>으로 입장을 옮겼다. AI InfraMap이 재생발전단지 근접을 RE100 조달 ‘참고
        신호’로만 두고 <strong>100점 총점에 넣지 않는</strong> 이유가 이것이다 — 근접이 곧 24/7 조달은 아니기 때문이다(
        <Link to="/insights/utility-acquisition">전력회사를 사들이는 이유</Link>).
      </p>

      <h2>AI 데이터센터로 오는 신호 — 지역별·DC 전용 전기요금</h2>
      <p>
        이번 발표에서 AI 데이터센터 전력 공급을 위해 <strong>지역별 전기요금제</strong>와 <strong>데이터센터 전용 전기요금제</strong>
        도입이 명시됐다. ‘지산지소(地産地消)’ 원칙의 지역 차등 요금은 비수도권 입지 유인을 제도로 못박는 것이며, 이는 계통영향평가
        ±15점 개편·AIDC 특별법 비수도권 면제와 정확히 같은 방향이다(<Link to="/insights/market-2025h2">±15점 시대</Link>). 즉
        <strong> 전기요금이 입지를 결정하는 시대</strong>가 반도체·AI 양쪽에서 동시에 열린다. 구체안은 하반기 발표될{' '}
        <strong>제12차 전력수급기본계획</strong>에 담길 예정이며, 송전망·원전 확충이 남은 과제로 지목됐다.
      </p>

      <h2>AI InfraMap의 관점 — 청사진을 부지 단위로 내린다</h2>
      <p>
        800조·1,000조는 국가 단위 숫자지만, 실제 성패는 <strong>부지 하나하나의 전력 접속 여유·용수 인입·리스크</strong>에서
        갈린다. AI InfraMap은 그 청사진을 좌표로 내린다 — 전국 <Link to="/power">변전소·계통 공급여유·DC 공급 가능판정율</Link>,
        최근접 <strong>다목적·용수댐과 상수도 취수·정수 시설용량</strong>, 그리고 비수도권으로 향하는 정책·데이터의 방향을 한
        화면에서 겹친다. 정부가 “차질 없이 공급”을 약속한 그 물과 전기가 <strong>특정 부지에 실제로 도달하는지</strong>를 묻는
        도구다. 관련 맥락은 <Link to="/insights/power-supply-chain">전력공급 사슬 전개도</Link>와{' '}
        <Link to="/insights/power-permit-battle">전력·허가가 승부처</Link>에서 이어진다.
      </p>
    </>
  )
}
