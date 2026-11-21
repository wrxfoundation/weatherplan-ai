# 원글 7 — "주소는 약속이다" (Identity Outlives the Incident)

**✅ 9/2 밤 검수 완료 → 9/3(수) 게시.** 8/25 초안을 9/2 규정(쉬운 언어 · 체인 비교 금지 · 시제 · 280자)에
맞춰 3트윗으로 재구성. 소재 원천은 그대로: xrpl_commons 빌더 팁 → 우리 실구조(라이선스 NFT 발행자 고정
검증 · 3년 라이선스)의 셀프 증언 완결판. 시그니처 "Identity outlives the incident."는 2r 답글(8/25)에서
선사용 → 이 원글에서 공식화. 디센트 고정 스레드("지갑 먼저")의 다음 장 — 프로필에서 고정 스레드 바로
아래에 놓이므로 본문에 "yesterday" 류 연결어는 넣지 않는다(에버그린 유지).

## 9/2 검수에서 바뀐 것

| 항목 | 8/25 초안 | 9/2 개정 | 근거 |
|---|---|---|---|
| 길이 | T1 334 · T2 306 | **T1 250 · T2 241 · T3 265** | 280자 실측 검수 |
| `On most chains, a leaked ops key breaks that promise.` | 있음 | **삭제** | 9/2 "우리 체인은 우리 집으로만 말한다, 비교·우열 금지" + 미검증 일반화(`most chains`) |
| `issuer address` · `ops key` · `Regular Keys and signer lists` | 전문 용어 3종 | **Regular Key 1회**, 그 앞에 설명문(`swap its signing key and keep its address`) | 9/2 어휘 규칙 — Web3 언어는 쓰되 쉬운 단어로 |
| in testing | 없음 | **보상 레이어 옆 1회** (`The rewards layer is still in testing. This part isn't`) | 시제 규칙 · 전날 고정 스레드 `The on-chain layer is in testing.` 과 정합 |
| `For a consumer device network` | 운영자 시점 | `For whoever owns a device` | 구매자 언어 |
| 이미지 | v2.1 클레이 지상 폭풍 | **v2.4 초현실 실사(첫 적용)** + v2.1 폴백(앰버 규칙 패치) | 9/2 레인 기준 "구조·개념 글에 오브젝트 하나면 v2.4" · 9/1 "유일한 색 → 유일한 차가운 색" |

## T1 (본문, 태그 포함 — 250자)

```
Each device comes with a three-year license. On the ledger it's an NFT, and it checks against one address: ours.

That address isn't a technical detail. It's a promise: whatever happens to our servers, the thing you own keeps verifying.

#DePIN #XRPL
```

## T2 (스레드 2번 — 241자)

```
The catch with any address: a key controls it, and keys can leak. On XRPL, an account can swap its signing key and keep its address — the feature is called a Regular Key.

So an incident costs us a key. Never the address, never what you own.
```

## T3 (스레드 3번 — 265자)

```
For whoever owns a device, that's the whole difference between "an incident voided your license" and "we rotated a key; nothing you own changed."

The rewards layer is still in testing. This part isn't — it's how XRPL accounts work.

Identity outlives the incident.
```

**시그니처 첫 독해 검사(9/2 승격 조건)**: T3 앞 두 문단이 "incident = 키 사고", "identity = 당신이 소유한
것"을 먼저 세우므로 비크립토 독자가 마지막 줄을 첫 독해에 받는다 → **통과, 공식화.** 이후 보안 축 발화의
앵커. (같은 자리의 쉬운 대안 `You can lose a key. You don't lose the address.` 는 답글용 변주로 보관 —
원글 시그니처는 2r 연속성을 위해 위 문장 유지.)

## 이미지 프롬프트 A (권장) — v2.4 초현실 실사, 폭풍이 지나간 새벽 거리

레인 근거: 구조·개념 글 + 오브젝트 하나(주소 = 건물 한 동). 9/2 클레이 계단 컷이 "모형이라 설명도처럼"
읽힌 뒤 신설된 레인의 **첫 게시 적용**. 5g(도시 야간)·디센트(라이트 글라스)와 연속 3일 레인이 다르다.
"유일한 차가운 색" 규칙: 앰버 창 두세 개를 배경에 두고 바이올렛이 가장 선명해야 한다.

```
Photograph, not a render. A quiet low-rise residential street at dawn, just after a storm: wet asphalt, fog drifting through, the last gusts still moving the mist, the sky graded grey — never blue. Ordinary buildings on both sides; two or three windows lit a muted, low-saturation warm amber, someone is already up; a bicycle under an awning. One impossible thing: a slim monolithic building of frosted translucent blue-violet glass (#4d4dce) stands in the row — seamless, no windows, no doors, glowing calmly from within, unmoved by the wind, its edges sharp while the fog moves past it. It casts a real shadow and lays one reflection on the wet street. 28mm, f/8, human scale, no landmarks, no signs, no text, no logos, no people, no devices. The violet is the only cold, saturated colour in the frame. The surrealism comes entirely from the object; the photograph itself is ordinary. 16:9
```

네거티브:
```
scale model, miniature, tilt-shift, diorama, clay, claymation, plasticine, 3D render look, CGI, illustration, violet stain inside the glass, bruise, smudge, neon, HDR, teal and orange grading, blue sky, bright orange windows, office tower with floors and windows, landmarks, signage, text, people, devices, debris, destruction
```

