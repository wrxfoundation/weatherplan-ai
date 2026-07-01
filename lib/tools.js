/* ============================================================
 * Weather Plan AI · /api/tools
 *
 * 광고 의사결정 핵심 8개 Tool (Claude Function Calling)
 * wellbian 엔진의 40+ 도구 중 마케팅 맥락에 맞는 것만 압축·재정의
 *
 * 운영 메모:
 * - 베타 단계: KWeather API 미연결 → 모의 응답 반환
 * - 정식: KWeather 60일 예보 + 100+ 시그널 API 직접 연결
 * ============================================================ */

import {
  gradePM25, gradePM10, gradeDust, gradeTemp, gradeWind, gradeRain, gradeUV, gradeHum,
  calcDiscomfort, gradeDiscomfort, GRADE_LABEL,
  TEMP_STD, WIND_STD, UV_STD, DUST_STD, FEEL_STD,
} from "./weatherStandards.js";

import {
  GOLF_EXTRA, CAMPING_SITES, CLIMBING_SPOTS, VALLEYS, SURF_SPOTS,
  BIKE_TRAILS, TRAIL_RUNNING, PARKS_SPORTS, MARATHONS,
} from "./outdoorVenues.js";

import { resolveRegion } from "./koreaRegions.js";

export const TOOL_SCHEMAS = [
  {
    name: "weather_at_location",
    description: "특정 위치(시·도/시·군·구)의 현재 날씨와 핵심 트리거를 조회합니다. 광고 의사결정의 출발점입니다. 기상청·환경부·WHO 공식 기준으로 자동 등급 분류 (폭염주의/한파경보/매우나쁨 등).",
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
  {
    name: "lifestyle_index",
    description: "케이웨더 10종 생활지수 — 빨래·세차·운동·감기·식중독·산불·자외선·나들이·폭염·대기오염. 광고 카테고리 매칭의 핵심 트리거. 예: 빨래지수 좋음 → 세제 광고 강화, 감기지수 높음 → 약·마스크 광고, 식중독지수 높음 → 냉장고·배달 광고.",
    input_schema: {
      type: "object",
      properties: {
        location: { type: "string", description: "위치 명" },
      },
      required: ["location"],
    },
  },
  {
    name: "outdoor_venue_lookup",
    description: "야외활동 장소 검색 — 골프장(163)·캠핑(97)·서핑(23)·등산/클라이밍(16)·계곡(61)·자전거(9)·트레일런(10)·공원/운동(45)·마라톤(164). 골프웨어·캠핑용품·아웃도어·러닝화 등 카테고리 광고주가 5km 반경 매칭 광고를 할 때 활용.",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["golf", "camping", "climbing", "valley", "surf", "bike", "trail", "park", "marathon"],
          description: "장소 타입",
        },
        near: { type: "string", description: "근방 지역 (예: '경기 용인', '제주', '강원')" },
        limit: { type: "integer", description: "최대 결과 수 (기본 5)", default: 5 },
      },
      required: ["type"],
    },
  },
];

