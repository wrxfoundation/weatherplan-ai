/* CS 인박스 (8/30 서우 — "cs 분류 및 처리")

   봇이 답하지 못한 질문을 운영 채널로 흘려보낸다. 그게 곧 FAQ 에 추가할 항목 목록이고,
   9/7~9/14 문의가 아무 기록 없이 지나가는 것을 막는다.

   집계·감정분석·답변추천이 있는 대시보드는 저장소가 필요하다. 서버리스라 이 프로젝트는
   아무것도 기억하지 못한다. 그런데 CS 의 실체는 "정본에 없어서 못 답한 질문" 하나이고,
   그건 저장소 없이도 그때그때 흘려보낼 수 있다 — 텔레그램 채널이 곧 append-only 로그다.
   나중에 DB 를 붙이면 그 채널을 그대로 읽어 과거분까지 채울 수 있다.

   주제 분류는 키워드로 한다. LLM 을 부르지 않는 이유는 둘이다 — 답을 지어낼 위험이 없고,
   문의가 몰리는 순간(판매 당일)에 지연도 비용도 늘지 않는다. */

/* 값으로도 쓴다 — 분류를 손으로 고칠 때 고를 수 있는 목록이 곧 이 배열이다.
   타입만 있으면 화면에서 다시 나열해야 하고, 그러면 둘이 어긋난다. */
export const TOPICS = ["예매", "결제", "지갑", "기기", "보상", "멤버십", "일정", "기타"] as const;
export type CsTopic = (typeof TOPICS)[number];

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

export type CsKind = "unanswered" | "offline" | "matched" | "group";

/* 그룹에서 오간 말 중 "질문" 만 원문을 남긴다(8/30 서우 합의).
   전 대화를 원문째로 쌓지 않기 위한 문턱이다 — 공개 그룹이라도 그건 다른 문제다.

   물음표가 제일 확실한 신호지만, 한국어 대화에서는 빼먹는 일이 잦아
   물음을 만드는 어미와 의문사도 함께 본다. 넓게 잡되(놓치면 영영 모른다)
   인사·감탄은 걸러야 하므로 두 글자 이상일 때만 센다. */
/* 단어 조각이 우연히 걸리지 않게 조인다 — 넓게 잡으면 왜곡 이 왜 로, 
   어디까지나 가 어디 로 걸린다. 놓치는 질문보다 잡담이 섞이는 쪽이 더 나쁘다 —
   목록이 잡담으로 차면 정작 답해야 할 질문을 못 본다. */
const ASK = /[?？]\s*$|(?:나요|까요|은가요|인가요|ㄴ가요|는지요|을까요|ㄹ까요)\s*[?？]?\s*$|어떻게|어떤|언제|어디서|어디에|얼마|왜\s|무엇|뭐가|뭔가요|뭐예요|가능한가|되나\s|되는지|아시는|아시나|알려\s?주|궁금|\b(what|when|where|how|why|who|which|can i|do i|is it|are there|anyone know)\b/i;

/* 질문이 아니어도 이것만은 흘리지 않는다 — 사기·해킹·도난처럼 사고를 알리는 말이다.
   "이거 스캠이다" 는 물음표가 없지만, 그룹에서 이 말이 돌기 시작하면 개수만 세어
   놓고 나중에 보는 것으로는 늦는다. 저장 범위를 여기까지만 넓힌다. */
export const isAlarming = (text: string) => URGENT.test(text);

export const isQuestion = (text: string) => {
  const t = text.trim();
  if (t.length < 2) return false;
  return ASK.test(t);
};

const MOOD_MARK: Record<string, string> = { question: "❓", positive: "🙂", negative: "⚠️" };
const STATUS_MARK: Record<string, string> = { new: "🆕", doing: "🔧", done: "✅", faq: "📘" };

/* 운영 채널에 뜨는 카드. 이 메시지 자체가 처리 화면이라 상태를 첫 줄에 둔다 —
   버튼을 누르면 같은 자리를 고쳐 써서 진행 상황이 한눈에 남는다. */
