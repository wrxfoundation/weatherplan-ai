import { useState } from 'react'
import { useMapLang } from '../i18n/mapLang.js'

/* 맵 범례 — 마커·전압·레이어 색 의미를 한눈에. 클러터 방지 위해 기본 접힘(좌하단 알약, 클릭 시 펼침). */
const T = {
  '시설 상태': 'Facility status',
  '변전소·송전선 (kV)': 'Substation · line (kV)',
  '레이어': 'Layers',
  '운영': 'Operating',
  '건설': 'Under construction',
  '계획': 'Planned',
  '하이퍼스케일 100MW+': 'Hyperscale 100MW+',
  '재생 풍력': 'Renewable wind',
  '재생 태양광': 'Renewable solar',
  '수원(댐)': 'Water source (dam)',
  '반도체 클러스터': 'Semiconductor cluster',
  '추천입지': 'Recommended site',
  '지도 범례': 'Map legend',
  '지도 색·마커 범례': 'Map colour & marker legend',
  '범례': 'Legend',
}
const SECTIONS = [
  {
    title: '시설 상태',
    items: [
      { c: 'dot', cls: 'operating', label: '운영' },
      { c: 'dot', cls: 'construction', label: '건설' },
      { c: 'dot', cls: 'planned', label: '계획' },
      { c: 'diamond', label: '하이퍼스케일 100MW+' },
    ],
  },
  {
    title: '변전소·송전선 (kV)',
    items: [
      { c: 'sw', color: '#7dd3fc', label: '154' },
      { c: 'sw', color: '#c084fc', label: '345' },
      { c: 'sw', color: '#f0abfc', label: '765' },
    ],
  },
  {
    title: '레이어',
    items: [
      { c: 'sw', color: '#4ade80', label: '재생 풍력' },
      { c: 'sw', color: '#fde047', label: '재생 태양광' },
      { c: 'sw', color: '#38bdf8', label: '수원(댐)' },
      { c: 'sw', color: '#f59a3c', label: '반도체 클러스터' },
      { c: 'sw', color: '#f4c14b', label: '추천입지' },
    ],
  },
]

export default function Legend() {
  const [open, setOpen] = useState(false)
  const en = useMapLang() === 'en'
  const t = (ko) => (en ? T[ko] ?? ko : ko)
  return (
    <div className={`map-legend${open ? ' open' : ''}`}>
      {open && (
        <div className="legend-body" role="region" aria-label={t('지도 범례')}>
          {SECTIONS.map((s) => (
            <div className="legend-sec" key={s.title}>
              <div className="legend-sec-t">{t(s.title)}</div>
              <div className="legend-items">
                {s.items.map((it) => (
                  <span className="legend-item" key={it.label}>
                    {it.c === 'dot' && <span className={`dot ${it.cls}`} />}
                    {it.c === 'diamond' && <span className="legend-diamond" />}
                    {it.c === 'sw' && <span className="legend-sw" style={{ background: it.color }} />}
                    {t(it.label)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className="legend-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={t('지도 색·마커 범례')}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="4" cy="4" r="1.6" />
          <circle cx="4" cy="11.5" r="1.6" />
          <path d="M8.5 4h5 M8.5 11.5h5" />
        </svg>
        {t('범례')}
        <span className="legend-caret">{open ? '▾' : '▸'}</span>
      </button>
    </div>
  )
}
