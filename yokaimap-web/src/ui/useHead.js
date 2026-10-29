import { useEffect } from 'react'

const ORIGIN = import.meta.env.VITE_SITE_ORIGIN ?? 'https://yokaimap.kr'
export const SITE_ORIGIN = ORIGIN.replace(/\/$/, '')

const setMeta = (selector, attr, value) => {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(attr, value)
}

/**
 * 라우트별 title·description·canonical·JSON-LD 갱신.
 * 프리렌더된 정적 셸과 같은 값을 쓰므로(seo.js 공유) 크롤러와 사용자 사이에 불일치가 없다.
 */
export function useHead({ title, description, canonical, jsonLd }) {
  useEffect(() => {
    if (title) {
      document.title = title
      setMeta('meta[property="og:title"]', 'content', title)
    }
    if (description) {
      setMeta('meta[name="description"]', 'content', description)
      setMeta('meta[property="og:description"]', 'content', description)
    }
    if (canonical) {
      const url = `${SITE_ORIGIN}${canonical}`
      setMeta('link[rel="canonical"]', 'href', url)
      setMeta('meta[property="og:url"]', 'content', url)
    }

    let script
    if (jsonLd) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.route = '1'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }
    return () => script?.remove()
  }, [title, description, canonical, jsonLd])
}
