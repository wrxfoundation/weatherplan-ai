import { useState } from 'react'
import { Card, CardHeader } from '@/components/Card'
import { kpiTones, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta } from '@/components/PageHeader'
import { MultiLineChart } from '@/components/charts'
import { Pill, PillTone } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { m9Demo as d } from '@/demo/generators/m9'

const levelTone: Record<string, PillTone> = { 긴급: 'bad', 경고: 'warn', 정보: 'navy' }
const levelIcon: Record<string, { icon: string; cls: string }> = {
  긴급: { icon: 'alert', cls: 'bg-bad-soft text-bad' },
  경고: { icon: 'alert', cls: 'bg-warn-soft text-warn' },
  정보: { icon: 'info', cls: 'bg-navy-soft text-navy' },
}

export function M9Page() {
  const [filter, setFilter] = useState('전체')
  const alerts = filter === '전체' ? d.alerts : d.alerts.filter(a => a.level === filter)

  return (
    <>
      <PageHeader
        title="M9 리포트 & 알림"
        subtitle="중요 운영 리포트와 알림을 한눈에 확인하세요."
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {d.summary.map(s => (
          <Card key={s.label} className="p-5">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${kpiTones[s.tone as KpiTone].chip}`}>
              <Icon name={s.icon} size={17} />
            </span>
            <div className="mt-3 text-label font-medium text-body">{s.label}</div>
            <div className={`num mt-1 text-[24px] font-bold tracking-tight ${s.valueTone}`}>{s.value}</div>
            <div className="mt-1 border-b border-line-soft pb-3 text-meta text-mute">{s.sub}</div>
            <button type="button" className="mt-3 flex items-center gap-1 text-label font-semibold text-navy hover:underline">
              {s.link} <Icon name="chevronRight" size={13} />
            </button>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1.1fr]">
        <Card>
          <CardHeader title="최근 알림"
            action={<button type="button" className="flex items-center gap-1 text-meta font-medium text-navy hover:underline">전체 보기 <Icon name="chevronRight" size={12} /></button>} />
          <div className="flex gap-1.5 px-5 pb-3">
            {['전체', '긴급', '경고', '정보'].map(f => (
              <button key={f} type="button" onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-meta font-semibold transition-colors ${
                  filter === f ? 'border-navy bg-navy text-white' : 'border-line text-body hover:border-navy/40'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="space-y-1.5 px-4">
            {alerts.map(a => (
              <div key={a.title} className="flex items-center gap-3 rounded-lg border border-line-soft px-3 py-2.5">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${levelIcon[a.level].cls}`}>
                  <Icon name={levelIcon[a.level].icon} size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label font-semibold text-ink">{a.title}</span>
                  <span className="block truncate text-tiny font-normal text-mute">{a.sub}</span>
                </span>
                <Pill tone={levelTone[a.level]}>{a.level}</Pill>
                <span className="w-14 shrink-0 text-right text-meta text-mute">{a.ago}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-5 pb-4 pt-3">
            <button type="button" className="flex items-center gap-1.5 text-label font-medium text-body hover:text-navy">
              <Icon name="bell" size={14} /> 알림 설정 관리
            </button>
            <button type="button" className="flex items-center gap-1 text-label font-semibold text-navy hover:underline">
              알림 센터로 이동 <Icon name="chevronRight" size={13} />
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="다가오는 리포트 일정"
            action={<button type="button" className="flex items-center gap-1 text-meta font-medium text-navy hover:underline">전체 일정 <Icon name="chevronRight" size={12} /></button>} />
          <div className="space-y-1.5 px-4 pb-4">
            {d.schedule.map(s => (
              <div key={s.title} className="flex items-center gap-3 rounded-lg border border-line-soft px-3 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-soft text-navy">
                  <Icon name={s.icon} size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label font-semibold text-ink">{s.title}</span>
                  <span className="block truncate text-tiny font-normal text-mute">{s.sub}</span>
                </span>
                <span className="num shrink-0 text-meta text-body">{s.date}</span>
                <Pill tone={s.badgeTone} className="num w-11 justify-center">{s.badge}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title={<>알림 요약 <span className="font-medium text-mute">(지난 7일)</span></>}
          action={<button type="button" className="flex items-center gap-1 text-meta font-medium text-navy hover:underline">차트 보기 <Icon name="chevronRight" size={12} /></button>} />
        <div className="grid grid-cols-1 gap-4 px-5 pb-5 xl:grid-cols-[1.15fr_1fr]">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {d.weekStats.map(s => (
              <div key={s.label} className="rounded-lg border border-line-soft p-3.5">
                <span className={`grid h-7 w-7 place-items-center rounded-lg ${kpiTones[(s.tone === 'bad' ? 'pink' : s.tone === 'warn' ? 'orange' : s.tone === 'ok' ? 'green' : 'navy') as KpiTone].chip}`}>
                  <Icon name={s.icon} size={14} />
                </span>
                <div className="mt-2 text-meta font-medium text-body">{s.label}</div>
                <div className="num mt-1 flex items-baseline gap-2">
                  <b className="text-[22px] font-bold tracking-tight text-ink">{s.value}</b>
                  <span className={`text-tiny font-semibold ${s.deltaTone}`}>{s.delta}</span>
                </div>
                <div className="mt-0.5 text-tiny font-normal text-mute">vs 이전 7일</div>
              </div>
            ))}
          </div>
          <MultiLineChart height={168} w={480}
            yTicks={d.weekChart.yTicks} xLabels={d.weekChart.days}
            seriesList={[{ data: d.weekChart.data, color: '#3E6FE0', dots: true }]} />
        </div>
      </Card>
    </>
  )
}
