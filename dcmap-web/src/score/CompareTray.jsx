/* 후보지 비교 트레이 — 부지 분석 스냅샷 2~3곳을 나란히 비교(부지선정 핵심 UX).
 * 스냅샷은 SitePanel에서 데이터 로드 후 '비교에 추가' 시점의 값으로 고정된다.
 * 근거점수 최고 후보에 '추천' 배지, 각 행에서 우수값을 강조. */
import { useState } from 'react'

const TONE = { good: 'tone-good', warn: 'tone-warn', bad: 'tone-bad' }

// 후보별 색상(레이더·표 헤더 공통) — 최대 3곳
const SERIES = ['#35d5ee', '#34d399', '#f5b544']

/* 레이더 5축 — 스코어링 엔진의 5축(전력40/토지25/리스크15/네트워크10/기상10)과 동일한 축.
 * 각 축은 스냅샷의 원시 지표에서 0~1로 정규화한다. 근거가 없으면 null(중심점 처리·정직).
 * n(v,max)=0~1 선형, 역방향(작을수록 좋음)은 1-비율. 여러 지표는 값 있는 것만 평균. */
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const avg = (arr) => {
  const xs = arr.filter((v) => v != null)
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}
const AXES = [
  {
    key: 'power',
    label: '전력',
    norm: (c) =>
      avg([
        c.approvalPct != null ? clamp01(c.approvalPct / 100) : null,
        c.gridMw != null ? clamp01(c.gridMw / 1000) : null,
        c.subKm != null ? clamp01(1 - c.subKm / 20) : null,
      ]),
  },
  {
    key: 'land',
    label: '토지',
    norm: (c) => (c.areaM2 != null ? clamp01(c.areaM2 / 200000) : null),
  },
  {
    key: 'risk',
    label: '리스크',
    // 안전할수록 높음 = 1 - 위험요소 평균(침수·산사태·인구밀도)
    norm: (c) => {
      const hazard = avg([
        c.floodPct != null ? clamp01(c.floodPct / 100) : null,
        c.landslidePct != null ? clamp01(c.landslidePct / 100) : null,
        c.density != null ? clamp01(c.density / 10000) : null,
      ])
      return hazard == null ? null : clamp01(1 - hazard)
    },
  },
  {
    key: 'net',
    label: '네트워크',
    norm: (c) => (c.netScore != null ? clamp01(c.netScore / 10) : null),
  },
  {
    key: 'climate',
    label: '기상',
    norm: (c) => (c.climateLevel != null ? clamp01((c.climateLevel - 1) / 4) : null),
  },
]

