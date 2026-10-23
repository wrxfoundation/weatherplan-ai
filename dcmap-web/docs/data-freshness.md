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
        3. 리포트            — scripts/freshness-report.mjs → Job Summary
        4. 데이터 변경 커밋(→ Vercel 자동 배포) + 이슈 「📊 dcmap 데이터 최신성」 본문 갱신
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
- 모듈에 기준일이 없으면 META에 `asOf`를 추가하고 레지스트리에서 그걸 import 한다(같은 날짜를 두 곳에 적지 않기).
- 레지스트리는 Node와 Vite가 같이 읽으므로 JSON은 `with { type: 'json' }`으로 import하고 `import.meta.glob`은 쓰지 않는다.

## 지가변동률 자동화 켜기 (1회)

1. kosis.kr → 공유서비스 → OpenAPI에서 인증키 발급(무료)
2. Vercel 프로젝트 env에 `KOSIS_KEY` 추가 → 재배포
3. 배포의 `/api/status?probe=1`에서 「KOSIS 지가변동률(자동 갱신)」이 ✅인지 확인
4. 다음 주간 실행부터 새 달이 나오면 자동 반영. LAND PULSE 기사·`docs/land-price-tracking.md`의 기준월 문구는 사람이 확인

`fetch-land.mjs`는 받은 시점이 보유 데이터보다 새롭지 않거나, 기존 시군구 키의 90% 이상을 찾지 못하면(형식 변화 의심) 아무것도 쓰지 않는다.
