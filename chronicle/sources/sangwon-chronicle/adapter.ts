/**
 * #7 상권 생멸 (sangwon-chronicle) — API 레코드형 어댑터. 한국.
 *
 * 소상공인시장진흥공단 상가(상권)정보 API로 주요 상권(랜드마크 반경) 내 상가를 박제.
 * 상가는 폐업 즉시 목록에서 소멸 — 지금 찍은 자만 상권의 생멸을 소유한다. 엔티티:
 * store:<상가업소번호>. #4·#5(부동산)와 한국 로컬 클러스터.
 *
 * ── 방어 설계 ──────────────────────────────────────────────────────────────
 *   키 없으면 휴면. 응답 JSON 봉투를 방어적으로 파싱(body.items 등 후보 탐색),
 *   필드명은 후보군에서 첫 존재값. 1타겟부터 실패면 중단(지오블록·인증 자가진단),
 *   일부 타겟만 실패하면 이번 회차 삭제판정 보류(부분수집 오탐 방지). 원본은 스냅샷 보존.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { BaseAdapter } from "../../engine/adapters/base.js";
import type { CollectContext, CollectResult, NormalizedRecord } from "../../engine/types.js";

type Json = Record<string, unknown>;

interface Target {
  id: string;
  cx: number;
  cy: number;
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v.trim() === "" ? null : v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

/** 여러 후보 키 중 첫 존재값. */
function pick(obj: Json, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = str(obj[k]);
    if (v !== null) return v;
  }
  return null;
}

/** JSON 봉투에서 상가 레코드를 방어적으로 찾는다 — 배열이든 단일 객체든 bizesId 보유 객체 전부. */
function findItems(body: unknown): Json[] {
  const hasBizId = (o: unknown): o is Json =>
    !!o && typeof o === "object" && !Array.isArray(o) && Object.keys(o as Json).some((k) => /^bizes_?id$/i.test(k));
  const found: Json[] = [];
  const walk = (node: unknown): void => {
    if (hasBizId(node)) {
      found.push(node); // 단일 결과(객체)·배열 원소 모두 수용 (data.go.kr은 1건이면 객체로 준다)
      return; // 매치 객체 내부는 더 내려가지 않는다
    }
    if (Array.isArray(node)) for (const el of node) walk(el);
    else if (node && typeof node === "object") for (const v of Object.values(node as Json)) walk(v);
  };
  walk(body);
  return found;
}

/** 결과코드 분류: 정상(전부 0)·데이터없음(03)은 오류 아님, 그 외 코드만 오류(자가진단). */
function errorMessage(body: unknown): string | null {
  const b = body as Json;
  const header = (b?.header as Json) ?? ((b?.response as Json)?.header as Json) ?? {};
  const code = str(header.resultCode) ?? str((b?.result as Json)?.code);
  const msg = str(header.resultMsg) ?? str((b?.result as Json)?.message);
  if (!code) return null; // 코드 없으면 findItems 결과에 맡긴다
  if (/^0+$/.test(code) || code === "03") return null; // 00/0000=정상, 03=데이터없음(NODATA)
  return `${code} ${msg ?? ""}`.trim();
}

export class SangwonChronicleAdapter extends BaseAdapter {
  readonly id = "sangwon-chronicle";
  readonly family = "api-records" as const;

  private targets(ctx: CollectContext): Target[] {
    const targets = ctx.config.targets as Target[] | undefined;
    if (!Array.isArray(targets) || targets.length === 0) throw new Error("config.yml에 targets가 없습니다.");
    return targets;
  }

