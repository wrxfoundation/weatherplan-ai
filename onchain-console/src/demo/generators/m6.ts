import { series } from '../rand'

// 사업 교정: 정산 방식 USDC/USDT → RLUSD(XRPL), 정산 ID 연도 2025 → 2026.
// 파트너명은 자사 생태계(데이터 유통·결제·DePIN 채널) 기준 데모 명칭.
export const m6Demo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'handshake', tone: 'navy' as const, label: '총 파트너 수', value: '128', delta: { text: '+12명', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(161, 14, 108, 128, 5), formula: 'count(partners where is_active)' },
    { icon: 'dollar', tone: 'green' as const, label: '총 수익 (이번 달)', value: '$248,910.45', delta: { text: '+18.6%', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(162, 14, 1.9, 2.5, 0.15), formula: 'sum(파트너 경유 매출) 당월\nUSD 환산 표기' },
    { icon: 'users', tone: 'purple' as const, label: '총 정산 금액 (이번 달)', value: '$210,345.20', delta: { text: '+16.3%', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(163, 14, 1.6, 2.1, 0.14), formula: 'sum(정산 완료 금액) 당월\n정산 통화는 RLUSD(XRPL)' },
    { icon: 'clock', tone: 'orange' as const, label: '정산 대기 금액', value: '$38,565.25', delta: { text: '−4.8%', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(164, 14, 4.4, 3.8, 0.4), formula: 'sum(발생 수익 − 정산 완료)\n미정산 잔액' },
    { icon: 'audit', tone: 'teal' as const, label: '정산 완료 건수', value: '512', delta: { text: '+22건', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(165, 14, 430, 512, 18), formula: 'count(settlements where status=완료) 당월' },
  ],
  status: {
    total: '$248,910.45',
    segments: [
      { label: '정산 완료', text: '$210,345.20 (84.5%)', value: 84.5, color: '#3E6FE0' },
      { label: '정산 대기', text: '$38,565.25 (15.5%)', value: 15.5, color: '#3FBF9F' },
      { label: '보류', text: '$0.00 (0.0%)', value: 0, color: '#E0A63E' },
      { label: '취소', text: '$0.00 (0.0%)', value: 0, color: '#8F7BE8' },
    ],
  },
  trend: {
    months: ['03월', '04월', '05월', '06월', '07월', '08월'],
    revenue: [152000, 178000, 196000, 188000, 224000, 248910],
    settled: [118000, 142000, 158000, 155000, 186000, 210345],
    yTicks: [0, 50000, 100000, 150000, 200000, 250000, 300000],
  },
  tiers: {
    total: '128',
    segments: [
      { label: 'Platinum', text: '12 (9.4%)', value: 12, color: '#3E6FE0' },
      { label: 'Gold', text: '28 (21.9%)', value: 28, color: '#E0A63E' },
      { label: 'Silver', text: '45 (35.2%)', value: 45, color: '#B4BDCD' },
      { label: 'Bronze', text: '43 (33.6%)', value: 43, color: '#D08A5A' },
    ],
  },
  partners: [
    { name: 'WeatherXM', tier: 'Platinum', revenue: '$45,210.50', settled: '$40,210.50', pending: '$5,000.00', lastDate: '2026-08-06', status: '정산 완료' },
    { name: 'PredictSeoul', tier: 'Gold', revenue: '$32,450.20', settled: '$28,450.20', pending: '$4,000.00', lastDate: '2026-08-06', status: '정산 완료' },
    { name: 'AirData Labs', tier: 'Gold', revenue: '$28,980.75', settled: '$20,980.75', pending: '$8,000.00', lastDate: '2026-08-05', status: '정산 대기' },
    { name: "D'CENT Pay", tier: 'Silver', revenue: '$18,760.40', settled: '$18,760.40', pending: '$0.00', lastDate: '2026-08-04', status: '정산 완료' },
    { name: 'DePIN Hub', tier: 'Silver', revenue: '$17,230.30', settled: '$13,230.30', pending: '$4,000.00', lastDate: '2026-08-04', status: '정산 대기' },
  ],
  settlements: [
    { id: 'SETT-2026-0806-001', partner: 'WeatherXM', amount: '$40,210.50', method: 'RLUSD', date: '2026-08-06', status: '완료' },
    { id: 'SETT-2026-0806-002', partner: 'PredictSeoul', amount: '$28,450.20', method: 'RLUSD', date: '2026-08-06', status: '완료' },
    { id: 'SETT-2026-0805-003', partner: 'AirData Labs', amount: '$20,980.75', method: 'RLUSD', date: '2026-08-05', status: '완료' },
    { id: 'SETT-2026-0804-004', partner: "D'CENT Pay", amount: '$18,760.40', method: 'RLUSD', date: '2026-08-04', status: '완료' },
    { id: 'SETT-2026-0804-005', partner: 'DePIN Hub', amount: '$13,230.30', method: 'RLUSD', date: '2026-08-04', status: '완료' },
  ],
}

export const tierPill: Record<string, { bg: string; text: string }> = {
  Platinum: { bg: 'bg-navy-soft', text: 'text-navy-deep' },
  Gold: { bg: 'bg-amber-soft', text: 'text-amber' },
  Silver: { bg: 'bg-line-soft', text: 'text-body' },
  Bronze: { bg: 'bg-[#F7EBE1]', text: 'text-[#B06A38]' },
}
