/**
 * #5 실거래 취소·정정 원장 (deal-audit-ledger) — API 레코드형 어댑터.
 *
 * 국토부 실거래 API는 XML을 반환하고, 취소·정정의 표시 방식이 특수하다:
 *   취소: 행이 남고 cdealType='O'·cdealDay가 붙는다 → 필드 변경 이벤트
 *   정정: 금액이 바뀐 행으로 대체된다 → (금액이 엔티티 식별자의 일부이므로)
 *         원 레코드 삭제 + 새 레코드 생성 쌍으로 전후가 원장에 남는다
 * 아실 등은 현재 표시만 남긴다 — 감사 가능한 append-only 전후 이력이 우리 몫이다.
 *
 * 엔티티: deal:<시군구>:<계약일>:<법정동>:<지번>:<단지>:<전용>:<층>:<금액>
 * 각 레코드에는 윈도 판정용 _chronicle_window_date(계약일)를 붙인다.
 */
import { ApiRecordsAdapter } from "../../engine/adapters/api-records.js";
import type { CollectContext, NormalizedRecord } from "../../engine/types.js";

const WINDOW_DATE_FIELD = "_chronicle_window_date";

interface MonthResponse {
  lawd: string;
  dealYmd: string;
  totalCount: number;
  rows: Record<string, string>[];
}

/** 국토부 계열 평면 XML에서 <item> 행들을 뽑는다 (중첩 없음 전제). */
export function parseXmlItems(xml: string): { resultCode: string; resultMsg: string; totalCount: number; rows: Record<string, string>[] } {
  const pick = (tag: string): string => {
    const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return match ? match[1].trim() : "";
  };
  const rows: Record<string, string>[] = [];
  for (const itemMatch of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const row: Record<string, string> = {};
    for (const fieldMatch of itemMatch[1].matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) {
      row[fieldMatch[1]] = fieldMatch[2].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").trim();
    }
    rows.push(row);
  }
  return { resultCode: pick("resultCode"), resultMsg: pick("resultMsg"), totalCount: Number(pick("totalCount") || 0), rows };
}

/** 엔티티 식별자 조각 정규화 — 구분자 충돌 방지 + 공백/쉼표 제거. */
function idPart(value: string | undefined): string {
  return (value ?? "").replaceAll(":", "·").replace(/[\s,]/g, "");
}

export class DealAuditLedgerAdapter extends ApiRecordsAdapter {
  readonly id = "deal-audit-ledger";

