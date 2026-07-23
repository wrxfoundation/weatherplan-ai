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

/* ─── 케이웨더 외출 컨디션 (날씨·미세먼지·자외선) ───
 * 실서비스: 케이웨더 60일 예보 + 대기질 API 연동.
 * 데모: 날짜·지역 문자열 해시로 결정론적 예보 생성(랜덤 미사용).
 * 어르신은 폭염·한파·미세먼지·자외선에 취약 → 동행 준비물 안내에 활용. */
function gradePM25(v) { return v <= 15 ? "좋음" : v <= 35 ? "보통" : v <= 75 ? "나쁨" : "매우나쁨"; }
function gradeUV(v)   { return v <= 2 ? "낮음" : v <= 5 ? "보통" : v <= 7 ? "높음" : v <= 10 ? "매우높음" : "위험"; }
function hashStr(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

// 데모용 예보 시나리오 (모두 시니어케어에서 유의미한 상황)
const WX_SCENARIOS = [
  { sky: "구름많음",   temp: 19, pm25: 62, pm10: 88, uv: 4,  humidity: 55, pop: 20 }, // 미세먼지 나쁨
  { sky: "맑음",       temp: 33, pm25: 22, pm10: 40, uv: 9,  humidity: 48, pop: 10 }, // 폭염+자외선
  { sky: "맑음",       temp: 6,  pm25: 18, pm10: 30, uv: 3,  humidity: 40, pop: 0  }, // 쌀쌀·건조
  { sky: "비",         temp: 21, pm25: 12, pm10: 20, uv: 1,  humidity: 82, pop: 75 }, // 강수·미끄럼
];

function computeOuting({ date = "", location = "서울" } = {}) {
  const w = WX_SCENARIOS[hashStr(`${date}${location}`) % WX_SCENARIOS.length];
  const pmGrade = gradePM25(w.pm25);
  const uvGrade = gradeUV(w.uv);

  // 종합 외출 컨디션 등급 (0 좋음 ~ 3 나쁨)
  let score = 0;
  if (w.pm25 > 75 || w.temp >= 35 || w.temp <= -12) score = 3;
  else if (pmGrade === "나쁨" || w.uv > 7 || w.temp >= 31 || w.temp <= 0 || w.pop >= 60) score = 2;
  else if (pmGrade === "보통" || w.uv > 5) score = 1;
  const grade = ["좋음", "보통", "주의", "나쁨"][score];

  // 동행 준비물 (케어 액션)
  const items = [];
  if (w.pm25 > 35) items.push("KF94 마스크");
  if (w.uv > 5) items.push("양산·모자");
  if (w.uv > 7) items.push("자외선 차단제");
  if (w.temp >= 31) items.push("수분·그늘 휴식");
  if (w.temp <= 6) items.push("보온·핫팩");
  if (w.pop >= 60) items.push("우산·미끄럼 주의");
  if (w.humidity <= 40) items.push("보습·수분");
  if (items.length === 0) items.push("가벼운 겉옷");

  return {
    location, date,
    source: "케이웨더",
    sky: w.sky, temp: w.temp, humidity: w.humidity, pop: w.pop,
    pm25: w.pm25, pm10: w.pm10, pm_grade: pmGrade,
    uv: w.uv, uv_grade: uvGrade,
    grade, items,
    summary: `${w.sky} ${w.temp}℃ · 미세먼지 ${pmGrade} · 자외선 ${uvGrade}`,
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

function districtOf(hospital = "") {
  const key = Object.keys(HOSPITAL_DISTRICT).find((h) => hospital.includes(h));
  return key ? HOSPITAL_DISTRICT[key] : null;
}

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
      "케이웨더 API로 특정 날짜·지역의 외출 컨디션(날씨·기온·미세먼지·자외선)과 종합 등급, 어르신 동행 준비물(마스크·양산·보온·수분 등)을 조회합니다. 어르신은 폭염·한파·미세먼지·자외선에 취약하므로, 예약 날짜가 정해지면 호출해 준비물을 안내하세요.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "조회 날짜 (자연어 그대로, 예: '다음주 화요일')" },
        location: { type: "string", description: "지역 또는 병원명 (예: '서울', '서울대병원'). 없으면 '서울'." },
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
      const district = districtOf(input.hospital) || input.hospital;
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
        hospital: input.hospital,
        district,
        available: scored,
        count: scored.length,
        _event: { type: "slots", available: scored },
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
      const seed = (mgr.done + q.hours + (input.hospital || "").length) % 9000 + 1000;
      const wx = computeOuting({ date: input.date, location: input.hospital });
      const booking = {
        id: `BK-${seed}`,
        outing: { grade: wx.grade, summary: wx.summary, items: wx.items },
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

export { computeQuote, RATE, PLATFORM_FEE_RATE };
