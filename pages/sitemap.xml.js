const SITE_URL = "https://weatherplan-ai.vercel.app";

const STATIC_ROUTES = [
  { path: "/",             priority: "1.0", changefreq: "daily"   },
  { path: "/ai-scorecard", priority: "0.9", changefreq: "weekly"  },
  { path: "/studio",       priority: "0.9", changefreq: "weekly"  },
  { path: "/onboarding",   priority: "0.8", changefreq: "monthly" },
  { path: "/dashboard",    priority: "0.7", changefreq: "weekly"  },
  { path: "/agency-board", priority: "0.6", changefreq: "monthly" },
];

function generateSiteMap() {
  const today = new Date().toISOString().split("T")[0];
  const urls = STATIC_ROUTES.map((r) => `
  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

export async function getServerSideProps({ res }) {
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200");
  res.write(generateSiteMap());
  res.end();
  return { props: {} };
}

export default function SiteMap() { return null; }
