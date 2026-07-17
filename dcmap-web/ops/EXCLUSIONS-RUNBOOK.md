# EXCLUSIONS 런북 — 입지 배제 오버레이 데이터 실가동

> 목적: 데이터센터 입지의 **법적 건축가능성(GO/NO-GO)** 판정을 위한 공개 GIS 배제 폴리곤
> (그린벨트·군사·공항 고도제한·상수원·문화재)을 수집해 `data/exclusions/layers/<key>.json`
> 으로 채운다. 파일이 들어오면 엔진(`src/score/exclusions.js`)이 **자동 활성화**한다.

## 정직성 원칙 (이 프로젝트의 불변식)
- **폴리곤을 지어내지 않는다.** 공개 GIS에서 실제로 받은 지오메트리만 기록한다.
- 데이터가 없으면 파일을 **쓰지 않는다.** 없는 레이어는 UI에서 **"데이터 대기"**(status=`pending`)로
  표시되며, 저촉/비저촉을 절대 추정하지 않는다.
- placeholder/샘플/근사 좌표 금지. `--dry-run` 은 계획만 출력하며 네트워크 호출을 하지 않는다.
- 수집기는 실데이터 0건이거나 오류면 **파일을 쓰지 않고** manifest 를 `available=false` 로 남긴다.

## 왜 이 샌드박스(빌드 환경)에서 못 돌리나
- 토지이음(LURIS)·브이월드·data.go.kr **outbound 가 차단**됨. 여기서는 수집 불가.
- 실가동은 **배포측**(개발자 로컬 / CI / 배포 도메인)에서 키를 주입해 실행한다.

## 엔진 자동 활성화 흐름
1. 수집기가 `data/exclusions/layers/<key>.json`(표준 GeoJSON FeatureCollection, `properties.name`)을 쓴다.
2. `src/score/exclusions.js` 가 `import.meta.glob('../../data/exclusions/layers/*.json')` 로 빌드 시 번들.
3. 파일이 있는 레이어만 `checkExclusions()` 가 점(点) 저촉 판정(`hit`/`clear`)에 사용. 없으면 `pending`.
4. `manifest.json` 의 `available`/`asOf`/`features` 로 SitePanel·맵·데이터룸이 신선도를 표시.
   → **코드 수정 불필요.** 파일만 커밋하면 활성화된다.

## 레이어별 출처 · 엔드포인트 · 라이선스 · 키

| key | 대상 | 출처 | 키(env) | 상태 |
|---|---|---|---|---|
| `greenbelt` | 개발제한구역(그린벨트) | 국토교통부·브이월드 도시계획 | `VWORLD_KEY` | ready(레이어코드 확정 필요) |
| `military` | 군사시설보호구역 | 국방부·토지이음(LURIS) | `DATA_GO_KR_KEY` | **TODO(엔드포인트 미확정)** |
| `airport_height` | 공항 고도제한(장애물제한표면) | 국토교통부·한국공항공사 | `DATA_GO_KR_KEY` | **TODO(엔드포인트 미확정)** |
| `water_source` | 상수원보호구역 | 환경부(EGIS) | `DATA_GO_KR_KEY` | **TODO(엔드포인트 미확정)** |
| `heritage` | 문화재보호구역·매장문화재 유존지역 | 국가유산청 | `DATA_GO_KR_KEY` | **TODO(엔드포인트 미확정)** |

각 레이어의 정확한 CONFIG(엔드포인트 템플릿·레이어ID·name 속성키·라이선스·TODO)는
`scripts/fetch-exclusions.mjs` 상단 `LAYERS` 블록에 인라인으로 있다. 여기 요약을 둔다.

### greenbelt — vWorld 데이터 API (status: ready*)
- 엔드포인트(실 베이스): `https://api.vworld.kr/req/data`
  `?service=data&request=GetFeature&version=2.0&format=json&crs=EPSG:4326&geometry=true&data=<레이어코드>&key=<KEY>&domain=<도메인>`
  (수집기가 `size`/`page` 로 페이징하며 `response.result.featureCollection.features` 를 모은다.)
- **⚠ 확인 필요**: `data=` 레이어코드. 현재 기본값 `LT_C_UD801`(용도지역 예시)이며 **개발제한구역
  전용 코드가 아닐 수 있다.** vWorld → 오픈API → 데이터 API **레이어 목록**에서 개발제한구역 도형
  레이어코드를 확정한 뒤 `VWORLD_GREENBELT_DATA` 로 주입하면 코드 변경 없이 status ready 유지.
  동시에 `nameProps`(현재 `DGM_NM|UNM|MNU_NM|name|NAME`)가 실제 속성명과 맞는지 확인.
- 라이선스: vWorld 오픈API 이용약관(출처표시 필수). 상업적 재배포 전 약관 확인.
- 키 발급: <https://www.vworld.kr> 회원가입 → 오픈API 인증키 발급(데이터 API + 도메인 등록).

### military — 군사시설보호구역 (status: TODO)
- **확인 필요**: 도형(폴리곤) 제공 경로. 후보 (a) data.go.kr "국방부_군사시설 보호구역" GIS
  데이터셋의 WFS/파일 URL, (b) 국가공간정보포털(NSDI) 오픈마켓 WFS typename.
  토지이음은 규제 조회는 되나 폴리곤 대량 다운로드는 위 GIS 포털을 통한다.
- 확정 시 `scripts/fetch-exclusions.mjs` 의 `military.endpoint`(WFS GetFeature,
  `OUTPUTFORMAT=application/json`, `SRSNAME=EPSG:4326`)·`typeName`·`nameProps` 를 채우고
  `status='ready'` 로 변경. 키: `DATA_GO_KR_KEY`.

