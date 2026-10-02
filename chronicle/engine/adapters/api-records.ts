/**
 * API 레코드형 계열 — JSON 레코드 diff (#4 #5 #7 #9 #13 #18).
 * 소스별 어댑터는 fetchRaw / normalize 두 가지만 구현하면 된다.
 */
import type { CollectContext, CollectResult, NormalizedRecord } from "../types.js";
import { BaseAdapter } from "./base.js";

export abstract class ApiRecordsAdapter extends BaseAdapter {
  readonly family = "api-records" as const;

  /** 소스 API를 호출해 원본 응답을 그대로 돌려준다 (스냅샷 보존 대상). */
  protected abstract fetchRaw(ctx: CollectContext): Promise<unknown>;

  /** 원본 응답 → 정규화 레코드. 필드명은 원본 그대로 보존한다. */
  protected abstract normalize(raw: unknown, ctx: CollectContext): NormalizedRecord[];

  /** 삭제 감지 범위 (수집 윈도가 있는 소스는 재정의). */
  protected removalScope(ctx: CollectContext): ((stored: NormalizedRecord) => boolean) | undefined {
    void ctx;
    return undefined;
  }

  async collect(ctx: CollectContext): Promise<CollectResult> {
    const raw = await this.fetchRaw(ctx);
    return { raw, records: this.normalize(raw, ctx), removalScope: this.removalScope(ctx) };
  }
}
