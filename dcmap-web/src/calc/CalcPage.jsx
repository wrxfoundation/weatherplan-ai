import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES, CAPITAL_SIDOS } from '../data/facilities.js'
import { checkPowerTrack } from './trackCheck.js'
import Term from '../components/Term.jsx'

// GPU별 대표 TDP(kW). 공개 스펙 기준 근사치 — 상세 학습 계산은 gpu-training-calculator 연동 예정(M1 최소 버전).
const GPU_PRESETS = [
  { key: 'h100', label: 'NVIDIA H100 SXM', kw: 0.7 },
  { key: 'h200', label: 'NVIDIA H200', kw: 0.7 },
  { key: 'b200', label: 'NVIDIA B200', kw: 1.0 },
  { key: 'gb200', label: 'NVIDIA GB200 (칩당)', kw: 1.2 },
]

const OVERHEAD = 1.2 // 네트워킹·스토리지·CPU 등 부대 IT 부하 계수

/* 냉각 방식 → PUE·랙 밀도 대표값 (업계 공개 설계 관행의 보수적 대표치 — 커스텀 PUE 입력으로 오버라이드 가능)
 * 근거 맥락: /insights/liquid-cooling-brief (OCP 웨비나) — 액랭 전환이 PUE·밀도를 동시에 바꾼다 */
const COOLING_PRESETS = [
  { key: 'air', label: '공랭 (CRAC/CRAH)', pue: 1.5, rackKw: 12 },
  { key: 'd2c', label: '액랭 D2C (직접칩냉각)', pue: 1.25, rackKw: 60 },
  { key: 'immersion', label: '침지냉각', pue: 1.1, rackKw: 100 },
]

/* 수전 여유(이중화) 계수 — 계약전력 설계 관행 */
const REDUNDANCY = [
  { key: 'n', label: 'N (여유 없음)', factor: 1.0 },
  { key: 'n1', label: 'N+1 (권장)', factor: 1.15 },
  { key: '2n', label: '2N (금융·미션크리티컬)', factor: 1.35 },
]

const SQM_PER_RACK = 2.8 // 랙 1대당 점유 상면(통로·CRAH 포함 화이트스페이스 근사)
const LOAD_FACTOR = 0.8 // 연간 에너지 환산용 평균 부하율 (보수적 대표값)

