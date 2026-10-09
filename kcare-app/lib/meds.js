// 복약 · 건강기능식품 관리 — 2026-08-12 어르신화면 시트 '건강' 1번.
//
// 시트 원문: "첫 안심방문이 드시는 약과 건기식을 등록해서 매일 스스로 약 복용여부
// 확인체크 및 복용 전고 전체 횟수에서 복용 횟수를 체크할 수 있게 구현(진행바 같은
// 형태), 건기식의 종류와 유통기간을 관리해서 건기식 용량이 부족할때쯤 재구매를
// 상기시키는 알림서비스"
//
// 등록 주체가 중요하다 — 어르신이 직접 입력하는 게 아니라 첫 안심방문에서
// 컨시어지가 약봉투와 건기식 통을 보고 등록한다. 그래서 registeredBy 를 남긴다.
// 어르신 화면은 체크만 한다.

// 매일 복용 — slot(때)마다 여러 알약. 어르신 화면의 진행바가 이 배열을 센다.
//
// elderLabel — 어르신 화면에 보이는 이름 (2026-09-04 시트 오늘 3번 · 건강 2번 "약 성분
// 삭제"). 참고 시안이 "아산병원약 먹기"처럼 처방한 병원으로 부른다 — 어르신에게는
// 성분명보다 "그 병원에서 준 약"이 약봉투 글씨와 같아서 알아보기 쉽다.
// 아침·저녁은 서울아산 순환기내과 처방(일정 ev1 과 같은 병원)이라 '아산병원약'.
// 점심 당뇨약은 처방처가 기록에 없어 약 이름으로 둔다 — 지어내지 않는다.
// items 의 성분명(괄호)은 컨시어지·보호자·케어 프로필용으로 그대로 둔다.
export const MED_PLAN = [
  {
    slot: "아침",
    time: "08:00",
    elderLabel: "아산병원약",
    items: [
      { name: "혈압약 (아모잘탄)", dose: "1정" },
      { name: "아스피린", dose: "1정" },
    ],
  },
  { slot: "점심", time: "12:30", elderLabel: "당뇨약", items: [{ name: "당뇨약 (메트포르민)", dose: "1정" }] },
  {
    slot: "저녁",
    time: "19:00",
    elderLabel: "아산병원약",
    items: [
      { name: "혈압약 (아모잘탄)", dose: "1정" },
      { name: "콜레스테롤약 (아토르바)", dose: "1정" },
    ],
  },
];

// "08:00" → 8·"12:30" → 12.5 — 팝업을 띄울 때인지 비교할 때 쓴다
export function slotHour(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}

// 건강기능식품 — 남은 용량(remain/total)과 유통기한. 재구매 알림 판단은 아래 함수.
// storeId 는 스토어 상품 id 자리 — 스토어가 생활안전용품만 팔게 되어(2026-10-02) 지금은 비어 있다. 재구매는 해주세요로 간다.
// slot — 알람 팝업에서 같은 시간대 약과 한 카드로 합쳐 보여주기 위한 값
// (2026-08-31). 실무진 자료에 영양제 복용 시간대가 없어서 임의로 정하지 않았다.
//
// 2026-09-10 정리 — 케어 프로필의 "확정 / 미확인 구분" 원칙을 그대로 따른다:
//   · slotConfirmed:false 인 동안은 데모 가정값이다. 어르신 화면은 지금처럼 같은
//     시간대 약과 합쳐 보여준다 (어르신에게 "확인 전"을 보이지 않는다 — 무부담).
//   · 컨시어지 고객 탭의 AI 동행 브리핑 '미확정' 칸에 자동으로 올라간다 —
//     첫 안심방문 때 약봉투를 보고 보호자와 확인하는 사람이 컨시어지다.
//   · 확인되면 slot 을 실제 값으로 바꾸고 slotConfirmed:true 로 — 브리핑에서 빠진다.
export const SUPPLEMENT_SLOT_RULE = "첫 안심방문 때 약봉투를 보고 보호자와 확인";

