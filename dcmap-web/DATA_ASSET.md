# DATA_ASSET.md — 데이터 자산화 로드맵

> 목적: AI InfraMap의 인수·제휴 가치를 결정하는 것은 **화면(UI)이 아니라 "자동 갱신되는 한국 DC 계통·인허가 데이터셋 + 파이프라인"**이다.
> 글로벌 데이터 벤더(DC Byte·CoStar류)·자문사(CBRE·C&W)·오퍼레이터가 통째로 사는 것은 이 자산이다.
> 수동 큐레이션이면 인수가가 깎이고, 자동 갱신·버전·정확도 지표가 붙으면 자산가로 매겨진다.

## 왜 이게 자산인가 (한 줄)
한국 DC 시장은 **밖에서 안 보인다**(한국어 공개 데이터 파편화·신설 계통영향평가 제도·관할≠소재지). 이 맹점을 메우는 **정형 데이터셋**이 우리의 해자이며, 공개 데이터 그 자체가 아니라 **합성·검증·갱신 파이프라인**이 복제 불가 지점이다.

## 4대 해자 (자산 구성요소)
1. **계통영향평가(PSIA) 통과 전망 모델** — 공개 대리지표(수도권 배점·계통 여유·변전소 실측·승인율·필요용량)를 확률적 판정으로 합성. *공식 배점 아님*을 명시.
2. **큐레이티드 계통+시설 데이터셋** — 시설 전수 지오코딩(필지 단위) + 154kV+ 변전소 실측 여유(한전ON) + 시도 계통 여유 + 거래·갈등 이력.
3. **애널리스트급 인사이트 라이브러리** — 1차 소스 교차(CBRE·PwC·알스퀘어·법령). SEO/브랜드 → 인바운드.
4. **정직성 UX** — 근거 없는 축은 "데이터 대기", 모든 수치 출처·갱신일, 위치 정밀도 표기. 언더라이팅 맥락에서 방어 가능성.

## 파이프라인 로드맵 (인수가를 지키는 4단계)

### P1 · 라이브 계통 수집 (Live grid ingestion) — 🟡 착수(스캐폴딩 완료)
- 한전ON 변전소 실측 여유 + PSIA 결과를 **스케줄 갱신**(현재: `api/headroom.js` 프록시 온디맨드 → 목표: 주기 수집·스냅샷).
- **버전 관리**: 갱신마다 스냅샷 저장(`asOf` 태깅). 시계열 확보 = "변화 감지" 상품(모니터링 구독)의 기반.
- **구현 완료(2026-07)**:
  - 스냅샷 포맷·시드: `data/headroom_snapshots/2026-07.json`(가평·미금, version·asOf 태깅).
  - 로더: `src/data/headroomSnapshots.js` — `LATEST_SNAPSHOT`·`SNAPSHOT_COUNT`·`headroomTrend(name)`·`latestDeltas()`. vite `import.meta.glob`로 신규 월 파일 자동 편입. `/global`에 P1 진행 상태 노출.
  - 수집기: `scripts/snapshot-headroom.mjs` — 배포 프록시로 대상 시군구 여유 수집 → 월별 JSON. `SNAPSHOT_BASE` env, 키는 서버 전용.
  - 스케줄 템플릿: `ops/headroom-snapshot.workflow.yml.template`(레포 루트 `.github/workflows/`로 복사·`SNAPSHOT_BASE` 설정 시 월 1회 실행).
- **다음**: TARGETS를 수도권/비수도권 주요 시군구 법정동코드로 확장 · 스냅샷 2개월+ 쌓이면 `latestDeltas()`로 변화 피드(P3) 프리뷰.

### P2 · 판정 모델 캘리브레이션 (Calibrated pass model)
- `src/score/psia*` 통과 전망을 **실제 심사 결과로 백테스트** → 정확도(precision/recall) 산출·공개.
- 휴리스틱 → **라이선스 가능한 스코어**로 격상. 정확도 지표 자체가 세일즈·인수 포인트.
- 정직성: 표본·시점·모수 한계 병기. "공식 배점 아님" 유지.

### P3 · 변화 피드 (Change feed / diff stream)
- 신규 전기사용신청·공급예정·승인 결과를 **diff 스트림**으로. 플랫폼·펀드가 구독하는 반복 신호.
- 모니터링 구독(요금 상품)의 백엔드. 알림 트리거: 계통 여유 변동·경쟁 신청 등장·제도 변경.

### P4 · 영문 + API 레이어 (Bilingual + API)
- EN 표면(현재 `/global` 원페이저 = seed) → 단계적 확장(마케팅 → 인사이트 요약 → 앱 UI).
- **데이터/스코어 API**: 집계 데이터·계통 레이어·통과 전망을 인수자 제품에 꽂을 수 있게.
- i18n 우선순위: ① `/global`·`/about`(완료/진행) → ② 인사이트 영문 요약 → ③ 맵·계산기 UI 문자열.

