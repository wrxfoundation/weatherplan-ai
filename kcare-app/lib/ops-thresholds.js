// 경보 임계값 설정 목 데이터 — 요청서 4절 · 시안 "관제기준 설정".
// 요청서의 12개 측정항목을 전부 담고, 항목마다 정상·주의·위험·지속·반복·시간대·대상·알림·자동 SOS·사용 여부를 둔다.

export const POLICY = { name: "K-CARE 표준 관제기준", version: "v2.4", state: "적용 중", scope: "전체 고객 300명", updatedAt: "2026-09-15 18:20", updatedBy: "이수정" };

export const CATEGORIES = [
  { k: "vital", label: "생체정보", sub: "심박수 · 산소포화도", tone: "danger" },
  { k: "fall", label: "낙상·충격", sub: "Fit · 센서 복합판정", tone: "warn" },
  { k: "inactive", label: "무감지·생활", sub: "mmWave · 음성 · 통화", tone: "device" },
  { k: "geo", label: "위치·안심구역", sub: "GPS · 이탈시간", tone: "info" },
  { k: "sleep", label: "수면·활동", sub: "수면 · 걸음 · 변화율", tone: "ok" },
  { k: "device", label: "장비·통신", sub: "배터리 · 미수신 · 오프라인", tone: "muted" },
  { k: "response", label: "알림·대응 절차", sub: "팝업 · 콜 · 보호자 · 119", tone: "navy" },
];

export const ACTIONS = ["강조+팝업", "팝업+소리", "강조+팝업+소리", "알림 생성", "알림 생성+안부 콜", "팝업+보호자 알림", "알림 생성+보호자 알림", "알림 생성+점검 배정", "알림 생성+어르신 워치 알림"];
export const WINDOWS = ["24시간", "06:00~23:00", "07:00~22:00", "22:00~06:00 (야간)", "24시간 (야간 강화 22:00~06:00)"];
export const SCOPES = ["전체 기본값", "고객별 개별값"];

