import "./globals.css";
import type { Metadata } from "next";

/* 텔레봇에서 떼어 낸 유입 사이트 (9/26 서우 — "텔레봇 말고 그냥 스핀오프해서 하위 페이지 만들어서 배포하게끔 해줘").
   주소를 아는 사람만 본다 — 검색엔진 색인은 막는다(robots.ts 도 같은 말을 한다). */
export const metadata: Metadata = {
  title: { default: "wellbian 유입", template: "%s · wellbian 유입" },
  description: "wellbian.io 유입 현황 — GA4 집계",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 판매 사이트와 같은 서체 — 같은 제품으로 읽히게 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
