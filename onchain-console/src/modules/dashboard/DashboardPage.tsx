import { Link } from 'react-router-dom'
import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard } from '@/components/KpiCard'
import { GovernanceStrip } from './GovernanceStrip'
import { PageHeader, UpdatedMeta, DownloadButton } from '@/components/PageHeader'
import { FlowSankey } from '@/components/FlowSankey'
import { LineChart, AreaChart, Donut } from '@/components/charts'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { dashboardDemo as d } from '@/demo/generators/dashboard'

const alertTone = { bad: 'bg-bad', navy: 'bg-navy', warn: 'bg-amber' } as const

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="온체인 운영 대시보드"
        subtitle="XRPL · RLUSD · WLBN · DePIN · 정산지수 통합 관제"
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
        actions={<DownloadButton />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {d.kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} label={k.label} formula={k.formula}
            value={k.value} delta={k.delta} deltaLabel={k.deltaLabel ?? 'vs 어제'} spark={k.spark} />
        ))}
      </div>

      <GovernanceStrip />

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1.4fr_1fr]">
        <Card>
          <CardHeader
            title={<>M3 결제/정산 흐름 <span className="font-medium text-mute">(7D)</span></>}
            action={<Link to="/m3"><GhostButton>상세 보기</GhostButton></Link>}
          />
          <div className="px-4 pb-4">
            <FlowSankey big height={300} left={d.flow.left} center={d.flow.center} right={d.flow.right} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title={<>M2 정산 지수 <span className="font-medium text-mute">(VWI-SEOUL-TEMP)</span></>}
            action={
              <span className="text-right leading-tight">
                <span className="num block text-[19px] font-bold text-ink">{d.vwi.current}</span>
                <span className="num block text-meta font-semibold text-ok">{d.vwi.delta}</span>
              </span>
            }
          />
          <div className="px-4">
            <LineChart data={d.vwi.seriesData} height={190} yTicks={[20, 22, 24, 26]} unit="°C"
              xLabels={['08-02', '08-03', '08-04', '08-05', '08-06', '08-07', '08-08']} dashedY={d.vwi.dashedY} />
          </div>
          <div className="flex items-center justify-between gap-3 px-5 pb-4 pt-3">
            <div className="grid flex-1 grid-cols-4 divide-x divide-line rounded-lg border border-line">
              {d.vwi.stats.map(s => (
                <div key={s.label} className="px-1.5 py-2 text-center">
                  <div className="whitespace-nowrap text-tiny font-medium text-mute">{s.label}</div>
                  <div className="num mt-0.5 text-label font-bold text-ink">{s.value}</div>
                </div>
              ))}
            </div>
            <Link to="/m2"><GhostButton>지수 상세 →</GhostButton></Link>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="M4 부정 탐지 큐"
            action={<span className="text-meta text-mute">전체 <b className="num text-label font-bold text-bad">{d.fraudQueue.total}</b></span>}
          />
          <div className="space-y-1.5 px-4">
            {d.fraudQueue.rows.map(r => (
              <div key={r.ref} className="flex items-center justify-between gap-1.5 whitespace-nowrap rounded-lg border border-line-soft px-2.5 py-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <Pill tone={r.level}>{r.level}</Pill>
                  <span className="num truncate text-label font-semibold text-ink">{r.ref}</span>
                </span>
                <span className="num flex shrink-0 items-center gap-2.5 text-meta text-body">
                  <span>디바이스 {r.devices}</span>
                  <span>σ {r.sigma}</span>
                  <span className="text-mute">{r.status}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 보기</FooterLinkButton>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1.75fr_1fr]">
        <Card>
          <CardHeader title={<>M7 소셜 감성 요약 <span className="font-medium text-mute">(7D)</span></>} />
          <div className="flex items-center gap-6 px-5 pb-2">
            <Donut size={160} thickness={30} segments={d.sentiment.segments.map(s => ({ value: s.value, color: s.color }))} />
            <div className="flex-1 space-y-2.5">
              {d.sentiment.segments.map(s => (
                <div key={s.label} className="flex items-center justify-between text-label">
                  <span className="flex items-center gap-2 text-body">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}
                  </span>
                  <span className="num font-semibold text-ink">{s.pct} <span className="font-normal text-mute">({s.count})</span></span>
                </div>
              ))}
              <div className="border-t border-line-soft pt-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-label">
                  <span className="text-body">총 멘션</span><b className="num text-ink">{d.sentiment.totalMentions}</b>
                </div>
                <div className="flex items-center justify-between text-label">
                  <span className="text-body">KOL 멘션</span><b className="num text-ink">{d.sentiment.kolMentions}</b>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 pt-2">
            <FooterLinkButton>상세 분석</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title="M8 토큰 홀더 현황" />
          <div className="grid grid-cols-4 divide-x divide-line-soft px-4">
            {d.holders.stats.map(s => (
              <div key={s.label} className="px-3 py-1">
                <div className="text-meta font-medium text-mute">{s.label}</div>
                <div className="num mt-1 text-[21px] font-bold tracking-tight text-ink">{s.value}</div>
                <div className={`num mt-0.5 text-meta font-semibold ${s.tone === 'ok' ? 'text-ok' : 'text-bad'}`}>{s.delta}</div>
              </div>
            ))}
          </div>
          <div className="px-4 pt-2">
            <AreaChart data={d.holders.seriesData} height={150} yTicks={[18000, 20000, 22000, 24000]}
              yFmt={v => `${Math.round(v / 1000)}K`} xLabels={['07-09', '07-16', '07-23', '07-30', '08-06']} />
          </div>
          <div className="px-4 pb-4 pt-2">
            <FooterLinkButton>상세 보기</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title="알림 센터"
            action={<button type="button" className="text-mute hover:text-navy transition-colors" aria-label="알림 설정"><Icon name="gear" size={15} /></button>} />
          <div className="space-y-1.5 px-4">
            {d.alerts.map(a => (
              <div key={a.message} className="flex items-center gap-2.5 rounded-lg border border-line-soft px-2.5 py-2.5">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-white ${alertTone[a.tone]}`}>
                  <Icon name="alert" size={11} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 truncate whitespace-nowrap">
                  <b className="mr-1.5 text-label font-bold text-ink">{a.module}</b>
                  <span className="text-label text-body">{a.message}</span>
                </span>
                <span className="shrink-0 text-meta text-mute">{a.ago}</span>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 알림 보기</FooterLinkButton>
          </div>
        </Card>
      </div>
    </>
  )
}
