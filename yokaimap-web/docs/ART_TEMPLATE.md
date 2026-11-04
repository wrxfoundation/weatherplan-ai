# 작화 기본 템플릿 — 한지 석채 한국화 (minhwa-v2)

> 우리 그림 — 한지 바탕, 아교에 갠 석채(무광), 굵기가 고른 철선묘 — 을 **어느 도구에서든 같은 화풍으로** 뽑기 위한 프롬프트 틀이다.
> 영문 블록을 통째로 붙이고 `[대괄호]` 칸만 채운다. 칸 밖의 문장은 고치지 않는다.
> 고정 블록의 원본은 `data/art/direction.json`이다. 거기를 고치면 이 문서도 같이 고친다 — 어긋나면 `npm run validate`가 경고한다.
> 요괴지도 도상(개체 도판)은 이 문서를 손으로 쓰지 않는다. `node scripts/art-prompts.mjs`가 같은 블록으로 조립한다.
> **요괴지도 밖의 그림은 v6 레시피(§9)가 기본값이다**(오너 확정 2026-11-04) — 화풍 칸을 수묵담채 블록(§9-4 ①)으로 바꿔 그리고, 채도 '강' → 햇빛 색감 섞기 → 금빛·푸른 안개 순서로 마감한다.

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
- **요괴지도 밖의 그림**은 화풍 칸(`Korean traditional painting on hanji … gentle shading`)을 §9-4 ① 수묵담채 블록으로 바꾸고 [COLOURS]는 차분(§3 A)으로 둔다 — 색은 마감(§9)에서 올린다.
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
| 조선 해태 | `a true Joseon-dynasty haechi — like the stone haechi that guard the gate of a Joseon palace and the haechi on Joseon officials' embroidered rank badges — not a Chinese guardian lion: a sturdy, compact body sitting upright on its haunches; a big round head with large round bulging eyes under thick curling brows, a broad flat nose, small round ears and a wide, good-natured grin showing a neat row of small teeth; exactly one short blunt horn on top of the head; a curly beard; the mane falling in long, soft, wavy S-shaped locks that end in curled tips; large rounded scales on the chest and flanks; flame-like curling tufts at the shoulders, elbows and haunches; a thick bushy tail of flame-like tufts` + `no tight spiral curls covering the head, no ball or cub under its paw, no ribbons, no bell, no collar, not a Japanese komainu` |
| 초가 | `Korean choga cottages — low, long rectangular houses with white earthen walls and wooden lattice doors under a soft, rounded, loaf-shaped straw roof held down by a net of straw ropes (never cone-shaped, no pointed tops), some golden and some weathered grey-brown, some L-shaped or U-shaped around small earthen courtyards` + `No conical or mushroom-shaped huts` |
| 화강암 산(진경) | `a rounded summit crowned by a dense forest of individual pine trees with dark layered ink-green canopies, and below it tall white granite cliffs that fall in folds, built up with long vertical texture strokes and flowing layered ink washes that streak down the rock faces like falling water, deep grey ink in the creases fading to bare white paper on the lit faces, scattered dark moss dots; soft bands of white mist drifting between the ridges` |
| 십장생 메달 | 메달마다 문양 하나, 같은 문양 두 번 금지, 수까지 쓴다 — `a red-crowned crane with one head`, `a turtle with one head and four flippers`, `a spotted deer standing in profile, one head, four slender legs, short branching antlers`, `a pine on a rock`, `bamboo`, `stacked rocks`, `a lingzhi fungus` |

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
| 부분 수정했더니 다른 데도 바뀜 | 바뀐 부분만 잘라 원본 위에 정렬해 앉힌다(`scripts/art-finish/align.mjs` → `paste.mjs`) |
| `recraft_v4_1`이 낙관을 찍음 — 한양도 5장 중 5장 | 금지문으로는 안 막힌다. `seal-scan.mjs`로 찾고 `fill.mjs`로 지운다(§9) |
| 초가가 우산·버섯 모양으로 줄지어 섬 | §4 초가 앵커 + `No conical or mushroom-shaped huts`. 이미 나왔으면 마을만 넓게 한 장으로 잘라 고친다 — 조각내 고치면 이음매가 생긴다 |
| 해태가 중국 사자상(머리 전체가 소용돌이 곱슬) | §4 조선 해태 앵커 |
| 메달에 같은 문양이 두 번, 거북이 게 다리 | §4 십장생 메달 — 문양을 하나씩 이름과 모양으로 |

## 6. 모델·설정 (Higgsfield, 2026-10 기준)

