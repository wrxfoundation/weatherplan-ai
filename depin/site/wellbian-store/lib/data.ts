/* 목데이터 + 타입 (PRD §7) — 실서버 연동 시 이 파일의 값을 API로 대체 */

export type SalePhase = "teaser" | "early_bird" | "general" | "sold_out" | "waitlist_open";

export interface Inventory {
  ebLeft: number;   // 표기 분모 1,000
  genLeft: number;  // 표기 분모 4,000
}

export interface Order {
  id: string;
  genesisNo: number;
  qty: number;
  unitPrice: number;
  tier: "eb" | "gen";
  txHash: string;
  status: "paid" | "preparing" | "shipped" | "done";
  paidAt: string;
}

export interface Device {
  genesisNo: number;
  status: "awaiting_redeem" | "active";
  uptime: string;
  verifiedCount: number;
  rewardWlbn: number;
  wifi: boolean;
}

export interface Mission {
  key: string;
  title: string;
  tickets: string;
  note: string;
  verify: "system" | "self" | "match";
  done: boolean;
}

export interface WaitlistMe {
  queueNo: number;
  tickets: number;
  score: number;
  expectedGroup: "S" | "A" | "B";
  percentile: number;
  missions: Mission[];
  inviteCode: string;
  invitedOk: number;
}

/* ── 목 재고 (기본: 판매 중) ── */
export const MOCK_INVENTORY: Record<SalePhase, Inventory> = {
  teaser: { ebLeft: 1000, genLeft: 4000 },
  early_bird: { ebLeft: 187, genLeft: 4000 },
  general: { ebLeft: 0, genLeft: 3412 },
  sold_out: { ebLeft: 0, genLeft: 0 },
  waitlist_open: { ebLeft: 0, genLeft: 0 },
};

export const PRICE = { eb: 450, gen: 650 } as const;

export function calc(inv: Inventory) {
  const remain = inv.ebLeft + inv.genLeft;
  const pct = Math.round(((5000 - remain) / 5000) * 100);
  const ebPct = Math.round(((1000 - inv.ebLeft) / 1000) * 100);
  const genPct = Math.round(((4000 - inv.genLeft) / 4000) * 100);
  return { remain, pct, ebPct, genPct };
}

export const fmt = (n: number) => n.toLocaleString("en-US");

/* ── 스펙 (＊ = 샘플, 인증서 기준 확정 예정) ── */
export const SPECS = [
  { k: "측정 항목", v: "CO₂ · 미세먼지(PM2.5/PM10) · 온도 · 습도 ＊" },
  { k: "모델명", v: "ARC-600DA" },
  { k: "크기 / 무게", v: "120 × 120 × 38 mm / 240 g ＊" },
  { k: "전원", v: "DC 5V USB-C — 월 전기료 1,000원 미만" },
  { k: "무선", v: "Wi-Fi 2.4 / 5 GHz" },
  { k: "설치", v: "벽걸이 · 탁상 겸용" },
  { k: "인증", v: "KC · 성능인증" },
];

export const FAQS = [
  { q: "가격이 어떻게 되나요?", a: "얼리버드 450 RLUSD(한정 수량), 이후 기본가 650 RLUSD입니다. 총 5,000대 한정 판매이며, 결제는 RLUSD로만 진행됩니다." },
  { q: "RLUSD는 어디서 구하나요?", a: "국내·해외 거래소에서 RLUSD를 구매한 뒤 XRPL 네트워크로 개인 지갑에 출금하면 됩니다. 출금 시 반드시 XRPL판 RLUSD를 선택하세요." },
  { q: "환불은 어떻게 되나요?", a: "제품 수령일부터 7일 이내 환불 가능합니다. 단, 리딤코드 사용 또는 노드 연동 시 환불이 제한됩니다(전자상거래법 제17조 제6항)." },
  { q: "설치가 어렵지 않나요?", a: "박스 안 리딤카드 QR로 시작해 지갑 연결, 코드 입력, Wi-Fi 연결까지 약 3분이면 완료됩니다. 벽걸이·탁상 모두 지원합니다." },
  { q: "지갑이 처음인데 괜찮나요?", a: "네. 등록 지갑 활성화(1 XRP)는 1회 지원됩니다(약관 제5조). 지갑 생성부터 연동까지 가이드를 제공합니다." },
  { q: "보상은 어떻게 지급되나요?", a: "측정 데이터가 검증되면 네트워크 원칙에 따라 WLBN이 지급됩니다. 지급량과 가치는 보장되지 않습니다." },
  { q: "전기료가 많이 나오나요?", a: "상시 가동 기준 월 전기료는 1,000원 미만입니다." },
  { q: "제품 보증 기간은요?", a: "구매일로부터 1년 무상 보증입니다. 자세한 조건은 이용약관을 참고하세요." },
];

export const LINK_STEPS = [
  { n: "1", t: "리딤카드 QR 스캔", d: "박스 안 카드의 QR로 등록 페이지 진입" },
  { n: "2", t: "지갑 연결", d: "처음이어도 가이드가 안내합니다" },
  { n: "3", t: "코드 입력", d: "리딤코드로 정품 확인" },
  { n: "4", t: "라이선스 NFT 발급", d: "제네시스 넘버가 영구 기록됩니다" },
  { n: "5", t: "Wi-Fi 연결", d: "노드 가동 시작 — 완료" },
];

export const RL_STEPS = [
  { n: "1", t: "거래소에서 RLUSD 구매", d: "국내·해외 거래소에서 RLUSD를 구매합니다" },
  { n: "2", t: "개인 지갑으로 출금", d: "XRPL 네트워크를 선택해 개인 지갑으로 출금합니다" },
  { n: "3", t: "이 페이지에서 결제", d: "지갑을 연결하고 Payment 서명으로 결제합니다" },
];

