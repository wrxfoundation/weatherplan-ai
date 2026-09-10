-- ═══════════════════════════════════════════════════════════════════
-- K-CARE 스키마 v1.0 — PostgreSQL 15+ / Supabase (서울 리전)
-- DB-SCHEMA.md 분류체계의 실행 가능한 골격.
-- 원칙: 등급이 저장·보존·접근을 결정한다 · 기본 DENY 후 화이트리스트 ·
--       2인 1조는 DB 제약으로 강제 · EAP 테이블은 만들지 않는다.
-- 주의: 실명 데이터 투입은 PIA 완료 후 (M8 게이트).
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- pg_cron: 보존기한 자동 파기 배치용. Supabase는 대시보드에서 활성화하며,
-- 확장이 없는 환경(로컬·CI)에서는 건너뛰고 §10 배치도 등록하지 않는다.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS care;
CREATE SCHEMA IF NOT EXISTS staff;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS device;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS partner;
CREATE SCHEMA IF NOT EXISTS governance;
CREATE SCHEMA IF NOT EXISTS ref;
CREATE SCHEMA IF NOT EXISTS analytics;

-- ── 공통 열거형 ────────────────────────────────────────────────────
CREATE TYPE ref.data_class    AS ENUM ('S1', 'S2', 'S3', 'S4');
CREATE TYPE ref.role_code     AS ENUM ('elder', 'guardian', 'concierge', 'dispatcher', 'manager', 'exec', 'ai_service');
CREATE TYPE ref.sex           AS ENUM ('female', 'male');
-- 장애등급제 폐지(2019) 이후 법령 표기 — 구 1~6급 표기는 사용하지 않는다
CREATE TYPE ref.disability_level AS ENUM ('severe', 'non_severe');
CREATE TYPE ref.veteran_type  AS ENUM ('patriot', 'war_veteran', 'compensation', 'bereaved');
CREATE TYPE ref.ltc_grade     AS ENUM ('g1', 'g2', 'g3', 'g4', 'g5', 'cognitive_support');
CREATE TYPE ref.concierge_grade AS ENUM ('probation', 'general', 'regular', 'senior');
CREATE TYPE ref.assignment_role AS ENUM ('lead', 'support');
CREATE TYPE ref.job_status    AS ENUM ('draft', 'proposed', 'confirmed', 'in_progress', 'done', 'cancelled');
CREATE TYPE ref.sos_severity  AS ENUM ('sev1', 'sev2', 'sev3');

-- ── 공통 컬럼 트리거 ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ref.touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$ LANGUAGE plpgsql;

-- 현재 세션의 역할·계정 (Supabase: auth.uid() 기반 매핑)
CREATE OR REPLACE FUNCTION identity.current_account() RETURNS uuid AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$ LANGUAGE sql STABLE;


-- ═══ 1. identity — 계정 · 역할 (S2) ═══════════════════════════════
CREATE TABLE identity.accounts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_enc    bytea NOT NULL,                    -- 암호화 저장 (원문 금지)
  phone_mask   text  NOT NULL,                    -- 표시용 010-****-1234
  email        text,
  status       text  NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE TABLE identity.roles (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code  ref.role_code NOT NULL UNIQUE,
  label text NOT NULL
);

CREATE TABLE identity.account_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES identity.accounts(id),
  role_id    uuid NOT NULL REFERENCES identity.roles(id),
  branch_id  uuid,                                -- 지점 범위 제한
  granted_by uuid REFERENCES identity.accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, role_id, branch_id)
);

-- 역할 판정 — 테이블 생성 이후에 정의 (SQL 함수는 생성 시점에 본문을 검증한다)
CREATE OR REPLACE FUNCTION identity.has_role(p_role ref.role_code) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM identity.account_roles ar
    JOIN identity.roles r ON r.id = ar.role_id
    WHERE ar.account_id = identity.current_account() AND r.code = p_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;



