import { useEffect, useState } from 'react'
import { weatherFor, climateFor, revgeoFor, dongLabel } from '../data/liveApi.js'
import { dcClimateIndex, CLIMATE_LEVELS, nearestNormal } from '../score/climateIndex.js'
import { useMapLang } from '../i18n/mapLang.js'

/* 맵 상단 기후 바 — 현재 지점(클릭/검색) 또는 지도 중심의 실황 기상 + 데이터센터 기후지수.
 * 데이터센터에 좋은/나쁜 기후인지(아주좋음~아주나쁨)와 그 이유를 지도 위에서 바로 보게 한다. */
const CLIMATE_HELP =
  'DC 기후지수 — 데이터센터 냉각 효율 관점의 기후 평가. 연평균기온이 낮을수록(서늘할수록) 외기 프리쿨링 시간이 길어 냉방 전력·PUE가 유리 → 높은 등급. 케이웨더 실황·평년값 기반 5단계(아주좋음·좋음·보통·나쁨·아주나쁨). 냉각 방식·습도 조건에 따라 실제 설계는 달라질 수 있는 참고 지표.'
const CLIMATE_HELP_EN =
  'DC climate index — a climate assessment from the standpoint of data-center cooling efficiency. The lower the annual mean temperature (the cooler it is), the longer the outside-air free-cooling hours, favouring cooling power and PUE → higher grade. 5 levels based on KWeather live observations and normal values (excellent · good · fair · poor · very poor). A reference indicator; actual design may differ depending on cooling method and humidity conditions.'
