import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import TopBar from '../TopBar.jsx'
import FacilityCard from './FacilityCard.jsx'
import { findBySlug, STATUS_LABEL } from '../data/facilities.js'
import { SIDO_SLUGS } from '../content/sido_slugs.js'
import { buildDescription, buildPlaceJsonLd } from './seo.js'

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function FacilityPage() {
  const { slug } = useParams()
  const facility = findBySlug(slug)
  const mapRef = useRef(null)

  useEffect(() => {
    if (!facility) return
    const title = `${facility.name} — 명당 AI 데이터센터 맵`
    const desc = buildDescription(facility)
    document.title = title
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', desc)

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(buildPlaceJsonLd(facility))
    document.head.appendChild(script)
    return () => script.remove()
  }, [facility])

  useEffect(() => {
    if (!facility || !mapRef.current) return
    const map = L.map(mapRef.current, {
      center: [facility.lat, facility.lng],
      zoom: facility.geocode_level === 'parcel' ? 14 : 10,
      zoomControl: false,
      scrollWheelZoom: false,
    })
    L.tileLayer(DARK_TILES, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map)
    L.marker([facility.lat, facility.lng], {
      icon: L.divIcon({
        className: `dc-marker ${facility.status === 'delayed' ? 'planned' : facility.status}`,
        iconSize: [16, 16],
      }),
    }).addTo(map)
    return () => map.remove()
  }, [facility])

  if (!facility) {
    return (
      <>
        <TopBar />
        <main className="page">
          <h1>시설을 찾을 수 없습니다</h1>
          <p className="sub">
            <Link className="back-link" to="/">
              ← 맵으로 돌아가기
            </Link>
          </p>
        </main>
      </>
    )
  }

  return (
    <>
      <TopBar />
      <main className="page">
        <Link className="back-link" to="/">
          ← 맵으로 돌아가기
        </Link>
        <div className="eyebrow">FACILITY</div>
        <h1>{facility.name}</h1>
        <p className="sub">
          {facility.sido}
          {facility.sigungu ? ` ${facility.sigungu}` : ''} · {STATUS_LABEL[facility.status] ?? facility.status} ·{' '}
          {facility.type}
        </p>
        <div ref={mapRef} className="detail-map" />
        <FacilityCard facility={facility} compact />
        {SIDO_SLUGS[facility.sido] && (
          <div className="card-actions">
            <Link className="btn" to={`/region/${SIDO_SLUGS[facility.sido]}`}>
              {facility.sido} 지역 시설 전체 보기
            </Link>
          </div>
        )}
        <p className="footer-note">
          본 페이지의 정보는 사업자 공식 발표·언론 보도·정부 공고 등 공개 소스만을 기반으로 하며, 시군구/시도 수준
          좌표는 해당 행정구역 중심점입니다. ‘검증 필요’ 표시 항목은 확인 중인 정보입니다.
        </p>
      </main>
    </>
  )
}
