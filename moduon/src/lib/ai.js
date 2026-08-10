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

// ─── 범용 Claude 호출 (Opus 5 서버리스) — 셀러/본사 AI 어시스턴트 공용 ──
// 성공 시 응답 텍스트, 실패(키 미설정·오류) 시 null → 호출측이 로컬 폴백.
export async function callClaude(prompt, task = 'general') {
  if (apiDead) return null
  try {
    const res = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], context: { task } }),
    })
    if (res.ok) { const d = await res.json(); return d.reply ?? null }
    if (res.status === 503 || res.status === 404) apiDead = true
  } catch { /* 일시 오류 — 이번 턴만 폴백 */ }
  return null
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

// ─── AI 브리핑 빌더 (Opus 5 · 로컬 폴백 동봉) ───────────────────
// ai.js는 스토어에 의존하지 않는다(순수 유지) — 페이지가 db에서 집계한
// 순수 객체를 넘기면 {prompt, task, local}을 반환. 실패 시 local이 표시된다.

// 본사 어드민 — AI 경영 브리핑 (오늘의 실데이터 → 우선 조치 3)
export function adminBrief(a) {
  const facts = [
    `이번 달 총 매출 ${won(a.totalSales)} · 수수료 수익 ${won(a.feeIncome)} · 월 이용료 수익 ${won(a.monthlyFees)}`,
    `오늘 신규 리드 ${a.leadsToday}건 · 누적 전환율 ${a.conv}%`,
    `SLA 10분 초과 미응대 ${a.overdue}건`,
    `활성 대리점 ${a.activeCount}곳 · 분양 심사 대기 ${a.pendingApps}건`,
    `모집 필요(총판 공석) 권역: ${a.vacant.length ? a.vacant.join(', ') : '없음'}`,
    `수요 상위: ${a.topCat.map((t) => `${t.name} ${t.n}건`).join(', ') || '-'}`,
  ].join('\n')
  const prompt = `당신은 모두온 본사 운영을 돕는 AI 경영 애널리스트입니다. 아래 오늘의 실데이터만 근거로, 본사 관리자가 바로 실행할 우선 조치 3가지를 제안하세요. 각 줄은 "1. 조치 — 근거 수치" 형식으로 한 줄씩. 데이터에 없는 수치·추측 금지, 과장 금지. 마지막 줄에 "총평 —" 한 줄.\n\n[오늘의 데이터]\n${facts}`
  return { prompt, task: 'admin-brief', local: localAdminBrief(a) }
}
function localAdminBrief(a) {
  const cand = []
  if (a.overdue > 0) cand.push(`SLA 초과 ${a.overdue}건 즉시 재배정·재알림 — 10분 초과는 전환율이 가파르게 떨어집니다.`)
  if (a.vacant.length) cand.push(`공석 권역 총판 모집 — ${a.vacant.slice(0, 3).join(', ')}${a.vacant.length > 3 ? ' 외' : ''}. 배정할 대리점이 없으면 리드가 샙니다.`)
  if (a.pendingApps > 0) cand.push(`분양 심사 대기 ${a.pendingApps}건 처리 — 승인 지연은 신규 매출 개시를 늦춥니다.`)
  if (a.topCat[0]) cand.push(`수요 상위 "${a.topCat[0].name}"(${a.topCat[0].n}건) 메인 노출·번들 CTA 강화로 전환 극대화.`)
  cand.push(`반복 수익 방어 — 수수료 ${won(a.feeIncome)} + 월 이용료 ${won(a.monthlyFees)}. 활성 대리점 ${a.activeCount}곳 리텐션 관리.`)
  const top = cand.slice(0, 3).map((c, i) => `${i + 1}. ${c}`)
  const bottleneck = a.overdue > 0 ? '초기 응대 속도' : a.vacant.length ? '권역 커버리지' : '노출·수요 전환'
  top.push(`총평 — 오늘 리드 ${a.leadsToday}건 · 전환율 ${a.conv}%. 지금 병목은 ${bottleneck}입니다.`)
  return top.join('\n')
}

