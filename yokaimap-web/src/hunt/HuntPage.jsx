import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { YOKAI, CAT } from '../data/yokai.js'
import { slugOf } from '../seo.js'
import { timeBucket, seasonOf, TIME_LABEL, SEASON_LABEL } from '../engine/omen.js'
import { regionAt, encountersFor, needsFaithNotice, REGION_RADIUS_KM } from '../engine/hunt.js'
import { readCollection, collect, clearCollection } from './collection.js'
import ArtPlate from '../ui/ArtPlate.jsx'
import Icon from '../ui/Icon.jsx'

/* 위치 상태 — 각 상태를 화면에 그대로 드러낸다. 권한을 못 받았는데 조용히
   아무 지역이나 보여 주면 그건 사용자를 속이는 것이다. */
const GEO = { idle: 'idle', asking: 'asking', ok: 'ok', denied: 'denied', unsupported: 'unsupported', failed: 'failed' }

export default function HuntPage() {
  const [geo, setGeo] = useState(GEO.idle)
  const [pos, setPos] = useState(null)
  const [caught, setCaught] = useState(readCollection)
  const [now] = useState(() => new Date())

  const ask = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return setGeo(GEO.unsupported)
    setGeo(GEO.asking)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude })
        setGeo(GEO.ok)
      },
      (err) => setGeo(err.code === err.PERMISSION_DENIED ? GEO.denied : GEO.failed),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  }, [])

  useEffect(() => {
    document.title = '요괴 탐사 — 한국요괴지도'
  }, [])

  const ctx = useMemo(
    () => ({ now, hour: now.getHours(), month: now.getMonth() + 1, weather: null }),
    [now],
  )
  const region = useMemo(() => (pos ? regionAt(YOKAI, pos) : null), [pos])
  const encounters = useMemo(
    () => (geo === GEO.ok ? encountersFor(YOKAI, region, ctx) : []),
    [geo, region, ctx],
  )

  const caughtCount = Object.keys(caught).length

  function onCatch(entry) {
    const { map, added, saved } = collect(entry.id, {
      sigungu: region?.nearest?.site?.sigungu ?? null,
      time: timeBucket(ctx.hour),
    })
    setCaught({ ...map })
    if (added && saved === false) {
      // 저장이 막힌 브라우저 — 화면에는 잡힌 것처럼 두되 사실을 알린다
      alert('이 브라우저에서는 기록을 저장할 수 없습니다(사생활 보호 모드일 수 있습니다). 새로고침하면 사라집니다.')
    }
  }

  return (
    <main className="page page-narrow">
      <p className="eyebrow">위치 기반 탐사 · 시범</p>
      <h1 style={{ margin: '4px 0 var(--sp-3)' }}>지금 이 권역의 요괴</h1>
      <p className="body-text">
        전승지가 기록된 <strong>시군구 권역</strong>과 지금의 시간·계절로 오늘 나타날 요괴를 정합니다.
        같은 권역·같은 시간대라면 누구에게나 같은 결과가 나옵니다.
      </p>

      <div className="notice accent" style={{ marginTop: 'var(--sp-4)' }}>
        <strong>정확한 지점으로 안내하지 않습니다.</strong> 판정은 시군구 권역 단위이며, 실존 신당·사유지·
        폐가 방문을 권유하지 않습니다. 전승지 좌표는 권역 중심점이거나 읍면동 수준입니다.
      </div>

      <div className="panel" style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-4)' }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <strong>수집</strong>{' '}
            <span className="num">
              {caughtCount} / {YOKAI.length}
            </span>
            <Link to="/collection" className="small" style={{ marginLeft: 'var(--sp-2)' }}>
              수집첩 보기 →
            </Link>
          </div>
          {caughtCount > 0 && (
            <button
              type="button"
              className="chip"
              onClick={() => {
                if (confirm('수집 기록을 모두 지웁니다. 되돌릴 수 없습니다.')) {
                  clearCollection()
                  setCaught({})
                }
              }}
            >
              기록 지우기
            </button>
          )}
        </div>
        <div className="progress" style={{ marginTop: 'var(--sp-2)' }}>
          <span style={{ width: `${(caughtCount / YOKAI.length) * 100}%` }} />
        </div>
        <p className="small muted" style={{ marginTop: 'var(--sp-2)' }}>
          기록은 이 브라우저에만 저장됩니다. 기기를 옮기거나 저장소를 지우면 사라집니다.
        </p>
      </div>

      {geo !== GEO.ok && (
        <div className="panel" style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-5)', textAlign: 'center' }}>
          {geo === GEO.idle && (
            <>
              <p className="body-text">탐사를 시작하려면 위치 권한이 필요합니다.</p>
              <button type="button" className="btn primary" onClick={ask}>
                <Icon name="pin" size={16} /> 내 권역 확인
              </button>
            </>
          )}
          {geo === GEO.asking && <p className="body-text">위치를 확인하는 중…</p>}
          {geo === GEO.denied && (
            <p className="body-text">
              위치 권한이 거부되었습니다. 브라우저 설정에서 허용하면 탐사를 시작할 수 있습니다.
            </p>
          )}
          {geo === GEO.unsupported && (
            <p className="body-text">이 브라우저는 위치 기능을 지원하지 않습니다.</p>
          )}
          {geo === GEO.failed && (
            <>
              <p className="body-text">위치를 가져오지 못했습니다.</p>
              <button type="button" className="btn" onClick={ask}>
                다시 시도
              </button>
            </>
          )}
        </div>
      )}

      {geo === GEO.ok && !region && (
        <div className="notice warn" style={{ marginTop: 'var(--sp-4)' }}>
          반경 {REGION_RADIUS_KM}km 안에 <strong>기록된 전승지가 없습니다.</strong> 시드 120체의 전승지는 73곳이라
          아직 비어 있는 지역이 많습니다. 없는 전승을 지어내지 않으므로, 이 지역은 데이터가 채워질 때까지 비어 있습니다.
        </div>
      )}

      {geo === GEO.ok && region && (
        <>
          <div className="row small muted" style={{ marginTop: 'var(--sp-4)', gap: 'var(--sp-3)' }}>
            <span>
              <Icon name="pin" size={14} /> {region.sigungu.join(' · ')}
            </span>
            <span>
              <Icon name="moon" size={14} /> {TIME_LABEL[timeBucket(ctx.hour)]}
            </span>
            <span>{SEASON_LABEL[seasonOf(ctx.month)]}</span>
            <span>가장 가까운 전승지 {region.nearest.distanceKm.toFixed(1)}km</span>
          </div>

          <div className="card-grid" style={{ marginTop: 'var(--sp-3)' }}>
            {encounters.map(({ entry, reasons }) => {
              const done = Boolean(caught[entry.id])
              return (
                <article key={entry.id} className="card" style={{ '--cat': CAT[entry.category]?.color }}>
                  <ArtPlate entry={entry} size="sm" />
                  <div style={{ padding: 'var(--sp-3)' }}>
                    <h3 style={{ margin: 0 }}>
                      <Link to={`/yokai/${slugOf(entry)}`}>{entry.canonical}</Link>
                    </h3>
                    <p className="small muted" style={{ margin: '4px 0 var(--sp-2)' }}>
                      {reasons.slice(0, 3).join(' · ')}
                    </p>
                    {needsFaithNotice(entry) && (
                      <p className="small" style={{ color: 'var(--gold)' }}>
                        현행 신앙의 신격입니다 — 퇴치 대상이 아니라 기록 대상으로 다룹니다.
                      </p>
                    )}
                    <button
                      type="button"
                      className={done ? 'btn' : 'btn primary'}
                      disabled={done}
                      onClick={() => onCatch(entry)}
                      style={{ marginTop: 'var(--sp-2)' }}
                    >
                      {done ? '기록함' : '기록하기'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </main>
  )
}
