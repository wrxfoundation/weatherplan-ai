# CLAUDE.md — Weather Plan AI 프로젝트 컨텍스트

이 파일은 Claude Code가 세션 시작 시 자동으로 읽는 컨텍스트입니다.

## 프로젝트 개요
- **이름**: Weather Plan AI (v1.0 Beta)
- **소속**: KWeather 디지털사업본부
- **포지셔닝**: B2B 날씨 기반 광고 의사결정 SaaS (WeatherAds.io + Claude AI 진화 플랫폼)
- **운영 도메인 (당분간)**: weatherplan-ai.vercel.app
- **향후 도메인**: weatherplan.kweather.co.kr

## 기술 스택
- Next.js 14.2.18 (Pages Router)
- React 18.3
- Tailwind CSS 3.4 (Pretendard Variable + Noto Sans KR)
- @anthropic-ai/sdk 0.32.1
- Vercel (region: icn1)

## 디렉터리 구조
```
pages/
├── index.jsx           # 랜딩 (5,082 lines)
├── onboarding.jsx      # 3단계 등록
├── studio.jsx          # Claude 챗봇
├── dashboard.jsx       # MVP placeholder
├── agency-board.jsx    # 광고대행사 콘솔
└── api/claude.js       # Anthropic SDK proxy (복잡도 라우터 + 프롬프트 캐싱)
```

## Claude API 호출 규약
- 모델 라우터: 복잡 질의 `claude-opus-4-8` / 단순 질의 `claude-haiku-4-5-20251001`
- 최신 모델은 `temperature` 등 샘플링 파라미터를 받지 않음 (전송 시 400)
- 시스템 프롬프트: `pages/api/claude.js`
  - `STATIC_SYSTEM_PROMPT` — 정적 규칙. **프롬프트 캐시 대상이므로 동적 값(날짜·프로필·날씨) 인터폴레이션 절대 금지** (1바이트만 바뀌어도 캐시 전체 무효)
  - `buildDynamicContext()` — 동적 컨텍스트는 캐시 prefix 뒤 별도 블록으로
- 캐시 검증: 응답 `usage.cache_read_input_tokens`가 반복 요청에서 0이면 정적 블록 오염 의심
- AI 캐릭터: "wellbian AI" (Wellbian 자산 70% 재사용)
- CORS 화이트리스트: weatherplan.kweather.co.kr, weatherplan-ai.vercel.app, localhost:3000

## 절대 금지
- ANTHROPIC_API_KEY를 코드/로그/echo로 노출
- .env.local 파일을 git에 추가
- vercel.json의 region(`icn1`)·maxDuration(30s) 변경
- 시스템 프롬프트의 "케이웨더" 외 외부 출처(기상청·KMA·ECMWF) 언급 추가

## 배포 작업 시
`CLAUDE_CODE_DEPLOY.md` 파일의 단계를 따르세요.

## kcare-app 품질 게이트
```
cd kcare-app
npm run verify   # 린트(경고 0) + 빌드
npm start &      # 그 다음
npm run smoke    # 17개 화면 실제로 열어 검사
```
`next build`는 렌더 시점 오류·Tailwind 클래스 충돌·접근성 회귀를 못 잡습니다.
스모크가 그 그물입니다 — 화면이 비었는지, 콘솔 오류가 났는지, 랜드마크·버튼
이름·터치 타깃이 무너졌는지 확인합니다. CI(`.github/workflows/kcare-app.yml`)가
kcare-app 변경 시 같은 것을 돌립니다.
