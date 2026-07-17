import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ④참고·인사이트 — 수치는 OCP 공개 웨비나(Parker Hannifin, 2025.6.26) 기술 자료 기반 */
export default function LiquidCoolingBrief() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        The siting conditions of an AI data center change first inside the server
        room. As the thermal design power (TDP) of a single GPU reaches{' '}
        <strong>1,500–2,000W</strong>, air cooling has already passed its limit,
        and even today’s mainstream single-phase direct-to-chip cooling (D2C) is
        approaching its ceiling. The shift in cooling method does not end as a
        technology issue — it is a siting problem that rewrites{' '}
        <strong>
          how much water and power a site needs, and in what manner it uses them
        </strong>
        .
      </p>

      <h2>From single-phase to two-phase — 1.5 L/min per kW becomes 0.3 L/min</h2>
      <p>
        The boundary line presented by Parker Hannifin at an OCP (Open Compute
        Project) public webinar is clear. A GPU TDP of{' '}
        <strong>1,500–2,000W is the limit of single-phase D2C</strong>, and above
        that you need <strong>two-phase cooling</strong>, where the coolant boils
        and carries heat away as latent heat of vaporization. The flow-rate
        requirement differs dramatically — to handle 1kW of heat, single-phase
        needs about <strong>1.5 liters</strong> per minute, two-phase about{' '}
        <strong>0.3 liters</strong>. That means handling the same heat load with
        one-fifth the flow rate, and the premises of pump power, pipe diameter,
        and cooling-water infrastructure all change.
      </p>

      <h2>Market — triple within a decade</h2>
      <p>
        The same material projects the data-center cooling-components market
        reaching about <strong>$14.9 billion in 2030</strong>, tripling within a
        decade. Immersion cooling is under standardization discussion, and the{' '}
        <strong>PFAS (per- and polyfluoroalkyl substances) regulation</strong> on
        two-phase coolant families remains the biggest variable in technology
        choice — which coolant survives determines the answer to “what do you
        accept in exchange for using less water?”
      </p>

      <h2>The siting equation changes</h2>
      <p>
        The cooling transition has three implications for site selection. First,{' '}
        <strong>the weight of water conditions changes</strong> — the two-phase
        transition lowers the flow-rate requirement, but the absolute demand of a
        hyperscale campus grows, so the combination of “water cooling at a
        water-scarce site” remains risky. Second,{' '}
        <strong>weather conditions divide operating costs</strong> — free-cooling
        (free-cooling) available hours and wet-bulb temperature are siting
        variables that carry different weights by cooling method. Third, as
        cooling power falls, the same receiving capacity can{' '}
        <strong>carry more IT load</strong> — improving PUE is itself a
        reinterpretation of contracted power.
      </p>

      <h2>AI InfraMap’s place</h2>
      <p>
        These three are exactly what AI InfraMap scoring’s weather axis (M3) and
        power axis aim to quantify.{' '}
        <Link to="/calc">The GPU calculator</Link> already reflects the cooling
        burden with an overhead coefficient, and starting with the integration of
        Kweather weather data,{' '}
        <strong>site re-evaluation by cooling method</strong> will enter the
        scoring. The generational turnover of cooling changes the definition of a
        “good site” — tracking that definition with data is this map’s job.
      </p>
    </>
  ) : (
    <>
      <p>
        AI 데이터센터의 입지 조건은 서버실 안에서 먼저 바뀐다. GPU 한 장의 열설계전력(TDP)이{' '}
        <strong>1,500~2,000W</strong>에 도달하면서 공랭은 이미 한계를 지났고, 지금의 주류인 단상(單相)
        직접칩냉각(D2C)도 상한선에 닿고 있다. 냉각 방식의 전환은 기술 이슈로 끝나지 않는다 —{' '}
        <strong>물과 전력을 얼마나, 어떤 방식으로 쓰는 부지가 필요한가</strong>를 다시 쓰는 입지 문제다.
      </p>

      <h2>단상에서 2상으로 — 1kW당 물 1.5L/min이 0.3L/min이 된다</h2>
      <p>
        OCP(Open Compute Project) 공개 웨비나에서 파커 하니핀(Parker Hannifin)이 제시한 경계선은 명확하다.
        GPU TDP <strong>1,500~2,000W가 단상 D2C의 한계선</strong>이고, 그 위부터는 냉매가 끓으며 기화열로 열을
        빼앗는 <strong>2상(二相) 냉각</strong>이 필요해진다. 유량 요구는 극적으로 다르다 — 1kW의 열을 처리하는 데
        단상은 분당 약 <strong>1.5리터</strong>, 2상은 약 <strong>0.3리터</strong>. 같은 열부하를 5분의 1의
        유량으로 감당한다는 뜻이고, 펌프 동력·배관 구경·냉각수 인프라의 전제가 전부 달라진다.
      </p>

      <h2>시장 — 10년 안에 3배</h2>
      <p>
        같은 자료는 데이터센터 냉각 부품 시장이 <strong>2030년 약 149억 달러</strong> 규모로, 10년 안에 3배
        성장할 것으로 본다. 침지냉각(immersion)은 표준화 논의가 진행 중이고, 2상 냉매 계열의{' '}
        <strong>PFAS(과불화화합물) 규제</strong>는 기술 선택의 가장 큰 변수로 남아 있다 — 어떤 냉매가 살아남는지에
        따라 “물을 덜 쓰는 대신 무엇을 감수할 것인가”의 답이 달라진다.
      </p>

      <h2>입지 방정식이 바뀐다</h2>
      <p>
        냉각 전환이 부지선정에 주는 함의는 세 가지다. 첫째, <strong>용수 조건의 무게가 달라진다</strong> — 2상
        전환은 유량 요구를 낮추지만, 하이퍼스케일 캠퍼스의 절대 수요는 커져서 “물이 부족한 입지의 수냉식”이라는
        조합은 여전히 위험하다. 둘째, <strong>기상 조건이 운영비를 가른다</strong> — 외기냉방(프리쿨링) 가능
        시간과 습구온도는 냉각 방식별로 다른 가중치를 갖는 입지 변수다. 셋째, 냉각 전력이 줄면 같은 수전용량으로{' '}
        <strong>IT 부하를 더 실을 수 있다</strong> — PUE 개선은 곧 계약전력의 재해석이다.
      </p>

      <h2>AI InfraMap의 자리</h2>
      <p>
        이 셋은 정확히 AI InfraMap 스코어링의 기상축(M3)·전력축이 계량하려는 대상이다.{' '}
        <Link to="/calc">GPU 계산기</Link>는 오버헤드 계수로 냉각 부담을 반영하고 있고, 케이웨더 기상 데이터
        연동을 시작으로 <strong>냉각 방식별 입지 재평가</strong>가 스코어링에 들어올 예정이다. 냉각의 세대 교체는
        “좋은 부지”의 정의를 바꾼다 — 그 정의를 데이터로 추적하는 것이 이 맵의 일이다.
      </p>
    </>
  )
}