### airport_height — 장애물제한표면 (status: TODO)
- **확인 필요**: 표면(수평·원추·진입 등) 도형 출처. 후보 (a) 국토교통부 항공정보포털(AIP)
  장애물제한표면, (b) data.go.kr "한국공항공사_장애물 제한표면", (c) NSDI 항공 WFS.
- 표면 유형별 제한 높이는 속성으로 보존(엔진은 평면 저촉만 판정, 높이는 표시용).
- 확정 시 endpoint·typeName·nameProps 채우고 ready. 키: `DATA_GO_KR_KEY`.

### water_source — 상수원보호구역 (status: TODO)
- **확인 필요**: 환경공간정보서비스(egis.me.go.kr) 또는 data.go.kr/NSDI "환경부_상수원보호구역"
  의 WFS typename 또는 다운로드(SHP/GeoJSON) URL.
- 확정 시 endpoint(WFS, EPSG:4326, application/json)·typeName 채우고 ready. 키: `DATA_GO_KR_KEY`.

### heritage — 문화재보호구역·매장문화재 유존지역 (status: TODO)
- **확인 필요**: (a) 지정문화재 보호구역 도형, (b) 매장문화재 유존지역(지표조사) 두 데이터셋이
  분리돼 있을 수 있음. 국가유산청 문화재 공간정보 서비스 / data.go.kr "국가유산청_…" GIS.
- 두 데이터셋을 각각 받아 하나의 FeatureCollection 으로 **병합**(속성으로 유형 구분) 권장.
- 확정 시 endpoint·typeName·nameProps 채우고 ready. 키: `DATA_GO_KR_KEY`.

## API 키 등록
- 로컬: `.env.local`(git 무시) 또는 셸 export.
  - `export VWORLD_KEY=...`  ·  `export DATA_GO_KR_KEY=...`(디코딩 키 사용).
  - 선택: `VWORLD_DOMAIN`(vWorld 키에 등록한 도메인), `VWORLD_GREENBELT_DATA`(레이어코드),
    `VWORLD_DATA_URL`(엔드포인트 오버라이드), `VWORLD_MAX_PAGE`(페이징 상한).
- CI(GitHub Actions): 저장소 **Secrets** 에 동일 이름으로 등록 후 워크플로 `env:` 로 주입.
- **키를 코드/로그/커밋에 노출 금지.** `.env.local` 은 절대 커밋하지 않는다.

## 실행 명령
```bash
# 1) 실행 계획만 확인(네트워크 호출 없음, 항상 먼저 권장)
node scripts/fetch-exclusions.mjs --dry-run

# 2) ready + 키 있는 레이어 전부 수집
VWORLD_KEY=... DATA_GO_KR_KEY=... node scripts/fetch-exclusions.mjs

# 3) 특정 레이어만
VWORLD_KEY=... node scripts/fetch-exclusions.mjs --layer greenbelt
node scripts/fetch-exclusions.mjs --dry-run --layer heritage
```
- 수집기는 레이어별로 독립 실행·부분 진행 저장: 한 레이어 실패가 나머지를 막지 않는다.
- 종료 시 요약(성공/0건/실패/건너뜀) 출력. 실패가 있으면 exit code 1.
- status=`todo` 레이어와 키 없는 레이어는 자동 SKIP(파일·manifest 미변경).

## 수집 후 반영
1. 새로 생긴 `data/exclusions/layers/<key>.json` 과 갱신된 `manifest.json` 을 **커밋**.
2. 빌드 시 엔진이 자동 번들·활성화(코드 변경 불필요).
3. 실행 전 후 `git diff data/exclusions/manifest.json` 으로 `available/asOf/features` 확인.

## 데이터 크기 · 단순화 가이드
- 그린벨트 등 대면적 폴리곤은 원본이 수 MB~수십 MB일 수 있다. 번들을 가볍게 유지할 것.
- 수집기 내장: 좌표를 **소수 5자리(≈1.1m)로 반올림**(무손실에 가까운 크기 절감, 지오메트리 위조 아님).
- 그래도 클 때(권장 상한: 레이어당 압축 전 **~1–2MB**): 배포 전 별도 단순화.
  - 예: `mapshaper` — `mapshaper in.json -simplify 15% keep-shapes -o out.json`
  - 또는 TopoJSON 변환/양자화. **단순화는 정밀도 저하이므로** 판정 경계에 민감한 부지는
    원본으로 재확인. (엔진은 점-in-폴리곤 판정 → 과단순화 시 경계 저촉 오판 위험.)
- 좌표계는 반드시 **WGS84 [lng,lat]**(EPSG:4326). 수집기는 한국 경계 밖 좌표가 과반이면
  CRS 오설정으로 보고 파일을 쓰지 않는다(EPSG:5186 등 미터좌표 재요청 필요).

## 갱신 주기(cadence)
- 그린벨트·용도지역·상수원·문화재: **분기 1회** 권장(제도·고시 변경 반영).
- 군사시설보호구역: 고시 변경 시(비정기) — 반기 점검 권장.
- 공항 장애물제한표면: 공항 고시/증축 시 — 반기 점검 권장.
- 갱신마다 `manifest.json` 의 `asOf` 로 신선도가 UI에 노출된다. 오래되면 데이터룸에서 노후 경고.
- CI 자동화 시 `ops/headroom-snapshot.workflow.yml.template` 패턴(월/분기 스케줄 + Secrets)을
  참고해 별도 워크플로를 두되, 결과는 검토 후 커밋 승격(무인 커밋 지양).
