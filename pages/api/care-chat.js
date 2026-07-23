/* ============================================================
 * 시니어케어매니저 · /api/care-chat
 *
 * 병원동행·돌봄 AI 예약 챗봇 (Claude tool use).
 * 데모 페이지 /demo 의 좌측 챗봇이 호출합니다.
 *
 * weather 계열 /api/claude 와 완전히 분리 —
 *  - 별도 시스템 프롬프트(정적 캐시 블록 1개)
 *  - 별도 툴(lib/careTools) — 견적/슬롯/예약
 *  - tool 결과의 _event 를 events[] 로 모아 클라이언트 콘솔에 반환
 *
 * 보안: ANTHROPIC_API_KEY 는 서버 환경변수로만. 브라우저 노출 X.
 * ============================================================ */

import Anthropic from "@anthropic-ai/sdk";
import { CARE_TOOL_SCHEMAS, executeCareTool } from "../../lib/careTools.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_TOOL_ROUNDS = 5;

/* ─── 모델 레지스트리 + 복잡도 라우터 (wellbian engine/router.js 계승) ───
 * env 오버라이드로 재배포 없이 핫스왑. 클라이언트 모델 문자열은 절대 수신 안 함.
 * tool 호출이 예상되는 질의(예약·견적·날씨)는 무조건 상위 모델. */
const MODELS = {
  complex: process.env.CARE_MODEL_COMPLEX || "claude-opus-4-8",
  simple: process.env.CARE_MODEL_SIMPLE || "claude-haiku-4-5-20251001",
};
function classifyCareComplexity(lastUserMsg = "") {
  const lo = String(lastUserMsg).trim();
  const isGreeting = /^(안녕|반가|하이|ㅎㅇ|고마워|고맙|감사|네[\s.!~]*$|넵|응|오케이|ok|잘있어|잘가)/i.test(lo);
  const hasBookingSignal = /예약|견적|얼마|비용|요금|동행|돌봄|병원|매니저|날씨|날짜|시간|내일|다음주|취소|변경/.test(lo);
  if (isGreeting && lo.length < 20 && !hasBookingSignal) return "simple";
  return "complex";
}
/* 파라미터 조립 단일 지점 — 최신 모델에 temperature 등 샘플링 파라미터 전송 금지 규약 강제 */
function buildModelParams(model, systemBlocks, messages) {
  return {
    model,
    max_tokens: 1400,
    system: systemBlocks,
    tools: CARE_TOOL_SCHEMAS,
    messages,
  };
}

/* ─── 케어 도메인 규칙 — wellbian DOMAIN_RULES 축소판 ───
 * 30개 전체 주입 절대 금지 원칙: 정규식 트리거로 매칭된 블록만(최대 2개)
 * buildDynamicContext() 뒤에 주입 → 정적 캐시 prefix는 1바이트도 불변. */
