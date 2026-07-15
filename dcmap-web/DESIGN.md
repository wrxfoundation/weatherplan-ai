# DESIGN.md — AI InfraMap 디자인 시스템

> **인프라 HUD × 리퀴드 글라스.** 딥 네이비 위에 시안 HUD 액센트, 반투명 유리 표면, 코너 발광.
> 다른 화면·프로젝트에 그대로 이식할 수 있도록 이 문서 한 장에 규칙·토큰·패턴을 정리한다.
>
> **진실원천은 `src/styles/tokens.css`.** 이 문서는 그 토큰의 사용 규약과 컴포넌트 패턴을 설명한다.
> 값이 바뀌면 tokens.css를 고치고, 이 문서를 따라 적용한다.

---

## 0. 철학 3줄

1. **토큰만 쓴다.** 컴포넌트 CSS에 hex를 하드코딩하지 않는다. 색·간격·라운드·그림자·모션은 전부 CSS 변수.
2. **액센트는 섹션이 정한다.** `--accent` 하나만 바꾸면 글로우·보더·게이지·버튼이 `color-mix`로 자동 추종한다.
3. **정직성은 디자인이다.** 미확보 값은 "대기" 배지로, 모든 수치엔 출처·갱신일, 이상치는 표기. (§9)

---

## 1. 색 (Color)

색은 4계층이다: **베이스(중립) → 액센트(크롬) → 의미색(상태) → 섹션 톤(문맥)**.

### 베이스 팔레트 (딥 네이비 중립 — 중립도 "선택"된 것)
| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | `#081527` | 앱 배경 |
| `--navy-deep` | `#050d1a` | 그라데이션 하단·맵 배경·플로팅 컨트롤 |
| `--surface` | `#0d1e33` | 카드·패널 표면 |
| `--line` | `#1b3050` | 보더·구분선 |
| `--text` | `#e8f1fb` | 본문 (`--ink`은 동일 별칭 — SVG fill용) |
| `--grey` | `#93a3bd` | 소형·보조 텍스트 (WCAG AA 4.5:1 충족) |

### 액센트 (UI 크롬: 버튼·링크·포커스·데이터 라인)
| 토큰 | 값 |
|---|---|
| `--accent` | `#35d5ee` (시안 HUD) |
| `--accent-deep` | `#1494c9` (그라데이션·보더 하단) |

### 의미색 (상태·데이터 — 액센트와 분리)
| 토큰 | 값 | 의미 |
|---|---|---|
| `--green` / `--status-operating` | `#45d483` | 운영 · 양호(good) |
| `--orange` / `--status-construction` | `#f59a3c` | 건설 · 경고(warn)·대기 |
| `--status-planned` | `#64748b` | 계획 (slate outline) |
| `--mint` | `#34d399` | AI·재생 강조 (운영 green과 구분) |
| `--violet` / `--violet-ink` | `#a78bfa` / `#c4b5fd` | 지식·가이드 |
| `--gold` | `#d2b478` | 브랜드 쇼케이스(소개) — 채도 낮춘 샴페인 골드 |

> semantic(good/warn/bad)은 accent와 **별개**다. 상태를 accent 색으로 칠하지 않는다.

### 섹션 톤 전환 (문맥색) — 이 시스템의 핵심 장치
`TopBar`가 `:root[data-section=...]`을 세팅하면 페이지 전체 accent가 바뀌고, 파생값이 자동 추종한다.

```css
:root[data-section='data']      { --accent: var(--green);  --accent-deep: color-mix(in srgb, var(--green) 55%, #062418); }
:root[data-section='knowledge'] { --accent: var(--violet); --accent-deep: color-mix(in srgb, var(--violet) 55%, #171232); }
:root[data-section='glossary']  { --accent: #2dd4bf;       --accent-deep: color-mix(in srgb, #2dd4bf 55%, #06231e); }
:root[data-section='about']     { --accent: var(--gold);   --accent-deep: color-mix(in srgb, var(--gold) 55%, #1f1808); }
```
- 탐색(맵) = cyan(기본) · 도구·데이터 = green · 지식·가이드 = violet · 용어집 = teal · 소개 = gold.
- **이식 팁:** 브랜드 색을 바꾸려면 `--accent`만 교체. 나머지는 color-mix로 따라온다.

---

## 2. 타이포그래피 (Type)

