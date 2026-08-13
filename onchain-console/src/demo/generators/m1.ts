import { series } from '../rand'

export type WalletKind = 'ours_shop' | 'ours_payout' | 'ours_anchor' | 'ours_cold' | 'exchange' | 'partner' | 'whale'
export type WalletStatus = '활성' | '주의' | '비활성'

export type WalletRow = {
  addr: string
  label: string
  kind: WalletKind
  status: WalletStatus
  lastActive: string
  inToday: string
  outToday: string
  balanceRef: string | null
}

export const m1Demo = {
  kpis: {
    active: { value: 18, total: 24, ratio: 0.75 },
    inToday: { value: '12,451.7', delta: { text: '+18.3%', tone: 'ok' as const }, spark: series(111, 14, 8, 20, 3) },
    outToday: { value: '8,214.3', delta: { text: '−6.7%', tone: 'bad' as const }, spark: series(112, 14, 14, 9, 2.5) },
    selfTransfer: { value: '1,248', delta: { text: '+4.2%', tone: 'ok' as const }, spark: series(113, 14, 900, 1250, 120) },
    lastActivity: { value: '2분 전', sub: '(rP9S)' },
  },
  tabs: { all: 24, active: 18, inactive: 6, watch: 2 },
  wallets: [
    { addr: 'rKWea...Shop01', label: 'KC Shop Wallet', kind: 'ours_shop', status: '활성', lastActive: '2분 전', inToday: '5,214.8', outToday: '1,248.0', balanceRef: 'A1B2...9F3C' },
    { addr: 'rKWea...Payout01', label: 'Payout Wallet', kind: 'ours_payout', status: '활성', lastActive: '5분 전', inToday: '1,024.0', outToday: '4,250.0', balanceRef: '3F8A...7C1D' },
    { addr: 'rKWea...Anchor01', label: 'Index Anchor Wallet', kind: 'ours_anchor', status: '활성', lastActive: '12분 전', inToday: '0.0', outToday: '250.0', balanceRef: '9D3E...2A7B' },
    { addr: 'rKWea...Cold01', label: 'Cold Storage', kind: 'ours_cold', status: '활성', lastActive: '1시간 전', inToday: '0.0', outToday: '0.0', balanceRef: '7C2D...8E9F' },
    { addr: 'rExch...Upbit01', label: 'Upbit Deposit', kind: 'exchange', status: '활성', lastActive: '8분 전', inToday: '3,248.9', outToday: '0.0', balanceRef: 'B9AC...1D7E' },
    { addr: 'rPart...WeatherXM', label: 'WeatherXM Partner', kind: 'partner', status: '활성', lastActive: '23분 전', inToday: '2,145.0', outToday: '870.0', balanceRef: '61D4...3F7A' },
    { addr: 'rWhal...A12345', label: 'Whale A', kind: 'whale', status: '주의', lastActive: '3시간 전', inToday: '12,450.0', outToday: '0.0', balanceRef: 'E2F1...9B0C' },
    { addr: 'rKWea...Reserve01', label: 'Reserve Wallet', kind: 'ours_cold', status: '비활성', lastActive: '3일 전', inToday: '0.0', outToday: '0.0', balanceRef: null },
  ] as WalletRow[],
  distribution: [
    { kind: 'ours_shop', count: 5, pct: '20.8%', color: '#3E6FE0' },
    { kind: 'ours_payout', count: 4, pct: '16.7%', color: '#6EA0F0' },
    { kind: 'ours_anchor', count: 2, pct: '8.3%', color: '#2FA870' },
    { kind: 'ours_cold', count: 3, pct: '12.5%', color: '#8F7BE8' },
    { kind: 'exchange', count: 5, pct: '20.8%', color: '#B4C4E4' },
    { kind: 'partner', count: 3, pct: '12.5%', color: '#5BC8D8' },
    { kind: 'whale', count: 2, pct: '8.3%', color: '#E0A63E' },
  ],
  network: {
    ledgerIndex: '94,512,837',
    closeTime: '3.8초',
    nodes: '4 / 4',
    collect: '정상',
  },
  timeline: {
    days: ['08-02', '08-03', '08-04', '08-05', '08-06', '08-07', '08-08'],
    recv: series(114, 28, 9500, 14500, 2400),
    send: series(115, 28, 7000, 8200, 1700),
    self: series(116, 28, 3200, 5600, 1200),
  },
}

export const kindPillTone: Record<WalletKind, { bg: string; text: string }> = {
  ours_shop: { bg: 'bg-navy-soft', text: 'text-navy-deep' },
  ours_payout: { bg: 'bg-navy-soft', text: 'text-navy-deep' },
  ours_anchor: { bg: 'bg-ok-soft', text: 'text-ok' },
  ours_cold: { bg: 'bg-[#F0EDFB]', text: 'text-[#7059CE]' },
  exchange: { bg: 'bg-line-soft', text: 'text-body' },
  partner: { bg: 'bg-[#E4F6F9]', text: 'text-[#2E9AAC]' },
  whale: { bg: 'bg-amber-soft', text: 'text-amber' },
}