const CARE_RULES = {
  wheelchair: {
    trigger: /휠체어|거동\s*불편|보행기|부축|못\s*걸|잘\s*못\s*걷/,
    text: `[휠체어·거동불편 규칙]
한파→근육경직→낙상위험↑→차량 포함(hospital_vehicle) 우선 제안+무릎담요. 강수→경사로·차량 승하차 미끄럼→이동시간 +15분 여유 견적. 휠체어 여부 확인됐으면 outing_condition에 mobility=wheelchair 전달. 엘리베이터 없는 층수 이동 여부 1회 확인.`,
  },
  dementia: {
    trigger: /치매|인지\s*(저하|장애)|기억(력)?\s*(저하|없)|알츠하이머/,
    text: `[치매·인지 케어 규칙]
낯선 환경→불안↑→같은 매니저 지정 예약 권장(치매·인지 케어 전문 매니저 우선 추천). 문진은 짧게, 같은 질문 반복 금지. 보호자에게 어르신이 좋아하는 호칭·화제 1개를 미리 받아 매니저에게 전달하겠다고 안내. 대상자 본인 험담·아이 취급 표현 절대 금지.`,
  },
  dialysis: {
    trigger: /투석|항암|정기\s*(동행|진료)|매주\s*(월|화|수|목|금)|주\s*[23][회번]/,
    text: `[투석·항암 정기동행 규칙]
주 2~3회 반복→정기 예약(같은 매니저 고정) 할인 안내. 치료 후 탈수·어지럼 흔함→귀가 시 부축 필수, 대기 포함 3시간+ 견적(dialysis 요금제). 치료 직후 컨디션 급변 가능→매니저 완료 리포트에 특이사항 기록됨을 안내.`,
  },
  emotional: {
    trigger: /우울|외로|기운이\s*없|말벗|적적|쓸쓸|불안|무기력|혼자\s*계시/,
    text: `[심리·정서 케어 규칙 — 비의료 경계 엄수]
말벗·정서지원·산책 동행은 비의료 돌봄 영역 → 적극 제안 가능(home_care 요금제, 주 1~2회 정기 권장). 산책 제안 시 outing_condition으로 컨디션 좋은 날을 골라 제안. 완료 후 어르신 기분·대화 주제가 보호자 리포트로 전달됨을 안내.
진단·치료 표현 절대 금지("우울증이신 것 같아요" X → "기운 없는 날이 이어지면" O). 무기력·식욕/수면 변화가 2주 이상 지속 언급되면 정신건강의학과 진료·정신건강복지센터 1577-0199를 부드럽게 1회 안내.
자살·자해 암시가 보이면: 공감 먼저 → 자살예방상담 109 · 정신건강위기상담 1577-0199 · 생명의전화 1588-9191을 반드시 안내하고, 혼자 두지 말고 가족·전문가와 함께하도록 권유.`,
  },
};
function pickCareRules(lastUserMsg = "") {
  const hits = [];
  for (const key of Object.keys(CARE_RULES)) {
    if (CARE_RULES[key].trigger.test(lastUserMsg)) hits.push(CARE_RULES[key].text);
    if (hits.length >= 2) break; // 최대 2개만
  }
  return hits;
}

/* ─── 한국 시간 날짜 컨텍스트 (요일/다음주 계산은 서버가, 모델은 그대로 사용) ─── */
function getDateContext() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const pm = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const y = Number(pm.year), m = Number(pm.month) - 1, d = Number(pm.day);
  const dow = new Date(y, m, d).getDay();
  const dayN = ["일", "월", "화", "수", "목", "금", "토"];
  const fmt = (dt) => `${dt.getMonth() + 1}/${dt.getDate()}(${dayN[dt.getDay()]})`;
  const tmr = new Date(y, m, d + 1);
  // "다음주 화요일" = 다음주 월요일 + 1 (다음 화요일 발생일이 아님 — 월요일에도 +8일)
  const nextTue = new Date(y, m, d + ((8 - dow) % 7 || 7) + 1);
  return `오늘: ${y}년 ${m + 1}월 ${d}일 ${dayN[dow]}요일 · 내일 ${fmt(tmr)} · 다음주 화요일 ${fmt(nextTue)}`;
}

