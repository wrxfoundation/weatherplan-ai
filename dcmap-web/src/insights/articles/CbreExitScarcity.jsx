import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ④참고·인사이트(글로벌 부동산 리서치) — 수치는 CBRE 리포트 Figure 단위로 인용, 재인용 출처는 출처 박스에 명시 */
export default function CbreExitScarcity() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3-Minute Easy Read</p>
        <p className="tldr-one">
          “AI makes data centers desperately needed, but the capital region has no electricity to spare, so new
          ones can’t be built. So a data center that has already secured power can name its price — but there
          are 3 traps.”
        </p>
        <ol>
          <li>
            <strong>Why the frenzy</strong> — The four firms Google, MS, Amazon, and Meta say they’ll spend up
            to USD 1.1 trillion (about KRW 1,500 trillion, more than double Korea’s annual budget) on data
            centers. This is not a passing fad but a structural trend.
          </li>
          <li>
            <strong>Why they can’t build</strong> — A single data center eats as much electricity as a mid-sized
            city, yet the final approval rate of KEPCO’s capital-region review is <strong>1.9%</strong>(2 out of
            every 100 applications). New substations are earmarked for Yongin semiconductors and new towns, and
            the ultra-high-voltage lines (HVDC) to bring in regional power won’t be usable until after 2030.
          </li>
          <li>
            <strong>What resulted</strong> — It’s just like redevelopment. New district designation is blocked,
            and when only already-started districts remain, prices jump. Rents rose <strong>+70%</strong> over
            6 years, vacancy is under 5%, and even buildings completing in 2027–28 have tenants lining up to
            contract in advance (pre-lease).
          </li>
          <li>
            <strong>Trap ① the old formula no longer works</strong> — The real-estate classic of “buy and wait
            and it rises” is over. On the surface, Seoul’s yield (cap rate) is higher than Tokyo’s, so it looks
            “still cheap,” but <strong>relative to risk there is already no room left to compress</strong>. That
            is because the pure risk premium net of the base rate (the spread) is about 3.4%p in Seoul — the same
            as ultra-low-rate Japan and actually tighter than Singapore (4.8%p). In other words, investors are
            already pricing Seoul data centers as safely as a mature market, so the surface-level high yield does
            not read as ‘upside.’ Now it’s a fight not for capital gains but for growing{' '}
            <strong>rent (NOI)</strong>.
          </li>
          <li>
            <strong>Trap ② the building lasts 40 years, the inside 2–3</strong> — GPUs bring out a new
            generation every 2–3 years like smartphones, eating several times the power and heat. Older-design
            buildings can’t take them. On top of that, Korea uses ‘Fully Fitted’ contracts, so the cooling and
            power upgrade cost <strong>falls on the landlord</strong> (in the US the tenant bears it). This
            future cost is almost never reflected in today’s transaction prices.
          </li>
          <li>
            <strong>Trap ③ rent increases are locked</strong> — Korean practice is a fixed 2% per year, so net
            of inflation the real rent stands still. That said, it is loosening lately as 10-year long-term
            contracts with 3% per year and inflation indexing grow.
          </li>
          <li>
            <strong>Can it actually be sold (Exit)</strong> — Until now it was a narrow market among domestic
            managers, but Singapore’s Keppel put about KRW 100 billion into the Ansan data center. The report’s
            highlight is that “develop and stabilize via a fund → sell to one’s own listed REIT” (a 50% IRR
            verified in Singapore) may work in Korea for the first time. But global heavyweights attach demanding
            conditions like 6-year+ long-term contracts and tenant-borne costs (Triple Net).
          </li>
        </ol>
        <p>
          <strong>Bottom line in one sentence</strong> — the reason to buy is clear (power-secured assets keep
          getting scarcer). But the rules have changed from “buy and it rises” to{' '}
          <strong>“a game won by those who can grow the rent and even calculate the cost of GPU generational
          turnover.”</strong> Below unpacks that basis with the report’s figures.
        </p>
      </div>

      <p>
        CBRE Korea’s “Korea Data Center Investment — A Diagnosis of the Scarcity Premium Created by Supply
        Constraints and Exit Feasibility” (2026.7, 45p) reads data centers in <strong>the language of capital</strong>.
        Where the <Link to="/insights/rsquare-realestate-2025">RSquare report</Link> was real-estate statistics
        on permitting, transactions, and rents, and <Link to="/insights/pwc-value-chain-2026">Samil PwC</Link>
        was the value chain of the supply-demand gap, CBRE poses the next question —{' '}
        <strong>“this asset — who, at what yield, and how, will resell it (Exit).”</strong> The conclusion meets
        our map’s premise exactly: <strong>a site that has pre-empted power is a scarce asset.</strong>
      </p>

      <h2>Demand is structural; supply was blocked by power</h2>
      <p>
        The current capital-region data-center vacancy rate is <strong>1.4%</strong>(an all-time low), and floor
        rent surged about <strong>70%</strong> over 6 years from KRW 140,000/kW in 2019 to{' '}
        <strong>KRW 250,000/kW</strong> in 2025 (CAGR +9.4%). Demand is 54% global CSPs and 34% domestic IT
        firms, with prime anchor tenants tying up <strong>88% in long-term leases</strong>. Added to this are
        three latent demand groups — AI internalization by finance, public sovereign AI, and large-enterprise
        AX transformation. Korea ranks top across all three axes of AI adoption (world No.1 in the increase in
        diffusion rate), development (14.31 AI patents per 100,000 people, overwhelming the US at 4.68 and China
        at 6.95), and production (world No.3 in model releases) — that is CBRE’s demand fundamental.
      </p>
      <p>
        The problem is supply. The <strong>final approval rate of the capital-region power-grid impact
        assessment is 1.9%</strong>, and real power utilization after the west-coast HVDC completes is projected
        for <strong>after 2030</strong>. The diagnosis is that this phase of extremely high entry barriers is
        the inflection point that <strong>pushes to a peak the scarcity value of completed assets that have
        already secured power</strong>. To <Link to="/insights/rsquare-realestate-2025">RSquare’s picture</Link>
        that the permitting cliff is the supply cliff, CBRE adds “and so the value of already-secured assets
        rises.”
      </p>

      <h2>The 20-year cap-rate compression cycle is over — returns now come from NOI growth</h2>
      <p>
        88% of investors expect data-center prices to rise (the highest of all asset classes). But CBRE’s sober
        warning starts here. The key is not the absolute cap rate but the{' '}
        <strong>spread (the pure risk premium net of the base rate)</strong>. The tentative cap rate for
        Seoul-metropolitan hyperscale is <strong>5.3–6.5%</strong>, and by absolute figure alone it looks
        higher than Tokyo (around 4.5%), so it seems “still cheap.” But the spread over the base rate (2.5%) is{' '}
        <strong>about 3.4%p</strong> — already the same level as ultra-low-rate Japan and{' '}
        <strong>actually tighter</strong> than the global financial hub Singapore (4.8%p). It means the risk
        premium investors demand of Seoul data centers is already compressed to a mature-market level — a
        paradoxical state where <strong>it looks cheaper than Tokyo by absolute figure yet has no further
        room to compress relative to risk</strong>. So Seoul’s high cap rate does not read as ‘upside room.’
        The implied cap rate of US listed DC REITs (NAREIT) compressed over 20 years from 13–14% in 2005 to{' '}
        <strong>5–6%</strong> in 2026, and the policy-rate spread is at a <strong>20-year low of 1.5–2%p</strong>
        now, down from 5–8%p in the zero-rate era.
      </p>
      <p>
        The implication is clear — <strong>dramatic capital gains via further cap-rate compression are
        structurally hard to expect.</strong> This is a paradoxical signal that data centers have settled in as
        an institutional-grade asset shoulder to shoulder with offices and logistics, and it means the future
        return path has shifted to <strong>rent-growth rate (NOI growth)</strong> and{' '}
        <strong>defense against technical obsolescence</strong>. One must see both the survey saying “prices
        will rise” and the capital-market physics saying “they can’t easily rise further.”
      </p>

      <h2>Development capital premised on a 3–8 year Exit ties down NOI growth</h2>
      <p>
        Unlike US listed REITs with 15–20 year long-term leases, domestic data centers are mostly designed as{' '}
        <strong>project funds and PFVs premised on a sale within 3–8 years</strong>. When this combines with a
        rent discount over the 0–36 month initial ramp-up and{' '}
        <strong>a low fixed escalation of around 2.0% per year</strong> (real stagnation to decline given
        domestic inflation), early NOI growth is structurally tied down over the holding period of a fund aiming
        for a short-term sale. In the US, 15–20 year contracts with CPI indexing (or 3%) are the standard.
      </p>
      <p>
        That said, CBRE also notes easing signals. On robust demand, global operators secure at least 10-year
        long-term leases when contracting 10MW or more, and as CPI indexing and 3.0% increases become common in
        end-user contracts, the risks that once blocked NOI growth are being partly offset. It is the same
        direction as <Link to="/insights/rsquare-realestate-2025">RSquare’s observation</Link> that lease
        structures are being reorganized <strong>from a per-rack basis to a power-capacity (kW) basis</strong>.
      </p>

      <h2>The hardest risk to predict — the building lasts 30–40 years, the GPU 2–3</h2>
      <p>
        What CBRE pointed to as “the hardest risk to predict” is <strong>physical obsolescence</strong>. A
        building’s useful life is 30–40 years, but GPU generational turnover is on a 2–3 year cycle. NVIDIA’s
        roadmap soars from H100 (industry-average power density ~15kW) → Blackwell (15–25kW) → Rubin (25–50kW)
        → Feynman (50kW+), and real operating power for the AI server class is already 40–100kW, with peak
        maxima reaching <strong>250–1,000kW per rack</strong>. Obsolescence takes shape along four axes —{' '}
        <strong>load</strong> (1.5→2.5 tons/㎡)·<strong>power density</strong> (5kW→40–50kW)·
        <Link to="/insights/liquid-cooling-brief">cooling</Link> (air→liquid)·
        <strong>fully-fitted depreciation</strong>.
      </p>
      <p>
        The crux is <strong>who bears</strong> the risk. Where the global market commonly uses Triple Net
        (Core &amp; Shell), in which the tenant pays for IT equipment and obsolescence, Korea commonly uses the{' '}
        <strong>fully fitted</strong> model in which the landlord delivers even the infrastructure, so the
        landlord bears the reinvestment (CapEx) risk. CBRE’s warning: “In domestic DC transactions, precedents
        where physical-obsolescence cost is explicitly discounted into the price are extremely rare.” This is,
        in effect, the asset-value-language translation of why we have said one must look at{' '}
        <Link to="/insights/gpu-utilization-2026">30–40% utilization</Link> together with the{' '}
        <Link to="/calc">design intake capacity of the GPU calculator</Link>.
      </p>

      <h2>The buyer pool widens from domestic institutions → global infrastructure → global DC-specialist capital</h2>
      <p>
        CBRE diagnoses Exit feasibility through <strong>a 3-way classification of the buyer pool</strong>. ①{' '}
        <strong>Domestic institutional capital</strong> (5–7 year short-term; Epoch Anyang center about KRW 840
        billion·40MW in progress) → ② <strong>Global infrastructure capital</strong> (10 years+; Macquarie
        Infrastructure, KKR, Blackstone, Brookfield, GIC, CPP; Hanam data center KRW 734 billion, Igis →
        Macquarie) → ③ <strong>Global DC-specialist capital</strong> (perpetual; Keppel DC REIT, Equinix,
        Digital Realty). It is a signal that data centers are being incorporated as an institutional asset class
        in commercial real-estate transactions, and large deals in prime assets such as Sejong Telecom’s Bundang
        IDC are following.
      </p>
      <p>
        The benchmark is Singapore’s <strong>Keppel DC REIT</strong> — growing 6x over 10 years from SGD 1
        billion AUM in 2014 to about <strong>USD 6.3 billion in 2025</strong> (95.6% occupancy·6.5-year WALE),
        and in its 2025 official announcement it <strong>named Korea, alongside Japan and Europe, as a core
        Asia-Pacific hub</strong>. It is proof that global DC-specialist capital already recognizes the scarcity
        premium of the capital region’s power-secured assets. But their entry is premised on a Triple Net
        structure and securing a long-term WALE of 6 years or more — the restructuring of the domestic lease
        structure seen earlier becomes the key to Exit.
      </p>

      <h2>The Ansan data center — the first operation of a Korean-style ‘fund→REIT’ Exit pipeline</h2>
      <p>
        Keppel has repeated a virtuous-cycle Exit of developing and stabilizing via a private fund, then selling
        to the public-market Keppel DC REIT (Singapore’s KDC SGP 7·8 was a REIT sale of about KRW 1.6 trillion
        in 2024, an LP-basis IRR of about 50%). The case where this structure first took concrete shape in Korea
        is the <strong>Ansan data center</strong> (60MW intake·40MW IT, Wonsi-dong, Banwol National Industrial
        Complex, Gyeonggi) — Keppel Fund No.3 was the main investor, and with the SPA signed in May 2026 it
        became <strong>Keppel’s first DC investment asset in Korea</strong>. Total project cost is about KRW 1
        trillion, with Hyundai E&amp;C, Shinyoung, and lenders jointly participating, targeting{' '}
        <strong>service start in 2030</strong> after conversion to main PF in September. It is the most direct
        precedent showing that the advanced-economy path — in which the Exit of a domestic asset moves beyond
        repeated short-term trading to <strong>transfer to global perpetual capital</strong> — can work in Korea
        too.
      </p>

      <h2>The 6 AIDC special-act exceptions — capital-region scarcity consolidates, non-capital thresholds ease</h2>
      <p>
        Policy direction is a <strong>core opportunity factor</strong> CBRE singled out. The Special Act for the
        Promotion of the AI Data Center Industry contains 6 exceptions: batch permit processing (Art. 18;
        power-grid impact assessment 150 days·building permit 40 days·<strong>a timeout system deeming
        completion if not notified within the deadline</strong>)·<strong>exemption from the power-grid impact
        assessment (Art. 19, non-capital only)</strong>·direct renewable supply (Art. 20, third-party PPA)·
        eased facility-installation standards (Art. 21)·industrial-siting and harbor-act exceptions (Arts. 22–23)·
        AI DC special zones (Arts. 24, 26). Because the core benefit — grid-impact-assessment exemption — applies
        only to non-capital regions, <strong>the scarcity of the capital region’s power-secured assets actually
        consolidates structurally</strong> — a structure in which the more deregulation lowers the non-capital
        development threshold, the more the premium of capital-region completed assets grows. Regional power
        self-sufficiency backs this up (Gyeongbuk and Jeonnam at 200%+ vs. Seoul at 12% and Gyeonggi at 62%).
      </p>

      <h2>How to read it — the 3-stage unfolding of the scarcity premium</h2>
      <p>
        CBRE’s conclusion is the convergence of three axes — demand, supply, and capital. Demand rises
        structurally on AI, supply is blocked by power constraints, and capital widens the buyer pool from
        domestic to global — at their intersection lies <strong>the scarcity premium of power-secured assets</strong>.
        The unfolding is drawn in 3 stages: <strong>scarcity recognition in 2026–27 → transaction activation in
        2028–29 → investment stabilization in 2030</strong>. Risks (the end of cap-rate compression, short-term
        NOI-growth constraints, physical obsolescence) persist, but the diagnosis is that the capital-region
        scarcity created by the government’s power-supply-limiting policy offsets them.
      </p>
      <p>
        Three reports — real estate (RSquare), value chain (PwC), and capital markets (CBRE) — set out from
        different doors and arrive at the same room:{' '}
        <strong>“a site that has pre-empted power is the asset, and its scarcity is the premium.”</strong> On
        the map, turning on the <Link to="/?layers=pipeline">planned-supply layer</Link> and the{' '}
        <Link to="/?layers=headroom">substation headroom layer</Link> lets you overlay, at the point level,
        which sites hold the physical basis of this premium — down to the likelihood of passing the grid impact
        assessment and the substation’s power-supply headroom.
      </p>
    </>
  ) : (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3분 쉽게 읽기</p>
        <p className="tldr-one">
          “AI 때문에 데이터센터가 미친 듯이 필요한데, 수도권엔 줄 전기가 없어서 새로 못 짓는다. 그러니 이미 전기를
          확보해둔 데이터센터는 부르는 게 값이다 — 단, 함정이 3개 있다.”
        </p>
        <ol>
          <li>
            <strong>왜 난리인가</strong> — 구글·MS·아마존·메타 4곳이 데이터센터에 쓰겠다는 돈이 최대 1.1조 달러
            (약 1,500조 원, 우리나라 1년 예산의 두 배 이상). 반짝 유행이 아니라 구조적 흐름이다.
          </li>
          <li>
            <strong>왜 못 짓나</strong> — 데이터센터 하나가 중소도시만큼 전기를 먹는데, 수도권 한전 심사 최종
            승인율이 <strong>1.9%</strong>(100곳 신청하면 2곳). 새 변전소는 용인 반도체·신도시 몫이고, 지방 전기를
            끌어올 초고압선(HVDC)은 2030년 이후에야 쓴다.
          </li>
          <li>
            <strong>그래서 생긴 일</strong> — 재개발과 똑같다. 새 구역 지정은 막혔고 이미 착공한 구역만 남으면
            값이 뛴다. 임대료 6년간 <strong>+70%</strong>, 공실률 5% 미만, 2027~28년 완공 건물에도 세입자가 줄
            서서 미리 계약(선임차)한다.
          </li>
          <li>
            <strong>함정 ① 옛 공식이 안 통함</strong> — “사놓고 기다리면 오른다”는 부동산 클래식이 끝났다. 겉보기
            서울 수익률(캡레이트)은 도쿄보다 높아 “아직 싸다”처럼 보이지만, <strong>위험 대비로는 이미 눌릴 공간이
            없다</strong>. 기준금리를 뺀 순수 위험 프리미엄(스프레드)이 서울은 약 3.4%p로 초저금리 일본과 같고
            싱가포르(4.8%p)보다 오히려 타이트하기 때문. 즉 투자자들이 서울 데이터센터를 벌써 성숙 시장만큼
            안전하게 값매기고 있어서, 겉의 높은 수익률이 ‘상승 여지’로 안 읽힌다. 이제는 시세차익이 아니라{' '}
            <strong>월세(NOI)</strong> 키우기 싸움.
          </li>
          <li>
            <strong>함정 ② 건물은 40년, 속은 2~3년</strong> — GPU는 스마트폰처럼 2~3년마다 신형이 나와 전기·열을
            몇 배로 먹는다. 구형 설계 건물은 못 받는다. 게다가 한국은 ‘풀옵션(Fully Fitted)’ 계약이라 냉각·전력
            업그레이드 비용을 <strong>집주인이 뒤집어쓴다</strong>(미국은 세입자 부담). 이 미래 비용이 지금 거래가에
            거의 반영 안 돼 있다.
          </li>
          <li>
            <strong>함정 ③ 월세 인상이 묶임</strong> — 한국 관행이 연 2% 고정이라 물가 빼면 실질 제자리. 다만 최근
            10년 장기계약 + 연 3%·물가연동이 늘며 풀리는 중.
          </li>
          <li>
            <strong>팔리긴 하나(Exit)</strong> — 지금껏 국내 운용사끼리의 좁은 시장이었는데, 싱가포르 Keppel이
            안산 데이터센터에 약 1,000억을 넣었다. “펀드로 개발·안정화 → 자기네 상장 리츠에 매각”(싱가포르에서
            IRR 50% 검증)이 한국에서 처음 작동할 수 있다는 게 리포트의 하이라이트. 단, 글로벌 큰손은 6년+ 장기계약·
            세입자 비용부담(Triple Net) 같은 까다로운 조건을 건다.
          </li>
        </ol>
        <p>
          <strong>결론 한 줄</strong> — 살 이유는 확실하다(전기 따놓은 자산은 계속 귀해진다). 단, “사놓으면 오른다”가
          아니라 <strong>“월세를 키우고, GPU 세대교체 비용까지 계산할 줄 아는 사람이 이기는 게임”</strong>으로 룰이
          바뀌었다. 아래는 그 근거를 리포트 수치로 푼다.
        </p>
      </div>

      <p>
        CBRE 코리아의 「한국 데이터센터 투자 — 공급 제약이 만드는 희소성 프리미엄과 Exit 가능성 진단」(2026.7, 45p)은
        데이터센터를 <strong>자본의 언어</strong>로 읽는다.{' '}
        <Link to="/insights/rsquare-realestate-2025">알스퀘어 리포트</Link>가 인허가·거래·임대료의 부동산 통계였고,{' '}
        <Link to="/insights/pwc-value-chain-2026">삼일PwC</Link>가 수요-공급 갭의 밸류체인이었다면, CBRE는
        그 다음 질문을 던진다 — <strong>“이 자산을, 누가, 얼마의 수익률로, 어떻게 되팔 것인가(Exit).”</strong>
        결론은 우리 맵의 전제와 정확히 만난다: <strong>전력을 선점한 부지가 희소 자산이다.</strong>
      </p>

      <h2>수요는 구조적, 공급은 전력이 막았다</h2>
      <p>
        현재 수도권 데이터센터 공실률은 <strong>1.4%</strong>(역대 최저), 상면 임대료는 2019년 14만 원/kW에서
        2025년 <strong>25만 원/kW</strong>로 6년간 약 <strong>70%</strong> 급등했다(CAGR +9.4%). 수요층은
        글로벌 CSP 54%·국내 IT기업 34%로, 우량 앵커 테넌트가 <strong>88%를 장기 임차</strong>로 묶고 있다.
        여기에 금융권 AI 내재화·공공 소버린 AI·대기업 AX 전환이라는 세 잠재 수요군이 더해진다 — 한국은 AI
        수용(확산율 증가폭 세계 1위)·개발(인구 10만 명당 AI 특허 14.31건, 미국 4.68·중국 6.95 압도)·생산(모델
        출시 세계 3위) 세 축 모두 최상위라는 게 CBRE의 수요 펀더멘탈이다.
      </p>
      <p>
        문제는 공급이다. 수도권 전력계통영향평가 <strong>최종 승인율은 1.9%</strong>, 서해안 HVDC 완공 후
        실질 전력 활용은 <strong>2030년 이후</strong>로 전망된다. 신규 진입 장벽이 극도로 높아진 이 국면이,
        이미 <strong>전력을 확보한 완공 자산의 희소 가치를 최고조로 끌어올리는 변곡점</strong>이라는 진단이다.
        인허가 절벽이 곧 공급 절벽이라던 <Link to="/insights/rsquare-realestate-2025">알스퀘어의 그림</Link>을,
        CBRE는 “그래서 기확보 자산값이 오른다”로 이어 받는다.
      </p>

      <h2>20년 캡레이트 압축 사이클은 끝났다 — 수익은 NOI 성장으로</h2>
      <p>
        투자자의 88%가 데이터센터 가격 상승을 전망한다(전 자산군 중 최고). 그러나 CBRE의 냉정한 경고는 여기서
        시작된다. 여기서 핵심은 절대 캡레이트가 아니라 <strong>스프레드(기준금리를 뺀 순수 위험 프리미엄)</strong>다.
        서울 수도권 하이퍼스케일의 잠정 캡레이트는 <strong>5.3~6.5%</strong>로 절대 수치만 보면 도쿄(4.5% 안팎)보다
        높아 “아직 싸다”처럼 보인다. 그러나 기준금리(2.5%) 대비 스프레드는 <strong>약 3.4%p</strong>로, 이미 초저금리
        일본 시장과 같은 수준이고 글로벌 금융 거점 싱가포르(4.8%p)보다도 <strong>오히려 타이트</strong>하다. 투자자가
        서울 데이터센터에 요구하는 리스크 프리미엄이 벌써 성숙 시장만큼 눌려 있다는 뜻 — <strong>절대 수치론 도쿄보다
        싸 보여도 위험 대비로는 추가 압축 여지가 없는</strong> 역설적 상태다. 그래서 서울의 높은 캡레이트는
        ‘업사이드 여지’로 읽히지 않는다. 미국 상장 DC 리츠(NAREIT)의 내재
        캡레이트는 2005년 13~14%에서 2026년 <strong>5~6%</strong>까지 20년간 압축됐고, 정책금리 스프레드는
        제로금리기 5~8%p에서 현재 <strong>1.5~2%p로 20년 최저</strong>다.
      </p>
      <p>
        함의는 분명하다 — <strong>추가 캡레이트 압축을 통한 극적인 매각차익(Capital Gain)은 구조적으로 기대하기
        어렵다.</strong> 데이터센터가 오피스·물류와 어깨를 나란히 하는 기관급 자산으로 안착했다는 역설적 신호이자,
        향후 수익 경로가 <strong>임대료 상승률(NOI 성장성)</strong>과 <strong>기술적 진부화 방어</strong>로 이동했다는
        뜻이다. “가격이 오를 것”이라는 설문과 “쉽게 더 못 오른다”는 자본시장 물리를 동시에 봐야 한다.
      </p>

      <h2>3~8년 Exit를 전제한 개발 자본이 NOI 성장을 묶는다</h2>
      <p>
        국내 데이터센터는 15~20년 장기 임대차의 미국 상장 리츠와 달리, 대개 <strong>3~8년 내 매각을 전제한
        프로젝트 펀드·PFV</strong>로 설계된다. 여기에 초기 가동 안정화(램프업) 0~36개월의 임대료 디스카운트와
        <strong> 연 2.0% 수준의 낮은 고정 인상률</strong>(국내 물가상승률을 고려하면 실질 정체~감소)이 결합되면,
        단기 매각을 노리는 펀드의 보유 기간 동안 초기 NOI 성장이 구조적으로 묶인다. 미국은 CPI 연동(또는 3%)에
        15~20년 계약이 표준이다.
      </p>
      <p>
        다만 CBRE는 완화 신호도 짚는다. 견고한 수요로 글로벌 사업자가 10MW 이상 계약 시 최소 10년 장기 임차를
        확보하고, 실수요자 계약에서 CPI 연동·3.0% 인상이 일반화되면서 과거 NOI 성장을 막던 리스크가 일부 상쇄되는
        중이라는 것. 임차 구조가 <strong>랙 단위에서 전력 용량(kW) 단위로</strong> 재편된다는{' '}
        <Link to="/insights/rsquare-realestate-2025">알스퀘어의 관찰</Link>과 같은 방향이다.
      </p>

      <h2>가장 예측 어려운 리스크 — 건물은 30~40년, GPU는 2~3년</h2>
      <p>
        CBRE가 “가장 예측하기 어려운 리스크”로 지목한 것은 <strong>물리적 진부화</strong>다. 건물 내용연수는
        30~40년이지만 GPU 세대교체는 2~3년 주기다. 엔비디아 로드맵은 H100(산업 평균 전력밀도 ~15kW)→블랙웰
        (15~25kW)→루빈(25~50kW)→파인만(50kW+)으로 치솟고, AI 서버군 실운영 전력은 이미 40~100kW, 최대 피크는
        <strong> 랙당 250~1,000kW</strong>에 이른다. 진부화는 네 축 — <strong>하중</strong>(1.5→2.5톤/㎡)·
        <strong>전력 밀도</strong>(5kW→40~50kW)·<Link to="/insights/liquid-cooling-brief">냉각</Link>
        (공랭→액랭)·<strong>완전 설비형 감가상각</strong> — 으로 구체화된다.
      </p>
      <p>
        핵심은 리스크의 <strong>부담 주체</strong>다. 글로벌 마켓은 임차인이 IT 장비·진부화 비용을 지불하는
        Triple Net(Core &amp; Shell)이 보편적인 반면, 국내는 인프라까지 임대인이 인도하는 <strong>완전 설비형</strong>이
        보편적이라 재투자(CapEx) 리스크를 임대인이 떠안는다. CBRE의 경고: “국내 DC 거래에서 물리적 진부화 비용이
        가격에 명시적으로 디스카운트된 선례가 극히 드물다.” 우리가{' '}
        <Link to="/insights/gpu-utilization-2026">가동률 30~40%</Link>와{' '}
        <Link to="/calc">GPU 계산기의 설계 수전용량</Link>을 함께 봐야 한다고 말해 온 이유가 자산가치 언어로 번역된
        셈이다.
      </p>

      <h2>매수자 풀은 국내 기관 → 글로벌 인프라 → 글로벌 DC 전문 자본으로 넓어진다</h2>
      <p>
        CBRE는 Exit 가능성을 <strong>매수자 풀 3분류</strong>로 진단한다. ① <strong>국내 기관 자본</strong>
        (5~7년 단기, 에포크 안양센터 약 8,400억·40MW 진행 중) → ② <strong>글로벌 인프라 자본</strong>
        (10년+, 맥쿼리인프라·KKR·블랙스톤·브룩필드·GIC·CPP, 하남 데이터센터 7,340억 이지스→맥쿼리) → ③{' '}
        <strong>글로벌 DC 전문 자본</strong>(영속, Keppel DC REIT·Equinix·Digital Realty). 상업용 부동산
        거래에서 데이터센터가 제도권 자산군으로 편입되는 신호이며, 세종텔레콤 분당 IDC 등 프라임 자산의 대형 거래가
        이어지고 있다.
      </p>
      <p>
        벤치마크는 싱가포르 <strong>Keppel DC REIT</strong>다 — 2014년 AUM 10억 싱가포르달러에서 2025년 약
        <strong> 63억 달러로 10년 6배</strong> 성장(가동률 95.6%·WALE 6.5년), 2025년 공식 발표에서 한국을 일본·
        유럽과 함께 <strong>아태 핵심 허브로 명시</strong>했다. 글로벌 DC 전문 자본이 한국 수도권 기확보 전력자산의
        희소성 프리미엄을 이미 인식하고 있다는 방증이다. 다만 이들의 진입은 Triple Net 구조와 6년 이상 장기 WALE
        확보가 전제 — 앞서 본 국내 임대차 구조의 재구조화가 Exit의 열쇠가 된다.
      </p>

      <h2>안산 데이터센터 — 한국형 ‘펀드→REIT’ Exit 파이프라인의 첫 작동</h2>
      <p>
        Keppel은 사모펀드로 개발·안정화한 뒤 공개 시장 Keppel DC REIT로 매각하는 선순환 Exit를 반복해 왔다
        (싱가포르 KDC SGP 7·8은 2024년 약 1.6조 원 REIT 매각, LP 기준 IRR 약 50%). 이 구조가 한국에서 처음
        구체화된 사례가 <strong>안산 데이터센터</strong>(수전 60MW·IT 40MW, 경기 반월국가산단 원시동)다 —
        Keppel 펀드 3호가 메인 투자, 2026년 5월 SPA 체결로 Keppel의 <strong>한국 첫 DC 투자 자산</strong>이
        됐다. 총사업비 약 1조 원, 현대건설·신영·대주단 공동 참여, 9월 본PF 전환 후 <strong>2030년 서비스 개시</strong>
        목표다. 국내 자산의 Exit가 단기 반복 매매를 넘어 <strong>글로벌 영속 자본으로 이전되는 선진국형 경로</strong>가
        한국에서도 작동할 수 있음을 보여주는 가장 직접적인 선례다.
      </p>

      <h2>AIDC 특별법 6개 특례 — 수도권 희소성은 공고화, 비수도권 문턱은 완화</h2>
      <p>
        정책 방향성은 CBRE가 꼽은 <strong>핵심 기회요인</strong>이다. AI 데이터센터 산업 진흥 특별법은 6개 특례를
        담았다: 인허가 일괄처리(제18조, 전력계통영향평가 150일·건축허가 40일·<strong>기한 내 미통지 시 완료
        간주 타임아웃제</strong>)·<strong>전력계통영향평가 면제(제19조, 비수도권만)</strong>·재생에너지 직접공급
        (제20조, 제3자 PPA)·시설물 설치기준 완화(제21조)·산업입지·항만법 특례(제22·23조)·AI DC 특구(제24·26조).
        핵심 혜택인 계통영향평가 면제가 비수도권에만 적용되므로, <strong>수도권 기확보 전력자산의 희소성은 오히려
        구조적으로 공고해진다</strong> — 규제 완화가 비수도권 개발 문턱을 낮출수록 수도권 완공 자산의 프리미엄이
        커지는 구조다. 지역 전력 자급률도 이를 뒷받침한다(경북·전남 200%+ vs 서울 12%·경기 62%).
      </p>

      <h2>독법 — 희소성 프리미엄의 3단계 전개</h2>
      <p>
        CBRE의 결론은 수요·공급·자본 세 축의 수렴이다. 수요는 AI로 구조적 증가, 공급은 전력 제약으로 막힘,
        자본은 국내에서 글로벌로 매수자 풀 확대 — 그 교차점에 <strong>기확보 전력자산의 희소성 프리미엄</strong>이
        있다. 전개는 3단계로 그린다: <strong>2026~27년 희소성 인지 → 2028~29년 거래 활성화 → 2030년 투자
        안정화</strong>. 리스크(캡레이트 압축 종료·단기 NOI 성장 제약·물리적 진부화)는 상존하지만, 정부의 전력
        공급 제한 정책이 만드는 수도권 희소성이 이를 상쇄한다는 진단이다.
      </p>
      <p>
        부동산(알스퀘어)·밸류체인(PwC)·자본시장(CBRE) 세 리포트가 서로 다른 문에서 출발해 같은 방에 도착한다 —
        <strong>“전력을 선점한 부지가 자산이고, 그 희소성이 프리미엄이다.”</strong> 맵에서{' '}
        <Link to="/?layers=pipeline">공급예정 레이어</Link>와{' '}
        <Link to="/?layers=headroom">변전소 여유 레이어</Link>를 켜면, 어떤 부지가 이 프리미엄의 물리적 근거를
        쥐고 있는지 — 계통영향평가 통과 가능성과 변전소 전력공급 여유까지 — 지점 단위로 겹쳐 볼 수 있다.
      </p>
    </>
  )
}
