// 집단에너지(열병합) 발전소 발전용량 현황 — 2025-07-01 기준 (공개 CSV 흡수)
// 정직성: 발전용량(MW)·발전사·관리소·공급년월은 원문 신뢰. 관리소는 비공식 지명이라 개별 좌표 미부여 → 맵 미배치.
import raw from '../../data/chp_plants_v0.json'

export const CHP_META = { source: raw.source, note: raw.note, count: raw.count }
export const CHP_PLANTS = raw.plants

const total = CHP_PLANTS.reduce((s, p) => s + (p.mw || 0), 0)
const new2025 = CHP_PLANTS.filter((p) => (p.commission || '').startsWith('2025'))
const new2025Mw = new2025.reduce((s, p) => s + (p.mw || 0), 0)

export const CHP_STATS = {
  count: CHP_PLANTS.length,
  totalMw: Math.round(total),
  new2025Count: new2025.length,
  new2025Mw: Math.round(new2025Mw),
}

// 발전사별 발전용량 합계 상위
export const CHP_BY_OP = (() => {
  const m = new Map()
  for (const p of CHP_PLANTS) if (p.mw) m.set(p.op, (m.get(p.op) || 0) + p.mw)
  return [...m.entries()].map(([op, mw]) => ({ op, mw: Math.round(mw) })).sort((a, b) => b.mw - a.mw)
})()

// 발전용량 상위 단일 발전소
export const CHP_TOP_PLANTS = [...CHP_PLANTS]
  .filter((p) => p.mw)
  .sort((a, b) => b.mw - a.mw)
  .slice(0, 20)
