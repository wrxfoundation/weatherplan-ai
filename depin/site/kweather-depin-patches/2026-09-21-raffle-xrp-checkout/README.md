# XRP SEOUL 2026 래플 — XRP 전용 결제창 + 히어로 이식 + 카운팅·추첨 점검 + 대점검 v4 + 예약 정원·초대권 이메일 v5 + 남은 결정 4건 v6 + Hobby 배포 v7 (2026-09-21)

kweather-depin(모체) 저장소에 적용하는 변경분(누적). 판매 페이지 구매 모달(BuyModal)의 흐름을 따르되 결제는 XRP 뿐이고,
래플 페이지 히어로·스탯 줄은 정적 시안(xrpseoul-raffle)을 그대로 옮겼다. 결제 카운팅·추첨 경로를 점검해 아래를 고쳤다.

## 적용
- `git apply raffle-xrp-checkout.patch` (저장소 루트에서) **+ `files/public/assets/raffle/hero.webp` 를 같은 경로에 복사**(패치는 소스만 담는다).
  또는 `files/` 아래 24개 파일을 같은 경로에 덮어쓴다. DB 스키마·마이그레이션 변경 없음(`RaffleEntry.status` 는 문자열 컬럼이라 새 값 OVERFLOW 는 그대로 들어가고,
  예약은 `createdAt` 을, 당첨 안내 이메일은 기존 `AccountContact` 를, 추첨 링크는 AdminConfig `raffle_xrpseoul.drawId` 를 쓴다).
- **Vercel 배포용 전체 zip**: 모체 전체에 이 패치를 적용한 트리(node_modules·.next·.env 제외)를 서우에게 별도 전달(`kweather-depin-master-raffle-v7.zip`, 루트에 `RAFFLE-2026-09-21-NOTES.md` = 이 README).
  **개인(Hobby) 계정용이라 `vercel.json` 은 크론 2개(하루 1회) 판이고 원본은 `vercel.pro.json`** - 아래 v7 절.
- 새 파일(9): public/assets/raffle/hero.webp · src/components/admin/RafflePanel.tsx · src/components/raffle/RaffleCheckoutModal.tsx · src/components/raffle/RaffleHero.tsx · src/components/raffle/TicketCard.tsx · src/components/raffle/raffle-hero.css · src/components/raffle/types.ts · src/lib/raffle-keepalive.ts · src/lib/raffle-prizes.ts
- 수정(15): src/app/admin/page.tsx · src/app/admin/raffle-check/page.tsx · src/app/api/admin/raffle/route.ts · src/app/api/raffle/card/[code]/route.ts · src/app/api/raffle/enter/route.ts · src/app/api/raffle/meta/[code]/route.ts · src/app/api/raffle/state/route.ts · src/app/api/raffle/verify/route.ts · src/app/event/xrpl-seoul/page.tsx · src/app/event/xrpl-seoul/test/page.tsx · src/app/event/xrpl-seoul/ticket/[code]/page.tsx · src/components/Nav.tsx · src/components/admin/BlindDrawPanel.tsx · src/components/raffle/RafflePage.tsx · src/lib/raffle.ts

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

## 대점검 v4 (2026-09-21 — 코드 QA · UX · 사용자 관점)
`tsc --noEmit` · `eslint` 통과 · 로직 테스트 2종 통과(`logic-test.js` 추첨·배정·페이즈, `logic-test-verify.js` 결제 확정 규칙) ·
페이지 10개 상태(로딩·시작 전·오픈·결제 대기·NFT 발행 중·보유·매진+대기·마감+당첨, ko/en) × PC/모바일 SSR 렌더와 결제창 10개 화면 확인(가로 넘침 0).

