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
  /* 8/30 정본 개정 — 8/30 회의 결정과 라이브 사이트(wlbn.wellbianlabs.io)를 근거로 다시 썼다.
     바뀐 사실: 1계정 5개 → 10대 · 구글 로그인 → 지갑 주소+계정 아이디 · 바우처 → 예매권 NFT ·
     물량 초과 시 추첨. 대시보드가 모아 준 "정본에 답 없음" 상위(환불·배송비·멤버십 정의·
     지갑 주소·트러스트라인)도 여기서 받는다.

     넣지 않은 것: 판매가, 보상 금액·수익률, 발행가·시세 전망, 총 물량. 확정되지 않았거나
     대외 표기가 금지된 값이다. 광고 규제에 걸리는 자리이기도 하다. */
  { q: "사전예약은 무엇인가요?", a: "9월 7일 정오에 열리는 구매 예약입니다. 결제가 아니며 저희에게 내시는 금액은 없습니다. 신청하시면 지갑으로 예매권 NFT가 발급되고, 이 NFT를 가진 분에게 9월 15일 정오 우선 구매창이 먼저 열립니다." },
  { q: "사전예약은 어떻게 하나요?", a: "지갑 주소로 로그인하시거나 구글 계정으로 로그인하시면 됩니다. 그 밖의 정보는 받지 않습니다. 지갑에 최소 1.5 XRP 이상이 있어야 예매권 NFT를 받으실 수 있습니다 — XRPL 지갑을 만들고 트러스트라인을 여는 데 드는 네트워크 준비금입니다. 신청 후 지갑으로 오는 예매권 NFT를 수락하시면 예약이 확정됩니다." },
  { q: "예약하면 반드시 살 수 있나요?", a: "구매를 보장하지는 않습니다. 예매권을 가진 분에게 구매창이 먼저 열리는 것이고, 신청이 준비된 물량을 넘으면 선착순이 아니라 추첨으로 정합니다. 예약으로 저희에게 내시는 금액은 없습니다." },
  { q: "몇 대까지 신청할 수 있나요?", a: "1계정당 최대 10대까지 신청하실 수 있습니다. 기업이나 대량 구매는 admin@wellbian.io 로 문의해 주세요." },
  { q: "언제 구매할 수 있나요?", a: "사전예약은 9월 7일 정오부터 9월 14일 정오까지입니다. 우선 구매창은 9월 15일 정오, 일반 구매창은 같은 날 오후 6시에 열리며, 예매 물량이 먼저 소진되면 그보다 일찍 열립니다. 판매는 9월 16일 정오에 끝납니다." },
  { q: "가격은 언제 알 수 있나요?", a: "가격은 판매 오픈 전에 공지됩니다. 결제는 RLUSD로 진행되니, 거래소에서 사서 지갑으로 옮기는 데 시간이 걸리는 점을 감안해 미리 준비해 두시길 권합니다." },
  { q: "RLUSD는 어디서 구하나요?", a: "RLUSD를 지원하는 국내·해외 거래소에서 구매한 뒤 개인 지갑으로 출금하시면 됩니다. 출금 화면에서 네트워크를 반드시 XRPL로 선택하세요. 다른 네트워크를 고르면 자산을 잃을 수 있습니다. 처음이시라면 소액으로 먼저 시험 전송을 해보시는 편이 안전합니다." },
  { q: "국내 거래소에서 지갑으로 바로 보낼 수 있나요?", a: "국내 거래소는 트래블룰 때문에 확인되지 않은 지갑으로 바로 보내지 못하는 경우가 있습니다. 이때는 거래소가 지원하는 외부 지갑을 거쳐 보내시면 됩니다. 해외 거래소는 대개 바로 보낼 수 있습니다. 거래소마다 다르니 출금 화면의 안내를 먼저 확인해 주세요." },
  { q: "지갑이 처음인데 괜찮나요?", a: "괜찮습니다. 계정을 만들면 기본 지갑이 자동으로 생성되고, 이미 쓰시는 지갑이 있으면 연결해서 쓰셔도 됩니다. XRP는 일부 지갑과 호환되지 않으니 XRPL을 지원하는 지갑을 쓰셔야 합니다. 단계별로 안내해 드립니다. 지갑에 최소 1.5 XRP 이상이 있어야 예매권 NFT를 받으실 수 있습니다 — XRPL 지갑을 만들고 트러스트라인을 여는 데 드는 네트워크 준비금입니다." },
  { q: "보상은 어떻게 지급되나요?", a: "기기가 보낸 측정값이 검증을 통과하면 네트워크 원칙에 따라 WLBN이 쌓입니다. 받으시려면 기기의 라이선스 NFT가 발급되어 있어야 합니다. 지급량과 가치는 보장되지 않습니다." },
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

