# K-CARE 데이터베이스 분류체계 v1.0

> 백엔드 이관용 설계 문서. 현재 데모(`lib/mock.js` 219개 목 데이터 · localStorage)를
> 실서버(PostgreSQL / Supabase 서울 리전)로 옮길 때의 **도메인 분류 · 테이블 · 등급 · 접근 규칙**을 정의한다.
> 화면(관제 8메뉴 · 경영 11메뉴 · 가족/어르신/컨시어지 앱)이 요구하는 데이터를 빠짐없이 담되,
> **보안 섹션의 4등급 분류(S1~S4)와 접근 매트릭스를 스키마 레벨에서 강제**하는 것이 이 설계의 목적이다.

---

## 0. 설계 원칙 5가지

| 원칙 | 스키마에서의 구현 |
|---|---|
| ① 등급이 먼저다 | 모든 테이블에 데이터 등급(S1~S4)을 부여하고, 등급이 암호화·보존기한·RLS를 결정한다 |
| ② 사람과 기록을 분리 | 사람(`person`)은 한 곳에만 두고 역할(어르신·보호자·컨시어지)은 관계 테이블로 확장 |
| ③ 사건은 지우지 않는다 | 운영 기록(배차·리포트·SOS·감사)은 UPDATE 대신 **상태 전이 이력**으로 쌓는다 |
| ④ 모든 열람은 기록된다 | S1·S2 테이블 접근은 `governance.access_log`에 남기고 가족에게 공개 |
| ⑤ EAP는 저장하지 않는다 | 심리상담 이용 기록은 **테이블 자체를 만들지 않는다** (외부 기관에만 존재) |

---

## 1. 스키마(도메인) 분류 — 9개

| # | 스키마 | 담당 화면 | 주요 관심사 | 대표 등급 |
|---|---|---|---|---|
| 1 | `identity` | 전 역할 로그인 | 계정 · 역할 · 권한 · 세션 | S2 |
| 2 | `care` | 어르신 · 가족 앱 | 가구 · 어르신 · 보호자 · 케어 프로필(F7) | **S1** |
| 3 | `staff` | 경영 인원 관리 · 컨시어지 앱 | 컨시어지 · 지점 · 자격 · 교육 · 채용 | S2 |
| 4 | `ops` | 관제 전 메뉴 | 요청 · 배차 · 동행 · 리포트 · SOS | S3 |
| 5 | `device` | 관제 웨어러블 | 기기 자산 · 측정값 · 알림 규칙 | **S1** |
| 6 | `crm` | 경영 CRM · CS | 퍼널 · 라이프사이클 · 이탈 · NBA · VOC | S3 |
| 7 | `billing` | 경영 자금 흐름 | 구독 · 결제 · 정산 · 지분 · 법인카드 | S2 |
| 8 | `partner` | 관제 병원 · 경영 제휴 | 병원 · 보험 · 제휴사 | S3 |
| 9 | `governance` | 경영 보안·리스크 | 동의 · 감사 로그 · 데이터 분류 · 리스크 | S3 |

> 부가: `ref`(공통 코드·용어 사전·날씨 캐시 — S4), `analytics`(집계 뷰 · 경영 콘솔 전용 — 개별 식별자 없음)

---

## 2. 공통 규칙

### 2.1 명명
- 스키마·테이블·컬럼 전부 `snake_case`, 테이블은 **복수형**(`elders`, `dispatch_jobs`)
- 이력 테이블은 `_history`, 상태 전이는 `_events`, 매핑은 `a_b_map`
- Boolean은 `is_`/`has_` 접두, 시각은 `_at`, 날짜는 `_on`, 금액은 `_amount`

