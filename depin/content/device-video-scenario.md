# 노드 디바이스 소개 영상 시나리오 — "The Assembly" (Seedance 2.5)

32~38초 · 8컷 · 아크: 조립(아이언맨/SC2) → 전원 → 공기 가시화 → 데이터 상승 → 기업 → 지구 → 엔드.
**필수**: 기기 컷(1~3, 8)은 ARC-600DA 실물 사진(3~4각도)을 레퍼런스 입력 — 가짜 기기 생성 금지 규칙.

공통 스타일 블록 (2026-08-24 블루 전환): Cinematic product film, ultra-detailed macro, volumetric
light, KWeather blue family — deep navy (#1B2A4A) · signal blue (#2E6BFF) · ice blue (#DCEAF7) —
air-quality data colored navy-blue (good) to red-orange (bad), device glow cool blue (never green),
smooth precise camera, photoreal, 16:9, no text, no logos
※ 톤 결정 보류 중: 브랜드보드(그린) vs 그룹 블루 — 8/26 왕인정 브랜드가이드 협의에서 확정

| # | 길이 | 장면 | 프롬프트 요지 |
|---|---|---|---|
| 1 | 4s | 부유 파츠 | dark void, exploded device parts rotating, holographic guide lines (실물 레퍼런스) |
| 2 | 5s | 조립 | parts snap together along holographic assembly rings, HUD ticks, orbiting camera (리롤 예산 집중) |
| 3 | 4s | 전원 온 | darkness → cool signal-blue status ring ignites, breathes once, light ripple |
| 4 | 5s | 공기 가시화 | bright living room, invisible air becomes drifting particles, navy↔orange flows resolve to calm |
| 5 | 5s | 데이터 상승 | light threads rise, join city map at dawn, indoor map filling in (지도 스레드 모티프 재사용) |
| 6 | 4s | 기업 | office, floating glass dashboards with air-map layers, no readable text |
| 7 | 5s | 지구 | continuous pull-back to Earth at sunrise wrapped in verified data mesh |
| 8 | 4s | 엔드 | device on pedestal, morning light, negative space for typography |

텍스트(후반 삽입만): "Making invisible air visible." → "Turning it into valuable data assets." → "wellbian · We Air You"
나레이션(30s 국문): 보이지 않는 것을 재기 위해, 우리는 이것을 만들었습니다 → 공간에서 공기가 모습을 드러내고 →
하나의 측정은 도시의 지도가 됩니다 → 검증된 데이터는 기업의 결정이, 지구의 기록이 됩니다 → 보이지 않는 공기를 보이게. wellbian.

제작 팁: 컷별 생성 + 앞 컷 마지막 프레임을 다음 컷 첫 프레임으로(3→4 전환 중요) · 텍스트 생성 금지(후반 삽입) ·
컴플라이언스: 수익/코인/케이웨더/체인 로고 없음.

---

## 통합 1회 생성 프롬프트 (Seedance 멀티샷) — 2026-08-24 추가

- **A. 풀 시퀀스(30s+ 지원 시)**: 위 8컷을 [Shot 1]~[Shot 8] 비트로 한 프롬프트에 기술.
  공통: photoreal · 16:9 · no text/logos · 케이웨더 블루(#1B2A4A/#2E6BFF/#DCEAF7) 액센트 · 데이터색 남색↔붉은주황 ·
  "Use the attached product photos as the exact device — do not invent a different device."
  페이싱: 1~3 confident/precise → 4~8 serene/expansive. no faces.
- **B. 10~12s 압축판(트레일러)**: 4비트 — 조립 스냅 → 그린 링 점화+거실 매치컷(공기 가시화) →
  빛 실이 도시 지도로 → 지구 풀백 후 기기 엔드프레임(타이틀 여백).
- 운용: B로 톤 확정 → A 확장 또는 8컷 개별 제작. 기기 형태 변형 시 폐기(가짜 기기 금지 규칙).
  전체 프롬프트 원문은 세션 대화 기록 참조 (Claude가 재생성 가능).
