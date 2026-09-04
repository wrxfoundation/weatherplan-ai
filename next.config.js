/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // SVG inline-image fallback 등 향후 확장 시 사용
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
    ],
  },
  // 정적 리포트(public/reports/*.html)에 확장자 없는 URL 부여.
  // 자산 경로는 상대(geodnet/…)라 /reports/ 기준으로 풀리므로 리라이트해도 그대로 맞습니다.
  async rewrites() {
    return [{ source: "/reports/geodnet", destination: "/reports/geodnet.html" }];
  },
};

module.exports = nextConfig;