/* 내 공기 — 24시간 목값 (8/30 회의: "모니터링 화면을 에어사인 수준으로 크게")
   기기 데이터 API 가 붙기 전까지 화면을 판단하기 위한 값이다. 매번 흔들리면 화면을
   볼 수 없으므로 고정해 둔다. 하루 흐름을 실제처럼 넣었다 — 자는 동안 CO₂ 가 오르고,
   아침에 환기하면 떨어지고, 저녁에 다시 오른다. 이 모양이 안 보이면 그래프를 넣은
   의미가 없다. */
export type AirPoint = { h: number; co2: number; pm25: number; temp: number; hum: number };

export const MOCK_AIR: AirPoint[] = [
  { h: 0,  co2: 980,  pm25: 11, temp: 23.4, hum: 48 },
  { h: 1,  co2: 1080, pm25: 10, temp: 23.1, hum: 49 },
  { h: 2,  co2: 1160, pm25: 10, temp: 22.9, hum: 50 },
  { h: 3,  co2: 1240, pm25: 9,  temp: 22.7, hum: 51 },
  { h: 4,  co2: 1310, pm25: 9,  temp: 22.6, hum: 52 },
  { h: 5,  co2: 1370, pm25: 10, temp: 22.5, hum: 52 },
  { h: 6,  co2: 1420, pm25: 12, temp: 22.6, hum: 51 },
  { h: 7,  co2: 1180, pm25: 16, temp: 23.0, hum: 49 },   // 환기
  { h: 8,  co2: 720,  pm25: 21, temp: 23.6, hum: 46 },
  { h: 9,  co2: 640,  pm25: 19, temp: 24.1, hum: 45 },
  { h: 10, co2: 610,  pm25: 16, temp: 24.6, hum: 44 },
  { h: 11, co2: 630,  pm25: 14, temp: 25.0, hum: 43 },
  { h: 12, co2: 700,  pm25: 13, temp: 25.3, hum: 43 },
  { h: 13, co2: 760,  pm25: 12, temp: 25.6, hum: 42 },
  { h: 14, co2: 790,  pm25: 12, temp: 25.8, hum: 42 },
  { h: 15, co2: 820,  pm25: 13, temp: 25.7, hum: 43 },
  { h: 16, co2: 860,  pm25: 15, temp: 25.4, hum: 44 },
  { h: 17, co2: 910,  pm25: 18, temp: 25.0, hum: 45 },
  { h: 18, co2: 1020, pm25: 22, temp: 24.6, hum: 46 },   // 저녁 · 조리
  { h: 19, co2: 1140, pm25: 31, temp: 24.4, hum: 48 },
  { h: 20, co2: 1060, pm25: 24, temp: 24.2, hum: 48 },
  { h: 21, co2: 950,  pm25: 18, temp: 24.0, hum: 47 },
  { h: 22, co2: 880,  pm25: 15, temp: 23.8, hum: 47 },
  { h: 23, co2: 840,  pm25: 13, temp: 23.6, hum: 48 },
];

/* 등급은 세 단계다. 처음에 네 단계로 잡았다가 색을 검증기에 넣어 보니 주황 계열
   셋이 서로 갈리지 않았다(정상 시야에서도 ΔE 8.8) — 색만 늘려 놓고 구분이 안 되면
   단계가 있으나 마나다. 세 단계로 줄이고 등급 이름을 늘 함께 띄운다. */
export type AirGrade = "good" | "fair" | "bad";

export const co2Grade = (v: number): AirGrade => (v <= 800 ? "good" : v <= 1200 ? "fair" : "bad");
export const pmGrade  = (v: number): AirGrade => (v <= 15 ? "good" : v <= 35 ? "fair" : "bad");

