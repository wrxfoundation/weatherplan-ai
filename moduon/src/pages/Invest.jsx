// ─── IR 원페이지 (/ir) — 투자유치용 서비스 소개 랜딩 ─────────────────
// "슬라이드가 아니라, 돌아가는 제품을 보세요" — 라이브 데모가 곧 피치덱.
// 수치는 데모 빌드 기준(명목·예시)이며 하단에 고지한다.
import { Link } from 'react-router-dom'
import { useStore, adminStats } from '../lib/store'
import { won } from '../lib/engine'
import { Logo, LiveDot } from '../components/ui'
import { IcRobot, IcMegaphone, IcUsers, IcRadar } from '../components/icons'

const KPI = [
  { v: '3면+1', k: '플랫폼 구조', s: '소비자·파트너·본사 + 총판' },
  { v: '8개', k: '생활서비스 카테고리', s: '인터넷·이사·렌탈·보험 등' },
  { v: '11개', k: '전국 영업 권역', s: '권역 단위 사업권 체계' },
  { v: '85%+', k: 'AI 자동 처리율', s: '상담·분류·배정·정산' },
]

const REVENUE = [
  { t: '분양비 (일시)', v: '명목 총액 14.65억', d: '서울 25구 개별 + 지방 8단 일괄 — 권역 사업권 판매', tone: 'text-primary-text' },
  { t: '월 이용료 (반복)', v: '30만원 × 활성 몰', d: '몰이 늘수록 쌓이는 구독형 반복 수익', tone: 'text-ok' },
  { t: '운영 수수료 (변동)', v: '거래액의 10%', d: '파트너 성장과 정비례 — 정산 엔진 자동 계산', tone: 'text-orange-text' },
]

const MOAT = [
  { t: 'AI 상담사 모비', d: '견적 계산·응대·분류를 자동으로. API 없이도 규칙 브레인 폴백으로 무중단.', icon: IcRobot },
  { t: '마케팅 스튜디오', d: '카피 생성 × 날씨·시즌 트리거 × A/B 실험 — 파트너 마케팅을 본사가 자동화.', icon: IcMegaphone },
  { t: '페르소나 랩', d: '한국인 가상 패널로 카피·오퍼·정책을 발송 전에 시뮬레이션 — 가설 검증 특화.', icon: IcUsers },
  { t: '관제 콘솔', d: '⌘K 커맨드, SLA 10분 관제, 전수 감사 로그, 매일 정산 — 운영이 곧 데이터 해자.', icon: IcRadar },
]

const EXPAND = [
  { name: '외국인 개통 시장', score: 88, d: '체류 외국인 260만 · 공략안 수립 완료' },
  { name: '에어컨 설치·이전', score: 79, d: '시즌 트리거 연계' },
  { name: '소상공인 보안·CCTV', score: 74, d: 'B2B 반복 수익' },
]

