# K-CARE 베타 배포 가이드

새 GitHub 저장소에 올리고 → 새 Vercel 프로젝트로 배포하고 → 테스트 계정 로그인을 켜고 →
Supabase 를 붙여 실제 저장을 켜는 순서다. 구글 로그인은 준비되는 대로 마지막에 켠다.

| 단계 | 하면 되는 것 | 걸리는 시간 |
|---|---|---|
| 1 · 2 | GitHub 에 올리고 Vercel 로 배포 — 데모(시뮬레이션)가 뜬다 | 15분 |
| 3 | 테스트 계정 로그인 켜기 — 환경변수 2개 | 5분 |
| 4 | Supabase 연결 — 테스트 계정의 기록이 서버에 쌓인다 | 15분 |
| 5 | 구글 로그인 (나중에) — 그 전까지 구글 버튼은 시뮬레이션 | 30분 |

> 준비: 회사 서비스용 구글 계정 하나로 **GitHub · Vercel · Supabase · Google Cloud 콘솔**에 모두 로그인해 둔다.
> 키(비밀값)는 어떤 경우에도 저장소에 올리지 않는다 — Vercel 환경변수에만 넣는다.

**데모와 테스트 계정의 차이**

| | 데모 (로그인 안 함) | 테스트 계정 (로그인) |
|---|---|---|
| 시작 데이터 | 시연용 목데이터 | 기록이 빈 상태 |
| 저장 위치 | 그 브라우저에만 | 서버 (Supabase) — 4단계 전에는 그 기기에만 |
| 다른 폰과 | 따로 논다 | 같은 가구의 세 계정이 몇 초 안에 같은 것을 본다 |

---

## 1. GitHub 새 저장소에 올리기

1. GitHub → 오른쪽 위 `+` → **New repository**
   - 이름: `kcare-beta` (자유) · **Private** 선택
   - README · .gitignore · license 는 **추가하지 않는다** (빈 저장소로 만든다)
2. 받은 zip 을 풀면 `kcare-beta` 폴더가 나온다. 파일이 180개가 넘어 웹 화면 업로드보다
   아래 두 방법 중 하나가 확실하다.

**방법 A — 터미널**

```bash
cd kcare-beta
git init -b main
git add .
git commit -m "K-CARE 베타 첫 업로드"
git remote add origin https://github.com/<계정이름>/kcare-beta.git
git push -u origin main
```

**방법 B — GitHub Desktop**

`File → Add local repository` → `kcare-beta` 폴더 선택 → `create a repository` →
`Publish repository` (Keep this code private 체크).

3. 올린 뒤 저장소의 **Actions** 탭에서 `ci` 가 초록색(린트 · 빌드 · 스모크 통과)인지 본다.
   처음 한 번은 5분쯤 걸린다.

## 2. Vercel 새 프로젝트로 배포

1. vercel.com → **Add New… → Project** → GitHub 연결 → `kcare-beta` 저장소 **Import**
2. 설정은 그대로 둔다
   - Framework Preset: **Next.js** (자동)
   - Root Directory: **비워 둔다** (`./`)
   - Build · Install 명령: 기본값
3. 환경변수는 **지금은 비워도 된다.** 비어 있으면 로그인 · 결제 · AI 가 '설정 전' 안내로 바뀌고
   나머지 화면은 데모로 모두 동작한다.
4. **Deploy** → 끝나면 주소가 나온다 (예: `https://kcare-beta.vercel.app`).
   이 주소를 아래에서 **<운영 주소>** 라고 부른다. 서버 위치는 `vercel.json` 이 서울(icn1)로 고정한다.

이후로는 GitHub 에 푸시할 때마다 Vercel 이 자동으로 다시 배포한다.

> **환경변수를 넣거나 바꾼 뒤에는 꼭 다시 배포한다** — Deployments → 가장 위 배포 → ⋯ → **Redeploy**.
> 로그인 버튼이 켜질지는 빌드 때 정해진다.

## 3. 테스트 계정 로그인 켜기

Vercel 프로젝트 → **Settings → Environment Variables** → Environment 는 **Production** 선택

| 이름 | 값 |
|---|---|
| `NEXTAUTH_SECRET` | 임의의 긴 난수 — 터미널에서 `openssl rand -base64 32` (윈도우는 Git Bash) |
| `BETA_TEST_PASSWORD` | 테스트 계정 세 개가 같이 쓰는 비밀번호 — **20자 이상 무작위**로 (비밀번호 생성기) |

