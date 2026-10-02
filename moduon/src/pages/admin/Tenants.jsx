// ─── S-22 분양(테넌트) 관리 — 승인 대기 큐 상단 고정 + 필터 테이블 + 상세 드로어 ──
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, tenantSettlement, tenantLeads } from '../../lib/store'
import { unitName, unitBySigungu, catBySlug } from '../../lib/constants'
import { fmtDate, timeAgo, won, maskName } from '../../lib/engine'
import { Card, Btn, Modal, Drawer, useToast, EmptyState } from '../../components/ui'
import { IcChat, IcStore } from '../../components/icons'

export default function AdminTenants() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [filter, setFilter] = useState('전체')
  const [detailId, setDetailId] = useState(null)
  // 드로어 안 상태 전환이 즉시 반영되도록 항상 스토어에서 파생
  const detail = db.tenants.find((t) => t.id === detailId) ?? null

  const pending = db.applications.filter((a) => a.status === '대기')
  const tenants = db.tenants.filter((t) => filter === '전체' || t.status === filter)

  const approve = (a) => { dispatch({ type: 'APPROVE_APPLICATION', id: a.id }); toast(`${a.wantName} 승인 완료 — moduon.com/m/${a.wantSlug} 활성화`) }
  const reject = () => {
    if (!reason.trim()) return
    dispatch({ type: 'REJECT_APPLICATION', id: rejectTarget.id, reason: reason.trim() })
    setRejectTarget(null); setReason('')
    toast('반려 처리했어요')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[20px] font-extrabold text-bink">분양 관리</h1>
      <p className="mt-0.5 text-[12.5px] text-bmuted">신청 승인/반려 · 몰 상태 · 권역 매핑 — 대리점 가입비 {won(db.policies.joinFee)} / 월 {won(db.policies.monthlyFee)} (정책 v{db.policies.version})</p>

      {/* 승인 대기 큐 (상단 고정) */}
      <Card track="b" className="mt-4 border-l-4 border-l-warn p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-[15.5px] font-extrabold text-bink">승인 대기 큐</h2>
          <span className="tnum rounded-full bg-warn/10 px-2.5 py-0.5 text-[11.5px] font-bold text-warn">{pending.length}건</span>
        </div>
        <div className="mt-3 flex flex-col gap-2.5">
          {pending.map((a) => {
            // 승인 판단 근거 — 신청 권역의 공급(활성 몰·총판)과 수요(미배정 리드)를 함께 보여준다
            const unit = unitBySigungu(a.sigungu)
            const activeInUnit = db.tenants.filter((t) => t.unit === unit && t.status === '활성').length
            const dist = (db.distributors ?? []).find((d) => d.unit === unit)
            const unassigned = db.leads.filter((l) => !l.tenantId && !['완료', '취소'].includes(l.status) && unitBySigungu(l.sigungu) === unit).length
            return (
            <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-field border border-bline p-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-bink">
                  {a.wantName} <span className="font-medium text-bfaint">moduon.com/m/{a.wantSlug}</span>
                </div>
                <div className="mt-0.5 text-[12px] text-bmuted">
                  {a.name} · {a.type} · {a.sigungu} → <strong className="font-bold text-primary-text">{unitName(unitBySigungu(a.sigungu))}</strong> · 신청 {timeAgo(a.appliedAt)}
                </div>
                {a.memo && <div className="mt-0.5 text-[11.5px] text-bfaint"><IcChat size={12} className="inline -mt-0.5 mr-1" />{a.memo}</div>}
                <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10.5px] font-bold">
                  <span className={`rounded-full px-2 py-0.5 ${activeInUnit === 0 ? 'bg-ok/10 text-ok' : 'bg-brow text-bmuted'}`}>권역 활성 몰 {activeInUnit}개{activeInUnit === 0 ? ' — 공백 권역' : ''}</span>
                  <span className={`rounded-full px-2 py-0.5 ${dist ? 'bg-tint text-primary-text' : 'bg-warn/10 text-warn'}`}>총판 {dist ? dist.owner : '공석'}</span>
                  {unassigned > 0 && <span className="rounded-full bg-warn/10 px-2 py-0.5 text-warn">미배정 리드 {unassigned}건 — 수요 신호</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Btn size="xs" onClick={() => approve(a)}>승인</Btn>
                <Btn size="xs" variant="danger" onClick={() => setRejectTarget(a)}>반려</Btn>
              </div>
            </div>
          )})}
          {pending.length === 0 && <div className="py-3 text-center text-[12.5px] text-bfaint">대기 중인 신청이 없어요 — 새 신청은 /partner/apply 에서 들어옵니다</div>}
        </div>
      </Card>

      {/* 테넌트 테이블 */}
      <Card track="b" className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-[15.5px] font-extrabold text-bink">분양몰 목록 <span className="tnum text-bfaint">{tenants.length}</span></h2>
          <div className="flex gap-1.5">
            {['전체', '활성', '정지'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`h-8 rounded-full px-3 text-[12px] font-bold ${filter === f ? 'bg-bink text-white' : 'bg-brow text-bbody'}`}>{f}</button>
            ))}
          </div>
        </div>
        <div className="mt-3 hidden grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.8fr_0.7fr_auto] gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted lg:grid">
          <span>몰명 / slug</span><span>대표 · 연락처</span><span>권역</span><span>월 매출</span><span>개설일</span><span>상태</span><span>액션</span>
        </div>
        {tenants.map((t) => (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            onClick={() => setDetailId(t.id)}
            onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === 'Enter' || e.key === ' ') { if (e.key === ' ') e.preventDefault(); setDetailId(t.id) } }}
            className="grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-2 border-b border-brow px-4 py-3.5 text-left outline-none transition-colors hover:bg-brow/60 focus-visible:ring-2 ring-primary/40 lg:grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.8fr_0.7fr_auto] lg:px-5"
          >
            <div>
              <span className="text-[13.5px] font-bold text-bink">{t.name}</span>
              <div className="text-[11.5px] text-bfaint">/m/{t.slug}</div>
            </div>
            <div className="pii hidden text-[12.5px] text-bbody lg:block">{t.owner}<div className="tnum text-[11px] text-bfaint">{t.phone}</div></div>
            <span className="hidden text-[12.5px] text-bbody lg:block">{unitName(t.unit)}</span>
            <span className="tnum hidden text-[12.5px] font-bold text-bink lg:block">{won(t.monthlySales)}</span>
            <span className="hidden text-[12px] text-bmuted lg:block">{fmtDate(t.openedAt)}</span>
            <span className={`hidden w-fit rounded-full px-2.5 py-1 text-[11.5px] font-bold lg:block ${t.status === '활성' ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`}>{t.status}</span>
            <div className="flex justify-end gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); dispatch({ type: 'TENANT_STATUS', id: t.id, status: t.status === '활성' ? '정지' : '활성' }); toast(t.status === '활성' ? '몰을 정지했어요' : '몰을 재개했어요') }}
                className={`h-8 rounded-full px-3 text-[11.5px] font-bold ${t.status === '활성' ? 'bg-danger/10 text-danger hover:bg-danger hover:text-white' : 'bg-ok/10 text-ok hover:bg-ok hover:text-white'}`}
              >
                {t.status === '활성' ? '정지' : '재개'}
              </button>
            </div>
          </div>
        ))}
        {tenants.length === 0 && <EmptyState icon={<IcStore size={30} className="text-bfaint" />} text="조건에 맞는 몰이 없어요" />}
      </Card>

      {/* 테넌트 상세 드로어 — 정산·리드·브랜딩을 한 화면에서 관제 */}
      <Drawer open={!!detail} onClose={() => setDetailId(null)} title={detail ? `${detail.name} 상세` : ''}>
        {detail && <TenantDetail t={detail} db={db} dispatch={dispatch} toast={toast} onClose={() => setDetailId(null)} />}
      </Drawer>

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title={`반려 사유 — ${rejectTarget?.wantName}`}>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예) 동일 권역 포화, 서류 미비…" className="min-h-[90px] w-full rounded-field border border-bline p-3 text-[14px] focus:border-primary" />
        <div className="mt-4 flex gap-2">
          <Btn variant="boutline" size="sm" className="flex-1" onClick={() => setRejectTarget(null)}>돌아가기</Btn>
          <Btn variant="danger" size="sm" className="flex-1" disabled={!reason.trim()} onClick={reject}>반려 확정</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── 테넌트 상세 — 이번 달 정산·리드 퍼널·브랜딩·상태 관리 ─────────
