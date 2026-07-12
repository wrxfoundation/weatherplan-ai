/* 후보지 비교 트레이 — 부지 분석 스냅샷 2~3곳을 나란히 비교(부지선정 핵심 UX).
 * 스냅샷은 SitePanel에서 데이터 로드 후 '비교에 추가' 시점의 값으로 고정된다. */
import { useState } from 'react'

const TONE = { good: 'tone-good', warn: 'tone-warn', bad: 'tone-bad' }

// 행 정의: 각 후보에서 값·톤을 뽑는 함수. 값 없으면 '–'.
const ROWS = [
  { key: 'score', label: '근거 점수', get: (c) => (c.score != null ? `${c.score}/${c.coverage}` : '–') },
  { key: 'zone', label: '입지', get: (c) => (c.nonCapital ? '비수도권' : '수도권'), tone: (c) => (c.nonCapital ? 'good' : 'warn') },
  { key: 'headroom', label: '계통 여유', get: (c) => (c.headroomMw != null ? `${c.headroomMw.toLocaleString()}MW` : '–'), tone: (c) => (c.headroomMw != null ? 'good' : null) },
  { key: 'gridMw', label: '공급여유(시도)', get: (c) => (c.gridMw != null ? `${c.gridMw.toLocaleString()}MW` : '–'), tone: (c) => (c.gridMw == null ? null : c.gridMw <= 10 ? 'bad' : c.gridMw <= 500 ? 'warn' : 'good') },
  { key: 'climate', label: '냉각(기후)', get: (c) => c.climate || '–', tone: (c) => (c.climateLevel == null ? null : c.climateLevel <= 2 ? 'good' : c.climateLevel === 3 ? 'warn' : 'bad') },
  { key: 'flood', label: '침수 노출', get: (c) => (c.floodPct == null ? '–' : c.floodPct <= 0 ? '낮음' : `${c.floodPct}%`), tone: (c) => (c.floodPct == null ? null : c.floodPct >= 30 ? 'bad' : c.floodPct > 0 ? 'warn' : 'good') },
  { key: 'landslide', label: '산사태 노출', get: (c) => (c.landslidePct == null ? '–' : c.landslidePct <= 0 ? '낮음' : `${c.landslidePct}%`), tone: (c) => (c.landslidePct == null ? null : c.landslidePct >= 30 ? 'bad' : c.landslidePct > 0 ? 'warn' : 'good') },
  { key: 'density', label: '인구밀도', get: (c) => (c.density != null ? `${c.density.toLocaleString()}/km²` : '–'), tone: (c) => (c.density == null ? null : c.density < 3000 ? 'good' : 'warn') },
  { key: 'zoneUse', label: '용도지역', get: (c) => c.zoneUse || '–' },
  { key: 'plant', label: '발전단지', get: (c) => (c.plantKm != null ? `${Math.round(c.plantKm)}km` : '–') },
]

export default function CompareTray({ items, onRemove, onClear, onOpen }) {
  const [open, setOpen] = useState(false)
  if (!items?.length) return null
  return (
    <div className={`compare-tray ${open ? 'open' : ''}`}>
      <div className="ct-head">
        <button type="button" className="ct-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          ⚖ 후보지 비교 <strong>{items.length}</strong>곳 {open ? '▾' : '▸'}
        </button>
        <button type="button" className="chip" onClick={onClear}>
          전체 지우기
        </button>
      </div>
      {open && (
        <div className="ct-table" role="table" style={{ '--ct-cols': items.length }}>
          <div className="ct-row ct-colhead" role="row">
            <span className="ct-rowlabel" />
            {items.map((c) => (
              <span key={c.id} className="ct-col" role="columnheader">
                <button type="button" className="ct-open" onClick={() => onOpen(c)} title="이 지점 다시 분석">
                  {c.label}
                </button>
                <button type="button" className="ct-remove" onClick={() => onRemove(c.id)} aria-label="비교에서 제거">
                  ✕
                </button>
              </span>
            ))}
          </div>
          {ROWS.map((row) => (
            <div key={row.key} className="ct-row" role="row">
              <span className="ct-rowlabel">{row.label}</span>
              {items.map((c) => {
                const t = row.tone?.(c)
                return (
                  <span key={c.id} className={`ct-cell ${t ? TONE[t] : ''}`} role="cell">
                    {row.get(c)}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
