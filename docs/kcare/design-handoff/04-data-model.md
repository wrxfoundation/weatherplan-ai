# 04 · 데이터 모델 · 상태 · API 계약 초안

프로토타입은 목 데이터로 동작합니다. 이 문서는 화면이 실제로 요구하는 데이터 형태를
역설계한 것이며, **구현 시 백엔드와 합의할 출발점**입니다.

---

## 1. 핵심 엔티티

### Elder (어르신)
```
id, name, age, gender
address { district, dong, lat, lng }
careGrade          // 장기요양 등급. null 가능. 갱신 심사 중 상태 존재
guardians[]        // → Guardian. 순서가 응급 연락 우선순위 (미확정 가능)
conditions[]       // 심부전 · 투석 · 낙상 이력 2회 등
fallHistory[]      // { when, place, source: 'family'|'self'|'observed', confirmed }
devices[]          // → Device
residenceFitScore  // 거주지 적합도 (5축 합산)
```
**주의** `fallHistory`의 `source`를 반드시 유지하십시오.
가족 진술과 본인 진술이 다른 경우가 있고, 이것을 병합하면 정보가 손실됩니다.

### Guardian (보호자)
```
id, name, relation      // 아들 · 딸 · 배우자
residence               // 'kr' | 'us' | 'au' ...  → 타임존·통화·리포트 발송시각 분기
timezone, currency
sharePct                // 분담 비율
isPrimaryContact        // 연락 담당 1명 고정
notificationPrefs
```
**주의** 형제 간 분담을 **순위로 정렬해 노출하지 마십시오** (`01-domain-rules.md` 1.2).

### Concierge (컨시어지)
```
id, name, gender
qualification           // 간호사 · 요양보호사 · 간호조무사
yearsExp, rating        // ★4.9
tier                    // 수습 | 일반 | 정규 | 시니어
leadCount, assistCount  // 승급 판정용
regions[]               // 강남·서초
regularHouseholds[]     // 정규 이상: 단골 가구 지분
```
**금지 필드** `salesAmount` `upsellRevenue` 등 판매 실적을 컨시어지에 귀속시키는 필드.

### Assignment (배차)
```
id, elderId
leadConciergeId, assistConciergeId   // 둘 다 필수 — 단독 배차 없음
scheduledAt, purpose, destination
vehicleRequired
fitScore, fitReason                  // AI 배정안의 근거. 없으면 렌더 금지
approvedBy, approvedAt               // 사람 승인 필수
checkInAt, checkInGps
status
preparationItems[]                   // 외출 컨디션에서 자동 반영된 항목 포함
```
**제약** `leadConciergeId`와 `assistConciergeId`는 페어 규칙을 만족해야 합니다:
어르신 성별과 동일한 성별 최소 1명 · 같은 페어 4연속 금지 · 수습은 assist만.

### Device / Reading / Alert
```
Device  { id, elderId, kind, model, lastSeenAt, batteryPct, status }
Reading { deviceId, at, metric, value }        // 원시 계측
Alert   { id, elderId, ruleId, firedAt, conditionsMet[],
          severity, dispatched, falsePositive }
```
**알림 생성은 규칙 엔진에서만.** 원시 Reading이 직접 Alert가 되지 않습니다.

```
Rule { id, name, conditions[], requireAll, action, falsePositiveRate }
```
`action: 'notify_control' | 'notify_family' | 'log_only'`.
오탐률 30% 초과 규칙은 `log_only`로 강제 (`device` 화면 규칙).

### Report (동행 리포트)
```
id, assignmentId
observations[]      // 관찰 사실만
quotes[]            // 의료진 발언 인용 (발화자 명시)
aiDraft, confirmedBy, confirmedAt
attachments[]
```
**스키마 레벨 금지** `diagnosis` `opinion` `prescription_interpretation` 필드를
만들지 마십시오 (의료법 17조). AI 초안 생성 프롬프트에서도 차단.

