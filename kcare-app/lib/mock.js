// 목 데이터 — 프로토타입 페르소나(김순자 가구) 재사용.
// 미연동 지표는 임의 생성하지 않고 "연동 대기"로 표기한다 (PRD 정직성 원칙).

// 상태 시드는 lib/seed.js 로 분리 — _app 공용 청크가 이 파일을 끌어오지 않게 한다.
export { INITIAL_EVENTS, INITIAL_REQUESTS, INITIAL_KIT, SEED_EVENTS, SEED_REPORTS } from "./seed";

export const ELDER = {
  name: "김순자",
  age: 78,
  district: "강남구",
  dong: "대치동",
};

export const GUARDIANS = [
  { name: "김민수", relation: "아들 · 주 보호자", residence: "서울", isPrimary: true, share: "40%" },
  { name: "김지영", relation: "차녀", residence: "LA (PST)", isPrimary: false, share: "30%" },
  { name: "김현우", relation: "삼남", residence: "시드니 (AEST)", isPrimary: false, share: "30%" },
];

export const CONCIERGES = [
  { name: "박지현", role: "주 동행 · 간호사 출신" },
  { name: "서다인", role: "부 동행" },
];

// 공유 캘린더 일정 9종 kind — REQ-02
export const EVENT_KINDS = {
  hospital: { label: "병원 예약", color: "#C0392B" },
  medication: { label: "복약 알림", color: "#3B5C8A" },
  visit: { label: "컨시어지 방문", color: "#B08D57" },
  kit: { label: "약상자 교체", color: "#8A5D12" },
  checkup: { label: "건강검진", color: "#1E7A5A" },
  family: { label: "보호자 방문", color: "#0A1F3C" },
  delivery: { label: "상품 배송", color: "#5C5A54" },
  request: { label: "추가 요청사항", color: "#7A4C8A" },
  nextAppt: { label: "다음 진료 예정일", color: "#C0392B" },
};

// 주간 요약 (프로토타입 목 수치 재사용) — 웨어러블 실연동 대기 표기 필수
export const WEEKLY = [
  { name: "수면", value: "6.4h", delta: "+0.3", last: "지난주 6.1" },
  { name: "활동", value: "3,820", delta: "+12%", last: "지난주 3,410" },
  { name: "복약", value: "19/21", delta: "+2", last: "지난주 17/21" },
];

// F8 외출 컨디션 — 서버 1회 계산 가정(핸드오프 06 §3.4). 어르신·가족·컨시어지가
// 같은 legs를 역할별로 다르게 표현한다. grade는 서버 확정값 — 클라이언트 재계산 금지.
// 도착지는 서울아산병원 — 일정(ev1)·관제 JOBS·브리핑과 단일 값.
export const OUTING = {
  legs: [
    {
      tag: "출발",
      place: "대치동 자택",
      score: 62,
      grade: "보통",
      level: "caution",
      detail: "13:50 · 체감 35° · 자외선 매우 높음 · 미세먼지 보통",
      compact: "체감 35° · UV 매우높음",
    },
    {
      tag: "도착",
      place: "서울아산병원",
      score: 52,
      grade: "주의",
      level: "danger",
      detail: "14:30 · 체감 36° · 자외선 매우 높음 · 미세먼지 나쁨 82",
      compact: "체감 36° · PM10 82",
    },
  ],
  advice: "오후 2~4시 외출은 피하고, 양산과 물을 준비하세요.", // 가족·컨시어지용 압축 표현
  adviceElder:
    "햇볕이 매우 강합니다. 밝은 색 긴팔과 챙 넓은 모자를 쓰시고, 병원 근처는 공기가 나쁘니 마스크를 끼세요.",
  kit: ["양산", "챙 넓은 모자", "KF94 마스크", "생수 500ml", "얇은 긴팔"],
  source: "100점 감점식",
  asOf: "14:00 기준",
  // 보호자 카드 3열 요인 그리드 (디자인 콘솔)
  factors3: [
    { label: "실내 온도", value: "31° 주의", level: "caution" },
    { label: "실외 체감", value: "36°", level: "neutral" },
    { label: "미세먼지", value: "나쁨 82", level: "danger" },
  ],
  // 문장형 안내 — 이미 한 조치를 말한다 (어르신 안내 + 컨시어지 준비물 자동 반영)
  adviceGuardian:
    "병원 근처 미세먼지가 나쁨입니다. 어머니께 KF94 마스크와 양산을 안내했고, 컨시어지 준비물에도 자동 반영됐습니다.",
};

// ─── 어르신 화면 전용 뷰 데이터 — 핸드오프 06 §3 · §8 ─────────────────────────
// 내부 용어(주/부 동행)를 어르신 노출 카피로 번역한 값. 관제·컨시어지 화면은 CONCIERGES 사용.

export const ELDER_VISITORS = [
  {
    initials: "박지현",
    displayName: "박지현 선생님",
    relationLabel: "늘 오시던 분 · 오후 1시 50분", // 방문 횟수 기반 분기 (첫 방문 = "처음 오시는 분" + 사진)
    avBg: "#0A1F3C",
    avFg: "#FFFFFF",
    isPrimary: true,
  },
  {
    initials: "서다인",
    displayName: "서다인 선생님",
    relationLabel: "함께 오는 분 · 짐과 접수 담당",
    avBg: "linear-gradient(180deg,#FBF6EC,#F4EEE1)",
    avFg: "#0A1F3C",
    isPrimary: false,
  },
];

// done: null → 상태(state.elder.medTaken) 의존. 미완료는 1건만 (실패 목록 금지 — 06 §3.6)
export const MED_DOSES = [
  { slotLabel: "아침", drugs: "혈압약 · 아스피린", done: true },
  { slotLabel: "점심", drugs: "당뇨약", done: true },
  { slotLabel: "저녁 7시", drugs: "혈압약 · 콜레스테롤약", done: null },
];

// 실내 센서 카드 — cooled 상태별 표현 (06 §3.7). 데모 목 값: 센서 실연동 전.
export const INDOOR = {
  hot: {
    tempLabel: "31°",
    sub: "습도 62% · 에어컨 꺼짐",
    level: "danger",
    alertTitle: "집 안이 너무 덥습니다",
    alertBody: "실외보다 2도 낮지만 온열질환 주의 구간입니다. 에어컨을 켜고 물을 드세요.",
    btnLines: ["에어컨 켜고", "가족에게 알리기"],
  },
  cooled: {
    tempLabel: "28°",
    sub: "습도 58% · 에어컨 가동 중",
    level: "ok",
    alertTitle: "적정 온도로 내려갔습니다",
    alertBody: "가족과 컨시어지에게도 알렸습니다. 물을 한 잔 드시고 쉬세요.",
    btnLines: ["가족에게", "알림 완료"],
  },
};

