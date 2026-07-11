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
const { INSIGHTS } = await import(join(ROOT, 'src/content/insights_meta.js'))
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
  return `${parts.join(' · ')} — 한국 데이터센터 현황 맵, AI InfraMap`
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
  prerender(`/dc/${slugOf(f)}`, `${f.name} — AI InfraMap 데이터센터 맵`, describe(f), placeJsonLd(f))
}

const GLOSSARY_DESC =
  '계약전력·수전전압·전력계통영향평가·과부하율·PUE·프리쿨링 — 데이터센터 부지와 전력 인허가를 이해하는 데 필요한 용어를 공개 규정 기준으로 쉽게 풀었습니다.'
prerender('/glossary', '데이터센터 전력 인허가 용어집 — AI InfraMap', GLOSSARY_DESC, {
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

const STATS_DESC =
  '국내 데이터센터 165개소(2024) 중 60%가 수도권에 집중. 전체 수전용량 약 1,913MW, 민간 평균 17.7MW — KEEI·KDCC 공개 통계로 보는 한국 데이터센터 현황.'
prerender('/stats', '국내 데이터센터 통계 — 수도권 집중과 전력 수요 · AI InfraMap', STATS_DESC, {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: '국내 데이터센터 현황 통계 (2023~2024)',
  description: STATS_DESC,
  creator: { '@type': 'Organization', name: 'AI InfraMap' },
  isBasedOn: [
    '김철현·김성균(2025), 「AI 시대 데이터센터 증가의 국내 에너지 소비 시사점」, KEEI 기본연구보고서',
    'KDCC(한국데이터센터연합회), Korea Data Center Market Report 2024~2027 (2024) · 2025~2028 (2025)',
  ],
  citation: '에너지경제연구원(KEEI) 에너지통계 월호 제82호 (2026.4.30)',
})

prerender('/dashboard', '대시보드 — AI InfraMap 한국 데이터센터 인텔리전스', '한국 데이터센터 현황 대시보드: 상태별 시설 수, 지역별 공개 전력 분포, 건설 파이프라인, 입지 시군구 지가 펄스 — 전부 공개 데이터 기준.', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AI InfraMap 대시보드',
})

prerender(
  '/compare',
  '시설 비교 — AI InfraMap',
  '데이터센터 2~3곳을 나란히 — 상태·전력·연도·지가·인허가 트랙·발전 인프라 근접성을 공개 데이터로 비교.',
  { '@context': 'https://schema.org', '@type': 'WebPage', name: 'AI InfraMap 시설 비교' },
)

prerender('/map3d', '3D 맵 (베타) — AI InfraMap', '한국 데이터센터 현황을 기울인 3D 시점에서 — MapLibre GL 전환 1단계 베타.', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AI InfraMap 3D 맵 베타',
})

prerender(
  '/land',
  'LAND PULSE — 입지 지가변동률 시·군·구·동 리스트 · AI InfraMap',
  '데이터센터 입지 시군구 35곳과 읍면동 조사구역 539개의 월간 지가변동률 — 시도 필터·정렬·동 단위 드릴다운. KOSIS·한국부동산원 공개 통계.',
  { '@context': 'https://schema.org', '@type': 'Dataset', name: 'AI InfraMap LAND PULSE — DC 입지 지가변동률' },
)

// 인사이트 프리렌더
prerender('/insights', '인사이트 — AI InfraMap', '데이터센터 입지·전력·민원·기상을 둘러싼 논쟁을 공개 데이터로 정리하는 AI InfraMap 인사이트.', {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'AI InfraMap 인사이트',
})
for (const a of INSIGHTS) {
  prerender(`/insights/${a.slug}`, `${a.title} — AI InfraMap 인사이트`, a.description, {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.description,
    datePublished: a.date,
    author: { '@type': 'Organization', name: 'AI InfraMap' },
    url: `${ORIGIN}/insights/${a.slug}`,
  })
}

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
  const desc = `${sido} 데이터센터 ${list.length}곳 — 운영 ${by.operating} · 건설 ${by.construction} · 계획 ${by.planned}${mw > 0 ? ` · 공개 전력 합계 ${mw}MW` : ''}. 공개 소스 기반 현황, AI InfraMap.`
  prerender(`/region/${slug}`, `${sido} 데이터센터 현황 — AI InfraMap`, desc, {
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
  '/map3d',
  '/land',
  '/compare',
  '/calc',
  '/glossary',
  '/stats',
  '/dashboard',
  '/insights',
  ...INSIGHTS.map((a) => `/insights/${a.slug}`),
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
