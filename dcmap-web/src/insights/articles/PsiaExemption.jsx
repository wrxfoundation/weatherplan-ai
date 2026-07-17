import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ①법령·고시 — 전력계통영향평가 제도(공고 2025-139호)·AIDC 특별법 기반 */
export default function PsiaExemption() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        From 2025, large-scale power demand with contracted capacity of <strong>10MW or more</strong> must undergo a{' '}
        <strong>Power System Impact Assessment (PSIA)</strong>. The data-center industry calls it "effectively the
        gateway to new capital-region builds." And in February 2027, a <strong>non-capital-region bypass</strong>{' '}
        opens on this gateway — the AI Data Center Special Act.
      </p>

      <h2>The frame of the system — 10MW and the capital-region penalty</h2>
      <p>
        The system impact assessment reviews the burden a new large load places on the regional power grid. Its
        evaluation items include not only grid headroom but a <strong>regional score</strong>, so the capital region,
        where the grid is saturated, is structurally disadvantaged, while non-capital regions with surplus generation
        are favored. Under the pilot-operation notice (Ministry of Climate, Energy and Environment Notice No.
        2025-139), the procedure and scoring are already in operation, and failing to pass blocks the power-supply
        consultation with KEPCO itself.
      </p>

      <h2>The special act — exemption for small non-capital AIDCs</h2>
      <p>
        The AI Data Center Special Act contains a special provision that <strong>exempts AI data centers below a
        certain size in non-capital regions from the system impact assessment</strong>, and it is scheduled to{' '}
        <strong>take effect in February 2027</strong>. The crux is the threshold of that "certain size" — the specific
        figure is <strong>delegated to a presidential decree and still undecided</strong>. That single decree number
        determines the effective reach of the exemption track. AI InfraMap has flagged this threshold's enactment as a
        tracking item and will reflect it in the track-determination engine (
        <Link to="/calc">calculator</Link> and site analysis) the moment it is finalized.
      </p>

      <h2>A practitioner's reading — three scenarios</h2>
      <p>
        First, <strong>capital region + 10MW or more</strong>: only the head-on approach. It is subject to assessment
        and carries the regional-score disadvantage. Second,{' '}
        <strong>non-capital region + large scale</strong>: subject to assessment but favored on the regional score,
        with a possible benefit from an expedited-processing track. Third,{' '}
        <strong>non-capital region + below the decree threshold</strong>: exempt from February 2027 — if you can design
        the groundbreaking timing to come after that, one whole permitting risk disappears. Enter the location
        category (capital / non-capital) and the MW figure in the map's site analysis and this scenario determination
        is displayed at once.
      </p>

      <h2>The remaining variable — 345kV information disclosure</h2>
      <p>
        The government has signaled it will <strong>disclose information on 345kV substations</strong> with grid
        headroom. The moment it does, "where is the headroom" turns from estimate into data, and AI InfraMap's
        power-axis scoring (15 points for substation distance) becomes quantifiable. Until then, the power axis
        honestly remains "on standby" — <Link to="/insights/land-pulse-methodology">not manufacturing fake scores</Link>{' '}
        is this map's principle.
      </p>
    </>
  ) : (
    <>
      <p>
        2025년부터 계약전력 <strong>10MW 이상</strong>의 대규모 전력 수요는{' '}
        <strong>전력계통영향평가(PSIA)</strong>를 받아야 한다. 데이터센터 업계가 “수도권 신설의 사실상 관문”이라
        부르는 제도다. 그리고 2027년 2월, 이 관문에 <strong>비수도권 우회로</strong>가 열린다 — AI데이터센터
        특별법이다.
      </p>

      <h2>제도의 뼈대 — 10MW와 수도권 감점</h2>
      <p>
        계통영향평가는 신규 대수요가 지역 전력망에 주는 부담을 심사한다. 평가 항목에는 계통 여유뿐 아니라{' '}
        <strong>지역 배점</strong>이 있어서, 계통이 포화된 수도권은 구조적으로 불리하고 발전력이 남는 비수도권은
        유리하다. 시범운영 공고(기후에너지환경부 공고 제2025-139호) 기준으로 절차와 배점이 운영 중이며, 통과하지
        못하면 한전과의 전력 공급 협의 자체가 막힌다.
      </p>

      <h2>특별법 — 비수도권 소형 AIDC 면제</h2>
      <p>
        AI데이터센터 특별법은 <strong>비수도권의 일정 규모 이하 AI데이터센터에 대해 계통영향평가를
        면제</strong>하는 특례를 담았고, <strong>2027년 2월 시행</strong> 예정이다. 관건은 “일정 규모”의 기준선 —
        구체 수치는 <strong>대통령령에 위임돼 아직 미정</strong>이다. 이 시행령 숫자 하나가 면제 트랙의 실효
        범위를 결정한다. AI InfraMap은 이 기준선 제정을 추적 항목으로 걸어두고, 확정되는 즉시 트랙 판정 엔진(
        <Link to="/calc">계산기</Link>·지점 분석)에 반영한다.
      </p>

      <h2>실무 독법 — 세 가지 시나리오</h2>
      <p>
        첫째, <strong>수도권 + 10MW 이상</strong>: 정공법뿐이다. 평가 대상이고 지역 배점 불리를 안고 간다. 둘째,{' '}
        <strong>비수도권 + 대형</strong>: 평가 대상이지만 지역 배점이 유리하고, 신속 처리 트랙의 수혜 가능성이
        있다. 셋째, <strong>비수도권 + 시행령 기준 이하</strong>: 2027년 2월부터 면제 — 착공 시점을 그 뒤로 설계할
        수 있다면 인허가 리스크 하나가 통째로 사라진다. 맵의 지점 분석에서 입지 구분(수도권/비수도권)과 MW를
        입력하면 이 시나리오 판정이 바로 표시된다.
      </p>

      <h2>남은 변수 — 345kV 정보 공개</h2>
      <p>
        정부는 계통 여유가 있는 <strong>345kV 변전소 정보 공개</strong>를 예고했다. 공개되는 순간 “어디에 여유가
        있는가”가 추정에서 데이터가 되고, AI InfraMap의 전력축 스코어링(변전소 거리 15점)이 점수화된다. 그때까지 전력축은
        정직하게 ‘대기’로 남는다 — <Link to="/insights/land-pulse-methodology">가짜 점수를 만들지 않는 것</Link>이
        이 맵의 원칙이다.
      </p>
    </>
  )
}