export const GRADE_LABEL: Record<AirGrade, { ko: string; en: string }> = {
  good: { ko: "좋음", en: "Good" },
  fair: { ko: "보통", en: "Fair" },
  bad:  { ko: "나쁨", en: "Poor" },
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
  /* 8/30 서우: 텔레그램이 두 개다 — 채널(@wellbianlabs)은 공지 전용이라 구독자가 글을 못 쓴다.
     사이트의 "커뮤니티" 버튼 6곳이 전부 채널을 가리키고 있어서, 누른 사람이 질문도 못 하고
     FAQ 봇도 만나지 못했다. 대화가 되는 공개 그룹(@wellbiantalk)으로 옮기고 채널은 푸터에만 둔다. */
  telegram: "https://t.me/wellbiantalk",
  telegramNews: "https://t.me/wellbianlabs",
  /* FAQ 봇 1:1 딥링크. 그룹에서 /faq 를 치면 답이 전원에게 뿌려져 대화창이 지저분해지므로
     사이트에서는 1:1 창이 열리는 이 링크로 보낸다(그룹의 봇은 거들기용). */
  faqBot: "https://t.me/wellbian_faq_bot",
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
  { q: "What is the pre-reservation?", a: "A reservation that opens at noon on September 7. It is not a payment, and you pay us nothing. When you apply, a reservation NFT is issued to your wallet, and holders of that NFT get the priority purchase window first, at noon on September 15." },
  { q: "How do I pre-reserve?", a: "Sign in with your wallet address or with a Google account — nothing else is collected. Your wallet needs at least 1.5 XRP to receive the reservation NFT — the network reserve required to create an XRPL wallet and open a trustline. Accept the reservation NFT that arrives in your wallet and your reservation is confirmed." },
  { q: "Does reserving guarantee I can buy?", a: "It does not guarantee a purchase. Reservation holders simply get the window first, and if applications exceed the prepared quantity, allocation is by draw rather than first-come. Reserving itself costs you nothing on our side." },
  { q: "How many can I reserve?", a: "Up to 10 per account. For business or bulk purchases, email admin@wellbian.io — we handle those separately." },
  { q: "When can I buy?", a: "Pre-reservation runs from noon on September 7 to noon on September 14. The priority window opens at noon on September 15 and the general window at 6 p.m. the same day — earlier if reserved stock sells out first. The sale ends at noon on September 16." },
  { q: "When will the price be announced?", a: "The price is announced before the sale opens. Payment is in RLUSD, and buying it and moving it to your wallet takes time, so we suggest preparing in advance." },
  { q: "Where do I get RLUSD?", a: "Buy RLUSD on an exchange that supports it, then withdraw to your own wallet. On the withdrawal screen you must select the XRPL network — choosing another network can lose the funds. If this is your first time, send a small test amount first." },
  { q: "Can I send straight from a Korean exchange to my wallet?", a: "Korean exchanges may block transfers to unverified wallets under travel-rule requirements. In that case, route through an external wallet the exchange supports. Overseas exchanges usually allow it directly. Rules differ by exchange, so check the withdrawal screen first." },
  { q: "I have never used a wallet — is that a problem?", a: "Not at all. Creating an account generates a wallet for you, and you can connect one you already use instead. XRP is not compatible with every wallet, so use one that supports XRPL. We guide you step by step. Your wallet needs at least 1.5 XRP to receive the reservation NFT — the network reserve required to create an XRPL wallet and open a trustline." },
  { q: "How are rewards paid?", a: "When measurements from your device pass verification, WLBN accrues under network rules. To receive it, the device's license NFT must be issued. Amounts and value are not guaranteed." },
];