| 용도 | 모델 | 설정 | 비용 |
|---|---|---|---|
| 글로 새 그림 — 한지 질감이 가장 잘 나온다 | `recraft_v4_1` | `resolution: 2k`, `model_type: standard`, `colors`: 팔레트, `background_color: #f2ece0` | 장당 8크레딧 |
| 화풍 이식·부분 수정·인페인트 | `nano_banana_2_1` | `resolution: 2k`, `thinking_level: high`, `image_references`(원본 → 화풍 샘플 순) | 장당 2크레딧 |

- `recraft_v4_1`은 레퍼런스 이미지를 받지 않는다 — 구도까지 글로 쓴다.
- 기본 팔레트(`colors`): `["#f2ece0", "#1f1b16", "#b8402c", "#4a7a5c", "#35597f", "#c2922f", "#f7f4ec"]`. 선명 버전은 그 그림의 주색 8~10개로 바꾸되 한지색 `#f2ece0`은 남긴다.
- `nano_banana_2_1` 출력 크기: 4:5 → 1856×2304, 1:1 → 2048×2048, 9:16 → 1536×2752.
- 후보는 2장씩, 동시 제출은 6건 이하([ART_REVIEW.md](ART_REVIEW.md) '생성 운영 메모').
- `nano_banana_2_1`을 `resolution: 4k`로 쓰면 장당 3크레딧. `aspect_ratio: auto`는 원본 비율을 따르지만 가끔 정사각형으로 나온다 — 구도가 틀어진 것이니 버린다.
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
- [ ] 한지 결·무광 석채·고른 철선묘다(요괴지도 밖 그림은 수묵담채 — §9-4 ①)
- [ ] 마감(§9) 뒤: 3배로 확대해 금빛·주홍 윤곽에 청록 테가 없고, 안개가 주인공 얼굴을 덮지 않는다

자세한 기준은 [ART_REVIEW.md](ART_REVIEW.md).

## 8. 채운 예 — 개마무사 성곽 행렬(D5)을 이 틀로 다시 쓴 것

`recraft_v4_1` · 9:16 · 깊은 원근이라 화풍 블록에서 `flat frontal …`을 뺐다.

```text
a tall vertical painting of a procession of five Goguryeo armoured cavalry warriors (gaema musa) riding away from the viewer in single file along the top of a long Korean stone fortress wall that winds in gentle S-curves over a mountain ridge toward the far horizon on a moonlit night, seen from a higher viewpoint on a gate pavilion behind them. Correct, strong linear perspective: the wall narrows steadily with each curve until it becomes a thin line on the horizon beneath the full moon; the crenellations and gate pavilions shrink steadily with distance; the riders diminish proportionally — the nearest rider large in the lower part of the picture seen from behind, each next rider clearly smaller, the farthest tiny near a distant gate pavilion. On both sides deep valleys filled with evening mist and layered mountain ridges, paler and simpler with distance; a large full moon as a plain disc and tiny stars. Each warrior wears an open-faced helmet of tall vertical iron plates with a black horsehair plume, a lamellar armour coat of small scales and a mantle streaming in the wind, and rides a warhorse fully covered in lamellar horse armour with an engraved face mask; long silk pennants stream from their spears. The fortress is a Korean city wall: large grey granite blocks, a crenellated parapet (yeojang) of grey stone with small arrow slits on both sides of the walkway, and wooden gate pavilions with gently curved charcoal-grey tiled roofs and vermilion pillars standing on the wall. every person good-looking and pleasant to look at — a young adult with gentle, natural, harmonious features, clear skin and bright eyes, attractive but not a sharp, stereotyped, doll-like idealised beauty; a character who must be old is drawn handsomely and gracefully aged. Each horse has exactly four legs and one head; each rider has two arms. Korean traditional painting on hanji mulberry paper, opaque mineral pigment in animal glue, matte non-glossy, even iron-wire brush outline, visible paper fiber; figures, horses, walls and mountains drawn with fine even iron-wire ink outlines and filled with flat matte mineral colour with gentle shading. NOT Japanese: no kimono or obi sash, no circular family crest on sleeve or chest, no conical sedge hat, no two-horned oni with tiger-skin loincloth, no thonged zori or geta sandals, no split-toe tabi socks, no torii gate, no vermilion two-post gate with a straight lintel, no shimenawa paper streamers, no ukiyo-e woodblock look, no shoji or tatami, no upturned pagoda eaves, no cherry blossom, no Japanese stone lantern, no kabuki kumadori red stripe face paint on a bare face. NOT Chinese: no qipao or wide-sleeved hanfu, no Manchu queue, no five-clawed imperial dragon, no red cylindrical lantern, no nianhua gold-heavy saturated primaries, no taihu rock. no Great Wall of China, no brick watchtowers with arched windows, no yellow glazed roof tiles. NOT European: no plate armour, no closed helmet with visor. Vivid, highly saturated jewel-like mineral colours, bright, not muted, not dull, not greyish: deep lapis-lazuli night sky, pale gold moon, silver-white armour laced with cobalt-blue cord, cobalt-blue mantles, vermilion helmet tassels and pennants, blue mist, ink-black horses, warm grey granite. tall vertical 9:16 composition with very deep space. no text, no letters, no calligraphy, no signature, no seal stamp, no watermark, no border frame, no Greco-Roman columns or pediment, no pegasus, not photorealistic, not 3d render, not anime, no radiating sun rays, no rising sun, no red square seal stamp in any corner
```

