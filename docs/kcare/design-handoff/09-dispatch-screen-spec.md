# 09 · `dispatch` 화면 상세 명세 — 배치관리자(관제 센터)

> 정본 소스: `reference/K-CARE 5역할 프로토타입.dc.html` L1027–1440 (템플릿),
> L7073–7110 (JOBS/STAFF 단일 원본), L6283–6340 (Leaflet 맵), L8935–9086 (로직).
> **데스크톱 전용 화면**입니다 — 폰 목업이 없는 유일한 P0 화면.

---

## 0. 이 화면의 존재 이유

**공급을 관리하는 화면입니다.** 가족은 수요, 컨시어지는 공급, 관제는 **둘을 잇는 병목**입니다.

이 화면이 실패하면 나타나는 증상:
- 짝을 못 찾아 **1인 배차**를 내림 → 사고·분쟁 시 증언 불가
- 피로한 컨시어지를 배차 → **낙상 사고의 가장 흔한 원인**
- 배차 공백 → 가족 이탈
- 컨시어지 과부하 → 공급자 이탈 → 사업 붕괴

### 정보 밀도가 의도적으로 높습니다
다른 4개 화면은 "덜 보여주기"가 원칙이지만 **이 화면은 반대**입니다.
관제사는 훈련받은 전문 사용자이고, 화면을 하루 8시간 봅니다.
**10–13px 활자, 밀집 테이블, 동시 다중 정보**가 정답입니다.
어르신 화면의 접근성 규칙(19px)을 여기 적용하지 마십시오.

### 이 화면의 핵심 원칙 세 개
1. **AI는 제안하고 사람이 승인합니다** (PRD 8.5 자율성 등급 L4)
2. **짝이 없으면 배차를 확정하지 않습니다** — 1인 배차라는 선택지가 없습니다
3. **피로도 상한은 시스템이 강제합니다** — 관제사 재량이 아닙니다

---

## 1. 레이아웃 골격 (데스크톱)

```
루트  padding: 28px clamp(16px,4vw,32px) 40px   (폰 프레임 없음)
├ 헤더 행         제목 + 실시간 시계 + KPI 4개 (flex, space-between, wrap)
├ [조건] SOS 배너         sosActive
├ [조건] AI 배차 승인 카드  assignPending
├ [조건] 배정 승인 완료     assignDone
├ 관제 맵 (Leaflet)       height 300px · 네이비 카드
├ 탭 3개                  아웃라인 버튼형 (하단 탭 아님)
├ [탭 live]  배차 그리드 + 실시간 접수 티커        2열 그리드
├ [탭 pair]  페어 KPI + 편성 보드 + 미매칭 + SLA + 동선 + 피로도 + 리스크
└ [탭 plan]  예보 캘린더 + 감점 내역 + 브리핑 + 컨시어지 현황
```

**그리드 패턴:** `repeat(auto-fit, minmax(360px, 1fr))` (live) /
`minmax(196px, 1fr)` (KPI) / `minmax(330px, 1fr)` (pair 하단) / `minmax(320px, 1fr)` (plan).
컬럼 수를 하드코딩하지 마십시오 — 관제사는 **와이드/듀얼 모니터**를 씁니다.

### 헤더
- 역할 라벨: `역할 04 / 배치 관제 센터` · 11px/700 · `letterSpacing:.16em`
- 제목: `강남지점 실시간 관제` · **26px/700** (다른 화면 32px보다 작음 — 밀도 우선)
- 시계 행: `2026년 7월 26일 (일)` (13px/500) · 점 구분자 3×3 ·
  **`14:40:12`** (Montserrat 15px/700 `#0A1F3C`) · `KST` (11px/600) ·
  `LIVE` 인디케이터 (6×6 원 `#1E7A5A` + `animation: livePing 1.6s ease-in-out infinite`)

> **초 단위 시계가 필요합니다.** SOS 경과 시간(`00:14`)이 초 단위로 표시되므로
> 화면 전체가 1초 틱으로 갱신됩니다. `clock` state가 이를 담당합니다.

### KPI 4개 (`dispatchKpis`)
카드: `padding:11px 16px` · `minWidth:104px` · 라벨 10px/700 · 값 **Montserrat 20px/700**

| k | v | color |
|---|---|---|
| 진행중 | 2 | `#0A1F3C` |
| 오늘 배차 | 6 | `#0A1F3C` |
| 가동률 | 82% | `#1E7A5A` |
| SOS | `sos ? '1' : '0'` | `sos ? '#C0392B' : '#5C5A54'` |

---

## 2. SOS 배너 — `sosActive`

```
marginTop: 18px · borderRadius: 14px · padding: 16px 20px
background: #C0392B · color: #FFFFFF · display: flex · gap: 18px
animation: sosPulse 1.8s infinite
```
- 배지: `SOS` · 11px/700 · `letterSpacing:.14em` · `background:rgba(255,255,255,.18)` · `padding:6px 10px`
- 본문 (flex:1):
  - `김순자 (78) · 강남구 대치동 — 최근접 컨시어지 박지현 (1.2km)` · 15px/700
  - `경과 00:14 · 목표 응답 60초 이내 · 119 연계 대기` · 12px/opacity .88
- 버튼 `dispatchSos`: 흰 배경 · `#C0392B` 텍스트 · 13px/700 · **`급파 지시`**
  → `sosDispatched: true` + push `('대응', '박지현 급파 지시 · 119 연계 대기', '#FF8A80')`
