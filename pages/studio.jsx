/* ============================================================
 * Weather Plan AI · /studio
 *
 * 챗봇 풀 페이지 — 16업종 × Claude API 연동 구조
 * - 좌측 사이드바: 업종 선택 + 추천 질문
 * - 중앙: ChatGPT 스타일 대화창 (Claude API 연동 mock + 실제 연동 hook)
 * - 우측: (모바일은 toggle) 케이웨더 실시간 패널
 *
 * 실제 Claude API 연동:
 * - sendMessage() 함수가 fetch() 호출 — 환경변수 또는 백엔드 proxy 필요
 * - 사용자 메시지 + 시스템 프롬프트(업종별) → Anthropic API → 응답
 * - mock 모드 (USE_MOCK=true)에서는 미리 정의된 STUDIO_DEMO_BY_INDUSTRY 응답 시뮬레이션
 *
 * 라우팅: /studio
 * ============================================================ */

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Head from "next/head";

/* ─── 디자인 토큰 ─── */
const T = {
  canvas:        "#FFFFFF",
  surface:       "#F7F5EE",
  surfaceSoft:   "#FAF8F2",
  ink:           "#050038",
  ink4:          "rgba(5,0,56,0.4)",
  charcoal:      "#1A1A1A",
  slate:         "#4F5460",
  steel:         "#7B7F8C",
  muted:         "#9CA3AF",
  hairline:      "rgba(5,0,56,0.12)",
  hairlineSoft:  "rgba(5,0,56,0.08)",
  brandTeal:     "#4EB3A8",
  mossDark:      "#14443B",
  brandBlue:     "#4262FF",
  tealLight:     "#D7F2EE",
  onPrimary:     "#FFFFFF",
  primary:       "#050038",
};

const R = { sm: 8, md: 10, lg: 12, xl: 16, xxl: 20, xxxl: 24, full: 9999 };

/* ─── 18업종 + 각 업종별 추천 질문 5개 (실제 사용자 채팅체로 축약) ─── */
const INDUSTRIES = [
  {
    id: "fashion", label: "패션·의류", icon: "👕",
    questions: [
      "장마 트렌치코트 광고",
      "주말 맑음 비치웨어",
      "환절기 패션 카피 추천",
      "한파 패딩 광고 타이밍?",
      "장마 D-7 인스타 카피 3개",
    ],
  },
  {
    id: "beauty", label: "뷰티·H&B", icon: "💄",
    questions: [
      "장마 헤어 광고",
      "UV 6+ 선크림 추천",
      "환절기 보습 세럼 카피",
      "미세먼지 클렌징 광고",
      "오늘 잘 팔리는 화장품?",
    ],
  },
  {
    id: "beverage", label: "음료·주류", icon: "🍷",
    questions: [
      "폭염 7일 맥주 광고",
      "체감 33℃ 아이스 음료 카피",
      "장마 위스키 광고 추천",
      "한파 따뜻한 음료 광고",
      "주말 맑음 야외 술자리",
    ],
  },
  {
    id: "retail", label: "리테일·이커머스", icon: "🛒",
    questions: [
      "장마 우산·레인부츠 사전 광고",
      "폭염 쿨링 가전 추천",
      "미세먼지 마스크·공기청정기",
      "한파 따뜻한 카테고리 매대",
      "오늘 검색 폭증 카테고리?",
    ],
  },
  {
    id: "auto", label: "자동차", icon: "🚗",
    questions: [
      "폭염 에어컨 매장 광고",
      "강설 4륜구동 광고",
      "주말 맑음 시승 신청 카피",
      "장마 와이퍼·우중주행",
      "한파 배터리 점검 광고",
    ],
  },
  {
    id: "health", label: "헬스·OTC", icon: "💊",
    questions: [
      "미세먼지 75㎍ 마스크 카피",
      "꽃가루 알러지약 광고",
      "환절기 감기약 카피",
      "장마 곰팡이·진드기 약",
      "한파 일교차 면역력 광고",
    ],
  },
  {
    id: "home", label: "홈·인테리어", icon: "🏠",
    questions: [
      "장마 제습기·곰팡이 광고",
      "환절기 인테리어 카피",
      "한파 난방 가전 매대",
      "이사 시즌 인테리어 추천",
      "맑은 주말 페인팅·DIY",
    ],
  },
  {
    id: "appliance", label: "가전", icon: "🔌",
    questions: [
      "열대야 5일 에어컨 광고",
      "미세먼지 공기청정기 카피",
      "장마 건조기·제습기",
      "한파 전기히터·온풍기",
      "환절기 가습기 카피",
    ],
  },
  {
    id: "sleep", label: "수면·침구", icon: "🛏️",
    questions: [
      "열대야 쿨링 매트리스 카피",
      "한파 따뜻한 침구 추천",
      "장마 진드기 침구 광고",
      "환절기 베개·이불 카피",
      "수면 검색 폭증 타이밍",
    ],
  },
  {
    id: "food", label: "식음·외식", icon: "🍽️",
    questions: [
      "체감 33℃ 빙수·콜드 메뉴",
      "한파 따뜻한 한 그릇 카피",
      "장마 배달 광고 추천",
      "주말 맑음 야외 BBQ",
      "오늘 잘 팔리는 메뉴?",
    ],
  },
  {
    id: "travel", label: "여행·DOOH", icon: "✈️",
    questions: [
      "주말 맑음 당일치기 카피",
      "장마 실내 액티비티",
      "한파 호캉스 광고",
      "맑은 봄 캠핑·글램핑",
      "지역 날씨별 여행지",
    ],
  },
  {
    id: "outdoor", label: "아웃도어", icon: "⛰️",
    questions: [
      "주말 맑음 등산 D-Day",
      "장마 실내 클라이밍",
      "UV 5+ 등산복·모자",
      "한파 보온 아웃도어",
      "맑은 날 한강·러닝크루",
    ],
  },
  {
    id: "finance", label: "금융·보험", icon: "💰",
    questions: [
      "환절기 건강검진 보험",
      "장마 자동차 보험 추천",
      "한파 화재·재해 보험",
      "주말 여행 여행자 보험",
      "시즌별 적금·금융 매칭",
    ],
  },
  {
    id: "edu", label: "교육·구독", icon: "📚",
    questions: [
      "장마 주말 온라인 클래스",
      "여름방학 어학·취미 광고",
      "환절기 자녀 학습 광고",
      "한파 실내 학습 부스팅",
      "주말 비 구독 서비스",
    ],
  },
  {
    id: "ent", label: "엔터·콘텐츠", icon: "🎬",
    questions: [
      "비 오는 밤 넷플릭스 카피",
      "주말 맑음 OTT 광고",
      "장마 실내 콘텐츠 부스팅",
      "한파 집콕 콘텐츠",
      "환절기 멘탈 케어 콘텐츠",
    ],
  },
  {
    id: "telco", label: "통신·구독", icon: "📱",
    questions: [
      "여름 무제한 요금제",
      "장마 실내 콘텐츠 증가",
      "한파 따뜻한 구독 카피",
      "주말 야외 5G 광고",
      "시즌별 통신 부가서비스",
    ],
  },
  {
    id: "pet", label: "반려·펫", icon: "🐶",
    questions: [
      "장마 강아지·고양이 케어",
      "폭염 반려동물 쿨링 추천",
      "환절기 진드기·곰팡이",
      "주말 맑음 산책 용품",
      "한파 반려 보온 용품",
    ],
  },
  {
    id: "solo", label: "1인 가구·솔로", icon: "🏘️",
    questions: [
      "1인 가구 장마 제습기",
      "열대야 쿨링 매트",
      "1인 가구 한파 난방",
      "환절기 솔로 케어 카피",
      "주말 맑음 솔로 외출",
    ],
  },
];

