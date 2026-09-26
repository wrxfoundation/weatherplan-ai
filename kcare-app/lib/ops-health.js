// 건강·안전 관제 목 데이터 — 요청서 2·3·6절. 숫자는 데모 값이며 시안(2026-09-16)과 어긋나지 않게 맞췄다.
// 시각은 "지금 기준 n분 전" 상대값으로 두어 화면의 시계와 항상 맞물린다.

// 데모 인물 — 기존 앱과 같은 어르신·컨시어지·보호자
export const CUSTOMERS = {
  김순자: {
    name: "김순자", age: 78, sex: "여", branch: "강남 본점", district: "강남구 대치동",
    address: "서울 강남구 대치동 OO아파트 101동 1203호", phone: "010-****-1001",
    concierge: { main: "박지현", sub: "서다인" },
    conditions: ["심부전", "고혈압"], meds: ["항응고제", "혈압약"], allergies: ["등록된 알레르기 없음"],
    guardians: [
      { name: "김민수", rel: "아들", role: "주", place: "서울", tz: 0, phone: "010-****-1234", note: "결제 10만 한도" },
      { name: "김지영", rel: "차녀", role: "부", place: "LA", tz: -16, phone: "해외 연락처" },
      { name: "김현우", rel: "삼남", role: "비상", place: "시드니", tz: 1, phone: "해외 연락처" },
    ],
    consent: { entry: "긴급 시 문 개방 동의 완료 (2025-05-12)", measure: "긴급조치 사전동의 완료", door: "공동현관 비밀번호 관제센터 보관 · 현관 디지털도어락" },
    ltc: "장기요양 3등급", personal: { hrWarn: 105, hrDanger: 120, note: "심부전 — 안정시 심박 낮아 표준 기준으로는 늦게 감지" },
  },
  이영호: {
    name: "이영호", age: 81, sex: "남", branch: "송파지점", district: "송파구 잠실동",
    address: "서울 송파구 잠실동 OO아파트 5동 402호", phone: "010-****-2001",
    concierge: { main: "이수민", sub: "오하늘" },
    conditions: ["만성 폐질환", "퇴행성 관절염"], meds: ["기관지 확장제", "소염진통제"], allergies: ["등록된 알레르기 없음"],
    guardians: [{ name: "이성호", rel: "아들", role: "주", place: "서울", tz: 0, phone: "010-****-2210" }],
    consent: { entry: "긴급 시 문 개방 동의 완료 (2026-07-29)", measure: "긴급조치 사전동의 완료", door: "현관 번호키 · 비밀번호 보관 동의" },
    ltc: "장기요양 4등급", personal: { spo2Warn: 92, spo2Danger: 89, note: "만성 폐질환 — 평소 93~95% 유지" },
  },
  박말순: {
    name: "박말순", age: 83, sex: "여", branch: "송파지점", district: "강동구 길동",
    address: "서울 강동구 길동 OO아파트 3층 302호", phone: "010-****-3001",
    concierge: { main: "윤세라", sub: "정민호" },
    conditions: ["심부전", "고혈압", "청각장애(심하지 않음)"], meds: ["항응고제", "혈압약"], allergies: ["보호자 확인 필요"],
    guardians: [{ name: "박은지", rel: "장녀", role: "주", place: "부산", tz: 0, phone: "010-****-3302" }],
    consent: { entry: "긴급 시 문 개방 동의 완료 (2025-10-20)", measure: "긴급조치 사전동의 완료", door: "공동현관 없음 · 현관 디지털도어락 비밀번호 보관" },
    ltc: "장기요양 2등급",
  },
  한복자: {
    name: "한복자", age: 79, sex: "여", branch: "송파지점", district: "강동구 길동",
    address: "서울 강동구 길동 OO빌라 201호", phone: "010-****-4001",
    concierge: { main: "정민호", sub: "서다인" },
    conditions: ["만성 신부전 (투석)", "당뇨"], meds: ["인슐린", "인 결합제"], allergies: ["등록된 알레르기 없음"],
    guardians: [{ name: "한준호", rel: "아들", role: "주", place: "서울", tz: 0, phone: "010-****-4418" }],
    consent: { entry: "긴급 시 문 개방 동의 완료 (2025-08-18)", measure: "긴급조치 사전동의 완료", door: "현관 열쇠 · 보호자 보관" },
    ltc: "장기요양 3등급",
  },
  오태식: {
    name: "오태식", age: 80, sex: "남", branch: "강남 본점", district: "서초구 방배동",
    address: "서울 서초구 방배동 OO아파트 2동 1105호", phone: "010-****-5001",
    concierge: { main: "한서연", sub: "오하늘" },
    conditions: ["경도 인지장애", "고지혈증"], meds: ["인지개선제", "고지혈증약"], allergies: ["등록된 알레르기 없음"],
    guardians: [{ name: "오세라", rel: "장녀", role: "주", place: "서울", tz: 0, phone: "010-****-5512" }],
    consent: { entry: "긴급 시 문 개방 동의 완료 (2025-12-15)", measure: "긴급조치 사전동의 완료", door: "공동현관 비밀번호 보관 · 현관 번호키" },
    ltc: "인지지원등급", personal: { inactiveWarn: "3시간", note: "낮잠 습관 — 주간 무감지 주의 기준 완화" },
  },
  최정자: {
    name: "최정자", age: 75, sex: "여", branch: "강남 본점", district: "강남구 역삼동",
    address: "서울 강남구 역삼동 OO오피스텔 803호", phone: "010-****-6001",
    concierge: { main: "서다인", sub: "오하늘" },
    conditions: ["골다공증"], meds: ["골다공증약"], allergies: ["등록된 알레르기 없음"],
    guardians: [{ name: "최선영", rel: "차녀", role: "주", place: "도쿄", tz: 0, phone: "해외 연락처" }],
    consent: { entry: "긴급 시 문 개방 동의 완료 (2026-07-06)", measure: "긴급조치 사전동의 완료", door: "현관 디지털도어락 비밀번호 보관" },
    ltc: "장기요양 4등급",
  },
  강필순: {
    name: "강필순", age: 82, sex: "여", branch: "강남 본점", district: "강남구 대치동",
    address: "서울 강남구 대치동 OO빌라 102호", phone: "010-****-7001",
    concierge: { main: "서다인", sub: "오하늘" },
    conditions: ["시각장애(심함)", "고혈압"], meds: ["혈압약"], allergies: ["등록된 알레르기 없음"],
    guardians: [{ name: "강OO", rel: "아들", role: "주", place: "확정 전", tz: 0, phone: "등록 확인 필요" }],
    consent: { entry: "긴급 시 문 개방 동의 완료 (2025-07-02)", measure: "긴급조치 사전동의 완료", door: "공동현관 비밀번호 보관" },
    ltc: "장기요양 2등급",
  },
};

