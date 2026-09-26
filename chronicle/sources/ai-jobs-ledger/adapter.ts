/**
 * #18 AI 랩 채용 원장 (ai-jobs-ledger) — API 레코드형(공개 잡보드) 어댑터.
 *
 * AI 랩들의 채용공고를 일간 박제한다 — 직무·팀·지역. 공고는 마감 즉시 소멸하니
 * "2026년에 어느 랩이 어떤 팀을 어디에 꾸렸나"는 지금 찍은 자만 소유한다(제품
 * 발표 6~12개월 전의 전략 신호). Greenhouse·Lever·Ashby의 공개 잡보드 API는
 * 공식적으로 열려 있어(스크레이핑 아님) 무인증·ToS 클린. #13과 잡보드 계열 공유.
 *
 * 랩별 board 토큰은 최선 추정 — 개별 실패는 그 랩만 건너뛰고(삭제 오탐 방지),
 * 첫 실행이 어떤 토큰이 유효한지 자백한다(config 핫에디트로 교정).
 * 엔티티: job:<lab>:<jobId>
 */
import { BaseAdapter } from "../../engine/adapters/base.js";
import type { CollectContext, CollectResult, NormalizedRecord } from "../../engine/types.js";

interface LabConfig {
  lab: string;
  provider: "greenhouse" | "lever" | "ashby";
  board: string;
}

interface Job {
  id: string;
  title: string | null;
  team: string | null;
  location: string | null;
  employment_type: string | null;
}

type Json = Record<string, unknown>;

function str(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

function boardUrl(config: LabConfig): string {
  switch (config.provider) {
    case "greenhouse":
      return `https://boards-api.greenhouse.io/v1/boards/${config.board}/jobs`;
    case "ashby":
      return `https://api.ashbyhq.com/posting-api/job-board/${config.board}`;
    case "lever":
      return `https://api.lever.co/v0/postings/${config.board}?mode=json`;
  }
}

function parseJobs(config: LabConfig, body: unknown): Job[] {
  if (config.provider === "lever") {
    const arr = Array.isArray(body) ? (body as Json[]) : [];
    return arr.map((j) => ({
      id: String(j.id ?? ""),
      title: str(j.text),
      team: str((j.categories as Json)?.team) ?? str((j.categories as Json)?.department),
      location: str((j.categories as Json)?.location),
      employment_type: str((j.categories as Json)?.commitment),
    }));
  }
  const jobs = ((body as Json)?.jobs as Json[] | undefined) ?? [];
  if (config.provider === "ashby") {
    return jobs
      .filter((j) => j.isListed !== false)
      .map((j) => ({
        id: String(j.id ?? ""),
        title: str(j.title),
        team: str(j.teamName) ?? str(j.departmentName),
        location: str(j.locationName),
        employment_type: str(j.employmentType),
      }));
  }
  // greenhouse
  return jobs.map((j) => ({
    id: String(j.id ?? ""),
    title: str(j.title),
    team: str((Array.isArray(j.departments) ? (j.departments[0] as Json) : undefined)?.name),
    location: str((j.location as Json)?.name),
    employment_type: null,
  }));
}

export class AiJobsLedgerAdapter extends BaseAdapter {
  readonly id = "ai-jobs-ledger";
  readonly family = "api-records" as const;

  private labs(ctx: CollectContext): LabConfig[] {
    const labs = ctx.config.labs as LabConfig[] | undefined;
    if (!Array.isArray(labs) || labs.length === 0) throw new Error("config.yml에 labs가 없습니다.");
    return labs;
  }

  async collect(ctx: CollectContext): Promise<CollectResult> {
    const userAgent = ctx.config.user_agent;
    const init: RequestInit | undefined =
      typeof userAgent === "string" && userAgent ? { headers: { "User-Agent": userAgent, Accept: "application/json" } } : undefined;

    const records: NormalizedRecord[] = [];
    const raw: Record<string, unknown> = {};
    const failedLabs = new Set<string>();

    for (const lab of this.labs(ctx)) {
      const url = boardUrl(lab);
      try {
        const body = await ctx.http.json(url, init);
        const jobs = parseJobs(lab, body);
        raw[lab.lab] = { provider: lab.provider, board: lab.board, count: jobs.length };
        for (const job of jobs) {
          if (!job.id) continue;
          records.push({
            entityId: `job:${lab.lab}:${job.id}`,
            sourceUrl: url,
            fields: {
              lab: lab.lab,
              provider: lab.provider,
              title: job.title,
              team: job.team,
              location: job.location,
              employment_type: job.employment_type,
            },
          });
        }
      } catch (error) {
        failedLabs.add(lab.lab);
        ctx.log(`[${this.id}] 잡보드 실패 — 건너뜀: ${lab.lab} (${lab.provider}/${lab.board}) ${error instanceof Error ? error.message : error}`);
      }
    }

    // 전 랩 실패 = 소스/네트워크 장애 (토큰 몇 개 오류는 정상)
    if (failedLabs.size === this.labs(ctx).length) {
      throw new Error(`[${this.id}] 전 랩(${failedLabs.size}) 잡보드 실패 — 소스/네트워크 장애 의심.`);
    }
    ctx.log(`[${this.id}] 공고 ${records.length}건 / 성공 랩 ${this.labs(ctx).length - failedLabs.size}곳`);

    return {
      raw,
      records,
      // 페치에 실패한 랩의 공고는 이번 회차 삭제 판정에서 제외한다(랩 전체 오탐 삭제 방지).
      removalScope: (stored) => {
        const lab = stored.entityId.split(":")[1];
        return !failedLabs.has(lab);
      },
    };
  }
}

export default new AiJobsLedgerAdapter();
