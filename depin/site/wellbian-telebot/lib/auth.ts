/* 접근 확인 한 곳 (8/30 서우 — "배포하면 화면도 보이게")

   키를 주소에 붙여 다니는 방식은 두 가지가 나빴다. 링크를 누를 때마다 k= 를 이어 붙여야
   해서 코드가 지저분해지고, 무엇보다 주소창과 방문 기록에 키가 그대로 남는다.
   한 번 확인하면 쿠키에 담아 두고 그다음부터는 주소를 깨끗하게 쓴다.

   기존 ?k= 도 계속 받는다 — 이미 그렇게 저장해 둔 링크가 있고, 쿠키를 못 쓰는
   상황(브라우저 설정·시크릿 창)에서 들어올 길을 막을 이유가 없다. */

import { cookies } from "next/headers";

export const COOKIE = "wb_admin";
export const ADMIN_KEY = process.env.ADMIN_KEY ?? "";

export const isAuthed = async (queryKey?: string) => {
  if (!ADMIN_KEY) return false;
  if (queryKey && queryKey === ADMIN_KEY) return true;
  return (await cookies()).get(COOKIE)?.value === ADMIN_KEY;
};

export const setAuthCookie = async () => {
  (await cookies()).set(COOKIE, ADMIN_KEY, {
    httpOnly: true,
    sameSite: "lax",
    /* 로컬은 http 라 secure 를 켜면 쿠키가 아예 안 걸린다 */
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
};

export const clearAuthCookie = async () => {
  (await cookies()).delete(COOKIE);
};
