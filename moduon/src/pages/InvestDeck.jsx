// ─── /ir/deck — MODU ON 사업 소개 (비공개 하위 페이지) ──────────────
// 첨부 문서(구독경제 프레임·BEST 근거·리워드·상품 구조)를 주 콘텐츠로 구성.
// 외부 노출 금지: 어떤 메뉴·푸터에도 링크하지 않으며, robots noindex를 건다.
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const BIZ_POINTS = [
  { n: 1, t: '인건비 1원도 나가지 않는 AI 비서', d: '똑똑한 나의 비서 AI모비 컨설턴트가 고객들의 니즈를 파악하고 상담해줍니다.' },
  { n: 2, t: '본사가 직접 키우는 설계 역량', d: '통신·렌탈을 정확한 지식으로 설계하는 사람이 드뭅니다. MODU ON은 사업자분들이 직접 설계할 수 있도록 본사에서 직접 교육해 드립니다.' },
  { n: 3, t: '유통구조 축소 = 더 큰 혜택', d: '중간 단계를 줄여 절감된 만큼을 사업자님들께 더 큰 혜택으로 돌려드립니다.' },
  { n: 4, t: '고가 플랫폼을 나만의 플랫폼으로', d: '직접 만들면 고가인 플랫폼을 나만의 브랜드 분양몰로 만들어 드립니다.' },
]

const CONSUMER_POINTS = [
  { n: 1, t: '전화 부담 없는 AI 상담', d: '영업사원과 통화를 꺼리는 소비자도 똑똑한 AI모비 컨설턴트를 통해 부담 없이 상담받습니다.' },
  { n: 2, t: '통신·렌탈 원스톱', d: '다양한 통신 및 렌탈 서비스를 한 곳에서 간편하고 편리하게 받을 수 있습니다.' },
  { n: 3, t: '친구 추천 적립', d: '친구에게 플랫폼을 추천하면 100원을 적립해 드립니다.', tag: '1만원부터 사용 가능' },
  { n: 4, t: '광고 시청 적립', d: 'MODU ON 플랫폼 광고만 봐도 100원씩 적립해 드립니다.', tag: '1일 최대 6번 · 4시간마다 시청 가능' },
]

const PLANS = [
  {
    name: 'AI스마트 총판지사', price: '월 16.5만원', hot: true,
    feats: ['권역별로 지사를 둡니다', '본사 교육', '본사로 들어오는 DB 제공', '개인 분양몰 제공', '유료 AI모비 무료 사용', '판매 권한 부여', '소개비 발생', '관리수수료 발생'],
  },
  {
    name: 'AI스마트 대리점', price: '월 11만원',
    feats: ['개인 분양몰 제공', '유료 AI모비 무료 사용', '총판지사 부재 시 본사에서 교육', '판매 권한 부여', '소개비 발생', '관리수수료 발생'],
  },
  {
    name: '셀러', price: '대리점 소속',
    feats: ['대리점 분양몰 사용', '판매 권한 부여'],
  },
]

// ∞ + 전원(⏻) 결합 로고 — 원본 로고 파일 수급 전 SVG 근사 재현
function ModuonMark({ size = 150 }) {
  return (
    <svg width={size} height={size * 0.56} viewBox="0 0 250 140" fill="none" aria-hidden>
      <defs>
        <linearGradient id="modugrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1558D6" />
          <stop offset="0.55" stopColor="#1B8BEA" />
          <stop offset="1" stopColor="#1FC8F5" />
        </linearGradient>
      </defs>
      {/* 왼쪽 루프 */}
      <path d="M118 70 C96 38 44 36 40 70 C36 104 96 104 118 70 Z" stroke="url(#modugrad)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" />
      {/* 오른쪽 루프 — 상단이 열린 전원 심볼 */}
      <path d="M132 70 C150 44 186 38 202 54 M202 88 C188 104 152 100 132 70 M202 54 C212 63 213 78 202 88" stroke="url(#modugrad)" strokeWidth="20" strokeLinecap="round" />
      {/* 전원 바 */}
      <rect x="186" y="18" width="20" height="42" rx="10" fill="url(#modugrad)" />
    </svg>
  )
}

