/* 셀럽 로스터 — 누구를, 왜, 어떻게 (9/2 서우 — "셀럽 접근 내용이나 진화 과정도 대시보드에")

   depin/intel/celeb-ladder.md 의 화면판. 여기 있는 것은 우리가 정한 것(층·이유·접점·다음 수)이고,
   상대가 어디까지 받아줬는지(칸)는 lib/store.ts 의 celeb:ladder 에 서우가 화면에서 기록한다.
   두 가지를 섞지 않는다 — 로스터는 재배포로 바뀌고, 칸은 금요일마다 바뀐다. */

export type CelebTier = "A" | "B" | "C" | "KR";
export type Touch = { date: string; what: string };
export type Celeb = {
  /* X 핸들(@ 없이). 실계정이 아닌 묶음(행사 등)은 소문자 슬러그 */
  handle: string;
  name: string;
  tier: CelebTier;
  /* 왜 이 계정인가 — 한 줄 */
  why: string;
  /* 우리가 접근한 이력. 상대 반응은 여기 적지 않는다(칸이 그것이다) */
  touches: Touch[];
  /* 이번 주 목표 칸 */
  goal: number;
  next: string;
  /* 실계정이 아니면 false — 링크를 만들지 않는다 */
  real?: boolean;
};

export const CELEB_UPDATED = "2026-09-02";

export const TIERS: { key: CelebTier; label: string; want: string; how: string }[] = [
  { key: "A", label: "A 구면·관계", want: "답글·RT 받기", how: "그 사람 논지에 대한 구체 관찰 + 우리 실물 한 줄" },
  { key: "B", label: "B 씬 사상가", want: "답글란 노출 + 남이 캡처할 문장", how: "확장 트랙 — 테제 반쪽만, 상비 3줄" },
  { key: "C", label: "C 분석가·빌더", want: "되받는 관계 → 먼저 언급하게", how: "실질 답글, 그들의 문장 크레딧" },
  { key: "KR", label: "국내", want: "9/7 국내 커뮤니티 접점", how: "한국어 답글, 같은 규칙" },
];

/* 사다리 칸. 0 = 우리만 답글함 … 6 = 만남 */
export const RUNGS = ["우리만 답글", "좋아요 받음", "답글 받음", "RT 받음", "인용 받음", "먼저 언급", "만남"];