/* ─── 정적 시스템 프롬프트 (프롬프트 캐시 대상 — 동적 값 인터폴레이션 금지) ─── */
const STATIC_SYSTEM_PROMPT = `당신은 "돌봄이 AI"입니다. 시니어케어매니저 플랫폼(병원동행·돌봄 코디네이션)의 예약 상담 챗봇입니다.
보호자(자녀·가족)가 부모님·어르신의 병원동행이나 돌봄을 카카오톡처럼 편하게 예약하도록 돕습니다.

[역할 — 4단계 흐름]
1) 문진: 대상자(어머니/아버지 등), 병원·진료, 날짜·시간, 거동 수준(보행 가능/휠체어/거동 불편), 차량 필요 여부를 자연스럽게 1~2개씩 물어봅니다. 한 번에 다 묻지 말고 대화하듯.
2) 견적: 정보가 모이면 estimate_quote 도구로 투명 견적을 계산해 시간당 요금·할증·총액을 명확히 안내합니다.
3) 슬롯: check_slots 로 배정 가능한 케어매니저(평점·자격증·전문분야·거리)를 1~3명 제시합니다.
4) 예약: 보호자가 확정하면 create_booking 으로 예약을 접수하고 결제(에스크로) 안내로 마무리합니다.

[외출 컨디션 — 케이웨더 연동 (시니어케어 핵심 차별점)]
어르신은 폭염·한파·미세먼지·자외선에 취약합니다. 예약 날짜가 정해지면(견적/슬롯 단계 즈음) outing_condition 도구로 그날의 케이웨더 예보와 동행 컨디션 점수를 확인하세요. 거동 수준을 알면 mobility 파라미터로 전달(휠체어면 wheelchair).
- 출발지·도착지 모두: 문진 중 자택 지역(구 단위, 예: "관악구")을 한 번 가볍게 확인하고, outing_condition에 origin(자택)+location(병원)을 함께 전달하세요. 왕복 전 구간이 리스크라 두 지점 중 나쁜 쪽 기준으로 판정됩니다. 두 지점 차이가 있으면 "출발지는 괜찮은데 병원 쪽에 비 소식이 있어요"처럼 구분해 안내.
- 점수 계약: 외출 컨디션을 말할 때는 도구가 반환한 score와 verdict를 반드시 "NN점 · 등급" 형태로 인용. 카드에 뜨는 숫자와 본문 숫자가 달라선 안 됩니다.
- 예: "그날 동행 컨디션은 **75점 · 좋음**이에요. 다만 미세먼지가 나쁨이라 KF94 마스크 챙겨 동행할게요."
- reschedule_advised가 true면 무리하지 말고 인접 날짜 변경을 먼저 제안.
- 날씨·대기질 출처는 '케이웨더'로만 표기. 전문용어(PM2.5·UV지수·강수확률NN%) 대신 일상어(미세먼지 나쁨·햇빛 강함·비 소식) 우선.

[도구 강제 — 수치는 도구만 (절대 규칙)]
- 요금·매니저·날씨·점수 수치는 반드시 estimate_quote/check_slots/outing_condition/create_booking 결과만 인용. 도구를 부르지 않은 상태에서 금액·기온·미세먼지·점수 언급 금지. 모르면 "확인해 볼게요" 하고 도구 호출.
- "기술적 제약" / "데이터 조회 불가" / "시스템 오류" 같은 문구 절대 사용 금지. 도구가 실패 정보를 주면 그 안의 대안(제휴 지역 등)으로 자연스럽게 재제안.
- check_slots가 matched_hospital=null을 주면: 사과 1문장 + partner_districts 중 가까운 지역 매니저로 안내 가능함을 제안.

[버튼·UI 텍스트 출력 금지]
[토스로 선결제] [예약 확정하기] [자세히 보기] 같은 버튼 문구를 본문에 쓰지 마세요. 결제 버튼·카드는 화면이 자동으로 렌더링합니다. 본문은 대화만.

[의료 질문 4단 공식]
증상·질병 질문을 받으면: (1) 공감 1문장 → (2) 해당 진료과 안내(진단 아님을 명시) → (3) "동행 매니저가 진료 때 여쭤볼 수 있게 메모해 둘게요"로 서비스 전환 → (4) 응급 징후(가슴 통증 30분+, 한쪽 마비, 발음 어눌)면 즉시 119 안내. 진단·약물·용량 언급은 어떤 경우에도 금지.
보호자가 간병 소진·우울("지쳤어요", "너무 힘들어요")을 표현하면: 공감 먼저 + 정신건강위기상담 1577-0199를 부드럽게 1줄 안내.

[대화 전진 규칙]
매 응답 끝에 다음 단계로 나아가는 질문을 정확히 1개. (문진 중: "진료 예약 시간이 몇 시인가요?" / 견적 후: "이대로 가능한 매니저님을 찾아볼까요?" / 슬롯 후: "이분으로 예약할까요?") 예약 완료 후에는 질문 대신 안심 마무리.
좋은 예: "오래 서 계시기 힘드시면 외래 동행으로 잡을게요. 진료가 몇 시부터인가요?"
나쁜 예: "추가로 궁금하신 점이 있으시면 말씀해 주세요." (전진 없음 — 금지)

[대화 원칙]
- 따뜻하고 신뢰감 있게, 그러나 간결하게. 채팅 버블 기준 3~5문장.
- 보호자는 대개 직장인이라 통화가 어렵습니다. 빠르고 명확한 텍스트 응대가 핵심 가치입니다.
- 이미 답한 내용을 되묻지 마세요. 문진은 꼭 필요한 것만.
- 금액은 항상 도구가 계산한 값만 인용. 임의로 지어내지 마세요.
- 매니저를 추천할 때는 평점·전문분야·거리를 근거로 "왜 이분인지" 한 줄 덧붙입니다.

[의료·안전 가드레일 — 반드시 준수]
- 진단·처방·치료 조언 금지. "어떤 약을 드세요?" 같은 의료 질문 금지.
- 건강 민감정보는 배정에 꼭 필요한 최소한(거동 수준·휠체어 여부)만. 병명·상세 증상은 캐묻지 않습니다.
- 응급·심각한 상황이면 "119 또는 병원 응급실" 안내 후 사람 상담원 연결을 제안합니다.

[표현 규칙]
- "간병인"보다 "케어매니저" 또는 "동행매니저".
- 견적·예약 요약은 짧은 리스트로. 과장·허위 금지.
- 한국어로만 답변.

[예약 완료 톤]
create_booking 성공 후: 예약번호·매니저·일시·금액을 1줄 요약하고, "결제 링크로 선결제(에스크로)하면 확정됩니다. 출발·도착·완료 시 알림톡으로 안내드려요."로 안심시킵니다.`;

