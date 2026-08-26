# wellbian store — 1차 판매 · 2차 대기 웹 (Next.js)

디자이너 핸드오프 번들(`UI_mockups_project_1.zip`)의 PRD/디자인 HTML을 픽셀 기준으로 옮긴 Next.js 구현입니다.
디자인 원본: `design/WELLBIAN Purchase Page.dc.html` (18개 화면) — **HTML이 진실**, 임의 리디자인 금지.

## 실행

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## 라우트 맵 (PRD §3)

| 경로 | 화면 | 비고 |
|---|---|---|
| `/` | 1a 판매 랜딩 S0~S9 + 1j 모바일 | 구매 모달 5스텝(1b~1f, 1k)은 CTA로 오픈 |
| `/?state=eb_closed` | 1h 얼리버드 마감 | S2 카드 전환 + 상단 배너 1회 |
| `/?state=sold_out` | 1i 완판 | 히어로 전환 + 2차 대기 CTA |
| `/orders/[orderId]` | 1g 배송 대기 + 1l 모바일 | 결제(서명) 완료 후 이동 |
| `/waitlist` | 2a 대기 등록 랜딩 | 이메일+지갑만 수집 |
| `/waitlist/complete` | 2c 등록 완료 | 공유 카드(초대 코드 내장) |
| `/me/waitlist` | 2b 미션 대시보드 + 2d 모바일 | 응모권·순번 점수·예상 그룹 |
| `/me` | 3a 마이페이지 + 3b 모바일 | 주문·기기·계정·지원 |

## 목 API (PRD §7) — 실서버 연동 지점

전부 `app/api/**/route.ts` 스텁이며 `lib/data.ts`의 목데이터를 반환합니다.

- `GET /api/inventory?phase=` — 재고 (ebLeft/genLeft/가격)
- `POST /api/checkout/hold` — 수량 홀드 20분
- `POST /api/checkout/confirm` — 서명 확인 → 주문 확정
- `GET /api/orders/[id]` — 주문 조회
- `POST /api/waitlist` — 2차 대기 등록
- `GET /api/waitlist/me` — 내 대기 현황
- `POST /api/waitlist/missions/[key]` — 미션 완료 체크
- `GET /api/me` — 주문·기기·계정 요약

지갑 연동은 `lib/wallet.ts`의 `WalletAdapter` 인터페이스(mock)로 추상화 —
실연동 시 D'CENT / Xaman / GemWallet 어댑터로 교체하면 됩니다(XRPL Payment 서명).

## 디자인 토큰 (PRD §4)

`app/globals.css`의 `:root` CSS 변수. 시안02 Teal 전환은 `<html data-theme="teal">` 한 줄.

## 표기 규칙 (PRD §5 — 수정 시에도 유지)

- CTA는 「구매하기」 통일 · 티어명 얼리버드/일반("기본" 금지)
- 제품명은 영문 단독, 법정 표기(날씨데이터토큰생성기™·실내공기측정기·ARC-600DA)는 스펙 카드·푸터에만
- 총 5,000대 표기 · 증정분(#0001~0100) 비노출
- 보상 문구에는 "지급량·가치는 보장되지 않습니다" 동반
- GNB는 로고+「제품」+KO/EN만 (모바일은 D-day 칩 허용)

## 배포 (Vercel)

```bash
vercel --prod
```

루트 디렉터리를 `depin/site/wellbian-store`로 지정. 환경 변수 불필요(전부 목).
