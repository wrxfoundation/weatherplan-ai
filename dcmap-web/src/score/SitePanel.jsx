import { useEffect, useMemo, useState } from 'react'
import { STATUS_LABEL } from '../data/facilities.js'
import { landPriceFor, fmtRate } from '../data/landPrice.js'
import { dongPulseFor } from '../data/landPriceDong.js'
import { revgeoFor, weatherFor } from '../data/liveApi.js'
import { scoreSite } from './engine.js'

/* 맵 지점 클릭 → 부지 간이 분석 (시안 ScorePanel 자리의 정직한 v0 · L2 리포트 훅) */
export default function SitePanel({ point, onClose, onSelectFacility }) {
  const [mw, setMw] = useState(40)
  const [nonCapital, setNonCapital] = useState(true)
  const [addr, setAddr] = useState(null)
  const [wx, setWx] = useState(null)

  useEffect(() => {
    let alive = true
    setAddr(null)
    setWx(null)
    revgeoFor(point.lat, point.lng).then((v) => alive && setAddr(v))
    weatherFor(point.lat, point.lng).then((v) => alive && setWx(v))
    return () => {
      alive = false
    }
  }, [point])

  const r = useMemo(
    () => scoreSite({ lat: point.lat, lng: point.lng, mw, nonCapital }),
    [point, mw, nonCapital],
  )

  return (
    <>
      <h2>
        <button type="button" className="chip btn" onClick={onClose}>
          ← 목록으로
        </button>
      </h2>
      <article className="facility-card">
        <div className="status-line">
          <span className="badge status-operating">지점 분석 v0</span>
          <span className="badge">
            {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
          </span>
        </div>
        <h3>부지 적합도 프리뷰</h3>
        <div className="name-en">근거 확보 {r.knownScore}/{r.knownMax}점 · 스코어 커버리지 {r.coverage}/100</div>

        <div className="calc-grid">
          <label>
            입지 구분 (경계 자동판정은 추후)
            <select value={nonCapital ? 'non' : 'cap'} onChange={(e) => setNonCapital(e.target.value === 'non')}>
              <option value="non">비수도권</option>
              <option value="cap">수도권</option>
            </select>
          </label>
          <label>
            필요 용량 (MW)
            <input
              type="number"
              min="1"
              value={mw}
              onChange={(e) => setMw(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        </div>

        <div className="score-axes">
          {r.axes.map((axis) => (
            <div key={axis.key} className="hbar-row">
              <span className="hbar-label">{axis.label}</span>
              <span className="hbar-track">
                {axis.knownMax > 0 && (
                  <span className="hbar-fill" style={{ width: `${(axis.known / axis.max) * 100}%` }} />
                )}
              </span>
              <span className="hbar-value">
                {axis.knownMax > 0 ? `${axis.known}/${axis.max}` : <span className="badge verify">대기</span>}
              </span>
            </div>
          ))}
        </div>
        <p className="chart-note">
          {r.axes
            .flatMap((a) => a.items.filter((i) => i.points != null && i.basis).map((i) => `${i.label}: ${i.basis}`))
            .join(' · ')}
        </p>
        <p className="geo-note">
          미산출 축 데이터 소스: 변전소 거리(345kV 정보 공개 대기) · 배전 여유(D3) · 토지(vworld) · 리스크(인구격자) ·
          네트워크 · 기상(M3). 공개되는 즉시 같은 자리에서 점수화됩니다.
        </p>

        <div className="spec-grid">
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">지번주소 (vworld 리버스 지오코딩)</div>
            <div className="v">
              {addr?.parcel ?? addr?.road ?? <span className="badge verify">조회 대기 — 연동 후 자동 표시</span>}
            </div>
          </div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">현재 기상 (케이웨더)</div>
            <div className="v">
              {wx ? (
                <>
                  {wx.temp != null && `${wx.temp}°C`}
                  {wx.sky && ` · ${wx.sky}`}
                  {wx.humidity != null && ` · 습도 ${wx.humidity}%`}
                  {wx.pm10 != null && ` · PM10 ${wx.pm10}`}
                </>
              ) : (
                <span className="badge verify">연동 대기 — 기상축(M3) 데이터 소스</span>
              )}
            </div>
          </div>
          <div className="spec-cell">
            <div className="k">수전전압 트랙</div>
            <div className="v">{r.track.track.voltage}</div>
          </div>
          <div className="spec-cell">
            <div className="k">계통영향평가</div>
            <div className="v">
              {r.track.psiaRequired ? '대상' : '비대상'}
              {r.track.exemption && ` · ${r.track.exemption.effective}~ 면제 가능성`}
            </div>
          </div>
          {(() => {
            const lp = landPriceFor(r.nearest[0].facility)
            const dp = dongPulseFor(r.nearest[0].facility)
            return lp ? (
              <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="k">
                  인근 지가변동률 · {lp.scope} ({lp.period} 월간, KOSIS — 최근접 시설 시군구 기준)
                </div>
                <div className="v">
                  {fmtRate(lp.value)}
                  {dp && (
                    <span className="meta">
                      {' '}
                      · 동 단위 {fmtRate(dp.bottom.rate)} ~ {fmtRate(dp.top.rate)} ({dp.count}개 구역)
                    </span>
                  )}
                </div>
              </div>
            ) : null
          })()}
        </div>

        <div className="chart-title" style={{ marginTop: 14 }}>
          최근접 시설
        </div>
        <div className="facility-list">
          {r.nearest.map(({ facility: f, km }) => (
            <button key={f.id} type="button" className="facility-row" onClick={() => onSelectFacility(f)}>
              <span className={`dot ${f.status === 'delayed' ? 'planned' : f.status}`} />
              <span>
                <span className="name">{f.name}</span>
                <span className="meta">
                  {km.toFixed(1)} km · {STATUS_LABEL[f.status] ?? f.status}
                  {f.power_mw_public != null && ` · ${f.power_mw_public}MW`}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="card-actions">
          <span className="badge verify">정밀 스코어링 리포트 — M2 오픈 예정</span>
        </div>
      </article>
    </>
  )
}
