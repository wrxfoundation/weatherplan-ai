/* ============================================================
 * Weather Plan AI · /api/tools
 *
 * 광고 의사결정 핵심 6개 Tool (Claude Function Calling)
 * wellbian 엔진의 40+ 도구 중 마케팅 맥락에 맞는 것만 압축·재정의
 *
 * 운영 메모:
 * - 베타 단계: KWeather API 미연결 → 모의 응답 반환
 * - 정식: KWeather 60일 예보 + 100+ 시그널 API 직접 연결
 * ============================================================ */

export const TOOL_SCHEMAS = [
  {
    name: "weather_at_location",
    description: "특정 위치(시·도/시·군·구)의 현재 날씨와 핵심 트리거를 조회합니다. 광고 의사결정의 출발점입니다. 자연어 위치(예: '강남역', '제주 서귀포', '곤지암CC')도 자동 해석합니다.",
    input_schema: {
      type: "object",
      properties: {
        location: { type: "string", description: "위치 명 (예: '서울 강남구', '강남역', '제주', '전국')" },
      },
      required: ["location"],
    },
  },
  {
    name: "weather_forecast_7day",
    description: "7일 일별 예보 — 일별 최저/최고 기온, 강수확률, 시즌 트리거 강도(강/중/약). 주간 광고 계획 수립용.",
    input_schema: {
      type: "object",
      properties: {
        location: { type: "string", description: "위치 명" },
      },
      required: ["location"],
    },
  },
  {
    name: "industry_trigger_pattern",
    description: "업종별 검증된 날씨 트리거 패턴을 반환합니다. '장마 D-7 패션 검색 +180%' 같은 글로벌·국내 검증 패턴.",
    input_schema: {
      type: "object",
      properties: {
        industry: { type: "string", description: "업종 id (예: fashion/beauty/beverage/auto/health/food)" },
        season: { type: "string", description: "시즌 (예: 장마/폭염/한파/미세먼지/환절기/주말맑음)" },
      },
      required: ["industry"],
    },
  },
  {
    name: "kpi_estimate",
    description: "업종·예산·채널 조합의 예상 KPI 시뮬레이션 — 노출/CTR/CPC/전환률/매출 lift. 광고주가 '이 트리거에 얼마 투자하면 얼마 나올까' 물을 때 사용.",
    input_schema: {
      type: "object",
      properties: {
        industry: { type: "string" },
        budget: { type: "string", description: "예산 구간 (small/medium/large/xlarge)" },
        channel: { type: "string", description: "광고 채널 (meta/google/naver/kakao/coupang/youtube)" },
      },
      required: ["industry"],
    },
  },
  {
    name: "naver_trend",
    description: "네이버 검색 트렌드 — 키워드 검색량 변화. 광고 카피·시기 검증용. 예: '제습기'를 장마 D-7부터 추적.",
    input_schema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "검색 키워드" },
        period: { type: "string", description: "기간 (7d/30d/90d)", default: "30d" },
      },
      required: ["keyword"],
    },
  },
  {
    name: "global_case_lookup",
    description: "글로벌 광고주 검증 사례 조회 — Burberry 장마, BMW xDrive 폭염, Coca-Cola 더위 등. 카피·전략 근거로 활용.",
    input_schema: {
      type: "object",
      properties: {
        industry: { type: "string" },
        trigger: { type: "string", description: "날씨 트리거 (예: 장마/폭염/한파)" },
      },
      required: ["industry"],
    },
  },
];

