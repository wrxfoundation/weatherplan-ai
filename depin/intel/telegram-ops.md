# 텔레그램 커뮤니티 운영 — @wellbiantalk

## 무엇이 어디에 있나

| 채팅 | 성격 | 들어가 있는 것 |
|---|---|---|
| `@wellbiantalk` | 공개 그룹 · 대화 | Rose(관리자) · @wellbian_faq_bot(일반 멤버) |
| `@wellbianlabs` | 채널 · 공지 전용 | 없음 |
| `@wellbian_faq_bot` | FAQ 봇 | `depin/site/wellbian-telebot` 배포본 |

역할이 갈린다 — **입장·질서는 Rose, 지식·안내는 FAQ 봇.** 봇은 관리자 권한이 없고 필요하지도 않다.
겹치는 기능이 없어 같은 그룹에서 나란히 돈다.

## Rose 설정 (2026-08-30 서우 · Claude 동행)

정본은 `telegram-rose-export-0830.json`. 아래는 왜 그 값인지다.

| 항목 | 값 | 근거 |
|---|---|---|
| 캡챠 | on · **math** · 킥 1시간 | 8/30 확인 결과 **캡챠가 아예 꺼져 있었다.** 공개 그룹인데 입구 방어가 0이었다. button 모드는 스팸 봇이 그냥 뚫어 math 로 올렸고, 숫자라 언어를 타지 않는다(한·영 혼재 커뮤니티) |
| 킥 시간 | 1시간 (기본 5분에서 상향) | 스팸 봇은 시간을 얼마로 주든 못 푼다. 이 값이 정하는 건 "알림을 늦게 본 사람에게 몇 분을 주느냐"뿐이다. 킥은 밴이 아니라 재입장이 된다 |
| 캡챠 버튼 문구 | `눌러서 인증하기 · Verify` | 언어를 ko 로 바꿔도 이 값은 따로라 영어로 남아 있었다 |
| Locks | `bot` · `invitelink` | `bot` 이 제일 급했다 — 잠그지 않으면 누구나 그룹에 봇을 심을 수 있고, 판매 직전 가장 흔한 침투 경로다. `url`·`forward` 는 **일부러 열어 뒀다**: 사이트·거래소·XRPL 링크를 계속 주고받아야 한다 |
| Antiflood | 8건 → mute | 5는 짧게 여러 줄 쓰는 사람을 잡고 10은 이미 늦다. 도배는 대개 악의가 아니라 신남이라 킥·밴이 아닌 뮤트 |
| Clean Service | 전부 on | 캡챠가 도니 입퇴장이 잦아진다. 안 켜면 9/7 에 공지가 입장 알림에 묻힌다 |
| Welcome | 한국어 · `should_clean: true` | 환영문은 **그룹 전체에 보인다**. clean 을 켜야 최신 하나만 남아 도배되지 않는다 |
| 언어 | ko | 캡챠 안내·통과 문구까지 한국어로 나오는 것을 재입장 테스트로 확인 |
| 경고 | 3회 → **mute** | 기본값이 `ban` 이었다. 경고 세 번에 영구 밴은 과하고, 실수로 걸면 되돌리기 어렵다 |
| 퇴장 인사 | 끔 | 판매 커뮤니티에서 "나갔습니다"가 반복되면 부정 신호만 증폭한다 |
| Rules | 5줄 · `captcha_rules: true` | 캡챠 통과 직후 자동으로 뜬다. 안 켜면 아무도 `/rules` 를 치지 않아 규칙이 있으나 마나다. 3번(시세·수익 예측 자제)은 우리 발화 규칙을 커뮤니티 규칙으로도 세운 것이다 — 우리가 한마디도 안 해도 그런 대화가 돌면 그룹 자체가 수익을 약속하는 자리로 읽힌다 |
| Log Channel | `wellbian :: log` (비공개) | 캡챠 실패·킥·뮤트·경고가 기록된다. 공지 채널과 섞지 않는다 |

환영문에 세 가지만 담았다 — ① 지금 왜 말을 못 하는지 ② 궁금하면 어디로 가는지(FAQ 봇)
③ 사칭 경고. 길면 아무도 안 읽는다.

## 아직 손대지 않은 것

