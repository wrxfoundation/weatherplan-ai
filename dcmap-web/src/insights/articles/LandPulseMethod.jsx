import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ②공공 정형 — 수치는 전부 AI InfraMap이 직접 집계한 KOSIS·한국부동산원 공개 통계 (1차 출처) */
export default function LandPulseMethod() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        “Does land value rise when a data center moves in?” — it is the most
        common question at the site-selection stage, yet no one in Korea has
        answered it with data. To build that answer, AI InfraMap has begun to{' '}
        <strong>
          track the land-price fluctuation rate of data-center locations
          nationwide, month by month, at the eup·myeon·dong level
        </strong>
        . This article discloses that methodology and the landscape of the first
        snapshot.
      </p>

      <h2>What we measure — 35 si·gun·gu, 539 survey zones</h2>
      <p>
        The source is the “Land Price Fluctuation Rate” statistics of the
        Ministry of Land, Infrastructure and Transport and the Korea Real Estate
        Board (published on KOSIS). We narrow down to the{' '}
        <strong>35 si·gun·gu</strong> where the 80 facilities on the status map
        are located, and collect the monthly fluctuation rate of the{' '}
        <strong>539 eup·myeon·dong-level survey zones</strong> within them. In
        the first snapshot as of May 2026, among the DC-hosting si·gun·gu the
        highest monthly gain was in{' '}
        <strong>Yongsan-gu, Seoul (+0.577%)</strong>, and at the dong level in{' '}
        <strong>the Dongbinggo-dong area of Yongsan-gu (+0.985%)</strong>, while
        the lowest was in{' '}
        <strong>Bugil-myeon, Haenam-gun, Jeonnam (−0.183%)</strong> — the very
        county where the 1GW-class Solaseado plan was announced.
      </p>

      <h2>The honesty rule — we do not yet claim causation</h2>
      <p>
        Let us be clear. Yongsan’s rise is the power of redevelopment projects,
        not the data center, and Haenam’s decline may be occurring <em>despite</em>{' '}
        the plan’s announcement. To speak of a “data-center effect” from a
        single-month snapshot is an overstatement. So AI InfraMap has three
        rules. First, when a facility’s coordinates are the si·gun·gu centroid,
        we <strong>do not tie a specific dong to the facility</strong>. Second,
        we <strong>do not draw a trend line before at least three months</strong>{' '}
        have accumulated. Third, we record not causation but only{' '}
        <strong>event–land-price alignment</strong> — placing the timestamps of
        groundbreakings, permits, and investment announcements side by side with
        the land-price response is where the data’s job ends; interpretation
        comes after.
      </p>

      <h2>Why this becomes a moat as it accumulates</h2>
      <p>
        The land-price fluctuation statistics themselves can be looked up
        retroactively by anyone. But the{' '}
        <strong>
          aligned time series of “which zone moved in the month a given
          announcement occurred”
        </strong>{' '}
        can only be held by those who accumulated the event records alongside it.
        To answer the practical question at the site-selection stage — “is this
        neighborhood at a price you can still enter at now?” — you need a
        baseline from before the announcement, and that baseline belongs to
        whoever starts building it now. AI InfraMap’s first baseline is May 2026.
      </p>

      <h2>What you can see now</h2>
      <p>
        On the LAND PULSE widget of the <Link to="/dashboard">dashboard</Link>{' '}
        you can view the top and bottom fluctuation rates among hosting
        si·gun·gu along with dong-level highlights, and on each{' '}
        <Link to="/">facility detail</Link> you can check that si·gun·gu’s
        average, highest, and lowest survey zones. Clicking any point on the map
        displays the land-price signal of the nearest facility’s si·gun·gu
        together with its dong-level range. It is all public statistics, and it
        all carries a source.
      </p>
    </>
  ) : (
    <>
      <p>
        “데이터센터가 들어서면 땅값이 오르나요?” — 부지선정 단계에서 가장 많이 받는 질문이지만, 국내에서 이걸
        데이터로 답한 곳은 없다. AI InfraMap는 그 답을 만들기 위해{' '}
        <strong>전국 데이터센터 입지의 지가변동률을 읍면동 단위로 매월 추적</strong>하기 시작했다. 이 글은 그
        방법론과 첫 스냅샷의 풍경을 공개한다.
      </p>

      <h2>무엇을 재나 — 시군구 35곳, 조사구역 539개</h2>
      <p>
        소스는 국토교통부·한국부동산원의 「지가변동률」 통계(KOSIS 공표)다. 현황 맵의 시설 80곳이 입지한{' '}
        <strong>시군구 35곳</strong>을 추리고, 그 안의 <strong>읍면동급 조사구역 539개</strong>의 월간 변동률을
        수집한다. 2026년 5월 기준 첫 스냅샷에서 DC 입지 시군구 중 월간 상승률이 가장 높았던 곳은{' '}
        <strong>서울 용산구(+0.577%)</strong>, 동 단위로는{' '}
        <strong>용산구 동빙고동 일대(+0.985%)</strong>였고, 가장 낮았던 곳은{' '}
        <strong>전남 해남군 북일면(-0.183%)</strong>이었다 — 솔라시도 1GW급 계획이 발표된 바로 그 군이다.
      </p>

      <h2>정직성 규칙 — 아직 인과를 주장하지 않는다</h2>
      <p>
        분명히 하자. 용산의 상승은 데이터센터 때문이 아니라 정비사업의 힘이고, 해남의 하락은 계획 발표에도{' '}
        <em>불구하고</em>일 수 있다. 단월 스냅샷으로 “데이터센터 효과”를 말하는 것은 과장이다. 그래서 AI InfraMap의
        규칙은 세 가지다. 첫째, 시설 좌표가 시군구 중심점인 경우 <strong>특정 동과 시설을 결부하지 않는다</strong>.
        둘째, 추세선은 <strong>3개월 이상 축적 전에는 그리지 않는다</strong>. 셋째, 인과가 아니라{' '}
        <strong>이벤트-지가 정렬</strong>만 기록한다 — 착공·인허가·투자 발표의 타임스탬프와 지가 반응을 나란히
        놓는 것까지가 데이터의 일이고, 해석은 그 다음이다.
      </p>

      <h2>왜 이게 쌓이면 해자가 되나</h2>
      <p>
        지가변동률 통계 자체는 누구나 소급 조회할 수 있다. 그러나{' '}
        <strong>“어떤 발표가 있던 달에 어느 구역이 움직였는가”의 정렬 시계열</strong>은 이벤트 기록을 함께 쌓은
        쪽만 가질 수 있다. 부지선정 단계의 실무 질문 — “이 동네, 지금 들어가도 되는 가격인가” — 에 답하려면
        발표 이전의 베이스라인이 필요하고, 그 베이스라인은 지금부터 쌓는 사람의 것이다. AI InfraMap의 첫 베이스라인은
        2026년 5월이다.
      </p>

      <h2>지금 볼 수 있는 것</h2>
      <p>
        <Link to="/dashboard">대시보드</Link>의 LAND PULSE 위젯에서 입지 시군구 상·하위 변동률과 동 단위
        하이라이트를, 각 <Link to="/">시설 상세</Link>에서 해당 시군구의 평균·최고·최저 조사구역을 확인할 수
        있다. 맵에서 임의 지점을 클릭하면 최근접 시설 시군구의 지가 신호와 동 단위 범위가 함께 표시된다. 전부
        공개 통계이고, 전부 출처가 달려 있다.
      </p>
    </>
  )
}

