// 시설 코멘트 — 상세카드의 2줄 해설 (콘텐츠 등급 ④참고·인사이트)
// 정직성: 큐레이션 코멘트는 시드 note·공개 보도로 확인되는 사실만 서술(수치 창작 금지).
// 큐레이션이 없는 시설은 시드 필드(유형·상태·연도·용량·입지)에서 자동 생성 — 새 사실을 만들지 않는다.
// i18n: 각 큐레이션 코멘트는 { ko, en } 병렬. EN 모드(mapLang)에서 en 사용, 지역·고유명사·수치는 KO/원문 유지.

export const FACILITY_BLURBS = {
  'kr-naver-gak-chuncheon': {
    ko: '국내 인터넷기업이 처음으로 직접 지은 데이터센터(2013). 조선왕조실록을 지킨 장경각에서 이름을 딴 "각(閣)"으로, 춘천의 서늘한 기후를 냉각에 끌어쓰는 친환경 설계의 국내 원조 격이다.',
    en: 'The first data center built in-house by a Korean internet company (2013). Named "Gak (閣)" after the Janggyeonggak that safeguarded the Annals of the Joseon Dynasty, it is Korea’s original example of eco-friendly design that harnesses Chuncheon’s cool climate for cooling.',
  },
  'kr-naver-gak-sejong': {
    ko: '각 춘천의 6배 규모로 지은 하이퍼스케일 2호(2023). 서버 운반 로봇·자동화 운영을 전면 도입했고, 최종 60만 유닛까지 단계 확장을 계획한 네이버 AI 인프라의 본진이다.',
    en: 'A hyperscale second site (2023) built six times the size of Gak Chuncheon. It fully adopted server-hauling robots and automated operations, and is the heart of Naver’s AI infrastructure, with phased expansion planned up to a final 600,000 units.',
  },
  'kr-kakao-ansan': {
    ko: '2022년 판교 화재로 전 국민급 서비스 장애를 겪은 카카오가 처음 지은 자체 센터(2024, 40MW). 전원·냉방·통신 전 계층 이중화를 전면에 내세운 설계로, 한양대 에리카캠퍼스 부지에 있다.',
    en: 'The first in-house center (2024, 40MW) built by Kakao after the 2022 Pangyo fire caused a nationwide service outage. Its design foregrounds full redundancy across power, cooling and network layers, and it sits on the Hanyang University ERICA campus site.',
  },
  'kr-skcc-pangyo': {
    ko: 'SK그룹 IT의 거점이자, 2022년 10월 화재로 입주해 있던 카카오 서비스가 마비된 바로 그 센터. 이 사고로 데이터센터 이중화·재해복구가 국가적 의제가 됐다.',
    en: 'The hub of SK Group IT — and the very center where an October 2022 fire paralyzed the Kakao services housed there. That incident turned data-center redundancy and disaster recovery into a national agenda.',
  },
  'kr-samsungsds-dongtan': {
    ko: '삼성SDS가 고성능컴퓨팅(HPC) 전용으로 설계해 지은 센터(2022). 고밀도 랙·GPU 워크로드를 전제로 한 국내 초기 사례로, AI 시대 전용 설계의 방향을 먼저 보여줬다.',
    en: 'A center designed and built by Samsung SDS specifically for high-performance computing (HPC) (2022). An early domestic case premised on high-density racks and GPU workloads, it foreshadowed the direction of purpose-built design for the AI era.',
  },
  'kr-samsungsds-chuncheon': {
    ko: '삼성SDS의 클라우드 특화 센터(2019). 네이버 각과 마찬가지로 춘천의 낮은 기온을 활용하는 입지 선택이 특징으로, "서늘한 지역 = 냉각 우위"라는 입지 공식의 사례다.',
    en: 'Samsung SDS’s cloud-focused center (2019). Like Naver’s Gak, it is defined by a siting choice that exploits Chuncheon’s low temperatures — a case of the "cool region = cooling advantage" location formula.',
  },
  'kr-lgcns-busan': {
    ko: '부산 미음산단의 글로벌 클라우드 허브(2013). 지진에 대비한 면진 설계를 국내에서 일찍 도입한 센터로, 해외 연결성(해저케이블 육양 근접)을 겨냥한 동남권 거점이다.',
    en: 'A global cloud hub in Busan’s Mieum industrial complex (2013). An early domestic adopter of seismic-isolation design, it is a southeastern-region hub aimed at overseas connectivity (proximity to submarine-cable landings).',
  },
  'kr-lguplus-pyeongchon': {
    ko: '개관 당시 아시아 최대급으로 불린 통신사 코로케이션 거점(2015). 안양 평촌의 전력·통신 인프라 집적을 기반으로 대형 고객사 상면 임대의 표준을 만든 센터다.',
    en: 'A telco colocation hub (2015) billed as one of Asia’s largest at opening. Built on the concentration of power and telecom infrastructure in Anyang’s Pyeongchon, it set the standard for large-scale colocation leasing.',
  },
  'kr-lguplus-pyeongchon2': {
    ko: '평촌메가센터 옆에 증설한 2호 센터(2023). 수도권 상면 부족 국면에서 기존 캠퍼스를 키우는 "증설 우위" 전략의 전형으로, 전력 인입을 이미 확보한 부지의 가치를 보여준다.',
    en: 'A second center (2023) expanded next to the Pyeongchon Mega Center. A textbook case of the "expansion advantage" strategy of growing an existing campus amid a capital-region colocation shortage, it shows the value of a site that has already secured power intake.',
  },
  'kr-kt-yongsan': {
    ko: '서울 최대급 도심형 IDC(2020). 도심 입지라 지연시간·접근성에서 유리한 대신 전력·부지 확장이 어려운, 도심형 데이터센터의 장단점을 모두 보여주는 사례다.',
    en: 'One of Seoul’s largest downtown IDCs (2020). Its urban location is advantageous for latency and access but constrained for power and site expansion — a case that shows both sides of the downtown data-center model.',
  },
  'kr-kt-mokdong': {
    ko: 'KT IDC의 전통 거점(1·2센터 캠퍼스). 금융·엔터프라이즈 고객 다수가 오래 자리 잡은 서울 서남권의 대표 상면으로, KT 클라우드 사업의 뿌리에 해당한다.',
    en: 'A traditional stronghold of KT IDC (the No.1·2 center campus). A flagship colocation site in southwestern Seoul where many finance and enterprise customers have long been based, it is the root of KT’s cloud business.',
  },
  'kr-nhn-pangyo': {
    ko: 'NHN이 판교에 세운 자체 클라우드 센터 TCC(2015). 게임·커머스 트래픽을 자체 인프라로 감당하기 위한 선택으로, 판교 IT 클러스터 집적의 한 축이다.',
    en: 'TCC (2015), NHN’s in-house cloud center in Pangyo. A choice to handle gaming and commerce traffic on its own infrastructure, it is one pillar of the Pangyo IT cluster.',
  },
  'kr-nhncloud-gwangju': {
    ko: '국내 최대급 공공 AI 연산 인프라(88.5PF급, 2023). 광주 첨단3지구에서 국가 AI 바우처·연구용 GPU를 공급하는 공공 컴퓨팅의 거점으로, 국가 AI컴퓨팅센터 유치 경쟁의 발판이 됐다.',
    en: 'One of Korea’s largest public AI compute facilities (88.5PF class, 2023). A hub of public computing that supplies national AI vouchers and research GPUs from Gwangju’s Cheomdan-3 district, it became a springboard in the contest to host the National AI Computing Center.',
  },
  'kr-equinix-sl1': {
    ko: '글로벌 최대 코로케이션·IX 사업자 에퀴닉스의 한국 1호 IBX(2019, 상암). 글로벌 클라우드·CDN 사업자들이 국내에 접속점을 여는 관문 역할을 한다.',
    en: 'The first Korean IBX (2019, Sangam) of Equinix, the world’s largest colocation and IX operator. It serves as the gateway through which global cloud and CDN providers open points of presence in Korea.',
  },
  'kr-digitalrealty-icn10': {
    ko: '글로벌 대형 코로케이션 사업자 디지털리얼티의 한국 1호(2022, 상암 DMC). 외국계 상면 사업자의 한국 진출 러시를 연 센터로, 수도권 상면 시장의 국제화를 상징한다.',
    en: 'The first Korean site (2022, Sangam DMC) of Digital Realty, a major global colocation operator. It opened the rush of foreign colocation providers into Korea and symbolizes the internationalization of the capital-region colocation market.',
  },
  'kr-digitaledge-sel2': {
    ko: '싱가포르계 디지털엣지의 대규모 캠퍼스형 코로케이션. 인천에서 수도권 대형 수요를 노리는 외국계 개발 모델로, 캠퍼스 단위 증설을 전제로 한 설계다.',
    en: 'A large campus-style colocation by Singapore-based Digital Edge. A foreign development model targeting large capital-region demand from Incheon, its design is premised on campus-scale expansion.',
  },
  'kr-hana-cheongna': {
    ko: '하나금융그룹의 통합 데이터센터(2017, 청라국제도시). 금융그룹 전산을 한 캠퍼스로 모은 사례로, 청라를 금융 데이터센터 클러스터로 만든 출발점이다.',
    en: 'Hana Financial Group’s integrated data center (2017, Cheongna International City). A case of consolidating a financial group’s IT onto a single campus, it was the starting point that made Cheongna a financial data-center cluster.',
  },
  'kr-koscom-yeouido': {
    ko: '증권 매매체결과 금융투자업계 전산을 떠받치는 여의도 특화 IDC. 거래소·증권사와의 물리적 근접성(초저지연)이 존재 이유인, 입지가 곧 성능인 시설이다.',
    en: 'A Yeouido-specialized IDC underpinning securities trade execution and the financial-investment industry’s IT. Physical proximity to the exchange and brokerages (ultra-low latency) is its reason for being — a facility where location is performance.',
  },
  'kr-douzone-chuncheon': {
    ko: '더존IT그룹 강촌캠퍼스 안에 지은 클라우드 센터(2011년 7월 개관). 춘천의 낮은 연평균 기온과 프리쿨링 공조로 냉방 전력을 크게 아끼는 초기 친환경 설계 사례로, 전력 이중화·자가발전을 갖췄다.',
    en: 'A cloud center (opened July 2011) built inside Douzone IT Group’s Gangchon campus. An early eco-friendly design that greatly saves cooling power through Chuncheon’s low annual-average temperatures and free-cooling HVAC, it is equipped with power redundancy and on-site generation.',
  },
  'kr-lguplus-paju-aidc': {
    ko: 'LG유플러스가 파주에 짓는 초대형 AI 전용 캠퍼스(목표 2027, 200MW). 단일 사업자 AIDC로는 국내 최대급 공개 규모로, 154kV급 전력 확보가 사업의 핵심 관문이다.',
    en: 'A mega-scale AI-dedicated campus (target 2027, 200MW) being built by LG Uplus in Paju. One of Korea’s largest publicly announced single-operator AIDCs, securing 154kV-class power is the project’s key gateway.',
  },
  'kr-skt-ulsan-aidc': {
    ko: 'SK텔레콤이 AWS와 함께 울산 미포국가산단에 짓는 AI 데이터센터(목표 2027, 100MW). 향후 GW급 확장 구상까지 보도된, 비수도권 산단+전력 상류 입지 전략의 대표 사례다.',
    en: 'An AI data center (target 2027, 100MW) that SK Telecom is building with AWS in Ulsan’s Mipo National Industrial Complex. With GW-scale expansion plans reported, it is a flagship case of the non-capital industrial-complex plus upstream-power siting strategy.',
  },
  'kr-solaseado-haenam': {
    ko: '전남 해남 솔라시도의 GW급(1,000MW) 구상. 국내 최대 태양광 단지와 붙여 재생에너지 직결(RE100)을 전제로 한 계획으로, "전력이 있는 곳으로 데이터센터가 간다"는 명제의 극단 사례다.',
    en: 'A GW-scale (1,000MW) plan at Solaseado in Haenam, South Jeolla. Sited next to Korea’s largest solar complex and premised on direct renewable connection (RE100), it is an extreme case of the thesis that "data centers go where the power is."',
  },
  'kr-chuncheon-suyeol': {
    ko: '소양강댐 심층 냉수를 냉각에 쓰는 수열에너지 기반 집적단지 구상. 냉방 전력을 구조적으로 줄이는 입지 자산(찬물)을 앞세워 강원권을 AI 데이터센터 거점으로 키우려는 프로젝트다.',
    en: 'A cluster plan based on hydrothermal energy that uses deep cold water from the Soyanggang Dam for cooling. Leading with a location asset (cold water) that structurally reduces cooling power, the project aims to grow the Gangwon region into an AI data-center hub.',
  },
  'kr-gwangju-national-ai': {
    ko: '민관 합작으로 추진되는 국가 AI컴퓨팅센터 — 공모를 거쳐 광주 입지가 유력하게 보도됐다. 국가 단위 GPU 인프라를 어디에 두느냐를 놓고 벌어진 지역 유치전의 결승점이다.',
    en: 'The National AI Computing Center, pursued as a public-private partnership — after an open call, Gwangju was reported as the leading site. It is the finish line of the regional hosting contest over where to place national-scale GPU infrastructure.',
  },
  'kr-microsoft-busan': {
    ko: '마이크로소프트가 부산 미음산단 일대에 부지를 확보했다고 보도된 프로젝트. 글로벌 클라우드의 리전급 투자로 읽히며, LG CNS 부산과 함께 동남권 클러스터 형성 신호다.',
    en: 'A project in which Microsoft is reported to have secured a site around Busan’s Mieum industrial complex. Read as a region-scale investment by a global cloud, it — together with LG CNS Busan — signals the formation of a southeastern cluster.',
  },
  'kr-kakao-siheung': {
    ko: '카카오가 서울대 시흥캠퍼스에 추진하다 재검토에 들어간 것으로 보도된 2호 센터. 대형 DC 계획이 부지·경제성·수요 변화에 따라 얼마나 유동적인지 보여주는 사례다.',
    en: 'A second center that Kakao was reported to be pursuing at Seoul National University’s Siheung campus before entering review. It shows how fluid large DC plans can be as site, economics and demand shift.',
  },
  'kr-anyang-gwanyang': {
    ko: '주민 반대 민원으로 보도된 수도권 개발형 DC의 대표 사례. 전자파·소음·경관 우려가 인허가를 흔드는 "사회적 수용성" 리스크를 상징한다 — 입지 평가에서 민원 축이 중요한 이유다.',
    en: 'A flagship case of a capital-region development-type DC reported over resident opposition. It symbolizes the "social acceptance" risk in which concerns over EMF, noise and views can shake permitting — the reason the complaints axis matters in siting assessment.',
  },
  'kr-yongin-gongse': {
    ko: '용인 공세동의 개발형 DC — 주민 민원 사례로 보도됐다. 수도권 주거 인접 부지에서 반복되는 갈등 패턴으로, 인구 밀집도가 입지 리스크로 작동하는 전형이다.',
    en: 'A development-type DC in Yongin’s Gongse-dong — reported as a resident-complaint case. A recurring conflict pattern on residential-adjacent capital-region sites, it is a classic example of population density acting as a siting risk.',
  },
  'kr-busan-ecodelta': {
    ko: '부산 에코델타시티의 집적단지 유치 협약 보도. 스마트시티 계획지구에 DC 클러스터를 묶는 모델로, 동남권(해저케이블·전력) 이점을 활용하려는 구상이다.',
    en: 'Reported agreement to attract a cluster to Busan’s Eco Delta City. A model of bundling a DC cluster into a smart-city planning district, it aims to leverage southeastern advantages (submarine cables, power).',
  },
  'kr-saemangeum-dc': {
    ko: '새만금 산단 투자협약으로 보도된 클러스터 구상. 대규모 재생에너지(태양광)와 넓은 산업용지를 앞세운 서해안형 입지 제안으로, 전력 상류형 개발 모델이다.',
    en: 'A cluster plan reported via an investment agreement at the Saemangeum industrial complex. A west-coast siting proposal led by large-scale renewables (solar) and ample industrial land, it is an upstream-power development model.',
  },
  'kr-gwangju-ai-phase2': {
    ko: '광주 국가 AI데이터센터의 확장(2단계) 보도. 1단계(88.5PF)의 수요 초과를 배경으로 한 공공 AI 인프라 증설로, 공공 GPU 수요의 성장 속도를 보여준다.',
    en: 'Reported expansion (phase 2) of Gwangju’s national AI data center. A public AI-infrastructure buildout against the backdrop of phase 1 (88.5PF) exceeding demand, it shows the growth pace of public GPU demand.',
  },
  'kr-naver-gak-sejong-phase2': {
    ko: '각 세종의 단계 확장 — 최종 60만 유닛 목표가 공개돼 있다. 하이퍼스케일 사업자가 캠퍼스형 부지를 미리 확보하고 수요에 맞춰 증설하는 표준 전략의 사례다.',
    en: 'The phased expansion of Gak Sejong — a final target of 600,000 units has been disclosed. A case of the standard hyperscale strategy of securing a campus-style site in advance and expanding to match demand.',
  },
}

