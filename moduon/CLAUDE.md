# CLAUDE.md — moduon

세션마다 자동으로 읽히는 이 디렉터리의 규칙 팩. **매 턴 컨텍스트를 먹으므로 짧게 유지한다.**
축적된 교훈·안티패턴은 여기 복사하지 말고 `docs/DEV_REFLEXES.md` 한 곳에만 둔다.

## 이 디렉터리는 루트와 다른 앱이다
| | 루트 `/` | 여기 `moduon/` |
|---|---|---|
| 앱 | Weather Plan AI | 모두온 |
| 스택 | Next 14 (Pages Router) | Vite 6 · React 19 · react-router 7 |
| 빌드 | 루트에서 `npm run build` | **반드시 `cd moduon` 후 실행** |

루트에서 `npm run build`를 돌리면 엉뚱한 앱이 빌드된다. `.claude/hooks/guard.cjs`가 이걸 막는다.

## 명령
```
npm run qa            # 빌드 + 스모크 8종. 종료 0이면 커밋 가능 (합격 도장 .qa-pass 기록)
npm run qa -- --full  # 위 + 모비 페르소나 패널 · 퍼널 워크스루
npm run dev           # 개발 서버
```

## 어기면 안 되는 것
- **커밋 전 `npm run qa`** — 소스를 건드린 커밋은 통과본이어야 한다. 훅이 강제한다
- **zip 전달 전 시크릿 스캔** CLEAN 확인 (배포 토큰·API 키 패턴, docx·바이너리 제외).
  패턴 리터럴을 문서에 적으면 스캔이 자기 자신을 오탐하므로 여기 적지 않는다
- **Vercel 배포는 사용자 액션** — 이 컨테이너는 egress가 막혀 있다.
  변경 후 루틴: 커밋 → 푸시 → zip 전달 → 사용자가 로컬에서 `vercel --prod`
- **가격·수수료·사은품 숫자는 단일 소스** — `src/lib/engine.js` · `commission.js` · `rentals.js`.
  화면마다 다른 숫자가 나오면 안 된다
- **숨김 ≠ 삭제** — GNB·카테고리의 `hidden: true`는 노출만 끈다. 라우트와 페이지는 살아 있어야 하고,
  스모크가 직접 URL 접근으로 이를 검증한다

## 작업 흐름
요청 → (해석이 갈리면 `readchk`) → 구현 → **`npm run qa`** → 커밋 → 푸시 → zip 전달.
사이클이 끝나면 배운 것을 `docs/DEV_REFLEXES.md` 하단 로그에 적립한다 — 코드가 아니라 학습이 쌓이게.

> 상세한 반사신경 매핑과 실패 교훈 로그: `docs/DEV_REFLEXES.md`
> 수당 정책의 근거: `docs/COMMISSION_POLICY.md`
