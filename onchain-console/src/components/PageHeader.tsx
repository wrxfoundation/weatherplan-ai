import { ReactNode, useEffect, useState } from 'react'
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
        <h1 className="flex items-center gap-2 text-h1 text-ink">
          {title}
          <button type="button" aria-label="이 화면 도움말" title="이 화면 도움말"
            onClick={() => window.dispatchEvent(new Event('kw:open-help'))}
            className="grid h-6 w-6 place-items-center rounded-full border border-line text-mute hover:border-navy/50 hover:text-navy transition-colors">
            <Icon name="help" size={13} />
          </button>
        </h1>
        {subtitle && <p className="mt-1 text-base text-mute">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-end gap-2">
        {meta}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

// 데모 라이브 틱 — 새로고침 없이도 "n분 전"이 실시간으로 흐른다
export function UpdatedMeta({ text }: { text?: string }) {
  const [min, setMin] = useState(2)
  useEffect(() => {
    const t = setInterval(() => setMin(m => m + 1), 60_000)
    return () => clearInterval(t)
  }, [])
  void text
  return (
    <span className="flex items-center gap-1.5 text-meta text-mute">
      최근 업데이트 {min === 0 ? '방금 전' : `${min}분 전`}
      <button type="button" onClick={() => setMin(0)} className="text-mute hover:text-navy transition-colors" aria-label="새로고침">
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
