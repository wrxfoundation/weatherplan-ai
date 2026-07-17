import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 1차 소스: KDDC Issue Focus(2026.6.16)·STRABASE — SpaceX 상장·AI1 궤도 데이터센터.
 * 콘텐츠 등급 ④참고·인사이트. 수치는 원문 인용, 국내 함의는 AI InfraMap 데이터로 연결. */
export default function OrbitalBottleneck() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <p>
        In June 2026, the market was seized by doubt about AI. OpenAI missed its targets, Oracle and
        CoreWeave plunged together, and a ‘bubble’ warning was attached to Big Tech’s USD 700 billion
        in annual AI investment. In the very middle of that fear, the market handed{' '}
        <strong>SpaceX (SPCX)</strong>, which listed on the Nasdaq on June 12, a{' '}
        <strong>market capitalization of over USD 2 trillion</strong>. What is intriguing is that a
        large part of this valuation was assigned to a <strong>‘data center that does not yet
        exist’</strong> — a plan for an orbital data center of up to one million units. What the market
        bought was not servers in space but a
        <strong> ‘toll for the AI bottleneck’</strong>.
      </p>

      <h2>The bottleneck has never stopped — from GPUs to power, from power to the grid</h2>
      <p>
        The scarce resource in the generative-AI race was at first the GPU (the volume of H100, GB200,
        and GB300 secured was, in effect, growth speed). Once chip supply loosened, the bottleneck
        moved straight to <strong>power</strong>. The scale is not an abstraction but a number — current
        U.S. data center power consumption is about <strong>41GW, on par with the U.S. merchant nuclear
        fleet</strong> (about 40% of America’s roughly 100GW of total nuclear), and a single ultra-large
        AI training cluster draws about 100MW (a small city’s worth). The IEA projects that global DC
        power consumption will more than double to about <strong>945TWh</strong> by 2030, exceeding
        Japan’s entire consumption. U.S. electricity rates have risen 42% versus 2019, and in
        DC-dense areas power costs have jumped 30–50%.
      </p>

      <h2>The Speed Mismatch — which is why Big Tech became power developers</h2>
      <p>
        The more fundamental problem is the <strong>speed mismatch</strong>. AI capital investment is
        deployed in 12–24 months, but <strong>expanding the power grid takes 4–10 years</strong>. Models
        grow at the speed of light while electricity arrives at the speed of transmission lines and
        substations. Unable to endure this gap, Big Tech became power developers itself — Microsoft is
        pursuing 835MW by restarting the Three Mile Island reactor, Amazon 5GW of SMRs with X-energy, and
        Google 500MW with Kairos Power. Yet most will not supply electricity until the mid-2030s.{' '}
        <strong>Data centers need power now, but the reactors come ten years later.</strong>
      </p>
      <p>
        The competitive criteria for data center operators have changed. In the past it was good
        servers, low PUE, and networking, but now{' '}
        <strong>the ability to secure power is competitiveness itself</strong>. The DC operator of the
        AI era is a cloud company and a real-estate developer and, at the same time, a{' '}
        <strong>power developer</strong>. SpaceX’s AI1 (70m wide, low-orbit solar continuous generation,
        120–150kW equivalent to one GB300 rack) is the most extreme end point of this trend, one that
        flipped the question itself by asking, “Why must it be connected to the grid at all?”
      </p>

      <h2>AI InfraMap’s Perspective — the toll is translated into ‘siting’ on the Korean Peninsula</h2>
      <p>
        Orbital data centers are outside reality for most operators. For those who remain on the ground,
        the bottleneck’s migration translates directly into{' '}
        <strong>‘where you build’</strong>. AI InfraMap reads that toll on the site — regions with spare
        grid capacity (the power axis: <Link to="/insights/psia-exemption-2027">grid spare capacity and
        the power-system impact assessment</Link>), belts where clean-energy supply is concentrated
        (renewables at 86.5% and non-capital-region at 86%, as confirmed in the{' '}
        <Link to="/stats">generation permit pipeline</Link>), and the permitting track that narrows the
        speed mismatch (the AIDC Special Act’s non-capital-region exemption). The domestic version of the
        same logic is covered in{' '}
        <Link to="/insights/power-permit-battle">‘Power and Permits Decide the Contest’</Link>. Wherever
        the AI bottleneck moves, that chokepoint is ultimately decided at a single point on the map.
      </p>
    </>
  ) : (
    <>
      <p>
        2026년 6월, 시장은 AI에 대한 의심에 사로잡혀 있었다. OpenAI는 목표를 놓쳤고 Oracle·CoreWeave는
        동반 급락했으며 빅테크의 연 7,000억 달러 AI 투자에 ‘거품’ 경고가 붙었다. 바로 그 공포의 한복판에서
        6월 12일 나스닥에 상장한 <strong>SpaceX(SPCX)</strong>에 시장은 <strong>2조 달러 넘는 시가총액</strong>을
        안겼다. 흥미로운 건 이 가치의 상당 부분이 <strong>‘아직 존재하지 않는 데이터센터’</strong>에 매겨졌다는
        점이다 — 최대 100만 기 규모의 궤도 데이터센터 구상이다. 시장이 산 것은 우주의 서버가 아니라
        <strong> ‘AI 병목 통행권’</strong>이었다.
      </p>

      <h2>병목은 멈춘 적이 없다 — GPU에서 전력으로, 전력에서 전력망으로</h2>
      <p>
        생성형 AI 경쟁의 희소 자원은 처음엔 GPU였다(H100·GB200·GB300 확보량이 곧 성장 속도). 칩 공급이 풀리자
        병목은 곧장 <strong>전력</strong>으로 옮겨갔다. 규모는 추상이 아니라 숫자다 — 현재 미국 데이터센터 전력
        소비는 약 <strong>41GW로 미국 상업용(merchant) 원전 규모와 맞먹고</strong>(미국 전체 원전 약 100GW의 40% 수준), 초대형 AI 학습 클러스터 하나가 약
        100MW(작은 도시 하나)를 끌어쓴다. IEA는 전 세계 DC 전력 소비가 2030년 약 <strong>945TWh</strong>로 두 배
        이상 늘어 일본 전체 소비를 웃돌 것으로 본다. 미국 전기요금은 2019년 대비 42% 올랐고, DC 밀집 지역에선
        전력비용이 30~50% 뛰었다.
      </p>

      <h2>속도의 불일치 — 그래서 빅테크는 발전사업자가 됐다</h2>
      <p>
        더 본질적인 문제는 <strong>속도의 불일치</strong>다. AI 자본 투자는 12~24개월이면 집행되지만{' '}
        <strong>전력망 증설은 4~10년</strong>이 걸린다. 모델은 빛의 속도로 크는데 전기는 송전선·변전소의 속도로
        따라온다. 이 간극을 못 견딘 빅테크는 스스로 발전사업자가 됐다 — Microsoft는 스리마일섬 원전 재가동으로
        835MW, Amazon은 X-energy와 5GW SMR, Google은 Kairos Power와 500MW를 추진한다. 그러나 대부분은
        2030년대 중반에야 전기를 공급한다. <strong>데이터센터는 지금 전력이 필요한데, 원전은 10년 뒤에 온다.</strong>
      </p>
      <p>
        데이터센터 사업자의 경쟁 기준이 바뀌었다. 과거엔 좋은 서버·낮은 PUE·네트워크였지만, 이제는{' '}
        <strong>전력 확보 능력이 곧 경쟁력</strong>이다. AI 시대의 DC 사업자는 클라우드 기업이자 부동산 개발사이며
        동시에 <strong>전력 개발사</strong>다. SpaceX의 AI1(폭 70m·저궤도 태양광 상시발전·GB300 랙 1대급 120~150kW)은
        “왜 반드시 전력망에 연결돼야 하는가?”라며 질문 자체를 뒤집은, 이 흐름의 가장 극단적인 종착점이다.
      </p>

      <h2>AI InfraMap의 관점 — 통행권은 한반도에서 ‘입지’로 번역된다</h2>
      <p>
        궤도 데이터센터는 대부분의 사업자에게 현실 밖이다. 지상에 남은 이들에게 병목의 이동은 곧{' '}
        <strong>‘어디에 짓느냐’</strong>로 번역된다. AI InfraMap은 그 통행권을 부지 위에서 읽는다 — 전력망 여유가 있는
        권역(전력축 <Link to="/insights/psia-exemption-2027">계통 여유용량·계통영향평가</Link>), 청정에너지 공급이
        몰린 벨트(<Link to="/stats">발전 허가 파이프라인</Link>에서 확인되는 재생E 86.5%·비수도권 86%), 그리고
        속도의 불일치를 줄여주는 인허가 트랙(AIDC 특별법 비수도권 면제)이다. 같은 논리의 국내판은{' '}
        <Link to="/insights/power-permit-battle">‘전력·허가가 승부를 가른다’</Link>에서 다뤘다. AI 병목이 어디로
        옮겨가든, 그 길목은 결국 지도 위 한 점에서 결정된다.
      </p>
    </>
  )
}
