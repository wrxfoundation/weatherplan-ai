// 구글 로그인 (NextAuth v4 · Google 제공자 · JWT 세션 — DB 없이 동작한다).
//
// 콜백 주소는 {NEXTAUTH_URL}/api/auth/callback/google 이다. Google 콘솔의 '승인된 리디렉션 URI'에
// 이 주소를 그대로 넣어야 한다 (DEPLOY.md 3단계).
// 키가 없으면 NextAuth 를 띄우지 않고 503 을 돌려준다 — 화면은 '설정 전' 안내를 보여 준다.
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { authConfigured, isAllowedEmail } from "../../../lib/auth-server";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7일
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    // 구글이 이메일을 확인한 계정만 · 허용 목록이 있으면 그 안에서만
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") return false;
      if (profile && profile.email_verified === false) return false;
      if (!isAllowedEmail(user?.email || profile?.email)) return "/login?error=NotAllowed";
      return true;
    },
    // 세션에는 이름과 이메일만 싣는다 — 사진 주소·구글 토큰은 브라우저로 내려보내지 않는다
    async session({ session, token }) {
      return {
        expires: session.expires,
        user: { name: token.name || null, email: token.email || null },
      };
    },
  },
};

export default function handler(req, res) {
  if (!authConfigured()) {
    return res.status(503).json({ error: "auth-not-configured" });
  }
  return NextAuth(req, res, authOptions);
}
