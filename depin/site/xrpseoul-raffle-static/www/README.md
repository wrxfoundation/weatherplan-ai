# XRP SEOUL 2026 래플 — 정적 사이트 (결제창 포함)

서버·API 키 없이 동작하는 정적 사이트입니다. 이 폴더를 Vercel 에 그대로 드롭하면 됩니다
(`vercel.json` 불필요, 빌드 없음). 결제 확인·참여 현황은 브라우저가 공개 XRPL JSON-RPC 에서
수취 지갑의 거래를 직접 읽어 계산합니다.

## 구조
```
index.html     페이지 + 결제창 + 스크립트 (설정 블록은 파일 끝 <script> 의 RAFFLE 객체)
js/qrcode.js   QR 생성 라이브러리 (qrcode-generator, MIT · CDN 불필요)
images/        히어로·아이콘 (cta-bg.webp 는 없어도 됨 — onerror 로 제거)
brand/         로고 SVG/PNG
```

## 운영 설정 — `index.html` 끝의 `RAFFLE` 블록만 바꾸면 됩니다
| 키 | 기본값 | 뜻 |
|---|---|---|
| `address` | `rhTTtx8YyKzcmPDsoroYXuHdGMThrnweb1` | 5 XRP 를 받는 지갑. **Destination Tag 를 받을 수 있는 자체 지갑**이어야 함(거래소 입금 주소 불가). 래플 전용 지갑을 새로 만드는 편이 조회가 가볍고 정산이 깔끔함 |
| `priceXrp` / `max` | `5` / `500` | 참여 금액 · 선착순 정원 |
| `openAt` / `closeAt` | `2026-09-22T09:00:00Z` / `2026-09-27T09:00:00Z` | 9.22(화) 18:00 ~ 9.27(일) 18:00 KST (UTC 로 적음) |
| `graceMin` | `10` | 마감 직후 유예(분) — 이 안에 원장에 오른 입금까지 인정 |
| `tagMin` / `tagMax` | 10억 ~ 19.99억 | 이 페이지가 발급하는 Destination Tag 범위. 범위 밖 태그·태그 없음 = 응모 불인정 |
| `rpc` | xrplcluster → s1 → s2.ripple.com | 공개 JSON-RPC, 앞에서부터 시도 |
| `emailForm` | 비어 있음 | (선택) Google Form 자동 등록 — 아래 참조 |
| `contact` | admin@wellbianlabs.io | 문의·등록 메일 주소 |

## 동작 규칙
- **응모 1건** = 오픈 이후 `address` 로 들어온 **5 XRP 이상 · 성공(tesSUCCESS) · 태그 범위 안** Payment.
  XRP 가 아닌 자산(RLUSD 등)·태그 없음·금액 부족·오픈 전/마감 후 입금은 세지 않음.
- **지갑(계정) 1개당 1회.** 같은 계정의 두 번째 입금은 응모로 인정되지 않음(래플 번호는 첫 입금 기준).
- **래플 번호** = 원장 순서(ledger index → txn index). 모든 브라우저가 같은 원장을 읽으므로 같은 번호가 나옴.
- **500번째 이후** 입금 = 정원 초과(OVERFLOW) 화면 → 문의 메일 안내(환불 여부는 운영 판단).
- **버튼 상태**: 오픈 전 비활성 + 「시작까지 D-1 · hh:mm:ss」 / 오픈 중 「5 XRP 로 참여하기」 + 남은 자리 /
  500명 도달 「선착순 500명 마감」 / 마감 후 「응모가 마감되었습니다」. 참여 현황은 30초마다 갱신.
- **결제창 4단계**: 응모 내용 → 이메일·동의 2건 → 결제(주소·태그·QR·Xaman 링크, 10초마다 입금 자동 확인,
  거래 해시 직접 확인) → 완료(래플 번호·거래 링크·이메일 등록).
- **내 응모**는 브라우저 localStorage(`xrpseoul_raffle_v1`)에 저장 — 같은 브라우저로 다시 오면 이어서 진행.

## 이메일 수집 (초대권·당첨 안내용)
백엔드가 없으므로 두 방식 중 하나입니다.
1. **Google Form 자동 등록(권장)** — 짧은 답 5문항(이메일·래플번호·태그·지갑·거래해시)짜리 폼을 만들고
   「미리 채워진 링크 받기」로 각 문항의 `entry.NNNN` 을 확인해 넣습니다.
   ```js
   emailForm: { action: 'https://docs.google.com/forms/d/e/<폼ID>/formResponse',
                fields: { email: 'entry.111', no: 'entry.222', tag: 'entry.333', account: 'entry.444', tx: 'entry.555' } }
   ```
   완료 화면에서 자동 전송(no-cors)되고, 응답 시트에 이메일 ↔ 래플 번호가 쌓입니다.
2. **비워 두면** 완료 화면에 「이메일 등록 메일 보내기」(mailto, 본문 자동 채움) + 복사용 텍스트가 나옵니다.
   사용자가 메일을 보내야 등록되므로 1번을 권합니다.

## 한계 (백엔드 없음)
- 마지막 몇 자리에서 여러 명이 동시에 송금하면 501번째 이후가 생길 수 있음 → OVERFLOW 화면 + 문의 안내로 처리.
  결제창은 남은 자리 5 이하일 때 경고를, 정원 도달·마감 시 「송금하지 마세요」를 띄웁니다.
- 래플 NFT 발급·추첨·당첨 발표는 이 페이지가 하지 않습니다(운영에서 별도 진행).
- 공개 RPC 가 모두 응답하지 않으면 참여 현황이 「—」로 보이고 결제 단계로 넘어가지 않습니다(정원 초과 방지).

## 검수용 URL 파라미터
- `?now=2026-09-22T09:00:00Z` — 시계를 그 시각으로(오픈 직후 화면), `?now=2026-09-21T14:00:00Z` — 오픈 전 화면
- `?poll=3000` — 조회 주기(ms) 단축
- 실제 원장을 읽으므로 오픈 전에는 참여 0 이 정상입니다.

## 오픈 전 확인할 것
1. `address` 가 최종 수취 지갑인지 (태그 수신 가능 · 키 보관 주체 확인)
2. Xaman 으로 「Xaman 으로 열기」·QR 을 실제 기기에서 한 번 눌러 금액 5 XRP·태그가 채워지는지
3. Google Form 을 쓸지 (쓰면 `emailForm` 채우기)
4. Vercel 프로젝트의 Deployment Protection 이 켜져 있으면 외부인이 접속할 수 없음 — 공개 전 해제

## 아이콘
경품·단계·일정 아이콘은 `index.html` 상단의 `<symbol>` 로 직접 그렸습니다 —
모체 `public/images/icon0N.svg` 와 같은 문법(100×80 · 연보라 `#EBECFB` 라운드 사각 · 인디고 `#4D4DCE` 2.4px 라인).

| id | 자리 |
|---|---|
| `i-ticket` `i-device` `i-umbrella` `i-bag` | 경품 4종 |
| `i-signup` `i-pay` `i-nft` | STEP 1·2·3 |
| `i-start` `i-close` `i-announce` `i-gift` | 일정 플로우 4단계 |
