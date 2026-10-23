import { useMemo, useState } from 'react'
import { useMapLang } from '../i18n/mapLang.js'
import { sidoT, sigunguT, substationT } from '../i18n/places.js'
import FreshnessChip from '../ui/FreshnessChip.jsx'
import { STREAMS, displaySigungu, firstAvailYear } from '../data/headroomLogic.js'
import { LATEST_SNAPSHOT, LATEST_CHANGES, SIGUNGU_HEADROOM, LATEST_ENTRIES } from '../data/headroomSnapshots.js'

/* 계통(변전소) 수전 여유 — 한전ON 월별 스냅샷 기반 화면 조각 3종
 *  SigunguHeadroomCard   DC 입지 시군구별 154kV 수전 여유 요약
 *  HeadroomChangeCard    직전 수집 대비 변화(연도·흐름 단위)
 *  SubstationHeadroomCard 특정 시군구(들)의 변전소별 연도 시계열
 * 정직성: 0=당해 여유 없음(정상값), 빈 칸=응답에 없음. 실제 접속 가부는 전기사용신청 후 한전 확정. */

const YEAR_TONE = (y, base) => (y == null ? 'none' : y <= base ? 'now' : y <= base + 3 ? 'mid' : 'late')

function firstYearLabel(y, years, en) {
  const last = years.at(-1)
  if (y == null) return en ? `none through ${last}` : `${last}년까지 없음`
  if (y === years[0]) return en ? 'now' : '지금'
  return en ? `from ${y}` : `${y}년~`
}

const sigName = (sigungu, en) => sigunguT(displaySigungu(sigungu), en)
const sigLabel = (r, en) => (en ? `${sigName(r.sigungu, true)} · ${sidoT(r.sido, true)}` : `${r.sido} ${displaySigungu(r.sigungu)}`)

export function SigunguHeadroomCard({ sido = null, initial = 10, title }) {
  const en = useMapLang() === 'en'
  const [open, setOpen] = useState(false)
  const years = LATEST_SNAPSHOT?.years || []
  const rows = useMemo(() => (sido ? SIGUNGU_HEADROOM.filter((r) => r.sido === sido) : SIGUNGU_HEADROOM), [sido])
  if (!LATEST_SNAPSHOT || !rows.length) return null
  const shown = open ? rows : rows.slice(0, initial)
  const maxNow = Math.max(1, ...rows.map((r) => r.measured))
  const subs = rows.reduce((s, r) => s + r.substations, 0)
  const zero = rows.filter((r) => r.firstYear == null).length
  return (
    <section className="calc-card gh-card" style={{ gridColumn: '1 / -1' }}>
      <div className="chart-title">
        {title ?? (en ? `154kV intake headroom in DC host districts (KEPCO ON, ${LATEST_SNAPSHOT.month})` : `DC 입지 시군구 — 154kV 수전 여유 (한전ON ${LATEST_SNAPSHOT.month})`)}
        <FreshnessChip id="headroom-snap" />
      </div>
      <p className="chart-note">
        {en
          ? `${rows.length} districts that host data centres · ${subs} substations, collected monthly. “Intake headroom” is KEPCO's yearly outlook of power-supply (consumer) headroom in MW. ${zero} district${zero === 1 ? '' : 's'} show no 154kV headroom through ${years.at(-1)}. 0 means no headroom that year; actual connection is confirmed only after the electricity-use application.`
          : `DC 시설이 있는 시군구 ${rows.length}곳 · 154kV 변전소 ${subs}곳을 매월 수집합니다. 수전 여유 = 한전이 공개하는 연도별 전력공급(소비자) 여유 MW 전망. ${years.at(-1)}년까지 154kV 여유가 하나도 없는 시군구가 ${zero}곳입니다. 0은 당해 여유 없음 — 실제 접속 가부는 전기사용신청 후 한전이 확정합니다.`}
      </p>
      <div className="gh-table" role="table">
        <div className="gh-row gh-head" role="row">
          <span>{en ? 'District' : '시군구'}</span>
          <span>{en ? `Substations with headroom now (${years[0]})` : `지금(${years[0]}) 여유 있는 변전소`}</span>
          <span>{en ? 'Peak headroom' : '최대 여유'}</span>
          <span>{en ? 'First headroom' : '여유 첫 발생'}</span>
        </div>
        {shown.map((r) => (
          <div key={`${r.sido}|${r.sigungu}`} className="gh-row" role="row">
            <span className="gh-name">{sido ? sigName(r.sigungu, en) : sigLabel(r, en)}</span>
            <span className="gh-now">
              <b>{r.nowCount}</b>
              <i>/{r.measured}</i>
              <span className="gh-bar" aria-hidden>
                <span style={{ width: `${(r.nowCount / maxNow) * 100}%` }} />
              </span>
            </span>
            <span className="gh-max">
              {r.maxMw > 0 ? (
                <>
                  <b>{r.maxMw.toLocaleString()}</b> MW
                  <i>{substationT(r.maxAt?.name, en)} · {r.maxAt?.year}</i>
                </>
              ) : (
                <i>0 MW</i>
              )}
            </span>
            <span>
              <span className={`gh-year tone-${YEAR_TONE(r.firstYear, years[0])}`}>{firstYearLabel(r.firstYear, years, en)}</span>
            </span>
          </div>
        ))}
      </div>
      {rows.length > initial && (
        <button type="button" className="btn list-expand" onClick={() => setOpen((v) => !v)}>
          {open ? (en ? 'Collapse ▲' : '접기 ▲') : en ? `Show all ${rows.length} ▼` : `전체 ${rows.length}곳 보기 ▼`}
        </button>
      )}
    </section>
  )
}

