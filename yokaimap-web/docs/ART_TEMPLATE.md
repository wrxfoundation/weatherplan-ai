# 작화 기본 템플릿 — 한지 석채 한국화 (minhwa-v2)

> 우리 그림 — 한지 바탕, 아교에 갠 석채(무광), 굵기가 고른 철선묘 — 을 **어느 도구에서든 같은 화풍으로** 뽑기 위한 프롬프트 틀이다.
> 영문 블록을 통째로 붙이고 `[대괄호]` 칸만 채운다. 칸 밖의 문장은 고치지 않는다.
> 고정 블록의 원본은 `data/art/direction.json`이다. 거기를 고치면 이 문서도 같이 고친다 — 어긋나면 `npm run validate`가 경고한다.
> 요괴지도 도상(개체 도판)은 이 문서를 손으로 쓰지 않는다. `node scripts/art-prompts.mjs`가 같은 블록으로 조립한다.

## 0. 조립 순서

| 순서 | 칸 | 내용 |
|---|---|---|
| 1 | `[SUBJECT]` | 무엇이·어디서·무엇을 — 시점(seen from …)과 배치·크기 관계까지 |
| 2 | `[ANCHORS]` | 한국 고증 — 복식·건축·경물을 **모양으로**(§4) |
| 3 | 인상(고정) | 사람이 나오면 선남선녀 문장. 없으면 지우고 `no human figure` |
| 4 | `[COUNTS]` | 다리·팔·날개·머리 수를 위치와 함께 |
| 5 | 화풍(고정) | 한지·석채·철선묘 + `[ELEMENTS]` |
| 6 | 배제(고정) | 일본·중국 + `[EXTRA NOT]` |
| 7 | `[COLOURS]` | 차분 또는 선명 중 하나(§3) |
| 8 | `[ASPECT]` | 화면비·구도 |
| 9 | 제약(고정) | 글자·낙관·빛살 금지 |

앞에 둔 것이 세게 먹힌다. 주제를 맨 앞에, 배제는 화풍 바로 뒤에 둔다 — 프롬프트가 잘려도 배제가 먼저 살아남게(`art-prompts.mjs`와 같은 원칙).

## 1. 기본 템플릿 — 글로 새 그림 (text → image)

```text
[SUBJECT — a tall vertical painting of …, seen from …]. [ANCHORS]. every person good-looking and pleasant to look at — a young adult with gentle, natural, harmonious features, clear skin and bright eyes, attractive but not a sharp, stereotyped, doll-like idealised beauty; a character who must be old is drawn handsomely and gracefully aged. [COUNTS — Each horse has exactly four legs and one head; each person has two arms]. Korean traditional painting on hanji mulberry paper, opaque mineral pigment in animal glue, matte non-glossy, even iron-wire brush outline, flat frontal Joseon minhwa and musindo manner, visible paper fiber; [ELEMENTS — every figure, roof, wall, tree and mountain] drawn with fine even iron-wire ink outlines and filled with flat matte mineral colour with gentle shading. NOT Japanese: no kimono or obi sash, no circular family crest on sleeve or chest, no conical sedge hat, no two-horned oni with tiger-skin loincloth, no thonged zori or geta sandals, no split-toe tabi socks, no torii gate, no vermilion two-post gate with a straight lintel, no shimenawa paper streamers, no ukiyo-e woodblock look, no shoji or tatami, no upturned pagoda eaves, no cherry blossom, no Japanese stone lantern, no kabuki kumadori red stripe face paint on a bare face. NOT Chinese: no qipao or wide-sleeved hanfu, no Manchu queue, no five-clawed imperial dragon, no red cylindrical lantern, no nianhua gold-heavy saturated primaries, no taihu rock. [EXTRA NOT]. [COLOURS]. [ASPECT — tall vertical 9:16 composition]. no text, no letters, no calligraphy, no signature, no seal stamp, no watermark, no border frame, no Greco-Roman columns or pediment, no pegasus, not photorealistic, not 3d render, not anime, no radiating sun rays, no rising sun, no red square seal stamp in any corner
```

칸 채우는 법:

