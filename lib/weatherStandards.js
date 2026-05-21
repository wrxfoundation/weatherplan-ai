/**
 * 🇰🇷 기상청 & 환경부 공식 판정 기준 (SSOT)
 * - 모든 날씨 판정의 단일 기준
 * - 출처: 기상청, 환경부(AirKorea), WHO, KOSHA
 * - 마지막 업데이트: 2026-04-21 (v2.6)
 */

// ============ 🌡️ 기온 (°C) - 기상청 공식 특보 기준 ============
export const TEMP_STD = {
  // 폭염
  heatAdvisory: 33,    // 폭염 주의보 (33°↑ 2일 이상)
  heatWarning: 35,     // 폭염 경보 (35°↑ 2일 이상)
  heatExtreme: 38,     // 매우위험 (WBGT)
  // 한파
  coldAdvisory: -12,   // 한파 주의보 (-12°↓ 2일 이상)
  coldWarning: -15,    // 한파 경보 (-15°↓ 2일 이상)
  // 편의
  hot: 30,             // 더움
  warm: 25,            // 따뜻
  mild: 20,            // 쾌적
  cool: 15,            // 선선
  chilly: 10,          // 쌀쌀
  cold: 5,             // 춥다
  freeze: 0,           // 결빙
  // 운동/활동 최적
  runOptimal: [10, 20],   // 러닝 최적
  golfOptimal: [12, 24],  // 골프 최적
  picnicOptimal: [15, 28] // 나들이 최적
};

// ============ 💨 풍속 (m/s) - 기상청 공식 특보 기준 ============
export const WIND_STD = {
  // 육상 특보
  strongAdvisory: 14,   // 강풍 주의보 (14m/s↑ or 순간 20m/s↑)
  strongWarning: 21,    // 강풍 경보 (21m/s↑ or 순간 26m/s↑)
  // 해상 특보 (낚시/서핑용)
  seaAdvisory: 14,
  seaWarning: 21,
  // 스포츠별 임계값
  golfTrouble: 5,       // 골프 1~2클럽 업
  golfBad: 8,           // 골프 불량
  runBad: 6,            // 러닝 페이스↓
  bikeBad: 6,           // 자전거 역풍 체감
  bikeDanger: 10,       // 자전거 위험
  tentDanger: 10,       // 텐트 한계
  craneStop: 15,        // 크레인 작업 중지
  // 체감
  mild: 3,              // 약풍
  moderate: 6,          // 보통
  strong: 10,           // 강함
};

// ============ 🌧️ 강수량 (mm/h) - 기상청 공식 기준 ============
export const RAIN_STD = {
  // 1시간당
  trace: 0.1,           // 흔적
  light: 1,             // 약한 비
  moderate: 5,          // 보통 비 (우산 필수)
  heavy: 15,            // 강한 비
  torrential: 30,       // 호우주의보 (1시간 30mm↑)
  // 3시간 누적
  advisory3h: 60,       // 호우 주의보
  warning3h: 90,        // 호우 경보
  // 강수확률
  popLikely: 40,        // 비 가능성 높음
  popAlmost: 60,        // 거의 확실
  popVery: 80,          // 매우 확실
};

// ============ 💧 습도 (%) - 체감/건강 기준 ============
export const HUM_STD = {
  veryDry: 30,          // 매우 건조 (가습 필수, 코점막 마름)
  dry: 40,              // 건조 (가습 권장)
  comfort: [40, 60],    // 쾌적
  humid: 70,            // 습함
  veryHumid: 80,        // 매우 습함 (곰팡이 위험)
  sauna: 90             // 찜찜
};

// ============ ☀️ 자외선 UV - WHO/기상청 공식 ============
export const UV_STD = {
  low: 2,               // 낮음 (0~2)
  moderate: 5,          // 보통 (3~5)
  high: 7,              // 높음 (6~7)
  veryHigh: 10,         // 매우높음 (8~10)
  extreme: 11,          // 위험 (11+)
  // 조치 필요 임계값
  sunscreenNeeded: 3,   // 선크림 권장
  sunscreenMust: 6,     // 선크림 필수
  avoidSun: 8           // 외출 자제 권장
};

// ============ 🌫️ 미세먼지 (㎍/㎥) - 환경부 공식 기준 ============
export const DUST_STD = {
  // PM2.5 초미세먼지
  pm25: {
    good: 15,           // 좋음 (0~15)
    moderate: 35,       // 보통 (16~35)
    bad: 75,            // 나쁨 (36~75)
    // 매우나쁨 (76+)
  },
  // PM10 미세먼지
  pm10: {
    good: 30,           // 좋음 (0~30)
    moderate: 80,       // 보통 (31~80)
    bad: 150,           // 나쁨 (81~150)
    // 매우나쁨 (151+)
  }
};

