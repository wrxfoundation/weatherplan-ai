// 로그인 — 화면 쪽 도우미.
//
// 켜짐 여부는 빌드 때 정해진다 (next.config.js 가 환경변수가 있는지만 보고 "1" 을 넣는다 ·
// 키 값 자체는 브라우저로 나가지 않는다). 키를 넣거나 바꾸면 재배포해야 반영된다.
//   AUTH_ENABLED    로그인이 하나라도 켜져 있다 — 꺼져 있으면 SessionProvider 를 띄우지 않는다
//   GOOGLE_ENABLED  실제 구글 로그인
//   TEST_LOGIN      테스트 계정 로그인 (구글이 꺼져 있으면 구글 버튼은 시뮬레이션으로 간다)
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";

export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "1";
export const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1";
export const TEST_LOGIN = process.env.NEXT_PUBLIC_TEST_LOGIN === "1";
// 구글 버튼이 시뮬레이션으로 가는지 — 실제 구글이 꺼져 있고 테스트 로그인이 켜져 있을 때
export const GOOGLE_SIMULATED = !GOOGLE_ENABLED && TEST_LOGIN;

const OFF = { enabled: false, status: "unauthenticated", user: null };

export function AuthProvider({ children }) {
  if (!AUTH_ENABLED) return children;
  return <SessionProvider refetchOnWindowFocus={false}>{children}</SessionProvider>;
}

// user: { id, name, email, provider("test"|"google-sim"|"google"), role, household }
export function useAuth() {
  if (!AUTH_ENABLED) return OFF;
  // AUTH_ENABLED 는 빌드 때 고정되는 상수라 렌더마다 같은 경로를 탄다 — 훅 호출 순서가 바뀌지 않는다
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data, status } = useSession();
  return { enabled: true, status, user: data?.user || null };
}

// 돌아올 주소는 이 사이트 안의 경로만 받는다 — 외부 주소로 튕겨 나가는 것을 막는다.
// 브라우저는 역슬래시를 슬래시로 읽고 탭·줄바꿈을 지운다 — "/\evil.com" 이 "//evil.com" 이 되므로 함께 막는다.
export const safeCallback = (v, fallback = "/") => {
  const s = typeof v === "string" ? v : "";
  if (!s.startsWith("/") || s.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(s)) return fallback;
  return s;
};

// 'Google 계정으로 계속하기' — 실제 구글이면 구글로, 아니면 시뮬레이션 화면으로
export function googleStart(callbackUrl = "/") {
  const cb = safeCallback(callbackUrl);
  if (GOOGLE_ENABLED) return signIn("google", { callbackUrl: cb });
  window.location.assign(`/login/google?callbackUrl=${encodeURIComponent(cb)}`);
  return Promise.resolve();
}

// 테스트 계정 로그인 — 화면을 떠나지 않고 결과만 받는다 ({ ok, error })
export async function testSignIn({ id, password, via = "test" }) {
  const r = await signIn("test", { redirect: false, id, password, via });
  return { ok: !!r?.ok && !r?.error, error: r?.error || null };
}

export const logout = (callbackUrl = "/") => signOut({ callbackUrl: safeCallback(callbackUrl) });

export const PROVIDER_LABEL = { test: "테스트 아이디", "google-sim": "Google (시뮬레이션)", google: "Google" };

// 구글 로그인 버튼용 로고 (Google 브랜드 가이드의 4색 G). 외부 이미지를 불러오지 않도록 인라인으로 둔다.
export function GoogleMark({ size = 18 }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