- 리롤 체크: ① 바이올렛 건물 정확히 1동, **이음선·층·창 없이 한 덩어리**(층이 보이면 "사무실 빌딩"이 되어
  주소=하나의 것 이라는 뜻이 죽는다) ② 안개가 건물 **앞을 지나가도 되지만** 건물 윤곽이 흐려지면 리롤
  ③ 앰버 창은 두세 개·저채도 — 밝은 주황이거나 넷 이상이면 산만 ④ 폭풍은 "지나간 궂은 날씨" — 잔해·
  파손이 보이면 리롤 ⑤ 간판·문자·랜드마크 ⑥ 사람 실루엣 ⑦ 하늘이 파랗게 나오면 바이올렛이 죽는다.
- 자기 점검: *사람이 산 흔적이 있는가?* (앰버 창·자전거) — 없으면 논지와 무관하게 리롤.
- 구도가 맞는데 색만 약하면 리롤 대신 후처리: 건물에 Color Overlay `#4d4dce` Soft Light 25~40%, 림에 Color 15%.

## 이미지 프롬프트 B (폴백) — v2.1 클레이, 지상 로우앵글 폭풍 변주 (앰버 규칙 패치)

A가 세 번 안에 안 잡히면 사용. 5e(조감+종이 기류)와 구도 차별화: 지상 로우앵글 + 지나가는 폭풍.
9/1 규칙 반영: "유일한 색" → "유일한 차가운 색", 백색 모형에 생활 조명을 남긴다.

```
Soft white architectural clay-model diorama, clean physically-based 3D render, low street-level camera looking slightly up, gentle depth of field. A quiet row of matte white model buildings under a passing storm: pale grey haze drifting through, a few white clay fragments and dust lifted by wind, the scene muted — but two or three small windows in the white buildings glow a soft, low-saturation warm amber. One slim building of frosted translucent blue-violet glass (#4d4dce) stands among them, glowing calmly from within — unmoved, edges sharp, untouched by the wind. Its glow spills softly onto the street. The violet glass building is the only cold, saturated colour in the scene. Premium fintech-editorial mood, generous negative space in the misty sky, no text, no logos, no people, no devices, 16:9
```

- 리롤 체크: ① 글라스 빌딩 정확히 1동·선명(안개·모션이 빌딩을 침범하면 리롤) ② 바이올렛 번짐 ③ 기기/사람
  침입 ④ 폭풍이 재난(파괴 잔해)처럼 보이면 리롤 ⑤ 앰버 창이 주황으로 튀면 리롤.

## 오버레이 (A·B 공통, 실폰트)

타이틀 `Identity Outlives the Incident` — 페이퍼로지. 색은 렌더 밝기 따라(안개로 밝으면 Deep Navy
#1b1b48 / 어두우면 화이트). wellbian 단독 워터마크 우하단. 그래픽 레이어 추가 없음.

## 게시 동선 (9/3 수)

- **시각**: 저녁 KST 21~23시 권장(미국 아침 · 5g와 같은 시간대). 9/3 예정인 에버노스 Q2 Liquidity Report
  공개 직후 1~2시간은 피한다 — 게시 시각 규칙("하루가 아니라 몇 시간을 옮긴다"). XRPL 타임라인이 리포트로
  덮이는 창을 비켜 간다.
- **고정**: 디센트 스레드 유지. 이 글은 고정하지 않는다(9/7 사전예약이 고정 차례).
- **인용·링크 없음**: 2r 답글이나 고정 스레드를 인용하지 않는다 — 프로필 배치가 연결을 대신한다.
- **게시 후 답글 대응**: "다른 체인도 되지 않나"류 반응에는 **비교 안 함** — `We only speak for our own
  house.` + 우리 구조 한 줄로 끝. "발행 주소가 어디냐" 질문에는 플랫폼 문서 안내 없이 `on the ledger,
  same address every settlement` 수준까지. 발행 법인 명칭·주소 문자열은 답글에 올리지 않는다.
- **로그 기입**: 게시 후 x-activity-log 게시 이력에 링크 + 사용 프롬프트(A/B) 기입.

## 린트 (9/2)

- 시세·수익·가격·수량·증정·얼리버드·제품명·실명·coin·캐시태그·CTA·링크 **0**. `sell`·`ship` 동사 없음
  (`Each device comes with` — 판매 시제 회피).
- 3년 라이선스·발행자 고정 검증 = 백서·플랫폼·FAQ 공개 사실(`whitepaper-site-consistency-0826` A3 일치).
- 체인 비교 없음. Regular Key 서술은 XRPL 공식 문서 수준의 사실("계정의 서명 키를 바꿔도 주소는 유지").
- `an incident voided your license` = 가정법. 특정 체인·경쟁사 지목 없음.
- `ours`(주소의 소유)만 쓰고 **발행 법인은 명시하지 않는다**(규제 검토 전).
- in testing 1회(보상 레이어). 정체성·주소 부분은 XRPL 계정 규칙이라 현재형 유지가 정직하다.
- 태그 세트 `#DePIN #XRPL`(크립토 담론 글). 2개 상한.

## 설계 의도

- 보안 축의 소비자 번역: "키 회전"(운영 용어) → "당신이 소유한 것은 아무것도 변하지 않는다"(구매자 언어).
  9/15 판매 직전·직후 구매자 신뢰 서사로 재사용 — **9/7 판매 랜딩 신뢰 블록**·가이드(T1+T3 그대로).
- 2r(답글)–7(원글) 세트가 rootveg444·2o(거버넌스 축)와 함께 "계정 보안·거버넌스에 정통한 빌더" 포지션
  축적 — 10월 해커톤(Commons) 관계 예열과 동일 방향.
- "지갑 먼저"(디센트, 9/2) → "지갑에 든 것이 왜 안 죽는가"(원글 7, 9/3) → "기계 고객"(5c, 9/4)의 3일 배열:
  온보딩 → 소유의 지속 → 데이터의 구매자.
