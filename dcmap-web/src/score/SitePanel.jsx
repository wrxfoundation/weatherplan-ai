import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { STATUS_LABEL } from '../data/facilities.js'
import { landPriceFor, fmtRate } from '../data/landPrice.js'
import { dongPulseFor } from '../data/landPriceDong.js'
import { forecastFor, headroomFor, landUseFor, revgeoFor, weatherFor, floodRiskFor, populationFor, disasterFor, bldEnergyFor, warningFor, climateFor, dongLabel } from '../data/liveApi.js'
import { nearestPlant, windContext } from '../data/plants.js'
import { networkContext } from '../data/network.js'
import { scoreSite } from './engine.js'
import { buildSiteReport } from './report.js'
import { dcClimateIndex, CLIMATE_LEVELS, nearestNormal } from './climateIndex.js'
import Term from '../components/Term.jsx'

/* 맵 지점 클릭 → 부지 간이 분석 (시안 ScorePanel 자리의 정직한 v0 · L2 리포트 훅) */
export default function SitePanel({ point, onClose, onSelectFacility }) {
  const [mw, setMw] = useState(40)
  const [nonCapital, setNonCapital] = useState(true)
  const [addr, setAddr] = useState(null)
  const [wx, setWx] = useState(null)
  const [landUse, setLandUse] = useState(null)
  const [fc, setFc] = useState(null)
  const [headroom, setHeadroom] = useState(null)
  const [flood, setFlood] = useState(null)
  const [pop, setPop] = useState(null)
  const [disaster, setDisaster] = useState(null)
  const [energy, setEnergy] = useState(null)
  const [warning, setWarning] = useState(null)
  const [climate, setClimate] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    setAddr(null)
    setWx(null)
    setLandUse(null)
    setFc(null)
    setHeadroom(null)
    setFlood(null)
    setPop(null)
    setDisaster(null)
    setEnergy(null)
    setWarning(null)
    setClimate(null)
    warningFor(point.lat, point.lng).then((v) => alive && setWarning(v))
    climateFor(point.lat, point.lng).then((v) => alive && setClimate(v))
    revgeoFor(point.lat, point.lng).then((v) => {
      if (!alive) return
      setAddr(v)
      // SGIS 인구/밀도 — 시도코드로 질의 후 시군구 '이름'으로 매칭(코드 불일치 회피)
      if (v?.sigunguCd) {
        const sggAll = (v.parcel || '').match(/[가-힣]+(?:시|군|구)/g)
        const sgg = sggAll ? sggAll[sggAll.length - 1] : undefined
        populationFor(point.lat, point.lng, v.sigunguCd, sgg).then((e) => alive && setPop(e))
      }
      // 지번 법정동코드가 확보되면 건축HUB 지번 전기사용량 조회(최근 데이터는 2~3개월 지연)
      if (v?.sigunguCd && v?.bjdongCd) {
        const d = new Date()
        d.setMonth(d.getMonth() - 3)
        const useYm = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
        bldEnergyFor({ sigunguCd: v.sigunguCd, bjdongCd: v.bjdongCd, bun: v.bun, ji: v.ji, useYm }).then(
          (e) => alive && setEnergy(e),
        )
      }
    })
    weatherFor(point.lat, point.lng).then((v) => alive && setWx(v))
    landUseFor(point.lat, point.lng).then((v) => alive && setLandUse(v))
    forecastFor(point.lat, point.lng).then((v) => alive && setFc(v))
    headroomFor(point.lat, point.lng).then((v) => alive && setHeadroom(v))
    floodRiskFor(point.lat, point.lng).then((v) => alive && setFlood(v))
    disasterFor(point.lat, point.lng).then((v) => alive && setDisaster(v))
    return () => {
      alive = false
    }
  }, [point])

  const r = useMemo(
    () => scoreSite({ lat: point.lat, lng: point.lng, mw, nonCapital }),
    [point, mw, nonCapital],
  )

  // 데이터센터 기후지수 — 연평균기온 우선순위: 케이웨더 과거기후 → 기상청 평년값(최근접) → 현재기온.
  const normal = useMemo(() => nearestNormal(point.lat, point.lng), [point])
  const climateIdx = useMemo(
    () =>
      dcClimateIndex({
        avgTemp: climate?.available ? climate.avgTemp : undefined,
        normalTemp: normal?.t,
        normalStation: normal?.name,
        humidity: wx?.humidity,
        currentTemp: wx?.temp,
      }),
    [climate, wx, normal],
  )
  const dong = dongLabel(addr) // 표출값 동단위 근거지

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
          <button
            type="button"
            className="badge badge-btn"
            title="이 지점 분석의 공유 링크 복사"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href)
                setCopied('link')
                setTimeout(() => setCopied(false), 2000)
              } catch {
                /* noop */
              }
            }}
          >
            {copied === 'link' ? '링크 복사됨 ✓' : `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)} 🔗`}
          </button>
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

        {/* 프로세스 관문 전망 — 용량·입지로 본 두 핵심 게이트(P07 접속·P08 계통영향평가) 통과 난이도 */}
        {(() => {
          const t = r.track
          let p07
          if (mw <= 20)
            p07 = { sev: 'ok', verdict: '22.9kV 배전 수전', note: '계통 여유(헤드룸)가 지배 변수 — 한전 분산전원 조회로 확인' }
          else if (mw <= 40)
            p07 = { sev: 'talk', verdict: '22.9kV/154kV 협의', note: '40MW는 22.9kV 상한 경계 — 증설 계획 시 154kV 전제가 안전' }
          else p07 = { sev: 'gate', verdict: '154kV 의무', note: '자체 수전설비 투자 + 154kV 변전소 거리가 지배 변수' }

          let p08
          if (!t.psiaRequired) p08 = { sev: 'ok', verdict: '10MW 미만 · 비대상', note: '전력계통영향평가 대상 아님' }
          else if (nonCapital)
            p08 = {
              sev: 'talk',
              verdict: '대상 · 비수도권 유인',
              note: t.exemption
                ? `지역 배점 가점 여지 + ${t.exemption.effective}~ AIDC 특별법 면제 가능성`
                : '지역 배점 가점 여지 — 계통영향평가 대상',
            }
          else p08 = { sev: 'gate', verdict: '대상 · 수도권 감점', note: '±15점 중 수도권 억제 배점 — 핵심 관문' }

          const chip = (s) => (s === 'ok' ? 'status-operating' : 'verify')
          const rows = [
            { id: 'P07', title: '한전 접속·수전전압', ...p07 },
            { id: 'P08', title: '전력계통영향평가 ±15점', ...p08 },
          ]
          return (
            <>
              <div className="chart-title" style={{ marginTop: 14 }}>
                프로세스 관문 전망 — 이 지점 {mw}MW · {nonCapital ? '비수도권' : '수도권'}
              </div>
              <div className="gate-outlook">
                {rows.map((g) => (
                  <div key={g.id} className={`gate-row sev-${g.sev}`}>
                    <span className="gate-id">{g.id}</span>
                    <span className="gate-body">
                      <span className="gate-title">{g.title}</span>
                      <span className="gate-note">{g.note}</span>
                    </span>
                    <span className={`badge ${chip(g.sev)}`}>{g.verdict}</span>
                  </div>
                ))}
              </div>
              <p className="chart-note">
                용량·입지로 본 두 핵심 관문의 통과 난이도 추정 — 실제 판정은 한전·기후에너지환경부 심의.{' '}
                <Link to={`/?min_mw=${Math.max(1, Math.ceil(mw))}${nonCapital ? '&noncap=1' : ''}`}>
                  이 조건 통과 후보 맵 →
                </Link>{' '}
                · <Link to="/roadmap?view=frame">전체 프로세스 프레임 →</Link>
              </p>
            </>
          )
        })()}

        {/* 실무 조회 채널 — 이 지점을 공식 시스템에서 직접 확인 (자동화는 각 기관 약관 확인 후) */}
        <div className="chart-title" style={{ marginTop: 14 }}>
          실무 조회 — 공식 시스템 바로가기
        </div>
        <div className="quick-links">
          <a className="btn" href="https://cyber.kepco.co.kr/ckepco/mobile/resources/resources_search_pt_capa.jsp" target="_blank" rel="noreferrer">
            한전 접속가능 용량 (154kV)
          </a>
          <a className="btn" href="https://cyber.kepco.co.kr/ckepco/mobile/resources/resources_search.jsp" target="_blank" rel="noreferrer">
            한전 분산형전원 (22.9kV)
          </a>
          <a className="btn" href="https://recloud.energy.or.kr/" target="_blank" rel="noreferrer">
            RE클라우드 계통·입지
          </a>
          <a className="btn" href="https://www.eum.go.kr/" target="_blank" rel="noreferrer">
            토지이음 (토지이용계획)
          </a>
        </div>

        <div className="spec-grid">
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">지번주소 (vworld 리버스 지오코딩)</div>
            <div className="v">
              {addr?.parcel ?? addr?.road ?? <span className="badge verify">조회 대기 — 연동 후 자동 표시</span>}
            </div>
          </div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k"><Term k="용도지역">용도지역</Term> (vworld 도시계획 — 토지축 근거)</div>
            <div className="v">
              {landUse?.uses?.length ? (
                landUse.uses.join(' · ')
              ) : (
                <span className="badge verify">조회 대기 — 점수화는 캘리브레이션 후</span>
              )}
            </div>
          </div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">현재 기상 (케이웨더 실황)</div>
            <div className="v">
              {wx ? (
                <>
                  {wx.temp != null && `${wx.temp}°C`}
                  {wx.sky && ` · ${wx.sky}`}
                  {wx.senseTemp != null && ` · 체감 ${wx.senseTemp}°C`}
                  {wx.humidity != null && ` · 습도 ${wx.humidity}%`}
                  {wx.rain1h != null && wx.rain1h > 0 && ` · 강수 ${wx.rain1h}mm/h`}
                  {wx.windSpeed != null && ` · 풍속 ${wx.windSpeed}m/s`}
                  {wx.pm10 != null && ` · PM10 ${wx.pm10}`}
                </>
              ) : (
                <span className="badge verify">연동 대기 — 케이웨더 실황(기상축)</span>
              )}
            </div>
            {(dong || normal) && (
              <div className="cell-basis">근거지 {dong || (normal ? `${normal.name} 인근` : '좌표 기준')}</div>
            )}
            {fc?.days?.length > 0 && (
              <div className="wx-strip" aria-label="3일 일별예보">
                {fc.days.map((h, i) => (
                  <span key={i} className="wx-hour">
                    <em>{h.label}</em>
                    <strong>{h.tmax != null ? `${h.tmax}°` : '–'}</strong>
                    <span>{h.sky ?? ''}{h.rainProb != null ? ` ${h.rainProb}%` : ''}</span>
                  </span>
                ))}
                {fc.rain && <span className="badge verify">강수 유의</span>}
              </div>
            )}
          </div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">
              <Term k="프리쿨링">데이터센터 기후지수</Term> (냉각 적합도 · 아주나쁨~아주좋음)
            </div>
            <div className="v">
              {climateIdx ? (
                <div className="ci-block">
                  <span className={`ci-inline tone-${climateIdx.tone}`}>
                    <span className="ci-scale" aria-label={`5단계 중 ${climateIdx.level}단계`}>
                      {CLIMATE_LEVELS.map((l) => (
                        <i key={l.level} className={l.level === climateIdx.level ? `on tone-${climateIdx.tone}` : ''} />
                      ))}
                    </span>
                    <b className="ci-inline-label">{climateIdx.label}</b>
                    <span className="ci-temp">연평균 {climateIdx.temp}°C</span>
                  </span>
                  <div className="ci-why">{climateIdx.why}</div>
                  <div className="ci-basis">근거: {climateIdx.basis}</div>
                </div>
              ) : (
                <span className="badge verify">연동 대기 — 기온 확보 후 산출</span>
              )}
            </div>
          </div>
          <div className="spec-cell">
            <div className="k">기상특보 (리스크 — 태풍·강풍·호우)</div>
            <div className="v">
              {warning?.available ? (
                warning.count > 0 ? (
                  warning.warnings.map((w) => (
                    <span key={w} className="badge verify" style={{ marginRight: 6 }}>
                      {w}
                    </span>
                  ))
                ) : (
                  <span className="badge status-operating">발효 중인 특보 없음</span>
                )
              ) : (
                <span className="badge verify">연동 대기 — 케이웨더 특보</span>
              )}
            </div>
          </div>
          <div className="spec-cell">
            <div className="k"><Term k="프리쿨링">기후</Term> (과거 연별 — 프리쿨링 잠재력)</div>
            <div className="v">
              {climate?.available ? (
                <>
                  {climate.avgTemp != null && `연평균 ${climate.avgTemp}°C`}
                  {climate.maxTemp != null && ` · 최고 ${climate.maxTemp}°C`}
                  {climate.minTemp != null && ` · 최저 ${climate.minTemp}°C`}
                  {climate.rainSum != null && ` · 강수 ${climate.rainSum}mm`}
                </>
              ) : (
                <span className="badge verify">연동 대기 — 케이웨더 과거 기후</span>
              )}
            </div>
          </div>
          {(() => {
            const np = nearestPlant(point)
            const wc = windContext(point)
            return np ? (
              <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="k"><Term k="발전단지">발전 인프라</Term> 근접성 (맥락 — 전원 매칭 아님)</div>
                <div className="v">
                  {np.plant.name} · {np.plant.type}
                  {np.plant.capacity_mw != null && ` · ${np.plant.capacity_mw.toLocaleString()}MW`} · {np.km.toFixed(0)}km
                  {wc.nearest && (
                    <span className="meta">
                      {' '}
                      · 풍력 {wc.radiusKm}km 내 {wc.count}지점 (최근접 {wc.nearest.km.toFixed(1)}km)
                    </span>
                  )}
                </div>
              </div>
            ) : null
          })()}
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k"><Term k="계통여유">계통 여유용량</Term> (한전 분산전원 22.9kV · 배전)</div>
            <div className="v">
              {headroom?.available ? (
                <>
                  {headroom.availableMw != null && `여유 ${headroom.availableMw.toLocaleString()}MW`}
                  {headroom.cumulativeMw != null && ` · 누적연계 ${headroom.cumulativeMw.toLocaleString()}MW`}
                </>
              ) : (
                <span className="badge verify">연동 대기 — 전력축 D3 데이터 소스</span>
              )}
            </div>
          </div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k"><Term k="침수심">침수 위험</Term> (홍수위험지도 — 리스크축)</div>
            <div className="v">
              {flood?.available ? (
                flood.grade === '해당없음' || flood.depthM === 0 ? (
                  <span className="badge status-operating">침수구역 외 · 위험 낮음</span>
                ) : (
                  <>
                    <span className="badge verify">침수 위험 {flood.grade}</span>
                    {flood.depthM != null && ` · 침수심 ${flood.depthM}m`}
                    {flood.floodType && ` · ${flood.floodType}`}
                    {flood.scenario && ` · ${flood.scenario}`}
                  </>
                )
              ) : (
                <span className="badge verify">연동 대기 — 리스크축 침수(홍수위험지도)</span>
              )}
            </div>
          </div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k"><Term k="인구격자">인구·밀도</Term> (SGIS 시군구 — 민원 프록시)</div>
            <div className="v">
              {pop?.available ? (
                <>
                  {pop.admNm && `${pop.admNm} `}인구 <strong>{pop.population != null ? pop.population.toLocaleString() : '—'}명</strong>
                  {pop.density != null && ` · 밀도 ${pop.density.toLocaleString()}명/km²`}
                  {pop.households != null && ` · ${pop.households.toLocaleString()}세대`}
                  {pop.density != null && (
                    <span className={`badge ${pop.density < 3000 ? 'status-operating' : 'verify'}`} style={{ marginLeft: 8 }}>
                      {pop.density < 3000 ? '저밀도 · 민원 리스크 낮음' : '고밀도 · 민원 유의'}
                    </span>
                  )}
                  <span className="meta"> · {pop.level || '시군구'} 단위{pop.year ? ` · ${pop.year}` : ''}(정밀 반경은 격자 API 연동 시)</span>
                </>
              ) : (
                <span className="badge verify">연동 대기 — 리스크축 인구(SGIS 시군구)</span>
              )}
            </div>
          </div>
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">지번 실측 전기사용량 (국토부 건축HUB — 수요 맥락)</div>
            <div className="v">
              {energy?.available && energy.usage != null ? (
                <>
                  {energy.useYm} <strong>{energy.usage.toLocaleString()} {energy.unit}</strong>
                  <span className="meta"> · 해당 지번 건물에너지 실측(단독·소규모·산업 용도 제외)</span>
                </>
              ) : addr?.sigunguCd ? (
                <span className="badge verify">해당 지번 데이터 없음 — 대상 외(단독·200세대 미만·산업)일 수 있음</span>
              ) : (
                <span className="badge verify">연동 대기 — 법정동코드 확보(vworld) 후 자동 조회</span>
              )}
            </div>
          </div>
          {(() => {
            const net = networkContext(point)
            return (
              <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="k">네트워크 근접성 (<Term k="백본">백본</Term>·<Term k="육양국">해저케이블</Term> — 참고)</div>
                <div className="v">
                  {net.backbone && `백본/IX ${net.backbone.node.name} ${net.backbone.km.toFixed(0)}km`}
                  {net.cls && ` · 해저케이블 육양국 ${net.cls.node.name} ${net.cls.km.toFixed(0)}km`}
                  <span className="badge verify" style={{ marginLeft: 8 }}>공개 근사 · 검증 대기</span>
                </div>
              </div>
            )
          })()}
          <div className="spec-cell" style={{ gridColumn: '1 / -1' }}>
            <div className="k">재해 이력 (재난안전 — 리스크축)</div>
            <div className="v">
              {disaster?.available ? (
                <>
                  {disaster.events != null && <strong>재해 {disaster.events.toLocaleString()}건</strong>}
                  {disaster.topType && ` · 주 유형 ${disaster.topType}`}
                  {disaster.recentYear && ` · 최근 ${disaster.recentYear}`}
                </>
              ) : (
                <span className="badge verify">연동 대기 — 리스크축 재해(재난안전)</span>
              )}
            </div>
          </div>
          <div className="spec-cell">
            <div className="k"><Term k="수전전압">수전전압</Term> 트랙</div>
            <div className="v">{r.track.track.voltage}</div>
          </div>
          <div className="spec-cell">
            <div className="k"><Term k="전력계통영향평가">계통영향평가</Term></div>
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
                  인근 <Term k="지가변동률">지가변동률</Term> · {lp.scope} ({lp.period} 월간, KOSIS — 최근접 시설 시군구 기준)
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

        {(() => {
          const makeReport = () =>
            buildSiteReport({
              point,
              r,
              nonCapital,
              mw,
              addr,
              landUse,
              wx,
              fc,
              landPrice: landPriceFor(r.nearest[0].facility),
              dongPulse: dongPulseFor(r.nearest[0].facility),
              plantCtx: nearestPlant(point),
              windCtx: windContext(point),
              headroom,
              flood,
              pop,
              disaster,
              energy,
              warning,
              climate,
            })
          const onCopy = async () => {
            try {
              await navigator.clipboard.writeText(makeReport())
              setCopied('report')
              setTimeout(() => setCopied(false), 2000)
            } catch {
              /* 클립보드 미지원 — 다운로드 버튼 사용 */
            }
          }
          const onDownload = () => {
            const blob = new Blob([makeReport()], { type: 'text/markdown;charset=utf-8' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `aiinframap-site-${point.lat.toFixed(4)}_${point.lng.toFixed(4)}.md`
            a.click()
            URL.revokeObjectURL(a.href)
          }
          return (
            <div className="card-actions">
              <button type="button" className="btn primary" onClick={onCopy}>
                {copied === 'report' ? '복사됨 ✓' : '간이 리포트 복사'}
              </button>
              <button type="button" className="btn" onClick={onDownload}>
                .md 다운로드
              </button>
            </div>
          )
        })()}
        <p className="geo-note">
          간이 리포트 v0 — 산출된 근거만 수치로, 대기 축은 명시. 정밀 스코어링 리포트는 M2에서.
        </p>
      </article>
    </>
  )
}
