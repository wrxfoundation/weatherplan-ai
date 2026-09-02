# 이미지 프롬프트 — 기상 관측 장비 (글라스 3D · 브랜드 컬러)

**2026-09-02, 서우 레퍼런스 3장**(하늘 속 글라스 실드 · 구름 위 보라 큐브+빔 · 흰 플린스 위 프리즘 기기).
스타일: 글로시 반투명 글라스 3D 렌더 + 구름·하늘 + 프리즘 분산. **X 에디토리얼 레인(v2.1~v2.5, 저채도)과 별개의
브랜드 일러스트 레인** — 랜딩·부스·발표·SNS 카드용. 오브젝트 = "기상 관측"의 상징이지 제품 사진이 아니다
(실내 공기 측정기가 아님 · 캡션에 `our device` 금지 · 화면·숫자·등급 라벨 없음).

## 브랜드 컬러 매핑

| 자리 | 색 |
|---|---|
| 글라스 바디(프로스티드) | Wellbian Violet `#4d4dce` |
| 두꺼운 유리 안쪽·그림자 | Deep Navy `#1b1b48` |
| 하늘·하이라이트 | `#ededfa` 계열 연보라-흰색 (레퍼런스의 진한 시안 하늘은 바이올렛을 죽임) |
| 프리즘 분산 | **한 줄기만** — 레퍼런스의 시그니처라 살리되 바이올렛이 항상 가장 진하게 |
| 케이웨더 판 | 바디 색만 케이웨더 블루로 교체, 나머지 동일 |

기상 장비로 읽히게 하는 실루엣 5: 3컵 풍속계 · 풍향계 · 겹쳐 쌓인 통풍 차폐판(레퍼런스 3의 동심 링과 같은 형태) ·
전도형 우량계 원통 · 유리 돔 센서 1개. 이 중 풍속계+풍향계는 반드시 보여야 한다.

## A. 스카이 히어로 (16:9 — X 원글·랜딩 히어로 21:9 크롭)

```
A weather observation instrument sculpted from frosted translucent glass in Wellbian Violet (#4d4dce), floating in a bright daytime sky among soft white cumulus clouds. The instrument reads clearly as weather equipment: a slim glass mast, a three-cup anemometer at the top caught mid-spin, a small wind vane, a stack of louvered radiation-shield plates, a tipping-bucket rain-gauge cylinder and one small glass dome sensor. Clear glass parts and frosted violet parts alternate; apart from one prismatic streak, violet is the only saturated colour in the frame. Sunlight from the upper left passes through the glass and throws a single prismatic dispersion streak across one cloud. Two or three small grey clouds drift below, a passing shower on the horizon, tiny water droplets beading on the glass. Glossy physically-based 3D render, octane render look, soft global illumination, sky graded pale periwinkle-to-white (never deep cyan), high key, generous negative space around the object, no text, no logos, no UI, no numbers, no people, 16:9
```

## B. 플린스 아이소메트릭 (1:1 — 인스타·텔레그램 카드·발표 슬라이드)

```
Isometric product-style render of a weather observation instrument made of clear and frosted violet glass (#4d4dce), standing on a square white plinth in a white studio void. A slim central mast with a three-cup anemometer, a wind vane, a stack of concentric louvered radiation-shield rings, a small rain-gauge cylinder at the base and one glass dome sensor. Light passes through the glass and lays prismatic caustics on the plinth, the only place the rainbow appears; everywhere else the violet glass is the sole colour. Soft shadowless studio lighting, a subtle deep-navy (#1b1b48) tint inside the thickest glass, glossy physically-based 3D render, octane look, clean and minimal, generous white space, no text, no logos, no UI, no numbers, no people, 1:1
```

## C. 구름 위 데이터 빔 (16:9 — 네트워크·데이터 흐름 문맥)

