/* ============================================================
 * Weather Plan AI · /api/scorecard-insight
 *
 * AI 성적표 — wellbian AI 총평 생성 (경량 모델 단발 호출)
 *
 * 규약 (CLAUDE.md):
 * - 시스템 프롬프트는 정적 문자열만 (동적 값 인터폴레이션 금지 — 프롬프트 캐시)
 * - 동적 데이터(점수·이슈)는 user 메시지로만 전달
 * - 최신 모델은 temperature 등 샘플링 파라미터 전송 금지
 * - 실패 시에도 진단 리포트는 이미 떠 있으므로 조용히 degrade
 * ============================================================ */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const INSIGHT_MODEL = "claude-haiku-4-5-20251001";

/* 정적 시스템 프롬프트 — 동적 값 절대 인터폴레이션 금지 */
const STATIC_SYSTEM_PROMPT = `당신은 "wellbian AI" — Weather Plan AI(케이웨더 디지털사업본부)의 AI 컨설턴트입니다.
사용자 웹사이트의 AI 검색 준비도(SEO·AEO·GEO) 진단 결과를 받아 경영진에게 보고하듯 총평합니다.

역할:
- 진단 데이터에 있는 사실만 언급 (수치·항목을 지어내지 않음)
- 마케터가 바로 실행할 수 있는 우선순위 중심으로
- 전문 용어는 한 줄 안에서 풀어서

출력 형식 — 반드시 아래 JSON만 출력 (다른 텍스트·마크다운 금지):
{
  "headline": "진단 결과를 한 문장으로 요약 (25자 이내, 문장부호 없이)",
  "summary": "현재 상태 총평 2~3문장. 잘한 것 1개는 인정하고, 가장 아픈 문제를 짚는다.",
  "priorities": ["가장 먼저 고칠 것과 그 이유 (1문장)", "두 번째 (1문장)", "세 번째 (1문장)"],
  "outlook": "우선순위를 적용했을 때 기대 효과 1~2문장 — AI 검색에서 인용될 가능성 관점으로."
}

말투: 단정하고 간결한 존댓말. 과장 금지. 한국어만.`;

export default async function handler(req, res) {
  const allowedOrigins = [
    "https://weatherplan.kweather.co.kr",
    "https://weatherplan-ai.vercel.app",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "AI 총평 준비 중" });
  }

  const { host, overall, grade, areas, issues } = req.body || {};
  if (typeof overall !== "number" || !areas) {
    return res.status(400).json({ error: "진단 결과 필수" });
  }

  /* 페이로드 최소화 — 상위 이슈 8건만 */
  const issueLines = (Array.isArray(issues) ? issues : [])
    .slice(0, 8)
    .map((i) => `- [${i.status === "fail" ? "실패" : "주의"}·${i.severity}] ${i.label}: ${String(i.summary || "").slice(0, 120)}`)
    .join("\n");

  const userMsg = `진단 대상: ${String(host || "").slice(0, 100)}
종합 ${overall}점 (${grade}등급) · SEO ${areas.seo?.score}점 · AEO ${areas.aeo?.score}점 · GEO ${areas.geo?.score}점

우선순위 이슈:
${issueLines || "- 특이 이슈 없음"}`;

  try {
    const msg = await anthropic.messages.create({
      model: INSIGHT_MODEL,
      max_tokens: 700,
      system: [
        {
          type: "text",
          text: STATIC_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMsg }],
    });

    const raw = msg.content?.find((b) => b.type === "text")?.text || "";
    let insight = null;
    try {
      const jsonStr = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
      insight = JSON.parse(jsonStr);
    } catch {
      insight = { headline: "진단 총평", summary: raw.slice(0, 400), priorities: [], outlook: "" };
    }
    return res.status(200).json({ ok: true, insight });
  } catch (err) {
    console.error("[/api/scorecard-insight]", err?.status || "", err?.message || err);
    return res.status(502).json({ error: "AI 총평 생성에 실패했습니다" });
  }
}
