import { Link } from 'react-router-dom'
import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta } from '@/components/PageHeader'
import { Donut, MultiLineChart } from '@/components/charts'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { m6Demo as d, tierPill } from '@/demo/generators/m6'

function DonutBlock({ title, formula, total, sub, segments, action }: {
  title: React.ReactNode
  formula?: string
  total: string
  sub: string
  segments: { label: string; text: string; value: number; color: string }[]
  action?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader title={title} formula={formula} />
      <div className="flex items-center gap-5 px-5 pb-4">
        <Donut size={168} thickness={30} centerTop="TOTAL" centerBottom={total} centerSub={sub}
          segments={segments.map(s => ({ value: Math.max(s.value, 0.001), color: s.color }))} />
        <div className="flex-1 space-y-2.5">
          {segments.map(s => (
            <div key={s.label} className="flex items-center justify-between gap-2 whitespace-nowrap text-meta">
              <span className="flex items-center gap-1.5 text-body">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />{s.label}
              </span>
              <span className="num font-semibold text-ink">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
      {action && <div className="px-4 pb-4">{action}</div>}
    </Card>
  )
}

export function M6Page() {
  return (
    <>
      <PageHeader
        title="M6 파트너 정산"
        subtitle="파트너별 수익 발생 및 정산 현황을 한눈에 확인하세요. 정산 통화는 RLUSD(XRPL), 금액은 USD 환산 표기입니다."
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
        actions={
          <>
            <Link to="/transparency"><GhostButton>공개 페이지 보기 <Icon name="external" size={12} /></GhostButton></Link>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-navy px-3.5 py-2 text-label font-semibold text-white hover:bg-navy-deep transition-colors">
              <Icon name="download" size={14} /> 정산 내역 다운로드 <Icon name="chevronDown" size={13} className="opacity-80" />
            </button>
            <GhostButton>이번 달 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {d.kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label} formula={k.formula}
            value={<span className="text-[22px]">{k.value}</span>} delta={k.delta} deltaLabel={k.deltaLabel} spark={k.spark} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1.35fr_1.2fr]">
        <DonutBlock title={<>정산 현황 <span className="font-medium text-mute">(이번 달)</span></>}
          formula={'sum(금액) group by 정산 상태\n/ 당월 총 수익'}
          total={d.status.total} sub="USD" segments={d.status.segments} />

        <Card>
          <CardHeader
            title={<>정산 추이 <span className="font-medium text-mute">(최근 6개월)</span></>}
            action={<GhostButton>USD <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>}
          />
          <div className="flex items-center justify-end gap-3 whitespace-nowrap px-5 pb-1 text-tiny text-mute">
            <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-navy" /> 수익 금액</span>
            <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-ok" /> 정산 금액</span>
          </div>
          <div className="px-4 pb-4">
            <MultiLineChart height={220} w={520}
              yTicks={d.trend.yTicks} yFmt={v => (v === 0 ? '0' : `${Math.round(v / 1000)}K`)} xLabels={d.trend.months}
              seriesList={[
                { data: d.trend.revenue, color: '#3E6FE0', dots: true },
                { data: d.trend.settled, color: '#2FA870', dots: true },
              ]} />
          </div>
        </Card>

        <DonutBlock title="파트너 등급 분포"
          formula={'count(partners) group by tier\n등급은 분기 거래액 기준 산정'}
          total={d.tiers.total} sub="Partners" segments={d.tiers.segments}
          action={<FooterLinkButton>자세히 보기</FooterLinkButton>} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1.15fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
            <h2 className="text-h2 text-ink">파트너별 수익 및 정산 현황</h2>
            <label className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-label text-mute focus-within:border-navy/50">
              <Icon name="search" size={14} />
              <input placeholder="파트너명 검색" className="w-32 bg-transparent text-label text-ink outline-none placeholder:text-mute" />
            </label>
          </div>
          <div className="overflow-x-auto border-t border-line px-4">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">파트너명</th>
                  <th className="px-2 py-2 font-medium">등급</th>
                  <th className="px-2 py-2 text-right font-medium">총 수익 (이번 달)</th>
                  <th className="px-2 py-2 text-right font-medium">정산 완료</th>
                  <th className="px-2 py-2 text-right font-medium">정산 대기</th>
                  <th className="px-2 py-2 font-medium">최근 정산일</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {d.partners.map(p => (
                  <tr key={p.name} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="px-2 py-2.5 text-label font-semibold text-ink">{p.name}</td>
                    <td className="px-2 py-2.5">
                      <span className={`inline-flex rounded-md px-1.5 py-0.5 text-tiny font-semibold ${tierPill[p.tier].bg} ${tierPill[p.tier].text}`}>{p.tier}</span>
                    </td>
                    <td className="num px-2 py-2.5 text-right text-label font-medium text-ink">{p.revenue}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{p.settled}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{p.pending}</td>
                    <td className="num px-2 py-2.5 text-label text-body">{p.lastDate}</td>
                    <td className="px-2 py-2.5"><Pill tone={p.status === '정산 완료' ? 'ok' : 'warn'}>{p.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 보기 (128) →</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title="최근 정산 내역"
            action={<button type="button" className="text-meta font-medium text-navy hover:underline">전체 보기</button>} />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">정산 ID</th>
                  <th className="px-2 py-2 font-medium">파트너명</th>
                  <th className="px-2 py-2 text-right font-medium">정산 금액 (USD)</th>
                  <th className="px-2 py-2 font-medium">정산 방식</th>
                  <th className="px-2 py-2 font-medium">정산일</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {d.settlements.map(s => (
                  <tr key={s.id} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label text-body">{s.id}</td>
                    <td className="px-2 py-2.5 text-label font-medium text-ink">{s.partner}</td>
                    <td className="num px-2 py-2.5 text-right text-label font-semibold text-ink">{s.amount}</td>
                    <td className="px-2 py-2.5"><Pill tone="navy">{s.method}</Pill></td>
                    <td className="num px-2 py-2.5 text-label text-body">{s.date}</td>
                    <td className="px-2 py-2.5"><Pill tone="ok">{s.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton><Icon name="download" size={13} /> 전체 정산 내역 다운로드 →</FooterLinkButton>
          </div>
        </Card>
      </div>
    </>
  )
}
