import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GLOSSARY, GLOSSARY_CATEGORIES } from '../content/glossary.js'
import { PROCESS_NODES } from '../content/processOntology.js'

/* 용어·절차·법령 온톨로지 맵 — korea100 '제도 은하' 문법의 경량 번안(정적 SVG, 의존성 0).
 * 3층: 용어(입자·성좌) ↔ 법령(중앙 다이아) ↔ 절차(하단 P01–P15 스트립).
 * 간선은 정의문/근거문이 실제로 그 법령을 언급할 때만 자동 추출(창작 없음·정직).
 * 공간감: 별배경 + 성좌 글로우 + 깊이(z)별 크기·광도 + 마우스 패럴랙스 + 원근 틸트(모션축소 시 비활성). */

const LAW_DEFS = [
  { id: 'yakgwan', label: '한전 기본공급약관 §23', re: /약관|기본공급|제23조/, url: 'https://cyber.kepco.co.kr/ckepco/front/jsp/CY/D/C/CYDCHP00201.jsp' },
  { id: 'psia', label: '전력계통영향평가\n(분산에너지법·공고 2025-139)', re: /계통영향평가|분산에너지|2025-139/, url: 'https://www.law.go.kr/법령/분산에너지활성화특별법' },
  { id: 'aidc', label: 'AIDC 특별법', re: /AIDC/ },
  { id: 'env', label: '환경영향평가법', re: /환경영향평가법|환경영향평가\s*대상/, url: 'https://www.law.go.kr/법령/환경영향평가법' },
  { id: 'kukto', label: '국토계획법(용도지역)', re: /국토계획법|용도지역/, url: 'https://www.law.go.kr/법령/국토의계획및이용에관한법률' },
  { id: 'building', label: '건축법', re: /건축법|건축허가|사용승인/, url: 'https://www.law.go.kr/법령/건축법' },
]

const CAT_COLOR = { power: '#35d5ee', dc: '#a78bfa', cooling: '#34d399' }
const W = 1000
const H = 730
const CAT_POS = { power: { x: 265, y: 310 }, dc: { x: 800, y: 165 }, cooling: { x: 795, y: 480 } }
const LAW_CENTER = { x: 560, y: 310 }
// 결정적 의사난수 — 깊이(z)·별 배치용(렌더마다 동일)
const prand = (i, salt = 0) => (((i + 1) * 137.508 + salt * 61.803) % 100) / 100

function layout() {
  const terms = []
  for (const c of GLOSSARY_CATEGORIES) {
    const items = GLOSSARY.filter((g) => g.category === c.key)
    const cx = CAT_POS[c.key]?.x ?? W / 2
    const cy = CAT_POS[c.key]?.y ?? H / 2
    const rings = items.length > 14 ? [Math.ceil(items.length / 2), Math.floor(items.length / 2)] : [items.length]
    let idx = 0
    rings.forEach((n, ri) => {
      const r = rings.length > 1 ? 106 + ri * 78 : 90
      for (let i = 0; i < n; i++, idx++) {
        const g = items[idx]
        if (!g) break
        const a = (2 * Math.PI * i) / n - Math.PI / 2 + (ri % 2 ? Math.PI / n : 0)
        terms.push({ ...g, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), color: CAT_COLOR[c.key], z: prand(terms.length, 3) })
      }
    })
  }
  const edges = []
  const lawsUsed = LAW_DEFS.filter((law) => {
    const t = terms.filter((x) => law.re.test(`${x.term} ${x.def}`))
    t.forEach((x) => edges.push({ from: x.id, to: law.id, kind: 'term' }))
    const p = PROCESS_NODES.filter((n) => law.re.test(n.basis))
    p.forEach((n) => edges.push({ from: n.id, to: law.id, kind: 'proc' }))
    return t.length > 0 || p.length > 0
  })
  const laws = lawsUsed.map((law, i) => ({
    ...law,
    x: LAW_CENTER.x + (i % 2 ? 36 : -36) * (i > 1 ? 1 : 0.4),
    y: LAW_CENTER.y + (i - (lawsUsed.length - 1) / 2) * 82,
  }))
  // 절차 스트립 — 하단 완만한 아치(P01→P15)
  const procs = PROCESS_NODES.map((n, i) => {
    const t = i / (PROCESS_NODES.length - 1)
    return { ...n, x: 150 + t * 700, y: 668 - Math.sin(t * Math.PI) * 26 }
  })
  return { terms, laws, edges, procs }
}

// 별 배경 — 결정적 90개(먼 층)
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: prand(i, 1) * W,
  y: prand(i, 7) * (H - 60),
  r: 0.5 + prand(i, 11) * 1.1,
  o: 0.1 + prand(i, 13) * 0.3,
  d: prand(i, 17) * 4,
}))