/* ─── 서브카테고리 (18 × 9 = 162) ─── */
const SUBCATEGORIES_BY_INDUSTRY = {
  fashion:   ["여성복", "남성복", "키즈·베이비", "액세서리", "가방·신발", "스포츠웨어", "언더웨어·라운지", "골프웨어", "명품·럭셔리"],
  beauty:    ["스킨케어", "메이크업", "헤어케어", "향수", "건강기능식품", "바디·구강케어", "더모코스메틱", "클린·비건", "남성 그루밍"],
  beverage:  ["커피·차", "맥주", "소주·증류주", "와인", "위스키·고급주", "막걸리·전통주", "음료수·주스", "에너지음료", "무알콜·웰빙"],
  retail:    ["슈퍼·마트", "편의점", "백화점·아울렛", "종합몰", "카테고리몰", "라이브커머스", "해외직구", "중고거래", "친환경·로컬"],
  auto:      ["신차·승용", "신차·SUV", "중고차", "전기·친환경차", "럭셔리·수입", "상용차·트럭", "튜닝·액세서리", "정비·중장비", "렌트·카쉐어"],
  health:    ["종합비타민", "알러지·감기약", "소화·위장", "진통·해열", "다이어트·체중관리", "면역·홍삼", "피부·트러블", "두피·탈모", "영유아·임산부"],
  home:      ["가구", "침구·홈텍스", "조명·인테리어", "DIY·공구", "리빙소품", "욕실·주방", "정원·식물", "수납·정리", "가습·공기청정"],
  appliance: ["냉장고·세탁기", "에어컨·계절", "소형가전", "주방가전", "TV·AV·홈시어터", "청소·로봇", "미용·헤어가전", "공기청정·정수", "게이밍·노트북"],
  sleep:     ["매트리스", "베개·이불", "침구세트", "잠옷·수면용품", "슬립테크·앱", "매트리스 토퍼", "키즈·유아 침구", "호텔식·럭셔리", "항균·기능성"],
  food:      ["치킨·피자", "분식·스낵", "한식·전통", "양식·이태리", "일식·중식", "베이커리·디저트", "푸드코트·뷔페", "베지·헬시", "즉석식품·HMR"],
  travel:    ["국내·당일", "국내·숙박", "해외·아시아", "해외·구미·기타", "호텔·리조트", "항공", "액티비티·체험", "캠핑·차박", "DOOH·옥외광고"],
  outdoor:   ["등산·트레킹", "캠핑", "골프", "자전거·수상", "러닝·트레일런", "피트니스·홈트", "스키·보드", "낚시", "친환경·에코기어"],
  finance:   ["손해보험", "생명보험", "자동차보험", "투자·증권", "펀드·ETF", "대출·신용", "카드·페이", "외환·해외송금", "부동산·리츠"],
  edu:       ["초중고", "대입·재수", "어학·외국어", "자격증·실용", "성인·평생교육", "직장인·MBA", "IT·코딩", "아동·유아", "예체능"],
  ent:       ["OTT·VOD", "게임", "음악·콘서트", "영화·도서", "웹툰·웹소설", "팬덤·굿즈", "공연·뮤지컬", "스포츠·중계", "키덜트·취미"],
  telco:     ["무선요금제", "인터넷·IPTV", "알뜰폰·MVNO", "클라우드·SaaS", "구독박스", "B2B·기업통신", "IoT·스마트홈", "보안·CCTV", "5G·기술혁신"],
  pet:       ["사료·간식", "펫용품·장난감", "펫헬스·약", "미용·호텔", "유기·입양", "펫보험·금융", "펫호텔·여행", "훈련·교육", "펫이동·운송"],
  solo:      ["즉석식품·HMR", "1인 가전", "1인 가구 인테리어", "셀프케어·뷰티", "1인 여가·취미", "솔로 여행", "셀프 헬스", "솔로 라이프 콘텐츠", "1인 가구 보험"],
};