function TenantDetail({ t, db, dispatch, toast, onClose }) {
  const st = tenantSettlement(db, t.id)
  const leads = tenantLeads(db, t.id)
  const openLeads = leads.filter((l) => !['완료', '취소'].includes(l.status)).length
  const doneAll = leads.filter((l) => l.status === '완료').length
  const conv = leads.length ? Math.round((doneAll / leads.length) * 100) : 0
  const recent = [...leads].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
  const STATUS_TONE = { 접수: 'bg-tint text-primary-text', 상담대기: 'bg-warn/10 text-warn', 상담중: 'bg-warn/10 text-warn', 상담완료: 'bg-tint text-primary-text', 개통대기: 'bg-warn/10 text-warn', 완료: 'bg-ok/10 text-ok', 취소: 'bg-danger/10 text-danger' }

  return (
    <div className="flex flex-col gap-5">
      {/* 기본 정보 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${t.status === '활성' ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`}>{t.status}</span>
            <span className="text-[12.5px] font-semibold text-bmuted">{unitName(t.unit)} · {t.sigungu}</span>
          </div>
          <div className="pii mt-1.5 text-[13px] text-bbody">{t.owner} 사장님 · <span className="tnum">{t.phone}</span></div>
          <div className="text-[12px] text-bfaint">개설 {fmtDate(t.openedAt)} · moduon.com/m/{t.slug}</div>
        </div>
        <Link to={`/m/${t.slug}`} onClick={onClose} className="shrink-0 rounded-full border border-bline px-3 py-1.5 text-[12px] font-bold text-bbody hover:border-primary hover:text-primary-text">
          몰 열기 →
        </Link>
      </div>

      {t.greeting && <p className="rounded-field bg-brow px-3.5 py-2.5 text-[12.5px] leading-5 text-bbody">"{t.greeting}"</p>}

      {/* 취급 카테고리 */}
      <div className="flex flex-wrap gap-1.5">
        {(t.cats ?? []).map((slug) => (
          <span key={slug} className="rounded-full bg-tint px-2.5 py-1 text-[11.5px] font-bold text-primary-text">{catBySlug(slug)?.name ?? slug}</span>
        ))}
      </div>

      {/* 이번 달 정산 — tenantSettlement 단일 소스 */}
      <section>
        <h4 className="text-[13px] font-extrabold text-bink">이번 달 정산</h4>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-field bg-brow p-3"><div className="text-[11px] text-bmuted">몰 매출(계약 합산)</div><div className="tnum mt-0.5 text-[15px] font-extrabold text-bink">{won(st.gross)}</div></div>
          <div className="rounded-field bg-brow p-3"><div className="text-[11px] text-bmuted">순지급 예정</div><div className="tnum mt-0.5 text-[15px] font-extrabold text-primary-text">{won(st.net)}</div></div>
        </div>
        <div className="tnum mt-2 flex flex-col gap-1 rounded-field border border-bline p-3 text-[12px] text-bbody">
          <div className="flex justify-between"><span className="text-bmuted">운영 수수료 + 건별 수수료</span><span className="font-bold text-danger">−{won(st.fee)}</span></div>
          <div className="flex justify-between"><span className="text-bmuted">월 이용료</span><span className="font-bold text-danger">−{won(st.monthlyFee)}</span></div>
          <div className="flex justify-between border-t border-dashed border-bline pt-1"><span className="text-bmuted">완료 {st.doneCount}건 · 대기 {st.pendingCount}건</span><span className="font-bold text-warn">예정 수수료 {won(st.expected)}</span></div>
        </div>
      </section>

      {/* 리드 퍼널 */}
      <section>
        <h4 className="text-[13px] font-extrabold text-bink">리드 현황</h4>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-field bg-brow p-3 text-center"><div className="tnum text-[16px] font-extrabold text-bink">{leads.length}</div><div className="text-[11px] text-bmuted">누적 유입</div></div>
          <div className="rounded-field bg-brow p-3 text-center"><div className="tnum text-[16px] font-extrabold text-warn">{openLeads}</div><div className="text-[11px] text-bmuted">처리 중</div></div>
          <div className="rounded-field bg-brow p-3 text-center"><div className="tnum text-[16px] font-extrabold text-ok">{conv}%</div><div className="text-[11px] text-bmuted">완료 전환율</div></div>
        </div>
        <div className="mt-2 overflow-hidden rounded-field border border-bline">
          {recent.map((l) => (
            <div key={l.id} className="flex items-center justify-between gap-2 border-b border-bline px-3 py-2.5 text-[12.5px] last:border-0">
              <span className="pii font-bold text-bink">{maskName(l.name)}</span>
              <span className="min-w-0 flex-1 truncate text-bmuted">{catBySlug(l.cat)?.name ?? l.cat} · {timeAgo(l.createdAt)}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${STATUS_TONE[l.status] ?? 'bg-brow text-bmuted'}`}>{l.status}</span>
            </div>
          ))}
          {recent.length === 0 && <div className="px-3 py-4 text-center text-[12px] text-bfaint">아직 유입된 리드가 없어요</div>}
        </div>
      </section>

      {/* 액션 */}
      <div className="flex gap-2">
        <Btn
          variant={t.status === '활성' ? 'danger' : 'primary'}
          size="sm"
          className="flex-1"
          onClick={() => { dispatch({ type: 'TENANT_STATUS', id: t.id, status: t.status === '활성' ? '정지' : '활성' }); toast(t.status === '활성' ? '몰을 정지했어요 — 감사 로그에 기록됩니다' : '몰을 재개했어요') }}
        >
          {t.status === '활성' ? '몰 정지' : '몰 재개'}
        </Btn>
        <Link to="/admin/leads" onClick={onClose} className="flex h-10 flex-1 items-center justify-center rounded-field border border-bline text-[13px] font-bold text-bbody hover:border-primary hover:text-primary-text">
          리드 콘솔에서 보기
        </Link>
      </div>
      <p className="text-[11px] leading-4 text-bfaint">정지 시 파트너몰 접속·리드 배정이 즉시 중단됩니다. 상태 변경은 권한·감사 로그에 남아요.</p>
    </div>
  )
}
