import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, GhostButton, FooterLinkButton } from '@/components/Card'
import { KpiCard, ProgressBar, KpiTone } from '@/components/KpiCard'
import { PageHeader, UpdatedMeta } from '@/components/PageHeader'
import { MultiLineChart, Donut } from '@/components/charts'
import { Pill, PillTone } from '@/components/Pill'
import { Icon } from '@/components/Icon'
import { PeriodBar, DeltaText } from './PeriodBar'
import { LiveStatus } from './LiveStatus'
import {
  DEMO_TODAY, PeriodKey, agg, seriesWindow, daily, totals, kpiTargets, at2WeeksBefore,
  telegramSources, telegramOps, funnel, searchRanking, integrations, opsAlerts,
} from '@/demo/generators/community'

const fmt = (n: number) => n.toLocaleString('ko-KR')
const kindTone: Record<string, PillTone> = { 브랜드: 'navy', 카테고리: 'mute', 주의: 'warn' }
const statusTone: Record<string, PillTone> = { 자동: 'ok', '준비 필요': 'warn', 수동: 'mute' }

export function CommunityPage() {
  const [period, setPeriod] = useState<PeriodKey>('d7')
  const [onlyRisk, setOnlyRisk] = useState(false)

  const aSignup = agg(daily.signup, period)
  const aTg = agg(daily.telegram, period)
  const aX = agg(daily.x, period)
  const aLink = agg(daily.linktree, period)
  const aInvite = agg(daily.invites, period)
  const aMsg = agg(daily.messages, period)

  const wSignup = seriesWindow(daily.signup, period)
  const wTg = seriesWindow(daily.telegram, period)
  const wX = seriesWindow(daily.x, period)
  const maxY = Math.max(...wSignup.data, ...wTg.data, ...wX.data, 100)
  const step = Math.ceil(maxY / 4 / 50) * 50
  const yTicks = [0, step, step * 2, step * 3, step * 4]

  const ranking = searchRanking(period).filter(r => !onlyRisk || r.kind === '주의')
  const riskSessions = searchRanking(period).filter(r => r.kind === '주의').reduce((a, r) => a + r.sessions, 0)

  const kpis = [
    { icon: 'users', tone: 'navy' as const, label: '사전신청 (누적)', value: fmt(totals.signup), unit: '명',
      sub: `기간 +${fmt(aSignup.cur)}명`, delta: aSignup.deltaPct, formula: '신청 페이지 휴대폰 인증 완료 수\n목표 10,000명 (판매량 5,000대의 2배)' },
    { icon: 'chat', tone: 'teal' as const, label: '텔레그램 구독자', value: fmt(totals.telegram), unit: '명',
      sub: `기간 +${fmt(aTg.cur)}명`, delta: aTg.deltaPct, formula: 'Bot API getChatMemberCount\n목표 5,000명' },
    { icon: 'share', tone: 'purple' as const, label: 'X 팔로워', value: fmt(totals.x), unit: '명',
      sub: `기간 +${fmt(aX.cur)}명`, delta: aX.deltaPct, formula: '팔로워 순증\n목표 5,000명 (전환 우선)' },
    { icon: 'link', tone: 'green' as const, label: '링크트리 클릭', value: fmt(totals.linktree),
      sub: `기간 ${fmt(aLink.cur)}회`, delta: aLink.deltaPct, formula: 'UTM + GA4 집계\n공식 링크 허브 · 사칭 방어' },
    { icon: 'heart', tone: 'pink' as const, label: '친구 초대 발생', value: fmt(totals.invites), unit: '건',
      sub: `초대율 ${((totals.invites / totals.signup) * 100).toFixed(1)}%`, delta: aInvite.deltaPct, formula: '초대 링크 생성·유입 건수\n사전예약 순번 상향 요인' },
    { icon: 'eye', tone: 'orange' as const, label: '대화방 메시지', value: fmt(aMsg.cur), unit: '건',
      sub: `응대 대기 ${telegramOps.pendingReplies}건 · 평균 ${telegramOps.avgReplyMin}분`, delta: aMsg.deltaPct, formula: '텔레그램 대화방 메시지 (기간)\n검증된 사실만 응대 원칙' },
  ]

  return (
    <>
      <PageHeader
        title={<span className="inline-flex flex-wrap items-center gap-2">WELLBIAN 커뮤니티 운영 <Pill tone="demo">데모 기준일 {DEMO_TODAY}</Pill></span>}
        subtitle="실제 운영 채널은 X · 텔레그램 2곳이고, 링크트리는 링크 허브입니다. 채널 현황과 사전신청을 한 화면에서 관리합니다. (운영 3주차 · 1차 판매 D-7)"
        meta={<UpdatedMeta />}
        actions={
          <>
            <Link to="/community/preorder"><GhostButton>사전신청·판매 퍼널 <Icon name="chevronRight" size={13} /></GhostButton></Link>
            <Link to="/community/content"><GhostButton>콘텐츠·일정 <Icon name="chevronRight" size={13} /></GhostButton></Link>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-navy px-3.5 py-2 text-label font-semibold text-white hover:bg-navy-deep transition-colors">
              <Icon name="download" size={14} /> 운영 리포트
            </button>
          </>
        }
      />

      <PeriodBar value={period} onChange={setPeriod}
        right={<span className="num text-tiny font-normal text-mute">채널 개설 08-19 · 사전신청 개시 08-26 · 1차 판매 09-15</span>} />

      <LiveStatus />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map(k => (
          <KpiCard key={k.label} icon={k.icon} tone={k.tone as KpiTone} label={k.label} formula={k.formula}
            value={k.value} unit={k.unit} sub={k.sub}
            delta={k.delta === null ? undefined : { text: `${k.delta >= 0 ? '+' : '−'}${Math.abs(k.delta).toFixed(1)}%`, tone: k.delta >= 0 ? 'ok' : 'bad' }}
            deltaLabel="vs 직전 동기간" />
        ))}
      </div>

      {/* 운영 알림 */}
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
        {opsAlerts.map(a => (
          <Card key={a.title} className="flex items-start gap-3 p-4">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.level === '주의' ? 'bg-warn-soft text-warn' : 'bg-navy-soft text-navy'}`}>
              <Icon name={a.level === '주의' ? 'alert' : 'info'} size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <b className="text-label font-bold text-ink">{a.title}</b>
                <Pill tone={a.level === '주의' ? 'warn' : 'navy'}>{a.level}</Pill>
              </span>
              <span className="mt-0.5 block text-meta leading-relaxed text-body">{a.detail}</span>
              <span className="mt-1 block text-tiny font-semibold text-navy">→ {a.action}</span>
            </span>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title={<>채널 성장 추이 <span className="font-medium text-mute">(일별 순증)</span></>}
            formula={'기간 필터에 따라 창이 이동합니다\n(추세 판독을 위해 최소 7일 표시)'}
            action={
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 whitespace-nowrap text-tiny text-mute">
                <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-navy" /> 사전신청</span>
                <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-[#3AB6C9]" /> 텔레그램</span>
                <span className="flex items-center gap-1"><span className="h-0.5 w-3.5 rounded bg-[#8F7BE8]" /> X</span>
              </span>
            }
          />
          <div className="px-4 pb-4">
            <MultiLineChart height={230} w={640} yTicks={yTicks} xLabels={wSignup.labels}
              yFmt={v => (v === 0 ? '0' : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v))}
              seriesList={[
                { data: wSignup.data, color: '#3E6FE0', dots: true },
                { data: wTg.data, color: '#3AB6C9', dots: true },
                { data: wX.data, color: '#8F7BE8', dots: true },
              ]} />
          </div>
          <div className="flex items-center gap-1.5 border-t border-line px-6 py-2.5 text-meta text-mute">
            <Icon name="info" size={13} /> 08-26 사전신청 개시 · 09-05 제품 실물 공개 시점에 전 채널 동반 상승
          </div>
        </Card>

        <Card>
          <CardHeader title="채널 KPI 목표 대비" formula={'기획안 ⑤ 채널 KPI\n판매 2주 전 / 1차 판매 전날 목표'} />
          <div className="space-y-3.5 px-5 pb-4">
            {kpiTargets.map(t => {
              const ratio = t.now / t.dday
              const past = t.name === '사전신청' ? at2WeeksBefore.signup : t.name === '텔레그램' ? at2WeeksBefore.telegram : at2WeeksBefore.x
              const hit2w = past >= t.d14
              return (
                <div key={t.name} className="rounded-lg border border-line-soft p-3">
                  <div className="flex items-center justify-between gap-2">
                    <b className="text-label font-bold text-ink">{t.name}</b>
                    <span className="num text-label font-bold text-navy">{(ratio * 100).toFixed(1)}%</span>
                  </div>
                  <div className="num mt-1 flex items-baseline gap-1.5 text-meta text-body">
                    <b className="text-[17px] font-bold text-ink">{fmt(t.now)}</b>
                    <span className="text-mute">/ 전날 목표 {fmt(t.dday)}명</span>
                  </div>
                  <ProgressBar ratio={ratio} className="mt-2" />
                  <div className="mt-1.5 flex items-center justify-between gap-2 whitespace-nowrap">
                    <span className="num text-tiny font-normal text-mute">2주 전 목표 {fmt(t.d14)} · 실적 {fmt(past)}</span>
                    <Pill tone={hit2w ? 'ok' : 'warn'}>{hit2w ? '달성' : '미달'}</Pill>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mx-4 mb-4 rounded-lg border border-line bg-navy-tint px-3.5 py-2.5 text-meta leading-relaxed text-body">
            신청이 부진하면 외부 홍보에 더 집중합니다 — 사전신청은 <b className="font-semibold text-ink">판매 전에 수요를 알 수 있는 장치</b>입니다.
          </div>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_1fr_1fr]">
        <Card>
          <CardHeader title="사전신청 퍼널" formula={'방문 → 휴대폰 인증(약 10초) → 신청 완료 → 초대 링크\n각 단계 전환율 = 다음 단계 / 이전 단계'} />
          <div className="space-y-2.5 px-5 pb-5">
            {funnel.map((f, i) => {
              const ratio = f.value / funnel[0].value
              const conv = i === 0 ? null : (f.value / funnel[i - 1].value) * 100
              return (
                <div key={f.step}>
                  <div className="flex items-center justify-between gap-2 whitespace-nowrap">
                    <span className="text-label text-body">{f.step}</span>
                    <span className="num text-label font-bold text-ink">
                      {fmt(f.value)}
                      {conv !== null && <span className="ml-1.5 text-meta font-semibold text-navy">{conv.toFixed(1)}%</span>}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-line-soft">
                    <div className="h-full rounded-full transition-all" style={{ width: `${ratio * 100}%`, background: f.color }} />
                  </div>
                </div>
              )
            })}
            <Link to="/community/preorder"
              className="mt-1 flex items-center justify-between gap-2 rounded-lg border border-line-soft px-3 py-2 text-meta leading-relaxed text-mute transition-colors hover:border-navy/40 hover:text-navy">
              <span>판매일 그룹별 소진·완판 시나리오는 <b className="font-semibold text-body">사전신청·판매 퍼널</b>에서 확인</span>
              <Icon name="chevronRight" size={13} className="shrink-0" />
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader title="텔레그램 유입원" formula={'초대 링크별 분해 (createChatInviteLink)\nchat_member 업데이트로 링크별 유입 집계'} />
          <div className="flex flex-col items-center gap-4 px-5 pb-5 sm:flex-row sm:gap-5">
            <Donut size={150} thickness={26} centerTop="텔레그램" centerBottom={fmt(totals.telegram)} centerSub="구독자"
              segments={telegramSources.map(s => ({ value: s.value, color: s.color }))} />
            <div className="w-full flex-1 space-y-2">
              {telegramSources.map(s => (
                <div key={s.label} className="flex items-center justify-between gap-2 text-tiny font-normal">
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-body">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />{s.label}
                  </span>
                  <span className="num shrink-0 font-semibold text-ink">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="텔레그램 운영 상태"
            action={<Pill tone={telegramOps.pendingReplies > 5 ? 'warn' : 'ok'}>응대 {telegramOps.pendingReplies}건 대기</Pill>} />
          <div className="grid grid-cols-2 gap-2.5 px-5 pb-4">
            {([
              ['오늘 순증', `+${daily.telegram[daily.telegram.length - 1]}`, 'text-ok'],
              ['오늘 이탈', `−${telegramOps.leaveToday}`, 'text-bad'],
              ['활성 대화 참여자', fmt(telegramOps.activeChatters), 'text-ink'],
              ['차단·스팸 처리', String(telegramOps.blockedSpam), 'text-ink'],
            ] as const).map(([l, v, c]) => (
              <div key={l} className="rounded-lg border border-line-soft px-3 py-2">
                <span className="block text-tiny font-medium text-mute">{l}</span>
                <b className={`num text-[16px] font-bold ${c}`}>{v}</b>
              </div>
            ))}
          </div>
          <div className="mx-4 mb-4 rounded-lg border border-line px-3.5 py-2.5">
            <div className="flex items-center justify-between text-meta">
              <span className="text-body">공지 발행 (하루 3회 이내 규칙)</span>
              <b className="num font-bold text-ink">{telegramOps.noticeToday} / {telegramOps.noticeCap}</b>
            </div>
            <ProgressBar ratio={telegramOps.noticeToday / telegramOps.noticeCap} className="mt-2" />
            <p className="mt-2 text-tiny font-normal leading-relaxed text-mute">
              공지 채널은 하루 3번 이내, 대화방은 수시 응대(검증된 사실만).
            </p>
          </div>
        </Card>
      </div>

      {/* 검색어 현황 */}
      <Card className="mt-4">
        <CardHeader
          title={<>관련 검색어 현황 <span className="font-medium text-mute">(기간 필터 적용)</span></>}
          formula={'검색량 = 네이버 데이터랩 · 구글 서치콘솔 집계\n유입 세션 = 검색량 × 클릭률'}
          action={
            <span className="flex flex-wrap items-center gap-2">
              <span className="num text-tiny font-normal text-mute">주의 검색어 유입 {fmt(riskSessions)}세션</span>
              <button type="button" onClick={() => setOnlyRisk(v => !v)}
                className={`rounded-full border px-2.5 py-1 text-tiny font-semibold transition-colors ${
                  onlyRisk ? 'border-warn bg-warn-soft text-warn' : 'border-line text-body hover:border-navy/40'}`}>
                주의 검색어만
              </button>
            </span>
          }
        />
        <div className="overflow-x-auto px-4">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                <th className="px-2 py-2 font-medium">순위</th>
                <th className="px-2 py-2 font-medium">검색어</th>
                <th className="px-2 py-2 font-medium">구분</th>
                <th className="px-2 py-2 text-right font-medium">검색량</th>
                <th className="px-2 py-2 text-right font-medium">직전 대비</th>
                <th className="px-2 py-2 text-right font-medium">유입 세션</th>
                <th className="px-2 py-2 font-medium">수집처</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map(r => (
                <tr key={r.term} className={`whitespace-nowrap border-b border-line-soft last:border-0 ${r.kind === '주의' ? 'bg-warn-soft/30' : ''}`}>
                  <td className="num px-2 py-2.5 text-label font-semibold text-mute">{r.rank}</td>
                  <td className="px-2 py-2.5 text-label font-semibold text-ink">
                    {r.term}
                    {r.isNew && <Pill tone="navy" className="ml-1.5">신규</Pill>}
                  </td>
                  <td className="px-2 py-2.5"><Pill tone={kindTone[r.kind]}>{r.kind}</Pill></td>
                  <td className="num px-2 py-2.5 text-right text-label font-medium text-ink">{fmt(r.volume)}</td>
                  <td className="px-2 py-2.5 text-right"><DeltaText pct={r.deltaPct} hasPrev={r.hasPrev} invert={r.kind === '주의'} /></td>
                  <td className="num px-2 py-2.5 text-right text-label text-body">{fmt(r.sessions)}</td>
                  <td className="px-2 py-2.5 text-label text-mute">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-6 py-3 text-meta leading-relaxed text-mute">
          <Icon name="alert" size={13} className="text-warn" />
          <span><b className="font-semibold text-body">주의</b> 구분은 투자·에어드랍 기대 또는 사칭 관련 검색어입니다. 유입이 늘면 공지 카드에 프로젝트 성격 고지를 편성하세요.</span>
        </div>
      </Card>

      {/* 데이터 연동 현황 */}
      <Card className="mt-4">
        <CardHeader title="데이터 연동 현황"
          formula={'자동 = API로 수집 중 · 준비 필요 = 추가 연동 작업 필요\n수동 = 담당자 입력'}
          action={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-tiny text-mute">
              <span className="flex items-center gap-1"><Pill tone="ok">자동</Pill> {integrations.filter(i => i.status === '자동').length}</span>
              <span className="flex items-center gap-1"><Pill tone="warn">준비 필요</Pill> {integrations.filter(i => i.status === '준비 필요').length}</span>
              <span className="flex items-center gap-1"><Pill tone="mute">수동</Pill> {integrations.filter(i => i.status === '수동').length}</span>
            </span>
          } />
        <div className="overflow-x-auto px-4">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="whitespace-nowrap border-b border-line text-left text-meta font-medium text-mute">
                <th className="px-2 py-2 font-medium">채널</th>
                <th className="px-2 py-2 font-medium">지표</th>
                <th className="px-2 py-2 font-medium">수집 방식</th>
                <th className="px-2 py-2 font-medium">주기</th>
                <th className="px-2 py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map(i => (
                <tr key={`${i.ch}-${i.metric}`} className="whitespace-nowrap border-b border-line-soft last:border-0">
                  <td className="px-2 py-2.5 text-label font-semibold text-ink">{i.ch}</td>
                  <td className="px-2 py-2.5 text-label text-body">{i.metric}</td>
                  <td className="num px-2 py-2.5 text-label text-mute">{i.how}</td>
                  <td className="num px-2 py-2.5 text-label text-body">{i.cycle}</td>
                  <td className="px-2 py-2.5"><Pill tone={statusTone[i.status]}>{i.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 pb-4 pt-3">
          <Link to="/community/content"><FooterLinkButton>콘텐츠 · 일정 · 외부 파급 보기 →</FooterLinkButton></Link>
        </div>
      </Card>
    </>
  )
}
