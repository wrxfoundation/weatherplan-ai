// ─── S-05 쇼핑몰 (준비 중) ───────────────────────────────────────────
// 제휴 특가·복지몰은 아직 상품 소싱 단계라 목록 대신 "무엇이 열릴지"와
// 열리면 알려줄 통로는 제자리 알림 신청(혜택 허브 멤버십몰 카드와 같은 localStorage 키). 없는 상품을 있는 척 진열하지 않는다.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { VISIBLE_CATEGORIES } from '../../lib/constants'
import { SafeImg, useToast } from '../../components/ui'
import { IcBell, IcCheck } from '../../components/icons'

const MALL_NOTIFY_KEY = 'moduon_mall_notify' // Benefits.jsx 멤버십몰 카드와 공유

const PLANNED = [
  { t: '제휴 특가 구매', d: 'TV·세탁기·냉장고 등 대형가전을 제휴가로. 설치 일정까지 함께 잡아드려요.' },
  { t: '생활 필수품', d: '입주청소·중고폰 매입처럼 이사·개통과 같이 필요한 서비스를 한 곳에서.' },
  { t: '적립 포인트 사용처', d: '개통·설치로 쌓인 포인트를 쓸 수 있는 상품을 채워가는 중입니다.' },
]

export default function Shop() {
  const toast = useToast()
  const [notified, setNotified] = useState(() => { try { return localStorage.getItem(MALL_NOTIFY_KEY) === 'true' } catch { return false } })
  const notify = () => {
    try { localStorage.setItem(MALL_NOTIFY_KEY, 'true') } catch { /* noop */ }
    setNotified(true); toast('오픈하면 가장 먼저 알려드릴게요')
  }
  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 sm:px-10">
      <section className="mt-8 rounded-section bg-white px-6 py-12 text-center shadow-card sm:mt-12 sm:px-10 sm:py-16">
        <SafeImg src="/assets/cat-shop.png" className="mx-auto h-[96px] w-[96px] object-contain sm:h-[120px] sm:w-[120px]" />
        <span className="mt-4 inline-block rounded-full bg-tint px-3 py-1 text-[12px] font-bold text-primary-text">준비 중</span>
        <h1 className="mt-3 text-[24px] font-extrabold tracking-[-0.6px] text-ink sm:text-[28px]">쇼핑몰을 준비하고 있어요</h1>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-[24px] text-body">
          지금은 인터넷·휴대폰·렌탈 상담부터 열었습니다.<br className="hidden sm:block" />
          제휴 특가 상품은 소싱이 끝나는 대로 이곳에 올라갑니다.
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
          {PLANNED.map((p) => (
            <div key={p.t} className="rounded-card border border-line-card bg-cream/60 p-4">
              <div className="text-[14px] font-bold text-ink">{p.t}</div>
              <p className="mt-1.5 text-[12.5px] leading-[19px] text-muted">{p.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button type="button" onClick={notify} disabled={notified} data-t="mall-notify"
            className={`inline-flex h-[52px] items-center gap-2 rounded-btn px-8 text-[15px] font-bold transition-colors ${notified ? 'bg-tint text-primary-text' : 'shimmer-cta glass-btn-cta bg-primary text-white hover:bg-primary-hover'}`}>
            {notified ? <><IcCheck size={16} /> 오픈 알림 신청 완료</> : <><IcBell size={16} /> 열리면 알려주세요</>}
          </button>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[13px] font-bold text-primary-text">
            {VISIBLE_CATEGORIES.map((c) => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="hover:underline">{c.name} 보러가기 →</Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
