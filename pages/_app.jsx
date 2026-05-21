import "../styles/globals.css";
import Head from "next/head";

const SITE_URL = "https://weatherplan-ai.vercel.app";
const SITE_NAME = "Weather Plan AI";
const SITE_TITLE = "Weather Plan AI · 날씨 기반 광고 AI";
const SITE_DESCRIPTION =
  "국내 최초·최대 날씨 기반 광고 의사결정 AI. 케이웨더 60일 예보 + 100+ 시그널로 카피·예산·타이밍·매체별 입찰을 추천합니다.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "KWeather 디지털사업본부",
  "alternateName": "케이웨더",
  "url": "https://www.kweather.co.kr",
  "logo": `${SITE_URL}/favicon.ico`,
  "description": "국내 최대 민간 기상사업자 · 30,000여개 측정 센서망 · 60일 AI 예보",
  "sameAs": ["https://www.kweather.co.kr"],
};

const PRODUCT_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": SITE_NAME,
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": SITE_URL,
  "description": SITE_DESCRIPTION,
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW",
    "description": "v1.0 베타 기간 무료",
  },
  "creator": {
    "@type": "Organization",
    "name": "KWeather 디지털사업본부",
  },
};

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#14443B" />
        <meta name="format-detection" content="telephone=no" />

        {/* Primary meta */}
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="keywords" content="날씨 광고, 광고 AI, 케이웨더, 60일 예보, 광고 의사결정, 마케팅 AI, 디지털 광고, 날씨 마케팅, weather marketing, KWeather, wellbian, B2B SaaS" />
        <meta name="author" content="KWeather 디지털사업본부" />
        <link rel="canonical" href={SITE_URL} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:locale" content="ko_KR" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Weather Plan AI — 케이웨더 날씨 기반 광고 AI" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* PWA / icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        {/* Search Console verifications (필요 시 환경변수에 토큰 주입) */}
        {process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION && (
          <meta name="naver-site-verification" content={process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION} />
        )}
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
        )}

        {/* Structured data — Organization + SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSONLD) }}
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