/* ─── 미리 정의된 시뮬레이션 응답 (USE_MOCK 모드용) ─── */
const STUDIO_DEMO_BY_INDUSTRY = {
  fashion: [
    {
      title: "장마엔 안 젖는 트렌치",
      copy: "장마 출근길, 안 젖는 트렌치 하나면 다 해결.",
      rationale: "장마 D-7 진입 시점에 우산·레인부츠 검색이 +280% 폭증하지만, 트렌치는 '비도 막고 멋도 챙긴다'로 포지셔닝 가능. 인스타·페북 입찰 +35% 권장.",
      channels: ["인스타그램", "페이스북", "네이버 GFA"],
      lift: "+42%", liftMetric: "매출", liftBasis: "장마·시즌 진입 + 카테고리 검색 폭증 (네이버 트렌드)",
    },
    {
      title: "주말 맑음 + 비치웨어",
      copy: "이번 주말 맑음 100%. 한강·해변에서 가장 빛날 비치웨어.",
      rationale: "주말 맑음 + UV 5+ 예측 시점 D-3 사전 광고 시작. 한강·도림천·강원 해변 5km 반경 매칭.",
      channels: ["인스타그램", "TikTok", "DOOH"],
      lift: "+47%", liftMetric: "매출", liftBasis: "장마·시즌 진입 + 카테고리 검색 폭증 (네이버 트렌드)",
    },
    {
      title: "환절기 일교차 카디건",
      copy: "낮 25℃ · 밤 12℃. 두 계절을 한 옷으로.",
      rationale: "일교차 10℃+ 환절기 진입 시점 카디건·재킷 광고 부스팅. 30~40대 직장인 출퇴근 타겟팅.",
      channels: ["인스타그램", "네이버 GFA"],
      lift: "+31%", liftMetric: "매출", liftBasis: "장마·시즌 진입 + 카테고리 검색 폭증 (네이버 트렌드)",
    },
  ],
  beauty: [
    {
      title: "장마철 안 들뜨는 베이스",
      copy: "습도 85% 잡는 베이스, 출근 7시간 그대로.",
      rationale: "장마 시즌 헤어·메이크업 들뜸 검색 +220% 폭증. 올리브영 매장 + 자사몰 동시 매칭.",
      channels: ["올리브영", "인스타그램", "쿠팡"],
      lift: "+38%", liftMetric: "매출", liftBasis: "습도·UV 시그널 + 카테고리 매대 동기화",
    },
    {
      title: "UV 7+ 선크림",
      copy: "UV 7. 30분 만에 타는 날, 5분 발라두면 끝.",
      rationale: "UV 지수 6+ 지역 한정 광고. 구글·메타 검색광고 +50% 권장. 야외 활동 시간대 11~16시 집중.",
      channels: ["구글 검색", "메타", "유튜브"],
      lift: "+52%", liftMetric: "매출", liftBasis: "습도·UV 시그널 + 카테고리 매대 동기화",
    },
    {
      title: "건조 환절기 세럼",
      copy: "습도 30% 이하 환절기, 5초 흡수 보습 세럼.",
      rationale: "습도 30% 이하 + 일교차 10℃ 트리거. 30~50대 여성 + H&B 매장 반경 매칭.",
      channels: ["인스타그램", "올리브영", "쿠팡"],
      lift: "+41%", liftMetric: "매출", liftBasis: "습도·UV 시그널 + 카테고리 매대 동기화",
    },
  ],
  pet: [
    {
      title: "장마철 반려동물 케어",
      copy: "장마철 우리 강아지 발, 5초면 보송보송.",
      rationale: "장마철 반려동물 발 곰팡이·진드기 검색 +290%. Wellbian 본진의 반려 카테고리 사용자 모수와 직결. 30~40대 1인 가구 + 가족 케어층.",
      channels: ["인스타그램", "쿠팡", "네이버 쇼핑"],
      lift: "+44%", liftMetric: "구매 전환율", liftBasis: "장마 + 반려동물 검색 +290% (Wellbian 본진)",
    },
    {
      title: "장마 후 살균 매트",
      copy: "비 오는 날 산책 후, 자동 살균 매트 1분.",
      rationale: "장마 = 살균 욕구 폭증 + 1분 즉시 효용. 객단가 부담 적은 첫 구매.",
      channels: ["인스타그램", "쿠팡"],
      lift: "+38%", liftMetric: "구매 전환율", liftBasis: "장마 + 반려동물 검색 +290% (Wellbian 본진)",
    },
    {
      title: "진드기 시즌 점검 키트",
      copy: "강아지 진드기 시즌. 3분 셀프 점검 키트.",
      rationale: "장마 + 폭염 진입 시 진드기 매출 트리거. 셀프 점검은 부담 적은 첫 객단가.",
      channels: ["네이버 GFA", "유튜브"],
      lift: "+32%", liftMetric: "구매 전환율", liftBasis: "장마 + 반려동물 검색 +290% (Wellbian 본진)",
    },
  ],
  solo: [
    {
      title: "1인 가구 장마 필수템",
      copy: "1인 가구 장마 필수템. 4L 제습기, 5만원대 첫 구매.",
      rationale: "1인 가구는 한국 가구의 35%+. 사이즈 명시(4L) + 가격 명시로 솔로 가구 객단가 정확 매칭.",
      channels: ["인스타그램", "쿠팡", "TikTok"],
      lift: "+47%", liftMetric: "매출", liftBasis: "1인 가구 장마 제습기·쿨링 매트 검색 +210%",
    },
    {
      title: "혼자 자는 밤 쿨링",
      copy: "혼자 자는 밤, 열대야 잠 못 든다면 — 쿨링 매트 7일 체험.",
      rationale: "혼자 + 열대야 + 7일 체험 = 진입 장벽 낮춘 결정 유도.",
      channels: ["인스타그램", "유튜브"],
      lift: "+41%", liftMetric: "매출", liftBasis: "1인 가구 장마 제습기·쿨링 매트 검색 +210%",
    },
    {
      title: "1인 가구 곰팡이 케어",
      copy: "1인 가구 곰팡이 제거 키트, 1주일이면 끝.",
      rationale: "장마 페인포인트 + 1주일 측정 가능한 시간 단위.",
      channels: ["네이버 쇼핑", "쿠팡"],
      lift: "+34%", liftMetric: "매출", liftBasis: "1인 가구 장마 제습기·쿨링 매트 검색 +210%",
    },
  ],
};

