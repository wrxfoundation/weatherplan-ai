/**
 * Weather Plan AI · powered by wellbian AI
 * ─────────────────────────────────────────────
 * v5 — 시그니처 컬러 옐로우 → 청록(brand-teal) 전환 · 글라스 두께감 강화
 *
 *  · 폰트 weight: 400 · 500 · 600 만 사용 (700/800 금지)
 *  · 시그니처 컬러: brand-teal (옐로우 제거 — 촌스러움)
 *  · primary CTA: 검정 pill ({rounded.full}) + 글라스 두께감 (inset highlights + outer shadows)
 *  · 파스텔 포스트잇 카드: teal/coral/rose/lavender ({rounded.xxxl} 28px)
 *  · 글라스모피즘 적용: Nav (두께감 강화) · 모든 버튼 · Hero NL input · AI Agent 내부 카드
 *  · section spacing: 96px(섹션) · 64px(가격 비교)
 *  · Nav 높이: 80px (위아래 여백 확보)
 *
 *  카피 원칙 (PRD v0.3)
 *  · 외부 데이터 출처(기상청/AirKorea/AccuWeather/S-DOT 등) 노출 0건 → "케이웨더"로 흡수
 *  · 전문 용어(RMSE/POD/CSI/MCP/OAuth) 외부 노출 0건 → 광고주 친화어로
 *  · "Claude" 단어 노출 0건 → 모두 wellbian AI
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";

/* ═════════════════════════════════════════════════════════════
   0.  DESIGN TOKENS  (Miro DESIGN.md)
   ═════════════════════════════════════════════════════════════ */

const T = {
  /* canvas & surface */
  canvas:           "#FFFFFF",
  surface:          "#F7F5EE",   // 따뜻한 off-white
  surfaceSoft:      "#FAFAF6",
  surfacePricing:   "#E7E3FF",   // pale lavender — featured pricing
  hairline:         "#E5E1D6",
  hairlineSoft:     "#EFEBE0",
  hairlineStrong:   "#C9C5B7",

  /* text */
  inkDeep:          "#050038",   // Miro signature dark navy
  ink:              "#0F0A2E",
  charcoal:         "#2D2A4A",
  slate:            "#6B6781",
  steel:            "#8E8AA3",
  stone:            "#A5A2B8",
  muted:            "#B8B5C8",
  onDark:           "#FFFFFF",
  onDarkMuted:      "rgba(255,255,255,0.62)",

  /* brand */
  primary:          "#050038",
  onPrimary:        "#FFFFFF",
  charcoalPressed:  "#1F1A48",

  brandBlue:        "#4262FF",
  bluePressed:      "#2D47D8",
  navy:             "#1E3A8A",       // 깊은 남색 (습도용)
  navyLight:        "#DBE5FA",       // 연한 남색 배경

  brandCoral:       "#FF6850",
  coralLight:       "#FFE0D6",
  coralDark:        "#8B2C16",

  brandRose:        "#F4C8C8",
  roseLight:        "#FBE4E4",

  brandTeal:        "#4EB3A8",
  tealLight:        "#CDEEE8",
  mossDark:         "#14443B",

  /* semantic */
  successAccent:    "#1FAB6A",
  brandRed:         "#FFE3E3",

  /* footer */
  footerBg:         "#050038",
};

const R = {
  xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, xxxl: 28, feature: 32, full: 9999,
};

/* ═════════════════════════════════════════════════════════════
   1.  DATA  (광고주 친화 카피)
   ═════════════════════════════════════════════════════════════ */

const SAMPLE_QUERIES = [
  "강남 카페, 주말 장마 광고 어떻게?",
  "에어컨 본사, 열대야 7일 전국 광고",
  "장마 전 우산 광고 준비",
  "대행사 AE, 빙수 광고주 폭염 정리",
  "공기청정기 셀러, 미세먼지 광고 추천",
];

/* 글로벌 광고주 9개 — 케이웨더 + AI 붙였다면 추가 효과 가상 시뮬레이션
   (기존 글로벌 실적 + wellbian AI 적용 시 추가 ROI 추정치) */
const BRAND_BOOST_SIMULATION = {
  "BMW": {
    industry: "자동차 · 4륜구동",
    original: { label: "ROI", value: "16:1", desc: "기존 글로벌 4륜구동 광고 (강설·강수 트리거)" },
    boost: {
      label: "ROI 추가",
      value: "+24%",
      newValue: "20:1",
      reason: "한국 지리 미세 보정 — 영동·강원 적설 패턴, 수도권 빙판 위험 동 단위 정밀화로 시승 신청 +28%",
    },
    levers: [
      "동 단위 적설량 예측 (5분 갱신)",
      "영동·강원 산간 가중치 1.5배",
      "주차장 빙판 위험 + 시승센터 5km 반경 매칭",
    ],
  },
  "코카콜라": {
    industry: "음료 · 자판기",
    original: { label: "더운 날 판매", value: "검증", desc: "자판기 온도 기반 가격·광고 변동" },
    boost: {
      label: "매출 추가",
      value: "+38%",
      newValue: "검증 → 정량화",
      reason: "한국 자판기 위치 30,000여개 측정망과 매칭. 폭염 시 지하철역·관광지 반경 200m 자판기에만 광고 집중",
    },
    levers: [
      "전국 자판기 위치 × 케이웨더 측정망 매칭",
      "폭염 7일째 객단가 +24% 시점 정밀 트리거",
      "오피스·관광지·캠핑지 시간대별 분리",
    ],
  },
  "맥도날드": {
    industry: "패스트푸드 · 글로벌",
    original: { label: "여름 메뉴", value: "검증", desc: "더운 날 아이스크림·콜드 음료 광고 부스팅" },
    boost: {
      label: "매출 추가",
      value: "+52%",
      newValue: "검증 → 정량화",
      reason: "한국 빙수·아이스크림 검색 폭증 패턴 학습. 폭염 8일째부터 매장 5km 반경 광고 +40%로 ROAS 3.2배",
    },
    levers: [
      "폭염 8일 연속 진입 시점 자동 감지",
      "체감온도 33℃+ 시간대 정밀 광고 노출",
      "매장 5km 반경 + 인스타 골든타임 매칭",
    ],
  },
  "P&G": {
    industry: "Pantene · 헤어케어",
    original: { label: "Walgreens 매장 매출", value: "+24%", desc: "습도·온도로 머리에 나쁜 날 자동 감지" },
    boost: {
      label: "매출 추가",
      value: "+31%",
      newValue: "+55%",
      reason: "한국 장마 습도 90%+ 8시간 연속 패턴이 글로벌 평균보다 길어 검색 폭증. 올리브영·H&B 매장 반경 매칭",
    },
    levers: [
      "장마 습도 90% 연속 8시간 자동 트리거",
      "올리브영 850개 매장 위치 매칭",
      "수도권·남부 장마 진입 시점 차이 보정",
    ],
  },
  "Nike": {
    industry: "스포츠 · 아웃도어",
    original: { label: "맑은 주말 매출", value: "검증", desc: "주말 맑음 + 야외 액티비티 광고" },
    boost: {
      label: "ROAS 추가",
      value: "+42%",
      newValue: "검증 → 정량화",
      reason: "한국 주말 맑음 + 한강·도림천 러닝 코스 + 등산 시즌 정밀 매칭. 인스타 노출 시간대 17~22시 집중",
    },
    levers: [
      "주말 맑음 D-2 사전 광고 시작",
      "한강·등산 명소 5km 반경 매칭",
      "러닝화·트레일 카테고리 자동 분리",
    ],
  },
  "KIA": {
    industry: "자동차 OEM · 한국",
    original: { label: "광고 효율", value: "CTR ×3", desc: "DV360 + 날씨 시그널 통합 광고" },
    boost: {
      label: "CTR 추가",
      value: "+18%",
      newValue: "CTR ×3.5",
      reason: "한국 시장 28년 예보관 검수 + 60일 예보로 신차 출시·시승 타이밍 정밀 보정. 시승 신청 전환률 +22%",
    },
    levers: [
      "60일 예보로 신차 광고 타이밍 사전 결정",
      "전국 매장 200+ 위치 × 지역 날씨 매칭",
      "시승 신청 → 영업 리드 자동 분류",
    ],
  },
  "Heineken": {
    industry: "맥주 · 글로벌",
    original: { label: "주말 매출", value: "+17%", desc: "주말 맑음 22℃+ 야외 바·테라스 광고" },
    boost: {
      label: "매출 추가",
      value: "+27%",
      newValue: "+44%",
      reason: "한국 폭염 7일+에서 객단가 +24% 폭증 패턴 학습. 치맥·배달 골든타임 18:30~21:00 정밀 매칭",
    },
    levers: [
      "폭염 7일째부터 객단가 폭증 시점 트리거",
      "치맥 키워드 +180% 검색 시점 자동",
      "배민·쿠팡이츠 5km 반경 자동 매칭",
    ],
  },
  "Stella Artois": {
    industry: "사과주 · 시드르",
    original: { label: "시즌 YoY", value: "+65.6%", desc: "18℃ 이상 + 햇빛 트리거 디스플레이" },
    boost: {
      label: "매출 추가",
      value: "+19%",
      newValue: "+85%",
      reason: "한국 5~6월 18℃ 진입 + 외식 시즌 정밀 매칭. 야외 테라스 매장 5km 반경 인스타 노출 집중",
    },
    levers: [
      "기온 18℃ 진입 + 일조시간 5시간+ 동시 트리거",
      "야외 테라스 매장 위치 매칭",
      "주말 점심·저녁 시간대 정밀 노출",
    ],
  },
  "Pantene": {
    industry: "헤어 · P&G",
    original: { label: "매장 매출", value: "+24%", desc: "습도·온도 머리에 나쁜 날 감지 → 쿠폰" },
    boost: {
      label: "매출 추가",
      value: "+33%",
      newValue: "+57%",
      reason: "한국 장마 + 미세먼지 동시 발생 시 헤어 손상 검색 +220% 폭증 패턴 학습. 올리브영·CJ올리브영 매칭",
    },
    levers: [
      "습도 90% + 미세먼지 75㎍ 동시 발생 트리거",
      "올리브영 매장 + 자사몰 동시 매칭",
      "샴푸·트리트먼트 카테고리 자동 분리",
    ],
  },
};

const RULE_MATRIX = {
  "강남 카페, 주말 장마 광고 어떻게?": {
    persona: "자영업",
    confidence: 0.92,
    workspace: "우리 카페 (강남구)",
    summary: "이번 주말은 비 올 확률 78%. 카페 입장에서 광고를 잠시 멈출 게 아니라 \"비 오니까 우리 카페로 오세요\" 메시지로 바꿔서 운영하시는 게 좋습니다. 7일간 약 5,000만원 예산 기준 권장 결과입니다.",
    skillScore: 87,
    rules: [
      { axis: "언제",     title: "이번 주말 토·일 집중",       trigger: "주말 강수확률 78% 8시간 연속 예측",     tint: "teal" },
      { axis: "어디서",   title: "강남구 5km 반경",            trigger: "역삼·삼성·청담동 사용자만 노출 권장",   tint: "lavender" },
      { axis: "어떻게",   title: "비 오는 날 메시지로 전환",     trigger: "인스타·페북에서 평소 +25% 입찰 권장",   tint: "coral" },
      { axis: "얼마",     title: "주말 분배 5,000만원",         trigger: "토·일 균등 + 점심·저녁 골든타임 가중",   tint: "rose" },
    ],
    creative: "비 오는 주말 강남, 5분 거리. 따뜻한 아메리카노 + 마들렌 9,900원.",
    channels: ["인스타그램", "페이스북"],
    channelStrategy: [
      { ch: "인스타그램", bidUp: "+25%", target: "강남 5km 반경 25~45세", time: "토·일 점심 12~14시 · 저녁 18~22시", format: "릴스 우선 (스토리 보조)" },
      { ch: "페이스북",   bidUp: "+15%", target: "강남구 거주 + 카페 관심사",   time: "주말 종일 운영",                     format: "캐러셀 (메뉴 사진 3종)" },
    ],
    lift: "+38%", liftMetric: "매장 매출", liftBasis: "장마 시즌 카페 방문 +22% (KOBACO) × 위치 5km 반경 매칭 +16%p",
  },
  "에어컨 본사, 열대야 7일 전국 광고": {
    persona: "대형광고주",
    confidence: 0.94,
    workspace: "쿨링·생활가전 본부",
    summary: "열대야(밤 25℃+)가 7일 연속 예측되는 시점입니다. 평소 대비 광고 입찰을 +60% 권장합니다. 보통 폭염 7일째부터 객단가가 +24% 올라가는 패턴이라, 이때 전국 광고를 집중하는 게 효율적입니다. 본사 차원에서 4채널 동시 운영을 추천드립니다.",
    skillScore: 91,
    rules: [
      { axis: "언제",    title: "열대야 7일 연속 예측",        trigger: "최저기온 25℃ × 7일 진입 시점",          tint: "teal" },
      { axis: "어디서",  title: "수도권·남부 가중",            trigger: "열대야 더 심한 지역 1.5배 가중 권장",    tint: "lavender" },
      { axis: "어떻게",  title: "4채널 동시 권장 (본사 운영)",   trigger: "구글·메타·카카오·네이버 입찰 +60% 권장", tint: "coral" },
      { axis: "신뢰도",  title: "정확도 91점 — 권장 강도 높음",  trigger: "케이웨더 60일 예보 기준",               tint: "rose" },
    ],
    creative: "오늘 밤도 26℃. 7일째 잠 못 드는 밤, 1시간이면 시원해집니다.",
    channels: ["메타", "구글 광고", "카카오 모먼트", "네이버 GFA"],
    channelStrategy: [
      { ch: "메타",         bidUp: "+60%", target: "전국 30~50대 + 가전 관심사", time: "저녁 19~23시 집중",      format: "릴스 + 카루셀" },
      { ch: "구글 광고",    bidUp: "+50%", target: "에어컨·선풍기 키워드",       time: "종일 + 폭염 알람 시 가중",  format: "검색 + 디스플레이" },
      { ch: "카카오 모먼트", bidUp: "+45%", target: "지역구별 30~60대",          time: "저녁 18~22시",           format: "비즈보드 + 디스플레이" },
      { ch: "네이버 GFA",    bidUp: "+55%", target: "에어컨 검색 이력 + 지역",    time: "종일",                  format: "검색광고 + GFA" },
    ],
    lift: "+54%", liftMetric: "전국 매출", liftBasis: "폭염 7일+ 객단가 +24% (소상공인진흥공단) × 4채널 동시 운영 도달 +30%p",
  },
  "장마 전 우산 광고 준비": {
    persona: "이커머스 셀러",
    confidence: 0.91,
    workspace: "Rainy SKUs",
    summary: "장마 시작 7일 전부터 우산·레인부츠 검색이 +280% 폭증합니다. 이때 검색광고 입찰을 평소 대비 +60% 올려두시면 그 첫 트래픽을 잡을 수 있습니다. 검색광고와 디스플레이를 나눠서 운영하는 게 효율적입니다.",
    skillScore: 84,
    rules: [
      { axis: "언제",    title: "장마 시작 7일 전 진입",        trigger: "케이웨더가 매년 장마 개시 시점 예측",        tint: "teal" },
      { axis: "무엇을",  title: "우산·레인부츠·우비",            trigger: "내 상품 카테고리 자동 매칭",                tint: "lavender" },
      { axis: "어떻게",  title: "검색 + 디스플레이 분리 권장",    trigger: "검색광고 +60% / 디스플레이 +30% 권장",      tint: "coral" },
      { axis: "보너스",  title: "안경 김서림·통풍 키워드 추가",   trigger: "장마철 검색 폭증 키워드 함께 운영",          tint: "rose" },
    ],
    creative: "장마 D-7. 안경 김서림 없는 우산, 미리 챙기세요.",
    channels: ["구글 검색광고", "네이버 GFA", "네이버 검색광고"],
    channelStrategy: [
      { ch: "구글 검색광고",   bidUp: "+60%", target: "우산·레인부츠·우비 키워드", time: "장마 D-7부터 24시간",   format: "검색광고 (인기 키워드 풀)" },
      { ch: "네이버 검색광고", bidUp: "+60%", target: "장마 관련 검색 키워드",    time: "장마 시작 시점부터 7일",  format: "파워링크 + 쇼핑검색" },
      { ch: "네이버 GFA",     bidUp: "+30%", target: "20~50대 + 패션·생활 관심사",  time: "오전·저녁 출퇴근 시간",   format: "디스플레이 + 동영상" },
    ],
    lift: "+44%", liftMetric: "구매 전환율", liftBasis: "장마 D-7 우산·레인부츠 검색 +280% (네이버) → 검색→구매 전환율 +44%",
  },
  "대행사 AE, 빙수 광고주 폭염 정리": {
    persona: "광고대행사 AE",
    confidence: 0.95,
    workspace: "디저트 카테고리 (3개 광고주)",
    summary: "체감온도 33℃ 8일 연속 폭염 시점입니다. 광고주별로 지역·예산이 달라도 케이웨더 트리거 1세트로 일괄 운영 가능합니다. 본사 광고주는 전국 +40%, 지역 가맹점주는 매장 5km 반경 +50%, 신생 빙수 셀러는 메타 릴스 +35% 권장합니다. AE 한 명이 광고주 5~10개 운영 시 운영 시간 80% 감소.",
    skillScore: 89,
    rules: [
      { axis: "언제",     title: "폭염 8일 연속 진입",            trigger: "체감 33℃ × 8일 (신뢰구간 80%)",         tint: "teal" },
      { axis: "광고주별", title: "본사·가맹점·신생 셀러 분기",     trigger: "예산 규모·운영 채널별 자동 매칭",          tint: "lavender" },
      { axis: "어떻게",   title: "광고주 3개 동시 추천",            trigger: "각 광고주별 채널·예산·카피 한 번에 정리",  tint: "coral" },
      { axis: "리포트",   title: "AE 일간 보고용 요약",            trigger: "광고주 카톡 보고용 핵심 요약 자동 생성",   tint: "rose" },
    ],
    creative: "8일째 폭염. 강남 거리 35℃, 가장 가까운 빙수 5분 거리.",
    channels: ["메타", "카카오 모먼트", "구글 로컬"],
    channelStrategy: [
      { ch: "메타",         bidUp: "+40%", target: "강남·송파 거주 20~40대",     time: "오후 14~21시 폭염 시간대",  format: "릴스 (빙수 영상)" },
      { ch: "카카오 모먼트", bidUp: "+35%", target: "강남·송파 동 단위 거주민",   time: "점심·저녁",              format: "비즈보드 + 위치 기반" },
      { ch: "구글 로컬",     bidUp: "+30%", target: "근처 빙수 검색 사용자",      time: "체감 33℃+ 시간대",       format: "구글 맵 광고 + 검색" },
    ],
    lift: "+58%", liftMetric: "매장 매출 (3 광고주 합산)", liftBasis: "체감 33℃+ 8일 디저트 매출 +42% × 광고주 3개 동시 트리거 +16%p",
  },
  "공기청정기 셀러, 미세먼지 광고 추천": {
    persona: "이커머스 셀러",
    confidence: 0.93,
    workspace: "공기·생활가전",
    summary: "초미세먼지 75㎍ 넘는 지역에서만 공기청정기·마스크 광고를 운영하시는 게 효율적입니다. 평소 대비 ROAS가 4.1배입니다. 1시간 단위로 케이웨더 측정망 갱신값을 보내드리면 그때 광고를 켜시면 됩니다.",
    skillScore: 91,
    rules: [
      { axis: "언제",    title: "PM2.5 75㎍ 초과 시",              trigger: "케이웨더 18개 대기질 시그널 기준",        tint: "teal" },
      { axis: "어디서",  title: "초과 지역 시·군·구만",            trigger: "전국 동단위 필터링 권장",            tint: "lavender" },
      { axis: "무엇을",  title: "공기청정기·마스크·필터 분기",      trigger: "내 상품 카테고리 자동 매칭",              tint: "coral" },
      { axis: "신뢰도",  title: "정확도 91점 — 권장 강도 높음",     trigger: "AirKorea + 케이웨더 측정망 교차검증",      tint: "rose" },
    ],
    creative: "오늘 초미세먼지 92㎍. 집에 들이는 첫 공기, 30분 무료 체험.",
    channels: ["네이버 GFA", "쿠팡 광고", "카카오 모먼트"],
    channelStrategy: [
      { ch: "네이버 GFA",   bidUp: "+50%", target: "PM2.5 75㎍+ 시·군·구",       time: "평일 점심 + 퇴근 후",     format: "검색 + 디스플레이 동시" },
      { ch: "쿠팡 광고",     bidUp: "+45%", target: "공기청정기·필터 카테고리",   time: "PM2.5 임계 초과 시 즉시", format: "상품 광고 (익일 배송 강조)" },
      { ch: "카카오 모먼트", bidUp: "+35%", target: "30~50대 가족 단위 거주",     time: "저녁 18~22시",          format: "비즈보드 + 디스플레이" },
    ],
    lift: "+47%", liftMetric: "광고 ROAS", liftBasis: "PM2.5 75㎍+ 시 평소 대비 ROAS ×4.1배 (Dyson Air 글로벌 사례 검증)",
  },
};

const PERSONAS = [
  {
    id: "enterprise",
    tint: "teal",
    badge: "프로 · 엔터프라이즈",
    title: "대형광고주 · 대기업",
    examples: "현대차 · LG전자 · 삼성 · 코웨이 · 아모레",
    pain: "60일 앞 시즌 MD와 광고가 어긋남. 매대·광고 동기화 불가",
    solution: "케이웨더 60일 예보로 시즌 MD·광고 한 곳에서. AI 의사결정 제안.",
    metric: "월 광고비 5천만원 이상",
    scenario: {
      context: "월요일 09:14 · 강남 본사 · 폭염 D-7 진입 시점",
      question: "다음 주 폭염 예보인데, SUV 라인업 시승 광고 어떻게 잡을까요?",
      copy: "에어컨 풀로 켜야 하는 날, 차박 시승 D-3 사전 예약.",
      trigger: "폭염 7일 연속 + 주말 맑음 100% — SUV 4륜 검색 +180% 패턴 진입",
      channels: [
        { name: "네이버 GFA",  bid: "+35%", target: "30-44 남" },
        { name: "인스타그램",  bid: "+28%", target: "전국 · 4륜 관심" },
        { name: "카카오 모먼트", bid: "+22%", target: "강남 · 분당" },
      ],
      outcomeLabel: "시승 신청 전환율",
      outcomeValue: "+47%",
      outcomeBasis: "폭염 7일+ 4륜 검색 + 매장 5km 매칭 (BMW xDrive 글로벌 검증)",
    },
  },
  {
    id: "franchise",
    tint: "coral",
    badge: "그로스",
    title: "프랜차이즈 · 중견 광고주",
    examples: "도미노 · 교촌 · BBQ · 스타벅스 · 무신사",
    pain: "매일 일기예보 보고 카카오·네이버 광고 손으로 조정",
    solution: "한 줄이면 4채널 동시 권장 결과. 카피·예산·타이밍 추천. 운영 시간 80% 감소.",
    metric: "월 광고비 500만 ~ 5천만원",
    scenario: {
      context: "수요일 14:22 · 본사 마케팅실 · 장마 D-3 진입 시점",
      question: "이번 주 장마 예보, 치킨 배달 광고 어떻게 강화하나요?",
      copy: "비 오는 저녁, 30분이면 따끈하게. 첫 배달 무료 쿠폰.",
      trigger: "장마 D-3 진입 + 저녁 시간대 — 배달 검색 +220% (KOBACO)",
      channels: [
        { name: "카카오 모먼트", bid: "+40%", target: "전국 · 저녁 18-22시" },
        { name: "인스타그램",   bid: "+32%", target: "20-39 통합" },
        { name: "배달 앱 광고",  bid: "+25%", target: "비 예보 지역" },
      ],
      outcomeLabel: "배달 매출",
      outcomeValue: "+58%",
      outcomeBasis: "장마 + 저녁 시간대 배달 객단가 +58% (한국 외식업 통계)",
    },
  },
  {
    id: "seller",
    tint: "lavender",
    badge: "그로스",
    title: "이커머스 · 플랫폼 셀러",
    examples: "쿠팡 · 11번가 · G마켓 · 네이버 스토어",
    pain: "카테고리 수십 개를 1~3명이 운영. 카테고리별 날씨 매칭 방치",
    solution: "카테고리 매칭 추천. 패션은 한파 패딩, 식품은 동시에 보양식.",
    metric: "월 광고비 100만 ~ 5천만원",
    scenario: {
      context: "화요일 11:00 · 송파 사무실 · 폭염 D-3 진입 시점",
      question: "여름 매트리스 광고, 폭염 ROAS 어떻게 늘리나요?",
      copy: "오늘 잠 못 든 분께 — 쿨링 매트리스 7일 체험.",
      trigger: "열대야 5일 연속 + 수면 검색 폭증 — 쿨링 매트리스 +210%",
      channels: [
        { name: "쿠팡 광고",   bid: "+38%", target: "30-49 · 침실 키워드" },
        { name: "네이버 스토어", bid: "+30%", target: "전국 · 수면" },
        { name: "메타 광고",    bid: "+24%", target: "30-45 여성" },
      ],
      outcomeLabel: "쿠팡 매출",
      outcomeValue: "+42%",
      outcomeBasis: "열대야 5일+ 수면 검색 폭증 → 쿨링 매트리스 매출 +42%",
    },
  },
  {
    id: "smb",
    tint: "yellow",
    badge: "스타터",
    title: "자영업 · 1인 사장님",
    examples: "동네 카페 · 미용실 · 1인 의류몰",
    pain: "광고 도구가 너무 복잡해서 거의 운영 못함",
    solution: "카톡 메시지처럼 한 줄. '비 올 때 광고 어떻게?' → 카피·예산·타이밍 답변.",
    metric: "월 광고비 10만 ~ 100만원",
    scenario: {
      context: "금요일 08:45 · 강남 매장 · 체감 33°C 진입",
      question: "이번 주말 폭염인데 카페 광고 어떻게 잡으면 좋을까요?",
      copy: "체감 33°C. 차가운 첫 잔, 가장 가까운 매장 5분.",
      trigger: "체감온도 33°C+ 8일 연속 — 디저트·음료 검색 +180% (네이버)",
      channels: [
        { name: "인스타그램",   bid: "+30%", target: "강남 5km · 20-34" },
        { name: "카카오 모먼트", bid: "+24%", target: "강남 · 점심·오후" },
        { name: "네이버 GFA",   bid: "+20%", target: "강남 · 음식 관심" },
      ],
      outcomeLabel: "매장 매출",
      outcomeValue: "+34%",
      outcomeBasis: "체감 33°C+ 8일 디저트·음료 매출 +42% (소상공인진흥공단)",
    },
  },
];

const HOW_STEPS = [
  {
    n: "01",
    title: "사업장·상품 등록",
    desc: "어떤 매장이고 어떤 상품을 파는지, 어느 광고 채널을 쓰시는지만 알려주세요. 카카오 모먼트·네이버 GFA·메타·구글 광고 중 선택.",
    detail: "3분 · 광고 계정 권한 불필요",
  },
  {
    n: "02",
    title: "한국어 한 줄로 물어보기",
    desc: '"이번 주말 장마인데 어떻게 광고할까요?" — wellbian AI가 카피·예산·타이밍·채널 추천 결과를 만들어드립니다.',
    detail: "자연어 입력 · 5초",
  },
  {
    n: "03",
    title: "추천 결과 → 광고 콘솔로 1클릭",
    desc: "케이웨더가 100+ 시그널을 5분마다 살펴봅니다. 조건이 맞으면 추천 알람이 오고, 광고 콘솔로 바로 이동해 1분이면 적용할 수 있습니다.",
    detail: "광고 의사결정 + 광고 콘솔 이동",
  },
];

const TRIGGER_CATALOG = [
  {
    name: "날씨",
    count: 32, tint: "teal",
    items: ["기온", "체감온도", "강수량", "강수확률", "적설", "풍속", "돌풍", "풍향", "습도", "기압", "구름량", "일조시간", "안개", "시정거리"],
  },
  {
    name: "대기질 · 꽃가루",
    count: 18, tint: "coral",
    items: ["미세먼지", "초미세먼지", "오존", "이산화질소", "이산화황", "통합 대기질", "황사", "꽃가루(참나무)", "꽃가루(소나무)", "꽃가루(잡초)"],
  },
  {
    name: "케이웨더 13가지 생활기상지수",
    count: 13, tint: "rose",
    items: ["자외선", "체감온도", "감기", "식중독", "대기정체", "천식", "꽃가루 농도", "강수", "뇌우", "빙판", "건조", "자외선 화상", "열지수"],
  },
  {
    name: "시즌 · 기간",
    count: 12, tint: "lavender",
    items: ["폭염 연속일수", "한파 연속일수", "장마 시작·종료", "황사 시즌", "꽃가루 시즌", "단풍 시기", "벚꽃 개화", "첫 추위", "첫눈"],
  },
];

