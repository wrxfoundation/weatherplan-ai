// ─── 리드 행 + 상세 드로어 (마이오피스·어드민 관제 공용) ─────────
import { useEffect, useState } from 'react'
import { useStore } from '../lib/store'
import { maskName, maskPhone, timeAgo, minutesAgo, fmtDateTime, won } from '../lib/engine'
import { catBySlug, LEAD_STATUS, LEAD_TRANSITIONS, STATUS_COLOR, unitName, unitBySigungu } from '../lib/constants'
import { StatusChip, Drawer, Btn, useToast, Modal } from './ui'
import { callClaude } from '../lib/ai'
import { AiSpark } from './AiPanel'

export function LeadRow({ lead, onOpen, showTenant, tenants }) {
  const overdue = lead.status === '접수' && minutesAgo(lead.createdAt) >= 10
  const cat = catBySlug(lead.cat)
  const tenant = showTenant ? tenants?.find((t) => t.id === lead.tenantId) : null
  return (
    // 행 안에 tel 링크·알림톡 버튼이 있어 button 중첩 금지 — div[role=button]으로 키보드 동작 유지
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (e.key === ' ') e.preventDefault(); onOpen() } }}
      className={`grid w-full cursor-pointer items-center gap-2 border-b border-brow px-3 py-3 text-left outline-none transition-colors hover:bg-brow/60 focus-visible:ring-2 ring-primary/40 ${!lead.read ? 'bg-primary/5' : ''} grid-cols-[1fr_auto] sm:grid-cols-[110px_92px_1fr_80px_88px_auto] sm:px-4`}
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
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-tint text-[13px] text-primary-text hover:bg-primary hover:text-white"
          title="전화 걸기"
          aria-label="전화 걸기"
        >📞</a>
        <AlimBtn lead={lead} />
      </span>
    </div>
  )
}

function AlimBtn({ lead }) {
  const toast = useToast()
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toast(`${maskName(lead.name)} 고객에게 알림톡을 보냈어요`) }}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-ok/10 text-[13px] text-ok hover:bg-ok hover:text-white"
      title="알림톡 보내기"
      aria-label="알림톡 보내기"
    >💬</button>
  )
}

// 상태 전환 규칙은 constants의 LEAD_TRANSITIONS 단일 소스를 사용
const NEXT = LEAD_TRANSITIONS

