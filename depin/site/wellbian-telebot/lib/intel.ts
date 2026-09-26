/* 생태계 동향 — CS 화면용 큐레이션 (9/2 서우 — "rlusd, xrp, ripplelabs, xrpl 동향을 대시보드에")

   자동 수집이 아니다. depin/intel/ecosystem-log.md 에서 검증 등급을 붙여 옮긴 것만 싣는다.
   자동 피드는 하이프와 미검증을 CS 화면에 그대로 끌어들이고, 담당자는 그 화면을 보고 고객에게
   말하게 된다 — 그 경로를 처음부터 막는다.

   시세·시총·가격 전망은 싣지 않는다. 내부 화면이라도 담당자 눈앞에 가격이 있으면 고객에게
   가격 얘기가 새어 나간다. RLUSD 발행 잔액만 예외인데, 그것은 가격이 아니라 스테이블코인
   공급량(채택 지표)이라서다 — 그래도 "시총"이라 부르지 않는다.

   갱신은 이 파일을 고쳐 재배포한다. 정본을 고칠 때 같이 옮기고 INTEL_UPDATED 를 올린다. */

export type IntelTopic = "RLUSD" | "XRPL" | "XRP" | "Ripple" | "한국" | "DePIN";
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

export const INTEL_UPDATED = "2026-09-10";

