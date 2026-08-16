import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        {/* 바탕화면 바로가기 — SOS 를 홈 화면 아이콘에서 바로 누르게 한다
            (2026-08-12 어르신화면 시트 전체 요청 3번).
            안드로이드 크롬: 아이콘 길게 누르면 shortcuts 가 뜬다.
            iOS 사파리: manifest shortcuts 를 지원하지 않으므로 /elder?sos=1 자체를
            '홈 화면에 추가'해야 같은 동작이 된다. */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0A1F3C" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
