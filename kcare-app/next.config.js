/** @type {import('next').NextConfig} */

// 로고 자동 감지 — public/brand/ 에 파일을 넣으면 켜지고 없으면 글자 로고로 둔다.
// 여기서 확인하는 이유: 화면마다 getStaticProps 를 넣을 수는 없고(콘솔 화면은
// 아예 안 쓴다), 런타임에 이미지 로드를 시도하면 없을 때 404 가 화면마다 남는다.
// next.config.js 는 빌드 시점에 Node 로 돌아가므로 여기서 한 번만 보면 된다.
const fs = require("fs");
const path = require("path");
const pick = (stem) =>
  ["svg", "webp", "png"]
    .map((e) => (fs.existsSync(path.join(__dirname, "public", "brand", `${stem}.${e}`)) ? `/brand/${stem}.${e}` : null))
    .find(Boolean) || "";
const BRAND_LOGO = pick("logo");
// 어두운 배경 전용 파일. 없으면 밝은 배경용을 흰색으로 반전해 쓴다 — 단색 로고면
// 그걸로 충분하지만, K-CARE 로고처럼 2색이면 두 색이 같은 흰색이 되어 심볼이
// 한 덩어리로 뭉친다. 그래서 어두운 배경용을 따로 둔다.
const BRAND_LOGO_DARK = pick("logo-dark");

// CSP — 민감 프로필을 다루는 앱: 허용 출처를 명시적으로 한정한다.
// 외부 허용은 폰트(Google Fonts)와 지도 타일(OSM·CARTO)뿐 · 그 외 전부 자기 출처.
// 'unsafe-inline'은 Next Pages Router 런타임 인라인 스크립트/스타일 때문에 필요 (eval 불허).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
  // 히어로 루프 영상 — 자기 출처만. default-src로도 이미 같은 결과지만,
  // 나중에 default-src가 넓어져도 영상 출처는 따라 넓어지지 않게 못 박아 둔다.
  "media-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true }, // next/image 미사용 — 이미지 최적화 엔드포인트 표면 축소
  env: { NEXT_PUBLIC_BRAND_LOGO: BRAND_LOGO, NEXT_PUBLIC_BRAND_LOGO_DARK: BRAND_LOGO_DARK },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // 데모 빌드 — 유사 개인정보(목 데이터)가 검색엔진에 색인되지 않게
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        // API 응답은 어디에도 캐시하지 않는다 (민감 컨텍스트 포함 가능)
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