export default function Invest() {
  const { db } = useStore()
  const stats = adminStats(db)

  return (
    <div className="min-h-screen bg-cream">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-line-card/50 bg-cream/60 backdrop-blur-md">
        <div className="mx-auto flex h-[64px] max-w-6xl items-center justify-between px-5 sm:h-[76px] sm:px-10">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="rounded-full bg-bink px-2.5 py-1 text-[11px] font-bold text-white">IR</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Link to="/" className="glass-btn hidden h-10 items-center rounded-full border border-line-soft bg-white px-5 text-[14px] font-semibold text-body hover:border-primary hover:text-primary-text sm:flex">라이브 데모</Link>
            <a href="mailto:ir@moduon.example" className="shimmer-cta glass-btn-cta flex h-10 items-center rounded-full bg-primary px-5 text-[14px] font-bold text-white hover:bg-primary-hover">IR 문의</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-10">
        {/* ── 히어로 ── */}
        <section className="grid items-center gap-10 pb-12 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_400px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-bold text-ink shadow-card">
              <LiveDot /> 지금 {stats.active.length}개 분양몰 운영 중 — 화면 전부가 실제로 동작합니다
            </span>
            <h1 className="mt-5 text-[32px] font-extrabold leading-[1.28] tracking-[-1px] text-ink sm:text-[44px]">
              생활서비스 유통을<br /><span className="text-primary-text">다시 짓는</span> 3면 플랫폼
            </h1>
            <p className="mt-4 max-w-xl text-[15.5px] leading-[27px] text-muted">
              소비자는 <strong className="font-bold text-orange-text">왕창 아끼고 돌려받고</strong>, 파트너는 <strong className="font-bold text-ink">온라인 건물주</strong>가 되고, 본사는 <strong className="font-bold text-primary-text">AI로 관제</strong>합니다. 인터넷·이사·렌탈·보험 — 파편화된 생활서비스 시장을 한 플랫폼으로 묶었습니다.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/" className="shimmer-cta glass-btn-cta inline-flex h-[52px] items-center rounded-btn bg-primary px-7 text-[15.5px] font-bold text-white hover:bg-primary-hover">라이브 데모 열기 →</Link>
              <Link to="/partner" className="glass-btn inline-flex h-[52px] items-center rounded-btn border border-line-soft bg-white px-7 text-[15.5px] font-bold text-body hover:border-primary hover:text-primary-text">파트너 모집 랜딩</Link>
            </div>
          </div>
          <div className="relative mx-auto hidden w-full max-w-[380px] lg:block">
            <img src="/assets/obj-tower.png" alt="" className="animate-bagfloat w-full object-contain" style={{ filter: 'drop-shadow(0 18px 30px rgba(83,119,214,0.22))' }} />
          </div>
        </section>

        {/* KPI 스트립 */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {KPI.map((k) => (
            <div key={k.k} className="glass-tile rounded-card p-5 text-center">
              <div className="tnum text-[26px] font-extrabold tracking-[-0.5px] text-primary-text">{k.v}</div>
              <div className="mt-0.5 text-[13px] font-bold text-ink">{k.k}</div>
              <div className="mt-0.5 text-[11px] text-faint">{k.s}</div>
            </div>
          ))}
        </section>

        {/* ── 문제 → 해법 ── */}
        <section className="mt-10 rounded-section bg-white p-6 shadow-card sm:p-9">
          <h2 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">파편화된 시장, 검증된 답</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-card border border-line p-5">
              <div className="text-[13px] font-extrabold text-danger">문제</div>
              <p className="mt-2 text-[13.5px] leading-[22px] text-muted">생활서비스는 업종마다 유통이 조각나 있고, 리베이트 구조가 불투명해 소비자는 <strong className="font-bold text-ink">받을 수 있는 혜택을 모른 채</strong> 가입합니다. 판매자는 모객·상담·정산을 각자 수작업으로 버팁니다.</p>
            </div>
            <div className="rounded-card border border-line p-5">
              <div className="text-[13px] font-extrabold text-warn">검증</div>
              <p className="mt-2 text-[13.5px] leading-[22px] text-muted">현금 사은품 극대화 + 지급 증거 공개 모델은 선행 주자들이 <strong className="font-bold text-ink">시장에서 이미 증명</strong>했습니다. 모두온은 그 검증된 소비자 후킹에 <strong className="font-bold text-ink">분양·AI 레이어</strong>를 얹어 구조화했습니다.</p>
            </div>
            <div className="rounded-card border-[1.5px] border-primary/40 bg-tint/30 p-5">
              <div className="text-[13px] font-extrabold text-primary-text">해법</div>
              <p className="mt-2 text-[13.5px] leading-[22px] text-body">본사가 상품·가격·AI·정산을 중앙 관리하고, 지역 파트너가 로컬 신뢰로 판매합니다. <strong className="font-bold text-primary-text">"엔진 1개 + 분양몰 N개"</strong> — 재고도 지점도 없이 전국으로 확장되는 구조입니다.</p>
            </div>
          </div>
        </section>

        {/* ── 3층 수익 구조 ── */}
        <section className="mt-6 rounded-section bg-white p-6 shadow-card sm:p-9">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">한 번 팔고, 매달 쌓이고,<br className="sm:hidden" /> 같이 커지는 수익</h2>
            <img src="/assets/obj-moneybag.png" alt="" className="h-[72px] w-[72px] object-contain" />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {REVENUE.map((r) => (
              <div key={r.t} className="glass-tile rounded-card p-5">
                <div className="text-[13px] font-bold text-muted">{r.t}</div>
                <div className={`tnum mt-1 text-[21px] font-extrabold tracking-[-0.5px] ${r.tone}`}>{r.v}</div>
                <p className="mt-1.5 text-[12.5px] leading-5 text-muted">{r.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-card bg-brow/60 p-5">
              <div className="text-[13px] font-extrabold text-ink">파트너 단위 경제 (몰 1개, 하루 1건 페이스)</div>
              <p className="tnum mt-2 text-[13.5px] leading-[24px] text-body">월 24건 × 건당 수수료 36만원 = 수수료 매출 864만원<br />→ 파트너 순수익 약 <strong className="font-extrabold text-primary-text">747만원</strong> · 본사 몫 약 <strong className="font-extrabold text-ok">116만원/몰/월</strong></p>
            </div>
            <div className="rounded-card bg-orange-tint/60 p-5">
              <div className="text-[13px] font-extrabold text-orange-text">지속가능성 — 정착지원 재투자</div>
              <p className="mt-2 text-[13.5px] leading-[24px] text-body">분양 수익의 <strong className="font-extrabold text-orange-text">20%(연 2.93억)</strong>를 파트너 정착 기금으로 환류 — 몰당 최대 500만원 로컬 마케팅 패키지. <strong className="font-bold text-ink">팔고 끝이 아니라 성공시켜야 반복 수익이 삽니다.</strong></p>
            </div>
          </div>
        </section>

        {/* ── AI 해자 ── */}
        <section className="mt-6 rounded-section bg-white p-6 shadow-card sm:p-9">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">운영 전체에 스며든 AI</h2>
            <span className="text-[13px] font-semibold text-faint">"이긴 구조만 자동화한다" — 피드백 플라이휠</span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MOAT.map((m) => (
              <div key={m.t} className="glass-tile rounded-card p-5">
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-white text-primary-text shadow-card"><m.icon size={26} sw={1.7} /></span>
                <div className="mt-3 text-[15px] font-bold text-ink">{m.t}</div>
                <p className="mt-1.5 text-[12.5px] leading-[20px] text-muted">{m.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12.5px] leading-5 text-muted">상담·리드·정산 데이터가 쌓일수록 AI가 정교해지고 자동화율이 오르는 <strong className="font-bold text-ink">데이터 플라이휠</strong> — 규모가 커질수록 후발 주자가 따라오기 어려운 구조적 우위가 됩니다.</p>
        </section>

        {/* ── 확장 로드맵 ── */}
        <section className="mt-6 rounded-section bg-white p-6 shadow-card sm:p-9">
          <h2 className="text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[26px]">다음 시장은 이미 점수화되어 있습니다</h2>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-[22px] text-muted">시장 규모 × 전환 용이성 × 자산 재활용률 × 페인 강도로 진출 후보를 상시 랭킹하고, 파일럿 게이트(90일 KPI)를 통과한 시장만 확장합니다.</p>
          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {EXPAND.map((e, i) => (
              <div key={e.name} className={`rounded-card border p-5 ${i === 0 ? 'border-[1.5px] border-primary/40 bg-tint/30' : 'border-line'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[14.5px] font-extrabold text-ink">{e.name}</span>
                  <span className={`tnum text-[18px] font-extrabold ${i === 0 ? 'text-primary-text' : 'text-faint'}`}>{e.score}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream"><div className={`h-full rounded-full ${i === 0 ? 'bg-primary' : 'bg-line'}`} style={{ width: `${e.score}%` }} /></div>
                <p className="mt-2 text-[12px] text-muted">{e.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA — 라이브 데모가 피치덱 ── */}
        <section className="relative mt-6 overflow-hidden rounded-section bg-band px-6 py-10 text-center sm:px-10" style={{ boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.35), inset 0 -2px 5px rgba(20,36,90,0.35), 0 16px 44px rgba(83,119,214,0.28)' }}>
          <span aria-hidden className="pointer-events-none absolute inset-0 z-0 rounded-section" style={{ background: 'linear-gradient(135deg, rgba(28,48,132,0.55) 0%, rgba(28,48,132,0.16) 26%, transparent 52%)', boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.28)' }} />
          <div className="relative z-10">
            <h2 className="text-[22px] font-extrabold leading-8 text-white sm:text-[26px]">슬라이드가 아니라, 돌아가는 제품을 보세요</h2>
            <p className="mt-2 text-[14px] font-medium text-white/75">소비자몰부터 AI 관제까지 — 아래 버튼 전부 실제로 동작하는 화면입니다.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/" className="glass-btn shimmer-cta shimmer-ink inline-flex h-[50px] items-center rounded-btn bg-white px-6 text-[14.5px] font-bold text-primary-text hover:-translate-y-px">소비자몰</Link>
              <Link to="/partner" className="glass-btn inline-flex h-[50px] items-center rounded-btn bg-white/15 px-6 text-[14.5px] font-bold text-white ring-1 ring-white/30 hover:bg-white/25">분양 랜딩</Link>
              <Link to="/login" className="glass-btn inline-flex h-[50px] items-center rounded-btn bg-white/15 px-6 text-[14.5px] font-bold text-white ring-1 ring-white/30 hover:bg-white/25">관제 데모 로그인</Link>
              <a href="mailto:ir@moduon.example" className="glass-btn inline-flex h-[50px] items-center rounded-btn bg-white/15 px-6 text-[14.5px] font-bold text-white ring-1 ring-white/30 hover:bg-white/25">IR 미팅 요청</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:px-10">
        <div className="border-t border-line-card pt-5 text-[12px] leading-5 text-disabled">
          <p>본 페이지의 수치는 데모 빌드의 명목·예시 기준이며 실제 실적·수익을 보장하지 않습니다. 분양·사업권 세부 조건은 공동사업 계약서를 따릅니다.</p>
          <p className="mt-1">© 2026 MODUON. 모두온 데모 빌드 — 화면의 수치·업체명은 시연용 예시입니다.</p>
        </div>
      </footer>
    </div>
  )
}