// 이름이 데모 인물에 없어도 화면이 비지 않게 — 기본 프로필
export function getCustomer(name) {
  return (
    CUSTOMERS[name] || {
      name, age: null, sex: "—", branch: "확정 전", district: "확정 전", address: "주소 확인 필요", phone: "—",
      concierge: { main: "미배정", sub: "—" }, conditions: ["등록 없음"], meds: ["등록 없음"], allergies: ["등록 없음"],
      guardians: [], consent: { entry: "동의 확인 필요", measure: "동의 확인 필요", door: "—" }, ltc: "—",
    }
  );
}

// 우선목록 (2-2) — kind: fall·vital·inactive·unworn·battery·stale·sensor·activity·sleep
// agoMin 은 발생 시각(분 전), lastNormal 은 마지막 정상값, rxAgoMin 은 마지막 데이터 수신(분 전)
export const PRIORITY = [
  { id: "p-park", name: "박말순", age: 83, sev: "sev1", kind: "fall", tags: ["fall"], signal: "낙상 감지 후 무동작", value: "낙상 감지 · 무동작 2분 18초", threshold: "낙상 감지 후 30초 무동작 시 SEV1", agoMin: 4.2, lastNormal: { agoMin: 6, text: "걸음 감지 · 심박 84 bpm" }, location: "강동구 길동 OO아파트 3층 (자택 · 실시간)", rxAgoMin: 0.7, feed: "live", controller: "김태영", state: "active" },
  { id: "p-kim", name: "김순자", age: 78, sev: "danger", kind: "vital", tags: ["vital"], signal: "심박수 위험기준 초과", value: "132 bpm", threshold: "개별 위험 120 bpm 이상 · 2분 지속 (표준 130)", agoMin: 6.2, lastNormal: { agoMin: 14, text: "96 bpm" }, location: "강남구 대치동 자택 (실시간)", rxAgoMin: 0.2, feed: "live", controller: "김태영", state: "ack" },
  { id: "p-lee", name: "이영호", age: 81, sev: "warn", kind: "vital", tags: ["vital"], signal: "혈중산소 주의기준 이하 3회 반복", value: "92%", threshold: "주의 93% 이하 · 1시간 내 3회 (위험 90%)", agoMin: 14, lastNormal: { agoMin: 25, text: "96%" }, location: "송파구 잠실동 자택 (실시간)", rxAgoMin: 1, feed: "live", controller: "김태영", state: "new" },
  { id: "p-kang", name: "강필순", age: 82, sev: "warn", kind: "inactive", tags: ["inactive", "unworn"], signal: "거실 움직임 없음 · 워치 미착용", value: "무감지 2시간 40분 · 미착용 42분", threshold: "움직임 없음 주의 2시간 (위험 4시간) · 미착용 주의 1시간", agoMin: 160, lastNormal: { agoMin: 162, text: "거실 이동 감지" }, location: "강남구 대치동 자택 (센서 · 마지막 위치)", rxAgoMin: 42, feed: "unworn", controller: "김태영", state: "new" },
  { id: "p-yoon", name: "윤복례", age: 84, sev: "warn", kind: "activity", tags: ["activity"], signal: "활동량 급감", value: "오늘 320보", threshold: "7일 평균(2,900보) 대비 -60% 이하", agoMin: 105, lastNormal: { agoMin: 1440, text: "어제 2,740보" }, location: "송파구 문정동 자택 (실시간)", rxAgoMin: 3, feed: "live", controller: "김태영", state: "ack" },
  { id: "p-jo", name: "조명자", age: 80, sev: "warn", kind: "sleep", tags: ["sleep"], signal: "수면시간 급증", value: "11시간 30분", threshold: "평소(6시간 50분) 대비 +50% 이상", agoMin: 515, lastNormal: { agoMin: 2000, text: "7시간 10분" }, location: "강남구 도곡동 자택 (실시간)", rxAgoMin: 2, feed: "live", controller: "김태영", state: "ack" },
  { id: "p-shin", name: "신옥순", age: 77, sev: "warn", kind: "vital", tags: ["vital"], signal: "심박수 하한 주의", value: "52 bpm", threshold: "주의 55 bpm 이하 · 2분 지속 (위험 45)", agoMin: 25, lastNormal: { agoMin: 40, text: "61 bpm" }, location: "서초구 반포동 자택 (실시간)", rxAgoMin: 0.5, feed: "live", controller: "김태영", state: "new" },
  { id: "p-im", name: "임병수", age: 83, sev: "warn", kind: "unworn", tags: ["unworn"], signal: "워치 미착용", value: "1시간 50분", threshold: "주의 1시간 (위험 3시간)", agoMin: 50, lastNormal: { agoMin: 110, text: "착용 · 심박 74 bpm" }, location: "강동구 성내동 자택 (마지막 위치)", rxAgoMin: 110, feed: "unworn", controller: "김태영", state: "ack" },
  { id: "p-bae", name: "배정순", age: 79, sev: "warn", kind: "battery", tags: ["battery"], signal: "워치 배터리 부족", value: "15%", threshold: "주의 20% 이하 (위험 10%)", agoMin: 15, lastNormal: { agoMin: 240, text: "배터리 41%" }, location: "강남구 삼성동 자택 (실시간)", rxAgoMin: 1, feed: "live", controller: "김태영", state: "new" },
  { id: "p-moon", name: "문덕수", age: 81, sev: "warn", kind: "vital", tags: ["vital"], signal: "혈중산소 주의기준 이하", value: "93%", threshold: "주의 93% 이하 · 1회 (위험 90%)", agoMin: 7, lastNormal: { agoMin: 12, text: "95%" }, location: "송파구 가락동 자택 (실시간)", rxAgoMin: 0.3, feed: "live", controller: "김태영", state: "new" },
  { id: "p-seo", name: "서금례", age: 85, sev: "warn", kind: "inactive", tags: ["inactive"], signal: "침실 움직임 없음", value: "무감지 2시간 10분", threshold: "움직임 없음 주의 2시간 (위험 4시간)", agoMin: 130, lastNormal: { agoMin: 131, text: "침실 이동 감지" }, location: "강동구 둔촌동 자택 (센서 · 실시간)", rxAgoMin: 0.2, feed: "live", controller: "김태영", state: "ack" },
  { id: "p-hwang", name: "황순덕", age: 78, sev: "warn", kind: "unworn", tags: ["unworn"], signal: "워치 미착용", value: "1시간 5분", threshold: "주의 1시간 (위험 3시간)", agoMin: 5, lastNormal: { agoMin: 65, text: "착용 · 심박 70 bpm" }, location: "서초구 서초동 자택 (마지막 위치)", rxAgoMin: 65, feed: "unworn", controller: "김태영", state: "new" },
  { id: "p-noh", name: "노영길", age: 82, sev: "warn", kind: "vital", tags: ["vital"], signal: "안정시 심박 급변", value: "평소 대비 +28%", threshold: "주의 +25% (위험 +40%) · 5분 내 변화", agoMin: 35, lastNormal: { agoMin: 60, text: "안정시 66 bpm" }, location: "강남구 논현동 자택 (실시간)", rxAgoMin: 0.4, feed: "live", controller: "김태영", state: "ack" },
  { id: "p-kwon", name: "권말녀", age: 86, sev: "warn", kind: "activity", tags: ["activity"], signal: "활동량 급감", value: "오늘 410보", threshold: "7일 평균(1,800보) 대비 -60% 이하", agoMin: 115, lastNormal: { agoMin: 1440, text: "어제 1,920보" }, location: "송파구 방이동 자택 (실시간)", rxAgoMin: 4, feed: "live", controller: "김태영", state: "ack" },
  { id: "p-han", name: "한복자", age: 79, sev: "device", kind: "stale", tags: ["stale", "battery"], signal: "건강정보 장시간 미수신 · 배터리 방전 추정", value: "6시간 17분 미수신", threshold: "미수신 주의 2시간 (위험 6시간) · 마지막 배터리 12%", agoMin: 377, lastNormal: { agoMin: 377, text: "심박 78 bpm · 배터리 12%" }, location: "강동구 길동 (마지막 위치 · 미수신)", rxAgoMin: 377, feed: "battery", controller: "김태영", state: "ack" },
  { id: "p-oh", name: "오태식", age: 80, sev: "device", kind: "sensor", tags: ["sensor"], signal: "욕실 mmWave 센서 오프라인", value: "센서 전원 꺼짐", threshold: "센서 응답 없음 10분", agoMin: 4, lastNormal: { agoMin: 15, text: "욕실 재실 감지 종료" }, location: "서초구 방배동 자택 (워치 실시간)", rxAgoMin: 0.3, feed: "live", controller: "김태영", state: "new" },
  { id: "p-jung", name: "정옥분", age: 80, sev: "device", kind: "stale", tags: ["stale"], signal: "삼성헬스 동기화 지연", value: "7시간 5분 미수신", threshold: "미수신 주의 2시간 (위험 6시간)", agoMin: 425, lastNormal: { agoMin: 425, text: "심박 72 bpm · 배터리 66%" }, location: "강남구 청담동 (마지막 위치)", rxAgoMin: 425, feed: "stale", controller: "김태영", state: "ack" },
  { id: "p-yoo", name: "유상철", age: 84, sev: "device", kind: "stale", tags: ["stale"], signal: "휴대전화 연결 끊김", value: "6시간 30분 미수신", threshold: "미수신 주의 2시간 (위험 6시간)", agoMin: 390, lastNormal: { agoMin: 390, text: "심박 69 bpm · 배터리 58%" }, location: "서초구 잠원동 (마지막 위치)", rxAgoMin: 390, feed: "stale", controller: "김태영", state: "new" },
  { id: "p-an", name: "안분이", age: 79, sev: "device", kind: "sensor", tags: ["sensor"], signal: "거실 센서 전원 꺼짐", value: "센서 응답 없음 25분", threshold: "센서 응답 없음 10분", agoMin: 25, lastNormal: { agoMin: 26, text: "거실 재실 감지" }, location: "강동구 암사동 자택 (워치 실시간)", rxAgoMin: 0.5, feed: "live", controller: "김태영", state: "ack" },
];

