# 관측지점 좌표 검증 파이프라인 — verify-stations (2026.07)

`src/verify/stationsData.js` 의 근사 좌표(`STATIONS_META.verified:false` 부채)를
기상청 API허브 공식 지점 메타데이터로 검증·교체하는 수동 데이터 파이프라인.
실행 주체는 사람(로컬/CI 수동 트리거)이며 **빌드에 연결하지 않는다** — 실행 시점에만
`stationsData.js` 가 재작성되고, 그 결과가 커밋되어 앱에 반영된다.

## 실행법

```bash
KMA_APIHUB_KEY=<인증키> node scripts/verify-stations.mjs
```

- `KMA_APIHUB_KEY` 미설정 시: 사용법만 출력하고 정상 종료(에러 아님) — CI에서 키 없이 돌아도 안전.
- 성공 시: `src/verify/stationsData.js` 재작성 + 지점별 좌표 이동거리(km) 상위 10 출력 +
  미매칭 제거 지점 목록 출력. diff 확인 후 커밋.

### KMA_APIHUB_KEY 발급
1. [apihub.kma.go.kr](https://apihub.kma.go.kr) 가입(기상청 API허브).
2. 로그인 → 마이페이지에서 **인증키(authKey)** 확인/발급.
3. 지상관측 지점정보(stn_inf) API 활용 신청이 필요한 경우 포털에서 신청.
4. 키는 env로만 전달 — 코드/레포/로그에 넣지 않는다.

## 상류 엔드포인트 — ⚠️ 가정(실행 검증 전)

```
https://apihub.kma.go.kr/api/typ01/url/stn_inf.php?inf=SFC&tm=&stn=&authKey=<KEY>
```

- 응답: 공백 구분 텍스트. 헤더는 `#` 시작 주석행이며 컬럼은 `STN LON LAT ... STN_KO` 순으로 가정.
- **이 경로·파라미터·컬럼 순서는 API허브 문서 기반의 합리적 추정이며, 실제 키로 실행해
  검증하기 전까지는 '가정'이다.** 스크립트는 헤더 주석행에서 `STN`/`LON`/`LAT`/`STN_KO`
  컬럼 인덱스를 먼저 찾고, 못 찾으면 위 순서로 위치 기반 파싱한다.
- 인코딩: typ01 텍스트는 EUC-KR인 경우가 많아 EUC-KR 우선 디코딩(실패 시 UTF-8 폴백).

### 엔드포인트가 다를 경우
`scripts/verify-stations.mjs` **상단 상수만 교체**하면 된다:

```js
const STN_INF_URL = 'https://apihub.kma.go.kr/api/typ01/url/stn_inf.php'
const STN_INF_PARAMS = { inf: 'SFC', tm: '', stn: '' }
```

응답 컬럼 순서가 다르고 헤더 주석행도 없다면 `parseStnInf()` 의 기본 인덱스
(`{ STN: 0, LON: 1, LAT: 2 }`)를 실제 순서로 조정한다. 실패 시 스크립트가 응답
앞 15행을 진단으로 출력하므로 그것으로 실제 형식을 확인하면 된다.

## 안전장치 (정직성 원칙)

잘못된 상류 응답으로 좋은 데이터를 덮어쓰지 않도록, 아래를 통과할 때만 파일을 쓴다:

1. **한국 bbox 검증** — 파싱된 좌표가 위도 32~40, 경도 123~132 밖이면 해당 행 제외.
   (컬럼 밀림·단위 오류·스와프된 LAT/LON을 걸러냄)
2. **최소 매칭 수** — 기존 73지점 중 **60개 이상**이 상류 지점번호(STN)와 매칭될 때만 진행.
   미달이면 **아무것도 쓰지 않고** 매칭 수 + 응답 샘플을 진단 출력 후 exit 1.
3. **가짜 값 금지** — 상류에서 확인되지 않은 지점은 좌표를 유지·추정하지 않고 목록에서
   **제거**하고 제거 목록을 출력한다(개수보다 정확성).
4. 통과 시 `STATIONS_META` 를 다음으로 갱신:
   ```js
   { source: '기상청 API허브 지점정보(stn_inf)', verified: true,
     note: '공식 지점 메타데이터 기준', updated: 'YYYY-MM' /* 실행일 */ }
   ```

## 주의
- **빌드에 연결 금지** — package.json scripts / postbuild / CI 빌드 스텝에 넣지 않는다.
  네트워크·키 의존이 빌드 재현성을 깨고, 실패 시 배포가 막히기 때문.
- 실행 후 반드시 `git diff src/verify/stationsData.js` 로 이동거리 요약과 제거 목록을
  교차 확인한 뒤 커밋한다.
