// 자녀 초대 링크 (2026-10-14 현장 '연동 확인' 4번: "어르신 본인이 주체로 가입했을 경우 자녀에게 보낼 수 있는
// 초대 링크를 만들어 자녀가 링크로 가입할 수 있는지") — 서버(API 라우트)에서만 쓴다.
//
// 링크는 서명된 표 한 장이다: 어느 센터 · 누가 · 어떤 역할로(보호자) · 언제까지(7일). 서명은 로그인 비밀 값(NEXTAUTH_SECRET)
// 에서 따로 만든 키로 한다 — 표를 고치면 서명이 맞지 않는다. 보낸 사람의 로그인 아이디는 암호화해서 싣는다 — 서명만 한
// 표는 링크를 받은 누구나 풀어 읽을 수 있어, 아이디가 새면 남이 비밀번호를 일부러 틀려 그 계정을 잠글 수 있었다 (2026-10-14 점검). 표 하나로 가입할 수 있는 사람은 5명까지
// (가입 신청에 표 번호를 남겨 센다 · accounts.profile.invite). 초대로 가입해도 센터 관제가 승인해야 로그인된다 (승인 전원 원칙).
import crypto from "crypto";
import { CENTERS } from "./centers";

export const INVITE_DAYS = 7;
export const INVITE_MAX_USES = 5;
export const INVITE_RE = /^[A-Za-z0-9_-]{20,700}\.[A-Za-z0-9_-]{32}$/;

const secret = () => process.env.NEXTAUTH_SECRET || "";
export const inviteConfigured = () => secret().length > 0;
const key = () => crypto.createHmac("sha256", secret()).update("kcare-invite-v1").digest();
const sign = (payload) => crypto.createHmac("sha256", key()).update(payload).digest("base64url").slice(0, 32);
const encKey = () => crypto.createHmac("sha256", secret()).update("kcare-invite-enc-v1").digest();
// 서버만 풀 수 있게 — AES-256-GCM (iv 12 · tag 16 · 본문)
function seal(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", encKey(), iv);
  const body = Buffer.concat([c.update(String(text || ""), "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]).toString("base64url");
}
function unseal(s) {
  try {
    const b = Buffer.from(String(s || ""), "base64url");
    if (b.length < 29) return "";
    const d = crypto.createDecipheriv("aes-256-gcm", encKey(), b.subarray(0, 12));
    d.setAuthTag(b.subarray(12, 28));
    return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString("utf8");
  } catch (_) {
    return "";
  }
}

// 새 초대 — from: 만든 계정 id · fromName: 그 사람 이름 · center: C1~C3
export function makeInvite({ center, from, fromName, fromRole }) {
  const body = {
    v: 1,
    c: center,
    f: seal(String(from || "").slice(0, 60)),
    n: String(fromName || "").slice(0, 20),
    w: fromRole === "guardian" ? "guardian" : "elder",
    r: "guardian",
    e: Date.now() + INVITE_DAYS * 86400000,
    j: crypto.randomBytes(9).toString("base64url"),
  };
  const payload = Buffer.from(JSON.stringify(body)).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, exp: body.e, jti: body.j };
}

// 초대 확인 — { ok, invite } | { ok: false, error: bad | expired }. invite.from 은 서버 안에서만 쓴다 (화면에 싣지 않는다)
export function readInvite(token) {
  const t = String(token || "");
  if (!inviteConfigured() || !INVITE_RE.test(t)) return { ok: false, error: "bad" };
  const [payload, sig] = t.split(".");
  const want = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return { ok: false, error: "bad" };
  let body;
  try {
    body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch (_) {
    return { ok: false, error: "bad" };
  }
  if (!body || body.v !== 1 || !CENTERS[body.c] || body.r !== "guardian" || typeof body.e !== "number" || typeof body.j !== "string") return { ok: false, error: "bad" };
  if (body.e < Date.now()) return { ok: false, error: "expired" };
  const from = unseal(body.f);
  if (!from) return { ok: false, error: "bad" };
  return { ok: true, invite: { center: CENTERS[body.c], from, fromName: body.n, fromRole: body.w, role: body.r, exp: body.e, jti: body.j } };
}
