/* ============================================================
 * 시니어케어매니저 · /lib/careTools
 *
 * 병원동행·돌봄 예약 챗봇용 Claude Tool (Function Calling) 정의.
 * 데모 단계: 백엔드(Supabase)가 없으므로 결정론적 시드 데이터로
 * 견적 계산·슬롯 조회·예약 생성을 서버에서 수행합니다.
 *
 * 실서비스: estimate_quote → 요금표 테이블, check_slots → Supabase
 * providers/schedules 조회, create_booking → bookings insert + 토스결제
 * 링크 발급으로 교체.
 *
 * ⚠️ 여기 로직은 순수 함수 — 외부 호출·랜덤·현재시각 의존 없음.
 * ============================================================ */

/* ─── 요금 정책 (PRD 1.2 실측가 기반) ─── */
// 병원동행 민간 시간당 2.4만~5만원 / 기본 2시간. 데모는 표준가 40,000/시간.
const RATE = {
  hospital:         { label: "병원동행",        hourly: 40000, minHours: 2 },
  hospital_vehicle: { label: "병원동행 + 차량",  hourly: 50000, minHours: 2 },
  home_care:        { label: "재택돌봄",         hourly: 35000, minHours: 3 },
  dialysis:         { label: "정기 투석·항암 동행", hourly: 42000, minHours: 3 },
};
const WEEKEND_SURCHARGE = 0.15;  // 주말·공휴일 15% 할증
const NIGHT_SURCHARGE = 0.20;    // 야간(20시 이후) 20% 할증
const PLATFORM_FEE_RATE = 0.10;  // 매칭 수수료 10% (PRD 4)

/* ─── 케이웨더 외출 컨디션 — wellbian v3 점수 엔진 이식 ───
 * 실서비스: 케이웨더 60일 예보 + 대기질 API 연동.
 * 데모: 날짜·지역 문자열 해시로 결정론적 예보 생성(랜덤 미사용).
 *
 * 계승한 wellbian 헤리티지:
 *  - 100점 시작 감점제 + 위험군별 최심 1건만 차감(appliedReasons dedupe)
 *  - 판정컷 85/70/55/40 (weatherScore.js verdictByScore)
 *  - 기준값 SSOT (weatherStandards.js) — 컷오프 중복 정의 금지
 *  - 안전경보 하드스톱 2계층 (점수와 별개 즉시중단 판정)
 *  - 부정 우선 + catch-all 코멘트 룰 (recommendComment.js, LLM 0회)
 * 시니어 보정: 어르신은 폭염·한파·미세먼지·낙상에 더 취약 → 차감 강화. */
