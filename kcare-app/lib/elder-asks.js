// 어르신 부탁 — 미팅 리포트 '부탁하신 것' 한 줄 = 부탁 1건 (2026-10-28 업데이트 요청 1).
//
// 전에는 '부탁하신 것'이 글 한 칸이라 어르신 홈에 그대로 떠 있기만 했다 — 컨시어지 쪽에는 다시 볼 곳이 없어
// 해결했는지 알 수 없었고, 어르신 홈에서도 내려가지 않았다.
// 이제 리포트를 제출하면 줄마다 한 건으로 가구 기록(state.elderAsks)에 남는다.
//   - 컨시어지는 고객 상세 '어르신 부탁'에서 바로 보고 '해결'(한 줄 메모)한다.
//   - 어르신 홈에는 관제가 그 리포트를 보호자에게 보낸 뒤에 보인다(shownAt) — '선생님이 남겼어요'와 같은 때.
//     관제 검수 전의 글(반려되면 고쳐서 다시 낸다)을 어르신께 먼저 보이지 않는다.
//   - 어르신은 '해결됐어요' · '취소할게요'. 닫힌 부탁은 홈 카드에서 빠지고 해주세요 › 부탁해 둔 것의 끝난 쪽으로 간다.
// 상태: open → resolved(해결) · cancelled(취소). 닫을 때 누가(doneBy · doneRole) · 언제(doneAt) · 메모(memo)를 남긴다.
//   [{ id, text, at, by(컨시어지), report(리포트 id), status, shownAt?, doneAt?, doneBy?, doneRole?, memo? }]

export const ASK_LINES_MAX = 10; // 한 리포트에서 부탁으로 받는 줄 수
export const ASKS_KEEP = 100; // 가구 기록에 남기는 부탁 수 (오래된 것부터 빠진다)

// '부탁하신 것' 칸의 글 → 부탁 줄. 줄머리의 번호 · 점(1. · - · •)은 떼고, 빈 줄과 같은 줄은 하나로
export function askLines(text) {
  const seen = new Set();
  return String(text || "")
    .split(/\n+/)
    .map((s) =>
      s
        .replace(/^\s*(?:[-•·*]|\d+\s*[.)])\s*/, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 120)
    )
    .filter((s) => s && !seen.has(s) && seen.add(s))
    .slice(0, ASK_LINES_MAX);
}

export const asksOf = (state) => (Array.isArray(state?.elderAsks) ? state.elderAsks : []);
export const isOpenAsk = (a) => a?.status === "open";
// 어르신 화면에 보이는 열린 부탁 — 관제가 리포트를 보낸 뒤의 것만
export const elderOpenAsks = (state) => asksOf(state).filter((a) => isOpenAsk(a) && a.shownAt);
// 끝난 부탁 — 최근에 닫은 것부터
export const doneAsks = (state) =>
  asksOf(state)
    .filter((a) => !isOpenAsk(a))
    .sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));

const KST = 9 * 3600 * 1000;
const md = (t) => {
  const d = new Date(Number(t) + KST);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};
const ROLE_WORD = { elder: "어르신", concierge: "컨시어지", ops: "관제" };

// 닫힌 부탁 한 줄 — '해결 · 박지현 10/30 · 전구 교체함' · '어르신 취소 10/30'
export function askDoneText(a) {
  if (!a || isOpenAsk(a)) return "";
  const when = a.doneAt ? md(a.doneAt) : "";
  if (a.status === "cancelled") return `${a.doneRole === "elder" ? "어르신" : a.doneBy || ROLE_WORD[a.doneRole] || ""} 취소${when ? ` ${when}` : ""}`.trim();
  const who = a.doneRole === "elder" ? "어르신" : a.doneBy || ROLE_WORD[a.doneRole] || "";
  return [`해결${who ? ` · ${who}` : ""}${when ? ` ${when}` : ""}`, a.memo].filter(Boolean).join(" · ");
}
