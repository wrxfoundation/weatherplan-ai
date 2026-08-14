import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { Pill } from '@/components/Pill'
import { knowledge, suggestions, fallback } from './wellbianKnowledge'

// wellbian AI — 우측 하단 플로팅 챗봇 (dcmap AiAssistant 포인트 흡수).
// 데모: 규칙 기반 응답(콘솔 수치와 정합). 라이브: EF 경유 Claude API로 교체 예정.
type Msg = {
  role: 'user' | 'ai'
  text: string
  link?: { label: string; to: string }
}

const HELLO: Msg = {
  role: 'ai',
  text: '안녕하세요, wellbian AI입니다. 온체인 콘솔의 수치·상태에 대해 물어보세요. 아래 추천 질문을 눌러도 됩니다.',
}

function answerFor(q: string): Msg {
  for (const k of knowledge) {
    if (k.match.test(q)) return { role: 'ai', text: k.answer, link: k.link }
  }
  return { role: 'ai', text: fallback }
}

export function WellbianChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([HELLO])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number>()

  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [msgs, typing, open])

  const ask = (q: string) => {
    const text = q.trim()
    if (!text || typing) return
    setMsgs(prev => [...prev, { role: 'user', text }])
    setInput('')
    setTyping(true)
    timer.current = window.setTimeout(() => {
      setMsgs(prev => [...prev, answerFor(text)])
      setTyping(false)
    }, 650)
  }

  return (
    <>
      {/* FAB */}
      <button type="button" onClick={() => setOpen(o => !o)} aria-label="wellbian AI 열기"
        className="fixed bottom-5 right-5 z-30 grid h-13 w-13 place-items-center rounded-full bg-navy p-3.5 text-white shadow-lg shadow-navy/30 transition-transform hover:scale-105">
        {open ? <span className="text-[17px] leading-none">✕</span> : <Icon name="chat" size={22} />}
        {!open && <span className="absolute -top-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-ok" />}
      </button>

      {open && (
        <div className="fixed bottom-[84px] right-5 z-30 flex max-h-[min(560px,calc(100vh-120px))] w-[min(380px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
          <div className="flex items-center gap-2.5 border-b border-line bg-navy px-4 py-3 text-white">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15"><Icon name="chat" size={16} /></span>
            <span className="flex-1 leading-tight">
              <span className="block text-label font-bold">wellbian AI</span>
              <span className="block text-tiny font-medium text-white/70">온체인 콘솔 어시스턴트</span>
            </span>
            <Pill tone="demo">DEMO</Pill>
          </div>

          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3 scrollbar-thin">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-label leading-relaxed ${
                  m.role === 'user' ? 'rounded-br-md bg-navy text-white' : 'rounded-bl-md border border-line-soft bg-bg/70 text-body'}`}>
                  {m.text}
                  {m.link && (
                    <Link to={m.link.to} onClick={() => setOpen(false)}
                      className="mt-1.5 flex items-center gap-1 text-label font-semibold text-navy hover:underline">
                      {m.link.label} <Icon name="chevronRight" size={12} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line-soft bg-bg/70 px-3.5 py-3">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-mute" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map(sug => (
                  <button key={sug} type="button" onClick={() => ask(sug)}
                    className="rounded-full border border-line px-3 py-1.5 text-meta font-medium text-body transition-colors hover:border-navy/50 hover:text-navy">
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form className="flex items-center gap-2 border-t border-line px-3 py-2.5"
            onSubmit={e => { e.preventDefault(); ask(input) }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="콘솔에 대해 물어보세요…"
              className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-label text-ink outline-none placeholder:text-mute focus:border-navy/50" />
            <button type="submit" disabled={!input.trim() || typing} aria-label="전송"
              className={`grid h-9 w-9 place-items-center rounded-lg text-white transition-colors ${
                input.trim() && !typing ? 'bg-navy hover:bg-navy-deep' : 'cursor-not-allowed bg-line'}`}>
              <Icon name="external" size={15} className="rotate-45" />
            </button>
          </form>
          <p className="border-t border-line-soft px-4 py-1.5 text-center text-tiny font-normal text-mute">
            데모 응답 · 라이브 전환 시 Claude 기반 실데이터 답변으로 교체됩니다
          </p>
        </div>
      )}
    </>
  )
}
