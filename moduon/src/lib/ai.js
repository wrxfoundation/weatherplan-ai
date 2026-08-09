// ─── AI 상담봇 "모비" 클라이언트 ─────────────────────────────────
// /api/claude (Vercel Function → Anthropic Messages API) 우선 호출,
// 키 미설정·네트워크 실패 시 로컬 데모 브레인으로 자동 폴백 → 배포 즉시 시연 가능.
import { calcQuote, won } from './engine'
import { CATEGORIES, catBySlug } from './constants'

export const QUICK_REPLIES = [
  '인터넷 월 얼마예요?',
  '이사 + 인터넷 같이 알아봐줘',
  '정수기 렌탈 추천해줘',
  '상담 신청은 어떻게 해요?',
]

let apiDead = false // 한 번 죽으면 세션 동안 로컬 브레인 사용(불필요한 재시도 방지)

export async function askMobi(history, ctx = {}) {
  if (!apiDead) {
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(({ role, text }) => ({ role, content: text })),
          context: ctx,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.reply) return { text: data.reply, source: 'claude' }
      }
      if (res.status === 503 || res.status === 404) apiDead = true
    } catch {
      apiDead = true
    }
  }
  return { ...localBrain(history, ctx), source: 'local' }
}

// ─── 로컬 데모 브레인 (규칙 기반) ────────────────────────────────
function localBrain(history, ctx) {
  const last = history[history.length - 1]?.text ?? ''
  const q = last.toLowerCase()

  const has = (...words) => words.some((w) => last.includes(w) || q.includes(w))

  // 견적 문의 → 실제 견적 엔진 호출
  if (has('인터넷', '월', '얼마', '요금', '견적')) {
    const speed = has('1g', '기가') ? '1G' : has('100') ? '100M' : '500M'
    const bundle = has('정수기') ? 'water' : has('휴대폰', '폰') ? 'phone' : 'water'
    const quote = calcQuote({ speed, bundle, promo: false })
    return {
      text: `바로 계산해 드렸어요! 인터넷 ${speed}${bundle === 'water' ? ' + 정수기 결합' : bundle === 'phone' ? ' + 휴대폰 결합' : ''} 기준이에요.\n\n· 월 기본요금 ${won(quote.base)}\n· 결합 할인 −${won(quote.bundleDc)}\n· 월 납부금 **${won(quote.total)}**\n· 사은품 혜택 최대 ${won(quote.gift)}\n\n조건을 바꿔가며 직접 비교하고 싶으시면 견적 계산기를 열어 드릴게요. AI 견적은 참고용이며 최종 조건은 상담에서 확정됩니다.`,
      action: { type: 'quote', quote, label: '견적 계산기 열기', to: '/calculator' },
    }
  }
  if (has('이사')) {
    return {
      text: '이사는 지역·짐량·날짜에 따라 견적 차이가 커요. 모두온에서는 포장이사 기준 최대 40만원 혜택과 함께 입주 청소, 인터넷 이전 설치까지 한 번에 연결해 드려요.\n\n30초 상담 신청을 남겨주시면 평균 10분 내에 전문 상담사가 연락드립니다. 인터넷을 함께 신청하시면 결합 혜택으로 월 납부금도 낮출 수 있어요!',
      action: { type: 'link', label: '이사 + 인터넷 상담 신청', to: '/consult?cat=move' },
    }
  }
  if (has('정수기', '렌탈')) {
    return {
      text: '정수기는 냉온정 기능, 관리 주기, 의무약정에 따라 월 렌탈료가 15,900원~45,900원까지 다양해요. 모두온 제휴 조건으로는 최대 30만원 혜택 + 설치비 무료가 가능합니다.\n\n인터넷과 결합하면 통신 요금에서 월 11,100원이 추가로 할인돼요. 어떤 조합이 유리한지 계산기로 보여드릴까요?',
      action: { type: 'link', label: '결합 견적 계산해보기', to: '/calculator' },
    }
  }
  if (has('휴대폰', '폰', '기기변경', '번호이동')) {
    return {
      text: '휴대폰은 통신사·요금제·결합 여부에 따라 지원금이 크게 달라져요. 모두온에서는 최대 45만원 혜택에 제휴카드 할인까지 이중으로 설계해 드립니다.\n\n현재 쓰시는 통신사와 월 요금을 알려주시면 절감액을 바로 진단해 드릴게요. 아니면 상담 신청을 남겨주세요 — 평균 10분 내 연락드려요!',
      action: { type: 'link', label: '휴대폰 상담 신청', to: '/consult?cat=phone' },
    }
  }
  if (has('보험')) {
    return {
      text: '갖고 계신 보험, 중복 보장이나 과한 특약이 있는지 무료로 진단해 드려요. 보장은 유지하면서 월 납입액만 낮추는 리모델링이 핵심이에요.\n\n상담 신청 시 "보험"을 선택해 주시면 전문 설계사가 배정됩니다.',
      action: { type: 'link', label: '보험 무료 진단 신청', to: '/consult?cat=insurance' },
    }
  }
  if (has('상담', '신청', '어떻게')) {
    return {
      text: '상담 신청은 딱 30초면 끝나요!\n\n1. 이름·연락처·지역(시·군·구까지만) 입력\n2. 관심 서비스 선택\n3. 편한 상담 시간 선택\n\n신청 즉시 지역 전담 파트너에게 실시간 배정되고, 평균 10분 안에 전화드려요. 개인정보는 상담 목적으로만 사용됩니다.',
      action: { type: 'link', label: '무료 상담 신청하기', to: '/consult' },
    }
  }
  if (has('분양', '파트너', '창업', '건물주')) {
    return {
      text: '"온라인 건물주 되기" — 모두온 분양몰에 관심 있으시군요! 초기 분양비 100만원 + 월 이용료 10만원으로 내 브랜드 비교판매 사이트를 개설하고, 리드 자동 배정과 AI 업무 자동화, 매일 보이는 투명 정산까지 제공받아요.\n\n월 매출 1,000만원 기준 순수익 예시는 890만원입니다(수수료 10%, 이용료 차감 후 — 실제 수익 보장 아님).',
      action: { type: 'link', label: '분양 안내 보기', to: '/partner' },
    }
  }
  if (has('절감', '진단', '생활비')) {
    return {
      text: '1분 생활비 진단으로 통신·렌탈·보험에서 새는 돈을 찾아드려요. 몇 가지 질문에 답하시면 카테고리별 예상 절감액을 계산해 드립니다!',
      action: { type: 'link', label: 'AI 생활비 진단 시작', to: '/diagnosis' },
    }
  }
  const cat = CATEGORIES.find((c) => last.includes(c.name))
  if (cat) {
    return {
      text: `${cat.name} 서비스는 ${cat.benefit}으로 도와드리고 있어요. ${cat.desc}\n\n자세한 조건은 카테고리 페이지에서 확인하시거나, 바로 상담을 신청해 주세요!`,
      action: { type: 'link', label: `${cat.name} 자세히 보기`, to: `/category/${cat.slug}` },
    }
  }
  return {
    text: '안녕하세요, 모두온 AI 상담사 모비예요! 이사·인터넷/TV·정수기·렌탈·휴대폰·보험·가전까지 생활서비스 무엇이든 물어보세요.\n\n예를 들어 "인터넷 500M에 정수기 결합하면 월 얼마예요?"라고 물어보시면 바로 계산해 드려요!',
  }
}