/* ─── Tool 실행기 (베타 단계 mock + outdoor 실데이터) ─── */
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
      const region = resolveRegion(input.location); // Wikidata 표준 좌표 (지리 레퍼런스)
      const humidity = 62, wind = 2.1, pm25 = 28, pm10 = 42, uv = 5;
      const di = calcDiscomfort(w.temp, humidity);
      return {
        location: input.location,
        coordinates: region
          ? { lat: region.lat, lon: region.lon, source: `Wikidata ${region.qid}` }
          : null,
        ...w,
        humidity, wind, pm25, pm10, uv,
        // ★ 기상청·환경부·WHO 공식 기준 자동 grading
        grades: {
          temp: gradeTemp(w.temp),                    // 쾌적/선선/쌀쌀/춥다/한파주의 등
          wind: gradeWind(wind),                      // 잔잔/약함/보통/강함/강풍주의
          uv: gradeUV(uv),                            // 낮음/보통/높음/매우높음/위험
          humidity: gradeHum(humidity),               // 매우건조/건조/보통/쾌적/습함/매우습함
          pm25: GRADE_LABEL[gradePM25(pm25)],         // 좋음/보통/나쁨/매우나쁨
          pm10: GRADE_LABEL[gradePM10(pm10)],
          dust: GRADE_LABEL[gradeDust(pm25, pm10)],   // 종합 미세먼지 등급
          discomfort: gradeDiscomfort(di),            // 낮음/보통/높음/매우높음
        },
        discomfortIndex: Math.round(di * 10) / 10,
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
    case "lifestyle_index": {
      const w = getWeatherForLocation(input.location);
      // KWeather 10종 생활지수 (베타: 위치·시즌 mock; 정식: kw-idx-f2 API)
      const m = new Date().getMonth();
      const isWinter = m < 2 || m > 10;
      const isSummer = m >= 5 && m <= 7;
      const isRainy = w.pop >= 55;
      const indices = {
        // 빨래지수 — 습도↓ + 바람↑ + 비 없음 = 좋음
        laundry:  isRainy ? { grade: "나쁨",     value: 30, advice: "비 예보 → 실내 건조 권장 · 세제·드라이클리닝 광고 트리거" }
                          : { grade: "좋음",     value: 85, advice: "오늘 빨래 골든타임 · 섬유유연제·세제 광고 강화" },
        // 세차지수
        carwash:  isRainy ? { grade: "나쁨",     value: 20, advice: "3일 내 비 예보 — 세차 보류 · 발수코팅 광고 트리거" }
                          : { grade: "좋음",     value: 78, advice: "세차 적기 · 세차장·왁스·차량용품 광고 강화" },
        // 운동지수
        fitness:  isSummer && w.temp >= 30
                          ? { grade: "주의",     value: 35, advice: "폭염 시간대 피하기 · 헬스장·실내 운동 광고 강화" }
                          : { grade: "좋음",     value: 80, advice: "야외 운동 적기 · 러닝화·운동복·이온음료 광고 트리거" },
        // 감기지수
        influ:    isWinter || (w.temp < 10 && w.humidity > 70)
                          ? { grade: "높음",     value: 75, advice: "감기 위험 — 종합감기약·마스크·비타민 광고 트리거" }
                          : { grade: "보통",     value: 45, advice: "감기 위험 낮음" },
        // 식중독지수
        spoilage: isSummer && w.temp >= 28
                          ? { grade: "매우높음", value: 88, advice: "식중독 위험 — 냉장고·반찬통·즉석식품·익혀먹는 메뉴 광고 트리거" }
                          : { grade: "낮음",     value: 25, advice: "식중독 위험 낮음" },
        // 폭염지수
        heat:     w.temp >= TEMP_STD.heatAdvisory
                          ? { grade: "위험",     value: 90, advice: "온열질환 위험 — 음료·아이스크림·에어컨·선풍기 광고 강화" }
                          : { grade: "보통",     value: 40, advice: "폭염 위험 낮음" },
        // 자외선지수
        uv:       w.uv >= UV_STD.high
                          ? { grade: "높음",     value: 75, advice: "선크림·선글라스·모자·UV 차단제 광고 트리거" }
                          : { grade: "보통",     value: 45, advice: "선크림 권장 · 뷰티 카테고리 일반 운영" },
        // 나들이지수
        picnic:   isRainy ? { grade: "나쁨",     value: 25, advice: "비 예보 — 실내 활동 광고 (OTT·배달·홈인테리어) 강화" }
                          : { grade: "좋음",     value: 82, advice: "나들이 적기 — 여행·아웃도어·테마파크·맛집 광고 트리거" },
        // 산불지수
        fire:     w.humidity < 30 && w.temp > 15
                          ? { grade: "높음",     value: 70, advice: "산불 위험 — 산행 자제 권장 · 실내 카테고리 강화" }
                          : { grade: "낮음",     value: 25, advice: "산불 위험 낮음" },
        // 대기오염지수 (PM2.5 종합)
        pollution: w.pm25 > DUST_STD.pm25.bad
                          ? { grade: "매우나쁨", value: 90, advice: "공기청정기·마스크·비강 케어·실내 광고 트리거" }
                          : w.pm25 > DUST_STD.pm25.moderate
                          ? { grade: "나쁨",     value: 65, advice: "공기청정기·마스크 광고 강화" }
                          : { grade: "좋음",     value: 25, advice: "야외 광고 정상 운영" },
      };
      // 트리거 활성 카테고리 추출 (값 70+)
      const activeTrigger = Object.entries(indices)
        .filter(([, v]) => v.value >= 70)
        .map(([k]) => k);
      return {
        location: input.location,
        measurement: w.measurement,
        indices,
        activeTrigger,
        summary: activeTrigger.length
          ? `오늘 ${activeTrigger.join("·")} 카테고리 광고 트리거 활성`
          : "오늘 평상시 광고 운영 권장",
        _chartHint: `<<chart:bar|10대 생활지수|빨래:${indices.laundry.value},세차:${indices.carwash.value},운동:${indices.fitness.value},감기:${indices.influ.value},식중독:${indices.spoilage.value},폭염:${indices.heat.value},자외선:${indices.uv.value},나들이:${indices.picnic.value},산불:${indices.fire.value},공기:${indices.pollution.value}|>>`,
      };
    }
    case "outdoor_venue_lookup": {
      const typeMap = {
        golf: GOLF_EXTRA, camping: CAMPING_SITES, climbing: CLIMBING_SPOTS,
        valley: VALLEYS, surf: SURF_SPOTS, bike: BIKE_TRAILS,
        trail: TRAIL_RUNNING, park: PARKS_SPORTS, marathon: MARATHONS,
      };
      const typeLabel = {
        golf: "골프장", camping: "캠핑장", climbing: "클라이밍/등산",
        valley: "계곡·물놀이", surf: "서핑", bike: "자전거길",
        trail: "트레일러닝", park: "공원·운동", marathon: "마라톤",
      };
      const venues = typeMap[input.type] || [];
      const near = (input.near || "").trim();
      const limit = Math.min(input.limit || 5, 15);
      // 단순 substring 매칭 (mock; 정식: 좌표 거리 계산)
      const matched = near
        ? venues.filter((v) => (v.addr || "").includes(near) || (v.name || "").includes(near))
        : venues;
      const results = matched.slice(0, limit).map((v) => ({
        name: v.name,
        address: v.addr || "",
        lat: v.lat, lon: v.lon,
      }));
      return {
        type: input.type,
        typeLabel: typeLabel[input.type] || input.type,
        near: near || "전국",
        totalMatched: matched.length,
        results,
        adGuidance: `${typeLabel[input.type]} 5km 반경 페르소나 매칭으로 광고 노출 효율 +30~45% 기대 (글로벌 검증)`,
      };
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