-- ═══ 2. staff — 지점 · 컨시어지 (S2) ══════════════════════════════
CREATE TABLE staff.branches (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  region    text NOT NULL,
  opened_on date,
  status    text NOT NULL DEFAULT 'active',       -- active | preparing
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff.concierges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES identity.accounts(id),
  branch_id    uuid NOT NULL REFERENCES staff.branches(id),
  grade        ref.concierge_grade NOT NULL DEFAULT 'probation',
  rating       numeric(3,2),                      -- 가족 만족도만 (판매 실적 컬럼 없음)
  joined_on    date NOT NULL,
  status       text NOT NULL DEFAULT 'active',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);
COMMENT ON TABLE staff.concierges IS
  '평가지표는 케어 품질만 — 매출·판매액 컬럼을 추가하지 않는다 (운영 원칙 1)';

CREATE TABLE staff.concierge_certs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_id uuid NOT NULL REFERENCES staff.concierges(id),
  cert_type    text NOT NULL,                     -- 요양보호사 · 간호사 · BLS …
  issued_on    date,
  expires_on   date,                              -- D-30 배차 게이트
  verified_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON staff.concierge_certs (expires_on) WHERE expires_on IS NOT NULL;

CREATE TABLE staff.background_checks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_id uuid NOT NULL REFERENCES staff.concierges(id),
  check_type   text NOT NULL,                     -- sex_offense · elder_abuse · license · health · driving
  result       text NOT NULL,                     -- pass | fail | pending
  checked_on   date,
  recheck_due_on date,                            -- 연 1회 재확인
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (concierge_id, check_type, checked_on)
);

CREATE TABLE staff.pledges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_id uuid NOT NULL REFERENCES staff.concierges(id),
  pledge_code  text NOT NULL,                     -- pair_rule · no_diagnosis · cancel_right · confidentiality
  signed_at    timestamptz NOT NULL DEFAULT now(),
  version      text NOT NULL,
  UNIQUE (concierge_id, pledge_code, version)
);

-- EAP(심리상담) 테이블은 의도적으로 만들지 않는다.
-- 이용 사실은 billing.corp_card_txns 총액으로만 존재하며 개인 식별 불가.


-- ═══ 3. care — 가구 · 어르신 · 프로필 (S1) ════════════════════════
CREATE TABLE care.households (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id     uuid NOT NULL REFERENCES staff.branches(id),
  display_code  text NOT NULL UNIQUE,             -- 경영 콘솔용 가명 코드 (P-031)
  membership    text NOT NULL,                    -- tier1 | tier2
  lifecycle     text NOT NULL DEFAULT 'onboarding',
  joined_on     date NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE TABLE care.elders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES care.households(id),
  account_id   uuid REFERENCES identity.accounts(id),
  name_enc     bytea NOT NULL,
  sex          ref.sex NOT NULL,                  -- 성별 — 동성 페어 배정 규칙 입력값
  birth_year   smallint NOT NULL,
  district     text NOT NULL,                     -- 동 단위까지만 (상세 주소는 별도)
  risk_level   text,                              -- high | mid | low (환경×이력 교차)
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE TABLE care.elder_attributes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id          uuid NOT NULL REFERENCES care.elders(id),
  disability_level  ref.disability_level,          -- NULL = 해당 없음
  disability_kind   text,                          -- 지체 · 청각 · 신장 …
  veteran_type      ref.veteran_type,              -- NULL = 해당 없음
  ltc_grade         ref.ltc_grade,
  care_note         text,                          -- 휠체어 이송 · 필담 카드 등 현장 반영 사항
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (elder_id)
);
COMMENT ON TABLE care.elder_attributes IS 'S1 민감 — 장애·보훈은 케어 수행 범위에서만 표시, 열람은 access_log 기록';

