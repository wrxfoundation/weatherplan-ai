import { Link } from 'react-router-dom'
import { slugOf, CAT } from '../data/yokai.js'
import Seal from './Seal.jsx'
import ArtPlate from './ArtPlate.jsx'
import { RarityBadge, VerificationBadge } from './Badges.jsx'

export default function YokaiCard({ entry, compact = false, onZoom }) {
  return (
    <Link className="card" to={`/yokai/${slugOf(entry)}`} style={{ '--cat': CAT[entry.category]?.color }}>
      {/* 도판이 없어도 자리를 비우지 않는다. 인장 폴백이 들어가야 격자 높이가 고르다
          — 도상은 순차적으로 채워지는 자산이라 '아직 없음'이 정상 상태다. */}
      <div style={{ marginBottom: 'var(--sp-3)' }}>
        <ArtPlate entry={entry} size="sm" onZoom={onZoom} />
      </div>
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