- 버튼 `ackSos`: 투명 + 흰 테두리 · 13px/**500** · **`해제`**
  → `sos: false` + push `('대응', 'SOS 확인 처리 — 알림 상태 해제', '#8FA9CC')`

> ### 같은 SOS, 3개 화면 3개 표현 — 이것이 정보 비대칭의 교과서적 예입니다
> | 화면 | 표현 |
> |---|---|
> | 어르신 | (버튼을 눌렀다) |
> | 가족 | `어머니가 도움을 요청했습니다` + `2인 급파 중 (1.2km)` |
> | **관제** | `김순자 (78) · 강남구 대치동 — 최근접 컨시어지 박지현 (1.2km)` + **`경과 00:14`** |
>
> 관제만 **경과 시간·거리·119 연계 상태**를 봅니다. 가족에게 경과 초를 보이면 불안만 커집니다.
> **`급파 지시`가 "해제"보다 시각적으로 강한 것이 중요합니다** (흰 실선 vs 투명 아웃라인).
> 해제를 먼저 누르는 실수를 막습니다.
>
> `sosDispatched: true`는 배차 그리드의 김순자 바를 **`kind: 'sos'`(빨강)**으로 바꿉니다.

---

## 3. AI 자율 배차 승인 — `assignPending` (`assign === 'pending'`)

**PRD 8.5 자율성 등급 L4의 구현체입니다.** 이 카드가 규제 방어선입니다.

```
background: #0A1F3C + linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,0))
color: #FFFFFF · borderRadius: 14px · padding: 18px 20px
```
- 배지: `AI 자율 배차 · L4` · 10px/700 · `#0A1F3C` on **`#B08D57`** · `letterSpacing:.14em`
- 제목: `신규 요청 3건의 배정안이 준비되었습니다` · 14px/700
- 우측 각주: **`승인 없이는 실행되지 않습니다 · 8.5 자율성 등급`** · 11px/`rgba(255,255,255,.6)`
- 카드 그리드 `repeat(auto-fit, minmax(240px, 1fr))` (`aiAssignments`):
  고객 12px/700 · 시각 10px · 업무 11px · 배정 **12px/700 `#C9A46B`** (`→` 접두) ·
  적합도 Montserrat 11px/700 · 근거 10px/lh1.55

| client | time | job | staff | score | why |
|---|---|---|---|---|---|
| 한복자 (79) | 7/28 09:00 | 고대구로 재활의학과 · 휠체어 | 한서연 + 김도윤 | 96% | 주: 재활 이력 2회 · 부: 휠체어 이동 실습 필요 · 동성 페어 · 신규 조합 |
| 오태식 (77) | 7/28 13:00 | KMI 검진 · 수면내시경 보호자 | 정민호 + 오하늘 | 94% | 주: 검진 대행 자격 · 부: 당일 공백 4시간 · 순환 규칙 통과 |
| 최정자 (75) | 7/29 08:30 | 세브란스 투석 · 주 3회 고정 | 윤세라 + 최도현 | 91% | 주: 투석 동행 이력 11회 · **이수민은 주 근무 상한 임박으로 후보 제외** |

- 버튼 2개:
  - `approveAssign` — `background:#B08D57` · `color:#0A1F3C` · 13px/700 · **`3건 일괄 승인`**
    → `assign: 'done'` + push `('배차', 'AI 배정안 3건 일괄 승인 · 평균 적합도 94%', '#B08D57')`
  - `reviewAssign` — `rgba(255,255,255,.06)` + 테두리 · 13px/500 · **`개별 검토`**
    → push `('배차', 'AI 배정안 개별 검토 모드 진입', '#8FA9CC')` (state 변경 없음)

> ### ⚠ `why` 필드는 규제 요건입니다 — 절대 생략하지 마십시오
> AI가 배정한 **모든 근거를 사람이 읽을 수 있는 문장으로** 제시해야 합니다.
> 적합도 숫자(96%)만 보여주는 것은 블랙박스이며, 사고 시 설명 책임을 질 수 없습니다.
>
> `why`에 담긴 판단 축 6개 — 실제 배차 엔진이 이 축들을 평가해야 합니다:
> 1. **이력** (재활 이력 2회 / 투석 동행 11회) — 관계 연속성 우선
> 2. **자격** (검진 대행 자격) — 없으면 배차 불가
> 3. **동성 페어** — 어르신 성별과 맞춤 (신체 접촉이 있는 업무)
> 4. **순환 규칙** (신규 조합 / 순환 규칙 통과) — 동일 페어 유착 방지
> 5. **가용성** (당일 공백 4시간)
> 6. **근무 상한** (이수민 후보 제외) — 피로도가 배차를 차단
>
> **"개별 검토"가 대등한 선택지입니다.** 일괄 승인만 있으면 실질적으로 L5(완전 자율)입니다.
> `assignDone` 상태의 각주 **"승인 이력은 감사 로그에 기록됩니다"**를 실제로 구현하십시오 —
> 누가 언제 무엇을 승인했는지 감사 추적이 필요합니다.

### 3.1 배정 승인 완료 — `assignDone`
```
border: 1px solid rgba(30,122,90,.28) · background: linear-gradient(180deg, #F1FAF6, #E6F4EE)
```
`배정 승인 완료` (11px/700 `#1E7A5A`) ·
`3건이 각 컨시어지 앱으로 전송되었습니다 · 평균 적합도 94% · 수동 개입 0건` (13px/`#2B4A3E`) ·
우측 `승인 이력은 감사 로그에 기록됩니다` (11px/`#4A6B5E`)

---

## 4. 관제 맵 (Leaflet)

```
카드: background:#0A1F3C · borderRadius:14px · padding:18px
맵 컨테이너: height:300px · borderRadius:10px · background:#0E2647 · overflow:hidden
```
- 헤더 `관제 맵` + 범례 4종 + `OpenStreetMap 기반 실측 좌표`

| 색 | 의미 |
|---|---|
| `#4ADE80` | 이동·수행중 |
| `#8FA9CC` | 대기 |
| `#FF6B5B` | SOS |
| `#B08D57` | 제휴 병원 |

- 좌하단 오버레이 배지: `SEOUL · OpenStreetMap 실측 좌표` · `zIndex:1000` · `pointerEvents:none`

### 기술 스펙
```js
L.map(node, { zoomControl: true, attributionControl: true, scrollWheelZoom: false })
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            { subdomains: 'abcd', maxZoom: 19, attribution: '© OpenStreetMap © CARTO' })
map.fitBounds(L.latLngBounds(pts), { padding: [26, 26] })
```
**`scrollWheelZoom: false`가 중요합니다** — 페이지 스크롤 중 맵이 줌되면 관제사가 위치를 잃습니다.

### 실측 좌표 (전부 실제 서울 좌표 — 임의 값이 아님)

**행정구 (`DISTRICTS`)**: 종로구 37.5735/126.9788 · 마포구 37.5637/126.9084 ·
영등포구 37.5264/126.8963 · 강남구 37.5172/127.0473 · 송파구 37.5145/127.1059 · 한강 37.5185/126.9976

**병원 (`HOSPITALS`)**: 세브란스 37.5622/126.9408 · 서울아산병원 37.5270/127.1088 ·
삼성서울병원 37.4881/127.0857

**인력·고객 (`peopleFor(sos)`)**:

| lat / lng | label | color |
|---|---|---|
| 37.4945 / 127.0614 | `sos ? '김순자 · SOS' : '김순자 · 대치동'` | `sos ? '#FF6B5B' : 'rgba(255,255,255,.5)'` |
| 37.5029 / 127.0567 | 박지현 · 이동중 | `#4ADE80` |
| 37.4956 / 126.8974 | 정민호 · 수행중 | `#4ADE80` |
| 37.5219 / 126.9895 | 한서연 · 대기 | `#8FA9CC` |

- 팝업 스타일은 `.kcare-popup` 클래스로 커스텀 (borderRadius 12px, 그림자)
- **정리(cleanup) 필수**: `componentWillUnmount`와 `mapRef(null)`에서 `map.remove()`.
  리사이즈 시 `invalidateSize()` 호출.

> 지도 라이브러리를 교체할 경우(Mapbox/네이버/카카오) **좌표는 그대로 쓰십시오.**
> 실측 좌표가 데모 설득력의 근거입니다. `04-data-model.md`에 좌표 전체가 있습니다.

---

## 5. 탭 3개 (`dispTabs`) — 하단 탭 아님, 아웃라인 버튼형

`dispTab` state (기본 `'live'`). 버튼: `padding:10px 18px` · 12px/700 · `borderRadius:10px`

| key | name | 활성 스타일 |
|---|---|---|
| `live` | 실시간 운영 | `bg: NAVY` / `fg: #FFFFFF` / `border: NAVY` |
| `pair` | 페어 편성 · 예외 | 비활성: `bg: rgba(255,255,255,.6)` / `fg: #5C5A54` / `border: rgba(10,31,60,.14)` |
| `plan` | 계획 · 인력 | 〃 |

**`sc-if`로 전환**합니다 (`display:none` 아님) — 각 탭의 콘텐츠가 무거워서 언마운트가 맞습니다.

---

## 6. ⚙ 배차 단일 원본 (`JOBS`) — 구현의 핵심

> **소스 주석 그대로:** `// 오늘 배차의 단일 원본 — 그리드·페어보드·KPI·동선이 전부 여기서 파생됩니다`

이 배열 하나에서 **배차 그리드 · 페어 편성 보드 · 페어 KPI · 동선 체인**이 모두 파생됩니다.
**실제 구현에서도 이 구조를 유지하십시오** — 화면별로 배차 데이터를 따로 fetch하면 불일치가 생깁니다.

| t | s–e | client | job | lead | sup | kind | note | state |
|---|---|---|---|---|---|---|---|---|
| 09:00 | 9–11.5 | 오태식 (77) | KMI 검진 · 수면내시경 보호자 | 박지현 | 오하늘 | `done` | 동성 페어 · 검진 대행 자격 보유 · 순환 규칙 통과 | 완료 |
| 13:50 | 13.83–16.17 | 김순자 (78) | 서울아산 순환기내과 · 차량 | 박지현 | 서다인 | `sosDispatched ? 'sos' : (checkedIn ? 'active' : 'planned')` | 동성 페어 · 단골 리드 유지 · 연속 2회차 | 진행중 |
| 15:00 | 15–17 | 이영호 (81) | 분당서울대 정형외과 | 한서연 | 오하늘 | `planned` | 동성 페어 · 신규 조합 (유착 방지) | 확정 |
| 16:20 | 16.33–19 | 한복자 (79) | 투석 동행 · 왕복 | 정민호 | **(없음)** | `sos` | **부 동행 미배정 · 투석은 수습 배차 불가** | **짝 없음** |
| 17:00 | 17–19 | 박말순 (83) | 강동경희대 내과 · 도보 | 윤세라 | 최도현 | `planned` | 동일 페어 3회 연속 — 다음 배정은 순환 필요 (4회부터 위반) | 순환 경고 |
| 18:10 | 18.17–20 | 최정자 (75) | 약국 · 장보기 동행 | 서다인 | 김도윤 | `planned` | 리드 연속 근무 7.6시간 · 주의 구간이나 상한 내 | 확정 |

**`kind` → 색 매핑:**
| kind | bg | fg |
|---|---|---|
| `active` | `#0A1F3C` | `#FFFFFF` |
| `planned` | `#E4E9F1` | `#0A1F3C` |
| `done` | `#EFEDE6` | `#5C5A54` |
| `sos` | `#C0392B` | `#FFFFFF` |

### 인력 명부 (`STAFF`) — 8명

| name | meta |
|---|---|
| 박지현 | 주 동행 · 강남 · 4.9 |
| 서다인 | **주·부 겸용** · 강남 · 4.8 |
| 한서연 | 주 동행 · 서초·분당 · 5.0 |
| 오하늘 | 부 동행 · **수습** · 4.3 |
| 정민호 | 주 동행 · 강동 · 4.7 |
| 윤세라 | 주 동행 · 강동 · 4.8 |
| 최도현 | 부 동행 · 강동 · 4.6 |
| 김도윤 | 부 동행 · 송파 · 4.5 |

> **`note` 필드가 전부 규칙 위반 검사 결과입니다.** 배차 엔진이 검사해야 하는 규칙:
> - **동성 페어** — 신체 접촉 업무의 필수 조건
> - **순환 규칙** — 동일 페어 3회 연속까지 허용, **4회부터 위반** (유착·담합 방지)
> - **자격 게이트** — 투석은 수습(오하늘) 배차 불가
> - **단골 리드 유지** — 관계 연속성 (가족 앱 "12번 모셨습니다"의 근거)
> - **근무 상한** — 7.6시간은 주의, 10시간이 상한
>
> **"순환 경고"와 "짝 없음"이 동시에 존재하는 것이 현실적**입니다. 관제 화면은 이상적인
> 상태가 아니라 **문제가 보이는 상태**를 보여줘야 합니다. 모든 행이 초록인 관제 화면은
> 아무 정보도 주지 않습니다.

---

## 7. `live` 탭 — 실시간 운영

### 7.1 배차 그리드 (간트)

- 헤더: `배차 그리드` ↔ `08:00 — 20:00 KST` (11px Montserrat)
- 시간축 (`hours`): `08:00` `10:00` `12:00` `14:00` `16:00` `18:00` `20:00` ·
  `paddingLeft:108px` (인력 열 폭) · 각 `flex:1` · Montserrat 10px/600
- 행 (`rows`, `STAFF`에서 파생 — **바가 있는 인력만** `.filter(r => r.bars.length)`):
  - 좌측 108px: 이름 12px/700 + meta 10px
  - 우측: `position:relative` · `minHeight:56px`
  - **현재 시각선**: `left:55.6%` · `width:2px` · `background:rgba(192,57,43,.55)` ·
    `boxShadow:0 0 0 1px rgba(255,255,255,.5)` (14:40 = 08:00~20:00 구간의 55.6%)
  - 바: `position:absolute` · `top:9px; bottom:9px` · `left`/`width` 계산값 · `borderRadius:8px`
    · 레이블 11px/700 + 부제 10px (둘 다 `whiteSpace:nowrap; textOverflow:ellipsis`)

**바 부제 생성 규칙** (`rows` 파생 로직):
```js
isLead ? (sup ? '주 · {업무첫토큰} (짝 {sup})' : '주 · {업무첫토큰} — 부 동행 미배정')
       : '부 · 이동·접수 (주 {lead})'
// 최종: '{HH:MM}–{HH:MM} · ' + sub
```

- 범례 (`legend`) + 현재 시각선 설명:
  `수행중`(NAVY) · `예정`(`#E4E9F1`) · `완료`(`#EFEDE6`) · `SOS 급파`(RED) · `현재 시각 14:40`

> **한 사람이 여러 행에 나오지 않고, 한 행에 여러 바가 놓입니다.**
> 서다인은 13:50 건의 **부 동행**이고 18:10 건의 **주 동행**입니다 — 같은 행에 두 바.
> 부제가 `주 ·` / `부 ·`로 구분됩니다. 이것이 2인 1조 운영의 시각화 핵심입니다.
>
> 실제 구현에서 **바 클릭 → 상세/재배차**가 필요합니다 (프로토타입 미구현).
> 드래그 재배차를 넣을 경우 **규칙 검사를 통과하지 못하는 드롭은 거부**하십시오.

### 7.2 실시간 접수 티커 (`events`)

- 제목 `실시간 접수 티커` · 리스트 `maxHeight:230px` · `overflowY:auto` · gap 9px
- 각 행: 시각(Montserrat 10px/600, flex:0 0 34px) · 종류 칩(10px/700, `borderRadius:20px`) ·
  내용(12px/`#40413F`/lh1.5, flex:1) · **`animation: tickIn .3s ease`**

이벤트는 `this.push(kind, text, color)`로 적재됩니다. 전 화면의 액션이 여기로 흘러옵니다:

| 발생 화면 | kind | 예시 |
|---|---|---|
| 어르신 SOS | `SOS` | 김순자(78) SOS 발신 · 가족·관제 동시 점등 |
| 어르신 복약 | `복약` | 김순자 저녁 복약 완료 · 가족 앱 준수율 갱신 |
| 어르신 냉방 | `환경` | 김순자 자택 실내 31° → 냉방 가동 · 가족 알림 |
| 컨시어지 체크인 | `체크인` | 박지현 · 김순자(78) 동행 수행중 전환 |
| 컨시어지 리포트 | `리포트` | 케어 리포트 검수 확정 · 가족 앱 전달 |
| 가족 보험 | `보험` | 실손 청구 접수 C-260726-118 |
| 관제 배차 | `배차` | AI 배정안 3건 일괄 승인 · 평균 적합도 94% |

> **이 티커가 프로토타입의 "역할 간 연동"을 증명하는 장치입니다.**
> 실제 구현에서는 **감사 로그(audit log)의 실시간 뷰**가 됩니다 —
> 같은 데이터가 규제 대응·분쟁 조사·품질 관리에 쓰입니다. 별도 시스템으로 만들지 말고
> 하나의 이벤트 스트림에서 필터링하십시오.

---

## 8. `pair` 탭 — 페어 편성 · 예외

### 8.1 페어 KPI 4개 (`pairKpis`)
카드: `padding:16px 18px` · 라벨 11px/700 · 값 **Montserrat 24px/700** · 비고 10px

| k | v | note | color |
|---|---|---|---|
| 오늘 페어 편성 | `5 / 6` (JOBS에서 계산) | 1건 미편성 (16:20 투석) | `#8A5D12` |
| 순환 경고 | 1 | 동일 페어 3회 연속 · 다음 배정 순환 | `#8A5D12` |
| 평균 편성 소요 | 38초 | AI 제안 → 승인 | `#1E7A5A` |
| **단독 배차** | **0** | **예외 승인 절차 없음** | `#1E7A5A` |

> **"단독 배차 0 · 예외 승인 절차 없음"이 이 화면 전체의 논지입니다.**
> 다른 KPI는 개선 목표지만 이것은 **불변량(invariant)**입니다.
> 이 값이 0이 아니게 되는 코드 경로를 만들지 마십시오 — "긴급 시 예외 승인" 기능도 안 됩니다.

### 8.2 오늘 페어 편성 보드 (`pairBoard` = JOBS 파생)

- 헤더: `오늘 페어 편성 보드` ↔ `주 동행 + 부 동행 · 짝이 비면 배차 확정 불가`
- 가로 스크롤 (`minWidth:700px`) 6열 flex 테이블:
  시각 .5 / 고객·업무 1.5 / 주 동행 .8 / 부 동행 .8 / 편성 근거·규칙 체크 1.6 / 상태 .7
- 부 동행 없으면 **`—`** 로 표시 (`j.sup || '—'`)
- 상태 pill: 10px/700 · `color: j.fg` · `background: j.bg`

| state | fg | bg |
|---|---|---|
| 완료 | `#5C5A54` | `linear-gradient(180deg,#FBFAF7,#F5F3EE)` |
| 진행중 / 확정 | `#1E7A5A` | `rgba(30,122,90,.1)` |
| 순환 경고 | `#8A5D12` | `rgba(138,93,18,.1)` |
| **짝 없음** | `#C0392B` | `rgba(192,57,43,.1)` |

### 8.3 짝 미매칭 · 예약 확정 보류 (`unmatched`)

**이 카드가 "1인 배차 금지" 원칙의 실행 UI입니다.**

```
borderRadius: 14px · padding: 18px
background: linear-gradient(180deg, #FDF2F0, #F9E8E5)
border: 1px solid rgba(192,57,43,.24)
```
- 오버라인: `짝 미매칭 · 예약 확정 보류` · 10px/700 `#8A1C1C` `letterSpacing:.14em` +
  우측 시각 `16:20` (Montserrat 11px/700)
- 고객: `한복자 (79)` · 15px/700 `#7A241C`
- 사유: `투석 동행 자격자 중 가용 부 동행 0명 · 자동 탐색 3회 · 인접 권역 2곳 확장` · 11px/`#7A241C`
- 옵션 3개 (`u.options`) — 라벨 12px/700 + 대가 11px/opacity .85

| label | cost | fg |
|---|---|---|
| 송파 권역 서다인 재배치 | 이동 24분 · 18:10 건 재편성 필요 | `#8A5D12` |
| 시니어 박지현 부 동행 투입 | 단가 역전 · 이번 건 마진 −18,000 | `#8A5D12` |
| 고객 일정 조정 요청 (내일 오전) | **투석은 지연 불가 — 선택지 아님** | `#C0392B` |

- 버튼 `fixUnmatch`: `unmatchBg` = `unmatchFixed ? '#5C5A54' : NAVY`
  - 라벨: `송파 권역 서다인 재배치 승인` → `서다인 재배치 승인 · 18:10 건 재편성 완료`
  - push `('배차', '한복자 님 투석 동행 페어 편성 완료 · 서다인 재배치', '#8FA9CC')`
- 각주: **`짝을 못 찾았다고 1인 배차로 내리지 않습니다. 재배치·시니어 투입·일정 조정 중에서만 고릅니다.`**

> ### ⚠ 이 카드의 설계가 K-CARE 운영 윤리의 핵심입니다
> **세 옵션 모두 대가가 명시돼 있습니다** — 이동 24분 / 마진 −18,000 / 의료적 불가.
> 관제사가 "공짜 해결책"을 기대하지 않게 만듭니다. 셋 중 하나는 반드시 손실입니다.
>
> **세 번째 옵션이 "선택지 아님"으로 표시된 것이 중요합니다.** 비활성화하거나 숨기지 않고
> **보여주면서 불가 이유를 명시**합니다 (투석은 지연 불가 — 의료적 사실).
> 관제사가 "일정 조정하면 되지 않나"를 다시 묻지 않게 됩니다.
>
> 실제 구현에서 **1인 배차 확정 API 자체를 만들지 마십시오.** UI 검증이 아니라 서버 제약입니다.

### 8.4 SLA 관제 (`slaRows`) — 네이비 카드

- 헤더 `SLA 관제` ↔ `목표 대비 오늘`
- 각 행: 지표명 12px/500 · 목표 10px/`rgba(255,255,255,.45)` · 현재 Montserrat 12px/700 ·
  **글래스 바** height 6px + 비고 10px

```
바 트랙: background: rgba(255,255,255,.07) · backdropFilter: blur(6px)
         boxShadow: inset 0 1px 2px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.14)
바 채움: boxShadow: inset 0 1px 0 rgba(255,255,255,.6), inset 0 -1px 0 rgba(0,0,0,.16),
                    inset 0 0 0 .5px rgba(255,255,255,.2)
         maskImage: linear-gradient(to right, rgba(0,0,0,.7), rgba(0,0,0,1))
```

| k | target | now | w | color | note |
|---|---|---|---|---|---|
| SOS 초동 응답 | 60초 | 41초 | 68% | `#1E7A5A` | 오늘 2건 · 최장 52초 |
| 낙상 복합 알림 → 확인 | 3분 | 2분 10초 | 72% | `#1E7A5A` | **단독 충격은 알림 미발송** |
| 픽업 정시율 | 95% | 91% | 91% | `#8A5D12` | 지연 3건 · 전부 교통 |
| 리포트 전송 (동행 후) | 2시간 | 1시간 24분 | 70% | `#1E7A5A` | AI 초안 적용 이후 단축 |
| 짝 미매칭 해소 | 30분 | **52분** | 100% | `#C0392B` | 오늘 1건 · **목표 초과** |

> **"단독 충격은 알림 미발송"이 오탐 억제 규칙입니다.**
> 가속도 충격 하나만으로는 알림을 보내지 않고, **3조건 중 2개 이상**(충격 + 심박 이상 + 무응답)일 때
> 발송합니다. 가족 앱 이상 징후 카드의 `anomalySignals` 3건이 이 규칙의 산출물입니다.
>
> `maskImage` 그라디언트가 바에 걸려 있습니다 — 왼쪽이 약간 투명. 글래스 질감의 일부이며
> 데이터 표현이 아닙니다. 재현 시 값 오해를 부르지 않는지 확인하십시오.

### 8.5 동선 체인 · 이동 여유 (`routeChain`)

- 헤더: `동선 체인 · 이동 여유` ↔ `연속 배차 사이 실제 이동 시간`
- 각 인력 카드: 이름 12px/700 + 구간 체인 + 여유 판정 11px/700
- 구간 노드: 9×9 원 `#3B5C8A` + 시각(Montserrat 9px) + 장소(10px `whiteSpace:nowrap`),
  노드 사이 연결선 18×2px `rgba(10,31,60,.16)` (`marginBottom:22px`로 노드 상단 정렬)

| staff | legs | gap | color |
|---|---|---|---|
| 박지현 (주) | 13:50 대치동 자택 → 14:30 서울아산 → 16:10 대치동 복귀 | 오늘 마지막 건 · 여유 정상 | `#1E7A5A` |
| 서다인 (부 → 주) | 13:50 대치동 · 부 동행 → 16:10 동행 종료 → 17:32 송파 이동 38분 → 18:10 최정자 · 주 동행 | 여유 1시간 22분 · 정상 (일 7.6시간 · 주의 구간) | `#8A5D12` |
| 정민호 (주) | 16:20 길동 자택 → 17:00 투석센터 → 19:00 자택 복귀 | **부 동행 미배정 — 출발 보류 중 (해소 목표 15:50)** | `#C0392B` |

- 각주: `이동 여유가 실제 소요보다 짧으면 다음 건이 자동으로 지연 위험으로 표시되고, 픽업 정시율 SLA에 선반영됩니다.`

> **"서다인 (부 → 주)"** — 한 사람이 하루 안에 역할이 바뀝니다. 실제 운영의 현실입니다.
> 이동 시간(38분)을 **실측으로 계산**해야 합니다 (직선거리 아님 — 지도 API 경로 시간).
> 프로토타입은 하드코딩이지만 **실제로는 반드시 라우팅 API 연동**입니다.

### 8.6 근무 시간 · 피로도 상한 (`fatigue`)

- 헤더: `근무 시간 · 피로도 상한` ↔ **`일 10시간 · 주 52시간 상한`**
- 각 행: 이름 12px/700 · 업무 10px · 시간 Montserrat 12px/700 · 상태 10px/700 (flex:0 0 54px) · 바 6px

| name | hours | w | jobs | state | color |
|---|---|---|---|---|---|
| 서다인 | 7.6h | 76% | 부 1 + 주 1건 · 권역 간 이동 포함 | 주의 | `#8A5D12` |
| 박지현 | 6.2h | 62% | 주 동행 2건 · 이동 1.4시간 | 정상 | `#1E7A5A` |
| 오하늘 | 5.8h | 58% | 부 동행 2건 · 수습 | 정상 | `#1E7A5A` |
| 이수민 | **9.6h** | 96% | 타 권역 지원 · 오늘 강남 배차 없음 | **상한 임박** | `#C0392B` |

- 각주: `이수민은 상한 임박으로 오늘 배차 후보에서 자동 제외됐고 7/29 투석 건 AI 제안에서도 빠졌습니다 — 피곤한 동행자가 어르신을 부축하는 것이 가장 흔한 사고 원인입니다.`

> ### ⚠ 피로도는 표시가 아니라 게이트입니다
> 각주가 §3의 `aiAssignments[2].why`("이수민은 주 근무 상한 임박으로 후보 제외")와 **일치합니다** —
> 피로도 데이터가 실제로 배차 엔진의 후보 필터로 작동합니다.
>
> 구현 요건:
> - 일 10시간 / 주 52시간을 **하드 상한**으로 (근로기준법 + 안전)
> - **이동 시간을 근무 시간에 포함**하십시오 (박지현 "이동 1.4시간")
> - 상한 임박(90%+) 인력은 **AI 배정 후보에서 자동 제외**
> - 관제사가 수동으로 넘길 수 있게 하지 마십시오
> - 각주의 인과("피곤한 동행자 → 사고")를 UI에 남기십시오 — 규칙의 이유를 잊게 하면 우회합니다

### 8.7 오늘 리스크 워치 (`riskWatch`)

- 헤더: `오늘 리스크 워치` ↔ **`환경 × 건강 이력 교차`**
- 각 행: 레벨 pill(10px/700) · 이름 12px/700 · 사유 10px · **조치 11px/600 `#0A1F3C`** (`→` 접두)

| level | name | why | action |
|---|---|---|---|
| 높음 | 김순자 (78) | 실내 31° + 폭염 특보 + 심부전 이력 | 냉방 확인 콜 + 동행 시 보냉백 지참 |
| 높음 | 박말순 (83) | 등급 갱신 심사 중 · 낙상 이력 2회 | 2인 모두 부축 가능 인력으로 편성 |
| 중간 | 이영호 (81) | 어제 낙상 복합 알림 · 경과 관찰 | 동행 전 컨디션 확인 · **무리 시 취소 권한** |
| 중간 | 최정자 (75) | 투석일 다음날 · 탈수 위험 | 도보 구간 최소화 · 차량 배차 고정 |

레벨 색: 높음 `#C0392B` / `rgba(192,57,43,.1)` · 중간 `#8A5D12` / `rgba(138,93,18,.1)`

> **`why`가 항상 "환경 × 이력" 교차입니다** — 단일 지표로 리스크를 판정하지 않습니다.
> 실내 31°만으로는 경보가 아니고, **심부전 이력과 교차**할 때 "높음"이 됩니다.
>
> **"무리 시 취소 권한"** — 현장 컨시어지에게 취소 권한을 줍니다. 관제 승인 없이.
> 이것이 원칙 1(신뢰 우선)의 운영 구현입니다. 매출을 위해 무리한 동행을 강행하지 않습니다.

---

## 9. `plan` 탭 — 계획 · 인력

### 9.1 컨디션 예보 캘린더 (`weekForecast`) — F5-6

- 제목 `forecastTitle`: `forecastRange === '3' ? '3일 컨디션 예보 캘린더' : '주간 컨디션 예보 캘린더'`
- 범위 토글 (`forecastTabs`): `3일` / `7일` · 10px/700 · `padding:5px 11px` · 활성 NAVY
- 우측: `F5-6 · 케이웨더`
- 일자 카드 (flex, gap 6px): 요일 10px/700 · 점수 **Montserrat 18px/700** · 등급 10px/700 ·
  비고 10px · 건수 Montserrat 10px

| day | score | grade | note | jobs | tone |
|---|---|---|---|---|---|
| 일 26 | 68 | 보통 | 폭염 주의 | 9건 | warn |
| 월 27 | 74 | 좋음 | 맑음 | 11건 | ok |
| 화 28 | 81 | 좋음 | 구름 조금 | 12건 | ok |
| 수 29 | 58 | 주의 | 소나기 | 8건 | warn |
| 목 30 | 64 | 보통 | 습도 높음 | 10건 | warn |
| **금 31** | **41** | **위험** | **폭염 특보** | 6건 | bad |
| 토 1 | 77 | 좋음 | 맑음 | 7건 | ok |

**tone → 스타일:**
| tone | bg | border | fg |
|---|---|---|---|
| ok | `linear-gradient(180deg,#F1FAF6,#E6F4EE)` | `rgba(30,122,90,.24)` | `#1E7A5A` |
| warn | `linear-gradient(180deg,#FFF7E8,#FBEFD8)` | `rgba(138,93,18,.26)` | `#8A5D12` |
| bad | `linear-gradient(180deg,#FFF1EE,#FBE3DE)` | `rgba(192,57,43,.28)` | `#C0392B` |

- 각주: `31일(금) 폭염 특보 예보 — 배차 6건 중 3건에 일정 조정 권고를 선제 발송할 수 있습니다 (F8-4)`

> **`jobs` 건수가 점수와 역상관**입니다 (41점 날 6건, 81점 날 12건) — 이미 예보를 보고
> 배차를 조절한 결과입니다. 예보가 **운영 계획 도구**로 쓰인다는 증거.

### 9.2 감점 내역 (`scoreFactors`) — 100점 감점식 룰 엔진 L0

- 헤더: `감점 내역 · 김순자 (78) 도착 구간` ↔ `100점 감점식 · 룰 엔진(L0) · 커버리지 100%`
- 각 행: 지표 11px/700 (flex:0 0 72px) · `가중 {weight}` (Montserrat 10px, flex:0 0 48px) ·
  근거 11px (flex:1) · 감점 Montserrat 12px/700 (flex:0 0 42px 우측)

| name | weight | basis | delta | color |
|---|---|---|---|---|
| 기온 | 25 | 33° · 폭염주의보 구간 | −14 | `#C0392B` |
| 체감온도 | 25 | 36° · 습도 68% 반영 | −16 | `#C0392B` |
| (미세먼지) | (20) | (PM10 82 · 나쁨) | (−12) | `#8A5D12` |
| (자외선) | (20) | (지수 매우 높음) | (−16) | `#C0392B` |
| 강수 | 10 | 강수 확률 10% · 영향 없음 | 0 | `#1E7A5A` |

- 합계 행 (`borderTop: 1px solid rgba(10,31,60,.18)`): `최종 점수` ↔ **`52 · 주의`** (Montserrat 14px/700 `#C0392B`)
- 각주: **`측정값이 없는 지표는 0점으로 세지 않고 계산에서 제외한 뒤 커버리지로 표기합니다 — 결측을 감점으로 위장하지 않습니다`**

> ### ⚠ 결측 처리 원칙 — 이 각주가 F8 엔진 신뢰성의 근거입니다
> 센서·API가 값을 주지 않을 때 **0점 처리하면 "위험"으로 오판**합니다.
> 대신 해당 지표를 계산에서 빼고 **커버리지 %를 명시**합니다.
> 커버리지 60%인 점수와 100%인 점수는 다르게 취급돼야 합니다.
>
> **"룰 엔진(L0)"** — 이 계산은 ML이 아니라 결정론적 규칙입니다 (PRD 8.5 자율성 등급 L0).
> 재현 가능하고 설명 가능해야 합니다. 어르신·컨시어지·가족·관제가 **같은 52점**을 봅니다.
> 여기서만 감점 내역을 공개하는 것이 정보 비대칭의 설계입니다 —
> 관제는 계산 과정을, 나머지는 결과를 봅니다.

### 9.3 오늘 배차 브리핑 (`briefings`)

- 제목: `오늘 배차 브리핑 · 외출 컨디션` + `· 출발지·도착지 2구간 · 케이웨더`
- 각 행: 점수 **Montserrat 18px/700** (flex:0 0 40px) · 이름 12px/500 · 상세 10px · 구간 10px · 등급 10px/700

| score | grade | name | detail | legs |
|---|---|---|---|---|
| 52 | 주의 | 김순자 · 서울아산병원 | 자외선 -16 · 미세먼지 -12 · 체감 -20 · 양산·KF94·생수 | 출발 대치동 62 보통 → 도착 풍납동 52 주의 |
| 84 | 좋음 | 박말순 · 재택 방문 | 감점 요인 없음 · 준비물 없음 | 출발 길동 86 좋음 → 도착 길동 84 좋음 |
| **34** | **나쁨** | 최정자 · 세브란스 투석 | 미세먼지 나쁨 -24 · KF94 필수 · **일정 조정 권고 (F8-4)** | 출발 방배동 41 주의 → 도착 신촌동 34 나쁨 |

- 버튼 (아웃라인 NAVY, `handler 미연결`): `브리핑 일괄 발송 (3건)`

> **34점 건에 "일정 조정 권고"가 붙습니다** (F8-4). 하지만 §8.3에서 봤듯 **투석은 지연 불가**입니다 —
> 권고가 자동 실행되지 않고 관제사가 판단합니다. **자동 취소 기능을 만들지 마십시오.**
>
> 버튼에 핸들러가 없습니다 (프로토타입 미완). 실제 구현 시 발송 대상·채널(가족 앱/컨시어지 앱/
> 어르신 큰 활자 알림)을 선택하게 하십시오.

### 9.4 컨시어지 현황 (`staff`)

- 각 행: 상태 점 7×7 · 이름 12px/500 · 권역 11px (flex:0 0 84px) ·
  건수 Montserrat 12px/700 (flex:0 0 32px) · 평점 Montserrat 11px `#7A5C28` (flex:0 0 34px)

| name | area | jobs | rating | color |
|---|---|---|---|---|
| 박지현 | 강남·서초 | 2건 | 4.9 | `#4ADE80` |
| 이수민 | 송파·강동 | 2건 | 4.8 | `#4ADE80` |
| 정민호 | 강남 | 1건 | 4.7 | `#7A5C28` |
| 한서연 | 서초·동작 | 2건 | 5.0 | `#8FA9CC` |

> **평점만 있고 판매액·매출 기여가 없습니다** (원칙 1). 이 테이블에 매출 컬럼을 추가하지 마십시오.
> 평점 출처는 가족 만족도이며, 컨시어지 평가의 유일한 성과 지표입니다.

---

## 10. 상태 모델

```js
dispTab:       'live'|'pair'|'plan'      // 기본 'live'
sos:           boolean    // ★ 어르신 발신. 관제/가족이 해제
sosDispatched: boolean    // 급파 지시 → 배차 그리드 김순자 바 빨강
assign:        'pending'|'done'          // 초기 'pending'
unmatchFixed:  boolean    // 1회성
checkedIn:     boolean    // ★ 컨시어지 체크인 → 김순자 바 planned→active
forecastRange: '3'|'7'    // 기본 '7'
clock:         number     // 1초 틱 (시계 + SOS 경과)
vw:            number     // 리사이즈 추적 → 맵 invalidateSize()
events:        Event[]     // 전 화면 push 누적
```

**파생 관계 (중요):**
```
JOBS (단일 원본)
├→ rows        (배차 그리드 바)
├→ pairBoard   (페어 편성 보드)
├→ pairKpis    ('오늘 페어 편성' = sup 있는 건 / 전체)
└→ routeChain  (동선 체인 — 프로토타입은 별도 하드코딩, 실제로는 파생시켜야 함)

checkedIn      → JOBS[1].kind: 'planned' → 'active'
sosDispatched  → JOBS[1].kind: → 'sos'
```

---

## 11. 데이터 계약 (구현용 초안)

```ts
type DispatchScreen = {
  branch: string;                    // "강남지점"
  clock: { iso: string; tz: 'KST' };
  kpis: { key: string; value: string; level: 'neutral'|'ok'|'warn'|'danger' }[];

  sos: {
    elder: { name: string; age: number; district: string };
    nearest: { staff: string; distanceKm: number };
    elapsedSec: number;              // 초 단위 필수
    targetSec: 60;
    ems: 'standby'|'called'|'onScene';
    dispatched: boolean;
  } | null;

  aiAssignments: {                   // L4: 승인 없이 실행 금지
    id: string; client: string; age: number; at: string; job: string;
    proposed: { lead: string; support: string };
    fitScore: number;
    rationale: string[];             // ★ 필수. 빈 배열이면 표시 금지
    excludedCandidates: { staff: string; reason: string }[];  // 근무상한 등
  }[];
  assignmentState: 'pending'|'approved';
  auditLog: { actor: string; action: string; at: string }[];   // 승인 이력

  jobs: {                            // ★ 단일 원본
    id: string; start: string; end: string;
    client: { name: string; age: number }; job: string;
    lead: string; support: string | null;   // null = 짝 없음
    kind: 'planned'|'active'|'done'|'sos';
    state: '완료'|'진행중'|'확정'|'짝 없음'|'순환 경고';
    ruleChecks: {                    // note의 구조화
      sameGender: boolean; rotationCount: number;   // 4 이상이면 위반
      qualified: boolean; leadContinuity: boolean;
      leadHours: number;
    };
  }[];

  staffRoster: { name: string; role: 'lead'|'support'|'both';
                 area: string; rating: number; trainee: boolean }[];

  fatigue: { name: string; hoursToday: number; dailyCap: 10; weeklyCap: 52;
             includesTravel: true; state: 'ok'|'warn'|'nearCap';
             excludedFromDispatch: boolean }[];    // ★ true면 배차 후보 제외

  unmatched: {
    jobId: string; at: string; client: string;
    reason: string; attempts: number;
    options: { label: string; cost: string; feasible: boolean }[];  // feasible:false도 표시
  }[];

  sla: { key: string; target: string; current: string;
         level: 'ok'|'warn'|'breach'; note: string }[];

  routeChains: { staff: string; role: string;
                 legs: { at: string; place: string; kind: 'pickup'|'job'|'drop'|'move'|'next' }[];
                 slack: string; level: 'ok'|'warn'|'blocked' }[];

  riskWatch: { elder: string; age: number; level: 'high'|'medium';
               why: string[];              // 항상 2개 이상 (환경 × 이력 교차)
               action: string }[];

  forecast: { day: string; score: number; grade: string; note: string;
              jobCount: number; tone: 'ok'|'warn'|'bad' }[];

  scoreBreakdown: {                  // 룰 엔진 L0. 결정론적
    subject: string; segment: 'origin'|'destination';
    factors: { name: string; weight: number; basis: string; delta: number;
               measured: boolean }[];      // measured:false → 계산 제외
    coverage: number;                // 결측 제외 후 커버리지 %
    finalScore: number; grade: string;
  };

  briefings: { score: number; grade: string; subject: string;
               detail: string; legs: string; recommendReschedule: boolean }[];

  events: { at: string; kind: string; text: string; color: string }[];
};
```

**스키마 레벨 제약 (서버가 강제):**
- `jobs[].support === null`인 건은 **확정 상태로 전이 불가**
- `fatigue[].excludedFromDispatch === true`인 인력은 `aiAssignments`에 등장 불가
- `aiAssignments[].rationale`이 빈 배열이면 **응답 자체를 거부**
- `ruleChecks.rotationCount >= 4` → 배정 거부
- `scoreBreakdown.factors[].measured === false`는 `finalScore` 계산에서 제외
- `staffRoster`에 `salesAmount` / `upsellCount` 필드를 **만들지 마십시오** (원칙 1)

---

## 12. 구현 시 반드시 확인할 것

1. **`JOBS` 단일 원본** — 그리드·페어보드·KPI·동선이 전부 여기서 파생되는지
2. **1인 배차 확정 API가 존재하지 않는지** (UI 검증 아님, 서버 제약)
3. **`rationale`(why) 없는 AI 배정안은 표시하지 않기** — 블랙박스 금지
4. `개별 검토`가 `일괄 승인`과 대등한 선택지인지 (L4 유지)
5. **승인 이력 감사 로그** 실제 구현 (각주에 약속돼 있음)
6. **피로도 상한이 배차 후보를 실제로 차단**하는지 — 이동 시간 포함
7. 순환 규칙(동일 페어 3회까지, **4회부터 위반**) 구현
8. 자격 게이트 — 투석에 수습 배차 불가
9. 결측 지표를 **0점 처리하지 않고 커버리지로 표기**
10. `scrollWheelZoom: false` + 맵 cleanup(`remove()`) + 리사이즈 `invalidateSize()`
11. 실측 좌표 그대로 사용 (좌표는 `04-data-model.md`)
12. 초 단위 시계 — SOS 경과 시간이 초로 표시됨
13. **밀도를 낮추지 마십시오** — 10–13px 활자가 이 화면에서는 정답
14. `#4ADE80`·`#8FE3C0`·`#C9A46B`는 **다크 배경 전용** 밝은 변형
15. `staffRoster`에 매출·판매 지표를 넣지 않기 (원칙 1)
16. 미매칭 옵션의 `feasible: false` 항목도 **불가 이유와 함께 표시**
17. 그리드 컬럼 수 하드코딩 금지 — `auto-fit minmax()`, 와이드 모니터 대응

---

## 부록 · 회의 확정 사항과의 정합 (2026-07 실무회의 우선)

- **REQ-04 (긴급 대응 범위)가 §2 SOS 배너에 우선 적용됩니다.**
  조치 버튼은 `급파 지시 (주간·가용)` / `119 연계` / `해제` 3종으로 구분하고,
  배너 하단에 "기본 상품 보증 범위: 긴급신호 접수 + 119 연계까지 · 현장 도착 SLA 아님 ·
  야간 출동(외주) 옵션 가입 여부"를 고지한다. 데이터 계약의 `sos.ems` 필드가 이를 담는다.
- SOS 초동 60초는 "접수·연계" SLA이지 현장 도착 SLA가 아님 (REQ-04 문서화 요건).
