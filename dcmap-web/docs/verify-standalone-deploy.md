# 웨더팩트 단독 배포 — 같은 코드베이스, 별도 도메인

원칙: 코드베이스는 dcmap-web 하나(컴포넌트·i18n·토큰·리드 공유), 구매자에게는
완전히 분리된 제품으로 노출. 분기는 `src/verify/standalone.js`의 `isWeatherFactHost()`.

## 동작 방식

| 모드 | 판별 | 라우트 | 셸 |
|---|---|---|---|
| dcmap (기본) | 기본값 | 전체 앱. `/verify`·`/verify/report`는 존재하되 GNB 미노출 | verify 계열만 자체 셸(VerifyShell), 나머지 dcmap TopBar/SiteFooter |
| 웨더팩트 단독 | `VITE_WEATHERFACT=1`(빌드) 또는 호스트명 `weatherfact.*`/`fact.*` | `/`=서비스, `/report`=리포트. 그 외 전부 `/`로 리다이렉트 | VerifyShell만 (dcmap 흔적 없음) |

## 별도 Vercel 프로젝트 세팅 (수동 1회)

1. Vercel에서 새 프로젝트 생성 → 같은 레포 연결, Root Directory `dcmap-web`
2. Build Command: `npm run build:weatherfact` · Output: `dist`
   (기본 `build`의 postbuild(프리렌더·sitemap)는 dcmap 도메인 전용이므로 사용하지 않음)
3. Environment Variables: `VITE_WEATHERFACT=1` (+ 필요 시 `VITE_LEAD_EMAIL`)
4. 도메인: `weatherfact.vercel.app` → 추후 `fact.kweather.co.kr` 류 연결
   (호스트명이 `weatherfact.*`/`fact.*` 패턴이면 env 없이도 단독 모드로 동작)

## 남은 일 (후속)

- [x] 단독 빌드 OG·타이틀·JSON-LD·noscript 치환 (vite 플러그인 weatherfact-html)
- [x] robots·sitemap 단독 생성 (scripts/postbuild-wf.mjs — `Disallow: /report`)
- [x] 파비콘 분기 (public/weatherfact.svg)
- [x] 관측 이력 실데이터: /api/kweather?kind=history (env `DATA_GO_KR_KEY` 필요 —
      공공데이터포털 'ASOS 일자료 조회서비스' 활용신청 후 키 등록)
- [ ] 도메인 확정 시: Vercel env `WF_ORIGIN=https://<도메인>` 교체 (기본 weatherfact.vercel.app)
- [ ] dcmap 쪽 노출 정책: 현재 GNB 미노출(직링크만 유효). 푸터 한 줄 소개 여부는 추후 판단

## 새 Vercel 프로젝트 env 정리

| 변수 | 용도 | 필수 |
|---|---|---|
| `VITE_WEATHERFACT=1` | 단독 모드(라우트·셸·브랜딩) | ✓ |
| `DATA_GO_KR_KEY` | ASOS 일자료(관측 이력) — 미설정 시 리포트는 '데이터 대기' | 데이터에 필수 |
| `WF_ORIGIN` | canonical·OG·sitemap 도메인 (기본 weatherfact.vercel.app) | 도메인 확정 시 |
| `VITE_LEAD_EMAIL` / `LEAD_WEBHOOK` | 문의 수신 (기존 dcmap과 동일 체계) | 권장 |
