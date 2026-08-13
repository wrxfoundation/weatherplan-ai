import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import { helpForPath } from '@/help/helpContent'

export function HelpDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation()
  const h = helpForPath(pathname)

  // 라우트 이동·ESC 시 닫기
  useEffect(() => { onClose() }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="도움말">
      <div className="absolute inset-0 bg-ink/25" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy-soft text-navy"><Icon name="help" size={16} /></span>
            <span>
              <span className="block text-tiny font-semibold tracking-wide text-mute">도움말</span>
              <span className="block text-h3 text-ink">{h.title}</span>
            </span>
          </span>
          <button type="button" onClick={onClose} aria-label="닫기"
            className="grid h-8 w-8 place-items-center rounded-lg text-mute hover:bg-line-soft hover:text-ink transition-colors">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          <section>
            <h3 className="text-label font-bold text-navy">이 화면은 무엇인가요?</h3>
            <p className="mt-1.5 text-label leading-relaxed text-body">{h.what}</p>
          </section>

          <section className="mt-5">
            <h3 className="text-label font-bold text-navy">핵심 지표 읽는 법</h3>
            <div className="mt-2 space-y-2.5">
              {h.points.map(p => (
                <div key={p.term} className="rounded-lg border border-line-soft bg-bg/60 px-3 py-2.5">
                  <div className="text-label font-semibold text-ink">{p.term}</div>
                  <div className="mt-0.5 text-meta leading-relaxed text-body">{p.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <h3 className="text-label font-bold text-navy">여기서 할 수 있는 일</h3>
            <ul className="mt-2 space-y-1.5">
              {h.actions.map(a => (
                <li key={a} className="flex gap-2 text-label text-body">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-navy" />{a}
                </li>
              ))}
            </ul>
          </section>

          {h.related && (
            <section className="mt-5">
              <h3 className="text-label font-bold text-navy">함께 보면 좋은 화면</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {h.related.map(r => (
                  <Link key={r.to} to={r.to}
                    className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-meta font-semibold text-body hover:border-navy/50 hover:text-navy transition-colors">
                    {r.label} <Icon name="chevronRight" size={11} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="mt-6 rounded-lg border border-line bg-navy-tint px-3.5 py-3 text-meta leading-relaxed text-body">
            숫자 위 <b className="font-semibold text-navy">ⓘ</b> 아이콘에 마우스를 올리면 그 숫자의 계산 산식이 표시됩니다.
          </div>
        </div>

        <div className="border-t border-line px-5 py-3.5">
          <Link to="/methodology" onClick={onClose}
            className="flex items-center justify-between text-label font-semibold text-navy hover:underline">
            전체 산식·방법론 문서 보기 <Icon name="chevronRight" size={14} />
          </Link>
        </div>
      </aside>
    </div>
  )
}
