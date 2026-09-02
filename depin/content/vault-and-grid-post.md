# 원글 후보 — 「금고와 격자」 (Vault and Grid) · 이미지 역산 원고

**2026-09-02, 서우: "역으로 이 이미지에 맞춰서 X 원고를 짜줘".** 레퍼런스 = 유리 금고 속 무지개빛 바 더미 + 유리 문으로 흘러나오는
무지개 액체 + 발광 격자 바닥. 이 그림은 그대로 두면 **"자산·금괴"** 로 읽힌다(데이터를 asset 이라 부르지 않는 규칙과 충돌). 그래서
원고는 그림을 **"이미 있던 것을 옮기는 일"의 초상**으로 읽고, 우리는 그 옆의 다른 일로 세운다 — 상비 앵글 「옮기는 것 vs 만드는 것」의
원글판. 주장 한 줄만 쓰고 **증명(세 시점 실험·$4B 대비)은 키노트 전용**으로 남긴다.

**이미지 = 우리 제작(서우 확인) → 사용 가능.** 서우 지시: "보라색 반투명 느낌이 포인트로". **포인트 위치가 곧 주장**이라 바이올렛을
어디에 두느냐가 원고와 맞물린다 — 원고에서 **바 = 이미 있던 것(남의 일)**, **격자 = 방들의 세계(우리 무대)** 이므로 바이올렛은
**격자 이음새 + 게이트 프레임 + 금고 림**에 두고, **바는 투명 그대로**(바를 보라로 칠하면 "원래 있던 것"이 우리 색이 되어 T1이 꼬인다).
흐름(무지개)은 파스텔로 낮추되 남긴다. 방법은 아래 후처리 레시피(빠름) 또는 img2img 프롬프트 J(같은 구도 재생성). 프롬프트 I(기기 추가판)는 대안으로 보존.

## T1 (본문, 이미지 첨부 — 245자)

```
This is what tokenization looks like: something that already had a price, moved onto a grid. Useful. But every bar in that vault existed before the ledger did.

The air in a bedroom doesn't. It isn't data until someone measures it.

#DePIN #XRPL
```

## T2 (269자)

```
Two jobs on a ledger. Moving what exists: custody, settlement, the bars. Making what doesn't: the record a sensor writes when nobody else was counting.

Most of crypto does the first. We do the second, in Korean homes, one room at a time. The ledger side is in testing.
```

## T3 — 시그니처 단독 (111자)

```
Most of crypto moves value that already exists. We make the record that didn't exist until someone measured it.
```

## 게시 슬롯

하루 1원글. 9/3 원글 7 · 9/4 5c · 9/5 플레어 · 9/6 5f · 9/7 사전예약 · 9/8 원글 6(왜 RLUSD인가) 이 차 있음 → **9/9(화) 이후 첫 빈 슬롯**,
또는 10/3 키노트 2주 전(9/19~) 바닥깔기용으로 보류. 에버그린이라 급하지 않다. 태그 `#DePIN #XRPL`. 링크·CTA·제품명 없음.

## 린트

- 시세·수익·가격·수량·coin·캐시태그 0. `asset` 미사용(바를 "already had a price" 로만 서술).
- 토큰화·RWA 를 폄하하지 않음 — `Useful.` 한 단어로 인정 후 구분. 체인 비교 없음.
- 시제: 센서의 측정 = 현재·완료형(`We do the second, in Korean homes`), 온체인 = `The ledger side is in testing.`
- `first`·`only`·"반 발짝" 없음. 시그니처는 상비 3줄 중 2번(플레이북 등재분) — 답글 선소진 이력 확인 후 게시.
- 비크립토 독자 첫 독해: "금고의 바는 원래 있던 것 / 침실 공기는 재기 전엔 데이터가 아니다" — 통과.

## 이미지 프롬프트 I — 금고와 격자, 브랜드 판 (16:9)

