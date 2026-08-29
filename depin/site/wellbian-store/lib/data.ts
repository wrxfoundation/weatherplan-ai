/* 목데이터 + 타입 (PRD §7) — 실서버 연동 시 이 파일의 값을 API로 대체 */

export type SalePhase = "teaser" | "early_bird" | "general" | "sold_out" | "waitlist_open";

export interface Inventory {
  /* 누적 판매 대수. 8/28 회의에서 판매 수량 상한을 두지 않기로 해서
     잔여(ebLeft/genLeft)·소진율 개념이 통째로 사라졌다 — 사전예약 신청분이 곧 판매량이다. */
  sold: number;
}

export interface Order {
  id: string;              /* 내부 참조용 주문 ID — 구매자 확인 요소 아님 (8/27 개정) */
  /* 구매 확정 시 수량만큼 무작위 배정, 오름차순 정렬 저장 (8/27 확정).
     8/28 회의: 풀 상한(#1~5000)을 없앴다 — 1차에 팔린 만큼이 제네시스다.
     1 구글 계정당 최대 100대 — 대량 구매 시에도 기기마다 1개씩 배정 */
  genesisNos: number[];
  qty: number;
  unitPrice: number;
  /* 8/28 회의: 얼리버드 티어 폐기 — 1차 판매 전체가 first 가격, 2차부터 later */
  tier: "first" | "later";
  txHash: string;
  status: "paid" | "preparing" | "shipped" | "done";
  paidAt: string;
  /* 확인 2요소(8/27 개정) = 랜덤 배정된 제네시스 넘버(구매 내역) + 내 지갑 주소.
     내 지갑 = 구글 계정 가입 시 자동 생성되는 간편 지갑(비수탁, 약관 제5조).
     접수 폼 항목(대외 표기): 제네시스 넘버 · 내 지갑 주소 · 배송 정보('배송 정보' = 성함·연락처·
     배송지 뭉뚱 표기, 8/27 — web3 개인정보 거부감 완화. 실수집 항목은 폼에서만) — 배송 후 파기 */
  wallet: string;
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
/* 데모 전환용 목값. 상한이 없어졌으므로 숫자는 "지금까지 이만큼 팔렸다"는 뜻일 뿐,
   분모나 소진율은 없다. 실서버 연동 시 GET /api/inventory 가 sold 를 그대로 준다. */
export const MOCK_INVENTORY: Record<SalePhase, Inventory> = {
  teaser: { sold: 0 },
  early_bird: { sold: 813 },
  general: { sold: 1588 },
  sold_out: { sold: 5000 },
  waitlist_open: { sold: 5000 },
};

/* 8/28 회의: 얼리버드 티어를 없애고 1차 판매 전체를 450 으로, 2차부터 650 으로 올린다.
   키 이름의 eb/gen 은 폐기된 얼리버드 구조의 잔재라 first/later 로 바꿨다. */
export const PRICE = { first: 450, later: 650 } as const;

/* 상한이 없으니 잔여·소진율은 계산할 게 없다. 대외 표기도 누적 판매 대수 하나뿐이라
   래퍼만 남긴다 — 실서버로 바꿀 때 이 지점만 갈아끼우면 된다. */
export function calc(inv: Inventory) {
  return { sold: inv.sold };
}

export const fmt = (n: number) => n.toLocaleString("en-US");

/* ── 스펙 (공식 사양표 기준, 8/26 확정 — 모바일은 상위 5행 노출) ── */
export const SPECS = [
  { k: "측정 항목", v: "PM2.5 · PM10 · CO₂ · TVOC · 온도 · 습도 · 체감온도" },
  { k: "모델명", v: "ARC-600DA" },
  { k: "디스플레이", v: "5인치 풀터치 컬러 LCD" },
  { k: "전원", v: "12VDC · 300mA — 월 전기료 1,000원 미만" },
  { k: "통신 방식", v: "Wi-Fi · 블루투스 (802.11a/b/g/n)" },
  { k: "성능인증(정확도)", v: "CO₂ 1등급 · PM2.5 1등급" },
  { k: "측정 범위 / 분해능", v: "0~1,000㎍/m³ (PM2.5 기준) / 1㎍/m³" },
  { k: "유량", v: "0.1L/min" },
  { k: "측정 원리", v: "Light scattering laser photometer" },
  { k: "팬 수명", v: "32,000시간 (일반 환경)" },
  { k: "운영 온도", v: "−10 ~ 60°C" },
  { k: "제원 / 중량", v: "120(W) × 118(H) × 36(D) mm / 260g 이하" },
  { k: "재질", v: "ABS" },
  { k: "설치", v: "벽걸이 · 탁상 겸용" },
  { k: "인증", v: "KC · 성능인증" },
];

export const FAQS = [
  /* 8/28 서우 2차: 선착순 사전예약 → 추첨제 사전 구매응모. "자리 확보"·"선착순 걱정 없이"는
     추첨제에서 사실이 아니므로 답변을 다시 썼다.
     8/29 서우: 추첨 결과를 메일로 보낸다는 문장은 FAQ 에서 뺀다(통지 수단 미확정).
     응모 모달 3단계·완료 화면의 drawResult 에는 아직 남아 있다 — 서우 판단 대기. */
  { q: "사전 구매응모는 무엇인가요?", a: "결제가 아닙니다. 구글 로그인으로 응모할 대수를 정해두면, 추첨을 통해 9월 15일 오픈 당일 한정수량을 구매할 수 있는 권한을 드립니다. 1계정 최대 100대까지 설정할 수 있습니다." },
  { q: "응모하면 반드시 구매해야 하나요?", a: "아니요. 확정 주문이 아니며 응모 자체에 비용이 들지 않습니다. 추첨에 당첨되어 구매 권한을 받으신 뒤에도 실제 구매 여부와 수량은 자유롭게 정하시면 됩니다." },
  /* 8/28 서우 지정 문안 — 추첨 방식의 정의와 미구매 시 처리까지 한 문항에 담는다 */
  { q: "추첨은 어떤 방식인가요?", a: "제한된 수량을 공정하게 구매하기 위해, 신청자 중 추첨을 통해 당첨된 분에게만 구매 기회를 드리는 방식입니다. 당첨된 분만 정해진 기간 내에 제품을 구매할 수 있으며, 구매하지 않으면 해당 수량은 일반 구매로 넘어갑니다." },
  { q: "가격이 어떻게 되나요?", a: "1차 판매는 대당 450 RLUSD입니다. 2차 판매부터는 650 RLUSD로 적용됩니다. 결제는 RLUSD로만 진행됩니다." },
  { q: "RLUSD는 어디서 구하나요?", a: "국내·해외 거래소에서 RLUSD를 구매한 뒤 XRPL 네트워크로 개인 지갑에 출금하면 됩니다. 출금 시 반드시 XRPL판 RLUSD를 선택하세요." },
  { q: "지갑이 처음인데 괜찮나요?", a: "네. 구글 계정으로 가입하면 내 지갑이 자동으로 만들어집니다. 노드 연동까지 단계별 가이드를 제공합니다." },
  { q: "보상은 어떻게 지급되나요?", a: "측정 데이터가 검증되면 네트워크 원칙에 따라 WLBN이 지급됩니다. 지급량과 가치는 보장되지 않습니다." },
];

/* 기본 순서(8/27 서우 확정): 수령 → 블루투스 페어링 → Wi-Fi 연동이 선행, 그다음 리딤·NFT
   8/28 서우: "집 Wi-Fi" → "Wi-Fi" (가정 외 설치처도 포함 — 스텝·FAQ 동일 적용) */
export const LINK_STEPS: { n: string; t: string; d: string; d2?: string }[] = [
  { n: "1", t: "블루투스로 기기 연결", d: "전원을 켜고 스마트폰 블루투스로 기기를 인식합니다" },
  { n: "2", t: "Wi-Fi 연동", d: "연결된 기기에 Wi-Fi를 설정합니다 — 측정 시작" },
  { n: "3", t: "리딤카드 QR & 지갑 연결", d: "박스 안 카드의 QR로 등록 페이지 진입 — 처음이어도 안내합니다" },
  { n: "4", t: "코드 입력 & NFT 발급", d: "리딤코드로 정품 확인 — 노드 가동", d2: "제네시스 넘버가 영구 기록됩니다" },
];

export const RL_STEPS = [
  { n: "1", t: "거래소에서 RLUSD 구매", d: "국내·해외 거래소에서 RLUSD를 구매합니다" },
  { n: "2", t: "개인 지갑으로 출금", d: "XRPL 네트워크를 선택해 개인 지갑으로 출금합니다" },
  { n: "3", t: "이 페이지에서 결제", d: "지갑을 연결하고 Payment 서명으로 결제합니다" },
];

export const TIERS = [
  { n: "S", t: "응모권이 많을수록 잘 뽑히는 추첨 · 1,000명", d: "10/3 가장 먼저 구매 — 1인 최대 5대", hot: true },
  { n: "A", t: "순번 점수 140점 이상", d: "등록 + 구매 의사 + 커뮤니티면 도달 — 기준은 바뀌지 않습니다", hot: false },
  { n: "B", t: "140점 미만 등록자", d: "B 몫 최소 1,000대를 남겨 둡니다 — 그룹 안 선착순", hot: false },
  { n: "일반", t: "대기 등록을 하지 않은 방문자", d: "10/3 마지막 순서로 열립니다", hot: false },
];

export const MISSIONS: Mission[] = [
  { key: "join", title: "대기 등록 완료", tickets: "+10장", note: "필수 · 가장 큰 배점", verify: "system", done: true },
  { key: "share", title: "소식 공유 — 공유 카드 발행", tickets: "+6장", note: "공유 링크로 자동 확인", verify: "system", done: true },
  { key: "community", title: "wellbian 커뮤니티 참여 (텔레그램)", tickets: "+5장", note: "순번 점수 +20점 함께", verify: "system", done: true },
  { key: "invite", title: "친구 초대 — 성사 2명", tickets: "+10장", note: "5장/명 · 상한 10명 · 순번 점수 함께", verify: "system", done: true },
  { key: "daily", title: "매일 방문 — 오늘 출석", tickets: "+1장", note: "1장/일", verify: "system", done: true },
  { key: "x_follow", title: "wellbian X 팔로우", tickets: "+3장", note: "", verify: "self", done: true },
  { key: "kw_app", title: "KWEATHER 앱 설치", tickets: "+5장", note: "", verify: "match", done: false },
  { key: "kw_youtube", title: "KWEATHER 유튜브 구독", tickets: "+3장", note: "", verify: "self", done: false },
  { key: "kw_insta", title: "KWEATHER 인스타그램 팔로우", tickets: "+2장", note: "", verify: "self", done: false },
];

export const VERIFY_LABEL: Record<Mission["verify"], string> = {
  system: "시스템 확인",
  self: "자진 체크",
  match: "가입 번호 대조",
};

export const SCORE_ROWS = [
  { t: "대기 등록", p: "100점" },
  { t: "구매 의사 표시", p: "20점" },
  { t: "wellbian 커뮤니티 참여", p: "20점" },
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
  /* 주문 ID = 내부 참조·URL 키 (확인 요소 아님 — 확인은 제네시스 넘버 + 내 지갑 주소) */
  id: "WB-9X4K-Q72M",
  genesisNos: [214, 387, 559, 823, 1041, 1288, 1476, 1690, 1923, 2205, 2531, 2764, 2988, 3217, 3444, 3671, 3856, 4102, 4388, 4677],
  qty: 20,
  unitPrice: 650,
  tier: "first",
  txHash: "A3F8…C21E",
  status: "preparing",
  paidAt: "2026-08-26",
  wallet: "rWLB9…kQ2f",
};

export const MOCK_DEVICE: Device = {
  genesisNo: 812,
  status: "active",
  uptime: "2일 14시간",
  verifiedCount: 3842,
  rewardWlbn: 128.4,
  wifi: true,
};

/* 사전예약 누적 목값 (8/27 — teaser/dday 시뮬레이션용) */
export const MOCK_PRENOTIFY = 3847;

/* 사전 구매응모 실시간 현황 mock 피드 (8/27) — 내부 지갑 앞자리+마스킹 · 응모 시각 · 대수.
   응모는 구매가 아니라 제네시스 넘버와 무관 (넘버는 정식 구매 시 배정).
   8/28 회의로 수량 캡 자체가 없어졌다 */
export const PREORDER_FEED: { w: string; t: string; q: number }[] = [
  { w: "r9fK", t: "21:04:32", q: 3 }, { w: "rB2x", t: "21:03:58", q: 10 }, { w: "rQm7", t: "21:03:41", q: 1 },
  { w: "rXw3", t: "21:02:55", q: 5 }, { w: "rL8d", t: "21:02:19", q: 2 }, { w: "rTn6", t: "21:01:47", q: 20 },
  { w: "rHs2", t: "21:01:12", q: 1 }, { w: "rGp9", t: "21:00:36", q: 8 }, { w: "rVz5", t: "20:59:54", q: 3 },
  { w: "rJc4", t: "20:59:21", q: 100 }, { w: "rNe8", t: "20:58:47", q: 2 }, { w: "rDf1", t: "20:58:03", q: 5 },
  { w: "rPk6", t: "20:57:29", q: 1 }, { w: "rZy7", t: "20:56:50", q: 15 }, { w: "rMw2", t: "20:56:08", q: 4 },
  { w: "rCq3", t: "20:55:33", q: 2 }, { w: "rEb9", t: "20:54:57", q: 30 }, { w: "rUj5", t: "20:54:14", q: 1 },
  { w: "rAh8", t: "20:53:39", q: 6 }, { w: "rSx4", t: "20:52:51", q: 2 },
  /* 8/28 서우: 현황판 3열 전환 — 열 수의 배수라야 -50% 루프 경계가 행에 맞아 30개로 확장 */
  { w: "rKt7", t: "20:52:10", q: 4 }, { w: "rFm2", t: "20:51:33", q: 12 }, { w: "rYw8", t: "20:50:58", q: 1 },
  { w: "rPb5", t: "20:50:21", q: 7 }, { w: "rNc1", t: "20:49:47", q: 25 }, { w: "rDx6", t: "20:49:05", q: 2 },
  { w: "rLg3", t: "20:48:32", q: 50 }, { w: "rWq9", t: "20:47:56", q: 3 }, { w: "rBh4", t: "20:47:19", q: 9 },
  { w: "rTs7", t: "20:46:40", q: 1 },
];

export const LINKS = {
  x: "https://x.com/wellbianlabs",
  telegram: "https://t.me/wellbianlabs",
  /* 약관은 플랫폼 메인 사이트 TERMS로 통합 (8/27 서우 결정 — 별도 문서 없이 단일 링크) */
  terms: "https://wlbn.wellbianlabs.io/terms",
  /* 8/28 회의: "맨 밑 주체를 많이 본다" → 푸터 로고를 각 홈페이지로 연결한다 */
  wellbian: "https://wlbn.wellbianlabs.io",
  xrpl: "https://xrpl.org",
  kweather: "https://kweather.co.kr",
};

/* 결제 파라미터 — Vercel 환경 변수로 교체 가능 (PRD §11), 미설정 시 목값 */
export const RECEIVE_ADDRESS = process.env.NEXT_PUBLIC_RECEIVE_ADDRESS ?? "rWLB9…kQ2f";
export const DEST_TAG = process.env.NEXT_PUBLIC_DEST_TAG ?? "908211";
export const XRPL_NETWORK = process.env.NEXT_PUBLIC_XRPL_NETWORK ?? "testnet"; // 실지갑 어댑터 연결 시 사용

/* 확정 설명 카피 (기획서 「화면에 쓰는 설명 문구」) */
/* 2차 이벤트(대기·미션·응모권) 전체 HIDE — 소식 채널만 운영 (8/26 내부 결정).
   코드·설계는 보존: 재개 시 이 플래그만 true로. */
export const WAITLIST_ENABLED = false;

/* B그룹 리저브 — 그룹 몫 최소 보장 물량 (부스 물량 연동 조정은 내부 정책, 공표 후 하향 금지) */
export const B_RESERVE = 1000;

/* A그룹 컷라인 — 사전 고정 공표, 마감까지 불변 (분쟁 차단) */
export const A_CUTLINE = 140;

export const COPY_TICKETS = "많을수록 가장 먼저 구매하는 그룹에 뽑힐 확률이 올라갑니다";
export const COPY_SCORE = "점수가 높을수록 먼저 구매하는 그룹에 들어갑니다";
export const COPY_DUAL =
  "점수는 확실하게 자리를 정하고, 응모권은 확률을 올립니다 — 추첨에서 떨어지셔도 점수는 그대로 남아 A 또는 B 그룹으로 이어집니다.";

/* 고지 문구 (필수 노출, PRD §6.5) */
export const NOTICE_SELF_CHECK =
  "팔로우·구독 미션의 완료 여부는 직접 체크하시는 방식이며, 사실과 다른 경우 해당 응모권은 인정되지 않습니다.";
export const NOTICE_ABUSE =
  "같은 기기나 같은 인터넷망에서 한 초대는 인정되지 않으며, 짧은 시간에 초대가 몰리면 잠시 보류 후 확인합니다.";
export const NOTICE_REWARD = "지급량·가치는 보장되지 않습니다";
export const NOTICE_TICKET_CAP = "한 사람이 모을 수 있는 응모권에는 총량 상한이 있습니다.";
export const NOTICE_INVITE_VERIFY = "초대받은 분의 본인확인 완료 시 인정됩니다.";

/* ── EN 카피 (KO/EN 토글, PRD §5.4) — 배열 구조는 KO와 1:1 대응 ── */

export const NOTICE_REWARD_EN = "Amounts and value are not guaranteed";

export const SPECS_EN = [
  { k: "Measurements", v: "PM2.5 · PM10 · CO₂ · TVOC · Temperature · Humidity · Feels-like temp" },
  { k: "Model", v: "ARC-600DA" },
  { k: "Display", v: "5-inch full-touch color LCD" },
  { k: "Power", v: "12VDC · 300mA — under ₩1,000/month in electricity" },
  { k: "Connectivity", v: "Wi-Fi · Bluetooth (802.11a/b/g/n)" },
  { k: "Certified accuracy", v: "CO₂ Grade 1 · PM2.5 Grade 1" },
  { k: "Range / resolution", v: "0–1,000㎍/m³ (PM2.5) / 1㎍/m³" },
  { k: "Flow rate", v: "0.1 L/min" },
  { k: "Method", v: "Light-scattering laser photometer" },
  { k: "Fan life", v: "32,000 hours (typical use)" },
  { k: "Operating temp", v: "−10 to 60°C" },
  { k: "Dimensions / weight", v: "120(W) × 118(H) × 36(D) mm / under 260 g" },
  { k: "Housing", v: "ABS" },
  { k: "Mounting", v: "Wall or desktop" },
  { k: "Certifications", v: "KC · Performance certification" },
];

export const FAQS_EN = [
  { q: "What is a pre-purchase entry?", a: "It is not a payment. Sign in with Google and set how many units you want; a draw then grants the right to buy from the limited quantity when sales open on Sept 15. Up to 100 units per account." },
  { q: "Does an entry commit me to buying?", a: "No. It is not a confirmed order and costs nothing. Even after the draw grants you the right to buy, the actual quantity is yours to decide." },
  { q: "How does the draw work?", a: "To keep a limited quantity fair, a draw among entrants grants the chance to buy to selected participants only. Winners can purchase within a set window; any unbought units are released to general sale." },
  { q: "How much does it cost?", a: "450 RLUSD per unit in the first batch. From the second batch the price is 650 RLUSD. Payment is in RLUSD only." },
  { q: "Where do I get RLUSD?", a: "Buy RLUSD on a domestic or global exchange, then withdraw it to your personal wallet over the XRPL network. Always select the XRPL version of RLUSD when withdrawing." },
  { q: "I've never used a wallet. Is that okay?", a: "Yes. Signing up with your Google account creates your wallet automatically, and a step-by-step guide walks you through node linking." },
  { q: "How are rewards paid?", a: "When your measurements are verified, WLBN is paid under network rules. Amounts and value are not guaranteed." },
];

/* 전체 FAQ 확장분 15문항 — 기본 8문항과 합쳐 23문항 (8/27, 접기/펴기 인라인 확장) */
export const FAQS_EXTRA = [
  { q: "결제는 왜 RLUSD로만 하나요?", a: "RLUSD는 미국 달러와 1:1로 연동되는 스테이블코인이라 가격 변동 걱정 없이 결제할 수 있습니다. 리플(Ripple)이 발행하고 뉴욕 금융감독청(NYDFS)의 규제를 받습니다." },
  { q: "몇 대까지 구매할 수 있나요?", a: "구글 계정 1개당 최대 100대까지 구매할 수 있습니다. 대량 구매 시에도 기기마다 제네시스 넘버가 하나씩 배정됩니다." },
  { q: "응모 대수와 실제 구매 수량이 달라도 되나요?", a: "네. 추첨으로 부여되는 구매 권한 범위 안에서 오픈 때 더 적게 사셔도 됩니다. 계정당 상한(100대)만 지키면 됩니다." },
  { q: "제네시스 넘버가 뭔가요?", a: "구매가 확정될 때 무작위로 배정되는 제네시스 노드 고유 번호입니다. 여러 대를 구매하면 수량만큼 배정되고, 주문 내역에서 정렬된 목록으로 확인·복사할 수 있습니다. 라이선스 NFT에 영구 기록됩니다." },
  { q: "라이선스 NFT는 뭔가요?", a: "기기의 정품과 참여 자격을 증명하는 XRPL 기반 증서입니다. 박스 안 리딤코드로 발급받으며, 이 NFT를 보유한 기기만 보상 대상이 됩니다." },
  { q: "배송은 언제, 어떻게 받나요?", a: "11월 중 순차 배송 예정입니다. 발송 2주 전부터 공식 텔레그램·X로 배송 접수 폼을 안내하며, 폼에 제네시스 넘버·내 지갑 주소·배송 정보를 입력하면 순서대로 발송됩니다." },
  { q: "배정된 제네시스 넘버는 어디서 확인하나요?", a: "구글 계정으로 로그인하면 주문 내역에서 정렬된 넘버 목록을 언제든 확인하고 복사할 수 있습니다." },
  { q: "사이트가 저장하는 개인정보는 뭔가요?", a: "구글 계정 로그인만 사용하며, 별도의 개인정보는 저장하지 않습니다. 가입하면 내 지갑이 자동으로 만들어지고, 배송 정보는 발송 전 접수 폼에서만 받아 배송이 끝나면 파기합니다." },
];

export const FAQS_EXTRA_EN = [
  { q: "Why is payment RLUSD-only?", a: "RLUSD is a stablecoin pegged 1:1 to the US dollar, so you can pay without worrying about price swings. It is issued by Ripple and regulated by the NYDFS." },
  { q: "How many units can I buy?", a: "Up to 100 units per Google account. Even on bulk orders, each device gets its own Genesis Number." },
  { q: "Can the entered quantity differ from what I actually buy?", a: "Yes. Within the right to buy granted by the draw you can take fewer units when sales open — the per-account cap of 100 units is the only limit." },
  { q: "What is a Genesis Number?", a: "A unique genesis-node number randomly assigned when your purchase is confirmed. Buy multiple units and you get one per device — viewable as a sorted, copyable list in your order history. Permanently recorded on your license NFT." },
  { q: "What is the license NFT?", a: "An XRPL-based certificate proving your device is genuine and eligible to participate. It is minted with the redeem code inside the box, and only devices holding this NFT earn rewards." },
  { q: "When and how does shipping work?", a: "Units are expected to ship sequentially through November. Starting 2 weeks before dispatch, we announce the shipping form on our official Telegram and X — enter your Genesis Numbers, your wallet address, and shipping details, and units ship in order." },
  { q: "Where do I find my assigned Genesis Numbers?", a: "Sign in with your Google account — your order history shows the sorted list, ready to copy, anytime." },
  { q: "What personal data does this site store?", a: "Only Google sign-in — nothing else is stored. Signing up creates your wallet automatically, and delivery details are collected only via the pre-shipping form, then deleted after delivery." },
];

export const LINK_STEPS_EN: { n: string; t: string; d: string; d2?: string }[] = [
  { n: "1", t: "Pair the device via Bluetooth", d: "Power on and detect the device with your phone's Bluetooth" },
  { n: "2", t: "Connect it to Wi-Fi", d: "Set up Wi-Fi on the paired device — measurement starts" },
  { n: "3", t: "Scan the redeem card QR & connect a wallet", d: "The card inside the box opens the registration page — guided even for first-timers" },
  { n: "4", t: "Enter the code & mint your NFT", d: "The redeem code verifies authenticity — your node goes live", d2: "Your Genesis Number is recorded permanently" },
];

export const RL_STEPS_EN = [
  { n: "1", t: "Buy RLUSD on an exchange", d: "Purchase RLUSD on a domestic or global exchange" },
  { n: "2", t: "Withdraw to your own wallet", d: "Choose the XRPL network and withdraw to your personal wallet" },
  { n: "3", t: "Pay on this page", d: "Connect your wallet and sign the Payment to check out" },
];
