// 관제 콘솔 운영·관리 목 데이터 (2) — 병원 §15 · 계정·권한 §16 · 감사로그 §17 · 연동상태.
// lib/ops-admin.js 와 한 파일이었으나 700줄 규칙으로 나눴다. 시각 규칙은 그 파일과 같다.
import { MOU_HOSPITALS } from "./mock";
import { T, ago } from "./ops-admin";

// ── §15 병원 ──
// 기본 명부는 MOU_HOSPITALS(6곳) 에서 시작해 §15 필드로 넓힌다. 주소·대표번호 같은 실제 값은
// 지어내지 않는다 — 공개된 대표 정보를 확인한 2곳만 적고 나머지는 "확인 중".
const PUBLIC_INFO = {
  서울아산병원: { address: "서울 송파구 올림픽로43길 88", phone: "1688-7575", verified: "공개 대표정보 · 2026-09-22 확인" },
  삼성서울병원: { address: "서울 강남구 일원로 81", phone: "1599-3114", verified: "공개 대표정보 · 2026-09-22 확인" },
};
const HOSPITAL_EXTRA = {
  강남세브란스: { er: "운영", hours: "평일 08:30–17:30 · 토 확인 중", travel: "대치동 자택 차량 약 15분", parking: "지하 주차장 · 2시간 무료 (진료 확인)", wheelchair: "가능 · 정문 경사로", reception: "본관 1층 외래 접수", guardianNeeded: "초진 시 권장", mainFor: ["김순자"], booking: { status: "예약 진행 중", next: "2026-10-02 10:30 내과 재진" }, escorts: [{ at: "2026-08-14", elder: "김순자", concierge: "박지현", note: "베이직 동행 2시간" }], caution: "외래 대기 길어 오전 첫 슬롯 권장" },
  분당서울대병원: { er: "운영", hours: "확인 중", travel: "서초 자택 차량 약 40분", parking: "확인 중", wheelchair: "가능", reception: "확인 중", guardianNeeded: "확인 중", mainFor: ["오태식"], booking: { status: "대기", next: "재진 예약 대기 2일" }, escorts: [], caution: "재진 예약 대기 2일 — 처방 잔여량 확인" },
  고대구로병원: { er: "운영", hours: "확인 중", travel: "확인 중", parking: "확인 중", wheelchair: "가능 · 동선 확인 완료", reception: "확인 중", guardianNeeded: "확인 중", mainFor: [], booking: { status: "—", next: "" }, escorts: [], caution: "휠체어 동선 확인 완료 (2026-08)" },
  서울아산병원: { er: "운영", hours: "평일 08:30–17:30 · 확인 중", travel: "대치동 자택 차량 약 25분 · 잠실동 자택 약 15분", parking: "동관·서관 주차장 · 진료 시 할인", wheelchair: "가능 · 서관 출입구", reception: "서관 1층 · 신관 2층 (진료과별 확인)", guardianNeeded: "시술·검사 시 필요", mainFor: ["김순자", "이영호"], booking: { status: "예약 확정", next: "2026-09-25 13:50 순환기내과 (김순자)" }, escorts: [{ at: "2026-09-04", elder: "김순자", concierge: "박지현", note: "프리미엄 동행 · 서다인 차량" }, { at: "2026-07-22", elder: "이영호", concierge: "이수민", note: "베이직 동행" }], caution: "순환기내과 예약 슬롯 협의 완료 · 검사 전 항응고제 복용 여부 의료진 확인" },
  삼성서울병원: { er: "운영", hours: "평일 08:30–17:30 · 확인 중", travel: "강남 자택 차량 약 20분", parking: "지하 주차장 · 진료 확인 시 할인", wheelchair: "가능", reception: "본관 1층 외래 접수", guardianNeeded: "수술 상담 시 필요", mainFor: ["최정자"], booking: { status: "—", next: "백내장 수술 상담 일정 조율" }, escorts: [], caution: "백내장 수술 연계 — 수술 당일 보호자 동의서" },
  "강남 미소치과의원": { er: "미운영", hours: "확인 중", travel: "강남 자택 도보 10분", parking: "없음 (인근 공영)", wheelchair: "확인 중 (2층 · 승강기 유무 확인)", reception: "확인 중", guardianNeeded: "불필요", mainFor: ["강필순"], booking: { status: "—", next: "방문 진료 협의 중" }, escorts: [], caution: "방문 진료 협의 중 · 확정 전" },
};
export const HOSPITALS_SEED = MOU_HOSPITALS.map((h, i) => {
  const pub = PUBLIC_INFO[h.name] || {};
  const x = HOSPITAL_EXTRA[h.name] || {};
  return {
    id: `h${i + 1}`,
    name: h.name,
    dept: h.dept,
    partner: true,
    fast: !!h.fast,
    address: pub.address || "확인 중",
    phone: pub.phone || "확인 중",
    verified: pub.verified || "확인 중 — 실무진 명부 수령 후 반영",
    er: x.er || "확인 중",
    hours: x.hours || "확인 중",
    travel: x.travel || "확인 중",
    parking: x.parking || "확인 중",
    wheelchair: x.wheelchair || "확인 중",
    reception: x.reception || "확인 중",
    guardianNeeded: x.guardianNeeded || "확인 중",
    mainFor: x.mainFor || [],
    booking: x.booking || { status: "—", next: "" },
    escorts: x.escorts || [],
    caution: x.caution || h.note,
    changes: [],
  };
}).concat([
  // 제휴는 아니지만 고객이 다니는 병원 — 명부에 함께 둔다 (SOS 때 주 이용 병원 표시용)
  {
    id: "h7", name: "강동성심병원", dept: "정형외과", partner: false, fast: false,
    address: "확인 중", phone: "확인 중", verified: "확인 중 — 비제휴 · 고객 등록",
    er: "운영", hours: "확인 중", travel: "길동 자택 차량 약 10분", parking: "확인 중", wheelchair: "가능", reception: "확인 중", guardianNeeded: "확인 중",
    mainFor: ["박말순", "한복자"], booking: { status: "예약 확정", next: "2026-09-25 정형외과 외래 (박말순)" },
    escorts: [{ at: "2026-08-28", elder: "박말순", concierge: "정민호", note: "프리미엄 동행 · 휠체어" }],
    caution: "휠체어 대여 사전 확인", changes: [],
  },
]);
// 데모용 최근접 응급실 — 고객 자치구 기준. 실제 이송병원은 119·의료진 판단에 따른다.
export const NEAREST_ER = {
  "강남구 대치동": "강남세브란스 응급실",
  "송파구 잠실동": "서울아산병원 응급실",
  "강동구 길동": "강동성심병원 응급실",
  서초구: "확인 중 (서초 권역)",
  강남구: "삼성서울병원 응급실",
};
export const HOSPITAL_FIELDS = [
  ["name", "병원명", true], ["dept", "진료과", true], ["address", "주소"], ["phone", "대표번호"],
  ["hours", "진료시간"], ["travel", "예상 이동시간"], ["parking", "주차정보"], ["wheelchair", "휠체어 접근성"],
  ["reception", "접수 위치"], ["guardianNeeded", "보호자 필요 여부"], ["caution", "병원별 유의사항"],
];
export const HOSPITALS_STORAGE_KEY = "kcare-ops-hospitals-v1";
export const HOSPITAL_NOTICE = "명부 갱신 대기 — 2026-09-11 실무진 요청(협력병원 리스트 변경) · 새 목록 수령 후 반영";

