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
