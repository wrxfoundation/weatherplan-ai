import { useState } from 'react'
import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard, ProgressBar, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta, DownloadButton } from '@/components/PageHeader'
import { Donut } from '@/components/charts'
import { Pill, PillTone, StatusDot } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { registryDemo as d } from '@/demo/generators/registry'

export function RegistryPage() {
  const [tab, setTab] = useState('전체 지갑')
  const rows = tab === '전체 지갑' ? d.wallets
    : tab === '운영 지갑' ? d.wallets.filter(w => w.kind === '운영')
    : tab === '보상 지급 지갑' ? d.wallets.filter(w => w.kind === '보상 지급')
    : tab === '수취 지갑' ? d.wallets.filter(w => w.kind === '수취')
    : d.wallets.filter(w => w.kind === '보조')

  return (
    <>
      <PageHeader
        title="지갑 레지스트리 관리"
        subtitle="법인 지갑 및 운영 지갑을 등록·관리하고 권한, 한도, 상태를 통합 모니터링합니다."
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
        actions={
          <>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-label font-semibold text-white hover:bg-navy-deep transition-colors">
              + 새 지갑 등록
            </button>
            <DownloadButton />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {d.kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label} formula={k.formula}
            value={<span className="text-[21px]">{k.value}</span>} unit={k.unit}
            sub={k.sub} delta={k.delta} deltaLabel={k.deltaLabel} spark={k.spark} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-3">
            <div className="flex gap-1">
              {d.tabs.map(t => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`relative whitespace-nowrap px-3 pb-2.5 pt-1.5 text-label transition-colors ${
                    tab === t ? 'font-bold text-navy' : 'font-medium text-mute hover:text-body'}`}>
                  {t}
                  {tab === t && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-navy" />}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pb-2">
              <label className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-label text-mute focus-within:border-navy/50">
                <Icon name="search" size={14} />
                <input placeholder="지갑명 / 주소 / 태그 검색" className="w-40 bg-transparent text-label text-ink outline-none placeholder:text-mute" />
              </label>
              <GhostButton>필터</GhostButton>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="whitespace-nowrap text-left text-meta font-medium text-mute">
                  <th className="py-2.5 pl-5 pr-3 font-medium">지갑명</th>
                  <th className="px-3 py-2.5 font-medium">주소</th>
                  <th className="px-3 py-2.5 font-medium">종류</th>
                  <th className="px-3 py-2.5 font-medium">네트워크</th>
                  <th className="px-3 py-2.5 text-right font-medium">보유 잔액 (RLUSD)</th>
                  <th className="px-3 py-2.5 text-right font-medium">보유 잔액 (XRP)</th>
                  <th className="px-3 py-2.5 text-right font-medium">24시간 변동</th>
                  <th className="px-3 py-2.5 font-medium">상태</th>
                  <th className="py-2.5 pl-3 pr-4 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(w => (
                  <tr key={w.addr} className="whitespace-nowrap border-t border-line-soft transition-colors hover:bg-navy-tint/60">
                    <td className="py-3 pl-5 pr-3">
                      <span className="flex items-center gap-2.5">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy-soft text-navy"><Icon name="wallet" size={14} /></span>
                        <span>
                          <span className="block text-label font-semibold text-ink">{w.name}</span>
                          <span className="block text-tiny font-normal text-mute">{w.desc}</span>
                        </span>
                      </span>
                    </td>
                    <td className="num px-3 py-3 text-label text-body">{w.addr}</td>
                    <td className="px-3 py-3"><Pill tone={w.kindTone as PillTone}>{w.kind}</Pill></td>
                    <td className="px-3 py-3 text-label text-body">{w.network}</td>
                    <td className="num px-3 py-3 text-right text-label font-medium text-ink">{w.rlusd}</td>
                    <td className="num px-3 py-3 text-right text-label text-body">{w.xrp}</td>
                    <td className={`num px-3 py-3 text-right text-label font-semibold ${
                      w.change === '—' || w.change === '0.0%' ? 'text-mute' : w.up ? 'text-ok' : 'text-bad'}`}>{w.change}</td>
                    <td className="px-3 py-3"><StatusDot tone="ok" label="정상" /></td>
                    <td className="py-3 pl-3 pr-4">
                      <span className="flex items-center gap-1.5 text-mute">
                        <button type="button" className="hover:text-navy" aria-label="보기"><Icon name="eye" size={14} /></button>
                        <button type="button" className="hover:text-navy" aria-label="설정"><Icon name="gear" size={14} /></button>
                        <button type="button" className="hover:text-navy" aria-label="더보기"><Icon name="dots" size={14} /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="num text-meta text-mute">전체 18개 중 1-{rows.length} 표시</span>
            <div className="flex items-center gap-1">
              <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute" aria-label="이전"><Icon name="chevronLeft" size={13} /></button>
              {[1, 2, 3].map(p => (
                <button key={p} type="button"
                  className={`num h-7 w-7 rounded-md border text-meta font-semibold ${p === 1 ? 'border-navy bg-navy-soft text-navy-deep' : 'border-line text-body'}`}>{p}</button>
              ))}
              <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute" aria-label="다음"><Icon name="chevronRight" size={13} /></button>
            </div>
            <GhostButton>10 / 페이지 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="네트워크별 잔액 분포" formula={'sum(balance·환산가) group by network\nRLUSD 1:1 페그 기준'} />
            <div className="flex flex-col items-center gap-3 px-5 pb-5">
              <Donut size={150} thickness={22} centerTop="TOTAL" centerBottom={d.networks.total} centerSub="USD"
                segments={d.networks.segments.map(s => ({ value: s.value, color: s.color }))} />
              <div className="w-full space-y-2">
                {d.networks.segments.map(s => (
                  <div key={s.label} className="flex items-center justify-between gap-2 whitespace-nowrap text-tiny font-normal">
                    <span className="flex items-center gap-1.5 text-body">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />{s.label}
                    </span>
                    <span className="num font-semibold text-ink">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={<>최근 거래 <span className="font-medium text-mute">(전체 지갑)</span></>}
              action={<button type="button" className="text-meta font-medium text-navy hover:underline">전체 보기</button>} />
            <div className="space-y-2 px-5 pb-4">
              {d.recentTxs.map((t, i) => (
                <div key={i} className="flex items-center gap-2 whitespace-nowrap text-meta">
                  <Icon name={t.inbound ? 'inbound' : 'outbound'} size={13} className={t.inbound ? 'text-ok' : 'text-bad'} />
                  <span className="font-semibold text-ink">{t.dir}</span>
                  <span className="min-w-0 flex-1 truncate text-body">{t.desc}</span>
                  <b className={`num font-semibold ${t.inbound ? 'text-ok' : 'text-bad'}`}>{t.amount}</b>
                  <span className="w-12 shrink-0 text-right text-tiny font-normal text-mute">{t.ago}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="보안 상태 요약" formula={'멀티시그(SignerList)·한도 설정 적용 현황\n커스터디 정책 (§06 지갑·커스터디)'} />
            <div className="space-y-3 px-5 pb-4">
              {d.security.map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-meta">
                    <span className="text-body">{s.label}</span>
                    <span className="num text-body">{s.value} <b className="font-semibold text-ink">{s.pct}</b></span>
                  </div>
                  <ProgressBar ratio={s.ratio} className="mt-1.5" />
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-line-soft pt-3 text-meta">
                <span className="text-body">{d.lastAudit.label}</span>
                <span className="num flex items-center gap-2 text-body">{d.lastAudit.value} <Pill tone="ok">{d.lastAudit.status}</Pill></span>
              </div>
            </div>
          </Card>
          <FooterLinkButton>지갑 레지스트리 정책 문서 보기 →</FooterLinkButton>
        </div>
      </div>
    </>
  )
}
