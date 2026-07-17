import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { recommendSites } from '../score/recommend.js'
import Term from '../components/Term.jsx'
import { useMapLang } from '../i18n/mapLang.js'

/* AIDC 특별법 면제 시나리오 시뮬레이터 (해자 기능)
 * 비수도권 AIDC는 2027.3~ 전력계통영향평가 면제 대상이나, 면제 '용량 상한'은 대통령령 미정.
 * 이 미정 변수를 사용자가 가정값으로 조정해, 이 용량/입지가 면제되는지 + 비수도권 후보가 몇 곳 열리는지 본다.
 * 정직성: 대통령령 미정임을 명시하고, 가정 기반 추정임을 전제. 확정 시 자동 반영 예정. */
const DEFAULT_CAP = 100 // 가정 면제 상한(MW) — 사용자 조정. 확정 아님.

export default function AidcScenario({ mw, nonCapital }) {
  const [cap, setCap] = useState(DEFAULT_CAP)
  const en = useMapLang() === 'en'
  const round = Math.round(mw)

  const psiaTarget = mw >= 10 // 전력계통영향평가 대상(10MW+)
  const exemptEligible = nonCapital && mw <= cap // 이 시나리오상 면제 해당
  const overCap = nonCapital && mw > cap

  // 이 용량을 수용 가능한 비수도권 산단 후보 수(계통 여유 ≥ 필요MW) — 면제가 열리면 후보 풀
  const nonCapCandidates = useMemo(() => recommendSites(9999, { minMw: Math.max(1, Math.ceil(mw)), nonCapitalOnly: true }).length, [mw])

  let verdict
  if (!nonCapital) {
    verdict = en
      ? { tone: 'bad', head: 'Capital region — not exempt', body: 'Capital-region sites are not eligible for the special-act exemption and are penalized in the PSIA. Switching to a non-capital site opens the exemption track.' }
      : { tone: 'bad', head: '수도권 — 면제 비대상', body: '수도권 입지는 특별법 면제 대상이 아니며 전력계통영향평가에서 억제(감점) 적용. 비수도권 전환 시 면제 트랙이 열립니다.' }
  } else if (!psiaTarget) {
    verdict = en
      ? { tone: 'good', head: 'Below 10MW — not assessed', body: 'Not subject to the PSIA (≥10MW) at all — a stage before any exemption discussion.' }
      : { tone: 'good', head: '10MW 미만 — 평가 비대상', body: '전력계통영향평가 대상(10MW 이상) 자체가 아닙니다. 면제 논의 이전 단계.' }
  } else if (exemptEligible) {
    verdict = en
      ? { tone: 'good', head: 'Exemption possible (within assumed cap)', body: `Non-capital + ${round}MW ≤ assumed cap ${cap}MW → PSIA exemption track from Mar 2027. Review lead time and uncertainty drop sharply here.` }
      : { tone: 'good', head: '면제 가능 (가정 상한 이내)', body: `비수도권 + 계약전력 ${round}MW ≤ 가정 상한 ${cap}MW → 2027.3~ 전력계통영향평가 면제 트랙. 심의 리드타임·불확실성이 크게 줄어드는 구간.` }
  } else {
    verdict = en
      ? { tone: 'warn', head: 'Over cap — excluded (assumed)', body: `${round}MW > assumed cap ${cap}MW → gets the non-capital credit but is excluded from the exemption in this scenario. The cap must be set at ${round}MW or above to qualify.` }
      : { tone: 'warn', head: '상한 초과 — 면제 제외(가정)', body: `계약전력 ${round}MW > 가정 상한 ${cap}MW → 비수도권 가점은 받되 면제에서는 제외되는 시나리오. 상한이 ${round}MW 이상으로 정해져야 면제 대상.` }
  }

  return (
    <div className="calc-card aidc-card">
      <div className="econ-head" style={{ marginTop: 0 }}>
        <span className="chart-title" style={{ margin: 0 }}>
          {en ? 'AIDC special-act exemption scenario' : 'AIDC 특별법 면제 시나리오'} — {round}MW · {nonCapital ? (en ? 'non-capital' : '비수도권') : (en ? 'capital' : '수도권')}
        </span>
        <span className="econ-flag">{en ? 'Decree pending · assumed scenario' : '대통령령 미정 · 가정 시나리오'}</span>
      </div>
      <p className="chart-note" style={{ marginTop: 2 }}>
        {en ? (
          <>Non-capital AIDCs are exempt from the <Term k="전력계통영향평가">PSIA</Term> from Mar 2027, but the exemption’s <b>capacity cap is delegated to a presidential decree (not yet enacted)</b>. Adjust the cap below to see whether this capacity/location is exempt and how many non-capital candidates open up.</>
        ) : (
          <>비수도권 AIDC는 2027.3~ <Term k="전력계통영향평가">전력계통영향평가</Term> 면제 대상이나, 면제 <b>용량 상한은 대통령령(미제정)</b>에 위임돼 있습니다. 아래 상한을 조정해 이 용량·입지가 면제되는지, 비수도권 후보가 얼마나 열리는지 시나리오로 확인하세요.</>
        )}
      </p>

      <div className="aidc-cap-row">
        <label className="lbl-cap" htmlFor="aidc-cap">{en ? 'Assumed exemption cap' : '가정 면제 상한'} <b className="aidc-cap-val">{cap}MW</b></label>
        <input id="aidc-cap" className="aidc-slider" type="range" min="10" max="400" step="10" value={cap} onChange={(e) => setCap(Number(e.target.value))} />
        <div className="aidc-quick">
          {[40, 100, 200, 400].map((v) => (
            <button key={v} type="button" className={`chip ${cap === v ? 'on' : ''}`} onClick={() => setCap(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className={`aidc-verdict tone-${verdict.tone}`}>
        <span className="aidc-verdict-head">{verdict.head}</span>
        <span className="aidc-verdict-body">{verdict.body}</span>
      </div>

      <div className="spec-grid" style={{ marginTop: 10 }}>
        <div className="spec-cell">
          <div className="k">{en ? 'PSIA' : '전력계통영향평가'}</div>
          <div className="v">{psiaTarget ? (en ? 'Applies (10MW+)' : '대상 (10MW+)') : (en ? 'N/A (<10MW)' : '비대상 (10MW 미만)')}</div>
        </div>
        <div className="spec-cell">
          <div className="k">{en ? 'Exempt in this scenario' : '이 시나리오 면제 여부'}</div>
          <div className="v">{exemptEligible ? (en ? 'Possible (Mar 2027–)' : '면제 가능 (2027.3~)') : overCap ? (en ? 'Over cap — excluded' : '상한 초과 — 제외') : (en ? 'Not non-capital — excluded' : '비수도권 아님 — 제외')}</div>
        </div>
        <div className="spec-cell">
          <div className="k">{en ? 'Non-capital sites for this capacity' : '이 용량 수용 비수도권 후보'}</div>
          <div className="v">
            {nonCapCandidates.toLocaleString()}{en ? '' : '곳'}
            <span className="muted" style={{ marginLeft: 6, fontSize: '0.85em' }}>{en ? `headroom ≥ ${round}MW · industrial parks` : `계통 여유 ≥ ${round}MW · 산단 기준`}</span>
          </div>
        </div>
        <div className="spec-cell">
          <div className="k">{en ? 'Expected effect if exempt' : '면제 시 기대 효과'}</div>
          <div className="v">{exemptEligible ? (en ? 'Review lead time·uncertainty ↓' : '심의 리드타임·불확실성↓') : (en ? 'N/A (current scenario)' : '해당 없음(현 시나리오)')}</div>
        </div>
      </div>

      <p className="chart-note">
        {en ? (
          <>⚠ The exemption cap is <b>not final (decree not enacted)</b> — the verdict above is an <b>estimate</b> from an assumed value and will auto-update once fixed. Basis: AIDC special act (promulgated Jun 9 ’26 · effective Mar 10 ’27) · Distributed Energy Act PSIA.{' '}
          <Link to="/roadmap?view=policy">Decree progress (policy tracker) →</Link>{' '}
          <Link to={`/?min_mw=${Math.max(1, Math.ceil(mw))}&noncap=1`}>Non-capital candidate map →</Link></>
        ) : (
          <>⚠ 면제 상한은 <b>대통령령 미제정</b>으로 확정 전입니다 — 위 판정은 가정값 기반 <b>추정</b>이며 확정 시 자동 반영 예정. 근거: AIDC 특별법(’26.6.9 공포·’27.3.10 시행) · 분산에너지 활성화 특별법 전력계통영향평가.{' '}
          <Link to="/roadmap?view=policy">시행령 진행 상황 (제도 트래커) →</Link>{' '}
          <Link to={`/?min_mw=${Math.max(1, Math.ceil(mw))}&noncap=1`}>비수도권 후보 맵 →</Link></>
        )}
      </p>
    </div>
  )
}
