// ─── S-01 소비자 홈 (트랙 A · 목업 #2a/#2b 재현) ─────────────────
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CATEGORIES } from '../../lib/constants'
import { won } from '../../lib/engine'
import { useCountUp } from '../../components/ui'
import Reviews from '../../components/Reviews'

// 검색 동의어 — 흔히 치는 말을 카테고리 슬러그로 정규화 (이름 스캔보다 먼저 본다)
const SYNONYM = {
  tv: 'internet', 티비: 'internet', 와이파이: 'internet', 인터넷: 'internet',
  핸드폰: 'phone', 휴대전화: 'phone', 폰: 'phone', 요금제: 'phone',
  청소: 'etc', 에어컨: 'appliance', 냉장고: 'appliance', 세탁기: 'appliance',
  안마의자: 'rental', 매트리스: 'rental', 비데: 'rental',
}

export default function Home({ tenant }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const cats = tenant ? CATEGORIES.filter((c) => tenant.cats.includes(c.slug)) : CATEGORIES
  const consultTo = tenant ? `/consult?src=${tenant.slug}` : '/consult'

  const search = (term = q) => {
    const s = String(term).trim().toLowerCase()
    const hit = (SYNONYM[s] && CATEGORIES.find((c) => c.slug === SYNONYM[s]))
      || CATEGORIES.find((c) => s && (c.name.includes(s) || s.includes(c.name)))
    nav(hit ? `/category/${hit.slug}` : consultTo)
  }

  return (
    <main>
      {/* ── 히어로 — 풀블리드 배경 (Higgsfield C4D 씬이 섹션 전체를 덮는다) ── */}
      <section className="relative overflow-hidden bg-cream">
        {/* 와이드 PC 과확대 방지: 씬을 1760px 상한 박스에 두고 lg부터는 원본 비율 그대로(contain)
            우측 정렬 — 씬 배경이 크림이라 박스 밖 여백과 이음새 없이 이어진다 */}
        <div className="absolute inset-0 mx-auto max-w-[1760px]">
          <HeroScene />
          {/* 좌측 텍스트 가독 스크림 */}
          <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/85 to-cream/5 sm:via-cream/70" />
          {/* 영상 하단·좌하단 끝선을 크림으로 용해 — 범위는 낮게(이미지 가림 최소) */}
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-cream via-cream/45 to-transparent" />
          <div className="absolute bottom-0 left-0 h-[44%] w-[50%] bg-gradient-to-tr from-cream via-cream/35 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-cream sm:h-24" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-10">
          {/* 절약 말풍선 2종 — 씬 위 중앙(우측 텍스트단 밖)에 부유. AI 영상 속 글자는 뭉개지므로 DOM으로 */}
          {!tenant && <SavingsBubbles />}
          <div className="flex min-h-[480px] max-w-xl flex-col justify-center py-14 sm:min-h-[600px] sm:py-20">
            {tenant ? (
              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-primary-text shadow-card">
                <span className="h-1.5 w-1.5 rounded-full bg-ok animate-live" /> 모두온 공식 파트너 · {tenant.owner} 사장님이 직접 상담해요
              </div>
            ) : (
              <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-primary-text shadow-card">
                <span className="h-1.5 w-1.5 rounded-full bg-ok animate-live" /> 이번 달 아낄 돈 + 놓친 지원금까지 한 번에
              </div>
            )}
            <h1 className="text-[32px] font-extrabold leading-[1.3] tracking-[-0.8px] text-ink sm:text-[44px] sm:leading-[58px] sm:tracking-[-1.2px]">
              왕창 아끼고, 돌려받는 곳<br />
              바로 <span className="text-orange-text">{tenant ? tenant.name : '모두온'}</span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-[26px] text-body sm:text-[16.5px] sm:leading-[28px]">
              {tenant?.greeting ?? '인터넷·휴대폰·이사·정수기… 흩어진 생활서비스를 한 곳에서 비교하고, 남들 몰라서 못 받은 지원금까지 왕창 돌려받으세요.'}
            </p>
            {/* 검색 바 */}
            <div className="mt-7 flex h-14 items-center overflow-hidden rounded-2xl bg-white pl-5 pr-2 shadow-panel">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
                placeholder="찾고 있는 서비스를 검색해보세요"
                className="h-full flex-1 text-[16px] placeholder:text-disabled sm:text-[15px]"
              />
              <button onClick={() => search()} aria-label="검색" className="glass-btn-cta flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] font-semibold text-label">
              {/* 해시태그 = 즉시 검색 실행 (입력만 채우고 끝나지 않는다) */}
              {['#이사', '#인터넷', '#정수기', '#렌탈', '#보험'].map((t) => (
                <button key={t} onClick={() => { setQ(t.slice(1)); search(t.slice(1)) }} className="hover:text-primary-text">{t}</button>
              ))}
            </div>
            {/* 히어로 CTA — 검색을 건너뛰는 방문자용 직행 경로 */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2.5">
              <Link to={consultTo} className="shimmer-cta glass-btn-cta inline-flex h-[50px] items-center rounded-btn bg-primary px-7 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover">무료 상담 신청</Link>
              <Link to="/payouts" className="text-[13.5px] font-bold text-primary-text hover:underline">실제 지급내역 보기 →</Link>
            </div>
            {/* 모바일 절약 증거 — 데스크톱 말풍선(SavingsBubbles) 대응 한 줄 칩 (점만 살아있게) */}
            <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-3.5 py-2 shadow-card lg:hidden">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok animate-live" />
              <span className="tnum whitespace-nowrap text-[12px] font-bold text-ink">인터넷/TV 월 32,900원 · <span className="text-ok">↓11,100원 아끼는 중</span></span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 sm:px-10">

      {/* ── 카테고리 그리드 8 ── */}
      <section className="rounded-section bg-white px-5 py-7 shadow-card sm:px-9 sm:py-9">
        <div className="grid grid-cols-4 gap-x-2 gap-y-6 sm:gap-x-4 lg:grid-cols-8">
          {cats.map((c) => (
            <Link key={c.slug} to={tenant ? `${consultTo}&cat=${c.slug}` : `/category/${c.slug}`} className="group flex flex-col items-center gap-2.5">
              <span className="flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full bg-warm transition-transform duration-200 group-hover:-translate-y-[3px] sm:h-[84px] sm:w-[84px]">
                <img src={c.icon} alt="" className="h-full w-full object-cover" loading="lazy" />
              </span>
              <span className="text-[12px] font-semibold text-body sm:text-[14px]">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <SupportBand />

      {/* ── 혜택 섹션 ── */}
      <section className="mt-6 rounded-section bg-white p-5 shadow-card sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <div>
            <h2 className="text-[22px] font-extrabold leading-9 tracking-[-0.6px] text-ink sm:text-[26px]">
              몰라서 못 챙긴 혜택,<br />모두온이 다 찾아드려요
            </h2>
            <div className="mt-6 flex flex-col gap-5">
              {[
                { t: '같은 조건, 더 큰 혜택', d: '어차피 가입할 거, 숨은 지원금까지 끝까지 비교해 챙겨드려요.' },
                { t: '10분 안에 전문가 콜백', d: '카테고리별 전문 상담사가 평균 10분 내 직접 전화드려요.' },
                { t: '본사 이중검수로 안심', d: '정식 등록 파트너 + 본사 검수로 계약부터 설치까지 책임집니다.' },
              ].map((b) => (
                <div key={b.t} className="flex gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint text-primary-text">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12.5 5 5 10-11" /></svg>
                  </span>
                  <div>
                    <div className="text-[15px] font-bold text-ink">{b.t}</div>
                    <div className="mt-0.5 text-[13px] leading-5 text-muted">{b.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <BenefitCard
              style={{ background: 'linear-gradient(180deg,#5B80D9,#5174CD)' }}
              edge="rgba(26,50,168,0.66)"
              light label="이사 서비스" amountNum={40} obj="/assets/obj-truck.webp"
              onClick={() => nav(tenant ? consultTo + '&cat=move' : '/category/move')}
            />
            <BenefitCard
              style={{ background: 'linear-gradient(180deg,#EAF0FB,#F1ECE4)' }}
              edge="rgba(83,119,214,0.30)"
              label="인터넷/TV" amountNum={47} obj="/assets/obj-wifi.webp"
              onClick={() => nav(tenant ? consultTo + '&cat=internet' : '/category/internet')}
            />
            <BenefitCard
              style={{ background: 'linear-gradient(180deg,#F98974,#F7745F)' }}
              edge="rgba(202,56,30,0.62)"
              light label="정수기 렌탈" amountNum={30} obj="/assets/obj-purifier.webp"
              onClick={() => nav(tenant ? consultTo + '&cat=water' : '/category/water')}
            />
          </div>
        </div>
      </section>

      {/* ── CTA 밴드 (파스텔 그린 · 좌상단 진한 엣지 + 유리 두께감) ── */}
      <section className="relative mt-6 overflow-hidden rounded-section" style={{ background: 'linear-gradient(135deg,#DFF3E8 0%,#C2E7D2 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 1px rgba(23,120,70,0.10), 0 12px 34px rgba(23,178,106,0.20)' }}>
        {/* 좌상단 진한 동색 엣지(시선 유도) + 유리 엣지 하이라이트 */}
        <span aria-hidden className="pointer-events-none absolute inset-0 z-0 rounded-section" style={{ background: 'linear-gradient(135deg, rgba(17,138,80,0.62) 0%, rgba(17,138,80,0.18) 26%, transparent 50%)', boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.38)' }} />
        <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-9 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <img src="/assets/cta-chat.webp" alt="" className="h-[88px] w-[88px] object-contain sm:h-[112px] sm:w-[112px]" loading="lazy" />
            <div>
              <div className="text-[19px] font-extrabold leading-7 text-[#15613D] sm:text-[21px]">
                지금 신청하면, 이번 달부터 아낍니다
              </div>
              <div className="mt-1 text-[14px] font-medium text-[#37694F]">30초면 끝 · 평균 10분 안에 전문 상담사가 전화드려요</div>
            </div>
          </div>
          <Link to={consultTo} className="shimmer-cta shimmer-green glass-btn inline-flex h-[52px] shrink-0 items-center rounded-btn bg-white px-7 text-[15px] font-bold text-[#0C7D48] transition-transform hover:-translate-y-px">
            무료 상담 신청 →
          </Link>
        </div>
      </section>

      {/* ── 신뢰 지표 바 4 — 소형 아이콘은 SVG 라인으로 단순화 ── */}
      <section className="mt-6 grid grid-cols-2 rounded-section bg-white py-2 shadow-card lg:grid-cols-4">
        <TrustItem kind="thumb" label="누적 고객 만족도" value={98} suffix="%" />
        <TrustItem kind="shield" label="제휴 브랜드" value={250} suffix="+" divider />
        <TrustItem kind="gift" label="연간 혜택 금액" value={120} suffix="억원+" divider="lg" />
        <TrustItem kind="headset" label="전문 상담사" value={500} suffix="+" divider />
      </section>

      <Reviews />
      </div>
    </main>
  )
}

// ─── 지원금 소구 밴드 — "최대 지원금 왕창 돌려드린다"(직접 판매 구조·조건부·표시광고법 안전) ──
// 아정당식 돈주머니 + 점선 커넥터 + 코인 칩. 합계 152만원+ = 4개 카테고리 최대치 합과 일치.
function SupportBand() {
  // 칩 = 카테고리별 최대 혜택(혜택카드·constants와 정합). 합 45+47+30+30 = 152만원+
  const chips = [
    { c: '휴대폰', v: '45만원+', left: '24%', top: '31%' },
    { c: '인터넷/TV', v: '47만원+', left: '77%', top: '30%' },
    { c: '정수기', v: '30만원+', left: '23%', top: '72%' },
    { c: '가전렌탈', v: '30만원+', left: '77%', top: '71%' },
  ]
  return (
    <section className="mt-6 overflow-hidden rounded-section bg-gradient-to-b from-[#E9F0FE] to-[#F5F8FF] px-6 py-8 shadow-card sm:px-10 sm:py-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[12.5px] font-bold text-primary-text">
            <span className="h-1.5 w-1.5 rounded-full bg-orange" /> 남들 받는 그 이상, 모두온이 돌려드려요
          </div>
          <h2 className="mt-3 text-[25px] font-extrabold leading-[1.32] tracking-[-0.6px] text-ink sm:text-[32px]">
            몰라서 못 받은 지원금,<br />최대 <span className="tnum text-orange-text">152만원+</span> 왕창 돌려드려요
          </h2>
          <p className="mt-3 max-w-lg text-[14px] leading-[23px] text-muted sm:text-[15px]">
            모두온은 <strong className="font-bold text-ink">유통 단계를 줄인 직접 판매 구조</strong>예요. 중간 마진을 덜어낸 만큼, 조건이 맞으면 <strong className="font-bold text-primary-text">다른 곳에선 처음 보는 혜택</strong>까지 그대로 돌려드립니다.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link to="/consult" className="shimmer-cta glass-btn-cta inline-flex h-[50px] items-center rounded-btn bg-primary px-7 text-[15px] font-bold text-white transition-colors hover:bg-primary-hover">내 지원금 확인하기 →</Link>
            <Link to="/payouts" className="text-[13.5px] font-bold text-primary-text hover:underline">실제 지급내역 보기 →</Link>
          </div>
          <p className="mt-3 text-[11px] leading-4 text-label">지원금·사은품은 통신사·요금제·약정·기간·재고·지역·심사 결과에 따라 달라지며, 최대 금액은 조건 충족 시 기준입니다.</p>
        </div>

        {/* 지원금 주머니 + 점선 커넥터 + 카테고리 칩 */}
        <div className="relative mx-auto w-full max-w-[440px]">
          <div className="relative w-full" style={{ paddingBottom: '68%' }}>
            {/* 점선 커넥터 (칩 중심 좌표와 정렬) */}
            <svg viewBox="0 0 440 300" className="absolute inset-0 h-full w-full" aria-hidden>
              <g stroke="#9DB0E8" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" fill="none">
                <path d="M188 128 L128 104" /><path d="M256 126 L318 100" />
                <path d="M188 178 L124 214" /><path d="M254 180 L318 210" />
              </g>
              <g fill="#7E95DD">
                <circle cx="188" cy="128" r="3" /><circle cx="256" cy="126" r="3" />
                <circle cx="188" cy="178" r="3" /><circle cx="254" cy="180" r="3" />
              </g>
            </svg>
            {/* 돈주머니 (다홍색 가죽 3D · 배경 제거 이미지 · 천천히 둥둥) */}
            <div className="absolute left-1/2 top-1/2 h-[58%] aspect-square -translate-x-1/2 -translate-y-1/2">
              <img src="/assets/obj-moneybag.png" alt="지원금 주머니" className="animate-bagfloat h-full w-full object-contain" style={{ filter: 'drop-shadow(0 14px 22px rgba(214,74,38,0.28))' }} loading="lazy" />
            </div>
            {/* 카테고리 칩 */}
            {chips.map((ch) => (
              <div
                key={ch.c}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white px-3 py-2 shadow-card ring-1 ring-black/[0.03]"
                style={{ left: ch.left, top: ch.top }}
              >
                <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white shadow-sm" style={{ background: 'linear-gradient(150deg,#FBD34D,#F0A81E)' }}>₩</span>
                <span className="whitespace-nowrap text-[12.5px] font-bold text-ink">{ch.c} <span className="text-primary-text">{ch.v}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function BenefitCard({ style, edge, light, label, amountNum, obj, onClick }) {
  return (
    <button
      onClick={onClick}
      style={style}
      className="glass-sheen group relative flex min-h-[150px] flex-col overflow-hidden rounded-card p-5 text-left transition-transform duration-200 hover:-translate-y-[3px] sm:min-h-[296px] sm:p-6"
    >
      {/* 좌측상단 진한 톤(동색 채도↑) 엣지 — 시선 유도, 하단 우측은 원톤 유지 */}
      <span aria-hidden className="pointer-events-none absolute inset-0 z-0 rounded-card" style={{ background: `linear-gradient(135deg, ${edge} 0%, transparent 55%)`, boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.25)' }} />
      <div className={`relative z-10 text-[14px] font-bold ${light ? 'text-white/85' : 'text-primary-text/90'}`}>{label}</div>
      <div className={`relative z-10 mt-1 text-[15px] font-bold leading-6 ${light ? 'text-white' : 'text-primary-text'}`}>
        최대 <span className="tnum text-[34px] font-extrabold tracking-[-1px] sm:text-[38px]">{amountNum}</span>
        <span className="text-[17px] font-bold sm:text-[19px]">만원</span><br />혜택 제공
      </div>
      <img src={obj} alt="" className="pointer-events-none absolute -bottom-2 -right-2 z-[1] h-[96px] w-[96px] object-contain sm:h-[128px] sm:w-[128px]" loading="lazy" />
      <span className={`relative z-10 mt-auto flex h-[34px] w-[34px] items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${light ? 'border border-white/70 text-white' : 'bg-primary text-white'}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
      </span>
    </button>
  )
}

// 히어로 씬 — 배경 루프 영상 + 정지 이미지 폴백.
// 배경 장식에 사용자 데이터·배터리를 쓰지 않는다: 모션 최소화 설정·데이터 절약·2G면 영상 생략 (kcare 흡수)
function HeroScene() {
  const [video, setVideo] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const c = navigator.connection
    const slow = c?.saveData === true || /^(slow-)?2g$/.test(c?.effectiveType || '')
    if (!reduce && !slow) setVideo(true)
  }, [])
  const cls = 'h-full w-full object-cover object-[68%_center] lg:object-contain lg:object-right'
  if (video) {
    return (
      <video
        className={cls}
        autoPlay muted loop playsInline
        poster="/assets/hero-scene.jpg"
        aria-hidden
        onError={() => setVideo(false)}
      >
        <source src="/assets/hero-video.mp4" type="video/mp4" />
      </video>
    )
  }
  return <img src="/assets/hero-scene.jpg" alt="" aria-hidden className={cls} loading="eager" fetchPriority="high" />
}

// 절약 카운터 루프 — START→END로 계산되며 내려가는 값(여러 말풍선이 공유). 끝에서 잠깐 멈췄다 리셋 반복
function useSavingLoop(START, END, { dur = 1400, hold = 2600, gap = 800, delay = 900 } = {}) {
  const [v, setV] = useState(START)
  useEffect(() => {
    let timer, raf
    const count = () => {
      const t0 = performance.now()
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur)
        setV(Math.round(START + (END - START) * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf = requestAnimationFrame(step)
        else timer = setTimeout(() => { setV(START); timer = setTimeout(count, gap) }, hold)
      }
      raf = requestAnimationFrame(step)
    }
    timer = setTimeout(count, delay)
    return () => { clearTimeout(timer); cancelAnimationFrame(raf) }
  }, [])
  return v
}

// 가격 절약 말풍선(꼬리 달린) — 히어로 위 부유
function PriceBubble({ tag, value, save, hint, tail = 'left' }) {
  return (
    <div className={`price-bubble tail-${tail} rounded-card px-5 py-4`}>
      <div className="text-[11.5px] font-bold text-faint">{tag}</div>
      <div className="tnum mt-0.5 text-[26px] font-extrabold tracking-tight text-ink">{value}</div>
      <div className={`tnum mt-0.5 text-[12.5px] font-extrabold ${save > 0 ? 'text-ok' : 'text-disabled'}`}>
        {save > 0 ? `↓ ${won(save)} 아끼는 중` : hint}
      </div>
    </div>
  )
}

// 히어로 중앙 절약 말풍선 2종 — 인터넷/TV · 휴대폰 (좌측 텍스트단 밖, 중앙~우측에 스태거 배치)
function SavingsBubbles() {
  const net = useSavingLoop(44000, 32900, { delay: 900 })
  const phone = useSavingLoop(78000, 45000, { delay: 1700, dur: 1600 })
  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      <div className="animate-floaty absolute left-[50%] top-[18%]">
        <PriceBubble tail="left" tag="인터넷/TV 월 요금 계산 중…" value={won(net)} save={44000 - net} hint="결합 할인 적용하면?" />
      </div>
      <div className="animate-floaty absolute left-[62%] top-[49%]" style={{ animationDelay: '1.1s' }}>
        <PriceBubble tail="right" tag="휴대폰 통신비 비교 중…" value={won(phone)} save={78000 - phone} hint="선택약정 적용하면?" />
      </div>
    </div>
  )
}

function TrustIcon({ kind }) {
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
