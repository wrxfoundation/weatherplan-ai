import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUS_LABEL, isCapitalByAddr, isCapitalByPoint, FACILITIES } from '../data/facilities.js'
import { useMapLang } from '../i18n/mapLang.js'
import { landPriceFor, fmtRate } from '../data/landPrice.js'
import { dongPulseFor } from '../data/landPriceDong.js'
import { forecastFor, headroomFor, headroomListFor, transHeadroomFor, landUseFor, landRegFor, landAreaFor, landPriceOfficialFor, parcelAt, revgeoFor, weatherFor, floodRiskFor, populationFor, disasterFor, bldEnergyFor, warningFor, climateFor, waterCapacity, kwaterInfra, dongLabel } from '../data/liveApi.js'
import { geomAreaM2 } from '../data/geomArea.js'
import { nearestPlant, windContext } from '../data/plants.js'
import { networkContext } from '../data/network.js'
import { substationForSido } from '../data/substations.js'
import { POWER_BALANCE, selfSufficiencyLabel } from '../data/powerBalance.js'
import { gridHeadroomForSido, headroomLabel } from '../data/gridHeadroom.js'
import { dcApprovalForSido, approvalLabel } from '../data/gridAssessment.js'
import { nearestIndustrialComplex } from '../data/industrialComplexes.js'
import { nearestRenewable } from '../data/renewablePlants.js'
import { nearestWaterSource } from '../data/waterSources.js'
import { nearestCluster } from '../data/semiClusters.js'
import { scoreSite, haversineKm } from './engine.js'
import { matchSubstationCoord } from '../data/substationPoints.js'
import { buildSiteReport } from './report.js'
import { dcClimateIndex, CLIMATE_LEVELS, nearestNormal } from './climateIndex.js'
import Term from '../components/Term.jsx'
import { useAiStream } from '../ai/useAiStream.js'
import AiResultCard from '../ai/AiResultCard.jsx'
import CopyButton from '../ui/CopyButton.jsx'
import LineIcon from '../components/LineIcon.jsx'
import PsiaScorecard from './PsiaScorecard.jsx'
import { psiaScore, psiaOutlook } from './psia.js'

/* SGIS 행정구역명은 레벨 경계 공백 없이 붙어 옴("경기도남양주시오남읍") — 시도/시군구(최대 2)/읍면동으로 분해해 띄어쓰기 */
function fmtAdmNm(s) {
  const m = String(s)
    .replace(/\s+/g, '')
    .match(/^([가-힣]+?(?:특별자치도|특별자치시|특별시|광역시|도))?([가-힣]+?(?:시|군|구))?([가-힣]+?(?:시|군|구))?(.+)?$/)
  return m ? [m[1], m[2], m[3], m[4]].filter(Boolean).join(' ') : s
}

/* 맵 UI i18n Phase 2 — SitePanel 가시 프레임 KO/EN(FilterBar와 공유 스토어). 데이터값·출처 각주는 KO 유지(Phase 3). */
const SP_T = {
  '← 목록으로': '← Back',
  '지점 분석': 'Point analysis',
  '부지 적합도 프리뷰': 'Site suitability preview',
  점: '',
  '근거 확보 · 스코어 커버리지': 'Evidence · coverage',
  '입지는 사업 실현가능성 5관문 중 1관문 — 전력·자금·GPU 규격·가동률이 남았습니다':
    'Location is only gate 1 of 5 — power, capital, GPU spec and utilization remain',
  '공개 데이터 불러오는 중…': 'Loading public data…',
  '응답 없는 축은 완료 후 ‘데이터 없음’으로 표시': 'Axes with no response show “no data” when done',
  '✓ 공개 데이터 조회 완료 — 빈 항목은 해당 소스 미제공/연동 대기':
    '✓ Public data loaded — blank items are unavailable / pending',
  비수도권: 'Non-capital', 수도권: 'Capital',
  변전소: 'Substation', 계통승인: 'Grid approval', 여유: 'Headroom',
  '0(포화)': '0 (full)', 냉각: 'Cooling', 침수: 'Flood', 산사태: 'Landslide', 밀도: 'Density',
  저: 'Low', 고: 'High', 낮음: 'Low',
  매우좋음: 'Very good', 좋음: 'Good', 보통: 'Fair', 나쁨: 'Poor', 매우나쁨: 'Very poor',
  높음: 'High', 중간: 'Medium',
  '입지 구분 (주소 기준 자동판정 · 수정 가능)': 'Region (auto by address · editable)',
  '필요 용량 (MW)': 'Required capacity (MW)',
  전력: 'Power', 토지: 'Land', 리스크: 'Risk', 네트워크: 'Network', 기상: 'Climate',
  대기: 'pending',
  '링크 복사됨 ✓': 'Link copied ✓',
  '점수화 로드맵 — 연동된 축 / 남은 대기': 'Scoring roadmap — live axes / pending',
  'AI 분석 중…': 'Analyzing…', '✨ AI 부지 브리프': '✨ AI site brief',
  '간이 리포트 복사': 'Copy brief', 복사됨: 'Copied',
  'PDF 저장': 'Save PDF', '.md 다운로드': '.md download',
  '비교에 추가됨 ✓': 'Added to compare ✓', '⚖ 비교에 추가': '⚖ Add to compare',
  '✦ 이 부지 정밀 리포트·컨설팅 문의 →': '✦ Request a detailed report / consulting →',
}

