// ─── 게시판 6종 — 후기·질문/답변·꿀팁·이벤트·불편접수·공지사항 (아정당 구조) ─────────
// posts 한 컬렉션을 board 로 나눠 본다. 불편접수는 private — 목록 대신 접수 폼(→ 접수 확인 카드)·처리 현황·내 접수 조회.
// 작성자 이름은 maskName, 연락처는 소비자 화면 어디에도 내보내지 않는다.
// 내 접수 조회는 이름+연락처가 모두 맞아야 하고, 결과도 상태·제목 앞부분·답변 여부까지만 — 전문은 접수 연락처로 안내.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { BOARDS, boardByKey, COMPLAINT_STATUS, HQ_TEL } from '../../lib/constants'
import { maskName, phoneValid, timeAgo, fmtDate, fmtDateTime } from '../../lib/engine'
import { Btn, Chip, EmptyState, Field, inputCls, useToast } from '../../components/ui'
import { IcThumbUp, IcChat, IcBulb, IcGift, IcAlert, IcMegaphone, IcSearch, IcClock, IcCheck, IcCalendar, IcPhone } from '../../components/icons'
import { Stars } from '../../components/Reviews'

const PAGE = 10
const BOARD_ICON = { review: IcThumbUp, qna: IcChat, tip: IcBulb, event: IcGift, complaint: IcAlert, notice: IcMegaphone }
const COMPLAINT_TYPES = ['설치', '상담', '요금', '기타']
const EMPTY_FORM = { title: '', body: '', name: '', phone: '', type: '설치' }
const EMPTY_LOOKUP = { name: '', phone: '' }
// 어드민이 숨긴 글은 소비자 목록에서 뺀다(삭제 아님 — 숨김≠삭제). BoardPost.jsx 와 같은 규칙.
const HIDDEN = ['숨김', '비공개']
const publicPosts = (posts, board) =>
  posts
    .filter((p) => p.board === board && !HIDDEN.includes(p.status))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
const textareaCls = 'min-h-[140px] w-full rounded-field border border-line bg-white p-4 text-[16px] text-ink placeholder:text-disabled transition-colors focus:border-primary sm:text-[15px]'
const digits = (s = '') => s.replace(/\D/g, '')
// 조회 결과 제목은 앞 6자만 — 본인 확인이 목적이라 전문을 드러내지 않는다(번호 열거로 남의 접수를 읽지 못하게)
const maskTitle = (t = '') => (t.length > 6 ? `${t.slice(0, 6).trimEnd()}…` : t)
// 처리시간 표기 — 1시간 미만은 "1시간 이내", 하루 넘으면 일·시간
const fmtDur = (ms) => {
  const h = Math.round(ms / 3600000)
  if (h < 1) return '1시간 이내'
  if (h < 24) return `${h}시간`
  const d = Math.floor(h / 24), r = h % 24
  return r ? `${d}일 ${r}시간` : `${d}일`
}

