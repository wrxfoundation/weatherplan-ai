import { useEffect, useRef, useState } from "react";

// 안부 음성 남기기 — 보호자 홈·긴급 배너·어르신 가족 탭이 같은 컴포넌트를 쓴다.
// (2026-08-12 보호자화면 시트 홈 1·2번, 어르신화면 시트 가족 1번)
//
// 데모에서는 오디오를 저장하지 않는다. 녹음 길이만 재고 "전달됨"까지만 보여준다 —
// 실제 구현은 서버 업로드 + 푸시라서, 여기서 마이크를 잡으면 시연 중 권한 팝업이
// 뜨고 브라우저마다 다르게 막힌다. 흐름이 맞는지 보는 것이 이 화면의 목적이다.
//
// tone: "light" (흰 카드 위) / "dark" (네이비·빨강 배너 위)
export default function VoiceNote({ to, tone = "light", compact = false, onSend }) {
  const [secs, setSecs] = useState(0);
  const [rec, setRec] = useState(false);
  const [sent, setSent] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!rec) return undefined;
    timer.current = setInterval(() => setSecs((s) => Math.min(s + 1, 60)), 1000);
    return () => clearInterval(timer.current);
  }, [rec]);

  const dark = tone === "dark";
  const [tooShort, setTooShort] = useState(false);
  // 스치듯 눌린 것은 보내지 않는다 — 0초짜리 음성이 "전달됨"으로 남으면
  // 받는 쪽에서는 빈 메시지를 듣게 된다. (어르신 화면 VoiceRecorder 와 같은 규칙)
  const send = () => {
    setRec(false);
    if (secs < 1) {
      setTooShort(true);
      setSecs(0);
      return;
    }
    setSent(true);
    onSend?.(secs);
  };

  if (sent)
    return (
      <div
        className={`rounded-xl px-3.5 py-3 text-[14px] font-bold ${
          dark ? "bg-white/15 text-white" : "bg-green/10 text-green"
        }`}
      >
        음성을 전달했습니다 · {secs}초 — {to}께 알림이 갑니다
      </div>
    );

  return (
    <div>
      {!compact && (
        <div className={`text-[13px] leading-[1.7] ${dark ? "text-white/75" : "text-muted"}`}>
          {to}께 목소리를 남깁니다. 글보다 목소리가 먼저 닿습니다.
        </div>
      )}
      <div className={`flex items-center gap-2 ${compact ? "" : "mt-2.5"}`}>
        <button
          onClick={() => (rec ? send() : (setTooShort(false), setSecs(0), setRec(true)))}
          aria-label={rec ? "녹음 마치고 보내기" : `${to}께 안부 음성 남기기`}
          className={`btn-press flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-[16px] font-bold ${
            rec
              ? "bg-danger text-white"
              : dark
              ? "border border-white/30 bg-white/10 text-white"
              : "btn-dark bg-navy text-white"
          }`}
        >
          <span
            className={`h-[11px] w-[11px] rounded-full ${
              rec ? "animate-livePing bg-white" : dark ? "bg-white/70" : "bg-gold-soft"
            }`}
          />
          {rec ? `녹음 중 ${secs}초 · 눌러서 보내기` : "눌러서 녹음"}
        </button>
        {rec && (
          <button
            onClick={() => {
              setRec(false);
              setSecs(0);
            }}
            className={`btn-press min-h-[52px] rounded-xl border px-4 text-[14px] font-bold ${
              dark ? "border-white/30 text-white/85" : "border-navy/15 text-muted"
            }`}
          >
            취소
          </button>
        )}
      </div>
      {tooShort && (
        <p className={`mt-2 text-[13px] font-bold ${dark ? "text-white" : "text-amber"}`}>
          너무 짧습니다. 한 마디만 더 말씀해 주세요.
        </p>
      )}
    </div>
  );
}
