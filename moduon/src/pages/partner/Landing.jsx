// ─── 분양 파트너 모집 랜딩 (목업 #3c) — "온라인 건물주 되기" ─────
// 분양비·이용료·수수료율은 어드민 정책값(db.policies)을 실시간 반영(A-03 AC)
import { Link } from 'react-router-dom'
import { useStore, adminStats } from '../../lib/store'
import { won } from '../../lib/engine'
import { LEGAL } from '../../lib/constants'
import { Logo, LiveDot } from '../../components/ui'
import ChatWidget from '../../components/ChatWidget'

export default function PartnerLanding() {
  const { db } = useStore()
  const { policies } = db
  const stats = adminStats(db)
  // 수익 예시 — 계약 총액이 아니라 건당 개통·성사 수수료 기준(현실 모델).
  // 건당 수수료는 카테고리·통신사 정책에 따라 15만~55만원 — 예시는 믹스 평균 36만원.
  const SIM_DEALS = 24
  const SIM_DEAL_FEE = 360000
  const simGross = SIM_DEALS * SIM_DEAL_FEE
  const simFee = Math.round(simGross * policies.feeRate)
  const simNet = simGross - simFee - policies.monthlyFee

  return (
    <div className="min-h-screen bg-cream">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-line-card/50 bg-cream/60 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between px-5 sm:h-[76px] sm:px-10">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
            <span className="rounded-full bg-tint px-2.5 py-1 text-[11px] font-bold text-primary-text">파트너</span>
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] font-medium text-body md:flex">
            <a href="#benefit" className="hover:text-primary-text">분양 안내</a>
            <a href="#profit" className="hover:text-primary-text">수익 구조</a>
            <a href="#steps" className="hover:text-primary-text">시작 절차</a>
            <Link to="/login" className="hover:text-primary-text">파트너 로그인</Link>
          </nav>
          <Link to="/partner/apply" className="glass-btn-cta inline-flex h-10 items-center rounded-full bg-primary px-5 text-[14px] font-bold text-white hover:bg-primary-hover">
            분양 신청
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-10">
        {/* ── 히어로 ── */}
        <section id="profit" className="grid items-center gap-10 pb-12 pt-10 sm:pt-16 lg:grid-cols-[1fr_440px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-ink shadow-card">
              <LiveDot /> 지금 {stats.active.length}개 몰 운영 중 · 신규 파트너 모집
            </span>
            <h1 className="mt-5 text-[32px] font-extrabold leading-[1.3] tracking-[-1px] text-ink sm:text-[42px] sm:leading-[54px]">
              내 브랜드 분양몰로<br /><span className="text-orange-text">온라인 건물주</span> 되기
            </h1>
            <p className="mt-4 max-w-lg text-[15.5px] leading-[27px] text-muted">
              사무실도, 재고도, 경력도 필요 없어요. 비교판매 몰 하나 분양받으면 상품 공급·리드 배정·AI 상담·정산까지 전부 본사가 대신합니다. 당신은 <strong className="font-bold text-ink">월세 받듯</strong> 수익만 확인하세요.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/partner/apply" className="shimmer-cta glass-btn-cta inline-flex h-[52px] items-center rounded-btn bg-primary px-7 text-[15.5px] font-bold text-white hover:bg-primary-hover">
                분양 신청하기
              </Link>
              <a href="#steps" className="glass-btn inline-flex h-[52px] items-center rounded-btn border border-line-soft bg-white px-7 text-[15.5px] font-bold text-body hover:border-primary hover:text-primary-text">
                시작 절차 보기
              </a>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[13.5px] font-semibold text-ok">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12.5 5 5 10-11" /></svg>
              심사 승인 후 10분 내 내 몰 오픈 · 초기 교육 무료
            </div>
          </div>

          {/* 수익 예시 카드 — 건수 × 건당 수수료 메커니즘 표출 */}
          <aside className="rounded-section bg-white p-6 shadow-panel">
            <span className="rounded-full bg-tint px-3 py-1 text-[12px] font-bold text-primary-text">하루 1건 페이스 — 월 {SIM_DEALS}건 완료 기준 예시</span>
            <div className="mt-5 flex flex-col gap-3 text-[14.5px]">
              <div className="flex justify-between gap-3">
                <span className="text-label">개통·성사 수수료 <span className="tnum text-[12.5px]">({SIM_DEALS}건 × 평균 {won(SIM_DEAL_FEE)})</span></span>
                <span className="tnum font-bold text-ink">{won(simGross)}</span>
              </div>
              <p className="-mt-2 text-[11.5px] leading-4 text-faint">건당 수수료: 인터넷 25~40만 · 휴대폰 35~55만 · 렌탈 20~35만 — 상품·통신사 정책에 따라 달라요</p>
              <div className="flex justify-between"><span className="text-label">플랫폼 운영 수수료 ({Math.round(policies.feeRate * 100)}%)</span><span className="tnum font-bold text-danger">−{won(simFee)}</span></div>
              <div className="flex justify-between"><span className="text-label">월 이용료</span><span className="tnum font-bold text-danger">−{won(policies.monthlyFee)}</span></div>
            </div>
            <div className="my-4 border-t border-dashed border-line" />
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-bold text-ink">파트너 순수익</span>
              <span className="tnum text-[30px] font-extrabold tracking-[-1px] text-primary-text">{won(simNet)}</span>
            </div>
            <p className="mt-2 text-[12px] leading-[18px] text-muted">렌탈·결합 고객은 만기 재상담으로 이어져 단골 자산이 돼요 — 건수가 쌓일수록 다음 달이 더 커집니다.</p>
            <div className="mt-4 flex items-center gap-2.5 rounded-field bg-brow px-4 py-3">
              <LiveDot />
              <span className="text-[13px] font-semibold text-bbody">정산은 <strong className="font-extrabold text-bink">월말이 아니라, 매일</strong> 마이오피스에서 확인</span>
            </div>
            <p className="mt-3 text-[11px] leading-4 text-disabled">{LEGAL.profit}</p>
          </aside>
        </section>

        {/* ── 제공 가치 4카드 ── */}
        <section id="benefit" className="rounded-section bg-white p-6 shadow-card sm:p-9">
          <h2 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">개설만 하세요,<br className="sm:hidden" /> 운영은 모두온이 합니다</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: 'store', t: '내 브랜드 몰', d: '로고·컬러·인사말을 입힌 나만의 비교판매 사이트. 상품·가격·콘텐츠는 본사가 중앙 관리해요.' },
              { icon: 'bolt', t: '권역 오토매칭', d: '내 몰 유입은 물론, 본진 유입 고객도 주소지 권역 기준으로 실시간 자동 배정됩니다.' },
              { icon: 'cpu', t: 'AI 상담비서 모비', d: '1차 응대·문의 분류·견적 계산을 모비가 자동으로. 사장님은 클로징에만 집중하세요.' },
              { icon: 'wallet', t: '데일리 투명정산', d: '건별 수수료 명세와 예정 수익이 매일 갱신돼요. 월 정산은 익월 20일 자동 지급.' },
            ].map((c) => (
              <div key={c.t} className="glass-tile rounded-card p-5 hover:-translate-y-[3px]">
                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-white text-primary-text shadow-card">
                  <PartnerIcon kind={c.icon} />
                </span>
                <div className="mt-3.5 text-[15.5px] font-bold text-ink">{c.t}</div>
                <p className="mt-1.5 text-[13px] leading-[21px] text-muted">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 정착지원 프로그램 — 분양비 명목 20% 재투자 기금 ── */}
        <section className="mt-6 rounded-section bg-white p-6 shadow-card sm:p-9">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">개설이 끝이 아니라,<br className="sm:hidden" /> 정착까지 본사가 밉니다</h2>
            <span className="text-[13px] font-bold text-orange-text">권역 분양 수익의 20%를 정착지원 기금으로 재투자</span>
          </div>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-[22px] text-muted">분양몰은 로컬 사업입니다 — 그래서 지원도 지역 안에서 쓰이게 설계했어요. 개설 후 90일, 몰당 <strong className="font-bold text-ink">최대 500만원 상당</strong> 정착 패키지가 성과 연동으로 제공됩니다.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: '개설 정착금 100만원', d: '첫 30일 내 개통 5건 달성 시 지급 — 오픈 프로모션 사은품 재원으로 쓰세요.' },
              { t: '로컬 마케팅 50% 매칭', d: '당근·지역 맘카페·아파트 게시판·전단 집행액의 절반을 본사가 부담 (월 50만 × 3개월).' },
              { t: '디지털 개설 대행', d: '네이버 플레이스·지도 등록, 지역 키워드 블로그 3편, 카톡 채널까지 본사가 일괄 세팅.' },
              { t: 'AI 크레딧 + 리드 부스터', d: '알림톡 월 1,000건 × 3개월 + AI 카피 무제한, 첫 30일 본진 리드 배정 가중치 +30%.' },
            ].map((c, i) => (
              <div key={c.t} className="glass-tile rounded-card p-5">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-extrabold ${i === 0 ? 'bg-orange-tint text-orange-text' : 'bg-tint text-primary-text'}`}>{i + 1}</span>
                <div className="mt-3 text-[15px] font-bold text-ink">{c.t}</div>
                <p className="mt-1.5 text-[12.5px] leading-[20px] text-muted">{c.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11.5px] leading-4 text-disabled">정착 패키지는 성과 연동형(2단 지급)이며 증빙 기반으로 집행됩니다. 세부 조건은 「분양몰 정착지원 정책」을 따르고, 상담 시 안내드려요.</p>
        </section>

        {/* ── 시작 절차 4단계 ── */}
        <section id="steps" className="mt-6 rounded-section bg-white p-6 shadow-card sm:p-9">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">시작 절차</h2>
            <span className="text-[13px] font-semibold text-faint">신청부터 판매 시작까지 최단 1주</span>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: '분양 신청', d: '소재지 기준 권역이 자동 판정돼요. 신청은 1분이면 충분해요.' },
              { t: '심사 · 계약', d: '본사가 신청 내용을 검토하고 공동사업 계약을 안내해 드려요.' },
              { t: '결제 · 몰 개설', d: `대리점 가입비 ${won(policies.joinFee)} + 월 이용료 ${won(policies.monthlyFee)}. 브랜딩 마법사로 1시간 안에 개설.` },
              { t: '판매 시작', d: '리드가 실시간으로 도착하고, 정산은 매일 갱신됩니다.' },
            ].map((s, i) => (
              <div key={s.t} className="glass-tile rounded-card p-5">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-extrabold ${i === 3 ? 'bg-primary text-white' : 'bg-tint text-primary-text'}`}>{i + 1}</span>
                <div className="mt-3.5 text-[15.5px] font-bold text-ink">{s.t}</div>
                <p className="mt-1.5 text-[13px] leading-[21px] text-muted">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA 밴드 ── */}
        <section className="relative mt-6 overflow-hidden rounded-section bg-band px-6 py-10 text-center sm:px-10" style={{ boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -2px 5px rgba(20,36,90,0.35), 0 16px 44px rgba(83,119,214,0.28)' }}>
          {/* 좌상단 진한 동색 엣지(시선 유도) + 유리 엣지 하이라이트 */}
          <span aria-hidden className="pointer-events-none absolute inset-0 z-0 rounded-section" style={{ background: 'linear-gradient(135deg, rgba(28,48,132,0.55) 0%, rgba(28,48,132,0.16) 26%, transparent 52%)', boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.28)' }} />
          <div className="relative z-10">
            <h2 className="text-[22px] font-extrabold leading-8 text-white sm:text-[24px]">권역은 선착순으로 마감됩니다</h2>
            <p className="mt-2 text-[14px] font-medium text-white/75">서울 25개 구 · 전국 시군구 단위 사업권 — 내 지역이 남아있는지 확인해 보세요.</p>
            <Link to="/partner/apply" className="glass-btn shimmer-cta shimmer-ink mt-6 inline-flex h-[52px] items-center rounded-btn bg-white px-8 text-[15.5px] font-bold text-primary-text transition-transform hover:-translate-y-px">
              내 권역 확인하고 분양 신청 →
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-10">
        <div className="border-t border-line-card pt-5 text-[12px] leading-5 text-disabled">
          <p>{LEGAL.profit} {LEGAL.policy}</p>
          <p className="mt-1">© 2026 MODUON. 분양·사업권 관련 세부 조건은 공동사업 계약서를 따릅니다.</p>
        </div>
      </footer>
      <ChatWidget />
    </div>
  )
}

// 제공가치 라인 아이콘 (stroke 기반) — 이모지 대체
function PartnerIcon({ kind }) {
  const paths = {
    store: (
      <>
        <path d="M3.5 9 5 4.2h14L20.5 9" />
        <path d="M4.5 9v9.8a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V9" />
        <path d="M3.5 9h17" />
        <path d="M9 19.8V15h6v4.8" />
      </>
    ),
    bolt: <path d="M13 2.5 4.5 13.5H10l-1 8 8.5-11H12l1-8Z" />,
    cpu: (
      <>
        <rect x="6.5" y="6.5" width="11" height="11" rx="2.2" />
        <rect x="10" y="10" width="4" height="4" rx="1" />
        <path d="M9.5 2.5v3M14.5 2.5v3M9.5 18.5v3M14.5 18.5v3M2.5 9.5h3M2.5 14.5h3M18.5 9.5h3M18.5 14.5h3" />
      </>
    ),
    wallet: (
      <>
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h10.5v3" />
        <path d="M4 6.5v11A2.5 2.5 0 0 0 6.5 20h13a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-13A2.5 2.5 0 0 1 4 6.5Z" />
        <circle cx="16.5" cy="14" r="1.2" />
      </>
    ),
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[kind]}
    </svg>
  )
}
