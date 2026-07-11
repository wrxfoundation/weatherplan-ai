// 지점 간이 리포트 v0 — 지점 분석 패널의 근거를 마크다운으로 (L2 정밀 리포트의 무료 티저)
// 정직성: 산출된 항목만 수치로, 대기 항목은 '데이터 대기'로 명시. 가짜 총점 없음.
import { STATUS_LABEL } from '../data/facilities.js'
import { fmtRate } from '../data/landPrice.js'
import { dcClimateIndex, nearestNormal } from './climateIndex.js'
import { dongLabel } from '../data/liveApi.js'

export function buildSiteReport({ point, r, nonCapital, mw, addr, landUse, wx, fc, landPrice, dongPulse, plantCtx, windCtx, headroom, flood, pop, disaster, energy, warning, climate }) {
  const L = []
  const now = new Date()
  L.push(`# AI InfraMap — 부지 적합도 간이 리포트 (v0)`)
  L.push(``)
  L.push(`- 지점: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`)
  if (addr?.parcel) L.push(`- 지번주소: ${addr.parcel}${addr.road ? ` (도로명: ${addr.road})` : ''}`)
  L.push(`- 입지 구분: ${nonCapital ? '비수도권' : '수도권'} (사용자 지정) · 필요 용량 ${mw}MW`)
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
  for (const axis of r.axes) {
    const state = axis.knownMax > 0 ? `${axis.known}/${axis.max}점` : `데이터 대기 (${axis.items.map((i) => i.basis).filter(Boolean).join(', ') || '소스 예정'})`
    L.push(`- ${axis.label}: ${state}`)
  }
  L.push(``)
  L.push(`## 토지·지가`)
  L.push(`- 용도지역: ${landUse?.uses?.length ? landUse.uses.join(' · ') : '조회 대기 (vworld)'}`)
  if (landPrice) {
    L.push(`- 지가변동률: ${fmtRate(landPrice.value)} (${landPrice.scope}, ${landPrice.period} 월간, KOSIS)`)
    if (dongPulse) L.push(`- 동 단위 범위: ${fmtRate(dongPulse.bottom.rate)} ~ ${fmtRate(dongPulse.top.rate)} (${dongPulse.count}개 조사구역)`)
  }
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
  L.push(`## 계통 여유용량 (한전 분산전원 22.9kV)`)
  if (headroom?.available) {
    L.push(
      `- ${headroom.availableMw != null ? `여유 ${headroom.availableMw}MW` : ''}${headroom.cumulativeMw != null ? ` · 누적연계 ${headroom.cumulativeMw}MW` : ''} (${headroom.scope})`,
    )
  } else {
    L.push(`- 연동 대기 — 한전 전력데이터 개방포털 분산전원연계 API (전력축 D3)`)
  }
  L.push(``)
  L.push(`## 리스크 (침수·인구·재해)`)
  if (flood?.available) {
    L.push(
      flood.grade === '해당없음' || flood.depthM === 0
        ? `- 침수: 침수구역 외 · 위험 낮음 (홍수위험지도)`
        : `- 침수: 위험 ${flood.grade}${flood.depthM != null ? ` · 침수심 ${flood.depthM}m` : ''}${flood.floodType ? ` · ${flood.floodType}` : ''} (홍수위험지도)`,
    )
  } else {
    L.push(`- 침수: 연동 대기 — 홍수위험지도(리스크축)`)
  }
  if (pop?.available) {
    L.push(
      `- 반경 ${pop.radiusKm}km 인구: ${pop.population != null ? `${pop.population.toLocaleString()}명` : '–'}${pop.households != null ? ` · ${pop.households.toLocaleString()}가구` : ''} — ${pop.population != null && pop.population < 5000 ? '저밀도(민원 리스크 낮음)' : '주거 밀집(민원 유의)'} (SGIS)`,
    )
  } else {
    L.push(`- 인구격자(민원 프록시): 연동 대기 — SGIS`)
  }
  if (disaster?.available) {
    L.push(`- 재해 이력: ${disaster.events != null ? `${disaster.events.toLocaleString()}건` : ''}${disaster.topType ? ` · 주 유형 ${disaster.topType}` : ''}${disaster.recentYear ? ` · 최근 ${disaster.recentYear}` : ''} (재난안전)`)
  } else {
    L.push(`- 재해 이력: 연동 대기 — 재난안전 공유플랫폼`)
  }
  if (energy?.available && energy.usage != null) {
    L.push(`- 지번 실측 전기사용량: ${energy.useYm} ${energy.usage.toLocaleString()} ${energy.unit} (국토부 건축HUB — 단독·소규모·산업 용도 제외)`)
  } else if (addr?.sigunguCd) {
    L.push(`- 지번 실측 전기사용량: 해당 지번 데이터 없음 (대상 외일 수 있음 — 건축HUB)`)
  }
  L.push(``)
  L.push(`## 인프라 근접성 (맥락 — 전원 매칭 아님)`)
  if (plantCtx)
    L.push(
      `- 최근접 대형 발전단지: ${plantCtx.plant.name} (${plantCtx.plant.type})${
        plantCtx.plant.capacity_mw != null ? ` · ${plantCtx.plant.capacity_mw.toLocaleString()}MW` : ''
      } · ${plantCtx.km.toFixed(0)}km`,
    )
  if (windCtx?.nearest)
    L.push(`- 풍력: 반경 ${windCtx.radiusKm}km 내 ${windCtx.count}지점 · 최근접 ${windCtx.nearest.km.toFixed(1)}km`)
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
