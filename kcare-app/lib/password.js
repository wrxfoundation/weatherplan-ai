// 회원 비밀번호 — 서버(API 라우트)에서만 쓴다. 원문은 저장하지 않고 scrypt 해시만 남긴다.
// 저장 모양: scrypt$N$r$p$소금(base64)$해시(base64) — 나중에 강도를 올려도 예전 해시를 읽을 수 있게 값을 함께 둔다.
import { randomBytes, scrypt, timingSafeEqual } from "crypto";

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 32;

const derive = (pw, salt, n, r, p, len) =>
  new Promise((resolve, reject) =>
    scrypt(String(pw), salt, len, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (e, key) => (e ? reject(e) : resolve(key)))
  );

export async function hashPassword(pw) {
  const salt = randomBytes(16);
  const key = await derive(pw, salt, N, R, P, KEYLEN);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

// 없는 계정에도 같은 시간이 걸리게 — 아이디가 있는지 없는지 응답 시간으로 알 수 없게 한다
const DUMMY = `scrypt$${N}$${R}$${P}$${Buffer.alloc(16).toString("base64")}$${Buffer.alloc(KEYLEN).toString("base64")}`;

export async function verifyPassword(pw, stored) {
  const parts = String(stored || DUMMY).split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, keyB64] = parts;
  const want = Buffer.from(keyB64, "base64");
  try {
    const got = await derive(pw, Buffer.from(saltB64, "base64"), Number(n), Number(r), Number(p), want.length);
    return !!stored && got.length === want.length && timingSafeEqual(got, want);
  } catch (_) {
    return false;
  }
}

export function newJoinCode() {
  // 헷갈리는 글자(0 O 1 I)는 뺀다
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = randomBytes(6);
  return Array.from(b, (x) => A[x % A.length]).join("");
}
