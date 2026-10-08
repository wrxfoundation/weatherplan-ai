import { useMemo, useState } from 'react'
import { Card, CardHeader } from '@/components/Card'
import { RangeInput } from '@/components/RangeInput'
import { MultiLineChart } from '@/components/charts'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'

// WLBN 토크노믹스 시뮬레이터 (PRD §5.M5 원안)
// supply[t] = S0 + Σ(mint − mint·burnRate), reward[t] = mint·0.7·k·0.985^t
const S0 = 20_000_000
const MONTHS = 36
const STORE_KEY = 'kw-tokenomics-scenarios'

type Scenario = { name: string; mint: number; burn: number; k: number }

function loadScenarios(): Scenario[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]') } catch { return [] }
}

const fmtM = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}M` : `${Math.round(v / 1000)}K`

export function TokenomicsSim() {
  const [mint, setMint] = useState(800_000)
  const [burn, setBurn] = useState(30)
  const [k, setK] = useState(1.0)
  const [scenarios, setScenarios] = useState<Scenario[]>(loadScenarios)
  const [name, setName] = useState('')

  const sim = useMemo(() => {
    const supply: number[] = []
    const reward: number[] = []
    let s = S0
    for (let t = 0; t < MONTHS; t++) {
      s += mint - mint * (burn / 100)
      supply.push(s)
      reward.push(mint * 0.7 * k * Math.pow(0.985, t))
    }
    return {
      supply, reward,
      final: supply[MONTHS - 1],
      totalBurn: mint * (burn / 100) * MONTHS,
      rewardM1: reward[0],
      rewardM36: reward[MONTHS - 1],
    }
  }, [mint, burn, k])

  const supplyMax = Math.max(sim.supply[MONTHS - 1], S0 * 1.2)
  const supplyTicks = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round((supplyMax * r) / 1_000_000) * 1_000_000)
  const rewardMax = Math.max(...sim.reward, 100_000)
  const rewardTicks = [0, 0.25, 0.5, 0.75, 1].map(r => Math.round((rewardMax * r) / 50_000) * 50_000)
  const xLabels = ['1', '6', '12', '18', '24', '30', '36개월']

  const save = () => {
    const nm = name.trim() || `시나리오 ${scenarios.length + 1}`
    const next = [...scenarios.filter(s => s.name !== nm), { name: nm, mint, burn, k }].slice(-3)
    setScenarios(next)
    localStorage.setItem(STORE_KEY, JSON.stringify(next))
    setName('')
  }
  const load = (s: Scenario) => { setMint(s.mint); setBurn(s.burn); setK(s.k) }
  const remove = (nm: string) => {
    const next = scenarios.filter(s => s.name !== nm)
    setScenarios(next)
    localStorage.setItem(STORE_KEY, JSON.stringify(next))
  }

  return (
    <Card className="mt-4">
      <CardHeader
        title={<span className="inline-flex items-center gap-2">WLBN 토크노믹스 시뮬레이터 <Pill tone="navy">인터랙티브</Pill></span>}
        formula={'supply[t] = S₀ + Σ(mint − mint·burnRate)\nreward[t] = mint × 0.7 × k × 0.985ᵗ'}
        action={<span className="num text-meta text-mute">초기 유통 S₀ = 20,000,000 <Pill tone="demo">가정치</Pill></span>}
      />
      <div className="grid grid-cols-1 gap-5 px-5 pb-5 xl:grid-cols-[1fr_1.1fr_1.1fr]">
        <div className="space-y-5">
          <RangeInput label="월 발행량" value={mint} valueText={`${fmtM(mint)} WLBN`}
            min={0} max={2_000_000} step={50_000} onChange={setMint} />
          <RangeInput label="소각률 (발행분 대비)" value={burn} valueText={`${burn}%`}
            min={0} max={100} step={5} onChange={setBurn} />
          <RangeInput label="보상 커브 계수 k" value={k} valueText={`× ${k.toFixed(2)}`}
            min={0.5} max={2} step={0.05} onChange={setK} />

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-line-soft p-3 text-center">
              <div className="text-tiny font-medium text-mute">36개월 후 유통량</div>
              <div className="num mt-1 text-[17px] font-bold text-ink">{fmtM(sim.final)}</div>
            </div>
            <div className="rounded-lg border border-line-soft p-3 text-center">
              <div className="text-tiny font-medium text-mute">누적 소각량</div>
              <div className="num mt-1 text-[17px] font-bold text-bad">{fmtM(sim.totalBurn)}</div>
            </div>
            <div className="rounded-lg border border-line-soft p-3 text-center">
              <div className="text-tiny font-medium text-mute">1개월차 보상 예산</div>
              <div className="num mt-1 text-[17px] font-bold text-ink">{fmtM(sim.rewardM1)}</div>
            </div>
            <div className="rounded-lg border border-line-soft p-3 text-center">
              <div className="text-tiny font-medium text-mute">36개월차 보상 예산</div>
              <div className="num mt-1 text-[17px] font-bold text-ink">{fmtM(sim.rewardM36)}</div>
            </div>
          </div>

          <div className="rounded-lg border border-line p-3">
            <div className="text-tiny font-semibold text-mute">시나리오 저장 (최대 3개)</div>
            <div className="mt-2 flex gap-1.5">
              <input value={name} onChange={e => setName(e.target.value)} placeholder="시나리오 이름"
                className="min-w-0 flex-1 rounded-lg border border-line px-2.5 py-1.5 text-label text-ink outline-none placeholder:text-mute focus:border-navy/50" />
              <button type="button" onClick={save}
                className="shrink-0 rounded-lg bg-navy px-3 py-1.5 text-label font-semibold text-white hover:bg-navy-deep transition-colors">저장</button>
            </div>
            {scenarios.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {scenarios.map(s => (
                  <span key={s.name} className="inline-flex items-center gap-1 rounded-full border border-line pl-2.5 pr-1 py-0.5 text-tiny font-semibold text-body">
                    <button type="button" onClick={() => load(s)} className="hover:text-navy" title={`발행 ${fmtM(s.mint)} · 소각 ${s.burn}% · k ${s.k}`}>{s.name}</button>
                    <button type="button" onClick={() => remove(s.name)} aria-label="삭제" className="grid h-4 w-4 place-items-center rounded-full text-mute hover:bg-bad-soft hover:text-bad">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between pb-1">
            <span className="text-label font-semibold text-ink">유통량 예측 (36개월)</span>
            <span className="text-tiny text-mute">(WLBN)</span>
          </div>
          <MultiLineChart height={230} w={460} yTicks={supplyTicks} yFmt={fmtM} xLabels={xLabels}
            seriesList={[{ data: sim.supply, color: '#3E6FE0', dots: false }]} />
          <p className="mt-2 text-tiny font-normal leading-relaxed text-mute">
            소각률이 높을수록 곡선이 눕습니다. 발행 = 소각(100%)이면 유통량이 고정됩니다.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between pb-1">
            <span className="text-label font-semibold text-ink">월 보상 예산 (36개월)</span>
            <span className="text-tiny text-mute">(WLBN)</span>
          </div>
          <MultiLineChart height={230} w={460} yTicks={rewardTicks} yFmt={fmtM} xLabels={xLabels}
            seriesList={[{ data: sim.reward, color: '#2FA870', dots: false }]} />
          <p className="mt-2 text-tiny font-normal leading-relaxed text-mute">
            발행분의 70%가 보상 재원이며, 월 1.5%씩 자연 감쇠하는 반감 커브를 따릅니다.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-line px-6 py-3 text-meta text-mute">
        <Icon name="info" size={13} /> 첫 계약 체결 후 실수치로 재산출하는 협상·기획 도구입니다. 발행 정책 확정 전 가정치 기반 시뮬레이션입니다.
      </div>
    </Card>
  )
}
