# 명당(MyeongDang) AI — AI 데이터센터 부지 인텔리전스 플랫폼
## SPEC v1.0 · Claude Code 핸드오프 (2026.07.10 동결)

> **한 줄**: 한국의 AI 데이터센터 현황 맵(무료)을 관문으로, 전력계통 × 토지규제 × 기상 × 민원리스크를 융합한 **부지 적합도 스코어링 엔진**과 **MCP API**를 파는 "AI 데이터센터계의 팔란티어".
> **벤치마크**: LandGate(25TB+MCP AI Data Agent) · Gridcare($64M A, power-first) · Paces(인허가 리스크) · Acres(civic sentiment) — 전원 미국. **한국판 0개.**

---

## 0. 설계 원칙 (불변)

1. **공개 소스 온리.** 사업자 공식·언론·정부 공고·공공데이터만. 내부정보(부곡리 등 계열 부지) 절대 미포함 — 단, 내부 실전 데이터는 스코어링 엔진의 **비공개 캘리브레이션**에만 사용.
2. **글로벌 스키마 day-1.** country 필드·i18n(ko/en)·좌표/단위 표준화를 처음부터. 데이터는 한국부터, 설계는 글로벌.
3. **관객이 아니라 결정 단가.** 광고는 미끼, 수익은 리포트·구독·API. B2B 니치는 눈알 수가 아니라 딜 사이즈로 돈이 된다.
4. **크로니클 정합.** 데이터 파이프라인은 별도 시스템이 아니라 chronicle-engine의 어댑터 세트(§5.3)로 구현 — append-only, SHA-256 해시체인, changes.jsonl 계약 준수.
5. **린 캐시플로.** 팔란티어의 17년 적자는 벤치마크가 아니다. M3부터 유료 리포트 직판.

## 1. 해자 4축

| 축 | 내용 | 근거 |
|---|---|---|
| 시계열 파이프라인 | 계통영향평가 공고·여유용량·착공 이벤트를 주 단위 축적. LLM은 스냅샷은 줘도 "검증된 이력"은 못 줌 | Chronicle 철학 · Acres "필링 전에 안다" |
| 검증 루프 | 한전 예정통지 실무 프로세스 = 데이터 검증 채널. 리포트 낼 때마다 실측 데이터 축적 | Gridcare의 유틸리티 협업 아날로그 |
| LLM의 소스 포지션 | 대체당하지 말고 에이전트가 쓰는 인프라가 된다 — MCP 선점 | LandGate AI Data Agent(MCP 호환) |
| 기상 레이어 | 프리쿨링·습구온도·재해 — 40MW급 PUE 0.1 = 전기료 연 40~50억. 해외 누구도 1차 레이어로 전면화 안 함 | 유일 독점 레이어 |

## 2. 제품 구조 (3층)

```
L1  맵 (무료·공개)        국내 DC 150+ 마커 · 변전소 · 수도권경계 · 프리쿨링 히트맵 · 시설 상세페이지(SEO)
L2  스코어링 (유료 리포트)  좌표/필지 입력 → 5축 적합도 + 근거 리포트 (건당 과금 → 구독)
L3  MCP API (구독)        dc.koreaapi.dev — 에이전트/LLM용 조회·스코어링 엔드포인트
```

부속 훅: GPU 학습 계산기(기존 gpu-training-calculator) → "필요 GPU→MW 환산→이 용량 가능한 부지 보기" CTA로 L1 연결. (수요측 진입로)

## 3. 6개월 압축 로드맵 (병렬 원칙: 맵 트래픽과 B2B 직판은 독립 트랙 — 순차 금지)

| 월 | 빌드 | 세일즈/콘텐츠 | 완료 기준 |
|---|---|---|---|
| M1 | 맵 v0 런칭: 재개발맵 포크 + 시드 65 지오코딩 + /dc/[slug] 상세 + GPU계산기 연결 | 콘텐츠 10편(용어집·체크리스트 재활용, 수도권 공급불가 통계) | 배포 + 시설 80개+ |
| M2 | 전력 레이어(154kV+ 변전소·특화지역) + chronicle 어댑터 D1·D3 가동 + **스코어링 v0(골든케이스 캘리브레이션)** | 브랜드/프론트뷰 확정(힉스필드) | 스코어 산출 데모 1건 |
| M3 | 기상 레이어 v1(공공 기상데이터 기반 프리쿨링 히트맵) | **유료 리포트 직판 개시**(인텔리전스 브리프, 건당 100~300만 포지션) — 디벨로퍼·운용사·건설사 10곳 아웃리치 + 보도자료("국내 최초 DC 기상 적합도 지도") | 첫 유료 1건 |
| M4 | **MCP API 알파**(dc.koreaapi.dev) + 어댑터 D2 | 스폰서/유료 리스팅 영업(콜로·설비·건설 벤더 5곳) | MCP 외부 호출 발생 |
| M5 | 위클리 리포트 자동화(D1·D2 산출물 → 뉴스레터) | 리포트 레퍼런스 2~3건 → 구독 전환 제안 | 뉴스레터 구독 300+ |
| M6 | 구독 상품 정식화 + 계통영향평가 트래커 대시보드 | KPI 결산 · 글로벌(영문 기상 맵) go/no-go | 유료 리포트 5건 / 스폰서 3곳 |