- **폰트:** 영문·숫자 = `Montserrat`(맨 앞에 둬 전 플랫폼 동일), 한글 = `Pretendard`로 폴스루. 스택: `--font-sans`.
  숫자 정렬이 필요한 곳은 `font-variant-numeric: tabular-nums`.
- **스케일 (임의 px 금지 — 이 변수만 사용):**

| 토큰 | 값 | 위계 |
|---|---|---|
| `--text-display` | 34px | 숫자 강조(히어로 스탯) |
| `--text-h1` | 24px | 페이지 제목 |
| `--text-title` | 16px | 섹션·카드 제목 |
| `--text-md` | 14px | 기본 UI |
| `--text-body` | 13px | 본문 |
| `--text-sm` | 12px | 메타·보조 |
| `--text-xs` | 11px | 캡션·배지 |

- **굵기 3단:** `--weight-regular:400`(본문) · `--weight-medium:600`(라벨·버튼·항목명) · `--weight-bold:700`(제목·로고·숫자).
- **행간:** `--lh-tight:1.35`(제목) · `--lh-base:1.55`(본문). 제목엔 `text-wrap: balance`.

---

## 3. 공간 (Space & Elevation)

- **라운드:** `--radius-sm:6px`(칩·인풋) · `--radius-md:10px`(작은 카드·버튼) · `--radius-lg:18px`(주요 카드).
- **레이아웃:** `--panel-width:360px` · `--topbar-height:56px`.
- **공간 위계 (elevation z0~z3):** 위계가 오를수록 그림자↑·표면 불투명도↑·보더 광량↑.

| 단계 | 토큰 | 대상 |
|---|---|---|
| z0 | — | 맵·문서 배경 |
| z1 | `--elev-1` `0 2px 10px rgba(2,8,18,.35)` | 칩·필터 |
| z2 | `--elev-2` `0 10px 30px rgba(2,8,18,.45)` | 패널·카드 |
| z3 | `--elev-3` `0 18px 50px rgba(2,8,18,.6)` | 오버레이·주요 CTA |

---

## 4. 리퀴드 글라스 (Signature)

이 앱의 시그니처. **반투명 표면 + 상단 스펙큘러 + 코너 발광**.

- **표면:** `--glass-surface`(surface 52% 투명) / `--glass-surface-strong`(78%) / `--map-control-bg`(navy 71% — 맵 위 플로팅 컨트롤 통일).
- **backdrop:** `--glass-backdrop: blur(18px) saturate(160%)`. **성능 가드레일: `backdrop-filter`는 `position:fixed` 요소에만.** (스크롤 요소에 걸면 리페인트 폭증)
- **스펙큘러(유리 윗면 빛):** `--glass-specular: inset 0 1px 0 rgba(255,255,255,.12)` / `-soft`(.07). 카드·바 상단에 얹는다.
- **보더:** `--glass-border: color-mix(in srgb, var(--accent) 26%, var(--line))` — 액센트가 살짝 밴 유리 테두리.
- **글로우:** `--glow-accent-soft`(0 0 22px 20%) · `--glow-accent`(45%) · `--glow-warm`(orange 28%, 경고·대기).
- **코너-액센트:** `--stroke-gradient`(좌상단에서 발광해 테두리를 타고 흐르다 사라짐) + `--corner-wash`(카드 내부 코너 워시). 주요 카드에 입체감을 준다.

**카드 표준 레시피** (`.calc-card`):
```css
background:
  radial-gradient(135% 78% at 66% 122%, color-mix(in srgb, var(--accent) 20%, transparent) 0%, transparent 58%), /* 하단 accent 글로우 */
  var(--corner-wash),
  linear-gradient(180deg, color-mix(in srgb, var(--surface) 92%, var(--accent)) 0%, color-mix(in srgb, var(--surface) 88%, var(--bg)) 24%);
border: 1px solid transparent;
border-radius: var(--radius-lg);
box-shadow: var(--glass-specular), var(--elev-2);
padding: 20px;
```

---

## 5. 모션 (Motion)

- **커브:** `--ease-premium: cubic-bezier(.32,.72,0,1)`(프리미엄 감쇠) · `--spring: cubic-bezier(.34,1.56,.64,1)`(오버슈트) · `--spring-soft: cubic-bezier(.22,1,.36,1)`(감쇠 안착).
- **지속:** `--dur-fast:.35s` · `--dur-entry:.7s`.
- **규칙:** `transform`·`opacity`만 애니메이트(레이아웃 속성 금지). 항상 `@media (prefers-reduced-motion: reduce)`로 끌 것.
- 펄스 도트·호버 리프트 같은 앰비언트 모션은 은은하게 — 과하면 AI스럽다.

