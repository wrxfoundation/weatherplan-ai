// 운영 관리 목 데이터 — 방문(11절) · 어르신(7절) 과 관리 화면 공용 헬퍼.
// 명부 원본은 lib/rosters.js 를 그대로 읽고, 여기엔 상세 패널에 필요한 것만 얹는다.
// 데모 인물은 기존 앱과 같아야 하므로 이름·관계·지역을 새로 만들지 않는다.
// 보호자·컨시어지 상세는 lib/ops-mgmt-people.js.
import { ROSTERS } from "./rosters";
import { checkupFor } from "./checkup";
import { SERVICE_MENU } from "./requests";

export const TODAY = "2026-09-22";
export const TODAY_LABEL = "2026년 9월 22일 화요일";

// 현재 접속 계정 — 감사로그의 "누가". 브리프: 관제사 김태영 · 강남 본점
export const OPERATOR = { account: "kty.kim@kcare", name: "김태영", role: "관제사", branch: "강남 본점" };

const two = (n) => String(n).padStart(2, "0");
export function stampNow() {
  const d = new Date();
  return `${TODAY} ${two(d.getHours())}:${two(d.getMinutes())}`;
}
export const plusHour = (t) => `${two((Number(t.slice(0, 2)) + 1) % 24)}${t.slice(2)}`;

// 수정이력 한 줄 — 수정일시·접속계정·이름·권한·항목·전·후·사유 (요청서 7·17절). 덮어쓰지 않고 쌓는다.
export function logEntry({ field, before, after, reason }) {
  return { at: stampNow(), account: OPERATOR.account, name: OPERATOR.name, role: OPERATOR.role, field, before: before || "—", after: after || "—", reason };
}
const past = (at, field, before, after, reason, who = OPERATOR) => ({ at, account: who.account, name: who.name, role: who.role, field, before, after, reason });
export const ADMIN = { account: "sj.lee@kcare", name: "이수정", role: "관리자" };

// 전화번호 마스킹 — 화면에 원번호를 두지 않는다 (게이팅 원칙). 이름에서 안정적으로 만든다.
export const maskTel = (name) => {
  const c = name.charCodeAt(0);
  return `010-${20 + (c % 70)}**-${10 + ((c >> 3) % 80)}**`;
};

// 보호자 알림 상태 8종 (요청서 8절). 발송 실패·미응답은 운영 경고라 amber.
export const NOTIFY_STATE = {
  sent: { label: "발송", tone: "info" },
  delivered: { label: "전달 성공", tone: "info" },
  read: { label: "열람", tone: "ok" },
  called: { label: "전화 연결", tone: "ok" },
  replied: { label: "응답", tone: "ok" },
  approved: { label: "조치 승인", tone: "ok" },
  noreply: { label: "미응답", tone: "warn" },
  failed: { label: "발송 실패", tone: "warn" },
};

// 동 → 구 (상세주소는 권한 열람 · 화면은 동 단위까지)
const GU = { 대치동: "서울 강남구", 역삼동: "서울 강남구", 잠실동: "서울 송파구", 길동: "서울 강동구", 천호동: "서울 강동구", 둔촌동: "서울 강동구", 명일동: "서울 강동구", 방배동: "서울 서초구", 상암동: "서울 마포구", 연남동: "서울 마포구", 홍은동: "서울 서대문구", 정자동: "성남 분당구", 서현동: "성남 분당구" };
export const elderRow = (name) => ROSTERS.elders.rows.find((r) => r[0] === name);
export const addrOf = (name) => { const r = elderRow(name); return r ? `${GU[r[4]] || ""} ${r[4]}`.trim() : "—"; };

// 요양병원 거주 어르신 — 21항목이 병실 7 로 바뀐다 (lib/checkup.js CHECKUP_HOSPITAL)
export const HOSPITAL = { 문순덕: "요양병원 3층 302호 (마포)" };
export const locOf = (name) => (HOSPITAL[name] ? "hospital" : "home");

// ── 방문관리 (11절) ─────────────────────────────────────────────────────
export const VISIT_STATE = {
  done: { label: "완료", tone: "ok" },
  active: { label: "진행", tone: "info" },
  planned: { label: "예정", tone: "gold" },
  followup: { label: "후속", tone: "warn" },
};
export const visitPill = (v) => (v.status === "done" && v.followup ? "followup" : v.status);