/* 맵 지점 클릭 → 부지 간이 분석 (시안 ScorePanel 자리의 정직한 v0 · L2 리포트 훅) */
export default function SitePanel({ point, onClose, onSelectFacility, onAddCompare, inCompare, onSubstations }) {
  const lang = useMapLang()
  const t = (ko) => (lang === 'en' ? SP_T[ko] ?? ko : ko)
  const [mw, setMw] = useState(40)
  const [nonCapital, setNonCapital] = useState(true)
  const zoneTouched = useRef(false) // 사용자가 입지 구분을 직접 바꿨으면 자동판정으로 덮어쓰지 않음
  const [addr, setAddr] = useState(null)
  const [wx, setWx] = useState(null)
  const [landUse, setLandUse] = useState(null)
  const [landReg, setLandReg] = useState(null)
  const [landArea, setLandArea] = useState(null)
  const [energySeries, setEnergySeries] = useState(null) // null | 'loading' | [{ym, usage}] — 6개월 추이(온디맨드)
  const [substList, setSubstList] = useState(null) // null | 'loading' | [{name, mw}] — 관내 변전소별 여유(온디맨드)
  const [officialPrice, setOfficialPrice] = useState(null)
  const [fc, setFc] = useState(null)
  const [headroom, setHeadroom] = useState(null)
  const [transHr, setTransHr] = useState(null) // 변전소 송전망 여유용량(연도별) — 한전ON

  // 전력공급 여유 변전소 → 실좌표 매칭 후 지도 레이어로 전달(색상=여유 유무). 부모(MapPage)가 플롯.
  useEffect(() => {
    if (!onSubstations) return
    if (!transHr?.available) {
      onSubstations([])
      return
    }
    const byName = new Map()
    for (const s of transHr.supply?.kv154 || []) byName.set(s.name, { ...s, kv: '154kV' })
    for (const s of transHr.supply?.kv23 || []) if (!byName.has(s.name)) byName.set(s.name, { ...s, kv: '22.9kV' })
    const out = []
    for (const s of byName.values()) {
      const c = matchSubstationCoord(s.name)
      if (c) out.push({ name: s.name, kv: s.kv, lat: c.lat, lng: c.lng, series: s.series, years: s.years, maxMw: s.maxMw, firstAvailYear: s.firstAvailYear })
    }
    onSubstations(out)
  }, [transHr, onSubstations])
  const [flood, setFlood] = useState(null)
  const [pop, setPop] = useState(null)
  const [disaster, setDisaster] = useState(null)
  const [energy, setEnergy] = useState(null)
  const [warning, setWarning] = useState(null)
  const [climate, setClimate] = useState(null)
  const [water, setWater] = useState(null)
  const [kwater, setKwater] = useState(null)
  const [copied, setCopied] = useState(false)
  // 로딩 상태 — 값 null이 '불러오는 중'인지 '데이터 없음'인지 구분(스피너 vs 미제공).
  const [loading, setLoading] = useState(true)
  // AI 부지 브리프: null(미생성) | 'loading' | { text, model } | { error }
  const { ai, run, reset, busy } = useAiStream()

  useEffect(() => {
    let alive = true
    // 새 지점: 좌표 bbox로 수도권 잠정 판정(주소 확보 시 정정). 사용자 수동선택 플래그 초기화.
    zoneTouched.current = false
    setLoading(true)
    reset()
    setNonCapital(!isCapitalByPoint(point.lat, point.lng))
    setAddr(null)
    setWx(null)
    setLandUse(null)
    setLandReg(null)
    setLandArea(null)
    setOfficialPrice(null)
    setFc(null)
    setHeadroom(null)
    setTransHr(null)
    setFlood(null)
    setPop(null)
    setDisaster(null)
    setEnergy(null)
    setWarning(null)
    setClimate(null)
    // 발사한 모든 공개데이터 요청을 추적 → 전부 settle되면 loading=false(그 후의 null은 '데이터 없음').
    const jobs = []
    jobs.push(warningFor(point.lat, point.lng).then((v) => alive && setWarning(v)))
    jobs.push(climateFor(point.lat, point.lng).then((v) => alive && setClimate(v)))
    jobs.push(
      revgeoFor(point.lat, point.lng)
        .catch(() => null)
        .then((v) => {
          if (!alive) return
          setAddr(v)
          // 주소 확보되면 시도 접두로 수도권 여부 정정(bbox보다 정확). 사용자가 안 건드렸을 때만.
          const capByAddr = isCapitalByAddr(v?.parcel || v?.road)
          if (!zoneTouched.current && capByAddr != null) setNonCapital(!capByAddr)
          // SGIS 인구/밀도 — 서버가 SGIS 리버스지오코딩(좌표)으로 읍면동 정밀 조회(1순위). 그게 막히면
          // 브라우저가 받은 법정동코드/시군구명으로 폴백하도록 함께 전달(headroom·disaster와 동일 원칙).
          const sggAll = (v?.parcel || '').match(/[가-힣]+(?:시|군|구)/g)
          const sgg = sggAll ? sggAll[sggAll.length - 1] : undefined
          const nested = []
          nested.push(populationFor(point.lat, point.lng, v?.sigunguCd, sgg).then((e) => alive && setPop(e)))
          // 지번 법정동코드가 확보되면 건축HUB 지번 전기사용량 조회(최근 데이터는 2~3개월 지연)
          if (v?.sigunguCd && v?.bjdongCd) {
            const d = new Date()
            d.setMonth(d.getMonth() - 3)
            const useYm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
            nested.push(
              bldEnergyFor({ sigunguCd: v.sigunguCd, bjdongCd: v.bjdongCd, bun: v.bun, ji: v.ji, useYm }).then(
                (e) => alive && setEnergy(e),
              ),
            )
          }
          // 여유용량·재해: 브라우저가 받은 법정동코드를 서버로 넘겨 서버측 vworld(Vercel IP 502) 우회.
          // 코드 없으면(브라우저 vworld 미활성) admCd 없이 호출 → 서버 vworld 폴백(막히면 정직히 대기).
          nested.push(headroomFor(point.lat, point.lng, v?.legalCode).then((e) => alive && setHeadroom(e)))
          // 변전소 송전망 여유용량(연도별) — 한전ON(법정동코드 필요). 실패는 정직히 대기.
          if (v?.legalCode) nested.push(transHeadroomFor(v.legalCode).then((e) => alive && setTransHr(e)))
          nested.push(disasterFor(point.lat, point.lng, v?.legalCode).then((e) => alive && setDisaster(e)))
          return Promise.allSettled(nested)
        }),
    )
    jobs.push(weatherFor(point.lat, point.lng).then((v) => alive && setWx(v)))
    jobs.push(landUseFor(point.lat, point.lng).then((v) => alive && setLandUse(v)))
    jobs.push(landRegFor(point.lat, point.lng).then((v) => alive && setLandReg(v)))
    jobs.push(
      landAreaFor(point.lat, point.lng).then(async (v) => {
        if (!alive) return
        if (v) {
          setLandArea(v)
          if (v?.pnu) return landPriceOfficialFor(v.pnu).then((p) => alive && setOfficialPrice(p))
          return undefined
        }
        // 클라 vworld 키가 없으면 서버 연속지적(parcel) 폴백 — 면적(도형 계산)·지번·지목까지 확보
        const p = await parcelAt(point.lat, point.lng).catch(() => null)
        if (!alive || !p?.available) return undefined
        const areaM2 = p.geometry ? Math.round(geomAreaM2(p.geometry) ?? 0) || null : null
        const jimok = (String(p.jibun || '').trim().match(/([가-힣])$/) || [])[1] || null
        setLandArea({ areaM2, jibun: p.jibun ?? null, jimok, pnu: p.pnu ?? null, source: 'server-parcel' })
        if (p.pnu) return landPriceOfficialFor(p.pnu).then((pr) => alive && setOfficialPrice(pr))
        return undefined
      }),
    )
    jobs.push(forecastFor(point.lat, point.lng).then((v) => alive && setFc(v)))
    jobs.push(floodRiskFor(point.lat, point.lng).then((v) => alive && setFlood(v)))
    Promise.allSettled(jobs).then(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [point])

  // 용수 지역 신호(전국 시도 집계) — 지점 무관, 1회 로드(캐시). 냉각수 확보 여건.
  //  · WAMIS 공업용수 취수 시설용량(㎥/일) · K-water 실시간 수도시설(정수장·취수장·가압장) 밀도.
  useEffect(() => {
    let alive = true
    waterCapacity().then((v) => alive && setWater(v))
    kwaterInfra().then((v) => alive && setKwater(v))
    return () => {
      alive = false
    }
  }, [])

  // 데이터센터 기후지수 — 연평균기온 우선순위: 케이웨더 과거기후 → 기상청 평년값(최근접) → 현재기온.
  const normal = useMemo(() => nearestNormal(point.lat, point.lng), [point])
  const climateIdx = useMemo(
    () =>
      dcClimateIndex({
        avgTemp: climate?.available ? climate.avgTemp : undefined,
        normalTemp: normal?.t,
        normalStation: normal?.name,
        humidity: wx?.humidity,
        currentTemp: wx?.temp,
      }),
    [climate, wx, normal],
  )

  // 주소 시도(정규화) — 지역 전력 여건·계통 공급여유 조회 키.
  const sido = useMemo(() => {
    const s = addr?.parcel || addr?.road || ''
    // 특별자치도 신명칭·법정 장형·단형 모두 수용(전북특별자치도 등 미매칭 방지)
    const m = s.match(
      /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원특별자치도|강원|충청북도|충청남도|전북특별자치도|전라북도|전라남도|경상북도|경상남도|충북|충남|전북|전남|경북|경남|제주특별자치도|제주)/,
    )
    const map = {
      강원특별자치도: '강원',
      충청북도: '충북',
      충청남도: '충남',
      전북특별자치도: '전북',
      전라북도: '전북',
      전라남도: '전남',
      경상북도: '경북',
      경상남도: '경남',
      제주특별자치도: '제주',
    }
    return m ? map[m[1]] || m[1] : null
  }, [addr])
  // 지역 계통 공급여유(한전 연계가능용량, 시도 총량) — 배전 여유 점수 근거.
  const grid = useMemo(() => gridHeadroomForSido(sido), [sido])
  // DC 전력계통영향평가 공급 승인율(시도) — 계통 공급 가능성 점수 근거(실데이터).
  const approval = useMemo(() => dcApprovalForSido(sido), [sido])

  // 경쟁·집적 밀도 — 반경 내 기존/계획 DC 수. 집적=인프라 성숙, 과밀=전력·부지 경쟁(양면).
  const competition = useMemo(() => {
    const within = (km) => FACILITIES.filter((f) => haversineKm(point.lat, point.lng, f.lat, f.lng) <= km)
    const r10 = within(10)
    return { n10: r10.length, op10: r10.filter((f) => f.status === 'operating').length, n30: within(30).length }
  }, [point])

  // 정적 데이터셋 최근접 스캔(O(n) 하버사인)은 point당 1회만 — 리렌더 13회+에서 재계산 방지.
  const np = useMemo(() => nearestPlant(point), [point])
  const wc = useMemo(() => windContext(point), [point])
  const reNear = useMemo(() => nearestRenewable(point.lat, point.lng), [point])
  const waterNear = useMemo(() => nearestWaterSource(point.lat, point.lng), [point])
  const clusterNear = useMemo(() => nearestCluster(point.lat, point.lng), [point])
  const icNear = useMemo(() => nearestIndustrialComplex(point.lat, point.lng), [point])

  // 스코어링 — 라이브 SGIS 리스크(침수·산사태·인구)·기후지수·발전단지 근접·계통 공급여유·DC 승인율을 실제 점수축에 반영(로드되며 갱신).
  const plantKm = np?.km ?? null
  // 관할 변전소 전력공급 여유 최대치(한전ON 실측) — 전력축 배전 여유 점수의 정밀 근거.
  const bestSupply = useMemo(() => {
    const all = [
      ...(transHr?.supply?.kv154 || []).map((s) => ({ ...s, kv: '154kV' })),
      ...(transHr?.supply?.kv23 || []).map((s) => ({ ...s, kv: '22.9kV' })),
    ]
    return all.length ? all.reduce((b, s) => (s.maxMw > (b?.maxMw ?? -1) ? s : b), null) : null
  }, [transHr])
  const r = useMemo(
    () => scoreSite({ lat: point.lat, lng: point.lng, mw, nonCapital, flood, landslide: disaster, pop, climate: climateIdx, plantKm, landUse, gridMw: grid?.mw ?? null, gridApproval: approval?.ratePct ?? null, parcelArea: landArea, parcelPrice: officialPrice, substSupplyMw: bestSupply?.maxMw ?? null, substSupplyName: bestSupply?.name ?? null }),
    [point, mw, nonCapital, flood, disaster, pop, climateIdx, plantKm, landUse, grid, approval, landArea, officialPrice, bestSupply],
  )
  const dong = dongLabel(addr) // 표출값 동단위 근거지

  // AI 부지 브리프 — 실제 확보된 값만 스냅샷으로 넘긴다(없으면 null → 프롬프트가 '미확보'로 처리).
  const genAiReport = () => {
    const snap = {
      좌표: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
      주소: addr?.parcel || addr?.road || null,
      시도: sido,
      입지: nonCapital ? '비수도권' : '수도권',
      필요용량MW: mw,
      근거점수: `${r.knownScore}/${r.knownMax}`,
      커버리지pct: r.knownMax ? Math.round((r.knownScore / r.knownMax) * 100) : null,
      전력: {
        계통공급여유MW_시도총량: grid?.mw ?? null,
        DC공급승인율pct: approval?.ratePct ?? null,
        최근접변전소km: r.nearestSub?.km ?? null,
        배전여유MW_22_9kV: headroom?.available ? (headroom.availableMw ?? null) : null,
        전력공급여유_관할변전소: bestSupply
          ? { 변전소: bestSupply.name, 최대여유MW: bestSupply.maxMw, 최초여유연도: bestSupply.firstAvailYear, 전압: bestSupply.kv || null }
          : null,
      },
      토지: { 필지면적m2: landArea?.areaM2 ?? null, 용도지역: landUse?.uses?.[0] ?? null, 공시지가원per_m2: officialPrice?.pricePerM2 ?? null },
      리스크: {
        침수노출pct: flood?.available && flood.source === 'sgis' ? flood.exposurePct : null,
        산사태노출pct: disaster?.available && disaster.source === 'sgis' ? disaster.exposurePct : null,
        인구밀도per_km2: pop?.available ? (pop.density ?? null) : null,
      },
      네트워크점수10: r.axes.find((a) => a.key === 'network')?.known ?? null,
      기상: { 기후등급: climateIdx?.level ?? null, 기후라벨: climateIdx?.label ?? null },
      발전단지거리km: plantKm ?? null,
      축상태: r.axes.map((a) => ({ 축: a.label, 확보: a.knownMax > 0 ? `${a.known}/${a.max}` : '대기' })),
      // 계통영향평가 통과 전망(공개 대리지표 규칙 추정 — 공식 판정 아님) — AI가 브리프에 인용
      계통영향평가전망: (() => {
        const { composite, coverage } = psiaScore({ nonCapital, mw, gridMw: grid?.mw ?? null, approvalPct: approval?.ratePct ?? null, subKm: r.nearestSub?.km ?? null })
        return { 점수100: composite, 판정: psiaOutlook(composite, mw).label, 커버리지pct: coverage, 주의: '공개 대리지표 규칙 추정 — 공식 배점 아님' }
      })(),
    }
    run('report', { data: snap })
  }
  // 지점 변경 시 온디맨드 조회 결과 초기화(다른 지점의 값이 남지 않게)
  useEffect(() => {
    setEnergySeries(null)
    setSubstList(null)
  }, [point])

  // 관내 변전소별 여유 목록 — 온디맨드(추가 호출 1회)
  const loadSubstList = async () => {
    if (substList === 'loading') return
    setSubstList('loading')
    const r = await headroomListFor(point.lat, point.lng, addr?.legalCode).catch(() => null)
    setSubstList(r?.available && Array.isArray(r.list) ? r.list : [])
  }

  // 건축HUB 6개월 추이 — 호출 6회라 온디맨드(버튼). 최근월은 2~3개월 지연 반영.
  const loadEnergySeries = async () => {
    if (!addr?.sigunguCd || !addr?.bjdongCd || energySeries === 'loading') return
    setEnergySeries('loading')
    const months = [...Array(6)]
      .map((_, i) => {
        const d = new Date()
        d.setDate(1)
        d.setMonth(d.getMonth() - 3 - i)
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
      })
      .reverse()
    const vals = await Promise.all(
      months.map((ym) =>
        bldEnergyFor({ sigunguCd: addr.sigunguCd, bjdongCd: addr.bjdongCd, bun: addr.bun, ji: addr.ji, useYm: ym })
          .then((r) => ({ ym, usage: r?.available ? r.usage ?? null : null }))
          .catch(() => ({ ym, usage: null })),
      ),
    )
    setEnergySeries(vals)
  }

  // 지역 전력 여건(한전 변전소 현황 + 전력 자급률 + 계통 공급여유) — 주소 시도 기준. 참고 맥락(부지별 여유량 아님).
  const regionPower = useMemo(
    () => (sido ? { sido, sub: substationForSido(sido), bal: POWER_BALANCE[sido] || null, grid, approval } : null),
    [sido, grid, approval],
  )

  return (
    <>
      <h2>
        <button type="button" className="chip btn" onClick={onClose}>
          {t('← 목록으로')}
        </button>
      </h2>
      <article className="facility-card">
        <div className="status-line">
          <span className="badge status-operating">{t('지점 분석')}</span>
          <button
            type="button"
            className="badge badge-btn"
            title="이 지점 분석의 공유 링크 복사"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href)
                setCopied('link')
                setTimeout(() => setCopied(false), 2000)
              } catch {
                /* noop */
              }
            }}
          >
            {copied === 'link' ? t('링크 복사됨 ✓') : `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)} 🔗`}
          </button>
        </div>
        <h3>{t('부지 적합도 프리뷰')}</h3>
        <div className="score-headline">
          <span className="score-headline-val">{r.knownScore}<span className="score-headline-max">/{r.knownMax}{t('점')}</span></span>
          <span className="score-headline-cov">{t('근거 확보 · 스코어 커버리지')} {r.coverage}/100</span>
        </div>

        {/* 5관문 맥락 — 입지 점수는 사업 실현가능성의 첫 관문일 뿐임을 명시(정직성). 상세는 인사이트로. */}
        <Link className="gate-strip" to="/insights/build-reality-2026" title="데이터센터 사업의 5관문 — 지을 수 있나·채울 수 있나">
          <span className="gate-strip-dots" aria-hidden>
            <b className="on">1</b><i>2</i><i>3</i><i>4</i><i>5</i>
          </span>
          <span className="gate-strip-txt">
            {lang === 'en'
              ? t('입지는 사업 실현가능성 5관문 중 1관문 — 전력·자금·GPU 규격·가동률이 남았습니다')
              : <><b>입지</b>는 사업 실현가능성 <b>5관문 중 1관문</b> — 전력·자금·GPU 규격·가동률이 남았습니다</>}
          </span>
          <span className="gate-strip-arr" aria-hidden>→</span>
        </Link>

        {/* 로딩 고지 — 공개 데이터 조회 중임을 명시(끝나면 사라짐 → 이후의 '대기'는 데이터 없음). */}
        {loading ? (
          <div className="sp-loading" role="status" aria-live="polite">
            <span className="sp-spinner" aria-hidden />
            {t('공개 데이터 불러오는 중…')} <span className="sp-loading-sub">{t('응답 없는 축은 완료 후 ‘데이터 없음’으로 표시')}</span>
          </div>
        ) : (
          <div className="sp-loaded" role="status">{t('✓ 공개 데이터 조회 완료 — 빈 항목은 해당 소스 미제공/연동 대기')}</div>
        )}

        {/* 한눈에 — 핵심 판단값을 색 칩으로. 값은 아래 상세와 동일 소스(로드되며 채워짐). */}
        {(() => {
          const climateTone = climateIdx ? (climateIdx.level >= 4 ? 'good' : climateIdx.level === 3 ? 'warn' : 'bad') : null
          const expoTone = (o) => (o.exposurePct >= 30 ? 'bad' : o.exposurePct > 0 ? 'warn' : 'good')
          return (
            <div className="site-summary" aria-label="지점 한눈에 요약">
              <span className={`sum-chip tone-${nonCapital ? 'good' : 'warn'}`}>{t(nonCapital ? '비수도권' : '수도권')}</span>
              {r.nearestSub && (
                <span className={`sum-chip tone-${r.nearestSub.km <= 3 ? 'good' : r.nearestSub.km <= 12 ? 'warn' : 'bad'}`}>
                  {t('변전소')} {r.nearestSub.km.toFixed(1)}km
                </span>
              )}
              {approval?.ratePct != null && (
                <span className={`sum-chip tone-${approval.ratePct >= 70 ? 'good' : approval.ratePct >= 45 ? 'warn' : 'bad'}`}>
                  {t('계통승인')} {approval.ratePct}%
                </span>
              )}
              {bestSupply && (
                <span
                  className={`sum-chip tone-${bestSupply.maxMw <= 0 ? 'bad' : bestSupply.maxMw >= mw * 3 ? 'good' : 'warn'}`}
                  title={`관할 ${bestSupply.name}변전소 ${bestSupply.kv} · 한전ON 전력공급 여유`}
                >
                  {t('여유')} {bestSupply.maxMw > 0 ? `${bestSupply.maxMw.toLocaleString()}MW` : t('0(포화)')}
                </span>
              )}
              {climateIdx && <span className={`sum-chip tone-${climateTone}`}>{t('냉각')} {t(climateIdx.label)}</span>}
              {flood?.available && flood.source === 'sgis' && (
                <span className={`sum-chip tone-${expoTone(flood)}`}>{t('침수')} {flood.exposurePct <= 0 ? t('낮음') : t(flood.grade)}</span>
              )}
              {disaster?.available && disaster.source === 'sgis' && (
                <span className={`sum-chip tone-${expoTone(disaster)}`}>{t('산사태')} {disaster.exposurePct <= 0 ? t('낮음') : t(disaster.grade)}</span>
              )}
              {pop?.available && pop.density != null && (
                <span className={`sum-chip tone-${pop.density < 3000 ? 'good' : 'warn'}`}>
                  {t('밀도')} {pop.density < 3000 ? t('저') : t('고')}
                </span>
              )}
              {competition.n10 > 0 && (
                <span className={`sum-chip tone-${competition.n10 >= 5 ? 'warn' : 'good'}`}>{lang === 'en' ? `DC within 10km ${competition.n10}` : `DC 반경10km ${competition.n10}곳`}</span>
              )}
            </div>
          )
        })()}

        <div className="calc-grid">
          <label>
            {t('입지 구분 (주소 기준 자동판정 · 수정 가능)')}
            <select
              value={nonCapital ? 'non' : 'cap'}
              onChange={(e) => {
                zoneTouched.current = true
                setNonCapital(e.target.value === 'non')
              }}
            >
              <option value="non">{t('비수도권')}</option>
              <option value="cap">{t('수도권')}</option>
            </select>
          </label>
          <label>
            {t('필요 용량 (MW)')}
            <input
              type="number"
              min="1"
              value={mw}
              onChange={(e) => setMw(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        </div>

        <div className="score-axes">
          {r.axes.map((axis) => (
            <div key={axis.key} className="hbar-row">
              <span className="hbar-label">{t(axis.label)}</span>
              <span className="hbar-track">
                {axis.knownMax > 0 && (
                  <>
                    {/* 확보 구간(knownMax/max) 표시 — '대기'와 '약함' 혼동 방지: 획득분은 실색, 확보-미획득은 옅게, 나머지는 대기 */}
                    <span className="hbar-known" style={{ width: `${(axis.knownMax / axis.max) * 100}%` }} />
                    <span className="hbar-fill" style={{ width: `${(axis.known / axis.max) * 100}%` }} />
                  </>
                )}
              </span>
              <span className="hbar-value">
                {axis.knownMax > 0 ? (
                  <>
                    {axis.known}/{axis.knownMax}
                    {axis.knownMax < axis.max && <em className="hbar-wait" title={`${axis.max - axis.knownMax}점분 데이터 대기`}>+{axis.max - axis.knownMax} {t('대기')}</em>}
                  </>
                ) : (
                  <span className="badge pending">{t('대기')}</span>
                )}
              </span>
            </div>
          ))}
        </div>
        {(() => {
          const scored = r.axes.flatMap((a) => a.items.filter((i) => i.points != null && i.basis))
          if (!scored.length) return null
          return (
            <ul className="score-basis" aria-label="산출 근거">
              {scored.map((i) => (
                <li key={i.label}>
                  <b>{i.label}</b>
                  <span>{i.basis}</span>
                </li>
              ))}
            </ul>
          )
        })()}
        <details className="mini-details">
          <summary>{t('점수화 로드맵 — 연동된 축 / 남은 대기')}</summary>
          <ul className="score-basis roadmap-basis">
            <li>
              <b>이미 연동 (막대에 실값)</b>
              <span>154kV+ 변전소 거리(OSM) · 계통 공급여유(한전 17시도) · DC 전력공급 가능판정율(전력계통영향평가) · 자가발전 인접 · 냉각 기후지수 · 인구밀도 · 침수 · 산사태 · 네트워크(백본·해저케이블 육양 시설 근접, OSM)</span>
            </li>
            <li>
              <b>남은 대기</b>
              <span>부지 면적 · 산단 인센티브 · 지가 점수화(vworld 파셀) — 값이 확보된 축부터 위 5축 막대에 반영됩니다</span>
            </li>
          </ul>
        </details>

        {/* 전력계통영향평가 통과 스코어카드 — 공개 요인 정량화(규제 독점 분석) */}
        <PsiaScorecard
          nonCapital={nonCapital}
          mw={mw}
          gridMw={grid?.mw ?? null}
          approvalPct={approval?.ratePct ?? null}
          subKm={r.nearestSub?.km ?? null}
        />

        {/* 프로세스 관문 전망 — 용량·입지로 본 두 핵심 게이트(P07 접속·P08 계통영향평가) 통과 난이도 */}
        {(() => {
          const t = r.track
          let p07
          if (mw <= 10)
            p07 = { sev: 'ok', verdict: '22.9kV 배전 일반공급', note: '계약전력 1만kW 이하 원칙 — 계통 여유(헤드룸)가 지배 변수' }
          else if (mw <= 40)
            p07 = { sev: 'talk', verdict: '154kV 원칙 · 22.9kV 조건부', note: '제23조 ③-1: 변전소 여유 시 40MW까지 22.9kV 가능 · 40MW가 상한' }
          else p07 = { sev: 'gate', verdict: '154kV 의무', note: '자체 수전설비 투자 + 154kV 변전소 거리가 지배 변수' }

          let p08
          if (!t.psiaRequired) p08 = { sev: 'ok', verdict: '10MW 미만 · 비대상', note: '전력계통영향평가 대상 아님' }
          else if (nonCapital)
            p08 = {
              sev: 'talk',
              verdict: '대상 · 비수도권 유인',
              note: t.exemption
                ? `지역 배점 가점 여지 + ${t.exemption.effective}~ AIDC 특별법 면제 가능성`
                : '지역 배점 가점 여지 — 계통영향평가 대상',
            }
          else p08 = { sev: 'gate', verdict: '대상 · 수도권 감점', note: '±15점 중 수도권 억제 배점 — 핵심 관문' }

          const chip = (s) => (s === 'ok' ? 'status-operating' : 'verify')
          const rows = [
            { id: 'P07', title: '한전 접속·수전전압', ...p07 },
            { id: 'P08', title: '전력계통영향평가 ±15점', ...p08 },
          ]
          return (
            <>
              <div className="chart-title" style={{ marginTop: 14 }}>
                프로세스 관문 전망 — 이 지점 {mw}MW · {nonCapital ? '비수도권' : '수도권'}
              </div>
              <div className="gate-outlook">
                {rows.map((g) => (
                  <div key={g.id} className={`gate-row sev-${g.sev}`}>
                    <span className="gate-id">{g.id}</span>
                    <span className="gate-body">
                      <span className="gate-title">{g.title}</span>
                      <span className="gate-note">{g.note}</span>
                    </span>
                    <span className={`badge ${chip(g.sev)}`}>{g.verdict}</span>
                  </div>
                ))}
              </div>
              {/* 전력 확보 타임라인 — 관문 스테퍼(대상/면제/비대상 색). 실제 리드타임은 심의·계약에 따라 변동 */}
              {(() => {
                const t = r.track
                const steps = [
                  { k: '수전 협의', s: 'do', d: '한전 접속·수전전압' },
                  { k: '전기사용예정통지', s: t.preNoticeRequired ? 'do' : 'skip', d: t.preNoticeRequired ? '대상(5,000kW+)' : '비대상' },
                  { k: '계통영향평가', s: t.psiaRequired ? (t.exemption && nonCapital ? 'exempt' : 'do') : 'skip', d: t.psiaRequired ? (t.exemption && nonCapital ? `${t.exemption.effective}~ 면제 가능` : '대상(10MW+)') : '비대상' },
                  { k: '건축 인허가', s: 'do', d: '용도지역·건축허가' },
                  { k: '착공→준공', s: 'do', d: '전기설비·수전 준공' },
                ]
                return (
                  <div className="pwr-timeline" role="list" aria-label="전력 확보 관문 타임라인">
                    {steps.map((st, i) => (
                      <div key={st.k} className={`pt-step pt-${st.s}`} role="listitem" title={st.d}>
                        <span className="pt-node">{st.s === 'skip' ? '–' : st.s === 'exempt' ? '✓' : i + 1}</span>
                        <span className="pt-k">{st.k}</span>
                        <span className="pt-d">{st.d}</span>
                      </div>
                    ))}
                  </div>
                )
              })()}
              <p className="chart-note">
                용량·입지로 본 두 핵심 관문의 통과 난이도 추정 — 실제 판정은 한전·기후에너지환경부 심의.{' '}
                <Link to={`/?min_mw=${Math.max(1, Math.ceil(mw))}${nonCapital ? '&noncap=1' : ''}`}>
                  이 조건 통과 후보 맵 →
                </Link>{' '}
                · <Link to={`/calc?z=${nonCapital ? '1' : '0'}`}>이 입지로 GPU 계산 →</Link>{' '}
                · <Link to="/roadmap?view=frame">전체 프로세스 프레임 →</Link>
              </p>
            </>
          )
        })()}

        {/* 부지선정 핵심 — 전력·냉각·부지·리스크 순(항상 노출). 운영성 정보는 하단 접이식으로. */}
        <div className="spec-grid">
          <div className="spec-group-label" style={{ gridColumn: '1 / -1' }}><LineIcon name="power" /> 전력 <em>— DC 입지 1순위 제약</em></div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">이 지점 배전 접속여유 (<Term k="계통여유">한전 분산전원 22.9kV</Term> 라이브 조회 · 참고)</div>
            <div className="v">
              {headroom?.available ? (
                <>
                  {headroom.availableMw != null ? (
                    <strong>여유 {headroom.availableMw.toLocaleString()}MW</strong>
                  ) : (
                    <span className="badge pending">여유용량 미제공</span>
                  )}
                  {headroom.cumulativeMw != null && ` · 누적연계 ${headroom.cumulativeMw.toLocaleString()}MW`}
                  {headroom.capacityMw != null && ` · 용량 ${headroom.capacityMw.toLocaleString()}MW`}
                  {headroom.substNm && (
                    <span className="badge status-operating" style={{ marginLeft: 8 }}>{headroom.substNm}변전소</span>
                  )}
                  {headroom.rows != null && headroom.rows > 1 && (
                    <span className="meta"> · 관내 선로 {headroom.rows}개 중 최대 여유</span>
                  )}
                  {/* 관내 변전소별 여유 목록 — 온디맨드(호출 1회) */}
                  {substList == null && headroom.rows != null && headroom.rows > 1 && (
                    <button type="button" className="btn" style={{ marginLeft: 8, padding: '2px 9px', fontSize: 'var(--text-xs)' }} onClick={loadSubstList}>
                      변전소별 보기
                    </button>
                  )}
                  {substList === 'loading' && <span className="meta"> · 변전소별 조회 중…</span>}
                  {Array.isArray(substList) && (
                    <ul className="subst-list">
                      {substList.map((s2) => (
                        <li key={s2.name}>
                          <span className="sl-name">{s2.name}</span>
                          <span className="sl-bar">
                            <i style={{ width: `${Math.max(4, Math.round(((s2.mw ?? 0) / Math.max(...substList.map((x) => x.mw ?? 0), 1)) * 100))}%` }} />
                          </span>
                          <b className="sl-mw">{s2.mw != null ? `${s2.mw.toLocaleString()}MW` : '—'}</b>
                        </li>
                      ))}
                    </ul>
                  )}
                  {headroom.note && <div className="cell-basis">{headroom.note}</div>}
                </>
              ) : (
                <>
                  <span className="badge pending">실데이터 연동 대기 · 공개 API 미제공</span>
                  <a
                    className="mini-link"
                    href="https://online.kepco.co.kr/EWM092D00"
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginLeft: 8 }}
                  >
                    한전 여유용량 직접 조회 →
                  </a>
                </>
              )}
            </div>
          </div>
          {(() => {
            if (!transHr?.available) return null
            // 전력공급 여유(소비자 수전) 1순위: 154kV 우선, 없으면 22.9kV. 변전소명으로 병합.
            const byName = new Map()
            for (const s of transHr.supply?.kv154 || []) byName.set(s.name, { ...s, kv: '154kV' })
            for (const s of transHr.supply?.kv23 || []) if (!byName.has(s.name)) byName.set(s.name, { ...s, kv: '22.9kV' })
            const supply = [...byName.values()].sort((a, b) => (b.maxMw ?? 0) - (a.maxMw ?? 0))
            const renew = transHr.renew?.kv154 || []
            if (!supply.length && !renew.length) return null
            const Bars = ({ s }) => {
              const mx = Math.max(...s.series, 1)
              return (
                <span style={{ display: 'inline-flex', gap: 2, alignItems: 'flex-end', height: 20 }}>
                  {s.series.map((mw, i) => (
                    <i key={s.years[i]} title={`${s.years[i]} · ${mw.toLocaleString()}MW`}
                      style={{ width: 7, height: `${Math.max(2, Math.round((mw / mx) * 20))}px`, background: mw > 0 ? 'var(--accent, #B07E1E)' : 'var(--line, #556)', borderRadius: 1, display: 'inline-block' }} />
                  ))}
                </span>
              )
            }
            const Row = ({ s }) => {
              const coord = matchSubstationCoord(s.name)
              const distKm = coord ? Math.round(haversineKm(point.lat, point.lng, coord.lat, coord.lng)) : null
              return (
                <div className="th-row" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '3px 0' }}>
                  <span className="sl-name" style={{ minWidth: 52, fontWeight: 700 }}>{s.name}</span>
                  {s.kv && <span className="badge" style={{ fontSize: 'var(--text-xs)' }}>{s.kv}</span>}
                  {distKm != null && (
                    <span className="meta" title={`OSM 실좌표 ${coord.lat.toFixed(3)},${coord.lng.toFixed(3)} · ${coord.kv}kV`}>실위치 {distKm}km</span>
                  )}
                  <span className="meta" style={{ minWidth: 92 }}>
                    {s.firstAvailYear ? `${s.firstAvailYear}년 ${s.series[s.years.indexOf(s.firstAvailYear)]?.toLocaleString()}MW~` : '전 기간 0'}
                  </span>
                  <Bars s={s} />
                  <b className="sl-mw">최대 {s.maxMw.toLocaleString()}MW</b>
                </div>
              )
            }
            const spanYears = (supply[0] || renew[0])?.years
            return (
              <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="k">이 지역 관할 변전소 전력공급 여유용량 (한전ON · 소비자 수전 · 연도별 · 참고)
                  <span className="cell-basis" style={{ display: 'inline', marginLeft: 6 }}>· 검색 시군구 관할 변전소 기준(변전소 실제 소재지와 다를 수 있음)</span>
                </div>
                <div className="v">
                  {supply.length > 0 ? (
                    supply.slice(0, 5).map((s) => <Row key={`s-${s.name}`} s={s} />)
                  ) : (
                    <span className="badge pending">전력공급 여유 미조회 · 재생e 연계만 확인</span>
                  )}
                  {renew.length > 0 && (
                    <div className="cell-basis" style={{ marginTop: 6 }}>
                      참고 · 재생e 연계(발전) 여유: {renew.slice(0, 3).map((s) => `${s.name} 최대 ${s.maxMw.toLocaleString()}MW`).join(' · ')}
                    </div>
                  )}
                  <div className="cell-basis">{transHr.note}{spanYears ? ` · 막대=${spanYears[0]}~${spanYears.slice(-1)[0]}년` : ''}</div>
                </div>
              </div>
            )
          })()}
          <div className="spec-cell">
            <div className="k"><Term k="수전전압">수전전압</Term> 트랙</div>
            <div className="v">{r.track.track.voltage}</div>
          </div>
          <div className="spec-cell">
            <div className="k"><Term k="전력계통영향평가">계통영향평가</Term></div>
            <div className="v">
              {r.track.psiaRequired ? '대상' : '비대상'}
              {r.track.exemption && ` · ${r.track.exemption.effective}~ 면제 가능성`}
            </div>
          </div>
          {(() => {
            return np ? (
              <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="k"><Term k="발전단지">발전 인프라</Term> 근접성 (맥락 — 전원 매칭 아님)</div>
                <div className="v">
                  {np.plant.name} · {np.plant.type}
                  {np.plant.capacity_mw != null && ` · ${np.plant.capacity_mw.toLocaleString()}MW`} · {np.km.toFixed(0)}km
                  {wc.nearest && (
                    <span className="meta">
                      {' '}
                      · 풍력 {wc.radiusKm}km 내 {wc.count}지점 (최근접 {wc.nearest.km.toFixed(1)}km)
                    </span>
                  )}
                </div>
              </div>
            ) : null
          })()}
          {(() => {
            const re = reNear
            if (!re) return null
            const label = re.km <= 10 ? '조달 유리' : re.km <= 30 ? '조달 가능' : '원거리'
            return (
              <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="k">RE100 조달 여건 (최근접 재생발전단지 · 참고)</div>
                <div className="v">
                  최근접 <strong>{re.name || (re.type === 'W' ? '풍력단지' : '태양광단지')}</strong> ({re.type === 'W' ? '풍력' : '태양광'}) {re.km.toFixed(1)}km
                  <span className={`badge ${re.km <= 10 ? 'status-operating' : re.km <= 30 ? 'verify' : 'pending'}`} style={{ marginLeft: 6 }}>{label}</span>
                  <div className="cell-basis">하이퍼스케일러 RE100/CFE 요건 — 대형 재생단지 근접 = 직접 PPA 잠재. OSM 대형 발전단지(소형 태양광 제외) 기준</div>
                </div>
              </div>
            )
          })()}
          {(() => {
            // 냉각수(용수) 확보 여건 — 최근접 주요 수원(댐) + WAMIS 공업용수 취수 시설용량 + K-water 실시간 수도시설. 100점 외 참고.
            const w = sido && water?.available ? water.bySido?.[sido] : null
            const hasWamis = w && w.m3day
            const kw = sido && kwater?.available ? kwater.bySido?.[sido] : null
            const hasKwater = kw && (kw.취수용량 > 0 || kw.정수용량 > 0)
            const ws = waterNear // 최근접 댐(상시)
            const wsBadge = ws ? (ws.km <= 20 ? '수원 인접' : ws.km <= 50 ? '수원 근접' : '원거리') : null
            const wsTone = ws ? (ws.km <= 20 ? 'status-operating' : ws.km <= 50 ? 'verify' : 'pending') : null
            if (!hasWamis && !hasKwater && !ws) return null
            const label = hasWamis ? (w.m3day >= 200000 ? '용수 여유' : w.m3day >= 50000 ? '용수 보통' : '용수 확인要') : null
            const badge = hasWamis ? (w.m3day >= 200000 ? 'status-operating' : w.m3day >= 50000 ? 'verify' : 'pending') : null
            return (
              <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="k">냉각수(용수) 확보 여건 ({sido ? `${sido} 시도 · ` : ''}참고)</div>
                <div className="v">
                  {ws && (
                    <div>
                      최근접 주요 수원 <strong>{ws.name}댐</strong>
                      <span className="muted" style={{ marginLeft: 6, fontSize: '0.85em' }}>{ws.type}댐 · 저수 {ws.capMcm.toLocaleString()}백만㎥</span>
                      <span style={{ marginLeft: 6 }}>{ws.km.toFixed(0)}km</span>
                      <span className={`badge ${wsTone}`} style={{ marginLeft: 6 }}>{wsBadge}</span>
                    </div>
                  )}
                  {hasWamis && (
                    <div style={{ marginTop: ws ? 4 : 0 }}>
                      공업용수 취수 시설용량 <strong>{Math.round(w.m3day).toLocaleString()}㎥/일</strong>
                      <span className="muted" style={{ marginLeft: 6, fontSize: '0.85em' }}>취수장 {w.count}곳</span>
                      <span className={`badge ${badge}`} style={{ marginLeft: 6 }}>{label}</span>
                    </div>
                  )}
                  {hasKwater && (
                    <div style={{ marginTop: hasWamis || ws ? 4 : 0 }}>
                      상수도 시설용량{' '}
                      {kw.정수용량 > 0 && <>정수 <strong>{Math.round(kw.정수용량).toLocaleString()}㎥/일</strong></>}
                      {kw.취수용량 > 0 && <>{kw.정수용량 > 0 ? ' · ' : ''}취수 <strong>{Math.round(kw.취수용량).toLocaleString()}㎥/일</strong></>}
                      <span className="muted" style={{ marginLeft: 6, fontSize: '0.85em' }}>
                        {[kw.정수N ? `정수장 ${kw.정수N}` : null, kw.취수N ? `취수장 ${kw.취수N}` : null].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  )}
                  <div className="cell-basis">
                    {ws ? '한국수자원공사 다목적·용수댐(좌표 근사) · ' : ''}{hasWamis ? `${water.source} · ` : ''}{hasKwater ? `${kwater.source} · ` : ''}지역/근접 신호(부지 인입은 지방·산단 상수도사업소 별도 확인). 100점 외 참고
                  </div>
                </div>
              </div>
            )
          })()}
          {regionPower && (regionPower.sub || regionPower.bal || regionPower.grid || regionPower.approval) && (
            <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
              <div className="k">지역 계통 수용력 (시도 기준 · 부지별은 한전 주소검색)</div>
              <div className="v">
                {/* 1순위: 공급여유(하드 게이트) */}
                {regionPower.grid && (
                  <div>
                    <strong>계통 공급여유 {regionPower.grid.mw.toLocaleString()}MW</strong>
                    <span className={`badge ${regionPower.grid.mw <= 10 ? 'critical' : regionPower.grid.mw <= 500 ? 'verify' : 'status-operating'}`} style={{ marginLeft: 6 }}>
                      {headroomLabel(regionPower.grid.mw)}
                    </span>
                    <span className="muted" style={{ marginLeft: 6, fontSize: '0.85em' }}>
                      한전 연계가능용량 2027{regionPower.grid.note ? ` · ${regionPower.grid.note}` : ''}
                    </span>
                  </div>
                )}
                {/* 2순위: 전력공급 가능판정율(전력계통영향평가) */}
                {regionPower.approval && regionPower.approval.ratePct != null && (
                  <div style={{ marginTop: regionPower.grid ? 4 : 0 }}>
                    <strong>전력공급 가능판정율 {regionPower.approval.ratePct}%</strong>
                    <span className={`badge ${regionPower.approval.ratePct >= 70 ? 'status-operating' : regionPower.approval.ratePct >= 45 ? 'verify' : 'critical'}`} style={{ marginLeft: 6 }}>
                      {approvalLabel(regionPower.approval.ratePct)}
                    </span>
                    <span className="muted" style={{ marginLeft: 6, fontSize: '0.85em' }}>전력계통영향평가 &apos;26.3</span>
                  </div>
                )}
                {/* 참고: 자급률·최근접 변전소·변전소 밀도를 한 줄로 압축 */}
                <div className="cell-basis" style={{ marginTop: 5 }}>
                  참고
                  {regionPower.bal ? ` · 자급률 ${regionPower.bal.ratio}%` : ''}
                  {r.nearestSub ? ` · 최근접 변전소 ${r.nearestSub.name || `${r.nearestSub.kv}kV`} ${r.nearestSub.km.toFixed(1)}km` : ''}
                  {regionPower.sub ? ` · 시도 154kV+ ${regionPower.sub.hv.toLocaleString()}개` : ''}
                </div>
                <div className="cell-basis">
                  시도 총량 신호(시군구 편차 큼) — 부지별 접속 여유는{' '}
                  <a className="mini-link" href="https://recloud.energy.or.kr/" target="_blank" rel="noreferrer">RE클라우드/한전 접속가능용량 →</a>
                </div>
              </div>
            </div>
          )}

          <div className="spec-group-label" style={{ gridColumn: '1 / -1' }}><LineIcon name="cooling" /> 냉각 <em>— 연평균기온·프리쿨링·PUE</em></div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">
              <Term k="프리쿨링">데이터센터 기후지수</Term> (냉각 적합도 · 아주나쁨~아주좋음)
            </div>
            <div className="v">
              {climateIdx ? (
                <div className="ci-block">
                  <span className={`ci-inline tone-${climateIdx.tone}`}>
                    <span className="ci-scale" aria-label={`5단계 중 ${climateIdx.level}단계`}>
                      {CLIMATE_LEVELS.map((l) => (
                        <i key={l.level} className={l.level === climateIdx.level ? `on tone-${climateIdx.tone}` : ''} />
                      ))}
                    </span>
                    <b className="ci-inline-label">{climateIdx.label}</b>
                    <span className="ci-temp">연평균 {climateIdx.temp}°C</span>
                  </span>
                  <div className="ci-why">{climateIdx.why}</div>
                  <div className="ci-basis">근거: {climateIdx.basis}</div>
                </div>
              ) : (
                <span className="badge pending">연동 대기 — 기온 확보 후 산출</span>
              )}
            </div>
          </div>

          <div className="spec-group-label" style={{ gridColumn: '1 / -1' }}><LineIcon name="site" /> 부지 <em>— 용도지역·주소</em></div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k"><Term k="용도지역">용도지역</Term> (vworld 도시계획 — 부지 개발 가능성)</div>
            <div className="v">
              {landUse?.uses?.length ? (
                landUse.uses.join(' · ')
              ) : (
                <span className="badge pending">조회 대기 — 점수화는 캘리브레이션 후</span>
              )}
              {landArea?.areaM2 != null && (
                <div className="cell-basis">
                  필지 면적 <strong>{landArea.areaM2.toLocaleString()}㎡</strong> ({Math.round(landArea.areaM2 / 3.3058).toLocaleString()}평 · vworld 연속지적{landArea.source === 'server-parcel' ? ' · 도형 계산 근사' : ''})
                  {landArea.jimok && <> · 지목 <strong>{landArea.jimok}</strong></>}
                  {landArea.jibun && ` · ${landArea.jibun}`}
                  {officialPrice?.available && officialPrice.pricePerM2 != null && (
                    <> · 공시지가 <strong>{officialPrice.pricePerM2.toLocaleString()}원/㎡</strong>{officialPrice.year ? ` (${officialPrice.year})` : ''}</>
                  )}
                </div>
              )}
            </div>
          </div>
          {landReg?.regs?.length ? (
            <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
              <div className="k">규제·제약 지구 (vworld 용도지구·지구단위계획 · 참고)</div>
              <div className="v">
                {landReg.regs.map((rg) => (
                  <span key={rg} className="badge verify" style={{ marginRight: 6, marginBottom: 4 }}>{rg}</span>
                ))}
                <div className="cell-basis">토지거래허가·성장관리방안·지구단위계획 등 개발 제약/절차 신호(부지 매입·인허가 난이도). 100점 외 참고</div>
              </div>
            </div>
          ) : null}
          {(() => {
            const ic = icNear
            return ic ? (
              <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="k">산업단지 입지 (인센티브·전력/용수 기반시설)</div>
                <div className="v">
                  최근접 <strong>{ic.name}</strong>
                  <span className="badge" style={{ marginLeft: 6 }}>{ic.type}산단</span>
                  <span style={{ marginLeft: 6 }}>{ic.km.toFixed(1)}km</span>
                  <div className="cell-basis">
                    산단 내/근접은 세제·인센티브 + 전력·용수 사전확보 + 공업지역 인허가 수월. 전국 지정단지 511개(OSM landuse=industrial · 대표점 근사)
                  </div>
                </div>
              </div>
            ) : null
          })()}
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">지번주소 (vworld 리버스 지오코딩)</div>
            <div className="v">
              {addr?.parcel ?? addr?.road ?? <span className="badge pending">조회 대기 — 연동 후 자동 표시</span>}
            </div>
          </div>

          <div className="spec-group-label" style={{ gridColumn: '1 / -1' }}><LineIcon name="risk" /> 리스크 <em>— 침수·산사태·네트워크·민원</em></div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k"><Term k="침수심">침수 위험</Term> (홍수위험지도 — DC에 치명적)</div>
            <div className="v">
              {flood?.available ? (
                flood.source === 'sgis' ? (
                  flood.exposurePct <= 0 ? (
                    <>
                      <span className="badge status-operating">홍수영향구역 밖 · 위험 낮음</span>
                      {flood.admNm && <span className="meta"> · {flood.admNm}</span>}
                    </>
                  ) : (
                    <>
                      <span className={`badge ${flood.exposurePct >= 30 ? 'verify' : 'status-operating'}`}>침수 노출 {flood.grade}</span>
                      {` · 영향구역 인구 ${flood.exposurePct}%`}
                      {flood.affectedPop != null && flood.totalPop != null && (
                        <span className="meta"> ({flood.affectedPop.toLocaleString()}/{flood.totalPop.toLocaleString()}명{flood.admNm ? ` · ${flood.admNm}` : ''}{flood.baseYear ? ` · ${flood.baseYear}` : ''})</span>
                      )}
                    </>
                  )
                ) : flood.grade === '해당없음' || flood.depthM === 0 ? (
                  <span className="badge status-operating">침수구역 외 · 위험 낮음</span>
                ) : (
                  <>
                    <span className="badge verify">침수 위험 {flood.grade}</span>
                    {flood.depthM != null && ` · 침수심 ${flood.depthM}m`}
                    {flood.floodType && ` · ${flood.floodType}`}
                    {flood.scenario && ` · ${flood.scenario}`}
                  </>
                )
              ) : (
                <span className="badge pending">연동 대기 — 리스크축 침수(홍수위험지도)</span>
              )}
            </div>
          </div>
          {(() => {
            const net = networkContext(point)
            return (
              <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="k">네트워크 근접성 (<Term k="백본">백본</Term>·<Term k="육양국">해저케이블</Term> — 지연·회선)</div>
                <div className="v">
                  {net.backbone && `백본/국사 ${net.backbone.node.name} ${net.backbone.km.toFixed(0)}km`}
                  {net.cls && ` · 해저케이블 육양 시설 ${net.cls.node.name} ${net.cls.km.toFixed(0)}km`}
                  <span className="muted" style={{ marginLeft: 6, fontSize: '0.85em' }}>OSM telecom·근사</span>
                </div>
              </div>
            )
          })()}
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">경쟁·집적 밀도 (반경 내 데이터센터)</div>
            <div className="v">
              반경 10km <strong>{competition.n10}곳</strong>
              {competition.op10 > 0 && ` (운영 ${competition.op10})`} · 반경 30km {competition.n30}곳
              <span className={`badge ${competition.n10 >= 5 ? 'verify' : 'status-operating'}`} style={{ marginLeft: 6 }}>
                {competition.n10 >= 5 ? '과밀 — 전력·부지 경쟁 유의' : competition.n10 >= 1 ? '집적 — 인프라 성숙' : '한산'}
              </span>
              <div className="cell-basis">기존/계획 DC 집적. 집적=광케이블·전력·인력 성숙(+), 과밀=전력·부지 경쟁(−). AI InfraMap 시설 시드 기준</div>
              {(() => {
                const c = clusterNear
                if (!c || c.km > 40) return null // 40km 이내만 경쟁 신호
                const heavy = (c.powerGw || 0) >= 5
                return (
                  <div className="cell-basis" style={{ marginTop: 5 }}>
                    최근접 반도체 클러스터 <strong>{c.name}</strong>({c.operator}·{c.status}) {c.km.toFixed(0)}km
                    {c.powerGw ? ` · 전력 ${c.powerGw}GW` : ''}{c.waterKtd ? ` · 용수 ${c.waterKtd.toLocaleString()}천t/일` : ''}
                    <span className={`badge ${heavy && c.km <= 25 ? 'critical' : 'verify'}`} style={{ marginLeft: 6 }}>
                      {heavy && c.km <= 25 ? '전력·용수 경쟁 유의' : '대수요처 인접'}
                    </span>
                  </div>
                )
              })()}
            </div>
          </div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k"><Term k="인구격자">인구·밀도</Term> (SGIS 시군구 — 주민 수용성·민원)</div>
            <div className="v pop-v">
              {pop?.available ? (
                <>
                  {/* 1줄: 행정구역(레벨 경계 띄어쓰기) + 판정 배지 / 2줄: 수치 / 3줄: 메타 — 가독 위계 */}
                  <span className="pop-line1">
                    {pop.admNm && <b>{fmtAdmNm(pop.admNm)}</b>}
                    {pop.density != null && (
                      <span className={`badge ${pop.density < 3000 ? 'status-operating' : 'verify'}`}>
                        {pop.density < 3000 ? '저밀도 · 민원 리스크 낮음' : '고밀도 · 민원 유의'}
                      </span>
                    )}
                  </span>
                  <span className="pop-line2">
                    인구 <strong>{pop.population != null ? pop.population.toLocaleString() : '—'}명</strong>
                    {pop.density != null && ` · 밀도 ${pop.density.toLocaleString()}명/km²`}
                    {pop.households != null && ` · ${pop.households.toLocaleString()}세대`}
                  </span>
                  <span className="meta">{pop.level || '시군구'} 단위{pop.year ? ` · ${pop.year}년` : ''} · 정밀 반경은 격자 API 연동 시</span>
                </>
              ) : (
                <span className="badge pending">연동 대기 — 리스크축 인구(SGIS 시군구)</span>
              )}
            </div>
          </div>
        </div>

        {/* 운영·부가 참고 — 접이식(기본 닫힘). 부지선정 핵심은 위, 운영/보조 지표는 여기로 정돈. */}
        <details className="spec-more">
          <summary>운영·부가 참고 — 현재기상 · 3일예보 · 기상특보 · 과거기후 · 지번전기 · 재해 · 인근 지가</summary>
          <div className="spec-grid">
            <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
              <div className="k">현재 기상 · 3일예보 (케이웨더 실황 — 운영 참고)</div>
              <div className="v">
                {wx ? (
                  <>
                    {wx.temp != null && `${wx.temp}°C`}
                    {wx.sky && ` · ${wx.sky}`}
                    {wx.senseTemp != null && ` · 체감 ${wx.senseTemp}°C`}
                    {wx.humidity != null && ` · 습도 ${wx.humidity}%`}
                    {wx.rain1h != null && wx.rain1h > 0 && ` · 강수 ${wx.rain1h}mm/h`}
                    {wx.windSpeed != null && ` · 풍속 ${wx.windSpeed}m/s`}
                    {wx.pm10 != null && ` · PM10 ${wx.pm10}`}
                  </>
                ) : (
                  <span className="badge pending">연동 대기 — 케이웨더 실황(기상축)</span>
                )}
              </div>
              {(dong || normal) && (
                <div className="cell-basis">근거지 {dong || (normal ? `${normal.name} 인근` : '좌표 기준')}</div>
              )}
              {fc?.days?.length > 0 && (
                <div className="wx-strip" aria-label="3일 일별예보">
                  {fc.days.map((h, i) => (
                    <span key={i} className="wx-hour">
                      <em>{h.label}</em>
                      <strong>{h.tmax != null ? `${h.tmax}°` : '–'}</strong>
                      <span>{h.sky ?? ''}{h.rainProb != null ? ` ${h.rainProb}%` : ''}</span>
                    </span>
                  ))}
                  {fc.rain && <span className="badge verify">강수 유의</span>}
                </div>
              )}
            </div>
            <div className="spec-cell">
              <div className="k">기상특보 (운영 — 태풍·강풍·호우)</div>
              <div className="v">
                {warning?.available ? (
                  warning.count > 0 ? (
                    warning.warnings.map((w) => (
                      <span key={w} className="badge verify" style={{ marginRight: 6 }}>
                        {w}
                      </span>
                    ))
                  ) : (
                    <span className="badge status-operating">발효 중인 특보 없음</span>
                  )
                ) : (
                  <span className="badge pending">연동 대기 — 케이웨더 특보</span>
                )}
              </div>
            </div>
            <div className="spec-cell">
              <div className="k"><Term k="프리쿨링">기후</Term> (과거 연별 — 기후지수 근거)</div>
              <div className="v">
                {climate?.available ? (
                  <>
                    {climate.avgTemp != null && `연평균 ${climate.avgTemp}°C`}
                    {climate.maxTemp != null && ` · 최고 ${climate.maxTemp}°C`}
                    {climate.minTemp != null && ` · 최저 ${climate.minTemp}°C`}
                    {climate.rainSum != null && ` · 강수 ${climate.rainSum}mm`}
                  </>
                ) : (
                  <span className="badge pending">연동 대기 — 케이웨더 과거 기후</span>
                )}
              </div>
            </div>
            <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
              <div className="k">지번 실측 전기사용량 (국토부 건축HUB — 수요 맥락)</div>
              <div className="v">
                {energy?.available && energy.usage != null ? (
                  <>
                    {energy.useYm} <strong>{energy.usage.toLocaleString()} {energy.unit}</strong>
                    <span className="meta"> · 해당 지번 건물에너지 실측(단독·소규모·산업 용도 제외)</span>
                    {/* 6개월 추이 — 온디맨드(호출 6회라 버튼 클릭 시에만) */}
                    {energySeries == null && (
                      <button type="button" className="btn" style={{ marginLeft: 8, padding: '2px 9px', fontSize: 'var(--text-xs)' }} onClick={loadEnergySeries}>
                        6개월 추이
                      </button>
                    )}
                    {energySeries === 'loading' && <span className="meta"> · 추이 조회 중…</span>}
                    {Array.isArray(energySeries) && (
                      <div className="hbar-mini-wrap">
                        <div className="hbar-mini" role="img" aria-label="최근 6개월 전기사용량">
                          {(() => {
                            const max = Math.max(...energySeries.map((m) => m.usage ?? 0), 1)
                            return energySeries.map((m) => (
                              <span
                                key={m.ym}
                                className="hbar-mini-bar"
                                title={`${m.ym}: ${m.usage != null ? `${m.usage.toLocaleString()} ${energy.unit}` : '데이터 없음'}`}
                                style={{ height: `${m.usage != null ? Math.max(6, Math.round((m.usage / max) * 100)) : 3}%` }}
                              />
                            ))
                          })()}
                        </div>
                        <div className="hbar-mini-x" aria-hidden>
                          {energySeries.map((m) => (
                            <span key={m.ym}>{m.ym.slice(4)}월</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : addr?.sigunguCd ? (
                  <span className="badge pending">해당 지번 데이터 없음 — 대상 외(단독·200세대 미만·산업)일 수 있음</span>
                ) : (
                  <span className="badge pending">연동 대기 — 법정동코드 확보(vworld) 후 자동 조회</span>
                )}
              </div>
            </div>
            <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
              <div className="k">산사태·재해 위험 (SGIS 산사태위험지도)</div>
              <div className="v">
                {disaster?.available ? (
                  disaster.source === 'sgis' ? (
                    disaster.exposurePct <= 0 ? (
                      <>
                        <span className="badge status-operating">산사태 영향구역 밖 · 위험 낮음</span>
                        {disaster.admNm && <span className="meta"> · {disaster.admNm}</span>}
                      </>
                    ) : (
                      <>
                        <span className={`badge ${disaster.exposurePct >= 30 ? 'verify' : 'status-operating'}`}>산사태 노출 {disaster.grade}</span>
                        {` · 영향구역 인구 ${disaster.exposurePct}%`}
                        {disaster.affectedPop != null && disaster.totalPop != null && (
                          <span className="meta"> ({disaster.affectedPop.toLocaleString()}/{disaster.totalPop.toLocaleString()}명{disaster.admNm ? ` · ${disaster.admNm}` : ''}{disaster.baseYear ? ` · ${disaster.baseYear}` : ''})</span>
                        )}
                      </>
                    )
                  ) : (
                    <>
                      {disaster.events != null && <strong>재해 {disaster.events.toLocaleString()}건</strong>}
                      {disaster.topType && ` · 주 유형 ${disaster.topType}`}
                      {disaster.recentYear && ` · 최근 ${disaster.recentYear}`}
                    </>
                  )
                ) : (
                  <span className="badge pending">연동 대기 — 리스크축 재해</span>
                )}
              </div>
            </div>
            {(() => {
              const lp = landPriceFor(r.nearest[0]?.facility)
              const dp = dongPulseFor(r.nearest[0]?.facility)
              return lp ? (
                <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                  <div className="k">
                    인근 <Term k="지가변동률">지가변동률</Term> · {lp.scope} ({lp.period} 월간, KOSIS — 최근접 시설 시군구 기준)
                  </div>
                  <div className="v">
                    {fmtRate(lp.value)}
                    {dp && (
                      <span className="meta">
                        {' '}
                        · 동 단위 {fmtRate(dp.bottom.rate)} ~ {fmtRate(dp.top.rate)} ({dp.count}개 구역)
                      </span>
                    )}
                  </div>
                </div>
              ) : null
            })()}
          </div>
        </details>

        {/* 실무 조회 — 공식 시스템 직접 확인(보조 액션이라 접이식) */}
        <details className="mini-details">
          <summary>실무 조회 — 공식 시스템 바로가기(한전·RE클라우드·토지이음)</summary>
          <div className="quick-links">
            <a className="btn" href="https://online.kepco.co.kr/EWM090D00" target="_blank" rel="noreferrer">
              한전 배전용변압기 여유
            </a>
            <a className="btn" href="https://online.kepco.co.kr/EWM092D00" target="_blank" rel="noreferrer">
              한전 배전망 여유 (22.9kV)
            </a>
            <a className="btn" href="https://recloud.energy.or.kr/" target="_blank" rel="noreferrer">
              RE클라우드 계통·입지
            </a>
            <a className="btn" href="https://www.eum.go.kr/" target="_blank" rel="noreferrer">
              토지이음 (토지이용계획)
            </a>
          </div>
        </details>

        <div className="chart-title" style={{ marginTop: 14 }}>
          최근접 시설
        </div>
        <div className="facility-list stagger-in">
          {r.nearest.map(({ facility: f, km }) => (
            <button key={f.id} type="button" className="facility-row" onClick={() => onSelectFacility(f)}>
              <span className={`dot ${f.status === 'delayed' ? 'planned' : f.status}`} />
              <span>
                <span className="name">{f.name}</span>
                <span className="meta">
                  {km.toFixed(1)} km · {STATUS_LABEL[f.status] ?? f.status}
                  {f.power_mw_public != null && ` · ${f.power_mw_public}MW`}
                </span>
              </span>
            </button>
          ))}
        </div>

        {(() => {
          const makeReport = () =>
            buildSiteReport({
              point,
              r,
              nonCapital,
              mw,
              addr,
              landUse,
              wx,
              fc,
              landPrice: landPriceFor(r.nearest[0]?.facility),
              dongPulse: dongPulseFor(r.nearest[0]?.facility),
              plantCtx: np,
              windCtx: wc,
              headroom,
              flood,
              pop,
              disaster,
              energy,
              warning,
              climate,
              officialPrice,
              landReg,
              sido,
              water,
              kwater,
              re: reNear,
              waterSource: waterNear,
              cluster: clusterNear,
            })
          const onDownload = () => {
            const blob = new Blob([makeReport()], { type: 'text/markdown;charset=utf-8' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `aiinframap-site-${point.lat.toFixed(4)}_${point.lng.toFixed(4)}.md`
            a.click()
            URL.revokeObjectURL(a.href)
          }
          const onPdf = () => {
            const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            // 간이 마크다운 → HTML (제목·리스트·굵게·구분선)
            const html = makeReport()
              .split('\n')
              .map((ln) => {
                if (/^# /.test(ln)) return `<h1>${esc(ln.slice(2))}</h1>`
                if (/^## /.test(ln)) return `<h2>${esc(ln.slice(3))}</h2>`
                if (/^---/.test(ln)) return '<hr/>'
                if (/^\s*- /.test(ln)) {
                  const indent = /^\s{2,}- /.test(ln)
                  return `<div class="li${indent ? ' sub' : ''}">${esc(ln.replace(/^\s*- /, '')).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</div>`
                }
                if (!ln.trim()) return ''
                return `<p>${esc(ln).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>`
              })
              .join('\n')
            const w = window.open('', '_blank')
            if (!w) return
            w.document.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>AI InfraMap 부지 리포트</title><style>
              /* A4 규격 고정 — 프린터 기본값(Letter 등) 의존 제거 */
              @page{size:A4;margin:16mm}
              body{font-family:'Pretendard Variable',-apple-system,'Malgun Gothic',sans-serif;color:#111;line-height:1.55;max-width:760px;margin:0 auto;padding:20px;font-size:12.5px;word-break:keep-all;overflow-wrap:anywhere}
              h1{font-size:20px;border-bottom:2px solid #111;padding-bottom:8px;margin:0 0 12px;break-after:avoid}
              h2{font-size:14px;color:#0a4;margin:18px 0 6px;border-left:3px solid #0a4;padding-left:8px;break-after:avoid;break-inside:avoid;-webkit-print-color-adjust:exact;print-color-adjust:exact}
              .li{margin:2px 0 2px 12px;break-inside:avoid}.li.sub{margin-left:28px;color:#444;font-size:11.5px}
              hr{border:0;border-top:1px solid #ccc;margin:16px 0}
              b{color:#000}p{margin:4px 0;color:#333}
              @media print{body{padding:0;max-width:100%}}
            </style></head><body>${html}
            <p style="margin-top:24px;color:#888;font-size:10.5px">AI InfraMap · ${new Date().toLocaleString('ko-KR')} · 공개 데이터 기반 간이 판정(미산출 축은 '대기' 명시)</p>
            <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
            </body></html>`)
            w.document.close()
          }
          return (
            <div className="card-actions">
              <button type="button" className="btn ai" onClick={genAiReport} disabled={busy}>
                {busy ? t('AI 분석 중…') : t('✨ AI 부지 브리프')}
              </button>
              <CopyButton getText={makeReport} label={t('간이 리포트 복사')} copiedLabel={t('복사됨')} />
              <button type="button" className="btn" onClick={onPdf}>
                {t('PDF 저장')}
              </button>
              <button type="button" className="btn" onClick={onDownload}>
                {t('.md 다운로드')}
              </button>
              {onAddCompare && (
                <button
                  type="button"
                  className="btn"
                  disabled={inCompare}
                  onClick={() =>
                    onAddCompare({
                      id: `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`,
                      lat: point.lat,
                      lng: point.lng,
                      label: dong || (addr?.parcel ? addr.parcel.split(' ').slice(-2).join(' ') : `${point.lat.toFixed(3)}, ${point.lng.toFixed(3)}`),
                      nonCapital,
                      mw, // 계통영향평가 전망 비교용(추가 시점의 필요 용량)
                      score: r.knownScore,
                      coverage: r.knownMax,
                      pct: r.knownMax ? Math.round((r.knownScore / r.knownMax) * 100) : null,
                      headroomMw: headroom?.available ? headroom.availableMw ?? null : null,
                      gridMw: grid?.mw ?? null,
                      approvalPct: approval?.ratePct ?? null,
                      subKm: r.nearestSub?.km ?? null,
                      icKm: icNear?.km ?? null,
                      areaM2: landArea?.areaM2 ?? null,
                      netScore: r.axes.find((a) => a.key === 'network')?.known ?? null,
                      climate: climateIdx?.label ?? null,
                      climateLevel: climateIdx?.level ?? null,
                      floodPct: flood?.available && flood.source === 'sgis' ? flood.exposurePct : null,
                      landslidePct: disaster?.available && disaster.source === 'sgis' ? disaster.exposurePct : null,
                      density: pop?.available ? pop.density ?? null : null,
                      zoneUse: landUse?.uses?.length ? landUse.uses[0] : null,
                      plantKm,
                    })
                  }
                >
                  {inCompare ? t('비교에 추가됨 ✓') : t('⚖ 비교에 추가')}
                </button>
              )}
            </div>
          )
        })()}

        {/* 정밀 리포트·컨설팅 문의 CTA — 이 부지 맥락을 문의 폼에 전달(수익화 훅) */}
        <Link
          className="sp-report-cta"
          to={`/pricing?type=${encodeURIComponent('정밀 리포트 요청')}&ctx=${encodeURIComponent(
            `${point.lat.toFixed(4)},${point.lng.toFixed(4)}${sido ? ` · ${sido}` : ''} · ${mw}MW · 근거 ${r.knownScore}/${r.knownMax}`,
          )}`}
        >
          {t('✦ 이 부지 정밀 리포트·컨설팅 문의 →')}
        </Link>

        {/* AI 부지 브리프 결과 — 실데이터 스냅샷 기반, 없는 값은 '미확보'로 명시(정직) */}
        <AiResultCard
          ai={ai}
          badge="✨ AI 브리프"
          src="공개 데이터 스냅샷 기반 · 없는 값은 미확보 표기"
          onRegen={genAiReport}
          loadingText="AI가 확보된 근거만으로 브리프를 작성 중…"
        />

        <p className="geo-note">
          간이 리포트 — 산출된 근거만 수치로, 대기 축은 명시. AI 브리프는 확보된 스냅샷만 사용(없는 값 생성 안 함).
        </p>
      </article>
    </>
  )
}
