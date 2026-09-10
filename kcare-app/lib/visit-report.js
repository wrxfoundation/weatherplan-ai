// 방문 리포트 결과 데이터 — 2026-08-28 실무진이 준 리포트 예시 시안 그대로.
//
// lib/checkup.js 의 CHECKUP 은 "무엇을 보는지"(항목 정의)이고, 여기는 "이번 방문에서
// 어떻게 보였는지"(결과)다. 둘을 한 파일에 두면 정의를 고칠 때 결과가 딸려 바뀐다.
//
// 상태 4종은 시안 그대로: 양호 · 주의 · 관찰 · 위험.
// 색은 우리 토큰을 쓴다 — 위험만 빨강(#C0392B)이다. 빨강은 위험 신호 전용이라는
// 원칙이 여기서는 지켜진다: 이 리포트의 '위험'은 실제 건강 위험 신호다.
export const RESULT_TONE = {
  양호: { fg: "#1E7A5A", bg: "rgba(30,122,90,.12)", dot: "#1E7A5A" },
  주의: { fg: "#8A5D12", bg: "rgba(176,141,87,.16)", dot: "#B08D57" },
  관찰: { fg: "#4A5C78", bg: "rgba(122,141,173,.18)", dot: "#7A8DAD" },
  위험: { fg: "#C0392B", bg: "rgba(192,57,43,.1)", dot: "#C0392B" },
};

// 5점 스케일 위 점 위치 — 시안의 가로 점 5개 중 하나가 굵게 찍힌 그 표시.
// 좋음(0)에서 나쁨(4)이 아니라 '치우침'을 본다: 가운데(2)가 평소, 양끝이 변화다.
// 수치가 아니라 관찰이므로 소수점은 쓰지 않는다.
export const VISIT_REPORT = {
  head: {
    client: "김순자",
    honorific: "어르신",
    age: 78,
    round: 3,
    visitedAt: "2026.09.09",
    prevAt: "2026.08.26",
    concierge: "박지현",
    tags: "청력저하 · 보행보조 필요",
    verdict: "종합 · 관찰 필요",
    stamp: { line1: "방문확인", line2: "09.09" },
  },
  // 총평 — 사람이 쓴 문장. 진단어는 쓰지 않는다 (의료 행위 아님)
  summary:
    "전체적으로 컨디션 난조가 있어 가라앉으시고, 쉼을 통한 휴식으로 지난 며칠을 보내셨습니다. " +
    "특별히 나쁜 수치는 아니지만 평소보다 힘들어하고 계셔서 병원 내원을 권해드리며, " +
    "보호자께서 신경 써주셔야 할 부분을 아래에 정리했습니다.",
  axes: [
    {
      axis: "몸",
      en: "BODY",
      icon: "user",
      items: [
        {
          k: "혈압",
          trend: "up",
          state: "위험",
          scale: 3,
          // 수치가 있는 항목만 bars 를 갖는다 (시안의 수축/이완 두 줄)
          bars: [
            { label: "수축", value: 148, pos: 0.62 },
            { label: "이완", value: 95, pos: 0.66 },
          ],
          note: "지난번보다 높아짐. 이틀간 컨디션 난조로 혈압약을 잊으셨음.",
        },
        { k: "체온", tag: "신규", state: "주의", scale: 3, note: "37.8℃ 미열, 이틀째 지속 중." },
        { k: "체중", trend: "down", state: "관찰", scale: 1, note: "지난 방문 대비 500g 감소." },
        { k: "걸음·균형", trend: "up", state: "주의", scale: 3, note: "기운 없어 걸음 무겁고 평소보다 느리심." },
        {
          k: "복약",
          trend: "up",
          state: "위험",
          scale: 4,
          note: "오전 혈압약 이틀 미복용, 삼성병원 약도 저녁만 이틀째.",
        },
        { k: "통증", tag: "안정", state: "양호", scale: 0, note: "통증은 없으나 전반적으로 기운 없으심." },
        { k: "수면시간", tag: "증가", state: "관찰", scale: 1, note: "지난주 내내 낮잠, 밤잠도 평소보다 많음." },
      ],
    },
    {
      axis: "마음",
      en: "MIND",
      icon: "heart",
      items: [
        { k: "말수", trend: "down", state: "관찰", scale: 2, note: "이전보다 가라앉으시고 말수 줄어듦." },
        { k: "표정·목소리", trend: "down", state: "관찰", scale: 2, note: "안색 창백, 목소리도 낮게 가라앉음." },
        { k: "외출횟수", trend: "down", state: "관찰", scale: 2, note: "지난 이틀 외출 없이 집에서 쉬심." },
        { k: "만난 사람", trend: "down", state: "관찰", scale: 2, note: "이틀간 없음. 지난주엔 이모님 만나심." },
        { k: "하시던 일", trend: "down", state: "관찰", scale: 2, note: "방문 시 누워 계시다가 나오심." },
        { k: "식욕·끼니", trend: "down", state: "주의", scale: 3, note: "입맛 없어 식사량 줄어듦." },
        { k: "잠들기까지", tag: "지속", state: "관찰", scale: 2, note: "피로도 있어 기절하듯 자고 일어나심." },
      ],
    },
    {
      axis: "집",
      en: "HOME",
      icon: "home",
      items: [
        { k: "냉장고", tag: "조치함", state: "주의", scale: 3, note: "상한 반찬 2가지 정리, 반찬 조금 부족." },
        { k: "문턱·바닥", tag: "유지", state: "양호", scale: 0, note: "이전과 동일, 위험 요소 없음." },
        { k: "조명", tag: "신규", state: "주의", scale: 3, note: "현관 조명 불안정, LED 교체 요망." },
        { k: "가스·전기", tag: "유지", state: "양호", scale: 0, note: "이전과 동일, 양호." },
        { k: "약보관", tag: "개선", state: "양호", scale: 0, note: "놓친 약 분류 후 순서대로 재배치함." },
        { k: "우편·고지서", tag: "조치함", state: "주의", scale: 3, note: "우편물 정리함. 전기세·수도세 납부 필요." },
      ],
    },
  ],
  // 보호자께서 꼭 확인해 주세요 — 분류 태그 + 한 줄. 리포트에서 유일하게 행동을 요구하는 자리다.
  guardianTodos: [
    { tag: "복약", text: "오전 혈압약 이틀 미복용, 삼성병원 약도 저녁만 드심 — 오늘 복약 여부 확인 요망" },
    { tag: "건강", text: "혈압 148/95, 미열 37.8℃ 이틀째 지속 — 병원 내원 권장" },
    { tag: "정서", text: "말수·외출·식욕 동반 감소 — 안부 전화 권장" },
    { tag: "주거", text: "현관 조명 불안정 — LED 전구 교체 필요" },
    { tag: "생활", text: "전기세·수도세 고지서 납부 필요" },
  ],
};

// 상태별 개수 — 도넛의 입력. 항목에서 세므로 손으로 적은 수와 어긋날 일이 없다.
export function countStates(items) {
  return items.reduce((acc, i) => ({ ...acc, [i.state]: (acc[i.state] || 0) + 1 }), {});
}

export const ALL_ITEMS = VISIT_REPORT.axes.flatMap((a) => a.items);
export const STATE_ORDER = ["양호", "주의", "관찰", "위험"];
