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

/* 8/31 서우: **9/15 판매분 450 RLUSD 확정.** 8/28 에 얼리버드 티어를 없애고 1차 전체를 450,
   2차부터 650 으로 정했던 값이 그대로 확정됐다.

   여기가 가격의 정본이다. 화면·고지·FAQ·봇이 전부 이 상수를 본다 — 문구에 숫자를 직접
   적으면 사본이 생기고, 5개 언어면 사본이 열 개가 된다. 8/29 사고가 정확히 그 모양이었다.
   키 이름의 eb/gen 은 폐기된 얼리버드 구조의 잔재라 first/later 로 바꿨다. */
export const PRICE = { first: 450, later: 650 } as const;
/* 9/8 서우: 원화 병기. 9/7 사이트 기준 1차 750,000원(정상가 1,083,000원). RLUSD 는 PRICE 그대로 —
   later(650) 는 이제 "2차 판매가"가 아니라 정상가다. 이름은 다른 참조가 있어 그대로 둔다. */
export const PRICE_KRW = { first: "750,000", list: "1,083,000" } as const;

/** 고지 문구의 자리표시자를 정본 값으로 채운다. 어순이 언어마다 달라서 숫자를 문장 밖에서
    이어 붙일 수 없다 — 자리표시자를 문장 안에 두고 여기서만 값을 넣는다. */
export const fillPrice = (s: string) =>
  s.replace("{first}", String(PRICE.first)).replace("{later}", String(PRICE.later));

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
     대외 표기가 금지된 값이다. 광고 규제에 걸리는 자리이기도 하다.

     9/8 재개정 — 9/7 에 연 실제 판매 사이트(wellbian.io) 화면 기준으로 다시 썼다. 8/30 판은
     이전 플랫폼(wlbn.wellbianlabs.io) 흐름이라 "지갑 + 1.5 XRP + 예매권 NFT" 를 전제했는데,
     실제 사이트는 이메일/구글 로그인 → 예매 인증서 즉시 기록, 지갑·서명·준비금 없음, 온체인
     NFT 는 선택이다. 가격도 원화 병기(카드 결제)로 바뀌었다. 봇이 이 답을 고객에게 직접 하는
     자리라, 정본이 사이트를 따라가지 못하면 8/29 사고가 고객 앞에서 다시 난다. */
  { q: "사전예약은 무엇인가요?", a: "9월 7일 정오부터 9월 14일 정오까지 받는 구매 예약입니다. 결제가 아니며 저희에게 내시는 금액은 없습니다. 신청하시면 예매 인증서가 계정에 즉시 기록되고, 이 인증서만으로 9월 15일 정오 우선 구매창의 자격이 인정됩니다. 온체인 NFT로 받는 것은 선택입니다." },
  { q: "사전예약은 어떻게 하나요?", a: "이메일 또는 구글 계정으로 로그인한 뒤 수량을 고르시면 됩니다. 약 30초 걸립니다. 지갑·서명·네트워크 준비금은 필요 없습니다. 신청 즉시 예매 인증서(위조할 수 없는 검증 코드)가 계정에 기록됩니다. 원하시면 마이페이지에서 XRPL 또는 Flare 지갑으로 NFT로도 받으실 수 있습니다." },
  { q: "예약하면 반드시 살 수 있나요?", a: "구매를 보장하지는 않습니다. 예매 인증서를 가진 분에게 9월 15일 정오부터 오후 5시 59분까지 우선 구매창이 먼저 열리고, 오후 6시부터는 예약 없이도 구매하실 수 있습니다. 예약으로 저희에게 내시는 금액은 없습니다." },
  { q: "몇 대까지 신청할 수 있나요?", a: "1계정당 최대 10대까지 신청하실 수 있습니다. 기업이나 대량 구매는 admin@wellbian.io 로 문의해 주세요." },
  { q: "언제 구매할 수 있나요?", a: "사전예약은 9월 7일 정오부터 9월 14일 정오까지입니다. 우선 구매창은 9월 15일 정오부터 오후 5시 59분까지 예약자에게 먼저 열리고, 일반 구매는 같은 날 오후 6시부터입니다. 판매는 9월 16일 정오에 끝나는 24시간 한정입니다." },
  { q: "가격은 얼마인가요?", a: `1차(9월 15일) 판매가는 ${PRICE_KRW.first}원 또는 ${PRICE.first} RLUSD입니다(정상가 ${PRICE_KRW.list}원 · ${PRICE.later} RLUSD). 국내는 페이·체크·신용카드로, 해외나 Web3 지갑을 쓰시는 분은 RLUSD로 결제하실 수 있습니다. RLUSD로 내시려면 거래소에서 사서 지갑으로 옮기는 데 시간이 걸리니 미리 준비해 두시길 권합니다.` },
  { q: "RLUSD는 어디서 구하나요?", a: "RLUSD를 지원하는 국내·해외 거래소에서 구매한 뒤 개인 지갑으로 출금하시면 됩니다. 출금 화면에서 네트워크를 반드시 XRPL로 선택하세요. 다른 네트워크를 고르면 자산을 잃을 수 있습니다. 처음이시라면 소액으로 먼저 시험 전송을 해보시는 편이 안전합니다." },
  { q: "국내 거래소에서 지갑으로 바로 보낼 수 있나요?", a: "국내 거래소는 트래블룰 때문에 확인되지 않은 지갑으로 바로 보내지 못하는 경우가 있습니다. 이때는 거래소가 지원하는 외부 지갑을 거쳐 보내시면 됩니다. 해외 거래소는 대개 바로 보낼 수 있습니다. 거래소마다 다르니 출금 화면의 안내를 먼저 확인해 주세요." },
  { q: "지갑이 처음인데 괜찮나요?", a: "예약에는 지갑이 필요 없습니다. 구매도 국내 카드로 하시면 지갑 없이 됩니다. RLUSD로 결제하시거나 인증서를 NFT로 받고 싶으실 때만 XRPL 지갑이 필요하고, D'CENT·Girin·Xaman 같은 외부 지갑으로 로그인하실 수 있습니다." },
  { q: "보상은 어떻게 지급되나요?", a: "기기가 보낸 측정값이 검증을 통과하면 네트워크 원칙에 따라 WLBN이 쌓입니다. 기기를 받기 전에도 기기 NFT당 일별 보상 토큰이 포인트 형식으로 적립될 예정이며, 온체인 전환은 회사가 공지하는 출금 개시 이후 정산 정책에 따라 이루어집니다. 지급량과 가치는 보장되지 않습니다." },
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
  unitPrice: PRICE.first,
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

