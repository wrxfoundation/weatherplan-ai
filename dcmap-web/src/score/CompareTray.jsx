/* 후보지 비교 트레이 — 부지 분석 스냅샷 2~3곳을 나란히 비교(부지선정 핵심 UX).
 * 스냅샷은 SitePanel에서 데이터 로드 후 '비교에 추가' 시점의 값으로 고정된다.
 * 근거점수 최고 후보에 '추천' 배지, 각 행에서 우수값을 강조. */
import { useEffect, useState } from 'react'
import { useAiStream } from '../ai/useAiStream.js'
import AiResultCard from '../ai/AiResultCard.jsx'
import { psiaScore, psiaOutlook } from './psia.js'
import { useMapLang } from '../i18n/mapLang.js'

/* i18n 사전 — 라벨만 번역(값·데이터·AI 프롬프트 키는 원본 유지). psia.js 파생 outlook은 EN 시 labelEn 사용(공유 모듈). */
const AXIS_EN = { 전력: 'Power', 토지: 'Land', 리스크: 'Risk', 네트워크: 'Network', 기상: 'Climate' }
const PROFILE_EN = { 균형: 'Balanced', '전력 중시': 'Power-first', '냉각 중시': 'Cooling-first' }
const ROWLABEL_EN = {
  '근거 점수': 'Evidence score', '계통영향평가 전망': 'Grid impact outlook', 입지: 'Region', '계통 공급여유': 'Grid headroom',
  'DC 공급승인율': 'DC approval rate', '변전소 거리': 'Substation distance', 네트워크: 'Network', '산단 거리': 'Ind. complex distance',
  '부지 면적': 'Site area', '냉각(기후)': 'Cooling (climate)', '침수 노출': 'Flood exposure', '산사태 노출': 'Landslide exposure',
  인구밀도: 'Population density', 용도지역: 'Zoning',
}
const VAL_EN = { 비수도권: 'Non-capital', 수도권: 'Capital', 낮음: 'Low' }

// 후보의 계통영향평가 통과 전망(공유 로직) — 스냅샷 필드로 산출
const psiaOf = (c) => {
  const { composite } = psiaScore({ nonCapital: c.nonCapital, mw: c.mw ?? 40, gridMw: c.gridMw ?? null, approvalPct: c.approvalPct ?? null, subKm: c.subKm ?? null })
  return { composite, outlook: psiaOutlook(composite, c.mw ?? 40) }
}

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

/* 축 가중치 프로파일 — 우선순위에 따라 5축 배점을 달리해 가중 적합도를 재계산.
 * 균형=스코어링 엔진 기본 배점(전력40/토지25/리스크15/네트워크10/기상10). */
const PROFILES = [
  { key: 'balanced', label: '균형', w: { power: 40, land: 25, risk: 15, net: 10, climate: 10 } },
  { key: 'power', label: '전력 중시', w: { power: 55, land: 18, risk: 10, net: 10, climate: 7 } },
  { key: 'climate', label: '냉각 중시', w: { power: 30, land: 18, risk: 15, net: 10, climate: 27 } },
]

// 가중 적합도(0~100) — 근거 없는 축(null)은 0점 처리(폴리곤과 동일·정직).
function weightedScore(vals, w) {
  let sum = 0
  let wsum = 0
  AXES.forEach((a, i) => {
    const wt = w[a.key] ?? 0
    wsum += wt
    sum += (vals[i] ?? 0) * wt
  })
  return wsum ? Math.round((sum / wsum) * 100) : 0
}

