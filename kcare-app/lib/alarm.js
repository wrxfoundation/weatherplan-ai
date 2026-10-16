// 긴급 알림음 · 진동 — SOS 가 들어오면 관제 · 컨시어지 화면에서 울린다 (2026-10-02 현장 요청:
// "관제에 SOS 발생 시 팝업처럼 떠야", "어르신 SOS 가 컨시어지에 알람 안 뜸").
// 브라우저는 사람이 화면을 한 번이라도 누른 뒤에만 소리를 허락한다. 막히면 조용히 넘어가고
// 화면의 팝업 · 배너가 남는다 — 소리는 덤이고, 놓치지 않게 하는 것은 화면이다.
export function ringAlarm() {
  try {
    // 화면을 한 번도 누르지 않은 창에서 부르면 크롬이 막고 콘솔에 경고를 남긴다 — 누른 뒤에만
    const touched = typeof navigator !== "undefined" && (!navigator.userActivation || navigator.userActivation.hasBeenActive);
    if (touched && navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
  } catch (_) {
    /* 진동이 없는 기기 */
  }
  try {
    const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    const t = ctx.currentTime;
    [0, 0.45, 0.9].forEach((d) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.2, t + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(t + d);
      o.stop(t + d + 0.36);
    });
    setTimeout(() => ctx.close && ctx.close(), 1600);
  } catch (_) {
    /* 소리가 막힌 브라우저 — 화면 알림만 */
  }
}
