// ─── S-12 파트너 마이오피스 대시보드 (목업 #2c) ──────────────────
// "월말이 아니라, 매일 보입니다" — 그날 할 일과 돈이 한 화면에.
import { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { useStore, tenantLeads, tenantSettlement } from '../../lib/store'
import { won, minutesAgo, fmtDate, dday } from '../../lib/engine'
import { LEAD_STATUS, STATUS_COLOR, catBySlug } from '../../lib/constants'
import { sellerCoach } from '../../lib/ai'
import { KpiCard, Card, LiveDot, useToast, useCountUp } from '../../components/ui'
import { Donut, Legend, Spark, CHART } from '../../components/charts'
import { AiInsight } from '../../components/AiPanel'
import { LeadRow, LeadDrawer } from '../../components/leads'

const CHART_COLORS = [CHART.primary, CHART.indigo, CHART.warn, CHART.rest]

export default function OfficeDashboard() {
  const { tenant } = useOutletContext()
  const { db } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const [filter, setFilter] = useState('전체')
  const [openLead, setOpenLead] = useState(null)

  const leads = useMemo(() => tenantLeads(db, tenant.id).sort((a, b) => b.createdAt - a.createdAt), [db, tenant.id])
  const today = leads.filter((l) => Date.now() - l.createdAt < 86400000)
  // 어제 대비 델타 — 가공값이 아니라 실제 타임스탬프 비교 (투명정산 화면의 신뢰 원칙)
  const yesterday = leads.filter((l) => { const age = Date.now() - l.createdAt; return age >= 86400000 && age < 172800000 })
  const waiting = leads.filter((l) => ['접수', '상담대기'].includes(l.status))
  const overdue = waiting.filter((l) => l.status === '접수' && minutesAgo(l.createdAt) >= 10)
  const settle = useMemo(() => tenantSettlement(db, tenant.id), [db, tenant.id])
  const filtered = filter === '전체' ? leads : leads.filter((l) => l.status === filter)
  const live = db.leads.find((l) => l.id === openLead?.id) ?? null

  // 카테고리 비중 도넛
  const catAgg = useMemo(() => {
    const m = {}
    leads.forEach((l) => { m[l.cat] = (m[l.cat] ?? 0) + 1 })
    const top = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 4)
    return top.map(([cat, value], i) => ({ label: catBySlug(cat)?.name ?? cat, value, color: CHART_COLORS[i] }))
  }, [leads])

  const expiring = db.contracts.filter((c) => c.tenantId === tenant.id).sort((a, b) => a.expiry - b.expiry).slice(0, 3)
  const notice = db.notices.find((n) => n.target === 'office')
  const d = new Date()

  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/m/${tenant.slug}`); toast('내 몰 주소를 복사했어요') } catch { toast('복사 실패', 'err') }
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* 헤더 행 */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-bink">안녕하세요, {tenant.name} 사장님 👋</h1>
          <p className="mt-1 text-[13px] text-bmuted">{d.getMonth() + 1}월 {d.getDate()}일 · 정산은 <strong className="font-bold text-bink">월말이 아니라, 매일 보입니다</strong></p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyUrl} className="flex h-9 items-center gap-2 rounded-full border border-bline bg-white px-3.5 text-[12.5px] font-semibold text-bbody hover:border-primary hover:text-primary-text">
            <LiveDot /> moduon.com/m/{tenant.slug} <span className="text-bfaint">⧉</span>
          </button>
          <Link to={`/m/${tenant.slug}`} className="flex h-9 items-center rounded-full bg-bink px-4 text-[12.5px] font-bold text-white hover:opacity-90">내 몰 보기</Link>
        </div>
      </div>

      {/* KPI 4 */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="오늘 새 리드" value={today.length} suffix="건" delta={today.length - yesterday.length} deltaSuffix="건" caption="어제 대비" />
        <KpiCard
          label="처리 대기" value={waiting.length} suffix="건"
          accent={overdue.length ? 'text-warn' : undefined}
          caption={overdue.length ? `⚠ 10분 초과 ${overdue.length}건 — 빠른 연락이 전환율을 높여요` : '모두 10분 내 응대 중 👍'}
        />
        <KpiCard
          label="이번 달 예상 수익" value={Math.max(0, settle.net + settle.expected)} format={(n) => n.toLocaleString('ko-KR')} suffix="원"
          delta={12.4} spark={<Spark values={[24, 31, 28, 39, 36, 47, 52]} />} caption={`확정 전 예정 수수료 ${won(settle.expected)} 포함`}
        />
        <KpiCard
          label="확정 수익" value={Math.max(0, settle.net)} suffix="원" accent="text-primary-text"
          caption={`${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 20).getMonth() + 1}월 20일 지급 예정`}
        />
      </div>

      {/* 오늘의 AI 코칭 — 내 리드 현황 → 지금 할 일 (Opus 5 · 로컬 폴백) */}
      <div className="mt-4">
        <AiInsight
          title="오늘의 AI 코칭"
          desc="내 리드·대기·만기 현황을 읽고 지금 바로 할 일을 우선순위로 짚어드려요."
          cta="오늘 할 일 코칭 받기"
          build={() => sellerCoach({
            today: today.length,
            waiting: waiting.length,
            overdue: overdue.length,
            expected: settle.expected,
            net: settle.net,
            topCat: catAgg.slice(0, 3).map((c) => ({ name: c.label, n: c.value })),
            expiring: expiring.map((c) => ({ customer: c.customer, dd: dday(c.expiry) })),
          })}
        />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[7fr_5fr]">
        {/* ── 리드 인박스 ── */}
        <Card track="b" className="overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
            <div className="flex items-center gap-2">
              <h2 className="text-[15.5px] font-extrabold text-bink">리드 인박스</h2>
              <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-ok"><LiveDot /> 실시간</span>
            </div>
            <Link to="/office/leads" className="text-[12.5px] font-bold text-primary-text">전체 보기 →</Link>
          </div>
          {/* 필터 탭 */}
          <div className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto px-4 pb-3 sm:px-5">
            {['전체', ...LEAD_STATUS].map((s) => {
              const count = s === '전체' ? leads.length : leads.filter((l) => l.status === s).length
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[12.5px] font-bold transition-colors ${
                    filter === s ? 'bg-bink text-white' : 'bg-brow text-bbody hover:bg-bline'
                  }`}
                >
                  {s} <span className={`tnum ${filter === s ? 'text-white/70' : 'text-bfaint'}`}>{count}</span>
                </button>
              )
            })}
          </div>
          <div className="border-t border-brow">
            {filtered.slice(0, 8).map((l) => (
              <LeadRow key={l.id} lead={l} onOpen={() => setOpenLead(l)} />
            ))}
            {filtered.length === 0 && <div className="py-10 text-center text-[13px] text-bfaint">해당 상태의 리드가 없습니다</div>}
          </div>
          <p className="px-5 py-3 text-[11px] text-bfaint">고객 개인정보는 상담 목적으로만 사용하세요. 모든 열람·처리 내역이 기록됩니다.</p>
        </Card>

        {/* ── 우측 컬럼 ── */}
        <div className="flex flex-col gap-4">
          {/* 정산 카드 */}
          <Card track="b" className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15.5px] font-extrabold text-bink">이번 달 정산</h2>
              <span className="rounded-full bg-ok/10 px-2.5 py-1 text-[11.5px] font-bold text-ok">매일 갱신</span>
            </div>
            <SettleAmount value={Math.max(0, settle.net)} />
            <div className="mt-1 text-[12px] text-bfaint">
              완료 {settle.doneCount}건 · 진행 {settle.pendingCount}건 · 건당 평균 수수료 {won(settle.doneCount ? settle.lines.reduce((s, l) => s + l.fee, 0) / settle.doneCount : 99000)}
            </div>
            <div className="mt-4 flex items-center gap-4">
              {catAgg.length > 0
                ? <Donut data={catAgg} centerTop={`${leads.length}건`} centerSub="카테고리 비중" />
                : <Donut data={[{ label: '-', value: 1, color: CHART.rest }]} centerTop="0건" centerSub="리드 없음" />}
              <Legend data={catAgg} className="flex-1" />
            </div>
            <Link to="/office/settlement" className="mt-4 flex h-10 items-center justify-center rounded-field border border-bline text-[13px] font-bold text-bbody hover:border-primary hover:text-primary-text">
              일별 명세 보기
            </Link>
          </Card>

          {/* 만기 D-day */}
          <Card track="b" className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15.5px] font-extrabold text-bink">다가오는 만기 D-day</h2>
              <Link to="/office/customers" className="text-[12.5px] font-bold text-primary-text">고객 관리 →</Link>
            </div>
            <div className="mt-3 flex flex-col gap-2.5">
              {expiring.map((c) => {
                const dd = dday(c.expiry)
                const tone = dd <= 14 ? 'bg-warn/10 text-warn' : dd <= 30 ? 'bg-tint text-primary-text' : 'bg-brow text-bmuted'
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className={`tnum shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-extrabold ${tone}`}>D-{dd}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-bink">{c.customer} · {c.product}</div>
                      <div className="text-[11.5px] text-bfaint">만기 {fmtDate(c.expiry)} — 재상담으로 락인하세요</div>
                    </div>
                  </div>
                )
              })}
              {expiring.length === 0 && <div className="py-4 text-center text-[12.5px] text-bfaint">90일 내 만기 고객이 없어요</div>}
            </div>
          </Card>
        </div>
      </div>

      {/* 사장님 케어 — 실적 하이라이트 + 격려 (OWNER_CARE: 전문가의 눈, 단짝의 입) */}
      <CareStrip leads={leads} />

      {/* 정착·성장 트로피 — 정착지원 정책과 연동된 파생 배지 (저장 없음, 실데이터 파생) */}
      <TrophyBoard tenant={tenant} db={db} leads={leads} />

      {/* 공지 스트립 */}
      {notice && (
        <button onClick={() => nav('/office/resources')} className="mt-4 flex w-full items-center gap-3 rounded-card border border-bline bg-white px-4 py-3.5 text-left transition-colors hover:border-primary">
          <span className="shrink-0 rounded-md bg-tint px-2 py-1 text-[11px] font-extrabold text-primary-text">공지</span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-bbody">{notice.title}</span>
          <span className="text-bfaint">→</span>
        </button>
      )}

      <LeadDrawer lead={live} onClose={() => setOpenLead(null)} by={tenant.id} />
    </div>
  )
}

