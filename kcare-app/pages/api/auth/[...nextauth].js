// 로그인 (NextAuth v4 · JWT 세션 — 세션 자체는 DB 없이 동작한다).
//
// 제공자 두 개:
//   test    테스트 계정 (lib/test-accounts.js) + 공용 비밀번호 BETA_TEST_PASSWORD.
//           구글 설정 전에는 'Google 계정으로 계속하기' 시뮬레이션(/login/google)도 이 제공자로
//           들어온다 (via=google-sim) — 세션에 provider 가 google-sim 으로 남아 구별된다.
//   google  실제 구글 로그인. 콜백 주소는 {NEXTAUTH_URL}/api/auth/callback/google 이다.
//           Google 콘솔의 '승인된 리디렉션 URI'에 이 주소를 그대로 넣어야 한다 (DEPLOY.md 3단계).
// 둘 다 설정이 없으면 NextAuth 를 띄우지 않고 503 을 돌려준다 — 화면은 '설정 전' 안내를 보여 준다.
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { authConfigured, googleConfigured, isAllowedEmail, testLoginConfigured, testPasswordMatches } from "../../../lib/auth-server";
import { recordLogin } from "../../../lib/db";
import { findTestAccount } from "../../../lib/test-accounts";

function providers() {
  const list = [];
  if (testLoginConfigured()) {
    list.push(
      CredentialsProvider({
        id: "test",
        name: "테스트 계정",
        credentials: { id: { label: "아이디" }, password: { label: "비밀번호", type: "password" }, via: {} },
        async authorize(credentials) {
          const acct = findTestAccount(credentials?.id);
          if (!acct || !testPasswordMatches(credentials?.password)) {
            // 틀렸을 때 바로 답하지 않는다 — 비밀번호를 빠르게 바꿔 가며 두드리는 것을 늦춘다
            await new Promise((r) => setTimeout(r, 600));
            return null;
          }
          return {
            id: acct.id,
            name: acct.name,
            email: acct.email,
            role: acct.role,
            household: acct.household,
            provider: credentials?.via === "google-sim" && !googleConfigured() ? "google-sim" : "test",
          };
        },
      })
    );
  }
  if (googleConfigured()) {
    list.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      })
    );
  }
  return list;
}

export const authOptions = {
  providers: providers(),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7일
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "test") return true; // 비밀번호는 authorize 에서 이미 봤다
      if (account?.provider !== "google") return false;
      // 구글이 이메일을 확인한 계정만 · 허용 목록이 있으면 그 안에서만
      if (profile && profile.email_verified === false) return false;
      if (!isAllowedEmail(user?.email || profile?.email)) return "/login?error=NotAllowed";
      return true;
    },
    // 로그인하는 순간에만 user 가 들어온다 — 역할·가구·경로를 토큰에 붙여 둔다
    async jwt({ token, user, account }) {
      if (user) {
        const google = account?.provider === "google";
        token.aid = google ? `google:${String(user.email || "").toLowerCase()}` : user.id;
        token.provider = google ? "google" : user.provider || "test";
        token.role = google ? null : user.role || null;
        token.household = google ? null : user.household || null;
      }
      return token;
    },
    // 세션에는 화면에 필요한 것만 싣는다 — 사진 주소·구글 토큰은 브라우저로 내려보내지 않는다
    async session({ session, token }) {
      return {
        expires: session.expires,
        user: {
          id: token.aid || null,
          name: token.name || null,
          email: token.email || null,
          provider: token.provider || null,
          role: token.role || null,
          household: token.household || null,
        },
      };
    },
  },
  events: {
    async signIn({ user, account }) {
      const google = account?.provider === "google";
      await recordLogin({
        aid: google ? `google:${String(user.email || "").toLowerCase()}` : user.id,
        name: user.name,
        email: user.email,
        role: google ? null : user.role,
        household: google ? null : user.household,
        provider: google ? "google" : user.provider || "test",
      });
    },
  },
};

export default function handler(req, res) {
  if (!authConfigured()) {
    return res.status(503).json({ error: "auth-not-configured" });
  }
  return NextAuth(req, res, authOptions);
}
