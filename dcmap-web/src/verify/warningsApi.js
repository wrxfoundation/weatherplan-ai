/* 기상특보 발효 이력 조회 — /api/kweather?kind=history&res=warn (공공데이터포털 기상특보 조회서비스 프록시).
 * 근거 양식: 기상산업기술원 기상감정(호우편) 사례집·기상감정 표준매뉴얼(2017) 양식 기준 — 별첨5 '호우특보 발효 현황' 항목.
 * 정직성: 실패·미설정·필드 불일치는 { available:false, reason } 그대로 전달 — 가짜 이력 금지, UI는 '데이터 대기' 유지.
 * 로컬 vite dev/preview에는 서버리스 함수가 없으므로 404 → 'no_api'로 정규화된다.
 * 주의: 응답 rows는 발표관서 단위 특보 목록 — 대상 지점 적용 여부는 발표문 원문으로 확인 필요(응답 caution 참조). */

/** 특보 발표관서 코드 근사 매핑 테이블.
 *  ※ 근사·실검증 전 가정 — 공개 통보문(기상청 특보 통보문)의 발표관서 표기 관례를 근거로 한
 *  근사 매핑이며, 실제 발표관서 코드 체계·관할 경계와 다를 수 있다(실계약·실응답 미검증). */
export const WARN_OFFICES = {
  108: '기상청(전국)',
  109: '수도권(서울)',
  105: '강원',
  131: '청주(충북)',
  133: '대전(충남·세종)',
  143: '대구(경북)',
  146: '전주(전북)',
  156: '광주(전남)',
  159: '부산(경남 동부)',
  184: '제주',
}

/** 지점(위경도·지점번호) → 관할 발표관서 코드 근사 선택.
 *  ※ 시도 행정경계 대신 위경도 구간으로 근사 — 경계 인접 지점(예: 제천·영동·남해안 도서)은
 *  오분류 가능. 반환의 approx:true가 이 부정확 가능성을 명시한다.
 *  입력: 숫자(지점번호) 또는 { stnId|stn|id, lat, lon|lng } 객체.
 *  우선순위: ① 지점번호가 발표관서 코드와 일치하면 그대로 ② 위경도 구간 근사 ③ 전국(108) 폴백. */
export function warnOfficeFor(station) {
  const s = station && typeof station === 'object' ? station : { stnId: station }
  const stn = Number(s.stnId ?? s.stn ?? s.id)
  // ① 주요 ASOS 지점번호(108 서울, 105 강릉…, 184 제주)는 발표관서 코드와 겹침 — 직접 사용
  if (Number.isFinite(stn) && WARN_OFFICES[stn]) return { office: stn, label: WARN_OFFICES[stn], approx: true }
  const lat = Number(s.lat ?? s.latitude)
  const lon = Number(s.lon ?? s.lng ?? s.longitude)
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    // ② 위경도 구간 근사(북→남, 동→서 순서 의존) — 시도 경계와 정확히 일치하지 않음
    let office
    if (lat < 34.3) office = 184 // 제주(남해 도서 일부 오분류 가능)
    else if (lat < 35.6 && lon >= 128.6) office = 159 // 부산·경남 동부
    else if (lat >= 37.0 && lon >= 127.7) office = 105 // 강원(춘천 포함 — 제천 등 충북 북부 오분류 가능)
    else if (lat >= 36.9) office = 109 // 수도권(서울·인천·경기)
    else if (lon >= 128.0) office = 143 // 대구·경북
    else if (lat < 35.35) office = 156 // 광주·전남
    else if (lat < 36.15) office = 146 // 전주·전북
    else if (lon >= 127.45) office = 131 // 청주·충북(대전과 경계 근접 — 오분류 가능)
    else office = 133 // 대전·충남·세종
    return { office, label: WARN_OFFICES[office], approx: true }
  }
  // ③ 판단 재료 없음 — 전국(108) 폴백(가장 보수적 근사)
  return { office: 108, label: WARN_OFFICES[108], approx: true }
}

/** 특보 이력 조회 — 오버로드(하위호환):
 *  fetchWarnings(stnIdNumber, from, to)  : 기존 동작 그대로(stn= 파라미터, 응답 무가공)
 *  fetchWarnings(stationObject, from, to): warnOfficeFor로 발표관서 코드를 근사 선택해
 *    office= 파라미터로 요청하고, 응답에 office/officeLabel/officeApprox:true를 덧붙여
 *    리포트가 '발표관서: ○○(근사 매핑)'을 표기할 수 있게 한다. */
export async function fetchWarnings(station, from, to) {
  const officeInfo = station && typeof station === 'object' ? warnOfficeFor(station) : null
  const idQuery = officeInfo ? `office=${officeInfo.office}` : `stn=${station}`
  try {
    const r = await fetch(`/api/kweather?kind=history&res=warn&${idQuery}&from=${from}&to=${to}`, { headers: { Accept: 'application/json' } })
    const ct = r.headers.get('content-type') || ''
    if (!ct.includes('json')) return { available: false, reason: 'no_api' }
    const j = await r.json()
    if (!j || typeof j !== 'object') return { available: false, reason: 'bad_payload' }
    if (officeInfo) {
      // 근사 매핑 명시 — 라벨은 관례 기반 근사이며 실검증 전 가정(warnOfficeFor 주석 참조)
      j.office = officeInfo.office
      j.officeLabel = officeInfo.label
      j.officeApprox = true
    }
    return j
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