// 사장님 케어 — 이번 주 실적을 단짝의 입으로 말한다 (강요·책임전가 금지 톤)
function CareStrip({ leads }) {
  const week = leads.filter((l) => l.status === '완료' && Date.now() - (l.completedAt ?? l.createdAt) < 7 * 86400000).length
  const handled = leads.filter((l) => !['접수', '상담대기'].includes(l.status)).length
  const CHEER = [
    '오래 가는 사장님이 이깁니다 — 물 한 잔 마시고 가볍게 어깨 스트레칭 어때요?',
    '전화 목소리는 컨디션에서 나와요. 점심 거르지 마세요!',
    '오늘의 한 건이 다음 달 단골이 됩니다. 서두르지 않아도 괜찮아요.',
    '잘 안 풀리는 날도 있죠. 내일의 리드는 내일 옵니다 — 오늘은 마무리 잘하세요.',
    '기록이 쌓이면 감이 됩니다. 상담 메모 한 줄이 내일의 무기예요.',
  ]
  const cheer = CHEER[new Date().getDay() % CHEER.length]
  const head = week > 0
    ? `이번 주 개통 ${week}건 — 수고하셨어요! 처리 누적 ${handled}건이 만든 결과예요.`
    : `이번 주는 아직 개통 전 — 처리 중 ${handled}건이 곧 결실이 됩니다.`
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-primary/20 bg-tint/30 px-4 py-3">
      <span className="text-[12.5px] font-extrabold text-primary-text">사장님 케어</span>
      <span className="min-w-0 flex-1 text-[12.5px] font-semibold text-bbody">{head} <span className="text-bmuted">{cheer}</span></span>
    </div>
  )
}

