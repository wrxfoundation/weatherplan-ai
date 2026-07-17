import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ④참고·인사이트 — 공개 사실(수도권 계통 포화·해저케이블 육양국·글로벌 랜딩에지 사례) 기반 자체 분석.
 * AI InfraMap의 비수도권 필터·네트워크축·프로세스 관문과 연결. */
export default function LandingEdge() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        The reason it is hard to build more data centers in the Seoul
        Capital Area is not a shortage of land. It is that{' '}
        <strong>they can no longer draw more power</strong>. The capital
        region’s grid has neared a physical threshold in the room (headroom) to
        absorb large new demand, and building new substations and extra-high-voltage
        transmission lines typically takes a lead time of{' '}
        <strong>around 7 years</strong>. The clock of the AI market and the clock
        of the power grid are out of sync.
      </p>

      <h2>Two bills for capital-area concentration — power and latency</h2>
      <p>
        The first bill is power. Generation happens mostly outside the capital
        area (the Chungnam·Gyeongbuk·Jeonnam belt), while consumption is
        concentrated in the capital region. Transmitting over long distances
        leaks power through line resistance (transmission loss), and once the
        grid saturates, new connections themselves queue up. AI data centers are
        ultra-high-density at tens to 100kW per rack, which existing distribution
        infrastructure cannot handle, ultimately creating an incentive to{' '}
        <strong>deploy forward toward regions close to the generation source</strong>.
      </p>
      <p>
        The second bill is network latency. International traffic enters through
        the <strong>cable landing station (CLS)</strong> where submarine cables
        reach land — domestically, gateways include Busan Songjeong and Geoje.
        But if servers sit only in the capital area, traffic that entered at
        Busan must climb hundreds of km up to Seoul and back down again, forming
        a <strong>hairpinning</strong> structure. A round trip of hundreds of km
        constantly incurs several ms of latency and dedicated-line cost
        (backhaul). For real-time inference and financial traffic, this latency
        is a matter of competitiveness.
      </p>

      <h2>Landing edge — abroad, they have already gone to the landing station</h2>
      <p>
        The solution is nothing new. France’s <strong>Marseille</strong>,
        bypassing Paris, clustered data centers at the Mediterranean submarine-cable
        landing site and became southern Europe’s hub, and the U.S.’s{' '}
        <strong>Virginia Beach</strong> attached infrastructure to the
        trans-Atlantic cable landing point to bypass Ashburn’s saturation. The
        common grammar is one — physically overlapping{' '}
        <strong>
          an upstream region where power is secured + a landing station where
          international traffic enters
        </strong>
        . This is the “landing-edge” architecture.
      </p>

      <h2>Korea’s coordinates — the non-capital region is itself gateway passage</h2>
      <p>
        This picture meshes exactly with our platform’s axis. The overhaul of
        the Power System Impact Assessment (Nov 2025) introduced a{' '}
        <Link to="/insights/market-2025h2">±15-point scoring</Link> that deducts
        points from the capital area and awards them to non-capital regions, and
        the AIDC Special Act opened an{' '}
        <Link to="/insights/psia-exemption-2027">exemption track</Link> from the
        grid impact assessment for non-capital projects below a certain scale.
        Both the institutions and the physics (grid, latency) point the same way
        — <strong>generation upstream + landing station</strong>.
      </p>
      <p>
        In fact, <Link to="/stats">86.5% of new generation installed</Link> in
        2025 was concentrated outside the capital area, and the generation-permit
        pipeline likewise skews to non-capital regions at the same ratio. The
        physical grounds are accumulating for demand (data centers) to follow
        where supply goes.
      </p>

      <h2>How to read it on the map</h2>
      <p>
        AI InfraMap has moved this judgment into a tool. At the top of the map,
        use the{' '}
        <Link to="/?noncap=1">gateway-advantage (non-capital) filter</Link> to
        strip out the capital area, and clicking any point brings up, on a single
        screen, that point’s{' '}
        <strong>network proximity (backbone·landing-station distance)</strong> and{' '}
        <strong>process-gateway outlook</strong> (154kV connection, grid impact
        assessment ±15 points). Opening the process frame lets you see, as a
        flow, at which gate a project stalls. Not “is this land good?” but{' '}
        <strong>
          “is power secured and is it close to a landing station, can it pass
          the gateway?”
        </strong>{' '}
        — the order of the questions changes.
      </p>
    </>
  ) : (
    <>
      <p>
        수도권에 데이터센터를 더 짓기 어려운 이유는 땅이 없어서가 아니다. <strong>전기를 더 받을 수 없어서</strong>다.
        수도권 전력망은 신규 대형 수요를 받아줄 여유(헤드룸)가 물리적 임계에 가까워졌고, 신규 변전소·초고압 송전선로
        확충에는 통상 <strong>7년 안팎</strong>의 리드타임이 든다. AI 시장의 시계와 전력망의 시계가 어긋나 있다.
      </p>

      <h2>수도권 집중의 두 청구서 — 전력과 지연</h2>
      <p>
        첫 번째 청구서는 전력이다. 발전은 대부분 비수도권(충남·경북·전남 벨트)에서 이뤄지는데 소비는 수도권에 몰린다.
        먼 거리를 송전하면 선로 저항으로 전력이 새고(송전 손실), 계통이 포화하면 신규 접속 자체가 대기열에 걸린다.
        AI 데이터센터는 랙당 수십~100kW의 초고밀도라 기존 배전 인프라로는 감당이 안 되고, 결국{' '}
        <strong>발전원에 가까운 지역으로 전진 배치</strong>할 유인이 생긴다.
      </p>
      <p>
        두 번째 청구서는 네트워크 지연이다. 국제 트래픽은 해저케이블이 육지에 닿는 <strong>육양국(CLS)</strong>으로
        들어온다 — 국내에서는 부산 송정·거제 등이 관문이다. 그런데 서버가 수도권에만 있으면 부산으로 들어온 트래픽이
        서울까지 수백 km를 올라갔다 다시 내려가는 <strong>헤어피닝(hairpinning)</strong> 구조가 된다. 왕복 수백 km는
        수 ms의 지연과 전용 회선 비용(백홀)을 상시로 물린다. 실시간 추론·금융 트래픽에서 이 지연은 경쟁력의 문제다.
      </p>

      <h2>랜딩 에지 — 해외는 이미 육양국으로 갔다</h2>
      <p>
        해법은 새로운 게 아니다. 프랑스 <strong>마르세유</strong>는 파리를 우회해 지중해 해저케이블 상륙지에 데이터센터를
        집적하며 유럽 남부 허브가 됐고, 미국 <strong>버지니아 비치</strong>는 대서양 횡단 케이블 육양지에 인프라를 붙여
        애슈번 포화를 우회했다. 공통 문법은 하나다 — <strong>전력이 확정적인 상류 지역 + 국제 트래픽이 들어오는
        육양국</strong>을 물리적으로 겹치는 것. 이것이 "랜딩 에지(landing-edge)" 아키텍처다.
      </p>

      <h2>한국의 좌표 — 비수도권이 곧 관문 통과다</h2>
      <p>
        이 그림은 우리 플랫폼의 축과 정확히 맞물린다. 전력계통영향평가 개편(2025.11)은 수도권에 감점, 비수도권에 가점을
        주는 <Link to="/insights/market-2025h2">±15점 배점</Link>을 넣었고, AIDC 특별법은 비수도권 일정 규모 이하에
        계통영향평가 <Link to="/insights/psia-exemption-2027">면제 트랙</Link>을 열었다. 제도도, 물리(계통·지연)도 같은
        방향을 가리킨다 — <strong>발전 상류 + 육양국</strong>.
      </p>
      <p>
        실제로 2025년 신규 발전 설치의 <Link to="/stats">86.5%가 비수도권</Link>에 몰렸고, 발전 허가 파이프라인 역시
        같은 비율로 비수도권에 쏠린다. 공급이 가는 곳으로 수요(데이터센터)가 따라갈 물리적 근거가 쌓이고 있다.
      </p>

      <h2>맵에서 읽는 법</h2>
      <p>
        AI InfraMap은 이 판단을 도구로 옮겨 놨다. 맵 상단에서 <Link to="/?noncap=1">관문 유리(비수도권) 필터</Link>로
        수도권을 걷어내고, 임의 지점을 클릭하면 그 지점의 <strong>네트워크 근접성(백본·육양국 거리)</strong>과{' '}
        <strong>프로세스 관문 전망</strong>(154kV 접속·계통영향평가 ±15점)이 한 화면에 뜬다. 프로세스 프레임을 열면
        어느 게이트에서 사업이 멈추는지 흐름으로 볼 수 있다. "이 땅이 좋은가"가 아니라{' '}
        <strong>"전력이 확정적이고 육양국에 가까운가, 관문을 통과할 수 있는가"</strong> — 질문의 순서가 바뀐다.
      </p>
    </>
  )
}

