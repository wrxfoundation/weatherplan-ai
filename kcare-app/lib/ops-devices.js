// 웨어러블·센서 관리 목 데이터 — 요청서 10절 · 시안 "웨어러블·센서 관리".
// 수신 이상은 "미수신" 하나로 뭉개지 않고 8가지 원인으로 나눈다. 시각은 지금 기준 상대값.

export const CAUSES = {
  unworn: { label: "워치 미착용", tone: "device" },
  battery: { label: "배터리 방전", tone: "device" },
  phone: { label: "휴대전화 연결 끊김", tone: "warn" },
  perm: { label: "앱 권한 해제", tone: "warn" },
  sync: { label: "삼성헬스 동기화 지연", tone: "warn" },
  api: { label: "서버·API 장애", tone: "info" },
  sensor_off: { label: "센서 전원 꺼짐", tone: "device" },
  net: { label: "공유기·인터넷 장애", tone: "info" },
};
export const CAUSE_KEYS = Object.keys(CAUSES);

// 행 상태 — 위험은 실제 건강 위험(워치 경보)에만
export const DEVICE_STATE = {
  danger: { label: "위험", tone: "danger", rank: 0 },
  check: { label: "점검", tone: "device", rank: 1 },
  warn: { label: "주의", tone: "warn", rank: 2 },
  ok: { label: "정상", tone: "ok", rank: 3 },
};

export const FLEET = { households: 200, fitRegistered: 200, sensors: 620, noData: 8, needsCheck: 8, syncAgoSec: 9 };

export const DEVICE_TYPES = ["Galaxy Fit3", "mmWave 재실·낙상 센서", "도어 개폐 센서"];
export const PLACES = ["거실", "침실", "욕실", "주방", "현관", "복도"];

const watch = (id, over = {}) => ({ type: "Galaxy Fit3", model: "SM-R390", id, registered: "2025-05-12", battery: 68, firmware: "R390XXU1BXH3", comm: "블루투스 · 휴대전화 연결 정상", worn: true, rxAgoSec: 5, lastCheck: "2026-09-22 06:00 자동 점검 정상", ...over });
const sensor = (slot, place, id, over = {}) => ({ slot, place, type: "mmWave 재실·낙상 센서", model: "KMW-60G", id, registered: "2025-05-12", power: "유선 전원", online: true, rxAgoSec: 20, firmware: "1.4.2", lastCheck: "2026-09-22 06:00 자동 점검 정상", ...over });