// 실외 현재 — 지금 우리 동네 (06 §3.5). level → 색 매핑은 클라이언트.
export const ELDER_NOW = {
  tempLabel: "33°",
  feelsLabel: "체감 35° · 맑음",
  factors: [
    { label: "자외선", value: "매우 높음", level: "danger" },
    { label: "미세먼지", value: "보통 45", level: "caution" },
    { label: "습도", value: "62%", level: "neutral" },
    { label: "비 올 확률", value: "10%", level: "neutral" },
  ],
};

// 오늘 나는 — 2026-08-12 어르신화면 시트 '오늘' 2번.
// 보호자 홈의 "오늘 어머니는"과 같은 내용을 어르신 화면에서는 1인칭으로 보여주되,
// 어제와 비교할 수 있게 한다. 좋다/나쁘다로 판정하지 않고 어제 숫자를 나란히 둔다 —
// 어르신 화면에서 '나빠졌다'는 판정은 불안만 남긴다 (06 §7).
export const TODAY_ME = {
  line: "어제보다 조금 더 걸으셨습니다.",
  rows: [
    { name: "걸음", today: "3,140", yesterday: "2,880", unit: "걸음", dir: "up" },
    { name: "잠", today: "6.2", yesterday: "6.6", unit: "시간", dir: "down" },
    { name: "약", today: "2", yesterday: "3", unit: "번 드심", dir: "down" },
  ],
  foot: "잰 것을 그대로 보여드립니다. 좋고 나쁨은 선생님이 보고 말씀드립니다.",
};

// 안심환경 팝업 — 2026-08-12 어르신화면 시트 '건강' 2번.
// "날씨가 좋으니 환기해주세요" 같은 한 문장. 판단(에어컨을 켜라)이 아니라 권유다.
// 에어컨을 켜고 가족에게 알리는 버튼은 같은 시트 대표 피드백으로 삭제했다.
export const AMBIENT_TIPS = [
  {
    id: "air",
    when: "지금",
    title: "창문을 열어 두기 좋은 때입니다",
    body: "바깥 미세먼지가 보통이고 바람이 붑니다. 30분만 열어 두셔도 공기가 바뀝니다.",
    tone: "ok",
  },
  {
    id: "heat",
    when: "오후 1시~4시",
    title: "가장 더운 시간입니다",
    body: "이 시간엔 바깥일을 미루시고, 물을 자주 드세요.",
    tone: "caution",
  },
  {
    id: "night",
    when: "밤",
    title: "화장실 가실 때 불을 켜세요",
    body: "밤에 어두운 채로 움직이시면 발을 헛디디기 쉽습니다.",
    tone: "caution",
  },
];

// 오늘 여쭤볼 것 — 출처 3종(elder|family|concierge)이 요점. 데이터 방화벽 원칙 (06 §3.3)
export const ASK_DOCTOR = [
  { seq: 1, text: "어지러운 게 약 때문인지 여쭤보기", source: "elder", sourceLabel: "어르신이 말씀하신 것" },
  { seq: 2, text: "무릎 통증 약을 같이 먹어도 되는지", source: "family", sourceLabel: "아들 민수가 남긴 것" },
  { seq: 3, text: "다음 진료는 언제 와야 하는지", source: "concierge", sourceLabel: "컨시어지가 확인할 것" },
];

export const VOICE_MSG = {
  fromLabel: "아들 민수",
  durationSec: 28,
  transcript: "어머니, 오늘 병원 잘 다녀오세요. 저녁에 다시 전화드릴게요.",
};

// 어르신 → 가족 음성 메시지 수신자 (06 · 가족 탭)
// 어르신에게 타이핑은 장벽이다 — 목소리만 남기면 되게 한다.
export const VOICE_TO = [
  { id: "v1", initials: "민수", name: "아들 민수", sub: "주 보호자 · 서울", avBg: "#0A1F3C", avFg: "#FFFFFF" },
  { id: "v2", initials: "지영", name: "차녀 지영", sub: "LA · 지금 새벽", avBg: "#E8DFCB", avFg: "#7A5C28" },
  { id: "v3", initials: "현우", name: "삼남 현우", sub: "시드니 · 지금 오후", avBg: "#DCE5F0", avFg: "#33507A" },
  { id: "all", initials: "가족", name: "가족 모두", sub: "세 자녀에게 함께", avBg: "#1E7A5A", avFg: "#FFFFFF" },
];

// 어르신 "해주세요" — 대행 · 구매 요청 프리셋 (GNB 4번째 탭)
// est 0 = 멤버십 포함 (결제 없음) · 그 외는 결제권한(REQ-07)에 따라 본인 결제 또는 보호자 승인
export const ASK_SERVICES = [
  { id: "a1", g: "약 · 병원", name: "약국에서 약 타다 주세요", est: 15000, note: "처방전 · 상비약 구매대행" },
  { id: "a2", g: "약 · 병원", name: "병원 예약해 주세요", est: 0, note: "멤버십 포함 · 비용 없음" },
  { id: "a3", g: "약 · 병원", name: "병원에 같이 가 주세요", est: 0, note: "연 4회 포함분 사용" },
  { id: "a4", g: "장보기", name: "장 봐다 주세요", est: 40000, note: "생필품 · 먹을 것 · 영수증 사진" },
  { id: "a5", g: "장보기", name: "반찬 사다 주세요", est: 25000, note: "단골 반찬가게" },
  { id: "a6", g: "장보기", name: "세탁물 맡기고 찾아 주세요", est: 12000, note: "왕복 대행" },
  { id: "a12", g: "장보기", name: "큰 장보기 (제사 · 명절)", est: 80000, note: "부피 큰 물건 · 차량 이용" },
  { id: "a13", g: "약 · 병원", name: "무릎 보호대 사다 주세요", est: 62000, note: "의료용 · 사이즈 확인 후 구매" },
  { id: "a7", g: "집안일", name: "전구 · 건전지 갈아 주세요", est: 0, note: "안심방문 때 함께 · 부품비 별도" },
  { id: "a8", g: "집안일", name: "무거운 것 옮겨 주세요", est: 0, note: "멤버십 포함" },
  { id: "a9", g: "바깥일", name: "은행에 같이 가 주세요", est: 0, note: "동행만 · 대리 인출은 하지 않습니다" },
  { id: "a10", g: "바깥일", name: "주민센터 서류 떼다 주세요", est: 3000, note: "수수료 실비" },
  { id: "a11", g: "말동무", name: "잠깐 얘기하러 와 주세요", est: 0, note: "멤버십 포함 · 30분" },
  { id: "a14", g: "약 · 병원", name: "병원에 보호자로 와 주세요", est: 90000, note: "자녀 도착 전까지 보호자 역할 대행" },
  { id: "a15", g: "바깥일", name: "차로 데려다 주세요", est: 35000, note: "대리운전 제휴 · 거리에 따라 변동" },
];