### 고친 것
1. **[돈] 매진·마감 뒤에도 결제할 수 있던 경로** — 정원(결제 확정 500)이 찬 뒤에도 결제 대기(PENDING) 사용자에게 「내 응모」의 「계속 진행」 버튼이 떠서 5 XRP 를 보낼 수 있었고,
   서버는 그 입금을 확정하지 않으면서 해시도 남기지 않아 환불 대상을 찾을 수 없었다.
   - 페이지: 결제 전 응모는 OPEN 일 때만 결제로 보낸다. 매진·마감이면 「XRP 를 보내지 마세요」 안내. 결제 확정(PAID)은 페이즈와 무관하게 「래플 NFT 받기」.
   - 결제창: 결제 전인데 OPEN 이 아니면(매진·마감·정원 초과 입금) 결제 화면 대신 차단 안내 + 닫기(페이지가 20초마다 내려 주는 상태를 따른다). 남은 자리 20 이하이면 「확정 순서로 반영, 정원이 차면 환불」 경고.
   - 서버 `verifyRaffleEntry`: 정원 초과 입금과 **기간 마감 + 10분 유예** 이후 입금은 PAID 로 만들지 않고 `status=OVERFLOW` 로 해시를 남긴다(같은 해시 재호출 멱등, 다른 응모가 쓴 해시 거부, PAID 재호출은 already).
     관리자 콘솔 › 래플: 「정원 초과 · 환불 대상」 필터·건수. 결제 확정 수(참여 현황)는 PAID 만 센다(OVERFLOW 미포함).
2. **[오픈 러시] 결제 확정 API 응답 끊김** — verify 가 아웃박스를 기본 40초 예산으로 밀어 Vercel 함수 30초 한도를 넘길 수 있었다 → 8초 예산(나머지는 매분 크론 `/api/cron/drain`).
   IP 당 분당 한도 enter 20→60 · verify 30→90(통신사 NAT 뒤 여러 사용자가 같은 IP 로 보인다. 확인 폴링은 한 사람당 최대 8회).
3. **[UX] 첫 화면의 빈 날짜** — 상태를 읽기 전 히어로에 「 시작」·「 응모 시작」(날짜 없음)이 잠깐 보였다 → 「…」·「불러오는 중…」 자리표시자(스탯 줄도).
4. **[i18n] 경품 이름·설명이 모든 언어에서 한국어** — 경품 카드·결제창 ①·내 응모·티켓 페이지·NFT 카드가 새 `src/lib/raffle-prizes.ts` 표를 거쳐 5개 언어로 나온다(표에 없는 이름은 설정값 그대로).
   FAQ 「전원 당첨」의 290/10/50/150 도 설정값에서 만든다. 일정의 행사일도 설정값(`eventAt`).
5. **[UX] 결제창** — 서명·원장 확인·NFT 수락 중에는 바탕 클릭·ESC·✕ 로 닫히지 않는다(닫히면 진행 상황을 잃고 해시로 다시 확인해야 했다). 「참여」→로그인 뒤 결제창이 저절로 열린다.
   카운트다운이 0 이 되면 20초를 기다리지 않고 바로 상태를 읽는다(18:00 시작 순간). 동의 카드 `role=checkbox`, 대화상자 초기 포커스. 확정 실패(400) 뒤 내 응모 상태를 새로 읽는다.
6. **[정합] FAQ 「추첨은 NFT 를 보유한 계정 대상」 → 「결제가 확정된 응모 전원 대상」** — 서버의 추첨 참가자 = PAID 지갑(NFT 수락 여부 무관)과 맞춘다.
7. **[카드] 추첨 뒤 NFT 카드 이미지·메타데이터에 배정 경품 표시**(영문 - 렌더러에 한글 글꼴 없음). 카드 캐시 1일 → 1시간.
8. **[공유] 이벤트 페이지 OG/트위터 카드 이미지**(히어로 경품 예상도) — 완료 화면의 「X 에 공유」 링크 미리보기.
9. **[현장] 스캐너** — 수령 처리 뒤 같은 QR 을 다시 읽으면 안내문대로 「이미 수령 처리됨」이 뜬다(연속 읽기 잠금 해제). 시크릿 없이 Enter 조회 방지. 티켓 페이지(QR 랜딩, 한국어뿐)에 영문 요약 한 단락.

