// ─── C-05 / AI-04 AI 생활비 진단기 — 1분 문답 → 절감 추정 → 상담 유도 ──
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { diagnose, buildDiagnosisPlan, diagnosisNarrative } from '../../lib/ai'
import { useStore } from '../../lib/store'
import { won, downloadText, monthKey } from '../../lib/engine'
import { catBySlug, LEGAL } from '../../lib/constants'
import { Btn, Card, useCountUp, useToast } from '../../components/ui'
import { AiInsight } from '../../components/AiPanel'

const QUESTIONS = [
  { key: 'telecom', q: '한 달 휴대폰 요금은 얼마쯤인가요?', opts: [{ l: '5만원 미만', v: 40000 }, { l: '5~8만원', v: 65000 }, { l: '8만원 이상', v: 95000 }] },
  { key: 'internet', q: '집 인터넷은 어떤 상태인가요?', opts: [{ l: '약정 만기 지남 / 3년 이상', v: 'old' }, { l: '쓰는 중인데 결합은 안 했어요', v: 'no-bundle' }, { l: '최근에 결합까지 완료', v: 'ok' }] },
  { key: 'rentalCount', q: '렌탈 중인 제품이 몇 개인가요? (정수기·안마의자 등)', opts: [{ l: '없어요', v: 0 }, { l: '1개', v: 1 }, { l: '2개 이상', v: 2 }] },
  { key: 'insurance', q: '가족 전체 월 보험료는 얼마쯤인가요?', opts: [{ l: '15만원 미만', v: 100000 }, { l: '15~30만원', v: 200000 }, { l: '30만원 이상', v: 350000 }] },
  { key: 'moving', q: '6개월 안에 이사 계획이 있나요?', opts: [{ l: '네, 있어요', v: true }, { l: '아니요', v: false }] },
]