// ─── AI 생활비 진단 (규칙 기반 추정 — C-05/AI-04) ───────────────
export function diagnose(answers) {
  const items = []
  if (answers.telecom >= 80000) items.push({ cat: 'phone', label: '휴대폰 요금제 최적화', save: 18000 })
  else if (answers.telecom >= 50000) items.push({ cat: 'phone', label: '휴대폰 요금제 최적화', save: 9000 })
  if (answers.internet === 'old') items.push({ cat: 'internet', label: '인터넷 약정 만기 재약정 + 결합', save: 14100 })
  else if (answers.internet === 'no-bundle') items.push({ cat: 'internet', label: '인터넷 결합 할인 적용', save: 11100 })
  if (answers.rentalCount >= 2) items.push({ cat: 'rental', label: '렌탈 통합 재계약', save: 12000 })
  else if (answers.rentalCount === 1) items.push({ cat: 'rental', label: '렌탈 조건 재협상', save: 6000 })
  if (answers.insurance >= 300000) items.push({ cat: 'insurance', label: '보험 리모델링(중복 보장 정리)', save: 47000 })
  else if (answers.insurance >= 150000) items.push({ cat: 'insurance', label: '보험 특약 점검', save: 21000 })
  if (answers.moving) items.push({ cat: 'move', label: '이사 + 신규 결합 패키지', save: 15000 })
  const total = items.reduce((s, i) => s + i.save, 0)
  return { items, total, yearly: total * 12 }
}
