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
| `/api/headroom` | `KEPCO_API_KEY`(40자)+`VWORLD_KEY` | ✅ **확정**: `bigdata.kepco.co.kr/openapi/v1/dispersedGeneration.do?metroCd={2자리}&cityCd={3자리}&apiKey=&returnType=json` (data.go.kr 15147381). 여유용량 vol1/vol2/vol3 · 누적 substPwr/mtrPwr/dlPwr. **IP차단이라 `UPSTREAM_PROXY_BASE` 필요** | 경로·필드 확정, KR프록시 필요 |
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

## 클라우드 IP 차단 근본 해결 — 상류 프록시 (`UPSTREAM_PROXY_BASE`)

`floodmap`·`headroom`·`power?src=supply`(KPX 수급예보)는 `reason: upstream_raw_timeout`/`upstream_UND_ERR_SOCKET`
처럼 **응답 자체가 안 온다**. 키·경로 문제가 아니라 Vercel 서버리스의 egress IP가 KR 상용망이 아니라서
`data.floodmap.go.kr`·`openapi.kpx.or.kr`·`bigdata.kepco.co.kr`가 소켓을 끊는(차단) 것. 재배포·env 경로
보정으로는 못 뚫는다. 근본 해결은 **한국 IP 경유**뿐.

**활성화(코드 재배포 불필요 — Vercel env 2개만):**
- `UPSTREAM_PROXY_BASE` — KR-IP 프록시 엔드포인트. 예) `https://proxy.kweather.co.kr/fetch`
  프록시는 `?url=<대상URL(인코딩)>`를 받아 대상에 GET → 바디 그대로 반환.
- `PROXY_TOKEN` (권장) — 공유 시크릿(`x-proxy-token` 헤더). 프록시는 이 토큰 + 대상 호스트 allowlist로 오픈프록시 악용 차단.

설정하면 `floodmap`·`headroom`·`disaster`·`supply` 프록시가 **KR-IP 경유를 최우선**으로 시도하고,
미설정 시엔 기존 동작 그대로(무해). 프록시 스켈레톤(~30줄)은 `api/_proxy.js` 상단 주석 참고.

**프록시 세우기 전에 — IPv4-직결로 이미 뚫릴 수 있음(인프라 0):**
`floodmap`·`headroom`·`supply`에는 IPv4-직결 폴백이 들어있다(IPv6 블랙홀 우회). 상당수 실패는
하드 차단이 아니라 happy-eyeballs CONNECT_TIMEOUT이라 이것만으로 프록시 없이 뚫린다.
→ `KEPCO_API_KEY`만 넣고 `/api/headroom?lat=37.5&lng=127.0` 호출 후 `reason` 확인:
`available:true`면 프록시 불필요, `upstream_raw_timeout/SOCKET`이면 그때 프록시.

**케이웨더 서버 없이 무료 프록시:** `proxy/` 디렉터리 참고 — Cloudflare Workers(`cloudflare-worker.js`)
또는 Deno Deploy(`deno-deploy.ts`), 둘 다 무료·서버 유지 불필요. 배포 절차는 `proxy/README.md`.

**프록시로도 안 되는 것 (IP 무관 · 신청 필요):**
- `disaster` — `DISASTER_KEY` 미발급. data.go.kr/safetydata.go.kr에서 **서비스 신청·승인**이 선행돼야 함.
- `headroom` — KR-IP 우회로 연결은 되나 `KEPCO_API_KEY`(한전 빅데이터 개방포털 승인)가 유효해야 값이 나옴.
- CF/Deno의 egress IP까지 gov가 막으면 클라우드 경로 전부 불가 → 이때만 KR 상용 IP(VPS) 필요.

**프록시 둘 곳 (견고성 순):** ① 케이웨더 자체 서버(weatherplan.kweather.co.kr 백엔드) — 비용 0·키 내부 유지
· ② KR VPS(Cafe24/Gabia/네이버클라우드, ~₩5천/월) · ③ Cloudflare Workers(서울 PoP, egress IP는 엔드포인트별 테스트 필요).
