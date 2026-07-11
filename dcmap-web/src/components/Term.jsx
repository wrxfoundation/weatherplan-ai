import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/* 전문용어 도움말 — 용어 뒤 (?) 아이콘에 마우스오버/포커스 시 쉬운 설명 표시.
 * 일반인도 이해할 수 있도록 어려운 용어를 그 자리에서 풀어준다.
 * 팝업은 viewport 기준 fixed 좌표로 띄워 스크롤 컨테이너(사이드패널 등)에 잘리지 않는다. */
export const TERMS = {
  PUE: '전력효율지수(Power Usage Effectiveness). 데이터센터 전체 전력 ÷ IT 장비 전력. 1에 가까울수록 냉각 등 부대 전력 낭비가 적다(1.5=낭비 50%).',
  계약전력: '한전과 계약하는 최대 사용 전력(kW). 이 값으로 수전전압·기본요금·설비가 정해진다.',
  수전전압: '한전에서 전기를 받아오는 전압. 용량이 클수록 높은 전압(22.9kV→154kV)으로 받아야 한다.',
  '154kV': '15만4천 볼트 특별고압. 40MW를 넘는 대형 시설이 의무적으로 받는 전압 — 자체 변전설비 투자가 필요하다.',
  '22.9kV': '2만2천9백 볼트 고압. 20MW 이하 시설이 배전망에서 받는 일반적인 전압.',
  전력계통영향평가: '10MW 이상 신규 대형 수요가 전력망(계통)에 주는 영향을 사전 심의하는 제도. 통과해야 전기를 받을 수 있다.',
  '±15점': '전력계통영향평가에서 입지에 따라 최대 ±15점을 가감하는 배점. 수도권은 감점, 비수도권은 가점으로 지방 분산을 유도한다.',
  이중화: '전력을 여유 있게 설계하는 것. N+1은 예비 1계통, 2N은 완전 이중(금융·미션크리티컬)으로 정전 위험을 낮춘다.',
  화이트스페이스: '서버 랙이 놓이는 실제 전산실 바닥 면적(㎡). 통로·냉방설비 공간을 포함한다.',
  계통여유: '해당 지역 전력망이 신규 수요를 더 받아줄 수 있는 여유용량(헤드룸). 클수록 대형 시설 유치가 쉽다.',
  헤드룸: '전력망에 남은 여유용량. 계통 여유와 같은 뜻.',
  전기사용예정통지: '5,000kW(5MW) 이상 신규 수요가 한전에 미리 사용 계획을 알리는 절차.',
  프리쿨링: '외부 찬 공기·물로 냉방하는 방식. 서늘한 입지는 냉방 전력을 아껴 PUE를 낮춘다.',
  RE100: '사용 전력의 100%를 재생에너지로 조달하겠다는 캠페인. 글로벌 고객사가 데이터센터에 요구한다.',
  PPA: '전력구매계약(Power Purchase Agreement). 발전사와 직접 장기 전력 구매를 계약하는 방식.',
  // 지점 분석 축 용어
  용도지역: '토지의 쓰임새(주거·상업·공업·녹지 등)를 정해 건축 가능 여부와 규모를 규제하는 도시계획 구분. 데이터센터는 공업지역·계획관리지역 등에서 허용된다.',
  침수심: '홍수 시 예상되는 물의 깊이(m). 데이터센터는 침수에 치명적이라 침수구역 여부·침수심이 입지 리스크의 핵심이다.',
  인구격자: '통계청이 인구를 일정 격자(100m·1km)로 집계한 데이터. 반경 내 인구가 많을수록 소음·경관 민원 리스크가 커진다(민원 프록시).',
  육양국: '해저케이블이 육지로 올라오는 지점(CLS, 부산 송정·거제 등). 국제 트래픽 지연·다중 리전 구성에 직결된다.',
  백본: '통신망의 중심 간선망과 인터넷 교환점(IX). 가까울수록 지연시간이 짧고 다중 리전 구성이 유리하다.',
  지가변동률: '해당 지역 땅값의 기간 대비 변동률(%). 입지 비용과 개발 압력의 신호로 읽는다.',
  발전단지: '원전·석탄·LNG 등 대형 발전소가 모인 단지. 다만 전력은 풀(pool) 계통으로 공급돼 특정 DC와 직접 매칭되지 않는다(근접성 맥락).',
}

const POP_W = 260

export default function Term({ children, def, k }) {
  const [pos, setPos] = useState(null) // {top,left} viewport 좌표 | null(닫힘)
  const btnRef = useRef(null)
  const id = useId()
  const text = def ?? TERMS[k] ?? TERMS[children]
  if (!text) return <>{children}</>

  const open = () => {
    const el = btnRef.current
    if (!el || typeof window === 'undefined') return
    const r = el.getBoundingClientRect()
    const left = Math.max(8, Math.min(r.left, window.innerWidth - POP_W - 8))
    setPos({ top: r.bottom + 6, left })
  }
  const close = () => setPos(null)

  return (
    <span className="term">
      {children}
      <button
        ref={btnRef}
        type="button"
        className="term-q"
        aria-label={`${typeof children === 'string' ? children : '용어'} 설명`}
        aria-describedby={pos ? id : undefined}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onClick={(e) => {
          e.preventDefault()
          pos ? close() : open()
        }}
      >
        ?
      </button>
      {pos &&
        typeof document !== 'undefined' &&
        createPortal(
          // body에 포탈 — 사이드패널의 backdrop-filter가 fixed 기준점을 바꾸는 것 방지
          <span
            className="term-pop"
            role="tooltip"
            id={id}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: POP_W }}
            ref={(el) => {
              if (!el || typeof window === 'undefined') return
              const r = el.getBoundingClientRect()
              const bt = btnRef.current?.getBoundingClientRect()
              if (r.bottom > window.innerHeight - 8 && bt) el.style.top = `${Math.max(8, bt.top - r.height - 6)}px`
              if (r.right > window.innerWidth - 8) el.style.left = `${Math.max(8, window.innerWidth - r.width - 8)}px`
            }}
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  )
}
