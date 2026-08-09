// ─── 설치 가능 지역 즉시조회 (아정당·다쏜다 흡수) ────────────────
// 주소(시·군·구)만 넣으면 통신사별 설치 가능 여부를 즉시 안내 — 상담 전 이탈을 막는 후킹 장치.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { installCheck } from '../lib/engine'
import { REGIONS, unitName } from '../lib/constants'

export default function InstallCheck({ onPrefill }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const run = (sigungu) => {
    const s = (sigungu ?? q).trim()
    if (!s) return
    setQ(s)
    setRes(installCheck(s))
  }
  const matches = q && !res ? REGIONS.filter((r) => r.sigungu.includes(q)).slice(0, 6) : []

  return (
    <section className="rounded-card bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint text-primary-text">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.6" />
          </svg>
        </span>
        <div>
          <div className="text-[15.5px] font-extrabold text-ink">우리 집, 어디까지 설치돼요?</div>
          <div className="mt-0.5 text-[12.5px] leading-5 text-muted">주소(시·군·구)만 넣으면 통신사별 설치 가능 여부를 바로 확인해요.</div>
        </div>
      </div>

      <div className="mt-3.5 flex gap-2">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setRes(null) }}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="예) 서울 강남구, 부산 해운대구"
          className="h-12 flex-1 rounded-field border border-line bg-white px-4 text-[16px] placeholder:text-disabled focus:border-primary sm:text-[15px]"
        />
        <button onClick={() => run()} className="glass-btn-cta h-12 shrink-0 rounded-field bg-primary px-5 text-[14px] font-bold text-white transition-colors hover:bg-primary-hover">
          조회
        </button>
      </div>

      {matches.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matches.map((m) => (
            <button key={m.sigungu} onClick={() => run(m.sigungu)} className="rounded-full border border-line bg-white px-3 py-1 text-[12.5px] font-semibold text-label transition-colors hover:border-primary hover:text-primary-text">
              {m.sigungu}
            </button>
          ))}
        </div>
      )}

      {res && (
        <div className={`mt-3.5 rounded-field border p-4 ${res.ok ? 'border-ok/30 bg-ok/[0.06]' : 'border-warn/30 bg-warn/[0.07]'}`}>
          <div className="flex items-center gap-2 text-[13.5px] font-extrabold">
            {res.ok
              ? <span className="text-ok">✓ {q} · {unitName(res.unit)} 설치 가능</span>
              : <span className="text-warn">상담 확인 필요</span>}
          </div>
          {res.ok && (
            <div className="mt-2.5 flex flex-col gap-1.5">
              {res.carriers.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-[13px]">
                  <span className="font-semibold text-body">{c.name}</span>
                  {c.ok
                    ? <span className="tnum font-bold text-ok">가능 · 최대 {c.max}</span>
                    : <span className="font-semibold text-disabled">해당 지역 제한</span>}
                </div>
              ))}
            </div>
          )}
          <div className="mt-2.5 text-[12px] leading-4 text-muted">{res.note}</div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => { onPrefill?.(res); nav('/calculator') }}
              className="glass-btn-cta h-10 flex-1 rounded-field bg-primary text-[13.5px] font-bold text-white transition-colors hover:bg-primary-hover"
            >
              이 지역 현금 사은품 계산하기
            </button>
            <button
              onClick={() => nav('/consult?cat=internet')}
              className="glass-btn h-10 flex-1 rounded-field border border-line bg-white text-[13.5px] font-bold text-label transition-colors hover:border-primary hover:text-primary-text"
            >
              상담사에게 확인
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