### 2.2 공통 컬럼 (전 테이블)
```
id            uuid        PK  (gen_random_uuid())
branch_id     uuid        FK  staff.branches   -- 다지점 격리 축
created_at    timestamptz NOT NULL DEFAULT now()
updated_at    timestamptz NOT NULL DEFAULT now()   -- 트리거 자동 갱신
created_by    uuid        FK  identity.accounts
deleted_at    timestamptz NULL                     -- 소프트 삭제(운영 기록은 물리 삭제 금지)
```
- **시간은 전부 `timestamptz`(UTC 저장)** — 해외 보호자(LA·시드니) 시차 처리는 표시 계층에서
- **금액은 `bigint`(원 단위 정수)** — 부동소수 금지. 비율은 `numeric(5,2)`
- **코드성 값은 PostgreSQL `enum` 또는 `ref.codes`** — 자유 문자열 금지

### 2.3 식별자 정책
- 외부 노출 ID는 UUID (순번 노출 시 규모·증가율이 새어나감)
- 경영 콘솔용 **가명 코드**(`P-031`, `REQ-118`)는 `display_code` 컬럼으로 별도 보관 — 경영은 이 코드만 본다

---

## 3. 도메인별 테이블

### 3.1 `identity` — 계정 · 권한 (S2)
| 테이블 | 설명 | 핵심 컬럼 |
|---|---|---|
| `accounts` | 로그인 주체 | `phone`(암호화), `email`, `status`, `last_login_at` |
| `roles` | 역할 마스터 | `code`(elder/guardian/concierge/dispatcher/manager/exec) |
| `account_roles` | 계정×역할(복수 가능) | `account_id`, `role_id`, `branch_id`, `granted_by` |
| `sessions` | 세션·디바이스 | `device_hash`, `ip_hash`, `expires_at` |
| `permission_overrides` | 예외 권한(승인 필수) | `scope`, `reason`, `approved_by`, `expires_at` |

> 지점장 권한 경계(평점 수정·단독 배차 예외·EAP 열람 불가)는 **RLS + 이 테이블에 없는 권한**으로 구현한다.

### 3.2 `care` — 가구 · 어르신 · 프로필 (**S1**)
| 테이블 | 설명 | 등급 |
|---|---|---|
| `households` | 가구(계약 단위) — 멤버십·상태·라이프사이클 스테이지 | S2 |
| `elders` | 어르신 — 성별·생년·거주 동·위험도 | **S1** |
| `elder_attributes` | 장애 정도 · 보훈 대상 · 장기요양등급 (법령 표기 고정) | **S1** |
| `guardians` | 보호자 — 관계·주/부·거주 시간대·열람 권한 | S2 |
| `household_members` | 가구×사람 매핑(주 보호자 1 · 부 보호자 N) | S2 |
| `care_profiles` | F7 진화형 프로필 헤더 — 누적 속성 수·최종 병합 시각 | **S1** |
| `care_profile_attrs` | 속성 1행 = 1속성 (`key`, `value`, `source`, `confidence`) | **S1** |
| `care_profile_history` | 속성 변화 타임라인 (보행→휠체어 등) | **S1** |
| `care_profile_gaps` | 결측·재확인 큐 (`priority`, `due_on`) | **S1** |
| `elder_preferences` | 호칭·선호 컨시어지·금기 사항 | S2 |
| `addresses` | 상세 주소 — **별도 테이블 + 담당 확정 시에만 노출**(게이팅) | **S1** |

> `elder_attributes.disability_level`은 enum `('severe','non_severe')` — 구 1~6급 표기 금지.
> `veteran_type`은 enum(`patriot`,`veteran_bereaved`,`compensation`,…), 감면·병원 이용에 영향.

