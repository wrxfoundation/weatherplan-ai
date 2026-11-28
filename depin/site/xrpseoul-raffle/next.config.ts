import type { NextConfig } from "next";

/* XRP SEOUL 2026 래플 - 단독 미리보기 앱. 정본(kweather-depin)의 래플 페이지·결제창을 백엔드 없이 띄운다.
   상태(/api/raffle/state)는 시간만 보고 계산한다(시작 전 → D-day 카운트다운 + 버튼 비활성). 로그인·결제는 정본 사이트로 보낸다. */
const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/event/xrpl-seoul/test", destination: "/", permanent: false }];
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ] }];
  },
};

export default nextConfig;
