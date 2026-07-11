# API 연동 셋업 — 실제 엔드포인트 & 검증 (2026.07)

env 키만으로 작동하지 않으면 아래 `*_URL` env를 함께 넣어 **재배포 없이** 경로를 보정할 수 있다.
검증: `/api/status?probe=1`(대시보드 "API 연동 현황") 또는 각 프록시 직접 호출 → `{available, reason}`.
`reason` 해석: `not_configured`=env 없음 · `upstream_404/403`=경로/키 오류 · `schema_unknown`=응답 필드명 상이(파서 후보 추가 필요) · `auth_failed`=인증 실패.

| 프록시 | 필요 env | 확정/추정 엔드포인트 | 상태 |
|---|---|---|---|
| `/api/weather` | `KWEATHER_API_KEY` | 케이웨더 게이트웨이(`KWEATHER_API_BASE`) | 실경로 보유 |
| `/api/revgeo`·`/api/landuse` | `VWORLD_KEY` | `api.vworld.kr/req/address`·`/req/data` | 실경로 보유 |
| `/api/filings` | `DART_API_KEY` | `opendart.fss.or.kr/api/list.json` | 실경로 보유 |
| `/api/epsis` | `DATA_GO_KR_KEY` | ✅ **확정**: `apis.data.go.kr/B552115/PowerMarketGenInfo/getPowerMarketGenInfo` (data.go.kr 15099767, 전력시장 발전설비 정보) | 수정 완료 |
| `/api/sgis` | `SGIS_KEY`/`SGIS_SECRET` | `sgisapi.mods.go.kr/OpenAPI3/auth/authentication.json` → `/OpenAPI3/stats/population.json`. **주의**: population은 `adm_cd`(행정동코드)+`year` 기준 — 좌표 조회는 `SGIS_STATS_URL`로 보정 필요(좌표→adm_cd 변환 후) | 호스트 확정, 파라미터 확인 |
| `/api/floodmap` | `FLOODMAP_KEY` | data.floodmap.go.kr 침수심 조회 — 포털 발급 가이드의 실제 경로로 `FLOODMAP_URL` 보정 | 추정, 보정 필요 |
| `/api/headroom` | `KEPCO_API_KEY`+`VWORLD_KEY` | 한전 분산전원연계정보(data.go.kr 15147381 또는 bigdata.kepco). 실경로로 `KEPCO_HEADROOM_URL` 보정 | 추정, 보정 필요 |
| `/api/disaster` | `DISASTER_KEY`+`VWORLD_KEY` | 재난안전 공유플랫폼 `safetydata.go.kr/V2/api/DSSP-IF-{ID}` (예: 지역재해위험지구 15139679). 실제 서비스 ID로 `DISASTER_URL` 보정 | 추정, 보정 필요 |

## 확정 소스 URL (참고)
- EPSIS 발전설비: data.go.kr/data/15099767 (한국전력거래소_전력시장 발전설비 정보)
- KEPCO 분산전원연계: data.go.kr/data/15147381 (한국전력공사_분산전원연계정보)
- SGIS: sgis.mods.go.kr/developer (인증→stats/population·house·company·경계)
- 재난안전: data.go.kr 15139679(지역재해위험지구)·15139711(시설자원) 등 · safetydata.go.kr/V2/api/{DSSP-IF-ID}

## 보정 절차
1. 대시보드 "API 연동 현황"에서 ◐(설정됨)인데 실응답 없는 소스의 `reason` 확인.
2. `upstream_404` → 위 표의 실제 경로로 해당 `*_URL` env 설정(Vercel) → 자동 반영.
3. `schema_unknown` → 응답 JSON의 실제 필드명을 알려주면 프록시 `pick()` 후보에 추가(코드 1줄).
4. data.go.kr 키는 **디코딩 키**를 쓰고, serviceKey는 URL 인코딩되어 들어감(프록시가 처리).