## 9. 마감 — v6 레시피 (오너 확정 2026-11-04, 요괴지도 밖 그림의 기본값)

한양도 v6에서 오너가 "이대로 다른 데도"라고 정한 화풍과 마감이다. 그림을 그리고 고증을 고친 뒤 이 순서로 마감한다.
마감(4~6단계)은 그림을 다시 그리지 않는다 — 붓결·선·한지 결은 그대로 두고 색과 빛만 바꾼다.
도구는 `scripts/art-finish/`에 있다. sharp가 필요한데 배포 의존성이 아니므로 쓸 때만 `npm i --no-save sharp@0.33`.

### 9-1. 목표 — 말로 적은 v6

| 무엇 | 어떻게 |
|---|---|
| 붓 | 수묵담채 — 맑은 담채를 여러 겹 쌓는다. 먹은 진한 검정부터 아주 옅은 회색까지 농담, 번짐·마른 붓·이끼점, 누르고 떼는 굵기가 살아 있는 선 |
| 하늘 | 위는 맑은 쪽빛(세룰리안·코발트), 먼 산 위 지평선 쪽은 옅은 복숭앗빛. 한지 바탕이 하늘이 된다 |
| 빛 | 왼쪽 위에서 드는 맑은 햇빛. 볕 받은 면은 따뜻한 크림·복숭아빛, 그늘은 차가운 쪽빛·군청 |
| 흰 바위·구름 | 햇빛 받은 눈처럼 — 볕 쪽 크림, 그늘 쪽 쪽빛 |
| 먼 산 | 분홍보랏빛, 안개에 반쯤 녹는다 |
| 솔숲 | 짙은 초록에 청록 그늘 |
| 기와 | 살짝 청록빛 도는 슬레이트 회색 |
| 금빛 주인공(해태 등) | 파란 하늘 앞에서 더 따뜻한 금빛. 물감을 겹쳐 그늘로 갈수록 황토·적갈색(§9-4 ②) |
| 물 | 맑은 청록·코발트, 햇빛 길에만 짧은 반짝임 |
| 따뜻한 주제 | 초가·흙·붉은 기둥·단청은 덜 섞어 따뜻하게 남긴다(한양도 마을 띠는 0.45) |
| 안개 | 해 쪽엔 금빛 실오라기, 그늘·먼 곳엔 푸른 베일. 가까운 봉우리·주인공 뒤로 지나가고 먼 산은 덮는다 |
| 채도 | '강' — 톡톡하게. 한지와 먹 회색은 그대로 |

빛살·해 원반은 넣지 않는다(§5 욱일 도상).

### 9-2. 순서

| 단계 | 하는 일 | 도구 |
|---|---|---|
| 1 바탕 | 수묵담채로 그린다 — §1 틀에서 화풍 칸만 §9-4 ①로, [COLOURS]는 차분(§3 A) | `recraft_v4_1`(한지 질감이 가장 좋다). 팔레트는 아래 |
| 2 고증 수리 | 낙관 지우기, 틀린 모양(우산 초가·사자 해태·메달 중복) 고치기 — 넓게 잘라 고치고 맞춰 붙인다 | `nano_banana_2_1` §2-3 → `align.mjs` → `paste.mjs`, 낙관은 `seal-scan.mjs` → `fill.mjs` |
| 3 주인공·메달 | 훈염(§2-5)과 붓 농담(§9-4 ②)으로 입체와 깊이 | 같은 방식 |
| 4 채도 '강' | 한지 색을 축으로 빼고 남는 색만 — 초록·쪽빛 > 주홍 > 황토 | `vivid.mjs`(기본값이 v6) |
| 5 색감 섞기 | 안개 얹은 미리보기를 모델이 '색만' 다시 칠하게 하고, 그 색 차이만 4단계 판에 더한다 | `mist.mjs` → `nano_banana_2_1` §9-4 ③ → `align.mjs` → `colormix.mjs` |
| 6 안개·빛 | 금빛·푸른 안개, 물 반짝임을 새 색 위에 다시 얹는다 | `mist.mjs --mask-src` |
| 7 검수 | §7 + 낙관 스캔 + 1:1 경계 + 3배 윤곽(색 테) | `seal-scan.mjs`, `compare.mjs` |

