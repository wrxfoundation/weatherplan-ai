// 어르신 목소리 녹음 창 — 마음사서함 '선생님께 말하기' · 해주세요 '말로 부탁하기' ·
// 건강 '병원에 여쭤볼 것' 말로 남기기 · 다시 말하기가 같은 창을 쓴다 (2026-10-14 현장 테스트:
// "녹음 기능이 활성화되지 않고 바로 '말씀하신 내용이 담겼습니다'로 나옴").
//
// 창이 열리면 바로 마이크를 켠다 — 어르신은 이미 '말로 …'를 누르셨다. 처음 한 번은 브라우저가 허용을 묻는다.
// 보내기를 눌러야(또는 1분이 차야) 보낸다. 서버가 받았다고 답해야 '보냈습니다'가 된다 — 누른 것만으로 끝내지 않는다.
// 2026-10-15 시안 — 화면 전체 한 색(듣는 중 보라 · 보냄 초록 · 문제 금색), 가운데 큰 동그라미와 퍼지는 물결, 아래 큰 버튼.
// 빨강은 SOS 전용이라 녹음 중 색은 보라 · 금색이다 (06 §4.2 · 시안의 '말씀하세요' 산호색은 쓰지 않는다).
import { useEffect, useRef, useState } from "react";
import { Line } from "./clay";
import { Btn, TONE, WhiteBtn } from "./ds";
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

  const wide = "w-full max-w-[400px]";
  let tone = TONE.purple;
  let body;
  if (stage === "sending") {
    body = (
      <>
        <Circle color={TONE.purple.solid} rings>
          <Line name="speaker" size={52} />
        </Circle>
        <Title color={TONE.purple.fg}>보내는 중입니다</Title>
        <Sub color={TONE.purple.sub}>잠시만 기다려 주세요.</Sub>
      </>
    );
  } else if (stage === "sent") {
    tone = TONE.green;
    body = (
      <>
        <Circle color={TONE.green.solid} pop>
          <Line name="check" size={64} />
        </Circle>
        <Title color="#2A4D33">{sentTitle}</Title>
        {sentBody && <Sub color="#3B5A44">{sentBody}</Sub>}
        {autoSent && <Sub color="#3B5A44">{autoSent === "ended" ? "마이크가 끊겨 거기까지 보냈습니다." : "1분이 차서 거기까지 보냈습니다."}</Sub>}
        {!server && <Sub color="#3B5A44">데모 — 이 기기에서만 들을 수 있습니다.</Sub>}
        <Btn autoFocus tone="navy" h={70} r={22} className={`${wide} mt-auto text-[22px]`} onClick={onClose}>
          닫기
        </Btn>
      </>
    );
  } else if (stage === "send-error") {
    tone = TONE.gold;
    body = (
      <>
        <Circle color="#C9A064">
          <Line name="speaker" size={52} />
        </Circle>
        <Title color="#5E4A1E">보내지 못했습니다</Title>
        <p role="alert" className="text-[18px] leading-[1.55]" style={{ color: "#5E4A1E" }}>
          {sendErrorText(sendErr)}
        </p>
        <div className={`${wide} mt-auto flex flex-col gap-2`}>
          <Btn autoFocus tone="green" h={70} r={22} className="text-[22px]" onClick={() => deliver(outRef.current)}>
            다시 보내기
          </Btn>
          <button type="button" onClick={close} className="min-h-[56px] text-[19px] font-extrabold" style={{ color: "#5E5A52" }}>
            그만두기
          </button>
        </div>
      </>
    );
  } else if (rec.phase === "error") {
    tone = TONE.gold;
    body = (
      <>
        <Circle color="#C9A064">
          <Line name="mic" size={56} />
        </Circle>
        <Title color="#5E4A1E">{rec.error === "short" ? "다시 말씀해 주세요" : "녹음을 할 수 없습니다"}</Title>
        <p role="alert" className="text-[18px] leading-[1.55]" style={{ color: "#5E4A1E" }}>
          {RECORD_ERRORS[rec.error] || RECORD_ERRORS.failed}
        </p>
        <div className={`${wide} mt-auto flex flex-col gap-2`}>
          <Btn autoFocus tone="green" h={70} r={22} className="text-[22px]" onClick={() => rec.start()}>
            다시 하기
          </Btn>
          <button type="button" onClick={close} className="min-h-[56px] text-[19px] font-extrabold" style={{ color: "#5E5A52" }}>
            닫기
          </button>
        </div>
      </>
    );
  } else {
    const live = rec.phase === "rec";
    body = (
      <>
        <Circle color={TONE.purple.solid} rings={live}>
          <Line name="mic" size={56} />
        </Circle>
        <Title color={TONE.purple.fg}>{live ? "말씀하세요" : "마이크를 켜고 있습니다"}</Title>
        <Sub color={TONE.purple.sub}>{live ? to : "‘허용’이 뜨면 눌러 주세요"}</Sub>
        {live && (
          <>
            <span aria-hidden="true" className="flex h-11 items-center gap-1">
              {[0, 0.3, 0.12, 0.4, 0.2].map((d, i) => (
                <span key={i} className="ds-bar" style={{ background: TONE.purple.solid, animationDelay: `${d}s` }} />
              ))}
            </span>
            <p aria-live="off" className="ds-num text-[28px] font-black" style={{ color: TONE.purple.fg }}>
              {clock(rec.secs)} <span className="text-[17px] font-bold" style={{ color: TONE.purple.sub }}>/ {clock(MAX_SECS)}</span>
            </p>
          </>
        )}
        <div className={`${wide} mt-auto flex flex-col gap-2`}>
          <Btn autoFocus tone="purple" h={78} r={24} px={5} disabled={!live} className="text-[24px] disabled:opacity-50" onClick={finish}>
            보내기
          </Btn>
          <WhiteBtn h={58} sh={TONE.purple.sh} color={TONE.purple.fg} className="text-[19px]" onClick={close}>
            그만두기
          </WhiteBtn>
        </div>
      </>
    );
  }

  return (
    <div className="ds-overlay ds-app z-[60]" style={{ background: tone === TONE.purple ? "#F4F1F9" : tone.bg }} role="dialog" aria-modal="true" aria-label={label}>
      <span className="sr-only" aria-live="polite">
        {stage === "sent" ? sentTitle : stage === "sending" ? "보내는 중" : rec.phase === "rec" ? "녹음 중입니다" : ""}
      </span>
      <span className="text-[17px] font-extrabold" style={{ color: "#8F7F63" }}>
        {label}
      </span>
      {body}
    </div>
  );
}

// 가운데 큰 동그라미 — 듣는 중이면 물결이 퍼진다
function Circle({ color, rings = false, pop = false, children }) {
  return (
    <span className={`relative my-4 block h-[124px] w-[124px] ${pop ? "ds-pop" : ""}`} aria-hidden="true">
      {rings && (
        <>
          <span className="ds-ring absolute inset-0 rounded-full" style={{ background: color }} />
          <span className="ds-ring ds-ring2 absolute inset-0 rounded-full" style={{ background: color }} />
        </>
      )}
      <span className="absolute inset-0 flex items-center justify-center rounded-full text-white" style={{ background: color }}>
        {children}
      </span>
    </span>
  );
}
function Title({ color, children }) {
  return (
    <p className="text-[30px] font-black leading-[1.3]" style={{ color }}>
      {children}
    </p>
  );
}
function Sub({ color, children }) {
  return (
    <p className="text-[18px] leading-[1.55]" style={{ color }}>
      {children}
    </p>
  );
}
