// WELLBIAN 커뮤니티 운영 — 「커뮤니티 채널 운영」·「컨텐츠 기획안」(2026-08-17, 박서우) 스핀오프.
// 실제 운영 채널은 X·텔레그램 2곳(링크트리는 링크 허브). KPI 목표, 콘텐츠 축, 외부 파급, 사칭 대응을 데이터화.
// 실데이터 전환: server/collect.mjs → public/live/community.json (src/data/liveSource.ts)
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
  { ch: '텔레그램', metric: '구독자 수', how: 'Bot API · getChatMemberCount — server/collect.mjs 구현 완료', cycle: '1시간', status: '자동' as const },
  { ch: '텔레그램', metric: '가입·이탈 이벤트', how: 'Bot API · chat_member — server/webhook.mjs (공개 URL 필요)', cycle: '실시간', status: '자동' as const },
  { ch: '텔레그램', metric: '유입원 분해', how: '초대 링크 12종 — server/bootstrap-invites.mjs 로 선생성 (사후 복원 불가)', cycle: '실시간', status: '자동' as const },
  { ch: '텔레그램', metric: '대화방 메시지·응대', how: 'Bot API · Webhook', cycle: '실시간', status: '자동' as const },
  { ch: '텔레그램', metric: '게시물 조회수', how: 'Bot API 미지원 → MTProto(TDLib) 필요', cycle: '일 1회', status: '준비 필요' as const },
  { ch: '텔레그램', metric: '채널 통계 그래프', how: 'stats.getBroadcastStats (구독자 조건)', cycle: '일 1회', status: '준비 필요' as const },
  { ch: 'X', metric: '팔로워·노출·참여', how: '집계 읽기는 유료 티어, 개별 관계 조회는 엔터프라이즈 전용 → 수동 입력', cycle: '일 1회', status: '수동' as const },
  { ch: '링크트리', metric: '링크별 클릭', how: '공개 API 없음 → UTM + GA4 대체', cycle: '일 1회', status: '자동' as const },
  { ch: '검색어', metric: '검색량 트렌드', how: '네이버 데이터랩 API', cycle: '일 1회', status: '자동' as const },
  { ch: '검색어', metric: '유입 검색어·노출', how: '구글 서치콘솔 API', cycle: '일 1회', status: '자동' as const },
  { ch: '사전신청', metric: '신청·초대·순번', how: '신청 페이지 DB 직결', cycle: '실시간', status: '자동' as const },
  { ch: 'X', metric: '유입 기여', how: 'x_profile 초대 링크 + UTM — 팔로워가 아니라 실제 유입으로 측정', cycle: '실시간', status: '자동' as const },
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
  { date: '2026-08-19', label: '사전 의사결정 확정 · 채널 3곳 개설', detail: '배정 비율 70:30 · 점수 배점 · 추첨 물량 확정(페이지 기능 직결) + 채널 보안·고정 공지', dday: -20, done: true },
  { date: '2026-08-24', label: '사전신청 페이지 완비', detail: '점수 계산 · 그룹 산정 · 초대 링크 · 현황판 최종 점검', dday: -15, done: true },
  { date: '2026-08-26', label: '접수 개시 · 배정 비율 공개', detail: '8/25~28 중 확정 → 8/26 시작. 첫 사흘 자사 채널 집중 투입', dday: -13, done: true },
  { date: '2026-08-29', label: '첫 순위 발표', detail: '초대 상위자 호명 — 초대 루프의 첫 점화', dday: -10, done: true },
  { date: '2026-09-01', label: '중간 점검 · 목표 재산출', detail: '구매 의사 응답률로 전환 재계산 → 신청 목표 10,000명 유지', dday: -7, done: true },
  { date: '2026-09-05', label: '두 번째 순위 발표', detail: '초성 퀴즈(09-01~07) 병행 — 자료를 읽게 만들며 점수 부여', dday: -3, done: true },
  { date: '2026-09-08', label: '제품 실물 공개 · 마감 러시 시작', detail: '캠페인 최대 주목 시점. 09-08~12 신청자는 추첨 대상 구간', dday: 0, done: true },
  { date: '2026-09-12', label: '접수 마감 (24시)', detail: '마감 시각을 3일 전부터 매일 고지. 그룹 확정에 이틀 확보', dday: 4, done: false },
  { date: '2026-09-13', label: '그룹 확정 · 추첨 · 전원 문자', detail: 'S 그룹 가중 추첨 + 그룹별 최종 물량 공지', dday: 5, done: false },
  { date: '2026-09-14', label: '최종 안내', detail: '구매 방법 · 준비물 · 사칭 주의 재고지', dday: 6, done: false },
  { date: '2026-09-15', label: '1차 판매 (5,000대)', detail: '오전 S→A→B 30분 간격 · 오후 일반 공개(오전 잔여 이월)', dday: 7, done: false },
  { date: '2026-10-03', label: '2차 판매', detail: '1차 미구매 신청자 우선 배정 · 1차 배송 전 진행', dday: 25, done: false },
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
  { level: '주의' as const, title: '현재 진도로는 5,000대 미달', detail: '판매일 시뮬레이션 결과 미달분 발생 — 신청자 수보다 신청→결제 전환을 올리는 쪽이 효율적', action: '사전신청·판매 퍼널 화면에서 시나리오 확인' },
  { level: '주의' as const, title: '텔레그램 전입률 목표 미달', detail: '신청 완료 화면 → 커뮤니티 전입이 목표 40%에 못 미침 — 대량 유입의 유일한 경로', action: '신청 완료 화면 텔레그램 버튼 위치·문구 개선' },
  { level: '주의' as const, title: '2주 전 사전신청 목표 미달', detail: `09-01 누적 ${at2WeeksBefore.signup.toLocaleString('ko-KR')}명 / 목표 4,000명 (85.8%) — 외부 홍보 집중 구간`, action: '외부 파급 일정 앞당기기' },
  { level: '주의' as const, title: '투자 오인 검색어 증가', detail: '"케이웨더 코인" · "웰비안 에어드랍" 유입 상승 — 토큰 투자 기대 유입', action: '공지 카드에 프로젝트 성격 고지 편성' },
  { level: '정보' as const, title: '사칭 계정 1건 처리 대기', detail: 'X @wellbian_air_kr 신고 접수 상태', action: '플랫폼 신고 결과 확인' },
]

