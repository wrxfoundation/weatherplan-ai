// 데이터센터 기후 적합도 지수 — 공개 기상 원리 기반(임의 가중치 아님).
// 핵심 동인: 연평균기온 → 프리쿨링(외기냉방) 가능시간 → 냉각 전력(PUE)·수자원. 낮을수록 좋음.
//
// 기준(threshold)의 근거 — 기상청 신(新)기후평년값 1991~2020 연평균기온:
//   전국 12.8°C · 서울 12.8 · 대관령 7.1 · 춘천 11.4 · 대전 13.3 · 대구 14.5 · 부산 15.0 · 제주 16.2
//   (출처: 기상청 기후자료개방포털 data.kma.go.kr/normals). 5단계 경계는 전국평균(12.8)을 중심으로
//   실제 관측지점 군집에 맞춰 설정 — 냉각 관점에선 '낮을수록 유리'.
//
// 값 우선순위(정직성): ① 케이웨더 과거 연별 실측 avgTemp → ② 기상청 평년값(최근접 관측지점) →
//   ③ 현재기온 근사(참고치). 어떤 근거로 산출됐는지 basedOn/basis로 항상 표기한다.

const LEVELS = [
  { level: 5, label: '아주좋음', labelEn: 'Excellent', tone: 'vgood', why: '연중 외기냉방(프리쿨링) 가능시간이 매우 길어 냉각에 쓰는 전력(PUE)이 낮음 — 냉방 OPEX·수자원 부담 최소', whyEn: 'Outside-air free-cooling hours are very long year-round, so cooling power (PUE) stays low — minimal cooling OPEX and water burden' },
  { level: 4, label: '좋음', labelEn: 'Good', tone: 'good', why: '외기냉방 잠재력이 높아 냉각 효율이 유리 — 냉방 전력비 절감 여지가 큼', whyEn: 'High free-cooling potential favours cooling efficiency — large room to cut cooling power cost' },
  { level: 3, label: '보통', labelEn: 'Moderate', tone: 'mid', why: '냉방 부하와 외기냉방이 균형 — 표준적 냉각 설계로 대응 가능(전국 평균권)', whyEn: 'Cooling load and free-cooling are balanced — manageable with a standard cooling design (around the national average)' },
  { level: 2, label: '나쁨', labelEn: 'Poor', tone: 'bad', why: '여름 냉방 부하가 커 냉각 전력·수자원 부담이 늘어남 — PUE 불리', whyEn: 'Summer cooling load is heavy, raising cooling power and water burden — unfavourable PUE' },
  { level: 1, label: '아주나쁨', labelEn: 'Very poor', tone: 'vbad', why: '온난(다습)해 연중 기계식 냉방 의존이 큼 — PUE·수자원·냉방 OPEX 부담 최대', whyEn: 'Warm (and humid), so mechanical cooling is relied on year-round — maximum PUE, water and cooling-OPEX burden' },
]
export const CLIMATE_LEVELS = LEVELS

/** 연평균기온(℃) → 5단계 냉각 적합도. 경계는 기상청 평년값(전국 12.8℃) 기준 */
function levelFromTemp(t) {
  if (t <= 11.0) return LEVELS[0] // 아주좋음 — 강원 산간·내륙(대관령 7.1·홍천·춘천 11.4)
  if (t <= 12.5) return LEVELS[1] // 좋음 — 중부 내륙·수도권 이북(원주·안동·수원 12.5)
  if (t <= 13.8) return LEVELS[2] // 보통 — 수도권 도심·중부(서울 12.8·대전 13.3·강릉/전주 13.5)
  if (t <= 15.0) return LEVELS[3] // 나쁨 — 남부·동남권(광주 14.2·대구 14.5·부산 15.0)
  return LEVELS[4] // 아주나쁨 — 제주·서귀포 등 온난 다습(제주 16.2·서귀포 17.0)
}

