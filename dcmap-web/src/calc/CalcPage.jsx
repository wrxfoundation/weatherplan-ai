import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES } from '../data/facilities.js'
import { checkPowerTrack } from './trackCheck.js'

// GPU별 대표 TDP(kW). 공개 스펙 기준 근사치 — 상세 학습 계산은 gpu-training-calculator 연동 예정(M1 최소 버전).
const GPU_PRESETS = [
  { key: 'h100', label: 'NVIDIA H100 SXM', kw: 0.7 },
  { key: 'h200', label: 'NVIDIA H200', kw: 0.7 },
  { key: 'b200', label: 'NVIDIA B200', kw: 1.0 },
  { key: 'gb200', label: 'NVIDIA GB200 (칩당)', kw: 1.2 },
]

const OVERHEAD = 1.2 // 네트워킹·스토리지·CPU 등 부대 IT 부하 계수

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
      <div className="spec-grid" style={{ marginTop: 12 }}>
        <div className="spec-cell">
          <div className="k">수전전압 트랙</div>
          <div className="v">{r.track.voltage}</div>
        </div>
        <div className="spec-cell">
          <div className="k">회선 구성</div>
          <div className="v">{r.track.circuits}</div>
        </div>
        <div className="spec-cell">
          <div className="k">전기사용예정통지</div>
          <div className="v">{r.preNoticeRequired ? '대상 (5,000kW 이상)' : '비대상'}</div>
        </div>
        <div className="spec-cell">
          <div className="k">전력계통영향평가</div>
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
  const [pue, setPue] = useState(1.3)
  const [nonCapital, setNonCapital] = useState(true)

  const gpu = GPU_PRESETS.find((g) => g.key === gpuKey)

  const { itMw, totalMw, ctaMw } = useMemo(() => {
    const it = (count * gpu.kw * OVERHEAD) / 1000
    const total = it * pue
    return { itMw: it, totalMw: total, ctaMw: Math.max(1, Math.ceil(total)) }
  }, [count, gpu, pue])

  const candidates = useMemo(
    () => FACILITIES.filter((f) => f.power_mw_public != null && f.power_mw_public >= ctaMw).length,
    [ctaMw],
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
              PUE (전력효율지수)
              <input
                type="number"
                min="1"
                max="2.5"
                step="0.05"
                value={pue}
                onChange={(e) => setPue(Math.min(2.5, Math.max(1, Number(e.target.value) || 1.3)))}
              />
            </label>
          </div>

          <div className="calc-result">
            <div>
              <div className="mw">
                {totalMw.toFixed(1)} <small>MW</small>
              </div>
              <div className="geo-note">IT 부하 {itMw.toFixed(1)} MW × PUE {pue}</div>
            </div>
            <div className="steps">
              {gpu.label} × {count.toLocaleString()}대 × 부대부하 계수 {OVERHEAD} = IT 부하, 여기에 PUE를 곱한 총
              수전 수요입니다. 프리쿨링 조건이 좋은 입지는 PUE를 낮춰 같은 GPU를 더 적은 전력으로 돌립니다(기상
              레이어, M3 예정).
            </div>
            <Link className="btn primary" to={`/?min_mw=${ctaMw}`}>
              이 용량 가능한 부지 보기 ({candidates}곳) <span className="btn-arrow">↗</span>
            </Link>
          </div>
        </div>

        <TrackCard mw={totalMw} nonCapital={nonCapital} onRegion={setNonCapital} />

        <p className="footer-note">
          공개 전력 규모(power_mw_public)가 확인된 시설만 CTA 필터에 잡힙니다. 규모 비공개 시설이 다수이므로 실제
          후보는 더 많을 수 있습니다.
        </p>
      </main>
    </>
  )
}
