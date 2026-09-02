/**
 * #12 공공데이터포털 감시탑 (datago-watch) — 페이지 텍스트형 어댑터.
 *
 * 우리 소스가 의존하는 데이터셋의 포털 페이지를 박제한다. 서비스 중단·변경·
 * 폐기 공지, 스펙 개정, 담당부서 변경이 전부 텍스트 diff 이벤트로 잡힌다 —
 * 크론이 조용히 죽기 전에 원인을 먼저 아는 보험.
 */
import { PageTextAdapter, type PageTarget } from "../../engine/adapters/page-text.js";
import type { CollectContext } from "../../engine/types.js";

interface TargetConfig {
  id: string;
  url: string;
}

export class DatagoWatchAdapter extends PageTextAdapter {
  readonly id = "datago-watch";

  protected targets(ctx: CollectContext): PageTarget[] {
    const targets = ctx.config.targets as TargetConfig[] | undefined;
    if (!Array.isArray(targets) || targets.length === 0) {
      throw new Error("config.yml에 targets가 없습니다 — 감시할 데이터셋 페이지를 지정하세요.");
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
      // 포털 페이지의 카운터류(조회수·다운로드·키워드 검색량)는 매일 변해 diff 노이즈가 된다
      .replace(/조회\s*수?\s*:?\s*[\d,]+/g, " ")
      .replace(/다운로드\s*:?\s*[\d,]+/g, " ")
      .replace(/활용신청\s*:?\s*[\d,]+/g, " ")
      .replace(/\b(hits?|views?)\s*:?\s*[\d,]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}

export default new DatagoWatchAdapter();
