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
| `TG_DEFAULT_LANG` | `ko` (기본) 또는 `en` | 텔레그램이 사용자 언어를 알려주지 않을 때 쓸 언어 |
| `TG_CS_CHAT` | 운영 채널의 숫자 ID (`-100…`) | 답하지 못한 질문을 흘려보낼 곳. 미설정이면 아무 데도 보내지 않는다 |

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

## CS 인박스

정본에 없어서 답하지 못한 질문을 `TG_CS_CHAT` 채널로 보낸다. 그 채널이 곧 FAQ 에 추가할
항목 목록이고, 판매 기간 문의가 아무 기록 없이 지나가는 것을 막는다.

```
❓ 답변 없음 · 예매
"바우처 수락 기한이 언제까지예요?"
— @someone · ko · 1:1 · 14:52 KST
```

주제는 키워드로 태깅한다(`lib/cs.ts`) — 예매·결제·지갑·기기·보상·멤버십·일정·기타.
LLM 을 부르지 않는 이유는 둘이다: 답을 지어낼 위험이 없고, 문의가 몰리는 순간에
지연도 비용도 늘지 않는다.

**후보를 보여준 것은 답한 것이 아니다.** 키워드가 겹치면 관련 없는 질문에도 FAQ 후보가
뜨는데("바우처 수락 기한" → "바우처를 수락하지 않으면"), 그대로 두면 정작 정본에 없는
질문이 후보 뒤에 숨어 CS 인박스에 잡히지 않는다. 그래서 후보 목록 맨 아래에
**"찾는 답이 없어요"** 버튼을 둔다. 누르면 그때 CS 채널로 넘어간다.

원문은 후보 메시지의 첫 줄에 따옴표로 담아 둔다 — 서버리스라 저장할 데가 없고 콜백
데이터는 64바이트라, 메시지 자체가 저장소 역할을 한다(텔레그램이 콜백에 원본을 실어 준다).

집계·감정분석·답변추천이 있는 대시보드는 저장소를 붙여야 한다. 그때 이 채널을 읽어
과거분까지 채울 수 있다 — 채널이 append-only 로그다.

## 언어

텔레그램의 `language_code` 는 선택 항목이라 오지 않을 때가 있다(그룹에서 실제로 빠져서 왔고,
그 바람에 한국어 그룹에 영어 답이 나갔다). 값이 없으면 `TG_DEFAULT_LANG` 을 쓰고, 목록 화면
맨 아래에 언어 전환 버튼을 둬서 자동 판별이 틀려도 사용자가 직접 바꿀 수 있게 했다.
