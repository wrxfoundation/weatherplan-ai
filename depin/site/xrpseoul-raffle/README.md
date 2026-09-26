# xrpseoul-raffle — XRP SEOUL 2026 래플 페이지 단독 앱 (미리보기 · 정본 이식 재료)

정본(kweather-depin, wellbian.io)의 래플 페이지 + 결제창을 **백엔드 없이** 띄우는 Next.js 앱이다.
서우가 개인 Vercel 프로젝트(`xrpseoul-raffle`)에 그대로 드롭해 올리고, 정본에 붙이는 사람은 `mother-patch/`(또는 저장소의
`depin/site/kweather-depin-patches/2026-09-21-raffle-xrp-checkout/`)를 정본 저장소에 적용한다. **두 곳의 래플 컴포넌트는 같은 파일이다.**

## 동작
- `/`(= `/event/xrpl-seoul`) 래플 페이지. 상태는 `/api/raffle/state` 가 **시간만 보고** 계산한다(`src/lib/raffle-config.ts`: 시작 9/22 18:00 KST · 마감 9/27 18:00 · 발표 9/28 18:00 · 행사 10/3 · 5 XRP · 500명).
  - 시작 전: 히어로 버튼 「9.22(화) 18:00 응모 시작」 비활성 + 「시작까지 D-1 05:12:33」 카운트다운. 18:00 이 되면 페이지가 스스로 OPEN 으로 바뀐다.
  - OPEN 뒤 「5 XRP 로 참여하기」를 누르면 로그인이 필요하므로 정본 사이트(`NEXT_PUBLIC_CANONICAL_URL`, 기본 `https://wellbian.io/event/xrpl-seoul`)로 보낸다. 이 앱에는 지갑·DB·결제가 없다.
  - 참여 현황은 0 으로 나온다(정본에서는 결제 확정 수).
- `/preview` 결제창 10개 화면(응모 내용 → 동의·이메일 → XRP 결제(입금 안내·잔액 충분·남은 자리 경고) → NFT 발행/수락/완료 → 차단 2종). 정본에 붙이는 사람이 흐름을 보는 용도.
- 언어: 상단 바에서 5개 언어(ko·en·ja·zh·es) 전환. localStorage `wb-lang`.

## 지금 올라가 있는 곳
- **https://xrpseoul-raffle.vercel.app** — Vercel 프로젝트 `xrpseoul-raffle`(서우 개인 계정)에 이 저장소의 브랜치 `claude/wellbian-depin-product-basics-gyylrb`, 루트 `depin/site/xrpseoul-raffle` 를 프로덕션으로 배포(2026-09-21 22:25 KST, Git 소스 배포).
  프로젝트가 Git 에 연결된 것은 아니라 푸시해도 자동 배포되지 않는다. 다시 올리려면 zip 드롭(아래) 또는 Vercel 대시보드에서 이 저장소를 Import(Root Directory `depin/site/xrpseoul-raffle`)해 연결한다.

## Vercel 에 올리기
1. 이 폴더(package.json 이 보이는 층)를 Vercel 프로젝트에 드롭하거나 `vercel deploy`. 프레임워크는 Next.js 로 자동 인식된다. 환경 변수·DB 필요 없음.
   (선택) `NEXT_PUBLIC_CANONICAL_URL` - 응모 버튼이 보낼 정본 주소.
2. 프로젝트가 「Vercel Authentication (all except custom domains)」로 보호돼 있으면 `*.vercel.app` 주소는 Vercel 로그인한 사람만 본다. 공개하려면 Settings › Deployment Protection 에서 끄거나 커스텀 도메인을 붙인다.
3. 크론·지역 설정 없음(Hobby 제한에 걸릴 것이 없다).

## 정본에 붙이기
- `mother-patch/` 는 tsconfig·eslint 검사에서 제외돼 있다(안에 정본용 .tsx 가 있어 검사에 걸리면 빌드가 실패한다).
- `mother-patch/README.md` 의 「적용」 절대로: `git apply raffle-xrp-checkout.patch` + `hero.webp` 복사, 또는 `files/` 를 같은 경로에 덮어쓰기. DB 스키마 변경 없음.
- 이 앱에만 있는 파일(정본에는 넣지 않는다): `src/lib/raffle-config.ts` · `src/lib/launch/i18n.tsx`(정본은 메인 i18n 을 구독하는 원본이 있다) · `src/lib/wallet/WalletContext.tsx`(정본은 실제 지갑) ·
  `src/components/TopBar.tsx` · `src/app/preview/*` · `src/app/api/raffle/card/[code]/route.ts`(정본은 번호·QR 을 넣은 PNG) · `src/app/api/raffle/state/route.ts`(정본은 DB 를 읽는다) · `src/app/page.tsx`(정본은 /event/xrpl-seoul).
- 같은 파일: `src/components/raffle/*` · `src/lib/raffle-prizes.ts` · `src/components/Toast.tsx` · `src/app/globals.css` · `src/app/wb-page.css` · `src/app/launch/store.css`.

## 로컬
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```