### Payment (자비) / Claim (급여) — **분리된 원장**
```
Payment { id, payerGuardianId, amount, currency, method, revenueStreamNo, ... }
Claim   { id, elderId, serviceType, claimedAt, approvedAt, settledAt,
          amount, copayPaymentId }   // 본인부담금은 Payment를 참조
```
**하나의 테이블에 섞지 마십시오** (`01-domain-rules.md` 1.4).
`Claim`은 청구 전 자격·한도·수급기간 검증을 통과해야 합니다 (리스크 H8).

### RevenueStream
```
no                  // 01~22. 정본
name, phase         // P0 | P1 | P2 | P3
requiresLicense     // 자격 요건
licenseObtained     // false면 거래 기능 잠금
```

---

## 2. 거주지 적합도 5축

단일 점수로 합산해 게이팅에 씁니다. `dispatch`·확장 우선순위 화면에서 재사용.

| 축 | 의미 |
|---|---|
| 도달 | 컨시어지가 도달 가능한 시간 |
| 의료 | 제휴 병원·응급실 접근성 |
| 주거 | 주거 형태·엘리베이터·계단 |
| 인프라 | 통신·교통 |
| 거리 | 지점으로부터의 거리 |

**미결정 사항** 실제 주민등록·컨시어지 밀도·심평원 데이터를 Phase 1에 연결할지.
현재는 목 데이터. 가중치도 미확정 — 사업 담당자 확인 필요.

같은 5축을 **신규 지역 확장 우선순위** 평가에 재사용합니다 (운영 기획 도구).

---

## 3. 외출 컨디션 점수

구간별로 계산하고 **두 구간 중 낮은 값**을 대표 점수로 씁니다 (안전 측).

```
OutingCondition {
  legs[]        // { tag: '출발'|'도착', place, score, grade, factors, detail }
  score         // min(legs[].score)
  grade         // 좋음 | 보통 | 주의 | 나쁨
  factors       // 기온 · 체감 · 미세먼지 · 자외선 · 습도
  advice        // 어르신용 평문 안내
  kit[]         // 준비물 → Assignment.preparationItems로 자동 전파
}
```
출처: 케이웨더 + 기상청 특보 API (**행정동 10자리 코드 매칭**).
장애 시 대체: 케이웨더 특보값 + 재난문자 수신.

---

## 4. 프로토타입 상태 → 실제 구현 매핑

프로토타입의 `state`는 데모 시나리오 토글이 대부분입니다. 그대로 옮기지 마십시오.

| 프로토타입 state | 실제 구현 |
|---|---|
| `role` | 인증된 사용자의 역할. 클라이언트 토글 아님 |
| `sos` `sosDispatched` | 서버 이벤트 (WebSocket / push) |
| `anomaly: 'open'\|'sent'\|'dismissed'` | `Alert.status`. 서버 소유 |
| `fall` | `Alert` 존재 여부 |
| `offline` | 실제 네트워크 상태 (`navigator.onLine` + 요청 실패 감지) |
| `assign: 'pending'\|'done'` | `Assignment.approvedAt` null 여부 |
| `checkedIn` | `Assignment.checkInAt` |
| `paid` `plan` | 구독 상태 |
| `famTab` `elderTab` `concTab` `dispTab` `globTab` | 라우팅 |
| `vw` `navOpen` `groups` | UI 로컬 상태. 유지 |
| `events[]` | 서버 이벤트 스트림 (프로토타입은 로컬 push) |
| `clock` `autoStep` | 데모 전용. **제거** |
| 나머지 boolean 다수 | 데모 시나리오 토글. **제거** |

### 이벤트 스트림
프로토타입의 `push(kind, text, color)`는 관제 티커용입니다.
실제 구현에서는 서버 이벤트를 구독하고, `color`는 클라이언트에서 `kind`로부터 도출하십시오
(색을 서버가 보내면 디자인 변경이 API 변경이 됩니다).

