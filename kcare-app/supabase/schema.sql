-- K-CARE 베타 — Supabase 표 만들기
--
-- 이것은 베타 테스트 계정용 최소 저장소다. 실서비스 설계(등급 S1~S4 · 사람/역할 분리 · 보존기한)는
-- docs/DB-SCHEMA.md · docs/schema.sql 에 따로 있고, 실서비스로 갈 때 그쪽으로 옮긴다.
-- 여기에는 실제 고객 개인정보를 넣지 않는다 (설계 문서의 개인정보 영향평가 게이트 전).
--
-- 쓰는 법: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체를 붙여 넣고 Run.
-- 여러 번 돌려도 된다 (이미 있는 표는 건너뛴다).
--
-- 누가 읽고 쓰나: 우리 서버(Vercel API)만, 비밀 키(sb_secret_… 또는 service_role)로.
-- 브라우저용 키(publishable · anon)로는 아무것도 못 보게 막는다 —
--   ① 모든 표에 RLS 를 켜고 정책을 두지 않는다  ② anon · authenticated 권한을 거둔다.
-- 표 내용은 Table Editor 에서 본다.

-- 가구 — 테스트 계정 세 개가 함께 쓰는 앱 상태를 통째로 담는다 (lib/state.js)
create table if not exists public.households (
  id          text primary key,              -- HH-TEST-01
  name        text not null,
  is_test     boolean not null default false,
  state       jsonb,                         -- 앱 상태 전체. 처음 로그인하기 전에는 비어 있다
  version     integer not null default 0,    -- 저장할 때마다 1씩 오른다 (두 폰이 동시에 저장할 때 충돌 판정)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  text                           -- 마지막으로 저장한 계정
);

-- 계정 — 로그인한 적이 있는 계정과 마지막 로그인 시각
create table if not exists public.accounts (
  id              text primary key,          -- test-guardian · google:someone@example.com
  email           text,
  name            text,
  role            text,                      -- guardian · elder · concierge (구글 계정은 비어 있다)
  household_id    text references public.households(id) on delete set null,
  provider        text not null,             -- test · google-sim · google
  is_test         boolean not null default false,
  first_login_at  timestamptz not null default now(),
  last_login_at   timestamptz not null default now()
);

-- 활동 기록 — 화면에서 한 일을 한 줄씩 (lib/activity.js 가 요약을 만든다)
create table if not exists public.activity (
  id            bigint generated always as identity primary key,
  household_id  text not null references public.households(id) on delete cascade,
  account_id    text,
  role          text,
  type          text not null,               -- addRequest · addVoice · completeOnboarding · login …
  summary       text,                        -- 사람이 읽는 한 줄 (예: 해주세요 요청 · 병원 동행)
  payload       jsonb,                       -- 동작 내용 (긴 글·사진은 잘라서)
  client_at     timestamptz,                 -- 화면에서 누른 시각
  created_at    timestamptz not null default now()
);
create index if not exists activity_household_created_idx on public.activity (household_id, created_at desc);

-- 가입 신청 — 가입 상담 마지막 단계 (pages/onboarding.jsx)
create table if not exists public.signups (
  id               bigint generated always as identity primary key,
  household_id     text references public.households(id) on delete set null,
  account_id       text,
  track            text,
  for_self         boolean,
  care_location    text,
  household_type   text,                     -- single · couple
  relation         text,
  relation_detail  text,
  phone            text,
  address          text,
  elder_phone      text,
  residence        text,
  elder_name       text,
  district         text,
  tier             integer,
  payment_mode     text,
  limit_amount     integer,
  video_consent    boolean,
  sales_ref        text,                     -- 추천 영업자 코드
  auth_provider    text,
  auth_email       text,
  is_test          boolean not null default false,
  created_at       timestamptz not null default now()
);
create index if not exists signups_created_idx on public.signups (created_at desc);
create index if not exists signups_sales_ref_idx on public.signups (sales_ref);

-- 결제 — 토스 승인이 끝난 건만 (pages/api/payments/confirm.js · 금액은 토스 응답 기준)
create table if not exists public.payments (
  order_id      text primary key,
  household_id  text references public.households(id) on delete set null,
  account_id    text,
  kind          text,                        -- entry · store · request
  order_name    text,
  amount        integer not null,
  method        text,
  status        text,
  approved_at   timestamptz,
  receipt_url   text,
  test_mode     boolean,                     -- 토스 테스트 키로 승인된 건
  created_at    timestamptz not null default now()
);
create index if not exists payments_household_idx on public.payments (household_id, created_at desc);

-- 잠그기 — 서버 비밀 키만 읽고 쓴다
alter table public.households enable row level security;
alter table public.accounts   enable row level security;
alter table public.activity   enable row level security;
alter table public.signups    enable row level security;
alter table public.payments   enable row level security;

revoke all on table public.households, public.accounts, public.activity, public.signups, public.payments from anon, authenticated;

-- 확인용 (따로 실행):
--   select created_at, account_id, summary from public.activity order by created_at desc limit 50;
--   select id, version, updated_at, updated_by from public.households;
--
-- 테스트 가구를 처음 상태로 되돌리기 (따로 실행 · 그 가구의 활동 기록도 함께 지워진다):
--   delete from public.households where id = 'HH-TEST-01';
