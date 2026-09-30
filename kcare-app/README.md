# K-CARE 베타

부모님 케어 멤버십 K-CARE 의 베타 웹앱이다. 어르신 · 보호자 · 컨시어지 · 영업자 · 관제 · 경영
여섯 역할의 화면이 하나의 Next.js 앱에 들어 있다.

- 배포 방법: **[DEPLOY.md](DEPLOY.md)** — GitHub · Vercel · 테스트 계정 로그인 · Supabase · 구글 로그인 순서
- 테스트 계정 시나리오 (폰 3대): **[docs/TEST-SCENARIOS.md](docs/TEST-SCENARIOS.md)**
- 기술: Next.js 14 (Pages Router) · React 18 · Tailwind CSS 3 · NextAuth 4 (테스트 계정 · 구글) ·
  Supabase (서버 저장) · 토스페이먼츠 SDK v2 · Leaflet · Anthropic SDK

**데모와 테스트 계정** — 로그인하지 않으면 데모(시뮬레이션)다: 목데이터로 시작하고 그 브라우저에만 저장된다.
테스트 계정(보호자 · 어르신 · 컨시어지, 한 가구 공유)으로 로그인하면 빈 기록으로 시작하고 Supabase 에
저장되며, 같은 가구의 다른 폰이 몇 초 안에 같은 것을 본다. 구글 로그인 설정 전에는 구글 버튼이 시뮬레이션이다.
- 서버 위치: Vercel 서울 리전 (`vercel.json`)

## 화면

| 역할 | 주소 | 내용 |
|---|---|---|
| 시연 허브 | `/` | 시연 동선 · 역할 바로가기 · 로그인 상태 |
| 로그인 | `/login` · `/login/google` | 테스트 아이디 · 구글 (구글 설정 전이면 시뮬레이션) · 저장 위치 표시 |
| 대외 소개 | `/service` | 서비스 · 요금 · 해지 · 환불 |
| 가입 상담 | `/onboarding` | 트랙 선택 · 가구 구성 · 지역 심사 · 결제권한 · 요금 · 구글로 시작 · 영업자 추천 코드 |
| 어르신 | `/elder` | 오늘 · 약 미션 · 해주세요 · 마음사서함 · 가족 · SOS |
| 보호자 | `/family` · `/family/calendar` · `/family/requests` · `/family/store` · `/family/my` · `/family/watch` · `/family/hospitals` | 오늘 어머니 · 공유 캘린더 · 해주세요 · 스토어 · 결제 관리 |
| 컨시어지 | `/concierge` · `/concierge-onboarding` · `/care-profile` · `/safety-check` | 오늘 · 고객 · 마음사서함 · 방문·리포트 · 제안 |
| 영업자 | `/sales` | 실적 · 수당(확정 전) · 모집 고객 · 초대 링크 |
| 관제 | `/dispatch` | 통합 알림 · SOS 대응 · 관제 기준 · 명부 · 방문 · 기기 · 감사 로그 (16개 메뉴) |
| 경영 | `/admin` | KPI · 가격 · 손익 · 리스크 |
| 결제 | `/pay` · `/pay/result` | 토스페이먼츠 결제위젯 · 자동결제 카드 등록 |
| 리포트 | `/report/verify` · `/report/care` · `/report/visit` · `/report/exec` | 고객에게 나가는 문서 |

## 로컬에서 실행

Node 20 이상.

```bash
npm install
cp .env.example .env.local   # 필요한 값만 채운다 · 비워도 실행된다
npm run dev                  # http://localhost:3100
```

## 품질 게이트

```bash
npm run verify    # 린트(경고 0) + 빌드
npm start &       # 운영 모드로 기동 (http://localhost:3100)
npm run smoke     # 24개 화면을 모바일·데스크톱으로 실제로 열어 검사
```

빌드는 렌더 시점 오류 · 빈 화면 · 접근성 회귀 · 터치 타깃 축소를 못 잡는다. 스모크가 그 그물이다.
GitHub Actions(`.github/workflows/ci.yml`)가 푸시마다 같은 것을 돌린다.

## 환경변수

