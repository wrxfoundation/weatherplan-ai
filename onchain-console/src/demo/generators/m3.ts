import { series } from '../rand'

export const m3Demo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'snow', label: '수취 (XRPL)', value: '84,312.6', unit: 'XRP', delta: { text: '+18.3%', tone: 'ok' as const }, spark: series(131, 14, 8, 20, 3), formula: 'sum(amount) where direction=in\nand wallet_kind like ours_% (7D)' },
    { icon: 'exchange', label: '지급 (정산)', value: '57,498.2', unit: 'XRP', delta: { text: '−6.7%', tone: 'bad' as const }, spark: series(132, 14, 15, 9, 2.5), formula: 'sum(amount) where direction=out (7D)' },
    { icon: 'snow', label: '순 유입', value: '26,814.4', unit: 'XRP', delta: { text: '+35.7%', tone: 'ok' as const }, spark: series(133, 14, 5, 15, 3), formula: '수취 − 지급 (7D)' },
    { icon: 'exchange', label: '트랜잭션 수', value: '1,248', unit: '건', delta: { text: '+4.2%', tone: 'ok' as const }, spark: series(134, 14, 900, 1250, 130), formula: 'count(tx_events) (7D)' },
    { icon: 'clock', label: '평균 지연 시간 (p95)', value: '2분 전', unit: '', sub: '(rP95)', formula: 'p95(closed_at − submitted_at)', spark: undefined, delta: undefined },
    { icon: 'badge', label: '결제 성공률', value: '96.8%', unit: '', delta: { text: '+0.9%', tone: 'ok' as const }, spark: series(135, 14, 94.5, 97, 0.8), formula: 'tesSUCCESS 건수 / 전체 시도 건수 (7D)' },
  ],
  flow: {
    left: [
      { label: 'Shop Wallet', value: '82,126.4 XRP', sub: '(97.4%)', weight: 82126 },
      { label: 'Pay Widget', value: '1,248.6 XRP', sub: '(1.5%)', weight: 1249 },
      { label: '기타', value: '937.6 XRP', sub: '(1.1%)', weight: 938, color: '#B4C4E4' },
    ],
    center: { title: 'Our Shop Wallet', items: [{ label: '', value: '84,312.6 XRP' }] },
    right: [
      { label: 'Payout Wallet', value: '41,288.0 XRP', sub: '(48.9%)', weight: 41288 },
      { label: '파트너 정산', value: '12,450.0 XRP', sub: '(14.8%)', weight: 12450 },
      { label: '운영비 지출', value: '3,750.2 XRP', sub: '(4.4%)', weight: 3750, color: '#5BC8D8' },
      { label: 'Cold Storage', value: '0.0 XRP', sub: '(0.0%)', weight: 0, color: '#C9D2E2' },
    ],
    totalIn: '총 수취 84,312.6 XRP',
    totalOut: '총 지급 57,498.2 XRP',
  },
  txs: [
    { time: '08-08 14:32', dir: '수취', hash: 'A1B2...9F3C', party: 'rKWeather Shop', memo: 'INV-20260808-017', amount: '+1,248.60', ok: true },
    { time: '08-08 14:10', dir: '수취', hash: '7C91...2B8A', party: 'Pay Widget', memo: 'INV-20260808-016', amount: '+320.00', ok: true },
    { time: '08-08 13:48', dir: '지급', hash: '3DAE...77F1', party: 'Payout Wallet', memo: '사용자 보상', amount: '−850.00', ok: true },
    { time: '08-08 13:15', dir: '수취', hash: '1F6B...A2C0', party: 'rKWeather Shop', memo: 'INV-20260808-015', amount: '+2,450.00', ok: true },
    { time: '08-08 12:55', dir: '지급', hash: '98AB...4D2E', party: '파트너 정산', memo: 'Part-20260808-001', amount: '−1,200.00', ok: true },
    { time: '08-08 12:31', dir: '수취', hash: '6D11...3F7A', party: 'rKWeather Shop', memo: 'INV-20260808-014', amount: '+680.00', ok: true },
  ],
  spend: {
    total: '57,498.2',
    segments: [
      { label: 'Payout Wallet', value: 41288, text: '41,288.0 (71.8%)', color: '#3E6FE0' },
      { label: '파트너 정산', value: 12450, text: '12,450.0 (21.7%)', color: '#6EA0F0' },
      { label: '운영비 지출', value: 3750, text: '3,750.2 (6.5%)', color: '#E0A63E' },
      { label: '기타', value: 10, text: '0.0 (0.0%)', color: '#C9D2E2' },
    ],
  },
  latency: {
    headline: '2분 전',
    sub: '−0.8초 vs 3D 평균',
    unit: '단위: 분',
    xLabels: ['08-06', '08-07', '08-08'],
    yTicks: [0, 2, 4, 6],
    p50: series(136, 24, 0.8, 1.2, 0.5),
    p95: series(137, 24, 2.0, 2.4, 0.7),
    p99: series(138, 24, 3.4, 4.2, 1.0),
  },
  trend: {
    days: ['08-02', '08-03', '08-04', '08-05', '08-06', '08-07', '08-08'],
    recv: [24500, 28300, 21400, 31800, 26200, 29400, 27100],
    pay: [15200, 19800, 13900, 22400, 17800, 20100, 18600],
    net: [9300, 8500, 7500, 9400, 8400, 9300, 8500],
    yTicks: [0, 10000, 20000, 30000, 40000],
  },
  methods: {
    total: '84,312.6',
    segments: [
      { label: 'Shop Wallet', value: 82126, text: '97.4% (82,126.4)', color: '#3E6FE0' },
      { label: 'Pay Widget', value: 1249, text: '1.5% (1,248.6)', color: '#2FA870' },
      { label: '기타', value: 938, text: '1.1% (937.6)', color: '#C9D2E2' },
    ],
  },
  memoTags: [
    { tag: 'INV', desc: '(주문번호)', count: 612, amount: '62,450.60' },
    { tag: 'PAYOUT', desc: '(보상)', count: 184, amount: '18,250.00' },
    { tag: 'PARTNER', desc: '(파트너)', count: 42, amount: '12,450.00' },
    { tag: 'REFUND', desc: '(환불)', count: 12, amount: '1,120.00' },
    { tag: 'DONATION', desc: '', count: 6, amount: '42.00' },
  ],
  anomalies: {
    count: 3,
    rows: [
      { title: '높은 금액 수취', amount: '+12,450.00 XRP', source: 'rKWeather Shop', at: '08-08 11:22' },
      { title: '짧은 시간 다건 수취', amount: '5건 / 3분', source: 'Pay Widget', at: '08-08 10:14' },
      { title: '미등록 지갑 수취', amount: '+680.00 XRP', source: 'r...7F2A (Unknown)', at: '08-08 09:52' },
    ],
  },
}
