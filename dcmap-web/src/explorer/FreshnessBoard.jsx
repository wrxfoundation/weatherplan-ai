import { useMemo, useState } from 'react'
import { evaluateFreshness, STATUS, METHODS, GROUPS, behindLabel } from '../data/freshness.js'
import { LATEST_MONTH } from '../data/headroomSnapshotIndex.js'

/* 데이터 최신성 보드 — 데이터셋마다 기준일·지연·갱신 방식을 한 화면에.
 * 판정은 브라우저의 오늘 날짜로 한다(재배포 없이도 지연이 정직하게 드러남). */
const fmtAge = (d, en) => {
  if (d == null) return '—'
  if (d < 60) return en ? `${d}d` : `${d}일`
  if (d < 730) return en ? `${Math.round(d / 30.4)} mo` : `${Math.round(d / 30.4)}개월`
  return en ? `${(d / 365).toFixed(1)} yr` : `${(d / 365).toFixed(1)}년`
}

export default function FreshnessBoard({ en }) {
  // 좁은 화면은 31행이 너무 길다 — 손볼 것만 먼저 보여주고 토글로 전체
  const [onlyAttention, setOnlyAttention] = useState(() => {
    try {
      return window.matchMedia('(max-width: 720px)').matches
    } catch {
      return false
    }
  })
  const [open, setOpen] = useState(null)
  const { rows, count, attention, today } = useMemo(
    () => evaluateFreshness(new Date(), { headroomLatest: LATEST_MONTH }),
    [],
  )
  const live = rows.filter((r) => r.status === 'live')
  const judged = rows.filter((r) => r.status !== 'live')
  const shown = onlyAttention ? judged.filter((r) => ['overdue', 'unknown', 'review'].includes(r.status)) : judged
  const order = ['overdue', 'unknown', 'review', 'soon', 'fresh', 'reference', 'pending']

  return (
    <section id="freshness" className="fresh-board" aria-label={en ? 'Data freshness' : '데이터 최신성'}>
      <div className="fresh-head">
        <div>
          <h2>{en ? 'Data freshness' : '데이터 최신성'}</h2>
          <p className="fresh-sub">
            {en
              ? `Every dataset with its as-of date, judged against today (${today}). Expected release dates are estimates from each publisher's usual cadence.`
              : `데이터셋마다 기준일을 오늘(${today}) 날짜로 판정합니다. 다음 공표 예정일은 출처별 통상 주기에 따른 추정입니다.`}
          </p>
        </div>
        <label className="fresh-toggle">
          <input type="checkbox" checked={onlyAttention} onChange={(e) => setOnlyAttention(e.target.checked)} />
          {en ? `Needs action only (${attention})` : `손볼 것만 보기 (${attention})`}
        </label>
      </div>

      <div className="fresh-summary" role="list">
        {order.filter((s) => count[s]).map((s) => (
          <span key={s} role="listitem" className={`fresh-chip tone-${STATUS[s].tone}`}>
            {en ? STATUS[s].en : STATUS[s].ko} <b>{count[s]}</b>
          </span>
        ))}
        <span className="fresh-chip tone-good">{en ? 'Live' : '실시간'} <b>{live.length}</b></span>
      </div>

      <div className="fresh-table-wrap">
        <table className="fresh-table">
          <thead>
            <tr>
              <th>{en ? 'Status' : '상태'}</th>
              <th>{en ? 'Dataset' : '데이터'}</th>
              <th>{en ? 'As of' : '기준'}</th>
              <th>{en ? 'Age' : '경과'}</th>
              <th>{en ? 'Next expected (est.)' : '다음 예정(추정)'}</th>
              <th>{en ? 'Update' : '갱신 방식'}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const st = STATUS[r.status]
              const isOpen = open === r.id
              return (
                <tr key={r.id} className={isOpen ? 'open' : ''} onClick={() => setOpen(isOpen ? null : r.id)}>
                  <td data-k={en ? 'Status' : '상태'}>
                    <span className={`fresh-chip tone-${st.tone}`}>{en ? st.en : st.ko}</span>
                    {r.status === 'overdue' && <span className="fresh-behind">{behindLabel(r, r, en)}</span>}
                  </td>
                  <td data-k={en ? 'Dataset' : '데이터'}>
                    <b className="fresh-name">{en ? r.nameEn : r.name}</b>
                    <span className="fresh-src">{en ? r.sourceEn : r.source} · {en ? GROUPS[r.group].en : GROUPS[r.group].ko}</span>
                    {isOpen && (
                      <span className="fresh-how">
                        <span><i>{en ? 'How to refresh' : '갱신 방법'}</i>{r.how}</span>
                        {r.file && <span><i>{en ? 'File' : '파일'}</i><code>{r.file}</code></span>}
                        {r.usedIn?.length > 0 && <span><i>{en ? 'Used in' : '쓰이는 곳'}</i>{r.usedIn.join(' · ')}</span>}
                      </span>
                    )}
                  </td>
                  <td data-k={en ? 'As of' : '기준'} className="fresh-num">{r.asOf ?? (en ? 'not recorded' : '미기록')}</td>
                  <td data-k={en ? 'Age' : '경과'} className="fresh-num">{fmtAge(r.ageDays, en)}</td>
                  <td data-k={en ? 'Next' : '다음 예정'} className="fresh-num">
                    {r.cadence?.kind === 'static' ? (en ? 'fixed' : '고정') : r.due ?? '—'}
                  </td>
                  <td data-k={en ? 'Update' : '갱신 방식'}>
                    <span className={`fresh-method m-${r.method}`} title={en ? METHODS[r.method].en : METHODS[r.method].desc}>
                      {en ? METHODS[r.method].en : METHODS[r.method].ko}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <details className="fresh-live">
        <summary>{en ? `Live integrations (${live.length}) — fetched on every query` : `실시간 연동 ${live.length}종 — 조회할 때마다 원천에서 받아옴`}</summary>
        <ul>
          {live.map((r) => (
            <li key={r.id}><b>{en ? r.nameEn : r.name}</b> <span>{en ? r.sourceEn : `${r.source} · ${r.how}`}</span></li>
          ))}
        </ul>
      </details>

      <p className="fresh-foot">
        {en
          ? 'Click a row for how to refresh it. A weekly GitHub Action re-runs this check, collects the substation snapshot monthly, and keeps one issue listing what is overdue.'
          : '행을 누르면 갱신 방법이 나옵니다. 매주 GitHub Action이 이 점검을 다시 돌려, 변전소 스냅샷은 월 1회 자동 수집하고 지연 목록은 이슈 하나로 계속 갱신합니다.'}
      </p>
    </section>
  )
}
