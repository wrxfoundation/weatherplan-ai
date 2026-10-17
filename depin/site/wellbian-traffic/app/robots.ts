import type { MetadataRoute } from "next";

/* 공개 채널에 올리는 주소가 아니다 — 파트너·투자자에게 직접 건네는 용도. 크롤러는 전부 돌려보낸다. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