// 게시판 전용 작은 상태 칩 — StatusChip 은 리드 상태 색만 알아서 여기서 색을 정한다
const CHIP_TONE = { 접수: 'bg-tint text-primary-text', 답변완료: 'bg-ok/10 text-ok', 진행중: 'bg-ok/10 text-ok', 종료: 'bg-brow text-bmuted', 처리중: 'bg-warn/10 text-warn', 완료: 'bg-ok/10 text-ok' }
function MiniChip({ status }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${CHIP_TONE[status] ?? 'bg-brow text-bmuted'}`}>{status}</span>
}

// 상단 6개 탭 — 모바일은 가로 스크롤
function BoardTabs({ current }) {
  return (
    <nav data-t="board-tabs" aria-label="게시판" className="-mx-5 overflow-x-auto px-5 scrollbar-none sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-1 border-b border-line-card">
        {BOARDS.map((b) => {
          const Icon = BOARD_ICON[b.key]
          const on = b.key === current
          return (
            <Link
              key={b.key}
              to={`/board/${b.key}`}
              aria-current={on ? 'page' : undefined}
              className={`-mb-px inline-flex h-11 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-[14px] font-bold transition-colors ${on ? 'border-primary text-primary-text' : 'border-transparent text-label hover:text-ink'}`}
            >
              <Icon size={14} className="shrink-0" /> {b.name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// 목록 행 — 보드별 부가 정보(별점·카테고리·상태·기간·태그)
function Row({ p, board }) {
  return (
    <li data-t="board-row">
      <Link to={`/board/${board}/${p.id}`} className="flex flex-col gap-1.5 rounded-field px-2 py-3.5 transition-colors hover:bg-cream/60 sm:flex-row sm:items-center sm:gap-4 sm:px-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {board === 'notice' && <IcMegaphone size={14} className={`shrink-0 ${p.pinned ? 'text-orange-text' : 'text-faint'}`} />}
            {p.pinned && <span className="shrink-0 rounded-md bg-orange-tint px-1.5 py-0.5 text-[10.5px] font-extrabold text-orange-text">고정</span>}
            {(board === 'qna' || board === 'event') && <MiniChip status={p.status} />}
            <span className="truncate text-[14.5px] font-bold text-ink">{p.title}</span>
          </div>
          {board === 'review' && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Stars n={p.rating ?? 0} size={12} />
              {p.cat && <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-primary-text">{p.cat}</span>}
              {p.tags?.[0] && <span className="rounded-full bg-orange-tint px-2 py-0.5 text-[11px] font-bold text-orange-text">{p.tags[0]}</span>}
              <span className="line-clamp-1 w-full text-[12.5px] text-muted">{p.body}</span>
            </div>
          )}
          {board === 'event' && p.period && (
            <div className="mt-1 flex items-center gap-1 text-[12px] text-faint">
              <IcCalendar size={11} /> {fmtDate(p.period.from)} ~ {fmtDate(p.period.to)}
            </div>
          )}
          {board === 'tip' && p.tags?.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {p.tags.map((t) => <span key={t} className="text-[11.5px] font-semibold text-primary-text">#{t}</span>)}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-1.5 text-[12px] text-faint sm:w-[230px] sm:justify-end">
          <span className="font-semibold text-label">{maskName(p.author)}</span>
          <span>·</span>
          <span>{timeAgo(p.createdAt)}</span>
          <span>·</span>
          <span className="tnum">조회 {(p.views ?? 0).toLocaleString('ko-KR')}</span>
        </div>
      </Link>
    </li>
  )
}

// ── 공개 게시판(후기·질문/답변·꿀팁·이벤트·공지) — 검색 + 고정 우선 최신순 + 10건 더보기 ──
function PublicBoard({ meta }) {
  const { db } = useStore()
  const board = meta.key
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(PAGE)
  useEffect(() => { setQ(''); setLimit(PAGE) }, [board])
  useEffect(() => { setLimit(PAGE) }, [q])

  const all = useMemo(() => publicPosts(db.posts, board), [db.posts, board])
  const query = q.trim().toLowerCase()
  const list = useMemo(
    () => (query ? all.filter((p) => [p.title, p.body, ...(p.tags ?? [])].some((s) => (s ?? '').toLowerCase().includes(query))) : all),
    [all, query],
  )
  const shown = list.slice(0, limit)
  const Icon = BOARD_ICON[board]

  return (
    <main className="mx-auto max-w-4xl px-5 pb-16 sm:px-10">
      <div className="pt-6"><BoardTabs current={board} /></div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-ink sm:text-[26px]">{meta.name}</h1>
          <p className="mt-1 text-[13.5px] text-muted">{meta.desc}</p>
        </div>
        {meta.write && (
          <Link to={`/board/${board}/new`} data-t="board-write" className="glass-btn-cta inline-flex h-10 items-center gap-1.5 rounded-btn bg-primary px-4 text-[14px] font-bold text-white transition-colors hover:bg-primary-hover">
            글쓰기
          </Link>
        )}
      </div>

      <div className="relative mt-4">
        <IcSearch size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
        <input className={`${inputCls} pl-10`} placeholder="제목·내용·태그 검색" value={q} onChange={(e) => setQ(e.target.value)} aria-label="게시글 검색" />
      </div>

      <section data-t="board-list" className="mt-4 rounded-section bg-white p-2 shadow-card sm:p-4">
        <div className="flex items-center justify-between px-2 pb-2 text-[12.5px] text-faint">
          <span>전체 <b className="tnum font-bold text-label">{list.length}</b>건</span>
          {query && <button type="button" onClick={() => setQ('')} className="font-bold text-primary-text hover:underline">검색 해제</button>}
        </div>
        {shown.length === 0 ? (
          <EmptyState icon={Icon} text={query ? '검색 결과가 없어요' : '아직 글이 없어요'} sub={query ? '다른 검색어로 찾아보세요' : meta.write ? '첫 글을 남겨주세요' : '곧 소식을 올릴게요'} />
        ) : (
          <ul className="divide-y divide-line-card">
            {shown.map((p) => <Row key={p.id} p={p} board={board} />)}
          </ul>
        )}
        {list.length > shown.length && (
          <div className="mt-2 flex justify-center pb-1">
            <Btn variant="outline" size="sm" onClick={() => setLimit((l) => l + PAGE)}>더보기 ({list.length - shown.length}건 더)</Btn>
          </div>
        )}
      </section>
    </main>
  )
}

// ── 불편접수(private) — 목록을 공개하지 않고 접수 폼 · 처리 현황 · 내 접수 조회 ──
function ComplaintBoard({ meta }) {
  const { db, dispatch } = useStore()
  const toast = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitted, setSubmitted] = useState(null) // 방금 접수한 건 {title,type,at} — 폼 자리에 확인 카드
  const [lookup, setLookup] = useState(EMPTY_LOOKUP)
  const [query, setQuery] = useState(null) // null 조회 전 · {name, phone(digits)} 조회 조건 — 결과는 스토어에서 파생
  const titleRef = useRef(null)
  const lookupRef = useRef(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setLk = (k) => (e) => setLookup((f) => ({ ...f, [k]: e.target.value }))

  const complaints = useMemo(() => db.posts.filter((p) => p.board === 'complaint'), [db.posts])
  // 내 접수 — 이름·연락처 둘 다 맞는 건만. 조회 조건을 들고 있으면 접수 직후·어드민 상태 변경도 바로 반영된다
  const mine = useMemo(
    () => (query ? complaints.filter((p) => (p.author ?? '').trim() === query.name && digits(p.phone) === query.phone).sort((a, b) => b.createdAt - a.createdAt) : null),
    [complaints, query],
  )
  const counts = COMPLAINT_STATUS.map((s) => ({ s, n: complaints.filter((p) => p.status === s).length }))
  const handled = complaints.filter((p) => p.answer?.at)
  const avgMs = handled.length ? handled.reduce((a, p) => a + Math.max(0, p.answer.at - p.createdAt), 0) / handled.length : null

  // 비활성 버튼 대신, 누르면 비어 있는 첫 항목을 짚어준다
  const firstMissing = () => {
    if (form.title.trim().length < 2) return '제목을 입력해 주세요'
    if (form.body.trim().length < 5) return '내용을 5자 이상 입력해 주세요'
    if (form.name.trim().length < 2) return '이름을 입력해 주세요'
    if (!phoneValid(form.phone)) return '연락처를 010-0000-0000 형식으로 입력해 주세요'
    return null
  }
  const submit = (e) => {
    e.preventDefault()
    const missing = firstMissing()
    if (missing) { toast(missing, 'err'); return }
    const title = form.title.trim(), name = form.name.trim(), phone = form.phone.trim()
    dispatch({ type: 'POST_CREATE', payload: { board: 'complaint', title, body: form.body.trim(), author: name, phone, tags: [form.type] } })
    toast('접수됐어요. 담당자가 확인 후 연락드려요')
    // 토스트는 사라지므로 폼 자리에 확인 카드를 남기고, 내 접수 조회도 바로 채운다(입력칸에 연락처는 남기지 않음)
    setSubmitted({ title, type: form.type, at: Date.now() })
    setQuery({ name, phone: digits(phone) })
    setLookup(EMPTY_LOOKUP)
    setForm(EMPTY_FORM)
  }
  const resetForm = () => { setSubmitted(null); setTimeout(() => titleRef.current?.focus(), 0) }
  const goLookup = () => lookupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  const doLookup = (e) => {
    e.preventDefault()
    if (lookup.name.trim().length < 2) { toast('접수할 때 입력한 이름을 적어주세요', 'err'); return }
    if (!phoneValid(lookup.phone)) { toast('연락처를 010-0000-0000 형식으로 입력해 주세요', 'err'); return }
    setQuery({ name: lookup.name.trim(), phone: digits(lookup.phone) })
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-16 sm:px-10">
      <div className="pt-6"><BoardTabs current={meta.key} /></div>

      <div className="mt-6">
        <h1 className="text-[24px] font-extrabold tracking-[-0.5px] text-ink sm:text-[26px]">{meta.name}</h1>
        <p className="mt-1 text-[13.5px] text-muted">{meta.desc} 접수 내용은 공개되지 않고 담당자만 확인해요.</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* 접수 직후 — 폼 자리에 확인 카드(제목·유형·시각·다음 안내). 토스트만으론 막다른 화면이라 조회 동선까지 이어준다 */}
        {submitted ? (
          <section data-t="complaint-done" className="rounded-section bg-white p-5 shadow-card sm:p-7" aria-live="polite">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ok/10 text-ok"><IcCheck size={18} /></span>
              <div>
                <h2 className="text-[17px] font-extrabold text-ink">접수됐어요</h2>
                <p className="text-[12.5px] text-muted">담당자가 확인 후 접수하신 연락처로 연락드려요.</p>
              </div>
            </div>
            <div className="mt-4 rounded-field bg-cream/70 p-4">
              <div className="flex items-center gap-1.5">
                <MiniChip status="접수" />
                <span className="truncate text-[14.5px] font-bold text-ink">{submitted.title}</span>
              </div>
              <div className="mt-1 text-[12px] text-faint">{submitted.type} · {fmtDateTime(submitted.at)} 접수</div>
            </div>
            <p className="mt-3 text-[12.5px] leading-5 text-label">진행 상황은 '내 접수 조회'에서 접수할 때 적은 이름과 연락처로 언제든 확인할 수 있어요. 긴급한 건은 대표번호 <a href={`tel:${HQ_TEL.replace(/-/g, '')}`} className="tnum font-bold text-primary-text">{HQ_TEL}</a>로 바로 연락 주세요.</p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Btn variant="outline" size="sm" className="h-11" onClick={resetForm} data-t="complaint-again">새로 접수하기</Btn>
              <Btn size="sm" className="h-11" onClick={goLookup} data-t="complaint-see-mine"><IcSearch size={14} /> 내 접수 조회 보기</Btn>
            </div>
          </section>
        ) : (
        <form data-t="complaint-form" onSubmit={submit} className="rounded-section bg-white p-5 shadow-card sm:p-7">
          <h2 className="text-[17px] font-extrabold text-ink">불편 접수하기</h2>
          <div className="mt-4 space-y-4">
            <div>
              <span className="mb-1.5 block text-[13px] font-semibold text-label">유형 <em className="not-italic text-primary-text">*</em></span>
              <div className="flex flex-wrap gap-2">
                {COMPLAINT_TYPES.map((t) => (
                  <Chip key={t} active={form.type === t} onClick={() => setForm((f) => ({ ...f, type: t }))}>{t}</Chip>
                ))}
              </div>
            </div>
            <Field label="제목" required>
              <input ref={titleRef} className={inputCls} placeholder="예) 설치 기사님이 약속 시간에 안 오셨어요" value={form.title} onChange={set('title')} maxLength={80} />
            </Field>
            <Field label="내용" required hint="언제·어디서·무슨 일이 있었는지 적어주시면 더 빨리 처리돼요">
              <textarea className={textareaCls} placeholder="불편했던 내용을 자세히 적어주세요" value={form.body} onChange={set('body')} maxLength={1000} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="이름" required>
                <input className={inputCls} placeholder="홍길동" value={form.name} onChange={set('name')} maxLength={20} autoComplete="name" />
              </Field>
              <Field label="연락처" required hint="담당자 연락 용도로만 쓰이고 공개되지 않아요">
                <input className={inputCls} placeholder="010-0000-0000" value={form.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" />
              </Field>
            </div>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11.5px] leading-4 text-label">긴급한 건은 대표번호 <a href={`tel:${HQ_TEL.replace(/-/g, '')}`} className="tnum font-bold text-primary-text">{HQ_TEL}</a>로 바로 연락 주세요.</p>
            <Btn type="submit" className="w-full sm:w-auto">접수하기</Btn>
          </div>
        </form>
        )}

        <div className="space-y-4">
          {/* 처리 현황 요약 */}
          <section data-t="complaint-status" className="rounded-section bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-extrabold text-ink">처리 현황</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {counts.map(({ s, n }) => (
                <div key={s} className="rounded-card bg-cream/70 p-3 text-center">
                  <div className="tnum text-[20px] font-extrabold text-ink">{n}</div>
                  <div className="mt-0.5"><MiniChip status={s} /></div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[12.5px] text-label">
              <IcClock size={12} className="shrink-0 text-faint" />
              평균 처리시간 <b className="tnum font-bold text-ink">{avgMs == null ? '—' : fmtDur(avgMs)}</b>
            </div>
          </section>

          {/* 내 접수 조회 — 이름+연락처가 모두 맞는 접수만. 연락처 자체는 화면에 남기지 않고, 결과도 상태·제목 앞부분·답변 여부까지만
              (인증 없는 데모라 번호만으로 남의 접수 제목·답변 전문이 읽히지 않게). 실서비스는 세션 귀속(내 접수)으로 대체 */}
          <section ref={lookupRef} data-t="complaint-lookup" className="rounded-section bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-extrabold text-ink">내 접수 조회</h2>
            <p className="mt-1 text-[12px] text-faint">접수할 때 적은 이름과 연락처가 모두 맞아야 조회돼요.</p>
            <form onSubmit={doLookup} className="mt-3 space-y-2">
              <input className={`${inputCls} h-11`} placeholder="접수한 이름" value={lookup.name} onChange={setLk('name')} maxLength={20} autoComplete="name" aria-label="접수한 이름" />
              <div className="flex gap-2">
                <input className={`${inputCls} h-11`} placeholder="접수한 연락처" value={lookup.phone} onChange={setLk('phone')} inputMode="tel" autoComplete="tel" aria-label="접수한 연락처" />
                <Btn type="submit" variant="outline" size="sm" className="h-11 shrink-0"><IcSearch size={14} /> 조회</Btn>
              </div>
            </form>
            {mine !== null && (
              mine.length === 0 ? (
                <p className="mt-3 text-[12.5px] text-faint">이 이름·연락처로 접수된 건이 없어요.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line-card">
                  {mine.map((p) => (
                    <li key={p.id} className="py-3">
                      <div className="flex items-center gap-1.5">
                        <MiniChip status={p.status} />
                        <span className="truncate text-[13.5px] font-bold text-ink">{maskTitle(p.title)}</span>
                      </div>
                      <div className="mt-1 text-[11.5px] text-faint">{p.tags?.[0] && `${p.tags[0]} · `}{fmtDateTime(p.createdAt)}</div>
                      {p.answer ? (
                        <p className="mt-1.5 flex items-start gap-1 text-[12px] leading-4 text-primary-text"><IcCheck size={12} className="mt-0.5 shrink-0" /><span><b>담당자가 답변했어요</b> — 답변 전문은 접수하신 연락처로 문자 안내드려요</span></p>
                      ) : (
                        <p className="mt-1.5 flex items-center gap-1 text-[12px] text-muted"><IcPhone size={11} /> 담당자가 확인 후 연락드려요</p>
                      )}
                    </li>
                  ))}
                </ul>
              )
            )}
          </section>
        </div>
      </div>
    </main>
  )
}

export default function Board() {
  const { board } = useParams()
  const meta = boardByKey(board)
  if (!meta) {
    return (
      <main className="mx-auto max-w-4xl px-5 pb-16 sm:px-10">
        <div className="pt-6"><BoardTabs current={null} /></div>
        <section className="mt-6 rounded-section bg-white p-5 shadow-card">
          <EmptyState icon={IcAlert} text="없는 게시판이에요" sub="주소를 다시 확인해 주세요" />
          <div className="flex justify-center pb-2">
            <Link to="/board/notice" className="text-[13.5px] font-bold text-primary-text hover:underline">공지사항으로 가기 →</Link>
          </div>
        </section>
      </main>
    )
  }
  return meta.private ? <ComplaintBoard meta={meta} /> : <PublicBoard meta={meta} />
}
