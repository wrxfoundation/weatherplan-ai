# 한국요괴지도 (Korean Yokai Map)

한국 구비전승·문헌 기록의 요괴와 신격을 **출처와 검증등급을 붙여** 정리한 공개 데이터셋과 전승지 지도.
yokai.jp의 4축 구조(도감·지도·진단·다국어 SEO)를 한국 자료 환경에 맞게 재설계한 구현체다.

- 전략과 배경: **[STRATEGY.md](./STRATEGY.md)**
- 수익 모델: **[MONETIZATION.md](./MONETIZATION.md)**
- 데이터 v0.1.0 — **120체 / 전승지 73곳 / 17개 시도 전체 커버**

## 이 프로젝트의 규칙

1. **출처 없는 레코드는 배포하지 않는다.** 빌드 스크립트가 강제하며 위반 시 빌드가 실패한다.
2. **검증등급을 숨기지 않는다.** 근거가 약한 항목은 지우는 대신 등급을 낮춰 표시한다.
3. **좌표 정밀도를 정직하게 표기한다.** 시군구·시도 중심점은 근사 좌표로 구분하고 지도에서 점선으로 그린다.
4. **실존 신앙을 존중한다.** `sensitivity` 필드로 표시하고 상세페이지에 고지한다.
5. **없는 값을 만들지 않는다.** 날씨 API가 없으면 없다고 표시하고, 리드 저장소가 없으면 접수 성공을 가장하지 않는다.

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
| `npm run build` | 데이터 빌드 + vite build + AEO 자산 생성(프리렌더 156p·sitemap·robots·llms.txt) |
| `node scripts/make-og.mjs` | OG 카드 16장 재생성 — **로컬 크로미움 필요, 결과 PNG는 커밋한다**(Vercel 빌드엔 크로미움이 없다) |
| `node scripts/art-prompts.mjs` | 도상 생성 프롬프트 출력(`--json`으로 요청 객체, `--pending`으로 미제작분만) |
| `node scripts/fetch-art.mjs` | `data/art/jobs.json`의 생성 결과를 `public/img/`로 내려받기 |

환경변수는 전부 선택이다. 없으면 해당 기능만 정직하게 꺼진다.

| 변수 | 없으면 |
|---|---|
| `VITE_SITE_ORIGIN` | `https://yokaimap.kr` 기준으로 canonical·sitemap·OG URL 생성 |
| `VITE_VWORLD_KEY` | 한글·위성 배경지도가 빠지고 다크 타일만 노출 |
| `KWEATHER_API_KEY` | 괴담지수가 시각·계절만 반영하고 화면에 그 사실을 표시 |
| `VITE_ADSENSE_CLIENT` | 광고 슬롯이 **아무것도 렌더하지 않는다**(빈 테두리도 없음) |
| `VITE_CONTACT_EMAIL` | B2B 폼 실패 시 이메일 폴백 안내를 노출하지 않음 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | `/api/lead`가 접수 실패를 그대로 알림(성공을 가장하지 않음) |

## 화면 구성

| 경로 | 역할 |
|---|---|
| `/` | 홈 — 히어로, 오늘의 요괴, 괴담지수, 분류·지역 진입, B2B 배너 |
| `/map` | 전승지 지도 (밤 서피스, 필터 드로어, 괴담지수 패널) |
| `/dogam` | 도감 전체 목록 + 검색·분류·희귀도·지역 필터 |
| `/yokai/:slug` | 개체 상세 — 출처·검증등급·전승지·출몰 조건·공유·이전/다음 |
| `/category/:id` · `/region/:slug` | 분류별 · 시도별 목록 (지역 페이지에 B2B 리드 배너) |
| `/quiz` | 요괴 체질진단 (결과 URL 공유) |
| `/business` | 기관·기업 협업 — 협업 형태, 이중 라이선스, 문의 폼 |
| `/about` | 데이터 원칙과 출처 |

## 디자인 시스템 — "한지 위의 인장(印章)"

도상(그림)이 아직 0장이라는 전제에서 출발했다. 그림 없이도 완성돼 보이려면 세 가지가 필요하다.

1. **이중 서피스** — 도감·상세·홈은 밝은 한지(긴 글을 읽고 광고가 붙는 면), 지도는 밤의 먹빛.
   `data-surface="night"`로 전환하고 컴포넌트는 의미 토큰(`--bg`/`--surface`/`--text`)만 쓴다.
2. **인장(印)** — 14개 분류마다 명조 한자 1자(鬼宅獸水山魂疫濟堂天器婚街外)를 색 타일에 넣어
   카드·지도 마커·상세 히어로·OG 카드에서 같은 식별자로 반복한다. 도상이 들어오기 전까지의 시각적 앵커.
3. **명조 × 고딕 대비** — 요괴 이름과 제목은 Nanum Myeongjo, 본문·UI는 Pretendard. 둘 다 셀프호스팅.