### 운영 메모
- 추첨 봉인(커밋)은 **마감 시각 + 15분 뒤**에 한다 - 유예 10분 안에 확정되는 입금까지 명단에 들어가야 한다. 봉인 뒤 확정된 응모는 추첨에 없다(배정 결과 「미배정」).
- OVERFLOW 행은 사람이 환불한다(관리자 콘솔 › 래플 › 「정원 초과 · 환불 대상」 - 지갑·해시가 행에 있다). 사용자 화면·결제창은 admin@wellbianlabs.io 로 지갑 주소·해시를 보내라고 안내한다.
- 핫월렛 예치금: 미수락 NFT 오퍼 1건당 0.2 XRP 가 잠긴다(500명 전원 미수락이면 100 XRP) - 응모 입금(5 XRP × 500)으로 충분하다.

### 결정이 필요한 것 (코드로 고치지 않았다)
1. ~~**초대권 수령 방식(문구 모순)**~~ → **v5 에서 반영: 초대권은 이메일 발송**(아래) — 초대권 290매의 설명은 「10월 3일 서울 · 행사장 입장권」인데 히어로·결제창 동의·FAQ·일정은 모두 「경품은 행사 당일 현장(wellbian 플래티넘 부스)에서 QR 확인 후 수령, 배송 없음」이다.
   입장권을 행사장 안 부스에서 받는 구조는 성립하지 않는다(FAQ 는 「초대권은 당첨자에게 별도 안내」라고만 한다). 초대권의 실제 전달 방식(이메일·입장 명단·입구 데스크)을 정해 네 곳 문구를 맞춰야 한다.
2. ~~**정원 초과 응모 설계**~~ → **v5 에서 반영: 정원 = 결제 확정 + 유효 예약**(아래) — 응모 행(태그)은 무제한이고 정원은 「결제 확정 500」이다. 18:00 러시에서 500 을 넘긴 입금은 전부 환불 대상이 된다(이번에 경고·차단·기록은 넣었다).
   근본 해결은 결제 대기 예약에 만료(예: 30분)를 두고 「예약 + 확정」 합계로 정원을 세는 설계 변경(스키마·크론 필요).
3. ~~**추첨 검증 링크 노출**~~ → v6 반영 — FAQ 가 「누구나 재계산 검증」을 약속하지만 페이지에 `/api/draw/<id>` 링크가 없다. 설정(`raffle_xrpseoul`)에 drawId 를 넣고 일정 섹션에 링크 한 줄이면 된다.
4. ~~**해시 없이 태그로 자동 확인**~~ → v6 반영 — 거래소에서 바로 보낸 사용자는 해시를 찾기 어렵다. 핫월렛 account_tx 를 Destination Tag 로 훑어 확인하는 「입금 확인」 버튼(P2).
5. ~~**페이지 진입 경로**~~ → v6 반영(헤더 메뉴) — 메인·내비·사이트맵 어디에도 `/event/xrpl-seoul` 링크가 없다(페이지 주석: 「확인 뒤 메인·내비에 연결」). 지금은 X·텔레그램 등 외부 링크로만 들어온다.
6. ~~행사장 표기~~ → v6 「그랜드 하얏트 서울」로 확정(보도·텔레그램 정본) · 리허설 입금 반환은 수동 · 통신사 NAT 한도는 90/분으로 올렸으나 러시 때 429 가 보이면 더 올린다.

## v5 (2026-09-21 저녁 — 서우 결정 반영: 「500 이 되면 결제를 막는다」 · 「초대권 전달은 이메일」)

