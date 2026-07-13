import { useRef, useState } from 'react'
import { callAiStream, usageLabel, aiReasonLabel } from '../data/aiApi.js'
import { recommendSites, recoReasons } from '../score/recommend.js'
import { useMagnetic } from '../ui/useMagnetic.js'
import AiText from './AiText.jsx'

/* 플로팅 AI 어시스턴트 — 자연어 입지 검색(search) + 인프라 Q&A(qa) 통합.
 * 정직성: 검색은 실제 추천 후보 목록만 넘겨 랭킹시키고(없는 곳 창작 금지), Q&A는 모르면 모른다고. */
const SUGGEST = {
  search: ['비수도권에 40MW 지을 만한 곳', '냉각 유리하고 변전소 가까운 후보', '계통 승인율 높은 지역'],
  qa: ['전력계통영향평가가 뭐야?', '40MW 넘으면 왜 154kV야?', 'AIDC 특별법 핵심은?'],
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('search') // 'search' | 'qa'
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [thread, setThread] = useState([]) // {role:'user'|'ai', text} | {role:'ai', error}
  const bodyRef = useRef(null)
  const fabRef = useRef(null)
  useMagnetic(fabRef, 0.22)

  const scrollDown = () =>
    requestAnimationFrame(() => {
      if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    })

  const ask = async (q) => {
    const query = (q ?? input).trim()
    if (!query || busy) return
    setInput('')
    setThread((t) => [...t, { role: 'user', text: query }])
    setBusy(true)
    // 스트리밍 델타 → 항상 마지막(진행 중) AI 메시지를 갱신(busy 가드로 동시 요청 없음)
    const onDelta = (partial) => {
      setThread((t) => {
        const nt = t.slice()
        const last = nt[nt.length - 1]
        const msg = { role: 'ai', text: partial, streaming: true }
        if (last && last.role === 'ai' && last.streaming) nt[nt.length - 1] = msg
        else nt.push(msg)
        return nt
      })
      scrollDown()
    }
    let res
    if (mode === 'search') {
      // 실제 추천 후보 풀만 전달(창작 방지). 토큰 절약 위해 핵심 필드만.
      const cands = recommendSites(50).map((s) => ({
        name: s.name,
        sido: s.sido,
        pct: s.pct,
        입지: s.nonCapital ? '비수도권' : '수도권',
        변전소km: s.subKm,
        계통여유MW: s.gridMw,
        승인율pct: s.gridApproval,
        기후: s.climateLabel,
        근거: recoReasons(s).slice(0, 3).join(' · '),
      }))
      res = await callAiStream('search', { query, data: cands }, onDelta)
    } else {
      res = await callAiStream('qa', { query }, onDelta)
    }
    setBusy(false)
    setThread((t) => {
      const nt = t.slice()
      const final =
        res?.available && res.text
          ? { role: 'ai', text: res.text, usage: res.usage }
          : { role: 'ai', error: res?.reason || 'error' }
      const last = nt[nt.length - 1]
      if (last && last.role === 'ai' && last.streaming) nt[nt.length - 1] = final
      else nt.push(final)
      return nt
    })
    scrollDown()
  }

  const switchMode = (m) => {
    setMode(m)
    setThread([])
  }

  return (
    <div className={`ai-fab ${open ? 'open' : ''}`}>
      {open && (
        <div
          className="ai-asst"
          role="dialog"
          aria-modal="true"
          aria-label="AI 어시스턴트"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
        >
          <div className="ai-asst-head">
            <div className="ai-asst-tabs">
              <button type="button" className={mode === 'search' ? 'on' : ''} onClick={() => switchMode('search')}>
                입지 검색
              </button>
              <button type="button" className={mode === 'qa' ? 'on' : ''} onClick={() => switchMode('qa')}>
                Q&amp;A
              </button>
            </div>
            <button type="button" className="ai-asst-x" onClick={() => setOpen(false)} aria-label="닫기">
              ✕
            </button>
          </div>
          <div className="ai-asst-body" ref={bodyRef}>
            {thread.length === 0 && (
              <div className="ai-asst-empty">
                <p>{mode === 'search' ? '자연어로 후보 입지를 찾아드려요. 실제 추천 후보 안에서만 골라 정직하게 설명합니다.' : '데이터센터 인프라·전력 인허가·입지 질문에 답해드려요.'}</p>
                <div className="ai-sugs">
                  {SUGGEST[mode].map((s) => (
                    <button key={s} type="button" className="ai-sug" onClick={() => ask(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {thread.map((m, i) =>
              m.role === 'user' ? (
                <div className="ai-msg user" key={i}>
                  {m.text}
                </div>
              ) : m.error ? (
                <div className="ai-msg ai err" key={i}>
                  {aiReasonLabel(m.error)}
                </div>
              ) : (
                <div className="ai-msg ai" key={i}>
                  <AiText text={m.text} />
                  {m.streaming && <span className="ai-cursor" aria-hidden />}
                  {!m.streaming && m.usage && <div className="ai-usage">{usageLabel(m.usage)}</div>}
                </div>
              ),
            )}
            {busy && !(thread[thread.length - 1]?.role === 'ai' && thread[thread.length - 1]?.streaming) && (
              <div className="ai-msg ai">
                <span className="sp-spinner" aria-hidden /> 생각 중…
              </div>
            )}
          </div>
          <form
            className="ai-asst-input"
            onSubmit={(e) => {
              e.preventDefault()
              ask()
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'search' ? '예: 비수도권 40MW 후보' : '예: 계통영향평가가 뭐야?'}
              aria-label="AI에게 묻기"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="보내기">
              ↑
            </button>
          </form>
          <div className="ai-asst-foot">공개 데이터 기반 · 없는 값은 만들지 않음</div>
        </div>
      )}
      <button ref={fabRef} type="button" className="ai-fab-btn magnetic" onClick={() => setOpen((v) => !v)} aria-expanded={open} title="AI 어시스턴트">
        {open ? '✕' : '✨ AI'}
      </button>
    </div>
  )
}
