import { Card, CardHeader, GhostButton } from '@/components/Card'
import { KpiCard, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta } from '@/components/PageHeader'
import { Donut } from '@/components/charts'
import { Pill, PillTone } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { Avatar } from '@/components/Toggle'
import { auditDemo as d, rosterColors } from '@/demo/generators/settings'
import { series } from '@/demo/rand'

const sparks = [series(221, 12, 110000, 128640, 3000), series(222, 12, 36, 23, 4), series(223, 12, 120, 156, 14), series(224, 12, 100, 100, 0.01)]
const levelTone: Record<string, PillTone> = { 긴급: 'bad', 경고: 'warn', 높음: 'warn', 정보: 'navy', 보통: 'navy' }

export function AuditPage() {
  return (
    <>
      <PageHeader
        title="감사 로그"
        subtitle="시스템, 지갑, 권한, 운영 활동에 대한 모든 이력을 기록하고 추적할 수 있습니다."
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
        actions={
          <>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-navy px-3.5 py-2 text-label font-semibold text-white hover:bg-navy-deep transition-colors">
              <Icon name="download" size={14} /> 로그 내보내기
            </button>
            <GhostButton><Icon name="audit" size={14} /> 무결성 검증</GhostButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {d.kpis.map((k, i) => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label}
            value={k.valueTone ? <span className={`text-[23px] ${k.valueTone}`}>{k.value}</span> : k.value}
            sub={<span className={k.subTone}>{k.sub}</span>} spark={sparks[i]} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="flex flex-wrap items-center gap-2 px-5 py-3">
            <GhostButton><span className="num">{d.dateRange}</span> <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
            <GhostButton>전체 모듈 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
            <GhostButton>전체 이벤트 유형 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
            <GhostButton>전체 사용자 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
            <GhostButton>전체 심각도 <Icon name="chevronDown" size={13} className="text-mute" /></GhostButton>
          </div>
          <div className="flex items-center gap-2 px-5 pb-3">
            <label className="flex flex-1 items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-label text-mute focus-within:border-navy/50">
              <Icon name="search" size={14} />
              <input placeholder="사용자, 액션, 대상, IP 검색" className="w-full bg-transparent text-label text-ink outline-none placeholder:text-mute" />
            </label>
            <GhostButton>필터 초기화</GhostButton>
          </div>
          <div className="overflow-x-auto border-t border-line">
            <table className="w-full min-w-[960px]">
              <thead>
                <tr className="whitespace-nowrap text-left text-meta font-medium text-mute">
                  <th className="py-2.5 pl-5 pr-2 font-medium">일시</th>
                  <th className="px-2 py-2.5 font-medium">사용자</th>
                  <th className="px-2 py-2.5 font-medium">모듈</th>
                  <th className="px-2 py-2.5 font-medium">이벤트 유형</th>
                  <th className="px-2 py-2.5 font-medium">액션</th>
                  <th className="px-2 py-2.5 font-medium">대상 / 상세</th>
                  <th className="px-2 py-2.5 font-medium">결과</th>
                  <th className="px-2 py-2.5 font-medium">심각도</th>
                  <th className="px-2 py-2.5 font-medium">IP / 디바이스</th>
                  <th className="py-2.5 pl-2 pr-4 text-right font-medium">상세</th>
                </tr>
              </thead>
              <tbody>
                {d.rows.map(r => (
                  <tr key={r.at} className="whitespace-nowrap border-t border-line-soft">
                    <td className="num py-3 pl-5 pr-2 text-label text-body">
                      <span className="block">{r.at.slice(0, 10)}</span>
                      <span className="block text-tiny font-normal text-mute">{r.at.slice(11)}</span>
                    </td>
                    <td className="px-2 py-3">
                      <span className="flex items-center gap-1.5">
                        <Avatar name={r.actor} size={20} color={rosterColors[r.actor] ?? '#8593AB'} />
                        <span>
                          <span className="block text-label font-medium text-ink">{r.actor}</span>
                          <span className="num block text-tiny font-normal text-mute">{r.roleTag}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span className="num block"><Pill tone="navy">{r.module}</Pill></span>
                      <span className="block pt-0.5 text-tiny font-normal text-mute">{r.moduleName}</span>
                    </td>
                    <td className="px-2 py-3 text-label text-body">{r.type}</td>
                    <td className="px-2 py-3 text-label font-medium text-ink">{r.action}</td>
                    <td className="px-2 py-3">
                      <span className="num block max-w-[190px] truncate text-label font-medium text-navy">{r.target}</span>
                      <span className="num block max-w-[190px] truncate text-tiny font-normal text-mute">{r.targetSub}</span>
                    </td>
                    <td className="px-2 py-3"><Pill tone={r.resultTone}>{r.result}</Pill></td>
                    <td className="px-2 py-3"><Pill tone={r.sevTone}>{r.sev}</Pill></td>
                    <td className="px-2 py-3">
                      <span className="num block text-label text-body">{r.ip}</span>
                      <span className="block text-tiny font-normal text-mute">{r.device}</span>
                    </td>
                    <td className="py-3 pl-2 pr-4 text-right">
                      <button type="button" className="text-mute hover:text-navy" aria-label="상세"><Icon name="eye" size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
            <span className="num text-meta text-mute">전체 128,640 건 중 1-8 표시</span>
            <div className="flex items-center gap-1">
              <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute" aria-label="이전"><Icon name="chevronLeft" size={13} /></button>
              {[1, 2, 3, 4, 5].map(p => (
                <button key={p} type="button" className={`num h-7 w-7 rounded-md border text-meta font-semibold ${p === 1 ? 'border-navy bg-navy-soft text-navy-deep' : 'border-line text-body'}`}>{p}</button>
              ))}
              <span className="px-1 text-meta text-mute">…</span>
              <button type="button" className="num h-7 rounded-md border border-line px-2 text-meta font-semibold text-body">16,080</button>
              <button type="button" className="grid h-7 w-7 place-items-center rounded-md border border-line text-mute" aria-label="다음"><Icon name="chevronRight" size={13} /></button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="우선 검토 필요 이벤트"
              action={<button type="button" className="flex items-center gap-1 text-meta font-medium text-navy hover:underline">전체 보기 <Icon name="chevronRight" size={12} /></button>} />
            <div className="space-y-2 px-4 pb-4">
              {d.priority.map(p => (
                <div key={p.title} className="rounded-lg border border-line-soft px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Icon name="alert" size={13} className={p.level === '긴급' ? 'text-bad' : p.level === '경고' ? 'text-warn' : 'text-navy'} />
                      <b className="truncate text-label font-semibold text-ink">{p.title}</b>
                    </span>
                    <span className="num flex shrink-0 items-center gap-1.5 text-tiny font-normal text-mute">{p.at} <Pill tone={levelTone[p.level]}>{p.level}</Pill></span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 pl-5">
                    <span className="truncate text-tiny font-normal text-mute">{p.sub}</span>
                    <button type="button" className="shrink-0 rounded-md border border-line px-2 py-0.5 text-tiny font-semibold text-body hover:border-navy/40 hover:text-navy transition-colors">검토</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title={<>이벤트 분포 <span className="font-medium text-mute">(최근 30일)</span></>} />
            <div className="flex flex-col items-center gap-3 px-5 pb-5">
              <Donut size={140} thickness={22} centerTop="총 이벤트" centerBottom={d.distribution.total}
                segments={d.distribution.segments.map(s => ({ value: s.value, color: s.color }))} />
              <div className="w-full space-y-1.5">
                {d.distribution.segments.map(s => (
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
            <CardHeader title="보관 및 무결성 요약" formula={'일 1회 로그 해시 체인 생성 후\nXRPL 기록으로 공증 (변조 감지)'} />
            <div className="space-y-2.5 px-5 pb-5">
              {d.integrity.map(r => (
                <div key={r.label} className="flex items-center justify-between gap-2 whitespace-nowrap text-label">
                  <span className="text-mute">{r.label}</span>
                  {'tone' in r && r.tone === 'ok'
                    ? <Pill tone="ok">{r.value}</Pill>
                    : <b className="num font-semibold text-ink">{r.value}</b>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
