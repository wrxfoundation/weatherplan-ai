# 배포 (Vercel)

## 왜 원격 빌드가 계속 실패했나

```
Running "vercel build"
Vercel CLI 59.3.0
sh: line 1: vite: command not found
Error: Command "vite build" exited with 127
```

이 로그에서 두 가지를 읽는다.

1. **`Installing dependencies...` 가 없다** — 의존성 설치가 아예 실행되지 않았다.
   설치가 없으면 `node_modules` 가 비어 있고, 어떤 빌드 명령도 실행파일을 못 찾는다.
   `Restored build cache` 로 예전 실패 빌드의 깨진 `node_modules` 가 복원되기까지 한다.
2. **명령이 `vite build` 다** — 우리 `vercel.json` 은 `buildCommand: npm run build` 인데
   프리셋 기본값이 쓰였다. 즉 **`vercel.json` 이 읽히지 않았다.**

둘 다 프로젝트 설정이 `vercel.json` 을 덮고 있을 때 나타난다. 코드로는 고칠 수 없다.

## 권장: 원격 빌드를 건너뛴다

로컬에서 빌드하고 **산출물만** 올린다. 대시보드 설정·프리셋·빌드 캐시가 개입할 여지가 없다.

```bash
cd moduon
npm install        # 최초 1회
npm run deploy     # vercel build --prod && vercel deploy --prebuilt --prod
```

`vercel build` 는 로컬의 `vercel.json` 을 그대로 읽으므로 `api/claude.js` 서버리스 함수와
SPA 리라이트가 모두 살아 있다. 정적 파일만 올리는 방식과 달리 기능 손실이 없다.

## 그래도 원격 빌드를 쓰고 싶다면 — 대시보드에서 확인할 3가지

Vercel 프로젝트 → Settings → Build & Development Settings

| 항목 | 있어야 할 상태 |
|---|---|
| Framework Preset | Vite |
| Build Command | **Override 끄기** (켜져 있으면 `npm run build`) |
| Install Command | **Override 끄기** (빈 값이면 설치가 통째로 스킵된다) |
| Root Directory | 배포 폴더가 `moduon/` 자신이면 **비워 둘 것** |

그리고 Environment Variables 에 `NODE_ENV=production` 이 있으면 지운다.
Vite 는 빌드 시 알아서 production 모드로 간다. 이 변수가 있으면 npm 이
devDependencies 를 건너뛴다(현재는 빌드 도구를 dependencies 로 옮겨 방어해 두었다).

고친 뒤 첫 배포는 캐시를 버린다:

```bash
vercel --prod --force
```

## 성공 로그는 이렇게 보인다

```
Installing dependencies...          ← 이 줄이 반드시 있어야 한다
added 142 packages
Running "npm run build"             ← "vite build" 가 아니어야 한다
✓ built in ...
```

`--prebuilt` 로 올리면 위 두 줄 대신 `Deploying prebuilt output` 만 보인다 — 정상이다.