```
Isometric render of a clear glass vault box resting on a floor of white square tiles whose seams glow a soft violet, the tile floor extending past every edge of the frame. Inside the vault, a neat stack of clear glass bars with subtle prismatic edges, like something already counted and stored. Through a clear glass gate at the front, a broad iridescent stream flows out of the vault and across the tiles, its rainbow kept soft and pastel. Some distance away on the same floor, one small tabletop indoor air monitor of clear translucent Wellbian Violet glass (#4d4dce) stands on its own tile — rounded-square slab, slim clear kickstand at the back, vent slots on the right edge, blank softly glowing screen — and from its base a thin new stream of violet light begins along the seams, a stream with no vault behind it. Pale grey-white studio void, soft shadowless lighting, gentle depth of field, physically-based 3D render, octane look, clean and minimal, no text, no logos, no UI, no numbers, no coins, no gold, no people, 16:9
```

네거티브:
```
gold, golden bars, ingots coloured gold, coins, currency symbols, tokens, text, numbers, readings, icons, UI, logos, cyan glow, neon, HDR, oversaturated rainbow, frosted matte, opaque, people, hands, blurry
```

- 리롤 체크: ① 바가 금색이면 리롤(유리여야 "이미 있던 것"이지 "돈"이 아니다) ② 우리 기기가 금고 안에 들어가면 리롤 — **금고 밖, 자기 타일 위**
  ③ 기기의 새 흐름이 금고의 큰 흐름과 합쳐지면 리롤 — 별개의 가는 줄기 ④ 화면 숫자 리롤 ⑤ 무지개는 금고 흐름 하나 + 기기 줄기(바이올렛)뿐.
- 오버레이: 우하단 wellbian 단독 워터마크. 타이틀 없음(원글 첫 문장이 타이틀 역할).

## 바이올렛 포인트 — 후처리 레시피 (기존 이미지 그대로, 10분)

1. **격자 이음새**: Hue/Saturation → Cyans·Blues 선택 → Hue +65 (시안 → 바이올렛 `#4d4dce` 근처), Saturation −10. 게이트 가까운 이음새만
   Curves 로 살짝 밝게 → 빛이 게이트에서 퍼지는 위계.
2. **게이트 프레임**(흐름이 지나는 사각 유리 틀): 선택 후 Color Overlay `#4d4dce` Soft Light 40% + Inner Glow `#7c7cf0` 20% —
   장면에서 **유일하게 또렷한 바이올렛 오브젝트**. 반투명 느낌은 Overlay 불투명도로 조절(60% 넘기면 불투명해 보임).
3. **금고 림**: 유리 박스 모서리 얇게 선택 → 바이올렛 Screen 30%. 몸통엔 색 넣지 않는다(v2.2 "틈·모서리에만" 규칙).
4. **흐름**: Selective Color → Yellows 채도 −20(금색이 금괴로 읽히는 걸 막음), Shadows 에 바이올렛 틴트 10%.
5. **바**: 손대지 않는다. 노란 하이라이트가 금처럼 보이면 Yellows −15 까지만.
6. 우하단 wellbian 단독 워터마크.

## 이미지 프롬프트 J — 같은 구도 재생성 (img2img, 원본 참조 강도 0.35~0.5, 16:9)

```
Same composition as the reference image, kept exactly: a clear glass vault box on an isometric floor of white square tiles, a neat stack of clear glass bars inside, a broad iridescent stream flowing out through a rectangular glass gate frame and across the tiles. Change only the colour of light. The seams between the tiles glow Wellbian Violet (#4d4dce) instead of blue, brightest near the gate and fading toward the frame edges. The gate frame becomes frosted translucent violet glass glowing softly from within — the one clearly violet object in the scene. The vault's glass edges catch a thin violet rim light; its body stays clear. The bars stay clear with subtle prismatic edges, never gold. The stream stays iridescent but pastel, less gold, a hint of violet in its shadows. Pale grey-white studio void, soft shadowless lighting, physically-based 3D render, octane look, no text, no logos, no UI, no numbers, no coins, no gold, no people, 16:9
```

네거티브: `gold, golden, ingots coloured gold, coins, currency symbols, cyan glow, blue glow, violet bars, purple bars, neon, HDR, text, numbers, UI, logos, people, blurry`

- 리롤 체크: ① 바가 보라로 물들면 리롤(원고와 충돌) ② 이음새가 시안으로 남으면 리롤 ③ 게이트 외에 바이올렛 덩어리가 하나 더 생기면 리롤
  (경쟁 포인트) ④ 구도가 바뀌면 참조 강도를 낮춰 재시도.
