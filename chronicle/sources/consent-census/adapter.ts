/**
 * #16 Agent-Web 동의 센서스 (consent-census) — 파일/프로브형 어댑터.
 *
 * 상위 도메인의 robots.txt·llms.txt를 일간 스냅샷해 AI 크롤러(GPTBot·ClaudeBot·
 * CCBot 등) 차단/허용 diff를 봉인한다. "Consent in Crisis"(MIT)가 Wayback으로
 * 힘겹게 재구성한 웹 동의 지형을, 우리는 전향적 정본으로 소유한다. 법적 최청정
 * (robots.txt 페치 = 용도 그 자체), 저장 최소. #19와 같은 크롤 루프.
 *
 * 엔티티: probe:<domain>:robots-txt / probe:<domain>:llms-txt
 * robots는 봇별 상태(bot:GPTBot 등)를 파싱해 "특정 봇 차단으로 전환"이 깔끔한
 * 필드 이벤트가 된다. llms.txt 404 = 미채택(관측), 200 등장 = 채택 이벤트.
 */
import { FileProbeAdapter, type ProbeTarget } from "../../engine/adapters/file-probe.js";
import type { CollectContext } from "../../engine/types.js";
import { parseAiCrawlerStance } from "./robots.js";

const DEFAULT_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "anthropic-ai", "CCBot", "Google-Extended", "PerplexityBot", "Bytespider", "Applebot-Extended", "meta-externalagent", "Amazonbot"];

export class ConsentCensusAdapter extends FileProbeAdapter {
  readonly id = "consent-census";

  private bots(ctx: CollectContext): string[] {
    const bots = ctx.config.bots as string[] | undefined;
    return Array.isArray(bots) && bots.length > 0 ? bots : DEFAULT_BOTS;
  }

  protected requestInit(ctx: CollectContext): RequestInit | undefined {
    const userAgent = ctx.config.user_agent;
    if (typeof userAgent !== "string" || !userAgent) return undefined;
    return { headers: { "User-Agent": userAgent } };
  }

  protected targets(ctx: CollectContext): ProbeTarget[] {
    const domains = ctx.config.domains as string[] | undefined;
    if (!Array.isArray(domains) || domains.length === 0) {
      throw new Error("config.yml에 domains가 없습니다 — 관측할 도메인을 지정하세요.");
    }
    const scheme = String(ctx.config.scheme ?? "https");
    const targets: ProbeTarget[] = [];
    for (const domain of domains) {
      targets.push({ entityId: `probe:${domain}:robots-txt`, url: `${scheme}://${domain}/robots.txt` });
      targets.push({ entityId: `probe:${domain}:llms-txt`, url: `${scheme}://${domain}/llms.txt` });
    }
    return targets;
  }

  /** robots.txt 본문에 AI 크롤러별 동의 상태를 필드로 덧붙인다. */
  protected async probe(ctx: CollectContext, target: ProbeTarget): Promise<Record<string, unknown>> {
    const fields = await super.probe(ctx, target);
    if (typeof fields.body === "string" && target.entityId.endsWith(":robots-txt")) {
      const stance = parseAiCrawlerStance(fields.body, this.bots(ctx));
      for (const [bot, value] of Object.entries(stance)) fields[`bot:${bot}`] = value;
    }
    return fields;
  }
}

export default new ConsentCensusAdapter();
