# 명당 온톨로지 설계 v0 — "AI 데이터센터계의 팔란티어"의 데이터 아키텍처

> SPEC §0 한 줄 정의("부지 적합도 스코어링 엔진과 MCP API를 파는 AI 데이터센터계의 팔란티어")의 기술적 해석.
> 참고: 팔란티어 온톨로지 아키텍처 분석 (Daddy Makers 블로그, 2025.10 — 공개 기술 분석 글) + Palantir 공식 문서.
> 원칙: 패턴은 차용하되 인프라는 규모에 맞게(과설계 금지).

## 1. 차용할 핵심 원칙 3가지

### ① 대체가 아닌 통합
팔란티어는 고객의 기존 DB를 대체하지 않고 그 위에 의미론적 계층을 얹는다. 명당도 동일 —
공공 데이터(vworld·한전·기후부·KEEI)를 대체하지 않고, 그 위에 **"부지 적합도"라는 의미 계층**을 얹는다.
원천 데이터는 언제나 공개 소스(§0-1), 명당의 자산은 그 위의 해석·시계열·스코어다.

### ② 디커플링 — 온톨로지 = 안정적 API
팔란티어의 핵심 가치: 앱은 원시 테이블이 아니라 안정적 비즈니스 객체에 바인딩되고, 소스 변경은
'활성화 파이프라인'만 수정하면 된다. **명당은 이미 이 구조다**:

```
소스(공고·API·언론)  →  chronicle 어댑터(D1~D4)  →  dc_centers.json  →  맵·상세·통계·계산기
                        (활성화/Hydration 계층)      (온톨로지 계층)      (애플리케이션 계층)
```

맵 v0의 모든 화면은 `dc_centers.json`의 객체에만 바인딩되어 있어, 어댑터가 교체되어도(수동 시드 →
chronicle 산출물) 앱은 파일 교체만으로 무변경 동작한다. 이 계약을 깨지 않는 것이 M2+의 제1 규칙.

### ③ 액션 = 거버넌스 트랜잭션
팔란티어에서 데이터 변경은 UPDATE문이 아니라 감사 추적이 붙는 '액션'이다. 명당 대응:
- 시드 변경은 반드시 시드 파일 커밋 + `npm run geocode` 재실행(깃 히스토리 = 감사 추적)
- `needs_verify` 해제는 출처 확보 커밋과 함께만
- chronicle 산출물은 append-only + SHA-256 해시체인(SPEC §0-4) — 소급 수정 불가

## 2. 메타모델 v0 (객체 유형 · 속성 · 링크)

팔란티어 온톨로지 = OOP식 객체·속성·링크(LPG). 명당의 객체 유형:

| ObjectType | 상태 | 속성(핵심) | 소스/활성화 |
|---|---|---|---|
| **Facility** | ✅ 운영 중 (66건) | §5.1 스키마 + lat/lng/geocode_level | dc_seed → geocode.mjs |
| **Region** | ✅ 파생 | sido, slug, 집계(상태별 수·MW합) | Facility에서 빌드 타임 파생 |
| **PowerRule** | ✅ 운영 중 | voltage_tracks·exemptions·lead_times | power_rules_v0.json (공고·약관) |
| **Substation** | M2 | name, voltage_kv, lat, lng, headroom | 정부 345kV 정보 공개분 + D3 |
| **Event** | M2 | type(착공·인허가·투자), date, about→Facility | D2 dc-events (append-only) |
| **WeatherGrid** | M3 | region_code, freecool_hours, wetbulb_p99 | 기상청 공공 |
| **ScoreRequest** | M2 (L2 상품) | 입력 좌표/조건, 5축 점수, 리포트 상태 | 사용자 요청 (Supabase) |

**링크(Link)**:
- `Facility —locatedIn→ Region` (구현됨: sido 매핑)
- `Facility —nearestSubstation→ Substation` + 거리 (M2 — 전력축 15점의 근거 링크)
- `Event —about→ Facility` (M2 — 시설 상세에 타임라인 노출)
- `ScoreRequest —evaluates→ 좌표/필지`, `—usesRule→ PowerRule` (M2 — 리포트 근거 추적)

## 3. 저장소 라이트사이징 (팔란티어와 다르게 갈 것)

참고 글은 Cassandra(객체 저장) + Elasticsearch(검색 인덱스) 복합 아키텍처를 제시하지만, 그건
객체 수 10⁸~10⁹ 스케일의 답이다. 명당은 10²~10⁴ 구간:

| 구간 | 저장소 | 검색 |
|---|---|---|
| 현재~10³ 객체 | 정적 JSON (깃 버전 관리 = 감사 추적 무료) | 클라이언트 인메모리 필터 (현 applyFilters) |
| M2~10⁴ (Event·ScoreRequest 누적) | Supabase(Postgres) — SPEC §4 기존 결정 | Postgres 인덱스 + pg_trgm으로 충분 |
| MCP 서버(M4) | latest.json 소비 (Vercel Functions) | 서버 인메모리 — 콜드스타트에도 수 ms |

Cassandra/ES 도입 조건: 객체 10⁶+ 또는 쓰기 스트림 상시화 — 글로벌 확장(§0-2) 전에는 도달하지 않음.

## 4. L3 MCP 서버 설계 원칙 (M4) — "온톨로지가 곧 API"

팔란티어 OSDK의 `objects.Shipment.where(status="Delayed")` 패턴 = MCP 툴 설계의 준거.
에이전트가 원시 테이블이 아니라 **비즈니스 객체와 액션**을 다루게 한다:

```
list_facilities(status?, type?, sido?, min_mw?)   → Facility[]        # 맵 필터와 동일 시맨틱
get_facility(slug)                                 → Facility + links  # 상세와 동일
find_sites(required_mw, exclude_capital?)          → 후보 + 근거(PowerRule 트랙, 면제 여부)
score_site(lat, lng, required_mw)                  → 5축 점수 (L2 과금 훅)
```

- 툴 시맨틱 = 웹 UI 시맨틱 (같은 온톨로지의 두 클라이언트) — LandGate "AI Data Agent"와 동일 포지션
- `score_site`는 액션: score_requests에 기록(감사)되고 과금 흐름과 연결
- MCP는 AEO의 종착점(§7) — DefinedTerm·Place JSON-LD로 깔아둔 시맨틱과 용어 일치시킬 것

## 5. 지금 하지 않을 것

- 온톨로지 전용 스토어/그래프 DB 도입 (규모 미달)
- Facility 스키마의 소급 개편 — M2에서 `tracks[]`/`overlays[]` 확장 시 **하위 호환**(기존 필드 유지)으로만
- AI 파싱 파이프라인(AIP 모방) — D2 어댑터의 LLM 태깅(§5.3)이 그 자리이며 chronicle 계약 안에서 구현
