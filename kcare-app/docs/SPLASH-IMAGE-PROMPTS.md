# K-CARE 모바일 스플래시 — 이미지 프롬프트

서비스 3종(어르신 · 가족 · 컨시어지)의 스플래시/아이콘 이미지 생성용 프롬프트 모음.

현재 앱의 스플래시는 **CSS만으로 그려져 있어 이미지가 없어도 완성 상태**다.
아래 이미지는 "더 붙이고 싶을 때" 쓰는 선택지이며, 붙이는 방법은 마지막 절에 있다.

---

## 0. 먼저 정할 것 — 사람 얼굴을 넣을 것인가

**권장: 넣지 않는다.** 이유는 세 가지다.

1. **닮은 사람 문제.** 생성된 얼굴이 실존 인물과 닮으면 초상권 시비가 난다.
   시니어 케어는 특히 "우리 어머니 사진 아니냐"는 오해가 생기기 쉽다.
2. **언캐니 밸리.** 노인 얼굴은 주름·피부 질감 때문에 생성 모델이 가장 자주
   무너지는 영역이다. 의뢰자 앞 대형 화면에서 이질감이 바로 보인다.
3. **톤.** 활짝 웃는 노인 스톡 사진은 이 업계에서 가장 흔한 클리셰이고,
   "돌봄받는 대상"으로 대상화하는 인상을 준다. K-CARE는 존엄을 파는 서비스다.

**대안:** 사람 대신 **공간·사물·빛**으로 감정을 만든다. 아래 프롬프트는 전부 이 방향이다.
얼굴이 꼭 필요하면 생성 이미지 대신 **모델 계약을 맺은 실사 촬영**을 권한다.

---

## 1. 공통 규격

| 항목 | 값 |
|---|---|
| 마스터 해상도 | **1290 × 2796** (9:19.5) — 여기서 축소해 파생 |
| 파생 | 1179×2556 · 1170×2532 · 1080×1920 |
| 앱 아이콘 | 1024 × 1024 (여백 없이 꽉 차게, 라운딩은 OS가 처리) |
| 안전 영역 | 상하 각 22% 는 비워 둔다 — 로고와 카피가 올라간다 |
| 파일 형식 | WebP 우선, 폴백 PNG. 스플래시는 **150KB 이하** |

### 브랜드 색 (프롬프트에 hex 그대로 넣을 것)

```
네이비   #0A1F3C   주색
딥네이비 #0E1B2E   컨시어지 배경
골드     #B08D57   포인트 (절제해서)
소프트골드 #C9A46B
페이퍼   #F1EFE8   밝은 배경
아이보리 #FDFCF9   어르신 배경
```

### 공통 네거티브 프롬프트

```
no people, no faces, no hands, no text, no letters, no logos, no watermark,
no medical equipment, no hospital beds, no wheelchairs, no IV drips,
no stock-photo smiling, no clip art, no 3d render, no plastic look,
no purple gradient, no neon, no lens flare, no busy composition,
no clutter in the center, oversaturation
```

> **의료기기를 뺀 이유:** 병원 이미지가 들어가면 "아픈 사람이 받는 서비스"로 읽힌다.
> K-CARE는 아프기 전부터 곁에 있는 멤버십이다. 이 경계는 시스템 프롬프트에서도 지키고 있다.

---

## 2. 어르신 앱 — `/elder`

**감정:** 아침, 조용함, 안심. 화려하지 않고 **정갈**해야 한다.
배경이 밝아야 큰 활자가 읽힌다.

### A. 스플래시 배경

```
Soft morning light falling across a quiet Korean home interior,
warm ivory and off-white palette (#FDFCF9, #F1EFE8),
a single window casting gentle diagonal light onto a plain wall,
a low wooden side table with a folded cotton cloth and a ceramic teacup,
extremely minimal composition, large empty areas, calm and still,
muted warm neutrals with one faint brass-gold accent (#B08D57),
fine film grain, natural soft shadows, no harsh contrast,
editorial interior photography, shot on 50mm, shallow depth of field,
vertical 9:19.5 composition with the center 55% left visually empty
```

### B. 앱 아이콘

```
Minimal app icon, deep navy background (#0A1F3C),
a single thin brass-gold concentric ring (#B08D57) centered,
inside it a soft warm light source like a small sunrise,
flat vector, geometric, no text, no letters,
high contrast, legible at 48px, 1:1 square, edge to edge
```

### C. 제안서 히어로 (16:9)

```
An elderly person's daily objects arranged on a warm wooden surface:
reading glasses, a pill organizer, a folded newspaper, a house key,
soft window light from the left, ivory and warm grey palette,
overhead flat lay, generous negative space on the right for text,
documentary still life, natural texture, no people, 16:9
```

---

## 3. 가족 앱 — `/family`