- **[SUBJECT]** 영어로, 보이는 것만 쓴다. 첫 구절에 그림 형식을 둔다(`a tall vertical painting of …`). 원근·크기는 관계로 쓴다 — 모델은 "웅장하게"보다 `the nearest rider large in the lower part, each next rider clearly smaller`를 따른다.
- **[ELEMENTS]** 그 그림의 주요 사물을 나열한다. 여기서 빠진 사물(특히 현대 건물·기계)은 사진처럼 그려진다.
- **깊은 원근**(조감, 성곽 행렬, 도시 원경)에서는 화풍 블록의 `flat frontal Joseon minhwa and musindo manner, `만 지운다 — '정면·평면'이 원근을 눌러 납작하게 만든다. 원근은 [SUBJECT]에 쓴다: `correct, strong linear perspective: … shrink steadily with distance; the distant layers paler, cooler and simpler`.
- **서양 소재**를 일부러 그릴 때만 `no Greco-Roman columns or pediment, no pegasus`를 지운다.
- **[EXTRA NOT]** 그 소재가 끌려가기 쉬운 외국 도상을 이름으로 막는다. 없으면 칸째 지운다.
  - 성곽 → `no Great Wall of China, no brick watchtowers with arched windows, no yellow glazed roof tiles`
  - 갑옷 → `NOT European: no plate armour, no closed helmet with visor` · `no samurai armour or kabuto helmet`
  - 개체별 목록은 [ART_REVIEW.md](ART_REVIEW.md) '개체별로 직접 배제해야 하는 일본·중국 도상'

## 2. 레퍼런스가 있을 때 (image → image)

질감은 §1(`recraft_v4_1`)이 가장 좋다. 아래는 구도를 지키거나 고칠 때 쓰는 `nano_banana_2_1`용이다.
레퍼런스는 **원본(구도) 먼저, 화풍 샘플 다음** 순서로 넣고, 프롬프트에서 first/second로 역할을 못박는다.
화풍 샘플은 질감이 잘 나온 우리 완성작 한 장.

### 2-1. 사진·그림을 우리 화풍으로 (구도 유지)

```text
Repaint the photograph (the first reference image) as a Korean traditional colour painting, in exactly the painting style of the second reference image: hanji mulberry paper with visible paper fibre, opaque matte mineral pigments in animal glue, fine even iron-wire ink outlines, flat colour areas with soft gentle shading. Use the second image only for its painting style, never for its subject or composition. Keep the photograph's composition, camera height and viewpoint exactly[, and keep its deep sense of space: the strong recession from the large, detailed foreground to the tiny far horizon, the distant layers paler, cooler, softer and simpler]. Keep every element in place: [원본의 요소를 위치와 함께 나열]. [COLOURS]. It must look hand-painted on hanji: no photographic lens blur, no glossy reflections, no 3D render look. No text, no seal stamp, no signature, no watermark, no border frame.
```

### 2-2. 우리 그림을 화풍 샘플로, 새 그림

```text
Paint a new picture in exactly the same painting style as the reference image — Korean traditional painting on hanji paper with visible fibre, opaque matte mineral pigments, fine even iron-wire ink outlines. Use the reference only for its style, not for its subject or composition. The picture: [§1 템플릿을 [SUBJECT]부터 끝까지 그대로]
```

### 2-3. 부분 수정 (나머지는 그대로)

```text
Edit this Korean traditional painting. Change only [바꿀 것 — 위치로 지목: the two figures in the centre]: [어떻게]. Keep their exact poses, positions, scale, gestures and clothing. Keep everything else exactly identical and in place: [남길 것 나열]. Same painting style as the rest of the image: hanji mulberry paper texture, matte mineral pigments, fine even iron-wire ink outlines, flat colour with gentle shading, Joseon minhwa manner. No text, no seal stamp, no border.
```

### 2-4. 마스크 인페인트

```text
Inpaint only the masked area: [채울 것 — 주변의 무엇과 이어지는지]. Paint it in the same Korean traditional painting style on hanji paper with visible paper fibre, fine even iron-wire ink outlines and flat matte mineral colour. [No people, no new objects.] Keep everything outside the mask exactly unchanged.
```

### 2-5. 입체감 — 화풍을 해치지 않는 훈염

