import { useState } from 'react'
import { useMapLang } from '../i18n/mapLang.js'

/* 현재 지도 상태(레이어·위치·필터가 URL에 인코딩됨)를 링크로 복사 — B2B "이 부지 좀 봐줘" 공유. */
export default function ShareButton() {
  const [copied, setCopied] = useState(false)
  const en = useMapLang() === 'en'
  const copy = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 클립보드 차단 환경 — 무시 */
    }
  }
  return (
    <button type="button" className="map-share" onClick={copy} title={en ? 'Copy the current map (active layers · location · filters) as a link' : '현재 지도(켠 레이어·위치·필터)를 링크로 복사'}>
      {copied ? (
        <>
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 8.5l3.2 3.2L13 4.5" />
          </svg>
          {en ? 'Copied' : '복사됨'}
        </>
      ) : (
        <>
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="3.5" r="2" />
            <circle cx="4" cy="8" r="2" />
            <circle cx="12" cy="12.5" r="2" />
            <path d="M5.8 7l4.4-2.4 M5.8 9l4.4 2.4" />
          </svg>
          {en ? 'Share' : '공유'}
        </>
      )}
    </button>
  )
}
