import { CAT } from '../data/yokai.js'
import { SEAL_GLYPHS, SEAL_VIEWBOX } from './sealGlyphs.js'

/**
 * 인장 글자 — 글자가 아니라 윤곽선이다.
 * 텍스트로 찍으면 OS마다 다른 서체가 잡혀(맥은 고딕으로) 인장 줄의 얼굴이 제각각이었다.
 * 윤곽선은 scripts/build-seal-glyphs.mjs가 Noto Serif KR Bold에서 뽑는다.
 * 1em 정사각이라 부모의 font-size가 그대로 크기를 정한다 — .seal.sm/lg/xl이 손대지 않고 맞는다.
 */
export function Glyph({ ch }) {
  const d = SEAL_GLYPHS[ch]
  // 윤곽선이 없는 글자(분류를 늘리고 스크립트를 안 돌린 경우)는 글자로 떨어진다.
  // 빈칸보다 낫고, validate.mjs가 이 상황을 오류로 잡는다.
  if (!d) return ch
  return (
    <svg className="seal-glyph" viewBox={SEAL_VIEWBOX} aria-hidden="true" focusable="false">
      <path d={d} />
    </svg>
  )
}

const escText = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/** Leaflet 팝업처럼 HTML 문자열로 그리는 곳에서 쓴다. Glyph와 같은 결과다. */
export function glyphHtml(ch) {
  const d = SEAL_GLYPHS[ch]
  if (!d) return escText(ch ?? '')
  return `<svg class="seal-glyph" viewBox="${SEAL_VIEWBOX}" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`
}

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
      <Glyph ch={c.glyph} />
    </span>
  )
}

/** 요소에 분류색을 물려주는 래퍼 — 카드·칩이 hover 시 분류색을 쓰게 한다. */
export const catStyle = (category) => ({ '--cat': CAT[category]?.color })
