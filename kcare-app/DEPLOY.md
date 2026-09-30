# K-CARE 베타 배포 가이드

새 GitHub 저장소에 올리고, 새 Vercel 프로젝트로 배포하고, 구글 로그인을 켜는 순서다.
처음부터 끝까지 한 번 따라 하면 30분 안팎이다.

> 준비: 회사 서비스용 구글 계정 하나로 **GitHub · Vercel · Google Cloud 콘솔**에 모두 로그인해 둔다.
> 키(비밀값)는 어떤 경우에도 저장소에 올리지 않는다 — Vercel 환경변수에만 넣는다.

---

## 1. GitHub 새 저장소에 올리기

1. GitHub → 오른쪽 위 `+` → **New repository**
   - 이름: `kcare-beta` (자유) · **Private** 선택
   - README · .gitignore · license 는 **추가하지 않는다** (빈 저장소로 만든다)
2. 받은 zip 을 풀면 `kcare-beta` 폴더가 나온다. 파일이 180개 가까이 되어 웹 화면 업로드보다
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
   나머지 화면은 모두 동작한다.
4. **Deploy** → 끝나면 주소가 나온다 (예: `https://kcare-beta.vercel.app`).
   이 주소를 아래에서 **<운영 주소>** 라고 부른다. 서버 위치는 `vercel.json` 이 서울(icn1)로 고정한다.

이후로는 GitHub 에 푸시할 때마다 Vercel 이 자동으로 다시 배포한다.

## 3. 구글 로그인 클라이언트 만들기 (Google Cloud 콘솔)

1. console.cloud.google.com → 위쪽 프로젝트 선택 → **새 프로젝트** → 이름 `kcare-beta` → 만들기
2. 왼쪽 메뉴 **API 및 서비스 → Google Auth Platform** (예전 이름: OAuth 동의 화면) → **시작하기**
   - **Branding**: 앱 이름 `K-CARE`, 사용자 지원 이메일 = 서비스 계정, 개발자 연락처 = 서비스 계정
   - **Audience**: 사용자 유형 **외부(External)**. 게시 상태는 **테스트(Testing)** 로 둔다.
     **Test users → ADD USERS** 에 베타에 들어올 구글 계정을 모두 넣는다.
     *여기 없는 계정은 로그인할 수 없다.* (테스트 단계 최대 100명)
   - **Data Access**: 추가하지 않는다 (기본 openid · email · profile 만 쓴다)
3. **Clients → CREATE CLIENT**
   - 애플리케이션 유형: **웹 애플리케이션** · 이름: `kcare-beta-web`
   - **승인된 JavaScript 원본**
     - `https://<운영 주소>`
     - `http://localhost:3100` (로컬 확인용)
   - **승인된 리디렉션 URI** — 한 글자라도 다르면 로그인이 실패한다
     - `https://<운영 주소>/api/auth/callback/google`
     - `http://localhost:3100/api/auth/callback/google`
4. 만들면 **클라이언트 ID** 와 **클라이언트 보안 비밀**이 나온다. 바로 다음 단계에 쓴다.

## 4. Vercel 에 환경변수 넣고 다시 배포

Vercel 프로젝트 → **Settings → Environment Variables** → Environment 는 **Production** 선택

| 이름 | 값 | 필수 |
|---|---|---|
| `GOOGLE_CLIENT_ID` | 3단계의 클라이언트 ID | 로그인 |
| `GOOGLE_CLIENT_SECRET` | 3단계의 클라이언트 보안 비밀 | 로그인 |
| `NEXTAUTH_SECRET` | 임의의 긴 난수 (아래 명령) | 로그인 |
| `NEXTAUTH_URL` | `https://<운영 주소>` (끝에 `/` 없이) | 로그인 |
| `BETA_REQUIRE_LOGIN` | `1` 이면 로그인해야 화면이 열린다 | 선택 |
| `BETA_ALLOWED_DOMAINS` | 회사 도메인만 허용 (예: `kcare.co.kr`) | 선택 |
| `BETA_ALLOWED_EMAILS` | 허용 계정 목록 (쉼표 구분) | 선택 |
| `ANTHROPIC_API_KEY` | AI 도우미 키 — 없으면 데모 답변 | 선택 |
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 토스 **테스트** 클라이언트 키 | 선택 |
| `TOSS_SECRET_KEY` | 토스 **테스트** 시크릿 키 | 선택 |

