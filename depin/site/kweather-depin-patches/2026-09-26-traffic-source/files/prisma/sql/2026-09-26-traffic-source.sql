-- 유입 소스(2026-09-26): 방문자 행에 그날 첫 입구(소스·매체·캠페인)를 적는다.
-- 관리자 "시스템·용량" 탭의 「유입 소스별 방문자 · 페이지뷰」 표와 CSV 내려받기가 이 열을 읽는다.
-- 코드보다 먼저 적용해도, 나중에 적용해도 된다(코드는 열이 없으면 옛 방식으로 기록한다). 여러 번 실행해도 안전하다.
ALTER TABLE "TrafficVisitor" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "TrafficVisitor" ADD COLUMN IF NOT EXISTS "medium" TEXT;
ALTER TABLE "TrafficVisitor" ADD COLUMN IF NOT EXISTS "campaign" TEXT;
CREATE INDEX IF NOT EXISTS "TrafficVisitor_day_source_idx" ON "TrafficVisitor" ("day", "source");
