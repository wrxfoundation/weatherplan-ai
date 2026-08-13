import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta, DownloadButton } from '@/components/PageHeader'
import { AreaChart, Donut } from '@/components/charts'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { FormulaTip } from '@/components/FormulaTip'
import { m8Demo as d } from '@/demo/generators/m8'

export function M8Page() {
  return (
    <>
      <PageHeader
        title="M8 토큰 홀더"
        subtitle="WLBN 홀더 분포, 활동, 보유 구조를 한눈에 확인하세요. (발행 원장: XRPL)"
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
        actions={<DownloadButton />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {d.kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label} formula={k.formula}
            value={k.value} unit={k.unit} delta={k.delta} deltaLabel="vs 지난 달" spark={k.spark} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1.45fr_1.05fr]">
        <Card>
          <CardHeader
            title={<>홀더 추이 <span className="font-medium text-mute">(최근 30일)</span></>}
            action={<GhostButton>전체 기간 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>}
          />
          <div className="px-4 pb-4 pt-1">
            <AreaChart data={d.trend.data} height={238} yTicks={d.trend.yTicks}
              yFmt={v => (v === 0 ? '0' : `${Math.round(v / 1000)}K`)} xLabels={d.trend.xLabels} />
          </div>
        </Card>

        <Card>
          <CardHeader title="보유 분포" formula={'홀더 수 group by 잔고 구간\n/ 총 홀더 수 (일 1회 스냅샷)'} />
          <div className="flex items-center gap-5 px-5 pb-3">
            <Donut size={172} thickness={30} centerTop="TOTAL" centerBottom={d.distribution.total} centerSub="Holders"
              segments={d.distribution.segments.map(s => ({ value: s.value, color: s.color }))} />
            <div className="flex-1 space-y-2">
              {d.distribution.segments.map(s => (
                <div key={s.label} className="flex items-center justify-between gap-2 whitespace-nowrap text-tiny font-normal">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-body">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />{s.label}
                  </span>
                  <span className="num shrink-0 font-semibold text-ink">{s.pct} <span className="font-normal text-mute">{s.text}</span></span>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-4 mb-4 flex items-center justify-between rounded-lg border border-line px-3 py-2">
            <span className="text-meta text-body">{d.distribution.footer.label}</span>
            <b className="num text-label font-bold text-ink">{d.distribution.footer.value}</b>
          </div>
        </Card>

        <Card>
          <CardHeader title="지갑 유형별 홀더 구성" formula={'지갑 레지스트리 라벨 기준 분류\nWLBN은 XRPL 단일 발행'} />
          <div className="px-4">
            <table className="w-full">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">순위</th>
                  <th className="px-2 py-2 font-medium">유형</th>
                  <th className="px-2 py-2 text-right font-medium">홀더 수</th>
                  <th className="px-2 py-2 text-right font-medium">비중</th>
                </tr>
              </thead>
              <tbody>
                {d.walletTypes.map(w => (
                  <tr key={w.rank} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label font-semibold text-mute">{w.rank}</td>
                    <td className="px-2 py-2.5 text-label font-medium text-ink">{w.type}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{w.count}</td>
                    <td className="num px-2 py-2.5 text-right text-label font-semibold text-ink">{w.share}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>지갑 레지스트리 보기 →</FooterLinkButton>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr_1.3fr]">
        <Card>
          <CardHeader title="홀더 등급별 현황" />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">구분</th>
                  <th className="px-2 py-2 text-right font-medium">홀더 수</th>
                  <th className="px-2 py-2 text-right font-medium">평균 보유량 (WLBN)</th>
                  <th className="px-2 py-2 text-right font-medium">30일 증감</th>
                  <th className="px-2 py-2 text-right font-medium">활동률 (30D)</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {d.grades.map(g => (
                  <tr key={g.grade} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-2 text-label font-medium text-ink">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white" style={{ background: g.color }}>{g.badge}</span>
                        {g.grade}
                      </span>
                    </td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{g.count}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{g.avg}</td>
                    <td className={`num px-2 py-2.5 text-right text-label font-semibold ${g.momUp ? 'text-ok' : 'text-bad'}`}>{g.mom}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{g.active}</td>
                    <td className="px-2 py-2.5">
                      <Pill tone={g.status === 'Active' ? 'ok' : g.status === 'Stable' ? 'navy' : 'warn'}>{g.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 등급 현황 보기 →</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title={<span className="inline-flex items-center gap-2">홀더 집중도 <FormulaTip formula={'top-N 홀더 잔고 합 / 총 유통량\nΣtopN balance / Σall'} /></span>} />
          <div className="px-5 pb-2 text-meta text-mute">상위 홀더 보유 비율</div>
          <div className="space-y-3 px-5 pb-4">
            {d.concentration.map(c => (
              <div key={c.label} className="flex items-center gap-3 whitespace-nowrap">
                <span className="w-[88px] shrink-0 text-meta text-body">{c.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft">
                  <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
                <b className="num w-[52px] shrink-0 text-right text-label font-bold text-ink">{c.text}</b>
              </div>
            ))}
          </div>
          <div className="mx-4 mb-4 flex items-center justify-between rounded-lg border border-line px-3 py-2 text-meta">
            <span className="text-body">지니 계수</span>
            <b className="num text-label font-bold text-ink">0.42 <span className="font-semibold text-ok">−0.02</span></b>
          </div>
          <div className="px-4 pb-4">
            <FooterLinkButton>집중도 상세 분석 보기 →</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title="최근 대규모 이동" formula={'단일 이동량 > 총 유통 1% 감지\n총 유통 2% 초과 시 경보 (WLBN)'} />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[440px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">날짜</th>
                  <th className="px-2 py-2 font-medium">지갑 구분</th>
                  <th className="px-2 py-2 font-medium">내역</th>
                  <th className="px-2 py-2 text-right font-medium">이동 수량 (WLBN)</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {d.moves.map(m => (
                  <tr key={m.at} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label text-body">{m.at.slice(5)}</td>
                    <td className="px-2 py-2.5 text-label font-medium text-ink">{m.type}</td>
                    <td className="px-2 py-2.5 text-label text-body">
                      <span className="flex items-center gap-1">
                        <Icon name={m.inbound ? 'inbound' : 'outbound'} size={12} className={m.inbound ? 'text-ok' : 'text-bad'} />
                        {m.dir}
                      </span>
                    </td>
                    <td className={`num px-2 py-2.5 text-right text-label font-semibold ${m.inbound ? 'text-ink' : 'text-bad'}`}>{m.amount}</td>
                    <td className="px-2 py-2.5"><Pill tone={m.inbound ? 'ok' : 'bad'}>{m.inbound ? '입금' : '출금'}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 이동 내역 보기 →</FooterLinkButton>
          </div>
        </Card>
      </div>
    </>
  )
}