// 트로피 보드 — 달성 조건은 전부 스토어 실데이터에서 파생 (정착지원 정책 KPI와 동일 기준)
function TrophyBoard({ tenant, db, leads }) {
  const doneAll = leads.filter((l) => l.status === '완료')
  const doneMonth = doneAll.filter((l) => Date.now() - (l.completedAt ?? l.createdAt) < 30 * 86400000).length
  const outbound = (db.auditLog ?? []).filter((a) => a.action === '아웃바운드 발송' && (a.actor === tenant.id || a.actor === tenant.owner)).length
  const openedDays = Math.floor((Date.now() - tenant.openedAt) / 86400000)
  const TROPHIES = [
    { key: 'first', name: '첫 개통', desc: '첫 완료 처리 달성', ok: doneAll.length >= 1 },
    { key: 'settle5', name: '정착 수료', desc: '누적 개통 5건 — 정착 패키지 2차 지급 기준', ok: doneAll.length >= 5 },
    { key: 'pace10', name: '월 10건 페이스', desc: '최근 30일 완료 10건', ok: doneMonth >= 10 },
    { key: 'outreach', name: '아웃바운드 첫 발송', desc: '알림톡·재상담 제안 발송', ok: outbound >= 1 },
    { key: 'local90', name: '로컬 90일', desc: '개설 후 90일 운영 지속', ok: openedDays >= 90 },
    { key: 'master', name: '월 24건 마스터', desc: '하루 1건 페이스 도달', ok: doneMonth >= 24 },
  ]
  const got = TROPHIES.filter((t) => t.ok).length
  return (
    <Card track="b" className="mt-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15.5px] font-extrabold text-bink">정착·성장 트로피</h2>
        <span className="tnum text-[12px] font-bold text-bmuted">{got}/{TROPHIES.length} 달성 · 정착지원 프로그램 KPI 연동</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {TROPHIES.map((t) => (
          <div key={t.key} className={`rounded-field border p-3 text-center transition-colors ${t.ok ? 'border-primary/40 bg-tint/40' : 'border-bline opacity-60'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`mx-auto ${t.ok ? 'text-primary-text' : 'text-bfaint'}`}>
              <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4.5a0 0 0 0 0 0 0c0 2.8 1 4.2 2.9 4.6M17 5h2.5c0 2.8-1 4.2-2.9 4.6" /><path d="M12 13v3M8.5 20h7M10 20v-2.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20" />
            </svg>
            <div className={`mt-1.5 text-[12px] font-extrabold ${t.ok ? 'text-bink' : 'text-bmuted'}`}>{t.name}</div>
            <div className="mt-0.5 text-[10.5px] leading-[14px] text-bfaint">{t.desc}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function SettleAmount({ value }) {
  const n = useCountUp(value, 700)
  return <div className="tnum mt-2 text-[30px] font-extrabold tracking-[-0.5px] text-bink">{won(n)}</div>
}