const CARE_WX = {
  TEMP: { heatWarning: 35, heatAdvisory: 33, hot: 31, chilly: 6, freeze: 0, coldAdvisory: -12, seniorOptimal: [15, 25] },
  DUST: { pm25: { good: 15, moderate: 35, bad: 75 }, pm10: { good: 30, moderate: 80, bad: 150 } }, // 환경부 기준
  UV: { sunscreenMust: 6, avoidSun: 8 },
  RAIN: { popLikely: 40, popAlmost: 70, popVery: 80 },
  HUMID: { muggy: 80, dry: 40 },
};
function gradePM25(v) { const c = CARE_WX.DUST.pm25; return v <= c.good ? "좋음" : v <= c.moderate ? "보통" : v <= c.bad ? "나쁨" : "매우나쁨"; }
function gradeUV(v)   { return v <= 2 ? "낮음" : v <= 5 ? "보통" : v <= 7 ? "높음" : v <= 10 ? "매우높음" : "위험"; }
function hashStr(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

// 데모용 예보 시나리오 (모두 시니어케어에서 유의미한 상황)
const WX_SCENARIOS = [
  { sky: "구름많음",   temp: 19, pm25: 62, pm10: 88, uv: 4,  humidity: 55, pop: 20 }, // 미세먼지 나쁨
  { sky: "맑음",       temp: 33, pm25: 22, pm10: 40, uv: 9,  humidity: 48, pop: 10 }, // 폭염+자외선
  { sky: "맑음",       temp: 6,  pm25: 18, pm10: 30, uv: 3,  humidity: 40, pop: 0  }, // 쌀쌀·건조
  { sky: "비",         temp: 21, pm25: 12, pm10: 20, uv: 1,  humidity: 82, pop: 75 }, // 강수·미끄럼
];

/* 시니어 외출 감점 룰 — reason 첫 단어 = 위험군 키 (같은 위험군은 최심 1건만) */
const SENIOR_RULES = [
  { test: (c) => c.pop >= CARE_WX.RAIN.popVery,     points: 35, reason: "강수 (미끄럼·낙상 위험)" },
  { test: (c) => c.pop >= CARE_WX.RAIN.popAlmost,   points: 35, reason: "강수 (미끄럼·낙상 위험)" },
  { test: (c) => c.pop >= CARE_WX.RAIN.popLikely,   points: 15, reason: "강수 가능 (우산 준비)" },
  { test: (c) => c.temp >= CARE_WX.TEMP.heatWarning, points: 40, reason: "폭염 (온열질환 위험)" },
  { test: (c) => c.temp >= CARE_WX.TEMP.heatAdvisory, points: 30, reason: "폭염 (탈수·어지럼)" },
  { test: (c) => c.temp >= CARE_WX.TEMP.hot,         points: 15, reason: "더위 (수분 보충)", group: "폭염" },
  { test: (c) => c.temp <= CARE_WX.TEMP.coldAdvisory, points: 40, reason: "한파 (저체온·혈압 위험)" },
  { test: (c) => c.temp <= CARE_WX.TEMP.freeze,       points: 25, reason: "한파 (혈관 수축)" },
  { test: (c) => c.temp <= CARE_WX.TEMP.chilly,       points: 10, reason: "추위 (보온 필요)", group: "한파" },
  { test: (c) => c.pm25 > CARE_WX.DUST.pm25.bad,      points: 35, reason: "미세먼지 (호흡기 위험)" },
  { test: (c) => c.pm25 > CARE_WX.DUST.pm25.moderate, points: 25, reason: "미세먼지 (호흡기 취약)" },
  { test: (c) => c.uv >= CARE_WX.UV.avoidSun,         points: 12, reason: "자외선 (피부·탈수)" },
  { test: (c) => c.uv >= CARE_WX.UV.sunscreenMust,    points: 5,  reason: "자외선 주의" },
  { test: (c) => c.temp >= CARE_WX.TEMP.hot && c.uv >= CARE_WX.UV.avoidSun, points: 8, reason: "복합 (폭염×자외선 동시)" },
  { test: (c) => c.humidity >= CARE_WX.HUMID.muggy,   points: 8,  reason: "습도 (불쾌지수 상승)" },
];

/* wellbian calcWeatherScore — 100점 시작·차감·위험군 dedupe·클램프 (원형 유지) */
function calcOutingScore(condition, extraRules = []) {
  let score = 100;
  const deductions = [];
  const appliedReasons = new Set();
  for (const rule of [...SENIOR_RULES, ...extraRules]) {
    if (!rule.test(condition)) continue;
    const key = rule.group || rule.reason.split(" ")[0]; // 같은 위험군(강수/폭염/한파/미세먼지/자외선)은 최심 1건만
    if (appliedReasons.has(key)) continue;
    appliedReasons.add(key);
    score -= rule.points;
    deductions.push({ reason: rule.reason, points: rule.points });
  }
  score = Math.max(0, Math.min(100, score));
  return { score, deductions };
}

/* wellbian verdictByScore 85/70/55/40 컷 — 시니어 외출 라벨로 치환 */
function verdictByScore(score) {
  if (score >= 85) return { verdict: "외출 최적", tone: "excellent", grade: "좋음" };
  if (score >= 70) return { verdict: "좋음",     tone: "good",      grade: "좋음" };
  if (score >= 55) return { verdict: "보통",     tone: "ok",        grade: "보통" };
  if (score >= 40) return { verdict: "주의",     tone: "warn",      grade: "주의" };
  return { verdict: "외출 자제", tone: "bad", grade: "나쁨" };
}

/* wellbian recommendComment — 부정 우선순위(위험 큰 순) + catch-all (LLM 0회) */
const COMMENT_RULES = [
  { test: (c) => c.pop >= 70,  msg: "비 소식이 있어 실내 대기 동선으로 준비할게요" },
  { test: (c) => c.pm25 > 75,  msg: "미세먼지가 매우 나빠 외출을 최소화하는 게 좋아요" },
  { test: (c) => c.temp >= 33, msg: "한낮 더위가 강해 그늘·수분을 챙길게요" },
  { test: (c) => c.temp <= 0,  msg: "추위가 강해 보온을 든든히 할게요" },
  { test: (c) => c.uv >= 8,    msg: "햇빛이 강해 양산과 모자를 챙길게요" },
  { test: (c) => c.pm25 > 35,  msg: "공기가 탁해 KF94 마스크를 챙겨 동행할게요" },
  { test: (c) => c.pop >= 40,  msg: "비 가능성이 있어 우산을 준비할게요" },
  { test: (c) => c.temp >= 31, msg: "더위 대비 수분을 챙길게요" },
  { test: (c) => c.temp <= 6,  msg: "쌀쌀해서 따뜻한 겉옷을 챙길게요" },
  { test: () => true,          msg: "어르신 외출하기 좋은 날이에요" }, // catch-all — 코멘트 null 방지
];
function buildComment(c) { return COMMENT_RULES.find((r) => r.test(c)).msg; }

/* 단일 지점 컨디션 (내부용) */
function computeLegOuting({ date = "", location = "서울", mobility } = {}) {
  const w = WX_SCENARIOS[hashStr(`${date}${location}`) % WX_SCENARIOS.length];
  const pmGrade = gradePM25(w.pm25);
  const uvGrade = gradeUV(w.uv);

  // 휠체어·거동불편 보정 — 강수 시 승하차·경사로 미끄럼 리스크 가중
  const extraRules = mobility === "wheelchair"
    ? [{ test: (c) => c.pop >= CARE_WX.RAIN.popLikely, points: 10, reason: "휠체어 (경사로 미끄럼)" }]
    : [];
  const { score, deductions } = calcOutingScore(w, extraRules);
  const { verdict, tone, grade } = verdictByScore(score);

  // 안전경보 하드스톱 — 점수와 별개의 즉시 일정변경 권고 계층
  const hard_stop = w.temp >= CARE_WX.TEMP.heatWarning || w.temp <= CARE_WX.TEMP.coldAdvisory
    || w.pop >= CARE_WX.RAIN.popVery || w.pm25 > CARE_WX.DUST.pm25.bad;

  // 동행 준비물 (케어 액션)
  const items = [];
  if (w.pm25 > CARE_WX.DUST.pm25.moderate) items.push("KF94 마스크");
  if (w.uv > 5) items.push("양산·모자");
  if (w.uv >= CARE_WX.UV.avoidSun) items.push("자외선 차단제");
  if (w.temp >= CARE_WX.TEMP.hot) items.push("수분·그늘 휴식");
  if (w.temp <= CARE_WX.TEMP.chilly) items.push("보온·핫팩");
  if (w.pop >= 60) items.push("우산·미끄럼 주의");
  if (w.humidity <= CARE_WX.HUMID.dry) items.push("보습·수분");
  if (items.length === 0) items.push("가벼운 겉옷");

  return {
    location, date,
    source: "케이웨더",
    sky: w.sky, temp: w.temp, humidity: w.humidity, pop: w.pop,
    pm25: w.pm25, pm10: w.pm10, pm_grade: pmGrade,
    uv: w.uv, uv_grade: uvGrade,
    score, verdict, tone, deductions, hard_stop,
    reschedule_advised: hard_stop,
    comment: buildComment(w),
    grade, items,
    summary: `${w.sky} ${w.temp}℃ · 미세먼지 ${pmGrade} · 자외선 ${uvGrade}`,
  };
}

/* 외출 컨디션 — 출발지(자택)·도착지(병원) 2지점 조회.
 * 어르신 동행은 왕복 전 구간이 리스크 → 두 지점 중 나쁜 쪽 기준으로 판정하고
 * 준비물은 두 지점 합집합. origin 없으면 단일 지점(하위호환). */
function computeOuting({ date = "", location = "서울", origin, mobility } = {}) {
  const dest = computeLegOuting({ date, location, mobility });
  if (!origin || origin === location) return dest;

  const org = computeLegOuting({ date, location: origin, mobility });
  const worstIsOrigin = org.score <= dest.score;
  const worst = worstIsOrigin ? org : dest;
  const legs = [
    { role: "출발지", location: origin,   score: org.score,  verdict: org.verdict,  sky: org.sky,  temp: org.temp,  summary: org.summary },
    { role: "도착지", location: location, score: dest.score, verdict: dest.verdict, sky: dest.sky, temp: dest.temp, summary: dest.summary },
  ];
  return {
    ...worst, // 지표·점수·판정은 나쁜 쪽 기준 (보수적 판정)
    location: `${origin} → ${location}`,
    items: [...new Set([...org.items, ...dest.items])],
    hard_stop: org.hard_stop || dest.hard_stop,
    reschedule_advised: org.hard_stop || dest.hard_stop,
    worst_leg: worstIsOrigin ? "출발지" : "도착지",
    legs,
    summary: `${worstIsOrigin ? "출발지" : "도착지"} ${worst.summary}`,
  };
}

/* ─── 시드: 케어매니저 (공급자) ─── */
export const SEED_MANAGERS = [
  { id: "mgr_01", name: "김순자", age: 58, rating: 4.9, reviews: 214, cert: ["요양보호사", "간호조무사"], areas: ["관악구", "동작구", "서초구"], specialty: "정형외과·재활 동행", insured: true, vehicle: false, done: 412 },
  { id: "mgr_02", name: "박영희", age: 61, rating: 4.8, reviews: 187, cert: ["요양보호사"], areas: ["종로구", "중구", "동대문구"], specialty: "치매·인지 케어", insured: true, vehicle: false, done: 356 },
  { id: "mgr_03", name: "이경숙", age: 54, rating: 5.0, reviews: 98, cert: ["간호조무사", "사회복지사"], areas: ["강남구", "서초구", "송파구"], specialty: "항암·투석 정기동행", insured: true, vehicle: true, done: 231 },
  { id: "mgr_04", name: "최미란", age: 49, rating: 4.7, reviews: 143, cert: ["요양보호사"], areas: ["마포구", "서대문구", "은평구"], specialty: "외래진료 에스코트", insured: true, vehicle: true, done: 298 },
  { id: "mgr_05", name: "정복순", age: 63, rating: 4.9, reviews: 165, cert: ["요양보호사", "간호조무사"], areas: ["노원구", "강북구", "성북구"], specialty: "거동불편·휠체어 동행", insured: true, vehicle: false, done: 389 },
];

/* ─── 시드: 주요 병원 → 관할 구 매핑 (슬롯 매칭용) ─── */
const HOSPITAL_DISTRICT = {
  "서울대병원": "종로구", "서울대학교병원": "종로구",
  "분당서울대병원": "성남시", "세브란스": "서대문구", "신촌세브란스": "서대문구",
  "강남세브란스": "강남구", "삼성서울병원": "강남구", "서울아산병원": "송파구",
  "서울성모병원": "서초구", "고대안암병원": "성북구", "이대목동병원": "양천구",
  "한양대병원": "성동구", "경희대병원": "동대문구", "중앙보훈병원": "강동구",
  "보라매병원": "동작구", "서울의료원": "중랑구",
};

/* 병원 별칭 정규화 — wellbian 골프장 CC 통일 원칙(별칭 제거·DB 매칭)의 케어판 */
const HOSPITAL_ALIASES = {
  "아산": "서울아산병원", "아산병원": "서울아산병원",
  "성모": "서울성모병원", "성모병원": "서울성모병원",
  "삼성": "삼성서울병원", "삼성병원": "삼성서울병원",
  "안암": "고대안암병원", "고대병원": "고대안암병원",
  "신촌": "신촌세브란스", "연세": "신촌세브란스",
  "서울대": "서울대병원", "보라매": "보라매병원",
};
function normalizeHospital(raw = "") {
  if (Object.keys(HOSPITAL_DISTRICT).some((h) => raw.includes(h))) return raw;
  const alias = Object.keys(HOSPITAL_ALIASES).sort((a, b) => b.length - a.length)
    .find((a) => raw.includes(a));
  return alias ? HOSPITAL_ALIASES[alias] : raw;
}
function districtOf(hospital = "") {
  const canon = normalizeHospital(hospital);
  if (HOSPITAL_DISTRICT[canon]) return HOSPITAL_DISTRICT[canon];
  // 최장 키 우선 — '분당서울대병원'이 '서울대병원'(종로구)에 선점되는 오매핑 방지
  const key = Object.keys(HOSPITAL_DISTRICT)
    .sort((a, b) => b.length - a.length)
    .find((h) => canon.includes(h));
  return key ? HOSPITAL_DISTRICT[key] : null;
}

/* 서비스별 준비물 체크리스트 — 정적 데이터 (LLM 실패 시에도 카드 완성) */
const CHECKLIST = {
  hospital:         ["신분증·건강보험증", "진료카드·예약문자", "복용약 목록", "보호자 비상연락처"],
  hospital_vehicle: ["신분증·건강보험증", "진료카드·예약문자", "복용약 목록", "휠체어·보행보조기", "보호자 비상연락처"],
  home_care:        ["복용약 목록", "식사·복약 시간표", "비상연락처", "현관 출입 안내"],
  dialysis:         ["신분증·투석 일지", "복용약 목록", "간식(저혈당 대비)", "담요·보온용품", "보호자 비상연락처"],
};

/* ─── 견적 계산 (순수) ─── */
function computeQuote({ service_type = "hospital", hours, weekend = false, night = false }) {
  const plan = RATE[service_type] || RATE.hospital;
  const h = Math.max(Number(hours) || plan.minHours, plan.minHours);
  const base = plan.hourly * h;
  let surcharge = 0;
  const surchargeLines = [];
  if (weekend) { const w = Math.round(base * WEEKEND_SURCHARGE); surcharge += w; surchargeLines.push({ label: "주말·공휴일 할증 15%", amount: w }); }
  if (night)   { const n = Math.round(base * NIGHT_SURCHARGE);   surcharge += n; surchargeLines.push({ label: "야간(20시~) 할증 20%", amount: n }); }
  const total = base + surcharge;
  return {
    service_label: plan.label,
    hourly: plan.hourly,
    hours: h,
    base,
    surcharge_lines: surchargeLines,
    total,
    breakdown: `${plan.label} ${plan.hourly.toLocaleString()}원 × ${h}시간`,
    note: "제공기록지·배상책임보험 포함 · 최종 결제 전 견적",
  };
}

/* ─── Tool 스키마 (Claude Function Calling) ─── */
export const CARE_TOOL_SCHEMAS = [
  {
    name: "estimate_quote",
    description:
      "보호자에게 병원동행/돌봄 서비스의 투명 견적을 계산합니다. 서비스 종류·소요시간(왕복 대기 포함)·주말/야간 여부를 받아 시간당 요금·할증·총액을 산출합니다. 문진으로 시간과 서비스 종류가 파악되면 결제 안내 전에 반드시 먼저 호출하세요.",
    input_schema: {
      type: "object",
      properties: {
        service_type: { type: "string", enum: ["hospital", "hospital_vehicle", "home_care", "dialysis"], description: "hospital=병원동행, hospital_vehicle=병원동행+차량(거동 불편·휠체어), home_care=재택돌봄, dialysis=정기 투석·항암 동행" },
        hours: { type: "number", description: "예상 소요 시간(시간 단위, 이동·대기 포함). 외래는 보통 3~4시간. 불명확하면 기본 2시간." },
        weekend: { type: "boolean", description: "토·일·공휴일이면 true" },
        night: { type: "boolean", description: "20시 이후 야간이면 true" },
      },
      required: ["service_type", "hours"],
    },
  },
  {
    name: "check_slots",
    description:
      "요청한 날짜·병원(또는 지역)에 배정 가능한 케어매니저를 조회합니다. 평점·자격증·전문분야·거리를 함께 반환합니다. 견적 확정 후 예약 직전에 호출해 어떤 매니저가 가능한지 보여주세요.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "희망 날짜 (예: '다음주 화요일', '7월 28일'). 자연어 그대로 전달 가능." },
        hospital: { type: "string", description: "병원명 또는 지역 (예: '서울대병원', '관악구')" },
        service_type: { type: "string", enum: ["hospital", "hospital_vehicle", "home_care", "dialysis"], description: "차량 필요 여부 판단용" },
      },
      required: ["date", "hospital"],
    },
  },
  {
    name: "outing_condition",
    description:
      "케이웨더 API로 특정 날짜의 외출 컨디션(날씨·기온·미세먼지·자외선)과 100점 판정, 어르신 동행 준비물을 조회합니다. 출발지(자택)와 도착지(병원)를 모두 주면 두 지점을 각각 조회해 나쁜 쪽 기준으로 판정합니다(왕복 전 구간 리스크). 예약 날짜가 정해지면 호출하고, 자택 지역을 알면 반드시 origin으로 전달하세요.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "조회 날짜 (자연어 그대로, 예: '다음주 화요일')" },
        location: { type: "string", description: "도착지 — 병원명 또는 지역 (예: '서울대병원'). 없으면 '서울'." },
        origin: { type: "string", description: "출발지 — 어르신 자택 지역 (예: '관악구'). 알면 반드시 전달 — 출발지·도착지 각각 조회됩니다." },
        mobility: { type: "string", enum: ["walk", "wheelchair"], description: "거동 수준을 알면 전달 — wheelchair면 강수 시 낙상 리스크가 점수에 가중됩니다" },
      },
      required: ["date"],
    },
  },
  {
    name: "create_booking",
    description:
      "모든 정보(대상자·병원·날짜/시간·서비스·매니저·견적)가 확정되면 예약을 생성하고 결제 링크를 발급합니다. 반드시 보호자가 명시적으로 '예약할게요/확정' 의사를 밝힌 뒤에만 호출하세요.",
    input_schema: {
      type: "object",
      properties: {
        recipient_name: { type: "string", description: "돌봄 대상자 호칭 (예: '어머니', '김O자 님'). 민감정보는 최소 수집." },
        hospital: { type: "string", description: "병원명" },
        origin: { type: "string", description: "출발지 — 어르신 자택 지역 (알면 전달, 외출 컨디션 2지점 판정에 사용)" },
        date: { type: "string", description: "날짜 (자연어 그대로)" },
        time: { type: "string", description: "시작 시간 (예: '오전 9시', '14:00')" },
        hours: { type: "number", description: "소요 시간" },
        service_type: { type: "string", enum: ["hospital", "hospital_vehicle", "home_care", "dialysis"] },
        manager_id: { type: "string", description: "check_slots가 반환한 매니저 id. 보호자가 특정 매니저를 고르지 않았으면 평점 1위 매니저 id." },
        weekend: { type: "boolean" },
        night: { type: "boolean" },
      },
      required: ["recipient_name", "hospital", "date", "time", "hours", "service_type", "manager_id"],
    },
  },
];

