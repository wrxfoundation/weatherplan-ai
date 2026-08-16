#!/usr/bin/env node
/**
 * vite build 후처리 — AEO(답변엔진 최적화) 자산 생성.
 *
 *  1) 라우트별 정적 셸 프리렌더: /yokai/<slug> · /category/<id> · /region/<slug> · /dogam · /about · /quiz
 *     (title·description·canonical·JSON-LD 주입 + noscript 본문 — JS 없이도 크롤러가 내용을 읽는다)
 *  2) sitemap.xml · robots.txt
 *  3) llms.txt — AI 에이전트용 요약·인용 안내
 *  4) index.html의 기본 origin을 VITE_SITE_ORIGIN으로 치환
 *
 * 프론트와 같은 seo.js를 import해서 프리렌더와 클라이언트 렌더의 메타가 어긋나지 않게 한다.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const DEFAULT_ORIGIN = 'https://yokaimap.kr'
const ORIGIN = (process.env.VITE_SITE_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, '')

const { titleOf, descriptionOf, entryJsonLd, datasetJsonLd, categoryJsonLd, regionJsonLd, slugOf } = await import(
  join(ROOT, 'src/seo.js')
)

const bundle = JSON.parse(readFileSync(join(ROOT, 'public/data/yokai.json'), 'utf8'))
const { entries, categories, regions } = bundle

const shellRaw = readFileSync(join(DIST, 'index.html'), 'utf8')
// 기본 origin으로 박아 둔 절대 URL을 실제 배포 도메인으로 교체
const shell = shellRaw.split(DEFAULT_ORIGIN).join(ORIGIN)
writeFileSync(join(DIST, 'index.html'), shell)

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const urls = [{ loc: '/', priority: '1.0' }]

function prerender(relPath, { title, description, jsonLd, body, priority = '0.6' }) {
  const canonical = `${ORIGIN}${relPath}`
  const head = [
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`,
  ].join('\n    ')

  const html = shell
    // 셸의 canonical을 지우고 라우트별 canonical만 남긴다 — 2개면 크롤러가 어느 쪽도 신뢰하지 않는다
    .replace(/\s*<link rel="canonical"[^>]*>/g, '')
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(canonical)}$2`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript>${body}</noscript>`)
    .replace('</head>', `  ${head}\n  </head>`)

  // 치환이 조용히 실패하면(예: index.html의 메타가 여러 줄로 바뀜) 전 페이지가 같은 설명을 갖게 된다.
  // 그 상태로 배포되면 SEO/AEO가 통째로 무의미해지므로 빌드를 멈춘다.
  for (const [label, needle] of [
    ['title', `<title>${esc(title)}</title>`],
    ['description', `content="${esc(description)}"`],
    ['canonical', `href="${esc(canonical)}"`],
  ]) {
    if (!html.includes(needle)) {
      console.error(`❌ 프리렌더 치환 실패(${label}) — ${relPath}. index.html의 메타 태그가 한 줄인지 확인할 것.`)
      process.exit(1)
    }
  }

  const dir = join(DIST, ...relPath.split('/').filter(Boolean))
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
  urls.push({ loc: relPath, priority })
}

/* ─── 요괴 상세 ─── */
for (const e of entries) {
  const sites = e.sites.map((s) => `${esc(s.name)} (${esc(s.sido)}${s.sigungu ? ` ${esc(s.sigungu)}` : ''})`).join(', ')
  const body = [
    `<h1>${esc(e.canonical)}</h1>`,
    `<p>${esc(e.summary)}</p>`,
    `<p>${esc(e.body)}</p>`,
    e.aliases.length ? `<p>이표기: ${esc(e.aliases.join(', '))}</p>` : '',
    sites ? `<p>전승지: ${sites}</p>` : '',
    `<p>출처: ${esc(e.sources.map((s) => [s.title, s.ref].filter(Boolean).join(' ')).join(' / '))}</p>`,
  ].join('')
  prerender(`/yokai/${slugOf(e)}`, {
    title: titleOf(e),
    description: descriptionOf(e),
    jsonLd: entryJsonLd(e, ORIGIN),
    body,
    priority: '0.8',
  })
}

