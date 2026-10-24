/* 개요 — 지금 얼마나 · 언제 · 어디서 · 어느 링크 (텔레봇 /traffic 본문, 9/8)
   하위 페이지 /sources 가 세션 소스 × 날짜와 원자료를 맡는다(9/26). */
import { redirect } from "next/navigation";
import Nav from "./Nav";
import Gate from "./Gate";
import Overview from "./Overview";
import { NotConnected, ReadError } from "./Problem";
import { gaTraffic, gaReady } from "@/lib/ga";
import { passed } from "@/lib/gate";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  /* 키가 붙은 링크로 왔으면 쿠키로 바꿔 주고 주소를 깨끗하게 — lib/gate.ts */
  if (sp.k) redirect(`/enter?k=${encodeURIComponent(sp.k)}&next=/`);
  if (!(await passed())) return <Gate next="/" wrong={sp.e === "1"} />;

  const snap = await gaTraffic();
  return (
    <>
      <Nav current="home" sub={`wellbian.io · GA4 · ${snap.since} 부터 · 5분마다 갱신`} />
      <main className="wrap" style={{ paddingBottom: 72 }}>
        {!gaReady() ? <NotConnected /> : snap.error ? <ReadError msg={snap.error} /> : <Overview snap={snap} />}
      </main>
    </>
  );
}
