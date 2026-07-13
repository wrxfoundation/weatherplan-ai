import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../TopBar.jsx'
import { FACILITIES, CAPITAL_SIDOS } from '../data/facilities.js'
import { checkPowerTrack } from './trackCheck.js'
import Term from '../components/Term.jsx'
import { callAiStream, usageLabel, aiReasonLabel } from '../data/aiApi.js'
import AiText from '../ai/AiText.jsx'

// GPU별 대표 TDP(kW). 공개 스펙 기준 근사치 — 가속기당 소비전력(부대 IT 부하는 별도 계수).
// NVIDIA 데이터센터 GPU가 사실상 표준이나, 추론·레거시·AMD까지 포함해 시나리오 폭을 넓힘.
// nvl72: GB200/GB300 NVL72 랙(가속기 72개/랙) 인식용 플래그.
const GPU_PRESETS = [
  { key: 'gb300', label: 'NVIDIA GB300 (칩당)', kw: 1.4, nvl72: true },
  { key: 'gb200', label: 'NVIDIA GB200 (칩당)', kw: 1.2, nvl72: true },
  { key: 'b200', label: 'NVIDIA B200', kw: 1.0 },
  { key: 'b100', label: 'NVIDIA B100', kw: 0.7 },
  { key: 'h200', label: 'NVIDIA H200 SXM', kw: 0.7 },
  { key: 'h100', label: 'NVIDIA H100 SXM', kw: 0.7 },
  { key: 'h800', label: 'NVIDIA H800 (중국)', kw: 0.7 },
  { key: 'a100', label: 'NVIDIA A100 80GB (레거시)', kw: 0.4 },
  { key: 'l40s', label: 'NVIDIA L40S (추론)', kw: 0.35 },
  { key: 'mi355x', label: 'AMD MI355X', kw: 1.4 },
  { key: 'mi325x', label: 'AMD MI325X', kw: 1.0 },
  { key: 'mi300x', label: 'AMD MI300X', kw: 0.75 },
]

/* 워크로드 프로파일 — 부대부하(overhead)·연간 평균 부하율(loadFactor)을 배치 성격에 맞게 세팅.
 * 첨두 IT 부하(=계약전력 산정 기준)는 워크로드와 무관하나, 연간 에너지(GWh)는 부하율에 크게 좌우된다(정직). */
const WORKLOADS = [
  { key: 'training', label: '대규모 학습', overhead: 1.25, loadFactor: 0.9, note: '분산학습 — 인터커넥트 부하 큼·상시 고부하' },
  { key: 'mixed', label: '혼합(학습+추론)', overhead: 1.2, loadFactor: 0.75, note: '학습·서빙 병행 — 중간 부하율' },
  { key: 'inference', label: '추론 서비스', overhead: 1.15, loadFactor: 0.55, note: '서비스 트래픽 변동 — 평균 부하율 낮음' },
]

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

/* 경제성 대표값 — 모두 편집 가능한 공개 대표치(확정 단가 아님). 정직성: '대표·추정'으로 명시.
 *  · 전기요금: 한전 산업용(을) 고압 대표 단가대(계절·시간대·계약종별로 상이 → 실제는 한전 계약 확인)
 *  · 배출계수: 국가 전력 온실가스 배출계수(공개, 연도별 갱신) */
const DEFAULT_WON_PER_KWH = 160 // 원/kWh (산업용 대표 단가 · 편집)
const DEFAULT_KGCO2_PER_KWH = 0.459 // kgCO₂/kWh (국가 전력배출계수 대표 · 편집)