## 지금 상태 (2026-07)
- ✅ 시설 전수 지오코딩 / 변전소 실측 프록시 / 인사이트 라이브러리 / 정직성 UX / `/global` EN seed / 견본 리포트
- ⏳ P1 스냅샷 자동화 · P2 캘리브레이션 로그 · P3 diff 스트림 · P4 API·전면 i18n

## 인수 대상 티어 (요약)
- **T1 DC 인텔리전스 플랫폼**(DC Byte·datacenterHawk·Structure Research) — 한국 커버리지 공백 = 가장 깨끗한 볼트온.
- **T2 부동산 자문**(CBRE·Cushman & Wakefield·JLL) — 독점 계통 레이어로 DC 자문 차별화.
- **T3 오퍼레이터·펀드**(AirTrunk·Equinix·Digital Realty·Keppel / Blackstone·KKR·GIC) — 인수보다 유료 고객·제휴 먼저(= 인수 온램프).
- 전례: DC Byte(Bloomberg 투자·제휴)·C&W(DC 조직 인수)·CoStar(프롭테크 연쇄 인수) — "지역·버티컬을 사서 채우는" 정상 거래.

## 데이터 자산 · 입지 배제 오버레이 (Exclusion overlay) — 🟡 배선 완료 · 데이터 대기
5축(전력·토지·리스크·네트워크·기상)은 **물리적 공급**만 잰다. 그 밖에서 준공을 죽이는 **법적 건축가능성(GO/NO-GO)**을 별도 오버레이로 판정한다. 엔진·맵 레이어·부지 패널 판정까지 **끝단 배선은 완료**돼 있고, 공개 GIS 폴리곤이 배포측에서 수록되면 **자동 활성화**된다. 현재는 전 레이어 **데이터 대기(pending)** — 커버리지를 암시하지 않는다.

### 5개 레이어 (엔진 계약: `src/score/exclusions.js`의 `EXCLUSION_LAYERS`)
| key | 레이어 | 유형(kind) | 출처 |
|---|---|---|---|
| `greenbelt` | 개발제한구역(그린벨트) | `block`(건축 불가/No-go) | 국토교통부·브이월드 도시계획(UP101) |
| `military` | 군사시설보호구역 | `restrict`(협의 필요/Restrict) | 국방부·토지이음 군사시설보호구역 |
| `airport_height` | 공항 고도제한(장애물제한표면) | `restrict` | 국토교통부·한국공항공사 장애물제한표면 |
| `water_source` | 상수원보호구역 | `block` | 환경부 상수원보호구역 |
| `heritage` | 문화재보호구역·매장문화재 유존지역 | `restrict` | 국가유산청 문화재보호구역·매장문화재 유존지역 |

- `kind='block'` = 저촉 시 **건축 불가(No-go)**, `kind='restrict'` = **협의 필요(Restrict)**. 감점이 아니라 이진 판정(×).

### GeoJSON 스키마 — `data/exclusions/layers/<key>.json`
- 표준 **GeoJSON FeatureCollection**. `<key>`는 위 표의 key와 일치해야 로더(`import.meta.glob`)가 편입한다.
- 각 Feature: `geometry`는 `Polygon` 또는 `MultiPolygon`(경위도, [lng, lat]). `properties.name`(또는 `NAME`/`보호구역명`) 권장 — 부지 패널에서 저촉 구역명 표기에 사용.
- 파일이 없거나 `features` 배열이 비면 해당 레이어는 자동으로 `pending`. `hasExclusionData(key)`·`anyExclusionData()`로 존재 여부 판정, 저촉 여부는 절대 지어내지 않는다.

### 매니페스트 — `data/exclusions/manifest.json`
- 형식: `{ version, asOf, note, layers:[{ key, available, asOf, source, features }] }`.
- 각 레이어의 **수록 상태(available)**·기준일(asOf)·피처 수(features)를 선언. `available=true`로 바뀌면 데이터 탐색기(입지 배제구역 탭)·엔진·SitePanel·맵이 자동 활성화.
- **현재: 전 레이어 `available:false`, `asOf:null`(데이터 대기)** — 이것이 정직한 현 상태다.

### 데이터 주입은 배포측 전용 (population is deployment-side)
- 수집 절차: **`ops/EXCLUSIONS-RUNBOOK.md`** 참조. `scripts/fetch-exclusions.mjs`가 공개 GIS에서 `layers/<key>.json`을 채우고 `manifest.json`을 갱신하면 빌드에 번들돼 자동 활성화.
- 이 샌드박스는 토지이음/브이월드/data.go.kr outbound가 차단돼 수집 불가 → 배포 환경에서만 채운다.
- 표면: 데이터 탐색기 `/data?tab=exclusions`(레이어·유형·출처·수록 상태), 인사이트 `/insights/external-gates-2026`.

## 보안·정직성 불변식
- 공개 데이터만. API 키(한전/data.go.kr/law.go.kr/vworld)는 **환경변수 전용**, 레포·로그 노출 금지.
- 수치 = 출처·갱신일. 근거 없으면 "데이터 대기". 좌표는 실측 우선(텍스트 추정 금지).