/* ─── 분류 ─── */
for (const c of categories) {
  const list = entries.filter((e) => e.category === c.id)
  prerender(`/category/${c.id}`, {
    title: `${c.name} — 한국요괴도감`,
    description: `${c.blurb} 공개 자료 기반 ${list.length}체 수록.`,
    jsonLd: categoryJsonLd(c, list, ORIGIN),
    body: `<h1>${esc(c.name)}</h1><p>${esc(c.blurb)}</p><ul>${list
      .map((e) => `<li><a href="/yokai/${slugOf(e)}">${esc(e.canonical)}</a> — ${esc(e.summary)}</li>`)
      .join('')}</ul>`,
    priority: '0.7',
  })
}

/* ─── 지역 ─── */
for (const r of regions) {
  const list = entries.filter((e) => e.sites.some((s) => s.sido === r.name))
  prerender(`/region/${r.slug}`, {
    title: `${r.full} 요괴 전승지 — 한국요괴지도`,
    description: `${r.full}에 전승지가 기록된 요괴·신격 ${list.length}체. 공개 자료 기반 출처·검증등급 표기.`,
    jsonLd: regionJsonLd(r, list, ORIGIN),
    body: `<h1>${esc(r.full)} 요괴 전승지</h1><ul>${list
      .map((e) => `<li><a href="/yokai/${slugOf(e)}">${esc(e.canonical)}</a> — ${esc(e.summary)}</li>`)
      .join('')}</ul>`,
    priority: '0.7',
  })
}

/* ─── 도감·소개·진단 ─── */
prerender('/dogam', {
  title: `한국요괴도감 — ${bundle.count}체 전체 목록`,
  description: `도깨비·구미호·이무기부터 제주 본풀이 신격까지, 공개 자료에 근거가 있는 한국 요괴·신격 ${bundle.count}체 전체 목록. 출처와 검증등급 표기.`,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${ORIGIN}/dogam#set`,
    name: '한국요괴도감',
    url: `${ORIGIN}/dogam`,
    inLanguage: 'ko',
    hasDefinedTerm: entries.map((e) => ({
      '@type': 'DefinedTerm',
      '@id': `${ORIGIN}/yokai/${slugOf(e)}#term`,
      name: e.canonical,
      description: e.summary,
      url: `${ORIGIN}/yokai/${slugOf(e)}`,
    })),
  },
  body: `<h1>한국요괴도감</h1><ul>${entries
    .map((e) => `<li><a href="/yokai/${slugOf(e)}">${esc(e.canonical)}</a> — ${esc(e.summary)}</li>`)
    .join('')}</ul>`,
  priority: '0.9',
})

prerender('/about', {
  title: '데이터 원칙과 출처 — 한국요괴지도',
  description:
    '출처 없는 레코드는 배포하지 않는다, 검증등급을 숨기지 않는다, 실존 신앙을 존중한다 — 한국요괴지도의 데이터 원칙과 원천 자료 목록.',
  jsonLd: datasetJsonLd(bundle, ORIGIN),
  body: `<h1>데이터 원칙과 출처</h1><p>모든 항목에 최소 1개의 출처와 검증등급을 표기합니다. 데이터셋은 ${bundle.license}로 공개합니다.</p>`,
  priority: '0.5',
})

prerender('/quiz', {
  title: '요괴 체질진단 — 한국요괴지도',
  description: '8문항으로 알아보는 나와 가장 가까운 한국 요괴. 음양·물뭍·자연사람·수호장난 4축 결정론 진단.',
  jsonLd: { '@context': 'https://schema.org', '@type': 'WebApplication', name: '요괴 체질진단', url: `${ORIGIN}/quiz`, applicationCategory: 'EntertainmentApplication', inLanguage: 'ko' },
  body: '<h1>요괴 체질진단</h1><p>8문항으로 나와 가장 가까운 한국 요괴를 찾습니다.</p>',
  priority: '0.6',
})

