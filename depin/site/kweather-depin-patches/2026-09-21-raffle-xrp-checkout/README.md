# XRP SEOUL 2026 래플 — XRP 전용 결제창 (2026-09-21)

kweather-depin(모체) 저장소에 적용하는 변경분. 판매 페이지 구매 모달(BuyModal)의 흐름을 따르되 결제는 XRP 뿐이다.

## 적용
- `git apply raffle-xrp-checkout.patch` (저장소 루트에서), 또는 `files/` 아래 6개 파일을 같은 경로에 덮어쓴다.
- 새 파일: src/components/raffle/RaffleCheckoutModal.tsx · TicketCard.tsx · types.ts
- 수정: src/components/raffle/RafflePage.tsx (안쪽 EntryModal 제거 → RaffleCheckoutModal) · src/lib/raffle.ts (DEFAULT 일정·경품 수) · src/app/event/xrpl-seoul/test/page.tsx (안내 문구)
- DB·API 변경 없음. 기존 /api/raffle/{enter,verify,confirm,state} · /api/wallet 그대로 쓴다.

## 흐름 (구매 모달과 같은 순서, 래플에 없는 단계는 접음)
① 응모 내용(계정당 1회 · 5 XRP · 경품 · 현장 수령 안내) → ② 동의(환불 불가 · 현장 수령/QR 관리) → ③ XRP 결제(연결 지갑 서명 또는 외부 지갑 송금 + 해시) → ④ 래플 NFT 수락 → 완료(티켓 카드)

## 확인
- `tsc --noEmit` · `eslint` 통과. 단계별 SSR 렌더 스크린샷(preview/)으로 데스크톱·모바일 넘침 없음 확인.
- 실기기 확인은 /event/xrpl-seoul/test (리허설 장부, 실제 5 XRP) 에서.
