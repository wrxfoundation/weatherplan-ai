// ─── 불편접수 인박스 — posts(board 'complaint') 를 접수→처리중→완료 로 처리. 답변 등록 시 자동 완료 ──
// 좌 목록 + 우 상세(lg 이상). lg 미만은 같은 상세를 드로어로 연다.
// 작성자·연락처는 어드민이 원문을 보되 pii 로 감싼다(Ctrl+Shift+H 블러). 소비자 화면엔 연락처를 절대 내보내지 않는다.
import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../../lib/store'
import { COMPLAINT_STATUS } from '../../lib/constants'
import { fmtDateTime, timeAgo } from '../../lib/engine'
import { Card, Btn, Drawer, Field, useToast, EmptyState, KpiCard } from '../../components/ui'
import { IcAlert, IcClock, IcCheck, IcInbox } from '../../components/icons'

const SLA_MS = 24 * 3600000 // 접수 후 24시간 — 넘도록 '접수' 면 경고
const STATUS_TONE = { 접수: 'bg-warn/10 text-warn', 처리중: 'bg-tint text-primary-text', 완료: 'bg-ok/10 text-ok' }
const slaOver = (p) => p.status === '접수' && Date.now() - p.createdAt > SLA_MS

// 경과시간 — 분/시간/일 단위로 사람이 읽기 좋게
function elapsed(from, to = Date.now()) {
  const m = Math.max(0, Math.floor((to - from) / 60000))
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 ${m % 60}분`
  return `${Math.floor(h / 24)}일 ${h % 24}시간`
}

// lg(1024px) 분기 — 상세를 패널로 둘지 드로어로 열지. 드로어는 열릴 때 바디 스크롤을 잠그므로 CSS 숨김만으론 부족하다.
function useDesktop() {
  const q = '(min-width: 1024px)'
  const [m, setM] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(q)
    const on = (e) => setM(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

export default function AdminComplaints() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const desktop = useDesktop()
  const [filter, setFilter] = useState('전체')
  const [selId, setSelId] = useState(null)

  const all = useMemo(() => (db.posts ?? []).filter((p) => p.board === 'complaint').sort((a, b) => b.createdAt - a.createdAt), [db.posts])
  const list = all.filter((p) => filter === '전체' || p.status === filter)
  const sel = all.find((p) => p.id === selId) ?? null
  const count = (s) => all.filter((p) => p.status === s).length

  // 평균 처리시간 — 답변(완료) 시각 − 접수 시각, 시간 단위
  const done = all.filter((p) => p.status === '완료' && p.answer?.at)
  const avgHours = done.length ? done.reduce((s, p) => s + (p.answer.at - p.createdAt), 0) / done.length / 3600000 : 0
  const overdue = all.filter(slaOver).length

  // 데스크톱은 첫 건을 자동 선택(빈 패널 방지). 모바일은 탭해야 드로어가 열린다.
  useEffect(() => {
    if (!desktop) return
    if ((!sel || !list.some((p) => p.id === sel.id)) && list[0]) setSelId(list[0].id)
  }, [desktop, filter, list.length]) // eslint-disable-line

  const setStatus = (p, status) => {
    if (p.status === status) return
    dispatch({ type: 'POST_STATUS', payload: { id: p.id, status } })
    toast(`상태를 ${status}(으)로 바꿨어요`)
  }
  const saveAnswer = (p, body) => {
    dispatch({ type: 'POST_ANSWER', payload: { id: p.id, body } })
    toast('답변을 등록했어요 — 완료 처리됨')
  }

  return (
    <div className="mx-auto max-w-6xl" data-t="admin-complaints">
      <h1 className="text-[20px] font-extrabold text-bink">불편접수 인박스</h1>
      <p className="mt-0.5 text-[12.5px] text-bmuted">고객이 남긴 불편·개선 요청을 접수 → 처리중 → 완료로 처리합니다. 답변을 등록하면 자동으로 완료돼요.</p>

      {/* KPI 4 */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="접수" value={count('접수')} suffix="건" caption={overdue > 0 ? `SLA 24시간 초과 ${overdue}건` : '24시간 내 첫 응답 목표'} accent={overdue > 0 ? 'text-warn' : undefined} />
        <KpiCard label="처리중" value={count('처리중')} suffix="건" caption="담당자 확인 중" />
        <KpiCard label="완료" value={count('완료')} suffix="건" caption="답변 등록 완료" accent="text-ok" />
        <KpiCard label="평균 처리시간" value={`${avgHours.toFixed(1)}시간`} caption={done.length ? `완료 ${done.length}건 기준 (접수→답변)` : '완료 건이 쌓이면 계산돼요'} />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[1fr_1.15fr]">
        {/* 좌: 목록 */}
        <Card track="b" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-5">
            <h2 className="text-[15.5px] font-extrabold text-bink">접수 목록 <span className="tnum text-bfaint">{list.length}</span></h2>
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
              {['전체', ...COMPLAINT_STATUS].map((s) => (
                <button key={s} type="button" onClick={() => setFilter(s)} className={`tnum h-8 shrink-0 rounded-full px-3 text-[12px] font-bold transition-colors ${filter === s ? 'bg-bink text-white' : 'bg-brow text-bbody hover:text-bink'}`}>
                  {s}{s !== '전체' && <span className={filter === s ? 'ml-1 text-white/70' : 'ml-1 text-bfaint'}>{count(s)}</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            {list.map((p) => {
              const over = slaOver(p)
              const on = p.id === selId
              return (
                <button
                  key={p.id} type="button" data-t="complaint-row" data-id={p.id} data-status={p.status} aria-current={on ? 'true' : undefined}
                  onClick={() => setSelId(p.id)}
                  className={`block w-full border-b border-brow px-4 py-3.5 text-left transition-colors sm:px-5 ${on ? 'bg-tint/60' : 'hover:bg-brow/60'} ${over ? 'border-l-4 border-l-warn' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${STATUS_TONE[p.status] ?? 'bg-brow text-bbody'}`}>{p.status}</span>
                    <span title={p.title} className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-bink">{p.title}</span>
                    {over && <span className="flex shrink-0 items-center gap-1 rounded-full bg-warn/10 px-2 py-0.5 text-[10.5px] font-bold text-warn"><IcClock size={11} />SLA 초과</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-bmuted">
                    <span className="pii font-semibold text-bbody">{p.author}</span>
                    <span>· {timeAgo(p.createdAt)}</span>
                    {(p.tags ?? []).map((t) => <span key={t} className="rounded-full bg-brow px-1.5 py-0.5 text-[10.5px] font-bold text-bbody">{t}</span>)}
                  </div>
                </button>
              )
            })}
            {list.length === 0 && <EmptyState icon={IcInbox} text="조건에 맞는 접수 건이 없어요" sub={filter !== '전체' ? '상태 필터를 바꿔보세요' : '불편접수 게시판으로 들어온 글이 여기에 쌓여요'} />}
          </div>
        </Card>

        {/* 우: 상세 패널 (lg 이상) */}
        <Card track="b" className="hidden p-5 lg:block" data-t="complaint-detail">
          {sel ? <ComplaintDetail p={sel} onStatus={setStatus} onAnswer={saveAnswer} /> : <EmptyState icon={IcAlert} text="왼쪽 목록에서 접수 건을 선택하세요" />}
        </Card>
      </div>

      {/* lg 미만: 같은 상세를 드로어로 */}
      <Drawer open={!!sel && !desktop} onClose={() => setSelId(null)} title="불편접수 상세">
        {sel && !desktop && <ComplaintDetail p={sel} onStatus={setStatus} onAnswer={saveAnswer} />}
      </Drawer>
    </div>
  )
}

// ─── 상세 — 본문 · 작성자(pii) · 경과 · 상태 버튼 · 답변 · 처리 이력 ─────────
function ComplaintDetail({ p, onStatus, onAnswer }) {
  const [body, setBody] = useState(p.answer?.body ?? '')
  useEffect(() => { setBody(p.answer?.body ?? '') }, [p.id]) // eslint-disable-line
  const over = slaOver(p)
  const changed = body.trim() && body.trim() !== (p.answer?.body ?? '')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${STATUS_TONE[p.status] ?? 'bg-brow text-bbody'}`}>{p.status}</span>
          {(p.tags ?? []).map((t) => <span key={t} className="rounded-full bg-brow px-2 py-0.5 text-[11px] font-bold text-bbody">{t}</span>)}
          <span className={`ml-auto tnum flex items-center gap-1 text-[12px] font-bold ${over ? 'text-warn' : 'text-bmuted'}`}><IcClock size={12} />접수 후 {elapsed(p.createdAt)}{over ? ' · SLA 초과' : ''}</span>
        </div>
        <h3 className="mt-2.5 text-[16px] font-extrabold leading-6 text-bink">{p.title}</h3>
        <p className="mt-2 whitespace-pre-line rounded-field bg-brow px-3.5 py-3 text-[13px] leading-5 text-bbody">{p.body}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-bmuted">
          <span>작성자 <span className="pii font-bold text-bbody">{p.author}</span></span>
          {p.phone && <span>연락처 <span className="pii tnum font-bold text-bbody">{p.phone}</span></span>}
          <span className="tnum">{fmtDateTime(p.createdAt)}</span>
        </div>
      </div>

      {/* 상태 변경 — COMPLAINT_STATUS 순 */}
      <section>
        <h4 className="text-[13px] font-extrabold text-bink">처리 상태</h4>
        <div className="mt-2 flex gap-1.5">
          {COMPLAINT_STATUS.map((s) => (
            <button key={s} type="button" data-t="complaint-status" data-status={s} aria-pressed={p.status === s} onClick={() => onStatus(p, s)}
              className={`h-9 flex-1 rounded-field text-[12.5px] font-bold transition-colors ${p.status === s ? 'bg-bink text-white' : 'border border-bline bg-white text-bbody hover:border-primary hover:text-primary-text'}`}>
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* 답변 — 등록 시 리듀서가 완료로 넘긴다 */}
      <section>
        <Field label={p.answer ? '답변 (수정하면 덮어써요)' : '답변'} hint="고객에게 그대로 보입니다. 사과 → 원인 → 조치 순으로 짧게.">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="불편을 드려 죄송합니다. 확인 결과 …" className="min-h-[120px] w-full rounded-field border border-bline p-3 text-[14px] text-bink focus:border-primary" />
        </Field>
        <Btn size="sm" className="mt-2 w-full" disabled={!changed} onClick={() => onAnswer(p, body.trim())} data-t="complaint-answer-save">
          {p.answer ? '답변 수정 · 완료 유지' : '답변 등록 · 완료 처리'}
        </Btn>
      </section>

      {/* 처리 이력 — answer 와 status 에서 파생 */}
      <section>
        <h4 className="text-[13px] font-extrabold text-bink">처리 이력</h4>
        <ol className="mt-2 flex flex-col gap-2 border-l-2 border-bline pl-3.5 text-[12.5px]">
          <li>
            <div className="font-bold text-bink">접수</div>
            <div className="tnum text-[11.5px] text-bfaint">{fmtDateTime(p.createdAt)} · <span className="pii">{p.author}</span></div>
          </li>
          {p.status === '처리중' && !p.answer && (
            <li>
              <div className="font-bold text-primary-text">처리중 — 담당자 확인</div>
              <div className="text-[11.5px] text-bfaint">답변을 등록하면 완료로 넘어가요</div>
            </li>
          )}
          {p.answer && (
            <li>
              <div className="flex items-center gap-1 font-bold text-ok"><IcCheck size={13} />답변 등록 · 완료</div>
              <div className="tnum text-[11.5px] text-bfaint">{fmtDateTime(p.answer.at)} · {p.answer.by} · 처리 {elapsed(p.createdAt, p.answer.at)}</div>
              <p className="mt-1 whitespace-pre-line rounded-field bg-ok/5 px-3 py-2 text-[12px] leading-5 text-bbody">{p.answer.body}</p>
            </li>
          )}
          {p.status === '완료' && !p.answer && (
            <li>
              <div className="font-bold text-ok">완료 (답변 없이 종결)</div>
            </li>
          )}
        </ol>
      </section>
      <p className="text-[11px] leading-4 text-bfaint">상태 변경·답변은 권한·감사 로그에 남아요. 연락처는 소비자 화면에 노출되지 않습니다.</p>
    </div>
  )
}