```text
Edit this Korean traditional painting. Give [대상] more three-dimensional volume, while keeping exactly the same drawing, composition, pose, proportions, outlines, colours, face and painting style, and leaving the background — [배경 요소] — exactly as it is. Add modelling in the traditional Korean way (hunyeom gradation, as in Joseon court portraits and Goguryeo tomb murals): soft tonal gradation that deepens toward the edges and into the folds of each form while the raised parts stay light, with the light coming from the upper left. [부위별 — fabric: deeper colour in the hollows of the folds, lighter on the ridges; lamellar armour: each row slightly darker along its lower edge; horse: a soft sheen along the neck, shoulder and haunch]. Keep the fine even ink outlines, the flat matte mineral pigments and the visible hanji paper fibre; not photorealistic, not glossy, not 3D-rendered, no airbrush look. No text, no seal stamp, no signature.
```

### 2-6. 얼굴만 선남선녀로

작은 얼굴은 그 부분만 1:1로 잘라 넣고, 결과를 원본에 다시 앉힌다(그림 전체를 넣으면 얼굴이 거의 안 바뀐다).

```text
Edit only the [man's / woman's] face [위치·방향 — under the iron helmet, seen in profile facing left]. Make [him / her] a good-looking young [man / woman] in [his / her] early twenties: a gentle, natural, pleasant face with [a straight nose, a clean jawline, smooth skin, calm bright eyes] — attractive but not a sharp, stereotyped, doll-like idealised beauty. Keep [모자·머리·옷], the pose, the head position and size, the background, the drawing style, the fine even ink outlines and the flat matte colours exactly the same. No text, no seal stamp.
```

## 3. 색 — 하나만 고른다

**A. 차분 (기본 — 도감·민화·인물)**

```text
muted traditional Korean mineral colours on warm hanji — cinnabar vermilion, malachite green, azurite blue, ochre yellow, opaque white and ink black — low saturation and matte, not printed flat colour
```

**B. 선명 (현대·풍경·야경·포스터)**

```text
Vivid, highly saturated jewel-like mineral colours, bright, not muted, not dull, not greyish: [무엇이 무슨 색인지 — 하늘, 물, 산, 지붕, 옷, 빛 순서로]
```

예: `deep lapis-lazuli night sky, pale gold moon, silver-white armour, vermilion pennants, blue mist, ink-black horses, warm grey granite`

- **색 단어는 글자 그대로 칠해진다.** `gold`만 쓰면 금색 물건이 생긴다 — 색은 언제나 '무엇의 색'으로 붙인다(`pale gold moon`). 원하지 않는 곳에는 색 단어를 아예 쓰지 않는다.
- 선명하게 가도 재료는 석채다. `neon`·`glossy`·`metallic`은 쓰지 않는다.

## 4. 한국 고증 앵커 — 모양으로 쓴다

모델은 고유명을 모른다 — "Silla stone pagoda"보다 `two-tier base and three thin flat roof stones`를 그린다.
부정문은 약하다 — `no thong sandals`보다 버선을 신기는 쪽이 이긴다. 앵커가 장면과 맞는지도 본다: 여우 컷에 서낭당(`landscape`)을 붙이면 이나리 도상이 된다.

`direction.json`의 `korean_anchors` — 그대로 붙인다:

| 쓰임 | 앵커 |
|---|---|
| 여성 복식 | `Korean hanbok: short jeogori jacket with a white dongjeong collar strip and long goreum ribbon tie, full chima skirt gathered high at the chest, beoseon socks` |
| 남성 복식 | `Korean hanbok: jeogori jacket with dongjeong collar and goreum tie, baji trousers tied at the ankle, durumagi overcoat, black horsehair gat hat or topknot with manggeon band, white beoseon socks with a single rounded toe inside closed woven straw jipsin shoes` |
| 미혼 청년 | `Korean hanbok for an unmarried youth: jeogori jacket with a white dongjeong collar strip and goreum tie, baji trousers tied at the ankle, hair in a single long braid down the back tied with a daenggi ribbon, no hat and no topknot, white beoseon socks with a single rounded toe inside closed woven straw jipsin shoes` |
| 건축 | `Korean hanok: gentle straight roof ridge, hanji lattice door, ondol room, earthen wall on stone base` |
| 풍경 | `Korean red pine and granite ridgeline, a seonangdang cairn of piled stones beside a spirit tree tied with obangsaek cloth strips in exactly five colours — blue, white, red, black and yellow, jangseung posts, magpie` |
| 기물 | `moon jar, brass bowl, low soban table, straw geumjul rope, jangdokdae jars` |

