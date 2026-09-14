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
import type { CollectContext, CollectResult, NormalizedRecord } from "../../engine/types.js";

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

  /**
   * page-text 기본 collect를 오버라이드 — probe로 상태코드를 확인해 "문서 철거(404/410)"를
   * 일시 실패와 구분한다. 철거는 소멸 이벤트로 확정(headline 기능), 403/5xx/네트워크는
   * 삭제 판정에서 제외(오탐 방지). probe 미지원 환경에선 raw로 폴백(그 경우 4xx는 일시로 강등).
   */
  async collect(ctx: CollectContext): Promise<CollectResult> {
    const targets = await this.targets(ctx);
    const init = this.requestInit(ctx);
    const probe = ctx.http.probe ?? ctx.http.raw;
    const records: NormalizedRecord[] = [];
    const rawEntries: Array<[string, unknown]> = [];
    const transient = new Set<string>(); // 일시 실패/차단 → 삭제 보류
    let goneCount = 0; // 404/410 철거 확인 수

    for (const target of targets) {
      try {
        const res = await probe(target.url, init);
        if (res.status === 200) {
          const body = await res.text();
          rawEntries.push([target.entityId, { url: target.url, status: 200, body }]);
          records.push({ entityId: target.entityId, sourceUrl: target.url, fields: this.fieldsFor(body) });
        } else if (res.status === 404 || res.status === 410) {
          // 철거 확인 — 레코드를 만들지 않아 diff가 소멸로 잡고, transient에 없으니 삭제로 확정된다.
          goneCount++;
          rawEntries.push([target.entityId, { url: target.url, status: res.status, gone: true }]);
          ctx.log(`[${this.id}] 문서 철거 확인(HTTP ${res.status}) — 소멸 기록: ${target.entityId} ${target.url}`);
        } else {
          transient.add(target.entityId); // 403/5xx 등 = 일시/차단 → 삭제 보류
          ctx.log(`[${this.id}] 일시 실패(HTTP ${res.status}) — 삭제 보류: ${target.url}`);
        }
      } catch (error) {
        transient.add(target.entityId); // 네트워크 오류 → 삭제 보류
        ctx.log(`[${this.id}] 페치 실패 — 삭제 보류: ${target.url} (${error instanceof Error ? error.message : error})`);
      }
    }

    // 성공도 철거확인도 하나 없이 전부 일시실패 = 소스/네트워크 장애 ("변경 없음"으로 위장 방지).
    if (targets.length > 0 && records.length === 0 && goneCount === 0) {
      throw new Error(`[${this.id}] 대상 ${targets.length}곳 전부 페치 실패 — 소스/네트워크 장애 의심.`);
    }

    return {
      raw: Object.fromEntries(rawEntries),
      records,
      // 일시 실패한 대상만 삭제 판정에서 제외. 404/410 철거는 삭제로 확정(제외하지 않음).
      removalScope: (stored) => !transient.has(stored.entityId),
    };
  }
}

export default new CommitmentsWatchAdapter();
