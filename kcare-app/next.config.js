/** @type {import('next').NextConfig} */

// CSP — 민감 프로필을 다루는 앱: 허용 출처를 명시적으로 한정한다.
// 외부 허용은 폰트(Google Fonts)와 지도 타일(OSM·CARTO)뿐 · 그 외 전부 자기 출처.
// 'unsafe-inline'은 Next Pages Router 런타임 인라인 스크립트/스타일 때문에 필요 (eval 불허).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com",
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
