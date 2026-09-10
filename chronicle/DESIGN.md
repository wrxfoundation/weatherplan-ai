# Chronicle — Design Heritage

> KoreaAPI 디자인 헤리티지의 **형제 계보**. 재질·규율·"색은 정보다" 원칙을 계승하되,
> 시그니처는 골드가 아니라 **블루 기운 청록(blue-leaning teal)** — 시간·물·기록의 색.
> 토큰은 전부 `engine/site.ts`에 실재하며, 토큰을 바꾸면 이 문서도 같은 커밋에서 갱신한다.

## 한 줄 정의
**깊은 물 위의 청록 빛 × 리퀴드 글래스(검증 유리판) × 색으로 읽히는 공증 상태.**
KoreaAPI가 "옻칠 위의 금"이라면, Chronicle은 **깊은 물속의 시간층** — 어둡되 차갑지 않고
(청록 기운의 딥 다크), 기록은 유리판 뒤로 출처가 비쳐 보인다.

## 색 토큰 (`engine/site.ts` `:root`)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | `#06141b` | 바탕 — 청록 기운 딥 다크 (순수 그레이/블랙 금지) |
| `--glow` | `#0a2e3d` | 상단 중앙 정적 글로우 (배경 애니메이션 금지 — 헤리티지 불변식) |
| `--line` | `#1e3a47` | 경계선 |
| `--ink` / `--mut` / `--dim` | `#eaf4f7` / `#9fb8c4` / `#6e8794` | 본문 / 보조 / 흐림 3단 |
| `--accent` | `#3bcfe4` | **시그니처 블루-틸** (링크·강조·마크 stroke) |
| `--accent2` | `#1899c2` | 딥 블루-틸 (그라디언트 짝) |
| `--blue` | `#5fa8f5` | 변경(diff) 이벤트 |
| `--ok` / `--warn` / `--bad` | `#10b981` / `#f59e0b` / `#ef4444` | 검증 통과 / 대기 / 실패·삭제 |

## 재질 — 리퀴드 글래스 (KoreaAPI 계승)
`--glass: linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.02))`,
`--gbord: rgba(255,255,255,.14)`, `--blur: saturate(170%) blur(18px)`.
모든 카드·pill·코드블록은 유리판 — `backdrop-filter` + `-webkit-` 접두 필수.
신뢰 제품에 유리를 쓰는 이유: **사실 뒤의 공증(체인·앵커)이 비쳐 보여야 한다.**

## 타이포그래피 (KoreaAPI 계승)
- 스택: `'Montserrat','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',system-ui,-apple-system,sans-serif`
- 라틴/디스플레이 = Montserrat(400–800), 한글 = 시스템 폴백 — 무거운 한글 웹폰트 금지.
- H1: weight 800, `letter-spacing:-.02em`, accent→blue 그라디언트 텍스트.
- 섹션 = 아이브로 레이블: 영문 uppercase `letter-spacing:.14em` `--dim` 위에 한글 제목.

## 신뢰를 색으로 (핵심 — 색은 취향이 아니라 공증 상태의 인코딩)

| 상태 | 색 |
|---|---|
| 신규 이벤트 | `--accent` (블루-틸) |
| 변경 이벤트 | `--blue` |
| 삭제 이벤트 | `--bad` |
| TSA 앵커 ✓ (외부 공증 완료) | `--ok` green |
| 앵커 대기 | `--warn` amber |

**정직성 원칙 계승**: 앵커가 없으면 없다고 표시한다 — 과장 금지.

## 마크
태극기는 KoreaAPI의 것 — Chronicle 마크는 **유리 타일 속 라인 스트로크 체인링크**
(stroke `--accent`, width 1.7, round cap/join): 해시체인의 사슬.

## 불변식
**DO** — 색으로 공증 상태를 인코딩 / 유리엔 `backdrop-filter`+`-webkit-` 쌍 /
출력은 data/만으로 결정적(휘발 값 금지) / 레코드 원문 값은 페이지에 싣지 않는다(원장 링크로).
**DON'T** — 순수 그레이/블랙 바탕 금지(청록 기운이 정체성) / 시그니처 `#3bcfe4` 임의 교체 금지 /
무거운 한글 웹폰트 금지 / 배경 애니메이션 금지 / 상태 과장 금지.

## 코드 위치
토큰·재질·마크: `engine/site.ts` · 불변식 테스트: `tests/site.test.ts`
