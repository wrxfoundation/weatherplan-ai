// 인사이트 아티클 메타 — 순수 상수 (프론트 라우팅 + postbuild 프리렌더 공유)
// 콘텐츠 등급: 데이터 아키텍처 4계층 중 ④참고·인사이트. 시설 데이터(dc_centers)와 분리 관리.
export const INSIGHTS = [
  {
    slug: 'ops-timing-2026',
    enTitle: 'Siting is the ticket, operations is the return — the timing & operating gates',
    en: 'Siting decides whether you CAN build; operations & timing decide whether it PAYS and WHEN it connects — the “Tier 3–4” external factors. Timing is a date, not a number: new grid capacity mostly reaches DCs only after 2030, a supply cliff looms around 2029, and a DC takes 3–5 years — so today’s headroom is really a calendar. Even after connection a saturated grid can impose re-dispatch (curtailment), and congested areas can be designated grid-management substations. Tariff drives the P&L: industrial (Type-Eul) time-of-use pricing (off-peak/mid/peak, seasonal) meets a peak-heavy AI load, and the Distributed Energy Act opens regional pricing. RE100/PPA annual matching ≠ 24-7 hourly carbon-free (CFE) — CBAM and hyperscaler ESG push toward hourly, changing bankability. Public/finance workloads carry CSAP and network-separation duties. Verified public patterns vs site-level assumptions are marked. Read with the siting-gates companion (external-gates-2026). Sources: Electric Times/KHARN, Shin & Kim & Chang newsletters, Distributed Energy Act/MOTIE, our own frame.',
    category: '전력·계통',
    title: '입지는 입장권, 운영이 수익률 — 데이터센터 운영·타이밍의 관문',
    description:
      '입지는 「지을 수 있나」를 정하고, 운영·타이밍은 「수지가 맞나·언제 붙나」를 정한다 — 5축 밖 ‘Tier 3·4’ 외부 요인. 타이밍은 숫자가 아니라 날짜다: 신규 계통 여유는 대부분 2030년 이후에야 DC에 닿고, 2029 공급절벽이 오며, DC 개발은 3~5년 — 지금의 계통여유는 사실 달력이다. 접속 뒤에도 포화 계통은 재급전(출력제한)을 부과할 수 있고, 혼잡지역은 계통관리변전소로 지정될 수 있다. 요금이 손익을 몬다: 산업용(을) 시간대별 요금(경부하·중간·최대·계절별)에 피크 편중 AI 부하가 얹히고, 분산에너지법이 지역별 요금을 연다. RE100/PPA 연간 매칭 ≠ 24-7 시간단위 무탄소(CFE) — CBAM·하이퍼스케일러 ESG가 시간단위로 밀며 파이낸싱 가능성을 바꾼다. 공공·금융 워크로드는 CSAP·망분리 의무를 진다. 검증된 공개 패턴 vs 부지별 가정을 구분 표기. 입지 관문 짝 글(external-gates-2026)과 함께 읽는다. 소스: 전기신문/KHARN·신·김앤장 뉴스레터·분산에너지법/산업부·자체 프레임.',
    date: '2026-07-17',
  },
  {
    slug: 'external-gates-2026',
    enTitle: 'Beyond the five axes — the external-environment gates that kill a datacenter',
    en: 'Our five axes only measure physical supply. What actually kills a datacenter lives outside them: legal exclusions, hidden hardware bottlenecks, and timing. Tier 0 kill switches (greenbelt, military-protection zones, airport height limits, water-source & heritage areas) make a high-scoring site un-buildable — a GO/NO-GO, not a deduction. Beyond PSIA there are more permit gates (energy-use consultation at ≥20 GWh/yr = every DC; EIA; and a newly proposed Seoul building-committee review). Hidden bottlenecks: 154kV transformers now take 2–4 years (30% shortage), and 1MW needs ~25.5M L/yr of water (~80% evaporated). And timing — new grid capacity mostly reaches DCs only after 2030 (a 2029 supply cliff). We’ll add a legal-exclusion overlay, a water axis, an equipment-lead-time tracker, and an actual-connection-timing note. Verified figures vs site-level GIS checks are marked. Sources: Seoul City Council, pv magazine/POWER, Energy Act decree, industry press.',
    category: '입지·토지',
    title: '5축 밖의 관문 — 데이터센터를 실제로 죽이는 외부환경 변수',
    description:
      '우리 5축(전력·토지·리스크·네트워크·기상)은 전부 ‘물리적 공급’만 잰다. 그런데 데이터센터를 실제로 죽이는 건 5축 밖에 있다 — 법적 배제, 숨은 하드웨어 병목, 타이밍. TIER 0 킬스위치(그린벨트·군사시설보호구역·공항 고도제한·상수원·문화재·접도)는 점수 높은 부지를 못 짓게 만든다 — 감점이 아니라 GO/NO-GO. PSIA 말고도 관문이 더 있다(에너지사용계획 협의 연 20GWh↑=사실상 모든 DC·환경영향평가·새로 추진되는 서울시 건축위 심의). 숨은 병목: 154kV 변압기 납기 2~4년(30% 부족), 1MW당 연 2,550만 L 용수(80% 증발). 그리고 타이밍 — 신규 계통 여유는 대부분 2030년 이후에야 DC에 닿고 2029 공급절벽이 온다. 우리가 넣을 것: 법적 배제 오버레이(6번째 판정)·용수 축·설비 리드타임 트래커·실접속 시점 표기. 검증 수치 vs 부지별 GIS 확인 대상을 구분 표기. 해외 툴이 안 하는 정직한 지도화. 소스: 서울시의회·pv magazine/POWER·에너지이용합리화법 시행령·산업 보도.',
    date: '2026-07-17',
  },
  {
    slug: 'build-reality-2026',
    enTitle: 'Can you build it, can you fill it — the 5 gates of a DC project',
    en: 'Finding good land is only the start. A Korean AI-datacenter project must clear five gates in order — site, grid connection, capital, GPU procurement & rack-spec fit, and utilization — and one blocked gate ends it. Capital-region PSIA approval is 1.9%; a fitted-out building can’t host next-gen GPUs if load/cooling specs are outdated; domestic GPU utilization is 30–40%. “Absorbable” datacenters do exist, but only those with pre-leased anchor tenants and current specs (AWS Incheon 650MW, Keppel Ansan). We quantify gates 1–2; gates 3–5 are market context. Site score is only the first gate. Sources: CBRE, PwC, R.square, IT Chosun.',
    category: '입지·토지',
    title: '지을 수 있나, 채울 수 있나 — 데이터센터 사업의 5관문',
    description:
      '좋은 땅을 찾는 건 시작일 뿐이다. DC 사업은 부지 확보 → 전력 수전 → 자금 조달 → GPU 조달·규격 적합 → 가동률(소화)이라는 5개 관문을 다 통과해야 하고, 하나라도 막히면 끝이다. 수도권 승인율 1.9%·수용성(관문1), 40MW 154kV 트랙·수도권 공급불가 53.4%·울산 SK 자가발전(관문2), 총사업비 1조·3~8년 Exit PF·매수자 풀 3분류(관문3), GPU 확보 경쟁+구형 설계면 최신 GPU 못 받는 물리적 진부화(하중 2.5톤·40~50kW·액랭, 관문4), 가동률 30~40%·선임차 없으면 빈다(관문5). “소화 가능한 데이터센터”는 실재하나? — 있다. 단 우량 앵커 선임차(88% 장기임차)+최신 규격을 갖춘 것만(AWS 인천 650MW·죽전 CSP 5개층·Keppel 안산). 투기적 소형은 4·5관문에서 걸린다. 우리가 정량화하는 건 관문1·2, 3·4·5는 시장 데이터로 맥락화 — 입지 점수는 5관문의 첫 관문일 뿐이다. 소스: CBRE·PwC·알스퀘어·IT조선 교차.',
    date: '2026-07-16',
  },
  {
    slug: 'dc-coexistence-2026',
    enTitle: 'The fourth siting axis: social acceptance — coexistence, not just AI',
    en: 'Social acceptance is the fourth siting axis. Even with power and land secured, community opposition can stop a project — Sejong Eojin-dong (30,000 households within 1km) and Goyang Deogi-dong (permits before consultation) both stalled on process, not physics. EMF measures below hospital levels (0.4% of ICNIRP) yet projects are withdrawn — permits are a trust problem, not a science one. Overseas, Meta Odense (waste heat → district heating), MS Espoo (−40% carbon), Google (120% water returned) turned conflict into coexistence, while Nevada Tahoe (49,000 residents’ power cut) and Georgia Fayetteville (water stress) are cautionary. Acceptance is design, not PR. Source: IT Donga (May 2026), KEEI.',
    category: '정책·인허가',
    title: '네 번째 입지 축, 수용성 — 1천조 시대에 정말 부족한 건 ‘공존의 기술’',
    description:
      'IT동아 「AI 데이터센터 지출 1천조 시대 — 사회는 AI보다 ‘공존의 기술’이 필요하다」(남시현, 2026.5.15)를 부지 인텔리전스로 번역한다. 전력·토지를 다 갖춰도 주민이 반대하면 못 짓는다 — 세종 어진동(반경 1km 3만여 세대)·고양 덕이동(소통 없는 허가)은 물리가 아니라 소통으로 멈췄다. 전자파는 실측 시 병원보다 낮은데(ICNIRP 0.4%)도 철회된다 — 민원은 과학이 아니라 신뢰의 문제. 반면 오덴세 메타(냉각열→지역난방)·MS 에스포(탄소 40%↓)·구글(수자원 120% 환원)은 갈등을 상생 설계로 풀었고, 네바다 타호(4.9만명 전력중단)·조지아 페이엣빌(용수 부족)은 반면교사다. 국내 힌트: 울산 SK LNG 자가발전(213GWh·계통 우회), 에경연 적지 호남·영남·강원. 수용성은 홍보가 아니라 설계이며 네 번째 입지 축이다. 1차 소스: IT동아(2026.5.15)·에너지경제연구원(2024.9).',
    date: '2026-07-16',
  },
  {
    slug: 'cbre-exit-scarcity-2026',
    enTitle: 'Cap-rate compression is over — scarcity premium & exit (CBRE)',
    en: 'Reading CBRE’s Korea datacenter report through a capital-markets lens. Demand is firm (1.4% vacancy, +70% rents since 2019, 88% anchor-leased) while supply is choked (1.9% PSIA approval, HVDC only useful post-2030). But Seoul cap-rate spread (~3.4pp) already matches ultra-low-rate Japan and is tighter than Singapore — further compression is over, so returns shift to NOI growth and obsolescence defense. Building lasts 30–40 yrs vs GPUs 2–3; Korea’s fully-fitted leases put re-capex risk on landlords. Buyer pool widens from domestic institutions to global infra funds to DC specialists (Keppel DC REIT, +6x in 10 yrs). Ansan DC is Korea’s first fund→REIT exit. Source: CBRE Research (Jul 2026).',
    category: '입지·토지',
    title: '캡레이트 압축은 끝났다 — CBRE로 읽는 데이터센터 희소성 프리미엄과 Exit',
    description:
      'CBRE 「한국 데이터센터 투자 — 공급 제약이 만드는 희소성 프리미엄과 Exit 가능성 진단」(2026.7, 45p)을 자본시장의 언어로 번역한다. 공실률 1.4%·상면임대료 25만원/kW(+70%)·우량 앵커 88% 장기임차의 견고한 수요 vs 전력계통영향평가 최종 승인율 1.9%·HVDC 2030년의 공급 절벽. 그러나 서울 캡레이트 5.3~6.5%는 이미 싱가포르와 동조화됐고 미국 DC 리츠 스프레드는 20년 최저(1.5~2%p) — 추가 매각차익은 끝나고 수익은 NOI 성장·진부화 방어로 이동한다. 건물 30~40년 vs GPU 2~3년(H100→블랙웰→루빈→파인만), Triple Net이 아닌 완전 설비형이라 재투자 리스크는 임대인 몫. 매수자 풀은 국내 기관(에포크 안양 8,400억)→글로벌 인프라(하남 7,340억)→글로벌 DC 전문자본(Keppel DC REIT 10년 6배, 한국 아태 허브 명시)으로 확대, 안산 DC(60MW·Keppel 펀드3호)가 한국형 펀드→REIT Exit의 첫 작동. AIDC 특별법 6개 특례는 비수도권 문턱을 낮춰 수도권 희소성을 오히려 공고화한다. 1차 소스: CBRE Research(2026.7).',
    date: '2026-07-16',
  },
  {
    slug: 'gpu-utilization-2026',
    enTitle: 'After 9,704 GPUs — what 30–40% utilization says about demand',
    en: 'The demand-side signal supply-only maps miss. Korea’s government is deploying 9,704 advanced GPUs (₩2.08tn) plus a ₩2.5tn national AI compute center — but the question flipped: is there demand to use it? 86% of firms running their own GPUs sit below 50% utilization; Korea is 30–40%. The tech (GPUaaS) exists but the repeat-use demand base is thin, losing to neoclouds (CoreWeave, Lambda, Crusoe). Implication for siting: the 7,343MW of grid applications is requested capacity, not operating load — the GPU calculator’s MW is peak design capacity, discounted again by utilization. Source: IT Chosun (Jul 14, 2026).',
    category: '정책·인허가',
    title: 'GPU 9,704장 그 다음 — 가동률 30~40%가 말하는 수요의 진실',
    description:
      '정부가 2조800억으로 첨단 GPU 9,704장(B300·베라루빈)을 깔고 2.5조 국가AI컴퓨팅센터까지 세운다. 그러나 시장의 질문이 뒤집혔다 — 이걸 쓸 수요는 있나? 벤처비트 리서치 573명 조사에서 자체 GPU 기업의 86%가 가동률 50% 이하, 국내는 30~40%. 기술(GPUaaS)은 갖췄지만 민간 수요층이 얇아 네오클라우드(코어위브·람다·크루소·네비우스)에 밀린다. 공급(부지·전력)만 보던 프레임에 수요를 얹으면: 전기사용신청 7,343MW는 신청 용량이지 가동 부하가 아니고, GPU 계산기의 MW는 설계 수전용량(피크)이라 가동률로 다시 할인된다. 1차 소스: IT조선(2026.7.14).',
    date: '2026-07-15',
  },
  {
    slug: 'rsquare-realestate-2025',
    enTitle: 'The permit cliff and the ₩734bn premium — DCs as real estate',
    en: 'Reading datacenters as real estate (R.square 2025 report). Permits collapsed from 25 (2023) to 10 (Sep 2025) — a 2027–28 supply cliff. Completed-asset prices jumped from ₩49bn (2018) to ₩734bn (Hanam) as scarcity got proven in transactions. Rent is repricing from per-rack (2.2kW) to per-kW as AI racks hit 30–60kW. EMF measures at 0.4% of ICNIRP (below hospitals) yet 8 projects were withdrawn — opposition is communication, not science. Capital-region reserve margin hit 5% (2024) — the grid’s answer to “can we build more here?”. Source: R.square Research Center.',
    category: '입지·토지',
    title: '인허가 절벽과 7,340억 프리미엄 — 부동산의 눈으로 본 데이터센터',
    description:
      '알스퀘어 「2025 Data Center Report」(2025.11)를 부지 인텔리전스로 번역한다. 인허가 25건(’23)→10건(’25.9) 급감은 2027~28년 공급 절벽의 예고편이고, 하남 7,340억·SK AX 판교 5,068억 거래는 완공 자산의 희소성 프리미엄을 실거래로 증명했다. Full 랙 2.2kW 기본전력과 AIDC 30~60kW/rack의 간극, 전자파 실측 ICNIRP 0.4%에도 철회되는 개발 사업 8건, 수도권 예비율 5% — 거래·임대료·갈등 데이터는 데이터 탐색기에 흡수 완료. 1차 소스: 알스퀘어 리서치센터.',
    date: '2026-07-15',
  },
  {
    slug: 'pwc-value-chain-2026',
    enTitle: 'A ₩10tn market, 1.56x excess demand — the AI-DC value chain (PwC)',
    en: 'PwC’s AI-DC value-chain report in map terms. Korea’s private DC market grows ₩2.42tn (2018) → ₩10.19tn (2028F), but 2027 grid applications (7,343MW) exceed KEPCO’s serveable 4,718MW by 1.56x. The gate tilted off the capital region: PSIA pass rates 21% (capital) vs 71% (non-capital); 83% of the 36 planned expansions are non-capital. Capital region still builds (AWS Incheon 650MW among 21 planned sites). Money flows to power/cooling infra and asset ownership; group bets include SK Ulsan (~₩7tn, AWS/OpenAI) and Hyundai Saemangeum (₩5.8tn). Source: PwC Korea (Mar 2026).',
    category: '입지·토지',
    title: '10조 시장, 1.56배 초과 수요 — 삼일PwC 리포트로 읽는 AI DC 밸류체인',
    description:
      '삼일PwC 「한국 AI 데이터센터 산업의 현재와 투자방향」(2026.3)을 부지 인텔리전스의 언어로 번역한다. 국내 민간 DC 시장 2.42조(’18)→10.19조(’28F), 2027년 전기사용신청 7,343MW vs 한전 공급가능 4,718MW(64%), 계통영향평가 통과율 수도권 21% vs 비수도권 71%(산업부 심사 33건), 증설 계획 36개 중 83% 비수도권 — 그리고 AWS 인천 650MW를 포함한 수도권 공급예정 21곳. 공급 측 5개 사업모델(EPC·Energy Infra·IT Infra·EaaS·Infra Owner)과 그룹사 베팅(SK 울산 7조·현대차 새만금 5.8조)까지. 핵심 데이터는 데이터 탐색기·대시보드에 흡수 완료. 1차 소스: 삼일PwC 공개 세미나 자료(2026.3).',
    date: '2026-07-15',
  },
  {
    slug: 'hyperscale-jukjeon',
    enTitle: 'Anatomy of a top-tier hyperscale — Jukjeon Pacific Sunny (100MW·PUE 1.3·Tier 3)',
    en: 'A layer-by-layer teardown of one of Korea’s largest colocations (100MW intake, 64MW IT, 100,000㎡, Hyundai E&C, 43 months). 154kV underground direct intake for power, PUE 1.3 (77% of power to servers) for cooling, Tier 3 redundancy with live line-cut commissioning for uptime, 2t/㎡ post-tension for structure. A case where Yongin’s capital-region PSIA penalty was outweighed by demand — five extra floors pre-leased by a global CSP (+15 months, +₩321.5bn). Source: Hyundai E&C.',
    category: '냉각·설비',
    title: '국내 최대급 하이퍼스케일 해부 — 용인 죽전 퍼시픽써니(100MW·PUE 1.3·TIER 3)',
    description:
      '수전 100MW·IT 64MW·연면적 10만㎡의 국내 최대급 코로케이션(현대건설, 43개월)을 한 채씩 뜯어본다. 154kV 지중 직접인입으로 전력을, PUE 1.3(전력의 77%가 서버로)으로 냉각 효율을, TIER 3 이중·삼중화와 라인 차단 시운전으로 무정전을, 1㎡당 2톤·포스트텐션으로 구조를 구현했다. 용인(수도권)의 계통영향평가 페널티를 글로벌 CSP 5개 층 추가 입주(15개월 연장·3,215억 증액)라는 수요가 이긴 사례. AI InfraMap의 5축(전력·냉각·안정성·규모·입지)과 완공 후 운영관리가 한 건물에서 어떻게 만나는지. 1차 소스: 현대건설 뉴스룸.',
    date: '2026-07-13',
  },
  {
    slug: 'power-water-mega-2026',
    enTitle: 'A ₩800tn chip plan, ₩1,000tn of AI DCs — moot without water and power',
    en: 'In June 2026 the government unveiled a ₩800tn Gwangju-Jeonnam semiconductor plan (6.3GW, 650,000 t/day industrial water) and ₩1,000tn of national AI datacenters by 2035 — but success converges on water and power. Yongin’s national complex is held up not by power/water but by 45% land compensation and an LH gap (power: 9.3GW with 3GW LNG self-supply in phase 1 + a 40km Bukcheonan line; water: a Han River twin-pipeline already fixed), while Honam’s RE100 hits the wall of 4-hour solar and ESS cost. Regional and DC-specific power tariffs are coming — an era where the electricity price decides siting. Source: Weekly Chosun 2915·2916.',
    category: '전력·계통',
    title: '800조 반도체·1,000조 AI DC — 물·전기 없으면 공염불',
    description:
      '2026.6.29 정부가 광주·전남 반도체 800조(6.3GW·하루 65만t 공업용수)와 전국 AI 데이터센터 1,000조(2035)를 발표했다. 그러나 성패는 물과 전기로 수렴한다. 용인 국가산단은 전력·용수가 아니라 토지보상 45%·LH 공백에 발목이 잡혔고(전력 9.3GW는 1단계 3GW LNG 자체조달+북천안 송전 40km, 용수는 한강수계 복선화 관로로 이미 확정), 호남의 RE100은 태양광 4시간·ESS 비용의 벽에 부딪힌다. 지역별·DC 전용 전기요금제가 예고되며 전기요금이 입지를 결정하는 시대가 열린다. AI InfraMap의 전력·용수 축으로 청사진을 부지 단위로 내린다. 1차 소스: 주간조선 2915·2916호.',
    date: '2026-07-13',
  },
  {
    slug: 'power-supply-chain',
    enTitle: 'From power plant to GPU — the AI datacenter electricity supply chain',
    en: 'Understand an AI datacenter in the order electricity flows. The external chain (plant → 765/345kV transmission → 154kV+ substation → DC intake) and the internal one (intake → UPS → cooling → GPU → network), laid out at once. Why the substation is the “last gate” for power, and why generation surplus (Incheon 165%) and connection reserve (5MW) can be opposites — linked to real data on 788 substations, grid headroom, and DC serve-ability (capital 46% vs non-capital 84%), mapped onto the 5-axis score.',
    category: '전력·계통',
    title: '발전에서 GPU까지 — AI 데이터센터 전력공급 사슬 전개도',
    description:
      '전기가 흐르는 순서로 AI 데이터센터를 이해한다. 발전소→765/345kV 송전→154kV+ 변전소→DC 수전이라는 외부 전력 사슬과, 완공 후 수전·UPS·냉각·GPU·네트워크로 이어지는 내부 가동원리를 한눈에 펼친다. 변전소가 왜 "전기를 받는 마지막 관문"인지, 왜 발전 잉여(인천 165%)와 접속 여유(5MW)가 정반대일 수 있는지 — 전국 변전소 788개·계통 공급여유·DC 공급 가능판정율(수도권 46% vs 비수도권 84%) 실데이터로 연결하고, AI InfraMap 스코어링 5축에 그대로 얹는다.',
    date: '2026-07-12',
  },
  {
    slug: 'landing-edge',
    enTitle: 'Capital-region grid saturation and the landing edge — why near cable landing stations',
    en: 'The capital region lacks not land but power — new transmission takes 7+ years. A “landing edge” architecture overlays upstream generation (non-capital) with the cable landing stations where international traffic arrives (Busan Songjeong, Geoje) — the logic of Marseille and Virginia Beach. The ±15-point rework, AIDC exemptions, and 86.5% of 2025 new generation concentrating in non-capital regions all point the same way.',
    category: '입지·토지',
    title: '수도권 계통 포화와 랜딩 에지 — 왜 해저케이블 육양국 인근인가',
    description:
      '수도권은 땅이 아니라 전기가 없어 데이터센터를 못 짓는다 — 신규 송변전 리드타임 7년+. 발전 상류(비수도권)와 국제 트래픽이 들어오는 육양국(부산 송정·거제)을 겹치는 "랜딩 에지" 아키텍처가 마르세유·버지니아 비치의 문법이다. ±15점 개편·AIDC 특별법 면제, 2025 신규 발전 86.5% 비수도권 집중까지 — 제도와 물리가 같은 방향을 가리킨다. AI InfraMap의 비수도권 필터·네트워크축·관문 프레임과 연결.',
    date: '2026-07-11',
  },
  {
    slug: 'market-2025h2',
    enTitle: '2H 2025 capital-region DC market & policy — the ±15-point PSIA era',
    en: 'Capital-region operating capacity 601MW (+16%), pipeline 921MW (+43%), other regions at 31% — decentralization accelerates. The Nov 2025 PSIA rework introduced up to ±15 location points, mandatory adequate voltage and a quantified self-generation duty; a September grid-expansion special act followed — location became the score. Source: Cushman & Wakefield / KDCC 2H 2025.',
    category: '정책·인허가',
    title: '2025 하반기 수도권 DC 시장·정책 — 계통영향평가 ±15점 시대',
    description:
      '수도권 운영 601MW(+16%)·파이프라인 921MW(+43%), 기타권역 비중 31%로 탈중심화 가속. 2025.11 계통영향평가 개편으로 입지별 최대 ±15점 가감점·적정전압 필수·자가발전 의무 정량화가 시행됐고, 9월 국가기간 전력망 확충 특별법까지 — 입지가 곧 점수가 됐다. 1차 소스: Cushman & Wakefield/KDCC 2H 2025.',
    date: '2026-07-11',
  },
  {
    slug: 'ocean-datacenter',
    enTitle: 'Why datacenters are moving to the sea — marine / subsea DCs',
    en: 'In May 2026 a 2,000-server undersea datacenter off Shanghai went live on direct offshore-wind power and seawater cooling; Peter Thiel put $140M into a floating DC. Onshore bottlenecks — grid delays, cooling-water shortage, site conflict — are turning the sea into AI infrastructure’s new frontier, solving power, cooling and siting at once. Source: KDCC/STRABASE (Jun 2026).',
    category: '냉각·설비',
    title: '데이터센터는 왜 바다로 이동하는가 — 해양/수중 DC',
    description:
      '2026년 5월 상하이 앞바다에서 수중 데이터센터 2,000서버가 해상풍력 직결·해수 냉각으로 가동, 피터 틸은 부유식 DC에 1.4억 달러를 태웠다. 전력망 지연·냉각수 부족·부지 갈등이라는 육상 병목이 바다를 AI 인프라의 새 전선으로 만든다 — 전력·냉각·입지를 한 번에 푸는 시도. 1차 소스: KDCC/STRABASE(2026.6.23).',
    date: '2026-07-11',
  },
  {
    slug: 'national-infrastructure',
    enTitle: 'When did datacenters become critical national infrastructure — security & geopolitics',
    en: 'In March 2026 an Iranian drone strike on AWS Bahrain/UAE turned cloud outages into a matter of war and geopolitics. Datacenters are being reclassified as strategic assets on par with the grid and ports, and siting shifts from power → location → resilience → national-trust competition — why subsea cables, multi-region and disaster recovery become new siting axes. Source: KDCC/STRABASE.',
    category: '안보·지정학',
    title: '데이터센터는 언제 국가 핵심 인프라가 되었나 — 안보·복원력·지정학',
    description:
      '2026년 3월 이란 드론 공격이 AWS 바레인·UAE를 때리며 클라우드 장애가 전쟁·지정학의 문제가 됐다. 데이터센터가 전력망·항만급 국가 전략 자산으로 재분류되고, 입지 평가는 전력 경쟁→입지→복원력→국가 신뢰도 경쟁으로 이동한다 — 해저 케이블·다중 리전·재해복구가 새 입지 축이 되는 이유. 1차 소스: KDCC/STRABASE.',
    date: '2026-07-11',
  },
  {
    slug: 'utility-acquisition',
    enTitle: 'Why datacenter firms are buying power companies — vertical integration',
    en: 'Global DC power demand doubles in two years — 31GW (2025) → 66GW (2027). DigitalBridge, Blackstone, KKR and Brookfield are buying power plants, developers and storage, dissolving the boundary between datacenters and energy. The capital-market response as competition moves from compute to power-supply capability — and where domestic vertical integration sits. Source: KDCC/STRABASE (Jul 2026).',
    category: '전력·계통',
    title: '데이터센터 기업은 왜 전력회사를 사들이는가 — 수직 통합',
    description:
      '글로벌 DC 전력 수요가 2025년 31GW에서 2027년 66GW로 2년 만에 두 배. DigitalBridge·Blackstone·KKR·Brookfield가 발전소·전력개발사·ESS까지 사들이며 데이터센터와 에너지 산업의 경계를 허문다. 경쟁의 중심이 컴퓨팅에서 전력 공급 능력으로 이동한 자본시장의 응답, 그리고 국내 수직 통합의 좌표. 1차 소스: KDCC/STRABASE(2026.7.7).',
    date: '2026-07-11',
  },
  {
    slug: 'orbital-bottleneck',
    enTitle: 'The datacenter that needs no power plant — SpaceX’s bet on the AI bottleneck',
    en: 'A large part of SpaceX’s $2tn day-one valuation was priced to orbital datacenters that don’t yet exist. The AI bottleneck has migrated GPU → power → grid → siting/cooling; the mismatch between US DC demand (41GW ≈ all its nuclear) and 4–10-year grid buildouts is why big tech became power developers — and how that right of way translates into siting in Korea. Source: KDDC Issue Focus (Jun 2026).',
    category: '전력·계통',
    title: '발전소가 필요 없는 데이터센터 — SpaceX가 산 ‘AI 병목 통행권’',
    description:
      'SpaceX가 상장 첫날 시총 2조 달러를 넘긴 베팅의 상당 부분은 아직 없는 궤도 데이터센터에 매겨졌다. AI 병목은 GPU→전력→전력망→입지·냉각으로 이동해왔다 — 미국 DC 41GW(≈전체 원전)·전력망 증설 4~10년의 속도 불일치가 빅테크를 발전사업자로 만든 이유, 그리고 그 통행권이 한반도에서 ‘입지’로 번역되는 방식. 1차 소스: KDDC Issue Focus(2026.6.16).',
    date: '2026-07-11',
  },
  {
    slug: 'cooling-platform-ma',
    enTitle: 'Liquid-cooling M&A — how cooling became the bottleneck after GPUs and power',
    en: 'Water-treatment firm Ecolab acquired liquid-cooling specialist CoolIT for $4.75B. The cooling battleground shifts from cold-plate/CDU hardware to integrated operating platforms combining water, chemistry and digital monitoring — from “how many chips did you secure” to “how densely and stably can you run them.” Why cooling is a siting problem of water, climate and contracted power. Source: KDDC Issue Focus (Jul 2026).',
    category: '냉각·설비',
    title: '액체냉각 M&A — 냉각이 GPU·전력 다음 병목이 되기까지',
    description:
      '수처리 기업 Ecolab이 액체냉각 전문 CoolIT를 47.5억 달러에 인수했다. 냉각 경쟁축이 냉각판·CDU 하드웨어에서 물·화학·디지털 모니터링을 결합한 통합 운영 플랫폼으로 이동한다 — “칩을 얼마나 확보했나”에서 “그 칩을 얼마나 높은 밀도로 안정 운영하나”로. 냉각이 용수·기상·전력의 입지 문제인 이유. 1차 소스: KDDC Issue Focus(2026.7.7).',
    date: '2026-07-11',
  },
  {
    slug: 'power-permit-battle',
    enTitle: 'Power and permits decide it — why a $100bn project was scrapped',
    en: 'Blackstone/QTS’s $100bn Virginia datacenter collapsed on procedural flaws and grid saturation. AI infrastructure is an industry of securing power, not servers — four investment signals (clean-energy share, transmission flexibility, rent, LCOE) and what Korea’s generation-permit ledger shows: 86.5% renewable, 86% non-capital pipeline. Source: Global Economic (Jul 2026) · generation-permit ledger v2.',
    category: '전력·계통',
    title: '전력·허가가 승부를 가른다 — 153조 프로젝트가 백지화된 이유',
    description:
      '블랙스톤 QTS의 1,000억 달러 버지니아 데이터센터가 절차 하자와 전력망 포화로 무산됐다. AI 인프라는 서버가 아니라 전력을 확보하는 산업 — 4대 투자 신호(청정E 확보율·송전망 유연성·임대료·LCOE)와, 한국 발전 허가대장이 보여주는 재생E 86.5%·비수도권 86% 파이프라인. 1차 소스: 글로벌이코노믹(2026.7.6)·발전사업 허가대장 v2.',
    date: '2026-07-11',
  },
  {
    slug: 'power-track-40mw',
    enTitle: 'The 40MW wall — datacenter intake-voltage tracks, fully mapped',
    en: 'One number decides voltage, fee and lead time. Under KEPCO tariff §23: up to 10MW uses 22.9kV; 10–40MW is 154kV in principle (22.9kV conditionally where a substation has reserve); above 40MW mandates 154kV. The intake-review fee jumps from ₩1.35M to ₩7.26M. So the required capacity — set by GPU count and PUE — routes the entire permitting path.',
    category: '전력·계통',
    title: '40MW의 벽 — 데이터센터 수전전압 트랙 완전 정리',
    description:
      '계약전력 1만kW(10MW)까지 22.9kV, 10~40MW는 154kV 원칙이나 변전소 여유 시 22.9kV 조건부, 40MW 초과 154kV 의무 — 필요 용량 하나가 전압·수수료(135만 vs 726만 원)·리드타임을 전부 결정한다. 한전 기본공급약관 제23조 기준 실무 정리.',
    date: '2026-07-11',
  },
  {
    slug: 'psia-exemption-2027',
    enTitle: 'PSIA and the 2027 non-capital exemption — reading the AIDC act',
    en: 'At ≥10MW a project falls under the Power System Impact Assessment, where the capital region is structurally disadvantaged by regional scoring. From Feb 2027 the AIDC special act opens an exemption for small non-capital AIDCs — but the threshold is delegated to a presidential decree (still undecided). Three practical scenarios, plus the 345kV information-disclosure variable.',
    category: '정책·인허가',
    title: '계통영향평가와 2027년 비수도권 면제 — AIDC 특별법 독법',
    description:
      '10MW 이상이면 전력계통영향평가 대상, 수도권은 지역 배점에서 구조적으로 불리 — 그리고 2027년 2월 비수도권 소형 AIDC 면제가 열린다. 기준선은 대통령령 위임(미정). 세 가지 실무 시나리오와 345kV 정보 공개 변수.',
    date: '2026-07-11',
  },
  {
    slug: 'gpu-to-mw',
    enTitle: 'How many MW is 10,000 GPUs — the calculator formula, disclosed',
    en: 'H100 0.7kW · GB200 1.2kW × 1.2 overhead × PUE — 10,000 GB200s ≈ 18.7MW. The GPU model chooses the intake track (10MW PSIA, 40MW 154kV). The AI InfraMap GPU calculator’s formula, disclosed in full.',
    category: '전력·계통',
    title: 'GPU 1만 장은 몇 MW인가 — 계산기 산식 공개',
    description:
      'H100 0.7kW·GB200 1.2kW × 오버헤드 1.2 × PUE — GB200 1만 장이면 약 18.7MW. 기종 선택이 수전 트랙(10MW 계통영향평가·40MW 154kV)을 바꾼다. AI InfraMap GPU 계산기의 산식을 그대로 공개한다.',
    date: '2026-07-11',
  },
  {
    slug: 'seoul-concentration',
    enTitle: 'The 60% capital-region share and the first cracks — Korea’s datacenter geography',
    en: '60% of Korea’s 165 datacenters sit in the capital region (KEEI 2024). But the large planned projects head to Haenam, Saemangeum, Pohang, Chuncheon and Ulsan — the “geography of plans” our 80-site seed reveals, and the real variables between plan and completion.',
    category: '입지·토지',
    title: '수도권 60%와 균열의 시작 — 한국 데이터센터의 지리',
    description:
      '국내 데이터센터 165개소의 60%가 수도권(KEEI 2024). 그러나 계획 단계 대형 프로젝트는 해남·새만금·포항·춘천·울산으로 — AI InfraMap 시드 80곳이 보여주는 "계획의 지리"와 준공까지의 진짜 변수.',
    date: '2026-07-11',
  },
  {
    slug: 'land-pulse-methodology',
    enTitle: 'Do land prices move when a datacenter arrives — the LAND PULSE method',
    en: 'We began tracking monthly land-price change across 35 DC-siting municipalities and 539 survey zones. Yongsan +0.577%, Haenam Bugil-myeon −0.183% — but why we don’t yet claim causation, and why an event-to-land-price aligned time series becomes a moat. Source: KOSIS · Korea Real Estate Board (May 2026).',
    category: '입지·토지',
    title: '데이터센터가 들어서면 땅값이 움직일까 — LAND PULSE 방법론',
    description:
      '전국 DC 입지 시군구 35곳·읍면동 조사구역 539개의 월간 지가변동률 추적을 시작했다. 용산 +0.577%, 해남 북일면 -0.183% — 그러나 아직 인과를 주장하지 않는 이유와, 이벤트-지가 정렬 시계열이 해자가 되는 이유. 1차 출처: KOSIS·한국부동산원(2026.05).',
    date: '2026-07-11',
  },
  {
    slug: 'liquid-cooling-brief',
    enTitle: 'The shift to liquid cooling — the siting equation of the 2kW-GPU era',
    en: 'GPU TDPs of 1,500–2,000W are the limit of single-phase direct-to-chip cooling. Going two-phase changes flow from 1.5 to 0.3 L/min per kW, and the cooling-components market heads to $14.9B by 2030 — how a cooling generation-change rewrites the siting equation of water, climate and contracted power. Source: OCP webinar (Parker Hannifin, Jun 2025).',
    category: '냉각·설비',
    title: '액체냉각으로의 전환 — GPU 2kW 시대의 입지 방정식',
    description:
      'GPU TDP 1,500~2,000W는 단상 직접칩냉각의 한계선. 2상 전환은 1kW당 유량을 1.5→0.3L/min으로 바꾸고, 냉각 부품 시장은 2030년 149억 달러로 간다 — 냉각 세대교체가 용수·기상·계약전력의 입지 방정식을 다시 쓰는 방법. 출처: OCP 공개 웨비나(Parker Hannifin, 2025.6).',
    date: '2026-07-11',
  },
  {
    slug: 'mega-project-aidc',
    enTitle: 'Three mega-projects and AI datacenters — an 8.4GW map',
    en: 'SK 5GW · GS 2.4GW · Naver 1GW, ₩550tn — the AI-datacenter track of the government’s three mega-projects and how the AIDC special act (non-capital PSIA exemption) reshapes Korea’s DC siting map. Source: MOTIE briefing (Jun 29, 2026).',
    category: '정책·인허가',
    title: '3대 메가프로젝트와 AI 데이터센터 — 8.4GW의 지도',
    description:
      'SK 5GW·GS 2.4GW·네이버 1GW, 550조 원 — 정부 3대 메가프로젝트의 AI 데이터센터 트랙과 AIDC 특별법(비수도권 계통영향평가 면제)이 바꾸는 한국 데이터센터 입지 지형. 1차 출처: 산업부 참고자료(2026.6.29).',
    date: '2026-07-10',
  },
  {
    slug: 'dc-local-impact',
    enTitle: 'What datacenters leave behind locally — a US fact sheet',
    en: 'Employment +4–5%, information-sector jobs +22%, half of a county’s property tax — and the truth about the water and power burden. The facts of the datacenter-siting debate, seen through US data. The question isn’t “whether to build” but “where and how.”',
    category: '입지·토지',
    title: '데이터센터는 지역에 무엇을 남기나 — 미국 사례 팩트 시트',
    description:
      '고용 +4~5%, 정보산업 고용 +22%, 카운티 재산세의 절반 — 그리고 물·전력 부담의 진실. 미국 데이터로 보는 데이터센터 유치 논쟁의 팩트. 질문은 "지을 것인가"가 아니라 "어디에, 어떻게"다.',
    date: '2026-07-10',
  },
]
