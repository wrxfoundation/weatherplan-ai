// 데모 고정 데이터의 날짜 · 시각을 '오늘 기준'으로 만든다 (2026-10-02 QA "날짜·시간 불일치":
// 헤더는 10월 2일인데 확인전화 8/24~8/27 · 생신 '모레(8/1)' · 기준일 9월 22일 · 브리핑 7/30 생성 …).
//
// 원칙 — 고정 날짜는 오늘에서 며칠 떨어진 날로 적고, '오늘 HH:MM' 처럼 이미 지난 일로 쓰는 시각은
// 아직 그 시각이 안 됐으면 어제로 돌린다 (오전에 '오늘 14:10 열람'이 보이지 않게).
// 화면은 한국 시간으로 읽는다 — 테스터 폰의 시간대가 달라도 같은 날짜가 나오게.
// 이 파일은 아무것도 불러오지 않는다 (목 데이터 파일 어디서든 써도 순환이 생기지 않게).

const KST = 9 * 3600 * 1000;
const DAY = 86400 * 1000;
const WD = ["일", "월", "화", "수", "목", "금", "토"];

// UTC 필드가 곧 한국 벽시계인 Date — getUTC* 로 읽는다
const kst = (offsetDays = 0, base = Date.now()) => new Date(base + KST + offsetDays * DAY);

export const relMd = (o = 0) => {
  const d = kst(o);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
};
export const relMdw = (o = 0) => `${relMd(o)} (${WD[kst(o).getUTCDay()]})`;
export const relYmd = (o = 0) => kst(o).toISOString().slice(0, 10);
export const relMmdd = (o = 0) => relYmd(o).slice(5); // "10-02"
export const relKoMd = (o = 0) => {
  const d = kst(o);
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일`;
};
export const relKoLong = (o = 0) => {
  const d = kst(o);
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${WD[d.getUTCDay()]}요일`;
};
export const relMonthLabel = (o = 0) => `${kst(o).getUTCMonth() + 1}월`;
// 이번 주 월요일까지 며칠 전인가 (월요일이면 0)
export const relMondayOffset = () => -((kst(0).getUTCDay() + 6) % 7);

// 지금 한국 시각(분)
const nowMin = () => {
  const d = kst(0);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
const toMin = (hm) => {
  const [h, m] = String(hm).split(":").map(Number);
  return h * 60 + (m || 0);
};

// 지난 일로 쓰는 '오늘 HH:MM' — 아직 그 시각 전이면 '어제 HH:MM'
export const pastHm = (hm) => (toMin(hm) <= nowMin() ? `오늘 ${hm}` : `어제 ${hm}`);
// 같은 규칙으로 날짜만 — 오늘 그 시각이 지났으면 오늘 날짜, 아니면 어제 날짜 ("10-02 14:10")
export const pastMmddHm = (hm) => `${relMmdd(toMin(hm) <= nowMin() ? 0 : -1)} ${hm}`;
// 아직 오지 않은 '오늘 HH:MM' 인가 — 지난 예정을 '예정'으로 남기지 않을 때 쓴다
export const isLaterToday = (hm) => toMin(hm) > nowMin();
