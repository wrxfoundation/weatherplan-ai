# Vercel 배포 가이드 — KWeather 온체인 콘솔

SPA 라우팅(rewrite)과 `noindex` 헤더는 이 폴더의 `vercel.json`에 이미 설정되어 있습니다.

## 방법 A — Vercel 대시보드에서 Git 저장소 연결 (권장)
1. Vercel → Add New → Project → `weatherplan-ai` 저장소 선택
2. **Root Directory**를 `onchain-console`로 지정
3. Framework Preset: **Vite** (자동 감지) → Build `npm run build` / Output `dist`
4. Deploy — 이후 커밋마다 자동 배포

## 방법 B — CLI
```bash
cd onchain-console
npm install
npx vercel          # 프리뷰
npx vercel --prod   # 프로덕션
```

## 방법 C — 빌드 결과물만 배포 (드래그&드롭)
```bash
npm install && npm run build
```
`dist/` 폴더에 `vercel.json`을 복사한 뒤, Vercel 대시보드에 `dist` 폴더를 드래그&드롭.
(zip 패키지에는 빌드된 `dist/`가 포함되어 있으며 `dist/vercel.json`도 넣어두었습니다.)

## 주의
- 별도 환경변수 없음(현재 전 모듈 DEMO 모드, 정적 SPA).
- 루트 저장소의 `vercel.json`(Next.js 앱)과는 무관 — 이 폴더를 Root Directory로 지정해야 합니다.
- 라이브 모드(Phase 2)부터 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`가 필요합니다.
