/* 인맥 지도 (9/11 서우 — "인맥지도 vercel 배포 아직 안 했는데 추가해줘")

   셀럽 사다리(lib/celeb.ts)는 X 계정이 우리 답글을 어디까지 받아줬는가를 센다. 이 지도는 다른 것을
   본다 — **누가 어느 레인에 있고, 우리가 지금 그 사람에게 무엇을 하기로 했는가**. 링크드인·메일·행사로
   여는 관계라 칸(사다리)이 아니라 **자세(stance)** 로 적는다.

   정본은 `depin/intel/business-directions.md`(판정·근거)와 `depin/intel/celeb-ladder.md`(X 축)이다.
   여기 있는 것은 그 화면판이고, 갱신은 이 파일을 고쳐 재배포한다.

   ── 이 화면이 공개되면 안 되는 이유 ─────────────────────────────────
   "누구에게 접근하지 않기로 했는가" 가 적혀 있다. 거래소 보류, 업비트 라인, 정책 담론 무반응 같은
   것들은 내부 판단이지 대외 입장이 아니다. 그래서 판매 사이트가 아니라 **인증이 걸린 관리 화면**에
   둔다(lib/auth.ts). 링크를 외부에 공유하지 말 것.

   ── 넣지 않는 것 ────────────────────────────────────────────────
   · **리플 소속 인물** — 별도 채널로만 다룬다. 이 지도에 올리지 않는다.
   · 이메일 주소·전화번호 — 공개 직함과 소속까지만 적는다.
   · 개인 신상(국적·나이·가족) — 판정에 쓰지 않는 정보는 적지 않는다. */

export type Lane = "xrpl" | "pay" | "capital" | "market" | "peer" | "impact" | "voice" | "exchange";
export type Stance = "talking" | "linked" | "open" | "hold" | "off";

export type Person = {
  /** 화면 정렬·중복 판별용 고유 키 */
  id: string;
  /** 캡처에 이름이 없었던 상대는 직함으로만 적는다(서우가 대상을 안다) */
  name: string;
  org: string;
  role: string;
  lane: Lane;
  stance: Stance;
  /** 왜 이 사람인가 — 우리 레인과 닿는 지점 한 줄 */
  why: string;
  /** 지금 하기로 한 것 */
  next: string;
  /** 경유(공통 1촌·소개자·행사) */
  via?: string;
  /** 대면으로 만날 수 있는 자리 */
  meet?: string;
  /** 서우 계정과의 실제 연결 상태. "팔로우 중" 은 메시지가 바로 가지 않는다 — 1촌과 구분해 적는다 */
  tie?: string;
  /** 회사 보기에서 묶을 상위 조직. 법인이 갈려도 한 회사로 봐야 할 때만 적는다(Coinbase / Coinbase Institutional) */
  group?: string;
  /** X 핸들(@ 없이). 없으면 링크를 만들지 않는다 */
  handle?: string;
};

export const NETWORK_UPDATED = "2026-09-11";

export const LANES: { key: Lane; label: string; note: string }[] = [
  { key: "xrpl",     label: "XRPL 생태계",   note: "빌더 파이프라인·재단·지역 커뮤니티. 우리 무대가 여기다" },
  { key: "pay",      label: "결제·온램프",   note: "해외 구매자가 RLUSD 로 내는 경로. 2차 판매 설계의 축" },
  { key: "capital",  label: "기관·자본",     note: "토큰화·커스터디·DePIN 투자. 1차 판매 결과가 나온 뒤가 대화 시점" },
  { key: "market",   label: "데이터 수요",   note: "오라클·예측시장·파생 — 정산에 조작 불가 실측이 필요한 자리다(5축×6축)" },
  { key: "peer",     label: "동종 DePIN",    note: "개인이 실물 기기를 설치하는 같은 구조. 배울 것과 선 그을 것이 같이 있다" },
  { key: "impact",   label: "임팩트·데이터", note: "Get Blue·개발금융. 날씨 데이터가 공공 문제에 붙는 자리" },
  { key: "voice",    label: "미디어·KOL",    note: "커버리지와 사상가. 규칙은 답글 수칙 그대로" },
  { key: "exchange", label: "거래소",        note: "9/30 까지 사업 메시지를 먼저 열지 않는다. 인사는 허용" },
];

export const STANCES: { key: Stance; label: string; note: string }[] = [
  { key: "talking", label: "대화 중",     note: "상대가 시간을 냈거나 왕복이 진행 중" },
  { key: "linked",  label: "연결됨",      note: "1촌이지만 아직 본 대화를 열지 않음" },
  { key: "open",    label: "여는 중",     note: "우리가 먼저 연다 — 초안이 준비됐거나 발송됨" },
  { key: "hold",    label: "보류",        note: "조건이 붙어 있다. 조건이 풀리면 연다" },
  { key: "off",     label: "열지 않음",   note: "규칙상 우리가 먼저 열지 않는다" },
];

