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
├── public/                     # favicon 등
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
| `/api/claude` | `api/claude.js` | Claude API serverless proxy |

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
