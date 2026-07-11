import { useId, useState } from 'react'

/* 전문용어 도움말 — 용어 뒤 (?) 아이콘에 마우스오버/포커스 시 쉬운 설명 표시.
 * 일반인도 이해할 수 있도록 어려운 용어를 그 자리에서 풀어준다. */
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
}

export default function Term({ children, def, k }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const text = def ?? TERMS[k] ?? TERMS[children]
  if (!text) return <>{children}</>
  return (
    <span className="term">
      {children}
      <button
        type="button"
        className="term-q"
        aria-label={`${typeof children === 'string' ? children : '용어'} 설명`}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
      >
        ?
      </button>
      {open && (
        <span className="term-pop" role="tooltip" id={id}>
          {text}
        </span>
      )}
    </span>
  )
}