/* ─── Icon ─── */
function Icon({ name, size = 18, stroke = 2 }) {
  const p = {
    width: size, height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  switch (name) {
    case "cloud":       return <svg {...p}><path d="M17.5 19a4.5 4.5 0 1 0-1.41-8.775A6.5 6.5 0 1 0 5.5 19Z"/></svg>;
    case "send":        return <svg {...p}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;
    case "copy":        return <svg {...p}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
    case "check":       return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    case "sparkles":    return <svg {...p}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>;
    case "menu":        return <svg {...p}><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>;
    case "x":           return <svg {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
    case "plus":        return <svg {...p}><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
    case "thermometer": return <svg {...p}><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>;
    case "droplets":    return <svg {...p}><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/></svg>;
    case "wind":        return <svg {...p}><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/></svg>;
    default: return null;
  }
}

/* ─── 시스템 프롬프트 빌더 ─── */
const buildSystemPrompt = (industryLabel) => `당신은 wellbian AI입니다. 한국 광고주를 위한 날씨 기반 광고 의사결정 인텔리전스 AI입니다.

규칙:
1. 한국어로만 답변
2. ${industryLabel} 업종 광고주에게 도움이 되는 답변
3. 케이웨더 실시간 데이터 + 60일 예보 기준으로 추천
4. 카피 추천 시 반드시 ① 카피 본문 ② 추천 이유 ③ 매체별 권장 ④ 예상 효과(+%) 포함
5. 광고 의사결정만 추천, 실행은 광고주가 콘솔에서 직접

응답 형식:
- 카피 추천: 짧고 직관적이며 후킹 강하게
- 매체별 권장: 인스타·페북·구글·카카오·네이버 등에서 어떤 채널이 적합한지
- 예상 효과: "+XX%" 형태로

광고주의 질문에 대해 위 형식에 맞게 답변하세요.`;

/* ============================================================
 *  Studio Component
 * ============================================================ */
/* ─── 사이드바 업종 row (이름 + 즐겨찾기 별) ─── */
function IndustryRow({ ind, active, favorite, onSelect, onFavorite }) {
  return (
    <div
      className="flex items-center w-full transition"
      style={{
        background: active ? "rgba(78,179,168,0.10)" : "transparent",
        borderRadius: 10,
        border: active ? `1px solid #4EB3A8` : "1px solid transparent",
      }}
    >
      <button
        onClick={onSelect}
        className="flex-1 min-w-0 text-left transition active:translate-y-px"
        style={{
          color: active ? "#14443B" : "#050038",
          fontSize: 13, fontWeight: active ? 700 : 500,
          padding: "8px 4px 8px 11px",
          background: "transparent", border: "none", cursor: "pointer",
          letterSpacing: "-0.005em",
          display: "flex", alignItems: "center", gap: 8,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 15, flexShrink: 0 }}>{ind.icon}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{ind.label}</span>
      </button>
      <button
        onClick={onFavorite}
        aria-label={favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        className="transition hover:opacity-80 active:translate-y-px"
        style={{
          width: 28, height: 28, marginRight: 4, flexShrink: 0,
          background: "transparent", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: favorite ? "#F5B433" : "#9CA3AF",
          fontSize: 14,
        }}
      >
        {favorite ? "★" : "☆"}
      </button>
    </div>
  );
}

function BrandMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="select-none flex-shrink-0" style={{ display: "block" }}>
      <g stroke="#0091FF" strokeWidth="3.5" strokeLinecap="round">
        <line x1="24" y1="5"  x2="24" y2="12" />
        <line x1="32" y1="16" x2="37" y2="11" />
        <line x1="36" y1="24" x2="43" y2="24" />
        <line x1="32" y1="32" x2="37" y2="37" />
        <line x1="24" y1="36" x2="24" y2="43" />
        <line x1="16" y1="32" x2="11" y2="37" />
        <line x1="13" y1="24" x2="9"  y2="24" />
        <line x1="16" y1="16" x2="11" y2="11" />
      </g>
      <circle cx="2.8" cy="24" r="2" fill="#4EB3A8" />
      <circle cx="24" cy="24" r="8" stroke="#0091FF" strokeWidth="3" />
      <g stroke="#4EB3A8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="19" y1="29" x2="29" y2="19" />
        <polyline points="24,19 29,19 29,24" />
      </g>
    </svg>
  );
}

export default function StudioPage() {
  const [industry, setIndustry] = useState(INDUSTRIES[0].id);
  const [messages, setMessages] = useState([]);  // [{role: "user"|"assistant", content: string}]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSub, setSelectedSub] = useState(null);
  const [geoWeather, setGeoWeather] = useState(null);  // { place, temp, pop, wind, humidity, desc, status }
  const messagesEndRef = useRef(null);

  const currentIndustry = INDUSTRIES.find((i) => i.id === industry) || INDUSTRIES[0];
  const currentSubs = SUBCATEGORIES_BY_INDUSTRY[industry] || [];

  // localStorage 동기화 — favorites
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" && window.localStorage.getItem("wpa_studio_favorites");
      if (stored) setFavorites(JSON.parse(stored));
    } catch (e) { /* ignore */ }
  }, []);
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("wpa_studio_favorites", JSON.stringify(favorites));
      }
    } catch (e) { /* ignore */ }
  }, [favorites]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  // 실제 내 위치 실시간 날씨 (geolocation → 무료 기상 API). 베타: 정식 시 케이웨더 API로 교체
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoWeather({ status: "unsupported" });
      return;
    }
    let cancelled = false;
    setGeoWeather({ status: "loading" });

    const wmoDesc = (code) => {
      if (code === 0) return "맑음";
      if ([1, 2].includes(code)) return "대체로 맑음";
      if (code === 3) return "흐림";
      if ([45, 48].includes(code)) return "안개";
      if ([51, 53, 55, 56, 57].includes(code)) return "이슬비";
      if ([61, 63, 65, 80, 81, 82].includes(code)) return "비";
      if ([66, 67].includes(code)) return "진눈깨비";
      if ([71, 73, 75, 77, 85, 86].includes(code)) return "눈";
      if ([95, 96, 99].includes(code)) return "뇌우";
      return "—";
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        try {
          // 실시간 날씨 + 강수확률 (무료, 키 불필요)
          const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=precipitation_probability&timezone=auto&forecast_days=1`;
          const wxRes = await fetch(wxUrl);
          const wx = await wxRes.json();
          // 역지오코딩 — 동/시군구명 (무료, 키 불필요)
          let place = "내 위치";
          try {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`);
            const geo = await geoRes.json();
            place = [geo.city || geo.locality, geo.locality && geo.city !== geo.locality ? geo.locality : null]
              .filter(Boolean).join(" ") || geo.principalSubdivision || "내 위치";
          } catch (e) { /* 지역명 실패해도 날씨는 표시 */ }

          if (cancelled) return;
          const cur = wx.current || {};
          // 현재 시각 강수확률
          let pop = null;
          if (wx.hourly?.precipitation_probability?.length) {
            const nowH = new Date().getHours();
            pop = wx.hourly.precipitation_probability[nowH] ?? wx.hourly.precipitation_probability[0];
          }
          setGeoWeather({
            status: "ok",
            place,
            temp: cur.temperature_2m != null ? Math.round(cur.temperature_2m * 10) / 10 : null,
            humidity: cur.relative_humidity_2m ?? null,
            wind: cur.wind_speed_10m != null ? Math.round(cur.wind_speed_10m / 3.6 * 10) / 10 : null, // km/h → m/s
            pop,
            desc: wmoDesc(cur.weather_code),
          });
        } catch (e) {
          if (!cancelled) setGeoWeather({ status: "error" });
        }
      },
      () => { if (!cancelled) setGeoWeather({ status: "denied" }); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
    return () => { cancelled = true; };
  }, []);

  // 검색 필터링
  const filteredIndustries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return INDUSTRIES;
    return INDUSTRIES.filter((ind) => {
      if (ind.label.toLowerCase().includes(q)) return true;
      const subs = SUBCATEGORIES_BY_INDUSTRY[ind.id] || [];
      return subs.some((s) => s.toLowerCase().includes(q));
    });
  }, [searchQuery]);

  const favoriteIndustries = useMemo(
    () => INDUSTRIES.filter((ind) => favorites.includes(ind.id)),
    [favorites]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ─── Claude API 호출 (USE_MOCK으로 토글) ─── */
  /* 운영 환경: USE_MOCK=false → /api/claude (Vercel serverless) 호출
     개발 환경: USE_MOCK=true → 미리 정의된 STUDIO_DEMO_BY_INDUSTRY 시뮬레이션 */
  const USE_MOCK = false;  // 실제 운영 시 false, API key 없으면 자동 fallback

  // 온보딩 프로필 로드 (개인화된 시스템 프롬프트용)
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("wpa_profile");
      if (raw) setProfile(JSON.parse(raw));
    } catch (e) { /* localStorage 비활성 무시 */ }
  }, []);

  const sendMessage = useCallback(async (text) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    const newMessages = [...messages, { role: "user", content: messageText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      let reply = null;

      if (!USE_MOCK) {
        /* 🚀 실제 Claude API 호출 (profile 컨텍스트 + 자동 모델 선택) */
        const response = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            industry: selectedSub ? `${currentIndustry.label} · ${selectedSub}` : currentIndustry.label,
            persona: profile?.persona || "광고주",
            profile,  // 온보딩에서 저장한 사업장 컨텍스트 (위치/업종/채널/예산)
            // 실제 내 위치 실시간 날씨 (geolocation) → AI가 현재 날씨 인지
            weatherContext: geoWeather?.status === "ok" ? {
              place: geoWeather.place,
              temp: geoWeather.temp,
              pop: geoWeather.pop,
              wind: geoWeather.wind,
              humidity: geoWeather.humidity,
              desc: geoWeather.desc,
            } : undefined,
            // model 생략 → 서버에서 복잡도 기반 자동 선택 (Haiku/Opus)
            max_tokens: 1024,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `서버 오류 (${response.status})`);
        }

        const data = await response.json();
        reply = data.content;

        if (!reply) {
          throw new Error("AI 응답이 비어 있습니다");
        }
      }

      /* 🧪 MOCK 모드 또는 API 응답 비었을 때 fallback */
      if (!reply) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
        const demos = STUDIO_DEMO_BY_INDUSTRY[industry] || STUDIO_DEMO_BY_INDUSTRY.fashion;
        const demo = demos[Math.floor(Math.random() * demos.length)];
        const metric = demo.liftMetric || "매출";
        const basis = demo.liftBasis || demo.rationale;

        reply = `## ${demo.title}

**추천 카피**
"${demo.copy}"

**추천 이유**
${demo.rationale}

**매체별 권장**
${demo.channels.map((ch) => `· ${ch}: 입찰 +35~50% 권장`).join("\n")}

**예상 ${metric}: ${demo.lift}**

**예측 근거**
${basis}

광고 콘솔에서 직접 적용하실 수 있도록 카피·예산·타이밍을 정리해드렸습니다.`;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("[Studio] sendMessage error:", err);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `죄송합니다. ${err.message || "일시적인 오류가 발생했습니다"}. 잠시 후 다시 시도해주세요.`,
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, industry, currentIndustry, messages, selectedSub]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const handleIndustryChange = (id) => {
    setIndustry(id);
    setSelectedSub(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handleSubcategoryClick = (sub) => {
    setSelectedSub((prev) => (prev === sub ? null : sub));
  };

  return (
    <>
      <Head>
        <title>Studio · Weather Plan AI</title>
        <meta name="description" content="AI 기반 날씨 광고 의사결정 챗봇. 18개 업종 × 162개 세부 카테고리 실시간 추천. 카피·예산·매체 입찰을 한 줄 질문으로." />
        <meta property="og:title" content="Studio · Weather Plan AI 챗봇" />
        <meta property="og:description" content="질문 한 줄로 광고 의사결정. 케이웨더 60일 예보 × wellbian AI." />
      </Head>
      <div style={{ height: "100dvh", overflow: "hidden", background: T.surface, fontFamily: "'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ─── 상단 헤더 ─── */}
      <header
        style={{
          background: T.canvas,
          borderBottom: `1px solid ${T.hairlineSoft}`,
          padding: "12px 16px",
          paddingTop: "calc(12px + env(safe-area-inset-top))",
          position: "sticky", top: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center"
            style={{
              width: 36, height: 36,
              background: T.surface,
              borderRadius: R.md,
              color: T.ink,
              border: `1px solid ${T.hairline}`,
              cursor: "pointer",
            }}
          >
            <Icon name="menu" size={18} stroke={2} />
          </button>
          <a href="/" className="flex items-center gap-2.5">
            <BrandMark size={32} />
            <div className="leading-none">
              <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>
                Weather Plan AI
              </div>
              <div style={{ color: T.steel, fontSize: 11, marginTop: 3, letterSpacing: "0.04em", fontWeight: 500 }}>
                Studio · {currentIndustry.label}
              </div>
            </div>
          </a>
        </div>

        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 transition hover:opacity-70"
          style={{
            background: T.canvas,
            color: T.ink,
            fontSize: 13, fontWeight: 500,
            padding: "7px 12px",
            borderRadius: R.full,
            border: `1px solid ${T.hairline}`,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="plus" size={14} stroke={2.2} />
          새 대화
        </button>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ─── 좌측 사이드바 (16업종 + 추천 질문) ─── */}
        <aside
          className={sidebarOpen ? "fixed inset-0 z-40 md:relative md:w-[280px]" : "hidden md:block md:w-[280px]"}
          style={{
            width: sidebarOpen ? "100vw" : undefined,
            background: T.canvas,
            borderRight: `1px solid ${T.hairlineSoft}`,
            overflowY: "auto",
          }}
        >
          {/* 모바일 닫기 버튼 */}
          {sidebarOpen && (
            <div className="md:hidden flex justify-end p-3">
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  width: 32, height: 32,
                  background: T.surface,
                  borderRadius: R.md,
                  color: T.ink,
                  border: `1px solid ${T.hairline}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Icon name="x" size={16} stroke={2} />
              </button>
            </div>
          )}

          <div style={{ padding: "20px 18px" }} className={sidebarOpen ? "max-w-md mx-auto" : ""}>
            {/* 검색 */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="업종·세부 검색…"
                style={{
                  width: "100%",
                  background: T.surface,
                  color: T.ink,
                  fontSize: 13,
                  fontWeight: 400,
                  padding: "9px 32px 9px 12px",
                  borderRadius: R.md,
                  border: `1px solid ${T.hairlineSoft}`,
                  outline: "none",
                  letterSpacing: "-0.005em",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    width: 20, height: 20, background: "transparent", color: T.steel,
                    border: "none", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                  aria-label="검색 지우기"
                >
                  <Icon name="x" size={14} stroke={2} />
                </button>
              )}
            </div>

            {/* 즐겨찾기 — 검색 비활성 + 항목 있을 때 */}
            {!searchQuery && favoriteIndustries.length > 0 && (
              <>
                <div style={{ color: T.mossDark, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12 }}>★</span> 즐겨찾기
                </div>
                <div className="space-y-1 mb-5">
                  {favoriteIndustries.map((ind) => (
                    <IndustryRow
                      key={`fav-${ind.id}`}
                      ind={ind}
                      active={industry === ind.id}
                      favorite={true}
                      onSelect={() => handleIndustryChange(ind.id)}
                      onFavorite={() => toggleFavorite(ind.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* 전체 업종 (필터링됨) */}
            <div style={{ color: T.steel, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>
              {searchQuery ? `검색 결과 (${filteredIndustries.length})` : "전체 업종"}
            </div>
            <div className="space-y-1 mb-7">
              {filteredIndustries.length === 0 && (
                <div style={{ color: T.muted, fontSize: 12, padding: "12px 4px", textAlign: "center" }}>
                  일치하는 업종이 없습니다.
                </div>
              )}
              {filteredIndustries.map((ind) => {
                const active = industry === ind.id;
                const subs = SUBCATEGORIES_BY_INDUSTRY[ind.id] || [];
                const q = searchQuery.trim().toLowerCase();
                const matchedSubs = q
                  ? subs.filter((s) => s.toLowerCase().includes(q))
                  : subs;
                return (
                  <div key={ind.id}>
                    <IndustryRow
                      ind={ind}
                      active={active}
                      favorite={favorites.includes(ind.id)}
                      onSelect={() => handleIndustryChange(ind.id)}
                      onFavorite={() => toggleFavorite(ind.id)}
                    />
                    {/* 서브카테고리 — 활성화 시 또는 검색 매칭 시 노출 */}
                    {(active || (searchQuery && matchedSubs.length > 0)) && matchedSubs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5" style={{ padding: "6px 11px 6px 32px" }}>
                        {matchedSubs.map((sub) => {
                          const subActive = active && selectedSub === sub;
                          return (
                            <button
                              key={sub}
                              onClick={() => {
                                if (!active) handleIndustryChange(ind.id);
                                handleSubcategoryClick(sub);
                              }}
                              className="transition active:translate-y-px"
                              style={{
                                background: subActive ? T.mossDark : T.surface,
                                color: subActive ? "#FFFFFF" : T.charcoal,
                                fontSize: 11, fontWeight: subActive ? 600 : 500,
                                padding: "3px 9px",
                                borderRadius: R.full,
                                border: `1px solid ${subActive ? T.mossDark : T.hairlineSoft}`,
                                cursor: "pointer",
                                letterSpacing: "-0.005em",
                              }}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 추천 질문 5개 */}
            <div style={{ color: T.steel, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>
              추천 질문
            </div>
            <div className="space-y-1.5">
              {currentIndustry.questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    sendMessage(q);
                    setSidebarOpen(false);
                  }}
                  className="w-full text-left transition hover:bg-white"
                  style={{
                    background: T.surface,
                    color: T.charcoal,
                    fontSize: 13, fontWeight: 400, lineHeight: 1.5,
                    padding: "9px 12px",
                    borderRadius: R.lg,
                    border: `1px solid ${T.hairlineSoft}`,
                    cursor: "pointer",
                    wordBreak: "keep-all",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* 내 위치 실시간 날씨 패널 */}
            <div className="mt-7" style={{
              background: T.surface,
              border: `1px solid ${T.hairlineSoft}`,
              borderRadius: R.xxl,
              padding: "14px 16px",
            }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: T.mossDark, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>
                  📍 {geoWeather?.status === "ok" ? geoWeather.place : "내 위치"}
                </span>
                <span style={{ color: T.steel, fontSize: 10, fontWeight: 500 }}>
                  {geoWeather?.status === "ok" ? "실시간" : geoWeather?.status === "loading" ? "확인 중…" : "권한 필요"}
                </span>
              </div>
              {geoWeather?.status === "ok" ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { icon: "thermometer", label: "기온",  value: geoWeather.temp != null ? `${geoWeather.temp}℃` : "—" },
                      { icon: "droplets",    label: "강수",  value: geoWeather.pop != null ? `${geoWeather.pop}%` : "—" },
                      { icon: "wind",        label: "풍속",  value: geoWeather.wind != null ? `${geoWeather.wind}` : "—" },
                    ].map((s) => (
                      <div key={s.label} style={{ background: T.canvas, borderRadius: R.md, padding: "8px 6px" }}>
                        <div style={{ color: T.mossDark, marginBottom: 4, display: "flex", justifyContent: "center" }}>
                          <Icon name={s.icon} size={14} stroke={2} />
                        </div>
                        <div style={{ color: T.ink, fontSize: 12, fontWeight: 700 }}>{s.value}</div>
                        <div style={{ color: T.steel, fontSize: 10, fontWeight: 500, marginTop: 1 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {geoWeather.desc && geoWeather.desc !== "—" && (
                    <div style={{ color: T.steel, fontSize: 11, fontWeight: 500, textAlign: "center", marginTop: 8 }}>
                      {geoWeather.desc} · 습도 {geoWeather.humidity}%
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: T.muted, fontSize: 11, fontWeight: 400, lineHeight: 1.55, textAlign: "center", padding: "6px 4px" }}>
                  {geoWeather?.status === "loading"
                    ? "위치 확인 중입니다…"
                    : "브라우저 위치 권한을 허용하면 내 위치의 실시간 날씨가 표시됩니다."}
                </div>
              )}
            </div>

            <div className="mt-5 text-center">
              <p style={{ color: T.muted, fontSize: 11, fontWeight: 400, lineHeight: 1.55 }}>
                wellbian AI<br />
                케이웨더 60일 예보 기준
              </p>
            </div>
          </div>
        </aside>

        {/* ─── 중앙 대화창 ─── */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, minHeight: 0 }}>

          {/* 대화 영역 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>
            <div className="max-w-3xl mx-auto">

              {messages.length === 0 ? (
                /* 빈 상태: 환영 메시지 + 추천 질문 4개 */
                <div className="text-center py-12">
                  <div style={{
                    width: 56, height: 56,
                    margin: "0 auto 18px",
                    background: T.mossDark,
                    color: "#FFFFFF",
                    borderRadius: R.lg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name="cloud" size={28} stroke={1.8} />
                  </div>
                  <h1 style={{
                    color: T.ink, fontSize: "clamp(22px, 3vw, 28px)",
                    fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.3,
                    marginBottom: 8,
                  }}>
                    {currentIndustry.label} 광고주를 위한<br />
                    <span style={{ color: T.mossDark }}>wellbian AI</span>
                  </h1>
                  <p style={{ color: T.slate, fontSize: 14, fontWeight: 400, lineHeight: 1.6, marginBottom: 24 }}>
                    날씨·시즌·트렌드를 결합한 광고 의사결정을 도와드립니다.<br />
                    자유롭게 물어보세요.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                    {currentIndustry.questions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(q)}
                        className="text-left transition hover:bg-white active:translate-y-px"
                        style={{
                          background: T.canvas,
                          color: T.charcoal,
                          fontSize: 13, fontWeight: 400, lineHeight: 1.5,
                          padding: "12px 14px",
                          borderRadius: R.lg,
                          border: `1px solid ${T.hairlineSoft}`,
                          cursor: "pointer",
                          wordBreak: "keep-all",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>

                  <p className="mt-5" style={{ color: T.muted, fontSize: 11, fontWeight: 400, lineHeight: 1.55 }}>
                    더 많은 질문은 <span className="md:hidden">왼쪽 ≡ 메뉴</span><span className="hidden md:inline">좌측 사이드바</span>에서 보실 수 있습니다.
                  </p>
                </div>
              ) : (
                /* 대화 메시지 리스트 */
                <div className="space-y-5">
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                  ))}
                  {loading && <LoadingBubble />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* 입력 영역 */}
          <div style={{
            borderTop: `1px solid ${T.hairlineSoft}`,
            background: T.canvas,
            padding: "22px 16px calc(18px + env(safe-area-inset-bottom)) 16px",
          }}>
            <div className="max-w-3xl mx-auto">
              {/* 내 위치 실시간 날씨 바 — geolocation 기반 */}
              {geoWeather?.status === "ok" && (
                <div
                  className="flex items-center gap-2.5 mb-2.5 flex-wrap"
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.hairlineSoft}`,
                    borderRadius: R.full,
                    padding: "6px 14px",
                    fontSize: 12, fontWeight: 500, color: T.charcoal,
                    width: "fit-content",
                  }}
                >
                  <span style={{ color: T.mossDark, fontWeight: 700, letterSpacing: "-0.005em" }}>
                    📍 {geoWeather.place}
                  </span>
                  <span style={{ width: 1, height: 11, background: T.hairline }} />
                  {geoWeather.temp != null && (
                    <span className="flex items-center gap-1">
                      <Icon name="thermometer" size={12} stroke={2} /> {geoWeather.temp}℃
                    </span>
                  )}
                  {geoWeather.pop != null && (
                    <span className="flex items-center gap-1">
                      <Icon name="droplets" size={12} stroke={2} /> {geoWeather.pop}%
                    </span>
                  )}
                  {geoWeather.wind != null && (
                    <span className="flex items-center gap-1">
                      <Icon name="wind" size={12} stroke={2} /> {geoWeather.wind}m/s
                    </span>
                  )}
                  {geoWeather.desc && geoWeather.desc !== "—" && (
                    <span style={{ color: T.steel }}>· {geoWeather.desc}</span>
                  )}
                  <span style={{ color: T.muted, fontSize: 10, fontWeight: 500 }}>실시간</span>
                </div>
              )}
              <div
                className={`nl-shine flex items-center gap-2 ${loading || input.trim() ? "nl-shine-active" : ""}`}
                style={{
                  background: T.canvas,
                  borderRadius: R.xxl,
                  padding: "6px 6px 6px 16px",
                  border: `1px solid ${T.hairlineSoft}`,
                  boxShadow: "0 1px 2px rgba(5,0,56,0.04)",
                }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={`${currentIndustry.label}${selectedSub ? " · " + selectedSub : ""} 광고에 대해 물어보세요…`}
                  disabled={loading}
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    color: T.ink, fontSize: 14, fontWeight: 400,
                    paddingTop: 8, paddingBottom: 8,
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="transition disabled:opacity-40 active:translate-y-px"
                  style={{
                    background: `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)`,
                    color: T.onPrimary,
                    fontSize: 13, fontWeight: 500,
                    padding: "8px 14px",
                    borderRadius: R.full,
                    flexShrink: 0,
                    cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", gap: 5,
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.22)",
                      "inset 0 -1px 0 rgba(0,0,0,0.22)",
                    ].join(", "),
                  }}
                >
                  <Icon name="send" size={13} stroke={2.2} />
                  보내기
                </button>
              </div>
              <p style={{ color: T.muted, fontSize: 11, fontWeight: 400, lineHeight: 1.6, marginTop: 8, textAlign: "center" }}>
                wellbian AI는 광고 의사결정을 추천합니다. 실행은 광고주가 광고 콘솔에서 직접 진행하세요.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
    </>
  );
}

/* ─── 메시지 버블 ─── */
function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      // fallback (구형 브라우저): textarea + execCommand
      const ta = document.createElement("textarea");
      ta.value = message.content;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1800); }
      catch (e2) {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="flex" style={{ justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "85%", position: "relative" }}>
        <div
          style={{
            background: isUser ? T.mossDark : T.canvas,
            color: isUser ? "#FFFFFF" : T.ink,
            borderRadius: R.xxl,
            padding: "12px 16px",
            fontSize: 14, fontWeight: 400, lineHeight: 1.65,
            border: isUser ? "none" : `1px solid ${T.hairlineSoft}`,
            boxShadow: isUser
              ? "0 2px 6px rgba(20,68,59,0.2)"
              : "0 1px 2px rgba(5,0,56,0.04)",
            whiteSpace: "pre-wrap",
            wordBreak: "keep-all",
          }}
        >
          {!isUser && (
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5" style={{ color: T.mossDark }}>
                <Icon name="sparkles" size={11} stroke={2} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                  wellbian AI
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="transition hover:opacity-80 active:translate-y-px"
                style={{
                  background: copied ? T.tealLight : T.surface,
                  color: copied ? T.mossDark : T.steel,
                  fontSize: 11, fontWeight: 600,
                  padding: "3px 9px",
                  borderRadius: R.full,
                  border: `1px solid ${copied ? T.brandTeal : T.hairlineSoft}`,
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                  letterSpacing: "-0.005em",
                }}
                aria-label="복사"
              >
                {copied ? (
                  <>
                    <Icon name="check" size={11} stroke={2.5} />
                    복사됨
                  </>
                ) : (
                  <>
                    <Icon name="copy" size={11} stroke={2} />
                    복사
                  </>
                )}
              </button>
            </div>
          )}
          {formatMessageV2(message.content)}
        </div>
      </div>
    </div>
  );
}

