# Pick AI — AI 성적표

SEO · AEO · GEO · 확산 신호를 한 번에 진단하는 단일 서비스입니다.
URL 하나로 결정론 체크 39개 + AI 크롤러 13종 접근성 + 정밀 진단(LLM 심사, 베타 무료)을 받고,
이슈별 복붙 수정안과 "AI 명령서(.md)"까지 내려받을 수 있습니다.

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local   # ANTHROPIC_API_KEY 입력(선택)
npm run dev                        # http://localhost:3000
```

`ANTHROPIC_API_KEY`가 없어도 결정론 진단은 전부 동작합니다.
AI 총평과 정밀 진단(LLM 심사)만 비활성화됩니다.

## Vercel 배포

1. 이 폴더를 그대로 새 Vercel 프로젝트로 임포트 (또는 `npx vercel`)
2. Project Settings → Environment Variables 에 `ANTHROPIC_API_KEY` 등록
3. 끝 — `vercel.json`에 리전(icn1)과 함수 타임아웃이 이미 설정되어 있습니다

## 구조

| 경로 | 역할 |
|---|---|
| `lib/scorecardEngine.js` | 결정론 채점 엔진 (순수 함수 · 의존성 0 · 재현 가능) |
| `lib/netUtils.js` | SSRF 가드 · 타임아웃 페치 · 리다이렉트 추적 공용 유틸 |
| `pages/api/scorecard.js` | 무료 진단 수집기 (메인 페치 + robots/llms/sitemap/RSS/위키백과 병렬) |
| `pages/api/deep-scan.js` | 정밀 진단 — Opus 5(claude-opus-5) 고정 루브릭 LLM 심사 4항목 |
| `pages/api/insight.js` | AI 총평 (Opus 단발 호출) |
| `pages/index.jsx` | 전체 UI (진단 · 리포트 · 추이 · AI 명령서 내보내기) |
| `lib/scanner.js` | 스캔 파이프라인 공용 모듈 (scorecard·benchmark·cron 공유) |
| `lib/db.js` · `db/schema.sql` | Supabase 이력·벤치마크 저장 (선택) |
| `pages/api/history.js` | 점수 추이 + 벤치마크 백분위 |
| `pages/api/benchmark-run.js` | 벤치마크 축적 (ADMIN_TOKEN 보호) |
| `pages/api/cron-rescan.js` | 주간 자동 재진단 + 변동 알림 (Vercel Cron) |

## 이력·벤치마크 DB (선택 — Supabase)

1. Supabase 프로젝트 생성 → **SQL Editor**에 `db/schema.sql` 전체를 붙여넣고 Run
2. Vercel 환경변수에 `SUPABASE_URL`, `SUPABASE_ANON_KEY`(Project Settings > API) 등록 + Redeploy
3. 활성화되는 것: 진단마다 이력 자동 저장 → 같은 도메인 재진단 시 **점수 추이 스파크라인**,
   벤치마크 10곳 이상 축적 시 **자체 실측 백분위**("상위 N%") 표시

### 벤치마크 축적 (관리자)

`ADMIN_TOKEN` 환경변수 설정 후, 국내 기업 사이트를 하나씩 돌려 쌓습니다:

```bash
curl -X POST https://<도메인>/api/benchmark-run \
  -H "Content-Type: application/json" -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"url":"samsung.com","company":"삼성전자","industry":"전자·반도체"}'
```

## 주간 자동 재진단 + 변동 알림 (선택)

`vercel.json`의 cron이 **매주 월요일 09:00 KST**에 `/api/cron-rescan`을 호출합니다.

- `WATCH_HOSTS` — 감시할 호스트 쉼표 구분 (3~4개 권장, 함수 60초 한도)
- `CRON_SECRET` — 아무 랜덤 문자열 (Vercel이 cron 호출에 Bearer로 첨부 — 외부 호출 차단)
- `ALERT_WEBHOOK_URL` — Slack/Discord incoming webhook. |점수 변동|≥5, 등급 변화,
  도달성 변화 시 알림이 갑니다. DB가 있으면 이력도 자동 축적됩니다.

## 채점 원칙

- 결정론 전용 점수: 같은 입력이면 항상 같은 점수 (SEO 30% · AEO 30% · GEO 25% · 확산 15%)
- LLM 심사가 필요한 항목은 무료 점수에서 제외하고 정밀 진단에서 별도 점수로 표기 — FAIL로 위장하지 않음
- 치명적 체크(크롤 차단·noindex·도달 실패) FAIL 시 해당 영역 40점 상한