/* ─── Tool 실행기 (베타 단계 mock 응답) ─── */
const INDUSTRY_PATTERNS = {
  fashion: {
    장마:   { lift: "+42%", basis: "장마 D-7 트렌치코트 검색 +180% (네이버) × Burberry 글로벌 검증", action: "인스타 입찰 +35%, 카피 '비 오는 출근'" },
    폭염:   { lift: "+36%", basis: "폭염 시 린넨·아사 검색 +160% × Uniqlo 폭염 패턴", action: "메타 입찰 +28%, 카피 '땀에 안 젖는'" },
    한파:   { lift: "+44%", basis: "한파 진입 D-3 패딩 검색 +220% × Canada Goose 패턴", action: "네이버 GFA +40%, 카피 '영하 한자릿수 대비'" },
  },
  beauty: {
    장마:   { lift: "+38%", basis: "장마 들뜸 헤어 케어 검색 +220% × 올리브영 매장 매칭", action: "올리브영 매장 5km 매칭, 인스타 입찰 +30%" },
    미세먼지: { lift: "+52%", basis: "PM2.5 75㎍+ 클렌징·세럼 검색 +180%", action: "카카오 모먼트 +35%, 카피 '미세먼지 클렌징'" },
  },
  beverage: {
    폭염:   { lift: "+58%", basis: "체감 33°C+ 8일 음료 검색 +280% (소상공인진흥공단)", action: "매장 5km 반경, 인스타 +40%" },
  },
  food: {
    한파:   { lift: "+44%", basis: "한파 진입 시점 따뜻한 메뉴 매출 +44% (외식업 통계)", action: "배달앱 광고 +35%, 카피 '영하 5°C 한 그릇'" },
    장마:   { lift: "+58%", basis: "장마 + 저녁 시간대 배달 객단가 +58%", action: "카카오 모먼트 +40%, 18-22시 집중" },
  },
  auto: {
    폭염:   { lift: "+47%", basis: "폭염 7일+ 4륜 검색 + 매장 5km 매칭 (BMW xDrive 글로벌)", action: "네이버 GFA +35%, 30-44 남" },
  },
  health: {
    미세먼지: { lift: "+52%", basis: "PM2.5 75㎍+ 마스크·비강 검색 +180% × Dyson 검증", action: "쿠팡 광고 +38%, 익일 배송 강조" },
    환절기: { lift: "+27%", basis: "일교차 10°C+ 건강검진 문의 +27%", action: "보험사 채널 +20%, 카피 '환절기 점검'" },
  },
  travel: {
    "주말 맑음": { lift: "+36%", basis: "주말 맑음 + UV 5+ 당일치기 예약 +36%", action: "메타 +30%, 금요일 저녁 집중" },
  },
};

const GLOBAL_CASES = {
  fashion: {
    장마: { brand: "Burberry", country: "영국", insight: "장마 D-7 트렌치 광고 →  매출 +42%. 한국에서 동일 패턴 검증." },
    폭염: { brand: "Uniqlo", country: "일본", insight: "에어리즘 폭염 캠페인 → 동남아 매출 +38%." },
  },
  auto: {
    폭염: { brand: "BMW xDrive", country: "독일", insight: "폭염 + 4륜 검색 트리거 → 시승 신청 +47%." },
  },
  beauty: {
    미세먼지: { brand: "Dyson", country: "영국", insight: "PM2.5 75㎍+ 공기청정기 광고 → 한국 매출 +52%." },
  },
  beverage: {
    폭염: { brand: "Coca-Cola", country: "글로벌", insight: "체감 33°C+ 8일 연속 매출 평년 대비 +28% (Nielsen)." },
  },
};

const BUDGET_BASE_KPI = {
  small:  { imp: "82K",  ctr: 2.1, cpc: 340, conv: 2.8 },
  medium: { imp: "320K", ctr: 2.4, cpc: 280, conv: 3.1 },
  large:  { imp: "1.2M", ctr: 2.8, cpc: 220, conv: 3.6 },
  xlarge: { imp: "4.8M", ctr: 3.2, cpc: 180, conv: 4.2 },
};

