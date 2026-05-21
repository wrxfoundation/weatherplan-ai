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
import { TOOL_SCHEMAS, executeTool } from "../../lib/tools.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_TOOL_ROUNDS = 4;  // Tool use 최대 라운드 (무한 루프 방지)

/* ─── 페르소나 라벨 매핑 ─── */
const PERSONA_LABEL = {
  soloprenuer: "1인 사장님·자영업",
  seller: "이커머스 셀러",
  enterprise: "대형광고주·본사",
  agency: "광고대행사 AE",
};

/* ─── 업종 라벨 매핑 ─── */
const INDUSTRY_LABEL = {
  fashion: "패션·의류", beauty: "뷰티·H&B", beverage: "음료·주류", retail: "리테일·이커머스",
  auto: "자동차", health: "헬스·OTC", home: "홈·인테리어", appliance: "가전",
  sleep: "수면·침구", food: "식음·외식", travel: "여행·DOOH", outdoor: "아웃도어",
  finance: "금융·보험", edu: "교육·구독", ent: "엔터·콘텐츠", telco: "통신·구독",
  pet: "반려·펫", solo: "1인 가구·솔로",
};

const BUDGET_LABEL = {
  small: "월 100만원 미만", medium: "월 100~500만원",
  large: "월 500~3,000만원", xlarge: "월 3,000만원+",
};

/* ─── 계절 자동 산출 ─── */
function getSeason() {
  const m = new Date().getMonth();
  if (m < 2 || m > 10) return "겨울";
  if (m < 5) return "봄";
  if (m < 8) return "여름";
  return "가을";
}

/* ─── 한국 시간 날짜 컨텍스트 ─── */
function getDateContext() {
  const now = new Date();
  const dayN = ["일", "월", "화", "수", "목", "금", "토"];
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const dow = now.getDay();
  const fmt = (dt) => `${dt.getMonth() + 1}/${dt.getDate()}(${dayN[dt.getDay()]})`;
  const monOff = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(y, m, d + monOff);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(mon); dt.setDate(mon.getDate() + i); return fmt(dt);
  }).join(" ");
  const satOff = dow === 0 ? -1 : 6 - dow;
  const sunOff = dow === 0 ? 0 : 7 - dow;
  const sat = new Date(y, m, d + satOff);
  const sun = new Date(y, m, d + sunOff);
  const nsat = new Date(sat); nsat.setDate(sat.getDate() + 7);
  const nsun = new Date(sun); nsun.setDate(sun.getDate() + 7);
  const tmr = new Date(y, m, d + 1);
  const dat = new Date(y, m, d + 2);
  return `오늘: ${y}년 ${m + 1}월 ${d}일 ${dayN[dow]}요일
내일: ${fmt(tmr)}, 모레: ${fmt(dat)}
이번주: ${weekDates}
이번 주말: ${fmt(sat)} ~ ${fmt(sun)}
다음 주말: ${fmt(nsat)} ~ ${fmt(nsun)}`;
}

/* ─── 복잡도 라우터 (wellbian 엔진 기반, 광고 맥락에 맞춰 변경) ─── */
function classifyComplexity(userInput) {
  if (!userInput) return "haiku";
  const lo = userInput.toLowerCase().replace(/\s+/g, " ").trim();

  // ── 무조건 Opus (복잡 추론) ──
  if (/비교|vs|보다.*(좋|나쁘|높|낮|효과적)|중에.*어떤|중에.*뭐/.test(lo)) return "opus";
  if (/카피.*추천|카피.*만들|카피.*써|크리에이티브/.test(lo)) return "opus";  // 창작 작업
  if (/매체.*조합|입찰.*전략|타깃.*분석|페르소나.*분석/.test(lo)) return "opus";
  if (/순위|랭킹|top|최고|가장.*(좋|효과|매출|전환)/.test(lo)) return "opus";
  if (/주말|다음주|이번주|월별.*계획|시즌.*기획|연간/.test(lo)) return "opus";
  if (/(roas|cpa|cpc|ctr|kpi).*분석|예측|시뮬레이션/.test(lo)) return "opus";
  if (/(글로벌|해외|일본|미국|중국|유럽).*사례|벤치마킹/.test(lo)) return "opus";
  if (lo.length > 100) return "opus";

  // ── 무조건 Haiku (단순 조회) ──
  if (/^(안녕|반가|하이|ㅎㅇ|고마|감사|네|아니|뭐|그래|오케이|ok)$/i.test(lo.trim())) return "haiku";
  if (/^.{0,18}(오늘|지금|현재).*(날씨|기온|비|미세).{0,15}$/.test(lo)) return "haiku";
  if (/^.{0,15}(우산|마스크|선크림|반팔|긴팔|패딩).{0,10}$/.test(lo)) return "haiku";

  // 기본: 대부분 Opus (광고 의사결정은 정확도 우선)
  return "opus";
}