export const TIERS = [
  { n: "S", t: "응모권이 많을수록 잘 뽑히는 추첨 · 1,000명", d: "10/3 가장 먼저 구매하는 그룹 — 정원 고정", hot: true },
  { n: "A", t: "순번 점수가 높은 그룹", d: "추첨에서 떨어져도 점수 순서로 들어갑니다", hot: false },
  { n: "B", t: "순번 점수 일반 그룹", d: "떨어져도 완전히 잃지 않습니다", hot: false },
  { n: "일반", t: "대기 등록을 하지 않은 방문자", d: "10/3 마지막 순서로 열립니다", hot: false },
];

export const MISSIONS: Mission[] = [
  { key: "join", title: "대기 등록 완료", tickets: "+10장", note: "필수 · 가장 큰 배점", verify: "system", done: true },
  { key: "share", title: "소식 공유 — 공유 카드 발행", tickets: "+6장", note: "공유 링크로 자동 확인", verify: "system", done: true },
  { key: "community", title: "커뮤니티 참여 (텔레그램)", tickets: "+5장", note: "순번 점수 +20점 함께", verify: "system", done: true },
  { key: "invite", title: "친구 초대 — 성사 2명", tickets: "+10장", note: "5장/명 · 상한 10명 · 순번 점수 함께", verify: "system", done: true },
  { key: "daily", title: "매일 방문 — 오늘 출석", tickets: "+1장", note: "1장/일", verify: "system", done: true },
  { key: "x_follow", title: "X 팔로우", tickets: "+3장", note: "", verify: "self", done: true },
  { key: "kw_app", title: "케이웨더 앱 설치", tickets: "+5장", note: "", verify: "match", done: false },
  { key: "kw_youtube", title: "케이웨더 유튜브 구독", tickets: "+3장", note: "", verify: "self", done: false },
  { key: "kw_insta", title: "인스타그램 팔로우", tickets: "+2장", note: "", verify: "self", done: false },
];

export const VERIFY_LABEL: Record<Mission["verify"], string> = {
  system: "시스템 확인",
  self: "자진 체크",
  match: "가입 번호 대조",
};

export const SCORE_ROWS = [
  { t: "대기 등록", p: "100점" },
  { t: "구매 의사 표시", p: "20점" },
  { t: "커뮤니티 참여", p: "20점" },
  { t: "친구 초대 성사", p: "30점" },
];

export const MOCK_WAITLIST_ME: WaitlistMe = {
  queueNo: 2847,
  tickets: 35,
  score: 170,
  expectedGroup: "A",
  percentile: 18,
  missions: MISSIONS,
  inviteCode: "WB-INV-8271",
  invitedOk: 2,
};

export const MOCK_ORDER: Order = {
  id: "WB-260826-01234",
  genesisNo: 1234,
  qty: 20,
  unitPrice: 450,
  tier: "eb",
  txHash: "A3F8…C21E",
  status: "preparing",
  paidAt: "2026-08-26",
};

export const MOCK_DEVICE: Device = {
  genesisNo: 812,
  status: "active",
  uptime: "2일 14시간",
  verifiedCount: 3842,
  rewardWlbn: 128.4,
  wifi: true,
};

export const LINKS = {
  x: "https://x.com/wellbianlabs",
  telegram: "https://t.me/wellbianlabs",
};

/* 결제 파라미터 — Vercel 환경 변수로 교체 가능 (PRD §11), 미설정 시 목값 */
export const RECEIVE_ADDRESS = process.env.NEXT_PUBLIC_RECEIVE_ADDRESS ?? "rWLB9…kQ2f";
export const DEST_TAG = process.env.NEXT_PUBLIC_DEST_TAG ?? "908211";
export const XRPL_NETWORK = process.env.NEXT_PUBLIC_XRPL_NETWORK ?? "testnet"; // 실지갑 어댑터 연결 시 사용

/* 확정 설명 카피 (기획서 「화면에 쓰는 설명 문구」) */
export const COPY_TICKETS = "많을수록 가장 먼저 구매하는 그룹에 뽑힐 확률이 올라갑니다";
export const COPY_SCORE = "점수가 높을수록 먼저 구매하는 그룹에 들어갑니다";
export const COPY_DUAL =
  "점수는 확실하게 자리를 정하고, 응모권은 확률을 올립니다 — 추첨에서 떨어지셔도 점수는 그대로 남아 A 또는 B 그룹으로 이어집니다.";

/* 고지 문구 (필수 노출, PRD §6.5) */
export const NOTICE_SELF_CHECK =
  "팔로우·구독 미션의 완료 여부는 직접 체크하시는 방식이며, 사실과 다른 경우 해당 응모권은 인정되지 않습니다.";
export const NOTICE_ABUSE =
  "같은 기기나 같은 인터넷망에서 한 초대는 인정되지 않으며, 짧은 시간에 초대가 몰리면 잠시 보류 후 확인합니다.";
export const NOTICE_CARRYOVER =
  "1차 사전신청에서 모은 점수·응모권은 그대로 이어집니다. (1차에서 이미 구매하신 분께는 따로 안내드립니다.)";
export const NOTICE_REWARD = "지급량·가치는 보장되지 않습니다";
export const NOTICE_TICKET_CAP = "한 사람이 모을 수 있는 응모권에는 총량 상한이 있습니다.";
export const NOTICE_INVITE_VERIFY = "초대받은 분의 본인확인 완료 시 인정됩니다.";
