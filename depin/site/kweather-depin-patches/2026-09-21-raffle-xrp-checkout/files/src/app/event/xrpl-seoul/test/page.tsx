import { Suspense } from "react";
import RafflePage from "@/components/raffle/RafflePage";

export const metadata = {
  title: "[TEST] XRP SEOUL 2026 래플 리허설 - Wellbian",
  robots: { index: false, follow: false },
};

/* /event/xrpl-seoul/test - 래플 리허설. /launch/test 와 같은 격리 원칙: 로그인·지갑·온체인 발행은 실제,
   event(xrpseoul-2026-test)·NFT kind/taxon(900014)·설정 키(raffle_xrpseoul_test)는 실제와 절대 겹치지 않는다.
   결제는 실제와 같은 5 XRP 다. */
export default function XrplSeoulRaffleTestPage() {
  return (
    <>
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "#c0392b", color: "#fff", textAlign: "center", fontSize: 13.5, fontWeight: 800, letterSpacing: ".04em", padding: "8px 12px" }}>
        래플 리허설 페이지 (실제 이벤트 아님) · 로그인·지갑·NFT 발행은 실제로 진행되며 응모 기록은 테스트 장부에 저장됩니다. 응모 금액은 실제와 동일한 5 XRP 이며, 리허설 입금은 종료 후 반환됩니다. 리허설은 응모 시작 시각만 앞당긴 것으로, 실제 응모 시작은 9월 22일(화) 18:00 입니다.
      </div>
      <Suspense>
        <RafflePage mode="test" />
      </Suspense>
    </>
  );
}