/* M2 스코어링 전력축 v0 — 규칙 기반 인허가 트랙 판정 (근거: 룰북 §1·§2) */
function TrackCard({ mw, nonCapital, onRegion }) {
  const r = useMemo(() => checkPowerTrack(mw, { nonCapital }), [mw, nonCapital])
  return (
    <div className="calc-card">
      <div className="chart-title">이 용량의 전력 인허가 트랙 — {r.mw.toFixed(1)} MW 기준</div>
      <div className="calc-grid">
        <label>
          입지
          <select value={nonCapital ? 'non' : 'cap'} onChange={(e) => onRegion(e.target.value === 'non')}>
            <option value="non">비수도권</option>
            <option value="cap">수도권</option>
          </select>
        </label>
      </div>
      {/* 용량 밴드 스케일 — 마커가 현재 MW로 실시간 이동(트랙 판정이 살아있음을 시각화) */}
      {(() => {
        const CAP = 80
        const pos = Math.min(100, (Math.min(r.mw, CAP) / CAP) * 100)
        const band = r.mw <= 20 ? 0 : r.mw <= 40 ? 1 : 2
        const nextMsg =
          r.mw <= 20
            ? `20MW까지 ${(20 - r.mw).toFixed(1)}MW 여유 — 초과 시 22.9kV/154kV 협의 구간`
            : r.mw <= 40
              ? `40MW까지 ${(40 - r.mw).toFixed(1)}MW — 초과 시 154kV 의무 구간`
              : `154kV 의무 구간 (40MW 초과) — 자체 수전설비 투자 필요`
        return (
          <div className="band-scale">
            <div className="band-track">
              <div className={`band-seg${band === 0 ? ' on' : ''}`} style={{ flex: 20 }}>
                22.9kV<br />≤20MW
              </div>
              <div className={`band-seg${band === 1 ? ' on' : ''}`} style={{ flex: 20 }}>
                협의<br />20–40
              </div>
              <div className={`band-seg${band === 2 ? ' on' : ''}`} style={{ flex: 40 }}>
                154kV 의무<br />40MW+
              </div>
              <div className="band-marker" style={{ left: `${pos}%` }} />
            </div>
            <div className="band-legend">
              <span>0</span>
              <span>현재 {r.mw.toFixed(1)}MW · {nextMsg}</span>
              <span>{CAP}MW+</span>
            </div>
          </div>
        )
      })()}

      <div className="spec-grid" style={{ marginTop: 12 }}>
        <div className="spec-cell">
          <div className="k">
            <Term k="수전전압">수전전압</Term> 트랙
          </div>
          <div className="v">
            {r.mw > 40 ? <Term k="154kV">{r.track.voltage}</Term> : r.mw <= 20 ? <Term k="22.9kV">{r.track.voltage}</Term> : r.track.voltage}
          </div>
        </div>
        <div className="spec-cell">
          <div className="k">회선 구성</div>
          <div className="v">{r.track.circuits}</div>
        </div>
        <div className="spec-cell">
          <div className="k">
            <Term k="전기사용예정통지">전기사용예정통지</Term>
          </div>
          <div className="v">{r.preNoticeRequired ? '대상 (5,000kW 이상)' : '비대상'}</div>
        </div>
        <div className="spec-cell">
          <div className="k">
            <Term k="전력계통영향평가">전력계통영향평가</Term>
          </div>
          <div className="v">
            {r.psiaRequired ? '대상 (10MW 이상)' : '비대상'}
            {r.exemption && ` · ${r.exemption.effective}부터 면제 가능성`}
          </div>
        </div>
        <div className="spec-cell">
          <div className="k">심의회 상정까지 확정 수수료</div>
          <div className="v">{r.fees.total}</div>
        </div>
        <div className="spec-cell">
          <div className="k">리드타임 골자</div>
          <div className="v">
            {r.leadTime.review}
            {r.leadTime.assessment && ` + ${r.leadTime.assessment}`}
          </div>
        </div>
      </div>
      <p className="chart-note">{r.track.note}</p>
      {r.exemption && (
        <p className="chart-note">
          AIDC 특별법: 비수도권 일정 규모 이하 시설은 {r.exemption.effective}부터 전력계통영향평가 면제 — 규모
          기준은 대통령령 위임(미제정)이라 확정 전입니다.
        </p>
      )}
      {r.leadTime.deadline && <p className="chart-note">⚠ {r.leadTime.deadline}</p>}
      <p className="footer-note">근거: {r.basis.join(' · ')}. 상세 산식은 전력 인허가 룰북(리포 docs) 참조.</p>
    </div>
  )
}