---

## 5. API 계약 초안

역할별로 **다른 엔드포인트**를 쓰십시오. 같은 리소스에 필드 필터만 다르게 하는 방식은
정보 비대칭을 깨뜨리기 쉽습니다.

```
# 가족
GET  /family/elders/:id/today          → 요약 1줄 + 주간 추이 + vitals
GET  /family/alerts                    → 가족용 톤으로 가공된 알림 (경과시간·SLA 제외)
POST /family/alerts/:id/escalate
POST /family/alerts/:id/dismiss        → falsePositive 기록 → 모델 재학습
GET  /family/schedule
POST /family/schedule/:id/reschedule   → 옵션별 수수료 포함 응답
POST /family/meetings                  → 타임존 교집합 계산

# 어르신
GET  /elder/today                      → 방문자·일정·약·질문·외출 컨디션
POST /elder/sos
POST /elder/medication/:doseId/taken
POST /elder/home/cool                  → 에어컨 제어 + 가족 통보 (1요청 2효과)
# 주의: 어르신 API는 자신에 대한 평가·의심 데이터를 반환하지 않습니다

# 컨시어지
GET  /concierge/assignments/today      → 오프라인 캐시 대상
POST /concierge/assignments/:id/checkin
POST /concierge/reports                → 큐 재전송 대비 멱등키 필수
# 관찰 사실만. 소견·측정값 엔드포인트 없음

# 관제
GET  /dispatch/live                    → SSE/WS. 경과시간·SLA 포함
GET  /dispatch/assignments/proposals   → fitScore + fitReason 필수
POST /dispatch/assignments/approve     → 감사 로그 기록
GET  /dispatch/risk-watch
GET  /dispatch/disaster-feed           → 해석된 브리핑 (원시 경보 아님)

# 경영
GET  /admin/revenue/forecast
GET  /admin/rules/performance
GET  /admin/sla
GET  /admin/risks
# 개별 사건 엔드포인트 없음
```

### 멱등성
컨시어지 앱은 오프라인 큐를 재전송합니다.
`POST /concierge/*`는 **전부 멱등키를 받으십시오.** 중복 체크인·중복 리포트가 발생합니다.

---

## 6. 지도 데이터 (프로토타입 실제 좌표)

Leaflet + CARTO `dark_all` 타일.
`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`, subdomains `abcd`, maxZoom 19.

**행정구**
| 이름 | lat | lng |
|---|---|---|
| 종로구 | 37.5735 | 126.9788 |
| 마포구 | 37.5637 | 126.9084 |
| 영등포구 | 37.5264 | 126.8963 |
| 강남구 | 37.5172 | 127.0473 |
| 송파구 | 37.5145 | 127.1059 |
| 한강 | 37.5185 | 126.9976 |

**제휴 병원**
| 이름 | lat | lng | 패스트트랙 대기 | 운영 |
|---|---|---|---|---|
| 세브란스 | 37.5622 | 126.9408 | 7.1일 | 고정 슬롯 12석 |
| 서울아산병원 | 37.5270 | 127.1088 | 5.2일 | 취소분 우선 배정 |
| 삼성서울병원 | 37.4881 | 127.0857 | 6.8일 | 주 2회 슬롯 개방 |

마커: 10px 원 + `box-shadow: 0 0 0 4px rgba(255,255,255,.12)` + 라벨 10px
(`text-shadow: 0 1px 2px rgba(0,0,0,.7)`).
팝업: 흰 카드, 제목 13px/700, 부제 10px, 지표 행은 상단 구분선 + 좌우 정렬.

**주의** 지도 인스턴스를 언마운트 시 반드시 `remove()` 하십시오.
프로토타입은 `mapRef` 콜백에서 처리합니다 — 누락하면 리렌더마다 인스턴스가 누적됩니다.
