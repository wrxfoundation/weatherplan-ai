/* GA4 OAuth 리프레시 토큰 한 번 받기 (9/8)

   서비스 계정 키 생성이 조직 정책(iam.disableServiceAccountKeyCreation)으로 막혔을 때 쓰는 길.
   GA 속성 소유자 계정(admin@…)으로 한 번 동의하면 리프레시 토큰이 나오고, 봇은 그걸로
   액세스 토큰을 계속 갱신한다. 키 파일이 없다.

   준비 (Google Cloud 콘솔, 그 프로젝트):
     1 API 및 서비스 › OAuth 동의 화면 — 사용자 유형 **내부**(Workspace 조직이면 고를 수 있다).
       외부+테스트 모드로 두면 리프레시 토큰이 7일마다 죽는다.
     2 사용자 인증 정보 › 사용자 인증 정보 만들기 › OAuth 클라이언트 ID › 유형 **데스크톱 앱**.
       클라이언트 ID·보안 비밀을 받아 둔다.

   실행 (로컬 PC, 브라우저 있는 곳):
     GA_OAUTH_CLIENT_ID=… GA_OAUTH_CLIENT_SECRET=… node tools/ga-oauth.mts
   → 찍히는 주소를 브라우저에서 열고 admin 계정으로 동의 → 이 스크립트가 localhost 로 돌아오는
     콜백을 받아 리프레시 토큰을 출력한다 → 그 값을 Vercel 의 GA_OAUTH_REFRESH_TOKEN 에 넣는다.
     클라이언트 ID·보안 비밀도 같이 넣는다. 셋 다 NEXT_PUBLIC_ 없이. */

import { createServer } from "node:http";

const ID = process.env.GA_OAUTH_CLIENT_ID ?? "";
const SECRET = process.env.GA_OAUTH_CLIENT_SECRET ?? "";
const PORT = Number(process.env.PORT ?? 8787);
const REDIRECT = `http://localhost:${PORT}/cb`;
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

if (!ID || !SECRET) {
  console.error("GA_OAUTH_CLIENT_ID 와 GA_OAUTH_CLIENT_SECRET 을 환경변수로 주세요.");
  process.exit(1);
}

const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
  client_id: ID,
  redirect_uri: REDIRECT,
  response_type: "code",
  scope: SCOPE,
  access_type: "offline",   // 리프레시 토큰을 받으려면 필수
  prompt: "consent",        // 이미 동의한 계정도 리프레시 토큰을 다시 내주게
});

const server = createServer(async (req, res) => {
  const u = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  if (u.pathname !== "/cb") { res.writeHead(404); res.end(); return; }
  const code = u.searchParams.get("code");
  const err = u.searchParams.get("error");
  if (!code) {
    res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end(`동의가 취소됐거나 코드가 없습니다: ${err ?? ""}`);
    return;
  }
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: ID, client_secret: SECRET, redirect_uri: REDIRECT, grant_type: "authorization_code" }),
  });
  const j = (await r.json()) as { refresh_token?: string; error?: string; error_description?: string };
  if (!j.refresh_token) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`토큰 교환 실패: ${j.error ?? ""} ${j.error_description ?? ""}`);
    console.error("실패:", j);
    server.close();
    return;
  }
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("받았습니다. 터미널을 보세요. 이 창은 닫아도 됩니다.");
  console.log("\nGA_OAUTH_REFRESH_TOKEN=" + j.refresh_token + "\n");
  console.log("→ 위 값과 클라이언트 ID·보안 비밀을 Vercel 환경변수에 넣고 Redeploy.");
  server.close();
});

server.listen(PORT, () => {
  console.log("브라우저에서 이 주소를 열어 admin 계정으로 동의하세요:\n\n" + authUrl + "\n\n(콜백을 기다리는 중 — " + REDIRECT + ")");
});
