// ─── 공용 SVG 라인 아이콘 세트 ──────────────────────────────────
// 이모지 UI 아이콘을 전 화면에서 대체하는 단일 소스. C4D 3D 에셋(카테고리·
// 오브제·히어로)은 브랜드 일러스트라 유지 — 여기는 "인터페이스 아이콘"만.
// 규격: 24 viewBox · stroke currentColor · strokeWidth 1.9 · round cap/join.
const I = ({ size = 16, sw = 1.9, className = '', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    {children}
  </svg>
)

// 대시보드/그리드 (▦)
export const IcGrid = (p) => <I {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></I>
// 매장/분양몰 (🏪)
export const IcStore = (p) => <I {...p}><path d="M4 9.5 5.2 4h13.6L20 9.5" /><path d="M4 9.5a2.6 2.6 0 0 0 5.3 0 2.65 2.65 0 0 0 5.4 0 2.6 2.6 0 0 0 5.3 0" /><path d="M5 12v8h14v-8" /><path d="M9.5 20v-5h5v5" /></I>
// 상품/박스 (📦)
export const IcBox = (p) => <I {...p}><path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" /><path d="M4 7l8 4 8-4" /><path d="M12 11v9" /></I>
// 정책/클립보드 (📋)
export const IcClipboard = (p) => <I {...p}><rect x="5" y="4.5" width="14" height="16.5" rx="2" /><path d="M9 4.5V3.8A1.8 1.8 0 0 1 10.8 2h2.4A1.8 1.8 0 0 1 15 3.8v.7" /><path d="M9 10h6M9 14h6M9 18h3.5" /></I>
// 리드/번개 (⚡)
export const IcBolt = (p) => <I {...p}><path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" /></I>
// AI 로봇 (🤖)
export const IcRobot = (p) => <I {...p}><rect x="4.5" y="8" width="15" height="11" rx="3" /><path d="M12 8V4.8M12 4.8a1.4 1.4 0 1 0-.01-2.8 1.4 1.4 0 0 0 .01 2.8Z" /><circle cx="9" cy="13" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="13" r="1.1" fill="currentColor" stroke="none" /><path d="M9.5 16.5h5" /></I>
// 정산/코인 (₩ 대체)
export const IcCoins = (p) => <I {...p}><circle cx="9" cy="9" r="5.5" /><path d="M6.8 7.3 8 11l1-2.6 1 2.6 1.2-3.7M6.6 9.4h4.8" /><path d="M17.5 8.6a5.5 5.5 0 1 1-6.4 8.2" /></I>
// 감사/자물쇠 (🔒)
export const IcLock = (p) => <I {...p}><rect x="5" y="10.5" width="14" height="9.5" rx="2.2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><path d="M12 14.5v2" /></I>
// 고객/사람들 (👥)
export const IcUsers = (p) => <I {...p}><circle cx="9.5" cy="8" r="3.2" /><path d="M3.8 20a5.7 5.7 0 0 1 11.4 0" /><path d="M15.5 5.3a3.2 3.2 0 0 1 0 5.4" /><path d="M17.4 14.6A5.7 5.7 0 0 1 20.7 20" /></I>
// 자료실/폴더 (📁)
export const IcFolder = (p) => <I {...p}><path d="M3.5 6.5A1.8 1.8 0 0 1 5.3 4.7h4l2 2.3h7.4a1.8 1.8 0 0 1 1.8 1.8v9.4a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8V6.5Z" /></I>
// 설정/톱니 (⚙)
export const IcGear = (p) => <I {...p}><circle cx="12" cy="12" r="3.1" /><path d="M12 2.8v2.4M12 18.8v2.4M4.4 6.8l2 1.2M17.6 16l2 1.2M2.8 12h2.4M18.8 12h2.4M4.4 17.2l2-1.2M17.6 8l2-1.2" /></I>
// 경영/나침반 (🧭)
export const IcCompass = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></I>
// 알림/종 (🔔)
export const IcBell = (p) => <I {...p}><path d="M12 3.5a5.5 5.5 0 0 1 5.5 5.5c0 4 1.3 5.4 2 6.1H4.5c.7-.7 2-2.1 2-6.1A5.5 5.5 0 0 1 12 3.5Z" /><path d="M10 18.8a2 2 0 0 0 4 0" /></I>
// 전화 (📞)
export const IcPhone = (p) => <I {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></I>
// 알림톡/말풍선 (💬)
export const IcChat = (p) => <I {...p}><path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.5L3.5 20l1.1-4.4a8.5 8.5 0 1 1 15.9-4.1Z" /><path d="M8.5 10.5h7M8.5 13.8h4.5" /></I>
// 시계/SLA (⏰)
export const IcClock = (p) => <I {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></I>
// 경고 (🚨)
export const IcAlert = (p) => <I {...p}><path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" /><path d="M12 10v4M12 16.8v.2" /></I>
// 인사이트/전구 (💡)
export const IcBulb = (p) => <I {...p}><path d="M12 3a6.5 6.5 0 0 1 3.8 11.8c-.8.6-1.3 1.2-1.3 2.2h-5c0-1-.5-1.6-1.3-2.2A6.5 6.5 0 0 1 12 3Z" /><path d="M9.8 20h4.4" /></I>
// 소비자/장바구니 (🛒)
export const IcCart = (p) => <I {...p}><path d="M3 4h2.2l2 11.5h11l2-8.5H6.3" /><circle cx="9" cy="19.5" r="1.6" /><circle cx="17" cy="19.5" r="1.6" /></I>
// 파트너/서류가방 (💼)
export const IcBriefcase = (p) => <I {...p}><rect x="3.5" y="7.5" width="17" height="12.5" rx="2" /><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" /><path d="M3.5 12.5h17" /></I>
// 본사/관제 레이더 (🛰️)
export const IcRadar = (p) => <I {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><path d="M12 12 18 6" /><circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" /></I>
// 지도/총판 (🗺️)
export const IcMap = (p) => <I {...p}><path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2-6-2Z" /><path d="M9 4v14M15 6v14" /></I>
// 검색 (🔍)
export const IcSearch = (p) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></I>
// 빈 상태/인박스 (📭)
export const IcInbox = (p) => <I {...p}><path d="M4 13.5 6.5 5h11L20 13.5" /><path d="M4 13.5V19h16v-5.5" /><path d="M4 13.5h4.5a3.5 3.5 0 0 0 7 0H20" /></I>
// 문서 (📄)
export const IcDoc = (p) => <I {...p}><path d="M6 3.5h8L19 8.5v12H6v-17Z" /><path d="M14 3.5v5h5" /><path d="M9 12.5h6M9 16h6" /></I>
// 공유 (📤)
export const IcShare = (p) => <I {...p}><path d="M12 14V4M12 4 8.5 7.5M12 4l3.5 3.5" /><path d="M5 12v7h14v-7" /></I>
// 체크 (✓)
export const IcCheck = (p) => <I {...p}><path d="m4.5 12.5 5 5 10-11" /></I>
// 선물 (🎁)
export const IcGift = (p) => <I {...p}><rect x="4" y="11" width="16" height="9.5" rx="1.5" /><path d="M3.5 7.5h17V11h-17V7.5Z" /><path d="M12 7.5v13" /><path d="M12 7.5C12 5 10.8 3.5 9 3.5a1.9 1.9 0 0 0 0 3.8Z" /><path d="M12 7.5C12 5 13.2 3.5 15 3.5a1.9 1.9 0 0 1 0 3.8Z" /></I>
// 메뉴 햄버거 (☰)
export const IcMenu = (p) => <I {...p}><path d="M4 6.5h16M4 12h16M4 17.5h16" /></I>
// 메가폰/공지 (📢)
export const IcMegaphone = (p) => <I {...p}><path d="M3.5 10v4l4 .8L18.5 19V5L7.5 9.2l-4 .8Z" /><path d="M7.5 15v3.5a1.5 1.5 0 0 0 3 0V15.6" /></I>
// 달력 (📅)
export const IcCalendar = (p) => <I {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></I>
// 차트 (📊)
export const IcChart = (p) => <I {...p}><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8.5 16v-5M13 16V8M17.5 16v-3" /></I>
// 좋아요/별로예요 (피드백)
export const IcThumbUp = (p) => <I {...p}><path d="M7 10.5v9.5H4a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1h3Z" /><path d="M7 10.5 11 3.5a2 2 0 0 1 2 2v3.5h5.2a2 2 0 0 1 2 2.4l-1.2 6a2 2 0 0 1-2 1.6H7" /></I>
export const IcThumbDown = (p) => <I {...p}><path d="M17 13.5V4H20a1 1 0 0 1 1 1v7.5a1 1 0 0 1-1 1h-3Z" /><path d="M17 13.5 13 20.5a2 2 0 0 1-2-2V15H5.8a2 2 0 0 1-2-2.4l1.2-6a2 2 0 0 1 2-1.6H17" /></I>
// 트럭/이사 (🚚)
export const IcTruck = (p) => <I {...p}><path d="M3 6.5h11v10H3v-10Z" /><path d="M14 10h4l3 3.5v3H14" /><circle cx="7" cy="18.5" r="1.8" /><circle cx="17.5" cy="18.5" r="1.8" /></I>
