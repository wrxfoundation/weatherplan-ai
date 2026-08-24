# 원글 5 — 컨셉 다이어그램 "검증 루프" (구 "Why WELLBIAN Is Different")

**상태**: **스타일 전면 개정 (8/24, 서우 피드백)** — 손그림 doodle 톤이 "너무 캐주얼"하다는 판단으로
폐기. **다각형(로우폴리) 실사 렌더 + 글라스모피즘 + 클린 도형/전개도 + 폰트 위계질서**로 전환.
동시에 **제품명 비공개 방침** 반영 — WELLBIAN 브랜드명·ARC-600DA·Genesis 배지 전부 제거하고
순수 개념도(컨셉 다이어그램)로만 구성. 콘텐츠 설계 표는 구버전 참고용으로 하단에 남겨둠.

**게시 예정: 이미지 완성 후, 수~목** (여전히 유효). 제품명이 빠졌으므로 게시 시점은 브랜드 공개
전이라도 무방 — 오히려 티저 성격으로 더 이르게 써도 되는 자산.

## 힉스필드 프롬프트 (신규 — 글라스모피즘/로우폴리, 브랜드명 없음)

```
Premium fintech concept diagram, glassmorphism UI aesthetic: frosted
translucent glass panels with soft blur, subtle 1px light borders, gentle
drop shadows, floating above a deep navy #1B2A4A background with soft
signal-blue #2E6BFF glow gradients and ice-blue #DCEAF7 accent light. All
icons rendered as faceted low-poly 3D objects with realistic material
shading and soft specular highlights (not flat, not doodle). Clean thin
geometric line connectors between elements, precise and technical —
exploded-view schematic style, not illustrative. Strict typographic
hierarchy: large bold clean sans-serif headline, medium-weight subheading,
small tracked uppercase labels — no hand-lettering, no script, no doodle
linework anywhere. Layout top to bottom:
1) Large bold sans-serif headline "Turning A Reading Into A Verified
   Record", medium subheading below in ice-blue: "what happens between a
   sensor and a ledger"
2) Two glass comparison panels side by side: left panel muted and slightly
   dim, small uppercase label "MOST AIR MONITORS", one faceted low-poly
   sensor icon sitting alone with no connections, caption "reading stays
   on the device"; right panel brighter with a thin glowing signal-blue
   edge, small uppercase label "A VERIFIED NETWORK", a faceted sensor icon
   linked by clean glowing lines to a small cluster of network nodes,
   caption "each reading joins a shared, checked record"
3) Horizontal row of three glass hexagonal badges connected by clean
   directional arrow lines, each containing a faceted low-poly icon:
   sensor icon labeled "MEASURE", double-check shield icon labeled
   "CROSS-VERIFY", ledger/document icon labeled "RECORD"
4) Row of six small glass pill chips in a grid, each with a minimal
   faceted geometric icon and short uppercase label: "REAL-TIME READINGS"
   / "CROSS-CHECKED ACCURACY" / "LICENSED ACCESS" / "INSTANT SETTLEMENT"
   / "SHARED VALUE" / "ENTERPRISE-READY"
5) Bottom centered line, medium-large weight, ice-blue: "Making invisible
   air visible. Turning it into valuable data assets."
No brand wordmarks, no company name, no product name, no logos, no device
model numbers or batch numbers anywhere in the composition. No people.
Generous negative space, no photorealistic background clutter, 4:5 portrait
```

## 이 개정에서 바뀐 것 (구버전 대비)

| 항목 | 구버전 (손그림) | 신버전 (글라스모피즘/로우폴리) |
|---|---|---|
| 톤 | cream paper, black ink doodle, 손그림 | 딥네이비 배경, 글라스 패널, 로우폴리 실사 렌더 |
| 타이포 | 손글씨체 단일 위계 | 볼드 헤드라인 → 서브헤드 → 트래킹된 소문자 라벨, 3단 위계 |
| 아이콘 | doodle 일러스트 | 다각형(로우폴리) 3D 페이싯, 리얼리스틱 셰이딩 |
| 제목 | "Why WELLBIAN Is Different" (브랜드명 노출) | "Turning A Reading Into A Verified Record" (브랜드명 없음) |
| 우측 비교 패널 라벨 | "wellbian" (브랜드명) | "A VERIFIED NETWORK" (개념만) |
| Foundation 배지 | "ARC-600DA" · "Genesis #0001–5000" (제품 식별정보) | **섹션 자체 삭제** — 제품 공개 전이라 배지 불가 |
| 네트워크 혜택 6종 | 서술형 캡션(문장) | 짧은 대문자 라벨(칩 형태) — 위계질서상 하위 레벨이라 축약 |
| 종횡비 | 4:5 | 4:5 유지 |

## 실무 팁 (갱신)

- **온이미지 텍스트가 크게 줄었습니다**(문장형 캡션 → 짧은 라벨 위주) — 구버전의 최대 리스크였던
  철자 깨짐 확률이 자연히 낮아집니다. 그래도 라벨 6종+헤드라인은 생성 후 돋보기 검수 권장.
  브랜드명이 아예 프롬프트에 없으므로 "AI가 실수로 브랜드명을 잘못 써넣을 리스크"도 원천 차단.
- 글라스모피즘+로우폴리 조합은 일반 사실적 렌더 모델(예: 힉스필드 기본 실사 계열)이 doodle
  스타일보다 오히려 더 안정적으로 뽑는 경향 — nano-banana 계열 고집 없이 실사 렌더 우수 모델로
  테스트해도 무방.
- 배경이 어두운 네이비라 X 다크모드·라이트모드 양쪽에서 카드 경계가 뭉개지지 않는지 확인 필요
  (썸네일 축소 시 미리보기 체크).

## 활용처

X 단독 포스트(제품 공개 전 티저로도 가능, 브랜드명 없어 시점 유연) → 이후 제품 공개 시점에
브랜드명·Foundation 배지 넣은 **후속 버전**(구버전 설계 재활용, 하단 참고)으로 업그레이드 게시
검토 → 텔레그램 고정 자료 → 판매 페이지 "How it works" 섹션.

---

## 참고: 구버전 콘텐츠 설계 (제품 공개 후 재사용 후보)

브랜드명 공개 가능 시점에 아래 표 기준으로 되살릴 수 있음 (플레어 인포그래픽 포맷을 레이아웃만
빌려 우리 서사로 치환한 설계, 2026-08-22 확정):

| 플레어 원본 | wellbian 버전 |
|---|---|
| Why Flare Is Truly Unique | Why WELLBIAN Is Different — "a different definition of what an air monitor can be" |
| Most blockchains vs Flare | Most air monitors (측정값이 기기 안에 갇힘) vs wellbian (내 측정값이 검증된 실내 지도의 일부가 됨) |
| FTSO / FDC 밴드 | SENSOR(1등급 측정기) · VERIFY(이웃 노드 교차 검증) · RECORDED on XRPL |
| a smart contract can: 6칸 | With a verified map, the network can: 실내 공기 파악 · 모든 측정 교차 검증 · 데이터 라이선스 발급 · RLUSD 정산 · 예산을 기여자와 분배 · 기업 수요 대응 |
| Foundation today → FXRP | ARC-600DA · Genesis #0001–5000 |
| 마지막 인용구 | "Making invisible air visible. Turning it into valuable data assets." |

금지표현 점검 완료(당시 기준): 수익 약속·배수 없음, 케이웨더 실명·확장 로드맵(미공표) 제외.
