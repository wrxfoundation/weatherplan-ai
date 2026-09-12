"use client";

/* 키보드로 처리하기 (8/30 서우 — "빠른 처리")

   몰릴 때 한 건마다 스크롤하고 조준해서 누르는 왕복이 쌓인다. 손을 자판에 둔 채
   훑고 닫을 수 있어야 한다.

   상태를 따로 들지 않는다. 화면에 이미 그려져 있는 버튼과 체크박스를 찾아 누를
   뿐이다 — 목록과 단축키가 서로 다른 사실을 들고 있으면 언젠가 어긋나고, 그때
   틀리는 쪽은 늘 눈에 안 보이는 쪽이다.

   자바스크립트가 없거나 늦게 와도 화면은 그대로 동작한다. 여기서 더해 주는 것은
   빠른 길뿐이다. */

import { useEffect, useState } from "react";

const CARD = "article.item";
/* 키를 배열로 든다 — "j / ↓" 처럼 한 문자열에 넣으면 구분자 / 까지 키로 그려지고,
   하필 / 가 검색 단축키라 읽는 사람이 한 번 멈춘다. */
const KEYS: [string[], string][] = [
  [["j", "↓"], "다음 건"],
  [["k", "↑"], "이전 건"],
  [["x"], "선택 (일괄 처리용)"],
  [["1", "2", "3", "4"], "신규 · 처리중 · 완료 · FAQ 반영"],
  [["h", "m", "l"], "긴급 · 주의 · 일반으로 분류 고침"],
  [["r"], "답장 쓰기"],
  [["/"], "검색"],
  [["?"], "이 도움말"],
];

export default function Keys() {
  const [help, setHelp] = useState(false);

  useEffect(() => {
    let at = -1;

    const cards = () => [...document.querySelectorAll<HTMLElement>(CARD)];

    const focus = (next: number) => {
      const list = cards();
      if (!list.length) return;
      at = Math.max(0, Math.min(list.length - 1, next));
      list.forEach((el, i) => el.classList.toggle("kb", i === at));
      list[at].scrollIntoView({ block: "center", behavior: "smooth" });
    };

    /* 아직 아무 것도 고르지 않았으면 화면 가운데에 있는 것부터 시작한다 —
       맨 위로 튀면 방금 보고 있던 자리를 잃는다 */
    const current = () => {
      const list = cards();
      if (at >= 0 && list[at]) return list[at];
      const mid = window.innerHeight / 2;
      const i = list.findIndex((el) => el.getBoundingClientRect().bottom > mid);
      at = i < 0 ? 0 : i;
      list.forEach((el, n) => el.classList.toggle("kb", n === at));
      return list[at];
    };

    const press = (el: HTMLElement | null) => { el?.click(); };

    const onKey = (e: KeyboardEvent) => {
      /* 글을 쓰는 중에는 손대지 않는다 */
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) {
        if (e.key === "Escape") (t as HTMLElement).blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "j": case "ArrowDown": e.preventDefault(); focus(at + 1); return;
        case "k": case "ArrowUp":   e.preventDefault(); focus(at - 1); return;
        case "?":                   e.preventDefault(); setHelp((v) => !v); return;
        case "Escape":
          setHelp(false);
          cards().forEach((el) => el.classList.remove("kb"));
          at = -1;
          return;
        case "/": {
          e.preventDefault();
          document.querySelector<HTMLInputElement>('.search input[name="q"]')?.focus();
          return;
        }
      }

      const card = current();
      if (!card) return;

      switch (e.key) {
        case "x": {
          e.preventDefault();
          const box = card.querySelector<HTMLInputElement>('input[name="ids"]');
          if (box) box.checked = !box.checked;
          return;
        }
        case "1": case "2": case "3": case "4": {
          e.preventDefault();
          const to = { "1": "new", "2": "doing", "3": "done", "4": "faq" }[e.key];
          press(card.querySelector<HTMLElement>(`.acts button[value="${to}"]`));
          return;
        }
        case "h": case "m": case "l": {
          e.preventDefault();
          const sev = { h: "high", m: "mid", l: "low" }[e.key];
          press(card.querySelector<HTMLElement>(`.fixrow-in button[value="${sev}"]:not([disabled])`));
          return;
        }
        case "r": {
          e.preventDefault();
          const d = card.querySelector<HTMLDetailsElement>("details.reply");
          if (!d) return;
          d.open = true;
          d.querySelector<HTMLTextAreaElement>("textarea")?.focus();
          return;
        }
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button className="kb-hint" onClick={() => setHelp((v) => !v)} aria-label="단축키">
        <kbd>?</kbd> 단축키
      </button>
      {help && (
        <div className="kb-help" role="dialog" aria-label="키보드 단축키">
          <div className="kb-help-h">키보드로 처리하기</div>
          <dl>
            {KEYS.map(([keys, what]) => (
              <div key={what}>
                <dt>{keys.map((c) => <kbd key={c}>{c}</kbd>)}</dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
          <button className="btn" onClick={() => setHelp(false)}>닫기</button>
        </div>
      )}
    </>
  );
}