export default function GlossaryMap({ cat }) {
  const { terms, laws, edges, procs } = useMemo(layout, [])
  const [sel, setSel] = useState(null) // {type:'term'|'law'|'proc', id}
  const backRef = useRef(null)
  const midRef = useRef(null)
  const foreRef = useRef(null)
  const wrapRef = useRef(null)
  const raf = useRef(0)

  // 마우스 패럴랙스 — 깊이 층별 이동량 차등(공간감). 모션축소·터치는 비활성.
  const onMove = (e) => {
    if (typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      if (backRef.current) backRef.current.style.transform = `translate(${nx * -6}px, ${ny * -4}px)`
      if (midRef.current) midRef.current.style.transform = `translate(${nx * -14}px, ${ny * -9}px)`
      if (foreRef.current) foreRef.current.style.transform = `translate(${nx * -24}px, ${ny * -15}px)`
    })
  }
  const onLeave = () => {
    for (const r of [backRef, midRef, foreRef]) if (r.current) r.current.style.transform = ''
  }

  const selTerm = sel?.type === 'term' ? terms.find((t) => t.id === sel.id) : null
  const selLaw = sel?.type === 'law' ? laws.find((l) => l.id === sel.id) : null
  const selProc = sel?.type === 'proc' ? procs.find((p) => p.id === sel.id) : null
  const linkedLawIds = selTerm || selProc ? new Set(edges.filter((e) => e.from === (selTerm || selProc).id).map((e) => e.to)) : null
  const linkedFromIds = selLaw ? new Set(edges.filter((e) => e.to === selLaw.id).map((e) => e.from)) : null
  const lawTerms = selLaw ? terms.filter((t) => linkedFromIds.has(t.id)) : []
  const lawProcs = selLaw ? procs.filter((p) => linkedFromIds.has(p.id)) : []

  const dimCat = (c) => cat !== '전체' && c !== cat
  const edgeActive = (e) => ((selTerm || selProc) && e.from === (selTerm || selProc).id) || (selLaw && e.to === selLaw.id)
  const toggle = (type, id) => setSel(sel?.id === id ? null : { type, id })

  return (
    <div className="gmap-wrap" ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="gmap-tilt">
        <svg viewBox={`0 0 ${W} ${H}`} className="gmap-svg" role="img" aria-label="용어·절차·법령 온톨로지 맵">
          <defs>
            {GLOSSARY_CATEGORIES.map((c) => (
              <radialGradient key={c.key} id={`gmap-glow-${c.key}`}>
                <stop offset="0%" stopColor={CAT_COLOR[c.key]} stopOpacity="0.16" />
                <stop offset="60%" stopColor={CAT_COLOR[c.key]} stopOpacity="0.05" />
                <stop offset="100%" stopColor={CAT_COLOR[c.key]} stopOpacity="0" />
              </radialGradient>
            ))}
            <radialGradient id="gmap-glow-law">
              <stop offset="0%" stopColor="#f5b544" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#f5b544" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 배경층 — 별 + 성좌 글로우(가장 먼 층) */}
          <g ref={backRef} className="gmap-layer">
            {STARS.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} className="gmap-star" style={{ opacity: s.o, animationDelay: `${-s.d}s` }} />
            ))}
            {GLOSSARY_CATEGORIES.map((c) => (
              <circle key={c.key} cx={CAT_POS[c.key].x} cy={CAT_POS[c.key].y} r="185" fill={`url(#gmap-glow-${c.key})`} className={dimCat(c.key) ? 'dim' : ''} />
            ))}
            <circle cx={LAW_CENTER.x} cy={LAW_CENTER.y} r="150" fill="url(#gmap-glow-law)" />
          </g>

          {/* 중간층 — 간선 + 용어 성좌 */}
          <g ref={midRef} className="gmap-layer">
            {edges.map((e, i) => {
              const from = e.kind === 'term' ? terms.find((x) => x.id === e.from) : procs.find((x) => x.id === e.from)
              const l = laws.find((x) => x.id === e.to)
              if (!from || !l) return null
              const active = edgeActive(e)
              const dim = e.kind === 'term' && dimCat(from.category)
              return <line key={i} x1={from.x} y1={from.y} x2={l.x} y2={l.y} className={`gmap-edge${active ? ' on' : ''}${dim ? ' dim' : ''}`} />
            })}
            {GLOSSARY_CATEGORIES.map((c) => (
              <text key={c.key} x={CAT_POS[c.key].x} y={CAT_POS[c.key].y + 5} className={`gmap-cat${dimCat(c.key) ? ' dim' : ''}`} textAnchor="middle" style={{ fill: CAT_COLOR[c.key] }}>
                {c.label}
              </text>
            ))}
            {terms.map((t) => {
              const on = selTerm?.id === t.id || (linkedFromIds && linkedFromIds.has(t.id))
              const dim = dimCat(t.category)
              const short = t.term.length > 12 ? `${t.term.slice(0, 11)}…` : t.term
              const r = (on ? 6.5 : 4.2) * (0.85 + t.z * 0.5) // 깊이별 크기 — 공간감
              return (
                <g key={t.id} className={`gmap-term${on ? ' on' : ''}${dim ? ' dim' : ''}`} onClick={() => toggle('term', t.id)} role="button" tabIndex={0}
                   onKeyDown={(e) => e.key === 'Enter' && toggle('term', t.id)}>
                  <circle cx={t.x} cy={t.y} r="15" className="gmap-hit" />
                  <circle cx={t.x} cy={t.y} r={r * 2.2} style={{ fill: t.color, opacity: 0.1 + t.z * 0.14 }} />
                  <circle cx={t.x} cy={t.y} r={r} style={{ fill: t.color, opacity: 0.72 + t.z * 0.28 }} />
                  <text x={t.x} y={t.y + 17} textAnchor="middle" className="gmap-term-label" style={{ opacity: 0.66 + t.z * 0.34 }}>
                    {short}
                  </text>
                </g>
              )
            })}
          </g>

          {/* 전경층 — 법령 다이아 + 절차 스트립(가장 가까운 층) */}
          <g ref={foreRef} className="gmap-layer">
            {laws.map((l) => {
              const on = selLaw?.id === l.id || (linkedLawIds && linkedLawIds.has(l.id))
              return (
                <g key={l.id} className={`gmap-law${on ? ' on' : ''}`} onClick={() => toggle('law', l.id)} role="button" tabIndex={0}
                   onKeyDown={(e) => e.key === 'Enter' && toggle('law', l.id)}>
                  <circle cx={l.x} cy={l.y} r="18" className="gmap-hit" />
                  <rect x={l.x - 10} y={l.y - 10} width="20" height="20" transform={`rotate(45 ${l.x} ${l.y})`} rx="3.5" />
                  {l.label.split('\n').map((ln, i) => (
                    <text key={i} x={l.x} y={l.y + 26 + i * 13} textAnchor="middle" className="gmap-law-label">
                      {ln}
                    </text>
                  ))}
                </g>
              )
            })}
            {/* 절차 P01–P15 — 하단 아치 스트립 */}
            <text x={W / 2} y={612} textAnchor="middle" className="gmap-proc-cap">구축 절차 P01–P15 (로드맵)</text>
            {procs.map((p, i) => {
              const on = selProc?.id === p.id || (linkedFromIds && linkedFromIds.has(p.id))
              const hasEdge = edges.some((e) => e.from === p.id)
              return (
                <g key={p.id} className={`gmap-proc${on ? ' on' : ''}${hasEdge ? '' : ' quiet'}`} onClick={() => toggle('proc', p.id)} role="button" tabIndex={0}
                   onKeyDown={(e) => e.key === 'Enter' && toggle('proc', p.id)}>
                  <circle cx={p.x} cy={p.y} r="14" className="gmap-hit" />
                  <rect x={p.x - 7} y={p.y - 7} width="14" height="14" rx="4" />
                  <text x={p.x} y={p.y + (i % 2 ? 22 : -13)} textAnchor="middle" className="gmap-proc-label">
                    {p.id}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

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
              근거·연결:{' '}
              {laws.filter((l) => linkedLawIds.has(l.id)).map((l, i) => (
                <span key={l.id}>
                  {i > 0 && ' · '}
                  {l.url ? <a href={l.url} target="_blank" rel="noreferrer">{l.label.replace('\n', ' ')} ↗</a> : l.label.replace('\n', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {selLaw && (
        <div className="gmap-card" role="region" aria-label="법령 상세">
          <div className="gmap-card-head">
            <b>{selLaw.label.replace('\n', ' ')}</b>
            {selLaw.url && <a className="gmap-law-link" href={selLaw.url} target="_blank" rel="noreferrer">원문 ↗</a>}
            <button type="button" className="gmap-x" onClick={() => setSel(null)} aria-label="닫기">✕</button>
          </div>
          <div className="gmap-links">
            {lawTerms.length > 0 && <>인용 용어 {lawTerms.length}개: {lawTerms.map((t) => t.term).join(' · ')}<br /></>}
            {lawProcs.length > 0 && <>관련 절차: {lawProcs.map((p) => `${p.id} ${p.title}`).join(' · ')}</>}
          </div>
        </div>
      )}
      {selProc && (
        <div className="gmap-card" role="region" aria-label="절차 상세">
          <div className="gmap-card-head">
            <b>{selProc.id} · {selProc.title}</b>
            <Link className="gmap-law-link" to="/roadmap?view=frame">프로세스 프레임 ↗</Link>
            <button type="button" className="gmap-x" onClick={() => setSel(null)} aria-label="닫기">✕</button>
          </div>
          <div className="gmap-links">공개 근거: {selProc.basis}</div>
        </div>
      )}
      {!sel && <p className="gmap-hint">입자(용어) · 다이아(법령) · 사각(절차 P01–P15)를 클릭하면 정의와 연결이 표시됩니다 — 간선은 원문이 실제 인용한 법령만.</p>}
    </div>
  )
}
