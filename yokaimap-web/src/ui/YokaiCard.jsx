import { Link } from 'react-router-dom'
import { slugOf, CAT } from '../data/yokai.js'
import Seal from './Seal.jsx'
import { RarityBadge, VerificationBadge } from './Badges.jsx'

export default function YokaiCard({ entry, compact = false }) {
  return (
    <Link className="card" to={`/yokai/${slugOf(entry)}`} style={{ '--cat': CAT[entry.category]?.color }}>
      <div className="card-head">
        <Seal category={entry.category} />
        <div style={{ minWidth: 0 }}>
          <h3>{entry.canonical}</h3>
          {entry.aliases.length > 0 && (
            <div className="small muted" style={{ lineHeight: 1.4 }}>
              {entry.aliases.slice(0, 3).join(' · ')}
            </div>
          )}
        </div>
      </div>
      {!compact && <p>{entry.summary}</p>}
      <div className="row" style={{ gap: 5, marginTop: 'var(--sp-3)' }}>
        <RarityBadge id={entry.rarity} />
        <VerificationBadge id={entry.verification} confidence={entry.confidence} />
        {entry.sites.length > 0 && <span className="small muted num">전승지 {entry.sites.length}</span>}
      </div>
    </Link>
  )
}