넣고 **Redeploy** 하면 `<운영 주소>/login` 에 테스트 아이디 로그인이 뜬다.

**테스트 계정** — 셋이 **테스트 가구 1** 을 함께 쓴다 (목록은 `lib/test-accounts.js`)

| 아이디 | 역할 | 로그인하면 가는 곳 |
|---|---|---|
| `test-guardian` | 보호자 | `/family` |
| `test-elder` | 어르신 | `/elder` |
| `test-concierge` | 컨시어지 | `/concierge` |

- 비밀번호는 셋 다 `BETA_TEST_PASSWORD` 값이다. 테스트하는 사람에게 따로 전달한다.
  세 계정이 한 비밀번호를 같이 쓰고 로그인 시도 횟수 제한이 없으니 짧거나 추측 가능한 값은 쓰지 않는다.
  밖으로 샌 것 같으면 값을 바꾸고 Redeploy — 그 뒤로는 새 비밀번호로만 들어온다. 이미 로그인한 폰까지
  바로 내보내려면 `NEXTAUTH_SECRET` 도 새 값으로 바꾼다 (그대로 두면 로그인이 최대 7일 유지된다).
- 로그인 화면의 **Google 계정으로 계속하기**는 5단계 전까지 **시뮬레이션**이다 — 계정 선택 → 비밀번호 →
  정보 제공 동의 순서를 그대로 보여 주고, 실제로는 위 테스트 계정으로 들어간다
  (이메일 `guardian@kcare.test` 등 · 화면에 '시뮬레이션'이라고 표시된다).
- 이 단계에서는 기록이 **그 기기에만** 저장된다. 서버에 쌓으려면 4단계.

## 4. Supabase 연결 — 실제 저장

### 4-1. 프로젝트 만들기

1. supabase.com → **Start your project** → 서비스 계정으로 로그인 (Continue with GitHub 또는 이메일)
2. **New project**
   - Name: `kcare-beta`
   - Database Password: **Generate a password** → 안전한 곳에 보관 (앱에는 쓰지 않는다)
   - Region: **Northeast Asia (Seoul)** — Vercel 서버(서울)와 같은 곳
   - **Create new project** → 1~2분 기다린다

### 4-2. 표 만들기

1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 저장소의 [`supabase/schema.sql`](supabase/schema.sql) 내용을 전부 붙여 넣고 **Run**
   → `Success. No rows returned` 가 나오면 된다 (여러 번 돌려도 괜찮다)
3. 왼쪽 **Table Editor** 에 표 5개가 보이면 끝

| 표 | 쌓이는 것 |
|---|---|
| `households` | 가구의 앱 상태 전체 (요청 · 일정 · 주문 · 음성 · SOS …) — 세 계정이 같이 본다 |
| `activity` | 누가 · 언제 · 무엇을 — 한 줄씩 (예: `어르신 · 해주세요 요청 · 즉시 방문 요청`) |
| `signups` | 가입 상담 신청 (이름 · 지역 · 연락처 · 추천 영업자 코드 …) |
| `payments` | 토스 결제 승인 건 (금액은 토스 응답 기준) |
| `accounts` | 로그인한 계정 · 마지막 로그인 시각 |

모든 표는 **서버 비밀 키로만** 읽고 쓸 수 있게 잠겨 있다 (RLS · 브라우저용 키 권한 회수).

### 4-3. 값 두 개 복사

| 이름 | 어디서 |
|---|---|
| `SUPABASE_URL` | 대시보드 위쪽 **Connect** 버튼 → **Project URL** (`https://xxxx.supabase.co`) |
| `SUPABASE_SECRET_KEY` | **Project Settings → API Keys → Secret keys** 의 키 (`sb_secret_…`) · 없으면 **Create new API Keys** |

- 비밀 키는 **서버 전용**이다. `NEXT_PUBLIC_` 으로 시작하는 이름에 넣지 않는다.
- 예전 방식 키를 쓰고 싶으면 `SUPABASE_SERVICE_ROLE_KEY` 이름으로 service_role 키를 넣어도 된다
  (예전 키는 2026년 말까지만 동작한다고 Supabase 가 안내하고 있어 새 비밀 키를 권한다).

### 4-4. Vercel 에 넣고 다시 배포

