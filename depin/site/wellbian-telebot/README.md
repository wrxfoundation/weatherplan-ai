# wellbian-telebot

@wellbian_faq_bot — 텔레그램 FAQ 봇. Vercel 별도 프로젝트로 배포한다.

## 무엇을 하고 무엇을 하지 않는가

| | 담당 |
|---|---|
| 입장 캡챠 · 금칙어 · 뮤트 · 안티스팸 | **Rose** (그룹 관리자) |
| FAQ 답변 · 판매 일정 안내 | **이 봇** (일반 멤버, 관리자 권한 불필요) |

이 봇은 그룹에서 `privacy mode` 를 켠 **일반 멤버**로 동작한다. 차단·삭제 권한이 없고
필요하지도 않다. 관리자로 올리지 말 것.

## 정본은 여기 없다

FAQ 문장과 판매 일정은 이 프로젝트에 한 줄도 없다. 판매 사이트(`wellbian-store`)의
`/api/faq` 를 읽어 그대로 옮긴다. 정본은 `wellbian-store/lib/data.ts` 와 `lib/schedule.ts`
둘뿐이고, 그 파일을 고치면 사이트와 봇이 같이 바뀐다.

**FAQ 문장을 이 저장소에 복사하지 말 것.** 8/29 에 판매 정책을 바꿨을 때 화면은 새 정책으로
고쳤는데, 사본이 남아 있던 `/api/inventory` 와 `public/*.docx` 가 옛 정책(추첨·차수 가격·
100대 상한)을 계속 대외로 내보내고 있었다. 봇은 고객이 직접 읽는 자리라 그 사고가 더 크게 난다.

`lib/faq-client.ts` 의 60초 캐시는 사본이 아니다 — 정본이 바뀌면 따라 바뀌고, 한 번도 읽지
못했으면 답하지 않고 사람에게 넘긴다.

## 환경변수 (Vercel → Settings → Environment Variables)

| Key | 값 | 비고 |
|---|---|---|
| `TG_BOT_TOKEN` | BotFather 토큰 | Production=운영봇 / Preview=개발봇 으로 나눠 저장 |
| `TG_WEBHOOK_SECRET` | `openssl rand -hex 32` | Production·Preview 각각 다른 값 |
| `FAQ_SOURCE_URL` | `https://<판매사이트도메인>/api/faq` | |
| `TG_GROUP` | `wellbiantalk` | 선택. 이 공개 그룹 밖에서는 반응하지 않는다 |
| `FAQ_BYPASS_TOKEN` | Vercel Protection Bypass 토큰 | 판매 사이트에 Deployment Protection 이 켜져 있을 때만 |

- `NEXT_PUBLIC_` 접두사를 **절대** 붙이지 않는다. 붙는 순간 토큰이 브라우저 번들에 실린다.
- 환경변수는 저장만으로 반영되지 않는다. **Deployments → 최신 → Redeploy** 를 해야 한다.
- 토큰을 실수로 노출했으면 BotFather `/revoke` 로 즉시 재발급한다.

## 웹훅 등록 (배포 후 1회)

```bash
curl -sS "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H 'content-type: application/json' \
  -d '{"url":"https://<이_프로젝트_도메인>/api/tg",
       "secret_token":"<TG_WEBHOOK_SECRET>",
       "allowed_updates":["message","callback_query"]}'
```

`chat_member` 는 넣지 않는다 — 입장 감지는 캡챠용이고, 캡챠는 Rose 담당이다.

## 점검

`GET /api/health` 하나로 대부분 가려진다. 값은 보여주지 않고 있다/없다와 마지막 시도 결과만 낸다.

`faqLast.note` 가 원인을 그대로 말한다:

| note | 뜻 | 할 일 |
|---|---|---|
| `ok` | 정상 | — |
| `no_source_url` | `FAQ_SOURCE_URL` 미설정 | 환경변수 넣고 Redeploy |
| `not_found_deploy_the_site` | 주소는 살아 있는데 `/api/faq` 가 없음 | 판매 사이트를 재배포 |
| `blocked_check_deployment_protection` | 401/403 — 사이트가 보호돼 있어 서버 간 호출이 막힘 | 아래 참조 |
| `network_or_bad_response` | 주소 오타·DNS·타임아웃, 또는 JSON 이 아닌 응답 | 주소를 브라우저에 직접 넣어 확인 |
| `unexpected_shape` | 응답 모양이 계약과 다름 | 사이트의 `/api/faq` contract 확인 |

봇 자체가 무응답이면 `getWebhookInfo` 의 `last_error_message` 를 본다 — 대개 Redeploy 누락이거나
시크릿 불일치다. `pending_update_count` 가 쌓이면 `/api/tg` 가 200 을 못 돌려주고 있다는 뜻이다.

### Deployment Protection 에 막힐 때

Vercel Authentication(SSO)이 켜져 있으면 `*.vercel.app` 주소는 **브라우저에서만** 열린다.
사람은 로그인 쿠키가 있어서 잘 보이는데 봇 서버는 401 을 받는다 — "나는 되는데 봇만 안 되는"
증상이 정확히 이것이다. 둘 중 하나로 푼다.

1. **판매 사이트의 보호를 끈다** — Settings → Deployment Protection → Vercel Authentication → Disabled.
   판매 페이지는 어차피 공개해야 하므로 보통 이쪽이 맞다.
2. **우회 토큰을 쓴다** — 같은 화면의 Protection Bypass for Automation 에서 시크릿을 발급받아
   `FAQ_BYPASS_TOKEN` 에 넣는다. 사이트는 비공개로 두고 봇만 읽게 할 때. (플랜에 따라
   제공되지 않을 수 있으니 화면에 그 항목이 있는지 먼저 확인할 것.)

## BotFather 설정

- `/setprivacy` → **Enable** (그룹에서 명령·멘션·봇 글 답글만 받는다)
- `/setcommands` →
  ```
  faq - 자주 묻는 질문
  schedule - 판매 일정과 현재 단계
  help - 사용법
  ```

## 개발

```bash
npm install
npm run dev          # 로컬은 웹훅을 못 받는다 — 배포된 Preview 로 테스트한다
```

봇 하나당 웹훅은 1개만 걸린다. 그래서 운영봇(`@wellbian_faq_bot`)과
개발봇(`@wellbian_faq_dev_bot`)을 따로 둔다.
