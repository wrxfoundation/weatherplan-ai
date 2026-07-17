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

// 등급 라벨 KO→EN (SGIS 노출등급 등 통제 어휘). 데이터 아닌 판정어라 번역.
const GRADE_EN = { 높음: 'High', 보통: 'Moderate', 낮음: 'Low', 매우높음: 'Very high', 매우낮음: 'Very low' }
const gradeEn = (g) => (g ? GRADE_EN[g] ?? g : g)

// 노출률(%) → 점수: 0%면 만점, 50%+면 0점 선형. 값 없으면 pending.
function exposureItem(label, labelEn, max, o, pendingMsg, pendingEn) {
  if (o?.available && o.source === 'sgis' && o.exposurePct != null) {
    const points = Math.round(max * (1 - Math.min(1, o.exposurePct / 50)) * 10) / 10
    return {
      label, labelEn, max, points,
      basis: `영향구역 인구 노출 ${o.exposurePct}%${o.grade ? ` (${o.grade})` : ''}`,
      basisEn: `Affected-area pop. exposure ${o.exposurePct}%${o.grade ? ` (${gradeEn(o.grade)})` : ''}`,
    }
  }
  return { label, labelEn, max, points: null, pending: pendingMsg, pendingEn }
}

// DC 기후지수 단계(1 아주좋음 ~ 5 아주나쁨) → 냉각 점수(10점 만점)
// 기후지수 단계→점수. LEVELS는 5=아주좋음(한랭·프리쿨링 최적)~1=아주나쁨(온난). 좋은 냉각일수록 高점(이전 역전 버그 수정).
const CLIMATE_POINTS = { 5: 10, 4: 8, 3: 6, 2: 3, 1: 0 }

