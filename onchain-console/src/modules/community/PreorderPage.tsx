import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, GhostButton } from '@/components/Card'
import { PageHeader, UpdatedMeta } from '@/components/PageHeader'
import { Pill, PillTone } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import {
  DEMO_TODAY, SUPPLY_1ST, preorderNow, preorderGoals, trafficPlan, salesFunnel,
  scoreRules, saleGroups, simulateSale, salePlan, saleNowPace, abuseGuards,
  preorderDecisions, salePhases, funnelRisks,
} from '@/demo/generators/community'

const fmt = (n: number) => n.toLocaleString('ko-KR')
const pct1 = (n: number) => `${n.toFixed(1)}%`

/** 목표 대비 달성률 막대 — 100% 이상이면 달성색 */
function GoalBar({ ratio }: { ratio: number }) {
  const w = Math.min(100, Math.max(0, ratio))
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-line-soft">
      <div className={`h-full rounded-full ${ratio >= 100 ? 'bg-ok' : ratio >= 80 ? 'bg-navy' : 'bg-warn'}`} style={{ width: `${w}%` }} />
    </div>
  )
}

export function PreorderPage() {
  return (
    <>
      <PageHeader
        title={<span className="inline-flex flex-wrap items-center gap-2">사전신청 · 판매 퍼널 <Pill tone="demo">데모 기준일 {DEMO_TODAY}</Pill></span>}
        subtitle="접수부터 1차 판매(09-15) · 2차 판매(10-03)까지. 성공 기준은 신청자 수가 아니라 5,000대 완판입니다."
        meta={<UpdatedMeta />}
        actions={<Link to="/community"><GhostButton><Icon name="chevronLeft" size={13} /> 운영 대시보드</GhostButton></Link>}
      />

      <GoalSection />
      <FunnelSection />
      <TrafficSection />
      <SimulatorSection />
      <GroupSection />
      <ScoreSection />
      <DecisionSection />
      <PhaseSection />
      <RiskSection />
    </>
  )
}

// ── ① 목표와 성공 기준 ──────────────────────────────────────────
function GoalSection() {
  return (
    <section className="mb-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {preorderGoals.map(g => {
          const ok = g.pct >= 100
          return (
            <Card key={g.name}>
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-label font-semibold text-body">{g.name}</span>
                  <Pill tone={ok ? 'ok' : g.pct >= 80 ? 'navy' : 'warn'}>{ok ? '달성' : `${g.pct.toFixed(0)}%`}</Pill>
                </div>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="num text-h1 font-extrabold text-ink">
                    {g.unit === '%' ? g.now.toFixed(1) : fmt(g.now)}
                  </span>
                  <span className="text-meta font-semibold text-mute">{g.unit}</span>
                  <span className="num ml-auto text-meta text-mute">목표 {g.target}</span>
                </div>
                <GoalBar ratio={g.pct} />
                <p className="mt-2 text-tiny leading-relaxed text-mute">{g.note}</p>
              </div>
            </Card>
          )
        })}
      </div>
      <div className="mt-3 flex items-start gap-2 rounded-card border border-line bg-navy-tint px-4 py-3 text-meta leading-relaxed text-body">
        <Icon name="info" size={14} className="mt-0.5 shrink-0 text-navy" />
        <span>
          최종 성공 기준은 <b className="font-semibold text-navy">{fmt(SUPPLY_1ST)}대 완판</b>입니다. 신청자 수는 그 선행 지표일 뿐이며,
          신청 10,000명이라도 전환이 30~50%면 실제 결제는 3,000~5,000명에 그칩니다.
        </span>
      </div>
    </section>
  )
}