function buildDynamicContext() {
  return `[오늘 날짜 — 그대로 사용, 직접 요일 계산 금지]\n${getDateContext()}\n지역 기본값: 서울. 병원동행 기본 2시간, 외래는 보통 3~4시간(대기 포함).`;
}

export default async function handler(req, res) {
  const allowedOrigins = [
    "https://weatherplan.kweather.co.kr",
    "https://weatherplan-ai.vercel.app",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  // 프리뷰 배포(*.vercel.app)에서도 데모가 열리도록 허용
  else if (origin && /\.vercel\.app$/.test(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[/api/care-chat] ANTHROPIC_API_KEY 미설정");
    return res.status(503).json({ error: "AI 상담 준비 중입니다 (API 키 미설정)", code: "no_key" });
  }

  try {
    const t0 = Date.now();
    const { messages: rawMessages } = req.body || {};
    if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
      return res.status(400).json({ error: "messages 필수" });
    }
    // 입력 새니타이즈 — wellbian anthropic-stream.js 3종: 최근 N턴 + content truncate (max_tokens은 서버 고정)
    const messages = rawMessages.slice(-20)
      .map((m) => ({
        ...m,
        content: typeof m.content === "string" ? m.content.slice(0, 8000) : m.content,
      }))
      // 빈 assistant 메시지(도구 라운드 소진 등) 제거 — 아래 검증에서 400 나는 것 방지
      .filter((m) => !(m.role === "assistant" && (m.content == null || m.content === "")));
    // slice(-20) 홀짝 어긋남 방지 — 첫 메시지는 반드시 user (아니면 API 400)
    while (messages.length && messages[0].role !== "user") messages.shift();
    const totalLen = messages.reduce((s, m) => s + (m.content?.length || 0), 0);
    if (totalLen > 40000) return res.status(413).json({ error: "대화가 너무 깁니다" });

    for (const m of messages) {
      if (!m.role || !m.content) return res.status(400).json({ error: "각 메시지에 role·content 필수" });
      if (m.role !== "user" && m.role !== "assistant") return res.status(400).json({ error: "role은 user 또는 assistant" });
    }

    // 복잡도 라우팅 — 인사·짧은 잡담만 simple, 예약 신호 있으면 무조건 complex
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
    const complexity = classifyCareComplexity(lastUserMsg);
    const model = MODELS[complexity];

    // 케어 도메인 규칙 동적 주입 — 정적 캐시 prefix 뒤 별도 블록 (캐시 불변)
    const careRules = pickCareRules(lastUserMsg);
    const systemBlocks = [
      { type: "text", text: STATIC_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: buildDynamicContext() },
      ...careRules.map((text) => ({ type: "text", text })),
    ];

    let currentMessages = [...messages];
    let response = null;
    let rounds = 0;
    const events = [];         // 콘솔이 소비할 구조화 이벤트 (quote/slots/booking)
    const totalUsage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

    while (rounds < MAX_TOOL_ROUNDS) {
      response = await anthropic.messages.create(buildModelParams(model, systemBlocks, currentMessages));
      console.log(`[care-chat] round ${rounds} · ${model} · elapsed ${Date.now() - t0}ms`);

      if (response.usage) {
        totalUsage.input_tokens += response.usage.input_tokens || 0;
        totalUsage.output_tokens += response.usage.output_tokens || 0;
        totalUsage.cache_read_input_tokens += response.usage.cache_read_input_tokens || 0;
        totalUsage.cache_creation_input_tokens += response.usage.cache_creation_input_tokens || 0;
      }

      if (response.stop_reason !== "tool_use") break;

      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      const toolResults = toolUseBlocks.map((block) => {
        let result;
        try {
          result = executeCareTool(block.name, block.input);
        } catch (e) {
          console.error(`[/api/care-chat] tool ${block.name} 실패:`, e.message);
          result = { error: `도구 실행 실패: ${e.message}` };
        }
        if (result && result._event) events.push(result._event);
        const { _event, ...clean } = result || {};
        return { type: "tool_result", tool_use_id: block.id, content: JSON.stringify(clean) };
      });

      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
      rounds++;
    }

    const reply = (response?.content || [])
      .filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();

    // 캐시 검증 루틴 — 반복 요청인데 cache_read=0이면 정적 블록 오염 의심 (CLAUDE.md 규약의 코드화)
    if (messages.length > 2 && totalUsage.cache_read_input_tokens === 0) {
      console.warn("[care-chat] 반복 요청 캐시 MISS — 정적 블록 오염 의심");
    }

    return res.status(200).json({
      content: reply,
      events,               // [{type:'quote'|'weather'|'slots'|'booking', ...}]
      usage: totalUsage,
      stop_reason: response?.stop_reason,
      model_used: model,
      complexity,
      rounds,
      rules_injected: careRules.length,
      elapsed_ms: Date.now() - t0,
    });
  } catch (err) {
    console.error("[/api/care-chat] Error:", err.status, err.message);
    if (err.status === 401) return res.status(500).json({ error: "API 인증 오류", code: "auth" });
    if (err.status === 400) return res.status(400).json({ error: `요청 오류: ${err.message || ""}`, code: "bad_request" });
    if (err.status === 429) return res.status(429).json({ error: "요청 한도 초과 — 잠시 후 다시", code: "rate_limit" });
    if (err.status === 529) return res.status(503).json({ error: "AI 서버 과부하 — 30초 후 다시", code: "overloaded" });
    return res.status(500).json({ error: `일시적 오류${err.message ? ` (${err.message})` : ""}`, code: "unknown" });
  }
}
