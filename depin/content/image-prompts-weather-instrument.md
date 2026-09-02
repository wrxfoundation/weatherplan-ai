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
