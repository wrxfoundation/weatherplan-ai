import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader } from '@/components/Card'
import { Pill } from '@/components/Pill'
import { Icon } from '@/components/Icon'

// x402 결제 시연 (PRD §5.M3) — "요청 → 402 → RLUSD 결제 → 검증·반환" 상태머신.
// 데모 스크립트 재생 전용(테스트넷 실왕복은 라이브 전환 후). busy 락으로 연속 실행 시 상태 꼬임 방지.
type StepState = 'idle' | 'running' | 'done'

const STEPS = [
  { no: 1, title: 'API 요청', desc: 'GET /v1/weather/aggregate\n(인증·결제 없음)', icon: 'external' },
  { no: 2, title: '402 Payment Required', desc: '결제 조건 수신\n0.002 RLUSD · Tag 1001', icon: 'alert' },
  { no: 3, title: 'RLUSD 결제', desc: 'XRPL Payment 제출\n검증 대기', icon: 'coins' },
  { no: 4, title: '데이터 반환', desc: '200 OK\n집계 JSON 수신', icon: 'audit' },
] as const

// [단계 완료 인덱스(-1=단계 없음 로그), 지연 ms, 로그 라인]
const SCRIPT: [number, number, string][] = [
  [-1, 0, '$ x402-demo run --sku 1001 --currency RLUSD'],
  [-1, 350, '→ GET /v1/weather/aggregate?region=seoul&window=24h'],
  [0, 500, '← HTTP/1.1 402 Payment Required'],
  [-1, 350, '   x402: {"amount":"0.002","currency":"RLUSD","destination":"rDst...qP2e","tag":1001}'],
  [1, 500, '→ XRPL Payment 제출: 0.002 RLUSD → rDst...qP2e (DestinationTag=1001)'],
  [-1, 700, '   tx_hash: 7A3F19C2...8D21B4E0  |  ledger 94,512,911  |  validated ✓'],
  [2, 500, '→ GET /v1/weather/aggregate  (X-Payment-Proof: 7A3F...B4E0)'],
  [-1, 450, '← HTTP/1.1 200 OK  (payment verified, 0.9s)'],
  [-1, 400, '   {"region":"seoul","pm25_avg":18.4,"temp_avg":23.5,"stations":987,...}'],
  [3, 500, '✓ 완료 — 요청→결제→반환 왕복 성공 (총 4.2s, 수수료 0.000012 XRP)'],
]

export function X402Demo() {
  const [states, setStates] = useState<StepState[]>(['idle', 'idle', 'idle', 'idle'])
  const [logs, setLogs] = useState<string[]>(['x402 결제 시연 대기 중 — [시연 실행]을 누르세요.'])
  const [busy, setBusy] = useState(false)
  const timers = useRef<number[]>([])
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    // 로그 자동 스크롤 (DoD)
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [logs])

  const reset = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setStates(['idle', 'idle', 'idle', 'idle'])
    setLogs(['x402 결제 시연 대기 중 — [시연 실행]을 누르세요.'])
    setBusy(false)
  }

  const run = () => {
    if (busy) return
    setBusy(true)
    setStates(['running', 'idle', 'idle', 'idle'])
    setLogs([])
    let t = 200
    SCRIPT.forEach(([stepDone, delay, line], i) => {
      t += delay
      timers.current.push(window.setTimeout(() => {
        const ts = new Date(2026, 7, 13, 14, 32, 10 + i).toTimeString().slice(0, 8)
        setLogs(prev => [...prev, `[${ts}] ${line}`])
        if (stepDone >= 0) {
          setStates(prev => prev.map((s, idx) =>
            idx <= stepDone ? 'done' : idx === stepDone + 1 ? 'running' : s) as StepState[])
        }
        if (i === SCRIPT.length - 1) {
          setStates(['done', 'done', 'done', 'done'])
          setBusy(false)
        }
      }, t))
    })
  }

  return (
    <Card className="mt-4">
      <CardHeader
        title={<span className="inline-flex items-center gap-2">x402 결제 시연 <Pill tone="demo">무대 백업용</Pill></span>}
        formula={'요청 → 402 → RLUSD 결제 → 검증·반환\n데모 스크립트 재생 (테스트넷 실왕복은 라이브 전환 후)'}
        action={
          <span className="flex items-center gap-2">
            <button type="button" onClick={run} disabled={busy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-label font-semibold text-white transition-colors ${
                busy ? 'cursor-not-allowed bg-navy/50' : 'bg-navy hover:bg-navy-deep'}`}>
              {busy ? '실행 중…' : '▶ 시연 실행'}
            </button>
            <button type="button" onClick={reset}
              className="rounded-lg border border-line px-3.5 py-2 text-label font-medium text-body hover:border-navy/40 hover:text-navy transition-colors">
              초기화
            </button>
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-4 px-5 pb-5 xl:grid-cols-[1fr_1.2fr]">
        <div className="grid grid-cols-2 gap-3">
          {STEPS.map((s, i) => {
            const st = states[i]
            return (
              <div key={s.no} className={`rounded-lg border p-3.5 transition-colors ${
                st === 'done' ? 'border-ok/40 bg-ok-soft/50' : st === 'running' ? 'border-navy/50 bg-navy-tint' : 'border-line-soft'}`}>
                <div className="flex items-center justify-between">
                  <span className={`num grid h-6 w-6 place-items-center rounded-full text-tiny font-bold ${
                    st === 'done' ? 'bg-ok text-white' : st === 'running' ? 'bg-navy text-white' : 'bg-line-soft text-mute'}`}>
                    {st === 'done' ? '✓' : s.no}
                  </span>
                  {st === 'running' && <span className="h-3 w-3 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />}
                  {st === 'done' && <Pill tone="ok">완료</Pill>}
                  {st === 'idle' && <Pill tone="mute">대기</Pill>}
                </div>
                <div className="mt-2 text-label font-bold text-ink">{s.title}</div>
                <div className="mt-1 whitespace-pre-line text-tiny font-normal leading-relaxed text-mute">{s.desc}</div>
              </div>
            )
          })}
        </div>
        <div ref={termRef}
          className="num h-[218px] overflow-y-auto rounded-lg border border-[#1E2C4C] bg-[#0B1220] p-3.5 font-mono text-[12px] leading-[1.7] text-[#B9C4DA] scrollbar-thin">
          {logs.map((l, i) => (
            <div key={i} className={
              l.includes('✓ 완료') ? 'text-[#3FBF7F]' :
              l.includes('402') ? 'text-[#E0A63E]' :
              l.includes('200 OK') ? 'text-[#3FBF7F]' :
              l.startsWith('$') || l.includes('$ ') ? 'text-[#EAF0FA]' : ''
            }>{l}</div>
          ))}
          {busy && <span className="inline-block h-3.5 w-1.5 animate-pulse bg-[#B9C4DA]" />}
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-line px-6 py-3 text-meta text-mute">
        <Icon name="info" size={13} />
        상점 결제는 DestinationTag로 SKU를 구분합니다 — 1001 집계 API (0.002) · 1002 코호트 (0.05) · 1003 AI 리포트 (0.5 RLUSD)
      </div>
    </Card>
  )
}
