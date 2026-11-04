/**
 * 요괴 체질진단 — 결정론 진단 엔진(난수 없음, 같은 답 → 같은 결과).
 *
 * 8문항 × 4축으로 좌표를 만들고, 카테고리 벡터와의 거리로 계열을 정한 뒤
 * 그 계열 안에서 답변 해시로 개체 하나를 고른다. 결과에는 항상 '왜 이 요괴인지'를 함께 낸다.
 *
 * 축
 *  yin   음(-) ↔ 양(+)      : 밤·어둠 ↔ 낮·빛
 *  water 물(-) ↔ 뭍(+)      : 바다·강 ↔ 산·들
 *  human 자연(-) ↔ 사람(+)  : 자연물 ↔ 사람살이·기물
 *  guard 수호(-) ↔ 장난(+)  : 지키는 쪽 ↔ 흔드는 쪽
 */

export const AXES = ['yin', 'water', 'human', 'guard']

export const QUESTIONS = [
  {
    id: 'q1',
    text: '하루 중 가장 나다운 시간은?',
    options: [
      { label: '해가 지고 난 뒤', v: { yin: -2, guard: 1 } },
      { label: '해 뜨기 직전 새벽', v: { yin: -1, guard: -1 } },
      { label: '한낮', v: { yin: 2, guard: -1 } },
      { label: '한밤중', v: { yin: -2, guard: 2 } },
    ],
  },
  {
    id: 'q2',
    text: '마음이 놓이는 장소는?',
    options: [
      { label: '바닷가·강가', v: { water: -2 } },
      { label: '산과 숲', v: { water: 2, human: -1 } },
      { label: '오래된 집 안', v: { water: 1, human: 2 } },
      { label: '사람 많은 길거리', v: { human: 2, yin: 1 } },
    ],
  },
  {
    id: 'q3',
    text: '누가 내 영역을 침범했다. 나는?',
    options: [
      { label: '문턱에서 조용히 막는다', v: { guard: -2, human: 1 } },
      { label: '겁을 줘서 돌려보낸다', v: { guard: 1, yin: -1 } },
      { label: '내기를 걸어 이겨 버린다', v: { guard: 2, human: 1 } },
      { label: '그냥 지켜본다', v: { guard: -1, yin: -1 } },
    ],
  },
  {
    id: 'q4',
    text: '가장 참기 힘든 것은?',
    options: [
      { label: '약속을 어기는 사람', v: { guard: -1, human: 2 } },
      { label: '내 물건을 함부로 버리는 것', v: { human: 2, guard: 1 } },
      { label: '자연을 함부로 대하는 것', v: { human: -2, guard: -1 } },
      { label: '억울한 일이 묻히는 것', v: { yin: -2, human: 1 } },
    ],
  },
  {
    id: 'q5',
    text: '어떤 날씨에 기운이 도나?',
    options: [
      { label: '안개 낀 날', v: { yin: -2, water: -1 } },
      { label: '장대비 오는 날', v: { water: -2, yin: -1 } },
      { label: '바람 센 날', v: { water: -1, guard: 1 } },
      { label: '맑고 볕 좋은 날', v: { yin: 2, guard: -1 } },
    ],
  },
  {
    id: 'q6',
    text: '사람들이 나를 부를 때 쓰는 말은?',
    options: [
      { label: '무섭지만 필요한 존재', v: { guard: -2, human: 1 } },
      { label: '재수 좋은 존재', v: { guard: -1, human: 2 } },
      { label: '건드리면 안 되는 존재', v: { guard: 2, human: -1 } },
      { label: '이름조차 조심스러운 존재', v: { yin: -2, human: -2 } },
    ],
  },
  {
    id: 'q7',
    text: '내가 남기고 싶은 흔적은?',
    options: [
      { label: '땅에 남은 지형과 바위', v: { human: -2, water: 1 } },
      { label: '집안에 대대로 이어지는 규칙', v: { human: 2, guard: -2 } },
      { label: '사람들 입에 오르내리는 소문', v: { human: 2, guard: 2 } },
      { label: '바다에 남은 뱃길의 안전', v: { water: -2, guard: -2 } },
    ],
  },
  {
    id: 'q8',
    text: '끝내 나를 움직이는 것은?',
    options: [
      { label: '풀지 못한 억울함', v: { yin: -2, human: 1 } },
      { label: '지켜야 할 사람들', v: { guard: -2, human: 1 } },
      { label: '재미와 장난', v: { guard: 2, yin: 1 } },
      { label: '세상의 이치와 질서', v: { human: -1, guard: -1, yin: 1 } },
    ],
  },
]