// 대시보드 상단 12타일 정의 (2-1) — 조건은 우선목록 위 필터. sos·active 는 사건 상태에서 센다.
export const TOTAL_ELDERS = 200;
export const WATCH_LINKED = 186;
export const TILES = [
  { k: "all", label: "전체 관리 어르신", filter: () => true, tone: "navy" },
  { k: "ok", label: "정상", filter: () => false, tone: "ok" },
  { k: "warn", label: "주의", filter: (r) => r.sev === "warn", tone: "warn" },
  { k: "danger", label: "위험", filter: (r) => r.sev === "sev1" || r.sev === "danger", tone: "danger" },
  { k: "sos", label: "현재 SOS", filter: (r, ctx) => ctx.sosNames.has(r.name), tone: "danger" },
  { k: "fall", label: "낙상·낙상 의심", filter: (r) => r.tags.includes("fall"), tone: "warn" },
  { k: "vital", label: "건강수치 이상", filter: (r) => r.tags.includes("vital"), tone: "warn" },
  { k: "inactive", label: "장시간 무반응", filter: (r) => r.tags.includes("inactive"), tone: "warn" },
  { k: "stale", label: "건강정보 장시간 미수신", filter: (r) => r.tags.includes("stale"), tone: "device" },
  { k: "unworn", label: "워치 미착용", filter: (r) => r.tags.includes("unworn"), tone: "device" },
  { k: "battery", label: "배터리 부족", filter: (r) => r.tags.includes("battery"), tone: "device" },
  { k: "active", label: "출동·대응 중", filter: (r, ctx) => ctx.activeNames.has(r.name), tone: "info" },
];