/* 보상 (8/30 회의: "클레임 가능 잔액(지갑 잔액 아님) + 전액 클레임 → 지갑 이동")

   괄호가 이 화면의 요구다. 보상은 쌓여 있어도 아직 지갑에 없다 — 클레임이라는 온체인
   행위를 거쳐야 옮겨진다. 숫자만 크게 띄우면 지갑 잔액으로 읽히고, 그러면 지갑을 열어
   보고 "돈이 없다" 고 문의가 온다. 그래서 세 값을 갈라 둔다.

   누적을 따로 저장하지 않는다 — 가능 + 옮긴 것으로 늘 계산한다. 세 값을 다 들고 있으면
   언젠가 서로 안 맞고, 그때 틀린 쪽은 눈에 안 보이는 쪽이다. */
export const MOCK_REWARD = {
  /** 아직 지갑에 없다. 이 화면의 주인공 숫자 */
  claimable: 128.4,
  /** 이미 지갑으로 옮긴 것 (플랫폼 리드아웃 TOTAL CLAIMED 기준) */
  claimed: 4.8781,
  lastClaimAt: "2026-08-28T21:14:00+09:00",
  nextEpochAt: "2026-09-01T00:00:00+09:00",
};

export const rewardTotal = () => MOCK_REWARD.claimable + MOCK_REWARD.claimed;

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
  { q: "What is the pre-reservation?", a: "A purchase reservation, open from noon on September 7 to noon on September 14. It is not a payment, and you pay us nothing. When you apply, a reservation voucher is recorded to your account instantly, and that voucher alone qualifies you for the priority purchase window at noon on September 15. Receiving it as an on-chain NFT is optional." },
  { q: "How do I pre-reserve?", a: "Sign in with your email or a Google account and choose a quantity — about 30 seconds. No wallet, no signature and no network reserve are needed. A reservation voucher (a verification code that cannot be forged) is recorded to your account instantly. If you wish, you can also receive it as an NFT to an XRPL or Flare wallet from My Page." },
  { q: "Does reserving guarantee I can buy?", a: "It does not guarantee a purchase. Voucher holders get the priority window first — from noon to 5:59 p.m. on September 15 — and from 6 p.m. anyone can buy without a reservation. Reserving costs you nothing." },
  { q: "How many can I reserve?", a: "Up to 10 per account. For business or bulk purchases, email admin@wellbian.io — we handle those separately." },
  { q: "When can I buy?", a: "Pre-reservation runs from noon on September 7 to noon on September 14. The priority window for reservation holders runs from noon to 5:59 p.m. on September 15, and general purchase opens at 6 p.m. the same day. The sale ends at noon on September 16 — a 24-hour window." },
  { q: "How much does it cost?", a: `The first-sale (September 15) price is ${PRICE.first} RLUSD or KRW ${PRICE_KRW.first} (list price ${PRICE.later} RLUSD · KRW ${PRICE_KRW.list}). Pay in RLUSD from an XRPL wallet worldwide, or by Korean domestic card. If paying in RLUSD, buying it and moving it to your wallet takes time, so prepare in advance.` },
  { q: "Where do I get RLUSD?", a: "Buy RLUSD on an exchange that supports it, then withdraw to your own wallet. On the withdrawal screen you must select the XRPL network — choosing another network can lose the funds. If this is your first time, send a small test amount first." },
  { q: "Can I send straight from a Korean exchange to my wallet?", a: "Korean exchanges may block transfers to unverified wallets under travel-rule requirements. In that case, route through an external wallet the exchange supports. Overseas exchanges usually allow it directly. Rules differ by exchange, so check the withdrawal screen first." },
  { q: "I have never used a wallet — is that a problem?", a: "You do not need a wallet to reserve. You can also buy without one, by Korean domestic card. An XRPL wallet is only needed if you pay in RLUSD or want your voucher as an NFT — external wallets such as D'CENT, Girin and Xaman are supported." },
  { q: "How are rewards paid?", a: "When measurements from your device pass verification, WLBN accrues under network rules. Even before delivery, reward tokens are planned to accrue daily per device NFT as points; conversion on-chain follows the settlement policy once the company announces that withdrawals are open. Amounts and value are not guaranteed." },
];

