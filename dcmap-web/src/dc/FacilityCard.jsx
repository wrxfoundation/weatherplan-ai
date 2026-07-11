import { Link } from 'react-router-dom'
import { STATUS_LABEL, GEOCODE_LABEL, slugOf } from '../data/facilities.js'
import { landPriceFor, fmtRate } from '../data/landPrice.js'

export default function FacilityCard({ facility: f, compact = false }) {
  return (
    <article className="facility-card">
      <div className="status-line">
        <span className={`badge status-${f.status}`}>
          <span className={`dot ${f.status === 'delayed' ? 'planned' : f.status}`} />
          {STATUS_LABEL[f.status] ?? f.status}
        </span>
        <span className="badge">{f.type}</span>
        {f.needs_verify && <span className="badge verify">검증 필요</span>}
      </div>

      <h3>{f.name}</h3>
      {f.name_en && <div className="name-en">{f.name_en}</div>}

      <div className="spec-grid">
        <div className="spec-cell">
          <div className="k">운영사</div>
          <div className="v">{f.operator ?? '미공개'}</div>
        </div>
        <div className="spec-cell">
          <div className="k">공개 전력 규모</div>
          <div className="v">{f.power_mw_public != null ? `${f.power_mw_public} MW` : '비공개'}</div>
        </div>
        <div className="spec-cell">
          <div className="k">{f.status === 'operating' ? '가동 연도' : '목표 연도'}</div>
          <div className="v">{f.year ?? '미상'}</div>
        </div>
        <div className="spec-cell">
          <div className="k">위치</div>
          <div className="v">
            {f.sido}
            {f.sigungu ? ` ${f.sigungu}` : ''}
          </div>
        </div>
        {f.address_public && (
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">공개 주소</div>
            <div className="v">{f.address_public}</div>
          </div>
        )}
        {(() => {
          const lp = landPriceFor(f)
          return lp ? (
            <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
              <div className="k">
                지가변동률 · {lp.scope} ({lp.period} 월간, KOSIS)
              </div>
              <div className="v">{fmtRate(lp.value)}</div>
            </div>
          ) : null
        })()}
      </div>

      {f.note && <p className="note">{f.note}</p>}

      <div className="source">
        출처: {f.source_type}
        {f.source_url && (
          <>
            {' · '}
            <a href={f.source_url} target="_blank" rel="noreferrer">
              원문
            </a>
          </>
        )}
        <br />
        <span className="geo-note">좌표 기준: {GEOCODE_LABEL[f.geocode_level]}</span>
      </div>

      {!compact && (
        <div className="card-actions">
          <Link className="btn primary" to={`/dc/${slugOf(f)}`}>
            시설 상세 <span className="btn-arrow">↗</span>
          </Link>
        </div>
      )}
    </article>
  )
}
