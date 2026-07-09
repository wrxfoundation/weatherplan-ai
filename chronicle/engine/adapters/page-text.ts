/**
 * 페이지 텍스트형 계열 — 텍스트 추출 diff (#11 #14 #17).
 * 대상 페이지 목록을 돌며 본문 텍스트를 뽑아 페이지당 1레코드로 만든다.
 *
 * 개별 페이지의 페치 실패는 그 페이지만 건너뛰고(삭제 오탐 방지를 위해
 * removalScope에서 제외) 나머지 수집은 계속한다.
 */
import { sha256Hex } from "../integrity.js";
import type { CollectContext, CollectResult, NormalizedRecord } from "../types.js";
import { BaseAdapter } from "./base.js";

export interface PageTarget {
  entityId: string;
  url: string;
}

export abstract class PageTextAdapter extends BaseAdapter {
  readonly family = "page-text" as const;

  protected abstract targets(ctx: CollectContext): Promise<PageTarget[]> | PageTarget[];

  /** HTML → 비교 대상 텍스트. 기본은 태그 제거 + 공백 정규화 (필요 시 재정의). */
  protected extract(html: string): string {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  async collect(ctx: CollectContext): Promise<CollectResult> {
    const targets = await this.targets(ctx);
    const records: NormalizedRecord[] = [];
    const raw: Record<string, { url: string; body: string }> = {};
    const failed = new Set<string>();

    for (const target of targets) {
      try {
        const body = await ctx.http.text(target.url);
        raw[target.entityId] = { url: target.url, body };
        const text = this.extract(body);
        records.push({
          entityId: target.entityId,
          sourceUrl: target.url,
          fields: { text, text_sha256: sha256Hex(text) },
        });
      } catch (error) {
        failed.add(target.entityId);
        ctx.log(`[${this.id}] 페치 실패 — 건너뜀: ${target.url} (${error instanceof Error ? error.message : error})`);
      }
    }

    return {
      raw,
      records,
      // 페치에 실패한 대상은 이번 회차 삭제 판정에서 제외한다.
      removalScope: (stored) => !failed.has(stored.entityId),
    };
  }
}