// 배송 — 금액 필드 없음(스키마 방어선). cart는 가족 앱(REQ-07)에서 바뀌고 여기선 읽기만.
export const DELIVERY = {
  dayLabel: "토요일",
  timeLabel: "오전 10시",
  itemsBase: "혈압약 · 시험지 · 위생용품 (3가지)",
  itemsWithCart: "혈압약 · 시험지 · 위생용품 · 파스 · 커프 (5가지)",
};

// 자녀 확인 기록 — 상대 시간만, 미확인 카운트 금지 (06 §3.10). GUARDIANS 페르소나와 동일 인물.
export const FAMILY_SEEN = [
  {
    initials: "민수",
    displayName: "아들 민수",
    seenLabel: "어제 저녁 리포트를 봤습니다",
    avBg: "#0A1F3C",
    avFg: "#FFFFFF",
  },
  {
    initials: "지영",
    displayName: "딸 지영",
    seenLabel: "오늘 아침에 확인했습니다",
    avBg: "linear-gradient(180deg,#FBF6EC,#F4EEE1)",
    avFg: "#0A1F3C",
  },
  {
    initials: "현우",
    displayName: "아들 현우",
    seenLabel: "그저께 확인했습니다",
    avBg: "linear-gradient(180deg,#FBFAF7,#F5F3EE)",
    avFg: "#40413F",
  },
];

// ⚙ 오늘 배차의 단일 원본 (09 §6) — 그리드·페어보드·KPI·동선이 전부 여기서 파생.
// s/e는 시(hour) 소수. kind가 null인 건(j2)은 화면에서 상태로 계산:
// sosDispatched → 'sos', visit.checkedIn → 'active', 아니면 'planned'.
export const JOBS = [
  { id: "j1", t: "09:00", s: 9, e: 11.5, client: "오태식 (77)", job: "KMI 검진 · 수면내시경 보호자", lead: "박지현", sup: "오하늘", kind: "done", note: "동성 페어 · 검진 대행 자격 보유 · 순환 규칙 통과", state: "완료" },
  { id: "j2", t: "13:50", s: 13.83, e: 16.17, client: "김순자 (78)", job: "서울아산 순환기내과 · 차량", lead: "박지현", sup: "서다인", kind: null, note: "동성 페어 · 단골 리드 유지 · 연속 2회차", state: "진행중" },
  { id: "j3", t: "15:00", s: 15, e: 17, client: "이영호 (81)", job: "분당서울대 정형외과", lead: "한서연", sup: "오하늘", kind: "planned", note: "동성 페어 · 신규 조합 (유착 방지)", state: "확정" },
  { id: "j4", t: "16:20", s: 16.33, e: 19, client: "한복자 (79)", job: "투석 동행 · 왕복", lead: "정민호", sup: null, kind: "sos", note: "부 동행 미배정 · 투석은 수습 배차 불가", state: "짝 없음" },
  { id: "j5", t: "17:00", s: 17, e: 19, client: "박말순 (83)", job: "강동경희대 내과 · 도보", lead: "윤세라", sup: "최도현", kind: "planned", note: "동일 페어 3회 연속 — 다음 배정은 순환 필요 (4회부터 위반)", state: "순환 경고" },
  { id: "j6", t: "18:10", s: 18.17, e: 20, client: "최정자 (75)", job: "약국 · 장보기 동행", lead: "서다인", sup: "김도윤", kind: "planned", note: "리드 연속 근무 7.6시간 · 주의 구간이나 상한 내", state: "확정" },
];

// 병력 기반 우선 날씨 — 사람이 설정한다 (자동 추론 금지 · 회의 1 조건부 반영).
// factors 값은 어르신 화면 그리드 라벨과 일치해야 정렬이 작동한다.
export const WEATHER_FACTORS = ["기온", "자외선", "미세먼지", "습도", "비 올 확률"];

export const PRIORITY_PRESETS = [
  { label: "심혈관 · 갑상선", factors: ["기온"], hint: "온도 변화에 취약 — 고온·한파 우선" },
  { label: "호흡기", factors: ["미세먼지", "습도"], hint: "미세먼지·습도 우선" },
  { label: "피부 · 안질환", factors: ["자외선"], hint: "자외선 우선" },
  { label: "관절", factors: ["습도", "비 올 확률"], hint: "습도·강수 우선" },
];

// 어르신 스토어 — 부모가 담고 결제권한에 따라 분기 (회의 6 · REQ-07).
// 금액 비노출 원칙(06)의 예외: 직접 결제 상거래 화면은 금액 표기가 필수.
export const STORE_ITEMS = [
  { id: "s1", name: "파스 (대형 20매)", price: 12000 },
  { id: "s2", name: "혈당 시험지 50매", price: 28000 },
  { id: "s3", name: "KF94 마스크 30매", price: 15000 },
  { id: "s4", name: "생수 2L 12병", price: 9800 },
  { id: "s5", name: "종합 영양제 (2개월)", price: 39000 },
  { id: "s6", name: "무릎 보호대 (의료용)", price: 62000 },
];