/* ─── 로딩 버블 ─── */
function LoadingBubble() {
  return (
    <div className="flex" style={{ justifyContent: "flex-start" }}>
      <div style={{
        background: T.canvas,
        borderRadius: R.xxl,
        padding: "14px 18px",
        border: `1px solid ${T.hairlineSoft}`,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6, height: 6,
              background: T.mossDark,
              borderRadius: R.full,
              animation: `loadingDot 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
        <style>{`
          @keyframes loadingDot {
            0%, 80%, 100% { opacity: 0.3; }
            40% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}


/* \u2500\u2500\u2500 \uC778\uB77C\uC778 **bold** \uD30C\uC11C \u2500\u2500\u2500 */
function inline(text) {
  if (typeof text !== "string") return text;
  const parts = [];
  let last = 0;
  const re = /\*\*([^*\n]+)\*\*/g;
  let m;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={`b${key++}`} style={{ color: T.ink, fontWeight: 600 }}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 1 ? parts : text;
}

/* \u2500\u2500\u2500 \uBE14\uB85D \uD30C\uC11C: text \u2192 \uBE14\uB85D \uBC30\uC5F4 \u2500\u2500\u2500 */
/* 인라인 미니 차트 (bar/line) — wellbian 엔진 흡수 */
function InlineChart({ type, title, data, unit }) {
  if (!data || data.length < 2) return null;
  const W = 320, H = 130, PL = 28, PR = 10, PT = 22, PB = 26;
  const cW = W - PL - PR, cH = H - PT - PB;
  const vals = data.map((d) => d.v);
  const vMax = Math.max(...vals, 1);
  const vMin = Math.min(...vals, 0);
  const range = Math.max(vMax - vMin, 1);
  const yScale = (v) => PT + cH - ((v - vMin) / range) * cH;
  const xStep = data.length > 1 ? cW / (data.length - 1) : cW;
  const xBar = cW / data.length;
  const accent = T.mossDark;
  const accentLight = T.brandTeal;

  return (
    <div style={{
      margin: "10px 0",
      borderRadius: 12,
      background: T.canvas,
      border: `1px solid ${T.brandTeal}`,
      padding: "10px 4px 4px",
      boxShadow: "0 0 0 3px rgba(78,179,168,0.14), 0 6px 18px rgba(20,68,59,0.18)",
      overflow: "hidden",
    }}>
      {title && (
        <div style={{
          color: T.steel, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
          padding: "0 12px 6px",
        }}>
          {title}
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {/* y-축 grid */}
        {[0, 0.5, 1].map((p, i) => {
          const y = PT + cH * p;
          const v = vMin + range * (1 - p);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke={T.hairlineSoft} strokeWidth="0.5" />
              <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="8.5" fill={T.muted}>
                {Math.round(v)}{unit && unit.length <= 2 ? unit : ""}
              </text>
            </g>
          );
        })}
        {/* 데이터 */}
        {type === "bar" ? (
          data.map((d, i) => {
            const barW = Math.max(xBar * 0.62, 8);
            const x = PL + i * xBar + (xBar - barW) / 2;
            const y = yScale(d.v);
            const h = (PT + cH) - y;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={h} rx="3"
                  fill={`url(#chartGrad-${i % 2})`} />
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={accent}>
                  {d.v}{unit && unit.length <= 2 ? unit : ""}
                </text>
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="9" fill={T.steel}>
                  {d.l}
                </text>
              </g>
            );
          })
        ) : (
          <>
            {/* line — 영역 + 점 */}
            <path
              d={`M${PL},${yScale(data[0].v)} ` + data.slice(1).map((d, i) =>
                `L${PL + (i + 1) * xStep},${yScale(d.v)}`).join(" ")}
              fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
            {data.map((d, i) => {
              const cx = PL + i * xStep;
              const cy = yScale(d.v);
              return (
                <g key={i}>
                  <circle cx={cx} cy={cy} r="3.5" fill={accent} stroke={T.canvas} strokeWidth="1.5" />
                  <text x={cx} y={cy - 7} textAnchor="middle" fontSize="9" fontWeight="700" fill={accent}>
                    {d.v}
                  </text>
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize="9" fill={T.steel}>
                    {d.l}
                  </text>
                </g>
              );
            })}
          </>
        )}
        <defs>
          <linearGradient id="chartGrad-0" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor={accentLight} />
          </linearGradient>
          <linearGradient id="chartGrad-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor={accentLight} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function parseBlocks(text) {
  const lines = text.split("\n");
  const blocks = [];
  let cur = null;
  const flush = () => { if (cur) { blocks.push(cur); cur = null; } };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === "") { flush(); continue; }

    if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "header", text: line.replace("## ", "") });
      continue;
    }
    // 인라인 차트: <<chart:타입|제목|라벨1:값1,...|단위>>
    const chartMatch = line.match(/^<<chart:(bar|line)\|([^|]*)\|([^|]+)\|?([^>]*)>>$/);
    if (chartMatch) {
      flush();
      const [, type, title, dataStr, unit] = chartMatch;
      const data = dataStr.split(",").map((s) => {
        const parts = s.trim().split(":");
        return { l: (parts[0] || "").trim(), v: parseFloat(parts[1]) || 0 };
      }).filter((d) => d.l);
      if (data.length >= 2) {
        blocks.push({ type: "chart", chartType: type, title, data, unit: (unit || "").trim() });
        continue;
      }
    }
    if (/^\*\*[^*]{1,30}\*\*$/.test(line)) {
      flush();
      blocks.push({ type: "subheader", text: line.replace(/\*\*/g, "") });
      continue;
    }
    if (line.startsWith("|") && line.endsWith("|") && line.length > 2) {
      if (/^\|[\s\-:|]+\|$/.test(line)) continue;
      if (!cur || cur.type !== "table") { flush(); cur = { type: "table", rows: [] }; }
      cur.rows.push(line.split("|").slice(1, -1).map((c) => c.trim()));
      continue;
    }
    const chk = line.match(/^[-\u2022]?\s*\[([ xX])\]\s+(.+)$/);
    if (chk) {
      if (!cur || cur.type !== "checklist") { flush(); cur = { type: "checklist", items: [] }; }
      cur.items.push({ checked: chk[1].toLowerCase() === "x", text: chk[2] });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (!cur || cur.type !== "numbered") { flush(); cur = { type: "numbered", items: [] }; }
      cur.items.push(line.replace(/^\d+\.\s+/, ""));
      continue;
    }
    if (/^[-\u2022\u00B7*]\s+/.test(line)) {
      if (!cur || cur.type !== "bullet") { flush(); cur = { type: "bullet", items: [] }; }
      cur.items.push(line.replace(/^[-\u2022\u00B7*]\s+/, ""));
      continue;
    }
    if (line.startsWith(">")) {
      if (!cur || cur.type !== "callout") { flush(); cur = { type: "callout", lines: [] }; }
      cur.lines.push(line.replace(/^>\s?/, ""));
      continue;
    }
    if (!cur || cur.type !== "paragraph") { flush(); cur = { type: "paragraph", lines: [] }; }
    cur.lines.push(rawLine);
  }
  flush();
  return blocks;
}

