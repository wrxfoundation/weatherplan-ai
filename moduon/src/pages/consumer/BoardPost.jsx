// ─── 게시글 — 작성(/board/:board/new) · 상세(/board/:board/:id) ────────────────
// 작성은 POST_CREATE 로 posts 에 쌓고, 상세는 POST_VIEW 를 세션당 1회만 올린다(StrictMode 이중 호출 방지).
// 불편접수는 private — 작성·상세 모두 /board/complaint(접수 폼)로 보낸다. 연락처는 화면에 내보내지 않는다.
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { boardByKey, VISIBLE_CATEGORIES } from '../../lib/constants'
import { maskName, phoneValid, fmtDate, fmtDateTime } from '../../lib/engine'
import { Btn, EmptyState, Field, inputCls, useToast } from '../../components/ui'
import { IcAlert, IcRobot, IcCalendar, IcCheck, IcClock, IcMap, IcMegaphone } from '../../components/icons'
import { Stars } from '../../components/Reviews'

// Board.jsx 와 같은 규칙 — 숨김 글은 상세·이전/다음에서도 뺀다
const HIDDEN = ['숨김', '비공개']
const publicPosts = (posts, board) =>
  posts
    .filter((p) => p.board === board && !HIDDEN.includes(p.status))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.createdAt - a.createdAt)
const VIEWED_KEY = 'moduon_viewed'
const textareaCls = 'min-h-[180px] w-full rounded-field border border-line bg-white p-4 text-[16px] text-ink placeholder:text-disabled transition-colors focus:border-primary sm:text-[15px]'
// id 를 여기서 만들어 payload 로 넘긴다 — 리듀서가 `...p` 로 덮어쓰므로 등록 직후 상세로 바로 이동할 수 있다
const newId = () => `P${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const CHIP_TONE = { 접수: 'bg-tint text-primary-text', 답변완료: 'bg-ok/10 text-ok', 진행중: 'bg-ok/10 text-ok', 종료: 'bg-brow text-bmuted' }
function MiniChip({ status }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap ${CHIP_TONE[status] ?? 'bg-brow text-bmuted'}`}>{status}</span>
}

