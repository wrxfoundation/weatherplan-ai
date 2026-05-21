/* ============================================================
 * Weather Plan AI · /onboarding (v2 — QA 반영)
 *
 * v2 변경 (QA 반영):
 * - C3: sticky bottom 네비게이션 (모바일 다음 버튼 항상 가시)
 * - M4: Step 1 5필드 → 2 step 분할 (기본 정보 / 사업 디테일)
 * - M5: 위치 자유 입력 → 17개 시·도 select + 시·군·구 select
 * - M6: 매체별 채널 다른 입찰률 (페르소나·업종·시즌 기반)
 * - m4: 진행률 dot + step name 표시
 * - 추천 채널 자동 선택 (페르소나 기반)
 *
 * 라우팅: /onboarding (Next.js·React Router 동일)
 * ============================================================ */

import React, { useState, useMemo } from "react";

/* ─── 디자인 토큰 ─── */
const T = {
  canvas: "#FFFFFF", surface: "#F7F5EE", surfaceSoft: "#FAF8F2",
  ink: "#050038", ink4: "rgba(5,0,56,0.4)", charcoal: "#1A1A1A",
  slate: "#4F5460", steel: "#7B7F8C", muted: "#9CA3AF",
  hairline: "rgba(5,0,56,0.12)", hairlineSoft: "rgba(5,0,56,0.08)",
  brandTeal: "#4EB3A8", mossDark: "#14443B", brandBlue: "#4262FF",
  tealLight: "#D7F2EE", onPrimary: "#FFFFFF", primary: "#050038",
};
const R = { sm: 8, md: 10, lg: 12, xl: 16, xxl: 20, xxxl: 24, full: 9999 };

/* ─── 17개 시·도 + 주요 시·군·구 ─── */
const REGIONS = {
  "서울특별시":     ["강남구","서초구","송파구","강동구","성동구","광진구","동대문구","중랑구","성북구","강북구","도봉구","노원구","은평구","서대문구","마포구","양천구","강서구","구로구","금천구","영등포구","동작구","관악구","용산구","중구","종로구"],
  "부산광역시":     ["중구","서구","동구","영도구","부산진구","동래구","남구","북구","해운대구","사하구","금정구","강서구","연제구","수영구","사상구","기장군"],
  "대구광역시":     ["중구","동구","서구","남구","북구","수성구","달서구","달성군","군위군"],
  "인천광역시":     ["중구","동구","미추홀구","연수구","남동구","부평구","계양구","서구","강화군","옹진군"],
  "광주광역시":     ["동구","서구","남구","북구","광산구"],
  "대전광역시":     ["동구","중구","서구","유성구","대덕구"],
  "울산광역시":     ["중구","남구","동구","북구","울주군"],
  "세종특별자치시": ["세종시"],
  "경기도":         ["수원시","용인시","고양시","성남시","부천시","안산시","남양주시","안양시","화성시","평택시","의정부시","시흥시","파주시","김포시","광명시","광주시","군포시","오산시","이천시","양주시","구리시","안성시","포천시","의왕시","하남시","여주시","양평군","동두천시","과천시","가평군","연천군"],
  "강원특별자치도": ["춘천시","원주시","강릉시","동해시","태백시","속초시","삼척시","홍천군","횡성군","영월군","평창군","정선군","철원군","화천군","양구군","인제군","고성군","양양군"],
  "충청북도":       ["청주시","충주시","제천시","보은군","옥천군","영동군","증평군","진천군","괴산군","음성군","단양군"],
  "충청남도":       ["천안시","공주시","보령시","아산시","서산시","논산시","계룡시","당진시","금산군","부여군","서천군","청양군","홍성군","예산군","태안군"],
  "전북특별자치도": ["전주시","군산시","익산시","정읍시","남원시","김제시","완주군","진안군","무주군","장수군","임실군","순창군","고창군","부안군"],
  "전라남도":       ["목포시","여수시","순천시","나주시","광양시","담양군","곡성군","구례군","고흥군","보성군","화순군","장흥군","강진군","해남군","영암군","무안군","함평군","영광군","장성군","완도군","진도군","신안군"],
  "경상북도":       ["포항시","경주시","김천시","안동시","구미시","영주시","영천시","상주시","문경시","경산시","의성군","청송군","영양군","영덕군","청도군","고령군","성주군","칠곡군","예천군","봉화군","울진군","울릉군"],
  "경상남도":       ["창원시","진주시","통영시","사천시","김해시","밀양시","거제시","양산시","의령군","함안군","창녕군","고성군","남해군","하동군","산청군","함양군","거창군","합천군"],
  "제주특별자치도": ["제주시","서귀포시"],
};

