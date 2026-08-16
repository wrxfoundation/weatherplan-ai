import { PRICING } from "./config";

// 서비스 트랙 — 온보딩 첫 단계에서 고른 것이 이후 화면 전체를 결정한다.
//
// 왜 나누는가
//   K-CARE 가 파는 것은 "시니어 케어"가 아니라 "혼자 하기 어려운 일에 사람이
//   함께 가는 것"이다. 어르신만 그런 것이 아니다 —
//     · 수면내시경·시술은 보호자가 없으면 아예 받을 수 없다
//     · 수술 후 2~4주만 도움이 필요한 사람이 있다
//     · 장애로 가정 방문이 필요한 사람이 있다
//     · 가사·심부름을 스스로 못 하는 사람이 있다
//   전부 같은 이유로 온다. 대상만 다르지 우리가 하는 일은 같다.
//
// 왜 코어는 안 나누는가
//   트랙이 달라도 우리가 지키는 것은 같다. 아래 CORE 는 모든 트랙에 그대로
//   적용되고 트랙별로 빼거나 줄이지 않는다. 이걸 빼면 우리는 심부름 중개와
//   같은 것이 되고, 그 시장에서는 가격으로만 싸우게 된다.
//
// 가격에 대해
//   확정된 것은 어르신 정기 케어(구독)뿐이다 (2026-08-01 방향성 회의).
//   나머지 세 트랙의 판매가는 정해진 적이 없다. 원가만 실측치가 있어서
//   그것만 적어 두고 confirmed:false 로 둔다. 임의로 채우지 않는다.

export const CORE = [
  { icon: "users", k: "위험한 자리에는 두 사람이", v: "첫 방문 · 종합평가처럼 객관성이 필요한 자리는 예외 없이 2인입니다. 어떤 방문이 몇 인인지 미리 알려 드립니다." },
  { icon: "list", k: "같은 기준으로 기록", v: "그때그때 다르게 적지 않습니다. 트랙마다 정해진 항목을 매번 같게 확인합니다." },
  { icon: "doc", k: "끝나면 리포트", v: "무엇을 했는지 남기고, 그 기록이 진짜인지 확인할 수 있습니다." },
  { icon: "shield", k: "24시간 사람이 받습니다", v: "새벽에도 사람이 받고 119 로 연결합니다." },
];

// 트랙 공통 — 판매 실적으로 평가하지 않는다는 원칙도 전 트랙 적용이다.
export const CORE_NOTE =
  "위 네 가지는 트랙과 무관하게 같습니다. 방문하는 사람을 판매 실적으로 평가하지 않는 것도 마찬가지입니다.";