// 기상청 ASOS 지점별 연평균기온 평년값(1991~2020) — 케이웨더 과거기후 미확보 시
// 최근접 지점값으로 연평균을 근사(참고치). 좌표는 관측지점 근사 위치.
const KMA_NORMALS = [
  { name: '대관령', lat: 37.677, lng: 128.718, t: 7.1 },
  { name: '홍천', lat: 37.684, lng: 127.881, t: 11.2 },
  { name: '춘천', lat: 37.902, lng: 127.736, t: 11.4 },
  { name: '충주', lat: 36.97, lng: 127.953, t: 11.9 },
  { name: '원주', lat: 37.338, lng: 127.947, t: 12.0 },
  { name: '안동', lat: 36.573, lng: 128.707, t: 12.2 },
  { name: '수원', lat: 37.257, lng: 126.983, t: 12.5 },
  { name: '서산', lat: 36.776, lng: 126.494, t: 12.5 },
  { name: '서울', lat: 37.571, lng: 126.966, t: 12.8 },
  { name: '인천', lat: 37.478, lng: 126.625, t: 12.8 },
  { name: '청주', lat: 36.639, lng: 127.441, t: 13.1 },
  { name: '대전', lat: 36.372, lng: 127.372, t: 13.3 },
  { name: '강릉', lat: 37.751, lng: 128.891, t: 13.5 },
  { name: '전주', lat: 35.841, lng: 127.119, t: 13.5 },
  { name: '광주', lat: 35.173, lng: 126.891, t: 14.2 },
  { name: '목포', lat: 34.817, lng: 126.381, t: 14.2 },
  { name: '대구', lat: 35.885, lng: 128.619, t: 14.5 },
  { name: '포항', lat: 36.033, lng: 129.38, t: 14.6 },
  { name: '울산', lat: 35.582, lng: 129.33, t: 14.6 },
  { name: '여수', lat: 34.739, lng: 127.741, t: 14.6 },
  { name: '창원', lat: 35.17, lng: 128.573, t: 14.9 },
  { name: '부산', lat: 35.105, lng: 129.032, t: 15.0 },
  { name: '제주', lat: 33.514, lng: 126.53, t: 16.2 },
  { name: '서귀포', lat: 33.246, lng: 126.565, t: 17.0 },
]

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** 최근접 기상청 관측지점의 연평균 평년값 — { name, t, km } | null */
export function nearestNormal(lat, lng) {
  if (lat == null || lng == null) return null
  let best = null
  for (const s of KMA_NORMALS) {
    const km = haversineKm(lat, lng, s.lat, s.lng)
    if (!best || km < best.km) best = { name: s.name, t: s.t, km }
  }
  return best
}

/**
 * @param {{avgTemp?:number, normalTemp?:number, normalStation?:string, humidity?:number, currentTemp?:number}} d
 * @returns {{level,label,labelEn,tone,temp,basedOn,why,whyEn,basis,basisEn,note,noteEn}|null}
 */
export function dcClimateIndex({ avgTemp, normalTemp, normalStation, humidity, currentTemp } = {}) {
  // 우선순위: 실측 연평균 → 기상청 평년값 → 현재기온 근사
  let t
  let basedOn
  let basis
  let basisEn
  if (avgTemp != null) {
    t = avgTemp
    basedOn = 'annual'
    basis = `케이웨더 과거 연별 실측 연평균 ${t}°C`
    basisEn = `KWeather observed annual mean ${t}°C`
  } else if (normalTemp != null) {
    t = normalTemp
    basedOn = 'normal'
    basis = `기상청 평년값(1991–2020) 연평균 ${t}°C${normalStation ? ` · 최근접 ${normalStation} 관측` : ''}`
    basisEn = `기상청 climate normals (1991–2020) annual mean ${t}°C${normalStation ? ` · nearest ${normalStation} station` : ''}`
  } else if (currentTemp != null) {
    t = currentTemp
    basedOn = 'current'
    basis = `현재기온 ${t}°C 근사(연평균 미확보 — 참고치)`
    basisEn = `current temperature ${t}°C approximation (annual mean unavailable — reference)`
  } else {
    return null
  }

  const base = levelFromTemp(t)
  // 고습(연 70%+)은 증발식·외기냉방 효율을 떨어뜨림 — 경계선(보통 이상)일 때만 1단계 하향 보조
  let level = base.level
  let humidNote = null
  let humidNoteEn = null
  if (humidity != null && humidity >= 70 && level >= 3) {
    level = Math.max(1, level - 1)
    humidNote = `습도 ${humidity}%로 증발식·외기냉방 효율 저하 → 1단계 하향`
    humidNoteEn = `humidity ${humidity}% lowers evaporative/free-cooling efficiency → dropped one level`
  }
  const adj = LEVELS.find((l) => l.level === level)
  const why = `${adj.why}${humidNote ? ` · ${humidNote}` : ''}`
  const whyEn = `${adj.whyEn}${humidNoteEn ? ` · ${humidNoteEn}` : ''}`
  const note = `${basis} · ${why}`
  const noteEn = `${basisEn} · ${whyEn}`
  return { level: adj.level, label: adj.label, labelEn: adj.labelEn, tone: adj.tone, temp: t, basedOn, why, whyEn, basis, basisEn, note, noteEn }
}
