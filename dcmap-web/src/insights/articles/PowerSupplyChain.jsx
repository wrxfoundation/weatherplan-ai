import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 전력공급 사슬 + AI DC 가동원리 전개도 — 발전에서 GPU까지.
 * 콘텐츠 등급 ③민간 가공: 전력계통 구조는 통용 지식, 수치는 AI InfraMap 축적 데이터(변전소·승인율·공급여유) 연결. */

// 외부 전력 사슬: 발전 → 송전 → 변전 → DC 수전
const GRID_CHAIN = [
  { icon: '🏭', name: '발전소', kv: '~24kV 발전', note: '원전·석탄·LNG·재생. 발전단에서 승압 전 저전압 생산', tone: 'gen' },
  { icon: '🔺', name: '승압 변전소', kv: '765 / 345kV', note: '장거리 손실 최소화 위해 초고압 승압 → 송전탑', tone: 'up' },
  { icon: '〰️', name: '송전망', kv: '765 / 345kV', note: '전국 골격망. 발전 상류(비수도권)에서 수요지로', tone: 'line' },
  { icon: '⚡', name: '변전소', kv: '154kV+ 강압', note: 'DC가 전기를 받는 마지막 관문 — 154kV/22.9kV로 강압', tone: 'sub' },
  { icon: '🏢', name: 'DC 수전설비', kv: '154 / 22.9kV', note: '수전 → 구내 변전. 40MW+는 154kV 자체 수전설비 의무', tone: 'dc' },
]

// DC 내부 가동원리(완공 후): 수전 → 배전/UPS → 냉각 → 컴퓨트 → 네트워크 → 서비스
const DC_CHAIN = [
  { icon: '🔌', name: '수전·구내변전', detail: '154kV→22.9kV→저압. 이중화(예비 회선)로 무정전 근간' },
  { icon: '🔋', name: 'UPS·배전', detail: '순단 대비 UPS·배터리, 비상 발전기(자가발전). 랙까지 안정 배전' },
  { icon: '❄️', name: '냉각', detail: '칠러·CRAH(공랭) → 고밀도 GPU는 액냉(D2C·침수). PUE의 최대 변수' },
  { icon: '🖥️', name: '서버랙·GPU', detail: '실제 연산. 랙당 40~130kW(AI). 전력의 대부분이 여기서 열로' },
  { icon: '🌐', name: '네트워크', detail: '백본·IX·해저케이블 육양 시설로 트래픽 송수신 — 지연·회선' },
  { icon: '🤖', name: 'AI 서비스', detail: '학습·추론 → 챗봇·검색·생성. 최종 사용자에게 도달' },
]

// EN mirrors of the two chains — visible text translated, icons/tone/kv units unchanged
const GRID_CHAIN_EN = [
  { icon: '🏭', name: 'Power plant', kv: '~24kV generation', note: 'Nuclear/coal/LNG/renewables. Low-voltage output before step-up at the generation stage', tone: 'gen' },
  { icon: '🔺', name: 'Step-up substation', kv: '765 / 345kV', note: 'Extra-high-voltage step-up to minimize long-distance loss → transmission towers', tone: 'up' },
  { icon: '〰️', name: 'Transmission grid', kv: '765 / 345kV', note: 'National backbone. From generation upstream (non-capital region) to demand centers', tone: 'line' },
  { icon: '⚡', name: 'Substation', kv: '154kV+ step-down', note: 'The last gateway where a DC receives power — step-down to 154kV/22.9kV', tone: 'sub' },
  { icon: '🏢', name: 'DC receiving facility', kv: '154 / 22.9kV', note: 'Receiving → on-premise substation. 40MW+ mandates a 154kV in-house receiving facility', tone: 'dc' },
]

