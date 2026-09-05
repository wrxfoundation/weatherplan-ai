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

  // 마지막 말풍선을 조작하는 4가지 동작 — 스트리밍과 데모 답변이 같은 경로를 쓴다
  const openBubble = (text) => setMsgs((m) => [...m, { who: "ai", text, streaming: true }]);
  const fill = (text) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, text } : x)));
  const seal = (msg) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? msg : x)));
  const drop = () => setMsgs((m) => m.slice(0, -1));

  // 데모 답변 타이핑 — 서버 스트리밍과 체감을 맞추기 위한 것.
  // 문자 단위로 그리면 한글에서 자모가 튀어 보여 어절 단위로 끊는다.
  const type = (reply) =>
    new Promise((done) => {
      if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        setMsgs((m) => [...m, reply]);
        return done();
      }
      const words = reply.text.split(/(\s+)/);
      openBubble("");
      let i = 0;
      const tick = () => {
        i += 2; // 어절 + 뒤따르는 공백
        if (i >= words.length) {
          seal(reply);
          return done();
        }
        fill(words.slice(0, i).join(""));
        setTimeout(tick, 26);
      };
      setTimeout(tick, 120);
    });

  const ask = async (q, canned) => {
    const question = (q || "").trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { who: "me", text: question }]);
    setInput("");
    setBusy(true);
    let served = false;
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context, role, stream: true }),
      });
      const streamed = r.ok && r.body && (r.headers.get("content-type") || "").startsWith("text/plain");
      if (streamed) {
        // 도착하는 대로 그린다 — 다 기다렸다 한 번에 띄우지 않는다
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        openBubble(""); // 빈 말풍선을 먼저 띄우고 그 안을 채운다
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          fill(acc);
        }
        if (acc.trim()) {
          seal({ who: "ai", text: acc });
          served = true;
        } else {
          drop(); // 한 글자도 못 받음 — 빈 말풍선을 남기지 않는다
        }
      } else if (r.ok) {
        const d = await r.json();
        if (d.answer) {
          setMsgs((m) => [...m, { who: "ai", text: d.answer }]);
          served = true;
        }
      }
    } catch {
      /* 네트워크·스트림 오류 — 아래 데모 답변으로 폴백 */
    }

    if (!served) {
      // 데모 답변도 같은 속도감으로 흐르게 한다 — 키가 없는 환경에서도 화면 반응이 같아야 한다
      const hit = canned || qa.find((x) => (x.keys || []).some((k) => question.includes(k)));
      const reply = hit
        ? { who: "ai", text: hit.a, src: hit.src }
        : {
            who: "ai",
            text: "데모 모드에서는 준비된 기록 범위에서만 답할 수 있습니다. 아래 추천 질문을 눌러 보세요.",
            src: "데모 안내",
          };
      await type(reply);
    }
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
                  <div className="text-[13px] leading-[1.6] text-ink">
                    {m.text}
                    {m.streaming && <span className="ai-caret" aria-hidden="true" />}
                  </div>
                  {m.src && (
                    <div className="mt-1 border-t border-navy/[.06] pt-1 text-[11px] text-muted">근거 — {m.src}</div>
                  )}
                </div>
              )
            )}
            {/* 스트리밍이 시작되면 글자가 직접 흐르므로 이 자리표시자는 그 전까지만 */}
            {busy && !msgs[msgs.length - 1]?.streaming && (
              <div
                className="max-w-[88%] rounded-xl rounded-tl-sm border border-navy/[.08] bg-white/70 px-3 py-2 text-[13px] text-muted"
                aria-live="polite"
              >
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

      {/* 플로팅 버튼 — 우측 하단.
          골드 글라스모피즘: 반투명 골드 그라데이션 + 밝은 테두리 + 안쪽 하이라이트.
          backdrop-filter(블러)는 쓰지 않는다 — 고정 버튼에 블러를 걸면 스크롤할 때마다
          뒤 배경을 다시 합성해야 해서 저사양 기기에서 눈에 띄게 버벅인다.
          유리 느낌은 블러가 아니라 위쪽 하이라이트와 아래쪽 그림자의 대비에서 나온다. */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="AI 어시스턴트"
        className="btn-press fixed bottom-5 right-5 z-[1200] flex h-[52px] w-[52px] items-center justify-center rounded-full text-[15px] font-bold tracking-[.04em]"
        style={{
          color: NAVY, // 골드 위에서는 네이비가 대비가 가장 크다
          background:
            "linear-gradient(150deg, rgba(214,181,126,.94) 0%, rgba(188,152,95,.90) 48%, rgba(160,126,72,.94) 100%)",
          border: "1px solid rgba(255,255,255,.42)",
          boxShadow:
            "0 14px 30px -12px rgba(122,92,40,.62), 0 2px 6px -2px rgba(10,31,60,.25)," +
            " inset 0 1.5px 0 rgba(255,255,255,.62), inset 0 -1.5px 2px rgba(122,92,40,.22)",
        }}
      >
        {open ? "✕" : "AI"}
      </button>
    </>
  );
}