// ═══════════════════════════════════════════════════════════════════════
// 사전신청 프로모션 · 판매 퍼널 — 「사전신청 프로모션 기획」·「판매 퍼널 설계」
// (2026-08-17, 박서우) 반영. 기준일 2026-09-08 = 실물 공개일 · 마감 러시 시작.
// ═══════════════════════════════════════════════════════════════════════

export const SUPPLY_1ST = 5000 // 1차 판매 물량
export const SIGNUP_CLOSE = '2026-09-12'
export const GROUP_FIX = '2026-09-13'

/** 신청 완료 화면 → 텔레그램 전입 (유입원 분해에서 역산) */
const telegramFromSignup = Math.round((totals.telegram * telegramSources[0].pct) / 100)

/** 접수 현황 실적 — 신청 페이지 DB 직결(자동 수집) */
export const preorderNow = {
  pv: 24180,
  signup: totals.signup,
  buyIntent: 4268, // '판매일에 구매할 의사가 있다' 응답자
  telegramIn: telegramFromSignup,
  invited: 1504, // 초대 링크로 들어와 신청까지 완료한 사람
  eventDone: 2380, // 참여 이벤트 필수 미션 완료자
}

/** ① 목표와 성공 기준 — 최종 성공 기준은 신청자 수가 아니라 5,000대 완판 */
export const preorderGoals = [
  {
    name: '신청자 수', target: '10,000명', targetNum: 10000, now: preorderNow.signup,
    pct: (preorderNow.signup / 10000) * 100, unit: '명',
    note: '5,000대의 2배수. 09-01 첫 주 실적으로 상향 여부 판단',
  },
  {
    name: '구매 의사 응답률', target: '70% 이상', targetNum: 70,
    now: (preorderNow.buyIntent / preorderNow.signup) * 100, pct: ((preorderNow.buyIntent / preorderNow.signup) * 100 / 70) * 100, unit: '%',
    note: '신청 시 「판매일에 구매할 의사가 있다」 응답 비율 — 전환 예측의 근거',
  },
  {
    name: '텔레그램 전입률', target: '40% 이상', targetNum: 40,
    now: (preorderNow.telegramIn / preorderNow.signup) * 100, pct: ((preorderNow.telegramIn / preorderNow.signup) * 100 / 40) * 100, unit: '%',
    note: '신청 완료 화면 → 커뮤니티. 대량 유입의 유일한 경로',
  },
  {
    name: '초대 기여율', target: '20~30%', targetNum: 25,
    now: (preorderNow.invited / preorderNow.signup) * 100, pct: ((preorderNow.invited / preorderNow.signup) * 100 / 25) * 100, unit: '%',
    note: '전체 신청자 중 초대로 들어온 비중 — 스스로 자라는 경로의 크기',
  },
]