---

## 6. 컴포넌트 패턴

| 패턴 | 규칙 |
|---|---|
| **카드** `.calc-card` | §4 레시피. `--radius-lg` + 코너워시 + 하단 accent 글로우 + `--elev-2`. |
| **셀** `.spec-cell` | 카드 내부 라벨(`.k`, grey·`--text-sm`) + 값(`.v`, `--text`) + 근거(`.cell-basis`, grey 캡션). |
| **배지** `.badge` | height 22px·pill·`--text-xs`·border `--line`. 상태는 `.status-operating/-construction`. "대기"는 pending 톤. |
| **요약 칩** `.sum-chip` + `.tone-good/-warn/-bad` | 한눈 상태칩. good=green / warn=orange / bad=red. **semantic 톤은 accent와 무관.** |
| **버튼** `.btn`, `.btn.primary` | primary는 `linear-gradient(180deg, var(--accent), var(--accent-deep))` + accent 글로우. 텍스트 정중앙. |
| **플로팅 배지** `.map-live-badge` | 맵 위 유리 알약: `--map-control-bg`·blur·pill·펄스 도트. §4 backdrop 규칙 준수. |
| **게이지·막대** | area fill + faint grid + 강조 endpoint. accent 추종. 숫자는 tabular-nums. |

색 톤 규약: **good=`--green` · warn=`--orange` · bad=red(#ef4444 계열)**. 세 곳(`.sum-chip`, `.ct-cell`, `.ci-dot`)이 동일 규약.

---

## 7. 라이트/다크 & 접근성

- 현재 앱은 **딥 네이비 단일 세계에 의도적으로 커밋**(인프라 HUD 콘셉트). 라이트 테마는 두지 않는다 — 이는 누락이 아니라 선택.
  - 이식 시 라이트가 필요하면 tokens.css를 `@media (prefers-color-scheme)` + `:root[data-theme]`로 토큰만 재정의(컴포넌트는 손대지 않음).
- **대비:** 소형 텍스트는 `--grey`(4.5:1 충족). 순수 mid-grey 금지 — 네이비가 살짝 밴 중립을 쓴다.
- **포커스:** 키보드 포커스에 가시 상태(accent 링) 필수.
- **모션 축소:** 모든 앰비언트 모션은 `prefers-reduced-motion`에서 정지.

---

## 8. 다른 프로젝트에 이식하는 법 (Checklist)

1. `src/styles/tokens.css`를 복사한다(진실원천).
2. **브랜드색 = `--accent` 하나만 교체.** 글로우·보더·게이지·버튼이 자동 추종한다.
3. 섹션 톤이 필요하면 `:root[data-section=...]` 블록을 프로젝트 섹션에 맞게 늘린다.
4. 컴포넌트는 **토큰 변수만** 참조(hex 금지). §6 패턴을 재사용.
5. `backdrop-filter`는 fixed 요소 전용(§4). 모션은 transform/opacity + reduced-motion(§5).
6. semantic 톤(good/warn/bad)은 accent와 분리 유지(§1).

---

## 9. 정직성 UI 원칙 (이 제품의 디자인 언어)

데이터 신뢰가 제품의 방어선이므로 **정직성도 디자인 규칙**이다. 이식 시 데이터 제품이라면 함께 가져갈 것.

- **미확보 = "대기" 배지.** 값을 지어내지 않는다. 로딩과 미제공을 구분해 표기.
- **모든 수치에 출처·갱신일.** `.cell-basis`에 근거(출처·연도)를 캡션으로.
- **추정·근사는 그 사실을 표기.** "시군구 근사", "OSM 실좌표", "참고자료(전기사용신청 후 확정)" 등.
- **이상치는 제외+명시.** (예: 원본 이상치를 null 처리하고 사유를 노트에.)
- **커버리지를 보여준다.** "근거 확보 n/m점 · 커버리지 %"처럼 가짜 총점 대신 확보율을.

---

*기준 tokens.css v3 (인프라 HUD × 리퀴드 글라스). 값 변경 시 tokens.css → 이 문서 순으로 갱신.*
