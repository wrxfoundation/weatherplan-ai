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
  const nextTue = new Date(y, m, d + ((2 - dow + 7) % 7 || 7));
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
어르신은 폭염·한파·미세먼지·자외선에 취약합니다. 예약 날짜가 정해지면(견적/슬롯 단계 즈음) outing_condition 도구로 그날 그 지역의 케이웨더 예보(날씨·기온·미세먼지·자외선)와 종합 등급·준비물을 확인해, 동행 준비물을 한 줄로 안내하세요.
- 예: "그날 서울 미세먼지 나쁨 예보라 KF94 마스크 챙겨 동행할게요." / "자외선 매우높음이라 양산·모자 준비하겠습니다."
- 날씨·대기질 출처는 '케이웨더'로만 표기.
- 의료조언 금지 가드레일은 그대로 — 질병 예방·처방 언급 금지, 어디까지나 '외출 준비물' 안내.

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
    const { messages } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages 필수" });
    }
    const totalLen = messages.reduce((s, m) => s + (m.content?.length || 0), 0);
    if (totalLen > 40000) return res.status(413).json({ error: "대화가 너무 깁니다" });

    for (const m of messages) {
      if (!m.role || !m.content) return res.status(400).json({ error: "각 메시지에 role·content 필수" });
      if (m.role !== "user" && m.role !== "assistant") return res.status(400).json({ error: "role은 user 또는 assistant" });
    }

    const systemBlocks = [
      { type: "text", text: STATIC_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      { type: "text", text: buildDynamicContext() },
    ];

    let currentMessages = [...messages];
    let response = null;
    let rounds = 0;
    const events = [];         // 콘솔이 소비할 구조화 이벤트 (quote/slots/booking)
    const totalUsage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

    while (rounds < MAX_TOOL_ROUNDS) {
      response = await anthropic.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 1400,
        system: systemBlocks,
        tools: CARE_TOOL_SCHEMAS,
        messages: currentMessages,
      });

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

    return res.status(200).json({
      content: reply,
      events,               // [{type:'quote'|'slots'|'booking', ...}]
      usage: totalUsage,
      stop_reason: response?.stop_reason,
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
