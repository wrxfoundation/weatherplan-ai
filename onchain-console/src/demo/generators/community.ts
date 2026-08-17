// WELLBIAN 커뮤니티 운영 — 「커뮤니티 채널 운영」·「컨텐츠 기획안」(2026-08-17, 박서우) 스핀오프.
// 채널 3곳(X·텔레그램·링크트리), KPI 목표, 콘텐츠 3축·7형식, 외부 파급, 사칭 대응을 데이터화.
// 데모 기준일: 2026-09-08 (운영 3주차 · 1차 판매 D-7) — 화면에 명시 표기.

export const DEMO_TODAY = '2026-09-08'
export const OPEN_DATE = '2026-08-19' // 채널 개설
export const SIGNUP_START = '2026-08-26' // 사전신청 접수 시작
export const SALE_1ST = '2026-09-15'
export const SALE_2ND = '2026-10-03'

const N = 30 // 30일 창: 08-10 ~ 09-08
const pad = (arr: number[]) => Array(N - arr.length).fill(0).concat(arr)

export const days: string[] = (() => {
  const out: string[] = []
  const d = new Date(2026, 7, 10) // 2026-08-10
  for (let i = 0; i < N; i++) {
    out.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    d.setDate(d.getDate() + 1)
  }
  return out
})()

// ── 일별 원천 (채널 개설 08-19 = idx 9, 사전신청 시작 08-26 = idx 16) ──
export const daily = {
  // 사전신청 (14일)
  signup: pad([980, 620, 480, 350, 300, 320, 380, 340, 320, 360, 720, 480, 380, 210]),
  // 텔레그램 순증 (21일)
  telegram: pad([180, 220, 150, 120, 93, 110, 130, 290, 210, 160, 110, 95, 105, 140, 125, 115, 130, 280, 180, 155, 142]),
  // X 팔로워 순증 (21일)
  x: pad([150, 190, 130, 110, 85, 95, 105, 240, 180, 140, 100, 88, 92, 120, 110, 100, 115, 260, 160, 140, 130]),
  // 링크트리 클릭 (21일)
  linktree: pad([320, 420, 290, 240, 180, 210, 250, 980, 640, 480, 320, 280, 300, 420, 380, 340, 360, 1150, 620, 520, 480]),
  // 게시물 발행 수 (21일)
  posts: pad([2, 3, 2, 1, 1, 2, 2, 3, 2, 2, 1, 1, 2, 2, 2, 2, 2, 3, 2, 2, 1]),
  // 대화방 메시지 (21일)
  messages: pad([40, 85, 60, 45, 30, 38, 52, 180, 120, 95, 60, 50, 55, 80, 70, 62, 68, 210, 140, 120, 95]),
  // 친구 초대 발생 (14일)
  invites: pad([180, 220, 190, 140, 120, 130, 150, 140, 130, 150, 280, 190, 100, 60]),
}

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0)

export const totals = {
  signup: sum(daily.signup),
  telegram: sum(daily.telegram),
  x: sum(daily.x),
  linktree: sum(daily.linktree),
  invites: sum(daily.invites),
  posts: sum(daily.posts),
}

// ── 기간 필터 ──
export type PeriodKey = 'today' | 'yesterday' | 'd3' | 'd7' | 'd14' | 'd30'
export const periods: { key: PeriodKey; label: string; days: number; offset: number }[] = [
  { key: 'today', label: '오늘', days: 1, offset: 0 },
  { key: 'yesterday', label: '어제', days: 1, offset: 1 },
  { key: 'd3', label: '3일', days: 3, offset: 0 },
  { key: 'd7', label: '7일', days: 7, offset: 0 },
  { key: 'd14', label: '14일', days: 14, offset: 0 },
  { key: 'd30', label: '30일', days: 30, offset: 0 },
]
export const periodOf = (k: PeriodKey) => periods.find(p => p.key === k)!

/** 기간 합계 + 직전 동기간 대비 증감 */
export function agg(arr: number[], k: PeriodKey) {
  const { days: d, offset } = periodOf(k)
  const end = arr.length - offset
  const cur = sum(arr.slice(Math.max(0, end - d), end))
  // 직전 동기간이 보유 데이터 범위를 벗어나면 비교 불가(hasPrev=false)로 구분
  const hasPrev = end - d * 2 >= 0
  const prev = hasPrev ? sum(arr.slice(end - d * 2, end - d)) : 0
  const deltaPct = !hasPrev || prev === 0 ? null : ((cur - prev) / prev) * 100
  return { cur, prev, hasPrev, deltaPct }
}

