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

    case "create_booking": {
      const q = computeQuote(input);
      const mgr = SEED_MANAGERS.find((m) => m.id === input.manager_id) || SEED_MANAGERS[0];
      // 결정론적 예약번호: 매니저 완료건수 + 시간 해시 (랜덤 미사용)
      const seed = (mgr.done + q.hours + (input.hospital || "").length) % 9000 + 1000;
      const booking = {
        id: `BK-${seed}`,
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
  today: [
    { id: "BK-2041", start: 8.5,  hours: 2, recipient: "정O남 님", hospital: "서울아산병원", managerId: "mgr_03", manager: "이경숙", service: "항암 동행",     price: 168000, status: "in_service" },
    { id: "BK-2050", start: 10,   hours: 3, recipient: "한O자 님", hospital: "세브란스",     managerId: "mgr_04", manager: "최미란", service: "병원동행+차량", price: 150000, status: "dispatched" },
    { id: "BK-2044", start: 13,   hours: 2, recipient: "김O수 님", hospital: "경희대병원",   managerId: "mgr_02", manager: "박영희", service: "외래 동행",     price: 120000, status: "dispatched" },
    { id: "BK-2053", start: 13,   hours: 3, recipient: "오O식 님", hospital: "보라매병원",   managerId: "mgr_01", manager: "김순자", service: "재활 동행",     price: 120000, status: "dispatched" },
    { id: "BK-2058", start: 14.5, hours: 2, recipient: "윤O례 님", hospital: "고대안암병원", managerId: "mgr_05", manager: "정복순", service: "휠체어 동행",   price: 160000, status: "pending" },
  ],
};

export { computeQuote, RATE, PLATFORM_FEE_RATE };