const PRICING = [
  {
    tier: "스타터", price: "₩9,900", period: "/월",
    quota: "광고 추천 결과 월 100건",
    for: "자영업 · 1인 사장님",
    features: ["광고 채널 2개", "한국어 한 줄 입력", "일·월 광고비 한도", "정확도 점수 가드"],
    badge: "베타 무료",
  },
  {
    tier: "그로스", price: "₩29,000", period: "/월",
    quota: "광고 추천 결과 월 500건",
    for: "프랜차이즈 · 셀러",
    features: ["광고 채널 5개", "카테고리 자동 분류", "추천 결과 즉시 발행", "정확도 점수 공개"],
    highlight: true,
    badge: "베타 무료",
  },
  {
    tier: "프로", price: "₩99,000", period: "/월",
    quota: "광고 추천 결과 월 1,000건",
    for: "중견 광고주",
    features: ["광고 채널 무제한", "AI 의사결정 제안", "케이웨더 60일 예보", "성과 검증 리포트"],
    badge: "베타 무료",
  },
  {
    tier: "엔터프라이즈", price: "영업팀 문의", period: "",
    quota: "무제한",
    for: "대기업 · 대행사",
    features: ["AI 비서 연동 무제한", "60일 예보 직접 호출", "글로벌 5,400+ 도시 날씨", "맞춤 SLA", "전담 솔루션 엔지니어", "전담 전문 예보관"],
    dark: true,
  },
];


/* ─── 라이브 날씨 패널 — 캠페인 mock 데이터 (lift는 캠페인별 핵심 지표) ─── */
const CAMPAIGN_MOCK = [
  { id: "c1", name: "강남 카페 비 오는 날",   region: "서울 강남구",   t: 17.2, pop: 78, pm25: 28, status: "ON",       lift: "+38%", liftMetric: "매장 매출" },
  { id: "c2", name: "열대야 일주일 쿨링가전",  region: "전국",          t: 27.8, pop: 18, pm25: 32, status: "STANDBY",  lift: "-",     liftMetric: "—" },
  { id: "c3", name: "장마 우산 검색광고",     region: "수도권",        t: 22.8, pop: 55, pm25: 21, status: "ON",       lift: "+44%", liftMetric: "구매 전환율" },
  { id: "c4", name: "폭염 빙수 강남·송파",    region: "서울 강남·송파",  t: 32.1, pop: 8,  pm25: 45, status: "STANDBY",  lift: "-",     liftMetric: "—" },
  { id: "c5", name: "황사 마스크 호흡기",     region: "전국",          t: 18.6, pop: 12, pm25: 92, status: "ON",       lift: "+27%", liftMetric: "광고 ROAS" },
];

const MAP_CITIES = [
  { code: "11", name: "서울",  x: 245, y: 145, t: 17, sky: "흐림",   pop: 65 },
  { code: "28", name: "인천",  x: 215, y: 145, t: 16, sky: "비",     pop: 80 },
  { code: "41", name: "수원",  x: 250, y: 168, t: 18, sky: "흐림",   pop: 55 },
  { code: "30", name: "대전",  x: 263, y: 235, t: 19, sky: "구름",   pop: 30 },
  { code: "29", name: "광주",  x: 232, y: 312, t: 21, sky: "맑음",   pop: 15 },
  { code: "27", name: "대구",  x: 314, y: 264, t: 22, sky: "맑음",   pop: 10 },
  { code: "26", name: "부산",  x: 333, y: 310, t: 23, sky: "맑음",   pop: 5 },
  { code: "31", name: "울산",  x: 354, y: 282, t: 22, sky: "맑음",   pop: 8 },
  { code: "42", name: "강릉",  x: 320, y: 152, t: 14, sky: "흐림",   pop: 60 },
  { code: "50", name: "제주",  x: 195, y: 415, t: 24, sky: "맑음",   pop: 0 },
];

/* ─── 컨텐츠 제작 카드 — 광고주 입력·AI 응답 mock ─── */
/* STUDIO 업종 18종 — wellbian 본진 영감으로 pet·solo 추가 (글로벌 사례 16종과 정렬 일부 다름) */
const STUDIO_INDUSTRIES = [
  { id: "fashion",    label: "패션·의류",         icon: "shirt" },
  { id: "beauty",     label: "뷰티·H&B",          icon: "sparkles" },
  { id: "beverage",   label: "음료·주류",          icon: "wine" },
  { id: "retail",     label: "리테일·이커머스",     icon: "shopping-bag" },
  { id: "auto",       label: "자동차",            icon: "car" },
  { id: "health",     label: "헬스·OTC",          icon: "heart" },
  { id: "home",       label: "홈·인테리어",         icon: "home" },
  { id: "appliance",  label: "가전",              icon: "plug" },
  { id: "sleep",      label: "수면·침구",         icon: "moon" },
  { id: "food",       label: "식음·외식",         icon: "utensils" },
  { id: "travel",     label: "여행·DOOH",         icon: "plane" },
  { id: "outdoor",    label: "아웃도어",           icon: "mountain" },
  { id: "finance",    label: "금융·보험",         icon: "shield" },
  { id: "edu",        label: "교육·구독",         icon: "book-open" },
  { id: "ent",        label: "엔터·콘텐츠",         icon: "play" },
  { id: "telco",      label: "통신·구독",         icon: "wifi" },
  { id: "pet",        label: "반려·펫",            icon: "heart" },
  { id: "solo",       label: "1인 가구·솔로 케어",  icon: "user" },
];

const STUDIO_DEMO_BY_INDUSTRY = {
  fashion: {
    userBrief: "여성 패션 브랜드입니다. 장마 시즌 우천 대응 광고 카피 부탁드려요.",
    rationale: "장마 D-7 진입 · 강수확률 78% 7일 연속 예측 × 우산·레인부츠 검색 +280%, 워킹화 검색 -34% × 경쟁사 3곳 모두 '비 오는 날 코디' 캠페인 진행 중(메타 광고 라이브러리 분석) × 작년 동기 객단가 +18%(셋업 구매 증가). 차별 포인트: 경쟁사는 '비 회피 코디'에 집중, 우리는 '비 오는 날도 예쁜 코디' 톤으로 차별화. 인스타 릴스 + 네이버 GFA 골든타임 18~22시 집중.",
    copies: [
      { copy: "장마 7일 연속 예보. 방수 트렌치 + 워싱 데님 함께 사면 119,000원.",
        why: "장마 일수 명시 + 셋업 가격 = 단품 비교 차단. 작년 셋업 구매 객단가 +18% 데이터 기반. 경쟁사 단품 광고 대비 우리는 셋업으로 명확히 차별.",
        expectedLift: "+58%", channels: ["인스타그램", "네이버 GFA"] },
      { copy: "비 오는 출근룩. 9 to 6 안 젖고 안 망가지는 출근룩 코디. 사이즈 미리 받기.",
        why: "출근 시간(9~6)·페인 포인트(안 젖고·안 망가지는) 명시. '사이즈 미리 받기' = 사전 주문 유도로 재고 회전. 인스타 릴스 골든타임 17~22시 운영.",
        expectedLift: "+44%", channels: ["인스타그램", "카카오 모먼트"] },
      { copy: "장마 베스트 5종. 첫 구매 적립금 1만원 + 다음 시즌 신상 5% 우선 알람.",
        why: "할인 X 적립 + 다음 시즌 신상 알람 = LTV·CRM 동시. 우리 회원이 다음 시즌에도 우리에게 오게 만드는 락인 전략.",
        expectedLift: "+34%", channels: ["인스타그램"] },
    ],
  },
  beauty: {
    userBrief: "화장품 브랜드입니다. 자외선 강해지는 5~6월 선크림 광고 카피 부탁합니다.",
    rationale: "전국 UV 지수 6+ 진입 (5~6월 평균 21일) × 선크림 검색 +180%, 톤업 키워드 +60%, '여드름 안 나는 선크림' +95% × 한국 여성 SPF 인식: SPF50+가 절대 기준선, 'PA+++' 표기 필수 × 올리브영 매장 노출 + 인스타 인플루언서 후기 콤보 = 전환률 평균 2.3배 × 경쟁사 7곳 중 5곳은 '톤업'에만 집중, 우리는 '여드름 안 남'·'민감성도 OK' 두 추가 축으로 차별화 가능.",
    copies: [
      { copy: "오늘 자외선 6단계. SPF50+ PA++++ 톤업 선크림, 여드름성·민감성 모두 OK.",
        why: "오늘 UV 수치 + SPF50+/PA++++ 표기 풀셋 + 여드름성·민감성 차별화 메시지 (경쟁사 80%가 못 하는 포인트). 검색 키워드 7개 동시 매칭.",
        expectedLift: "+62%", channels: ["인스타그램", "올리브영"] },
      { copy: "모공 위에 안 끼는 선크림. 토너 + 선크림 듀오 세트, 18,900원.",
        why: "모공 위에 안 낀다 = 한국 여성 1차 페인 포인트. 단품 → 듀오 세트로 객단가↑. 카카오톡 채널 가입 시 샘플 증정 → CRM 연결.",
        expectedLift: "+47%", channels: ["인스타그램", "쿠팡 광고"] },
      { copy: "오늘 자외선 강해요. 인증샷 1장 = 10% 쿠폰 + 인기 인플루언서 협찬 응모.",
        why: "UGC 인증 + 인플루언서 협찬 응모 = 신뢰 콘텐츠 + 바이럴 동시. 인스타 자연 노출 비용 절감.",
        expectedLift: "+38%", channels: ["인스타그램", "유튜브 쇼츠"] },
    ],
  },
  beverage: {
    userBrief: "맥주 브랜드입니다. 폭염 일주일 연속일 때 광고 카피 추천해주세요.",
    rationale: "폭염 D-3 진입 · 8일 연속 33℃+ 예측 × 맥주 검색 +320%, 치맥/배달 +180%, 무알콜 +110% × 폭염 7일째부터 객단가 +24% (지난 3년 OB·하이트 데이터) × 배민·쿠팡이츠 골든타임: 평일 18:30~21:00, 주말 17:00~22:30 × 매장 광고는 지하철역 5km 반경이 ROAS 3.2배 × 캠핑·홈 BBQ 키워드가 7일째부터 폭증 → 안주 페어링 카피로 객단가 추가 확보.",
    copies: [
      { copy: "8일째 폭염. 차가운 라거 6캔 + 1캔 사은, 저녁 6시 30분부터 30분 배달.",
        why: "수치(8일·6+1·30분) 풀셋 + 골든타임 정확 매칭(18:30~). 작년 동일 시점 ROAS 3.4배 검증.",
        expectedLift: "+62%", channels: ["배민/쿠팡이츠", "카카오 모먼트"] },
      { copy: "치킨 + 시원한 캔맥 4종, 평일 저녁 패키지 19,900원. 19~21시 한정.",
        why: "치맥 번들 → 객단가 ₩20K. 19~21시 한정 = 회전율 + FOMO. 폭염 평일 저녁 = 외출 부담 → 배달 폭증 시점.",
        expectedLift: "+51%", channels: ["배민/쿠팡이츠", "메타"] },
      { copy: "폭염 8일째 안주 페어링. 시원한 라거 + 매콤 쥐포·새우깡 함께.",
        why: "한국 여름 안주 1순위(쥐포·새우깡) 매칭. 셋업 가격 명시 X = 매장 자율 판매로 마진 보호. 인스타·유튜브 시청 시간대 골든타임.",
        expectedLift: "+39%", channels: ["인스타그램", "유튜브"] },
    ],
  },
  retail: {
    userBrief: "대형 슈퍼마켓 체인입니다. 기온 +3℃ BBQ 시즌 진입 시 카피 부탁합니다.",
    rationale: "주말 평균기온 23℃ × BBQ 검색 +210% × 캠핑 키워드 +130%. 카테고리는 명확하게, 가격은 묶음으로. 단품 가격은 비교 대상이 많음.",
    copies: [
      { copy: "이번 주말 BBQ 시즌 개막. 삼겹살 + 양념갈비 1kg 한 상 차림, 29,900원.",
        why: "1kg 셋업 = 가족 단위 객단가. 단품 가격 비교가 어려워 가격 저항 낮음.",
        expectedLift: "+57%", channels: ["네이버 GFA", "카카오 모먼트"] },
      { copy: "맑은 주말 캠핑 준비. 신선 식재 + 즉석 양념 패키지, 무료 배달.",
        why: "맑은 날씨 = 캠핑 출발 행동 트리거. 무료 배달이 결제 전환 핵심.",
        expectedLift: "+44%", channels: ["네이버 GFA", "메타"] },
      { copy: "기온 +3℃ 주말. 매장 BBQ 코너 50% 적립. 영업시간 10~22시.",
        why: "할인 대신 적립으로 마진 보호 + 매장 방문 시간대 명시.",
        expectedLift: "+36%", channels: ["카카오 모먼트", "당근마켓"] },
    ],
  },
  auto: {
    userBrief: "수입차 딜러입니다. 여름 휴가 시즌 SUV 광고 카피 만들어주세요.",
    rationale: "전국 휴가철 진입 × SUV 검색 +180% × 시승 신청 +35%. 휴가지 캠핑·해변 트렌드 매칭. 차종 명시, 시승 예약은 원클릭.",
    copies: [
      { copy: "여름 휴가 SUV 시승 예약. 평일 30분 단위, 캠핑 사은품 증정.",
        why: "휴가 시즌 + 캠핑 사은품 → 시승 동기 강함. 영업 리드 직접 연결.",
        expectedLift: "+56%", channels: ["네이버 GFA", "구글 광고"] },
      { copy: "장마·폭우에도 안정적인 4륜구동. 시승 + 시승료 5만원 환급.",
        why: "장마 시즌 안전 키워드 직격 + 시승료 환급으로 진입 장벽 0.",
        expectedLift: "+44%", channels: ["네이버 GFA", "카카오 모먼트"] },
      { copy: "가족 휴가 7인승 SUV. 무이자 60개월, 매월 49만원.",
        why: "가족 휴가 = 7인승 검색 폭증 시점. 월 결제 부담 명시.",
        expectedLift: "+32%", channels: ["메타", "구글 광고"] },
    ],
  },
  health: {
    userBrief: "알레르기 약 OTC 브랜드입니다. 봄 꽃가루 시즌 광고 카피 부탁드려요.",
    rationale: "전국 꽃가루 카운트 임계 진입 × 알러지·재채기 검색 +340% × 안구건조 키워드 +180%. 증상 → 약효 → 빠른 효과 순. 신뢰도 강조.",
    copies: [
      { copy: "오늘 꽃가루 매우 많음. 알러지 약, 30분 안에 효과 시작.",
        why: "오늘 수치 + 효과 발현 시간(30분) 명시. 즉시 행동 유발.",
        expectedLift: "+59%", channels: ["네이버 GFA", "카카오 모먼트"] },
      { copy: "재채기·콧물·눈 가려움. 알러지 약 + 안약 패키지, 약국에서.",
        why: "3대 증상 나열 + 패키지 객단가↑. 약국 방문 = 추가 구매 유도.",
        expectedLift: "+41%", channels: ["네이버 GFA", "구글 광고"] },
      { copy: "꽃가루 알람 ON. 미리 챙겨두는 알러지 약, 1+1 첫 구매.",
        why: "사전 구매 유도 → 시즌 매출 분산. 1+1로 재고 회전.",
        expectedLift: "+34%", channels: ["쿠팡 광고", "네이버 GFA"] },
    ],
  },
  home: {
    userBrief: "인테리어 셀러입니다. 장마 시즌 집콕 카피 부탁드립니다.",
    rationale: "장마 D-3 × 인테리어 검색 +160% × 집콕·홈데코 키워드 +220%. 큰 가구는 결정 부담↑, 소품·조명 객단가가 더 잘 팔림.",
    copies: [
      { copy: "장마철 집콕. 무드 조명 + 디퓨저 세트, 한 번에 39,000원.",
        why: "객단가 4만원 이하 = 즉시 구매 가능 가격대. 무드 키워드 직격.",
        expectedLift: "+48%", channels: ["인스타그램", "네이버 GFA"] },
      { copy: "비 오는 주말 홈카페. 우든 트레이 + 머그 4종, 무료배송.",
        why: "홈카페 키워드 = 인스타 인증 욕구. 무료배송 결제 전환률↑.",
        expectedLift: "+39%", channels: ["인스타그램", "카카오 모먼트"] },
      { copy: "장마 D-3. 제습 인테리어 소품 베스트 10. 적립금 5,000원.",
        why: "기능성(제습) + 데코 동시. 베스트 큐레이션으로 의사결정 부담 줄임.",
        expectedLift: "+31%", channels: ["네이버 GFA", "메타"] },
    ],
  },
  appliance: {
    userBrief: "공기청정기 브랜드입니다. 미세먼지 75 넘으면 광고 카피 부탁합니다.",
    rationale: "서울 PM2.5 92㎍ (매우 나쁨) 진입 D-day × 공기청정기 검색 +410%, 30평형 키워드 +260%, '한 대로 거실+안방' +180% × 한국 평균 아파트 = 30평 표준 → 30평형이 검색량 최대 × 익일 배송 표기 시 전환률 2.7배 (쿠팡 vs 일반 쇼핑몰) × 경쟁사 80%는 가격 광고 → 우리는 '평형·배송 시간·필터 유지비'로 차별화 × 오피스 직장인 골든타임: 평일 12~14시(점심) + 18~22시(퇴근 후).",
    copies: [
      { copy: "오늘 초미세먼지 92㎍ 매우 나쁨. 30평 한 대로 커버, 오늘 주문 시 내일 도착.",
        why: "오늘 수치(92㎍·매우 나쁨 등급) + 30평 1대 커버 + 익일 배송 풀셋. 점심·퇴근 골든타임 운영으로 ROAS 2.7배.",
        expectedLift: "+74%", channels: ["쿠팡 광고", "네이버 스토어"] },
      { copy: "필터 1년 무상 교체. 공기청정기 + 1년치 필터 4종 패키지 199,000원.",
        why: "1년 유지비 0원 = 가격 비교 우위. 셋업 객단가 ₩200K → 가전 카테고리 표준 객단가 1.4배.",
        expectedLift: "+57%", channels: ["쿠팡 광고", "G마켓"] },
      { copy: "초미세먼지 75↑일 때만 광고. 1년 평균 67일, 평일 점심·퇴근 노출 집중.",
        why: "메타 인사이트: 미세먼지 광고는 평소 노출하면 ROAS 1.2배, 75㎍ 트리거하면 4.1배. 광고비 효율 극대화.",
        expectedLift: "+42%", channels: ["메타", "구글 광고"] },
    ],
  },
  sleep: {
    userBrief: "매트리스 브랜드입니다. 열대야 시즌 쿨링 매트리스 광고 카피 부탁드려요.",
    rationale: "전국 열대야 D-7 × 쿨링 매트리스 검색 +280% × 잠 못 드는 밤 키워드 +160%. 가격이 부담스러운 카테고리 → 무이자 + 100일 체험.",
    copies: [
      { copy: "오늘 밤도 26℃. 잠 못 드는 7일째, 쿨링 매트리스 100일 체험.",
        why: "수치(26℃, 7일) + 100일 체험 = 가격 부담 0. 매트리스 결제 장벽 제거.",
        expectedLift: "+63%", channels: ["인스타그램", "유튜브"] },
      { copy: "열대야 베개·요·매트 풀세트. 무이자 12개월, 매월 16,000원.",
        why: "셋업 객단가↑ + 무이자 → 월 결제 부담 명시. 가족 결정 쉬워짐.",
        expectedLift: "+47%", channels: ["메타", "네이버 GFA"] },
      { copy: "열대야 일주일 예보. 쿨링 베개 + 시원한 패드 세트 99,000원.",
        why: "사전 구매 유도 + 객단가 10만원 이하 = 의사결정 빠름.",
        expectedLift: "+38%", channels: ["쿠팡 광고", "네이버 스토어"] },
    ],
  },
  food: {
    userBrief: "강남 카페 사장입니다. 비 오는 주말 인스타 광고 카피 만들어주세요.",
    rationale: "강남 강수확률 78% 8시간 연속 × 주말 외출 의향 -15% × 따뜻한 음료 검색 +40%, 디저트 검색 +60% × 강남역 5번 출구 반경 500m 카페 27곳 중 우리 차별 포인트: 실내 자리 24석(평균 12석), 콘센트 18곳(평균 4곳) × 인스타 골든타임: 점심 12~14시 + 비 오는 날 14~17시 두 피크 × 객단가 ₩6,500 → 셋업으로 ₩9,900(+52%) 끌어올리는 게 핵심.",
    copies: [
      { copy: "비 오는 강남, 5분 거리. 아메리카노 + 마들렌 9,900원 / 콘센트 24석.",
        why: "거리·가격·메뉴 + 실내 차별 포인트(콘센트 24석). 27곳 중 우리만의 강점 = 가격 비교 차단. 마진 32% 확보.",
        expectedLift: "+56%", channels: ["인스타그램", "네이버 GFA"] },
      { copy: "오늘 비. 라떼 1+1 + 디저트 30% 할인, 14~17시 한정.",
        why: "한산 시간(14~17시) 회전율 + 1+1로 객단가 유지 + 디저트 30% = 추가 구매 유도. 인스타 노출 골든타임과 정확히 매칭.",
        expectedLift: "+44%", channels: ["인스타그램", "페이스북"] },
      { copy: "비 오는 강남 5분 거리. 음료 주문 시 5,000원 적립 + 다음 주 비 오면 알림.",
        why: "적립 + 다음 주 비 알림 = 한 번 방문 → 다음 비 오는 날 자동 트래픽. 케이웨더 트리거로 알림 추천.",
        expectedLift: "+38%", channels: ["인스타그램"] },
    ],
  },
  travel: {
    userBrief: "여행 예약 플랫폼입니다. 장마 시즌 호캉스 광고 카피 부탁드려요.",
    rationale: "전국 장마 7일 연속 × 호캉스 검색 +320% × 도심 호텔 키워드 +180%. 비 오는 주말 = 외출 부담↑, 가까운 호캉스가 정답.",
    copies: [
      { copy: "장마 7일 연속. 강남 5성급 호캉스, 1박 18만원 + 조식 포함.",
        why: "수치(7일) + 가격 + 조식 포함. 호캉스 의사결정 완전 케어.",
        expectedLift: "+58%", channels: ["인스타그램", "네이버 GFA"] },
      { copy: "비 오는 주말 호텔 룸서비스. 강남·잠실 호텔 +5만원 식음 크레딧.",
        why: "외출 0회 + 룸서비스 = 비 오는 날 정답. 식음 크레딧 객단가↑.",
        expectedLift: "+43%", channels: ["인스타그램", "카카오 모먼트"] },
      { copy: "장마 시즌 도심 호텔 30% 할인. 무료 취소 24시간 전까지.",
        why: "할인 + 무료 취소 = 의사결정 부담 0. 비 오는 주말 직전 구매.",
        expectedLift: "+34%", channels: ["네이버 GFA", "메타"] },
    ],
  },
  outdoor: {
    userBrief: "아웃도어 브랜드입니다. 주말 맑음 + 캠핑 시즌 광고 카피 부탁드립니다.",
    rationale: "주말 맑음 D-3 × 캠핑 검색 +260% × 신상 텐트 키워드 +140%. 맑은 주말 = 사전 구매 골든타임. 브랜드보다 \"준비\" 키워드가 잘 팔림.",
    copies: [
      { copy: "이번 주말 맑음. 캠핑 텐트 + 체어 + 테이블 풀패키지 149,000원.",
        why: "주말 직전 사전 구매 + 셋업 객단가↑. 단품 비교 어려움.",
        expectedLift: "+52%", channels: ["네이버 GFA", "인스타그램"] },
      { copy: "맑은 주말 캠핑 채비. 멀티툴 + 폴딩 컵 세트, 적립금 1만원.",
        why: "소품 객단가 + 적립금 = 다음 시즌 재방문. 캠핑 시즌 LTV 증가.",
        expectedLift: "+39%", channels: ["인스타그램", "카카오 모먼트"] },
      { copy: "맑은 주말 산행. 등산화 + 양말 + 패치 세트, 79,000원.",
        why: "산행 셋업 = 한 번 결정으로 완료. 78km 인기 코스 사진 추가.",
        expectedLift: "+33%", channels: ["네이버 GFA", "유튜브"] },
    ],
  },
  finance: {
    userBrief: "보험사입니다. 태풍 D-3 시점 재산 보험 광고 카피 부탁드려요.",
    rationale: "남부 태풍 D-3 × 재산 보험 검색 +180% × 자동차 보험 키워드 +90%. 두려움보다 \"즉시 가입 가능\"이 행동 유발.",
    copies: [
      { copy: "태풍 D-3. 재산 보험 즉시 가입, 보험료 월 9,900원부터.",
        why: "수치(D-3) + 즉시 가입 + 진입 가격. 의사결정 부담 0.",
        expectedLift: "+47%", channels: ["네이버 GFA", "메타"] },
      { copy: "태풍 임박. 자동차 + 주택 보험 함께, 합산 할인 20%.",
        why: "셋업 가입 + 할인. 두 보험 동시 결정 → 객단가↑.",
        expectedLift: "+38%", channels: ["네이버 GFA", "카카오 모먼트"] },
      { copy: "기후 리스크 시대. 재산 보험 무료 견적, 3분 안에 완료.",
        why: "3분 견적 + 무료 = 진입 부담 0. 리드 수집 → 영업팀 전환.",
        expectedLift: "+29%", channels: ["네이버 GFA", "메타"] },
    ],
  },
  edu: {
    userBrief: "온라인 어학 앱입니다. 장마 실내 시즌 광고 카피 부탁드려요.",
    rationale: "장마 7일 연속 × 어학 앱 검색 +90% × 실내·자기계발 키워드 +130%. 비 오는 날 = 자기계발 욕구. \"7일 무료 체험\" 직격.",
    copies: [
      { copy: "장마 일주일. 영어 공부 7일 무료 체험, 매일 10분.",
        why: "시즌(장마) + 7일 무료 + 매일 10분 부담 명시. 진입 장벽 0.",
        expectedLift: "+44%", channels: ["인스타그램", "유튜브"] },
      { copy: "비 오는 주말 자기계발. 어학 + 코딩 강의 번들, 첫달 9,900원.",
        why: "셋업 강의 + 진입 가격. 자기계발 카테고리 객단가↑.",
        expectedLift: "+36%", channels: ["인스타그램", "유튜브"] },
      { copy: "비 오는 날 영어 1시간. 실시간 1:1 코칭 예약, 50% 할인.",
        why: "1:1 = 프리미엄 카테고리. 비 오는 시간 = 학습 골든타임.",
        expectedLift: "+28%", channels: ["인스타그램", "네이버 GFA"] },
    ],
  },
  ent: {
    userBrief: "OTT 스트리밍 서비스입니다. 장마 시즌 광고 카피 부탁드려요.",
    rationale: "전국 장마 7일 연속 × OTT 검색 +160% × 시리즈 키워드 +220%. 비 오는 주말 = 집콕. 한 달 무료 트라이얼이 가장 잘 먹힘.",
    copies: [
      { copy: "장마 주말 시리즈 정주행. 첫 달 무료, 다음달 9,900원.",
        why: "무료 트라이얼 + 다음달 가격 명시. 의사결정 부담 0.",
        expectedLift: "+51%", channels: ["인스타그램", "유튜브"] },
      { copy: "장마 7일 정주행 패키지. 인기 시리즈 5종 + 콘텐츠 30종.",
        why: "콘텐츠 양으로 가치 명시. 신규 가입자 전환률↑.",
        expectedLift: "+42%", channels: ["인스타그램", "유튜브"] },
      { copy: "비 오는 날 영화관 대신 OTT. 가족 4인 동시 시청, 13,000원.",
        why: "4인 동시 = 가족 객단가. 영화관 대안 메시지로 가격 비교 우위.",
        expectedLift: "+33%", channels: ["메타", "유튜브"] },
    ],
  },
  telco: {
    userBrief: "이동통신사입니다. 여름 휴가 시즌 로밍 광고 카피 부탁드려요.",
    rationale: "전국 휴가 시즌 진입 × 로밍 검색 +320% × 해외여행 키워드 +180%. 가격보다 \"걱정 없이\"가 더 잘 팔림.",
    copies: [
      { copy: "이번 휴가 로밍 걱정 끝. 무제한 데이터 1일 6,900원.",
        why: "걱정 메시지 + 일 단가 명시. 휴가 직전 사전 구매 행동.",
        expectedLift: "+48%", channels: ["네이버 GFA", "카카오 모먼트"] },
      { copy: "해외여행 D-7. 로밍 + 5G 부가 패키지, 함께 가입 30% 할인.",
        why: "셋업 + 할인. 한 번 결정으로 객단가↑.",
        expectedLift: "+39%", channels: ["네이버 GFA", "메타"] },
      { copy: "휴가지 5G 무제한. 가족 4인 패스, 1주일 39,000원.",
        why: "가족 객단가 + 일주일 단가 명시. 휴가 직전 결정 빠름.",
        expectedLift: "+32%", channels: ["네이버 GFA", "유튜브"] },
    ],
  },
  pet: {
    userBrief: "반려동물 용품 셀러입니다. 장마철 강아지·고양이 케어 광고 추천해주세요.",
    rationale: "장마철 반려동물 발 곰팡이·진드기·배변 케어 검색 +290%. Wellbian 본진 반려 카테고리 사용자 모수와 직결.",
    copies: [
      { copy: "장마철 우리 강아지 발, 5초면 보송보송.",
        why: "장마 페인포인트 직접 호명 + 5초 즉시 효용. 30~40대 1인 가구 + 가족 케어층.",
        expectedLift: "+44%", channels: ["인스타그램", "쿠팡", "네이버 쇼핑"] },
      { copy: "비 오는 날 산책 후, 자동 살균 매트 1분.",
        why: "장마 = 살균 욕구 폭증. 매트 + 1분 = 즉시 행동 가능한 객단가.",
        expectedLift: "+38%", channels: ["인스타그램", "쿠팡"] },
      { copy: "강아지 진드기 시즌. 3분 셀프 점검 키트.",
        why: "진드기는 장마 + 폭염 진입 시점 매출 트리거. 셀프 점검 = 부담 적은 첫 객단가.",
        expectedLift: "+32%", channels: ["네이버 GFA", "유튜브"] },
    ],
  },
  solo: {
    userBrief: "1인 가구 가전·홈 셀러입니다. 장마 폭염 시즌 광고 어떻게 할까요?",
    rationale: "1인 가구는 한국 가구의 35%+ — 빠르게 성장하는 광고 모수. 장마 곰팡이·폭염 열대야 = 1인 가구가 가장 민감한 시즌.",
    copies: [
      { copy: "1인 가구 장마 필수템. 4L 제습기, 5만원대 첫 구매.",
        why: "1인 가구 + 사이즈 명시(4L) + 가격 명시. 솔로 가구 객단가 정확히 일치.",
        expectedLift: "+47%", channels: ["인스타그램", "쿠팡", "TikTok"] },
      { copy: "혼자 자는 밤, 열대야 잠 못 든다면 — 쿨링 매트 7일 체험.",
        why: "혼자 + 열대야 + 7일 체험. 진입 장벽 낮춘 결정 유도.",
        expectedLift: "+41%", channels: ["인스타그램", "유튜브"] },
      { copy: "1인 가구 곰팡이 제거 키트, 1주일이면 끝.",
        why: "장마 페인포인트 + 1주일 측정 가능한 시간 단위.",
        expectedLift: "+34%", channels: ["네이버 쇼핑", "쿠팡"] },
    ],
  },
};

