/* 반응 축적 (9/2 서우 — "댓글을 쓴다는 게 아니라 반응들을 축적해 놓으란 거지")

   depin/intel/reaction-log.md 의 화면판. 남의 말을 원문 그대로 쌓는다 — 어떤 문장이 되받아지는지,
   어떤 오해가 반복되는지, 계정 유형별로 무엇에 반응하는지를 보기 위한 자료다.
   판정(붙는다/패스)은 여기 없다. 여기 SEED 는 파일에서 옮긴 시작값이고, 그 뒤로 서우가 화면에서
   붙이는 반응은 lib/store.ts 의 rx:items 에 쌓인다. */

export type RxAcct = "pod" | "community" | "builder" | "kol" | "partner" | "official" | "rival";
export type RxKind = "echo" | "agree" | "question" | "critic" | "misread" | "price" | "accept";
export type RxAction = "none" | "like" | "reply" | "correct";

export type Reaction = {
  id: string;
  at: number;          // 기록 시각(ms) — 같은 날 안의 순서
  date: string;        // 반응이 달린 날 YYYY-MM-DD (KST)
  post: string;        // 우리 쪽 어느 글에 달렸나
  handle: string;      // @ 없이
  acct: RxAcct;
  text: string;        // 원문 그대로
  kind: RxKind;
  action: RxAction;
  echoOf?: string;     // 되받은 우리 문장 (kind = echo)
  note?: string;
  translated?: boolean; // X 가 번역해 보여준 것 — 원문 확인 전
};

export const ACCTS: { key: RxAcct; label: string; hint: string }[] = [
  { key: "pod", label: "팟", hint: "한 줄 상투구·인게이지먼트 팟" },
  { key: "community", label: "커뮤니티", hint: "일반 계정" },
  { key: "builder", label: "빌더", hint: "만드는 사람" },
  { key: "kol", label: "KOL", hint: "인플루언서·캠페인 계정" },
  { key: "partner", label: "파트너", hint: "디센트·플레어 등" },
  { key: "official", label: "공식", hint: "재단·기업 공식 계정" },
  { key: "rival", label: "경쟁사", hint: "파트너의 경쟁사 포함" },
];
export const KINDS: { key: RxKind; label: string; hint: string }[] = [
  { key: "echo", label: "되받기", hint: "우리 문장을 그대로 인용" },
  { key: "agree", label: "공감", hint: "좋다·기대된다" },
  { key: "question", label: "질문", hint: "정확한 질문" },
  { key: "critic", label: "비판", hint: "회의·반론" },
  { key: "misread", label: "오해", hint: "수익·리플 관계 등 사실과 다른 프레임" },
  { key: "price", label: "가격", hint: "티커·시세 언급" },
  { key: "accept", label: "승인", hint: "우리 정정을 받아들임" },
];
export const ACTIONS: { key: RxAction; label: string }[] = [
  { key: "none", label: "무반응" },
  { key: "like", label: "좋아요" },
  { key: "reply", label: "답글" },
  { key: "correct", label: "정정" },
];

export const acctLabel = (a: RxAcct) => ACCTS.find((x) => x.key === a)?.label ?? a;
export const kindLabel = (k: RxKind) => KINDS.find((x) => x.key === k)?.label ?? k;
export const actionLabel = (a: RxAction) => ACTIONS.find((x) => x.key === a)?.label ?? a;

/* 우리 문장 — 되받기 집계의 기준. 새 시그니처가 생기면 여기 더한다(플레이북 「인용문 제조법」). */
export const OUR_LINES = [
  "Wallet first, rewards later. That's the order.",
  "Account economics is onboarding economics.",
  "The incentive that installs the sensor decides what the data is worth.",
  "Identity outlives the incident.",
  "Most of crypto moves value that already exists. We make the record that didn't exist until someone measured it.",
  "You can only move what exists.",
  "Verification is the value.",
  "The map ends at the front door.",
];

export const RX_UPDATED = "2026-09-02";

const t = (s: string) => Date.parse(s);
const KOL = "@ifureJack 디센트 MOU 인용 → 우리 정정 답글 스레드";
const DC = "우리 디센트 공지 스레드(고정)";