/** 방문 40,000의 경로별 목표 vs 현재 (합계 = 퍼널 출발점) */
export const trafficPlan = [
  { path: '친구 초대 링크', goal: 12000, now: 7240, share: 30, color: '#3E6FE0', note: '신청자가 순번을 올리려고 직접 확산 — 전환도 가장 높음' },
  { path: '자사 홍보 채널', goal: 12000, now: 8120, share: 30, color: '#2FA870', note: '날씨앱 알림·홈페이지·기존 고객 — 초기 씨앗을 만드는 경로' },
  { path: '참여 이벤트 공유', goal: 8000, now: 4180, share: 20, color: '#8F7BE8', note: '미션 「사전신청 소식 공유하기」에서 발생' },
  { path: '언론 보도 · 검색', goal: 4000, now: 2360, share: 10, color: '#E0A63E', note: '보도자료 배포와 기사 노출' },
  { path: '우리 채널 자체', goal: 2000, now: 1480, share: 5, color: '#3AA6B9', note: '개설 한 달 된 계정이라 낮게 설정' },
  { path: '외부 파트너 채널', goal: 2000, now: 800, share: 5, color: '#C9D2E2', note: '1차는 일정상 성사 난망 — 확정되면 그만큼 상향' },
]

/** ① 전체 퍼널 — 목표 시나리오(기획안)와 현재 실적을 나란히 */
export const salesFunnel = [
  { step: '페이지 방문 (PV)', goal: 40000, now: preorderNow.pv, conv: null as number | null, risk: '자사·외부·보도·검색이 만들어야 할 방문 수' },
  { step: '사전신청 완료', goal: 10000, now: preorderNow.signup, conv: 25, risk: '입력이 많으면 이탈 — 휴대폰 인증 하나로 30초' },
  { step: '이벤트 참여', goal: 5000, now: preorderNow.eventDone, conv: 50, risk: '미션이 많으면 중단 — 필수 2개 + 선택 나머지' },
  { step: '텔레그램 참여', goal: 5000, now: preorderNow.telegramIn, conv: 50, risk: '신청 완료 화면 버튼이 유일한 대량 경로' },
  { step: '판매일 접속', goal: 6500, now: null, conv: 65, risk: '잊어버립니다 — 문자 두 번(09-13 그룹 확정 · 09-15 아침)' },
  { step: '결제 완료', goal: 5000, now: null, conv: null, risk: '결제 실패·망설임 — 그룹 순차 개방으로 부하 분산' },
]

