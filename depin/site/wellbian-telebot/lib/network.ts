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

export type Lane = "xrpl" | "pay" | "capital" | "market" | "peer" | "impact" | "voice" | "exchange" | "compute";
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
  /** 어떤 진행이 서야 이 사람이 열리는가(MILESTONES 의 key). 없으면 지금 열 수 있다 */
  gate?: string;
  /** 상대가 먼저 왔는가. 인바운드 수가 곧 우리 급의 지표다 — 크립토닷컴이 그랬다 */
  inbound?: boolean;
  /** X 핸들(@ 없이). 없으면 링크를 만들지 않는다 */
  handle?: string;
};

export const NETWORK_UPDATED = "2026-09-17";

export const LANES: { key: Lane; label: string; note: string }[] = [
  { key: "xrpl",     label: "XRPL 생태계",   note: "빌더 파이프라인·재단·지역 커뮤니티. 우리 무대가 여기다" },
  { key: "pay",      label: "결제·온램프",   note: "해외 구매자가 RLUSD 로 내는 경로. 2차 판매 설계의 축" },
  { key: "capital",  label: "기관·자본",     note: "토큰화·커스터디·DePIN 투자. 1차 판매 결과가 나온 뒤가 대화 시점" },
  { key: "market",   label: "데이터 수요",   note: "오라클·예측시장·파생 — 정산에 조작 불가 실측이 필요한 자리다(5축×6축)" },
  { key: "peer",     label: "동종 DePIN",    note: "개인이 실물 기기를 설치하는 같은 구조. 배울 것과 선 그을 것이 같이 있다" },
  { key: "impact",   label: "임팩트·데이터", note: "Get Blue·개발금융. 날씨 데이터가 공공 문제에 붙는 자리" },
  { key: "voice",    label: "미디어·KOL",    note: "커버리지와 사상가. 규칙은 답글 수칙 그대로" },
  { key: "exchange", label: "거래소",        note: "9/30 까지 사업 메시지를 먼저 열지 않는다. 인사는 허용" },
  { key: "compute",  label: "AI·컴퓨트",     note: "AI 데이터센터·GPU. 9/14 내부 회의의 AI 팩토리 구상이 실제 과제가 되는 자리 (9/16 신설)" },
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

/* ── 우리 진행(마일스톤)과 게이트 ────────────────────────────────────────
   기본 전략(9/11 서우): **모체는 링크드인 컨택이고 행사는 부수다.** 행사에 가서 사람을 만드는 게
   아니라, 컨택을 쌓아 두고 그 사이에 우리 급이 올라가면 같은 사람에게 다른 대화가 열린다.
   크립토닷컴이 그렇게 됐다 — 우리가 찾아간 게 아니라 저쪽이 왔다.

   그래서 "지금 안 되는 컨택" 을 버리지 않고 **어떤 진행이 서면 열리는지**로 묶어 둔다.
   서우가 `done` 을 켜면 그 게이트에 묶인 사람들이 화면 맨 위 「이제 열 때」로 올라온다.
   진행 내용을 주입하는 곳이 여기 한 줄이라는 게 이 구조의 요점이다.

   ⚠ `done` 은 **실제로 끝난 것만** 켠다. 미리 켜면 실적 없이 문을 열게 되고, 그건 한 번뿐인
   첫인상을 계획으로 쓰는 일이다. */
export type Milestone = {
  key: string;
  label: string;
  when: string;
  /** 서우가 진행 상황을 주입하는 자리. 끝났으면 true */
  done: boolean;
  /** 이게 서면 우리가 들고 갈 수 있는 것 — 대화의 재료가 무엇으로 바뀌는가 */
  proof: string;
};

export const MILESTONES: Milestone[] = [
  { key: "presale", label: "사전예약 마감", when: "9/14 12:00", done: true,
    proof: "예약 수요. 아직 구매가 아니라 관심이다 — 대외로 숫자를 말하지 않는다." },
  { key: "sale1", label: "1차 판매", when: "9/15~16", done: false,
    proof: "실제 구매자와 기기 NFT 발급 실적. **계획이 아니라 결과를 들고 가는 첫 시점.**" },
  { key: "saleend", label: "판매 종료 — 거래소·멀티체인 신호 해제", when: "9/30", done: false,
    proof: "거래소·타 체인 이야기를 먼저 열어도 되는 상태. 그 전까지는 인사만." },
  { key: "stage", label: "XRP SEOUL 무대", when: "10/3", done: false,
    proof: "실물이 측정하고 원장에 쓰는 장면. 영상·사진·트랜잭션 링크 = 설명을 대신하는 물건." },
  { key: "pipeline", label: "XRPL 빌더 파이프라인 등록 결과", when: "미정", done: false,
    proof: "생태계 안쪽 지위. 재단·커뮤니티 인사를 그 경로로 여는 근거." },
  { key: "ship", label: "기기 배송·가동 개시", when: "미정", done: false,
    proof: "**돌아가는 관측 지점**. 오라클·예측시장 대화는 이것 없이는 성립하지 않는다." },
  { key: "data", label: "데이터 판매 실적", when: "미정", done: false,
    proof: "수요처와 매출 구조. 기관·자본 쪽에서 처음으로 대등한 대화가 되는 지점." },
  { key: "sale2", label: "2차 판매 해외 결제 설계", when: "미정", done: false,
    proof: "해외 구매자 온램프가 실제 과제가 된다. 결제사 대화의 명분." },
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
    note: "우리 부스도 연사도 없다. 업비트 메인 스폰서, 9/29 는 비공개 기관 포럼. **이 방문객이 이틀 뒤 10/3 의 관객**이라는 것이 우리에게 KBW 의 뜻이다. 연사 컨택은 1차 판매 결과(9/16) 뒤에. ⚠ **서우 불참 확정(9/14).** 그래서 이 명단의 `meet: KBW` 는 이제 **대면 기회가 아니라 「그 주에 한국에 있다」는 표시**로 읽는다 — 방한 중인 상대에게 「서울에 계시죠」는 여전히 좋은 훅이고, 참석하지 않아도 쓸 수 있다. **손실이 작은 이유**: 44명 대부분이 이미 게이트(1차 판매·9/30·10/3·가동)에 묶여 있어 지금 마주쳐도 열 수 없는 사람들이었고, 우리에겐 애초에 부스가 없어 마주침에 기대던 자리였다. **대면 무대는 둘로 정리된다 — 국내는 10/3 XRP SEOUL 하나, 해외는 10월 말 뉴욕 주간(해커톤 10/24~25 + Swell 10/27~29).** 미국 기반 인물은 전부 뉴욕으로 옮겨 읽는다. ⚠ **그래서 서우의 뉴욕행 확정 여부가 이제 결정적이다** — KBW 를 빼면 뉴욕이 유일한 해외 대면 기회다.",
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
    key: "pbw", name: "Paris Blockchain Week", when: "직전 회차 2026-04-15~16 (종료) · 차기 ~2027-04", where: "카루젤 뒤 루브르, 파리",
    stance: "watch",
    note: "**붙여 온 명단은 이미 끝난 회차다**(사이트가 티켓 버튼을 안 내렸을 뿐). 그래도 **Futurist 와 정반대로 우리가 가야 할 유형**이다 — 70%+ C-suite·정책 결정자, 기관 축 전원(BlackRock·JPM·Morgan Stanley·BNY·Invesco·Euroclear·LSEG·Citi·Deutsche Bank·BofA). **결정적인 것 둘: Odelia(XRPL Commons)가 연사고, Crypto.com 사장 Eric Anziani 도 연사다** — 우리가 이미 대화 중인 두 라인이 같은 방에 있다. 차기 회차는 우리 게이트(데이터 실적)와 시점이 맞는다. 10/3(우리 무대) → 10월 뉴욕 → **유럽** 순서에서 그 유럽 칸. ⚠ **정치 인사 기준 정교화**: 「연사에 정치 인사가 있으면 제외」를 그대로 적용하면 여기도 잘린다(프랑스 장관·ESMA·EU 집행위). **차이는 정치 인사 유무가 아니라 편성이다** — 밈·리테일 편성에 정치 인사가 섞인 것(Futurist)과 정책 컨퍼런스에 규제 당국이 오는 것(PBW)은 다르다.",
  },
  {
    key: "futurist", name: "Futurist Conference (토론토·플로리다)", when: "미확인", where: "토론토 / 플로리다",
    stance: "skip",
    note: "**정치 인사가 라인업에 섞여 있다** — 미 하원 후보·플로리다/유타 주의원·캐나다 하원의원. 우리는 정치 담론에 무반응이 원칙인데, **그 방에 이름이 같이 실리는 것 자체가 입장 표명으로 읽힌다**. 참가 여부 이전의 문제다. 편성도 리테일·밈 중심이고(밈 토큰 창업자·NFT 커뮤니티·트레이딩 KOL), 토론토판은 기관지향이지만 **TD·BMO·Wealthsimple·캐나다 거래소 — 캐나다 내수 축**이라 우리 시장이 아니다. **명단은 쓴다**: 400명 중 우리 레인에 닿는 셋만 걸렀다(Truflation·CoinDesk·Messari).",
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
    id: "odelia", inbound: true, name: "Odelia Torteman", org: "XRPL Commons", role: "Head of Digital Assets",
    lane: "xrpl", stance: "talking", via: "Katie Harries 와 공통 1촌", meet: "NYC 해커톤 10/24~25",
    why: "그가 먼저 시간을 청했다. Commons 기관 사례에서 비어 있는 칸 = 비금융 실물이고, 전 직함(Corporate Adoption)이 곧 우리 유형이다. **Paris Blockchain Week 연사**(9/13 확인) — 유럽 기관 무대에서의 위치를 보여 준다. 그가 열어 둔 「유럽 소개는 나중」 축의 실체이기도 하다.",
    next: "**메일 L 미발송 — 오늘 나가야 한다.** 그가 먼저 시간을 청했고 우리가 보내겠다고 답한 상태의 침묵은 「말만 하는 쪽」으로 분류된다. 통화는 10/3 무대 뒤 그대로. **9/14 재판정: 리플 계약 가능성은 미루는 이유가 아니라 내용 필터다** — Commons 는 리플과 별개 법인이고, 오히려 Commons 가 아는 상태가 리플 대화에서 우리 위치를 올린다. 유일한 실제 금지선은 **Commons 에게 리플 쪽 소개를 청하지 않는 것**. 새 접점: 합의 지수 + 입력값 원장 지문(그의 「신뢰가 아니라 검증」 논지와 같은 모양이고 리플과 무관하다). 준비 문서 content/xrpl-commons-call-prep.md",
  },
  {
    id: "karan", name: "Karan", org: "독립 KOL", role: "X · YouTube", handle: "KingKaran",
    lane: "voice", stance: "talking",
    why: "플레어 코리아에서 기기를 보고 자발 게시 → 유료 제휴를 먼저 타진해 왔다. 유럽 축 후보.",
    next: "할인코드 대신 판매당 커미션 여부를 그에게 묻는다(F). 그가 택하면 조건 다섯을 붙인다(E).",
  },
  {
    id: "cryptocom", inbound: true, name: "Vincent Chan", org: "Crypto.com", role: "VP, Strategic Partnerships (홍콩)",
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
    id: "paloma", gate: "sale2", name: "Paloma Soria Brown", org: "Bybit", role: "Card + Pay 파트너십·이벤트 글로벌 리드",
    lane: "exchange", stance: "hold",
    why: "결제 BD. 2차 판매 해외 결제 설계 때 결제 관점으로 다시 본다.",
    next: "사업 메시지 없음. 인사만 허용. 게시물 반응으로 관계 유지.",
  },
  {
    id: "daria", gate: "saleend", name: "Daria Vasiuta", org: "Bybit", role: "CIS 지역 마케팅 헤드",
    lane: "exchange", stance: "hold",
    why: "담당 지역이 CIS·동유럽이라 우리 시장과 접점이 없다.",
    next: "인사만. 그가 먼저 열면 듣는다.",
  },
  {
    id: "emily", gate: "sale2", name: "Emily Yang", org: "Binance", role: "Business Partnerships Manager",
    lane: "exchange", stance: "linked", tie: "**1촌** · 서우 1차 DM 9/11(목) — 무응답",
    why: "결제·온오프램프 BD. 해외 구매자의 피아트 레일·온오프램프가 그의 본업 트랙이고, 그게 1차 판매에서 우리가 가장 얇은 지점이다.",
    next: "**2차 DM(9/14) — 재촉이 아니라 update.** 1차 판매 개시(9/15)를 새 정보로 들고 간다. ⚠ **상장·리스팅 단어 0** — 거래소 소속 1촌 규칙 9/30 까지 유지, 바이낸스라 특히. 한 번 섞이면 그 뒤 결제 대화가 전부 「상장 노리는 프로젝트」로 재분류된다. 「본인 성과」 설계 = ① 크립토 네이티브가 아닌 **산업 이름** ② 투기가 아닌 **결제 거래량** ③ 아직 아무도 잡지 않은 **시점** — 셋을 말하지 않고 보여준다. 데이터 공급처는 **우회 화법**(주어 없이 `the settlement side` 까지만). **9/14 밤 전면 교체** — 서우 지시로 레인이 결제레일에서 **데이터**로 바뀌었다. 새 본문은 Lynn 과 동일: 회사 → 90개국 167개 도시·11개 소스 합의 지수 → 입력값 원장 지문 → 수요(대형 거래 플랫폼) → 기기 순. 기기가 맨 뒤인 이유는 앞의 넷을 읽은 사람에게만 기기가 「데이터 공급원」으로 읽히기 때문이다. ⚠ 그가 「어느 거래소냐」를 물으면 **「Not one I can name.」** 한 줄로 닫는다. 초안: x-activity-log 「링크드인 2차 DM — 재작성」.",
  },
  {
    id: "maxz", gate: "sale2", name: "Max Z", org: "Binance", role: "Affiliate Manager · Partnerships & Growth",
    lane: "exchange", stance: "linked", tie: "**1촌 요청 발송, 수락 대기** · UAE · 공통 1촌 Ken·Daria",
    why: "거래소 소속이지만 **레인이 다르다** — 상장·상품이 아니라 **어필리에이트·파트너 생태계 설계**다. 4년간 15개 시장 1,000+ 크리에이터·브로커·미디어를 온보딩했고, 경력란이 명시한 본업이 **커미션 구조와 인센티브 설계**다. 전직 impact.com(파트너십 관리 플랫폼) CS. 즉 **우리가 지금 Karan 건에서 풀고 있는 문제를 세계에서 가장 많이 풀어 본 축**이다. 그리고 그건 바이낸스에서 뭘 받는 게 아니라 그의 전문성을 묻는 것이라 거절 비용이 거의 없다.",
    next: "**수락되면 보낼 첫 메시지**(2촌이라 수락 전엔 DM 불가). 훅은 그의 1주 전 글 「From 0 to 1000+ Partners」. 우리 위치를 **곡선의 반대쪽 끝**(파트너 5명째)으로 놓고, 요청 없이 질문 하나만 남긴다. ⚠⚠ **Emily Yang 과 같은 회사다 — 메시지 레인이 겹치면 안 된다.** Emily=기업 파트너십(결제·데이터), Max=어필리에이트. 팀도 KPI도 다르지만 사내에서 얘기가 오가면 「여기저기 찔러본다」로 읽힌다. **서로를 언급하지 않고, 같은 제안을 양쪽에 하지 않는다.** ⚠ **유료 KOL 단가·커미션 숫자 발설 금지** — 구조만 묻고 우리 수치는 말하지 않는다(Karan 건 기밀). ⚠ **상장·리스팅 단어 0**(거래소 1촌 규칙). ⚠ **공통 1촌 Ken·Daria 이름을 팔지 않는다** — 특히 Daria 는 Bybit 소속이고 우리와 관계도 얕다. 바이낸스 사람에게 경쟁 거래소 인맥을 대는 건 최악이다(Lynn 건에서 Katie 를 뺀 것과 같은 이유). 대면 기회 없음(UAE — KBW·XRP SEOUL·NYC 어디와도 안 겹친다).",
  },
  {
    id: "emile", gate: "ship", name: "Emile Anthony E. N.", org: "Binance.US", role: "Senior Manager, Partner & Workforce Performance",
    lane: "exchange", stance: "linked", tie: "**1촌 요청 단계** · 미국 · 공통 1촌 Katie",
    why: "⚠ **직함이 헷갈리는 자리다.** 그의 「Partner」는 사업 파트너십이 아니라 **벤더·BPO 파트너**(고객지원 외주 업체)다 — 경력이 TaskUs·TELUS 등 **콜센터 워크포스 매니지먼트** 일색이고, 현재 일도 vendor governance · capacity planning · frontline 지원팀 운영이다. **Binance.US 는 글로벌 Binance 와 별개 법인**이라 Emily·Max 와도 다른 회사다. 지금 우리 레인(결제·데이터·KOL)과 접점 0. **다만 미래 접점은 진짜다** — 기기를 여러 나라에 팔면 다국어 CS·RMA·지원 인력 설계가 반드시 터지고, 그걸 크립토 회사 안에서 해본 사람은 드물다.",
    next: "**1촌은 맺되 메시지는 보류.** 보낼 내용이 없다 — 억지로 만들면 그게 티가 난다. **게이트 = 기기 배송·가동.** 그때 「해외 고객지원을 어떻게 짜야 하나」로 열면 그의 본업 한가운데다. ⚠ **바이낸스 계열 세 번째 사람이다**(Emily=Binance, Max=Binance, 본인=Binance.US). 법인은 달라도 밖에서는 같은 브랜드로 보인다 — **셋에게 동시에 말을 걸면 「바이낸스에 어떻게든 뚫으려 한다」로 읽힌다.** 서우가 지금 보내기로 하면 **인사만**(요청 0) — 초안은 x-activity-log.",
  },
  {
    id: "hazel", gate: "saleend", name: "Hazel Teo", org: "Binance", role: "Global ASO & Performance Marketing",
    lane: "exchange", stance: "hold", tie: "1촌 요청 대기 · 싱가포르 · 공통 1촌 Daria·Vincent",
    why: "**레인이 맞지 않는다.** ASO = 앱스토어 최적화인데 **우리는 앱이 없다**(웹 스토어 + 텔레봇). 퍼포먼스 마케팅(유료 광고)도 우리 기조와 반대다 — 콘텐츠·관계로 간다. NUS 2023-12 졸업, 바이낸스 2년 8개월(CRM → ASO)로 **결정 권한이 있는 자리가 아니다**. 나쁜 게 아니라 레버리지가 낮다.",
    next: "**1촌은 그대로 두고 메시지 없음.** 미래 접점은 **우리가 모바일 앱을 낼 때** — 지금은 먼 얘기다. ⚠ **바이낸스 계열 네 번째 사람**(Emily·Max·Emile·본인) — 한 회사에 동시 대화 2개 상한 규칙 적용(playbook 「한 회사 동시 대화 상한」). 공통 1촌 **Daria(Bybit)·Vincent 이름을 팔지 않는다.**",
  },
  {
    id: "tina", gate: "saleend", name: "Tina Lee", org: "BYDFi", role: "BD",
    lane: "exchange", stance: "hold",
    why: "거래소 BD 카테고리 첫 사례.",
    next: "추가 컨택 없음.",
  },

  /* ── 여는 중 ───────────────────────────────────────────── */
  {
    id: "mastercard", gate: "sale1", name: "(이름 미기재)", org: "Mastercard", role: "Director, Product Management — Mastercard Move",
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
    id: "esther", name: "Esther Haerim Heo (허해림)", org: "기후솔루션(SFOC)", role: "Director of Programs, 화석연료·중공업 — 철강·석유화학·해운·가스·메탄·HFC 총괄 · 서울대 국제대학원 에너지 정책 강사",
    lane: "impact", stance: "hold", tie: "1촌 (9/17 수락)",
    why: "**최대 본부(35명) 본부장 · 최대 사업(산업 부문 탈탄소화 76.7억) 총괄 = CEO 다음 서열.** 그리고 **우리 고객군을 정확히 겨누는 그 프로그램의 책임자**다 — POSCO홀딩스·포스코인터내셔널·현대제철 의결권 보유가 이 본부의 무기다.",
    next: "**1촌만 두고 인사도 보내지 않는다.** 본부장급 인사는 「누구지」를 촉발하고, 그걸 확인하는 게 그의 직무다 — 케이웨더 B2B 고객군과 그의 타깃이 겹치는 상태에서는 **얕은 것이 안전하다.** 1촌 자체가 자산이라 나중에 콜드가 아니다. **여는 순서는 CEO 보다 이 사람이 먼저** — 그는 쓸모를 묻고 CEO 는 법적 취약점을 묻는다. 문은 **서울대 국제대학원 강의·세미나 맥락**이 가장 자연스럽다(영리 대 NGO 프레임을 벗는다).",
  },
  {
    id: "joojin", name: "Joojin Kim", org: "기후솔루션(SFOC)", role: "CEO · 창립자 — 前 김앤장 변호사(에너지 프로젝트·분쟁 8년) · Georgetown LL.M. 환경법 · 미국 변호사",
    lane: "impact", stance: "hold",
    why: "**거래 변호사의 언어를 쓰는 CEO다** — 입증 책임·분쟁 시 방어·검증 가능성이 그에게는 모국어이고, 그것이 우리 판정 상품의 언어와 같다. 소송 접점은 실무자급이 아니라 이 사람 급에서 통한다.",
    next: "**지금 열지 않는다.** 같은 이유로 그는 우리 토큰 구조·보상 표현·위임 관계의 법적 취약점을 우리보다 빨리 찾는다 — 준비 안 된 상태로 만나면 약점만 노출된다. **FCC 프로덕션 전환 + 배출 축 소스**가 선 뒤가 그의 자리다.",
  },
  {
    id: "sonej", name: "Eunji Son", org: "기후솔루션(SFOC)", role: "(직함 미확인 — 팀 페이지 133명에 없다. 최근 합류)",
    lane: "impact", stance: "talking", tie: "1촌 · 인사 왕복",
    why: "기후소송은 우리 판정 구조와 요구 조건이 같은 유일한 분야다 — **진 쪽이 뒤집을 수 없어야 한다**는 것, 그리고 withheld 는 법정에서 더 강하다. 다만 **조직은 고객이 아니다**(9/17 결산공시 딥리서치).",
    next: "**개인 관계만 유지.** 데이터 제안·기기 증정·조직 소개 요청 전부 금지 — 영리법인 기부금이 연 50만원인 조직이고 예산 179억이 전액 지정 그랜트다. 다음 대화에서 소속 팀을 자연스럽게 확인. 소송 접점은 **FCC 프로덕션 전환 + 배출 축 소스** 뒤에 연다.",
  },
  {
    id: "victoria", name: "Victoria Mei", org: "MoonPay", role: "소셜미디어·크리에이터",
    lane: "voice", stance: "open",
    why: "해외 KOL 아웃바운드 첫 대상. 온램프 회사 소속이라 결제 축과도 닿는다.",
    next: "가벼운 DM 발송분 반응 관찰. 조건·숫자 제시 0.",
  },
  {
    id: "jansen", name: "Charles Jansen", org: "S&P Global", role: "DeFi and Digital Assets",
    lane: "market", stance: "linked", tie: "**1촌(9/16)** — 팔로우에서 1촌으로", meet: "KBW 9/29~10/1",
    why: "데이터 회사가 온체인으로 가는 사례이자 **지수·평가 기관**이다. 기초 참조값의 출처를 심사하는 쪽이라 **합의 지수 방법론이 그대로 얹힌다** — 「30년 데이터 회사의 DePIN」 프레임도 같이 통한다.",
    next: "9/16 1촌이 됐으므로 판매 게이트를 푼다. 다만 **Michael(Bloomberg)과 논조가 같아 한 주에 둘을 같이 열지 않는다** — 자리로 보면 Michael 이 먼저다. 사업 제안이 아니라 사례 비교로 연다.",
  },
  {
    id: "pham", gate: "sale2", name: "Caroline D. Pham", org: "MoonPay", role: "CEO, MoonPay Institutional · CLO & CAO",
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
    id: "bchiri", gate: "pipeline", name: "David Bchiri", org: "XRPL Commons", role: "—",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "Commons 축. 우선순위 1번이었다.",
    next: "Odelia 대화가 열렸으므로 개별 노트 대신 그 경로로 소개받는다.",
  },
  {
    id: "hussenet", gate: "pipeline", name: "Thomas Hussenet", org: "XRPL Commons", role: "—",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "Commons 축.", next: "Odelia 경로로 통합.",
  },
  {
    id: "mollin", gate: "pipeline", name: "Brett Mollin", org: "XRPL Foundation", group: "XRPL 재단·커뮤니티", role: "—",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "재단 축. 빌더 파이프라인의 반대편.",
    next: "등록 결과가 나온 뒤 그 경로로 재개.",
  },
  {
    id: "furukawa", gate: "pipeline", name: "Mai Furukawa", org: "XRPL Japan / XRPL Labs", group: "XRPL 재단·커뮤니티", role: "Director",
    lane: "xrpl", stance: "hold", meet: "Swell 10/27~29 연사",
    why: "일본은 그다음 시장. 다만 지갑 통합 얘기는 꺼내지 않는다(디센트 감수성).",
    next: "등록 결과 뒤. 노트 초안은 준비돼 있다.",
  },

  /* ── 보류 (기관·자본 — 1차 판매 결과 뒤) ──────────────────── */
  {
    id: "wuollet", gate: "sale1", name: "Guy Wuollet", org: "a16z crypto", role: "General Partner",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중", meet: "KBW · Swell 연사",
    why: "이미 팔로우 중이라 콜드가 아니다. DePIN 투자 관점. 실적 없이 만나면 한 번뿐인 첫인상을 계획으로 쓴다.",
    next: "1차 판매 결과(9/16) 뒤.",
  },
  {
    id: "hadick", gate: "sale1", name: "Rob Hadick", org: "Dragonfly", role: "General Partner",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "DePIN·인프라 투자.", next: "9/16 뒤, 숫자를 들고.",
  },
  {
    id: "qureshi", gate: "sale1", name: "Haseeb Qureshi", org: "Dragonfly", role: "Managing Partner",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "같은 하우스. 한 하우스에 둘을 동시에 열지 않는다.",
    next: "Hadick 쪽이 열리면 그 경로로.",
  },
  {
    id: "applebaum", gate: "sale1", name: "Spencer Applebaum", org: "Multicoin Capital", role: "GP & Co-Head of Venture",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "DePIN 섹터의 대표 투자사. 「층이 다르다」(망 vs 기기) 구분을 가장 빨리 알아들을 상대.",
    next: "9/16 뒤. 헬륨 비교 질문에 대한 답을 먼저 정리하고 연다.",
  },
  {
    id: "johnson", gate: "data", name: "Jenny Johnson", org: "Franklin Templeton", role: "CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "sgBENJI 발행사. 싱가포르 은행의 디지털 거래소가 그 토큰화 MMF 를 RLUSD 와 나란히 상장했다 — 우리 「왜 RLUSD」 논거의 당사자다.",
    next: "격이 맞지 않는 자리. 사례 인용으로만 쓰고 컨택은 하지 않는다.",
  },
  {
    id: "sharma", gate: "data", name: "Nikhil Sharma", org: "BlackRock", role: "Director, Digital Assets",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중", meet: "KBW 9/29~10/1",
    why: "서우가 이미 팔로우 중이다(BlackRock 디지털자산 쪽을 넷 팔로우). BUIDL 이 RLUSD 로 24/7 환매되는 건의 회사 쪽. 다만 그 환매는 XRPL 이 아닌 체인에서 일어난다 — 섞어 말하지 않는다.",
    next: "컨택 없음. 배경 지식으로만.",
  },
  {
    id: "rooz", gate: "data", name: "Yuval Rooz", org: "Canton", role: "Co-founder & CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "JPM 토큰화 예금이 Canton 이다. 우리 정산은 XRPL — 커뮤니티가 자주 섞는 지점이라 구분해 둔다.",
    next: "컨택 없음.",
  },
  {
    id: "oldenburg", gate: "data", name: "Amy Oldenburg", org: "Morgan Stanley", role: "Head of Digital Asset Strategy",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "기관 디지털자산 전략. 우리 단계와 거리가 멀다.",
    next: "컨택 없음. 무대 발언만 관찰.",
  },
  {
    id: "belshe", gate: "saleend", name: "Mike Belshe", org: "BitGo", role: "Co-founder & CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "커스터디. 디센트가 지갑 파트너라 대안 비교는 감수성이 있다.",
    next: "명함까지. 커스터디 비교 대화는 열지 않는다.",
  },
  {
    id: "heinrich", gate: "saleend", name: "Michael Heinrich", org: "0G Labs", role: "Founder & CEO",
    lane: "capital", stance: "hold",
    why: "탈중앙 데이터 레이어. 데이터 판매 구조에서 겹칠 여지가 있다.",
    next: "타 체인 신호라 9/30 뒤.",
  },

  /* ── 보류 (데이터 수요 — 5축×6축) ───────────────────────── */
  {
    id: "coplan", gate: "ship", name: "Shayne Coplan", org: "Polymarket", role: "Founder & CEO",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "날씨 예측시장의 정산에는 조작 불가 실측이 필요하다. 우리 교차검증 관측망이 그 정산 기준 후보다 — 확정 포지셔닝의 5축×6축 연결이 정확히 여기다.",
    next: "관측망 실적이 없는 동안은 대화가 성립하지 않는다. 기기가 돌기 시작한 뒤.",
  },
  {
    id: "wang", gate: "ship", name: "John Wang", org: "Kalshi", role: "Head of Crypto",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "규제 시장 쪽 예측시장. 같은 논리이고 정산 기준 요구가 더 엄격하다.",
    next: "동일 — 실측 실적 뒤. **Kalshi 의 첫 문은 이 사람이다**(Edward King 보다 먼저). ⚠ **서우 KBW 불참(9/14)으로 대면 경로가 뉴욕으로 옮겨진다** — Kalshi 는 뉴욕 회사이고, 10월 말 주간(해커톤 10/24~25 · Swell 10/27~29)이면 **그들의 홈그라운드에서, 1차 판매 결과와 10/3 무대를 손에 들고** 만난다. KBW 보다 낫다.",
  },
  {
    id: "edking", gate: "ship", name: "Edward King", org: "Kalshi", role: "Trade Surveillance, Kalshi Prime",
    lane: "market", stance: "hold", tie: "1촌 요청 대기 · 뉴욕 · 공통 1촌 Nicole",
    why: "**구매 결정자가 아니다** — Trade Surveillance = 불공정거래·조작 탐지이지 데이터 벤더 선정이 아니다(전직 나스닥 Options Market Surveillance Analyst 1년 7개월, Kalshi 7개월). **다만 자리가 우리 논지와 정확히 겹친다**: 예측시장에서 정산값이 조작되면 그게 그의 문제다. 즉 **「검증 가능성」을 가장 잘 이해할 사람**이고, 구매자가 아니라 **내부 옹호자**가 될 수 있는 카드다. 와튼·창업 2회·뉴욕.",
    next: "**서우 결정(9/15): Lynn 형식 인사만 보낸다.** 그러면 순서 문제가 대부분 해소된다 — **인사는 사내 보고 대상이 아니다.** 제안이었다면 Wang 쪽 대화가 「찔러봤던 곳」으로 시작되지만 인사는 그렇게 읽히지 않는다. 초안은 x-activity-log 「Edward King」. 원래 판정은 아래 그대로 둔다: 같은 회사에 **John Wang(Head of Crypto)** 가 이미 잡혀 있고 그가 먼저다(**서우 KBW 불참으로 대면 경로는 10월 말 뉴욕 주간**). 윗선 대화가 열리기 전에 아랫자리에 먼저 DM 을 보내면, 사내에서 얘기가 오갈 때 **Wang 쪽 대화가 「이미 우리 회사에 찔러봤던 곳」으로 시작된다.** 게이트 = Wang 대화가 열린 뒤 + 기기 가동. 그때도 **데이터 판매 제안이 아니라 감시 관점**으로 연다. ⚠⚠ **Kalshi 사람에게 다른 거래소와 얘기 중이라는 신호 절대 금지** — 직접 경쟁사이고 규제 거래소끼리는 업계가 좁다. 우회 화법(주어 없음)이 여기서 가장 엄격하게 적용된다.",
  },

  /* ── 보류·열지 않음 (미디어·사상가) ──────────────────────── */
  {
    id: "mcgleenon", name: "Brian McGleenon", org: "BeInCrypto", role: "Global Head of News · Yahoo Finance 「Future Focus」 호스트 · 전 The Independent 탐사보도 · 「Degens」 다큐 공동제작",
    lane: "voice", stance: "talking", tie: "**콜드 DM → 답장 받음**(9/14 02:21 \"Very interesting Seowoo\") · 1촌 요청 발송",
    why: "**미디어 게이트(10/3 무대 뒤)를 넘어섰지만 방식은 규칙의 취지를 지켰다.** 서우가 판 것은 계획이 아니라 **문제**였다 — WeatherXM 이 80개국에 깔고도 밀도가 안 나와 데이터를 못 팔았다 / 우리는 거꾸로 간다 / **그게 문제를 푸는 건지 옮기는 건지 나도 모르겠다.** 마지막 한 줄이 이 메시지의 전부다. 기자는 확신에 찬 홍보를 매일 받는다 — **모른다고 말하는 쪽이 드물어서 답이 왔다.**",
    next: "**★ 9/16 매체 확정 — 우리가 몰랐던 것이 컸다.** 「매체 미확인」으로 두고 게이트를 10/3 에 걸어놨었는데 실제로는 **대형 크립토 매체의 뉴스 총괄이자 야후 파이낸스 프로그램 진행자**다. **답장까지 받은 관계이고 이 지도에서 가장 값비싼 미디어 자산**이라 게이트를 푼다 — 10/3 을 기다릴 이유가 없다. **「Very interesting」은 예의이지 예스가 아니므로**(새벽 2:21 회신 = 폰에서 한 줄) 밀지는 않되, **그가 쓰는 지면이 확정됐으니 줄 것을 거기에 맞춰 고른다.** 초안은 x-activity-log 「Brian McGleenon」.",
  },
  {
    id: "cermak", gate: "stage", name: "Larry Cermak", org: "The Block", role: "President",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "영문 리서치·미디어. 10/3 실물 시연 뒤에 커버리지 후보.",
    next: "9/16·10/3 결과가 나온 뒤. 지금 열면 계획을 파는 게 된다.",
  },
  {
    id: "balaji", gate: "stage", name: "Balaji Srinivasan", org: "The Network State", role: "Founder",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "씬 사상가 층. 테제 글에만 붙는다.",
    next: "테제 글이 우리 레인에 닿을 때 1회. 상품 얘기 0.",
  },
  {
    id: "pozsar", gate: "stage", name: "Zoltan Pozsar", org: "Ex Uno Plures", role: "Founder & CEO",
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
    id: "teng", gate: "saleend", name: "Richard Teng", org: "Binance", role: "Co-CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소 최상위. 공표 근거는 백서 게이트(초기 단계 상장 금지).",
    next: "열지 않는다.",
  },
  {
    id: "starxu", gate: "saleend", name: "Star Xu", org: "OKX", role: "Founder & CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소.", next: "열지 않는다.",
  },
  {
    id: "rafique", gate: "saleend", name: "Haider Rafique", org: "OKX", role: "Managing Partner & CMO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소 마케팅. 직무 불문 같은 판정이다.",
    next: "열지 않는다.",
  },
  {
    id: "sethi", gate: "saleend", name: "Arjun Sethi", org: "Kraken (Payward)", role: "Co-CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소.", next: "열지 않는다.",
  },
  {
    id: "upbit-cbio", gate: "saleend", name: "SeonJoo Yoon", org: "업비트", role: "CBIO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1 (메인 스폰서)",
    why: "업비트 건은 11월 트랙 담당 라인의 별건이다. 우리가 옆에서 열면 그 트랙이 꼬인다.",
    next: "열지 않는다. 필요하면 담당 라인을 통해서만.",
  },
  {
    id: "upbit-ceo", gate: "saleend", name: "Kyoungsuk Oh", org: "업비트", role: "CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1 · 9/29 비공개 기관 포럼",
    why: "사용자 레벨이 아니다.",
    next: "열지 않는다.",
  },

  /* ── 9/11 2차 라인업 추가 ────────────────────────────────
     우리 레인에 닿는 사람만 옮겼다. 타 체인·DeFi·범용 VC 는 아래 EXCLUDED 규칙대로 뺀다. */
  {
    id: "lambur", gate: "ship", name: "Hart Lambur", org: "Risk Labs · UMA", role: "Co-founder",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "옵티미스틱 오라클로 예측시장 정산을 붙이는 쪽. 「무엇이 참인지 어떻게 정하는가」 가 곧 그의 문제이고, 날씨 항목에서는 그 답이 실측이다 — 이번 라인업에서 우리 5축과 가장 가까운 자리다.",
    next: "기기가 돌기 시작한 뒤. 그 전에는 우리가 내놓을 관측 실적이 없다.",
  },
  {
    id: "zabaneh", gate: "sale2", name: "May Zabaneh", org: "PayPal", role: "SVP",
    lane: "pay", stance: "hold", meet: "KBW 9/29~10/1",
    why: "소비자 결제 대기업의 디지털자산 축. Mastercard 건과 같은 레인이라 한쪽이 열리면 다른 쪽 질문이 정리된다.",
    next: "Mastercard 쪽 대화가 먼저. 두 곳을 동시에 열지 않는다.",
  },
  {
    id: "cascarilla", gate: "sale2", name: "Charles Cascarilla", org: "Paxos", role: "Co-founder & CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "규제 스테이블코인 발행 구조. 우리는 RLUSD 로 정산하므로 발행사 비교 대화는 열지 않는다 — 배경 지식으로만.",
    next: "컨택 없음.",
  },
  {
    id: "schmidt", gate: "sale1", name: "Tom Schmidt", org: "Dragonfly", role: "General Partner",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "DePIN 투자. Hadick·Qureshi 와 같은 하우스다.",
    next: "한 하우스에 한 사람만. 9/16 뒤 Hadick 경로로.",
  },
  {
    id: "wrynn", gate: "data", name: "Kathleen Wrynn", org: "Invesco", role: "Global Head of Digital Assets",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "자산운용의 디지털자산 총괄. 우리 단계와 거리가 멀다.",
    next: "컨택 없음. 무대 발언만 관찰.",
  },
  {
    id: "bessette", gate: "data", name: "Cynthia Lo Bessette", org: "Fidelity Investments", role: "Head of Digital Asset Management",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "같은 이유. 기관 수요의 온도를 읽는 자리다.",
    next: "컨택 없음.",
  },
  {
    id: "ippolito", gate: "stage", name: "Michael Ippolito", org: "Blockworks", role: "Co-founder",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "영문 미디어·리서치. The Block 과 같은 층이다.",
    next: "10/3 실물 시연 뒤 커버리지 후보. 지금 열면 계획을 파는 게 된다.",
  },
  {
    id: "svanevik", gate: "ship", name: "Alex Svanevik", org: "Nansen", role: "Co-founder & CEO",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "온체인 데이터 분석. 우리 소각·발급이 온체인에 남으므로 언젠가 읽히는 쪽이다.",
    next: "지표가 쌓인 뒤. 우리가 먼저 해석을 들이밀지 않는다.",
  },
  {
    id: "bobbyong", gate: "saleend", name: "Bobby Ong", org: "CoinGecko", role: "Co-founder & CEO",
    lane: "voice", stance: "hold", meet: "KBW 9/29~10/1",
    why: "집계·등재 쪽. 등재 논의는 게이트와 얽히므로 9/30 전에는 열지 않는다.",
    next: "열지 않는다.",
  },
  {
    id: "levin", gate: "data", name: "Jonathan Levin", org: "Chainalysis", role: "Co-founder & CEO",
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
    id: "kerbrat", gate: "saleend", name: "Johann Kerbrat", org: "Robinhood", role: "SVP & GM, Crypto and International",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래·브로커리지. 거래소 카테고리와 같은 판정이다.",
    next: "열지 않는다.",
  },
  {
    id: "lizmartin", gate: "saleend", name: "Liz Martin", org: "Coinbase Institutional", group: "Coinbase", role: "CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "기관 브로커리지. Katie 와 같은 회사지만 직무가 다르다 — 정책 쪽은 인사, 이쪽은 열지 않는다.",
    next: "열지 않는다. Katie 경로와 섞지 않는다.",
  },
  {
    id: "ferrante", gate: "saleend", name: "Armani Ferrante", org: "Backpack Exchange", role: "Founder & CEO",
    lane: "exchange", stance: "off", meet: "KBW 9/29~10/1",
    why: "거래소.", next: "열지 않는다.",
  },

  /* ── 9/11 3차 라인업 — 오라클·동종 DePIN 축이 여기서 나왔다 ────────── */
  {
    id: "horton", gate: "sale1", name: "Mike Horton", org: "GEODNET", role: "Project Creator",
    lane: "peer", stance: "hold", meet: "KBW 9/29~10/1",
    why: "개인이 실물 기기를 설치하고 측정값으로 보상받는 구조 — 우리와 같은 형태를 먼저 돌린 쪽이다. 층이 다르다는 논리(망 vs 기기)는 헬륨에는 통하지만 여기엔 통하지 않는다. 비교당할 자리이자 배울 자리다.",
    next: "9/16 뒤. 그 전에 「우리는 무엇이 다른가」 를 한 문단으로 세워 둔다 — 실내 공간 · 인증 기기 · 기존 B2B 수요. 답이 준비되기 전에 만나지 않는다.",
  },
  {
    id: "mccormick", gate: "ship", name: "Andrew McCormick", org: "Chainlink", role: "Head of Institutional and Market Development",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "오라클은 우리 실측의 수요처다. 「무엇이 참인지」 를 체인에 넣는 쪽이고, 날씨 항목에서 그 입력은 결국 기기에서 온다.",
    next: "관측 지점이 실제로 돌기 시작한 뒤. 지금 열면 데이터 없는 데이터 얘기가 된다.",
  },
  {
    id: "kazmierczak", gate: "ship", name: "Marcin Kazmierczak", org: "RedStone", role: "Co-founder & COO (Credora)",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "모듈형 오라클. 체인링크보다 우리 규모에 말을 걸기 쉬운 상대라 오라클 축의 첫 문은 이쪽이 될 수 있다.",
    next: "9/16 뒤 · 오라클 축 첫 접촉 후보 1번. 기술 통합 클레임은 하지 않는다.",
  },
  {
    id: "sharples", gate: "ship", name: "Betty Sharples", org: "Truflation", role: "Head of Business Development",
    lane: "market", stance: "hold", via: "Futurist Conference 명단(9/11)",
    why: "**우리와 구조가 같은 회사다** — 실세계 지표(물가)를 모아 온체인에서 검증 가능한 데이터로 만든다. 오라클 레인에서 체인링크·RedStone 이 「수요처」라면 여기는 **선례**다. 실세계 지표가 예측시장·파생의 언더라잉으로 실제로 들어간 사례.",
    next: "**컨택은 기기 가동 뒤.** 다만 지금 당장 쓸 데가 있다 — 크립토닷컴 콜에서 「날씨가 언더라잉이 될 수 있나」 에 답할 때 **인용하는 사례**로 쓴다(컨택 없이 사실만).",
  },
  {
    id: "ashraf", gate: "stage", name: "Aoyon Ashraf", org: "CoinDesk", role: "Global Head of News",
    lane: "voice", stance: "hold", via: "Futurist Conference 명단(9/11)",
    why: "지도에 The Block·Blockworks·CNBC 는 있었지만 CoinDesk 가 비어 있었다. DePIN·실물 기기는 이 매체의 상시 꼭지다.",
    next: "**윗선을 먼저 치지 않는다.** 10/3 무대 뒤에 실무 기자 경로로 연다. 이 이름은 그 경로가 맞는지 확인하는 기준으로만 둔다.",
  },
  {
    id: "allison", gate: "stage", name: "Ian Allison", org: "CoinDesk", role: "Senior Reporter",
    lane: "voice", stance: "hold", via: "Paris Blockchain Week 명단(9/13)", meet: "PBW",
    why: "**어제 비워 둔 칸이 정확히 이 사람이다** — CoinDesk 를 넣으면서 「윗선을 먼저 치지 않는다 → 실무 기자 경로」로 남겨 뒀다. 시니어 기자라 DePIN·실물 기기 꼭지가 실제로 그의 손을 지난다.",
    next: "10/3 무대 뒤. **Ashraf(총괄)가 아니라 이쪽으로 먼저 연다.** 보도자료가 아니라 무대 영상·트랜잭션 링크를 들고 간다.",
  },
  {
    id: "anziani", gate: "sale2", name: "Eric Anziani", org: "Crypto.com", role: "President & COO",
    lane: "exchange", stance: "off", via: "Paris Blockchain Week 명단(9/13)", meet: "PBW",
    why: "Vincent 라인의 윗선. 같은 회사의 사장이 유럽 기관 무대에 선다는 사실은 **그 대화의 급을 말해 준다** — 우리가 열고 있는 채널이 작은 창구가 아니라는 뜻.",
    next: "**열지 않는다.** Vincent 라인이 살아 있는데 사장을 먼저 치면 그 라인이 망가진다. 이 카드는 접근 금지선을 눈에 보이게 두려고 만든 것이다 — Vincent 대화가 끝나거나 그가 소개할 때만 의미가 생긴다.",
  },
  {
    id: "omkar", gate: "data", name: "Krishna Omkar", org: "LSEG", role: "Head of Product, Digital Markets Infrastructure",
    lane: "capital", stance: "hold", via: "Paris Blockchain Week 명단(9/13)", meet: "PBW",
    why: "Lynn Martin(NYSE·ICE)과 같은 **시장 데이터 인프라 축**. 데이터가 값이 되는 구조를 파는 쪽이라 우리 B2B 판매와 모양이 같다.",
    next: "데이터 판매 실적 뒤. **LSEG 는 한 명만 연다** — 같은 부문 Head 가 둘이지만 제품 쪽이 실무에 가깝다.",
  },
  {
    id: "turner", gate: "data", name: "Eric Turner", org: "Messari", role: "CEO",
    lane: "market", stance: "hold", via: "Futurist Conference 명단(9/11)",
    why: "DePIN 섹터 리서치 커버리지. 여기 리포트에 잡히면 기관·자본 대화의 앞단이 짧아진다.",
    next: "**리서치 회사는 숫자가 있어야 쓴다** — 데이터 판매 실적 뒤. CEO 라 윗선이니 그때도 실무 애널리스트 경로를 먼저 찾는다.",
  },
  {
    id: "vicioso", gate: "ship", name: "Giovanni Vicioso", org: "CME Group", role: "Global Head of Cryptocurrency Products",
    lane: "market", stance: "hold", meet: "KBW 9/29~10/1",
    why: "규제 거래소의 상품 총괄. 날씨 파생은 이미 전통 시장에 있고, 그 정산 기준이 관측값이라는 점이 우리 5축 논지의 뿌리다.",
    next: "컨택 없음. 날씨 파생 정산 기준을 어떻게 쓰는지는 공개 자료로 먼저 읽는다.",
  },
  {
    id: "shaulov", gate: "saleend", name: "Michael Shaulov", org: "Fireblocks", role: "Co-founder & CEO",
    lane: "capital", stance: "hold", meet: "KBW 9/29~10/1",
    why: "기관 커스터디. BitGo·앵커리지와 같은 층이다.",
    next: "커스터디 비교 대화는 열지 않는다(디센트 감수성). 명함까지.",
  },
  {
    id: "ossinger", gate: "stage", name: "Joanna Ossinger", org: "CNBC", role: "Managing Editor",
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
    id: "ashnathan", gate: "ship", name: "Ash Nathan", org: "Chainlink Labs", role: "Strategic Initiatives — Tokenization, Custody & Prediction Markets",
    lane: "market", stance: "linked", tie: "서우 팔로우 중",
    why: "★ 직함에 **예측시장**이 직접 들어 있다. 우리 5축(날씨 예측시장 정산엔 조작 불가 실측이 필요)의 정확한 상대이고, 체인링크 기관 담당(McCormick)보다 이쪽이 먼저다.",
    next: "오라클 축 1순위. 9/16 뒤, 관측 지점이 돌기 시작하면 연다. 기술 통합 클레임은 하지 않는다.",
  },
  {
    id: "samewen", gate: "ship", name: "Sam Ewen", org: "Chainlink Labs", role: "VP, Head of Brand and Ecosystem Marketing",
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
    id: "t54-cmo", gate: "sale1", name: "Mangirdas P.", org: "t54 Labs", role: "Chief Marketing Officer",
    lane: "xrpl", stance: "linked", tie: "서우 팔로우 중",
    why: "x402 촉진자 — XRP·RLUSD 로 에이전트 결제를 붙이는 쪽이다. 우리 기계 고객 테제(5c)의 결제 쪽 상대이고 이미 파트너 후보 로스터에 올려 둔 곳.",
    next: "APAC 리드 쪽이 먼저. 자체 대시보드 수치는 외부 검증이 안 되므로 인용하지 않는다.",
  },
  {
    id: "t54-apac", gate: "sale1", name: "Claire Jiyeon J.", org: "t54 Labs", role: "APAC Regional Lead",
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
    id: "souza", gate: "sale2", name: "Antônia Souza", org: "Visa", role: "Crypto Product Director, Latam & Caribbean",
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
    id: "allaire", gate: "sale2", name: "Jeremy Allaire", org: "Circle", role: "Co-founder, Chairman & CEO",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "USDC 발행사. 우리는 RLUSD 로 정산하므로 발행사 비교 대화는 열지 않는다.",
    next: "컨택 없음. 팔로우는 정보 소비다.",
  },
  {
    id: "crow", gate: "sale2", name: "Matthew Crow", org: "Tether", role: "Head of Regional Expansion",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "같은 이유 — 스테이블코인 발행사 축.",
    next: "컨택 없음.",
  },
  {
    id: "ellazhang", gate: "data", name: "Ling (Ella) Zhang", org: "YZi Labs", role: "Managing Partner · Head",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중 · 2촌 · 싱가포르 · 공통 1촌 Ken",
    why: "**앞의 바이낸스 4명과 급이 다르다 — 거래소 사람이 아니라 투자자다.** YZi Labs(구 Binance Labs) = **$10bn 투자 비히클**(Web3·AI·바이오). 그가 **Binance Labs 를 창업**했고(2018~2019, Injective·Polygon·Trust Wallet·CoinMarketCap), 그 전 **Kleiner Perkins 투자 프린시펄 4년 10개월**, 그 사이 Trendsi 공동창업 CEO(시리즈 A $25M, Lightspeed 리드). 스탠퍼드 GSB. ⚠ **「한 회사 동시 대화 2개 상한」을 기계적으로 적용하지 않는다** — 그 규칙은 거래소 레인이고 이 사람은 capital 레인이다.",
    next: "**1촌·팔로우는 유지, 메시지 0.** 게이트는 기존 배정대로 **데이터 판매 실적**이다. 이유 셋: ① 지금 우리 손에 든 것이 전부 예정이라 **투자자에게 계획을 들고 가면 그게 첫인상이 되고 첫인상은 한 번뿐이다** ② **한 번 「아직 이르다」를 받은 투자자에게 다시 가는 건 처음 가는 것보다 어렵다** — 실적을 들고 처음 가는 편이 압도적으로 낫다 ③ 케이웨더가 상장사라 **자금 경로가 내부에서도 확정 전**이다(녹취 9/14). 우리가 먼저 투자자를 열면 안에서 정리 안 된 것을 밖에서 말하게 된다. **지금 할 수 있는 것은 그의 글에 의미 있는 관찰을 남기는 것** — 요청이 아니고, 투자자는 자기 글에 좋은 답글을 다는 사람을 기억한다. ⚠ 프로필에 업무 메일이 공개돼 있으나 **저장소에 기재하지 않는다.**",
  },
  {
    id: "lynnmartin", gate: "data", name: "Lynn Martin", org: "NYSE / ICE", role: "President · Chair, ICE Fixed Income and Data Services",
    lane: "capital", stance: "linked", tie: "**1촌**(9/13 수락) · 공통 1촌 Katie·Hazel",
    why: "거래소보다 **데이터 서비스** 쪽이 우리와 닿는다 — 시장 데이터를 파는 사업의 구조가 우리 B2B 데이터 판매와 같은 모양이다. 그가 의장인 부문이 reference data·indices·pricing, 즉 **데이터가 값이 되는 구조** 그 자체다. 컬럼비아 통계 석사라 측정·품질을 이해하는 쪽이기도 하다.",
    next: "**인사만 보냈다(9/13)** — 케이웨더 소개(30년·약 3만 센서·기업 고객 4,000+·코스닥 상장) → wellbian 한 줄 → 관심의 이유(데이터 서비스) 순. 제품 설명·링크·요청 0. ⚠ **「국내 최대」 는 넣지 않았다** — 기관 상대는 회사 자료를 직업으로 읽는 쪽이라 근거 없는 최상급 한 단어가 나머지 문장의 신뢰까지 깎는다(판정표: wellbian-kweather-relationship 「케이웨더 소개 수치」). **사업 대화는 데이터 실적 뒤.** ⚠ 공통 1촌 Katie 는 언급하지 않았다 — 그쪽 관계가 아직 얕아 이름을 팔면 안 된다. 첫 인사에 XRP Ledger 대신 `a public ledger` 로 쓴 이유도 같다(NYSE·ICE 임원에게 첫마디부터 특정 체인을 말하면 「크립토 사람」으로 분류된다). **2차 DM(9/14) — 요청 0 유지.** 던지는 것은 방법론 한 덩어리다: 복수 독립 소스 → 이상치 제거 → 합의 지수 = 그가 의장인 부문(ICE Benchmark Administration)의 **기여형 벤치마크** 구조 그 자체이고, 기여자가 기관이 아니라 계측기일 뿐이다. 여기에 입력값 원장 지문이 붙으면 「이상치 제거 단계를 사후 감사 가능」이 되는데 기존 벤치마크 행정이 갖지 못한 조각이다. ⚠ **숫자 반복 금지** — 「약 3만 센서·4,000+」는 1차에서 이미 나갔고 3만은 출처 미확정 조건부다. 한 번은 소개, 두 번은 주장이 된다. ⚠ **1차 메시지 말미가 깨져 있다**(`Good to be connected.e connected.onnected.`) — 2차 발송 전에 1차를 편집해 꼬리를 정리할 것. **9/14 밤 전면 교체** — 벤치마크 단독 각도를 버리고 Emily 와 **동일 본문**(데이터 공급 → 정결성 → 수요)으로 간다. 벤치마크 논리는 그가 되물을 때 꺼내는 예비로 남긴다. ⚠ 「세계 최초」는 쓰지 않았다 — 그에게는 특히. `As far as we can find, no one else has put those two together` 로 1인칭 관찰로 낮췄다.",
  },
  {
    id: "davidpark", gate: "saleend", name: "Hyuckjae David Park", org: "Base", role: "APAC Ecosystem Lead",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "한국어권 APAC 생태계 담당. 다만 Base 는 타 체인이다.",
    next: "9/30 까지 열지 않는다. 멀티체인 신호 금지 규칙.",
  },
  {
    id: "shinhan", gate: "data", name: "장범진", org: "신한은행", role: "IT본부장",
    lane: "capital", stance: "linked", tie: "서우 팔로우 중",
    why: "국내 은행의 IT 총괄. 케이웨더 B2B 축과 닿을 여지가 있고, 국내 결제·원화 경로 질문의 현실 감각을 얻는 자리다.",
    next: "크립토 프레임으로 열지 않는다. 열게 되면 케이웨더 명의·기업 데이터 문맥으로.",
  },
  /* ── 9/11 행사 명단 4종에서 (UN Blockchain Week · Nordic · EBC NY · DA Week London) ──
     수백 명 중 우리 레인에 닿는 여섯만 옮겼다. 명단을 다 넣으면 수첩이 아니라 팸플릿이 된다. */
  {
    id: "mavis", gate: "data", name: "Burcu Mavis", org: "UNDP AltFinLab", role: "Blockchain Academy and Accelerator Lead",
    lane: "impact", stance: "hold", meet: "Nordic 컨퍼런스",
    why: "★ UN 개발계획의 대체금융 랩. 공기질은 공중보건·기후 적응 데이터라 개발금융의 관심사와 바로 닿고, Get Blue·IFC 축과 같은 세계다. 우리 임팩트 레인에서 가장 제도권 쪽 문.",
    next: "Water.org 경로가 먼저 서야 한다 — 실적 없이 UN 계열을 두 곳 동시에 열면 둘 다 가벼워진다.",
  },
  {
    id: "maharajan", gate: "data", name: "Arun Maharajan", org: "UNICEF", role: "Blockchain Lead",
    lane: "impact", stance: "hold", meet: "Nordic 컨퍼런스",
    why: "유니세프의 블록체인 담당. 아동 환경 보건과 실내 공기질은 논거가 이어진다.",
    next: "UNDP 쪽과 같은 대기. 둘 중 하나가 열리면 그 경로로 나머지를 소개받는다.",
  },
  {
    id: "karwan", gate: "ship", name: "Liam Karwan", org: "Chainlink Labs", role: "Head of RWA & Stablecoins",
    lane: "market", stance: "hold", meet: "Nordic 컨퍼런스",
    why: "체인링크 세 번째. RWA·스테이블코인 쪽이라 우리 RLUSD 정산과는 닿지만, 오라클 축 1순위는 예측시장을 직함에 단 Ash Nathan 이다.",
    next: "열지 않는다. 한 회사에 셋을 늘어놓되 문은 하나다.",
  },
  {
    id: "kaul", gate: "data", name: "Sandy Kaul", org: "Franklin Templeton", role: "Global Head of Digital Assets",
    lane: "capital", stance: "hold", meet: "EBC Digital Assets Forum NY",
    why: "sgBENJI 발행사의 **실무 총괄**. CEO(Jenny Johnson)보다 이쪽이 말이 통하는 자리다 — 싱가포르 은행 거래소가 그 펀드를 RLUSD 와 나란히 상장한 건이 우리 「왜 RLUSD」 논거의 뿌리다.",
    next: "컨택하지 않는다. 사례 인용으로만 쓰고, 인용할 때도 기관 이름을 호명하지 않는다.",
  },
  {
    id: "adrian", gate: "data", name: "Tobias Adrian", org: "IMF", role: "Director, Digital Asset",
    lane: "impact", stance: "hold", meet: "EBC Digital Assets Forum NY",
    why: "국제통화기금의 디지털자산 총괄. 우리가 말을 걸 자리는 아니지만, 국제기구가 이 레인에 서 있다는 것 자체가 UNDP·IFC 축의 배경이다.",
    next: "컨택 없음. 발언은 소재로 읽는다.",
  },
  {
    id: "batchelor", gate: "sale2", name: "Ariane Batchelor", org: "Mastercard", role: "Director, Account Management",
    lane: "pay", stance: "hold", meet: "Nordic 컨퍼런스",
    why: "마스터카드 두 번째. 어카운트 관리 쪽이라 Move 프로덕트 디렉터와 직무가 다르다.",
    next: "열지 않는다. 마스터카드는 Move 쪽 한 문으로 간다.",
  },
  /* ── 9/16 추가 — 1촌 57명과 대조해 지도에 없던 사람들 ────────────────────
     지도 95명 중 실제 1촌은 17명뿐이었고, 1촌 57명 중 40명이 지도 밖이었다.
     아래는 그중 우리 레인에 닿는 사람만. 내부 인원·비크립토 지인은 올리지 않는다.
     ⚠ Takuya Sugiyama(SBI) 는 SBI Ripple Asia 이사 겸직이라 「리플 소속은 올리지 않는다」
        규칙을 넓게 적용해 제외했다. 판정은 business-directions 에만 남긴다. */
  {
    id: "mcdonough", name: "Michael McDonough", org: "Bloomberg",
    role: "Global Head of Market Innovation (2026-01~) · 전 Chief Economist, Financial Product (7년 10개월) · 블룸버그 16년 6개월 · FTV Capital 자문위원",
    lane: "market", stance: "linked", tie: "1촌(9/16) · 공통 1촌 Nicole(Kalshi)",
    why: "**이 지도에서 우리 소재에 가장 가까운 사람이다.** ⓐ 그가 만든 **ECAN 이 블룸버그의 경제·대체 데이터 분석기**이고 **예측시장을 터미널에 처음 통합한 것도 그**다 — 우리가 파는 것이 정확히 **대체 데이터**이고 우리 논거가 **정산 기준값**이다. ⓑ 현재 자리는 토큰화·스테이블코인·온체인 시장구조·예측시장 전략을 정의하는 그룹의 공동 리드이고 **터미널 제품·데이터·기관 쪽을 만든다** — **터미널에 데이터가 들어가는 경로가 이 사람이다.** ⓒ 홍콩에서 아시아 이코노미스트를 3년 했다.",
    next: "기기 가동 전에는 **방법론만으로 선다** — 11개 소스 합의·이상치 선별·계산 전 원장 지문. 전 수석이코노미스트라 **지표가 무엇으로 만들어지는가**를 직업으로 따진 사람이니 숫자보다 **구성 방식**이 통한다. ⚠ 예측시장 담당이라 **다른 거래소·플랫폼 지목 0**. ⚠ **공통 1촌이 Nicole(Kalshi)** 이라 Kalshi 건(Edward·Nicole)과 **동시에 열지 않는다.**",
  },
  {
    id: "parkinson", name: "Matthew Parkinson", org: "Bloomberg",
    role: "Digital Assets & Market Innovation (2026-03~) · 전 Product Manager · 전 Team Leader: FX, IRD, CDS & Price Discovery · 블룸버그 14년 9개월",
    lane: "market", stance: "hold", tie: "2촌 · 1촌 신청 대기 · 공통 1촌 Michael", group: "Bloomberg",
    why: "**Michael 의 팀으로 보인다** — 부서명이 같고(Digital Assets & Market Innovation) Michael 이 2026-01 그 그룹 공동리드로 간 뒤 그가 2026-03 에 그 부서로 옮겼다. **둘 다 Rutgers 경제학**이다. **FX·금리파생·CDS 의 가격 발견(price discovery)을 팀으로 이끈 이력** — Michael 이 「왜 중요한가」를 보는 자리라면 **이쪽은 그 값을 어떻게 만드는가를 보는 자리**이고, 그게 정확히 우리가 파는 것이다.",
    next: "⚠ **Michael 이 먼저다.** 블룸버그 두 번째이고 **위아래로 동시에 들어가는 형태**라 Tether(Marco·Ply)와 같은 문제다. 1촌은 받아두되 **따로 제안하지 않는다** — Michael 과 대화가 열리면 그 안에서 팀으로 넓힌다.",
  },
  {
    id: "tokenpost", name: "David Jiho Kim", org: "TOKENPOST", role: "CEO",
    lane: "voice", stance: "linked", tie: "1촌(9/7) — 메시지 0",
    why: "**국내 크립토 매체 대표.** 10/3 국내 보도의 가장 짧은 경로인데 아홉 날 동안 열지 않았다.",
    next: "10/3 전에 연다. **보도 요청이 아니라 소개부터** — 대표에게 기사 부탁으로 시작하면 광고 문의로 접힌다.",
  },
  {
    id: "rajk", name: "Raj Kushwaha", org: "독립 (Web3 Growth·Branding·Community)", role: "11K+ 팔로워",
    lane: "voice", stance: "linked", tie: "1촌(9/14)",
    why: "인플루언서 본인이자 커뮤니티 빌더. **실물 기기는 그쪽 소재로 드물다.**",
    next: "우선순위 아래. **Tina 쪽이 먼저다** — 한 명씩 찾는 것보다 KOL 판을 아는 사람에게 한 번 묻는 게 빠르다.",
  },
  {
    id: "marcodl", name: "Marco Dal Lago", org: "Tether", role: "Chief Expansion Officer (CXO)",
    lane: "pay", stance: "hold", tie: "1촌(9/10)", group: "Tether", gate: "saleend",
    why: "테더 확장 총괄. **Ply(태국·인도차이나 Country Manager)의 상사 라인**이다.",
    next: "⚠⚠ **열지 않는다.** Ply 에게 첫 인사를 보내는 중인데 **같은 회사 위아래로 동시에 들어가면 사내에서 겹친다.** Ply 가 답하거나 닫힌 뒤에 본다. 테더 상대에게 **RLUSD 를 먼저 꺼내지 않는다**(직접 경쟁 통화).",
  },
  {
    id: "shawnma", name: "Shawn Ma", org: "OKX", role: "Head of OKX DEX · ex Crypto.com & Tencent",
    lane: "exchange", stance: "hold", tie: "1촌(9/11)", group: "OKX", gate: "saleend",
    why: "**Morty 보다 높은 자리**이고 DEX 총괄이다. ex 크립토닷컴이라 우리 현재 대화와도 스친다.",
    next: "⚠ **OKX 두 번째다.** 현직 거래소라 인사만이고, 제안 단계에서는 Morty 와 둘 중 하나만 간다 — **자리로 보면 Shawn 쪽**. 9/30 뒤 재판정.",
  },
  {
    id: "kagan", name: "Nicole Kagan", org: "Kalshi", role: "Markets + Research",
    lane: "market", stance: "hold", tie: "1촌(9/10)", group: "Kalshi", gate: "ship",
    why: "Kalshi 리서치. Edward(감시)와 자리가 다르다 — 그는 사후 분쟁, 이쪽은 **시장 설계**다. **Michael(Bloomberg)의 공통 1촌**이기도 하다.",
    next: "⚠ **Kalshi 두 번째.** Edward 건이 끝나기 전에는 열지 않는다.",
  },
  {
    id: "niki", name: "Niki Ariyasinghe", org: "Chainlink", role: "Growing the onchain economy",
    lane: "market", stance: "linked", tie: "1촌(9/10)", group: "Chainlink",
    why: "체인링크 네 번째 접점. 오라클 판의 표준을 쥔 쪽이라 **경쟁이자 유통 경로**다.",
    next: "체인링크는 이미 넷이다. **한 문으로 좁히지 않으면 뿌리는 것으로 보인다** — 누구로 갈지 먼저 정한다.",
  },
  {
    id: "kenlee", name: "Ken Lee", org: "Binance", role: "VIP & Institutional Sales",
    lane: "exchange", stance: "off", tie: "1촌(9/10)", group: "Binance",
    why: "바이낸스 기관 세일즈. 우리는 그의 고객이 아니다.",
    next: "열지 않는다. **바이낸스만 1촌이 셋**(Emily·Ken·Lauren)이라 이미 상한을 넘었다 — Emily 한 문으로 간다.",
  },
  {
    id: "laurenlee", name: "Lauren Lee", org: "Binance", role: "Web3 Wallet BD · pre-PhD in Metaverse Business",
    lane: "exchange", stance: "off", tie: "1촌(9/15)", group: "Binance",
    why: "Web3 지갑 BD. 지갑 연동은 먼 얘기다.",
    next: "열지 않는다(바이낸스 상한).",
  },
  {
    id: "natalielau", name: "Natalie Lau", org: "BitMEX", role: "Head of Institutions",
    lane: "exchange", stance: "off", tie: "1촌(9/10)",
    why: "기관 총괄. 우리 단계와 맞지 않는다.",
    next: "열지 않는다.",
  },
  {
    id: "soledad", name: "Soledad Contreras", org: "CoinDesk", role: "Head of Partnerships, EMEA & APAC (런던) — CoinDesk 5년 7개월 · 前 Euromoney·Global Capital Publisher 15년",
    lane: "voice", stance: "hold", tie: "2촌 — 1촌 요청 대기", via: "공통 1촌 Katie",
    why: "⚠ **Partnerships 가 파트너십이 아니라 「media and sponsorship sales」다**(프로필 원문). Euromoney 에서도 15년을 Publisher(광고·세일즈 총괄)로 있었다. **열면 자동으로 우리가 사는 대화**가 된다 — Brian(편집)·Eri(무상 KOL)와 성격이 정반대다.",
    next: "**1촌만. 메시지 0.** ① 지금 유료 집행 단계가 아니다(판매 직후·배송 전·마케팅 예산 미확정) ② **Eri 무상 협업이 방금 성사됐다 — 무상을 굴려보지도 않고 유료 영업을 여는 것은 순서가 거꾸로** ③ 편집 라인(Brian)이 이미 있고 **편집이 광고보다 값이 크다**. **게이트: 마케팅 예산이 서고 유료 미디어 집행을 결정한 뒤, 또는 CoinDesk 행사 참가를 결정한 뒤.** 부수: 수상 이력·Mentor/Advisor/Speaker 로 **소개 경로 값**이 있으나 그것을 노리고 지금 열면 티가 난다.",
  },
  {
    id: "royle", name: "Alexander Royle", org: "Binance", role: "Head of Market Supervision (아부다비) — 前 Cor Prime 공동창업·CRO/MLRO · Galaxy EMEA 규제 총괄 3년 · Montis Digital CCO",
    lane: "exchange", stance: "open", tie: "2촌 — 1촌 요청 발송, 수락 대기", group: "Binance",
    why: "**시장 감시는 정산값 분쟁이 떨어지는 유일한 자리다.** 9/17 에 확정한 우리 정체(데이터가 아니라 **판정**을 판다)의 **최종 소비자**가 정확히 이 자리 — 9/15 판정 때는 우리가 「데이터 공급자」였으나 그 사이 제품 정의가 바뀌었다. 규제·감시 축에서 만날 수 있는 가장 높은 자리 중 하나.",
    next: "**Lynn 형식 회사 소개까지만**(9/15 서우 결정 — 소개는 제안이 아니다). **수락 후** 발송. ⚠ 바이낸스 **세 번째 열린 문**(Emily·Max 무응답 2개) — 자리가 겹치지 않고 하는 말이 달라 진행하되, 셋이 문장을 비교해도 각자 다른 말을 받았다는 게 보여야 한다. 거래소 가드 전면 적용: **상장·토큰·멀티체인·체인 이름 0**(XRPL 대신 `public ledger`), **다른 거래소·플랫폼 지목 0**(Lynn 판의 `a large venue` 문장을 뺀 이유). 제안은 **기기 가동 + 데이터 실적** 뒤.",
  },
  {
    id: "henrykey", name: "Henry Key", org: "Hashed", role: "Business Development Manager (아부다비 상주) — LP·포트폴리오사의 UAE 진출 주도 · 前 삼성전자 재무",
    lane: "capital", stance: "talking", tie: "1촌(9/8) · 공통 1촌 4명",
    why: "**★ 새 각도(9/17 서우)**: 투자가 아니라 **시장**이다. 케이웨더가 몇 해 전 두바이를 에이전시 경로로 봤을 때 **실외 대기질보다 실내 공기질 문의가 훨씬 많았다** — 더위로 실내 체류가 긴 지역이라 억지 논리가 아니고 **이미 현장에서 확인된 수요**다. **계속 눈여겨보고 있는 시장으로 말한다(현재형).**",
    next: "**정보를 주는 것으로 연다 — 요청 0.** ⚠ 우리는 Hashed 포트폴리오사가 아니라 **그에게 뭘 요청하면 「왜 내가」가 되고 자동으로 「투자받고 싶다」로 읽힌다**(투자로 열지 않는다는 판정을 우리가 깨게 된다). 두바이 관찰을 건네고 **서울에 있는지만 묻는다**. **⚠ 「접었다」를 쓰지 않는다(9/17 서우)** — 우리를 포기한 쪽으로 만들고 상대가 「그럼 지금도 안 되겠네」로 받는다. **「그 이후로도 계속 눈여겨보고 있는 시장」으로 현재형**을 쓴다. 그때 왜 본격적으로 안 했는지는 **공백으로 둔다** — 물으면 답하고, 먼저 꺼내면 없던 문제를 만든다. ⚠ 타이밍: 4개월 준비한 **아부다비 투자 포럼이 9/16 서울 개최 중** — 이번 주가 그의 최대 바쁜 주라 **답은 늦을 것을 전제**한다. 지금 UAE 진출은 실체가 없다(배송 전·10/3·크립토닷컴 진행 중) — **「진출하고 싶다」를 말하지 않는다.**",
  },
  {
    id: "dsrv", name: "Byeongyun Seo", org: "DSRV", role: "Co-CEO",
    lane: "xrpl", stance: "linked", tie: "1촌(9/6) — 메시지 0",
    why: "**한국 블록체인 인프라 대표 기업**(밸리데이터·노드). 기기 네트워크의 운영 문제를 이미 푼 쪽이다.",
    next: "Henry 와 같은 결 — 국내 생태계 소개. 기술 질문이 자연스러운 상대라 **묻는 형태**가 맞다.",
  },
  {
    id: "katiewheeler", name: "Katie Wheeler", org: "Ondo Finance", role: "MD, Global Partnerships · ex BlackRock + Circle",
    lane: "capital", stance: "hold", tie: "1촌(9/9)", gate: "data",
    why: "토큰화 RWA 파트너십 총괄. 이력(블랙록·서클)이 기관 쪽 신뢰 축이다.",
    next: "게이트 = 데이터 실적. 지금은 우리가 팔 것이 없다.",
  },
  {
    id: "heejinshin", name: "Heejin Shin", org: "교보증권 · 교보생명그룹",
    role: "Director, Head of New Business Development — Digital Assets/Fintech & Ventures",
    lane: "capital", stance: "linked", tie: "1촌(9/2) — 메시지 0",
    why: "**국내 기관 신사업.** 케이웨더가 코스닥 상장사라 국내 금융권과의 대화는 결이 다르다 — 여기선 상장 사실이 자연스러운 신뢰 신호다.",
    next: "10/3 뒤. 국내 기관은 **실물과 무대를 보고 판단**한다.",
  },
  {
    id: "nahyunkang", name: "Nahyun Kang", org: "J.P. Morgan", role: "F&O · Bridging TradFi and On-Chain Finance",
    lane: "capital", stance: "hold", tie: "1촌(9/7)", gate: "ship",
    why: "선물·옵션. 파생 기초 참조값 논조가 닿는 자리다.",
    next: "Chantal·Michael 과 같은 논조라 **셋을 동시에 열지 않는다.**",
  },
  {
    id: "hazelxu", name: "Hazel Xu", org: "ICE", role: "Quant analyst · Columbia MFE",
    lane: "capital", stance: "hold", tie: "1촌(9/10)", group: "ICE",
    why: "ICE 퀀트. **Lynn Martin(NYSE Group President · ICE Fixed Income and Data Services 의장)과 같은 그룹**이다.",
    next: "⚠ **Lynn 2차 DM 이 발송 대기 중**이다. 같은 그룹에 동시에 들어가지 않는다 — Lynn 이 먼저다.",
  },
  {
    id: "liaq", name: "Lia Q", org: "(비공개)", role: "AI Compute · AIDC Partnerships · Digital Assets",
    lane: "compute", stance: "linked", tie: "1촌(9/10) — 메시지 0",
    why: "**AI 데이터센터 파트너십 + 디지털자산**이 한 사람에 있다. 9/14 내부 회의의 AI 팩토리 구상과 같은 축이다.",
    next: "⚠ 내부에서 **AI 팩토리 NFT 원가에 5년치 토큰 지급분이 비용으로 들어가 보상 비보장 원칙과 충돌**하는 문제가 아직 안 풀렸다. **설계가 정리되기 전에 대외로 열지 않는다.**",
  },
  {
    id: "ktcloud", name: "Seungyeon Song", org: "kt cloud", role: "AI Data Center Business Development & Strategy",
    lane: "compute", stance: "linked", tie: "1촌(9/2) — 메시지 0",
    why: "**국내 AI 데이터센터.** GPU 노드 구상이 실제가 되려면 국내에서 가장 먼저 닿아야 할 자리다.",
    next: "Lia Q 와 같다 — 내부 설계 정리 뒤. 다만 **국내라 만나기 쉽다**는 점은 별개 값이다.",
  },
  {
    id: "jimilee", name: "Jimi Lee", org: "Google Cloud", role: "Scaling Web3 & AI (서울)",
    lane: "compute", stance: "linked", tie: "1촌(9/8) — 메시지 0",
    why: "구글 클라우드 서울의 Web3·AI 축. 크레딧·기술 지원 프로그램이 스타트업에 열려 있는 통로다.",
    next: "판매·토큰 얘기 0으로 **인프라 대화만** 연다. 이 레인은 대외 리스크가 가장 낮다.",
  },
];