/** 지도에 올리지 않은 것과 이유 — 화면 하단에 그대로 보인다 */
export const EXCLUDED: { k: string; v: string }[] = [
  { k: "리플 소속", v: "이 지도에 올리지 않는다(9/11 라인업에도 있었다). 별도 채널로만 다룬다." },
  { k: "커스터디", v: "디센트가 지갑 파트너다. 대안 비교 대화를 여는 것 자체가 신호가 된다 — BitGo·Fireblocks 만 남기고 명함까지." },
  { k: "타 체인 프로젝트", v: "솔라나·트론·NEAR·모나드 등. 9/30 까지 멀티체인 신호 금지 — 판매 종료 뒤 역할 정의가 서면 그때 본다." },
  { k: "시세·트레이딩 축 (KBW 연사 다수)", v: "가격 레이스는 답글·인용 전부 패스가 우리 판단표다. 지도에 올리면 손이 간다." },
  { k: "정치 인사", v: "정치 담론 무반응 규칙. 행사에서 마주쳐도 우리 계정으로 다루지 않는다." },
  { k: "이름이 캡처에 없던 상대", v: "직함·소속으로만 적었다. 서우가 대상을 안다." },
  { k: "범용 VC·인프라 다수", v: "DePIN 특화가 아니면 a16z·Dragonfly·Multicoin 셋으로 대표한다. 같은 질문을 열 곳에 하지 않는다." },
  { k: "스포츠·연예 인사", v: "우리 무대가 아니다." },
  { k: "빅테크·유명인 팔로우", v: "팔로우는 정보 소비이지 관계가 아니다. 지도에 올리면 없는 자산이 있는 것처럼 보인다." },
  { k: "거래소 실무진 팔로우", v: "9/30 규칙 그대로. 팔로우는 유지하되 지도에는 회사 대표 카드만 둔다." },
];

/* ── 자리(행사) ────────────────────────────────────────────────────────
   서우가 행사 명단을 계속 보내 온다. 실제 질문은 "누가 나오나" 가 아니라 **"어디에 갈 것인가"** 다.
   그래서 행사도 판정을 붙여 둔다 — 명단을 다 옮기면 수첩이 아니라 팸플릿이 된다.

   `match` 는 사람 카드의 `meet` 문자열과 맞춰 보는 말이다. 비어 있으면 아직 우리 사람이 없는 자리다. */
export type EventStance = "ours" | "going" | "watch" | "skip";

export type Stage = {
  key: string;
  name: string;
  when: string;
  where: string;
  stance: EventStance;
  note: string;
  /** 사람의 meet 에 들어 있는 말. 없으면 연결된 사람이 아직 없다 */
  match?: string;
};

export const EVENT_STANCES: { key: EventStance; label: string }[] = [
  { key: "ours", label: "우리 무대" },
  { key: "going", label: "가는 중" },
  { key: "watch", label: "관찰" },
  { key: "skip", label: "이번엔 아님" },
];

export const STAGES: Stage[] = [
  {
    key: "seoul", name: "XRP SEOUL 2026", when: "10/3", where: "그랜드 하얏트 서울",
    stance: "ours", match: "10/3",
    note: "케이웨더가 플래티넘 스폰서. 무대에서 기기가 측정하고 원장에 쓰는 것을 보인다. 이 자리 뒤에야 우리는 계획이 아니라 물건으로 말할 수 있다 — 여러 대화의 시점을 여기에 맞춰 두었다.",
  },
  {
    key: "swell", name: "Swell 2026", when: "10/27~29", where: "뉴욕 The Shed",
    stance: "going", match: "Swell",
    note: "서우 참석 준비 중. XRPL Apex(개발자 서밋) 통합. 보류해 둔 XRPL 인사 넷이 이 자리에 있어, 빌더 파이프라인 등록 결과가 나오면 대면으로 한 번에 푼다.",
  },
  {
    key: "hack", name: "XRPL 해커톤 (Commons 주관)", when: "10/24~25", where: "뉴욕",
    stance: "going", match: "해커톤",
    note: "Swell 과 같은 주다. Odelia 통화를 대면으로 올릴 수 있는 자리이고, 마스터카드도 참여를 공표했다. 뉴욕행이 서면 이틀을 붙여 쓴다.",
  },
  {
    key: "kbw", name: "KBW 2026", when: "9/29~10/1", where: "워커힐 서울",
    stance: "watch", match: "KBW",
    note: "우리 부스도 연사도 없다. 업비트 메인 스폰서, 9/29 는 비공개 기관 포럼. **이 방문객이 이틀 뒤 10/3 의 관객**이라는 것이 우리에게 KBW 의 뜻이다. 연사 컨택은 1차 판매 결과(9/16) 뒤에.",
  },
  {
    key: "unbw", name: "UN Blockchain Week 2026", when: "9/10~19 (진행 중)", where: "뉴욕",
    stance: "skip",
    note: "UNGA 와 겹치는 열흘. **하필 1차 판매 주간(9/15~16)이라 갈 수 없다.** 연사층도 소형 프로젝트·개인 중심이라 우리 레인과 멀다. 다만 UN 계열 자리가 블록체인에 열려 있다는 신호는 남는다 — 임팩트 축(UNDP·UNICEF)은 사람으로 따로 잡았다.",
  },
  {
    key: "nordic", name: "Nordic Blockchain Association 컨퍼런스", when: "미확인", where: "북유럽",
    stance: "watch",
    note: "명단에 **UNDP AltFinLab·UNICEF 블록체인 담당**이 있다 — 우리 임팩트 축과 같은 세계다. 행사 자체보다 그 두 사람이 값이다. 날짜·장소는 확인하지 않았다.",
  },
  {
    key: "daf-ny", name: "EBC Digital Assets Forum New York", when: "미확인", where: "뉴욕",
    stance: "watch",
    note: "프랭클린템플턴 디지털자산 총괄·IMF·블랙록·씨티. 기관 토큰화 축이라 우리 단계와는 멀지만, **RLUSD 를 쓰는 이유를 설명할 때 인용하는 사실들이 여기서 나온다**.",
  },
  {
    key: "daweek", name: "Digital Assets Week London 2026", when: "미확인", where: "런던",
    stance: "skip",
    note: "영국 재무부·영란은행·미 SEC 크립토 태스크포스·JP모건·바클리스·HSBC. 명단은 최상급이지만 전부 은행·자산운용의 토큰화 담당이다. **하드웨어를 파는 우리가 지금 그 방에서 할 말이 없다.** 리플 소속 연사도 있어 규칙상 지도에 올리지 않는다.",
  },
  {
    key: "btc26", name: "Bitcoin 2026", when: "4/27~29", where: "미국",
    stance: "skip",
    note: "비트코인 축이라 레인이 다르고 시점도 우리 판매 사이클 밖이다. Kalshi·로빈후드처럼 겹치는 이름은 이미 사람으로 잡혀 있다.",
  },
];