/* ─── Tool 실행 ─── */
export function executeCareTool(name, input = {}) {
  switch (name) {
    case "estimate_quote": {
      const q = computeQuote(input);
      return { ...q, _event: { type: "quote", ...q } };
    }

    case "check_slots": {
      const needVehicle = input.service_type === "hospital_vehicle";
      const canonHospital = normalizeHospital(input.hospital || "");
      const matchedDistrict = districtOf(input.hospital);
      // 미등록 병원 — 구조화 실패 반환으로 모델이 '가까운 제휴 지역 재제안' 턴으로 복구
      // (wellbian: 실패를 tool_result로 돌려 대안 제시 유도, throw 금지)
      // 지역명 입력('관악구')은 스키마가 허용 — 실패 경로가 아니라 지역 매칭으로 진행
      const isAreaInput = !!input.hospital && SEED_MANAGERS.some((m) =>
        m.areas.some((a) => input.hospital.includes(a) || a.includes(input.hospital)));
      if (!matchedDistrict && input.hospital && !isAreaInput) {
        const partnerDistricts = [...new Set(SEED_MANAGERS.flatMap((m) => m.areas))].slice(0, 5);
        return {
          matched_hospital: null,
          note: `'${input.hospital}'은 아직 제휴 확인이 필요한 병원이에요. 가까운 제휴 지역에서 배정 가능한 매니저를 안내할 수 있어요.`,
          partner_districts: partnerDistricts,
          available: [],
          count: 0,
        };
      }
      const district = matchedDistrict || canonHospital;
      // 지역·차량 조건으로 매칭 후 평점순 정렬 (결정론적)
      const scored = SEED_MANAGERS
        .filter((m) => (needVehicle ? m.vehicle : true))
        .map((m) => {
          const areaHit = m.areas.some((a) => (district || "").includes(a) || a.includes(district || "___"));
          return { m, areaHit };
        })
        .sort((a, b) => (b.areaHit - a.areaHit) || (b.m.rating - a.m.rating))
        .slice(0, 3)
        .map(({ m, areaHit }, i) => ({
          manager_id: m.id,
          name: m.name,
          rating: m.rating,
          reviews: m.reviews,
          cert: m.cert,
          specialty: m.specialty,
          vehicle: m.vehicle,
          distance_km: areaHit ? [1.8, 2.4, 3.1][i] ?? 3.5 : [4.6, 5.2, 6.0][i] ?? 6.5,
          nearby: areaHit,
        }));
      return {
        date: input.date,
        hospital: canonHospital || input.hospital,
        district,
        available: scored,
        count: scored.length,
        ...(scored.length ? { _event: { type: "slots", available: scored } } : {}),
      };
    }

    case "outing_condition": {
      const o = computeOuting(input);
      return { ...o, _event: { type: "weather", ...o } };
    }

    case "create_booking": {
      const q = computeQuote(input);
      const mgr = SEED_MANAGERS.find((m) => m.id === input.manager_id) || SEED_MANAGERS[0];
      // 결정론적 예약번호: 매니저 완료건수 + 시간 해시 (랜덤 미사용)
      const seed = Math.round(mgr.done + q.hours + (input.hospital || "").length) % 9000 + 1000;
      const wx = computeOuting({
        date: input.date, location: input.hospital, origin: input.origin,
        mobility: input.service_type === "hospital_vehicle" ? "wheelchair" : undefined,
      });
      const booking = {
        id: `BK-${seed}`,
        origin_area: input.origin || null,
        outing: { grade: wx.grade, score: wx.score, verdict: wx.verdict, summary: wx.summary, items: wx.items, comment: wx.comment },
        checklist: CHECKLIST[input.service_type] || CHECKLIST.hospital,
        recipient: input.recipient_name,
        hospital: input.hospital,
        date: input.date,
        time: input.time,
        hours: q.hours,
        service_type: input.service_type,
        service_label: q.service_label,
        manager_id: mgr.id,
        manager_name: mgr.name,
        manager_rating: mgr.rating,
        price: q.total,
        platform_fee: Math.round(q.total * PLATFORM_FEE_RATE),
        status: "confirmed",
        pay_url: `https://pay.toss.im/care/${seed}`,
      };
      return {
        ok: true,
        booking,
        message: `예약이 접수되었습니다. 결제 링크로 선결제(에스크로) 후 확정됩니다.`,
        _event: { type: "booking", booking },
      };
    }

    default:
      return { error: `알 수 없는 도구: ${name}` };
  }
}

