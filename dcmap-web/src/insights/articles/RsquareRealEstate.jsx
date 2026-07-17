import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ③민간 가공(알스퀘어 리서치센터 공개 리포트) 기반 — 수치는 원문 페이지 단위 인용 */
export default function RsquareRealEstate() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ Easy read in 3 minutes</p>
        <p className="tldr-one">
          "As building new data centers got harder, the value of already-built ones jumped — real-estate statistics
          arrive at exactly the same conclusion as the power map."
        </p>
        <ol>
          <li>
            <strong>The permitting cliff</strong> — permit counts halved, from a peak of 25 in 2023 to{' '}
            <strong>10</strong> by September 2025. Factoring in the two years from groundbreaking to completion, today's
            permitting cliff is the <strong>supply cliff of 2027–28</strong>.
          </li>
          <li>
            <strong>The premium on completed assets</strong> — transaction prices jumped from KRW 49.0bn in 2018 (Guro
            IDC) to <strong>KRW 734.0bn</strong> in Hanam and KRW 506.8bn in Pangyo. Because building is hard,
            already-standing buildings became scarce.
          </li>
          <li>
            <strong>The rent rules changed</strong> — old racks needed 2.2kW, but an AI rack needs{' '}
            <strong>30–60kW</strong>. Rent is being restructured around "power (kW)" rather than "number of racks" →
            received-power capacity is asset value.
          </li>
          <li>
            <strong>The conflict is unrelated to science</strong> — measured EMF is lower than a hospital's (0.4% of
            ICNIRP), yet projects get withdrawn. Complaints are a matter of{' '}
            <strong>communication</strong>, not science.
          </li>
          <li>
            <strong>The capital region's last line</strong> — the capital region's power reserve margin fell to{' '}
            <strong>5%</strong> in 2024 (the stability line is 10%). The grid has already answered "can more be built in
            the capital region?"
          </li>
        </ol>
        <p>
          <strong>Bottom line in one sentence</strong> — the answer real-estate research arrives at is, in the end,{' '}
          <strong>"a site with secured power is the asset."</strong> Below unpacks that basis through construction,
          transaction, and rent statistics.
        </p>
      </div>

      <p>
        R Square Research Center's "2025 Data Center Report" (Nov 2025, 49pp) reads data centers in the{' '}
        <strong>language of real estate</strong>. Permit and completion statistics come from the Ministry of Land,
        Infrastructure and Transport's building data, rents from operators' published rates, and transactions from
        actual deals — a source that starts from the exact opposite side of our power- and grid-centered map and
        arrives at the same conclusion. The core data has been absorbed into the{' '}
        <Link to="/data?tab=deals">data explorer</Link>.
      </p>

      <h2>The permitting cliff — from 25 to 10</h2>
      <p>
        Data-center permits peaked at 25 in 2023 and plunged to <strong>10</strong> by September 2025 — about half of
        the 2024 level. The inflection point the report points to is the 2023 enactment of the{' '}
        <strong>Distributed Energy Activation Special Act</strong> (which introduced the power-system impact assessment)
        and the adequacy review of the received-power notice. Construction begins in the year of the permit or the
        following year, and it averages two years from groundbreaking to completion — that is,{' '}
        <strong>today's permitting cliff is the supply cliff of 2027–2028</strong>. Building statistics draw the same
        picture as our <Link to="/insights/pwc-value-chain-2026">demand-supply gap analysis</Link>: demand is exploding
        while the gateway has narrowed.
      </p>

      <h2>The explosion of the transaction market — from KRW 49.0bn to 734.0bn</h2>
      <p>
        A market where Dreammark One's Guro IDC traded for <strong>KRW 49.0bn</strong> in 2018 jumped to the 2024 Hanam
        data center at <strong>KRW 734.0bn</strong> (IGIS → Macquarie Korea Infrastructure) and the 2025 SK AX Pangyo
        IDC at <strong>KRW 506.8bn</strong> (SK Broadband). A market with annual transaction volume under KRW 100bn
        grew to the trillion-won scale — the scarcity premium on completed assets in a supply-constrained environment
        confirmed by actual deals. The five transaction cases (floor area, received capacity, sale price,
        seller/buyer) can be seen in the <Link to="/data?tab=deals">transaction cases tab</Link>.
      </p>

      <h2>The physics of rent — the 2.2kW rack and the 60kW rack</h2>
      <p>
        The monthly rent for a domestic colocation full rack is in the{' '}
        <strong>KRW 1.0m–1.3m</strong> range (published rates from KT Cloud, Gabia, BizMaru, KDT;{' '}
        <Link to="/data?tab=racks">rack rent tab</Link>), and the standard provided power is typically{' '}
        <strong>2.2kW per rack</strong>. Yet the rack density of an AI data center is{' '}
        <strong>30–60kW/rack</strong> (4–8 times the 7.1kW average of a general IDC) — a physical quantity the existing
        billing structure cannot hold. This is why the lease structure is moving from a per-rack basis to{' '}
        <strong>per-power-capacity (kW) billing</strong>, and in a market where power becomes the very basis for rent,
        a site's received-power capacity comes to determine its asset value.
      </p>

      <h2>Community conflict — plans withdrawn despite measured EMF of 0.4%</h2>
      <p>
        The development-conflict cases the report compiles number eight — Anyang (plan withdrawn, site sold), Yongin
        Naver (plan withdrawn), Gimpo (groundbreaking denied), Gimhae NHN (plan withdrawn), and others. The interesting
        part is the measurements: when the Ministry of Science and ICT measured the high-voltage-line EMF at six data
        centers in August–September 2025, the result was an average of{' '}
        <strong>0.4% of the human-protection standard (ICNIRP)</strong> — lower even than a hospital (0.68%) or a hotel
        (1.17%). That projects are withdrawn nonetheless tells us this: on the data center's risk axis,{' '}
        <strong>complaints are a matter of communication, not science</strong>, and proximity to densely populated
        areas is the real variable. The full cases are in the{' '}
        <Link to="/data?tab=conflicts">development conflicts tab</Link>, and population exposure can be checked in the
        map's site analysis (population grid).
      </p>

      <h2>The capital region's 5% reserve margin — the physical last line</h2>
      <p>
        The national power reserve margin is below 10%, and the <strong>capital region's reserve margin fell to 5%</strong>{' '}
        in 2024 (stability standard: 10% or more). In a structure where the capital region consumes 43.5% of peak power
        demand, a 5% reserve margin is the grid already answering the question "can more be built in the capital
        region?" When regional electricity tariffs (signaled for H2 2026) overlap with non-capital dispersion policy —
        the shift in the center of gravity of location is not a choice but physics.
      </p>

      <h2>A reading — where building statistics meet grid data</h2>
      <p>
        In sum: permits are a cliff (25→10), completed assets carry a premium (KRW 734.0bn), rent is being restructured
        by the kW, conflict is real regardless of measurements, and the capital-region grid is at its last line. The
        conclusion real-estate research arrives at is, in the end,{' '}
        <strong>"a site with secured power is the asset."</strong> Turn on the{' '}
        <Link to="/?layers=pipeline">planned-supply layer</Link> on the map to see where this report's projects cluster,
        and on the region pages you can also overlay the general-use contracted power (demand density) by city and
        county.
      </p>
    </>
  ) : (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3분 쉽게 읽기</p>
        <p className="tldr-one">
          “데이터센터를 새로 짓기가 어려워지자, 이미 다 지은 건물값이 뛰었다 — 부동산 통계가 전력 지도와 똑같은
          결론에 도착한다.”
        </p>
        <ol>
          <li>
            <strong>인허가 절벽</strong> — 허가 건수가 2023년 25건 정점에서 2025년 9월 <strong>10건</strong>으로
            반토막. 착공~준공 2년을 감안하면 지금의 인허가 절벽이 곧 <strong>2027~28년 공급 절벽</strong>이다.
          </li>
          <li>
            <strong>완공 자산 프리미엄</strong> — 거래가가 2018년 490억(구로 IDC)에서 하남 <strong>7,340억</strong>·
            판교 5,068억으로 뛰었다. 짓기 어려우니 이미 선 건물이 귀해진 것.
          </li>
          <li>
            <strong>임대료 규칙이 바뀜</strong> — 옛날 랙엔 2.2kW면 됐는데 AI 랙은 <strong>30~60kW</strong>. 임대료가
            ‘랙 개수’가 아니라 ‘전력(kW)’ 기준으로 재편된다 → 수전 능력이 곧 자산 가치.
          </li>
          <li>
            <strong>갈등은 과학과 무관</strong> — 전자파 실측은 병원보다 낮은데(ICNIRP 0.4%) 사업은 철회된다.
            민원은 과학이 아니라 <strong>커뮤니케이션</strong>의 문제.
          </li>
          <li>
            <strong>수도권 마지노선</strong> — 수도권 전력 예비율이 2024년 <strong>5%</strong>(안정선 10%)까지
            내려왔다. “수도권에 더 지을 수 있나”에 계통이 이미 답했다.
          </li>
        </ol>
        <p>
          <strong>결론 한 줄</strong> — 부동산 리서치가 도착한 답도 결국 <strong>“전력을 확보한 부지가 자산”</strong>.
          아래는 그 근거를 건축·거래·임대료 통계로 푼다.
        </p>
      </div>

      <p>
        알스퀘어 리서치센터의 「2025 Data Center Report」(2025.11, 49p)는 데이터센터를{' '}
        <strong>부동산의 언어</strong>로 읽는다. 인허가·준공 통계는 국토교통부 건축 데이터에서, 임대료는 사업자
        공표가에서, 거래는 실거래에서 나온다 — 전력·계통 중심인 우리 맵과 정확히 반대편에서 출발해 같은 결론에
        도착하는 자료다. 핵심 데이터는 <Link to="/data?tab=deals">데이터 탐색기</Link>에 흡수해 두었다.
      </p>

      <h2>인허가 절벽 — 25건에서 10건으로</h2>
      <p>
        데이터센터 인허가는 2023년 25건으로 정점을 찍고 2025년 9월까지 <strong>10건</strong>으로 급감했다 —
        2024년의 절반 수준. 리포트가 지목하는 변곡점은 2023년 <strong>분산에너지 활성화 특별법</strong> 제정(전력계통영향평가
        도입)과 전력 수전예정통지서 적정성 검토다. 인허가를 받은 해나 다음 해에 착공하고, 착공에서 준공까지
        평균 2년 — 즉 <strong>지금의 인허가 절벽은 2027~2028년의 공급 절벽</strong>이다. 수요는 폭증하는데
        관문이 좁아졌다는 우리의 <Link to="/insights/pwc-value-chain-2026">수요-공급 갭 분석</Link>과 같은
        그림을 건축 통계가 그려준다.
      </p>

      <h2>거래 시장의 폭발 — 490억에서 7,340억으로</h2>
      <p>
        2018년 드림마크원 구로 IDC가 <strong>490억</strong>에 거래되던 시장이, 2024년 하남 데이터센터{' '}
        <strong>7,340억</strong>(이지스→맥쿼리한국인프라), 2025년 SK AX 판교 IDC <strong>5,068억</strong>(SK브로드밴드)으로
        뛰었다. 연간 거래 규모가 1천억 미만이던 시장이 조 단위로 커진 것 — 공급 제약 환경에서 완공 자산의
        희소성 프리미엄이 실거래로 확인된 셈이다. 다섯 건의 거래 사례(연면적·수전용량·매매가·매도/매수인)는{' '}
        <Link to="/data?tab=deals">거래 사례 탭</Link>에서 확인할 수 있다.
      </p>

      <h2>임대료의 물리학 — 2.2kW 랙과 60kW 랙</h2>
      <p>
        국내 코로케이션 Full 랙 월 임대료는 <strong>100만~130만 원</strong> 선(KT Cloud·가비아·BizMaru·KDT 공표가,{' '}
        <Link to="/data?tab=racks">랙 임대료 탭</Link>)이고, 기본 제공 전력은 통상 <strong>랙당 2.2kW</strong>다.
        그런데 AI 데이터센터의 랙 밀도는 <strong>30~60kW/rack</strong>(일반 IDC 평균 7.1kW의 4~8배) — 기존 과금
        구조로는 담을 수 없는 물리량이다. 임대 구조가 랙 단위에서 <strong>전력 용량(kW) 단위 과금</strong>으로
        이동하는 이유이고, 전력이 곧 임대료 산정 기준이 되는 시장에서 부지의 수전 능력이 자산 가치를 결정하게
        된다.
      </p>

      <h2>주민 갈등 — 전자파 실측 0.4%인데 계획 철회</h2>
      <p>
        리포트가 집계한 개발 갈등 사례는 안양(계획 철회·부지 매각)·용인 네이버(계획 철회)·김포(착공
        불허)·김해 NHN(계획 철회) 등 8건이다. 흥미로운 것은 실측치: 과기정통부가 2025년 8~9월 데이터센터 6곳의
        고압전선 전자파를 측정한 결과 <strong>인체보호기준(ICNIRP)의 평균 0.4%</strong> — 병원(0.68%)이나
        호텔(1.17%)보다도 낮았다. 그럼에도 사업이 철회된다는 사실이 말해주는 것: 데이터센터의 리스크축에서
        <strong> 민원은 과학이 아니라 커뮤니케이션의 문제</strong>이며, 인구 밀집지 인접 여부가 실질 변수다.
        사례 전체는 <Link to="/data?tab=conflicts">개발 갈등 탭</Link>에, 인구 노출은 맵의 지점 분석(인구
        격자)에서 확인할 수 있다.
      </p>

      <h2>수도권 예비율 5% — 물리적 마지노선</h2>
      <p>
        전국 전력 예비율이 10%를 하회하고, <strong>수도권 예비율은 2024년 5%</strong>까지 내려왔다(안정 기준
        10% 이상). 최대 전력 수요의 43.5%를 수도권이 소비하는 구조에서, 예비율 5%는 "수도권에 더 지을 수
        있는가"라는 질문에 계통이 이미 답한 것이다. 지역별 전기요금제(2026 하반기 예고)와 비수도권 분산
        정책이 겹치면 — 입지의 무게중심 이동은 선택이 아니라 물리다.
      </p>

      <h2>독법 — 건축 통계와 계통 데이터가 만나는 곳</h2>
      <p>
        요약: 인허가는 절벽(25→10건), 완공 자산은 프리미엄(7,340억), 임대료는 kW 단위로 재편, 갈등은 실측과
        무관하게 실재, 수도권 계통은 마지노선. 부동산 리서치가 도착한 결론도 결국{' '}
        <strong>"전력을 확보한 부지가 자산"</strong>이다. 맵에서 <Link to="/?layers=pipeline">공급예정
        레이어</Link>를 켜면 이 리포트의 프로젝트들이 어디에 몰려 있는지, 지역 페이지에서는 시군구별 일반용
        계약전력(수요 밀도)까지 겹쳐 볼 수 있다.
      </p>
    </>
  )
}