// ============ 🧊 체감온도 (°C) - 기상청 WBGT 기준 ============
export const FEEL_STD = {
  // 온열질환 (여름)
  heatCaution: 28,      // 주의
  heatWarn: 31,         // 경고
  heatDanger: 33,       // 위험
  heatExtreme: 35,      // 매우위험 (WBGT)
  // 한랭질환 (겨울)
  coldCaution: -10,
  coldWarn: -15,
  coldDanger: -20,
  coldExtreme: -25
};

// ============ 🔵 기압 (hPa) - 두통/편두통 트리거 ============
export const PRESSURE_STD = {
  low: 1000,            // 저기압 (편두통 위험)
  normal: 1013,         // 평균
  high: 1020,           // 고기압
  rapidChange: 6        // 6hPa/24h 급변 = 트리거
};

// ============ 🏆 등급 판정 헬퍼 함수 ============

// PM2.5 → 1(좋음) 2(보통) 3(나쁨) 4(매우나쁨)
export const gradePM25 = (v) => {
  const p = v || 0;
  if (p <= DUST_STD.pm25.good) return 1;
  if (p <= DUST_STD.pm25.moderate) return 2;
  if (p <= DUST_STD.pm25.bad) return 3;
  return 4;
};

// PM10 → 1(좋음) 2(보통) 3(나쁨) 4(매우나쁨)
export const gradePM10 = (v) => {
  const p = v || 0;
  if (p <= DUST_STD.pm10.good) return 1;
  if (p <= DUST_STD.pm10.moderate) return 2;
  if (p <= DUST_STD.pm10.bad) return 3;
  return 4;
};

// 미세먼지 종합 등급 (더 나쁜 쪽 기준)
export const gradeDust = (pm25, pm10) => Math.max(gradePM25(pm25), gradePM10(pm10));

// 등급 라벨
export const GRADE_LABEL = ["", "좋음", "보통", "나쁨", "매우나쁨"];
export const GRADE_COLOR = ["", "#2B7A5B", "#2B7A5B", "#BA7517", "#D85A30"];

// 기온 등급 (사용자 친화)
export const gradeTemp = (t) => {
  if (t >= TEMP_STD.heatWarning) return "폭염경보";
  if (t >= TEMP_STD.heatAdvisory) return "폭염주의";
  if (t >= TEMP_STD.hot) return "더움";
  if (t >= TEMP_STD.warm) return "따뜻";
  if (t >= TEMP_STD.mild) return "쾌적";
  if (t >= TEMP_STD.cool) return "선선";
  if (t >= TEMP_STD.chilly) return "쌀쌀";
  if (t >= TEMP_STD.cold) return "춥다";
  if (t >= TEMP_STD.freeze) return "매우춥다";
  if (t >= TEMP_STD.coldAdvisory) return "영하";
  if (t >= TEMP_STD.coldWarning) return "한파주의";
  return "한파경보";
};

// 풍속 등급
export const gradeWind = (w) => {
  if (w >= WIND_STD.strongWarning) return "강풍경보";
  if (w >= WIND_STD.strongAdvisory) return "강풍주의";
  if (w >= WIND_STD.strong) return "강함";
  if (w >= WIND_STD.moderate) return "보통";
  if (w >= WIND_STD.mild) return "약함";
  return "잔잔";
};

// 강수량 등급
export const gradeRain = (r) => {
  if (r >= RAIN_STD.torrential) return "호우";
  if (r >= RAIN_STD.heavy) return "강한비";
  if (r >= RAIN_STD.moderate) return "보통비";
  if (r >= RAIN_STD.light) return "약한비";
  if (r > 0) return "이슬비";
  return "없음";
};

// UV 등급
export const gradeUV = (v) => {
  if (v >= UV_STD.extreme) return "위험";
  if (v >= UV_STD.veryHigh) return "매우높음";
  if (v >= UV_STD.high) return "높음";
  if (v >= UV_STD.moderate) return "보통";
  return "낮음";
};

// 습도 등급
export const gradeHum = (h) => {
  if (h >= HUM_STD.veryHumid) return "매우습함";
  if (h >= HUM_STD.humid) return "습함";
  if (h >= HUM_STD.comfort[0] && h <= HUM_STD.comfort[1]) return "쾌적";
  if (h >= HUM_STD.dry) return "보통";
  if (h >= HUM_STD.veryDry) return "건조";
  return "매우건조";
};

// 불쾌지수 계산 (THI)
export const calcDiscomfort = (t, h) => 0.81 * t + 0.01 * h * (0.99 * t - 14.3) + 46.3;

export const gradeDiscomfort = (di) => {
  if (di >= 80) return "매우높음";
  if (di >= 75) return "높음";
  if (di >= 68) return "보통";
  return "낮음";
};
