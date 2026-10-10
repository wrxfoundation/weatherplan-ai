import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkAdminSecret } from "@/lib/auth/session";
import { collectSystemStats, snapshotSystemStats } from "@/lib/system-stats";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CONFIG_KEY = "system_capacity";
const DEFAULT_CFG = { planLimitGb: 8, alertPct: 70, retentionYears: 1, readingsPerDevicePerDay: 1440, ingestLogRetentionDays: 30 };

async function loadCfg() {
  const row = await prisma.adminConfig.findUnique({ where: { key: CONFIG_KEY } }).catch(() => null);
  return { ...DEFAULT_CFG, ...((row?.value as Partial<typeof DEFAULT_CFG> | null) ?? {}) };
}

/**
 * 관리자 "시스템·용량" 탭.
 *  GET  → 현재 스냅샷 + 최근 30일 트래픽 + 최근 30일 유입 소스별 방문자·페이지뷰 + 최근 90일 일별 스냅샷 + 설정
 *  PUT  {planLimitGb?, alertPct?, retentionYears?, readingsPerDevicePerDay?} 설정 저장
 *  PUT  {snapshot: true} 지금 스냅샷 1건 저장
 */
export async function GET(req: NextRequest) {
  if (!checkAdminSecret(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [now, traffic, visitors, history, cfg, sources] = await Promise.all([
    collectSystemStats(),
    prisma.$queryRaw<{ day: Date; bucket: string; hits: bigint }[]>`
      select day, bucket, hits from "TrafficDaily" where day > ((now() at time zone 'Asia/Seoul')::date - 30) order by day`.catch(() => []),
    prisma.$queryRaw<{ day: Date; n: bigint }[]>`
      select day, count(*) as n from "TrafficVisitor" where day > ((now() at time zone 'Asia/Seoul')::date - 30) group by day order by day`.catch(() => []),
    prisma.$queryRaw<Record<string, unknown>[]>`
      select day, "dbBytes", "rawRows", "rawBytes", "ingestLogRows", "ingestLogBytes", devices, "activeDevices", "rawRows24h", "pageViews", visitors, "apiHits"
      from "SystemStat" where day > ((now() at time zone 'Asia/Seoul')::date - 90) order by day`.catch(() => []),
    loadCfg(),
    /* 유입 소스(2026-09-26) - 방문자 행의 그날 첫 입구로 묶는다. 소스 열이 없으면(SQL 적용 전) ready=false.
       source 가 null 인 행은 소스를 적기 전의 방문이다(화면에서 「(기록 전)」). */
    prisma.$queryRaw<{ day: Date; source: string | null; medium: string | null; campaign: string | null; visitors: bigint; pages: bigint | null }[]>`
      select day, source, medium, campaign, count(*) as visitors, sum(hits) as pages
      from "TrafficVisitor" where day > ((now() at time zone 'Asia/Seoul')::date - 30)
      group by day, source, medium, campaign order by day`
      .then((rows) => ({ ready: true, rows }))
      .catch(() => ({ ready: false, rows: [] as never[] })),
  ]);
  const days: Record<string, { page: number; api: number; bot: number; visitors: number }> = {};
  const key = (d: Date) => new Date(d).toISOString().slice(0, 10);
  for (const t of traffic) { const k = key(t.day); days[k] ??= { page: 0, api: 0, bot: 0, visitors: 0 }; (days[k] as Record<string, number>)[t.bucket] = Number(t.hits); }
  for (const v of visitors) { const k = key(v.day); days[k] ??= { page: 0, api: 0, bot: 0, visitors: 0 }; days[k].visitors = Number(v.n); }
  const hist = history.map((h) => Object.fromEntries(Object.entries(h).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v instanceof Date ? key(v) : v])));
  const sourceRows = sources.rows.map((r) => ({
    day: key(r.day), source: r.source, medium: r.medium ?? "", campaign: r.campaign ?? "",
    visitors: Number(r.visitors), pages: Number(r.pages ?? 0),
  }));
  return NextResponse.json({ now, trafficDays: days, history: hist, cfg, trafficSources: { ready: sources.ready, rows: sourceRows } });
}

const Body = z.object({
  planLimitGb: z.number().positive().max(100000).optional(),
  alertPct: z.number().min(10).max(99).optional(),
  retentionYears: z.number().positive().max(50).optional(),
  readingsPerDevicePerDay: z.number().positive().max(100000).optional(),
  ingestLogRetentionDays: z.number().int().min(1).max(3650).optional(),
  snapshot: z.boolean().optional(),
});

export async function PUT(req: NextRequest) {
  if (!checkAdminSecret(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  if (b.data.snapshot) { await snapshotSystemStats(); return NextResponse.json({ ok: true }); }
  const cur = await loadCfg();
  const { snapshot: _s, ...patch } = b.data;
  void _s;
  const next = { ...cur, ...patch };
  await prisma.adminConfig.upsert({ where: { key: CONFIG_KEY }, create: { key: CONFIG_KEY, value: next, updatedBy: "admin-console" }, update: { value: next, updatedBy: "admin-console" } });
  return NextResponse.json({ ok: true, cfg: next });
}
