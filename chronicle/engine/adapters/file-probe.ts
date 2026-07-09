/**
 * 파일/프로브형 계열 — 경량 파일·헤더 수집 (#16 #19).
 * robots.txt / llms.txt / .well-known 매니페스트 / HTTP 상태 프로브처럼
 * "작은 파일 또는 응답 메타데이터"를 대상당 1레코드로 기록한다.
 */
import { sha256Hex } from "../integrity.js";
import type { CollectContext, CollectResult, NormalizedRecord } from "../types.js";
import { BaseAdapter } from "./base.js";

export interface ProbeTarget {
  entityId: string;
  url: string;
}

export abstract class FileProbeAdapter extends BaseAdapter {
  readonly family = "file-probe" as const;

  /** 본문을 fields에 원문 그대로 싣는 상한(바이트). robots.txt류는 충분히 담긴다. */
  protected maxInlineBytes = 65_536;

  protected abstract targets(ctx: CollectContext): Promise<ProbeTarget[]> | ProbeTarget[];

  /** 대상 1건 프로브. 기본: GET 후 상태·타입·해시(+작으면 본문 원문). 필요 시 재정의. */
  protected async probe(ctx: CollectContext, target: ProbeTarget): Promise<Record<string, unknown>> {
    const response = await ctx.http.raw(target.url);
    const body = await response.text();
    const fields: Record<string, unknown> = {
      status: response.status,
      content_type: response.headers.get("content-type"),
      body_bytes: Buffer.byteLength(body),
      body_sha256: sha256Hex(body),
    };
    if (Buffer.byteLength(body) <= this.maxInlineBytes) fields.body = body;
    return fields;
  }

  async collect(ctx: CollectContext): Promise<CollectResult> {
    const targets = await this.targets(ctx);
    const records: NormalizedRecord[] = [];
    const rawEntries: Array<[string, unknown]> = [];
    const failed = new Set<string>();

    for (const target of targets) {
      try {
        const fields = await this.probe(ctx, target);
        rawEntries.push([target.entityId, { url: target.url, ...fields }]);
        records.push({ entityId: target.entityId, sourceUrl: target.url, fields });
      } catch (error) {
        failed.add(target.entityId);
        ctx.log(`[${this.id}] 프로브 실패 — 건너뜀: ${target.url} (${error instanceof Error ? error.message : error})`);
      }
    }

    return {
      raw: Object.fromEntries(rawEntries),
      records,
      removalScope: (stored) => !failed.has(stored.entityId),
    };
  }
}
