import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard, ProgressBar, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta, DownloadButton } from '@/components/PageHeader'
import { AreaChart, Donut, BarChart } from '@/components/charts'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { FormulaTip } from '@/components/FormulaTip'
import { m4Demo as d } from '@/demo/generators/m4'

export function M4Page() {
  return (
    <>
      <PageHeader
        title={<span className="inline-flex items-center gap-2">M4 DePIN 보상 <FormulaTip formula={'자사 공기질 측정기 네트워크\n일일 보상 지급 관제 (RLUSD)'} /></span>}
        subtitle="자사 공기질 측정기 네트워크의 일일 보상 지급 현황과 안전장치를 모니터링합니다."
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
        actions={<DownloadButton />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {d.kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label} formula={k.formula}
            value={k.value} unit={k.unit} delta={k.delta} deltaLabel={k.deltaLabel} spark={k.spark} />
        ))}
      </div>

      <Card className="mt-4">
        <div className="grid grid-cols-1 divide-y divide-line xl:grid-cols-3 xl:divide-x xl:divide-y-0">
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-soft text-navy"><Icon name="gauge" size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label font-semibold text-ink">1일 지급 한도</span>
                <FormulaTip formula={'지급액 / app_config.payout_daily_cap\n사용률 > 90% 시 경보'} />
              </div>
              <div className="num mt-1 text-meta text-body">{d.safety.limit.text}</div>
              <ProgressBar ratio={d.safety.limit.ratio} className="mt-2" />
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ok-soft text-ok"><Icon name="wallet" size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label font-semibold text-ink">지급지갑 잔고</span>
                <FormulaTip formula={'account_info.balance (5분 주기 수집)\n잔고 < payout_min_balance 시 경보'} />
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="num text-[19px] font-bold text-ink">{d.safety.balance.value}</span>
                <span className="text-meta text-mute">{d.safety.balance.unit}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-meta text-mute">
                {d.safety.balance.threshold} <Pill tone="ok">정상</Pill>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn"><Icon name="power" size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-label font-semibold text-ink">자동중단 스위치</span>
                <FormulaTip formula={'이상 급증 감지 시 배치 지급 자동 중단\n(operator 수동 해제)'} />
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Pill tone="ok">대기 (정상)</Pill>
                <span className="text-meta text-mute">마지막 점검 {d.safety.killSwitch.lastCheck}</span>
              </div>
              <div className="mt-1.5 text-meta text-mute">발동 이력 최근 30일 0건</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1.35fr_1fr]">
        <Card>
          <CardHeader
            title={<>보상 추이 <span className="font-medium text-mute">(최근 30일)</span></>}
            action={<GhostButton>RLUSD <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>}
          />
          <div className="px-2 pb-1 pl-4 text-meta text-mute">(RLUSD)</div>
          <div className="px-4 pb-4">
            <AreaChart data={d.trend.data} height={230} yTicks={d.trend.yTicks}
              yFmt={v => (v === 0 ? '0' : `${Math.round(v / 1000)}K`)} xLabels={d.trend.xLabels} />
          </div>
        </Card>

        <Card>
          <CardHeader title={<>권역별 보상 분포 <span className="font-medium text-mute">(금일)</span></>}
            formula={'sum(보상) group by 디바이스 설치 권역\n/ 오늘 지급 예정 총액'} />
          <div className="flex items-center gap-5 px-5 pb-4">
            <Donut size={168} thickness={30} centerTop="TOTAL" centerBottom={d.regions.total} centerSub="RLUSD"
              segments={d.regions.segments.map(s => ({ value: s.value, color: s.color }))} />
            <div className="flex-1 space-y-3">
              {d.regions.segments.map(s => (
                <div key={s.label} className="flex items-center justify-between gap-2 whitespace-nowrap text-meta">
                  <span className="flex items-center gap-1.5 text-body">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />{s.label}
                  </span>
                  <span className="num font-semibold text-ink">{s.pct} <span className="font-normal text-mute">({s.text})</span></span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title={<>최근 지급 배치 <span className="font-medium text-mute">(5건)</span></>} />
          <div className="space-y-1.5 px-4">
            {d.batches.map(b => (
              <div key={b.date} className="flex items-center justify-between gap-2 whitespace-nowrap rounded-lg border border-line-soft px-3 py-2">
                <span className="min-w-0">
                  <span className="num block text-label font-semibold text-ink">{b.date}</span>
                  <span className="num block text-tiny font-normal text-mute">{b.devices}{b.retry ? ` · ${b.retry}` : ''}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <b className="num text-label font-bold text-ink">{b.amount}</b>
                  <Pill tone="ok">{b.status}</Pill>
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 배치 보기</FooterLinkButton>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader title={<>디바이스별 보상 현황 <span className="font-medium text-mute">(7D 상위)</span></>} />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">디바이스 ID</th>
                  <th className="px-2 py-2 font-medium">지역</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                  <th className="px-2 py-2 text-right font-medium">가동률 (7D)</th>
                  <th className="px-2 py-2 text-right font-medium">보상 (7D)</th>
                  <th className="px-2 py-2 text-right font-medium">변화율</th>
                </tr>
              </thead>
              <tbody>
                {d.devices.map(v => (
                  <tr key={v.id} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label font-semibold text-navy">{v.id}</td>
                    <td className="px-2 py-2.5 text-label text-body">{v.region}</td>
                    <td className="px-2 py-2.5">
                      <Pill tone={v.status === 'Active' ? 'ok' : 'mute'}>{v.status}</Pill>
                    </td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{v.uptime}</td>
                    <td className="num px-2 py-2.5 text-right text-label font-semibold text-ink">{v.reward}</td>
                    <td className={`num px-2 py-2.5 text-right text-label font-semibold ${v.up ? 'text-ok' : 'text-bad'}`}>{v.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4 pt-3">
            <FooterLinkButton>전체 디바이스 보기</FooterLinkButton>
          </div>
        </Card>

        <Card>
          <CardHeader title="보상 예측" formula={'최근 14일 지급 추세 선형 외삽\n(가동률·신규 등록 반영)'}
            action={<GhostButton>7D <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>} />
          <div className="px-2 pb-1 pl-4 text-meta text-mute">(RLUSD)</div>
          <div className="px-4">
            <BarChart data={d.forecast.data} xLabels={d.forecast.days} yTicks={d.forecast.yTicks}
              yFmt={v => (v === 0 ? '0' : `${Math.round(v / 1000)}K`)} height={190} />
          </div>
          <div className="mx-4 mb-4 mt-2 grid grid-cols-2 divide-x divide-line rounded-lg border border-line">
            <div className="px-3 py-2">
              <span className="text-meta text-mute">예상 지급 (7D)</span>
              <b className="num ml-2 text-label font-bold text-navy">{d.forecast.total}</b>
            </div>
            <div className="px-3 py-2 text-right">
              <span className="text-meta text-mute">현재 추세 기준</span>
              <b className="num ml-2 text-label font-bold text-ok">{d.forecast.trendText}</b>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="부정 탐지 큐"
          badge={<Pill tone="bad" className="num">전체 {d.fraudTotal}건</Pill>}
          formula={'위치 검증·데이터 패턴·인근 센서 교차대조\n의심 계정 자동 보류 → operator 수동 검토'}
          action={<span className="text-meta text-mute">처리 이력은 감사 로그에 기록됩니다</span>}
        />
        <div className="overflow-x-auto px-4">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                <th className="px-2 py-2 font-medium">위험도</th>
                <th className="px-2 py-2 font-medium">계정</th>
                <th className="px-2 py-2 text-right font-medium">디바이스</th>
                <th className="px-2 py-2 font-medium">사유</th>
                <th className="px-2 py-2 text-right font-medium">σ</th>
                <th className="px-2 py-2 font-medium">자동 조치</th>
                <th className="px-2 py-2 font-medium">상태</th>
                <th className="px-2 py-2 text-right font-medium">액션 (operator)</th>
              </tr>
            </thead>
            <tbody>
              {d.fraudQueue.map(f => (
                <tr key={f.ref} className="whitespace-nowrap border-b border-line-soft last:border-0">
                  <td className="px-2 py-2.5"><Pill tone={f.level}>{f.level}</Pill></td>
                  <td className="num px-2 py-2.5 text-label font-semibold text-ink">{f.ref}</td>
                  <td className="num px-2 py-2.5 text-right text-label text-body">{f.devices}</td>
                  <td className="px-2 py-2.5 text-label text-body">{f.reason}</td>
                  <td className="num px-2 py-2.5 text-right text-label text-body">{f.sigma}</td>
                  <td className="px-2 py-2.5 text-label text-body">{f.action}</td>
                  <td className="num px-2 py-2.5 text-label text-mute">{f.status}</td>
                  <td className="px-2 py-2.5 text-right">
                    <span className="inline-flex gap-1.5">
                      <button type="button" className="rounded-md border border-bad/40 px-2 py-1 text-tiny font-semibold text-bad hover:bg-bad-soft transition-colors">부정 확정</button>
                      <button type="button" className="rounded-md border border-line px-2 py-1 text-tiny font-semibold text-body hover:border-navy/40 hover:text-navy transition-colors">해제</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4 pt-3">
          <FooterLinkButton>전체 큐 보기 ({d.fraudTotal}건)</FooterLinkButton>
        </div>
      </Card>
    </>
  )
}
