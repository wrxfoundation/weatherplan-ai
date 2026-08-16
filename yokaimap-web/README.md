# 한국요괴지도 (Korean Yokai Map)

한국 구비전승·문헌 기록의 요괴와 신격을 **출처와 검증등급을 붙여** 정리한 공개 데이터셋과 전승지 지도.
yokai.jp의 4축 구조(도감·지도·진단·다국어 SEO)를 한국 자료 환경에 맞게 재설계한 W1 구현체다.

- 전략과 배경: **[STRATEGY.md](./STRATEGY.md)**
- 데이터 v0.1.0 — **120체 / 전승지 73곳 / 17개 시도 전체 커버**

## 이 프로젝트의 규칙

1. **출처 없는 레코드는 배포하지 않는다.** 빌드 스크립트가 강제하며 위반 시 빌드가 실패한다.
2. **검증등급을 숨기지 않는다.** 근거가 약한 항목은 지우는 대신 등급을 낮춰 표시한다.
3. **좌표 정밀도를 정직하게 표기한다.** 시군구·시도 중심점은 근사 좌표로 구분하고 지도에서 점선으로 그린다.
4. **실존 신앙을 존중한다.** `sensitivity` 필드로 표시하고 상세페이지에 고지한다.
5. **없는 값을 만들지 않는다.** 날씨 API가 없으면 없다고 표시한다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 선택 — 키가 없어도 전부 동작한다
npm run dev                  # http://localhost:5173
```

| 명령 | 하는 일 |
|---|---|
| `npm run validate` | 시드 검증만 실행(스키마 + 도메인 무결성) |
| `npm run data` | 시드 병합 → `public/data/yokai.json` 생성 (검증 실패 시 중단) |
| `npm run build` | 데이터 빌드 + vite build + AEO 자산 생성(프리렌더·sitemap·robots·llms.txt) |

환경변수는 전부 선택이다.

| 변수 | 없으면 |
|---|---|
| `VITE_SITE_ORIGIN` | `https://yokaimap.kr` 기준으로 canonical·sitemap이 생성된다 |
| `VITE_VWORLD_KEY` | 한글·위성 베이스맵이 빠지고 다크 타일만 노출 |
| `KWEATHER_API_KEY` | 괴담지수가 시각·계절만 반영하고 화면에 그 사실을 표시 |

## 구조

```
yokaimap-web/
├── data/
│   ├── schema/yokai.schema.json   # 레코드 스키마(JSON Schema 2020-12) — 진실 원천
│   ├── categories.json            # 14개 대분류 · 희귀도 · 검증등급 정의
│   ├── regions.json               # 17개 시도 슬러그·중심점
│   └── yokai/01~14-*.json         # 시드 120체 (카테고리별 분할)
├── scripts/
│   ├── validate.mjs               # 스키마 검증기(의존성 0) + 도메인 무결성 8종
│   ├── build-data.mjs             # 병합 → public/data/yokai.json
│   └── postbuild.mjs              # 프리렌더 154p · sitemap · robots · llms.txt
├── src/
│   ├── engine/omen.js             # 날씨 × 괴담 엔진 (결정론)
│   ├── engine/quiz.js             # 요괴 체질진단 (결정론)
│   ├── seo.js                     # 프론트·빌드 공유 SEO/JSON-LD 빌더
│   ├── map/                       # Leaflet 지도 + 괴담지수 패널
│   ├── dogam/ yokai/ category/ region/ quiz/ about/
│   └── styles/tokens.css          # 배색 진실 원천(단청 5색 기반)
└── api/weather.js                 # 케이웨더 프록시(키 서버 보관)
```

## 데이터 스키마 요약

```jsonc
{
  "id": "kr-dokkaebi",              // 안정 식별자 — 변경 금지
  "canonical": "도깨비",             // 대표 표기 1개
  "aliases": ["돗가비", "독각귀"],    // 지역별 이표기 흡수 (다른 개체의 canonical과 충돌 시 빌드 실패)
  "category": "dokkaebi",           // 14개 대분류
  "rarity": "common",               // 전승 밀도 기준 5단계 (인기도 아님)
  "distribution": "nationwide",     // 광포 / 권역 / 단일 지역 / 온라인 발생
  "summary": "…",                   // AEO 답변 우선 1문장
  "omens": { "time": ["night"], "weather": ["rain","fog"], "season": ["summer"] },
  "sites": [{ "name": "…", "sido": "전남", "lat": 34.4, "lng": 126.2, "precision": "sigungu" }],
  "sources": [{ "type": "classic", "title": "석보상절", "ref": "'돗가비' 표기" }],  // 최소 1개 필수
  "verification": "primary_text",   // 5단계 근거 강도
  "confidence": "high",
  "sensitivity": null               // living_faith / private_property / tragedy_linked …
}
```

## 데이터 이용

`/data/yokai.json` (CC BY 4.0). AI 에이전트용 요약은 `/llms.txt`.
인용 표기 예: `한국요괴지도(https://yokaimap.kr) 데이터 v0.1.0, CC BY 4.0`

원천 자료의 저작권은 각 기관(한국학중앙연구원·국립민속박물관·국가유산청 등)에 있으며, 이 프로젝트가 배포하는 것은
서술·좌표·분류의 재구성물이다.

## 고지

이 사이트의 서술은 문화·엔터테인먼트 목적이며 특정 종교나 신앙을 권하거나 폄하할 의도가 없습니다.
현대 괴담은 실제 사건·피해자·시설을 지목하지 않는 범위에서만 다룹니다.