export const FAQS_EXTRA = [
  /* 9/10 정정 3건 — WLBN 총 발행량(1,000,000 → 100억, 8/24 구 플랫폼 화면 표기였음)·예산 산정 방식·독식 상한 문구.
     기본 문항 "보상은 어떻게 지급되나요?" 도 온체인 전환 시점을 '출금 개시 공지 이후' 로 통일했다.
     근거와 불일치 목록: depin/content/site-canon-0910.md §1·§7 */
  { q: "배송은 언제 되나요? 배송비는 따로 드나요?", a: "출고 일정은 별도로 안내드립니다. 배송 2주 전에 텔레그램과 X 공지로 알려드리고, 배송 정보는 그때 받습니다. 사전예약 단계에서는 배송 정보를 받지 않습니다." },
  { q: "환불되나요?", a: "사전예약으로 저희에게 내신 금액이 없으므로 환불해 드릴 것도 없습니다. 언제든 예약을 하지 않으셔도 됩니다. 구매 후의 환불은 판매 약관에 따르며, 약관은 판매 오픈 전에 공지됩니다." },
  { q: "제네시스 멤버십이 뭔가요?", a: "1차 판매 구매자에게만 부여되는 관측소 라이선스 등급입니다. 계정당 1개이고 양도할 수 없으며, 이후 판매분에는 발급되지 않습니다. 보상 토큰 20% 가산(예정)과 데이터 바운티 우선 배정이 따르고, 제네시스 넘버가 영구 기록되어 이후 판매·신규 서비스에서 우선권을 갖습니다." },
  { q: "라이선스 NFT는 뭔가요?", a: "두 종류가 있습니다. 기기 NFT는 구매하시는 기기 1대당 1개로 양도할 수 있고, 관측소 라이선스는 계정당 1개로 합류 시기를 구분합니다(1차 구매자는 제네시스). 기기 NFT가 있어야 그 기기가 보상 대상이 됩니다." },
  { q: "트러스트라인이 뭔가요?", a: "XRPL에서 내 지갑이 특정 토큰을 받겠다고 여는 통로입니다. RLUSD를 받으려면 필요하고, 결제 단계에서 자동으로 점검해 드립니다. 트러스트라인을 열 때 XRP 준비금이 계정에 잡히는데, 이는 저희에게 오는 돈이 아니라 지갑에 남는 금액입니다." },
  { q: "내 지갑 주소는 어디서 확인하나요?", a: "로그인하시면 화면 오른쪽 위에 지갑 주소가 줄여서 표시됩니다. 눌러서 전체 주소를 복사하실 수 있습니다." },
  { q: "WLBN은 어떤 토큰인가요?", a: "네트워크의 보상·결제에 쓰이는 XRPL 발행 자산(IOU)이며 유틸리티 토큰입니다. 지분·증권·예금·법정통화가 아닙니다. 총 발행량은 100억 개로 제네시스에 전량 발행되었고, 공개된 정책상 추가 발행은 없습니다. 배분과 소각 내역은 사이트 토큰 페이지와 백서에 공개되어 있고, 소각은 온체인 트랜잭션으로 확인하실 수 있습니다." },
  { q: "보상 예산은 어떻게 정해지나요?", a: "하루 단위(에폭)로 활성 관측 지점 수와 현재 단계에 따라 예산을 먼저 정한 뒤, 전송률과 품질 등급을 통과한 기기에 나눕니다. 단계가 올라갈수록 지점당 기준량은 줄어들고, 지급되지 않은 몫은 재분배되거나 소각됩니다. 산식은 백서에 공개되어 있으며, 지급량과 가치는 보장되지 않습니다." },
  { q: "한 사람이 보상을 독식할 수 있나요?", a: "그렇게 되지 않도록 기기 한 대가 하루에 받을 수 있는 양에 상한을 두고, 상한을 넘는 몫은 다른 기기에 재분배하거나 소각합니다. 구체적인 상한값은 백서의 보상 정책에 있습니다." },
  { q: "내 데이터가 팔리면 개인정보가 새나요?", a: "측정하는 값은 공기질 데이터뿐이고 개인을 식별하는 정보는 수집하지 않습니다. 판매·조회되는 데이터는 위치·시간을 뭉개고 식별자를 돌리는 비식별화 과정을 거치며, 응답에는 개별 기기가 아니라 묶음 통계만 담깁니다." },
  { q: "기기만 쓰고 보상은 안 받아도 되나요?", a: "됩니다. 보상을 빼고 보셔도 CO₂·미세먼지·온습도를 실시간으로 보는 실내 공기질 측정기입니다. 보상은 원하실 때 라이선스 NFT를 발급받으시면 됩니다." },
  { q: "측정 기기는 어떤 제품인가요?", a: "실내 공기질 측정기 ARC-600DA입니다. CO₂·미세먼지·온습도를 측정하고 대한민국 KC 인증과 성능 인증을 받았습니다. 자세한 사양은 사이트의 제품 스펙에서 보실 수 있습니다." },
  { q: "왜 한 번만, 그것도 짧게 파나요?", a: "제네시스는 메인넷 초기에 단 한 번 열리는 한정 판매이고 재발행하지 않습니다. 가장 먼저 합류하신 분을 구분하기 위한 것이라 나중에 같은 자격을 다시 열지 않습니다." },
  { q: "신청한 수량보다 적게 사도 되나요?", a: "됩니다. 우선 구매창에서 신청하신 수량 안에서 원하는 만큼만 구매하시면 됩니다. 신청 수량을 다 사셔야 하는 것은 아닙니다." },
  { q: "신청한 뒤에 수량을 바꾸거나 취소할 수 있나요?", a: "신청 후에는 수량을 바꾸거나 취소하실 수 없습니다. 신청은 수요를 가늠하기 위한 것이라 구매 의무가 아니고, 실제 구매는 우선 구매창에서 원하시는 만큼만 하시면 되므로 굳이 바꾸실 필요도 없습니다." },
  { q: "구글로 만든 지갑을 다른 지갑으로 옮길 수 있나요?", a: "구글 계정으로 만든 지갑은 니모닉이나 개인키를 내보내 다른 지갑으로 옮기실 수 없습니다. 그 지갑에 있는 NFT를 다른 곳으로 두시려면 외부 개인 지갑을 연결하신 뒤 그 지갑으로 전송하시면 됩니다." },
  { q: "카드로 결제할 수 있나요?", a: "네. 9월 15일 판매에서 국내 페이·체크·신용카드와 RLUSD(XRPL 지갑) 결제를 함께 받습니다. 사전예약 단계에서는 결제가 없습니다." },
  { q: "XRP SEOUL 2026 입장권은 어떻게 받나요?", a: "측정기 구매자 중 추첨으로 200명에게 XRP SEOUL 2026 입장권을 드립니다. 1인 1장이며, 카드형 지갑만 단독 구매하신 경우는 추첨 대상이 아닙니다." },
  { q: "D'CENT 카드형 지갑은 무엇인가요?", a: "선택 구매 품목입니다. 70,000원(정가 80,000원)에 카드 결제로만 구매하실 수 있고, 기기 NFT나 예매 인증서와는 무관하며 입장권 추첨 대상도 아닙니다." },  /* 9/10 신설 8문항 — 출처: wellbian.io /token·/terms·/membership + 백서 v0.3 정본 스냅샷
     (depin/content/site-canon-0910.md). 사이트가 이미 공개한 사실만 옮기고, 수량·가치·시세는 약속하지 않는다.
     상한값·출금 시점처럼 사이트와 백서가 어긋난 자리는 정본 §7 의 수정안 문구를 쓴다. */
  { q: "WLBN은 어떻게 배분되나요?", a: "총 100억 개 기준으로 노드 보상 1기 28%, 노드 보상 2기 18%(10단계 게이트를 통과할 때만 열리고, 아니면 소각), 소각 예정 25%, 유동성 공급(LP) 8%, 팀 6%(12개월 클리프 뒤 48개월 선형 해제), 생태계 5%, 전략 투자 5%(TGE 시점 해제 0), 유동성·준비금 5%입니다. 조건과 일정은 사이트 토큰 페이지와 백서에 있습니다." },
  { q: "WLBN 소각은 어떻게 이루어지나요?", a: "여러 갈래로 이루어집니다. 배분표의 소각 예정 물량(총량의 25%)을 네 차례에 나누어 소각하고, 매입한 물량을 소각하며, 데이터 판매로 결제된 WLBN의 절반은 자동으로 소각합니다. 품질 미달로 지급되지 않은 보상과 2기 보상 미개방분도 소각 대상입니다. 모든 소각은 온체인 트랜잭션으로 남습니다." },
  { q: "거래소 상장은 언제 하나요?", a: "정해진 날짜는 없고, 백서에 공개된 마일스톤 게이트를 따릅니다. 초기 게이트(G1~G3)에서는 거래소 상장을 하지 않으며, 25,000대 완판과 3개월 가동률 80%를 충족하는 G4에서 XRPL DEX가 열립니다. 지역 거래소는 G5, 글로벌 거래소는 G9에서 검토합니다. 상장 시점이나 가격에 대한 약속은 없습니다." },
  { q: "적립된 WLBN을 바로 출금하거나 보낼 수 있나요?", a: "출금 개시 전까지는 계정에 포인트로 적립되고 온체인으로 이동하지 않습니다. 백서 정책상 DEX 개방(G4) 전에는 온체인 이동이 없으며, 출금 개시일은 회사가 별도로 공지합니다. 개시 이후에는 클레임으로 지갑에 받으실 수 있습니다." },
  { q: "WLBN 가격이 오르나요?", a: "가격이나 가치에 대한 전망은 드리지 않습니다. WLBN은 네트워크의 보상·결제에 쓰이는 유틸리티 토큰이며, 회사는 가격을 보증하지 않고 투자를 권유하지도 않습니다(이용약관 제7조). 기기 구매는 측정기 자체의 쓸모를 기준으로 결정해 주세요." },
  { q: "누가 운영하고 판매하나요? 케이웨더와는 어떤 관계인가요?", a: "서비스 운영과 WLBN 발행·보상 정책의 주체는 싱가포르 법인 Wellbian Labs Pte. Ltd.입니다(이용약관 제3조). 주식회사 케이웨더는 기기 파트너로서 측정기 제공·품질 인증·기술 지원을 맡고, 국내 유통·판매·설치·A/S·고객 응대를 위탁받아 수행합니다(제4조). 국내 기기·설치·A/S 문의는 케이웨더가 맡습니다." },
  { q: "진짜 WLBN인지 어떻게 확인하나요?", a: "XRPL 발행 계정 rDJz8WJhsKgydqJzSZXMpsJot3eRmSkR5 에서 발행된 통화 코드 WLBN(16진 574C424E…)만 진짜입니다. 보상 지급용 핫월렛과 트레저리 주소는 사이트 토큰 페이지에 공개되어 있습니다. 트러스트라인을 열기 전에 익스플로러에서 발행 계정을 확인하세요. 다른 발행 계정의 WLBN은 저희와 무관합니다." },
  { q: "관측소 라이선스에는 어떤 등급이 있나요?", a: "관측소 라이선스는 계정당 1개이며 기본형(택손 1000), 제네시스(1001, 1차 구매자 전용·재발행 없음), 지역 한정(1002, 권역 캠페인), 사업 한정(1003, 기업 온보딩)이 있습니다. 기기 NFT는 기기당 1개로 실내 스테이션(3026, ARC-600DA는 STANDARD 등급)과 실외 스테이션(2026)이 있고, 이후 기기군은 추후 공개됩니다." },
];

