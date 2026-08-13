import { series } from '../rand'

export const m2Demo = {
  updatedAgo: '2분 전',
  kpis: {
    current: {
      value: '23.48', unit: '°C', delta: '+0.62°C (2.71%)',
      basis: '기준: 2026-08-08 09:00 KST', spark: series(121, 16, 22.2, 23.5, 0.5),
    },
    snapshots: { value: '24', unit: '개', sub: '(전일 24개)' },
    stations: { active: 128, total: 142, ratio: 0.901, ratioText: '활성 비율 90.1%' },
    outliers: { value: '3', unit: '개', sub: '(제거 비율 2.1%)', spark: series(122, 16, 1, 3.2, 1.2) },
    anchor: { status: 'Anchored', lastTx: 'A12B...9F3C' },
    network: { name: 'XRPL Mainnet', ledgerIndex: '94,512,837' },
  },
  timeseries: {
    ranges: ['1D', '7D', '30D', '90D'],
    activeRange: '7D',
    data: series(123, 84, 21.6, 23.4, 0.8),
    yTicks: [18, 20, 22, 24, 26, 28],
    xLabels: ['08-02', '08-03', '08-04', '08-05', '08-06', '08-07', '08-08'],
  },
  composition: {
    total: 142,
    segments: [
      { label: '활성 (집계 반영)', count: 128, pct: '90.1%', value: 128, color: '#3E6FE0' },
      { label: '비활성 (연결 지연)', count: 9, pct: '6.3%', value: 9, color: '#2FA870' },
      { label: '제외 (이상치)', count: 3, pct: '2.1%', value: 3, color: '#E0A63E' },
      { label: '등록 대기', count: 2, pct: '1.4%', value: 2, color: '#C9D2E2' },
    ],
  },
  todaySnapshots: [
    { time: '09:00', value: '23.48', status: 'final', tx: 'A12B...9F3C' },
    { time: '06:00', value: '23.12', status: 'final', tx: '7C91...2B8A' },
    { time: '03:00', value: '22.81', status: 'final', tx: '3DAE...77F1' },
    { time: '00:00', value: '22.47', status: 'final', tx: '1F6B...A2C0' },
    { time: '어제 21:00', value: '22.19', status: 'final', tx: '98AB...4D2E' },
  ],
  anchors: [
    { at: '2026-08-08 09:00', value: '23.48', snaps: 24, total: 142, active: 128, removed: 3, payload: 'QmX8...7a9d', tx: 'A12B...9F3C', ledger: '94,512,837' },
    { at: '2026-08-08 06:00', value: '23.12', snaps: 24, total: 142, active: 130, removed: 2, payload: 'QmY3...c1de', tx: '7C91...2B8A', ledger: '94,510,221' },
    { at: '2026-08-08 03:00', value: '22.81', snaps: 24, total: 141, active: 129, removed: 2, payload: 'QmZ7...0f11', tx: '3DAE...77F1', ledger: '94,507,612' },
    { at: '2026-08-08 00:00', value: '22.47', snaps: 24, total: 141, active: 127, removed: 3, payload: 'QmT4...b2aa', tx: '1F6B...A2C0', ledger: '94,505,003' },
    { at: '2026-08-07 21:00', value: '22.19', snaps: 24, total: 141, active: 129, removed: 2, payload: 'QmR2...9bcf', tx: '98AB...4D2E', ledger: '94,502,394' },
  ],
}
