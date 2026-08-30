import { series } from '../rand'

// 사업 교정: 총 보유 RLUSD를 M5 가상자산(RLUSD·XRP·WLBN ≈ $1.6M)과 스케일 정합,
// 24시간 지출 8,214.3 = M4 오늘 지급과 정합. 레지스트리 18개 = 자사 지갑(운영 14 + 보조 4),
// M1의 24개는 관찰 대상 전체(자사 14 + 거래소·파트너·고래 10). Flare 지갑은 파트너십 근거 유지.
export const registryDemo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'wallet', tone: 'navy' as const, label: '총 등록 지갑', value: '18', sub: '운영 14 · 보조 4', formula: 'count(wallets)\n자사 지갑만 — M1(24)은 관찰 대상 전체' },
    { icon: 'dollar', tone: 'green' as const, label: '총 보유 잔액 (RLUSD)', value: '$1,564,581.85', sub: '≈ 1,564,582 RLUSD', formula: 'sum(balance) where currency=RLUSD\n(1 RLUSD ≈ 1 USD 페그)' },
    { icon: 'snow', tone: 'purple' as const, label: '총 보유 잔액 (XRP)', value: '12,450.92', unit: 'XRP', sub: '≈ $39,220.40 (1 XRP = $3.15 데모 환산)', formula: 'sum(balance) where currency=XRP\n리저브·수수료 운용분' },
    { icon: 'inbound', tone: 'teal' as const, label: '24시간 수신 (RLUSD)', value: '$3,247.90', delta: { text: '+18.6%', tone: 'ok' as const }, deltaLabel: '', spark: series(191, 14, 2.4, 3.3, 0.3), formula: 'sum(in) 24h — 데이터 상점·파트너 입금' },
    { icon: 'outbound', tone: 'orange' as const, label: '24시간 지출 (RLUSD)', value: '$8,214.30', delta: { text: '−6.7%', tone: 'bad' as const }, deltaLabel: '', spark: series(192, 14, 9.2, 8.2, 0.4), formula: 'sum(out) 24h — DePIN 보상 배치 포함\n(M4 오늘 지급과 동일)' },
    { icon: 'audit', tone: 'green' as const, label: '지갑 상태 정상', value: '16', sub: '88.9%', formula: 'count(status=정상) / 총 등록 지갑' },
  ],
  tabs: ['전체 지갑', '운영 지갑', '보상 지급 지갑', '수취 지갑', '보조 지갑'],
  wallets: [
    { name: '법인 메인 지갑', desc: '매출 수취 / 정산', addr: 'rLgH...a7k9', kind: '운영', kindTone: 'navy' as const, network: 'XRPL Mainnet', rlusd: '862,340.50', xrp: '2,450.40', change: '+12.4%', up: true },
    { name: '보상 지급 지갑 #1', desc: 'DePIN 보상 지급', addr: 'rB9k...mN3p', kind: '보상 지급', kindTone: 'ok' as const, network: 'XRPL Mainnet', rlusd: '412,450.20', xrp: '1,020.10', change: '−2.1%', up: false },
    { name: '데이터 상점 수취', desc: 'x402 결제 수취', addr: 'rDst...qP2e', kind: '수취', kindTone: 'demo' as const, network: 'XRPL Mainnet', rlusd: '184,780.30', xrp: '210.20', change: '+18.6%', up: true },
    { name: '파트너 정산 지갑', desc: '파트너 정산 전용', addr: 'rPrt...kL8m', kind: '운영', kindTone: 'navy' as const, network: 'XRPL Mainnet', rlusd: '98,910.10', xrp: '150.22', change: '+1.3%', up: true },
    { name: '예비 지갑 (Cold #1)', desc: '긴급 보관용', addr: 'rCold...xW1z', kind: '보조', kindTone: 'mute' as const, network: 'XRPL Mainnet', rlusd: '0.00', xrp: '5,000.00', change: '0.0%', up: true },
    { name: '수수료/스테이킹 지갑', desc: '수수료 & 리저브', addr: 'rFee...b7H2', kind: '운영', kindTone: 'navy' as const, network: 'XRPL Mainnet', rlusd: '6,100.75', xrp: '3,610.00', change: '+0.8%', up: true },
    { name: '테스트 운영 지갑', desc: '개발/테스트용', addr: 'rTest...n9Qk', kind: '보조', kindTone: 'mute' as const, network: 'XRPL Testnet', rlusd: '2,000.00', xrp: '10.00', change: '—', up: true },
    { name: '플레어 보상 수령 지갑', desc: 'Flare 보상 수령', addr: '0xFlare...b12a', kind: '운영', kindTone: 'navy' as const, network: 'Flare Network', rlusd: '—', xrp: '—', change: '—', up: true },
  ],
  networks: {
    total: '$1,579,032.05',
    segments: [
      { label: 'XRPL Mainnet', text: '$1,564,581.85 (99.1%)', value: 99.1, color: '#3E6FE0' },
      { label: 'Flare Network', text: '$12,450.20 (0.8%)', value: 0.8, color: '#8F7BE8' },
      { label: 'XRPL Testnet', text: '$2,000.00 (0.1%)', value: 0.1, color: '#2FA870' },
    ],
  },
  recentTxs: [
    { dir: '수신', desc: '데이터 상점 수취', amount: '+350.00 RLUSD', ago: '2분 전', inbound: true },
    { dir: '지출', desc: '보상 지급 지갑 #1 → 사용자 지급', amount: '−12,450.00 RLUSD', ago: '15분 전', inbound: false },
    { dir: '수신', desc: '법인 메인 지갑', amount: '+8,910.45 RLUSD', ago: '32분 전', inbound: true },
    { dir: '지출', desc: '파트너 정산 지갑', amount: '−45,000.00 RLUSD', ago: '1시간 전', inbound: false },
    { dir: '수신', desc: '수수료/스테이킹 지갑', amount: '+120.75 RLUSD', ago: '2시간 전', inbound: true },
  ],
  security: [
    { label: '다중서명 적용', value: '14 / 18 지갑', ratio: 0.778, pct: '77.8%' },
    { label: '지갑 한도 설정', value: '16 / 18 지갑', ratio: 0.889, pct: '88.9%' },
  ],
  lastAudit: { label: '최근 감사', value: '2026.08.12 14:30', status: '정상' },
}
