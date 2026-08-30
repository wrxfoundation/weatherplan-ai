import { series } from '../rand'

// 사업 교정: 수익 항목의 'DePIN 보상 수익(IoTeX)' → '데이터 상점 수익(RLUSD)',
// 가상자산은 RLUSD·XRP·WLBN 보유분. 금액은 USD 환산 표기.
export const m5Demo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'gauge', tone: 'navy' as const, label: '총 자산 (USD)', value: '$4,892,350', delta: { text: '+8.3%', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(151, 14, 4.2, 4.9, 0.18), formula: '유동 자산 + 비유동 자산\n(가상자산은 월말 환산가)' },
    { icon: 'registry', tone: 'purple' as const, label: '총 부채 (USD)', value: '$1,234,560', delta: { text: '−2.1%', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(152, 14, 1.32, 1.23, 0.05), formula: '유동 부채 + 비유동 부채' },
    { icon: 'trendUp', tone: 'green' as const, label: '자기자본 (USD)', value: '$3,657,790', delta: { text: '+11.4%', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(153, 14, 3.1, 3.66, 0.14), formula: '총 자산 − 총 부채' },
    { icon: 'dollar', tone: 'orange' as const, label: '이번 달 순이익 (USD)', value: '$238,410', delta: { text: '+15.6%', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(154, 14, 0.18, 0.24, 0.03), formula: '월 매출 − 월 비용' },
    { icon: 'coins', tone: 'teal' as const, label: '누적 매출 (USD)', value: '$1,894,215', delta: { text: '+12.0%', tone: 'ok' as const }, deltaLabel: 'YTD', spark: series(155, 14, 1.4, 1.9, 0.1), formula: 'sum(수익) YTD\n서비스 + 데이터 상점 + 기타' },
    { icon: 'wallet', tone: 'navy' as const, label: '현금 보유액 (USD)', value: '$1,245,680', delta: { text: '+5.7%', tone: 'ok' as const }, deltaLabel: 'vs 지난 달', spark: series(156, 14, 1.1, 1.25, 0.06), formula: '현금 및 현금성 자산\n(원화 예금 + 스테이블 즉시 환금분)' },
  ],
  pnl: {
    months: ['03월', '04월', '05월', '06월', '07월', '08월'],
    revenue: [325000, 398000, 356000, 412000, 371000, 462000],
    cost: [218000, 231000, 208000, 246000, 224000, 297000],
    profit: [107000, 167000, 148000, 166000, 147000, 165000],
    yTicks: [0, 100000, 200000, 300000, 400000, 500000],
  },
  assets: {
    total: '$4,892,350',
    segments: [
      { label: '현금 및 현금성 자산', pct: '25.5%', text: '($1,245,680)', value: 25.5, color: '#3E6FE0' },
      { label: '가상자산 (RLUSD·XRP·WLBN)', pct: '32.8%', text: '($1,603,210)', value: 32.8, color: '#8F7BE8' },
      { label: '유동 자산', pct: '21.4%', text: '($1,046,780)', value: 21.4, color: '#2FA870' },
      { label: '고정 자산', pct: '15.6%', text: '($763,900)', value: 15.6, color: '#E0A63E' },
      { label: '기타 자산', pct: '4.7%', text: '($232,780)', value: 4.7, color: '#C9D2E2' },
    ],
  },
  cashflow: {
    steps: [
      { label: '기초 현금', value: 1020000, kind: 'base' as const },
      { label: '영업활동', value: 680000, kind: 'delta' as const },
      { label: '투자활동', value: -320000, kind: 'delta' as const },
      { label: '재무활동', value: -140000, kind: 'delta' as const },
      { label: '기말 현금', value: 1240000, kind: 'total' as const },
    ],
    yTicks: [0, 500000, 1000000, 1500000, 2000000],
  },
  balanceSheet: [
    { item: '유동 자산', amount: '$2,292,460', share: '46.9%', mom: '+7.8%', momUp: true, strong: false },
    { item: '비유동 자산', amount: '$2,599,890', share: '53.1%', mom: '+8.8%', momUp: true, strong: false },
    { item: '자산 총계', amount: '$4,892,350', share: '100%', mom: '+8.3%', momUp: true, strong: true },
    { item: '유동 부채', amount: '$892,340', share: '72.3%', mom: '−3.2%', momUp: false, strong: false },
    { item: '비유동 부채', amount: '$342,220', share: '27.7%', mom: '−0.8%', momUp: false, strong: false },
    { item: '부채 총계', amount: '$1,234,560', share: '100%', mom: '−2.1%', momUp: false, strong: true },
  ],
  equityTotal: { item: '자기자본 총계', amount: '$3,657,790', mom: '+11.4%' },
  income: {
    revenue: [
      { item: '서비스 수익', amount: '$1,254,780', share: '66.2%' },
      { item: '데이터 상점 수익 (RLUSD)', amount: '$412,210', share: '21.7%' },
      { item: '기타 수익', amount: '$227,225', share: '12.1%' },
    ],
    revenueTotal: { amount: '$1,894,215', share: '100%' },
    cost: [
      { item: '운영비', amount: '$724,560', share: '48.5%' },
      { item: '마케팅비', amount: '$312,450', share: '20.9%' },
      { item: '인건비', amount: '$298,320', share: '20.0%' },
      { item: '기타 비용', amount: '$158,475', share: '10.6%' },
    ],
    costTotal: { amount: '$1,493,805', share: '100%' },
  },
  txs: [
    { date: '2026-08-08', kind: '수익', desc: '데이터 상점 수취 (RLUSD)', amount: '+12,450', ok: true },
    { date: '2026-08-07', kind: '수익', desc: '서비스 수익 (Enterprise)', amount: '+45,000', ok: true },
    { date: '2026-08-07', kind: '비용', desc: '마케팅 집행 비용', amount: '−18,750', ok: false },
    { date: '2026-08-06', kind: '비용', desc: '서버 인프라 비용', amount: '−6,830', ok: false },
    { date: '2026-08-06', kind: '수익', desc: '서비스 수익 (API)', amount: '+23,400', ok: true },
  ],
}
