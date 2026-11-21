import { Suspense } from "react";
import RafflePage from "@/components/raffle/RafflePage";

const TITLE = "XRP SEOUL 2026 래플 · 5 XRP 응모 - Wellbian";
const DESC = "5 XRP 로 응모하고 XRP SEOUL 2026(10/3 서울) 초대권·Weather Data Token Generator™·굿즈를 받아 가세요. 응모하면 래플 NFT 가 지갑으로 발급됩니다.";
export const metadata = {
  title: TITLE,
  description: DESC,
  /* 링크 카드(X 공유 버튼·텔레그램) - 히어로의 경품 예상도를 쓴다. metadataBase(layout) 가 wellbian.io 라 상대 경로면 된다. */
  openGraph: { title: TITLE, description: DESC, type: "website", images: [{ url: "/assets/raffle/hero.webp", width: 2000, height: 1131 }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: ["/assets/raffle/hero.webp"] },
};

/* /event/xrpl-seoul - 9/17 12:00 KST 시작. 판매 페이지와 완전히 분리된 이벤트 페이지(2026-09-16 지시).
   먼저 임시로 열어 확인한 뒤 메인·내비에 연결한다. */
export default function XrplSeoulRafflePage() {
  return (
    <Suspense>
      <RafflePage mode="prod" />
    </Suspense>
  );
}
