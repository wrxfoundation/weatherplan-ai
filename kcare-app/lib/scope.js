// 이 기기에 남기는 보조 저장소(관제 SOS 사건 · 요청 관리 메모 · 병원 편집 등)의 칸을 모드별로 나눈다.
// 데모와 테스트 가구가 같은 칸을 쓰면 데모의 목업 사건이 테스트 화면에 섞인다.
// lib/state.js 의 Provider 가 저장소를 고를 때 정한다 — 화면은 그 뒤에 그려지므로 늦지 않는다.
let household = null;

export function setStorageScope(hh) {
  household = hh || null;
}

// 데모는 원래 이름 그대로 (기존 저장값 유지) · 테스트 가구는 이름 뒤에 가구 번호를 붙인다
export const scopedKey = (base) => (household ? `${base}@${household}` : base);
export const isAccountScope = () => !!household;

// 지금 화면이 보고 있는 가구 — 관제 · 컨시어지는 고른 가족 (2026-11-12 · lib/family-select.js)
export const currentHousehold = () => household;
// 가구 기록에 딸린 API(활동 기록 · 목소리)를 부를 때 — 지금 보고 있는 가족 번호를 붙인다. 서버가 그 가족을 봐도 되는지 다시 확인한다
// (어르신 · 보호자는 자기 가족 번호가 붙고, 서버는 세션의 가구와 같은지만 본다).
export const withFamily = (url) => (household && /^HH-C[1-3]/.test(household) ? `${url}${url.includes("?") ? "&" : "?"}hh=${encodeURIComponent(household)}` : url);
