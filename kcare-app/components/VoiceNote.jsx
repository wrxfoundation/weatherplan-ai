import { useState } from "react";
import { RECORD_ERRORS, clock, saveClip, sendErrorText, useRecorder } from "../lib/voice-client";
import { useSync } from "../lib/state";

// 안부 음성 남기기 — 보호자 홈 · 긴급 배너가 같은 컴포넌트를 쓴다.
// (2026-08-12 보호자화면 시트 홈 1·2번)
//
// 2026-10-14부터 실제로 녹음한다 (lib/voice-client.js) — 전에는 녹음 길이만 재고 '전달됨'을 보였다.
// 누르면 마이크가 켜지고(처음 한 번 브라우저가 허용을 묻는다), 다시 누르면 서버에 올린 뒤 보낸다.
// 서버가 받았다고 답해야 '전달했습니다'가 된다. 데모(로그인 없이)는 이 기기 메모리에만 둔다.
//
// 녹음 중 색은 금색 — 빨강은 SOS · 낙상 전용이다.
// tone: "light" (흰 카드 위) / "dark" (네이비·빨강 배너 위)
// onSend(secs, clip) — 보낸 녹음 { id, mime, secs }
export default function VoiceNote({ to, tone = "light", compact = false, onSend }) {
  const server = useSync().mode === "server";
  const [stage, setStage] = useState("idle"); // idle | sending | sent | send-error
  const [sentSecs, setSentSecs] = useState(0);
  const [sendErr, setSendErr] = useState(null);
  const [last, setLast] = useState(null);
  const rec = useRecorder({ onMax: (p) => p.then((out) => out && deliver(out)) });

  const deliver = async (out) => {
    setLast(out);
    setStage("sending");
    setSendErr(null);
    try {
      const clip = await saveClip(out, { server });
      onSend?.(clip.secs, clip);
      setSentSecs(clip.secs);
      setStage("sent");
    } catch (e) {
      setSendErr(e.code || "network");
      setStage("send-error");
    }
  };
  const recording = rec.phase === "rec" || rec.phase === "asking";
  const toggle = async () => {
    if (rec.phase === "rec") {
      const out = await rec.stop();
      if (out) deliver(out);
      return;
    }
    if (rec.phase === "asking") return;
    setStage("idle");
    rec.start();
  };

  const dark = tone === "dark";

  if (stage === "sent")
    return (
      <div className={`rounded-xl px-4 py-[18px] text-[15px] font-bold ${dark ? "bg-white/15 text-white" : "bg-green/10 text-green"}`}>
        음성을 전달했습니다 · {sentSecs}초 — {to}께 알림이 갑니다
        {!server && <span className="mt-1 block text-[12px] font-medium opacity-80">데모 — 이 기기에서만 들을 수 있습니다</span>}
        <button
          type="button"
          onClick={() => {
            rec.cancel();
            setStage("idle");
          }}
          className={`btn-press btn-inline mt-2 block text-[13px] underline underline-offset-2 ${dark ? "text-white/85" : "text-green"}`}
        >
          하나 더 남기기
        </button>
      </div>
    );

  const problem =
    stage === "send-error" ? sendErrorText(sendErr) : rec.phase === "error" ? RECORD_ERRORS[rec.error] || RECORD_ERRORS.failed : null;

  return (
    <div>
      {!compact && (
        <div className={`text-[13px] leading-[1.7] ${dark ? "text-white/75" : "text-muted"}`}>
          {to}께 목소리를 남깁니다. 글보다 목소리가 먼저 닿습니다.
        </div>
      )}
      <div className={`flex items-center gap-2 ${compact ? "" : "mt-3"}`}>
        <button
          onClick={toggle}
          disabled={stage === "sending" || rec.phase === "asking"}
          aria-label={recording ? "녹음 마치고 보내기" : `${to}께 안부 음성 남기기`}
          // 높이는 min-h 가 아니라 py 로 만든다 — globals.css 의
          // .btn-press{min-height:44px} 가 @layer 밖이라 min-h-[52px] 를 이겨서
          // 실측 44px 로 눌려 있었다 (2026-08-28 "너무 좁다" 피드백).
          className={`btn-press flex flex-1 items-center justify-center gap-2 rounded-xl py-[18px] text-[17px] font-bold disabled:opacity-70 ${
            recording ? "bg-[#B08D57] text-white" : dark ? "border border-white/30 bg-white/10 text-white" : "btn-dark bg-navy text-white"
          }`}
        >
          <span className={`h-[11px] w-[11px] rounded-full ${recording ? "animate-livePing bg-white" : dark ? "bg-white/70" : "bg-gold-soft"}`} />
          {stage === "sending"
            ? "보내는 중…"
            : rec.phase === "asking"
              ? "마이크 켜는 중…"
              : rec.phase === "rec"
                ? `녹음 중 ${clock(rec.secs)} · 눌러서 보내기`
                : "눌러서 녹음"}
        </button>
        {recording && (
          <button
            onClick={() => rec.cancel()}
            className={`btn-press rounded-xl border px-4 py-[18px] text-[15px] font-bold ${dark ? "border-white/30 text-white/85" : "border-navy/15 text-muted"}`}
          >
            취소
          </button>
        )}
      </div>
      {problem && (
        <div className="mt-2">
          <p role="alert" className={`text-[13px] font-bold leading-[1.6] ${dark ? "text-white" : "text-amber"}`}>
            {problem}
          </p>
          {stage === "send-error" && last && (
            <button
              type="button"
              onClick={() => deliver(last)}
              className={`btn-press mt-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold ${dark ? "bg-white/15 text-white" : "bg-green/10 text-green"}`}
            >
              다시 보내기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