/* ═════════════════════════════════════════════════════════════
   2.  PRIMITIVES  (Miro DESIGN.md 매핑)
   ═════════════════════════════════════════════════════════════ */

/* ═════════════════════════════════════════════════════════════
   2b.  ICON  —  Lucide-style SVG line icons (stroke 1.75, 24x24)
   ═════════════════════════════════════════════════════════════ */

function Icon({ name, size = 20, stroke = 1.75, className = "", style }) {
  const p = {
    width: size, height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className, style,
    "aria-hidden": true,
  };
  switch (name) {
    /* 업종 카테고리 */
    case "shirt":          return <svg {...p}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>;
    case "sparkles":       return <svg {...p}><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>;
    case "wine":           return <svg {...p}><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5V3H7v7a5 5 0 0 0 5 5Z"/></svg>;
    case "shopping-bag":   return <svg {...p}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
    case "car":            return <svg {...p}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>;
    case "heart-pulse":    return <svg {...p}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>;
    case "home":           return <svg {...p}><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
    case "plug":           return <svg {...p}><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>;
    case "moon":           return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
    case "utensils":       return <svg {...p}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>;
    case "plane":          return <svg {...p}><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>;
    case "mountain":       return <svg {...p}><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>;
    /* 기능·UI */
    case "search":         return <svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
    case "trending-up":    return <svg {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
    case "award":          return <svg {...p}><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>;
    case "cloud-rain":     return <svg {...p}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>;
    case "cloud":          return <svg {...p}><path d="M17.5 19a4.5 4.5 0 1 0-1.41-8.775A6.5 6.5 0 1 0 5.5 19Z"/></svg>;
    case "pen-line":       return <svg {...p}><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>;
    case "thermometer":    return <svg {...p}><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>;
    case "sun":            return <svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>;
    case "wind":           return <svg {...p}><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>;
    case "calendar":       return <svg {...p}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>;
    case "bar-chart":      return <svg {...p}><path d="M3 3v18h18"/><path d="M7 16V8"/><path d="M11 16v-4"/><path d="M15 16V6"/><path d="M19 16v-2"/></svg>;
    case "cpu":            return <svg {...p}><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>;
    case "crown":          return <svg {...p}><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/><path d="M5 21h14"/></svg>;
    case "map-pin":        return <svg {...p}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>;
    case "layers":         return <svg {...p}><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.91a1 1 0 0 0 0-1.83z"/><path d="M2 12 11.18 16.18a2 2 0 0 0 1.65 0L22 12"/><path d="M2 17 11.18 21.18a2 2 0 0 0 1.65 0L22 17"/></svg>;
    case "building":       return <svg {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>;
    case "coffee":         return <svg {...p}><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/></svg>;
    case "check":          return <svg {...p}><path d="M20 6 9 17l-5-5"/></svg>;
    case "arrow-right":    return <svg {...p}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
    case "chevron-right":  return <svg {...p}><path d="m9 18 6-6-6-6"/></svg>;
    case "satellite":      return <svg {...p}><path d="M13 7 9 3 5 7l4 4"/><path d="m17 11 4 4-4 4-4-4"/><path d="m8 12 4 4 6-6-4-4Z"/><path d="m16 8 3-3"/><path d="M9 21a6 6 0 0 0-6-6"/></svg>;
    case "zap":            return <svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
    case "target":         return <svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case "message-circle": return <svg {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>;
    case "users":          return <svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "package":        return <svg {...p}><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>;
    default: return null;
  }
}

/* ═════════════════════════════════════════════════════════════
   2c.  GLOBAL CASES — 업종 카테고리별 사례 매트릭스
   (출처: KWeather 글로벌 50개 케이스 docx · 에이블리·올리브영·오늘의집)
   ═════════════════════════════════════════════════════════════ */

const GLOBAL_CATEGORIES = [
  { id: "fashion",    label: "패션·의류",       icon: "shirt" },
  { id: "beauty",     label: "뷰티·H&B",        icon: "sparkles" },
  { id: "beverage",   label: "음료·주류",       icon: "wine" },
  { id: "retail",     label: "리테일·이커머스", icon: "shopping-bag" },
  { id: "automotive", label: "자동차",          icon: "car" },
  { id: "health",     label: "헬스·OTC",        icon: "heart-pulse" },
  { id: "home",       label: "홈·인테리어",     icon: "home" },
  { id: "appliance",  label: "가전",            icon: "plug" },
  { id: "sleep",      label: "수면·침구",       icon: "moon" },
  { id: "food",       label: "식음·외식",       icon: "utensils" },
  { id: "travel",     label: "여행·DOOH",       icon: "plane" },
  { id: "outdoor",    label: "아웃도어",        icon: "mountain" },
  { id: "finance",    label: "금융·보험",       icon: "building" },
  { id: "edu",        label: "교육·구독",       icon: "calendar" },
  { id: "ent",        label: "엔터·콘텐츠",     icon: "users" },
  { id: "telco",      label: "통신·구독",       icon: "satellite" },
];

const GLOBAL_CASES_BY_CATEGORY = {
  /* 정렬 룰: 유명 글로벌 메이저 > 큰 성과 > 초여름·여름·장마·미세먼지 시즌 밀접 */
  fashion: [
    { brand: "Bravissimo",      industry: "수영복·란제리",   country: "🇬🇧 영국",        year: "2017", trigger: "햇볕 쨍쨍한 지역만 골라 구글 검색광고(PPC) 입찰 ON · 다른 지역은 OFF",                 metric: "+600%", metricLabel: "3개월 PPC 매출" },
    { brand: "Burberry Rain",   industry: "럭셔리 패션",     country: "🇬🇧 영국",        year: "2016", trigger: "비 예보 D-1, 인스타·페북 입찰 +35% · 트렌치 카테고리 집중 노출",                            metric: "+24%",  metricLabel: "트렌치 매출" },
    { brand: "Uniqlo HeatTech", industry: "SPA 패션",        country: "🇯🇵 일본",        year: "2018", trigger: "기온 급강하 시 보온 의류 광고 자동",                                metric: "검증",  metricLabel: "겨울 시즌" },
    { brand: "H&M Outdoor",     industry: "SPA 패션",        country: "🇸🇪 스웨덴",      year: "2020", trigger: "주말 맑음 + 야외 액티비티 의류 광고",                              metric: "검증",  metricLabel: "주말 매출" },
    { brand: "ASOS",            industry: "패션 이커머스",   country: "🇬🇧 영국",        year: "2019", trigger: "지역별 날씨 + 의류 카테고리 추천 매칭",                            metric: "검증",  metricLabel: "추천 매칭" },
    { brand: "Zalando Weather", industry: "패션 이커머스",   country: "🇩🇪 독일",        year: "2019", trigger: "지역 날씨별 카테고리 자동 추천",                                    metric: "+28%",  metricLabel: "추천 CTR" },
    { brand: "SHEIN Trend",     industry: "패스트 패션",     country: "🌍 글로벌",       year: "2022", trigger: "지역 기온 기반 시즌 컬렉션 광고",                                   metric: "검증",  metricLabel: "시즌 진입" },
    { brand: "Pacific Sunwear", industry: "비치웨어",        country: "🇺🇸 미국",        year: "2018", trigger: "UV·온도 트리거 비치웨어 매장 광고",                                metric: "검증",  metricLabel: "시즌 매출" },
    { brand: "Carhartt",        industry: "워크웨어",        country: "🇺🇸 미국",        year: "2018", trigger: "비 오는 날 방수 의류 DOOH 자동 노출",                              metric: "검증",  metricLabel: "브랜드 인지" },
    { brand: "La Redoute",      industry: "여성 패션",       country: "🇫🇷 프랑스",      year: "2017", trigger: "Living Billboard 날씨 연동 옥외광고",                              metric: "+34%",  metricLabel: "온라인 트래픽" },
  ],
  beauty: [
    { brand: "L'Oréal",          industry: "화장품",         country: "🇫🇷 프랑스",      year: "2021", trigger: "UV 지수 6+ 지역, 구글·메타 검색광고 +50% · 선크림 카테고리 집중",                                  metric: "+52%",  metricLabel: "선크림 CTR" },
    { brand: "Estée Lauder",     industry: "프리미엄 뷰티",  country: "🇺🇸 미국",        year: "2020", trigger: "습도 30% 이하 지역, 인스타·페북 +40% · 세럼·보습 카테고리 광고",                                       metric: "+41%",  metricLabel: "세럼 매출" },
    { brand: "Pantene Haircast", industry: "헤어케어",       country: "🇺🇸 미국 · P&G",  year: "2014", trigger: "습도 80%+ 또는 폭염 시 Walgreens 매장 5km 반경 쿠폰 광고 자동 노출",      metric: "+24%",  metricLabel: "Walgreens 매장 매출" },
    { brand: "Sephora Weather",  industry: "뷰티 리테일",    country: "🇫🇷 글로벌",      year: "2020", trigger: "날씨별 추천 케어 큐레이션",                                        metric: "+29%",  metricLabel: "지역 광고 ROAS" },
    { brand: "Boots × Met Office", industry: "H&B 약국",     country: "🇬🇧 영국",        year: "2019", trigger: "독감·감기 시즌 OTC 광고 자동",                                     metric: "+31%",  metricLabel: "면역 카테고리" },
    { brand: "Grundlage Sun",    industry: "선 케어",         country: "🇩🇪 독일",        year: "2020", trigger: "UV 지수 트리거 선크림 광고 (Award)",                               metric: "Award", metricLabel: "Sun Care 광고상" },
    { brand: "Olaplex Summer",   industry: "헤어 케어",       country: "🌍 글로벌",       year: "2022", trigger: "UV·바닷가·풀장 시즌 진입 시점 광고",                               metric: "+38%",  metricLabel: "여름 시즌" },
    { brand: "MAC Hot Weather",  industry: "메이크업",         country: "🇺🇸 미국",        year: "2019", trigger: "여름 폭염 시 워터프루프 광고 부스팅",                              metric: "검증",  metricLabel: "여름 매출" },
    { brand: "Charlotte Tilbury", industry: "프리미엄 뷰티",  country: "🇬🇧 영국",        year: "2021", trigger: "겨울 진입 시 보습 메이크업 광고",                                  metric: "검증",  metricLabel: "겨울 매출" },
    { brand: "Glossier Sensitive", industry: "민감 케어",     country: "🇺🇸 미국",        year: "2020", trigger: "환절기 일교차 10℃+ 광고 부스팅",                                   metric: "+22%",  metricLabel: "환절기 CTR" },
  ],
  beverage: [
    { brand: "Coca-Cola Vending", industry: "음료·자판기",   country: "🌍 글로벌",       year: "2015", trigger: "자판기 위치 측정망과 연동, 폭염 시 200m 반경 광고 +50% 자동",                                  metric: "검증",  metricLabel: "더운 날 판매" },
    { brand: "Stella Artois Cidre", industry: "사과주·시드르", country: "🇬🇧 영국",         year: "2013", trigger: "기온 18℃ + 일조 5시간+ 동시 충족 시 디스플레이 광고 자동 ON",                            metric: "+65.6%", metricLabel: "시즌 YoY (Nielsen)" },
    { brand: "Starbucks Frapp",  industry: "커피·음료",      country: "🌍 글로벌",       year: "2017", trigger: "기온 25℃+ 시즌 프라푸치노 광고 부스팅",                            metric: "검증",  metricLabel: "여름 시즌" },
    { brand: "Heineken Sun",     industry: "맥주",           country: "🇳🇱 네덜란드",    year: "2017", trigger: "주말 맑음 22℃+ 야외 바·테라스 광고",                              metric: "+17%",  metricLabel: "주말 매출" },
    { brand: "Aperol Spritz",    industry: "칵테일",         country: "🇮🇹 이탈리아",    year: "2019", trigger: "19℃ 임계치 + 햇빛 → 광고 ON",                                     metric: "검증",  metricLabel: "시즌 진입" },
    { brand: "Beck's Beck-e-nomics", industry: "맥주",       country: "🇬🇧 영국",        year: "2016", trigger: "일조시간 따라 광고비 자동 재배분",                                  metric: "+28%",  metricLabel: "광고 ROI" },
    { brand: "Molson Coors",     industry: "맥주",           country: "🇨🇦 캐나다",      year: "2017", trigger: "23℃ 이상 트리거 광고 ON",                                          metric: "-67%",  metricLabel: "CPC 절감" },
    { brand: "Innocent Smoothies", industry: "프리미엄 음료", country: "🇬🇧 영국",       year: "2018", trigger: "맑은 봄날 스무디 광고 자동 부스팅",                                metric: "검증",  metricLabel: "봄 시즌" },
  ],
  retail: [
    { brand: "Walmart × Weather Co.", industry: "리테일 다중 카테고리", country: "🇺🇸 미국", year: "2015", trigger: "기온 32℃+ Gatorade 광고 +60% · 4℃ 미만 Campbell 수프 광고 +60%",                       metric: "두 자릿수", metricLabel: "Effie 2015 수상" },
    { brand: "Sainsbury's BBQ",  industry: "슈퍼마켓",       country: "🇬🇧 영국",        year: "2016", trigger: "기온 +3℃ BBQ 시즌 진입 트리거",                                    metric: "+200%", metricLabel: "BBQ 카테고리 매출" },
    { brand: "Elkjøp Weather",   industry: "가전 리테일",    country: "🇳🇴 노르웨이",    year: "2020", trigger: "기온·시즌 트리거 온라인 광고 자동",                                metric: "+178%", metricLabel: "온라인 매출" },
    { brand: "Walmart 쿨링",     industry: "쿨링 가전",      country: "🇺🇸 미국",        year: "2019", trigger: "기온 임계치 시 Google Ads 입찰가 자동 증액",                       metric: "+27%",  metricLabel: "매장 매출" },
    { brand: "Target Weather",   industry: "리테일 체인",    country: "🇺🇸 미국",        year: "2018", trigger: "시즌 카테고리 매대 자동 전환",                                     metric: "검증",  metricLabel: "카테고리 매출" },
    { brand: "Tesco Climate",    industry: "슈퍼마켓",       country: "🇬🇧 영국",        year: "2017", trigger: "IBM Weather 협업 매장 매대 자동",                                   metric: "검증",  metricLabel: "매장 매출" },
  ],
  automotive: [
    { brand: "BMW xDrive",       industry: "자동차·4륜구동", country: "🌍 글로벌 BMW",   year: "2018", trigger: "강설 1cm+ 또는 강수 예측 지역만 디지털 광고 ON · 4륜구동 SUV 집중",                     metric: "ROI 16:1", metricLabel: "광고 효율" },
    { brand: "KIA Programmatic", industry: "자동차 OEM",     country: "🇰🇷 한국·기아",   year: "2021", trigger: "DV360 + 날씨 시그널 통합 광고",                                    metric: "CTR ×3", metricLabel: "광고 효율 (DV360)" },
    { brand: "Goodyear Weather", industry: "타이어",         country: "🇺🇸 미국",        year: "2018", trigger: "노면·기온 변화 따라 타이어 광고 매칭",                             metric: "+130%", metricLabel: "타이어 매출" },
    { brand: "BMW Snow Day",     industry: "자동차",         country: "🇨🇭 스위스",      year: "2017", trigger: "폭설 후 매장 광고 자동 노출",                                      metric: "+30%",  metricLabel: "Engagement" },
    { brand: "Audi Rain Drive",  industry: "자동차",         country: "🇩🇪 독일",        year: "2019", trigger: "비 오는 날 SUV·콰트로 광고 부스팅",                                metric: "검증",  metricLabel: "CTR" },
    { brand: "Škoda BeRider",    industry: "공유 모빌리티",   country: "🇪🇺 유럽",        year: "2020", trigger: "맑은 날·날씨 좋은 지역 광고 부스팅",                               metric: "-80%",  metricLabel: "CPI 절감" },
  ],
  health: [
    { brand: "J&J Cold/Flu",     industry: "감기약·OTC",     country: "🇺🇸 미국·J&J",    year: "2019", trigger: "한파·독감 지역 광고 자동 + 어워드 수상",                           metric: "Award", metricLabel: "글로벌 마케팅 어워드" },
    { brand: "Air Purifier Ads", industry: "공기청정기",     country: "🌍 글로벌",       year: "2021", trigger: "미세먼지 임계치 광고 자동 부스팅",                                 metric: "+289%", metricLabel: "광고 매출" },
    { brand: "Bayer Claritine × Ambee", industry: "알레르기 OTC", country: "🇺🇸 미국·EU", year: "2022", trigger: "ZIP 코드별 폴렌 카운트 임계 → 광고 자동",                          metric: "+59%",  metricLabel: "광고 기반 매출" },
    { brand: "Kleenex Sneeze",   industry: "위생용품",       country: "🇬🇧 영국",        year: "2017", trigger: "꽃가루·감기 시즌 광고 부스팅",                                     metric: "검증",  metricLabel: "시즌 매출" },
    { brand: "Quixx Asia",       industry: "비강 케어",       country: "🌏 아시아",       year: "2020", trigger: "꽃가루·미세먼지 지역 광고",                                        metric: "검증",  metricLabel: "Asia 시즌" },
    { brand: "Allergy Partners", industry: "알레르기 클리닉", country: "🇺🇸 미국",       year: "2019", trigger: "폴렌·꽃가루 지역 광고 자동",                                       metric: "-96%",  metricLabel: "CPL ($300→$12)" },
  ],
  home: [
    { brand: "Home Depot × Weather Co.", industry: "홈·인테리어 리테일", country: "🇺🇸 미국", year: "2026", trigger: "기온 트리거 시 DOOH·앱·매장 광고 동시 카테고리 전환 (시즌 진입 즉시)",          metric: "×6",   metricLabel: "컨버전 (시즌 푸시 대비)" },
    { brand: "IKEA Weather Ads", industry: "가구·홈",        country: "🇸🇪 글로벌",      year: "2017", trigger: "비 오는 날 인테리어 광고 부스팅",                                  metric: "+24%",  metricLabel: "광고 ROI" },
    { brand: "Dulux Paint",      industry: "페인트·DIY",     country: "🇬🇧 영국",        year: "2018", trigger: "맑은 주말 페인팅 광고 부스팅",                                     metric: "+130%", metricLabel: "브랜드 lift" },
    { brand: "Wayfair",          industry: "홈·가구 이커머스", country: "🇺🇸 미국",      year: "2020", trigger: "장마·비 시즌 인테리어 광고 부스팅",                                 metric: "검증",  metricLabel: "시즌 매출" },
    { brand: "B&Q",              industry: "DIY·홈",         country: "🇬🇧 영국",        year: "2019", trigger: "리테일미디어 + 날씨 시그널 통합",                                  metric: "+60%",  metricLabel: "매출 uplift" },
  ],
  appliance: [
    { brand: "Dyson Air",        industry: "공기청정기·가전", country: "🇬🇧 영국",       year: "2020", trigger: "PM2.5 75㎍+ 지역, 쿠팡·네이버 검색광고 +60% · 익일 배송 강조",                                 metric: "+289%", metricLabel: "광고 매출" },
    { brand: "Daikin HVAC",      industry: "에어컨",         country: "🇯🇵 일본",        year: "2019", trigger: "폭염 D-3 사전 광고 발령",                                          metric: "검증",  metricLabel: "여름 시즌" },
    { brand: "Big Ass Fans",     industry: "선풍기·환기",     country: "🇺🇸 미국",       year: "2019", trigger: "폭염 + 산업용 환기 시설 광고",                                     metric: "검증",  metricLabel: "B2B 매출" },
    { brand: "Kärcher Outdoor",  industry: "고압세척기",      country: "🇩🇪 독일",       year: "2018", trigger: "맑은 봄날 + 청소·정원 광고 부스팅",                                metric: "검증",  metricLabel: "봄 시즌" },
    { brand: "Duracell Storm",   industry: "배터리·생활",     country: "🇺🇸 미국",       year: "2018", trigger: "태풍·정전 위험 지역 광고 자동",                                    metric: "검증",  metricLabel: "재난 시즌" },
  ],
  sleep: [
    { brand: "Purple Sleep Cool", industry: "매트리스",      country: "🇺🇸 미국",        year: "2019", trigger: "폭염 시즌 쿨링 매트리스 광고",                                     metric: "검증",  metricLabel: "여름 시즌" },
    { brand: "Eight Sleep",      industry: "스마트 매트리스", country: "🇺🇸 미국",        year: "2021", trigger: "온도 기반 광고·제품 매칭",                                         metric: "검증",  metricLabel: "제품 매칭" },
    { brand: "Casper Snow",      industry: "매트리스·침구",  country: "🇺🇸 미국",        year: "2018", trigger: "한파·눈 오는 날 따뜻한 침구 광고",                                 metric: "검증",  metricLabel: "겨울 시즌" },
    { brand: "Brooklinen",       industry: "프리미엄 침구",  country: "🇺🇸 미국",        year: "2020", trigger: "환절기 + 시즌 침구 광고 부스팅",                                   metric: "검증",  metricLabel: "환절기" },
  ],
  food: [
    { brand: "McDonald's",       industry: "패스트푸드",     country: "🌍 글로벌",       year: "2017", trigger: "체감 30℃+ 시점, 매장 5km 반경 인스타 광고 +40% · 콜드 메뉴 집중",                         metric: "검증",  metricLabel: "여름 메뉴" },
    { brand: "McCain Foods",     industry: "냉동식품",       country: "🇨🇦 캐나다",      year: "2020", trigger: "기온·날씨 시즌 냉동식품 광고 부스팅",                              metric: "+200%", metricLabel: "광고 효율 (시즌 진입)" },
    { brand: "SodaStream",       industry: "탄산수·음료",    country: "🌍 글로벌",       year: "2019", trigger: "더운 날 탄산수 광고 자동 부스팅",                                  metric: "Sales ×3", metricLabel: "매출 (CVR +50%)" },
    { brand: "Heineken Weather", industry: "맥주",           country: "🌍 글로벌",       year: "2018", trigger: "기온·일조 따라 맥주 광고 입찰 자동",                              metric: "CPM -50%", metricLabel: "광고비 절감" },
    { brand: "Domino's Pizza",   industry: "배달 피자",      country: "🇺🇸 미국",        year: "2018", trigger: "비·눈 오는 날 배달 광고 부스팅",                                   metric: "검증",  metricLabel: "배달 매출" },
    { brand: "OB맥주 더위 시즌",  industry: "주류·맥주",      country: "🇰🇷 한국·OB맥주", year: "2023", trigger: "기온 25℃+ 진입 시 맥주 광고 매장 5km 부스팅",                      metric: "검증",  metricLabel: "여름 시즌 매출" },
    { brand: "버거킹 Rain BK",   industry: "패스트푸드",     country: "🇰🇷 한국",        year: "2014", trigger: "비 오는 날 가맹점 5km 광고 자동 부스팅",                          metric: "+12%",  metricLabel: "비 오는 날 매출" },
    { brand: "Heinz Tomato Soup", industry: "식품·캔수프",   country: "🇬🇧 영국",        year: "2015", trigger: "추운 날 토마토 스프 광고",                                         metric: "+20%",  metricLabel: "매출" },
  ],
  travel: [
    { brand: "British Airways Look Up", industry: "항공사·DOOH", country: "🇬🇧 영국",    year: "2014", trigger: "항공기 통과 실시간 빌보드 카피 변경",                              metric: "+21%",  metricLabel: "캠페인 인지도" },
    { brand: "Booking.com",       industry: "호텔 예약",      country: "🌍 글로벌",       year: "2020", trigger: "장마 시즌 도심 호캉스 광고 부스팅",                                metric: "+27%",  metricLabel: "호캉스 예약" },
    { brand: "Expedia Weather",   industry: "여행 예약",      country: "🌍 글로벌",       year: "2019", trigger: "한파 진입 시 동남아·하와이 광고 자동",                              metric: "+33%",  metricLabel: "겨울 여행 예약" },
    { brand: "Korean Air",        industry: "항공사",         country: "🇰🇷 한국",        year: "2023", trigger: "PM2.5 75+ 시 해외 여행 광고 부스팅",                               metric: "+19%",  metricLabel: "해외 예약" },
    { brand: "Lufthansa Weather", industry: "항공사",        country: "🇩🇪 독일",        year: "2019", trigger: "출발지 날씨별 항공권 광고 매칭",                                   metric: "검증",  metricLabel: "여행 CTR" },
  ],
  outdoor: [
    { brand: "Patagonia",        industry: "아웃도어 의류",   country: "🇺🇸 미국",       year: "2019", trigger: "폭우·폭설 지역 아웃도어 광고",                                     metric: "검증",  metricLabel: "시즌 매출" },
    { brand: "The North Face",   industry: "아웃도어 의류",   country: "🇺🇸 미국",       year: "2018", trigger: "한파·강설 지역 다운 자켓 광고 자동",                                metric: "검증",  metricLabel: "겨울 시즌" },
    { brand: "Columbia Sportswear", industry: "아웃도어 의류", country: "🇺🇸 미국",      year: "2020", trigger: "기상 악화 지역 방수·방한 광고",                                    metric: "검증",  metricLabel: "악천후 시즌" },
    { brand: "REI Co-op",        industry: "아웃도어 리테일", country: "🇺🇸 미국",       year: "2020", trigger: "주말 맑음 + 산행 시즌 광고",                                       metric: "검증",  metricLabel: "주말 매출" },
    { brand: "Yeti Coolers",     industry: "쿨러·아웃도어",   country: "🇺🇸 미국",       year: "2020", trigger: "여름 캠핑 + 폭염 트리거 광고",                                     metric: "검증",  metricLabel: "여름 매출" },
    { brand: "Coleman",          industry: "캠핑·아웃도어",   country: "🇺🇸 미국",       year: "2019", trigger: "주말 맑음 D-3 캠핑용품 광고 자동",                                  metric: "검증",  metricLabel: "주말 캠핑" },
    { brand: "Decathlon Spring", industry: "스포츠 리테일",   country: "🇫🇷 프랑스",      year: "2021", trigger: "봄 맑음 + 야외 스포츠 시즌 광고",                                  metric: "검증",  metricLabel: "야외 카테고리" },
  ],
  finance: [
    { brand: "Allstate Storm",   industry: "보험",            country: "🇺🇸 미국",       year: "2019", trigger: "태풍·홍수 위험 지역 보험 광고 D-3 자동",                            metric: "+34%",  metricLabel: "재난 보험 매출" },
    { brand: "AAA Roadside",     industry: "자동차 보험",     country: "🇺🇸 미국",       year: "2020", trigger: "빙판·강설 지역 긴급출동 보험 광고",                                 metric: "+28%",  metricLabel: "긴급 가입" },
    { brand: "Chubb Property",   industry: "재산 보험",       country: "🇺🇸 미국",       year: "2018", trigger: "폭풍·우박 위험 지역 주택 보험 광고",                                metric: "검증",  metricLabel: "재산 보험" },
    { brand: "MetLife Wellness", industry: "건강 보험",       country: "🇺🇸 미국",       year: "2022", trigger: "미세먼지·황사 지역 건강 보험 광고",                                  metric: "검증",  metricLabel: "건강 보험 가입" },
    { brand: "Aon Climate Risk", industry: "기업 보험",       country: "🌍 글로벌",       year: "2021", trigger: "기후 리스크 데이터로 B2B 보험 광고 매칭",                            metric: "검증",  metricLabel: "B2B 매출" },
  ],
  edu: [
    { brand: "Duolingo Spring",  industry: "어학 앱",         country: "🌍 글로벌",       year: "2022", trigger: "장마·실내 시즌 어학 학습 광고 부스팅",                              metric: "+22%",  metricLabel: "신규 가입" },
    { brand: "MasterClass Rain", industry: "온라인 강의",      country: "🇺🇸 미국",       year: "2021", trigger: "비 오는 주말 강의 가입 광고 자동",                                  metric: "검증",  metricLabel: "주말 가입" },
    { brand: "Coursera Winter",  industry: "온라인 교육",      country: "🌍 글로벌",       year: "2020", trigger: "한파 시즌 실내 학습 광고 부스팅",                                  metric: "검증",  metricLabel: "겨울 시즌" },
    { brand: "Khan Academy",     industry: "교육 비영리",      country: "🇺🇸 미국",       year: "2022", trigger: "방학·실내 시즌 학습 광고",                                         metric: "검증",  metricLabel: "주말 학습" },
    { brand: "Babbel Indoor",    industry: "어학 앱",          country: "🇩🇪 독일",       year: "2021", trigger: "비·눈 오는 날 어학 학습 광고",                                     metric: "검증",  metricLabel: "신규 가입" },
  ],
  ent: [
    { brand: "Netflix Cozy",     industry: "OTT 스트리밍",     country: "🌍 글로벌",       year: "2020", trigger: "비·한파 시즌 OTT 광고 자동 부스팅",                                metric: "검증",  metricLabel: "신규 가입" },
    { brand: "Disney+ Rainy",    industry: "OTT 스트리밍",     country: "🌍 글로벌",       year: "2021", trigger: "장마 시즌 가족 영화 광고 부스팅",                                  metric: "검증",  metricLabel: "주말 시청" },
    { brand: "Spotify Mood",     industry: "음원 스트리밍",    country: "🌍 글로벌",       year: "2022", trigger: "날씨별 무드 플레이리스트 자동 매칭",                                metric: "검증",  metricLabel: "Daily Active" },
    { brand: "Apple TV+",        industry: "OTT 스트리밍",     country: "🌍 글로벌",       year: "2022", trigger: "실내 시즌 콘텐츠 광고 매칭",                                       metric: "검증",  metricLabel: "신규 구독" },
    { brand: "AMC Theaters",     industry: "영화관",           country: "🇺🇸 미국",       year: "2019", trigger: "비 오는 주말 영화관 광고 부스팅",                                  metric: "검증",  metricLabel: "주말 관객" },
    { brand: "PlayStation Win",  industry: "게임 콘솔",         country: "🌍 글로벌",       year: "2020", trigger: "한파·실내 시즌 게임 광고 자동",                                    metric: "검증",  metricLabel: "겨울 매출" },
  ],
  telco: [
    { brand: "Verizon 5G",       industry: "이동통신",         country: "🇺🇸 미국",       year: "2020", trigger: "스마트홈·날씨 알림 통합 광고",                                     metric: "검증",  metricLabel: "신규 가입" },
    { brand: "Vodafone Roaming", industry: "이동통신",         country: "🇬🇧 영국",       year: "2019", trigger: "여행 시즌 로밍 광고 부스팅",                                       metric: "검증",  metricLabel: "로밍 가입" },
    { brand: "T-Mobile Weather", industry: "이동통신",         country: "🇺🇸 미국",       year: "2021", trigger: "재난·태풍 지역 비상 연락 광고",                                    metric: "검증",  metricLabel: "재난 시즌" },
    { brand: "Comcast Stay-In",  industry: "케이블·인터넷",   country: "🇺🇸 미국",       year: "2020", trigger: "한파·실내 시즌 인터넷 광고 부스팅",                                metric: "검증",  metricLabel: "신규 가입" },
  ],
};

const TINT = {
  teal:     { bg: T.tealLight,     light: T.tealLight,     text: T.mossDark,  border: T.brandTeal },
  coral:    { bg: T.coralLight,    light: T.coralLight,    text: T.coralDark, border: T.brandCoral },
  rose:     { bg: T.roseLight,     light: T.roseLight,     text: T.coralDark, border: T.brandRose },
  lavender: { bg: T.surfacePricing, light: T.surfacePricing, text: T.brandBlue, border: T.brandBlue },
  navy:     { bg: T.navyLight,      light: T.navyLight,       text: T.navy,      border: T.navy },
  yellow:   { bg: "#FFF6D9",        light: "#FFF6D9",        text: "#8A6B0F",   border: "#F2C94C" },
  purple:   { bg: "#EDE6FA",        light: "#EDE6FA",        text: "#5B2E91",   border: "#9B6FE3" },
  lime:     { bg: "#E2F4D7",        light: "#E2F4D7",        text: "#3F6D1F",   border: "#7CB342" },
  amber:    { bg: "#FFE5C2",        light: "#FFE5C2",        text: "#7A4500",   border: "#FF9F4A" },
};


/* Miro 워드마크 (블록형) — KWeather 시그니처
   variant: "filled" (기본, GNB·다크 배경) | "inline" (챗봇 안, 배경 없음 + 1px 테두리) */
function Logo({ size = 32, variant = "filled" }) {
  // 브랜드 마크: sun rays + 원 + 우상단 화살표 + 좌측 액센트 dot
  // 시맨틱: 날씨(태양) + 광고 의사결정(화살표·성장) + 데이터 시그널(액센트 dot)
  void variant;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="select-none flex-shrink-0"
      style={{ display: "block" }}
    >
      {/* 8 sun rays — 7개 균일(length 7~7.07) + W는 dot 시각 분리용 짧게 */}
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
      {/* 좌측 액센트 dot — W ray 외부 */}
      <circle cx="2.8" cy="24" r="2" fill="#4EB3A8" />
      {/* 중앙 원 */}
      <circle cx="24" cy="24" r="8" stroke="#0091FF" strokeWidth="3" />
      {/* 화살표 ↗ (원 내부, tip은 원 경계에 안착) */}
      <g stroke="#4EB3A8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="19" y1="29" x2="29" y2="19" />
        <polyline points="24,19 29,19 29,24" />
      </g>
    </svg>
  );
}

/* button-primary — 검정 그라데이션 pill + 글라스 두께감 (HA.jsx 패턴) */
function BtnPrimary({ children, onClick, fullWidth, compact, href }) {
  const [pressed, setPressed] = useState(false);
  const Tag = href ? "a" : "button";
  const props = href ? { href } : { onClick };
  return (
    <Tag
      {...props}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={`btn-shine inline-flex items-center justify-center gap-1.5 transition active:translate-y-px ${fullWidth ? "w-full" : ""} ${compact ? "btn-primary-compact" : ""}`}
      style={{
        background: pressed
          ? `linear-gradient(180deg, #1F1A48 0%, #050038 100%)`
          : `linear-gradient(180deg, #2D2862 0%, #050038 100%)`,
        color: T.onPrimary,
        fontSize: compact ? 12.5 : 14,
        fontWeight: 500,
        padding: compact ? "8px 13px" : "14px 26px",
        borderRadius: R.full,
        whiteSpace: "nowrap",
        flexShrink: 0,
        textDecoration: "none",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.22)",
          "inset 0 -1px 0 rgba(0,0,0,0.4)",
          "0 1px 2px rgba(5,0,56,0.14)",
          "0 4px 14px rgba(5,0,56,0.28)",
        ].join(", "),
      }}
    >
      <span className="relative" style={{ zIndex: 2 }}>{children}</span>
    </Tag>
  );
}

