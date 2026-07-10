/**
 * #15 컴퓨트 가격 지수 (compute-price-index) — API 레코드형 어댑터.
 *
 * AWS Spot Advisor 공개 JSON에서 GPU 계열 인스턴스의 스팟 절감률(s)·중단위험
 * 밴드(r)를 관측한다. AWS는 현재값만 주고 이력을 안 남긴다 — 변화가 이벤트로
 * 봉인되는 순간부터 "AI 컴퓨트 수급 압력의 시계열"이 우리 원장에 쌓인다.
 *
 * 엔티티: spot:<region>:<os>:<instanceType> — fields {s, r, r_label}
 * (r_label은 범례(ranges)에서 풀어쓴 중단위험 구간 — 사람이 읽는 형태)
 */
import { ApiRecordsAdapter } from "../../engine/adapters/api-records.js";
import type { CollectContext, NormalizedRecord } from "../../engine/types.js";

interface AdvisorRange {
  index: number;
  label: string;
  max: number;
}

interface AdvisorData {
  ranges: AdvisorRange[];
  instance_types: Record<string, { cores?: number; ram_gb?: number }>;
  spot_advisor: Record<string, Record<string, Record<string, { s: number; r: number }>>>;
}

interface FilteredRaw {
  endpoint: string;
  regions: string[];
  os: string;
  ranges: AdvisorRange[];
  observed: Record<string, Record<string, { s: number; r: number }>>; // region → type → {s,r}
}

function isGpuType(instanceType: string, prefixes: string[]): boolean {
  const family = instanceType.split(".")[0];
  return prefixes.some((prefix) => family.startsWith(prefix));
}

export class ComputePriceIndexAdapter extends ApiRecordsAdapter {
  readonly id = "compute-price-index";

  protected async fetchRaw(ctx: CollectContext): Promise<unknown> {
    const endpoint = String(ctx.config.endpoint ?? "");
    const regions = ctx.config.regions as string[] | undefined;
    const os = String(ctx.config.os ?? "Linux");
    const prefixes = ctx.config.gpu_prefixes as string[] | undefined;
    if (!endpoint) throw new Error("config.yml에 endpoint가 없습니다.");
    if (!Array.isArray(regions) || regions.length === 0) throw new Error("config.yml에 regions가 없습니다.");
    if (!Array.isArray(prefixes) || prefixes.length === 0) throw new Error("config.yml에 gpu_prefixes가 없습니다.");

    const data = (await ctx.http.json(endpoint)) as Partial<AdvisorData>;
    if (!data || typeof data.spot_advisor !== "object" || !Array.isArray(data.ranges)) {
      throw new Error(`Spot Advisor 응답 형식이 아닙니다: ${JSON.stringify(data).slice(0, 200)}`);
    }

    // 관측 범위만 보존 (원장 성장 관리 — config 주석 참고)
    const observed: FilteredRaw["observed"] = {};
    for (const region of regions) {
      const byOs = data.spot_advisor[region];
      if (!byOs || !byOs[os]) {
        ctx.log(`[${this.id}] 리전/OS 없음 — 건너뜀: ${region}/${os}`);
        continue;
      }
      const types: Record<string, { s: number; r: number }> = {};
      for (const [instanceType, value] of Object.entries(byOs[os])) {
        if (isGpuType(instanceType, prefixes)) types[instanceType] = { s: value.s, r: value.r };
      }
      observed[region] = types;
    }
    const total = Object.values(observed).reduce((sum, types) => sum + Object.keys(types).length, 0);
    ctx.log(`[${this.id}] GPU 스팟 관측 ${total}건 (${Object.keys(observed).length}개 리전)`);

    const raw: FilteredRaw = { endpoint, regions, os, ranges: data.ranges as AdvisorRange[], observed };
    return raw;
  }

  protected normalize(raw: unknown, ctx: CollectContext): NormalizedRecord[] {
    void ctx;
    const { endpoint, os, ranges, observed } = raw as FilteredRaw;
    const labelOf = (index: number): string => ranges.find((range) => range.index === index)?.label ?? String(index);
    const records: NormalizedRecord[] = [];
    for (const [region, types] of Object.entries(observed)) {
      for (const [instanceType, value] of Object.entries(types)) {
        records.push({
          entityId: `spot:${region}:${os}:${instanceType}`,
          sourceUrl: endpoint,
          fields: { s: value.s, r: value.r, r_label: labelOf(value.r) },
        });
      }
    }
    return records;
  }

  /**
   * 설정된 리전·OS 범위 안의 레코드만 삭제 감지 — 리전을 config에서 빼도
   * 과거 관측이 "삭제"로 오염되지 않는다. 범위 안에서 타입이 사라지는 것
   * (세대 교체·제공 중단)은 진짜 이벤트다.
   */
  protected removalScope(ctx: CollectContext): (stored: NormalizedRecord) => boolean {
    const regions = new Set((ctx.config.regions as string[] | undefined) ?? []);
    const os = String(ctx.config.os ?? "Linux");
    return (stored) => {
      const [, region, storedOs] = stored.entityId.split(":");
      return regions.has(region) && storedOs === os;
    };
  }
}

export default new ComputePriceIndexAdapter();