### 3.3 `staff` — 컨시어지 · 지점 · 채용 (S2)
| 테이블 | 설명 |
|---|---|
| `branches` | 지점 — 권역·오픈일·상태(운영/준비) |
| `branch_managers` | 지점장 — 재직·팀 유지율·소리 응답 SLA |
| `concierges` | 컨시어지 — 등급(수습/일반/정규/시니어)·권역·평점 |
| `concierge_certs` | 자격증 — 종류·만료일·검증 상태 (만료 D-30 배차 게이트) |
| `background_checks` | 신원 검증 5종 — 성범죄·노인학대·자격 진위·건강진단·운전 |
| `trainings` / `training_records` | 교육 과정 · 이수 이력 (경계선 교육 미이수 → 배차 제외) |
| `pledges` | 케어 서약(2인1조·진단어 금지·취소 권한·비밀 유지) 전자 서명 |
| `applicants` / `hiring_stages` | 채용 파이프라인 — 단계·정체일수·탈락 사유 |
| `availability` | 가용 시간(요일×시간) — AI 배차 적합도 입력 |
| `fatigue_logs` | 누적 근무·피로도 상한(9.6h) — 상한 초과 시 자동 제외 |
| `coaching_logs` | 코칭 기록(징계 아님) |
| `disciplinary_actions` | 위반·징계 — 무면허 의료행위는 1회 계약 종료 |
| `voice_of_field` | 현장의 소리 — **익명 기본**, 평가 미반영 플래그 |

> **`eap_*` 테이블은 만들지 않는다.** 복지 이용은 `billing.corp_card_txns`에 총액으로만 남는다.

### 3.4 `ops` — 관제 운영 (S3)
| 테이블 | 설명 |
|---|---|
| `service_requests` | 보호자 요청 접수 — 핸드오프 1단계 |
| `dispatch_jobs` | 배차 건 — 일정·유형(동행/재택/투석)·상태 |
| `dispatch_assignments` | **주/부 2인 배정** — `role`(lead/support), 단독 배차 방지 제약 |
| `dispatch_proposals` | AI 배정안 — 적합도·근거·승인자(L4) |
| `visits` | 동행 수행 — GPS 체크인/아웃·지연 사유 |
| `visit_reports` | 리포트 — 관찰 사실만, 진단어 필터 결과 |
| `report_reviews` | 관제 검수 — 반려 사유·가족 전달 시각 |
| `sos_events` | SOS — 등급(SEV1~3)·1차 응답 초·해제자 |
| `sos_notifications` | 대응 인력·가족 통보 상태(중복 연락 방지) |
| `handoff_stalls` | 단계별 정체(SLA 초과) 뷰/집계 대상 |
| `comms_messages` | 발송 센터 — 채널·열람·응답 추적 |
| `tickers` | 실시간 접수 티커 = 감사 로그의 운영 뷰 |

**핵심 제약(DB 레벨)**
```sql
-- 2인 1조: 확정된 배차는 lead 1 + support 1 이 반드시 존재
ALTER TABLE ops.dispatch_jobs
  ADD CONSTRAINT dispatch_requires_pair
  CHECK (status <> 'confirmed' OR assignment_count = 2);
```

### 3.5 `device` — 웨어러블 (**S1**)
| 테이블 | 설명 |
|---|---|
| `devices` | 기기 자산 대장 — 시리얼·모델(Fit3)·배포일·상태 |
| `device_assignments` | 기기×어르신 배정 이력(반납·교체 포함) |
| `device_vitals` | 측정값 — 심박·SpO₂·활동·수면 (**시계열 · 파티션**) |
| `device_alerts` | 알림 — 복합 조건 발동·오탐 여부 |
| `alert_rules` | 규칙·임계값·오탐률 (30% 초과 시 단독 발송 금지 플래그) |
| `device_sync_status` | 5분 주기 동기화·무수집 감시 |

> `device_vitals`는 **월 단위 파티션 + 원본 90일 후 집계 전환** 권장(데이터 폭증 방지).
> 안부콜 원음성은 저장하지 않고 72시간 후 파기 — 텍스트 요약(`care.call_summaries`)만 남긴다.