export const TRACKS = [
  {
    id: "elder",
    short: "정기 케어",
    icon: "heart",
    ask: "부모님을 정기적으로 살펴봐 주세요",
    askSub: "아직 스스로 지내시지만, 달라지는 것을 먼저 알고 싶을 때",
    who: "요양등급을 받기 전, 스스로 지내시는 어르신",
    subject: "어르신",
    needsRelation: true,
    // 이 트랙만 결제권한 단계가 있다 — 어르신이 스토어에서 직접 담기 때문
    flow: ["track", "subject", "region", "payment", "plan", "done"],
    checkTitle: "매달 21항목",
    checkNote: "몸 7 · 마음 7 · 집 7 을 매달 같은 기준으로 확인하고 지난달과 무엇이 달라졌는지 적어 보냅니다.",
    billing: {
      kind: "subscription",
      label: "월 구독",
      confirmed: true,
      monthly: PRICING.subscription.monthly,
      entry: PRICING.entryFee.total,
      term: PRICING.subscription.term,
      note: "위약금 없이 언제든 해지",
    },
    home: {
      title: "오늘 어머니는",
      badge: "평소와 같음",
      line: "어제 잘 주무셨고, 아침 약도 챙겨 드셨습니다. 오후에 동네 한 바퀴 산책도 하셨어요.",
      foot: "숫자를 읽고 판단하는 일은 저희가 합니다. 한 줄이 초록이면 연락하지 않으셔도 됩니다.",
      blocks: ["weekly", "outing", "vitals", "feed", "assistant", "siblings"],
    },
    next: [
      ["전담 컨시어지 배정", "첫 방문은 2인 · 영업일 1일 이내"],
      ["사전 상담 콜", "30분 · 케어 프로필 구축"],
      ["첫 안심방문", "갤럭시 워치 · 안심케어박스 전달"],
    ],
  },
  {
    id: "escort",
    short: "병원 동행",
    icon: "hand",
    ask: "병원 갈 때 함께 가 주세요",
    askSub: "수면내시경·시술처럼 보호자가 있어야 받을 수 있는 진료를 포함합니다",
    who: "혼자 병원에 가기 어려운 분 · 보호자 동의가 필요한 시술을 앞둔 분",
    subject: "이용하실 분",
    needsRelation: false,
    flow: ["track", "subject", "region", "plan", "done"],
    checkTitle: "동행 12항목",
    checkNote: "출발 전 준비물·복약·금식 여부부터 귀가 후 상태까지 매번 같은 항목으로 확인하고 기록합니다.",
    billing: {
      kind: "ticket",
      label: "1회 · 회수권",
      confirmed: false,
      costBasis: PRICING.unitCost.escort,
      note: "판매가 미확정 — 원가 실측치만 있습니다. 다음 회의 안건",
    },
    home: {
      title: "다음 동행",
      badge: "준비 확인 중",
      line: "모레 오전 9시 20분 소화기내과 수면내시경. 전날 밤 9시부터 금식이고, 시술 후에는 혼자 귀가하실 수 없습니다.",
      foot: "보호자 동의가 필요한 시술은 동행자가 병원에서 직접 확인 절차를 밟습니다.",
      blocks: ["outing", "assistant"],
    },
    next: [
      ["동행 일정 확인", "진료 시각 · 금식 · 준비물 안내"],
      ["담당 배정", "프리미엄 2인 · 베이직 1인 · 출발지·도착지 2구간 확인"],
      ["귀가 후 기록 발송", "진료 내용 · 처방 · 다음 예약"],
    ],
  },
  {
    id: "recovery",
    short: "회복기 · 생활지원",
    icon: "activity",
    ask: "수술 후·장애로 생활이 어려워요",
    askSub: "몇 주 동안만 필요한 경우와, 계속 필요한 경우 모두",
    who: "수술 후 회복기에 있는 분 · 가정 방문 지원이 필요한 장애인",
    subject: "이용하실 분",
    needsRelation: false,
    flow: ["track", "subject", "region", "plan", "done"],
    checkTitle: "회복 14항목",
    checkNote: "상처·통증·복약·식사·이동·집안 위험 요소를 방문마다 같은 기준으로 확인합니다.",
    billing: {
      kind: "term",
      label: "기간제 (2주 · 4주)",
      confirmed: false,
      costBasis: PRICING.unitCost.homeVisit,
      note: "판매가 미확정 — 방문 1회 원가만 확정. 장애인 활동지원급여 연계 여부도 확인 전",
    },
    home: {
      title: "회복 12일차",
      badge: "경과 양호",
      line: "수술 부위 붓기가 지난주보다 줄었습니다. 통증약은 하루 2회로 줄이셨고, 어제부터 화장실까지 혼자 다니십니다.",
      foot: "회복 속도는 사람마다 다릅니다. 저희는 판단하지 않고 지난주와 무엇이 달라졌는지만 적습니다.",
      blocks: ["weekly", "outing", "vitals", "assistant"],
    },
    next: [
      ["필요 기간 확인", "퇴원일 · 회복 예상 기간 · 방문 주기"],
      ["담당 배정", "첫 방문은 2인 · 집안 위험 요소 점검"],
      ["주간 기록 발송", "회복 경과 · 다음 주 계획"],
    ],
  },
  {
    id: "errand",
    short: "생활 대행",
    icon: "bag",
    ask: "집안일·심부름이 필요해요",
    askSub: "장보기 · 관공서 · 짐 정리처럼 사람이 가야 되는 일",
    who: "가사·외출을 스스로 하기 어려운 분",
    subject: "이용하실 분",
    needsRelation: false,
    flow: ["track", "subject", "region", "plan", "done"],
    checkTitle: "요청 확인 4단계",
    checkNote: "요청 접수 · 출발 · 완료 · 사진 기록. 무엇을 얼마에 샀는지 영수증까지 남깁니다.",
    billing: {
      kind: "unit",
      label: "건별 · 시간제",
      confirmed: false,
      costBasis: null,
      note: "판매가 미확정. 이 트랙은 코어(기록·검증)를 지키면 단가가 시장가보다 높아집니다 — 그 차이를 무엇으로 설명할지가 먼저입니다",
    },
    home: {
      title: "요청하신 일",
      badge: "진행 중 1건",
      line: "오늘 오후 2시 장보기 요청을 접수했습니다. 담당자가 출발하면 알려 드리고, 끝나면 영수증과 사진을 함께 보내 드립니다.",
      foot: "무엇을 얼마에 샀는지 전부 남깁니다. 잔액은 다음 요청으로 이월하거나 돌려 드립니다.",
      blocks: ["feed"],
    },
    next: [
      ["요청 내용 확인", "무엇을 · 언제까지 · 예산"],
      ["담당 배정", "출발 알림 · 완료 사진"],
      ["완료 기록 발송", "사진 · 영수증 · 잔액"],
    ],
  },
];

export const DEFAULT_TRACK = "elder";
export const trackOf = (id) => TRACKS.find((t) => t.id === id) || TRACKS[0];

// 화면에서 이용자를 뭐라고 부를지. 정기 케어는 보호자가 보는 화면이라 "어머니"
// 같은 호칭이 맞지만, 본인이 신청한 병원 동행에서 "어머니"가 뜨면 그건 오류다.
export function subjectLabel(track, ob) {
  if (track.id !== "elder") return ob?.forSelf === false ? "이용자" : "본인";
  if (ob?.rel === "배우자") return "배우자";
  if (ob?.rel === "아들" || ob?.rel === "딸") return "어머니"; // 데모 기본 가구
  return "어르신";
}

// 온보딩 진행 표시에 쓰는 라벨
export const STEP_LABELS = {
  track: "필요한 것",
  subject: "이용자",
  region: "지역 확인",
  payment: "결제권한",
  plan: "요금 확인",
  done: "완료",
};
