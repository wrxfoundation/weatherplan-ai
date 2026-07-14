import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/* 우측하단 플로팅 TOP 버튼 — 긴 문서형 페이지 전용. 맵('/')·3D('/map3d')는 스크롤 개념이
 * 달라 제외. 600px 이상 스크롤 시 표시, 클릭 시 부드럽게 최상단(모션축소 설정은 즉시 점프). */
const EXCLUDED = new Set(['/', '/map3d'])

export default function ScrollTopFab() {
  const { pathname } = useLocation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(false)
    if (EXCLUDED.has(pathname)) return undefined
    const onScroll = () => setShow(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  if (EXCLUDED.has(pathname)) return null

  const toTop = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button type="button" className={`scroll-top-fab${show ? ' show' : ''}`} onClick={toTop} aria-label="맨 위로" title="맨 위로">
      <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 13V3.5 M3.8 7.2 8 3 12.2 7.2" />
      </svg>
    </button>
  )
}