### 3.6 `crm` — 고객 여정 (S3)
`funnel_stages` · `funnel_entries`(정체 추적) · `lifecycle_stages` · `churn_scores`(요인·가중치 공개) ·
`nba_queue` · `action_results`(Closed Loop) · `nps_responses` · `recovery_calls` · `cs_tickets` · `cs_topics`

### 3.7 `billing` — 자금 (S2)
`subscriptions` · `invoices` · `payments`(실패 사유 → CRM 결제 정체와 조인) · `payment_methods`(토큰만 저장, PAN 금지) ·
`settlements`(24시간 정산) · `settlement_items`(주/부 단가·수당) · `revenue_shares`(단골 가구 8%) ·
`ltc_claims`(공단 청구·환수 리스크) · `corp_cards` · `corp_card_txns`(증빙 첨부 상태) · `receivables`(미수)

> **카드번호 원문·CVC 저장 금지** — PG 토큰과 마스킹 표기(`5525-76**-****-0900`)만.

### 3.8 `partner` — 제휴 (S3)
`hospitals`(패스트트랙·과목) · `hospital_slots` · `partner_contracts`(**계약 유형: 광고·행정 용역 / 소개 대가 금지**) ·
`insurance_partners` · `partner_events`

### 3.9 `governance` — 신뢰 (S3, 일부 S1 메타)
| 테이블 | 설명 |
|---|---|
| `consents` | 동의 — 항목·버전·만료일(D-30 갱신 루프)·철회 |
| `consent_history` | 동의 변경 이력(철회 포함) — 삭제 불가 |
| `access_log` | **모든 S1·S2 열람 기록** — 누가·무엇을·언제·왜 |
| `data_classes` | 테이블/컬럼 → 등급(S1~S4) 매핑 메타 |
| `retention_policies` | 등급별 보존기한·파기 방식 |
| `deletion_log` | 파기 실행 기록(파기도 증적) |
| `risk_register` | 리스크 23건 — 등급·완화 상태·담당 |
| `compliance_calendar` | 규제 일정(PIA·유치업 등록·심의 갱신) |
| `incidents` | 침해·사고 — 72시간 신고 타임라인 |

---

## 4. 데이터 등급 ↔ 저장·보존·접근

| 등급 | 대상 | 저장 | 보존 | 열람 |
|---|---|---|---|---|
| **S1 민감(건강)** | `care.elder_attributes`, `care_profile_*`, `device_vitals`, 안부콜 분석, `addresses` | **컬럼 암호화(pgsodium/Vault) + 별도 키** | 케어 종료 후 **1년** → 자동 파기 | 담당(당일 배차)·관제·본인/가족 · **경영 불가** |
| **S2 식별(개인)** | `identity.accounts`, `elders` 기본, `guardians`, 결제수단 | 저장 암호화 + 표시 마스킹 | 종료 후 **5년**(전자상거래법) | 역할별 최소 권한 |
| **S3 운영(기록)** | `ops.*`, `crm.*`, `governance.access_log` | 표준 암호화(TLS 1.3 + at-rest) | **3년** — 분쟁 대응 | 관제·지점장·경영(집계) |
| **S4 공개(비개인)** | `ref.weather_*`, 정책 피드, 병원 공개 정보, 용어 사전 | 일반 | 상시 | 전 역할 |

**자동 파기** — `pg_cron`으로 야간 배치, `retention_policies` 기준으로 대상 선정 후 `deletion_log` 기록.

---

## 5. RLS(행 수준 보안) 설계 — 접근 매트릭스의 코드화

| 역할 | S1 건강 | S2 식별 | S3 운영 | EAP |
|---|---|---|---|---|
| 어르신 본인 | ● 본인 | ● 본인 | ◐ 본인 관련 | ✕ |
| 보호자(주) | ● 가구 | ● 가구 | ◐ 가구 | ✕ |
| 컨시어지 | ◐ **당일 배차 가구만** | ◐ 동일 | ◐ 동일 | ✕ |
| 관제 | ◐ 케어 목적 · 전 열람 기록 | ● | ● | ✕ |
| 지점장 | ✕ | ◐ 소속 지점 | ● 소속 지점 | ✕ |
| 경영 | ✕ | ✕ | ◐ **집계 뷰만** | ✕ |
| AI 서비스 | ◐ **가명 ID 컨텍스트만** | ✕ | ◐ | ✕ |