3단계와 같은 곳에 `SUPABASE_URL` · `SUPABASE_SECRET_KEY` 를 넣고 **Redeploy**.

### 4-5. 확인

1. 브라우저로 `<운영 주소>/api/status` 를 연다 →
   `"db":{"configured":true,"ok":true,…}` 이면 연결됐다.
   - `"error":"schema-missing"` → 4-2 를 안 했다 (표가 없다)
   - `"error":"bad-key"` → 비밀 키가 틀렸다 (복사할 때 잘렸는지)
2. 로그인 화면 아래에 **● 서버 저장 연결됨** 이 보인다.
3. **폰 세 대로** — 폰1 `test-guardian`, 폰2 `test-elder`, 폰3 `test-concierge` 로 로그인
   - 어르신 폰 홈의 **도와줘요** → 몇 초 안에 보호자 폰 **해주세요** 탭에 '즉시 방문 요청'이 뜬다
   - Supabase **Table Editor → activity** 에 줄이 쌓인다
4. 보호자 폰 **마이** 탭 → 멤버십 카드의 **기록 저장**이 '서버에 저장 (Supabase)'
5. 사람이 직접 돌려 볼 시나리오 전체: [`docs/TEST-SCENARIOS.md`](docs/TEST-SCENARIOS.md)

**테스트 가구를 처음으로 되돌리기** — 시연 허브(`/`)에서 테스트 계정으로 로그인한 채
**↺ 테스트 가구 기록 비우기**. 활동 기록(activity)까지 지우려면 SQL Editor 에서
`delete from public.households where id = 'HH-TEST-01';`

## 5. 구글 로그인 켜기 (나중에)

### 5-1. Google Cloud 콘솔

1. console.cloud.google.com → 위쪽 프로젝트 선택 → **새 프로젝트** → 이름 `kcare-beta` → 만들기
2. 왼쪽 메뉴 **API 및 서비스 → Google Auth Platform** (예전 이름: OAuth 동의 화면) → **시작하기**
   - **Branding**: 앱 이름 `K-CARE`, 사용자 지원 이메일 = 서비스 계정, 개발자 연락처 = 서비스 계정
   - **Audience**: 사용자 유형 **외부(External)**. 게시 상태는 **테스트(Testing)** 로 둔다.
     **Test users → ADD USERS** 에 베타에 들어올 구글 계정을 모두 넣는다.
     *여기 없는 계정은 로그인할 수 없다.* (테스트 단계 최대 100명)
   - **Data Access**: 추가하지 않는다 (기본 openid · email · profile 만 쓴다)
3. **Clients → CREATE CLIENT**
   - 애플리케이션 유형: **웹 애플리케이션** · 이름: `kcare-beta-web`
   - **승인된 JavaScript 원본**: `https://<운영 주소>` · `http://localhost:3100` (로컬 확인용)
   - **승인된 리디렉션 URI** — 한 글자라도 다르면 로그인이 실패한다
     - `https://<운영 주소>/api/auth/callback/google`
     - `http://localhost:3100/api/auth/callback/google`
4. 만들면 **클라이언트 ID** 와 **클라이언트 보안 비밀**이 나온다.

### 5-2. Vercel 환경변수 → Redeploy

| 이름 | 값 |
|---|---|
| `GOOGLE_CLIENT_ID` | 5-1 의 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 5-1 의 클라이언트 보안 비밀 |
| `NEXTAUTH_URL` | `https://<운영 주소>` (끝에 `/` 없이) |

다시 배포하면 **Google 계정으로 계속하기**가 시뮬레이션 대신 실제 구글로 간다. 테스트 아이디 로그인은 그대로 남는다.

- 구글 계정으로 들어오면 이름 · 이메일은 확인되지만 **아직 가구에 연결되지 않아 데모로 본다.**
  실제 고객 계정과 가구를 잇는 것은 다음 작업이다.

## 6. 확인 · 자주 나는 문제

