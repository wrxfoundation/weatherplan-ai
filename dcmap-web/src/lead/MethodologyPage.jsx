import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { DATA_DICTIONARY } from '../data/dataCoverage.js'

const TITLE = 'Methodology — AI InfraMap Korea DC Site Intelligence'
const DESC =
  'How AI InfraMap scores Korean AI-datacenter sites: the PSIA pass-outlook scorecard (5 public proxies), the 5-axis site score, data sources & cadence, honesty policy, limitations and calibration roadmap. A due-diligence reference.'

/* 방법론 백서(EN, DD 자료) — 통과 전망 모델·5축 스코어·소스·정직성·한계. print→PDF 친화. */
const PSIA_FACTORS = [
  { f: 'Capital-region penalty', w: 'gate', src: 'AIDC special act / capital-suppression scoring', why: 'Capital-region demand is structurally throttled; non-capital gets an exemption track.' },
  { f: 'Regional grid headroom', w: 'high', src: 'KEPCO connectable capacity (provincial)', why: 'Whether the province has spare grid to absorb the load at all.' },
  { f: 'Nearest-substation reserve', w: 'high', src: 'KEPCO ON substation search (measured MW)', why: 'The physical intake point’s spare capacity for the requested year.' },
  { f: 'Regional approval rate', w: 'medium', src: 'PSIA outcomes by region (public disclosure)', why: 'Empirical pass base rate for the region (capital ~1.9% vs non-capital ~89.7%).' },
  { f: 'Required capacity vs track', w: 'medium', src: 'KEPCO tariff §23 (10/40MW thresholds)', why: '>10MW triggers PSIA; >40MW mandates 154kV — sets the intake track.' },
]
const AXES = [
  { a: 'Power (grid & intake)', w: '40', note: 'Grid headroom, substation reserve, voltage track, self-generation.' },
  { a: 'Land / site', w: '25', note: 'Zoning, land use, parcel, industrial-park incentives (vworld).' },
  { a: 'Risk (population & conflict)', w: '15', note: 'Population grid exposure within radius, development-conflict record.' },
  { a: 'Network', w: '10', note: 'Backbone distance, landing-edge proximity.' },
  { a: 'Climate (cooling)', w: '10', note: 'Annual temperature, free-cooling days, water.' },
]

export default function MethodologyPage() {
  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  return (
    <>
      <TopBar />
      <main className="page method-page">
        <div className="global-lang">
          <span className="glang-on">EN</span>
          <Link to="/global">Data room →</Link>
          <button type="button" className="rlang-btn" onClick={() => window.print()}>Print / PDF</button>
        </div>

        <header className="method-head">
          <div className="eyebrow">METHODOLOGY · DUE-DILIGENCE REFERENCE</div>
          <h1>How AI InfraMap scores a Korean datacenter site</h1>
          <p className="global-lede">
            This document is the reference for how the platform turns public Korean data into a site verdict. It is
            written for evaluation (partnership, data licensing, acquisition). Two engines run: a <b>PSIA pass
            outlook</b> (grid-permit probability) and a <b>5-axis site score</b> (overall fit). Both are probabilistic
            and explicitly <b>not</b> the official government scoring.
          </p>
        </header>

        <section className="method-sec">
          <h2>1 · PSIA pass-outlook scorecard</h2>
          <p className="global-sub">
            The Power System Impact Assessment (2026 pilot) is the binding gate for ≥10MW demand. We estimate a pass
            probability from five public proxies. The output is a weighted composite with an explicit coverage figure —
            missing inputs lower coverage rather than being back-filled.
          </p>
          <div className="data-dict-wrap">
            <table className="data-dict">
              <thead><tr><th>Factor</th><th>Weight</th><th>Source</th><th>Rationale</th></tr></thead>
              <tbody>
                {PSIA_FACTORS.map((f) => (
                  <tr key={f.f}><td><b>{f.f}</b></td><td>{f.w}</td><td>{f.src}</td><td>{f.why}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="method-sec">
          <h2>2 · 5-axis site score</h2>
          <p className="global-sub">
            Beyond the permit gate, overall site fit is scored on five axes (max 100). Only axes with evidence are
            scored; others are shown as “data pending” with the coverage stated.
          </p>
          <div className="data-dict-wrap">
            <table className="data-dict">
              <thead><tr><th>Axis</th><th>Max</th><th>Inputs</th></tr></thead>
              <tbody>
                {AXES.map((a) => (
                  <tr key={a.a}><td><b>{a.a}</b></td><td>{a.w}</td><td>{a.note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="method-sec">
          <h2>3 · Data sources &amp; cadence</h2>
          <div className="data-dict-wrap">
            <table className="data-dict">
              <thead><tr><th>Dataset</th><th>Source</th><th>Cadence</th><th>Coverage</th></tr></thead>
              <tbody>
                {DATA_DICTIONARY.map((d) => (
                  <tr key={d.name}><td><b>{d.name}</b></td><td>{d.source}</td><td>{d.cadence}</td><td>{d.coverage}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="method-sec">
          <h2>4 · Honesty policy</h2>
          <ul className="global-pain">
            <li><b>No fabricated values.</b> Axes without evidence are “data pending”; the composite reports coverage, never a guessed total.</li>
            <li><b>Sourced & dated.</b> Every figure carries a source and date; location precision is stated when low.</li>
            <li><b>Real coordinates.</b> Substations are matched to OSM coordinates — operating jurisdiction ≠ physical location, so text-guessing is avoided.</li>
            <li><b>Statute only when retrieved.</b> AI briefs cite law only when the primary text (law.go.kr) was fetched, with the source link.</li>
          </ul>
        </section>

        <section className="method-sec">
          <h2>5 · Limitations &amp; calibration roadmap</h2>
          <p className="global-sub">
            The pass outlook uses public proxies, not the official rubric, and PSIA is a young regime with limited
            samples. The roadmap (see data-asset plan) hardens this:
          </p>
          <ol className="global-pipeline">
            <li><b>Back-test.</b> Calibrate the pass outlook against actual assessment results; publish precision/recall.</li>
            <li><b>Version the grid feed.</b> Monthly substation-reserve snapshots (P1) give a time series and a change feed.</li>
            <li><b>License the score.</b> Once accuracy is reported, the outlook becomes a defensible, licensable signal.</li>
          </ol>
          <p className="global-fine">
            AI InfraMap aggregates public data (KEPCO, EPSIS, KOSIS, SGIS, vworld, KMA, law.go.kr, DART, OSM). This
            methodology reference describes formats and rationale; a real assessment is delivered per site.{' '}
            <Link to="/report-sample">See a sample report →</Link>
          </p>
        </section>
      </main>
    </>
  )
}