// MOU 병원 — 진료 과목마다 한 곳 이상 (회의 8)
//
// note 는 보호자 화면에 그대로 노출된다. 2026-08-12 요청으로 고객 화면에서
// '패스트트랙' 표기를 뺐으므로 여기 문구도 우선 진료를 약속하지 않는 말로 바꿨다.
// fast 플래그는 관제·경영 콘솔의 제휴 관리(협의 상태)용으로 그대로 둔다.
export const MOU_HOSPITALS = [
  { dept: "내과", name: "강남세브란스", note: "예약 API 부분 연동", fast: true },
  { dept: "정형외과", name: "분당서울대병원", note: "재진 예약 대기 2일", fast: true },
  { dept: "재활의학과", name: "고대구로병원", note: "휠체어 동선 확인 완료", fast: false },
  { dept: "순환기내과", name: "서울아산병원", note: "예약 슬롯 협의 완료", fast: true },
  { dept: "안과", name: "삼성서울병원", note: "백내장 수술 연계", fast: false },
  { dept: "치과", name: "강남 미소치과의원", note: "방문 진료 협의 중", fast: false },
];

// 옵션 서비스 — 신규 등록·판매 프로세스 (회의 9 · REQ-04 야간 외주)
// 보험은 GA 등록 전 모집 금지(H4) — 기능 플래그로 잠금
export const OPTION_SERVICES = [
  {
    key: "night",
    name: "야간 출동 서비스 (외주)",
    desc: "야간 긴급 출동 — 외주 파트너 수행 · 가구별 옵션",
    price: "월 12,000원 (확정 전)",
    locked: false,
  },
  {
    key: "escort",
    name: "추가 병원동행 (건별)",
    desc: "기본 연 4회 초과분 · 건별 이용",
    price: "건당 48,000원",
    locked: false,
  },
  {
    key: "insurance",
    name: "보험 연계",
    desc: "보험회사 입점 연계 상품",
    price: "준비 중",
    locked: true,
    lockNote: "GA 등록 후 오픈 (등록 전 모집 금지 · 기능 플래그 잠금)",
  },
];

// 실시간 건강 요약 5지표 — 지표별 상태 라벨 병행 (색만으로 상태 전달 금지)
// 2026-08-12 대표 피드백 — 혈압을 빼고 혈중 산소와 스트레스를 넣었다.
// 혈압은 워치가 재는 값이 아니라 별도 측정이 필요해 "실시간 요약"에 두면
// 오해를 부른다 (방문 때 측정해 21항목에 기록한다).
export const VITALS = [
  { name: "심박수", value: "72", unit: "bpm", status: "정상 범위", level: "ok" },
  { name: "혈중 산소", value: "97", unit: "%", status: "정상 범위", level: "ok" },
  { name: "걸음 수", value: "3,140", unit: "걸음", status: "목표의 62%", level: "neutral" },
  { name: "수면", value: "6.2", unit: "시간", status: "3일 평균 하락", level: "caution" },
  { name: "스트레스", value: "58", unit: "", status: "다소 높음 · 주중 평균 44", level: "caution" },
  { name: "복약 준수율", value: "86", unit: "%", status: "미이행 2회 · 저녁 대기", level: "caution" },
];

// 담당 컨시어지 — 관계 연속성("12번 모셨습니다")이 신뢰의 근거
export const CARE_TEAM = {
  dateLabel: "8/23 (금) 동행",
  members: [
    {
      initials: "박지현",
      name: "박지현",
      role: "주 동행",
      career: "간호사 · 상급종합 14년 · 평점 4.9",
      relation: "이 댁을 12번 방문했습니다",
      avBg: "#0A1F3C",
      avFg: "#FFFFFF",
    },
    {
      initials: "서다인",
      name: "서다인",
      role: "부 동행",
      career: "요양보호사 · 차량 · 접수와 서류 담당",
      relation: "이번이 두 번째입니다",
      avBg: "linear-gradient(180deg,#FBF6EC,#F4EEE1)",
      avFg: "#0A1F3C",
    },
  ],
  trust:
    "두 사람 모두 신원조회와 배상책임보험을 마쳤습니다. 방문 전날 저녁에 두 분의 사진과 이름을 다시 보내드립니다 — 문 앞에서 확인하실 수 있도록.",
};

// ─── 컨시어지 앱 디자인 콘솔 정합분 ────────────────────────────────────────────

// 동행 완료 리포트 — AI 초안 · 컨시어지 확정 (8.4 Human-in-the-loop) · 2인 서명
export const AI_REPORT = {
  draft:
    "14:32 도착, 순환기내과 접수 완료. 대기 40분 중 어르신 컨디션 양호. 처방 3종 수령, 약국 동행 후 15:50 귀가 완료. 다음 외래 8월 23일 안내드렸습니다.",
  hitl: "AI가 초안을 만들고 컨시어지가 확정합니다 — 검수 없이는 가족에게 전달되지 않습니다 (8.4 Human-in-the-loop)",
  signRule:
    "사고·분쟁 시 두 사람의 기록이 각각 남아야 증언이 됩니다 — 한 명만 서명한 리포트는 발송되지 않습니다.",
};

// 어르신 안부 전화 — 어르신은 받기만 한다. 발언은 자동으로 질문·리포트에 담긴다.
// 어르신 화면 카피에 시스템 주어(AI가~)를 쓰지 않는다 (06 §7).
export const AI_CALL = {
  timeLabel: "오전 10시",
  body: "오전 10시에 전화가 와요.\n받기만 하시면 됩니다.",
  yesterday: "어제 통화 — \"무릎이 조금 아프다\"고 하셨어요. 선생님에게 전달해 두었어요.",
  autoNote: "말씀하신 내용은 '오늘 여쭤볼 것'에 자동으로 담깁니다.",
};

// 보호자 AI 케어 어시스턴트 — 답변은 항상 근거(src) 동반. 의료 판단 아님.
export const AI_ASSISTANT_QA = [
  {
    q: "요즘 수면은 어때요?",
    a: "최근 3일 평균 6.2시간으로 지난주(6.4시간)보다 조금 줄었습니다. 낮잠은 늘지 않았고, 저녁 복약 후 취침이 늦어진 날이 이틀 있었습니다.",
    src: "워치 수면 데이터 · 최근 7일",
  },
  {
    q: "다음 진료 전에 챙길 게 있나요?",
    a: "8/23 순환기내과 외래 전, '어지러움' 발언이 2회 기록되어 질문 목록에 올라가 있습니다. 혈압 기록은 컨시어지가 지참합니다.",
    src: "안부 전화 기록 · 공유 캘린더",
  },
  {
    q: "이번 주 복약은 잘 하셨나요?",
    a: "주간 복약 19/21회로 지난주보다 2회 늘었습니다. 미이행 2회는 모두 저녁분이라, 저녁 알림을 30분 앞당기는 것을 제안드립니다.",
    src: "복약 체크 기록 · 최근 7일",
  },
];

