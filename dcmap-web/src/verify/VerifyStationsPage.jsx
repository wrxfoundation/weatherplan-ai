import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import VerifyShell, { verifyMapPath } from './VerifyShell.jsx'
import LineIcon from '../components/LineIcon.jsx'
import { useMapLang } from '../i18n/mapLang.js'
import { ASOS_STATIONS, STATIONS_META } from './stationsData.js'
import { toCsv, downloadCsv } from '../data/csv.js'
import './verify.css'

/* 웨더팩트 관측지점 탐색기 — dcmap DataExplorer 헤리티지(검색·정렬·CSV 다운로드)를 ASOS 지점 목록에 이식.
 * 역할: 리포트 근거가 되는 관측지점 원천 목록을 투명하게 공개 — 필터·정렬·CSV로 검수 가능하게.
 * 정직성: 좌표·관측개시는 근사값(STATIONS_META.verified=false) — 상단 고지·CSV 주석줄·하단 출처에 상시 표기. */

const SORT_KEYS = ['id', 'name', 'since']

/* 표 스타일 — verify.css는 표 스타일이 없고 수정 금지 대상이라 자기 소유 최소 인라인로만 */
const S = {
  scroll: { overflowX: 'auto', margin: '0 -4px', padding: '0 4px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', lineHeight: 'var(--lh-base)' },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--line)', color: 'var(--grey)', fontWeight: 600, whiteSpace: 'nowrap' },
  thBtn: { background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' },
  td: { padding: '7px 10px', borderBottom: '1px solid color-mix(in srgb, var(--line) 55%, transparent)', whiteSpace: 'nowrap' },
  num: { fontVariantNumeric: 'tabular-nums' },
}