| 항목 | 현재 | 해야 할 일 |
|---|---|---|
| AntiRaid | 자동 감지 `0` (꺼짐) | **9/7 접수 오픈 직전에 켠다.** X 에 판매 공지가 나가는 순간이 가장 위험하다. 상시로 켜면 정상 유입도 막힌다 |
| Blocklists | `nothing` | 9/7 전에 좁게: `seed phrase · 복구 문구 · 니모닉 · private key · 개인키` 만. 조치는 삭제가 아니라 경고 — 진짜 사기일 수도 있지만 "복구 문구를 물어보면 사기인가요?"라고 묻는 신규 멤버일 수도 있다. **"에어드랍·지갑·클레임"은 넣지 않는다** — 우리가 계속 쓸 단어라 정상 대화가 먼저 막힌다 |
| Approval | 없음 | 지금은 참가자가 모두 팀·지인이라 불필요. **9/7 이후 합류하는 팀원·파트너는 승인해야** lock 에 걸리지 않는다 |

## 9/15 판매 당일에만

슬로우 모드 30초 · AntiRaid 강화 · 핀 메시지를 판매 안내로 교체.

## 복원 절차

Rose 와 1:1 에서 `/connect @wellbiantalk` → `telegram-rose-export-0830.json` 을 첨부해 `/import`.
설정을 바꿀 때마다 `/export` 로 이 파일을 갱신할 것 — 갱신하지 않으면 복원본이 옛 상태로 되돌린다.

## 파트너십 공지 템플릿 (9/2 디센트 — 첫 사용)

**역할 분리**: 공지는 **채널**, 톡방엔 **링크 한 줄**. X 스레드가 정본이고 텔레그램은 그 링크를 나른다.
**채널에는 "보상 레이어는 테스트 중" 한 줄을 반드시** — X 는 T3 에서 말하지만 채널만 보는 사람은 범위 문장의
"보상 모델"만 보게 된다.

### 채널 (국문·영문 병기)
```
📌 케이웨더 × 디센트 MOU 체결

웰비안의 기술 협력사이자 센서를 만드는 날씨 회사 케이웨더가 하드웨어 월렛 디센트(아이오트러스트)와
기술 협력 MOU를 체결했습니다.

협력 검토 범위: 장비 등록 · 관측 데이터 수집 · 보상 모델 · 지갑 활용 등
사용자 흐름 설계. 보상 레이어는 테스트 중입니다.

기기는 이미 있습니다. 이번 협약은 기기를 산 다음에 일어나는 일에 관한 것입니다.

전체 내용 → [X 링크]

—

📌 KWeather × D'CENT MOU

KWeather — our technology partner, the weather company that makes our sensors —
has signed an MOU with D'CENT (IoTrust), the self-custody hardware wallet.

In scope: device registration, data collection, the reward model, and
where a wallet sits in that flow. The reward layer is in testing.

The hardware already exists. This is about what happens after you buy one.

Full thread → [X link]
```

### 톡방
```
Partnership news is up — KWeather × D'CENT. Thread here: [X link]

Short version: the wallet before the token. Questions welcome.
```
`Questions welcome` 은 의도적 — 수익·배송 즉답 문구가 준비돼 있으므로 질문을 받아도 된다.

## 소개 문구·핀 운용 원칙 (9/2 확정 — 디센트 공지 계기)

### 설명(description)에 파트너십을 넣지 않는다
설명은 **정체성**, 파트너십은 **뉴스**. MOU 는 검토 단계인데 설명에 박히면 시간이 지나도 남아 검토를
정체성으로 승격시킨다 — 로드맵 함정. 설명에는 **무엇을 하는지 + 길찾기**만.

### 채널 설명 (255자 제한) — 9/1 미완 항목(talk·X 링크) 처리
```
wellbian 공식 공지 · Official announcements
실내 공기를 측정하고, 검증된 데이터가 XRPL 보상이 됩니다 (테스트 중).
대화 @wellbiantalk · FAQ @wellbian_faq_bot · X x.com/wellbianlabs
```

### 톡방 설명
```
wellbian 커뮤니티 대화 · Community chat
공지 @wellbianlabs · FAQ @wellbian_faq_bot · X x.com/wellbianlabs
운영진은 먼저 DM하지 않습니다 · Staff never DM first
GA = Good Air 🌤
```

