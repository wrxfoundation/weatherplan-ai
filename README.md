# 🌧️ Weather Plan AI

**국내 최초·최대 날씨 기반 광고 의사결정 AI**
KWeather 디지털사업본부 B2B SaaS · v1.0 Beta

> 질문 한 줄로, 상품이 더 팔리는 광고. 글로벌 광고주가 10년 만들어온 공식을, 한국 시장에 맞게 더 정밀하게 다시 씁니다.

---

## 📦 프로젝트 구성

```
weatherplan-ai/
├── pages/
│   ├── _app.jsx                # 전역 스타일 + 메타데이터
│   ├── _document.jsx           # HTML head + Kakao SDK
│   ├── index.jsx               # 랜딩 페이지 (WeatherPlanAI)
│   ├── onboarding.jsx          # 3단계 사업장 등록
│   ├── studio.jsx              # Claude 챗봇 (18업종 × 5질문)
│   ├── dashboard.jsx           # 운영 대시보드 (MVP placeholder)
│   ├── agency-board.jsx        # 광고대행사 AE 콘솔 (8 광고주)
│   └── api/
│       └── claude.js           # Anthropic Claude API proxy
├── styles/
│   └── globals.css             # Tailwind + Pretendard
├── public/                     # favicon · og-image 등 정적 자산
│   └── reports/                # 정적 리포트 (Next 번들 밖 · 검색 색인 제외)
│       ├── geodnet.html        # GEODNET 해부 · DePIN 케이스 스터디
│       └── geodnet/            # └ report.css · report.js · vendor/chart.umd-4.4.1.min.js
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
└── .env.local.example
```

---

## 🚀 로컬 개발 환경

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일을 열어 실제 키 값으로 채워주세요:

- **`ANTHROPIC_API_KEY`** (필수) — https://console.anthropic.com/settings/keys
- **`NEXT_PUBLIC_KAKAO_JS_KEY`** (선택) — https://developers.kakao.com/console/app (광고대행사 카톡 공유용)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

---

## 🌐 Vercel 배포

### 옵션 1. Vercel CLI

```bash
npm i -g vercel
vercel login
vercel             # 미리보기 배포
vercel --prod      # 프로덕션 배포
```

배포 시 환경변수 입력 프롬프트가 나옵니다. 또는 Vercel Dashboard에서 등록.

### 옵션 2. Vercel Dashboard (GitHub 연동)

1. GitHub에 이 프로젝트를 푸시
2. https://vercel.com/new 에서 GitHub 저장소 import
3. Framework Preset: **Next.js** (자동 감지)
4. **Environment Variables**에 다음 등록:
   - `ANTHROPIC_API_KEY` = `sk-ant-api03-...`
   - `NEXT_PUBLIC_KAKAO_JS_KEY` = (선택)
5. Deploy 클릭

### 옵션 3. 도메인 연결 (`weatherplan.kweather.co.kr`)

1. Vercel Project > Settings > Domains
2. `weatherplan.kweather.co.kr` 입력
3. KWeather DNS에 다음 CNAME 레코드 추가:
   ```
   weatherplan.kweather.co.kr CNAME cname.vercel-dns.com
   ```
4. SSL 자동 발급 (Let's Encrypt)

---

## 🔑 환경변수

| 키 | 필수 | 용도 |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude API 호출 (Studio · AgencyBoard 챗봇) |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 선택 | AgencyBoard 일간 보고 카톡 공유 SDK |
| `NODE_ENV` | 자동 | Vercel이 자동 주입 (production / development) |

---

## 📄 페이지 라우팅

| URL | 컴포넌트 | 설명 |
|---|---|---|
| `/` | `index.jsx` | 랜딩 페이지 (Hero, 18업종 스튜디오, 글로벌 사례, 가격, 한국 지도) |
| `/onboarding` | `onboarding.jsx` | 3단계 사업장 등록 + 첫 추천 결과 |
| `/studio` | `studio.jsx` | 자유 챗봇 (Claude Opus 4.7 실연동) |
| `/dashboard` | `dashboard.jsx` | 등록 완료 후 환영 카드 + 로드맵 |
| `/agency-board` | `agency-board.jsx` | 광고대행사 AE 다중 광고주 콘솔 |
| `/reports/geodnet` | `public/reports/geodnet.html` | GEODNET 해부 · DePIN 케이스 스터디 (정적 · noindex) |
| `/api/claude` | `api/claude.js` | Claude API serverless proxy |

---

## 📊 정적 리포트 (`public/reports/`)

React 없이 그 자체로 완결된 분석 문서를 두는 자리입니다. Next 번들과 완전히 분리돼
있어서 앱 빌드 시간·First Load JS에 영향을 주지 않습니다.

| 리포트 | URL | 내용 |
|---|---|---|
| GEODNET 해부 | `/reports/geodnet` | DePIN 토크노믹스 케이스 스터디 — 회수 코호트 · 언락 대비 소각 · 배분 비교 (웰비안 결정용) |

**구조 규약** — 리포트 하나당 HTML 1개 + 같은 이름의 자산 폴더 1개.

```
public/reports/
├── geodnet.html          # 마크업 + <head> 메타
└── geodnet/
    ├── report.css        # 스타일 (라이트/다크 토큰)
    ├── report.js         # 데이터 + 차트 렌더러 (외부 fetch 없음)
    └── vendor/
        └── chart.umd-4.4.1.min.js   # Chart.js 4.4.1 (MIT)
```

자산은 `geodnet/report.css` 처럼 **상대 경로**로 참조합니다. HTML이 `public/reports/`
바로 아래 있으므로 `/reports/geodnet`(리라이트) · `/reports/geodnet.html` · 로컬
`file://` 어느 쪽으로 열어도 같은 경로로 풀립니다.

**색인 차단은 3중** — 문서의 `<meta name="robots">`, `public/robots.txt`의
`Disallow: /reports/`, `vercel.json`의 `X-Robots-Tag`. 내부 검토용 문서라 검색에
잡히면 안 되지만, **URL을 아는 사람은 누구나 볼 수 있습니다.** 접근 자체를 막아야 하면
Vercel Project → Settings → Deployment Protection 을 켜세요.

**리포트 추가 방법**
1. `public/reports/<이름>.html` 과 `public/reports/<이름>/` 을 위 구조대로 만든다
2. `next.config.js` 의 `rewrites()` 에 `{ source: "/reports/<이름>", destination: "/reports/<이름>.html" }` 추가
3. 벤더 라이브러리는 파일명에 버전을 박는다 (`vercel.json` 이 `vendor/` 를 1년 immutable 캐싱하므로 버전이 바뀌면 URL도 바뀌어야 함)

---

## 🎨 디자인 시스템

- **폰트**: Pretendard Variable + Noto Sans KR (한글), system-ui (영문)
- **색상**: 라이트 모드 · Canvas `#FFFFFF` + Surface `#F7F5EE` + Ink `#050038`
- **브랜드**: Teal `#4EB3A8` + MossDark `#14443B`
- **스타일**: Glassmorphism · Apple Liquid Glass · 1px hairline · Inset highlight 버튼

---

## 🔍 검증 (배포 전 체크)

```bash
# 빌드 테스트
npm run build

# 빌드 성공 확인 후 실제 시작 테스트
npm start
```

빌드 에러가 없고 모든 페이지가 정상 라우팅되면 배포 가능.

---

## 📞 연락처

**KWeather 디지털사업본부 · Weather Plan AI**
- 이메일: weatherplan@kweather.co.kr
- 웹: https://weatherplan.kweather.co.kr

---

© 2026 KWeather. All rights reserved.
