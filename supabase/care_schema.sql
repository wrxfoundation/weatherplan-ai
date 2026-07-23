-- ============================================================
-- 시니어케어매니저 · Supabase 스키마 v1 (Leg 1 — 첫 매출 단계)
-- PRD v2 §5 케어 그래프 + 데모 events[] 계약(quote/weather/slots/booking) 정합.
-- 원칙:
--  · 건강 민감정보는 배정에 필요한 최소한(거동 수준 등)만 — 별도 동의 필드
--  · 대화·리포트가 돌봄 프로필(5토픽)로 축적되는 진화 루프의 저장층
--  · RLS: 업체는 자기 agency 행만, 보호자는 자기 가구 행만
--  · 결제(payments/settlements)는 마지막 단계에서 추가 (토스 연동 시)
-- ============================================================

create extension if not exists pgcrypto;

-- ── 조직·사람 ──────────────────────────────────────────────
create table if not exists agencies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  biz_no      text,
  license_no  text,              -- 유료직업소개사업 등록번호 (규제 확정 시)
  plan        text default 'trial',  -- trial | basic | pro
  created_at  timestamptz default now()
);

create table if not exists providers (        -- 케어매니저
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid references agencies(id),
  name        text not null,
  phone       text,
  certs       jsonb default '[]',   -- ["요양보호사","간호조무사"]
  areas       text[] default '{}',  -- 활동 지역(구 단위)
  specialty   text,
  vehicle     boolean default false,
  insured     boolean default false, -- 배상책임보험 (신뢰 인프라 — Papa 반면교사)
  insurance_expiry date,
  rating      numeric(2,1) default 0,
  done_count  int default 0,
  status      text default 'active', -- active | paused | offboarded
  created_at  timestamptz default now()
);

create table if not exists customers (        -- 보호자
  id          uuid primary key default gen_random_uuid(),
  name        text,
  phone       text,
  kakao_id    text,
  created_at  timestamptz default now()
);

create table if not exists care_recipients (  -- 돌봄 대상자 (어르신)
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid references customers(id),
  display_name  text,                -- '어머니' 등 호칭 — 실명 최소화
  birth_year    int,
  mobility      text,                -- walk | assisted | wheelchair
  origin_area   text,                -- 자택 지역(구 단위) — 2지점 컨디션용
  sensitive_consent_at timestamptz,  -- 민감정보 수집 동의 시각 (없으면 mobility 외 저장 금지)
  created_at    timestamptz default now()
);

-- ── 케어 그래프: 돌봄 프로필 (대화 누적 → 5토픽) ─────────────
-- wellbian '기억하기' 계승 · 케어 특화 스코프: 통증/진료예정/복약/거동/기분
create table if not exists care_profiles (
  recipient_id  uuid primary key references care_recipients(id),
  pain          jsonb default '{}',  -- {summary, updated_at, source_session}
  appointments  jsonb default '{}',
  medication    jsonb default '{}',
  mobility_note jsonb default '{}',
  mood          jsonb default '{}',
  preferences   jsonb default '{}',  -- 호칭·화제·선호 매니저 (치매 케어 규칙 연동)
  updated_at    timestamptz default now()
);

-- ── 대화 (진화 루프의 연료) ─────────────────────────────────
create table if not exists chat_sessions (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid references customers(id),
  recipient_id uuid references care_recipients(id),
  channel      text default 'web',   -- web | kakao | callcheck(안부콜)
  demo         boolean default false, -- 데모 트래픽 분리
  started_at   timestamptz default now(),
  ended_at     timestamptz,
  summary_5t   jsonb                 -- 세션 종료 시 5토픽 요약 (care_profiles로 병합)
);

create table if not exists chat_messages (
  id          bigint generated always as identity primary key,
  session_id  uuid references chat_sessions(id) on delete cascade,
  role        text not null check (role in ('user','assistant','tool')),
  content     text not null,
  model       text,                  -- 라우팅 관측 (claude-*)
  usage       jsonb,                 -- {input,output,cache_read}
  created_at  timestamptz default now()
);

-- ── 예약·수행 (events[] 계약의 영속층) ───────────────────────
create table if not exists bookings (
  id            text primary key,             -- 'BK-1364' — 데모 계약 유지, 실서비스 시퀀스 전환 여지
  session_id    uuid references chat_sessions(id),
  customer_id   uuid references customers(id),
  recipient_id  uuid references care_recipients(id),
  provider_id   uuid references providers(id),
  agency_id     uuid references agencies(id),
  service_type  text not null,                -- hospital | hospital_vehicle | home_care | dialysis
  manager_key   text,                         -- 데모 전환기 필드: mgr_01.. (providers 온보딩 후 provider_id로 이관)
  manager_name  text,
  hospital      text,
  origin_area   text,
  date_text     text,                         -- 자연어 날짜(챗봇 원문) — 확정 시 start_at 채움
  start_at      timestamptz,
  hours         numeric(3,1),
  price         int,
  platform_fee  int,
  status        text default 'confirmed',     -- confirmed | dispatched | in_service | done | cancelled | no_show
  outing        jsonb,                        -- {score,verdict,items,legs,...} 예약 시점 스냅샷
  checklist     jsonb,
  demo          boolean default false,
  created_at    timestamptz default now()
);
create index if not exists idx_bookings_agency_day on bookings (agency_id, created_at desc);

create table if not exists visit_reports (    -- 매니저 완료 리포트 = '가정 내 센서' (Papa 훔친 설계)
  id           uuid primary key default gen_random_uuid(),
  booking_id   text references bookings(id),
  provider_id  uuid references providers(id),
  checkin_at   timestamptz,
  checkout_at  timestamptz,
  fall_risk    text,     -- none | low | high  (낙상)
  med_check    text,     -- ok | missed | unknown (복약)
  mood_check   text,     -- good | flat | low   (기분)
  note         text,
  created_at   timestamptz default now()
);

create table if not exists outing_snapshots ( -- 케이웨더 판정 이력 (성과 대시보드 원료)
  id          bigint generated always as identity primary key,
  booking_id  text references bookings(id),
  location    text,
  score       int,
  verdict     text,
  payload     jsonb,
  created_at  timestamptz default now()
);

-- ── RLS (요지 — 실배포 시 auth.uid() 매핑 테이블과 함께 활성화) ──
-- alter table bookings enable row level security;
-- create policy agency_rw on bookings using (agency_id = auth_agency_id());
-- create policy customer_r on bookings for select using (customer_id = auth_customer_id());
-- chat_messages/care_profiles: 소유 고객·소속 업체 외 접근 불가. 민감 필드는 서비스롤 전용 뷰로만.

-- ── 시드 (데모 콘솔과 동일한 매니저 5명) ─────────────────────
insert into agencies (id, name, plan)
  values ('00000000-0000-0000-0000-00000000a9c7', '새벽케어 강남지점', 'pro')
  on conflict do nothing;
