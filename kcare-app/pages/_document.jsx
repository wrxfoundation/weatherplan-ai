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
        {/* 아이콘을 선언하지 않으면 크롬이 /favicon.ico 를 알아서 찾고, 없으니 404 가 난다.
            브라우저 빌드마다 그 요청을 보내는 시점이 달라서 CI 스모크가 들쭉날쭉 깨졌다. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 웹폰트 — globals.css 의 @import 에서 옮겨 왔다 (렌더 차단 제거).
            display=swap 이라 폰트가 늦어도 시스템 폰트로 먼저 그린다. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Montserrat:wght@500;600;700;800&display=swap"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