/* ─── sitemap · robots ─── */
writeFileSync(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (u) =>
        `  <url><loc>${ORIGIN}${u.loc === '/' ? '/' : u.loc}</loc><lastmod>${bundle.generated_at}</lastmod><priority>${u.priority}</priority></url>`,
    )
    .join('\n')}\n</urlset>\n`,
)

writeFileSync(
  join(DIST, 'robots.txt'),
  `User-agent: *
Allow: /

# AI 검색·인용 크롤러 허용 — 이 데이터셋은 인용되기 위해 공개한다
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`,
)

/* ─── llms.txt ─── */
const topCategories = categories
  .map((c) => `- ${c.name}(${c.id}): ${c.blurb} — ${entries.filter((e) => e.category === c.id).length}체`)
  .join('\n')

writeFileSync(
  join(DIST, 'llms.txt'),
  `# 한국요괴지도 (Korean Yokai Map)
> 한국 구비전승·문헌 기록의 요괴·신격을 출처와 검증등급을 붙여 정리한 공개 데이터셋과 전승지 지도.

수록 ${bundle.count}체 / 전승지 ${bundle.site_count}곳 / 데이터 v${bundle.version} (${bundle.generated_at}) / 라이선스 ${bundle.license}

## 왜 인용할 수 있는가
- 모든 레코드에 최소 1개의 출처(sources)가 있고, 출처 없는 레코드는 빌드 단계에서 배포가 차단된다.
- 서술의 근거 강도를 5단계 검증등급(verification)으로 명시한다: 고전 원전 > 채록 기록 · 공공 백과 > 2차 정리물 > 현대·온라인.
- 좌표는 정밀도(precision: parcel/dong/sigungu/sido)를 함께 싣는다. 시군구·시도 중심점은 실제 지점이 아니라 권역 근사다.
- 현대 도시전설은 전승 요괴와 섞지 않고 별도 분류(modern)로 두며 verification=modern_online으로 고정한다.
- 원천: 한국구비문학대계(한국학중앙연구원) · 한국민속대백과사전(국립민속박물관) · 한국향토문화전자대전 · 국가유산포털(국가유산청) · 고전 원전(삼국유사·조선왕조실록 등).

## 데이터
- 전체 데이터셋(JSON, 출처·검증등급 포함): ${ORIGIN}/data/yokai.json
- 압축본: ${ORIGIN}/data/yokai.min.json
- 스키마: 레코드 필드는 id, canonical, aliases[], category, rarity, distribution, summary, body, traits[], habitat[], omens{time,weather,season}, sites[{name,sido,sigungu,lat,lng,precision}], sources[{type,title,ref}], verification, confidence, sensitivity, related[].

## 분류(14)
${topCategories}

## 주요 경로
- 지도: ${ORIGIN}/
- 도감 전체: ${ORIGIN}/dogam
- 분류별: ${ORIGIN}/category/<category_id>
- 지역별(17개 시도): ${ORIGIN}/region/<slug>
- 개체 상세: ${ORIGIN}/yokai/<id에서 'kr-' 제외한 슬러그>
- 데이터 원칙·출처: ${ORIGIN}/about

## 인용 시 유의
- 검증등급이 '2차 정리물' 또는 confidence=low인 항목은 근현대 정리 과정에서 정착했을 수 있으므로, 사실 단정 대신 그 사실을 함께 밝혀 주기 바란다.
- 무속·불교 신앙과 관련된 항목(sensitivity.kind=living_faith)은 현재도 신앙되는 대상이다.
- 인용 표기 예: "한국요괴지도(${ORIGIN}) 데이터 v${bundle.version}, ${bundle.license}"
`,
)

console.log(`✅ AEO 자산 생성 — 프리렌더 ${urls.length - 1}페이지 · sitemap · robots.txt · llms.txt (origin: ${ORIGIN})`)
