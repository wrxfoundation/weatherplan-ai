import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import TopBar from '../TopBar.jsx'
import FacilityCard from './FacilityCard.jsx'
import { findBySlug, STATUS_LABEL, FACILITIES, slugOf } from '../data/facilities.js'
import { SIDO_SLUGS } from '../content/sido_slugs.js'
import { dongPulseFor } from '../data/landPriceDong.js'
import { fmtRate } from '../data/landPrice.js'
import { weatherFor } from '../data/liveApi.js'
import { checkPowerTrack } from '../calc/trackCheck.js'
import { buildDescription, buildPlaceJsonLd } from './seo.js'
import { useMapLang } from '../i18n/mapLang.js'

const CAPITAL_SIDO = new Set(['서울', '경기', '인천'])

const STATUS_EN = { operating: 'Operating', construction: 'Construction', planned: 'Planned', delayed: 'Delayed', cancelled: 'Cancelled' }

const km = (a, b) => {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

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
  const [wx, setWx] = useState(null)
  const en = useMapLang() === 'en'
  const statusLabel = (s) => (en ? STATUS_EN[s] ?? STATUS_LABEL[s] ?? s : STATUS_LABEL[s] ?? s)

  useEffect(() => {
    if (!facility) return
    let alive = true
    setWx(null)
    weatherFor(facility.lat, facility.lng).then((v) => alive && setWx(v))
    return () => {
      alive = false
    }
  }, [facility])

  useEffect(() => {
    if (!facility) return
    const title = en ? `${facility.name} — AI InfraMap Data Center Map` : `${facility.name} — AI InfraMap 데이터센터 맵`
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
  }, [facility, en])

  useEffect(() => {
    if (!facility || !mapRef.current) return
    const map = L.map(mapRef.current, {
      center: [facility.lat, facility.lng],
      zoom: facility.geocode_level === 'parcel' ? 14 : 10,
      zoomControl: true, // 확대/축소 버튼 (스크롤 줌은 페이지 스크롤 보호를 위해 계속 끔)
      scrollWheelZoom: false,
    })
    map.zoomControl.setPosition('bottomright')
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
          <h1>{en ? 'Facility not found' : '시설을 찾을 수 없습니다'}</h1>
          <p className="sub">
            <Link className="back-link" to="/">
              {en ? '← Back to map' : '← 맵으로 돌아가기'}
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
          {en ? '← Back to map' : '← 맵으로 돌아가기'}
        </Link>
        <div className="eyebrow">FACILITY</div>
        <h1>{facility.name}</h1>
        <p className="sub">
          {facility.sido}
          {facility.sigungu ? ` ${facility.sigungu}` : ''} · {statusLabel(facility.status)} ·{' '}
          {facility.type}
        </p>
        <div ref={mapRef} className="detail-map" />
        {facility.power_mw_public != null && (() => {
          const tr = checkPowerTrack(facility.power_mw_public, { nonCapital: !CAPITAL_SIDO.has(facility.sido) })
          const h100 = Math.floor((facility.power_mw_public * 1000) / 1.3 / (0.7 * 1.2))
          return (
            <article className="facility-card">
              <div className="chart-title">
                {en
                  ? `Power permitting track — assessed on public capacity ${facility.power_mw_public}MW`
                  : `전력 인허가 트랙 — 공개 용량 ${facility.power_mw_public}MW 기준 판정`}
              </div>
              <div className="spec-grid">
                <div className="spec-cell">
                  <div className="k">{en ? 'Receiving voltage track' : '수전전압 트랙'}</div>
                  <div className="v">{tr.track.voltage}</div>
                </div>
                <div className="spec-cell">
                  <div className="k">{en ? 'Power System Impact Assessment' : '전력계통영향평가'}</div>
                  <div className="v">
                    {tr.psiaRequired ? (en ? 'Subject (10MW+)' : '대상 (10MW 이상)') : en ? 'Not subject' : '비대상'}
                    {tr.exemption && (en ? ` · possible exemption from ${tr.exemption.effective}~` : ` · ${tr.exemption.effective}~ 면제 가능성`)}
                  </div>
                </div>
                <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                  <div className="k">{en ? 'GPU equivalent reference (H100 · PUE 1.3 approx.)' : 'GPU 환산 참고 (H100 · PUE 1.3 기준 근사)'}</div>
                  <div className="v">{en ? `~${h100.toLocaleString()} units scale` : `약 ${h100.toLocaleString()}장 규모`}</div>
                </div>
              </div>
              <p className="chart-note">
                {en ? (
                  <>
                    A rule-based verdict applying public capacity to current regulations (
                    <Link to="/insights/power-track-40mw">The 40MW wall</Link>·
                    <Link to="/insights/psia-exemption-2027">Reading the grid impact assessment</Link>) — actual
                    power contracts may differ. The GPU equivalent is a reverse-calculated reference from the{' '}
                    <Link to="/calc">calculator</Link> formula.
                  </>
                ) : (
                  <>
                    공개 용량을 현행 규정(<Link to="/insights/power-track-40mw">40MW의 벽</Link>·
                    <Link to="/insights/psia-exemption-2027">계통영향평가 독법</Link>)에 대입한 규칙 기반 판정 — 실제
                    수전 계약과 다를 수 있습니다. GPU 환산은 <Link to="/calc">계산기</Link> 산식의 역산 참고치.
                  </>
                )}
              </p>
            </article>
          )
        })()}
        {(() => {
          const nearest = FACILITIES.filter((f) => f.id !== facility.id)
            .map((f) => ({ f, d: km(facility, f) }))
            .sort((a, b) => a.d - b.d)
            .slice(0, 3)
          return (
            <article className="facility-card">
              <div className="chart-title">{en ? 'Nearest facilities — by coordinates (approx., incl. sigungu centroids)' : '최근접 시설 — 좌표 기준 (시군구 중심점 포함 근사)'}</div>
              <div className="facility-list">
                {nearest.map(({ f, d }) => (
                  <Link key={f.id} className="facility-row" to={`/dc/${slugOf(f)}`}>
                    <span className={`dot ${f.status === 'delayed' ? 'planned' : f.status}`} />
                    <span>
                      <span className="name">{f.name}</span>
                      <span className="meta">
                        {d.toFixed(1)} km · {statusLabel(f.status)}
                        {f.power_mw_public != null && ` · ${f.power_mw_public}MW`}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </article>
          )
        })()}
        {wx && (
          <p className="geo-note">
            {en ? 'Current weather' : '현재 기상'} — 케이웨더 (
            {wx.scope || (facility.geocode_level === 'parcel' ? (en ? 'site' : '부지') : en ? 'admin-area centroid' : '행정구역 중심점')}
            {en ? ' basis' : ' 기준'}):{' '}
            {wx.temp != null && `${wx.temp}°C`}
            {wx.sky && ` · ${wx.sky}`}
            {wx.senseTemp != null && ` · ${en ? 'feels' : '체감'} ${wx.senseTemp}°C`}
            {wx.humidity != null && ` · ${en ? 'humidity' : '습도'} ${wx.humidity}%`}
          </p>
        )}
        <FacilityCard facility={facility} compact />
        {(() => {
          const p = dongPulseFor(facility)
          if (!p) return null
          const maxAbs = Math.max(Math.abs(p.top.rate), Math.abs(p.bottom.rate), 0.01)
          const rows = [
            { label: en ? `${facility.sigungu} avg` : `${facility.sigungu} 평균`, rate: p.rate },
            { label: en ? `max · ${p.top.name}` : `최고 · ${p.top.name}`, rate: p.top.rate },
            { label: en ? `min · ${p.bottom.name}` : `최저 · ${p.bottom.name}`, rate: p.bottom.rate },
          ]
          return (
            <article className="facility-card">
              <div className="chart-title">
                {en
                  ? `Site land-price pulse — ${p.key} ${p.count} eup/myeon/dong zones (${p.period} monthly, KOSIS·한국부동산원)`
                  : `입지 지가 펄스 — ${p.key} 읍면동 ${p.count}개 구역 (${p.period} 월간, KOSIS·한국부동산원)`}
              </div>
              {rows.map((row) => (
                <div key={row.label} className="hbar-row">
                  <span className="hbar-label">{row.label}</span>
                  <span className="hbar-track">
                    <span
                      className={`hbar-fill${row.rate < 0 ? ' neg' : ''}`}
                      style={{ width: `${(Math.abs(row.rate) / maxAbs) * 100}%` }}
                    />
                  </span>
                  <span className="hbar-value">{fmtRate(row.rate)}</span>
                </div>
              ))}
              <p className="chart-note">
                {en
                  ? 'Zone names follow 부동산원 survey-zone units (multiple legal dong may be listed together). This facility’s coordinates may be the sigungu centroid, so we do not tie it to a specific dong — it is refined to the relevant zone once the parcel is confirmed.'
                  : '구역 명칭은 부동산원 조사구역 단위(복수 법정동 병기 가능). 본 시설의 좌표는 시군구 중심점일 수 있어 특정 동과의 결부는 하지 않습니다 — 필지 확인 시 해당 구역으로 정밀화됩니다.'}
              </p>
            </article>
          )
        })()}
        <div className="card-actions">
          {SIDO_SLUGS[facility.sido] && (
            <Link className="btn" to={`/region/${SIDO_SLUGS[facility.sido]}`}>
              {en ? `All of ${facility.sido}` : `${facility.sido} 지역 전체`}
            </Link>
          )}
          <Link className="btn" to={`/compare?ids=${slugOf(facility)}`}>
            {en ? 'Compare with other facilities' : '다른 시설과 비교'}
          </Link>
        </div>
        <p className="footer-note">
          {en
            ? 'Information on this page is based only on public sources (operator announcements, press reports, government notices); sigungu/sido-level coordinates are the centroid of that administrative area. Items marked “needs verification” are still being confirmed.'
            : '본 페이지의 정보는 사업자 공식 발표·언론 보도·정부 공고 등 공개 소스만을 기반으로 하며, 시군구/시도 수준 좌표는 해당 행정구역 중심점입니다. ‘검증 필요’ 표시 항목은 확인 중인 정보입니다.'}
        </p>
      </main>
    </>
  )
}