### 핀은 길찾기 전용 — 파트너십 공지는 핀하지 않는다
채널은 공지 전용이라 **최신 글이 곧 공지**. 핀은 "어디로 가야 하나"용이고(9/1 캡챠 혼란의 산물)
묻히면 안 된다. **핀할 차례 = 9/7 사전예약 공지**(행동 유도 글). 그때 길찾기 핀은 유지하고 두 번째
핀으로 얹는다.

### 공지 포스트 형식
락업 이미지(X 와 동일) + 캡션(국·영 병기, 캡션 제한 1024자 — 약 600자로 여유).

## 톡방 인사말 · 응대 문구 (9/2 신설)

### `GA (= Good Air)` — 커뮤니티 인사말 확정

크립토 씬의 `GM (Good Morning)` 을 우리 주제로 비튼 것. 9/2 첫 사용에서 상대가 즉시
`GA my bro` 로 받았다 — **작동 확인.** 앞으로 톡방 인사는 이것으로 통일한다.
커뮤니티 고유 인사말은 초기 커뮤니티의 몇 안 되는 자산이므로, 변형하지 말고 반복해서 굳힌다.

### 신규 입장자 응대 (기본형)

```
GA 🌤 You're the first to use it — guess it's official now.

This room's for people who want to actually see their air, not just
read about it. Sensors first, the rest after.

Where are you based? Curious what your air is doing today.
```

- `Sensors first, the rest after` = 순서를 부드럽게 심고 기대치를 미리 정리하는 문장.
- 마지막 질문이 대화를 **측정 축**으로 끌어온다 — 인사만 주고받다 끝나는 것을 막는다.
- 첫 사용자라는 사실은 그때만 쓴다. 이후에는 첫 줄만 `GA 🌤` 로.

### 즉답 문구 — 수익 질문

톡방은 실시간이라 문구를 미리 굳혀둔다. **수익·금액 발화 금지선을 지키면서 회피처럼 보이지 않는
유일한 방법은 정직하게 이유를 말하는 것.**

```
Honest answer — we don't talk numbers on rewards. That layer is
still in testing, and neither the amount nor the value is guaranteed.

What we can be concrete about is the device itself: a certified
air-quality monitor that does its job whether or not any of that lands.
```

### 즉답 문구 — "What's the narrative?" (9/2, 첫 사례: 나이지리아 KACHI)

크립토 문법에서 `narrative` 는 **가격 서사**를 묻는 말. 서사는 그대로 주되 **숫자는 안 붙인다는 것을
이 답에서 미리 못박는다.** 두 메시지로 나눠 보내는 것이 채팅에서 자연스럽다.

```
The narrative, in plain words: almost nobody measures indoor air, and
most of what exists is self-reported. We make a certified sensor people
buy for their own room — CO₂ first — and the readings get verified
before they go anywhere.

The on-chain part, rewards on XRPL for verified data, is in testing.
We don't put numbers on it.

If you want it in one word: measured. The internet argues about air all
day. Almost none of it is measured indoors.
```

### 즉답 문구 — 해외 이용자 "내 공기는?" (9/2)

**먼저 정직하게 못 한다고 말한다.** 센서는 실내용이고 지금 한국에만 있다. 얼버무리면 뒤의 질문이 전부 꼬인다.

```
Honest answer on your air: can't tell you yet. Our sensors are indoor
units, and right now they live in Korean homes and offices — that's
where they're certified and sold. Nothing on our side measures [country]
today.
```

### ⚠️ 답 미확정 — "해외 배송 되냐" (9/2, 서우 결정 필요)

해외 이용자가 서사를 물었으면 다음 질문은 배송이다. **9/7 전에 답이 있어야 톡방이 안 흔들린다.**
확정 전 임시 답:

```
Korea first — that's where the sensors are certified. International
isn't announced, and I'd rather not guess at it here.
```

- 톡방 첫 해외 구성원 = 나이지리아(9/2). 방 언어는 이미 영어. 해외 유입은 계속 온다고 전제.

### 즉답 문구 — 가격·구매 시점 질문

```
Pre-registration opens Sept 7. Pricing goes public with it —
not being coy, it's just not announced yet.
```

