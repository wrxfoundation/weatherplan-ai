// ─── 온보딩 설문 스키마 (아정당식 3문항 위저드) ────────────────────────
// 핵심은 질문 수가 아니라 "질문마다 붙는 교육형 팁"이다. 고객이 답을 고르는
// 동안 판단 기준을 같이 배우게 만들어, 상담 전에 이미 신뢰가 쌓이게 한다.
// 답변은 그대로 견적 계산기 프리필로 넘어간다(다시 묻지 않는다).

// 통신사 — 정규(MNO)와 알뜰(MVNO/케이블)을 한 줄에 두고 배지로만 구분한다.
export const NET_CARRIERS = [
  { key: 'KT', name: 'KT', sub: '케이티', tags: ['#99%대칭형인터넷', '#빠른속도'], mark: 'kt', color: '#E60012' },
  { key: 'LG U+', name: 'LG U+', sub: 'LG유플러스', tags: ['#TV콘텐츠_최강자', '#알뜰폰결합'], mark: 'U+', color: '#ED008C' },
  { key: 'SK브로드밴드', name: 'SK', sub: 'SK브로드밴드', tags: ['#타사대비저렴', '#애플TV제휴'], mark: 'SKB', color: '#EA1917' },
  { key: 'skylife', name: 'skylife', sub: '스카이라이프', tags: ['#저렴한요금', '#낮은영상화질'], mark: 'sky', color: '#0B4DA2', budget: true },
  { key: 'hellovision', name: 'HelloVision', sub: 'LG헬로비전', tags: ['#타통신사결합가능', '#설치지역제한'], mark: 'hello', color: '#E4002B', budget: true },
  { key: 'skb-budget', name: 'B', sub: 'SK브로드밴드(알뜰)', tags: ['#가장저렴한요금', '#설치지역제한'], mark: 'B', color: '#3617CE', budget: true },
]

export const PHONE_CARRIERS = [
  { key: 'KT', name: 'KT', sub: '케이티', tags: ['#멤버십혜택', '#결합할인'], mark: 'kt', color: '#E60012' },
  { key: 'SKT', name: 'SK', sub: 'SK텔레콤', tags: ['#커버리지1위', '#T멤버십'], mark: 'SKT', color: '#EA1917' },
  { key: 'LG U+', name: 'LG U+', sub: 'LG유플러스', tags: ['#지원금강세', '#유플레이'], mark: 'U+', color: '#ED008C' },
  { key: 'mvno', name: 'MVNO', sub: '알뜰폰', tags: ['#반값요금', '#약정없음'], mark: '알뜰', color: '#6B7280', budget: true },
]

// 인터넷 3문항
export const NET_STEPS = [
  {
    id: 'carriers', multi: true, required: true,
    q: '가입하려는 통신사가 있으신가요?', sub: '원하시는 통신사를 모두 골라보세요',
    kind: 'carrier', options: NET_CARRIERS,
    tips: [{
      t: '통신사를 못 고르겠다면 비워두셔도 돼요',
      d: ['설치 가능 여부와 사은품은 주소·시기에 따라 매달 달라져요.', '모두 비교해 가장 많이 돌려받는 곳으로 안내해 드릴게요.'],
    }],
  },
  {
    id: 'speed', required: true,
    q: '인터넷 속도는 얼마나', q2: '빠른 상품으로 추천해드릴까요?',
    options: [
      { key: '100M', label: '100Mbps', desc: '웹서핑, 카톡' },
      { key: '500M', label: '500Mbps', desc: '게이밍, 3인이상' },
      { key: '1G', label: '1Gbps', desc: '회사, 재택근무' },
    ],
    tips: [
      {
        t: '인터넷 속도는 무조건 빠른 것이 좋나요?',
        d: ['요금제에 따라서 속도 차이는 크지 않아요.', '와이파이를 쓰는 사람이 많거나, 고사양 게임을 하는 경우에만 500Mbps를 추천드려요.'],
      },
      {
        t: '알뜰하게 절약할 수 있는 방법!',
        d: ['500Mbps 요금제를 약정 기간만 쓰고 이후 하향 변경하면', '사은품은 최대로 받고, 위약금 없이 요금을 낮출 수 있어요.'],
      },
    ],
  },
  {
    id: 'extras', multi: true, optional: true,
    q: '(선택) 추가로 필요하신 상품이', q2: '있다면 모두 골라보시겠어요?',
    options: [
      { key: 'tv', label: 'TV', desc: '실시간 채널·VOD' },
      { key: 'wifi', label: '와이파이', desc: '공유기 임대' },
      { key: 'tel', label: '전화', desc: '집전화 회선' },
    ],
    tips: [{
      t: '추가 상품을 반드시 골라야 하나요?',
      d: ['일부 인터넷 요금제는 와이파이를 무료로 제공해드려요.', '인터넷만 단독으로 신청하면 요금은 저렴하지만 사은품도 줄어들어요.'],
    }],
  },
]

