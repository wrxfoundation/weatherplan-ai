import { Suspense } from "react";
import RafflePage from "@/components/raffle/RafflePage";

/* / 와 /event/xrpl-seoul 둘 다 래플 페이지 - 정본에서는 /event/xrpl-seoul 이다. */
export default function Home() {
  return (
    <Suspense>
      <RafflePage mode="prod" />
    </Suspense>
  );
}
