import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta, DownloadButton } from '@/components/PageHeader'
import { FlowSankey } from '@/components/FlowSankey'
import { Donut, MultiLineChart, BarLineChart } from '@/components/charts'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { FormulaTip } from '@/components/FormulaTip'
import { m3Demo as d } from '@/demo/generators/m3'
import { X402Demo } from './X402Demo'

function HashLink({ text }: { text: string }) {
  return (
    <span className="num inline-flex cursor-pointer items-center gap-1 text-label font-medium text-navy hover:underline" title="XRPL 익스플로러 (데모)">
      {text} <Icon name="external" size={11} />
    </span>
  )
}

function DonutLegend({ total, unit, segments }: {
  total: string
  unit: string
  segments: { label: string; text: string; value: number; color: string }[]
}) {
  return (
    <div className="flex items-center gap-5 px-5 pb-5">
      <Donut size={140} thickness={24} centerTop={unit} centerBottom={total}
        segments={segments.map(s => ({ value: Math.max(s.value, 0.001), color: s.color }))} />
      <div className="flex-1 space-y-2.5">
        {segments.map(s => (
          <div key={s.label} className="text-meta">
            <span className="flex items-center gap-1.5 text-body">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />{s.label}
            </span>
            <div className="num pl-3.5 font-semibold text-ink">{s.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function M3Page() {
  return (
    <>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">M3 결제/정산 <FormulaTip formula={'우리 지갑(ours_%) 관련 tx_events 기반\n수취·지급·순유입 집계 (7D)'} /></span>}
        subtitle="XRPL을 통한 제품 결제 수취, 샵 지갑 정산, 파트너/운영비 지출 흐름을 모니터링합니다."
        meta={<UpdatedMeta text={`최근 업데이트: ${d.updatedAgo}`} />}
        actions={<DownloadButton />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {d.kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} label={k.label} formula={k.formula}
            value={k.value} unit={k.unit || undefined} sub={k.sub}
            delta={k.delta} spark={k.spark} />
        ))}
      </div>

      <X402Demo />

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1.55fr_1fr]">
        <Card>
          <CardHeader
            title={<>결제/정산 흐름 <span className="font-medium text-mute">(최근 7일)</span></>}
            action={<GhostButton>XRP 기준 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>}
          />
          <div className="flex justify-between px-6 text-meta font-semibold text-mute">
            <span>수취 채널</span><span>지출 목적지</span>
          </div>
          <div className="px-3 pb-2">
            <FlowSankey height={330} left={d.flow.left} center={d.flow.center} right={d.flow.right} />
          </div>
          <div className="mx-4 mb-4 grid grid-cols-2 divide-x divide-line rounded-lg border border-line text-center">
            <div className="num px-3 py-2 text-label text-body">{d.flow.totalIn}</div>
            <div className="num px-3 py-2 text-label text-body">{d.flow.totalOut}</div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="최근 트랜잭션"
            action={
              <span className="flex items-center gap-2">
                <GhostButton>전체 방향 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
                <GhostButton><span className="num">2026-08-02 ~ 2026-08-08</span></GhostButton>
                <button type="button" className="text-meta font-medium text-navy hover:underline">더보기 →</button>
              </span>
            }
          />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[540px]">
              <thead>
                <tr className="border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">시간 (KST)</th>
                  <th className="px-2 py-2 font-medium">방향</th>
                  <th className="px-2 py-2 font-medium">거래 해시</th>
                  <th className="px-2 py-2 font-medium">상대 지갑 / 메모</th>
                  <th className="px-2 py-2 text-right font-medium">금액 (XRP)</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {d.txs.map(t => (
                  <tr key={t.hash} className="border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label text-body">{t.time}</td>
                    <td className="px-2 py-2.5"><Pill tone={t.dir === '수취' ? 'navy' : 'bad'}>{t.dir}</Pill></td>
                    <td className="px-2 py-2.5"><HashLink text={t.hash} /></td>
                    <td className="px-2 py-2.5">
                      <div className="text-label font-medium text-ink">{t.party}</div>
                      <div className="num text-tiny font-normal text-mute">{t.memo}</div>
                    </td>
                    <td className={`num px-2 py-2.5 text-right text-label font-semibold ${t.amount.startsWith('+') ? 'text-ink' : 'text-bad'}`}>{t.amount}</td>
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-1.5 text-label text-body"><span className="h-1.5 w-1.5 rounded-full bg-ok" /> 성공</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 보기 →</FooterLinkButton>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title={<>지출 분포 <span className="font-medium text-mute">(최근 7일)</span></>}
              formula={'sum(amount) where direction=out\ngroup by 지출 목적지'} />
            <DonutLegend total={d.spend.total} unit="XRP" segments={d.spend.segments} />
          </Card>
          <Card>
            <CardHeader title="3D 지연 시간 (p95)" formula={'p95(closed_at − submitted_at)\n최근 3일 롤링'}
              action={<span className="text-meta text-mute">{d.latency.unit}</span>} />
            <div className="px-5">
              <div className="num text-[21px] font-bold tracking-tight text-ink">{d.latency.headline}</div>
              <div className="num mt-0.5 text-meta"><b className="font-semibold text-ok">−0.8초</b> <span className="text-mute">vs 3D 평균</span></div>
            </div>
            <div className="flex items-center justify-end gap-3 whitespace-nowrap px-5 pt-1 text-tiny text-mute">
              <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-[#C9D2E2]" /> p50</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-navy" /> p95</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-[#8F7BE8]" /> p99</span>
            </div>
            <div className="px-4 pb-4">
              <MultiLineChart height={150} w={430}
                yTicks={d.latency.yTicks} yFmt={v => `${v}분`} xLabels={d.latency.xLabels}
                seriesList={[
                  { data: d.latency.p50, color: '#C9D2E2', dashed: true },
                  { data: d.latency.p95, color: '#3E6FE0' },
                  { data: d.latency.p99, color: '#8F7BE8', dashed: true },
                ]} />
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1.15fr_1.15fr_1fr]">
        <Card>
          <CardHeader title={<>수취/지급 추이 <span className="font-medium text-mute">(최근 7일)</span></>} />
          <div className="flex items-center justify-end gap-3 whitespace-nowrap px-5 pb-1 text-tiny text-mute">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-navy" /> 수취 (XRP)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#9DC2F5]" /> 지급 (XRP)</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[#5BC8D8]" /> 순 유입 (XRP)</span>
          </div>
          <div className="px-4 pb-4">
            <BarLineChart height={220}
              bars={[{ data: d.trend.recv, color: '#3E6FE0' }, { data: d.trend.pay, color: '#9DC2F5' }]}
              line={{ data: d.trend.net, color: '#5BC8D8' }}
              xLabels={d.trend.days} yTicks={d.trend.yTicks}
              yFmt={v => (v === 0 ? '0' : `${Math.round(v / 1000)}K`)} />
          </div>
        </Card>

        <Card>
          <CardHeader title={<>결제 수단 비중 <span className="font-medium text-mute">(최근 7일)</span></>}
            formula={'sum(amount) where direction=in\ngroup by 수취 채널'} />
          <DonutLegend total={d.methods.total} unit="XRP" segments={d.methods.segments} />
        </Card>

        <Card>
          <CardHeader title="주요 메모 태그 TOP 5" formula={'count·sum(amount)\ngroup by 메모 태그 prefix'} />
          <div className="px-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">메모 / 태그</th>
                  <th className="px-2 py-2 text-right font-medium">건수</th>
                  <th className="px-2 py-2 text-right font-medium">금액 (XRP)</th>
                </tr>
              </thead>
              <tbody>
                {d.memoTags.map(t => (
                  <tr key={t.tag} className="border-b border-line-soft last:border-0">
                    <td className="px-2 py-2.5">
                      <span className="num text-label font-semibold text-ink">{t.tag}</span>
                      {t.desc && <span className="ml-1 text-meta text-mute">{t.desc}</span>}
                    </td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{t.count}</td>
                    <td className="num px-2 py-2.5 text-right text-label font-semibold text-ink">{t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 보기 →</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title="이상 거래 알림" badge={<Pill tone="bad" className="num">{d.anomalies.count}건</Pill>} />
          <div className="space-y-2 px-4">
            {d.anomalies.rows.map(a => (
              <div key={a.title} className="whitespace-nowrap rounded-lg border border-line-soft px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-label font-semibold text-ink">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bad" />{a.title}
                  </span>
                  <b className="num shrink-0 text-label font-bold text-ink">{a.amount}</b>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 pl-3 text-tiny font-normal text-mute">
                  <span className="flex min-w-0 items-center gap-1.5 truncate"><span className="h-1 w-1 shrink-0 rounded-full bg-mute/50" />{a.source}</span>
                  <span className="num shrink-0">{a.at}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 알림 보기 →</FooterLinkButton>
          </div>
        </Card>
      </div>
    </>
  )
}