원칙: **모든 테이블 `ENABLE ROW LEVEL SECURITY` + 기본 DENY**, 정책은 화이트리스트로만 추가.
경영 콘솔은 원본 테이블 대신 `analytics.*` 집계 뷰에만 접근 권한을 준다.

---

## 6. 마이그레이션 순서 (실서버 전환 로드맵)

1. **M1 기반** — `identity`, `staff.branches`, `ref.codes`, `governance.data_classes/retention_policies`
2. **M2 사람** — `care.households/elders/guardians`, `staff.concierges` + 자격·서약
3. **M3 운영** — `ops.*` (요청→배차→동행→리포트→SOS) + 2인 1조 제약
4. **M4 기기** — `device.*` + 시계열 파티션
5. **M5 자금** — `billing.*` (PG 토큰 연동)
6. **M6 고객여정** — `crm.*`, `partner.*`
7. **M7 거버넌스** — `access_log` 트리거 · RLS 전면 적용 · `pg_cron` 파기 배치
8. **M8 검증** — PIA(개인정보 영향평가) 완료 후에야 **실명 데이터 투입**

> 전환 게이트: M7 완료 + PIA 통과 전에는 실명 데이터를 넣지 않는다(데모는 가상 인물 유지).

---

## 7. 데모 목 데이터 ↔ 테이블 매핑 (발췌)

| 데모 상수 | 이관 대상 |
|---|---|
| `ELDER_TAGS` | `care.elder_attributes` |
| `CRM_TIMELINE` | `care.care_profile_history` + `ops` 이벤트 조인 뷰 |
| `CP_ATTRS` / `CP_GAPS` | `care.care_profile_attrs` / `care_profile_gaps` |
| `JOBS` / `AI_ASSIGN` | `ops.dispatch_jobs` / `dispatch_proposals` |
| `HANDOFF_CHAIN` / `HANDOFF_STUCK` | `ops.handoff_stalls` (뷰) |
| `SOS_*` | `ops.sos_events` / `sos_notifications` |
| `WEAR_DEVICES` / `WATCH_BOARD` / `WEAR_RULES` | `device.devices` / `device_vitals` / `alert_rules` |
| `CRM_FUNNEL` / `CRM_STUCK` | `crm.funnel_stages` / `funnel_entries` |
| `HIRE_STUCK_STAGES` | `staff.hiring_stages` |
| `CASH_IN/OUT` · `CORP_CARDS` | `billing.*` |
| `CONSENTS` / `ACCESS_LOG` | `governance.consents` / `access_log` |
| `RISK_REGISTER` / `REG_CALENDAR` | `governance.risk_register` / `compliance_calendar` |
| `WEATHER_*` | `ref.weather_snapshots` (기상 API 캐시) |

---

## 8. 남은 결정 사항 (백엔드 착수 전)

1. **UUID vs BIGINT** — 외부 노출 UUID 권장, 내부 조인 성능 필요 시 하이브리드
2. **멀티테넌시 범위** — `branch_id` 단일 축으로 충분한지, 향후 프랜차이즈 시 `org_id` 추가 여부
3. **시계열 저장소** — `device_vitals`를 Postgres 파티션으로 갈지, TimescaleDB/별도 저장소로 뺄지
4. **암호화 방식** — Supabase Vault(pgsodium) vs 앱 레벨 암호화(키 관리 주체)
5. **감사 로그 보존** — 3년 후 콜드 스토리지 이관 여부(규제·분쟁 대응 관점)
