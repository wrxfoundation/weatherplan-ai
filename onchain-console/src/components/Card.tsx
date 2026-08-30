import { ReactNode } from 'react'
import { FormulaTip } from './FormulaTip'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-card border border-line bg-panel shadow-card ${className}`}>
      {children}
    </section>
  )
}

export function CardHeader({ title, badge, formula, action, className = '' }: {
  title: ReactNode
  badge?: ReactNode
  formula?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center justify-between gap-3 px-5 pt-4 pb-3 ${className}`}>
      <h2 className="flex items-center gap-2 text-h2 text-ink">
        {title}
        {formula && <FormulaTip formula={formula} />}
        {badge}
      </h2>
      {action}
    </div>
  )
}

export function GhostButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <button type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-label font-medium text-body hover:border-navy/40 hover:text-navy transition-colors ${className}`}>
      {children}
    </button>
  )
}

export function PrimaryButton({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <button type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-label font-semibold text-white hover:bg-navy-deep transition-colors ${className}`}>
      {children}
    </button>
  )
}

export function FooterLinkButton({ children }: { children: ReactNode }) {
  return (
    <button type="button"
      className="w-full rounded-lg border border-line px-3 py-2 text-label font-medium text-body hover:border-navy/40 hover:text-navy transition-colors">
      {children}
    </button>
  )
}
