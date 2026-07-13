/**
 * #19 에이전트 커머스 센서스 (agent-commerce-census) — 파일/프로브형 어댑터.
 *
 * 후보 채택사 도메인 × well-known 매니페스트 경로를 프로브해 에이전트 결제·커머스
 * 표준(x402·AP2·ACP·MCP)의 채택 신호를 봉인한다. 200(JSON) 매니페스트 등장 =
 * 채택 이벤트, 404 = 미채택 베이스라인. 표준이 막 태어난 지금 시작해야 채택
 * 곡선을 제네시스부터 소유한다 — file-probe 계열에 targets()만 얹으면 되는
 * "1 엔진 + N 어댑터"의 증명.
 *
 * 엔티티: manifest:<domain>:<path-slug>
 */
import { FileProbeAdapter, type ProbeTarget } from "../../engine/adapters/file-probe.js";
import type { CollectContext } from "../../engine/types.js";

function slug(path: string): string {
  return path
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export class AgentCommerceCensusAdapter extends FileProbeAdapter {
  readonly id = "agent-commerce-census";

  protected requestInit(ctx: CollectContext): RequestInit | undefined {
    const userAgent = ctx.config.user_agent;
    if (typeof userAgent !== "string" || !userAgent) return undefined;
    return { headers: { "User-Agent": userAgent, Accept: "application/json, */*" } };
  }

  protected targets(ctx: CollectContext): ProbeTarget[] {
    const domains = ctx.config.domains as string[] | undefined;
    const paths = ctx.config.paths as string[] | undefined;
    if (!Array.isArray(domains) || domains.length === 0) throw new Error("config.yml에 domains가 없습니다.");
    if (!Array.isArray(paths) || paths.length === 0) throw new Error("config.yml에 paths가 없습니다.");
    const scheme = String(ctx.config.scheme ?? "https");
    const targets: ProbeTarget[] = [];
    for (const domain of domains) {
      for (const path of paths) {
        targets.push({ entityId: `manifest:${domain}:${slug(path)}`, url: `${scheme}://${domain}${path}` });
      }
    }
    return targets;
  }

  /**
   * SPA catch-all(HTML 200)을 매니페스트 채택으로 오인·churn하지 않게:
   * JSON이 아닌 200 본문은 해시·수록에서 빼고 non_manifest로 표시한다.
   */
  protected async probe(ctx: CollectContext, target: ProbeTarget): Promise<Record<string, unknown>> {
    const fields = await super.probe(ctx, target);
    if (fields.status === 200 && typeof fields.body === "string") {
      const contentType = String(fields.content_type ?? "");
      const looksJson = contentType.includes("json") || /^\s*[[{]/.test(fields.body);
      if (!looksJson) {
        delete fields.body;
        delete fields.body_sha256;
        delete fields.body_bytes;
        fields.non_manifest = true; // HTML 등 — 실제 매니페스트 아님
      }
    }
    return fields;
  }
}

export default new AgentCommerceCensusAdapter();
