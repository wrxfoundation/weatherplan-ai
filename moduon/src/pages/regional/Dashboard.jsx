// ─── 총판(관리단) 콘솔 — 내 권역 셀러·리드·배분 수익 관제 ─────────────
// 3계층(본사→총판→셀러)의 가운데 층. 배분 수익은 본사 수수료에서 지급되므로
// 셀러 순지급액은 불변 — 총판은 권역 실적과 모집 신호를 보고 움직인다.
import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore, getSession, tenantSettlement, distributorSettlement } from '../../lib/store'
import { won, num, maskName, timeAgo } from '../../lib/engine'
import { UNITS, unitBySigungu, catBySlug } from '../../lib/constants'
import { KpiCard, Card, Logo, StatusChip, LiveDot } from '../../components/ui'
import { AiInsight } from '../../components/AiPanel'
import { distributorBrief } from '../../lib/ai'

export default function RegionalDashboard() {
  const { db } = useStore()
  const nav = useNavigate()
  const session = getSession()

  useEffect(() => {
    if (!session || session.role !== 'regional') nav('/login?next=/regional', { replace: true })
  }, []) // eslint-disable-line
  if (!session || session.role !== 'regional') return null

  const dist = (db.distributors ?? []).find((d) => d.id === session.distributorId) ?? (db.distributors ?? [])[0]
  if (!dist) return null
  const unit = UNITS.find((u) => u.code === dist.unit)
  const settle = distributorSettlement(db).find((d) => d.id === dist.id)

  // 권역 데이터 집계 — 리드는 고객 주소지(unitBySigungu) 기준 귀속 (오픈맵과 동일 규칙)
  const sellers = db.tenants.filter((t) => t.unit === dist.unit)
  const regionLeads = useMemo(
    () => db.leads.filter((l) => (unitBySigungu(l.sigungu) ?? db.tenants.find((x) => x.id === l.tenantId)?.unit) === dist.unit),
    [db, dist.unit],
  )
  const unassigned = regionLeads.filter((l) => !l.tenantId && !['완료', '취소'].includes(l.status))
  const topCat = useMemo(() => {
    const m = {}
    regionLeads.forEach((l) => { m[l.cat] = (m[l.cat] ?? 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => ({ name: catBySlug(c)?.name ?? c, n }))
  }, [regionLeads])

  return (
    <div className="min-h-screen bg-bbg pb-16">
      {/* 슬림 톱바 */}
      <header className="border-b border-bline bg-white">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="rounded-full bg-bindigo px-2 py-0.5 text-[10px] font-bold text-white">총판 관제</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="pii hidden text-[12.5px] text-bmuted sm:block">{dist.name} · {dist.owner}</span>
            <Link to="/login" className="rounded-field border border-bline px-3 py-1.5 text-[12px] font-semibold text-bmuted hover:text-bink">역할 전환</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-[21px] font-extrabold tracking-[-0.4px] text-bink">{unit?.name} 권역 관제</h1>
            <p className="mt-1 text-[13px] text-bmuted">{unit?.cover} · 사업권 계약 {new Date(dist.openedAt).toLocaleDateString('ko-KR')} {dist.note ? `· ${dist.note}` : ''}</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-ok"><LiveDot /> 실시간 집계</span>
        </div>

        {/* KPI 4 */}
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="권역 셀러" value={sellers.length} suffix="곳" caption={`활성 ${settle?.sellerCount ?? 0}곳`} />
          <KpiCard label="이번 달 권역 매출" value={settle?.gross ?? 0} suffix="원" caption="활성 셀러 매출 합산" />
          <KpiCard label={`내 배분 수익 (${((dist.sharePct ?? 0) * 100).toFixed(0)}%)`} value={settle?.share ?? 0} suffix="원" accent="text-primary-text" caption="본사 수수료에서 지급 — 셀러 순지급 불변" />
          <KpiCard label="권역 유입 리드" value={regionLeads.length} suffix="건" accent={unassigned.length ? 'text-warn' : undefined} caption={unassigned.length ? `⚠ 미배정 ${unassigned.length}건 — 분양 필요` : '전량 배정 중'} />
        </div>

        {/* 총판 AI 브리핑 (기획서 TABLE 2 "총판 지역수요 예측" — 운영중) */}
        <div className="mt-4">
          <AiInsight
            title="권역 AI 브리핑"
            desc="내 권역의 매출·수요·미배정 신호를 읽고 오늘의 총판 액션을 제안합니다."
            cta="권역 브리핑 생성"
            build={() => distributorBrief({
              unitName: unit?.name ?? dist.unit, cover: unit?.cover ?? '', sharePct: dist.sharePct ?? 0,
              sellers: sellers.length, active: settle?.sellerCount ?? 0,
              gross: settle?.gross ?? 0, share: settle?.share ?? 0,
              leads: regionLeads.length, unassigned: unassigned.length, topCat,
            })}
          />
        </div>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[7fr_5fr]">
          {/* 셀러 목록 */}
          <Card track="b" className="overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4">
              <h2 className="text-[15.5px] font-extrabold text-bink">내 권역 셀러</h2>
              <span className="text-[11.5px] text-bfaint">모집·심사는 본사 승인 경유</span>
            </div>
            <div className="mt-3 border-t border-brow">
              {sellers.map((t) => {
                const s = tenantSettlement(db, t.id)
                return (
                  <div key={t.id} className="grid grid-cols-[1.4fr_auto] items-center gap-2 border-b border-brow px-5 py-3 sm:grid-cols-[1.4fr_0.9fr_1fr_0.8fr]">
                    <div>
                      <div className="text-[13.5px] font-bold text-bink">{t.name}</div>
                      <div className="pii text-[11.5px] text-bfaint">{t.owner} · /m/{t.slug}</div>
                    </div>
                    <span className={`justify-self-end rounded-full px-2 py-0.5 text-[11px] font-bold sm:justify-self-start ${t.status === '활성' ? 'bg-ok/10 text-ok' : 'bg-warn/10 text-warn'}`}>{t.status}</span>
                    <span className="tnum hidden text-[12.5px] font-bold text-bbody sm:block">{won(s.gross)}</span>
                    <span className="tnum hidden text-[12px] text-bfaint sm:block">리드 {num(t.leadCount ?? 0)}건</span>
                  </div>
                )
              })}
              {sellers.length === 0 && <div className="py-10 text-center text-[13px] text-bfaint">아직 권역 셀러가 없어요 — 분양 영업부터 시작하세요</div>}
            </div>
            <p className="px-5 py-3 text-[11px] text-bfaint">배분 산식: 권역 활성 셀러 매출 합계 × {((dist.sharePct ?? 0) * 100).toFixed(0)}% — 본사 운영 수수료 수입에서 지급됩니다.</p>
          </Card>

          {/* 권역 리드 스트림 (읽기 전용 — 처리 권한은 배정 셀러/본사) */}
          <Card track="b" className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15.5px] font-extrabold text-bink">권역 리드 스트림</h2>
              <span className="text-[11.5px] text-bfaint">읽기 전용 · 처리 권한은 셀러</span>
            </div>
            <div className="mt-3 flex flex-col">
              {regionLeads.slice(0, 8).map((l) => (
                <div key={l.id} className="flex items-center gap-2.5 border-b border-brow py-2.5 last:border-0">
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-bbody">
                    {maskName(l.name)} · {catBySlug(l.cat)?.name ?? l.cat}
                    {!l.tenantId && !['완료', '취소'].includes(l.status) && <em className="ml-1.5 not-italic rounded bg-warn/10 px-1 py-0.5 text-[10px] font-bold text-warn">미배정</em>}
                  </span>
                  <span className="text-[11px] text-bfaint">{timeAgo(l.createdAt)}</span>
                  <StatusChip status={l.status} />
                </div>
              ))}
              {regionLeads.length === 0 && <div className="py-8 text-center text-[12.5px] text-bfaint">아직 권역 유입 리드가 없어요</div>}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
