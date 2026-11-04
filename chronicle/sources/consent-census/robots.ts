/**
 * robots.txt에서 AI 크롤러별 동의 상태를 뽑는 파서.
 *
 * 상태:
 *   blocked  — 이 봇 전용 그룹이 Disallow: / (전면 차단)
 *   partial  — 이 봇 전용 그룹이 일부 경로만 Disallow
 *   allowed  — 이 봇 전용 그룹이 있고 차단 없음
 *   absent   — 이 봇을 명시적으로 다루지 않음 (기본 허용이지만 "지목 안 함"과 구분)
 *
 * 신호는 "사이트가 이 AI 봇을 특정해 어떤 태도를 취했나"다 — 그래서 봇 전용
 * 그룹만 본다("*" 폴백 없음). "GPTBot: absent→blocked"가 깨끗한 이벤트가 된다.
 */
export type Stance = "blocked" | "partial" | "allowed" | "absent";

interface RobotsGroup {
  agents: string[];
  disallows: string[];
}

/** robots.txt를 User-agent 그룹으로 분해한다 (연속 User-agent 라인은 한 그룹 공유). */
export function parseRobotsGroups(text: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;
  let expectingAgents = false; // User-agent 라인 직후, 규칙 라인 전
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (field === "user-agent") {
      if (!current || !expectingAgents) {
        current = { agents: [], disallows: [] };
        groups.push(current);
        expectingAgents = true;
      }
      current.agents.push(value.toLowerCase());
    } else {
      if (!current) {
        current = { agents: ["*"], disallows: [] };
        groups.push(current);
      }
      expectingAgents = false; // 규칙(또는 sitemap/crawl-delay)이 나오면 에이전트 누적 종료
      if (field === "disallow") current.disallows.push(value);
    }
  }
  return groups;
}

function stanceOf(group: RobotsGroup): Stance {
  if (group.disallows.some((path) => path === "/")) return "blocked";
  return group.disallows.some((path) => path !== "") ? "partial" : "allowed";
}

/** 각 봇의 동의 상태 — 봇 전용 그룹이 있으면 그 상태, 없으면 absent. */
export function parseAiCrawlerStance(text: string, bots: string[]): Record<string, Stance> {
  const groups = parseRobotsGroups(text);
  const stance: Record<string, Stance> = {};
  for (const bot of bots) {
    const lower = bot.toLowerCase();
    const group = groups.find((candidate) => candidate.agents.includes(lower));
    stance[bot] = group ? stanceOf(group) : "absent";
  }
  return stance;
}