```
A weather observation instrument of frosted violet glass (#4d4dce) standing on top of a single fluffy white cumulus cloud, seen from a low three-quarter angle against a pale periwinkle sky. From the base of the instrument, clear glass beams extend outward in four directions past the frame edges like channels, their inner cores tinted violet, carrying light. The instrument keeps its recognisable parts: three-cup anemometer, wind vane, stacked radiation-shield plates, rain-gauge cylinder. One prismatic dispersion streak where a beam exits the cloud; otherwise violet is the only saturated colour. Glossy physically-based 3D render, octane look, soft daylight, high key, no text, no logos, no UI, no numbers, no people, 16:9
```

## 네거티브 (공통)

```
teal, cyan-saturated sky, neon, HDR, multiple rainbows, text, numbers, labels, logos, screens, UI, people, hands, photoreal metal weather station, plastic toy look, low-poly, illustration, cartoon, blurry
```

## 리롤 체크

1. 풍속계 컵 3개와 풍향계가 보이는가 — 안테나·가로등·램프로 수렴하면 리롤.
2. 무지개가 2곳 이상이면 리롤. 한 줄기.
3. 하늘이 진한 시안이면 바이올렛이 죽는다 — 리롤 또는 후처리로 하늘 채도 −30.
4. 텍스트·숫자·디스플레이 침입 리롤 (공기질 등급 라벨 금지 규칙과 동일).
5. 실내 공기 측정기·스피커처럼 보이면 리롤 — 이 레인은 "관측"의 상징이다.
6. 구도가 맞고 색만 약하면 리롤 대신 후처리: 바디에 Color Overlay `#4d4dce` Soft Light 25~40%.

## 하늘을 레퍼런스처럼 진하게 쓰고 싶을 때

A·C의 `sky graded pale periwinkle-to-white (never deep cyan)` 를 `clear saturated sky blue like a summer noon` 으로 교체.
단 이때는 바이올렛 바디에 Soft Light 40% 후처리를 전제로 한다(인접색이라 렌더 단계에서는 묻힌다).

---

# 실물 기기 판 — Weather Data Token Generator™ (2026-09-02 추가, 서우: "반투명 무광 질감도 됨")

실물 실루엣: 손바닥 크기의 **둥근 사각 슬랩** 본체, 앞면 대부분을 차지하는 **큰 평면 화면**과 얇은 베젤, **오른쪽 옆면 세로 통풍
슬롯 한 줄**, 뒤쪽 **얇은 킥스탠드**로 살짝 뒤로 기운 자세, 버튼 없음. 아래 베젤에 `wellbian × XRP LEDGER` 락업이 인쇄돼
있음 → **렌더에서는 비워 두고 후처리로 실제 락업을 얹는다.**

**화면 규칙(중요)**: 화면에 숫자·등급·아이콘·UI를 띄우지 않는다(공기질 등급 라벨 표시 금지). 기본은 **빈 프로스티드 발광
패널**, 허용되는 유일한 요소는 **가는 곡선 하나**(변화 곡선만).

**포지션 규칙**: 실물 증빙(보도자료·고정 스레드 T4)은 **실제 사진**을 쓴다. 이 렌더는 브랜드 비주얼(랜딩·부스·카드)용이며
둘을 한 자리에 섞지 않는다. 캡션에 `concept render` 나 `brand visual` 을 붙여 실물 사진으로 오인되지 않게 한다.

## D. 스카이 히어로 — 반투명 무광 바이올렛 기기 (16:9)

