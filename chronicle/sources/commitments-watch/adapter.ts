/**
 * #17 기업 약속 diff (commitments-watch) — 페이지 텍스트형 어댑터.
 *
 * AI 기업의 공개 "약속" 문서(사용정책·AI 원칙·안전 프레임워크)를 주간 박제한다.
 * 기업이 조용히 문구를 고치면(OpenAI '군사' 조항 삭제류) 그 diff를, 문서가 내려가면
 * 그 소멸을 소유한다. 전문 텍스트+해시를 tracked로 삼고 원본 HTML은 스냅샷에 보존.
 *
 * URL은 최선 추정 — 개별 실패는 그 페이지만 건너뛴다(page-text 베이스가 removalScope
 * 에서 제외). 첫 실행 로그가 살아있는 URL을 자백한다(config 핫에디트로 교정).
 */
import { PageTextAdapter, type PageTarget } from "../../engine/adapters/page-text.js";
import type { CollectContext } from "../../engine/types.js";

export class CommitmentsWatchAdapter extends PageTextAdapter {
  readonly id = "commitments-watch";

  protected targets(ctx: CollectContext): PageTarget[] {
    const raw = ctx.config.targets as Array<{ id?: string; url?: string }> | undefined;
    if (!Array.isArray(raw) || raw.length === 0) throw new Error("config.yml에 targets가 없습니다.");
    const seenIds = new Set<string>();
    return raw.map((t) => {
      if (!t.id || !t.url) throw new Error(`targets 항목에 id/url이 없습니다: ${JSON.stringify(t)}`);
      if (seenIds.has(t.id)) throw new Error(`중복 target id: ${t.id} — entityId 충돌로 한 항목의 추적이 소실됩니다.`);
      seenIds.add(t.id);
      return { entityId: t.id, url: t.url }; // config의 id → PageTarget.entityId
    });
  }

  /** 봇차단 완화용 실브라우저 UA — 공개 문서 열람. */
  protected requestInit(ctx: CollectContext): RequestInit | undefined {
    const ua = ctx.config.user_agent;
    return typeof ua === "string" && ua
      ? { headers: { "User-Agent": ua, Accept: "text/html,application/xhtml+xml", "Accept-Language": "en,ko;q=0.8" } }
      : undefined;
  }
}

export default new CommitmentsWatchAdapter();
