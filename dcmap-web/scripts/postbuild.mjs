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
const ORIGIN = (process.env.VITE_SITE_ORIGIN || 'https://aiagentlabs.co.kr').replace(/\/$/, '')

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

// ── AEO: /about 프리렌더 + FAQPage JSON-LD (답변엔진이 그대로 인용할 Q&A — 확정 사실만) ──
const FAQ = [
  {
    q: 'AI InfraMap은 어떤 서비스인가요?',
    a: `전국 데이터센터·발전·계통·규제 공개 데이터를 한 장의 지도로 모아, 임의 지점의 데이터센터 부지 적합성을 전력·토지·리스크·네트워크·기상 5축으로 즉시 판정하는 부지 인텔리전스입니다. 검증 시설 ${facilities.length}곳, 회원가입 없이 무료로 사용합니다.`,
  },
  {
    q: '전력계통영향평가가 무엇이고 왜 중요한가요?',
    a: '분산에너지 활성화 특별법에 따라 계약전력 10MW 이상 대규모 전력수요의 계통 영향을 심사하는 제도입니다. 시범운영(2025.8–2026.3)에서 수도권 1차 기술검토 522건 중 53.4%가 전력 공급 불가 판정을 받았고, 본심사 통과는 수도권 10/24건 대 비수도권 26/29건이었습니다. 데이터센터 부지 선정의 최대 관문입니다.',
  },
  {
    q: '데이터센터 부지는 왜 비수도권이 유리한가요?',
    a: '전력계통영향평가에 수도권 억제 배점(±15점)이 있고, 전국 공급불가 판정의 91%가 수도권에 집중돼 있습니다. 여기에 AIDC 특별법(2027.3.10 시행)이 비수도권 신·증축에 평가 면제 트랙을 열어줍니다(면제 용량 상한은 대통령령 미정).',
  },
  {
    q: '데이터는 어디서 오고 믿을 수 있나요?',
    a: '한전, 전력거래소(EPSIS), KOSIS, SGIS, vworld, 기상청, K-water, 국가법령정보센터, DART 등 공개 데이터만 사용합니다. 산출 근거가 없는 항목은 점수화하지 않고 "데이터 대기"로 명시하며, 수치에는 출처와 갱신일을 표기합니다.',
  },
  {
    q: '이용 비용은 얼마인가요?',
    a: '맵·부지 스코어링·GPU 계산기·AI 브리프는 무료(베타)입니다. 정밀 부지 리포트와 데이터·API 제휴는 요금·문의 페이지 또는 kwangdol@gmail.com으로 문의하세요.',
  },
]
const ABOUT_DESC =
  'AI 데이터센터의 첫 질문 "어디에 짓는가"에 답합니다 — 전국 시설·전력계통·인허가 공개 데이터로 임의 지점의 부지 적합성을 즉시 판정하는 부지 인텔리전스.'
prerender('/about', '서비스 소개 — AI InfraMap', ABOUT_DESC, {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
})
prerender('/roadmap', 'AI 데이터센터 구축 A–Z 로드맵 — AI InfraMap', '부지→전력→계통→송변전→발전 조달→냉각→리스크→네트워크→인허가→운영 10단계 — 한국에서 AI 데이터센터를 짓는 전 과정을 공개 규정·데이터로.', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AI 데이터센터 구축 A–Z 로드맵',
})
prerender('/pricing', '요금·문의 — AI InfraMap', '데이터센터 부지 인텔리전스 — 무료 도구, 정밀 리포트, 제휴·데이터, 사업 문의.', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AI InfraMap 요금·문의',
})
prerender('/report-sample', '정밀 부지 리포트 — 견본 | AI InfraMap', '정밀 부지 리포트 견본 — 계통영향평가 통과 전망, 변전소 실측 여유, 수전전압 트랙, 인허가 리드타임, 리스크를 한 부에(가상 부지·예시 데이터).', {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AI InfraMap 정밀 부지 리포트 견본',
})
prerender('/data', '데이터 탐색기 — AI InfraMap', '발전 허가대장·집단에너지·계통 공급여유·계통영향평가·변전소·산업단지·시설 시드 — 축적 원천 자료 검색·CSV 다운로드.', {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'AI InfraMap 공개 데이터 탐색기',
  creator: { '@type': 'Organization', name: 'AI InfraMap' },
})