const INDUSTRIES = [
  { id: "fashion",   label: "패션·의류",       icon: "👕" },
  { id: "beauty",    label: "뷰티·H&B",        icon: "💄" },
  { id: "beverage",  label: "음료·주류",       icon: "🍷" },
  { id: "retail",    label: "리테일·이커머스", icon: "🛒" },
  { id: "auto",      label: "자동차",          icon: "🚗" },
  { id: "health",    label: "헬스·OTC",        icon: "💊" },
  { id: "home",      label: "홈·인테리어",     icon: "🏠" },
  { id: "appliance", label: "가전",            icon: "🔌" },
  { id: "sleep",     label: "수면·침구",       icon: "🛏️" },
  { id: "food",      label: "식음·외식",       icon: "🍽️" },
  { id: "travel",    label: "여행·DOOH",       icon: "✈️" },
  { id: "outdoor",   label: "아웃도어",        icon: "⛰️" },
  { id: "finance",   label: "금융·보험",       icon: "💰" },
  { id: "edu",       label: "교육·구독",       icon: "📚" },
  { id: "ent",       label: "엔터·콘텐츠",     icon: "🎬" },
  { id: "telco",     label: "통신·구독",       icon: "📱" },
  { id: "pet",       label: "반려·펫",          icon: "🐶" },
  { id: "solo",      label: "1인 가구·솔로",   icon: "🏘️" },
];

const AD_CHANNELS = [
  { id: "meta",      label: "메타 (인스타·페북)", desc: "릴스·스토리·피드" },
  { id: "google",    label: "구글 광고",          desc: "검색·디스플레이·유튜브" },
  { id: "naver",     label: "네이버 검색·GFA",    desc: "파워링크·쇼핑·디스플레이" },
  { id: "kakao",     label: "카카오 모먼트",      desc: "비즈보드·디스플레이" },
  { id: "coupang",   label: "쿠팡 광고",          desc: "상품 광고·검색" },
  { id: "tiktok",    label: "TikTok Ads",         desc: "인피드·해시태그" },
  { id: "dooh",      label: "DOOH",               desc: "옥외 디지털 광고" },
  { id: "youtube",   label: "YouTube Ads",        desc: "인스트림·디스커버리" },
];

const PERSONAS = [
  { id: "soloprenuer", label: "1인 사장님·자영업", desc: "매장 1~3개",     recommended: ["meta","kakao","google"] },
  { id: "seller",      label: "이커머스 셀러",     desc: "온라인 위주",    recommended: ["coupang","naver","meta","google"] },
  { id: "enterprise",  label: "대형광고주·본사",   desc: "전국 캠페인",    recommended: ["meta","google","naver","kakao","youtube","dooh"] },
  { id: "agency",      label: "광고대행사 AE",     desc: "광고주 3+",      recommended: ["meta","google","naver","kakao","tiktok","youtube"] },
];

const BUDGET_RANGES = [
  { id: "small",  label: "월 100만원 미만" },
  { id: "medium", label: "월 100~500만원" },
  { id: "large",  label: "월 500~3000만원" },
  { id: "xlarge", label: "월 3,000만원+" },
];