export const DEVICES = [
  {
    name: "김순자", age: 78, district: "강남", concierge: "박지현", status: "danger", summary: "심박수 기준 초과", cause: null, rxAgoMin: 0.1,
    watch: watch("KCF-240031", { battery: 68, rxAgoSec: 5 }),
    sensors: [sensor(1, "거실", "KMW-1101"), sensor(2, "욕실", "KMW-1102", { rxAgoSec: 95 })],
    realtime: { hr: { v: 132, unit: "bpm", note: "기준 초과", tone: "danger", agoSec: 5 }, spo2: { v: 95, unit: "%", note: "정상", tone: "ok", agoSec: 5 }, resp: { v: 16, unit: "회/분", note: "참고값", tone: "info", agoSec: 20 }, motion: { v: "감지", place: "거실", note: "12초 전", tone: "ok", agoSec: 12 } },
    diagnosis: "심박수 130 bpm 이상 2분 지속 — 개별 위험 기준 120 bpm 적용 중",
    timeline: [
      { agoSec: 14, src: "워치", text: "심박수 132 bpm 감지", tone: "danger" },
      { agoSec: 112, src: "욕실 센서", text: "재실 감지 종료", tone: "ok" },
      { agoSec: 185, src: "거실 센서", text: "움직임 감지", tone: "ok" },
      { agoSec: 328, src: "워치", text: "심박수 128 bpm · 1차 경고", tone: "warn" },
      { agoSec: 900, src: "워치", text: "걸음 84보 · 활동 감지", tone: "ok" },
      { agoSec: 3600, src: "워치", text: "삼성헬스 동기화 정상 (배터리 70%)", tone: "ok" },
    ],
    faults: [
      { at: "2026-07-14 09:20", device: "KMW-1102 (욕실 센서)", cause: "net", desc: "공유기 재부팅 후 12분 오프라인", action: "자동 재접속 확인", state: "해결" },
      { at: "2026-05-30 21:05", device: "KCF-240031 (Fit3)", cause: "sync", desc: "삼성헬스 동기화 3시간 지연", action: "앱 재로그인 안내 (컨시어지 방문)", state: "해결" },
    ],
    swaps: [
      { at: "2025-05-12", device: "KCF-240031", type: "신규 등록", from: "—", to: "Galaxy Fit3", reason: "서비스 개시", by: "박지현" },
      { at: "2025-05-12", device: "KMW-1101 · KMW-1102", type: "신규 등록", from: "—", to: "mmWave 2대 (거실·욕실)", reason: "서비스 개시", by: "박지현" },
    ],
  },
  {
    name: "박말순", age: 83, district: "강동", concierge: "윤세라", status: "danger", summary: "낙상 감지 · 무동작", cause: null, rxAgoMin: 0.7,
    watch: watch("KCF-251020", { registered: "2025-10-20", battery: 54, rxAgoSec: 42 }),
    sensors: [sensor(1, "거실", "KMW-3301", { registered: "2025-10-20" }), sensor(2, "침실", "KMW-3302", { registered: "2025-10-20" }), sensor(3, "욕실", "KMW-3303", { registered: "2025-10-20" }), sensor(4, "현관", "KMW-3304", { registered: "2025-10-20", type: "도어 개폐 센서", model: "KDR-10", power: "배터리 (92%)" })],
    realtime: { hr: { v: 91, unit: "bpm", note: "상승", tone: "warn", agoSec: 42 }, spo2: { v: 94, unit: "%", note: "정상", tone: "ok", agoSec: 42 }, resp: { v: 18, unit: "회/분", note: "참고값", tone: "info", agoSec: 40 }, motion: { v: "없음", place: "거실", note: "2분 18초", tone: "danger", agoSec: 138 } },
    diagnosis: "낙상 감지 후 30초 이상 무동작 — SEV1 사건 진행 중",
    timeline: [
      { agoSec: 60, src: "거실 센서", text: "움직임 없음 지속 (사건에 병합)", tone: "danger" },
      { agoSec: 252, src: "워치", text: "낙상 감지 (충격 센서)", tone: "danger" },
      { agoSec: 300, src: "거실 센서", text: "재실 감지 · 이동", tone: "ok" },
      { agoSec: 360, src: "워치", text: "걸음 감지 · 심박 84 bpm", tone: "ok" },
      { agoSec: 5400, src: "현관 센서", text: "현관문 열림·닫힘 (외출 복귀)", tone: "ok" },
    ],
    faults: [{ at: "2026-08-03 07:40", device: "KMW-3303 (욕실 센서)", cause: "sensor_off", desc: "청소 중 전원 분리 · 55분 오프라인", action: "보호자 안내 · 전원 복구", state: "해결" }],
    swaps: [{ at: "2025-10-20", device: "KCF-251020 · KMW-3301~3304", type: "신규 등록", from: "—", to: "Fit3 + 센서 4대", reason: "서비스 개시 (2등급 · 청각장애 → 센서 강화)", by: "윤세라" }],
  },
  {
    name: "이영호", age: 81, district: "송파", concierge: "이수민", status: "ok", summary: "정상 수신", cause: null, rxAgoMin: 1,
    watch: watch("KCF-260729", { registered: "2026-07-29", battery: 77, rxAgoSec: 60 }),
    sensors: [sensor(1, "거실", "KMW-4401", { registered: "2026-07-29" })],
    realtime: { hr: { v: 78, unit: "bpm", note: "정상", tone: "ok", agoSec: 60 }, spo2: { v: 92, unit: "%", note: "주의", tone: "warn", agoSec: 60 }, resp: { v: 17, unit: "회/분", note: "참고값", tone: "info", agoSec: 30 }, motion: { v: "감지", place: "거실", note: "30초 전", tone: "ok", agoSec: 30 } },
    diagnosis: null,
    timeline: [{ agoSec: 60, src: "워치", text: "혈중산소 92% · 주의 (개별 기준 92% 이하)", tone: "warn" }, { agoSec: 840, src: "워치", text: "혈중산소 93% · 주의", tone: "warn" }, { agoSec: 1500, src: "거실 센서", text: "재실 감지", tone: "ok" }],
    faults: [],
    swaps: [{ at: "2026-07-29", device: "KCF-260729", type: "신규 등록", from: "—", to: "Galaxy Fit3", reason: "서비스 개시", by: "이수민" }],
  },
  {
    name: "한복자", age: 79, district: "강동", concierge: "정민호", status: "check", summary: "배터리 방전 추정 · 6시간 17분 미수신", cause: "battery", rxAgoMin: 377,
    watch: watch("KCF-250818", { registered: "2025-08-18", battery: 12, rxAgoSec: 22620, worn: null, comm: "휴대전화 연결 끊김 (마지막 11:28)", lastCheck: "2026-09-22 06:00 자동 점검 — 배터리 31%" }),
    sensors: [],
    realtime: { hr: { v: 78, unit: "bpm", note: "미수신", tone: "device", agoSec: 22620 }, spo2: { v: 96, unit: "%", note: "미수신", tone: "device", agoSec: 22620 }, resp: { v: "—", unit: "", note: "센서 없음", tone: "muted", agoSec: null }, motion: { v: "—", place: "센서 없음", note: "설치 필요", tone: "muted", agoSec: null } },
    diagnosis: "마지막 수신 시 배터리 12% → 방전 추정. 보호자 충전 안내 · 미회신 시 컨시어지 방문",
    timeline: [{ agoSec: 22620, src: "워치", text: "마지막 수신 · 배터리 12% · 심박 78 bpm", tone: "device" }, { agoSec: 24000, src: "워치", text: "배터리 15% 부족 알림 → 보호자 앱 푸시", tone: "warn" }, { agoSec: 36000, src: "워치", text: "수면 7시간 5분 기록", tone: "ok" }],
    faults: [{ at: "2026-09-22 13:30", device: "KCF-250818 (Fit3)", cause: "battery", desc: "2시간 미수신 · 배터리 방전 추정", action: "보호자 한준호 충전 안내 문자 (13:31)", state: "진행 중" }, { at: "2026-06-11 19:10", device: "KCF-250818 (Fit3)", cause: "perm", desc: "앱 업데이트 후 건강 데이터 권한 해제", action: "컨시어지 방문 · 권한 재설정", state: "해결" }],
    swaps: [{ at: "2025-08-18", device: "KCF-250818", type: "신규 등록", from: "—", to: "Galaxy Fit3", reason: "서비스 개시", by: "정민호" }],
  },
  {
    name: "오태식", age: 80, district: "서초", concierge: "한서연", status: "check", summary: "욕실 센서 오프라인 (전원 꺼짐)", cause: "sensor_off", rxAgoMin: 4,
    watch: watch("KCF-251215", { registered: "2025-12-15", battery: 61, rxAgoSec: 18 }),
    sensors: [sensor(1, "거실", "KMW-5501", { registered: "2025-12-15" }), sensor(2, "침실", "KMW-5502", { registered: "2025-12-15" }), sensor(3, "욕실", "KMW-5503", { registered: "2025-12-15", online: false, rxAgoSec: 240, lastCheck: "응답 없음 — 전원 확인 필요" }), sensor(4, "주방", "KMW-5504", { registered: "2026-02-10" }), sensor(5, "현관", "KMW-5505", { registered: "2026-02-10", type: "도어 개폐 센서", model: "KDR-10", power: "배터리 (77%)" }), sensor(6, "복도", "KMW-5506", { registered: "2026-02-10" })],
    realtime: { hr: { v: 71, unit: "bpm", note: "정상", tone: "ok", agoSec: 18 }, spo2: { v: 97, unit: "%", note: "정상", tone: "ok", agoSec: 18 }, resp: { v: 15, unit: "회/분", note: "참고값", tone: "info", agoSec: 25 }, motion: { v: "감지", place: "거실", note: "25초 전", tone: "ok", agoSec: 25 } },
    diagnosis: "욕실 센서 4분 응답 없음 — 전원 꺼짐 추정 (워치·다른 센서는 정상)",
    timeline: [{ agoSec: 240, src: "욕실 센서", text: "응답 없음 시작 (전원 꺼짐 추정)", tone: "device" }, { agoSec: 900, src: "욕실 센서", text: "재실 감지 종료", tone: "ok" }, { agoSec: 1500, src: "워치", text: "걸음 120보", tone: "ok" }],
    faults: [{ at: "2026-09-22 17:41", device: "KMW-5503 (욕실 센서)", cause: "sensor_off", desc: "응답 없음 · 전원 꺼짐 추정", action: "컨시어지 한서연 점검 배정", state: "진행 중" }],
    swaps: [{ at: "2026-02-10", device: "KMW-5504~5506", type: "신규 등록", from: "—", to: "센서 3대 추가 (주방·현관·복도)", reason: "인지지원등급 → 동선 감지 강화", by: "한서연" }, { at: "2025-12-15", device: "KCF-251215 · KMW-5501~5503", type: "신규 등록", from: "—", to: "Fit3 + 센서 3대", reason: "서비스 개시", by: "한서연" }],
  },
  {
    name: "최정자", age: 75, district: "강남", concierge: "서다인", status: "ok", summary: "정상 수신", cause: null, rxAgoMin: 0.5,
    watch: watch("KCF-260706", { registered: "2026-07-06", battery: 83, rxAgoSec: 30 }),
    sensors: [sensor(1, "거실", "KMW-6601", { registered: "2026-07-06" }), sensor(2, "침실", "KMW-6602", { registered: "2026-07-06" })],
    realtime: { hr: { v: 69, unit: "bpm", note: "정상", tone: "ok", agoSec: 30 }, spo2: { v: 97, unit: "%", note: "정상", tone: "ok", agoSec: 30 }, resp: { v: 15, unit: "회/분", note: "참고값", tone: "info", agoSec: 20 }, motion: { v: "감지", place: "침실", note: "20초 전", tone: "ok", agoSec: 20 } },
    diagnosis: null,
    timeline: [{ agoSec: 20, src: "침실 센서", text: "재실 감지", tone: "ok" }, { agoSec: 1200, src: "워치", text: "걸음 260보", tone: "ok" }],
    faults: [],
    swaps: [{ at: "2026-07-06", device: "KCF-260706 · KMW-6601~6602", type: "신규 등록", from: "—", to: "Fit3 + 센서 2대", reason: "서비스 개시", by: "서다인" }],
  },
  {
    name: "강필순", age: 82, district: "강남", concierge: "서다인", status: "check", summary: "미착용 추정 42분", cause: "unworn", rxAgoMin: 42,
    watch: watch("KCF-250702", { registered: "2025-07-02", battery: 88, rxAgoSec: 2520, worn: false, comm: "휴대전화 연결 정상 · 워치 미착용" }),
    sensors: [sensor(1, "거실", "KMW-7701", { registered: "2025-07-02" }), sensor(2, "침실", "KMW-7702", { registered: "2025-07-02" }), sensor(3, "욕실", "KMW-7703", { registered: "2025-07-02" })],
    realtime: { hr: { v: 74, unit: "bpm", note: "미착용", tone: "device", agoSec: 2520 }, spo2: { v: 97, unit: "%", note: "미착용", tone: "device", agoSec: 2520 }, resp: { v: 14, unit: "회/분", note: "참고값", tone: "info", agoSec: 9600 }, motion: { v: "없음", place: "거실", note: "2시간 40분", tone: "warn", agoSec: 9600 } },
    diagnosis: "워치 미착용 42분 + 거실 움직임 없음 2시간 40분 — 안부 콜 대상",
    timeline: [{ agoSec: 2520, src: "워치", text: "착용 해제 감지 (충전 거치 추정)", tone: "device" }, { agoSec: 9600, src: "거실 센서", text: "마지막 움직임 감지", tone: "ok" }, { agoSec: 10800, src: "워치", text: "심박 68 bpm 정상", tone: "ok" }],
    faults: [{ at: "2026-09-01 10:10", device: "KCF-250702 (Fit3)", cause: "unworn", desc: "3시간 미착용 (시각장애 · 스트랩 착용 어려움)", action: "매직 스트랩 교체 안내", state: "해결" }],
    swaps: [{ at: "2026-09-03", device: "KCF-250702", type: "교체", from: "기본 스트랩", to: "매직 스트랩 (착용 보조)", reason: "시각장애 · 착용 어려움", by: "서다인" }, { at: "2025-07-02", device: "KCF-250702 · KMW-7701~7703", type: "신규 등록", from: "—", to: "Fit3 + 센서 3대", reason: "서비스 개시", by: "박지현" }],
  },
  {
    name: "배정순", age: 79, district: "강남", concierge: "오하늘", status: "warn", summary: "워치 배터리 15%", cause: null, rxAgoMin: 1,
    watch: watch("KCF-260115", { registered: "2026-01-15", battery: 15, rxAgoSec: 60 }),
    sensors: [sensor(1, "거실", "KMW-8801", { registered: "2026-01-15" })],
    realtime: { hr: { v: 72, unit: "bpm", note: "정상", tone: "ok", agoSec: 60 }, spo2: { v: 96, unit: "%", note: "정상", tone: "ok", agoSec: 60 }, resp: { v: 16, unit: "회/분", note: "참고값", tone: "info", agoSec: 40 }, motion: { v: "감지", place: "거실", note: "40초 전", tone: "ok", agoSec: 40 } },
    diagnosis: "배터리 15% — 방전 전 충전 안내 (보호자 앱 푸시 발송)",
    timeline: [{ agoSec: 900, src: "워치", text: "배터리 15% 부족 알림 → 보호자 앱 푸시", tone: "warn" }, { agoSec: 40, src: "거실 센서", text: "재실 감지", tone: "ok" }],
    faults: [],
    swaps: [{ at: "2026-01-15", device: "KCF-260115 · KMW-8801", type: "신규 등록", from: "—", to: "Fit3 + 센서 1대", reason: "서비스 개시", by: "오하늘" }],
  },
  {
    name: "정옥분", age: 80, district: "강남", concierge: "박지현", status: "check", summary: "삼성헬스 동기화 지연 7시간", cause: "sync", rxAgoMin: 425,
    watch: watch("KCF-251103", { registered: "2025-11-03", battery: 66, rxAgoSec: 25500, comm: "휴대전화 연결 정상 · 삼성헬스 동기화 지연" }),
    sensors: [sensor(1, "거실", "KMW-9901", { registered: "2025-11-03" }), sensor(2, "침실", "KMW-9902", { registered: "2025-11-03" })],
    realtime: { hr: { v: 72, unit: "bpm", note: "동기화 지연", tone: "device", agoSec: 25500 }, spo2: { v: 96, unit: "%", note: "동기화 지연", tone: "device", agoSec: 25500 }, resp: { v: 15, unit: "회/분", note: "참고값", tone: "info", agoSec: 60 }, motion: { v: "감지", place: "거실", note: "1분 전", tone: "ok", agoSec: 60 } },
    diagnosis: "센서는 정상 수신 — 워치 데이터만 삼성헬스 동기화 지연. 앱 백그라운드 제한 확인",
    timeline: [{ agoSec: 60, src: "거실 센서", text: "재실 감지 (센서 정상)", tone: "ok" }, { agoSec: 25500, src: "워치", text: "마지막 동기화 · 배터리 66%", tone: "device" }],
    faults: [{ at: "2026-09-22 12:40", device: "KCF-251103 (Fit3)", cause: "sync", desc: "삼성헬스 동기화 2시간 지연 시작", action: "보호자 앱 재실행 안내", state: "진행 중" }],
    swaps: [{ at: "2025-11-03", device: "KCF-251103 · KMW-9901~9902", type: "신규 등록", from: "—", to: "Fit3 + 센서 2대", reason: "서비스 개시", by: "박지현" }],
  },
  {
    name: "유상철", age: 84, district: "서초", concierge: "한서연", status: "check", summary: "휴대전화 연결 끊김 6시간 30분", cause: "phone", rxAgoMin: 390,
    watch: watch("KCF-250420", { registered: "2025-04-20", battery: 58, rxAgoSec: 23400, comm: "휴대전화 연결 끊김 (블루투스)", firmware: "R390XXU1BXG2" }),
    sensors: [sensor(1, "거실", "KMW-1201", { registered: "2025-04-20" })],
    realtime: { hr: { v: 69, unit: "bpm", note: "미수신", tone: "device", agoSec: 23400 }, spo2: { v: 96, unit: "%", note: "미수신", tone: "device", agoSec: 23400 }, resp: { v: 16, unit: "회/분", note: "참고값", tone: "info", agoSec: 45 }, motion: { v: "감지", place: "거실", note: "45초 전", tone: "ok", agoSec: 45 } },
    diagnosis: "휴대전화 전원·블루투스 확인 필요 — 센서는 정상이라 생활반응은 확인됨",
    timeline: [{ agoSec: 45, src: "거실 센서", text: "재실 감지 (센서 정상)", tone: "ok" }, { agoSec: 23400, src: "워치", text: "휴대전화 연결 끊김 · 마지막 수신", tone: "device" }],
    faults: [{ at: "2026-09-22 11:15", device: "KCF-250420 (Fit3)", cause: "phone", desc: "휴대전화 블루투스 연결 끊김", action: "안부 콜 연결됨 · 휴대전화 재부팅 안내", state: "진행 중" }, { at: "2026-03-02 15:00", device: "KCF-250420 (Fit3)", cause: "api", desc: "삼성헬스 API 장애 (전체 · 40분)", action: "자동 복구", state: "해결" }],
    swaps: [{ at: "2026-04-11", device: "KCF-250420", type: "교체", from: "KCF-250419 (충전 단자 불량)", to: "KCF-250420", reason: "충전 불량 → 회수 후 교체", by: "한서연" }, { at: "2025-04-20", device: "KCF-250419 · KMW-1201", type: "신규 등록", from: "—", to: "Fit3 + 센서 1대", reason: "서비스 개시", by: "한서연" }],
  },
  {
    name: "안분이", age: 79, district: "강동", concierge: "정민호", status: "check", summary: "거실 센서 전원 꺼짐 25분", cause: "sensor_off", rxAgoMin: 0.5,
    watch: watch("KCF-260305", { registered: "2026-03-05", battery: 72, rxAgoSec: 30 }),
    sensors: [sensor(1, "거실", "KMW-1301", { registered: "2026-03-05", online: false, rxAgoSec: 1500, lastCheck: "응답 없음 — 전원 확인 필요" }), sensor(2, "침실", "KMW-1302", { registered: "2026-03-05" })],
    realtime: { hr: { v: 70, unit: "bpm", note: "정상", tone: "ok", agoSec: 30 }, spo2: { v: 97, unit: "%", note: "정상", tone: "ok", agoSec: 30 }, resp: { v: "—", unit: "", note: "거실 센서 꺼짐", tone: "device", agoSec: 1500 }, motion: { v: "감지", place: "침실", note: "1분 전", tone: "ok", agoSec: 60 } },
    diagnosis: "거실 센서 응답 없음 25분 · 침실 센서·워치 정상 — 전원 플러그 확인 요청",
    timeline: [{ agoSec: 60, src: "침실 센서", text: "재실 감지", tone: "ok" }, { agoSec: 1500, src: "거실 센서", text: "응답 없음 시작", tone: "device" }],
    faults: [{ at: "2026-09-22 17:20", device: "KMW-1301 (거실 센서)", cause: "sensor_off", desc: "응답 없음 · 전원 꺼짐 추정", action: "보호자 전원 확인 요청 문자", state: "진행 중" }],
    swaps: [{ at: "2026-03-05", device: "KCF-260305 · KMW-1301~1302", type: "신규 등록", from: "—", to: "Fit3 + 센서 2대", reason: "서비스 개시", by: "정민호" }],
  },
];

export function sortDevices(list) {
  return [...list].sort((a, b) => {
    const r = DEVICE_STATE[a.status].rank - DEVICE_STATE[b.status].rank;
    return r !== 0 ? r : a.rxAgoMin - b.rxAgoMin;
  });
}
