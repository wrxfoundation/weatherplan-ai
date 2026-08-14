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
      { label: '수도권', pct: '42.5%', text: '3,491.1 RLUSD', value: 3491, color: '#3E6FE0' },
      { label: '영남권', pct: '28.4%', text: '2,332.9 RLUSD', value: 2333, color: '#8F7BE8' },
      { label: '호남권', pct: '18.7%', text: '1,536.1 RLUSD', value: 1536, color: '#2FA870' },
      { label: '충청·강원', pct: '10.4%', text: '854.2 RLUSD', value: 854, color: '#5BC8D8' },
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
// 국내 4개 권역 12,480(권역 비중은 M4 보상 분포와 정합) + 해외 파일럿 거점 1,640.
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
    { name: '서울·수도권', country: 'KR', lat: 37.55, lon: 126.98, count: 5301, active: 4892, idle: 232, offline: 84, maint: 93, uptime: 98.6, purity: 99.4, reward7d: 22034.4, rewardXrp: 6995.0 },
    { name: '부산·영남권', country: 'KR', lat: 35.18, lon: 129.08, count: 3545, active: 3104, idle: 155, offline: 224, maint: 62, uptime: 94.8, purity: 97.8, reward7d: 13981.0, rewardXrp: 4438.4 },
    { name: '광주·호남권', country: 'KR', lat: 35.16, lon: 126.85, count: 2333, active: 2153, idle: 102, offline: 37, maint: 41, uptime: 97.9, purity: 99.1, reward7d: 9697.5, rewardXrp: 3078.6 },
    { name: '대전·충청·강원', country: 'KR', lat: 36.35, lon: 127.38, count: 1301, active: 1180, idle: 57, offline: 41, maint: 23, uptime: 96.7, purity: 98.6, reward7d: 5314.9, rewardXrp: 1687.3 },
    { name: '도쿄', country: 'JP', lat: 35.68, lon: 139.69, count: 384, active: 354, idle: 17, offline: 6, maint: 7, uptime: 98.8, purity: 99.5, reward7d: 1594.5, rewardXrp: 506.2 },
    { name: '싱가포르', country: 'SG', lat: 1.35, lon: 103.82, count: 296, active: 273, idle: 13, offline: 5, maint: 5, uptime: 99.0, purity: 99.6, reward7d: 1229.6, rewardXrp: 390.3 },
    { name: '아테네', country: 'GR', lat: 37.98, lon: 23.73, count: 248, active: 229, idle: 11, offline: 4, maint: 4, uptime: 97.6, purity: 98.9, reward7d: 1031.5, rewardXrp: 327.5 },
    { name: '베를린', country: 'DE', lat: 52.52, lon: 13.4, count: 212, active: 196, idle: 9, offline: 3, maint: 4, uptime: 98.3, purity: 99.3, reward7d: 882.8, rewardXrp: 280.3 },
    { name: '런던', country: 'GB', lat: 51.51, lon: -0.13, count: 185, active: 171, idle: 8, offline: 3, maint: 3, uptime: 98.1, purity: 99.2, reward7d: 770.2, rewardXrp: 244.5 },
    { name: '뉴욕', country: 'US', lat: 40.71, lon: -74.01, count: 165, active: 152, idle: 7, offline: 3, maint: 3, uptime: 97.2, purity: 98.7, reward7d: 684.6, rewardXrp: 217.3 },
    { name: '시드니', country: 'AU', lat: -33.87, lon: 151.21, count: 150, active: 138, idle: 7, offline: 2, maint: 3, uptime: 98.5, purity: 99.4, reward7d: 621.6, rewardXrp: 197.3 },
  ] satisfies NodeHub[],
  // 하단 티커 (라이브 피드 연출)
  ticker: [
    '서울·수도권 신규 설치 +12대',
    '부산·영남권 오프라인 8대 복구 완료',
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
