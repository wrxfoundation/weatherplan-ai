// ─── S-22 분양(테넌트) 관리 — 승인 대기 큐 상단 고정 + 필터 테이블 ──
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { unitName, unitBySigungu } from '../../lib/constants'
import { fmtDate, timeAgo, won } from '../../lib/engine'
import { Card, Btn, Modal, useToast, EmptyState } from '../../components/ui'

export default function AdminTenants() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [rejectTarget, setRejectTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [filter, setFilter] = useState('전체')

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
          {pending.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-field border border-bline p-3.5">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-bold text-bink">
                  {a.wantName} <span className="font-medium text-bfaint">moduon.com/m/{a.wantSlug}</span>
                </div>
                <div className="mt-0.5 text-[12px] text-bmuted">
                  {a.name} · {a.type} · {a.sigungu} → <strong className="font-bold text-primary-text">{unitName(unitBySigungu(a.sigungu))}</strong> · 신청 {timeAgo(a.appliedAt)}
                </div>
                {a.memo && <div className="mt-0.5 text-[11.5px] text-bfaint">💬 {a.memo}</div>}
              </div>
              <div className="flex gap-2">
                <Btn size="xs" onClick={() => approve(a)}>승인</Btn>
                <Btn size="xs" variant="danger" onClick={() => setRejectTarget(a)}>반려</Btn>
              </div>
            </div>
          ))}
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
          <div key={t.id} className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-brow px-4 py-3.5 lg:grid-cols-[1.2fr_1fr_0.8fr_0.9fr_0.8fr_0.7fr_auto] lg:px-5">
            <div>
              <Link to={`/m/${t.slug}`} className="text-[13.5px] font-bold text-bink hover:text-primary-text">{t.name}</Link>
              <div className="text-[11.5px] text-bfaint">/m/{t.slug}</div>
            </div>
            <div className="hidden text-[12.5px] text-bbody lg:block">{t.owner}<div className="tnum text-[11px] text-bfaint">{t.phone}</div></div>
            <span className="hidden text-[12.5px] text-bbody lg:block">{unitName(t.unit)}</span>
            <span className="tnum hidden text-[12.5px] font-bold text-bink lg:block">{won(t.monthlySales)}</span>
            <span className="hidden text-[12px] text-bmuted lg:block">{fmtDate(t.openedAt)}</span>
            <span className={`hidden w-fit rounded-full px-2.5 py-1 text-[11.5px] font-bold lg:block ${t.status === '활성' ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`}>{t.status}</span>
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => { dispatch({ type: 'TENANT_STATUS', id: t.id, status: t.status === '활성' ? '정지' : '활성' }); toast(t.status === '활성' ? '몰을 정지했어요' : '몰을 재개했어요') }}
                className={`h-8 rounded-full px-3 text-[11.5px] font-bold ${t.status === '활성' ? 'bg-danger/10 text-danger hover:bg-danger hover:text-white' : 'bg-ok/10 text-ok hover:bg-ok hover:text-white'}`}
              >
                {t.status === '활성' ? '정지' : '재개'}
              </button>
            </div>
          </div>
        ))}
        {tenants.length === 0 && <EmptyState icon="🏪" text="조건에 맞는 몰이 없어요" />}
      </Card>

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
