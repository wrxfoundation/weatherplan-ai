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

export function scoreSite({ lat, lng, mw = 40, nonCapital = true }) {
  const track = checkPowerTrack(mw, { nonCapital })

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
        { label: '자가발전 인접', max: 5, points: null, pending: '발전소 위치 데이터' },
      ],
    },
    {
      key: 'land',
      label: '토지',
      max: 25,
      items: [
        {
          label: '용도지역·인센티브·면적·지가',
          max: 25,
          points: null,
          pending: '지가변동률(KOSIS 월간) 확보 — 용도지역·면적(vworld) 연동 후 점수화',
        },
      ],
    },
    {
      key: 'risk',
      label: '리스크',
      max: 15,
      items: [{ label: '군사·문화재·상수원·민원 프록시·침수/재해', max: 15, points: null, pending: '홍수위험지도(침수)·SGIS 인구격자·재난안전 재해연보 — 프록시 구현, env 연동 시 실점수화' }],
    },
    {
      key: 'network',
      label: '네트워크',
      max: 10,
      items: [{ label: '백본·국사 거리·해저케이블', max: 10, points: null, pending: '공개 통신 인프라 데이터' }],
    },
    {
      key: 'weather',
      label: '기상',
      max: 10,
      items: [{ label: '프리쿨링·습구온도·침수/태풍', max: 10, points: null, pending: '기상청 공공 데이터(M3)' }],
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
    knownScore += axis.known
    knownMax += axis.knownMax
  }

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
