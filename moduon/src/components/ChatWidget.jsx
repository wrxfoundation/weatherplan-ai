// ─── S-05 AI 상담봇 "모비" 플로팅 위젯 ───────────────────────────
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { askMobi, QUICK_REPLIES } from '../lib/ai'
import { useStore } from '../lib/store'
import { won } from '../lib/engine'
import { LEGAL } from '../lib/constants'

const HELLO = {
  role: 'assistant',
  text: '안녕하세요! 모두온 AI 상담사 모비예요 🙌\n인터넷·이사·정수기·휴대폰… 생활서비스 뭐든 물어보세요. 견적은 바로 계산해 드려요!',
}

export default function ChatWidget({ tenant }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([HELLO])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bodyRef = useRef(null)
  const nav = useNavigate()
  const loc = useLocation()
  const { dispatch } = useStore()

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, open, busy])

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
      {/* 플로팅 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="AI 상담"
        className={`glass-btn-cta fixed right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 sm:right-5 ${hasBottomBar ? 'bottom-[152px] lg:bottom-5' : 'bottom-5'}`}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {open ? <CloseIcon /> : <AiStarsIcon />}
      </button>

      {open && (
        <div className="fixed bottom-[86px] right-4 z-50 flex h-[min(560px,calc(100dvh-110px))] w-[calc(100vw-32px)] max-w-[380px] flex-col overflow-hidden rounded-section bg-white shadow-panel animate-rise">
          {/* 헤더 */}
          <div className="flex items-center gap-3 bg-primary px-4 py-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"><AiStarsIcon size={19} /></div>
            <div className="flex-1">
              <div className="text-[14px] font-extrabold text-white">AI 상담사 모비</div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/75">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-ok animate-live" /> 실시간 응답 · 평균 18초
              </div>
            </div>
            <button onClick={() => nav('/consult')} className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/25">
              상담원 연결
            </button>
          </div>

          {/* 메시지 */}
          <div ref={bodyRef} className="flex-1 overflow-y-auto bg-cream/60 px-3.5 py-4">
            {msgs.map((m, i) => (
              <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-[1.55] ${
                  m.role === 'user' ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md bg-white text-body shadow-card'
                }`}>
                  {renderText(m.text)}
                  {m.action?.type === 'quote' && <QuoteCard quote={m.action.quote} />}
                  {m.action && (
                    <button
                      onClick={() => { setOpen(false); nav(m.action.to) }}
                      className="mt-2.5 flex w-full items-center justify-center rounded-field bg-tint px-3 py-2.5 text-[13px] font-bold text-primary-text hover:bg-primary hover:text-white transition-colors"
                    >
                      {m.action.label} →
                    </button>
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
          <div className="border-t border-line-card bg-white px-3 pb-3 pt-2">
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
                className="h-11 flex-1 rounded-full border border-line bg-cream/60 px-4 text-[13.5px] placeholder:text-disabled focus:border-primary"
              />
              <button onClick={() => send()} disabled={busy} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40" aria-label="전송">
                <SendIcon />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10.5px] text-disabled">{LEGAL.quote}</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── AI 아이콘 — 별 2개(스파클) 모티프 ──────────────────────
function AiStarsIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {/* 큰 별 */}
      <path d="M14 3c.55 3.6 1.85 4.9 5.5 5.45C15.85 9 14.55 10.3 14 13.9c-.55-3.6-1.85-4.9-5.5-5.45C12.15 7.9 13.45 6.6 14 3Z" />
      {/* 작은 별 */}
      <path d="M7 13.5c.3 2 1 2.7 3 3-2 .3-2.7 1-3 3-.3-2-1-2.7-3-3 2-.3 2.7-1 3-3Z" />
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
