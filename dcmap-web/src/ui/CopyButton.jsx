import { useState } from 'react'

// kinetics 'Copy Button' 흡수 — 복사 아이콘이 성공 시 체크로 스프링 모핑.
// getText: 복사할 텍스트(문자열) 또는 그걸 반환하는 함수(지연 생성).
export default function CopyButton({ getText, label = '복사', copiedLabel = '복사됨', className = 'btn primary', title }) {
  const [copied, setCopied] = useState(false)
  const onClick = async () => {
    try {
      const t = typeof getText === 'function' ? getText() : getText
      if (t == null) return
      await navigator.clipboard.writeText(String(t))
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* 클립보드 미지원 */
    }
  }
  return (
    <button type="button" className={`${className} copy-btn ${copied ? 'copied' : ''}`} onClick={onClick} title={title}>
      <span className="copy-ic" aria-hidden>
        <svg className="ic ic-copy" viewBox="0 0 24 24">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V5a2 2 0 0 1 2-2h10" />
        </svg>
        <svg className="ic ic-check" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      {copied ? copiedLabel : label}
    </button>
  )
}