/** 기간 창의 일별 값·라벨 (차트용) */
export function seriesWindow(arr: number[], k: PeriodKey) {
  const { days: d, offset } = periodOf(k)
  const end = arr.length - offset
  const from = Math.max(0, end - Math.max(d, 7)) // 최소 7일은 보여줘야 추세가 읽힘
  return { data: arr.slice(from, end), labels: days.slice(from, end) }
}

// ── PDF ⑤ 채널 KPI (판매 2주 전 / 1차 판매 전날 목표) ──
export const kpiTargets = [
  { name: '사전신청', d14: 4000, dday: 10000, now: totals.signup, note: '판매량(5,000대) 두 배 확보' },
  { name: '텔레그램', d14: 2000, dday: 5000, now: totals.telegram, note: '최대 유입원 = 신청 완료 화면 안내 링크' },
  { name: 'X 팔로워', d14: 2000, dday: 5000, now: totals.x, note: '팔로워보다 구매 신청 전환에 집중' },
]

// 09-01(판매 2주 전) 시점 누적 — 2주 전 목표 대비 실적 판정용
export const at2WeeksBefore = {
  signup: sum(daily.signup.slice(0, 23)), // 08-10~09-01
  telegram: sum(daily.telegram.slice(0, 23)),
  x: sum(daily.x.slice(0, 23)),
}

// ── 텔레그램 유입원 (초대 링크별 분해) ──
export const telegramSources = [
  { label: '신청 완료 화면 안내', pct: 41.2, value: 41.2, color: '#3E6FE0' },
  { label: 'X 프로필 링크', pct: 23.8, value: 23.8, color: '#16181C' },
  { label: '링크트리', pct: 17.6, value: 17.6, color: '#2FA870' },
  { label: '날씨앱 알림·홈페이지', pct: 12.4, value: 12.4, color: '#8F7BE8' },
  { label: '기타·직접 검색', pct: 5.0, value: 5.0, color: '#C9D2E2' },
]

// ── 텔레그램 운영 상태 ──
export const telegramOps = {
  subscribers: totals.telegram,
  leaveToday: 18,
  noticeToday: 2,
  noticeCap: 3, // 공지 하루 3번 이내 규칙
  activeChatters: 186,
  pendingReplies: 4,
  avgReplyMin: 12,
  blockedSpam: 7,
}

// ── 사전신청 퍼널 ──
export const funnel = [
  { step: '신청 페이지 방문', value: 24180, color: '#3E6FE0' },
  { step: '휴대폰 인증 시작', value: 9840, color: '#5B8DEE' },
  { step: '신청 완료', value: totals.signup, color: '#2FA870' },
  { step: '초대 링크 발생', value: totals.invites, color: '#8F7BE8' },
]

// ── 검색어 현황 ──
// shapeMode: brand = 채널 개설 이후 발생 / evergreen = 상시 검색 수요
export type SearchTerm = {
  term: string
  kind: '브랜드' | '카테고리' | '주의'
  shapeMode: 'brand' | 'evergreen'
  base: number
  trend: number
  ctr: number
  source: string
}

export const searchTerms: SearchTerm[] = [
  { term: '웰비안', kind: '브랜드', shapeMode: 'brand', base: 210, trend: 1.4, ctr: 0.42, source: '네이버·구글' },
  { term: 'WELLBIAN', kind: '브랜드', shapeMode: 'brand', base: 148, trend: 1.8, ctr: 0.38, source: 'X·구글' },
  { term: '케이웨더 디핀', kind: '브랜드', shapeMode: 'brand', base: 96, trend: 1.2, ctr: 0.45, source: '네이버' },
  { term: '웰비안 사전신청', kind: '브랜드', shapeMode: 'brand', base: 84, trend: 3.1, ctr: 0.61, source: '네이버·구글' },
  { term: '실내 공기질 측정기', kind: '카테고리', shapeMode: 'evergreen', base: 320, trend: 0.3, ctr: 0.12, source: '네이버' },
  { term: '공기질 센서 추천', kind: '카테고리', shapeMode: 'evergreen', base: 186, trend: 0.2, ctr: 0.09, source: '네이버·구글' },
  { term: '이산화탄소 측정기 가정용', kind: '카테고리', shapeMode: 'evergreen', base: 124, trend: 0.4, ctr: 0.11, source: '네이버' },
  { term: 'DePIN 프로젝트', kind: '카테고리', shapeMode: 'evergreen', base: 92, trend: 0.6, ctr: 0.07, source: '구글·X' },
  { term: '케이웨더 코인', kind: '주의', shapeMode: 'brand', base: 78, trend: 2.6, ctr: 0.28, source: '네이버' },
  { term: '웰비안 에어드랍', kind: '주의', shapeMode: 'brand', base: 46, trend: 3.4, ctr: 0.22, source: '구글·X' },
  { term: '웰비안 사칭', kind: '주의', shapeMode: 'brand', base: 12, trend: 4.2, ctr: 0.55, source: 'X·텔레그램' },
]