실전에서 통한 앵커:

| 쓰임 | 앵커 |
|---|---|
| 성곽 | `a Korean city wall: large grey granite blocks, a crenellated parapet (yeojang) of grey stone with small arrow slits, wooden gate pavilions with gently curved charcoal-grey tiled roofs and vermilion pillars — it must not look like the Great Wall of China` |
| 궁궐·기와 | `gently curved charcoal-grey giwa tile roofs, softly upturned eave corners, blue-green dancheong, vermilion pillars on a granite terrace` |
| 고구려 개마무사 | `an open-faced helmet of tall vertical iron plates with a black horsehair plume, a lamellar armour coat of small scales, a warhorse fully covered in lamellar horse armour with an engraved face mask` |

## 5. 함정 — 실제로 걸린 것

| 증상 | 처방 |
|---|---|
| 귀퉁이에 붉은 네모 낙관·필기체 서명 | 제약 끝의 `no red square seal stamp in any corner`. 그래도 나오므로 귀퉁이·바위·옷자락을 확대해 본다 |
| 해·달에 방사형 빛살 | **욱일기 도상** — 즉시 반려. 해·달은 `a plain disc`, 빛은 `a soft glow with no rays` |
| 동그란 렌즈 링 | 쓰지 않는다 |
| 다리·날개·팔 개수가 틀림 | 수를 위치로 센다 — `exactly two wings, one rising from each shoulder blade` |
| 원근이 납작함 | 화풍의 `flat frontal …` 삭제 + 원근을 크기 관계로 서술(§1) |
| 현대 건물·기계가 사진처럼 | [ELEMENTS]에 그 사물을 넣어 철선묘·석채로 그리게 한다 |
| 인물이 늙거나 험상궂음 | 인상 문장이 들어갔는지 확인 → 얼굴만 수정(§2-6) |
| 부분 수정했더니 다른 데도 바뀜 | 바뀐 부분만 잘라 원본 위에 정렬해 앉힌다 |

## 6. 모델·설정 (Higgsfield, 2026-10 기준)

| 용도 | 모델 | 설정 | 비용 |
|---|---|---|---|
| 글로 새 그림 — 한지 질감이 가장 잘 나온다 | `recraft_v4_1` | `resolution: 2k`, `model_type: standard`, `colors`: 팔레트, `background_color: #f2ece0` | 장당 8크레딧 |
| 화풍 이식·부분 수정·인페인트 | `nano_banana_2_1` | `resolution: 2k`, `thinking_level: high`, `image_references`(원본 → 화풍 샘플 순) | 장당 2크레딧 |

- `recraft_v4_1`은 레퍼런스 이미지를 받지 않는다 — 구도까지 글로 쓴다.
- 기본 팔레트(`colors`): `["#f2ece0", "#1f1b16", "#b8402c", "#4a7a5c", "#35597f", "#c2922f", "#f7f4ec"]`. 선명 버전은 그 그림의 주색 8~10개로 바꾸되 한지색 `#f2ece0`은 남긴다.
- `nano_banana_2_1` 출력 크기: 4:5 → 1856×2304, 1:1 → 2048×2048, 9:16 → 1536×2752.
- 후보는 2장씩, 동시 제출은 6건 이하([ART_REVIEW.md](ART_REVIEW.md) '생성 운영 메모').
- **다른 도구에서 쓸 때**
  - 팔레트 파라미터가 없으면 §3 색 문장을 반드시 넣는다.
  - 네거티브 프롬프트 칸이 따로 있으면 배제·제약 블록을 그쪽으로 옮기고, `NOT …:`·`no` 없이 명사만 쓴다.
  - 스타일 레퍼런스 칸이 있으면 우리 완성작 한 장을 넣는다.

