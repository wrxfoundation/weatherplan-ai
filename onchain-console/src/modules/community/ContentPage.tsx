import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, GhostButton } from '@/components/Card'
import { PageHeader, UpdatedMeta } from '@/components/PageHeader'
import { BarChart } from '@/components/charts'
import { Pill, PillTone } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { PeriodBar } from './PeriodBar'
import {
  DEMO_TODAY, PeriodKey, agg, seriesWindow, daily, contentAxes, contentFormats,
  cadence, milestones, partners, impersonation,
} from '@/demo/generators/community'

const fmt = (n: number) => n.toLocaleString('ko-KR')
const axisColor: Record<string, string> = { 측정: '#3E6FE0', 기대: '#2FA870', 판매: '#E0A63E' }
const axisLabel: Record<string, string> = { 측정: '측정 이야기', 기대: '프로젝트 기대효과', 판매: '판매 안내' }

export function ContentPage() {
  const [period, setPeriod] = useState<PeriodKey>('d14')
  const aPosts = agg(daily.posts, period)
  const wPosts = seriesWindow(daily.posts, period)
  const plan = contentAxes.plan[contentAxes.actualWeek - 1]

  return (
    <>
      <PageHeader
        title={<span className="inline-flex flex-wrap items-center gap-2">콘텐츠 · 일정 <Pill tone="demo">데모 기준일 {DEMO_TODAY}</Pill></span>}
        subtitle="콘텐츠 3축·7형식 발행 균형, 판매 일정, 외부 파급 협의, 사칭 대응을 관리합니다."
        meta={<UpdatedMeta />}
        actions={<Link to="/community"><GhostButton><Icon name="chevronLeft" size={13} /> 운영 대시보드</GhostButton></Link>}
      />

      <PeriodBar value={period} onChange={setPeriod}
        right={<span className="num text-tiny font-normal text-mute">기간 발행 {aPosts.cur}건 · 주 5회 사진 + 2회 영상 기준</span>} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1.4fr]">
        <Card>
          <CardHeader title={<>콘텐츠 3축 비중 <span className="font-medium text-mute">({contentAxes.actualWeek}주차)</span></>}
            formula={'계획 비중은 주차별로 고정\n판매일이 가까울수록 판매 안내 비중만 증가'} />
          <div className="space-y-4 px-5 pb-4">
            {(['측정', '기대', '판매'] as const).map(k => {
              const p = plan[k]
              const a = contentAxes.actual[k]
              const gap = a - p
              return (
                <div key={k}>
                  <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                    <span className="text-label font-semibold text-ink">{axisLabel[k]}</span>
                    <span className="num text-meta text-body">
                      계획 {p}% · 실제 <b className="font-bold text-ink">{a}%</b>
                      <b className={`ml-1.5 font-semibold ${Math.abs(gap) <= 3 ? 'text-ok' : 'text-warn'}`}>
                        {gap >= 0 ? '+' : '−'}{Math.abs(gap)}p
                      </b>
                    </span>
                  </div>
                  <div className="relative mt-1.5 h-3 overflow-hidden rounded-full bg-line-soft">
                    <div className="h-full rounded-full" style={{ width: `${a}%`, background: axisColor[k] }} />
                    <span className="absolute top-[-2px] h-[16px] w-0.5 bg-ink/60" style={{ left: `${p}%` }} title={`계획 ${p}%`} />
                  </div>
                </div>
              )
            })}
            <p className="text-tiny font-normal leading-relaxed text-mute">
              세로선 = 계획 비중. 기기 판매 이야기만 하면 판매 계정이 되므로 측정·기대효과 두 축은 <b className="font-semibold text-body">판매 주간까지 유지</b>합니다.
            </p>
          </div>
          <div className="overflow-x-auto border-t border-line px-4 pb-4">
            <table className="w-full min-w-[380px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">주차</th>
                  <th className="px-2 py-2 text-right font-medium">측정</th>
                  <th className="px-2 py-2 text-right font-medium">기대효과</th>
                  <th className="px-2 py-2 text-right font-medium">판매 안내</th>
                </tr>
              </thead>
              <tbody>
                {contentAxes.plan.map((w, i) => (
                  <tr key={w.week} className={`whitespace-nowrap border-b border-line-soft last:border-0 ${i + 1 === contentAxes.actualWeek ? 'bg-navy-tint/70' : ''}`}>
                    <td className={`px-2 py-2 text-label ${i + 1 === contentAxes.actualWeek ? 'font-bold text-navy-deep' : 'text-body'}`}>
                      {w.week}{i + 1 === contentAxes.actualWeek && ' ← 현재'}
                    </td>
                    <td className="num px-2 py-2 text-right text-label text-body">{w.측정}%</td>
                    <td className="num px-2 py-2 text-right text-label text-body">{w.기대}%</td>
                    <td className="num px-2 py-2 text-right text-label font-semibold text-ink">{w.판매}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="게시물 형식 7종 발행 현황"
            formula={'형식을 늘리지 않고 반복해야 알아봅니다\n저장·퍼감 수 = 인용 확산 지표'}
            action={
              <span className="flex items-center gap-2 whitespace-nowrap text-tiny text-mute">
                <Pill tone={cadence.photoActual >= cadence.photoPerWeek ? 'ok' : 'warn'}>사진 {cadence.photoActual}/{cadence.photoPerWeek}</Pill>
                <Pill tone={cadence.videoActual >= cadence.videoPerWeek ? 'ok' : 'warn'}>영상 {cadence.videoActual}/{cadence.videoPerWeek}</Pill>
              </span>
            } />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">형식</th>
                  <th className="px-2 py-2 font-medium">담당 축</th>
                  <th className="px-2 py-2 text-right font-medium">발행</th>
                  <th className="px-2 py-2 text-right font-medium">비중</th>
                  <th className="px-2 py-2 text-right font-medium">도달</th>
                  <th className="px-2 py-2 text-right font-medium">저장·퍼감</th>
                </tr>
              </thead>
              <tbody>
                {contentFormats.map(f => (
                  <tr key={f.no} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="px-2 py-2.5 text-label font-semibold text-ink">{f.no} {f.name}</td>
                    <td className="px-2 py-2.5 text-label text-body">{f.axis}</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{f.count}건</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{f.share}%</td>
                    <td className="num px-2 py-2.5 text-right text-label text-body">{fmt(f.reach)}</td>
                    <td className={`num px-2 py-2.5 text-right text-label font-semibold ${f.save >= 900 ? 'text-ok' : 'text-ink'}`}>{fmt(f.save)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-1.5 border-t border-line px-6 py-2.5 text-meta leading-relaxed text-mute">
            <Icon name="info" size={13} />
            저장·퍼감 1위는 <b className="font-semibold text-body">⑤ 데이터 카드</b>, 2위는 <b className="font-semibold text-body">③ 측정 결과 비교</b> — 남이 퍼가는 형식이 설계대로 작동 중입니다.
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader title={<>발행 리듬 <span className="font-medium text-mute">(일별 게시물)</span></>}
            action={<span className="num text-meta text-mute">기간 {aPosts.cur}건</span>} />
          <div className="px-4 pb-4">
            <BarChart data={wPosts.data} xLabels={wPosts.labels} yTicks={[0, 1, 2, 3, 4]} height={180} w={560} />
          </div>
        </Card>

        <Card>
          <CardHeader title="일정 · 마일스톤" formula={'1차 판매 09-15 · 2차 판매 10-03\n2차는 1차 배송 전이므로 사전 고지 필요'} />
          <div className="space-y-2 px-5 pb-5">
            {milestones.map(m => (
              <div key={m.date} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${m.done ? 'border-line-soft' : 'border-navy/40 bg-navy-tint/60'}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${m.done ? 'bg-ok-soft text-ok' : 'bg-navy text-white'}`}>
                  <Icon name={m.done ? 'audit' : 'clock'} size={14} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label font-semibold text-ink">{m.label}</span>
                  <span className="block truncate text-tiny font-normal text-mute">{m.detail}</span>
                </span>
                <span className="num shrink-0 text-right">
                  <span className="block text-meta text-body">{m.date.slice(5)}</span>
                  <Pill tone={m.done ? 'mute' : m.dday <= 7 ? 'bad' : 'navy'}>{m.done ? '완료' : `D-${m.dday}`}</Pill>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader title="외부 채널 소개 협의"
            formula={'외부 소개 1회의 도달은 자체 채널과 비교 불가\n시점을 우리 이벤트 일정에 맞춰 집중'} />
          <div className="overflow-x-auto px-4">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                  <th className="px-2 py-2 font-medium">대상</th>
                  <th className="px-2 py-2 font-medium">요청 내용</th>
                  <th className="px-2 py-2 font-medium">희망 시점</th>
                  <th className="px-2 py-2 font-medium">우리가 준비할 것</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.name} className="whitespace-nowrap border-b border-line-soft last:border-0">
                    <td className="px-2 py-2.5 text-label font-semibold text-ink">{p.name}</td>
                    <td className="px-2 py-2.5 text-label text-body">{p.ask}</td>
                    <td className="px-2 py-2.5 text-label text-body">{p.when}</td>
                    <td className="px-2 py-2.5 text-label text-mute">{p.prep}</td>
                    <td className="px-2 py-2.5"><Pill tone={p.tone as PillTone}>{p.status}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="h-4" />
        </Card>

        <Card>
          <CardHeader title="사칭 · 리스크 모니터링"
            formula={'사칭 주의 공지를 ⑦ 공지 카드 정기 항목으로 편성\n(Ripple 사례 차용)'}
            action={<Pill tone={impersonation.pending > 0 ? 'warn' : 'ok'}>처리 대기 {impersonation.pending}건</Pill>} />
          <div className="grid grid-cols-4 gap-2 px-5">
            {([['탐지', impersonation.detected, 'text-ink'], ['신고', impersonation.reported, 'text-navy'],
              ['삭제', impersonation.removed, 'text-ok'], ['대기', impersonation.pending, 'text-warn']] as const).map(([l, v, c]) => (
              <div key={l} className="rounded-lg border border-line-soft px-2 py-2 text-center">
                <span className="block text-tiny font-medium text-mute">{l}</span>
                <b className={`num text-[17px] font-bold ${c}`}>{v}</b>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 px-4">
            {impersonation.cases.map(c => (
              <div key={c.handle} className="flex items-center gap-2.5 rounded-lg border border-line-soft px-3 py-2">
                <span className="num w-10 shrink-0 text-tiny font-normal text-mute">{c.at}</span>
                <span className="min-w-0 flex-1">
                  <span className="num block truncate text-label font-semibold text-ink">{c.handle}</span>
                  <span className="block truncate text-tiny font-normal text-mute">{c.ch} · {c.type}</span>
                </span>
                <Pill tone={c.tone}>{c.action}</Pill>
              </div>
            ))}
          </div>
          <div className="mx-4 mb-4 mt-3 rounded-lg border border-line bg-navy-tint px-3.5 py-2.5 text-meta leading-relaxed text-body">
            사칭 주의 공지 최근 발행 <b className="num font-semibold text-ink">{impersonation.lastNotice}</b> · 주기 {impersonation.noticeCycle}
          </div>
        </Card>
      </div>
    </>
  )
}
