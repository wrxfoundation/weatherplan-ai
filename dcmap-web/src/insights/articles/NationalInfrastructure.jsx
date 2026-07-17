import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 1차 소스: KDCC/STRABASE Issue Focus, 「AI 인프라의 재분류…」 인포그래픽.
 * 콘텐츠 등급 ④참고·인사이트. 사건·기준 변화는 원문 인용, 국내 함의는 AI InfraMap 축으로 연결. */
export default function NationalInfrastructure() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        Data centers are being reclassified from <strong>private infrastructure</strong> centered on
        power and land into <strong>strategic assets</strong> that underpin national security and the
        economic system. The trigger was the <strong>physical attack on Middle Eastern data
        centers</strong> in March 2026 — an Iranian drone attack disrupted AWS operations in Bahrain
        and the UAE, 31 services were affected through late April, and the Abu Dhabi facility also
        suffered shrapnel damage. It was an event that confirmed cloud outages are no longer a matter
        of IT systems but <strong>can be caused by war and geopolitical conflict</strong>.
      </p>

      <h2>Rethinking Risk — from IT outage to economic-system risk</h2>
      <p>
        The very nature of data center risk has changed. Yesterday’s cyberattack has expanded into a{' '}
        <strong>physical attack</strong>, system failure into <strong>war and conflict</strong>,
        service interruption into a <strong>cloud outage</strong>, and corporate operational risk into{' '}
        <strong>economic-system risk</strong>. As AI infrastructure spreads across finance,
        manufacturing, media, and public services, data centers have begun to be recognized as{' '}
        <strong>national critical infrastructure</strong> akin to power grids, ports, and pipelines.
      </p>

      <h2>Redefining Siting Criteria — resilience and national trustworthiness</h2>
      <p>
        As a result, the criteria for siting evaluation have broadened. To the existing{' '}
        <strong>power price, land, cooling, taxation, regulation, and customer accessibility</strong>,
        one now adds <strong>air-defense systems, physical security, the stability of submarine-cable
        routes, multi-region operations, disaster-recovery speed, geopolitical risk, policy and
        diplomatic stability, and insurance costs</strong>. The axis of competition shifts from{' '}
        <strong>power competition → siting competition → resilience competition → national-trust
        competition</strong>. Rather than price and latency, customers are asking{' '}
        <strong>whether service stays up even amid conflict</strong>, and have begun writing
        multi-region and remote backup into contract terms. The fact that the Strait of Hormuz is not
        only a crude-oil shipping lane but also a key submarine-cable route linking Asia, the Gulf, and
        Europe shows that a location is, in itself, geopolitics.
      </p>

      <h2>AI InfraMap’s Perspective — Korea’s ‘national trustworthiness’ is a siting asset</h2>
      <p>
        This reclassification is double-edged for Korea. Division and proximity to military
        installations are a demerit on the <strong>risk axis</strong> (the reason AI InfraMap treats the
        military and disasters as siting risks), yet at the same time its relative policy stability and
        dense power and telecommunications infrastructure can be a{' '}
        <strong>strength in the competition over resilience and national trustworthiness</strong>. The
        Busan submarine-cable landing, the feasibility of multi-region configurations, and
        disaster-recovery systems are new siting layers that AI InfraMap will absorb going forward. If
        the competitive criterion after power and permitting is ‘resilience,’ that too is ultimately a
        matter of a single point on the map — the power-and-permitting axis continues in{' '}
        <Link to="/insights/power-permit-battle">‘Power and Permits Decide the Contest’</Link>, and the
        migration of the bottleneck in{' '}
        <Link to="/insights/orbital-bottleneck">‘The AI Bottleneck Toll’</Link>.
      </p>
    </>
  ) : (
    <>
      <p>
        데이터센터가 전력·토지 중심의 <strong>민간 인프라</strong>에서, 국가 안보와 경제 시스템을 지탱하는{' '}
        <strong>전략 자산</strong>으로 재분류되고 있다. 방아쇠는 2026년 3월 <strong>중동 데이터센터에 대한 물리적
        공격</strong>이었다 — 이란 드론 공격으로 AWS의 바레인·UAE 운영에 차질이 생겼고, 31개 서비스가 4월 말까지
        영향을 받았으며 아부다비 시설도 파편 피해를 입었다. 클라우드 장애가 더 이상 IT 시스템의 문제가 아니라{' '}
        <strong>전쟁·지정학적 충돌에 의해 발생할 수 있음</strong>을 확인한 사건이다.
      </p>

      <h2>리스크의 재인식 — IT 장애에서 경제 시스템 리스크로</h2>
      <p>
        데이터센터 리스크의 성격 자체가 바뀌었다. 과거의 사이버 공격은 <strong>물리적 공격</strong>으로, 시스템
        장애는 <strong>전쟁·분쟁</strong>으로, 서비스 중단은 <strong>클라우드 장애</strong>로, 기업 운영 리스크는{' '}
        <strong>경제 시스템 리스크</strong>로 확장됐다. AI 인프라가 금융·제조·미디어·공공서비스 전반으로 퍼지면서,
        데이터센터는 전력망·항만·송유관과 유사한 <strong>국가 핵심 기반시설</strong>로 인식되기 시작했다.
      </p>

      <h2>입지 평가 기준의 재정의 — 복원력과 국가 신뢰도</h2>
      <p>
        그 결과 입지 평가 기준이 넓어졌다. 기존의 <strong>전력 단가·토지·냉각·세제·규제·고객 접근성</strong>에,
        이제는 <strong>방공 체계·물리 보안·해저 케이블 경로 안정성·다중 리전 운영·재해 복구 속도·지정학 리스크·
        정책 외교적 안정성·보험 비용</strong>이 더해진다. 경쟁의 축은{' '}
        <strong>전력 경쟁 → 입지 경쟁 → 복원력 경쟁 → 국가 신뢰도 경쟁</strong>으로 이동한다. 고객은 가격·지연시간
        보다 <strong>충돌 상황에서도 서비스가 유지되는지</strong>를 묻고, 다중 리전·원격 백업을 계약 조건으로 넣기
        시작했다. 호르무즈 해협이 원유 수송로일 뿐 아니라 아시아·걸프·유럽을 잇는 핵심 해저 케이블 경로라는 점은,
        입지가 곧 지정학임을 보여준다.
      </p>

      <h2>AI InfraMap의 관점 — 한국의 ‘국가 신뢰도’는 입지 자산이다</h2>
      <p>
        이 재분류는 한국에 양면적이다. 분단·군사 시설 인접은 <strong>리스크 축</strong>에서 감점 요인이지만(AI InfraMap이
        군사·재해를 입지 리스크로 다루는 이유), 동시에 상대적 정책 안정성과 촘촘한 전력·통신 인프라는{' '}
        <strong>복원력·국가 신뢰도 경쟁에서 강점</strong>이 될 수 있다. 부산 해저 케이블 랜딩, 다중 리전 구성 가능성,
        재해복구 체계는 앞으로 AI InfraMap이 흡수할 새로운 입지 레이어다. 전력·허가 다음의 경쟁 기준이 ‘복원력’이라면,
        그것 역시 결국 지도 위 한 점의 문제다 — 전력·허가 축은{' '}
        <Link to="/insights/power-permit-battle">‘전력·허가가 승부를 가른다’</Link>에서, 병목의 이동은{' '}
        <Link to="/insights/orbital-bottleneck">‘AI 병목 통행권’</Link>에서 이어진다.
      </p>
    </>
  )
}
