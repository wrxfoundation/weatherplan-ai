/**
 * #4 청약·분양가 박제 (bunyang-capsule) — API 레코드형 어댑터.
 *
 * 청약홈 분양정보를 일간 폴링해 공고 단위 + 주택형(타입) 단위로 박제한다.
 * 공고는 마감 즉시 소멸하는 최속 소멸 데이터 — 오늘 기록하지 않으면 영원히 없다.
 *
 * 엔티티 설계:
 *   apt:<HOUSE_MANAGE_NO>:<PBLANC_NO>              공고 상세 (getAPTLttotPblancDetail 행 그대로)
 *   apt-mdl:<HOUSE_MANAGE_NO>:<PBLANC_NO>:<MODEL_NO> 주택형별 상세 — 분양최고금액(LTTOT_TOP_AMOUNT) 포함
 *
 * 각 레코드에는 윈도 판정용 파생 필드 _chronicle_window_date(모집공고일)를 붙인다.
 * (소문자 접두 _chronicle_ 은 API 원본 필드(대문자)와 충돌하지 않는 예약 네임스페이스.
 *  원본 무가공 보존은 snapshots/ 가 담당하고, fields는 정규화 계층이다.)
 */
import { ApiRecordsAdapter } from "../../engine/adapters/api-records.js";
import type { CollectContext, NormalizedRecord } from "../../engine/types.js";