// 정상 고객 명단 견본 — 전체 181명을 나열하지 않고 접이식으로만
export const NORMAL_SAMPLE = ["최정자", "정말자", "김영자", "이복순", "박정례", "송기수", "홍순자", "장경자"];

// 오늘의 운영업무 · 시스템 연동상태 (시안 하단)
export const OPS_TODAY = [
  { label: "방문 예정", value: 8, unit: "건", sub: "2인 1조 월 정기방문", tone: "ok" },
  { label: "배차 미확정", value: 2, unit: "건", sub: "컨시어지 배정 필요", tone: "warn" },
  { label: "보고서 검수", value: 5, unit: "건", sub: "보호자 발송 전 확인", tone: "ok" },
];
export const SYSTEMS = [
  { name: "삼성헬스·갤럭시워치 API", state: "ok", checkAgoSec: 12, sub: "동기화 평균 8초" },
  { name: "mmWave 센서 게이트웨이", state: "ok", checkAgoSec: 20, sub: "게이트웨이 198/200 응답" },
  { name: "문자·앱 푸시 발송", state: "ok", checkAgoSec: 41, sub: "발송 지연 없음" },
];
export const SYSTEM_STATE = { ok: { label: "정상", tone: "ok" }, delayed: { label: "지연", tone: "warn" }, down: { label: "장애", tone: "danger" } };

