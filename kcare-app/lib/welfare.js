// 복지혜택 자동 매칭 — 실무진 'KCARE 복지혜택 DB 3'(2026-09-04)의 06_고객매칭테스트
// 시트 공식을 그대로 옮겼다. 앱 전체 요청 3번(2026-09-04): "해주세요에 복지혜택 서비스를
// 베타부터 오픈 — 고객 정보에 맞는 혜택을 관제가 자동으로 찾아주고, 신청은 보호자가
// 하거나 컨시어지가 제안. 무료/유료 고객 동시 적용."
//
// 원칙
//  · 관제가 엑셀로 검산할 수 있어야 한다. 그래서 공식을 "고치지" 않고 1:1 로 옮겼다 —
//    시트의 특이점(아래 주석 ※)까지 그대로다. 시트 테스트 고객 79건 판정·점수·순서가
//    같은 것을 확인했다 (scripts/ 가 아니라 세션에서 돌린 검증 · 커밋 메시지 참고).
//  · 자동판정은 신청 승인을 보장하지 않는다 (시트 판정 원칙 ※). 화면마다 그대로 쓴다.
//  · 모르는 고객 정보는 "미확인"으로 둔다 → '추가확인 필요'가 된다. 모르는 것을 Y 로
//    채워 '이용 가능성 높음'을 만들지 않는다 (PRD 정직성 원칙).
//  · 정책 데이터(lib/welfare-data.js)는 손으로 고치지 않는다 — scripts/gen-welfare.py.

import { WELFARE_POLICIES, WELFARE_CATEGORIES, WELFARE_SOURCES } from "./welfare-data";

export { WELFARE_POLICIES, WELFARE_CATEGORIES };

// 79건 전부 같은 값이라 데이터에서 뺀 것들 (01_정책마스터 · 02_지원자격)
export const WELFARE_COMMON = {
  period: "상시 또는 예산소진 시까지(공고형은 별도)",
  copay: "정책별·자격별 상이",
  duration: "정책별 상이",
  dup: "공고·타서비스 중복 제한 확인",
  manual: "소득·재산·예산·중복수혜",
  kcare: "방문 시 필요 발견 → 공공지원 우선 확인",
  verifiedAt: "2026-09-04",
  recheckAt: "2026-12-01",
  disclaimer: "자동판정은 신청 승인을 보장하지 않으며 재산·예산·중복수혜 등은 기관 확인이 필요합니다.",
  path: "공공지원 → 방문케어 PLUS → 민간 해주세요", // 04_정책분류 우선연결 원칙
};

export const VERDICT = { high: "이용 가능성 높음", check: "추가확인 필요", low: "해당 가능성 낮음" };
// 빨강은 SOS 전용 — '낮음'은 회색이다
export const VERDICT_TONE = {
  [VERDICT.high]: { fg: "#1E7A5A", bg: "rgba(30,122,90,.12)", short: "높음" },
  [VERDICT.check]: { fg: "#8A5D12", bg: "rgba(138,93,18,.12)", short: "확인" },
  [VERDICT.low]: { fg: "#5C5A54", bg: "rgba(92,90,84,.1)", short: "낮음" },
};

// 진행상태 — 시트 O열 유효성 목록 그대로. 관제·보호자가 같은 값을 본다.
export const WELFARE_STATUS = ["추천", "자격확인", "신청예정", "신청완료", "승인", "이용중", "종료"];

// 시도 — 시트 B6 유효성 목록 그대로
export const SIDO_LIST = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시",
  "세종특별자치시", "경기도", "강원특별자치도", "충청북도", "충청남도", "전북특별자치도", "전라남도",
  "경상북도", "경상남도", "제주특별자치도",
];

export const sourceUrl = (p) => WELFARE_SOURCES[p.source] || "";

