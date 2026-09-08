/* GA4 유입 — 관리자 화면 (9/8 서우 — "GA 분석 대시보드도 같이 연동 못 붙이나" → 같은 날 2차
   "이해하기 쉽게 일목요연하게, 그래프도 넣어서 일자별 주차별 월간별 채널별, 별도 키값 없이")

   본문은 app/traffic/TrafficView.tsx — 공개 화면(/traffic)과 같은 것을 본다. 이 파일이 더 갖는 것은
   관리 메뉴, 오류 원문(어느 변수·어느 단계가 틀렸는지), 공개 주소 안내뿐이다.

   1차의 기간 칩(오늘·7일·런치 이후)은 없앴다 — 일·주·월 탭이 그 자리를 대신하고, 오늘·이번 주는
   숫자 칸으로 늘 보인다. */

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAuthed } from "@/lib/auth";
import Nav from "../Nav";
import { gaTraffic, gaReady, gaMissing, trafficPublic } from "@/lib/ga";
import TrafficView from "../../traffic/TrafficView";

export const dynamic = "force-dynamic";

export default async function Traffic({
  searchParams,
}: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  if (!(await isAuthed(sp.k))) redirect("/");
  const k = (await isAuthed()) ? "" : (sp.k ?? "");

  const snap = await gaTraffic();
  const host = (await headers()).get("host") ?? "";
  const pub = host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}/traffic` : "/traffic";

  return (
    <>
      <Nav k={k} current="traffic" title="유입" sub={<>wellbian.io · GA4 · {snap.since} 부터</>} />

      <main className="wrap" style={{ paddingBottom: 72 }}>
        {!gaReady() ? (
          <div className="notice" style={{ marginTop: 18, lineHeight: 1.7 }}>
            <b>GA4 가 아직 연결되지 않았습니다</b>{gaMissing() ? <> — 비어 있는 변수: <span className="mono">{gaMissing()}</span></> : null}
            <ol style={{ margin: "10px 0 0 18px", padding: 0 }}>
              <li>GA 전용 Google Cloud 프로젝트(판매 사이트 로그인이 쓰는 프로젝트가 아닌 것)에서 <b>Google Analytics Data API</b> 사용 설정</li>
              <li>Google 인증 플랫폼 → 대상 <b>내부</b> · 클라이언트 <b>웹 애플리케이션</b>(리디렉션 URI 에 OAuth Playground)</li>
              <li>OAuth Playground 톱니에 그 클라이언트 ID·보안 비밀 → 스코프 <span className="mono">analytics.readonly</span> → GA 속성 소유자 계정으로 동의 → 리프레시 토큰</li>
              <li>Vercel 환경변수 <span className="mono">GA_PROPERTY_ID · GA_OAUTH_CLIENT_ID · GA_OAUTH_CLIENT_SECRET · GA_OAUTH_REFRESH_TOKEN</span> → <b>Redeploy</b></li>
            </ol>
            <p style={{ margin: "12px 0 0", color: "var(--ink-3)" }}>서비스 계정 키를 만들 수 있는 조직이면 그 길도 됩니다. 둘 다 README 의 GA 절차에 있습니다.</p>
          </div>
        ) : snap.error ? (
          <div className="notice" style={{ marginTop: 18 }}>
            GA4 를 읽지 못했습니다 — <span className="mono">{snap.error}</span>
          </div>
        ) : (
          <>
            {trafficPublic() ? (
              <div className="tf-pub">
                키 없이 보는 주소 — <span className="mono">{pub}</span> · 이 화면과 같은 내용을 관리 메뉴 없이 보여줍니다.
                파트너·투자자에게 직접 건네는 용도이고, 공개 채널에는 올리지 않습니다. 닫으려면 Vercel 에 <span className="mono">TRAFFIC_PUBLIC=off</span>.
              </div>
            ) : (
              <div className="tf-pub">공개 주소(/traffic)는 <span className="mono">TRAFFIC_PUBLIC=off</span> 로 닫혀 있습니다.</div>
            )}
            <TrafficView snap={snap} variant="admin" />
          </>
        )}
      </main>
    </>
  );
}
