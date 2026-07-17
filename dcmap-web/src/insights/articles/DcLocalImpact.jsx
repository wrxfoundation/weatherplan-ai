import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ④참고·인사이트 — 수치는 미국 공개 연구·보도 기반, 재인용 경로를 출처 박스에 명시 */
export default function DcLocalImpact() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        The criticism that data centers consume water, strain the power grid, and can push up local
        electricity rates is not wrong. But the exaggeration that they "only cause harm with nothing given
        in return" is equally at odds with the facts. The conclusion from America's public data is a single
        one — the policy question should not be{' '}
        <strong>"whether to build or not," but "where and in what manner to build."</strong>
      </p>

      <h2>Jobs — often overstated, but not nonexistent</h2>
      <p>
        Research by Dany Bahar and Greg Wright finds that in U.S. regions where data centers arrived,{' '}
        <strong>total employment rose 4–5%, construction employment 11%, and information-sector employment
        22%</strong>, with average wages up 3–4% as well. The effect persisted for{' '}
        <strong>at least 5–6 years</strong> after construction ended. Both the claim that "they are just
        warehouses full of servers with no jobs" and the spin that "they create enormous numbers of jobs"
        are at a distance from the data.
      </p>

      <h2>Water — the total is small; the issue is local</h2>
      <p>
        In 2023, direct water use by U.S. data centers was <strong>about 66 billion liters</strong> — roughly
        3% of what U.S. golf courses used that same year (about 2 trillion liters), and{' '}
        <strong>less than 0.5%</strong> of total U.S. freshwater use. Many facilities reuse the same water in
        closed-loop systems, and some statistics distort the picture by counting even natural evaporation
        from hydropower generation as "water used by AI." That said, new water-cooled builds in
        water-scarce regions like Phoenix warrant caution —{' '}
        <strong>water should be assessed at the site level, not through a nationwide fear narrative.</strong>
      </p>

      <h2>Power — a real burden, with supply deciding the outcome</h2>
      <p>
        Power demand is genuinely worth worrying about. If data centers cluster in supply-constrained
        regions, electricity rates can rise. But outcomes diverge by region — Virginia, where data centers
        make up a large share of power demand, may face a heavier burden, whereas Texas has held price
        increases in check by expanding generation and transmission capacity in tandem.{' '}
        <strong>Choosing places with grid headroom</strong> reduces the total volume of conflict.
      </p>

      <h2>Tax revenue — the Loudoun County experiment</h2>
      <p>
        In Loudoun County, Virginia, data centers occupy only <strong>about 3%</strong> of the county's land
        while generating <strong>nearly half of its property-tax revenue</strong>. Data-center-related
        property-tax revenue in 2026 is projected at <strong>$1.3 billion</strong>, and with that funding the
        county built 32 schools, 16 fire stations, and 6 libraries, along with roads, parks, and housing-support
        programs — all while lowering residents' property-tax rates.
      </p>

      <h2>Implications for Korea</h2>
      <p>
        60% of Korea's data centers are concentrated in the Seoul metropolitan area (<Link to="/stats">statistics</Link>),
        and new projects across the region are running into resident opposition. The lesson from the U.S. cases
        is not a binary of for-or-against siting, but the <strong>science of location</strong> — quantifying grid
        headroom, water supply, complaint risk, and weather conditions to answer "where and in what manner." This
        is exactly the problem AI InfraMap's <Link to="/">status map</Link> and site-suitability scoring (M2) set
        out to solve.
      </p>
    </>
  ) : (
    <>
      <p>
        데이터센터가 물을 쓰고, 전력망에 부담을 주고, 지역 전기요금 상승 압력을 만들 수 있다는 비판은 틀린 말이
        아니다. 그러나 “아무런 대가 없이 피해만 준다”는 식의 과장도 사실과 다르다. 미국의 공개 데이터가 보여주는
        결론은 하나다 — 정책적 질문은 <strong>“지을 것인가 말 것인가”가 아니라 “어디에, 어떤 방식으로 지을
        것인가”</strong>여야 한다.
      </p>

      <h2>고용 — 과장되곤 하지만, 없는 것이 아니다</h2>
      <p>
        대니 바하르(Dany Bahar)·그레그 라이트(Greg Wright)의 연구에 따르면 데이터센터가 들어선 미국 지역에서{' '}
        <strong>전체 고용은 4~5%, 건설 고용은 11%, 정보산업 고용은 22% 증가</strong>했고 평균 임금도 3~4% 올랐다.
        이 효과는 건설이 끝난 뒤에도 <strong>최소 5~6년</strong> 이어졌다. “서버만 가득한 창고라 일자리가 없다”는
        주장과 “엄청난 일자리를 만든다”는 포장, 둘 다 데이터와 거리가 있다.
      </p>

      <h2>물 — 총량은 작고, 문제는 지역이다</h2>
      <p>
        2023년 미국 데이터센터의 직접 물 사용량은 <strong>약 660억 리터</strong> — 같은 해 미국 골프장이 쓴 물(약
        2조 리터)의 3% 수준이고, 미국 전체 담수 사용량의 <strong>0.5% 미만</strong>이다. 다수 시설은 폐쇄형 순환
        구조로 같은 물을 재사용하며, 일부 통계는 수력발전 과정의 자연 증발분까지 “AI가 쓴 물”로 계산해 왜곡이
        생긴다. 단, 피닉스처럼 물이 부족한 지역의 수냉식 신설은 신중해야 한다 —{' '}
        <strong>물 문제는 전국 단위 공포 담론이 아니라 입지 단위로 따져야 한다.</strong>
      </p>

      <h2>전력 — 실재하는 부담, 공급이 가르는 결과</h2>
      <p>
        전력 수요는 실제로 걱정할 만한 수준이다. 공급이 부족한 지역에 데이터센터가 몰리면 전기요금이 오를 수 있다.
        그러나 결과는 지역에 따라 갈린다 — 데이터센터 전력 비중이 높은 버지니아는 부담이 커질 수 있는 반면,
        텍사스는 발전·송전 용량을 함께 늘려 가격 상승을 억제해 왔다. <strong>계통 여유가 있는 곳을 고르는 것</strong>
        이 갈등의 총량을 줄인다.
      </p>

      <h2>세수 — 라우던 카운티의 실험</h2>
      <p>
        버지니아주 라우던 카운티에서 데이터센터는 카운티 토지의 <strong>약 3%</strong>만 차지하면서{' '}
        <strong>재산세 수입의 거의 절반</strong>을 만들어냈다. 2026년 데이터센터 관련 재산세 수입은{' '}
        <strong>13억 달러</strong>로 예상되고, 그 재원으로 학교 32곳·소방서 16곳·도서관 6곳과 도로·공원·주거 지원
        프로그램을 지으면서도 주민 재산세율을 낮췄다.
      </p>

      <h2>한국에의 시사점</h2>
      <p>
        국내 데이터센터의 60%는 수도권에 몰려 있고(<Link to="/stats">통계</Link>), 수도권 곳곳의 신규 프로젝트는
        주민 반대 민원에 부딪히고 있다. 미국 사례의 교훈은 유치 찬반의 이분법이 아니라{' '}
        <strong>입지의 과학</strong>이다 — 계통 여유·용수·민원 리스크·기상 조건을 정량화해 “어디에, 어떤 방식으로”를
        답하는 것. AI InfraMap의 <Link to="/">현황 맵</Link>과 부지 적합도 스코어링(M2)이 풀려는 문제가 정확히 이것이다.
      </p>
    </>
  )
}
