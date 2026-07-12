import { useEffect, useState } from 'react'
import { weatherFor, climateFor, revgeoFor, dongLabel } from '../data/liveApi.js'
import { dcClimateIndex, CLIMATE_LEVELS, nearestNormal } from '../score/climateIndex.js'

/* 맵 상단 기후 바 — 현재 지점(클릭/검색) 또는 지도 중심의 실황 기상 + 데이터센터 기후지수.
 * 데이터센터에 좋은/나쁜 기후인지(아주좋음~아주나쁨)와 그 이유를 지도 위에서 바로 보게 한다. */
export default function ClimateBar({ point, committed }) {
  const [wx, setWx] = useState(null)
  const [climate, setClimate] = useState(null)
  const [addr, setAddr] = useState(null)

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

  const dong = dongLabel(addr)
  const coordStr = point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : ''
  // 좌표 옆에 근접 동을 표기. 동 미확보(vworld 미연동) 시 최근접 관측지점으로 폴백.
  const region = normal ? `${normal.name} 인근` : null
  const where = committed
    ? dong || addr?.parcel || coordStr
    : `${coordStr}${dong ? ` · ${dong}` : region ? ` · ${region}` : ''}`

  return (
    <div className="climate-bar">
      <div className="cb-head">
        <span className="cb-where" title={addr?.parcel || where}>
          {committed ? '📍' : '🧭'} {where}
        </span>
        <span className="cb-src">케이웨더 실황</span>
      </div>

      <div className="cb-body">
        {/* 데이터센터 기후지수 배지 (아주나쁨~아주좋음) */}
        {idx ? (
          <div className={`ci-badge tone-${idx.tone}`} title={idx.why}>
            <span className="ci-cap">DC 기후지수</span>
            <span className="ci-label">{idx.label}</span>
            <span className="ci-scale" aria-label={`5단계 중 ${idx.level}단계`}>
              {CLIMATE_LEVELS.map((l) => (
                <i key={l.level} className={l.level === idx.level ? `on tone-${idx.tone}` : ''} />
              ))}
            </span>
          </div>
        ) : (
          <div className="ci-badge tone-wait">
            <span className="ci-cap">DC 기후지수</span>
            <span className="ci-label">연동 대기</span>
          </div>
        )}

        {/* 현재 실황 요약 */}
        <div className="cb-wx">
          {wx ? (
            <>
              {wx.temp != null && <b>{wx.temp}°C</b>}
              {wx.sky && <span> {wx.sky}</span>}
              {wx.humidity != null && <span> · 습도 {wx.humidity}%</span>}
              {wx.windSpeed != null && <span> · 풍속 {wx.windSpeed}m/s</span>}
              {wx.pm10 != null && <span> · PM10 {wx.pm10}</span>}
            </>
          ) : (
            <span className="cb-wait">기상 실황 불러오는 중…</span>
          )}
        </div>
      </div>

      {/* 왜 좋고/나쁜지 + 표출값 근거 */}
      {idx && (
        <>
          <div className="cb-why">{idx.why}</div>
          <div className="cb-basis">근거: {idx.basis}</div>
        </>
      )}
    </div>
  )
}