export const SUPPLEMENTS = [
  {
    id: "sp1",
    name: "비타민D 2000IU",
    slot: "아침",
    slotConfirmed: false,
    perDay: 1,
    remain: 12,
    total: 90,
    unit: "정",
    expiry: "2027-04",
    storeId: null, // 스토어는 생활안전용품만 판다 — 다시 사는 것은 해주세요(심부름)로
  },
  {
    id: "sp2",
    name: "오메가3",
    slot: "저녁",
    slotConfirmed: false,
    perDay: 2,
    remain: 44,
    total: 120,
    unit: "캡슐",
    expiry: "2026-11",
    storeId: null,
  },
  {
    id: "sp3",
    name: "칼슘 · 마그네슘",
    slot: "저녁",
    slotConfirmed: false,
    perDay: 1,
    remain: 61,
    total: 90,
    unit: "정",
    expiry: "2027-01",
    storeId: null,
  },
];

// 시간대가 아직 가정값인 영양제 — 컨시어지 브리핑 '미확정' 칸 한 줄로 만든다.
// 전부 확인되면 null 을 돌려주고 브리핑에서 사라진다.
export function supplementSlotNote() {
  const open = SUPPLEMENTS.filter((s) => !s.slotConfirmed);
  if (!open.length) return null;
  const list = open.map((s) => `${s.name.split(" ")[0]} ${s.slot}`).join(" · ");
  return `영양제 복용 시간대 (${list}) — 자료에 없어 가정값 · ${SUPPLEMENT_SLOT_RULE}`;
}

export const MED_REGISTRY = {
  registeredBy: "박지현 컨시어지",
  registeredAt: "첫 안심방문 · 7월 12일",
};

// 복약 미션 — 참고 영상(2026-08-26 'senior mission alarm')의 상호작용을 데이터로.
// 어제까지 며칠 연속 다 드셨는지. 오늘분은 medSlots(상태)에서 세므로 여기 없다.
// 별은 연속일수를 그대로 세지 않고 최대 4개까지만 — 5개가 넘어가면 어르신
// 화면에서 별이 줄바꿈되고, "몇 개인지" 세는 일이 목적이 아니다.
export const MED_STREAK = {
  days: 3, // 어제까지 3일 연속
  week: [
    // 최근 7일 — 오늘 제외 6일 + 오늘(todayIsLast 로 상태에서 채운다)
    { label: "월", done: true },
    { label: "화", done: true },
    { label: "수", done: false },
    { label: "목", done: true },
    { label: "금", done: true },
    { label: "토", done: true },
  ],
};

// 며칠 남았는지 — 하루 복용량으로 나눈다
export function daysLeft(s) {
  return Math.floor(s.remain / Math.max(1, s.perDay));
}

// 재구매를 알릴 때인가 — 2주(14일) 미만이면 알린다.
// 유통기한이 6개월 안으로 들어와도 알린다 (남았어도 못 드시게 된다).
export function needsReorder(s, now = new Date()) {
  if (daysLeft(s) < 14) return "용량 부족";
  const [y, m] = (s.expiry || "").split("-").map(Number);
  if (!y || !m) return null;
  const months = (y - now.getFullYear()) * 12 + (m - 1 - now.getMonth());
  return months <= 6 ? "유통기한 임박" : null;
}

