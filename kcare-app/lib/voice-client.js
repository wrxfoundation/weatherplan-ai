// 목소리 녹음 · 보내기 · 듣기 — 화면 공용 (2026-10-14 현장 테스트: "녹음 기능이 활성화되지 않고 바로
// '말씀하신 내용이 담겼습니다'로 나옴" · "실제 음성이 녹음이 안 되고 반영이 안 됨").
//
// 전에는 녹음 창을 열어 둔 시간만 재서 '보냈습니다'를 보였다 — 마이크를 잡지 않았고 소리도 남지 않았다.
// 이제 실제로 녹음한다:
//   녹음    브라우저 MediaRecorder. 마이크 허용을 처음 한 번 묻는다. 한 번에 최대 60초.
//   보내기  테스트 계정(서버 저장) — /api/voice 로 올려 Supabase voice_clips 표에 둔다.
//           가구 기록(lib/state.js)에는 소리 대신 clip { id, mime, secs } 만 남는다 — 가구 상태가 커지지 않게.
//           데모(로그인 없이) — 이 기기 메모리에만 둔다. 새로고침하면 사라진다.
//   듣기    /api/voice?id= 에서 받아 이 기기에서 재생한다. 같은 가구(센터)의 계정만 받을 수 있다.
//
// 받아쓰기(STT)는 하지 않는다 (2026-09-11 A안 — 글은 사람이 적은 한 줄). '말로 남기신 부탁'의 글 요약은
// 담당 컨시어지가 듣고 적는다 (components/ConciergeRequests.jsx).
import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_SECS = 60;
// 아이폰(사파리)은 mp4(AAC)만 녹음한다. 안드로이드 · PC 크롬은 webm(Opus)이 기본이다 — 크롬이 mp4 를 받으면
// mp4 를 먼저 쓴다(아이폰에서도 그대로 들린다).
const MIME_PREF = ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];

export const RECORD_ERRORS = {
  denied: "마이크 사용이 막혀 있습니다. 주소창 옆 자물쇠(또는 휴대폰 설정)에서 마이크를 허용한 뒤 다시 해 주세요.",
  nodevice: "마이크를 찾지 못했습니다. 이어폰을 꽂았다면 빼고 다시 해 주세요.",
  busy: "다른 앱이 마이크를 쓰고 있습니다. 통화가 끝난 뒤 다시 해 주세요.",
  unsupported: "이 브라우저에서는 녹음할 수 없습니다. 크롬이나 사파리 최신판으로 열어 주세요.",
  insecure: "보안 연결(https) 주소에서만 녹음할 수 있습니다.",
  failed: "녹음을 시작하지 못했습니다. 다시 해 주세요.",
  short: "너무 짧습니다. 조금 더 길게 말씀해 주세요.",
};
// 보내기 · 듣기 실패 — 서버 응답 코드를 사람 말로 (키 · 주소는 싣지 않는다)
export const SEND_ERRORS = {
  "schema-missing": "서버에 목소리 저장 표가 아직 없습니다 — 관리자에게 알려 주세요 (supabase SQL 추가 필요).",
  "db-not-configured": "서버 저장이 설정되지 않았습니다 — 관리자에게 알려 주세요.",
  "login-required": "로그인이 만료됐습니다. 다시 로그인한 뒤 보내 주세요.",
  "too-many": "짧은 시간에 너무 많이 보냈습니다. 잠시 뒤 다시 보내 주세요.",
  "too-large": "녹음이 너무 깁니다. 1분 안으로 다시 말씀해 주세요.",
  gone: "이 목소리는 지금 들을 수 없습니다 (보관 기간이 지났거나 다른 기기의 데모 녹음).",
  "invalid-request": "녹음이 제대로 담기지 않았습니다 — 그만두고 다시 녹음해 주세요.",
  account: "이 아이디로는 지금 보낼 수 없습니다 — 다시 로그인해 주세요.",
  network: "연결이 끊겨 보내지 못했습니다. 다시 보내기를 눌러 주세요.",
};
// 정지 · 역할 변경(account-… · role-changed)은 다시 보내도 같다 — 연결 문제처럼 말하지 않는다
export const sendErrorText = (code) =>
  SEND_ERRORS[code] || (/^account-|^role-changed$/.test(String(code || "")) ? SEND_ERRORS.account : SEND_ERRORS.network);

