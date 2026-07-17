import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ④참고·인사이트(보도 종합) — 국내외 사례는 IT동아(2026.5.15) 재인용, 수치·출처는 본문·출처 박스에 명시 */
export default function DcCoexistence() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3-Minute Easy Read</p>
        <p className="tldr-one">
          “No matter how much power and land you secure to build a data center, if the residents next door
          object, you can’t build it. The real final gate is not technology but{' '}
          <strong>‘can we live together (acceptance)’</strong>.”
        </p>
        <ol>
          <li>
            <strong>Why do they fall through</strong> — Sejong Eojin-dong had some 30,000 households living
            within a 1km radius and was scrapped over resident opposition; Goyang Deogi-dong got into trouble
            because it <strong>obtained the permit first, without resident communication</strong>. These are
            cases that collapsed over communication, not over power or land.
          </li>
          <li>
            <strong>What residents worry about</strong> — higher electricity bills, water, noise, EMF, and few
            jobs. Of these, EMF, when actually measured, is even lower than a hospital (
            <Link to="/insights/rsquare-realestate-2025">0.4% of ICNIRP</Link>), yet projects still collapse —
            meaning it’s <strong>a communication problem, not a scientific one</strong>.
          </li>
          <li>
            <strong>Some neighborhoods coexist well (the technology of coexistence)</strong> — In Odense,
            Denmark, Meta returns the heat used for cooling as <strong>district heating</strong>, and Google
            pledged to <strong>return 120% of the water it uses to nature</strong>, building a waterworks
            facility and handing it over to the city.
          </li>
          <li>
            <strong>And neighborhoods it ruined</strong> — In Nevada, USA, the utility notified that it would
            cut power to <strong>49,000 residents</strong>, saying “the data center leaves electricity short,”
            and Fayetteville, Georgia suffers from water shortages.
          </li>
          <li>
            <strong>Korea’s hint</strong> — SK in Ulsan makes electricity directly via{' '}
            <strong>LNG self-generation</strong> rather than leaning on the grid, and the Korea Energy Economics
            Institute named <strong>Honam, Yeongnam, and Gangwon</strong> — where conflict is lower — as suitable
            sites.
          </li>
        </ol>
        <p>
          <strong>Bottom line in one sentence</strong> — on top of power and land,{' '}
          <strong>‘community acceptance’ is the fourth siting axis</strong>. As much as where you build,{' '}
          <strong>how you build and what you give back</strong> decides whether the business succeeds or fails.
        </p>
      </div>

      <p>
        IT Donga reporter Nam Si-hyun’s “The Era of KRW 1,000 Trillion in AI Data Center Spending — Society
        Needs the ‘Technology of Coexistence’ More Than AI” (2026.5.15) squarely addresses an axis our map
        easily misses. The five axes of <Link to="/">AI InfraMap</Link> — power, land, risk, network, and
        weather — are all <strong>physical supply</strong>. But even a physically perfect site{' '}
        <strong>can’t be built if residents object</strong>. This is the domestic counterpart to{' '}
        <Link to="/insights/dc-local-impact">the earlier piece</Link> that discussed “where and how” with US
        data (employment, water, tax revenue), and finds the answer to that “how” in the technology of
        coexistence.
      </p>

      <h2>Fall-throughs caused by permits without communication — Sejong Eojin-dong, Goyang Deogi-dong</h2>
      <p>
        The Sejong Eojin-dong data center was pursued on the Sejong Finance Center site in 2024, but{' '}
        <strong>some 30,000 households within a 1km radius</strong> formed an emergency committee opposing the
        installation. A location mixed in with commercial and business facilities was the flashpoint. In the
        end the project fell through when sale negotiations between the investor and the building owner broke
        down, but it left the lesson that “future development <strong>requires consultation with the local
        community</strong>.” In Goyang Deogi-dong, GS Engineering &amp; Construction affiliate Magna PFV pursued
        a two-basement, five-story facility, and the fact that it{' '}
        <strong>obtained the building permit first, without resident communication</strong>, triggered social
        backlash. Both cases stopped over <strong>procedure and communication</strong>, not over power or land.
      </p>

      <h2>The real axis of conflict — and the paradox of EMF</h2>
      <p>
        What residents fear is higher electricity bills, competition over water, noise, EMF, and the low-employment
        perception that “there are few jobs but all the burden.” The interesting one among these is{' '}
        <strong>EMF</strong> — when the Ministry of Science and ICT measured six data centers, the result
        averaged <strong>0.4%</strong> of the human-protection standard (ICNIRP), lower even than hospitals
        (0.68%) and hotels (1.17%) (<Link to="/insights/rsquare-realestate-2025">RSquare report</Link>). What
        the fact that projects are still withdrawn tells us: on the data-center risk axis,{' '}
        <strong>complaints are a matter of trust, not science</strong>, and the real variable is proximity to
        densely populated areas. That is why AI InfraMap puts the <strong>population grid</strong> on the risk
        axis in its point analysis.
      </p>

      <h2>The technology of coexistence — returning heat, repaying water</h2>
      <p>
        Abroad, cases that resolved conflict through <strong>win-win design</strong> have accumulated. The Meta
        data center in Odense, Denmark supplies the hot water used for cooling as <strong>district heating</strong>,
        and Microsoft too contributed to district heating in Espoo, Finland, cutting nearby carbon emissions by
        about <strong>40%</strong>. Google set a goal of{' '}
        <strong>returning more than 120% of the water resources it uses to nature</strong> by 2030, and in some
        regions built waterworks facilities good for decades and even{' '}
        <strong>permanently transferred groundwater usage rights to the city</strong>. This showed that a data
        center can be <strong>a facility that gives back, not one that only takes</strong> from the region.
      </p>

      <h2>A cautionary tale — cutting the power, drying up the water</h2>
      <p>
        The opposite scene is just as clear. In Nevada, USA, a company that had supplied power near Lake Tahoe
        notified that it would <strong>halt power supply from the following May</strong>, citing data-center
        load, and the regional energy supplier was left having to find a new power source within a year for{' '}
        <strong>49,000 residents</strong>. In Fayetteville, Georgia, a data-center complex of up to 16 buildings
        moved in and a <strong>water-supply problem</strong> flared up. It is a warning of what kind of social
        bill development that fails to design the technology of coexistence leaves behind.
      </p>

      <h2>Korea’s solution signals — self-generation and the relocation of suitable sites</h2>
      <p>
        Designs that skirt conflict are appearing domestically too. SK’s data center in Ulsan meets its needed
        power (about <strong>213GWh</strong> per year) with <strong>LNG cogeneration self-generation</strong>
        rather than leaning on the grid, directly importing about 30,000 tons of LNG a year — one way to bypass
        capital-region grid saturation (<Link to="/insights/rsquare-realestate-2025">5% reserve margin</Link>).
        In its September 2024 “Implications of Data Center Growth for Domestic Energy Consumption in the AI Era,”
        the Korea Energy Economics Institute counted 165 domestic data centers (60% in the capital region) and
        named <strong>Honam, Yeongnam, and Gangwon</strong> — with relatively better power and acceptance
        conditions — as suitable sites. Non-capital dispersion becomes a choice that lowers not only the grid
        burden but <Link to="/insights/landing-edge">the total volume of conflict</Link>.
      </p>

      <h2>Takeaway — acceptance is the fourth siting axis</h2>
      <p>
        To summarize: even with full physical supply (power and land), without <strong>social acceptance</strong>
        the business stops. And acceptance is a matter of <strong>design</strong>, not PR — a structure that
        returns heat as district heating, water as waterworks, and power via self-generation is itself risk
        management. AI InfraMap adds the population grid and complaint history to the risk axis, and separately
        manages the map’s <Link to="/data?tab=conflicts">development-conflict cases</Link>, in order to quantify
        this “fourth axis.” As IT Donga’s thesis holds, in the KRW 1,000-trillion era what is truly scarce may
        not be AI but the <strong>technology of coexistence</strong>.
      </p>
    </>
  ) : (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3분 쉽게 읽기</p>
        <p className="tldr-one">
          “데이터센터를 지을 전기·땅을 아무리 구해도, 옆에 사는 주민이 반대하면 못 짓는다. 진짜 마지막 관문은
          기술이 아니라 <strong>‘같이 살 수 있느냐(수용성)’</strong>다.”
        </p>
        <ol>
          <li>
            <strong>왜 무산되나</strong> — 세종 어진동은 반경 1km 안에 3만여 세대가 살았는데 주민 반대로 무산,
            고양 덕이동은 <strong>주민 소통 없이 허가부터</strong> 받은 게 화근이었다. 전기·땅 문제가 아니라
            소통 문제로 엎어진 사례들.
          </li>
          <li>
            <strong>주민이 걱정하는 것</strong> — 전기요금 상승·용수·소음·전자파·일자리 적음. 이 중 전자파는
            실측하면 병원보다도 낮은데(
            <Link to="/insights/rsquare-realestate-2025">ICNIRP의 0.4%</Link>), 그래도 사업이 엎어진다 — 과학이
            아니라 <strong>커뮤니케이션의 문제</strong>라는 뜻.
          </li>
          <li>
            <strong>잘 사는 동네도 있다(공존의 기술)</strong> — 덴마크 오덴세의 메타는 냉각에 쓴 열을 <strong>지역
            난방</strong>으로 돌려주고, 구글은 쓴 물의 <strong>120%를 자연에 환원</strong>하겠다며 상수도 시설을
            지어 시에 넘겼다.
          </li>
          <li>
            <strong>반대로 망친 동네</strong> — 미국 네바다에선 전력회사가 “데이터센터 탓에 전기 모자란다”며
            주민 <strong>4만 9천 명</strong> 전력 공급을 끊겠다 통보, 조지아 페이엣빌은 용수 부족에 시달린다.
          </li>
          <li>
            <strong>한국의 힌트</strong> — 울산 SK는 계통에 기대지 않고 <strong>LNG 자가발전</strong>으로 전기를
            직접 만들고, 에너지경제연구원은 갈등이 덜한 <strong>호남·영남·강원</strong>을 적지로 꼽았다.
          </li>
        </ol>
        <p>
          <strong>결론 한 줄</strong> — 전력·토지에 더해 <strong>‘주민 수용성’이 네 번째 입지 축</strong>이다.
          어디에 짓느냐만큼 <strong>어떻게 짓고 무엇을 돌려주느냐</strong>가 사업의 성패를 가른다.
        </p>
      </div>

      <p>
        IT동아 남시현 기자의 「AI 데이터센터 지출 1천조 시대 — 사회는 AI보다 ‘공존의 기술’이 필요하다」(2026.5.15)는
        우리 맵이 놓치기 쉬운 축을 정면으로 다룬다. <Link to="/">AI InfraMap</Link>의 5축은 전력·토지·리스크·네트워크·
        기상 — 전부 <strong>물리적 공급</strong>이다. 그러나 물리적으로 완벽한 부지도 <strong>주민이 반대하면 못
        짓는다</strong>. 미국 데이터(고용·물·세수)로 “어디에·어떻게”를 논한{' '}
        <Link to="/insights/dc-local-impact">앞선 글</Link>의 국내판이자, 그 “어떻게”의 답을 공존의 기술에서 찾는
        글이다.
      </p>

      <h2>소통 없는 허가가 부른 무산 — 세종 어진동, 고양 덕이동</h2>
      <p>
        세종 어진동 데이터센터는 2024년 세종파이낸스센터 부지에 추진됐으나, <strong>반경 1km 내 3만여 세대</strong>
        주민이 설치 반대 비상대책위원회를 꾸렸다. 상업·업무시설과 뒤섞인 입지가 발화점이었다. 결국 투자사와 건물주의
        매매협상 결렬로 사업은 무산됐지만, “향후 조성 시 <strong>지역 사회와의 협의가 필요</strong>하다”는 교훈을
        남겼다. 고양 덕이동은 GS건설 계열 마그나PFV가 지하 2층·지상 5층 규모를 추진하며 <strong>주민 소통 없이
        건축 허가부터 받은</strong> 것이 사회적 파장을 불렀다. 두 사례 모두 전력·토지의 문제가 아니라 <strong>절차와
        소통의 문제</strong>로 멈췄다.
      </p>

      <h2>갈등의 진짜 축 — 그리고 전자파의 역설</h2>
      <p>
        주민이 우려하는 것은 전기요금 상승·용수 경합·소음·전자파, 그리고 “고용은 적은데 부담만 진다”는 저고용
        인식이다. 흥미로운 건 이 중 <strong>전자파</strong>다 — 과기정통부가 데이터센터 6곳을 실측한 결과 인체보호기준
        (ICNIRP)의 평균 <strong>0.4%</strong>로 병원(0.68%)·호텔(1.17%)보다도 낮았다(
        <Link to="/insights/rsquare-realestate-2025">알스퀘어 리포트</Link>). 그럼에도 사업이 철회된다는 사실이
        말해주는 것: 데이터센터 리스크축에서 <strong>민원은 과학이 아니라 신뢰의 문제</strong>이고, 실질 변수는
        인구 밀집지 인접 여부다. AI InfraMap이 지점 분석에서 <strong>인구 격자</strong>를 리스크축에 넣는 이유다.
      </p>

      <h2>공존의 기술 — 열을 돌려주고, 물을 되갚는다</h2>
      <p>
        해외는 갈등을 <strong>상생 설계</strong>로 푼 사례를 쌓았다. 덴마크 오덴세의 메타 데이터센터는 냉각에 쓴
        온수를 <strong>지역 난방</strong>으로 공급하고, 마이크로소프트도 핀란드 에스포에서 지역 난방에 기여해 인근의
        탄소 배출량을 약 <strong>40%</strong> 줄였다. 구글은 2030년까지 사용한 수자원의 <strong>120% 이상을 자연으로
        환원</strong>하는 목표를 내걸고, 어떤 지역에는 수십 년 쓸 상수도 시설을 지어 <strong>지하수 사용권까지 시에
        영구 이전</strong>했다. 데이터센터가 지역에서 <strong>가져가기만 하는 시설이 아니라 되돌려주는 시설</strong>이
        될 수 있음을 보여준 것이다.
      </p>

      <h2>반면교사 — 전력을 끊고, 물이 마른다</h2>
      <p>
        반대의 장면도 분명하다. 미국 네바다에서는 타호 호수 인근에 전력을 공급하던 회사가 데이터센터 부하를 이유로
        <strong> 이듬해 5월부터 전력 공급 중단</strong>을 통보했고, 지역 에너지 공급업체는 1년 안에 주민{' '}
        <strong>4만 9천 명</strong>의 전력원을 새로 찾아야 하는 처지가 됐다. 조지아주 페이엣빌에는 최대 16개 건물의
        데이터센터 단지가 들어서며 <strong>용수 공급 문제</strong>가 불거졌다. 공존의 기술을 설계하지 않은 개발이
        어떤 사회적 청구서를 남기는지 보여주는 경고다.
      </p>

      <h2>한국의 해법 신호 — 자가발전과 적지의 재배치</h2>
      <p>
        국내에도 갈등을 우회하는 설계가 나타난다. 울산 SK의 데이터센터는 필요 전력(연간 약 <strong>213GWh</strong>)을
        계통에 기대지 않고 <strong>LNG 열병합 자가발전</strong>으로 충당하며, 연 3만 톤 규모 LNG를 직수입한다 —
        수도권 계통 포화(<Link to="/insights/rsquare-realestate-2025">예비율 5%</Link>)를 비켜가는 한 방법이다.
        에너지경제연구원은 2024년 9월 「AI 시대 데이터센터 증가의 국내 에너지 소비 시사점」에서 국내 데이터센터를
        165개소(60% 수도권)로 집계하며, 전력·수용성 여건이 상대적으로 나은 <strong>호남·영남·강원</strong>을 적지로
        꼽았다. 비수도권 분산은 계통뿐 아니라 <Link to="/insights/landing-edge">갈등 총량까지 낮추는</Link> 선택이
        된다.
      </p>

      <h2>시사점 — 수용성은 네 번째 입지 축이다</h2>
      <p>
        요약하면: 물리적 공급(전력·토지)을 다 갖춰도 <strong>사회적 수용성</strong>이 없으면 사업은 멈춘다. 그리고
        수용성은 홍보가 아니라 <strong>설계</strong>의 문제다 — 열을 지역 난방으로, 물을 상수도로, 전력을 자가발전으로
        돌려주는 구조가 곧 리스크 관리다. AI InfraMap이 리스크축에 인구 격자·민원 이력을 얹고, 지도의{' '}
        <Link to="/data?tab=conflicts">개발 갈등 사례</Link>를 별도 관리하는 것은 이 “네 번째 축”을 정량화하기
        위해서다. IT동아의 명제대로, 1천조 시대에 정말 부족한 것은 AI가 아니라 <strong>공존의 기술</strong>일지
        모른다.
      </p>
    </>
  )
}
