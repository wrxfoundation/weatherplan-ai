# XRP SEOUL 2026 래플 — XRP 전용 결제창 + 히어로 이식 + 카운팅·추첨 점검 수정 (2026-09-21)

kweather-depin(모체) 저장소에 적용하는 변경분(누적). 판매 페이지 구매 모달(BuyModal)의 흐름을 따르되 결제는 XRP 뿐이고,
래플 페이지 히어로·스탯 줄은 정적 시안(xrpseoul-raffle)을 그대로 옮겼다. 결제 카운팅·추첨 경로를 점검해 아래를 고쳤다.

## 적용
- `git apply raffle-xrp-checkout.patch` (저장소 루트에서) **+ `files/public/assets/raffle/hero.webp` 를 같은 경로에 복사**(패치는 소스만 담는다).
  또는 `files/` 아래 14개 파일을 같은 경로에 덮어쓴다. DB 스키마·마이그레이션 변경 없음.
- 새 파일: src/components/raffle/RaffleCheckoutModal.tsx · RaffleHero.tsx · raffle-hero.css · TicketCard.tsx · types.ts ·
  src/components/admin/RafflePanel.tsx · public/assets/raffle/hero.webp
- 수정: src/components/raffle/RafflePage.tsx · src/lib/raffle.ts · src/app/api/raffle/verify/route.ts · src/app/api/admin/raffle/route.ts ·
  src/components/admin/BlindDrawPanel.tsx · src/app/admin/page.tsx · src/app/event/xrpl-seoul/test/page.tsx

## 결제창 흐름 (구매 모달과 같은 순서, 래플에 없는 단계는 접음)
① 응모 내용(계정당 1회 · 5 XRP · 경품 · 현장 수령 안내) → ② 동의(환불 불가 · 현장 수령/QR 관리) → ③ XRP 결제(연결 지갑 서명 또는 외부 지갑 송금 + 해시) → ④ 래플 NFT 수락 → 완료(티켓 카드)

## 카운팅·추첨 점검에서 고친 것 (2026-09-21)
1. **경품 배정이 동작하지 않던 버그**: 블라인드 추첨 결과 `result.ordered` 는 지갑 문자열 배열인데 `PUT /api/admin/raffle` 이 `{id}` 객체로 읽어
   전부 undefined 가 됐다(배정 0명). 문자열·객체 둘 다 읽게 고쳤다.
2. **장부(실제/리허설) 판별**: 첫 지갑 하나로 판단하던 것을 「전원이 결제 확정된 장부」로 판단(`inferRaffleMode`). 요청에 `mode` 를 주면 그것을 쓴다.
3. **래플 번호 경쟁**: 같은 순간 여러 명이 확정되면 (event, entryNo) 유일 제약에 걸려 500 이 났다 → 번호를 다시 세어 최대 6회 재시도.
   같은 응모의 중복 확인(확인 버튼 두 번)은 `status=PENDING` 조건으로 한 번만 통과 — 번호 덮어쓰기·NFT 발행 중복 큐잉 차단.
4. **결제 확인 API 오류 처리**: 원장·DB 오류 때 500 대신 202(재확인 안내) — 입금은 살아 있으므로 같은 해시로 다시 확인하면 된다.
5. **참가자 > 경품 수 합계면 배정 거부**(관리자 설정에서 정원·경품 수를 다르게 바꿨을 때 일부가 경품 없이 남는 것 방지).
6. **관리자 UI**: 블라인드 추첨 탭에 「래플 경품 배정」 버튼(공개된 추첨에만), 새 「래플」 탭(결제 확정 수 = 참여 현황 카운트 · 배정 · 수령 · 응모 목록).

## 운영 순서 (추첨)
1. 응모 마감 뒤 관리자 콘솔 › 블라인드 추첨 › 종류 「사용자 정의(CUSTOM)」 · 참가자 「XRPL SEOUL 래플 응모(결제 완료)」 로 봉인(커밋). 공개 링크(/api/draw/<id>)를 알린다.
2. 발표 시각에 「공개」(리빌) → 같은 행의 「래플 경품 배정」 → 결과가 각 응모의 `prize` 에 적히고 래플 페이지 「내 응모」·티켓 페이지에 표시된다.
3. 10/3 현장: /admin/raffle-check 스캐너로 QR 확인 후 수령 처리(한 번만).

## 확인
- `tsc --noEmit` · `eslint` 통과. 단계별·히어로 SSR 렌더 스크린샷(preview/). 순수 로직 테스트: computeDraw 결과 형태 → 배정 슬라이스(500/380/501명) · 장부 추론 · 페이즈 전이(9/22 18:00 OPEN · 500명 SOLD_OUT · 9/27 18:00 CLOSED).
- 실기기 확인은 /event/xrpl-seoul/test (리허설 장부, 실제 5 XRP) 에서 결제 → NFT 수락 → 리허설 추첨 → 배정 → 스캐너까지 한 바퀴.
