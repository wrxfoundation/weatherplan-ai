import "leaflet/dist/leaflet.css";
import "../styles/globals.css";
import Head from "next/head";
import { AppStateProvider } from "../lib/state";
import Boundary from "../components/Boundary";

export default function App({ Component, pageProps }) {
  return (
    <>
      {/*
        Head는 AppStateProvider "밖"에 둔다 —
        프로바이더는 하이드레이션 불일치를 막으려고 마운트 전까지 children을 렌더하지 않는데,
        그 안에 있으면 서버 HTML에 메타 태그가 아예 실리지 않는다 (모바일에서 첫 페인트가 기본 배율로 뜬다).
      */}
      <Head>
        {/* 확대는 막지 않는다 — 어르신 · 보호자 접근성 (maximum-scale=1 금지) */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0A1F3C" />
        {/* 파비콘이 없어 모든 화면에서 /favicon.ico 404 가 났다 (스모크가 잡음).
            임시 마크이므로 정식 로고를 받으면 교체한다. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="color-scheme" content="light" />
        <meta name="format-detection" content="telephone=no" />
        {/* 홈 화면에 추가했을 때 앱처럼 보이게 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="K-CARE" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* 기본 제목 — 각 페이지의 Head가 하이드레이션 후 덮어쓴다 */}
        <title>K-CARE</title>
      </Head>
      {/* 한 화면이 터져도 흰 화면 대신 안내가 뜨게 — 시연 사고 방지 */}
      <Boundary>
        <AppStateProvider>
          <Component {...pageProps} />
        </AppStateProvider>
      </Boundary>
    </>
  );
}
