import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 1차 출처: 산업부 참고자료(2026.6.29 국민보고회)·korea.kr 정책브리핑(2026.5.8) — 세부는 출처 박스 */
export default function MegaProjectAidc() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        The <strong>‘Korea Grand Leap Three Mega-Projects’</strong> (semiconductors,
        physical AI, and AI data centers) that the government announced on June 29 at the Yeongbin-gwan
        of the former Blue House is an announcement that rewrites the premises of Korea’s data center map.
        Looking at the AI data center track alone —{' '}
        <strong>Phase 1 of 8.4GW</strong> (SK 5GW, GS 2.4GW, Naver 1GW) built by the three companies
        for a combined roughly <strong>KRW 550 trillion</strong>, with SK expanding in Phase 2 to 15GW
        by 2035 for a <strong>total target of 18.4GW</strong>. Given that the current estimate of the
        nation’s total data center power-intake capacity is about 1.9GW (<Link to="/stats">statistics</Link>),
        the announced plans alone foreshadow roughly ten times the existing total capacity.
      </p>

      <h2>Regional Realignment — the center of gravity shifts outside the capital region</h2>
      <p>
        Alongside the mega-project, the national industrial map is divided by role: the Seoul
        Capital Area for advanced semiconductor production, the Honam region for a second
        semiconductor belt (4 fabs, KRW 800 trillion), the Chungcheong region for advanced
        packaging (KRW 81 trillion), the Yeongnam region for physical AI, and{' '}
        <strong>the Gangwon region as the hub for ultra-large AI data centers</strong>. In the
        southwestern region, SK invests KRW 470 trillion (2 memory fabs +{' '}
        <strong>1GW AI data center</strong>), Samsung KRW 425 trillion (2 fabs + a national AI
        computing center), and Amkor KRW 1 trillion (Gwangju advanced packaging) — a combined
        KRW 896 trillion. The Ministry of Trade, Industry and Energy created a dedicated unit
        (Super-Regional Industry Cooperation Division), and in the Myeongji-Noksan industrial
        complex in Busan a <strong>KRW 14 billion edge AI data center demonstration pilot</strong>
        is also being launched.
      </p>

      <h2>Power Policy — the stakes of siting intelligence have grown</h2>
      <p>
        The infrastructure part of the announcement reshapes the official data landscape of data
        center siting analysis. The government will{' '}
        <strong>disclose information on 345kV grid substations with spare capacity</strong> to
        encourage the geographic dispersion of AI data centers, fast-track power-system impact
        assessments for non-capital-region data centers, and has signaled the introduction of{' '}
        <strong>regional electricity tariffs and a dedicated tariff for AI data centers</strong>.
        Early achievement of 100GW of renewable energy (by 2030), the use of SMRs, and transmission-grid
        expansion and undergrounding are also included. An era in which electricity rates vary by
        location — the economic value of “where you build” has officially grown.
      </p>

      <h2>The AIDC Special Act — changing the rules of the permitting game</h2>
      <p>
        The <strong>AI Data Center Special Act</strong>, which earlier passed the National Assembly on
        May 7, takes effect in February 2027. There are three core points: it makes the Ministry of
        Science and ICT a single unified window that processes multiple permits at once; it introduces
        a <strong>timeout system</strong> whereby a permit is deemed processed once a set deadline
        passes; and it <strong>exempts non-capital-region data centers below a certain size from the
        power-system impact assessment</strong> (the threshold delegated to presidential decree). It is
        a design that resolves capital-region concentration not through regulation but through an
        asymmetry of incentives — the detailed rules are reflected in the{' '}
        <Link to="/glossary">glossary</Link> and the power-permitting rulebook.
      </p>

      <h2>The Wall of Execution — the questions that remain</h2>
      <p>
        The point to watch is execution. The industry notes that the key issues are ① sentiment over
        equity between regions, ② the bottleneck of supplying power and water simultaneously, ③ the gap
        between renewable-energy potential and the actual ability to match 24/7 carbon-free electricity
        (CFE), ④ policy continuity for a ten-year project, and ⑤ the structure of financing and resident
        consent (re-citing the framing of the Connect contribution). In particular, many of the
        gigawatt-class projects have <strong>not yet disclosed specific sites</strong> — where the sites
        for SK’s 5GW, GS’s 2.4GW, Naver’s 1GW, and SK’s 1GW southwestern project are finalized will be
        the biggest variable on Korea’s data center map over the next one to two years.
      </p>

      <h2>AI InfraMap’s Perspective</h2>
      <p>
        The 18.4GW plan, the disclosure of 345kV information, and the emergence of the
        impact-assessment exemption track all mean a surge in demand for the “science of the site.”
        AI InfraMap tracks publicly confirmed projects on the <Link to="/">status map</Link>, accumulates
        the site-confirmation events of projects with undisclosed locations as a time series (D2), and
        plans to absorb the 345kV disclosure data into its power layer as soon as it is released.
      </p>
    </>
  ) : (
    <>
      <p>
        정부가 6월 29일 청와대 영빈관에서 발표한 <strong>‘대한민국 대도약 3대 메가프로젝트’</strong>(반도체 ·
        피지컬 AI · AI 데이터센터)는 한국 데이터센터 지도의 전제를 바꾸는 발표다. AI 데이터센터 트랙만 떼어 보면 —{' '}
        <strong>1단계 8.4GW</strong>(SK 5GW · GS 2.4GW · 네이버 1GW)를 3사 합산 약 <strong>550조 원</strong>을 들여
        구축하고, SK는 2단계로 2035년까지 15GW로 확장해 <strong>총 18.4GW</strong>를 목표로 한다. 현재 국내 전체
        데이터센터 수전용량 추정치가 약 1.9GW(<Link to="/stats">통계</Link>)임을 감안하면, 발표된 계획만으로 기존
        전체 용량의 약 10배가 예고된 셈이다.
      </p>

      <h2>권역 재편 — 데이터센터의 무게중심이 비수도권으로</h2>
      <p>
        메가프로젝트와 함께 전국 산업지도가 역할 분담된다: 수도권은 첨단 반도체 생산, 호남권은 제2 반도체 벨트(팹
        4기, 800조 원), 충청권은 첨단 패키징(81조 원), 영남권은 피지컬 AI, 그리고{' '}
        <strong>강원권은 초대형 AI 데이터센터 거점</strong>이다. 서남권에서는 SK가 470조 원(메모리 팹 2기 +{' '}
        <strong>1GW AI 데이터센터</strong>), 삼성이 425조 원(팹 2기 + 국가 AI 컴퓨팅센터), 앰코가 1조 원(광주 첨단
        패키징)을 투자한다 — 합계 896조 원. 산업부는 전담 조직(초광역산업협력과)을 신설했고, 부산 명지녹산
        산단에서는 140억 원 규모 <strong>엣지 AI 데이터센터 실증 시범사업</strong>도 시작된다.
      </p>

      <h2>전력 정책 — 입지 인텔리전스의 판이 커졌다</h2>
      <p>
        발표의 인프라 파트는 데이터센터 입지 분석의 공식 데이터 지형을 바꾼다. 정부는{' '}
        <strong>345kV 계통 여유 변전소 정보를 공개</strong>해 AI 데이터센터의 입지 분산을 유도하고, 비수도권
        데이터센터의 전력계통영향평가를 신속 처리하며, <strong>지역별 전기요금제와 AI 데이터센터 전용 요금제</strong>
        도입을 예고했다. 재생에너지 100GW 조기 달성(2030), SMR 활용, 송전망 증설·지중화도 함께 담겼다. 입지에 따라
        전기요금이 달라지는 시대 — “어디에 짓느냐”의 경제적 가치가 공식적으로 커진 것이다.
      </p>

      <h2>AIDC 특별법 — 인허가 게임의 룰 변경</h2>
      <p>
        앞서 5월 7일 국회를 통과한 <strong>AI 데이터센터 특별법</strong>은 2027년 2월 시행된다. 핵심은 셋:
        과기정통부를 통합 창구로 여러 인허가를 일괄 처리하고, 일정 기한이 지나면 처리된 것으로 간주하는{' '}
        <strong>타임아웃제</strong>를 도입하며, <strong>비수도권의 일정 규모 이하 데이터센터는 전력계통영향평가를
        면제</strong>한다(기준은 대통령령 위임). 수도권 집중을 규제가 아닌 인센티브 비대칭으로 푸는 설계다 — 상세
        룰은 <Link to="/glossary">용어집</Link>과 전력 인허가 룰북에 반영해 두었다.
      </p>

      <h2>실행의 벽 — 남는 질문들</h2>
      <p>
        관전 포인트는 실행이다. 업계에서는 ①지역 간 형평성 정서 ②전력·용수 동시 공급의 병목 ③재생에너지 잠재력과
        실제 24시간 무탄소 전력(CFE) 매칭 능력의 간극 ④10년짜리 프로젝트의 정책 연속성 ⑤재원과 주민 동의 구조가
        관건이라는 지적이 나온다(커넥트 기고 프레임 재인용). 특히 GW급 프로젝트 다수가 아직{' '}
        <strong>구체적 입지를 공개하지 않았다</strong> — SK 5GW, GS 2.4GW, 네이버 1GW, SK 서남권 1GW의 부지가
        어디로 확정되는지가 향후 1~2년 한국 데이터센터 지도의 최대 변수다.
      </p>

      <h2>AI InfraMap의 관점</h2>
      <p>
        18.4GW 계획과 345kV 정보 공개, 계통영향평가 면제 트랙의 등장은 곧 “부지의 과학”에 대한 수요 폭증을
        뜻한다. AI InfraMap는 <Link to="/">현황 맵</Link>에서 공개 확정된 프로젝트를 추적하고, 입지 미공개 프로젝트의
        확정 이벤트를 시계열로 축적하며(D2), 345kV 공개 데이터가 나오는 즉시 전력 레이어로 흡수할 예정이다.
      </p>
    </>
  )
}
