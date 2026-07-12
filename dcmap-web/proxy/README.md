# 상류 프록시 — 케이웨더 서버 없이 gov API 뚫기

`floodmap`·`headroom`(한전 여유용량)·`supply`(KPX 수급예보)가 Vercel에서 안 되는 건 대개
**IP/네트워크 문제**다. 케이웨더 자체 서버가 없어도 아래 순서로 해결한다.

## 0. 먼저 — 프록시가 정말 필요한지 확인 (인프라 0)

api/*.js에는 이미 **IPv4-직결 폴백**이 들어있다. 상당수 실패는 하드 차단이 아니라
IPv6 블랙홀(happy-eyeballs CONNECT_TIMEOUT)이라, 이 폴백만으로 프록시 없이 뚫린다.

1. Vercel env에 `KEPCO_API_KEY`(한전 40자리)만 넣고 재배포.
2. `https://<배포도메인>/api/headroom?lat=37.5&lng=127.0` 호출.
   - `{ available:true, ... }` → **끝. 프록시 불필요.**
   - `{ reason:"upstream_raw_timeout" }`·`upstream_UND_ERR_SOCKET` → 하드 차단. 1번(CF)·2번(Deno)으로.
   - `{ reason:"no_region_code" }` → 좌표→코드(vworld)가 막힌 것. 역시 프록시로 해결.

## 1. Cloudflare Workers (무료 · 추천)

`cloudflare-worker.js` 파일 상단 주석의 배포 절차 참고(대시보드 붙여넣기 ~5분).
배포 후 Vercel env 3개:

```
UPSTREAM_PROXY_BASE = https://<worker>.workers.dev
PROXY_TOKEN         = <임의 긴 문자열>   # 워커 Secret과 동일
KEPCO_API_KEY       = <한전 40자리>
```

## 2. Deno Deploy (무료 대안)

CF가 막히거나 계정이 없으면 Deno Deploy(무료)도 동일 역할. `deno-deploy.ts` 붙여넣고
`PROXY_TOKEN` 환경변수 설정 후, 발급 URL을 `UPSTREAM_PROXY_BASE`에 넣으면 된다.

## 공통 원리

프록시는 `?url=<대상 인코딩 URL>` + `x-proxy-token` 헤더를 받아 **대상 호스트 allowlist**를
확인한 뒤 그대로 GET → 바디 반환. 앱 코드(api/_proxy.js)는 `UPSTREAM_PROXY_BASE` 설정 시
자동으로 이 경로를 최우선 시도하고, 미설정 시 기존 동작 그대로(무해).

## 프록시로도 안 되는 것 (IP 무관 · 신청 필요)

- `disaster` — `DISASTER_KEY` 미발급. data.go.kr/safetydata.go.kr 서비스 신청·승인 선행.
- CF/Deno의 egress IP까지 gov가 막으면 클라우드 경로 전부 불가 → 이때만 KR 상용 IP(VPS/자체서버) 필요.