/* ─── 데모 콘솔 시드 (초기 화면을 채우는 오늘자 예약·KPI) ───
 * start=시작시각(소수=30분), hours=소요시간, managerId=배차 그리드 행 매칭.
 * 챗봇으로 새 예약이 들어오면 이 today 배열 앞에 추가되고 GMV가 오릅니다. */
export const SEED_CONSOLE = {
  kpi: { gmv: 18_400_000, bookings: 47, utilization: 82, noShow: 3.1 },
  // 오늘 관할지역(서울 강남) 외출 컨디션 — 케이웨더 (여름·폭염/자외선 주의)
  outing: {
    location: "서울 강남", date: "오늘", source: "케이웨더",
    sky: "맑음", temp: 33, humidity: 48, pop: 10,
    pm25: 22, pm10: 40, pm_grade: "보통", uv: 9, uv_grade: "매우높음",
    score: 50, verdict: "주의", tone: "warn", hard_stop: false,
    deductions: [
      { reason: "폭염 (탈수·어지럼)", points: 30 },
      { reason: "자외선 (피부·탈수)", points: 12 },
      { reason: "복합 (폭염×자외선 동시)", points: 8 },
    ],
    comment: "한낮 더위가 강해 그늘·수분을 챙길게요",
    grade: "주의", items: ["양산·모자", "자외선 차단제", "수분·그늘 휴식"],
    summary: "맑음 33℃ · 미세먼지 보통 · 자외선 매우높음",
  },
  // 이번 주 일자별 외출 컨디션 — 케이웨더 (배차 계획용 · 7/20~7/26)
  week: [
    { label: "월", date: "7/20", sky: "맑음",     temp: 32, pm_grade: "보통", uv_grade: "높음",     grade: "주의" },
    { label: "화", date: "7/21", sky: "구름많음", temp: 30, pm_grade: "나쁨", uv_grade: "보통",     grade: "주의" },
    { label: "수", date: "7/22", sky: "흐림",     temp: 27, pm_grade: "좋음", uv_grade: "낮음",     grade: "좋음" },
    { label: "목", date: "7/23", sky: "맑음",     temp: 33, pm_grade: "보통", uv_grade: "매우높음", grade: "주의", today: true },
    { label: "금", date: "7/24", sky: "맑음",     temp: 34, pm_grade: "좋음", uv_grade: "매우높음", grade: "주의" },
    { label: "토", date: "7/25", sky: "비",       temp: 27, pm_grade: "좋음", uv_grade: "낮음",     grade: "주의" },
    { label: "일", date: "7/26", sky: "구름많음", temp: 28, pm_grade: "좋음", uv_grade: "보통",     grade: "좋음" },
  ],
  today: [
    { id: "BK-2041", start: 8.5,  hours: 2, recipient: "정O남 님", hospital: "서울아산병원", managerId: "mgr_03", manager: "이경숙", service: "항암 동행",     price: 168000, status: "in_service" },
    { id: "BK-2050", start: 10,   hours: 3, recipient: "한O자 님", hospital: "세브란스",     managerId: "mgr_04", manager: "최미란", service: "병원동행+차량", price: 150000, status: "dispatched" },
    { id: "BK-2044", start: 13,   hours: 2, recipient: "김O수 님", hospital: "경희대병원",   managerId: "mgr_02", manager: "박영희", service: "외래 동행",     price: 120000, status: "dispatched" },
    { id: "BK-2053", start: 13,   hours: 3, recipient: "오O식 님", hospital: "보라매병원",   managerId: "mgr_01", manager: "김순자", service: "재활 동행",     price: 120000, status: "dispatched" },
    { id: "BK-2058", start: 14.5, hours: 2, recipient: "윤O례 님", hospital: "고대안암병원", managerId: "mgr_05", manager: "정복순", service: "휠체어 동행",   price: 160000, status: "pending" },
  ],
};