export const RULES = [
  { id: "hr-high", cat: "vital", name: "심박수 상한", normal: "60~100 bpm", warn: "110 bpm 이상", danger: "130 bpm 이상", duration: "2분 지속", repeat: "—", window: "24시간", scope: "전체 (개별 1명)", action: "강조+팝업", autoSos: true, on: true },
  { id: "hr-low", cat: "vital", name: "심박수 하한", normal: "60~100 bpm", warn: "55 bpm 이하", danger: "45 bpm 이하", duration: "2분 지속", repeat: "—", window: "24시간", scope: "전체", action: "강조+팝업", autoSos: true, on: true },
  { id: "spo2-low", cat: "vital", name: "혈중산소 하한", normal: "95% 이상", warn: "93% 이하", danger: "90% 이하", duration: "1분 지속", repeat: "1시간 내 3회", window: "24시간", scope: "전체 (개별 1명)", action: "팝업+소리", autoSos: true, on: true },
  { id: "rest-hr", cat: "vital", name: "안정시 심박 급변", normal: "평소 ±15%", warn: "평소 대비 25%", danger: "평소 대비 40%", duration: "5분 내 변화", repeat: "—", window: "24시간", scope: "전체", action: "알림 생성", autoSos: false, on: true },
  { id: "fall", cat: "fall", name: "낙상 감지", normal: "—", warn: "낙상 감지 후 즉시 움직임 회복", danger: "낙상 감지 후 30초 무동작", duration: "30초", repeat: "—", window: "24시간", scope: "전체", action: "강조+팝업+소리", autoSos: true, on: true },
  { id: "sos-btn", cat: "fall", name: "SOS 버튼 작동", normal: "—", warn: "—", danger: "버튼 3초 길게 1회", duration: "즉시", repeat: "—", window: "24시간", scope: "전체", action: "강조+팝업+소리", autoSos: true, on: true },
  { id: "impact", cat: "fall", name: "강한 충격 감지 (센서 복합)", normal: "—", warn: "충격 1회", danger: "충격 후 60초 무동작", duration: "60초", repeat: "—", window: "24시간", scope: "전체", action: "강조+팝업", autoSos: true, on: true },
  { id: "no-motion", cat: "inactive", name: "일정 시간 이상 움직임 없음", normal: "2시간 이내 움직임", warn: "2시간", danger: "4시간", duration: "연속", repeat: "—", window: "06:00~23:00", scope: "전체 (개별 1명)", action: "알림 생성+안부 콜", autoSos: true, on: true },
  { id: "no-response", cat: "inactive", name: "음성답장·전화·동작감지 모두 없음", normal: "1시간 내 반응", warn: "1시간", danger: "2시간", duration: "연속", repeat: "—", window: "24시간", scope: "전체", action: "강조+팝업", autoSos: true, on: true },
  { id: "bath", cat: "inactive", name: "욕실 장시간 체류", normal: "30분 이내", warn: "40분", danger: "60분", duration: "연속", repeat: "—", window: "24시간", scope: "전체", action: "알림 생성+안부 콜", autoSos: false, on: true },
  { id: "geo-out", cat: "geo", name: "안심구역 이탈", normal: "구역 내", warn: "이탈 30분", danger: "이탈 2시간 (야간 30분)", duration: "연속", repeat: "—", window: "24시간 (야간 강화 22:00~06:00)", scope: "전체", action: "팝업+보호자 알림", autoSos: false, on: true },
  { id: "geo-stale", cat: "geo", name: "위치 미수신", normal: "10분 내 갱신", warn: "1시간", danger: "6시간", duration: "연속", repeat: "—", window: "24시간", scope: "전체", action: "알림 생성", autoSos: false, on: true },
  { id: "activity-drop", cat: "sleep", name: "활동량 급감", normal: "7일 평균 ±30%", warn: "7일 평균 대비 -60%", danger: "7일 평균 대비 -80%", duration: "당일 18시 기준", repeat: "2일 연속", window: "—", action: "알림 생성+안부 콜", scope: "전체", autoSos: false, on: true },
  { id: "sleep-drop", cat: "sleep", name: "수면시간 급감", normal: "평소 ±20%", warn: "평소 대비 -40%", danger: "평소 대비 -60%", duration: "1일", repeat: "2일 연속", window: "—", scope: "전체", action: "알림 생성", autoSos: false, on: true },
  { id: "sleep-up", cat: "sleep", name: "수면시간 급증", normal: "평소 ±20%", warn: "평소 대비 +50%", danger: "평소 대비 +80%", duration: "1일", repeat: "2일 연속", window: "—", scope: "전체", action: "알림 생성", autoSos: false, on: true },
  { id: "unworn", cat: "device", name: "워치 미착용 시간", normal: "착용 중", warn: "1시간", danger: "3시간", duration: "연속", repeat: "—", window: "07:00~22:00", scope: "전체", action: "알림 생성+어르신 워치 알림", autoSos: false, on: true },
  { id: "stale", cat: "device", name: "건강정보 미수신 시간", normal: "10분 내 수신", warn: "2시간", danger: "6시간", duration: "연속", repeat: "—", window: "24시간", scope: "전체", action: "알림 생성+점검 배정", autoSos: false, on: true },
  { id: "battery", cat: "device", name: "워치·센서 배터리 부족", normal: "30% 이상", warn: "20% 이하", danger: "10% 이하", duration: "즉시", repeat: "—", window: "24시간", scope: "전체", action: "알림 생성+보호자 알림", autoSos: false, on: true },
  { id: "sensor-off", cat: "device", name: "센서 또는 통신 끊김", normal: "응답 정상", warn: "응답 없음 10분", danger: "응답 없음 60분", duration: "연속", repeat: "—", window: "24시간", scope: "전체", action: "알림 생성+점검 배정", autoSos: false, on: true },
  { id: "phone-link", cat: "device", name: "휴대전화 연결 끊김", normal: "연결 정상", warn: "30분", danger: "3시간", duration: "연속", repeat: "—", window: "24시간", scope: "전체", action: "알림 생성", autoSos: false, on: false },
];

// 위험 경보 발생 시 자동 대응 6단계 (시안)
export const RESPONSE_STEPS = [
  { n: 1, title: "고객 강조", sub: "즉시", tone: "danger" },
  { n: 2, title: "관제 팝업", sub: "즉시", tone: "danger" },
  { n: 3, title: "고객 3회 콜", sub: "3분 내", tone: "warn" },
  { n: 4, title: "보호자 알림·콜", sub: "미연결 시", tone: "device" },
  { n: 5, title: "119 신고", sub: "필요 시", tone: "info" },
  { n: 6, title: "현장 인력 파견", sub: "요청 시", tone: "navy" },
];

