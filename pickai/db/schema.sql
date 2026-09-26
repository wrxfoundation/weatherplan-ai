-- ============================================================
-- Pick AI · 이력·벤치마크 DB 스키마 (Supabase / Postgres)
--
-- 설치: Supabase 대시보드 > SQL Editor에 이 파일 전체를 붙여넣고 Run
-- 이후 Vercel 환경변수에 SUPABASE_URL, SUPABASE_ANON_KEY 등록 + Redeploy
-- ============================================================

create table if not exists public.pickai_scans (
  id          bigint generated always as identity primary key,
  host        text not null,              -- 입력 기준 호스트
  final_host  text,                       -- 리다이렉트 최종 호스트
  http_status int,
  overall     int  not null,
  grade       text not null,
  seo         int, aeo int, geo int, reach int,
  issues      int, fails int,
  is_benchmark boolean not null default false,  -- 벤치마크 축적 행
  company     text,                       -- 벤치마크: 기업명
  industry    text,                       -- 벤치마크: 업종
  engine      text,                       -- 채점 엔진 버전
  source      text not null default 'web',      -- web | cron | benchmark
  created_at  timestamptz not null default now()
);

create index if not exists pickai_scans_host_idx  on public.pickai_scans (host, created_at desc);
create index if not exists pickai_scans_bench_idx on public.pickai_scans (is_benchmark, created_at desc);

-- 내부 베타 운영 전제의 RLS (anon 읽기/쓰기 — 공개 전 서비스 전환 시 강화할 것)
alter table public.pickai_scans enable row level security;

drop policy if exists "pickai anon read"   on public.pickai_scans;
drop policy if exists "pickai anon insert" on public.pickai_scans;

create policy "pickai anon read"
  on public.pickai_scans for select to anon using (true);

create policy "pickai anon insert"
  on public.pickai_scans for insert to anon with check (true);