/* 카테고리 좌표 — 각 축 -2..+2 */
const CATEGORY_VECTOR = {
  dokkaebi: { yin: -1, water: 1, human: 2, guard: 2 },
  gataek: { yin: 0, water: 1, human: 2, guard: -2 },
  animal: { yin: -1, water: 1, human: -1, guard: 1 },
  water: { yin: -1, water: -2, human: -1, guard: 0 },
  mountain: { yin: 0, water: 2, human: -2, guard: -1 },
  ghost: { yin: -2, water: 0, human: 2, guard: 1 },
  plague: { yin: -1, water: 0, human: 2, guard: 0 },
  jeju: { yin: 0, water: -1, human: -1, guard: -1 },
  village: { yin: 1, water: 1, human: 1, guard: -2 },
  sky: { yin: 1, water: 0, human: -2, guard: 1 },
  artifact: { yin: -1, water: 1, human: 2, guard: 1 },
  hybrid: { yin: 0, water: 0, human: 0, guard: -1 },
  modern: { yin: -1, water: 1, human: 2, guard: 2 },
  foreign: { yin: -1, water: 0, human: 0, guard: -1 },
}

export const AXIS_LABEL = {
  yin: ['음(밤·어둠)', '양(낮·빛)'],
  water: ['물(바다·강)', '뭍(산·들)'],
  human: ['자연', '사람살이'],
  guard: ['수호', '장난'],
}

/** 답변 배열(문항별 선택 index) → 축 좌표 */
export function scoreAxes(answers) {
  const v = { yin: 0, water: 0, human: 0, guard: 0 }
  answers.forEach((choice, i) => {
    const opt = QUESTIONS[i]?.options[choice]
    if (!opt) return
    for (const [k, n] of Object.entries(opt.v)) v[k] += n
  })
  return v
}

/* 결정론 해시 — 같은 답변 조합이면 항상 같은 개체가 나온다 */
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/**
 * 진단 실행.
 * @param entries 도감 전체
 * @param answers 문항별 선택 index 배열
 * @returns { entry, category, axes, reasons[], runnersUp[] }
 */
export function diagnose(entries, answers) {
  const axes = scoreAxes(answers)

  const ranked = Object.entries(CATEGORY_VECTOR)
    .map(([id, vec]) => {
      const dist = AXES.reduce((sum, a) => sum + Math.abs((axes[a] ?? 0) / 2 - vec[a]), 0)
      return { id, dist }
    })
    .sort((a, b) => a.dist - b.dist || a.id.localeCompare(b.id))

  const key = answers.join('-')

  // 후보: 1순위 계열에서 저신뢰·민감 항목을 뺀 개체. 비면 2순위 계열로 내려간다.
  let category = ranked[0].id
  let pool = []
  for (const r of ranked) {
    pool = entries.filter((e) => e.category === r.id && e.confidence !== 'low' && !e.sensitivity)
    if (pool.length) {
      category = r.id
      break
    }
  }
  if (!pool.length) pool = entries.filter((e) => e.confidence !== 'low')

  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id))
  const entry = sorted[hash(key) % sorted.length]

  const reasons = AXES.map((a) => {
    const val = axes[a] ?? 0
    const [neg, pos] = AXIS_LABEL[a]
    const side = val === 0 ? '중립' : val < 0 ? neg : pos
    return { axis: a, value: val, label: side }
  })

  const runnersUp = ranked.slice(1, 3).map((r) => r.id)
  return { entry, category, axes, reasons, runnersUp }
}
