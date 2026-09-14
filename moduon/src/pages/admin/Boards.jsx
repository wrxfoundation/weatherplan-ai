// ─── 게시판 관리 — 후기·질문/답변·꿀팁·이벤트·공지 5종(posts 컬렉션, board 로 구분) ──
// 불편접수는 처리 흐름이 달라 별도 인박스(/admin/complaints)에서 다룬다.
// 소비자 화면은 작성자를 maskName 으로 가리지만 어드민은 원문을 보되 pii 로 감싼다(Ctrl+Shift+H 블러).
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { BOARDS, boardByKey } from '../../lib/constants'
import { fmtDateTime, fmtDate, timeAgo } from '../../lib/engine'
import { Card, Btn, Modal, Drawer, Field, binputCls, useToast, EmptyState, KpiCard } from '../../components/ui'
import { IcSearch, IcInbox, IcCheck } from '../../components/icons'

const TABS = BOARDS.filter((b) => b.key !== 'complaint')
// 게시판별 상태 어휘 — 리듀서가 만드는 값(접수/답변완료/공개/진행중/종료)과 어드민 편집용 '숨김'(숨김≠삭제)
// 질문/답변도 '숨김' 이 있어야 스팸·개인정보 질문을 삭제 없이 내릴 수 있다(소비자 Board/BoardPost 의 HIDDEN 필터가 '숨김' 을 본다)
const STATUS_BY_BOARD = { qna: ['접수', '답변완료', '숨김'], event: ['진행중', '종료', '숨김'], review: ['공개', '숨김'], tip: ['공개', '숨김'], notice: ['공개', '숨김'] }
const STATUS_TONE = { 접수: 'bg-warn/10 text-warn', 답변완료: 'bg-ok/10 text-ok', 공개: 'bg-tint text-primary-text', 진행중: 'bg-ok/10 text-ok', 종료: 'bg-brow text-bmuted', 숨김: 'bg-brow text-bmuted' }
// "새 글" 은 운영자가 쓰는 게시판에서만 — 후기·질문은 소비자 작성물이라 등록 버튼이 없다
const ADMIN_WRITE = { notice: '모두온', event: '모두온', tip: '모두온 에디터' }

// <input type=date> 값은 로컬 날짜 구성요소로 만든다 — toISOString()(UTC)을 쓰면 KST 09:00 이전 타임스탬프가 전날로 찍히고,
// fromDateInput 이 로컬 자정으로 되읽어 저장할 때마다 하루씩 앞당겨진다
const toDateInput = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const fromDateInput = (s, end = false) => (s ? new Date(`${s}T${end ? '23:59:59' : '00:00:00'}`).getTime() : null)
const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString()
const splitTags = (s = '') => s.split(',').map((t) => t.trim()).filter(Boolean)

const emptyForm = (board) => ({ id: null, board, title: '', body: '', tags: '', pinned: false, status: board === 'event' ? '진행중' : board === 'qna' ? '접수' : '공개', from: '', to: '' })
const toForm = (p) => ({ id: p.id, board: p.board, title: p.title ?? '', body: p.body ?? '', tags: (p.tags ?? []).join(', '), pinned: !!p.pinned, status: p.status ?? '공개', from: toDateInput(p.period?.from), to: toDateInput(p.period?.to) })