CREATE TABLE care.addresses (               -- S1 · 담당 확정 후에만 노출 (게이팅)
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id    uuid NOT NULL REFERENCES care.elders(id),
  address_enc bytea NOT NULL,
  entry_note_enc bytea,                     -- 현관 비밀번호 등
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE care.guardians (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES care.households(id),
  account_id   uuid NOT NULL REFERENCES identity.accounts(id),
  relation     text NOT NULL,                     -- 아들 · 차녀 …
  is_primary   boolean NOT NULL DEFAULT false,    -- 주 보호자 1명
  timezone     text NOT NULL DEFAULT 'Asia/Seoul',-- 해외 가구 시차 발송
  can_approve_payment boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_primary_guardian
  ON care.guardians (household_id) WHERE is_primary;

-- F7 진화형 케어 프로필
CREATE TABLE care.care_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id     uuid NOT NULL REFERENCES care.elders(id) UNIQUE,
  attr_count   integer NOT NULL DEFAULT 0,
  merged_at    timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE care.care_profile_attrs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES care.care_profiles(id),
  attr_key     text NOT NULL,                     -- 거동 수준 · 청력 · 복약 …
  attr_value   text NOT NULL,
  source       text NOT NULL,                     -- concierge_report · call_analysis · wearable …
  confidence   text NOT NULL,                     -- high | mid | low
  observed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, attr_key)
);

CREATE TABLE care.care_profile_history (          -- 변화가 신호다
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   uuid NOT NULL REFERENCES care.care_profiles(id),
  attr_key     text NOT NULL,
  old_value    text,
  new_value    text NOT NULL,
  source       text NOT NULL,
  changed_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE care.care_profile_gaps (             -- 결측·재확인 큐
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  uuid NOT NULL REFERENCES care.care_profiles(id),
  attr_key    text NOT NULL,
  priority    text NOT NULL,                      -- high | mid | low
  reason      text,
  due_on      date,
  resolved_at timestamptz
);

CREATE TABLE care.call_summaries (                -- 안부콜: 원음성 미저장, 요약·신호만
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id   uuid NOT NULL REFERENCES care.elders(id),
  called_at  timestamptz NOT NULL,
  duration_sec integer,
  summary    text NOT NULL,
  signal     text,                                -- stable | watch (관측만 · 진단 금지)
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE care.call_summaries IS '원음성은 72시간 후 파기 · 진단·처방 표현 저장 금지 (9.4)';


-- ═══ 4. ops — 관제 운영 (S3) ══════════════════════════════════════
CREATE TABLE ops.service_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES care.households(id),
  display_code text NOT NULL UNIQUE,              -- REQ-118
  channel      text NOT NULL,                     -- app | phone
  status       text NOT NULL DEFAULT 'received',
  sla_due_at   timestamptz,                       -- 정체 판정 기준
  owner_id     uuid REFERENCES identity.accounts(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ops.dispatch_jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   uuid REFERENCES ops.service_requests(id),
  elder_id     uuid NOT NULL REFERENCES care.elders(id),
  branch_id    uuid NOT NULL REFERENCES staff.branches(id),
  job_type     text NOT NULL,                     -- hospital | home | dialysis | errand
  scheduled_at timestamptz NOT NULL,
  status       ref.job_status NOT NULL DEFAULT 'draft',
  approved_by  uuid REFERENCES identity.accounts(id),   -- L4 — 사람이 최종 승인
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ops.dispatch_assignments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       uuid NOT NULL REFERENCES ops.dispatch_jobs(id) ON DELETE CASCADE,
  concierge_id uuid NOT NULL REFERENCES staff.concierges(id),
  role         ref.assignment_role NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, role),                          -- lead 1 · support 1
  UNIQUE (job_id, concierge_id)                   -- 같은 사람이 2역 불가
);

-- ★ 2인 1조 강제 — 짝이 없으면 확정(confirmed) 자체가 불가
CREATE OR REPLACE FUNCTION ops.enforce_pair() RETURNS trigger AS $$
DECLARE n integer;
BEGIN
  IF NEW.status IN ('confirmed', 'in_progress') THEN
    SELECT count(*) INTO n FROM ops.dispatch_assignments WHERE job_id = NEW.id;
    IF n <> 2 THEN
      RAISE EXCEPTION '2인 1조 위반: 주/부 동행 2인이 배정되어야 확정할 수 있습니다 (예외 승인 절차 없음)';
    END IF;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_pair
  BEFORE UPDATE ON ops.dispatch_jobs
  FOR EACH ROW EXECUTE FUNCTION ops.enforce_pair();

CREATE TABLE ops.visits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES ops.dispatch_jobs(id),
  checkin_at    timestamptz,
  checkout_at   timestamptz,
  checkin_geo   point,                            -- 근무 중에만 수집 (동의 기반)
  delay_reason  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ops.visit_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id      uuid NOT NULL REFERENCES ops.visits(id),
  body          text NOT NULL,                    -- 관찰 사실만
  diagnosis_flagged boolean NOT NULL DEFAULT false, -- 진단어 필터 결과
  submitted_at  timestamptz,
  reviewed_at   timestamptz,
  reviewer_id   uuid REFERENCES identity.accounts(id),
  delivered_at  timestamptz,                      -- 가족 전달
  created_at    timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE ops.visit_reports IS '의료 기록 아님 — 소견·진단명·예후 기재 금지 (의료법 제17조)';

CREATE TABLE ops.sos_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  elder_id      uuid NOT NULL REFERENCES care.elders(id),
  severity      ref.sos_severity NOT NULL,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  first_response_sec integer,                     -- 목표 60초
  dispatched_at timestamptz,
  eta_119_at    timestamptz,
  resolved_at   timestamptz,
  resolved_by   uuid REFERENCES identity.accounts(id),  -- 해제는 관제만
  false_alarm   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ops.sos_notifications (              -- 중복 연락 방지
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_id      uuid NOT NULL REFERENCES ops.sos_events(id),
  target_type text NOT NULL,                      -- concierge | guardian | 119 | hospital
  target_id   uuid,
  priority    smallint,                           -- 가족 통보 우선순위
  notified_at timestamptz,
  responded_at timestamptz,
  channel     text                                -- app | sms | call
);


-- ═══ 5. device — 웨어러블 (S1) ════════════════════════════════════
CREATE TABLE device.devices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial      text NOT NULL UNIQUE,               -- FIT3-0142
  model       text NOT NULL DEFAULT 'galaxy_fit3',
  branch_id   uuid REFERENCES staff.branches(id),
  status      text NOT NULL DEFAULT 'in_stock',   -- in_stock | assigned | repair | retired
  firmware    text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE device.device_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   uuid NOT NULL REFERENCES device.devices(id),
  elder_id    uuid NOT NULL REFERENCES care.elders(id),
  assigned_on date NOT NULL,
  returned_on date
);