| 증상 | 원인 · 해결 |
|---|---|
| 로그인 화면이 '로그인이 아직 설정되지 않았습니다' | 3단계 두 값이 없거나 Redeploy 를 안 했다 |
| '아이디 또는 비밀번호가 맞지 않습니다' | 아이디 오타(`test-guardian` 등) · `BETA_TEST_PASSWORD` 값 확인 |
| '이 기기에만 저장 — 서버 저장 설정 전' | 4단계 두 값이 없거나 Redeploy 를 안 했다 |
| '서버 저장 오류 (schema-missing)' | 4-2 표 만들기를 안 했다 |
| 다른 폰에 안 뜬다 | 같은 가구(테스트 계정 셋)인지 · 로그인 화면의 '저장'이 서버인지. 만지고 있으면 4초, 2분 넘게 가만히 두면 10초마다 가져온다 |
| 화면 위에 주황 "저장이 안 되고 있어요" | 폰이 끊겼거나 Supabase 가 멈췄다(무료 플랜은 일주일 안 쓰면 일시정지 → 대시보드에서 Restore). 누른 것은 폰에 모아 두었다가 연결되면 한 번만 들어간다 |
| `redirect_uri_mismatch` | 콘솔의 리디렉션 URI 와 `NEXTAUTH_URL` 이 다르다. https · 끝의 `/` · 오타 확인 |
| `access_denied` · "앱이 확인되지 않음" | 테스트 사용자에 없는 구글 계정. 5-1 Audience 에서 추가 |
| "허용된 계정이 아닙니다" | `BETA_ALLOWED_DOMAINS` · `BETA_ALLOWED_EMAILS` 목록 밖의 구글 계정 |
| 미리보기(Preview) 주소에서 구글 로그인 실패 | 정상. 구글에는 운영 주소만 등록했다 |

## 7. 베타 잠금과 공개 화면

`BETA_REQUIRE_LOGIN=1` 이면 로그인(테스트 계정 또는 구글)해야 열린다. 다만 아래는 잠금 중에도 공개다.

- `/login` · `/login/google`(시뮬레이션) · 로그인 콜백 · `/api/status`
- `/service` — 대외 서비스 소개
- `/pay` · `/pay/result` — 결제 화면 (토스 심사 · 결제창 복귀)

구글 계정만 제한하려면 `BETA_ALLOWED_DOMAINS` (예: `kcare.co.kr`) · `BETA_ALLOWED_EMAILS` (쉼표 구분).
테스트 계정은 비밀번호를 통과했으므로 이 목록과 상관없이 들어온다.

토스페이먼츠 심사 기간에는 심사자가 가입 흐름까지 봐야 하므로 `BETA_REQUIRE_LOGIN` 을 비우고
재배포한다. Vercel 의 **Deployment Protection** 도 꺼져 있어야 심사자가 주소를 열 수 있다.

## 8. 도메인을 바꿀 때 (나중에)

Vercel **Settings → Domains** 에 도메인 추가 → Google 콘솔의 원본 · 리디렉션 URI 에 새 도메인 추가
→ `NEXTAUTH_URL` 을 새 도메인으로 → Redeploy.

## 9. 베타에서 알아 둘 제약

- **테스트 계정에는 실제 고객 개인정보를 넣지 않는다.** 이 저장소는 베타 확인용 최소 구성이고,
  실서비스 설계(`docs/DB-SCHEMA.md` · `docs/schema.sql` — 등급 · 보존기한 · 개인정보 영향평가 게이트)는 따로 있다.
- **서버에 쌓이는 것은 테스트 계정의 기록뿐이다.** 로그인하지 않은 데모와, 로그인 없이 들어온 가입 상담
  신청은 여전히 그 브라우저에만 남는다. 실제 고객 신청을 받으려면 공개 가입 저장을 따로 붙여야 한다.
- 가구 상태는 **통째로** 저장한다 (버전 번호로 두 폰의 동시 저장을 가려 낸다). 실서비스에서는
  요청 · 일정 · 주문을 각각의 표로 나눈다 (설계 초안 `docs/DB-SCHEMA.md`).
- 화면 속 어르신 건강 수치 · 복약 통계 · 담당 컨시어지 같은 값은 아직 **목데이터**다. 테스트 계정이
  만드는 것(요청 · 일정 · 음성 · 주문 · 결제 · SOS · 가입 신청)이 서버에 쌓인다.
- **결제는 토스 테스트 키만** 넣는다. 취소 · 환불 · 월 자동 청구가 아직 없다 (`docs/toss-payments.md`).
- **실제 로그인은 테스트 계정과 구글만** 된다. 카카오 · 네이버 버튼은 연결 표시만 하는 데모다.
- **영업자 수당**은 수수료 제도 확정 전이라 금액을 표시하지 않는다 (`lib/sales.js`).
