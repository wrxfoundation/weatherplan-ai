// ─── S-01 소비자 홈 (트랙 A · 목업 #2a/#2b 재현) ─────────────────
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { CATEGORIES } from '../../lib/constants'
import { useCountUp } from '../../components/ui'

export default function Home({ tenant }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const cats = tenant ? CATEGORIES.filter((c) => tenant.cats.includes(c.slug)) : CATEGORIES
  const consultTo = tenant ? `/consult?src=${tenant.slug}` : '/consult'

  const search = () => {
    const hit = CATEGORIES.find((c) => q && (c.name.includes(q) || q.includes(c.name)))
    nav(hit ? `/category/${hit.slug}` : consultTo)
  }

  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-10">
      {/* ── 히어로 ── */}
      <section className="grid items-center gap-8 pb-10 pt-8 sm:pt-14 lg:grid-cols-[1fr_520px]">
        <div>
          {tenant && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-bold text-primary-text shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-ok animate-live" /> 모두온 공식 파트너 · {tenant.owner} 사장님이 직접 상담해요
            </div>
          )}
          <h1 className="text-[30px] font-extrabold leading-[1.32] tracking-[-0.8px] text-ink sm:text-[42px] sm:leading-[56px] sm:tracking-[-1.2px]">
            모든 서비스,<br />
            <span className="text-orange-text">{tenant ? tenant.name : '모두온'}</span>에서 한 번에
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-[26px] text-muted sm:text-[16px] sm:leading-[27px]">
            {tenant?.greeting ?? '생활의 모든 순간, 필요한 모든 서비스를 가장 합리적인 가격으로 만나보세요.'}
          </p>
          {/* 검색 바 */}
          <div className="mt-6 flex h-14 items-center overflow-hidden rounded-2xl bg-white pl-5 pr-2 shadow-card">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="찾고 있는 서비스를 검색해보세요"
              className="h-full flex-1 text-[15px] placeholder:text-disabled"
            />
            <button onClick={search} aria-label="검색" className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] font-medium text-faint">
            {['#이사', '#인터넷', '#정수기', '#렌탈', '#보험'].map((t) => (
              <button key={t} onClick={() => setQ(t.slice(1))} className="hover:text-primary-text">{t}</button>
            ))}
          </div>
        </div>
        {/* 핸드오프 #2b: 모바일에선 히어로 이미지가 검색 바 아래 전폭 */}
        <div>
          <img src="/assets/hero-scene.png" alt="모두온 3D 혜택 무대" className="w-full rounded-[22px] shadow-panel sm:rounded-[28px]" loading="eager" />
        </div>
      </section>

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

      {/* ── 혜택 섹션 ── */}
      <section className="mt-6 rounded-section bg-white p-5 shadow-card sm:p-9">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <div>
            <h2 className="text-[22px] font-extrabold leading-9 tracking-[-0.6px] text-ink sm:text-[26px]">
              {tenant ? tenant.name : '모두온'}이 드리는<br />특별한 혜택
            </h2>
            <div className="mt-6 flex flex-col gap-5">
              {[
                { t: '최대 혜택 보장', d: '같은 조건이면 더 큰 혜택으로, 숨은 지원금까지 챙겨드려요.' },
                { t: '전문 상담 지원', d: '카테고리별 전문 상담사가 평균 10분 내에 연락드려요.' },
                { t: '안전한 거래', d: '정식 등록 파트너와 본사 이중 검수로 안심하고 맡기세요.' },
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
              light label="이사 서비스" amountNum={40} obj="/assets/obj-truck.png"
              onClick={() => nav(tenant ? consultTo + '&cat=move' : '/category/move')}
            />
            <BenefitCard
              style={{ background: 'linear-gradient(180deg,#F7F3EF,#F2EDE7)' }}
              label="인터넷/TV" amountNum={47} obj="/assets/obj-wifi.png"
              onClick={() => nav(tenant ? consultTo + '&cat=internet' : '/category/internet')}
            />
            <BenefitCard
              style={{ background: 'linear-gradient(180deg,#F98974,#F7745F)' }}
              light label="정수기 렌탈" amountNum={30} obj="/assets/obj-purifier.png"
              onClick={() => nav(tenant ? consultTo + '&cat=water' : '/category/water')}
            />
          </div>
        </div>
      </section>

      {/* ── CTA 밴드 ── */}
      <section className="mt-6 overflow-hidden rounded-section bg-band shadow-panel">
        <div className="flex flex-col items-center gap-5 px-6 py-9 text-center sm:flex-row sm:justify-between sm:px-10 sm:text-left">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <img src="/assets/cta-chat.png" alt="" className="obj-mask h-[88px] w-[88px] object-contain sm:h-[112px] sm:w-[112px]" loading="lazy" />
            <div>
              <div className="text-[19px] font-extrabold leading-7 text-white sm:text-[21px]">
                {tenant ? `${tenant.name}에서 상담받고` : '모두온에서 상담받고'} 최대 혜택 받아가세요!
              </div>
              <div className="mt-1 text-[14px] font-medium text-white/75">30초 신청, 평균 10분 내 전문 상담사 연결</div>
            </div>
          </div>
          <Link to={consultTo} className="inline-flex h-[52px] shrink-0 items-center rounded-btn bg-white px-7 text-[15px] font-bold text-primary-text transition-transform hover:-translate-y-px">
            무료 상담 신청 →
          </Link>
        </div>
      </section>

      {/* ── 신뢰 지표 바 4 ── */}
      <section className="mt-6 grid grid-cols-2 rounded-section bg-white py-2 shadow-card lg:grid-cols-4">
        <TrustItem icon="/assets/tr-thumb.png" label="누적 고객 만족도" value={98} suffix="%" />
        <TrustItem icon="/assets/tr-shield.png" label="제휴 브랜드" value={250} suffix="+" divider />
        <TrustItem icon="/assets/tr-gift.png" label="연간 혜택 금액" value={120} suffix="억원+" divider="lg" />
        <TrustItem icon="/assets/tr-person.png" label="전문 상담사" value={500} suffix="+" divider />
      </section>
    </main>
  )
}

