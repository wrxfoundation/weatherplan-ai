/**
 * #11 기관 전망 채점 (forecast-graders) — 페이지 텍스트형 어댑터.
 *
 * 기관(한은·KB·건산연·주산연)의 전망 발표 페이지를 정기 박제한다. 새 전망이
 * 발표되면 목록 페이지 텍스트가 바뀌고, 그 diff가 발표 시점의 공증 기록이 된다.
 * 기관은 전망을 조용히 고치거나 내리지만, 원장은 "언제 무엇이 있었나"를 기억한다.
 *
 * 엔티티: page:<target-id> — 대상 페이지당 1레코드 {text, text_sha256}.
 * 조회수 카운터 등 페이지 자체 노이즈는 extract 단계에서 정규화한다
 * (원본 HTML은 스냅샷에 무가공 보존되므로 정보 손실이 아니다).
 */
import { PageTextAdapter, type PageTarget } from "../../engine/adapters/page-text.js";
import type { CollectContext } from "../../engine/types.js";

interface TargetConfig {
  id: string;
  url: string;
}

export class ForecastGradersAdapter extends PageTextAdapter {
  readonly id = "forecast-graders";

  protected targets(ctx: CollectContext): PageTarget[] {
    const targets = ctx.config.targets as TargetConfig[] | undefined;
    if (!Array.isArray(targets) || targets.length === 0) {
      throw new Error("config.yml에 targets가 없습니다 — 박제할 기관 페이지를 지정하세요.");
    }
    return targets.map((target) => ({ entityId: `page:${target.id}`, url: target.url }));
  }

  protected requestInit(ctx: CollectContext): RequestInit | undefined {
    const userAgent = ctx.config.user_agent;
    if (typeof userAgent !== "string" || !userAgent) return undefined;
    return { headers: { "User-Agent": userAgent, "Accept-Language": "ko, en;q=0.5" } };
  }

  protected extract(html: string): string {
    return super
      .extract(html)
      // 조회수·히트 카운터는 발표와 무관하게 변해 diff 노이즈가 된다
      .replace(/조회\s*수?\s*:?\s*[\d,]+/g, " ")
      .replace(/\b(hits?|views?)\s*:?\s*[\d,]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * tracked 필드를 "날짜 앵커 헤드라인 목록"으로 삼는다 — 기관 게시판의 실제
   * 신호는 "언제 무슨 전망/보고서가 올라왔나"이고, 조회수·번호 잡음은 배제된다.
   * (전문 텍스트는 tracked에서 뺀다 — 원본 HTML은 스냅샷에 무가공 보존됨.)
   */
  protected fieldsFor(html: string): Record<string, unknown> {
    return { items: this.datedItems(this.extract(html)) };
  }
}

export default new ForecastGradersAdapter();