`NEXTAUTH_SECRET` 만들기 (Mac · Linux 터미널, 윈도우는 Git Bash):

```bash
openssl rand -base64 32
```

넣은 뒤 **Deployments → 가장 위 배포 → ⋯ → Redeploy**.
환경변수는 다시 배포해야 반영된다 (로그인 버튼이 켜질지는 빌드 때 정해진다).

## 5. 확인

1. `https://<운영 주소>/login` → **Google 계정으로 계속하기** → 테스트 사용자 계정으로 로그인
   → 이름과 이메일이 보이면 성공
2. 데모 홈 오른쪽 위에 이름이 뜬다 · 보호자 마이 탭 멤버십 카드에 '로그인 계정'이 뜬다
3. 가입 상담 첫 화면의 **Google로 시작** → 로그인 뒤 돌아오면 '✓ Google 계정 연결됨 · 이메일'
4. `BETA_REQUIRE_LOGIN=1` 을 켰다면: 시크릿 창에서 홈을 열면 로그인 화면으로 가야 한다

**자주 나는 문제**

| 증상 | 원인 · 해결 |
|---|---|
| `redirect_uri_mismatch` | 콘솔의 리디렉션 URI 와 `NEXTAUTH_URL` 이 다르다. https · 끝의 `/` · 오타 확인 |
| `access_denied` · "앱이 확인되지 않음" | 테스트 사용자에 없는 계정. 3단계 Audience 에서 추가 |
| 로그인 화면에 계속 '설정 전' | 환경변수 넣고 Redeploy 를 안 했거나, 로그인 값 4개 중 빠진 것이 있다 |
| "허용된 계정이 아닙니다" | `BETA_ALLOWED_DOMAINS` · `BETA_ALLOWED_EMAILS` 목록 밖의 계정 |
| 미리보기(Preview) 주소에서 로그인 실패 | 정상. 구글에는 운영 주소만 등록했다 |

## 6. 베타 잠금과 공개 화면

`BETA_REQUIRE_LOGIN=1` 이면 로그인해야 열린다. 다만 아래는 잠금 중에도 공개다.

- `/login` · 로그인 콜백
- `/service` — 대외 서비스 소개
- `/pay` · `/pay/result` — 결제 화면 (토스 심사 · 결제창 복귀)

토스페이먼츠 심사 기간에는 심사자가 가입 흐름까지 봐야 하므로 `BETA_REQUIRE_LOGIN` 을 비우고
재배포한다. Vercel 의 **Deployment Protection** 도 꺼져 있어야 심사자가 주소를 열 수 있다.

## 7. 도메인을 바꿀 때 (나중에)

Vercel **Settings → Domains** 에 도메인 추가 → Google 콘솔의 원본 · 리디렉션 URI 에 새 도메인 추가
→ `NEXTAUTH_URL` 을 새 도메인으로 → Redeploy.

## 8. 베타에서 알아 둘 제약

- **데이터는 각자 브라우저에만 저장된다.** 가입 상담 신청 · 결제 내역 · 영업자 모집 기록이 서버에
  쌓이지 않는다. 실제 고객 신청을 받기 전에 서버 저장(DB)을 붙여야 한다.
- **결제는 토스 테스트 키만** 넣는다. 주문 기록 서버 보관 · 취소 · 환불이 아직 없다 (`docs/toss-payments.md`).
- **실제 로그인은 구글만** 된다. 카카오 · 네이버 버튼은 연결 표시만 하는 데모다.
- **영업자 수당**은 수수료 제도 확정 전이라 금액을 표시하지 않는다 (`lib/sales.js`).