export default function ClimateBar({ point, committed }) {
  const en = useMapLang() === 'en'
  const [wx, setWx] = useState(null)
  const [climate, setClimate] = useState(null)
  const [addr, setAddr] = useState(null)
  // 접기/펴기 — 모바일 기본 접힘, 선택은 로컬 저장. 지도 공간 확보용.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const v = localStorage.getItem('dcmap.cbCollapsed')
      if (v != null) return v === '1'
    } catch {
      /* ignore */
    }
    return typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches
  })
  const toggle = () => {
    setCollapsed((v) => {
      const nv = !v
      try {
        localStorage.setItem('dcmap.cbCollapsed', nv ? '1' : '0')
      } catch {
        /* ignore */
      }
      return nv
    })
  }

  useEffect(() => {
    if (!point) return
    let alive = true
    setWx(null)
    setClimate(null)
    setAddr(null)
    weatherFor(point.lat, point.lng).then((v) => alive && setWx(v))
    climateFor(point.lat, point.lng).then((v) => alive && setClimate(v))
    // 근접 동(행정동) 표기 — 지도 중심도 스냅(0.05°) 좌표라 호출은 셀당 1회. vworld 브라우저 직접(JSONP)이면 붙는다.
    revgeoFor(point.lat, point.lng).then((v) => alive && setAddr(v))
    return () => {
      alive = false
    }
  }, [point?.lat, point?.lng, committed])

  const normal = point ? nearestNormal(point.lat, point.lng) : null
  const idx = dcClimateIndex({
    avgTemp: climate?.available ? climate.avgTemp : undefined,
    normalTemp: normal?.t,
    normalStation: normal?.name,
    humidity: wx?.humidity,
    currentTemp: wx?.temp,
  })

  // DC 기후지수 표시값 — EN 모드에선 영문 형제 필드(labelEn/whyEn/basisEn) 우선, 없으면 KO 폴백.
  const ciLabel = idx ? (en ? idx.labelEn ?? idx.label : idx.label) : null
  const ciWhy = idx ? (en ? idx.whyEn ?? idx.why : idx.why) : null
  const ciBasis = idx ? (en ? idx.basisEn ?? idx.basis : idx.basis) : null

  const dong = dongLabel(addr)
  const coordStr = point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : ''
  // 구/동 단위를 앞에 크게, 좌표는 뒤에 작게 흐리게. 동 미확보(vworld 미연동) 시 최근접 관측지점 폴백.
  const region = normal ? (en ? `near ${normal.name}` : `${normal.name} 인근`) : null
  const placeName = dong || (committed ? addr?.parcel : null) || region

  return (
    <div className={`climate-bar ${collapsed ? 'collapsed' : ''}`}>
      <div className="cb-head">
        <span className="cb-where" title={addr?.parcel || placeName || coordStr}>
          <svg className="cb-pin" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            {committed ? (
              <>
                <path d="M8 14.5S13 10.4 13 6.5A5 5 0 0 0 3 6.5C3 10.4 8 14.5 8 14.5Z" />
                <circle cx="8" cy="6.5" r="1.8" />
              </>
            ) : (
              <>
                <circle cx="8" cy="8" r="6.2" />
                <path d="M10.6 5.4 9 9 5.4 10.6 7 7 10.6 5.4Z" />
              </>
            )}
          </svg>{' '}
          {placeName ? (
            <>
              <b className="cb-place">{placeName}</b>
              {/* 접힘 시 좌표 숨김 — 구/동만 1줄로 */}
              {coordStr && !collapsed && <span className="cb-coord">{coordStr}</span>}
            </>
          ) : (
            <b className="cb-place">{collapsed ? placeName || (en ? 'Locating…' : '위치 확인 중') : coordStr}</b>
          )}
        </span>
        {/* 접힘 시 헤더에 기후지수·기온만 압축 표시 */}
        {collapsed && (
          <span className="cb-mini">
            {idx && <span className={`ci-dot tone-${idx.tone}`} title={ciLabel}>{ciLabel}</span>}
            {wx?.temp != null && <b className="cb-mini-temp">{wx.temp}°C</b>}
          </span>
        )}
        {!collapsed && <span className="cb-src">{en ? 'KWeather live' : '케이웨더 실황'}</span>}
        <button type="button" className="cb-toggle" onClick={toggle} aria-expanded={!collapsed} aria-label={en ? (collapsed ? 'Expand climate panel' : 'Collapse climate panel') : collapsed ? '기후 패널 펴기' : '기후 패널 접기'}>
          {collapsed ? '▾' : '▴'}
        </button>
      </div>

      {!collapsed && (
      <>
      <div className="cb-body">
        {/* 데이터센터 기후지수 배지 (아주나쁨~아주좋음) */}
        {idx ? (
          <div className={`ci-badge tone-${idx.tone}`} title={ciWhy}>
            <span className="ci-cap">
              {en ? 'DC climate index' : 'DC 기후지수'}
              <span className="ci-help" tabIndex={0} role="button" aria-label={en ? 'DC climate index explanation' : 'DC 기후지수 설명'} data-tip={en ? CLIMATE_HELP_EN : CLIMATE_HELP}>?</span>
            </span>
            <span className="ci-label">{ciLabel}</span>
            <span className="ci-scale" aria-label={en ? `Level ${idx.level} of 5` : `5단계 중 ${idx.level}단계`}>
              {CLIMATE_LEVELS.map((l) => (
                <i key={l.level} className={l.level === idx.level ? `on tone-${idx.tone}` : ''} />
              ))}
            </span>
          </div>
        ) : (
          <div className="ci-badge tone-wait">
            <span className="ci-cap">
              {en ? 'DC climate index' : 'DC 기후지수'}
              <span className="ci-help" tabIndex={0} role="button" aria-label={en ? 'DC climate index explanation' : 'DC 기후지수 설명'} data-tip={en ? CLIMATE_HELP_EN : CLIMATE_HELP}>?</span>
            </span>
            <span className="ci-label">{en ? 'data pending' : '연동 대기'}</span>
          </div>
        )}

        {/* 현재 실황 요약 */}
        <div className="cb-wx">
          {wx ? (
            <>
              {wx.temp != null && <b>{wx.temp}°C</b>}
              {wx.sky && <span> {wx.sky}</span>}
              {wx.humidity != null && <span> · {en ? 'Humidity' : '습도'} {wx.humidity}%</span>}
              {wx.windSpeed != null && <span> · {en ? 'Wind' : '풍속'} {wx.windSpeed}m/s</span>}
              {wx.pm10 != null && <span> · PM10 {wx.pm10}</span>}
            </>
          ) : (
            <span className="cb-wait">{en ? 'Loading live weather…' : '기상 실황 불러오는 중…'}</span>
          )}
        </div>
      </div>

      {/* 왜 좋고/나쁜지 + 표출값 근거 */}
      {idx && (
        <>
          <div className="cb-why">{ciWhy}</div>
          <div className="cb-basis">{en ? 'Basis' : '근거'}: {ciBasis}</div>
        </>
      )}
      </>
      )}
    </div>
  )
}
