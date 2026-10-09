-- K-CARE 베타 — Supabase 표 만들기
--
-- 이것은 베타 테스트 계정용 최소 저장소다. 실서비스 설계(등급 S1~S4 · 사람/역할 분리 · 보존기한)는
-- docs/DB-SCHEMA.md · docs/schema.sql 에 따로 있고, 실서비스로 갈 때 그쪽으로 옮긴다.
-- 여기에는 실제 고객 개인정보를 넣지 않는다 (설계 문서의 개인정보 영향평가 게이트 전).
--
-- 쓰는 법: Supabase 대시보드 → SQL Editor → New query → 이 파일 전체를 붙여 넣고 Run.
-- 여러 번 돌려도 된다 (이미 있는 표 · 칸은 건너뛴다). 2026-10-06 회원 · 관제 센터가 추가됐다 — 예전에 돌렸어도
-- 이 파일 전체를 한 번 더 Run 하면 새 표 · 칸만 더해진다 (기존 기록은 그대로).
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

-- ── 회원 · 관제 센터 (2026-10-06) ────────────────────────────────────────────
-- 관제 1 · 2 · 3센터는 서로 완전히 따로 쓰는 테스트 공간이다. 센터마다 가구 상태(HH-C1 …) · 회원 · 활동 기록이
-- 따로 쌓이고, 다른 센터의 것은 보이지 않는다. 테스트 가구 1(HH-TEST-01)은 예전 테스트 계정 그대로 남는다.
-- 표를 센터마다 새로 만들지 않고 같은 표 안에서 센터 번호로 나눈다 — 화면 · 서버 코드가 한 벌이면 된다.
-- 대신 Table Editor 에서 센터별로 따로 보이게 center1_… · center2_… · center3_… 보기(view)를 둔다.
create table if not exists public.centers (
  id            text primary key,            -- C1 · C2 · C3
  name          text not null,               -- 관제 1센터
  household_id  text not null,               -- 이 센터가 쓰는 가구 상태 (HH-C1)
  join_code     text not null,               -- 가입 코드 8자리 — 이 코드로 가입한 사람이 이 센터 회원이 된다 (관제 화면에서 바꿀 수 있다)
  created_at    timestamptz not null default now()
);
-- 첫 가입 코드 — 헷갈리는 글자(0 O 1 I)를 뺀 32자 중 8자리, gen_random_uuid() 의 무작위 바이트(암호학적 난수)로 만든다
create or replace function public.kcare_new_join_code() returns text
language sql volatile set search_path = public, pg_catalog as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(b, i) % 32) + 1, 1), '' order by i)
  from (select decode(replace(gen_random_uuid()::text, '-', ''), 'hex') as b) u, unnest(array[0, 1, 2, 3, 4, 5, 10, 11]) as i
$$;
insert into public.centers (id, name, household_id, join_code) values
  ('C1', '관제 1센터', 'HH-C1', public.kcare_new_join_code()),
  ('C2', '관제 2센터', 'HH-C2', public.kcare_new_join_code()),
  ('C3', '관제 3센터', 'HH-C3', public.kcare_new_join_code())
on conflict (id) do nothing;
create unique index if not exists centers_join_code_key on public.centers (join_code);

alter table public.households add column if not exists center_id text references public.centers(id);

-- 회원 — 가입 화면에서 만든 계정. 비밀번호는 해시(scrypt)만 저장한다 (원문은 어디에도 남지 않는다)
alter table public.accounts add column if not exists center_id     text references public.centers(id);
alter table public.accounts add column if not exists login_id      text;           -- 로그인 아이디 (소문자)
alter table public.accounts add column if not exists password_hash text;           -- scrypt$… (테스트 · 구글 계정은 비어 있다)
alter table public.accounts add column if not exists status        text not null default 'active'; -- pending · active · rejected · suspended
alter table public.accounts add column if not exists phone         text;
alter table public.accounts add column if not exists profile       jsonb;          -- 활동 지역 · 소속 등 가입 때 적은 것
alter table public.accounts add column if not exists requested_role text;          -- 가입 때 고른 역할
alter table public.accounts add column if not exists approved_by   text;
alter table public.accounts add column if not exists approved_at   timestamptz;
alter table public.accounts add column if not exists created_at    timestamptz not null default now();
-- 로그인 실패 — 5번 틀리면 잠시 잠근다 (5분 → 10분 → … 최대 1시간 · 맞게 들어오면 처음부터)
alter table public.accounts add column if not exists failed_logins integer not null default 0;
alter table public.accounts add column if not exists locked_until  timestamptz;
-- 가입만 하고 아직 로그인하지 않은 회원은 로그인 시각이 비어 있다
alter table public.accounts alter column first_login_at drop not null;
alter table public.accounts alter column last_login_at drop not null;
create unique index if not exists accounts_login_id_key on public.accounts (login_id) where login_id is not null;
create index if not exists accounts_center_idx on public.accounts (center_id, status);