1단계 `recraft_v4_1` 설정: `resolution: 2k`, `model_type: standard`, `aspect_ratio: 4:5`, `background_color: #f2ece0`,
`colors: ["#f2ece0", "#1f1b16", "#5a5a5c", "#a9a7a2", "#c4a25e", "#5f8a6e", "#2f4a3a", "#3b5677", "#9fbfc0", "#b5503a"]`.
최대 2K(1792×2304)라 큰 판이 필요하면 마감 뒤에 업스케일한다.

### 9-3. 명령 — 한양도 v6 값 그대로

```bash
F=scripts/art-finish
node $F/vivid.mjs fixed.png graded.png                                        # 4. 채도 '강'
node $F/mist.mjs graded.png preview.png --bands $F/mist-bands/hanyang.json    # 5-1. 안개 얹은 미리보기
#    5-2. preview.png를 §9-4 ③으로 다시 칠한다 → recolour.png
node $F/align.mjs preview.png recolour.png recolour-al.png                    # 5-3
node $F/colormix.mjs preview.png recolour-al.png colored.png --apply graded.png \
  --k 0.75 --kl 0.85 --floor 0.95 --rows "1000:1,1080:0.45,1600:0.45,1680:0.85,2300:0.85"   # 5-4
node $F/mist.mjs colored.png final.png --bands $F/mist-bands/hanyang.json --mask-src graded.png  # 6
node $F/seal-scan.mjs final.png --sheet seals.jpg                             # 7
node $F/compare.mjs check.jpg 650 0 560 470 fixed.png final.png               # 7. 같은 자리 1:1(여기선 해태 자리)
```

- 진한 판은 `--k 1.0 --kl 0.9`. 오너는 0.75(v6)를 골랐다.
- 2026-11-04에 같은 재채색 판(5-2)으로 이 명령을 다시 돌려 v6·v6 진한 판과 화소까지 같게 나오는 것을 확인했다. 5-2는 생성이라 돌릴 때마다 조금씩 다르다.
- 새 그림에서 맞출 것은 셋이다.
  - `--rows`: 따뜻한 주제가 몰린 가로띠는 0.45, 하늘·산은 1, 물은 0.85. y는 그 그림의 화소 좌표.
  - 안개 띠: `mist-bands/hanyang.json`을 복사해 띠마다 `y0`(중심선)·`t0`(두께)·`tone`(0 금빛 · 1 쪽빛 · `[x0, x1]` 그 구간에서 금빛→쪽빛 · `{ "path", "depth" }` 햇빛 길만 금빛)·`hide`(`near` 가까운 덩어리 뒤로 · `pix` 종이 위에서만)를 고친다. `--preview`로 자리를 보고 잡는다. 해 쪽엔 금빛, 그늘·먼 곳엔 쪽빛.
  - 해와 물: `sun`(해 자리), `path`(물 위 햇빛 길), `glints`(반짝일 물의 y 범위). 물이 없으면 `glints`를 지운다.

### 9-4. 문장 블록

**① 수묵담채 화풍** — §1의 화풍 칸 대신 넣는다. `[대괄호]`는 그 그림의 것으로 바꾼다.

```text
Korean ink-and-colour painting on hanji mulberry paper with visible paper fibre: every form built from several overlapping layers of transparent ink and colour washes instead of flat fills — a pale first wash, then deeper layers and dark accents; ink in graded tones from rich black to the palest grey; soft wet edges and blooms where washes meet; dry-brush texture strokes and dark moss dots on the cliffs and pine forests; ink lines of varied thickness and pressure, alive and calligraphic; strong atmospheric perspective — the far mountains paler, cooler and half-dissolved in mist, mist drifting between the ridges [and behind the palace], [the town and the river] nearer, crisper and warmer[; the river in layered wet-in-wet blue-green washes deepening toward the bottom]
```

**② 주인공 붓 농담** — `nano_banana_2_1`로 주인공만 잘라 넣는다(§2-3처럼 잘라서 고치고 붙인다). 해태에 쓴 문장이다.

