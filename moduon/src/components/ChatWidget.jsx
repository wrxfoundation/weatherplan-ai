// ─── S-05 AI 상담봇 "모비" 플로팅 위젯 ───────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { askMobi, QUICK_REPLIES } from '../lib/ai'
import { useStore } from '../lib/store'
import { won } from '../lib/engine'
import { LEGAL } from '../lib/constants'
import { IcThumbUp, IcThumbDown } from './icons'

const HELLO = {
  role: 'assistant',
  text: '안녕하세요! 모두온 AI 상담사 모비예요 🙌\n인터넷·이사·정수기·휴대폰… 생활서비스 뭐든 물어보세요. 견적은 바로 계산해 드려요!',
}

const CHAT_KEY = 'moduon_chat_v1'
const NUDGE_KEY = 'moduon_chat_nudge_v1'

export default function ChatWidget({ tenant }) {
  const [open, setOpen] = useState(false)
  // 응답 피드백(플라이휠) — 메시지 인덱스별 helpful 기록. AI 응답·라벨은 AiOps 개선 재료.
  const [fb, setFb] = useState({})
  // 선제 넛지 — 세션당 1회, 6초 유휴 후 노출 (챗을 연 적 없을 때만)
  const [nudge, setNudge] = useState(false)
  // 세션 내 대화 유지 — sessionStorage 미러 (파싱 실패 시 인사말로 초기화)
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(sessionStorage.getItem(CHAT_KEY)) ?? [HELLO] } catch { return [HELLO] } })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bodyRef = useRef(null)
  const nav = useNavigate()
  const loc = useLocation()
  const { dispatch } = useStore()

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, open, busy])

  useEffect(() => {
    try { sessionStorage.setItem(CHAT_KEY, JSON.stringify(msgs)) } catch { /* 저장 불가 환경 무시 */ }
  }, [msgs])

  // 열려 있을 때 Esc로 닫기
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // 선제 넛지 — 6초 유휴 후 1회 (이미 봤거나 챗을 연 적 있으면 생략)
  useEffect(() => {
    try { if (sessionStorage.getItem(NUDGE_KEY)) return } catch { /* noop */ }
    const t = setTimeout(() => { if (!open) setNudge(true) }, 6000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line
  const dismissNudge = () => {
    setNudge(false)
    try { sessionStorage.setItem(NUDGE_KEY, '1') } catch { /* noop */ }
  }

  // 응답 피드백 — 저장 + AI 이벤트(라벨은 직전 사용자 질문). 재클릭으로 정정 가능.
  const feedback = (i, helpful) => {
    setFb((f) => ({ ...f, [i]: helpful }))
    const lastQ = [...msgs.slice(0, i)].reverse().find((m) => m.role === 'user')?.text ?? ''
    dispatch({ type: 'AI_EVENT', payload: { kind: 'feedback', helpful, q: lastQ.slice(0, 60), source: msgs[i]?.source ?? 'local', auto: true } })
  }

  // 파트너몰에서 열렸으면 상담 이동 경로에 src 슬러그를 붙여 리드 귀속 유지
  const withSrc = (to) => (tenant && to.startsWith('/consult') ? to + (to.includes('?') ? '&' : '?') + 'src=' + tenant.slug : to)

  async function send(text) {
    const t = (text ?? input).trim()
    if (!t || busy) return
    setInput('')
    const history = [...msgs, { role: 'user', text: t }]
    setMsgs(history)
    setBusy(true)
    const reply = await askMobi(history, { page: loc.pathname, tenant: tenant?.name })
    dispatch({ type: 'AI_EVENT', payload: { kind: 'chat', q: t, source: reply.source, auto: !reply.text.includes('상담사가 확인') } })
    setMsgs((m) => [...m, { role: 'assistant', text: reply.text, action: reply.action, source: reply.source }])
    setBusy(false)
  }

  // 계산기 화면은 모바일 하단 고정 합계 바가 있어 FAB를 그 위로 올린다
  const hasBottomBar = loc.pathname.startsWith('/calculator')

  return (
    <>
      {/* 선제 넛지 — 세션 1회, 클릭 시 챗 오픈 */}
      {nudge && !open && (
        <div className={`fixed right-4 z-50 flex items-center gap-2 rounded-2xl rounded-br-md border border-line-card bg-white py-2.5 pl-4 pr-2 shadow-panel animate-rise sm:right-5 ${hasBottomBar ? 'bottom-[218px] lg:bottom-[86px]' : 'bottom-[86px]'}`}>
          <button onClick={() => { dismissNudge(); setOpen(true) }} className="text-left text-[12.5px] font-bold text-ink">
            인터넷 견적, 30초면 계산해드려요 <span className="text-primary-text">→</span>
          </button>
          <button onClick={dismissNudge} aria-label="닫기" className="flex h-6 w-6 items-center justify-center rounded-full text-[13px] text-faint hover:bg-cream">×</button>
        </div>
      )}

      {/* 플로팅 버튼 — 볼륨 글라스 */}
      <button
        onClick={() => { dismissNudge(); setOpen(!open) }}
        aria-label="AI 상담"
        aria-expanded={open}
        className={`glass-fab fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white transition-transform hover:scale-105 sm:right-5 ${hasBottomBar ? 'bottom-[152px] lg:bottom-5' : 'bottom-5'}`}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'radial-gradient(58% 42% at 34% 24%, rgba(255,255,255,0.62), rgba(255,255,255,0) 62%)' }} />
        <span className="relative z-10 flex">{open ? <CloseIcon /> : <AiStarsIcon />}</span>
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="AI 상담사 모비" className="fixed bottom-[86px] right-4 z-50 flex h-[min(560px,calc(100dvh-110px))] w-[calc(100vw-32px)] max-w-[380px] flex-col overflow-hidden rounded-section border border-[rgba(44,56,120,0.32)] bg-white/72 shadow-panel backdrop-blur-2xl animate-rise">
          {/* 헤더 */}
          <div className="flex items-center gap-3 bg-primary/90 px-4 py-3.5 backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-sm"><AiStarsIcon size={23} /></div>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-white">AI 상담사 모비</div>
              <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2 py-0.5 text-[11px] text-white/85 ring-1 ring-white/15">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-ok animate-live" /> 실시간 응답 · 평균 18초
              </div>
            </div>
            <button onClick={() => nav(tenant ? `/consult?src=${tenant.slug}` : '/consult')} className="rounded-full bg-white/18 px-3 py-1.5 text-[11px] font-bold text-white ring-1 ring-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-sm hover:bg-white/28">
              상담원 연결
            </button>
          </div>

          {/* 메시지 */}
          <div ref={bodyRef} aria-live="polite" className="flex-1 overflow-y-auto bg-white/25 px-3.5 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-[1.55] ${
                  m.role === 'user' ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-white text-body shadow-card'
                }`}>
                  {renderText(m.text)}
                  {m.action?.type === 'quote' && <QuoteCard quote={m.action.quote} />}
                  {m.action && (
                    <button
                      onClick={() => { setOpen(false); nav(withSrc(m.action.to)) }}
                      className="mt-2.5 flex w-full items-center justify-center rounded-field bg-tint px-3 py-2.5 text-[13px] font-bold text-primary-text hover:bg-primary hover:text-white transition-colors"
                    >
                      {m.action.label} →
                    </button>
                  )}
                  {/* 응답 피드백 — 라벨과 함께 저장돼 프롬프트·정책 개선에 재사용 (플라이휠) */}
                  {m.role === 'assistant' && i > 0 && (
                    <div className="mt-2 flex items-center gap-1 border-t border-line-card/70 pt-1.5">
                      {fb[i] === undefined ? (
                        <>
                          <span className="mr-0.5 text-[10.5px] text-faint">도움이 됐나요?</span>
                          <button onClick={() => feedback(i, true)} aria-label="도움이 됐어요" className="flex h-6 w-6 items-center justify-center rounded-full text-faint hover:bg-tint hover:text-primary-text"><IcThumbUp size={12} /></button>
                          <button onClick={() => feedback(i, false)} aria-label="아쉬워요" className="flex h-6 w-6 items-center justify-center rounded-full text-faint hover:bg-cream hover:text-orange-text"><IcThumbDown size={12} /></button>
                        </>
                      ) : (
                        <span className="text-[10.5px] font-semibold text-faint">{fb[i] ? '도움이 됐다니 기뻐요! 🙌' : '더 나은 답변으로 개선할게요.'}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-card">
                  <span className="inline-flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint" style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 퀵리플라이 + 입력 */}
          <div className="border-t border-white/55 bg-white/45 px-3 pb-3 pt-2 backdrop-blur-md">
            <div className="scrollbar-none mb-2 flex gap-1.5 overflow-x-auto">
              {QUICK_REPLIES.map((q) => (
                <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-label hover:border-primary hover:text-primary-text">
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="궁금한 서비스를 물어보세요"
                className="h-11 flex-1 rounded-full border border-white/70 bg-white/70 px-4 text-[13.5px] placeholder:text-disabled focus:border-primary"
              />
              <button onClick={() => send()} disabled={busy} className="glass-btn-cta flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40" aria-label="전송">
                <SendIcon />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10.5px] text-label">{LEGAL.quote}</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── AI 아이콘 — 별 2개(스파클) 모티프 (크게) ────────────────
function AiStarsIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {/* 큰 별 — 아이콘을 크게 채움 */}
      <path d="M13.5 1c.85 5.8 2.9 7.85 8.7 8.7-5.8.85-7.85 2.9-8.7 8.7-.85-5.8-2.9-7.85-8.7-8.7C10.6 8.85 12.65 6.8 13.5 1Z" />
      {/* 작은 별 */}
      <path d="M6 15.2c.45 2.85 1.45 3.85 4.3 4.3-2.85.45-3.85 1.45-4.3 4.3-.45-2.85-1.45-3.85-4.3-4.3 2.85-.45 3.85-1.45 4.3-4.3Z" />
    </svg>
  )
}
function CloseIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
function SendIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  )
}

function renderText(text) {
  // **강조** 만 지원하는 초경량 렌더
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') ? <strong key={i} className="font-extrabold">{part.slice(2, -2)}</strong> : part,
  )
}

function QuoteCard({ quote }) {
  return (
    <div className="mt-2.5 rounded-field border border-tint bg-tint/50 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-semibold text-label">월 납부금</span>
        <span className="tnum text-[18px] font-extrabold text-primary-text">{won(quote.total)}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-[12px] font-semibold text-label">사은품 혜택</span>
        <span className="tnum text-[13px] font-bold text-orange-text">{won(quote.gift)}</span>
      </div>
      <div className="mt-1 text-[11px] text-faint">약정 3년 · 설치비 무료</div>
    </div>
  )
}
