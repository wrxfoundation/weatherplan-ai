import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ④참고·인사이트(종합) — DC 사업의 실현가능성 5관문을 흡수 리포트(CBRE·PwC·알스퀘어·IT조선) 수치로 정직하게 연결 */
export default function BuildReality() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3-Minute Easy Read</p>
        <p className="tldr-one">
          “Finding good land is only the start. A data center business must clear five gates —{' '}
          <strong>can you build it (site, power, capital)</strong> and{' '}
          <strong>can you fill it (GPU spec, utilization)</strong>. If even one is blocked, it’s over.”
        </p>
        <ol>
          <li>
            <strong>Gate 1 Site</strong> — Even with land in hand, you get blocked at permitting and community
            acceptance. The final approval rate for Seoul-metropolitan grid review is{' '}
            <strong>1.9%</strong>, and projects have fallen through one after another over conflict.
          </li>
          <li>
            <strong>Gate 2 Power</strong> — Above 40MW you need 154kV, and before that you must pass a “can we
            give you the electricity” review. In the capital region, more than half get a verdict of{' '}
            <strong>supply not available</strong>. So some, like SK in Ulsan, detour via{' '}
            <strong>self-generation</strong>.
          </li>
          <li>
            <strong>Gate 3 Capital</strong> — A single hyperscale runs roughly{' '}
            <strong>KRW 1 trillion in total project cost</strong>. Only once site and power are secured do the
            lenders come in, and project financing only turns once a resale (Exit) picture holds up 3–8 years
            out.
          </li>
          <li>
            <strong>Gate 4 GPU / Spec</strong> — Even if you obtain GPUs (competing with neoclouds), if the
            building is <strong>an older design it can’t take the latest GPUs</strong>. Without a load capacity
            of 2.5 tons/㎡, 40–50kW per rack, and liquid cooling, it’s just an empty building.
          </li>
          <li>
            <strong>Gate 5 Utilization</strong> — Even fully built, it only makes money once{' '}
            <strong>filled</strong>. Domestic GPU utilization is 30–40%. Only sites that locked in tenants in
            advance (pre-lease) stay full.
          </li>
        </ol>
        <p>
          <strong>Bottom line in one sentence</strong> — “digestible data centers” do exist. But only those{' '}
          <strong>that secure a prime anchor in advance (pre-lease) and meet the latest specs (load, power
          density, liquid cooling)</strong>. Speculative small-scale development trips at Gates 4 and 5.
        </p>
      </div>

      <p>
        The 5-axis score of <Link to="/">AI InfraMap</Link> answers “<strong>where</strong> to build.” But even
        after finding good land, a project must clear, in order, five gates:{' '}
        <strong>securing the site → power intake → capital raising → GPU procurement and spec fit → utilization
        (digestion)</strong>. This piece honestly connects those five gates using the actual figures from the
        reports we have absorbed (
        <Link to="/insights/cbre-exit-scarcity-2026">CBRE</Link>·
        <Link to="/insights/pwc-value-chain-2026">Samil PwC</Link>·
        <Link to="/insights/rsquare-realestate-2025">RSquare</Link>·
        <Link to="/insights/gpu-utilization-2026">IT Chosun</Link>).
      </p>

      <h2>Gate 1 — Site: even with land, passing is hard</h2>
      <p>
        Land can be bought with money. The problem is whether you are <strong>allowed to build</strong> a data
        center on it. The final approval rate for the main review of the Seoul-metropolitan power-grid impact
        assessment is <strong>1.9%</strong>(<Link to="/insights/pwc-value-chain-2026">2 out of 100
        applications</Link>), and before approval there is one more gate — <strong>community acceptance</strong>.
        As in Sejong Eojin-dong and Goyang Deogi-dong, projects have fallen through one after another over
        procedure and communication (<Link to="/insights/dc-coexistence-2026">acceptance = the fourth siting
        axis</Link>). This is exactly where AI InfraMap quantifies: it overlays grid headroom, approval rates,
        population grids, and development-conflict history at the point level.
      </p>

      <h2>Gate 2 — Power: the intake track and self-generation</h2>
      <p>
        A single data center consumes as much electricity as a mid-sized city. Once the MW figure produced by
        the calculator <strong>exceeds 10MW it is subject to a grid impact assessment, and above 40MW a 154kV
        intake obligation applies</strong>(<Link to="/insights/power-track-40mw">the 40MW wall</Link>). In the
        capital region, more than half (53.4%) receive a “supply not available” verdict at the first technical
        review. So <strong>SK in Ulsan</strong> detours around the grid with LNG cogeneration{' '}
        <strong>self-generation</strong>(about 213GWh per year), and non-capital regions shift weight toward
        areas with high power self-sufficiency (Gyeongbuk and Jeonnam at 200%+). The map’s{' '}
        <Link to="/?layers=headroom">substation headroom layer</Link> is the physical basis for this gate.
      </p>

      <h2>Gate 3 — Capital: trillion-won PF and the resale (Exit) picture</h2>
      <p>
        The total project cost of a single hyperscale is around <strong>KRW 1 trillion</strong>(Keppel Ansan
        data center, 60MW intake). This money only attracts lenders once site and power are secured — the order
        is not reversed. And domestic development capital is mostly project funds premised on{' '}
        <strong>a sale (Exit) within 3–8 years</strong>, so “to whom will it be resold” is designed in from the
        very start. The buyer pool <Link to="/insights/cbre-exit-scarcity-2026">CBRE</Link> maps widens from
        domestic institutions (Epoch Anyang, KRW 840 billion) → global infrastructure (Hanam, KRW 734 billion)
        → global DC-specialist capital (Keppel DC REIT). Capital is a <strong>function</strong> of site and
        power, not an independent variable.
      </p>

      <h2>Gate 4 — GPU procurement and spec: even obtained, if it doesn’t fit you can’t install it</h2>
      <p>
        GPUs are hard twice over. First, <strong>procurement</strong> — with the government buying 9,704 units
        for KRW 2.08 trillion, the private sector fights for volume against global CSPs and neoclouds (CoreWeave,
        Lambda, Crusoe). The trickier part is <strong>spec fit</strong>. GPUs bring out a new generation every
        2–3 years like smartphones (H100 at ~15kW per rack → Blackwell → Rubin → Feynman at 50kW+), and the
        latest AI servers demand <strong>40–100kW per rack, a 2.5-ton/㎡ load, and liquid cooling</strong>. An
        older-design building, however well built, <strong>physically cannot take</strong> the latest GPUs — the{' '}
        <Link to="/insights/cbre-exit-scarcity-2026">physical obsolescence</Link> that CBRE named its “hardest
        risk to predict.” On top of that, Korea uses a fully fitted model in which the landlord delivers even
        the cooling and power equipment, so <strong>the landlord bears</strong> this upgrade cost. That is why{' '}
        <Link to="/insights/liquid-cooling-brief">liquid-cooling</Link> readiness is, in effect, the asset’s
        lifespan.
      </p>

      <h2>Gate 5 — Utilization: building it doesn’t fill it</h2>
      <p>
        The last gate is the coldest. Even fully built, it only makes money once <strong>filled</strong>. Yet
        domestic GPU utilization is <strong>30–40%</strong>, and 86% of firms running their own GPUs are below
        50% utilization (<Link to="/insights/gpu-utilization-2026">demand-side signal</Link>). Even if the
        technology (GPUaaS) exists, if the layer of demand that repeatedly uses domestic capacity is thin, a
        cluster sits idle once training ends. In other words,{' '}
        <strong>the applied-for power capacity (7,343MW) is not operating load</strong>. An empty data center
        is not an asset but a liability.
      </p>

      <h2>So — do “digestible data centers” exist in reality?</h2>
      <p>
        They do. But the conditions are clear:{' '}
        <strong>data centers that secure a prime anchor tenant in advance (pre-lease) and meet the latest specs</strong>.
        By CBRE’s count, <strong>88% of capital-region floor space is tied up in long-term leases with prime
        anchors</strong>, and the pre-lease share of pre-completion buildings rises from 16% in 2027 to 23.5%
        in 2028. In practice, <strong>AWS Incheon 650MW</strong>, the{' '}
        <Link to="/insights/hyperscale-jukjeon">Jukjeon Pacific Sunny (100MW)</Link> where a global CSP
        pre-secured five floors, and <strong>Keppel Ansan</strong>, premised on securing a hyperscale lease,
        are cases where “who fills it was decided before it was built.” Conversely, speculative small-scale
        development without an anchor and with only an old spec trips at Gates 4 and 5 — it can’t take the
        latest GPUs (spec), or it takes them but doesn’t fill (utilization).
      </p>

      <h2>Service coordinates — how far do we answer?</h2>
      <p>
        Let’s draw the line honestly. What AI InfraMap <strong>quantifies</strong> is Gates 1 and 2 (site and
        power) — the 5-axis score of any point, the outlook for passing the grid impact assessment, the 40MW
        track, and substation headroom. Gates 3, 4, and 5 (capital, GPU, utilization) we{' '}
        <strong>contextualize with market data</strong> — the calculator’s MW output and the spec, obsolescence,
        and demand-side insights play that role. The rest — namely{' '}
        <strong>capital-raising capacity and GPU procurement and anchor securing</strong> — is an operator’s
        proprietary capability, an area we cannot score. Not blurring that boundary —{' '}
        <Link to="/insights/land-pulse-methodology">not making things up</Link> — is this service’s principle.
        A siting score is only the <strong>first</strong> of the five gates, nothing more and nothing less.
      </p>
    </>
  ) : (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3분 쉽게 읽기</p>
        <p className="tldr-one">
          “좋은 땅을 찾는 건 시작일 뿐이다. 데이터센터 사업은 <strong>지을 수 있나(부지·전력·자금)</strong>와{' '}
          <strong>채울 수 있나(GPU 규격·가동률)</strong>라는 5개 관문을 다 통과해야 한다. 하나라도 막히면
          끝이다.”
        </p>
        <ol>
          <li>
            <strong>관문1 부지</strong> — 땅이 있어도 인허가·주민 수용성에서 막힌다. 수도권 계통 심사 최종
            승인율 <strong>1.9%</strong>, 갈등으로 무산된 사업이 줄줄이.
          </li>
          <li>
            <strong>관문2 전력</strong> — 40MW를 넘으면 154kV, 그 전에 “전기 줄 수 있나” 심사를 통과해야 한다.
            수도권은 절반 넘게 <strong>공급 불가</strong>. 그래서 울산 SK처럼 <strong>자가발전</strong>으로
            우회하기도 한다.
          </li>
          <li>
            <strong>관문3 자금</strong> — 하이퍼스케일 한 채가 <strong>총사업비 1조 원</strong> 안팎. 부지·전력을
            확보해야 대주단이 붙고, 3~8년 뒤 되팔(Exit) 그림이 서야 PF가 돈다.
          </li>
          <li>
            <strong>관문4 GPU·규격</strong> — GPU를 구해도(네오클라우드와 경쟁) 건물이 <strong>구형 설계면 최신
            GPU를 못 받는다</strong>. 하중 2.5톤/㎡·랙당 40~50kW·액체냉각이 안 되면 그냥 빈 건물.
          </li>
          <li>
            <strong>관문5 가동률</strong> — 다 지어도 <strong>채워야</strong> 돈이 된다. 국내 GPU 가동률은
            30~40%. 세입자를 미리 잡아둔(선임차) 곳만 안 빈다.
          </li>
        </ol>
        <p>
          <strong>결론 한 줄</strong> — “소화 가능한 데이터센터”는 실재한다. 단, <strong>우량 앵커를 미리 확보하고
          (선임차) 최신 규격(하중·전력밀도·액랭)을 갖춘 것</strong>만. 투기적 소형 개발은 4·5관문에서 걸린다.
        </p>
      </div>

      <p>
        <Link to="/">AI InfraMap</Link>의 5축 스코어는 “<strong>어디에</strong> 지을까”를 답한다. 그런데 좋은 땅을
        찾은 뒤에도 사업은 <strong>부지 확보 → 전력 수전 → 자금 조달 → GPU 조달·규격 적합 → 가동률(소화)</strong>이라는
        5개 관문을 차례로 통과해야 한다. 이 글은 우리가 흡수한 리포트들(
        <Link to="/insights/cbre-exit-scarcity-2026">CBRE</Link>·
        <Link to="/insights/pwc-value-chain-2026">삼일PwC</Link>·
        <Link to="/insights/rsquare-realestate-2025">알스퀘어</Link>·
        <Link to="/insights/gpu-utilization-2026">IT조선</Link>)의 실제 수치로 그 5관문을 정직하게 잇는다.
      </p>

      <h2>관문 1 — 부지: 땅이 있어도 통과가 어렵다</h2>
      <p>
        땅은 돈이면 살 수 있다. 문제는 그 위에 데이터센터를 <strong>지어도 되느냐</strong>다. 수도권 전력계통영향평가
        본심사 최종 승인율은 <strong>1.9%</strong>(<Link to="/insights/pwc-value-chain-2026">100곳 신청에 2곳</Link>),
        그리고 승인 이전에 <strong>주민 수용성</strong>이라는 관문이 하나 더 있다 — 세종 어진동·고양 덕이동처럼
        절차·소통에서 무산된 사업이 줄줄이다(<Link to="/insights/dc-coexistence-2026">수용성=네 번째 입지 축</Link>).
        AI InfraMap이 정량화하는 지점이 바로 여기다: 계통 여유·승인율·인구 격자·개발 갈등 이력을 지점 단위로 겹쳐
        본다.
      </p>

      <h2>관문 2 — 전력: 수전 트랙과 자가발전</h2>
      <p>
        데이터센터 하나가 중소도시만큼 전기를 먹는다. 계산기가 산출한 MW가 <strong>10MW를 넘으면 계통영향평가
        대상, 40MW를 넘으면 154kV 수전 의무</strong>다(<Link to="/insights/power-track-40mw">40MW의 벽</Link>).
        수도권은 1차 기술검토에서 절반 넘게(53.4%) “공급 불가” 판정을 받는다. 그래서 <strong>울산 SK</strong>는
        계통에 기대지 않고 LNG 열병합 <strong>자가발전</strong>(연 약 213GWh)으로 우회하고, 비수도권은 전력
        자립도가 높은 곳(경북·전남 200%+)으로 무게가 옮겨간다. 맵의{' '}
        <Link to="/?layers=headroom">변전소 여유 레이어</Link>가 이 관문의 물리적 근거다.
      </p>

      <h2>관문 3 — 자금: 조 단위 PF와 되팔 그림(Exit)</h2>
      <p>
        하이퍼스케일 한 채의 총사업비는 <strong>1조 원</strong> 안팎이다(Keppel 안산 데이터센터, 수전 60MW).
        이 돈은 부지·전력이 확보돼야 대주단이 붙는다 — 순서가 거꾸로가 아니다. 그리고 국내 개발 자본은 대개
        <strong> 3~8년 내 매각(Exit)</strong>을 전제한 프로젝트 펀드라, “누구에게 되팔 것인가”가 처음부터
        설계에 들어간다. <Link to="/insights/cbre-exit-scarcity-2026">CBRE</Link>가 그린 매수자 풀은 국내 기관
        (에포크 안양 8,400억)→글로벌 인프라(하남 7,340억)→글로벌 DC 전문 자본(Keppel DC REIT)으로 넓어진다.
        자금은 부지·전력의 <strong>함수</strong>이지 독립 변수가 아니다.
      </p>

      <h2>관문 4 — GPU 조달·규격: 구해도, 안 맞으면 못 넣는다</h2>
      <p>
        GPU는 두 번 어렵다. 먼저 <strong>확보</strong> — 정부가 2조800억으로 9,704장을 사들이는 판에, 민간은
        글로벌 CSP·네오클라우드(코어위브·람다·크루소)와 물량을 다툰다. 더 까다로운 건 <strong>규격 적합</strong>이다.
        GPU는 스마트폰처럼 2~3년마다 신형이 나오는데(H100 랙당 ~15kW → 블랙웰 → 루빈 → 파인만 50kW+), 최신 AI
        서버는 <strong>랙당 40~100kW, 하중 2.5톤/㎡, 액체냉각</strong>을 요구한다. 구형 설계 건물은 아무리 잘
        지었어도 최신 GPU를 <strong>물리적으로 못 받는다</strong> — CBRE가 “가장 예측하기 어려운 리스크”로
        꼽은 <Link to="/insights/cbre-exit-scarcity-2026">물리적 진부화</Link>다. 게다가 한국은 냉각·전력설비까지
        임대인이 인도하는 완전 설비형이라, 이 업그레이드 비용을 <strong>집주인이 떠안는다</strong>. 그래서{' '}
        <Link to="/insights/liquid-cooling-brief">액체냉각</Link> 대응이 곧 자산의 수명이다.
      </p>

      <h2>관문 5 — 가동률: 지었다고 채워지지 않는다</h2>
      <p>
        마지막 관문이 가장 냉정하다. 다 지어도 <strong>채워야</strong> 돈이 된다. 그런데 국내 GPU 가동률은
        <strong> 30~40%</strong>, 자체 GPU 운영 기업의 86%가 가동률 50% 이하다(
        <Link to="/insights/gpu-utilization-2026">수요측 신호</Link>). 기술(GPUaaS)은 있어도 국산을 반복
        사용하는 수요층이 얇으면, 학습이 끝난 클러스터는 유휴로 남는다. 즉 <strong>전기 신청 용량(7,343MW)은
        가동 부하가 아니다</strong>. 빈 데이터센터는 자산이 아니라 부채다.
      </p>

      <h2>그래서 — “소화 가능한 데이터센터”는 현실에 있나</h2>
      <p>
        있다. 단, 조건이 분명하다. <strong>우량 앵커 테넌트를 미리 확보(선임차)하고, 최신 규격을 갖춘</strong>
        데이터센터다. CBRE 집계로 수도권 상면의 <strong>88%가 우량 앵커 장기 임차</strong>로 묶여 있고, 완공 전
        건물의 선임차 비중은 2027년 16%→2028년 23.5%로 오른다. 실제로{' '}
        <strong>AWS 인천 650MW</strong>, 글로벌 CSP가 5개 층을 선확보한{' '}
        <Link to="/insights/hyperscale-jukjeon">죽전 퍼시픽써니(100MW)</Link>, 하이퍼스케일 임차 확보를 전제한
        <strong> Keppel 안산</strong>은 “짓기 전에 채울 사람이 정해진” 사례다. 반대로 앵커 없이 규격만 구형인
        투기적 소형 개발은 4·5관문에서 걸린다 — 최신 GPU를 못 받거나(규격), 받아도 안 채워진다(가동률).
      </p>

      <h2>서비스 좌표 — 우리는 어디까지 답하나</h2>
      <p>
        정직하게 긋자. AI InfraMap이 <strong>정량화</strong>하는 것은 관문 1·2(부지·전력) — 임의 지점의 5축
        스코어, 계통영향평가 통과 전망, 40MW 트랙, 변전소 여유다. 관문 3·4·5(자금·GPU·가동률)는{' '}
        <strong>시장 데이터로 맥락화</strong>한다 — 계산기의 MW 산출, 규격·진부화·수요측 인사이트가 그 역할이다.
        나머지, 즉 <strong>자금 동원력과 GPU 조달·앵커 확보</strong>는 사업자 고유 역량이라 우리가 점수 매길 수
        없는 영역이다. 그 경계를 흐리지 않는 것 —{' '}
        <Link to="/insights/land-pulse-methodology">지어내지 않는 것</Link>이 이 서비스의 원칙이다. 입지 점수는
        5관문의 <strong>첫 관문</strong>일 뿐, 그 이상도 이하도 아니다.
      </p>
    </>
  )
}
