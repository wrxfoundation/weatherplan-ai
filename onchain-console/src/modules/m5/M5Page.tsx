import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta, DownloadButton } from '@/components/PageHeader'
import { Donut, MultiLineChart, WaterfallChart } from '@/components/charts'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { m5Demo as d } from '@/demo/generators/m5'
import { TokenomicsSim } from './TokenomicsSim'

export function M5Page() {
  return (
    <>
      <PageHeader
        title="M5 재무 현황"
        subtitle="재무 상태, 수익/비용, 현금흐름 및 자산 현황을 한눈에 확인하세요."
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
        actions={<DownloadButton />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {d.kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label} formula={k.formula}
            value={k.value} delta={k.delta} deltaLabel={k.deltaLabel} spark={k.spark} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1.15fr_1.35fr]">
        <Card>
          <CardHeader
            title={<>손익 현황 <span className="font-medium text-mute">(월별)</span></>}
            action={<GhostButton>6개월 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>}
          />
          <div className="flex items-center justify-between px-5 pb-1">
            <span className="text-meta text-mute">(USD)</span>
            <span className="flex items-center gap-3 whitespace-nowrap text-tiny text-mute">
              <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-navy" /> 매출</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-bad" /> 비용</span>
              <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-ok" /> 순이익</span>
            </span>
          </div>
          <div className="px-4 pb-4">
            <MultiLineChart height={220} w={520}
              yTicks={d.pnl.yTicks} yFmt={v => (v === 0 ? '0' : `${Math.round(v / 1000)}K`)} xLabels={d.pnl.months}
              seriesList={[
                { data: d.pnl.revenue, color: '#3E6FE0', dots: true },
                { data: d.pnl.cost, color: '#E0574F', dots: true },
                { data: d.pnl.profit, color: '#2FA870', dots: true, dashed: true },
              ]} />
          </div>
        </Card>

        <Card>
          <CardHeader title="자산 구성 비율" formula={'자산 항목별 금액 / 총 자산\n가상자산은 월말 환산가 기준'} />
          <div className="flex flex-col items-center gap-3 px-5 pb-5">
            <Donut size={172} thickness={30} centerTop="TOTAL" centerBottom={d.assets.total} centerSub="USD"
              segments={d.assets.segments.map(s => ({ value: s.value, color: s.color }))} />
            <div className="w-full space-y-2">
              {d.assets.segments.map(s => (
                <div key={s.label} className="flex items-center justify-between gap-2 whitespace-nowrap text-tiny font-normal">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-body">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />{s.label}
                  </span>
                  <span className="num shrink-0 font-semibold text-ink">{s.pct} <span className="font-normal text-mute">{s.text}</span></span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title={<>현금흐름 현황 <span className="font-medium text-mute">(누적)</span></>}
            action={<GhostButton>6개월 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>}
          />
          <div className="px-2 pb-1 pl-4 text-meta text-mute">(USD)</div>
          <div className="px-4 pb-4">
            <WaterfallChart steps={d.cashflow.steps} yTicks={d.cashflow.yTicks} height={232} w={520}
              yFmt={v => (v === 0 ? '0' : `${(v / 1000000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}M`)}
              deltaFmt={v => `${v > 0 ? '+' : '−'}${Math.abs(Math.round(v / 1000))}K`} />
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_1.25fr]">
        <Card>
          <CardHeader title={<>재무 상태표 <span className="font-medium text-mute">(요약)</span></>}
            action={<span className="text-meta text-mute">(USD)</span>} />
          <div className="px-4 pb-1">
            <table className="w-full">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">항목</th>
                  <th className="px-2 py-2 text-right font-medium">금액</th>
                  <th className="px-2 py-2 text-right font-medium">구성 비율</th>
                  <th className="px-2 py-2 text-right font-medium">전월 대비</th>
                </tr>
              </thead>
              <tbody>
                {d.balanceSheet.map(r => (
                  <tr key={r.item} className={`whitespace-nowrap border-b border-line-soft ${r.strong ? 'bg-navy-tint/70' : ''}`}>
                    <td className={`px-2 py-2.5 text-label ${r.strong ? 'font-bold text-ink' : 'text-body'}`}>{r.item}</td>
                    <td className={`num px-2 py-2.5 text-right text-label ${r.strong ? 'font-bold text-ink' : 'font-medium text-ink'}`}>{r.amount}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{r.share}</td>
                    <td className={`num px-2 py-2.5 text-right text-label font-semibold ${r.momUp ? 'text-ok' : 'text-bad'}`}>{r.mom}</td>
                  </tr>
                ))}
                <tr className="whitespace-nowrap bg-navy-soft/60">
                  <td className="px-2 py-2.5 text-label font-bold text-navy-deep">{d.equityTotal.item}</td>
                  <td className="num px-2 py-2.5 text-right text-label font-bold text-navy-deep">{d.equityTotal.amount}</td>
                  <td className="num px-2 py-2.5 text-right text-label text-mute">—</td>
                  <td className="num px-2 py-2.5 text-right text-label font-semibold text-ok">{d.equityTotal.mom}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="h-4" />
        </Card>

        <Card>
          <CardHeader title={<>수익/비용 구조 <span className="font-medium text-mute">(YTD)</span></>}
            action={<span className="text-meta text-mute">(USD)</span>} />
          <div className="px-4 pb-4">
            <table className="w-full">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">항목</th>
                  <th className="px-2 py-2 text-right font-medium">금액</th>
                  <th className="px-2 py-2 text-right font-medium">비율</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={3} className="px-2 pb-1 pt-2.5 text-tiny font-semibold text-ok">수익</td></tr>
                {d.income.revenue.map(r => (
                  <tr key={r.item} className="whitespace-nowrap border-b border-line-soft">
                    <td className="px-2 py-2 text-label text-body">{r.item}</td>
                    <td className="num px-2 py-2 text-right text-label font-medium text-ink">{r.amount}</td>
                    <td className="num px-2 py-2 text-right text-label text-body">{r.share}</td>
                  </tr>
                ))}
                <tr className="whitespace-nowrap bg-navy-tint/70">
                  <td className="px-2 py-2 text-label font-bold text-navy-deep">총 수익</td>
                  <td className="num px-2 py-2 text-right text-label font-bold text-navy-deep">{d.income.revenueTotal.amount}</td>
                  <td className="num px-2 py-2 text-right text-label font-semibold text-body">{d.income.revenueTotal.share}</td>
                </tr>
                <tr><td colSpan={3} className="px-2 pb-1 pt-3 text-tiny font-semibold text-bad">비용</td></tr>
                {d.income.cost.map(r => (
                  <tr key={r.item} className="whitespace-nowrap border-b border-line-soft">
                    <td className="px-2 py-2 text-label text-body">{r.item}</td>
                    <td className="num px-2 py-2 text-right text-label font-medium text-ink">{r.amount}</td>
                    <td className="num px-2 py-2 text-right text-label text-body">{r.share}</td>
                  </tr>
                ))}
                <tr className="whitespace-nowrap bg-bad-soft/60">
                  <td className="px-2 py-2 text-label font-bold text-bad">총 비용</td>
                  <td className="num px-2 py-2 text-right text-label font-bold text-bad">{d.income.costTotal.amount}</td>
                  <td className="num px-2 py-2 text-right text-label font-semibold text-body">{d.income.costTotal.share}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="최근 거래 내역"
            action={<button type="button" className="text-meta font-medium text-navy hover:underline">전체 보기</button>} />
          <div className="px-4">
            <table className="w-full">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">날짜</th>
                  <th className="px-2 py-2 font-medium">구분</th>
                  <th className="px-2 py-2 font-medium">내역</th>
                  <th className="px-2 py-2 text-right font-medium">금액 (USD)</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {d.txs.map((t, i) => (
                  <tr key={i} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label text-body">{t.date}</td>
                    <td className="px-2 py-2.5"><Pill tone={t.ok ? 'navy' : 'bad'}>{t.kind}</Pill></td>
                    <td className="px-2 py-2.5 text-label text-body">{t.desc}</td>
                    <td className={`num px-2 py-2.5 text-right text-label font-semibold ${t.ok ? 'text-ink' : 'text-bad'}`}>{t.amount}</td>
                    <td className="px-2 py-2.5 text-label text-body">완료</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 거래 내역 보기</FooterLinkButton>
          </div>
        </Card>
      </div>

      <TokenomicsSim />
    </>
  )
}