// 필수 점검항목 — 누락되면 방문 완료 불가 (거주형태별)
const REQUIRED = {
  home: ["혈압", "복약", "걸음 · 균형", "문턱 · 바닥", "가스 · 전기"],
  hospital: ["혈압 · 체온", "피부 · 욕창 상태", "복약 · 영양 상태", "병상 주변 안전", "외래 · 검진 일정"],
};
export const requiredFor = (loc) => REQUIRED[loc === "hospital" ? "hospital" : "home"];
export const itemKeys = (loc) => checkupFor(loc).flatMap((a) => a.items.map((i) => i.k));

export const VISIT_STEPS = ["체크인", "21항목 점검", "고객 확인", "관리자 검토", "보호자 리포트"];

const V = (n, time, name, team, region, memo, status, followup, pri, sub) => ({ id: `V-0922-${two(n)}`, time, name, team, region, memo, status, followup, pri, sub });
// 오늘 18건 — 시안 상단 현황(완료 11 · 진행 3 · 예정 4 · 후속 5)과 같게 맞춘다
export const VISITS = [
  V(1, "09:00", "최정자", "강남 1팀", "강남·서초", "특이사항 없음", "done", false, "서다인", "김도윤"),
  V(2, "09:00", "배동철", "송파 1팀", "송파·강동", "은행 서류 확인", "done", false, "이수민", "장민서"),
  V(3, "09:30", "오태식", "강남 2팀", "강남·서초", "욕실 센서 점검", "done", false, "박지현", "오하늘"),
  V(4, "10:00", "류재만", "마포 1팀", "마포·서대문", "온보딩 후 2회차", "done", false, "문지호", "배주원"),
  V(5, "10:00", "서옥자", "분당 1팀", "분당·판교", "특이사항 없음", "done", false, "안정우", "유가온"),
  V(6, "10:30", "신길자", "강남 3팀", "강남·서초", "보청기 배터리 교체", "done", false, "고은비", "박서준"),
  V(7, "11:00", "도금례", "강동 1팀", "송파·강동", "냉장고 상한 반찬 · 장보기 전환", "done", true, "정민호", "최도현"),
  V(8, "11:30", "강필순", "강남 1팀", "강남·서초", "복약 확인 필요", "done", true, "강예린", "이채원"),
  V(9, "11:30", "조갑수", "송파 1팀", "송파·강동", "워치 미착용 3일째", "done", true, "김도윤", "장민서"),
  V(10, "12:00", "유재섭", "분당 1팀", "분당·판교", "특이사항 없음", "done", false, "유가온", "조현우"),
  V(11, "13:00", "박말순", "강동 1팀", "송파·강동", "점검 15/21", "active", false, "윤세라", "최도현"),
  V(12, "13:00", "노만수", "강남 2팀", "강남·서초", "워치 배터리 12% · 충전기 교체", "done", true, "남상혁", "전소율"),
  V(13, "13:30", "문순덕", "마포 1팀", "마포·서대문", "요양병원 · 병실 점검 12/21", "active", false, "손하린", "신유진"),
  V(14, "14:00", "김순자", "강남 2팀", "강남·서초", "점검 17/21", "active", true, "박지현", "서다인"),
  V(15, "15:30", "이영호", "송파 1팀", "송파·강동", "도착 42분 전", "planned", false, "한서연", "오하늘"),
  V(16, "16:00", "양삼순", "마포 1팀", "마포·서대문", "온보딩 방문 · 부 담당 미배정(임시 짝)", "planned", false, "배주원", "신유진"),
  V(17, "17:00", "한복자", "강동 1팀", "송파·강동", "보호자 동석", "planned", false, "정민호", "서다인"),
  V(18, "17:30", "황보순", "강남 3팀", "강남·서초", "온보딩 방문 · 부 담당 미배정(임시 짝)", "planned", false, "이채원", "전소율"),
];
export const VISIT_TEAMS = [...new Set(VISITS.map((v) => v.team))];
export const VISIT_REGIONS = [...new Set(VISITS.map((v) => v.region))];