```text
Edit this Korean ink-and-colour painting. Repaint only [the golden haechi sitting on the cloud] so that it is clearly painted with a real brush, with rich gradation of ink and colour (nongdam), like a Joseon master's ink-and-colour painting — while keeping exactly the same pose, position, size and silhouette[, the same grinning face with round bulging eyes, the single short horn, the flowing wavy mane, the flame-like tufts at the shoulders and haunches, the scales and the bushy tail]. Colour: build the body from several layers of transparent [ochre, gamboge and yellow-earth] washes — pale and luminous where the light falls from the upper left, the paper glowing through; deepening layer by layer to [warm ochre and burnt umber] in the folds[, under the jaw and the mane, along the belly, inside the legs and under the tail]; soft wet edges, blooms and uneven pooling of pigment where the washes meet, never one flat even colour. Line: drawn with a supple brush — thick and thin, pressing and lifting, rich black and wet where a stroke starts, thinning and breaking into dry-brush at its end, some lines left out where the wash alone shapes the form; [each lock of the mane and the tail] painted with a single tapering brush stroke in graded ink and [ochre]; [the scales] suggested with light, varied brush touches, crisp on the lit [shoulder] and fading into the shadowed [flank]. A few rich dark ink accents only in the deepest shadows. Not an evenly coloured illustration, not a flat graphic, no uniform outlines, not metallic, not glossy, not digital. Keep [the cloud under it] and everything else exactly unchanged. [Exactly one horn, one head, four legs and one tail.] No text, no letters, no seal stamp, no signature.
```

**③ 색만 다시 칠하기** — 5-2단계. `nano_banana_2_1`, `resolution: 2k`, `aspect_ratio: auto`, `thinking_level: high`, `image_references`: [미리보기, 참고 그림] 순서. 두 장 뽑는다.
참고 그림은 **한양도 v6** — Higgsfield 미디어 `0225598e-cbda-4447-9756-85d662429965`(`kmap-hanyang-v6.png`). 다른 참고 그림을 쓸 때는 색과 빛만 쓰고, 그 그림에 있는 사물은 배제문으로 막고, 남의 그림은 저장소에 넣지 않는다.

```text
Recolour the first image — [a Korean ink-and-colour painting of … on hanji paper] — using the colour palette and the light of the second image. Use the second image only for its colours and its light, never for its subject, its composition or its brushwork. Keep every line, shape, brush stroke, figure, building[, medallion, the golden haechi] and the whole composition of the first image exactly where they are. The colour and light to adopt: a clear sky behind the mountains that is deep cerulean-cobalt blue at the top of the picture and fades through lighter blue to a pale warm cream-peach haze just above the far mountains; bright, crisp sunlight from the upper left; the white granite cliffs lit like sunlit snow — warm cream and pale peach on the sunlit faces, clean cool cerulean and ultramarine blue in the shadowed creases and on the shaded sides; the distant ranges pale blue-violet with warm pink highlights; the mist and clouds white with cool blue shadows; the pine forests a fresher deep green with blue-green shadows; the charcoal-grey tiled roofs cool slate grey with a faint verdigris-green tint; [the golden haechi glowing warm gold and orange against the blue sky]; the thatched roofs and the earth warm sunlit ochre; the river and the waves clear turquoise and cobalt. High-key, luminous and clear, with a strong contrast of warm light and cool shadow. Keep [the round medallions' cream discs and their emblems], the ink lines and the brush gradation. No text, no letters, no signature, no seal stamp
```

### 9-5. 걸렸던 것

| 증상 | 처방 |
|---|---|
| 채도를 그냥 올렸더니 한지·먹까지 누렇다 | `vivid.mjs`는 한지 색을 축으로 빼고 남는 색만 올린다 |
| 솔숲에 초록 잡티가 자글자글 | 넓은 면 색만 크게, 잔무늬는 30%만(`vivid.mjs` 기본) |
| 대비를 같이 올렸더니 강물이 오히려 옅어 보인다 | 대비는 건드리지 않는다 |
| 금빛 안개를 섞었더니 그림이 탁하다 | 곱하지 않는다 — 안개 밝기로 들어 올리고 색만 금빛 쪽으로(`mist.mjs`) |
| 다시 칠한 판을 그대로 쓰면 붓결·선이 바뀐다 | 색 차이만 더한다(`colormix.mjs`) |
| 하늘 파랑이 금빛 윤곽에 묻어 청록 테 | `colormix.mjs`가 진한 색을 반대색으로 밀지 않는다. 3배로 확대해 본다 |
| 마을까지 섞었더니 황금 초가가 탁하다 | 따뜻한 띠는 `--rows`로 0.45 |
| 붙인 조각 둘레에 옛 그림 조각이 남았다(성벽 끝 등) | `fill.mjs` — 결은 무늬 없는 종이에서 빌린다(무늬가 있으면 선이 옮겨 온다) |
