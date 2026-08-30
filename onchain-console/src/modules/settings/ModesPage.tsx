import { Card, CardHeader, GhostButton } from '@/components/Card'
import { KpiCard, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta } from '@/components/PageHeader'
import { Donut } from '@/components/charts'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { Toggle, Avatar } from '@/components/Toggle'
import { modesDemo as d, rosterColors } from '@/demo/generators/settings'
import { series } from '@/demo/rand'

const sparks = [series(201, 12, 8, 9, 0.4), series(202, 12, 0, 0, 0.01), series(203, 12, 0.5, 2, 0.7), series(204, 12, 8, 14, 2.4)]

export function ModesPage() {
  return (
    <>
      <PageHeader
        title="모듈 모드 관리"
        subtitle="9개 운영 모듈의 실행 모드, 동기화 상태, 전환 조건을 한눈에 관리하세요."
        meta={<UpdatedMeta text={`최근 업데이트 ${d.updatedAgo}`} />}
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {d.kpis.map((k, i) => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label}
            value={k.value} sub={k.sub} spark={sparks[i]} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader title="모듈별 모드 현황" />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">모듈</th>
                  <th className="px-2 py-2 font-medium">현재 모드</th>
                  <th className="px-2 py-2 font-medium">전환 요청</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                  <th className="px-2 py-2 font-medium">마지막 변경</th>
                  <th className="px-2 py-2 font-medium">담당자</th>
                  <th className="px-2 py-2 text-right font-medium">데모</th>
                </tr>
              </thead>
              <tbody>
                {d.modules.map(m => (
                  <tr key={m.name} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-2 text-label font-medium text-ink">
                        <Icon name={m.icon} size={14} className="text-mute" />{m.name}
                      </span>
                    </td>
                    <td className="px-2 py-2.5"><Pill tone="navy">DEMO</Pill></td>
                    <td className="px-2 py-2.5">
                      {m.request ? <Pill tone="bad">{m.request}</Pill> : <span className="text-label text-mute">–</span>}
                    </td>
                    <td className="px-2 py-2.5">
                      <Pill tone={m.status === '정상' ? 'ok' : m.status === '승인 대기' ? 'warn' : 'demo'}>{m.status}</Pill>
                    </td>
                    <td className="num px-2 py-2.5 text-label text-body">{m.changed}</td>
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-1.5 text-label text-body">
                        <Avatar name={m.owner} size={20} color={rosterColors[m.owner]} />{m.owner}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right"><Toggle on /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-1.5 px-6 pb-4 pt-3 text-meta text-mute">
            <Icon name="info" size={13} /> 데모 모드는 실제 데이터가 사용되지 않으며, 모든 변경은 안전하게 테스트됩니다.
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="모드 전환 규칙" formula={'라이브 전환 조건: 모듈이 요구하는\n지갑 주소가 wallets에 등록되어 있을 것 (PRD §3)'} />
            <div className="space-y-3 px-5 pb-5">
              {d.rules.map(r => (
                <div key={r.title} className="flex gap-2.5">
                  <span className="mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
                    <Icon name="audit" size={11} strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="block text-label font-semibold text-ink">{r.title}</span>
                    <span className="block text-tiny font-normal leading-relaxed text-mute">{r.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="즉시 실행" />
            <div className="space-y-2 px-4 pb-4">
              <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-3 py-2.5 text-label font-semibold text-white hover:bg-navy-deep transition-colors">
                <Icon name="sliders" size={14} /> 전체 DEMO 적용
              </button>
              <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-label font-medium text-body hover:border-navy/40 hover:text-navy transition-colors">
                <Icon name="share" size={14} /> LIVE 전환 요청
              </button>
              <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg border border-line px-3 py-2.5 text-label font-medium text-body hover:border-navy/40 hover:text-navy transition-colors">
                <Icon name="download" size={14} /> 변경 이력 다운로드
              </button>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_1fr]">
        <Card>
          <CardHeader title="최근 모드 변경 이력"
            action={<button type="button" className="flex items-center gap-1 text-meta font-medium text-navy hover:underline">전체 이력 보기 <Icon name="chevronRight" size={12} /></button>} />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">날짜/시간</th>
                  <th className="px-2 py-2 font-medium">모듈</th>
                  <th className="px-2 py-2 font-medium">변경 내용</th>
                  <th className="px-2 py-2 font-medium">요청자</th>
                  <th className="px-2 py-2 font-medium">결과</th>
                </tr>
              </thead>
              <tbody>
                {d.history.map(h => (
                  <tr key={h.at} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="num px-2 py-2.5 text-label text-body">{h.at}</td>
                    <td className="px-2 py-2.5 text-label font-medium text-ink">{h.module}</td>
                    <td className="px-2 py-2.5"><Pill tone={h.changeTone}>{h.change}</Pill></td>
                    <td className="px-2 py-2.5 text-label text-body">{h.actor}</td>
                    <td className="px-2 py-2.5"><Pill tone={h.resultTone}>{h.result}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-1.5 px-6 pb-4 pt-3 text-meta text-mute">
            <Icon name="info" size={13} /> 이력은 최근 90일간 유지됩니다.
          </div>
        </Card>

        <Card>
          <CardHeader title="환경 요약" />
          <div className="grid grid-cols-2 gap-4 px-5 pb-5">
            <div className="rounded-lg border border-line-soft p-4 text-center">
              <div className="text-meta font-medium text-body">모드 분포</div>
              <div className="mt-2 flex justify-center">
                <Donut size={110} thickness={16} centerTop="전체 모듈" centerBottom="9"
                  segments={[{ value: 9, color: '#3E6FE0' }, { value: 0.001, color: '#2FA870' }]} />
              </div>
              <div className="mt-2 space-y-1 text-tiny font-normal">
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-body"><span className="h-2 w-2 rounded-full bg-navy" />DEMO</span><b className="num text-ink">100% (9)</b></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-body"><span className="h-2 w-2 rounded-full bg-ok" />LIVE</span><b className="num text-ink">0% (0)</b></div>
              </div>
            </div>
            <div className="rounded-lg border border-line-soft p-4 text-center">
              <div className="text-meta font-medium text-body">동기화 상태</div>
              <div className="mt-2 flex justify-center">
                <Donut size={110} thickness={16} centerTop="정상" centerBottom="89%"
                  segments={[{ value: d.sync.ok, color: '#2FA870' }, { value: d.sync.check, color: '#E0A63E' }]} />
              </div>
              <div className="mt-2 space-y-1 text-tiny font-normal">
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-body"><span className="h-2 w-2 rounded-full bg-ok" />정상</span><b className="num text-ink">{d.sync.ok} (89%)</b></div>
                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-body"><span className="h-2 w-2 rounded-full bg-amber" />점검 필요</span><b className="num text-ink">{d.sync.check} (11%)</b></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-card border border-amber/40 bg-amber-soft px-5 py-4">
        <span className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber"><Icon name="alert" size={17} /></span>
          <span>
            <span className="block text-label font-bold text-ink">라이브 전환 조건 확인 필요</span>
            <span className="block text-meta text-body">2개 모듈의 전환 요청이 승인 대기 중입니다. 모드 전환 규칙을 모두 충족한 후 승인해주세요.</span>
          </span>
        </span>
        <GhostButton className="shrink-0">전환 대기 모듈 보기 <Icon name="chevronRight" size={13} /></GhostButton>
      </div>
    </>
  )
}