// ── §16 계정·권한 ──
export const ROLES = [
  { key: "super", label: "최고관리자" },
  { key: "hq", label: "본사 관제책임자" },
  { key: "branch", label: "지점관리자" },
  { key: "operator", label: "관제사" },
  { key: "concierge", label: "컨시어지" },
  { key: "viewer", label: "조회 전용" },
];
export const PERMS = [
  { key: "address", label: "상세주소 조회" },
  { key: "location", label: "위치정보 조회" },
  { key: "health", label: "건강정보 조회" },
  { key: "editCustomer", label: "고객정보 수정" },
  { key: "threshold", label: "임계값 변경" },
  { key: "closeSos", label: "SOS 사건 종료" },
  { key: "dispatch", label: "컨시어지 파견" },
  { key: "excel", label: "엑셀 다운로드" },
  { key: "sendReport", label: "보고서 발송" },
  { key: "accounts", label: "계정관리" },
];
// 기본 매트릭스 — 최고관리자만 편집할 수 있다 (컴포넌트에서 잠근다)
export const PERM_MATRIX = {
  super: ["address", "location", "health", "editCustomer", "threshold", "closeSos", "dispatch", "excel", "sendReport", "accounts"],
  hq: ["address", "location", "health", "editCustomer", "threshold", "closeSos", "dispatch", "excel", "sendReport"],
  branch: ["address", "location", "health", "editCustomer", "closeSos", "dispatch", "sendReport"],
  operator: ["address", "location", "health", "closeSos", "dispatch", "sendReport"],
  concierge: ["address", "health"],
  viewer: [],
};
export const BRANCHES = ["본사", "강남 본점", "서초 지점", "송파 지점", "강동 지점"];
export const ACCOUNTS_SEED = [
  { id: "ac1", login: "admin.choi", name: "최관리", role: "super", branch: "본사", active: true, lastLogin: T("2026-09-22 09:02") },
  { id: "ac2", login: "hq.lee", name: "이수정", role: "hq", branch: "본사", active: true, lastLogin: T("2026-09-22 08:41") },
  { id: "ac3", login: "ops.kim", name: "김태영", role: "operator", branch: "강남 본점", active: true, lastLogin: T("2026-09-22 07:30") },
  { id: "ac4", login: "br.gangdong", name: "강동 지점관리자 (이름 확정 전)", role: "branch", branch: "강동 지점", active: false, lastLogin: null },
  { id: "ac5", login: "cc.park", name: "박지현", role: "concierge", branch: "강남 본점", active: true, lastLogin: T("2026-09-22 07:45") },
  { id: "ac6", login: "cc.seo", name: "서다인", role: "concierge", branch: "강남 본점", active: true, lastLogin: T("2026-09-22 13:35") },
  { id: "ac7", login: "cc.han", name: "한서연", role: "concierge", branch: "서초 지점", active: true, lastLogin: T("2026-09-21 18:10") },
  { id: "ac8", login: "cc.oh", name: "오하늘", role: "concierge", branch: "강남 본점", active: true, lastLogin: T("2026-09-20 09:12") },
  { id: "ac9", login: "cc.jung", name: "정민호", role: "concierge", branch: "강동 지점", active: true, lastLogin: T("2026-09-22 10:05") },
  { id: "ac10", login: "cc.lee", name: "이수민", role: "concierge", branch: "송파 지점", active: true, lastLogin: T("2026-09-21 09:00") },
  { id: "ac11", login: "cc.yoon", name: "윤세라", role: "concierge", branch: "강동 지점", active: true, lastLogin: T("2026-09-18 17:20") },
  { id: "ac12", login: "view.audit", name: "외부 감사 열람", role: "viewer", branch: "본사", active: true, lastLogin: T("2026-08-29 14:00") },
  { id: "ac13", login: "ops.former", name: "퇴직 관제사 (2026-08)", role: "operator", branch: "강남 본점", active: false, lastLogin: T("2026-08-12 18:30") },
];