색은 `src/styles/tokens.css`가 진실 원천이다. 분류색은 `--cat` 하나만 인라인으로 주입하고,
배경·테두리는 서피스별 혼합 비율(`--cat-bg`, `--cat-line`)로 `color-mix()`에서 계산한다.
(주의: `:root`에서 `var(--cat)`을 참조하는 파생 변수를 만들면 안 된다 — 커스텀 프로퍼티는 선언된
요소에서 값이 해석되므로 전부 폴백 색으로 굳어 버린다.)

## 도상(圖版) 파이프라인

한국에는 도리야마 세키엔 같은 퍼블릭도메인 요괴 도감이 없어 도상을 전량 새로 만든다.
600장을 찍어도 화풍이 흔들리지 않도록 **프롬프트를 손으로 쓰지 않고 데이터에서 생성**한다.

```
data/art/direction.json     아트디렉션 minhwa-v1 — 스타일 블록·팔레트·분류별 수식어·금지어 (문자 그대로 고정)
data/yokai/*.json           개체별 art_hint(영문 시각 서술 1문장) ← 프롬프트의 주어
  ↓ scripts/art-prompts.mjs (스타일 고정 + 개체 서술 결합)
힉스필드 recraft_v4_1 2k     생성 (팔레트·배경색을 파라미터로 강제)
  ↓ data/art/jobs.json      job_id · 결과 URL · 목표 경로 매니페스트
  ↓ scripts/fetch-art.mjs   public/img/yokai/<slug>.png 로 반입
```

- `art_hint`가 없는 개체는 **생성 대상에서 제외**된다. 한국어 traits를 그대로 넣으면 이미지 모델이 해석하지 못해
  엉뚱한 도상이 나오기 때문이다.
- 도상 파일이 아직 없으면 `ArtPlate`가 **조용히 인장 폴백**으로 돌아간다. 깨진 이미지 아이콘은 절대 보이지 않는다.
- 생성물임을 상세페이지 캡션과 데이터(`art.license`)에 명시한다. 특정 작가의 화풍은 모사하지 않는다.

## 아이콘

`src/ui/Icon.jsx` — 24px 그리드 stroke 아이콘을 직접 그려 넣었다(외부 아이콘 패키지 0).
`<Icon name="pin" size={16} />`처럼 쓰고, 색은 `currentColor`를 따른다.
날씨·시간 조건은 `WEATHER_ICON` / `TIME_ICON` 매핑으로 괴담지수 근거 배지에 그대로 붙는다.

## 구조

```
yokaimap-web/
├── data/
│   ├── schema/yokai.schema.json   # 레코드 스키마(JSON Schema 2020-12) — 진실 원천
│   ├── categories.json            # 14개 대분류(색·인장 글자) · 희귀도 · 검증등급
│   ├── regions.json               # 17개 시도 슬러그·중심점
│   └── yokai/01~14-*.json         # 시드 120체 (카테고리별 분할)
├── scripts/
│   ├── validate.mjs               # 스키마 검증기(의존성 0) + 도메인 무결성 8종
│   ├── build-data.mjs             # 병합 → public/data/yokai.json
│   ├── postbuild.mjs              # 프리렌더 156p · sitemap · robots · llms.txt
│   ├── make-og.mjs                # OG 카드 생성(로컬 크로미움)
│   └── lib/png.mjs                # PNG 크롭(헤드리스 뷰포트 보정용, 의존성 0)
├── src/
│   ├── engine/omen.js             # 날씨 × 괴담 엔진 (결정론)
│   ├── engine/quiz.js             # 요괴 체질진단 (결정론)
│   ├── seo.js                     # 프론트·빌드 공유 SEO/JSON-LD 빌더
│   ├── home/ map/ dogam/ yokai/ category/ region/ quiz/ business/ about/
│   ├── ui/                        # Seal · Icon · ArtPlate · Badges · YokaiCard · AdSlot · ShareRow · TopBar
│   └── styles/tokens.css          # 배색·타이포 진실 원천 (한지/밤 이중 서피스)
├── api/
│   ├── weather.js                 # 케이웨더 프록시(키 서버 보관)
│   └── lead.js                    # B2B 리드 접수(Supabase REST, SDK 없음)
└── public/og/                     # OG 카드 16장(사이트·진단·분류 14) — 커밋된 산출물
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
상업 이용·API·표기 면제는 별도 트랙이다 — `/business` 참조.

원천 자료의 저작권은 각 기관(한국학중앙연구원·국립민속박물관·국가유산청 등)에 있으며, 이 프로젝트가 배포하는 것은
서술·좌표·분류의 재구성물이다.

## 고지

이 사이트의 서술은 문화·엔터테인먼트 목적이며 특정 종교나 신앙을 권하거나 폄하할 의도가 없습니다.
현대 괴담은 실제 사건·피해자·시설을 지목하지 않는 범위에서만 다룹니다.
