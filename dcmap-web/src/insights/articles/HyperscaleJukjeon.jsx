import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 1차 소스: 현대건설 뉴스룸 '용인 죽전 퍼시픽써니 데이터센터'(hdec.kr). 시공사 공식 자료 인용.
 * 콘텐츠 등급 ④참고·인사이트(사례 해부). 수치·사양은 원문 인용. */
export default function HyperscaleJukjeon() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        In Jukjeon, Suji-gu, Yongin, Gyeonggi Province, the <strong>Pacific Sunny Data Center</strong>, which{' '}
        <strong>completed construction in October 2025</strong>, is one of Korea's largest hyperscale colocation
        facilities — with an intake capacity of <strong>100 MW</strong>, IT load of <strong>64 MW</strong>, and a
        gross floor area of about <strong>100,000 m²</strong> (two buildings, 5 floors above ground and 3 below)
        (built by Hyundai E&amp;C over 43 months). Dissecting this facility reveals how the very things AI InfraMap
        measures across five axes — <strong>power intake, cooling efficiency, operational reliability, and
        location</strong> — are actually realized. This piece is that dissection.
      </p>

      <h2>Power — pulling 154 kV underground to receive 100 MW</h2>
      <p>
        Pacific Sunny secured an intake capacity of up to 100 MW by <strong>directly bringing in 154 kV high
        voltage via an underground line</strong> from the substation to the data center. This is the power some
        160,000–200,000 households use simultaneously. The first thing AI InfraMap's <Link to="/">point
        analysis</Link> asks — <strong>"Can this site receive 154 kV, and how many km away is the nearest
        substation?"</strong> — is decided exactly here (<Link to="/insights/power-track-40mw">The 40 MW
        Wall</Link>). Above 40 MW, a 154 kV intake becomes effectively mandatory, and investment in one's own
        intake equipment and the distance to the substation become the gateway
        (<Link to="/insights/power-supply-chain">the power supply chain</Link>).
      </p>

      <h2>Efficiency — PUE 1.3, with 77% of power going to servers</h2>
      <p>
        With high-efficiency cooling, the latest UPS systems, and a loss-minimizing distribution network, it
        achieved a <strong>PUE of 1.3</strong>. That means about <strong>77% of total power goes to actual IT
        equipment</strong> and only 23% to cooling and other facilities — an excellent level by international
        standards. This is why AI InfraMap includes a site's{' '}
        <Link to="/">cooling climate index</Link> (free-cooling potential) among its five axes — with the same
        equipment, a cool, dry location lowers PUE. Maintaining and improving this PUE after completion is a core
        metric of <Link to="/roadmap?view=ops">post-completion operations management</Link>.
      </p>

      <h2>Reliability — TIER 3, "if one line stops, another carries on"</h2>
      <p>
        To meet the international standard <strong>TIER 3</strong> (99.982% uptime, dual paths, concurrently
        maintainable), all core electrical, mechanical, and cooling infrastructure was made{' '}
        <strong>dual- and triple-redundant</strong>. The chillers and cooling towers on basement level 3, and the
        emergency generators, fuel tanks, and UPS on basement level 2, are each designed with redundancy to
        guarantee "uninterrupted operation under any variable." The highlight is commissioning —{' '}
        <strong>a high-intensity test that deliberately cut off some lines</strong> to verify that data flow
        continues even under fault conditions. This shows precisely how the{' '}
        <strong>uninterrupted power (N+1, 2N) and incident response (MTTR)</strong> laid out in the roadmap's
        post-completion operations management are proven in the field
        (<Link to="/roadmap?view=ops">operations management framework</Link>).
      </p>

      <h2>Structure — special construction bearing 2 tons per m²</h2>
      <p>
        A data center must withstand the <strong>ultra-heavy loads</strong> of servers and electrical equipment.
        Unlike an ordinary office, Pacific Sunny applied thick slabs that bear up to <strong>2 tons per m²</strong>,
        a <strong>post-tension</strong> structure (a method that applies compression by tensioning steel strands),
        a raised floor (vibration control), and BIM clash simulation. Why a data center is "special construction
        distinct from ordinary buildings" — the fact that not only power and cooling but{' '}
        <strong>the structure itself is different</strong> — is also why site evaluation goes beyond simple land
        price and area.
      </p>

      <h2>Location — Yongin, the paradox of the metropolitan area</h2>
      <p>
        Pacific Sunny sits in Yongin (<strong>the Seoul metropolitan area</strong>). On AI InfraMap's five axes,
        the metropolitan area scores in the deduction direction on the{' '}
        <Link to="/insights/market-2025h2">grid-impact assessment (±15 points)</Link> — and yet this site worked
        because it secured power through a direct 154 kV underground intake, and because demand (global CSPs) wanted
        proximity to the metropolitan area. In fact, after construction began, a{' '}
        <strong>global CSP decided to occupy 5 additional floors</strong>, leading to a change contract that
        extended the schedule by 15 months and added 321.5 billion won. It's a case where demand beat the site's
        penalty. It's also a large-demand belt that competes and coexists over power and water with the same
        Yongin-area <Link to="/">semiconductor national industrial complex (9.3 GW)</Link>.
      </p>

      <h2>AI InfraMap's perspective — a single building is the answer to all five axes</h2>
      <p>
        A single Pacific Sunny building holds the answers to every question AI InfraMap asks of each site — 154 kV
        intake (power), PUE 1.3 (cooling and weather), TIER 3 redundancy (operational reliability), 100 MW intake
        capacity (scale), Yongin metropolitan area (location). When we click an arbitrary point on the map and
        measure it across five axes, we are, in the end, using data to first gauge{' '}
        <strong>"Can a building like Pacific Sunny stand on this spot?"</strong> The next stage — the entire process
        of construction and post-completion operations — continues in the{' '}
        <Link to="/roadmap">A–Z roadmap</Link>.
      </p>
    </>
  ) : (
    <>
      <p>
        경기도 용인시 수지구 죽전에 <strong>2025년 10월 준공한</strong> <strong>퍼시픽써니 데이터센터</strong>는 수전용량{' '}
        <strong>100MW</strong>, IT 부하 <strong>64MW</strong>, 연면적 약 <strong>10만㎡</strong>(2개 동, 지상 5·지하 3)의
        국내 최대급 하이퍼스케일 코로케이션이다(현대건설 시공, 43개월). 이 시설을 뜯어보면 AI InfraMap이 5축으로
        재는 것들 — <strong>전력 수전·냉각 효율·운영 안정성·입지</strong> — 이 실제로 어떻게 구현되는지가 보인다. 이 글은
        그 해부다.
      </p>

      <h2>전력 — 154kV를 땅으로 끌어와 100MW를 받다</h2>
      <p>
        퍼시픽써니는 변전소에서 데이터센터까지 <strong>154kV 고압을 지중선로로 직접 인입</strong>해 최대 100MW의 수전용량을
        확보했다. 이는 약 16~20만 가구가 동시에 쓰는 전력이다. AI InfraMap의 <Link to="/">지점 분석</Link>이 가장 먼저 묻는
        것 — <strong>“이 부지가 154kV를 받을 수 있는가, 가장 가까운 변전소는 몇 km인가”</strong> — 가 바로 이 지점에서
        결정된다(<Link to="/insights/power-track-40mw">40MW의 벽</Link>). 40MW를 넘으면 154kV 수전이 사실상 의무가 되고,
        자체 수전설비 투자와 변전소 거리가 관문이 된다(<Link to="/insights/power-supply-chain">전력공급 사슬</Link>).
      </p>

      <h2>효율 — PUE 1.3, 전력의 77%가 서버로</h2>
      <p>
        고효율 냉방·최신 UPS·손실 최소화 배전망으로 <strong>PUE 1.3</strong>을 구현했다. 총 전력의 약 <strong>77%가 실제 IT
        장비</strong>에, 23%만 냉각·기타 설비에 쓰인다는 뜻으로, 국제적으로도 우수한 수준이다. AI InfraMap이 부지의{' '}
        <Link to="/">냉각 기후지수</Link>(외기냉방 잠재력)를 5축에 넣는 이유가 이것이다 — 같은 설비라도 서늘·건조한 입지가
        PUE를 낮춘다. 준공 후 이 PUE를 유지·개선하는 일이 곧 <Link to="/roadmap?view=ops">완공 후 운영관리</Link>의 핵심
        지표다.
      </p>

      <h2>안정성 — TIER 3, ‘한쪽이 멈춰도 다른 라인이’</h2>
      <p>
        국제 표준 <strong>TIER 3</strong>(가동률 99.982%·이중 경로·무중단 유지보수)를 충족하기 위해 전기·기계·냉각의 모든
        핵심 인프라를 <strong>이중·삼중화</strong>했다. 지하 3층 냉동기·쿨링타워, 지하 2층 비상발전기·연료탱크·UPS가 각각
        이중화 설계로 “어떤 변수에도 끊김 없는” 운영을 보장한다. 압권은 시운전 — <strong>실제 일부 라인을 의도적으로
        차단하는 강도 높은 시험</strong>으로 장애 상황에서도 데이터 흐름이 지속되는지 검증했다. 이는 로드맵의 완공 후
        운영관리에서 정리한 <strong>무정전(N+1·2N)·인시던트 대응(MTTR)</strong>이 현장에서 어떻게 입증되는지를 그대로
        보여준다(<Link to="/roadmap?view=ops">운영관리 프레임</Link>).
      </p>

      <h2>구조 — 1㎡당 2톤을 견디는 특수 건축</h2>
      <p>
        데이터센터는 서버·전기 설비의 <strong>초고하중</strong>을 견뎌야 한다. 퍼시픽써니는 일반 오피스와 달리 <strong>1㎡당
        최대 2톤</strong>의 하중을 견디는 두꺼운 슬래브와 <strong>포스트텐션</strong>(강선을 당겨 압축력을 주는 공법) 구조,
        이중 바닥(진동 제어), BIM 간섭 시뮬레이션을 적용했다. 데이터센터가 왜 “일반 건축물과 다른 특수 건축”인지 —
        전력·냉각뿐 아니라 <strong>구조 자체가 다르다</strong>는 점은, 부지 평가가 단순 지가·면적을 넘어서는 이유이기도 하다.
      </p>

      <h2>입지 — 용인, 수도권의 역설</h2>
      <p>
        퍼시픽써니는 용인(<strong>수도권</strong>)에 있다. AI InfraMap의 5축에서 수도권은 <Link to="/insights/market-2025h2">
        계통영향평가 ±15점</Link>에서 감점 방향이다 — 그럼에도 이 부지가 성립한 건 154kV 지중 직접인입으로 전력을
        확보했고, 수요(글로벌 CSP)가 수도권 근접을 원했기 때문이다. 실제로 착공 후 <strong>글로벌 CSP가 5개 층 추가 입주를
        결정</strong>해 15개월 공기 연장·3,215억 원 증액의 변경계약이 체결됐다. 수요가 입지의 페널티를 이긴 사례다. 같은
        용인권의 <Link to="/">반도체 국가산단(9.3GW)</Link>과 전력·용수를 두고 경쟁·공존하는 대수요 벨트이기도 하다.
      </p>

      <h2>AI InfraMap의 관점 — 한 채의 건물이 곧 5축의 답</h2>
      <p>
        퍼시픽써니 한 채에는 AI InfraMap이 부지마다 묻는 질문의 답이 모두 들어 있다 — 154kV 수전(전력), PUE 1.3(냉각·기상),
        TIER 3 이중화(운영 안정성), 100MW 수전용량(규모), 용인 수도권(입지). 우리가 지도 위 임의의 점을 클릭해 5축으로
        재는 것은, 결국 <strong>“이 자리에 퍼시픽써니 같은 건물이 설 수 있는가”</strong>를 데이터로 먼저 가늠하는 일이다. 그
        다음 단계 — 구축의 전 과정과 완공 후 운영 — 은 <Link to="/roadmap">A–Z 로드맵</Link>에서 이어진다.
      </p>
    </>
  )
}