export function recorderSupport() {
  if (typeof window === "undefined") return { ok: false, reason: "unsupported" };
  if (window.isSecureContext === false) return { ok: false, reason: "insecure" };
  if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === "undefined") return { ok: false, reason: "unsupported" };
  return { ok: true };
}

function pickMime() {
  const MR = typeof window !== "undefined" ? window.MediaRecorder : null;
  if (!MR?.isTypeSupported) return "";
  return (
    MIME_PREF.find((t) => {
      try {
        return MR.isTypeSupported(t);
      } catch (_) {
        return false;
      }
    }) || ""
  );
}

function micError(e) {
  const n = e?.name || "";
  if (n === "NotAllowedError" || n === "SecurityError" || n === "PermissionDeniedError") return "denied";
  if (n === "NotFoundError" || n === "OverconstrainedError" || n === "DevicesNotFoundError") return "nodevice";
  if (n === "NotReadableError" || n === "AbortError" || n === "TrackStartError") return "busy";
  return "failed";
}

// 녹음기 — phase: idle | asking(마이크 허용 묻는 중) | rec | paused | done | error
// stop() 은 { blob, mime, secs } 를 돌려준다. 1초가 안 되면 error "short" 로 끝난다(보내지 않는다).
export function useRecorder({ maxSecs = MAX_SECS, onMax } = {}) {
  const [phase, setPhase] = useState("idle");
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const r = useRef({ stream: null, rec: null, chunks: [], startedAt: 0, acc: 0, timer: null, wait: null, token: 0 });
  const onMaxRef = useRef(onMax);
  onMaxRef.current = onMax;

  const elapsed = () => r.current.acc + (r.current.startedAt ? Date.now() - r.current.startedAt : 0);
  const release = () => {
    const x = r.current;
    clearInterval(x.timer);
    x.timer = null;
    x.stream?.getTracks().forEach((t) => t.stop());
    x.stream = null;
  };

  const stop = useCallback(
    () =>
      new Promise((resolve) => {
        const x = r.current;
        if (!x.rec || x.rec.state === "inactive") return resolve(null);
        x.acc = elapsed();
        x.startedAt = 0;
        x.wait = resolve;
        try {
          x.rec.stop();
        } catch (_) {
          release();
          resolve(null);
        }
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const start = useCallback(async () => {
    const sup = recorderSupport();
    const x = r.current;
    const token = ++x.token;
    setError(null);
    setResult(null);
    setSecs(0);
    if (!sup.ok) {
      setError(sup.reason);
      setPhase("error");
      return false;
    }
    setPhase("asking");
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (e) {
      if (token !== x.token) return false;
      setError(micError(e));
      setPhase("error");
      return false;
    }
    // 묻는 사이 창을 닫았다 — 마이크를 바로 놓는다
    if (token !== x.token) {
      stream.getTracks().forEach((t) => t.stop());
      return false;
    }
    const mime = pickMime();
    let rec;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
    } catch (_) {
      try {
        rec = new MediaRecorder(stream);
      } catch (e) {
        stream.getTracks().forEach((t) => t.stop());
        setError("unsupported");
        setPhase("error");
        return false;
      }
    }
    x.stream = stream;
    x.rec = rec;
    x.chunks = [];
    x.acc = 0;
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) x.chunks.push(e.data);
    };
    rec.onstop = () => {
      // 브라우저가 스스로 멈췄다(이어폰 끊김 · 전화가 마이크를 가져감 · 권한 회수) — stop() 을 거치지 않아
      // 여기서 말한 시간을 센다. 안 세면 40초를 말해도 0초라 '너무 짧습니다'로 버려졌다 (2026-10-14 점검)
      if (x.startedAt) {
        x.acc = elapsed();
        x.startedAt = 0;
      }
      const type = (rec.mimeType || mime || x.chunks[0]?.type || "audio/webm").trim();
      const blob = new Blob(x.chunks, { type });
      const s = Math.round(x.acc / 1000);
      release();
      x.rec = null;
      const wait = x.wait;
      x.wait = null;
      if (s < 1 || blob.size < 200) {
        setError("short");
        setPhase("error");
        wait?.(null);
        return;
      }
      const out = { blob, mime: type, secs: Math.min(s, maxSecs) };
      setResult(out);
      setSecs(out.secs);
      setPhase("done");
      // 우리가 멈추지 않았다 — 1분이 찼을 때처럼 받아 갈 곳(onMax)에 넘긴다 (두 번째 값 "ended")
      if (wait) wait(out);
      else onMaxRef.current?.(Promise.resolve(out), "ended");
    };
    try {
      rec.start(1000);
    } catch (_) {
      release();
      setError("failed");
      setPhase("error");
      return false;
    }
    x.startedAt = Date.now();
    setPhase("rec");
    x.timer = setInterval(() => {
      const ms = elapsed();
      setSecs(Math.floor(ms / 1000));
      if (ms >= maxSecs * 1000 && x.rec && x.rec.state === "recording") {
        const p = stop();
        onMaxRef.current?.(p);
      }
    }, 250);
    return true;
  }, [maxSecs, stop]); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = useCallback(() => {
    const x = r.current;
    if (!x.rec || x.rec.state !== "recording" || typeof x.rec.pause !== "function") return;
    x.acc = elapsed();
    x.startedAt = 0;
    x.rec.pause();
    setPhase("paused");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const resume = useCallback(() => {
    const x = r.current;
    if (!x.rec || x.rec.state !== "paused") return;
    x.startedAt = Date.now();
    x.rec.resume();
    setPhase("rec");
  }, []);

  // 그만두기 — 녹음한 것을 버리고 마이크를 놓는다
  const cancel = useCallback(() => {
    const x = r.current;
    x.token += 1;
    if (x.rec && x.rec.state !== "inactive") {
      x.rec.onstop = null;
      try {
        x.rec.stop();
      } catch (_) {
        /* 이미 멈췄다 */
      }
    }
    x.rec = null;
    x.wait?.(null);
    x.wait = null;
    release();
    x.acc = 0;
    x.startedAt = 0;
    setSecs(0);
    setResult(null);
    setError(null);
    setPhase("idle");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => cancel(), [cancel]);

  return { phase, secs, error, result, start, stop, pause, resume, cancel };
}

// ── 보관 ──
const MEM = new Map(); // 데모 녹음 — clip id → object URL (이 기기 · 이 탭에서만)
const CACHE = new Map(); // 서버 녹음 — clip id → object URL (한 번 받은 것은 다시 받지 않는다)
const memId = () => `mem:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// 연결이 멈춘 채 기다리지 않게 — 시간이 지나면 끊고 '다시 보내기 · 다시 듣기'를 보여 준다.
// (폰 연결이 반쯤 끊기면 fetch 는 몇 분씩 답이 없다. 그동안 어르신은 '보내는 중'에서 빠져나올 수 없었다)
const SEND_TIMEOUT_MS = 45000; // 2분 답장(약 2MB)도 느린 연결에서 올라갈 시간
const FETCH_TIMEOUT_MS = 20000;
function timeoutSignal(ms) {
  if (typeof AbortController === "undefined") return { signal: undefined, clear: () => {} };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  return { signal: ctl.signal, clear: () => clearTimeout(t) };
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || "").replace(/^data:[^,]*,/, ""));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

// 녹음 하나를 보낸다 → clip { id, mime, secs }. server 가 아니면(데모) 이 기기 메모리에 둔다.
export async function saveClip({ blob, mime, secs }, { server = false } = {}) {
  if (!server) {
    const id = memId();
    MEM.set(id, URL.createObjectURL(blob));
    return { id, mime, secs };
  }
  let res;
  let j = {};
  const to = timeoutSignal(SEND_TIMEOUT_MS);
  try {
    const data = await blobToBase64(blob);
    res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mime, secs, data }),
      signal: to.signal,
    });
    j = await res.json().catch(() => ({}));
  } catch (_) {
    throw Object.assign(new Error("send-failed"), { code: "network" });
  } finally {
    to.clear();
  }
  if (!res.ok || !j.id) throw Object.assign(new Error("send-failed"), { code: j.error || (res.status === 413 ? "too-large" : "network") });
  // 보낸 기기에서는 받지 않고 바로 들을 수 있게
  CACHE.set(j.id, URL.createObjectURL(blob));
  return { id: j.id, mime, secs };
}

// 들을 주소 — 이미 받아 둔 것은 바로(동기), 아니면 null
export function clipUrlNow(clip) {
  if (!clip?.id) return null;
  if (clip.id.startsWith("mem:")) return MEM.get(clip.id) || null;
  return CACHE.get(clip.id) || null;
}

const loading = new Map(); // clip id → Promise (같은 것을 두 번 받지 않게)
export function fetchClip(clip) {
  if (!clip?.id) return Promise.resolve(null);
  const now = clipUrlNow(clip);
  if (now || clip.id.startsWith("mem:")) return Promise.resolve(now);
  if (loading.has(clip.id)) return loading.get(clip.id);
  const to = timeoutSignal(FETCH_TIMEOUT_MS);
  const p = fetch(`/api/voice?id=${encodeURIComponent(clip.id)}`, { cache: "no-store", signal: to.signal })
    .then(async (res) => {
      if (!res.ok) throw Object.assign(new Error("fetch-failed"), { code: res.status === 404 ? "gone" : res.status === 401 ? "login-required" : "network" });
      const url = URL.createObjectURL(await res.blob());
      CACHE.set(clip.id, url);
      return url;
    })
    .catch((e) => {
      // 시간 초과 · 끊김은 '연결 확인' 안내로 — 다시 누르면 새로 받는다 (loading 에서 빠지므로)
      throw e?.code ? e : Object.assign(new Error("fetch-failed"), { code: "network" });
    })
    .finally(() => {
      to.clear();
      loading.delete(clip.id);
    });
  loading.set(clip.id, p);
  return p;
}

// 화면에 보이는 목소리를 미리 받아 둔다 — 누르는 순간 바로 재생해야 아이폰이 막지 않는다
// (사파리는 누른 뒤 서버를 기다렸다가 재생하면 '사용자가 누르지 않은 재생'으로 보고 막는다).
export function usePrefetchClips(clips) {
  const key = (clips || [])
    .map((c) => c?.id)
    .filter((id) => id && !id.startsWith("mem:"))
    .slice(0, 12)
    .join(",");
  useEffect(() => {
    if (!key) return undefined;
    let stop = false;
    (async () => {
      for (const id of key.split(",")) {
        if (stop) return;
        if (CACHE.has(id)) continue;
        try {
          await fetchClip({ id });
        } catch (_) {
          /* 누를 때 다시 해 본다 */
        }
      }
    })();
    return () => {
      stop = true;
    };
  }, [key]);
}

// ── 재생 — 한 번에 하나만 (앱 전체에서 같은 소리 하나) ──
let audioEl = null; // 한 개를 계속 쓴다 — 아이폰은 한 번 누른 재생 요소를 다음에도 열어 준다
let current = null; // 지금 재생 중인 key
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(current));
function element() {
  if (!audioEl && typeof Audio !== "undefined") {
    audioEl = new Audio();
    audioEl.preload = "auto";
  }
  return audioEl;
}
export function stopVoice() {
  if (audioEl) {
    audioEl.onended = null;
    audioEl.onerror = null;
    audioEl.pause();
  }
  current = null;
  notify();
}

// play(key, { clip, src }, { onEnd, onStart }) — 같은 key 를 다시 누르면 멈춘다.
// 반환 상태: playing(지금 재생 중인 key) · busy(받는 중인 key) · failed { key, code }
export function useVoicePlayer() {
  const [playing, setPlaying] = useState(null);
  const [busy, setBusy] = useState(null);
  const [failed, setFailed] = useState(null);
  const busyRef = useRef(null);
  useEffect(() => {
    const fn = (k) => setPlaying(k);
    listeners.add(fn);
    setPlaying(current);
    return () => listeners.delete(fn);
  }, []);

  const begin = (key, url, cb) => {
    const el = element();
    if (!el || !url) return false;
    el.onended = () => {
      if (current === key) {
        current = null;
        notify();
      }
      cb?.onEnd?.();
    };
    el.onerror = () => {
      if (current === key) {
        current = null;
        notify();
      }
      setFailed({ key, code: "play-failed" });
    };
    el.src = url;
    current = key;
    notify();
    const p = el.play();
    // '들었어요'는 소리가 실제로 나기 시작했을 때만 — 재생이 막혔는데 새 표시가 사라지면 안 된다
    if (p && typeof p.then === "function")
      p.then(
        () => cb?.onStart?.(),
        (e) => {
          // 다른 목소리를 누르거나 멈춰서 끊긴 것 — 실패가 아니다 (지금 재생 표시도 건드리지 않는다)
          if (e?.name === "AbortError") return;
          if (current === key) {
            current = null;
            notify();
          }
          // 받는 사이 '누른 순간'이 지나 막혔다 — 이제 받아 두었으니 한 번 더 누르면 된다
          setFailed({ key, code: e?.name === "NotAllowedError" ? "tap-again" : "play-failed" });
        }
      );
    else cb?.onStart?.();
    return true;
  };

  const play = useCallback((key, { clip, src } = {}, cb = {}) => {
    // 받는 중에 같은 것을 또 눌렀다 — 두 번 재생하지 않는다
    if (busyRef.current === key) return;
    // 다른 목소리를 받는 중이었다 — 그것은 다 받아도 틀지 않는다 (나중에 누른 것이 이긴다)
    busyRef.current = null;
    setBusy(null);
    setFailed(null);
    if (current === key) {
      stopVoice();
      return;
    }
    stopVoice();
    const now = src || clipUrlNow(clip);
    if (now) {
      begin(key, now, cb);
      return;
    }
    if (!clip?.id || clip.id.startsWith("mem:")) {
      setFailed({ key, code: "gone" });
      return;
    }
    setBusy(key);
    busyRef.current = key;
    fetchClip(clip)
      .then((url) => {
        if (!url) throw Object.assign(new Error("gone"), { code: "gone" });
        // 받는 사이 다른 목소리를 눌렀으면 이것은 틀지 않는다
        if (busyRef.current === key) begin(key, url, cb);
      })
      .catch((e) => setFailed({ key, code: e.code || "network" }))
      .finally(() => {
        if (busyRef.current === key) busyRef.current = null;
        setBusy((b) => (b === key ? null : b));
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { playing, busy, failed, play, stop: stopVoice };
}

export const PLAY_ERRORS = {
  "tap-again": "준비됐습니다. 한 번 더 눌러 주세요.",
  "play-failed": "이 기기에서 재생하지 못했습니다.",
  gone: SEND_ERRORS.gone,
  "login-required": SEND_ERRORS["login-required"],
  network: "목소리를 받지 못했습니다. 연결을 확인하고 다시 눌러 주세요.",
};
export const playErrorText = (code) => PLAY_ERRORS[code] || PLAY_ERRORS.network;

// "0:07" — 녹음 · 재생 시간
export const clock = (s) => `${Math.floor((Number(s) || 0) / 60)}:${String((Number(s) || 0) % 60).padStart(2, "0")}`;
