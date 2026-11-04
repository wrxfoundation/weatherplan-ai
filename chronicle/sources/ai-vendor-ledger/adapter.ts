/**
 * #14 AI 벤더 원장 (ai-vendor-ledger) — API 레코드형 어댑터.
 *
 * OpenRouter 공개 모델 API에서 전 벤더의 모델·가격·컨텍스트를 관측한다.
 * 가격 변경 = 필드 이벤트, 모델 소멸(목록에서 사라짐) = 삭제 이벤트(폐기).
 * 새 모델 등장 = 생성 이벤트. 벤더가 조용히 값을 고쳐도 원장은 전후를 기억한다.
 *
 * 엔티티: model:<id> (예: model:anthropic/claude-3.5-sonnet)
 * 필드는 안정적인 것만 tracked — 마케팅 문구(description)·가변 파라미터는 제외해
 * 잡음 churn을 막는다. 원본 응답 전체는 스냅샷에 무가공 보존된다.
 */
import { ApiRecordsAdapter } from "../../engine/adapters/api-records.js";
import type { CollectContext, NormalizedRecord } from "../../engine/types.js";

interface OpenRouterModel {
  id?: string;
  name?: string;
  context_length?: number;
  architecture?: { modality?: string };
  pricing?: { prompt?: string; completion?: string; request?: string; image?: string };
}

interface OpenRouterResponse {
  data?: OpenRouterModel[];
}

export class AiVendorLedgerAdapter extends ApiRecordsAdapter {
  readonly id = "ai-vendor-ledger";

  protected async fetchRaw(ctx: CollectContext): Promise<unknown> {
    const endpoint = String(ctx.config.endpoint ?? "");
    if (!endpoint) throw new Error("config.yml에 endpoint가 없습니다.");
    const userAgent = ctx.config.user_agent;
    const init: RequestInit | undefined =
      typeof userAgent === "string" && userAgent
        ? { headers: { "User-Agent": userAgent, Accept: "application/json" } }
        : undefined;
    const body = (await ctx.http.json(endpoint, init)) as OpenRouterResponse;
    if (!body || !Array.isArray(body.data)) {
      throw new Error(`벤더 API 응답 형식이 아닙니다(무인증 JSON 기대): ${JSON.stringify(body).slice(0, 200)}`);
    }
    ctx.log(`[${this.id}] 모델 ${body.data.length}건 수신`);
    return body;
  }

  protected normalize(raw: unknown, ctx: CollectContext): NormalizedRecord[] {
    const { data } = raw as OpenRouterResponse;
    const endpoint = String(ctx.config.endpoint ?? "");
    const records: NormalizedRecord[] = [];
    const seen = new Set<string>();
    for (const model of data ?? []) {
      if (!model.id || seen.has(model.id)) continue;
      seen.add(model.id);
      records.push({
        entityId: `model:${model.id}`,
        sourceUrl: endpoint,
        fields: {
          name: model.name ?? null,
          modality: model.architecture?.modality ?? null,
          context_length: model.context_length ?? null,
          // 토큰당 USD (문자열 그대로 — 벤더 원값 보존). 가격 변경이 핵심 신호.
          price_prompt: model.pricing?.prompt ?? null,
          price_completion: model.pricing?.completion ?? null,
          price_request: model.pricing?.request ?? null,
          price_image: model.pricing?.image ?? null,
        },
      });
    }
    return records;
  }
}

export default new AiVendorLedgerAdapter();