## 7. 검수 — 생성 직후

- [ ] 귀퉁이·바위·옷자락에 낙관·서명·글자가 없다(확대해서)
- [ ] 왜색·중국풍 항목이 하나도 없다
- [ ] 한국 앵커가 '없지 않다'가 아니라 '보인다'
- [ ] 사람은 선남선녀다
- [ ] 다리·팔·날개·머리 수가 맞다
- [ ] 방사형 빛살·렌즈 링이 없다
- [ ] 한지 결·무광 석채·고른 철선묘다

자세한 기준은 [ART_REVIEW.md](ART_REVIEW.md).

## 8. 채운 예 — 개마무사 성곽 행렬(D5)을 이 틀로 다시 쓴 것

`recraft_v4_1` · 9:16 · 깊은 원근이라 화풍 블록에서 `flat frontal …`을 뺐다.

```text
a tall vertical painting of a procession of five Goguryeo armoured cavalry warriors (gaema musa) riding away from the viewer in single file along the top of a long Korean stone fortress wall that winds in gentle S-curves over a mountain ridge toward the far horizon on a moonlit night, seen from a higher viewpoint on a gate pavilion behind them. Correct, strong linear perspective: the wall narrows steadily with each curve until it becomes a thin line on the horizon beneath the full moon; the crenellations and gate pavilions shrink steadily with distance; the riders diminish proportionally — the nearest rider large in the lower part of the picture seen from behind, each next rider clearly smaller, the farthest tiny near a distant gate pavilion. On both sides deep valleys filled with evening mist and layered mountain ridges, paler and simpler with distance; a large full moon as a plain disc and tiny stars. Each warrior wears an open-faced helmet of tall vertical iron plates with a black horsehair plume, a lamellar armour coat of small scales and a mantle streaming in the wind, and rides a warhorse fully covered in lamellar horse armour with an engraved face mask; long silk pennants stream from their spears. The fortress is a Korean city wall: large grey granite blocks, a crenellated parapet (yeojang) of grey stone with small arrow slits on both sides of the walkway, and wooden gate pavilions with gently curved charcoal-grey tiled roofs and vermilion pillars standing on the wall. every person good-looking and pleasant to look at — a young adult with gentle, natural, harmonious features, clear skin and bright eyes, attractive but not a sharp, stereotyped, doll-like idealised beauty; a character who must be old is drawn handsomely and gracefully aged. Each horse has exactly four legs and one head; each rider has two arms. Korean traditional painting on hanji mulberry paper, opaque mineral pigment in animal glue, matte non-glossy, even iron-wire brush outline, visible paper fiber; figures, horses, walls and mountains drawn with fine even iron-wire ink outlines and filled with flat matte mineral colour with gentle shading. NOT Japanese: no kimono or obi sash, no circular family crest on sleeve or chest, no conical sedge hat, no two-horned oni with tiger-skin loincloth, no thonged zori or geta sandals, no split-toe tabi socks, no torii gate, no vermilion two-post gate with a straight lintel, no shimenawa paper streamers, no ukiyo-e woodblock look, no shoji or tatami, no upturned pagoda eaves, no cherry blossom, no Japanese stone lantern, no kabuki kumadori red stripe face paint on a bare face. NOT Chinese: no qipao or wide-sleeved hanfu, no Manchu queue, no five-clawed imperial dragon, no red cylindrical lantern, no nianhua gold-heavy saturated primaries, no taihu rock. no Great Wall of China, no brick watchtowers with arched windows, no yellow glazed roof tiles. NOT European: no plate armour, no closed helmet with visor. Vivid, highly saturated jewel-like mineral colours, bright, not muted, not dull, not greyish: deep lapis-lazuli night sky, pale gold moon, silver-white armour laced with cobalt-blue cord, cobalt-blue mantles, vermilion helmet tassels and pennants, blue mist, ink-black horses, warm grey granite. tall vertical 9:16 composition with very deep space. no text, no letters, no calligraphy, no signature, no seal stamp, no watermark, no border frame, no Greco-Roman columns or pediment, no pegasus, not photorealistic, not 3d render, not anime, no radiating sun rays, no rising sun, no red square seal stamp in any corner
```
