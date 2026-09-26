# 원글 5 — 컨셉 다이어그램 "검증 루프" (구 "Why WELLBIAN Is Different")

**상태**: **v2 개정 (8/24, 서우 피드백: 1차 생성본 리뷰 후)** — 1차 생성 결과 확인, 아이콘을
유리알(투명 글래스 비즈) 재질로, 전체 톤은 블루 과다 대신 절제된 다크 뉴트럴 + 무지개 반사광(분산광)로
조정. 손그림 doodle → 글라스모피즘 전환(v1) 자체는 유지, 재질·색 배합만 보정.

**게시 예정: 이미지 완성 후, 수~목**. 제품명·브랜드명 없음(제품 비공개 방침) — 하단 구버전 설계는
공개 후 재사용 후보로 유지.

## 힉스필드 프롬프트 (v2 — 유리알 재질 + 무지개 분산광, 블루 절제)

```
Premium fintech concept diagram. Background: deep charcoal-navy #12182A,
mostly neutral and understated — NOT a heavy blue wash, blue appears only
as thin restrained accent light (panel edges, connector lines, small
glows), so it never dominates the frame. Panels are frosted glassmorphism:
translucent, softly blurred, subtle thin white/silver edge light (not
strongly blue-tinted), gentle drop shadows.

All icons throughout (sensor, shield, ledger, and the six benefit icons)
are rendered as clear transparent glass beads/orbs — like polished glass
marbles or blown-glass ornaments, NOT metallic, NOT opaque, NOT flat.
Each glass form catches light with realistic refraction: internal light
bending, crisp glossy specular highlights, and iridescent rainbow
dispersion — thin prismatic streaks of red, orange, violet and cyan
breaking off the highlight edges and inner facets, like light through a
crystal prism. Faint soft caustic light pooling beneath each glass form.
The rainbow dispersion on the glass is the main color interest of the
image, set against the restrained dark neutral background. Clean thin
line connectors between elements (soft white, not heavy blue). Strict
typographic hierarchy: large bold clean sans-serif headline, medium-weight
subheading, small tracked uppercase labels — no hand-lettering, no doodle
linework. Layout top to bottom:
1) Large bold sans-serif headline "Turning A Reading Into A Verified
   Record", medium subheading below in soft ice-blue: "what happens
   between a sensor and a ledger"
2) Two glass comparison panels side by side: left panel muted and
   slightly dim, small uppercase label "MOST AIR MONITORS", one glass-bead
   sensor icon sitting alone with no connections, caption "reading stays
   on the device"; right panel brighter with a thin glowing edge, small
   uppercase label "A VERIFIED NETWORK", a glass-bead sensor icon linked
   by clean glowing lines to a small cluster of glass-bead network nodes,
   caption "each reading joins a shared, checked record"
3) Horizontal row of three glass hexagonal badges connected by clean
   directional arrow lines, each containing a glass-bead icon with
   rainbow dispersion highlights: sensor orb labeled "MEASURE",
   shield-with-check labeled "CROSS-VERIFY", ledger/document labeled
   "RECORD"
4) Row of six small glass pill chips in a grid, each with a minimal
   glass-bead icon (same rainbow-refraction treatment, smaller scale) and
   short uppercase label: "REAL-TIME READINGS" / "CROSS-CHECKED ACCURACY"
   / "LICENSED ACCESS" / "INSTANT SETTLEMENT" / "SHARED VALUE" /
   "ENTERPRISE-READY"
5) Bottom centered line, medium-large weight, soft ice-blue: "Making
   invisible air visible. Turning it into valuable data assets."
No brand wordmarks, no company name, no product name, no logos, no device
model numbers or batch numbers anywhere in the composition. No people.
Generous negative space, no photorealistic background clutter, 4:5 portrait
```

## v1 → v2 변경 요약

| 항목 | v1 (1차 생성) | v2 (이번 수정) |
|---|---|---|
| 아이콘 재질 | 로우폴리 페이싯, 메탈릭/크롬 느낌 | **투명 유리알(글래스 비즈)** — 굴절·글로시 하이라이트 |
| 색감 | 화면 전체 시그널블루 과다(배경·글로우·패널 전부 블루 워시) | **다크 뉴트럴 절제 배경**, 블루는 얇은 액센트로만 |
| 컬러 포인트 | 블루 단색 | **유리알의 무지개 분산광(프리즘 효과)**이 메인 컬러 포인트 |
| 레이아웃/카피/구조 | — | **변경 없음** (1차안 그대로 유효, 재질·색만 조정) |

## 실무 팁

- "무지개 분산광"은 유리·크리스탈 특유의 물리 현상(프리즘 분산)이라 배경이 다크해도 자연스럽게
  화면의 유일한 유채색 포인트가 됩니다 — 브랜드 블루 사용 자체를 버리는 게 아니라 "액센트로 절제"
  방향이라 플레이북의 "액센트·글로우는 블루" 규칙과 상충하지 않습니다.
- 유리 재질 렌더는 로우폴리보다 실패 시 결과가 더 갈릴 수 있어(반사·굴절이 과하게 뭉개지는 경우) —
  1~2회 재생성 후 유리알이 탁하게 나오면 "clear glass, high transparency, sharp specular highlight"
  구문을 강조해서 재시도 권장.

## 활용처

X 단독 포스트(제품 공개 전 티저로도 가능) → 텔레그램 고정 자료 → 판매 페이지 "How it works" 섹션.

---

## 참고: 구버전 콘텐츠 설계 (제품 공개 후 브랜드명 재도입 시 재사용 후보)

플레어 인포그래픽 포맷을 레이아웃만 빌려 우리 서사로 치환한 설계 (2026-08-22 확정, 당시 손그림 톤):

| 플레어 원본 | wellbian 버전 |
|---|---|
| Why Flare Is Truly Unique | Why WELLBIAN Is Different — "a different definition of what an air monitor can be" |
| Most blockchains vs Flare | Most air monitors (측정값이 기기 안에 갇힘) vs wellbian (내 측정값이 검증된 실내 지도의 일부가 됨) |
| FTSO / FDC 밴드 | SENSOR(1등급 측정기) · VERIFY(이웃 노드 교차 검증) · RECORDED on XRPL |
| a smart contract can: 6칸 | With a verified map, the network can: 실내 공기 파악 · 모든 측정 교차 검증 · 데이터 라이선스 발급 · RLUSD 정산 · 예산을 기여자와 분배 · 기업 수요 대응 |
| Foundation today → FXRP | ARC-600DA · Genesis #0001–5000 |
| 마지막 인용구 | "Making invisible air visible. Turning it into valuable data assets." |

금지표현 점검 완료(당시 기준): 수익 약속·배수 없음, 케이웨더 실명·확장 로드맵(미공표) 제외.
