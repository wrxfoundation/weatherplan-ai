import { Link } from 'react-router-dom'
import { slugOf } from '../data/yokai.js'
import { CategoryBadge, RarityBadge, VerificationBadge } from './Badges.jsx'

export default function YokaiCard({ entry }) {
  return (
    <Link className="card" to={`/yokai/${slugOf(entry)}`}>
      <div className="row" style={{ gap: 6, marginBottom: 6 }}>
        <CategoryBadge id={entry.category} />
        <RarityBadge id={entry.rarity} />
      </div>
      <h3>{entry.canonical}</h3>
      {entry.aliases.length > 0 && (
        <p className="small muted" style={{ marginBottom: 4 }}>
          {entry.aliases.slice(0, 3).join(' · ')}
        </p>
      )}
      <p>{entry.summary}</p>
      <div className="row" style={{ gap: 6, marginTop: 8 }}>
        <VerificationBadge id={entry.verification} confidence={entry.confidence} />
        {entry.sites.length > 0 && <span className="small muted">전승지 {entry.sites.length}곳</span>}
      </div>
    </Link>
  )
}
