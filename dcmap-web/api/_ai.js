/**
 * AI InfraMap — Claude 인텔리전스 프록시 (헬퍼: 파일명 '_' 접두라 Vercel 함수 카운트 제외).
 * power.js가 src=ai로 위임한다(Hobby 12함수 제한 유지). 4개 task를 하나로 통합:
 *   report  — 부지 분석 임원 브리프(스냅샷 실데이터 기반)
 *   search  — 자연어 입지 검색(후보 목록 랭킹·설명)
 *   qa      — 인프라/인허가 Q&A
 *   brief   — 지역(시도) 인프라 브리핑
 *
 * 환경변수(Vercel 서버 env 전용 — 리포 커밋/로그 노출 절대 금지):
 *   - ANTHROPIC_API_KEY (필수). 미설정 시 200 { available:false, reason:'not_configured' }
 *     → UI는 '연동 대기'로 정직하게 표시.
 *
 * 정직성: 시스템 프롬프트가 "제공 데이터에 없는 수치를 지어내지 말 것"을 강제.
 * 프롬프트 캐싱: 정적 시스템 블록에 cache_control(반복 호출 비용 절감).
 */

const API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
// 브리핑·리포트·비교·초안은 Sonnet(충분·경제적), 단순 검색·Q&A는 Haiku.
const MODEL_SONNET = 'claude-sonnet-5'
const MODEL_HAIKU = 'claude-haiku-4-5-20251001'

// 추정 비용용 단가(USD/1M 토큰). 캐시 읽기는 입력가의 ~0.1x. 참고치.
const PRICE = {
  'claude-sonnet-5': { in: 3, out: 15 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5 },
}
function estimateUsd(model, u) {
  const p = PRICE[model]
  if (!p || !u) return null
  const cacheRead = u.cache_read_input_tokens || 0
  const inFull = Math.max(0, (u.input_tokens || 0) - cacheRead)
  const usd = (inFull * p.in + cacheRead * p.in * 0.1 + (u.output_tokens || 0) * p.out) / 1e6
  return Math.round(usd * 1e5) / 1e5 // 5자리
}

// 반복되는 정적 규칙 — 프롬프트 캐시 대상(동적 값 절대 인터폴레이션 금지)
const STATIC_SYSTEM = `당신은 'AI InfraMap'의 데이터센터 입지 인텔리전스 어시스턴트입니다. 한국 AI 데이터센터 부지 선정을 돕는 B2B 도구입니다.

절대 규칙(정직성 — 위반 금지):
- 제공된 데이터(JSON)에 실제로 있는 값만 사용한다. 없는 수치·거리·용량·순위·비율을 절대 지어내지 않는다.
- 값이 null·'대기'·pending인 항목은 "데이터 미확보"로 명시하고 추정하지 않는다. 빈 항목을 채우려 하지 마라.
- 마케팅 과장·근거 없는 단정 금지. 불확실하면 불확실하다고 말한다.
- 한국어, 부지 검토 실무자 톤, 간결하게. 마크다운(###·불릿) 사용 가능.

도메인 지식(맥락):
- 5축 정직 스코어링: 전력40·토지25·리스크15·네트워크10·기상10 = 100점. 근거 확보된 항목만 점수화, 나머지는 커버리지로 표기.
- 수전전압 트랙(한전 기본공급약관 제23조): 계약전력 1만kW(10MW) 이하 22.9kV / 10~40MW는 154kV 원칙이나 한전 변전소 여유 시 40MW까지 22.9kV 조건부 / 40MW 초과 154kV 의무 / 400MW 초과 345kV.
- 전력계통영향평가: 10MW 이상 대상, 입지별 ±15점(수도권 감점·비수도권 가점).
- AIDC 특별법(비수도권 유인)·냉각(기온 낮을수록 프리쿨링 유리) 맥락.
- 출처는 공개 데이터: 한전·전력거래소·KOSIS·SGIS·vworld·OSM·기상청 평년값·케이웨더 실황 등. 데이터에 명시된 출처만 인용한다.`

