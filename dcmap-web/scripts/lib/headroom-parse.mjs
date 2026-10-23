/* 한전ON 변전소 여유 프록시 응답 → 스냅샷 항목 (순수 함수 — 단위 테스트 대상)
 *
 * 프록시(api/headroom.js transHandler) 응답:
 *   { available, scope:{sido,sigg}, supply:{ kv154:[…], kv23:[…] }, renew:{ kv154:[…] } }
 *   각 항목 { name, sido, sigg, emd, years:[2026…], series:[MW…], maxMw, genMw }
 *   구 스키마 { supply:{ list }, renew:{ list } }(항목에 byYear 또는 'YYYY' 키)도 읽는다.
 *
 * 스냅샷 항목(v2): 변전소 하나에 세 흐름을 같이 담는다
 *   supply   — 154kV 전력공급(소비자 수전) 여유: DC가 154kV로 받을 때 직접 쓰는 지표
 *   supply23 — 22.9kV 배전 공급 여유: 10MW 안팎 소형 DC 트랙
 *   renew    — 재생e 연계(발전 접속) 여유: 2026-07 시드와 같은 지표(시계열 연속)
 * 값은 원문 그대로(가공·보간 없음). 해당 흐름이 응답에 없으면 null — 0과 구분한다.
 */
export function seriesOf(item, years) {
  if (!item) return null
  return years.map((y, i) => {
    const idx = Array.isArray(item.years) ? item.years.indexOf(y) : i
    const v = item.series?.[idx] ?? item.byYear?.[y] ?? item[String(y)]
    return v == null || v === '' ? 0 : Number(v) || 0
  })
}

const listOf = (stream, kv = 'kv154') => stream?.[kv] || (kv === 'kv154' ? stream?.list : null) || []

export function parseTrans(json, target, years) {
  if (!json || json.available === false) return []
  const sup = listOf(json.supply, 'kv154')
  const sup23 = listOf(json.supply, 'kv23')
  const ren = listOf(json.renew, 'kv154')
  const names = [...new Set([...sup, ...sup23, ...ren].map((e) => e?.name).filter(Boolean))]
  const find = (list, n) => list.find((e) => e.name === n) || null
  return names.map((name) => {
    const s = find(sup, name)
    const s23 = find(sup23, name)
    const r = find(ren, name)
    const any = s || s23 || r
    return {
      key: `${target.admCd}:${name}`,
      name,
      sido: target.sido,
      sigungu: target.sigungu,
      admCd: target.admCd,
      emd: any.emd ?? null,
      supply: seriesOf(s, years),
      supply23: seriesOf(s23, years),
      renew: seriesOf(r, years),
      genMw: Number(any.genMw || 0),
    }
  })
}
