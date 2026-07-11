import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { LAND_DONG, LAND_DONG_PERIOD } from '../data/landPriceDong.js'
import { fmtRate } from '../data/landPrice.js'

const TITLE = 'LAND PULSE — 입지 지가변동률 시·군·구·동 리스트 · 명당 AI'
const DESC =
  '데이터센터 입지 시군구 35곳과 읍면동 조사구역 539개의 월간 지가변동률 — 시도 필터·정렬·동 단위 드릴다운. KOSIS·한국부동산원 공개 통계.'

function SignedBar({ rate, maxAbs }) {
  return (
    <span className="hbar-track">
      <span
        className={`hbar-fill${rate < 0 ? ' neg' : ''}`}
        style={{ width: `${Math.max((Math.abs(rate) / maxAbs) * 100, 2)}%` }}
      />
    </span>
  )
}

export default function LandPulsePage() {
  const [sido, setSido] = useState('')
  const [sort, setSort] = useState('rate') // rate | name
  const [open, setOpen] = useState(() => new Set())

  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  const rows = useMemo(() => {
    let list = Object.entries(LAND_DONG.entries).map(([key, v]) => ({
      key,
      sido: key.split(' ')[0],
      rate: v.rate,
      dongs: v.dongs,
    }))
    if (sido) list = list.filter((r) => r.sido === sido)
    list.sort((a, b) => (sort === 'rate' ? b.rate - a.rate : a.key.localeCompare(b.key, 'ko')))
    return list
  }, [sido, sort])

  const sidos = useMemo(
    () => [...new Set(Object.keys(LAND_DONG.entries).map((k) => k.split(' ')[0]))].sort((a, b) => a.localeCompare(b, 'ko')),
    [],
  )
  const maxAbs = useMemo(
    () => Math.max(...Object.values(LAND_DONG.entries).flatMap((v) => v.dongs.map((d) => Math.abs(d.rate))), 0.01),
    [],
  )
  const totalDongs = useMemo(
    () => Object.values(LAND_DONG.entries).reduce((n, v) => n + v.dongs.length, 0),
    [],
  )

  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="eyebrow">LAND PULSE</div>
        <h1>입지 지가변동률 — 시·군·구·동</h1>
        <p className="sub">
          DC 입지 시군구 {Object.keys(LAND_DONG.entries).length}곳 · 읍면동 조사구역 {totalDongs}개 —{' '}
          {LAND_DONG_PERIOD} 월간, KOSIS·한국부동산원. 행을 누르면 동 단위로 펼쳐집니다.
        </p>

        <div className="filterbar-inline">
          <select value={sido} onChange={(e) => setSido(e.target.value)} aria-label="시도 필터">
            <option value="">시도 전체</option>
            {sidos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="정렬">
            <option value="rate">변동률순</option>
            <option value="name">이름순</option>
          </select>
        </div>

        <div className="land-list">
          {rows.map((r) => (
            <div key={r.key} className={`land-row-wrap ${open.has(r.key) ? 'open' : ''}`}>
              <button
                type="button"
                className="land-row"
                onClick={() => r.dongs.length && toggle(r.key)}
                aria-expanded={open.has(r.key)}
                disabled={!r.dongs.length}
              >
                <span className="land-name">{r.key}</span>
                <SignedBar rate={r.rate} maxAbs={maxAbs} />
                <span className="hbar-value">{fmtRate(r.rate)}</span>
                <span className="land-meta">{r.dongs.length ? `${r.dongs.length}구역` : '세분화 미제공'}</span>
                <span className="land-caret">{r.dongs.length ? (open.has(r.key) ? '▾' : '▸') : ''}</span>
              </button>
              {open.has(r.key) && (
                <div className="land-dongs">
                  {r.dongs.map((d) => (
                    <div key={d.name} className="land-dong-row">
                      <span className="land-name dong">{d.name}</span>
                      <SignedBar rate={d.rate} maxAbs={maxAbs} />
                      <span className="hbar-value">{fmtRate(d.rate)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="footer-note">
          구역 명칭은 부동산원 조사구역 단위(복수 법정동 병기 가능) · 음수는 amber. 단월 스냅샷으로 추세를 단정하지
          않습니다 — 방법론과 정직성 규칙: <Link to="/insights/land-pulse-methodology">LAND PULSE 방법론</Link>.
          기준월 갱신은 부동산원 공표(익월 하순) 후 자동 반영 예정(D5).
        </p>
      </main>
    </>
  )
}