// 방문별 상세 — 기본값은 상태에서 만들고, 시연에 필요한 방문만 덮어쓴다
const svc = (no) => SERVICE_MENU.find((s) => s.no === no);
const VISIT_DETAIL = {
  "V-0922-07": { review: "검수 대기", viewed: "—", followups: [{ text: "냉장고에 상한 반찬 · 같은 반찬 2주째 — 장보기 대행 전환 제안", kind: "service", service: svc(6) }], changes: ["냉장고: 지난달 정상 → 상한 음식 확인", "식욕 · 끼니: 하루 2끼 (지난달 3끼)"] },
  "V-0922-08": { review: "검수 대기", viewed: "—", followups: [{ text: "남은 약 개수와 처방일이 맞지 않음 — 보호자 확인 요청", kind: "immediate" }], changes: ["복약: 지난달 정상 → 개수 불일치", "말수: 변화 없음"] },
  "V-0922-09": { review: "검수 대기", viewed: "—", followups: [{ text: "워치 미착용 3일째 · 착용 안내 후 기기 점검 요청", kind: "immediate" }], changes: ["워치 착용: 지난달 정상 → 미착용 반복"] },
  "V-0922-12": { review: "검수 완료", viewed: "미열람", followups: [{ text: "워치 배터리 12% · 충전기 교체 · 보호자 통보 완료", kind: "immediate" }], changes: ["워치 배터리: 충전 습관 확인 필요"] },
  "V-0922-11": { checkin: { at: "12:57", gps: "GPS 확인 · 고객 주소 반경 22m 이내" }, pending: ["통증", "수면 시간", "만난 사람", "잠들기까지", "조명", "우편 · 고지서"], photos: 3, memo: "청각 보조기 배터리 교체함. 대화는 필담 병행." },
  "V-0922-13": { checkin: { at: "13:31", gps: "GPS 확인 · 병원 주소 반경 30m 이내" }, pending: ["손발 부종 · 관절", "의복 · 침구 청결", "식사량", "복약 · 영양 상태", "만난 사람", "마음 이야기", "개인 위생물품", "간병인 · 간호사 소통", "외래 · 검진 일정"], photos: 2, memo: "간병인 교대 시간과 겹쳐 소통 항목은 교대 후 확인 예정." },
  "V-0922-14": {
    checkin: { at: "13:58", gps: "GPS 확인 · 고객 주소 반경 18m 이내" },
    pending: ["통증", "잠들기까지", "가스 · 전기", "우편 · 고지서"],
    photos: 6,
    memo: "복약 달력에 지난주 빈칸 2회. 본인은 \"먹었다\"고 하심. 냉장고 반찬은 새로 채워져 있음(주말 아들 방문).",
    changes: ["말수: 지난달과 비슷 — 변화 없음", "복약: 달력 빈칸 2회 — 추가 확인 필요", "외출 횟수: 주 3회 → 주 2회", "혈압: 138/86 (지난달 142/88) · 약 복용 여부와 함께 봐야 함"],
    followups: [{ text: "복약 누락 2회 확인 · 보호자 알림 예정", kind: "immediate" }],
    request: { text: "욕실 전구 교체 · 현장 처리 완료", state: "현장 처리" },
  },
};

export function visitDetail(v) {
  const loc = locOf(v.name);
  const keys = itemKeys(loc);
  const base =
    v.status === "done"
      ? { checkin: { at: v.time, gps: "GPS 확인 · 고객 주소 반경 20m 이내" }, pending: [], photos: 4, memo: "특이사항 없음.", changes: ["지난달과 같은 항목에서 변화 없음"], followups: [], stepIdx: 5, review: "검수 완료", viewed: "열람 완료" }
      : v.status === "active"
        ? { checkin: { at: v.time, gps: "GPS 확인 · 고객 주소 반경 20m 이내" }, pending: keys.slice(12), photos: 2, memo: "", changes: [], followups: [], stepIdx: 1, review: "수행 중", viewed: "—" }
        : { checkin: null, pending: keys, photos: 0, memo: "", changes: [], followups: [], stepIdx: 0, review: "—", viewed: "—" };
  const d = VISIT_DETAIL[v.id] || {};
  // 완료 방문: 관제 검수가 남았으면 4단계(관리자 검토)에 멈춰 있고, 검수까지 끝났으면 5단계 모두 완료
  const stepIdx = v.status === "done" ? (d.review === "검수 대기" ? 3 : 5) : base.stepIdx;
  return {
    ...v, ...base, ...d, stepIdx, loc, keys, addr: HOSPITAL[v.name] || addrOf(v.name), end: plusHour(v.time),
    cycle: "월 1회", nextDate: "2026-10-20 (확정 전)", confirmed: true, notified: v.id !== "V-0922-16", // 양삼순 온보딩 방문만 보호자 통보 전
    pair: { pri: { name: v.pri, tel: maskTel(v.pri) }, sub: { name: v.sub, tel: maskTel(v.sub) } },
    request: d.request || null,
  };
}

