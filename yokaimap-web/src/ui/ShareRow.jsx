import { useState } from 'react'
import { SITE_ORIGIN } from './useHead.js'

/**
 * 공유 줄 — 진단 결과와 요괴 상세의 재유입 루프.
 * 외부 SDK를 쓰지 않고 웹 인텐트와 클립보드만 쓴다(런타임 외부 의존 0).
 */
export default function ShareRow({ path, text }) {
  const [copied, setCopied] = useState(false)
  const url = `${SITE_ORIGIN}${path}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const native = async () => {
    if (!navigator.share) return copy()
    try {
      await navigator.share({ title: text, text, url })
    } catch {
      /* 사용자가 취소한 경우 — 조용히 넘어간다 */
    }
  }

  return (
    <div className="row" style={{ gap: 'var(--sp-2)' }}>
      <button className="btn ghost" onClick={native}>
        공유하기
      </button>
      <button className="btn ghost" onClick={copy}>
        {copied ? '링크 복사됨' : '링크 복사'}
      </button>
      <a
        className="btn ghost"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
      >
        X에 공유
      </a>
    </div>
  )
}