// ── §17 감사로그 ──
export const AUDIT_KINDS = {
  auth: "로그인·로그아웃",
  viewCustomer: "고객 상세 조회",
  viewHealth: "건강정보 조회",
  viewLocation: "위치정보 조회",
  edit: "고객·보호자·컨시어지 정보 수정",
  threshold: "경보 임계값 변경",
  download: "파일 다운로드",
  contact: "전화·알림",
  dispatch: "출동 지시",
  sos: "SOS 처리·종료",
  report: "보고서 발송",
};
const roleLabel = (k) => (ROLES.find((r) => r.key === k) || {}).label || k;
const a = (id, at, login, name, role, elder, kind, text, before = null, after = null) => ({ id, at: T(at), login, name, role: roleLabel(role), elder, kind, text, before, after });
export const AUDIT_SEED = [
  a("au30", "2026-09-22 14:12", "ops.kim", "김태영", "operator", "김순자", "report", "정기방문 보고서 9/21 발송 → 김민수(앱 푸시)"),
  a("au29", "2026-09-22 13:52", "ops.kim", "김태영", "operator", "최정자", "dispatch", "컨시어지 업무지시 — 약국 심부름 (서다인)"),
  a("au28", "2026-09-22 13:30", "ops.kim", "김태영", "operator", "강필순", "contact", "안부 전화 3차 시도 · 미응답"),
  a("au27", "2026-09-22 11:20", "hq.lee", "이수정", "hq", "김순자", "threshold", "혈압 수축기 상한 변경", "150 mmHg", "145 mmHg"),
  a("au26", "2026-09-22 11:18", "hq.lee", "이수정", "hq", "김순자", "viewHealth", "최근 7일 혈압·심박 조회"),
  a("au25", "2026-09-22 10:31", "ops.kim", "김태영", "operator", "김순자", "contact", "보호자 통화 — 김민수 · 재진 예약 안내"),
  a("au24", "2026-09-22 10:05", "cc.jung", "정민호", "concierge", "박말순", "viewCustomer", "고객 상세 조회 (동행 준비)"),
  a("au23", "2026-09-22 09:40", "ops.kim", "김태영", "operator", "박말순", "edit", "보호자 연락 가능시간 수정", "09:00–18:00", "08:00–21:00"),
  a("au22", "2026-09-22 09:02", "admin.choi", "최관리", "super", "—", "auth", "로그인 (본사 · 사내망)"),
  a("au21", "2026-09-22 08:41", "hq.lee", "이수정", "hq", "—", "auth", "로그인 (본사)"),
  a("au20", "2026-09-22 08:36", "ops.kim", "김태영", "operator", "김순자", "report", "SOS 사건 보고서 #S-0922-01 발송 → 김민수"),
  a("au19", "2026-09-22 08:34", "ops.kim", "김태영", "operator", "김순자", "sos", "SOS 사건 종료 #S-0922-01 · 경미한 타박 · 이송 없음", "대응 중", "종료"),
  a("au18", "2026-09-22 07:52", "ops.kim", "김태영", "operator", "김순자", "viewLocation", "워치 위치 조회 (SOS 대응)"),
  a("au17", "2026-09-22 07:47", "ops.kim", "김태영", "operator", "김순자", "dispatch", "긴급 출동 지시 — 박지현 · 대치동 자택"),
  a("au16", "2026-09-22 07:46", "ops.kim", "김태영", "operator", "김순자", "contact", "보호자 통화 — 김민수 · SOS 상황 안내"),
  a("au15", "2026-09-22 07:43", "ops.kim", "김태영", "operator", "김순자", "sos", "SOS 접수 · 확인 전화 응답 · 대응 시작", "미확인", "대응 중"),
  a("au14", "2026-09-22 07:30", "ops.kim", "김태영", "operator", "—", "auth", "로그인 (강남 본점)"),
  a("au13", "2026-09-21 18:20", "ops.kim", "김태영", "operator", "김순자", "report", "주간 건강 요약 발송 → 김지영(이메일)"),
  a("au12", "2026-09-21 17:00", "ops.kim", "김태영", "operator", "강필순", "contact", "안부 전화 2차 시도 · 미응답"),
  a("au11", "2026-09-21 16:05", "hq.lee", "이수정", "hq", "—", "download", "컨시어지 근무현황 9월 엑셀 다운로드"),
  a("au10", "2026-09-21 15:40", "hq.lee", "이수정", "hq", "이영호", "edit", "컨시어지 담당 변경", "서다인", "이수민"),
  a("au09", "2026-09-21 10:50", "cc.park", "박지현", "concierge", "김순자", "viewHealth", "방문 전 최근 혈압 조회"),
  a("au08", "2026-09-20 19:10", "ops.kim", "김태영", "operator", "최정자", "report", "안심방문 보고서 9/19 발송 → 최선영"),
  a("au07", "2026-09-20 09:12", "ops.kim", "김태영", "operator", "박말순", "contact", "문자 — 병원 동행 결제 승인 요청 (박은지)"),
  a("au06", "2026-09-19 14:30", "admin.choi", "최관리", "super", "—", "edit", "계정 권한 변경 — view.audit", "관제사", "조회 전용"),
  a("au05", "2026-09-19 09:00", "hq.lee", "이수정", "hq", "한복자", "threshold", "야간 무활동 경보 기준 변경", "8시간", "6시간"),
  a("au04", "2026-09-18 17:05", "ops.kim", "김태영", "operator", "한복자", "report", "추가 방문 보고서 발송 → 한준호"),
  a("au03", "2026-09-18 16:40", "cc.yoon", "윤세라", "concierge", "한복자", "viewCustomer", "방문 후 고객 상세 조회 · 기록 입력"),
  a("au02", "2026-09-17 18:31", "ops.kim", "김태영", "operator", "—", "auth", "로그아웃"),
  a("au01", "2026-09-17 08:58", "view.audit", "외부 감사 열람", "viewer", "—", "download", "8월 감사로그 CSV 다운로드"),
];

