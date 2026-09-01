# 원글 5g — "설치의 동기" (The Placement Problem)

작성 2026-09-01. 상태: **원고 확정 · 게시 대기**
계열: DePIN 담론 (크립토 레인) · 태그 `#DePIN #XRPL`

## 왜 이 소재인가

10/3 키노트의 뼈대(「어제도 있던 것 / 오늘 측정해야 생기는 것」)와 **축이 다르다.**
키노트 = *측정하면 존재가 생긴다*. 이 글 = *무엇이 그 센서를 거기 놓았는지가 데이터의 값을 정한다.*
같은 회사가 말해도 겹치지 않고, 오히려 키노트 전에 "우리는 설치 동기 문제를 이미 풀었다"는
바닥을 깔아준다.

DePIN 담론에서 가장 아픈 곳이자 우리가 확실히 답할 수 있는 거의 유일한 자리:
**보조금으로 뿌린 하드웨어는 아무도 관리하지 않는다.** 우리는 기기를 판다 —
그래서 기기가 사람이 실제로 숨 쉬는 자리에 놓인다.

판매 홍보로 읽히지 않는다: 가격·수량·일정·제품명 전부 없음. 논지는 **데이터 품질**이지 비즈니스 모델 자랑이 아니다.

## 게시 원고

### T1
```
The hard problem in DePIN isn't coverage.

It's whether the box in the photo is plugged in — and whether anyone
in that room would notice if it wasn't.
```

### T2
```
Free hardware buys installs, not intent.

A sensor placed to farm rewards ends up in a closet. Uncalibrated,
reporting a cupboard.

A sensor someone paid for sits where they actually breathe. They
bought it to see their own air. Nobody unplugs the thing they wanted.
```

### T3
```
Our devices are certified air-quality monitors people buy to use.
Reward logic on XRPL is in testing.

Placement was solved before that — by making the device worth owning
without a token.

The incentive that installs the sensor decides what the data is worth.

#DePIN #XRPL
```

## 설계 의도 / 금지선 점검

- **시제 규칙 준수**: 기기 = 현재형(`are certified`, `buy to use`) / 보상 = `in testing`.
- **경쟁 저격 아님**: 특정 네트워크·이름 없음. "free hardware" 는 패턴 서술이고,
  하드웨어를 파는 동종(WeatherXM 계열)은 오히려 같은 편에 선다. 승패·추월 어휘 없음.
- **금지어 없음**: coin·가격·수량·수익·전망·발행 주체 전부 미등장.
- **미사용 시그니처 온존**: `An air-quality network shouldn't cost the air.` 는 5f 원글용으로 그대로 둠.
- **신규 시그니처(초연)**: `The incentive that installs the sensor decides what the data is worth.`
- 소스 답글 없음 — 외부 인용이 없는 자체 논지 글.

## 이미지 프롬프트 (v2.2 실사 레인)

논지의 그림: **빛이 닿는 자리에 있어야 값한다.** 닫힌 붙박이장(아무도 안 보는 자리) 대
창가(사람이 사는 자리). 포인트 오브젝트는 창가 쪽에만.

### Positive
```
Editorial interior photograph. Low-saturation modern apartment bedroom, early morning.

Left third of the frame: a flush bleached-oak built-in wardrobe, doors fully closed, flat
and unlit — a dead surface. No handles, no glow, no light leaking from any seam.

Right two-thirds: the lived side of the same room — bone linen curtain creased from use,
a half-open casement window, board-formed concrete wall with visible formwork marks, the
rumpled corner of an unmade bed.

On the windowsill, standing in the daylight: one frosted translucent violet glass slab —
flat, upright, rounded edges, like a small standing pane. Pure glass. No buttons, no vents,
no screen, no panel seams. Wellbian Violet #4d4dce appears only along the bevelled edges
and in the thin gap where the slab meets the sill; the body of the slab stays milky and
desaturated. Daylight passes through it and lays exactly one soft violet caustic line on
the concrete wall behind it.

Everything else desaturated: bleached oak, grey concrete, bone linen, cool shadow.
50mm f/2.8, natural window light only, shallow depth of field on the slab, wardrobe
slightly soft. Photographic, not a render. 16:9.
```

### Negative
```
clay, claymation, plasticine, 3D render look, CGI, illustration, featureless blob, pebble,
egg shape, soap bar, violet stain inside the glass, bruise, smudge, saturated colours,
teal and orange grading, devices, gadgets, sensors, speakers, smart home hub, buttons,
vents, display screens, panel seams, cables, text, letters, numbers, logos, watermark,
two or more violet light sources, glowing wardrobe, second caustic, people, hands
```

### 후처리
- 생성 내 텍스트 없음. 오버레이는 실폰트로 — 제목 **페이퍼로지** · **Deep Navy #1b1b48**
  (밝은 배경이라 어두운 글자).
- 워터마크: 우하단 소형 **wellbian 단독** (에디토리얼이므로 XRP LEDGER 락업 금지).
- 오버레이 문구(선택, 좌상단 소): `Placement is the product.`
  — 넣지 않아도 성립. 본문이 이미 말한다.

### 리롤 조건
- 바이올렛이 두 곳 이상(붙박이장 쪽에 새면 논지가 뒤집힌다 — 즉시 리롤)
- 슬랩에 버튼·통풍구·이음선이 생김 = 스피커로 수렴
- 유리 안쪽에 보라가 번짐(멍) — 빛은 모서리와 틈에만
