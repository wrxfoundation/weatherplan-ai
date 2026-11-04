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

  /** 요청 옵션(UA 헤더 등) — 봇 차단이 있는 기관 사이트용. 필요 시 재정의. */
  protected requestInit(ctx: CollectContext): RequestInit | undefined {
    void ctx;
    return undefined;
  }

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

  /**
   * 소스가 tracked로 삼을 필드. 기본은 전문 텍스트 + 해시.
   * 게시판/목록형 소스는 오버라이드해 구조화 항목(datedItems 등)을 tracked로 삼는다.
   */
  protected fieldsFor(html: string): Record<string, unknown> {
    const text = this.extract(html);
    return { text, text_sha256: sha256Hex(text) };
  }

  /**
   * 게시판/목록 페이지에서 "날짜 앵커 헤드라인"을 뽑는 계열 공용 헬퍼.
   * 조회수·번호 등 숫자 토큰을 제거하므로 새 게시가 없으면 결과가 변하지 않는다 —
   * 새 발표가 올라올 때만 새 항목이 생겨 diff 이벤트가 된다("text 통째 바뀜"의 잡음 대체).
   * 원본 HTML은 스냅샷에 보존되므로 상세는 잃지 않는다.
   */
  protected datedItems(text: string, maxItems = 40): string[] {
    const dateRe = /(\d{4})[-.](\d{1,2})[-.](\d{1,2})/g;
    const items: { date: string; label: string }[] = [];
    const seen = new Set<string>();
    // 라벨 창은 "직전 날짜 이후 ~ 이번 날짜 앞"으로 한정한다 (최대 100자). 게시판
    // 행은 [번호 제목 작성자 날짜]라 이 구간이 이번 행의 제목을 담고, 이웃 행으로
    // 번지지 않아 새 게시가 위에 끼어들어도 기존 항목이 흔들리지 않는다.
    // "홀로 선" 숫자(조회수·번호·이전 날짜 조각) — 한글에 붙은 숫자(2026년·5월·3차)는 제외
    const loneNumber = /(?<![\d가-힣])\d[\d,]*(?![\d가-힣])/g;
    let prevEnd = 0;
    for (let match = dateRe.exec(text); match; match = dateRe.exec(text)) {
      const windowStart = Math.max(prevEnd, match.index - 100);
      let before = text.slice(windowStart, match.index);
      prevEnd = dateRe.lastIndex;
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (month < 1 || month > 12 || day < 1 || day > 31) continue;
      const date = `${match[1]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      // 이 행의 번호(창 안 마지막 홀로 선 숫자) 이후만 = 이 행의 제목.
      // 페이지 헤더·이전 행 잔여가 배제돼, 새 게시가 위에 끼어도 기존 항목이 흔들리지 않는다.
      loneNumber.lastIndex = 0;
      let boundary = 0;
      for (let nm = loneNumber.exec(before); nm; nm = loneNumber.exec(before)) boundary = nm.index + nm[0].length;
      before = before.slice(boundary);
      const label = before
        .replace(loneNumber, " ")
        .replace(/[-.]+/g, " ")
        .replace(/\s+/g, " ")
        // 숫자 제거로 남은 부스러기 괄호·구두점을 양끝에서 정리 ([0709]→] 등)
        .replace(/^[\s\][)(·.,、]+|[\s\][)(·.,、]+$/g, "")
        .trim();
      if (!label) continue;
      const item = `${date} · ${label}`;
      if (!seen.has(item)) {
        seen.add(item);
        items.push({ date, label: item });
      }
    }
    items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.label < b.label ? -1 : 1));
    return items.slice(0, maxItems).map((entry) => entry.label);
  }

  async collect(ctx: CollectContext): Promise<CollectResult> {
    const targets = await this.targets(ctx);
    const records: NormalizedRecord[] = [];
    const rawEntries: Array<[string, { url: string; body: string }]> = [];
    const failed = new Set<string>();

    const init = this.requestInit(ctx);
    for (const target of targets) {
      try {
        const body = await ctx.http.text(target.url, init);
        rawEntries.push([target.entityId, { url: target.url, body }]);
        records.push({
          entityId: target.entityId,
          sourceUrl: target.url,
          fields: this.fieldsFor(body),
        });
      } catch (error) {
        failed.add(target.entityId);
        ctx.log(`[${this.id}] 페치 실패 — 건너뜀: ${target.url} (${error instanceof Error ? error.message : error})`);
      }
    }

    // 개별 실패는 허용하지만 전원 실패는 소스 장애다 — "변경 없음"으로 위장되지 않게 중단.
    if (targets.length > 0 && records.length === 0) {
      throw new Error(`[${this.id}] 대상 ${targets.length}곳 전부 페치 실패 — 소스/네트워크 장애 의심.`);
    }

    return {
      raw: Object.fromEntries(rawEntries),
      records,
      // 페치에 실패한 대상은 이번 회차 삭제 판정에서 제외한다.
      removalScope: (stored) => !failed.has(stored.entityId),
    };
  }
}
