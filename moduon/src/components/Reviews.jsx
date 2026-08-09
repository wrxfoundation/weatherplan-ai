// ─── 실사용 후기·별점 소셜프루프 (아정당·다쏜다 흡수) ────────────
import { REVIEWS } from '../lib/constants'
import { maskName } from '../lib/engine'

function Stars({ n, size = 14 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`별점 ${n}점`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < n ? '#F79009' : '#F1ECE5'} stroke={i < n ? '#F79009' : '#E9E2D8'} strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
          <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 18.9l-5.8 3.05 1.1-6.45-4.7-4.6 6.5-.95z" />
        </svg>
      ))}
    </span>
  )
}

export default function Reviews({ cat, title = '먼저 바꾼 분들의 후기' }) {
  const filtered = cat ? REVIEWS.filter((r) => r.cat === cat) : REVIEWS
  const items = (filtered.length ? filtered : REVIEWS).slice(0, 6)
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1)

  return (
    <section className="mt-6 rounded-section bg-white p-5 shadow-card sm:p-9">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[20px] font-extrabold tracking-[-0.4px] text-ink sm:text-[24px]">{title}</h2>
        <div className="flex items-center gap-2">
          <Stars n={5} size={16} />
          <span className="tnum text-[15px] font-extrabold text-ink">{avg}</span>
          <span className="text-[12.5px] font-semibold text-faint">· 검증 후기 {REVIEWS.length.toLocaleString('ko-KR')}건</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r, i) => (
          <div key={i} className="glass-tile flex flex-col rounded-card p-5">
            <div className="flex items-center justify-between">
              <Stars n={r.rating} />
              <span className="rounded-full bg-orange-tint px-2.5 py-0.5 text-[11.5px] font-bold text-orange-text">{r.tag}</span>
            </div>
            <p className="mt-2.5 flex-1 text-[13.5px] leading-[22px] text-body">“{r.text}”</p>
            <div className="mt-3 border-t border-line-card pt-2.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="inline-flex shrink-0 items-center gap-1 font-bold text-ok">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
                  구매 확인
                </span>
                <span className="text-faint">{r.days}일 전</span>
              </div>
              <div className="mt-1 text-[12px] text-faint">{maskName(r.name)} · {r.region} · {r.cat}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
