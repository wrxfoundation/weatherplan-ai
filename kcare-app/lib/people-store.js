// 이 공간의 사람 이름 묶음을 들고 있는 칸 — lib/people.js 가 바꾸고, 이름을 쓰는 라이브러리들이 읽는다.
// (서로 불러오는 고리가 생기지 않게 따로 둔다 · 2026-10-06)
let current = null;
export const peopleNow = () => current;
export const setPeopleNow = (p) => {
  current = p;
};
export const centerNow = () => !!current?.center;
