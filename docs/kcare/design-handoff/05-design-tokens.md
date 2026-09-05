# 05 · 디자인 토큰

프로토타입은 인라인 스타일로 작성됐습니다. 실제 구현에서는 아래 값을 토큰으로 추출하십시오.

---

## 색

### 브랜드 코어
| 토큰 | 값 | 용도 |
|---|---|---|
| `navy` | `#0A1F3C` | 주 브랜드색. 강조 카드 배경, 주요 버튼, 제목 |
| `gold` | `#B08D57` | 보조 강조. 배지, 어르신 카드 테두리, 골드 버튼 |
| `red` | `#C0392B` | 긴급·위험. SOS, SEV1, 오탐 초과 |
| `green` | `#1E7A5A` | 정상·완료 |

### 배경
| 토큰 | 값 | 용도 |
|---|---|---|
| `bg` | `#F1EFE8` | 앱 기본 배경 |
| `bgElder` | `#FDFCF9` | 어르신 화면 (대비 확보) |
| `dark` | `#0E1B2E` | 폰 베젤, 다크 컨테이너 |
| `navDark` | `#08172D` | 사이드 내비게이션 |
| `surface` | `#FFFFFF` | 카드 |

배경 그라디언트 (`main` 요소):
```
radial-gradient(900px 420px at 8% -10%, rgba(10,31,60,.10), transparent 60%),
radial-gradient(760px 380px at 92% 0%, rgba(176,141,87,.10), transparent 60%)
```

### 텍스트
| 토큰 | 값 | 용도 |
|---|---|---|
| `text` | `#131A24` | 기본 (폰 상태바 등) |
| `textBody` | `#40413F` | 본문 |
| `textMuted` | `#5C5A54` | 부제·라벨 |
| `textOnDark` | `#FFFFFF` | 다크 배경 위 |
| `textOnDarkMuted` | `rgba(255,255,255,.6)` | 다크 배경 위 부제 |

### 상태 계열 (각 3종: 전경 / 배경 / 테두리)

**경고 (앰버)** — AI 감지, 조건부 상태
```
fg      #8A5D12        (진한 텍스트는 #5A4A22, #7A6231)
bg      linear-gradient(180deg, #FFF7E8, #FBEFD8)
border  rgba(138,93,18,.35)
소형 bg  rgba(138,93,18,.1)
고지 박스 background #FDF6E8 / border #EFE0BF / color #5A4A22
```

**성공 (초록)**
```
fg      #1E7A5A        (본문 #2B4A3E, 부제 #4A6B5E)
bg      linear-gradient(180deg, #F1FAF6, #E6F4EE)
border  rgba(30,122,90,.28)
소형 bg  rgba(30,122,90,.1)
```

**위험 (적)**
```
fg      #C0392B        (진한 텍스트 #7A241C, 라벨 #8A1C1C)
bg      linear-gradient(180deg, #FDF2F0, #F9E8E5)
border  rgba(192,57,43,.24)
소형 bg  rgba(192,57,43,.1)
solid   background #C0392B / color #FFFFFF
```

**정보 (블루)** — 외출 컨디션
```
bg      linear-gradient(180deg, #FAFCFF, #F2F7FD)
border  rgba(147,178,214,.24)
fg      #5C7799
버튼     #2F5D8A
```

**중립 카드**
```
bg      linear-gradient(180deg, rgba(253,252,249,.98), rgba(250,248,243,.94))
shadow  inset 0 1px 0 rgba(255,255,255,1), inset 0 0 0 1px rgba(10,31,60,.075)
```

**글래스 카드** (주요 콘텐츠 카드)
```
bg      linear-gradient(180deg, rgba(255,255,255,.94), rgba(255,255,255,.7))
border  1px solid rgba(255,255,255,.9)
shadow  inset 0 1px 0 rgba(255,255,255,1),
        0 0 0 1px rgba(10,31,60,.06),
        0 16px 34px -28px rgba(10,31,60,.45)
```

**골드 배지 칩**
```
bg      linear-gradient(180deg, #FBF6EC, #F4EEE1)
border  1px solid rgba(10,31,60,.1)
color   #0A1F3C
```