/* 5축 스파이더 차트 — 후보 2~3곳을 겹쳐 그린다(부지 숏리스트 한눈 비교). */
function CompareRadar({ items }) {
  const size = 230
  const cx = size / 2
  const cy = size / 2 + 4
  const R = 78
  const n = AXES.length
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n // 12시 방향 시작
  const pt = (i, r) => [cx + Math.cos(ang(i)) * R * r, cy + Math.sin(ang(i)) * R * r]

  // 후보별 정규화 축값(레이더 그리기 + 요약 배지)
  const series = items.map((c, si) => ({
    id: c.id,
    label: c.label,
    color: SERIES[si % SERIES.length],
    vals: AXES.map((a) => a.norm(c)),
  }))

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <div className="ct-radar">
      <svg viewBox={`0 0 ${size} ${size}`} className="ct-radar-svg" role="img" aria-label="후보지 5축 비교 레이더">
        {/* 배경 그리드(동심 오각형) */}
        {gridLevels.map((g) => (
          <polygon
            key={g}
            points={AXES.map((_, i) => pt(i, g).join(',')).join(' ')}
            className="ctr-grid"
          />
        ))}
        {/* 축선 + 라벨 */}
        {AXES.map((a, i) => {
          const [x, y] = pt(i, 1)
          const [lx, ly] = pt(i, 1.22)
          return (
            <g key={a.key}>
              <line x1={cx} y1={cy} x2={x} y2={y} className="ctr-axis" />
              <text x={lx} y={ly} className="ctr-label" textAnchor="middle" dominantBaseline="middle">
                {a.label}
              </text>
            </g>
          )
        })}
        {/* 후보 폴리곤 — 근거 없는 축은 중심(0) 처리 */}
        {series.map((s) => {
          const poly = s.vals.map((v, i) => pt(i, v ?? 0).join(',')).join(' ')
          return (
            <g key={s.id}>
              <polygon points={poly} className="ctr-shape" style={{ '--c': s.color }} />
              {s.vals.map((v, i) =>
                v == null ? null : (
                  <circle key={i} cx={pt(i, v)[0]} cy={pt(i, v)[1]} r="2.4" className="ctr-dot" style={{ '--c': s.color }} />
                ),
              )}
            </g>
          )
        })}
      </svg>
      <div className="ct-radar-legend">
        {series.map((s) => (
          <span key={s.id} className="ctr-leg">
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// 행 정의: get=표시값, tone=색, best=열 비교 시 '큰 값이 좋음(1)/작을수록 좋음(-1)/없음(0)'
const ROWS = [
  { key: 'score', label: '근거 점수', get: (c) => (c.score != null ? `${c.score}/${c.coverage}` : '–'), best: (c) => c.pct ?? null, dir: 1 },
  { key: 'zone', label: '입지', get: (c) => (c.nonCapital ? '비수도권' : '수도권'), tone: (c) => (c.nonCapital ? 'good' : 'warn') },
  { key: 'gridMw', label: '계통 공급여유', get: (c) => (c.gridMw != null ? `${c.gridMw.toLocaleString()}MW` : '–'), tone: (c) => (c.gridMw == null ? null : c.gridMw <= 10 ? 'bad' : c.gridMw <= 500 ? 'warn' : 'good'), best: (c) => c.gridMw, dir: 1 },
  { key: 'approval', label: 'DC 공급승인율', get: (c) => (c.approvalPct != null ? `${c.approvalPct}%` : '–'), tone: (c) => (c.approvalPct == null ? null : c.approvalPct >= 70 ? 'good' : c.approvalPct >= 45 ? 'warn' : 'bad'), best: (c) => c.approvalPct, dir: 1 },
  { key: 'subKm', label: '변전소 거리', get: (c) => (c.subKm != null ? `${c.subKm.toFixed(1)}km` : '–'), tone: (c) => (c.subKm == null ? null : c.subKm <= 3 ? 'good' : c.subKm <= 12 ? 'warn' : 'bad'), best: (c) => c.subKm, dir: -1 },
  { key: 'net', label: '네트워크', get: (c) => (c.netScore != null ? `${c.netScore}/10` : '–'), best: (c) => c.netScore, dir: 1 },
  { key: 'complex', label: '산단 거리', get: (c) => (c.icKm != null ? `${c.icKm.toFixed(1)}km` : '–'), tone: (c) => (c.icKm == null ? null : c.icKm <= 3 ? 'good' : c.icKm <= 15 ? 'warn' : 'bad'), best: (c) => c.icKm, dir: -1 },
  { key: 'area', label: '부지 면적', get: (c) => (c.areaM2 != null ? `${c.areaM2.toLocaleString()}㎡` : '–'), best: (c) => c.areaM2, dir: 1 },
  { key: 'climate', label: '냉각(기후)', get: (c) => c.climate || '–', tone: (c) => (c.climateLevel == null ? null : c.climateLevel >= 4 ? 'good' : c.climateLevel === 3 ? 'warn' : 'bad'), best: (c) => c.climateLevel, dir: 1 },
  { key: 'flood', label: '침수 노출', get: (c) => (c.floodPct == null ? '–' : c.floodPct <= 0 ? '낮음' : `${c.floodPct}%`), tone: (c) => (c.floodPct == null ? null : c.floodPct >= 30 ? 'bad' : c.floodPct > 0 ? 'warn' : 'good'), best: (c) => c.floodPct, dir: -1 },
  { key: 'landslide', label: '산사태 노출', get: (c) => (c.landslidePct == null ? '–' : c.landslidePct <= 0 ? '낮음' : `${c.landslidePct}%`), tone: (c) => (c.landslidePct == null ? null : c.landslidePct >= 30 ? 'bad' : c.landslidePct > 0 ? 'warn' : 'good'), best: (c) => c.landslidePct, dir: -1 },
  { key: 'density', label: '인구밀도', get: (c) => (c.density != null ? `${c.density.toLocaleString()}/km²` : '–'), tone: (c) => (c.density == null ? null : c.density < 3000 ? 'good' : 'warn'), best: (c) => c.density, dir: -1 },
  { key: 'zoneUse', label: '용도지역', get: (c) => c.zoneUse || '–' },
]

export default function CompareTray({ items, onRemove, onClear, onOpen }) {
  const [open, setOpen] = useState(false)
  if (!items?.length) return null

  // 근거 점수(비율) 최고 후보 = 추천
  const bestId = items.reduce((b, c) => ((c.pct ?? -1) > (b?.pct ?? -1) ? c : b), null)?.id

  // 비교 결과 PDF — 인쇄 최적화 HTML 표 → 브라우저 PDF
  const onPdf = () => {
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const thead = `<tr><th>지표</th>${items.map((c) => `<th${c.id === bestId ? ' class="best"' : ''}>${esc(c.label)}${c.id === bestId ? ' ★' : ''}</th>`).join('')}</tr>`
    const body = ROWS.map((row) => `<tr><td class="rl">${esc(row.label)}</td>${items.map((c) => `<td>${esc(row.get(c))}</td>`).join('')}</tr>`).join('')
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>AI InfraMap 후보지 비교</title><style>
      @page{margin:14mm;size:landscape}
      body{font-family:'Pretendard Variable',-apple-system,'Malgun Gothic',sans-serif;color:#111;padding:16px;font-size:12px}
      h1{font-size:18px;border-bottom:2px solid #111;padding-bottom:6px}
      table{border-collapse:collapse;width:100%;margin-top:10px}
      th,td{border:1px solid #ccc;padding:6px 9px;text-align:center}
      th{background:#f0f4f8}th.best{background:#fff3cf}
      td.rl{text-align:left;font-weight:700;background:#fafafa}
      .foot{margin-top:12px;color:#888;font-size:10px}
    </style></head><body><h1>AI InfraMap — 후보지 비교 (${items.length}곳)</h1>
    <table><thead>${thead}</thead><tbody>${body}</tbody></table>
    <p class="foot">★ = 근거 점수 최고 후보 · 공개 데이터 기반 정적 근거 · ${new Date().toLocaleString('ko-KR')} · AI InfraMap</p>
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>`)
    w.document.close()
  }

  // 각 행에서 최우수 후보 id 계산(값 있는 후보만)
  const rowBest = {}
  for (const row of ROWS) {
    if (!row.best) continue
    let bId = null
    let bVal = null
    for (const c of items) {
      const v = row.best(c)
      if (v == null) continue
      if (bVal == null || (row.dir > 0 ? v > bVal : v < bVal)) {
        bVal = v
        bId = c.id
      }
    }
    rowBest[row.key] = items.length > 1 ? bId : null
  }

  return (
    <div className={`compare-tray ${open ? 'open' : ''}`}>
      <div className="ct-head">
        <button type="button" className="ct-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          ⚖ 후보지 비교 <strong>{items.length}</strong>곳 {open ? '▾' : '▸'}
        </button>
        <button type="button" className="chip" onClick={onPdf} title="후보지 비교표 PDF 저장">
          PDF
        </button>
        <button type="button" className="chip" onClick={onClear}>
          전체 지우기
        </button>
      </div>
      {open && items.length > 1 && <CompareRadar items={items} />}
      {open && (
        <div className="ct-table" role="table" style={{ '--ct-cols': items.length }}>
          <div className="ct-row ct-colhead" role="row">
            <span className="ct-rowlabel" />
            {items.map((c, ci) => (
              <span key={c.id} className="ct-col" role="columnheader">
                <i className="ct-swatch" style={{ background: SERIES[ci % SERIES.length] }} />
                {c.id === bestId && <span className="ct-badge">추천</span>}
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
                const isBest = rowBest[row.key] && rowBest[row.key] === c.id
                return (
                  <span key={c.id} className={`ct-cell ${t ? TONE[t] : ''} ${isBest ? 'ct-best' : ''}`} role="cell">
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
