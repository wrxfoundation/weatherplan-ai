import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ①법령·고시 — 한전 기본공급약관 제23조·기후에너지환경부 공고 기반 (docs/power-licensing-rulebook-v0.md) */
export default function PowerTrack40mw() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        The first number to lock down when evaluating a data center site is not the land price or its assessed
        value — it is the <strong>required capacity (MW)</strong>. That single number determines the receiving
        voltage, who performs the interconnection works, the fees, and the lead time. There are two thresholds —{' '}
        <strong>10MW and 40MW</strong> (Article 23 of the Basic Electricity Supply Terms).
      </p>

      <h2>10MW — the baseline for 22.9kV general supply</h2>
      <p>
        Under the table in Article 23 ①, a contracted capacity of <strong>10,000kW (10MW) or less</strong> is
        supplied at 22.9kV, while <strong>above 10,000kW the rule is 154kV</strong>. Because 22.9kV connects to the
        distribution network, it is relatively fast and cheap. Small and mid-sized colocation and edge facilities
        sit below this baseline. That said, the current map's{' '}
        <Link to="/stats">average receiving capacity of 17.7MW for domestic private data centers</Link> already
        exceeds 10MW, placing them in the conditional band below.
      </p>

      <h2>10–40MW — 154kV as the rule, 22.9kV under conditions</h2>
      <p>
        Above 10,000kW the rule is 154kV, but the <strong>③-1 exception</strong> in Article 23 leaves a door open:
        if the contracted capacity after new or expanded connection is <strong>40,000kW (40MW) or less</strong>,
        the KEPCO substation has spare supply capability, and there are no issues with protection coordination,
        line configuration, or metering, supply at 22.9kV is possible. In other words, this is a case-by-case band
        in which a site's fate is subordinate to the state of the distribution network — the same 30MW load may end
        up at 22.9kV or 154kV depending on which substation has jurisdiction. 40MW is the ceiling of this 22.9kV
        exception.
      </p>

      <h2>40MW — the wall of the 154kV mandate</h2>
      <p>
        <strong>Above 40MW (40,000kW), the 22.9kV exception (③-1) closes and 154kV transmission-level supply
        becomes mandatory</strong> (above 400,000kW, it becomes 345kV). A dedicated substation-class facility,
        transmission line interconnection, and construction costs and timelines of a different order all follow.
        The fees differ from the application stage onward — per the public notice, the combined pre-review and
        technical review fees are roughly <strong>1.35 million won</strong> for 22.9kV versus about{' '}
        <strong>7.26 million won</strong> for 154kV. The fees themselves are small money, but this gap is a preview
        of the scale of facility investment that follows.
      </p>

      <h2>Implications in the AI era — the wall is hit more often</h2>
      <p>
        At the power density of GPU clusters, 40MW is a number reached quickly. Converting with the{' '}
        <Link to="/calc">GPU calculator</Link> shows that just over 20,000 GB200 units already enter the mandatory
        154kV band. If you are planning a hyperscale facility, the order of questions must change — before "is this
        land good?" comes <strong>"at this capacity, which track am I on, and does this region have a grid that can
        carry that track?"</strong> Click any point on the map and the track determination (receiving voltage,
        whether a grid impact assessment applies) is shown immediately based on the MW you enter.
      </p>
    </>
  ) : (
    <>
      <p>
        데이터센터 부지 검토에서 가장 먼저 확정해야 할 숫자는 땅값도 지가도 아니고 <strong>필요 용량(MW)</strong>이다.
        그 숫자 하나가 수전전압, 인입 공사의 주체, 수수료, 리드타임을 전부 결정하기 때문이다. 경계는 두 곳 —{' '}
        <strong>10MW와 40MW</strong>다(기본공급약관 제23조).
      </p>

      <h2>10MW — 22.9kV 일반공급의 원칙선</h2>
      <p>
        제23조 ① 표에 따르면 계약전력 <strong>1만kW(10MW) 이하</strong>는 22.9kV, <strong>1만kW 초과는 154kV</strong>가
        원칙이다. 22.9kV는 배전망에 물리는 구조라 상대적으로 빠르고 싸다. 중소형 코로케이션·엣지 시설이 이 원칙선
        아래에 있다. 다만 현황 맵의 <Link to="/stats">국내 민간 데이터센터 평균 수전용량 17.7MW</Link>는 이미 10MW를
        넘어, 아래 조건부 구간에 걸쳐 있다.
      </p>

      <h2>10~40MW — 154kV 원칙, 조건부 22.9kV</h2>
      <p>
        1만kW를 넘으면 154kV가 원칙이지만, 제23조 <strong>③-1 예외</strong>가 열려 있다: 신·증설 후 계약전력이{' '}
        <strong>4만kW(40MW) 이하</strong>이면서 한전 변전소 공급능력에 여유가 있고 보호협조·선로구성·계량에 문제가
        없으면 22.9kV로 공급받을 수 있다. 즉 부지의 운명이 배전망 사정에 종속되는 케이스-바이-케이스 구간이다 —
        같은 30MW라도 어느 변전소 관할이냐에 따라 22.9kV가 되기도, 154kV가 되기도 한다. 40MW가 이 22.9kV 예외의
        상한이다.
      </p>

      <h2>40MW — 154kV 의무의 벽</h2>
      <p>
        <strong>40MW(4만kW) 초과는 22.9kV 예외(③-1)가 닫히고 154kV 송전 수전이 의무</strong>다(40만kW 초과는 345kV).
        전용 변전소급 설비, 송전선로 인입, 격이 다른
        공사비와 시간이 따라온다. 신청 단계 수수료부터 다르다 — 공고 기준 사전검토·기술검토 수수료 합계가 22.9kV는
        약 <strong>135만 원</strong>, 154kV는 약 <strong>726만 원</strong> 수준. 수수료 자체는 작은 돈이지만, 이
        차이는 뒤에 따라올 설비 투자 규모의 예고편이다.
      </p>

      <h2>AI 시대의 함의 — 벽은 더 자주 부딪힌다</h2>
      <p>
        GPU 클러스터의 전력 밀도에서 40MW는 금방 닿는 숫자다. <Link to="/calc">GPU 계산기</Link>로 환산해 보면
        GB200 기준 2만 장 남짓이면 154kV 의무 구간에 진입한다. 하이퍼스케일을 계획한다면 질문 순서가 바뀌어야
        한다 — “이 땅이 좋은가”보다 먼저 <strong>“이 용량이면 어떤 트랙인가, 그 트랙을 감당할 계통이 이 지역에
        있는가”</strong>. 맵에서 임의 지점을 클릭하면 입력한 MW 기준으로 트랙 판정(수전전압·계통영향평가 대상
        여부)이 바로 표시된다.
      </p>
    </>
  )
}