// 가족 초대 — 주 보호자만 발급. 링크 참여 시 주 보호자 알림 + 제거 권한은 주 보호자 전용
export const INVITE = { link: "kcare.app/i/7F2K9Q", rule: "7일 유효 · 1회용 · 참여 시 주 보호자에게 알림" };

export const PEOPLE_KPIS = [
  { k: "가입 가구", v: "128", sub: "+12 이번 달", color: "#0A1F3C" },
  { k: "활성 어르신", v: "132", sub: "멤버십 유지 97%", color: "#0A1F3C" },
  { k: "보호자 계정", v: "241", sub: "주 128 · 부 113", color: "#0A1F3C" },
  { k: "컨시어지 재직", v: "24", sub: "수습 5 · 시니어 4", color: "#0A1F3C" },
  { k: "컨시어지 90일 유지", v: "87%", sub: "업계 평균 61%", color: "#1E7A5A" },
  { k: "보호자 NPS", v: "62", sub: "리포트 만족 기여 1위", color: "#1E7A5A" },
];

// 어르신 케어 성과 — 월 집계만 (개별 사건 비노출)
export const CARE_OUTCOMES = [
  { k: "복약 순응률", v: "92%", target: "목표 90%", color: "#1E7A5A" },
  { k: "병원 동행 정시율", v: "91%", target: "목표 95%", color: "#8A5D12" },
  { k: "일정 조정 권고 수용", v: "68%", target: "목표 60%", color: "#1E7A5A" },
  { k: "리포트 가족 전달", v: "1.4h", target: "목표 2h 내", color: "#1E7A5A" },
];

export const LIFECYCLE_STAGES = [
  { k: "온보딩 (첫 30일)", n: 18, w: 14, color: "#3B5C8A", note: "이탈의 61%가 이 구간" },
  { k: "정착", n: 71, w: 55, color: "#1E7A5A" },
  { k: "확장 (옵션 부착)", n: 24, w: 19, color: "#B08D57" },
  { k: "갱신 (D-30 이내)", n: 4, w: 3, color: "#8A5D12" },
  { k: "위기 (개입 중)", n: 11, w: 9, color: "#C0392B" },
];

export const CRM_TIMELINE = {
  김순자: [
    { at: "오늘", kind: "동행", text: "13:50 서울아산 순환기내과 · 박지현 + 서다인" },
    { at: "7/28", kind: "리포트", text: "관찰 리포트 가족 전달 · 김민수 열람" },
    { at: "7/26", kind: "구매", text: "혈압계 구매대행 · 보호자 승인 완료" },
    { at: "7/21", kind: "안부", text: "AI 안부 콜 — \"입맛이 없다\" 2회 → 식사 확인 등록" },
    { at: "7/12", kind: "SOS", text: "접수 41초 초동 · 확인 후 해제" },
    { at: "6/30", kind: "결제", text: "월 멤버십 정기 결제 · 티어 1" },
  ],
  이영호: [
    { at: "7/29", kind: "알림", text: "낙상 복합 알림 → 경과 관찰 전환" },
    { at: "7/25", kind: "예약", text: "분당서울대 정형외과 동행 예약 (내일)" },
    { at: "7/2", kind: "가입", text: "온보딩 시작 · 주보호자 이정민" },
  ],
  박말순: [
    { at: "7/29", kind: "워치", text: "6시간 무수집 — 배터리 확인 콜 예정" },
    { at: "7/18", kind: "심사", text: "등급 갱신 심사 접수" },
    { at: "7/8", kind: "동행", text: "강동경희대 내과 · 재택 방문" },
  ],
  한복자: [
    { at: "오늘", kind: "동행", text: "16:20 투석 왕복 · 짝 재배치 완료" },
    { at: "7/23", kind: "동행", text: "재활의학과 2회차" },
  ],
  오태식: [
    { at: "오늘", kind: "동행", text: "09:00 KMI 검진 완료 · 리포트 검수 대기" },
    { at: "7/15", kind: "옵션", text: "야간 출동 옵션 부착" },
  ],
  최정자: [
    { at: "7/29", kind: "브리핑", text: "외출지수 34 — 일정 조정 권고" },
    { at: "7/10", kind: "결제", text: "갱신 D-21 안내 발송" },
  ],
};

// ════ 신뢰 거버넌스 — 해자 (설계에 박힌 신뢰: 동의 · 접근 공개 · 게이팅) ════
// 나중에 붙일 수 없는 것이 해자다. 모든 열람은 기록되고, 기록은 가족에게 공개된다.
export const CONSENTS = [
  { k: "위치 정보 (동행 중)", state: "동의", until: "2026.08", on: true, expiring: "D-15" },
  { k: "방문기록 영상 (요약 30초)", state: "동의", until: "2027.02", on: true },
  { k: "건강 신호 (워치)", state: "동의", until: "2027.02", on: true },
  { k: "제휴 병원 정보 제공", state: "예약 시 건별 동의", until: "—", on: false },
];

export const ACCESS_LOG = [
  { at: "오늘 13:12", who: "박지현 (컨시어지)", what: "케어 프로필 · 선호 카드", why: "동행 준비" },
  { at: "오늘 09:40", who: "관제 (강남지점)", what: "일정 · 워치 상태", why: "배차 브리핑" },
  { at: "어제 20:00", who: "AI 리포트 시스템", what: "방문 기록", why: "리포트 초안 작성" },
  { at: "7/26", who: "김지영 (부 보호자)", what: "케어 리포트", why: "열람" },
];

export const TRUST_METRICS = [
  { k: "동의 최신화율", v: "98%", note: "만료 30일 전 자동 갱신 안내" },
  { k: "접근 기록 공개", v: "100%", note: "모든 열람이 가족에게 공개" },
  { k: "삭제 요청 처리", v: "24h 내", note: "탈퇴 시 데이터 삭제 SLA" },
  { k: "민감정보 게이팅 위반", v: "0건", note: "주소 · 건강 접근 통제" },
];

// NPS 수집 루프 — 동행 후 24h 설문 · 비추천은 즉시 회복 플로우 (점수보다 회복 속도)
export const NPS_REASONS = ["도착 지각", "소통 아쉬움", "준비물 누락", "리포트 지연", "기타"];

