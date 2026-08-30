/* FAQ 정본 어댑터 (8/30 서우 — 텔레그램 봇)

   봇은 자기 답변 사본을 갖지 않는다. 사이트가 이미 갖고 있는 FAQS·FAQS_EXTRA 를 그대로 읽는다.
   정본이 갱신되면 lib/data.ts 한 곳만 고치면 화면과 봇이 같이 바뀐다.

   이 원칙을 세운 이유가 있다. 8/29 에 판매 정책을 바꿨을 때 화면 문구는 전부 고쳤는데,
   같은 내용의 사본이 /api/inventory 와 public/*.docx 에 남아 옛 정책(추첨·차수 가격·100대)을
   계속 대외로 내보내고 있었다. 봇은 사본이 늘어나는 자리라 처음부터 막는다.

   ── 정본이 오면 바꿀 곳 ────────────────────────────────────────────────
   서우가 FAQ 정본을 확정하면 lib/data.ts 의 FAQS(_EN)·FAQS_EXTRA(_EN) 를 그 내용으로 교체한다.
   그때 항목마다 안 바뀌는 id 를 함께 박아 주면(예: id: "reserve-what") 아래 ID_MAP 을 지우고
   그 값을 그대로 쓰면 된다. 지금은 배열 순서에서 id 를 만들어 쓰므로,
   항목을 중간에 끼워 넣으면 이전에 눌린 버튼이 다른 답을 가리킬 수 있다(대화가 끝나면 사라지는
   문제라 치명적이진 않다). */

import { FAQS, FAQS_EN, FAQS_EXTRA, FAQS_EXTRA_EN } from "./data";

/** 봇이 답할 수 있는 언어. 사이트는 5개지만 FAQ 정본은 KO·EN 만 있다 — 나머지는 en 으로 떨어진다. */
export type FaqLang = "ko" | "en";

export type FaqEntry = {
  /** 콜백 데이터에 실리는 키. 64바이트 제한이 있어 짧게 유지한다 */
  id: string;
  q: string;
  a: string;
  /** 기본 8문항(false) / 전체 보기에서만 나오는 확장 9문항(true) */
  extra: boolean;
};

const build = (base: { q: string; a: string }[], extra: { q: string; a: string }[]): FaqEntry[] => [
  ...base.map((f, i) => ({ id: `b${i}`, q: f.q, a: f.a, extra: false })),
  ...extra.map((f, i) => ({ id: `x${i}`, q: f.q, a: f.a, extra: true })),
];

/* KO 와 EN 배열은 서로 번역쌍이라 길이가 같아야 id 가 언어를 넘어 일치한다.
   길이가 어긋나면 언어를 바꿨을 때 다른 답이 나오므로, 그 경우 EN 을 KO 로 폴백시킨다. */
const parallel = FAQS.length === FAQS_EN.length && FAQS_EXTRA.length === FAQS_EXTRA_EN.length;

export const FAQ: Record<FaqLang, FaqEntry[]> = {
  ko: build(FAQS, FAQS_EXTRA),
  en: parallel ? build(FAQS_EN, FAQS_EXTRA_EN) : build(FAQS, FAQS_EXTRA),
};

export const findFaq = (lang: FaqLang, id: string) => FAQ[lang].find((f) => f.id === id) ?? null;

/* 텔레그램이 주는 language_code 는 "ko", "en-US", "ja" 처럼 다양하게 온다.
   FAQ 정본이 KO·EN 뿐이라 한국어만 ko, 나머지는 전부 en 이다. */
export const langOf = (code?: string): FaqLang => (code?.toLowerCase().startsWith("ko") ? "ko" : "en");

/* 자유 질문 매칭 — 정본에 없는 답을 지어내지 않기 위한 최소 검색이다.
   질문·답 양쪽에서 두 글자 이상 토큰이 몇 개나 겹치는지만 센다. 형태소 분석도 임베딩도 쓰지 않는다.
   못 찾으면 null 을 돌려주고, 그때 봇은 "아직 답이 준비되지 않았다"고 말한 뒤 사람에게 넘긴다. */
export const searchFaq = (lang: FaqLang, query: string): FaqEntry[] => {
  const tokens = query.toLowerCase().split(/[^0-9a-z가-힣]+/).filter((w) => w.length >= 2);
  if (!tokens.length) return [];
  return FAQ[lang]
    .map((f) => {
      const hay = `${f.q} ${f.a}`.toLowerCase();
      /* 질문에 걸린 토큰을 두 배로 친다 — 답변 본문에 스치는 것보다 제목이 맞는 편이 정확하다 */
      const score = tokens.reduce(
        (n, w) => n + (f.q.toLowerCase().includes(w) ? 2 : hay.includes(w) ? 1 : 0), 0);
      return { f, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.f);
};