// 3절 실시간 건강정보 — 값마다 측정 시각(초 전)과 수신 상태를 따로 둔다
const HEALTH = {
  김순자: {
    hr: { v: 132, unit: "bpm", agoSec: 12, feed: "live", tone: "danger" }, restHr: { v: 71, unit: "bpm", agoSec: 3600, feed: "live" },
    spo2: { v: 95, unit: "%", agoSec: 12, feed: "live" }, stress: { v: "높음 (68)", agoSec: 300, feed: "live", tone: "warn" },
    activity: { v: "낮음 · 활동 12분 · 96 kcal", agoSec: 600, feed: "live" }, steps: { v: "1,240 보", agoSec: 600, feed: "live" },
    sleep: { v: "6시간 10분 (어젯밤) · 깊은 잠 48분", agoSec: 36000, feed: "live" }, fall: { v: "감지 없음", agoSec: 12, feed: "live" },
    sosBtn: { v: "작동 없음", agoSec: 12, feed: "live" }, location: { v: "강남구 대치동 자택 (실시간 · 정확도 9m)", agoSec: 20, feed: "live" },
    worn: { v: "착용 중", agoSec: 12, feed: "live" }, battery: { v: "68%", agoSec: 12, feed: "live" },
    comm: { v: "휴대전화 블루투스 연결 · 삼성헬스 동기화 정상", agoSec: 12, feed: "live" }, lastRx: { agoSec: 12, feed: "live" },
    base: { hr: 74, spo2: 96, steps: 2600 },
  },
  박말순: {
    hr: { v: 91, unit: "bpm", agoSec: 42, feed: "live", tone: "warn" }, restHr: { v: 68, unit: "bpm", agoSec: 3600, feed: "live" },
    spo2: { v: 94, unit: "%", agoSec: 42, feed: "live" }, stress: { v: "측정 불가 (무동작)", agoSec: 42, feed: "live" },
    activity: { v: "낙상 후 활동 없음", agoSec: 42, feed: "live", tone: "danger" }, steps: { v: "2,110 보", agoSec: 42, feed: "live" },
    sleep: { v: "7시간 20분 (어젯밤)", agoSec: 36000, feed: "live" }, fall: { v: "낙상 감지 · 무동작 2분 18초", agoSec: 252, feed: "live", tone: "danger" },
    sosBtn: { v: "작동 없음", agoSec: 42, feed: "live" }, location: { v: "강동구 길동 OO아파트 3층 (실시간 · 정확도 12m)", agoSec: 42, feed: "live" },
    worn: { v: "착용 중", agoSec: 42, feed: "live" }, battery: { v: "54%", agoSec: 42, feed: "live" },
    comm: { v: "휴대전화 블루투스 연결 · 삼성헬스 동기화 정상", agoSec: 42, feed: "live" }, lastRx: { agoSec: 42, feed: "live" },
    base: { hr: 70, spo2: 95, steps: 2200 },
  },
  이영호: {
    hr: { v: 78, unit: "bpm", agoSec: 60, feed: "live" }, restHr: { v: 64, unit: "bpm", agoSec: 3600, feed: "live" },
    spo2: { v: 92, unit: "%", agoSec: 60, feed: "live", tone: "warn" }, stress: { v: "보통 (41)", agoSec: 300, feed: "live" },
    activity: { v: "보통 · 활동 38분 · 210 kcal", agoSec: 600, feed: "live" }, steps: { v: "3,480 보", agoSec: 600, feed: "live" },
    sleep: { v: "6시간 40분 (어젯밤)", agoSec: 36000, feed: "live" }, fall: { v: "감지 없음", agoSec: 60, feed: "live" },
    sosBtn: { v: "작동 없음", agoSec: 60, feed: "live" }, location: { v: "송파구 잠실동 자택 (실시간)", agoSec: 60, feed: "live" },
    worn: { v: "착용 중", agoSec: 60, feed: "live" }, battery: { v: "77%", agoSec: 60, feed: "live" },
    comm: { v: "휴대전화 블루투스 연결 · 삼성헬스 동기화 정상", agoSec: 60, feed: "live" }, lastRx: { agoSec: 60, feed: "live" },
    base: { hr: 72, spo2: 94, steps: 3400 },
  },
  한복자: {
    hr: { v: 78, unit: "bpm", agoSec: 22620, feed: "battery" }, restHr: { v: 66, unit: "bpm", agoSec: 25200, feed: "battery" },
    spo2: { v: 96, unit: "%", agoSec: 22620, feed: "battery" }, stress: { v: "낮음 (28)", agoSec: 22620, feed: "battery" },
    activity: { v: "오전 활동 22분", agoSec: 22620, feed: "battery" }, steps: { v: "860 보 (11:28 기준)", agoSec: 22620, feed: "battery" },
    sleep: { v: "7시간 5분 (어젯밤)", agoSec: 36000, feed: "battery" }, fall: { v: "감지 없음 (미수신)", agoSec: 22620, feed: "battery" },
    sosBtn: { v: "작동 없음 (미수신)", agoSec: 22620, feed: "battery" }, location: { v: "강동구 길동 (마지막 위치 · 미수신)", agoSec: 22620, feed: "battery" },
    worn: { v: "확인 불가", agoSec: 22620, feed: "battery" }, battery: { v: "12% (마지막) · 방전 추정", agoSec: 22620, feed: "battery", tone: "device" },
    comm: { v: "휴대전화 연결 끊김 · 삼성헬스 동기화 없음", agoSec: 22620, feed: "battery", tone: "device" }, lastRx: { agoSec: 22620, feed: "battery" },
    base: { hr: 70, spo2: 96, steps: 1900 },
  },
  강필순: {
    hr: { v: 74, unit: "bpm", agoSec: 2520, feed: "unworn" }, restHr: { v: 63, unit: "bpm", agoSec: 3600, feed: "unworn" },
    spo2: { v: 97, unit: "%", agoSec: 2520, feed: "unworn" }, stress: { v: "낮음 (25)", agoSec: 2520, feed: "unworn" },
    activity: { v: "낮음 · 활동 9분", agoSec: 2520, feed: "unworn" }, steps: { v: "640 보", agoSec: 2520, feed: "unworn" },
    sleep: { v: "8시간 (어젯밤)", agoSec: 36000, feed: "live" }, fall: { v: "감지 없음 (미착용)", agoSec: 2520, feed: "unworn" },
    sosBtn: { v: "작동 없음", agoSec: 2520, feed: "unworn" }, location: { v: "강남구 대치동 자택 (센서 · 마지막 위치)", agoSec: 2520, feed: "unworn" },
    worn: { v: "미착용 42분", agoSec: 2520, feed: "unworn", tone: "device" }, battery: { v: "88%", agoSec: 2520, feed: "unworn" },
    comm: { v: "휴대전화 연결 정상 · 워치 미착용", agoSec: 2520, feed: "unworn" }, lastRx: { agoSec: 2520, feed: "unworn" },
    base: { hr: 68, spo2: 97, steps: 1500 },
  },
};

