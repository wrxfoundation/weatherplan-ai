// ─── S-01 소비자 홈 (트랙 A · 아정당식 초기화면 개편) ─────────────────
// 롤링 배너 → 지급 티커 → 아이콘 행 6종 → 지원금 3카드 + 바로 상담하기 분기 → 실질 부담 → CTA 밴드 → 신뢰 지표 → 후기
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { SITE_NAV, BENEFIT_MAX, BENEFIT_TOTAL, LEGAL } from '../../lib/constants'
import { won, calcQuote, CARRIERS } from '../../lib/engine'
import { useStore } from '../../lib/store'
import { useCountUp, LiveDot, SafeImg } from '../../components/ui'
import { IcRobot } from '../../components/icons'
import HeroBanner from '../../components/HeroBanner'
import Reviews from '../../components/Reviews'


export default function Home({ tenant }) {
  const { db } = useStore()
  const consultTo = tenant ? `/consult?src=${tenant.slug}` : '/consult'
  // 아이콘 행 = 사이트 1차 동선(SITE_NAV). 파트너몰은 취급 카테고리만, 그리고 상담으로 흐른다(모두온혜택·매장패키지 제외).
  const tiles = tenant
    ? SITE_NAV.filter((n) => n.cat && tenant.cats.includes(n.cat)).map((n) => ({ ...n, to: `${consultTo}&cat=${n.cat}` }))
    : SITE_NAV

  return (
    <main>
      <div className="mx-auto max-w-6xl px-5 pt-4 sm:px-10 sm:pt-6">

      {/* 파트너몰 — 배너 위에 파트너 신원 한 줄(본진 배너를 같이 쓰므로 여기서 구분) */}
      {tenant && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-primary-text shadow-card">
            <LiveDot /> 모두온 공식 파트너 · {tenant.name} · {tenant.owner} 사장님이 직접 상담해요
          </span>
          {tenant.greeting && <span className="text-[12.5px] font-semibold text-muted">{tenant.greeting}</span>}
        </div>
      )}

      {/* ── 롤링 배너 (db.banners · 어드민 배너 관리) ── */}
      <HeroBanner banners={db.banners} tenant={tenant} consultTo={consultTo} />

      <PayoutTicker />

      <SiteTiles tiles={tiles} />

      <SupportSection consultTo={consultTo} />

      <RealCostTeaser />

      {/* ── CTA 밴드 (파스텔 그린 · 좌상단 진한 엣지 + 유리 두께감) ── */}
      <section className="relative mt-6 overflow-hidden rounded-section" style={{ background: 'linear-gradient(135deg,#DFF3E8 0%,#C2E7D2 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 1px rgba(23,120,70,0.10), 0 12px 34px rgba(23,178,106,0.20)' }}>
        {/* 좌상단 진한 동색 엣지(시선 유도) + 유리 엣지 하이라이트 */}
        <span aria-hidden className="pointer-events-none absolute inset-0 z-0 rounded-section" style={{ background: 'linear-gradient(135deg, rgba(17,138,80,0.62) 0%, rgba(17,138,80,0.18) 26%, transparent 50%)', boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.38)' }} />
        <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-9 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <img src="/assets/cta-chat.webp" alt="" className="h-[88px] w-[88px] object-contain sm:h-[112px] sm:w-[112px]" loading="lazy" />
            <div>
              <div className="break-keep text-[19px] font-extrabold leading-7 text-[#15613D] sm:text-[21px]">
                지금 신청하면, 이번 달부터 아낍니다
              </div>
              <div className="mt-1 break-keep text-[14px] font-medium text-[#37694F]">30초면 끝 · 평균 10분 안에 전문 컨설턴트가 전화드려요</div>
            </div>
          </div>
          <Link to={consultTo} className="shimmer-cta shimmer-green glass-btn inline-flex h-[52px] shrink-0 items-center rounded-btn bg-white px-7 text-[15px] font-bold text-[#0C7D48] transition-transform hover:-translate-y-px">
            전문컨설턴트 상담하기 →
          </Link>
        </div>
      </section>

      {/* ── 신뢰 지표 바 4 — 소형 아이콘은 SVG 라인으로 단순화 ── */}
      <section className="mt-6 grid grid-cols-2 rounded-section bg-white py-2 shadow-card lg:grid-cols-4">
        <TrustItem kind="thumb" label="누적 고객 만족도" value={98} suffix="%" />
        <TrustItem kind="shield" label="제휴 브랜드" value={250} suffix="+" divider />
        <TrustItem kind="gift" label="연간 혜택 금액" value={120} suffix="억원+" divider="lg" />
        <TrustItem kind="headset" label="전문 컨설턴트" value={500} suffix="+" divider />
      </section>

      {/* 후기 — 카드·후기쓰기·더보기가 본진 /board/review* 로 이어지므로 파트너몰(리드 귀속)에서는 뺀다 */}
      {!tenant && <Reviews />}
      </div>
    </main>
  )
}

