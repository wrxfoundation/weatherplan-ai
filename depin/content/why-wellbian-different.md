# 원글 5 — 손그림 인포그래픽 "Why WELLBIAN Is Different"

**상태**: 콘텐츠 설계 확정(8/22), 색 팔레트 블루 전환 완료(8/24 — 그린 #006655 → 네이비/시그널블루,
당시 미생성이라 손실 없음). **게시 예정: 이미지 완성 후, 수~목**. 이번 주 원고 3종(월 enterprise
stack · 화 래퍼 vs 원장 · 목 기계 고객)과 별도 트랙 — 이미지 준비되는 대로 삽입.

플레어 인포그래픽 포맷을 레이아웃만 빌려 우리 서사(검증·지도)로 완전 치환한 설계.

## 콘텐츠 설계 (플레어 원본 → wellbian 버전)

| 플레어 원본 | wellbian 버전 |
|---|---|
| Why Flare Is Truly Unique | **Why WELLBIAN Is Different** — "a different definition of what an air monitor can be" |
| Most blockchains vs Flare | **Most air monitors** (측정값이 기기 안에 갇힘) vs **wellbian** (내 측정값이 검증된 실내 지도의 일부가 됨) |
| FTSO / FDC 밴드 | **SENSOR**(1등급 측정기) · **VERIFY**(이웃 노드 교차 검증) · **RECORDED on XRPL** |
| a smart contract can: 6칸 | **With a verified map, the network can:** 실내 공기 파악 · 모든 측정 교차 검증 · 데이터 라이선스 발급 · RLUSD 정산 · 예산을 기여자와 분배 · 기업 수요 대응 |
| Foundation today → FXRP | **ARC-600DA · Genesis #0001–5000** |
| 마지막 인용구 | **"Making invisible air visible. Turning it into valuable data assets."** (확정 영문 슬로건) |

금지표현 점검 완료: 수익 약속·배수 없음("share budget with owners"는 백서 구조 사실 서술), 케이웨더
실명·확장 로드맵(미공표) 제외.

## 힉스필드 프롬프트 (블루판 — 최종)

```
Hand-drawn infographic poster in doodle sketch style, cream off-white paper
background, black ink hand-lettered typography with underlines and small
emphasis marks, accent colors deep navy #1B2A4A and signal blue #2E6BFF for
frames, highlights and arrows. Layout top to bottom:
1) Large hand-lettered title "Why WELLBIAN Is Different", subtitle
   "a different definition of what an air monitor can be"
2) Two comparison boxes: left black-framed "Most air monitors" with a doodle
   of a single sensor in one room, caption "data stays in the device";
   right blue-framed "wellbian" with a sensor connected to a city grid map,
   caption "your reading joins a verified indoor-air map"
3) Horizontal band, three doodle icons: air sensor labeled "SENSOR",
   shield-check labeled "VERIFY — cross-checked with neighbors",
   ledger document labeled "RECORDED on XRPL"
4) Section "With a verified map, the network can:" — six small doodle icons
   with labels: know real indoor air / cross-check every reading /
   issue data licenses / settle in RLUSD / share budget with owners /
   serve enterprise demand
5) "Foundation today →" two navy outlined badges "ARC-600DA" and
   "Genesis #0001–5000"
6) Bottom large hand-lettered quote: "Making invisible air visible.
   Turning it into valuable data assets."
Consistent sketchy line weight, generous margins, no photorealism,
4:5 portrait
```

## 실무 팁 (이 형식의 함정)

- **오탈자가 최대 리스크**입니다. 텍스트 20개짜리 인포그래픽은 이미지 모델이 철자를 자주 깨뜨립니다 —
  힉스필드에서 **nano-banana 계열**로 돌리는 게 글자 정확도가 제일 낫고, 생성 후
  `WELLBIAN / XRPL / RLUSD / ARC-600DA / Genesis` 다섯 단어는 반드시 돋보기 검수. 두세 번 재생성은 기본.
- 그래도 글자가 계속 깨지면 **플랜 B**: 같은 손그림 무드를 HTML/SVG로 픽셀 정확하게 만들어 PNG로
  뽑는 방식(글자 100% 정확, 수정도 즉시).

## 활용처

X 단독 포스트(이 형식은 스레드보다 단독+알트텍스트가 잘 돔) → 텔레그램 고정 자료 → 나중에 판매
페이지 "How it works" 섹션까지 재사용. 반응 좋으면 파리·지도·14kg 3주제도 같은 스타일 시리즈로 확장 검토.
