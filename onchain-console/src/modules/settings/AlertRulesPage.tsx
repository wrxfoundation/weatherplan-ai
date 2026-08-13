import { useState } from 'react'
import { Card, CardHeader, GhostButton } from '@/components/Card'
import { KpiCard, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta } from '@/components/PageHeader'
import { Pill, PillTone } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { Toggle } from '@/components/Toggle'
import { alertRulesDemo as d } from '@/demo/generators/settings'
import { series } from '@/demo/rand'

const sevTone: Record<string, PillTone> = { 긴급: 'bad', 경고: 'warn', 정보: 'navy' }
const priTone: Record<string, string> = {
  P1: 'bg-bad-soft text-bad', P2: 'bg-warn-soft text-warn', P3: 'bg-navy-soft text-navy-deep', P4: 'bg-line-soft text-body',
}
const chColor: Record<string, string> = { slack: '#611F69', email: '#3E6FE0', sms: '#2FA870', webhook: '#8F7BE8' }
const chLabel: Record<string, string> = { slack: 'S', email: '@', sms: '문', webhook: 'W' }

const sparks = [series(211, 12, 20, 23, 1), series(212, 12, 30, 41, 5), series(213, 12, 97, 98.6, 0.5), series(214, 12, 3, 2.4, 0.3)]

export function AlertRulesPage() {
  const [tab, setTab] = useState('전체 규칙')
  const rules = tab === '전체 규칙' ? d.rules : tab === '활성 규칙' ? d.rules.filter(r => r.on) : d.rules.filter(r => !r.on)

  return (
    <>
      <PageHeader
        title="알림 규칙"
        subtitle="온체인 이벤트 및 운영 지표에 대한 알림 규칙을 설정하고 관리합니다."
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
        actions={
          <>
            <button type="button" className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-label font-semibold text-white hover:bg-navy-deep transition-colors">+ 새 규칙 추가</button>
            <GhostButton><Icon name="gear" size={14} /> 알림 채널 관리</GhostButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {d.kpis.map((k, i) => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label} value={k.value} sub={k.sub} spark={sparks[i]} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-3">
            <div className="flex gap-1">
              {['전체 규칙', '활성 규칙', '비활성 규칙'].map(t => (
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
                <input placeholder="규칙명 / 설명 검색" className="w-32 bg-transparent text-label text-ink outline-none placeholder:text-mute" />
              </label>
              <GhostButton>전체 심각도 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
              <GhostButton>전체 모듈 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="whitespace-nowrap text-left text-meta font-medium text-mute">
                  <th className="py-2.5 pl-5 pr-2 font-medium">우선순위</th>
                  <th className="px-2 py-2.5 font-medium">규칙명</th>
                  <th className="px-2 py-2.5 font-medium">모듈</th>
                  <th className="px-2 py-2.5 font-medium">조건</th>
                  <th className="px-2 py-2.5 font-medium">심각도</th>
                  <th className="px-2 py-2.5 font-medium">채널</th>
                  <th className="px-2 py-2.5 font-medium">상태</th>
                  <th className="px-2 py-2.5 font-medium">마지막 실행</th>
                  <th className="py-2.5 pl-2 pr-4 text-right font-medium">작업</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(r => (
                  <tr key={r.name} className="whitespace-nowrap border-t border-line-soft">
                    <td className="py-3 pl-5 pr-2">
                      <span className={`num inline-flex rounded-md px-2 py-1 text-tiny font-bold ${priTone[r.pri]}`}>{r.pri}</span>
                    </td>
                    <td className="px-2 py-3">
                      <span className="block text-label font-semibold text-ink">{r.name}</span>
                      <span className="block text-tiny font-normal text-mute">{r.desc}</span>
                    </td>
                    <td className="px-2 py-3"><Pill tone="navy" className="num">{r.module}</Pill></td>
                    <td className="num px-2 py-3 text-label text-body">{r.cond}</td>
                    <td className="px-2 py-3"><Pill tone={sevTone[r.sev]}>{r.sev}</Pill></td>
                    <td className="px-2 py-3">
                      <span className="flex gap-1">
                        {r.channels.map(c => (
                          <span key={c} className="grid h-[18px] w-[18px] place-items-center rounded text-[9px] font-bold text-white" style={{ background: chColor[c] }} title={c}>{chLabel[c]}</span>
                        ))}
                      </span>
                    </td>
                    <td className="px-2 py-3"><Toggle on={r.on} /></td>
                    <td className="num px-2 py-3 text-label text-body">{r.last}</td>
                    <td className="py-3 pl-2 pr-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-mute">
                        <button type="button" className="hover:text-navy" aria-label="편집"><Icon name="gear" size={14} /></button>
                        <button type="button" className="hover:text-navy" aria-label="더보기"><Icon name="dots" size={14} /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="num text-meta text-mute">전체 23개 중 1-{rules.length} 표시</span>
            <div className="flex items-center gap-1">
              <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute" aria-label="이전"><Icon name="chevronLeft" size={13} /></button>
              {[1, 2, 3].map(p => (
                <button key={p} type="button" className={`num h-7 w-7 rounded-md border text-meta font-semibold ${p === 1 ? 'border-navy bg-navy-soft text-navy-deep' : 'border-line text-body'}`}>{p}</button>
              ))}
              <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute" aria-label="다음"><Icon name="chevronRight" size={13} /></button>
            </div>
            <GhostButton>10 / 페이지 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="최근 알림 내역"
              action={<button type="button" className="flex items-center gap-1 text-meta font-medium text-navy hover:underline">전체 보기 <Icon name="chevronRight" size={12} /></button>} />
            <div className="space-y-2.5 px-5 pb-4">
              {d.recent.map(a => (
                <div key={a.title} className="flex gap-2.5">
                  <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                    a.level === '긴급' ? 'bg-bad-soft text-bad' : a.level === '경고' ? 'bg-warn-soft text-warn' : 'bg-navy-soft text-navy'}`}>
                    <Icon name={a.level === '정보' ? 'info' : 'alert'} size={11} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <b className="truncate text-label font-semibold text-ink">{a.title}</b>
                      <span className="num flex shrink-0 items-center gap-1.5 text-tiny font-normal text-mute">{a.at} <Pill tone={sevTone[a.level]}>{a.level}</Pill></span>
                    </span>
                    <span className="block truncate text-tiny font-normal text-mute">{a.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="알림 채널 요약"
              action={<button type="button" className="text-meta font-medium text-navy hover:underline">구성 현황</button>} />
            <div className="space-y-2 px-4 pb-4">
              {d.channels.map(c => (
                <div key={c.key} className="flex items-center gap-2.5 rounded-lg border border-line-soft px-3 py-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white" style={{ background: c.color }}>{chLabel[c.key]}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-label font-semibold text-ink">{c.name}</span>
                    <span className="num block truncate text-tiny font-normal text-mute">{c.sub}</span>
                  </span>
                  <Pill tone="ok">연결됨</Pill>
                  <span className="num shrink-0 text-tiny font-normal text-mute">{c.rules}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