const TYPE_DESC = {
  코로케이션: { ko: '상면·전력을 임대하는 코로케이션', en: 'space-and-power colocation' },
  클라우드: { ko: '클라우드 서비스용', en: 'cloud-service' },
  'AI 특화': { ko: 'AI·GPU 워크로드 특화', en: 'AI/GPU-workload' },
  엔터프라이즈: { ko: '자사·그룹 시스템을 위한 엔터프라이즈', en: 'enterprise (for in-house/group systems)' },
  금융: { ko: '금융 전산 특화', en: 'finance-IT' },
}

/** 큐레이션이 없을 때 — 시드 필드만으로 정직한 2줄 코멘트 생성(새 사실 창작 없음).
 *  KO 모드: KO 스캐폴딩 + KO 시드 산문 f.note 활용(종전과 동일, 비파괴).
 *  EN 모드: KO 자유 산문 f.note를 번역하지 않고, 구조화 필드(운영사·유형·지역·상태·용량·연도)만으로
 *           새 영어 문장을 합성한다. 지역·운영사·수치는 원문값 유지, 문장 골격만 영어. */
export function genBlurb(f, en = false) {
  return en ? genBlurbEn(f) : genBlurbKo(f)
}

// KO: 종전 동작 유지(시드 산문 f.note 노출).
function genBlurbKo(f) {
  const td = TYPE_DESC[f.type]
  const type = td?.ko ?? f.type ?? ''
  const loc = [f.sido, f.sigungu].filter(Boolean).join(' ')
  const first =
    f.status === 'operating'
      ? `${loc}에서 운영 중인 ${type} 시설${f.year ? ` (${f.year}년 가동)` : ''}.`
      : f.status === 'construction'
        ? `${loc}에 건설 중인 ${type} 시설${f.year ? ` — 목표 ${f.year}년` : ''}.`
        : `${loc}에 계획 단계인 ${type} 프로젝트.`
  const bits = []
  if (f.power_mw_public != null) bits.push(`공개 전력 규모 ${f.power_mw_public}MW`)
  if (f.note) bits.push(f.note)
  const second = bits.length ? `${bits.join(' · ')}.` : '공개된 세부 정보가 제한적인 시설로, 확인되는 사실만 표기한다.'
  return `${first} ${second}`
}

