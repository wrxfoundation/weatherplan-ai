# WLBN 운용현황 — Vercel 배포 묶음

서우 11/21 「WLBN 현금화 현황 대시보드를 운용현황으로 해서 매일 업데이트하게끔 Vercel 배포 파일」.
비공개 대시보드(https://claude.ai/artifact/Jc7T4wgtdZ6nUXYTkCs21C)와 같은 화면 · 같은 계산이고, 원장을 스스로 읽어 갱신한다.

## 화면 구성(11/22 고도화)

WLBN · RLUSD · XRP 가 어디서 어디로 움직였는지 보는 화면이다. 위쪽에 붙어 다니는 줄에서 **기간(전체 · 최근 30일 · 최근 7일)** 을 고르면 아래가 모두 그 기간으로 바뀐다.

| 구역 | 보여 주는 것 |
|---|---|
| 한눈에 | 일반 사용자 지갑이 받은 양 · 판 양 · 받은 대금(RLUSD · XRP 따로) · 하루 평균 매도 추세 · 풀에 넣어 둔 양 · 지금 가격 |
| 흐름 | **흐름 그림** — 판 쪽(묶음) → 풀(XRP 풀 · RLUSD 풀 · 그 밖의 경로) → 산 쪽(묶음), 띠 굵기 = WLBN. 그 아래 판 쪽이 받은 · 산 쪽이 낸 RLUSD · XRP 합계와 묶음별 표 |
| 날짜별 | 일반 사용자 지갑의 하루 판 양 · 산 양 · 새로 받은 양 / 시장 전체 묶음별 막대 / 표로 보기 |
| 풀 | 두 풀에 지금 든 양 · 가격 선 · 풀에 든 WLBN 선 · 누가 풀에 넣었나(WLBN · RLUSD · XRP) |
| 회사 계정 | 사이트가 이름 붙인 계정별 잔액 · 지급 · 산 양 · 낸 RLUSD/XRP · 풀에 넣은 양 |
| 지갑 | 일반 사용자 지갑별 표 — 주소 글자로 찾기 · 열 이름 눌러 정렬 · 전체 보기 |
| 분포 | WLBN 이 지금 어디에 있나(잠금 · treasury · seed · staking · 풀 · match · kweather · bot · operations · 일반 지갑) |
| 네트워크 · 읽는 법 | 사이트 · DexScreener 공개 값, 용어 풀이, 집계 기준과 한계 |

쓰기 편하게 한 것: 구역 메뉴가 위에 붙어 다님(휴대폰에서 고정 영역 89px) · 그림은 가리키거나 눌러 값 확인(손을 떼도 유지) · 값이 전부 0인 열은 숨김 · 최신 자료를 못 받으면 알림 줄 · 밝은/어두운 테마 · 「새로 불러오기」.

## 들어 있는 것

| 경로 | 하는 일 |
|---|---|
| `public/index.html` | 화면. 외부 의존은 글꼴(Pretendard CDN)뿐이고 못 받아도 기본 글꼴로 뜬다 |
| `public/snapshot.json` | 배포 시점 자료. 화면이 먼저 이걸로 그리고, 최신 자료가 오면 바꿔 그린다 |
| `api/data.js` | 최신 원장까지 반영한 자료를 돌려준다(화면을 열 때) |
| `api/refresh.js` | 매일 예약 실행이 부른다(`vercel.json` — 매일 00:10 한국 시간) |
| `lib/core.js` | 계산 규칙. `depin/tools/wlbn-cashout/metrics.py` 와 같은 규칙에 풀별 · 통화별 흐름, 풀 예치(통화별), 날짜별 풀 잔량을 더했다(상태 판 2) |
| `lib/xrpl.js` · `lib/ext.js` | 공개 XRPL 노드에서 새 거래만 받기 · wellbian.io 와 DexScreener 공개 값 받기 |
| `lib/store.js` | 상태를 Vercel Blob 에 남기기(연결돼 있을 때만). 판이 다른 옛 상태는 무시하고 출발 상태에서 다시 이어 받는다 |
| `lib/snapshot-state.json` | 출발 상태(11/21 13:39 한국 시간, 원장 108468235 까지) |
| `scripts/build-snapshot.js` | 출발 상태를 다시 만드는 스크립트(로컬) |

## 배포 순서

1. 이 폴더(또는 zip)를 Vercel 새 프로젝트로 올린다. 프레임워크는 **Other**, 빌드 명령 없음.
2. 프로젝트 **Storage → Blob 저장소 만들기 → 이 프로젝트에 연결**. `BLOB_READ_WRITE_TOKEN` 이 자동으로 들어간다. 연결한 뒤 한 번 Redeploy.
3. 끝. 예약 실행은 `vercel.json` 에 들어 있어 따로 켤 것이 없다.

## 갱신 방식

- 매일 00:10(한국 시간)에 `/api/refresh` 가 마지막으로 반영한 원장 이후의 거래만 받아 더하고 상태를 저장한다.
- 화면을 열 때도 `/api/data` 가 같은 일을 한다(응답은 15분 동안 재사용).
- **Blob 을 연결하지 않아도 뜬다.** 다만 매번 배포 시점 상태에서부터 다시 받아야 해서, 하루 700~1,000건씩 쌓이는 거래를 2주쯤 지나면 60초 안에 다 못 받는다. 그때는 받은 데까지만 보인다. 오래 쓸 거면 2번을 꼭 한다.
- 응답의 `info` 로 상태를 본다: `storage`(blob · bundled) · `fetched`(이번에 받은 거래 수) · `complete`(끝까지 받았는지) · `xrpl_error` · `storage_error`.

## 환경변수(선택)

| 이름 | 뜻 |
|---|---|
| `SHOW_BEFORE=1` | 이전 풀 기간(10/2~24) 표와 10/24 기록 문단을 화면에 낸다. 기본은 숨김 |
| `CRON_SECRET` | 넣으면 `/api/refresh` 는 Vercel 예약 실행만 부를 수 있다 |
| `XRPL_NODES` | 쓸 공개 노드 목록(쉼표). 기본 `s1.ripple.com, s2.ripple.com, xrplcluster.com` |

비밀 값은 저장소 · 코드에 넣지 않는다. 위 값은 Vercel 프로젝트 설정에만 둔다.

## 공개 범위

- Vercel 주소는 아는 사람 누구나 열린다. 검색 노출은 막아 두었다(`noindex`).
- 화면에는 지갑 주소 앞뒤 일부만 나오고 전체 주소는 응답에 넣지 않는다.
- 「재지급」(10/26 · 10/27)이라는 말은 화면에 그대로 있다 — 수령량 숫자의 뜻이라 빼지 않았다. 이전 풀 기간 표는 기본 숨김이다.
- 발화 규칙(`depin/intel/playbook.md`) 안의 문구다: 수익 약속 · 시세 전망 0, 지급량 · 가치 비보장 문구를 바닥글에 넣었다.

## 출발 상태 다시 만들기

`depin/tools/wlbn-cashout/README.md` 의 순서로 거래 내역을 받은 뒤

```bash
node scripts/build-snapshot.js <작업 폴더>          # lib/snapshot-state.json 갱신
node -e "const c=require('./lib/core'),S=require('./lib/snapshot-state.json');require('fs').writeFileSync('public/snapshot.json',JSON.stringify(Object.assign({ok:true,generated_at:null,ledger:S.ledger,info:{storage:'snapshot'}},c.buildDatasets(JSON.parse(JSON.stringify(S)),{}))))"
```

## 한계

- 지갑 주인은 모른다. 원화로 바꿨는지 · 거래소로 보냈는지도 모른다.
- wellbian.io · DexScreener 값을 못 받으면 마지막으로 받은 값을 보여 준다.
- 사이트가 계정 이름(bot · kweather 등)을 바꾸면 묶음 분류가 그에 따라 바뀐다.
