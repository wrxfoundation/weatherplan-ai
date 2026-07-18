/* 관측 이력 조회 — /api/kweather?kind=history (기상청 ASOS 일자료 서버리스 프록시).
 * 정직성: 실패·미설정은 { available:false, reason }로 그대로 전달 — UI는 '데이터 대기' 유지.
 * 로컬 vite dev/preview에는 서버리스 함수가 없으므로 404 → 'no_api'로 정규화된다. */
export async function fetchObservations(stnId, from, to) {
  try {
    const r = await fetch(`/api/kweather?kind=history&stn=${stnId}&from=${from}&to=${to}`, { headers: { Accept: 'application/json' } })
    const ct = r.headers.get('content-type') || ''
    if (!ct.includes('json')) return { available: false, reason: 'no_api' }
    const j = await r.json()
    return j && typeof j === 'object' ? j : { available: false, reason: 'bad_payload' }
  } catch {
    return { available: false, reason: 'network' }
  }
}

/** 실측 행 요약 — 값이 null인 항목은 집계에서 제외(0으로 오인 금지) */
export function summarizeRows(rows) {
  const has = (k) => rows.some((r) => r[k] != null)
  const sum = (k) => rows.reduce((a, r) => a + (r[k] ?? 0), 0)
  const maxBy = (k) => rows.reduce((best, r) => (r[k] != null && (best == null || r[k] > best[k]) ? r : best), null)
  const minBy = (k) => rows.reduce((best, r) => (r[k] != null && (best == null || r[k] < best[k]) ? r : best), null)
  const gust = maxBy('maxInsWs')
  const hot = maxBy('maxTa')
  const cold = minBy('minTa')
  const wetDays = rows.filter((r) => (r.sumRn ?? 0) >= 0.1).length
  return {
    days: rows.length,
    rainSum: has('sumRn') ? Math.round(sum('sumRn') * 10) / 10 : null,
    wetDays: has('sumRn') ? wetDays : null,
    gust: gust ? { v: gust.maxInsWs, date: gust.date } : null,
    hot: hot ? { v: hot.maxTa, date: hot.date } : null,
    cold: cold ? { v: cold.minTa, date: cold.date } : null,
    hasSnow: rows.some((r) => (r.ddMes ?? 0) > 0),
  }
}
