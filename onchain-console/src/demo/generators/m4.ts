import { series } from '../rand'

// 사업 교정: 타사 DePIN 네트워크(IoTeX·Helium 등) → 자사 공기질 측정기 네트워크,
// 보상 단위 KW → RLUSD. 수치는 대시보드(활성 12,842 · 지급 8,214.3 · 지급률 98.6% · 부정 큐 15)와 정합.
export const m4Demo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'cpu', tone: 'navy' as const, label: '활성 디바이스', value: '12,842', unit: '대', delta: { text: '+7.3%', tone: 'ok' as const }, deltaLabel: 'vs 어제', spark: series(141, 14, 10800, 12842, 420), formula: 'count(distinct device)\nwhere last_seen > now()−24h' },
    { icon: 'dollar', tone: 'green' as const, label: '오늘 지급 예정 (RLUSD)', value: '8,214.3', delta: { text: '−6.7%', tone: 'bad' as const }, deltaLabel: 'vs 어제', spark: series(142, 14, 9200, 8214, 380), formula: 'sum(가동률·품질 점수 기반 산정 보상)\nfor 금일 지급 대상 디바이스' },
    { icon: 'badge', tone: 'purple' as const, label: '지급 성공률 (7D)', value: '98.6%', delta: { text: '+1.8%', tone: 'ok' as const }, deltaLabel: 'vs 7D 이전', spark: series(143, 14, 96.2, 98.6, 0.7), formula: 'sum(paid) / sum(target) (7D)\n실패분은 재시도 큐로 이월' },
    { icon: 'alert', tone: 'orange' as const, label: '부정 보류', value: '15', unit: '건', delta: { text: '+3건', tone: 'bad' as const }, deltaLabel: 'vs 어제', spark: series(144, 14, 9, 15, 2.4), formula: 'count(fraud_queue where status=pending)\n시빌·가짜 데이터 의심 자동 보류' },
    { icon: 'gauge', tone: 'teal' as const, label: '평균 보상 / 디바이스', value: '0.64', unit: 'RLUSD', delta: { text: '+1.2%', tone: 'ok' as const }, deltaLabel: 'vs 어제', spark: series(145, 14, 0.58, 0.64, 0.02), formula: '오늘 지급 예정 / 지급 대상 디바이스 수' },
  ],
  // PRD §5.M4 안전장치 — 1일 한도·지갑 잔고·자동중단
  safety: {
    limit: { used: 8214.3, cap: 20000, ratio: 0.411, text: '8,214.3 / 20,000 RLUSD (41.1%)' },
    balance: { value: '45,210.8', unit: 'RLUSD', threshold: '임계 10,000', ok: true },
    killSwitch: { armed: true, lastCheck: '2분 전' },
  },
  trend: {
    data: series(146, 30, 6800, 8600, 700),
    yTicks: [0, 3000, 6000, 9000],
    xLabels: ['07-10', '07-16', '07-22', '07-28', '08-03', '08-08'],
  },
  regions: {
    total: '8,214.3',
    segments: [
      { label: '서울', pct: '27.2%', text: '2,235.1 RLUSD', value: 2235, color: '#3E6FE0' },
      { label: '부산', pct: '8.4%', text: '688.8 RLUSD', value: 689, color: '#8F7BE8' },
      { label: '수원', pct: '7.2%', text: '587.6 RLUSD', value: 588, color: '#2FA870' },
      { label: '대구', pct: '6.3%', text: '518.9 RLUSD', value: 519, color: '#5BC8D8' },
      { label: '기타 18개 도시', pct: '50.9%', text: '4,183.9 RLUSD', value: 4184, color: '#C9D2E2' },
    ],
  },
  batches: [
    { date: '08-08 09:00', devices: '12,614대', amount: '8,214.3', status: '완료', retry: null },
    { date: '08-07 09:00', devices: '12,468대', amount: '8,802.1', status: '완료', retry: null },
    { date: '08-06 09:00', devices: '12,391대', amount: '8,120.4', status: '완료', retry: null },
    { date: '08-05 09:00', devices: '12,350대', amount: '8,455.0', status: '완료', retry: '재시도 1회' },
    { date: '08-04 09:00', devices: '12,275대', amount: '8,301.7', status: '완료', retry: null },
  ],
  devices: [
    { id: 'KW-SEL-0241', region: '서울 마포', status: 'Active', uptime: '99.1%', reward: '4.52 RLUSD', change: '+15.2%', up: true },
    { id: 'KW-GG-1183', region: '경기 성남', status: 'Active', uptime: '98.3%', reward: '4.18 RLUSD', change: '+8.7%', up: true },
    { id: 'KW-BSN-0912', region: '부산 해운대', status: 'Idle', uptime: '94.2%', reward: '3.95 RLUSD', change: '−2.1%', up: false },
    { id: 'KW-ICN-0457', region: '인천 연수', status: 'Active', uptime: '97.8%', reward: '3.87 RLUSD', change: '+6.4%', up: true },
    { id: 'KW-SEL-1502', region: '서울 강남', status: 'Active', uptime: '99.5%', reward: '3.71 RLUSD', change: '+11.3%', up: true },
  ],
  forecast: {
    days: ['08-09', '08-10', '08-11', '08-12', '08-13', '08-14', '08-15'],
    data: [8320, 8710, 8280, 8150, 8390, 8460, 8810],
    yTicks: [0, 3000, 6000, 9000],
    total: '59,120.4 RLUSD',
    trendText: '+9.9%',
  },
  fraudQueue: [
    { level: 'high' as const, ref: 'r...abc123', devices: 8, reason: '동일 위치 다중 등록', sigma: '5.2', action: '지급 보류', status: 'pending' },
    { level: 'high' as const, ref: 'r...def456', devices: 6, reason: '실내 측정 의심 패턴', sigma: '4.1', action: '지급 보류', status: 'pending' },
    { level: 'high' as const, ref: 'r...ghi789', devices: 5, reason: '인근 센서 교차대조 불일치', sigma: '3.8', action: '지급 보류', status: 'pending' },
    { level: 'mid' as const, ref: 'r...jkl012', devices: 4, reason: '데이터 급변 이상치', sigma: '3.2', action: '지급 보류', status: 'pending' },
    { level: 'mid' as const, ref: 'r...mno345', devices: 3, reason: '가동률 위조 의심', sigma: '2.9', action: '지급 보류', status: 'pending' },
  ],
  fraudTotal: 15,
}