/* M2 스코어링 전력축 v0 — 규칙 기반 인허가 트랙 판정 (근거: 룰북 §1·§2) */
function TrackCard({ mw, nonCapital, onRegion }) {
  const r = useMemo(() => checkPowerTrack(mw, { nonCapital }), [mw, nonCapital])
  return (
    <div className="calc-card">
      <div className="chart-title">이 용량의 전력 인허가 트랙 — {r.mw.toFixed(1)} MW 기준</div>
      <div className="calc-grid">
        <label>
          <span className="lbl-cap">입지</span>
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
        const band = r.mw <= 10 ? 0 : r.mw <= 40 ? 1 : 2
        const nextMsg =
          r.mw <= 10
            ? `10MW까지 ${(10 - r.mw).toFixed(1)}MW 여유 — 초과 시 154kV 원칙(22.9kV는 변전소 여유 시 조건부) 구간`
            : r.mw <= 40
              ? `40MW까지 ${(40 - r.mw).toFixed(1)}MW — 초과 시 154kV 의무 구간`
              : `154kV 의무 구간 (40MW 초과) — 자체 수전설비 투자 필요`
        return (
          <div className="band-scale">
            <div className="band-track">
              <div className={`band-seg${band === 0 ? ' on' : ''}`} style={{ flex: 10 }}>
                22.9kV<br />≤10MW
              </div>
              <div className={`band-seg${band === 1 ? ' on' : ''}`} style={{ flex: 30 }}>
154kV 원칙<br />10–40
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
            {r.mw > 40 ? <Term k="154kV">{r.track.voltage}</Term> : r.mw <= 10 ? <Term k="22.9kV">{r.track.voltage}</Term> : r.track.voltage}
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
  const [workKey, setWorkKey] = useState('training')
  const [coolKey, setCoolKey] = useState('d2c')
  const [pue, setPue] = useState(COOLING_PRESETS.find((c) => c.key === 'd2c').pue)
  const [redunKey, setRedunKey] = useState('n1')
  const [nonCapital, setNonCapital] = useState(true)
  const [wonPerKwh, setWonPerKwh] = useState(DEFAULT_WON_PER_KWH)
  const [kgco2PerKwh, setKgco2PerKwh] = useState(DEFAULT_KGCO2_PER_KWH)
  const [copied, setCopied] = useState(false)
  // AI 계산 해설: null | 'loading' | { text, usage, streaming } | { error }
  const [ai, setAi] = useState(null)

  const gpu = GPU_PRESETS.find((g) => g.key === gpuKey)
  const work = WORKLOADS.find((w) => w.key === workKey)
  const cooling = COOLING_PRESETS.find((c) => c.key === coolKey)
  const redun = REDUNDANCY.find((r) => r.key === redunKey)

  // 냉각 방식 변경 시 PUE 대표값으로 리셋 (직접 수정하면 그 값 유지)
  const onCooling = (key) => {
    setCoolKey(key)
    setPue(COOLING_PRESETS.find((c) => c.key === key).pue)
  }

  const m = useMemo(() => {
    const it = (count * gpu.kw * work.overhead) / 1000 // 첨두 IT 부하(MW)
    const total = it * pue
    const contract = total * redun.factor
    const racks = Math.ceil((it * 1000) / cooling.rackKw)
    const gwhYear = (total * 8760 * work.loadFactor) / 1000
    const kwhYear = gwhYear * 1e6
    const wonYear = kwhYear * wonPerKwh
    const tco2Year = (kwhYear * kgco2PerKwh) / 1000
    // NVL72 파드 환산(72 GPU/랙) — GB200/GB300 참고 표기용
    const pods = gpu.nvl72 ? count / 72 : null
    return {
      itMw: it,
      totalMw: total,
      contractMw: contract,
      ctaMw: Math.max(1, Math.ceil(contract)),
      racks,
      sqm: Math.ceil(racks * SQM_PER_RACK),
      gwhYear,
      wonYear,
      tco2Year,
      pods,
    }
  }, [count, gpu, work, pue, cooling, redun, wonPerKwh, kgco2PerKwh])

  const candidates = useMemo(
    () =>
      FACILITIES.filter(
        (f) =>
          f.power_mw_public != null &&
          f.power_mw_public >= m.ctaMw &&
          (!nonCapital || !CAPITAL_SIDOS.has(f.sido)),
      ).length,
    [m.ctaMw, nonCapital],
  )

  // 억원 표기 — 10억 미만은 소수1, 이상은 정수
  const eok = (won) => {
    const e = won / 1e8
    return e >= 10 ? `${Math.round(e).toLocaleString()}억원` : `${e.toFixed(1)}억원`
  }

  // 계산 요약(복사·AI 공통) — 계산된 값만(창작 없음)
  const buildSnapshot = () => ({
    GPU모델: gpu.label,
    GPU수량: count,
    ...(m.pods != null ? { NVL72파드환산: Math.round(m.pods * 10) / 10 } : {}),
    워크로드: work.label,
    부대부하계수: work.overhead,
    연간부하율: work.loadFactor,
    냉각방식: cooling.label,
    PUE: pue,
    랙밀도kW: cooling.rackKw,
    이중화: redun.label,
    입지: nonCapital ? '비수도권' : '수도권',
    IT부하MW: Math.round(m.itMw * 10) / 10,
    총부하MW: Math.round(m.totalMw * 10) / 10,
    계약전력MW: Math.round(m.contractMw * 10) / 10,
    필요랙수: m.racks,
    화이트스페이스m2: m.sqm,
    연간전력량GWh: Math.round(m.gwhYear * 10) / 10,
    연간전력비_억원: Math.round(m.wonYear / 1e8),
    전기단가_원per_kWh: wonPerKwh,
    연간탄소_tCO2: Math.round(m.tco2Year),
    배출계수_kgCO2per_kWh: kgco2PerKwh,
    경제성_주의: '전력비·탄소는 편집 가능한 공개 대표 단가/계수 기반 추정(확정 단가 아님)',
  })

  const summaryText = () => {
    const s = buildSnapshot()
    return [
      `# AI InfraMap — GPU 용량 계산 요약`,
      ``,
      `- GPU: ${s.GPU모델} × ${s.GPU수량.toLocaleString()}대${m.pods != null ? ` (NVL72 ${s.NVL72파드환산}파드)` : ''}`,
      `- 워크로드: ${s.워크로드} (부대부하 ${s.부대부하계수} · 부하율 ${s.연간부하율})`,
      `- 냉각: ${s.냉각방식} · PUE ${s.PUE} · ${s.랙밀도kW}kW/랙 · 이중화 ${s.이중화}`,
      ``,
      `## 전력`,
      `- IT 부하 ${s.IT부하MW} MW → 총부하 ${s.총부하MW} MW → 계약전력 ${s.계약전력MW} MW`,
      `- 필요 랙 ${s.필요랙수.toLocaleString()}대 · 화이트스페이스 약 ${s.화이트스페이스m2.toLocaleString()}㎡`,
      ``,
      `## 경제성 (대표값 기반 추정 · 편집 가능)`,
      `- 연간 전력량 약 ${s.연간전력량GWh.toLocaleString()} GWh`,
      `- 연간 전력비 약 ${s.연간전력비_억원.toLocaleString()}억원 (@${s.전기단가_원per_kWh}원/kWh)`,
      `- 연간 탄소 약 ${s.연간탄소_tCO2.toLocaleString()} tCO₂ (@${s.배출계수_kgCO2per_kWh}kgCO₂/kWh)`,
      ``,
      `※ 전력비·탄소는 한전 산업용 대표 단가·국가 전력배출계수 기반 추정으로, 계절·시간대·계약종별로 상이합니다.`,
    ].join('\n')
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* 클립보드 미지원 */
    }
  }

  const genAi = async () => {
    setAi('loading')
    const track = checkPowerTrack(m.contractMw, { nonCapital })
    const snap = {
      ...buildSnapshot(),
      수전전압트랙: track.track.voltage,
      전력계통영향평가: track.psiaRequired ? '대상(10MW+)' : '비대상',
      계통영향평가면제: track.exemption ? `${track.exemption.effective}~ 가능성` : null,
      이_용량_가능_공개시설수: candidates,
    }
    const res = await callAiStream('calc', { query: `${gpu.label} ${count.toLocaleString()}대 ${work.label} 클러스터 계산 결과 해설`, data: snap }, (partial) => setAi({ text: partial, streaming: true }))
    if (res?.available && res.text) setAi({ text: res.text, usage: res.usage })
    else setAi({ error: res?.reason || 'error' })
  }

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="eyebrow">CAPACITY PLANNER</div>
        <h1>GPU → 전력(MW) 계산기</h1>
        <p className="sub">필요 GPU 수량을 데이터센터 전력 수요·상면·연간 전력비·탄소로 환산하고, 그 용량이 가능한 부지를 맵에서 찾습니다.</p>

        <div className="calc-card">
          <div className="calc-grid">
            <label>
              <span className="lbl-cap">GPU 모델</span>
              <select value={gpuKey} onChange={(e) => setGpuKey(e.target.value)}>
                {GPU_PRESETS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.label} ({g.kw}kW)
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="lbl-cap">
                GPU 수량{gpu.nvl72 && m.pods != null ? ` · NVL72 ${(Math.round(m.pods * 10) / 10).toLocaleString()}파드` : ''}
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={count}
                onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
            <label>
              <span className="lbl-cap">워크로드 (부하율 연동)</span>
              <select value={workKey} onChange={(e) => setWorkKey(e.target.value)}>
                {WORKLOADS.map((w) => (
                  <option key={w.key} value={w.key}>
                    {w.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="lbl-cap">냉각 방식 (PUE·랙밀도 연동)</span>
              <select value={coolKey} onChange={(e) => onCooling(e.target.value)}>
                {COOLING_PRESETS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="lbl-cap">
                <Term k="PUE">PUE</Term> · 전력효율지수
              </span>
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
              <span className="lbl-cap">
                수전 여유 · <Term k="이중화">이중화</Term>
              </span>
              <select value={redunKey} onChange={(e) => setRedunKey(e.target.value)}>
                {REDUNDANCY.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="chart-note" style={{ marginTop: 2 }}>
            {work.label}: {work.note} — 첨두 계약전력은 동일하나 <b>연간 전력량·전력비·탄소</b>는 부하율({work.loadFactor})에 좌우됩니다.
          </p>

          <div className="calc-result">
            <div>
              <div className="mw">
                {m.contractMw.toFixed(1)} <small>MW</small>
              </div>
              <div className="geo-note">
                IT {m.itMw.toFixed(1)} × PUE {pue} = {m.totalMw.toFixed(1)} MW × 여유 {redun.factor}
              </div>
            </div>
            <div className="steps">
              {gpu.label} × {count.toLocaleString()}대 × 부대부하 {work.overhead} = IT 부하 → PUE(
              {cooling.label.split(' ')[0]} 기준 {cooling.pue}, 수정 가능) → 이중화 여유까지 반영한{' '}
              <strong>계약전력 관점의 수전 수요</strong>입니다. 프리쿨링 조건이 좋은 입지는 PUE를 낮춰 같은 GPU를 더
              적은 전력으로 돌립니다(기상 레이어, M3 예정).
            </div>
            <Link className="btn primary" to={`/?min_mw=${m.ctaMw}${nonCapital ? '&noncap=1' : ''}`}>
              이 용량 가능한 부지 보기 ({candidates}곳){nonCapital ? ' · 비수도권' : ''} <span className="btn-arrow">↗</span>
            </Link>
          </div>

          <div className="spec-grid" style={{ marginTop: 4 }}>
            <div className="spec-cell">
              <div className="k">필요 랙 (@{cooling.rackKw}kW/랙)</div>
              <div className="v">{m.racks.toLocaleString()}대</div>
            </div>
            <div className="spec-cell">
              <div className="k">추정 <Term k="화이트스페이스">화이트스페이스</Term></div>
              <div className="v">약 {m.sqm.toLocaleString()}㎡</div>
            </div>
            <div className="spec-cell">
              <div className="k">연간 전력 사용량 (부하율 {work.loadFactor})</div>
              <div className="v">약 {m.gwhYear.toFixed(1)} GWh/년</div>
            </div>
            <div className="spec-cell">
              <div className="k">냉각 유량 관점</div>
              <div className="v">{coolKey === 'air' ? '냉수·외기 설비' : coolKey === 'd2c' ? '~1.5L/min·kW' : '~0.3L/min·kW (2상)'}</div>
            </div>
          </div>

          {/* 경제성 — 연간 전력비·탄소(편집 가능한 공개 대표 단가/계수 기반 추정) */}
          <div className="econ-head">
            <span className="chart-title" style={{ margin: 0 }}>경제성·환경 (연간)</span>
            <span className="econ-flag">대표값 기반 추정 · 편집 가능</span>
          </div>
          <div className="spec-grid">
            <div className="spec-cell econ-cell">
              <div className="k">연간 전력비</div>
              <div className="v econ-big">약 {eok(m.wonYear)}</div>
              <div className="cell-basis">
                <label className="econ-inline">
                  단가
                  <input
                    type="number"
                    min="50"
                    max="500"
                    step="5"
                    value={wonPerKwh}
                    onChange={(e) => setWonPerKwh(Math.min(500, Math.max(50, Number(e.target.value) || DEFAULT_WON_PER_KWH)))}
                  />
                  원/kWh
                </label>
                <span> · 한전 산업용(을) 고압 대표대 — 계절·시간대·계약종별 상이(실제는 한전 계약 확인)</span>
              </div>
            </div>
            <div className="spec-cell econ-cell">
              <div className="k">연간 탄소배출</div>
              <div className="v econ-big">약 {Math.round(m.tco2Year).toLocaleString()} tCO₂</div>
              <div className="cell-basis">
                <label className="econ-inline">
                  배출계수
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.001"
                    value={kgco2PerKwh}
                    onChange={(e) => setKgco2PerKwh(Math.min(1, Math.max(0, Number(e.target.value) || DEFAULT_KGCO2_PER_KWH)))}
                  />
                  kgCO₂/kWh
                </label>
                <span> · 국가 전력 온실가스 배출계수 대표치(연도별 갱신) — RE100/PPA로 상쇄 가능</span>
              </div>
            </div>
          </div>

          <div className="card-actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn ai" onClick={genAi} disabled={ai === 'loading'}>
              {ai === 'loading' ? 'AI 해설 작성 중…' : '✨ AI 계산 해설'}
            </button>
            <button type="button" className="btn primary" onClick={onCopy}>
              {copied ? '복사됨 ✓' : '요약 복사'}
            </button>
          </div>

          {/* AI 계산 해설 — 계산된 값만 스냅샷으로 전달(창작 없음) */}
          {ai === 'loading' && (
            <div className="ai-card loading" role="status">
              <span className="sp-spinner" aria-hidden /> 계산 결과로 전력·경제성 해설 작성 중…
            </div>
          )}
          {ai && ai !== 'loading' && ai.text && (
            <div className="ai-card" role="region" aria-label="AI 계산 해설">
              <div className="ai-card-head">
                <span className="ai-badge">✨ AI 계산 해설</span>
                <span className="ai-src">계산값 스냅샷 기반 · 전력비·탄소는 대표값 추정</span>
              </div>
              <AiText text={ai.text} />
              {ai.streaming && <span className="ai-cursor" aria-hidden />}
              {!ai.streaming && (
                <>
                  {ai.usage && <div className="ai-usage">{usageLabel(ai.usage)}</div>}
                  <button type="button" className="ai-regen" onClick={genAi}>다시 생성</button>
                </>
              )}
            </div>
          )}
          {ai && ai !== 'loading' && ai.error && (
            <div className="ai-card err" role="alert">
              {aiReasonLabel(ai.error)}
              {ai.error !== 'not_configured' && (
                <button type="button" className="ai-regen" onClick={genAi}>다시 시도</button>
              )}
            </div>
          )}

          <p className="chart-note">
            랙 밀도·PUE·부하율은 업계 공개 설계 관행의 대표값(수정 가능) — 확정 설계값이 아닌 부지 검토용 근사입니다.
            냉각 방식별 유량·시장 맥락: <Link to="/insights/liquid-cooling-brief">액체냉각 브리프</Link>.
          </p>
        </div>

        <TrackCard mw={m.contractMw} nonCapital={nonCapital} onRegion={setNonCapital} />

        <p className="footer-note">
          공개 전력 규모(power_mw_public)가 확인된 시설만 CTA 필터에 잡힙니다. 규모 비공개 시설이 다수이므로 실제
          후보는 더 많을 수 있습니다.
        </p>
      </main>
    </>
  )
}
