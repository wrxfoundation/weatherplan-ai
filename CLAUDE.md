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
└── api/claude.js       # Anthropic SDK proxy (Claude Opus 4.7 호출)
```

## Claude API 호출 규약
- 모델: `claude-opus-4-7` (기본값)
- 시스템 프롬프트: `pages/api/claude.js`의 `buildSystemPrompt()`에 정의
- AI 캐릭터: "wellbian AI" (Wellbian 자산 70% 재사용)
- CORS 화이트리스트: weatherplan.kweather.co.kr, weatherplan-ai.vercel.app, localhost:3000

## 절대 금지
- ANTHROPIC_API_KEY를 코드/로그/echo로 노출
- .env.local 파일을 git에 추가
- vercel.json의 region(`icn1`)·maxDuration(30s) 변경
- 시스템 프롬프트의 "케이웨더" 외 외부 출처(기상청·KMA·ECMWF) 언급 추가

## 배포 작업 시
`CLAUDE_CODE_DEPLOY.md` 파일의 단계를 따르세요.
