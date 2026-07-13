// 지점 간이 리포트 v0 — 지점 분석 패널의 근거를 마크다운으로 (L2 정밀 리포트의 무료 티저)
// 정직성: 산출된 항목만 수치로, 대기 항목은 '데이터 대기'로 명시. 가짜 총점 없음.
import { STATUS_LABEL } from '../data/facilities.js'
import { fmtRate } from '../data/landPrice.js'
import { dcClimateIndex, nearestNormal } from './climateIndex.js'
import { dongLabel } from '../data/liveApi.js'

export function buildSiteReport({ point, r, nonCapital, mw, addr, landUse, wx, fc, landPrice, dongPulse, plantCtx, windCtx, headroom, flood, pop, disaster, energy, warning, climate, officialPrice, landReg, sido, water, kwater, re, waterSource, cluster }) {
  const L = []
  const now = new Date()
  L.push(`# AI InfraMap — 부지 적합도 간이 리포트 (v0)`)
  L.push(``)
  L.push(`- 지점: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`)
  if (addr?.parcel) L.push(`- 지번주소: ${addr.parcel}${addr.road ? ` (도로명: ${addr.road})` : ''}`)
  L.push(`- 입지 구분: ${nonCapital ? '비수도권' : '수도권'} (주소 기준 자동판정) · 필요 용량 ${mw}MW`)
  L.push(`- 생성: ${now.toLocaleString('ko-KR')} · AI InfraMap`)
  if (typeof window !== 'undefined')
    L.push(`- 공유 링크: ${window.location.origin}/?site=${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
  L.push(``)
  L.push(`## 전력 인허가 트랙 판정 (규칙 기반)`)
  L.push(`- 수전전압: ${r.track.track.voltage} (${r.track.track.circuits})`)
  L.push(`- 전기사용예정통지: ${r.track.preNoticeRequired ? '대상 (5,000kW 이상)' : '비대상'}`)
  L.push(
    `- 전력계통영향평가: ${r.track.psiaRequired ? '대상 (10MW 이상)' : '비대상'}${r.track.exemption ? ` — 비수도권 특례로 ${r.track.exemption.effective}부터 면제 가능성 (규모 기준 대통령령 미제정)` : ''}`,
  )
  L.push(`- 확정 수수료(심의회 상정까지): ${r.track.fees.total} · 리드타임 골자: ${r.track.leadTime.review}${r.track.leadTime.assessment ? ` + ${r.track.leadTime.assessment}` : ''}`)
  L.push(``)
  L.push(`## 프로세스 관문 전망 (용량·입지 기준 · 실제 판정은 한전·기후에너지환경부 심의)`)
  {
    const t = r.track
    const p07 =
      mw <= 20
        ? '22.9kV 배전 수전 (수월) — 계통 여유가 지배 변수'
        : mw <= 40
          ? '22.9kV/154kV 협의 경계 — 증설 계획 시 154kV 전제가 안전'
          : '154kV 의무 (핵심 관문) — 자체 수전설비 투자 + 변전소 거리'
    const p08 = !t.psiaRequired
      ? '10MW 미만 · 비대상'
      : nonCapital
        ? `대상 · 비수도권 유인 — 지역 배점 가점 여지${t.exemption ? ` + ${t.exemption.effective}~ AIDC 특별법 면제 가능성` : ''}`
        : '대상 · 수도권 감점 (핵심 관문) — ±15점 억제 배점'
    L.push(`- P07 한전 접속·수전전압: ${p07}`)
    L.push(`- P08 전력계통영향평가(±15점): ${p08}`)
  }
  L.push(``)
  L.push(`## 스코어 커버리지 — 근거 확보 ${r.knownScore}/${r.knownMax}점 · 커버리지 ${r.coverage}/100`)
  L.push(`(공개 데이터로 산출된 항목만 점수화 · 미확보 항목은 '대기'로 명시 — 가짜 점수 없음)`)
  for (const axis of r.axes) {
    L.push(`- **${axis.label}** ${axis.knownMax > 0 ? `${axis.known}/${axis.max}점` : '데이터 대기'}`)
    for (const it of axis.items) {
      if (it.points != null) L.push(`  - ${it.label}: ${it.points}/${it.max}점${it.basis ? ` — ${it.basis}` : ''}`)
      else L.push(`  - ${it.label}: 대기${it.pending ? ` (${it.pending})` : ''}`)
    }
  }
  L.push(``)
  L.push(`## 토지·지가`)
  L.push(`- 용도지역: ${landUse?.uses?.length ? landUse.uses.join(' · ') : '조회 대기 (vworld)'}`)
  if (officialPrice?.available && officialPrice.pricePerM2 != null)
    L.push(`- 개별공시지가: ${officialPrice.pricePerM2.toLocaleString()}원/㎡${officialPrice.year ? ` (${officialPrice.year})` : ''} (국토부 data.go.kr)`)
  if (landReg?.regs?.length)
    L.push(`- 규제·제약 지구: ${landReg.regs.join(' · ')} (vworld 용도지구·지구단위계획 — 개발 제약/절차 신호)`)
  if (landPrice) {
    L.push(`- 지가변동률: ${fmtRate(landPrice.value)} (${landPrice.scope}, ${landPrice.period} 월간, KOSIS)`)
    if (dongPulse) L.push(`- 동 단위 범위: ${fmtRate(dongPulse.bottom.rate)} ~ ${fmtRate(dongPulse.top.rate)} (${dongPulse.count}개 조사구역)`)
  }
  L.push(``)
  L.push(`## 냉각수·용수 (참고 — 100점 외 신호)`)
  if (waterSource)
    L.push(`- 최근접 주요 수원: ${waterSource.name}댐 (${waterSource.type}댐 · 총저수 ${waterSource.capMcm.toLocaleString()}백만㎥) · ${waterSource.km.toFixed(0)}km (K-water)`)
  {
    const kw = kwater?.available && sido ? kwater.bySido?.[sido] : null
    if (kw && (kw.취수용량 > 0 || kw.정수용량 > 0))
      L.push(`- ${sido} 상수도 시설용량: ${kw.정수용량 > 0 ? `정수 ${Math.round(kw.정수용량).toLocaleString()}㎥/일` : ''}${kw.취수용량 > 0 ? `${kw.정수용량 > 0 ? ' · ' : ''}취수 ${Math.round(kw.취수용량).toLocaleString()}㎥/일` : ''} (K-water 국가상수도정보)`)
    const w = water?.available && sido ? water.bySido?.[sido] : null
    if (w?.m3day) L.push(`- ${sido} 공업용수 취수 시설용량: ${Math.round(w.m3day).toLocaleString()}㎥/일 (취수장 ${w.count}곳 · WAMIS)`)
  }
  if (re) L.push(`- RE100 조달 여건: 최근접 재생발전단지 ${re.name || (re.type === 'W' ? '풍력' : '태양광')} (${re.type === 'W' ? '풍력' : '태양광'}) ${re.km.toFixed(1)}km${re.km <= 10 ? ' — 조달 유리' : re.km <= 30 ? ' — 조달 가능' : ' — 원거리'} (OSM)`)
  L.push(``)
  L.push(`## 기상 (케이웨더)`)
  if (wx) {
    L.push(`- 실황: ${wx.temp != null ? `${wx.temp}°C` : ''}${wx.sky ? ` · ${wx.sky}` : ''}${wx.humidity != null ? ` · 습도 ${wx.humidity}%` : ''}${wx.pm10 != null ? ` · PM10 ${wx.pm10}` : ''}${wx.scope ? ` (${wx.scope})` : ''}`)
    if (fc?.days?.length) L.push(`- 3일 예보: ${fc.days.map((h) => `${h.label} ${h.tmax ?? '–'}°/${h.tmin ?? '–'}° ${h.sky ?? ''}${h.rainProb != null ? ` ${h.rainProb}%` : ''}`).join(' · ')}`)
  } else {
    L.push(`- 연동 대기 — 케이웨더 실황(기상축)`)
  }
  if (warning?.available) L.push(`- 기상특보: ${warning.count > 0 ? warning.warnings.join(', ') : '발효 중인 특보 없음'}`)
  if (climate?.available)
    L.push(`- 과거 연별 기후: ${climate.avgTemp != null ? `연평균 ${climate.avgTemp}°C` : ''}${climate.maxTemp != null ? ` · 최고 ${climate.maxTemp}°C` : ''}${climate.minTemp != null ? ` · 최저 ${climate.minTemp}°C` : ''}${climate.rainSum != null ? ` · 강수 ${climate.rainSum}mm` : ''} — 프리쿨링 잠재력 맥락`)
  {
    const nrm = nearestNormal(point.lat, point.lng)
    const ci = dcClimateIndex({
      avgTemp: climate?.available ? climate.avgTemp : undefined,
      normalTemp: nrm?.t,
      normalStation: nrm?.name,
      humidity: wx?.humidity,
      currentTemp: wx?.temp,
    })
    if (ci) {
      L.push(`- 데이터센터 기후지수: **${ci.label}** (${ci.level}/5) — ${ci.why}`)
      L.push(`  - 근거: ${ci.basis}`)
    }
    const dong = dongLabel(addr)
    if (dong) L.push(`- 표출값 동단위 근거지: ${dong}${wx?.scope ? ` · 케이웨더 실황 ${wx.scope}` : ''}`)
  }
  L.push(``)
  L.push(`## 이 지점 배전 접속여유 (한전 분산전원 22.9kV · 참고)`)
  L.push(`(위 스코어의 '배전 여유'는 시도 계통 공급여유(한전 연계가능용량, 수천MW 단위)로 산출 — 아래 22.9kV 값은 이 지점 배전선 라이브 조회로 규모가 다름)`)
  if (headroom?.available) {
    L.push(
      `- ${headroom.availableMw != null ? `여유 ${headroom.availableMw}MW` : ''}${headroom.cumulativeMw != null ? ` · 누적연계 ${headroom.cumulativeMw}MW` : ''} (${headroom.scope})`,
    )
  } else {
    L.push(`- 연동 대기 — 한전 전력데이터 개방포털 분산전원연계 API`)
  }
  L.push(``)
  L.push(`## 리스크 (침수·산사태·인구)`)
  if (flood?.available && flood.source === 'sgis') {
    L.push(
      flood.exposurePct <= 0
        ? `- 침수: 홍수영향구역 밖 · 위험 낮음 (SGIS 홍수위험지도${flood.admNm ? ` · ${flood.admNm}` : ''})`
        : `- 침수: 노출 ${flood.grade} · 영향구역 인구 ${flood.exposurePct}%${flood.affectedPop != null && flood.totalPop != null ? ` (${flood.affectedPop.toLocaleString()}/${flood.totalPop.toLocaleString()}명)` : ''} (SGIS 홍수위험지도${flood.baseYear ? ` ${flood.baseYear}` : ''})`,
    )
  } else if (flood?.available) {
    L.push(
      flood.grade === '해당없음' || flood.depthM === 0
        ? `- 침수: 침수구역 외 · 위험 낮음 (홍수위험지도)`
        : `- 침수: 위험 ${flood.grade}${flood.depthM != null ? ` · 침수심 ${flood.depthM}m` : ''} (홍수위험지도)`,
    )
  } else {
    L.push(`- 침수: 연동 대기 — 홍수위험지도(리스크축)`)
  }
  if (pop?.available) {
    L.push(
      `- 인구·밀도(${pop.admNm || '시군구'}): ${pop.population != null ? `${pop.population.toLocaleString()}명` : '–'}${pop.density != null ? ` · ${pop.density.toLocaleString()}명/km²` : ''}${pop.households != null ? ` · ${pop.households.toLocaleString()}세대` : ''} — ${pop.density != null && pop.density < 3000 ? '저밀도(민원 리스크 낮음)' : '고밀도(민원 유의)'} (SGIS 시군구)`,
    )
  } else {
    L.push(`- 인구(민원 프록시): 연동 대기 — SGIS(시군구코드 확보 후)`)
  }
  if (disaster?.available && disaster.source === 'sgis') {
    L.push(
      disaster.exposurePct <= 0
        ? `- 산사태: 영향구역 밖 · 위험 낮음 (SGIS 산사태위험지도${disaster.admNm ? ` · ${disaster.admNm}` : ''})`
        : `- 산사태: 노출 ${disaster.grade} · 영향구역 인구 ${disaster.exposurePct}%${disaster.affectedPop != null && disaster.totalPop != null ? ` (${disaster.affectedPop.toLocaleString()}/${disaster.totalPop.toLocaleString()}명)` : ''} (SGIS 산사태위험지도${disaster.baseYear ? ` ${disaster.baseYear}` : ''})`,
    )
  } else if (disaster?.available) {
    L.push(`- 재해 이력: ${disaster.events != null ? `${disaster.events.toLocaleString()}건` : ''}${disaster.topType ? ` · ${disaster.topType}` : ''} (재난안전)`)
  } else {
    L.push(`- 산사태·재해: 연동 대기 — SGIS 산사태위험지도`)
  }
  if (energy?.available && energy.usage != null) {
    L.push(`- 지번 실측 전기사용량: ${energy.useYm} ${energy.usage.toLocaleString()} ${energy.unit} (국토부 건축HUB — 단독·소규모·산업 용도 제외)`)
  } else if (addr?.sigunguCd) {
    L.push(`- 지번 실측 전기사용량: 해당 지번 데이터 없음 (대상 외일 수 있음 — 건축HUB)`)
  }
  L.push(``)
  L.push(`## 인프라 근접성 (맥락 — 전원 매칭 아님)`)
  if (r.nearestSub)
    L.push(
      `- 최근접 154kV+ 변전소: ${r.nearestSub.name || `${r.nearestSub.kv}kV 변전소`} · ${r.nearestSub.km.toFixed(1)}km (${r.nearestSub.kv}kV · OSM)`,
    )
  if (plantCtx)
    L.push(
      `- 최근접 대형 발전단지: ${plantCtx.plant.name} (${plantCtx.plant.type})${
        plantCtx.plant.capacity_mw != null ? ` · ${plantCtx.plant.capacity_mw.toLocaleString()}MW` : ''
      } · ${plantCtx.km.toFixed(0)}km`,
    )
  if (windCtx?.nearest)
    L.push(`- 풍력: 반경 ${windCtx.radiusKm}km 내 ${windCtx.count}지점 · 최근접 ${windCtx.nearest.km.toFixed(1)}km`)
  if (cluster && cluster.km <= 60)
    L.push(
      `- 최근접 반도체·AI 메가클러스터: ${cluster.name} (${cluster.operator}·${cluster.status})${cluster.powerGw ? ` · 전력 ${cluster.powerGw}GW` : ''}${cluster.waterKtd ? ` · 용수 ${cluster.waterKtd.toLocaleString()}천t/일` : ''} · ${cluster.km.toFixed(0)}km — 전력·용수 경쟁/공존 대수요처`,
    )
  L.push(`- 계통연계 여유 직접 조회: RE클라우드 https://recloud.energy.or.kr/`)
  L.push(``)
  L.push(`## 최근접 데이터센터`)
  for (const { facility: f, km } of r.nearest) {
    L.push(`- ${f.name} — ${km.toFixed(1)}km · ${STATUS_LABEL[f.status] ?? f.status}${f.power_mw_public != null ? ` · ${f.power_mw_public}MW` : ''}`)
  }
  L.push(``)
  L.push(`---`)
  L.push(
    `근거: 한전 기본공급약관 제23조 · 전력계통영향평가 시범운영(공고 2025-139호) · AIDC 특별법 · KOSIS/한국부동산원 · 케이웨더 OpenAPI · vworld. ` +
      `본 리포트는 공개 데이터 기반 간이 판정이며, 미산출 축은 '데이터 대기'로 명시합니다(가짜 점수 없음). 정밀 스코어링 리포트는 M2에서 제공 예정.`,
  )
  return L.join('\n')
}
