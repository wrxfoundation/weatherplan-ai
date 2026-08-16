import { CAT } from '../data/yokai.js'

/**
 * 분류 인장(印) — 도상이 없는 동안 각 요괴의 시각 식별자 역할을 한다.
 * 색은 --cat 커스텀 프로퍼티로만 주입하고, 실제 배경/테두리/글자색은
 * tokens.css의 --cat-surface/--cat-border/--cat-ink가 서피스(한지/밤)에 맞게 계산한다.
 */
export default function Seal({ category, size = '', filled = false, title }) {
  const c = CAT[category]
  if (!c) return null
  return (
    <span
      className={`seal ${size} ${filled ? 'filled' : ''}`.trim()}
      style={{ '--cat': c.color }}
      title={title ?? c.name}
      aria-hidden="true"
    >
      {c.glyph}
    </span>
  )
}

/** 요소에 분류색을 물려주는 래퍼 — 카드·칩이 hover 시 분류색을 쓰게 한다. */
export const catStyle = (category) => ({ '--cat': CAT[category]?.color })