### 정원 = 결제 확정 + 유효 예약 (500 이 되면 결제를 막는다)
- 응모 시작(동의 버튼)이 곧 **예약**이다. 정원 500 = 결제 확정(PAID) + 유효 예약(PENDING 가운데 최근 `holdMinutes`(기본 30분) 안에 시작·연장된 행).
  정원이 차면 새 응모를 시작할 수 없고(SOLD_OUT), 결제 화면에 들어간 사람은 예약이 살아 있는 동안 자리가 있다. 결제 없이 30분이 지나면 자리가 풀려 다음 사람이 들어온다.
- 예약은 결제 화면에 들어올 때·5분마다·결제 버튼을 누르기 직전에 자동 연장된다(`POST /api/raffle/enter` 재호출 = 연장, 정원이 차 있으면 409 `code:"SOLD_OUT"`).
  예약 시작 시각은 `RaffleEntry.createdAt`(연장하면 갱신 - 관리자 콘솔 「예약(시작)」 열).
- 같은 순간의 응모 시작이 정원을 넘기지 않게 이벤트별 Postgres 조언 잠금(`pg_advisory_xact_lock`) 안에서 세고 만든다.
- 서버 결제 확정(`verifyRaffleEntry`): **예약이 살아 있으면 그대로 확정**. 예약이 만료된 응모의 입금은 남은 자리(정원 - 확정 - 유효 예약)가 없으면 OVERFLOW(환불 대상, 해시 보존).
  정원 초과 경쟁은 트랜잭션의 (event, entryNo) 유일 제약이 마지막으로 막는다.
- 화면: 스탯 「참여 현황 N/500 · 예약 중 M」, 결제 화면 「자리 확보 중 · 남은 시간 mm:ss(창을 열어 두면 자동 연장)」, 정원이 찼는데 내 예약이 살아 있으면 히어로 버튼
  「결제 이어서 하기 · 자리 확보 중」·내 응모 「계속 진행」. 예약이 만료된 채 정원이 찬 사람에게는 차단 화면 + 「이미 보냈다면 해시 입력」(자리가 남았으면 확정, 없으면 환불 대상으로 기록).
- 설정: `raffle_xrpseoul.holdMinutes`(기본 30). 거래소 출금 지연으로 만료가 잦으면 45~60 으로 올린다(결제창을 열어 두면 어차피 연장된다).