/* 같은 변전소·흐름에서 같은 값 변화가 연속 연도로 이어지면 한 줄로 묶는다(2028–2029년 370→125) */
function groupChanges(changes) {
  const out = []
  const sorted = [...changes].sort((a, b) => a.key.localeCompare(b.key) || a.stream.localeCompare(b.stream) || a.year - b.year)
  for (const c of sorted) {
    const last = out.at(-1)
    if (last && last.key === c.key && last.stream === c.stream && last.was === c.was && last.now === c.now && last.y2 === c.year - 1) {
      last.y2 = c.year
    } else out.push({ ...c, y1: c.year, y2: c.year })
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

export function HeadroomChangeCard({ limit = 12 }) {
  const en = useMapLang() === 'en'
  const feed = LATEST_CHANGES
  const rows = useMemo(() => groupChanges(feed.changes), [feed])
  if (!feed.from || !feed.to) return null
  const limited = feed.compared < 20
  return (
    <section className="calc-card gh-card">
      <div className="chart-title">{en ? `Grid headroom changes — ${feed.from} → ${feed.to}` : `계통 여유 변화 — ${feed.from} → ${feed.to}`}</div>
      <p className="chart-note">
        {en
          ? `Same substation, same year, compared between collections (changes under 10 MW ignored). ${feed.compared} substations comparable${limited ? ' — the previous collection covered only a few, so from the next monthly run every collected substation is compared.' : '.'}`
          : `같은 변전소·같은 연도를 수집 시점끼리 비교합니다(10MW 미만 변화 제외). 비교 가능한 변전소 ${feed.compared}곳${limited ? ' — 지난 수집 범위가 좁아 이번엔 제한적이고, 다음 달 수집부터 전체 변전소가 비교됩니다.' : '.'}`}
      </p>
      {rows.length === 0 ? (
        <p className="gh-empty">{en ? 'No change of 10 MW or more.' : '10MW 이상 변화 없음.'}</p>
      ) : (
        <ul className="gh-feed">
          {rows.slice(0, limit).map((c) => (
            <li key={`${c.key}|${c.stream}|${c.y1}`} className={c.delta < 0 ? 'down' : 'up'}>
              <span className="gh-feed-name">
                <b>{substationT(c.name, en)}</b> {en ? 'substation' : '변전소'} · {sigName(c.sigungu, en)}
              </span>
              <span className="gh-feed-what">
                {en ? STREAMS[c.stream].en : STREAMS[c.stream].ko} · {c.y1 === c.y2 ? c.y1 : `${c.y1}–${c.y2}`}
                {en ? '' : '년'}
              </span>
              <span className="gh-feed-val">
                {c.was} → <b>{c.now}</b> MW <em>{c.delta > 0 ? '▲' : '▼'}{Math.abs(c.delta)}</em>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** 특정 시군구(admCd 목록)의 변전소별 154kV 수전 여유 연도 시계열 */
export function SubstationHeadroomCard({ admCds, title }) {
  const en = useMapLang() === 'en'
  const years = LATEST_SNAPSHOT?.years || []
  const rows = useMemo(
    () =>
      LATEST_ENTRIES.filter((e) => admCds?.includes(e.admCd) && e.supply).sort(
        (a, b) => (firstAvailYear(a.supply, years) ?? 9999) - (firstAvailYear(b.supply, years) ?? 9999) || Math.max(...b.supply) - Math.max(...a.supply),
      ),
    [admCds, years],
  )
  if (!rows.length) return null
  const max = Math.max(1, ...rows.flatMap((r) => r.supply))
  return (
    <section className="calc-card gh-card">
      <div className="chart-title">
        {title ?? (en ? `154kV intake headroom by substation — ${sigName(rows[0].sigungu, true)}` : `154kV 변전소별 수전 여유 — ${displaySigungu(rows[0].sigungu)}`)}
        <FreshnessChip id="headroom-snap" />
      </div>
      <div className="gh-heat-wrap">
        <table className="gh-heat">
          <thead>
            <tr>
              <th>{en ? 'Substation' : '변전소'}</th>
              {years.map((y) => (
                <th key={y}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{substationT(r.name, en)}</th>
                {r.supply.map((v, i) => (
                  <td key={years[i]} className={v > 0 ? 'on' : ''} style={v > 0 ? { '--a': 0.18 + 0.62 * (v / max) } : undefined}>
                    {v > 0 ? v : '0'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="chart-note">
        {en
          ? 'MW of power-supply (consumer) headroom KEPCO publishes per year. 0 = none that year. Reference only — the connection is confirmed after the electricity-use application. Substation names are romanized from Korean (KEPCO publishes no English names).'
          : '한전이 공개하는 연도별 전력공급(소비자 수전) 여유 MW. 0 = 당해 여유 없음. 참고자료 — 실제 접속은 전기사용신청 후 확정.'}
      </p>
    </section>
  )
}
