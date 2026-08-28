# wellbian 아이콘 — 공통 생성 프롬프트

서우가 첨부한 레퍼런스(Iconora Studio 계열 프로스티드 글래스 세트) 2건을 관찰해 뽑은 공통 규칙.
**8/28 기준. 아이콘을 새로 만들거나 교체할 때 이 문서의 프롬프트를 그대로 쓴다.**

---

## 왜 프롬프트가 필요한가

지금까지 SVG로 여덟 번 다시 그렸지만 계속 품질이 떨어졌다. 원인은 손재주가 아니라 **매체의 한계**다.

레퍼런스의 핵심은 **굴절(refraction)** 이다 — 두꺼운 유리 너머로 뒷면이 비치고, 가장자리에서 빛이
휘고, 표면이 뿌옇게 확산된다. 이건 3D 렌더러가 광선을 추적해서 만드는 결과물이다.
SVG는 그라디언트와 블러만 있어서 **굴절을 흉내 낼 수 없다.** 흉내 낼수록 어색해진다.

→ 결론: **아이콘은 생성 이미지(PNG)로 만들고, 코드는 그걸 배치만 한다.**
   아래 프롬프트로 뽑아 `public/assets/icons/`에 넣으면 된다(넣는 법은 그 폴더의 README).

---

## 공통 프롬프트 (영문 — 생성기에 그대로 입력)

`{SUBJECT}` 자리에만 대상을 바꿔 넣는다. 나머지는 절대 건드리지 않는다 — 세트의 일관성이 여기서 나온다.

```
3D icon of {SUBJECT}, made of thick frosted translucent glass.
Deep violet-to-light gradient concentrated inside the mass, fading to milky white
at the edges. Soft studio lighting from the upper left, bright bevelled highlight
along the top-left edges, visible refraction through the glass with the back face
faintly showing through. No outlines, no strokes, no text — form defined purely by
light and shade. Rounded, chunky, soft geometry with generous corner radii.
Slight three-quarter view, tilted, centered in frame. Very soft diffuse shadow
beneath. Clean near-white background (#F4F6FC). Product-render quality, sharp,
high detail. Isolated single object.
```

### 색상 지정
레퍼런스는 파랑이지만 **우리는 브랜드 바이올렛을 쓴다.** 위 프롬프트의 `violet`이 그 지시다.
생성기가 색상 파라미터를 따로 받으면 아래 값을 넣는다.

| 역할 | HEX |
|---|---|
| 밝은 쪽 | `#B6ACFF` |
| 중간 | `#8B7BF2` |
| 진한 쪽 | `#5B49D8` |
| 배경 | `#F4F6FC` |

---

## 대상별 `{SUBJECT}` — 4단계 카드

| 자리 | SUBJECT |
|---|---|
| ① 측정 | `a small air-quality monitor with a display screen on a stand` |
| ② 검증 | `a shield with a checkmark` |
| ③ 보상 | `a stack of round tokens` |
| ④ 활용 | `a bar chart with four rising bars` |

## 대상별 `{SUBJECT}` — 선순환 칩 (작게 쓰이므로 형태를 더 단순하게)

| 자리 | SUBJECT |
|---|---|
| 검증된 데이터 | `a stack of three flat database slabs` |
| 기업이 구매 | `a rounded square tile with an arrow pointing out to the right` |
| 대금이 보상 재원 | `a stack of round coins` |
| 측정망 확대 | `four small spheres connected by thin lines, network shape` |

---

## 생성 후 규격

| 항목 | 값 |
|---|---|
| 형식 | **PNG (투명 배경)** — 배경을 지우고 저장 |
| 크기 | 512 × 512 |
| 용량 | 장당 120KB 이하 |
| 여백 | 사방 8% 정도 비워 둘 것 (카드 안에서 잘리지 않게) |

투명 배경으로 못 뽑으면 흰 배경 그대로 둬도 된다 — 카드 배경이 밝아서 티가 크게 나지 않는다.
다만 투명이 확실히 낫다.

---

## 주의 (대외 발화 규칙)

- **코인·토큰에 통화 기호(₩ $ 등)를 넣지 말 것.** 보상은 현금이 아니고 지급량·가치가 보장되지
  않으므로 원화 각인은 오인 소지가 있다. 프롬프트에 `no text` 를 넣어 둔 이유이기도 하다.
- 아이콘 안에 어떤 문자도 넣지 않는다. 생성 모델이 글자를 넣으면 다시 뽑는다.