const DC_CHAIN_EN = [
  { icon: '🔌', name: 'Receiving & on-site substation', detail: '154kV→22.9kV→low voltage. Redundancy (backup lines) as the basis of uninterrupted power' },
  { icon: '🔋', name: 'UPS & distribution', detail: 'UPS/batteries for momentary outages, emergency generators (on-site). Stable distribution down to the rack' },
  { icon: '❄️', name: 'Cooling', detail: 'Chillers/CRAH (air cooling) → high-density GPUs use liquid cooling (D2C/immersion). The biggest PUE variable' },
  { icon: '🖥️', name: 'Server racks & GPUs', detail: 'The actual compute. 40–130kW per rack (AI). Most of the power turns to heat here' },
  { icon: '🌐', name: 'Network', detail: 'Sends and receives traffic via backbone, IX, and submarine cable landing stations — latency and circuits' },
  { icon: '🤖', name: 'AI services', detail: 'Training/inference → chatbots, search, generation. Reaching the end user' },
]

function ChainRow({ items, kind }) {
  return (
    <div className={`psc-flow psc-${kind}`} role="list">
      {items.map((s, i) => (
        <div key={s.name} className="psc-stage" role="listitem">
          <div className={`psc-card ${s.tone ? `psc-tone-${s.tone}` : ''}`}>
            <span className="psc-icon" aria-hidden>
              {s.icon}
            </span>
            <span className="psc-name">{s.name}</span>
            {s.kv && <span className="psc-kv">{s.kv}</span>}
            <span className="psc-note">{s.note || s.detail}</span>
          </div>
          {i < items.length - 1 && (
            <span className="psc-arrow" aria-hidden>
              ↓
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function PowerSupplyChain() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        The fastest way to understand an AI data center is to follow <strong>the order in which electricity
        flows</strong>. Which gateways the electricity made at a power plant passes through before it reaches the
        GPU, and how a completed DC actually runs — we lay out these two chains at once. AI InfraMap's scoring
        (40 points for power) is a data-based scoring of each link in this chain.
      </p>

      <h2>① The external power chain — from generation to the DC boundary</h2>
      <p>
        Electricity has <strong>lower loss at higher voltage</strong>. So right after generation it is stepped up
        to extra-high voltage (765/345kV) to cross the country, then <strong>stepped down to 154kV or below at a
        substation</strong> near the demand center and fed into the data center. This is why the substation is
        called "the last gateway where an AI data center receives power."
      </p>
      <ChainRow items={GRID_CHAIN_EN} kind="grid" />
      <p className="psc-data">
        <strong>Real data on the map</strong> — <strong>788</strong> substations of 154kV or above nationwide
        (122 at 345kV, 9 at 765kV; KEPCO, July 2026). Check coordinates with the map's <em>🔌 substation</em> layer,
        and point analysis actually computes the <strong>distance to the nearest substation</strong> as 15 points on
        the power axis. Because generation upstream is concentrated in the non-capital region (86%+ of new 2025
        generation outside the capital region), the non-capital region is favored from the very start of the chain.
      </p>

      <h2>② Why the bottleneck arises at the "substation"</h2>
      <p>
        Even with surplus electricity, <strong>if the connection is blocked</strong> you cannot build a DC. That is
        because new transmission and substation facilities have lead times exceeding 7 years, and the existing
        substations' <strong>spare interconnection capacity (supply headroom)</strong> varies wildly by region.
        This physical bottleneck shows up directly in the institution (grid impact assessment).
      </p>
      <ul>
        <li>
          <strong>Grid supply headroom</strong> — from Incheon at 5MW and Jeju at 0MW (saturated) to Gyeongbuk at
          7,935MW and Chungnam at 7,670MW (headroom). Generation surplus (Incheon's self-sufficiency rate 165%) and
          acceptance headroom can be <strong>the exact opposite</strong> — "generation surplus ≠ connectable."
        </li>
        <li>
          <strong>DC power-supply feasibility determination rate</strong> (KEPCO grid impact assessment) — capital
          region <strong>46%</strong> vs. non-capital region <strong>84%</strong>. In Gyeonggi and Incheon, more
          than half of applications are ruled infeasible for supply.
        </li>
      </ul>
      <p className="psc-data">
        AI InfraMap scores these two signals as 10 points for distribution headroom + 10 points for grid supply
        feasibility on the power axis (all 17 provinces and metropolitan cities). For detailed background, see{' '}
        <Link to="/insights/landing-edge">capital-region grid saturation and the landing edge</Link>.
      </p>

      <h2>③ How a DC runs internally — this is how it actually turns after completion</h2>
      <p>
        The electricity that passes through the receiving facility goes through several more links inside the data
        center. The core is <strong>uninterrupted power</strong> (electricity must never cut off, not even for an
        instant) and <strong>thermal management</strong> (most of the power turns into heat).
      </p>
      <ChainRow items={DC_CHAIN_EN} kind="dc" />
      <p>
        Because nearly all the incoming power turns into <strong>heat</strong> at the GPU, how efficiently that heat
        is removed (PUE) governs operating cost. This is why <strong>cooling</strong> is directly tied to location
        (annual mean temperature, free-cooling potential) — the reason AI InfraMap keeps a climate axis (DC climate
        index). High-density AI racks are moving beyond the limits of air cooling toward{' '}
        <Link to="/insights/liquid-cooling-brief">liquid cooling</Link>.
      </p>
      <p>
        Once completed, a data center runs <strong>nonstop for all 8,760 hours of the year</strong>. The actual
        operating principles that sustain that constant operation are the following five.
      </p>
      <ul>
        <li>
          <strong>Uninterrupted redundancy (N+1 or higher)</strong> — receiving lines, transformers, UPS, and
          emergency generators are kept in reserve so server power is not cut off even during a KEPCO outage or
          equipment failure (99.9%+ availability SLA).
        </li>
        <li>
          <strong>Heat circulation loop</strong> — a closed loop of GPU heat → coolant/CRAH → chiller/cooling tower
          → exhaust to outside air runs 24 hours. In winter and at night, free cooling turns off the chillers to
          save power → PUE splits by season and location.
        </li>
        <li>
          <strong>PUE management</strong> — total power ÷ IT power. The closer to 1.0, the more efficient. New
          domestic AIDCs target 1.2–1.3, and this 0.1 difference amounts to tens of billions of won a year in
          electricity bills at a large site (cf. summer purchase price of 164 won/kWh).
        </li>
        <li>
          <strong>Load curve</strong> — training runs thousands of GPUs at full load for weeks, while inference
          fluctuates with traffic. Since contracted power and cooling capacity must be set to the peak,{' '}
          <strong>the contracted receiving power</strong> is itself the ceiling.
        </li>
        <li>
          <strong>Network SLA</strong> — traffic is exchanged 24/7 via backbone, IX, and submarine cables, and
          latency and dual routing govern service quality (landing edge, multi-region).
        </li>
      </ul>
      <p>
        In summary, a completed DC is a facility that constantly maintains the four cycles of{' '}
        <strong>"uninterrupted electricity → never-warming cooling → never-stopping compute → flowing
        traffic."</strong> What determines the ceiling of these cycles is precisely the location's power, cooling,
        and network conditions — the very thing AI InfraMap scores at the coordinate level.
      </p>

      <h2>④ Seeing it again through the five axes</h2>
      <p>Laying this chain directly onto AI InfraMap's five scoring axes gives the following.</p>
      <ul>
        <li>
          <strong>Power (40)</strong> — substation distance, grid supply headroom, power-supply feasibility rate,
          on-site generation proximity. Scoring ① and ② of the chain.
        </li>
        <li>
          <strong>Climate/cooling (10)</strong> — the cooling efficiency of chain ③ (annual mean temperature, free
          cooling).
        </li>
        <li>
          <strong>Network (10)</strong> — the traffic of chain ③ (distance to backbone, IX, submarine cable landing
          stations).
        </li>
        <li>
          <strong>Land (25)</strong> — the vessel that holds the entire chain (zoning, industrial complex, area).
        </li>
        <li>
          <strong>Risk (15)</strong> — the variables that threaten the chain (flooding, landslide, complaints).
        </li>
      </ul>
      <p className="psc-data">
        Clicking any point on the map fills each link of this chain with an evidence score. Power supply conditions
        can be viewed nationwide in the power and grid section (approval rate, supply headroom, substation
        infrastructure, generation mix, cost, reserve margin) of the <Link to="/dashboard">dashboard</Link>.
      </p>
    </>
  ) : (
    <>
      <p>
        AI 데이터센터를 이해하는 가장 빠른 길은 <strong>전기가 흐르는 순서</strong>를 따라가는 것이다. 발전소에서
        만들어진 전기가 어떤 관문을 거쳐 GPU에 닿고, 완공된 DC가 실제로 어떻게 돌아가는지 — 이 두 개의 사슬을 한 번에
        펼쳐 본다. AI InfraMap의 스코어링(전력 40점)은 이 사슬의 각 마디를 데이터로 점수화한 것이다.
      </p>

      <h2>① 외부 전력 사슬 — 발전에서 DC 경계까지</h2>
      <p>
        전기는 <strong>고전압일수록 손실이 적다</strong>. 그래서 발전 직후 초고압(765·345kV)으로 승압해 전국을
        가로지른 뒤, 수요지 인근 <strong>변전소에서 154kV 이하로 강압</strong>해 데이터센터로 넣는다. 변전소가 “AI
        데이터센터가 전기를 받는 마지막 관문”이라 불리는 이유다.
      </p>
      <ChainRow items={GRID_CHAIN} kind="grid" />
      <p className="psc-data">
        <strong>지도 위 실데이터</strong> — 전국 154kV+ 변전소 <strong>788개</strong>(345kV 122·765kV 9, 한전
        2026.7). 지도의 <em>🔌 변전소</em> 레이어로 좌표를 확인하고, 지점 분석은 <strong>최근접 변전소 거리</strong>를
        전력축 15점으로 실계산한다. 발전 상류가 비수도권에 몰려 있어(2025 신규 발전 86%+ 비수도권) 사슬의 시작점부터
        비수도권이 유리하다.
      </p>

      <h2>② 왜 ‘변전소’에서 병목이 생기나</h2>
      <p>
        전기는 남아도 <strong>연결이 막히면</strong> DC를 지을 수 없다. 신규 송·변전 설비는 리드타임이 7년을 넘고,
        기존 변전소의 <strong>접속 여유용량(공급여유)</strong>이 지역마다 천차만별이기 때문이다. 이 물리적 병목이
        제도(전력계통영향평가)로 그대로 드러난다.
      </p>
      <ul>
        <li>
          <strong>계통 공급여유</strong> — 인천 5MW·제주 0MW(포화)부터 경북 7,935MW·충남 7,670MW(여유)까지. 발전
          잉여(인천 자급률 165%)와 수용 여유가 <strong>정반대</strong>일 수 있다 — “발전 잉여 ≠ 접속 가능”.
        </li>
        <li>
          <strong>DC 전력공급 가능판정율</strong>(한전 전력계통영향평가) — 수도권 <strong>46%</strong> vs 비수도권{' '}
          <strong>84%</strong>. 경기·인천은 신청의 절반 이상이 공급불가 판정을 받는다.
        </li>
      </ul>
      <p className="psc-data">
        AI InfraMap은 이 두 신호를 전력축 배전 여유 10점 + 계통 공급 가능성 10점으로 점수화한다(17개 시도 전부). 자세한
        배경은 <Link to="/insights/landing-edge">수도권 계통 포화와 랜딩 에지</Link> 참고.
      </p>

      <h2>③ DC 내부 가동원리 — 완공 후 실제로 이렇게 돈다</h2>
      <p>
        수전설비를 통과한 전기는 데이터센터 안에서 다시 여러 마디를 거친다. 핵심은 <strong>무정전</strong>(전기가
        한순간도 끊기면 안 됨)과 <strong>열 관리</strong>(전력의 대부분이 열로 바뀜)다.
      </p>
      <ChainRow items={DC_CHAIN} kind="dc" />
      <p>
        들어온 전력의 거의 전부가 GPU에서 <strong>열</strong>로 바뀌므로, 그 열을 얼마나 효율적으로 빼내느냐(PUE)가
        운영비를 좌우한다. 그래서 <strong>냉각</strong>이 입지(연평균기온·프리쿨링 잠재력)와 직결된다 — AI InfraMap이
        기상축(DC 기후지수)을 두는 이유다. 고밀도 AI 랙은 공랭 한계를 넘어{' '}
        <Link to="/insights/liquid-cooling-brief">액체냉각</Link>으로 이동 중이다.
      </p>
      <p>
        완공 후 데이터센터는 <strong>1년 8,760시간 무중단</strong>으로 돌아간다. 그 상시 가동을 떠받치는 실제 운영
        원리는 다음 다섯 가지다.
      </p>
      <ul>
        <li>
          <strong>무정전 이중화(N+1 이상)</strong> — 수전 회선·변압기·UPS·비상 발전기를 여분으로 두어, 한전 정전이나
          장비 고장에도 서버 전원이 끊기지 않게 한다(가용성 99.9%+ SLA).
        </li>
        <li>
          <strong>열 순환 루프</strong> — GPU 열 → 냉각수/CRAH → 칠러·냉각탑 → 외기 방출의 폐루프가 24시간 돈다.
          겨울·야간엔 외기냉방(프리쿨링)으로 칠러를 끄고 전력을 아낀다 → PUE가 계절·입지로 갈린다.
        </li>
        <li>
          <strong>PUE 관리</strong> — 총전력÷IT전력. 1.0에 가까울수록 효율적. 국내 신규 AIDC는 1.2~1.3을 겨냥하며,
          이 0.1 차이가 대형 사이트에선 연 수십억 원의 전기요금 차이가 된다(여름 구입단가 164원/kWh 참고).
        </li>
        <li>
          <strong>부하 곡선</strong> — 학습(training)은 수천 GPU가 몇 주간 풀로드, 추론(inference)은 트래픽 따라
          출렁인다. 계약전력·냉각 용량은 피크 기준으로 잡아야 하므로 <strong>수전 계약전력</strong>이 곧 상한이다.
        </li>
        <li>
          <strong>네트워크 SLA</strong> — 백본·IX·해저케이블로 24/7 트래픽을 주고받으며, 지연·이중경로가 서비스
          품질을 좌우한다(랜딩 에지·다중 리전).
        </li>
      </ul>
      <p>
        요약하면 완공 후 DC는 <strong>「끊기지 않는 전기 → 식지 않는 냉각 → 멈추지 않는 연산 → 흐르는 트래픽」</strong>의
        네 순환을 상시 유지하는 설비다. 이 순환의 상한을 결정하는 것이 바로 입지의 전력·냉각·네트워크 여건 —
        AI InfraMap이 좌표 단위로 점수화하는 대상이다.
      </p>

      <h2>④ 다섯 축으로 다시 보기</h2>
      <p>이 사슬을 AI InfraMap의 스코어링 5축에 그대로 얹으면 다음과 같다.</p>
      <ul>
        <li>
          <strong>전력(40)</strong> — 변전소 거리·계통 공급여유·전력공급 가능판정율·자가발전 인접. 사슬의 ①②를 점수화.
        </li>
        <li>
          <strong>기상·냉각(10)</strong> — 사슬 ③의 냉각 효율(연평균기온·프리쿨링).
        </li>
        <li>
          <strong>네트워크(10)</strong> — 사슬 ③의 트래픽(백본·IX·해저케이블 육양 시설 거리).
        </li>
        <li>
          <strong>토지(25)</strong> — 사슬 전체를 담는 그릇(용도지역·산업단지·면적).
        </li>
        <li>
          <strong>리스크(15)</strong> — 사슬을 위협하는 변수(침수·산사태·민원).
        </li>
      </ul>
      <p className="psc-data">
        지도에서 임의의 지점을 클릭하면 이 사슬의 각 마디가 근거 점수로 채워진다. 전력 공급 여건은{' '}
        <Link to="/dashboard">대시보드</Link>의 전력·계통 섹션(승인율·공급여유·변전소 인프라·발전 믹스·원가·예비율)에서
        전국 단위로 조망할 수 있다.
      </p>
    </>
  )
}
