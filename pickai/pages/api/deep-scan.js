/* ============================================================
 * Pick AI · /api/deep-scan
 *
 * 정밀 진단 — LLM 심사 (베타 기간 한시 무료)
 *
 * 무료 결정론 진단이 다루지 못하는 4개 항목을 Opus가 고정
 * 루브릭으로 심사한다:
 *   1) contentQuality  — 콘텐츠 깊이·독창성·답변 우선 구조
 *   2) answerDirectness — 섹션 첫 문장이 질문에 바로 답하는가
 *   3) intentFormat    — 질문 의도별 최적 포맷 사용
 *   4) eeatLlm         — 경험·전문성·권위·신뢰의 서술적 근거
 *
 * 원칙:
 * - 결정론 종합 점수는 건드리지 않는다 — 정밀 점수는 별도 표기
 * - 시스템 프롬프트는 정적(프롬프트 캐시), 페이지 데이터는 user 메시지
 * - 최신 모델에는 temperature 등 샘플링 파라미터를 보내지 않는다
 * ============================================================ */

import Anthropic from "@anthropic-ai/sdk";
import {
  normalizeTargetUrl, fetchChain, readBodyCapped, sendFetchError,
} from "../../lib/netUtils.js";
import { analyzeHtml, DEEP_RUBRIC, deepVerdict } from "../../lib/scorecardEngine.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEEP_MODEL = "claude-opus-4-8";
const MAX_TEXT_CHARS = 9000;

