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

// 구글 로그인이 설정됐는지 — 키 세 개가 다 있으면 "1". 값은 브라우저로 나가지 않고 켜짐 여부만 나간다.
// 빌드 때 정해지므로 키를 넣거나 바꾸면 재배포해야 한다 (lib/auth.js).
const AUTH_ENABLED =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.NEXTAUTH_SECRET ? "1" : "";

// CSP — 민감 프로필을 다루는 앱: 허용 출처를 명시적으로 한정한다.
// 외부 허용은 폰트(Google Fonts) · 지도 타일(OSM·CARTO) · 결제(토스페이먼츠)뿐 · 그 외 전부 자기 출처.
// 'unsafe-inline'은 Next Pages Router 런타임 인라인 스크립트/스타일 때문에 필요 (eval 불허).
//
// 토스페이먼츠: SDK 가 js.tosspayments.com 에서 스크립트를 받아 결제위젯을 iframe 으로 그리고
// 토스 서버와 통신한다. 전에는 script·connect·frame 이 전부 'self' 라 배포 환경에서 결제창이
// 뜨지 않았다 (2026-09-30 발견 · 작업 환경은 토스 호스트가 막혀 있어 드러나지 않았다).
// 구글 로그인은 이동(리디렉션)으로만 오가므로 여기 추가할 것이 없다 — 프로필 사진도 쓰지 않는다.
const TOSS = "https://*.tosspayments.com";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${TOSS}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com ${TOSS}`,
  // 히어로 루프 영상 — 자기 출처만. default-src로도 이미 같은 결과지만,
  // 나중에 default-src가 넓어져도 영상 출처는 따라 넓어지지 않게 못 박아 둔다.
  "media-src 'self'",
  `connect-src 'self' ${TOSS}`,
  `frame-src ${TOSS}`,
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${TOSS}`,
  "frame-ancestors 'none'",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Next 의 자동 폰트 최적화를 끈다. 켜 두면 _document 의 Google Fonts <link> 를
  // 빌드 때 받아 와 HTML 안에 <style> 로 박아 넣는데, Noto Sans KR 은 한글 서브셋이
  // 많아 @font-face 가 524개 · 349KB 다. 그게 21개 화면 HTML 에 전부 복사되어
  // 페이지당 351KB 가 됐다(측정치). <link> 로 두면 HTML 은 2.5KB, 폰트 CSS 는
  // 한 번 받아 화면 간에 브라우저 캐시로 재사용된다.
  optimizeFonts: false,
  images: { unoptimized: true }, // next/image 미사용 — 이미지 최적화 엔드포인트 표면 축소
  env: {
    NEXT_PUBLIC_BRAND_LOGO: BRAND_LOGO,
    NEXT_PUBLIC_BRAND_LOGO_DARK: BRAND_LOGO_DARK,
    NEXT_PUBLIC_AUTH_ENABLED: AUTH_ENABLED,
  },
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
