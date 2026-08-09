// ─── 리드 행 + 상세 드로어 (마이오피스·어드민 관제 공용) ─────────
import { useState } from 'react'
import { useStore } from '../lib/store'
import { maskName, maskPhone, timeAgo, minutesAgo, fmtDateTime, won } from '../lib/engine'
import { catBySlug, LEAD_STATUS, STATUS_COLOR, unitName, unitBySigungu } from '../lib/constants'
import { StatusChip, Drawer, Btn, useToast, Modal } from './ui'

export function LeadRow({ lead, onOpen, showTenant, tenants }) {
  const overdue = lead.status === '접수' && minutesAgo(lead.createdAt) >= 10
  const cat = catBySlug(lead.cat)
  const tenant = showTenant ? tenants?.find((t) => t.id === lead.tenantId) : null
  return (
    <button
      onClick={onOpen}
      className={`grid w-full items-center gap-2 border-b border-brow px-3 py-3 text-left transition-colors hover:bg-brow/60 ${!lead.read ? 'bg-primary/5' : ''} grid-cols-[1fr_auto] sm:grid-cols-[110px_92px_1fr_80px_88px_auto] sm:px-4`}
    >
      <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-bink">
        {!lead.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
        {maskName(lead.name)}
        <span className="text-[11px] font-medium text-bfaint sm:hidden">· {cat?.name}</span>
      </span>
      <span className="hidden sm:block">
        <span className="rounded-md bg-brow px-2 py-1 text-[11.5px] font-semibold text-bbody">{cat?.name}</span>
      </span>
      <span className="hidden truncate text-[12.5px] text-bmuted sm:block">
        {lead.sigungu}{showTenant && <em className="not-italic text-bfaint"> · {tenant ? tenant.name : `미배정(${unitName(unitBySigungu(lead.sigungu))})`}</em>}
      </span>
      <span className={`hidden text-[12px] sm:block ${overdue ? 'font-bold text-warn' : 'text-bfaint'}`}>{timeAgo(lead.createdAt)}</span>
      <span className="justify-self-end sm:justify-self-start"><StatusChip status={lead.status} /></span>
      <span className="col-span-2 flex items-center gap-1.5 sm:col-span-1">
        <span className={`text-[11px] sm:hidden ${overdue ? 'font-bold text-warn' : 'text-bfaint'}`}>{timeAgo(lead.createdAt)} · {lead.sigungu}</span>
        <a
          href={`tel:${lead.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="ml-auto flex h-[30px] w-[30px] items-center justify-center rounded-full bg-tint text-[13px] text-primary-text hover:bg-primary hover:text-white"
          title="전화 걸기"
        >📞</a>
        <AlimBtn lead={lead} />
      </span>
    </button>
  )
}

function AlimBtn({ lead }) {
  const toast = useToast()
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toast(`${maskName(lead.name)} 고객에게 알림톡을 보냈어요`) }}
      className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-ok/10 text-[13px] text-ok hover:bg-ok hover:text-white"
      title="알림톡 보내기"
    >💬</button>
  )
}

// 상태 전환 가능 규칙(단순 전진 + 취소)
const NEXT = {
  접수: ['상담대기', '취소'],
  상담대기: ['상담완료', '취소'],
  상담완료: ['개통대기', '취소'],
  개통대기: ['완료', '취소'],
  완료: [],
  취소: [],
}

export function LeadDrawer({ lead, onClose, by = 'partner', tenants, allowReassign }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const [memo, setMemo] = useState(lead?.memo ?? '')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')

  if (!lead) return <Drawer open={false} onClose={onClose} title="" />
  const cat = catBySlug(lead.cat)

  const move = (to) => {
    if (to === '취소') { setCancelOpen(true); return }
    dispatch({ type: 'LEAD_STATUS', payload: { id: lead.id, to, by } })
    toast(`상태를 "${to}"로 변경했어요`)
  }
  const confirmCancel = () => {
    if (!reason.trim()) return
    dispatch({ type: 'LEAD_STATUS', payload: { id: lead.id, to: '취소', by, note: reason.trim() } })
    setCancelOpen(false)
    toast('취소 처리했어요')
  }

  return (
    <Drawer open={!!lead} onClose={onClose} title={`리드 상세 · ${lead.id}`}>
      {/* 고객 정보 */}
      <div className="rounded-card border border-bline p-4">
        <div className="flex items-center justify-between">
          <div className="text-[17px] font-extrabold text-bink">{maskName(lead.name)} 고객</div>
          <StatusChip status={lead.status} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-y-2 text-[13px]">
          <span className="text-bfaint">연락처</span><span className="tnum font-semibold text-bink">{maskPhone(lead.phone)}</span>
          <span className="text-bfaint">지역</span><span className="font-semibold text-bink">{lead.sigungu}</span>
          <span className="text-bfaint">관심 서비스</span><span className="font-semibold text-primary-text">{cat?.name}</span>
          <span className="text-bfaint">희망 시간</span><span className="font-semibold text-bink">{lead.wish}</span>
          <span className="text-bfaint">유입 경로</span><span className="font-semibold text-bink">{lead.source === 'main' ? '모두온 본진' : `파트너몰(${lead.source})`}</span>
        </div>
        {lead.quote && (
          <div className="mt-3 rounded-field bg-tint/60 px-3 py-2.5 text-[12.5px]">
            <strong className="font-bold text-primary-text">계산기 견적</strong>{' '}
            <span className="tnum text-bbody">{lead.quote.label ?? `${lead.quote.carrier} ${lead.quote.speed} + ${lead.quote.bundle} · 월 ${won(lead.quote.total)} · 사은품 ${won(lead.quote.gift)}`}</span>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <a href={`tel:${lead.phone}`} className="flex h-10 flex-1 items-center justify-center rounded-field bg-primary text-[13.5px] font-bold text-white hover:bg-primary-hover">📞 전화 걸기</a>
          <button onClick={() => toast('알림톡을 보냈어요')} className="flex h-10 flex-1 items-center justify-center rounded-field bg-ok/10 text-[13.5px] font-bold text-ok hover:bg-ok hover:text-white">💬 알림톡</button>
        </div>
      </div>

      {/* 상태 변경 */}
      {NEXT[lead.status].length > 0 && (
        <div className="mt-4">
          <div className="text-[12.5px] font-bold text-bmuted">상태 변경</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {NEXT[lead.status].map((to) => (
              <button
                key={to}
                onClick={() => move(to)}
                className="h-9 rounded-full px-4 text-[13px] font-bold transition-colors"
                style={{ color: STATUS_COLOR[to], backgroundColor: STATUS_COLOR[to] + '1A' }}
              >
                {to === '취소' ? '취소 처리' : `→ ${to}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 재배정(어드민 전용) */}
      {allowReassign && tenants && (
        <div className="mt-4">
          <div className="text-[12.5px] font-bold text-bmuted">파트너 재배정</div>
          <select
            className="mt-2 h-10 w-full rounded-field border border-bline bg-white px-3 text-[13.5px] text-bink"
            value={lead.tenantId ?? ''}
            onChange={(e) => { dispatch({ type: 'LEAD_REASSIGN', payload: { id: lead.id, tenantId: e.target.value || null, by: '본사 관리자' } }); toast('재배정했어요') }}
          >
            <option value="">본사 직접 처리</option>
            {tenants.filter((t) => t.status === '활성').map((t) => (
              <option key={t.id} value={t.id}>{t.name} · {unitName(t.unit)}</option>
            ))}
          </select>
        </div>
      )}

      {/* 메모 */}
      <div className="mt-4">
        <div className="text-[12.5px] font-bold text-bmuted">상담 메모</div>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          onBlur={() => dispatch({ type: 'LEAD_MEMO', id: lead.id, memo })}
          placeholder="상담 내용, 고객 요청사항을 남겨두세요"
          className="mt-2 min-h-[76px] w-full rounded-field border border-bline bg-white p-3 text-[13.5px] text-bink placeholder:text-bfaint focus:border-primary"
        />
      </div>

      {/* 상태 이력 (전수 기록 — L-04 AC) */}
      <div className="mt-4">
        <div className="text-[12.5px] font-bold text-bmuted">상태 이력</div>
        <div className="mt-2 flex flex-col gap-0">
          {[...lead.history].reverse().map((h, i) => (
            <div key={i} className="relative flex gap-3 pb-4 pl-1">
              {i < lead.history.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-bline" />}
              <span className="relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-white" style={{ backgroundColor: STATUS_COLOR[h.to] ?? '#8C93A5' }} />
              <div>
                <div className="text-[13px] font-bold text-bink">{h.to} <span className="ml-1 font-medium text-bfaint">{fmtDateTime(h.at)}</span></div>
                {h.note && <div className="text-[12px] text-bmuted">{h.note}</div>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-bfaint">개인정보 열람·처리 내역은 감사 로그에 기록됩니다.</p>
      </div>

      {/* 취소 사유 모달 (필수 — L-04) */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="취소 사유 입력 (필수)">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예) 타사 약정 잔여, 연락 두절, 조건 불만족…"
          className="min-h-[90px] w-full rounded-field border border-bline p-3 text-[14px] focus:border-primary"
        />
        <div className="mt-4 flex gap-2">
          <Btn variant="boutline" size="sm" className="flex-1" onClick={() => setCancelOpen(false)}>돌아가기</Btn>
          <Btn variant="danger" size="sm" className="flex-1" disabled={!reason.trim()} onClick={confirmCancel}>취소 확정</Btn>
        </div>
      </Modal>
    </Drawer>
  )
}
