// 부지 적합도 스코어링 엔진 v0 — SPEC §5.2 5축 100점 골격
// 원칙: 가짜 점수 금지 — 지금 계산 가능한 근거만 점수화하고, 나머지는 pending(데이터 소스 명시).
// 커버리지가 낮은 상태의 총점 표기는 "근거 확보분 기준"으로만 한다.
import { FACILITIES } from '../data/facilities.js'
import { checkPowerTrack } from '../calc/trackCheck.js'
import { SUBSTATION_POINTS } from '../data/substationPoints.js'
import { nearestIndustrialComplex } from '../data/industrialComplexes.js'
import { networkContext } from '../data/network.js'

const EARTH_R = 6371

export function haversineKm(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(lat2 - lat1)
  const dLng = rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_R * Math.asin(Math.sqrt(a))
}

export function nearestFacilities(lat, lng, n = 3) {
  return FACILITIES.map((f) => ({ facility: f, km: haversineKm(lat, lng, f.lat, f.lng) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, n)
}

// 최근접 154kV+ 변전소(OSM). [lat, lng, kV, name] 배열에서 하버사인 최소거리.
export function nearestSubstation(lat, lng) {
  let best = null
  for (const [sLat, sLng, kv, name] of SUBSTATION_POINTS) {
    const km = haversineKm(lat, lng, sLat, sLng)
    if (!best || km < best.km) best = { km, kv, name }
  }
  return best
}

// 최근접 154kV+ 변전소 거리(km) → 접속 근접성 점수(15점 만점). 가까울수록 인입선 비용·리드타임↓.
function substationPoints(km) {
  if (km == null) return null
  if (km <= 1) return 15
  if (km <= 3) return 13
  if (km <= 6) return 10.5
  if (km <= 12) return 7
  if (km <= 25) return 4
  return 1.5
}

// 노출률(%) → 점수: 0%면 만점, 50%+면 0점 선형. 값 없으면 pending.
function exposureItem(label, max, o, pendingMsg) {
  if (o?.available && o.source === 'sgis' && o.exposurePct != null) {
    const points = Math.round(max * (1 - Math.min(1, o.exposurePct / 50)) * 10) / 10
    return { label, max, points, basis: `영향구역 인구 노출 ${o.exposurePct}%${o.grade ? ` (${o.grade})` : ''}` }
  }
  return { label, max, points: null, pending: pendingMsg }
}

// DC 기후지수 단계(1 아주좋음 ~ 5 아주나쁨) → 냉각 점수(10점 만점)
const CLIMATE_POINTS = { 1: 10, 2: 8, 3: 6, 4: 3, 5: 0 }

// 용도지역 → DC 입지 적합성(국토계획법 기준 통용). vworld 도시계획 uses[] 문자열 분류. 12점 배점.
function zoneAdmissibility(uses) {
  const s = (uses || []).join(' ')
  if (!s) return null
  if (/(전용공업|일반공업|준공업|공업지역)/.test(s)) return { pts: 12, tier: '공업지역 — 적합(입지 유리)' }
  if (/계획관리/.test(s)) return { pts: 9, tier: '계획관리지역 — 조건부 적합' }
  if (/(자연녹지|생산관리)/.test(s)) return { pts: 6, tier: '녹지·관리지역 — 조건부(개별 확인)' }
  if (/(상업지역|준주거)/.test(s)) return { pts: 5, tier: '상업·준주거 — 제한적' }
  if (/주거지역/.test(s)) return { pts: 3, tier: '주거지역 — 부적합 경향' }
  if (/(보전녹지|생산녹지|농림|자연환경보전|보전관리)/.test(s)) return { pts: 0, tier: '보전·농림 — 부적합' }
  return { pts: 5, tier: '용도지역 확인 필요' }
}

// 지역 계통 공급여유(MW, 한전 연계가능용량 시도 총량) → 배전 여유 점수(10점 만점).
// 시도 총량 신호이므로 시군구 편차는 basis에 명시(포화(≤10)는 신규 대형부하 불가 → 0점).
function headroomPoints(mw) {
  if (mw == null) return null
  if (mw <= 10) return 0
  if (mw <= 100) return 2
  if (mw <= 300) return 4
  if (mw <= 700) return 6
  if (mw <= 1500) return 7.5
  if (mw <= 3000) return 9
  return 10
}

// 네트워크 근접성 → 점수(10점): 백본 국사/IDC/IX 거리 7점 + 해저케이블 육양국 거리 3점.
function networkPoints(backboneKm, clsKm) {
  let p = 0
  if (backboneKm != null) p += backboneKm <= 2 ? 7 : backboneKm <= 5 ? 5.5 : backboneKm <= 15 ? 4 : backboneKm <= 40 ? 2 : 1
  if (clsKm != null) p += clsKm <= 30 ? 3 : clsKm <= 80 ? 2 : clsKm <= 150 ? 1 : 0.3
  return Math.round(Math.min(10, p) * 10) / 10
}

// DC 전력계통영향평가 공급 승인율(%) → 계통 공급 가능성 점수(10점 만점).
function approvalPoints(pct) {
  if (pct == null) return null
  if (pct >= 95) return 10
  if (pct >= 80) return 8.5
  if (pct >= 60) return 6.5
  if (pct >= 45) return 4.5
  if (pct >= 30) return 3
  return 1
}

export function scoreSite({ lat, lng, mw = 40, nonCapital = true, flood = null, landslide = null, pop = null, climate = null, plantKm = null, landUse = null, gridMw = null, gridApproval = null } = {}) {
  const track = checkPowerTrack(mw, { nonCapital })

  // 계통 공급 가능성 — DC 전력계통영향평가 승인율(실데이터) 우선, 없으면 수도권/비수도권 트랙 이진 프록시.
  const gridImpactItem =
    gridApproval != null
      ? {
          label: '계통 공급 가능성 (전력계통영향평가 DC 승인율)',
          max: 10,
          points: approvalPoints(gridApproval),
          basis: `DC 공급가능율 ${gridApproval}% (한전 전력계통영향평가 '26.3) · ${nonCapital ? '비수도권' : '수도권'}`,
        }
      : {
          label: '계통영향평가 지역 리스크',
          max: 10,
          points: nonCapital ? 10 : 0,
          basis: nonCapital
            ? '비수도권: 신속 처리 + AIDC 특별법 면제 트랙(2027.2~)'
            : '수도권: 감점 — 계통영향평가 전면 적용',
        }

  // 토지축(25): 용도지역 적합성(12) + 산업단지 입지(6) + 부지 면적(4) + 지가 부담(3)
  const luAdm = landUse?.uses?.length ? zoneAdmissibility(landUse.uses) : null
  const zoneItem = luAdm
    ? { label: '용도지역 적합성 (vworld 도시계획)', max: 12, points: luAdm.pts, basis: `${luAdm.tier} · ${landUse.uses.join('·')}` }
    : { label: '용도지역 적합성 (vworld 도시계획)', max: 12, points: null, pending: 'vworld 용도지역 조회 필요' }

  // 산업단지 입지 — 인센티브·전력/용수 기반시설 사전확보. 최근접 산단 거리 기반(데이터 확보 시 활성).
  const ic = nearestIndustrialComplex(lat, lng)
  const icItem = ic
    ? {
        label: '산업단지 입지 (인센티브·기반시설)',
        max: 6,
        points: ic.km <= 1 ? 6 : ic.km <= 3 ? 5 : ic.km <= 7 ? 3.5 : ic.km <= 15 ? 2 : 0.5,
        basis: `최근접 산단 ${ic.name}${ic.type ? `(${ic.type})` : ''} ${ic.km.toFixed(1)}km`,
      }
    : { label: '산업단지 입지 (인센티브·기반시설)', max: 6, points: null, pending: '산업단지 경계·대표점 데이터 확보 후(공단/vworld)' }

  const areaItem = { label: '부지 면적 확보', max: 4, points: null, pending: 'vworld 파셀 면적 조회 후 점수화' }
  const priceItem = { label: '지가 부담', max: 3, points: null, pending: '공시지가(원/㎡) 확보 후 — 지가변동률은 참고 표시 중' }

  // 자가발전 인접(직접 PPA·자가발전 잠재) — 발전단지 최근접 거리 기반. 가까울수록 가점.
  // 배전 여유 프록시 — 지역 계통 공급여유(한전 연계가능용량, 시도 총량). 값 있으면 점수화.
  const gridItem =
    gridMw != null
      ? {
          label: '배전 여유 (한전 계통 공급여유)',
          max: 10,
          points: headroomPoints(gridMw),
          basis: `시도 총 공급여유 ${gridMw.toLocaleString()}MW (2027 전망) · 시군구별 편차 있음`,
        }
      : { label: '배전 여유 (한전 계통 공급여유)', max: 10, points: null, pending: '한전 연계가능용량(공급여유) 조회 필요' }

  // 154kV+ 변전소 거리 — OSM 변전소 좌표 기반 최근접 거리(실계산).
  const subDist = nearestSubstation(lat, lng)
  const subDistItem = subDist
    ? {
        label: '154kV+ 변전소 거리',
        max: 15,
        points: substationPoints(subDist.km),
        basis: `최근접 ${subDist.name || `${subDist.kv}kV 변전소`} ${subDist.km.toFixed(1)}km (${subDist.kv}kV) · OSM`,
      }
    : { label: '154kV+ 변전소 거리', max: 15, points: null, pending: 'OSM 변전소 좌표 로드 필요' }

  const selfGenItem =
    plantKm != null
      ? {
          label: '자가발전 인접 (발전단지 최근접)',
          max: 5,
          points: plantKm <= 10 ? 5 : plantKm <= 30 ? 3.5 : plantKm <= 60 ? 2 : plantKm <= 100 ? 1 : 0,
          basis: `최근접 발전단지 ${Math.round(plantKm)}km`,
        }
      : { label: '자가발전 인접', max: 5, points: null, pending: '발전소 위치 데이터' }

  // 리스크축: 침수(SGIS 홍수위험) 6 + 산사태(SGIS) 5 + 민원(SGIS 인구밀도) 4 = 15
  const floodItem = exposureItem('침수 위험 (SGIS 홍수위험지도)', 6, flood, 'SGIS 홍수위험지도 조회 필요')
  const landslideItem = exposureItem('산사태 위험 (SGIS 산사태위험지도)', 5, landslide, 'SGIS 산사태위험지도 조회 필요')
  const densityItem =
    pop?.available && pop.density != null
      ? {
          label: '민원 프록시 (SGIS 인구밀도)',
          max: 4,
          points: pop.density < 2000 ? 4 : pop.density < 5000 ? 3 : pop.density < 10000 ? 1.5 : 0,
          basis: `밀도 ${pop.density.toLocaleString()}명/km²`,
        }
      : { label: '민원 프록시 (SGIS 인구밀도)', max: 4, points: null, pending: 'SGIS 인구 조회 필요' }

  // 기상(냉각)축: DC 기후지수 단계 → 10점
  const climateItem =
    climate?.level != null && CLIMATE_POINTS[climate.level] != null
      ? { label: '프리쿨링·냉각 적합도 (기후지수)', max: 10, points: CLIMATE_POINTS[climate.level], basis: `DC 기후지수 ${climate.label ?? `${climate.level}단계`} · 연평균 ${climate.temp ?? '—'}°C` }
      : { label: '프리쿨링·냉각 적합도 (기후지수)', max: 10, points: null, pending: '기온 확보 후 산출(기상청 평년값/케이웨더)' }

  // 네트워크축 — 최근접 백본 국사/IDC/IX + 해저케이블 육양국(OSM telecom + 육양국 시드).
  const net = networkContext({ lat, lng })
  const netItem = net.backbone
    ? {
        label: '네트워크 근접성 (백본 국사·IDC·IX / 해저케이블)',
        max: 10,
        points: networkPoints(net.backbone.km, net.cls?.km),
        basis: `최근접 ${net.backbone.node.name} ${net.backbone.km.toFixed(1)}km${net.cls ? ` · 해저케이블 육양국 ${net.cls.km.toFixed(0)}km` : ''}`,
      }
    : { label: '네트워크 근접성 (백본 국사·IDC·IX / 해저케이블)', max: 10, points: null, pending: 'OSM telecom 노드 로드 필요' }

  const axes = [
    {
      key: 'power',
      label: '전력',
      max: 40,
      items: [
        subDistItem,
        gridItem,
        gridImpactItem,
        selfGenItem,
      ],
    },
    {
      key: 'land',
      label: '토지',
      max: 25,
      items: [zoneItem, icItem, areaItem, priceItem],
    },
    {
      key: 'risk',
      label: '리스크',
      max: 15,
      items: [floodItem, landslideItem, densityItem],
    },
    {
      key: 'network',
      label: '네트워크',
      max: 10,
      items: [netItem],
    },
    {
      key: 'weather',
      label: '기상',
      max: 10,
      items: [climateItem],
    },
  ]

  let knownScore = 0
  let knownMax = 0
  for (const axis of axes) {
    axis.known = 0
    axis.knownMax = 0
    for (const it of axis.items) {
      if (it.points != null) {
        axis.known += it.points
        axis.knownMax += it.max
      }
    }
    axis.known = Math.round(axis.known * 10) / 10
    knownScore += axis.known
    knownMax += axis.knownMax
  }
  knownScore = Math.round(knownScore * 10) / 10

  return {
    lat,
    lng,
    axes,
    knownScore,
    knownMax,
    coverage: knownMax, // 100점 만점 대비 근거 확보 배점
    track,
    nearest: nearestFacilities(lat, lng, 3),
    nearestSub: subDist,
  }
}