const TASK_SYSTEM = {
  report:
    '작업: 부지 스냅샷(JSON)을 받아 임원용 브리프를 작성한다. 구성: ① **한줄 판정**(핵심 강점·약점) ② **근거 요약**(제공된 축값만; 대기 축은 "데이터 미확보"로 명시) ③ **전력 트랙·계통영향평가 시사점**(계약전력 기준) ④ **유의점/리스크** ⑤ **다음 확인사항 1~3개**. 400~550자 내외. 없는 수치 창작 절대 금지.',
  search:
    '작업: 사용자 자연어 질의와 후보지 목록(JSON: name·pct·근거 등)을 받는다. 질의 조건에 맞는 후보를 순위대로 3~5곳 골라 각 1줄 근거를 붙인다. 목록에 없는 후보를 만들지 말고, 조건에 맞는 곳이 없으면 없다고 말한다. 마지막에 한줄 요약.',
  qa: '작업: 데이터센터 인프라·전력 인허가·입지 관련 질문에 쉽게 답한다(용어집 수준 설명). 특정 부지의 수치는 컨텍스트 데이터에 있을 때만 인용한다. 모르면 "확인이 어렵다"고 답한다. 3~6문장 내외.',
  brief:
    '작업: 지역(시도) 집계 데이터(JSON)를 받아 인프라 브리핑을 작성한다: 전력·수요·리스크·기상 관점 요약과 입지 시사점. 제공된 집계값만 사용. 300~450자.',
  compare:
    '작업: 후보지 2~3곳의 스냅샷 배열(JSON)을 받아 비교 평가한다. 구성: ① **후보별 한줄 강·약점**(제공된 축값 근거; 대기 항목은 "데이터 미확보"로 명시) ② **용도별 추천**(예: 대용량 즉시 착공형 / 장기 확장형 / 냉각 우선형 중 각 후보가 어디에 맞는지) ③ **최종 추천 1곳 + 핵심 근거 2~3개**. 없는 수치·순위 창작 금지. 400~600자.',
  draft:
    '작업: 운영자를 위한 인사이트 기사 **초안**을 작성한다(발행 전 검토용). 주제와 참고 데이터(JSON)를 받아 마크다운 초안을 쓴다: ### 소제목 2~4개, 데이터에 있는 수치만 인용(없으면 "확인 필요"로 표시), 마지막에 "출처·확인 필요 항목" 목록. 과장·미확인 단정 금지. 이것은 초안이며 사실 확인 후 발행해야 함을 전제로.',
  calc:
    '작업: GPU 용량 계산 결과(JSON: GPU모델·수량·워크로드·PUE·냉각·이중화·IT부하·계약전력·랙수·상면·연간전력량·연간전력비·연간탄소·인허가 트랙 등)를 받아 부지·전력 검토자를 위한 해설을 작성한다. 구성: ① **규모 성격 한줄**(예: 중형 학습 클러스터) ② **전력·계약 시사점**(수전전압 트랙·계통영향평가·계약전력) ③ **냉각·상면·경제성 코멘트** ④ **유의점 1~2개**. 제공된 계산값만 인용하고 없는 값은 언급하지 않는다. 전력비·탄소는 편집 가능한 대표 단가/계수 기반 추정임을 전제로 명시. 300~450자.',
}

const MODEL_FOR = { report: MODEL_SONNET, brief: MODEL_SONNET, compare: MODEL_SONNET, draft: MODEL_SONNET, calc: MODEL_SONNET, search: MODEL_HAIKU, qa: MODEL_HAIKU }
const MAXTOK_FOR = { report: 1500, brief: 1200, compare: 1500, draft: 2200, calc: 1100, search: 1200, qa: 900 }

const ALLOWED = new Set(['report', 'search', 'qa', 'brief', 'compare', 'draft', 'calc'])

// 본문을 사람 프롬프트로 — 데이터는 JSON 코드블록으로 명확히 구분
function buildUserContent(task, body) {
  const q = typeof body.query === 'string' ? body.query.slice(0, 2000) : ''
  const data = body.data != null ? JSON.stringify(body.data).slice(0, 24000) : ''
  if (task === 'qa') {
    return `질문: ${q || '(질문 없음)'}${data ? `\n\n참고 컨텍스트(JSON):\n\`\`\`json\n${data}\n\`\`\`` : ''}`
  }
  if (task === 'search') {
    return `사용자 질의: ${q || '(없음)'}\n\n후보지 목록(JSON):\n\`\`\`json\n${data}\n\`\`\``
  }
  // report / brief
  return `${q ? `요청: ${q}\n\n` : ''}데이터(JSON):\n\`\`\`json\n${data}\n\`\`\``
}

