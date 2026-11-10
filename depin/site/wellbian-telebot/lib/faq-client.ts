/* 정본 읽어오기 (8/30 서우 — 봇을 별도 Vercel 프로젝트로 분리하면서)

   이 프로젝트는 FAQ 문장을 한 줄도 갖고 있지 않다. 판매 사이트(wellbian-store)의
   /api/faq 를 읽어 그대로 옮긴다. 이유는 하나다 — 정본이 둘이 되면 반드시 갈라진다.
   8/29 에 판매 정책을 바꿨을 때 화면은 고쳤는데 사본이 남아 있던 /api/inventory 와
   public/*.docx 가 옛 정책(추첨·차수 가격·100대)을 계속 대외로 내보내고 있었다.
   봇은 고객이 직접 읽는 자리라 그 사고가 더 크게 난다.

   그래서 여기 있는 건 사본이 아니라 캐시다. 둘의 차이는 "정본이 바뀌면 따라 바뀌는가"에 있다.
   60초가 지나면 다시 읽고, 사이트가 잠깐 안 닿으면 마지막으로 읽은 값을 계속 쓴다
   (조금 오래된 정본 문장이 틀린 답보다 낫다). 한 번도 못 읽었으면 답하지 않고 사람에게 넘긴다. */

export type Loc = { ko: string; en: string };
export type FaqLang = "ko" | "en";

export type FaqEntry = { id: string; q: string; a: string; extra: boolean };

export type Milestone = { key: string; at: string; label: Loc; note?: Loc };

export type FaqDoc = {
  contract: number;
  faq: Record<FaqLang, FaqEntry[]>;
  schedule: {
    title: Loc;
    name: Loc;
    nextStepIn: Loc;
    milestones: Milestone[];
    phase: string;
    phaseLabel: Loc;
    next: { key: string; at: string } | null;
    notices: Loc[];
  };
};

/** 판매 사이트의 정본 엔드포인트. 예: https://wellbianstorenextjs.vercel.app/api/faq */
const SOURCE = process.env.FAQ_SOURCE_URL ?? "";
/* Vercel Deployment Protection(Vercel Authentication)이 켜진 사이트를 읽기 위한 우회 토큰.
   보호가 켜져 있으면 *.vercel.app 주소는 브라우저에서만 열리고(로그인 쿠키가 있으니까)
   서버 간 호출은 401 을 받는다 — "나는 되는데 봇만 안 되는" 상황이 정확히 이것이다.
   사이트를 공개로 돌리면 이 값은 비워도 된다. */
const BYPASS = process.env.FAQ_BYPASS_TOKEN ?? "";
const TTL_MS = 60_000;
/** 이 계약 번호가 올라가면 응답 모양이 바뀐 것이다 — 맞지 않으면 옛 캐시를 계속 쓴다 */
const CONTRACT = 1;

let cache: { at: number; doc: FaqDoc } | null = null;
let inflight: Promise<FaqDoc | null> | null = null;
/* 마지막 시도의 결과. 왜 못 읽었는지가 안 보이면 원인이 배포 누락인지 접근 차단인지
   주소 오타인지 가릴 수가 없다 — /api/health 가 이 값을 그대로 보여준다.
   상태 코드와 짧은 라벨만 남긴다(주소·토큰은 남기지 않는다). */
let last: { at: number; status: number | null; note: string } | null = null;

const mark = (status: number | null, note: string) => { last = { at: Date.now(), status, note }; };

const fetchDoc = async (): Promise<FaqDoc | null> => {
  if (!SOURCE) { mark(null, "no_source_url"); return null; }
  try {
    /* Next 의 fetch 캐시에 맡기지 않는다 — 만료·실패 처리를 여기서 직접 하고 있다 */
    const res = await fetch(SOURCE, {
      cache: "no-store",
      headers: BYPASS ? { "x-vercel-protection-bypass": BYPASS } : undefined,
    });
    if (!res.ok) {
      mark(res.status,
        res.status === 401 || res.status === 403 ? "blocked_check_deployment_protection"
        : res.status === 404 ? "not_found_deploy_the_site"
        : "http_error");
      return null;
    }
    const doc = (await res.json()) as FaqDoc;
    if (doc?.contract !== CONTRACT || !doc.faq?.ko?.length) { mark(res.status, "unexpected_shape"); return null; }
    cache = { at: Date.now(), doc };
    mark(res.status, "ok");
    return doc;
  } catch {
    /* 주소 오타·DNS·타임아웃. json() 파싱 실패도 여기로 온다(보호 페이지가 HTML 을 돌려줄 때) */
    mark(null, "network_or_bad_response");
    return null;
  }
};

export const getDoc = async (): Promise<FaqDoc | null> => {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.doc;
  /* 같은 인스턴스에서 동시에 여러 요청이 들어와도 정본은 한 번만 읽는다 */
  if (!inflight) inflight = fetchDoc().finally(() => { inflight = null; });
  const fresh = await inflight;
  /* 실패하면 만료된 캐시라도 쓴다. 사이트가 잠깐 흔들렸다고 봇이 벙어리가 되면 안 된다 */
  return fresh ?? cache?.doc ?? null;
};

