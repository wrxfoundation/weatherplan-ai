import { useMemo, useState } from 'react'
import { GLOSSARY, GLOSSARY_CATEGORIES } from '../content/glossary.js'

/* 용어 온톨로지 맵 — korea100 '제도 은하' 문법의 경량 번안(정적 SVG, 의존성 0).
 * 분류=성좌(클러스터), 용어=입자, 법령=중앙 성좌. 간선은 용어 정의문이 실제로 그 법령을
 * 언급할 때만 생성(자동 추출 — 창작 없음·정직). 클릭 → 하단 카드에 정의·연결 법령. */

// 법령 노드 — 정의문 텍스트에서 언급을 추출하는 패턴(실제 매칭된 법령만 노드로 남김)
const LAW_DEFS = [
  { id: 'yakgwan', label: '한전 기본공급약관 §23', re: /약관|기본공급|제23조/ },
  { id: 'psia', label: '전력계통영향평가\n(분산에너지법·공고 2025-139)', re: /계통영향평가|분산에너지|2025-139/ },
  { id: 'aidc', label: 'AIDC 특별법', re: /AIDC/ },
  { id: 'env', label: '환경영향평가법', re: /환경영향평가법|환경영향평가\s*대상/ },
  { id: 'kukto', label: '국토계획법(용도지역)', re: /국토계획법|용도지역/ },
  { id: 'building', label: '건축법', re: /건축법|건축허가|사용승인/ },
]

const CAT_COLOR = { power: 'var(--accent)', dc: 'var(--violet)', cooling: 'var(--mint)' }
const W = 1000
const H = 660
// 분류 성좌 중심 — 전력(대형)은 좌측, 기본/냉각은 우측 상·하
const CAT_POS = { power: { x: 265, y: 330 }, dc: { x: 800, y: 175 }, cooling: { x: 795, y: 505 } }
const LAW_CENTER = { x: 560, y: 330 }

// 결정적 레이아웃 — 분류 중심 주위 링 배치(물리엔진 없음 → 가볍고 항상 동일)
function layout() {
  const terms = []
  for (const c of GLOSSARY_CATEGORIES) {
    const items = GLOSSARY.filter((g) => g.category === c.key)
    const cx = CAT_POS[c.key]?.x ?? W / 2
    const cy = CAT_POS[c.key]?.y ?? H / 2
    const rings = items.length > 14 ? [Math.ceil(items.length / 2), Math.floor(items.length / 2)] : [items.length]
    let idx = 0
    rings.forEach((n, ri) => {
      const r = rings.length > 1 ? 108 + ri * 78 : 92
      for (let i = 0; i < n; i++, idx++) {
        const g = items[idx]
        if (!g) break
        const a = (2 * Math.PI * i) / n - Math.PI / 2 + (ri % 2 ? Math.PI / n : 0)
        terms.push({ ...g, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), color: CAT_COLOR[c.key] })
      }
    })
  }
  // 법령 노드 — 정의문에 실제 매칭된 것만, 중앙 세로 배열
  const edges = []
  const lawsUsed = LAW_DEFS.filter((law) => {
    const hits = terms.filter((t) => law.re.test(`${t.term} ${t.def}`))
    hits.forEach((t) => edges.push({ from: t.id, to: law.id }))
    return hits.length > 0
  })
  const laws = lawsUsed.map((law, i) => ({
    ...law,
    x: LAW_CENTER.x + (i % 2 ? 34 : -34) * (i > 1 ? 1 : 0.4),
    y: LAW_CENTER.y + (i - (lawsUsed.length - 1) / 2) * 86,
  }))
  return { terms, laws, edges }
}