/* ─── 가족 프로필 병합 (진화 루프의 순수 코어) ───
 * 대화·예약에서 나온 사실을 프로필에 병합. 클라이언트(localStorage)와
 * 서버(family_profiles) 양쪽에서 같은 함수로 — 단일 진실 규칙. */
export function mergeCareProfile(prior = {}, patch = {}) {
  const p = { ...(prior || {}) };
  const b = patch.booking;
  if (b) {
    p.recipient = b.recipient || p.recipient;
    p.hospital = b.hospital || p.hospital;
    p.service_type = b.service_type || p.service_type;
    p.preferred_manager = b.manager_name || p.preferred_manager;
    p.preferred_manager_key = b.manager_id || p.preferred_manager_key;
    p.last_booking = { id: b.id, date: b.date, time: b.time, hours: b.hours };
    p.visits = (p.visits || 0) + 1;
  }
  if (patch.origin) p.origin_area = patch.origin;
  if (patch.mobility) p.mobility = patch.mobility;
  if (patch.topics && typeof patch.topics === "object") {
    p.topics = { ...(p.topics || {}) };
    for (const k of ["pain", "appointments", "medication", "mobility_note", "mood"]) {
      if (patch.topics[k]) p.topics[k] = String(patch.topics[k]).slice(0, 120);
    }
  }
  p.updated_at = patch.now || p.updated_at;
  return p;
}

export { computeQuote, RATE, PLATFORM_FEE_RATE };