- **9/7 이전 절대 금지**: 가격 숫자 · 수량 · 증정분 · 얼리버드 명칭.
- 답을 미루는 것이 아니라 **아직 공개 전이라는 사실**을 말한다(회피 인상 방지).

## FAQ 봇의 CS 인박스

정본에 없어 답하지 못한 질문은 `wellbian :: cs` 채널로 넘어간다(`TG_CS_CHAT`).
그 채널이 곧 FAQ 에 추가할 항목 목록이다. 자세한 동작은
`depin/site/wellbian-telebot/README.md` 참조.

## 운영 메모

- Rose 명령은 **`!` 접두사**도 받는다(`!locks`). FAQ 봇과 `/help` 가 겹치므로 그룹에서는 `!` 를 쓴다.
- 여러 줄을 한 메시지로 보내면 텔레그램은 **첫 줄만 명령으로** 읽는다. 단, `/setwelcome` 처럼
  뒤 내용 전체를 인자로 받는 명령은 예외다.
- 캡챠는 **Rose 와 신규 입장자의 1:1 창**에서 진행된다. 그룹 버튼을 눌러 넘어가는 구조라,
  안내 문구가 영어면 여기서 이탈이 난다(그래서 언어를 ko 로 바꿨다).

## 그룹 대화 관찰 (8/30)

BotFather `/setprivacy` → Disable 로 봇이 그룹의 일반 메시지를 받는다.
적용하려면 봇을 그룹에서 뺐다가 다시 넣어야 한다(텔레그램 제약).

**남기는 것**
- 질문으로 보이는 말 · 사고를 알리는 말(사기·해킹·도난 등) → 원문 보관, `kind: "group"`
- 그 밖의 말 → 시간·주제·어조 개수만(`cs:beat`). 원문을 남기지 않아 되돌려 누가
  무슨 말을 했는지 알 수 없다.
- 봇이 보낸 말과 명령(`/...`)은 세지 않는다 — Rose 안내까지 대화로 잡히면 주제
  분포가 통째로 틀어진다.

**답장하지 않는다.** 그룹 대화에 끼어들면 그룹이 망가지고, 그건 여기서 얻는 것보다 크다.

### 그룹 규칙에 넣을 고지 (Rose `/setrules`)

한국어
> 이 그룹의 대화는 운영 개선을 위해 집계됩니다. 질문과 안전 관련 신고는 담당자가
> 확인할 수 있도록 원문이 보관되며, 그 밖의 대화는 시간·주제·분위기 통계로만
> 집계되고 원문은 저장하지 않습니다.

English
> Conversations in this group are aggregated to improve support. Questions and
> safety reports are kept in full so the team can act on them; everything else is
> counted only as time, topic and tone statistics, with no message text stored.

## 유입 경로 (8/30 확정)

공지 채널 `wellbian :: official` 에 토론 그룹으로 `wellbian :: talk` 이 연결돼 있다.
게시물마다 "댓글 남기기" 가 뜨고, 누르면 talk 으로 들어가 댓글을 단다 — 채널 구독자가
그룹 참여자로 넘어오는 주 통로다.

부작용 둘.
- 채널 게시물이 talk 으로 자동 전달된다. 그것까지 대화로 세면 공지를 올릴 때마다
  말수가 부풀고 주제 분포가 흔들려서, `is_automatic_forward` 를 세는 대상에서 뺐다.
- 댓글을 달려면 그룹 참여가 필요하다. Rose 캡챠가 켜져 있으면 새로 들어온 사람은
  캡챠를 풀기 전까지 말을 못 한다 — **9/7 전에 다른 계정으로 실제 댓글을 달아 확인할 것.**
  막히면 방어(봇 차단)와 유입 사이에서 골라야 한다.

## QR·첫 진입점 (9/1 확정)

인쇄물·부스 QR 은 **공지 채널** 로 보낸다. talk 이 아니다.

| | 채널 | talk |
|---|---|---|
| 진입 | 탭 한 번 | 캡챠 → Rose 1:1 → 수식 |
| 공지 도달 | 거의 전원 | 대화에 묻힘 |
| 질문 | 못 함 → DM 사칭 위험 | 바로 가능 |

