// ─── 대리점(지역) 콘솔 — 내 셀러·정산 명세 ────────────────────────────
// 3계층의 가운데-아래 층. 총판은 이 대리점까지만 실명을 보고, 대리점은 자기 셀러까지 본다.
// 열람 깊이는 org.bizIdentity 의 reveal 이 정하고 settle.maskTree 가 실제로 끊는다.
import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore, getSession, tenantSettlement } from '../../lib/store'
import { won, downloadCSV, monthKey, timeAgo } from '../../lib/engine'
import { bizIdentity, allAgencies, distributorOfAgency, sellersOf, sellerCode } from '../../lib/org'
import { settleView, treeRows, opexLabel } from '../../lib/settle'
import { unitName } from '../../lib/constants'
import { KpiCard, Card, Logo, Btn, useToast, EmptyState } from '../../components/ui'
import SettleDrill from '../../components/SettleDrill'

// 가드와 본문을 나눈다 — 훅을 조기 반환 뒤에 두면 세션이 늦게 붙는 렌더에서 훅 개수가 바뀐다
export default function AgencyDashboard() {
  const { db } = useStore()
  const nav = useNavigate()
  const session = getSession()
  const ok = !!session && session.role === 'agency'
  useEffect(() => { if (!ok) nav('/login?next=/agency', { replace: true }) }, [ok]) // eslint-disable-line
  if (!ok) return null
  const agency = allAgencies(db).find((a) => a.id === session.agencyId) ?? allAgencies(db)[0]
  if (!agency) return null
  return <AgencyConsole agency={agency} session={session} />
}

function AgencyConsole({ agency, session }) {
  const { db } = useStore()
  const toast = useToast()
  const viewer = bizIdentity(db, session)
  const dist = distributorOfAgency(db, agency)
  const sellers = sellersOf(db, agency.id)
  const period = monthKey()
  const view = useMemo(() => settleView(db, { viewer: { ...viewer, id: agency.id }, period, settleFn: tenantSettlement }), [db, viewer, agency.id, period])
  const label = opexLabel(db)

  // 내 지역 리드 — 소속 셀러에게 배정된 건
  const myLeads = db.leads.filter((l) => sellers.some((t) => t.id === l.tenantId))
  const openLeads = myLeads.filter((l) => !['완료', '취소'].includes(l.status))

  const exportCsv = () => {
    downloadCSV(`모두온_대리점정산_${agency.code}_${period}.csv`, [
      ['※ 실연동 전 검증용 파일입니다 — 실제 이체 아님', '', '', '', ''],
      ['구분', '코드', '계층', '완료건', '금액(원)'],
      ...treeRows(view.root, label),
    ])
    toast('대리점 정산 명세 CSV를 내려받았어요')
  }

  return (
    <div className="min-h-screen bg-bbg pb-16">
      <header className="border-b border-bline bg-white">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">대리점 콘솔</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="pii hidden text-[12.5px] text-bmuted sm:block">{agency.name} · {agency.owner}</span>
            <Link to="/login" className="rounded-field border border-bline px-3 py-1.5 text-[12px] font-semibold text-bmuted hover:text-bink">역할 전환</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-[21px] font-extrabold tracking-[-0.4px] text-bink">{agency.name}</h1>
            <p className="mt-1 text-[13px] text-bmuted">
              지역코드 <b className="tnum text-bink">{agency.code}</b> · 소속 권역 <b className="tnum text-bink">{dist?.code ?? '-'}</b> · {dist?.name ?? '-'} · 계약 {new Date(agency.openedAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <Btn variant="boutline" size="sm" onClick={exportCsv}>정산 명세 CSV</Btn>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="소속 셀러" value={sellers.length} suffix="명" caption={`활성 ${sellers.filter((t) => t.status === '활성').length}명`} />
          <KpiCard label={`${period} 셀러 합계`} value={view?.root.sub ?? 0} suffix="원" caption="하부 셀러 영업이익 합" />
          <KpiCard label={`${label} (건당 +@)`} value={view?.root.opex ?? 0} suffix="원" accent="text-ok" caption={`완료 ${view?.root.cases ?? 0}건 누적`} />
          <KpiCard label="내 정산 총액" value={view?.root.amount ?? 0} suffix="원" accent="text-primary-text" caption={`셀러 합계 + ${label}`} />
        </div>

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[3fr_2fr]">
          <SettleDrill view={view} title={`${period} 대리점 정산 명세`} caption="금액을 누르면 소속 셀러별 내역이 펼쳐집니다" />

          <Card track="b" className="overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="text-[15.5px] font-extrabold text-bink">소속 셀러</h2>
              <span className="tnum text-[12px] font-bold text-bfaint">진행 리드 {openLeads.length}건</span>
            </div>
            <div className="mt-3 border-t border-brow">
              {sellers.map((t) => (
                <div key={t.id} data-t="agency-seller" className="flex items-center gap-3 border-b border-brow px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="pii truncate text-[13px] font-bold text-bink">{t.name} <span className="font-semibold text-bfaint">· {t.owner}</span></div>
                    <div className="tnum text-[11.5px] text-bfaint">{sellerCode(db, t) ?? '식별번호 미발급'} · {t.sigungu}</div>
                  </div>
                  <span className="tnum shrink-0 text-[13px] font-extrabold text-primary-text">{won(Math.max(0, tenantSettlement(db, t.id, period).net))}</span>
                </div>
              ))}
              {sellers.length === 0 && <EmptyState text="아직 소속 셀러가 없어요" sub="본사 어드민 > 조직 관리에서 셀러를 배정할 수 있습니다" />}
            </div>
          </Card>
        </div>

        <Card track="b" className="mt-4 overflow-hidden">
          <h2 className="px-5 pt-5 text-[15.5px] font-extrabold text-bink">최근 지역 리드</h2>
          <div className="mt-3 border-t border-brow">
            {myLeads.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-center gap-3 border-b border-brow px-5 py-2.5">
                <span className="pii w-20 shrink-0 truncate text-[12.5px] font-bold text-bink">{l.name}</span>
                <span className="flex-1 truncate text-[12px] text-bmuted">{l.sigungu} · {db.tenants.find((t) => t.id === l.tenantId)?.name ?? '미배정'}</span>
                <span className="shrink-0 text-[11.5px] font-bold text-bbody">{l.status}</span>
                <span className="w-14 shrink-0 text-right text-[11px] text-bfaint">{timeAgo(l.createdAt)}</span>
              </div>
            ))}
            {myLeads.length === 0 && <EmptyState text="지역에 유입된 리드가 없어요" />}
          </div>
        </Card>
      </main>
    </div>
  )
}
