# 부지 워치·알림 설계서 (v0 제안)

> 목적: "내 후보 부지/지역의 조건이 바뀌면 알려달라" — 재방문·구독(락인)의 핵심 해자.
> 상태: **설계 제안** (구현 전). Vercel Hobby 12함수 제한·무료 티어 내에서 동작하도록 설계.

## 1. 무엇을 감지해 알리나 (v0 범위)

| 이벤트 | 데이터 소스 | 감지 방법 |
|---|---|---|
| 시도 계통 공급여유 변동 | 한전 연계가능용량 (이미 앱에서 조회) | 일 1회 스냅샷 → 이전값과 diff |
| 신규 시설 추가/상태 변경 (착공·준공) | `dc_centers.json` (릴리스마다 갱신) | 배포 시점 diff — 커밋이 곧 이벤트 |
| DC 공급 승인율 갱신 | 전력계통영향평가 자료 (반기) | 데이터 파일 갱신 diff |
| 발전허가 신규 (2024+) | 허가 데이터 | 일 1회 diff |
| (v1) AIDC 대통령령 확정 | 수동 플래그 | 확정 시 전체 워처에게 1회 공지 |

정직성: **감지된 변화만** 알린다. 요약 문구는 diff 값 그대로(창작 없음).

## 2. 아키텍처 (Vercel Hobby + Supabase 무료)

```
[브라우저]                         [Vercel]                         [Supabase Free]
워치 등록 폼 ──POST /api/power?src=watch──▶ _watch.js ──insert──▶ watches (email, 대상, 조건)
                                                └─ Origin 화이트리스트·이메일 검증

[Vercel Cron 1회/일] ──▶ /api/status?cron=watch (기존 함수에 위임, 함수 수 불변)
    1. 소스 스냅샷 수집(계통 여유 등)
    2. snapshots 테이블의 전일값과 diff
    3. diff에 걸린 watches 조회 → 알림 큐 생성
    4. Resend API로 이메일 발송(무료 100통/일) → notifications에 발송 기록
```

- **함수 수 불변**: `_watch.js`(‘_’ 접두 = 미카운트)를 `power.js?src=watch`로 위임. 크론 엔트리도 기존 함수(`status.js`)에 쿼리 분기.
- **Vercel Cron**: Hobby는 cron 잡 2개·**일 1회 정밀도** → 일간 다이제스트 모델(실시간 아님을 UI에 명시).
- **Supabase Free**: 500MB DB·무제한 API 요청(rate 내) — watches/snapshots/notifications 3테이블이면 충분.
- **이메일**: Resend 무료(100통/일·3,000통/월). 초과 시 발송 보류 + 다음날 이월(정직하게 '지연' 표기).

## 3. 스키마 (Supabase)

```sql
create table watches (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  verified boolean default false,        -- 더블 옵트인(스팸 방지·신뢰)
  verify_token text,
  kind text not null,                    -- 'sido_headroom' | 'facility_status' | 'approval' | 'permit'
  target text not null,                  -- 시도명 or facility id or 'ALL'
  threshold jsonb,                       -- 예: {"drop_mw": 100} 여유 100MW 이상 감소 시
  created_at timestamptz default now(),
  unsubscribed_at timestamptz            -- 원클릭 해지(링크 토큰)
);

create table snapshots (
  day date not null,
  source text not null,                  -- 'kepco_headroom' | 'dc_centers' | ...
  payload jsonb not null,
  primary key (day, source)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  watch_id uuid references watches(id),
  sent_at timestamptz default now(),
  summary text not null                  -- 발송된 diff 요약(감사 로그)
);
```

## 4. 환경변수 (서버 전용 — 커밋 금지)

- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (RLS 우회 서비스 키 — `_watch.js`/크론만 사용)
- `RESEND_API_KEY`
- `WATCH_CRON_SECRET` (크론 엔드포인트 보호 — `Authorization: Bearer` 검증)

## 5. UI 진입점 (구현 시)

- SitePanel: “⚑ 이 지역 계통 여유 변동 알림 받기” (sido 자동)
- 시설 카드: “⚑ 이 시설 상태 변경 알림”
- /pricing: Pro 예고 기능으로 노출 — **유료화 1순위 후보**(알림 = 반복 가치)

## 6. 왜 이 설계인가

- **12함수 유지**: 신규 함수 0개(위임 2곳).
- **비용 0원 시작**: Supabase·Resend·Vercel Cron 전부 무료 티어.
- **정직성**: 일간 정밀도·발송 한도·추정 아님(실측 diff만)을 UI에 명시.
- **매각 관점**: 이메일 워처 목록 = 검증된 수요자 리스트(리드 자산) — 인수자에게 직접적 가치.

## 7. 구현 순서 (승인 시)

1. Supabase 프로젝트 생성 + 스키마 적용 (5분, 사용자 작업: 프로젝트 만들고 URL/서비스키를 Vercel env에)
2. `_watch.js` — 등록/해지/검증 핸들러 (+`power.js` 위임 1줄)
3. `status.js`에 `?cron=watch` 분기 + `vercel.json` crons 항목(스케줄만 추가 — region/maxDuration 불변)
4. Resend 발송 + 다이제스트 템플릿
5. UI 진입점 3곳 + 더블 옵트인 플로우
6. 헤드리스 검증 + 배포

예상 규모: 코드 ~400줄, 신규 함수 0, 무료 티어.