export const NPS_LOOP = {
  respond: "71%",
  mix: [
    { k: "추천 (9–10)", v: "58%", color: "#1E7A5A" },
    { k: "중립 (7–8)", v: "24%", color: "#B08D57" },
    { k: "비추천 (0–6)", v: "18%", color: "#C0392B" },
  ],
  recovery: [
    { k: "24h 내 회복 연락", v: "100%", note: "SLA — 매니저 직접 콜" },
    { k: "회복 후 재응답", v: "+4.2점", note: "재설문 평균 상승" },
    { k: "비추천 → 이탈", v: "2가구", note: "전분기 5가구 → 감소" },
  ],
};

// ════ 확장 — 병원 파트너 레코드 (파트너도 관계 관리: 담당·최근 접점·실적) ════
export const HOSPITAL_PARTNERS = {
  강남세브란스: { contact: "예약팀 김OO", last: "7/28 슬롯 협의", trips: 14, slots: "내일 오전 2", status: "양호" },
  분당서울대병원: { contact: "원무 박OO", last: "7/21 재진 프로세스", trips: 9, slots: "D+2 1", status: "양호" },
  고대구로병원: { contact: "재활센터 이OO", last: "7/15 휠체어 동선", trips: 6, slots: "협의 필요", status: "재협의" },
  서울아산병원: { contact: "협력센터 최OO", last: "어제 패스트트랙 확인", trips: 17, slots: "오늘 오후 1", status: "양호" },
  삼성서울병원: { contact: "안과 코디 정OO", last: "6/30 수술 연계", trips: 4, slots: "—", status: "점검" },
  "강남 미소치과의원": { contact: "실장 한OO", last: "7/10 방문진료 협의", trips: 2, slots: "협의 중", status: "협의" },
};

// ════ 경영 주간 AI 브리핑 — 능동형: 경영에게도 묻기 전에 요약 (집계 전용) ════
export const EXEC_BRIEF = {
  date: "7/28 (월) 주간 생성",
  summary: "가입 +12가구 · 컨시어지 유지율 87% 유지 — 주의 신호는 부보호자 열람률(64%)과 위기 11가구입니다.",
  items: [
    { k: "사람", text: "수습 5명 중 2명이 8월 일반 전환 요건 도달 예상 — 투석 배차 여력 +15%" },
    { k: "리스크", text: "폭염 지속 시 외출지수 하락 → 8월 첫 주 배차 12% 감소 전망 · 재택 방문 전환 권고" },
    { k: "권고", text: "가입비 정책(12 – 15만) 확정이 퍼널 최대 병목 — 이번 주 의사결정 안건 상정" },
  ],
};

// ════ 동네 소식 피드 — 동·구 단위 재난·안전·정책·바우처 (디자인 콘솔 복원 · 행정 데이터 연동 대상) ════
export const NEIGHBORHOOD_FEED = [
  { id: "nb1", kind: "재난", at: "오늘 11:00", title: "폭염 특보 발효 — 강남구", body: "14~17시 야외활동 자제 권고. 오늘 어머니 동행은 차량 대기 최소화로 이미 조정되어 있습니다.", tone: "danger" },
  { id: "nb2", kind: "안전", at: "어제", title: "대치동 무더위 쉼터 운영", body: "대치1동 주민센터 · 은마상가 경로당 — 평일 09~18시. 산책 코스에 반영해 드립니다.", tone: "amber" },
  { id: "nb3", kind: "바우처", at: "7/28", title: "강남구 어르신 교통비 지원 (분기 3만 원)", body: "만 75세 이상 · 8/15 신청 마감 — 김순자님이 대상에 해당합니다.", tone: "gold", action: "신청 대행 요청" },
  { id: "nb4", kind: "정책", at: "7/25", title: "서울시 안심콜 서비스 확대", body: "독거 어르신 안부 확인 콜 — K-CARE AI 안부 전화와 중복 없이 병행할 수 있습니다.", tone: "muted" },
];

