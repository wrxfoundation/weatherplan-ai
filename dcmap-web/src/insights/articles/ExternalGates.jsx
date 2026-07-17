import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ④참고·인사이트 — 5축 밖 외부환경 변수 온톨로지. 수치는 공개자료 검증(출처 박스), 부지별 배제 저촉은 GIS 확인 대상(정직성). */
export default function ExternalGates() {
  const en = useMapLang() === 'en'
  if (en) {
    return (
      <>
        <div className="tldr">
          <p className="tldr-kicker">⚡ 3-minute read</p>
          <p className="tldr-one">
            “Our five axes only measure <strong>physical supply</strong>. But what actually kills a datacenter lives
            outside them — <strong>legal exclusions, hidden hardware bottlenecks, and timing</strong>.”
          </p>
          <ol>
            <li>
              <strong>Kill switches (not deductions)</strong> — a site can top the five axes and still be
              <strong> un-buildable</strong>: greenbelt, military-protection zones, airport height limits, water-source
              protection, cultural-heritage areas. These are ×, not minus points.
            </li>
            <li>
              <strong>More permit gates than PSIA</strong> — an energy-use plan consultation (≥20 GWh/yr = effectively
              every DC), environmental impact assessment, integrated environmental permit, and — newly proposed — a
              mandatory building-committee review in Seoul.
            </li>
            <li>
              <strong>Hidden hardware bottlenecks</strong> — a large 154kV transformer now takes <strong>2–4 years</strong>
              to deliver (30% market shortage), and cooling needs water: <strong>~25.5 million L/yr per MW</strong>, ~80%
              evaporated. A perfect site still slips if you can’t book a transformer slot or secure water.
            </li>
            <li>
              <strong>Operations & timing</strong> — grid congestion can force curtailment even after connection, and new
              grid capacity mostly reaches DCs <strong>only after 2030</strong> — a “supply cliff” looms around 2029.
            </li>
            <li>
              <strong>What we’ll add</strong> — a legal-exclusion overlay (a 6th “can you legally build” verdict), a water
              axis, an equipment-lead-time tracker, and a “when does the grid actually connect” note.
            </li>
          </ol>
          <p>
            <strong>Bottom line</strong> — a high five-axis score is necessary, not sufficient. The decisive variables sit
            in the <strong>external environment</strong>, and mapping them honestly is exactly what overseas tools don’t do.
          </p>
        </div>

        <p>
          <Link to="/">AI InfraMap</Link>’s five axes — power, land, risk, network, climate — are all
          <strong> physical supply</strong>. They answer “can this land physically host the load?” But a physically
          perfect site can still be legally un-buildable, wait years for a transformer, run dry on cooling water, or connect
          to the grid only after 2030. This piece maps the variables <strong>outside the five axes</strong> across the
          install → permit → operate lifecycle, and marks which we can compute today versus which need site-level checks.
        </p>

        <h2>The five axes only see physical supply</h2>
        <p>
          Our score grades and deducts. That is the wrong shape for the sharpest external variables, which are
          <strong> binary</strong>: a site is inside a greenbelt or it isn’t; a transformer arrives in time or it doesn’t.
          Treating a kill switch as “minus a few points” is exactly the error that ends projects late.
        </p>

        <h2>Tier 0 — kill switches: a great site you can’t build on</h2>
        <p>
          The most decisive external layer is legal exclusion. A parcel can score high on all five axes and still be
          blocked by an overlay: <strong>greenbelt (development-restricted zone), military-protection zones, airport
          obstacle-limitation (height) surfaces, water-source protection areas, cultural-heritage / buried-relic zones,
          conservation land-use designations, and road-access requirements</strong> (a landlocked parcel can’t receive
          large equipment). Most of these are public GIS polygons (Toji-eum, vWorld) — so this is an implementable gap
          and a genuine differentiator. The honest design is a <strong>GO/NO-GO exclusion flag shown before the score</strong>,
          not folded into it.
        </p>

        <h2>Tier 1 — permit gates beyond PSIA</h2>
        <p>
          The <Link to="/insights/power-permit-battle">power-permitting battle</Link> is real, but PSIA is one gate of
          several. An <strong>energy-use plan consultation</strong> is triggered at ≥20 GWh/yr of electricity — which a
          40MW DC clears many times over, so effectively <strong>every DC</strong> is subject. Add environmental impact
          assessment (scale/zone-dependent), integrated environmental permit (emission facilities such as backup diesel),
          disaster-impact review, development/forest/farmland conversion permits, and fire & hazardous-materials rules
          (diesel fuel, <strong>ESS battery fire codes</strong>). And the ground is shifting: today a DC is classified as a
          “broadcasting/communications facility,” so it can be built <strong>without an environmental assessment or
          resident consultation</strong> — <strong>88% of Seoul</strong> is buildable. But the Seoul Metropolitan Council
          passed a resolution (Apr 2026) urging a <strong>mandatory building-committee review and siting guidelines</strong>
          — i.e. today’s easy permitting may tighten. That makes it a <Link to="/roadmap?view=policy">policy-tracker</Link>
          item, not a constant.
        </p>

        <h2>Tier 2 — hidden hardware bottlenecks: transformers and water</h2>
        <p>
          Two physical constraints never show up in a site score yet decide completion. First, <strong>large transformers</strong>:
          lead times for big 154kV-class units now run <strong>2–4 years</strong> amid a ~30% market shortage, with DC
          developers competing for factory production slots. A flawless site with ample grid headroom still slips if the
          transformer isn’t ordered years ahead. Second, <strong>water</strong>: a 1MW datacenter on indirect-evaporative
          cooling can use up to <strong>~25.5 million litres a year, ~80% of it evaporated</strong> — competing with the
          capital region’s water stress and semiconductor clusters. Whether industrial water is available (supply, water
          rights, wastewater discharge, reuse) effectively <strong>dictates the cooling method</strong> (water vs air /
          liquid). See the <Link to="/insights/liquid-cooling-brief">liquid-cooling brief</Link> for the cooling side.
        </p>

        <h2>Tier 3 & 4 — operations and timing</h2>
        <p>
          Even after connection, a congested grid can impose <strong>curtailment</strong>, and saturated areas may be
          designated “grid-management substations.” Tariffs (industrial time-of-use), renewable procurement
          (RE100 / PPA / <strong>24-7 CFE</strong>), CBAM and customer ESG demands, data-sovereignty and security rules
          (CSAP, network separation), and non-capital incentives all shape operating economics. Above all is
          <strong> timing</strong>: even when new substations and lines are built on schedule, because a DC takes 3–5 years,
          the capacity typically <strong>reaches DCs only after 2030</strong>, and a <strong>supply cliff around 2029</strong>
          is flagged. Today’s grid headroom matters less as a number than as a <strong>date</strong> — “when does it actually
          connect?”
        </p>

        <h2>Implication — what we add, honestly</h2>
        <p>
          Priorities: (1) a <strong>Tier-0 exclusion overlay</strong> as a sixth “can you legally build” verdict, from public
          GIS; (2) a <strong>water axis</strong> and an <strong>equipment-lead-time</strong> tracker; (3) a
          <strong> grid “actual-connection timing”</strong> note beside headroom. Honesty line: transformer 2–4 yrs, water
          ~25.5M L/MW, the 20 GWh consultation trigger, 88% of Seoul buildable, and post-2030 real supply are all
          public-data verified; a specific parcel’s overlay conflicts and water rights need site-level GIS/administrative
          confirmation; a Korean waste-heat-reuse mandate is not yet decided. Status update: the Tier-0 exclusion overlay is
          now wired end-to-end — the engine, a map layer, and a site-panel GO/NO-GO check — and auto-activates the moment
          public GIS polygons are loaded deployment-side (currently data-pending, so it honestly reads as pending, not as
          coverage). A high five-axis score is the first gate — not the finish line.
        </p>
      </>
    )
  }
  return (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3분 쉽게 읽기</p>
        <p className="tldr-one">
          “우리 5축은 <strong>물리적 공급</strong>만 잰다. 그런데 데이터센터를 실제로 죽이는 건 5축 밖에 있다 —
          <strong> 법적 배제, 숨은 하드웨어 병목, 그리고 타이밍</strong>.”
        </p>
        <ol>
          <li>
            <strong>킬스위치(감점 아님)</strong> — 5축 점수가 아무리 높아도 <strong>못 짓는 부지</strong>가 있다:
            그린벨트·군사시설보호구역·공항 고도제한·상수원보호구역·문화재보호구역. 이건 감점이 아니라 ×다.
          </li>
          <li>
            <strong>PSIA 말고 더 있는 인허가 관문</strong> — 에너지사용계획 협의(연 20GWh↑ = 사실상 모든 DC)·환경영향평가·
            통합환경허가, 그리고 새로 추진되는 서울시 건축위 심의 의무화.
          </li>
          <li>
            <strong>숨은 하드웨어 병목</strong> — 154kV 대형 변압기 납기가 이제 <strong>2~4년</strong>(시장 30% 부족),
            냉각엔 물이 필요하다: <strong>1MW당 연 2,550만 L</strong>, 약 80% 증발. 부지가 완벽해도 변압기 슬롯·용수를 못
            잡으면 준공이 밀린다.
          </li>
          <li>
            <strong>운영·타이밍</strong> — 접속 뒤에도 계통 혼잡은 출력제한(재급전)을 강제할 수 있고, 신규 계통 여유는
            대부분 <strong>2030년 이후에야</strong> DC에 닿는다 — 2029년 ‘공급절벽’이 온다.
          </li>
          <li>
            <strong>우리가 넣을 것</strong> — 법적 배제 오버레이(6번째 ‘법적으로 지을 수 있나’ 판정)·용수 축·설비 리드타임
            트래커·‘계통이 언제 실제로 붙나’ 표기.
          </li>
        </ol>
        <p>
          <strong>결론 한 줄</strong> — 5축 고득점은 필요조건일 뿐 충분조건이 아니다. 승부를 가르는 변수는
          <strong> 외부환경</strong>에 있고, 그걸 정직하게 지도화하는 것이야말로 해외 툴이 안 하는 일이다.
        </p>
      </div>

      <p>
        <Link to="/">AI InfraMap</Link>의 5축 — 전력·토지·리스크·네트워크·기상 — 은 전부 <strong>물리적 공급</strong>이다.
        “이 땅이 물리적으로 그 부하를 받을 수 있나”에 답한다. 그러나 물리적으로 완벽한 부지도 법적으로 못 짓거나, 변압기를
        몇 년 기다리거나, 냉각수가 마르거나, 계통이 2030년 이후에야 붙을 수 있다. 이 글은 설치 → 인가 → 운영 생애주기에 걸쳐
        <strong> 5축 밖의 변수</strong>를 지도화하고, 그중 지금 계산 가능한 것과 부지별 확인이 필요한 것을 구분한다.
      </p>

      <h2>5축은 ‘물리적 공급’만 본다</h2>
      <p>
        우리 스코어는 점수를 매기고 감점한다. 그런데 가장 날카로운 외부 변수들은 <strong>이진값</strong>이다 — 부지가
        그린벨트 안이거나 아니거나, 변압기가 제때 오거나 안 오거나. 킬스위치를 “몇 점 감점”으로 다루는 것이야말로 사업을
        뒤늦게 무산시키는 오류다.
      </p>

      <h2>TIER 0 — 킬스위치: 점수 높아도 못 짓는 부지</h2>
      <p>
        가장 결정적인 외부 레이어는 법적 배제다. 5축을 다 만족해도 오버레이 하나에 막힌다:
        <strong> 개발제한구역(그린벨트)·군사시설보호구역·공항 장애물제한표면(고도제한)·상수원보호구역·문화재/매장문화재
        유존지역·보전 용도지역·접도요건</strong>(맹지는 대형 설비 반입 불가). 대부분 공개 GIS 폴리곤(토지이음·브이월드)으로
        확보 가능 — 그래서 이건 <strong>구현 가능한 갭이자 진짜 차별화</strong>다. 정직한 설계는 이걸 점수에 섞지 않고
        <strong> 점수보다 먼저 GO/NO-GO 배제 플래그</strong>로 띄우는 것이다.
      </p>

      <h2>TIER 1 — PSIA 말고 더 있는 인허가 관문</h2>
      <p>
        <Link to="/insights/power-permit-battle">전력 인허가 전쟁</Link>은 실재하지만 PSIA는 여러 관문 중 하나다.
        <strong> 에너지사용계획 협의</strong>는 연 전력 20GWh 이상에서 걸리는데, 40MW DC는 이를 몇 배로 초과하므로 사실상
        <strong> 모든 DC가 대상</strong>이다. 여기에 환경영향평가(규모·용도지역별)·통합환경허가(비상디젤 등 배출시설)·
        재해영향평가·개발행위/산지/농지 전용·소방 및 위험물(디젤 연료·<strong>ESS 배터리 화재기준</strong>)이 더해진다.
        그리고 판이 바뀌는 중이다: 현행법상 DC는 ‘방송통신시설’로 분류돼 <strong>환경영향평가·주민의견수렴 없이 건축
        가능</strong>하고 <strong>서울 88%</strong>가 설치가능이다. 그런데 서울시의회가 2026.4 <strong>건축위 심의 의무화·
        입지 가이드라인</strong> 건의안을 통과시켰다 — 즉 지금의 쉬운 인허가가 조여질 수 있다. 그래서 이건 상수가 아니라
        <Link to="/roadmap?view=policy"> 제도 트래커</Link> 대상이다.
      </p>

      <h2>TIER 2 — 숨은 하드웨어 병목: 변압기와 용수</h2>
      <p>
        부지 점수엔 절대 안 잡히지만 준공을 결정하는 두 물리 변수. 첫째 <strong>대형 변압기</strong>: 154kV급 주변압기 납기가
        이제 <strong>2~4년</strong>, 전력변압기 시장은 약 30% 공급부족, DC 사업자들이 공장 생산슬롯을 두고 경쟁한다. 계통
        여유가 넘치는 완벽한 부지도 변압기를 몇 년 전 발주하지 못하면 밀린다. 둘째 <strong>용수</strong>: 1MW DC가
        간접증발냉각 시 연 최대 <strong>2,550만 L, 그중 약 80%가 증발</strong> — 수도권 물부족·반도체 클러스터와 경합한다.
        공업용수 공급 가능성(수리권·하폐수 방류·재이용)이 사실상 <strong>냉각방식(수랭 vs 공랭/액랭)을 강제</strong>한다.
        냉각 쪽은 <Link to="/insights/liquid-cooling-brief">액체냉각 브리프</Link> 참조.
      </p>

      <h2>TIER 3·4 — 운영과 타이밍</h2>
      <p>
        접속 뒤에도 포화 계통은 <strong>출력제한(재급전)</strong>을 부과할 수 있고, 포화지역은 ‘계통관리변전소’로 지정될 수
        있다. 전기요금(산업용 시간대별)·재생조달(RE100/PPA/<strong>24-7 CFE</strong>)·CBAM·고객 ESG·데이터주권/보안(CSAP·
        망분리)·비수도권 인센티브가 운영 경제성을 좌우한다. 무엇보다 <strong>타이밍</strong>이다: 신규 변전소·송전망이 계획대로
        확충돼도 DC 개발이 3~5년이라 그 여유가 <strong>실제 DC에 닿는 건 2030년 이후</strong>가 되기 쉽고,
        <strong> 2029년 공급절벽</strong>이 경고된다. 지금의 계통여유는 “얼마”보다 “<strong>언제 붙느냐</strong>”가 핵심이다.
      </p>

      <h2>시사점 — 우리가 넣을 것, 정직하게</h2>
      <p>
        우선순위: (1) 공개 GIS 기반 <strong>Tier 0 배제 오버레이</strong>를 6번째 ‘법적으로 지을 수 있나’ 판정으로,
        (2) <strong>용수 축</strong>과 <strong>설비 리드타임</strong> 트래커, (3) 계통 여유 옆에 <strong>‘실제 접속 시점’</strong>
        표기. 정직성: 변압기 2~4년·물 2,550만L/MW·협의 20GWh 트리거·서울 88%·2030년 이후 실공급은 공개자료로 검증됐고,
        개별 부지의 오버레이 저촉·수리권은 부지별 GIS/행정 확인이 필요하며, 폐열 재이용 의무의 국내 도입은 미확정이다. 진행
        현황: Tier 0 배제 오버레이는 이제 엔진·맵 레이어·부지 패널 GO/NO-GO 판정까지 끝단으로 배선돼 있고, 배포측에서 공개 GIS
        폴리곤이 수록되는 즉시 자동 활성화된다(현재는 데이터 대기라 커버리지가 아니라 ‘대기’로 정직하게 표시). 5축
        고득점은 첫 관문일 뿐, 결승선이 아니다.
      </p>
    </>
  )
}