**감정:** 거리, 그리움, 그럼에도 연결. 밤/새벽 톤.
어르신은 한국, 자녀는 LA·시드니에 있다는 설정을 시각화한다.

### A. 스플래시 배경

```
Night sky gradient from deep navy (#0A1F3C) to near-black,
two faint points of warm light at opposite corners connected by
a single delicate arc of thin brass-gold light (#C9A46B),
suggesting a long distance link across a globe,
extremely subtle, mostly dark empty space, no map, no continents,
soft atmospheric haze, fine grain, cinematic and quiet,
vertical 9:19.5, center area kept dark and clean for a logo
```

### B. 아이콘

```
Minimal app icon, deep navy (#0A1F3C) background,
two small warm gold dots connected by one thin curved line,
symbolizing two people far apart staying linked,
flat geometric vector, no text, generous margin,
legible at 48px, 1:1 square
```

### C. 대안 — 따뜻한 버전 (밤 톤이 무겁다고 판단되면)

```
A warm domestic window seen from outside at dusk,
soft amber light glowing from within a Korean apartment building,
one window lit among many dark ones, deep blue evening sky,
navy and amber palette, quiet and hopeful, no people visible,
soft focus, film photography, vertical 9:19.5
```

---

## 4. 컨시어지 앱 — `/concierge`

**감정:** 프로페셔널, 준비된 사람. **가사도우미가 아니라 훈련받은 수행원**이라는
포지셔닝이 이미지에서 드러나야 한다. 이 구분이 단가를 정당화한다.

### A. 스플래시 배경

```
Pre-dawn city street in Seoul, deep navy blue hour (#0E1B2E),
wet asphalt with soft reflected streetlight, quiet and empty,
a single warm gold light in the far distance,
clean minimal composition, low contrast, atmospheric,
professional and calm rather than dramatic,
cinematic still, anamorphic, fine grain, vertical 9:19.5,
center kept dark and uncluttered
```

### B. 대안 — 도구 정물

```
Flat lay of a care professional's field kit on dark slate:
a folded navy uniform, a name badge lanyard, a small notebook,
a thermometer case, hand sanitizer, all neatly arranged in a grid,
deep navy and charcoal palette with brass accents,
top-down, controlled studio light, precise and orderly,
communicating training and preparation, not domestic housework,
no branding text, no faces, 9:19.5 vertical
```

### C. 아이콘

```
Minimal app icon, deep navy (#0E1B2E) background,
a thin brass-gold shield outline with a soft rounded top,
inside it a single small dot marking a location point,
flat geometric vector, no text, no cross symbol, no medical imagery,
legible at 48px, 1:1 square
```

> **의료 십자가 금지:** 컨시어지는 의료행위를 하지 않는다. 십자가 아이콘은
> 의료법 경계를 흐리는 오해를 만든다 (의료법 27조 관련 — `lib/` 주석 참고).

---

## 5. 관제·경영 콘솔은?

**만들지 않는다.** 데스크톱 상시 근무 화면이라 스플래시는 방해만 된다.
관제사가 하루에 수십 번 새로고침하는 화면에 1초 지연을 넣을 이유가 없다.

---

## 6. 만든 이미지를 붙이는 방법

현재 스플래시는 CSS 전용이라 이미지가 **없어도 완성**이다. 붙이려면:

1. `kcare-app/public/splash/` 에 파일을 둔다 (`elder.webp`, `family.webp`, `concierge.webp`)
2. `components/Splash.jsx` 의 `SERVICE` 표에 `art` 키를 추가
3. 스플래시 루트의 `style` 에 `backgroundImage` 를 얹고, 글자 가독성을 위해
   반투명 오버레이 한 겹을 깐다

**CSP 확인 필요.** `next.config.js` 의 `img-src` 는 `'self'` 를 허용하므로
`public/` 에 둔 파일은 그대로 뜬다. 외부 CDN 주소를 쓰면 차단된다.

**성능 주의.** 스플래시가 이미지 로딩을 기다리면 스플래시를 넣은 의미가 사라진다.
150KB 를 넘기지 말고, 넘으면 이미지 없이 CSS 버전을 유지하는 편이 낫다.

---

## 7. 프롬프트를 고칠 때의 원칙

| 하지 말 것 | 대신 |
|---|---|
| "행복한 노인", "미소" | 공간과 빛으로 감정을 만든다 |
| 병원·의료기기 | 집·일상 사물 |
| 보라 그라데이션, 네온 | 브랜드 hex 를 프롬프트에 직접 명시 |
| 중앙에 복잡한 요소 | 중앙 55% 는 비운다 (로고 자리) |
| 이미지 안에 글자 | 글자는 전부 앱이 그린다 (다국어 대응) |

마지막 줄이 특히 중요하다. 이미지에 "K-CARE"를 태워 넣으면 나중에 영어판·
중국어판을 만들 때 이미지를 전부 다시 만들어야 한다.