/* ─── 시스템 프롬프트 빌더 (v2 — wellbian 본진 흡수) ─── */
function buildSystemPrompt(industry, persona, profile) {
  const industryLabel = industry || "전체 업종";
  const personaLabel = PERSONA_LABEL[persona] || persona || "광고주";

  // 사업장 컨텍스트 (온보딩에서 받은 wpa_profile)
  const contextLines = [];
  if (profile) {
    if (profile.businessName) contextLines.push(`사업장명: ${profile.businessName}`);
    if (profile.persona) {
      const pl = PERSONA_LABEL[profile.persona];
      if (pl) contextLines.push(`광고주 유형: ${pl}`);
    }
    if (profile.sido || profile.sigungu) {
      contextLines.push(`위치: ${[profile.sido, profile.sigungu].filter(Boolean).join(" ")}`);
    } else if (profile.regionScope === "national") {
      contextLines.push(`운영 범위: 전국 캠페인`);
    }
    if (profile.industries?.length) {
      const inds = profile.industries.map((id) => INDUSTRY_LABEL[id] || id);
      contextLines.push(`업종(주력 → 보조): ${inds.join(" / ")}`);
      // 첫 번째 업종의 sub 카테고리 노출
      const primaryId = profile.industries[0];
      const subs = profile.industrySubs?.[primaryId];
      if (subs?.length) contextLines.push(`주력 세부 카테고리: ${subs.join(" · ")}`);
    }
    if (profile.budget) {
      const bl = BUDGET_LABEL[profile.budget];
      if (bl) contextLines.push(`광고 예산: ${bl}`);
    }
    if (profile.channels?.length) {
      contextLines.push(`활용 채널: ${profile.channels.join(" · ")}`);
    }
  }
  const profileBlock = contextLines.length
    ? `\n[사용자 사업장 컨텍스트]\n${contextLines.join("\n")}\n위 정보를 모든 추천에 자연스럽게 반영하세요. 절대 "어느 지역이세요?" "어떤 업종이세요?" 같은 되묻기 금지.\n`
    : "";

  return `당신은 wellbian AI입니다. 한국 광고주를 위한 날씨 기반 광고 의사결정 인텔리전스 AI입니다.

[당신의 역할]
- ${industryLabel} 업종의 ${personaLabel}에게 광고 의사결정을 추천합니다
- 카피·예산·타이밍·매체별 입찰 전략을 제안합니다
- 자동 실행은 하지 않습니다 — 추천만 제공, 실행은 광고주가 콘솔에서 직접
${profileBlock}
[날짜 컨텍스트 — 반드시 그대로 사용. 직접 요일/날짜 계산 금지]
${getDateContext()}
계절: ${getSeason()}

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

[★★★ 응답 길이 절대 규칙 — 모든 답변에 강제 적용 ★★★]
- 일반 질문: 4~8문장 (200자 이내)
- 카피·매체·예산 추천: 최대 15문장 (600자 이내)
- 복합 질문(다지역·다업종): 최대 20문장 (800자 이내)
- 표(table): 최대 1개, 5행 이내. 같은 정보를 표·문장·리스트로 반복 금지
- 채팅 버블에서 읽기 어려워지지 않게. 길게 늘어놓지 마세요.

[★★★ 콘텐츠 first, 링크 last 절대 원칙 ★★★]
- 절대 금지: "네이버에서 확인하세요" / "여기서 보세요" / "링크 바로가기" — 이걸 메인 답변으로 쓰면 사용자가 이탈합니다
- 올바른 패턴: 알찬 콘텐츠를 먼저 제공 → 맨 끝에 "더 자세히 보려면 🔗" 한 줄
- 광고 콘솔 가이드는 핵심 액션을 답변 안에서 완결한 뒤 보조 링크로

[측정 지점 명시 (타 AI와의 결정적 차별점)]
날씨/미세먼지 답변 시 케이웨더 측정 지점을 자연스럽게 인용:
- "📍 강남구 역삼동 KWeather 센서 기준 PM2.5 23㎍/㎥"
- "📍 안양시 만안구 측정망 기준 기온 16.2°C"
일반 Claude는 "서울 날씨"라고만 말하지만, 우리는 동단위 5분 갱신. 이 정밀함이 신뢰의 핵심입니다.
단, 매번 길게 쓰지 말고 첫 답변에 한 번만 자연스럽게.

[시제 구분 — 매우 중요]
- "지금 / 현재" 데이터 = "현재" "실시간" 표현
- "오늘 18시 / 내일 / 모레" 데이터 = "예보" "예상" 표현 (단정 X)
- 예: "현재 강남 강수확률 75%" vs "내일 오후 강수확률 80% 예상"

[인라인 차트 문법 — KPI·예보 데이터 시각화]
데이터를 시각적으로 보여줄 때 아래 문법을 본문에 직접 출력하세요. 클라이언트가 자동으로 미니 차트로 렌더링합니다.

문법: <<chart:타입|제목|라벨1:값1,라벨2:값2,...|단위>>
- 타입: bar (막대 — KPI·강수확률·노출·매출) / line (꺾은선 — 기온·CTR 추이)
- 라벨: 시간(09시,12시) · 요일(월,화,수) · 날짜(5/22)
- 값: 숫자만 (소수점 1자리)
- 단위: %, °C, 만원, 건 등

예시:
"이번 주 추천 강도예요.
<<chart:bar|이번 주 광고 강도|월:65,화:80,수:55,목:40,금:75,토:50,일:35|%>>
화요일에 입찰 강화 권장합니다."

⚠️ 규칙:
- 데이터가 3개 이상일 때만 사용 (2개 이하는 텍스트로 충분)
- 차트 앞뒤로 반드시 텍스트 해석 추가 (차트만 덩그러니 X)
- 한 답변에 차트 최대 2개
- 인사·잡담·짧은 답변에는 사용 금지

[Tool 결과 활용 가이드 — 데이터 → 해석 → 비교 → 행동 제안]
Tool이 데이터를 반환하면 단순 나열 금지. 다음 5단계로 풀어주세요:
1) 핵심 데이터 1~2개 인용 (📍 측정 지점 포함)
2) 해석 — 그래서 뭐가 좋다/나쁘다
3) 어제·평년 대비 비교 (가능한 경우)
4) 사업장 프로필 맞춤 (위 컨텍스트 활용)
5) 다음 행동 1~2개 (입찰·카피·매체)

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

  // API 키 환경변수 가드 (Vercel 환경변수 미설정 시 사용자 친화 메시지)
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[/api/claude] ANTHROPIC_API_KEY 환경변수 미설정");
    return res.status(503).json({
      error: "AI 서비스 준비 중 — 운영팀이 환경을 점검하고 있습니다 (5분 후 다시)",
    });
  }

  try {
    const {
      messages,
      industry,
      persona,
      profile,                  // 온보딩에서 받은 사업장 컨텍스트 (위치/업종/예산/채널)
      model: modelOverride,     // 명시 override (없으면 자동 라우터)
      max_tokens = 1024,
      temperature = 0.7,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages 필수" });
    }

    // 페이로드 크기 가드 (총 메시지 길이 50KB 초과 차단)
    const totalLen = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    if (totalLen > 50000) {
      return res.status(413).json({ error: "메시지가 너무 깁니다 — 50,000자 이내로 줄여주세요" });
    }

    // 복잡도 기반 모델 자동 라우팅 (단순 → Haiku, 복잡 → Opus)
    const lastUserMsg = messages.filter((m) => m.role === "user").pop()?.content || "";
    const complexity = classifyComplexity(lastUserMsg);
    const model = modelOverride
      || (complexity === "haiku" ? "claude-haiku-4-5-20251001" : "claude-opus-4-7");

    // 메시지 형식 검증 (role / content 필수)
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ error: "각 메시지에 role과 content 필수" });
      }
      if (msg.role !== "user" && msg.role !== "assistant") {
        return res.status(400).json({ error: "role은 user 또는 assistant" });
      }
    }

    const systemPrompt = buildSystemPrompt(industry, persona, profile);

    // Tool Use 루프 — 모델이 tool을 요청하면 실행하고 결과를 다시 전달
    let currentMessages = [...messages];
    let response = null;
    let toolRounds = 0;
    let totalUsage = { input_tokens: 0, output_tokens: 0 };
    const toolCallTrace = [];  // 디버깅·관측용

    while (toolRounds < MAX_TOOL_ROUNDS) {
      response = await anthropic.messages.create({
        model,
        max_tokens,
        temperature,
        system: systemPrompt,
        tools: TOOL_SCHEMAS,
        messages: currentMessages,
      });

      // 사용량 누적
      if (response.usage) {
        totalUsage.input_tokens += response.usage.input_tokens || 0;
        totalUsage.output_tokens += response.usage.output_tokens || 0;
      }

      // Tool 요청 없으면 종료
      if (response.stop_reason !== "tool_use") break;

      // Tool 요청 블록들 실행
      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      const toolResults = toolUseBlocks.map((block) => {
        const result = executeTool(block.name, block.input);
        toolCallTrace.push({ name: block.name, input: block.input, result });
        return {
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        };
      });

      // 다음 라운드 메시지 구성: assistant tool_use → user tool_result
      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ];
      toolRounds++;
    }

    // 응답 처리 — text block 추출
    const textBlocks = (response?.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text);

    const reply = textBlocks.join("\n").trim();

    return res.status(200).json({
      content: reply,
      usage: totalUsage,
      tool_calls: toolCallTrace.length,
      complexity,
      model_used: model,
      stop_reason: response?.stop_reason,
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