### 데이터 시각화
| 값 | 용도 |
|---|---|
| `#0A1F3C` | P0 수익원 |
| `#3B5C8A` | P2 수익원 |
| `#C9CFD8` | P3 / 미구현 |
| `#4ADE80` | 구현 완료 (관제 다크 배경 위) |
| `#F0D9A8` | 조건부 (다크 배경 위) |
| `#FF8A80` | 긴급 (다크 배경 위) |
| `#8FA9CC` | 대기 (다크 배경 위) |
| `#C9A46B` | 담당자 지정 (다크 배경 위) |

**주의** 다크 배경(관제·네이비 카드)에서는 밝은 변형을 쓰십시오.
`#C0392B`를 네이비 위에 쓰면 대비가 부족합니다 — `#FF8A80`을 쓰십시오.

### 링크
프로토타입에 링크가 없습니다. 구현 시 정의하십시오:
```
a         color: #0A1F3C, text-decoration: underline, text-underline-offset: 2px
a:hover   color: #B08D57
```
어르신 화면은 링크를 쓰지 마십시오 — 버튼으로 만드십시오.

---

## 타이포그래피

### 폰트
```
Montserrat    700, 800    숫자 · 라벨 · 로고 · 시계
Noto Sans KR  500, 700    본문 전체
```
- **숫자는 Montserrat, 한글 본문은 Noto Sans KR.** 이 분리를 유지하십시오
- 기본 본문 weight는 **500** (400 아님). 400은 저대비 화면에서 얇습니다
- Montserrat는 800을 로고·큰 라벨에, 700을 숫자에

### 일반 화면 스케일
| 용도 | 크기 | weight | 비고 |
|---|---|---|---|
| 카테고리 라벨 | 11px | 700 | `letterSpacing:.16em`, 대문자 느낌 |
| 소형 라벨 | 10px | 700 | `letterSpacing:.04em~.14em` |
| 캡션 | 10~11px | 500~700 | |
| 본문 | 12~13px | 500 | `lineHeight:1.6~1.75` |
| 카드 제목 | 13px | 700 | |
| 강조 본문 | 15px | 700 | `lineHeight:1.45` |
| 카드 헤드라인 | 17px | 700 | `lineHeight:1.45` |
| 섹션 제목 | 20px | 700 | |
| 큰 숫자 | 16~22px | 700 | Montserrat |
| 페이지 제목 | 26px | 700 | `letterSpacing:-.01em` |
| 대형 제목 | 30~32px | 700 | `lineHeight:1.3` |

`maxWidth:50ch`(폰) / `80ch`(전폭) + `textWrap:pretty`를 설명 문단에 적용.

### 어르신 화면 스케일 — 별도 시스템
| 용도 | 크기 | weight |
|---|---|---|
| **최소 본문** | **18px** | 500 |
| 기본 본문 | 19px | 500 |
| 강조 본문 | 20px | 500 |
| 카드 제목 | 19px | 700 |
| 이름 | 22px | 700 |
| 일정 | 26px | 700 |
| 인사 | 30px | **900** |
| 큰 숫자 | 44px | 700 (Montserrat) |
| 버튼 | 21~22px | 700 |

**18px 미만을 어르신 화면에 쓰지 마십시오.**

---

## 간격 · 크기

### 반경
| 용도 | 값 |
|---|---|
| 소형 배지 | 6px |
| 버튼 (소) | 8~9px |
| 버튼 (표준) | 10~12px |
| 칩 | 20px (pill) |
| 카드 (소) | 11~14px |
| 카드 (표준) | 18px |
| 카드 (어르신) | 20px |
| 바텀시트 | 24px 24px 36px 36px |
| 폰 화면 | 36px |
| 폰 베젤 | 44px |
| 원형 | 크기와 동일 |

### 패딩
| 용도 | 값 |
|---|---|
| 칩 | `5px 9px` (어르신 `9px 14px`) |
| 버튼 (소) | `6px 11px` |
| 버튼 (표준) | `12~14px` |
| 버튼 (어르신) | **`28px`** |
| 카드 (소) | `9~13px` |
| 카드 (표준) | `18px` |
| 카드 (어르신) | `20px` |
| 전폭 화면 | `28px clamp(16px,4vw,32px) 40px` |
| 폰형 화면 | `clamp(20px,4vw,36px) clamp(16px,4vw,40px)` |

