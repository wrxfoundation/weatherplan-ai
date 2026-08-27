/* 목데이터 + 타입 (PRD §7) — 실서버 연동 시 이 파일의 값을 API로 대체 */

export type SalePhase = "teaser" | "early_bird" | "general" | "sold_out" | "waitlist_open";

export interface Inventory {
  ebLeft: number;   // 표기 분모 1,000
  genLeft: number;  // 표기 분모 4,000
}

export interface Order {
  id: string;              /* 내부 참조용 주문 ID — 구매자 확인 요소 아님 (8/27 개정) */
  /* 구매 확정 시 #1~5000 풀에서 수량만큼 무작위 배정, 오름차순 정렬 저장 (8/27 확정).
     1 구글 계정당 최대 100대 — 대량 구매 시에도 기기마다 1개씩 배정 */
  genesisNos: number[];
  qty: number;
  unitPrice: number;
  tier: "eb" | "gen";
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
  { q: "가격이 어떻게 되나요?", a: "대당 650 RLUSD입니다. 결제는 RLUSD로만 진행됩니다." },
  { q: "RLUSD는 어디서 구하나요?", a: "국내·해외 거래소에서 RLUSD를 구매한 뒤 XRPL 네트워크로 개인 지갑에 출금하면 됩니다. 출금 시 반드시 XRPL판 RLUSD를 선택하세요." },
  { q: "환불은 어떻게 되나요?", a: "제품 수령일부터 7일 이내 환불 가능합니다. 단, 리딤코드 사용 또는 노드 연동 시 환불이 제한됩니다(전자상거래법 제17조 제6항)." },
  { q: "설치가 어렵지 않나요?", a: "전원을 켠 뒤 스마트폰 블루투스로 기기를 연결해 집 Wi-Fi를 설정하는 것이 첫 순서입니다. 그다음 박스 안 리딤카드 QR로 지갑 연결·코드 입력까지 약 3분이면 완료됩니다. 벽걸이·탁상 모두 지원합니다." },
  { q: "지갑이 처음인데 괜찮나요?", a: "네. 구글 계정으로 가입하면 내 지갑이 자동으로 만들어집니다. 지갑 활성화(1 XRP)는 1회 지원되며(약관 제5조), 연동까지 가이드를 제공합니다." },
  { q: "보상은 어떻게 지급되나요?", a: "측정 데이터가 검증되면 네트워크 원칙에 따라 WLBN이 지급됩니다. 지급량과 가치는 보장되지 않습니다." },
  { q: "전기료가 많이 나오나요?", a: "상시 가동 기준 월 전기료는 1,000원 미만입니다." },
  { q: "제품 보증 기간은요?", a: "구매일로부터 1년 무상 보증입니다. 자세한 조건은 이용약관을 참고하세요." },
];

