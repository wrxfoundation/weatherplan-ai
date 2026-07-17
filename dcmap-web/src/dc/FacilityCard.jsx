import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUS_LABEL, GEOCODE_LABEL, slugOf } from '../data/facilities.js'
import { landPriceFor, fmtRate } from '../data/landPrice.js'
import { revgeoFor } from '../data/liveApi.js'
import { blurbFor } from '../content/facilityBlurbs.js'
import { useMapLang } from '../i18n/mapLang.js'
import LineIcon from '../components/LineIcon.jsx'

// EN 게이팅 사전 — 상태·유형·좌표기준·출처유형은 통제 어휘라 dict로 매핑(데이터값은 KO 유지).
const STATUS_EN = { operating: 'Operating', construction: 'Construction', planned: 'Planned', delayed: 'Delayed', cancelled: 'Cancelled' }
const TYPE_EN = { 코로케이션: 'Colocation', 클라우드: 'Cloud', 'AI 특화': 'AI-specialized', 엔터프라이즈: 'Enterprise', 금융: 'Finance' }
const GEOCODE_EN = {
  road: 'Road-name address (verified)',
  parcel: 'Parcel (operator public address)',
  sigungu: 'Sigungu centroid',
  sido: 'Sido centroid',
}
const SOURCE_TYPE_EN = { 언론보도: 'Press report', '사업자 공식': 'Operator official', '정부 공고': 'Government notice' }

export default function FacilityCard({ facility: f, compact = false }) {
  const en = useMapLang() === 'en'
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
  const statusLabel = en ? STATUS_EN[f.status] ?? STATUS_LABEL[f.status] ?? f.status : STATUS_LABEL[f.status] ?? f.status
  const typeLabel = en ? TYPE_EN[f.type] ?? f.type : f.type
  const geocodeLabel = en ? GEOCODE_EN[f.geocode_level] ?? GEOCODE_LABEL[f.geocode_level] : GEOCODE_LABEL[f.geocode_level]
  const sourceType = en ? SOURCE_TYPE_EN[f.source_type] ?? f.source_type : f.source_type
  return (
    <article className="facility-card">
      <div className="status-line">
        <span className={`badge status-${f.status}`}>{statusLabel}</span>
        <span className="badge">{typeLabel}</span>
        {f.needs_verify && <span className="badge verify">{en ? 'Needs verification' : '검증 필요'}</span>}
      </div>

      <h3>{f.name}</h3>
      {f.name_en && <div className="name-en">{f.name_en}</div>}

      {(() => {
        const b = blurbFor(f, en)
        return (
          <div className={`fac-blurb${b.curated ? ' curated' : ''}`}>
            <span className="fac-blurb-tag">{b.curated ? (en ? 'Editor’s note' : '코멘트') : en ? 'Summary' : '요약'}</span>
            <p>{b.text}</p>
          </div>
        )
      })()}

      <div className="spec-grid">
        <div className="spec-cell">
          <div className="k">{en ? 'Operator' : '운영사'}</div>
          <div className="v">{f.operator ?? (en ? 'Undisclosed' : '미공개')}</div>
        </div>
        <div className="spec-cell">
          <div className="k">{en ? 'Public capacity' : '공개 전력 규모'}</div>
          <div className="v">{f.power_mw_public != null ? `${f.power_mw_public} MW` : en ? 'Undisclosed' : '비공개'}</div>
        </div>
        <div className="spec-cell">
          <div className="k">
            {f.status === 'operating' ? (en ? 'Year online' : '가동 연도') : en ? 'Target year' : '목표 연도'}
          </div>
          <div className="v">{f.year ?? (en ? 'Unknown' : '미상')}</div>
        </div>
        <div className="spec-cell">
          <div className="k">{en ? 'Location' : '위치'}</div>
          <div className="v">
            {f.sido}
            {f.sigungu ? ` ${f.sigungu}` : ''}
          </div>
        </div>
        <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
          <div className="k">{en ? 'Address (parcel · vworld reverse geocoding)' : '주소 (지번 · vworld 리버스 지오코딩)'}</div>
          <div className="v">
            {dongAddr ? (
              dongAddr
            ) : f.address_public ? (
              f.address_public
            ) : compact ? (
              `${f.sido}${f.sigungu ? ' ' + f.sigungu : ''}`
            ) : (
              <span className="badge verify">
                {en
                  ? 'Awaiting dong-level address — auto-shown once vworld env is set'
                  : '동단위 주소 연동 대기 — vworld env 설정 시 자동 표시'}
              </span>
            )}
          </div>
        </div>
        {(() => {
          const lp = landPriceFor(f)
          return lp ? (
            <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
              <div className="k">
                {en
                  ? `Land-price change · ${lp.scope} (${lp.period} monthly, KOSIS)`
                  : `지가변동률 · ${lp.scope} (${lp.period} 월간, KOSIS)`}
              </div>
              <div className="v">{fmtRate(lp.value)}</div>
            </div>
          ) : null
        })()}
      </div>

      <div className="source">
        {en ? 'Source: ' : '출처: '}
        {sourceType}
        {f.source_url && (
          <>
            {' · '}
            <a href={f.source_url} target="_blank" rel="noreferrer">
              {en ? 'Original' : '원문'}
            </a>
          </>
        )}
        {f.updated_at && <> · {en ? 'Updated' : '갱신'} {f.updated_at}</>}
        <br />
        <span className="geo-note">{en ? 'Coordinate basis: ' : '좌표 기준: '}{geocodeLabel}</span>
      </div>

      {!compact && (
        <div className="card-actions">
          <Link className="btn primary" to={`/dc/${slugOf(f)}`}>
            {en ? 'Facility details' : '시설 상세'} <span className="btn-arrow"><LineIcon name="arrowUR" size={13} /></span>
          </Link>
        </div>
      )}
    </article>
  )
}