export default function InvestDeck() {
  // 외부 노출 방지 — 검색엔진 색인 금지 메타를 이 페이지에서만 주입
  useEffect(() => {
    const m = document.createElement('meta')
    m.name = 'robots'
    m.content = 'noindex, nofollow'
    document.head.appendChild(m)
    return () => { document.head.removeChild(m) }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 — 내부 자료 표시 */}
      <header className="sticky top-0 z-40 border-b border-line-card/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <ModuonMark size={64} />
            <span className="text-[17px] font-black tracking-tight text-ink">MODU <span className="text-[#1B8BEA]">ON</span></span>
          </div>
          <span className="rounded-full bg-bink px-2.5 py-1 text-[10.5px] font-bold text-white">내부 검토용</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-16">
        {/* ── 1. 구독경제 프레임 ── */}
        <section className="pt-12 text-center">
          <h1 className="text-[26px] font-extrabold leading-[1.35] tracking-[-0.8px] text-ink sm:text-[34px]">
            구독경제시대에 걸맞는<br />생활밀착형 <span className="text-[#1B8BEA]">MODU ON</span> 플랫폼
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[14.5px] leading-[25px] text-muted">
            <strong className="font-bold text-ink underline decoration-2 underline-offset-4">구독경제는 매달 일정한 금액을 내고 필요한 물건이나 서비스를 주기적으로 받는 경제 활동입니다.</strong> 소유보다
            경험을 중시하는 소비 트렌드와 고물가 속 합리적 소비 성향이 맞물려, 국내 시장 규모는 <strong className="font-bold text-ink">100조 원대</strong>로 빠르게 성장하고 있습니다.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-cream px-6 py-3">
            <span className="text-[18px] font-black text-ink sm:text-[22px]">구독경제 = <span className="text-[#1B8BEA]">통신 및 렌탈서비스</span></span>
          </div>
          {/* 언론 보도 인용 — 원문 헤드라인 텍스트 */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <blockquote className="rounded-card border border-line bg-cream/60 p-5 text-left">
              <p className="text-[15px] font-extrabold leading-6 text-ink">"구독경제 전성시대, 10명 중 9명 이용 경험" …생활밀착형 수요 ↑</p>
              <footer className="mt-2 text-[11.5px] text-faint">— 경제·산업 언론 보도</footer>
            </blockquote>
            <blockquote className="rounded-card border border-line bg-cream/60 p-5 text-left">
              <p className="text-[15px] font-extrabold leading-6 text-ink">"구독경제 전성시대, 가전도 구독 서비스가 된다?"</p>
              <footer className="mt-2 text-[11.5px] text-faint">— 입고, 먹고, 쓰는 모든 것을 구독하는 시대</footer>
            </blockquote>
          </div>
        </section>

        {/* ── 2. 왜 BEST — 사업자 기준 ── */}
        <section className="mt-14">
          <h2 className="text-center text-[22px] font-extrabold leading-8 tracking-[-0.6px] text-ink sm:text-[26px]">
            통신 및 렌탈서비스 플랫폼 중에<br />MODU ON 플랫폼이 왜 <span className="text-[#1B8BEA]">BEST</span>일까?
          </h2>
          <div className="mt-7">
            <div className="mb-3 inline-flex items-center rounded-full bg-bink px-3.5 py-1.5 text-[12.5px] font-bold text-white">사업자 기준</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {BIZ_POINTS.map((p) => (
                <div key={p.n} className="rounded-card border border-line p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B8BEA] text-[13px] font-extrabold text-white">{p.n}</span>
                    <span className="text-[15px] font-bold text-ink">{p.t}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-[21px] text-muted">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-7">
            <div className="mb-3 inline-flex items-center rounded-full bg-[#1B8BEA] px-3.5 py-1.5 text-[12.5px] font-bold text-white">소비자 기준</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {CONSUMER_POINTS.map((p) => (
                <div key={p.n} className="rounded-card border border-line p-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bink text-[13px] font-extrabold text-white">{p.n}</span>
                    <span className="text-[15px] font-bold text-ink">{p.t}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-[21px] text-muted">{p.d}</p>
                  {p.tag && <span className="mt-2 inline-block rounded-full bg-orange-tint px-2.5 py-1 text-[11px] font-bold text-orange-text">{p.tag}</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. 브랜드 ── */}
        <section className="mt-16 rounded-section bg-cream/70 px-6 py-12 text-center">
          <h2 className="text-[20px] font-extrabold tracking-[-0.5px] text-ink sm:text-[24px]">생활밀착형 MODU ON 플랫폼</h2>
          <div className="mt-6 flex justify-center"><ModuonMark size={230} /></div>
          <div className="mt-4 text-[26px] font-black tracking-tight text-ink">MODU <span className="text-[#1B8BEA]">ON</span></div>
          <div className="mt-1 text-[11.5px] font-bold tracking-[0.35em] text-muted">CONNECT · ALL · LIFE</div>
        </section>

        {/* ── 4. 상품 구조 ── */}
        <section className="mt-14">
          <h2 className="text-center text-[22px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">파트너 상품 구조</h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {PLANS.map((pl) => (
              <div key={pl.name} className={`rounded-card border p-6 ${pl.hot ? 'border-[2px] border-[#1B8BEA] shadow-panel' : 'border-line'}`}>
                {pl.hot && <span className="mb-2 inline-block rounded-full bg-[#1B8BEA] px-2.5 py-1 text-[10.5px] font-bold text-white">권역 대표</span>}
                <div className="text-[16px] font-extrabold text-ink">{pl.name}</div>
                <div className={`tnum mt-1 text-[24px] font-extrabold tracking-[-0.5px] ${pl.hot ? 'text-[#1B8BEA]' : 'text-ink'}`}>{pl.price}</div>
                <ul className="mt-4 flex flex-col gap-2">
                  {pl.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] leading-5 text-body">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={pl.hot ? '#1B8BEA' : '#8B93A7'} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><path d="m4.5 12.5 5 5 10-11" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[11.5px] leading-4 text-faint">소개비·관리수수료 등 세부 조건은 계약서 기준이며, 표기 금액은 부가세 별도 기준일 수 있습니다.</p>
        </section>

        {/* ── 하단 ── */}
        <section className="mt-14 rounded-section bg-bink px-6 py-9 text-center">
          <p className="text-[17px] font-extrabold leading-7 text-white">구독경제 100조 시대 —<br className="sm:hidden" /> 통신·렌탈의 다음 유통은 MODU ON입니다.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/ir" className="glass-btn inline-flex h-11 items-center rounded-btn bg-white px-6 text-[13.5px] font-bold text-bink hover:-translate-y-px">플랫폼 IR 페이지</Link>
            <Link to="/" className="glass-btn inline-flex h-11 items-center rounded-btn bg-white/15 px-6 text-[13.5px] font-bold text-white ring-1 ring-white/30 hover:bg-white/25">라이브 데모</Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-5 pb-10">
        <div className="border-t border-line-card pt-4 text-center text-[11px] leading-4 text-disabled">
          본 자료는 내부 검토용으로 무단 배포를 금합니다. 적립·수수료 등 세부 정책은 확정 전 변경될 수 있습니다. © 2026 MODU ON.
        </div>
      </footer>
    </div>
  )
}
