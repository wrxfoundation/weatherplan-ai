import { series } from '../rand'

export const dashboardDemo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'snow', label: '오늘 총 수취 (XRPL)', value: '12,451.7', delta: { text: '+18.3%', tone: 'ok' as const }, spark: series(101, 14, 8, 20, 3), formula: 'sum(amount)\nwhere direction=in and closed_at::date=today' },
    { icon: 'trendUp', label: '오늘 총 지급 (RLUSD)', value: '8,214.3', delta: { text: '−6.7%', tone: 'bad' as const }, spark: series(102, 14, 14, 9, 2.5), formula: 'sum(amount)\nwhere currency=RLUSD and direction=out\nand closed_at::date=today' },
    { icon: 'thermo', label: 'VWI 지수 (서울-기온)', value: '23.48 °C', delta: { text: '+0.62', tone: 'ok' as const }, spark: series(103, 14, 21.8, 23.5, 0.6), formula: 'VWI = Σ(wᵢ·Tᵢ) / Σwᵢ\n활성 관측소 가중 평균 (이상치 제거 후)' },
    { icon: 'cpu', label: 'DePIN 활성 디바이스', value: '12,842', delta: { text: '+7.3%', tone: 'ok' as const }, spark: series(104, 14, 10500, 12842, 500), formula: 'count(distinct device)\nwhere last_seen > now()−24h' },
    { icon: 'badge', label: '보상 지급률 (7D)', value: '98.6%', delta: { text: '+1.8%', tone: 'ok' as const }, deltaLabel: 'vs 7D 이전', spark: series(105, 14, 96, 98.6, 0.8), formula: 'sum(paid_amount) / sum(target_amount)\nover last 7 days' },
    { icon: 'coins', label: '홀더 수 (WLBN)', value: '23,541', delta: { text: '+5.2%', tone: 'ok' as const }, spark: series(106, 14, 21000, 23541, 600), formula: 'count(account_lines)\nwhere balance > 0 (일 1회 스냅샷)' },
  ],
  flow: {
    left: [{ label: '수취 (XRPL)', value: '84,312', sub: '+18.3%', subTone: 'ok' as const, weight: 84312 }],
    center: { title: '우리 지갑', items: [{ label: 'Shop Wallet', value: '82,126' }, { label: 'Payout Wallet', value: '2,186' }] },
    right: [
      { label: '지급 (RLUSD)', value: '57,498', sub: '−6.7%', subTone: 'bad' as const, weight: 57498 },
      { label: 'DePIN 보상', value: '41,298', weight: 41298 },
      { label: '파트너 정산', value: '12,450', weight: 12450 },
    ],
  },
  vwi: {
    current: '23.48 °C',
    delta: '+0.62 (2.71%)',
    seriesData: series(107, 64, 21.7, 23.4, 0.55),
    dashedY: 23.9,
    stats: [
      { label: '스테이션', value: '128' },
      { label: '활성', value: '112' },
      { label: '이상치 제거', value: '3' },
      { label: '상태', value: 'Final' },
    ],
  },
  fraudQueue: {
    total: 15,
    rows: [
      { level: 'high' as const, ref: 'r...abc123', devices: 8, sigma: '5.2', status: 'pending' },
      { level: 'high' as const, ref: 'r...def456', devices: 6, sigma: '4.1', status: 'pending' },
      { level: 'high' as const, ref: 'r...ghi789', devices: 5, sigma: '3.8', status: 'pending' },
      { level: 'mid' as const, ref: 'r...jkl012', devices: 4, sigma: '3.2', status: 'pending' },
      { level: 'mid' as const, ref: 'r...mno345', devices: 3, sigma: '2.9', status: 'pending' },
    ],
  },
  sentiment: {
    segments: [
      { label: '긍정', pct: '68%', count: 340, value: 68, color: '#3E6FE0' },
      { label: '중립', pct: '22%', count: 110, value: 22, color: '#C6D2E8' },
      { label: '부정', pct: '10%', count: 50, value: 10, color: '#8593AB' },
    ],
    totalMentions: 500,
    kolMentions: 35,
  },
  holders: {
    stats: [
      { label: '홀더 수', value: '23,541', delta: '+5.2%', tone: 'ok' as const },
      { label: 'Top10', value: '32.6%', delta: '−0.8%', tone: 'bad' as const },
      { label: 'Top50', value: '58.7%', delta: '−1.1%', tone: 'bad' as const },
      { label: '지니 계수', value: '0.42', delta: '−0.02', tone: 'bad' as const },
    ],
    seriesData: series(108, 30, 18600, 23541, 400),
  },
  alerts: [
    { module: 'M3', tone: 'bad' as const, message: '일일 수취액이 임계값을 초과', ago: '10분 전' },
    { module: 'M4', tone: 'bad' as const, message: '부정 탐지 큐 항목 증가', ago: '25분 전' },
    { module: 'M2', tone: 'navy' as const, message: 'VWI 지수 이상치 발생', ago: '1시간 전' },
    { module: 'M5', tone: 'warn' as const, message: '월간 운영비 지출 80% 도달', ago: '2시간 전' },
  ],
}
