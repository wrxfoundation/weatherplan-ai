import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 1차 소스: 글로벌이코노믹(2026.7.6, Oilprice 재인용) — QTS 디지털 게이트웨이 백지화·4대 투자 신호.
 * 한국 근거: AI InfraMap D1 발전 허가대장 v2(2026-04-17) 자체 집계. 콘텐츠 등급 ④참고·인사이트. */
export default function PowerPermitBattle() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        A data center campus once pursued as the largest in the world was <strong>scrapped before it could even
        break ground</strong>. It was Blackstone-affiliated QTS's <strong>"Digital Gateway"</strong> planned for
        Prince William County, Virginia — a 2,100-acre (about 1,100 soccer fields), 37-building project with a total
        cost of $100 billion (about 153 trillion won). The three-year courtroom battle ended when co-developer
        Compass dropped its lawsuit in April and QTS withdrew its July appeal. What brought the project down was
        neither money nor technology. It was <strong>resident opposition, a saturated grid, and a seemingly trivial
        procedural defect</strong>.
      </p>

      <h2>A single procedural step halted 153 trillion won</h2>
      <p>
        The Virginia Court of Appeals ruled the rezoning approval void, finding that when the county published the
        notice of the resident public hearing in the newspaper it failed to observe the <strong>six-day interval
        clause</strong> required by state law. It is a case showing that in large infrastructure, <strong>a region's
        legal and procedural risk is itself investment risk</strong>. This is exactly why AI InfraMap treats zoning
        and permitting procedures in site analysis with as much weight as power — even if you secure the power, a
        single <Link to="/glossary">permitting procedure</Link> can halt the entire project.
      </p>

      <h2>"Bring your own generator" — becoming an industry that secures power</h2>
      <p>
        The power demand of a single hyperscale building is typically 100–300MW, but AI-specialized clusters surge
        to the <strong>1GW (1,000MW) scale</strong>. A single campus uses power on par with an entire mid-sized
        city. While transmission grid expansion takes 5–10 years, utilities have begun telling developers to
        outright <strong>bring their own generators</strong>. Big Tech is <strong>effectively becoming a power
        generator</strong>, building on-site gas plants, SMRs, and large ESS directly or wiring PPAs straight in.
        The AI infrastructure race has changed in character from an industry that plugs in servers to{' '}
        <strong>an industry that secures power</strong>.
      </p>

      <h2>Avoiding greenfield, toward existing assets — the movement of capital</h2>
      <p>
        As permitting and power risks soared, global capital avoids bare-land (greenfield) development and rushes
        toward <strong>brownfield (existing assets) where power is already secured</strong>. In May, Blackstone
        listed its "Digital Infrastructure Trust," raising $1.75 billion, and concentrates on acquiring safe,
        fully-leased assets. The more new supply is blocked, the greater the{' '}
        <strong>premium on assets that already hold power</strong>.
      </p>

      <h2>Four investment signals that will decide the lead</h2>
      <p>The direction of this market should be read not by the scale of server expansion but by power-capability metrics.</p>
      <ol>
        <li>
          <strong>Clean energy procurement rate</strong> — the degree to which environmental regulation and power
          shortage risk are diversified. AI InfraMap approximates this by regional renewable-energy supply pipeline
          (below).
        </li>
        <li>
          <strong>Transmission grid capacity flexibility</strong> — identifying spare regions that can substitute
          for saturated ones. AI InfraMap's power axis grid spare capacity (KEPCO D3) and 345kV substations with
          headroom are precisely this signal.
        </li>
        <li>
          <strong>Rent growth of completed assets</strong> — a market indicator of the intensity of supply
          constraint.
        </li>
        <li>
          <strong>Levelized cost of electricity (LCOE)</strong> — how much it actually costs to make a kWh. Because
          the power-cost share of AI compute cost is absolute, this is the final report card that decides long-term
          competitiveness.
        </li>
      </ol>

      <h2>Korea's evidence — 86.5% renewable, and the non-capital belt</h2>
      <p>
        This narrative is already confirmed by data in Korea. In the{' '}
        <strong>power-generation license register for projects above 3MW (as of 2026-04-17, 4,652 cases)</strong>{' '}
        absorbed by AI InfraMap, of the 4,567 cases with a confirmed fuel source, <strong>86.5% are renewable</strong>{' '}
        (wind, fuel cells, solar, offshore wind) — coal, LNG, and nuclear stop at around 8%. The <strong>633
        cases</strong> in the new pipeline licensed since 2024 are concentrated in{' '}
        <strong>Jeonnam (146), Gyeongbuk (85), and Gangwon (84)</strong>, and <strong>86% are outside the capital
        region</strong>. Clean energy supply (signal ①) and regions with power headroom (signal ②) point to{' '}
        <strong>geographically the same places</strong> on the Korean peninsula — and those places overlap precisely
        with the non-capital region that the <Link to="/insights/psia-exemption-2027">AIDC special act</Link> lures
        with grid impact assessment exemptions. The detailed distribution can be seen in <Link to="/stats">Statistics</Link>.
      </p>

      <h2>AI InfraMap's perspective</h2>
      <p>
        QTS's lesson is clear. The winner is not whoever has the semiconductor chips but{' '}
        <strong>the operator who secures power the most cheaply, most certainly, and without procedural risk</strong>.
        AI InfraMap layers onto each site the four signals starting with what is obtainable — clean energy supply via
        the power-generation license pipeline (D1), transmission flexibility via grid spare capacity (D3), land cost
        via LandPulse, and "Virginia-style scrapping" risk via zoning and permitting procedures.{' '}
        <Link to="/">Click any point on the live map</Link> to check, starting from the evidence that can be computed
        right now.
      </p>
    </>
  ) : (
    <>
      <p>
        세계 최대 규모로 추진되던 데이터센터 단지가 <strong>착공도 못 하고 백지화</strong>됐다. 블랙스톤 계열
        QTS가 버지니아주 프린스윌리엄 카운티에 계획한 2,100에이커(축구장 1,100개)·37개동 규모
        <strong> ‘디지털 게이트웨이’</strong> — 총사업비 1,000억 달러(약 153조 원) 프로젝트다. 공동 개발사
        컴퍼스가 4월 소송을 포기하고 QTS가 7월 상고를 취하하면서 3년 법정 공방은 끝났다. 사업을 무너뜨린 건
        자금도 기술도 아니었다. <strong>주민 반대와 전력망 포화, 그리고 사소해 보이는 절차 하자</strong>였다.
      </p>

      <h2>절차 하나가 153조를 멈췄다</h2>
      <p>
        버지니아 항소법원은 카운티가 주민 공청회 공고를 신문에 게재할 때 주법이 정한 <strong>6일 시차 조항</strong>을
        지키지 않았다며 용도지역 변경 승인을 무효로 판결했다. 대형 인프라에서 <strong>지역의 법률·절차 리스크가
        곧 투자 리스크</strong>임을 보여주는 사례다. AI InfraMap이 부지 분석에서 용도지역·인허가 절차를 전력만큼
        비중 있게 다루는 이유가 여기 있다 — 전력을 확보해도 <Link to="/glossary">인허가 절차</Link> 하나에서
        프로젝트 전체가 멈춘다.
      </p>

      <h2>‘발전기를 직접 들고 오라’ — 전력을 확보하는 산업으로</h2>
      <p>
        하이퍼스케일 1개동의 전력 수요는 통상 100~300MW지만, AI 특화 클러스터는 <strong>1GW(1,000MW) 단위</strong>로
        급증한다. 단지 하나가 중형 도시 전체와 맞먹는 전력을 쓴다. 송전망 증설에 5~10년이 걸리는 사이,
        유틸리티는 개발사에 아예 <strong>발전기를 직접 들고 오라</strong>고 요구하기 시작했다. 빅테크는 현장
        가스발전·SMR·대형 ESS를 직접 짓거나 PPA를 직결하며 <strong>사실상 발전사업자화</strong>되고 있다. AI
        인프라 경쟁은 서버를 꽂는 산업에서 <strong>전력을 확보하는 산업</strong>으로 성격이 바뀌었다.
      </p>

      <h2>그린필드 회피, 기축 자산으로 — 자본의 이동</h2>
      <p>
        인허가·전력 리스크가 치솟자 글로벌 자본은 맨땅 개발(그린필드)을 피하고 <strong>이미 전력이 확보된
        브라운필드(기축 자산)</strong>로 쏠린다. 블랙스톤은 5월 ‘디지털 인프라스트럭처 트러스트’를 상장해
        17.5억 달러를 조달, 임대가 완료된 안전 자산 매입에 집중한다. 신규 공급이 막힐수록{' '}
        <strong>이미 전력을 쥔 자산의 프리미엄</strong>은 커진다.
      </p>

      <h2>주도권을 가를 4대 투자 신호</h2>
      <p>이 시장의 향방은 서버 증설 규모가 아니라 전력 역량 지표로 읽어야 한다.</p>
      <ol>
        <li>
          <strong>청정에너지 확보율</strong> — 환경 규제·전력 부족 리스크의 분산도. AI InfraMap은 이를 지역 재생E
          공급 파이프라인으로 근사한다(아래).
        </li>
        <li>
          <strong>송전망 용량 유연성</strong> — 포화 지역을 대체할 여유 권역 판별. AI InfraMap 전력축의 계통 여유용량
          (한전 D3)·345kV 여유 변전소가 정확히 이 신호다.
        </li>
        <li>
          <strong>완공 자산 임대료 상승률</strong> — 공급 제약 강도의 시장 지표.
        </li>
        <li>
          <strong>전력 균등화원가(LCOE)</strong> — kWh를 실제 얼마에 만드는가. AI 연산 원가에서 전력비 비중이
          절대적이라, 장기 경쟁력을 가르는 최종 성적표다.
        </li>
      </ol>

      <h2>한국의 근거 — 재생에너지 86.5%, 그리고 비수도권 벨트</h2>
      <p>
        이 서사는 한국에서 이미 데이터로 확인된다. AI InfraMap이 흡수한{' '}
        <strong>3MW 초과 발전사업 허가대장(2026-04-17 기준, 4,652건)</strong>에서 연료원이 확인되는 4,567건의{' '}
        <strong>86.5%가 신재생</strong>(풍력·연료전지·태양광·해상풍력) — 석탄·LNG·원자력은 8%대에 그친다.
        허가일 2024년 이후 신규 파이프라인 <strong>633건</strong>은 <strong>전남(146)·경북(85)·강원(84)</strong>에
        몰렸고, <strong>86%가 비수도권</strong>이다. 청정에너지 공급(신호①)과 전력 여유 권역(신호②)이 한반도에서{' '}
        <strong>지리적으로 같은 곳을 가리킨다</strong> — 그리고 그곳은 <Link to="/insights/psia-exemption-2027">AIDC
        특별법</Link>이 계통영향평가 면제로 유인하는 비수도권과 정확히 겹친다. 상세 분포는{' '}
        <Link to="/stats">통계</Link>에서 볼 수 있다.
      </p>

      <h2>AI InfraMap의 관점</h2>
      <p>
        QTS의 교훈은 명확하다. 반도체 칩이 아니라 <strong>전력을 가장 싸고 확실하게, 그리고 절차 리스크 없이
        확보한 사업자</strong>가 이긴다. AI InfraMap는 4대 신호 중 확보 가능한 것부터 부지 위에 얹는다 — 발전 허가
        파이프라인(D1)으로 청정에너지 공급을, 계통 여유용량(D3)으로 송전망 유연성을, 지가펄스로 토지 비용을,
        그리고 용도지역·인허가 절차로 ‘버지니아식 백지화’ 리스크를 읽는다.{' '}
        <Link to="/">현황 맵에서 임의 지점을 눌러</Link> 지금 계산 가능한 근거부터 확인해 볼 수 있다.
      </p>
    </>
  )
}