// ─── 아이콘 행 — 휴대폰 · 가전렌탈 · 인터넷 · 렌트/리스 · 매장패키지 · 모두온혜택 ───
// 아정당과 겹치지 않는 자체 3D 아이콘(tile-*.png). 못 받아오면 라벨 첫 글자로 받친다.
function TileIcon({ src, label }) {
  const [err, setErr] = useState(false)
  return (
    <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-card transition-transform duration-200 group-hover:-translate-y-[3px] sm:h-[72px] sm:w-[72px]">
      {err
        ? <span className="text-[24px] font-extrabold text-primary-text">{label[0]}</span>
        : <img src={src} alt="" className="h-[74%] w-[74%] object-contain" loading="lazy" onError={() => setErr(true)} />}
    </span>
  )
}

function SiteTiles({ tiles }) {
  if (!tiles.length) return null
  // 본진은 6개 균등 그리드, 파트너몰(취급 카테고리만)은 개수가 줄어 가운데로 모은다
  const cols = tiles.length === SITE_NAV.length ? 'grid grid-cols-3 gap-y-5 sm:grid-cols-6' : 'grid grid-cols-3 gap-y-5 sm:flex sm:justify-center sm:gap-x-12'
  return (
    <section data-t="site-tiles" className="mt-6 sm:mt-8">
      <div className={cols}>
        {tiles.map((t) => (
          <Link key={t.key} to={t.to} className="group flex flex-col items-center gap-2.5">
            <span className="relative">
              <TileIcon src={t.icon} label={t.label} />
              {t.badge && (
                <span className="absolute -right-1 -top-1 rounded-full bg-[#8B7BFF] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">{t.badge}</span>
              )}
            </span>
            <span className="text-[13px] font-bold text-ink sm:text-[14px]">{t.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

// ─── 지원금 섹션 — "몰라서 못 받은 지원금, 최대 152만원+" + 3카드 + 바로 상담하기 분기 ───
// 합계는 BENEFIT_TOTAL, 칩 4개는 BENEFIT_MAX(직접 판매 구조·조건부·표시광고법 안전 문구 유지).
function SupportSection({ consultTo }) {
  // 카드① 칩 — 돈주머니 위·아래 두 띠에 흐름 배치(절대 좌표 아님 → 폭이 좁아도 겹치거나 카드 밖으로 안 나간다).
  // 띠 안에서는 가운데 모이고(안 들어가면 줄바꿈), 컨테이너 폭이 최대(≥ xl · 카드 299px)일 때 양 끝으로 벌려 목업의 네 귀퉁이가 된다.
  // 칩 한 쌍은 약 290px — lg(카드 256~281px)에서는 세로로 쌓이고, 375px 폰(295px)부터 나란히 들어간다.
  const chips = BENEFIT_MAX.map((b) => ({ c: b.label, v: `${b.manwon}만원+` }))
  const band = 'relative z-10 flex flex-wrap justify-center gap-2 xl:justify-between'
  const chip = (ch) => (
    <div key={ch.c} className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-2.5 py-1.5 shadow-card ring-1 ring-black/[0.03]">
      <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white shadow-sm" style={{ background: 'linear-gradient(150deg,#FBD34D,#F0A81E)' }}>₩</span>
      <span className="tnum text-[11.5px] font-bold text-ink">{ch.c} <span className="text-primary-text">{ch.v}</span></span>
    </div>
  )
  // 카드③ 말풍선 — 만기·비교·관리 고민(사용자 목업 문구 그대로)
  const worries = [
    { t: '만기일이 언제였더라???', cls: 'left-1 top-2', delay: '0s' },
    { t: '혜택 비교하고 알아보기 귀찮아ㅠ', cls: 'right-0 top-12', delay: '0.8s' },
    { t: '만기까지 꾸준하게 관리해주는 곳 없나???', cls: 'left-0 bottom-9', delay: '1.5s' },
    { t: '…..?', cls: 'right-6 bottom-3', delay: '2.2s' },
  ]
  return (
    <section data-t="support-section" className="mt-10 sm:mt-14">
      <div className="text-center">
        <h2 className="inline-block break-keep rounded-card bg-tint px-5 py-3 text-[20px] font-extrabold leading-[1.35] tracking-[-0.5px] text-ink sm:px-8 sm:py-4 sm:text-[28px]">
          몰라서 못 받은 지원금,<br className="sm:hidden" /> 최대 <span className="tnum text-primary-text">{BENEFIT_TOTAL}만원+</span> 왕창 돌려드려요
        </h2>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* ① 숨은 혜택 — 돈주머니 + 점선 커넥터 + 카테고리 칩 */}
        <SupportCard title="가만히 있으면 우리집만 손해예요." sub="3년~6년 마다 가구당 최대 100만원 상당 혜택이 숨어 있는걸 아시나요?">
          <div className="relative mx-auto w-full max-w-[360px]">
            {/* 점선 커넥터 — 돈주머니 가장자리에서 위·아래 칩 띠로. 퍼센트 좌표라 폭이 바뀌어도 방향이 유지된다 */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              <g stroke="#9DB0E8" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" fill="none">
                <line x1="42%" y1="43%" x2="26%" y2="8%" /><line x1="58%" y1="43%" x2="74%" y2="8%" />
                <line x1="42%" y1="57%" x2="26%" y2="92%" /><line x1="58%" y1="57%" x2="74%" y2="92%" />
              </g>
              <g fill="#7E95DD">
                <circle cx="42%" cy="43%" r="3" /><circle cx="58%" cy="43%" r="3" />
                <circle cx="42%" cy="57%" r="3" /><circle cx="58%" cy="57%" r="3" />
              </g>
            </svg>
            <div className={band}>{chips.slice(0, 2).map(chip)}</div>
            {/* 돈주머니 (다홍색 가죽 3D · 배경 제거 이미지 · 천천히 둥둥) — 고정 크기라 이미지가 없어도 자리를 지킨다 */}
            <div className="relative mx-auto my-2 h-[104px] w-[104px] lg:h-[118px] lg:w-[118px]">
              <SafeImg src="/assets/obj-moneybag.png" alt="지원금 주머니" className="animate-bagfloat h-full w-full object-contain" style={{ filter: 'drop-shadow(0 14px 22px rgba(214,74,38,0.28))' }} />
            </div>
            <div className={band}>{chips.slice(2).map(chip)}</div>
          </div>
        </SupportCard>

        {/* ② 전문 AI 상담 — 보라색 AI 말풍선 */}
        <SupportCard title="챗봇 NO! 전문 AI상담사와 부담없이 채팅 상담해요." sub="영업상담 아닙니다! 우리집 구독서비스 설계만 해드립니다.">
          <div className="flex h-full min-h-[200px] items-center justify-center">
            <SafeImg src="/assets/ill-ai.png" className="h-[170px] w-auto max-w-full object-contain sm:h-[190px]" style={{ filter: 'drop-shadow(0 14px 22px rgba(139,123,255,0.28))' }} />
          </div>
        </SupportCard>

        {/* ③ 만기까지 관리 — 고민하는 여성 + 고민 말풍선 4개 */}
        <SupportCard title="한 번 맺은 인연 쭉 좋은 혜택으로 관리해드려요." sub="가입하고 끝이 아닙니다! 혼자 고민하지 마세요.">
          <div className="relative mx-auto flex h-full min-h-[220px] w-full max-w-[360px] items-end justify-center">
            <SafeImg src="/assets/ill-thinking.png" className="h-[190px] w-auto max-w-[70%] object-contain object-bottom sm:h-[210px]" />
            {worries.map((w) => (
              <span
                key={w.t}
                className={`animate-floaty pointer-events-none absolute ${w.cls} max-w-[62%] break-keep break-words rounded-[14px] bg-white px-3 py-1.5 text-[11.5px] font-bold leading-4 text-ink shadow-card ring-1 ring-black/[0.03]`}
                style={{ animationDelay: w.delay }}
              >
                {w.t}
              </span>
            ))}
          </div>
        </SupportCard>
      </div>

      <ConsultSplit consultTo={consultTo} />

      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <Link to="/payouts" className="text-[13.5px] font-bold text-primary-text hover:underline">실제 지급내역 보기 →</Link>
        <p className="max-w-2xl break-keep text-[11px] leading-4 text-label">{LEGAL.policy} 지원금·사은품의 최대 금액은 조건 충족 시 기준이며 심사 결과에 따라 달라질 수 있습니다.</p>
      </div>
    </section>
  )
}

// 지원금 카드 공통 틀 — 연회색 둥근 카드, 제목/부제 위·비주얼 아래
function SupportCard({ title, sub, children }) {
  return (
    <div className="flex flex-col rounded-card bg-[#F4F6FA] p-5 sm:p-6">
      <h3 className="break-keep text-[16px] font-extrabold leading-6 tracking-[-0.3px] text-ink sm:text-[17px]">{title}</h3>
      <p className="mt-1.5 break-keep text-[13px] leading-5 text-muted">{sub}</p>
      <div className="mt-4 flex-1">{children}</div>
    </div>
  )
}

// ─── 바로 상담하기 — 누르면 아래로 AI 모비 / 전문컨설턴트 두 갈래가 펼쳐진다 ───
function ConsultSplit({ consultTo }) {
  const [open, setOpen] = useState(false)
  const openMobi = () => window.dispatchEvent(new CustomEvent('moduon:chat-open', { detail: { seed: '우리집 생활비 아낄 수 있는지 봐주세요' } }))
  return (
    <div data-t="cta-split" className="mt-8 flex flex-col items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="cta-split-menu"
        className="glass-btn inline-flex h-14 items-center gap-2 rounded-btn bg-[#FFE500] px-9 text-[17px] font-extrabold text-ink shadow-cta transition-transform hover:-translate-y-px"
      >
        <span aria-hidden>💬</span> 바로 상담하기
      </button>
      {open && (
        <div id="cta-split-menu" className="relative mt-4 w-full max-w-xl animate-rise">
          {/* 말풍선 꼬리 — 위 버튼을 향한 작은 삼각형 */}
          <span aria-hidden className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-[3px] bg-white" />
          <div className="relative grid gap-3 rounded-card bg-white p-3 shadow-panel sm:grid-cols-2">
            <button
              type="button"
              data-t="cta-mobi"
              onClick={openMobi}
              className="glass-btn inline-flex h-[54px] items-center justify-center gap-2 rounded-btn bg-tint px-4 text-[15px] font-extrabold text-primary-text transition-colors hover:bg-[#E2E9F8]"
            >
              <IcRobot size={20} sw={2.1} /> AI 모비와 실시간 상담하기
            </button>
            <Link
              data-t="cta-human"
              to={consultTo}
              className="glass-btn inline-flex h-[54px] items-center justify-center gap-2 rounded-btn bg-[#FFE500] px-4 text-[15px] font-extrabold text-ink transition-transform hover:-translate-y-px"
            >
              <TrustIcon kind="headset" size={20} /> 전문컨설턴트 상담하기
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// 오늘의 지급 티커 — "준다"가 아니라 "줬다"를 보여준다 (날짜 시드 결정적 데모 수치)
function PayoutTicker() {
  const d = new Date()
  const n = 8 + (d.getDate() % 6)
  const total = n * 341000 + d.getDay() * 47000
  return (
    // 배너 바로 아래, 아이콘 행 위 — 첫 화면의 "지급 증거"
    <section className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-card bg-white px-5 py-3.5 shadow-panel">
      <span className="flex items-center gap-2.5 text-[13.5px] font-bold text-ink">
        <LiveDot /> 오늘 사은품 지급 <span className="tnum text-orange-text">{n}건 · {won(total)}</span>
        <span className="hidden text-[12px] font-semibold text-muted sm:inline">— 설치 확인 후 영업일 7일 내 계좌 입금</span>
      </span>
      <Link to="/payouts" className="text-[12.5px] font-bold text-primary-text hover:underline">실명(마스킹) 명단 확인 →</Link>
    </section>
  )
}

// 3사 실질 부담 미리보기 — 계산기와 같은 엔진(calcQuote)으로 기본 구성 실측
function RealCostTeaser() {
  const { db } = useStore()
  const rows = CARRIERS
    .map((c) => calcQuote({ carrier: c, speed: '500M', bundle: 'water', promo: false }, db.products))
    .sort((a, b) => a.real36 - b.real36)
  return (
    <section className="mt-6 rounded-section bg-white p-5 shadow-card sm:p-9">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="break-keep text-[20px] font-extrabold tracking-[-0.5px] text-ink sm:text-[24px]">월 요금이 같아도, <span className="text-primary-text">돌려받는 돈</span>은 다릅니다</h2>
          <p className="mt-1 break-keep text-[13px] text-muted sm:text-[14px]">인기 구성(500M + 정수기 결합) 기준 — 3년 실질 부담 = 납부 총액 − 돌려받는 돈</p>
        </div>
        <Link to="/calculator" className="text-[13.5px] font-bold text-primary-text hover:underline">내 조건으로 비교하기 →</Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {rows.map((r, i) => (
          <Link
            key={r.carrier}
            to="/calculator"
            state={{ preset: { carrier: r.carrier, speed: '500M', bundle: 'water' } }}
            className={`group rounded-card border p-4 transition-all hover:-translate-y-[3px] ${i === 0 ? 'border-[1.5px] border-ok/60 bg-ok/[0.04]' : 'border-line bg-white hover:border-primary/50'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-extrabold text-ink">{r.carrier}</span>
              {i === 0 && <span className="rounded-full bg-ok/10 px-2 py-0.5 text-[10.5px] font-bold text-ok">실질가 최저</span>}
            </div>
            <div className="tnum mt-2 flex items-baseline justify-between text-[12.5px] text-muted">
              <span>월 {won(r.total)}</span>
              <span className="font-bold text-orange-text">+{won(r.gift)} 돌려받기</span>
            </div>
            <div className="mt-2 border-t border-dashed border-line pt-2">
              <span className="text-[11px] text-faint">3년 실질 부담</span>
              <div className={`tnum text-[19px] font-extrabold tracking-[-0.5px] ${i === 0 ? 'text-ok' : 'text-ink'}`}>{won(r.real36)}</div>
            </div>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-4 text-label">예상 금액이며 통신사·약정·지역 조건에 따라 달라질 수 있어요. 카드를 누르면 해당 통신사 조건으로 계산기가 열립니다.</p>
    </section>
  )
}

function TrustIcon({ kind, size = 22 }) {
  const paths = {
    thumb: (
      <>
        <path d="M7 10v12" />
        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
      </>
    ),
    shield: (
      <>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    gift: (
      <>
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M12 8v13" />
        <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
        <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
      </>
    ),
    headset: (
      <>
        <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
        <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
        <path d="M21 14h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-5Z" />
      </>
    ),
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[kind]}
    </svg>
  )
}

function TrustItem({ kind, label, value, suffix, divider }) {
  const n = useCountUp(value, 800)
  return (
    <div className={`flex flex-col items-center gap-2 px-4 py-6 ${divider ? 'border-l border-line-card' : ''} ${divider === 'lg' ? 'border-l-0 lg:border-l' : ''}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-tint text-primary-text">
        <TrustIcon kind={kind} />
      </span>
      <span className="text-[12.5px] font-medium text-faint">{label}</span>
      <span className="tnum text-[21px] font-extrabold tracking-tight text-ink">{n}{suffix}</span>
    </div>
  )
}