// ── ② 전체 퍼널 ─────────────────────────────────────────────────
function FunnelSection() {
  const max = salesFunnel[0].goal
  return (
    <Card className="mb-4">
      <CardHeader title="전체 퍼널 (목표 시나리오 vs 현재)"
        formula={'각 단계 전환 = 다음 단계 / 이전 단계\n판매일 접속·결제는 아직 발생 전이라 목표만 표기'} />
      <div className="space-y-2.5 px-5 pb-4">
        {salesFunnel.map(f => {
          const goalW = (f.goal / max) * 100
          const nowW = f.now === null ? 0 : (f.now / max) * 100
          const rate = f.now === null ? null : (f.now / f.goal) * 100
          return (
            <div key={f.step}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-label font-semibold text-ink">
                  {f.step}
                  {f.conv !== null && <span className="num ml-1.5 text-tiny font-semibold text-mute">전환 {f.conv}%</span>}
                </span>
                <span className="num text-meta text-body">
                  {f.now === null
                    ? <span className="text-mute">판매일 예정</span>
                    : <><b className="font-bold text-ink">{fmt(f.now)}</b> / {fmt(f.goal)}</>}
                  {rate !== null && (
                    <b className={`ml-1.5 font-semibold ${rate >= 90 ? 'text-ok' : rate >= 60 ? 'text-navy' : 'text-warn'}`}>
                      {rate.toFixed(0)}%
                    </b>
                  )}
                </span>
              </div>
              <div className="relative mt-1 h-5 overflow-hidden rounded-md bg-line-soft/70">
                <div className="absolute inset-y-0 left-0 rounded-md bg-line" style={{ width: `${goalW}%` }} title={`목표 ${fmt(f.goal)}`} />
                <div className="absolute inset-y-0 left-0 rounded-md bg-navy/85" style={{ width: `${nowW}%` }} />
              </div>
              <p className="mt-1 text-tiny leading-relaxed text-mute">{f.risk}</p>
            </div>
          )
        })}
      </div>
      <div className="border-t border-line bg-bg/50 px-5 py-3 text-meta leading-relaxed text-body">
        <b className="font-semibold text-warn">가장 크게 빠지는 두 구간</b> — 방문→신청에서 약 75%, 신청→결제에서 약 50%가 이탈합니다.
        무료 신청은 문턱이 낮은 만큼 구매 의사도 옅으므로, 신청 단계에서 구매 의사를 한 번 묻고 그 응답률로 전환을 예측합니다.
      </div>
    </Card>
  )
}

