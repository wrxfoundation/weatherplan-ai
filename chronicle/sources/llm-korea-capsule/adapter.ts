/**
 * #1 LLM 한국팩트 타임캡슐 (llm-korea-capsule) — API 레코드형(모델 호출) 어댑터. 플래그십.
 *
 * 고정 질문셋을 매달 여러 모델에 물어 raw 응답을 스냅샷에 봉인하고 정오답을 원장에
 * 남긴다. 엔티티: capsule:<modelId>:<questionId>. 진단 신호 = `correct` 플립
 * ("모델 M이 한국 사실 Q를 이번 달에 틀리기 시작했다"). raw 텍스트는 실행마다
 * 흔들리므로 diff 필드가 아니라 스냅샷(+sha256)으로만 보존한다.
 *
 * ── 휴면 설계 ──────────────────────────────────────────────────────────────
 *   모델의 key_env가 process.env에 없으면 그 모델은 호출조차 하지 않는다(휴면).
 *   전 모델 무키면 0건 수집(config allow_empty: true로 정상 처리). 키 하나로 라이브.
 *   실패/휴면 모델의 기존 레코드는 removalScope가 삭제 판정에서 제외 → 오탐 삭제 방지
 *   (모델 폐기의 "삭제" 신호는 #14 벤더원장이 소유; 여기선 정오답 표류만 추적).
 *   키는 헤더/쿼리로만 쓰고 sourceUrl(원장)엔 절대 담지 않는다.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { createHash } from "node:crypto";
import { BaseAdapter } from "../../engine/adapters/base.js";
import type { CollectContext, CollectResult, NormalizedRecord } from "../../engine/types.js";

type Vendor = "anthropic" | "openai" | "google";

interface ModelConfig {
  id: string;
  vendor: Vendor;
  model: string;
  key_env: string;
}

interface Question {
  id: string;
  q: string;
  a: string[];
}

type Json = Record<string, unknown>;

/** 정규화 후 부분일치 채점 — 공백·문장부호 제거, 소문자화(한글은 무변). */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[.,!?;:'"`()[\]{}·。、〜~\-]/g, "");
}

function isCorrect(response: string, accepted: string[]): boolean {
  const norm = normalize(response);
  return accepted.some((a) => {
    const na = normalize(a);
    return na.length > 0 && norm.includes(na);
  });
}

function looksLikeAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b40[13]\b|invalid[\s_-]*api|authentication|unauthorized|permission/i.test(message);
}

