# 🚀 Weather Plan AI — Claude Code 배포 프롬프트

이 파일 내용을 그대로 Claude Code에 붙여넣으세요.
Claude Code가 알아서 진행합니다. 중간에 **🙋 USER ACTION** 표시가 뜨면
서우님이 직접 해야 하는 단계입니다 (Vercel 로그인·API 키 입력 등).

---

## Claude Code에 붙여넣을 프롬프트 (아래 전체 복사)

```
당신은 Weather Plan AI v1.0 Beta를 Vercel에 배포하는 작업을 도와줍니다.

[프로젝트 컨텍스트]
- KWeather 디지털사업본부 B2B SaaS
- Next.js 14.2 + Tailwind + @anthropic-ai/sdk
- 당분간 weatherplan-ai.vercel.app 도메인만 사용 (커스텀 도메인 연결 X)
- 빌드 이미 검증 완료 (7개 라우트 + /api/claude serverless function 정상)

[현재 디렉터리 가정]
이 프로젝트 루트는 package.json·next.config.js·vercel.json이 모두 있는 폴더입니다.
`ls`로 확인 후 진행하세요.

[배포 단계 — 순서대로 진행]

## 1단계: 사전 점검
- `ls`로 package.json, next.config.js, vercel.json, pages/ 확인
- `node --version` 으로 Node 18.17 이상 확인
- `cat .gitignore | grep .env` 로 .env.local이 제외되는지 확인

## 2단계: Vercel CLI 설치
이미 설치되어 있는지 먼저 확인:
  `vercel --version`
없으면 설치:
  `npm i -g vercel`

## 3단계: 로컬 빌드 검증 (선택이지만 강력 권장)
  `npm install`
  `npm run build`
빌드 성공 시 .next/ 생성됨. 실패하면 거기서 중단하고 에러 보고.

## 4단계: Vercel 로그인 🙋 USER ACTION
  `vercel login`
브라우저가 열리거나 이메일 인증 코드를 요구합니다.
이 단계는 서우님이 직접 인증해야 하니, 명령만 실행하고 사용자에게
"브라우저에서 인증 완료하셨나요?" 라고 물어본 뒤 진행하세요.

## 5단계: 프로젝트 연결
  `vercel link`
대화형 프롬프트가 뜨면 다음과 같이 답:
- Set up "~/weatherplan-ai"? → Y
- Which scope? → 서우님 개인 또는 KWeather 팀 (사용자에게 물어볼 것)
- Link to existing project? → N (새로 만드는 경우) 또는 Y (이미 만든 경우)
- What's your project's name? → weatherplan-ai
- In which directory is your code located? → ./

성공하면 .vercel/project.json 생성됨.

## 6단계: 환경 변수 등록 🙋 USER ACTION
ANTHROPIC_API_KEY는 절대 코드/대화에 노출되면 안 됩니다.
사용자에게 다음 명령을 직접 실행하라고 안내:

  `vercel env add ANTHROPIC_API_KEY production`
  `vercel env add ANTHROPIC_API_KEY preview`
  `vercel env add ANTHROPIC_API_KEY development`

각 명령마다 sk-ant-api03-... 키 값을 직접 입력하라고 안내.
(선택) NEXT_PUBLIC_KAKAO_JS_KEY도 같은 방식으로 등록.

## 7단계: 프로덕션 배포
  `vercel --prod`
첫 배포는 빌드 포함 약 1~2분 소요.
출력 끝에 https://weatherplan-ai-xxxxxx.vercel.app 형식의 배포 URL이 뜨면 성공.
그리고 https://weatherplan-ai.vercel.app 이 자동으로 alias 잡힙니다.

## 8단계: 라우팅 점검
다음 5개 라우트가 모두 200 응답 떠야 정상:
  `curl -I https://weatherplan-ai.vercel.app/`
  `curl -I https://weatherplan-ai.vercel.app/onboarding`
  `curl -I https://weatherplan-ai.vercel.app/studio`
  `curl -I https://weatherplan-ai.vercel.app/dashboard`
  `curl -I https://weatherplan-ai.vercel.app/agency-board`

## 9단계: /api/claude 동작 검증 (Claude Opus 4.7 호출 확인)
  curl -X POST https://weatherplan-ai.vercel.app/api/claude \
    -H "Content-Type: application/json" \
    -H "Origin: https://weatherplan-ai.vercel.app" \
    -d '{
      "messages": [{"role":"user","content":"강남 카페예요. 장마 광고 어떻게?"}],
      "industry": "음료·외식",
      "persona": "1인 사장님·자영업",
      "model": "claude-opus-4-7"
    }'

기대 응답: { "content": "...", "usage": {...}, "model": "claude-opus-4-7-...", "stop_reason": "end_turn" }

에러 대응:
- 500 "API 인증 오류" → 6단계 환경 변수 미등록 or 7단계 재배포 필요
- 404 → 8단계에서 라우팅 다시 확인
- 403/CORS → Origin 헤더 확인 (위 curl처럼 명시 필수)

## 10단계: 마무리 보고
배포 URL, 5개 라우트 응답 코드, /api/claude 응답 일부를 정리해서 보고.

---

[중요 규칙]
- ANTHROPIC_API_KEY 값을 절대 출력/echo/cat 하지 말 것
- .env.local 파일을 git에 추가하지 말 것 (이미 .gitignore에 있음)
- 각 단계 명령 실행 전에 무엇을 할지 한 줄 설명, 실행 후 결과를 짧게 요약
- "🙋 USER ACTION" 단계에서는 반드시 사용자 확인 받고 진행
- 빌드 에러나 배포 실패 시 즉시 중단하고 사용자에게 보고

자, 1단계부터 시작하세요.
```

---

## 사용 방법

1. 이 프로젝트 zip 압축 풀기
2. 터미널에서 프로젝트 폴더로 이동
3. `claude` 명령으로 Claude Code 실행
4. 위 ```...``` 박스 안 프롬프트 전체 복사해서 붙여넣기
5. Claude Code가 진행하다 🙋 USER ACTION에서 멈추면 서우님이 직접 입력

---

## 손으로 직접 하실 단계 요약 (3개뿐)

| 단계 | 명령 | 비고 |
|---|---|---|
| 4 | `vercel login` | 브라우저/이메일 인증 |
| 6 | `vercel env add ANTHROPIC_API_KEY production` (×3 환경) | 키 직접 입력 |
| — | (자동) | 나머지는 Claude Code가 다 진행 |

---

## 배포 후 체크리스트

- [ ] https://weatherplan-ai.vercel.app/ 랜딩 정상
- [ ] /onboarding 3단계 등록 플로우 동작
- [ ] /studio 채팅 입력 시 Claude 응답 옴
- [ ] /agency-board 콘솔 로딩
- [ ] Vercel Dashboard → Analytics 활성화
- [ ] Vercel Dashboard → Logs에서 /api/claude 호출 로그 확인

배포 중 막히면 Claude Code 세션 끝나기 전에 캡처해서 가져오세요.
