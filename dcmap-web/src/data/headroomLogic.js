/* 변전소 여유 스냅샷 해석 — 순수 함수(Node 단위 테스트·브라우저 공용, Vite 전용 기능 없음).
 *
 * 스냅샷 v1(2026-07 시드): entries[{ name, sido, area, series(재생e 연계), supplySeries? }]
 * 스냅샷 v2(2026-10~):    entries[{ key, name, sido, sigungu, admCd, emd, supply, supply23, renew }]
 * 두 형식을 같은 모양으로 맞춘 뒤 비교한다. 값은 원문 그대로 — 보간·추정 없음.
 */
export const STREAMS = {
  supply: { ko: '154kV 수전', en: '154kV intake', desc: '소비자(DC)가 154kV로 받을 수 있는 여유' },
  supply23: { ko: '22.9kV 수전', en: '22.9kV intake', desc: '배전(22.9kV) 공급 여유 — 소형 DC 트랙' },
  renew: { ko: '재생e 연계', en: 'Renewable interconnection', desc: '발전설비 접속 여유(PPA·자가발전 맥락)' },
}

export function normEntry(e) {
  if (e.key || e.supply !== undefined || e.renew !== undefined) {
    return { supply: null, supply23: null, renew: null, ...e, key: e.key ?? e.name }
  }
  // v1: series = 재생e 연계 흐름, supplySeries = 154kV 수전(있을 때만)
  return {
    key: e.name,
    name: e.name,
    sido: e.sido,
    sigungu: e.area?.split(' ')[0] ?? null,
    emd: e.area?.split(' ').slice(1).join(' ') || null,
    supply: e.supplySeries ?? null,
    supply23: null,
    renew: e.series ?? null,
    genMw: e.genMw ?? 0,
  }
}

export const entriesOf = (snap) => (snap?.entries || []).map(normEntry)

/** 한전 표기 시군구('포항시남구', '서울특별시강서구', '부천시 원미구') → 화면 표기('포항시 남구', '강서구', '부천시 원미구') */
export function displaySigungu(s) {
  if (!s) return s
  return String(s)
    .replace(/^(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시)/, '')
    .replace(/^(.+?시)(?=\S+구$)/, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 연도별 시계열에서 처음 여유(>0)가 나는 해. 없으면 null */
export function firstAvailYear(series, years) {
  if (!series) return null
  const i = series.findIndex((v) => v > 0)
  return i < 0 ? null : years[i]
}

/**
 * 두 스냅샷 사이의 변화 — 같은 변전소(key, 없으면 이름)·같은 흐름·같은 연도를 비교.
 * minMw 미만 변화는 버린다(반올림·미세 조정 잡음). 큰 변화부터.
 * 반환: { from, to, compared, changes:[{ key,name,sido,sigungu,stream,year,was,now,delta }] }
 */
export function changeFeed(prevSnap, curSnap, { minMw = 10 } = {}) {
  if (!prevSnap || !curSnap) return { from: prevSnap?.month ?? null, to: curSnap?.month ?? null, compared: 0, changes: [] }
  const years = curSnap.years || prevSnap.years || []
  const pYears = prevSnap.years || years
  const prev = new Map()
  for (const e of entriesOf(prevSnap)) {
    prev.set(e.key, e)
    if (!prev.has(e.name)) prev.set(e.name, e) // v1↔v2: v1엔 key가 없어 이름으로 짝짓기
  }
  const changes = []
  let compared = 0
  for (const c of entriesOf(curSnap)) {
    const p = prev.get(c.key) ?? prev.get(c.name)
    if (!p) continue
    let any = false
    for (const stream of Object.keys(STREAMS)) {
      const a = p[stream]
      const b = c[stream]
      if (!a || !b) continue
      any = true
      years.forEach((y, i) => {
        const j = pYears.indexOf(y)
        if (j < 0) return
        const delta = (b[i] ?? 0) - (a[j] ?? 0)
        if (Math.abs(delta) >= minMw) {
          changes.push({ key: c.key, name: c.name, sido: c.sido, sigungu: c.sigungu, stream, year: y, was: a[j], now: b[i], delta })
        }
      })
    }
    if (any) compared++
  }
  changes.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
  return { from: prevSnap.month ?? prevSnap.asOf, to: curSnap.month ?? curSnap.asOf, compared, changes }
}

/**
 * 시군구별 154kV 수전 여유 요약(최신 스냅샷).
 * nowCount: 올해(첫 연도) 여유>0 변전소 수 · maxMw: 전 기간 최대 여유와 그 변전소·연도 · firstYear: 가장 이른 여유 발생 연도
 */
export function sigunguSummary(snap) {
  if (!snap) return []
  const years = snap.years || []
  const by = new Map()
  for (const e of entriesOf(snap)) {
    const k = `${e.sido}|${e.sigungu}`
    const g = by.get(k) || { sido: e.sido, sigungu: e.sigungu, label: displaySigungu(e.sigungu), substations: 0, measured: 0, nowCount: 0, maxMw: 0, maxAt: null, firstYear: null }
    g.substations++
    if (e.supply) {
      g.measured++
      if ((e.supply[0] ?? 0) > 0) g.nowCount++
      e.supply.forEach((v, i) => {
        if (v > g.maxMw) {
          g.maxMw = v
          g.maxAt = { name: e.name, year: years[i] }
        }
      })
      const fy = firstAvailYear(e.supply, years)
      if (fy != null && (g.firstYear == null || fy < g.firstYear)) g.firstYear = fy
    }
    by.set(k, g)
  }
  return [...by.values()].sort((a, b) => b.nowCount - a.nowCount || (a.firstYear ?? 9999) - (b.firstYear ?? 9999) || b.maxMw - a.maxMw)
}
