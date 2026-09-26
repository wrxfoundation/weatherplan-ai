// 영업자 (회원 유치) — 2026-09-23 이성준 님 요청.
//
// 영업자는 컨시어지가 아니다. 컨시어지는 방문·동행으로 케어를 하고, 영업자는 회원을 모집한다.
// 보호자·어르신 화면처럼 별도 화면(/sales)을 쓰고, 가입 상담 신청과 추천 코드로 이어진다.
//
// 수수료 구조: 네트워크가 아니라 직판 — 본인이 직접 모집한 고객만 집계하고 하위 조직 수당은 없다.
// 수수료 제도 문서는 2026-09-23 중 전달 예정이다. 받기 전에는 수당 금액을 만들지 않는다
// (lib/config.js PRICING.channel.direct 35% 는 2026-08-01 회의 가정치라 여기서 쓰지 않는다).
// 제도가 오면 SALES_COMMISSION.rules 를 채우고 confirmed 를 true 로 바꾸면 화면에 금액이 뜬다.
import { HOUSEHOLD, PRICING } from "./config";

export const SALES_REP = {
  code: "S-0012",
  name: "한지우",
  branch: "강남 본점",
  model: "직판",
  since: "2026-09-01",
  phone: "010-****-4127",
};

export const SALES_COMMISSION = {
  model: "직판",
  confirmed: false,
  // 제도 수령 후 채운다 — 예: { entry: { rate: 0.1 }, monthly: { rate: 0.05, months: 12 }, basis: "installed" }
  //  entry   가입·설치비에서 주는 몫        monthly 월 구독료에서 주는 몫과 기간
  //  basis   수당이 서는 시점 — "joined"(가입·설치비 결제) 또는 "installed"(첫 방문·설치 완료)
  rules: null,
  pendingNote: "수수료 제도 확정 전입니다. 본사에서 확정되면 이 자리에 수당이 계산돼 표시됩니다.",
};

// 모집 고객의 진행 단계 — 가입 상담 신청부터 설치까지. 빨강은 SOS·낙상 전용이라 해지도 회색이다.
export const SALES_STATUS = {
  lead: { label: "상담 신청", fg: "#3B5C8A", bg: "rgba(59,92,138,.12)", order: 0 },
  consulted: { label: "상담 완료", fg: "#7A4C8A", bg: "rgba(122,76,138,.12)", order: 1 },
  joined: { label: "가입 완료", fg: "#8A5D12", bg: "rgba(138,93,18,.14)", order: 2 },
  installed: { label: "설치 완료", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)", order: 3 },
  dropped: { label: "가입 안 함", fg: "#5C5A54", bg: "rgba(10,31,60,.06)", order: 4 },
  canceled: { label: "해지", fg: "#5C5A54", bg: "rgba(10,31,60,.06)", order: 5 },
};
// 가입·설치비를 낸 고객 — 수당이 설 수 있는 단계
export const PAID = new Set(["joined", "installed"]);
export const IN_PROGRESS = new Set(["lead", "consulted"]);

// 모집 고객 (데모). 영업자에게는 계약자(보호자) 이름 일부 · 관계 · 구 · 상품 · 진행 단계만 보인다.
// 어르신의 건강·위치·케어 기록은 영업자 화면에 싣지 않는다.
// 김민수 님 가구(김순자 님)는 앱 전체의 데모 가구와 같은 집이다 — 이 영업자가 모집했다.
export const SALES_CUSTOMERS = [
  { id: "sc1", name: "김민수", rel: "아들", district: "강남구", household: "single", status: "installed", leadAt: "2026-09-02", joinedAt: "2026-09-05", installedAt: "2026-09-09", phone: "010-****-2231" },
  { id: "sc2", name: "이수정", rel: "딸", district: "서초구", household: "couple", status: "installed", leadAt: "2026-09-04", joinedAt: "2026-09-08", installedAt: "2026-09-12", phone: "010-****-8810" },
  { id: "sc3", name: "박준호", rel: "아들", district: "강남구", household: "single", status: "joined", leadAt: "2026-09-10", joinedAt: "2026-09-17", installedAt: null, phone: "010-****-0457", note: "첫 방문 9/25 예정" },
  { id: "sc4", name: "정미란", rel: "며느리", district: "송파구", household: "single", status: "consulted", leadAt: "2026-09-15", joinedAt: null, installedAt: null, phone: "010-****-7719", note: "가족 회의 후 결정 · 9/26 재연락" },
  { id: "sc5", name: "최영숙", rel: "본인", district: "강남구", household: "couple", status: "lead", leadAt: "2026-09-21", joinedAt: null, installedAt: null, phone: "010-****-3308", note: "상담 콜 9/24 오전" },
  { id: "sc6", name: "오세훈", rel: "아들", district: "서초구", household: "single", status: "lead", leadAt: "2026-09-22", joinedAt: null, installedAt: null, phone: "010-****-1962" },
  { id: "sc7", name: "윤지영", rel: "딸", district: "강동구", household: "single", status: "dropped", leadAt: "2026-09-06", joinedAt: null, installedAt: null, phone: "010-****-5540", note: "서비스 지역 2급지 · 요금 확정 후 재안내" },
];