// 간단한 결정적 난수 — 새로고침해도 같은 그래프가 나오도록 이름으로 씨앗을 만든다
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function getHealth(name) {
  if (HEALTH[name]) return HEALTH[name];
  const rnd = seeded(name);
  const hr = 62 + Math.round(rnd() * 20);
  const spo2 = 95 + Math.round(rnd() * 3);
  const battery = 40 + Math.round(rnd() * 55);
  const steps = 1200 + Math.round(rnd() * 3000);
  return {
    hr: { v: hr, unit: "bpm", agoSec: 30, feed: "live" }, restHr: { v: hr - 8, unit: "bpm", agoSec: 3600, feed: "live" },
    spo2: { v: spo2, unit: "%", agoSec: 30, feed: "live" }, stress: { v: "보통", agoSec: 300, feed: "live" },
    activity: { v: "보통", agoSec: 600, feed: "live" }, steps: { v: `${steps.toLocaleString("ko-KR")} 보`, agoSec: 600, feed: "live" },
    sleep: { v: "7시간 (어젯밤)", agoSec: 36000, feed: "live" }, fall: { v: "감지 없음", agoSec: 30, feed: "live" },
    sosBtn: { v: "작동 없음", agoSec: 30, feed: "live" }, location: { v: "자택 (실시간)", agoSec: 30, feed: "live" },
    worn: { v: "착용 중", agoSec: 30, feed: "live" }, battery: { v: `${battery}%`, agoSec: 30, feed: "live" },
    comm: { v: "휴대전화 블루투스 연결 · 삼성헬스 동기화 정상", agoSec: 30, feed: "live" }, lastRx: { agoSec: 30, feed: "live" },
    base: { hr, spo2, steps },
  };
}