// 셀러 마이오피스 — 오늘의 AI 코칭 (내 리드 현황 → 지금 할 일 3)
export function sellerCoach(a) {
  const facts = [
    `오늘 새 리드 ${a.today}건 · 처리 대기 ${a.waiting}건 · SLA 10분 초과 ${a.overdue}건`,
    `이번 달 예상 수익 ${won(a.expected)} · 확정 ${won(a.net)}`,
    `주력 카테고리: ${a.topCat.map((t) => `${t.name} ${t.n}건`).join(', ') || '-'}`,
    `임박 만기(재계약 기회): ${a.expiring.map((e) => `${e.customer} D-${e.dd}`).join(', ') || '없음'}`,
  ].join('\n')
  const prompt = `당신은 모두온 셀러(대리점 사장)의 AI 코치입니다. 아래 오늘 내 리드 현황만 근거로, 지금 바로 할 일 우선순위 3가지를 짧고 실행 중심으로 코칭하세요. 과장·수익보장 금지. 형식은 "① 지금 바로 — ...", "② 오늘 안에 — ...", "③ 놓치지 말 것 — ..." 세 줄.\n\n[내 현황]\n${facts}`
  return { prompt, task: 'seller-coach', local: localSellerCoach(a) }
}
function localSellerCoach(a) {
  const l1 = a.overdue > 0
    ? `① 지금 바로 — 10분 초과 미응대 ${a.overdue}건부터 전화. 첫 연락이 빠를수록 계약 확률이 올라갑니다.`
    : a.waiting > 0 ? `① 지금 바로 — 대기 ${a.waiting}건 접수 순서대로 연락.`
    : `① 지금 바로 — 신규 리드가 없어요. 임박 만기 고객 재상담으로 매출을 방어하세요.`
  const l2 = a.today > 0
    ? `② 오늘 안에 — 오늘 유입 ${a.today}건 상담 메모 남기고 다음 액션 지정.${a.topCat[0] ? ` "${a.topCat[0].name}" 문의가 많아 결합 제안이 잘 먹힙니다.` : ''}`
    : `② 오늘 안에 — 내 몰 링크를 공유해 신규 리드 유입을 만드세요.`
  const l3 = a.expiring.length
    ? `③ 놓치지 말 것 — 만기 임박 ${a.expiring[0].customer}(D-${a.expiring[0].dd}) 재계약 콜. 만기 직전이 락인 적기입니다.`
    : `③ 놓치지 말 것 — 상담완료 리드의 개통 확인으로 정산 확정을 앞당기세요.`
  return [l1, l2, l3].join('\n')
}

// 총판(관리단) — 권역 브리핑 (권역 수요·셀러 코칭·모집 신호)
export function distributorBrief(a) {
  const facts = [
    `권역: ${a.unitName}(${a.cover}) · 배분율 ${(a.sharePct * 100).toFixed(0)}%`,
    `셀러 ${a.sellers}곳(활성 ${a.active}) · 이번 달 권역 매출 ${won(a.gross)} · 내 배분 수익 ${won(a.share)}`,
    `권역 유입 리드 ${a.leads}건 · 미배정 ${a.unassigned}건`,
    `수요 상위: ${a.topCat.map((t) => `${t.name} ${t.n}건`).join(', ') || '-'}`,
  ].join('\n')
  const prompt = `당신은 모두온 총판(권역 관리단)의 AI 운영 참모입니다. 아래 내 권역 실데이터만 근거로 세 줄 브리핑을 작성하세요. 형식: "① 권역 진단 — ...", "② 셀러 코칭 — ...", "③ 모집·수요 — ...". 데이터에 없는 수치 금지, 과장 금지.\n\n[내 권역]\n${facts}`
  return { prompt, task: 'distributor-brief', local: localDistributorBrief(a) }
}
function localDistributorBrief(a) {
  const l1 = `① 권역 진단 — 이번 달 권역 매출 ${won(a.gross)}, 내 배분 수익 ${won(a.share)}. 활성 셀러 ${a.active}곳이 만든 실적입니다.`
  const l2 = a.active > 0
    ? `② 셀러 코칭 — ${a.topCat[0] ? `수요 상위 "${a.topCat[0].name}"(${a.topCat[0].n}건) 결합 제안을 셀러 스크립트에 반영하세요.` : '셀러 상담 메모·SLA 응대 속도를 점검하세요.'}`
    : '② 셀러 코칭 — 활성 셀러가 없습니다. 분양 영업이 최우선입니다.'
  const l3 = a.unassigned > 0
    ? `③ 모집·수요 — 미배정 리드 ${a.unassigned}건이 새고 있어요. 셀러 증원(분양)으로 받을 손이 필요합니다.`
    : `③ 모집·수요 — 유입 ${a.leads}건 전량 배정 중. 다음 분양은 수요 상위 카테고리 전문 셀러로 뽑으면 전환이 좋습니다.`
  return [l1, l2, l3].join('\n')
}

