import "../styles/globals.css";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#14443B" />
        <meta name="description" content="국내 최초·최대 날씨 기반 광고 AI. 케이웨더 60일 예보 + 100+ 시그널로 카피·예산·타이밍·매체를 추천합니다." />
        <meta property="og:title" content="Weather Plan AI · 케이웨더" />
        <meta property="og:description" content="질문 한 줄로, 상품이 더 팔리는 광고. 국내 최초·최대 날씨 기반 광고 AI." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://weatherplan.kweather.co.kr" />
        <meta property="og:locale" content="ko_KR" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