// 변화 그래프 (3절) — 최근 1시간 / 오늘 / 7일 / 30일. 마지막 점이 현재값과 이어지도록 맞춘다.
export const RANGES = [
  ["1h", "최근 1시간", 12, "5분"],
  ["today", "오늘", 18, "1시간"],
  ["7d", "최근 7일", 7, "1일"],
  ["30d", "최근 30일", 30, "1일"],
];
export function getSeries(name, range) {
  const h = getHealth(name);
  const [, , n] = RANGES.find((r) => r[0] === range) || RANGES[0];
  const rnd = seeded(`${name}:${range}`);
  const hrNow = typeof h.hr.v === "number" ? h.hr.v : h.base.hr;
  const spo2Now = typeof h.spo2.v === "number" ? h.spo2.v : h.base.spo2;
  const hr = [];
  const spo2 = [];
  const steps = [];
  for (let i = 0; i < n; i++) {
    const last = i === n - 1;
    const tail = range === "1h" && i >= n - 3; // 최근 1시간은 마지막 세 점이 현재값으로 올라간다
    const t = tail ? (i - (n - 3)) / 2 : 0;
    hr.push(last ? hrNow : tail ? Math.round(h.base.hr + (hrNow - h.base.hr) * t) : Math.round(h.base.hr + (rnd() - 0.5) * 14));
    spo2.push(last ? spo2Now : tail ? Math.round(h.base.spo2 + (spo2Now - h.base.spo2) * t) : Math.round(h.base.spo2 + (rnd() - 0.5) * 3));
    steps.push(range === "1h" ? Math.round(rnd() * 180) : Math.round(h.base.steps * (0.6 + rnd() * 0.7) / (range === "today" ? 8 : 1)));
  }
  return { hr, spo2, steps };
}

