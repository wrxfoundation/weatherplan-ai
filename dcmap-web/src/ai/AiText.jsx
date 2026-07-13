/* AI 응답 렌더러 — 최소 마크다운(제목/불릿/굵게)만 안전하게 파싱(dangerouslySetInnerHTML 미사용). */

function inlineBold(text, keyBase) {
  // **굵게** 만 처리
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={`${keyBase}-b${i}`}>{p.slice(2, -2)}</strong>
    return <span key={`${keyBase}-t${i}`}>{p}</span>
  })
}

export default function AiText({ text }) {
  const lines = String(text || '').split('\n')
  const out = []
  let bullets = null
  const flush = () => {
    if (bullets) {
      out.push(
        <ul className="ai-ul" key={`ul-${out.length}`}>
          {bullets}
        </ul>,
      )
      bullets = null
    }
  }
  lines.forEach((raw, i) => {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) {
      flush()
      return
    }
    const h = line.match(/^#{1,4}\s+(.*)$/)
    if (h) {
      flush()
      out.push(
        <h5 className="ai-h" key={`h-${i}`}>
          {inlineBold(h[1], `h-${i}`)}
        </h5>,
      )
      return
    }
    const b = line.match(/^\s*[-•*]\s+(.*)$/)
    if (b) {
      if (!bullets) bullets = []
      bullets.push(<li key={`li-${i}`}>{inlineBold(b[1], `li-${i}`)}</li>)
      return
    }
    flush()
    out.push(
      <p className="ai-p" key={`p-${i}`}>
        {inlineBold(line, `p-${i}`)}
      </p>,
    )
  })
  flush()
  return <div className="ai-text">{out}</div>
}
