# Chronicle — 시간해자 크로니클

> **오늘 기록하지 않으면 영원히 살 수 없는 것에 크론을 걸고,
> 해시체인으로 "먼저·진짜로 기록했다"를 증명한다.**

"19개 프로젝트"가 아니라 **1개 엔진 + 19개 어댑터**. 전체 스펙(동결판 v4)은
[`PLAN.md`](./PLAN.md), 첫 어댑터는 **#4 청약·분양가 박제(`bunyang-capsule`)**.

> **호스팅:** 당분간 `weatherplan-ai` 리포의 `chronicle/` 아래에 두고,
> 이후 자체 리포로 분리한다 — [standalone 분리](#standalone-분리) 참고.

## 아키텍처

```
chronicle/
├── engine/                     # fetch → normalize → diff → hash → publish
│   ├── fetch.ts                #   HTTP 호출: 재시도(지수 백오프)·타임아웃·레이트리밋
│   ├── diff.ts                 #   이전 스냅샷 대비 record-level 변경 감지
│   ├── integrity.ts            #   SHA-256 체인: prev_hash + content_hash → chain_hash
│   ├── publish.ts              #   feed.xml(Atom) 생성
│   ├── store.ts                #   data/<id>/ 파일 I/O (append-only 규율)
│   ├── pipeline.ts / run.ts    #   1회 실행 파이프라인 + CLI
│   ├── verify.ts               #   해시체인 전수 검증 CLI
│   └── adapters/               #   어댑터 3계열 공통 추상
│       ├── api-records.ts      #   API 레코드형: #4 #5 #7 #9 #13 #18
│       ├── page-text.ts        #   페이지 텍스트형: #11 #14 #17
│       └── file-probe.ts       #   파일/프로브형: #16 #19
├── sources/<id>/               # config.yml + adapter.ts (소스당 하나)
├── data/<id>/                  # snapshots/ + changes.jsonl + latest.json + integrity.json + feed.xml
└── (모노리포 루트) .github/workflows/<id>.yml   # 소스별 cron
```

## 산출물 계약

`data/<id>/` 아래 다섯 가지가 산출물의 전부다.

| 파일 | 내용 | 규율 |
|---|---|---|
| `changes.jsonl` | 변경 이벤트 원장 (아래 스키마) | **append-only** — 과거 줄·과거 커밋 수정 금지 |
| `snapshots/<ts>.json` | 원본 API 응답 무가공 보존 | 변경이 있던 실행만 기록 |
| `latest.json` | 마지막 관측 현재 상태 (entity_id → record) | 파생물 — 원장에서 재구성 가능 |
| `integrity.json` | 해시체인 봉인 상태 (genesis·head·length) | 원장과 함께만 갱신 |
| `feed.xml` | 최근 변경 50건 Atom 피드 | 파생물 |

`changes.jsonl` **한 줄** = 하나의 관측 사실:

```json
{"observed_at":"…","entity_id":"…","field":"…","before":…,"after":…,"source_url":"…","content_hash":"…","chain_hash":"…"}
```

- 레코드 **생성**: `field="__record__"`, `before=null`, `after=`전체 필드
- 레코드 **삭제**: `field="__record__"`, `after=null` — **삭제도 이벤트다**
- 필드 **변경**: `field=`필드명, `before`/`after=`이전·이후 값

같은 실행의 이벤트 순서는 결정적이다(entity_id·필드명 정렬) — 같은 입력이면
언제나 같은 체인이 나온다.

## 해시체인 — "먼저·진짜로 기록했다"의 증명

```
genesis      = SHA256("chronicle:<source_id>:genesis")
content_hash = SHA256(canonicalJson({observed_at, entity_id, field, before, after, source_url}))
chain_hash   = SHA256(직전 chain_hash + content_hash)      # 첫 줄의 직전 = genesis
```

`canonicalJson` = 객체 키 재귀 정렬 후 `JSON.stringify` (결정적 직렬화).
`integrity.json`이 체인 머리(`chain_hash`)와 길이를 봉인하고, 공개 리포의 커밋
히스토리가 "그 시점에 그 머리가 존재했다"를 공증한다. 과거 한 줄이라도 바꾸면
그 줄의 `content_hash`, 이후 모든 줄의 `chain_hash`, 그리고 커밋 해시가 전부 어긋난다.

### 검증 방법

```bash
npm run verify -- bunyang-capsule
# ✓ bunyang-capsule: 이벤트 N건, 체인 온전 (head …)
```

외부인이 직접 재계산해도 같다 (Node 한 줄 요지):

```js
// changes.jsonl 각 줄에 대해:
//   1) 해시 필드를 뺀 본문의 canonicalJson을 SHA-256 → content_hash와 일치?
//   2) SHA256(직전 chain_hash + content_hash) → chain_hash와 일치?
// 마지막 chain_hash·줄 수 → integrity.json의 chain_hash·length와 일치?
```

특정 시점의 존재 증명은 `git log -- data/<id>/integrity.json`으로 그 시점
커밋의 체인 머리를 확인하면 된다.

## 실행

```bash
npm ci
npm test                              # 오프라인 — 네트워크 없이 전체 파이프라인 검증
npm run typecheck

# 실제 수집 (공공데이터포털 인증키 필요)
DATA_GO_KR_KEY="<디코딩 인증키>" npm run collect -- bunyang-capsule
npm run collect -- bunyang-capsule --dry-run   # 계산만, 쓰기 없음
npm run verify  -- bunyang-capsule
```

- 키 발급: data.go.kr → **"한국부동산원_청약홈 분양정보 조회 서비스"** 활용신청 →
  마이페이지의 **Decoding(디코딩) 키**를 사용한다. 호출은 `Authorization: Infuser`
  헤더 방식이라 URL 인코딩 문제가 없다.
- GitHub Actions에는 리포 **Secrets**에 `DATA_GO_KR_KEY`로 등록한다.
  **키를 코드·로그·커밋에 절대 노출하지 않는다.**

## 크론 운영

`.github/workflows/bunyang.yml`(모노리포 루트)이 일 1회 수집한다:
수집 → 체인 검증 → **변경이 있을 때만** `data/` 커밋(`[skip ci]`).
변경이 없는 날은 엔진이 파일을 하나도 쓰지 않으므로 커밋도 없다.

스케줄은 **리포 기본 브랜치에 워크플로우가 올라간 뒤부터** 활성화된다.
그 전에는 Actions 탭에서 수동 실행(workflow_dispatch)으로 돌릴 수 있다.

### 안전판

- 저장 상태가 있는데 수집이 0건이면 **소스 장애로 간주하고 중단**한다
  (빈 응답이 전체 삭제 이벤트로 번지는 것을 방지). 의도된 상황이면
  `config.yml`에 `allow_empty: true`.
- 삭제 이벤트가 삭제 감지 대상의 30%(기본, `max_removal_ratio`)를 넘으면
  **부분 응답 의심으로 중단**한다 — 오탐 삭제의 대량 봉인 방지.
- 수집 윈도(`window_days`) 밖으로 밀려난 레코드는 페치에 없어도 삭제로
  기록하지 않는다 — `latest.json`에 마지막 관측 상태로 박제되어 남는다.
- **크래시 복구**: 매 실행 시작 시 원장(`changes.jsonl`)을 제네시스부터
  재검증하고, 이전 실행이 도중에 죽어 `integrity.json`/`latest.json`이
  뒤처져 있으면 원장에서 재구성한다(기존 원장 줄은 불변 — append-only 유지).
  원장 자체가 손상된 경우엔 자동 복구하지 않고 마지막 정상 커밋에서의
  수동 복구를 요구한다.

## 새 어댑터 추가

1. 계열 선택 (PLAN.md §0): **API 레코드형** `ApiRecordsAdapter` /
   **페이지 텍스트형** `PageTextAdapter` / **파일·프로브형** `FileProbeAdapter`
2. `sources/<id>/config.yml` — `id`(디렉터리명과 동일)·`family`·소스 고유 설정
3. `sources/<id>/adapter.ts` — 계열 베이스 상속, 인스턴스를 `default export`
   - API 레코드형은 `fetchRaw()`/`normalize()` 둘만 구현하면 된다
   - 수집 윈도가 있으면 `removalScope()`를 재정의해 삭제 오탐을 막는다
4. `.github/workflows/<id>.yml` — `bunyang.yml`을 복사해 소스 id만 교체
5. 확장 순서(PLAN.md §5): #1 → #2 → #12 → #11 → #14 → #16+#19 → #13 → #18

## Standalone 분리

koreaapi와 같은 패턴 — 히스토리를 보존한 채 자체 리포로 떼어낸다:

```bash
# 모노리포 루트에서
bash chronicle/scripts/split-chronicle.sh
git push https://github.com/<owner>/chronicle.git chronicle-standalone:main
```

분리 후 체크리스트: 워크플로우를 `.github/workflows/`로 옮기고
`working-directory: chronicle`·`chronicle/` 경로 접두를 제거, 새 리포
Secrets에 `DATA_GO_KR_KEY` 재등록, Actions에서 수동 1회 실행으로 확인.

## 원칙 (PLAN.md §0)

원본 보존 / diff 필수 커밋 / **append-only** / 삭제도 이벤트 / 과거 커밋 수정 금지.