// 소비자 프론트 — 진단 심화 분석 (진단 결과 → 우선순위·실행 팁 내러티브)
export function diagnosisNarrative(result) {
  const items = result.items.map((i) => `${i.label} 월 ${won(i.save)}`).join(' · ')
  const prompt = `당신은 모두온 AI 생활비 코치입니다. 아래 진단 결과만 근거로, 고객에게 우선순위와 실행 팁을 따뜻하고 구체적으로 한국어 3~4문장으로 조언하세요. 금액은 결과 안 수치만 사용하고 새 수치를 지어내지 마세요. 마지막 문장은 "정확한 절감액은 무료 상담에서 확정" 안내.\n\n[진단] 월 절감 여지 ${won(result.total)}(연 ${won(result.yearly)}) · 항목: ${items || '큰 낭비 없음'} · 잘 유지: ${result.wins.join(', ') || '-'} · 미평가: ${result.pending.map((p) => p.label).join(', ') || '없음'}`
  return { prompt, task: 'diagnosis-narrative', local: localNarrative(result) }
}
function localNarrative(result) {
  if (!result.items.length) return '지금은 눈에 띄는 낭비가 거의 없어요. 잘 유지하고 계신 항목을 그대로 지키시고, 약정 만기 시점마다 조건만 재점검하시면 됩니다. 정확한 절감액은 무료 상담에서 확정해 드려요.'
  const top = result.items[0]
  const parts = [`가장 먼저 "${top.label}"부터 잡으면 월 ${won(top.save)}이 바로 빠져요 — ${top.why}.`]
  if (result.items[1]) parts.push(`그다음은 "${result.items[1].label}"(월 ${won(result.items[1].save)})예요.`)
  parts.push(`제안을 모두 실행하면 월 ${won(result.total)}, 1년이면 ${won(result.yearly)}까지 아낄 수 있어요.`)
  if (result.items.some((i) => i.manual)) parts.push('보험 항목은 설계사 검토 후 절감액이 확정돼요.')
  parts.push('정확한 절감액은 무료 상담에서 확정해 드려요.')
  return parts.join(' ')
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

// ─── 파트너 마케팅 스튜디오 — AI 카피 생성 (채널×목적, 로컬 폴백 동봉) ──
// "상품언어는 24시간 일하는 직원" — 구체 수치가 말하게 하고, 과장·수익보장은 금지.
// 카톡/문자는 (광고) 표기 + 수신거부 안내를 반드시 포함(정보통신망법 준수 데모).
const CH_LABEL = { kakao: '카카오톡 알림', sms: '문자(SMS)', blog: '블로그 포스트', sns: 'SNS 캡션' }
const GOAL_LABEL = { acquire: '신규 모객', renewal: '만기 재상담', promo: '사은품 프로모션' }

export function marketingCopy(a) {
  const facts = [
    `몰 이름: ${a.tenantName} (${a.unitName} · ${a.sigungu})`,
    `주력 카테고리: ${a.cats.join(', ') || '-'}`,
    `대표 상품 예시: 인터넷 500M+정수기 결합 월 32,900원(하루 1,097원꼴), 현금 사은품 최대 ${a.giftMax}`,
    `추천 링크: ${a.refLink}`,
    a.expiringCount ? `만기 임박(90일 내) 고객 ${a.expiringCount}명` : null,
  ].filter(Boolean).join('\n')
  const prompt = `당신은 모두온 파트너몰의 마케팅 카피라이터입니다. 아래 몰 정보만 근거로 ${CH_LABEL[a.channel]} 1건을 작성하세요. 목적: ${GOAL_LABEL[a.goal]}.\n\n규칙:\n- 숫자가 말하게: 구체 수치(월 요금·하루 환산·사은품 상한·D-일수)를 카피에 녹일 것\n- 과장·수익보장·확정 표현 금지. 혜택엔 "최대/조건 충족 시"를 붙일 것\n- 카톡·문자는 첫 줄 "(광고)" 표기 + 마지막 줄 무료 수신거부 안내 필수\n- 블로그는 제목+소제목 2개+본문 개요, SNS는 3줄 캡션+해시태그 4개\n- 고객 이름·만기일은 {고객명}, D-{일수} 변수로 남길 것\n\n[몰 정보]\n${facts}`
  return { prompt, task: `marketing-${a.channel}-${a.goal}`, local: localMarketingCopy(a) }
}

function localMarketingCopy(a) {
  const opt = '무료 수신거부: 마이페이지 > 알림 설정'
  const K = {
    acquire: `(광고) ${a.tenantName}\n남들 몰라서 못 받은 지원금, 최대 ${a.giftMax} 돌려받으세요.\n인터넷 500M+정수기 결합이 월 32,900원 — 하루 1,097원꼴이에요.\n우리 동네(${a.sigungu}) 설치 가능 여부 30초 확인 →\n${a.refLink}\n${opt}`,
    renewal: `(광고) ${a.tenantName}\n{고객명}님, 약정 만기까지 D-{일수} — 위약금 부담이 가장 낮아지는 골든타임이에요.\n지금 갈아타면 현금 사은품 최대 ${a.giftMax} (조건 충족 시).\n재상담 신청 →\n${a.refLink}\n${opt}`,
    promo: `(광고) ${a.tenantName}\n이번 달 사은품 지급 명단, 홈페이지에 실명(마스킹) 공개 중입니다.\n설치 확인 후 영업일 7일 내 계좌 입금 — 최대 ${a.giftMax} (조건 충족 시).\n내 사은품 확인 →\n${a.refLink}\n${opt}`,
  }
  const S = {
    acquire: `(광고)[${a.tenantName}] 인터넷 갈아타고 최대 ${a.giftMax} 환급(조건부). 월 32,900원~ 30초 견적 ${a.refLink} ${opt}`,
    renewal: `(광고)[${a.tenantName}] {고객명}님 약정 만기 D-{일수}. 위약금 최소 구간 재상담 예약 ${a.refLink} ${opt}`,
    promo: `(광고)[${a.tenantName}] 사은품 실지급 명단 공개중. 설치 후 7일 내 입금(조건부) ${a.refLink} ${opt}`,
  }
  const B = {
    acquire: `제목: ${a.sigungu} 인터넷 신규·이전, 하루 1,097원에 정수기까지 쓰는 법\n\n소제목1) 월 32,900원의 계산법 — 요금표 그대로 공개\n소제목2) 현금 사은품 최대 ${a.giftMax}, 조건은 이것만 보면 됩니다\n\n본문 개요: ① 3사 실질 부담 비교(월 요금×36 − 돌려받는 돈) ② 결합 할인 구조 ③ 지급 명단으로 확인하는 실지급 증거 ④ 상담 신청 절차(평균 10분 콜백). 마지막에 ${a.refLink} 안내.`,
    renewal: `제목: 약정 만기 90일 전이 통신비 아끼는 마지노선인 이유\n\n소제목1) 위약금 곡선 — D-90부터 부담이 꺾입니다\n소제목2) 갈아타기 전 확인할 3가지(위약금·결합·사은품)\n\n본문 개요: 만기 시점별 위약금 추이, 재상담으로 아끼는 평균 금액, {고객명} 변수로 개인화 발송하는 법. CTA: ${a.refLink}`,
    promo: `제목: "사은품 준다더니 안 주더라"가 불가능한 구조 — 지급 명단 공개\n\n소제목1) 설치 확인 → 영업일 7일 입금, 절차 그대로\n소제목2) 이번 달 지급 명단(마스킹) 보는 법\n\n본문 개요: 지급 약속 3원칙, 명단 확인 경로, 조건 고지. CTA: ${a.refLink}`,
  }
  const N = {
    acquire: `하루 1,097원으로 인터넷+정수기 해결.\n남들 몰라서 못 받는 지원금, 최대 ${a.giftMax} (조건 충족 시).\n30초 견적은 프로필 링크에서.\n#${a.sigungu.replace(/\s/g, '')} #인터넷설치 #통신비절약 #사은품`,
    renewal: `약정 만기 D-{일수}가 통신비 리셋 타이밍.\n위약금 가장 낮은 구간, 놓치지 마세요.\n재상담은 프로필 링크로.\n#약정만기 #통신비 #갈아타기 #${a.sigungu.replace(/\s/g, '')}`,
    promo: `사은품 "준다"가 아니라 "줬다"를 공개합니다.\n이번 달 지급 명단, 마스킹 실명으로 확인하세요.\n최대 ${a.giftMax} (조건 충족 시).\n#사은품 #현금지원 #지급명단 #인터넷가입`,
  }
  return ({ kakao: K, sms: S, blog: B, sns: N })[a.channel]?.[a.goal] ?? K.acquire
}

// ─── AI 페르소나 패널 (MatrAIx 컨셉 흡수) — 카피 A/B 사전 테스트 ────
// 세그먼트가 다른 가상 소비자 6인이 두 카피에 반응한다. 데모 원칙:
// 시뮬레이션은 가설 탐색용이며 실제 사용자 증거를 대체하지 않는다.
export const PANEL_PERSONAS = [
  { id: 'p1', name: '김지현 (34)', seg: '맞벌이 신혼 · 시간 빈곤 · 가격 민감', lean: 'price' },
  { id: 'p2', name: '박순자 (63)', seg: '은퇴 부부 · 전화 선호 · 신뢰 중시', lean: 'trust' },
  { id: 'p3', name: '이준 (27)', seg: '1인 가구 · 셀프서빙 · 속도 중시', lean: 'speed' },
  { id: 'p4', name: '티 흐엉 (29)', seg: '외국인 근로자 · 약정 부담 · 다국어 필요', lean: 'risk' },
  { id: 'p5', name: '최성호 (46)', seg: '자영업 사장 · 비용 최우선 · 바쁨', lean: 'price' },
  { id: 'p6', name: '한서연 (38)', seg: '초등맘 · 후기·안전 중시', lean: 'trust' },
]

export function personaPanel(a) {
  const roster = PANEL_PERSONAS.map((p) => `- ${p.name}: ${p.seg}`).join('\n')
  const prompt = `당신은 가상 소비자 패널 시뮬레이터입니다. 아래 6명의 페르소나가 두 마케팅 카피(A/B)를 각각 읽었다고 가정하고, 각자의 성향에 충실하게 반응을 시뮬레이션하세요.\n\n[페르소나]\n${roster}\n\n[카피 A — 위약금 각도]\n${a.copyA}\n\n[카피 B — 사은품 각도]\n${a.copyB}\n\n출력 형식(정확히 지킬 것):\n각 줄 "이름 → A 또는 B — 한 문장 이유" 6줄, 마지막 줄 "종합 → A n : B m — 한 문장 해석". 과장 금지, 페르소나 성향과 모순 금지.`
  return { prompt, task: 'persona-panel', local: localPersonaPanel() }
}
function localPersonaPanel() {
  // 결정적 폴백 — 성향 규칙: price/speed → B(사은품·환산 즉효), trust/risk → A(위약금·조건 투명)
  const pick = { price: 'B', speed: 'B', trust: 'A', risk: 'A' }
  const why = {
    price: '돌려받는 금액이 크고 하루 환산이 바로 와닿아요',
    speed: '혜택이 명확해서 고민 없이 신청 버튼을 누를 것 같아요',
    trust: '조건 고지가 또렷한 쪽이 덜 의심스러워요',
    risk: '위약금 걱정부터 풀어주는 쪽이 안심돼요',
  }
  const lines = PANEL_PERSONAS.map((p) => `${p.name} → ${pick[p.lean]} — ${why[p.lean]}`)
  const b = PANEL_PERSONAS.filter((p) => pick[p.lean] === 'B').length
  lines.push(`종합 → A ${PANEL_PERSONAS.length - b} : B ${b} — 가격 민감층은 B, 신뢰·약정 부담층은 A로 갈립니다. 세그먼트별로 다른 안을 보내는 게 정답이에요.`)
  return lines.join('\n')
}
