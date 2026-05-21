/* ============================================================
 * Weather Plan AI · /api/claude
 *
 * Anthropic Claude API proxy — Vercel serverless function
 * Studio·AgencyBoard·Onboarding 등 모든 챗봇 페이지에서 호출
 *
 * 배포:
 * - Vercel pages/api/claude.js 또는 app/api/claude/route.js로 배치
 * - 환경 변수: ANTHROPIC_API_KEY (Vercel Project Settings > Environment Variables)
 *
 * 보안:
 * - API key는 server-side 환경 변수로만 사용 (브라우저 노출 X)
 * - CORS 헤더 설정으로 자기 도메인에서만 호출
 * - rate limit은 Vercel Edge config로 분리 권장
 * ============================================================ */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/* ─── 시스템 프롬프트 빌더 ─── */
function buildSystemPrompt(industry, persona) {
  const industryLabel = industry || "전체 업종";
  const personaLabel = persona || "광고주";

  return `당신은 wellbian AI입니다. 한국 광고주를 위한 날씨 기반 광고 의사결정 인텔리전스 AI입니다.

[당신의 역할]
- ${industryLabel} 업종의 ${personaLabel}에게 광고 의사결정을 추천합니다
- 카피·예산·타이밍·매체별 입찰 전략을 제안합니다
- 자동 실행은 하지 않습니다 — 추천만 제공, 실행은 광고주가 콘솔에서 직접

[데이터 소스]
- 케이웨더 60일 AI 예보 (NVIDIA 기반 학습 + 전문 예보관 검수)
- 케이웨더 100+ 상황 시그널 (기온·습도·UV·미세먼지·계절·재난 등)
- 글로벌 광고주 100+ 검증 사례
- 30,000여개 측정 센서망 (동단위 5분 갱신)

[응답 형식]
질문에 따라 다음 4가지 중 적절한 형식으로 답변:

1. 카피 추천 요청 시 — 반드시 다음 구조:
   ## 추천 제목
   **추천 카피**
   "(카피 본문)"
   **추천 이유**
   (날씨 트리거 + 글로벌 사례 또는 검증된 패턴)
   **매체별 권장**
   · 인스타그램: 입찰 +XX% / 타겟 (지역·연령) / 시간대
   · 페이스북: ...
   · 네이버 GFA: ...
   **예상 효과**
   +XX% (케이웨더 60일 예보 기준)

2. 시즌·트리거 분석 — 케이웨더 시그널 + 시즌 D-N 진입 시점 + 미리 권장 액션

3. 데이터 질문 — 한국 광고시장 통계, 글로벌 광고주 사례, 케이웨더 데이터

4. 일반 광고 상담 — 친절하게 광고주 관점에서 도움

[톤]
- 직관적·이해하기 쉽게 + 후킹 강하게
- 광고주 입장에서 실제로 적용 가능한 추천
- 도발 X, 케어 O, 금액 표현 X, 마진 보호
- 자동 실행 톤 X → 의사결정 추천 톤

[금지]
- 외부 출처(기상청·AirKorea·KMA·ECMWF) 직접 언급 X → "케이웨더"
- 전문 용어(RMSE·POD·CSI) X → 쉬운 한글
- "책임" 어휘 X → "신뢰의 방점"
- 카피 작성 시 인용 부호 안 잊을 것

한국어로만 답변하세요.`;
}

/* ─── API 핸들러 ─── */
export default async function handler(req, res) {
  // CORS 헤더 (자기 도메인 한정)
  const allowedOrigins = [
    "https://weatherplan.kweather.co.kr",
    "https://weatherplan-ai.vercel.app",
    "http://localhost:3000",  // 로컬 개발
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      messages,
      industry,
      persona,
      model = "claude-opus-4-7",
      max_tokens = 1024,
      temperature = 0.7,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages 필수" });
    }

    // 메시지 형식 검증 (role / content 필수)
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ error: "각 메시지에 role과 content 필수" });
      }
      if (msg.role !== "user" && msg.role !== "assistant") {
        return res.status(400).json({ error: "role은 user 또는 assistant" });
      }
    }

    const systemPrompt = buildSystemPrompt(industry, persona);

    // Anthropic API 호출
    const response = await anthropic.messages.create({
      model,
      max_tokens,
      temperature,
      system: systemPrompt,
      messages,
    });

    // 응답 처리 — text block 추출
    const textBlocks = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text);

    const reply = textBlocks.join("\n").trim();

    return res.status(200).json({
      content: reply,
      usage: response.usage,
      model: response.model,
      stop_reason: response.stop_reason,
    });

  } catch (err) {
    console.error("[/api/claude] Error:", err.message);

    // Anthropic SDK 에러 처리
    if (err.status === 401) {
      return res.status(500).json({ error: "API 인증 오류 (서버 설정 확인 필요)" });
    }
    if (err.status === 429) {
      return res.status(429).json({ error: "요청 한도 초과 — 잠시 후 다시 시도해주세요" });
    }
    if (err.status === 529) {
      return res.status(503).json({ error: "AI 서버 일시적 과부하 — 30초 후 다시" });
    }

    return res.status(500).json({
      error: "일시적인 오류가 발생했습니다",
      detail: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

/* ============================================================
 * 패키지 설치 (Vercel package.json):
 *   npm install @anthropic-ai/sdk
 *
 * 환경 변수 (Vercel Project Settings > Environment Variables):
 *   ANTHROPIC_API_KEY=sk-ant-...
 *
 * 사용 예시 (StudioPage.jsx):
 *
 *   const response = await fetch("/api/claude", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       messages: [
 *         { role: "user", content: "강남 카페예요. 장마 광고 어떻게?" },
 *       ],
 *       industry: "음료·외식",
 *       persona: "1인 사장님·자영업",
 *       model: "claude-opus-4-7",
 *     }),
 *   });
 *   const data = await response.json();
 *   if (data.content) {
 *     // data.content 사용
 *   } else if (data.error) {
 *     // 에러 처리
 *   }
 * ============================================================ */
