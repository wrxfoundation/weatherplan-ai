// 제휴 병원 목록 = 관제 병원 관리 (2026-10-28 업데이트 요청 2).
//
// 전에는 보호자 예약 › 제휴병원 화면이 코드에 고정된 6곳(lib/mock MOU_HOSPITALS)을, 관제 병원 관리는 기기마다 따로
// 저장한 명부를 들고 있어 관제가 등록 · 수정 · 삭제해도 보호자 화면은 그대로였다.
// 이제 명부는 가구 기록 한 곳(state.hospitals)에 있고, 모든 화면이 hospitalsOf 로 읽는다.
//   - null 이면 아직 아무도 고치지 않은 것 — 기본 명부(아래 HOSPITALS_SEED · 센터 공간은 제휴 6곳만 · 예시 이력 없이)
//   - 보호자 · 어르신 · 컨시어지 화면은 '제휴'인 병원만 (partnerHospitals). 비제휴는 관제 명부에만
//   - 이미 잡힌 일정 · 해주세요는 병원 이름을 글로 갖고 있어, 병원이 목록에서 빠져도 그대로 남는다
//   - 보호자가 직접 등록한 '다니시던 병원'(state.myHospitals)은 따로 — 제휴 목록과 섞지 않는다
import { HOSPITAL_PARTNERS, MOU_HOSPITALS } from "./mock";
import { centerNow } from "./people-store";

// ── 기본 명부 (관제 요청서 §15) ──
// 기본 명부는 MOU_HOSPITALS(6곳) 에서 시작해 §15 필드로 넓힌다. 주소·대표번호 같은 실제 값은
// 지어내지 않는다 — 공개된 대표 정보를 확인한 2곳만 적고 나머지는 "확인 중".
const PUBLIC_INFO = {
  서울아산병원: { address: "서울 송파구 올림픽로43길 88", phone: "1688-7575", verified: "공개 대표정보 · 2026-09-22 확인" },
  삼성서울병원: { address: "서울 강남구 일원로 81", phone: "1599-3114", verified: "공개 대표정보 · 2026-09-22 확인" },
};
const HOSPITAL_EXTRA = {
  강남세브란스: { er: "운영", hours: "평일 08:30–17:30 · 토 확인 중", travel: "대치동 자택 차량 약 15분", parking: "지하 주차장 · 2시간 무료 (진료 확인)", wheelchair: "가능 · 정문 경사로", reception: "본관 1층 외래 접수", guardianNeeded: "초진 시 권장", mainFor: ["김순자"], booking: { status: "예약 진행 중", next: "2026-10-02 10:30 내과 재진" }, escorts: [{ at: "2026-08-14", elder: "김순자", concierge: "박지현", note: "병원동행 2시간" }], caution: "외래 대기 길어 오전 첫 슬롯 권장" },
  분당서울대병원: { er: "운영", hours: "확인 중", travel: "역삼동 자택 차량 약 35분", parking: "확인 중", wheelchair: "가능", reception: "확인 중", guardianNeeded: "확인 중", mainFor: ["오태식"], booking: { status: "대기", next: "재진 예약 대기 2일" }, escorts: [], caution: "재진 예약 대기 2일 — 처방 잔여량 확인" },
  고대구로병원: { er: "운영", hours: "확인 중", travel: "확인 중", parking: "확인 중", wheelchair: "가능 · 동선 확인 완료", reception: "확인 중", guardianNeeded: "확인 중", mainFor: [], booking: { status: "—", next: "" }, escorts: [], caution: "휠체어 동선 확인 완료 (2026-08)" },
  서울아산병원: { er: "운영", hours: "평일 08:30–17:30 · 확인 중", travel: "대치동 자택 차량 약 25분 · 잠실동 자택 약 15분", parking: "동관·서관 주차장 · 진료 시 할인", wheelchair: "가능 · 서관 출입구", reception: "서관 1층 · 신관 2층 (진료과별 확인)", guardianNeeded: "시술·검사 시 필요", mainFor: ["김순자", "이영호"], booking: { status: "예약 확정", next: "2026-09-25 13:50 순환기내과 (김순자)" }, escorts: [{ at: "2026-09-04", elder: "김순자", concierge: "박지현", note: "든든 병원동행 · 서다인 차량" }, { at: "2026-07-22", elder: "이영호", concierge: "이수민", note: "병원동행" }], caution: "순환기내과 예약 슬롯 협의 완료 · 검사 전 항응고제 복용 여부 의료진 확인" },
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
    // 가용 슬롯 — 데모의 예시 값. 관제가 병원 관리에서 고친다 (센터 공간은 비워 둔다)
    slots: HOSPITAL_PARTNERS[h.name]?.slots || "",
    changes: [],
  };
}).concat([
  // 제휴는 아니지만 고객이 다니는 병원 — 명부에 함께 둔다 (SOS 때 주 이용 병원 표시용)
  {
    id: "h7", name: "강동성심병원", dept: "정형외과", partner: false, fast: false,
    address: "확인 중", phone: "확인 중", verified: "확인 중 — 비제휴 · 고객 등록",
    er: "운영", hours: "확인 중", travel: "길동 자택 차량 약 10분", parking: "확인 중", wheelchair: "가능", reception: "확인 중", guardianNeeded: "확인 중",
    mainFor: ["박말순", "한복자"], booking: { status: "예약 확정", next: "2026-09-25 정형외과 외래 (박말순)" },
    escorts: [{ at: "2026-08-28", elder: "박말순", concierge: "정민호", note: "든든 병원동행 · 휠체어" }],
    caution: "휠체어 대여 사전 확인", changes: [],
  },
]);

// 관제 센터 공간 — 제휴 병원 명부만. 예시 고객의 주 이용 병원 · 예약 · 동행 이력 · 자택 이동시간 · 슬롯은 붙이지 않는다
// (2026-10-06 누수 점검 — 예전 관제 병원 관리 화면의 centerSeed 와 같은 규칙)
const centerSeed = () =>
  HOSPITALS_SEED.filter((h) => h.partner).map((h) => ({ ...h, mainFor: [], booking: { status: "—", next: "" }, escorts: [], travel: "확인 중", slots: "" }));
export const seedHospitals = () => (centerNow() ? centerSeed() : HOSPITALS_SEED);

// 가구 기록의 병원 명부 — 아직 아무도 고치지 않았으면 기본 명부
export const hospitalsOf = (state) => (Array.isArray(state?.hospitals) ? state.hospitals : seedHospitals());
// 보호자 · 어르신 · 컨시어지 화면이 보는 제휴 병원 — 병원명 · 진료과 · 빠른 예약 · 가용 슬롯(있으면)
export const partnerHospitals = (state) => hospitalsOf(state).filter((h) => h && h.partner);

// 등록 · 수정 칸 검사는 lib/hospital-clean.js — 기록 규칙(lib/state.js)이 이 파일의 예시 데이터(lib/mock)를 끌고 오지 않게
export { cleanHospital } from "./hospital-clean";
