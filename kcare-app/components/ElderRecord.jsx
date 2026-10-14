// 어르신 목소리 녹음 창 — 마음사서함 '선생님께 목소리 보내기' · 해주세요 '말로 부탁하기' ·
// 건강 '오늘 여쭤볼 것' 말로 남기기 · 다시 말하기가 같은 창을 쓴다 (2026-10-14 현장 테스트:
// "녹음 기능이 활성화되지 않고 바로 '말씀하신 내용이 담겼습니다'로 나옴").
//
// 창이 열리면 바로 마이크를 켠다 — 어르신은 이미 '말로 …'를 누르셨다. 처음 한 번은 브라우저가 허용을 묻는다.
// 보내기를 눌러야(또는 1분이 차야) 보낸다. 서버가 받았다고 답해야 '보냈습니다'가 된다 — 누른 것만으로 끝내지 않는다.
// 빨강은 SOS 전용이라 녹음 중 색은 초록 · 금색이다 (06 §4.2).
import { useEffect, useRef, useState } from "react";
import Icon from "./icons";
import { MAX_SECS, RECORD_ERRORS, clock, saveClip, sendErrorText, useRecorder } from "../lib/voice-client";

export default function ElderRecord({ label, to, sentTitle = "보냈습니다", sentBody, server = false, onSend, onClose }) {
  const [stage, setStage] = useState("rec"); // rec | sending | sent | send-error
  const [sendErr, setSendErr] = useState(null);
  const [autoSent, setAutoSent] = useState(null); // null | "max"(1분이 참) | "ended"(마이크가 끊김)
  const outRef = useRef(null);
  const sendingRef = useRef(false);

  const deliver = async (out) => {
    if (!out || sendingRef.current) return;
    sendingRef.current = true;
    outRef.current = out;
    setStage("sending");
    setSendErr(null);
    try {
      const clip = await saveClip(out, { server });
      await onSend?.(clip);
      setStage("sent");
    } catch (e) {
      setSendErr(e.code || "network");
      setStage("send-error");
    } finally {
      sendingRef.current = false;
    }
  };

  const rec = useRecorder({
    maxSecs: MAX_SECS,
    // 1분이 차거나 마이크가 끊기면(이어폰 · 전화) 그때까지 말씀하신 것을 그대로 보낸다 — 버리지 않는다
    onMax: (p, why) => {
      setAutoSent(why === "ended" ? "ended" : "max");
      p.then((out) => deliver(out));
    },
  });

  useEffect(() => {
    rec.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = async () => {
    const out = await rec.stop();
    if (out) deliver(out);
  };
  const close = () => {
    rec.cancel();
    onClose?.();
  };

  const btn = "btn-press w-full rounded-[18px] py-[19px] text-[21px] font-bold";
  let body;
  if (stage === "sending") {
    body = (
      <>
        <Ring tone="green" pulse>
          <Icon name="speaker" size={34} strokeWidth={2} />
        </Ring>
        <p className="mt-5 text-[26px] font-black leading-[1.3] text-navy">보내는 중입니다</p>
        <p className="mt-1.5 text-[17px] leading-[1.5] text-muted">잠시만 기다려 주세요.</p>
      </>
    );
  } else if (stage === "sent") {
    body = (
      <>
        <Ring tone="green">
          <Icon name="check" size={40} strokeWidth={2.4} />
        </Ring>
        <p className="mt-5 text-[28px] font-black leading-[1.25] text-navy">{sentTitle}</p>
        {sentBody && <p className="mt-1.5 text-[18px] leading-[1.55] text-muted">{sentBody}</p>}
        {autoSent && (
          <p className="mt-1 text-[16px] leading-[1.5] text-muted">
            {autoSent === "ended" ? "마이크가 끊겨 거기까지 보냈습니다." : "1분이 차서 거기까지 보냈습니다."}
          </p>
        )}
        {!server && <p className="mt-2 text-[15px] leading-[1.5] text-muted">데모 — 이 기기에서만 들을 수 있습니다.</p>}
        <button autoFocus onClick={onClose} className={`${btn} mt-6 text-navy`} style={{ background: "rgba(10,31,60,.06)" }}>
          닫기
        </button>
      </>
    );
  } else if (stage === "send-error") {
    body = (
      <>
        <Ring tone="gold">
          <Icon name="alert" size={36} strokeWidth={2} />
        </Ring>
        <p className="mt-5 text-[24px] font-black leading-[1.35] text-navy">보내지 못했습니다</p>
        <p role="alert" className="mt-1.5 text-[17px] leading-[1.55] text-ink">{sendErrorText(sendErr)}</p>
        <button autoFocus onClick={() => deliver(outRef.current)} className={`${btn} mt-6 text-white`} style={{ background: "#1E7A5A" }}>
          다시 보내기
        </button>
        <button onClick={close} className={`${btn} mt-2 py-[15px] text-[19px] text-muted`}>
          그만두기
        </button>
      </>
    );
  } else if (rec.phase === "error") {
    body = (
      <>
        <Ring tone="gold">
          <Icon name="mic" size={34} strokeWidth={2} />
        </Ring>
        <p className="mt-5 text-[24px] font-black leading-[1.35] text-navy">{rec.error === "short" ? "다시 말씀해 주세요" : "녹음을 할 수 없습니다"}</p>
        <p role="alert" className="mt-1.5 text-[17px] leading-[1.55] text-ink">{RECORD_ERRORS[rec.error] || RECORD_ERRORS.failed}</p>
        <button autoFocus onClick={() => rec.start()} className={`${btn} mt-6 text-white`} style={{ background: "#1E7A5A" }}>
          다시 하기
        </button>
        <button onClick={close} className={`${btn} mt-2 py-[15px] text-[19px] text-muted`}>
          닫기
        </button>
      </>
    );
  } else {
    const live = rec.phase === "rec";
    body = (
      <>
        <Ring tone="green" pulse={live}>
          <Icon name="mic" size={32} strokeWidth={2} />
        </Ring>
        <p className="mt-5 text-[30px] font-black leading-[1.25] text-navy">{live ? "말씀하세요" : "마이크를 켜고 있습니다"}</p>
        <p className="mt-1.5 text-[17px] leading-[1.5] text-muted">
          {live ? to : "‘허용’이 뜨면 눌러 주세요"}
        </p>
        {live && (
          <p aria-live="off" className="mt-3 font-num text-[26px] font-bold text-[#1E7A5A]">
            {clock(rec.secs)} <span className="text-[16px] font-medium text-muted">/ {clock(MAX_SECS)}</span>
          </p>
        )}
        <button
          autoFocus
          onClick={finish}
          disabled={!live}
          className={`${btn} mt-6 text-white disabled:opacity-50`}
          style={{ background: "#1E7A5A" }}
        >
          보내기
        </button>
        <button onClick={close} className={`${btn} mt-2 py-[15px] text-[19px] text-muted`}>
          그만두기
        </button>
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(8,23,45,.72)] px-6">
      <div
        className="w-full max-w-[360px] rounded-[26px] bg-white px-6 pb-6 pt-8 text-center break-keep"
        style={{ boxShadow: "0 30px 60px -20px rgba(8,23,45,.6)" }}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        <span className="sr-only" aria-live="polite">
          {stage === "sent" ? sentTitle : stage === "sending" ? "보내는 중" : rec.phase === "rec" ? "녹음 중입니다" : ""}
        </span>
        {body}
      </div>
    </div>
  );
}

function Ring({ tone, pulse = false, children }) {
  const c = tone === "gold" ? { bg: "rgba(176,141,87,.16)", fg: "#8A5D12", solid: "#B08D57" } : { bg: "rgba(30,122,90,.12)", fg: "#1E7A5A", solid: "#1E7A5A" };
  return (
    <span aria-hidden className="mx-auto flex h-[92px] w-[92px] items-center justify-center rounded-full" style={{ background: c.bg, color: c.fg }}>
      <span className={`flex h-[68px] w-[68px] items-center justify-center rounded-full ${pulse ? "animate-livePing" : ""}`} style={{ background: c.solid, color: "#FFFFFF" }}>
        {children}
      </span>
    </span>
  );
}
