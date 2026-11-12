// 동의 상태를 한 곳에서 읽는다 (2026-10-18) — 마이 › 정보 동의에서 철회 · 다시 동의한 값이 먼저,
// 없으면 가입 상담 값(방문 영상), 그것도 없으면 화면의 기본값. 컨시어지 바디캠 · 보호자 방문 영상 · 멤버십이 같은 값을 본다.

export const VIDEO_CONSENT = "방문기록 영상 (요약 30초)";

// fallback — 그 동의를 따로 정한 적이 없을 때 (예시 동의 목록의 값)
export function consentOn(state, k, fallback = true) {
  const mine = state?.guardian?.consents?.[k];
  if (mine) return !!mine.on;
  if (k === VIDEO_CONSENT && state?.onboarding?.joinedAt) return !!state.onboarding.videoConsent;
  return !!fallback;
}

// 방문 영상 — 가입 상담 전 · 데모는 동의로 본다 (컨시어지 화면과 같은 기본값)
export const videoConsentOf = (state) => consentOn(state, VIDEO_CONSENT, true);