export default function CalcPage() {
  const [gpuKey, setGpuKey] = useState('h100')
  const [count, setCount] = useState(1024)
  const [coolKey, setCoolKey] = useState('d2c')
  const [pue, setPue] = useState(COOLING_PRESETS.find((c) => c.key === 'd2c').pue)
  const [redunKey, setRedunKey] = useState('n1')
  const [nonCapital, setNonCapital] = useState(true)

  const gpu = GPU_PRESETS.find((g) => g.key === gpuKey)
  const cooling = COOLING_PRESETS.find((c) => c.key === coolKey)
  const redun = REDUNDANCY.find((r) => r.key === redunKey)

  // 냉각 방식 변경 시 PUE 대표값으로 리셋 (직접 수정하면 그 값 유지)
  const onCooling = (key) => {
    setCoolKey(key)
    setPue(COOLING_PRESETS.find((c) => c.key === key).pue)
  }

  const { itMw, totalMw, contractMw, ctaMw, racks, sqm, gwhYear } = useMemo(() => {
    const it = (count * gpu.kw * OVERHEAD) / 1000
    const total = it * pue
    const contract = total * redun.factor
    return {
      itMw: it,
      totalMw: total,
      contractMw: contract,
      ctaMw: Math.max(1, Math.ceil(contract)),
      racks: Math.ceil((it * 1000) / cooling.rackKw),
      sqm: Math.ceil(((it * 1000) / cooling.rackKw) * SQM_PER_RACK),
      gwhYear: (total * 8760 * LOAD_FACTOR) / 1000,
    }
  }, [count, gpu, pue, cooling, redun])

  const candidates = useMemo(
    () =>
      FACILITIES.filter(
        (f) =>
          f.power_mw_public != null &&
          f.power_mw_public >= ctaMw &&
          (!nonCapital || !CAPITAL_SIDOS.has(f.sido)),
      ).length,
    [ctaMw, nonCapital],
  )

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="eyebrow">CAPACITY PLANNER</div>
        <h1>GPU → 전력(MW) 계산기</h1>
        <p className="sub">필요 GPU 수량을 데이터센터 전력 수요로 환산하고, 그 용량이 가능한 부지를 맵에서 찾습니다.</p>

        <div className="calc-card">
          <div className="calc-grid">
            <label>
              GPU 모델
              <select value={gpuKey} onChange={(e) => setGpuKey(e.target.value)}>
                {GPU_PRESETS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label} ({g.kw}kW)
                  </option>
                ))}
              </select>
            </label>
            <label>
              GPU 수량
              <input
                type="number"
                min="1"
                step="1"
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
            <label>
              냉각 방식 (PUE·랙밀도 연동)
              <select value={coolKey} onChange={(e) => onCooling(e.target.value)}>
                {COOLING_PRESETS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <Term k="PUE">PUE</Term> (전력효율지수)
              <input
                type="number"
                min="1"
                max="2.5"
                step="0.05"
                value={pue}
                onChange={(e) => setPue(Math.min(2.5, Math.max(1, Number(e.target.value) || 1.3)))}
              />
            </label>
            <label>
              수전 여유 (<Term k="이중화">이중화</Term>)
              <select value={redunKey} onChange={(e) => setRedunKey(e.target.value)}>
                {REDUNDANCY.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="calc-result">
            <div>
              <div className="mw">
                {contractMw.toFixed(1)} <small>MW</small>
              </div>
              <div className="geo-note">
                IT {itMw.toFixed(1)} × PUE {pue} = {totalMw.toFixed(1)} MW × 여유 {redun.factor}
              </div>
            </div>
            <div className="steps">
              {gpu.label} × {count.toLocaleString()}대 × 부대부하 {OVERHEAD} = IT 부하 → PUE(
              {cooling.label.split(' ')[0]} 기준 {cooling.pue}, 수정 가능) → 이중화 여유까지 반영한{' '}
              <strong>계약전력 관점의 수전 수요</strong>입니다. 프리쿨링 조건이 좋은 입지는 PUE를 낮춰 같은 GPU를 더
              적은 전력으로 돌립니다(기상 레이어, M3 예정).
            </div>
            <Link className="btn primary" to={`/?min_mw=${ctaMw}${nonCapital ? '&noncap=1' : ''}`}>
              이 용량 가능한 부지 보기 ({candidates}곳){nonCapital ? ' · 비수도권' : ''} <span className="btn-arrow">↗</span>
            </Link>
          </div>

          <div className="spec-grid" style={{ marginTop: 4 }}>
            <div className="spec-cell">
              <div className="k">필요 랙 (@{cooling.rackKw}kW/랙)</div>
              <div className="v">{racks.toLocaleString()}대</div>
            </div>
            <div className="spec-cell">
              <div className="k">추정 <Term k="화이트스페이스">화이트스페이스</Term></div>
              <div className="v">약 {sqm.toLocaleString()}㎡</div>
            </div>
            <div className="spec-cell">
              <div className="k">연간 전력 사용량 (부하율 {LOAD_FACTOR})</div>
              <div className="v">약 {gwhYear.toFixed(1)} GWh/년</div>
            </div>
            <div className="spec-cell">
              <div className="k">냉각 유량 관점</div>
              <div className="v">{coolKey === 'air' ? '냉수·외기 설비' : coolKey === 'd2c' ? '~1.5L/min·kW' : '~0.3L/min·kW (2상)'}</div>
            </div>
          </div>
          <p className="chart-note">
            랙 밀도·PUE·부하율은 업계 공개 설계 관행의 대표값(수정 가능) — 확정 설계값이 아닌 부지 검토용 근사입니다.
            냉각 방식별 유량·시장 맥락: <Link to="/insights/liquid-cooling-brief">액체냉각 브리프</Link>.
          </p>
        </div>

        <TrackCard mw={contractMw} nonCapital={nonCapital} onRegion={setNonCapital} />

        <p className="footer-note">
          공개 전력 규모(power_mw_public)가 확인된 시설만 CTA 필터에 잡힙니다. 규모 비공개 시설이 다수이므로 실제
          후보는 더 많을 수 있습니다.
        </p>
      </main>
    </>
  )
}
