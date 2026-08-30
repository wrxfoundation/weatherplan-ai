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

/* 텔레그램의 language_code 는 "ko", "en-US", "ja" 등으로 온다.
   정본이 KO·EN 뿐이라 한국어만 ko, 나머지는 전부 en 이다. */
export const langOf = (code?: string): FaqLang =>
  code?.toLowerCase().startsWith("ko") ? "ko" : "en";

export const findFaq = (doc: FaqDoc, lang: FaqLang, id: string) =>
  doc.faq[lang]?.find((f) => f.id === id) ?? null;

/* 자유 질문 매칭 — 정본에 없는 답을 지어내지 않기 위한 최소 검색이다.
   두 글자 이상 토큰이 몇 개나 겹치는지만 센다. 질문에 걸린 토큰은 두 배로 친다
   (답변 본문에 스치는 것보다 질문이 맞는 편이 정확하다). 못 찾으면 빈 배열이다. */
export const searchFaq = (doc: FaqDoc, lang: FaqLang, query: string): FaqEntry[] => {
  const tokens = query.toLowerCase().split(/[^0-9a-z가-힣]+/).filter((w) => w.length >= 2);
  if (!tokens.length) return [];
  return (doc.faq[lang] ?? [])
    .map((f) => {
      const q = f.q.toLowerCase();
      const hay = `${f.q} ${f.a}`.toLowerCase();
      const score = tokens.reduce((n, w) => n + (q.includes(w) ? 2 : hay.includes(w) ? 1 : 0), 0);
      return { f, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.f);
};