/** ③ 순번 점수제 — 페이지 기능에 직접 들어가는 확정값 */
export const scoreRules = [
  { item: '신청 완료', score: '기본 100점', note: '순번의 출발점. 동점이면 신청이 빠른 쪽이 앞', auto: true },
  { item: '구매 의사 응답', score: '+20점', note: '의사가 있는 사람을 앞으로 보내는 장치', auto: true },
  { item: '텔레그램 참여', score: '+20점', note: '봇으로 자동 확인', auto: true },
  { item: '친구 초대 (1명당)', score: '+30점', note: '초대받은 사람이 인증까지 마쳐야 인정', auto: true },
  { item: '초대 상한', score: '최대 10명 · 300점', note: '상한이 없으면 상위권 고착 → 나머지 포기', auto: true },
  { item: '초성 퀴즈 정답', score: '+20점', note: '1회 한정. 자료를 읽게 만드는 것이 목적', auto: true },
  { item: '최대 점수', score: '460점', note: '이론상 상한', auto: false },
  { item: 'X 팔로우 · 좋아요', score: '점수 없음', note: '팔로워·좋아요 조회 API는 엔터프라이즈 전용(Free·Basic·Pro 불가) + 신청자와 X 핸들을 연결할 방법 없음 → 추첨 응모권으로만 처리', auto: false },
]

/** ② 물량 배분과 그룹 — 앞 그룹 잔여는 뒤 그룹이 아니라 오후 일반 공개로 이월 */
export type SaleGroup = {
  key: 'S' | 'A' | 'B' | 'OPEN'
  name: string; who: string; open: string; alloc: number
  conv: number | null; convLabel: string; tone: 'ok' | 'navy' | 'warn' | 'mute'; character: string
  ask: string; prepare: string
}

export const saleGroups: SaleGroup[] = [
  {
    key: 'S', name: 'S 그룹', who: '이벤트 완료자 중 응모권 가중 추첨 1,000명', open: '오전 지정 시각',
    alloc: 1000, conv: 80, convLabel: '70~80%', tone: 'ok',
    character: '가장 열성적 — 채널까지 들어와 프로젝트를 이해한 상태. 판매 후 잔존도 최고',
    ask: '당첨됐나 · 언제 열리나', prepare: '09-13 문자에 당첨 여부·정확한 시각 명시. 시리얼 앞번호 안내',
  },
  {
    key: 'A', name: 'A 그룹', who: '나머지 사전신청자 중 점수 상위', open: '30분 후',
    alloc: 1500, conv: 45, convLabel: '40~50%', tone: 'navy',
    character: '관심은 있으나 이벤트까지는 안 한 층. 가격·배송 시점을 보고 결정',
    ask: '배송은 언제인가 · 지금 사도 되나', prepare: '제작·배송 일정 안내를 판매 전에 공지',
  },
  {
    key: 'B', name: 'B 그룹', who: '나머지 사전신청자 전원', open: '다시 30분 후',
    alloc: 1000, conv: 25, convLabel: '20~30%', tone: 'warn',
    character: '일단 신청해둔 층. 이탈이 가장 많지만 2차 대기 수요로 이어짐',
    ask: '남아 있나 · 못 사면 어떻게 되나', prepare: '실시간 잔여 안내 + 2차 대기 전환 안내를 미리',
  },
  {
    key: 'OPEN', name: '일반 공개', who: '사전신청 여부 무관 · 당일 유입', open: '오후 지정 시각',
    alloc: 1500, conv: null, convLabel: '수요 기반', tone: 'mute',
    character: '외부 채널 발신과 완판 소식을 보고 들어온 층. 즉시 결제 성향이 높음',
    ask: '이게 뭔가 · 믿을 만한가', prepare: '판매 페이지 자체가 설명서. 고정 공지·링크 모음으로 연결',
  },
]

