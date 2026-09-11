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
  { k: "커스터디 (Anchorage·Fireblocks·BitGo)", v: "디센트가 지갑 파트너다. 대안 비교 대화를 여는 것 자체가 신호가 된다 — BitGo·Fireblocks 만 남기고 명함까지." },
  { k: "타 체인 (솔라나·트론·NEAR·모나드·카르다노·에이브·커브·에테나·펜들·스타크웨어 등)", v: "9/30 까지 멀티체인 신호 금지. 판매 종료 뒤 역할 정의가 서면 그때 본다." },
  { k: "시세·트레이딩 축 (KBW 연사 다수)", v: "가격 레이스는 답글·인용 전부 패스가 우리 판단표다. 지도에 올리면 손이 간다." },
  { k: "정치 인사", v: "정치 담론 무반응 규칙. 행사에서 마주쳐도 우리 계정으로 다루지 않는다." },
  { k: "이름이 캡처에 없던 상대", v: "직함·소속으로만 적었다. 서우가 대상을 안다." },
  { k: "범용 VC·인프라 (Apeiron·DACM·Ethereal·Spartan·Pantera·Primitive·Folius·1kx·Hack VC·Alliance·Maelstrom·Alchemy·DoubleZero 등)", v: "DePIN 특화가 아니면 a16z·Dragonfly·Multicoin 셋으로 대표한다. 같은 질문을 열 곳에 하지 않는다." },
  { k: "스포츠·연예 인사", v: "우리 무대가 아니다." },
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
    id: "katie", name: "Katie Harries", org: "Coinbase", role: "Director & Head of Policy, Europe & Americas (ex-US)",
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
    id: "sara", name: "Sara Xi", org: "Water.org", role: "이사 (Rubicon Carbon CPO)",
    lane: "impact", stance: "open", via: "Katie Harries 소개 우선",
    why: "크립토·핀테크 배경의 이사라 제품 질문이 통한다.",
    next: "Katie 소개가 열리면 그 경로로, 7일 안에 안 되면 직접 노트.",
  },
  {
    id: "benjamin", name: "Benjamin Albert", org: "Water.org / Get Blue", role: "Head of Corporate Partnerships",
    lane: "impact", stance: "open",
    why: "파트너 접수 실무 책임자. 파트너 기준을 묻는 자리.",
    next: "질문형 노트 발송. 게리 언급은 하지 않는다.",
  },
  {
    id: "victoria", name: "Victoria Mei", org: "MoonPay", role: "소셜미디어·크리에이터",
    lane: "voice", stance: "open",
    why: "해외 KOL 아웃바운드 첫 대상. 온램프 회사 소속이라 결제 축과도 닿는다.",
    next: "가벼운 DM 발송분 반응 관찰. 조건·숫자 제시 0.",
  },
  {
    id: "jansen", name: "Charles Jansen", org: "S&P Global", role: "Head of DeFi Transformation",
    lane: "capital", stance: "open", meet: "KBW 9/29~10/1",
    why: "데이터 회사가 온체인으로 가는 사례. 「30년 데이터 회사의 DePIN」 프레임이 그대로 통하는 상대.",
    next: "1촌 노트. 사업 제안이 아니라 사례 비교로 연다.",
  },
  {
    id: "pham", name: "Caroline Pham", org: "MoonPay", role: "—",
    lane: "pay", stance: "open", meet: "KBW 9/29~10/1",
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
    id: "mollin", name: "Brett Mollin", org: "XRPL Foundation", role: "—",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "재단 축. 빌더 파이프라인의 반대편.",
    next: "등록 결과가 나온 뒤 그 경로로 재개.",
  },
  {
    id: "furukawa", name: "Mai Furukawa", org: "XRPL Japan / XRPL Labs", role: "Director",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "일본은 그다음 시장. 다만 지갑 통합 얘기는 꺼내지 않는다(디센트 감수성).",
    next: "등록 결과 뒤. 노트 초안은 준비돼 있다.",
  },

  /* ── 보류 (기관·자본 — 1차 판매 결과 뒤) ──────────────────── */
  {
    id: "wuollet", name: "Guy Wuollet", org: "a16z crypto", role: "General Partner",
    lane: "capital", stance: "hold", meet: "KBW · Swell 연사",
    why: "DePIN 투자 관점. 실적 없이 만나면 한 번뿐인 첫인상을 계획으로 쓴다.",
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
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "BUIDL 이 RLUSD 로 24/7 환매되는 건의 회사 쪽. 다만 그 환매는 XRPL 이 아닌 체인에서 일어난다 — 섞어 말하지 않는다.",
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
    id: "sethi", name: "Arjun Sethi", org: "Payward (Kraken)", role: "Co-CEO",
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
    id: "lambur", name: "Hart Lambur", org: "Risk Labs (UMA)", role: "Co-founder",
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
    id: "lizmartin", name: "Liz Martin", org: "Coinbase Institutional", role: "CEO",
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
    id: "kazmierczak", name: "Marcin Kazmierczak", org: "RedStone / Credora", role: "Co-founder & COO",
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
];