export const csCard = (i: {
  at: number; text: string; topic: string; mood: string; lang: string;
  who: string; chatType: string; kind: CsKind; status: string; sev?: string; note?: string;
}) => {
  /* 긴급은 첫 줄에 못 박는다 — 카드가 줄지어 흐르는 채널에서 눈에 먼저 걸려야 한다 */
  const urgent = i.sev === "high" ? "🚨 긴급 · " : "";
  const head = i.kind === "offline"
    ? "⚠️ 정본을 못 읽는 동안 들어온 질문"
    : `${urgent}${MOOD_MARK[i.mood] ?? "❓"} 답변 없음 · ${i.topic}`;
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
const NEG = new RegExp([
  "안\\s?되|안돼|안됨|오류|에러|먹통|막혔|실패|늦|느리|불편|짜증|화나|사기|환불|불만",
  /* 장애가 아니라 평가로 오는 불만 — 그룹에서 이 형태가 나오면 다른 사람이 먼저 본다 */
  "엉망|실망|최악|형편없|답답|어이없|황당|믿을\\s?수\\s?없|한심|기대\\s?이하",
  "why not|broken|error|fail|scam|refund|angry|stuck|terrible|awful|worst|disappoint",
].join("|"), "i");
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

/* ── 긴급도 (8/30 서우 — "긴급/심각도에 답변에 대해 신속하게") ────────────────
   판매 기간에는 문의가 몰리고, 그때 가장 비싼 실수는 "돈이 걸린 한 건"을 뒤로 미루는 것이다.
   순서를 사람이 눈으로 고르게 두면 최신순으로 처리하게 되고, 그러면 급한 것이 아래로 밀린다.

   높음의 기준은 되돌릴 수 없거나 공개된 것이다 —
   자금·사칭·법적 언급은 시간이 지나면 손해가 커지고, 그룹에서 나온 불만은 다른 사람이 본다. */
const URGENT = new RegExp([
  "사기|스캠|scam|해킹|hack|피싱|phishing|털렸|도난|stolen|탈취",
  "입금했|보냈는데|안\\s?왔|못\\s?받|사라졌|없어졌",
  "고소|법적|legal|신고|사칭|impersonat",
  /* 환불은 문의일 수도 요구일 수도 있다 — 요구형일 때만 긴급으로 본다.
     "환불 정책이 어떻게 되나요"까지 긴급으로 올리면 진짜 급한 건이 묻힌다 */
  "환불\\s*(요청|해\\s?주|해줘|바랍|원합|처리)|refund\\s+(now|request|please)",
].join("|"), "i");
const TROUBLE = new RegExp([
  "안돼|안됨|오류|에러|실패|먹통|막혔|잠겼|error|fail|stuck|locked|broken",
  /* "안 되"만 잡으면 "안 눌려요"·"안 열려요"·"안 뜨네요"를 놓친다.
     실제 문의는 대부분 이 형태로 온다 */
  "안\\s?(되|돼|눌|열|보|뜨|들어|올라|먹|받|나와|넘어)",
  /* 응답이 없다는 불만은 그 자체가 급하다 — 방치될수록 공개적으로 커진다 */
  "답이?\\s?없|답변이?\\s?없|응답이?\\s?없|아무도\\s?(안|답)|무시|왜\\s?안",
].join("|"), "i");

export type CsSeverity = "high" | "mid" | "low";

/* 같은 문의라도 판매 단계에 따라 급한 정도가 다르다. 이게 이 사업의 모양이다 —
   구매창은 24시간뿐이고 재발행이 없다. 그 안에 "결제가 안 된다"를 놓치면 그 사람은
   영영 못 산다. 같은 문의가 9월 1일에 오면 하루 안에 답해도 되는 일이다.

   접수 기간의 예매 장애도 마찬가지다 — 마감이 지나면 우선 구매창 자체를 못 쓴다. */
const CRITICAL_TOPIC = /결제|지갑|예매/;

export const severityOf = (
  text: string, mood: CsMoodTag, chatType: string,
  opts?: { phase?: string; topic?: string; kind?: CsKind },
): CsSeverity => {
  const phase = opts?.phase ?? "";
  const buying = phase === "priority_window" || phase === "general_window";
  const reserving = phase === "reserve_open";

  /* 구매창이 열려 있는 동안 결제·지갑이 막힌 사람은 시간이 곧 손해다 */
  if (buying && (TROUBLE.test(text) || mood === "negative") &&
      CRITICAL_TOPIC.test(opts?.topic ?? "")) return "high";
  /* 접수 중 예매가 막힌 것도 마감이 지나면 되돌릴 수 없다 */
  if (reserving && TROUBLE.test(text) && /예매/.test(opts?.topic ?? "")) return "high";

  if (URGENT.test(text)) return "high";
  /* 공개된 불만은 다른 사람이 본다 — 1:1 과 다르게 취급한다.
     다만 봇에게 말을 건 것이 아니라 그냥 오간 대화(kind "group")는 여기서 뺀다.
     그룹은 원래 불평이 섞이는 곳이라 부정 하나하나를 긴급으로 올리면
     긴급이 흔해져서 진짜 급한 건을 못 찾게 된다. 위의 URGENT 는 그대로 걸린다. */
  if (mood === "negative" && chatType !== "private" && opts?.kind !== "group") return "high";
  /* 평시의 장애 불만은 주의까지다. 여기까지 긴급으로 올리면 구매창의 진짜 급한 건과
     구분이 사라져서, 몰릴 때 순서를 정하는 데 아무 도움이 안 된다. */
  if (mood === "negative" || TROUBLE.test(text)) return "mid";
  return "low";
};

/* 언제까지 답해야 하는가. 몰려올 때 사람은 최신순으로 처리하게 되므로,
   "얼마나 방치됐는지"를 숫자로 보여 줘야 순서가 바뀐다. */
export const SLA_MIN: Record<CsSeverity, number> = { high: 30, mid: 240, low: 1440 };

export const overdueMin = (at: number, sev: CsSeverity, now = Date.now()) =>
  Math.round((now - at) / 60000) - SLA_MIN[sev];

export const SEV_LABEL: Record<CsSeverity, string> = { high: "긴급", mid: "주의", low: "일반" };

/* ── 사람 단위 (8/30 서우 — "이상한 사람 · 열성적인 사람") ────────────────────
   문의는 건별로 쌓이지만 사람은 건별로 판단할 수 없다. 같은 사람이 한 시간에 다섯 번
   불만을 쏟는 것과, 사흘에 걸쳐 다섯 번 묻는 것은 전혀 다른 신호다.

   판정은 라벨이지 처분이 아니다 — 여기서 무엇도 자동으로 차단하지 않는다.
   사람을 규칙으로 거르는 일은 틀릴 수 있고, 틀렸을 때 값이 가장 비싼 종류의 실수다. */
export type PersonRow = {
  who: string; n: number; neg: number; pos: number; high: number;
  first: number; last: number; topics: string[]; langs: string[];
  burst: number;                      // 한 시간 안에 몰린 최대 건수
  flag: "risk" | "champion" | null;
};

export const rollupPeople = (items: {
  who: string; at: number; mood: string; sev?: string; topic: string; lang: string;
}[]): PersonRow[] => {
  const by = new Map<string, typeof items>();
  for (const i of items) by.set(i.who, [...(by.get(i.who) ?? []), i]);

  const rows: PersonRow[] = [...by.entries()].map(([who, list]) => {
    const at = list.map((x) => x.at).sort((a, b) => a - b);
    /* 한 시간 창을 훑어 가장 많이 몰린 구간을 센다 — 도배는 총량이 아니라 밀도로 드러난다 */
    let burst = 1;
    for (let i = 0; i < at.length; i++) {
      let j = i;
      while (j < at.length && at[j] - at[i] <= 3600000) j++;
      burst = Math.max(burst, j - i);
    }
    const neg = list.filter((x) => x.mood === "negative").length;
    const pos = list.filter((x) => x.mood === "positive").length;
    const high = list.filter((x) => x.sev === "high").length;
    const n = list.length;

    /* 주의: 긴급이 겹치거나, 불만이 절반을 넘거나, 한 시간에 다섯 건 넘게 쏟은 사람 */
    const risk = high >= 2 || (n >= 3 && neg / n >= 0.5) || burst >= 5;
    /* 열성: 여러 번 묻되 불만이 없고, 고마움을 표했거나 꾸준히 참여한 사람 */
    const champion = !risk && n >= 3 && neg === 0 && (pos >= 1 || n >= 5);

    return {
      who, n, neg, pos, high, first: at[0], last: at[at.length - 1], burst,
      topics: [...new Set(list.map((x) => x.topic))],
      langs: [...new Set(list.map((x) => x.lang))],
      flag: risk ? "risk" : champion ? "champion" : null,
    };
  });

  /* 손이 필요한 순서 — 긴급, 그다음 불만, 그다음 많이 물은 사람 */
  return rows.sort((a, b) => b.high - a.high || b.neg - a.neg || b.n - a.n);
};
