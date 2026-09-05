/* 생태계 동향 — CS 화면용 큐레이션 (9/2 서우 — "rlusd, xrp, ripplelabs, xrpl 동향을 대시보드에")

   자동 수집이 아니다. depin/intel/ecosystem-log.md 에서 검증 등급을 붙여 옮긴 것만 싣는다.
   자동 피드는 하이프와 미검증을 CS 화면에 그대로 끌어들이고, 담당자는 그 화면을 보고 고객에게
   말하게 된다 — 그 경로를 처음부터 막는다.

   시세·시총·가격 전망은 싣지 않는다. 내부 화면이라도 담당자 눈앞에 가격이 있으면 고객에게
   가격 얘기가 새어 나간다. RLUSD 발행 잔액만 예외인데, 그것은 가격이 아니라 스테이블코인
   공급량(채택 지표)이라서다 — 그래도 "시총"이라 부르지 않는다.

   갱신은 이 파일을 고쳐 재배포한다. 정본을 고칠 때 같이 옮기고 INTEL_UPDATED 를 올린다. */

export type IntelTopic = "RLUSD" | "XRPL" | "XRP" | "Ripple" | "한국";
export type IntelGrade = "공식" | "검증" | "미검증";

export type IntelItem = {
  /* YYYY-MM-DD. 날짜를 모르는 달 단위 사실은 YYYY-MM 까지만 */
  date: string;
  topic: IntelTopic;
  grade: IntelGrade;
  title: string;
  /* 우리에게 무슨 뜻인지 — 담당자가 읽는 글 */
  note: string;
  source: string;
  /* 공개 원출처만 링크한다 */
  url?: string;
  /* 고객에게 그대로 말해도 되는 한 줄. 없으면 내부 참고만 */
  say?: string;
};

export const INTEL_UPDATED = "2026-09-02";

export const TOPICS: { key: IntelTopic; label: string }[] = [
  { key: "RLUSD", label: "RLUSD" },
  { key: "XRPL", label: "XRPL" },
  { key: "XRP", label: "XRP" },
  { key: "Ripple", label: "Ripple" },
  { key: "한국", label: "한국" },
];

export const GRADE_HELP: Record<IntelGrade, string> = {
  공식: "발행사·당사자의 공식 발표. 고객에게 그대로 말해도 된다.",
  검증: "원출처로 독립 확인됨. 말해도 되지만 수치에는 '약'을 붙인다.",
  미검증: "외부 집계·보도 단계. 고객에게 말하지 않는다 — 내부 참고만.",
};

/* 응대 기준 — 동향보다 위에 둔다. 동향을 읽고 나서 이것을 잊으면 안 된다. */
export const CS_RULES: { k: string; v: string }[] = [
  { k: "시세·가격 전망", v: "어떤 경우에도 말하지 않는다. 물으면 — \"가격 얘기는 저희가 하지 않습니다.\"" },
  { k: "\"XRP 대신 RLUSD?\"", v: "비교하지 않는다. 사실만 — \"저희는 RLUSD로 정산합니다.\" 어느 편에도 서지 않는다." },
  { k: "보상", v: "테스트 중. 지급량·가치 비보장. \"얼마 버나\" 에는 숫자를 내지 않는다." },
  { k: "미검증 항목", v: "고객에게 말하지 않는다. 이 화면에서도 회색 표시는 내부 참고다." },
];

