import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUS_LABEL, GEOCODE_LABEL, slugOf } from '../data/facilities.js'
import { landPriceFor, fmtRate } from '../data/landPrice.js'
import { revgeoFor } from '../data/liveApi.js'
import { blurbFor } from '../content/facilityBlurbs.js'

export default function FacilityCard({ facility: f, compact = false }) {
  // vworld 리버스 지오코딩 — 좌표 기준 지번(동단위) 주소. env 연동 시 표시(미연동 시 null → 공개주소/시군구 폴백)
  const [addr, setAddr] = useState(null)
  useEffect(() => {
    setAddr(null)
    if (compact || f.lat == null || f.lng == null) return
    let alive = true
    revgeoFor(f.lat, f.lng).then((v) => alive && setAddr(v))
    return () => {
      alive = false
    }
  }, [f.id, f.lat, f.lng, compact])
  const dongAddr = addr?.parcel || addr?.road || null
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

      {(() => {
        const b = blurbFor(f)
        return (
          <div className={`fac-blurb${b.curated ? ' curated' : ''}`}>
            <span className="fac-blurb-tag">{b.curated ? '코멘트' : '요약'}</span>
            <p>{b.text}</p>
          </div>
        )
      })()}

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
        <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
          <div className="k">주소 (지번 · vworld 리버스 지오코딩)</div>
          <div className="v">
            {dongAddr ? (
              dongAddr
            ) : f.address_public ? (
              f.address_public
            ) : compact ? (
              `${f.sido}${f.sigungu ? ' ' + f.sigungu : ''}`
            ) : (
              <span className="badge verify">동단위 주소 연동 대기 — vworld env 설정 시 자동 표시</span>
            )}
          </div>
        </div>
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
