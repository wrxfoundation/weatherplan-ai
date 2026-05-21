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
};

module.exports = nextConfig;
