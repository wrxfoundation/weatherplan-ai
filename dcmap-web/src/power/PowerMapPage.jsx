import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import TopBar from '../TopBar.jsx'
import { SIDO_CENTROIDS, GEN_PERMIT_BUBBLES } from '../data/genLicenses.js'
import { headroomFor } from '../data/liveApi.js'

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION = '© OpenStreetMap · © CARTO'
const SIDOS = Object.entries(SIDO_CENTROIDS).map(([sido, [lat, lng]]) => ({ sido, lat, lng }))
const genBySido = new Map(GEN_PERMIT_BUBBLES.map((b) => [b.sido, b]))

const MODES = {
  gen: { key: 'gen', label: '발전 공급 파이프라인', unit: '건', note: '2024년 이후 발전사업 허가 건수 — 지역 공급측 신호(3MW 초과 허가대장, 건수 기준). 버블 크기=건수, 색=신재생 비중.' },
  headroom: { key: 'headroom', label: '계통 여유용량', unit: 'MW', note: '한전 분산전원 계통 여유용량(시도 중심점 조회) — 값이 클수록 신규 부하 수용 여지 큼. KEPCO env 연동 시 실데이터, 미연동 시 연동 대기.' },
}

export default function PowerMapPage() {
  const [mode, setMode] = useState('gen')
  const [headrooms, setHeadrooms] = useState(null) // {sido: availableMw|null}
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    document.title = '전국 전력 지도 — 발전 공급 · 계통 여유용량 · AI InfraMap'
  }, [])

  // 계통 여유용량: 17개 시도 중심점에서 headroom 조회 (KEPCO env 연동 시 실데이터)
  useEffect(() => {
    let alive = true
    Promise.all(
      SIDOS.map((s) =>
        headroomFor(s.lat, s.lng)
          .then((v) => [s.sido, v?.available ? (v.availableMw ?? null) : null])
          .catch(() => [s.sido, null]),
      ),
    ).then((pairs) => alive && setHeadrooms(Object.fromEntries(pairs)))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (mapObj.current || !mapRef.current) return
    const map = L.map(mapRef.current, { center: [36.4, 127.9], zoom: 7, zoomControl: true, attributionControl: true })
    L.tileLayer(DARK_TILES, { attribution: TILE_ATTRIBUTION, maxZoom: 12, minZoom: 6 }).addTo(map)
    mapObj.current = map
    return () => {
      map.remove()
      mapObj.current = null
    }
  }, [])

  // 레이어 렌더
  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
      layerRef.current = null
    }
    const g = L.layerGroup()

    if (mode === 'gen') {
      const max = Math.max(...GEN_PERMIT_BUBBLES.map((b) => b.count))
      for (const b of GEN_PERMIT_BUBBLES) {
        const r = 10 + 26 * Math.sqrt(b.count / max)
        const renewPct = Math.round((b.renew / b.count) * 100)
        // 색: 신재생 비중 높을수록 green, 낮을수록 amber
        const green = renewPct >= 70
        L.circleMarker([b.lat, b.lng], {
          radius: r,
          color: green ? 'rgba(69,212,131,0.95)' : 'rgba(245,154,60,0.95)',
          weight: 1.5,
          fillColor: green ? 'rgba(69,212,131,0.28)' : 'rgba(245,154,60,0.26)',
          fillOpacity: 0.5,
        })
          .bindTooltip(`<div class="dc-hovercard"><strong>${b.sido}</strong> · 발전 허가 <b>${b.count}건</b><br/>신재생 ${renewPct}% · 최다 ${b.topFuel || '—'}</div>`, {
            direction: 'top', offset: [0, -r], className: 'dc-hovercard', opacity: 1,
          })
          .addTo(g)
        L.marker([b.lat, b.lng], { icon: L.divIcon({ className: 'gen-bubble-label', html: `${b.count}`, iconSize: [40, 16], iconAnchor: [20, 8] }), interactive: false }).addTo(g)
      }
    } else {
      const vals = SIDOS.map((s) => headrooms?.[s.sido]).filter((v) => v != null)
      const max = vals.length ? Math.max(...vals) : 0
      for (const s of SIDOS) {
        const mw = headrooms?.[s.sido]
        const has = mw != null && max > 0
        const r = has ? 10 + 26 * Math.sqrt(mw / max) : 9
        L.circleMarker([s.lat, s.lng], {
          radius: r,
          color: has ? 'rgba(53,213,238,0.95)' : 'rgba(120,140,170,0.5)',
          weight: 1.3,
          fillColor: has ? 'rgba(53,213,238,0.26)' : 'rgba(120,140,170,0.12)',
          fillOpacity: has ? 0.5 : 0.25,
          dashArray: has ? undefined : '3 3',
        })
          .bindTooltip(`<div class="dc-hovercard"><strong>${s.sido}</strong> · 계통 여유용량<br/>${has ? `<b>${mw.toLocaleString()}MW</b>` : '연동 대기 (KEPCO env)'}</div>`, {
            direction: 'top', offset: [0, -r], className: 'dc-hovercard', opacity: 1,
          })
          .addTo(g)
        if (has) L.marker([s.lat, s.lng], { icon: L.divIcon({ className: 'gen-bubble-label', html: `${Math.round(mw)}`, iconSize: [46, 16], iconAnchor: [23, 8] }), interactive: false }).addTo(g)
      }
    }
    g.addTo(map)
    layerRef.current = g
  }, [mode, headrooms])

  const headroomReady = useMemo(() => headrooms && Object.values(headrooms).some((v) => v != null), [headrooms])
  const m = MODES[mode]

  return (
    <>
      <TopBar />
      <div className="power-page">
        <div className="power-head">
          <div>
            <div className="eyebrow">POWER MAP</div>
            <h1 className="power-title">전국 전력 지도 — 발전 공급 · 계통 여유용량</h1>
          </div>
          <div className="power-modes">
            {Object.values(MODES).map((mm) => (
              <button key={mm.key} type="button" className={`chip ${mode === mm.key ? 'on' : ''}`} onClick={() => setMode(mm.key)} aria-pressed={mode === mm.key}>
                {mm.label}
              </button>
            ))}
          </div>
        </div>
        <p className="power-note">{m.note}</p>

        <div className="power-layout">
          <div ref={mapRef} className="power-map" />
          <aside className="power-panel">
            <div className="chart-title">지역별 요약 ({m.label})</div>
            <div className="power-rows">
              {SIDOS.map((s) => {
                const gen = genBySido.get(s.sido)
                const mw = headrooms?.[s.sido]
                return (
                  <div key={s.sido} className="power-row">
                    <span className="pr-sido">{s.sido}</span>
                    {mode === 'gen' ? (
                      <span className="pr-val">
                        {gen ? (
                          <>
                            <b>{gen.count}</b>건 · 신재생 {Math.round((gen.renew / gen.count) * 100)}%
                          </>
                        ) : (
                          <span className="muted">허가 없음</span>
                        )}
                      </span>
                    ) : (
                      <span className="pr-val">
                        {mw != null ? <><b>{mw.toLocaleString()}</b> MW</> : <span className="badge verify">연동 대기</span>}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            {mode === 'headroom' && !headroomReady && (
              <p className="chart-note">계통 여유용량은 한전 분산전원 개방포털 연동(서버 env) 시 표시됩니다. 현재 <span className="badge verify">연동 대기</span> — 지도·요약은 연동 즉시 실데이터로 채워집니다.</p>
            )}
            <p className="chart-note" style={{ opacity: 0.7 }}>
              공급=3MW 초과 발전사업 허가대장(2024+, 건수) · 여유용량=한전 분산전원 계통 여유(시도 중심 조회). 개별 좌표·용량은 참고치.
            </p>
          </aside>
        </div>
      </div>
    </>
  )
}