```
A tabletop indoor air monitor reimagined as a single object of frosted translucent matte glass in Wellbian Violet (#4d4dce), floating in a bright daytime sky among soft white cumulus clouds. Keep the real silhouette exactly: a hand-sized rounded-square slab with softly rounded corners and edges, a large flat front screen filling most of the face inside a slim bezel, one row of small vertical vent slots on the right side edge, a slim kickstand at the back holding it at a slight backward tilt, no buttons. The body has a satin frosted finish with soft subsurface scattering and minimal specular highlights; a deeper navy (#1b1b48) core shows through the thickest parts; the kickstand is clear glass. The screen is a smooth frosted panel glowing softly from within, completely blank: no numbers, no icons, no interface. The lower bezel is left empty. Sunlight from the upper left passes through the kickstand and throws a single prismatic dispersion streak onto one cloud; apart from that streak, violet is the only saturated colour. Two or three small grey clouds drift below. Physically-based 3D render, octane look, soft global illumination, sky graded pale periwinkle-to-white (never deep cyan), high key, generous negative space, no text, no logos, no UI, no numbers, no people, 16:9
```

## E. 플린스 아이소메트릭 — 제품 샷 (1:1 · 4:5, 사전예약 랜딩·카드)

```
Isometric product-style render of a tabletop indoor air monitor made of frosted translucent matte glass in Wellbian Violet (#4d4dce), standing on a square white plinth in a white studio void. Exact silhouette: hand-sized rounded-square slab, large flat front screen inside a slim bezel, a row of small vertical vent slots on the right side edge, a slim clear-glass kickstand at the back giving a slight backward tilt, no buttons. Satin frosted surface, soft subsurface glow, a deeper navy (#1b1b48) core visible through the thick edges. The screen is a blank frosted panel with a faint inner light and, at most, one thin soft curve of light drawn across it. Light passes through the kickstand and lays prismatic caustics on the plinth, the only place the rainbow appears; everywhere else violet is the sole colour. Soft shadowless studio lighting, clean and minimal, generous white space, lower bezel left empty, no text, no logos, no UI, no numbers, no people, 1:1
```

## F. 구름 위 데이터 빔 — 기기에서 사방으로 (16:9)

```
A tabletop indoor air monitor of frosted translucent matte violet glass (#4d4dce) standing on top of a single fluffy white cumulus cloud, seen from a low three-quarter angle against a pale periwinkle sky. Exact silhouette: rounded-square slab, large blank frosted screen glowing softly, vent slots on the right edge, slim clear kickstand at the back. From the base of the device, clear glass beams extend outward in four directions past the frame edges like channels, their inner cores tinted violet, carrying light. One prismatic dispersion streak where a beam exits the cloud; otherwise violet is the only saturated colour. Satin frosted finish, minimal specular highlights, physically-based 3D render, octane look, soft daylight, high key, no text, no logos, no UI, no numbers, no people, 16:9
```

## 변주 한 줄

- **실물 화이트 유지 + 포인트만 바이올렛**: `frosted translucent matte glass in Wellbian Violet` → `matte ceramic white body; only the
  screen panel and the kickstand are frosted translucent Wellbian Violet (#4d4dce) glass`. 실물과 가장 가깝고 락업 얹기 쉬움.
- **글로시로**: `satin frosted finish ... minimal specular highlights` → `glossy polished glass, crisp specular highlights`.

## 네거티브 (D·E·F 공통)

```
numbers, readings, dashboard, icons, UI, text, labels, logos, screen content, buttons, speaker grille, smart speaker, phone, tablet, glossy plastic, teal, cyan-saturated sky, neon, HDR, multiple rainbows, people, hands, blurry
```

## 리롤 체크

1. 실루엣 셋이 다 있는가 — 둥근 사각 슬랩 · 뒤 킥스탠드 · 오른쪽 통풍 슬롯. 스피커·태블릿·폰으로 수렴하면 리롤.
2. 화면에 숫자·아이콘·등급이 뜨면 **무조건 리롤** (등급 라벨 금지). 곡선 하나까지만.
3. 아래 베젤에 모델이 글자를 만들어 넣으면 리롤 — 락업은 후처리.
4. 무지개 한 줄기, 하늘 시안 금지, 바이올렛이 가장 진하게 — 기상 장비 판과 동일.
5. 후처리: 실제 `wellbian × XRP LEDGER` 락업을 아래 베젤에(실물 위치), 또는 우하단 wellbian 단독 워터마크.
