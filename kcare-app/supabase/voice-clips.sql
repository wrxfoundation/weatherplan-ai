-- K-CARE 베타 — 목소리 표 추가 (2026-10-14)
--
-- 이미 supabase/schema.sql 을 돌린 프로젝트에 이것만 더한다. 여러 번 돌려도 된다.
-- 쓰는 법: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체(Ctrl+A)를 붙여 넣고 Run.
--
-- 앱에서 녹음한 짧은 음성(마음사서함 · 가족 안부 · 말로 부탁하기 · 오늘 여쭤볼 것)을 둔다.
-- 가구 상태에는 이 표의 id 만 남고, 같은 가구(센터) 계정만 들을 수 있다. 30일이 지난 것은 지운다.
create table if not exists public.voice_clips (
  id            text primary key,
  household_id  text not null references public.households(id) on delete cascade,
  account_id    text,
  mime          text not null,
  secs          integer,
  bytes         integer,
  data          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists voice_clips_household_idx on public.voice_clips (household_id, created_at desc);

-- 잠그기 — 서버 비밀 키만 읽고 쓴다 (브라우저용 키로는 못 본다)
alter table public.voice_clips enable row level security;
revoke all on table public.voice_clips from anon, authenticated;

-- 확인 (따로 실행 · 녹음 수만 본다):
--   select household_id, count(*), sum(bytes) from public.voice_clips group by household_id;
