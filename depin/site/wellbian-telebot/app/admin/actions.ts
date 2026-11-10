"use server";

/* 화면마다 따로 있던 "닫기"를 한 곳으로. 메뉴가 공용 컴포넌트(Nav)가 되면서 닫기도 같이 왔다 —
   파일 맨 위에 "use server" 를 둔 모듈에서 내보내면 어느 화면의 form 에도 걸 수 있다. */

import { redirect } from "next/navigation";
import { clearAuthCookie } from "@/lib/auth";

export async function logout() {
  await clearAuthCookie();
  redirect("/");
}
