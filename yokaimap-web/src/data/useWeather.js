import { useEffect, useState } from 'react'

/**
 * 현재 지점 관측 조회. 실패·미설정이면 available:false로 떨어뜨리고 화면에서 그 사실을 밝힌다.
 * (가짜 수치로 채우지 않는 것이 이 프로젝트의 데이터 원칙이다.)
 */
export function useWeather(lat, lng) {
  const [state, setState] = useState({ loading: true, data: null })

  useEffect(() => {
    if (lat == null || lng == null) return
    let alive = true
    setState({ loading: true, data: null })
    fetch(`/api/weather?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`)
      .then((r) => (r.ok ? r.json() : { available: false, reason: `HTTP ${r.status}` }))
      .catch(() => ({ available: false, reason: '네트워크 오류' }))
      .then((data) => {
        if (alive) setState({ loading: false, data })
      })
    return () => {
      alive = false
    }
  }, [lat, lng])

  return state
}