### 초대권 = 이메일 발송
- 동의 단계에 「당첨 안내 이메일」 필수 입력 - 계정 연락처(`AccountContact`)에서 미리 채우고(이메일 로그인·구매 때 적은 주소), 동의 버튼에서 저장한다. 스키마 변경 없음.
  외부 지갑(Xaman·D'CENT·Girin) 사용자는 여기서 처음 적는다.
- 문구 통일(5개 언어): 히어로 부제 · 경품 설명(초대권: 「당첨자 이메일로 발송」) · 결제창 ① 안내 · 동의 카드 · FAQ(래플 NFT·수령 방법) · 일정 · 내 응모 카드 →
  「초대권은 이메일로, 실물 경품(Weather Data Token Generator™·우산·에코백)은 10/3 행사장 wellbian 플래티넘 부스에서 QR 확인 후 수령, 택배 없음」.
- 관리자 콘솔 › 래플: 「이메일」 열(연락처, 없으면 이메일 로그인 계정 주소) + 「CSV 내보내기」(번호·지갑·이메일·상태·경품·확정·수령·티켓·해시, 현재 필터·정렬 그대로).
  초대권 발송: 추첨 배정 뒤 경품 「초대권」 으로 필터 → CSV → 메일 도구. (관리자 콘솔 › 메일 발송 도구는 지갑 목록으로 같은 연락처를 찾는다.)

### 검증
`tsc --noEmit` · `eslint` 통과 · `logic-test-verify.js` 7개 시나리오 통과(정원 3: 예약 3 → 4번째 차단 → 확정 2 → 예약 만료 → 자리 인계 → 만료자 입금 OVERFLOW(해시 보존)·멱등 · 마감 유예 10분 ·
중복 해시 거부 · 참여 현황 = PAID 만 · 예약만으로 정원 도달 · 만료 예약 자리 풀림 · 만료 예약도 자리가 남으면 확정) · 결제창 12개 화면(이메일 입력·자리 확보 카운트다운·차단+해시) + 페이지 11개 상태 렌더 확인.

## v6 (2026-09-21 밤 — 남은 결정 4건 반영 + Vercel 배포용 zip)
1. **추첨 검증 링크** — 블라인드 추첨 탭에서 참가자를 「래플 응모(결제 완료)」/「래플 리허설」로 봉인하면 자동으로 래플 설정 `drawId` 에 연결된다(`PATCH /api/admin/raffle {mode, drawId}`; 경품 배정 PUT 도 연결).
   페이지 일정 섹션에 봉인 뒤 「추첨 봉인 완료 · 커밋 … · 공개 링크(봉인 확인)」, 공개 뒤 「추첨 공개 완료 · 시드·결과 검증」(/api/draw/<id>). FAQ 추첨 답변에 「봉인·공개 링크는 일정 섹션에 표시」 한 문장.
2. **해시 없이 입금 확인** — 결제창 ③ 과 차단 화면에 「해시 없이 입금 확인 (태그로 찾기)」. `POST /api/raffle/verify` 를 txHash 없이 부르면 서버가 핫월렛 account_tx(최근 최대 1,000건)에서
   내 Destination Tag 로 들어온 성공한 XRP Payment(금액 충족)를 찾아 그 해시로 확정한다(`findPaymentByTag`). 없으면 202 「아직 입금이 확인되지 않았습니다」.
3. **헤더 메뉴** — Launch 다음에 「XRP SEOUL 래플」(5개 언어). 나브를 투명하게 두는 목록(DARK_HERO_PATHS)에는 넣지 않았다(래플 히어로는 헤더 아래에서 시작한다).
4. **행사장 표기** — 「서울 하얏트 호텔」 → 「그랜드 하얏트 서울」(5개 언어, 보도·텔레그램 정본).

검증: `tsc` · `eslint` 통과 · `logic-test-verify.js` 8개 시나리오 통과(7: 태그 검색 - 거래 없음→대기 · 다른 태그/금액 부족/실패 tx 무시 · 일치→확정(해시 보존) · 재호출→already) · 결제창·일정 렌더 확인.

### Vercel 배포 (zip)
1. zip 을 풀어 기존 프로젝트 자리에 두고 `npm install`. 환경 변수는 기존 그대로(추가 없음). `npx prisma db push` 는 스키마 변경이 없어 no-op.
2. 배포 뒤 확인: /event/xrpl-seoul/test 에서 응모 시작(예약 30분 표시) → 결제 → NFT 수락 → 관리자 콘솔 › 래플(이메일·유효 예약) → 블라인드 추첨 봉인(참가자 「래플 리허설」) → 일정 섹션에 봉인 링크 → 공개 → 경품 배정 → 티켓 페이지·스캐너.
3. AdminConfig `raffle_xrpseoul` 이 `prizes` 를 덮어쓰고 있으면 초대권 note 를 「10월 3일 서울 · 행사장 입장권 · 당첨자 이메일로 발송」 으로 맞춘다. `holdMinutes`(기본 30) 는 필요하면 조정.

## v7 (2026-09-21 밤 — 서우 개인 Vercel(Hobby) 배포 지원)

### 왜 404 였나 (Vercel 프로젝트 `xrpseoul-raffle` 배포 기록으로 확인)
- 21:37 전체 zip 드롭 배포: `next build` 는 성공(3분)했지만 마지막 단계에서 **`cron_jobs_limits_reached`** — Hobby 계정은 크론이 하루 1회·최대 2개인데 `vercel.json` 에 매분·5분·10분 크론 7개가 있다.
- 21:40 래플 부분본 zip 드롭: 앱이 아니라 파일 묶음(README·patch·files/)이라 정적 배포가 됐고 루트에 index.html 이 없어 404. **부분본은 모체 저장소에 적용하는 재료이지 그 자체로 사이트가 아니다.**
- 빌드 로그의 `src/app/api/v1/device/route.ts` 줄은 경고(미사용 변수) 2건이지 오류가 아니다.

### 고친 것
- `vercel.hobby.json`(크론 2개 · 하루 1회: reconcile 03:00 UTC, prune 02:30 UTC) — 전체 zip 에는 이것이 `vercel.json` 으로 들어가고 원본은 `vercel.pro.json`. 모체(Pro) 저장소의 vercel.json 은 손대지 않는다(부분본에도 없다).
- 크론이 없어도 래플 NFT 발행 → 오퍼가 이어지도록 `/api/raffle/state` 가 **인스턴스당 20초에 한 번 정산 3초 + 드레인 3초**를 민다(`src/lib/raffle-keepalive.ts`).
  발행 결과 정산(reconcile)이 없으면 NFTokenCreateOffer 가 큐에 들어가지 않아 「NFT 발행 중」에서 멈춘다. Pro 에서 매분 크론과 겹쳐도 무해(드레인은 리스, 정산은 멱등). `RAFFLE_SELF_DRAIN=0` 이면 끈다.

### Hobby 프로젝트(xrpseoul-raffle)에 올리기
1. 전체 zip 을 풀어 **`kweather-depin-master` 폴더 자체를 드롭**(폴더 안에 package.json 이 보이는 층). 부분본 zip 은 올리지 않는다.
2. 환경 변수(Settings › Environment Variables). 빌드에는 필요 없지만 실행에 필수: `DATABASE_URL`(PgBouncer 풀) · `DIRECT_URL`(직접 연결, Prisma directUrl) · `SESSION_SECRET` · `ADMIN_SECRET` · `XRPL_HOT_SEED` · `XRPL_ISSUER_ADDRESS` · `XRPL_NETWORK`(mainnet) · `DEVICE_KEY_ENC_SECRET`(추첨 봉인 시드) · `CRON_SECRET` · `NEXT_PUBLIC_SITE_URL`.
   로그인·지갑: `GOOGLE_CLIENT_ID` · `GOOGLE_REDIRECT_ORIGINS` · `XUMM_API_KEY` · `XUMM_API_SECRET` · `NEXT_PUBLIC_WC_PROJECT_ID`. 나머지(`RLUSD_*`·`WLBN_CURRENCY`·`NEXT_PUBLIC_MAPBOX_TOKEN`·`KW_API_KEY`·`IOT_INGEST_TOKEN`·`FACTORY_SECRET`·`NFT_PARTNER_API_KEY`)는 다른 페이지용.
   **값은 운영(wellbian.io) 배포와 같아야 같은 장부·핫월렛을 본다.** (연결된 Vercel 토큰에는 환경 변수 조회 권한이 없어 현재 설정 여부는 확인하지 못했다.)
3. **Deployment Protection**: 프로젝트가 「Vercel Authentication — all except custom domains」라 `*.vercel.app` 주소는 Vercel 에 로그인한 사람만 본다. 공개하려면 Settings › Deployment Protection 에서 끄거나 커스텀 도메인(예: raffle.wellbian.io)을 붙인다.
4. Hobby 는 함수 지역이 iad1(미국 동부)로 잡힌다(vercel.json 의 icn1 은 무시됨). DB·XRPL 왕복이 조금 길지만 래플에는 문제 없다.
5. 같은 DB 를 두 배포(wellbian.io + xrpseoul-raffle.vercel.app)가 함께 써도 핫월렛 드레인은 리스로 하나만 돌아 안전하다.