/** 캐시 상태만 알려준다(문장은 내보내지 않는다) — /api/health 에서 쓴다 */
export const cacheInfo = () => ({
  configured: Boolean(SOURCE),
  bypass: Boolean(BYPASS),
  cached: Boolean(cache),
  ageSec: cache ? Math.round((Date.now() - cache.at) / 1000) : null,
  entries: cache ? cache.doc.faq.ko.length : 0,
  last: last
    ? { status: last.status, note: last.note, agoSec: Math.round((Date.now() - last.at) / 1000) }
    : null,
});

/* 언어 정보가 없을 때 쓸 기본값. @wellbiantalk 은 한국어 커뮤니티라 ko 다. */
const DEFAULT_LANG: FaqLang = process.env.TG_DEFAULT_LANG === "en" ? "en" : "ko";

/* 텔레그램의 language_code 는 "ko", "en-US", "ja" 등으로 오고, 아예 안 오기도 한다
   (Bot API 의 선택 항목이다 — 그룹에서 실제로 빠져서 왔고, 그래서 영어 답이 나갔다).
   값이 없을 때 영어로 떨어뜨리면 한국어 그룹이 영어를 받으므로 기본값으로 보낸다.
   정본이 KO·EN 뿐이라 그 밖의 언어는 en 으로 모은다. */
export const langOf = (code?: string): FaqLang =>
  !code ? DEFAULT_LANG : code.toLowerCase().startsWith("ko") ? "ko" : "en";

export const findFaq = (doc: FaqDoc, lang: FaqLang, id: string) =>
  doc.faq[lang]?.find((f) => f.id === id) ?? null;

/* 질문 어미와 의문사는 어느 FAQ 에나 들어 있어 매칭을 망친다.
   "환불 되나요?" 가 "바우처를 수락하지 않으면 어떻게 되나요?" 에 붙는 식이다 —
   정본에 없는 단어(환불)는 무시되고 어미(되나요)만 걸린 결과다. 실제로 그렇게 나왔다.
   의미를 지는 건 명사이므로, 명사가 하나도 안 걸리면 후보를 만들지 않는다. */
const STOP = new Set([
  "되나요", "되나", "됩니까", "됩니다", "하나요", "합니까", "합니다", "인가요", "입니까", "입니다",
  "있나요", "있습니까", "있어요", "없나요", "없어요", "하면", "되면", "해야", "하는", "되는",
  "어떻게", "어떤", "어느", "무엇", "뭔가요", "뭐예요", "뭐가", "언제", "어디", "어디서",
  "주세요", "알려", "궁금", "그리고", "그럼", "저는", "제가", "이거", "그거",
  /* 8/31 — "얼마"·"얼마나" 를 여기서 뺐다. 가격 문항이 확정되면서 정본 질문이
     "가격은 얼마인가요?" 가 됐고, 그 순간 이 낱말은 잡음이 아니라 신호가 됐다.
     대신 확인 어미를 넣는다 — "450 맞나요" 의 뜻은 450 이 지고 맞나요는 지지 않는다. */
  "맞나요", "맞나", "맞습니까", "맞는지", "인지", "일까요",
  "what", "when", "where", "how", "why", "which", "can", "could", "should", "does", "did",
  "the", "this", "that", "and", "for", "with", "from", "get", "use", "you", "your", "are", "was",
]);

/* 자유 질문 매칭 — 정본에 없는 답을 지어내지 않기 위한 최소 검색이다.
   질문(q)에 명사가 하나도 안 걸리면 아예 후보에서 뺀다. 답변 본문에만 스친 것은
   보조 점수로만 쓴다 — 본문은 길어서 아무 단어나 우연히 걸린다. */
/* 한국어는 같은 낱말이 조사에 따라 모양이 달라진다 — 질문에 "가격이" 라고 써도 정본에는
   "가격은" 이라 적혀 있어 글자 그대로는 안 걸린다. 형태소 분석기를 들이는 대신 끝 한 글자를
   떼고 한 번 더 본다. 세 글자 이상일 때만 — 두 글자를 한 글자로 만들면 아무 데나 걸린다. */
const hits = (hay: string, w: string) => {
  if (hay.includes(w)) return true;
  return w.length >= 3 && /[가-힣]/.test(w) && hay.includes(w.slice(0, -1));
};

export const searchFaq = (doc: FaqDoc, lang: FaqLang, query: string): FaqEntry[] => {
  const tokens = query.toLowerCase()
    .split(/[^0-9a-z가-힣]+/)
    .filter((w) => w.length >= 2 && !STOP.has(w));
  if (!tokens.length) return [];
  return (doc.faq[lang] ?? [])
    .map((f) => {
      const q = f.q.toLowerCase();
      const a = f.a.toLowerCase();
      const inQ = tokens.filter((w) => hits(q, w)).length;
      const inA = tokens.filter((w) => !hits(q, w) && hits(a, w)).length;
      /* 질문에 하나도 안 걸리면 버리는 게 원칙이다 — 답변 본문은 길어서 아무 단어나 우연히
         걸린다. 다만 짧은 물음이 답변에 통째로 들어 있으면 우연이 아니다("450 맞나요",
         "price?"). 토큰이 둘 이하이고 전부 답변에 있을 때만 최소 점수를 준다. */
      const onlyA = !inQ && tokens.length <= 2 && inA === tokens.length;
      return { f, score: inQ ? inQ * 2 + inA : onlyA ? 1 : 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.f);
};
