# 배포 — Vercel

한국요괴지도(`yokaimap-web`)는 이 리포의 **하위 디렉터리**에 있는 별도 앱이다.
리포 루트는 Weather Plan AI(Next.js)이므로, 두 앱은 Vercel 프로젝트를 따로 만든다.

---

## 1. 프로젝트 생성

Vercel → Add New → Project → 이 리포 선택.

| 항목 | 값 |
|---|---|
| **Root Directory** | **`yokaimap-web`** ← 이것부터 설정한다 |
| Framework Preset | Vite (`vercel.json`이 이미 지정) |
| Build Command | `npm run build` (기본값 그대로) |
| Output Directory | `dist` (기본값 그대로) |

**Root Directory를 안 바꾸면 루트의 Weather Plan AI가 빌드된다.** 나머지 설정은
`yokaimap-web/vercel.json`이 들고 있으므로 대시보드에서 건드릴 필요 없다 —
리전 `icn1`, SPA rewrite, `api/*.js` maxDuration 30초.

---

## 2. 환경변수

`.env.example`에 전부 설명이 붙어 있다. **첫 배포에는 하나도 없어도 된다.**

| 변수 | 필요 | 미설정 시 동작 |
|---|---|---|
| `VITE_SITE_ORIGIN` | 도메인 연결 후 | Vercel 프로덕션 주소를 자동으로 쓴다 (아래) |
| `VITE_VWORLD_KEY` | 권장 | 한글 기본도 없이 다크 타일만 |
| `VITE_CONTACT_EMAIL` | 권장 | B2B 문의 폼에 이메일 안내 미노출 |
| `KWEATHER_API_KEY` / `KWEATHER_API_BASE` | 선택 | 날씨 위젯이 `available:false`로 정직하게 비활성 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | 선택 | `/api/lead`가 접수 성공을 가장하지 않고 실패를 알림 |
| `VITE_ADSENSE_CLIENT` | **S3까지 비움** | 광고 슬롯이 아무것도 렌더하지 않음 |

> **광고는 지금 켜지 않는다.** `MONETIZATION.md` 기준 광고는 기저 시나리오 매출의 6%인데,
> 지자체·공공 납품(주력 라인)에서 기관 신뢰도를 깎는 대가가 그보다 크다. S3에서 판단한다.

### `VITE_SITE_ORIGIN` — 도메인 붙이기 전에는 안 넣어도 된다

이 값은 런타임 설정이 아니다. 프리렌더된 **157페이지의 canonical·og:url·JSON-LD와
sitemap.xml·llms.txt에 절대 URL로 박힌다.**

**도메인을 붙이기 전에는 비워 두는 것이 맞다.** 비어 있으면 빌드가 Vercel이 자동으로
넣어 주는 `VERCEL_PROJECT_PRODUCTION_URL`(= `<project>.vercel.app`)을 쓴다. 설정을
하나도 안 해도 canonical이 실제로 존재하는 주소를 가리킨다.

빌드 로그 마지막 줄에서 어떤 값이 쓰였는지 확인된다:

```
   origin: https://yokaimap.vercel.app  ← VERCEL_PROJECT_PRODUCTION_URL
```

실제 도메인을 연결한 뒤에는 `VITE_SITE_ORIGIN`에 그 도메인을 넣고(끝 슬래시 없이)
**재배포**한다. 이 값이 있으면 자동 감지보다 우선한다. 재배포를 빼먹으면 이전
페이지들이 `.vercel.app` canonical을 그대로 달고 있게 된다.

> `VERCEL_URL`은 배포마다 바뀌는 해시 주소라 canonical로 쓰면 안 된다.
> 그래서 프로덕션 별칭인 `VERCEL_PROJECT_PRODUCTION_URL`만 쓴다.

---

## 3. 도상 — 반입·검수 완료

**120체 전부 반입되어 리포에 있고(`public/img/`, 18MB), 검수도 전수 통과했다.**
추가 작업 없이 배포하면 도판이 그대로 뜬다.

