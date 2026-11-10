-- 상담 신청 표 (2026-11-06 랜딩 요청 5-4) — /consult 에서 로그인 없이 받는 가입 상담 신청.
-- 이미 schema.sql 을 실행한 프로젝트는 이 파일만 한 번 실행하면 된다 (여러 번 실행해도 된다).
-- 새 프로젝트는 schema.sql 에 같은 내용이 들어 있으니 따로 실행하지 않아도 된다.
--
-- 이름 · 연락처가 쌓이는 표다. 다른 표처럼 RLS 를 켜고 정책을 두지 않아 서버 비밀 키만 읽고 쓴다.
-- 관제가 '상담 종료'로 바꾸면 서버가 name · phone 을 지운다 (화면 약속: 상담이 끝나면 파기).
create table if not exists public.consults (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  name         text,                               -- 상담 종료 뒤에는 비운다
  phone        text,                               -- 숫자만 (01012345678) · 상담 종료 뒤에는 비운다
  who          text not null check (who in ('guardian', 'elder')),   -- 신청자 구분: 보호자 · 어르신 본인
  ref          text,                               -- 파트너 추천 코드 (링크 ?ref= 로 온 경우)
  status       text not null default 'new' check (status in ('new', 'contacted', 'done')),
  again_count  integer not null default 0,         -- 같은 연락처로 다시 신청한 횟수 (새 접수인 동안)
  again_at     timestamptz,
  handled_by   text,                               -- 처리한 관제
  handled_at   timestamptz
);
create index if not exists consults_created_idx on public.consults (created_at desc);
-- 같은 연락처 · 같은 신청자 구분의 '새 접수'는 한 줄만 — 겹친 접수 방지
create unique index if not exists consults_open_key on public.consults (phone, who) where status = 'new';

alter table public.consults enable row level security;
revoke all on table public.consults from anon, authenticated;

-- 확인용 (따로 실행):
--   select id, created_at, who, status, again_count, handled_by, handled_at from public.consults order by created_at desc limit 50;