export const FAQS_EXTRA = [
  { q: "배송은 언제 되나요? 배송비는 따로 드나요?", a: "배송 시기와 배송비는 판매 오픈 때 구매 화면에서 함께 안내해 드립니다. 사전예약 단계에서는 배송 정보를 받지 않습니다." },
  { q: "환불되나요?", a: "사전예약으로 저희에게 내신 금액이 없으므로 환불해 드릴 것도 없습니다. 언제든 예약을 하지 않으셔도 됩니다. 지갑에 넣어 두신 XRP는 저희에게 오는 돈이 아니라 계정에 남는 네트워크 준비금입니다. 구매 후의 환불은 판매 약관에 따르며, 약관은 판매 오픈 전에 공지됩니다." },
  { q: "제네시스 멤버십이 뭔가요?", a: "가장 먼저 합류한 분에게 한 번만 발급되는 관측소 자격입니다. XRPL NFT(TAXON 1001)로 증명되고 계정당 1개이며, 이후 다시 발행되지 않습니다. 보상 부스트와 바운티 우선 배정이 따릅니다." },
  { q: "라이선스 NFT는 뭔가요?", a: "자격을 증명하는 XRPL NFT입니다. 두 종류가 있습니다. 관측소는 계정당 1개로 합류 시기를 구분하고, 스테이션은 기기당 1개로 박스 안 리딤 코드로 발급합니다. 스테이션 NFT가 있어야 그 기기가 보상 대상이 됩니다." },
  { q: "트러스트라인이 뭔가요?", a: "XRPL에서 내 지갑이 특정 토큰을 받겠다고 여는 통로입니다. RLUSD를 받으려면 필요하고, 결제 단계에서 자동으로 점검해 드립니다. 트러스트라인을 열 때 XRP 준비금이 계정에 잡히는데, 이는 저희에게 오는 돈이 아니라 지갑에 남는 금액입니다." },
  { q: "내 지갑 주소는 어디서 확인하나요?", a: "로그인하시면 화면 오른쪽 위에 지갑 주소가 줄여서 표시됩니다. 눌러서 전체 주소를 복사하실 수 있습니다." },
  { q: "WLBN은 어떤 토큰인가요?", a: "네트워크의 보상·결제에 쓰이는 XRPL 발행 자산(IOU)입니다. 총 발행량은 1,000,000으로 고정되어 있습니다. 데이터가 팔릴 때마다 결제된 WLBN의 절반이 영구 소각되며, 소각 내역은 온체인 트랜잭션으로 확인하실 수 있습니다." },
  { q: "보상 예산은 어떻게 정해지나요?", a: "하루 단위(에폭)로 예산을 먼저 고정한 뒤, 각 기기의 품질 점수 기여도에 따라 나눕니다. 기기 수가 늘어도 총 발행량이 늘지 않는 구조입니다." },
  { q: "한 사람이 보상을 독식할 수 있나요?", a: "그렇게 되지 않도록 기기 하나가 하루 예산의 0.5%를 넘게 가져갈 수 없게 상한을 두고 있습니다." },
  { q: "내 데이터가 팔리면 개인정보가 새나요?", a: "측정하는 값은 공기질 데이터뿐이고 개인을 식별하는 정보는 수집하지 않습니다. 판매·조회되는 데이터는 위치·시간을 뭉개고 식별자를 돌리는 비식별화 과정을 거치며, 응답에는 개별 기기가 아니라 묶음 통계만 담깁니다." },
  { q: "기기만 쓰고 보상은 안 받아도 되나요?", a: "됩니다. 보상을 빼고 보셔도 CO₂·미세먼지·온습도를 실시간으로 보는 실내 공기질 측정기입니다. 보상은 원하실 때 라이선스 NFT를 발급받으시면 됩니다." },
  { q: "측정 기기는 어떤 제품인가요?", a: "실내 공기질 측정기 ARC-600DA입니다. CO₂·미세먼지·온습도를 측정하고 대한민국 KC 인증과 성능 인증을 받았습니다. 자세한 사양은 사이트의 제품 스펙에서 보실 수 있습니다." },
  { q: "왜 한 번만, 그것도 짧게 파나요?", a: "제네시스는 메인넷 초기에 단 한 번 열리는 한정 판매이고 재발행하지 않습니다. 가장 먼저 합류하신 분을 구분하기 위한 것이라 나중에 같은 자격을 다시 열지 않습니다." },
  { q: "신청한 수량보다 적게 사도 되나요?", a: "됩니다. 우선 구매창에서 신청하신 수량 안에서 원하는 만큼만 구매하시면 됩니다. 신청 수량을 다 사셔야 하는 것은 아닙니다." },
  { q: "신청한 뒤에 수량을 바꾸거나 취소할 수 있나요?", a: "신청 후에는 수량을 바꾸거나 취소하실 수 없습니다. 신청은 수요를 가늠하기 위한 것이라 구매 의무가 아니고, 실제 구매는 우선 구매창에서 원하시는 만큼만 하시면 되므로 굳이 바꾸실 필요도 없습니다." },
  { q: "구글로 만든 지갑을 다른 지갑으로 옮길 수 있나요?", a: "구글 계정으로 만든 지갑은 니모닉이나 개인키를 내보내 다른 지갑으로 옮기실 수 없습니다. 그 지갑에 있는 NFT를 다른 곳으로 두시려면 외부 개인 지갑을 연결하신 뒤 그 지갑으로 전송하시면 됩니다." },
];