// ── 어르신 관리 (7절) ─────────────────────────────────────────────────
export const ELDER_TABS = ["기본정보", "건강·질환", "보호자", "담당 컨시어지", "워치·센서", "건강 변화", "방문관리", "해주세요", "함께해요", "SOS·이상징후", "복지혜택", "동의서·서류", "상담·관제메모", "수정이력"];
export const SERVICE_STATE = { active: { label: "이용 중", tone: "ok" }, paused: { label: "일시중지", tone: "warn" }, ended: { label: "종료", tone: "muted" } };
export const feedOf = (watch) => (watch === "정상 수신" ? "live" : watch.includes("미착용") ? "unworn" : watch.includes("배터리") ? "battery" : "stale");
export const sevOf = (risk) => ({ 높음: "danger", 중간: "warn", 낮음: "ok" }[risk] || "ok");

const KIMSJ = {
  service: { state: "active", since: "2025-05-12", product: "K-CARE 멤버십 티어1 · 월 1회 2인 1조 안심방문 포함", pay: "정상 · 자동결제 (매월 12일)", visitDay: "매월 셋째 주 화요일 14:00", cycle: "월 1회" },
  priority: ["1순위 김민수 (아들 · 주 보호자)", "2순위 김지영 (차녀 · 부 · LA)", "3순위 김현우 (삼남 · 비상 · 시드니)", "담당 컨시어지 박지현 → 119"],
  health: { dx: ["심부전", "고혈압"], meds: ["항응고제 (아침)", "혈압약 (아침 · 저녁)"], allergy: "확인된 알레르기 없음 (2026-05-12 확인)", hospital: "서울아산병원 순환기내과 (주 이용)", note: "관찰 내용: 지난달 대비 외출 횟수 감소 · 복약 달력 빈칸 2회 — 추가 확인 필요. 진단·판단은 의료진의 몫." },
  devices: { watch: { model: "갤럭시 워치 (삼성헬스 연동)", id: "GW-**34", feed: "live", at: "14:02", battery: "71%", worn: "착용 중", threshold: "개별 임계값 적용 (안정시 심박 상한 95)" }, sensors: [{ type: "mmWave 센서", place: "거실", at: "14:01", state: "정상" }, { type: "mmWave 센서", place: "욕실", at: "13:58", state: "정상" }] },
  trend: [["안정시 심박", "68 bpm", "66–71", "65–72", "64–74"], ["혈중산소", "97%", "96–98", "95–98", "95–98"], ["걸음 수", "—", "1,840", "일 평균 2,310", "일 평균 2,640"], ["수면", "—", "6h 10m", "평균 6h 20m", "평균 6h 40m"]],
  requests: [{ at: "09-19", name: svc(13).name, price: svc(13).priceLabel, state: "완료 · 영수증 첨부" }, { at: "09-08", name: svc(6).name, price: svc(6).priceLabel, state: "완료 · 보호자 승인" }, { at: "08-27", name: svc(2).name, price: svc(2).priceLabel, state: "완료 · 리포트 발송" }],
  together: { manager: "박지현 (전담 케어매니저)", lastTalk: "09-19 · 손주 이야기, 화초 물주기", interests: "화초 · 트로트 · 성당 모임", observed: ["말수: 지난달과 비슷", "외출: 주 3회 → 2회 (변화 징후)", "하시던 일: 화초 계속 돌보심"], promise: "다음 방문 때 화분 분갈이 같이 하기", nextCheck: "09-26 안부 전화", shared: "보호자 공유: 외출 횟수 변화만 사실대로 전달", memo: "내부 비공개: 성당 모임 친구분 이사 — 관계 변화 추가 확인 필요" },
  sos: [{ no: "SOS-20260901-002", at: "09-01 03:12", cause: "야간 심박 상한 초과 (108 bpm · 기준 95)", result: "정상 확인 · 1차 전화 연결 · 종료 03:31" }],
  welfare: [{ name: "노인 맞춤돌봄서비스", state: "대상 · 신청 안내 완료" }, { name: "장기요양 3등급 재가급여", state: "이용 중" }, { name: "고령자 통신요금 감면", state: "자동매칭 · 보호자 검토 대기" }],
  docs: [{ name: "서비스 이용 계약서", state: "서명 완료", at: "2025-05-12" }, { name: "긴급조치 사전동의서 (119 신고 · 병원 이송)", state: "서명 완료", at: "2025-05-12" }, { name: "출입 동의서 (도어락 비밀번호 보관)", state: "서명 완료", at: "2025-05-12" }, { name: "개인정보 · 건강정보 처리 동의", state: "서명 완료", at: "2025-05-12" }, { name: "위치정보 수집 동의", state: "갱신 필요 (2026-11)", at: "2025-11-12" }],
  notes: [{ at: "09-19 10:20", who: "박지현 (컨시어지)", text: "약국 심부름 전달 시 복약 달력 빈칸 확인 · 다음 방문 때 재확인" }, { at: "09-01 03:40", who: "김태영 (관제사)", text: "야간 심박 경보 — 본인 통화 정상, 화장실 다녀오신 직후. 보호자 아침 통보" }, { at: "08-12 15:00", who: "이수정 (관리자)", text: "김현우 님(삼남) 비상 보호자로 추가 연결 · 시드니 시차 안내" }],
  history: [past("2026-08-12 15:02", "보호자 연결", "김민수 · 김지영", "김민수 · 김지영 · 김현우(비상)", "삼남 김현우 님 비상 연락 등록 요청 (보호자 김민수)", ADMIN), past("2026-06-03 11:40", "경보 임계값 (안정시 심박 상한)", "기본값 100", "개별값 95", "평상시 수치가 낮아 기본값으로는 늦게 잡힘 — 담당 관제사 제안, 관리자 승인", ADMIN)],
};