export default function AdminBoards() {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const { board: param } = useParams()
  const board = TABS.some((t) => t.key === param) ? param : 'qna'
  const meta = boardByKey(board)

  const [q, setQ] = useState('')
  const [statusF, setStatusF] = useState('전체')
  const [answerId, setAnswerId] = useState(null)   // 답변 드로어
  const [answer, setAnswer] = useState('')
  const [form, setForm] = useState(null)           // 편집/새 글 드로어
  const [delTarget, setDelTarget] = useState(null)

  // 탭이 바뀌면 필터를 초기화 — 다른 게시판의 상태값이 남아 빈 목록이 되지 않게
  useEffect(() => { setStatusF('전체'); setQ('') }, [board])

  const posts = db.posts ?? []
  const answerPost = posts.find((p) => p.id === answerId) ?? null
  useEffect(() => { setAnswer(answerPost?.answer?.body ?? '') }, [answerId]) // eslint-disable-line

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return posts
      .filter((p) => p.board === board)
      .filter((p) => statusF === '전체' || p.status === statusF)
      .filter((p) => !s || `${p.title}${p.body}${p.author}${(p.tags ?? []).join()}`.toLowerCase().includes(s))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
  }, [posts, board, statusF, q])

  const unanswered = posts.filter((p) => p.board === 'qna' && p.status === '접수').length
  const todayAll = posts.filter((p) => p.board !== 'complaint' && isToday(p.createdAt)).length
  const todayHere = posts.filter((p) => p.board === board && isToday(p.createdAt)).length
  const pinnedHere = posts.filter((p) => p.board === board && p.pinned).length

  const pin = (p) => {
    dispatch({ type: 'POST_UPDATE', payload: { id: p.id, patch: { pinned: !p.pinned } } })
    toast(p.pinned ? '상단 고정을 해제했어요' : '상단에 고정했어요')
  }
  const saveAnswer = () => {
    if (!answerPost || !answer.trim()) return
    dispatch({ type: 'POST_ANSWER', payload: { id: answerPost.id, body: answer.trim() } })
    toast('답변을 등록했어요 — 질문/답변 게시판에 즉시 반영')
    setAnswerId(null)
  }
  const saveForm = () => {
    if (!form || !form.title.trim() || !form.body.trim()) return
    // 이벤트 기간 — 양쪽 날짜가 있을 때만 period, 비우면 null 로 해제(소비자 화면은 period 가 truthy 일 때만 표시)
    const period = form.board === 'event' ? (form.from && form.to ? { from: fromDateInput(form.from), to: fromDateInput(form.to, true) } : null) : undefined
    if (form.id) {
      const patch = { title: form.title.trim(), body: form.body.trim(), tags: splitTags(form.tags), pinned: form.pinned, status: form.status, ...(period !== undefined ? { period } : {}) }
      dispatch({ type: 'POST_UPDATE', payload: { id: form.id, patch } })
      toast('게시글을 수정했어요 — 소비자 화면에 즉시 반영')
    } else {
      dispatch({ type: 'POST_CREATE', payload: { board: form.board, title: form.title.trim(), body: form.body.trim(), author: ADMIN_WRITE[form.board] ?? '모두온', tags: splitTags(form.tags), pinned: form.pinned, status: form.status, ...(period ? { period } : {}), by: 'admin' } })
      toast(`${meta.name}에 새 글을 등록했어요`)
    }
    setForm(null)
  }
  const remove = () => {
    if (!delTarget) return
    dispatch({ type: 'POST_DELETE', id: delTarget.id })
    toast('게시글을 삭제했어요 — 감사 로그에 기록됩니다')
    setDelTarget(null)
  }
  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const formValid = !!form && !!form.title.trim() && !!form.body.trim()
  // 편집 중인 원본 — 답변이 달린 질문은 '접수' 로 되돌릴 수 없다(답변 블록과 접수 칩이 소비자 화면에 같이 뜬다)
  const editing = form?.id ? posts.find((p) => p.id === form.id) : null
  const lockReceived = !!editing && editing.board === 'qna' && !!editing.answer

  // 연락처 열은 질문/답변에만 — 소비자 글쓰기가 qna 에서만 phone 을 담고(불편접수는 별도 인박스) 다른 보드는 늘 '—' 라 제목 폭만 낭비
  const hasPhoneCol = board === 'qna'
  const COLS = hasPhoneCol ? 'lg:grid-cols-[52px_1.6fr_0.8fr_0.9fr_0.9fr_56px_80px_auto]' : 'lg:grid-cols-[52px_2.5fr_0.8fr_0.9fr_56px_80px_auto]'

  return (
    <div className="mx-auto max-w-6xl" data-t="admin-boards">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold text-bink">게시판 관리</h1>
          <p className="mt-0.5 text-[12.5px] text-bmuted">후기·질문/답변·꿀팁·이벤트·공지 — 답변·고정·숨김이 소비자 게시판에 즉시 반영됩니다.</p>
        </div>
        <Link to="/admin/complaints" className="flex items-center gap-1.5 text-[12.5px] font-bold text-primary-text hover:underline"><IcInbox size={14} />불편접수는 인박스에서 →</Link>
      </div>

      {/* 게시판 탭 — 라우트(/admin/boards/:board)와 동기화 */}
      <div className="scrollbar-none mt-4 flex gap-1.5 overflow-x-auto">
        {TABS.map((t) => {
          const n = posts.filter((p) => p.board === t.key).length
          const badge = t.key === 'qna' ? unanswered : 0
          return (
            <button key={t.key} type="button" data-t="board-tab" data-board={t.key} onClick={() => nav(`/admin/boards/${t.key}`)} aria-current={board === t.key ? 'page' : undefined}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-bold transition-colors ${board === t.key ? 'bg-bink text-white' : 'bg-white text-bbody shadow-bcard hover:text-bink'}`}>
              {t.name} <span className={`tnum ${board === t.key ? 'text-white/70' : 'text-bfaint'}`}>{n}</span>
              {badge > 0 && <span className="tnum flex h-4 min-w-4 items-center justify-center rounded-full bg-warn px-1 text-[10px] font-bold text-white">{badge}</span>}
            </button>
          )
        })}
      </div>

      {/* KPI */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <KpiCard label="미답변 질문" value={unanswered} suffix="건" caption="질문/답변 · 접수 상태" accent={unanswered > 0 ? 'text-warn' : undefined} />
        <KpiCard label="오늘 등록" value={todayHere} suffix="건" caption={`${meta.name} · 전체 게시판 ${todayAll}건`} />
        <KpiCard label="고정 글" value={pinnedHere} suffix="건" caption={`${meta.name} 상단 고정`} />
      </div>

      {/* 도구줄 — 검색 · 상태 필터 · 새 글 */}
      <Card track="b" className="mt-4 flex flex-wrap items-center gap-2 p-3.5">
        <div className="flex h-9 min-w-[200px] flex-1 items-center gap-2 rounded-full border border-bline bg-white px-3.5">
          <IcSearch size={14} className="shrink-0 text-bfaint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목·본문·작성자 검색…" aria-label="게시글 검색" className="w-full bg-transparent text-[13px] font-semibold text-bink outline-none placeholder:text-bfaint" />
        </div>
        <div className="scrollbar-none flex gap-1.5 overflow-x-auto">
          {['전체', ...(STATUS_BY_BOARD[board] ?? [])].map((s) => (
            <button key={s} type="button" onClick={() => setStatusF(s)} className={`h-8 shrink-0 rounded-full px-3 text-[12px] font-bold transition-colors ${statusF === s ? 'bg-bink text-white' : 'bg-brow text-bbody hover:text-bink'}`}>{s}</button>
          ))}
        </div>
        <span className="tnum text-[11.5px] font-bold text-bfaint">{list.length}건</span>
        {ADMIN_WRITE[board] && <Btn size="xs" data-t="post-new" onClick={() => setForm(emptyForm(board))}>새 글</Btn>}
      </Card>

      {/* 게시글 표 */}
      <Card track="b" className="mt-4 overflow-hidden">
        <div className={`hidden gap-2 border-b border-brow bg-brow/50 px-5 py-2.5 text-[11.5px] font-bold text-bmuted lg:grid ${COLS}`}>
          <span>고정</span><span>제목</span><span>작성자</span>{hasPhoneCol && <span>연락처</span>}<span>등록일</span><span>조회</span><span>상태</span><span>액션</span>
        </div>
        {list.map((p) => (
          <div key={p.id} data-t="admin-post-row" data-id={p.id} className={`grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1.5 border-b border-brow px-4 py-3 lg:gap-2 lg:px-5 ${COLS}`}>
            <button type="button" data-t="post-pin" aria-pressed={!!p.pinned} aria-label="상단 고정" title={p.pinned ? '고정 해제' : '상단 고정'} onClick={() => pin(p)}
              className={`flex h-7 w-9 items-center justify-center rounded-md text-[11px] font-extrabold transition-colors ${p.pinned ? 'bg-primary text-white' : 'bg-brow text-bfaint hover:text-bink'}`}>고정</button>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-1.5">
                <span title={p.title} className="truncate text-[13.5px] font-bold text-bink">{p.title}</span>
                {p.board === 'qna' && p.answer && <IcCheck size={13} className="shrink-0 text-ok" />}
                {typeof p.rating === 'number' && <span className="shrink-0 text-[11px] font-bold text-warn">★ {p.rating}</span>}
              </div>
              <div className="truncate text-[11.5px] text-bfaint">
                {(p.tags ?? []).map((t) => `#${t}`).join(' ')}{p.region ? ` · ${p.region}` : ''}
                {p.period && ` · ${fmtDate(p.period.from)} ~ ${fmtDate(p.period.to)}`}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px] text-bmuted lg:hidden">
                <span className="pii font-semibold text-bbody">{p.author}</span>
                <span>· {timeAgo(p.createdAt)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${STATUS_TONE[p.status] ?? 'bg-brow text-bbody'}`}>{p.status}</span>
              </div>
            </div>
            <span className="pii hidden truncate text-[12.5px] font-semibold text-bbody lg:block">{p.author}</span>
            {hasPhoneCol && <span className="pii tnum hidden truncate text-[12px] text-bbody lg:block">{p.phone || <span className="text-bfaint">—</span>}</span>}
            <span className="tnum hidden text-[12px] text-bmuted lg:block">{fmtDateTime(p.createdAt)}</span>
            <span className="tnum hidden text-[12px] text-bbody lg:block">{p.views ?? 0}</span>
            <span className="hidden lg:block"><span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${STATUS_TONE[p.status] ?? 'bg-brow text-bbody'}`}>{p.status}</span></span>
            <div className="col-span-2 flex justify-end gap-1.5 lg:col-span-1">
              {p.board === 'qna' && (
                <button type="button" data-t="post-answer-btn" onClick={() => setAnswerId(p.id)} className={`h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-[11.5px] font-bold ${p.answer ? 'bg-brow text-bbody hover:text-bink' : 'bg-primary text-white hover:bg-primary-hover'}`}>{p.answer ? '답변 수정' : '답변'}</button>
              )}
              <button type="button" data-t="post-edit" onClick={() => setForm(toForm(p))} className="h-8 shrink-0 whitespace-nowrap rounded-full bg-tint px-3 text-[11.5px] font-bold text-primary-text hover:bg-primary hover:text-white">편집</button>
              <button type="button" onClick={() => setDelTarget(p)} className="h-8 shrink-0 whitespace-nowrap rounded-full bg-danger/10 px-3 text-[11.5px] font-bold text-danger hover:bg-danger hover:text-white">삭제</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <EmptyState text={`${meta.name}에 조건에 맞는 글이 없어요`} sub={q || statusF !== '전체' ? '검색어나 상태 필터를 바꿔보세요' : undefined} />}
      </Card>

      {/* 답변 드로어 (질문/답변) — 저장 시 상태가 답변완료로 넘어간다 */}
      <Drawer open={!!answerPost} onClose={() => setAnswerId(null)} title="질문 답변">
        {answerPost && (
          <div className="flex flex-col gap-4" data-t="post-answer-drawer">
            <div className="rounded-field bg-brow p-3.5">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${STATUS_TONE[answerPost.status] ?? 'bg-brow text-bbody'}`}>{answerPost.status}</span>
                <span className="text-[11.5px] text-bmuted">{fmtDateTime(answerPost.createdAt)} · 조회 {answerPost.views ?? 0}</span>
              </div>
              <div className="mt-2 text-[14px] font-extrabold text-bink">{answerPost.title}</div>
              <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5 text-bbody">{answerPost.body}</p>
              <div className="pii mt-2 text-[12px] text-bmuted">{answerPost.author}{answerPost.phone ? ` · ${answerPost.phone}` : ''}</div>
            </div>
            {answerPost.answer && <div className="text-[11.5px] text-bfaint">기존 답변 {fmtDateTime(answerPost.answer.at)} · {answerPost.answer.by} — 아래에서 수정하면 덮어써요</div>}
            <Field label="답변" required>
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="고객에게 보이는 답변입니다. 정중하게, 다음 행동을 안내해 주세요." className="min-h-[160px] w-full rounded-field border border-bline p-3 text-[14px] text-bink focus:border-primary" />
            </Field>
            <div className="flex gap-2">
              <Btn variant="boutline" size="sm" className="flex-1" onClick={() => setAnswerId(null)}>취소</Btn>
              <Btn size="sm" className="flex-1" disabled={!answer.trim()} onClick={saveAnswer} data-t="post-answer-save">답변 등록</Btn>
            </div>
            <p className="text-[11px] leading-4 text-bfaint">등록 즉시 질문 상태가 <strong className="text-bink">답변완료</strong>로 바뀌고 소비자 게시판에 노출돼요.{answerPost.status === '숨김' && ' 지금은 숨김 상태라, 답변을 등록하면 다시 공개돼요.'}</p>
          </div>
        )}
      </Drawer>

      {/* 편집 / 새 글 드로어 */}
      <Drawer open={!!form} onClose={() => setForm(null)} title={form?.id ? '게시글 편집' : `${meta.name} 새 글`}>
        {form && (
          <div className="flex flex-col gap-3.5" data-t="post-edit-drawer">
            <Field label="제목" required><input className={binputCls} value={form.title} onChange={setF('title')} /></Field>
            <Field label="본문" required>
              <textarea className="min-h-[160px] w-full rounded-field border border-bline p-3 text-[14px] text-bink focus:border-primary" value={form.body} onChange={setF('body')} />
            </Field>
            <Field label="태그" hint="쉼표로 구분"><input className={binputCls} value={form.tags} onChange={setF('tags')} placeholder="인터넷, 렌탈" /></Field>
            {form.board === 'event' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="시작일"><input type="date" className={binputCls} value={form.from} onChange={setF('from')} /></Field>
                <Field label="종료일"><input type="date" className={binputCls} value={form.to} onChange={setF('to')} /></Field>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="상태" hint={lockReceived ? '답변이 있어 접수로 되돌릴 수 없어요' : undefined}>
                <select className={binputCls} value={form.status} onChange={setF('status')}>
                  {(STATUS_BY_BOARD[form.board] ?? ['공개', '숨김']).map((s) => <option key={s} value={s} disabled={lockReceived && s === '접수'}>{s}</option>)}
                </select>
              </Field>
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-label">상단 고정</span>
                <label className="flex h-11 items-center gap-2 rounded-field border border-bline px-3 text-[13px] font-semibold text-bbody sm:h-10">
                  <input type="checkbox" checked={form.pinned} onChange={setF('pinned')} className="h-4 w-4 accent-[#5377D6]" />
                  {form.pinned ? '고정' : '고정 안 함'}
                </label>
              </div>
            </div>
            <div className="mt-1 flex gap-2">
              <Btn variant="boutline" size="sm" className="flex-1" onClick={() => setForm(null)}>취소</Btn>
              <Btn size="sm" className="flex-1" disabled={!formValid} onClick={saveForm} data-t="post-save">{form.id ? '저장' : '등록'}</Btn>
            </div>
            <p className="text-[11px] leading-4 text-bfaint">숨김은 삭제가 아니에요 — 소비자 목록에서만 사라지고 어드민에는 남아요.</p>
          </div>
        )}
      </Drawer>

      <Modal open={!!delTarget} onClose={() => setDelTarget(null)} title="게시글 삭제">
        <p className="text-[13.5px] leading-5 text-bbody">
          <strong className="font-extrabold text-bink">“{delTarget?.title}”</strong> 글을 삭제할까요? 되돌릴 수 없어요. 잠시 내리는 거라면 상태를 <strong className="text-bink">숨김</strong>으로 바꾸는 걸 권장해요.
        </p>
        <div className="mt-4 flex gap-2">
          <Btn variant="boutline" size="sm" className="flex-1" onClick={() => setDelTarget(null)}>돌아가기</Btn>
          <Btn variant="danger" size="sm" className="flex-1" onClick={remove}>삭제</Btn>
        </div>
      </Modal>
    </div>
  )
}