export const FAQS_EXTRA_EN = [
  { q: "When does it ship, and is shipping charged separately?", a: "Shipping timing and cost are shown on the purchase screen when the sale opens. No delivery details are collected at the reservation stage." },
  { q: "Can I get a refund?", a: "You pay us nothing to pre-reserve, so there is nothing for us to refund — you are free to walk away at any point. The XRP you keep in your wallet is not paid to us; it stays in your account as a network reserve. Refunds after purchase follow the sale terms, which are published before the sale opens." },
  { q: "What is the Genesis membership?", a: "An observatory credential issued once, to those who join earliest. It is proven by an XRPL NFT (TAXON 1001), limited to one per account, and never reissued. It carries a reward boost and priority on bounties." },
  { q: "What is the license NFT?", a: "An XRPL NFT that proves eligibility. There are two kinds: an observatory NFT, one per account, marking when you joined; and a station NFT, one per device, minted with the redeem code in the box. A device earns rewards only with its station NFT." },
  { q: "What is a trustline?", a: "On the XRPL it is the channel your wallet opens to accept a given token. You need one to receive RLUSD, and we check it automatically during payment. Opening a trustline locks a small XRP reserve in your account — that is not paid to us; it stays in your wallet." },
  { q: "Where do I find my wallet address?", a: "Once signed in, your wallet address appears abbreviated at the top right. Click it to copy the full address." },
  { q: "What kind of token is WLBN?", a: "An XRPL-issued asset (IOU) used for rewards and payments on the network. Total supply is fixed at 1,000,000. Each time data is sold, half of the WLBN paid is burned permanently, and every burn is verifiable as an on-chain transaction." },
  { q: "How is the reward budget decided?", a: "The budget is fixed first for each daily epoch, then divided by each device's contribution to quality score. Adding devices does not increase total issuance." },
  { q: "Can one person take all the rewards?", a: "No. A single device is capped at 0.5% of the daily budget." },
  { q: "If my data is sold, does my personal information leak?", a: "We measure air quality only and collect nothing that identifies a person. Data that is sold or queried goes through de-identification — location and time are generalized and identifiers rotated — and responses carry cohort statistics rather than individual devices." },
  { q: "Can I use the device without taking rewards?", a: "Yes. Set the rewards aside and it is an indoor air quality monitor showing CO₂, particulates, temperature and humidity in real time. You can mint the license NFT whenever you want to start earning." },
  { q: "What device is it?", a: "The ARC-600DA indoor air quality monitor. It measures CO₂, particulates, temperature and humidity, and carries Korean KC certification and performance certification. Full specifications are on the site." },
  { q: "Why only once, and only briefly?", a: "Genesis is a one-time sale in the early days of the mainnet, and it is never reissued. It exists to mark those who joined first, so the same credential will not be opened again later." },
  { q: "Can I buy fewer than I reserved?", a: "Yes. In the priority window you can take as few as you like, up to the quantity you reserved. There is no obligation to buy the full amount." },
  { q: "Can I change or cancel my reservation after applying?", a: "Reservations cannot be changed or cancelled once submitted. Applying is how we gauge demand, not a commitment to buy — and since you can take as few as you like in the purchase window, there is no need to change it." },
  { q: "Can I move the wallet created with Google to another wallet?", a: "A wallet created with a Google account cannot be exported — there is no mnemonic or private key to move elsewhere. To hold its NFT somewhere else, connect an external personal wallet and transfer the NFT to it." },
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