// 휴대폰 3문항
export const PHONE_STEPS = [
  {
    id: 'carriers', multi: true, required: true,
    q: '어느 통신사를 쓰실 건가요?', sub: '고민 중이면 여러 개 골라도 돼요',
    kind: 'carrier', options: PHONE_CARRIERS,
    tips: [{
      t: '알뜰폰은 통화 품질이 떨어지나요?',
      d: ['알뜰폰은 3사 망을 그대로 빌려 쓰기 때문에 통화·데이터 품질이 같아요.', '대신 멤버십·결합 할인은 줄어들 수 있어요.'],
    }],
  },
  {
    id: 'join', required: true,
    q: '어떤 방식으로', q2: '가입하실 예정인가요?',
    options: [
      { key: 'mnp', label: '번호이동', desc: '지원금 가장 큼' },
      { key: 'chg', label: '기기변경', desc: '번호·통신사 유지' },
      { key: 'new', label: '신규가입', desc: '새 번호 개통' },
    ],
    tips: [{
      t: '번호이동이 항상 유리한가요?',
      d: ['보통 번호이동 지원금이 가장 크지만, 결합 할인이 걸려 있으면 깨질 수 있어요.', '기존 결합 구성까지 함께 계산해 유리한 쪽으로 안내해 드려요.'],
    }],
  },
  {
    id: 'usage', required: true,
    q: '데이터는 한 달에', q2: '얼마나 쓰시나요?',
    options: [
      { key: 'light', label: '5GB 이하', desc: '주로 와이파이' },
      { key: 'mid', label: '10~30GB', desc: '영상·SNS 보통' },
      { key: 'heavy', label: '무제한', desc: '스트리밍 상시' },
    ],
    tips: [{
      t: '요금제는 나중에 바꿔도 되나요?',
      d: ['개통 후 일정 기간(보통 6개월)을 유지하면 위약금 없이 낮출 수 있어요.', '처음엔 지원금 조건에 맞추고, 이후 실사용에 맞게 조정하는 게 알뜰해요.'],
    }],
  },
]

export const FLOWS = {
  internet: {
    slug: 'internet', title: '인터넷/TV', steps: NET_STEPS,
    resultTo: '/calculator', cta: '내게 맞는 인터넷 찾기',
  },
  phone: {
    slug: 'phone', title: '휴대폰', steps: PHONE_STEPS,
    resultTo: '/calculator/phone', cta: '내게 맞는 휴대폰 요금 찾기',
  },
}

// 진행률 — 마지막 문항까지 답하면 100%가 아니라 75%로 두고, 결과보기를 눌러야
// 완료가 되게 한다(아정당과 동일). 남은 질문 수를 문장으로 알려 이탈을 줄인다.
export function progressOf(idx, total) {
  const pct = Math.round(((idx + 1) / (total + 1)) * 100)
  const left = total - idx - 1
  const label = left <= 0 ? '마지막 질문이에요!' : left === 1 ? '질문이 1개 남았어요!' : `${total}개의 질문에만 답하면 돼요!`
  return { pct, left, label }
}

// 설문 답변 → 견적 계산기 프리필 쿼리
export function answersToQuery(slug, a) {
  const p = new URLSearchParams()
  const first = (v) => (Array.isArray(v) ? v[0] : v)
  if (slug === 'internet') {
    if (a.carriers?.length) p.set('carrier', first(a.carriers))
    if (a.speed) p.set('speed', first(a.speed))
    if (a.extras?.length) p.set('extras', a.extras.join(','))
  } else {
    if (a.carriers?.length) p.set('carrier', first(a.carriers))
    if (a.join) p.set('join', first(a.join))
    if (a.usage) p.set('usage', first(a.usage))
  }
  p.set('from', 'onboard')
  return p.toString()
}