/** 완판 시뮬레이터 — 신청자 수와 그룹 전환율로 판매일 소진을 계산 */
export function simulateSale(signups: number, convS: number, convA: number, convB: number, openDemand: number) {
  const sSize = Math.min(1000, signups)
  const rest = Math.max(0, signups - sSize)
  const aSize = Math.round(rest / 3) // A : B = 1 : 2 (기획안 3,000 : 6,000 기준)
  const bSize = rest - aSize

  const leg = (size: number, conv: number, alloc: number) => {
    const demand = Math.round(size * (conv / 100))
    const sold = Math.min(alloc, demand)
    return { size, demand, alloc, sold, left: alloc - sold, unmet: Math.max(0, demand - alloc) }
  }
  const s = leg(sSize, convS, 1000)
  const a = leg(aSize, convA, 1500)
  const b = leg(bSize, convB, 1000)

  const morningSold = s.sold + a.sold + b.sold
  const carry = s.left + a.left + b.left // 뒤 그룹이 아니라 오후로 이월
  const openAlloc = 1500 + carry
  const openSold = Math.min(openAlloc, openDemand)
  const total = morningSold + openSold

  return {
    legs: [s, a, b], morningSold, carry, openAlloc, openDemand, openSold,
    total, soldOut: total >= SUPPLY_1ST, gap: SUPPLY_1ST - total,
    waitlist: Math.max(0, signups - morningSold), // 2차 판매 대기 수요
  }
}

/** 기본 시나리오 = 기획안 가정 (신청 10,000 · 80/45/25 · 일반 수요 2,200) */
export const salePlan = simulateSale(10000, 80, 45, 25, 2200)
/** 현재 진도가 그대로 이어질 경우 */
export const saleNowPace = simulateSale(preorderNow.signup, 80, 45, 25, 2200)

/** ⑦ 어뷰징 방어 — 적발 기준은 접수 시작 전 공지 필수 */
export const abuseGuards = [
  { trick: '다계정', how: '한 사람이 여러 번호로 반복 신청', guard: '휴대폰 인증 1인 1회 · 동일 기기 반복 탐지', caught: 34 },
  { trick: '자기 초대', how: '본인이 만든 계정을 초대로 등록', guard: '동일 기기·동일 통신망 초대는 점수 미반영', caught: 68 },
  { trick: '대량 번호 동원', how: '대포번호로 초대 점수 확보', guard: '초대 상한 10명 · 단시간 대량 초대 보류 후 확인', caught: 12 },
  { trick: '봇 신청', how: '자동화 도구로 신청 반복', guard: '자동 입력 방지 · 비정상 속도 차단', caught: 216 },
  { trick: '순번 거래', how: '순번·계정을 거래하려는 시도', guard: '본인 명의 결제로 한정 · 거래 게시물 삭제', caught: 3 },
]

/** ⑨ 확정이 필요했던 항목 — 08-19 확정분(페이지 기능 직결) */
export const preorderDecisions = [
  { item: '사전신청 : 일반 공개 비율', value: '70 : 30 (3,500 : 1,500대)', fixedAt: '08-19', state: '확정' as const, note: '접수 첫날 숫자로 공개 · 판매일까지 불변' },
  { item: '점수 항목과 배점', value: '기본 100 · 의사 20 · 텔레그램 20 · 초대 30(상한 300) · 퀴즈 20', fixedAt: '08-19', state: '확정' as const, note: '페이지 기능 직결 — 08-24 완비 전 확정 필요했음' },
  { item: 'S 그룹 인원·선정 방식', value: '1,000명 · 응모권 가중 추첨', fixedAt: '08-19', state: '확정' as const, note: '완료자 1,000명 미만이면 전원 S · 잔여는 A로 (공지 반영 완료)' },
  { item: '추첨 물량 비율', value: '배정분 중 후반 신청자 몫', fixedAt: '08-19', state: '확정' as const, note: '09-08~12 신청자 전원 대상 · 09-13 추첨' },
  { item: '접수 개시일', value: '08-26', fixedAt: '08-19', state: '확정' as const, note: '8/25~28 중 확정' },
  { item: '구매 의사 문항 문구', value: '「판매일에 구매할 의사가 있다」', fixedAt: '08-21', state: '법률 검토 완료' as const, note: '계약상 의무로 읽히지 않도록 검토' },
  { item: '문자 발송 형식', value: '정보성 2회 (09-13 · 09-15)', fixedAt: '08-21', state: '법률 검토 완료' as const, note: '정보성·광고성 구분 표기 규정 준수' },
  { item: '목표 상향 여부', value: '10,000명 유지', fixedAt: '09-01', state: '유지' as const, note: '첫 주 실적으로 재산출 — 상향하지 않음' },
]

