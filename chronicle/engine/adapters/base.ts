/**
 * 어댑터 공통 추상 — 3계열(api-records / page-text / file-probe)이 이 위에서 갈라진다.
 * 새 소스는 계열 베이스 중 하나를 상속해 소스 고유 로직만 채운다 (PLAN.md §0).
 */
import type { AdapterFamily, CollectContext, CollectResult, SourceAdapter } from "../types.js";

export abstract class BaseAdapter implements SourceAdapter {
  abstract readonly id: string;
  abstract readonly family: AdapterFamily;
  abstract collect(ctx: CollectContext): Promise<CollectResult>;
}
