import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import { decodeSrc, type Src } from "@/lib/traffic-source";

/**
 * 자체 트래픽 계측 (2026-09-06). 외부 분석 도구 없이 관리자 콘솔에서 일 방문자·페이지뷰·API 호출을 본다.
 *
 * - 페이지뷰: 루트 레이아웃에서 after() 로 응답 후 기록. 요청당 UPSERT 1~2건(카운터 증가 + 방문자 해시).
 * - 방문자: sha256(IP + UA + 일 단위 솔트) 앞 24자. 원본 IP·UA 는 저장하지 않는다 → 개인정보 아님.
 * - API 호출: ratelimit guard() 를 지나는 요청마다 카운터 1 증가(응답을 기다리지 않음).
 * - 기기 텔레메트리는 Supabase 엣지 함수(iot)가 받으므로 여기서 세지 않는다 - DeviceIngestLog 로 본다.
 *
 * 100만 기기 규모에서도 사람 트래픽은 별개 축이라 UPSERT 카운터로 충분하다. 실패는 조용히 무시한다.
 *
 * (2026-09-26) 방문자 행에 그날 첫 입구(소스·매체·캠페인)를 적는다 - 미들웨어가 정해 헤더로 넘긴 값.
 * 소스별 방문자 = 그 소스로 들어온 방문자 해시 수, 소스별 페이지뷰 = 그 방문자들의 페이지뷰 합.
 * 소스 열이 아직 없으면(prisma/sql/2026-09-26-traffic-source.sql 적용 전) 옛 방식으로 적고 10분 뒤 다시 시도한다.
 */
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python-requests|headless/i;

function kstDay(d = new Date()): string {
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

export async function bumpTraffic(bucket: string, n = 1): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO "TrafficDaily" ("day", "bucket", "hits") VALUES (${kstDay()}::date, ${bucket}, ${n})
      ON CONFLICT ("day", "bucket") DO UPDATE SET "hits" = "TrafficDaily"."hits" + ${n}`;
  } catch { /* 계측 실패는 서비스에 영향 주지 않는다 */ }
}

let noSrcColsAt = 0;

async function upsertVisitor(day: string, vhash: string, path: string, s: Src | null): Promise<void> {
  if (s && Date.now() - noSrcColsAt > 10 * 60_000) {
    try {
      await prisma.$executeRaw`
        INSERT INTO "TrafficVisitor" ("day", "vhash", "hits", "firstPath", "source", "medium", "campaign")
        VALUES (${day}::date, ${vhash}, 1, ${path.slice(0, 120)}, ${s.source}, ${s.medium || null}, ${s.campaign || null})
        ON CONFLICT ("day", "vhash") DO UPDATE SET "hits" = "TrafficVisitor"."hits" + 1,
          "source" = COALESCE("TrafficVisitor"."source", EXCLUDED."source"),
          "medium" = COALESCE("TrafficVisitor"."medium", EXCLUDED."medium"),
          "campaign" = COALESCE("TrafficVisitor"."campaign", EXCLUDED."campaign")`;
      return;
    } catch {
      noSrcColsAt = Date.now();   // 소스 열이 없거나 일시 오류 - 아래 옛 방식으로 한 번 더
    }
  }
  await prisma.$executeRaw`
    INSERT INTO "TrafficVisitor" ("day", "vhash", "hits", "firstPath") VALUES (${day}::date, ${vhash}, 1, ${path.slice(0, 120)})
    ON CONFLICT ("day", "vhash") DO UPDATE SET "hits" = "TrafficVisitor"."hits" + 1`;
}

/** 페이지뷰 + 방문자 기록. 봇·관리자·API 경로는 제외. src = 미들웨어가 넘긴 입구(x-wb-src). */
export async function recordPageView(opts: { ip: string; ua: string; path: string; src?: string | null }): Promise<void> {
  const { ip, ua, path } = opts;
  if (!path || path.startsWith("/api") || path.startsWith("/admin") || path.startsWith("/_next")) return;
  if (!ua || BOT_RE.test(ua)) { await bumpTraffic("bot"); return; }
  const day = kstDay();
  const salt = process.env.ADMIN_SECRET ?? process.env.CRON_SECRET ?? "wellbian";
  const vhash = createHash("sha256").update(`${day}|${ip}|${ua}|${salt}`).digest("hex").slice(0, 24);
  try {
    await prisma.$executeRaw`
      INSERT INTO "TrafficDaily" ("day", "bucket", "hits") VALUES (${day}::date, 'page', 1)
      ON CONFLICT ("day", "bucket") DO UPDATE SET "hits" = "TrafficDaily"."hits" + 1`;
    await upsertVisitor(day, vhash, path, decodeSrc(opts.src));
  } catch { /* ignore */ }
}
