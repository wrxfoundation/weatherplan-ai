// 가족 목록 (2026-11-12 · pages/api/families.js) — 관제 · 컨시어지 화면이 함께 읽는다. 브라우저에서만.
// 가족을 고르는 칸 · 관제 '가족 관리' · '다른 가족에서 온 긴급' 띠가 같은 목록을 본다 — 화면마다 따로 부르지 않게 한 벌로 두고
// 15초마다 새로 읽는다 (SOS · 도와줘요는 지금 보고 있지 않은 가족에서도 올 수 있다).
import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "./auth";

const POLL_MS = 15000;
const OFF = Object.freeze({ on: false, status: "off", families: [], canManage: false, owner: false, error: null });
let snap = { on: true, status: "idle", families: [], canManage: false, owner: false, error: null };
const subs = new Set();
let users = 0;
let timer = null;
let inflight = null;

const publish = (next) => {
  snap = { ...snap, ...next };
  subs.forEach((fn) => fn());
};

// 지금 바로 다시 읽기 — 가족을 만들거나 바꾼 직후에도 부른다
export function refreshFamilies() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await fetch("/api/families", { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) publish({ status: "error", error: j.error || `http-${r.status}` });
      else publish({ status: "ready", error: null, families: Array.isArray(j.families) ? j.families : [], canManage: !!j.canManage, owner: !!j.owner, center: j.center || null });
    } catch (_) {
      publish({ status: snap.status === "ready" ? "ready" : "error", error: "network" });
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

const subscribe = (fn) => {
  subs.add(fn);
  return () => subs.delete(fn);
};

// 센터의 관제 · 컨시어지일 때만 읽는다 — 그 밖(데모 · 테스트 가구 · 어르신 · 보호자)에는 꺼진 값
export function useFamilies() {
  const { user } = useAuth();
  const on = !!user?.center && (user.role === "ops" || user.role === "concierge");
  useEffect(() => {
    if (!on) return undefined;
    users += 1;
    if (users === 1) {
      refreshFamilies();
      timer = setInterval(() => {
        // 관제 PC 는 창이 가려져 있어도 계속 본다 (다른 가족의 SOS) · 컨시어지 폰은 화면이 켜져 있을 때만
        if (user.role === "ops" || !document.hidden) refreshFamilies();
      }, POLL_MS);
    }
    const onShow = () => !document.hidden && refreshFamilies();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onShow);
      users -= 1;
      if (users === 0 && timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, [on, user?.role]);
  const s = useSyncExternalStore(
    subscribe,
    () => snap,
    () => snap
  );
  return on ? s : OFF;
}

// 화면 문구 — 서버 코드를 그대로 보이지 않는다
export const FAMILY_ERR = {
  "schema-missing": "가족 나누기 칸이 아직 없습니다 — Supabase SQL Editor 에서 supabase/families.sql 을 한 번 실행해 주세요 (DEPLOY.md 4-19).",
  "db-not-configured": "서버 저장(Supabase) 연결 전입니다.",
  "ops-only": "관제 계정만 할 수 있습니다.",
  "owner-only": "센터 관리자(ops1 · ops2 · ops3)만 할 수 있습니다.",
  "too-many": "잠시 뒤에 다시 해 주세요 (짧은 시간에 너무 많이 만들었습니다).",
  "too-many-families": "가족이 너무 많습니다 — 쓰지 않는 빈 가족을 지운 뒤에 만들어 주세요.",
  "not-found": "이 가족을 찾지 못했습니다 — 목록을 새로 불러왔습니다.",
  "code-failed": "가입 코드를 만들지 못했습니다 — 다시 눌러 주세요.",
  "login-required": "로그인이 만료됐습니다 — 다시 로그인해 주세요.",
  network: "서버에 연결하지 못했습니다 — 연결을 확인하고 다시 해 주세요.",
};
export const familyErrText = (code, message) => FAMILY_ERR[code] || message || `처리하지 못했습니다 (${code})`;

// 가족 한 줄에 붙는 '지금 상황' — 관제 · 컨시어지가 볼 것이 있는 순서로
export function familyFlags(f, role) {
  const out = [];
  if (f.sos) out.push({ key: "sos", tone: "danger", text: "SOS" });
  if (f.help) out.push({ key: "help", tone: "warn", text: `도와줘요 ${f.help}` });
  const todo = role === "concierge" ? f.conciergeTodo : f.opsTodo;
  if (todo) out.push({ key: "todo", tone: "warn", text: `${role === "concierge" ? "확인 대기" : "승인 대기"} ${todo}` });
  if (role === "ops" && f.pending) out.push({ key: "pending", tone: "gold", text: `가입 승인 ${f.pending}` });
  if (role === "ops" && !f.pri && (f.elders.length || f.guardians.length)) out.push({ key: "staff", tone: "muted", text: "담당 미지정" });
  return out;
}