## 4. 기술 스택 & 리포 구조

- **프론트**: React 18 + Vite + Leaflet (다크 타일: CartoDB dark_matter) + Vercel — 재개발맵.html 코드베이스 포크
- **데이터**: 정적 JSON(chronicle 산출물 latest.json 소비) + Supabase(리드·유저·리포트 주문)
- **지오코딩**: vworld MCP(기구축, vworldpackage.vercel.app) — 공개주소는 필지, 나머지는 시군구 중심점
- **MCP 서버**: Vercel Functions (vworld MCP 패턴 재활용)

```
repos/
  dcmap-web/            # 프론트 (Vercel: myeongdang.ai 또는 dc.koreaapi.dev)
    src/{map,dc,score,calc}/
    data/dc_centers.json      # chronicle 산출물 복제본
  chronicle/            # 기존 크로니클 19 모노리포에 DC 어댑터 계열 추가
    sources/psia-tracker/     # D1
    sources/dc-events/        # D2
    sources/kepco-headroom/   # D3
    sources/dc-land/          # D4 (유예)
```

## 5. 데이터 아키텍처

### 5.1 dc_centers 스키마 (시드 v0.1 → 확장)
```json
{
  "id": "kr-lguplus-paju-aidc",
  "country": "KR",
  "name": "LG U+ 파주 AI데이터센터", "name_en": "LG U+ Paju AIDC",
  "operator": "LG유플러스", "type": "AI 특화",
  "status": "construction",            // operating | construction | planned | delayed
  "sido": "경기", "sigungu": "파주시",
  "address_public": null,              // 사업자 공개분만
  "lat": 37.79, "lng": 126.75, "geocode_level": "sigungu",  // parcel | sigungu | sido
  "power_mw_public": 200, "year": 2027,
  "note": "...", "source_type": "언론보도", "source_url": "...",
  "needs_verify": false, "updated_at": "2026-07-10"
}
```
보조 테이블: `substations`(name, voltage_kv, lat, lng, source) · `weather_grid`(region_code, freecool_hours_yr, cdd, wetbulb_p99) · `score_requests`(입력 좌표/조건, 산출 스코어, 리포트 상태).

### 5.2 스코어링 엔진 v0 — 5축 100점
| 축 | 배점 | 산식 요소 | 데이터 소스 |
|---|---|---|---|
| 전력 | 40 | 154kV+ 변전소 거리(15) · 배전 여유 프록시(10) · 계통영향평가 지역 리스크: 수도권 감점/특화지역 가점(10) · 자가발전 인접(5) | 한전 사이버지점 · 기후부 공고 · D1/D3 |
| 토지 | 25 | 용도지역 적합(10) · 산업존 등 인센티브(5) · 가용면적/형상(5) · 지가(5) | vworld · 공시지가 · DEM |
| 리스크 | 15 | 군사·문화재·상수원(7) · 민원 프록시=주거밀도 1km(5) · 재해 이력(3) | vworld · 인구격자 · 재해연보 |
| 네트워크 | 10 | 백본/국사 거리(7) · 해저케이블 육양국(3) | 공개 통신 인프라 |
| 기상 | 10 | 프리쿨링 시간(5) · 습구온도/폭염(3) · 침수·태풍(2) | 기상청 공공(v0) → KW 제휴(v1) |

**캘리브레이션**: 파주 부곡리 5필지 수동 분석(이번 주 산출물 전체)을 골든 케이스로 — 엔진 출력이 전문가 판단과 정합할 때까지 가중치 튜닝. 골든 케이스 자체는 **퍼블릭 데이터에 미포함**(원칙 1).

### 5.3 Chronicle DC 어댑터 계열 (changes.jsonl 계약·해시체인 동일)
| ID | 어댑터 | 계열 | 소급불가 근거 | 주기 |
|---|---|---|---|---|
| D1 | psia-tracker | 페이지 텍스트형 | 기후부 게시판은 공고 이력 보존 약함 — 개정·회신 흐름은 지금부터만 기록 가능 | 주 1 |
| D2 | dc-events | 텍스트형+LLM 태깅 | 착공·준공·투자 이벤트의 시계열 좌표화 — 뉴스는 흩어지고 사라짐 | 일 1 |
| D3 | kepco-headroom | 파일·프로브형 | **한전은 여유용량 스냅샷만 제공, 이력 미보존** — 탈락테스트 통과, 축적가치 최상 | 주 1 |
| D4 | dc-land | API 레코드형 | 경매·토지거래 중 DC 관련 필터 | 유예(약관 확인 후) |