// 시트 U열 — "서울특별시" · "경기도 사업 시군" · "전국"
export function regionLabel(p) {
  if (p.sido === "전국") return "전국";
  return p.sigungu === "전역" ? p.sido : `${p.sido} ${p.sigungu}`;
}

// 고객 프로필 — 시트의 노란 입력칸과 같은 항목. Y/N/"미확인" 은 문자열 그대로 둔다
// (시트와 같은 값이어야 검산이 된다). incomePct 는 숫자 또는 null(빈 칸).
// housing: 무주택 · 자가 · 전세·월세 · 시설·기타 · 미확인
export const PROFILE_FIELDS = [
  // [키, 시트 라벨, 어느 그룹]
  ["basic", "기초생활수급", "복지·가구"],
  ["nearPoor", "차상위", "복지·가구"],
  ["pension", "기초연금수급", "복지·가구"],
  ["alone", "독거", "복지·가구"],
  ["couple", "노인부부가구", "복지·가구"],
  ["disabled", "장애 등록", "복지·가구"],
  ["dementia", "치매 진단", "복지·가구"],
  ["crisis", "위기사유", "복지·가구"],
  ["ltc", "장기요양등급", "건강·돌봄"],
  ["mobility", "거동불편", "건강·돌봄"],
  ["careNeed", "돌봄 필요", "건강·돌봄"],
  ["chronic", "만성질환", "건강·돌봄"],
  ["medicaid", "의료급여", "건강·돌봄"], // ※ 시트 공식은 이 값을 쓰지 않는다 — 입력칸만 있다
];

// 한 항목의 점수 — 정책이 요구하지 않으면 1, 요구하면 고객 Y=1 · 미확인=0.5 · N=0
function flagTerm(required, v) {
  if (!required) return 1;
  if (v === "Y") return 1;
  if (v === "미확인") return 0.5;
  return 0;
}

// 정책 하나 × 고객 하나 — 시트 AB(점수) · AD(판정) · AC(근거) · AA(확인필요) 열
export function scorePolicy(p, c) {
  const e = p.elig;
  const t = {
    // ※ 최대연령(02 C열)은 시트 공식에 없다 — 79건 전부 빈 칸이라 영향은 없다
    age: e.minAge == null || (c.age != null && c.age >= e.minAge) ? 1 : 0,
    region: p.sido === "전국" || p.sido === c.sido ? 1 : 0,
    income: e.incomePct == null ? 1 : c.incomePct == null ? 0.5 : c.incomePct <= e.incomePct ? 1 : 0,
    basic: flagTerm(e.basic, c.basic),
    nearPoor: flagTerm(e.nearPoor, c.nearPoor),
    pension: flagTerm(e.pension, c.pension),
    alone: flagTerm(e.alone, c.alone),
    couple: flagTerm(e.couple, c.couple),
    disabled: flagTerm(e.disabled, c.disabled),
    dementia: flagTerm(e.dementia, c.dementia),
    ltc: flagTerm(e.ltc, c.ltc),
    mobility: flagTerm(e.mobility, c.mobility),
    // ※ 무주택·자가가 요건인데 주거형태가 '미확인'이면 0.5 가 아니라 0 이다 (시트 순서 그대로)
    housing:
      e.noHome && c.housing !== "무주택" ? 0
      : e.ownHome && c.housing !== "자가" ? 0
      : c.housing === "미확인" ? 0.5
      : 1,
    careNeed: flagTerm(e.careNeed, c.careNeed),
    chronic: flagTerm(e.chronic, c.chronic),
    crisis: flagTerm(e.crisis, c.crisis),
  };
  const keys = Object.keys(t);
  const score = Math.round((100 * keys.reduce((s, k) => s + t[k], 0)) / keys.length);
  // ※ 소득(income)은 불일치(0)여도 '낮음'으로 떨어뜨리지 않는다 — 시트가 소득을 확인
  //    대상으로만 두기 때문. 점수만 깎인다.
  const failKeys = keys.filter((k) => k !== "income");
  const fail = failKeys.some((k) => t[k] === 0);
  const unsureKeys = keys.filter((k) => k !== "age" && k !== "region");
  const unsure = unsureKeys.some((k) => t[k] === 0.5) || p.confidence === "추가확인";
  const verdict = fail ? VERDICT.low : unsure ? VERDICT.check : VERDICT.high;
  const basis = fail
    ? "주소·연령 또는 필수자격 불일치"
    : unsure
    ? "미확인 조건 또는 세부공고 확인 필요"
    : "구조화 조건 충족";
  const checks =
    p.confidence === "추가확인"
      ? "2026 세부공고·금액 확인"
      : e.incomePct != null || WELFARE_COMMON.manual
      ? "소득·재산·중복수혜 확인"
      : "신청기관 최종확인";
  // 시트 P열 정렬키 — 등급 → 점수 높은 순 → 지역사업이 전국보다 먼저 → 시트 행 순서
  const sortKey =
    (verdict === VERDICT.high ? 1000 : verdict === VERDICT.check ? 2000 : 3000) +
    (100 - score) +
    (p.sido === "전국" ? 0.5 : 0) +
    (p.row + 16) / 100000;
  // 무엇이 걸렸는지 — 화면에서 "확인해 주세요" 항목으로 보여 준다
  const missing = unsureKeys.filter((k) => t[k] === 0.5);
  const failed = failKeys.filter((k) => t[k] === 0);
  return { policy: p, terms: t, score, verdict, basis, checks, sortKey, missing, failed };
}

