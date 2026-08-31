// ─── 휴대폰 빠른 상담 — 지금 쓰는 통신사 + 관심 기종 ───────────────────
// 휴대폰에만 해당하는 질문이라 전 카테고리 공통인 히어로가 아니라 휴대폰 안에 둔다.
// 기종에는 "없어요 / 나중에" 퇴로를 같은 무게로 둔다 — 고를 게 없으면 고객은
// 그냥 떠나기 때문에, 퇴로가 곧 상담 진입로가 된다.
import { useState } from 'react'
import { Link } from 'react-router-dom'

export const CUR_CARRIERS = ['SK', 'KT', 'LG U+', '알뜰폰']
export const DEVICE_CHOICES = [
  { key: 'fold8', label: '갤럭시 Z 폴드8' },
  { key: 's26u', label: '갤럭시 S26 울트라' },
  { key: 'ip17', label: '아이폰 17 프로' },
  { key: 'a56', label: '갤럭시 A56' },
  { key: 'none', label: '원하는 기종이 없어요', escape: true },
  { key: 'later', label: '상담 후 결정할게요', escape: true },
]
const deviceLabel = (k) => DEVICE_CHOICES.find((d) => d.key === k)?.label ?? ''

export default function PhoneQuickStart({ consultTo = '/consult?cat=phone' }) {
  const [carrier, setCarrier] = useState('')
  const [device, setDevice] = useState('')

  // 선택값은 두 갈래 모두에 실어 보낸다 — 상담사는 쿼리로, AI는 첫 질문으로.
  // 아무것도 안 골라도 진행된다(선택은 상담을 짧게 할 뿐, 조건이 아니다).
  const consultHref = (() => {
    const p = new URLSearchParams()
    if (carrier) p.set('cur', carrier)
    if (device === 'none') p.set('note', '원하는 기종 없음')
    else if (device === 'later') p.set('note', '상담 후 기종 결정')
    else if (device) p.set('device', device)
    const q = p.toString()
    return q ? consultTo + (consultTo.includes('?') ? '&' : '?') + q : consultTo
  })()

  const aiSeed = (() => {
    const cur = carrier ? `지금 ${carrier} 쓰고 있어요.` : ''
    if (device === 'none') return `${cur} 원하는 기종이 목록에 없는데 어떻게 알아보면 되나요?`.trim()
    if (device === 'later') return `${cur} 기종은 아직 못 정했는데 요금부터 계산해 주세요.`.trim()
    if (device) return `${cur} ${deviceLabel(device)}로 바꾸면 월 얼마인가요?`.trim()
    return `${cur} 지금 휴대폰 요금이 적정한지 계산해 주세요.`.trim()
  })()

  return (
    <section className="mt-6 rounded-section bg-white p-5 shadow-card sm:p-7">
      <h2 className="text-[17px] font-extrabold text-ink">두 가지만 고르면 바로 계산해 드려요</h2>
      <p className="mt-1 text-[13px] text-muted">아직 안 정하셨어도 괜찮아요 — 그대로 상담으로 넘어갑니다.</p>

      <div className="mt-5">
        <div className="text-[12.5px] font-bold text-label">지금 쓰시는 통신사</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {CUR_CARRIERS.map((c) => (
            <button
              key={c}
              onClick={() => setCarrier(carrier === c ? '' : c)}
              aria-pressed={carrier === c}
              className={`h-9 rounded-full border px-4 text-[12.5px] font-bold transition-colors ${carrier === c ? 'border-primary bg-primary text-white' : 'border-line bg-white text-label hover:border-primary/60'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[12.5px] font-bold text-label">관심 있는 기종</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {DEVICE_CHOICES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDevice(device === d.key ? '' : d.key)}
              aria-pressed={device === d.key}
              className={`h-9 rounded-full border px-4 text-[12.5px] font-bold transition-colors ${
                device === d.key ? 'border-primary bg-primary text-white'
                  : d.escape ? 'border-dashed border-line bg-cream/60 text-muted hover:border-primary/60'
                  : 'border-line bg-white text-label hover:border-primary/60'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('moduon:chat-open', { detail: { seed: aiSeed } }))}
            className="glass-btn-cta inline-flex h-[56px] w-full items-center justify-center rounded-btn bg-primary px-4 text-[15.5px] font-extrabold text-white transition-colors hover:bg-primary-hover"
          >
            AI와 상담할게요
          </button>
          <p className="mt-1.5 text-[12px] font-semibold text-label">바꾸라고 하지 않아요. <span className="text-primary-text">먼저 계산부터 해드려요.</span></p>
        </div>
        <div>
          <Link
            to={consultHref}
            className="shimmer-cta glass-btn inline-flex h-[56px] w-full items-center justify-center rounded-btn border-[1.5px] border-primary bg-white px-4 text-[15.5px] font-extrabold text-primary-text transition-colors hover:bg-tint"
          >
            전문 상담사랑 상담할게요
          </Link>
          <p className="mt-1.5 text-[12px] font-semibold text-label">평균 10분 내 콜백, 통화는 무료예요.</p>
        </div>
      </div>
    </section>
  )
}
