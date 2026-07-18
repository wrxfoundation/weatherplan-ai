/* 기상특보 발효 이력 조회 — /api/kweather?kind=history&res=warn (공공데이터포털 기상특보 조회서비스 프록시).
 * 근거 양식: 기상산업기술원 기상감정(호우편) 사례집·기상감정 표준매뉴얼(2017) 양식 기준 — 별첨5 '호우특보 발효 현황' 항목.
 * 정직성: 실패·미설정·필드 불일치는 { available:false, reason } 그대로 전달 — 가짜 이력 금지, UI는 '데이터 대기' 유지.
 * 로컬 vite dev/preview에는 서버리스 함수가 없으므로 404 → 'no_api'로 정규화된다.
 * 주의: 응답 rows는 발표관서 단위 특보 목록 — 대상 지점 적용 여부는 발표문 원문으로 확인 필요(응답 caution 참조). */
export async function fetchWarnings(stnId, from, to) {
  try {
    const r = await fetch(`/api/kweather?kind=history&res=warn&stn=${stnId}&from=${from}&to=${to}`, { headers: { Accept: 'application/json' } })
    const ct = r.headers.get('content-type') || ''
    if (!ct.includes('json')) return { available: false, reason: 'no_api' }
    const j = await r.json()
    return j && typeof j === 'object' ? j : { available: false, reason: 'bad_payload' }
  } catch {
    return { available: false, reason: 'network' }
  }
}

/** 호우특보 발표 기준 — 사례집 별첨5에 명기된 공개 기준(이중언어).
 *  호우주의보: 3시간 강우량 60mm 이상 또는 12시간 강우량 110mm 이상 예상 시
 *  호우경보: 3시간 강우량 90mm 이상 또는 12시간 강우량 180mm 이상 예상 시 */
export const WARN_CRITERIA = {
  advisory: {
    name: { ko: '호우주의보', en: 'Heavy Rain Advisory' },
    rain3h: 60, // mm
    rain12h: 110, // mm
    desc: {
      ko: '3시간 강우량이 60mm 이상 예상되거나, 12시간 강우량이 110mm 이상 예상될 때',
      en: 'Issued when 3-hour rainfall of 60mm or more, or 12-hour rainfall of 110mm or more, is expected',
    },
  },
  warning: {
    name: { ko: '호우경보', en: 'Heavy Rain Warning' },
    rain3h: 90, // mm
    rain12h: 180, // mm
    desc: {
      ko: '3시간 강우량이 90mm 이상 예상되거나, 12시간 강우량이 180mm 이상 예상될 때',
      en: 'Issued when 3-hour rainfall of 90mm or more, or 12-hour rainfall of 180mm or more, is expected',
    },
  },
  source: {
    ko: '기상산업기술원 기상감정(호우편) 사례집·기상감정 표준매뉴얼(2017) 양식 기준',
    en: 'Per KMIPA Weather Appraisal Casebook (Heavy Rain) and Standard Weather Appraisal Manual (2017) format',
  },
}
