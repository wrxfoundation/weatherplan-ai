import { useState } from "react";
import { RECORD_ERRORS, clock, saveClip, sendErrorText, useRecorder } from "../lib/voice-client";
import { useSync } from "../lib/state";
import { Line } from "./clay";
import { TONE } from "./ds";

// 안부 음성 남기기 — 보호자 홈 · 긴급 배너가 같은 컴포넌트를 쓴다.
// (2026-08-12 보호자화면 시트 홈 1·2번)
//
// 2026-10-14부터 실제로 녹음한다 (lib/voice-client.js) — 전에는 녹음 길이만 재고 '전달됨'을 보였다.
// 누르면 마이크가 켜지고(처음 한 번 브라우저가 허용을 묻는다), 다시 누르면 서버에 올린 뒤 보낸다.
// 서버가 받았다고 답해야 '전달했습니다'가 된다. 데모(로그인 없이)는 이 기기 메모리에만 둔다.
//
// 2026-10-15 시안 — 보라 3D 큰 버튼 하나("어머니께 목소리 보내기 · 받은 음성 N개"). 누르면 그 버튼이 곧 녹음 중 표시가 되고
// 한 번 더 누르면 보낸다. 녹음 중 색은 금색 — 빨강은 SOS · 낙상 전용이다 (시안의 산호색은 쓰지 않는다).
// tone: "light" (보호자 홈) / "dark" (빨강 SOS 배너 위)
// onSend(secs, clip) — 보낸 녹음 { id, mime, secs }
export default function VoiceNote({ to, tone = "light", title, sub, onSend }) {
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
  const problem =
    stage === "send-error" ? sendErrorText(sendErr) : rec.phase === "error" ? RECORD_ERRORS[rec.error] || RECORD_ERRORS.failed : null;

  // ── 빨강 SOS 배너 안 (작게) ──
  if (tone === "dark") {
    if (stage === "sent")
      return (
        <div className="rounded-[16px] bg-white/15 px-4 py-3.5 text-[15px] font-bold text-white">
          음성을 전달했습니다 · {sentSecs}초 — {to}께 알림이 갑니다
          <button type="button" onClick={() => setStage("idle")} className="mt-1 block min-h-[32px] text-[13px] underline underline-offset-2 text-white/85">
            하나 더 남기기
          </button>
        </div>
      );
    return (
      <div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={stage === "sending" || rec.phase === "asking"}
            aria-label={recording ? "녹음 마치고 보내기" : `${to}께 안부 음성 남기기`}
            className="ds-press flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-[16px] text-[16px] font-extrabold disabled:opacity-70"
            style={recording ? { background: "#E8B54A", color: "#1B2340" } : { background: "rgba(255,255,255,.14)", color: "#FFFFFF", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.35)" }}
          >
            <Line name="mic" size={20} />
            {stage === "sending" ? "보내는 중…" : rec.phase === "asking" ? "마이크 켜는 중…" : rec.phase === "rec" ? `녹음 중 ${clock(rec.secs)} · 눌러서 보내기` : "눌러서 녹음"}
          </button>
          {recording && (
            <button type="button" onClick={() => rec.cancel()} className="min-h-[52px] rounded-[16px] px-4 text-[15px] font-bold text-white/85" style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.3)" }}>
              취소
            </button>
          )}
        </div>
        {problem && (
          <p role="alert" className="mt-2 text-[13px] font-bold leading-[1.6] text-white">
            {problem}
          </p>
        )}
      </div>
    );
  }

  // ── 보호자 홈 — 보라 큰 버튼 ──
  if (stage === "sent")
    return (
      <div className="ds-swap flex min-h-[92px] items-center gap-3.5 rounded-[26px] px-[18px] py-3" style={{ background: TONE.green.bg, boxShadow: `0 5px 0 ${TONE.green.sh}` }}>
        <span className="ds-pop flex h-14 w-14 flex-none items-center justify-center rounded-full text-white" style={{ background: TONE.green.solid }}>
          <Line name="check" size={28} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[19px] font-extrabold" style={{ color: "#2A4D33" }}>
            목소리를 보냈어요 · {sentSecs}초
          </span>
          <span className="block text-[14px]" style={{ color: "#3B5A44" }}>
            {to}께 알림이 갑니다{!server ? " · 데모 — 이 기기에서만 들을 수 있습니다" : ""}
          </span>
          <button type="button" onClick={() => setStage("idle")} className="mt-0.5 min-h-[32px] text-[14px] font-extrabold underline underline-offset-2" style={{ color: TONE.green.title }}>
            하나 더 남기기
          </button>
        </span>
      </div>
    );
  return (
    <div>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={stage === "sending" || rec.phase === "asking"}
          aria-label={recording ? "녹음 마치고 보내기" : `${to}께 안부 음성 남기기`}
          className="ds-press ds-btn3d flex min-h-[92px] flex-1 items-center gap-3.5 rounded-[26px] px-[18px] text-left disabled:opacity-80"
          style={recording ? { background: TONE.gold.bg, boxShadow: `0 5px 0 ${TONE.gold.sh}` } : { background: TONE.purple.bg, boxShadow: `0 5px 0 ${TONE.purple.sh}` }}
        >
          {rec.phase === "rec" ? (
            <span className="ds-recdot" aria-hidden="true" />
          ) : (
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full text-white" style={{ background: TONE.purple.solid }}>
              <Line name="mic" size={26} />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-[20px] leading-[1.3]" style={{ color: rec.phase === "rec" ? TONE.gold.fg : TONE.purple.title }}>
              {stage === "sending"
                ? "보내는 중…"
                : rec.phase === "asking"
                  ? "마이크를 켜고 있어요"
                  : rec.phase === "rec"
                    ? (
                      <>
                        녹음하고 있어요 <span className="ds-num">{clock(rec.secs)}</span>
                      </>
                    )
                    : title || `${to}께 목소리 보내기`}
            </span>
            <span className="block text-[15px] font-medium" style={{ color: rec.phase === "rec" ? TONE.gold.sub : TONE.purple.sub }}>
              {rec.phase === "rec" ? "한 번 더 누르면 보내요" : sub || "글보다 목소리가 먼저 닿습니다"}
            </span>
          </span>
        </button>
        {recording && (
          <button
            type="button"
            onClick={() => rec.cancel()}
            className="ds-press ds-btn3d min-w-[72px] rounded-[22px] px-3 text-[16px]"
            style={{ background: "#FFFFFF", boxShadow: "0 4px 0 #E3DED3", color: "#5E6270" }}
          >
            취소
          </button>
        )}
      </div>
      {problem && (
        <div className="mt-2">
          <p role="alert" className="text-[14px] font-bold leading-[1.6]" style={{ color: TONE.gold.fg }}>
            {problem}
          </p>
          {stage === "send-error" && last && (
            <button
              type="button"
              onClick={() => deliver(last)}
              className="ds-press ds-btn3d mt-1.5 min-h-[44px] rounded-[14px] px-4 text-[14px]"
              style={{ background: TONE.green.bg, boxShadow: `0 3px 0 ${TONE.green.sh}`, color: "#2A4D33" }}
            >
              다시 보내기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