원본은 2k PNG였지만 반입하면서 표시 크기로 줄이고 WebP로 바꿨다(장당 100~260KB).
그대로 커밋했다면 리포가 300MB를 넘었을 것이다.

### 다시 받아야 할 때만

도상을 재생성했다면 `data/art/jobs.json`을 갱신하고 기존 파일을 지운 뒤:

```
Actions 탭 → yokai-art → Run workflow
```

워크플로가 받아서 WebP로 바꾸고 자동 커밋한다. `jobs.json`이 바뀌면 자동으로도 돈다.
CDN 접근이 되는 로컬에서 직접 받으려면 `npm i --no-save sharp && node scripts/fetch-art.mjs`.

생성 URL의 파일명은 `hf_<YYYYMMDD>_<HHMMSS>_<job_id>.png`다. 날짜가 틀리면 403이 난다
(실제로 하드코딩된 날짜 때문에 11장이 전부 실패한 적이 있다).

### 검수 기록

빌드가 `data/art/jobs.json`에서 `art.status`를 계산한다. 시드의 값은 무시된다.

```bash
node scripts/review-art.mjs --list                    # 대기 목록 + 이미지 URL
node scripts/review-art.mjs --pass --all              # 전부 통과
node scripts/review-art.mjs --reject kr-mireuk --reason "지장보살 턱받이"
node scripts/contact-sheet.mjs                        # 분류별 검수용 격자 이미지
npm run data                                          # 반영
```

검수 기준은 `docs/ART_REVIEW.md`. **왜색·중국풍 체크리스트를 먼저 본다.**

---

## 4. 도메인

도메인을 붙이기 전에는 `<project>.vercel.app`으로 뜨고 canonical도 거기를 가리킨다.
그대로 두어도 정합성은 맞는다.

실제 도메인(`STRATEGY.md` 후보 중 `yokaimap.kr` 권장)을 붙일 때:

1. Vercel → Settings → Domains에서 연결
2. `VITE_SITE_ORIGIN`에 그 도메인을 넣는다 (끝 슬래시 없이, `https://` 포함)
3. **재배포** — 이걸 빼먹으면 이전 페이지가 `.vercel.app` canonical을 그대로 단다
4. vworld 콘솔에도 새 도메인을 등록한다 (아래 참고)

---

## 5. 배포 후 확인

| 확인 | 방법 |
|---|---|
| 프리렌더 메타 | `curl -s <도메인>/yokai/dokkaebi \| grep -o '<title>[^<]*'` — 도깨비 제목이 나와야 한다 |
| canonical 도메인 | 같은 페이지에서 `rel="canonical"`이 실제 도메인인지 |
| sitemap | `<도메인>/sitemap.xml` — 157개 URL |
| AI 크롤러 허용 | `<도메인>/robots.txt` — GPTBot·ClaudeBot·PerplexityBot Allow |
| 오픈데이터셋 | `<도메인>/data/yokai.min.json` — CC BY 4.0 |
| 지도 타일 | `/map`에서 한글 기본도가 뜨는지 (안 뜨면 `VITE_VWORLD_KEY` 또는 vworld 도메인 등록 확인) |
| 날씨 | 미설정이면 위젯이 "제공 안 함"으로 뜨는 게 정상 — 가짜 값이 뜨면 안 된다 |
| 도판 | 상세 페이지에 그림이 뜨는지 (안 뜨면 인장 폴백 — 파일 누락) |
| 탐사 | `/hunt`에서 위치 권한 요청이 뜨는지. 거부해도 화면이 깨지지 않아야 한다 |

### vworld 키는 도메인 등록형이다

브라우저에 노출되는 키이고 Referer(도메인) 검증으로 보호된다.
**새 도메인을 붙였으면 vworld 콘솔에도 그 도메인을 등록해야** 타일이 나온다.
키만 넣고 등록을 안 하면 조용히 다크 타일로 떨어진다.