// 알림·대응 절차 카테고리의 채널 규칙
export const CHANNEL_RULES = [
  { id: "ch-popup", name: "관제 팝업", warn: "화면 강조", danger: "팝업 + 소리", note: "동일 사건 반복 알림은 병합" },
  { id: "ch-call", name: "고객 콜", warn: "안부 콜 1회", danger: "3회 콜 (3분 내)", note: "2차 미연결 시 3차 자동 활성" },
  { id: "ch-guardian", name: "보호자 알림", warn: "앱 푸시", danger: "앱 푸시 + 전화", note: "주 → 부 보호자 순" },
  { id: "ch-119", name: "119 신고", warn: "—", danger: "관제사 판단 · 전달용 요약 제공", note: "신고 후 접수번호 기록" },
  { id: "ch-dispatch", name: "현장 파견", warn: "—", danger: "최근접 컨시어지 추천", note: "관제사 승인 후 파견" },
];

// 경보 판정 안전장치 (시안)
export const SAFEGUARDS = [
  { k: "double", title: "단일값 오경보 방지", body: "연속 2회 이상 수신 시 경보 확정", on: true },
  { k: "baseline", title: "개인 기준선 반영", body: "최근 14일 평균 대비 변화율 적용", on: true },
  { k: "merge", title: "중복 경보 묶기", body: "동일 고객 5분 내 경보 1건 처리", on: true },
];

// 고객별 개별값 (4절 "기본값과 개별값 분리") — 고령자마다 기저질환·평상시 수치가 다르다
export const EXCEPTION_TOTAL = 24;
export const EXCEPTIONS = [
  { id: "ex-kim", customer: "김순자", age: 78, ruleId: "hr-high", ruleName: "심박수 상한", condition: "심부전 · 고혈압", base: "주의 110 / 위험 130 bpm", personal: "주의 105 / 위험 120 bpm", reason: "심부전으로 안정시 심박이 낮아 표준 기준으로는 늦게 감지됨 — 주치의 소견 반영", by: "이수정 (관리자)", at: "2026-08-02 10:15" },
  { id: "ex-lee", customer: "이영호", age: 81, ruleId: "spo2-low", ruleName: "혈중산소 하한", condition: "만성 폐질환", base: "주의 93% / 위험 90%", personal: "주의 92% / 위험 89%", reason: "평소 93~95% 유지 — 표준 기준으로는 주의 경보가 하루 수십 건 발생", by: "이수정 (관리자)", at: "2026-08-20 14:40" },
  { id: "ex-oh", customer: "오태식", age: 80, ruleId: "no-motion", ruleName: "일정 시간 이상 움직임 없음", condition: "경도 인지장애 · 낮잠 습관", base: "주의 2시간 / 위험 4시간", personal: "주의 3시간 / 위험 4시간 (주간만)", reason: "오후 낮잠이 2시간 30분 이상 — 야간 기준은 표준 유지", by: "이수정 (관리자)", at: "2026-09-03 09:30" },
];

// 변경 이력 (4절 감사기록) — 변경 전·후·사유·계정·일시. 덮어쓰지 않고 쌓는다.
export const HISTORY = [
  { id: "h1", at: "2026-09-15 18:20", by: "이수정 (관리자)", target: "전체 기본값", rule: "혈중산소 하한", field: "반복 횟수", before: "1시간 내 2회", after: "1시간 내 3회", reason: "단일 측정 오차로 인한 주의 경보 과다 (주 40건 → 12건 예상)", status: "승인" },
  { id: "h2", at: "2026-09-15 18:20", by: "이수정 (관리자)", target: "전체 기본값", rule: "심박수 상한", field: "지속 조건", before: "1분 지속", after: "2분 지속", reason: "계단 이동 직후 일시 상승 오경보 방지", status: "승인" },
  { id: "h3", at: "2026-09-21 16:05", by: "김태영 (관제사)", target: "전체 기본값", rule: "워치 미착용 시간", field: "주의 기준", before: "2시간", after: "1시간", reason: "미착용 상태에서 낙상 미감지 사례 발생 — 조기 안부 콜", status: "승인 대기" },
  { id: "h4", at: "2026-09-22 09:12", by: "김태영 (관제사)", target: "김순자 개별값", rule: "심박수 상한", field: "위험 기준", before: "125 bpm", after: "120 bpm", reason: "최근 2주 안정시 심박 68~72 유지 · 주치의 권고", status: "승인 대기" },
];

export const ALERTS_TODAY = 37;

// 편집 가능한 열 — Drawer 와 이력 표가 같은 라벨을 쓴다
export const FIELD_LABELS = { normal: "정상 기준", warn: "주의 기준", danger: "위험 기준", duration: "지속 조건", repeat: "반복 횟수", window: "적용 시간대", scope: "적용 대상", action: "알림방법", autoSos: "자동 SOS 전환", on: "사용 여부" };
