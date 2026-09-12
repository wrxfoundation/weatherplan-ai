// ─── 실사용 후기·별점 소셜프루프 (아정당·다쏜다 흡수) ────────────
// 데이터 원천은 db.posts(board 'review' · 공개) — 후기 게시판(/board/review)과 같은 행을 본다.
// 시드가 constants.REVIEWS 에서 파생되므로 초기 화면은 이전과 같고, 게시판에 새 후기가 오르면 여기도 함께 갱신된다.
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { maskName, timeAgo } from '../lib/engine'

// 별점 — 후기 게시판 목록·상세·작성 폼이 함께 쓴다(단일 소스)
export function Stars({ n, size = 14, ...rest }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`별점 ${n}점`} {...rest}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < n ? '#F79009' : '#F1ECE5'} stroke={i < n ? '#F79009' : '#E9E2D8'} strokeWidth="1.4" strokeLinejoin="round" aria-hidden>
          <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 18.9l-5.8 3.05 1.1-6.45-4.7-4.6 6.5-.95z" />
        </svg>
      ))}
    </span>
  )
}

// 평균 별점을 소수점까지 정직하게 — 회색 별 위에 채운 별을 avg 비율만큼 클리핑
function AvgStars({ avg, size = 16 }) {
  return (
    <span className="relative inline-flex" role="img" aria-label={`평균 별점 ${avg}점`}>
      <Stars n={0} size={size} aria-hidden />
      <span aria-hidden className="absolute inset-y-0 left-0" style={{ width: `${(avg / 5) * 100}%`, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <Stars n={5} size={size} />
      </span>
    </span>
  )
}

export default function Reviews({ cat, title = '먼저 바꾼 분들의 후기' }) {
  const { db } = useStore()
  // 공개 후기만 최신순 — 어드민이 숨긴 글은 소셜프루프에서도 빠진다
  const all = db.posts
    .filter((p) => p.board === 'review' && p.status === '공개')
    .sort((a, b) => b.createdAt - a.createdAt)
  const filtered = cat ? all.filter((r) => r.cat === cat) : all
  const noCatMatch = !!cat && filtered.length === 0 // 카테고리 후기 없음 → 전체 폴백을 정직하게 표기
  const items = (filtered.length ? filtered : all).slice(0, 6)
  const avg = all.length ? (all.reduce((s, r) => s + (r.rating ?? 0), 0) / all.length).toFixed(1) : '0.0'

  return (
    <section className="mt-6 rounded-section bg-white p-5 shadow-card sm:p-9">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[20px] font-extrabold tracking-[-0.4px] text-ink sm:text-[24px]">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <AvgStars avg={avg} size={16} />
          <span className="tnum text-[15px] font-extrabold text-ink">{avg}</span>
          <span className="text-[12.5px] font-semibold text-faint">· 검증 후기 {all.length.toLocaleString('ko-KR')}건</span>
          <span className="mx-1 hidden h-3 w-px bg-line sm:block" aria-hidden />
          <Link to="/board/review/new" className="glass-btn inline-flex h-8 items-center rounded-full border border-line bg-white px-3 text-[12.5px] font-bold text-label transition-colors hover:border-primary hover:text-primary-text">후기 쓰기</Link>
          <Link to="/board/review" className="inline-flex h-8 items-center text-[13px] font-bold text-primary-text hover:underline">후기 더보기 →</Link>
        </div>
      </div>

      {noCatMatch && <p className="mt-6 text-[12.5px] font-medium text-faint">이 카테고리 후기는 준비 중이에요 — 전체 후기를 보여드려요</p>}

      {items.length === 0 ? (
        <p className="mt-6 text-[13.5px] text-faint">아직 후기가 없어요 — <Link to="/board/review/new" className="font-bold text-primary-text hover:underline">첫 후기</Link>를 남겨주세요.</p>
      ) : (
        <div className={`${noCatMatch ? 'mt-3' : 'mt-6'} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
          {items.map((r) => (
            <Link key={r.id} to={`/board/review/${r.id}`} className="glass-tile flex flex-col rounded-card p-5">
              <div className="flex items-center justify-between">
                <Stars n={r.rating ?? 0} />
                {r.tags?.[0] && <span className="rounded-full bg-orange-tint px-2.5 py-0.5 text-[11.5px] font-bold text-orange-text">{r.tags[0]}</span>}
              </div>
              <p className="mt-2.5 flex-1 text-[13.5px] leading-[22px] text-body">“{r.body}”</p>
              <div className="mt-3 border-t border-line-card pt-2.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="inline-flex shrink-0 items-center gap-1 font-bold text-ok">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
                    구매 확인
                  </span>
                  <span className="text-faint">{timeAgo(r.createdAt)}</span>
                </div>
                <div className="mt-1 text-[12px] text-faint">{maskName(r.author)}{r.region && ` · ${r.region}`}{r.cat && ` · ${r.cat}`}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
