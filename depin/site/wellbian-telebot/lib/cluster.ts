/* 비슷한 문의 묶기 (8/30 서우 — "몰려올 때를 대비해 빠르게")

   판매가 열리면 같은 질문이 스무 번 들어온다. 한 건씩 답하면 스무 번을 답하게 되고,
   그 사이에 정작 한 명뿐인 급한 문의가 밀린다. 묶어서 한 번에 답해야 한다.

   유사도는 토큰 집합의 겹침(자카드)으로 잰다. 임베딩을 쓰지 않는 이유는 앞의 분류들과
   같다 — 문의가 몰리는 바로 그 순간에 외부 호출이 늘면 느려지고, 무엇보다 묶기가
   틀렸을 때 사람이 눈으로 알아채고 풀 수 있어야 한다. 규칙은 읽으면 이해되지만
   임베딩 점수는 그렇지 않다. */

import type { CsItem } from "./store";

/* 질문 어미·의문사는 어느 문의에나 있어 다 비슷해 보이게 만든다 */
const STOP = new Set([
  "되나요", "되나", "하나요", "인가요", "입니다", "있나요", "없나요", "하면", "되면",
  "어떻게", "어떤", "무엇", "언제", "어디", "어디서", "얼마", "주세요", "알려", "궁금",
  "그리고", "제가", "저는", "혹시", "좀", "please", "the", "and", "for", "you", "your",
  "what", "when", "where", "how", "why", "can", "does", "is", "are", "it", "this", "that",
]);

const tokens = (s: string) =>
  s.toLowerCase().split(/[^0-9a-z가-힣]+/).filter((w) => w.length >= 2 && !STOP.has(w));

/* 한국어는 조사·어미가 붙어 같은 말이 다른 토큰이 된다 —
   "가능한가요"·"가능해요", "기기는"·"기기". 앞 두 글자를 어간으로 삼아 그 차이를 지운다.
   형태소 분석기를 쓰면 정확하겠지만 의존성과 실행 시간을 늘리는 값을 하지 못한다. */
const stem = (w: string) => (/^[가-힣]/.test(w) && w.length > 2 ? w.slice(0, 2) : w);

/* "측정기기"와 "기기"처럼 한쪽이 다른 쪽을 품는 경우도 같은 말로 본다 */
const same = (a: string, b: string) =>
  a === b || stem(a) === stem(b) || a.includes(b) || b.includes(a) ||
  a.includes(stem(b)) || b.includes(stem(a));

const overlap = (A: string[], B: string[]) => {
  if (!A.length || !B.length) return 0;
  const hit = A.filter((a) => B.some((b) => same(a, b))).length;
  return hit / (A.length + B.length - hit);
};

export type Cluster = { head: CsItem; members: CsItem[] };

/* 0.45 는 실제 문장으로 맞춘 값이다. 더 낮추면 "기기 언제 사나요"와 "기기 어디서 사나요"를
   넘어 "지갑 언제 만드나요"까지 한 묶음이 되고, 더 높이면 같은 질문의 말끝만 달라도 갈린다.
   묶기는 틀릴 수 있으므로 화면에서 항상 원문을 함께 보여 준다. */
export const clusterItems = (items: CsItem[], threshold = 0.4): Cluster[] => {
  const out: { head: CsItem; members: CsItem[]; sig: string[] }[] = [];
  for (const it of items) {
    const sig = tokens(it.text);
    /* 주제가 다르면 아예 비교하지 않는다 — 우연히 단어가 겹쳐 엉뚱하게 묶이는 걸 막는다 */
    const found = out.find((c) => c.head.topic === it.topic && overlap(c.sig, sig) >= threshold);
    if (found) found.members.push(it);
    else out.push({ head: it, members: [it], sig });
  }
  /* 많이 들어온 순서 — 한 번 답해서 가장 많이 해결되는 것이 위로 온다 */
  return out
    .map(({ head, members }) => ({ head, members }))
    .sort((a, b) => b.members.length - a.members.length || b.head.at - a.head.at);
};
