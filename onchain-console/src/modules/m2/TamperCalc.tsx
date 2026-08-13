import { useState } from 'react'
import { Card, CardHeader } from '@/components/Card'
import { RangeInput } from '@/components/RangeInput'
import { Pill } from '@/components/Pill'

// 조작 내성 계산기 (PRD §5.M2) — 파리 공항형 단일 지점 조작이 무력함을 시각화.
// 영향 = (조작폭 × 조작 지점 수) / 활성 지점 수, % = 영향 / 현재값
const ACTIVE = 128  // M2 데모 활성 관측소 수와 정합
const CURRENT = 23.48

export function TamperCalc() {
  const [delta, setDelta] = useState(10)
  const [spots, setSpots] = useState(1)
  const impact = (delta * spots) / ACTIVE
  const pct = (impact / CURRENT) * 100
  const needed = Math.ceil((0.5 * ACTIVE) / Math.max(delta, 0.5)) // 지수를 0.5°C 움직이는 데 필요한 지점 수

  return (
    <Card className="mt-4">
      <CardHeader
        title={<span className="inline-flex items-center gap-2">조작 내성 계산기 <Pill tone="navy">인터랙티브</Pill></span>}
        formula={'영향 = (조작폭 × 조작 지점 수) / 활성 지점 수\n% = 영향 / 현재 지수'}
        action={<span className="text-meta text-mute">활성 관측소 {ACTIVE.toLocaleString('ko-KR')}곳 기준</span>}
      />
      <div className="grid grid-cols-1 gap-5 px-5 pb-5 xl:grid-cols-[1.1fr_1.5fr]">
        <div className="space-y-5">
          <RangeInput label="조작폭 (한 지점을 왜곡하는 온도)" value={delta} valueText={`+${delta.toFixed(1)}°C`}
            min={0} max={20} step={0.5} onChange={setDelta} />
          <RangeInput label="조작 지점 수" value={spots} valueText={`${spots}곳`}
            min={1} max={10} step={1} onChange={setSpots} />
          <p className="rounded-lg border border-line bg-navy-tint px-3.5 py-3 text-meta leading-relaxed text-body">
            공항 온도계 1곳을 조작해 정산을 뒤집는 <b className="font-semibold text-ink">"파리 공항형 공격"</b> 시나리오를 직접 계산해 보세요.
            VWI는 다수 지점의 가중 평균이라 소수 지점 조작은 지수에 거의 반영되지 않으며,
            3σ를 벗어난 값은 애초에 이상치로 제거됩니다.
          </p>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-line-soft p-4 text-center">
              <div className="text-meta font-medium text-body">지수 영향</div>
              <div className="num mt-1.5 text-[24px] font-bold tracking-tight text-ink">+{impact.toFixed(4)}<span className="text-[15px] font-semibold text-mute">°C</span></div>
              <div className="num mt-0.5 text-tiny font-normal text-mute">{CURRENT}°C → {(CURRENT + impact).toFixed(4)}°C</div>
            </div>
            <div className="rounded-lg border border-line-soft p-4 text-center">
              <div className="text-meta font-medium text-body">변화율</div>
              <div className={`num mt-1.5 text-[24px] font-bold tracking-tight ${pct < 0.5 ? 'text-ok' : 'text-warn'}`}>{pct.toFixed(3)}%</div>
              <div className="mt-0.5 text-tiny font-normal text-mute">{pct < 0.5 ? '정산 영향 무시 가능' : '경보·재검증 트리거'}</div>
            </div>
            <div className="rounded-lg border border-line-soft p-4 text-center">
              <div className="text-meta font-medium text-body">0.5°C 왜곡에 필요</div>
              <div className="num mt-1.5 text-[24px] font-bold tracking-tight text-ink">{needed.toLocaleString('ko-KR')}<span className="text-[15px] font-semibold text-mute">곳</span></div>
              <div className="mt-0.5 text-tiny font-normal text-mute">동시 조작 필요 지점 수</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-meta text-mute">
              <span>지수 변화 (현재값 대비, 5% 스케일)</span>
              <span className="num">{pct.toFixed(3)}% / 5%</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line-soft">
              <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${Math.min((pct / 5) * 100, 100)}%` }} />
            </div>
            <p className="mt-3 text-meta leading-relaxed text-mute">
              조작 시도가 반영되더라도 확정값과 산출 근거(payload hash)는 XRPL에 기록되어 사후 검증이 가능합니다.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