export const FEED_TONE = {
  danger: { fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  amber: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  gold: { fg: "#7A5C28", bg: "rgba(176,141,87,.16)" },
  muted: { fg: "#5C5A54", bg: "rgba(10,31,60,.06)" },
};

// ════ 웨어러블 — 갤럭시 Fit3 (Samsung Health → Health Connect → 폰 컴패니언, 준실시간 동기화) ════
// 정직 표기: Fit3는 서드파티 SDK 미제공 — 실시간 스트리밍이 아니라 5분 주기 동기화.
// 낙상 SOS는 Fit3 → 보호자 직통이 기본, 관제 연계는 컴패니언 앱 경유 (삼성 파트너 협의 항목).
export const FIT3_INFO = {
  device: "갤럭시 Fit3",
  path: "Samsung Health → Health Connect → K-CARE 컴패니언(폰)",
  cycle: "5분 주기 동기화 (준실시간)",
  lastSync: "14:02",
  battery: "62%",
};

export const FIT3_METRICS = [
  { icon: "heart", name: "심박수", value: "72", unit: "bpm", status: "정상 범위 · 오늘 평균 71", level: "ok", action: "고 · 저심박 지속 시 보호자 알림 + 진료 상담 안내" },
  { icon: "activity", name: "활동량", value: "3,140", unit: "걸음", status: "목표의 62% · 활동 52분", level: "neutral", action: "활동량 급감 시 컨디션 변화 신호로 확인 콜" },
  { icon: "moon", name: "수면", value: "6.2", unit: "시간", status: "수면 점수 71 · 깊은잠 1.1h", level: "caution", action: "수면 부족 · 급변 시 생활 관리 안내" },
  { icon: "drop", name: "혈중산소 SpO₂", value: "96", unit: "%", status: "야간 평균 95%", level: "ok", action: "평소보다 지속 저하 시 병원 상담 안내" },
  { icon: "wave", name: "스트레스", value: "보통", unit: "", status: "HRV 기반 추정", level: "neutral", partner: true, action: "높은 상태 지속 시 휴식 · 안부 콜" },
  { icon: "alert", name: "낙상 감지", value: "이상 없음", unit: "", status: "어제 복합 알림 1건 → 오탐 확인", level: "ok", sos: true, action: "낙상 감지 → 보호자 알림 → 무응답 시 관제 확인" },
  { icon: "pin", name: "위치", value: "자택", unit: "", status: "스마트폰 연동 · 대치동", level: "ok", action: "외출 동선 확인 · 긴급 시 참고 (동행 중에만 상세)" },
  { icon: "watch", name: "착용 상태", value: "착용 중", unit: "", status: "마지막 수신 14:02 · 배터리 62%", level: "ok", action: "6시간 무수집 시 가족 알림 + 확인 콜" },
];

// ════ F7 진화형 케어 프로필 · F11-1 AI 안부콜 (/care-profile) ════
// 원칙: 프로필은 특정 AI에 종속되지 않게 저장 · 관측만 하고 진단하지 않는다 (9.4)
export const CP_KPIS = [
  { k: "누적 속성", v: "38", note: "쓸수록 깊어짐" },
  { k: "문진 생략률", v: "92%", note: "재방문 시 재설명 불필요" },
  { k: "단골 재지정", v: "68%", note: "선호 컨시어지 우선" },
  { k: "안부콜 응답률", v: "87%", note: "주 3회 · 화·목·토" },
];

export const CP_LOOP = [
  ["01", "수집", "대화 · 리포트 · 웨어러블 · 현장 관측"],
  ["02", "병합", "중복 제거 후 변화된 상태로 갱신"],
  ["03", "주입", "다음 상담·배차 시 컨텍스트로 자동 투입"],
  ["04", "개인화", "문진 제로 · 단골 배정 · 선제 조치"],
  ["05", "재이용", "만족도 상승 → 데이터가 다시 쌓임"],
];

export const CP_ATTRS = [
  { k: "거동 수준", v: "실내 보행 가능 · 외출 시 휠체어", src: "컨시어지 리포트", conf: "높음" },
  { k: "청력", v: "좌측 저하 · 우측 정상", src: "동행 중 대화 관측", conf: "높음" },
  { k: "선호 컨시어지", v: "박지현 (3회 연속 지정)", src: "예약 이력", conf: "높음" },
  { k: "복약", v: "혈압·콜레스테롤·아스피린 3종", src: "처방전 · 복약 기록", conf: "높음" },
  { k: "정서 상태", v: "주말 고립감 경향", src: "AI 안부콜 대화 분석", conf: "보통" },
  { k: "식이 제한", v: "저염 권고 (확인 필요)", src: "가족 발화 1회", conf: "낮음" },
];

export const CP_CALLS = [
  { d: "7/25", text: "식사·수면 모두 양호, 손주 이야기로 대화 지속", meta: "통화 6분 12초 · 발화량 평소 대비 +14%", state: "안정" },
  { d: "7/23", text: "“요즘 아무도 안 온다” 발화 · 반복 질문 2회", meta: "통화 4분 03초 · 고립감 표현 감지", state: "관찰" },
  { d: "7/20", text: "외출 계획 언급, 목소리 톤 평상 수준", meta: "통화 5분 30초", state: "안정" },
  { d: "7/18", text: "단어 찾기 지연 3회 · 날짜 혼동 1회", meta: "통화 5분 02초 · 인지 신호 누적 기록", state: "관찰" },
];

export const CP_GUARD = [
  "자살예방상담전화 109 안내 · 통화 연결 제안",
  "가족 앱 긴급 배너 · 관제 긴급 티커 동시 점등",
  "컨시어지 긴급 방문 배정 또는 119 연계 검토",
];

export const CP_BRIEF = {
  head: "7/26 13:50 김순자 (78) · 박지현(주) + 서다인(부)",
  why: "2인 방문에서는 어르신을 처음 만나는 사람이 한 명 섞입니다. 프로필 38개 속성을 다 읽을 시간은 없으니, 이 어르신에게만 해당하는 것 6개로 압축해 출발 전에 두 사람 모두에게 보냅니다.",
  dont: [
    ["왼쪽에서 말 걸지 않기", "왼쪽 귀 청력이 거의 없습니다. 대답이 없으면 못 들으신 겁니다 — 다시 크게 말하지 말고 오른쪽으로 돌아가세요."],
    ["팔을 잡아 끌지 않기", "오른쪽 어깨 회전근개 손상 이력. 부축은 반드시 왼팔 아래를 받쳐서."],
    ["“어머니”라고 부르지 않기", "본인이 싫어하십니다. ‘순자 어르신’으로 부릅니다."],
  ],
  do: [
    ["엘리베이터 앞에서 한 번 쉬기", "3층 계단 후 숨이 차십니다. 서두르면 다음부터 동행을 거부하십니다."],
    ["접수 번호표는 부 동행이 받기", "대기 줄에서 오래 서 계시면 어지러워하십니다. 주 동행은 어르신과 함께 앉아 있으세요."],
    ["진료 후 ‘오늘 여쭤볼 것’ 3건 확인", "어르신 앱에 담긴 질문입니다. 답을 듣고 리포트에 그대로 옮겨 적으세요."],
  ],
  delta: "6/14 방문 대비 — 보행이 눈에 띄게 느려졌고 휠체어를 처음 사용하십니다. 야간 화장실 횟수가 늘어 이뇨제 복용 시간 조정을 여쭤볼 예정입니다. 아들 민수 님이 9월 귀국 예정이라 그때 요양원 상담을 계획 중입니다.",
};

export const CP_TIMELINE = [
  { d: "7/24", k: "야간 배뇨", v: "주 2회 → 주 6회 · 이뇨제 복용 시간 확인 필요", src: "실내 센서 · 생활 리듬" },
  { d: "7/12", k: "보행 상태", v: "보행 보조 필요 → 휠체어 필요 (외출 시)", src: "컨시어지 리포트 · 3회 연속 기록" },
  { d: "6/28", k: "식사 준비", v: "직접 조리 → 주 2~3회 거름", src: "주방 활동 데이터 + 안부콜" },
  { d: "6/14", k: "청력", v: "왼쪽 귀 청력 저하 확인 · 응대 방식 변경", src: "컨시어지 관찰 → 이비인후과 확인" },
  { d: "5/30", k: "선호 호칭", v: "“어머니” 거부 · “순자 어르신”으로 통일", src: "안부콜 대화 추출" },
];

export const CP_GAPS = [
  { level: "높음", k: "복용 중인 건강기능식품", why: "약물 상호작용 확인에 필요 · 다음 방문 시 약통 사진으로 확인", when: "7/29 예정" },
  { level: "높음", k: "응급 시 1순위 연락처 우선순위", why: "3남매 중 누구부터인지 미확정 · 가족 회의 안건에 포함", when: "8/3 회의" },
  { level: "중간", k: "종교 · 식이 제한", why: "케어푸드 제안 전 필요 · 안부콜 대화에서 자연 확인", when: "다음 안부콜" },
  { level: "중간", k: "낙상 이력 상세 (시기·장소)", why: "가족 진술과 본인 진술이 다름 · 재확인 필요", when: "보류" },
  { level: "낮음", k: "취미 · 관심사", why: "생활지원 제안 개인화용 · 급하지 않음", when: "수시" },
];

export const CP_FEATURES = [
  { id: "F7-1", k: "프로필 자동 병합", state: "구현", note: "대화에서 흘러나온 정보를 중복 없이 병합" },
  { id: "F7-2", k: "문진 제로 재방문", state: "구현", note: "두 번째 예약부터 상태 재설명 불필요" },
  { id: "F7-3", k: "단골 우선 배정", state: "구현", note: "선호 컨시어지를 최우선 제안" },
  { id: "F7-4", k: "도메인 규칙 주입", state: "부분", note: "휠체어·치매·투석 케어 규칙 자동 반영" },
  { id: "F7-5", k: "예측 기반 추천", state: "Phase 2", note: "검진 주기·질환 이력 기반 선제 제안" },
];

// 가입 개월이 쌓이면서 AI가 할 수 있게 된 일 — 진화를 가구 눈높이에서 보여준다
export const CP_TENURE = [
  { m: "가입 1개월", attrs: "속성 6개", state: "past",
    can: ["이름 · 나이 · 거주 동 확인", "예약 접수와 동행 배차"],
    cant: "방문할 때마다 상태를 다시 여쭤봐야 했습니다 — 문진 생략률 0%" },
  { m: "가입 6개월", attrs: "속성 21개", state: "past",
    can: ["청력 · 보행에 맞춘 응대 방식 자동 반영", "선호 컨시어지 우선 배정", "동행 전 브리프 자동 생성"],
    cant: "변화가 '얼마나 빨리' 오는지는 아직 못 봤습니다" },
  { m: "가입 14개월 — 지금", attrs: "속성 38개", state: "now",
    can: ["보행 · 야간 배뇨 등 변화 추세 감지", "안부콜 대화에서 정서 · 인지 신호 추출", "문진 없이 재방문 (생략률 92%)"],
    cant: "낙상 '위험 예측'은 아직 — 회사 전체 사고 라벨이 34건뿐입니다" },
  { m: "가입 24개월 — 예정", attrs: "속성 50+ 예상", state: "next",
    can: ["계절 · 질환 주기 기반 선제 제안", "검진 주기 자동 리마인드", "이 어르신에게 맞는 안부콜 시나리오"],
    cant: "" },
];

export const CP_GLOSSARY = [
  { k: "장기요양등급", en: "LTC Grade", cat: "제도", text: "국가가 어르신의 돌봄 필요 정도를 1~5등급과 인지지원등급으로 판정하는 제도. 등급을 받으면 방문요양·주야간보호 비용의 대부분을 건강보험공단이 부담합니다." },
  { k: "본인부담금", en: "Co-payment", cat: "비용", text: "전체 진료비 중 환자가 직접 내는 몫. 나머지는 건강보험이 냅니다. 등급·소득 수준에 따라 15~20% 선이며 감경 대상이면 더 낮아집니다." },
  { k: "진료비 세부산정내역서", en: "Itemized Bill", cat: "서류", text: "진료비가 항목별로 얼마인지 적힌 서류. 실손보험 청구에 반드시 필요하며, 컨시어지가 현장에서 함께 받아 옵니다." },
  { k: "외래 vs 입원", en: "Outpatient / Inpatient", cat: "진료", text: "외래는 당일 진료 후 귀가, 입원은 병상에서 하루 이상 머무는 것. 동행 서비스 시간과 비용, 보험 보장 범위가 달라집니다." },
  { k: "처방전 유효기간", en: "Rx Validity", cat: "복약", text: "처방전을 받은 날부터 보통 3일(장기 처방은 별도 표기) 안에 약국에서 조제해야 합니다. 지나면 다시 진료를 받아야 합니다." },
  { k: "외출 컨디션 점수", en: "Outing Score", cat: "K-CARE", text: "기온·체감·미세먼지·자외선·강수를 100점에서 깎아 계산한 그날의 외출 안전도. 60점 아래면 일정 조정을 권고합니다." },
];

// ════ 어르신 기본 속성 — 성별 · 장애 정도 · 보훈 · 장기요양등급 ════
// 표기 원칙: 장애등급제 폐지(2019) 이후 법령 표기를 따른다 —
// "장애의 정도가 심한 장애인 / 심하지 않은 장애인" (구 1~6급 표기 금지).
// 장애·보훈은 민감정보(S1/S2) — 케어 수행에 필요한 범위만 칩으로 표시하고 열람은 기록된다.
export const ELDER_TAGS = {
  김순자: { sex: "여", age: 78, disability: "심한 장애 (지체)", veteran: null, ltc: "장기요양 3등급",
    care: "휠체어 이송 · 계단 동선 확인 · 활동지원 병행" },
  이영호: { sex: "남", age: 81, disability: null, veteran: "국가유공자 (참전)", ltc: "장기요양 4등급",
    care: "보훈병원 우선 이용 · 보훈 감면 대상 안내" },
  박말순: { sex: "여", age: 83, disability: "심하지 않은 장애 (청각)", veteran: null, ltc: "장기요양 2등급",
    care: "필담 카드 · 정면에서 천천히 말하기" },
  한복자: { sex: "여", age: 79, disability: "심한 장애 (신장)", veteran: null, ltc: "장기요양 3등급",
    care: "주 3회 투석 동행 · 투석 자격자 배차 필수" },
  오태식: { sex: "남", age: 77, disability: null, veteran: "보훈보상대상자 유족", ltc: "인지지원등급",
    care: "보훈 감면 · 검진 대행 이용" },
  최정자: { sex: "여", age: 75, disability: null, veteran: null, ltc: "장기요양 4등급",
    care: "투석 다음날 탈수 주의" },
};

// 칩 톤 — 한눈에 구분 (빨강은 SOS 전용이므로 장애는 앰버 계열 사용)
export const TAG_TONE = {
  sex: { fg: "#0A1F3C", bg: "rgba(10,31,60,.06)" },
  disability: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  veteran: { fg: "#7A5C28", bg: "rgba(176,141,87,.18)" },
  ltc: { fg: "#1B7F79", bg: "rgba(27,127,121,.1)" },
};
