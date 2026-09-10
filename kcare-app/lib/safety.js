// 시니어 홈 안전진단 — 첫 방문 30항목 · 100점 만점.
// 출처: kcare팀 실무자 피드백 엑셀 (2026-08-09) '시니어 홈 안전진단' 시트 그대로.
// 항목 문구·배점·구역 점수·등급 구간을 임의로 바꾸지 않았다.
//
// 쓰임: 컨시어지가 자택 첫 방문에서 체크 → 점수·등급이 첫 방문 리포트에 실리고,
// '아니오'가 나온 항목에 맞는 생활안전용품이 스토어 장바구니에 자동으로 담긴다.
// fix 필드가 그 매핑이다 (lib/store.js SAFETY_GOODS 의 id).

export const SAFETY_SECTIONS = [
  {
    id: "entrance",
    name: "현관 안전",
    max: 15,
    items: [
      { no: 1, q: "현관 바닥이 미끄럽지 않다", pts: 3, fix: "mat" },
      { no: 2, q: "현관에 자동 조명이 있다", pts: 3, fix: "sensorLight" },
      { no: 3, q: "문턱이 낮거나 경사 처리되어 있다", pts: 3, fix: null },
      { no: 4, q: "앉아서 신발을 신을 수 있다", pts: 3, fix: null },
      { no: 5, q: "현관에 걸려 넘어질 물건이 없다", pts: 3, fix: null },
    ],
  },
  {
    id: "living",
    name: "거실 안전",
    max: 17,
    items: [
      { no: 6, q: "거실에서 미끄러질 위험이 없다", pts: 5, fix: "slippers" },
      { no: 7, q: "카펫이나 러그가 단단히 고정되어 있다", pts: 3, fix: null },
      { no: 8, q: "전선이 바닥에 노출되어 있지 않다", pts: 3, fix: null },
      { no: 9, q: "소파에서 일어날 때 지지물이 있다", pts: 3, fix: "grabBar" },
      { no: 10, q: "거실 조명이 충분하다", pts: 3, fix: "sensorLight" },
    ],
  },
  {
    id: "bedroom",
    name: "침실 안전",
    max: 19,
    items: [
      { no: 11, q: "침대에서 화장실까지 자동 조명이 있다", pts: 5, fix: "sensorLight" },
      { no: 12, q: "침대 높이가 적절하다", pts: 3, fix: null },
      { no: 13, q: "침대 주변에 장애물이 없다", pts: 3, fix: null },
      { no: 14, q: "야간 이동이 안전하다", pts: 3, fix: "sensorLight" },
      { no: 15, q: "침대에서 일어날 때 균형을 잃지 않는다", pts: 5, fix: "grabBar" },
    ],
  },
  {
    id: "bathroom",
    name: "욕실 안전",
    max: 19,
    items: [
      { no: 16, q: "욕실 바닥에 미끄럼 방지 장치가 있다", pts: 5, fix: "mat" },
      { no: 17, q: "욕실 바닥이 쉽게 미끄럽지 않다", pts: 3, fix: "mat" },
      { no: 18, q: "욕실에 손을 짚을 수 있는 지지물이 있다", pts: 5, fix: "grabBar" },
      { no: 19, q: "욕실에 야간 조명이 있다", pts: 3, fix: "sensorLight" },
      { no: 20, q: "욕실 문턱이 낮다", pts: 3, fix: null },
    ],
  },
  {
    id: "kitchen",
    name: "주방 안전",
    max: 15,
    items: [
      { no: 21, q: "자주 사용하는 물건이 손 닿는 곳에 있다", pts: 3, fix: null },
      { no: 22, q: "주방 바닥의 물기를 바로 제거한다", pts: 3, fix: null },
      { no: 23, q: "가스·인덕션 사용 실수가 없다", pts: 3, fix: null },
      { no: 24, q: "무거운 조리도구 사용이 안전하다", pts: 3, fix: null },
      { no: 25, q: "주방 바닥이 미끄럽지 않다", pts: 3, fix: "slippers" },
    ],
  },
  {
    id: "habit",
    name: "생활습관 · 낙상 위험",
    max: 15,
    items: [
      { no: 26, q: "최근 1년 내 집 안에서 넘어질 뻔한 적이 없다", pts: 5, fix: null },
      { no: 27, q: "밤에 이동할 때 항상 조명을 켠다", pts: 3, fix: "sensorLight" },
      { no: 28, q: "어지럼증이나 균형 불안이 드물다", pts: 5, fix: null },
      { no: 29, q: "실내에서 미끄러운 슬리퍼를 신지 않는다", pts: 3, fix: "slippers" },
      { no: 30, q: "보호자가 정기적으로 안전을 확인한다", pts: 3, fix: null },
    ],
  },
];

// ⚠️ 시트 불일치 — 임의로 고치지 않고 환산으로 처리한다.
//   '생활습관 및 낙상 위험' 구역이 소계 15점으로 표기돼 있는데 항목 배점 합은
//   19점(5+3+5+3+3)이다. 그래서 전체 항목 합이 104점으로 100점을 넘는다.
//   구역 소계(15+17+19+19+15+15)는 정확히 100이라 100점 틀이 의도인 것은
//   분명하지만, 어느 항목의 배점이 틀렸는지는 시트만으로 알 수 없다.
//   → 항목 배점은 시트 그대로 두고, 점수는 100점 만점으로 환산해 보여준다.
//     실무자 확인 후 배점이 정리되면 환산을 걷어낸다.
export const RAW_MAX = SAFETY_SECTIONS.reduce(
  (s, sec) => s + sec.items.reduce((a, i) => a + i.pts, 0),
  0
); // 104

// 등급 구간 — 실무자 시트 그대로 (100점 환산 점수 기준)
export const SAFETY_GRADES = [
  { min: 90, grade: "A", label: "매우 안전", fg: "#1E7A5A", bg: "rgba(30,122,90,.12)" },
  { min: 80, grade: "B", label: "안전", fg: "#1E7A5A", bg: "rgba(30,122,90,.08)" },
  { min: 70, grade: "C", label: "주의", fg: "#8A5D12", bg: "rgba(138,93,18,.12)" },
  { min: 60, grade: "D", label: "위험", fg: "#C0392B", bg: "rgba(192,57,43,.1)" },
  { min: 0, grade: "E", label: "매우 위험", fg: "#C0392B", bg: "rgba(192,57,43,.16)" },
];

export function gradeOf(score) {
  return SAFETY_GRADES.find((g) => score >= g.min);
}

// answers: { [항목번호]: true(예) | false(아니오) } — 체크 안 한 항목은 계산에서 제외
// earned 는 100점 환산 점수다 (위 RAW_MAX 주석 참고). raw 도 함께 돌려준다.
export function scoreSafety(answers) {
  let raw = 0;
  let answered = 0;
  const fixes = new Set();
  for (const sec of SAFETY_SECTIONS) {
    for (const it of sec.items) {
      const a = answers[it.no];
      if (a === undefined) continue;
      answered += 1;
      if (a) raw += it.pts;
      else if (it.fix) fixes.add(it.fix);
    }
  }
  return { earned: Math.round((raw / RAW_MAX) * 100), raw, answered, fixes: [...fixes] };
}