// 고객 한 명 × 정책 전부 — 시트 자동 정렬 그대로 (① 높음 ② 추가확인 ③ 낮음 · 같은 등급은 점수순)
export function matchWelfare(c) {
  return WELFARE_POLICIES.map((p) => scorePolicy(p, c)).sort((a, b) => a.sortKey - b.sortKey);
}

export function welfareCounts(list) {
  return {
    total: list.length,
    high: list.filter((m) => m.verdict === VERDICT.high).length,
    check: list.filter((m) => m.verdict === VERDICT.check).length,
    low: list.filter((m) => m.verdict === VERDICT.low).length,
  };
}

// 보호자가 답한 것(state.welfare.answers)을 얹는다 — 미확인이 Y/N 으로 바뀌면 판정이 바뀐다
export function applyAnswers(profile, answers = {}) {
  const out = { ...profile };
  for (const k of Object.keys(answers)) {
    if (answers[k] === "Y" || answers[k] === "N") out[k] = answers[k];
    else if (k === "housing" && answers[k]) out.housing = answers[k];
    else if (k === "incomePct" && typeof answers[k] === "number") out.incomePct = answers[k];
  }
  return out;
}

// 시트 06 의 테스트 고객 — 검산용. 화면에는 쓰지 않는다.
export const SHEET_TEST_PROFILE = {
  name: "테스트 고객",
  sido: "서울특별시",
  sigungu: "전역",
  age: 78,
  incomePct: 45,
  housing: "무주택",
  basic: "Y", nearPoor: "N", pension: "Y", alone: "Y", couple: "N", disabled: "N", dementia: "N", crisis: "N",
  ltc: "N", mobility: "Y", careNeed: "Y", chronic: "Y", medicaid: "Y",
};