export default function Diagnosis() {
  const nav = useNavigate()
  const toast = useToast()
  const { dispatch } = useStore()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  // 공유 딥링크(?r=base64 답변) — 유효하면 문답 없이 결과부터 보여준다 (잘못된 값은 무시)
  useEffect(() => {
    try {
      const r = new URLSearchParams(window.location.search).get('r')
      if (!r) return
      const a = JSON.parse(atob(r))
      if (a && typeof a === 'object' && !Array.isArray(a)) { setAnswers(a); setResult(diagnose(a)) }
    } catch { /* noop */ }
  }, [])

  const pick = (key, v) => {
    const next = { ...answers, [key]: v }
    setAnswers(next)
    if (step < QUESTIONS.length - 1) setStep(step + 1)
    else {
      const r = diagnose(next)
      setResult(r)
      dispatch({ type: 'AI_EVENT', payload: { kind: 'diagnosis', q: JSON.stringify(next), source: 'engine', label: `월 ${r.total.toLocaleString()}원 절감 추정`, auto: true } })
    }
  }

  if (result) return <Result result={result} answers={answers} nav={nav} toast={toast} onRetry={() => { setStep(0); setAnswers({}); setResult(null) }} />

  const cur = QUESTIONS[step]
  return (
    <main className="mx-auto max-w-md px-5 pb-16">
      <div className="pt-8 text-center">
        <span className="rounded-full bg-tint px-3.5 py-1.5 text-[12px] font-bold text-primary-text">🤖 AI 생활비 진단</span>
        <h1 className="mt-4 text-[22px] font-extrabold leading-8 tracking-tight text-ink">1분이면 끝나요.<br />새는 생활비를 찾아드릴게요</h1>
      </div>

      {/* 진행 바 */}
      <div className="mt-7 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-card">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
        <span className="tnum text-[12px] font-bold text-faint">{step + 1}/{QUESTIONS.length}</span>
      </div>

      <Card className="mt-4 p-6 animate-rise" key={step}>
        <div className="text-[17px] font-extrabold leading-7 text-ink">{cur.q}</div>
        <div className="mt-5 flex flex-col gap-2.5">
          {cur.opts.map((o) => (
            <button
              key={o.l}
              onClick={() => pick(cur.key, o.v)}
              className="h-[52px] rounded-btn border border-line bg-white px-4 text-left text-[14.5px] font-semibold text-body transition-colors hover:border-primary hover:bg-tint hover:text-primary-text"
            >
              {o.l}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="tap text-[12.5px] font-semibold text-faint hover:text-label">← 이전 질문</button>
          ) : <span />}
          {/* 모르면 0점 처리하지 않고 '미평가'로 남긴다 (pickai na 원칙) */}
          <button onClick={() => pick(cur.key, undefined)} className="tap text-[12.5px] font-semibold text-faint underline underline-offset-2 hover:text-label">잘 모르겠어요 — 건너뛰기</button>
        </div>
      </Card>
    </main>
  )
}

function Result({ result, answers, nav, toast, onRetry }) {
  const monthly = useCountUp(result.total, 900)
  const share = async () => {
    // 답변을 링크에 실어 받는 사람도 같은 결과 화면을 바로 본다 (답변은 ASCII라 btoa 안전)
    const url = `${location.origin}/diagnosis?r=${encodeURIComponent(btoa(JSON.stringify(answers)))}`
    const text = `모두온 AI 진단 결과: 월 ${won(result.total)} · 연 ${won(result.yearly)} 절감 가능! ${url}`
    try { await navigator.clipboard.writeText(text); toast('결과 링크를 복사했어요') } catch { toast('복사에 실패했어요', 'err') }
  }
  return (
    <main className="mx-auto max-w-md px-5 pb-16">
      <div className="pt-8 text-center">
        <div className="text-[13px] font-bold text-primary-text">진단 완료!</div>
        <h1 className="mt-2 text-[20px] font-extrabold text-ink">지금 구조라면, 매달</h1>
        <div className="tnum mt-1 text-[44px] font-extrabold tracking-[-1.5px] text-primary-text">{won(monthly)}</div>
        <p className="text-[14px] text-muted">아낄 수 있어요 <span className="tnum font-bold text-orange-text">(연간 {won(result.yearly)})</span></p>
        <p className="mt-1.5 text-[12px] text-faint">같은 문답 기준 알뜰 순위 <strong className="tnum font-bold text-primary-text">상위 {result.pct}%</strong> <span className="text-disabled">(데모 표본)</span></p>
      </div>

      <Card className="mt-7 p-5">
        <div className="text-[13px] font-bold text-ink">절감 포인트 {result.items.length}가지</div>
        <div className="mt-3 flex flex-col gap-3.5">
          {result.items.length === 0 && (
            <p className="py-4 text-center text-[13.5px] text-muted">이미 아주 알뜰하게 쓰고 계세요! 👏<br />이사·신규 가입 시점에 다시 진단해 보세요.</p>
          )}
          {result.items.map((i) => (
            <div key={i.label} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-warm">
                <img src={catBySlug(i.cat)?.icon} alt="" className="h-full w-full object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[13.5px] font-semibold text-body">
                  {i.label}
                  {i.manual && <span className="rounded-full bg-tint px-1.5 py-0.5 text-[10px] font-bold text-primary-text">상담 확정</span>}
                </div>
                <div className="mt-0.5 text-[11.5px] leading-4 text-faint">{i.why}</div>
              </div>
              <span className="tnum shrink-0 text-[13.5px] font-extrabold text-ok">월 −{won(i.save)}</span>
            </div>
          ))}
        </div>
      </Card>

      {result.wins.length > 0 && (
        <Card className="mt-3 p-5">
          <div className="text-[13px] font-bold text-ink">잘 유지하고 있는 것 <span className="font-semibold text-faint">— 무너뜨리지 마세요</span></div>
          <ul className="mt-2 flex flex-col gap-1.5 text-[12.5px] leading-5 text-muted">
            {result.wins.map((w) => <li key={w}>✓ {w}</li>)}
          </ul>
        </Card>
      )}
      {result.pending.length > 0 && (
        <p className="mt-3 text-[12px] leading-5 text-faint">
          미평가 {result.pending.length}항목({result.pending.map((p) => p.label).join(' · ')})은 0점으로 치지 않고 상담에서 확인해요.
        </p>
      )}

      <AiInsight
        className="mt-4"
        consumer
        title="AI 심화 분석"
        desc="진단 결과를 바탕으로 무엇부터 잡을지, 숨은 절감 포인트까지 짚어드려요."
        cta="AI 심화 분석 받기"
        build={() => diagnosisNarrative(result)}
      />

      {/* 진단 컨텍스트를 상담 폼으로 — 카테고리 프리셀렉트 + 리드에 AI진단 라벨 부착 */}
      <Btn size="lg" className="mt-6 w-full shimmer-cta" onClick={() => nav('/consult', { state: { diagnosis: { total: result.total, cats: result.items.map((i) => i.cat), label: `AI진단 · 월 ${won(result.total)} 절감 여지` } } })}>이 결과로 무료 상담 받기</Btn>
      <Btn variant="outline" size="sm" className="mt-2.5 w-full" onClick={() => { downloadText(`모두온_절감실행서_${monthKey()}.md`, buildDiagnosisPlan(result)); toast('절감 실행서를 내려받았어요') }}>
        📄 절감 실행서 다운로드
      </Btn>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <Btn variant="outline" size="sm" onClick={share}>결과 공유하기</Btn>
        <Btn variant="outline" size="sm" onClick={onRetry}>다시 진단하기</Btn>
      </div>
      <p className="mt-4 text-center text-[11.5px] leading-4 text-disabled">추정치는 평균 사례 기반이며 실제 절감액과 다를 수 있어요. {LEGAL.quote}</p>
    </main>
  )
}