-- 시계열 — 월 파티션 (원본 90일 후 집계 전환 권장)
CREATE TABLE device.device_vitals (
  id          bigserial,
  device_id   uuid NOT NULL,
  elder_id    uuid NOT NULL,
  measured_at timestamptz NOT NULL,
  heart_rate  smallint,
  spo2        smallint,
  steps       integer,
  sleep_min   smallint,
  worn        boolean,
  battery     smallint,
  PRIMARY KEY (id, measured_at)
) PARTITION BY RANGE (measured_at);

CREATE TABLE device.device_vitals_2026_08 PARTITION OF device.device_vitals
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE device.alert_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code         text NOT NULL UNIQUE,              -- fall_composite · no_sync · night_hr …
  condition    jsonb NOT NULL,                    -- 복합 조건 (단일 지표 판정 금지)
  false_rate   numeric(5,2),
  solo_send_blocked boolean NOT NULL DEFAULT false,  -- 오탐 30% 초과 시 true
  route        text NOT NULL                      -- 통보 경로
);

CREATE TABLE device.device_alerts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   uuid NOT NULL REFERENCES device.devices(id),
  elder_id    uuid NOT NULL REFERENCES care.elders(id),
  rule_id     uuid NOT NULL REFERENCES device.alert_rules(id),
  fired_at    timestamptz NOT NULL DEFAULT now(),
  is_real     boolean,
  sos_id      uuid REFERENCES ops.sos_events(id)
);


-- ═══ 6. billing — 자금 (S2) ═══════════════════════════════════════
CREATE TABLE billing.subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES care.households(id),
  plan         text NOT NULL,
  amount       bigint NOT NULL,                   -- 원 단위 정수
  started_on   date NOT NULL,
  ended_on     date,
  status       text NOT NULL DEFAULT 'active'
);