/* 정적 시스템 프롬프트 — 동적 값 절대 인터폴레이션 금지 (프롬프트 캐시) */
const STATIC_SYSTEM_PROMPT = `당신은 Pick AI의 수석 심사위원입니다. 웹페이지가 AI 검색(답변엔진·생성형엔진)에
인용되기 좋은 콘텐츠인지 4개 고정 루브릭으로 심사합니다.

루브릭 (각 0~100점):

1) contentQuality — 콘텐츠 품질 · AEO 준비도
   - 주제를 실질적 깊이로 다루는가 (표면적 홍보문구만 있으면 감점)
   - 다른 사이트에 없는 독자적 정보·데이터·관점이 있는가
   - 결론/답변을 먼저 제시하고 상세를 뒤에 두는 구조인가
   - 90+: 전문 리서치 수준 / 70: 충실 / 40: 홍보문구 위주 / 20 이하: 내용 거의 없음

2) answerDirectness — 답변 직접성 · 자체완결성
   - 각 섹션(헤딩) 첫 문장이 해당 주제의 결론을 바로 말하는가
   - 단락 하나만 발췌해도 맥락 없이 이해되는가 (자체완결성)
   - "저희가 도와드립니다" 같은 우회 문장으로 시작하면 감점

3) intentFormat — 의도-포맷 일치
   - 비교엔 표, 절차엔 번호 목록, 정의엔 단답 문단 등 의도에 맞는 형식인가
   - 전부 긴 서술형 문단이면 낮은 점수
   - 콘텐츠가 적어 판단 근거가 부족하면 40~50 범위에서 보수적으로

4) eeatLlm — E-E-A-T 서술 근거
   - 실제 경험·사례가 구체적으로 서술되는가 (Experience)
   - 전문성이 내용의 정확성·구체성으로 드러나는가 (Expertise)
   - 수치·출처·실명 등 검증 가능한 근거가 있는가 (Authoritativeness/Trust)

심사 원칙:
- 제공된 페이지 데이터만 근거로 판단 — 외부 지식으로 브랜드를 추측하지 않는다
- rationale에는 페이지에서 실제 관찰한 사실을 인용한다
- improvements는 바로 실행 가능한 구체적 지시로 쓴다 (각 1문장)
- 전문 용어는 괄호로 쉬운 말을 병기한다 — 예: H1(페이지 대제목), 스키마(구조화 정보)

출력 — 반드시 아래 JSON만 (다른 텍스트·마크다운 금지):
{
  "contentQuality":  { "score": 0, "rationale": "2문장 근거", "improvements": ["개선 1", "개선 2"] },
  "answerDirectness": { "score": 0, "rationale": "2문장 근거", "improvements": ["개선 1", "개선 2"] },
  "intentFormat":    { "score": 0, "rationale": "2문장 근거", "improvements": ["개선 1", "개선 2"] },
  "eeatLlm":         { "score": 0, "rationale": "2문장 근거", "improvements": ["개선 1", "개선 2"] },
  "verdictLine": "이 페이지의 인용 가능성을 한 문장으로"
}

한국어만. 점수는 정수.`;

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: "정밀 진단 서버가 준비 중입니다 — 잠시 후 다시 시도해 주세요" });
  }

  const target = normalizeTargetUrl(req.body?.url);
  if (!target) {
    return res.status(400).json({ error: "올바른 URL 형식이 아닙니다" });
  }

  /* 1) 페이지 재수집 (클라이언트가 보낸 본문을 신뢰하지 않는다) */
  let chain;
  let html = "";
  try {
    chain = await fetchChain(target.href);
    if (chain.status < 200 || chain.status >= 300) {
      return res.status(422).json({ error: `사이트가 ${chain.status}를 반환해 본문을 심사할 수 없습니다` });
    }
    html = await readBodyCapped(chain.resp);
  } catch (err) {
    return sendFetchError(res, err);
  }

  const p = analyzeHtml(html);
  if ((p.wordCount || 0) < 30) {
    return res.status(422).json({
      error: "본문 텍스트가 너무 적어 LLM 심사가 무의미합니다 — 먼저 SSR/본문 보강(JS 렌더링 갭 항목)을 해결하세요",
    });
  }

  /* 2) 심사용 페이지 데이터 구성 (원문 최대 9,000자) */
  const bodyText = String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);

  const headingLines = (p.headings || [])
    .slice(0, 40)
    .map((h) => `${"#".repeat(h.level)} ${h.text}`)
    .join("\n");

  const userMsg = `대상: ${chain.finalUrl.host}
title: ${p.title || "(없음)"}
description: ${p.description || "(없음)"}

헤딩 구조:
${headingLines || "(헤딩 없음)"}

본문 텍스트 (태그 제거, 최대 ${MAX_TEXT_CHARS}자):
${bodyText}`;

  try {
    const msg = await anthropic.messages.create({
      model: DEEP_MODEL,
      max_tokens: 1600,
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
    let parsedOut;
    try {
      parsedOut = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    } catch {
      return res.status(502).json({ error: "심사 결과 해석에 실패했습니다 — 다시 시도해 주세요" });
    }

    /* 3) 루브릭 정규화 + 검증 */
    const items = {};
    for (const r of DEEP_RUBRIC) {
      const it = parsedOut[r.key] || {};
      const score = Math.max(0, Math.min(100, Math.round(Number(it.score) || 0)));
      items[r.key] = {
        key: r.key,
        checkId: r.checkId,
        label: r.label,
        score,
        verdict: deepVerdict(score),
        rationale: String(it.rationale || "").slice(0, 500),
        improvements: (Array.isArray(it.improvements) ? it.improvements : [])
          .slice(0, 3).map((s) => String(s).slice(0, 200)),
      };
    }
    const deepScore = Math.round(
      DEEP_RUBRIC.reduce((s, r) => s + items[r.key].score, 0) / DEEP_RUBRIC.length
    );

    return res.status(200).json({
      ok: true,
      model: DEEP_MODEL,
      deepScore,
      verdictLine: String(parsedOut.verdictLine || "").slice(0, 200),
      items,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/deep-scan]", err?.status || "", err?.message || err);
    return res.status(502).json({ error: "정밀 진단 호출에 실패했습니다 — 잠시 후 다시 시도해 주세요" });
  }
}
