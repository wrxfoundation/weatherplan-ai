/* 웨더팩트 단독 빌드 후처리 — 라우트 프리렌더 + robots.txt·sitemap.xml 생성.
 * 프리렌더는 dcmap scripts/postbuild.mjs 패턴 축소 이식: dist/index.html 셸을 경로별로 복제하며
 * <title>·og:title·description·canonical만 치환(JSON-LD 주입 없음 — 홈 셸의 그래프 유지).
 * OG·타이틀·JSON-LD 원본은 vite 플러그인(weatherfact-html)이 index.html에서 치환.
 * 도메인 확정 전: WF_ORIGIN env(기본 weatherfact.vercel.app) — 확정 시 Vercel env만 교체. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ORIGIN = (process.env.WF_ORIGIN || 'https://weatherfact.vercel.app').replace(/\/$/, '')
const dist = resolve(process.cwd(), 'dist')
const today = new Date().toISOString().slice(0, 10)

const shell = readFileSync(resolve(dist, 'index.html'), 'utf8')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

function prerender(relPath, title, desc) {
  const html = shell
    .replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${ORIGIN}${relPath}$2`)
  const dir = join(dist, ...relPath.split('/').filter(Boolean))
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), html)
}

/* 가이드 slug — src/verify/guides/guidesData.js가 병렬 생성 중이라 임시 하드코딩(합류 시 import로 교체) */
const GUIDE_SLUGS = ['insurance-claims', 'construction-eot', 'legal-appraisal', 'appraisal-report-anatomy']
const GUIDE_TITLES = {
  'insurance-claims': '보험 손해사정 활용 가이드',
  'construction-eot': '건설 공기연장(EOT) 클레임 활용 가이드',
  'legal-appraisal': '소송·법률 감정 활용 가이드',
  'appraisal-report-anatomy': '기상감정서의 구조',
}

const PAGES = [
  {
    path: '/map',
    title: '웨더팩트 — 관측지점 맵',
    desc: '지도에서 사고 지점을 찍고 최근접 기상청 ASOS 관측지점·거리·커버리지 등급을 확인 — 기상 사실확인 리포트의 관측 근거를 공간적으로 검토합니다. 지점 좌표는 근사값(검증 대기).',
  },
  {
    path: '/stations',
    title: '웨더팩트 — 관측지점 탐색기',
    desc: '리포트 매칭에 쓰는 기상청 ASOS 관측지점 전체 목록 — 지점번호·지점명·위도·경도·관측개시. 이름/번호 필터·정렬·CSV 다운로드. 좌표는 근사값(파이프라인 검증 대기).',
  },
  {
    path: '/guides',
    title: '웨더팩트 — 활용 가이드',
    desc: '기상 사실확인 리포트를 실무에 쓰는 방법 — 보험 손해사정·건설 공기연장(EOT) 클레임·소송 감정 지원 시나리오별 가이드. 초안은 감정사 검수 전이며 법적 효력이 없습니다.',
  },
  ...GUIDE_SLUGS.map((slug) => ({
    path: `/guides/${slug}`,
    title: `웨더팩트 — ${GUIDE_TITLES[slug]}`,
    desc: `${GUIDE_TITLES[slug]} — 기상청 관측 기록 기반 기상 사실확인 리포트를 실무 절차에 연결하는 방법. 초안은 감정사 검수 전이며 법적 효력이 없습니다.`,
  })),
]
for (const p of PAGES) prerender(p.path, p.title, p.desc)

// /report는 파라미터 필수(개별 리포트) — 색인 대상은 서비스 홈·정적 라우트만
const urls = ['/', ...PAGES.map((p) => p.path)]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`
writeFileSync(resolve(dist, 'sitemap.xml'), sitemap)
writeFileSync(resolve(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /report\nSitemap: ${ORIGIN}/sitemap.xml\n`)
console.log(`웨더팩트 postbuild — 프리렌더 ${PAGES.length}건·sitemap(${urls.length} URL)·robots 생성 (origin: ${ORIGIN})`)