/** odcloud 표준 응답 봉투. */
interface OdcloudPage {
  currentCount: number;
  data: Record<string, unknown>[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

interface BunyangRaw {
  window_start: string;
  apt_detail: Record<string, unknown>[];
  apt_model: Record<string, unknown>[];
}

const WINDOW_DATE_FIELD = "_chronicle_window_date";
const MAX_PAGES = 500;

function endpointOf(ctx: CollectContext, name: string): string {
  const endpoints = ctx.config.endpoints as Record<string, string> | undefined;
  const url = endpoints?.[name];
  if (!url) throw new Error(`config.yml에 endpoints.${name} 가 없습니다.`);
  return url;
}

export class BunyangCapsuleAdapter extends ApiRecordsAdapter {
  readonly id = "bunyang-capsule";

  private windowStart(ctx: CollectContext): string {
    const days = Number(ctx.config.window_days ?? 180);
    return new Date(ctx.now().getTime() - days * 86_400_000).toISOString().slice(0, 10);
  }

  private authInit(): RequestInit {
    const key = process.env.DATA_GO_KR_KEY;
    if (!key) {
      throw new Error(
        "DATA_GO_KR_KEY 환경변수가 없습니다 — data.go.kr 디코딩 인증키를 설정하세요 (README '실행' 절 참고).",
      );
    }
    return { headers: { Authorization: `Infuser ${key}`, Accept: "application/json" } };
  }

  private async fetchAllPages(
    ctx: CollectContext,
    endpoint: string,
    cond: Record<string, string>,
  ): Promise<Record<string, unknown>[]> {
    const perPage = Number(ctx.config.page_size ?? 100);
    const rows: Record<string, unknown>[] = [];
    for (let page = 1; ; page++) {
      if (page > MAX_PAGES) throw new Error(`페이지네이션 폭주(>${MAX_PAGES}p): ${endpoint}`);
      const url = new URL(endpoint);
      url.searchParams.set("page", String(page));
      url.searchParams.set("perPage", String(perPage));
      for (const [key, value] of Object.entries(cond)) url.searchParams.set(key, value);
      const body = (await ctx.http.json(url.toString(), this.authInit())) as Partial<OdcloudPage>;
      if (!body || !Array.isArray(body.data)) {
        throw new Error(`odcloud 응답 형식이 아닙니다: ${endpoint} — ${JSON.stringify(body).slice(0, 300)}`);
      }
      rows.push(...body.data);
      // 종료 판정은 matchCount(cond 필터 적용 후 건수) 기준 — totalCount는 필터
      // 무관한 전체 데이터셋 크기라 쓰면 안 된다. matchCount가 없으면 짧은
      // 페이지(행 수 < perPage)로 판정한다.
      const match = Number(body.matchCount);
      const done =
        body.data.length === 0 ||
        body.data.length < perPage ||
        (Number.isFinite(match) && rows.length >= match);
      if (done) {
        if (Number.isFinite(match) && rows.length < match) {
          throw new Error(`수집 불완전: ${endpoint} — matchCount ${match}건 중 ${rows.length}건만 수신. 재실행 필요.`);
        }
        return rows;
      }
    }
  }

  protected async fetchRaw(ctx: CollectContext): Promise<unknown> {
    const since = this.windowStart(ctx);
    ctx.log(`[${this.id}] APT 분양공고 수집 — 모집공고일 >= ${since}`);
    const details = await this.fetchAllPages(ctx, endpointOf(ctx, "apt_detail"), {
      "cond[RCRIT_PBLANC_DE::GTE]": since,
    });

    const houseNos = [...new Set(details.map((row) => String(row.HOUSE_MANAGE_NO)))].sort();
    ctx.log(`[${this.id}] 공고 ${details.length}건 · 단지 ${houseNos.length}곳 — 주택형별 분양가 수집`);
    const models: Record<string, unknown>[] = [];
    for (const houseNo of houseNos) {
      models.push(
        ...(await this.fetchAllPages(ctx, endpointOf(ctx, "apt_model"), {
          "cond[HOUSE_MANAGE_NO::EQ]": houseNo,
        })),
      );
    }
    ctx.log(`[${this.id}] 주택형 ${models.length}건 수집 완료`);

    const raw: BunyangRaw = { window_start: since, apt_detail: details, apt_model: models };
    return raw;
  }

  protected normalize(raw: unknown, ctx: CollectContext): NormalizedRecord[] {
    const { apt_detail, apt_model } = raw as BunyangRaw;
    const detailUrl = endpointOf(ctx, "apt_detail");
    const modelUrl = endpointOf(ctx, "apt_model");
    const records: NormalizedRecord[] = [];

    const noticeDateByHouse = new Map<string, string>();
    const pblancUrlByHouse = new Map<string, string>();
    for (const row of apt_detail) {
      const houseNo = String(row.HOUSE_MANAGE_NO);
      const pblancNo = String(row.PBLANC_NO);
      const noticeDate = String(row.RCRIT_PBLANC_DE ?? "");
      noticeDateByHouse.set(houseNo, noticeDate);
      if (typeof row.PBLANC_URL === "string" && row.PBLANC_URL) pblancUrlByHouse.set(houseNo, row.PBLANC_URL);
      records.push({
        entityId: `apt:${houseNo}:${pblancNo}`,
        sourceUrl: pblancUrlByHouse.get(houseNo) ?? detailUrl,
        fields: { ...row, [WINDOW_DATE_FIELD]: noticeDate },
      });
    }

    for (const row of apt_model) {
      const houseNo = String(row.HOUSE_MANAGE_NO);
      const pblancNo = String(row.PBLANC_NO);
      const modelNo = String(row.MODEL_NO);
      records.push({
        entityId: `apt-mdl:${houseNo}:${pblancNo}:${modelNo}`,
        // 사람이 확인할 수 있는 공고 URL 우선, 없으면 실제 출처 엔드포인트(apt_model)
        sourceUrl: pblancUrlByHouse.get(houseNo) ?? modelUrl,
        fields: { ...row, [WINDOW_DATE_FIELD]: noticeDateByHouse.get(houseNo) ?? null },
      });
    }

    return records;
  }

  /** 모집공고일이 윈도 안인 레코드만 삭제 감지 대상 — 윈도 밖은 박제 상태 유지. */
  protected removalScope(ctx: CollectContext): (stored: NormalizedRecord) => boolean {
    const since = this.windowStart(ctx);
    return (stored) => {
      const date = stored.fields[WINDOW_DATE_FIELD];
      return typeof date === "string" && date >= since;
    };
  }
}

export default new BunyangCapsuleAdapter();