// 용도지역 → DC 입지 적합성(국토계획법 기준 통용). vworld 도시계획 uses[] 문자열 분류. 12점 배점.
function zoneAdmissibility(uses) {
  const s = (uses || []).join(' ')
  if (!s) return null
  if (/(전용공업|일반공업|준공업|공업지역)/.test(s)) return { pts: 12, tier: '공업지역 — 적합(입지 유리)', tierEn: 'Industrial zone — suitable (favourable)' }
  if (/계획관리/.test(s)) return { pts: 9, tier: '계획관리지역 — 조건부 적합', tierEn: 'Planned-management zone — conditionally suitable' }
  if (/(자연녹지|생산관리)/.test(s)) return { pts: 6, tier: '녹지·관리지역 — 조건부(개별 확인)', tierEn: 'Green/management zone — conditional (case-by-case)' }
  if (/(상업지역|준주거)/.test(s)) return { pts: 5, tier: '상업·준주거 — 제한적', tierEn: 'Commercial/semi-residential — limited' }
  if (/주거지역/.test(s)) return { pts: 3, tier: '주거지역 — 부적합 경향', tierEn: 'Residential — tends unsuitable' }
  if (/(보전녹지|생산녹지|농림|자연환경보전|보전관리)/.test(s)) return { pts: 0, tier: '보전·농림 — 부적합', tierEn: 'Conservation/agri-forest — unsuitable' }
  return { pts: 5, tier: '용도지역 확인 필요', tierEn: 'Zoning needs confirmation' }
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

// 관할 변전소 전력공급 여유(MW, 한전ON 실측) → 전력공급 여유 점수(10점 만점).
// 시도 총량 프록시보다 정밀: 필요용량 대비 여유배수로 채점. 전 기간 0(포화)이면 0점.
function supplyHeadroomPoints(availMw, reqMw) {
  if (availMw == null) return null
  if (availMw <= 0) return 0
  const need = Math.max(reqMw || 40, 20)
  return Math.round(Math.min(10, (availMw / (need * 3)) * 10) * 10) / 10
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

// 파셀 면적(㎡) → 부지 면적 점수(4점 만점). DC 캠퍼스는 대형 부지 유리.
function areaPoints(m2) {
  if (m2 == null) return null
  if (m2 >= 50000) return 4
  if (m2 >= 20000) return 3
  if (m2 >= 10000) return 2
  if (m2 >= 3000) return 1
  return 0.5
}

// 공시지가(원/㎡) → 지가 부담 점수(3점). DC는 대형 부지라 저지가 유리(원가↓).
function pricePoints(won) {
  if (won == null) return null
  if (won <= 200000) return 3
  if (won <= 500000) return 2.5
  if (won <= 1000000) return 2
  if (won <= 3000000) return 1
  return 0.5
}

export function scoreSite({ lat, lng, mw = 40, nonCapital = true, flood = null, landslide = null, pop = null, climate = null, plantKm = null, landUse = null, gridMw = null, gridApproval = null, parcelArea = null, parcelPrice = null, substSupplyMw = null, substSupplyName = null } = {}) {
  const track = checkPowerTrack(mw, { nonCapital })

  // 계통 공급 가능성 — DC 전력계통영향평가 승인율(실데이터) 우선, 없으면 수도권/비수도권 트랙 이진 프록시.
  const gridImpactItem =
    gridApproval != null
      ? {
          label: '계통 공급 가능성 (전력계통영향평가 DC 승인율)',
          labelEn: 'Grid supply feasibility (PSIA DC approval rate)',
          max: 10,
          points: approvalPoints(gridApproval),
          basis: `DC 공급가능율 ${gridApproval}% (한전 전력계통영향평가 '26.3) · ${nonCapital ? '비수도권' : '수도권'}`,
          basisEn: `DC supply approval ${gridApproval}% (KEPCO PSIA '26.3) · ${nonCapital ? 'Non-capital' : 'Capital'}`,
        }
      : {
          // 승인율 실측이 아직 없을 때의 '지역 정책 프록시' — 좌표/주소로 확인되는 수도권 여부(실제 known 값)
          // 기반의 코스한 신호. 정직성: 정밀 승인율과 혼동되지 않게 라벨·근거에 '프록시·승인율 미확보' 명시.
          label: '지역 정책 프록시 (승인율 미확보)',
          labelEn: 'Regional policy proxy (approval rate N/A)',
          max: 10,
          points: nonCapital ? 10 : 0,
          proxy: true,
          basis: nonCapital
            ? '비수도권 유인(신속 처리 + AIDC 특별법 면제 2027.2~) — 코스 프록시, 정밀 DC 승인율 확보 시 대체'
            : '수도권 감점(계통영향평가 전면 적용) — 코스 프록시, 정밀 DC 승인율 확보 시 대체',
          basisEn: nonCapital
            ? 'Non-capital incentive (fast-track + AIDC special-act exemption from 2027.2) — coarse proxy, replaced by precise DC approval rate'
            : 'Capital penalty (full PSIA applies) — coarse proxy, replaced by precise DC approval rate',
        }

  // 토지축(25): 용도지역 적합성(12) + 산업단지 입지(6) + 부지 면적(4) + 지가 부담(3)
  const luAdm = landUse?.uses?.length ? zoneAdmissibility(landUse.uses) : null
  const zoneItem = luAdm
    ? { label: '용도지역 적합성 (vworld 도시계획)', labelEn: 'Zoning suitability (vworld urban plan)', max: 12, points: luAdm.pts, basis: `${luAdm.tier} · ${landUse.uses.join('·')}`, basisEn: `${luAdm.tierEn} · ${landUse.uses.join('·')}` }
    : { label: '용도지역 적합성 (vworld 도시계획)', labelEn: 'Zoning suitability (vworld urban plan)', max: 12, points: null, pending: 'vworld 용도지역 조회 필요', pendingEn: 'Needs vworld zoning lookup' }

  // 산업단지 입지 — 인센티브·전력/용수 기반시설 사전확보. 최근접 산단 거리 기반(데이터 확보 시 활성).
  const ic = nearestIndustrialComplex(lat, lng)
  const icItem = ic
    ? {
        label: '산업단지 입지 (인센티브·기반시설)',
        labelEn: 'Industrial-park location (incentives·infra)',
        max: 6,
        points: ic.km <= 1 ? 6 : ic.km <= 3 ? 5 : ic.km <= 7 ? 3.5 : ic.km <= 15 ? 2 : 0.5,
        basis: `최근접 산단 ${ic.name}${ic.type ? `(${ic.type})` : ''} ${ic.km.toFixed(1)}km`,
        basisEn: `Nearest park ${ic.name}${ic.type ? `(${ic.type})` : ''} ${ic.km.toFixed(1)}km`,
      }
    : { label: '산업단지 입지 (인센티브·기반시설)', labelEn: 'Industrial-park location (incentives·infra)', max: 6, points: null, pending: '산업단지 경계·대표점 데이터 확보 후(공단/vworld)', pendingEn: 'After industrial-park boundary/point data (KICOX/vworld)' }

  const areaItem =
    parcelArea?.areaM2 != null
      ? { label: '부지 면적 확보 (vworld 지적)', labelEn: 'Site area (vworld cadastre)', max: 4, points: areaPoints(parcelArea.areaM2), basis: `필지 면적 ${parcelArea.areaM2.toLocaleString()}㎡`, basisEn: `Parcel area ${parcelArea.areaM2.toLocaleString()}㎡` }
      : { label: '부지 면적 확보', labelEn: 'Site area', max: 4, points: null, pending: 'vworld 파셀 면적 조회 후 점수화', pendingEn: 'Scored after vworld parcel-area lookup' }
  const priceItem =
    parcelPrice?.available && parcelPrice.pricePerM2 != null
      ? { label: '지가 부담 (개별공시지가)', labelEn: 'Land-price burden (official land price)', max: 3, points: pricePoints(parcelPrice.pricePerM2), basis: `공시지가 ${parcelPrice.pricePerM2.toLocaleString()}원/㎡${parcelPrice.year ? ` (${parcelPrice.year})` : ''}`, basisEn: `Official land price ${parcelPrice.pricePerM2.toLocaleString()} KRW/㎡${parcelPrice.year ? ` (${parcelPrice.year})` : ''}` }
      : { label: '지가 부담', labelEn: 'Land-price burden', max: 3, points: null, pending: '공시지가(원/㎡) 확보 후 — 지가변동률은 참고 표시 중', pendingEn: 'After official land price (KRW/㎡) — land-price change shown for reference' }

  // 자가발전 인접(직접 PPA·자가발전 잠재) — 발전단지 최근접 거리 기반. 가까울수록 가점.
  // 전력공급 여유 — 관할 변전소 실측(한전ON, 시군구 최대 여유) 우선, 없으면 시도 총량 프록시.
  const gridItem =
    substSupplyMw != null
      ? {
          label: '전력공급 여유 (관할 변전소 실측)',
          labelEn: 'Power supply headroom (measured · local substation)',
          max: 10,
          points: supplyHeadroomPoints(substSupplyMw, mw),
          basis: `관할 ${substSupplyName ? `${substSupplyName}변전소 ` : ''}최대 여유 ${substSupplyMw.toLocaleString()}MW (한전ON · 필요 ${mw}MW 대비) · 전기사용신청 후 확정`,
          basisEn: `Managing ${substSupplyName ? `${substSupplyName} substation ` : ''}max headroom ${substSupplyMw.toLocaleString()}MW (KEPCO ON · vs ${mw}MW needed) · confirmed after power application`,
        }
      : gridMw != null
        ? {
            label: '배전 여유 (한전 계통 공급여유 · 시도 총량)',
            labelEn: 'Distribution headroom (KEPCO grid capacity · province total)',
            max: 10,
            points: headroomPoints(gridMw),
            basis: `시도 총 공급여유 ${gridMw.toLocaleString()}MW (2027 전망) · 시군구별 편차 있음`,
            basisEn: `Province total supply headroom ${gridMw.toLocaleString()}MW (2027 outlook) · varies by district`,
          }
        : { label: '전력공급 여유', labelEn: 'Power supply headroom', max: 10, points: null, pending: '부지 클릭 시 한전ON 관할 변전소 여유 조회(또는 시도 총량)', pendingEn: 'Click a site for KEPCO ON local substation headroom (or province total)' }

  // 154kV+ 변전소 거리 — OSM 변전소 좌표 기반 최근접 거리(실계산).
  const subDist = nearestSubstation(lat, lng)
  const subDistItem = subDist
    ? {
        label: '154kV+ 변전소 거리',
        labelEn: '154kV+ substation distance',
        max: 15,
        points: substationPoints(subDist.km),
        basis: `최근접 ${subDist.name || `${subDist.kv}kV 변전소`} ${subDist.km.toFixed(1)}km (${subDist.kv}kV) · OSM`,
        basisEn: `Nearest ${subDist.name || `${subDist.kv}kV substation`} ${subDist.km.toFixed(1)}km (${subDist.kv}kV) · OSM`,
      }
    : { label: '154kV+ 변전소 거리', labelEn: '154kV+ substation distance', max: 15, points: null, pending: 'OSM 변전소 좌표 로드 필요', pendingEn: 'Needs OSM substation coordinates' }

  const selfGenItem =
    plantKm != null
      ? {
          label: '자가발전 인접 (발전단지 최근접)',
          labelEn: 'On-site generation proximity (nearest plant)',
          max: 5,
          points: plantKm <= 10 ? 5 : plantKm <= 30 ? 3.5 : plantKm <= 60 ? 2 : plantKm <= 100 ? 1 : 0,
          basis: `최근접 발전단지 ${Math.round(plantKm)}km`,
          basisEn: `Nearest power complex ${Math.round(plantKm)}km`,
        }
      : { label: '자가발전 인접', labelEn: 'On-site generation proximity', max: 5, points: null, pending: '발전소 위치 데이터', pendingEn: 'Power-plant location data' }

  // 리스크축: 침수(SGIS 홍수위험) 6 + 산사태(SGIS) 5 + 민원(SGIS 인구밀도) 4 = 15
  const floodItem = exposureItem('침수 위험 (SGIS 홍수위험지도)', 'Flood risk (SGIS flood map)', 6, flood, 'SGIS 홍수위험지도 조회 필요', 'Needs SGIS flood map lookup')
  const landslideItem = exposureItem('산사태 위험 (SGIS 산사태위험지도)', 'Landslide risk (SGIS landslide map)', 5, landslide, 'SGIS 산사태위험지도 조회 필요', 'Needs SGIS landslide map lookup')
  const densityItem =
    pop?.available && pop.density != null
      ? {
          label: '민원 프록시 (SGIS 인구밀도)',
          labelEn: 'Complaint proxy (SGIS pop. density)',
          max: 4,
          points: pop.density < 2000 ? 4 : pop.density < 5000 ? 3 : pop.density < 10000 ? 1.5 : 0,
          basis: `밀도 ${pop.density.toLocaleString()}명/km²`,
          basisEn: `Density ${pop.density.toLocaleString()}/km²`,
        }
      : { label: '민원 프록시 (SGIS 인구밀도)', labelEn: 'Complaint proxy (SGIS pop. density)', max: 4, points: null, pending: 'SGIS 인구 조회 필요', pendingEn: 'Needs SGIS population lookup' }

  // 기상(냉각)축: DC 기후지수 단계 → 10점
  const climateItem =
    climate?.level != null && CLIMATE_POINTS[climate.level] != null
      ? { label: '프리쿨링·냉각 적합도 (기후지수)', labelEn: 'Free-cooling suitability (climate index)', max: 10, points: CLIMATE_POINTS[climate.level], basis: `DC 기후지수 ${climate.label ?? `${climate.level}단계`} · 연평균 ${climate.temp ?? '—'}°C`, basisEn: `DC climate index ${climate.labelEn ?? climate.label ?? `L${climate.level}`} · annual mean ${climate.temp ?? '—'}°C` }
      : { label: '프리쿨링·냉각 적합도 (기후지수)', labelEn: 'Free-cooling suitability (climate index)', max: 10, points: null, pending: '기온 확보 후 산출(기상청 평년값/케이웨더)', pendingEn: 'Computed after temperature (KMA normals / KWeather)' }

  // 네트워크축 — 최근접 백본 국사/IDC/IX + 해저케이블 육양국(OSM telecom + 육양국 시드).
  const net = networkContext({ lat, lng })
  const netItem = net.backbone
    ? {
        label: '네트워크 근접성 (백본 국사·IDC·IX / 해저케이블)',
        labelEn: 'Network proximity (backbone CO·IDC·IX / subsea cable)',
        max: 10,
        points: networkPoints(net.backbone.km, net.cls?.km),
        basis: `최근접 ${net.backbone.node.name} ${net.backbone.km.toFixed(1)}km${net.cls ? ` · 해저케이블 육양국 ${net.cls.km.toFixed(0)}km` : ''}`,
        basisEn: `Nearest ${net.backbone.node.name} ${net.backbone.km.toFixed(1)}km${net.cls ? ` · subsea landing ${net.cls.km.toFixed(0)}km` : ''}`,
      }
    : { label: '네트워크 근접성 (백본 국사·IDC·IX / 해저케이블)', labelEn: 'Network proximity (backbone CO·IDC·IX / subsea cable)', max: 10, points: null, pending: 'OSM telecom 노드 로드 필요', pendingEn: 'Needs OSM telecom nodes' }

  const axes = [
    {
      key: 'power',
      label: '전력',
      labelEn: 'Power',
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
      labelEn: 'Land',
      max: 25,
      items: [zoneItem, icItem, areaItem, priceItem],
    },
    {
      key: 'risk',
      label: '리스크',
      labelEn: 'Risk',
      max: 15,
      items: [floodItem, landslideItem, densityItem],
    },
    {
      key: 'network',
      label: '네트워크',
      labelEn: 'Network',
      max: 10,
      items: [netItem],
    },
    {
      key: 'weather',
      label: '기상',
      labelEn: 'Climate',
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