export const INTEL: IntelItem[] = [
  {
    date: "2026-09-02", topic: "한국", grade: "공식",
    title: "케이웨더 × 아이오트러스트(디센트) 기술 협력 MOU",
    note: "협력 검토 범위: 장비 등록 · 관측 데이터 수집 · 보상 모델 · 지갑 활용 등 사용자 흐름 설계. 구체 일정은 향후 실무 협의. 보상 레이어는 테스트 중.",
    source: "케이웨더 보도자료 (9/2 09:00)",
    say: "디센트(아이오트러스트)와 기술 협력 MOU를 체결했습니다. 지갑·온보딩 쪽 협력이고, 보상 레이어는 아직 테스트 중입니다.",
  },
  {
    date: "2026-09-01", topic: "Ripple", grade: "공식",
    title: "Ripple Custody × SettleMint 파트너십 — 아시아 우선",
    note: "기관용 커스터디와 디지털 자산 라이프사이클 플랫폼을 한 경로로 묶는 발표. 발표 범위는 '커스터디 · 발행 · 컴플라이언스'까지 — \"XRPL로 발행이 몰린다\"는 발표에 없는 확대 해석이다(X에서 도는 흐름도).",
    source: "PR Newswire · Ripple",
    url: "https://www.prnewswire.com/news-releases/ripple-and-settlemint-partner-to-provide-digital-asset-custody-and-tokenization-for-financial-institutions-in-asia-pacific-302865190.html",
  },
  {
    date: "2026-09-01", topic: "RLUSD", grade: "공식",
    title: "BlackRock BUIDL · VanEck VBILL → RLUSD 24/7 즉시 환매",
    note: "Ripple × Securitize. 펀드 보유자가 지분을 언제든 RLUSD로 바꿀 수 있다. 환매는 이더리움·솔라나·아발란체·폴리곤 위에서 일어난다 — \"XRPL에서 정산\"이 아니다.",
    source: "Ripple 프레스룸",
    url: "https://ripple.com/ripple-press/ripple-and-securitize-enable-rlusd-smart-sontract-functionality-for-blackrock-buidl-and-vaneck-vbill-tokenized-funds/",
    say: "블랙록 BUIDL 펀드가 RLUSD로 24시간 환매되는 것은 리플 공식 발표에 있는 사실입니다.",
  },
  {
    date: "2026-08-31", topic: "RLUSD", grade: "공식",
    title: "RLUSD 발행 잔액 약 $2B — 그중 XRPL 위 약 절반",
    note: "리플 공식(8/25 $2B 돌파). XRPL 위 약 $963M ≈ 48%, XRPL 스테이블코인 공급의 90% 이상. 가격이 아니라 발행량(채택 지표)이다. \"XRPL판 비중\"과 \"XRPL 스테이블 중 RLUSD 비중\"은 다른 수치 — 섞지 않는다.",
    source: "@Ripple 공식 · 자체 집계 (ecosystem-log 8/31)",
    say: "RLUSD는 발행 잔액이 약 20억 달러이고 그중 절반쯤이 XRPL 위에 있습니다. 저희가 RLUSD로 정산하는 이유 중 하나입니다.",
  },
  {
    date: "2026-08-31", topic: "XRPL", grade: "검증",
    title: "XRPL 총 스테이블코인 공급, 스텔라 추월",
    note: "체인 단위 스테이블 공급 비교에서 처음 성립. \"그 체인에서 실제로 제일 많이 쓰이는 정산 수단\" 논지의 근거. 상대 이름을 들어 추월·승패로 말하지 않는다 — 비중·순위·기본값까지만.",
    source: "자체 집계 (ecosystem-log 8/31)",
  },
  {
    date: "2026-08-24", topic: "XRP", grade: "검증",
    title: "Gemini 싱가포르 — XRP XRPL 네이티브 입출금 개시",
    note: "XRP 한정. RLUSD 지원은 미확인이라 구매 가이드에는 아직 못 쓴다. 싱가포르 온램프 배경.",
    source: "@tyler (Gemini 공동창업자)",
  },
  {
    date: "2026-08-18", topic: "한국", grade: "검증",
    title: "리플 한국 파트너 3건 — 교보생명 · 케이뱅크 (4월), 전북은행 (8/18)",
    note: "교보생명 채권 토큰화(XRPL을 아시아 첫 정산층 후보로) · 케이뱅크 블록체인 송금 파일럿 · 전북은행. 4번째 발표와 SWELL 일정을 함께 추적 중.",
    source: "리플 발표 · 보도",
    say: "리플은 한국에서 교보생명, 케이뱅크, 전북은행과 협력을 발표했습니다.",
  },
  {
    date: "2026-07-28", topic: "한국", grade: "검증",
    title: "업비트 RLUSD 상장 — 국내 온램프",
    note: "국내에서 RLUSD를 살 수 있는 경로. 구매 가이드의 근거.",
    source: "업비트 공지",
    say: "RLUSD는 업비트에서 살 수 있습니다.",
  },
  {
    date: "2026-05", topic: "Ripple", grade: "검증",
    title: "JPMorgan Kinexys · Ondo · Mastercard — XRPL 토큰화 국채 결제 실증",
    note: "공개 블록체인(XRPL)과 은행 레일을 연결한 기관 실증. 주의: JPM 토큰화 예금은 Base·Canton — XRPL 아님. \"$wJPM DEX\" 류 글은 조작.",
    source: "참여사 발표 (5월)",
  },
  {
    date: "2026-08", topic: "XRPL", grade: "미검증",
    title: "v3.3.0 수정안 6종 — 지지율 미확인",
    note: "Sponsor · Batch · ConfidentialTransfer · PermissionDelegation · DynamicMPT · fixCleanup. 활성화 요건 80% 2주 연속. 리플이 PD 지지로 돌아선 것만 확인, 퍼센트는 미확인 — \"XX% 임박\" 류 글은 미검증.",
    source: "자체 추적",
  },
  {
    date: "2026-06", topic: "RLUSD", grade: "미검증",
    title: "SBI, RLUSD 일본 진출 (외부 집계표)",
    note: "원출처 확인 전. 일본 진출 시 결제 통화 지형의 배경으로만.",
    source: "외부 집계표 (9/2)",
  },
];