// ── 표기 도우미 ──
// 이름은 가운데를 가린다: 김민수 → 김*수, 김민 → 김*, 남궁민수 → 남**수
export function maskName(n) {
  if (!n) return "—";
  const s = String(n);
  if (s.length <= 1) return s;
  if (s.length === 2) return `${s[0]}*`;
  return `${s[0]}${"*".repeat(s.length - 2)}${s[s.length - 1]}`;
}
export const householdLabel = (h) => (h === "couple" ? "부부 가구" : "1인");
export const monthlyOf = (h) => (h === "couple" ? HOUSEHOLD.monthly : PRICING.subscription.monthly);
// 부부 가구 가입·설치비는 결정에 없다 (lib/config.js HOUSEHOLD.entryFee = null) — 합계에서 빼고 따로 센다
export const entryOf = (h) => (h === "couple" ? HOUSEHOLD.entryFee : PRICING.entryFee.total);

export const referralPath = (code = SALES_REP.code) => `/onboarding?ref=${encodeURIComponent(code)}`;
export const isRepCode = (v) => /^S-\d{4}$/.test(String(v || "").trim().toUpperCase());

// 가입 상담에서 이 영업자 코드로 들어온 신청 — 보호자 이름은 가입 상담에서 받지 않으므로 어르신 이름으로 표기한다
export function liveLead(onboarding, code = SALES_REP.code) {
  if (!onboarding || String(onboarding.salesRef || "").toUpperCase() !== code) return null;
  const d = new Date(onboarding.joinedAt || Date.now());
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    id: "live",
    live: true,
    // 다른 행과 같은 규칙으로 가린다 — 새 신청이라고 실명을 보이면 안 된다
    name: onboarding.elderName ? `${maskName(onboarding.elderName)} 님 가구` : "새 신청",
    rel: onboarding.rel || (onboarding.forSelf ? "본인" : "—"),
    district: onboarding.district || "—",
    household: onboarding.household || "single",
    status: "lead",
    leadAt: ymd,
    joinedAt: null,
    installedAt: null,
    phone: onboarding.phone ? `${String(onboarding.phone).slice(0, 4)}****${String(onboarding.phone).slice(-4)}` : "—",
    note: "방금 가입 상담에서 내 추천 코드로 들어온 신청",
  };
}

// 실적 요약 — 이번 달(monthKey "2026-09") 기준과 누적
export function salesSummary(rows, monthKey) {
  const inMonth = (d) => !!d && d.startsWith(monthKey);
  const paid = rows.filter((r) => PAID.has(r.status));
  const paidMonth = paid.filter((r) => inMonth(r.joinedAt));
  const entryKnown = paid.filter((r) => entryOf(r.household) != null);
  return {
    total: rows.length,
    leadsMonth: rows.filter((r) => inMonth(r.leadAt)).length,
    inProgress: rows.filter((r) => IN_PROGRESS.has(r.status)).length,
    paid: paid.length,
    paidMonth: paidMonth.length,
    installed: rows.filter((r) => r.status === "installed").length,
    lost: rows.filter((r) => r.status === "dropped" || r.status === "canceled").length,
    // 수당 계산에 쓰일 실적 — 금액은 확정 가격에서만 나온다
    entrySum: entryKnown.reduce((s, r) => s + entryOf(r.household), 0),
    entryUnknown: paid.length - entryKnown.length,
    monthlySum: paid.reduce((s, r) => s + monthlyOf(r.household), 0),
    conversion: rows.length ? Math.round((paid.length / rows.length) * 100) : 0,
  };
}

// 수당 — 제도가 확정되기 전에는 null. 확정 뒤에는 rules 로만 계산한다 (여기서 요율을 지어내지 않는다).
export function commissionFor(rows, commission = SALES_COMMISSION) {
  if (!commission.confirmed || !commission.rules) return null;
  const { entry, monthly, basis = "joined" } = commission.rules;
  const eligible = rows.filter((r) => (basis === "installed" ? r.status === "installed" : PAID.has(r.status)));
  const fromEntry = entry?.rate != null ? eligible.reduce((s, r) => s + (entryOf(r.household) || 0) * entry.rate, 0) : 0;
  const fromMonthly = monthly?.rate != null ? eligible.reduce((s, r) => s + monthlyOf(r.household) * monthly.rate, 0) : 0;
  return { eligible: eligible.length, fromEntry: Math.round(fromEntry), fromMonthly: Math.round(fromMonthly), total: Math.round(fromEntry + fromMonthly) };
}
