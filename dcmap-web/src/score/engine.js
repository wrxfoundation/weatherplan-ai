// 부지 적합도 스코어링 엔진 v0 — SPEC §5.2 5축 100점 골격
// 원칙: 가짜 점수 금지 — 지금 계산 가능한 근거만 점수화하고, 나머지는 pending(데이터 소스 명시).
// 커버리지가 낮은 상태의 총점 표기는 "근거 확보분 기준"으로만 한다.
import { FACILITIES } from '../data/facilities.js'
import { checkPowerTrack } from '../calc/trackCheck.js'

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

export function scoreSite({ lat, lng, mw = 40, nonCapital = true, flood = null, landslide = null, pop = null, climate = null, plantKm = null, landUse = null } = {}) {
  const track = checkPowerTrack(mw, { nonCapital })

  // 토지축: 용도지역 적합성(12, vworld 라이브) + 면적·인센티브·지가(13, 파셀 데이터 대기)
  const luAdm = landUse?.uses?.length ? zoneAdmissibility(landUse.uses) : null
  const zoneItem = luAdm
    ? { label: '용도지역 적합성 (vworld 도시계획)', max: 12, points: luAdm.pts, basis: `${luAdm.tier} · ${landUse.uses.join('·')}` }
    : { label: '용도지역 적합성 (vworld 도시계획)', max: 12, points: null, pending: 'vworld 용도지역 조회 필요' }

  // 자가발전 인접(직접 PPA·자가발전 잠재) — 발전단지 최근접 거리 기반. 가까울수록 가점.
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

  const axes = [
    {
      key: 'power',
      label: '전력',
      max: 40,
      items: [
        { label: '154kV+ 변전소 거리', max: 15, points: null, pending: '정부 345kV 여유 변전소 정보 공개 대기' },
        { label: '배전 여유 프록시', max: 10, points: null, pending: 'D3(kepco-headroom) 어댑터 가동 후' },
        {
          label: '계통영향평가 지역 리스크',
          max: 10,
          points: nonCapital ? 10 : 0,
          basis: nonCapital
            ? '비수도권: 신속 처리 + AIDC 특별법 면제 트랙(2027.2~)'
            : '수도권: 감점 — 계통영향평가 전면 적용',
        },
        selfGenItem,
      ],
    },
    {
      key: 'land',
      label: '토지',
      max: 25,
      items: [
        zoneItem,
        {
          label: '면적·인센티브·지가',
          max: 13,
          points: null,
          pending: '파셀 면적·산단 인센티브 확보 후 점수화(지가변동률은 참고표시 중)',
        },
      ],
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
      items: [{ label: '백본·국사 거리·해저케이블 육양국', max: 10, points: null, pending: '네트워크 노드 시드(공개 근사·검증 대기) — 근접성 표기, 점수화는 좌표 검증·가중치 캘리브레이션 후' }],
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
  }
}
