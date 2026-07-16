import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES } from '../data/facilities.js'
import { GRID_HEADROOM, GRID_HEADROOM_META } from '../data/gridHeadroom.js'
import { INSIGHTS } from '../content/insights_meta.js'
import { SNAPSHOT_COUNT, LATEST_SNAPSHOT } from '../data/headroomSnapshots.js'
import { CONTACT_EMAIL } from '../data/leadApi.js'

const TITLE = 'AI InfraMap — Korea AI Datacenter Site Intelligence (for partners & investors)'
const DESC =
  'The Korea AI-datacenter siting market is opaque from the outside. AI InfraMap turns Korean public grid, permitting and facility data into instant site feasibility — grid-impact pass outlook, substation headroom, 22.9/154/345kV track, permitting lead time. Partnership, data licensing and strategic conversations.'

/* 글로벌 파트너/인수자용 EN 원페이저 — 영문 버전의 첫 표면(seed). 정직성: 수치는 공개 데이터 기반, 앱과 동일 소스.
 * 데이터 자산화(자동 갱신 파이프라인) 스토리를 'Why this is an asset' 섹션에 포함. */
const MOATS = [
  {
    n: '01',
    h: 'Grid-impact pass model',
    p: 'A weighted scorecard for Korea’s new Power System Impact Assessment (PSIA) — capital-region penalty, grid headroom, substation reserve, regional approval rate, required capacity. Synthesised from public data into a probabilistic pass outlook, not a raw table.',
  },
  {
    n: '02',
    h: 'Curated grid + facility dataset',
    p: `${FACILITIES.length} verified datacenters (operating/under-construction/planned) hand-geocoded to parcel level, plus 154kV+ substation reserve (live KEPCO ON readings), regional grid headroom, and transaction/conflict records — the layers a foreign entrant cannot assemble from Korean-only sources.`,
  },
  {
    n: '03',
    h: 'Analyst-grade insight library',
    p: `${INSIGHTS.length}+ deeply sourced briefs cross-referencing CBRE, PwC, R.square and primary Korean filings — the SEO/brand surface that ranks for Korea DC power & siting queries and turns into inbound.`,
  },
  {
    n: '04',
    h: 'Honesty as a trust asset',
    p: 'Nothing is fabricated. Axes without evidence are shown as “data pending”, every figure carries a source and date, and location precision is stated when low. That discipline is what makes the output defensible in an underwriting context.',
  },
]

