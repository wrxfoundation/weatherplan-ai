import { Link } from 'react-router-dom'
import { useMapLang } from '../../i18n/mapLang.js'

/* 콘텐츠 등급 ④참고·인사이트(보도 종합) — 수요측 신호. 공급(부지·전력)만 보던 프레임에 수요를 얹는다. */
export default function GpuUtilization() {
  const en = useMapLang() === 'en'
  return en ? (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3-minute easy read</p>
        <p className="tldr-one">
          "The government installed a mountain of GPUs — but the question of whether there's demand to actually
          use them has been flipped. A piece that layers demand onto a board that only looked at supply."
        </p>
        <ol>
          <li>
            <strong>What the government installed</strong> — 2.08 trillion won for <strong>9,704</strong> cutting-edge
            GPUs (B300, Vera Rubin), plus a 2.5-trillion-won National AI Computing Center. Domestic AI compute
            resources are growing fast.
          </li>
          <li>
            <strong>But utilization is 30–40%</strong> — once training is done, the amount needed scales with
            actual usage. In one survey, <strong>86% of companies running their own GPUs were below 50%
            utilization</strong>; in Korea it's <strong>30–40%</strong>.
          </li>
          <li>
            <strong>The tech exists, but the demand base is thin</strong> — Korean CSPs have the GPUaaS
            technology, yet AI companies use neoclouds (CoreWeave, Lambda, Crusoe) more. "Securing capacity and{' '}
            <strong>repeated use</strong> are different problems."
          </li>
          <li>
            <strong>So what does it mean for sites?</strong> — the 7,343 MW of power applications is a{' '}
            <strong>requested capacity, not an operating load</strong>. At 30–40% utilization, actual early-stage
            power demand can materialize below the contract.
          </li>
        </ol>
        <p>
          <strong>The one-line takeaway</strong> — the MW in the <Link to="/calc">GPU calculator</Link> is a{' '}
          <strong>design intake capacity (peak)</strong>, so it gets discounted again by utilization. That's why
          those of us reading supply never forget this 30–40% of demand.
        </p>
      </div>

      <p>
        When we discuss AI data centers we always look at <strong>supply</strong> — is there land, does power
        arrive, will the grid accept it?{' '}
        <Link to="/">AI InfraMap</Link>'s five axes are all supply-side too. But in the summer of 2026, the
        market's question got flipped.{' '}
        <strong>"We've installed this many GPUs — is there demand to use them?"</strong> This piece relays that
        demand-side signal honestly.
      </p>

      <h2>The 9,704 GPUs the government installed</h2>
      <p>
        In June 2026, the Ministry of Science and ICT selected Naver Cloud, Samsung SDS, and Elice Group as
        operators for a <strong>2.08-trillion-won</strong> GPU program. Securing <strong>9,704 cutting-edge GPUs,
        including NVIDIA's B300 and Vera Rubin</strong>, it will roll out services sequentially, from the B300
        this year to Vera Rubin in the first half of 2027. Add the <strong>2.5-trillion-won National AI Computing
        Center</strong>, and domestic AI compute resources are growing rapidly. This capacity goes into proprietary
        foundation models, national AI projects, and industry-academia-research development, with some commercialized
        by CSPs as GPUaaS (GPU-as-a-Service).
      </p>

      <h2>The problem is after training — utilization of 30–40%</h2>
      <p>
        When <strong>first training</strong> a large model, hundreds to thousands of GPUs are committed intensively
        for a while. That's why the government pushed GPU adoption. But once training ends, only retraining,
        fine-tuning, and inference remain, and the amount needed then scales with{' '}
        <strong>actual service usage</strong>. If the user base is thin, the cluster switched on for training can't
        keep running — some GPUs are left idle.
      </p>
      <p>
        The numbers back this up. A VentureBeat Research survey of 573 technology leaders at companies with more
        than 100 employees worldwide found that <strong>86% of firms operating their own GPUs were below 50%
        utilization</strong>. Korea is lower still, reportedly around <strong>30–40% utilization</strong>. "Securing
        GPUs and turning them into a service that developers keep using are completely different problems" is the
        industry's cold assessment.
      </p>

      <h2>The tech exists, but the demand base is thin — the neocloud assault</h2>
      <p>
        Korean CSPs (Naver Cloud, NHN Cloud, KT Cloud, Kakao Enterprise) <strong>already have the technology</strong>
        for GPUaaS, which pools GPUs and allocates them by the duration and scale needed. The problem is choice:
        whether AI companies and developers will repeatedly use domestic offerings over global CSPs or{' '}
        <strong>neoclouds (CoreWeave, Lambda, Crusoe, Nebius)</strong>. Neoclouds don't just rent out GPUs — they
        bundle high-speed networking, storage, and development environments to sell a continuous experience where you
        "start training the moment you get access, scaling from small experiments to large-scale distributed
        training." This is exactly where Korean CSPs concede they "have the fundamentals but lack developer-grade
        convenience and continuity."
      </p>

      <h2>Why site intelligence must watch this signal</h2>
      <p>
        The demand-side signal is a <strong>reality anchor</strong> for supply planning. First, the power demand the
        DC boom foreshadows (<Link to="/insights/pwc-value-chain-2026">7,343 MW of 2027 power-use applications</Link>)
        is a <strong>requested capacity</strong>, not an <strong>operating load</strong>. If 30–40% utilization is the
        reality, actual early power demand can materialize below the intake contract, which leaves slack in how we read
        grid headroom. Second, idle GPUs mean the weight is shifting toward <strong>inference</strong> — and inference,
        where user proximity and latency matter, changes the <Link to="/insights/landing-edge">grammar of location
        (landing edge)</Link>. Third, the criticism that investment pours only into GPUs and buildings while operating
        software takes a back seat is a signal that, after completion, <strong>operational efficiency (PUE,
        utilization)</strong> divides asset value as much as location does.
      </p>
      <p>
        So remember that the MW output of the <Link to="/calc">GPU calculator</Link> is a{' '}
        <strong>design intake capacity</strong> (on a peak basis). Actual annual load gets discounted again by
        utilization — that's why those of us reading supply never forget this 30–40% of demand.
      </p>
    </>
  ) : (
    <>
      <div className="tldr">
        <p className="tldr-kicker">⚡ 3분 쉽게 읽기</p>
        <p className="tldr-one">
          “정부가 GPU를 잔뜩 깔았는데, 정작 그걸 쓸 수요가 있냐는 질문이 뒤집혔다 — 공급만 보던 판에 수요를
          얹는 글.”
        </p>
        <ol>
          <li>
            <strong>정부가 깐 물량</strong> — 2조800억으로 첨단 GPU <strong>9,704장</strong>(B300·베라루빈),
            2.5조 국가AI컴퓨팅센터까지. 국내 AI 연산 자원이 빠르게 는다.
          </li>
          <li>
            <strong>그런데 가동률 30~40%</strong> — 학습이 끝나면 필요량은 실제 이용량에 비례한다. 조사에서 자체
            GPU 기업의 <strong>86%가 가동률 50% 이하</strong>, 국내는 <strong>30~40%</strong>.
          </li>
          <li>
            <strong>기술은 있는데 수요층이 얇다</strong> — 국내 CSP는 GPUaaS 기술을 갖췄지만, AI 기업들이
            네오클라우드(코어위브·람다·크루소)를 더 쓴다. “확보와 <strong>반복 사용</strong>은 다른 문제”.
          </li>
          <li>
            <strong>그래서 부지엔?</strong> — 전기 신청 7,343MW는 <strong>신청 용량이지 가동 부하가 아니다</strong>.
            가동률 30~40%면 초기 실제 전력 수요는 계약보다 낮게 실현될 수 있다.
          </li>
        </ol>
        <p>
          <strong>결론 한 줄</strong> — <Link to="/calc">GPU 계산기</Link>의 MW는 <strong>설계 수전용량(피크)</strong>이라
          가동률로 다시 할인된다. 공급을 읽는 우리가 수요의 이 30~40%를 잊지 않는 이유다.
        </p>
      </div>

      <p>
        AI 데이터센터를 논할 때 우리는 늘 <strong>공급</strong>을 본다 — 땅이 있나, 전기가 오나, 계통이 받아주나.{' '}
        <Link to="/">AI InfraMap</Link>의 5축도 전부 공급측이다. 그런데 2026년 여름, 시장의 질문이 하나 뒤집혔다.{' '}
        <strong>“GPU를 이만큼 깔았는데, 그걸 쓸 수요는 있나?”</strong> 이 글은 그 수요측 신호를 정직하게 옮긴다.
      </p>

      <h2>정부가 깐 GPU 9,704장</h2>
      <p>
        과학기술정보통신부는 2026년 6월 <strong>2조800억원</strong> 규모 GPU 사업 사업자로 네이버클라우드·삼성SDS·엘리스그룹을
        선정했다. 엔비디아 <strong>B300과 베라루빈 등 첨단 GPU 9,704장</strong>을 확보해 올해 B300부터 2027년 상반기
        베라루빈까지 순차 서비스한다. 여기에 <strong>2조5,000억원 규모 국가AI컴퓨팅센터</strong>까지 더해지며 국내 AI 연산
        자원은 빠르게 늘어난다. 이 물량은 독자 파운데이션 모델·국가 AI 프로젝트·산학연 개발에 투입되고, 일부는 CSP가
        GPUaaS(서비스형 GPU)로 상품화한다.
      </p>

      <h2>학습이 끝난 뒤가 문제 — 가동률 30~40%</h2>
      <p>
        대규모 모델을 <strong>처음 학습</strong>할 때는 수백~수천 장이 한동안 집중 투입된다. 정부가 GPU 도입을 밀어붙인
        이유다. 그러나 학습이 끝나면 재학습·미세조정·추론만 남고, 이때 필요한 양은 <strong>실제 서비스 이용량</strong>에
        비례한다. 이용자가 얇으면 학습 때 켰던 클러스터를 계속 돌릴 수 없다 — 일부 GPU가 유휴 자원으로 남는다.
      </p>
      <p>
        수치가 이를 뒷받침한다. 벤처비트 리서치가 전 세계 100인 이상 기업 기술책임자 573명을 조사한 결과, 자체 GPU 운영
        기업의 <strong>86%가 가동률 50% 이하</strong>였다. 국내는 더 낮아 <strong>사용률 30~40%</strong> 수준으로 알려졌다.
        “GPU를 확보하는 것과, 개발자가 계속 이용하는 서비스로 만드는 것은 완전히 다른 문제”라는 게 업계의 냉정한 평가다.
      </p>

      <h2>기술은 있는데 수요층이 얇다 — 네오클라우드의 습격</h2>
      <p>
        국내 CSP(네이버클라우드·NHN클라우드·KT클라우드·카카오엔터프라이즈)는 GPU를 하나의 풀로 묶어 필요 기간·규모만큼
        배분하는 GPUaaS를 <strong>이미 기술적으로 갖췄다</strong>. 문제는 선택이다. AI 기업·개발자가 글로벌 CSP나{' '}
        <strong>네오클라우드(코어위브·람다·크루소·네비우스)</strong>를 두고 국산을 반복 사용하느냐다. 네오클라우드는 GPU를
        빌려주는 데 그치지 않고 고속 네트워크·스토리지·개발환경을 묶어 “받자마자 학습 시작, 소규모 실험에서 대규모 분산학습까지
        확장”되는 연속 경험을 판다. 국내 CSP가 “기본기는 있지만 개발자 기준 편의성·연속성이 부족하다”고 자평하는 지점이다.
      </p>

      <h2>왜 부지 인텔리전스가 이 신호를 봐야 하나</h2>
      <p>
        수요측 신호는 공급 계획의 <strong>현실 앵커</strong>다. 첫째, DC 붐이 예고하는 전력 수요(<Link to="/insights/pwc-value-chain-2026">2027년 전기사용신청 7,343MW</Link>)는
        <strong>신청 용량</strong>이지 <strong>가동 부하</strong>가 아니다. 가동률 30~40%가 현실이면 초기 실제 전력 수요는
        수전 계약보다 낮게 실현될 수 있고, 이는 계통 여유 해석에 여백을 준다. 둘째, GPU 유휴는 <strong>추론(inference) 중심</strong>으로
        무게가 옮겨간다는 뜻 — 추론은 사용자 근접·지연이 중요해 <Link to="/insights/landing-edge">입지 문법(랜딩 에지)</Link>을 바꾼다.
        셋째, 투자가 GPU·건물에만 쏠리고 운영 소프트웨어가 뒷전이라는 지적은, 완공 후 <strong>운영 효율(PUE·가동률)</strong>이
        입지만큼 자산가치를 가른다는 신호다.
      </p>
      <p>
        그래서 <Link to="/calc">GPU 계산기</Link>의 MW 산출은 <strong>설계 수전용량</strong>(피크 기준)이라는 점을 기억해야 한다.
        실제 연간 부하는 가동률로 다시 할인된다 — 공급을 읽는 우리가, 수요의 이 30~40%를 잊지 않는 이유다.
      </p>
    </>
  )
}