현장 QR 은 서서 5초 안에 결정하는 자리라 2단계 캡챠에서 이탈이 난다. 논리도 어긋난다 —
캡챠는 스팸 봇을 막으려고 켠 것인데, 부스에 와서 QR 을 찍는 사람은 이미 물리적으로
검증된 사람이다. 마찰만 남고 얻는 게 없다. 9/15 판매 시각 공지가 전원에게 닿아야 한다는
점에서도 채널이 압도적이다.

채널이 막다른 길이 되지 않게 핀을 세 갈래로 세웠다(아래). 토론 그룹은 이미 붙어 있어
게시물마다 「댓글 남기기」 로 talk 으로 넘어간다.

QR 은 용도별로 나누지 않고 하나로 통일한다 — 나누면 인쇄물마다 어느 링크를 넣었는지
관리해야 하고, 채널 안에서 갈라주면 된다. **QR 아래에 채널명을 텍스트로 병기할 것**
(조명·반사·구형 폰으로 안 찍히는 경우가 현장에서 잦다).

### 채널 핀 문구 (9/1 개정)

```
📌 wellbian 안내

· 공지 — 이 채널에만 올라갑니다
· 대화·질문 — @wellbiantalk
· 자주 묻는 질문 — @wellbian_faq_bot 을 눌러 1:1 시작
  /faq — 자주 묻는 질문
  /schedule — 판매 일정과 현재 단계

⚠️ 운영진은 먼저 DM을 보내지 않습니다.
지갑 복구 문구를 묻는 사람은 100% 사칭입니다.

— Announcements here · Chat @wellbiantalk · FAQ @wellbian_faq_bot
Staff never DM you first. Never share your seed phrase.
```

이전 핀은 FAQ 봇만 안내해 채널에 착지한 사람이 talk 으로 갈 길이 글에 없었다. 또
"답이 준비되지 않은 질문은 **이 그룹으로** 안내드립니다" 가 채널에서 읽히면 어디를
말하는지 모호했다(채널은 그룹이 아니고 이름도 적혀 있지 않았다).

들여쓰기 정렬은 쓰지 않는다 — 모바일은 가변폭이라 공백으로 맞춘 정렬이 어긋나 보인다.
채널 메시지는 **편집해도 고정이 유지**되므로 새 글로 올리지 말고 기존 글을 고친다.
핀만으로는 부족해 **채널 설명(description)에도 talk 링크**를 넣는다 — 채널에 처음
들어오면 최근 글이 먼저 보이고 핀은 접혀 있다. 9/7 접수 오픈 직전에 이 문구를 새 글로
한 번 더 흘려 최신 글로도 보이게 한다.

## "캡챠가 안 뜬다" 신고를 받으면 (9/1)

**먼저 어느 방에 들어갔는지 묻는다.** 채널에는 캡챠라는 개념이 없고 Rose 도 없다.
9/1 에 실제로 이 신고가 왔고, 원인은 확인을 부탁한 사람이 공지 채널에만 들어가고
talk 에는 들어가지 않은 것이었다. 설정도 권한도 정상이었다.

1. **어느 방인가** — 채널이면 여기서 끝난다
2. `!welcome` — 캡챠 on/off · mode · 킥 시간
3. Rose 관리자 권한 중 **사용자 차단(Ban users)** — 캡챠는 새 멤버를 뮤트했다 푸는
   구조라 이게 꺼져 있으면 조용히 멈춘다. 그런데 `!welcome` 은 여전히 `true` 를
   보여주므로 **설정만 봐서는 못 찾는다**. 텔레그램 UI 에서 직접 확인해야 한다
4. **입장 경로** — 관리자가 연락처에서 직접 추가(Add member)하면 Rose 는 보증된
   것으로 보고 캡챠를 건너뛴다. 버그가 아니라 정상 동작이다

재현은 **그룹과 무관한 새 계정으로 초대 링크를 눌러 직접 입장**해야 한다. 관리자가
추가하는 방식으로 테스트하면 원인과 무관하게 계속 안 떠서 계속 헛짚게 된다.

멤버 목록에서 이름 옆에 뜨는 「추방」은 상태 배지가 아니라 **커서를 올렸을 때 나오는
액션 버튼**이다. 배지(소유자·관리자)가 있는 행에는 가려서 안 보인다.
