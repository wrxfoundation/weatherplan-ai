import { useEffect, useRef, useState } from "react";

// AI 어시스턴트 플로팅 챗 — 관제·경영 콘솔 공용 (우측 하단 버튼).
// 외부 표기는 "AI"로 통일 (모델·제공사 비노출) · /api/ai 503(키 미설정) 시 기록 기반 데모 답변 폴백.
const NAVY = "#0A1F3C";

export default function AiChat({ role, title, subtitle, qa, context, note, intro, stage, evidence }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [msgs, busy]);

  const ask = async (q, canned) => {
    const question = (q || "").trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { who: "me", text: question }]);
    setInput("");
    setBusy(true);
    let reply = null;
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context, role }),
      });
      if (r.ok) {
        const d = await r.json();
        reply = { who: "ai", text: d.answer };
      }
    } catch {
      /* 네트워크 오류 — 아래 데모 폴백 */
    }
    if (!reply) {
      const hit = canned || qa.find((x) => (x.keys || []).some((k) => question.includes(k)));
      reply = hit
        ? { who: "ai", text: hit.a, src: hit.src }
        : {
            who: "ai",
            text: "데모 모드에서는 준비된 기록 범위에서만 답할 수 있습니다. 아래 추천 질문을 눌러 보세요.",
            src: "데모 안내",
          };
    }
    setMsgs((m) => [...m, reply]);
    setBusy(false);
  };

  return (
    <>
      {open && (
        <div
          className="card-frost fixed bottom-[88px] right-5 z-[1200] flex w-[360px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl"
          style={{ height: "min(500px, calc(100vh - 130px))" }}
        >
          {/* 헤더 */}
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: NAVY }}>
            <span className="rounded-md bg-gold px-1.5 py-0.5 text-[11px] font-bold tracking-[.1em] text-navy">
              AI
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[15px] font-bold text-white">{title}</span>
                {/* 진화 단계 — 이 AI가 지금 어디까지 할 수 있는지 (업력·DB에 따라 올라간다) */}
                {stage && (
                  <span className="shrink-0 rounded-md border border-white/25 px-1.5 py-[1px] font-num text-[10px] font-bold text-white/80">
                    {stage}
                  </span>
                )}
              </div>
              <div className="truncate text-[11px] text-white/60">{subtitle}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="btn-press flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[13px] font-bold text-white/70"
            >
              ✕
            </button>
          </div>

          {/* 메시지 */}
          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
            <div className="max-w-[88%] rounded-xl rounded-tl-sm border border-navy/[.08] bg-white/70 px-3 py-2 text-[13px] leading-[1.6] text-ink">
              {intro}
            </div>
            {msgs.map((m, i) =>
              m.who === "me" ? (
                <div
                  key={i}
                  className="ml-auto max-w-[88%] rounded-xl rounded-tr-sm px-3 py-2 text-[13px] leading-[1.6] text-white"
                  style={{ background: NAVY }}
                >
                  {m.text}
                </div>
              ) : (
                <div
                  key={i}
                  className="max-w-[88%] rounded-xl rounded-tl-sm border border-navy/[.08] bg-white/70 px-3 py-2"
                >
                  <div className="text-[13px] leading-[1.6] text-ink">{m.text}</div>
                  {m.src && (
                    <div className="mt-1 border-t border-navy/[.06] pt-1 text-[11px] text-muted">근거 — {m.src}</div>
                  )}
                </div>
              )
            )}
            {busy && (
              <div className="max-w-[88%] rounded-xl rounded-tl-sm border border-navy/[.08] bg-white/70 px-3 py-2 text-[13px] text-muted">
                답변 작성 중…
              </div>
            )}
          </div>

          {/* 학습 범위 — "이 답이 무엇에 근거하는가"를 늘 보이게 (쌓일수록 이 줄이 커진다) */}
          {evidence && (
            <div className="border-t border-navy/[.08] px-3.5 pt-2 text-[10px] leading-[1.55] text-muted">
              <span className="font-bold text-navy/70">학습 범위</span> — {evidence}
            </div>
          )}

          {/* 추천 질문 */}
          <div className="flex flex-wrap gap-1.5 px-3.5 pb-2 pt-2">
            {qa.map((x) => (
              <button
                key={x.q}
                onClick={() => ask(x.q, x)}
                disabled={busy}
                className="btn-press rounded-full border border-navy/15 bg-white/60 px-2.5 py-1 text-[11px] font-bold text-navy disabled:opacity-50"
              >
                {x.q}
              </button>
            ))}
          </div>

          {/* 입력 */}
          <form
            className="flex gap-2 px-3.5 pb-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="질문을 입력하세요"
              className="min-w-0 flex-1 rounded-xl border border-navy/15 bg-white/80 px-3 py-2 text-[13px] text-ink outline-none placeholder:text-muted/60 focus:ring-1 focus:ring-gold"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="btn-press rounded-xl px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
              style={{ background: NAVY }}
            >
              전송
            </button>
          </form>
          {note && <p className="border-t border-navy/[.08] px-3.5 py-2 text-[10px] leading-[1.5] text-muted">{note}</p>}
        </div>
      )}

      {/* 플로팅 버튼 — 우측 하단 */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="AI 어시스턴트"
        className="btn-press fixed bottom-5 right-5 z-[1200] flex h-[52px] w-[52px] items-center justify-center rounded-full text-[16px] font-bold text-white"
        style={{
          background: NAVY,
          boxShadow:
            "0 12px 28px -10px rgba(10,31,60,.55), inset 0 1px 0 rgba(255,255,255,.18), 0 0 0 2px rgba(176,141,87,.45)",
        }}
      >
        {open ? "✕" : "AI"}
      </button>
    </>
  );
}
