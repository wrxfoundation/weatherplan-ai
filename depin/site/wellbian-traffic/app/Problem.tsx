/* GA 를 못 읽을 때 보이는 칸 둘.
   · 연결 전 — 무엇을 넣어야 하는지 그대로 보인다(값이 아니라 변수 이름뿐이다).
   · 읽기 실패 — 잠가 둔 사이트(TRAFFIC_KEY)면 키를 가진 사람만 보므로 오류 원문을 보이고, 열린 사이트면
     「잠시 뒤」 한 줄만 보인다. 원문은 어느 쪽이든 Vercel 런타임 로그에 남긴다. */
import { gaMissing } from "@/lib/ga";
import { gated } from "@/lib/gate";

export function NotConnected() {
  const miss = gaMissing();
  return (
    <div className="notice" style={{ marginTop: 18 }}>
      <b>GA4 가 아직 연결되지 않았습니다</b>{miss ? <> — 비어 있는 변수: <span className="mono">{miss}</span></> : null}
      <ol>
        <li>텔레봇 Vercel 프로젝트 › Settings › Environment Variables 에서 <span className="mono">GA_PROPERTY_ID · GA_OAUTH_CLIENT_ID · GA_OAUTH_CLIENT_SECRET · GA_OAUTH_REFRESH_TOKEN</span> 네 값을 확인합니다(같은 GA 속성이라 그대로 씁니다).</li>
        <li>이 프로젝트의 같은 자리에 네 값을 넣고 <b>Redeploy</b> 합니다. 저장만으로는 반영되지 않습니다.</li>
      </ol>
    </div>
  );
}

export function ReadError({ msg }: { msg: string }) {
  console.error("[ga]", msg);
  return (
    <div className="notice" style={{ marginTop: 18 }}>
      {gated()
        ? <>GA4 를 읽지 못했습니다 — <span className="mono">{msg}</span></>
        : "지금은 GA4 를 읽을 수 없습니다. 몇 분 뒤 다시 열어 주세요."}
    </div>
  );
}