// ── ③ 방문 40,000의 경로별 목표 ─────────────────────────────────
function TrafficSection() {
  const goalSum = trafficPlan.reduce((a, b) => a + b.goal, 0)
  const nowSum = trafficPlan.reduce((a, b) => a + b.now, 0)
  const selfGrown = trafficPlan.filter(t => t.path.includes('초대') || t.path.includes('이벤트'))
  const selfGoal = selfGrown.reduce((a, b) => a + b.goal, 0)
  return (
    <Card className="mb-4">
      <CardHeader title={<>방문 {fmt(goalSum)}은 어디서 나오나 <span className="font-medium text-mute">(경로별 목표 대비)</span></>}
        formula={'사전신청 10,000명을 만들려면 방문이 약 4배 필요\n경로별 목표 합계 = 퍼널 출발점'}
        action={<span className="num text-meta text-mute">현재 {fmt(nowSum)} · {pct1((nowSum / goalSum) * 100)}</span>} />
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-label">
          <thead>
            <tr className="border-y border-line bg-bg/60 text-tiny font-semibold text-mute">
              <th className="px-5 py-2 text-left">경로</th>
              <th className="px-3 py-2 text-right">방문 목표</th>
              <th className="px-3 py-2 text-right">현재</th>
              <th className="px-3 py-2 text-left">진도</th>
              <th className="px-5 py-2 text-left">비고</th>
            </tr>
          </thead>
          <tbody>
            {trafficPlan.map(t => {
              const r = (t.now / t.goal) * 100
              return (
                <tr key={t.path} className="border-b border-line-soft last:border-0">
                  <td className="px-5 py-2.5">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} />
                      {t.path}
                      <span className="num text-tiny font-medium text-mute">{t.share}%</span>
                    </span>
                  </td>
                  <td className="num px-3 py-2.5 text-right text-body">{fmt(t.goal)}</td>
                  <td className="num px-3 py-2.5 text-right font-bold text-ink">{fmt(t.now)}</td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-line-soft">
                        <span className={`block h-full rounded-full ${r >= 70 ? 'bg-ok' : r >= 50 ? 'bg-navy' : 'bg-warn'}`} style={{ width: `${Math.min(100, r)}%` }} />
                      </span>
                      <span className="num text-meta text-body">{r.toFixed(0)}%</span>
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-meta leading-relaxed text-mute">{t.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line bg-bg/50 px-5 py-3 text-meta leading-relaxed text-body">
        <b className="font-semibold text-navy">절반이 스스로 자라는 경로</b> — 친구 초대와 이벤트 공유를 합하면 {fmt(selfGoal)},
        전체의 {((selfGoal / goalSum) * 100).toFixed(0)}%입니다. 광고비가 아니라 신청자가 직접 퍼뜨려 생기는 유입입니다.
        다만 씨앗이 없으면 시작되지 않으므로, 자사 채널 물량의 절반 이상을 접수 첫 주에 씁니다.
      </div>
    </Card>
  )
}

// ── ④ 완판 시뮬레이터 ───────────────────────────────────────────
function SimulatorSection() {
  const [signups, setSignups] = useState(preorderNow.signup)
  const [cs, setCs] = useState(80)
  const [ca, setCa] = useState(45)
  const [cb, setCb] = useState(25)
  const [openDemand, setOpenDemand] = useState(2200)
  const r = simulateSale(signups, cs, ca, cb, openDemand)

  const sliders: [string, number, number, number, number, (v: number) => void, string][] = [
    ['최종 신청자 수', signups, 3000, 15000, 100, setSignups, '명'],
    ['S 그룹 전환율', cs, 50, 100, 1, setCs, '%'],
    ['A 그룹 전환율', ca, 20, 80, 1, setCa, '%'],
    ['B 그룹 전환율', cb, 5, 60, 1, setCb, '%'],
    ['일반 공개 수요', openDemand, 0, 5000, 100, setOpenDemand, '명'],
  ]

  return (
    <Card className="mb-4">
      <CardHeader title="완판 시뮬레이터"
        badge={<Pill tone="navy">판매일 09-15</Pill>}
        formula={'그룹 수요 = 그룹 인원 × 전환율\n판매 = min(배정 물량, 수요)\n앞 그룹 잔여는 뒤 그룹이 아니라 오후 일반 공개로 이월\nA : B 인원비 = 1 : 2 (기획안 3,000 : 6,000)'}
        action={
          <button type="button" onClick={() => { setSignups(10000); setCs(80); setCa(45); setCb(25); setOpenDemand(2200) }}
            className="rounded-lg border border-line px-2.5 py-1 text-meta font-semibold text-body transition-colors hover:border-navy/50 hover:text-navy">
            기획안 가정으로
          </button>
        } />

      <div className="grid grid-cols-1 gap-5 px-5 py-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-3">
          {sliders.map(([label, val, min, max, step, set, unit]) => (
            <div key={label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-meta font-semibold text-body">{label}</span>
                <span className="num text-label font-bold text-navy">{fmt(val)}{unit}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(Number(e.target.value))}
                className="mt-1 w-full accent-navy" aria-label={label} />
            </div>
          ))}
          <div className="rounded-lg border border-line-soft bg-bg/60 px-3 py-2.5 text-tiny leading-relaxed text-mute">
            기본값은 현재 신청자 수 기준입니다. 기획안 가정(신청 10,000 · 80/45/25 · 일반 수요 2,200)에서는
            정확히 {fmt(salePlan.total)}대로 완판됩니다.
          </div>
        </div>

        <div>
          <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-card border px-4 py-3 ${
            r.soldOut ? 'border-ok/40 bg-ok-soft/50' : 'border-warn/40 bg-warn-soft/40'}`}>
            <span className="text-label font-semibold text-body">예상 판매</span>
            <span className="num text-h1 font-extrabold text-ink">{fmt(r.total)}</span>
            <span className="num text-label text-mute">/ {fmt(SUPPLY_1ST)}대</span>
            <span className="ml-auto">
              <Pill tone={r.soldOut ? 'ok' : 'warn'}>{r.soldOut ? '완판' : `미달 ${fmt(r.gap)}대`}</Pill>
            </span>
          </div>

          <div className="mt-3 overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[540px] text-label">
              <thead>
                <tr className="border-y border-line bg-bg/60 text-tiny font-semibold text-mute">
                  <th className="px-3 py-2 text-left">시각 · 대상</th>
                  <th className="px-3 py-2 text-right">인원</th>
                  <th className="px-3 py-2 text-right">배정</th>
                  <th className="px-3 py-2 text-right">수요</th>
                  <th className="px-3 py-2 text-right">예상 결제</th>
                  <th className="px-3 py-2 text-right">잔여</th>
                </tr>
              </thead>
              <tbody>
                {r.legs.map((leg, i) => {
                  const g = saleGroups[i]
                  return (
                    <tr key={g.key} className="border-b border-line-soft">
                      <td className="px-3 py-2.5">
                        <b className="font-semibold text-ink">{g.name}</b>
                        <span className="ml-1.5 text-tiny text-mute">{g.open}</span>
                      </td>
                      <td className="num px-3 py-2.5 text-right text-body">{fmt(leg.size)}</td>
                      <td className="num px-3 py-2.5 text-right text-body">{fmt(leg.alloc)}</td>
                      <td className="num px-3 py-2.5 text-right text-body">
                        {fmt(leg.demand)}
                        {leg.unmet > 0 && <span className="ml-1 text-tiny font-semibold text-warn">+{fmt(leg.unmet)} 초과</span>}
                      </td>
                      <td className="num px-3 py-2.5 text-right font-bold text-ink">{fmt(leg.sold)}</td>
                      <td className="num px-3 py-2.5 text-right text-mute">{fmt(leg.left)}</td>
                    </tr>
                  )
                })}
                <tr className="border-b border-line-soft bg-bg/40">
                  <td className="px-3 py-2.5 font-semibold text-body">오전 소계 <span className="text-tiny font-normal text-mute">사전신청자</span></td>
                  <td className="num px-3 py-2.5 text-right text-mute">—</td>
                  <td className="num px-3 py-2.5 text-right text-body">3,500</td>
                  <td className="num px-3 py-2.5 text-right text-mute">—</td>
                  <td className="num px-3 py-2.5 text-right font-bold text-ink">{fmt(r.morningSold)}</td>
                  <td className="num px-3 py-2.5 text-right font-semibold text-navy">{fmt(r.carry)} 이월</td>
                </tr>
                <tr className="border-b border-line-soft">
                  <td className="px-3 py-2.5">
                    <b className="font-semibold text-ink">일반 공개</b>
                    <span className="ml-1.5 text-tiny text-mute">오후 · 오전 잔여 합산</span>
                  </td>
                  <td className="num px-3 py-2.5 text-right text-mute">—</td>
                  <td className="num px-3 py-2.5 text-right text-body">{fmt(r.openAlloc)}</td>
                  <td className="num px-3 py-2.5 text-right text-body">{fmt(r.openDemand)}</td>
                  <td className="num px-3 py-2.5 text-right font-bold text-ink">{fmt(r.openSold)}</td>
                  <td className="num px-3 py-2.5 text-right text-mute">{fmt(r.openAlloc - r.openSold)}</td>
                </tr>
                <tr className="bg-navy-tint">
                  <td className="px-3 py-2.5 font-bold text-navy-deep">합계</td>
                  <td className="num px-3 py-2.5 text-right text-mute">—</td>
                  <td className="num px-3 py-2.5 text-right font-semibold text-navy-deep">{fmt(SUPPLY_1ST)}</td>
                  <td className="num px-3 py-2.5 text-right text-mute">—</td>
                  <td className="num px-3 py-2.5 text-right font-extrabold text-navy-deep">{fmt(r.total)}</td>
                  <td className="num px-3 py-2.5 text-right font-semibold text-navy-deep">{fmt(Math.max(0, SUPPLY_1ST - r.total))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-2.5 text-meta leading-relaxed text-mute">
            2차 판매(10-03) 대기 수요 <b className="num font-semibold text-body">{fmt(r.waitlist)}명</b> —
            1차에서 사지 못한 신청자는 재신청 없이 우선 대상으로 넘어갑니다.
          </p>
        </div>
      </div>

      <div className="border-t border-line bg-bg/50 px-5 py-3 text-meta leading-relaxed text-body">
        <b className="font-semibold text-navy">현재 진도가 그대로 이어지면</b> {fmt(saleNowPace.total)}대 —
        {saleNowPace.soldOut
          ? ' 완판입니다.'
          : ` ${fmt(saleNowPace.gap)}대가 미달입니다.`}
        {' '}신청자를 10,000명에서 15,000명으로 늘리는 것보다 전환율을 몇 %p 올리는 쪽이 훨씬 적은 비용으로 같은 결과를 냅니다 —
        신청 화면의 문항 하나와 문자 두 번으로 가능한 일입니다.
      </div>
    </Card>
  )
}

// ── ⑤ 그룹 성격과 응대 ──────────────────────────────────────────
function GroupSection() {
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {saleGroups.map(g => (
        <Card key={g.key}>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-h3 text-ink">{g.name}</span>
              <Pill tone={g.tone as PillTone}>{g.open}</Pill>
            </div>
            <p className="mt-1 text-meta leading-relaxed text-body">{g.who}</p>
            <div className="mt-3 flex items-baseline gap-1.5 border-t border-line-soft pt-3">
              <span className="num text-h2 font-extrabold text-ink">{fmt(g.alloc)}</span>
              <span className="text-meta font-semibold text-mute">대 배정</span>
              <span className="num ml-auto text-meta font-semibold text-navy">전환 {g.convLabel}</span>
            </div>
            <p className="mt-2 text-tiny leading-relaxed text-mute">{g.character}</p>
            <div className="mt-3 rounded-lg border border-line-soft bg-bg/60 px-3 py-2.5">
              <div className="text-tiny font-semibold text-mute">무엇을 궁금해하나</div>
              <div className="mt-0.5 text-meta font-semibold text-ink">{g.ask}</div>
              <div className="mt-1.5 text-tiny leading-relaxed text-body">{g.prepare}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ── ⑥ 점수제 + 어뷰징 방어 ──────────────────────────────────────
function ScoreSection() {
  const caught = abuseGuards.reduce((a, b) => a + b.caught, 0)
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader title="순번 점수제"
          formula={'순번 = 점수 내림차순 (동점이면 신청 시각 순)\n신청 시각만으로 줄을 세우면 늦게 온 사람이 할 수 있는 일이 없음'} />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[420px] text-label">
            <tbody>
              {scoreRules.map(s => (
                <tr key={s.item} className="border-b border-line-soft last:border-0">
                  <td className="px-5 py-2.5 font-semibold text-ink">
                    {s.item}
                    {s.auto && <Pill tone="ok" className="ml-1.5">자동 확인</Pill>}
                  </td>
                  <td className="num whitespace-nowrap px-3 py-2.5 text-right font-bold text-navy">{s.score}</td>
                  <td className="px-5 py-2.5 text-meta leading-relaxed text-mute">{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line bg-bg/50 px-5 py-3 text-meta leading-relaxed text-body">
          순번은 숫자가 아니라 <b className="font-semibold text-navy">그룹</b>으로 보여 줍니다. 「3,247번」이라고 알려 주면 대부분 포기하지만
          「B 그룹」은 덜 절망적이고 올리려는 동기도 남습니다. 내 위치는 상위 몇 퍼센트로만 표기합니다.
        </div>
      </Card>

      <Card>
        <CardHeader title="어뷰징 방어"
          badge={<Pill tone="navy">누적 차단 {fmt(caught)}건</Pill>}
          formula={'적발 시 처리 기준은 접수 시작 전 공지에 포함\n사후에 기준을 만들면 항의를 감당하기 어려움'} />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[520px] text-label">
            <thead>
              <tr className="border-y border-line bg-bg/60 text-tiny font-semibold text-mute">
                <th className="px-5 py-2 text-left">수법</th>
                <th className="px-3 py-2 text-left">대응</th>
                <th className="px-5 py-2 text-right">차단</th>
              </tr>
            </thead>
            <tbody>
              {abuseGuards.map(a => (
                <tr key={a.trick} className="border-b border-line-soft last:border-0">
                  <td className="px-5 py-2.5">
                    <b className="font-semibold text-ink">{a.trick}</b>
                    <div className="text-tiny leading-relaxed text-mute">{a.how}</div>
                  </td>
                  <td className="px-3 py-2.5 text-meta leading-relaxed text-body">{a.guard}</td>
                  <td className="num px-5 py-2.5 text-right font-bold text-ink">{fmt(a.caught)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ── ⑦ 확정 항목 ────────────────────────────────────────────────
function DecisionSection() {
  const tone: Record<string, PillTone> = { 확정: 'ok', '법률 검토 완료': 'navy', 유지: 'mute' }
  return (
    <Card className="mb-4">
      <CardHeader title="확정 항목 이력"
        formula={'점수 배점·배정 비율·추첨 물량은 페이지 기능에 직접 반영\n08-19 확정 → 08-24 페이지 완비'} />
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px] text-label">
          <thead>
            <tr className="border-y border-line bg-bg/60 text-tiny font-semibold text-mute">
              <th className="px-5 py-2 text-left">항목</th>
              <th className="px-3 py-2 text-left">확정 내용</th>
              <th className="px-3 py-2 text-left">확정일</th>
              <th className="px-3 py-2 text-left">상태</th>
              <th className="px-5 py-2 text-left">비고</th>
            </tr>
          </thead>
          <tbody>
            {preorderDecisions.map(d => (
              <tr key={d.item} className="border-b border-line-soft last:border-0">
                <td className="px-5 py-2.5 font-semibold text-ink">{d.item}</td>
                <td className="num px-3 py-2.5 text-meta text-body">{d.value}</td>
                <td className="num px-3 py-2.5 text-meta text-mute">{d.fixedAt}</td>
                <td className="px-3 py-2.5"><Pill tone={tone[d.state] ?? 'mute'}>{d.state}</Pill></td>
                <td className="px-5 py-2.5 text-meta leading-relaxed text-mute">{d.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-line bg-bg/50 px-5 py-3 text-meta leading-relaxed text-body">
        배정 비율은 접수 첫날 숫자로 공개했고 판매일까지 바꾸지 않습니다.
        S 그룹 완료자가 1,000명에 못 미칠 때 잔여가 A로 넘어간다는 규칙도 접수 시작 공지에 미리 넣어 두었습니다 —
        판매일에 즉흥적으로 적용하면 「왜 갑자기 바꾸느냐」가 나옵니다.
      </div>
    </Card>
  )
}

// ── ⑧ 1차 · 2차 ────────────────────────────────────────────────
function PhaseSection() {
  const stateTone: Record<string, PillTone> = { '개발 완료': 'ok', '편성 예정': 'navy', '문안 준비': 'warn' }
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Card>
        <CardHeader title="1차 · 2차 판매 비교" formula={'2차 물량은 1차 실적을 보고 결정\n대기 수요 = 신청자 − 1차 오전 결제'} />
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[560px] text-label">
            <thead>
              <tr className="border-y border-line bg-bg/60 text-tiny font-semibold text-mute">
                <th className="px-5 py-2 text-left">구분</th>
                <th className="px-3 py-2 text-left">1차 — 09-15</th>
                <th className="px-5 py-2 text-left">2차 — 10-03</th>
              </tr>
            </thead>
            <tbody>
              {salePhases.rows.map(r => (
                <tr key={r.label} className="border-b border-line-soft last:border-0">
                  <td className="px-5 py-2.5 font-semibold text-mute">{r.label}</td>
                  <td className="px-3 py-2.5 text-body">{r.first}</td>
                  <td className="px-5 py-2.5 text-body">{r.second}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader title="두 판매를 잇는 장치" formula={'1차 구매자가 아직 제품을 받지 못한 상태에서 2차를 열기 때문에\n신뢰 관리 장치가 먼저 준비되어야 함'} />
        <div className="space-y-2.5 px-5 pb-4">
          {salePhases.bridges.map(b => (
            <div key={b.name} className="rounded-lg border border-line-soft bg-bg/60 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label font-semibold text-ink">{b.name}</span>
                <Pill tone={stateTone[b.state] ?? 'mute'}>{b.state}</Pill>
              </div>
              <p className="mt-1 text-meta leading-relaxed text-body">{b.detail}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── ⑨ 구간별 위험 ──────────────────────────────────────────────
function RiskSection() {
  const tone: Record<string, PillTone> = { 지남: 'mute', '진행 중': 'warn', 대기: 'navy' }
  return (
    <Card className="mb-4">
      <CardHeader title="구간별 위험과 대응" formula={'퍼널 각 구간에서 실제로 무너지는 지점과 사전 대응\n상태는 데모 기준일(09-08) 기준'} />
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[680px] text-label">
          <thead>
            <tr className="border-y border-line bg-bg/60 text-tiny font-semibold text-mute">
              <th className="px-5 py-2 text-left">구간</th>
              <th className="px-3 py-2 text-left">위험</th>
              <th className="px-3 py-2 text-left">대응</th>
              <th className="px-5 py-2 text-left">상태</th>
            </tr>
          </thead>
          <tbody>
            {funnelRisks.map(r => (
              <tr key={r.phase} className="border-b border-line-soft last:border-0">
                <td className="px-5 py-2.5 font-semibold text-ink">{r.phase}</td>
                <td className="px-3 py-2.5 text-body">{r.risk}</td>
                <td className="px-3 py-2.5 text-meta leading-relaxed text-mute">{r.act}</td>
                <td className="px-5 py-2.5"><Pill tone={tone[r.state] ?? 'mute'}>{r.state}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
