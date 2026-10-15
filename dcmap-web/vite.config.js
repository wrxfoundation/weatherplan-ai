import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: Vercel(루트 '/') 기본, GitHub Pages 하위경로 배포 시 VITE_BASE=/map/ 주입
const WF = process.env.VITE_WEATHERFACT === '1'
const WF_ORIGIN = (process.env.WF_ORIGIN || 'https://weatherfact.vercel.app').replace(/\/$/, '')

/* 웨더팩트 단독 빌드 — index.html의 dcmap 브랜딩(타이틀·OG·canonical·JSON-LD·noscript·파비콘)을
 * 웨더팩트로 치환. 도메인 확정 전에는 WF_ORIGIN env로 교체(기본 weatherfact.vercel.app). */
const WF_TITLE = '웨더팩트 — 기상 사실확인·감정지원 리포트'
const WF_DESC =
  '그날, 그 지점에 정말 비가 왔는가 — 특정 지점·기간의 기상 사실을 기상청 관측 기록으로 확인하는 사실확인·감정지원 리포트. 보험 손해사정·건설 공기연장 클레임·소송 분쟁 지원.'
function weatherfactHtml() {
  return {
    name: 'weatherfact-html',
    apply: 'build',
    transformIndexHtml(html) {
      if (!WF) return html
      const ld = {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Organization', '@id': `${WF_ORIGIN}/#org`, name: '웨더팩트 WeatherFact', url: `${WF_ORIGIN}/`, description: WF_DESC },
          { '@type': 'WebSite', '@id': `${WF_ORIGIN}/#site`, name: '웨더팩트 WeatherFact', url: `${WF_ORIGIN}/`, inLanguage: 'ko', publisher: { '@id': `${WF_ORIGIN}/#org` } },
        ],
      }
      return html
        .replace(/<title>[^<]*<\/title>/, `<title>${WF_TITLE}</title>`)
        .replace(/(<meta name="description" content=")[^"]*(")/, `$1${WF_DESC}$2`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${WF_TITLE}$2`)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${WF_DESC}$2`)
        .replace(/(<meta property="og:site_name" content=")[^"]*(")/, '$1웨더팩트 WeatherFact$2')
        .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${WF_ORIGIN}/$2`)
        .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${WF_ORIGIN}/$2`)
        .replace(/(<link rel="icon"[^>]*href=")[^"]*(")/, '$1/weatherfact.svg$2')
        .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
        .replace(
          /<noscript>[\s\S]*?<\/noscript>/,
          `<noscript><h1>웨더팩트 — 기상 사실확인·감정지원 리포트</h1><p>${WF_DESC} 이 서비스는 JavaScript가 필요합니다.</p></noscript>`
        )
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), weatherfactHtml()],
  // 상위 디렉터리(weatherplan-ai)의 tailwind postcss.config.js 상속 차단
  css: { postcss: { plugins: [] } },
})