// ── 데모 가구 프로필 — 관제가 이미 아는 것만 채우고 나머지는 "미확인" ──────────────
// 출처: lib/mock.js ELDER_TAGS(성별·장애·장기요양) · lib/console.js DIRECTORY(동·담당) ·
// 케어 프로필. 소득·수급·주거는 어느 화면에도 없는 정보라 전부 미확인이다 — 그래서
// 소득 조건이 붙은 정책은 '추가확인 필요'로 나온다. 첫 안심방문 때 보호자와 확인해 채운다.
//
// 돌봄 필요(careNeed): 장기요양 등급이 있으면 Y 로 둔다 — 등급 자체가 공단이 돌봄
// 필요를 인정한 것이다. 위기사유(crisis): 신고된 위기 없음 → N (미확인이 아니다 —
// 위기는 '있으면 아는' 사건이다).
const UNKNOWN = {
  incomePct: null, housing: "미확인", basic: "미확인", nearPoor: "미확인", pension: "미확인",
  alone: "미확인", couple: "미확인", disabled: "N", dementia: "미확인", crisis: "N",
  ltc: "미확인", mobility: "미확인", careNeed: "미확인", chronic: "미확인", medicaid: "미확인",
};
export const WELFARE_PROFILES = {
  김순자: {
    ...UNKNOWN,
    name: "김순자", sido: "서울특별시", sigungu: "강남구", age: 78,
    disabled: "Y", ltc: "Y", mobility: "Y", chronic: "Y", careNeed: "Y",
    alone: "Y", couple: "N", // 자녀 셋 모두 별거(서울·LA·시드니) — 1인 가구
    basisNote: "장애(지체)·장기요양 3등급·휠체어·심부전은 케어 프로필. 소득·수급·주거는 미확인.",
  },
  이영호: {
    ...UNKNOWN,
    name: "이영호", sido: "서울특별시", sigungu: "송파구", age: 81,
    ltc: "Y", careNeed: "Y",
    basisNote: "장기요양 4등급 · 국가유공자(참전). 소득·독거·질환은 미확인.",
  },
  박말순: {
    ...UNKNOWN,
    name: "박말순", sido: "서울특별시", sigungu: "강동구", age: 83,
    disabled: "Y", ltc: "Y", careNeed: "Y",
    basisNote: "장애(청각) · 장기요양 2등급 · 낙상 이력 2회. 거동은 미확인으로 둔다.",
  },
  한복자: {
    ...UNKNOWN,
    name: "한복자", sido: "서울특별시", sigungu: "강동구", age: 79,
    disabled: "Y", ltc: "Y", chronic: "Y", careNeed: "Y",
    basisNote: "장애(신장) · 장기요양 3등급 · 주 3회 투석(만성질환).",
  },
  오태식: {
    ...UNKNOWN,
    name: "오태식", sido: "서울특별시", sigungu: "강남구", age: 77,
    ltc: "Y", dementia: "Y", careNeed: "Y",
    basisNote: "인지지원등급(경증 치매) · 보훈보상대상자 유족. 소득·독거는 미확인.",
  },
  최정자: {
    ...UNKNOWN,
    name: "최정자", sido: "서울특별시", sigungu: "서초구", age: 75,
    ltc: "Y", chronic: "Y", careNeed: "Y",
    basisNote: "장기요양 4등급 · 세브란스 투석 주 3회(만성질환).",
  },
};

// 보호자에게 물어볼 것 — 미확인 중에서 판정을 가장 많이 바꾸는 순서.
// 소득·수급은 어르신께 직접 묻기 어려운 것이라 보호자 화면에서 받는다.
export const ASK_GUARDIAN = [
  { key: "pension", q: "기초연금을 받고 계세요?", why: "통신요금 감면 등 4건이 이 답에 달려 있습니다" },
  { key: "basic", q: "기초생활수급 가구인가요?", why: "의료급여 본인부담 지원 등" },
  { key: "nearPoor", q: "차상위 계층에 해당하세요?", why: "본인부담 경감 · 바우처" },
  { key: "housing", q: "지금 사시는 집은?", options: ["자가", "전세·월세", "무주택", "시설·기타"], why: "주택연금 · 매입임대주택" },
];

// 이름 → 프로필 (없으면 김순자 데모 가구). 보호자 답을 얹어서 돌려준다.
export function profileFor(name, answers) {
  const base = WELFARE_PROFILES[name] || WELFARE_PROFILES.김순자;
  return applyAnswers(base, answers);
}
