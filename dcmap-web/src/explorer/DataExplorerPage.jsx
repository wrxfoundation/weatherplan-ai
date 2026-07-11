import { useMemo, useState, useEffect } from 'react'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL } from '../data/facilities.js'
import { GEN_RECENT, GEN_LICENSE_META } from '../data/genLicenses.js'
import { CHP_PLANTS } from '../data/chpPlants.js'
import { toCsv, downloadCsv } from '../data/csv.js'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

// 데이터셋 정의 — 각 축적 자료를 검색·다운로드 가능하게 노출
const DATASETS = [
  {
    key: 'gen',
    label: '발전사업 허가 (2024+)',
    asOf: '2026-04-17',
    source: '3MW 초과 발전사업 허가대장 v2',
    fullCsv: `${BASE}/downloads/gen_licenses_full.csv`,
    fullLabel: `전체 ${GEN_LICENSE_META.total.toLocaleString()}건(2001–2026) CSV`,
    columns: [
      { k: 'date', label: '허가일' },
      { k: 'sido', label: '시도' },
      { k: 'name', label: '상호(사업자)' },
      { k: 'fuel', label: '원동력' },
      { k: 'mw', label: '용량MW(참고치)' },
      { k: 'y', label: '허가연도' },
    ],
    rows: GEN_RECENT.map((r) => ({ date: r.date || '', sido: r.sido || '', name: r.name || '', fuel: r.fuel || '', mw: r.mw ?? '', y: r.y })),
  },
  {
    key: 'chp',
    label: '집단에너지(열병합) 발전소',
    asOf: '2025-07-01',
    source: '집단에너지 발전용량·공급량 현황',
    fullCsv: `${BASE}/downloads/chp_plants.csv`,
    fullLabel: '전체 56곳 CSV',
    columns: [
      { k: 'op', label: '발전사' },
      { k: 'plant', label: '대상발전소' },
      { k: 'loc', label: '관리소' },
      { k: 'commission', label: '공급년월' },
      { k: 'mw', label: '발전용량MW' },
    ],
    rows: CHP_PLANTS.map((p) => ({ op: p.op, plant: p.plant, loc: p.loc, commission: p.commission, mw: p.mw ?? '' })),
  },
  {
    key: 'dc',
    label: '데이터센터 시설 시드',
    asOf: '2026-07-10',
    source: 'AI InfraMap 시드 v0.1 (공개 소스 집계)',
    fullCsv: null,
    columns: [
      { k: 'name', label: '시설명' },
      { k: 'operator', label: '운영사' },
      { k: 'sido', label: '시도' },
      { k: 'sigungu', label: '시군구' },
      { k: 'type', label: '유형' },
      { k: 'status', label: '상태' },
      { k: 'mw', label: '공개전력MW' },
      { k: 'year', label: '연도' },
    ],
    rows: FACILITIES.map((f) => ({
      name: f.name, operator: f.operator || '', sido: f.sido || '', sigungu: f.sigungu || '',
      type: f.type || '', status: STATUS_LABEL[f.status] || f.status || '', mw: f.power_mw_public ?? '', year: f.year ?? '',
    })),
  },
]

export default function DataExplorerPage() {
  const [tab, setTab] = useState('gen')
  const [q, setQ] = useState('')
  useEffect(() => {
    document.title = '데이터 탐색기 — 축적 자료 검색·CSV 다운로드 · AI InfraMap'
    setQ('')
  }, [])

  const ds = DATASETS.find((d) => d.key === tab)
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return ds.rows
    return ds.rows.filter((r) => ds.columns.some((c) => String(r[c.k] ?? '').toLowerCase().includes(needle)))
  }, [ds, q])

  return (
    <>
      <TopBar />
      <div className="power-page">
        <div className="eyebrow">DATA</div>
        <h1 className="power-title">데이터 탐색기 — 축적 자료 검색 · CSV 다운로드</h1>
        <p className="power-note">
          AI InfraMap이 흡수한 원천 자료를 직접 검색하고 CSV로 내려받을 수 있습니다. 각 데이터셋의 <strong>기준일</strong>을
          함께 표기 — 발전 허가대장 2026-04, 집단에너지 2025-07, 시설 시드 2026-07로 대부분 2025~2026 최신입니다.
          (KDCC 시설 수 165는 2024 조사가 현재 공표된 최신치입니다.)
        </p>

        <div className="seg-tabs" role="tablist" aria-label="데이터셋 분류">
          {DATASETS.map((d) => (
            <button key={d.key} type="button" role="tab" className={`seg-tab ${tab === d.key ? 'on' : ''}`} onClick={() => { setTab(d.key); setQ('') }} aria-selected={tab === d.key}>
              {d.label} <span className="n">{d.rows.length.toLocaleString()}</span>
            </button>
          ))}
        </div>

        <div className="explorer-bar">
          <input
            className="explorer-search"
            type="search"
            placeholder={`${ds.label} 검색 (상호·지역·연료 등)`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="데이터 검색"
          />
          <span className="explorer-count">
            {filtered.length.toLocaleString()} / {ds.rows.length.toLocaleString()}건
          </span>
          <button
            type="button"
            className="btn primary"
            onClick={() => downloadCsv(`aiinframap_${ds.key}_${q ? 'filtered_' : ''}${ds.asOf}.csv`, toCsv(ds.columns, filtered))}
          >
            ⬇ CSV 다운로드{q ? ' (검색결과)' : ''}
          </button>
          {ds.fullCsv && (
            <a className="btn" href={ds.fullCsv} download>
              ⬇ {ds.fullLabel}
            </a>
          )}
        </div>
        <p className="chart-note" style={{ marginTop: 6 }}>
          기준일 <strong>{ds.asOf}</strong> · 출처: {ds.source}. 표는 상위 300건 표시(검색·CSV는 전체 대상). 용량(MW)은 참고치.
        </p>

        <div className="explorer-table-wrap">
          <table className="explorer-table">
            <thead>
              <tr>{ds.columns.map((c) => <th key={c.k}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.slice(0, 300).map((r, i) => (
                <tr key={i}>
                  {ds.columns.map((c) => <td key={c.k}>{r[c.k] === '' || r[c.k] == null ? '—' : String(r[c.k])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="chart-note" style={{ padding: '12px' }}>검색 결과가 없습니다.</p>}
        </div>
      </div>
    </>
  )
}