// ── 시스템 연동상태 ──
// 상태 4종 — 정상·지연·장애·연동 대기. 장애는 기기·연동 계열이라 보라(device) 로 두고 빨강은 쓰지 않는다.
export const INTEG_STATUS = {
  ok: { label: "정상", tone: "ok" },
  delayed: { label: "지연", tone: "warn" },
  down: { label: "장애", tone: "device" },
  pending: { label: "연동 대기", tone: "muted" },
};
export const INTEGRATIONS = [
  { key: "shealth", name: "삼성헬스 · 갤럭시워치 API", status: "ok", checkedAt: ago(3), incidents24h: 0, owner: "개발팀 · 김태영(관제)", desc: "심박 · 걸음 · 수면 · 낙상 감지 수신", mode: "실시간 (5분 주기)" },
  { key: "mmwave", name: "mmWave 센서 게이트웨이", status: "delayed", checkedAt: ago(19), incidents24h: 1, owner: "센서 벤더 · 개발팀", desc: "재실 · 호흡 · 낙상 감지 (욕실·침실)", mode: "실시간 (1분 주기) · 현재 평균 지연 4분" },
  { key: "push", name: "문자 · 앱 푸시 발송", status: "ok", checkedAt: ago(2), incidents24h: 1, owner: "개발팀", desc: "보호자 · 어르신 앱 푸시 · SMS 발송", mode: "즉시" },
  { key: "alimtalk", name: "알림톡", status: "pending", checkedAt: null, incidents24h: 0, owner: "사업팀 (채널 심사)", desc: "카카오 알림톡 템플릿 발송", mode: "연동 대기 — 발신 프로필 심사 중" },
  { key: "pg", name: "결제 (PG)", status: "pending", checkedAt: null, incidents24h: 0, owner: "사업팀 · 개발팀", desc: "보호자 결제 승인 · 정산", mode: "연동 대기 — PG 계약 전 · 현재 승인만 기록" },
  { key: "map", name: "지도 · 위치", status: "ok", checkedAt: ago(1), incidents24h: 0, owner: "개발팀", desc: "고객 자택 · 컨시어지 위치 · 병원 표시", mode: "실시간" },
  { key: "e119", name: "119 연계 (수동)", status: "pending", checkedAt: null, incidents24h: 0, owner: "관제 (김태영)", desc: "SOS 시 119 신고 · 상황 공유", mode: "연동 대기 — 현재 관제사가 직접 신고 (수동 절차)" },
];
export const INTEG_INCIDENTS = [
  { id: "in1", at: T("2026-09-22 13:58"), system: "mmWave 센서 게이트웨이", level: "delayed", text: "강동 권역 게이트웨이 수신 지연 4~6분 · 벤더 확인 중", duration: "진행 중", resolved: false },
  { id: "in2", at: T("2026-09-22 09:15"), system: "문자 · 앱 푸시 발송", level: "down", text: "오태식 기기 푸시 토큰 만료 · 발송 실패 1건 (문자로 대체 발송)", duration: "12분", resolved: true },
  { id: "in3", at: T("2026-09-21 02:10"), system: "삼성헬스 · 갤럭시워치 API", level: "delayed", text: "야간 동기화 지연 22분 · 자동 복구", duration: "22분", resolved: true },
  { id: "in4", at: T("2026-09-19 16:40"), system: "mmWave 센서 게이트웨이", level: "down", text: "김순자 욕실 센서 게이트웨이 재부팅 · 데이터 공백 35분", duration: "35분", resolved: true },
  { id: "in5", at: T("2026-09-17 11:05"), system: "지도 · 위치", level: "delayed", text: "지도 타일 응답 지연 · 3분 후 정상", duration: "3분", resolved: true },
];
