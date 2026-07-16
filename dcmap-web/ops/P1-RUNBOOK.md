# P1 런북 — 변전소 여유 스냅샷 실가동

> 목적: 시드(가평·미금)를 넘어 **실제 월별 스냅샷을 수집**해 `/global` Data Room의 신선도·시계열을 살린다.
> 정직성: 코드(법정동)·값을 지어내지 않는다. 대상 코드는 공식 출처에서만 가져온다.

## 왜 로컬 샌드박스에서 바로 못 돌리나
- 수집기는 **배포된 프록시**(`/api/headroom`)를 호출한다 — 이 프록시만 KEPCO 키(서버 env)를 갖는다.
- 빌드 샌드박스에서는 배포 도메인 프록시가 차단(도달 불가)될 수 있다. **실가동은 배포 측(도메인/Action)에서** 한다.

## 1) 대상 코드 확보 (지어내지 말 것)
- 법정동코드(10자리)는 **행정표준코드관리시스템**(code.go.kr) 또는 app의 vworld/SGIS 역지오코딩에서 확인.
- `data/headroom_targets.json`의 `targets[]`에 `{label, admCd, sido, area}`로 추가. 코드가 불확실하면 넣지 않는다.
- 프록시는 admCd에서 sido=slice(0,2)·sigg=slice(2,5)만 사용(시군구 단위 조회, emdCode='').

## 2) 실행
```bash
# 배포 도메인을 SNAPSHOT_BASE로. (프록시가 KEPCO 키를 가진 그 도메인)
SNAPSHOT_BASE="https://<배포도메인>" node scripts/snapshot-headroom.mjs
# 특정 월 강제/재수집:
SNAPSHOT_MONTH=2026-08 SNAPSHOT_BASE="https://<도메인>" node scripts/snapshot-headroom.mjs --force
```
- 같은 월 파일이 있으면 **신규 대상만 병합**(기존 보존). `--force`면 수집분으로 대체.
- 결과: `data/headroom_snapshots/<YYYY-MM>.json` (asOf·version·captured 태깅).

## 3) 반영·자동화
- 생성된 스냅샷을 커밋 → `/global` Data Room의 `snapshotMonths`·`latestMonth`·시계열이 자동 갱신.
- 월 1회 자동화: `ops/headroom-snapshot.workflow.yml.template`를 레포 루트 `.github/workflows/`로 복사하고
  저장소 Variables에 `SNAPSHOT_BASE` 설정(현재는 아티팩트 업로드 → 검토 후 자동 커밋 승격).

## 검증
- 2개월+ 쌓이면 `headroomSnapshots.js`의 `latestDeltas()`가 변화(delta)를 반환 → P3 변화 피드/모니터링 구독의 기반.
- 값 0은 정상(당해 여유 없음). 원문 유의사항(분기 갱신·전기사용신청 후 확정) 유지.