// EN: 구조 데이터로 자연스러운 영어 코멘트 합성(f.note 미사용 — 미번역 KO 누수 방지).
function genBlurbEn(f) {
  const td = TYPE_DESC[f.type]
  const type = td?.en ?? f.type ?? ''
  const loc = [f.sido, f.sigungu].filter(Boolean).join(' ')
  const inLoc = loc ? ` in ${loc}` : ''
  // 1문장: "{Operator}'s {type} data center in {region}." — 운영사가 있으면 주어로, 없으면 관사로.
  const noun = type ? `${type} data center` : 'data center'
  const first = f.operator ? `${f.operator}'s ${noun}${inLoc}.` : `A ${noun}${inLoc}.`
  // 2문장: 상태 + (연도·용량) 맥락. 있는 필드만 엮고, 없으면 상태만 서술.
  const mw = f.power_mw_public != null ? `${f.power_mw_public}MW of disclosed capacity` : null
  let second
  if (f.status === 'operating') {
    const parts = []
    if (f.year) parts.push(`since ${f.year}`)
    if (mw) parts.push(`with ${mw}`)
    second = `It has been operating${parts.length ? ' ' + parts.join(', ') : ''}.`
  } else if (f.status === 'construction') {
    const parts = []
    if (f.year) parts.push(`targeting ${f.year}`)
    if (mw) parts.push(`with ${mw}`)
    second = `It is under construction${parts.length ? ', ' + parts.join(', ') : ''}.`
  } else {
    second = `It is at the planning stage${mw ? `, with ${mw}` : ''}.`
  }
  return `${first} ${second}`
}

/** 시설 코멘트 — { text, curated } */
export function blurbFor(f, en = false) {
  const curated = FACILITY_BLURBS[f.id]
  if (curated) return { text: en ? curated.en ?? curated.ko : curated.ko, curated: true }
  return { text: genBlurb(f, en), curated: false }
}
