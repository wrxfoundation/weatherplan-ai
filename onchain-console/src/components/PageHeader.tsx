import { ReactNode } from 'react'
import { Icon } from './Icon'

export function PageHeader({ title, subtitle, actions, meta }: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-h1 text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-base text-mute">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-end gap-2">
        {meta}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function UpdatedMeta({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-meta text-mute">
      {text}
      <button type="button" className="text-mute hover:text-navy transition-colors" aria-label="새로고침">
        <Icon name="refresh" size={13} />
      </button>
    </span>
  )
}

export function DownloadButton() {
  return (
    <button type="button"
      className="inline-flex items-center gap-2 rounded-lg bg-navy px-3.5 py-2 text-label font-semibold text-white hover:bg-navy-deep transition-colors">
      <Icon name="download" size={14} />
      리포트 다운로드
      <Icon name="chevronDown" size={13} className="opacity-80" />
    </button>
  )
}