// 명부 한 줄 → 상세 객체. 김순자는 채워진 예시, 나머지는 명부에서 만든 요약.
export function elderDetail(r) {
  const [name, sex, age, branch, dong, disability, veteran, regDate, ltc, tier, pri, sub, watch, risk, next] = r;
  const loc = locOf(name);
  const x = name === "김순자" ? KIMSJ : {};
  return {
    name, sex, age, born: String(2026 - Number(age)), branch, dong, addr: HOSPITAL[name] || addrOf(name), disability, veteran, regDate, ltc, tier, pri, sub, watch, risk, next, loc,
    service: { state: "active", since: regDate, product: `K-CARE 멤버십 ${tier} · 월 1회 2인 1조 안심방문 포함`, pay: "정상 · 자동결제", visitDay: "매월 셋째 주 (확정 전)", cycle: "월 1회" },
    priority: ["1순위 주 보호자", "2순위 부 보호자", `담당 컨시어지 ${pri} → 119`],
    health: { dx: ["명부 기준 위험 " + risk + " · 상세는 건강정보 열람 권한 필요"], meds: ["복용약 · 연동 대기"], allergy: "확인 필요", hospital: next.includes("병원") || /내과|외과|안과|재활/.test(next) ? next.replace(/^.*?\d{2}:\d{2} /, "") : "주 이용 병원 확인 필요", note: "관찰 내용 · 변화 징후는 방문 기록에서 봅니다." },
    devices: { watch: { model: "갤럭시 워치 (삼성헬스 연동)", id: "GW-****", feed: feedOf(watch), at: watch === "정상 수신" ? "14:00" : "확인 필요", battery: watch.includes("배터리") ? watch.replace("배터리 ", "") : "—", worn: watch.includes("미착용") ? "미착용" : "착용 중", threshold: "기본값 적용" }, sensors: [{ type: "mmWave 센서", place: "설치 확인 필요", at: "—", state: "연동 대기" }] },
    trend: [["안정시 심박", "연동 대기", "—", "—", "—"], ["혈중산소", "연동 대기", "—", "—", "—"]],
    requests: [], together: { manager: `${pri} (전담 케어매니저)`, lastTalk: "기록 없음", interests: "확인 필요", observed: ["최근 방문 기록에서 관찰 내용을 봅니다"], promise: "—", nextCheck: "—", shared: "—", memo: "—" },
    sos: [], welfare: [{ name: "자동매칭", state: ltc !== "—" ? `장기요양 ${ltc} 기준 재확인 대기` : "대상 조건 확인 대기" }],
    docs: [{ name: "서비스 이용 계약서", state: "서명 완료", at: regDate }, { name: "긴급조치 사전동의서", state: "서명 완료", at: regDate }, { name: "출입 동의서", state: "확인 필요", at: "—" }],
    notes: [], history: [],
    ...x,
  };
}