export function LeadDrawer({ lead, onClose, by = 'partner', tenants, allowReassign }) {
  const { dispatch } = useStore()
  const toast = useToast()
  const [memo, setMemo] = useState(lead?.memo ?? '')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')

  // 드로어는 상시 마운트 — 리드가 바뀔 때 로컬 상태를 재동기화 (이전 메모/사유 이월·소실 방지)
  useEffect(() => { setMemo(lead?.memo ?? ''); setReason(''); setCancelOpen(false) }, [lead?.id])

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
          <span className="text-bfaint">관심 서비스</span>
          {/* 복수 관심 카테고리(cats) 지원 — 있으면 전부 표시 */}
          <span className="font-semibold text-primary-text">
            {lead.cats?.length > 1 ? lead.cats.map((slug) => catBySlug(slug)?.name).filter(Boolean).join(' · ') : cat?.name}
          </span>
          <span className="text-bfaint">희망 시간</span><span className="font-semibold text-bink">{lead.wish}</span>
          <span className="text-bfaint">유입 경로</span>
          <span className="font-semibold text-bink">
            {lead.source === 'main' ? '모두온 본진' : `파트너몰(${lead.source})`}
            {lead.ref && <span className="ml-1.5 rounded-full bg-orange-tint px-2 py-0.5 text-[10.5px] font-bold text-orange-text">추천 {lead.ref}</span>}
          </span>
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

      <AiDesignPanel lead={lead} />

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
          onBlur={() => { if (lead && memo !== lead.memo) dispatch({ type: 'LEAD_MEMO', id: lead.id, memo }) }}
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

// ─── 셀러 AI 설계 어시스턴트 (기획서 표2 셀러 AI · Opus 5) ──────────
// AiSpark 아이콘은 ./AiPanel 단일 소스에서 import (중복 정의 제거)
function localDesign(lead) {
  const cat = catBySlug(lead.cat)?.name ?? '생활서비스'
  const M = {
    '인터넷/TV': { plan: 'KT 500M + 정수기 결합 + 신규 프로모션', save: '월 32,900원 · 현금 사은품 35만원', script: '지금 쓰시는 인터넷 약정 만기부터 확인해 드릴게요. 결합만 잡아도 월 만 원 이상 빠집니다.' },
    '휴대폰': { plan: '선택약정 25% + 요금제 1단계 하향', save: '월 약 33,000원 절감', script: '기기값과 요금을 따로 봐야 진짜 통신비가 보여요. 지금 요금제부터 점검해 드릴게요.' },
    '이사': { plan: '포장이사 3사 비교 + 입주청소 결합', save: '평균 20만원 절약', script: '이사일과 짐 규모만 알려주시면 3곳 견적을 오늘 안에 비교해 드릴게요.' },
    '정수기': { plan: '의무약정 짧은 렌탈 + 제휴 사은품', save: '월 렌탈료 최저 + 사은품', script: '지금 쓰시는 정수기 약정 만기와 관리주기부터 확인해 드릴게요.' },
  }
  const d = M[cat] ?? { plan: `${cat} 맞춤 비교 설계`, save: '조건별 최대 혜택 안내', script: `${cat} 관련 지금 조건부터 확인하고 가장 큰 혜택으로 잡아드릴게요.` }
  return `추천 구성 — ${d.plan}\n예상 혜택 — ${d.save}\n상담 스크립트 — "${d.script}"`
}
function AiDesignPanel({ lead }) {
  const [state, setState] = useState('idle')
  const [text, setText] = useState('')
  const [src, setSrc] = useState('local')
  const run = async () => {
    setState('loading')
    const cat = catBySlug(lead.cat)?.name ?? '생활서비스'
    const q = lead.quote ? ` 계산기견적: ${lead.quote.label ?? `월 ${won(lead.quote.total)}·사은품 ${won(lead.quote.gift)}`}.` : ''
    const prompt = `당신은 모두온 셀러의 AI 설계 어시스턴트입니다. 아래 고객에게 최적 상품 구성과 상담 스크립트를 한국어로 간결히 제안하세요. 과장·수익보장 표현 금지.\n고객: 지역 ${lead.sigungu} · 관심 ${cat} · 희망상담 ${lead.wish}.${q}\n형식(각 1줄):\n추천 구성 — ...\n예상 혜택 — 숫자 포함\n상담 스크립트 — "..."`
    try {
      const reply = await callClaude(prompt, 'seller-design')
      setText(reply ?? localDesign(lead))
      setSrc(reply ? 'claude' : 'local')
    } catch {
      // 호출 실패 시 스피너에 갇히지 않게 로컬 브레인으로 폴백
      setText(localDesign(lead))
      setSrc('local')
    }
    setState('done')
  }
  return (
    <div className="mt-4 rounded-card border border-primary/25 bg-tint/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-primary-text"><AiSpark /> AI 설계 어시스턴트</div>
        {state === 'done' && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-bfaint">{src === 'claude' ? 'Claude Opus 5' : '데모 브레인'}</span>}
      </div>
      {state === 'idle' && (
        <>
          <p className="mt-1 text-[12px] leading-4 text-bmuted">고객 조건으로 최적 요금제·결합·상담 스크립트를 자동 설계합니다.</p>
          <button onClick={run} className="glass-btn-cta mt-2.5 h-10 w-full rounded-field bg-primary text-[13.5px] font-bold text-white transition-colors hover:bg-primary-hover">AI 설계 제안 받기</button>
        </>
      )}
      {state === 'loading' && <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-bmuted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /> 최적 구성 설계 중…</div>}
      {state === 'done' && (
        <>
          <div className="mt-2.5 whitespace-pre-line rounded-field bg-white p-3.5 text-[13px] leading-[22px] text-bbody">{text}</div>
          <button onClick={run} className="mt-2 text-[12px] font-bold text-primary-text hover:underline">다시 제안</button>
        </>
      )}
    </div>
  )
}
