import { useEffect, useRef } from 'react'

const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT

/**
 * 광고 슬롯.
 *
 * 배치 원칙(MONETIZATION.md §1-A):
 *  - 목록·진단 결과처럼 "훑는 화면"에만 둔다.
 *  - **개별 요괴 상세의 본문 상단에는 두지 않는다.** 기관·지자체 협업에서 신뢰도가 깎이기 때문이다.
 *  - VITE_ADSENSE_CLIENT가 없으면 아무것도 렌더하지 않는다(빈 테두리도 남기지 않는다).
 *    개발 중 배치를 확인하려면 debug prop을 켠다.
 */
export default function AdSlot({ slot, format = 'auto', debug = false, label = '광고' }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!CLIENT || !ref.current) return
    try {
      // eslint-disable-next-line no-undef
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* 차단기·오프라인 환경에서 실패해도 페이지는 그대로 동작해야 한다 */
    }
  }, [])

  if (!CLIENT) {
    if (!debug) return null
    return (
      <div className="adslot" aria-hidden="true">
        <span className="adlabel">AD SLOT · {slot}</span>
      </div>
    )
  }

  return (
    <div className="adslot">
      <span className="adlabel">{label}</span>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