export default function VerifyStationsPage() {
  const en = useMapLang() === 'en'
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: 'id', dir: 1 })

  useEffect(() => {
    document.title = en ? 'WeatherFact — Station Explorer' : '웨더팩트 — 관측지점 탐색기'
  }, [en])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = !needle
      ? [...ASOS_STATIONS]
      : ASOS_STATIONS.filter(
          (s) => String(s.id).includes(needle) || s.name.includes(needle) || s.nameEn.toLowerCase().includes(needle)
        )
    const { key, dir } = sort
    list.sort((a, b) => {
      if (key === 'name') return (en ? a.nameEn.localeCompare(b.nameEn) : a.name.localeCompare(b.name, 'ko')) * dir
      return (a[key] - b[key]) * dir
    })
    return list
  }, [q, sort, en])

  const onSort = (key) => setSort((s) => (s.key === key ? { key, dir: -s.dir } : { key, dir: 1 }))
  const arrow = (key) => (sort.key === key ? (sort.dir === 1 ? ' ▲' : ' ▼') : '')

  const onCsv = () => {
    const columns = [
      { k: 'id', label: en ? 'station_id' : '지점번호' },
      { k: 'name', label: en ? 'name_ko' : '지점명' },
      { k: 'nameEn', label: en ? 'name_en' : '지점명(EN)' },
      { k: 'lat', label: en ? 'lat_approx' : '위도(근사)' },
      { k: 'lon', label: en ? 'lon_approx' : '경도(근사)' },
      { k: 'since', label: en ? 'obs_since_approx' : '관측개시(근사)' },
    ]
    const body = toCsv(columns, rows).replace(/^﻿/, '')
    // 정직성: CSV에도 근사값 고지 주석줄 동봉 — 파일만 돌아다녀도 출처·한계가 따라가게 (BOM은 Excel 한글 호환)
    const comment = `# ${STATIONS_META.source} · ${STATIONS_META.note} · ${STATIONS_META.updated}`
    downloadCsv('weatherfact_asos_stations.csv', '﻿' + comment + '\n' + body)
  }

  return (
    <VerifyShell>
      <main className="verify-page">
        <header className="vf-hero" style={{ paddingBottom: 10 }}>
          <h1 style={{ margin: 0, fontSize: 'var(--text-title)', fontWeight: 'var(--weight-bold)' }}>
            {en ? 'Station Explorer' : '관측지점 탐색기'}
          </h1>
          <p className="vf-muted" style={{ marginTop: 8 }}>
            {en
              ? `All ${ASOS_STATIONS.length} KMA ASOS stations used for report matching — filter, sort, download as CSV.`
              : `리포트 매칭에 쓰는 기상청 ASOS ${ASOS_STATIONS.length}개 지점 전체 — 필터·정렬·CSV 다운로드.`}
          </p>
        </header>

        {/* 정직성 고지 — STATIONS_META 그대로 */}
        <section className="vf-card vf-honesty" style={{ marginTop: 0, marginBottom: 18 }}>
          <h3>
            <LineIcon name="risk" size={14} /> {en ? 'Honesty notice' : '정직성 고지'}
          </h3>
          <ul>
            <li>
              <span className="vf-soon-badge">{en ? 'Verification pending' : '검증 대기'}</span>{' '}
              {en
                ? `Coordinates and observation-start years are approximate values pending pipeline verification (${STATIONS_META.note}). Station IDs and names follow published KMA station metadata.`
                : `좌표·관측개시 연도는 근사값입니다 — ${STATIONS_META.note}. 지점번호·지점명은 기상청 공개 지점 메타데이터 기준입니다.`}
            </li>
            <li>
              {en
                ? 'Only stations we are confident exist are listed — accuracy over count. Nothing here is fabricated.'
                : '확신 있는 실존 지점만 수록합니다(개수보다 정확성). 없는 수치는 만들지 않습니다.'}
            </li>
          </ul>
        </section>

        <section className="vf-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={en ? 'Filter by name or station ID' : '지점명·지점번호 필터'}
              aria-label={en ? 'Filter stations' : '지점 필터'}
              style={{ flex: '1 1 200px', minWidth: 160 }}
            />
            <span className="vf-muted" style={{ margin: 0 }}>
              {rows.length}/{ASOS_STATIONS.length}
            </span>
            <button type="button" className="btn" onClick={onCsv} disabled={!rows.length}>
              {en ? 'Download CSV' : 'CSV 다운로드'}
            </button>
          </div>

          <div style={S.scroll}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th} aria-sort={sort.key === 'id' ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" style={S.thBtn} onClick={() => onSort('id')}>
                      {en ? 'ID' : '지점번호'}{arrow('id')}
                    </button>
                  </th>
                  <th style={S.th} aria-sort={sort.key === 'name' ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" style={S.thBtn} onClick={() => onSort('name')}>
                      {en ? 'Name' : '지점명'}{arrow('name')}
                    </button>
                  </th>
                  <th style={S.th}>{en ? 'Lat (approx)' : '위도(근사)'}</th>
                  <th style={S.th}>{en ? 'Lon (approx)' : '경도(근사)'}</th>
                  <th style={S.th} aria-sort={sort.key === 'since' ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" style={S.thBtn} onClick={() => onSort('since')}>
                      {en ? 'Obs. since' : '관측개시'}{arrow('since')}
                    </button>
                  </th>
                  <th style={S.th}>{en ? 'Map' : '맵'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td style={{ ...S.td, ...S.num }}>{s.id}</td>
                    <td style={S.td}>
                      <b>{en ? s.nameEn : s.name}</b> <span className="vf-station-id">{en ? s.name : s.nameEn}</span>
                    </td>
                    <td style={{ ...S.td, ...S.num }}>{s.lat.toFixed(3)}</td>
                    <td style={{ ...S.td, ...S.num }}>{s.lon.toFixed(3)}</td>
                    <td style={{ ...S.td, ...S.num }}>{s.since}</td>
                    <td style={S.td}>
                      <Link to={verifyMapPath()}>{en ? 'Map' : '맵'}</Link>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td style={S.td} colSpan={6}>
                      <span className="vf-muted" style={{ margin: 0 }}>{en ? 'No stations match the filter.' : '필터에 맞는 지점이 없습니다.'}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="vf-muted" style={{ marginTop: 16 }}>
          {en ? 'Sources' : '출처'}: {STATIONS_META.source} ({STATIONS_META.updated}) · {STATIONS_META.note}
        </p>
      </main>
    </VerifyShell>
  )
}