// 노드(공기질 디바이스) 글로벌 관리 맵 — 도트 월드맵 + 거점 마커용.
// 등록 14,120 = 활성 12,842(KPI 정합) + 유휴 618 + 오프라인 412 + 점검 248.
// 국내 15개 도시 12,480 + 해외 파일럿 7개 도시 1,640 (도시 단위 관리).
export type NodeHub = {
  name: string
  country: string
  lat: number
  lon: number
  count: number
  active: number
  idle: number
  offline: number
  maint: number
  uptime: number
  purity: number
  reward7d: number
  rewardXrp: number
}

export const nodeMapDemo = {
  totals: { registered: 14120, active: 12842, idle: 618, offline: 412, maint: 248, uptime: '97.4%', countries: 8, purity: '99.2%', validPass: '98.4%', outlierCut: '1.6%', reward7dRlusd: 57842.6, reward7dXrp: 18362.7, xrpRate: 3.15 },
  hubs: [
    { name: '서울', country: 'KR', lat: 37.57, lon: 126.98, count: 3842, active: 3523, idle: 168, offline: 84, maint: 67, uptime: 98.9, purity: 99.4, reward7d: 15868.2, rewardXrp: 5037.5 },
    { name: '수원', country: 'KR', lat: 37.26, lon: 127.03, count: 1010, active: 926, idle: 44, offline: 22, maint: 18, uptime: 98.4, purity: 99.2, reward7d: 4170.9, rewardXrp: 1324.1 },
    { name: '성남', country: 'KR', lat: 37.42, lon: 127.13, count: 806, active: 739, idle: 35, offline: 18, maint: 14, uptime: 98.5, purity: 99.3, reward7d: 3328.6, rewardXrp: 1056.7 },
    { name: '인천', country: 'KR', lat: 37.46, lon: 126.71, count: 704, active: 646, idle: 31, offline: 15, maint: 12, uptime: 98.1, purity: 99.0, reward7d: 2909.7, rewardXrp: 923.7 },
    { name: '부산', country: 'KR', lat: 35.18, lon: 129.08, count: 1184, active: 1007, idle: 52, offline: 104, maint: 21, uptime: 94.2, purity: 97.8, reward7d: 4535.7, rewardXrp: 1439.9 },
    { name: '대구', country: 'KR', lat: 35.87, lon: 128.6, count: 892, active: 817, idle: 39, offline: 20, maint: 16, uptime: 97.8, purity: 99.0, reward7d: 3679.9, rewardXrp: 1168.2 },
    { name: '창원', country: 'KR', lat: 35.23, lon: 128.68, count: 646, active: 579, idle: 28, offline: 28, maint: 11, uptime: 96.9, purity: 98.4, reward7d: 2607.9, rewardXrp: 827.9 },
    { name: '울산', country: 'KR', lat: 35.54, lon: 129.31, count: 421, active: 387, idle: 18, offline: 9, maint: 7, uptime: 97.2, purity: 98.6, reward7d: 1743.1, rewardXrp: 553.4 },
    { name: '광주', country: 'KR', lat: 35.16, lon: 126.85, count: 612, active: 561, idle: 27, offline: 13, maint: 11, uptime: 98.2, purity: 99.2, reward7d: 2526.8, rewardXrp: 802.2 },
    { name: '전주', country: 'KR', lat: 35.82, lon: 127.15, count: 508, active: 466, idle: 22, offline: 11, maint: 9, uptime: 97.7, purity: 99.0, reward7d: 2098.9, rewardXrp: 666.3 },
    { name: '제주', country: 'KR', lat: 33.5, lon: 126.53, count: 588, active: 539, idle: 26, offline: 13, maint: 10, uptime: 98.8, purity: 99.5, reward7d: 2427.7, rewardXrp: 770.7 },
    { name: '대전', country: 'KR', lat: 36.35, lon: 127.38, count: 412, active: 378, idle: 18, offline: 9, maint: 7, uptime: 98.0, purity: 99.1, reward7d: 1702.6, rewardXrp: 540.5 },
    { name: '청주', country: 'KR', lat: 36.64, lon: 127.49, count: 289, active: 265, idle: 13, offline: 6, maint: 5, uptime: 97.3, purity: 98.8, reward7d: 1193.6, rewardXrp: 378.9 },
    { name: '천안', country: 'KR', lat: 36.82, lon: 127.11, count: 342, active: 313, idle: 15, offline: 8, maint: 6, uptime: 96.8, purity: 98.3, reward7d: 1409.8, rewardXrp: 447.6 },
    { name: '강릉', country: 'KR', lat: 37.75, lon: 128.9, count: 224, active: 195, idle: 10, offline: 15, maint: 4, uptime: 95.8, purity: 98.0, reward7d: 878.3, rewardXrp: 278.8 },
    { name: '도쿄', country: 'JP', lat: 35.68, lon: 139.69, count: 384, active: 352, idle: 17, offline: 8, maint: 7, uptime: 98.8, purity: 99.5, reward7d: 1585.5, rewardXrp: 503.3 },
    { name: '싱가포르', country: 'SG', lat: 1.35, lon: 103.82, count: 296, active: 272, idle: 13, offline: 6, maint: 5, uptime: 99.0, purity: 99.6, reward7d: 1225.1, rewardXrp: 388.9 },
    { name: '아테네', country: 'GR', lat: 37.98, lon: 23.73, count: 248, active: 228, idle: 11, offline: 5, maint: 4, uptime: 97.6, purity: 98.9, reward7d: 1027.0, rewardXrp: 326.0 },
    { name: '베를린', country: 'DE', lat: 52.52, lon: 13.4, count: 212, active: 194, idle: 9, offline: 5, maint: 4, uptime: 98.3, purity: 99.3, reward7d: 873.8, rewardXrp: 277.4 },
    { name: '런던', country: 'GB', lat: 51.51, lon: -0.13, count: 185, active: 170, idle: 8, offline: 4, maint: 3, uptime: 98.1, purity: 99.2, reward7d: 765.7, rewardXrp: 243.1 },
    { name: '뉴욕', country: 'US', lat: 40.71, lon: -74.01, count: 165, active: 151, idle: 7, offline: 4, maint: 3, uptime: 97.2, purity: 98.7, reward7d: 680.1, rewardXrp: 215.9 },
    { name: '시드니', country: 'AU', lat: -33.87, lon: 151.21, count: 150, active: 134, idle: 7, offline: 5, maint: 4, uptime: 98.5, purity: 99.4, reward7d: 603.7, rewardXrp: 191.7 },
  ] satisfies NodeHub[],
  // 하단 티커 (라이브 피드 연출)
  ticker: [
    '서울 신규 설치 +12대',
    '부산 오프라인 8대 복구 완료',
    '도쿄 가동률 98.8% · 파일럿 안정 운영',
    '펌웨어 v2.4.1 배포 1,240대 완료 (실패 0건)',
    '아테네 WeatherXM 연계 248대 데이터 수신 정상',
    '오늘 보상 지급 예정 8,214.3 RLUSD · 배치 09:00',
    '싱가포르 가동률 99.0% 전 거점 최고',
    '부정 탐지 큐 15건 검토 대기 (M4)',
  ],
  events: [
    { icon: 'cpu', color: '#3E6FE0', title: '신규 설치 12대', sub: '경기 화성 산업단지 인근', ago: '2시간 전' },
    { icon: 'refresh', color: '#8F7BE8', title: '펌웨어 v2.4.1 배포 완료', sub: '전 거점 1,240대 · 실패 0건', ago: '5시간 전' },
    { icon: 'power', color: '#2FA870', title: '오프라인 복구 8대', sub: '부산 해운대 통신 장애 해소', ago: '어제' },
    { icon: 'gauge', color: '#E08A2E', title: '센서 교정 점검', sub: '서울 마포 외 24대 정기 교정', ago: '어제' },
    { icon: 'globe', color: '#3AB6C9', title: '시드니 파일럿 확장 +30대', sub: '남반구 계절 데이터 확보', ago: '2일 전' },
  ],
}