const linkAvg = totals.linktree / 21
const brandShape = daily.linktree.map(v => (v === 0 ? 0 : v / linkAvg))
const everShape = daily.linktree.map((v, i) => (i < 9 ? 0.72 : 0.72 + (v / linkAvg) * 0.28))

function termDaily(t: SearchTerm) {
  const shape = t.shapeMode === 'brand' ? brandShape : everShape
  return shape.map((s, i) => Math.round(t.base * s * (1 + (t.trend * i) / (N - 1)) * 0.34))
}

export const termSeries = new Map(searchTerms.map(t => [t.term, termDaily(t)]))

/** 기간별 검색어 순위표 (검색량·유입 세션·직전 동기간 대비·신규 진입) */
export function searchRanking(k: PeriodKey) {
  const rows = searchTerms.map(t => {
    const a = agg(termSeries.get(t.term)!, k)
    return {
      ...t,
      volume: a.cur,
      prev: a.prev,
      deltaPct: a.deltaPct,
      sessions: Math.round(a.cur * t.ctr),
      hasPrev: a.hasPrev,
      isNew: a.hasPrev && a.prev === 0 && a.cur > 0,
    }
  })
  rows.sort((x, y) => y.volume - x.volume)
  return rows.map((r, i) => ({ ...r, rank: i + 1 }))
}

// ── 데이터 연동 현황 (정직 표기: 자동 수집 / 준비 필요 / 수동) ──
export const integrations = [
  { ch: '텔레그램', metric: '구독자 수', how: 'Bot API · getChatMemberCount', cycle: '5분', status: '자동' as const },
  { ch: '텔레그램', metric: '가입·이탈 이벤트', how: 'Bot API · chat_member 업데이트', cycle: '실시간', status: '자동' as const },
  { ch: '텔레그램', metric: '유입원 분해', how: '초대 링크별 createChatInviteLink', cycle: '실시간', status: '자동' as const },
  { ch: '텔레그램', metric: '대화방 메시지·응대', how: 'Bot API · Webhook', cycle: '실시간', status: '자동' as const },
  { ch: '텔레그램', metric: '게시물 조회수', how: 'Bot API 미지원 → MTProto(TDLib) 필요', cycle: '일 1회', status: '준비 필요' as const },
  { ch: '텔레그램', metric: '채널 통계 그래프', how: 'stats.getBroadcastStats (구독자 조건)', cycle: '일 1회', status: '준비 필요' as const },
  { ch: 'X', metric: '팔로워·노출·참여', how: '무료 티어 읽기 제한 → 유료 티어 검토', cycle: '일 1회', status: '수동' as const },
  { ch: '링크트리', metric: '링크별 클릭', how: '공개 API 없음 → UTM + GA4 대체', cycle: '일 1회', status: '자동' as const },
  { ch: '검색어', metric: '검색량 트렌드', how: '네이버 데이터랩 API', cycle: '일 1회', status: '자동' as const },
  { ch: '검색어', metric: '유입 검색어·노출', how: '구글 서치콘솔 API', cycle: '일 1회', status: '자동' as const },
  { ch: '사전신청', metric: '신청·초대·순번', how: '신청 페이지 DB 직결', cycle: '실시간', status: '자동' as const },
]

// ── 콘텐츠 3축 계획 비중 (주차별) vs 실제 ──
export const contentAxes = {
  plan: [
    { week: '1주 (개설 주간)', 측정: 50, 기대: 40, 판매: 10 },
    { week: '2주', 측정: 40, 기대: 35, 판매: 25 },
    { week: '3주', 측정: 30, 기대: 25, 판매: 45 },
    { week: '4주 (판매 주간)', 측정: 15, 기대: 15, 판매: 70 },
  ],
  actualWeek: 3,
  actual: { 측정: 33, 기대: 22, 판매: 45 },
}

// ── 게시물 형식 7종 발행 현황 ──
export const contentFormats = [
  { no: '①', name: '제품 실물', axis: '판매 안내', count: 6, share: 15.8, reach: 42800, save: 210 },
  { no: '②', name: '사용 장면', axis: '측정 이야기', count: 7, share: 18.4, reach: 31400, save: 168 },
  { no: '③', name: '측정 결과 비교', axis: '측정 이야기', count: 8, share: 21.1, reach: 68200, save: 940 },
  { no: '④', name: '짧은 영상', axis: '전 축 공용', count: 6, share: 15.8, reach: 54600, save: 320 },
  { no: '⑤', name: '데이터 카드', axis: '기대효과', count: 4, share: 10.5, reach: 47900, save: 1120 },
  { no: '⑥', name: '설명 그래픽', axis: '기대효과', count: 3, share: 7.9, reach: 22600, save: 240 },
  { no: '⑦', name: '공지 카드', axis: '판매 안내', count: 4, share: 10.5, reach: 38100, save: 96 },
]

