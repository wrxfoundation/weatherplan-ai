import { Suspense } from "react";
import Landing from "@/components/Landing";

/* `/` 판매 랜딩 (1a/1j) — ?state=eb_closed | sold_out 내부 상태 변형 (PRD §3) */
export default function Page() {
  return (
    <Suspense>
      <Landing />
    </Suspense>
  );
}