/* \u2500\u2500\u2500 \uBE14\uB85D \uB80C\uB354\uB7EC v2: text \u2192 JSX (header/subheader/table/bullet/numbered/checklist/callout/paragraph) \u2500\u2500\u2500 */
function formatMessageV2(text) {
  const blocks = parseBlocks(text);
  return blocks.map((b, i) => {
    const k = `blk-${i}`;
    switch (b.type) {
      case "header":
        return (
          <div key={k} style={{ fontSize: 18, fontWeight: 700, color: T.mossDark, letterSpacing: "-0.01em", marginBottom: 8, marginTop: i > 0 ? 14 : 0 }}>
            {b.text}
          </div>
        );
      case "subheader":
        return (
          <div key={k} style={{ fontSize: 11, fontWeight: 700, color: T.steel, letterSpacing: "0.08em", marginTop: i > 0 ? 12 : 0, marginBottom: 4 }}>
            {b.text}
          </div>
        );
      case "paragraph":
        return (
          <div key={k} style={{ marginBottom: 6 }}>
            {b.lines.map((l, j) => <div key={j} style={{ marginBottom: 2 }}>{inline(l) || "\u00A0"}</div>)}
          </div>
        );
      case "bullet":
        return (
          <ul key={k} style={{ marginBottom: 8, marginTop: 2, paddingLeft: 2 }}>
            {b.items.map((it, j) => (
              <li key={j} style={{ paddingLeft: 18, position: "relative", marginBottom: 3, listStyle: "none" }}>
                <span style={{ position: "absolute", left: 4, top: 0, color: T.mossDark, fontWeight: 700 }}>{"\u00B7"}</span>
                {inline(it)}
              </li>
            ))}
          </ul>
        );
      case "numbered":
        return (
          <ol key={k} style={{ marginBottom: 8, marginTop: 2, paddingLeft: 2 }}>
            {b.items.map((it, j) => (
              <li key={j} style={{ paddingLeft: 24, position: "relative", marginBottom: 4, listStyle: "none" }}>
                <span style={{ position: "absolute", left: 0, top: 0, fontWeight: 700, color: T.mossDark, fontSize: 13 }}>{j + 1}.</span>
                {inline(it)}
              </li>
            ))}
          </ol>
        );
      case "checklist":
        return (
          <div key={k} style={{ marginBottom: 8, marginTop: 2 }}>
            {b.items.map((it, j) => (
              <div key={j} className="flex items-start gap-2" style={{ marginBottom: 5 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: it.checked ? T.mossDark : "transparent",
                  border: `1.5px solid ${it.checked ? T.mossDark : T.hairline}`,
                  color: "#FFFFFF",
                  fontSize: 10, fontWeight: 800,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  marginTop: 3, flexShrink: 0,
                }}>
                  {it.checked && "\u2713"}
                </span>
                <span style={{ flex: 1, color: it.checked ? T.steel : T.ink, textDecoration: it.checked ? "line-through" : "none" }}>
                  {inline(it.text)}
                </span>
              </div>
            ))}
          </div>
        );
      case "chart":
        return <InlineChart key={k} type={b.chartType} title={b.title} data={b.data} unit={b.unit} />;
      case "callout":
        return (
          <div key={k} style={{
            background: T.tealLight,
            borderLeft: `3px solid ${T.mossDark}`,
            borderRadius: 8,
            padding: "9px 13px",
            margin: "8px 0",
            fontSize: 13,
            color: T.charcoal,
            lineHeight: 1.55,
          }}>
            {b.lines.map((l, j) => <div key={j}>{inline(l)}</div>)}
          </div>
        );
      case "table": {
        if (b.rows.length === 0) return null;
        const [header, ...body] = b.rows;
        return (
          <div key={k} style={{ margin: "8px 0", overflowX: "auto", borderRadius: 10, border: `1px solid ${T.brandTeal}`, background: T.canvas, boxShadow: "0 0 0 3px rgba(78,179,168,0.18), 0 6px 18px rgba(20,68,59,0.22), 0 2px 4px rgba(20,68,59,0.12)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {header.map((h, ci) => (
                    <th key={ci} style={{
                      padding: "8px 11px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.mossDark,
                      letterSpacing: "0.06em",
                      borderBottom: `1px solid ${T.hairlineSoft}`,
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: ri === body.length - 1 ? "none" : `1px solid ${T.hairlineSoft}` }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: "7px 11px", color: T.ink, fontWeight: 500, letterSpacing: "-0.005em" }}>
                        {inline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      default:
        return null;
    }
  });
}
