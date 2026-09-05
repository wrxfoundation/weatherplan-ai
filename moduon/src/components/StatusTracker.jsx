// ─── 신청 현황 트래킹 (아정당·다쏜다 흡수) ──────────────────────
// 신청→상담→설치·개통→현금지급 진행바. current: 0=접수 완료(기본).
import { Fragment } from 'react'

const STEPS = ['신청 접수', '전문 상담', '설치·개통', '현금 지급']

export default function StatusTracker({ current = 0 }) {
  return (
    <section className="mt-7 rounded-card bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-bold text-ink">신청 현황</div>
        <span className="inline-flex items-center gap-1 rounded-full bg-ok/10 px-2.5 py-0.5 text-[11.5px] font-bold text-ok">
          <span className="h-1.5 w-1.5 rounded-full bg-ok animate-live" /> 실시간 추적
        </span>
      </div>

      <div className="mt-4 flex items-center">
        {STEPS.map((s, i) => (
          <Fragment key={s}>
            <div className="flex w-[58px] shrink-0 flex-col items-center">
              <span className={`z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${i <= current ? 'bg-primary text-white' : 'bg-tint text-faint'}`}>
                {i < current ? '✓' : i + 1}
              </span>
              <span className={`mt-1.5 whitespace-nowrap text-center text-[11px] font-bold ${i <= current ? 'text-ink' : 'text-faint'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <span className={`-mt-4 h-0.5 flex-1 rounded ${i < current ? 'bg-primary' : 'bg-line'}`} />}
          </Fragment>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-field bg-tint px-3.5 py-2.5 text-[12px] font-semibold leading-4 text-primary-text">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0" aria-hidden>
          <path d="M4 5h16v12H8l-4 3z" /><path d="M8 9h8M8 13h5" />
        </svg>
        진행 상황은 문자로 실시간 안내 · 현금 사은품 예상 입금: <strong className="font-extrabold">개통 확인 후 영업일 7일 이내</strong>
      </div>
    </section>
  )
}