/* 기본 순서(8/27 서우 확정): 수령 → 블루투스 페어링 → 집 Wi-Fi 연동이 선행, 그다음 리딤·NFT */
export const LINK_STEPS: { n: string; t: string; d: string; d2?: string }[] = [
  { n: "1", t: "블루투스로 기기 연결", d: "전원을 켜고 스마트폰 블루투스로 기기를 인식합니다" },
  { n: "2", t: "집 Wi-Fi 연동", d: "연결된 기기에 집 Wi-Fi를 설정합니다 — 측정 시작" },
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
  tier: "gen",
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

/* 사전예약 실시간 현황 mock 피드 (8/27) — 내부 지갑 앞자리+마스킹 · 예약 시각 · 대수.
   사전예약은 수요 파악·룸 확보 단계라 5,000 캡·제네시스 넘버와 무관 (넘버는 정식 구매 시 배정) */
export const PREORDER_FEED: { w: string; t: string; q: number }[] = [
  { w: "r9fK", t: "21:04:32", q: 3 }, { w: "rB2x", t: "21:03:58", q: 10 }, { w: "rQm7", t: "21:03:41", q: 1 },
  { w: "rXw3", t: "21:02:55", q: 5 }, { w: "rL8d", t: "21:02:19", q: 2 }, { w: "rTn6", t: "21:01:47", q: 20 },
  { w: "rHs2", t: "21:01:12", q: 1 }, { w: "rGp9", t: "21:00:36", q: 8 }, { w: "rVz5", t: "20:59:54", q: 3 },
  { w: "rJc4", t: "20:59:21", q: 100 }, { w: "rNe8", t: "20:58:47", q: 2 }, { w: "rDf1", t: "20:58:03", q: 5 },
  { w: "rPk6", t: "20:57:29", q: 1 }, { w: "rZy7", t: "20:56:50", q: 15 }, { w: "rMw2", t: "20:56:08", q: 4 },
  { w: "rCq3", t: "20:55:33", q: 2 }, { w: "rEb9", t: "20:54:57", q: 30 }, { w: "rUj5", t: "20:54:14", q: 1 },
  { w: "rAh8", t: "20:53:39", q: 6 }, { w: "rSx4", t: "20:52:51", q: 2 },
];

export const LINKS = {
  x: "https://x.com/wellbianlabs",
  telegram: "https://t.me/wellbianlabs",
  /* 약관은 플랫폼 메인 사이트 TERMS로 통합 (8/27 서우 결정 — 별도 문서 없이 단일 링크) */
  terms: "https://wlbn.wellbianlabs.io/terms",
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
  { q: "How much does it cost?", a: "650 RLUSD per unit. Payment is in RLUSD only." },
  { q: "Where do I get RLUSD?", a: "Buy RLUSD on a domestic or global exchange, then withdraw it to your personal wallet over the XRPL network. Always select the XRPL version of RLUSD when withdrawing." },
  { q: "What is the refund policy?", a: "Refunds are available within 7 days of receiving the product. Refunds are restricted once the redeem code is used or the node is linked (Korean E-Commerce Act, Art. 17-6)." },
  { q: "Is setup difficult?", a: "First, power on and pair the device via Bluetooth to set up your home Wi-Fi. Then scan the redeem card QR in the box for wallet connection and code entry — about 3 minutes in total. Wall and desktop mounting are both supported." },
  { q: "I've never used a wallet. Is that okay?", a: "Yes. Signing up with your Google account creates your wallet automatically. One-time activation (1 XRP) is covered (Terms, Art. 5), and the guide walks you through node linking." },
  { q: "How are rewards paid?", a: "When your measurements are verified, WLBN is paid under network rules. Amounts and value are not guaranteed." },
  { q: "How much electricity does it use?", a: "Running around the clock costs under ₩1,000 a month." },
  { q: "What about warranty?", a: "One year of free warranty from the purchase date. See the Terms of Service for details." },
];

/* 전체 FAQ 확장분 15문항 — 기본 8문항과 합쳐 23문항 (8/27, 접기/펴기 인라인 확장) */
export const FAQS_EXTRA = [
  { q: "결제는 왜 RLUSD로만 하나요?", a: "RLUSD는 미국 달러와 1:1로 연동되는 스테이블코인이라 가격 변동 걱정 없이 결제할 수 있습니다. 리플(Ripple)이 발행하고 뉴욕 금융감독청(NYDFS)의 규제를 받습니다." },
  { q: "몇 대까지 구매할 수 있나요?", a: "구글 계정 1개당 최대 100대까지 구매할 수 있습니다. 대량 구매 시에도 기기마다 제네시스 넘버가 하나씩 배정됩니다." },
  { q: "제네시스 넘버가 뭔가요?", a: "구매가 확정될 때 무작위로 배정되는 제네시스 노드 고유 번호입니다. 여러 대를 구매하면 수량만큼 배정되고, 주문 내역에서 정렬된 목록으로 확인·복사할 수 있습니다. 라이선스 NFT에 영구 기록됩니다." },
  { q: "라이선스 NFT는 뭔가요?", a: "기기의 정품과 참여 자격을 증명하는 XRPL 기반 증서입니다. 박스 안 리딤코드로 발급받으며, 이 NFT를 보유한 기기만 보상 대상이 됩니다." },
  { q: "배송은 언제, 어떻게 받나요?", a: "11월부터 순차 발송됩니다. 발송 2주 전부터 공식 텔레그램·X로 배송 접수 폼을 안내하며, 폼에 제네시스 넘버·내 지갑 주소·배송 정보를 입력하면 순서대로 발송됩니다." },
  { q: "배정된 제네시스 넘버는 어디서 확인하나요?", a: "구글 계정으로 로그인하면 주문 내역에서 정렬된 넘버 목록을 언제든 확인하고 복사할 수 있습니다." },
  { q: "사이트가 저장하는 개인정보는 뭔가요?", a: "구글 계정 로그인만 사용하며, 별도의 개인정보는 저장하지 않습니다. 가입하면 내 지갑이 자동으로 만들어지고, 배송 정보는 발송 전 접수 폼에서만 받아 배송이 끝나면 파기합니다." },
  { q: "리딤코드는 어디에 있나요?", a: "박스 안 카드에 인쇄되어 있습니다. 1개 코드는 1개 지갑에만 등록되며, 사용한 뒤에는 환불이 제한되니 등록 전에 결정해 주세요." },
  { q: "보상은 어떻게 계산되나요?", a: "매일 데이터 품질(가동률·이상치·주변 기기와의 일치 등)을 검증해 다음 날 적립되고, 클레임하면 지갑으로 지급됩니다. 지급량과 가치는 보장되지 않습니다." },
  { q: "기기를 꺼두면 어떻게 되나요?", a: "데이터가 없으면 그 시간만큼 보상 산정에서 빠집니다. 전기료가 월 1,000원 미만이라 상시 가동을 권장합니다." },
  { q: "인터넷이 잠시 끊기면요?", a: "다시 연결되면 자동으로 재개됩니다. 끊긴 기간만 산정에서 제외될 뿐 불이익이 쌓이지는 않습니다." },
  { q: "어떤 데이터가 수집되나요?", a: "공기질 측정값(미세먼지·CO₂·온습도 등)입니다. 외부에 제공될 때는 개별 가정을 알아볼 수 없도록 비식별 처리를 거칩니다." },
  { q: "A/S와 수리는 어디서 받나요?", a: "국내 설치·A/S·고객지원은 기기 파트너인 케이웨더가 담당합니다. 보증은 구매일로부터 1년입니다." },
  { q: "여러 대를 한 지갑으로 운영할 수 있나요?", a: "가능합니다. 기기마다 각각의 라이선스 NFT가 발급되고 보상도 기기별로 산정됩니다." },
  { q: "해외 배송이 되나요?", a: "1차 판매는 국내 배송만 지원합니다." },
];

export const FAQS_EXTRA_EN = [
  { q: "Why is payment RLUSD-only?", a: "RLUSD is a stablecoin pegged 1:1 to the US dollar, so you can pay without worrying about price swings. It is issued by Ripple and regulated by the NYDFS." },
  { q: "How many units can I buy?", a: "Up to 100 units per Google account. Even on bulk orders, each device gets its own Genesis Number." },
  { q: "What is a Genesis Number?", a: "A unique genesis-node number randomly assigned when your purchase is confirmed. Buy multiple units and you get one per device — viewable as a sorted, copyable list in your order history. Permanently recorded on your license NFT." },
  { q: "What is the license NFT?", a: "An XRPL-based certificate proving your device is genuine and eligible to participate. It is minted with the redeem code inside the box, and only devices holding this NFT earn rewards." },
  { q: "When and how does shipping work?", a: "Units ship sequentially from November. Starting 2 weeks before dispatch, we announce the shipping form on our official Telegram and X — enter your Genesis Numbers, your wallet address, and shipping details, and units ship in order." },
  { q: "Where do I find my assigned Genesis Numbers?", a: "Sign in with your Google account — your order history shows the sorted list, ready to copy, anytime." },
  { q: "What personal data does this site store?", a: "Only Google sign-in — nothing else is stored. Signing up creates your wallet automatically, and delivery details are collected only via the pre-shipping form, then deleted after delivery." },
  { q: "Where is the redeem code?", a: "Printed on the card inside the box. One code registers to one wallet only, and refunds are restricted once it is used — decide before you register." },
  { q: "How are rewards calculated?", a: "Data quality (uptime, outliers, agreement with nearby devices) is verified daily, rewards accrue the next day, and are paid on-chain when you claim. Amounts and value are not guaranteed." },
  { q: "What if I turn the device off?", a: "Time without data is simply excluded from reward calculation. Electricity costs under ₩1,000 a month, so we recommend keeping it running." },
  { q: "What if my internet drops briefly?", a: "It resumes automatically when reconnected. The offline period is excluded from calculation — no penalties accumulate." },
  { q: "What data is collected?", a: "Air-quality readings (particulates, CO₂, temperature, humidity, etc.). Before any external use, data is de-identified so individual homes cannot be recognized." },
  { q: "Where do I get repairs and support?", a: "Domestic installation, A/S, and customer support are handled by KWeather, our device partner. Warranty is one year from purchase." },
  { q: "Can one wallet run multiple devices?", a: "Yes. Each device gets its own license NFT and rewards are calculated per device." },
  { q: "Do you ship internationally?", a: "Batch 1 ships within Korea only." },
];

export const LINK_STEPS_EN: { n: string; t: string; d: string; d2?: string }[] = [
  { n: "1", t: "Pair the device via Bluetooth", d: "Power on and detect the device with your phone's Bluetooth" },
  { n: "2", t: "Connect it to your home Wi-Fi", d: "Set up home Wi-Fi on the paired device — measurement starts" },
  { n: "3", t: "Scan the redeem card QR & connect a wallet", d: "The card inside the box opens the registration page — guided even for first-timers" },
  { n: "4", t: "Enter the code & mint your NFT", d: "The redeem code verifies authenticity — your node goes live", d2: "Your Genesis Number is recorded permanently" },
];

export const RL_STEPS_EN = [
  { n: "1", t: "Buy RLUSD on an exchange", d: "Purchase RLUSD on a domestic or global exchange" },
  { n: "2", t: "Withdraw to your own wallet", d: "Choose the XRPL network and withdraw to your personal wallet" },
  { n: "3", t: "Pay on this page", d: "Connect your wallet and sign the Payment to check out" },
];
