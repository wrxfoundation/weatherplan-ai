// 지점 간이 리포트 v0 — 지점 분석 패널의 근거를 마크다운으로 (L2 정밀 리포트의 무료 티저)
// 정직성: 산출된 항목만 수치로, 대기 항목은 '데이터 대기'로 명시. 가짜 총점 없음.
import { STATUS_LABEL } from '../data/facilities.js'
import { fmtRate } from '../data/landPrice.js'

export function buildSiteReport({ point, r, nonCapital, mw, addr, landUse, wx, fc, landPrice, dongPulse, plantCtx, windCtx }) {
  const L = []
  const now = new Date()
  L.push(`# 명당 AI — 부지 적합도 간이 리포트 (v0)`)
  L.push(``)
  L.push(`- 지점: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`)
  if (addr?.parcel) L.push(`- 지번주소: ${addr.parcel}${addr.road ? ` (도로명: ${addr.road})` : ''}`)
  L.push(`- 입지 구분: ${nonCapital ? '비수도권' : '수도권'} (사용자 지정) · 필요 용량 ${mw}MW`)
  L.push(`- 생성: ${now.toLocaleString('ko-KR')} · myeongdang-ai`)
  L.push(``)
  L.push(`## 전력 인허가 트랙 판정 (규칙 기반)`)
  L.push(`- 수전전압: ${r.track.track.voltage} (${r.track.track.circuits})`)
  L.push(`- 전기사용예정통지: ${r.track.preNoticeRequired ? '대상 (5,000kW 이상)' : '비대상'}`)
  L.push(
    `- 전력계통영향평가: ${r.track.psiaRequired ? '대상 (10MW 이상)' : '비대상'}${r.track.exemption ? ` — 비수도권 특례로 ${r.track.exemption.effective}부터 면제 가능성 (규모 기준 대통령령 미제정)` : ''}`,
  )
  L.push(`- 확정 수수료(심의회 상정까지): ${r.track.fees.total} · 리드타임 골자: ${r.track.leadTime.review}${r.track.leadTime.assessment ? ` + ${r.track.leadTime.assessment}` : ''}`)
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
    L.push(`- 현재: ${wx.temp != null ? `${wx.temp}°C` : ''}${wx.sky ? ` · ${wx.sky}` : ''}${wx.humidity != null ? ` · 습도 ${wx.humidity}%` : ''}${wx.scope ? ` (${wx.scope})` : ''}`)
    if (fc?.hours?.length) L.push(`- 초단기예보(H+1~6): ${fc.hours.map((h, i) => `+${i + 1}h ${h.temp ?? '–'}°`).join(' / ')}${fc.rain ? ' · 강수 감지' : ''}`)
  } else {
    L.push(`- 연동 대기 — 기상축(M3) 데이터 소스`)
  }
  L.push(``)
  L.push(`## 인프라 근접성 (맥락 — 전원 매칭 아님)`)
  if (plantCtx) L.push(`- 최근접 대형 발전단지: ${plantCtx.plant.name} (${plantCtx.plant.type}) · ${plantCtx.km.toFixed(0)}km`)
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