/** 벤더별 요청 — publicUrl(원장용, 비밀 없음)과 requestUrl(실호출, google은 키 포함) 분리. */
function buildRequest(
  model: ModelConfig,
  apiKey: string,
  question: string,
  maxTokens: number,
  userAgent: string | undefined,
): { publicUrl: string; requestUrl: string; init: RequestInit } {
  const ua: Record<string, string> = userAgent ? { "User-Agent": userAgent } : {};
  switch (model.vendor) {
    case "anthropic": {
      const url = "https://api.anthropic.com/v1/messages";
      return {
        publicUrl: url,
        requestUrl: url,
        init: {
          method: "POST",
          headers: { ...ua, "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
          // 최신 모델은 temperature 등 샘플링 파라미터를 받지 않는다(전송 시 400) — 보내지 않는다.
          body: JSON.stringify({ model: model.model, max_tokens: maxTokens, messages: [{ role: "user", content: question }] }),
        },
      };
    }
    case "openai": {
      const url = "https://api.openai.com/v1/chat/completions";
      return {
        publicUrl: url,
        requestUrl: url,
        init: {
          method: "POST",
          headers: { ...ua, authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
          body: JSON.stringify({ model: model.model, max_tokens: maxTokens, messages: [{ role: "user", content: question }] }),
        },
      };
    }
    case "google": {
      const base = `https://generativelanguage.googleapis.com/v1beta/models/${model.model}:generateContent`;
      return {
        publicUrl: base, // 키(?key=)는 원장에 남기지 않는다
        requestUrl: `${base}?key=${encodeURIComponent(apiKey)}`,
        init: {
          method: "POST",
          headers: { ...ua, "content-type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: question }] }],
            generationConfig: { maxOutputTokens: maxTokens },
          }),
        },
      };
    }
  }
}

/** 벤더별 응답 텍스트 추출 — 형태 불명은 빈 문자열(=오답 채점, 크래시 아님). */
function extractText(vendor: Vendor, body: unknown): string {
  const b = body as Json;
  try {
    if (vendor === "anthropic") {
      const blocks = (b?.content as Json[] | undefined) ?? [];
      return blocks
        .map((blk) => (typeof blk?.text === "string" ? blk.text : ""))
        .join(" ")
        .trim();
    }
    if (vendor === "openai") {
      const choice = (b?.choices as Json[] | undefined)?.[0];
      const message = choice?.message as Json | undefined;
      return typeof message?.content === "string" ? message.content.trim() : "";
    }
    // google
    const cand = (b?.candidates as Json[] | undefined)?.[0];
    const parts = ((cand?.content as Json | undefined)?.parts as Json[] | undefined) ?? [];
    return parts
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .join(" ")
      .trim();
  } catch {
    return "";
  }
}

export class LlmKoreaCapsuleAdapter extends BaseAdapter {
  readonly id = "llm-korea-capsule";
  readonly family = "api-records" as const;

  private models(ctx: CollectContext): ModelConfig[] {
    const models = ctx.config.models as ModelConfig[] | undefined;
    if (!Array.isArray(models) || models.length === 0) throw new Error("config.yml에 models가 없습니다.");
    return models;
  }

  private questions(ctx: CollectContext): Question[] {
    const questions = ctx.config.questions as Question[] | undefined;
    if (!Array.isArray(questions) || questions.length === 0) throw new Error("config.yml에 questions가 없습니다.");
    return questions;
  }

  async collect(ctx: CollectContext): Promise<CollectResult> {
    const models = this.models(ctx);
    const questions = this.questions(ctx);
    const userAgent = typeof ctx.config.user_agent === "string" ? ctx.config.user_agent : undefined;
    const maxTokens = Number((ctx.config.request as Json | undefined)?.max_tokens ?? 256) || 256;
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

    const records: NormalizedRecord[] = [];
    const responses: Record<string, { text: string; sha256: string; correct: boolean }> = {};
    const activeModels = new Set<string>(); // 이번 회차에 실제로 응답을 얻은 모델
    const failedPairs = new Set<string>(); // `${modelId}:${qid}` — 전송 실패(삭제 오탐 제외용)
    const dormant: string[] = [];

    for (const model of models) {
      const apiKey = env[model.key_env];
      if (!apiKey) {
        dormant.push(`${model.id}(${model.key_env})`);
        continue; // 휴면: 호출 안 함, removalScope에서도 제외됨
      }

      let authFailed = false;
      for (const question of questions) {
        const pairKey = `${model.id}:${question.id}`;
        const { publicUrl, requestUrl, init } = buildRequest(model, apiKey, question.q, maxTokens, userAgent);
        try {
          const body = await ctx.http.json(requestUrl, init);
          const text = extractText(model.vendor, body);
          const correct = isCorrect(text, question.a);
          const sha256 = createHash("sha256").update(text).digest("hex");
          responses[pairKey] = { text, sha256, correct };
          activeModels.add(model.id);
          records.push({
            entityId: `capsule:${model.id}:${question.id}`,
            sourceUrl: publicUrl, // 비밀 없는 엔드포인트만 원장에 저장
            fields: {
              model: model.id,
              vendor: model.vendor,
              question_id: question.id,
              question: question.q,
              correct, // ← 진단 신호(정오답 플립). raw 텍스트는 스냅샷에만.
            },
          });
        } catch (error) {
          failedPairs.add(pairKey);
          const message = error instanceof Error ? error.message : String(error);
          ctx.log(`[${this.id}] 호출 실패 — 건너뜀: ${pairKey} ${message}`);
          if (looksLikeAuthError(error)) {
            authFailed = true;
            ctx.log(`[${this.id}] 인증 오류로 판단 — ${model.id} 남은 질문 생략(키 확인 필요).`);
            break; // 잘못된 키면 남은 질문 낭비 방지
          }
        }
      }
      if (authFailed) activeModels.delete(model.id);
    }

    if (dormant.length > 0) ctx.log(`[${this.id}] 휴면(키 미설정): ${dormant.join(", ")}`);
    ctx.log(
      `[${this.id}] 응답 ${records.length}건 / 활성 모델 ${activeModels.size}곳 / 질문 ${questions.length}문` +
        (records.length === 0 ? " — 휴면 회차(키 추가 시 라이브)" : ""),
    );

    return {
      raw: {
        collected_at: ctx.now().toISOString(),
        models: models.map((m) => ({ id: m.id, vendor: m.vendor, model: m.model, active: activeModels.has(m.id) })),
        question_ids: questions.map((q) => q.id),
        responses, // raw 응답 전문 + sha256 봉인(스냅샷 무가공 보존)
      },
      records,
      // 삭제 판정은 "이번에 성공한 모델 & 전송 실패하지 않은 질문"으로 좁힌다.
      // 휴면/인증실패 모델과 일시 실패 질문은 제외 → 삭제 오탐 방지.
      removalScope: (stored) => {
        const parts = stored.entityId.split(":");
        const modelId = parts[1];
        const questionId = parts.slice(2).join(":");
        return activeModels.has(modelId) && !failedPairs.has(`${modelId}:${questionId}`);
      },
    };
  }
}

export default new LlmKoreaCapsuleAdapter();
