/* 웨더팩트 단독 빌드 후처리 — robots.txt·sitemap.xml 생성.
 * OG·타이틀·JSON-LD는 vite 플러그인(weatherfact-html)이 index.html에서 치환.
 * 도메인 확정 전: WF_ORIGIN env(기본 weatherfact.vercel.app) — 확정 시 Vercel env만 교체. */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ORIGIN = (process.env.WF_ORIGIN || 'https://weatherfact.vercel.app').replace(/\/$/, '')
const dist = resolve(process.cwd(), 'dist')
const today = new Date().toISOString().slice(0, 10)

// /report는 파라미터 필수(개별 리포트) — 색인 대상은 서비스 홈만
const urls = ['/']
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync(resolve(dist, 'sitemap.xml'), sitemap)
writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /report\nSitemap: ${ORIGIN}/sitemap.xml\n`)
console.log(`웨더팩트 postbuild — sitemap(${urls.length} URL)·robots 생성 (origin: ${ORIGIN})`)
