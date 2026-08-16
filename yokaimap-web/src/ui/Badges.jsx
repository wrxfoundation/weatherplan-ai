import { CAT, RAR, VER, DISTRIBUTION_LABEL } from '../data/yokai.js'

export function CategoryBadge({ id }) {
  const c = CAT[id]
  if (!c) return null
  return (
    <span className="badge" style={{ color: c.color }}>
      <span aria-hidden="true">{c.glyph}</span>
      {c.name}
    </span>
  )
}

export function RarityBadge({ id }) {
  const r = RAR[id]
  if (!r) return null
  return (
    <span className="badge solid" style={{ background: r.color }} title={r.desc}>
      {r.name}
    </span>
  )
}

/** 검증등급 — 이 프로젝트의 신뢰 표시. 2차 정리물 이하는 색으로 구분해 오독을 막는다. */
export function VerificationBadge({ id, confidence }) {
  const v = VER[id]
  if (!v) return null
  return (
    <span className="badge" style={{ color: `var(--ver-${id})` }} title={v.desc}>
      {v.name}
      {confidence === 'low' ? ' · 미검증' : ''}
    </span>
  )
}

export function DistributionBadge({ id }) {
  const label = DISTRIBUTION_LABEL[id]
  if (!label) return null
  return (
    <span className="badge" style={{ color: 'var(--grey)' }}>
      {label}
    </span>
  )
}
