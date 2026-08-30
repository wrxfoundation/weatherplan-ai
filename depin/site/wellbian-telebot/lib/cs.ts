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

export type CsKind = "unanswered" | "offline" | "matched";

const MOOD_MARK: Record<string, string> = { question: "❓", positive: "🙂", negative: "⚠️" };
const STATUS_MARK: Record<string, string> = { new: "🆕", doing: "🔧", done: "✅", faq: "📘" };

/* 운영 채널에 뜨는 카드. 이 메시지 자체가 처리 화면이라 상태를 첫 줄에 둔다 —
   버튼을 누르면 같은 자리를 고쳐 써서 진행 상황이 한눈에 남는다. */
export const csCard = (i: {
  at: number; text: string; topic: string; mood: string; lang: string;
  who: string; chatType: string; kind: CsKind; status: string; note?: string;
}) => {
  const head = i.kind === "offline"
    ? "⚠️ 정본을 못 읽는 동안 들어온 질문"
    : `${MOOD_MARK[i.mood] ?? "❓"} 답변 없음 · ${i.topic}`;
  const where = i.chatType === "private" ? "1:1" : "그룹";
  const t = new Date(i.at + 9 * 3600000);
  const time = `${String(t.getUTCHours()).padStart(2, "0")}:${String(t.getUTCMinutes()).padStart(2, "0")}`;
  return [
    `${STATUS_MARK[i.status] ?? "🆕"} ${head}`,
    `"${clip(i.text)}"`,
    `— ${i.who} · ${i.lang} · ${where} · ${time} KST`,
    ...(i.note ? ["", `📝 ${clip(i.note, 400)}`] : []),
  ].join("\n");
};

/* 상태 버튼. 지금 상태는 빼고 옮겨 갈 곳만 보여준다 — 누를 것이 적을수록 빨리 처리된다. */
export const csButtons = (id: string, status: string) => {
  const all: [string, string][] = [
    ["doing", "🔧 처리중"], ["done", "✅ 완료"], ["faq", "📘 FAQ 반영"], ["new", "↩︎ 신규로"],
  ];
  const row = all.filter(([s]) => s !== status)
    .map(([s, label]) => ({ text: label, callback_data: `cs:${id}:${s}` }));
  return { inline_keyboard: [row.slice(0, 2), row.slice(2)].filter((r) => r.length) };
};

/* ── 어조 분류 (8/30 서우 — "긍정 부정 의문") ──────────────────────────────
   규칙으로 한다. LLM 을 부르지 않는 이유는 주제 분류와 같다 — 문의가 몰리는 순간에
   지연도 비용도 늘지 않고, 무엇보다 분류가 틀려도 답을 지어내지 않는다.

   기본값을 "의문"으로 둔 것은 이 자리의 성격 때문이다. 여기 쌓이는 것은 전부
   "봇이 답하지 못한 질문"이라 대다수가 물음이고, 애매한 것을 부정으로 몰면
   실제 불만이 묻힌다. 부정은 확실할 때만 부정이라고 부른다. */
const NEG = /안 ?되|안돼|안됨|오류|에러|먹통|막혔|실패|늦|느리|불편|짜증|화나|사기|환불|불만|why not|broken|error|fail|scam|refund|angry|stuck/i;
const POS = /감사|고마|좋|최고|굿|기대|화이팅|응원|멋지|훌륭|축하|thank|great|awesome|nice|love|excited|good job/i;

export type CsMoodTag = "question" | "positive" | "negative";

export const moodOf = (text: string): CsMoodTag => {
  if (NEG.test(text)) return "negative";
  if (POS.test(text) && !/\?|나요|까요|가요|은가|는가/.test(text)) return "positive";
  return "question";
};

export const MOOD_LABEL: Record<CsMoodTag, string> = {
  question: "의문", positive: "긍정", negative: "부정",
};

export const STATUS_LABEL = {
  new: "신규", doing: "처리중", done: "완료", faq: "FAQ 반영",
} as const;