export const FAQS_EXTRA_EN = [
  { q: "When does it ship, and is shipping charged separately?", a: "The dispatch schedule will be announced separately. We will notify you on Telegram and X two weeks before delivery and collect shipping details then. No delivery details are collected at the reservation stage." },
  { q: "Can I get a refund?", a: "You pay us nothing to pre-reserve, so there is nothing for us to refund — you are free to walk away at any point. Refunds after purchase follow the sale terms, which are published before the sale opens." },
  { q: "What is the Genesis membership?", a: "An observatory license tier granted only to first-sale buyers. One per account, non-transferable, and never issued in later sales. It carries a planned +20% reward bonus and priority on data bounties, and your Genesis number is recorded permanently, with priority in later sales and new services." },
  { q: "What is the license NFT?", a: "There are two kinds. The device NFT comes one per device you buy and is transferable; the observatory license is one per account and marks when you joined (first-sale buyers get Genesis). A device earns rewards only with its device NFT." },
  { q: "What is a trustline?", a: "On the XRPL it is the channel your wallet opens to accept a given token. You need one to receive RLUSD, and we check it automatically during payment. Opening a trustline locks a small XRP reserve in your account — that is not paid to us; it stays in your wallet." },
  { q: "Where do I find my wallet address?", a: "Once signed in, your wallet address appears abbreviated at the top right. Click it to copy the full address." },
  { q: "What kind of token is WLBN?", a: "An XRPL-issued asset (IOU) used for rewards and payments on the network, and a utility token: not equity, a security, a deposit or legal tender. Total supply is 10 billion WLBN, all issued at genesis, with no further issuance under the published policy. Allocation and burn details are published on the token page and in the whitepaper, and every burn is verifiable as an on-chain transaction." },
  { q: "How is the reward budget decided?", a: "For each daily epoch the budget is set first, from the number of active stations and the current phase, then divided among devices that pass the transmission and quality gates. The per-station baseline decreases as phases advance, and any unpaid share is redistributed or burned. The formula is published in the whitepaper; amounts and value are not guaranteed." },
  { q: "Can one person take all the rewards?", a: "No. There is a cap on what a single device can receive per day; anything above the cap is redistributed to other devices or burned. The exact cap is set out in the reward policy in the whitepaper." },
  { q: "If my data is sold, does my personal information leak?", a: "We measure air quality only and collect nothing that identifies a person. Data that is sold or queried goes through de-identification — location and time are generalized and identifiers rotated — and responses carry cohort statistics rather than individual devices." },
  { q: "Can I use the device without taking rewards?", a: "Yes. Set the rewards aside and it is an indoor air quality monitor showing CO₂, particulates, temperature and humidity in real time. You can mint the license NFT whenever you want to start earning." },
  { q: "What device is it?", a: "The ARC-600DA indoor air quality monitor. It measures CO₂, particulates, temperature and humidity, and carries Korean KC certification and performance certification. Full specifications are on the site." },
  { q: "Why only once, and only briefly?", a: "Genesis is a one-time sale in the early days of the mainnet, and it is never reissued. It exists to mark those who joined first, so the same credential will not be opened again later." },
  { q: "Can I buy fewer than I reserved?", a: "Yes. In the priority window you can take as few as you like, up to the quantity you reserved. There is no obligation to buy the full amount." },
  { q: "Can I change or cancel my reservation after applying?", a: "Reservations cannot be changed or cancelled once submitted. Applying is how we gauge demand, not a commitment to buy — and since you can take as few as you like in the purchase window, there is no need to change it." },
  { q: "Can I move the wallet created with Google to another wallet?", a: "A wallet created with a Google account cannot be exported — there is no mnemonic or private key to move elsewhere. To hold its NFT somewhere else, connect an external personal wallet and transfer the NFT to it." },
  { q: "Can I pay by card?", a: "Yes. The September 15 sale accepts Korean domestic cards (pay, debit and credit) as well as RLUSD from an XRPL wallet. There is no payment at the reservation stage." },
  { q: "How do I get an XRP SEOUL 2026 ticket?", a: "200 device buyers will be drawn to receive an XRP SEOUL 2026 ticket, one per person. Buying only the card-type wallet does not qualify." },
  { q: "What is the D'CENT card-type wallet?", a: "An optional add-on. It costs KRW 70,000 (list KRW 80,000), card payment only. It is unrelated to the device NFT or the reservation voucher and does not qualify for the ticket draw." },  { q: "How is WLBN allocated?", a: "Of the 10 billion total: node rewards phase 1 28%, node rewards phase 2 18% (opened only if the phase-10 gate is passed, otherwise burned), scheduled burn 25%, liquidity provision (LP) 8%, team 6% (12-month cliff, then 48-month linear vesting), ecosystem 5%, strategic investors 5% (nothing unlocked at TGE) and liquidity reserve 5%. Conditions and timing are on the token page and in the whitepaper." },
  { q: "How is WLBN burned?", a: "In several ways. The scheduled-burn allocation (25% of total supply) is burned in four tranches, bought-back tokens are burned, and half of the WLBN paid for data sales is burned automatically. Rewards withheld for quality shortfalls and any unopened phase-2 rewards are also burned. Every burn is recorded as an on-chain transaction." },
  { q: "When will WLBN be listed on an exchange?", a: "There is no set date; it follows the milestone gates published in the whitepaper. No exchange listing takes place in the early gates (G1 to G3). The XRPL DEX opens at G4, which requires 25,000 devices sold and 80% uptime over three months. Regional exchanges are considered at G5 and global exchanges at G9. Nothing about listing timing or price is promised." },
  { q: "Can I withdraw or send accrued WLBN right away?", a: "Until withdrawals open, rewards accrue as points in your account and do not move on-chain. Under the whitepaper policy there is no on-chain transfer before the DEX opens (G4), and the withdrawal opening date will be announced separately. After that you can claim them to your wallet." },
  { q: "Will the WLBN price go up?", a: "We do not give any outlook on price or value. WLBN is a utility token for rewards and payments on the network; the company does not guarantee its price and is not soliciting investment (Terms, Article 7). Please base a purchase decision on the monitor's own usefulness." },
  { q: "Who operates and sells this, and what is KWeather's role?", a: "The service, and WLBN issuance and reward policy, are run by Wellbian Labs Pte. Ltd., a Singapore company (Terms, Article 3). KWeather Co., Ltd. is the device partner: it supplies the monitors, certifies quality and provides technical support, and handles domestic distribution, sales, installation, after-sales service and customer support on the company's behalf (Article 4). Device, installation and after-sales enquiries in Korea go to KWeather." },
  { q: "How do I check that WLBN is genuine?", a: "Only WLBN issued by the XRPL account rDJz8WJhsKgydqJzSZXMpsJot3eRmSkR5 (currency code WLBN, hex 574C424E…) is genuine. The hot wallet used for reward payouts and the treasury address are published on the token page. Check the issuer on an explorer before opening a trustline; WLBN from any other issuer has nothing to do with us." },
  { q: "What observatory license tiers are there?", a: "Observatory licenses are one per account: Standard (taxon 1000), Genesis (1001, first-sale buyers only, never reissued), Regional (1002, area campaigns) and Business (1003, enterprise onboarding). Device NFTs are one per device: Indoor Station (3026; the ARC-600DA is the STANDARD grade) and Outdoor Station (2026), with later device families to be announced." },
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