export const TOPICS: { key: IntelTopic; label: string }[] = [
  { key: "RLUSD", label: "RLUSD" },
  { key: "XRPL", label: "XRPL" },
  { key: "XRP", label: "XRP" },
  { key: "Ripple", label: "Ripple" },
  { key: "한국", label: "한국" },
  { key: "DePIN", label: "DePIN" },
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
  /* ── 9/10 갱신 — ecosystem-log 9/3~9/10 + 행사 2건. 미검증 항목에는 say 를 두지 않는다(CS_RULES). ── */
  {
    date: "2026-10-03", topic: "한국", grade: "공식",
    title: "XRP SEOUL 2026 (10/3, 그랜드 하얏트 서울) — 케이웨더 플래티넘 스폰서, 기기 실물 시연",
    note: "주최 @XRPSEOUL 공지(9/9) + 우리 인용 게시. 무대에서 기기가 실시간으로 측정하고 XRPL 에 기록하는 것을 보여준다. 표기는 XRP SEOUL 2026. 케이웨더는 기기 파트너·플래티넘 스폰서 — 리플과의 공식 관계로 읽히는 표현은 쓰지 않는다. 구매자 대상 입장권 추첨(200명)은 FAQ 정본 문항대로.",
    source: "@XRPSEOUL 공지 · @wellbianlabs 인용 게시 (9/9)",
    url: "https://x.com/wellbianlabs/status/2097498079058702617",
    say: "10월 3일 XRP SEOUL 2026 에서 케이웨더가 플래티넘 스폰서로 참여하고, wellbian 기기를 현장에서 보실 수 있습니다. 구매자 중 추첨으로 입장권을 드립니다.",
  },
  {
    date: "2026-09-29", topic: "한국", grade: "공식",
    title: "KBW 2026 — 9/29~10/1 워커힐, 업비트 메인 스폰서 (우리 부스·연사 없음)",
    note: "9/29 는 업비트와 여는 비공개 기관 포럼, 9/30~10/1 이 본 컨퍼런스(주최 FactBlock). 이틀 뒤 10/3 XRP SEOUL 2026 이 우리 무대 — KBW 방문객이 그 관객이다. 연사 컨택은 business-directions 의 우선순위표를 따른다(거래소 소속은 9/30 까지 인사만).",
    source: "KBW 2026 보도자료 (PR Newswire 1/13) · koreablockchainweek.com",
    url: "https://www.prnewswire.com/news-releases/kbw-2026-returns-to-seoul-september-29october-1-upbit-joins-as-main-sponsor-302660025.html",
    say: "KBW 에는 저희 부스가 없습니다. 10월 3일 XRP SEOUL 2026 에서 기기를 직접 보실 수 있습니다.",
  },
  {
    date: "2026-09-07", topic: "DePIN", grade: "미검증",
    title: "Helium — 도시 단위 공기질·환경 센서망에 진입 (산호세 · 뉴욕, 2차 자료)",
    note: "Helium LoRaWAN 을 시 전역 공기질·환경 센서 연결에 쓴다는 보도. 판매가 열리면 「Helium 이 이미 하잖아」 가 온다. 구분 두 겹: ⓐ Helium 은 데이터를 나르는 망이고 센서는 시가 설치, 우리는 데이터를 만드는 기기 ⓑ 도시 센서는 세금으로 실외를 재고, 우리 기기는 개인이 자기 돈으로 자기 공간을 잰다. 먼저 호명하지 않는다 — 질문받았을 때만 층 구분으로 답한다.",
    source: "2차 매체 (ecosystem-log 9/7) — 원문 미열람",
  },
  {
    date: "2026-09-05", topic: "한국", grade: "공식",
    title: "Flare Korea 워크숍 (9/5) — 케이웨더 × 플레어 세션",
    note: "주체는 케이웨더 × Flare(공개 LOI, 검증 협력). 웰비안이 직접 통합한 것이 아니다 — 대외 표현은 Flare's FDC applies to the device indirectly, through KWeather's side. 9/30 판매 종료까지 멀티체인·타 체인 확장 언급 금지. 예매 인증서 NFT 를 Flare 지갑으로 받는 선택지는 FAQ 정본 문항대로만 말한다.",
    source: "Flare Korea 행사 · @wellbianlabs 정리 타래 (9/5)",
  },
  {
    date: "2026-09-03", topic: "XRPL", grade: "검증",
    title: "BIS Working Paper 1374 — 공식 통계의 지문을 XRPL 에 앵커링 (개념검증, DevNet)",
    note: "BIS Open Tech: 통계 파일을 정규화해 SHA3-512 지문 → 머클 루트를 XRPL 트랜잭션에 앵커, 파일 + 원장 조회 한 번으로 1~2초 검증. 원본 파일은 체인에 올리지 않는다. 우리 판독값 파이프라인(원시 데이터 오프체인 · 배치 머클 루트만 Memos)과 같은 형태. 프로덕션 아님 — 「BIS 가 XRPL 을 채택」 으로 말하지 않는다. 앵커 비용·초당 수치는 원문 미확인이라 인용 금지.",
    source: "BIS Open Tech 페이지 · BIS Working Papers No 1374 표지 (ecosystem-log 9/3)",
    say: "국제결제은행(BIS)이 공식 통계의 위변조 검증에 XRPL 을 개념검증으로 썼습니다. 파일은 밖에 두고 지문만 원장에 남기는 방식인데, 저희 측정 데이터도 같은 방식으로 기록합니다.",
  },
  {
    date: "2026-02-12", topic: "RLUSD", grade: "검증",
    title: "바이낸스 — RLUSD 상장(1/22, 이더리움) 뒤 XRPL 입출금 통합(2/12)",
    note: "페어 RLUSD/USDT · RLUSD/FDUSD · XRP/RLUSD. 이후 OKX(4월)·Gate(6/15) 상장. 바이낸스 유저는 RLUSD 를 사서 출금 네트워크를 XRPL 로 고르면 우리 결제 지갑에 직접 낼 수 있다 — 현행 FAQ 경로 그대로. Binance Pay 는 별개(바이낸스 내부 장부의 오프체인 결제)이며 도입 계획 없음. 한국 거주자는 바이낸스 이용 대상이 아니다.",
    source: "CoinDesk 1/21 · 바이낸스 공지 (ecosystem-log 9/10)",
    say: "해외 거래소에서 산 RLUSD 는 출금할 때 네트워크를 XRPL 로 선택하면 지갑으로 보낼 수 있습니다. 다른 네트워크를 고르면 자산을 잃을 수 있으니 주의하세요.",
  },
  {
    date: "2025-09-18", topic: "RLUSD", grade: "미검증",
    title: "DBS 디지털 거래소 — 프랭클린템플턴 토큰화 MMF(sgBENJI)와 RLUSD 를 나란히 상장 (MOU, 2차 자료)",
    note: "적격·기관 고객이 둘 사이를 24/7 · 수 분 내 전환, 2단계는 sgBENJI 담보 대출. 9/8 X 에 리플 케이스 스터디 이미지로 재유통. 원문(ripple.com · dbs.com) 미열람, 현재 가동 여부 미확인 — 「구축」 까지만, 「가동 중」 단정 금지. 대외에서는 기관 이름을 호명하지 않고 「싱가포르 은행의 디지털 거래소」 로 말한다.",
    source: "CoinDesk · DBS 뉴스룸 제목 기준 (ecosystem-log 9/8)",
  },
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
    note: "Sponsor · Batch · ConfidentialTransfer · PermissionDelegation · DynamicMPT · fixCleanup. 활성화 요건 80% 2주 연속. 리플이 PD 지지로 돌아선 것만 확인, 퍼센트는 미확인 — \"XX% 임박\" 류 글은 미검증. 9/7: 보도 수치는 신뢰 검증자 35곳 중 7곳(≈20%)로 여전히 임박 아님. 「보안 검토 미통과 2건 재제출」 헤드라인은 본문 미확인 — 인용 금지.",
    source: "자체 추적",
  },
  {
    date: "2026-06", topic: "RLUSD", grade: "미검증",
    title: "SBI, RLUSD 일본 진출 (외부 집계표)",
    note: "원출처 확인 전. 일본 진출 시 결제 통화 지형의 배경으로만.",
    source: "외부 집계표 (9/2)",
  },
];
