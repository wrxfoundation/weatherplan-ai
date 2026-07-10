#!/usr/bin/env node
/**
 * vite build 후처리:
 *  1) 시설별 /dc/<slug>/index.html 정적 셸 프리렌더 (타이틀·메타·schema.org Place JSON-LD 주입) — SEO(SPEC §7)
 *  2) sitemap.xml · robots.txt 자동 생성
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const ORIGIN = (process.env.VITE_SITE_ORIGIN || 'https://dc.koreaapi.dev').replace(/\/$/, '')

const { facilities } = JSON.parse(readFileSync(join(ROOT, 'data/dc_centers.json'), 'utf8'))
const shell = readFileSync(join(DIST, 'index.html'), 'utf8')

const STATUS_LABEL = { operating: '운영', construction: '건설', planned: '계획', delayed: '지연' }
const slugOf = (f) => f.id.replace(/^kr-/, '')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

function describe(f) {
  const parts = [
    `${f.name} (${STATUS_LABEL[f.status] ?? f.status})`,
    `${f.sido}${f.sigungu ? ` ${f.sigungu}` : ''}`,
    f.operator ? `운영사 ${f.operator}` : null,
    f.power_mw_public != null ? `공개 전력 ${f.power_mw_public}MW` : null,
    f.year ? `${f.year}년` : null,
  ].filter(Boolean)
  return `${parts.join(' · ')} — 한국 데이터센터 현황 맵, 명당 AI`
}

function placeJsonLd(f) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: f.name,
    alternateName: f.name_en ?? undefined,
    description: describe(f),
    url: `${ORIGIN}/dc/${slugOf(f)}`,
    address: {
      '@type': 'PostalAddress',
      addressCountry: f.country,
      addressRegion: f.sido,
      addressLocality: f.sigungu ?? undefined,
      streetAddress: f.address_public ?? undefined,
    },
    geo: { '@type': 'GeoCoordinates', latitude: f.lat, longitude: f.lng },
  }
}

for (const f of facilities) {
  const slug = slugOf(f)
  const title = `${f.name} — 명당 AI 데이터센터 맵`
  const desc = describe(f)
  const head = [
    `<link rel="canonical" href="${ORIGIN}/dc/${slug}" />`,
    `<script type="application/ld+json">${JSON.stringify(placeJsonLd(f))}</script>`,
  ].join('\n    ')

  let html = shell
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace('</head>', `  ${head}\n  </head>`)

  const dir = join(DIST, 'dc', slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}

const urls = ['/', '/calc', ...facilities.map((f) => `/dc/${slugOf(f)}`)]
const today = facilities[0]?.updated_at ?? ''
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc>${today ? `<lastmod>${today}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`
writeFileSync(join(DIST, 'sitemap.xml'), sitemap)
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`)

console.log(`프리렌더 ${facilities.length}건 + sitemap.xml(${urls.length} URL) 생성 (origin: ${ORIGIN})`)
