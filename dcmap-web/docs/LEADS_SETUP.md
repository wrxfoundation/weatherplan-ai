# 문의/리드 접수 연동 (5분)

`/pricing` 요금·문의 페이지와 부지 분석의 "정밀 리포트·컨설팅 문의" CTA로 들어오는 문의를
자동으로 받는 방법입니다. **연동을 안 해도 이메일 폴백으로 동작**하지만, 웹훅을 연결하면
문의가 실시간으로 슬랙/디스코드/시트에 꽂힙니다.

## 동작 방식 (정직성)

- `LEAD_WEBHOOK_URL`이 설정되면 → 문의를 그 웹훅으로 전달하고 사용자에게 **"접수됐습니다"** 표시.
- 미설정이면 → 서버가 성공을 꾸미지 않고(`not_configured`), 폼이 **이메일 보내기 / 내용 복사**
  폴백을 노출합니다. 허공에 사라지는 가짜 접수가 없습니다.
- 백엔드: `api/_lead.js` (파일명 `_` 접두라 Vercel 함수 수 미카운트). `api/power.js?src=lead`로 위임 → **12함수 제한 유지**.

## 옵션 A — 슬랙 Incoming Webhook (권장, 무료)

1. Slack → 워크스페이스에서 **Incoming Webhooks** 앱 추가.
2. 문의를 받을 채널(예: `#leads`) 선택 → **Webhook URL** 복사
   (형식: `https://hooks.slack.com/services/T000/B000/xxxx`).
3. Vercel → 프로젝트 → **Settings → Environment Variables** 에 추가:
   - Key: `LEAD_WEBHOOK_URL`
   - Value: 복사한 URL
   - Environments: Production (+ Preview 원하면 함께)
4. **Redeploy**. 끝. `/pricing`에서 테스트 문의를 보내면 채널에 알림이 옵니다.

> `_lead.js`는 `{ text }`(슬랙/디스코드 호환) + `{ lead }`(원본 필드)를 함께 POST하므로,
> 디스코드 웹훅도 그대로 동작합니다(디스코드는 `content` 필드도 함께 보냄).

## 옵션 B — 구글 시트에 자동 적재 (Apps Script)

1. 구글 시트 → 확장 → **Apps Script**에 붙여넣기:
   ```js
   function doPost(e) {
     const d = JSON.parse(e.postData.contents).lead || {}
     const sh = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]
     sh.appendRow([d.ts, d.유형, d.이름, d.회사, d.이메일, d.연락처, d.용량MW, d.지역, d.메시지, d.맥락, d.출처])
     return ContentService.createTextOutput('ok')
   }
   ```
2. **배포 → 웹 앱**, 실행 대상 "나", 액세스 "모든 사용자". 배포 URL 복사.
3. Vercel 환경변수 `LEAD_WEBHOOK_URL` = 그 URL → Redeploy.

## 폴백 이메일 (선택)

웹훅 미설정 시 폼의 "이메일로 보내기"가 여는 주소입니다.

- 기본값: `kwangdol@gmail.com` (TopBar 문의 주소와 동일).
- 바꾸려면 Vercel 환경변수 `VITE_LEAD_EMAIL` = `you@company.com` 설정 후 Redeploy.
  (`VITE_` 접두는 빌드 시 클라이언트에 포함됩니다.)

## 필드

접수되는 항목: 유형 · 이름 · 회사 · 이메일 · 연락처 · 용량(MW) · 지역 · 메시지 · 맥락(부지 좌표 등) · 출처 URL · 시각.

## 보안

- `_lead.js`는 Origin 화이트리스트(자기 도메인·프리뷰·localhost)로 교차출처 남용을 차단합니다.
- 이메일 또는 연락처 중 하나는 필수(스팸 최소화). 별도 개인정보 저장은 하지 않으며, 웹훅으로만 전달됩니다.
