/* CS 인박스 (8/30 서우 — "cs 분류 및 처리")

   봇이 답하지 못한 질문을 운영 채널로 흘려보낸다. 그게 곧 FAQ 에 추가할 항목 목록이고,
   9/7~9/14 문의가 아무 기록 없이 지나가는 것을 막는다.

   집계·감정분석·답변추천이 있는 대시보드는 저장소가 필요하다. 서버리스라 이 프로젝트는
   아무것도 기억하지 못한다. 그런데 CS 의 실체는 "정본에 없어서 못 답한 질문" 하나이고,
   그건 저장소 없이도 그때그때 흘려보낼 수 있다 — 텔레그램 채널이 곧 append-only 로그다.
   나중에 DB 를 붙이면 그 채널을 그대로 읽어 과거분까지 채울 수 있다.

   주제 분류는 키워드로 한다. LLM 을 부르지 않는 이유는 둘이다 — 답을 지어낼 위험이 없고,
   문의가 몰리는 순간(판매 당일)에 지연도 비용도 늘지 않는다. */

export type CsTopic =
  | "예매" | "결제" | "지갑" | "기기" | "보상" | "멤버십" | "일정" | "기타";

/* 위에서부터 먼저 걸리는 것을 택한다 — 아래로 갈수록 넓은 주제다.
   한국어·영어를 같은 줄에 두는 이유: 한 문장에 섞여 오는 경우가 많다("RLUSD 어디서 사요"). */
const RULES: [CsTopic, RegExp][] = [
  ["지갑",   /지갑|월렛|주소|복구|시드|니모닉|개인키|비밀키|wallet|seed|mnemonic|private ?key|xaman|xumm|트러스트라인|trustline/i],
  ["보상",   /보상|리워드|채굴|부스트|wlbn|토큰|지급|reward|boost|token|mining|payout/i],
  ["기기",   /기기|디바이스|측정기|배송|택배|설치|리딤|박스|device|ship|deliver|redeem|hardware|센서|sensor/i],
  ["멤버십", /멤버십|제네시스|넘버|nft|민팅|membership|genesis|taxon|라이선스|license/i],
  ["예매",   /예매|예약|바우처|신청|응모|reserve|reservation|voucher|apply/i],
  ["결제",   /결제|구매|가격|얼마|비용|환불|수수료|rlusd|스테이블|payment|price|cost|refund|buy|purchase|fee/i],
  ["일정",   /언제|일정|오픈|시작|마감|종료|며칠|when|schedule|open|start|deadline|date/i],
];

export const topicOf = (text: string): CsTopic => {
  for (const [t, re] of RULES) if (re.test(text)) return t;
  return "기타";
};

/* 누가 물었는지는 남겨야 답을 줄 수 있다. 다만 최소한만 — 유저네임이 있으면 그것,
   없으면 이름과 숫자 ID. 이 값은 운영 채널에만 머물고 저장소나 repo 로 가지 않는다. */
export const whoOf = (from?: { username?: string; first_name?: string; id?: number }) => {
  if (!from) return "(알 수 없음)";
  if (from.username) return `@${from.username}`;
  return `${from.first_name ?? "이름 없음"} (id ${from.id ?? "?"})`;
};

const kst = () => {
  const d = new Date(Date.now() + 9 * 3600000);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
};

/* 텔레그램 메시지 길이 제한이 4096 이라 원문이 아주 길면 자른다.
   자른 표시를 남겨야 "이게 전부인가" 하고 헷갈리지 않는다. */
const clip = (s: string, n = 900) => (s.length > n ? s.slice(0, n) + " …(생략)" : s);

export type CsKind = "unanswered" | "offline";

export const csReport = (opts: {
  kind: CsKind;
  text: string;
  lang: string;
  chatType: string;
  from?: { username?: string; first_name?: string; id?: number };
}) => {
  const head = opts.kind === "offline"
    ? "⚠️ 정본을 불러오지 못한 상태에서 들어온 질문"
    : `❓ 답변 없음 · ${topicOf(opts.text)}`;
  const where = opts.chatType === "private" ? "1:1" : "그룹";
  return [
    head,
    `"${clip(opts.text)}"`,
    `— ${whoOf(opts.from)} · ${opts.lang} · ${where} · ${kst()} KST`,
  ].join("\n");
};
