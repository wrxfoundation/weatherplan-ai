// 관제 화면 공용 시각 도구 — 모든 실시간 값 옆에 붙는 시각·경과시간을 한 곳에서 만든다.
// 서버 렌더와 클라이언트 첫 렌더가 어긋나지 않도록, 시계는 마운트 뒤에만 켠다 (useNow 가 null 을 먼저 준다).
import { useEffect, useState } from "react";

export function useNow(interval = 1000) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

const pad = (n) => String(n).padStart(2, "0");

export function fmtTime(ts) {
  if (ts == null) return "—";
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function fmtClock(ts) {
  if (ts == null) return "—";
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDate(ts) {
  if (ts == null) return "—";
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fmtDateTime(ts) {
  if (ts == null) return "—";
  return `${fmtDate(ts)} ${fmtClock(ts)}`;
}

// SOS 사건번호용 날짜 8자리
export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

// 경과시간 타이머 표기 — MM:SS · 1시간 넘으면 H:MM:SS
export function fmtElapsed(ms) {
  if (ms == null || Number.isNaN(ms)) return "--:--";
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

// 지속시간 문장 표기 — "2분 18초" · "6시간 17분"
export function fmtDur(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}초`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return s % 60 && s < 600 ? `${m}분 ${s % 60}초` : `${m}분`;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

// "n분 전" — 마지막 수신 시각 보조 표기
export function fmtAgo(ms) {
  if (ms == null) return "—";
  if (ms < 60000) return `${Math.max(1, Math.floor(ms / 1000))}초 전`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}분 전`;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return m ? `${h}시간 ${m}분 전` : `${h}시간 전`;
}

// 해외 보호자 현지시각 — offsetH 는 한국시각 대비 시차
export function fmtLocal(ts, offsetH) {
  if (ts == null) return "—";
  return fmtClock(ts + offsetH * 3600000);
}

export const MIN = 60000;
export const HOUR = 3600000;