const SIMULATION_BY_INDUSTRY = {
  fashion:   { season: "장마",      creative: "비 오는 출근길, 안 젖는 트렌치 하나면 다 해결.",      lift: "+42%", trigger: "장마 D-7 진입 시점", liftMetric: "매출", liftBasis: "장마 D-7 트렌치 검색 +180% × 인스타 입찰 +35% (Burberry 글로벌 검증)" },
  beauty:    { season: "장마",      creative: "장마철 들뜨는 머리, 헤어 미스트 + UV 차단 한 번에.",  lift: "+38%", trigger: "습도 80%+ 8시간 연속", liftMetric: "매출", liftBasis: "장마 들뜸 헤어 케어 검색 +220% × 올리브영 매장 매칭" },
  beverage:  { season: "폭염",      creative: "체감 33℃. 차가운 첫 잔, 가장 가까운 매장 5분.",       lift: "+58%", trigger: "체감온도 33℃+ 8일 연속", liftMetric: "매장 매출", liftBasis: "체감 33℃+ 8일 디저트·음료 매출 +42% (소상공인진흥공단)" },
  retail:    { season: "장마·폭염", creative: "오늘 같은 날 가장 많이 사는 카테고리, 한눈에.",       lift: "+34%", trigger: "기온·습도 트리거 매대 자동", liftMetric: "카테고리 매출", liftBasis: "기온·습도 트리거 매대 자동 전환 시 시즌 카테고리 매출 +34%" },
  auto:      { season: "폭염",      creative: "에어컨 풀로 켜야 하는 날, 차박 시승 D-3 사전 예약.",  lift: "+47%", trigger: "폭염 7일째 + 주말 맑음", liftMetric: "시승 신청 전환율", liftBasis: "폭염 7일+ 4륜 검색 + 매장 5km 매칭 (BMW xDrive 글로벌 사례)" },
  health:    { season: "미세먼지",  creative: "미세먼지 75㎍ 진입. 마스크 + 비강 케어 익일 배송.",   lift: "+52%", trigger: "PM2.5 75㎍+ 지역", liftMetric: "구매 전환율", liftBasis: "PM2.5 75㎍+ 시 마스크·비강 검색→구매 전환 +52% (Dyson 검증)" },
  home:      { season: "장마",      creative: "장마철 곰팡이 걱정, 제습 시즌 인테리어 한 번에.",     lift: "+31%", trigger: "장마 시작 D-7", liftMetric: "객단가", liftBasis: "장마 D-7 곰팡이 케어 + 제습 동시 구매 패턴 +31%" },
  appliance: { season: "폭염",      creative: "오늘 밤도 열대야. 1시간이면 시원해집니다.",           lift: "+54%", trigger: "열대야 5일 연속", liftMetric: "매출", liftBasis: "열대야 5일+ 에어컨 검색 +320% (네이버) × 익일 배송 강조" },
  sleep:     { season: "폭염",      creative: "오늘 잠 못 든 분께 — 쿨링 매트리스 7일 체험.",        lift: "+38%", trigger: "열대야 + 수면 검색 폭증", liftMetric: "매출", liftBasis: "열대야 + 수면 검색 폭증 시 쿨링 매트리스 매출 +38%" },
  food:      { season: "한파",      creative: "기온 영하 5℃. 든든한 한 그릇, 30분이면 따끈하게.",    lift: "+44%", trigger: "한파 진입 시점", liftMetric: "매장 매출", liftBasis: "한파 진입 시점 따뜻한 메뉴 매출 +44% (외식업 통계)" },
  travel:    { season: "주말 맑음", creative: "이번 주말 맑음 100%. 당일치기 베스트 5선.",           lift: "+36%", trigger: "주말 맑음 + UV 5+", liftMetric: "예약 전환율", liftBasis: "주말 맑음 + UV 5+ 시 당일치기 검색 → 예약 전환 +36%" },
  outdoor:   { season: "맑음",      creative: "주말 등산 D-Day. 자외선 5+, 모자 + 선크림 챙기세요.", lift: "+33%", trigger: "주말 맑음 + UV 5+", liftMetric: "광고 CTR", liftBasis: "주말 맑음 + UV 5+ 등산 검색 +210% (네이버) → CTR +33%" },
  finance:   { season: "환절기",    creative: "환절기 건강검진 시즌, 보험 점검 함께.",               lift: "+27%", trigger: "일교차 10℃+ 환절기", liftMetric: "문의 전환율", liftBasis: "일교차 10℃+ 환절기 건강검진·보험 문의 +27%" },
  edu:       { season: "장마",      creative: "비 오는 주말, 집에서 4주 완성 클래스.",               lift: "+29%", trigger: "주말 비 예보", liftMetric: "신청 전환율", liftBasis: "주말 비 예보 시 온라인 클래스 신청 전환 +29%" },
  ent:       { season: "장마",      creative: "비 오는 밤, 넷플릭스 신작 30% 첫 달.",                lift: "+41%", trigger: "비 예보 + 저녁 시간대", liftMetric: "구독 전환율", liftBasis: "비 오는 밤 OTT 신규 구독 +41% (시즌 패턴)" },
  telco:     { season: "장마·폭염", creative: "데이터 폭증 시즌, 무제한 요금제 첫 달 무료.",         lift: "+25%", trigger: "장마·폭염 시즌 진입", liftMetric: "가입 전환율", liftBasis: "장마·폭염 데이터 폭증 시즌 무제한 요금제 가입 +25%" },
  pet:       { season: "장마",      creative: "장마철 우리 강아지 발, 5초면 보송보송.",              lift: "+44%", trigger: "장마 시작 + 반려 검색 +290%", liftMetric: "구매 전환율", liftBasis: "장마 + 반려동물 발 곰팡이·진드기 검색 +290% (Wellbian 본진)" },
  solo:      { season: "장마·폭염", creative: "1인 가구 장마 필수템. 4L 제습기, 5만원대 첫 구매.",   lift: "+47%", trigger: "장마 진입 + 1인 가구 솔로 검색 폭증", liftMetric: "매출", liftBasis: "1인 가구 장마 제습기 4L 검색 +210%, 5만원대 첫 구매 객단가 매칭" },
};

/* M6: 페르소나·채널별 다른 입찰률 */
const CHANNEL_BID_BY_PERSONA = {
  soloprenuer: { meta: "+30%", kakao: "+35%", google: "+25%", naver: "+25%", coupang: "+20%", tiktok: "+15%", dooh: "+10%", youtube: "+15%" },
  seller:      { meta: "+35%", google: "+45%", naver: "+50%", coupang: "+55%", kakao: "+25%", tiktok: "+30%", dooh: "+10%", youtube: "+25%" },
  enterprise:  { meta: "+50%", google: "+55%", naver: "+50%", kakao: "+45%", coupang: "+30%", tiktok: "+35%", dooh: "+40%", youtube: "+45%" },
  agency:      { meta: "+40%", google: "+45%", naver: "+45%", kakao: "+40%", coupang: "+35%", tiktok: "+45%", dooh: "+25%", youtube: "+40%" },
};