function getWeatherForLocation(loc) {
  // 베타: location 키워드 기반 mock
  const lo = (loc || "").toLowerCase();
  const isJeju = /제주|서귀포/.test(lo);
  const isSouth = /부산|울산|대구|광주|영남|호남/.test(lo);
  const isNorth = /서울|경기|강원|수도권|인천/.test(lo);
  if (isJeju) return { temp: 24, pop: 15, condition: "맑음", trigger: "주말 맑음 + UV 5+", measurement: "제주 서귀포 KWeather 센서" };
  if (isSouth) return { temp: 22, pop: 10, condition: "맑음", trigger: "맑음 + 야외 활동 최적", measurement: "부산 해운대 KWeather 센서" };
  if (isNorth) return { temp: 17, pop: 65, condition: "흐림·강수확률 65%", trigger: "강수 D-1 진입", measurement: "서울 강남구 역삼동 KWeather 센서" };
  return { temp: 19, pop: 30, condition: "흐림", trigger: "환절기 일교차 10°C+", measurement: "전국 평균" };
}

export function executeTool(name, input) {
  switch (name) {
    case "weather_at_location": {
      const w = getWeatherForLocation(input.location);
      return {
        location: input.location,
        ...w,
        humidity: 62,
        wind: 2.1,
        pm25: 28,
        uv: 5,
        recommendation: `${w.trigger} → 광고 트리거 활성 상태`,
        _chartHint: `<<chart:bar|이번 주 ${input.location} 추천 강도|월:65,화:80,수:55,목:40,금:75,토:50,일:35|%>>`,
      };
    }
    case "weather_forecast_7day": {
      const today = new Date();
      const days = ["일", "월", "화", "수", "목", "금", "토"];
      const intensity = [65, 80, 55, 40, 75, 50, 35];
      const forecast = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today); d.setDate(today.getDate() + i);
        return {
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          dow: days[d.getDay()],
          min: 14 + Math.floor(Math.sin(i) * 3),
          max: 22 + Math.floor(Math.cos(i) * 4),
          pop: [65, 30, 80, 10, 20, 75, 40][i],
          intensity: intensity[i],
          tier: intensity[i] >= 70 ? "강" : intensity[i] >= 45 ? "중" : "약",
        };
      });
      return {
        location: input.location,
        forecast,
        _chartHint: `<<chart:line|7일 추천 강도|${forecast.map((d) => `${d.dow}:${d.intensity}`).join(",")}|%>>`,
      };
    }
    case "industry_trigger_pattern": {
      const ind = input.industry;
      const season = input.season || "장마";
      const pattern = INDUSTRY_PATTERNS[ind]?.[season] || INDUSTRY_PATTERNS.fashion["장마"];
      return { industry: ind, season, ...pattern };
    }
    case "kpi_estimate": {
      const budget = input.budget || "medium";
      const base = BUDGET_BASE_KPI[budget] || BUDGET_BASE_KPI.medium;
      return {
        industry: input.industry,
        budget,
        channel: input.channel || "통합",
        impressions: base.imp,
        ctr: `${base.ctr}%`,
        cpc: `₩${base.cpc}`,
        conversionRate: `${base.conv}%`,
        deltaVsAvg: { ctr: "+0.5%p", cpc: "-12%", conv: "+0.8%p" },
        _chartHint: `<<chart:bar|예상 KPI (${budget})|노출:${parseInt(base.imp)*1000},CTR:${base.ctr},CPC:${base.cpc},전환:${base.conv}|>>`,
      };
    }
    case "naver_trend": {
      const kw = input.keyword;
      // mock 트렌드 (실서비스: NAVER Datalab API)
      return {
        keyword: kw,
        period: input.period || "30d",
        trend: [80, 92, 105, 145, 180, 165, 142, 120],
        peakWeek: "장마 D-7 진입 시점",
        delta: "+82%",
        _chartHint: `<<chart:line|"${kw}" 검색 트렌드|W-3:80,W-2:92,W-1:105,장마D-7:145,장마D-3:180,장마중:165,장마끝:142,W+2:120|>>`,
      };
    }
    case "global_case_lookup": {
      const ind = input.industry;
      const trigger = input.trigger || "장마";
      const c = GLOBAL_CASES[ind]?.[trigger];
      if (c) return { industry: ind, trigger, ...c };
      return {
        industry: ind,
        trigger,
        brand: "다수 글로벌 사례 검증됨",
        country: "글로벌",
        insight: `${ind} 업종 ${trigger} 시즌 광고 효과 +30~50% 평균 검증 패턴`,
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
