import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ④참고·인사이트 — 입지가 '지을 수 있나'라면 운영·타이밍은 '수지가 맞나·언제 붙나'. 수치는 공개자료 검증(출처 박스), 부지별 요금·재급전·수리권은 확인 대상(정직성). */
export default function OpsTiming() {
  const en = useMapLang() === 'en'
  if (en) {
    return (
      <>
        <div className="tldr">
          <p className="tldr-kicker">⚡ 3-minute read</p>
          <p className="tldr-one">
            “Siting decides whether you <strong>can</strong> build. Operations & timing decide whether it
            <strong> pays</strong> — and <strong>when it actually connects</strong>.”
          </p>
          <ol>
            <li>
              <strong>Timing is a date, not a number</strong> — new grid capacity mostly reaches DCs
              <strong> only after 2030</strong>, a <strong>supply cliff looms around 2029</strong>, and a DC takes
              <strong> 3–5 years</strong> to build. So today’s headroom is really a calendar: “when does it connect?”
            </li>
            <li>
              <strong>Curtailment after connection</strong> — a saturated grid can impose <strong>re-dispatch
              (curtailment)</strong> even after you’re hooked up, and congested areas can be designated
              <strong> grid-management substations</strong> that cap or condition new load.
            </li>
            <li>
              <strong>Tariff decides the P&L</strong> — industrial (Type-Eul) <strong>time-of-use</strong> pricing
              (off-peak / mid / peak, by season) meets a <strong>peak-heavy AI load</strong>; the Distributed Energy Act
              opens <strong>regional pricing</strong>. Price, not just supply, now moves siting.
            </li>
            <li>
              <strong>RE100 ≠ 24-7 carbon-free</strong> — annual matching (RE100/PPA) is not hourly carbon-free (24-7
              CFE); <strong>CBAM</strong> and hyperscaler ESG demands push toward hourly, which changes bankability.
            </li>
            <li>
              <strong>Data sovereignty & security</strong> — public/finance workloads carry <strong>CSAP</strong> and
              network-separation duties that constrain where and how you can operate.
            </li>
          </ol>
          <p>
            <strong>Bottom line</strong> — a buildable site is the entry ticket. Whether the project earns its capital
            depends on the tariff clock, the connection date, and the carbon rules — the <strong>operating</strong> layer
            that sits on top of siting.
          </p>
        </div>

        <p>
          The companion piece, <Link to="/insights/external-gates-2026">the external-environment gates</Link>, maps what
          decides whether you <strong>can</strong> build — legal exclusions, permits, transformers, water. This one picks
          up where a buildable site ends: the <strong>operating</strong> variables that decide whether it
          <strong> pays</strong>, and the <strong>timing</strong> variable that decides <strong>when it connects at all</strong>.
          These are the “Tier 3–4” factors — they don’t stop a shovel, but they set the return.
        </p>

        <h2>When does the grid actually connect? (timing)</h2>
        <p>
          The most under-priced variable is a calendar, not a capacity. Even when new substations and transmission lines
          are built on schedule, the useful capacity typically <strong>reaches datacenters only after 2030</strong>,
          because a DC itself takes <strong>3–5 years</strong> to develop and commission. Industry reporting flags a
          <strong> supply cliff around 2029</strong>, where committed demand outruns deliverable grid. The honest
          reframing: grid headroom “today” is less a number (“how many MW free?”) than a <strong>date</strong> (“when
          does my load actually energize?”). Two sites with the same nominal headroom can be years apart on real
          connection — and years are the whole investment case. This is verified from public reporting; a specific
          parcel’s connection date needs KEPCO/site-level confirmation.
        </p>

        <h2>Curtailment & grid-management substations</h2>
        <p>
          Connection is not the finish line. On a saturated grid, the operator can impose <strong>re-dispatch —
          curtailment</strong> — reducing the load you’re allowed to draw at congested hours, which directly erodes the
          utilization your P&L assumed. Beyond that, congested areas can be designated <strong>grid-management
          substations</strong>, where new connections are capped, queued, or made conditional on grid-reinforcement
          milestones. For an operator this means the contracted MW and the <strong>dispatchable</strong> MW can diverge:
          you may hold a connection agreement yet still be told, at peak, to back off. Whether a given substation carries
          such a designation, and on what terms, is a <strong>site-level check</strong> — the mechanism is verified, the
          per-site verdict is not something we compute today.
        </p>

        <h2>Tariff — the industrial time-of-use clock</h2>
        <p>
          Once running, the electricity <strong>price</strong> — not just its availability — drives the P&L. Korean
          industrial power (Type-Eul, 을) is billed on <strong>time-of-use</strong>: off-peak (경부하), mid (중간),
          and peak (최대), with rates that also shift by <strong>season</strong> (summer/winter peaks are dearest). An AI
          datacenter is a <strong>peak-heavy, near-flat</strong> load — it can’t meaningfully shift compute to cheap
          off-peak hours the way a factory shifts a shift — so it sits disproportionately in the expensive bands. On top
          of the tariff schedule, the <strong>Distributed Energy Act (분산에너지법)</strong> opens the door to
          <strong> regional electricity pricing</strong>, so that where you site can change the unit price itself. Net:
          two identical builds can have materially different operating cost depending on region and load shape. The
          time-of-use structure is verified public tariff design; the exact won/kWh a specific project pays is a
          contract-and-region calculation, flagged as site-specific.
        </p>

        <h2>Renewable procurement — RE100/PPA vs 24-7 CFE</h2>
        <p>
          The clean-energy story has a subtle but decisive gap. <strong>RE100</strong> and most <strong>PPAs</strong>
          settle on <strong>annual matching</strong>: over a year, renewable purchases equal consumption. That is
          <strong> not</strong> the same as <strong>24-7 carbon-free energy (CFE)</strong> — matching every operating
          hour with carbon-free supply — which is far harder in a grid where solar is a ~4-hour resource and storage is
          costly. This matters commercially, not just reputationally: <strong>CBAM</strong> (the EU carbon border
          adjustment) and <strong>hyperscaler ESG</strong> mandates increasingly ask for hourly, not annual, evidence —
          which affects the <strong>bankability</strong> of a project pitched to those tenants. A DC that can credibly
          approach hourly CFE is financeable to a different, deeper pool of anchor tenants. The annual-vs-hourly
          distinction is a verified framework; whether a given site can reach it depends on its local generation mix and
          contracts — an <strong>assumption</strong> to be tested, not a computed score.
        </p>

        <h2>Data sovereignty & security</h2>
        <p>
          For a large slice of demand, <strong>where and how</strong> you operate is constrained by law, not economics.
          Public-sector and financial workloads in Korea carry <strong>CSAP</strong> (the cloud security assurance
          program) and <strong>network-separation</strong> obligations — physical/logical isolation of certain networks —
          which shape zoning, tenancy mix, and even room-level architecture. A site optimized purely for power and cooling
          can still be the wrong home for a sovereign or finance tenant if it can’t meet these controls. This is a
          <strong> qualifying gate</strong> for specific tenant classes rather than a universal deduction, and belongs in
          the operating-fit checklist alongside tariff and carbon.
        </p>

        <h2>Implication — siting is the ticket, operations is the return</h2>
        <p>
          Read together with <Link to="/insights/external-gates-2026">the siting-gates companion</Link>: a buildable,
          high-scoring site gets you to the table; the <strong>operating</strong> layer decides whether the capital is
          rewarded. Priorities we treat honestly: an <strong>actual-connection-timing</strong> note beside grid headroom
          (a date, not just MW), a <strong>tariff/load-shape</strong> lens on the P&L, and a <strong>carbon-matching</strong>
          flag (annual RE100 vs hourly CFE) for bankability. Honesty line: the post-2030 real-supply pattern, the 2029
          cliff, the grid-management-substation mechanism, industrial time-of-use design, the Distributed Energy Act’s
          regional-pricing opening, and CSAP/network-separation duties are all <strong>public-data verified</strong>; a
          specific parcel’s connection date, curtailment exposure, exact tariff, and 24-7 CFE feasibility are
          <strong> site-level assumptions</strong> to be confirmed, not scores we compute today. Try the numbers in the
          <Link to="/calc"> GPU calculator</Link>, and track the moving rules on the
          <Link to="/roadmap?view=policy"> policy tracker</Link>.
        </p>
      </>
    )
  }
  return (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3분 쉽게 읽기</p>
        <p className="tldr-one">
          “입지는 <strong>지을 수 있나</strong>를 정한다. 운영·타이밍은 <strong>수지가 맞나</strong> —
          그리고 <strong>언제 실제로 붙나</strong>를 정한다.”
        </p>
        <ol>
          <li>
            <strong>타이밍은 ‘얼마’가 아니라 ‘날짜’다</strong> — 신규 계통 여유는 대부분 <strong>2030년 이후에야</strong>
            DC에 닿고, <strong>2029년 공급절벽</strong>이 온다. DC 개발은 <strong>3~5년</strong>이라 지금의 여유는
            숫자가 아니라 “언제 붙느냐”라는 달력이다.
          </li>
          <li>
            <strong>접속 뒤에도 재급전(출력제한)</strong> — 포화 계통은 접속 이후에도 <strong>재급전(출력제한)</strong>을
            부과할 수 있고, 혼잡지역은 신규 부하를 제한·조건부로 묶는 <strong>계통관리변전소</strong>로 지정될 수 있다.
          </li>
          <li>
            <strong>요금이 손익을 가른다</strong> — 산업용(을) <strong>시간대별 요금</strong>(경부하/중간/최대, 계절별)에
            <strong> 피크 편중 AI 부하</strong>가 얹힌다. <strong>분산에너지법</strong>은 <strong>지역별 요금</strong>을
            연다 — 공급뿐 아니라 가격이 입지를 움직인다.
          </li>
          <li>
            <strong>RE100 ≠ 24-7 무탄소</strong> — 연간 매칭(RE100/PPA)은 시간단위 무탄소(24-7 CFE)가 아니다.
            <strong> CBAM</strong>과 하이퍼스케일러 ESG 요구가 시간단위로 밀며 <strong>파이낸싱 가능성</strong>을 바꾼다.
          </li>
          <li>
            <strong>데이터주권·보안</strong> — 공공·금융 워크로드는 <strong>CSAP</strong>·<strong>망분리</strong> 의무를
            지며, 어디서·어떻게 운영할 수 있는지를 제약한다.
          </li>
        </ol>
        <p>
          <strong>결론 한 줄</strong> — 지을 수 있는 부지는 입장권일 뿐이다. 그 사업이 자본을 보상하느냐는
          요금 시계·접속 시점·탄소 규칙 — 입지 위에 얹히는 <strong>운영</strong> 레이어가 결정한다.
        </p>
      </div>

      <p>
        짝이 되는 글 <Link to="/insights/external-gates-2026">외부환경 관문</Link>은 <strong>지을 수 있나</strong>를
        가르는 변수 — 법적 배제·인허가·변압기·용수 — 를 지도화했다. 이 글은 지을 수 있는 부지가 끝나는 지점에서
        시작한다: <strong>수지가 맞나</strong>를 정하는 <strong>운영</strong> 변수와, <strong>애초에 언제 붙나</strong>를
        정하는 <strong>타이밍</strong> 변수다. 이것이 ‘Tier 3·4’ 요인이다 — 삽을 멈추진 않지만 수익률을 정한다.
      </p>

      <h2>계통은 언제 실제로 붙나 (타이밍)</h2>
      <p>
        가장 저평가된 변수는 용량이 아니라 달력이다. 신규 변전소·송전망이 계획대로 확충돼도, 쓸 수 있는 여유가
        <strong> 실제 DC에 닿는 건 2030년 이후</strong>가 되기 쉽다 — DC 자체가 개발·시운전에 <strong>3~5년</strong>이
        걸리기 때문이다. 업계 보도는 확정 수요가 공급 가능한 계통을 앞지르는 <strong>2029년 공급절벽</strong>을 경고한다.
        정직한 재해석: 지금의 계통여유는 “몇 MW 남았나”라는 숫자보다 “<strong>내 부하가 언제 실제로 통전되나</strong>”라는
        <strong> 날짜</strong>에 가깝다. 명목 여유가 같은 두 부지도 실제 접속은 몇 년 차이가 날 수 있고, 그 몇 년이 곧
        투자 논리 전체다. 이 패턴은 공개 보도로 검증됐고, 개별 부지의 접속 시점은 한전·부지별 확인이 필요하다.
      </p>

      <h2>재급전(출력제한)과 계통관리변전소</h2>
      <p>
        접속은 결승선이 아니다. 포화 계통에서 운영자는 <strong>재급전 — 출력제한</strong>을 부과할 수 있다 — 혼잡 시간대에
        끌어 쓸 수 있는 부하를 줄이는 것으로, 손익이 가정한 가동률을 직접 갉아먹는다. 나아가 혼잡지역은
        <strong> 계통관리변전소</strong>로 지정될 수 있고, 이 경우 신규 접속이 제한·대기되거나 계통 보강 마일스톤을 조건으로
        걸린다. 운영자 입장에선 계약 MW와 <strong>급전 가능한 MW</strong>가 벌어질 수 있다 — 접속 계약을 쥐고도 피크에는
        낮추라는 통보를 받을 수 있다. 특정 변전소가 그런 지정을 받았는지, 어떤 조건인지는 <strong>부지별 확인 대상</strong>이다
        — 메커니즘은 검증됐지만 부지별 판정은 지금 우리가 계산하는 값이 아니다.
      </p>

      <h2>요금 — 산업용 시간대별 시계</h2>
      <p>
        일단 가동되면 전기 <strong>가격</strong>이 — 공급 여부만이 아니라 — 손익을 몬다. 국내 산업용 전력(을)은
        <strong> 시간대별</strong>로 부과된다: 경부하·중간·최대, 그리고 <strong>계절별</strong>로도 달라진다(여름·겨울
        피크가 가장 비싸다). AI 데이터센터는 <strong>피크 편중의 거의 평탄한</strong> 부하다 — 공장이 교대를 옮기듯 연산을
        값싼 경부하로 유의미하게 옮길 수 없어, 비싼 구간에 불균형하게 걸린다. 요금표 위에 더해 <strong>분산에너지법</strong>은
        <strong> 지역별 전기요금</strong>의 문을 연다 — 어디에 짓느냐가 단가 자체를 바꿀 수 있다. 결국 똑같은 두 건물도
        지역·부하 형태에 따라 운영비가 실질적으로 달라진다. 시간대별 구조는 검증된 공개 요금 설계이고, 특정 사업의 실제
        원/kWh는 계약·지역별 계산으로 부지별 표기 대상이다.
      </p>

      <h2>재생조달 — RE100/PPA vs 24-7 CFE</h2>
      <p>
        청정에너지 이야기엔 미묘하지만 결정적인 틈이 있다. <strong>RE100</strong>과 대부분의 <strong>PPA</strong>는
        <strong> 연간 매칭</strong>으로 정산된다 — 1년 단위로 재생E 구매량이 소비량과 같으면 된다. 이는
        <strong> 시간단위 무탄소(24-7 CFE)</strong> — 가동하는 매 시간을 무탄소 공급으로 매칭 — 와 <strong>다르다</strong>.
        태양광이 하루 ~4시간 자원이고 저장이 비싼 계통에선 후자가 훨씬 어렵다. 이건 평판만이 아니라 상업적으로 중요하다:
        <strong> CBAM</strong>(EU 탄소국경조정)과 <strong>하이퍼스케일러 ESG</strong> 요구가 점점 연간이 아니라 시간단위
        증빙을 묻고, 이는 그 임차인을 겨냥한 사업의 <strong>파이낸싱 가능성</strong>을 좌우한다. 시간단위 CFE에 신뢰성 있게
        근접할 수 있는 DC는 더 깊은 우량 앵커 임차인 풀에 자금조달이 가능하다. 연간 vs 시간단위 구분은 검증된 프레임이고,
        특정 부지가 거기에 닿을 수 있는지는 지역 발전믹스·계약에 달린 <strong>가정</strong>으로, 검증 대상이지 계산 점수가
        아니다.
      </p>

      <h2>데이터주권·보안</h2>
      <p>
        상당한 수요층에서 <strong>어디서·어떻게</strong> 운영하느냐는 경제가 아니라 법이 제약한다. 국내 공공·금융
        워크로드는 <strong>CSAP</strong>(클라우드 보안인증)와 <strong>망분리</strong> 의무 — 특정 네트워크의 물리/논리
        분리 — 를 지며, 이는 조닝·임차 구성, 나아가 실 단위 설계까지 규정한다. 전력·냉각에만 최적화된 부지도 이 통제를
        못 맞추면 공공·금융 임차인에겐 부적합할 수 있다. 이는 보편 감점이 아니라 특정 임차인군에 대한
        <strong> 자격 관문</strong>이며, 요금·탄소와 함께 운영 적합성 체크리스트에 들어간다.
      </p>

      <h2>시사점 — 입지는 입장권, 운영이 수익률</h2>
      <p>
        <Link to="/insights/external-gates-2026">입지 관문 짝 글</Link>과 함께 읽으면: 지을 수 있고 점수 높은 부지는
        협상 테이블에 앉혀줄 뿐, 자본이 보상받느냐는 <strong>운영</strong> 레이어가 정한다. 우리가 정직하게 다룰 우선순위:
        계통여유 옆에 <strong>실제 접속 시점</strong> 표기(MW가 아니라 날짜), 손익에 대한 <strong>요금·부하 형태</strong>
        렌즈, 그리고 파이낸싱을 위한 <strong>탄소 매칭</strong> 플래그(연간 RE100 vs 시간단위 CFE). 정직성: 2030년 이후
        실공급 패턴·2029 공급절벽·계통관리변전소 메커니즘·산업용 시간대별 설계·분산에너지법 지역별 요금 개방·CSAP/망분리
        의무는 모두 <strong>공개자료로 검증</strong>됐고, 개별 부지의 접속 시점·재급전 노출·정확한 요금·24-7 CFE 실현
        가능성은 확인이 필요한 <strong>부지별 가정</strong>이지 지금 우리가 계산하는 점수가 아니다. 숫자는
        <Link to="/calc"> GPU 계산기</Link>에서 돌려보고, 바뀌는 제도는 <Link to="/roadmap?view=policy">정책 트래커</Link>에서
        추적하라.
      </p>
    </>
  )
}
