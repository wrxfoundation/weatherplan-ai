# 데이터 최신성 — 업데이트 구조

> 2026-10 도입. "이 숫자는 언제 기준이고, 지금 얼마나 늦었나"를 한 곳에서 관리한다.

## 한눈에

```
src/data/freshness.js   ← 단일 레지스트리 (데이터셋 31종: 기준일·주기·갱신 방식·갱신 방법)
   │
   ├─ 사이트  /data#freshness     표 전체 (브라우저의 오늘 날짜로 판정 → 재배포 없이도 지연이 뜸)
   │          FreshnessChip      데이터가 쓰이는 자리의 「기준 2026-05 · 3개월 지연」 칩
   │          푸터               「데이터 최신성 · 지연 N · 재확인 N」
   │
   └─ GitHub Action  .github/workflows/dcmap-data.yml  (매주 월 10:23 KST + 수동 실행)
        1. 변전소 여유 스냅샷 — 이번 달 파일 없으면 scripts/snapshot-headroom.mjs
        2. 지가변동률        — scripts/fetch-land.mjs (배포에 KOSIS_KEY 있을 때만)
        3. 기준일 요약 재생성 — scripts/gen-freshness-asof.mjs → data/freshness_asof.json
        4. 리포트            — scripts/freshness-report.mjs → Job Summary
        5. 데이터 변경 커밋(→ Vercel 자동 배포) + 이슈 「📊 dcmap 데이터 최신성」 본문 갱신
```

**키는 저장소에 두지 않는다.** Action은 배포된 사이트의 프록시(`/api/headroom`, `/api/landprice?kind=kosis`)를 부를 뿐이고, 키는 Vercel 서버 env에만 있다. 수집 대상 배포는 저장소 변수 `DCMAP_BASE`(기본 `https://myeongdang-ai-sand.vercel.app`).

## 상태

| 상태 | 뜻 |
|---|---|
| 갱신 지연 | 출처의 다음 자료가 나왔을 시점(기간 말 + 주기 + 공표 지연 추정)이 지났는데 아직 반영 안 됨 |
| 기준일 미기록 | 데이터에 기준일이 없음 — 날짜를 지어내지 않고 그대로 드러낸다 |
| 재확인 필요 | 정기 공표가 없는 자료(보고서·큐레이션·비정기 공표)인데 재확인 주기를 넘김 |
| 곧 갱신 | 다음 예정일까지 14일 이내 |
| 최신 / 고정 기준 / 미수집 / 실시간 | 이름 그대로 |

공표 지연일(`lagDays`)은 관행 기반 **추정**이며 화면에도 추정으로 표기한다.

## 데이터셋 추가·갱신

- **기준일은 데이터 파일에서 읽는다.** 예: 지가는 `land_price_v0.json`의 `period`, 변전소 스냅샷은 가장 최근 파일명. 데이터를 갱신하면 레지스트리가 따라온다.
- 원본에서 기준일을 뽑는 곳은 `src/data/freshnessSources.js`의 `deriveAsOf()` 하나다. 레지스트리(`freshness.js`)는 그 결과를 적어 둔 `data/freshness_asof.json`(수백 바이트)만 읽는다 — 기준일 칩·푸터가 첫 화면 번들에 있어서, 원본 데이터(지가 JSON·송변전 목록 등 100KB+)를 끌고 오지 않기 위해서다.
  - 새 데이터셋: 모듈 META에 `asOf` → `deriveAsOf()`에 한 줄 → `node scripts/gen-freshness-asof.mjs`.
  - JSON은 `npm run build` 직전(prebuild)과 데이터 Action 수집 직후에 자동 재생성되고, CI(`dcmap-ci.yml`)가 원본과 어긋나면 실패시킨다. 손으로 날짜를 적을 일은 없다.
- 레지스트리는 Node와 Vite가 같이 읽으므로 JSON은 `with { type: 'json' }`으로 import하고 `import.meta.glob`은 쓰지 않는다.

## 변전소 154kV 수전 여유 (월간 스냅샷 v2)

- 대상: `data/headroom_targets.json` v2 — DC 시설이 있는 시군구 41곳 + 가평군(7월 시드 연속성) = 42곳, 변전소 362곳(2026-10). 시설 좌표 → 법정동 시군구코드 → 한전ON 검색 scope가 일치하는 것만 넣었다. 새 시설이 다른 시군구에 생기면 단위 테스트가 실패해 대상 추가를 알린다.
- 형식: 변전소마다 `supply`(154kV 수전), `supply23`(22.9kV), `renew`(재생e 연계) 연도별 MW. 응답에 없는 흐름은 `null`(0과 구분), 값은 원문 그대로.
- 화면: 대시보드(시군구 요약·직전 수집 대비 변화), 시설 상세(그 시군구 변전소별 연도 표), 지역 상세(시도 내 시군구), 데이터 탐색기(CSV).
- EN 표기: 한전이 영문 변전소명을 공개하지 않아 국어의 로마자 표기법으로 음역한다(`romanize`, 화면에 음역임을 명시).

## 품질 게이트 (`.github/workflows/dcmap-ci.yml`)

PR·배포 브랜치 푸시마다: 기준일 요약 동기화 확인 → `npm test`(node:test 19건) → 빌드 + 메인 번들 상한(820KB) → 헤드리스 스모크(`scripts/smoke.mjs`, 21개 라우트 × KO·KO 모바일·EN: 런타임 예외·빈 화면·모바일 가로 넘침).

## 지가변동률 자동화 켜기 (1회)

1. kosis.kr → 공유서비스 → OpenAPI에서 인증키 발급(무료)
2. Vercel 프로젝트 env에 `KOSIS_KEY` 추가 → 재배포
3. 배포의 `/api/status?probe=1`에서 「KOSIS 지가변동률(자동 갱신)」이 ✅인지 확인
4. 다음 주간 실행부터 새 달이 나오면 자동 반영. LAND PULSE 기사·`docs/land-price-tracking.md`의 기준월 문구는 사람이 확인

`fetch-land.mjs`는 받은 시점이 보유 데이터보다 새롭지 않거나, 기존 시군구 키의 90% 이상을 찾지 못하면(형식 변화 의심) 아무것도 쓰지 않는다.