// ── 작성 폼 — 보드별 필수 항목이 다르다(qna 연락처 · review 별점/카테고리/태그 · tip 자유 태그) ──
function PostForm({ meta }) {
  const { dispatch } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const board = meta.key
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [rating, setRating] = useState(5)
  const [cat, setCat] = useState(VISIBLE_CATEGORIES[0]?.name ?? '')
  const [region, setRegion] = useState('')
  const [tag, setTag] = useState('')
  const [tags, setTags] = useState('')

  if (!meta.write) {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-16 sm:px-10">
        <section className="mt-6 rounded-section bg-white p-5 shadow-card">
          <EmptyState icon={IcMegaphone} text="이 게시판은 직접 글을 쓸 수 없어요" sub="이벤트·공지사항은 모두온이 올려요" />
          <div className="flex justify-center pb-2"><Link to={`/board/${board}`} className="text-[13.5px] font-bold text-primary-text hover:underline">{meta.name} 목록으로 →</Link></div>
        </section>
      </main>
    )
  }

  // 비활성 버튼 대신, 누르면 비어 있는 첫 항목을 짚어준다
  const firstMissing = () => {
    if (title.trim().length < 2) return '제목을 입력해 주세요'
    if (body.trim().length < 5) return '내용을 5자 이상 입력해 주세요'
    if (name.trim().length < 2) return '이름을 입력해 주세요'
    if (board === 'qna' && !phoneValid(phone)) return '연락처를 010-0000-0000 형식으로 입력해 주세요'
    if (board === 'review' && !cat) return '카테고리를 선택해 주세요'
    if (board === 'review' && !tag.trim()) return '한 줄 혜택 태그를 입력해 주세요 (예: 현금 35만원)'
    return null
  }
  const submit = (e) => {
    e.preventDefault()
    const missing = firstMissing()
    if (missing) { toast(missing, 'err'); return }
    const id = newId()
    const payload = { id, board, title: title.trim(), body: body.trim(), author: name.trim(), tags: [] }
    if (board === 'qna') payload.phone = phone.trim()
    if (board === 'review') {
      Object.assign(payload, { rating, cat, tags: [tag.trim()] })
      if (region.trim()) payload.region = region.trim()
    }
    if (board === 'tip') payload.tags = [...new Set(tags.split(/[,\s#]+/).map((s) => s.trim()).filter(Boolean))].slice(0, 5)
    dispatch({ type: 'POST_CREATE', payload })
    toast(board === 'qna' ? '질문이 등록됐어요. 담당자가 답변드릴게요' : '등록됐어요')
    nav(`/board/${board}/${id}`, { replace: true })
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 sm:px-10">
      <div className="pt-6 text-[12.5px] font-semibold text-faint"><Link to={`/board/${board}`} className="hover:text-primary-text">{meta.name}</Link> › 글쓰기</div>
      <form data-t="post-form" onSubmit={submit} className="mt-3 rounded-section bg-white p-5 shadow-card sm:p-8">
        <h1 className="text-[22px] font-extrabold tracking-[-0.4px] text-ink">{meta.name} 글쓰기</h1>
        <p className="mt-1 text-[13px] text-muted">{meta.desc}</p>

        <div className="mt-5 space-y-4">
          {board === 'review' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-label">별점 <em className="not-italic text-primary-text">*</em></span>
                <div className="flex items-center gap-1" role="radiogroup" aria-label="별점">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}점`} onClick={() => setRating(n)} className={`text-[28px] leading-none transition-transform hover:scale-110 ${n <= rating ? 'text-warn' : 'text-line'}`}>★</button>
                  ))}
                  <span className="tnum ml-2 text-[14px] font-bold text-ink">{rating}.0</span>
                </div>
              </div>
              <Field label="카테고리" required>
                <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
                  {VISIBLE_CATEGORIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
            </div>
          )}
          <Field label="제목" required>
            <input className={inputCls} placeholder={board === 'qna' ? '예) 현금 사은품은 언제 입금되나요?' : board === 'review' ? '예) 현금 35만원 받고 1기가로 바꿨어요' : '예) 인터넷 약정 만기 3개월 전에 꼭 할 일'} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
          </Field>
          <Field label="내용" required>
            <textarea className={textareaCls} placeholder="내용을 입력해 주세요" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
          </Field>
          {board === 'review' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="한 줄 혜택 태그" required hint="카드에 배지로 보여요">
                <input className={inputCls} placeholder="예) 현금 35만원" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={16} />
              </Field>
              <Field label="지역" hint="시·군·구까지만 적어주세요">
                <input className={inputCls} placeholder="예) 서울 강남구" value={region} onChange={(e) => setRegion(e.target.value)} maxLength={20} />
              </Field>
            </div>
          )}
          {board === 'tip' && (
            <Field label="태그" hint="쉼표나 띄어쓰기로 구분 · 최대 5개">
              <input className={inputCls} placeholder="예) 인터넷, 약정" value={tags} onChange={(e) => setTags(e.target.value)} maxLength={60} />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="이름" required hint="화면에는 가운데를 가려서 보여요">
              <input className={inputCls} placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} autoComplete="name" />
            </Field>
            {board === 'qna' && (
              <Field label="연락처" required hint="답변 알림 용도로만 쓰이고 화면에 공개되지 않아요">
                <input className={inputCls} placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />
              </Field>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to={`/board/${board}`} className="glass-btn inline-flex h-12 items-center justify-center rounded-btn border border-line-soft bg-white px-6 text-[15px] font-bold text-body hover:border-primary hover:text-primary-text">취소</Link>
          <Btn type="submit">등록하기</Btn>
        </div>
      </form>
    </main>
  )
}

// ── 상세 — 제목·메타·본문·태그·답변·이전/다음 ──
function PostDetail({ meta, id }) {
  const { db, dispatch } = useStore()
  const board = meta.key
  const post = db.posts.find((p) => p.id === id && p.board === board)
  const visible = !!post && !HIDDEN.includes(post.status)
  const list = useMemo(() => publicPosts(db.posts, board), [db.posts, board])
  const idx = list.findIndex((p) => p.id === id)
  const prev = idx > 0 ? list[idx - 1] : null
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null

  // 조회수 — 세션 내 같은 id 는 한 번만. StrictMode 가 effect 를 두 번 돌려도 sessionStorage 가 두 번째를 막는다.
  useEffect(() => {
    if (!visible) return
    let viewed = []
    try { viewed = JSON.parse(sessionStorage.getItem(VIEWED_KEY) ?? '[]') } catch { viewed = [] }
    if (!Array.isArray(viewed)) viewed = []
    if (viewed.includes(id)) return
    try { sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...viewed, id].slice(-200))) } catch { /* noop */ }
    dispatch({ type: 'POST_VIEW', id })
  }, [id, visible, dispatch])

  if (!visible) {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-16 sm:px-10">
        <section className="mt-6 rounded-section bg-white p-5 shadow-card">
          <EmptyState icon={IcAlert} text="글을 찾을 수 없어요" sub="삭제되었거나 주소가 잘못됐어요" />
          <div className="flex justify-center pb-2"><Link to={`/board/${board}`} className="text-[13.5px] font-bold text-primary-text hover:underline">{meta.name} 목록으로 →</Link></div>
        </section>
      </main>
    )
  }

  const askMobi = () => window.dispatchEvent(new CustomEvent('moduon:chat-open', { detail: { seed: post.title } }))

  return (
    <main className="mx-auto max-w-3xl px-5 pb-16 sm:px-10">
      <div className="pt-6 text-[12.5px] font-semibold text-faint"><Link to={`/board/${board}`} className="hover:text-primary-text">{meta.name}</Link> › 상세</div>

      <article data-t="post-detail" className="mt-3 rounded-section bg-white p-5 shadow-card sm:p-8">
        <div className="flex flex-wrap items-center gap-1.5">
          {post.pinned && <span className="rounded-md bg-orange-tint px-1.5 py-0.5 text-[10.5px] font-extrabold text-orange-text">고정</span>}
          {(board === 'qna' || board === 'event') && <MiniChip status={post.status} />}
          {board === 'review' && post.cat && <span className="rounded-full bg-tint px-2 py-0.5 text-[11px] font-bold text-primary-text">{post.cat}</span>}
          {board === 'review' && post.tags?.[0] && <span className="rounded-full bg-orange-tint px-2 py-0.5 text-[11px] font-bold text-orange-text">{post.tags[0]}</span>}
        </div>
        <h1 className="mt-2 text-[20px] font-extrabold leading-[30px] tracking-[-0.4px] text-ink sm:text-[24px] sm:leading-[34px]">{post.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-faint">
          <span className="font-semibold text-label">{maskName(post.author)}</span>
          <span>·</span>
          <span>{fmtDateTime(post.createdAt)}</span>
          <span>·</span>
          <span className="tnum">조회 {(post.views ?? 0).toLocaleString('ko-KR')}</span>
          {board === 'review' && post.region && (<><span>·</span><span className="inline-flex items-center gap-0.5"><IcMap size={11} /> {post.region}</span></>)}
        </div>

        {board === 'review' && (
          <div className="mt-3 flex items-center gap-2">
            <Stars n={post.rating ?? 0} size={16} />
            <span className="tnum text-[14px] font-extrabold text-ink">{post.rating ?? 0}.0</span>
          </div>
        )}
        {board === 'event' && post.period && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-tint px-3 py-1 text-[12.5px] font-bold text-primary-text">
            <IcCalendar size={12} /> 기간 {fmtDate(post.period.from)} ~ {fmtDate(post.period.to)}
          </div>
        )}

        <div className="mt-5 whitespace-pre-line text-[15px] leading-[26px] text-body">{post.body}</div>

        {board !== 'review' && post.tags?.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {post.tags.map((t) => <span key={t} className="rounded-full bg-cream px-2.5 py-1 text-[12px] font-bold text-label">#{t}</span>)}
          </div>
        )}

        {post.answer ? (
          <div data-t="post-answer" className="mt-6 rounded-card border border-tint bg-tint/60 p-4 sm:p-5">
            <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-primary-text"><IcCheck size={14} /> 담당자 답변</div>
            <div className="mt-2 whitespace-pre-line text-[14px] leading-[24px] text-body">{post.answer.body}</div>
            <div className="mt-2 text-[12px] text-faint">{post.answer.by} · {fmtDateTime(post.answer.at)}</div>
          </div>
        ) : board === 'qna' ? (
          <div data-t="post-answer-pending" className="mt-6 rounded-card border border-dashed border-line p-4 sm:p-5">
            <div className="flex items-center gap-1.5 text-[13px] font-extrabold text-label"><IcClock size={14} /> 담당자가 확인 중이에요</div>
            <p className="mt-1 text-[13px] leading-5 text-muted">보통 영업일 기준 1일 안에 답변드려요. 급하시면 모비에게 지금 바로 물어보세요.</p>
            <Btn size="sm" className="mt-3" onClick={askMobi}><IcRobot size={15} /> 모비에게 바로 물어보기</Btn>
          </div>
        ) : null}
      </article>

      {/* 이전/다음 글 — 목록과 같은 순서(고정 우선 최신순) */}
      <nav aria-label="이전/다음 글" className="mt-4 divide-y divide-line-card rounded-card bg-white shadow-card">
        {[{ k: '이전 글', p: prev }, { k: '다음 글', p: next }].map(({ k, p }) => (
          <div key={k} className="flex items-center gap-3 px-4 py-3 text-[13.5px]">
            <span className="w-12 shrink-0 text-[12px] font-bold text-faint">{k}</span>
            {p ? <Link to={`/board/${board}/${p.id}`} className="truncate font-semibold text-ink hover:text-primary-text">{p.title}</Link> : <span className="text-faint">{k}이 없어요</span>}
          </div>
        ))}
      </nav>

      <div className="mt-4 flex items-center justify-between">
        <Link to={`/board/${board}`} className="glass-btn inline-flex h-10 items-center rounded-btn border border-line-soft bg-white px-4 text-[13.5px] font-bold text-body hover:border-primary hover:text-primary-text">목록으로</Link>
        {meta.write && <Link to={`/board/${board}/new`} className="glass-btn-cta inline-flex h-10 items-center rounded-btn bg-primary px-4 text-[13.5px] font-bold text-white hover:bg-primary-hover">글쓰기</Link>}
      </div>
    </main>
  )
}

export default function BoardPost() {
  const { board, id } = useParams()
  const meta = boardByKey(board)
  // /board/:board/new 는 정적 세그먼트라 :id 보다 먼저 매칭돼 id 가 비어 온다
  const isNew = id === undefined || id === 'new'
  if (!meta) {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-16 sm:px-10">
        <section className="mt-6 rounded-section bg-white p-5 shadow-card">
          <EmptyState icon={IcAlert} text="없는 게시판이에요" sub="주소를 다시 확인해 주세요" />
          <div className="flex justify-center pb-2"><Link to="/board/notice" className="text-[13.5px] font-bold text-primary-text hover:underline">공지사항으로 가기 →</Link></div>
        </section>
      </main>
    )
  }
  // 불편접수는 private — 폼은 목록 페이지에, 상세는 공개하지 않는다
  if (meta.private) return <Navigate to="/board/complaint" replace />
  return isNew ? <PostForm meta={meta} /> : <PostDetail meta={meta} id={id} />
}