export const cadence = { photoPerWeek: 5, photoActual: 5, videoPerWeek: 2, videoActual: 2 }

// ── 일정 · 마일스톤 (기준 2026-09-08) ──
export const milestones = [
  { date: '2026-08-18', label: '사전 의사결정 7건 확정', detail: '판매가·사전예약 비율·초대 경품·외부 매체·법률·박스 QR', dday: -21, done: true },
  { date: '2026-08-19', label: '채널 3곳 개설·정비', detail: '보안 설정 · 자동응답 · 고정 공지 · 첫 포스팅', dday: -20, done: true },
  { date: '2026-08-24', label: '사전신청 페이지 완비', detail: '최종 점검 완료', dday: -15, done: true },
  { date: '2026-08-26', label: '사전신청 접수 시작 · 티저', detail: '8/25~28 중 확정 → 8/26 시작', dday: -13, done: true },
  { date: '2026-09-05', label: '제품 실물 공개', detail: '판매 약 일주일 전 · 이번 달 최대 주목 시점', dday: -3, done: true },
  { date: '2026-09-15', label: '1차 판매 (5,000대)', detail: '시간대별 잔여 안내 · 완판 시 대기 접수 전환', dday: 7, done: false },
  { date: '2026-10-03', label: '2차 판매', detail: '1차 미구매 신청자 우선배정 · 1차 배송 전 진행', dday: 25, done: false },
]

// ── 외부 채널 소개 협의 ──
export const partners = [
  { name: '플레어 (파트너사)', ask: '생태계 소식 언급 · 링크 노출', when: '사전신청 시작일 · 판매일', prep: '영문 소개 자료', status: '확정', tone: 'ok' as const },
  { name: '타임레버리지 (유튜브)', ask: '영상 언급', when: '실물 공개일 · 판매일', prep: '진행 가이드 · 소재 패키지', status: '협의 중', tone: 'warn' as const },
  { name: '리플 공식 계정', ask: '게시물 인용 또는 짧은 소개 1회', when: '10/3 판매 시작일', prep: '영문 게시물 원문 · 이미지', status: '요청 발송', tone: 'navy' as const },
  { name: '업비트 (추후)', ask: '앱 공지 또는 알림', when: '업비트 판매 시작일', prep: '프로모션 협의에 따름', status: '미개시', tone: 'mute' as const },
]

// ── 사칭·리스크 모니터링 (Ripple 사례 — 사칭 주의 공지 정기 편성) ──
export const impersonation = {
  detected: 5,
  reported: 4,
  removed: 3,
  pending: 1,
  lastNotice: '09-06',
  noticeCycle: '주 1회 (⑦ 공지 카드 정기 항목)',
  cases: [
    { at: '09-07', ch: 'X', handle: '@wellbian_air_kr', type: '공식 계정 사칭', action: '신고 접수', tone: 'warn' as const },
    { at: '09-06', ch: '텔레그램', handle: 'WELLBIAN 공식 채널 2', type: '가짜 에어드랍 안내', action: '삭제 완료', tone: 'ok' as const },
    { at: '09-04', ch: 'X', handle: '@wellbian_official_', type: '사전신청 유도 피싱', action: '삭제 완료', tone: 'ok' as const },
    { at: '09-02', ch: '텔레그램', handle: 'K-Weather Airdrop', type: '토큰 지급 사칭', action: '삭제 완료', tone: 'ok' as const },
    { at: '08-30', ch: 'X', handle: '@kweather_depin', type: '유사 핸들 선점', action: '모니터링', tone: 'mute' as const },
  ],
}

// ── 운영 알림 (기간 무관 · 즉시 조치) ──
export const opsAlerts = [
  { level: '주의' as const, title: '2주 전 사전신청 목표 미달', detail: `09-01 누적 ${at2WeeksBefore.signup.toLocaleString('ko-KR')}명 / 목표 4,000명 (85.8%) — 외부 홍보 집중 구간`, action: '외부 파급 일정 앞당기기' },
  { level: '주의' as const, title: '투자 오인 검색어 증가', detail: '"케이웨더 코인" · "웰비안 에어드랍" 유입 상승 — 토큰 투자 기대 유입', action: '공지 카드에 프로젝트 성격 고지 편성' },
  { level: '정보' as const, title: '사칭 계정 1건 처리 대기', detail: 'X @wellbian_air_kr 신고 접수 상태', action: '플랫폼 신고 결과 확인' },
]
