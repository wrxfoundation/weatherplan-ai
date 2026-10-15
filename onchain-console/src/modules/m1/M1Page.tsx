import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, GhostButton } from '@/components/Card'
import { KpiCard, ProgressBar } from '@/components/KpiCard'
import { PageHeader } from '@/components/PageHeader'
import { Donut, MultiLineChart } from '@/components/charts'
import { StatusDot } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { m1Demo as d, kindPillTone, WalletStatus } from '@/demo/generators/m1'

const statusTone: Record<WalletStatus, 'ok' | 'warn' | 'mute'> = { 활성: 'ok', 주의: 'warn', 비활성: 'mute' }

type Tab = 'all' | 'active' | 'inactive' | 'watch'

export function M1Page() {
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    let r = d.wallets
    if (tab === 'active') r = r.filter(w => w.status === '활성')
    if (tab === 'inactive') r = r.filter(w => w.status === '비활성')
    if (tab === 'watch') r = r.filter(w => w.status === '주의')
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      r = r.filter(w => `${w.addr} ${w.label} ${w.kind}`.toLowerCase().includes(q))
    }
    return r
  }, [tab, query])

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'all', label: '전체 지갑', count: d.tabs.all },
    { id: 'active', label: '활성', count: d.tabs.active },
    { id: 'inactive', label: '비활성', count: d.tabs.inactive },
    { id: 'watch', label: '주의', count: d.tabs.watch },
  ]

  return (
    <>
      <PageHeader
        title="M1 활성 지갑"
        subtitle="등록된 회사 및 관련 지갑의 활성 상태와 최근 활동을 모니터링합니다."
        actions={
          <Link to="/settings/wallets">
            <GhostButton>지갑 레지스트리 관리 <Icon name="gear" size={14} /></GhostButton>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <KpiCard icon="wallet" label="총 활성 지갑"
          formula={'count(wallets where is_active)\n활성 = 24시간 내 활동 존재'}
          value={<>{d.kpis.active.value} <span className="text-h3 font-semibold text-mute">/ {d.kpis.active.total}</span></>}
          footer={
            <div className="flex items-center gap-2.5">
              <span className="num shrink-0 text-meta text-body">활성 비율 <b className="font-semibold text-ink">75.0%</b></span>
              <ProgressBar ratio={d.kpis.active.ratio} />
            </div>
          }
        />
        <KpiCard icon="inbound" label="오늘 수신 (XRP)" formula={'sum(amount) where direction=in\nand closed_at::date=today'}
          value={d.kpis.inToday.value} delta={d.kpis.inToday.delta} spark={d.kpis.inToday.spark} />
        <KpiCard icon="outbound" label="오늘 송신 (XRP)" formula={'sum(amount) where direction=out\nand closed_at::date=today'}
          value={d.kpis.outToday.value} delta={d.kpis.outToday.delta} spark={d.kpis.outToday.spark} />
        <KpiCard icon="exchange" label="자체 이체" formula={'count(tx) where direction=self\n(우리 지갑 간 이동)'}
          value={d.kpis.selfTransfer.value} delta={d.kpis.selfTransfer.delta} spark={d.kpis.selfTransfer.spark} />
        <KpiCard icon="clock" label="마지막 활동" formula="max(closed_at) 이후 경과 시간"
          value={<span className="text-[22px]">{d.kpis.lastActivity.value}</span>}
          sub={<span className="num">{d.kpis.lastActivity.sub} <Icon name="info" size={11} className="inline text-mute/70" /></span>} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-3">
              <div className="flex gap-1 border-b border-transparent">
                {tabs.map(t => (
                  <button key={t.id} type="button" onClick={() => setTab(t.id)}
                    className={`relative px-3 pb-2.5 pt-1.5 text-label transition-colors ${
                      tab === t.id ? 'font-bold text-navy' : 'font-medium text-mute hover:text-body'}`}>
                    {t.label} <span className="num">{t.count}</span>
                    {tab === t.id && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-navy" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pb-2">
                <label className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-label text-mute focus-within:border-navy/50">
                  <Icon name="search" size={14} />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="주소, 라벨, 메모 검색"
                    className="w-40 bg-transparent text-label text-ink outline-none placeholder:text-mute" />
                </label>
                <GhostButton>모든 종류 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
                <GhostButton>정렬: 최근 활동 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
              </div>
            </div>
            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="whitespace-nowrap text-left text-meta font-medium text-mute">
                    <th className="py-2.5 pl-5 pr-3 font-medium">주소</th>
                    <th className="px-3 py-2.5 font-medium">라벨</th>
                    <th className="px-3 py-2.5 font-medium">종류</th>
                    <th className="px-3 py-2.5 font-medium">상태</th>
                    <th className="px-3 py-2.5 font-medium">마지막 활동 <Icon name="chevronDown" size={11} className="inline" /></th>
                    <th className="px-3 py-2.5 text-right font-medium">오늘 수신 (XRP)</th>
                    <th className="px-3 py-2.5 text-right font-medium">오늘 송신 (XRP)</th>
                    <th className="px-3 py-2.5 font-medium">잔액 (XRP)</th>
                    <th className="py-2.5 pl-3 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(w => (
                    <tr key={w.addr} className="whitespace-nowrap border-t border-line-soft transition-colors hover:bg-navy-tint/60">
                      <td className="py-3 pl-5 pr-3">
                        <span className="flex items-center gap-1.5">
                          <span className="num text-label font-semibold text-ink">{w.addr}</span>
                          <button type="button" className="text-mute/60 hover:text-navy transition-colors" aria-label="주소 복사"
                            onClick={() => navigator.clipboard?.writeText(w.addr)}>
                            <Icon name="copy" size={13} />
                          </button>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-label text-body">{w.label}</td>
                      <td className="px-3 py-3">
                        <span className={`num inline-flex rounded-md px-1.5 py-0.5 text-tiny font-semibold ${kindPillTone[w.kind].bg} ${kindPillTone[w.kind].text}`}>
                          {w.kind}
                        </span>
                      </td>
                      <td className="px-3 py-3"><StatusDot tone={statusTone[w.status]} label={w.status} /></td>
                      <td className="num px-3 py-3 text-label text-body">{w.lastActive}</td>
                      <td className="num px-3 py-3 text-right text-label text-body">{w.inToday}</td>
                      <td className="num px-3 py-3 text-right text-label text-body">{w.outToday}</td>
                      <td className="px-3 py-3">
                        {w.balanceRef ? (
                          <span className="num inline-flex cursor-pointer items-center gap-1 text-label font-medium text-navy hover:underline" title="XRPL 익스플로러 (데모)">
                            {w.balanceRef} <Icon name="external" size={12} />
                          </span>
                        ) : <span className="text-label text-mute">—</span>}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right">
                        <button type="button" className="text-mute/70 hover:text-navy transition-colors" aria-label="더보기"><Icon name="dots" size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
              <span className="num text-meta text-mute">전체 24개 중 1-{rows.length} 표시</span>
              <div className="flex items-center gap-1">
                <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute hover:text-navy" aria-label="이전"><Icon name="chevronLeft" size={13} /></button>
                {[1, 2, 3].map(p => (
                  <button key={p} type="button"
                    className={`num h-7 w-7 rounded-md border text-meta font-semibold ${p === 1 ? 'border-navy bg-navy-soft text-navy-deep' : 'border-line text-body hover:border-navy/40'}`}>
                    {p}
                  </button>
                ))}
                <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute hover:text-navy" aria-label="다음"><Icon name="chevronRight" size={13} /></button>
              </div>
              <GhostButton>10 / 페이지 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
            </div>
          </Card>

          <Card>
            <CardHeader
              title={<>활동 타임라인 <span className="font-medium text-mute">(최근 7일)</span></>}
              action={
                <span className="flex items-center gap-4 text-meta text-body">
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-navy" /> 수신</span>
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-ok" /> 송신</span>
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[#8F7BE8]" /> 자체 이체</span>
                </span>
              }
            />
            <div className="px-2 pb-1 pl-4 text-meta text-mute">(XRP)</div>
            <div className="px-4 pb-4">
              <MultiLineChart height={180}
                yTicks={[0, 10000, 20000]} yFmt={v => (v === 0 ? '0' : `${Math.round(v / 1000)}K`)}
                xLabels={d.timeline.days}
                seriesList={[
                  { data: d.timeline.recv, color: '#3E6FE0' },
                  { data: d.timeline.send, color: '#2FA870' },
                  { data: d.timeline.self, color: '#8F7BE8' },
                ]} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="지갑 종류별 분포" formula={'count(wallets) group by kind\n/ count(wallets)'} />
            <div className="flex items-center gap-4 px-5 pb-5">
              <Donut size={120} thickness={20} centerTop="총" centerBottom="24"
                segments={d.distribution.map(s => ({ value: s.count, color: s.color }))} />
              <div className="flex-1 space-y-1.5">
                {d.distribution.map(s => (
                  <div key={s.kind} className="flex items-center justify-between gap-2 whitespace-nowrap text-tiny font-normal">
                    <span className="flex items-center gap-1.5 text-body">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />{s.kind}
                    </span>
                    <span className="num text-body"><b className="font-semibold text-ink">{s.count}</b> <span className="text-mute">({s.pct})</span></span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="네트워크 현황 (XRPL)" />
            <div className="space-y-2.5 px-5 pb-5">
              {[
                { label: '마지막 레저 인덱스', value: d.network.ledgerIndex },
                { label: '평균 레저 마감 시간', value: d.network.closeTime },
                { label: '연결 노드', value: d.network.nodes },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-label">
                  <span className="text-body">{r.label}</span>
                  <b className="num font-semibold text-ink">{r.value}</b>
                </div>
              ))}
              <div className="flex items-center justify-between text-label">
                <span className="text-body">데이터 수집 상태</span>
                <StatusDot tone="ok" label={d.network.collect} />
              </div>
            </div>
          </Card>

          <Card className="bg-navy-tint">
            <CardHeader title="안내" className="pb-1" />
            <ul className="space-y-2 px-5 pb-4 text-meta leading-relaxed text-body">
              <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-navy" />지갑 라벨과 종류는 지갑 레지스트리에서 관리됩니다.</li>
              <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-navy" />비활성 지갑은 24시간 이상 활동이 없는 지갑입니다.</li>
              <li className="flex gap-2"><span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-navy" />'주의' 상태는 이상 패턴 감지(M4 부정탐지) 연계 결과입니다.</li>
            </ul>
            <div className="px-5 pb-4">
              <Link to="/settings/wallets" className="text-label font-semibold text-navy hover:underline">지갑 레지스트리 관리 바로가기 →</Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