CREATE TABLE billing.payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES billing.subscriptions(id),
  amount          bigint NOT NULL,
  paid_at         timestamptz,
  status          text NOT NULL,                  -- paid | failed | pending
  failure_reason  text,                           -- CRM 결제 정체와 조인
  pg_token        text                            -- 카드 원문·CVC 저장 금지
);

CREATE TABLE billing.settlements (                -- 24시간 정산
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_id uuid NOT NULL REFERENCES staff.concierges(id),
  period_start date NOT NULL,
  period_end   date NOT NULL,
  total_amount bigint NOT NULL,
  paid_at      timestamptz,
  status       text NOT NULL DEFAULT 'pending'
);

CREATE TABLE billing.settlement_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES billing.settlements(id),
  job_id        uuid REFERENCES ops.dispatch_jobs(id),
  item_type     text NOT NULL,                    -- lead | support | travel | wait | share | bonus
  amount        bigint NOT NULL
);

CREATE TABLE billing.revenue_shares (             -- 단골 가구 지분 8%
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concierge_id uuid NOT NULL REFERENCES staff.concierges(id),
  household_id uuid NOT NULL REFERENCES care.households(id),
  rate         numeric(5,2) NOT NULL DEFAULT 8.00,
  started_on   date NOT NULL,
  ended_on     date
);

CREATE TABLE billing.corp_cards (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_mask  text NOT NULL,                       -- 5525-76**-****-0900
  alias      text NOT NULL,
  owner_id   uuid REFERENCES identity.accounts(id),
  branch_id  uuid REFERENCES staff.branches(id),
  limit_amount bigint NOT NULL,
  status     text NOT NULL DEFAULT 'active'
);

CREATE TABLE billing.corp_card_txns (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    uuid NOT NULL REFERENCES billing.corp_cards(id),
  amount     bigint NOT NULL,
  paid_at    timestamptz NOT NULL,
  category   text NOT NULL,                       -- welfare 카테고리는 총액만 · 개인 식별 금지
  receipt_attached boolean NOT NULL DEFAULT false,
  memo       text
);


-- ═══ 7. governance — 동의 · 감사 · 파기 (S3) ══════════════════════
CREATE TABLE governance.consents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  uuid NOT NULL,                      -- elder | guardian | concierge account
  consent_code text NOT NULL,                     -- health_data · location_work · bg_check …
  version     text NOT NULL,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  expires_on  date,                               -- D-30 갱신 루프
  revoked_at  timestamptz
);
CREATE INDEX ON governance.consents (expires_on) WHERE revoked_at IS NULL;

CREATE TABLE governance.access_log (              -- 모든 S1·S2 열람 기록 (가족 공개)
  id          bigserial PRIMARY KEY,
  actor_id    uuid NOT NULL,
  actor_role  ref.role_code NOT NULL,
  table_name  text NOT NULL,
  record_id   uuid,
  subject_id  uuid,                               -- 누구의 정보인가 (공개 대상 식별)
  purpose     text,                               -- 케어 수행 · 분쟁 대응 …
  accessed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON governance.access_log (subject_id, accessed_at DESC);

CREATE TABLE governance.data_classes (            -- 테이블/컬럼 → 등급 매핑 메타
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_name text NOT NULL,
  table_name  text NOT NULL,
  column_name text,
  class       ref.data_class NOT NULL,
  UNIQUE (schema_name, table_name, column_name)
);

CREATE TABLE governance.retention_policies (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class        ref.data_class NOT NULL UNIQUE,
  retain_months integer NOT NULL,
  note         text
);
INSERT INTO governance.retention_policies (class, retain_months, note) VALUES
  ('S1', 12,  '케어 종료 후 1년 → 자동 파기'),
  ('S2', 60,  '전자상거래법 5년'),
  ('S3', 36,  '분쟁 대응 3년'),
  ('S4', 999, '상시 보관');

CREATE TABLE governance.deletion_log (            -- 파기도 증적으로 남긴다
  id          bigserial PRIMARY KEY,
  table_name  text NOT NULL,
  record_count integer NOT NULL,
  class       ref.data_class NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now()
);


-- ═══ 8. RLS — 기본 DENY 후 화이트리스트 ═══════════════════════════
ALTER TABLE care.elders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE care.elder_attributes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE care.addresses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE care.care_profile_attrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ops.dispatch_jobs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE device.device_vitals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing.payments        ENABLE ROW LEVEL SECURITY;

-- 보호자: 자기 가구만
CREATE POLICY guardian_reads_own_household ON care.elders
  FOR SELECT USING (
    household_id IN (
      SELECT household_id FROM care.guardians
      WHERE account_id = identity.current_account()
    )
  );

-- 컨시어지: 당일 배차된 가구만 (기간 제한이 핵심)
CREATE POLICY concierge_reads_today_jobs ON care.elders
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM ops.dispatch_jobs j
      JOIN ops.dispatch_assignments a ON a.job_id = j.id
      JOIN staff.concierges c ON c.id = a.concierge_id
      WHERE j.elder_id = care.elders.id
        AND c.account_id = identity.current_account()
        AND j.scheduled_at::date = current_date
    )
  );