export async function aiHandler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ available: false, reason: 'method_not_allowed' })
    return
  }
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    // 정직성: 키 없으면 '연동 대기'로 (가짜 응답 생성 금지)
    res.status(200).json({ available: false, reason: 'not_configured' })
    return
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  body = body || {}
  const task = String(body.task || '')
  if (!ALLOWED.has(task)) {
    res.status(400).json({ available: false, reason: 'unknown_task' })
    return
  }

  const payload = {
    model: MODEL_FOR[task],
    max_tokens: MAXTOK_FOR[task],
    // 정적 규칙(캐시) + task 규칙 분리 — 정적 블록만 cache_control
    system: [
      { type: 'text', text: STATIC_SYSTEM, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: TASK_SYSTEM[task] },
    ],
    messages: [{ role: 'user', content: buildUserContent(task, body) }],
  }

  // 스트리밍 요청(긴 리포트/브리핑/비교/초안 UX) — SSE로 델타 전송
  if (body.stream === true) {
    return streamAnswer(res, key, payload)
  }

  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 27000) // vercel maxDuration 30s 이내
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    }).catch((e) => {
      throw e
    })
    clearTimeout(t)

    if (!r.ok) {
      const status = r.status
      // 키·429·5xx 등 — 값 노출 없이 사유만
      res.status(200).json({ available: false, reason: `upstream_${status}` })
      return
    }
    const json = await r.json()
    if (json?.stop_reason === 'refusal') {
      res.status(200).json({ available: true, text: '요청을 처리할 수 없습니다(안전 정책).', refusal: true })
      return
    }
    const text = Array.isArray(json?.content)
      ? json.content
          .filter((b) => b?.type === 'text')
          .map((b) => b.text)
          .join('')
          .trim()
      : ''
    const model = json?.model || MODEL_FOR[task]
    res.setHeader('Cache-Control', 'no-store')
    res.status(200).json({
      available: true,
      task,
      model,
      text: text || '(응답이 비어 있습니다)',
      usage: json?.usage ? { in: json.usage.input_tokens, out: json.usage.output_tokens, cacheRead: json.usage.cache_read_input_tokens, usd: estimateUsd(model, json.usage) } : null,
    })
  } catch (e) {
    const reason = e?.name === 'AbortError' ? 'timeout' : 'proxy_error'
    res.status(200).json({ available: false, reason })
  }
}

// 스트리밍 — Anthropic SSE를 읽어 우리 SSE(data: {delta|done|error})로 재전송
async function streamAnswer(res, key, payload) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Connection', 'keep-alive')
  if (typeof res.flushHeaders === 'function') res.flushHeaders()
  const send = (obj) => {
    try {
      res.write(`data: ${JSON.stringify(obj)}\n\n`)
    } catch {
      /* client gone */
    }
  }
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 28000)
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': ANTHROPIC_VERSION },
      body: JSON.stringify({ ...payload, stream: true }),
      signal: ctrl.signal,
    })
    if (!r.ok || !r.body) {
      clearTimeout(t)
      send({ error: `upstream_${r.status}` })
      res.end()
      return
    }
    const reader = r.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    let usage = null
    let model = payload.model
    let refusal = false
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let idx
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const block = buf.slice(0, idx)
        buf = buf.slice(idx + 2)
        const dataLine = block.split('\n').find((l) => l.startsWith('data:'))
        if (!dataLine) continue
        const raw = dataLine.slice(5).trim()
        if (!raw || raw === '[DONE]') continue
        let ev
        try {
          ev = JSON.parse(raw)
        } catch {
          continue
        }
        if (ev.type === 'message_start') {
          model = ev.message?.model || model
          usage = ev.message?.usage || usage
        } else if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
          send({ delta: ev.delta.text })
        } else if (ev.type === 'message_delta') {
          if (ev.delta?.stop_reason === 'refusal') refusal = true
          if (ev.usage) usage = { ...(usage || {}), ...ev.usage }
        }
      }
    }
    clearTimeout(t)
    send({
      done: true,
      refusal,
      model,
      usage: usage ? { in: usage.input_tokens, out: usage.output_tokens, cacheRead: usage.cache_read_input_tokens, usd: estimateUsd(model, usage) } : null,
    })
    res.end()
  } catch (e) {
    send({ error: e?.name === 'AbortError' ? 'timeout' : 'proxy_error' })
    res.end()
  }
}