  /** 폴링 대상 계약월 목록 (KST 기준 최근 window_months개, 최신부터). */
  private months(ctx: CollectContext): string[] {
    const count = Number(ctx.config.window_months ?? 6);
    const kst = new Date(ctx.now().getTime() + 9 * 3600_000);
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth() - i, 1));
      result.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
    }
    return result;
  }

  private windowStart(ctx: CollectContext): string {
    const oldest = this.months(ctx).at(-1)!;
    return `${oldest.slice(0, 4)}-${oldest.slice(4, 6)}-01`;
  }

  private serviceKey(): string {
    const key = process.env.DATA_GO_KR_KEY;
    if (!key) throw new Error("DATA_GO_KR_KEY 환경변수가 없습니다 — data.go.kr 일반 인증키를 설정하세요.");
    return key;
  }

  private async fetchMonth(ctx: CollectContext, lawd: string, dealYmd: string): Promise<MonthResponse> {
    const endpoint = String(ctx.config.endpoint ?? "");
    if (!endpoint) throw new Error("config.yml에 endpoint가 없습니다.");
    const numOfRows = Number(ctx.config.num_of_rows ?? 1000);
    const rows: Record<string, string>[] = [];
    let totalCount = 0;
    for (let pageNo = 1; ; pageNo++) {
      if (pageNo > 100) throw new Error(`페이지네이션 폭주(>100p): ${lawd}/${dealYmd}`);
      const url = new URL(endpoint);
      url.searchParams.set("serviceKey", this.serviceKey());
      url.searchParams.set("LAWD_CD", lawd);
      url.searchParams.set("DEAL_YMD", dealYmd);
      url.searchParams.set("pageNo", String(pageNo));
      url.searchParams.set("numOfRows", String(numOfRows));
      const xml = await ctx.http.text(url.toString());
      const parsed = parseXmlItems(xml);
      // 공공데이터포털 공통 오류(SERVICE ERROR 등)는 resultCode가 00이 아니다
      if (parsed.resultCode && parsed.resultCode !== "00" && parsed.resultCode !== "000") {
        throw new Error(`RTMS 오류 ${parsed.resultCode} (${parsed.resultMsg || "사유 미상"}) — ${lawd}/${dealYmd}`);
      }
      rows.push(...parsed.rows);
      totalCount = parsed.totalCount;
      if (parsed.rows.length === 0 || rows.length >= totalCount) break;
    }
    if (rows.length < totalCount) {
      throw new Error(`수집 불완전: ${lawd}/${dealYmd} — totalCount ${totalCount}건 중 ${rows.length}건만 수신.`);
    }
    return { lawd, dealYmd, totalCount, rows };
  }

  protected async fetchRaw(ctx: CollectContext): Promise<unknown> {
    const lawdCodes = ctx.config.lawd_codes as string[] | undefined;
    if (!Array.isArray(lawdCodes) || lawdCodes.length === 0) {
      throw new Error("config.yml에 lawd_codes가 없습니다 — 폴링할 시군구 코드를 지정하세요.");
    }
    const months = this.months(ctx);
    ctx.log(`[${this.id}] 실거래 폴링: ${lawdCodes.length}개 구 × ${months.length}개월 (${months.at(-1)}~${months[0]})`);
    const responses: MonthResponse[] = [];
    for (const lawd of lawdCodes) {
      for (const dealYmd of months) {
        responses.push(await this.fetchMonth(ctx, lawd, dealYmd));
      }
    }
    const totalRows = responses.reduce((sum, r) => sum + r.rows.length, 0);
    ctx.log(`[${this.id}] ${totalRows}건 수신 완료`);
    return { window_start: this.windowStart(ctx), months, responses };
  }

  protected normalize(raw: unknown, ctx: CollectContext): NormalizedRecord[] {
    const { responses } = raw as { responses: MonthResponse[] };
    const endpoint = String(ctx.config.endpoint ?? "");
    const seen = new Set<string>();
    const records: NormalizedRecord[] = [];
    let duplicates = 0;

    for (const response of responses) {
      for (const row of response.rows) {
        const date = `${row.dealYear}-${String(row.dealMonth).padStart(2, "0")}-${String(row.dealDay).padStart(2, "0")}`;
        const entityId = [
          "deal",
          response.lawd,
          date.replaceAll("-", ""),
          idPart(row.umdNm),
          idPart(row.jibun),
          idPart(row.aptNm),
          idPart(row.excluUseAr),
          idPart(row.floor),
          idPart(row.dealAmount),
        ].join(":");
        // 모든 필드가 동일한 완전 중복 행(동일 단지·층·면적·일자·금액 복수 신고)은 1건으로 접는다
        if (seen.has(entityId)) {
          duplicates += 1;
          continue;
        }
        seen.add(entityId);
        records.push({
          entityId,
          sourceUrl: endpoint,
          fields: { ...row, LAWD_CD: response.lawd, [WINDOW_DATE_FIELD]: date },
        });
      }
    }
    if (duplicates > 0) ctx.log(`[${this.id}] 완전 중복 행 ${duplicates}건 접음`);
    return records;
  }

  /** 폴링 윈도(계약월) 안의 레코드만 삭제 감지 — 윈도 밖은 박제 유지. */
  protected removalScope(ctx: CollectContext): (stored: NormalizedRecord) => boolean {
    const since = this.windowStart(ctx);
    return (stored) => {
      const date = stored.fields[WINDOW_DATE_FIELD];
      return typeof date === "string" && date >= since;
    };
  }
}

export default new DealAuditLedgerAdapter();
