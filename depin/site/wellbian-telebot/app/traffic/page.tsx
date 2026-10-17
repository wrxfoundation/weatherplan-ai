/* 키 없이 보는 유입 화면 (9/8 서우 — "별도 키값 없이 접속 가능하게 해줘")

   관리 화면(/admin/traffic)과 본문이 같다. 다른 것은 셋 —
     · 키를 묻지 않는다. 대신 관리 메뉴·닫기 버튼이 없어 여기서 다른 화면으로 못 간다.
     · 오류는 원문을 보여주지 않는다 — 환경변수 이름 같은 내부 사정이 밖으로 나갈 이유가 없다.
     · 검색엔진 색인을 막는다(noindex). 주소를 아는 사람만 본다.

   보여주는 것은 GA 집계 숫자뿐이다 — 개인정보도, 예약자 수도, 매출도 없다.
   그래도 공개 채널(X·텔레그램 공지)에 주소를 올리지는 않는다 — 파트너·투자자에게 직접 건네는 용도다.
   닫아야 하면 Vercel 에 TRAFFIC_PUBLIC=off. */

import { notFound } from "next/navigation";
import { gaTraffic, gaReady, trafficPublic } from "@/lib/ga";
import TrafficView from "./TrafficView";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "wellbian 유입",
  description: "wellbian.io 유입 현황 — GA4 집계",
  robots: { index: false, follow: false },
};

export default async function PublicTraffic() {
  if (!trafficPublic()) notFound();
  const snap = await gaTraffic();

  return (
    <>
      <header className="top">
        <div className="wrap top-in">
          <span className="brand">wellbian 유입</span>
          <span className="brand-sub">wellbian.io · GA4 · {snap.since} 부터 · 5분마다 갱신</span>
        </div>
      </header>
      <main className="wrap" style={{ paddingBottom: 72 }}>
        {!gaReady() ? (
          <div className="notice" style={{ marginTop: 18 }}>아직 GA4 가 연결되지 않았습니다.</div>
        ) : snap.error ? (
          <div className="notice" style={{ marginTop: 18 }}>지금은 GA4 를 읽을 수 없습니다. 몇 분 뒤 다시 열어 주세요.</div>
        ) : (
          <TrafficView snap={snap} variant="public" />
        )}
      </main>
    </>
  );
}
