// ─── 공용 UI 프리미티브 (디자인 핸드오프 토큰 준수) ──────────────
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { STATUS_COLOR } from '../lib/constants'

// 버튼 — 높이: 대 52 / 중 48 / 소 40 (모바일 히트타깃 44 유지)
export function Btn({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const v = {
    primary: 'bg-primary text-white hover:bg-primary-hover glass-btn-cta',
    solid: 'bg-primary text-white hover:bg-primary-hover glass-btn-cta',
    outline: 'bg-white text-body border border-line-soft hover:border-primary hover:text-primary-text glass-btn',
    boutline: 'bg-white text-bbody border border-bline hover:border-primary hover:text-primary-text glass-btn',
    white: 'bg-white text-primary-text hover:-translate-y-px glass-btn',
    dark: 'bg-bink text-white hover:opacity-90 glass-btn',
    ghost: 'text-label hover:text-primary-text',
    danger: 'bg-danger/10 text-danger hover:bg-danger/20 glass-btn',
    ok: 'bg-ok/10 text-ok hover:bg-ok/20 glass-btn',
  }[variant]
  const s = { lg: 'h-[52px] px-7 text-[16px]', md: 'h-12 px-6 text-[15px]', sm: 'h-10 px-4 text-[14px]', xs: 'h-8 px-3 text-[13px]' }[size]
  return (
    <button className={`inline-flex items-center justify-center gap-1.5 rounded-btn font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none ${v} ${s} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function Card({ className = '', hover = false, track = 'a', children, ...rest }) {
  const base = track === 'a' ? 'bg-white rounded-card shadow-card' : 'bg-white rounded-card shadow-bcard'
  return (
    <div className={`${base} ${hover ? 'transition-all duration-200 hover:-translate-y-[3px] hover:shadow-panel' : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

// 리드 상태 칩 — 각 색 10% 배경 + 본색 텍스트
export function StatusChip({ status, className = '' }) {
  const c = STATUS_COLOR[status] ?? '#8C93A5'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${className}`} style={{ color: c, backgroundColor: c + '1A' }}>
      {status}
    </span>
  )
}

export function Chip({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-btn inline-flex h-10 items-center rounded-full border px-4 text-[14px] font-semibold transition-colors ${
        active ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary hover:text-primary-text'
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function DeltaChip({ value, suffix = '', good = true }) {
  const up = value >= 0
  const color = up === good ? 'text-ok bg-ok/10' : 'text-danger bg-danger/10'
  return (
    <span className={`tnum inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-bold ${color}`}>
      {up ? '▲' : '▼'} {Math.abs(value)}{suffix}
    </span>
  )
}

// KPI 숫자 카운트업 600ms
export function useCountUp(target, duration = 600) {
  const [v, setV] = useState(0)
  const started = useRef(false)
  useEffect(() => {
    // 모션 축소 선호 시 애니메이션 생략, 목표값 즉시 표시 (SSR 안전 가드)
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    if (started.current && v === target) return
    started.current = true
    const from = 0
    const t0 = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return v
}

export function KpiCard({ label, value, format = (n) => n.toLocaleString('ko-KR'), suffix = '', delta, deltaSuffix = '%', caption, accent, spark, track = 'b' }) {
  const n = useCountUp(typeof value === 'number' ? value : 0)
  const str = typeof value === 'number' ? String(format(value)) : String(value)
  // 모바일 반폭 카드에서 긴 금액이 줄바꿈·클리핑되지 않도록 자릿수 기준 폰트 축소 (금액 줄바꿈 금지 규칙 유지)
  const sizeCls = str.length > 12 ? 'text-[16px] sm:text-[24px]' : str.length > 9 ? 'text-[19px] sm:text-[26px]' : 'text-[22px] sm:text-[26px]'
  return (
    <Card track={track} className="p-4 sm:p-5 animate-rise">
      <div className="flex items-center justify-between gap-2">
        <div className={`text-[12px] font-medium sm:text-[13px] ${track === 'b' ? 'text-bmuted' : 'text-muted'}`}>{label}</div>
        {delta !== undefined && <DeltaChip value={delta} suffix={deltaSuffix} />}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className={`tnum whitespace-nowrap font-extrabold leading-8 tracking-tight sm:leading-9 ${sizeCls} ${accent ?? (track === 'b' ? 'text-bink' : 'text-ink')}`}>
          {typeof value === 'number' ? format(n) : value}
          {suffix && <span className="ml-0.5 text-[13px] font-bold sm:text-[15px]">{suffix}</span>}
        </div>
        {spark && <span className="hidden sm:block">{spark}</span>}
      </div>
      {caption && <div className={`mt-1.5 text-[11px] sm:text-[12px] ${track === 'b' ? 'text-bfaint' : 'text-faint'}`}>{caption}</div>}
    </Card>
  )
}

export function LiveDot({ className = '' }) {
  return <span className={`inline-block h-2 w-2 rounded-full bg-ok animate-live ${className}`} />
}

export function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-label">
        {label} {required && <em className="not-italic text-primary-text">*</em>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-faint">{hint}</span>}
    </label>
  )
}

// 모바일 입력은 16px — iOS 사파리 포커스 자동 확대 방지
export const inputCls = 'h-12 w-full rounded-field border border-line bg-white px-4 text-[16px] sm:text-[15px] text-ink placeholder:text-disabled focus:border-primary transition-colors'
export const binputCls = 'h-11 sm:h-10 w-full rounded-field border border-bline bg-white px-3 text-[16px] sm:text-[14px] text-bink placeholder:text-bfaint focus:border-primary transition-colors'

// ─── 다이얼로그 공통 훅 — 포커스 이동/복원 + 바디 스크롤 잠금 + Esc 닫기 + 경량 포커스 트랩 ───
// 중첩(드로어 위 모달) 시 최상단 다이얼로그만 Esc/Tab을 처리하도록 스택 관리. open일 때만 동작.
const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
const dialogStack = []
function useDialog(open, onClose) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogStack.push(ref)
    ref.current?.focus()
    const onKey = (e) => {
      if (dialogStack[dialogStack.length - 1] !== ref) return // 최상단 다이얼로그만 반응
      if (e.key === 'Escape') { closeRef.current?.(); return }
      if (e.key !== 'Tab' || !ref.current) return
      const els = ref.current.querySelectorAll(FOCUSABLE)
      if (!els.length) return
      const first = els[0], last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      dialogStack.splice(dialogStack.indexOf(ref), 1)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [open])
  return ref
}

export function Modal({ open, onClose, title, children, wide = false }) {
  const ref = useDialog(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bink/40 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`safe-b max-h-[88dvh] w-full overflow-y-auto rounded-t-section bg-white p-6 shadow-panel animate-rise sm:max-h-[92dvh] sm:rounded-section ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[17px] font-extrabold text-ink">{title}</h3>
            <button onClick={onClose} aria-label="닫기" className="text-[20px] leading-none text-faint hover:text-ink">×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children }) {
  const ref = useDialog(open, onClose)
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-bink/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      {/* 닫힘 상태로도 마운트되므로 다이얼로그 속성은 open일 때만 부여 */}
      <aside
        ref={ref}
        {...(open ? { role: 'dialog', 'aria-modal': 'true', 'aria-label': title, tabIndex: -1 } : {})}
        className={`absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white shadow-panel transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-bline bg-white px-5 py-4">
          <h3 className="text-[16px] font-extrabold text-bink">{title}</h3>
          <button onClick={onClose} aria-label="닫기" className="text-[22px] leading-none text-bfaint hover:text-bink">×</button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  )
}

export function EmptyState({ icon = '📭', text, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-[32px]">{icon}</div>
      <div className="mt-2 text-[14px] font-semibold text-bbody">{text}</div>
      {sub && <div className="mt-1 text-[12px] text-bfaint">{sub}</div>}
    </div>
  )
}

// ─── 토스트 ─────────────────────────────────────────
const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = (msg, type = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-6 left-1/2 z-[70] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} className={`animate-rise rounded-full px-5 py-3 text-[14px] font-semibold text-white shadow-panel ${t.type === 'err' ? 'bg-danger' : 'bg-bink'}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

// 모두온 로고 — 오렌지 ₩ 원형 뱃지 + 워드마크
export function Logo({ size = 'md', dark = false, name = '모두온' }) {
  // 확대(+30% → +15% → +10%)
  const s = size === 'lg' ? 'text-[36px]' : size === 'sm' ? 'text-[28px]' : 'text-[32px]'
  const mark = size === 'lg' ? 'h-[50px] w-[50px]' : size === 'sm' ? 'h-[40px] w-[40px]' : 'h-[44px] w-[44px]'
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <img src="/assets/logo-mark.png" alt="" aria-hidden className={`${mark} shrink-0 object-contain`} />
      <span className={`font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink'} ${s}`}>{name}</span>
    </span>
  )
}

// 진행 스텝 (마법사·랜딩 절차)
export function Steps({ items, current }) {
  return (
    <div className="flex items-center gap-2">
      {items.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${i < current ? 'bg-ok text-white' : i === current ? 'bg-primary text-white' : 'bg-tint text-primary-text'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`hidden text-[13px] font-semibold sm:block ${i === current ? 'text-ink' : 'text-faint'}`}>{label}</span>
          {i < items.length - 1 && <div className="h-px w-6 bg-line" />}
        </div>
      ))}
    </div>
  )
}
