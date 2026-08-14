import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { NodeHub } from '@/demo/generators/m4'

// dcmap(명당 AI) 지도 스택 흡수 — Leaflet + CARTO 무료 타일 + markercluster + CSS divIcon 마커.
// 흡수 포인트: ① 근사 좌표(도시 중심점)는 점선 링으로 정직 표기 ② 클러스터 아이콘에 합계 대수
// ③ 상태색 마커(점검 필요는 펄스) ④ 타일 어트리뷰션 준수
const TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

const toneOf = (u: number) => (u >= 98 ? 'ok' : u >= 95 ? 'warn' : 'bad')
const fmtShort = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n))

export function NodeLeafletMap({ hubs, view, onSelect }: {
  hubs: NodeHub[]
  view: 'world' | 'kr'
  onSelect: (h: NodeHub) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    const map = L.map(ref.current, { minZoom: 2, maxZoom: 18, worldCopyJump: true })
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 18 }).addTo(map)

    const cluster = (L as any).markerClusterGroup({
      maxClusterRadius: 46,
      showCoverageOnHover: false,
      iconCreateFunction: (c: any) => {
        const total = c.getAllChildMarkers().reduce((a: number, m: any) => a + (m.options.count ?? 0), 0)
        const s = total > 5000 ? 46 : total > 1000 ? 40 : 34
        return L.divIcon({
          className: '',
          html: `<div class="kw-cluster" style="width:${s}px;height:${s}px">${fmtShort(total)}</div>`,
          iconSize: [s, s],
        })
      },
    })
    for (const h of hubs) {
      const size = Math.round(13 + Math.sqrt(h.count) / 5.5)
      const marker = L.marker([h.lat, h.lon], {
        icon: L.divIcon({ className: `kw-node ${toneOf(h.uptime)}`, iconSize: [size, size] }),
        ...({ count: h.count } as object),
      })
      marker.bindTooltip(
        `<b>${h.name}</b> · ${h.count.toLocaleString('ko-KR')}대 · 가동률 ${h.uptime.toFixed(1)}%<br/><span style="opacity:.65">도시 중심점 근사 좌표 — 클릭 시 상세</span>`,
        { direction: 'top', offset: [0, -6] },
      )
      marker.on('click', () => onSelectRef.current(h))
      cluster.addLayer(marker)
    }
    map.addLayer(cluster)
    map.fitBounds(L.latLngBounds(hubs.map(h => [h.lat, h.lon] as [number, number])), { padding: [28, 28] })
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (view === 'kr') {
      map.flyToBounds([[33.0, 124.8], [38.8, 130.0]], { padding: [20, 20], duration: 0.8 })
    } else {
      map.flyToBounds(L.latLngBounds(hubs.map(h => [h.lat, h.lon] as [number, number])), { padding: [28, 28], duration: 0.8 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  return <div ref={ref} className="relative z-0 h-[400px] w-full rounded-lg border border-line-soft bg-bg/70" aria-label="글로벌 노드 분포 지도" />
}
