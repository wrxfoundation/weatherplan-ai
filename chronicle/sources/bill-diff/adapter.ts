/**
 * #9 국회 입법 diff (bill-diff) — API 레코드형 어댑터. 한국.
 *
 * 열린국회정보 발의법률안 API로 AI·데이터·플랫폼 규제 의안을 주간 박제한다. 발의(생성)와
 * 처리상태 전환(계류→가결/부결/폐기·철회)을 소유 — 규제 인텔(FiscalNote 모델). 엔티티:
 * bill:<의안ID>. 의안은 소멸하지 않고 상태로 종결되므로 삭제 판정은 하지 않는다.
 *
 * ── 방어 설계 ──────────────────────────────────────────────────────────────
 *   키(ASSEMBLY_API_KEY) 없으면 휴면. 열린국회정보 표준 봉투({서비스명:[{head},{row}]})를
 *   방어 파싱, head RESULT 코드로 오류 자가진단(ERROR-*=중단, INFO-200=데이터없음=정상).
 *   의안명 키워드 후필터로 규제 영역 한정. 원본 응답은 스냅샷 보존.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { BaseAdapter } from "../../engine/adapters/base.js";
import type { CollectContext, CollectResult, NormalizedRecord } from "../../engine/types.js";

type Json = Record<string, unknown>;

function str(v: unknown): string | null {
  if (typeof v === "string") return v.trim() === "" ? null : v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

function pick(obj: Json, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = str(obj[k]);
    if (v !== null) return v;
  }
  return null;
}

/** 열린국회정보 표준 봉투에서 row 배열 + RESULT 코드/메시지를 뽑는다. */
function parseEnvelope(body: unknown): { rows: Json[]; code: string | null; msg: string | null } {
  const b = body as Json;
  if (!b || typeof b !== "object") return { rows: [], code: null, msg: null };
  // 최상위 RESULT = 데이터없음/오류 봉투
  if (b.RESULT && typeof b.RESULT === "object") {
    const r = b.RESULT as Json;
    return { rows: [], code: str(r.CODE), msg: str(r.MESSAGE) };
  }
  // 서비스명 키의 배열 = [{head:[{list_total_count},{RESULT}]}, {row:[...]}]
  for (const v of Object.values(b)) {
    if (!Array.isArray(v)) continue;
    let rows: Json[] = [];
    let code: string | null = null;
    let msg: string | null = null;
    for (const part of v) {
      if (!part || typeof part !== "object") continue;
      const p = part as Json;
      if (Array.isArray(p.row)) rows = p.row as Json[];
      if (Array.isArray(p.head)) {
        for (const h of p.head as Json[]) {
          const res = (h as Json)?.RESULT as Json | undefined;
          if (res) {
            code = str(res.CODE);
            msg = str(res.MESSAGE);
          }
        }
      }
    }
    if (rows.length > 0 || code !== null) return { rows, code, msg };
  }
  return { rows: [], code: null, msg: null };
}

/** RESULT 코드가 오류인가 (INFO-*=정상/데이터없음, 그 외=오류). */
function isErrorCode(code: string | null): boolean {
  return code !== null && !/^INFO/i.test(code);
}

export class BillDiffAdapter extends BaseAdapter {
  readonly id = "bill-diff";
  readonly family = "api-records" as const;

  private keywords(ctx: CollectContext): string[] {
    const kw = ctx.config.keywords as string[] | undefined;
    return Array.isArray(kw) ? kw.filter((k) => typeof k === "string" && k.trim() !== "") : [];
  }

  async collect(ctx: CollectContext): Promise<CollectResult> {
    const cfg = ctx.config;
    const endpoint = String(cfg.endpoint ?? "");
    if (!endpoint) throw new Error("config.yml에 endpoint가 없습니다.");
    const keyEnv = String(cfg.key_env ?? "ASSEMBLY_API_KEY");
    const keyParam = String(cfg.key_param ?? "KEY");
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
    const apiKey = env[keyEnv];

    if (!apiKey) {
      ctx.log(`[${this.id}] 휴면 — 키(${keyEnv}) 미설정. 열린국회정보 인증키 신청 시 라이브.`);
      return { raw: { dormant: true }, records: [], removalScope: () => false };
    }

    const query = (cfg.query as Record<string, unknown> | undefined) ?? {};
    const pageSize = Number(cfg.page_size ?? 100) || 100;
    const maxPages = Number(cfg.max_pages ?? 40) || 40;
    const keywords = this.keywords(ctx);
    const userAgent = typeof cfg.user_agent === "string" ? cfg.user_agent : undefined;
    const init: RequestInit | undefined = userAgent ? { headers: { "User-Agent": userAgent } } : undefined;

    const records: NormalizedRecord[] = [];
    const seen = new Set<string>();
    let scanned = 0;

    for (let page = 1; page <= maxPages; page++) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) params.set(k, String(v));
      params.set("pIndex", String(page));
      params.set("pSize", String(pageSize));
      const url = `${endpoint}?${keyParam}=${apiKey}&${params.toString()}`;

      let body: unknown;
      try {
        body = await ctx.http.json(url, init);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (page === 1) throw new Error(`[${this.id}] 1페이지 요청 실패 — 지오블록/인증 의심(자가진단): ${msg}`);
        ctx.log(`[${this.id}] ${page}페이지 실패 — 순회 중단: ${msg}`);
        break;
      }

      const { rows, code, msg } = parseEnvelope(body);
      if (isErrorCode(code)) {
        if (page === 1) throw new Error(`[${this.id}] API 오류(${code}) ${msg ?? ""} — 인증키/서비스명 확인.`);
        break;
      }
      if (rows.length === 0) break; // 데이터 끝(INFO-200 포함)

      for (const row of rows) {
        scanned++;
        const id = pick(row, "BILL_ID", "billId");
        const name = pick(row, "BILL_NAME", "billName") ?? "";
        if (!id || seen.has(id)) continue;
        if (keywords.length > 0 && !keywords.some((kw) => name.includes(kw))) continue; // 규제 키워드 후필터
        seen.add(id);
        records.push({
          entityId: `bill:${id}`,
          sourceUrl: pick(row, "DETAIL_LINK", "LINK_URL") ?? endpoint,
          fields: {
            bill_no: pick(row, "BILL_NO", "billNo"),
            name,
            proposer: pick(row, "RST_PROPOSER", "PROPOSER", "proposer"),
            committee: pick(row, "COMMITTEE", "CURR_COMMITTEE"),
            propose_date: pick(row, "PROPOSE_DT", "proposeDt"),
            result: pick(row, "PROC_RESULT", "procResult"), // ← 처리상태(핵심 신호)
            age: pick(row, "AGE", "age"),
          },
        });
      }
      if (rows.length < pageSize) break; // 마지막 페이지
    }

    ctx.log(`[${this.id}] 규제 의안 ${records.length}건 (스캔 ${scanned}건, 키워드 ${keywords.length}개)`);

    return {
      raw: { count: records.length, scanned, keywords },
      records,
      // 의안은 소멸하지 않고 상태로 종결(철회=상태 전환) — 삭제 판정을 하지 않는다.
      // 키워드 후필터+페이지 상한이라 "목록에서 빠짐"이 실삭제가 아닐 수 있으므로도 안전.
      removalScope: () => false,
    };
  }
}

export default new BillDiffAdapter();
