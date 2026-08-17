import { IconName } from '@/components/Icon'

/**
 * 표시 범위 스위치.
 *
 * 현재 운영 담당자가 관리하는 대상은 WELLBIAN 커뮤니티 채널 운영뿐이므로
 * 온체인 모듈(M1~M9)·설정·부속 페이지는 내비게이션에서 **감춘다**.
 * 라우트 자체는 그대로 등록되어 있어 URL 직접 접근·기존 링크는 계속 동작한다
 * (삭제가 아니라 은닉 — 온체인 운영 착수 시 이 값만 true로 되돌리면 전부 복원).
 */
export const SHOW_ONCHAIN = false

/** 감춤 모드에서의 기본 진입 화면 */
export const HOME_PATH = SHOW_ONCHAIN ? '/' : '/community'

export type NavEntry = { to: string; icon: IconName | string; label: string }

export const communityNav: NavEntry[] = [
  { to: '/community', icon: 'users', label: '커뮤니티 운영' },
  { to: '/community/content', icon: 'doc', label: '콘텐츠 · 일정' },
]

export const moduleNav: NavEntry[] = [
  { to: '/m1', icon: 'wallet', label: 'M1 활성 지갑' },
  { to: '/m2', icon: 'thermo', label: 'M2 정산 지수 (VWI)' },
  { to: '/m3', icon: 'exchange', label: 'M3 결제/정산' },
  { to: '/m4', icon: 'cpu', label: 'M4 DePIN 보상' },
  { to: '/m5', icon: 'gauge', label: 'M5 재무 현황' },
  { to: '/m6', icon: 'handshake', label: 'M6 파트너 정산' },
  { to: '/m7', icon: 'chat', label: 'M7 소셜 & 미디어' },
  { to: '/m8', icon: 'coins', label: 'M8 토큰 홀더' },
  { to: '/m9', icon: 'doc', label: 'M9 리포트 & 알림' },
]

export const settingsNav: NavEntry[] = [
  { to: '/settings/modes', icon: 'sliders', label: '모듈 모드 관리' },
  { to: '/settings/wallets', icon: 'registry', label: '지갑 레지스트리' },
  { to: '/settings/alerts', icon: 'bell', label: '알림 규칙' },
  { to: '/settings/users', icon: 'users', label: '사용자 관리' },
  { to: '/settings/audit', icon: 'audit', label: '감사 로그' },
]

/** 데이터 기준일 — 감춤 모드에서는 커뮤니티 운영 기준일을 표기 */
export const DATA_DATE = SHOW_ONCHAIN ? '2026-08-14' : '2026-09-08'