// 6-5 파견 가능 컨시어지 — 고객 권역별 거리(km). 도착 예상은 도보·대중교통 기준 km당 4분, 차량은 2.6분.
export const DISPATCH_POOL = [
  { name: "정민호", role: "주 담당 · 요양보호사", home: "강동", where: "강동구 길동 · 방문 종료 후 이동 중", car: false, emergency: true, two: false, dist: { 강동: 1.8, 송파: 4.6, 강남: 9.1, 서초: 12.4 } },
  { name: "윤세라", role: "주 담당", home: "강동", where: "강동구 천호동 · 사무실 대기", car: false, emergency: true, two: true, dist: { 강동: 2.4, 송파: 5.1, 강남: 9.8, 서초: 13.0 } },
  { name: "이수민", role: "주 담당", home: "송파", where: "송파구 잠실동 · 방문 중 (18:00 종료)", car: false, emergency: false, two: false, dist: { 송파: 1.2, 강동: 4.9, 강남: 6.0, 서초: 9.2 } },
  { name: "서다인", role: "주·부 담당 · 차량 보유", home: "강남", where: "강남구 역삼동 · 이동 중", car: true, emergency: true, two: true, dist: { 강남: 1.6, 서초: 3.2, 송파: 6.4, 강동: 9.5 } },
  { name: "박지현", role: "주 담당 · 간호사 14년", home: "강남", where: "강남구 대치동 · 방문 중 (18:30 종료)", car: false, emergency: false, two: false, dist: { 강남: 0.9, 서초: 4.1, 송파: 7.2, 강동: 10.3 } },
  { name: "오하늘", role: "부 담당", home: "강남", where: "강남구 삼성동 · 사무실 대기", car: false, emergency: true, two: true, dist: { 강남: 2.2, 서초: 4.8, 송파: 6.9, 강동: 10.1 } },
  { name: "한서연", role: "주 담당", home: "서초", where: "서초구 방배동 · 사무실 대기", car: false, emergency: true, two: false, dist: { 서초: 1.4, 강남: 3.9, 송파: 9.8, 강동: 13.6 } },
];
export function districtKey(district = "") {
  return ["강동", "송파", "강남", "서초"].find((k) => district.startsWith(k)) || "강남";
}
export function dispatchCandidates(district) {
  const k = districtKey(district);
  return DISPATCH_POOL.map((c) => {
    const dist = c.dist[k] ?? 9.9;
    return { ...c, distKm: dist, etaMin: Math.max(3, Math.round(dist * (c.car ? 2.6 : 4))) };
  }).sort((a, b) => (a.emergency === b.emergency ? a.distKm - b.distKm : a.emergency ? -1 : 1));
}
