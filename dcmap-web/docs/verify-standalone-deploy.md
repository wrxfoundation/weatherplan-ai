# 웨더팩트 Vercel 배포 가이드 — 같은 코드베이스, 별도 도메인

원칙: 코드베이스는 dcmap-web 하나(컴포넌트·i18n·토큰·리드·서버리스 공유), 구매자에게는
완전히 분리된 제품으로 노출. `npm run build`가 env를 보고 자동 분기하므로
**vercel.json·빌드 커맨드는 건드릴 것 없음** — 새 프로젝트에 환경변수만 넣으면 된다.

## 배포 절차 (5분, 대시보드에서 1회)

1. https://vercel.com/new → 이 레포(`wrxfoundation/weatherplan-ai`) Import
2. **Root Directory: `dcmap-web`** (Edit 눌러 지정) — Framework/빌드 설정은 그대로 두기
   (vercel.json이 `npm run build`를 쓰고, 디스패처가 env로 웨더팩트 빌드로 분기)
3. Environment Variables에 아래 표 입력
4. Deploy → `https://<프로젝트명>.vercel.app` 확인
5. 도메인 확정 시: 프로젝트 Settings→Domains에 연결 + `WF_ORIGIN`만 그 도메인으로 교체 후 Redeploy

## 환경변수

| 변수 | 값 | 용도 | 필수 |
|---|---|---|---|
| `VITE_WEATHERFACT` | `1` | 단독 모드 전체(빌드 분기·라우트·셸·브랜딩) | ✓ |
| `DATA_GO_KR_KEY` | 공공데이터포털 인증키 | ASOS 관측 이력 → 리포트 실측 표. 미설정 시 '데이터 대기' | 데이터에 필수 |
| `WF_ORIGIN` | `https://<도메인>` | canonical·OG·sitemap (기본 weatherfact.vercel.app) | 도메인 확정 시 |
| `VITE_LEAD_EMAIL` | 문의 수신 이메일 | LeadDialog 수신처(기존 dcmap 체계와 동일) | 권장 |
| `LEAD_WEBHOOK` | 웹훅 URL | 문의 접수 웹훅(선택 — 없으면 mailto 폴백) | 선택 |

- `DATA_GO_KR_KEY`: 공공데이터포털(data.go.kr)에서 **"기상청_지상(종관, ASOS) 일자료 조회서비스"**
  활용신청(무료·자동승인) → 마이페이지 일반 인증키. Encoding/Decoding 키 모두 동작(코드가 판별).
- 케이웨더 보조 관측 레이어(참고 관측 병기)는 자체 관측망 과거 시계열 API 확인 후 추가 예정 —
  추가되면 `KWEATHER_API_KEY`를 이 프로젝트에도 등록.

## 동작 방식 (참고)

| 모드 | 판별 | 라우트 | 셸 |
|---|---|---|---|
| dcmap (기본) | env 미설정 | 전체 앱. `/verify`·`/verify/report`는 존재하되 GNB 미노출 | verify 계열만 자체 셸 |
| 웨더팩트 단독 | `VITE_WEATHERFACT=1` 또는 호스트 `weatherfact.*`/`fact.*` | `/`=서비스, `/report`=리포트, 그 외 리다이렉트 | VerifyShell만 (dcmap 흔적 0) |

빌드 분기: `npm run build` → `scripts/build-dispatch.mjs` → `build:dcmap`(프리렌더 81p+sitemap)
또는 `build:weatherfact`(브랜딩 치환 + WF robots/sitemap, `/report` Disallow).

## 완료된 것 / 남은 것

- [x] 단독 셸·라우트·브랜딩(타이틀·OG·JSON-LD·noscript·파비콘 `weatherfact.svg`)
- [x] 관측 이력 실데이터 프록시(`/api/kweather?kind=history`) + 리포트 실측 렌더
- [x] 빌드 자동 분기(빌드 커맨드 오버라이드 불필요)
- [ ] 도메인 확정 → `WF_ORIGIN` 교체
- [ ] 케이웨더 보조 관측 레이어(자체 관측망 과거 시계열 API 확인 후)
- [ ] dcmap 쪽 노출 정책(현재 GNB 미노출 유지)
