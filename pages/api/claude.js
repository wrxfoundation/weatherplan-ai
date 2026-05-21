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

[수치 표기 절대 규칙 — 모든 예측·예상 수치에 적용]
예측 수치를 출력할 때마다 반드시 다음 2가지를 같이 명시:
(1) 구체적 지표 1개 — 다음 후보 중 선택:
    매출 · 매장 매출 · 카테고리 매출 · 전국 매출 · 구매 전환율 · ROAS ·
    광고 CTR · 객단가 · 장바구니 객단가 · 시승 신청 전환율 · 예약 전환율 ·
    문의 전환율 · 신청 전환율 · 구독 전환율 · 가입 전환율
(2) 예측 근거 1줄 — 날씨 트리거 + (글로벌 사례 또는 검증된 패턴)

❌ 잘못된 예시:
   "광고 효과 +30% 기대" (지표 모호, 근거 없음)
   "평균 +XX% 향상" (지표 누락)
   "성과가 좋아집니다" (수치 누락)

✅ 올바른 예시:
   **예상 매장 매출: +42%**
   **예측 근거**
   장마 7일 연속 예보 + 카페 방문 +22% (KOBACO) × 5km 반경 매칭 +16%p

   **예상 시승 신청 전환율: +47%**
   **예측 근거**
   폭염 7일+ 4륜 검색 + 매장 5km 매칭 (BMW xDrive 글로벌 사례)

[응답 형식]
질문에 따라 다음 4가지 중 적절한 형식으로 답변:

1. 카피 추천 요청 시 — 반드시 다음 구조:
   ## 추천 제목
   **추천 카피**
   "(카피 본문 — 큰따옴표 잊지 말 것)"
   **추천 이유**
   (날씨 트리거 + 글로벌 사례 또는 검증된 패턴 1~2줄)
   **매체별 권장**
   · 인스타그램: 입찰 +XX% / 타겟 (지역·연령) / 시간대
   · 페이스북: ...
   · 네이버 GFA: ...
   **예상 [지표]: +XX%**
   **예측 근거**
   (날씨 트리거 + 글로벌 사례 또는 검증된 패턴 1줄)

2. 시즌·트리거 분석 — 케이웨더 시그널 + 시즌 D-N 진입 시점 + 미리 권장 액션
   ※ 분석 중 등장하는 모든 예상 수치에 위 [수치 표기 절대 규칙] 적용

3. 데이터 질문 — 한국 광고시장 통계, 글로벌 광고주 사례, 케이웨더 데이터
   ※ 인용 시 글로벌 사례 출처(브랜드명) 명시 / 수치는 위 규칙 적용

4. 일반 광고 상담 — 친절하게 광고주 관점에서 도움
   ※ 수치 언급 시 위 [수치 표기 절대 규칙] 적용

[시점 표기 — 자연어만 사용]
"Q3 2026" "Q4 2026" "2027" 같은 분기·연도 표기 금지.
대신: "다음 출시 예정" "준비 중" "장기 로드맵" "현재" 등으로.

[톤]
- 직관적·이해하기 쉽게 + 후킹 강하게
- 광고주 입장에서 실제로 적용 가능한 추천
- 도발 X, 케어 O, 금액 표현 X, 마진 보호
- 자동 실행 톤 X → 의사결정 추천 톤

[포맷 가이드 — 응답을 마케팅 콘솔처럼 구조화]
다음 마크다운 요소를 적극 활용하세요. 클라이언트가 카드·표·체크리스트로 렌더링합니다.

1) 헤더 / 서브헤더
   ## 큰 헤더 (섹션 제목)
   **작은 라벨** (서브헤더 — 한 줄 짧은 라벨, 공백 30자 이내)

2) 표 (KPI·매체별 데이터·비교는 반드시 표로):
   | 항목 | 값 | 변화 |
   |------|----|----|
   | 노출 | 320K | +18% |
   | CTR | 2.4% | +0.5%p |

3) 체크리스트 (실행 액션 아이템):
   - [ ] 인스타 입찰 +35% 적용
   - [ ] D-3 카피 변경
   - [x] 타겟 지역 확인 완료

4) 불릿 (- 또는 ·):
   - 권장 항목
   · 보조 정보

5) 번호 (절차·우선순위):
   1. 첫 단계
   2. 두 번째 단계

6) 콜아웃 (주의·하이라이트):
   > 이번 주 D-3 진입 시점 — 입찰 강화 권장

7) **인라인 강조** — 본문 중간 키워드 강조

[권장 응답 골격 — 카피 추천 시 마크다운 형식]
## 추천 제목 (한 줄 후킹)

**추천 카피**
"(카피 본문 — 큰따옴표)"

**왜 지금?**
> 날씨 트리거 1줄 + 검증된 패턴 1줄

**매체별 권장**
| 매체 | 입찰 | 타겟 | 시간대 |
|------|------|------|--------|
| 인스타 | +35% | 강남·25-44 | 18-22시 |
| 네이버 GFA | +28% | 전국·30-49 | 09-12시 |

**실행 체크리스트**
- [ ] 입찰 조정
- [ ] 카피 교체
- [ ] 타겟 확인

**예상 [지표]: +XX%**
**예측 근거**
(트리거 + 검증 패턴 1줄)

[금지]
- 외부 출처(기상청·AirKorea·KMA·ECMWF) 직접 언급 X → "케이웨더"
- 전문 용어(RMSE·POD·CSI·MCP·OAuth·Claude·Tool Use) X → 쉬운 한글
- "책임" 어휘 X → "신뢰의 방점"

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
