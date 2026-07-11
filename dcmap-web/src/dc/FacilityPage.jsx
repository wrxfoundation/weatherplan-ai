import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import TopBar from '../TopBar.jsx'
import FacilityCard from './FacilityCard.jsx'
import { findBySlug, STATUS_LABEL } from '../data/facilities.js'
import { SIDO_SLUGS } from '../content/sido_slugs.js'
import { dongPulseFor } from '../data/landPriceDong.js'
import { fmtRate } from '../data/landPrice.js'
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
        {(() => {
          const p = dongPulseFor(facility)
          if (!p) return null
          const maxAbs = Math.max(Math.abs(p.top.rate), Math.abs(p.bottom.rate), 0.01)
          const rows = [
            { label: `${facility.sigungu} 평균`, rate: p.rate },
            { label: `최고 · ${p.top.name}`, rate: p.top.rate },
            { label: `최저 · ${p.bottom.name}`, rate: p.bottom.rate },
          ]
          return (
            <article className="facility-card">
              <div className="chart-title">
                입지 지가 펄스 — {p.key} 읍면동 {p.count}개 구역 ({p.period} 월간, KOSIS·한국부동산원)
              </div>
              {rows.map((row) => (
                <div key={row.label} className="hbar-row">
                  <span className="hbar-label">{row.label}</span>
                  <span className="hbar-track">
                    <span
                      className="hbar-fill"
                      style={{
                        width: `${(Math.abs(row.rate) / maxAbs) * 100}%`,
                        background: row.rate >= 0 ? 'var(--accent)' : 'var(--amber)',
                      }}
                    />
                  </span>
                  <span className="hbar-value">{fmtRate(row.rate)}</span>
                </div>
              ))}
              <p className="chart-note">
                구역 명칭은 부동산원 조사구역 단위(복수 법정동 병기 가능). 본 시설의 좌표는 시군구 중심점일 수
                있어 특정 동과의 결부는 하지 않습니다 — 필지 확인 시 해당 구역으로 정밀화됩니다.
              </p>
            </article>
          )
        })()}
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