function BenefitCard({ style, light, label, amountNum, obj, onClick }) {
  return (
    <button
      onClick={onClick}
      style={style}
      className="group relative flex min-h-[150px] flex-col overflow-hidden rounded-card p-5 text-left transition-transform duration-200 hover:-translate-y-[3px] sm:min-h-[296px] sm:p-6"
    >
      <div className={`text-[14px] font-bold ${light ? 'text-white/85' : 'text-primary-text/80'}`}>{label}</div>
      <div className={`mt-1 text-[15px] font-bold leading-6 ${light ? 'text-white' : 'text-primary-text'}`}>
        최대 <span className="tnum text-[34px] font-extrabold tracking-[-1px] sm:text-[38px]">{amountNum}</span>
        <span className="text-[17px] font-bold sm:text-[19px]">만원</span><br />혜택 제공
      </div>
      <img src={obj} alt="" className="obj-mask pointer-events-none absolute -bottom-2 -right-2 h-[96px] w-[96px] object-contain sm:h-[128px] sm:w-[128px]" loading="lazy" />
      <span className={`mt-auto flex h-[34px] w-[34px] items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${light ? 'border border-white/70 text-white' : 'bg-primary text-white'}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 6l6 6-6 6" /></svg>
      </span>
    </button>
  )
}

function TrustItem({ icon, label, value, suffix, divider }) {
  const n = useCountUp(value, 800)
  return (
    <div className={`flex flex-col items-center gap-2 px-4 py-6 ${divider ? 'border-l border-line-card' : ''} ${divider === 'lg' ? 'border-l-0 lg:border-l' : ''}`}>
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-warm">
        <img src={icon} alt="" className="h-full w-full object-cover" loading="lazy" />
      </span>
      <span className="text-[12.5px] font-medium text-faint">{label}</span>
      <span className="tnum text-[21px] font-extrabold tracking-tight text-ink">{n}{suffix}</span>
    </div>
  )
}
