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

## 생성 후 처리 (8/28 실제로 쓴 경로)

생성기: **Recraft V4.1** (`model_type: standard`, `1:1`, `resolution: 1k`)
`background_color` 를 지정해도 거의 순백(255,255,255)으로 나온다. 그게 오히려 편하다 —
모서리에서 floodfill 로 배경만 걷어내면 된다.

```bash
# 카드용(192) — 칩은 -resize 88x88 -extent 96x96
convert in.png -alpha set -bordercolor white -border 2 \
  -fuzz 5% -fill none -draw "matte 0,0 floodfill" -shave 2x2 \
  -trim +repage -resize 176x176 -background none -gravity center -extent 192x192 out.png
convert out.png -quality 76 -define webp:alpha-quality=85 measure.webp
```

| 항목 | 값 |
|---|---|
| 형식 | **WebP (투명 배경)** |
| 크기 | 카드 192×192 / 칩 96×96 — 화면 크기(120px / 34px)의 1.5배 이상 |
| 용량 | 장당 6KB 이하 (8종 합계 30KB) |
| 여백 | 사방 4% (92% 리사이즈 후 정사각 중앙 배치) |

### ⚠ fuzz 를 올리지 말 것

유리의 밝은 하이라이트가 흰 배경과 색이 거의 같다. fuzz 를 키우면 floodfill 이
배경을 타고 오브젝트 안으로 번져 들어간다. 1차본(fuzz 22%)의 손실률:

| 아이콘 | 손실 | 아이콘 | 손실 |
|---|---|---|---|
| verify | **63.7%** (방패 위쪽 모서리가 날아감) | use | 23.6% |
| data | **56.4%** | nodes | 16.2% |
| flow | 45.0% | reward | 10.8% |
| coins | 38.7% | measure | 0.3% |

배경이 완전히 균일한 순백이라 **fuzz 5%** 로도 깨끗이 지워진다. 5%와 10%의 차이는 1% 미만.

---

## 주의 (대외 발화 규칙)

- **코인·토큰에 통화 기호(₩ $ 등)를 넣지 말 것.** 보상은 현금이 아니고 지급량·가치가 보장되지
  않으므로 원화 각인은 오인 소지가 있다. 프롬프트에 `no text` 를 넣어 둔 이유이기도 하다.
- 아이콘 안에 어떤 문자도 넣지 않는다. 생성 모델이 글자를 넣으면 다시 뽑는다.