  async collect(ctx: CollectContext): Promise<CollectResult> {
    const cfg = ctx.config;
    const endpoint = String(cfg.endpoint ?? "");
    if (!endpoint) throw new Error("config.yml에 endpoint가 없습니다.");
    const keyEnv = String(cfg.key_env ?? "DATA_GO_KR_KEY");
    const keyParam = String(cfg.key_param ?? "serviceKey");
    const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
    const apiKey = env[keyEnv];

    if (!apiKey) {
      ctx.log(`[${this.id}] 휴면 — 키(${keyEnv}) 미설정.`);
      return { raw: { dormant: true, reason: "no_key" }, records: [], removalScope: () => false };
    }
    // 공유 DATA_GO_KR_KEY는 존재해도 이 API엔 별도 "활용신청"이 필요하다(그전엔 인증 오류).
    // 활용신청 완료 전에는 휴면(초록·0건) — 매일 크론이 빨간불을 뿌리지 않게. 신청 후 config에서 activated:true.
    if (cfg.activated !== true) {
      ctx.log(`[${this.id}] 휴면 — 활용신청 미완(activated≠true). data.go.kr에서 상가(상권)정보 API 활용신청 후 config에서 activated: true 로.`);
      return { raw: { dormant: true, reason: "not_activated" }, records: [], removalScope: () => false };
    }

    const query = (cfg.query as Record<string, unknown> | undefined) ?? {};
    const pageSize = Number(cfg.page_size ?? 100) || 100;
    const maxPages = Number(cfg.max_pages ?? 30) || 30;
    const userAgent = typeof cfg.user_agent === "string" ? cfg.user_agent : undefined;
    const init: RequestInit | undefined = userAgent ? { headers: { "User-Agent": userAgent } } : undefined;

    const records: NormalizedRecord[] = [];
    const seen = new Set<string>();
    const rawSummary: Record<string, unknown> = {};
    let complete = true;
    let anySuccess = false;
    let firstError: string | null = null;

    for (const target of this.targets(ctx)) {
      let targetCount = 0;
      let reachedEnd = false;
      try {
        for (let page = 1; page <= maxPages; page++) {
          const params = new URLSearchParams();
          for (const [k, v] of Object.entries(query)) params.set(k, String(v));
          params.set("pageNo", String(page));
          params.set("numOfRows", String(pageSize));
          params.set("cx", String(target.cx));
          params.set("cy", String(target.cy));
          const url = `${endpoint}?${keyParam}=${apiKey}&${params.toString()}`;
          const body = await ctx.http.json(url, init);

          const err = errorMessage(body);
          if (err) throw new Error(`API 오류: ${err}`);
          const items = findItems(body);
          if (items.length === 0) {
            reachedEnd = true; // 빈 페이지 = 데이터 끝(완전 수집)
            break;
          }

          for (const it of items) {
            const id = pick(it, "bizesId", "bizesid");
            if (!id || seen.has(id)) continue;
            seen.add(id);
            targetCount++;
            records.push({
              entityId: `store:${id}`,
              sourceUrl: endpoint,
              fields: {
                name: pick(it, "bizesNm", "bizesnm"),
                branch: pick(it, "brchNm", "bizesSubNm"),
                category_large: pick(it, "indsLclsNm", "indslclsnm"),
                category_medium: pick(it, "indsMclsNm", "indsmclsnm"),
                category_small: pick(it, "indsSclsNm", "indssclsnm"),
                industry_code: pick(it, "indsSclsCd", "ksicCd", "indssclscd"),
                region: pick(it, "adongNm", "signguNm", "ctprvnNm"),
                address: pick(it, "rdnmAdr", "lnoAdr", "rdnmadr"),
                lon: pick(it, "lon", "x"),
                lat: pick(it, "lat", "y"),
                district: target.id,
              },
            });
          }
          // 주의: "items.length < pageSize"를 종료 신호로 쓰지 않는다 — 서버가 요청 크기보다
          // 적게 주면(캡) 조기 종료+거짓 폐업이 된다. 빈 페이지 또는 max_pages로만 종료한다.
        }
        anySuccess = true;
        // max_pages를 다 쓰도록 빈 페이지를 못 만났다 = 부분 수집(더 있는데 잘림) → 삭제판정 보류.
        if (!reachedEnd) {
          complete = false;
          ctx.log(`[${this.id}] ${target.id}: max_pages(${maxPages}) 소진 — 부분수집, 삭제판정 보류.`);
        }
        rawSummary[target.id] = { count: targetCount, complete: reachedEnd };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        firstError ??= msg;
        complete = false;
        rawSummary[target.id] = { failed: true }; // 에러 문자열을 raw(공개 스냅샷)에 담지 않는다
        ctx.log(`[${this.id}] 상권 실패 — 건너뜀: ${target.id} (${msg})`);
      }
    }

    // 전 타겟 실패 = 소스/네트워크/인증 장애 (자가진단으로 첫 오류 노출)
    if (!anySuccess) throw new Error(`[${this.id}] 전 상권 실패 — 지오블록/인증 의심: ${firstError ?? "?"}`);
    ctx.log(`[${this.id}] 상가 ${records.length}건 / 상권 ${this.targets(ctx).length}곳${complete ? "" : " (부분수집)"}`);

    return {
      raw: { targets: rawSummary, count: records.length, complete },
      records,
      // 일부 상권 페치 실패 시 이번 회차 삭제 판정을 전면 보류(폐업 오탐 방지).
      removalScope: complete ? undefined : () => false,
    };
  }
}

export default new SangwonChronicleAdapter();