export default function GlossaryMap({ cat }) {
  const { terms, laws, edges } = useMemo(layout, [])
  const [sel, setSel] = useState(null) // {type:'term'|'law', id}

  const selTerm = sel?.type === 'term' ? terms.find((t) => t.id === sel.id) : null
  const selLaw = sel?.type === 'law' ? laws.find((l) => l.id === sel.id) : null
  const linkedLawIds = selTerm ? new Set(edges.filter((e) => e.from === selTerm.id).map((e) => e.to)) : null
  const linkedTermIds = selLaw ? new Set(edges.filter((e) => e.to === selLaw.id).map((e) => e.from)) : null
  const lawTerms = selLaw ? terms.filter((t) => linkedTermIds.has(t.id)) : []

  const dimCat = (c) => cat !== '전체' && c !== cat
  const edgeActive = (e) => (selTerm && e.from === selTerm.id) || (selLaw && e.to === selLaw.id)

  return (
    <div className="gmap-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="gmap-svg" role="img" aria-label="용어·법령 온톨로지 맵">
        {/* 간선 — 용어 정의문이 법령을 실제 언급할 때만 */}
        {edges.map((e, i) => {
          const t = terms.find((x) => x.id === e.from)
          const l = laws.find((x) => x.id === e.to)
          if (!t || !l) return null
          const active = edgeActive(e)
          return (
            <line
              key={i}
              x1={t.x}
              y1={t.y}
              x2={l.x}
              y2={l.y}
              className={`gmap-edge${active ? ' on' : ''}${dimCat(t.category) ? ' dim' : ''}`}
            />
          )
        })}

        {/* 분류 성좌 라벨 */}
        {GLOSSARY_CATEGORIES.map((c) => (
          <text key={c.key} x={CAT_POS[c.key].x} y={CAT_POS[c.key].y + 4} className={`gmap-cat${dimCat(c.key) ? ' dim' : ''}`} textAnchor="middle" style={{ fill: CAT_COLOR[c.key] }}>
            {c.label}
          </text>
        ))}

        {/* 법령 노드(중앙 성좌 — 다이아) */}
        {laws.map((l) => {
          const on = selLaw?.id === l.id || (linkedLawIds && linkedLawIds.has(l.id))
          return (
            <g key={l.id} className={`gmap-law${on ? ' on' : ''}`} onClick={() => setSel(sel?.id === l.id ? null : { type: 'law', id: l.id })} role="button" tabIndex={0}
               onKeyDown={(e) => e.key === 'Enter' && setSel(sel?.id === l.id ? null : { type: 'law', id: l.id })}>
              <circle cx={l.x} cy={l.y} r="18" className="gmap-hit" />
              <rect x={l.x - 9} y={l.y - 9} width="18" height="18" transform={`rotate(45 ${l.x} ${l.y})`} rx="3" />
              {l.label.split('\n').map((ln, i) => (
                <text key={i} x={l.x} y={l.y + 24 + i * 13} textAnchor="middle" className="gmap-law-label">
                  {ln}
                </text>
              ))}
            </g>
          )
        })}

        {/* 용어 입자 */}
        {terms.map((t) => {
          const on = selTerm?.id === t.id || (linkedTermIds && linkedTermIds.has(t.id))
          const dim = dimCat(t.category)
          const short = t.term.length > 12 ? `${t.term.slice(0, 11)}…` : t.term
          return (
            <g key={t.id} className={`gmap-term${on ? ' on' : ''}${dim ? ' dim' : ''}`} onClick={() => setSel(sel?.id === t.id ? null : { type: 'term', id: t.id })} role="button" tabIndex={0}
               onKeyDown={(e) => e.key === 'Enter' && setSel(sel?.id === t.id ? null : { type: 'term', id: t.id })}>
              {/* 투명 히트 영역 — 4.5px 점은 클릭이 어려움 */}
              <circle cx={t.x} cy={t.y} r="15" className="gmap-hit" />
              <circle cx={t.x} cy={t.y} r={on ? 6.5 : 4.5} style={{ fill: t.color }} />
              <text x={t.x} y={t.y + 16} textAnchor="middle" className="gmap-term-label">
                {short}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 선택 카드 — 용어 정의 / 법령 연결 용어 목록 */}
      {selTerm && (
        <div className="gmap-card" role="region" aria-label="용어 상세">
          <div className="gmap-card-head">
            <b>{selTerm.term}</b>
            {selTerm.en && <span className="glossary-en">{selTerm.en}</span>}
            <button type="button" className="gmap-x" onClick={() => setSel(null)} aria-label="닫기">✕</button>
          </div>
          <p>{selTerm.def}</p>
          {linkedLawIds?.size > 0 && (
            <div className="gmap-links">
              근거·연결: {laws.filter((l) => linkedLawIds.has(l.id)).map((l) => l.label.replace('\n', ' ')).join(' · ')}
            </div>
          )}
        </div>
      )}
      {selLaw && (
        <div className="gmap-card" role="region" aria-label="법령 상세">
          <div className="gmap-card-head">
            <b>{selLaw.label.replace('\n', ' ')}</b>
            <button type="button" className="gmap-x" onClick={() => setSel(null)} aria-label="닫기">✕</button>
          </div>
          <div className="gmap-links">
            이 법령을 인용하는 용어 {lawTerms.length}개: {lawTerms.map((t) => t.term).join(' · ')}
          </div>
        </div>
      )}
      {!sel && <p className="gmap-hint">입자(용어)·다이아(법령)를 클릭하면 정의와 연결이 표시됩니다 — 간선은 정의문이 실제 인용한 법령만.</p>}
    </div>
  )
}
