import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 1차 소스: KDCC/STRABASE Issue Focus(2026.6.23) — 해양/수중 데이터센터.
 * 콘텐츠 등급 ④참고·인사이트. 사례·수치는 원문 인용. */
export default function OceanDatacenter() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        In May 2026, roughly <strong>2,000 servers</strong> began operating beneath the sea surface off
        Shanghai. The electricity was drawn <strong>straight from a row of adjacent offshore wind
        turbines</strong>, and cooling was handled by the surrounding seawater. Compared with onshore
        siting, it reduces land use and freshwater cooling burdens, and its direct offshore-wind linkage
        even lowers dependence on the transmission grid. That same month in the United States, Peter Thiel
        put <strong>USD 140 million into a floating data center startup</strong> that runs AI on waves
        (a valuation approaching USD 1 billion).
      </p>

      <h2>Why Go to Sea — bypassing the onshore bottleneck</h2>
      <p>
        The two events are no coincidence. AI computing demand is exploding while onshore infrastructure
        cannot keep pace — <strong>the power grid is slow, cooling water is scarce, and sites become the
        subject of political and environmental conflict</strong>. In the middle of this bottleneck, the
        ocean data center — once dismissed as an experiment — returns as a next-generation strategy.
        Where Microsoft (Project Natick) proved the possibility and then left, China is filling the gap
        with <strong>state-led commercialization</strong> and the United States with{' '}
        <strong>bets from private capital</strong>. The sea is no longer a laboratory but a new front in
        the AI infrastructure race.
      </p>

      <h2>AI InfraMap’s Perspective — offshore or onshore, it comes down to power, cooling, and site</h2>
      <p>
        The appeal of the ocean data center is precisely that it solves, all at once, the three
        variables AI InfraMap treats as the siting axis —
        <strong>power (direct offshore-wind link), cooling (seawater), and site (avoiding local
        complaints)</strong>. Flip it around, and the competitiveness of an onshore site reads through
        the same three variables: is it a region with spare generation (<Link to="/power">power map</Link>),
        can it do free-cooling and water supply
        (<Link to="/insights/liquid-cooling-brief">cooling</Link>), and is its complaint and flood risk low (<Link to="/">site analysis</Link>).
        With Korea surrounded by sea on three sides and offshore-wind permits surging (offshore wind in the{' '}
        <Link to="/stats">generation permit register</Link>), ocean and coastal data centers are not a
        distant story — wherever the bottleneck goes, that chokepoint is ultimately decided at a single
        point on the map.
      </p>
    </>
  ) : (
    <>
      <p>
        2026년 5월, 상하이 앞바다 수면 아래에서 약 <strong>2,000대의 서버</strong>가 가동을 시작했다. 전기는 옆에
        늘어선 <strong>해상풍력 터빈에서 곧장</strong> 끌어왔고, 냉각은 주변 바닷물이 맡았다. 육상 대비 토지 사용과
        담수 냉각 부담을 줄이고, 해상풍력 직접 연계로 송전망 의존도까지 낮췄다. 같은 달 미국에선 피터 틸이 파도로
        AI를 돌리는 <strong>부유식 데이터센터 스타트업에 1억 4,000만 달러</strong>를 태웠다(평가가치 10억 달러 근접).
      </p>

      <h2>바다로 가는 이유 — 육상 병목의 우회</h2>
      <p>
        두 사건은 우연이 아니다. AI 컴퓨팅 수요는 폭증하는데 육상 인프라가 못 따라간다 — <strong>전력망은 늦고,
        냉각수는 부족하며, 부지는 정치·환경 갈등의 대상</strong>이 된다. 이 병목 한가운데에서 한때 실험으로 치부되던
        해양 데이터센터가 차세대 전략으로 귀환한다. Microsoft(Project Natick)가 가능성을 증명하고 떠난 자리를,
        중국은 <strong>국가 주도 상업화</strong>로, 미국은 <strong>민간 자본의 베팅</strong>으로 메우는 중이다. 바다는
        더 이상 실험실이 아니라 AI 인프라 경쟁의 새로운 전선이 됐다.
      </p>

      <h2>AI InfraMap의 관점 — 해양이든 육상이든, 결국 전력·냉각·입지</h2>
      <p>
        해양 데이터센터의 매력은 정확히 AI InfraMap이 입지 축으로 다루는 세 변수를 한 번에 푼다는 데 있다 —
        <strong>전력(해상풍력 직결)·냉각(해수)·부지(민원 회피)</strong>. 뒤집으면, 육상 부지의 경쟁력도 같은 세
        변수로 읽힌다: 발전 여유가 있는 권역인가(<Link to="/power">전력지도</Link>), 프리쿨링·용수가 되는가
        (<Link to="/insights/liquid-cooling-brief">냉각</Link>), 민원·침수 리스크는 낮은가(<Link to="/">지점 분석</Link>).
        한국은 삼면이 바다이고 해상풍력 허가가 급증(<Link to="/stats">발전 허가대장</Link>의 해상풍력)하는 만큼,
        해양·연안 데이터센터는 먼 이야기가 아니다 — 병목이 어디로 가든 그 길목은 결국 지도 위 한 점에서 결정된다.
      </p>
    </>
  )
}