export const PEOPLE: Person[] = [
  /* ── 대화 중 ───────────────────────────────────────────── */
  {
    id: "odelia", name: "Odelia Torteman", org: "XRPL Commons", role: "Head of Digital Assets",
    lane: "xrpl", stance: "talking", via: "Katie Harries 와 공통 1촌", meet: "NYC 해커톤 10/24~25",
    why: "그가 먼저 시간을 청했다. Commons 기관 사례에서 비어 있는 칸 = 비금융 실물이고, 전 직함(Corporate Adoption)이 곧 우리 유형이다.",
    next: "메일 발송 → 통화는 10/3 무대 뒤. 준비 문서 content/xrpl-commons-call-prep.md",
  },
  {
    id: "karan", name: "Karan", org: "독립 KOL", role: "X · YouTube", handle: "KingKaran",
    lane: "voice", stance: "talking",
    why: "플레어 코리아에서 기기를 보고 자발 게시 → 유료 제휴를 먼저 타진해 왔다. 유럽 축 후보.",
    next: "할인코드 대신 판매당 커미션 여부를 그에게 묻는다(F). 그가 택하면 조건 다섯을 붙인다(E).",
  },
  {
    id: "cryptocom", name: "(이름 미기재)", org: "Crypto.com", role: "홍콩 측 담당자",
    lane: "exchange", stance: "talking",
    why: "인바운드. 거래소 카테고리지만 청취는 기조(9/9)대로 진행한다.",
    next: "9/11 임원 동석 콜. 상장·유료·독점·물량 전부 유보. 미팅 사실은 공개 채널에 올리지 않는다.",
  },

  /* ── 연결됨 ───────────────────────────────────────────── */
  {
    id: "katie", name: "Katie Harries", org: "Coinbase", group: "Coinbase", role: "Director & Head of Policy, Europe & Americas (ex-US)",
    lane: "exchange", stance: "linked",
    why: "Sara Xi 와 공통 1촌 = Water.org 소개 경로. 영국 가상자산 협의회 의장이라 유럽 판로에서도 값이 있다.",
    next: "인사 + Sara 소개 부탁 + APAC·미국 정책 카운터파트 문의. 사업 메시지 0, 요청 0.",
  },
  {
    id: "paloma", name: "Paloma Soria Brown", org: "Bybit", role: "Card + Pay 파트너십·이벤트 글로벌 리드",
    lane: "exchange", stance: "hold",
    why: "결제 BD. 2차 판매 해외 결제 설계 때 결제 관점으로 다시 본다.",
    next: "사업 메시지 없음. 인사만 허용. 게시물 반응으로 관계 유지.",
  },
  {
    id: "daria", name: "Daria Vasiuta", org: "Bybit", role: "CIS 지역 마케팅 헤드",
    lane: "exchange", stance: "hold",
    why: "담당 지역이 CIS·동유럽이라 우리 시장과 접점이 없다.",
    next: "인사만. 그가 먼저 열면 듣는다.",
  },
  {
    id: "emily", name: "Emily Yang", org: "Binance", role: "APAC 파트너십",
    lane: "exchange", stance: "hold",
    why: "결제·온오프램프 BD. 우리는 그가 찾는 라이선스 결제사가 아니다.",
    next: "1촌 요청만 두고 메시지 없음. 2차 판매 해외 결제 검토 때 재판단.",
  },
  {
    id: "tina", name: "Tina Lee", org: "BYDFi", role: "BD",
    lane: "exchange", stance: "hold",
    why: "거래소 BD 카테고리 첫 사례.",
    next: "추가 컨택 없음.",
  },

  /* ── 여는 중 ───────────────────────────────────────────── */
  {
    id: "mastercard", name: "(이름 미기재)", org: "Mastercard", role: "Director, Product Management — Mastercard Move",
    lane: "pay", stance: "open",
    why: "R3(중앙은행 디지털화폐) → 유럽 CSD 담보 → Move 규제 시장 국경간. 규제 기관이 분산원장을 만나는 지점을 세 각도에서 본 사람이고, 그게 우리 지형이다.",
    next: "1촌 노트는 지금, 통화는 9/16 뒤. 통합 제안 0, 요청 0, 스테이블코인 브랜드 미기재.",
    meet: "NYC 10/24~29 주간(해커톤·Swell)",
  },
  {
    id: "gary", name: "Gary White", org: "Water.org / Get Blue", role: "CEO",
    lane: "impact", stance: "open", meet: "Swell 10/27~29 연사",
    why: "Get Blue 가 AccuWeather 를 파트너로 둔다. 그 자리의 한국·아시아판이 케이웨더다.",
    next: "1촌 수락 대기. 7일 무응답이면 COO 경로.",
  },
  {
    id: "sara", name: "Sara Xi", org: "Water.org / Get Blue", role: "이사 · Chief Product Officer · 크립토·핀테크·AI 자문",
    lane: "impact", stance: "linked", tie: "서우 팔로우 중", via: "Katie Harries 공통 1촌",
    why: "크립토·핀테크 배경의 이사라 제품 질문이 통한다. **이미 팔로우 중** — Katie 소개를 기다리는 전제가 흔들린다.",
    next: "⚠ 1촌 여부를 먼저 확인한다. 1촌이면 소개 없이 바로 메시지가 가고, Katie 에게는 부탁 대신 인사만 남는다.",
  },
  {
    id: "benjamin", name: "Benjamin Albert", org: "Water.org / Get Blue", role: "Head of Corporate Partnerships",
    lane: "impact", stance: "linked", tie: "서우 팔로우 중",
    why: "파트너 접수 실무 책임자. **이미 팔로우 중이다** — 콜드 노트가 아니라 이어 가는 메시지로 쓴다.",
    next: "질문형 메시지 발송. 게리 언급은 하지 않는다.",
  },
  {
    id: "victoria", name: "Victoria Mei", org: "MoonPay", role: "소셜미디어·크리에이터",
    lane: "voice", stance: "open",
    why: "해외 KOL 아웃바운드 첫 대상. 온램프 회사 소속이라 결제 축과도 닿는다.",
    next: "가벼운 DM 발송분 반응 관찰. 조건·숫자 제시 0.",
  },
  {
    id: "jansen", name: "Charles Jansen", org: "S&P Global", role: "DeFi and Digital Assets",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중", meet: "KBW 9/29~10/1",
    why: "데이터 회사가 온체인으로 가는 사례. 「30년 데이터 회사의 DePIN」 프레임이 그대로 통하는 상대.",
    next: "1촌 노트. 사업 제안이 아니라 사례 비교로 연다.",
  },
  {
    id: "pham", name: "Caroline D. Pham", org: "MoonPay", role: "CEO, MoonPay Institutional · CLO & CAO",
    lane: "pay", stance: "linked", tie: "서우 팔로우 중", meet: "KBW 9/29~10/1",
    why: "해외 구매자 RLUSD 온램프. XRPL 네이티브 온램프를 먼저 본다는 우리 방침과 같은 자리.",
    next: "1촌 노트만. 본 대화는 2차 판매 해외 결제 설계 때.",
  },
  {
    id: "hugo", name: "Hugo Philion", org: "Flare", role: "CEO",
    lane: "xrpl", stance: "open", via: "플레어 코리아 경유 · 케이웨더 명의", meet: "XRP SEOUL 10/3 · Swell",
    why: "9/5 워크숍 주체가 케이웨더 × 플레어다. 웜 경로가 이미 있다.",
    next: "웜 노트 진행. 웰비안 × 플레어 직접 통합 클레임은 하지 않는다.",
  },

  /* ── 보류 (XRPL 축 — 빌더 파이프라인 등록 결과 대기) ──────────── */
  {
    id: "bchiri", name: "David Bchiri", org: "XRPL Commons", role: "—",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "Commons 축. 우선순위 1번이었다.",
    next: "Odelia 대화가 열렸으므로 개별 노트 대신 그 경로로 소개받는다.",
  },
  {
    id: "hussenet", name: "Thomas Hussenet", org: "XRPL Commons", role: "—",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "Commons 축.", next: "Odelia 경로로 통합.",
  },
  {
    id: "mollin", name: "Brett Mollin", org: "XRPL Foundation", group: "XRPL 재단·커뮤니티", role: "—",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "재단 축. 빌더 파이프라인의 반대편.",
    next: "등록 결과가 나온 뒤 그 경로로 재개.",
  },
  {
    id: "furukawa", name: "Mai Furukawa", org: "XRPL Japan / XRPL Labs", group: "XRPL 재단·커뮤니티", role: "Director",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "일본은 그다음 시장. 다만 지갑 통합 얘기는 꺼내지 않는다(디센트 감수성).",
    next: "등록 결과 뒤. 노트 초안은 준비돼 있다.",
  },

  /* ── 보류 (기관·자본 — 1차 판매 결과 뒤) ──────────────────── */
  {
    id: "wuollet", name: "Guy Wuollet", org: "a16z crypto", role: "General Partner",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중", meet: "KBW · Swell 연사",
    why: "이미 팔로우 중이라 콜드가 아니다. DePIN 투자 관점. 실적 없이 만나면 한 번뿐인 첫인상을 계획으로 쓴다.",
    next: "1차 판매 결과(9/16) 뒤.",
  },
  {
    id: "hadick", name: "Rob Hadick", org: "Dragonfly", role: "General Partner",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "DePIN·인프라 투자.", next: "9/16 뒤, 숫자를 들고.",
  },
  {
    id: "qureshi", name: "Haseeb Qureshi", org: "Dragonfly", role: "Managing Partner",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "같은 하우스. 한 하우스에 둘을 동시에 열지 않는다.",
    next: "Hadick 쪽이 열리면 그 경로로.",
  },
  {
    id: "applebaum", name: "Spencer Applebaum", org: "Multicoin Capital", role: "GP & Co-Head of Venture",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "DePIN 섹터의 대표 투자사. 「층이 다르다」(망 vs 기기) 구분을 가장 빨리 알아들을 상대.",
    next: "9/16 뒤. 헬륨 비교 질문에 대한 답을 먼저 정리하고 연다.",
  },
  {
    id: "johnson", name: "Jenny Johnson", org: "Franklin Templeton", role: "CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "sgBENJI 발행사. 싱가포르 은행의 디지털 거래소가 그 토큰화 MMF 를 RLUSD 와 나란히 상장했다 — 우리 「왜 RLUSD」 논거의 당사자다.",
    next: "격이 맞지 않는 자리. 사례 인용으로만 쓰고 컨택은 하지 않는다.",
  },
  {
    id: "sharma", name: "Nikhil Sharma", org: "BlackRock", role: "Director, Digital Assets",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중", meet: "KBW 9/29~10/1",
    why: "서우가 이미 팔로우 중이다(BlackRock 디지털자산 쪽을 넷 팔로우). BUIDL 이 RLUSD 로 24/7 환매되는 건의 회사 쪽. 다만 그 환매는 XRPL 이 아닌 체인에서 일어난다 — 섞어 말하지 않는다.",
    next: "컨택 없음. 배경 지식으로만.",
  },
  {
    id: "rooz", name: "Yuval Rooz", org: "Canton", role: "Co-founder & CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "JPM 토큰화 예금이 Canton 이다. 우리 정산은 XRPL — 커뮤니티가 자주 섞는 지점이라 구분해 둔다.",
    next: "컨택 없음.",
  },
  {
    id: "oldenburg", name: "Amy Oldenburg", org: "Morgan Stanley", role: "Head of Digital Asset Strategy",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "기관 디지털자산 전략. 우리 단계와 거리가 멀다.",
    next: "컨택 없음. 무대 발언만 관찰.",
  },
  {
    id: "belshe", name: "Mike Belshe", org: "BitGo", role: "Co-founder & CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "커스터디. 디센트가 지갑 파트너라 대안 비교는 감수성이 있다.",
    next: "명함까지. 커스터디 비교 대화는 열지 않는다.",
  },
  {
    id: "heinrich", name: "Michael Heinrich", org: "0G Labs", role: "Founder & CEO",
    lane: "capital", stance: "hold",
    why: "탈중앙 데이터 레이어. 데이터 판매 구조에서 겹칠 여지가 있다.",
    next: "타 체인 신호라 9/30 뒤.",
  },

  /* ── 보류 (데이터 수요 — 5축×6축) ───────────────────────── */
  {
    id: "coplan", name: "Shayne Coplan", org: "Polymarket", role: "Founder & CEO",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "날씨 예측시장의 정산에는 조작 불가 실측이 필요하다. 우리 교차검증 관측망이 그 정산 기준 후보다 — 확정 포지셔닝의 5축×6축 연결이 정확히 여기다.",
    next: "관측망 실적이 없는 동안은 대화가 성립하지 않는다. 기기가 돌기 시작한 뒤.",
  },
  {
    id: "wang", name: "John Wang", org: "Kalshi", role: "Head of Crypto",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "규제 시장 쪽 예측시장. 같은 논리이고 정산 기준 요구가 더 엄격하다.",
    next: "동일 — 실측 실적 뒤.",
  },

  /* ── 보류·열지 않음 (미디어·사상가) ──────────────────────── */
  {
    id: "cermak", name: "Larry Cermak", org: "The Block", role: "President",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "영문 리서치·미디어. 10/3 실물 시연 뒤에 커버리지 후보.",
    next: "9/16·10/3 결과가 나온 뒤. 지금 열면 계획을 파는 게 된다.",
  },
  {
    id: "balaji", name: "Balaji Srinivasan", org: "The Network State", role: "Founder",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "씬 사상가 층. 테제 글에만 붙는다.",
    next: "테제 글이 우리 레인에 닿을 때 1회. 상품 얘기 0.",
  },
  {
    id: "pozsar", name: "Zoltan Pozsar", org: "Ex Uno Plures", role: "Founder & CEO",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "통화 시스템 논지가 「왜 RLUSD」 소재와 결이 맞는다. 다만 우리는 그 무대에서 발화 권위가 없다.",
    next: "소재로만 축적. 답글은 열지 않는다.",
  },
  {
    id: "chervinsky", name: "Jake Chervinsky", org: "Hyperliquid Policy Center", role: "CEO",
    lane: "voice", stance: "off", meet: "KBW 9/29~10/1",
    why: "정책·규제 담론.",
    next: "정치·규제 담론 무반응 규칙. 열지 않는다.",
  },

  /* ── 열지 않음 (거래소, 9/30 전) ────────────────────────── */
  {
    id: "teng", name: "Richard Teng", org: "Binance", role: "Co-CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소 최상위. 공표 근거는 백서 게이트(초기 단계 상장 금지).",
    next: "열지 않는다.",
  },
  {
    id: "starxu", name: "Star Xu", org: "OKX", role: "Founder & CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소.", next: "열지 않는다.",
  },
  {
    id: "rafique", name: "Haider Rafique", org: "OKX", role: "Managing Partner & CMO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소 마케팅. 직무 불문 같은 판정이다.",
    next: "열지 않는다.",
  },
  {
    id: "sethi", name: "Arjun Sethi", org: "Kraken (Payward)", role: "Co-CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소.", next: "열지 않는다.",
  },
  {
    id: "upbit-cbio", name: "SeonJoo Yoon", org: "업비트", role: "CBIO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1 (메인 스폰서)",
    why: "업비트 건은 11월 트랙 담당 라인의 별건이다. 우리가 옆에서 열면 그 트랙이 꼬인다.",
    next: "열지 않는다. 필요하면 담당 라인을 통해서만.",
  },
  {
    id: "upbit-ceo", name: "Kyoungsuk Oh", org: "업비트", role: "CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1 · 9/29 비공개 기관 포럼",
    why: "사용자 레벨이 아니다.",
    next: "열지 않는다.",
  },

  /* ── 9/11 2차 라인업 추가 ────────────────────────────────
     우리 레인에 닿는 사람만 옮겼다. 타 체인·DeFi·범용 VC 는 아래 EXCLUDED 규칙대로 뺀다. */
  {
    id: "lambur", name: "Hart Lambur", org: "Risk Labs · UMA", role: "Co-founder",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "옵티미스틱 오라클로 예측시장 정산을 붙이는 쪽. 「무엇이 참인지 어떻게 정하는가」 가 곧 그의 문제이고, 날씨 항목에서는 그 답이 실측이다 — 이번 라인업에서 우리 5축과 가장 가까운 자리다.",
    next: "기기가 돌기 시작한 뒤. 그 전에는 우리가 내놓을 관측 실적이 없다.",
  },
  {
    id: "zabaneh", name: "May Zabaneh", org: "PayPal", role: "SVP",
    lane: "pay", stance: "hold", meet: "KBW 9/29~10/1",
    why: "소비자 결제 대기업의 디지털자산 축. Mastercard 건과 같은 레인이라 한쪽이 열리면 다른 쪽 질문이 정리된다.",
    next: "Mastercard 쪽 대화가 먼저. 두 곳을 동시에 열지 않는다.",
  },
  {
    id: "cascarilla", name: "Charles Cascarilla", org: "Paxos", role: "Co-founder & CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "규제 스테이블코인 발행 구조. 우리는 RLUSD 로 정산하므로 발행사 비교 대화는 열지 않는다 — 배경 지식으로만.",
    next: "컨택 없음.",
  },
  {
    id: "schmidt", name: "Tom Schmidt", org: "Dragonfly", role: "General Partner",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "DePIN 투자. Hadick·Qureshi 와 같은 하우스다.",
    next: "한 하우스에 한 사람만. 9/16 뒤 Hadick 경로로.",
  },
  {
    id: "wrynn", name: "Kathleen Wrynn", org: "Invesco", role: "Global Head of Digital Assets",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "자산운용의 디지털자산 총괄. 우리 단계와 거리가 멀다.",
    next: "컨택 없음. 무대 발언만 관찰.",
  },
  {
    id: "bessette", name: "Cynthia Lo Bessette", org: "Fidelity Investments", role: "Head of Digital Asset Management",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "같은 이유. 기관 수요의 온도를 읽는 자리다.",
    next: "컨택 없음.",
  },
  {
    id: "ippolito", name: "Michael Ippolito", org: "Blockworks", role: "Co-founder",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "영문 미디어·리서치. The Block 과 같은 층이다.",
    next: "10/3 실물 시연 뒤 커버리지 후보. 지금 열면 계획을 파는 게 된다.",
  },
  {
    id: "svanevik", name: "Alex Svanevik", org: "Nansen", role: "Co-founder & CEO",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "온체인 데이터 분석. 우리 소각·발급이 온체인에 남으므로 언젠가 읽히는 쪽이다.",
    next: "지표가 쌓인 뒤. 우리가 먼저 해석을 들이밀지 않는다.",
  },
  {
    id: "bobbyong", name: "Bobby Ong", org: "CoinGecko", role: "Co-founder & CEO",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "집계·등재 쪽. 등재 논의는 게이트와 얽히므로 9/30 전에는 열지 않는다.",
    next: "열지 않는다.",
  },
  {
    id: "levin", name: "Jonathan Levin", org: "Chainalysis", role: "Co-founder & CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "컴플라이언스·분석. 국내 거주자 대상 해외 발행 구조의 법무 질문과 결이 닿는다.",
    next: "법무 검토가 구체화되면 그때. 지금은 질문이 정리되지 않았다.",
  },
  {
    id: "yatsiu", name: "Yat Siu", org: "Animoca Brands", role: "Co-founder & Executive Chairman",
    lane: "voice", stance: "hold", handle: "ysiu", meet: "KBW 9/29~10/1",
    why: "「자산이 살아 있는 네트워크의 노드가 된다」 는 토큰화 담론 — 우리는 그걸 실물로 한다. X 판단표에서 이미 붙는다로 본 계정이다.",
    next: "X 답글 트랙으로 유지. 링크드인·대면은 따로 열지 않는다.",
  },
  {
    id: "kerbrat", name: "Johann Kerbrat", org: "Robinhood", role: "SVP & GM, Crypto and International",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래·브로커리지. 거래소 카테고리와 같은 판정이다.",
    next: "열지 않는다.",
  },
  {
    id: "lizmartin", name: "Liz Martin", org: "Coinbase Institutional", group: "Coinbase", role: "CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "기관 브로커리지. Katie 와 같은 회사지만 직무가 다르다 — 정책 쪽은 인사, 이쪽은 열지 않는다.",
    next: "열지 않는다. Katie 경로와 섞지 않는다.",
  },
  {
    id: "ferrante", name: "Armani Ferrante", org: "Backpack Exchange", role: "Founder & CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소.", next: "열지 않는다.",
  },

  /* ── 9/11 3차 라인업 — 오라클·동종 DePIN 축이 여기서 나왔다 ────────── */
  {
    id: "horton", name: "Mike Horton", org: "GEODNET", role: "Project Creator",
    lane: "peer", stance: "hold", meet: "KBW 9/29~10/1",
    why: "개인이 실물 기기를 설치하고 측정값으로 보상받는 구조 — 우리와 같은 형태를 먼저 돌린 쪽이다. 층이 다르다는 논리(망 vs 기기)는 헬륨에는 통하지만 여기엔 통하지 않는다. 비교당할 자리이자 배울 자리다.",
    next: "9/16 뒤. 그 전에 「우리는 무엇이 다른가」 를 한 문단으로 세워 둔다 — 실내 공간 · 인증 기기 · 기존 B2B 수요. 답이 준비되기 전에 만나지 않는다.",
  },
  {
    id: "mccormick", name: "Andrew McCormick", org: "Chainlink", role: "Head of Institutional and Market Development",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "오라클은 우리 실측의 수요처다. 「무엇이 참인지」 를 체인에 넣는 쪽이고, 날씨 항목에서 그 입력은 결국 기기에서 온다.",
    next: "관측 지점이 실제로 돌기 시작한 뒤. 지금 열면 데이터 없는 데이터 얘기가 된다.",
  },
  {
    id: "kazmierczak", name: "Marcin Kazmierczak", org: "RedStone", role: "Co-founder & COO (Credora)",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "모듈형 오라클. 체인링크보다 우리 규모에 말을 걸기 쉬운 상대라 오라클 축의 첫 문은 이쪽이 될 수 있다.",
    next: "9/16 뒤 · 오라클 축 첫 접촉 후보 1번. 기술 통합 클레임은 하지 않는다.",
  },
  {
    id: "vicioso", name: "Giovanni Vicioso", org: "CME Group", role: "Global Head of Cryptocurrency Products",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "규제 거래소의 상품 총괄. 날씨 파생은 이미 전통 시장에 있고, 그 정산 기준이 관측값이라는 점이 우리 5축 논지의 뿌리다.",
    next: "컨택 없음. 날씨 파생 정산 기준을 어떻게 쓰는지는 공개 자료로 먼저 읽는다.",
  },
  {
    id: "shaulov", name: "Michael Shaulov", org: "Fireblocks", role: "Co-founder & CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "기관 커스터디. BitGo·앵커리지와 같은 층이다.",
    next: "커스터디 비교 대화는 열지 않는다(디센트 감수성). 명함까지.",
  },
  {
    id: "ossinger", name: "Joanna Ossinger", org: "CNBC", role: "Managing Editor",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "크립토 매체가 아니라 일반 경제 매체. 「30년 기상 기업이 온체인으로」 는 크립토 밖에서 더 잘 읽히는 이야기다.",
    next: "10/3 실물 시연 뒤. 보도자료 문구가 정리된 다음에만(게이트·가치 표현 점검 건 선행).",
  },
  {
    id: "neuner", name: "Ran Neuner", org: "Crypto Banter", role: "Founder",
    lane: "voice", stance: "off", meet: "KBW 9/29~10/1",
    why: "대형 KOL 채널이지만 포맷이 시세·트레이딩 중심이다.",
    next: "열지 않는다. 우리 규칙에서 가격 담론 채널은 무반응이다.",
  },

  /* ── 9/11 서우 링크드인 팔로우 목록에서 (57명 중 우리 레인) ──────────
     팔로우는 1촌과 다르다 — 메시지가 바로 가지 않는다. tie 에 그대로 적고,
     "이미 연결돼 있는데 안 쓰고 있는 관계" 를 드러내는 것이 이 묶음의 값이다. */
  {
    id: "ashnathan", name: "Ash Nathan", org: "Chainlink Labs", role: "Strategic Initiatives — Tokenization, Custody & Prediction Markets",
    lane: "market", stance: "linked", tie: "서우 팔로우 중",
    why: "★ 직함에 **예측시장**이 직접 들어 있다. 우리 5축(날씨 예측시장 정산엔 조작 불가 실측이 필요)의 정확한 상대이고, 체인링크 기관 담당(McCormick)보다 이쪽이 먼저다.",
    next: "오라클 축 1순위. 9/16 뒤, 관측 지점이 돌기 시작하면 연다. 기술 통합 클레임은 하지 않는다.",
  },
  {
    id: "samewen", name: "Sam Ewen", org: "Chainlink Labs", role: "VP, Head of Brand and Ecosystem Marketing",
    lane: "market", stance: "linked", tie: "서우 팔로우 중",
    why: "같은 회사의 생태계·브랜드 쪽. Ash Nathan 이 먼저이고 이쪽은 그다음이다.",
    next: "한 회사에 둘을 동시에 열지 않는다.",
  },
  {
    id: "florian", name: "Florian A.", org: "XRPL Commons", role: "Project & Solutions Manager",
    lane: "xrpl", stance: "linked", tie: "서우 팔로우 중",
    why: "Commons 실무 담당. Odelia(디지털자산 총괄) 대화가 열려 있으니 실행 단계에서 만나게 될 쪽이다.",
    next: "Odelia 통화 뒤. 따로 열지 않는다.",
  },
  {
    id: "t54-cmo", name: "Mangirdas P.", org: "t54 Labs", role: "Chief Marketing Officer",
    lane: "xrpl", stance: "linked", tie: "서우 팔로우 중",
    why: "x402 촉진자 — XRP·RLUSD 로 에이전트 결제를 붙이는 쪽이다. 우리 기계 고객 테제(5c)의 결제 쪽 상대이고 이미 파트너 후보 로스터에 올려 둔 곳.",
    next: "APAC 리드 쪽이 먼저. 자체 대시보드 수치는 외부 검증이 안 되므로 인용하지 않는다.",
  },
  {
    id: "t54-apac", name: "Claire Jiyeon J.", org: "t54 Labs", role: "APAC Regional Lead",
    lane: "xrpl", stance: "linked", tie: "서우 팔로우 중",
    why: "한국어권으로 보이는 APAC 담당. x402 축에서 가장 열기 쉬운 문이다.",
    next: "9/16 뒤 가볍게. 우리 판독값이 에이전트 결제의 입력이 될 수 있는지 듣는 자리 — 통합 제안 아님.",
  },
  {
    id: "asheesh", name: "Asheesh Birla", org: "Evernorth", role: "CEO · XRP Digital Asset Treasury",
    lane: "xrpl", stance: "talking", tie: "구면 · 서우 팔로우 중", handle: "ashgoblue",
    why: "이미 구면이고 X 에서 답글이 오가는 A 티어다. 지도에서 가장 따뜻한 관계인데 링크드인 쪽으로는 쓰지 않고 있었다.",
    next: "X 트랙 유지. 10/3 무대 뒤에 링크드인으로 결과를 한 번 전한다 — 부탁 없이.",
  },
  {
    id: "souza", name: "Antônia Souza", org: "Visa", role: "Crypto Product Director, Latam & Caribbean",
    lane: "pay", stance: "linked", tie: "서우 팔로우 중",
    why: "카드 네트워크의 크립토 상품. 담당 지역이 중남미라 우리 시장과는 멀지만 Mastercard 건과 같은 질문을 던질 수 있는 자리다.",
    next: "Mastercard 쪽이 먼저. 같은 질문을 두 네트워크에 동시에 하지 않는다.",
  },
  {
    id: "mounts", name: "Chuck Mounts", org: "S&P Global", role: "Chief DeFi Officer",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "S&P Global 의 DeFi 총괄 — Charles Jansen 과 같은 회사의 윗선이다. 「전통 신용과 온체인 시장을 잇는다」 가 그의 소개 문구다.",
    next: "Jansen 쪽으로 먼저 열고, 대화가 서면 그 안에서 소개받는다. 윗선을 먼저 치지 않는다.",
  },
  {
    id: "sciuto", name: "Riva Sciuto", org: "Kalshi", role: "Head of External Affairs",
    lane: "market", stance: "linked", tie: "서우 팔로우 중",
    why: "규제 예측시장의 대외 총괄. Kalshi 축에서 실제로 말이 통하는 문이다(연사 명단의 Head of Crypto 보다 이쪽이 열기 쉽다).",
    next: "실측 실적 뒤. 날씨 항목의 정산 기준을 어떻게 정하는지 듣는 자리.",
  },
  {
    id: "allaire", name: "Jeremy Allaire", org: "Circle", role: "Co-founder, Chairman & CEO",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "USDC 발행사. 우리는 RLUSD 로 정산하므로 발행사 비교 대화는 열지 않는다.",
    next: "컨택 없음. 팔로우는 정보 소비다.",
  },
  {
    id: "crow", name: "Matthew Crow", org: "Tether", role: "Head of Regional Expansion",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "같은 이유 — 스테이블코인 발행사 축.",
    next: "컨택 없음.",
  },
  {
    id: "lynnmartin", name: "Lynn Martin", org: "NYSE / ICE", role: "President · Chair, ICE Fixed Income and Data Services",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "거래소보다 **데이터 서비스** 쪽이 우리와 닿는다 — 시장 데이터를 파는 사업의 구조가 우리 B2B 데이터 판매와 같은 모양이다.",
    next: "컨택 없음. 데이터 사업 구조는 공개 자료로 읽는다.",
  },
  {
    id: "davidpark", name: "Hyuckjae David Park", org: "Base", role: "APAC Ecosystem Lead",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "한국어권 APAC 생태계 담당. 다만 Base 는 타 체인이다.",
    next: "9/30 까지 열지 않는다. 멀티체인 신호 금지 규칙.",
  },
  {
    id: "shinhan", name: "장범진", org: "신한은행", role: "IT본부장",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "국내 은행의 IT 총괄. 케이웨더 B2B 축과 닿을 여지가 있고, 국내 결제·원화 경로 질문의 현실 감각을 얻는 자리다.",
    next: "크립토 프레임으로 열지 않는다. 열게 되면 케이웨더 명의·기업 데이터 문맥으로.",
  },
  /* ── 9/11 행사 명단 4종에서 (UN Blockchain Week · Nordic · EBC NY · DA Week London) ──
     수백 명 중 우리 레인에 닿는 여섯만 옮겼다. 명단을 다 넣으면 수첩이 아니라 팸플릿이 된다. */
  {
    id: "mavis", name: "Burcu Mavis", org: "UNDP AltFinLab", role: "Blockchain Academy and Accelerator Lead",
    lane: "impact", stance: "hold", meet: "Nordic 컨퍼런스",
    why: "★ UN 개발계획의 대체금융 랩. 공기질은 공중보건·기후 적응 데이터라 개발금융의 관심사와 바로 닿고, Get Blue·IFC 축과 같은 세계다. 우리 임팩트 레인에서 가장 제도권 쪽 문.",
    next: "Water.org 경로가 먼저 서야 한다 — 실적 없이 UN 계열을 두 곳 동시에 열면 둘 다 가벼워진다.",
  },
  {
    id: "maharajan", name: "Arun Maharajan", org: "UNICEF", role: "Blockchain Lead",
    lane: "impact", stance: "hold", meet: "Nordic 컨퍼런스",
    why: "유니세프의 블록체인 담당. 아동 환경 보건과 실내 공기질은 논거가 이어진다.",
    next: "UNDP 쪽과 같은 대기. 둘 중 하나가 열리면 그 경로로 나머지를 소개받는다.",
  },
  {
    id: "karwan", name: "Liam Karwan", org: "Chainlink Labs", role: "Head of RWA & Stablecoins",
    lane: "market", stance: "hold", meet: "Nordic 컨퍼런스",
    why: "체인링크 세 번째. RWA·스테이블코인 쪽이라 우리 RLUSD 정산과는 닿지만, 오라클 축 1순위는 예측시장을 직함에 단 Ash Nathan 이다.",
    next: "열지 않는다. 한 회사에 셋을 늘어놓되 문은 하나다.",
  },
  {
    id: "kaul", name: "Sandy Kaul", org: "Franklin Templeton", role: "Global Head of Digital Assets",
    lane: "capital", stance: "hold", meet: "EBC Digital Assets Forum NY",
    why: "sgBENJI 발행사의 **실무 총괄**. CEO(Jenny Johnson)보다 이쪽이 말이 통하는 자리다 — 싱가포르 은행 거래소가 그 펀드를 RLUSD 와 나란히 상장한 건이 우리 「왜 RLUSD」 논거의 뿌리다.",
    next: "컨택하지 않는다. 사례 인용으로만 쓰고, 인용할 때도 기관 이름을 호명하지 않는다.",
  },
  {
    id: "adrian", name: "Tobias Adrian", org: "IMF", role: "Director, Digital Asset",
    lane: "impact", stance: "hold", meet: "EBC Digital Assets Forum NY",
    why: "국제통화기금의 디지털자산 총괄. 우리가 말을 걸 자리는 아니지만, 국제기구가 이 레인에 서 있다는 것 자체가 UNDP·IFC 축의 배경이다.",
    next: "컨택 없음. 발언은 소재로 읽는다.",
  },
  {
    id: "batchelor", name: "Ariane Batchelor", org: "Mastercard", role: "Director, Account Management",
    lane: "pay", stance: "hold", meet: "Nordic 컨퍼런스",
    why: "마스터카드 두 번째. 어카운트 관리 쪽이라 Move 프로덕트 디렉터와 직무가 다르다.",
    next: "열지 않는다. 마스터카드는 Move 쪽 한 문으로 간다.",
  },
];