## 6. 디자인 시스템 (힉스필드 프론트뷰 준거)
BG `#111111` · Surface `#1A1D23` · Line `#2A2F38` · Text `#E5E7EB` · Grey `#6B7280` · **Accent `#1D4ED8`** · 상태색: 운영 blue / 건설 amber `#B7791F` / 계획 grey outline. 폰트 Noto Sans KR. 문서 시리즈(체크리스트·장표)와 동일 3톤 — 브랜드 일관성.

**비주얼 준거(확정)**: `design/reference/hero-v1.png` (GPT Image 2, 2026.07.10 선정, 1344×752).
- 진실원천은 이미지가 아니라 `tokens.css` — 컴포넌트는 CSS 변수만 사용, hex 하드코딩 금지 (CLAUDE.md에 명문화)
- 컴포넌트 매핑: TopBar(로고·검색·Generate Report 버튼) / MapCanvas(다크타일+글로우 마커) / ScorePanel(총점+5축 MetricBar) / FacilityCard
- 힉스필드 레퍼런스 엘리먼트 등록 완료: `myeongdang-hero-v1` (id `a812017f-f5f4-4869-a389-9dfb2a17175d`) — 향후 랜딩·SNS·장표 비주얼 생성 시 이 엘리먼트 참조로 스타일 유지

## 7. SEO / AEO / GEO
시설별 정적 URL(`/dc/[slug]`) + 지역 랜딩(`/region/paju`) + 통계 페이지(수도권 공급불가 현황 등) = datacentermap의 3.2만 페이지 전략 국내판. schema.org `Dataset`/`Place` 마크업, MCP는 AEO의 종착점. 영문 기상 맵(`/en/free-cooling`)이 글로벌 안테나.

## 8. KPI (M6) & 리스크
**KPI**: 시설 150+ · 월방문 1~2만 · 유료 리포트 5건 · 스폰서 3곳 · MCP 외부 호출 발생 · 뉴스레터 300+.
**리스크**: ①위치 보안 — 공개소스 온리·국가/공공시설 배제·상세좌표는 사업자 공개분만 ②카피캣 — 해자 4축(§1)으로 방어, 특히 D3 시계열은 소급 불가 ③규제 유동(고시 미제정) — 리스크이자 인텔리전스 수요의 원천 ④**기상 데이터 권리** — v0는 기상청 공공데이터로 구현, KWeather 독점 데이터·브랜드 사용은 사내 제휴 확정 후(개인/회사 자산 경계 명확화) ⑤리포트 신뢰 — 첫 3건은 과투자, 법적 성격은 '감정'이 아닌 '인텔리전스 브리프'로 포지셔닝.

## 9. Claude Code 첫 프롬프트 (복붙용)

```
이 리포의 SPEC.md(명당 AI v1.0)를 읽어줘.

목표: M1 — 맵 v0 런칭.

요구사항:
1. data/dc_seed_v0.1.json(65개)을 로드해 vworld 지오코딩(공개주소=필지,
   나머지=시군구 중심점, geocode_level 기록) → data/dc_centers.json 생성
2. React+Vite+Leaflet 다크맵(CartoDB dark_matter): 상태별 마커(운영 blue /
   건설 amber / 계획 grey outline), 클러스터링, 필터(상태·유형·시도)
3. 시설 상세 라우트 /dc/[slug]: 메타태그 + schema.org Place, sitemap.xml 자동 생성
4. 우측 패널: 시설 카드(운영사·MW·연도·출처) + needs_verify 배지
5. GPU 계산기 연동: 계산 결과(필요 MW) → "이 용량 가능한 부지 보기" CTA
6. 디자인 토큰은 SPEC §6 준수. 데이터 원칙은 §0-1(공개소스 온리) 위반 금지.

이후 확장 순서: 전력 레이어(substations.json) → chronicle 어댑터 D1·D3
→ 스코어링 엔진(§5.2) → MCP 서버(dc.koreaapi.dev). 어댑터는 chronicle-engine의
3계열 인터페이스(API 레코드형/페이지 텍스트형/파일·프로브형) 위에 구현할 것.
```

---
*v1.0 동결. 변경은 M2 회고 후에만. 근거 문서: 벤치마킹 리서치(2026.07), 시드 v0.1(65개), 전력 인허가 실무 산출물 5종, chronicle-spec-v4.*
