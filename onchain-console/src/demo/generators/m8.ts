import { series } from '../rand'

// 사업 교정: 토큰 심볼 KWT → WLBN, '체인별 홀더 비중' → '지갑 유형별 홀더 구성'(WLBN은 XRPL 단일 발행).
// 총 홀더·집중도는 대시보드(23,541 / Top10 32.6% / Top50 58.7% / 지니 0.42)와 정합.
export const m8Demo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'users', tone: 'navy' as const, label: '총 홀더 수', value: '23,541', delta: { text: '+5.2%', tone: 'ok' as const }, spark: series(181, 14, 21000, 23541, 500), formula: 'count(account_lines where balance>0)\n일 1회 스냅샷' },
    { icon: 'user', tone: 'green' as const, label: '활성 홀더 수', value: '15,842', delta: { text: '+4.1%', tone: 'ok' as const }, spark: series(182, 14, 14200, 15842, 420), formula: 'count(홀더 where 30일 내 트랜잭션 존재)' },
    { icon: 'trendUp', tone: 'purple' as const, label: '신규 홀더', value: '1,482', delta: { text: '+12.6%', tone: 'ok' as const }, spark: series(183, 14, 1100, 1482, 140), formula: 'count(이번 달 최초 보유 시작 지갑)' },
    { icon: 'coins', tone: 'orange' as const, label: '고래 지갑 수', value: '126', delta: { text: '+2.4%', tone: 'ok' as const }, spark: series(184, 14, 116, 126, 4), formula: 'count(잔고 > 100K WLBN)' },
    { icon: 'gauge', tone: 'navy' as const, label: '평균 보유량', value: '3,420', unit: 'WLBN', delta: { text: '+5.7%', tone: 'ok' as const }, spark: series(185, 14, 3050, 3420, 130), formula: 'sum(balance) / 홀더 수' },
    { icon: 'audit', tone: 'purple' as const, label: '홀더 유지율', value: '91.8%', delta: { text: '+1.9%', tone: 'ok' as const }, spark: series(186, 14, 89, 91.8, 1.1), formula: '전월 보유 & 당월에도 보유한 홀더\n/ 전월 홀더 수' },
  ],
  trend: {
    data: series(187, 30, 18600, 23541, 420),
    yTicks: [0, 6000, 12000, 18000, 24000],
    xLabels: ['07-10', '07-16', '07-22', '07-28', '08-03', '08-09'],
  },
  distribution: {
    total: '23,541',
    segments: [
      { label: '소액 홀더 (< 1K WLBN)', pct: '45.2%', text: '(10,641)', value: 45.2, color: '#3E6FE0' },
      { label: '일반 홀더 (1K ~ 10K WLBN)', pct: '29.8%', text: '(7,015)', value: 29.8, color: '#3FBF9F' },
      { label: '중대형 홀더 (10K ~ 100K WLBN)', pct: '15.7%', text: '(3,696)', value: 15.7, color: '#8F7BE8' },
      { label: '고래 홀더 (> 100K WLBN)', pct: '5.2%', text: '(1,224)', value: 5.2, color: '#E0A63E' },
      { label: 'Dormant (비활성)', pct: '4.1%', text: '(965)', value: 4.1, color: '#C9D2E2' },
    ],
    footer: { label: '총 홀더 수', value: '23,541 (100%)' },
  },
  walletTypes: [
    { rank: 1, type: '개인 지갑', count: '21,724', share: '92.3%' },
    { rank: 2, type: '거래소 예치', count: '1,224', share: '5.2%' },
    { rank: 3, type: '파트너', count: '312', share: '1.3%' },
    { rank: 4, type: '재단·운영', count: '165', share: '0.7%' },
    { rank: 5, type: '콜드·에스크로', count: '116', share: '0.5%' },
  ],
  grades: [
    { grade: 'Whale (> 100K WLBN)', badge: 'W', color: '#16181C', count: '126', avg: '512,340', mom: '+2.4%', momUp: true, active: '92.1%', status: 'Active' },
    { grade: 'Platinum (10K ~ 100K)', badge: 'P', color: '#3E6FE0', count: '3,570', avg: '38,720', mom: '+3.6%', momUp: true, active: '87.3%', status: 'Active' },
    { grade: 'Gold (1K ~ 10K)', badge: 'G', color: '#E0A63E', count: '7,015', avg: '4,560', mom: '+5.1%', momUp: true, active: '72.8%', status: 'Active' },
    { grade: 'Silver (100 ~ 1K)', badge: 'S', color: '#8593AB', count: '6,892', avg: '412', mom: '+4.7%', momUp: true, active: '58.6%', status: 'Stable' },
    { grade: 'Retail (< 100)', badge: 'R', color: '#5BC8D8', count: '4,973', avg: '28', mom: '+7.2%', momUp: true, active: '31.4%', status: '주의' },
    { grade: 'Dormant (비활성)', badge: 'D', color: '#C9D2E2', count: '965', avg: '356', mom: '−1.3%', momUp: false, active: '5.8%', status: '주의' },
  ],
  concentration: [
    { label: '상위 1 홀더', pct: 7.4, text: '7.4%', color: '#3E6FE0' },
    { label: '상위 10 홀더', pct: 32.6, text: '32.6%', color: '#2FA870' },
    { label: '상위 50 홀더', pct: 58.7, text: '58.7%', color: '#8F7BE8' },
    { label: '상위 100 홀더', pct: 66.4, text: '66.4%', color: '#E08A2E' },
    { label: '상위 500 홀더', pct: 79.2, text: '79.2%', color: '#3AB6C9' },
  ],
  moves: [
    { at: '2026-08-08 14:32', type: 'Whale', dir: '거래소 → 개인 지갑', amount: '+1,200,000', inbound: true },
    { at: '2026-08-08 11:05', type: 'Platinum', dir: '개인 지갑 → 거래소', amount: '−850,000', inbound: false },
    { at: '2026-08-07 23:18', type: 'Gold', dir: 'DeFi 스테이킹 해제', amount: '+320,450', inbound: true },
    { at: '2026-08-07 19:44', type: 'Whale', dir: 'OTC 거래', amount: '−500,000', inbound: false },
    { at: '2026-08-07 16:27', type: 'Platinum', dir: '개인 지갑 → 에스크로', amount: '+210,000', inbound: true },
  ],
}