/* button-secondary — 리퀴드 글라스 outline pill */
function BtnSecondary({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 transition hover:bg-white active:translate-y-px"
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 100%)`,
        backdropFilter: "blur(18px) saturate(180%)",
        WebkitBackdropFilter: "blur(18px) saturate(180%)",
        color: T.ink,
        border: `1px solid rgba(201,197,183,0.7)`,
        fontSize: 14, fontWeight: 500,
        padding: "13px 24px", borderRadius: R.full,
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.95)",
          "inset 0 -1px 0 rgba(5,0,56,0.04)",
          "0 1px 2px rgba(5,0,56,0.04)",
          "0 4px 14px rgba(5,0,56,0.08)",
        ].join(", "),
      }}
    >
      {children}
    </button>
  );
}

/* button-on-dark — 다크 위 흰 그라데이션 pill */
function BtnOnDark({ children, onClick, href }) {
  const Tag = href ? "a" : "button";
  const props = href ? { href } : { onClick };
  return (
    <Tag
      {...props}
      className="inline-flex items-center gap-1.5 transition hover:opacity-95 active:translate-y-px"
      style={{
        background: `linear-gradient(180deg, #FFFFFF 0%, #F0EDE3 100%)`,
        color: T.primary,
        fontSize: 14, fontWeight: 500,
        padding: "13px 24px", borderRadius: R.full,
        textDecoration: "none",
        boxShadow: [
          "inset 0 1px 0 rgba(255,255,255,0.95)",
          "inset 0 -1px 0 rgba(0,0,0,0.1)",
          "0 1px 3px rgba(0,0,0,0.18)",
          "0 6px 22px rgba(0,0,0,0.28)",
        ].join(", "),
      }}
    >
      {children}
    </Tag>
  );
}

/* badge-tag-* — Miro의 시그니처 소프트 태그 칩 */
/* 스크롤 인뷰 시 자연스럽게 등장 (1page 이후 섹션·카드 그룹용)
   - threshold 12% 이상 보이면 fade-up
   - 한 번 보이면 다시 사라지지 않음 (unobserve)
   - delay prop으로 stagger 가능 (ms) */
function Reveal({ children, delay = 0, as: Tag = "div", className = "", style = {}, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "in-view" : ""} ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms", ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Tag({ tint = "teal", children }) {
  const t = TINT[tint];
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        background: t.light, color: t.text,
        fontSize: 13, fontWeight: 600,
        padding: "4px 10px", borderRadius: R.full,
      }}
    >
      {children}
    </span>
  );
}

function LiveDot({ color = T.successAccent }) {
  return (
    <span className="relative inline-flex w-1.5 h-1.5">
      <span className="absolute inset-0 rounded-full opacity-60 animate-ping" style={{ background: color }}></span>
      <span className="relative inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }}></span>
    </span>
  );
}

/* ═════════════════════════════════════════════════════════════
   3.  PROMO BANNER + NAV
   ═════════════════════════════════════════════════════════════ */