function Icon({ name, size = 18, stroke = 2 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  switch (name) {
    case "check":       return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    case "arrow-right": return <svg {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
    case "arrow-left":  return <svg {...p}><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>;
    case "sparkles":    return <svg {...p}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>;
    case "cloud":       return <svg {...p}><path d="M17.5 19a4.5 4.5 0 1 0-1.41-8.775A6.5 6.5 0 1 0 5.5 19Z"/></svg>;
    case "layers":      return <svg {...p}><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91a1 1 0 0 0 0-1.83z"/><path d="M2 12 11.18 16.18a2 2 0 0 0 1.65 0L22 12"/></svg>;
    case "info":        return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;
    default: return null;
  }
}

const STEP_NAMES = ["광고주 유형", "사업 정보", "광고 채널", "첫 추천 결과"];

/* 페르소나별 입력 범위 — Option A 분기 */
const PERSONA_FIELDS = {
  soloprenuer: { region: "specific", industriesMax: 1, businessNameLabel: "사업장명",   businessNamePlaceholder: "예: 우리 카페 (강남구점)" },
  seller:      { region: "scope",    industriesMax: 3, businessNameLabel: "셀러·상호",  businessNamePlaceholder: "예: 미니멈 셀렉트샵" },
  enterprise:  { region: "national", industriesMax: 3, businessNameLabel: "광고주명",   businessNamePlaceholder: "예: 한국로지스마트 (본사)" },
  agency:      { region: "none",     industriesMax: 0, businessNameLabel: "대행사명",   businessNamePlaceholder: "예: 옐로우 미디어그룹" },
};

const REGION_SCOPE_CHOICES = [
  { id: "national", label: "전국",           desc: "전국 시·도 단위 통합 캠페인" },
  { id: "specific", label: "특정 시·도 선택", desc: "특정 시·도 1곳 집중 운영" },
];

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [regionScope, setRegionScope] = useState("national");
  const [industries, setIndustries] = useState([]);
  const [budget, setBudget] = useState(null);
  const [channels, setChannels] = useState([]);

  const personaCfg = persona ? PERSONA_FIELDS[persona] : null;
  const isLocal = persona === "soloprenuer";
  const isAgency = persona === "agency";

  const toggleIndustry = (id) => {
    if (!personaCfg) return;
    const max = personaCfg.industriesMax;
    if (industries.includes(id)) {
      setIndustries(industries.filter((x) => x !== id));
    } else if (max === 1) {
      setIndustries([id]);
    } else if (industries.length < max) {
      setIndustries([...industries, id]);
    }
  };

  const canNext = useMemo(() => {
    if (step === 0) return persona && !isAgency && businessName.trim().length >= 2;
    if (step === 1) {
      if (!industries.length || !budget) return false;
      if (isLocal && (!sido || !sigungu)) return false;
      if (persona === "seller" && regionScope === "specific" && !sido) return false;
      return true;
    }
    if (step === 2) return channels.length > 0;
    return true;
  }, [step, persona, isAgency, isLocal, businessName, sido, sigungu, regionScope, industries, budget, channels]);

  const result = useMemo(() => {
    if (!industries.length) return null;
    return SIMULATION_BY_INDUSTRY[industries[0]] || SIMULATION_BY_INDUSTRY.retail;
  }, [industries]);

  const locationLabel = useMemo(() => {
    if (isLocal) return `${sido} ${sigungu}`.trim();
    if (persona === "seller") {
      if (regionScope === "national") return "전국";
      return sido || "전국";
    }
    if (persona === "enterprise") return "전국 캠페인";
    return "";
  }, [persona, isLocal, sido, sigungu, regionScope]);

  const toggleChannel = (id) => {
    setChannels((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const recommendedChannels = useMemo(() => {
    if (!persona) return [];
    const p = PERSONAS.find((x) => x.id === persona);
    return p ? p.recommended : [];
  }, [persona]);

  const handleStepChange = (newStep) => {
    if (newStep === 2 && channels.length === 0 && recommendedChannels.length > 0) {
      setChannels(recommendedChannels.slice(0, 3));
    }
    setStep(newStep);
  };

  const sigunguList = sido ? REGIONS[sido] || [] : [];

  return (
    <div style={{ minHeight: "100vh", background: T.surface, fontFamily: "'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif", paddingBottom: 100 }}>
      {/* 헤더 */}
      <header style={{ background: T.canvas, borderBottom: `1px solid ${T.hairlineSoft}`, padding: "14px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-[960px] mx-auto flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2.5 min-w-0">
            <div style={{ width: 32, height: 32, borderRadius: R.md, background: T.mossDark, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="cloud" size={18} stroke={2} />
            </div>
            <div className="leading-none min-w-0">
              <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                Weather Plan AI
              </div>
              <div className="hidden sm:block" style={{ color: T.steel, fontSize: 11, marginTop: 4, letterSpacing: "0.04em", fontWeight: 500 }}>
                by KWeather · wellbian AI
              </div>
            </div>
          </a>

          <div className="flex items-center gap-2 flex-wrap justify-end" style={{ minWidth: 0 }}>
            <div className="flex items-center gap-1.5">
              {[0,1,2,3].map((i) => (
                <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: R.full, background: i <= step ? T.mossDark : T.hairlineSoft, transition: "all 200ms ease" }} />
              ))}
            </div>
            <span style={{ color: T.steel, fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap" }}>
              {step + 1}/4 · <span style={{ color: T.mossDark, fontWeight: 600 }}>{STEP_NAMES[step]}</span>
            </span>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-[760px] mx-auto px-6 py-10">
        {/* STEP 0: 광고주 유형 */}
        {step === 0 && (
          <div>
            <div className="text-center mb-10">
              <div style={{ color: T.mossDark, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>STEP 1 · 광고주 유형</div>
              <h1 style={{ color: T.ink, fontSize: "clamp(24px, 3.6vw, 34px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 10, wordBreak: "keep-all" }}>
                어떤 광고주이신가요?
              </h1>
              <p style={{ color: T.slate, fontSize: 14, fontWeight: 400, lineHeight: 1.6 }}>
                유형에 따라 다음 단계 필요 정보가 달라집니다.
              </p>
            </div>

            <div className="space-y-4">
              <FormCard label="광고주 유형">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PERSONAS.map((p) => (
                    <ChoiceCard key={p.id} active={persona === p.id} onClick={() => setPersona(p.id)} label={p.label} desc={p.desc} />
                  ))}
                </div>
              </FormCard>

              {isAgency ? (
                <div style={{
                  background: "linear-gradient(180deg, rgba(78,179,168,0.10) 0%, rgba(78,179,168,0.04) 100%)",
                  border: `1px solid ${T.brandTeal}`,
                  borderRadius: R.xxl,
                  padding: "18px 20px",
                }} className="flex items-start gap-3">
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    background: T.mossDark, color: "#FFFFFF",
                    borderRadius: R.md,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name="layers" size={18} stroke={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.ink, fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.005em", marginBottom: 4 }}>
                      광고대행사 AE 콘솔로 바로 이동
                    </div>
                    <p style={{ color: T.slate, fontSize: 12.5, fontWeight: 400, lineHeight: 1.6, margin: 0, marginBottom: 10, wordBreak: "keep-all" }}>
                      AE는 자기 정보 대신 담당 광고주 매트릭스가 핵심입니다. 일간 보고·카톡 공유까지 한 화면에서 운영하세요.
                    </p>
                    <a href="/agency-board" className="inline-flex items-center gap-1.5 transition hover:opacity-80" style={{
                      background: `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)`,
                      color: T.onPrimary,
                      fontSize: 13, fontWeight: 600,
                      padding: "9px 16px",
                      borderRadius: R.full,
                      textDecoration: "none",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 2px rgba(20,68,59,0.16)",
                    }}>
                      AE 대시보드로 이동
                      <Icon name="arrow-right" size={13} stroke={2.2} />
                    </a>
                  </div>
                </div>
              ) : persona ? (
                <FormCard label={personaCfg.businessNameLabel}>
                  <input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={personaCfg.businessNamePlaceholder}
                    style={inputStyle}
                  />
                  {businessName.length > 0 && businessName.trim().length < 2 && (
                    <div style={hintError}>최소 2글자 이상 입력해주세요</div>
                  )}
                </FormCard>
              ) : null}
            </div>
          </div>
        )}

        {/* STEP 1: 사업 정보 (페르소나별 분기) */}
        {step === 1 && personaCfg && (
          <div>
            <div className="text-center mb-10">
              <div style={{ color: T.mossDark, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>STEP 2 · 사업 정보</div>
              <h1 style={{ color: T.ink, fontSize: "clamp(24px, 3.6vw, 34px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 10, wordBreak: "keep-all" }}>
                {isLocal && "사업장 위치와 업종을 알려주세요."}
                {persona === "seller" && "영업 지역과 카테고리를 알려주세요."}
                {persona === "enterprise" && "광고 카테고리와 예산을 알려주세요."}
              </h1>
              <p style={{ color: T.slate, fontSize: 14, fontWeight: 400, lineHeight: 1.6, wordBreak: "keep-all" }}>
                {isLocal && "케이웨더는 시·군·구 단위로 5분 단위 측정 — 매장 반경 5km까지 정밀하게 추천합니다."}
                {persona === "seller" && `이커머스 셀러는 카테고리 최대 ${personaCfg.industriesMax}개까지 동시 운영하실 수 있습니다.`}
                {persona === "enterprise" && `대형 광고주는 전국 캠페인 기준 · 카테고리 최대 ${personaCfg.industriesMax}개까지 매칭합니다.`}
              </p>
            </div>

            <div className="space-y-5">
              {/* ─ 지역 — 페르소나별 분기 ─ */}
              {isLocal && (
                <>
                  <FormCard label="위치 · 시·도">
                    <select value={sido} onChange={(e) => { setSido(e.target.value); setSigungu(""); }} style={inputStyle}>
                      <option value="">시·도를 선택하세요</option>
                      {Object.keys(REGIONS).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </FormCard>
                  <FormCard label="위치 · 시·군·구">
                    <select
                      value={sigungu}
                      onChange={(e) => setSigungu(e.target.value)}
                      disabled={!sido}
                      style={{ ...inputStyle, color: sido ? T.ink : T.muted, cursor: sido ? "pointer" : "not-allowed" }}
                    >
                      <option value="">{sido ? "시·군·구를 선택하세요" : "먼저 시·도를 선택하세요"}</option>
                      {sigunguList.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </FormCard>
                </>
              )}

              {persona === "seller" && (
                <FormCard label="영업 지역">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    {REGION_SCOPE_CHOICES.map((rs) => (
                      <ChoiceCard
                        key={rs.id}
                        active={regionScope === rs.id}
                        onClick={() => { setRegionScope(rs.id); if (rs.id === "national") { setSido(""); setSigungu(""); } }}
                        label={rs.label}
                        desc={rs.desc}
                      />
                    ))}
                  </div>
                  {regionScope === "specific" && (
                    <select value={sido} onChange={(e) => setSido(e.target.value)} style={{ ...inputStyle, padding: "10px 0 6px 0" }}>
                      <option value="">시·도를 선택하세요</option>
                      {Object.keys(REGIONS).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                </FormCard>
              )}

              {persona === "enterprise" && (
                <div style={{
                  background: T.canvas,
                  border: `1px solid ${T.hairlineSoft}`,
                  borderRadius: R.xxl,
                  padding: "16px 18px",
                }} className="flex items-center gap-3">
                  <div style={{
                    width: 32, height: 32, flexShrink: 0,
                    background: T.tealLight, color: T.mossDark,
                    borderRadius: R.md,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name="layers" size={16} stroke={2} />
                  </div>
                  <div>
                    <div style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}>운영 범위</div>
                    <div style={{ color: T.ink, fontSize: 14, fontWeight: 700, letterSpacing: "-0.005em", marginTop: 2 }}>
                      전국 캠페인 · 권역·시즌별 의사결정
                    </div>
                  </div>
                </div>
              )}

              {/* ─ 업종 — 페르소나별 단일/복수 선택 ─ */}
              <FormCard label={`업종 ${personaCfg.industriesMax > 1 ? `(${industries.length}/${personaCfg.industriesMax})` : ""}`.trim()}>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => {
                    const active = industries.includes(ind.id);
                    const reachedMax = !active && industries.length >= personaCfg.industriesMax && personaCfg.industriesMax > 1;
                    return (
                      <button
                        key={ind.id}
                        onClick={() => toggleIndustry(ind.id)}
                        disabled={reachedMax}
                        className="transition active:translate-y-px"
                        style={{
                          background: active ? T.mossDark : T.canvas,
                          color: active ? "#FFFFFF" : (reachedMax ? T.muted : T.ink),
                          border: `1px solid ${active ? T.mossDark : T.hairline}`,
                          fontSize: 13, fontWeight: active ? 600 : 500,
                          padding: "8px 13px",
                          borderRadius: R.full,
                          cursor: reachedMax ? "not-allowed" : "pointer",
                          opacity: reachedMax ? 0.45 : 1,
                          letterSpacing: "-0.005em",
                          boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 6px rgba(20,68,59,0.22)" : "0 1px 2px rgba(5,0,56,0.04)",
                        }}
                      >
                        <span style={{ marginRight: 5 }}>{ind.icon}</span>
                        {ind.label}
                      </button>
                    );
                  })}
                </div>
                {personaCfg.industriesMax > 1 && (
                  <div style={{ color: T.muted, fontSize: 11, fontWeight: 400, marginTop: 8, letterSpacing: "-0.005em" }}>
                    최대 {personaCfg.industriesMax}개까지 선택 · 첫 번째 선택 항목 기준으로 결과 화면이 구성됩니다.
                  </div>
                )}
              </FormCard>

              <FormCard label="월 광고 예산">
                <div className="grid grid-cols-2 gap-2">
                  {BUDGET_RANGES.map((b) => (
                    <ChoiceCard key={b.id} active={budget === b.id} onClick={() => setBudget(b.id)} label={b.label} />
                  ))}
                </div>
              </FormCard>
            </div>
          </div>
        )}

        {/* STEP 2: 광고 채널 */}
        {step === 2 && (
          <div>
            <div className="text-center mb-10">
              <div style={{ color: T.mossDark, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>STEP 3 · 광고 채널</div>
              <h1 style={{ color: T.ink, fontSize: "clamp(24px, 3.6vw, 34px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 10, wordBreak: "keep-all" }}>
                어떤 채널을 운영하세요?
              </h1>
              <p style={{ color: T.slate, fontSize: 14, fontWeight: 400, lineHeight: 1.6 }}>
                ✨ <strong style={{ color: T.mossDark }}>페르소나 기반 추천 채널</strong>을 자동 선택했습니다. 자유롭게 조정하세요.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AD_CHANNELS.map((ch) => {
                const active = channels.includes(ch.id);
                const recommended = recommendedChannels.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className="text-left transition active:translate-y-px relative"
                    style={{
                      background: active ? "rgba(78,179,168,0.10)" : T.canvas,
                      border: `1.5px solid ${active ? T.brandTeal : T.hairlineSoft}`,
                      borderRadius: R.xxl,
                      padding: "16px 18px",
                      cursor: "pointer",
                      boxShadow: active ? "0 4px 12px rgba(78,179,168,0.16), inset 0 1px 0 rgba(255,255,255,0.6)" : "0 1px 2px rgba(5,0,56,0.04)",
                    }}
                  >
                    {recommended && !active && (
                      <span style={{ position: "absolute", top: 10, right: 12, background: T.tealLight, color: T.mossDark, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", padding: "2px 7px", borderRadius: R.full, border: `1px solid ${T.brandTeal}` }}>
                        추천
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <div style={{ width: 22, height: 22, borderRadius: R.sm, background: active ? T.mossDark : T.surface, color: active ? "#FFFFFF" : T.hairline, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, border: active ? "none" : `1px solid ${T.hairline}`, flexShrink: 0 }}>
                        {active && <Icon name="check" size={14} stroke={2.5} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: T.ink, fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 3 }}>
                          {ch.label}
                        </div>
                        <div style={{ color: T.steel, fontSize: 12, fontWeight: 400 }}>
                          {ch.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <p style={{ color: T.muted, fontSize: 12, fontWeight: 400, lineHeight: 1.6 }}>
                ※ 채널 계정 권한은 받지 않습니다. 광고주가 콘솔에서 직접 적용하시는 방식입니다.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: 첫 추천 결과 */}
        {step === 3 && result && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5" style={{ color: T.mossDark, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>
                <Icon name="sparkles" size={12} stroke={2} />
                STEP 4 · 첫 추천 결과 도착
              </div>
              <h1 style={{ color: T.ink, fontSize: "clamp(22px, 3.4vw, 32px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: 10, wordBreak: "keep-all" }}>
                {businessName || "사업장"}을 위한<br />
                <span style={{ color: T.mossDark }}>첫 광고 추천</span>입니다.
              </h1>
              <p style={{ color: T.slate, fontSize: 14, fontWeight: 400, lineHeight: 1.6 }}>
                {locationLabel && <>{locationLabel} · </>}케이웨더 60일 예보 — {result.season} 시즌 진입 시점 권장
              </p>
              {industries.length > 1 && (
                <p style={{ color: T.muted, fontSize: 12, fontWeight: 400, marginTop: 6 }}>
                  외 {industries.length - 1}개 카테고리 — {INDUSTRIES.find((i) => i.id === industries[0])?.label} 기준 표시
                </p>
              )}
            </div>

            <div style={{
              background: "rgba(255,255,255,0.65)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.6)",
              borderRadius: R.xxxl,
              padding: "22px 24px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85), 0 1px 3px rgba(5,0,56,0.05), 0 8px 24px rgba(5,0,56,0.06), 0 24px 60px rgba(5,0,56,0.08)",
            }}>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ background: T.tealLight, color: T.mossDark, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", padding: "4px 10px", borderRadius: R.full, border: `1px solid ${T.brandTeal}` }}>
                    {result.season} 시즌
                  </span>
                  <span style={{ color: T.steel, fontSize: 12, fontWeight: 500 }}>{result.trigger}</span>
                </div>
                <div className="flex items-center gap-1.5" style={{ color: T.mossDark, fontSize: 12, fontWeight: 700 }}>
                  <Icon name="sparkles" size={13} stroke={2} />
                  정확도 89/100
                </div>
              </div>

              <div className="mb-5" style={{ paddingBottom: 20, borderBottom: `1px solid ${T.hairlineSoft}` }}>
                <div style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 6 }}>추천 카피</div>
                <div style={{ color: T.ink, fontSize: 17, fontStyle: "italic", fontWeight: 400, lineHeight: 1.5, wordBreak: "keep-all" }}>
                  "{result.creative}"
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Icon name="layers" size={14} stroke={2} />
                  <span style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>
                    매체별 권장 ({channels.length}개 채널)
                  </span>
                </div>
                <div className="space-y-2">
                  {channels.length === 0 ? (
                    <div style={{ color: T.muted, fontSize: 12.5, fontWeight: 400 }}>
                      선택한 채널이 없습니다. 이전 단계로 돌아가 채널을 선택하세요.
                    </div>
                  ) : (
                    channels.map((chId) => {
                      const ch = AD_CHANNELS.find((c) => c.id === chId);
                      if (!ch) return null;
                      const bidUp = (CHANNEL_BID_BY_PERSONA[persona] || {})[chId] || "+30%";
                      return (
                        <div key={chId} style={{ background: T.canvas, border: `1px solid ${T.hairlineSoft}`, borderRadius: R.lg, padding: "10px 13px" }} className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ background: T.mossDark, color: "#FFFFFF", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: R.full }}>
                              {ch.label}
                            </span>
                            <span style={{ color: T.steel, fontSize: 11.5, fontWeight: 400 }}>{ch.desc}</span>
                          </div>
                          <span style={{ background: T.tealLight, color: T.mossDark, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: R.full, border: `1px solid ${T.brandTeal}` }}>
                            입찰 {bidUp}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3 pt-4" style={{ borderTop: `1px solid ${T.hairlineSoft}` }}>
                <div className="flex items-center gap-2">
                  <span style={{ color: T.steel, fontSize: 12, fontWeight: 500 }}>예상 {result.liftMetric || "효과"}</span>
                  <span style={{ background: T.brandTeal, color: T.mossDark, fontSize: 14, fontWeight: 700, padding: "5px 12px", borderRadius: R.md, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.12)" }}>
                    {result.lift}
                  </span>
                </div>
                <button style={{ background: `linear-gradient(180deg, #2D2862 0%, #050038 100%)`, color: T.onPrimary, fontSize: 13.5, fontWeight: 500, padding: "10px 18px", borderRadius: R.full, whiteSpace: "nowrap", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.4), 0 1px 2px rgba(5,0,56,0.14), 0 4px 14px rgba(5,0,56,0.28)" }}>
                  광고 콘솔에서 적용하기 →
                </button>
              </div>

              {/* 예측 근거 */}
              {result.liftBasis && (
                <div className="mt-4 flex items-start gap-2" style={{
                  background: T.surface,
                  borderRadius: R.lg,
                  padding: "10px 13px",
                  border: `1px solid ${T.hairlineSoft}`,
                }}>
                  <div style={{ color: T.mossDark, marginTop: 2, flexShrink: 0 }}>
                    <Icon name="sparkles" size={11} stroke={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: T.steel, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 2 }}>
                      예측 근거
                    </div>
                    <div style={{ color: T.charcoal, fontSize: 12, fontWeight: 400, lineHeight: 1.55, wordBreak: "keep-all" }}>
                      {result.liftBasis}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <p style={{ color: T.slate, fontSize: 13, fontWeight: 400, lineHeight: 1.7 }}>
                ✨ <strong style={{ color: T.ink, fontWeight: 600 }}>등록 완료!</strong> 앞으로 매일 새로운 추천 결과를<br />
                <a href="/dashboard" style={{ color: T.mossDark, fontWeight: 600, textDecoration: "underline" }}>대시보드</a>에서 확인하실 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* C3: Sticky Bottom Navigation */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.canvas, borderTop: `1px solid ${T.hairlineSoft}`, padding: "12px 16px", zIndex: 100, boxShadow: "0 -4px 14px rgba(5,0,56,0.04)" }}>
        <div className="max-w-[760px] mx-auto flex items-center justify-between gap-3">
          {step > 0 ? (
            <button onClick={() => handleStepChange(step - 1)} className="flex items-center gap-1.5 transition hover:opacity-70" style={{ background: T.canvas, color: T.ink, fontSize: 13, fontWeight: 500, padding: "10px 16px", borderRadius: R.full, border: `1px solid ${T.hairline}`, cursor: "pointer" }}>
              <Icon name="arrow-left" size={14} stroke={2.2} />
              이전
            </button>
          ) : (
            <a href="/" style={{ color: T.steel, fontSize: 13, fontWeight: 500, padding: "10px 12px", textDecoration: "none" }}>← 메인으로</a>
          )}

          {step < 3 ? (
            <button
              onClick={() => canNext && handleStepChange(step + 1)}
              disabled={!canNext}
              className="flex items-center gap-1.5 transition active:translate-y-px"
              style={{
                background: canNext ? `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)` : T.hairlineSoft,
                color: canNext ? T.onPrimary : T.muted,
                fontSize: 13.5, fontWeight: 600,
                padding: "10px 22px",
                borderRadius: R.full,
                cursor: canNext ? "pointer" : "not-allowed",
                boxShadow: canNext ? "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.22), 0 1px 2px rgba(20,68,59,0.16)" : "none",
              }}
            >
              다음
              <Icon name="arrow-right" size={14} stroke={2.2} />
            </button>
          ) : (
            <a href="/dashboard" className="flex items-center gap-1.5 transition active:translate-y-px" style={{ background: `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)`, color: T.onPrimary, fontSize: 13.5, fontWeight: 600, padding: "10px 22px", borderRadius: R.full, textDecoration: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.22), 0 1px 2px rgba(20,68,59,0.16)" }}>
              대시보드로 →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function FormCard({ label, children }) {
  return (
    <div style={{ background: T.canvas, border: `1px solid ${T.hairlineSoft}`, borderRadius: R.xxl, padding: "16px 18px" }}>
      <div style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function ChoiceCard({ active, onClick, label, desc }) {
  return (
    <button onClick={onClick} className="text-left transition active:translate-y-px" style={{ background: active ? "rgba(78,179,168,0.10)" : T.canvas, border: `1.5px solid ${active ? T.brandTeal : T.hairlineSoft}`, borderRadius: R.lg, padding: "10px 13px", cursor: "pointer", boxShadow: active ? "0 2px 6px rgba(78,179,168,0.12)" : "none" }}>
      <div style={{ color: active ? T.mossDark : T.ink, fontSize: 13, fontWeight: active ? 700 : 500, letterSpacing: "-0.005em" }}>{label}</div>
      {desc && <div style={{ color: T.steel, fontSize: 11, fontWeight: 400, marginTop: 2 }}>{desc}</div>}
    </button>
  );
}

const inputStyle = {
  width: "100%",
  background: "transparent",
  color: T.ink,
  fontSize: 14.5,
  fontWeight: 400,
  border: "none",
  outline: "none",
  padding: "6px 0",
};

const hintError = { color: "#D04A35", fontSize: 11, fontWeight: 500, marginTop: 6, letterSpacing: "-0.005em" };
