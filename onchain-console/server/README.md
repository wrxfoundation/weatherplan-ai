# 채널 연동 수집기 — 실행 순서

외부 라이브러리 없이 Node 18+ 만으로 동작합니다. 설치할 것 없습니다.

## 0. 준비 (한 번만)

1. BotFather에서 봇 생성 → 토큰 확보
2. **봇을 공지 채널·대화방의 관리자로 추가** (구독자 수 조회·초대 링크 생성에 필요)
3. `cp server/.env.example server/.env` 후 값 채우기

```bash
export $(grep -v '^#' server/.env | xargs)   # 또는 각자 쓰는 방식으로 로드
```

## 1. 초대 링크 생성 — 오늘 바로

```bash
node server/bootstrap-invites.mjs
```

**이게 가장 급합니다.** 텔레그램은 "어느 경로로 들어왔는가"를 초대 링크로만 구분합니다.
링크를 미리 나눠 두지 않으면 이미 들어온 사람의 유입원은 **사후 복원이 불가능**합니다.
채널을 이미 여셨으니, 링크를 뿌리기 전에 지금 만들어 두어야 손실이 최소화됩니다.

생성 후 `node server/bootstrap-invites.mjs --print` 로 목록을 보고,
각 링크를 **정해진 위치에만** 사용하세요(X 프로필에는 `x_profile` 링크만, 랜딩에는 `landing` 링크만).
섞어 쓰면 집계가 무의미해집니다.

## 2. 지표 수집 — 주기 실행

```bash
node server/collect.mjs
```

구독자 수를 스냅샷해서 `server/data/daily/YYYY-MM-DD.json` 에 일별 최종값으로 남기고,
프론트가 읽는 `public/live/community.json` 을 만듭니다.

크론 예시 — 매시 정각:
```
0 * * * * cd /path/to/onchain-console && node server/collect.mjs >> /var/log/kw-collect.log 2>&1
```

## 3. 웹훅 — 유입원 분해가 필요할 때

공개 HTTPS URL이 있어야 합니다. 없으면 2번만으로도 구독자 추이는 쌓이고,
유입원 분해만 비어 있게 됩니다(화면에도 "웹훅 미가동"으로 정직하게 표시됩니다).

```bash
node server/webhook.mjs                # 수신 대기 (:8787)
node server/webhook.mjs --register     # 텔레그램에 URL 등록
```

`chat_member` 는 `allowed_updates` 에 **명시해야** 옵니다. 기본값에 없습니다 —
이걸 빠뜨리면 가입 이벤트가 영영 오지 않습니다. 스크립트에는 이미 넣어 두었습니다.

## 수집하지 않는 것

- **대화방 메시지 원문**: 저장하지 않습니다. 응대 지표에 필요한 건 발생 시각과 방 정보뿐입니다.
  원문을 저장하려면 개인정보 처리방침에 수집 항목·보관 기간을 먼저 명시해야 합니다.
- **사용자 프로필**: 중복 판정용 ID 외에는 남기지 않습니다.
- **X 지표**: 팔로워·팔로잉·좋아요한 사람 조회는 엔터프라이즈 전용이라 자동 수집이 불가능합니다.
  팔로워 수만 `X_FOLLOWERS_MANUAL` 로 수동 입력할 수 있고, X 기여도는
  프로필에 건 초대 링크(`x_profile`)와 UTM 유입으로 측정합니다.

## 보안

- 토큰은 `server/.env` 에만 둡니다. `.gitignore` 에 이미 넣었습니다.
- 프론트엔드는 `public/live/community.json`(집계 결과)만 읽습니다. 토큰이 브라우저로 나가지 않습니다.
- `server/data/` 도 커밋하지 않습니다(초대 링크 URL과 이벤트 로그가 들어갑니다).
