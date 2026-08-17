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

## 방법 C — 빌드 결과물만 배포 (zip · 드래그&드롭)
```bash
npm run package:zip     # 빌드 + dist/vercel.json 주입 + zip 생성
```
zip 안에는 빌드 결과물과 **정적 배포용 `vercel.json`**(`vercel.static.json` 사본)이 들어 있습니다.
이 파일이 `framework: null` / `buildCommand: echo skip-build` / `outputDirectory: "."`를 지정하므로,
Vercel이 소스가 없는 업로드에 빌드를 시도하지 않습니다.

### `Error: Command "vite build" exited with 127` (vite: command not found)
이미 만들어진 프로젝트에 zip을 올렸을 때, 프로젝트에 저장된 **Vite 프리셋**이 그대로 적용돼
소스도 `node_modules`도 없는 업로드에 `vite build`를 실행해서 나는 오류입니다. 둘 중 하나로 해결합니다.

1. **위 zip을 다시 올린다** — 포함된 `vercel.json`이 대시보드 설정을 덮어씁니다(권장).
2. 또는 Vercel → Project → **Settings → Build and Deployment**에서
   Framework Preset을 **Other**로, Build Command·Install Command **Override를 끄거나 빈 값**으로,
   Output Directory를 **`.`** 로 바꿉니다.

> 실패한 배포의 빌드 캐시가 남아 있으면 Redeploy 시 **Use existing Build Cache를 해제**하세요.

빌드까지 Vercel에 맡기려면 방법 C가 아니라 **방법 A(Git 연결)** 를 쓰는 편이 안전합니다.

## 주의
- 별도 환경변수 없음(현재 전 모듈 DEMO 모드, 정적 SPA).
- 루트 저장소의 `vercel.json`(Next.js 앱)과는 무관 — 이 폴더를 Root Directory로 지정해야 합니다.
- 라이브 모드(Phase 2)부터 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`가 필요합니다.