export const CELEBS: Celeb[] = [
  /* ── A ── */
  { handle: "ashgoblue", name: "Asheesh Birla · Evernorth CEO", tier: "A", real: true,
    why: "구면. 인프라 단상 글엔 붙고, 면책 문구·보도자료 딸린 글은 원칙상 무반응(9/2 예외 1건)",
    touches: [
      { date: "9/1", what: "\"plumbing\" 글 답글 초안 A (게시 여부 미확인)" },
      { date: "9/2", what: "Q2 배관 글 답글 게시 — \"Some of it will be rooms.\" + #KWEATHER #wellbian" },
    ],
    goal: 2, next: "9/3 Q2 Liquidity Report 나오면 리포트 안 사실 하나 지목형으로 한 번 더" },
  { handle: "DCENTWALLETS", name: "D'CENT Wallet · 파트너", tier: "A", real: true,
    why: "9/2 MOU 공지 상호 게시. 파트너 게시물 원칙 — 상품 얘기 배제, 축하 톤",
    touches: [
      { date: "8/24", what: "S+R3covery 카드 키트 축하 답글" },
      { date: "9/2", what: "파트너십 공지 순수 RT + 답글 \"Into the real world — that's the side we come from.\"" },
    ],
    goal: 3, next: "우리 고정 스레드 RT 는 요청하지 않는다 — 자연 반응 관찰" },
  { handle: "xrpl_commons", name: "XRPL Commons", tier: "A", real: true,
    why: "해커톤·수정안 원출처. 원출처 공지 트리거",
    touches: [
      { date: "8/25", what: "Regular Key 빌더 팁 — 셀프 증언 답글 (\"Identity outlives the incident.\")" },
      { date: "8/26", what: "마스터카드 × XRPL 해커톤 답글 (\"Rails attract builders. Builders attract giants.\")" },
    ],
    goal: 2, next: "10/3 전 Commons 원출처 공지 뜨면 즉시" },
  { handle: "flare-0905", name: "플레어 · 타임레버리지 · 리플 코리아 (9/5 워크숍)", tier: "A",
    why: "케이웨더×플레어 파트너십 공개 무대. 현장 = 사다리 두 칸 한 번에",
    touches: [{ date: "8/27", what: "사전 인용 A/B + 사후 T1/T2 원고 확정 (flare-workshop-0905.md)" }],
    goal: 6, next: "9/5 현장에서 만남 → 사후 원글에 현장 사진" },

  /* ── B ── */
  { handle: "heyibinance", name: "Yi He · Binance 공동창업자", tier: "B", real: true,
    why: "크립토 씬 확장 트랙 첫 적용. 테제 글만, 상품·주식·투자 0",
    touches: [{ date: "9/2", what: "\"whole-industry story\" 답글 — \"doesn't have a ticker. It has a reading.\" (1,452만 뷰 글)" }],
    goal: 1, next: "반응 없으면 추가 접촉 없음. 테제 글 재등장 시 1회 더" },
  { handle: "cz_binance", name: "CZ", tier: "B", real: true,
    why: "테제 글(에이전트 결제·산업 구조)일 때만. 시세·정치 글은 무반응",
    touches: [], goal: 0, next: "테제 글 등장 시 상비 3줄로. 하루 B층 1건" },
  { handle: "VitalikButerin", name: "Vitalik", tier: "B", real: true,
    why: "물리 세계·검증 테제 글일 때만. 체인 비교는 절대 안 함",
    touches: [], goal: 0, next: "테제 글 등장 시" },
  { handle: "cdixon", name: "Chris Dixon · a16z", tier: "B", real: true,
    why: "\"read-write-own\" 계열 테제. 우리 \"소유\" 축과 맞물림",
    touches: [], goal: 0, next: "테제 글 등장 시" },

  /* ── C ── */
  { handle: "mrcauliman", name: "MONOLITH 창립자", tier: "C", real: true,
    why: "커뮤니티 빌더. 시그니처 크레딧 인용 계정 (\"You can verify the transactions…\")",
    touches: [{ date: "9/2", what: "MONOLITH 글 답글 초안 — \"Physical storefronts, if you like.\" (게시 여부 미확인)" }],
    goal: 2, next: "답 오면 이어가기 — 빌더 대 빌더" },
  { handle: "WrathofKahneman", name: "WrathofKahneman · 분석가", tier: "C", real: true,
    why: "검증된 분석가. 접점 3건 = 관계 자산 진행 중",
    touches: [
      { date: "8/22", what: "신용 딜 스레드 답글 (\"Credit follows evidence.\")" },
      { date: "8/2x", what: "Fordefi 글 답글" },
      { date: "8/26", what: "Xago × OpenPayd 답글 초안 (\"Quiet compounding beats loud launches.\")" },
    ],
    goal: 2, next: "기관 유동성 글 등장 시 시퀀싱 지목형" },
  { handle: "rootveg444", name: "rootveg444 · PD 스레드", tier: "C", real: true,
    why: "질문형 답글이 답을 받은 사례 후보",
    touches: [{ date: "8/23", what: "Permission Delegation 질문형 답글" }],
    goal: 2, next: "답 왔는지 확인 — 왔으면 이미 2" },
  { handle: "alina_creates", name: "alina_creates · Virtuals 분석", tier: "C", real: true,
    why: "고품질 분석가. 에이전트 결제 축",
    touches: [{ date: "8/24", what: "Virtuals 타임라인 답글 (\"machines paying machines still needs someone measuring the room\")" }],
    goal: 1, next: "에이전트 결제 글 재등장 시 5c 연결" },
  { handle: "xrpl-analyst-0830", name: "XRPL 온체인 분석가 (핸들 미기입)", tier: "C",
    why: "\"숫자가 무엇을 재는가\" — 우리 검증 테제와 동일 축",
    touches: [{ date: "8/30", what: "답글 (\"Counting is easy…\" 추정, 내용 미확인)" }],
    goal: 2, next: "핸들 기입 필요" },

  /* ── 국내 ── */
  { handle: "0xHanMoon", name: "0xHanMoon · KBW 가이드", tier: "KR", real: true,
    why: "국내 커뮤니티. 9/7 사전예약 주간 접점",
    touches: [{ date: "8/24", what: "KBW 서울 방문 가이드 답글 — 공기질 팁, 제품 언급 없음" }],
    goal: 2, next: "9/7 주간 국내 커뮤니티 접점" },
];