/* 9/2 시작값 — reaction-log.md 와 같은 내용. id 가 s- 로 시작하면 파일에서 온 것이라 화면에서 못 지운다. */
export const SEED: Reaction[] = [
  { id: "s-0902-01", at: t("2026-09-02T14:40:00+09:00"), date: "2026-09-02", post: KOL, handle: "ifureJack", acct: "kol",
    text: "Noted", kind: "accept", action: "none", note: "우리 정정(하드웨어 실물 · 보상 in testing)에 대한 답" },
  { id: "s-0902-02", at: t("2026-09-02T19:20:00+09:00"), date: "2026-09-02", post: KOL, handle: "Fahim_510", acct: "pod",
    text: "Wallet first, rewards later. That's the order.", kind: "echo", action: "like",
    echoOf: "Wallet first, rewards later. That's the order.", note: "우리 정정 답글 문장 그대로 — 6시간 안" },
  { id: "s-0902-03", at: t("2026-09-02T20:10:00+09:00"), date: "2026-09-02", post: KOL, handle: "remonnyy", acct: "pod",
    text: "Data you can trust, rewards you can earn.", kind: "misread", action: "none",
    note: "KOL 문장 반복 — 수익 프레임 에코. 원글 1회 정정 원칙, 에코는 둔다" },
  { id: "s-0902-04", at: t("2026-09-02T19:30:00+09:00"), date: "2026-09-02", post: KOL, handle: "captainsilv3r", acct: "pod",
    text: "Trusted data makes DePIN far more useful", kind: "agree", action: "none" },
  { id: "s-0902-05", at: t("2026-09-02T20:30:00+09:00"), date: "2026-09-02", post: KOL, handle: "Samuelsimonsun1", acct: "pod",
    text: "Good posts don't always need to be long. This is proof.", kind: "agree", action: "none" },
  { id: "s-0902-06", at: t("2026-09-02T19:50:00+09:00"), date: "2026-09-02", post: KOL, handle: "Bobbybright759", acct: "pod",
    text: "$XRP is my attention token", kind: "price", action: "none" },
  { id: "s-0902-07", at: t("2026-09-02T17:40:00+09:00"), date: "2026-09-02", post: KOL, handle: "hey_Riaz", acct: "pod",
    text: "Definitely interested in seeing the next step.", kind: "agree", action: "none" },
  { id: "s-0902-08", at: t("2026-09-02T20:25:00+09:00"), date: "2026-09-02", post: KOL, handle: "Babak_TS", acct: "pod",
    text: "This makes a lot of sense.", kind: "agree", action: "none" },
  { id: "s-0902-09", at: t("2026-09-02T19:25:00+09:00"), date: "2026-09-02", post: KOL, handle: "SantoXBT", acct: "pod",
    text: "real world data could unlock DePIN at scale", kind: "agree", action: "none" },
  { id: "s-0902-10", at: t("2026-09-02T19:45:00+09:00"), date: "2026-09-02", post: KOL, handle: "MadMagicSOL", acct: "pod",
    text: "Weather DePIN's looking fresh", kind: "agree", action: "none" },
  { id: "s-0902-11", at: t("2026-09-02T19:35:00+09:00"), date: "2026-09-02", post: KOL, handle: "nguyenthambt", acct: "pod",
    text: "Exciting to see DePIN in action!", kind: "agree", action: "none" },
  { id: "s-0902-12", at: t("2026-09-02T19:28:00+09:00"), date: "2026-09-02", post: KOL, handle: "Bency1749379", acct: "pod",
    text: "Really love what they're building. Excited to see what's next", kind: "agree", action: "none" },
  { id: "s-0902-13", at: t("2026-09-02T19:40:00+09:00"), date: "2026-09-02", post: KOL, handle: "hoodsher55", acct: "pod",
    text: "이는 XRP 생태계 전반에 걸쳐 실세계 데이터의 활용성을 확장할 수 있습니다", kind: "agree", action: "none", translated: true },
  { id: "s-0902-14", at: t("2026-09-02T20:28:00+09:00"), date: "2026-09-02", post: KOL, handle: "BoyNav_", acct: "pod",
    text: "Solid ecosystem", kind: "agree", action: "none" },
  { id: "s-0902-15", at: t("2026-09-02T18:40:00+09:00"), date: "2026-09-02", post: KOL, handle: "arian_c63", acct: "pod",
    text: "amazing move bringing weather data into XRP ecosystem", kind: "agree", action: "none" },
  { id: "s-0902-16", at: t("2026-09-02T12:30:00+09:00"), date: "2026-09-02", post: DC, handle: "Magne_Ai", acct: "community",
    text: "센서가 현장에 있었는지·스푸핑이 아닌지 증명하는 검증 레이어에서 파트너십이 멈춘다 (요지 — 원문은 x-activity-log 9/2)",
    kind: "critic", action: "reply", note: "동의 + 인증 하드웨어·30년 관측망 대조 + in testing (273자). 10/3 데이터 한 장이 답해야 할 질문" },
  { id: "s-0902-17", at: t("2026-09-02T16:10:00+09:00"), date: "2026-09-02", post: DC, handle: "era_wallet", acct: "rival",
    text: "Build the wallet properly first, then layer rewards… keeps the product promise clear", kind: "agree", action: "like",
    note: "디센트 경쟁 지갑사 — 파트너 경쟁사라 좋아요까지만" },
];
