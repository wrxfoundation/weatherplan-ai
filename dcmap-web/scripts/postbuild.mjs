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
const { GLOSSARY } = await import(join(ROOT, 'src/content/glossary.js'))
const { SIDO_SLUGS } = await import(join(ROOT, 'src/content/sido_slugs.js'))
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

function prerender(relPath, title, desc, jsonLd) {
  const head = [
    `<link rel="canonical" href="${ORIGIN}${relPath === '/' ? '' : relPath.replace(/\/index$/, '')}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ].join('\n    ')

  const html = shell
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace('</head>', `  ${head}\n  </head>`)

  const dir = join(DIST, ...relPath.split('/').filter(Boolean))
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}

for (const f of facilities) {
  prerender(`/dc/${slugOf(f)}`, `${f.name} — 명당 AI 데이터센터 맵`, describe(f), placeJsonLd(f))
}

const GLOSSARY_DESC =
  '계약전력·수전전압·전력계통영향평가·과부하율·PUE·프리쿨링 — 데이터센터 부지와 전력 인허가를 이해하는 데 필요한 용어를 공개 규정 기준으로 쉽게 풀었습니다.'
prerender('/glossary', '데이터센터 전력 인허가 용어집 — 명당 AI', GLOSSARY_DESC, {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  name: '데이터센터 전력 인허가 용어집',
  description: GLOSSARY_DESC,
  url: `${ORIGIN}/glossary`,
  hasDefinedTerm: GLOSSARY.map((g) => ({
    '@type': 'DefinedTerm',
    '@id': `${ORIGIN}/glossary#${g.id}`,
    name: g.term,
    alternateName: g.en ?? undefined,
    description: g.def,
  })),
})

// 지역 랜딩 프리렌더 — 시설이 있는 시도만
const regionSlugs = []
for (const [sido, slug] of Object.entries(SIDO_SLUGS)) {
  const list = facilities.filter((f) => f.sido === sido)
  if (!list.length) continue
  regionSlugs.push(slug)
  const by = { operating: 0, construction: 0, planned: 0 }
  let mw = 0
  for (const f of list) {
    by[f.status === 'delayed' ? 'planned' : f.status] += 1
    if (f.power_mw_public != null) mw += f.power_mw_public
  }
  const desc = `${sido} 데이터센터 ${list.length}곳 — 운영 ${by.operating} · 건설 ${by.construction} · 계획 ${by.planned}${mw > 0 ? ` · 공개 전력 합계 ${mw}MW` : ''}. 공개 소스 기반 현황, 명당 AI.`
  prerender(`/region/${slug}`, `${sido} 데이터센터 현황 — 명당 AI`, desc, {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${sido} 데이터센터 목록`,
    description: desc,
    numberOfItems: list.length,
    itemListElement: list.map((f, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${ORIGIN}/dc/${slugOf(f)}`,
      name: f.name,
    })),
  })
}

const urls = [
  '/',
  '/calc',
  '/glossary',
  ...regionSlugs.map((s) => `/region/${s}`),
  ...facilities.map((f) => `/dc/${slugOf(f)}`),
]
const today = facilities[0]?.updated_at ?? ''
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc>${today ? `<lastmod>${today}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`
writeFileSync(join(DIST, 'sitemap.xml'), sitemap)
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`)

console.log(`프리렌더 ${facilities.length}건 + sitemap.xml(${urls.length} URL) 생성 (origin: ${ORIGIN})`)