/** ④ 1차 · 2차 판매 비교와 두 판매를 잇는 장치 */
export const salePhases = {
  rows: [
    { label: '물량', first: '5,000대 — 상위 100대(600 RLUSD) + 일반 4,900대(400 RLUSD)', second: '10,000대 (10/3 리플 서울 행사 당일 개시)' },
    { label: '주 대상', first: '사전신청자 + 당일 유입', second: '1차 미구매 대기자 + 신규 + 행사 현장' },
    { label: '대기 수요', first: '없음 (처음)', second: `약 ${salePlan.waitlist.toLocaleString('ko-KR')}명 (신청 10,000 − 오전 결제 ${salePlan.morningSold.toLocaleString('ko-KR')})` },
    { label: '판매 방식', first: '그룹 순차 개방 + 오후 일반 공개', second: '1차 대기자 우선 → 일반 공개' },
    { label: '가장 큰 과제', first: '완판', second: '1차 구매자가 아직 못 받은 상태에서의 신뢰 관리' },
    { label: '콘텐츠 축', first: '측정 이야기 → 판매 안내로 이동', second: '제작 진행 상황 + 1차 완판 실적' },
    { label: '강점', first: '희소성 · 첫 물량 · 제네시스 번호(#0001~#0100)', second: '1차 완판 사실 자체가 근거 · 대기 수요 확보 · 행사 노출' },
    { label: '결제', first: 'RLUSD 단독 (원화 없음) · 트러스트라인 선행 필요', second: '동일' },
    { label: '위험', first: '전환율 미달로 미완판 · 트러스트라인 미설정 이탈', second: '"나는 아직 못 받았는데 또 파느냐"' },
  ],
  bridges: [
    { name: '자동 대기 전환', detail: '1차 미구매 신청자는 재신청 없이 2차 우선 대상. 완판 공지에 함께 안내', state: '개발 완료' as const },
    { name: '제작 진행 공개', detail: '1차 판매 다음 주부터 매주 1회. 2차 공지와 같은 날에도 반드시 함께', state: '편성 예정' as const },
    { name: '1차 구매자 우선 보장', detail: '배송이 2차보다 먼저라는 점과 앞번호 혜택을 2차 공지 전에 고지', state: '문안 준비' as const },
  ],
}

/** ⑤ 구간별 위험과 대응 */
export const funnelRisks = [
  { phase: '접수 첫 주', risk: '신청이 예상보다 저조', act: '외부 홍보 앞당김 · 09-01 중간 점검에서 판단', state: '지남' as const },
  { phase: '접수 후반', risk: '"어차피 늦었다"로 유입 정지', act: '절대 등수 대신 그룹 표시 · 마지막 주 추첨분 · 오후 일반 공개 반복 안내', state: '진행 중' as const },
  { phase: '판매 전날', risk: '그룹 확정 문자 미발송·오류', act: '접수를 09-12에 마감해 이틀 여유 확보', state: '대기' as const },
  { phase: '판매 당일 오전', risk: '접속 폭주', act: '그룹 30분 간격 개방 · 결제 리허설 사전 완료', state: '대기' as const },
  { phase: '판매 당일 오후', risk: '일반 공개 수요 부족', act: '외부 채널 발신 시점을 이 구간에 정렬', state: '대기' as const },
  { phase: '판매 직후', risk: '배송 문의로 커뮤니티가 고객센터화', act: '문의 창구 분리 · 배송 소요를 판매 화면에 사전 명시', state: '대기' as const },
  { phase: '2차 판매 전', risk: '1차 구매자 불만', act: '제작 진행 공개 + 배송 우선순위 명시', state: '대기' as const },
]
