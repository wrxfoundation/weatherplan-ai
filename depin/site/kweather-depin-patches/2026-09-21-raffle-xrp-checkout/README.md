# XRP SEOUL 2026 래플 — XRP 전용 결제창 + 히어로 이식 (2026-09-21)

kweather-depin(모체) 저장소에 적용하는 변경분. 판매 페이지 구매 모달(BuyModal)의 흐름을 따르되 결제는 XRP 뿐이고,
래플 페이지 히어로·스탯 줄은 정적 시안(xrpseoul-raffle)을 그대로 옮겼다.

## 적용
- `git apply raffle-xrp-checkout.patch` (저장소 루트에서) **+ `files/public/assets/raffle/hero.webp` 를 같은 경로에 복사**(패치는 소스만 담는다).
  또는 `files/` 아래 9개 파일을 같은 경로에 덮어쓴다.
- 새 파일: src/components/raffle/RaffleCheckoutModal.tsx · RaffleHero.tsx · raffle-hero.css · TicketCard.tsx · types.ts · public/assets/raffle/hero.webp
- 수정: src/components/raffle/RafflePage.tsx (히어로 → RaffleHero/RaffleStats, 안쪽 EntryModal → RaffleCheckoutModal) ·
  src/lib/raffle.ts (DEFAULT 일정·경품 수) · src/app/event/xrpl-seoul/test/page.tsx (안내 문구)
- DB·API 변경 없음. 락업 로고는 기존 /brand/logo_w_medium.svg 를 쓴다. 폰트(Paperlogy·Pretendard)는 사이트 전역 것을 쓴다.

## 결제창 흐름 (구매 모달과 같은 순서, 래플에 없는 단계는 접음)
① 응모 내용(계정당 1회 · 5 XRP · 경품 · 현장 수령 안내) → ② 동의(환불 불가 · 현장 수령/QR 관리) → ③ XRP 결제(연결 지갑 서명 또는 외부 지갑 송금 + 해시) → ④ 래플 NFT 수락 → 완료(티켓 카드)

## 히어로
- 좌: 락업 로고 · 「XRP SEOUL 2026 / 플래티넘 스폰서 래플 이벤트」 · 알약 3개(선착순 N명 · 100% 당첨 · 시작/마감 일시) · 경품 한 줄 · 참여 버튼(빛띠) + 경품 보기 · 카운트다운 · XRP SEOUL 링크. 우: 경품 예상도(세로 기준 통째, 좌측 마스크) + 캡션.
- 아래 스탯 5칸(참여 금액 · 참여 현황 · 당첨 확률 · 참여 마감 · 행사일). 숫자·날짜는 전부 서버 설정(raffleState.config)에서 읽는다.
- 모바일(≤920px): 다크 배경, 이미지가 텍스트 아래로. 5개 언어.
- 행사장 표기 「서울 하얏트 호텔」은 RaffleHero.tsx 의 VENUE 한 곳에서 바꾼다.

## 확인
- `tsc --noEmit` · `eslint` 통과. 단계별·히어로 SSR 렌더 스크린샷(preview/)으로 데스크톱·모바일 넘침 없음 확인.
- 실기기 확인은 /event/xrpl-seoul/test (리허설 장부, 실제 5 XRP) 에서.