const urls = [
  '/',
  '/about',
  '/roadmap',
  '/pricing',
  '/data',
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

// robots.txt — 전체 허용 + AI/답변엔진 크롤러 명시 환영(GEO: 생성엔진이 인용 소스로 수집하도록)
writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *
Allow: /

# AI/답변엔진 크롤러 명시 허용 — 공개 데이터 기반 서비스, 인용 환영 (출처 표기 요망)
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: CCBot
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
# AI 에이전트용 안내: ${ORIGIN}/llms.txt
`,
)

// ── GEO: llms.txt — AI 에이전트/생성엔진용 서비스 인덱스 (llmstxt.org 관례) ──
const opCount = facilities.filter((f) => f.status === 'operating').length
const mwSum = Math.round(facilities.reduce((s, f) => s + (f.power_mw_public ?? 0), 0))
writeFileSync(
  join(DIST, 'llms.txt'),
  `# AI InfraMap — 한국 AI 데이터센터 부지 인텔리전스

> 전국 데이터센터·발전·전력계통·인허가 규제를 공개 데이터로 집계해, 임의 지점의 데이터센터 부지
> 적합성을 5축(전력·토지·리스크·네트워크·기상)으로 판정하는 무료 B2B 도구. 한국어.

핵심 사실 (프리렌더 시점 기준):
- 검증 시설 ${facilities.length}곳 (운영 ${opCount}) · 공개 수전용량 합계 ${mwSum.toLocaleString()}MW+ (미공개 제외)
- 정직성 원칙: 근거 없는 항목은 점수화하지 않고 '데이터 대기'로 명시. 수치에 출처·갱신일 표기.
- 데이터 출처: 한전·전력거래소(EPSIS)·KOSIS·SGIS·vworld·기상청·K-water·국가법령정보센터·DART (전부 공개)

## 주요 페이지
- [서비스 소개 + FAQ](${ORIGIN}/about): 무엇을 하는 서비스인지, 계통영향평가·비수도권 유리 이유 Q&A
- [인터랙티브 맵](${ORIGIN}/): 시설 ${facilities.length}곳 + 변전소·송전선·발전허가·계통여유·승인율 레이어, 지점 클릭 부지 분석
- [용어집](${ORIGIN}/glossary): 전력 인허가·데이터센터 용어 ${GLOSSARY.length}개 (공개 규정 기준 정의)
- [구축 로드맵](${ORIGIN}/roadmap): 부지→운영 10단계 + 프로세스 프레임 + 제도 트래커(AIDC 특별법 시행령·계통영향평가 고시 진행 추적)
- [통계](${ORIGIN}/stats) · [대시보드](${ORIGIN}/dashboard) · [데이터 탐색기](${ORIGIN}/data)
- [GPU→전력 계산기](${ORIGIN}/calc): GPU 수 → MW·PUE·전력비·탄소·RE100 + AIDC 면제 시나리오
- [인사이트](${ORIGIN}/insights): ${INSIGHTS.length}편 — 입지·전력·규제 분석
- [요금·문의](${ORIGIN}/pricing): 무료(베타) · 정밀 리포트·제휴 문의

## 인용 안내
- 시설 상세는 ${ORIGIN}/dc/<slug> (schema.org Place JSON-LD 포함), 지역 현황은 ${ORIGIN}/region/<slug>
- 인용 시 "AI InfraMap (${ORIGIN})" 출처 표기를 부탁드립니다. 문의: kwangdol@gmail.com
`,
)

console.log(`프리렌더 ${facilities.length}건 + sitemap.xml(${urls.length} URL) + robots/llms.txt 생성 (origin: ${ORIGIN})`)
