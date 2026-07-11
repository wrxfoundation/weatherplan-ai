import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES, STATUS_LABEL, findBySlug, slugOf } from '../data/facilities.js'
import { landPriceFor, fmtRate } from '../data/landPrice.js'
import { dongPulseFor } from '../data/landPriceDong.js'
import { nearestPlant } from '../data/plants.js'
import { checkPowerTrack } from '../calc/trackCheck.js'

const TITLE = '시설 비교 — 명당 AI'
const DESC = '데이터센터 2~3곳을 나란히 — 상태·전력·연도·지가·인허가 트랙·발전 인프라 근접성을 공개 데이터로 비교.'
const CAPITAL = new Set(['서울', '경기', '인천'])

const sorted = [...FACILITIES].sort((a, b) => a.name.localeCompare(b.name, 'ko'))

function Cell({ f, row }) {
  if (!f) return <td className="cmp-empty">—</td>
  return <td>{row(f)}</td>
}

export default function ComparePage() {
  const [params, setParams] = useSearchParams()
  const slugs = (params.get('ids') ?? '').split(',').filter(Boolean).slice(0, 3)
  const picks = [0, 1, 2].map((i) => (slugs[i] ? findBySlug(slugs[i]) : null))

  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  const setPick = (i, slug) => {
    const next = picks.map((f) => (f ? slugOf(f) : ''))
    next[i] = slug
    const ids = next.filter(Boolean).join(',')
    setParams(ids ? { ids } : {}, { replace: true })
  }

  const rows = useMemo(
    () => [
      { k: '상태', r: (f) => STATUS_LABEL[f.status] ?? f.status },
      { k: '유형', r: (f) => f.type },
      { k: '운영사', r: (f) => f.operator ?? '미공개' },
      { k: '공개 전력', r: (f) => (f.power_mw_public != null ? `${f.power_mw_public} MW` : '비공개') },
      { k: '연도', r: (f) => f.year ?? '미상' },
      { k: '위치', r: (f) => `${f.sido}${f.sigungu ? ` ${f.sigungu}` : ''}` },
      {
        k: '수전 트랙(공개 MW 기준)',
        r: (f) =>
          f.power_mw_public != null
            ? checkPowerTrack(f.power_mw_public, { nonCapital: !CAPITAL.has(f.sido) }).track.voltage
            : '—',
      },
      {
        k: '계통영향평가',
        r: (f) =>
          f.power_mw_public != null
            ? checkPowerTrack(f.power_mw_public, { nonCapital: !CAPITAL.has(f.sido) }).psiaRequired
              ? '대상'
              : '비대상'
            : '—',
      },
      {
        k: '지가변동률(월)',
        r: (f) => {
          const lp = landPriceFor(f)
          return lp ? `${fmtRate(lp.value)} (${lp.scope})` : '—'
        },
      },
      {
        k: '동 단위 지가 범위',
        r: (f) => {
          const dp = dongPulseFor(f)
          return dp ? `${fmtRate(dp.bottom.rate)} ~ ${fmtRate(dp.top.rate)}` : '—'
        },
      },
      {
        k: '최근접 대형 발전단지',
        r: (f) => {
          const np = nearestPlant(f)
          return np ? `${np.plant.name} ${np.km.toFixed(0)}km` : '—'
        },
      },
      { k: '검증 상태', r: (f) => (f.needs_verify ? '검증 필요' : '공개 확인') },
    ],
    [],
  )

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="eyebrow">COMPARE</div>
        <h1>시설 비교</h1>
        <p className="sub">최대 3곳 — 공개 데이터·규칙 기반 판정만 나란히 놓습니다.</p>

        <div className="calc-card">
          <div className="cmp-scroll">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th />
                  {[0, 1, 2].map((i) => (
                    <th key={i}>
                      <select
                        value={picks[i] ? slugOf(picks[i]) : ''}
                        onChange={(e) => setPick(i, e.target.value)}
                        aria-label={`비교 시설 ${i + 1}`}
                      >
                        <option value="">시설 선택…</option>
                        {sorted.map((f) => (
                          <option key={f.id} value={slugOf(f)}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      {picks[i] && (
                        <Link className="cmp-detail" to={`/dc/${slugOf(picks[i])}`}>
                          상세 ↗
                        </Link>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ k, r }) => (
                  <tr key={k}>
                    <th>{k}</th>
                    {picks.map((f, i) => (
                      <Cell key={i} f={f} row={r} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="chart-note">
            수전 트랙·계통영향평가는 공개 용량을 현행 규정에 대입한 규칙 기반 판정 — 실제 계약과 다를 수 있습니다.
            발전단지 거리는 근접성 맥락(전원 매칭 아님).
          </p>
        </div>
      </main>
    </>
  )
}