-- 로그인 실패 한 번 — 동시에 여러 번 틀려도 빠짐없이 세도록 한 문장으로 올린다. 잠긴 시각을 돌려준다
create or replace function public.kcare_login_failed(p_id text) returns timestamptz
language sql volatile set search_path = public, pg_catalog as $$
  update public.accounts
     set failed_logins = failed_logins + 1,
         locked_until = case when failed_logins + 1 >= 5
                             then now() + make_interval(mins => least(60, 5 * (2 ^ least(4, failed_logins + 1 - 5))::int))
                             else locked_until end
   where id = p_id
  returning locked_until
$$;

-- 권한 변경 기록 — 승인 · 거절 · 역할 변경 · 정지 · 가입 코드 변경. 지우지 않는다
create table if not exists public.account_audit (
  id          bigint generated always as identity primary key,
  center_id   text references public.centers(id),
  account_id  text,                          -- 바뀐 계정 (가입 코드 변경이면 비어 있다)
  actor_id    text not null,                 -- 바꾼 관제 계정
  action      text not null,                 -- signup · approve · reject · role · suspend · activate · join-code
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists account_audit_center_idx on public.account_audit (center_id, created_at desc);

-- 센터별 보기 (Table Editor 에서 '관제 1센터 표'처럼 본다 · 읽기 전용)
create or replace view public.center1_accounts with (security_invoker = on) as
  select id, login_id, name, role, status, phone, profile, created_at, approved_by, approved_at, last_login_at from public.accounts where center_id = 'C1';
create or replace view public.center1_household with (security_invoker = on) as
  select id, name, version, updated_at, updated_by, state from public.households where id = 'HH-C1';
create or replace view public.center1_activity with (security_invoker = on) as
  select id, created_at, account_id, role, type, summary from public.activity where household_id = 'HH-C1';
create or replace view public.center1_signups with (security_invoker = on) as
  select * from public.signups where household_id = 'HH-C1';
create or replace view public.center1_payments with (security_invoker = on) as
  select * from public.payments where household_id = 'HH-C1';
create or replace view public.center2_accounts with (security_invoker = on) as
  select id, login_id, name, role, status, phone, profile, created_at, approved_by, approved_at, last_login_at from public.accounts where center_id = 'C2';
create or replace view public.center2_household with (security_invoker = on) as
  select id, name, version, updated_at, updated_by, state from public.households where id = 'HH-C2';
create or replace view public.center2_activity with (security_invoker = on) as
  select id, created_at, account_id, role, type, summary from public.activity where household_id = 'HH-C2';
create or replace view public.center2_signups with (security_invoker = on) as
  select * from public.signups where household_id = 'HH-C2';
create or replace view public.center2_payments with (security_invoker = on) as
  select * from public.payments where household_id = 'HH-C2';
create or replace view public.center3_accounts with (security_invoker = on) as
  select id, login_id, name, role, status, phone, profile, created_at, approved_by, approved_at, last_login_at from public.accounts where center_id = 'C3';
create or replace view public.center3_household with (security_invoker = on) as
  select id, name, version, updated_at, updated_by, state from public.households where id = 'HH-C3';
create or replace view public.center3_activity with (security_invoker = on) as
  select id, created_at, account_id, role, type, summary from public.activity where household_id = 'HH-C3';
create or replace view public.center3_signups with (security_invoker = on) as
  select * from public.signups where household_id = 'HH-C3';
create or replace view public.center3_payments with (security_invoker = on) as
  select * from public.payments where household_id = 'HH-C3';

-- 잠그기 — 서버 비밀 키만 읽고 쓴다
alter table public.households enable row level security;
alter table public.accounts   enable row level security;
alter table public.activity   enable row level security;
alter table public.signups    enable row level security;
alter table public.payments   enable row level security;
alter table public.centers    enable row level security;
alter table public.account_audit enable row level security;

revoke all on table public.households, public.accounts, public.activity, public.signups, public.payments,
  public.centers, public.account_audit from anon, authenticated;
revoke all on function public.kcare_login_failed(text), public.kcare_new_join_code() from public, anon, authenticated;
grant execute on function public.kcare_login_failed(text) to service_role;
revoke all on table public.center1_accounts, public.center1_household, public.center1_activity, public.center1_signups, public.center1_payments, public.center2_accounts, public.center2_household, public.center2_activity, public.center2_signups, public.center2_payments, public.center3_accounts, public.center3_household, public.center3_activity, public.center3_signups, public.center3_payments from anon, authenticated;

-- 관제 센터 가입 코드 보기 (따로 실행 · 관제 1~3센터 화면 '회원 · 권한'에서도 보인다):
--   select id, name, join_code from public.centers order by id;
--
-- 확인용 (따로 실행):
--   select created_at, account_id, summary from public.activity order by created_at desc limit 50;
--   select id, version, updated_at, updated_by from public.households;
--
-- 테스트 가구를 처음 상태로 되돌리기 (따로 실행 · 그 가구의 활동 기록도 함께 지워진다):
--   delete from public.households where id = 'HH-TEST-01';
--
-- 관제 1센터를 처음 상태로 (따로 실행 · 회원까지 지우려면 둘째 줄도):
--   delete from public.households where id = 'HH-C1';
--   delete from public.accounts where center_id = 'C1' and password_hash is not null;
