// ─── AI 상담봇 "모비" 클라이언트 ─────────────────────────────────
// /api/claude (Vercel Function → Anthropic Messages API) 우선 호출,
// 키 미설정·네트워크 실패 시 로컬 데모 브레인으로 자동 폴백 → 배포 즉시 시연 가능.
import { calcQuote, won } from './engine'
import { calcPhoneQuote } from './phones'
import { CATEGORIES, catBySlug } from './constants'

export const QUICK_REPLIES = [
  '인터넷 월 얼마예요?',
  '폴드8 번호이동하면 월 얼마?',
  '이사 + 인터넷 같이 알아봐줘',
  '정수기 렌탈 추천해줘',
]

// 키 미설정(503)·함수 없음(404)만 세션 내 확정 폴백. 일시적 네트워크 오류는
// 캐시하지 않는다 — 실패를 고착시키면 세션 내내 로컬 브레인에 갇힌다. (dcmap 교훈)
let apiDead = false

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
    } catch { /* 일시 오류 — 이번 턴만 로컬 폴백, 다음 턴 재시도 */ }
  }
  return { ...localBrain(history, ctx), source: 'local' }
}

// ─── 로컬 데모 브레인 (규칙 기반) ────────────────────────────────
function localBrain(history, ctx) {
  const last = history[history.length - 1]?.text ?? ''
  const q = last.toLowerCase()

  const has = (...words) => words.some((w) => last.includes(w) || q.includes(w))

  // 사은품 지급 정책 (탐라몰 벤치마크 — telco.js와 동일 문구)
  if (has('사은품', '현금 언제', '지급')) {
    return {
      text: '사은품은 설치·개통이 확인된 뒤 영업일 7일 이내에 신청인 명의 계좌로 현금 입금돼요. 3년 약정 기준이며 12개월 내 해지 시 일부 반환 조건이 있을 수 있어요.\n\n지금 조건 기준 사은품은 인터넷 단독 20만~40만원, TV 포함 시 +5만원, 통신사 프로모션으로 최대 +3만원까지 가능합니다. 정확한 금액은 요금표에서 확인해 보세요!',
      action: { type: 'link', label: '통신사별 요금표·사은품 보기', to: '/category/internet' },
    }
  }
  if (has('채널', '셋톱')) {
    return {
      text: 'TV는 베이직(실시간 183채널)과 프리미엄(235채널 + 영화 프리미엄관) 중에 고르시면 돼요. 베이직 기준 추가 요금 없이 인터넷과 묶이고, 프리미엄은 월 +6,600원이에요.\n\n개통 후에도 채널 팩·셋톱 변경이 가능하니 일단 베이직으로 시작하셔도 괜찮아요!',
      action: { type: 'link', label: '인터넷/TV 요금표 보기', to: '/category/internet' },
    }
  }
  // 견적 문의 → 실제 견적 엔진 호출
  if (has('인터넷', '월', '얼마', '요금', '견적')) {
    const speed = has('1g', '기가') ? '1G' : has('100') ? '100M' : '500M'
    const bundle = has('정수기') ? 'water' : has('휴대폰', '폰') ? 'phone' : 'water'
    const quote = calcQuote({ speed, bundle, promo: false })
    return {
      text: `바로 계산해 드렸어요! 인터넷 ${speed}${bundle === 'water' ? ' + 정수기 결합' : bundle === 'phone' ? ' + 휴대폰 결합' : ''} 기준이에요.\n\n· 월 기본요금 ${won(quote.base)}\n· 결합 할인 −${won(quote.bundleDc)}\n· 월 납부금 **${won(quote.total)}**\n· 사은품 혜택 최대 ${won(quote.gift)}\n\n조건을 바꿔가며 직접 비교하고 싶으시면 견적 계산기를 열어 드릴게요. AI 견적은 참고용이며 최종 조건은 상담에서 확정됩니다.\n\n근거 — 모두온 인터넷 요금표(3년 약정·부가세 포함 기준)`,
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
  if (has('휴대폰', '폰', '기기변경', '번호이동', '폴드', '갤럭시', '아이폰')) {
    const deviceId = has('아이폰') ? 'ip17' : has('s26', 'S26', '울트라') ? 's26u' : has('a56', 'A56', '가성비', '저렴') ? 'a56' : 'fold8'
    const join = has('기기변경', '기변') ? 'chg' : has('신규') ? 'new' : 'mnp'
    const pq = calcPhoneQuote({ deviceId, join, planId: 'choice110', method: 'support', months: 24, extra15: true })
    return {
      text: `${pq.device.name}, ${join === 'mnp' ? '번호이동' : join === 'chg' ? '기기변경' : '010신규'} 기준으로 바로 계산해 드렸어요!\n\n· 출고가 ${won(pq.device.price)}\n· 공통지원금 −${won(pq.publicSupport)} + 추가지원금 −${won(pq.extraSupport)}\n· 월 단말 할부금(24개월) ${won(pq.deviceMonthly)}\n· ${pq.plan.name} ${won(pq.planMonthly)}\n· 월 납부금(A+B) **${won(pq.total)}**\n\n요금제·할부개월·선택약정까지 직접 바꿔보시겠어요? AI 견적은 참고용이며 최종 조건은 상담에서 확정됩니다.\n\n근거 — 모두온 단말·요금 기준표(할부수수료 연 5.9% 원리금균등)`,
      action: { type: 'link', label: '휴대폰 견적 계산기 열기', to: '/calculator/phone' },
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
      text: '"온라인 건물주 되기" — 모두온 분양몰에 관심 있으시군요! 대리점 가입비 200만원 + 월 이용료 30만원으로 내 브랜드 비교판매 사이트를 개설하고, 리드 자동 배정과 AI 업무 자동화, 매일 보이는 투명 정산까지 제공받아요.\n\n월 매출 1,000만원 기준 순수익 예시는 870만원입니다(수수료 10%, 이용료 차감 후 — 실제 수익 보장 아님).',
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
// pickai 스코어카드 패턴: 항목은 진단(why)·지시(fix)·심각도를 스스로 들고 다니고,
// 미응답은 0점으로 위장하지 않고 '미평가'로 분모에서 제외한다. 보험처럼 상담사
// 확인이 필요한 항목은 manual 플래그로 분리해 "확정 전"임을 정직하게 표시한다.
const SEV_RANK = { high: 0, medium: 1, low: 2 }

export function diagnose(answers) {
  const items = []
  const wins = []
  const pending = []
  const answered = (k) => answers[k] !== undefined

  if (!answered('telecom')) pending.push({ cat: 'phone', label: '휴대폰 요금' })
  else if (answers.telecom >= 80000) items.push({ cat: 'phone', label: '휴대폰 요금제 최적화', save: 18000, sev: 'high', why: '8만원대는 선택약정·결합이 빠져 있는 경우가 대부분이에요', fix: '선택약정 25% 할인 + 인터넷 결합 재설계' })
  else if (answers.telecom >= 50000) items.push({ cat: 'phone', label: '휴대폰 요금제 최적화', save: 9000, sev: 'medium', why: '실사용량 대비 한 단계 높은 요금제 구간이에요', fix: '사용 패턴 기준 요금제 하향 검토' })
  else wins.push('휴대폰 요금 — 적정 구간이에요')

  if (!answered('internet')) pending.push({ cat: 'internet', label: '인터넷 상태' })
  else if (answers.internet === 'old') items.push({ cat: 'internet', label: '인터넷 약정 만기 재약정 + 결합', save: 14100, sev: 'high', why: '만기 후에는 신규 혜택 없이 같은 요금을 계속 내게 돼요', fix: '재약정 + 정수기 결합으로 월 요금 하향 (사은품 별도)' })
  else if (answers.internet === 'no-bundle') items.push({ cat: 'internet', label: '인터넷 결합 할인 적용', save: 11100, sev: 'medium', why: '결합 없이 쓰면 매달 결합 할인만큼 놓치고 있어요', fix: '정수기 렌탈 결합 시 월 11,100원 할인' })
  else wins.push('인터넷 — 결합까지 완료, 지금 조건 유지가 최선이에요')

  if (!answered('rentalCount')) pending.push({ cat: 'rental', label: '렌탈 현황' })
  else if (answers.rentalCount >= 2) items.push({ cat: 'rental', label: '렌탈 통합 재계약', save: 12000, sev: 'medium', why: '계약 시점이 제각각인 렌탈은 통합 재계약 여지가 커요', fix: '만기·위약금 확인 후 제휴 조건으로 통합' })
  else if (answers.rentalCount === 1) items.push({ cat: 'rental', label: '렌탈 조건 재협상', save: 6000, sev: 'low', why: '단일 렌탈도 재약정 시점에는 조건 개선 여지가 있어요', fix: '만기 시 제휴가 재협상' })
  else wins.push('렌탈 — 고정 지출이 없어요')

  if (!answered('insurance')) pending.push({ cat: 'insurance', label: '보험료' })
  else if (answers.insurance >= 300000) items.push({ cat: 'insurance', label: '보험 리모델링(중복 보장 정리)', save: 47000, sev: 'high', manual: true, why: '월 30만원 이상은 중복 보장이 숨어 있을 확률이 높아요', fix: '무료 보장 분석으로 중복 특약 정리 (절감액은 설계사 검토 후 확정)' })
  else if (answers.insurance >= 150000) items.push({ cat: 'insurance', label: '보험 특약 점검', save: 21000, sev: 'medium', manual: true, why: '보장은 유지하면서 납입만 줄일 수 있는 특약이 있는지 볼 구간이에요', fix: '특약 점검 리포트 (절감액은 설계사 검토 후 확정)' })
  else wins.push('보험료 — 적정 구간이에요')

  if (!answered('moving')) pending.push({ cat: 'move', label: '이사 계획' })
  else if (answers.moving) items.push({ cat: 'move', label: '이사 + 신규 결합 패키지', save: 15000, sev: 'medium', why: '이사 시점은 통신·렌탈을 한 번에 재설계할 유일한 기회예요', fix: '이사 + 인터넷 이전 + 신규 결합 패키지 상담' })

  items.sort((a, b) => (SEV_RANK[a.sev] - SEV_RANK[b.sev]) || b.save - a.save)
  const total = items.reduce((s, i) => s + i.save, 0)
  // 데모 백분위 — 절감 여지가 적을수록 알뜰 (실표본 아님, UI에 '데모 표본' 명시)
  const pct = Math.min(95, Math.max(5, Math.round(5 + total / 1100)))
  return { items, wins, pending, total, yearly: total * 12, pct }
}

// 진단 결과 → "절감 실행서" 마크다운 (pickai AI 명령서 구조 — 진단·지시·유지 항목·완료 기준)
export function buildDiagnosisPlan(result) {
  const L = ['# 우리 집 생활비 절감 실행서', '', `- 작성: 모두온 AI 생활비 진단 (규칙 기반 추정)`, `- 예상 절감: 월 ${won(result.total)} · 연 ${won(result.yearly)}`, '']
  if (result.items.length) {
    L.push(`## 실행 항목 (우선순위 순 · ${result.items.length}건)`, '')
    result.items.forEach((i, n) => {
      L.push(`### ${n + 1}. ${i.label} — 월 −${won(i.save)}${i.manual ? ' (상담사 확정 필요)' : ''}`)
      L.push(`- 진단: ${i.why}`)
      L.push(`- 지시: ${i.fix}`)
      L.push('')
    })
  }
  if (result.wins.length) L.push('## 잘 유지하고 있는 것 (무너뜨리지 말 것)', ...result.wins.map((w) => `- ${w}`), '')
  if (result.pending.length) L.push('## 미평가 항목 (상담 시 확인)', ...result.pending.map((p) => `- ${p.label}`), '')
  L.push('## 완료 기준', '- 실행 항목이 모두 처리되고, 유지 항목의 조건이 퇴행하지 않는다', '')
  L.push(`> 추정치는 평균 사례 기반이며 실제 절감액과 다를 수 있어요. 무료 상담: ${typeof window !== 'undefined' ? window.location.origin : ''}/consult`)
  return L.join('\n')
}
