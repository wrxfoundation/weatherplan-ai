/* 문 — 열어 둘지 잠글지 (9/26)

   기본은 열려 있다. 텔레봇 /traffic 과 같은 선이다(9/8 서우 — "별도 키값 없이 접속 가능하게") —
   보이는 것은 GA 집계 숫자뿐이고 개인정보·예약자 수·매출은 없다. 검색엔진 색인은 막아 둔다.

   잠가야 할 일이 생기면 Vercel 에 TRAFFIC_KEY 를 넣는다. 그다음부터는 키를 한 번 넣으면(또는 ?k= 가
   붙은 주소로 들어오면) 30일짜리 쿠키가 걸리고 주소는 깨끗해진다. 쿠키에는 키 자체가 아니라 해시를
   담는다 — 쿠키가 새어도 키는 안 샌다. 키를 바꾸면 기존 쿠키는 전부 무효가 된다. */

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "wt_key";
const KEY = process.env.TRAFFIC_KEY ?? "";
const digest = (v: string) => createHash("sha256").update(`wellbian-traffic:${v}`).digest("hex");
const same = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const gated = () => Boolean(KEY);
export const keyOk = (k: string | null | undefined) => Boolean(KEY && k && same(digest(k), digest(KEY)));
export const cookieValue = () => digest(KEY);

/* 들어와도 되는가 — 키가 없으면 늘 된다. 있으면 ?k= 가 맞거나 쿠키가 맞아야 한다. */
export const passed = async (k?: string | null) => {
  if (!KEY) return true;
  if (keyOk(k)) return true;
  const c = (await cookies()).get(COOKIE)?.value;
  return Boolean(c && same(c, digest(KEY)));
};

/* 돌아갈 주소는 이 사이트 안의 경로만 — 밖으로 튕기는 데 쓰이지 않게 */
export const safeNext = (v: string | null | undefined) =>
  v && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : "/";
