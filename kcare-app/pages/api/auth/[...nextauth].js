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
import {
  authConfigured,
  centerOpsPassword,
  googleConfigured,
  isAllowedEmail,
  memberLoginConfigured,
  testLoginConfigured,
  testPasswordMatches,
} from "../../../lib/auth-server";
import { recordLogin } from "../../../lib/db";
import { findCenterOps, findTestAccount } from "../../../lib/test-accounts";
import { CENTERS, areaOfRole, centerOfHousehold, isArea } from "../../../lib/centers";
import { loginFailed, loginSucceeded, memberForLogin } from "../../../lib/members";
import { sameSecret, verifyPassword } from "../../../lib/password";
import { clientIp, makeLimiter } from "../../../lib/http";

const slow = () => new Promise((r) => setTimeout(r, 600));
// 로그인 창에 돌려주는 이유 코드 — 비밀번호가 맞은 뒤에만 알려 준다 (아이디가 있는지 떠볼 수 없게).
// 예외: 잠금(Locked)은 비밀번호를 보기 전에 알린다 — 잠긴 동안에는 맞는지 틀린지도 알려 주지 않는다.
const reject = (code) => {
  throw new Error(code);
};
// 한꺼번에 두드리기 막기 — 같은 아이디 10분에 20번 · 같은 곳(IP) 10분에 200번 (서버 인스턴스마다).
// IP 한도는 한 사무실 와이파이에서 테스터 여럿이 함께 로그인해도 걸리지 않을 만큼 넉넉히 —
// 비밀번호 맞히기는 아이디별 한도와 DB 잠금(5번 틀리면 · lib/members.js loginFailed)이 막는다
const perId = makeLimiter({ windowMs: 10 * 60 * 1000, max: 20 });
const perIp = makeLimiter({ windowMs: 10 * 60 * 1000, max: 200 });

// 회원 로그인 (2026-10-06) — 가입 화면에서 만든 아이디 · 비밀번호. 영역(user · partner · ops) 입구가 맞아야 한다.
// 센터 관리자(ops1~3 · CENTER_OPS_PASSWORD)와 공용 비밀번호 테스트 계정도 이 창으로 들어올 수 있다.
async function authorizeMember(credentials, req) {
  const id = String(credentials?.id || "").trim().toLowerCase();
  const password = String(credentials?.password || "");
  const area = isArea(credentials?.area) ? credentials.area : null;
  if (!id || !password || !area) return null;
  if (perId(id) || perIp(clientIp(req || { headers: {} }))) reject("Locked");

  const ops = findCenterOps(id);
  if (ops) {
    const want = centerOpsPassword(ops.center);
    if (!want || !sameSecret(password, want)) {
      await slow();
      return null;
    }
    if (area !== "ops") reject("WrongArea:ops");
    return { id: ops.id, name: ops.name, email: ops.email, role: ops.role, household: ops.household, center: ops.center, provider: "center" };
  }
  const t = findTestAccount(id);
  if (t) {
    if (!testLoginConfigured() || !testPasswordMatches(password)) {
      await slow();
      return null;
    }
    if (areaOfRole(t.role) !== area) reject(`WrongArea:${areaOfRole(t.role) || ""}`);
    return { id: t.id, name: t.name, email: t.email, role: t.role, household: t.household, center: null, provider: "test" };
  }
  let m = null;
  try {
    m = await memberForLogin(id);
  } catch (_) {
    reject("ServerDown");
  }
  if (m?.locked_until && Date.parse(m.locked_until) > Date.now()) {
    await slow();
    reject("Locked");
  }
  const ok = await verifyPassword(password, m?.password_hash);
  if (!m || !ok) {
    if (m?.password_hash) await loginFailed(m.id);
    await slow();
    return null;
  }
  await loginSucceeded(m.id);
  if (m.status === "pending") reject("Pending");
  if (m.status === "rejected") reject("Rejected");
  if (m.status !== "active") reject("Suspended");
  if (areaOfRole(m.role) !== area) reject(`WrongArea:${areaOfRole(m.role) || ""}`);
  const center = CENTERS[m.center_id];
  if (!center) reject("NoCenter");
  return { id: m.id, name: m.name, email: null, role: m.role, household: center.household, center: center.id, provider: "member" };
}

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
  if (memberLoginConfigured()) {
    list.push(
      CredentialsProvider({
        id: "member",
        name: "회원",
        credentials: { id: { label: "아이디" }, password: { label: "비밀번호", type: "password" }, area: {} },
        authorize: authorizeMember,
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
      if (account?.provider === "test" || account?.provider === "member") return true; // 비밀번호는 authorize 에서 이미 봤다 (센터 관리자도 member 창)
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
        token.center = google ? null : user.center || centerOfHousehold(user.household)?.id || null;
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
          center: token.center || null,
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
