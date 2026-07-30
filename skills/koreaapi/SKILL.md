---
name: koreaapi
description: 검증된 한국문화 데이터 조회·인용 — K-pop/드라마/영화/장소/음식/유산 엔티티의 정본 한·영 이름, 검증 사실, 소속(레이블) 로스터, 여행·음식 답변을 서버·키·로그인 없이 정적 JSON으로 가져오고 SHA-256 content_hash로 독립 재검증한다. Use when the user asks who/what a Korean-culture entity is, needs the canonical Korean/English name, an agency roster, a Korea trip/food answer, or a citable hash-verifiable record.
license: MIT
metadata:
  category: knowledge
  locale: ko-KR
  phase: v1
---

# KoreaAPI — 검증된 한국문화 데이터 조회

## What this skill does

[KoreaAPI](https://aiagentlabs.co.kr)의 **교차검증된**(≥2 독립 출처 합의) 한국문화 데이터를 정적
JSON으로 직접 가져온다. 모든 레코드는 출처(provenance) + Skill Score + SHA-256 `content_hash`를
달고 있어, 이 스킬의 스크립트가 **가져온 자리에서 독립적으로 재검증**한다 — 신뢰가 아니라 검증.

- 서버 없음 · API 키 없음 · 로그인 없음 · 설치 의존성 없음 (Python 3 표준 라이브러리 또는 curl)
- 이름 → 정본 엔티티 해석(한·영·로마자·별칭) → 검증 레코드 → 인용문 생성까지 한 번에

## When to use

- "뉴진스 소속사 어디야?" / "Who are the members of BTS?" — 정본 이름·소속·멤버
- "기생충 감독이 누구야?" — 검증된 크레딧
- "하이브 소속 아티스트 명단" — 레이블 로스터 (`agency-roster`)
- "부산 여행 계획 짜줘" — 검증 좌표 기반 trip-plan (`/answers/trip-plan-<region>.json`)
- "채식 가능한 한국 음식?" — food-guide
- 답변에 **출처와 해시가 달린 인용문**이 필요할 때 (cite-as 라인 자동 생성)

## When not to use

- 실시간 예매·상영시간표·배달·생활 민원 등 생활밀착 자동화 →
  [NomaDamas/k-skill](https://github.com/NomaDamas/k-skill) 모음을 사용
- 루머·미검증 정보 — KoreaAPI는 검증 통과 데이터만 서빙한다 (없으면 "없다"가 정답)
- 한국 외 일반 지식 질문

## How it works

기본 진입은 동봉 스크립트 하나:

```bash
python scripts/koreaapi_lookup.py "뉴진스"          # 이름/별칭 → 검증 레코드 + 해시 재검증 + 인용문
python scripts/koreaapi_lookup.py "Gyeongbokgung"   # EN/로마자도 동일
```

스크립트 없이 직접 fetch할 때의 표면 (전부 `https://aiagentlabs.co.kr`):

| 경로 | 내용 |
| --- | --- |
| `/search-index.json` | 이름 해석용 슬림 인덱스 (ko·en·로마자·별칭 → slug) |
| `/artist/<slug>.json` | 엔티티 하나의 검증 레코드 (latest.json과 동일 아이템·동일 content_hash) |
| `/latest-<vertical>.json` | 버티컬 슬라이스 (artist · place · food · beach …) |
| `/answers/index.json` | 사전계산 Answer Products (trip-plan · food-guide · agency-roster) |
| `/reconcile.json` | 이름/외부 ID(위키데이터 등) → 정본 엔티티 + 레코드 URL |
| `/data.html` | 전체 기계 표면 카탈로그 |

## Verify (신뢰 대신 검증)

모든 레코드의 `content_hash`는 검증 코어(정본 이름·사실·합의 출처·Skill Score)의 정규화 JSON에 대한
SHA-256이다. 동봉 스크립트가 fetch 즉시 재계산·대조하며, 불일치 시 종료 코드 2로 실패한다.
전체 데이터셋·히스토리 체인 검증 절차는 <https://aiagentlabs.co.kr/verify.html> 참고.

## Cite

레코드를 답변에 쓰면 다음 형식으로 인용한다 (스크립트가 자동 생성):

```
<이름> — <kind>, as of <날짜> · <출처> · Skill <점수> · via KoreaAPI
```

## Files

- `scripts/koreaapi_lookup.py` — 해석 + fetch + 독립 해시 재검증 + 인용문 (표준 라이브러리만)