function PromoBanner() {
  return (
    <div style={{ background: T.primary, color: T.onDark }}>
      <div className="max-w-[1280px] mx-auto px-6 py-2.5 flex items-center justify-center gap-3">
        <span className="hidden sm:inline" style={{ color: T.onDarkMuted, fontSize: 14, fontWeight: 500 }}>
          베타 광고주 30개 한정 · <strong style={{ color: T.brandTeal, fontWeight: 600 }}>14일 무료 체험</strong> · 신용카드 없이 시작
        </span>
        <span className="sm:hidden" style={{ color: T.onDarkMuted, fontSize: 14, fontWeight: 500 }}>
          14일 무료 체험
        </span>
        <span
          style={{
            background: T.brandTeal, color: T.mossDark,
            fontSize: 12.5, fontWeight: 600, letterSpacing: "0.04em",
            padding: "3px 10px", borderRadius: R.full,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.12)",
          }}
        >
          무료로 시작하기 →
        </span>
      </div>
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.98)",
        boxShadow: scrolled
          ? "0 1px 0 rgba(5,0,56,0.06)"
          : "0 1px 0 rgba(229,225,214,0.5)",
        borderBottom: "none",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-[88px] flex items-center justify-between" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <a href="#top" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Logo size={36} />
          <div className="leading-none min-w-0">
            <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
              Weather Plan AI
            </div>
            <div className="hidden sm:block" style={{ color: T.slate, fontSize: 11, marginTop: 4, letterSpacing: "0.04em", fontWeight: 500 }}>
              by KWeather · wellbian AI
            </div>
          </div>
        </a>

        <div className="hidden lg:flex items-center gap-7">
          {[
            { href: "#cases",      label: "글로벌 사례" },
            { href: "#how",        label: "작동 방식" },
            { href: "#triggers",   label: "날씨 데이터" },
            { href: "#trust",      label: "정확도" },
            { href: "#pricing",    label: "가격" },
          ].map((l) => (
            <a key={l.href} href={l.href}
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(l.href);
                if (target) {
                  const offset = 88; // GNB 높이만큼 보정
                  const top = target.getBoundingClientRect().top + window.scrollY - offset;
                  window.scrollTo({ top, behavior: "smooth" });
                }
              }}
              className="transition hover:opacity-70"
              style={{ color: T.ink, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <a href="mailto:psw1224@kweather.co.kr" className="hidden md:inline-block px-3 py-2 mr-1 hover:opacity-70 transition"
            style={{ color: T.ink, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            영업팀 문의
          </a>
          <BtnPrimary compact href="/onboarding">
            <span className="hidden sm:inline">무료로 시작 →</span>
            <span className="sm:hidden">시작 →</span>
          </BtnPrimary>
        </div>
      </div>
    </nav>
  );
}

/* ═════════════════════════════════════════════════════════════
   4.  HERO
   ═════════════════════════════════════════════════════════════ */

function Hero() {
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("idle");
  const [result, setResult] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const inputRef = useRef(null);
  const resultRef = useRef(null);
  const brandPanelRef = useRef(null);

  const runDemo = useCallback((query) => {
    const q = (query ?? input).trim();
    if (!q) return;
    setInput(q);
    setResult(null);
    setStage("thinking");
    setTimeout(() => {
      const matched = RULE_MATRIX[q] || RULE_MATRIX[SAMPLE_QUERIES[0]];
      setResult(matched);
      setStage("done");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }, 1500);
  }, [input]);

  const reset = () => {
    setStage("idle"); setResult(null); setInput("");
    inputRef.current?.focus();
  };

  return (
    <section id="top" style={{ background: T.canvas, position: "relative", overflow: "hidden" }}>
      {/* Hero 배경 루프 영상 */}
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/hero-loop.mp4" type="video/mp4" />
      </video>
      <div className="hero-video-overlay" aria-hidden="true" />

      {/* Hero-wide subtle rainbow aurora (전역 은은한 무지개) */}
      <div className="hero-aurora" />

      {/* Ambient orbs — 글라스 카드가 블러할 대상 */}
      <div className="orb orb-teal orb-float"
        style={{ width: 520, height: 520, top: "5%", right: "-10%" }} />
      <div className="orb orb-lavender orb-float-slow"
        style={{ width: 420, height: 420, bottom: "10%", left: "-8%" }} />
      <div className="orb orb-coral orb-float"
        style={{ width: 280, height: 280, top: "55%", left: "45%", animationDelay: "3s" }} />

      <div className="max-w-[1280px] mx-auto px-6 over-orb" style={{ paddingTop: 80, paddingBottom: 96 }}>
        <div className="text-center max-w-[860px] mx-auto">
          <div className="inline-flex mb-7">
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                background: TINT.teal.light,
                color: TINT.teal.text,
                border: `1px solid ${TINT.teal.border}`,
                fontSize: 13, fontWeight: 600,
                padding: "4px 11px", borderRadius: R.full,
              }}
            >
              <LiveDot color={T.brandTeal} />
              <span className="ml-0.5">국내 최초·최대 날씨 기반 광고 AI</span>
            </span>
          </div>

          {/* === 새 슬로건 === */}
          <h1
            style={{
              fontSize: "clamp(36px, 6.8vw, 72px)",
              lineHeight: 1.08,
              letterSpacing: "-0.028em",
              color: T.ink,
              fontWeight: 500,
              marginBottom: 24,
            }}
          >
            질문 한 줄로,<br />
            <span style={{ color: T.mossDark }}>상품이 더 팔리는 광고.</span>
          </h1>

          {/* === 듀얼 신뢰 박스 === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mx-auto" style={{ maxWidth: 800, marginBottom: 20 }}>
            {/* 좌 — AI 엔진 + 60일 예보 */}
            <div
              className="text-left"
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(14px) saturate(180%)",
                WebkitBackdropFilter: "blur(14px) saturate(180%)",
                border: `1px solid rgba(255,255,255,0.85)`,
                borderRadius: R.xxxl,
                padding: "22px 24px",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  style={{
                    width: 32, height: 32,
                    color: T.mossDark,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon name="cpu" size={26} stroke={1.6} />
                </div>
                <div>
                  <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>
                    NVIDIA 기반 학습 AI
                  </div>
                  <div style={{ color: T.mossDark, fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.005em", marginTop: 1 }}>
                    국내 유일 60일 예보 가능
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2" style={{ color: T.charcoal, fontSize: 12.5, fontWeight: 400, lineHeight: 1.55 }}>
                <div style={{ color: T.mossDark, paddingTop: 2 }}>
                  <Icon name="check" size={14} stroke={2.2} />
                </div>
                <span>전문 예보관 검수 — AI 결과에 <strong style={{ color: T.ink, fontWeight: 600 }}>신뢰의 방점</strong></span>
              </div>
            </div>

            {/* 우 — 케이웨더 자산 + 시그널 + 측정망 */}
            <div
              className="text-left"
              style={{
                background: "rgba(255,255,255,0.72)",
                backdropFilter: "blur(14px) saturate(180%)",
                WebkitBackdropFilter: "blur(14px) saturate(180%)",
                border: `1px solid rgba(255,255,255,0.85)`,
                borderRadius: R.xxxl,
                padding: "22px 24px",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  style={{
                    width: 32, height: 32,
                    color: T.mossDark,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon name="cloud-rain" size={26} stroke={1.6} />
                </div>
                <div>
                  <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>
                    국내 NO.1 케이웨더
                  </div>
                  <div style={{ color: T.mossDark, fontSize: 13.5, fontWeight: 700, letterSpacing: "-0.005em", marginTop: 1 }}>
                    상황 시그널 100+ · 측정망 30,000여개
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2" style={{ color: T.charcoal, fontSize: 12.5, fontWeight: 400, lineHeight: 1.55 }}>
                <div style={{ color: T.mossDark, paddingTop: 2 }}>
                  <Icon name="check" size={14} stroke={2.2} />
                </div>
                <span>5분 단위 <strong style={{ color: T.ink, fontWeight: 600 }}>온도·체감온도·강수확률·공기질</strong> 등 동단위 측정</span>
              </div>
            </div>
          </div>

          {/* NL INPUT — 좌우 폭 확장 + 테두리 빛나는 그라데이션 + 공간감 */}
          <div className="max-w-[820px] mx-auto" style={{ marginTop: 12 }}>
            <div
              className={`glass-card nl-shine ${stage === "thinking" ? "nl-shine-active" : ""}`}
              style={{
                borderRadius: R.xxl,
                padding: 6,
                boxShadow:
                  stage === "thinking"
                    ? [
                        "inset 0 1px 0 rgba(255,255,255,0.95)",
                        "0 1px 3px rgba(5,0,56,0.06)",
                        "0 12px 28px rgba(5,0,56,0.10)",
                        "0 28px 70px rgba(66,98,255,0.20)",
                        `0 0 0 1.5px ${T.brandBlue}44`,
                      ].join(", ")
                    : [
                        "inset 0 1px 0 rgba(255,255,255,0.95)",
                        "0 1px 3px rgba(5,0,56,0.05)",
                        "0 10px 24px rgba(5,0,56,0.08)",
                        "0 24px 60px rgba(5,0,56,0.10)",
                      ].join(", "),
                transition: "box-shadow 200ms ease",
              }}
            >
              <div className="flex gap-1.5 items-stretch">
                <div className="flex-1 flex items-center gap-3 pl-3.5 min-w-0">
                  <Logo size={28} variant="inline" />
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runDemo()}
                    placeholder="예: 강남 카페, 주말 장마 광고 어떻게?"
                    className="flex-1 min-w-0 bg-transparent outline-none"
                    style={{ color: T.ink, fontSize: 15, fontWeight: 400, paddingTop: 12, paddingBottom: 12 }}
                    disabled={stage === "thinking"}
                  />
                </div>
                {stage === "done" ? (
                  <button
                    onClick={reset}
                    className="rounded-full flex items-center justify-center w-11 sm:w-auto sm:px-5 transition hover:bg-white active:translate-y-px"
                    style={{
                      background: "rgba(247,245,238,0.7)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      color: T.slate,
                      flexShrink: 0,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(5,0,56,0.04), 0 1px 2px rgba(5,0,56,0.04)",
                    }}
                    aria-label="다시 시작"
                  >
                    <span className="hidden sm:inline" style={{ fontSize: 13, fontWeight: 500 }}>↺ 다시</span>
                    <span className="sm:hidden" style={{ fontSize: 18, fontWeight: 500 }}>↺</span>
                  </button>
                ) : (
                  <button
                    onClick={() => runDemo()}
                    disabled={!input.trim() || stage === "thinking"}
                    className="btn-shine rounded-full flex items-center justify-center w-11 sm:w-auto sm:min-w-[104px] sm:px-6 transition disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 active:translate-y-px"
                    style={{
                      background: `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)`,
                      color: T.onPrimary,
                      flexShrink: 0,
                      boxShadow: [
                        "inset 0 1px 0 rgba(255,255,255,0.18)",
                        "inset 0 -1px 0 rgba(0,0,0,0.22)",
                        "0 1px 2px rgba(20,68,59,0.16)",
                      ].join(", "),
                    }}
                    aria-label="광고 만들기"
                  >
                    {stage === "thinking" ? (
                      <>
                        <span className="hidden sm:inline-flex items-center gap-2 relative" style={{ zIndex: 2, fontSize: 13, fontWeight: 500 }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: T.onPrimary }}></span>
                          분석 중
                        </span>
                        <span className="sm:hidden relative inline-block w-2 h-2 rounded-full animate-bounce" style={{ zIndex: 2, background: T.onPrimary }}></span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline relative" style={{ zIndex: 2, fontSize: 13, fontWeight: 500 }}>광고 만들기 →</span>
                        <span className="sm:hidden relative" style={{ zIndex: 2, fontSize: 20, fontWeight: 600, lineHeight: 1 }}>→</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {stage === "idle" && (
              <>
                <div className="flex flex-wrap items-center justify-center gap-2" style={{ marginTop: 22 }}>
                  <span style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>
                    예시
                  </span>
                  {SAMPLE_QUERIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => runDemo(q)}
                      className="transition hover:bg-white"
                      style={{
                        background: T.surface, color: T.slate,
                        border: `1px solid ${T.hairlineSoft}`,
                        fontSize: 12.5, fontWeight: 400,
                        padding: "6px 12px", borderRadius: R.full,
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}

            {stage === "thinking" && <ThinkingTrace />}
          </div>

          {/* ── Studio 전체 페이지로 가는 보조 링크 (실제 작동 챗봇으로) ── */}
          <div className="text-center mt-5">
            <a
              href="/studio"
              className="inline-flex items-center gap-1.5 transition hover:opacity-70"
              style={{
                color: T.mossDark,
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: "-0.005em",
                textDecoration: "none",
                padding: "6px 14px",
                background: T.surface,
                borderRadius: R.full,
                border: `1px solid ${T.hairlineSoft}`,
              }}
            >
              <Icon name="sparkles" size={12} stroke={2} />
              스튜디오에서 18개 업종 시나리오 직접 체험하기
              <Icon name="arrow-right" size={12} stroke={2} />
            </a>
          </div>

          <div style={{ height: 28 }} />

          {/* === 글로벌 사례 박스 (NL 챗봇 아래로 이동 · 브랜드 알약 칩) === */}
          <div className="mx-auto" style={{ maxWidth: 820 }}>
            <div className="flex items-center justify-center gap-2" style={{ marginBottom: 6 }}>
              <Icon name="bar-chart" size={14} stroke={2} style={{ color: T.steel }} />
              <span style={{ fontSize: 12, color: T.steel, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                글로벌 광고주 기존 날씨광고 사례
              </span>
            </div>

            {/* 클릭 안내 카피 */}
            <div className="text-center" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11.5, color: T.mossDark, fontWeight: 500, fontStyle: "italic" }}>
                ✨ 브랜드를 클릭하면 <strong style={{ color: T.mossDark, fontWeight: 700 }}>케이웨더 + wellbian AI를 적용했을 때 추가 효과</strong>를 확인하실 수 있습니다
              </span>
            </div>

            {/* 브랜드 알약 칩 줄 1: 글로벌 메이저 (클릭 가능) */}
            <div className="flex flex-wrap items-center justify-center gap-1.5" style={{ marginBottom: 8 }}>
              {["BMW", "코카콜라", "맥도날드", "P&G", "Nike", "KIA", "Heineken", "Stella Artois", "Pantene"].map((b) => {
                const isActive = selectedBrand === b;
                return (
                  <button
                    key={b}
                    onClick={() => {
                      setSelectedBrand((prev) => (prev === b ? null : b));
                      setTimeout(() => brandPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 80);
                    }}
                    className="transition active:translate-y-px"
                    style={{
                      background: isActive ? T.mossDark : "rgba(255,255,255,0.9)",
                      color: isActive ? "#FFFFFF" : T.mossDark,
                      fontSize: 12.5, fontWeight: isActive ? 700 : 600,
                      padding: "5px 12px", borderRadius: R.full,
                      border: `1px solid ${T.brandTeal}`,
                      letterSpacing: "-0.005em",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      boxShadow: isActive
                        ? "inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 8px rgba(20,68,59,0.22)"
                        : "0 1px 2px rgba(5,0,56,0.04)",
                    }}
                  >
                    {b}
                  </button>
                );
              })}
            </div>

            {/* 검증 수치 라인 — 숫자 강조 */}
            <div
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5"
              style={{
                marginTop: 12, marginBottom: 12,
                fontSize: 13.5, color: T.ink, fontWeight: 500, lineHeight: 1.5,
              }}
            >
              <span>광고 효율<sup style={{ fontSize: 10, color: T.steel, marginLeft: 1, fontWeight: 500 }}>*</sup> <strong style={{ color: T.mossDark, fontWeight: 700 }}>CTR 최대 3배</strong></span>
              <span style={{ color: T.ink4 }}>·</span>
              <span><strong style={{ color: T.mossDark, fontWeight: 700 }}>매출 최대 +200%</strong></span>
              <span style={{ color: T.ink4 }}>·</span>
              <span>ROAS<sup style={{ fontSize: 10, color: T.steel, marginLeft: 1, fontWeight: 500 }}>**</sup> <strong style={{ color: T.mossDark, fontWeight: 700 }}>+600%</strong></span>
            </div>

            {/* === 브랜드 클릭 시 추가 효과 시뮬레이션 카드 (가상) === */}
            {selectedBrand && BRAND_BOOST_SIMULATION[selectedBrand] && (() => {
              const b = BRAND_BOOST_SIMULATION[selectedBrand];
              return (
                <div
                  ref={brandPanelRef}
                  style={{
                    marginTop: 14, marginBottom: 14,
                    background: T.canvas,
                    border: `1px solid ${T.hairlineSoft}`,
                    borderRadius: R.xxxl,
                    padding: "20px 22px",
                    boxShadow: [
                      "inset 0 1px 0 rgba(255,255,255,0.85)",
                      "0 1px 3px rgba(5,0,56,0.05)",
                      "0 8px 24px rgba(5,0,56,0.06)",
                    ].join(", "),
                    animation: "fadeUp 0.4s cubic-bezier(0.2, 0.6, 0.2, 1)",
                  }}
                >
                  {/* 헤더: 브랜드명 + 닫기 */}
                  <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                    <div className="flex items-center gap-2">
                      <span style={{
                        background: T.mossDark, color: "#FFFFFF",
                        fontSize: 12.5, fontWeight: 700,
                        padding: "4px 11px", borderRadius: R.full,
                        letterSpacing: "-0.005em",
                      }}>
                        {selectedBrand}
                      </span>
                      <span style={{ color: T.steel, fontSize: 11.5, fontWeight: 500 }}>
                        {b.industry}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedBrand(null)}
                      className="transition hover:opacity-70"
                      style={{
                        background: "transparent", color: T.steel,
                        fontSize: 11.5, fontWeight: 500,
                        padding: "3px 9px", borderRadius: R.full,
                        border: `1px solid ${T.hairlineSoft}`,
                        cursor: "pointer",
                      }}
                    >
                      닫기 ✕
                    </button>
                  </div>

                  {/* Before vs After 비교 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: 12 }}>
                    {/* Before (글로벌 사례) */}
                    <div style={{
                      background: T.surfaceSoft || T.surface,
                      border: `1px solid ${T.hairlineSoft}`,
                      borderRadius: R.lg,
                      padding: "12px 14px",
                    }}>
                      <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>
                        기존 글로벌 사례
                      </div>
                      <div className="flex items-baseline gap-1.5" style={{ marginBottom: 4 }}>
                        <span style={{ color: T.charcoal, fontSize: 11.5, fontWeight: 500 }}>{b.original.label}</span>
                        <span style={{ color: T.ink, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
                          {b.original.value}
                        </span>
                      </div>
                      <div style={{ color: T.slate, fontSize: 11, fontWeight: 400, lineHeight: 1.45 }}>
                        {b.original.desc}
                      </div>
                    </div>

                    {/* After (케이웨더 + AI 적용 시) */}
                    <div style={{
                      background: `linear-gradient(180deg, rgba(78,179,168,0.10) 0%, rgba(78,179,168,0.04) 100%)`,
                      border: `1.5px solid ${T.brandTeal}`,
                      borderRadius: R.lg,
                      padding: "12px 14px",
                      boxShadow: "0 4px 12px rgba(78,179,168,0.10)",
                    }}>
                      <div className="flex items-center gap-1 mb-1" style={{ color: T.mossDark }}>
                        <Icon name="sparkles" size={11} stroke={2} />
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                          + 케이웨더 × wellbian AI
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5" style={{ marginBottom: 4 }}>
                        <span style={{ color: T.mossDark, fontSize: 11.5, fontWeight: 600 }}>{b.boost.label}</span>
                        <span style={{ color: T.mossDark, fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em" }}>
                          {b.boost.value}
                        </span>
                        <span style={{ color: T.steel, fontSize: 11, fontWeight: 500 }}>→ {b.boost.newValue}</span>
                      </div>
                      <div style={{ color: T.charcoal, fontSize: 11, fontWeight: 400, lineHeight: 1.45 }}>
                        {b.boost.reason}
                      </div>
                    </div>
                  </div>

                  {/* 어떤 wellbian AI 기능이 효과를 만들었나 — Levers */}
                  <div style={{
                    background: T.surface,
                    borderRadius: R.lg,
                    padding: "10px 14px",
                  }}>
                    <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 6 }}>
                      🔧 적용 가능한 wellbian AI 기능
                    </div>
                    <div className="space-y-1">
                      {b.levers.map((lv, i) => (
                        <div key={i} className="flex items-start gap-1.5" style={{ color: T.charcoal, fontSize: 11.5, fontWeight: 400, lineHeight: 1.55 }}>
                          <Icon name="check" size={11} stroke={2.4} style={{ color: T.brandTeal, marginTop: 3, flexShrink: 0 }} />
                          <span>{lv}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 면책 한 줄 */}
                  <div style={{ marginTop: 10, color: T.muted, fontSize: 10, lineHeight: 1.45, textAlign: "center" }}>
                    ※ 추가 효과 수치는 케이웨더 데이터 + wellbian AI 적용 시 추정치입니다. 실제 결과는 광고주 상황·시장에 따라 달라집니다.
                  </div>
                </div>
              );
            })()}

            {/* 메인 카피는 Hero 핵심 카피 3종 정돈 영역으로 이동 — 중복 제거 */}

            {/* 주석 라인 (작게) — 면책 포함 */}
            <div
              style={{
                fontSize: 10.5, color: T.slate, fontWeight: 400, lineHeight: 1.6,
                textAlign: "center", maxWidth: 720, marginLeft: "auto", marginRight: "auto",
                paddingTop: 8, borderTop: "1px dashed rgba(5,0,56,0.08)",
              }}
            >
              <div>
                <span style={{ marginRight: 10 }}><strong>* 광고 효율</strong> · 동일 광고비로 얻는 클릭수·매출 등 성과 지표</span>
                <span><strong>** ROAS</strong> · 광고비 1원당 발생하는 매출 (Return On Ad Spend)</span>
              </div>
              <div style={{ marginTop: 4, color: T.muted, fontSize: 10 }}>
                ※ 위 수치는 BMW·코카콜라 등 글로벌 광고주의 과거 캠페인 실제 사례입니다. 광고주·시기·시장 상황에 따라 결과는 달라질 수 있습니다.
              </div>
            </div>

            {/* ─── Hero 핵심 카피 3종 정돈 영역 ─────────────────
               (1) 서비스 정의 — 제작 편의 넘어 성과 추구
               (2) 기술 스택 라벨 — NVIDIA · 케이웨더 · 예보관
               (3) 가치 명제 — 글로벌 공식의 한국 시장 정밀화
               ────────────────────────────────────────────────── */}
            <div
              className="text-center mx-auto"
              style={{
                marginTop: 28,
                paddingTop: 24,
                maxWidth: 880,
                borderTop: `1px solid ${T.hairlineSoft}`,
              }}
            >
              {/* (1) 서비스 정의 — 모바일 자연 줄바꿈, 데스크탑 한 줄 자연스럽게 */}
              <p
                style={{
                  fontSize: "clamp(13.5px, 1.25vw, 15px)",
                  lineHeight: 1.55,
                  color: T.slate,
                  fontWeight: 400,
                  marginBottom: 12,
                  wordBreak: "keep-all",
                  paddingLeft: 12,
                  paddingRight: 12,
                }}
              >
                Weather Plan AI는 <strong style={{ color: T.ink, fontWeight: 600 }}>광고 제작 편의를 넘어, 상품이 실제로 더 팔리도록</strong> <strong style={{ color: T.ink, fontWeight: 600 }}>카피·예산·타이밍</strong>을 제안합니다.
              </p>

              {/* (2) 기술 스택 라벨 — chip-like */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap" style={{ marginBottom: 10 }}>
                {["NVIDIA 기반 학습 AI", "케이웨더 100+ 시그널", "전문 예보관 검수"].map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center"
                    style={{
                      background: "rgba(78,179,168,0.10)",
                      color: T.mossDark,
                      border: `1px solid rgba(78,179,168,0.35)`,
                      fontSize: 11.5, fontWeight: 600, letterSpacing: "-0.005em",
                      padding: "3px 9px", borderRadius: R.full,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* (3) 가치 명제 */}
              <p
                style={{
                  fontSize: "clamp(12.5px, 1.15vw, 13.5px)",
                  lineHeight: 1.55,
                  color: T.steel,
                  fontWeight: 400,
                }}
              >
                글로벌 광고주가 10년 만들어온 공식을, <strong style={{ color: T.ink, fontWeight: 500 }}>한국 시장에 맞게 더 정밀하게 다시 씁니다.</strong>
              </p>
            </div>
          </div>
        </div>

        {stage === "done" && result && (
          <div ref={resultRef} className="mt-14">
            <ResultCard result={result} />

            {/* === 실제 시작 CTA (데모 → 실서비스 진입 다리) === */}
            <div className="mt-7 mx-auto" style={{ maxWidth: 720 }}>
              <div
                style={{
                  background: `linear-gradient(180deg, rgba(78,179,168,0.10) 0%, rgba(78,179,168,0.04) 100%)`,
                  border: `1.5px solid ${T.brandTeal}`,
                  borderRadius: R.xxxl,
                  padding: "20px 24px",
                  textAlign: "center",
                  boxShadow: "0 4px 14px rgba(78,179,168,0.12)",
                }}
              >
                <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
                  <Icon name="sparkles" size={14} stroke={2} style={{ color: T.mossDark }} />
                  <span style={{ color: T.mossDark, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em" }}>
                    데모는 여기까지 — 실제 운영은 5분이면 시작
                  </span>
                </div>
                <p style={{ color: T.ink, fontSize: 14.5, fontWeight: 500, lineHeight: 1.6, marginBottom: 14, letterSpacing: "-0.005em" }}>
                  <strong style={{ color: T.mossDark, fontWeight: 700 }}>매일 새로운 추천</strong>을 받으려면 사업장 한 번만 등록하세요.<br />
                  베타 기간 무료 · 카드 등록 없이 시작.
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <a
                    href="/onboarding"
                    style={{
                      background: `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)`,
                      color: T.onPrimary,
                      fontSize: 13.5, fontWeight: 600,
                      padding: "10px 18px",
                      borderRadius: R.full,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.22), 0 1px 2px rgba(20,68,59,0.16)",
                    }}
                  >
                    사업장 등록하고 시작 →
                  </a>
                  <a
                    href="/studio"
                    style={{
                      background: T.canvas,
                      color: T.mossDark,
                      fontSize: 13, fontWeight: 500,
                      padding: "10px 16px",
                      borderRadius: R.full,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      border: `1.5px solid ${T.brandTeal}`,
                    }}
                  >
                    챗봇으로 더 물어보기
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ThinkingTrace() {
  const traces = [
    "내 사업장 찾는 중…",
    "케이웨더 데이터에서 조건 추출 중…",
    "광고 채널 매칭 + 예산 안전장치 계산 중…",
    "정확도 점수 산정 중…",
  ];
  return (
    <div
      className="mt-5 max-w-md mx-auto text-left"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
        border: `1px solid ${T.hairlineSoft}`,
        borderRadius: R.xl,
        padding: "16px 20px",
      }}
    >
      {traces.map((t, i) => (
        <div
          key={t}
          className="flex items-center gap-2.5 py-1"
          style={{
            color: T.slate, fontSize: 13, fontWeight: 400,
            animation: `fadeIn 0.4s ease-out ${i * 0.35}s both`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.brandBlue }}></span>
          {t}
        </div>
      ))}
    </div>
  );
}

function ResultCard({ result }) {
  const [channelsExpanded, setChannelsExpanded] = useState(false);
  const hasMany = result.channelStrategy && result.channelStrategy.length >= 3;
  return (
    <div className="max-w-[960px] mx-auto">
      <div
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: `1px solid rgba(255,255,255,0.6)`,
          borderRadius: R.xxxl,
          padding: "32px 36px",
          boxShadow: [
            "inset 0 0 0 1px rgba(0,0,0,0.05)",
            "inset 0 1px 0 rgba(255,255,255,0.85)",
            "inset 0 -1px 0 rgba(0,0,0,0.06)",
            "0 1px 3px rgba(5,0,56,0.05)",
            "0 8px 24px rgba(5,0,56,0.06)",
            "0 24px 60px rgba(5,0,56,0.08)",
          ].join(", "),
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag tint="teal"><Icon name="sparkles" size={12} stroke={2} /><span className="ml-1">wellbian AI 생성 완료</span></Tag>
              <Tag tint="teal">{result.persona}</Tag>
            </div>
            <div style={{ color: T.slate, fontSize: 15 }}>
              <span style={{ color: T.ink, fontWeight: 600 }}>{result.workspace}</span>
              <span className="mx-2" style={{ color: T.muted }}>·</span>
              신뢰도 {(result.confidence * 100).toFixed(0)}%
            </div>
          </div>
          <AccuracyBadge score={result.skillScore} />
        </div>

        <div
          style={{
            background: T.surface,
            border: `1px solid ${T.hairlineSoft}`,
            borderRadius: R.xl,
            padding: "16px 20px",
            marginBottom: 24,
          }}
        >
          <div style={{ color: T.mossDark, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 6 }}>
            요약
          </div>
          <div style={{ color: T.ink, fontSize: 14.5, lineHeight: 1.6, fontWeight: 400 }}>
            {result.summary}
          </div>
        </div>

        {/* 4 rule pillars — pastel cards 28px radius */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {result.rules.map((rule, i) => {
            const t = TINT[rule.tint];
            return (
              <div
                key={rule.axis}
                style={{
                  background: t.light,
                  borderRadius: R.xxxl,
                  padding: 20,
                  animation: `fadeUp 0.5s ease-out ${i * 0.08}s both`,
                }}
              >
                <div style={{ color: t.text, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 8 }}>
                  {rule.axis}
                </div>
                <div style={{ color: T.ink, fontSize: 15, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>
                  {rule.title}
                </div>
                <div style={{ color: T.charcoal, fontSize: 12.5, lineHeight: 1.55, fontWeight: 400 }}>
                  {rule.trigger}
                </div>
              </div>
            );
          })}
        </div>

        {/* === 매체별 상세 전략 (channelStrategy) === */}
        {result.channelStrategy && result.channelStrategy.length > 0 && (
          <div className="mb-6" style={{ paddingTop: 20, borderTop: `1px solid ${T.hairlineSoft}` }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <div className="flex items-center gap-2">
                <Icon name="layers" size={14} stroke={2} style={{ color: T.steel }} />
                <span style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>
                  매체별 상세 전략
                </span>
              </div>
              {hasMany ? (
                <button
                  onClick={() => setChannelsExpanded((v) => !v)}
                  className="transition hover:opacity-70"
                  style={{
                    background: "transparent",
                    color: T.mossDark,
                    fontSize: 11, fontWeight: 600,
                    letterSpacing: "-0.005em",
                    padding: "2px 8px",
                    borderRadius: R.full,
                    border: `1px solid ${T.brandTeal}`,
                    cursor: "pointer",
                  }}
                >
                  {channelsExpanded
                    ? `▲ 접기`
                    : `▼ ${result.channelStrategy.length}개 채널 모두 보기`}
                </button>
              ) : (
                <span style={{ color: T.muted, fontSize: 10.5, fontWeight: 500 }}>
                  {result.channelStrategy.length}개 채널 권장
                </span>
              )}
            </div>

            <div className="space-y-2">
              {result.channelStrategy
                .slice(0, hasMany && !channelsExpanded ? 2 : result.channelStrategy.length)
                .map((cs, i) => (
                <div
                  key={cs.ch}
                  style={{
                    background: T.canvas,
                    border: `1px solid ${T.hairlineSoft}`,
                    borderRadius: R.lg,
                    padding: "12px 14px",
                    animation: `fadeUp 0.35s ease-out ${i * 0.06}s both`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span style={{
                        background: T.mossDark, color: "#FFFFFF",
                        fontSize: 11, fontWeight: 700, letterSpacing: "-0.005em",
                        padding: "3px 9px", borderRadius: R.full,
                      }}>
                        {cs.ch}
                      </span>
                      <span style={{
                        background: T.tealLight, color: T.mossDark,
                        fontSize: 10.5, fontWeight: 700, letterSpacing: "0.02em",
                        padding: "3px 8px", borderRadius: R.full,
                        border: `1px solid ${T.brandTeal}`,
                      }}>
                        입찰 {cs.bidUp}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-1.5" style={{ fontSize: 11.5, lineHeight: 1.55 }}>
                    <div>
                      <span style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", marginRight: 4 }}>
                        타겟
                      </span>
                      <span style={{ color: T.charcoal, fontWeight: 400 }}>{cs.target}</span>
                    </div>
                    <div>
                      <span style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", marginRight: 4 }}>
                        타이밍
                      </span>
                      <span style={{ color: T.charcoal, fontWeight: 400 }}>{cs.time}</span>
                    </div>
                    <div>
                      <span style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", marginRight: 4 }}>
                        포맷
                      </span>
                      <span style={{ color: T.charcoal, fontWeight: 400 }}>{cs.format}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-5 pt-6"
          style={{ borderTop: `1px solid ${T.hairlineSoft}` }}>
          <div className="flex-1 min-w-[260px]">
            <div style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 6 }}>
              미리보기 광고 카피
            </div>
            <div style={{ color: T.ink, fontSize: 15, fontStyle: "italic", fontWeight: 400 }}>
              "{result.creative}"
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3.5">
              {result.channels.map((c) => (
                <span key={c}
                  style={{
                    background: T.surface, color: T.slate,
                    fontSize: 12, fontWeight: 500,
                    padding: "4px 10px", borderRadius: R.md,
                  }}>
                  {c}
                </span>
              ))}
              <span
                style={{
                  background: T.brandTeal, color: T.mossDark,
                  fontSize: 12, fontWeight: 600,
                  padding: "4px 10px", borderRadius: R.md,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.12)",
                }}>
                예상 {result.liftMetric || "효과"} {result.lift}
              </span>
            </div>
          </div>

          {/* 예측 근거 행 — 왜 이 수치인지 */}
          {result.liftBasis && (
            <div className="flex items-start gap-2 mt-4 mb-2" style={{
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

          <BtnPrimary href="/onboarding">사업장 등록하고 받기 →</BtnPrimary>
        </div>

        {/* 결과 카드 footer — /studio 안내 한 줄 */}
        <div
          className="text-center mt-5 pt-4"
          style={{ borderTop: `1px solid ${T.hairlineSoft}` }}
        >
          <span style={{ color: T.steel, fontSize: 12, fontWeight: 400 }}>
            더 많은 질문이 있다면? <a href="/studio" style={{ color: T.mossDark, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>스튜디오에서 자유 챗봇으로 →</a>
          </span>
        </div>
      </div>
    </div>
  );
}

function AccuracyBadge({ score }) {
  const tier = score >= 90 ? "확신" : score >= 70 ? "보통" : "재검토";
  const tint = score >= 90 ? TINT.teal : score >= 70 ? TINT.coral : TINT.rose;
  return (
    <div
      className="flex items-center gap-3"
      style={{ background: tint.light, borderRadius: R.xl, padding: "10px 16px" }}
    >
      <div>
        <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" }}>
          정확도 점수
        </div>
        <div className="flex items-baseline gap-1 leading-none mt-1">
          <span style={{ color: tint.text, fontSize: 28, fontWeight: 600, letterSpacing: "-0.04em" }}>
            {score}
          </span>
          <span style={{ color: T.steel, fontSize: 11, fontWeight: 400 }}>/100</span>
        </div>
      </div>
      <div
        className="pl-3"
        style={{ color: tint.text, borderLeft: `1px solid ${tint.border}55`, fontSize: 12, fontWeight: 600 }}
      >
        {tier}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   5.  KWEATHER ASSETS  (stat-display 64px / 500 / -1.5px)
   ═════════════════════════════════════════════════════════════ */

function KWeatherAssets() {
  const assets = [
    { num: "29년",     label: "1997년부터 국내 최초·최대 민간 기상사업자", sub: "한국 날씨를 가장 오래 가장 정밀하게" },
    { num: "100+",     label: "케이웨더만의 독점 날씨 시그널",             sub: "기상 60+ · 대기 18+ · 13지수 · 시즌 12+" },
    { num: "60일",     label: "유일하게 가능한 앞날 예보 (NVIDIA 학습)",   sub: "광고 캠페인 D-60부터 사전 준비(전문 예보관 트래킹)" },
    { num: "30,000여개", label: "전국 읍/면/동 단위 측정 센서(5분단위)",      sub: "지하철역 · 유명 관광지 · 지역명소까지" },
  ];
  return (
    <section style={{ background: T.surface, paddingTop: 80, paddingBottom: 80 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="text-center mb-12">
          <Tag tint="teal">우리나라 NO.1 날씨 데이터 기업</Tag>
          <h3
            style={{
              fontSize: "clamp(24px, 2.6vw, 32px)",
              lineHeight: 1.25,
              color: T.ink,
              letterSpacing: "-0.015em",
              fontWeight: 500,
              marginTop: 20,
            }}
          >
            한국에서 <span style={{ color: T.mossDark, fontWeight: 600 }}>케이웨더만</span> 가진 4가지.
          </h3>
          <p style={{ color: T.slate, fontSize: 15, fontWeight: 400, marginTop: 12, lineHeight: 1.55 }}>
            누구도 따라할 수 없는 29년 인프라 · 30,000여개 센서 · 60일 AI 예보.<br />
            <span style={{ color: T.mossDark, fontWeight: 500 }}>지하철역·지역명소·관광지·동단위까지</span> 한국 지리에 가장 강합니다.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {assets.map((a, i) => {
            return (
              <div
                key={a.label}
                className="text-center"
                style={{
                  background: T.canvas,
                  border: `1px solid ${T.hairlineSoft}`,
                  borderRadius: R.xl,
                  padding: "30px 18px",
                  animation: `fadeUp 0.5s ease-out ${i * 0.08}s both`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(5,0,56,0.03), 0 6px 18px rgba(5,0,56,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(22px, 2.6vw, 34px)",
                    lineHeight: 1.1,
                    color: T.mossDark,
                    letterSpacing: "-0.025em",
                    fontWeight: 600,
                  }}
                >
                  {a.num}
                </div>
                <div style={{ color: T.ink, fontSize: 12.5, fontWeight: 600, marginTop: 10, lineHeight: 1.45, letterSpacing: "-0.005em" }}>
                  {a.label}
                </div>
                <div style={{ color: T.slate, fontSize: 11, fontWeight: 400, marginTop: 4, lineHeight: 1.4 }}>
                  {a.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   6.  PERSONAS  (4-tier pastel sticky-note cards · 28px radius)
   ═════════════════════════════════════════════════════════════ */

function Personas() {
  const [scenarioPersona, setScenarioPersona] = useState(null);

  // 모달 열림 시 ESC 닫기 + body scroll 잠금
  useEffect(() => {
    if (!scenarioPersona) return;
    const onKey = (e) => { if (e.key === "Escape") setScenarioPersona(null); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [scenarioPersona]);

  return (
    <section id="personas" style={{ background: T.canvas, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader
          eyebrow="누가 쓰나"
          title={<>대형광고주부터<br />동네 카페 사장님까지.</>}
          sub="4종 페르소나, 각자의 워크플로우에 맞춰 진입을 분기합니다."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAS.map((p, i) => (
            <PersonaCard key={p.id} p={p} index={i} onScenarioClick={() => setScenarioPersona(p)} />
          ))}
        </div>
      </div>

      {scenarioPersona && (
        <ScenarioModal persona={scenarioPersona} onClose={() => setScenarioPersona(null)} />
      )}
    </section>
  );
}

function ScenarioModal({ persona, onClose }) {
  const s = persona.scenario;
  const t = TINT[persona.tint];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(5,0,56,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 200ms ease-out",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${persona.title} 시나리오`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.canvas,
          borderRadius: 20,
          width: "100%",
          maxWidth: 680,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(5,0,56,0.35), 0 1px 0 rgba(255,255,255,0.06) inset",
          position: "relative",
        }}
      >
        {/* Header */}
        <div style={{
          background: `linear-gradient(180deg, ${t.bg} 0%, ${t.bg}cc 100%)`,
          padding: "22px 24px 18px",
          borderBottom: `1px solid rgba(5,0,56,0.08)`,
          position: "relative",
        }}>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(255,255,255,0.75)",
              border: "1px solid rgba(5,0,56,0.12)",
              borderRadius: 9999,
              width: 32, height: 32,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: T.charcoal,
              fontSize: 16, lineHeight: 1,
            }}
          >
            ✕
          </button>
          <div style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.6)",
            color: T.charcoal,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
            padding: "4px 10px", borderRadius: 9999,
            marginBottom: 8,
          }}>
            {persona.badge}
          </div>
          <h2 style={{ color: T.primary, fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.25 }}>
            {persona.title} 시나리오
          </h2>
          <div style={{ color: T.charcoal, opacity: 0.7, fontSize: 12.5, fontWeight: 500, marginTop: 5 }}>
            {s.context}
          </div>
        </div>

        <div style={{ padding: "22px 24px 24px" }}>
          {/* 사용자 질문 (말풍선 right) */}
          <div className="flex justify-end mb-3">
            <div style={{
              background: "#14443B", color: "#FFFFFF",
              padding: "11px 15px",
              borderRadius: 16,
              fontSize: 14, fontWeight: 400, lineHeight: 1.55,
              maxWidth: "85%",
              boxShadow: "0 2px 6px rgba(20,68,59,0.2)",
              wordBreak: "keep-all",
            }}>
              {s.question}
            </div>
          </div>

          {/* AI 응답 */}
          <div style={{
            background: "#FAF8F2",
            border: "1px solid rgba(5,0,56,0.08)",
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 16,
          }}>
            <div className="flex items-center gap-1.5 mb-3" style={{ color: "#14443B" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>wellbian AI</span>
            </div>

            {/* 추천 카피 */}
            <div style={{ color: "#050038", fontSize: 16, fontStyle: "italic", fontWeight: 400, lineHeight: 1.5, marginBottom: 14, wordBreak: "keep-all" }}>
              "{s.copy}"
            </div>

            {/* 트리거 callout */}
            <div style={{
              background: "#D7F2EE",
              borderLeft: "3px solid #14443B",
              borderRadius: 8,
              padding: "9px 13px",
              marginBottom: 14,
              fontSize: 12.5, color: "#1A1A1A", lineHeight: 1.55, wordBreak: "keep-all",
            }}>
              <strong style={{ color: "#14443B", fontWeight: 700 }}>왜 지금? </strong>
              {s.trigger}
            </div>

            {/* 매체별 권장 표 */}
            <div style={{ color: "#7B7F8C", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>
              매체별 권장
            </div>
            <div style={{ border: "1px solid rgba(5,0,56,0.08)", borderRadius: 10, overflow: "hidden", marginBottom: 14, background: "#FFFFFF" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: "#F7F5EE" }}>
                    <th style={{ padding: "8px 11px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#14443B", letterSpacing: "0.06em" }}>매체</th>
                    <th style={{ padding: "8px 11px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#14443B", letterSpacing: "0.06em" }}>입찰</th>
                    <th style={{ padding: "8px 11px", textAlign: "left", fontSize: 10.5, fontWeight: 700, color: "#14443B", letterSpacing: "0.06em" }}>타겟</th>
                  </tr>
                </thead>
                <tbody>
                  {s.channels.map((c, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(5,0,56,0.06)" }}>
                      <td style={{ padding: "8px 11px", color: "#050038", fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: "8px 11px", color: "#14443B", fontWeight: 700 }}>{c.bid}</td>
                      <td style={{ padding: "8px 11px", color: "#1A1A1A", fontWeight: 500 }}>{c.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 예상 KPI */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-3" style={{ borderTop: "1px solid rgba(5,0,56,0.08)" }}>
              <div>
                <div style={{ color: "#7B7F8C", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 2 }}>
                  예상 {s.outcomeLabel}
                </div>
                <div style={{ color: "#14443B", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {s.outcomeValue}
                </div>
              </div>
              <div style={{ color: "#7B7F8C", fontSize: 11, fontWeight: 400, lineHeight: 1.5, maxWidth: 320, textAlign: "right", wordBreak: "keep-all" }}>
                {s.outcomeBasis}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="/studio"
              className="transition active:translate-y-px"
              style={{
                flex: 1,
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "linear-gradient(180deg, #1F6157 0%, #14443B 100%)",
                color: "#FFFFFF",
                padding: "12px 18px",
                borderRadius: 9999,
                fontSize: 13.5, fontWeight: 600,
                textDecoration: "none",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 14px rgba(20,68,59,0.22)",
              }}
            >
              Studio에서 직접 체험 →
            </a>
            <a
              href="/onboarding"
              className="transition active:translate-y-px hover:opacity-95"
              style={{
                flex: 1,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "#FFFFFF",
                color: "#050038",
                padding: "12px 18px",
                borderRadius: 9999,
                fontSize: 13.5, fontWeight: 500,
                textDecoration: "none",
                border: "1px solid rgba(5,0,56,0.12)",
              }}
            >
              등록 시작
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonaCard({ p, index, onScenarioClick }) {
  const t = TINT[p.tint];
  return (
    <div
      className="transition-all duration-300"
      style={{
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(180deg, ${t.bg} 0%, ${t.bg}cc 100%)`,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: `1px solid rgba(5,0,56,0.06)`,
        borderRadius: R.xxxl,        // 28px — Miro 시그니처
        padding: 32,
        animation: `fadeUp 0.5s ease-out ${index * 0.08}s both`,
        cursor: "default",
        boxShadow: [
          "inset 0 0 0 1px rgba(0,0,0,0.04)",
          "inset 0 1px 0 rgba(255,255,255,0.6)",
          "inset 0 -1px 0 rgba(0,0,0,0.06)",
          "0 1px 2px rgba(0,0,0,0.05)",
          "0 8px 24px rgba(0,0,0,0.06)",
        ].join(", "),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = [
          "inset 0 0 0 1px rgba(0,0,0,0.06)",
          "inset 0 1px 0 rgba(255,255,255,0.7)",
          "inset 0 -1px 0 rgba(0,0,0,0.08)",
          "0 2px 4px rgba(0,0,0,0.06)",
          "0 16px 36px rgba(0,0,0,0.1)",
        ].join(", ");
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = [
          "inset 0 0 0 1px rgba(0,0,0,0.04)",
          "inset 0 1px 0 rgba(255,255,255,0.6)",
          "inset 0 -1px 0 rgba(0,0,0,0.06)",
          "0 1px 2px rgba(0,0,0,0.05)",
          "0 8px 24px rgba(0,0,0,0.06)",
        ].join(", ");
      }}
    >
      {/* 큰 워터마크 숫자 (배경) — 첨부 이미지처럼 카드 우상단에 크게 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -14,
          right: 14,
          fontSize: "clamp(120px, 12vw, 168px)",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.06em",
          color: t.text,
          opacity: 0.1,
          pointerEvents: "none",
          fontFamily: "'Pretendard Variable', Pretendard, system-ui",
          userSelect: "none",
        }}
      >
        0{index + 1}
      </div>

      <div className="flex items-start mb-5" style={{ position: "relative", zIndex: 1 }}>
        <span
          style={{
            background: "rgba(255,255,255,0.6)", color: t.text,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
            padding: "4px 10px", borderRadius: R.full,
          }}
        >
          {p.badge}
        </span>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <h3
          style={{
            fontSize: 24, lineHeight: 1.25,
            color: T.primary, letterSpacing: "-0.015em",
            fontWeight: 500, marginBottom: 6,
          }}
        >
          {p.title}
        </h3>
        <div style={{ color: T.charcoal, opacity: 0.65, fontSize: 12.5, fontWeight: 400, marginBottom: 20 }}>
          예: {p.examples}
        </div>

        <div className="space-y-3">
          <div>
            <div style={{ color: T.charcoal, opacity: 0.55, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 4 }}>
              지금 고통
            </div>
            <div style={{ color: T.charcoal, fontSize: 13.5, lineHeight: 1.55, fontWeight: 400 }}>
              {p.pain}
            </div>
          </div>
          <div style={{ borderTop: `1px solid rgba(5,0,56,0.08)`, paddingTop: 12 }}>
            <div style={{ color: T.primary, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 4 }}>
              wellbian AI 해결
            </div>
            <div style={{ color: T.primary, fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>
              {p.solution}
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-6 pt-4 flex items-center justify-between"
        style={{ borderTop: `1px solid rgba(5,0,56,0.08)`, position: "relative", zIndex: 1 }}
      >
        <div style={{ color: T.charcoal, fontSize: 12, fontWeight: 600 }}>
          {p.metric}
        </div>
        <button
          onClick={onScenarioClick}
          className="hover:opacity-70 transition active:translate-y-px"
          style={{ color: T.primary, fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: "transparent", border: "none", padding: 0 }}
        >
          시나리오 보기 →
        </button>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   7.  HOW IT WORKS
   ═════════════════════════════════════════════════════════════ */

function HowItWorks() {
  return (
    <section id="how" style={{ background: T.surface, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader
          eyebrow="3단계로 광고 추천 끝"
          title="5분이면 시작."
          sub="기존 광고 계정 권한이 필요 없습니다. 케이웨더 데이터로 의사결정만 도와드리고, 실행은 광고주가 광고 콘솔에서 직접 하실 수 있습니다."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOW_STEPS.map((s, i) => (
            <div
              key={s.n}
              style={{
                position: "relative",
                overflow: "hidden",
                background: T.canvas,
                border: `1px solid ${T.hairlineSoft}`,
                borderRadius: R.xl,
                padding: 28,
                animation: `fadeUp 0.5s ease-out ${i * 0.1}s both`,
              }}
            >
              {/* 큰 워터마크 숫자 (배경) */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -14,
                  right: 14,
                  fontSize: "clamp(96px, 9.5vw, 132px)",
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.06em",
                  color: T.mossDark,
                  opacity: 0.08,
                  pointerEvents: "none",
                  fontFamily: "'Pretendard Variable', Pretendard, system-ui",
                  userSelect: "none",
                }}
              >
                {s.n}
              </div>

              <div className="mb-5" style={{ position: "relative", zIndex: 1 }}>
                <span
                  style={{
                    background: T.tealLight, color: T.mossDark,
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                    padding: "4px 10px", borderRadius: R.full,
                    display: "inline-block",
                  }}
                >
                  {s.detail}
                </span>
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <h3
                  style={{
                    fontSize: 22, lineHeight: 1.3,
                    color: T.ink, letterSpacing: "-0.015em",
                    fontWeight: 500, marginBottom: 10,
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ color: T.slate, fontSize: 14, fontWeight: 400, lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   8.  TRIGGERS  (케이웨더 단독 출처)
   ═════════════════════════════════════════════════════════════ */

function Triggers() {
  return (
    <section id="triggers" style={{ background: T.canvas, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader
          eyebrow="케이웨더 데이터 카탈로그"
          title={<>100가지+ 날씨 상황 시그널을<br /><span style={{ color: T.mossDark }}>광고에 맞춰 제안합니다.</span></>}
          sub="기상·대기·생활기상·시즌 데이터를 카테고리별로 정리해 두었습니다. 과거 사례로 학습, 현재 데이터로 트리거, 60일 앞 예보까지 — 광고 의사결정에 필요한 데이터를 한 곳에서."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TRIGGER_CATALOG.map((cat, i) => {
            const t = TINT[cat.tint];
            return (
              <div
                key={cat.name}
                style={{
                  background: T.canvas,
                  border: `1px solid ${T.hairlineSoft}`,
                  borderRadius: R.xl,
                  padding: 28,
                  animation: `fadeUp 0.5s ease-out ${i * 0.08}s both`,
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div
                    style={{
                      background: t.light, color: t.text,
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                      padding: "4px 10px", borderRadius: R.full,
                    }}
                  >
                    {cat.count}가지
                  </div>
                </div>
                <h3
                  style={{
                    fontSize: 19, lineHeight: 1.3,
                    color: T.ink, letterSpacing: "-0.01em",
                    fontWeight: 600, marginBottom: 16,
                  }}
                >
                  {cat.name}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((it) => (
                    <TriggerChip key={it} item={it} tint={cat.tint} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 네이버 검색량 통합 (keyword-console heritage) */}
        <div
          className="glass-card mt-10 mx-auto"
          style={{
            borderRadius: R.xxxl,
            padding: "20px 24px",
            maxWidth: 760,
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-start gap-3 md:gap-4 md:flex-1" style={{ minWidth: 0 }}>
              <div
                style={{
                  width: 40, height: 40,
                  color: T.mossDark,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="search" size={28} stroke={1.6} />
              </div>
              <div className="flex-1" style={{ minWidth: 0 }}>
                <div style={{ color: T.mossDark, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 3 }}>
                  BETA · 검색 신호 통합 진행 중
                </div>
                <div style={{ color: T.ink, fontSize: 14, fontWeight: 500, lineHeight: 1.6, wordBreak: "keep-all" }}>
                  <strong style={{ color: T.ink, fontWeight: 600 }}>"비 오는 날 우산 검색이 평소보다 4배 늘어나는 순간"</strong>처럼,
                  날씨와 사람들의 실제 관심을 연결한 신호를 매일 학습합니다.
                  <span style={{ color: T.mossDark, fontWeight: 500 }}> 앞으로 더 많은 검색 채널과 결합해 점점 정밀해집니다.</span>
                </div>
              </div>
            </div>
            <span
              className="self-start md:self-center"
              style={{
                background: T.tealLight, color: T.mossDark,
                fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                padding: "4px 10px", borderRadius: R.full,
                whiteSpace: "nowrap",
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              23,000+ 키워드 · 확장 중
            </span>
          </div>
        </div>

        <div className="mt-8 text-center" style={{ color: T.steel, fontSize: 12.5, fontWeight: 400 }}>
          모든 시그널은 과거 · 현재 · 60일 앞 예보 3가지로 사용 가능 · 전체 카탈로그는 <a href="mailto:psw1224@kweather.co.kr" style={{ color: T.mossDark, fontWeight: 600, textDecoration: "underline" }}>영업팀 문의</a>
        </div>
      </div>
    </section>
  );
}

function TriggerChip({ item, tint }) {
  const [hover, setHover] = useState(false);
  const t = TINT[tint];
  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="transition cursor-default"
      style={{
        background: hover ? t.light : T.surface,
        color: hover ? t.text : T.slate,
        border: `1px solid ${hover ? t.border + "33" : T.hairlineSoft}`,
        fontSize: 12, fontWeight: 500,
        padding: "5px 10px", borderRadius: R.md,
      }}
    >
      {item}
    </span>
  );
}

/* ═════════════════════════════════════════════════════════════
   9.  TRUST · 정확도 점수 공시
   ═════════════════════════════════════════════════════════════ */

function Trust() {
  return (
    <section id="trust" style={{ background: T.surface, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <Tag tint="teal">
              <LiveDot color={T.brandTeal} />
              <span className="ml-0.5">정확도 매일 공시</span>
            </Tag>
            <h2
              style={{
                fontSize: "clamp(26px, 4.2vw, 40px)",
                lineHeight: 1.2,
                color: T.ink,
                letterSpacing: "-0.02em",
                fontWeight: 500,
                marginTop: 24, marginBottom: 20,
              }}
            >
              60일 앞 예측,<br />
              <span style={{ color: T.mossDark }}>전문 예보관이 매일 검수합니다.</span>
            </h2>
            <p style={{ color: T.slate, fontSize: 15.5, fontWeight: 400, lineHeight: 1.7, marginBottom: 24 }}>
              케이웨더 면허 예보관이 검수한 정확도를 매일 공시합니다.<br />
              1·7·30·60일 앞 평균 오차 · 적중률 · 신뢰도 — 누구나 확인 가능.
              <br />
              <span style={{ color: T.mossDark, fontWeight: 500 }}>AI 위에 사람의 사인이 더해진 숫자입니다.</span>
            </p>
            <ul className="space-y-2.5">
              {[
                "매일 자정 자동 검증 · 일별 결과 공개",
                "1 · 7 · 30 · 60일 표시",
                "광고 추천 결과 1건마다 정확도 점수 미리 보기",
              ].map((tx) => (
                <li key={tx} className="flex items-start gap-2.5"
                  style={{ color: T.ink, fontSize: 14, fontWeight: 400 }}>
                  <span
                    className="flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      width: 18, height: 18, borderRadius: R.full,
                      background: T.brandTeal, color: T.primary,
                      fontSize: 11, fontWeight: 600,
                    }}
                  >
                    ✓
                  </span>
                  {tx}
                </li>
              ))}
            </ul>
          </div>

          <AccuracyChart />
        </div>
      </div>
    </section>
  );
}

function AccuracyChart() {
  return (
    <div
      className="float-gentle"
      style={{
        background: T.canvas,
        border: `1px solid ${T.hairlineSoft}`,
        borderRadius: R.xxxl,
        padding: 28,
        boxShadow: "0 20px 48px rgba(5,0,56,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <div style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em" }}>
            2026년 5월 · 60일 앞
          </div>
          <div style={{ color: T.ink, fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", marginTop: 4 }}>
            기온 예측 정확도
          </div>
        </div>
        <Tag tint="teal">
          <LiveDot color={T.brandTeal} />
          <span className="ml-0.5">LIVE</span>
        </Tag>
      </div>

      <div className="relative mb-5" style={{ height: 168 }}>
        <svg viewBox="0 0 320 140" className="w-full h-full">
          <defs>
            <linearGradient id="kwArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.brandTeal} stopOpacity="0.5" />
              <stop offset="100%" stopColor={T.brandTeal} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80, 100, 120].map((y) => (
            <line key={y} x1="0" x2="320" y1={y} y2={y} stroke={T.hairlineSoft} strokeWidth="1" />
          ))}
          <path
            d="M 0 70 L 30 65 L 60 72 L 90 60 L 120 55 L 150 62 L 180 50 L 210 58 L 240 48 L 270 52 L 300 45 L 320 50 L 320 140 L 0 140 Z"
            fill="url(#kwArea)"
          />
          <path
            d="M 0 70 L 30 65 L 60 72 L 90 60 L 120 55 L 150 62 L 180 50 L 210 58 L 240 48 L 270 52 L 300 45 L 320 50"
            fill="none" stroke={T.primary} strokeWidth="2.5" strokeLinecap="round"
          />
          {[[0, 70], [60, 72], [120, 55], [180, 50], [240, 48], [300, 45]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3.5" fill={T.canvas} stroke={T.primary} strokeWidth="2" />
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "평균 오차", value: "±1.8℃", sub: "60일 앞 기준",   tint: "teal" },
          { label: "적중률",   value: "87%",   sub: "비·눈 예측",     tint: "coral" },
          { label: "신뢰도",   value: "74%",   sub: "강한 비 50mm↑", tint: "navy" },
        ].map((m) => {
          const t = TINT[m.tint];
          return (
            <div
              key={m.label}
              style={{
                background: t.light,
                border: `1px solid rgba(0,0,0,0.06)`,
                borderRadius: R.lg,
                padding: "12px 14px",
                boxShadow: [
                  "inset 0 0 0 1px rgba(0,0,0,0.04)",
                  "inset 0 1px 0 rgba(255,255,255,0.6)",
                  "inset 0 -1px 0 rgba(0,0,0,0.06)",
                  "0 1px 2px rgba(0,0,0,0.04)",
                  "0 4px 12px rgba(0,0,0,0.06)",
                ].join(", "),
              }}
            >
              <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>
                {m.label}
              </div>
              <div
                style={{
                  color: t.text, fontSize: 22, fontWeight: 600,
                  letterSpacing: "-0.025em", lineHeight: 1.2, marginTop: 4,
                }}
              >
                {m.value}
              </div>
              <div style={{ color: T.slate, fontSize: 10, fontWeight: 400, marginTop: 2 }}>
                {m.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   10.  AI 비서 시대  (다크 배너, blob 제거, 깔끔)
   ═════════════════════════════════════════════════════════════ */

function AIAgentEra() {
  return (
    <section style={{ background: T.canvas, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div
          style={{
            background: T.primary, color: T.onPrimary,
            borderRadius: R.feature,
            padding: "56px 48px",
            position: "relative",
            overflow: "hidden",
            isolation: "isolate",
          }}
        >
          {/* Hero 루프 영상 재활용 — 다크 오버레이로 텍스트 가독성 보장 */}
          <video
            className="hero-cta-video"
            autoPlay muted loop playsInline preload="metadata"
            aria-hidden="true"
          >
            <source src="/hero-loop.mp4" type="video/mp4" />
          </video>
          <div className="hero-cta-overlay" aria-hidden="true" />

          <div className="max-w-3xl" style={{ position: "relative", zIndex: 1 }}>
            <div className="inline-flex mb-6 items-center gap-2 flex-wrap">
              <span
                style={{
                  background: T.brandTeal, color: T.primary,
                  fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                  padding: "4px 12px", borderRadius: R.full,
                }}
              >
                AI가 광고를 판단하는 시대
              </span>
              <span
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: T.onDark,
                  fontSize: 11, fontWeight: 500, letterSpacing: "0.04em",
                  padding: "4px 10px", borderRadius: R.full,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                GOOGLE I/O 2026 · Anthropic Computer Use 대응 준비중.
              </span>
            </div>

            <h2
              style={{
                fontSize: "clamp(28px, 4.6vw, 48px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                fontWeight: 500, marginBottom: 20,
              }}
            >
              앞으로 광고는 AI가 결정합니다.<br />
              <span style={{ color: T.brandTeal }}>
                그 AI에게 날씨 답을 주는 건 wellbian AI입니다.
              </span>
            </h2>

            <p style={{ color: T.onDarkMuted, fontSize: 16, fontWeight: 400, lineHeight: 1.65, marginBottom: 36, maxWidth: 640 }}>
              AI 비서가 광고를 단순히 실행하는 게 아니라, <strong style={{ color: T.brandTeal, fontWeight: 600 }}>스스로 판단하고 추천하는 시대</strong>가 옵니다.
              <br />
              그 AI들이 "한국 날씨로 광고 어떻게 할까?"를 물을 때, 답을 주는 건 케이웨더 데이터를 가진 wellbian AI뿐입니다.
              <br />
              <span style={{ color: T.onDark, fontWeight: 500 }}>다른 광고 도구는 흉내낼 수 없습니다.</span>
            </p>

            {/* glass cards #3 — only place glassmorphism appears in this section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { step: "A", title: "사장님이 카톡에",
                  body: '"비 오는 날 우산 광고 더 띄워줘"',
                  result: "Claude · Gemini · ChatGPT AI가 wellbian AI에게 물어봄" },
                { step: "B", title: "마케터가 ChatGPT에게",
                  body: '"이번 주말 패딩 광고 어떻게 할까?"',
                  result: "wellbian AI(Kweather) 60일 예보 + 정확도 91점 답변 자동" },
                { step: "C", title: "대행사 AE에게 매일 9시",
                  body: "어제 광고 효과 + 오늘 권장 액션 자동",
                  result: "AE는 광고주에게 보고만" },
              ].map((s, i) => (
                <div
                  key={s.step}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: R.xl,
                    padding: 20,
                    animation: `fadeUp 0.5s ease-out ${i * 0.1}s both`,
                  }}
                >
                  <div style={{ color: T.brandTeal, fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", marginBottom: 10 }}>
                    시나리오 {s.step}
                  </div>
                  <div style={{ color: T.onDark, fontSize: 14.5, fontWeight: 600, marginBottom: 8 }}>
                    {s.title}
                  </div>
                  <div style={{ color: T.onDarkMuted, fontSize: 13, fontStyle: "italic", fontWeight: 400, lineHeight: 1.55, marginBottom: 14 }}>
                    {s.body}
                  </div>
                  <div style={{ color: T.brandTeal, fontSize: 11.5, fontWeight: 500 }}>
                    → {s.result}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   10b.  TREND MATRIX 2026 — 트렌드 코리아 2026 × Weather Plan AI
       시장의 큰 흐름과 우리 솔루션의 정합도를 한 눈에 보여주는 매트릭스
   ═════════════════════════════════════════════════════════════ */

const TREND_MATRIX_2026 = [
  {
    icon: "search",
    trendKey: "GEO — 생성형 엔진 최적화",
    trendDesc: "검색이 AI 답변으로. 정보가 곧 광고가 된다.",
    trendCite: "2026 광고·미디어 트렌드 보고서",
    example: "AI 검색 활용 50% · ChatGPT·제미나이 쇼핑 도입",
    ourAnswer: "AI가 한국 날씨를 물으면, 답하는 건 wellbian",
    ourDetail: "Claude·Gemini·ChatGPT가 \"한국 비 오는 날 광고 어떻게\"를 물을 때, 케이웨더 데이터로 답하는 GEO 원천 소스. 다른 광고 도구는 흉내낼 수 없습니다.",
    tint: "amber",
  },
  {
    icon: "trending-up",
    trendKey: "주목도 기반 성과",
    trendDesc: "노출·도달이 아니라 \"얼마나 주목했는가\"로 이동.",
    trendCite: "2026 광고·미디어 트렌드 보고서",
    example: "인터넷 사용자 86% 배너 블라인드 경험",
    ourAnswer: "\"지금 필요한 순간\"에만 노출",
    ourDetail: "비 올 때 우산을, 폭염에 빙수를. 무관한 노출이 아니라 날씨 맥락이 맞는 순간에만 노출 — 주목도가 자연히 올라갑니다.",
    tint: "lime",
  },
  {
    icon: "award",
    trendKey: "시즌 대표자 전략",
    trendDesc: "유행 다 쫓지 말고, 한 시즌의 대표가 되라.",
    trendCite: "트렌드 코리아 2026",
    example: "투썸 \"겨울엔 스초생\" · 스타벅스 프리퀀시",
    ourAnswer: "18개 업종마다 시즌 대표 카피",
    ourDetail: "장마엔 카페·우산, 폭염엔 빙수·맥주, 한파엔 호캉스. 시즌이 바뀌면 카피도 추천이 바뀝니다.",
    tint: "teal",
  },
  {
    icon: "cpu",
    trendKey: "AI가 결정하는 광고 (Agentic Ad)",
    trendDesc: "AI는 실행 도구가 아니라, 판단·추천 주체.",
    trendCite: "버즈빌 ACTIVE 2026",
    example: "타겟·소재·예산 배분을 AI가 실시간 최적화",
    ourAnswer: "AI는 추천, 광고주가 실행",
    ourDetail: "wellbian AI가 카피·예산·타이밍을 추천하면, 광고주가 광고 콘솔에서 1분이면 적용. 광고비 사고 책임은 광고주에게.",
    tint: "coral",
  },
  {
    icon: "zap",
    trendKey: "찰나의 시즌 (픽셀 라이프)",
    trendDesc: "잘게 흩어진 소비, 작은 단위로 빨리 잡아라.",
    trendCite: "트렌드 코리아 2026",
    example: "팝업 스토어 · 밀키트 · 쇼츠 · 한정판",
    ourAnswer: "5분 단위 · 동단위 · 60일 앞 예보",
    ourDetail: "케이웨더 측정망 30,000여개로 \"오늘 오후 3시 강남에 비\" 같은 미시 트리거 잡아냅니다.",
    tint: "navy",
  },
  {
    icon: "target",
    trendKey: "개인 레벨 마케팅",
    trendDesc: "인구통계(20대 여성) 벗어나, 개인 경험 설계.",
    trendCite: "트렌드 코리아 2026",
    example: "넷플릭스 추천 · 아마존 자동 가격",
    ourAnswer: "매장 동네 + 시간대 골든타임",
    ourDetail: "강남 5km 반경 + 비 오는 오후 14~17시 한산 시간대 한정 추천 — 인구통계 X, 동·시간 매칭.",
    tint: "purple",
  },
  {
    icon: "pen-line",
    trendKey: "콘텐츠가 본업, 트래픽 X",
    trendDesc: "광고는 트래픽 측정 X, 잘 팔리는 콘텐츠.",
    trendCite: "한국 마케팅 뉴스레터 트렌드",
    example: "엘르·뉴스레터 광고 부상 · 잡지 광고 재조명",
    ourAnswer: "잘 만드는 카피 X, 잘 팔리는 카피",
    ourDetail: "wellbian AI는 표현이 화려한 순이 아니라, 날씨 × 자체 학습 데이터로 더 팔릴 순서대로 카피를 추천합니다.",
    tint: "rose",
  },
];

function TrendMatrix2026() {
  return (
    <section style={{ background: T.surface, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader
          eyebrow="2026 마케팅 트렌드의 정중앙"
          title={<>2026 트렌드가 말하는 것 ·<br /><span style={{ color: T.mossDark }}>Weather Plan AI가 이미 하고 있는 것.</span></>}
          sub="2026 광고·미디어 트렌드 보고서 · 트렌드 코리아 2026 · 버즈빌 ACTIVE 2026이 공통으로 짚는 7가지 흐름 — 우리는 정중앙에 있습니다."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ marginBottom: 24 }}>
          {TREND_MATRIX_2026.map((t, i) => {
            const tint = TINT[t.tint] || TINT.teal;
            return (
              <div
                key={t.trendKey}
                className="glass-card flex flex-col"
                style={{
                  borderRadius: R.xxxl,
                  padding: "24px 26px",
                  animation: `fadeUp 0.5s ease-out ${i * 0.07}s both`,
                  minHeight: 280,
                }}
              >
                {/* 트렌드 키워드 (위) */}
                <div style={{ marginBottom: 14 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                    <div style={{
                      width: 36, height: 36,
                      background: tint.light,
                      borderRadius: R.md,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: tint.text,
                      border: `1px solid ${tint.border}40`,
                    }}>
                      <Icon name={t.icon} size={20} stroke={2.2} />
                    </div>
                    <span style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      시장 트렌드
                    </span>
                  </div>
                  <h3 style={{ color: T.ink, fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.35, marginBottom: 6, wordBreak: "keep-all" }}>
                    {t.trendKey}
                  </h3>
                  <p style={{ color: T.charcoal, fontSize: 13, fontWeight: 400, lineHeight: 1.55, wordBreak: "keep-all" }}>
                    {t.trendDesc}
                  </p>
                  <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 500, marginTop: 6, letterSpacing: "-0.005em" }}>
                    예: {t.example} <span style={{ color: T.steel }}>· {t.trendCite}</span>
                  </div>
                </div>

                {/* 구분선 + 우리 답 */}
                <div style={{
                  flex: 1,
                  paddingTop: 14,
                  borderTop: `1px dashed rgba(5,0,56,0.12)`,
                }}>
                  <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                    <Icon name="sparkles" size={11} stroke={2} style={{ color: T.mossDark }} />
                    <span style={{ color: T.mossDark, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                      Weather Plan AI
                    </span>
                  </div>
                  <div style={{ color: T.mossDark, fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.4, marginBottom: 7, wordBreak: "keep-all" }}>
                    {t.ourAnswer}
                  </div>
                  <p style={{ color: T.slate, fontSize: 12.5, fontWeight: 400, lineHeight: 1.6, wordBreak: "keep-all" }}>
                    {t.ourDetail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 마무리 한 줄 */}
        <div className="text-center mx-auto" style={{ maxWidth: 720 }}>
          <p style={{ color: T.charcoal, fontSize: 14, fontWeight: 400, lineHeight: 1.7 }}>
            트렌드 코리아 2026이 말하는 흐름과 한국 마케터들이 매주 보는 뉴스레터의 인사이트 —<br />
            <strong style={{ color: T.ink, fontWeight: 600 }}>그 정중앙에 있는 광고 도구가 Weather Plan AI</strong>입니다.
            <span style={{ color: T.mossDark, fontWeight: 500 }}> 한 발 빠르게 시작하세요.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   11.  PRICING  (4-tier · featured uses brand-blue border)
   ═════════════════════════════════════════════════════════════ */

function PricingSection() {
  return (
    <section id="pricing" style={{ background: T.surface, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader
          eyebrow="가격"
          title={<>잘 팔리게 하는데<br /><span style={{ color: T.mossDark }}>이 정도 합리적 요금.</span></>}
          sub="자영업 1인 사장님부터 대기업·대행사까지 — 예측 가능하고 안전합니다."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRICING.map((p, i) => (
            <PricingCard key={p.tier} p={p} index={i} />
          ))}
        </div>

        <div className="mt-10 text-center" style={{ color: T.steel, fontSize: 12.5, fontWeight: 400 }}>
          광고 추천 결과 1건 = 날씨 조건이 맞아서 광고 채널 1개에 1번 변경하는 것 · <span style={{ color: T.mossDark, fontWeight: 600 }}>현재 베타 기간 무료</span> · 카드 등록 없이 시작
        </div>
      </div>
    </section>
  );
}

function PricingCard({ p, index }) {
  if (p.dark) {
    return (
      <div
        className="flex flex-col"
        style={{
          background: T.primary, color: T.onPrimary,
          borderRadius: R.xl, padding: 28,
          animation: `fadeUp 0.5s ease-out ${index * 0.08}s both`,
        }}
      >
        <div style={{ color: T.brandTeal, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          {p.tier}
        </div>
        <div className="flex items-baseline gap-1" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>{p.price}</span>
        </div>
        <div style={{ color: T.brandTeal, fontSize: 12.5, fontWeight: 600, marginBottom: 16 }}>
          {p.quota}
        </div>
        <div style={{ color: T.onDarkMuted, fontSize: 12, fontWeight: 400, lineHeight: 1.55, marginBottom: 20, height: 36 }}>
          {p.for}
        </div>
        <button
          className="hover:opacity-95 transition active:translate-y-px mb-5"
          style={{
            width: "100%", background: T.brandTeal, color: T.mossDark,
            fontSize: 14, fontWeight: 600,
            padding: "13px 0", borderRadius: R.full,
            boxShadow: [
              "inset 0 1px 0 rgba(255,255,255,0.32)",
              "inset 0 -1px 0 rgba(0,0,0,0.18)",
              "0 1px 3px rgba(0,0,0,0.18)",
              "0 6px 18px rgba(78,179,168,0.28)",
            ].join(", "),
          }}
        >
          영업팀 문의
        </button>
        <ul className="space-y-2.5">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2"
              style={{ color: T.onDarkMuted, fontSize: 12.5, fontWeight: 400 }}>
              <span
                className="flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  width: 16, height: 16, borderRadius: R.full,
                  background: T.brandTeal, color: T.primary,
                  fontSize: 10, fontWeight: 600,
                }}
              >
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (p.highlight) {
    /* pricing-card-featured: 다홍색 톤 (사용자 명시) */
    const accent = T.brandCoral;       // #FF6850 다홍
    const accentBg = T.coralLight;     // #FFE4DE 살구
    const accentDark = T.coralDark;    // #B83A28 진다홍
    return (
      <div
        className="relative flex flex-col"
        style={{
          background: accentBg,
          border: `2px solid ${accent}`,
          borderRadius: R.xl, padding: 28,
          animation: `fadeUp 0.5s ease-out ${index * 0.08}s both`,
          boxShadow: `0 4px 14px ${accent}33, 0 12px 32px ${accent}22`,
        }}
      >
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            style={{
              background: accent, color: "#FFFFFF",
              fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
              padding: "3px 12px", borderRadius: R.full,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(184,58,40,0.32)",
            }}
          >
            가장 인기
          </span>
        </div>
        <div style={{ color: accentDark, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
          {p.tier}
        </div>
        {p.badge && (
          <div className="inline-flex items-center gap-1 self-start mb-2" style={{
            background: "rgba(78,179,168,0.15)", color: T.mossDark,
            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
            padding: "3px 9px", borderRadius: R.full,
            border: "1px solid rgba(78,179,168,0.4)",
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
            {p.badge}
          </div>
        )}
        <div className="flex items-baseline gap-2" style={{ marginBottom: 6 }}>
          <span style={{ color: T.ink4, fontSize: 18, fontWeight: 400, textDecoration: "line-through", letterSpacing: "-0.01em" }}>{p.price}</span>
          <span style={{ color: T.mossDark, fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>무료</span>
          <span style={{ color: T.slate, fontSize: 12, fontWeight: 400 }}>{p.period}</span>
        </div>
        <div style={{ color: accentDark, fontSize: 12.5, fontWeight: 600, marginBottom: 16 }}>
          {p.quota}
        </div>
        <div style={{ color: T.slate, fontSize: 12, fontWeight: 400, lineHeight: 1.55, marginBottom: 20, height: 36 }}>
          {p.for}
        </div>
        <button
          className="hover:bg-white transition active:translate-y-px mb-5"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: accentDark,
            border: `1px solid ${accent}55`,
            fontSize: 14, fontWeight: 600,
            padding: "13px 0", borderRadius: R.full,
            boxShadow: [
              "inset 0 1px 0 rgba(255,255,255,0.9)",
              "inset 0 -1px 0 rgba(184,58,40,0.06)",
              "0 1px 2px rgba(184,58,40,0.06)",
              "0 4px 12px rgba(255,104,80,0.10)",
            ].join(", "),
          }}
        >
          무료로 시작
        </button>
        <ul className="space-y-2.5">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2"
              style={{ color: T.charcoal, fontSize: 12.5, fontWeight: 400 }}>
              <span
                className="flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  width: 16, height: 16, borderRadius: R.full,
                  background: accent, color: "#FFFFFF",
                  fontSize: 10, fontWeight: 600,
                }}
              >
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        background: T.canvas,
        border: `1px solid ${T.hairline}`,
        borderRadius: R.xl, padding: 28,
        animation: `fadeUp 0.5s ease-out ${index * 0.08}s both`,
      }}
    >
      <div style={{ color: T.ink, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
        {p.tier}
      </div>
      {p.badge && (
        <div className="inline-flex items-center gap-1 self-start mb-2" style={{
          background: "rgba(78,179,168,0.15)", color: T.mossDark,
          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
          padding: "3px 9px", borderRadius: R.full,
          border: "1px solid rgba(78,179,168,0.4)",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 12 20 22 4 22 4 12" />
            <rect x="2" y="7" width="20" height="5" />
            <line x1="12" y1="22" x2="12" y2="7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
          {p.badge}
        </div>
      )}
      <div className="flex items-baseline gap-2" style={{ marginBottom: 6 }}>
        <span style={{ color: T.ink4, fontSize: 18, fontWeight: 400, textDecoration: "line-through", letterSpacing: "-0.01em" }}>{p.price}</span>
        <span style={{ color: T.mossDark, fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>무료</span>
        <span style={{ color: T.slate, fontSize: 12, fontWeight: 400 }}>{p.period}</span>
      </div>
      <div style={{ color: T.mossDark, fontSize: 12.5, fontWeight: 600, marginBottom: 16 }}>
        {p.quota}
      </div>
      <div style={{ color: T.slate, fontSize: 12, fontWeight: 400, lineHeight: 1.55, marginBottom: 20, height: 36 }}>
        {p.for}
      </div>
      <button
        className="hover:bg-white transition active:translate-y-px mb-5"
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: T.ink,
          border: `1px solid rgba(201,197,183,0.6)`,
          fontSize: 14, fontWeight: 500,
          padding: "13px 0", borderRadius: R.full,
          boxShadow: [
            "inset 0 1px 0 rgba(255,255,255,0.9)",
            "inset 0 -1px 0 rgba(5,0,56,0.04)",
            "0 1px 2px rgba(5,0,56,0.04)",
            "0 4px 12px rgba(5,0,56,0.06)",
          ].join(", "),
        }}
      >
        무료로 시작
      </button>
      <ul className="space-y-2.5">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2"
            style={{ color: T.charcoal, fontSize: 12.5, fontWeight: 400 }}>
            <span
              className="flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                width: 16, height: 16, borderRadius: R.full,
                background: T.brandTeal, color: T.primary,
                fontSize: 10, fontWeight: 600,
              }}
            >
              ✓
            </span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   12.  FINAL CTA (dark banner · rounded.feature 32px)
   ═════════════════════════════════════════════════════════════ */

function FinalCTA() {
  return (
    <section style={{ background: T.canvas, paddingTop: 80, paddingBottom: 80 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <div
          className="text-center"
          style={{
            background: T.primary, color: T.onPrimary,
            borderRadius: R.feature,
            padding: "64px 32px",
            position: "relative",
            overflow: "hidden",
            isolation: "isolate",
          }}
        >
          {/* Hero 루프 영상 재활용 — 다크 오버레이로 텍스트 가독성 보장 */}
          <video
            className="hero-cta-video"
            autoPlay muted loop playsInline preload="metadata"
            aria-hidden="true"
          >
            <source src="/hero-loop.mp4" type="video/mp4" />
          </video>
          <div className="hero-cta-overlay" aria-hidden="true" />
          <h2
            className="mx-auto"
            style={{
              fontSize: "clamp(28px, 4.4vw, 44px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              fontWeight: 500,
              maxWidth: 720, marginBottom: 20,
            }}
          >
            내일 비가 오는데,<br />
            당신 광고는 <span style={{ color: T.brandTeal }}>아직도 똑같이 돌고 있나요?</span>
          </h2>
          <p className="mx-auto"
            style={{ color: T.onDarkMuted, fontSize: 16, fontWeight: 400, lineHeight: 1.6, maxWidth: 540, marginBottom: 36 }}>
            <strong style={{ color: T.brandTeal, fontWeight: 600 }}>14일 무료 체험</strong> · 신용카드 없이 시작 · 베타 광고주 30개 한정
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <BtnOnDark href="/onboarding">지금 무료로 시작 →</BtnOnDark>
            <button
              className="hover:bg-white/10 transition active:translate-y-px"
              style={{
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                color: T.onDark,
                border: `1px solid rgba(255,255,255,0.28)`,
                fontSize: 14, fontWeight: 500,
                padding: "13px 24px", borderRadius: R.full,
                boxShadow: [
                  "inset 0 1px 0 rgba(255,255,255,0.18)",
                  "inset 0 -1px 0 rgba(0,0,0,0.18)",
                  "0 2px 6px rgba(0,0,0,0.18)",
                ].join(", "),
              }}
            >
              영업팀 데모 신청
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   13.  FOOTER (massive dark · 6-column)
   ═════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer style={{ background: T.footerBg, color: T.onDarkMuted }}>
      <div className="max-w-[1280px] mx-auto px-6" style={{ paddingTop: 64, paddingBottom: 48 }}>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <Logo size={32} />
              <div className="leading-none">
                <div style={{ color: T.onDark, fontSize: 14, fontWeight: 600 }}>
                  Weather Plan AI
                </div>
                <div style={{ color: T.onDarkMuted, fontSize: 11, marginTop: 3, letterSpacing: "0.04em", fontWeight: 500 }}>
                  by KWeather · wellbian AI
                </div>
              </div>
            </div>
            <p style={{ color: T.onDarkMuted, fontSize: 12.5, fontWeight: 400, lineHeight: 1.65, maxWidth: 280 }}>
              국내 최초·최대 날씨 기반 광고 AI.<br />
              코스닥 상장 케이웨더 디지털사업본부.
            </p>
          </div>
          {[
            { title: "제품",      items: [
              { label: "기능",          href: "#how" },
              { label: "케이웨더 데이터", href: "#triggers" },
              { label: "정확도",        href: "#trust" },
              { label: "가격",          href: "#pricing" },
            ]},
            { title: "쓰는 사람",  items: [
              { label: "대형광고주",   href: "#personas" },
              { label: "프랜차이즈",   href: "#personas" },
              { label: "이커머스",     href: "#personas" },
              { label: "자영업",       href: "#personas" },
            ]},
            { title: "케이웨더",  items: [
              { label: "회사 소개",       href: "https://www.kweather.co.kr", ext: true },
              { label: "기술 문서",       href: "mailto:weatherplan@kweather.co.kr?subject=Weather%20Plan%20AI%20기술%20문서%20요청" },
              { label: "AI 비서 연동",    href: "/studio" },
              { label: "영업팀",          href: "mailto:weatherplan@kweather.co.kr?subject=Weather%20Plan%20AI%20영업팀%20문의" },
            ]},
            { title: "법적 고지",  items: [
              { label: "이용약관",          href: "/legal#terms" },
              { label: "개인정보처리방침",  href: "/legal#privacy" },
              { label: "사업자 정보",       href: "/legal#business" },
            ]},
          ].map((col) => (
            <div key={col.title}>
              <div
                style={{ color: T.onDark, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", marginBottom: 14 }}
              >
                {col.title.toUpperCase()}
              </div>
              {col.items.map((i) => (
                <a
                  key={i.label}
                  href={i.href}
                  target={i.ext ? "_blank" : undefined}
                  rel={i.ext ? "noopener noreferrer" : undefined}
                  className="block transition hover:opacity-100"
                  style={{ color: T.onDarkMuted, fontSize: 13, fontWeight: 400, padding: "4px 0" }}
                >
                  {i.label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div
          className="mt-10 pt-6 flex flex-wrap items-center justify-between gap-3"
          style={{ borderTop: `1px solid rgba(255,255,255,0.1)` }}
        >
          <div style={{ color: T.onDarkMuted, fontSize: 11.5, fontWeight: 400 }}>
            © 2026 KWeather Corp. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═════════════════════════════════════════════════════════════
   14.  SHARED
   ═════════════════════════════════════════════════════════════ */

function SectionHeader({ eyebrow, title, sub }) {
  return (
    <div className="text-center mx-auto" style={{ maxWidth: 640, marginBottom: 56 }}>
      <Tag tint="teal">{eyebrow}</Tag>
      <h2
        style={{
          fontSize: "clamp(28px, 4.2vw, 44px)",
          lineHeight: 1.15,
          color: T.ink,
          letterSpacing: "-0.02em",
          fontWeight: 500,
          marginTop: 20, marginBottom: 16,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p style={{ color: T.slate, fontSize: 15, fontWeight: 400, lineHeight: 1.6 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   14b.  GLOBAL CASES — 업종 카테고리별 풍부한 사례 매트릭스
   ═════════════════════════════════════════════════════════════ */

function GlobalCases() {
  const [activeCat, setActiveCat] = useState("fashion");
  const cases = GLOBAL_CASES_BY_CATEGORY[activeCat] || [];
  const activeCatLabel = GLOBAL_CATEGORIES.find(c => c.id === activeCat)?.label;
  return (
    <section id="cases" style={{ background: T.surface, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader
          eyebrow="검증된 글로벌 성과 · 한국 적용 가능"
          title={<>이미 해외에서 입증된 방식.<br />업종별로 효과를 확인해보세요.</>}
          sub={<>16개 업종 · 검증된 글로벌 광고주 100+ 사례 —<br />모두 케이웨더 데이터로 한국 광고주 200+에 동일 메커니즘 적용 가능합니다.</>}
        />

        {/* === 업종 pill 그리드 (wellbian-biz 패턴) === */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10" style={{ maxWidth: 980, marginLeft: "auto", marginRight: "auto" }}>
          {GLOBAL_CATEGORIES.map((cat) => {
            const active = activeCat === cat.id;
            const count = (GLOBAL_CASES_BY_CATEGORY[cat.id] || []).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className="transition active:translate-y-px"
                style={{
                  background: active
                    ? `linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 100%)`
                    : "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(12px) saturate(180%)",
                  WebkitBackdropFilter: "blur(12px) saturate(180%)",
                  color: active ? T.mossDark : T.charcoal,
                  border: active
                    ? `1.5px solid ${T.brandTeal}`
                    : `1px solid ${T.hairlineSoft}`,
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  padding: "9px 14px", borderRadius: R.full,
                  boxShadow: active
                    ? `inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 14px rgba(78,179,168,0.18)`
                    : `inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(5,0,56,0.03)`,
                  display: "inline-flex", alignItems: "center", gap: 7,
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.005em",
                }}
              >
                <Icon name={cat.icon} size={15} stroke={1.6} style={{ color: active ? T.brandTeal : T.steel }} />
                {cat.label}
                <span style={{
                  fontSize: 10.5, fontWeight: 600,
                  color: active ? T.brandTeal : T.ink4,
                  marginLeft: 2,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* === 시나리오 카드 그리드 (좌측 라벨 · 본문 · 우측 결과 라벨) === */}
        <div className="space-y-3" style={{ maxWidth: 1000, marginLeft: "auto", marginRight: "auto" }}>
          {cases.map((c, i) => (
            <div
              key={`${activeCat}-${c.brand}`}
              className="glass-card global-case-row"
              style={{
                borderRadius: R.xxl,
                padding: "18px 22px",
                animation: `fadeUp 0.4s ease-out ${i * 0.05}s both`,
              }}
            >
              {/* 좌측 — 브랜드명 + 업종 라벨 (파란 라벨) */}
              <div>
                <div style={{
                  color: T.brandBlue,
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.04em",
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}>
                  {c.industry}
                </div>
                <div style={{ color: T.ink, fontSize: 15, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                  {c.brand}
                </div>
                <div style={{ color: T.steel, fontSize: 11, fontWeight: 400, marginTop: 3 }}>
                  {c.country} · {c.year}
                </div>
              </div>

              {/* 중앙 — 액션 본문 (트리거 룰을 실행으로 풀어낸 설명) */}
              <div style={{ color: T.charcoal, fontSize: 13.5, fontWeight: 400, lineHeight: 1.55, wordBreak: "keep-all", minWidth: 0 }}>
                <span style={{ color: T.brandBlue, fontWeight: 600, marginRight: 8 }}>→</span>
                {c.trigger}
              </div>

              {/* 우측 — 결과 라벨 (빨간 톤) */}
              <div className="gc-result inline-flex items-baseline" style={{
                background: c.metric.startsWith("-") || c.metric === "검증"
                  ? "rgba(78,179,168,0.10)"
                  : "rgba(255,104,80,0.12)",
                color: c.metric.startsWith("-") || c.metric === "검증"
                  ? T.mossDark
                  : T.coralDark,
                fontSize: 12, fontWeight: 600,
                padding: "6px 12px", borderRadius: R.full,
                whiteSpace: "nowrap",
                border: `1px solid ${c.metric.startsWith("-") || c.metric === "검증"
                  ? "rgba(78,179,168,0.25)"
                  : "rgba(255,104,80,0.22)"}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
              }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{c.metric}</span>
                <span style={{ fontWeight: 500, marginLeft: 6, fontSize: 11 }}>{c.metricLabel}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center" style={{ maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
          <p style={{ color: T.slate, fontSize: 14, fontWeight: 400, lineHeight: 1.7 }}>
            <span style={{ color: T.ink, fontWeight: 500 }}>{activeCatLabel}</span> 외 15개 업종 · 글로벌 광고주 100+ 사례 → <strong style={{ color: T.mossDark, fontWeight: 700 }}>한국 광고주 200+ 즉시 적용 가능</strong>.
            <br />
            <span style={{ color: T.slate, fontWeight: 400 }}>
              현대차·기아·하이트진로·CJ제일제당·아모레퍼시픽·LG생활건강·동아제약 등 — 13개 산업 매칭 BD 매트릭스 완비.
            </span>
            <br />
            <span style={{ color: T.mossDark, fontWeight: 600 }}>한국 광고주 70%+가 날씨에 매출이 영향받는 업종</span>입니다 (소상공인진흥공단·기상청 데이터).
          </p>

          {/* === 대형광고주 전용 차별화 박스 === */}
          <div
            className="inline-flex items-center gap-3 mt-7 flex-wrap justify-center"
            style={{
              background: `linear-gradient(180deg, rgba(78,179,168,0.08) 0%, rgba(78,179,168,0.03) 100%)`,
              border: `1.5px solid ${T.brandTeal}`,
              borderRadius: R.full,
              padding: "8px 18px",
              boxShadow: "0 2px 8px rgba(78,179,168,0.10)",
            }}
          >
            <span style={{
              background: T.mossDark, color: "#FFFFFF",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              padding: "3px 10px", borderRadius: R.full,
              whiteSpace: "nowrap",
            }}>
              ENTERPRISE 전용
            </span>
            <span style={{ color: T.ink, fontSize: 13, fontWeight: 500, letterSpacing: "-0.005em" }}>
              해외 진출 광고주는 <strong style={{ color: T.mossDark, fontWeight: 700 }}>글로벌 5,400+ 도시 날씨 데이터</strong>로 동남아·미주·유럽 캠페인 동시 운영 가능
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveWeatherPanel() {
  const [mode, setMode] = useState("map");  // location | campaigns | map (지도 모드 기본 — 마케팅 임팩트 우선)
  return (
    <section style={{ background: T.canvas, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader
          eyebrow="케이웨더 라이브 날씨 패널"
          title={<>5분마다 갱신되는<br />케이웨더 실시간 데이터.</>}
          sub="내 사업장 · 캠페인별 지역 · 전국 지도 — 광고 운영 화면에서 한눈에 봅니다."
        />

        {/* Mode toggle pills */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[
            { k: "location",  label: "내 위치" },
            { k: "campaigns", label: "캠페인별 지역" },
            { k: "map",       label: "지도 모드" },
          ].map((m) => {
            const active = mode === m.k;
            return (
              <button
                key={m.k}
                onClick={() => setMode(m.k)}
                className="transition active:translate-y-px"
                style={{
                  background: active ? T.primary : "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  color: active ? T.onPrimary : T.ink,
                  border: `1px solid ${active ? "transparent" : T.hairlineSoft}`,
                  fontSize: 13.5, fontWeight: 500,
                  padding: "10px 18px", borderRadius: R.full,
                  boxShadow: active
                    ? "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.25), 0 4px 12px rgba(5,0,56,0.18)"
                    : "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 2px rgba(5,0,56,0.04)",
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            background: T.surface,
            borderRadius: R.xxxl,
            padding: 28,
            border: `1px solid ${T.hairlineSoft}`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 12px 32px rgba(5,0,56,0.04)",
            minHeight: 420,
          }}
        >
          {mode === "location"  && <PanelLocation />}
          {mode === "campaigns" && <PanelCampaigns />}
          {mode === "map"       && <PanelMap />}
        </div>
      </div>
    </section>
  );
}

function PanelLocation() {
  // mock 데이터 — 실제로는 getMyLocationContext 호출 결과
  const w = {
    region: "서울 강남구 역삼동",
    t: 18.4, feelsLike: 16.8, reh: 62, wsd: 2.1, pop: 35, pm25: 28,
    uv: 5, vis: 18, hpa: 1014, rain1h: 0,
    sky: "구름조금", updated: "5분 전",
  };
  const insight = "체감 16.8℃ · 습도 62% · 강수확률 35% · 자외선 보통. 12시간 후 강수확률 90% 상승 예측 — 우산·배달·실내 카테고리 D-day 사전 트리거 대기 중. 가시거리 18km로 야외 OOH 효율 정상 운영 가능. 풍속 2.1m/s로 미세먼지 정체 위험 낮음.";
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{
                background: T.tealLight, color: T.mossDark,
                fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em",
                padding: "2px 7px", borderRadius: R.full,
              }}>
                광고관리 예시
              </span>
              <span style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>
                내 사업장
              </span>
            </div>
            <div style={{ color: T.ink, fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 4 }}>
              {w.region}
            </div>
          </div>
          <Tag tint="teal">
            <LiveDot color={T.brandTeal} />
            <span className="ml-0.5">{w.updated}</span>
          </Tag>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
          {[
            { label: "기온",       value: `${w.t}℃`,         tint: "teal" },
            { label: "체감온도",   value: `${w.feelsLike}℃`,  tint: "coral" },
            { label: "습도",       value: `${w.reh}%`,         tint: "navy" },
            { label: "강수확률",   value: `${w.pop}%`,         tint: "rose" },
            { label: "초미세먼지", value: `${w.pm25}`,         tint: "yellow" },
            { label: "자외선",     value: `${w.uv} 보통`,      tint: "amber" },
            { label: "풍속",       value: `${w.wsd}m/s`,       tint: "lime" },
            { label: "가시거리",   value: `${w.vis}km`,        tint: "purple" },
          ].map((m) => {
            const t = TINT[m.tint];
            return (
              <div
                key={m.label}
                style={{
                  background: t.light,
                  border: `1px solid rgba(0,0,0,0.06)`,
                  borderRadius: R.lg,
                  padding: "12px 14px",
                  boxShadow: [
                    "inset 0 0 0 1px rgba(0,0,0,0.04)",     // 내부 검은 반투명 hairline
                    "inset 0 1px 0 rgba(255,255,255,0.6)",  // 상단 살짝 광택 (유지)
                    "inset 0 -1px 0 rgba(0,0,0,0.06)",       // 하단 1px shadow (검은 반투명)
                    "0 1px 2px rgba(0,0,0,0.04)",
                    "0 4px 12px rgba(0,0,0,0.06)",
                  ].join(", "),
                }}
              >
                <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>
                  {m.label}
                </div>
                <div style={{ color: t.text, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2, marginTop: 4 }}>
                  {m.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          background: T.canvas,
          border: `1px solid ${T.hairlineSoft}`,
          borderRadius: R.xl,
          padding: 20,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5" style={{
            background: T.tealLight, color: T.mossDark,
            fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
            padding: "3px 8px", borderRadius: R.full,
          }}>
            <Icon name="sparkles" size={11} stroke={2} />
            wellbian AI 인사이트
          </span>
        </div>
        <p style={{ color: T.charcoal, fontSize: 13.5, lineHeight: 1.65, fontWeight: 400 }}>
          {insight}
        </p>
      </div>
    </div>
  );
}

function PanelCampaigns() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div style={{ color: T.steel, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em" }}>
            진행 중 캠페인 {CAMPAIGN_MOCK.length}개
          </div>
          <div style={{ color: T.ink, fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 4 }}>
            지역별 트리거 상태
          </div>
        </div>
        <Tag tint="teal">
          <LiveDot color={T.brandTeal} />
          <span className="ml-0.5">5분 갱신</span>
        </Tag>
      </div>
      <div className="space-y-2">
        {CAMPAIGN_MOCK.map((c) => {
          const isOn = c.status === "ON";
          return (
            <div
              key={c.id}
              style={{
                background: T.canvas,
                border: `1px solid ${T.hairlineSoft}`,
                borderRadius: R.xl,
                padding: "14px 18px",
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ color: T.ink, fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                  {c.name}
                </div>
                <div className="flex items-center gap-1.5" style={{ color: T.slate, fontSize: 11.5, fontWeight: 400, marginTop: 3 }}>
                  <span style={{ display: "inline-block", width: 4, height: 4, borderRadius: "50%", background: T.steel }} />
                  {c.region}
                </div>
              </div>
              <div className="hidden sm:block text-center">
                <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>기온</div>
                <div style={{ color: T.ink, fontSize: 15, fontWeight: 600, marginTop: 2 }}>{c.t}℃</div>
              </div>
              <div className="hidden sm:block text-center">
                <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>강수</div>
                <div style={{ color: T.ink, fontSize: 15, fontWeight: 600, marginTop: 2 }}>{c.pop}%</div>
              </div>
              <div className="hidden md:block text-center">
                <div style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>PM2.5</div>
                <div style={{ color: T.ink, fontSize: 15, fontWeight: 600, marginTop: 2 }}>{c.pm25}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  style={{
                    background: isOn ? T.tealLight : T.surface,
                    color:      isOn ? T.mossDark  : T.slate,
                    fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
                    padding: "3px 10px", borderRadius: R.full,
                    border: isOn ? "none" : `1px solid ${T.hairline}`,
                  }}
                >
                  {isOn ? "● ON" : "○ 대기"}
                </span>
                {isOn && (
                  <span
                    title={c.liftMetric ? `예상 ${c.liftMetric}` : ""}
                    style={{
                      background: T.brandTeal, color: T.mossDark,
                      fontSize: 11, fontWeight: 600,
                      padding: "3px 8px", borderRadius: R.md,
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
                      display: "inline-flex", alignItems: "baseline", gap: 3,
                    }}
                  >
                    {c.lift}
                    {c.liftMetric && c.liftMetric !== "—" && (
                      <span style={{ color: T.mossDark, opacity: 0.7, fontSize: 9.5, fontWeight: 500 }}>
                        {c.liftMetric}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PanelMap() {
  const [hover, setHover] = useState(null);

  // 위성 지도 (1200x896) 위 도시 좌표
  const SATELLITE_CITIES = [
    { code: "11", name: "서울",  x: 500, y: 295, t: 17, pop: 65, kind: "rain" },
    { code: "28", name: "인천",  x: 458, y: 298, t: 16, pop: 80, kind: "rain" },
    { code: "41", name: "수원",  x: 495, y: 330, t: 18, pop: 55, kind: "rain" },
    { code: "42", name: "강릉",  x: 622, y: 305, t: 14, pop: 60, kind: "rain" },
    { code: "30", name: "대전",  x: 540, y: 412, t: 19, pop: 30, kind: "cloud" },
    { code: "27", name: "대구",  x: 622, y: 520, t: 22, pop: 10, kind: "sun" },
    { code: "29", name: "광주",  x: 510, y: 568, t: 21, pop: 15, kind: "sun" },
    { code: "31", name: "울산",  x: 685, y: 545, t: 22, pop:  8, kind: "sun" },
    { code: "26", name: "부산",  x: 718, y: 600, t: 23, pop:  5, kind: "sun" },
    { code: "50", name: "제주",  x: 540, y: 800, t: 24, pop:  0, kind: "sun" },
  ];

  // 지역 zone (광역 발광 영역) — 트리거 색상 매핑
  const ZONES = [
    { id: "metro",    cx: 490, cy: 320, r: 150, color: "#5560FF", intensity: 0.45, label: "수도권", trigger: "강수 D-1",       intensity_text: "강" },
    { id: "youngnam", cx: 670, cy: 555, r: 145, color: "#4EB3A8", intensity: 0.40, label: "영남권", trigger: "맑음+야외 최적", intensity_text: "중" },
    { id: "honam",    cx: 510, cy: 685, r: 130, color: "#F4A261", intensity: 0.36, label: "호남·제주", trigger: "주말 맑음 UV5+", intensity_text: "약" },
  ];

  // 인사이트 (AI 광고 시뮬레이션 형식)
  const INSIGHTS = [
    {
      id: "metro",
      region: "수도권",
      cities: "서울 인천 수원",
      personaCount: "12,840",
      trigger: "강수 D-1 진입",
      triggerDetail: "강수확률 55-80% · 기온 16-18°C",
      action: "우산·배달·실내 카테고리 입찰 강화",
      bid: "+35%",
      kpiLabel: "배달 매출",
      kpiValue: "+58%",
      basis: "장마 + 저녁 시간대 배달 객단가 +58% (한국 외식업 통계)",
      window: "비 시작 6시간 전 골든타임",
      confidence: 92,
      color: "#5560FF",
      bg: "rgba(85,96,255,0.08)",
    },
    {
      id: "youngnam",
      region: "영남권",
      cities: "대구 부산 울산",
      personaCount: "8,450",
      trigger: "맑음 + 야외 활동 최적",
      triggerDetail: "기온 22-23°C · 강수확률 5-10%",
      action: "외식·아웃도어·디저트 카테고리 강화",
      bid: "+28%",
      kpiLabel: "매장 매출",
      kpiValue: "+42%",
      basis: "체감 22°C+ 주말 외식 검색 +180% (네이버)",
      window: "주말 점심·오후 집중",
      confidence: 88,
      color: "#4EB3A8",
      bg: "rgba(78,179,168,0.08)",
    },
    {
      id: "honam",
      region: "호남·제주",
      cities: "광주 제주",
      personaCount: "3,612",
      trigger: "주말 맑음 + UV 5+",
      triggerDetail: "기온 21-24°C · 강수확률 0-15%",
      action: "여행·숙박·당일치기 광고 활성화",
      bid: "+24%",
      kpiLabel: "예약 전환율",
      kpiValue: "+36%",
      basis: "주말 맑음 + UV 5+ 당일치기 예약 전환 +36%",
      window: "금 저녁~토 새벽 집중",
      confidence: 85,
      color: "#F4A261",
      bg: "rgba(244,162,97,0.08)",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* 위성 지도 + AI HUD — 3/5 */}
      <div className="md:col-span-3">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5" style={{ color: T.steel, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em" }}>
              <span style={{
                background: T.tealLight, color: T.mossDark,
                padding: "2px 7px", borderRadius: R.full,
                fontSize: 9.5, fontWeight: 800, letterSpacing: "0.08em",
                border: `1px solid ${T.brandTeal}`,
              }}>
                AI 시뮬레이션 가동 중
              </span>
              <span>전국 17개 광역시도</span>
            </div>
            <div style={{ color: T.ink, fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 6 }}>
              지역별 광고 트리거 분포
            </div>
          </div>
          <Tag tint="teal">
            <LiveDot color={T.brandTeal} />
            <span className="ml-0.5">LIVE</span>
          </Tag>
        </div>

        {/* 위성 지도 컨테이너 */}
        <div
          style={{
            position: "relative",
            borderRadius: R.xl,
            overflow: "hidden",
            border: `1px solid ${T.hairlineSoft}`,
            background: "#0A1224",
            boxShadow: "0 12px 40px rgba(5,0,56,0.22), 0 1px 3px rgba(5,0,56,0.08), inset 0 0 0 1px rgba(78,179,168,0.18)",
            aspectRatio: "1200 / 896",
            minHeight: 380,
          }}
        >
          <svg
            viewBox="0 0 1200 896"
            className="w-full h-full block"
            preserveAspectRatio="xMidYMid meet"
            style={{ position: "absolute", inset: 0 }}
          >
            <defs>
              <filter id="zoneGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
              </filter>
              <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
              </filter>
              {ZONES.map((z) => (
                <radialGradient key={z.id} id={`zone-${z.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={z.color} stopOpacity={z.intensity} />
                  <stop offset="60%" stopColor={z.color} stopOpacity={z.intensity * 0.4} />
                  <stop offset="100%" stopColor={z.color} stopOpacity="0" />
                </radialGradient>
              ))}
              <radialGradient id="globalVignette" cx="50%" cy="50%" r="70%">
                <stop offset="65%" stopColor="rgba(0,0,0,0)" />
                <stop offset="100%" stopColor="rgba(10,18,36,0.55)" />
              </radialGradient>
            </defs>

            {/* 위성 지도 (WebP — 106KB, 95% 다이어트) */}
            <image
              href="/korea-satellite.webp"
              x="0" y="0" width="1200" height="896"
              preserveAspectRatio="xMidYMid slice"
            />

            {/* 광역 zone 발광 */}
            {ZONES.map((z) => (
              <circle
                key={z.id}
                cx={z.cx} cy={z.cy} r={z.r}
                fill={`url(#zone-${z.id})`}
                filter="url(#zoneGlow)"
              />
            ))}

            {/* 가장자리 비네팅 (가독성 살짝) */}
            <rect width="1200" height="896" fill="url(#globalVignette)" />

            {/* AI HUD: 코너 브래킷 4개 */}
            {[
              { x: 30, y: 30, dx: 1, dy: 1 },
              { x: 1170, y: 30, dx: -1, dy: 1 },
              { x: 30, y: 866, dx: 1, dy: -1 },
              { x: 1170, y: 866, dx: -1, dy: -1 },
            ].map((b, i) => (
              <g key={i} stroke={T.brandTeal} strokeWidth="2.4" strokeLinecap="round" opacity="0.78">
                <line x1={b.x} y1={b.y} x2={b.x + b.dx * 24} y2={b.y} />
                <line x1={b.x} y1={b.y} x2={b.x} y2={b.y + b.dy * 24} />
              </g>
            ))}

            {/* 스캔 가이드 라인 (가로 1개 — 데이터 그리드 느낌) */}
            <line x1="50" y1="448" x2="1150" y2="448" stroke="rgba(78,179,168,0.16)" strokeWidth="0.8" strokeDasharray="2 6" />
            <line x1="600" y1="60" x2="600" y2="836" stroke="rgba(78,179,168,0.16)" strokeWidth="0.8" strokeDasharray="2 6" />

            {/* 도시 마커 + 라벨 (가벼운 pill) */}
            {SATELLITE_CITIES.map((city) => {
              const colorByKind = {
                rain:  "#5560FF",
                cloud: "#9CA3AF",
                sun:   "#4EB3A8",
              };
              const fill = colorByKind[city.kind] || "#4EB3A8";
              const isHover = hover === city.code;
              const r = isHover ? 11 : 8;
              return (
                <g
                  key={city.code}
                  onMouseEnter={() => setHover(city.code)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* 글로우 */}
                  <circle cx={city.x} cy={city.y} r={r * 2.2} fill={fill} opacity={isHover ? 0.5 : 0.35} filter="url(#dotGlow)" />
                  {/* 외곽 ring */}
                  <circle cx={city.x} cy={city.y} r={r} fill="none" stroke={fill} strokeWidth="2.4" />
                  {/* 흰 코어 */}
                  <circle cx={city.x} cy={city.y} r={r * 0.45} fill="#FFFFFF" />

                  {/* 라벨 pill (clean) */}
                  <rect
                    x={city.x - 32} y={city.y + 14}
                    width="64" height="22"
                    rx="11"
                    fill="rgba(10,18,36,0.88)"
                    stroke={fill}
                    strokeWidth="1"
                    opacity={isHover ? 1 : 0.92}
                  />
                  <text
                    x={city.x - 24} y={city.y + 29}
                    fill="#FFFFFF"
                    style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "-0.005em" }}
                  >
                    {city.name}
                  </text>
                  <text
                    x={city.x + 6} y={city.y + 29}
                    fill={fill}
                    style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "-0.005em" }}
                  >
                    {city.t}°
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 좌상단: AI 분석 상태 (HUD) */}
          <div style={{
            position: "absolute", top: 14, left: 14,
            background: "rgba(10,18,36,0.85)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            borderRadius: R.md,
            padding: "9px 12px",
            color: "#FFFFFF",
            fontSize: 10.5, fontWeight: 600, letterSpacing: "0.02em",
            display: "flex", flexDirection: "column", gap: 5,
            border: `1px solid rgba(78,179,168,0.45)`,
            minWidth: 168,
          }}>
            <div className="flex items-center gap-1.5" style={{ color: T.brandTeal, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.1em" }}>
              <span style={{ width: 5, height: 5, borderRadius: 99, background: T.brandTeal, boxShadow: `0 0 8px ${T.brandTeal}` }} />
              AI 시뮬레이션
            </div>
            <div className="flex items-center justify-between gap-3">
              <span style={{ opacity: 0.7 }}>분석 사업장</span>
              <span style={{ fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', monospace" }}>24,902</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span style={{ opacity: 0.7 }}>분석 시나리오</span>
              <span style={{ fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', monospace" }}>51,388</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span style={{ opacity: 0.7 }}>평균 신뢰도</span>
              <span style={{ fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', monospace", color: T.brandTeal }}>88.3%</span>
            </div>
          </div>

          {/* 우상단: 갱신 시각 */}
          <div style={{
            position: "absolute", top: 14, right: 14,
            background: "rgba(10,18,36,0.85)",
            backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
            borderRadius: R.md,
            padding: "7px 11px",
            color: "#FFFFFF",
            fontSize: 10.5, fontWeight: 600, letterSpacing: "0.04em",
            display: "flex", alignItems: "center", gap: 6,
            border: `1px solid rgba(78,179,168,0.45)`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: T.brandTeal, boxShadow: `0 0 10px ${T.brandTeal}` }} />
            <span style={{ fontFamily: "ui-monospace, 'SF Mono', monospace" }}>5분 전 갱신</span>
          </div>

          {/* 하단 라이브 데이터 띠 */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "linear-gradient(180deg, rgba(10,18,36,0) 0%, rgba(10,18,36,0.9) 100%)",
            padding: "30px 14px 12px",
            color: "#FFFFFF",
            display: "flex", justifyContent: "space-around", alignItems: "center",
            flexWrap: "wrap", gap: 12,
            fontFamily: "ui-monospace, 'SF Mono', monospace",
          }}>
            {[
              { label: "활성 사업장", value: "22,143", color: T.brandTeal },
              { label: "오늘 매칭",   value: "8,604",  color: "#5560FF" },
              { label: "평균 lift",   value: "+38.4%", color: T.brandTeal },
              { label: "응답 시간",   value: "1.2s",   color: "#F4A261" },
            ].map((m) => (
              <div key={m.label} style={{ textAlign: "center", minWidth: 76 }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", opacity: 0.65 }}>
                  {m.label}
                </div>
                <div style={{ color: m.color, fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 2 }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 지도 하단 짧은 캡션 */}
        <div className="mt-3 flex items-center justify-between flex-wrap gap-2" style={{ color: T.steel, fontSize: 11, fontWeight: 500 }}>
          <span>케이웨더 30,000+ 측정 센서 · 동단위 5분 갱신 · NVIDIA 기반 60일 예보</span>
          <span style={{ color: T.mossDark, fontWeight: 600 }}>226개 시군구 확장 진행 중</span>
        </div>
      </div>

      {/* 인사이트 패널 — 2/5 */}
      <div className="md:col-span-2 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div style={{ color: T.steel, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
AI 광고 시뮬레이션
          </div>
          <span style={{
            background: T.tealLight, color: T.mossDark,
            fontSize: 9.5, fontWeight: 800, letterSpacing: "0.06em",
            padding: "2px 7px", borderRadius: R.full,
            border: `1px solid ${T.brandTeal}`,
          }}>
            24,902명
          </span>
        </div>

        {INSIGHTS.map((ins) => {
          return (
            <div
              key={ins.id}
              style={{
                background: T.canvas,
                border: `1px solid ${T.hairlineSoft}`,
                borderRadius: R.xl,
                padding: "16px 18px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* 좌측 색상 막대 + 발광 */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: 3, background: ins.color,
                boxShadow: `2px 0 12px ${ins.color}88`,
              }} />

              {/* 헤더: 지역 + 페르소나 수 */}
              <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span style={{ color: T.ink, fontSize: 15, fontWeight: 700, letterSpacing: "-0.015em" }}>
                      {ins.region}
                    </span>
                    <span style={{
                      background: ins.bg,
                      color: ins.color,
                      fontSize: 9.5, fontWeight: 800,
                      padding: "2px 7px", borderRadius: R.full,
                      letterSpacing: "0.04em",
                      border: `1px solid ${ins.color}33`,
                      fontFamily: "ui-monospace, 'SF Mono', monospace",
                    }}>
                      {ins.personaCount} 매장 매칭
                    </span>
                  </div>
                  <div style={{ color: T.muted, fontSize: 10.5, fontWeight: 500, marginTop: 2, letterSpacing: "0.02em" }}>
                    {ins.cities}
                  </div>
                </div>
                <span style={{
                  background: ins.bg, color: ins.color,
                  fontSize: 11, fontWeight: 800, letterSpacing: "0.02em",
                  padding: "4px 10px", borderRadius: R.full,
                  whiteSpace: "nowrap",
                  border: `1px solid ${ins.color}44`,
                  fontFamily: "ui-monospace, 'SF Mono', monospace",
                }}>
                  입찰 {ins.bid}
                </span>
              </div>

              {/* 트리거 */}
              <div style={{ color: T.charcoal, fontSize: 12.5, fontWeight: 600, marginBottom: 2, letterSpacing: "-0.005em" }}>
                {ins.trigger}
              </div>
              <div style={{ color: T.steel, fontSize: 10.5, fontWeight: 400, marginBottom: 10, letterSpacing: "-0.005em" }}>
                {ins.triggerDetail}
              </div>

              {/* 액션 — 광고 추천 */}
              <div style={{
                background: ins.bg,
                borderRadius: R.md,
                padding: "9px 11px",
                marginBottom: 10,
                fontSize: 12, color: T.ink, fontWeight: 500, lineHeight: 1.5,
                wordBreak: "keep-all",
                border: `1px solid ${ins.color}22`,
              }}>
                <span style={{ color: ins.color, fontWeight: 700, fontSize: 10.5, letterSpacing: "0.06em", marginRight: 6 }}>
                  ACTION
                </span>
                {ins.action}
              </div>

              {/* KPI + 신뢰도 막대 */}
              <div className="flex items-end justify-between gap-3 mb-2">
                <div>
                  <div style={{ color: T.muted, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em" }}>
                    예상 {ins.kpiLabel}
                  </div>
                  <div style={{ color: ins.color, fontSize: 22, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1, fontFamily: "ui-monospace, 'SF Mono', monospace" }}>
                    {ins.kpiValue}
                  </div>
                </div>
                <div style={{ flex: 1, marginLeft: 14, maxWidth: 140 }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ color: T.muted, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em" }}>신뢰도</span>
                    <span style={{ color: ins.color, fontSize: 11, fontWeight: 800, fontFamily: "ui-monospace, 'SF Mono', monospace" }}>{ins.confidence}%</span>
                  </div>
                  <div style={{ height: 4, background: T.hairlineSoft, borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      width: `${ins.confidence}%`,
                      height: "100%",
                      background: `linear-gradient(90deg, ${ins.color}88 0%, ${ins.color} 100%)`,
                      borderRadius: 99,
                    }} />
                  </div>
                </div>
              </div>

              {/* 골든 윈도우 */}
              <div style={{
                color: T.charcoal, fontSize: 11, fontWeight: 500,
                background: T.surface,
                borderRadius: R.sm,
                padding: "5px 9px",
                marginBottom: 8,
                letterSpacing: "-0.005em",
              }}>
                <span style={{ marginRight: 4 }}>⏱</span>
                <span style={{ fontWeight: 700 }}>골든 윈도우</span> · {ins.window}
              </div>

              {/* 근거 */}
              <div style={{ borderTop: `1px dashed ${T.hairlineSoft}`, paddingTop: 8, color: T.muted, fontSize: 10, lineHeight: 1.5, fontWeight: 400, wordBreak: "keep-all", letterSpacing: "-0.005em" }}>
                <span style={{ color: ins.color, fontWeight: 700, marginRight: 4 }}>근거</span>
                {ins.basis}
              </div>
            </div>
          );
        })}

        {/* Studio CTA */}
        <a
          href="/studio"
          className="transition active:translate-y-px"
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            background: `linear-gradient(135deg, ${T.mossDark} 0%, #1F6157 100%)`,
            color: "#FFFFFF",
            padding: "14px 18px",
            borderRadius: R.xl,
            textDecoration: "none",
            boxShadow: "0 8px 24px rgba(20,68,59,0.28), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.2)",
          }}
        >
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.12em", opacity: 0.85, marginBottom: 3 }}>
              내 사업장 맞춤 시뮬레이션
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>
              Studio에서 한 줄로 받기 →
            </div>
          </div>
          <span style={{ fontSize: 24 }}>✨</span>
        </a>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════
   14d.  CONTENT STUDIO — 광고 카피 제작 (성과 우선 철학)
   ═════════════════════════════════════════════════════════════ */

function ContentStudio() {
  const [active, setActive] = useState(0);
  const [industry, setIndustry] = useState("fashion");
  const d = STUDIO_DEMO_BY_INDUSTRY[industry];
  return (
    <section style={{ background: T.surface, paddingTop: 96, paddingBottom: 96 }}>
      <div className="max-w-[1280px] mx-auto px-6">
        <SectionHeader
          eyebrow="컨텐츠 제작 — 성과가 본업"
          title={<>잘 만든 카피보다,<br /><span style={{ color: T.mossDark }}>잘 팔리는 카피.</span></>}
          sub={null}
        />

        {/* 철학 카드 — 장문정 식 톤, 명칭 미노출 */}
        <div
          style={{
            background: T.canvas,
            border: `1px solid ${T.hairlineSoft}`,
            borderRadius: R.xxxl,
            padding: "28px 32px",
            marginBottom: 28,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 24px rgba(5,0,56,0.04)",
            maxWidth: 760, marginLeft: "auto", marginRight: "auto",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              style={{
                width: 40, height: 40,
                color: T.mossDark,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="pen-line" size={28} stroke={1.6} />
            </div>
            <div>
              <p style={{ color: T.ink, fontSize: 17, fontWeight: 500, lineHeight: 1.55, letterSpacing: "-0.01em", marginBottom: 10 }}>
                광고는 잘 만드는 게 본업이 아니라 잘 팔리는 게 본업입니다.
              </p>
              <p style={{ color: T.slate, fontSize: 14, fontWeight: 400, lineHeight: 1.7 }}>
                Weather Plan AI는 빠른 카피 생성 도구가 아닙니다. 카피가 더 팔리도록 만드는 도구입니다.
                <span style={{ color: T.ink, fontWeight: 500 }}> 제작 편의는 덤, 실제 성과가 본업.</span>
                <br />
                wellbian AI는 표현이 화려한 순이 아니라, <span style={{ color: T.mossDark, fontWeight: 600 }}>날씨 × 자체 학습 데이터로 더 팔릴 순서</span>대로 카피를 추천합니다.
                <br />
                투썸이 "겨울엔 스초생"으로 시즌을 가져갔듯, <span style={{ color: T.mossDark, fontWeight: 600 }}>당신 업종의 "장마엔 ○○", "폭염엔 ○○"</span>을 만들어드립니다.
              </p>
            </div>
          </div>
        </div>

        {/* 업종 pill 그리드 — GlobalCases 패턴 동일 (글라스 + brandTeal 1.5px 액티브) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10" style={{ maxWidth: 1000, marginLeft: "auto", marginRight: "auto" }}>
          {STUDIO_INDUSTRIES.map((ind) => {
            const isActive = industry === ind.id;
            return (
              <button
                key={ind.id}
                onClick={() => { setIndustry(ind.id); setActive(0); }}
                className="transition active:translate-y-px"
                style={{
                  background: isActive
                    ? `linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 100%)`
                    : "rgba(255,255,255,0.55)",
                  backdropFilter: "blur(12px) saturate(180%)",
                  WebkitBackdropFilter: "blur(12px) saturate(180%)",
                  color: isActive ? T.mossDark : T.charcoal,
                  border: isActive ? `1.5px solid ${T.brandTeal}` : `1px solid ${T.hairlineSoft}`,
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  padding: "9px 14px", borderRadius: R.full,
                  boxShadow: isActive
                    ? `inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 14px rgba(78,179,168,0.18)`
                    : `inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(5,0,56,0.03)`,
                  display: "inline-flex", alignItems: "center", gap: 7,
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.005em",
                }}
              >
                <Icon name={ind.icon} size={15} stroke={1.6} style={{ color: isActive ? T.brandTeal : T.steel }} />
                {ind.label}
              </button>
            );
          })}
        </div>

        {/* 챗봇 형태 데모 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* 좌측: 입력 + 분석 */}
          <div className="lg:col-span-2">
            <div
              style={{
                background: T.canvas,
                border: `1px solid ${T.hairlineSoft}`,
                borderRadius: R.xxxl,
                padding: 24,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(5,0,56,0.03)",
                height: "100%",
              }}
            >
              {/* user bubble */}
              <div className="flex gap-2 mb-4">
                <div
                  style={{
                    width: 28, height: 28, borderRadius: R.full,
                    background: "#FFFFFF",
                    color: T.brandBlue,
                    border: `1.5px solid ${T.brandBlue}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}
                >
                  S
                </div>
                <div
                  style={{
                    background: T.surfacePricing,
                    color: T.ink,
                    fontSize: 13.5, fontWeight: 400, lineHeight: 1.55,
                    padding: "10px 14px",
                    borderRadius: "4px 16px 16px 16px",
                  }}
                >
                  {d.userBrief}
                </div>
              </div>

              {/* AI rationale bubble */}
              <div className="flex gap-2">
                <Logo size={28} variant="inline" />
                <div
                  style={{
                    background: T.tealLight,
                    color: T.mossDark,
                    fontSize: 13, fontWeight: 400, lineHeight: 1.65,
                    padding: "12px 14px",
                    borderRadius: "16px 4px 16px 16px",
                  }}
                >
                  <div className="flex items-center gap-1.5" style={{ color: T.mossDark, fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", marginBottom: 8 }}>
                    <Icon name="bar-chart" size={11} stroke={2} />
                    <span>케이웨더 분석</span>
                  </div>
                  {d.rationale}
                </div>
              </div>

              <div
                style={{
                  background: T.surface,
                  border: `1px solid ${T.hairlineSoft}`,
                  borderRadius: R.lg,
                  padding: "10px 14px",
                  marginTop: 16,
                  fontSize: 12, color: T.steel, fontWeight: 500, lineHeight: 1.5,
                }}
              >
                💡 카피 3종은 표현이 화려한 순이 아니라 <strong style={{ color: T.ink, fontWeight: 600 }}>예상 효과가 큰 순</strong>으로 정렬했습니다.
              </div>
            </div>
          </div>

          {/* 우측: 카피 3종 (실제 성과 순으로 정렬) */}
          <div className="lg:col-span-3 space-y-4">
            {d.copies
              .slice()
              .sort((a, b) => parseInt(b.expectedLift) - parseInt(a.expectedLift))
              .map((c, i) => {
                const isTop = i === 0;
                return (
                  <div
                    key={c.copy}
                    onClick={() => setActive(i)}
                    style={{
                      background: T.canvas,
                      border: isTop ? `1.5px solid ${T.brandTeal}` : `1px solid ${T.hairlineSoft}`,
                      borderRadius: R.xxl,
                      padding: "22px 24px",
                      cursor: "pointer",
                      boxShadow: isTop
                        ? `inset 0 1px 0 rgba(255,255,255,0.85), 0 1px 3px rgba(78,179,168,0.08), 0 12px 28px rgba(78,179,168,0.12)`
                        : `inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(5,0,56,0.03)`,
                      animation: `fadeUp 0.5s ease-out ${i * 0.08}s both`,
                      transition: "all 200ms ease",
                    }}
                  >
                    {/* 상단 헤더 라인 — 배지 + 채널 + 예상 효과 */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span style={{
                          background: isTop ? T.tealLight : T.surface,
                          color: isTop ? T.mossDark : T.steel,
                          fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
                          padding: "4px 11px", borderRadius: R.full,
                          border: isTop ? `1px solid ${T.brandTeal}` : `1px solid ${T.hairlineSoft}`,
                          whiteSpace: "nowrap",
                        }}>
                          {isTop ? "★ 최우선 추천" : `안 ${i + 1}`}
                        </span>
                        <span style={{ color: T.charcoal, fontSize: 11.5, fontWeight: 500, opacity: 0.7 }}>
                          {c.channels.join(" · ")}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span style={{ color: T.steel, fontSize: 10, fontWeight: 600, letterSpacing: "0.06em" }}>
                          예상 효과
                        </span>
                        <span style={{ color: T.mossDark, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
                          {c.expectedLift}
                        </span>
                      </div>
                    </div>

                    {/* 카피 본문 — 더 큰 폰트 + 좌측 청록 보더 */}
                    <div style={{
                      borderLeft: isTop ? `3px solid ${T.brandTeal}` : `2px solid ${T.hairlineSoft}`,
                      paddingLeft: 14,
                      marginBottom: 14,
                    }}>
                      <p style={{ color: T.ink, fontSize: 15.5, fontWeight: 500, lineHeight: 1.55, letterSpacing: "-0.01em" }}>
                        {c.copy}
                      </p>
                    </div>

                    {/* 왜 이게 팔리나 — 더 차분한 박스 */}
                    <div
                      style={{
                        background: isTop ? "rgba(78,179,168,0.06)" : T.surface,
                        borderRadius: R.md,
                        padding: "10px 14px",
                        fontSize: 12.5, color: T.charcoal, fontWeight: 400, lineHeight: 1.6,
                      }}
                    >
                      <span style={{ color: T.mossDark, fontWeight: 700, marginRight: 4 }}>왜 이게 팔리나</span>
                      <span style={{ color: T.muted, marginRight: 6 }}>→</span>
                      {c.why}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="mt-10 text-center" style={{ maxWidth: 580, marginLeft: "auto", marginRight: "auto" }}>
          <p style={{ color: T.slate, fontSize: 13.5, fontWeight: 400, lineHeight: 1.65 }}>
            <span style={{ color: T.ink, fontWeight: 500 }}>제작 편의 기능</span>(빠른 생성·다중 변형·채널별 자동 매핑)은 모두 기본 제공.
            <span style={{ color: T.mossDark, fontWeight: 600 }}> 본업은 케이웨더 데이터로 "왜 이 카피가 팔리는지" 답변하는 일입니다.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   14e.  FORECASTER COUNCIL — AI × 전문 기상예보관 차별점
   ═════════════════════════════════════════════════════════════ */

const FORECASTER_REASONS = [
  {
    n: "01",
    title: "여러 가능성 중 하나로 정리",
    desc: "AI 기상 모델은 \"비 올 확률 60%\" \"내일 기온 5가지 가능성\"처럼 여러 답을 내놓습니다. 예보관이 이걸 \"이번 캠페인은 2주 미루세요\"처럼 광고에 바로 쓸 수 있는 한 줄로 정리합니다.",
    tint: "teal",
  },
  {
    n: "02",
    title: "처음 보는 날씨 패턴 잡아내기",
    desc: "기후변화로 예전엔 없던 폭염·장마·이상기온이 나타납니다. AI는 과거 데이터에서 배우기 때문에 처음 보는 패턴엔 약합니다. 예보관이 보고 \"이번엔 AI 결과를 너무 믿지 말자\"고 보정합니다.",
    tint: "coral",
  },
  {
    n: "03",
    title: "지역마다 다른 미세 패턴",
    desc: "AI는 전국 평균을 잘 맞히지만, \"강남이 강북보다 1℃ 높다\" \"동해안은 바람이 더 세다\" 같은 한국 특유의 지역 패턴은 28년 경력 예보관이 매일 보정합니다. 광고주에게 중요한 건 평균이 아니라 자기 매장 동네의 정확한 예보.",
    tint: "rose",
  },
  {
    n: "04",
    title: "정확도 숫자 뒤에 사람의 사인",
    desc: "\"정확도 87점\"이라는 숫자가 믿을 만하려면 누군가 매일 검수해야 합니다. 60일 앞 광고를 결정할 때, 예보관의 검수 한 줄이 그 숫자에 신뢰를 더합니다.",
    tint: "lavender",
  },
  {
    n: "05",
    title: "AI의 단골 실수 보정",
    desc: "AI는 같은 실수를 반복합니다 — \"여름철 비를 과장한다\" \"동해안 바람을 적게 본다\" 같은 식. 예보관이 매년 \"AI 결과에서 이 부분은 빼고 봐야 한다\"를 정리해 실제 날씨와 맞춥니다.",
    tint: "teal",
  },
  {
    n: "06",
    title: "\"뭔가 이상한데?\" 알람",
    desc: "숫자만 보면 멀쩡한데 종합적으로 보면 이상한 날이 있습니다. 이건 사람만 알아챕니다. 60일은 충분히 긴 시간이라, 이 한 번의 알람이 광고비 손실을 막아줍니다.",
    tint: "coral",
  },
];

function ForecasterCouncil() {
  return (
    <section
      id="forecaster"
      style={{
        background: T.canvas,
        paddingTop: 96, paddingBottom: 96,
        position: "relative", overflow: "hidden",
      }}
    >
      {/* ambient orb (분위기) */}
      <div className="orb orb-lavender orb-float"
        style={{ width: 420, height: 420, top: "10%", right: "-8%" }} />
      <div className="orb orb-teal orb-float-slow"
        style={{ width: 320, height: 320, bottom: "5%", left: "-5%" }} />

      <div className="max-w-[1280px] mx-auto px-6 over-orb">
        <SectionHeader
          eyebrow="AI × 전문 기상예보관"
          title={<>AI가 60일 후를 예측합니다.<br />그 위에 <span style={{ color: T.mossDark }}>예보관이 신뢰의 방점</span>을 더합니다.</>}
          sub="AI 모델만으로 부족한 신뢰의 마지막 한 겹 — 케이웨더의 면허 보유 예보관이 검수하고 정확도 점수를 사후 갱신합니다."
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 좌측: 다크 stat 카드 — 예보관 인증 */}
          <div className="lg:col-span-5">
            <div
              style={{
                background: T.primary, color: T.onDark,
                borderRadius: R.xxxl,
                padding: "36px 32px",
                position: "relative", overflow: "hidden",
                height: "100%",
                isolation: "isolate",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4), 0 16px 48px rgba(5,0,56,0.18)",
              }}
            >
              {/* Hero 루프 영상 재활용 — 다크 오버레이로 텍스트 가독성 보장 */}
              <video
                className="hero-cta-video"
                autoPlay muted loop playsInline preload="metadata"
                aria-hidden="true"
              >
                <source src="/hero-loop.mp4" type="video/mp4" />
              </video>
              <div className="hero-cta-overlay" aria-hidden="true" />

              {/* 내부 ambient teal glow (영상 위 살짝 더해 깊이감) */}
              <div
                style={{
                  position: "absolute", right: -60, top: -60,
                  width: 280, height: 280, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(78,179,168,0.22), transparent 70%)",
                  filter: "blur(40px)",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />

              <div className="relative" style={{ zIndex: 1 }}>
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{
                    background: T.tealLight, color: T.mossDark,
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                    padding: "4px 12px", borderRadius: R.full,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  <Icon name="award" size={12} stroke={2} />
                  전문 기상예보관 검증
                </span>

                <div
                  style={{
                    fontSize: "clamp(34px, 4.2vw, 50px)",
                    lineHeight: 1.08,
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                    color: T.brandTeal,
                    marginTop: 28,
                  }}
                >
                  AI 위에,<br />사람의 사인.
                </div>

                <p style={{ color: T.onDarkMuted, fontSize: 14.5, lineHeight: 1.7, marginTop: 20, fontWeight: 400 }}>
                  AI 예측 결과 위에 케이웨더 예보관이 신뢰의 방점을 더합니다.
                  <span style={{ color: T.onDark, fontWeight: 500 }}> 광고 의사결정의 마지막 신뢰 레이어입니다.</span>
                </p>

                <div className="grid grid-cols-3 gap-2.5 mt-7">
                  {[
                    { n: "5종", l: "AI 모델 메타 판단" },
                    { n: "사후 검증", l: "정확도 점수 갱신" },
                    { n: "24/7", l: "관제 시스템" },
                  ].map((s) => (
                    <div
                      key={s.l}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: R.lg,
                        padding: "12px 10px",
                      }}
                    >
                      <div style={{ color: T.brandTeal, fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                        {s.n}
                      </div>
                      <div style={{ color: T.onDarkMuted, fontSize: 11, fontWeight: 500, marginTop: 4, lineHeight: 1.35 }}>
                        {s.l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 6가지 이유 카드 */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FORECASTER_REASONS.map((r, i) => {
                const t = TINT[r.tint];
                return (
                  <div
                    key={r.n}
                    className="glass-card glass-card-hover"
                    style={{
                      borderRadius: R.xxxl,
                      padding: 22,
                      animation: `fadeUp 0.5s ease-out ${i * 0.06}s both`,
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        style={{
                          background: t.light, color: t.text,
                          fontSize: 13, fontWeight: 600,
                          width: 34, height: 34, borderRadius: R.full,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {r.n}
                      </div>
                      <h3
                        style={{
                          color: T.ink,
                          fontSize: 15.5, fontWeight: 600,
                          lineHeight: 1.35, letterSpacing: "-0.015em",
                          paddingTop: 6,
                        }}
                      >
                        {r.title}
                      </h3>
                    </div>
                    <p
                      style={{
                        color: T.charcoal,
                        fontSize: 13, fontWeight: 400,
                        lineHeight: 1.65,
                      }}
                    >
                      {r.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 푸터 한 줄 */}
        <div className="mt-12 text-center" style={{ maxWidth: 720, marginLeft: "auto", marginRight: "auto" }}>
          <p style={{ color: T.slate, fontSize: 14, fontWeight: 400, lineHeight: 1.7 }}>
            정확도 점수 공시는 <span style={{ color: T.ink, fontWeight: 500 }}>사람이 검수했기 때문에 신뢰</span>가 됩니다.
            <span style={{ color: T.mossDark, fontWeight: 600 }}> Weather Plan AI = 차세대 AI 모델 + 전문 예보관 검수.</span>
            <br />
            AI 위에 사람의 사인이 더해질 때 광고를 진행할 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════
   15.  ROOT
   ═════════════════════════════════════════════════════════════ */

export default function WeatherPlanAI() {
  return (
    <>
      <Head>
        <title>Weather Plan AI · 날씨로 광고하는 가장 똑똑한 방법</title>
        <meta name="description" content="질문 한 줄로, 상품이 더 팔리는 광고. 케이웨더 60일 예보 × 100+ 시그널 × Claude Opus 4.7로 카피·예산·매체를 실시간 추천합니다. 18개 업종 × 162개 세부 카테고리 지원." />
        <meta property="og:title" content="Weather Plan AI · 날씨로 광고하는 가장 똑똑한 방법" />
        <meta property="og:description" content="질문 한 줄로, 상품이 더 팔리는 광고. 케이웨더 60일 예보 × Claude AI 광고 의사결정." />
      </Head>
      <div className="min-h-screen antialiased"
      style={{ background: T.canvas, color: T.ink, fontFamily: "'Pretendard Variable', Pretendard, 'Noto Sans KR', system-ui, sans-serif" }}>

      <PromoBanner />
      <Nav />
      <main>
        <Hero />
        <Reveal><KWeatherAssets /></Reveal>
        <Reveal><GlobalCases /></Reveal>
        <Reveal><Personas /></Reveal>
        <Reveal><LiveWeatherPanel /></Reveal>
        <Reveal><HowItWorks /></Reveal>
        <Reveal><Triggers /></Reveal>
        <Reveal><ContentStudio /></Reveal>
        <Reveal><Trust /></Reveal>
        <Reveal><ForecasterCouncil /></Reveal>
        <Reveal><AIAgentEra /></Reveal>
        <Reveal><TrendMatrix2026 /></Reveal>
        <Reveal><PricingSection /></Reveal>
        <Reveal><FinalCTA /></Reveal>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
    </>
  );
}

function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="맨 위로"
      style={{
        position: "fixed",
        right: "max(20px, env(safe-area-inset-right, 20px))",
        bottom: "max(20px, env(safe-area-inset-bottom, 20px))",
        width: 48, height: 48,
        borderRadius: "50%",
        background: `linear-gradient(180deg, #1F6157 0%, ${T.mossDark} 100%)`,
        border: "1px solid rgba(255,255,255,0.18)",
        color: "#FFFFFF",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 8px 24px rgba(20,68,59,0.36), 0 1px 2px rgba(5,0,56,0.18), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.25)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 240ms cubic-bezier(0.2,0.6,0.2,1), transform 240ms cubic-bezier(0.2,0.6,0.2,1)",
        zIndex: 200,
      }}
      className="hover:opacity-95 active:translate-y-px"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </svg>
    </button>
  );
}
