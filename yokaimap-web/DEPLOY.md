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

`.env.example`에 전부 설명이 붙어 있다. 배포에 **반드시** 필요한 건 하나뿐이다.

| 변수 | 필요 | 미설정 시 동작 |
|---|---|---|
| `VITE_SITE_ORIGIN` | **필수** | `https://yokaimap.kr`로 굳는다 (아래 주의) |
| `VITE_VWORLD_KEY` | 권장 | 한글 기본도 없이 다크 타일만 |
| `VITE_CONTACT_EMAIL` | 권장 | B2B 문의 폼에 이메일 안내 미노출 |
| `KWEATHER_API_KEY` / `KWEATHER_API_BASE` | 선택 | 날씨 위젯이 `available:false`로 정직하게 비활성 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | 선택 | `/api/lead`가 접수 성공을 가장하지 않고 실패를 알림 |
| `VITE_ADSENSE_CLIENT` | **S3까지 비움** | 광고 슬롯이 아무것도 렌더하지 않음 |

> **광고는 지금 켜지 않는다.** `MONETIZATION.md` 기준 광고는 기저 시나리오 매출의 6%인데,
> 지자체·공공 납품(주력 라인)에서 기관 신뢰도를 깎는 대가가 그보다 크다. S3에서 판단한다.

### `VITE_SITE_ORIGIN` 주의 — 빌드 시점에 구워진다

이 값은 런타임 설정이 아니다. 프리렌더된 **156페이지의 canonical·og:url·JSON-LD와
sitemap.xml·llms.txt에 절대 URL로 박힌다.**

도메인을 나중에 붙이면 그 전에 만들어진 페이지들은 전부 틀린 canonical을 달고 있고,
이건 AEO/SEO에 직접 손해다. 순서를 지킨다.

1. 도메인을 먼저 정한다
2. `VITE_SITE_ORIGIN`에 그 도메인을 넣는다 (끝 슬래시 없이, `https://` 포함)
3. 그 다음에 배포한다

이미 배포한 뒤 도메인을 바꿨다면 **반드시 재배포**한다 (Deployments → Redeploy).
값이 맞는지는 배포 로그 마지막 줄에서 확인된다:

```
✅ AEO 자산 생성 — 프리렌더 156페이지 · sitemap · robots.txt · llms.txt (origin: https://…)
```

---

## 3. 도상 반입 (배포 전에)

이미지 121장은 아직 리포에 없다. **이 상태로 배포해도 화면은 깨지지 않고
한자 인장 폴백으로 정상 동작한다.** 다만 그림은 안 나온다.

생성 세션의 egress 정책이 CDN(cloudfront)을 403으로 막아서 거기서는 받을 수 없다.
받는 방법은 두 가지이고, **어느 쪽으로 배포하느냐에 따라 갈린다.**

### (a) GitHub에서 배포하는 경우

```
Actions 탭 → yokai-art → Run workflow
```

받으면서 표시 크기로 줄이고 WebP로 바꾼 뒤(장당 100KB 아래) 자동 커밋한다.
`jobs.json`이 바뀔 때도 자동으로 돈다.

### (b) zip으로 직접 배포하는 경우

**이때는 위 워크플로가 돌지 않는다.** 내 PC에서 직접 받아야 한다.

```bash
cd yokaimap-web
npm install
npm i --no-save sharp    # 축소·WebP 변환용. 이것만 별도로 받는다
node scripts/fetch-art.mjs
npm run build            # 반입 결과 확인 — "파일 반입 121/120"이 나와야 한다
```

`sharp`를 `package.json`에 넣지 않은 이유는, 넣으면 Vercel 빌드가 쓰지도 않을
네이티브 바이너리를 매번 설치하기 때문이다. 반입은 배포 전 1회성 작업이다.

받은 파일은 `public/img/`에 들어간다. 그대로 두고 배포하면 된다.

**생성 URL은 만료된다.** 403/404가 뜨면 프롬프트 문제가 아니라 URL이 죽은 것이고,
그때는 힉스필드에서 재생성해야 한다. 되도록 빨리 한 번 돌려 두는 게 좋다.

### 검수를 통과해야 화면에 나온다

빌드가 `data/art/jobs.json`에서 `art.status`를 계산한다. 지금은 **통과 10 / 대기 110**이라,
반입만 해서는 10장만 뜬다.

```bash
node scripts/review-art.mjs --list                    # 대기 목록 + 이미지 URL
node scripts/review-art.mjs --pass --category animal  # 분류 단위 통과
node scripts/review-art.mjs --pass --all              # 전부 통과
node scripts/review-art.mjs --reject kr-mireuk --reason "지장보살 턱받이"
npm run data                                          # 반영
```

검수 기준은 `docs/ART_REVIEW.md`. **왜색·중국풍 체크리스트를 먼저 본다.**

---

## 4. 도메인

`STRATEGY.md`의 후보 중 `yokaimap.kr`을 기본값으로 두고 있다.
Vercel → Settings → Domains에서 연결한 뒤, **2번의 `VITE_SITE_ORIGIN`을 같은 값으로
맞추고 재배포**한다.

---

## 5. 배포 후 확인

| 확인 | 방법 |
|---|---|
| 프리렌더 메타 | `curl -s <도메인>/yokai/dokkaebi \| grep -o '<title>[^<]*'` — 도깨비 제목이 나와야 한다 |
| canonical 도메인 | 같은 페이지에서 `rel="canonical"`이 실제 도메인인지 |
| sitemap | `<도메인>/sitemap.xml` — 156개 URL |
| AI 크롤러 허용 | `<도메인>/robots.txt` — GPTBot·ClaudeBot·PerplexityBot Allow |
| 오픈데이터셋 | `<도메인>/data/yokai.min.json` — CC BY 4.0 |
| 지도 타일 | `/map`에서 한글 기본도가 뜨는지 (안 뜨면 `VITE_VWORLD_KEY` 또는 vworld 도메인 등록 확인) |
| 날씨 | 미설정이면 위젯이 "제공 안 함"으로 뜨는 게 정상 — 가짜 값이 뜨면 안 된다 |

### vworld 키는 도메인 등록형이다

브라우저에 노출되는 키이고 Referer(도메인) 검증으로 보호된다.
**새 도메인을 붙였으면 vworld 콘솔에도 그 도메인을 등록해야** 타일이 나온다.
키만 넣고 등록을 안 하면 조용히 다크 타일로 떨어진다.