/* 5축 스파이더 차트 — 후보 2~3곳을 겹쳐 그린다(부지 숏리스트 한눈 비교). */
function CompareRadar({ items, en }) {
  const axL = (ko) => (en ? AXIS_EN[ko] ?? ko : ko)
  const profL = (ko) => (en ? PROFILE_EN[ko] ?? ko : ko)
  const [profileKey, setProfileKey] = useState('balanced')
  const profile = PROFILES.find((p) => p.key === profileKey) ?? PROFILES[0]
  const size = 230
  const cx = size / 2
  const cy = size / 2 + 4
  const R = 78
  const n = AXES.length
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n // 12시 방향 시작
  const pt = (i, r) => [cx + Math.cos(ang(i)) * R * r, cy + Math.sin(ang(i)) * R * r]

  // 후보별 정규화 축값 + 현재 프로파일 가중 적합도
  const series = items.map((c, si) => {
    const vals = AXES.map((a) => a.norm(c))
    return {
      id: c.id,
      label: c.label,
      color: SERIES[si % SERIES.length],
      vals,
      fit: weightedScore(vals, profile.w),
    }
  })
  // 현재 프로파일 기준 최고 적합도 후보
  const bestFitId = series.reduce((b, s) => (s.fit > (b?.fit ?? -1) ? s : b), null)?.id

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <div className="ct-radar">
      {/* 축 가중치 프로파일 토글 — 우선순위별 적합도 재계산 */}
      <div className="ctr-profiles" role="group" aria-label={en ? 'Axis weight profile' : '축 가중치 프로파일'}>
        {PROFILES.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`ctr-prof ${p.key === profileKey ? 'on' : ''}`}
            onClick={() => setProfileKey(p.key)}
            aria-pressed={p.key === profileKey}
            title={en
              ? `${profL(p.label)} — Power ${p.w.power}·Land ${p.w.land}·Risk ${p.w.risk}·Network ${p.w.net}·Climate ${p.w.climate}`
              : `${p.label} — 전력 ${p.w.power}·토지 ${p.w.land}·리스크 ${p.w.risk}·네트워크 ${p.w.net}·기상 ${p.w.climate}`}
          >
            {profL(p.label)}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${size} ${size}`} className="ct-radar-svg" role="img" aria-label={en ? 'Candidate 5-axis comparison radar' : '후보지 5축 비교 레이더'}>
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
                {axL(a.label)}
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
          <span key={s.id} className={`ctr-leg ${s.id === bestFitId ? 'best' : ''}`}>
            <i style={{ background: s.color }} />
            {s.label}
            <b className="ctr-fit">{s.fit}</b>
            {s.id === bestFitId && <span className="ctr-fit-star" title={en ? `Highest fit under ${profL(profile.label)}` : `${profile.label} 기준 적합도 최고`}>★</span>}
          </span>
        ))}
      </div>
      <p className="ctr-note">{en ? `${profL(profile.label)} weighted fit (out of 100) · axes without basis score 0` : `${profile.label} 가중 적합도(100점 환산) · 근거 없는 축은 0점`}</p>
    </div>
  )
}

// 행 정의: get=표시값, tone=색, best=열 비교 시 '큰 값이 좋음(1)/작을수록 좋음(-1)/없음(0)'
const ROWS = [
  { key: 'score', label: '근거 점수', get: (c) => (c.score != null ? `${c.score}/${c.coverage}` : '–'), best: (c) => c.pct ?? null, dir: 1 },
  {
    key: 'psia',
    label: '계통영향평가 전망',
    get: (c, en) => {
      const { composite, outlook } = psiaOf(c)
      const lbl = en ? (outlook.labelEn ?? outlook.label) : outlook.label
      const short = en ? lbl.replace('Pass ', '') : lbl.replace('통과 ', '')
      return composite == null ? lbl : `${composite} · ${short}`
    },
    tone: (c) => psiaOf(c).outlook.tone,
    best: (c) => psiaOf(c).composite,
    dir: 1,
  },
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
  const en = useMapLang() === 'en'
  const rowL = (ko) => (en ? ROWLABEL_EN[ko] ?? ko : ko)
  const valL = (v) => (en ? VAL_EN[v] ?? v : v)
  const [open, setOpen] = useState(false)
  const { ai, run, reset, busy } = useAiStream()
  // 후보 구성이 바뀌면 이전 비교평 무효화(오판 방지)
  const idsKey = (items || []).map((c) => c.id).join('|')
  useEffect(() => {
    reset()
  }, [idsKey, reset])

  if (!items?.length) return null

  // 근거 점수(비율) 최고 후보 = 추천
  const bestId = items.reduce((b, c) => ((c.pct ?? -1) > (b?.pct ?? -1) ? c : b), null)?.id

  // AI 비교평 — 스냅샷의 확보된 값만 넘긴다(없으면 프롬프트가 '미확보' 처리)
  const genCompare = () => {
    setOpen(true) // 접힌 상태에서 눌러도 로딩/결과가 보이도록 자동 펼침(무피드백 데드 상태 방지)
    const data = items.map((c) => ({
      후보: c.label,
      입지: c.nonCapital ? '비수도권' : '수도권',
      근거점수: c.score != null ? `${c.score}/${c.coverage}` : null,
      비율pct: c.pct ?? null,
      계통공급여유MW: c.gridMw ?? null,
      DC승인율pct: c.approvalPct ?? null,
      변전소km: c.subKm ?? null,
      네트워크점수10: c.netScore ?? null,
      산단km: c.icKm ?? null,
      부지면적m2: c.areaM2 ?? null,
      기후: c.climate ?? null,
      기후등급: c.climateLevel ?? null,
      침수노출pct: c.floodPct ?? null,
      산사태노출pct: c.landslidePct ?? null,
      인구밀도: c.density ?? null,
      용도지역: c.zoneUse ?? null,
      // 계통영향평가 통과 전망(규칙 추정 — 공식 판정 아님) — AI 비교평이 인용
      계통영향평가전망: (() => {
        const { composite, outlook } = psiaOf(c)
        return composite == null ? '데이터 대기' : `${composite}/100 · ${outlook.label}`
      })(),
    }))
    run('compare', { data })
  }

  // 비교 결과 PDF — 인쇄 최적화 HTML 표 → 브라우저 PDF
  const onPdf = () => {
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const thead = `<tr><th>${en ? 'Metric' : '지표'}</th>${items.map((c) => `<th${c.id === bestId ? ' class="best"' : ''}>${esc(c.label)}${c.id === bestId ? ' ★' : ''}</th>`).join('')}</tr>`
    const body = ROWS.map((row) => `<tr><td class="rl">${esc(rowL(row.label))}</td>${items.map((c) => `<td>${esc(valL(row.get(c, en)))}</td>`).join('')}</tr>`).join('')
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!doctype html><html lang="${en ? 'en' : 'ko'}"><head><meta charset="utf-8"><title>${en ? 'AI InfraMap candidate comparison' : 'AI InfraMap 후보지 비교'}</title><style>
      /* A4 가로 규격 고정 — 프린터 기본값 의존 제거 */
      @page{margin:14mm;size:A4 landscape}
      body{font-family:'Pretendard Variable',-apple-system,'Malgun Gothic',sans-serif;color:#111;padding:16px;font-size:12px;word-break:keep-all}
      h1{font-size:18px;border-bottom:2px solid #111;padding-bottom:6px;break-after:avoid}
      table{border-collapse:collapse;width:100%;margin-top:10px}
      thead{display:table-header-group}
      tr{break-inside:avoid}
      th,td{border:1px solid #ccc;padding:6px 9px;text-align:center;overflow-wrap:anywhere}
      th{background:#f0f4f8;-webkit-print-color-adjust:exact;print-color-adjust:exact}th.best{background:#fff3cf;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      td.rl{text-align:left;font-weight:700;background:#fafafa;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .foot{margin-top:12px;color:#888;font-size:10px}
      @media print{body{padding:0}}
    </style></head><body><h1>${en ? `AI InfraMap — candidate comparison (${items.length})` : `AI InfraMap — 후보지 비교 (${items.length}곳)`}</h1>
    <table><thead>${thead}</thead><tbody>${body}</tbody></table>
    <p class="foot">${en ? `★ = highest evidence-score candidate · static basis from public data · ${new Date().toLocaleString('en-US')} · AI InfraMap` : `★ = 근거 점수 최고 후보 · 공개 데이터 기반 정적 근거 · ${new Date().toLocaleString('ko-KR')} · AI InfraMap`}</p>
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
          {en ? <>⚖ Candidate comparison <strong>{items.length}</strong> {open ? '▾' : '▸'}</> : <>⚖ 후보지 비교 <strong>{items.length}</strong>곳 {open ? '▾' : '▸'}</>}
        </button>
        {items.length > 1 && (
          <button type="button" className="chip ai" onClick={genCompare} disabled={busy} title={en ? 'AI candidate comparison' : '후보 AI 비교평'}>
            {busy ? 'AI…' : en ? '✨ AI comparison' : '✨ AI 비교평'}
          </button>
        )}
        <button type="button" className="chip" onClick={onPdf} title={en ? 'Save comparison table as PDF' : '후보지 비교표 PDF 저장'}>
          PDF
        </button>
        <button type="button" className="chip" onClick={onClear}>
          {en ? 'Clear all' : '전체 지우기'}
        </button>
      </div>
      {open && (
        <AiResultCard
          ai={ai}
          badge={en ? '✨ AI comparison' : '✨ AI 비교평'}
          src={en ? 'Based on snapshot-captured values · missing values not captured' : '스냅샷 확보값 기반 · 없는 값은 미확보'}
          className="ct-ai"
          loadingText={en ? 'Analyzing candidate comparison…' : '후보 비교 분석 중…'}
        />
      )}
      {open && items.length > 1 && <CompareRadar items={items} en={en} />}
      {open && (
        <div className="ct-table" role="table" style={{ '--ct-cols': items.length }}>
          <div className="ct-row ct-colhead" role="row">
            <span className="ct-rowlabel" />
            {items.map((c, ci) => (
              <span key={c.id} className="ct-col" role="columnheader">
                <i className="ct-swatch" style={{ background: SERIES[ci % SERIES.length] }} />
                {c.id === bestId && <span className="ct-badge">{en ? 'Top pick' : '추천'}</span>}
                <button type="button" className="ct-open" onClick={() => onOpen(c)} title={en ? 'Re-analyze this point' : '이 지점 다시 분석'}>
                  {c.label}
                </button>
                <button type="button" className="ct-remove" onClick={() => onRemove(c.id)} aria-label={en ? 'Remove from comparison' : '비교에서 제거'}>
                  ✕
                </button>
              </span>
            ))}
          </div>
          {ROWS.map((row) => (
            <div key={row.key} className="ct-row" role="row">
              <span className="ct-rowlabel">{rowL(row.label)}</span>
              {items.map((c) => {
                const t = row.tone?.(c)
                const isBest = rowBest[row.key] && rowBest[row.key] === c.id
                return (
                  <span key={c.id} className={`ct-cell ${t ? TONE[t] : ''} ${isBest ? 'ct-best' : ''}`} role="cell">
                    {valL(row.get(c, en))}
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
