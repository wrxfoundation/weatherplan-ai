-- 가족(가구)마다 기록 나누기 (2026-11-12 — "가입 코드가 달라도 모두 한 사람으로 묶인다").
-- 이미 schema.sql 을 실행한 프로젝트는 이 파일만 한 번 실행하면 된다 (여러 번 실행해도 된다 · 기존 기록은 그대로).
-- 새 프로젝트는 schema.sql 에 같은 내용이 들어 있으니 따로 실행하지 않아도 된다.
--
-- 무엇이 바뀌나
--   · 한 관제 센터 안에 가족이 여럿 — 가족마다 households 한 줄(HH-C1-XXXXXX)과 가족 가입 코드가 하나씩.
--     예전부터 쓰던 HH-C1 · HH-C2 · HH-C3 은 그 센터의 '첫 가족'으로 그대로 남는다 (기록 · 회원 그대로).
--   · 어르신 · 보호자는 가족 가입 코드로 가입한다. 센터 가입 코드(centers.join_code)는 직원(컨시어지 · 파트너 · 관제) 가입에만 쓴다.
--   · 가족은 관제 화면 '가족 관리'에서 만든다 (여기서 SQL 로 만들지 않는다).
-- 이 파일을 실행하기 전에는 앱이 예전 방식(센터 코드 하나 · 한 가족)으로 돈다.

alter table public.households add column if not exists label      text;   -- 관제가 적은 가족 이름 (비우면 어르신 이름으로 '○○ 님 가족')
alter table public.households add column if not exists join_code  text;   -- 가족 가입 코드 8자리 — 이 코드로 가입한 어르신 · 보호자가 이 가족에 들어간다
alter table public.households add column if not exists created_by text;   -- 가족을 만든 관제 계정
create unique index if not exists households_join_code_key on public.households (join_code) where join_code is not null;
create index if not exists households_center_idx on public.households (center_id);
create index if not exists accounts_household_idx on public.accounts (household_id);

-- 센터별 보기 — 그 센터의 모든 가족이 보이게 (Table Editor 에서 보는 읽기 전용 보기)
create or replace view public.center1_household with (security_invoker = on) as
  select id, name, version, updated_at, updated_by, state, label, join_code from public.households where id = 'HH-C1' or id like 'HH-C1-%';
create or replace view public.center1_activity with (security_invoker = on) as
  select id, created_at, account_id, role, type, summary, household_id from public.activity where household_id = 'HH-C1' or household_id like 'HH-C1-%';
create or replace view public.center1_signups with (security_invoker = on) as
  select * from public.signups where household_id = 'HH-C1' or household_id like 'HH-C1-%';
create or replace view public.center1_payments with (security_invoker = on) as
  select * from public.payments where household_id = 'HH-C1' or household_id like 'HH-C1-%';
create or replace view public.center1_accounts with (security_invoker = on) as
  select id, login_id, name, role, status, phone, profile, created_at, approved_by, approved_at, last_login_at, household_id from public.accounts where center_id = 'C1';
create or replace view public.center2_household with (security_invoker = on) as
  select id, name, version, updated_at, updated_by, state, label, join_code from public.households where id = 'HH-C2' or id like 'HH-C2-%';
create or replace view public.center2_activity with (security_invoker = on) as
  select id, created_at, account_id, role, type, summary, household_id from public.activity where household_id = 'HH-C2' or household_id like 'HH-C2-%';
create or replace view public.center2_signups with (security_invoker = on) as
  select * from public.signups where household_id = 'HH-C2' or household_id like 'HH-C2-%';
create or replace view public.center2_payments with (security_invoker = on) as
  select * from public.payments where household_id = 'HH-C2' or household_id like 'HH-C2-%';
create or replace view public.center2_accounts with (security_invoker = on) as
  select id, login_id, name, role, status, phone, profile, created_at, approved_by, approved_at, last_login_at, household_id from public.accounts where center_id = 'C2';
create or replace view public.center3_household with (security_invoker = on) as
  select id, name, version, updated_at, updated_by, state, label, join_code from public.households where id = 'HH-C3' or id like 'HH-C3-%';
create or replace view public.center3_activity with (security_invoker = on) as
  select id, created_at, account_id, role, type, summary, household_id from public.activity where household_id = 'HH-C3' or household_id like 'HH-C3-%';
create or replace view public.center3_signups with (security_invoker = on) as
  select * from public.signups where household_id = 'HH-C3' or household_id like 'HH-C3-%';
create or replace view public.center3_payments with (security_invoker = on) as
  select * from public.payments where household_id = 'HH-C3' or household_id like 'HH-C3-%';
create or replace view public.center3_accounts with (security_invoker = on) as
  select id, login_id, name, role, status, phone, profile, created_at, approved_by, approved_at, last_login_at, household_id from public.accounts where center_id = 'C3';

-- 확인용 (따로 실행):
--   select id, label, join_code, center_id, version, updated_at from public.households order by created_at;
--   select id, name, role, status, household_id from public.accounts where center_id = 'C1' order by created_at;
