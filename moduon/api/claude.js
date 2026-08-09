// ─── 모두온 AI 상담봇 프록시 (Vercel Serverless Function) ────────
// Anthropic Messages API 호출. ANTHROPIC_API_KEY 미설정 시 503 반환
// → 프론트가 로컬 데모 브레인으로 폴백하므로 키 없이도 서비스가 동작한다.
//
// 캐시 규약: STATIC_SYSTEM_PROMPT는 프롬프트 캐시 대상 — 동적 값(날짜·견적·프로필)
// 인터폴레이션 금지. 동적 컨텍스트는 buildDynamicContext()로 messages 뒤쪽에 붙인다.
import Anthropic from '@anthropic-ai/sdk'

const MODEL = process.env.MODUON_CLAUDE_MODEL || 'claude-opus-5'

const STATIC_SYSTEM_PROMPT = `당신은 생활서비스 비교·상담 플랫폼 "모두온(MODUON)"의 AI 상담사 "모비"입니다.

[역할]
- 이사, 인터넷/TV, 정수기, 렌탈, 휴대폰, 보험, 가전, 생활/기타 8개 카테고리의 상품 문의에 친절하고 정확하게 답합니다.
- 고객의 상황을 파악해 월 납부금 절감 방법을 제안하고, 자연스럽게 무료 상담 신청으로 연결합니다.
- 파트너(분양몰) 창업 문의에는 "온라인 건물주 되기" 프로그램을 안내합니다: 초기 분양비 100만원 + 월 이용료 10만원, 운영 수수료 10%, 월 매출 1,000만원 기준 순수익 예시 890만원.

[견적 기준표 — 인터넷]
- 월 기본요금: 100M 33,000원 / 500M 44,000원 / 1G 55,000원
- 결합 할인(월): 정수기 렌탈 결합 −11,100원 / 휴대폰 결합 −8,800원
- 신규가입 프로모션(월): −3,000원
- 사은품: 100M 20만원 / 500M 30만원 / 1G 40만원, 결합 시 +5만원
- 대표 예시: 500M + 정수기 결합 = 월 32,900원, 사은품 350,000원

[규칙]
- 존댓말을 사용하고, 답변은 3~6문장으로 간결하게. 금액은 천단위 콤마 + "원".
- 과장 금지: "업계 최대" 대신 "최대 ○만원 혜택 제공"처럼 구체적 수치만 사용.
- 견적을 안내할 때는 반드시 "AI 견적은 참고용이며 최종 조건은 상담 시 확정됩니다"를 덧붙입니다.
- 수익 관련 안내에는 "수익 예시는 실제 수익을 보장하지 않습니다"를 덧붙입니다.
- 개인정보(주민번호·카드번호 등)는 절대 요구하지 않습니다. 주소는 시·군·구까지만 안내받습니다.
- 모르는 정책·가격은 지어내지 말고 "정확한 조건은 상담사가 확인해 드린다"고 안내합니다.
- 상담 신청 방법을 물으면: 이름·연락처·지역 입력 → 관심 서비스 선택 → 평균 10분 내 전화 상담.`

// 동적 컨텍스트는 캐시 prefix 뒤 별도 user 블록으로 (정적 시스템 프롬프트 오염 금지)
function buildDynamicContext(context = {}) {
  const parts = []
  if (context.page) parts.push(`고객이 보고 있는 화면: ${context.page}`)
  if (context.tenant) parts.push(`고객이 접속한 파트너몰: ${context.tenant}`)
  if (context.quote) parts.push(`고객이 계산기에서 구성한 견적: ${JSON.stringify(context.quote)}`)
  if (!parts.length) return null
  return `<현재_상담_컨텍스트>\n${parts.join('\n')}\n</현재_상담_컨텍스트>`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'no_api_key', hint: 'Vercel 환경변수에 ANTHROPIC_API_KEY를 설정하면 실제 Claude 응답이 활성화됩니다.' })
  }

  try {
    const { messages = [], context = {} } = req.body ?? {}
    const trimmed = messages.slice(-12).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').slice(0, 2000),
    }))
    if (!trimmed.length) return res.status(400).json({ error: 'empty_messages' })

    const dyn = buildDynamicContext(context)
    if (dyn) trimmed.splice(trimmed.length - 1, 0, { role: 'user', content: dyn })

    const client = new Anthropic()
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: STATIC_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: trimmed,
    })

    if (response.stop_reason === 'refusal') {
      return res.status(200).json({ reply: '죄송해요, 해당 문의는 도와드리기 어려워요. 생활서비스 관련 문의를 남겨주시면 최선을 다해 안내해 드릴게요!' })
    }

    const reply = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
    return res.status(200).json({
      reply,
      model: response.model,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cacheRead: response.usage.cache_read_input_tokens ?? 0,
      },
    })
  } catch (err) {
    const status = err?.status ?? 500
    console.error('[moduon/api/claude]', status, err?.message)
    return res.status(status >= 400 && status < 600 ? 503 : 500).json({ error: 'upstream_error' })
  }
}
