# 원글 7 — "주소는 약속이다" (Identity Outlives the Incident)

**원고 확정 대기 (2026-08-25 제안).** 게시 권장: **차주 수~목(9/2~3)** — 이번 주는 만석(수
enterprise stack · 목 5c · 금 5e), 차주 월~화는 5d(열중증 시즌 페그). 에버그린이라 유연하되
**2r 답글(8/25 xrpl_commons Regular Key, 예열)의 연결이 식기 전** 차주 중반 권장.
소재 원천: xrpl_commons 빌더 팁 → 우리 실구조(라이선스 NFT Issuer 고정 검증 · 3년 라이선스)의
셀프 증언 완결판. 시그니처 "Identity outlives the incident."를 답글에서 테스트 → 원글에서 공식화.

## T1 (본문, 태그 포함)

```
Our license NFTs verify against one issuer address, and each license
runs for three years. That address isn't a technical detail — it's a
promise: whatever happens to our servers, the thing you own keeps
verifying.

On most chains, a leaked ops key breaks that promise. On XRPL, you
rotate the key and the address stays.

#DePIN #XRPL
```

## T2 (스레드 2번)

```
This is what Regular Keys and signer lists actually buy: an incident
costs you a key, never your identity. For a consumer device network
that's not an ops convenience — it's the difference between "an
incident voided your license" and "we rotated; nothing you own
changed."

Identity outlives the incident.
```

시그니처 확정: **"Identity outlives the incident."** (2r 답글에서 선사용 — 반응 좋으면 본 원글로
공식화, 이후 보안 축 발화의 앵커)

## 이미지 프롬프트 (에디토리얼 v2.1 — 클레이+바이올렛 글라스, 지상 앵글 폭풍 변주)

5e(금)의 조감+종이 기류와 구도 차별화: 지상 로우앵글 + 지나가는 폭풍. 모티프 동일(바이올렛
글라스 = 원장/정체성) — 시리즈 비주얼 언어의 2회차 반복이 의도.

```
Soft white architectural clay-model diorama, clean physically-based
3D render, low street-level camera looking slightly up, gentle depth
of field. A quiet row of matte white model buildings under a passing
storm: pale grey haze drifting through, a few white clay fragments
and dust lifted by wind, everything muted and colorless. One slim
building of frosted translucent blue-violet glass (#4d4dce) stands
among them, glowing calmly from within — unmoved, edges sharp,
untouched by the wind. Its glow spills softly onto the street.
The violet glass building is the only color in the scene. Premium
fintech-editorial mood, generous negative space in the misty sky,
no text, no logos, no people, no devices, 16:9
```

- 리롤 체크: ① 글라스 빌딩 정확히 1동·선명(안개·모션이 빌딩을 침범하면 리롤) ② 바이올렛 번짐
  ③ 기기/사람 침입 ④ 폭풍이 재난(파괴 잔해)처럼 보이면 리롤 — "지나가는 궂은 날씨" 수준이 정답.
- 오버레이(실폰트): 타이틀 `Identity Outlives the Incident` — 페이퍼로지. 색은 렌더 밝기 따라
  (밝으면 Deep Navy #1b1b48 / 안개로 어두우면 화이트) · wellbian 단독 워터마크 우하단.

## 린트

시세·수익·가격·제품명·실명·coin 없음. 라이선스 NFT·3년·Issuer 검증 = 플랫폼·FAQ 공개 사실.
"an incident voided your license"는 타 체인 가정법(우리 사고 서술 아님). Regular Key·signer list
기능 서술은 XRPL 공식 문서 수준의 사실.

## 설계 의도

- 보안 축의 소비자 번역: "키 회전"(운영 용어) → "당신이 소유한 것은 아무것도 변하지 않는다"
  (구매자 언어). 9/15 판매 직전·직후 구매자 신뢰 서사로 재사용 가능(판매 랜딩 신뢰 블록·가이드).
- 2r(답글)–7(원글) 세트가 rootveg444·2o(거버넌스 축)와 함께 "계정 보안·거버넌스에 정통한 빌더"
  포지션 축적 — 10월 해커톤(Commons) 관계 예열과 동일 방향.