export default function GlobalPage() {
  useEffect(() => {
    document.title = TITLE
    const el = document.head.querySelector('meta[name="description"]')
    if (el) el.setAttribute('content', DESC)
  }, [])

  const headroomGw = (
    Object.values(GRID_HEADROOM).reduce((s, v) => s + (typeof v === 'number' ? v : v?.mw || 0), 0) / 1000
  ).toFixed(1)

  return (
    <>
      <TopBar />
      <main className="page global-page">
        <div className="global-lang">
          <span className="glang-on">EN</span>
          <Link to="/about">한국어 소개 →</Link>
        </div>

        <header className="global-hero">
          <div className="eyebrow">FOR PARTNERS · INVESTORS · ACQUIRERS</div>
          <h1>
            Korea’s AI-datacenter market is <em>invisible from the outside.</em> We make it legible.
          </h1>
          <p className="global-lede">
            Hyperscalers and global capital are entering Korea — one of APAC’s hottest AI-DC markets — yet the siting
            layer is opaque: Korean-language public data, a brand-new grid-impact regime, and jurisdiction ≠ location
            confusion. <b>AI InfraMap</b> turns that public data into instant site feasibility: grid-impact pass
            outlook, substation headroom, 22.9/154/345kV track, and permitting lead time — for any point on the map.
          </p>
          <div className="global-stats">
            <div className="gstat"><b>1.9%</b><span>Capital-region PSIA final approval rate — the barrier global entrants can’t see</span></div>
            <div className="gstat"><b>{FACILITIES.length}</b><span>Verified DC facilities, parcel-level geocoded</span></div>
            <div className="gstat"><b>{headroomGw}<small>GW</small></b><span>National grid headroom mapped (KEPCO {GRID_HEADROOM_META.year})</span></div>
            <div className="gstat"><b>{INSIGHTS.length}+</b><span>Sourced research briefs</span></div>
          </div>
        </header>

        <section className="global-sec">
          <div className="eyebrow">WHY KOREA IS OPAQUE FROM OUTSIDE</div>
          <h2>The exact pain a global entrant has</h2>
          <ul className="global-pain">
            <li><b>Korean-only public data.</b> Grid (KEPCO), power exchange (EPSIS), cadastral (vworld), law (law.go.kr) — none consolidated, none in English.</li>
            <li><b>A brand-new regime.</b> The Power System Impact Assessment (2026 pilot) rejects most capital-region demand — but the rules, thresholds and outcomes are hard to read from abroad.</li>
            <li><b>Jurisdiction ≠ location.</b> A substation’s operating office is not where it sits; text-guessing coordinates is wrong. We match to real OSM coordinates.</li>
          </ul>
          <p className="global-note">
            The domestic players already see Korea. The marginal value of this intelligence is highest for those
            entering from outside — which is why global willingness to partner is structurally higher.
          </p>
        </section>

        <section className="global-sec">
          <div className="eyebrow">THE ASSET</div>
          <h2>Four moats — none of them the public data itself</h2>
          <div className="moat-grid">
            {MOATS.map((m) => (
              <article key={m.n} className="moat-card">
                <span className="moat-n">{m.n}</span>
                <h3>{m.h}</h3>
                <p>{m.p}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="global-sec">
          <div className="eyebrow">WHY THIS IS AN ASSET, NOT A SCREEN</div>
          <h2>An automated Korea DC data pipeline</h2>
          <p className="global-sub">
            What a data-vendor acquires is a self-updating dataset + refresh pipeline (and, ideally, revenue) — not a
            UI. Our roadmap hardens exactly that:
          </p>
          <ol className="global-pipeline">
            <li>
              <b>Live grid ingestion.</b> KEPCO ON substation reserve + PSIA outcomes on a scheduled refresh, versioned — so the dataset is current without manual curation.
              {LATEST_SNAPSHOT && (
                <span className="pipe-status"> · in progress: {SNAPSHOT_COUNT} monthly snapshot{SNAPSHOT_COUNT > 1 ? 's' : ''}, latest {LATEST_SNAPSHOT.month}</span>
              )}
            </li>
            <li><b>Calibrated pass model.</b> The grid-impact outlook is back-tested against real assessment results and reported with accuracy — turning a heuristic into a defensible, licensable score.</li>
            <li><b>Change feed.</b> New applications, supply pipeline and approvals as a diff stream — the recurring signal a platform or fund subscribes to.</li>
            <li><b>English + API layer.</b> Bilingual surface and a data/score API so the asset plugs into an acquirer’s existing product.</li>
          </ol>
        </section>

        <section className="global-sec">
          <div className="eyebrow">WHO THIS IS FOR</div>
          <h2>Where this plugs in</h2>
          <div className="fit-grid">
            <div className="fit-card"><b>DC intelligence platforms</b><span>Fill the Korea coverage gap in a global supply/pipeline product.</span></div>
            <div className="fit-card"><b>Real-estate advisory</b><span>A proprietary Korea grid/permitting layer to differentiate DC advisory.</span></div>
            <div className="fit-card"><b>Operators &amp; REITs</b><span>Site-pipeline and headroom intelligence for entry and expansion.</span></div>
            <div className="fit-card"><b>Infrastructure funds</b><span>Deal-sourcing and diligence on grid-constrained, pre-leased assets.</span></div>
          </div>
        </section>

        <section className="global-cta">
          <h2>Talk to us</h2>
          <p>Data licensing / API, white-label, partnership, or strategic conversations — Korea AI-DC site intelligence.</p>
          <div className="global-cta-row">
            <Link className="btn primary" to="/pricing?type=%EB%A7%A4%EA%B0%81%C2%B7%ED%88%AC%EC%9E%90%20%EB%AC%B8%EC%9D%98">Partnership &amp; data inquiry</Link>
            <a className="btn" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <Link className="btn" to="/report-sample">Sample site report</Link>
          </div>
          <p className="global-fine">
            AI InfraMap aggregates public data (KEPCO, EPSIS, KOSIS, SGIS, vworld, KMA, law.go.kr, DART, OSM). Figures
            are illustrative of methodology; a real assessment is delivered per site.
          </p>
        </section>
      </main>
    </>
  )
}