// 오늘 몇 번 중 몇 번 드셨는지 — 진행바에 그대로 쓴다.
// taken 은 { "아침": true, ... } 형태의 state.elder.medSlots · plan 은 healthOf(state).meds
export function medProgress(taken = {}, plan = MED_PLAN) {
  const total = plan.length;
  const done = plan.filter((d) => taken[d.slot]).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

// ── 건강 정보 한 벌 — 복용약 · 질환 · 알레르기 (2026-10-02 QA "복용약 등록·수정 버튼 없음 · 화면마다 약이 다름") ──
//
// 전에는 어르신 화면(MED_PLAN: 아모잘탄 · 아스피린 · 메트포르민 · 아토르바), 관제 어르신 관리
// (항응고제 · 혈압약), SOS 119 신고 정보(항응고제 · 혈압약)가 서로 다른 목록을 들고 있었다.
// 이제 가구 상태(state.health)에 한 벌만 두고, 관제(어르신 관리 › 건강·질환)와 컨시어지(고객 탭)에서
// 고친다. 어르신 · 보호자 · 관제 · SOS 신고 정보가 모두 healthOf(state) 를 읽는다.
// state.health 가 없으면(아직 아무도 고치지 않았으면) 아래 기본값 — 복약 계획(MED_PLAN)과 같은 출처다.
// 질환은 복용약과 맞췄다: 혈압약 → 고혈압 · 당뇨약 → 당뇨 · 콜레스테롤약 → 고지혈증 (심부전은 관제 기록).
export const MED_SLOTS = ["아침", "점심", "저녁", "자기 전"];
export const DEFAULT_HEALTH = {
  conditions: ["심부전", "고혈압", "당뇨", "고지혈증"],
  allergies: [], // 없음 — 화면은 '등록 없음'으로 쓴다 (문장을 값으로 두면 편집기에서 알레르기로 저장된다)
  meds: MED_PLAN,
};

const strList = (v) => (Array.isArray(v) ? v.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 20) : null);
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
function cleanSlot(d) {
  if (!d || typeof d !== "object") return null;
  const slot = String(d.slot || "").trim();
  const time = HHMM.test(String(d.time || "")) ? String(d.time) : null;
  const items = Array.isArray(d.items)
    ? d.items
        .map((i) => ({ name: String(i?.name || "").trim().slice(0, 40), dose: String(i?.dose || "").trim().slice(0, 20) }))
        .filter((i) => i.name)
        .slice(0, 10)
    : [];
  if (!slot || !time || !items.length) return null;
  return { slot: slot.slice(0, 10), time, elderLabel: String(d.elderLabel || "").trim().slice(0, 20) || items.map((i) => i.name.replace(/\s*\([^)]*\)\s*$/, "")).join(" · "), items };
}
export const sortSlots = (plan) => [...plan].sort((a, b) => slotHour(a.time) - slotHour(b.time));

// 가구 상태에서 건강 정보를 읽는다 — 저장값은 여러 폰이 쓰는 입력이라 모양을 확인하고 쓴다.
export function healthOf(state) {
  const h = state?.health;
  if (!h || typeof h !== "object") return { ...DEFAULT_HEALTH, custom: false, by: null, at: null };
  const meds = Array.isArray(h.meds) ? sortSlots(h.meds.map(cleanSlot).filter(Boolean)) : DEFAULT_HEALTH.meds;
  return {
    meds,
    conditions: strList(h.conditions) || DEFAULT_HEALTH.conditions,
    allergies: strList(h.allergies) || DEFAULT_HEALTH.allergies,
    custom: true,
    by: h.by ? String(h.by) : null,
    at: Number.isFinite(h.at) ? h.at : null,
  };
}
export { cleanSlot as cleanMedSlot };

// 관제 · SOS 신고 정보용 한 줄씩 — "혈압약 (아모잘탄) 1정 — 아침 · 저녁"
export function medSummary(plan = MED_PLAN) {
  const by = new Map();
  for (const d of plan) {
    for (const i of d.items) {
      if (!by.has(i.name)) by.set(i.name, { name: i.name, dose: i.dose, slots: [] });
      by.get(i.name).slots.push(d.slot);
    }
  }
  return [...by.values()].map((m) => `${m.name}${m.dose ? ` ${m.dose}` : ""} — ${m.slots.join(" · ")}`);
}
// 서로 다른 약 이름 (성분명 포함) — 케어 프로필 '복약 n종'
export const medDrugs = (plan = MED_PLAN) => [...new Set(plan.flatMap((d) => d.items.map((i) => i.name)))];