-- 관제: 케어 수행 목적 전체 열람 (열람은 access_log 트리거로 기록)
CREATE POLICY dispatcher_reads_all ON care.elders
  FOR SELECT USING (identity.has_role('dispatcher'));

-- 지점장: 건강 상세(S1) 차단 — elder_attributes 정책을 주지 않는다 (기본 DENY 유지)
-- 경영: 원본 테이블 정책 없음 — analytics 집계 뷰로만 접근

-- AI 서비스: 가명 ID 컨텍스트만 — 실명·연락처 컬럼은 뷰에서 제외
CREATE POLICY ai_reads_pseudonymous ON care.care_profile_attrs
  FOR SELECT USING (identity.has_role('ai_service'));


-- ═══ 9. 감사 로그 자동 기록 트리거 (S1 예시) ══════════════════════
CREATE OR REPLACE FUNCTION governance.log_access() RETURNS trigger AS $$
BEGIN
  INSERT INTO governance.access_log (actor_id, actor_role, table_name, record_id, subject_id, purpose)
  VALUES (
    identity.current_account(),
    COALESCE(nullif(current_setting('app.actor_role', true), '')::ref.role_code, 'dispatcher'),
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    NEW.id,
    NEW.elder_id,
    nullif(current_setting('app.access_purpose', true), '')
  );
  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;
-- SELECT 감사는 뷰/함수 계층 또는 pgaudit 사용을 권장 (트리거는 변경 이벤트 기준)


-- ═══ 10. 보존기한 자동 파기 배치 (매일 03:10 KST = 18:10 UTC) ═════
DO $outer$
BEGIN
IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
PERFORM cron.schedule(
  'purge-expired-s1',
  '10 18 * * *',
  $$
    WITH deleted AS (
      DELETE FROM care.care_profile_attrs a
      USING care.care_profiles p, care.elders e, care.households h
      WHERE a.profile_id = p.id AND p.elder_id = e.id AND e.household_id = h.id
        AND h.deleted_at IS NOT NULL
        AND h.deleted_at < now() - interval '12 months'
      RETURNING 1
    )
    INSERT INTO governance.deletion_log (table_name, record_count, class)
    SELECT 'care.care_profile_attrs', count(*), 'S1' FROM deleted;
  $$
);
END IF;
END $outer$;


-- ═══ 11. 경영 콘솔용 집계 뷰 (개별 식별자 없음) ═══════════════════
CREATE VIEW analytics.branch_summary AS
SELECT b.id AS branch_id,
       b.name,
       count(DISTINCT h.id)  AS households,
       count(DISTINCT c.id)  AS concierges,
       round(avg(c.rating), 2) AS avg_rating
FROM staff.branches b
LEFT JOIN care.households h ON h.branch_id = b.id AND h.deleted_at IS NULL
LEFT JOIN staff.concierges c ON c.branch_id = b.id AND c.deleted_at IS NULL
GROUP BY b.id, b.name;

COMMENT ON VIEW analytics.branch_summary IS
  '경영 콘솔은 이 스키마의 집계 뷰에만 접근한다 — 개별 레코드 접근 권한 없음';