전부 선택이다. 없으면 해당 기능이 '설정 전' 안내로 바뀌고 나머지 화면은 그대로 동작한다.
목록과 설명은 [`.env.example`](.env.example), 넣는 곳은 [DEPLOY.md 4단계](DEPLOY.md#4-vercel-에-환경변수-넣고-다시-배포).

| 기능 | 변수 |
|---|---|
| 테스트 계정 로그인 | `NEXTAUTH_SECRET` · `BETA_TEST_PASSWORD` |
| 서버 저장 (Supabase) | `SUPABASE_URL` · `SUPABASE_SECRET_KEY` — 표는 `supabase/schema.sql` |
| 구글 로그인 | `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `NEXTAUTH_URL` (+ `NEXTAUTH_SECRET`) |
| 베타 잠금 | `BETA_REQUIRE_LOGIN` · `BETA_ALLOWED_DOMAINS` · `BETA_ALLOWED_EMAILS` |
| AI 도우미 | `ANTHROPIC_API_KEY` |
| 결제 | `NEXT_PUBLIC_TOSS_CLIENT_KEY` · `TOSS_SECRET_KEY` |

키는 저장소에 올리지 않는다. `.env.local` 은 `.gitignore` 로 막혀 있다.

## 폴더

```
pages/          화면과 API (api/ai · api/auth · api/household · api/status · api/payments)
components/     공용 UI · 관제 콘솔(ops/) · 마음사서함 · 결제 시트
lib/            데이터 · 규칙 (가격 config.js · 영업 sales.js · 결제 payments.js · 로그인 auth*.js ·
                테스트 계정 test-accounts.js · 저장 state.js(화면) · db.js(서버) · 활동 기록 activity.js)
supabase/       schema.sql — 베타 서버 저장 표 (SQL Editor 에 붙여 넣고 Run)
middleware.js   베타 잠금 (BETA_REQUIRE_LOGIN=1 일 때만)
scripts/        smoke.mjs — 전 화면 스모크 검사
docs/           요구사항 · 회의록 · 디자인 핸드오프 · 결정 기록 · 실서비스 DB 설계 · 결제 연동
```

## 지켜 온 규칙

- **확정되지 않은 금액은 만들지 않는다.** '요금 확정 전' · '확인 중'으로 적는다 (`lib/config.js` 한 곳에서 관리).
- **빨강은 위험 신호 전용**이다 (SOS · 낙상). 가격 · 일반 경고에는 쓰지 않는다.
- **가족 화면에 관제 경과시간 · SLA 를 보이지 않는다.** SOS 때 가족 행동은 '확인했습니다' 하나.
- **영업자에게는 고객의 건강 · 위치 · 케어 기록을 보이지 않는다.** 이름 · 연락처도 일부만.
- **어르신 화면** 본문은 19px 이상, 버튼은 누르기 쉬운 크기를 유지한다.
- 자세한 도메인 규칙: `docs/design-handoff/01-domain-rules.md`

## 베타의 제약

- **서버에 쌓이는 것은 테스트 계정의 기록뿐이다** (Supabase · 가구 상태 통째 + 활동 기록 · 가입 신청 · 결제).
  데모와 로그인 없는 가입 상담 신청 · 영업자 모집 기록은 그 브라우저에만 남는다. 실제 고객을 받기 전에
  실서비스 설계(`docs/DB-SCHEMA.md` · `docs/schema.sql`)로 옮기고 공개 가입 저장을 붙여야 한다.
- 테스트 계정에는 실제 고객 개인정보를 넣지 않는다 (개인정보 영향평가 전).
- 화면 속 어르신 건강 수치 · 복약 통계 같은 값은 아직 목데이터다.
- 결제는 토스 **테스트 키**로만 운영한다. 주문 테이블 · 월 자동 청구 · 취소 · 환불이 남아 있다.
- 실제 로그인은 **테스트 계정과 구글만** 된다. 카카오 · 네이버는 연결 표시만 하는 데모다.
- 영업자 수당은 수수료 제도가 확정되면 `lib/sales.js` 의 `SALES_COMMISSION` 을 채워 켠다.