### gap
`2px` (내비 항목) · `6~8px` (칩·버튼) · `10~12px` (카드 내부) ·
`14px` (카드 간, 폰) · `34px` (섹션 간, 데스크톱)

### 크기
| 항목 | 값 |
|---|---|
| **최소 히트 타겟** | **44px** — 전 화면 공통 |
| 폰 목업 | 392×812 |
| 모바일 헤더 | 56px |
| KPI 카드 최소폭 | 104px |
| 아바타 (소) | 30px |
| 아바타 (표준) | 40px |
| 아바타 (어르신) | 44~56px |
| 상태 바 (내비) | 3×16px |
| 실시간 점 | 6~9px |

---

## 그림자

```
카드 (표준)
  inset 0 1px 0 rgba(255,255,255,1),
  0 0 0 1px rgba(10,31,60,.06),
  0 16px 34px -28px rgba(10,31,60,.45)

카드 (내부, 중립)
  inset 0 1px 0 rgba(255,255,255,1),
  inset 0 0 0 1px rgba(10,31,60,.075)

네이비 카드
  inset 0 1px 0 rgba(255,255,255,.22),
  0 16px 34px -28px rgba(10,31,60,.7)

폰 베젤
  inset 0 1px 0 rgba(255,255,255,.22),
  inset 0 0 0 1px rgba(255,255,255,.06),
  0 34px 74px -34px rgba(8,23,45,.75)

바텀시트
  0 -20px 50px -20px rgba(8,23,45,.6)

어르신 카드
  inset 0 1px 0 rgba(255,255,255,1),
  0 20px 40px -30px rgba(10,31,60,.5)
```

### 버튼 그림자 (물리감)
```
어두운 버튼 (기본)
  inset 0 1px 0 rgba(255,255,255,.32),
  inset 0 -2px 0 rgba(0,0,0,.3)
어두운 버튼 (:active)
  transform: translateY(1px)

어르신 버튼 (기본)
  inset 0 1px 0 rgba(255,255,255,.34),
  inset 0 -3px 0 rgba(0,0,0,.2),
  0 10px 20px -10px rgba(10,31,60,.5)
어르신 버튼 (:active)
  transform: translateY(2px);
  box-shadow: inset 0 2px 6px rgba(0,0,0,.26)

흰 버튼 (적색 배경 위, 기본)
  inset 0 1px 0 #FFFFFF,
  inset 0 -2px 0 rgba(120,30,22,.22),
  0 8px 16px -9px rgba(0,0,0,.5)
```

모든 버튼에 상단 하이라이트 그라디언트:
`background-image: linear-gradient(180deg, rgba(255,255,255,.2), rgba(255,255,255,0))`
(어르신 버튼은 `.16`, 55% 지점까지)

---

## 애니메이션

```css
@keyframes sosPulse      { /* 1.8s infinite — SOS 배너 */ }
@keyframes livePing      { /* 1.6s ease-in-out infinite — 실시간 수신 점 */ }
@keyframes escalateGlow  { /* 2.2s ease-in-out infinite — 즉시 조치 버튼 */ }
```
전환: `transform .18s ease` (아코디언 화살표)

**구현 시 추가 필요** — 프로토타입에 없습니다:
```css
@media (prefers-reduced-motion: reduce) {
  /* 위 3개 무한 애니메이션 정지 */
}
```

---

## 기타 관례

- 구분선: `1px solid rgba(10,31,60,.07~.08)` — 행 상단에 `borderTop`
  (마지막 행 아래에 선이 남지 않도록)
- 앰버 계열 구분선: `rgba(138,93,18,.18)`
- 초록 계열 구분선: `rgba(30,122,90,.16)`
- 표는 `overflowX:auto`로 감쌈
- 그리드: `repeat(auto-fit, minmax(240px, 1fr))` (배정안), `1fr 1fr` (vitals),
  `repeat(3, 1fr)` (요인)
- 진행 바는 퍼센트 문자열(`w: '92%'`)로 표현 — 실제 구현에서는 숫자로 계산하십시오
