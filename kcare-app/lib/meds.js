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
export const MED_PLAN = [
  {
    slot: "아침",
    time: "08:00",
    items: [
      { name: "혈압약 (아모잘탄)", dose: "1정" },
      { name: "아스피린", dose: "1정" },
    ],
  },
  { slot: "점심", time: "12:30", items: [{ name: "당뇨약 (메트포르민)", dose: "1정" }] },
  {
    slot: "저녁",
    time: "19:00",
    items: [
      { name: "혈압약 (아모잘탄)", dose: "1정" },
      { name: "콜레스테롤약 (아토르바)", dose: "1정" },
    ],
  },
];

// 건강기능식품 — 남은 용량(remain/total)과 유통기한. 재구매 알림 판단은 아래 함수.
// storeId 는 스토어 상품 id — 재구매 버튼이 장바구니로 바로 이어진다.
export const SUPPLEMENTS = [
  {
    id: "sp1",
    name: "비타민D 2000IU",
    perDay: 1,
    remain: 12,
    total: 90,
    unit: "정",
    expiry: "2027-04",
    storeId: "vt2",
  },
  {
    id: "sp2",
    name: "오메가3",
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
    perDay: 1,
    remain: 61,
    total: 90,
    unit: "정",
    expiry: "2027-01",
    storeId: null,
  },
];

export const MED_REGISTRY = {
  registeredBy: "박지현 컨시어지",
  registeredAt: "첫 안심방문 · 7월 12일",
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
// taken 은 { "아침": true, ... } 형태의 state.elder.medSlots
export function medProgress(taken = {}) {
  const total = MED_PLAN.length;
  const done = MED_PLAN.filter((d) => taken[d.slot]).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
