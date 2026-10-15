import { series } from '../rand'

export const m7Demo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'users', tone: 'navy' as const, label: '총 팔로워', value: '128,560', delta: { text: '+8.7%', tone: 'ok' as const }, spark: series(171, 14, 112000, 128560, 3200), formula: 'sum(채널별 팔로워 수)\n일 1회 스냅샷' },
    { icon: 'heart', tone: 'pink' as const, label: '게시물 참여 수', value: '16,842', delta: { text: '+12.3%', tone: 'ok' as const }, spark: series(172, 14, 13500, 16842, 900), formula: 'sum(좋아요+리트윗+반응) 7D' },
    { icon: 'eye', tone: 'green' as const, label: '총 조회 수', value: '532,410', delta: { text: '+15.6%', tone: 'ok' as const }, spark: series(173, 14, 420000, 532410, 22000), formula: 'sum(게시물 노출·조회) 7D' },
    { icon: 'share', tone: 'orange' as const, label: '공유 수', value: '2,184', delta: { text: '+6.2%', tone: 'ok' as const }, spark: series(174, 14, 1850, 2184, 140), formula: 'sum(공유·리포스트) 7D' },
    { icon: 'chat', tone: 'purple' as const, label: '댓글 수', value: '3,765', delta: { text: '+9.1%', tone: 'ok' as const }, spark: series(175, 14, 3100, 3765, 220), formula: 'sum(댓글·답글) 7D' },
    { icon: 'link', tone: 'teal' as const, label: '링크 클릭 수', value: '4,921', delta: { text: '+14.8%', tone: 'ok' as const }, spark: series(176, 14, 3900, 4921, 300), formula: 'sum(아웃바운드 링크 클릭) 7D' },
  ],
  channels: {
    total: '128,560',
    segments: [
      { key: 'x', label: 'X (Twitter)', text: '42,560 (33.1%)', value: 42560, color: '#16181C' },
      { key: 'tg', label: 'Telegram', text: '31,245 (24.3%)', value: 31245, color: '#2AA9E8' },
      { key: 'yt', label: 'YouTube', text: '22,480 (17.5%)', value: 22480, color: '#E0574F' },
      { key: 'dc', label: 'Discord', text: '18,750 (14.6%)', value: 18750, color: '#6E7BE8' },
      { key: 'md', label: 'Medium', text: '8,230 (6.4%)', value: 8230, color: '#2FA870' },
      { key: 'etc', label: '기타', text: '5,295 (4.1%)', value: 5295, color: '#C9D2E2' },
    ],
  },
  engagement: {
    days: ['08-02', '08-03', '08-04', '08-05', '08-06', '08-07', '08-08'],
    joins: [6400, 7300, 7900, 8300, 8100, 8700, 8900],
    views: [5200, 5600, 5900, 6100, 6000, 6300, 6200],
    shares: [2400, 2600, 2700, 2900, 2800, 3100, 2950],
    comments: [1100, 1250, 1300, 1450, 1400, 1550, 1500],
    yTicks: [0, 2000, 4000, 6000, 8000, 10000],
  },
  topPosts: [
    { rank: 1, title: 'KWeather DePIN 네트워크 업데이트', ch: 'x', views: '54,312', joins: '2,845' },
    { rank: 2, title: 'DePIN 보상 시즌2 안내', ch: 'yt', views: '38,765', joins: '1,976' },
    { rank: 3, title: '파트너십 체결: WeatherXM', ch: 'x', views: '32,410', joins: '1,652' },
    { rank: 4, title: 'KWeather 생태계 Q&A', ch: 'dc', views: '28,231', joins: '1,245' },
    { rank: 5, title: '정산 지수 (VWI) 활용 가이드', ch: 'md', views: '21,089', joins: '987' },
  ],
  channelPerf: [
    { ch: 'x', name: 'X (Twitter)', growth: '+3,245', posts: 12, views: '184,560', engage: '4.8%' },
    { ch: 'tg', name: 'Telegram', growth: '+2,156', posts: 18, views: '126,320', engage: '5.2%' },
    { ch: 'yt', name: 'YouTube', growth: '+1,875', posts: 5, views: '112,450', engage: '6.1%' },
    { ch: 'dc', name: 'Discord', growth: '+1,245', posts: 32, views: '64,210', engage: '7.3%' },
    { ch: 'md', name: 'Medium', growth: '+654', posts: 6, views: '18,765', engage: '3.9%' },
  ],
  hashtags: [
    { rank: 1, tag: '#KWeather', posts: 482, views: '256,120', joins: '9,845' },
    { rank: 2, tag: '#DePIN', posts: 312, views: '184,560', joins: '6,732' },
    { rank: 3, tag: '#DePINRewards', posts: 198, views: '112,450', joins: '4,321' },
    { rank: 4, tag: '#Web3', posts: 156, views: '78,965', joins: '2,876' },
    { rank: 5, tag: '#온체인', posts: 132, views: '64,210', joins: '2,145' },
  ],
  media: [
    { outlet: 'CoinNess', initial: 'C', color: '#2FA870', title: 'KWeather, DePIN 인프라로 실시간 날씨 데이터 혁신', date: '2026-08-08', tone: '긍정' },
    { outlet: 'BlockMedia', initial: 'B', color: '#3E6FE0', title: 'KWeather 파트너십 확대… DePIN 생태계 강화', date: '2026-08-07', tone: '긍정' },
    { outlet: 'TOKENPOST', initial: 'T', color: '#2AA9E8', title: 'KWeather 보상 시즌2 시작, 참여 방법은?', date: '2026-08-06', tone: '중립' },
    { outlet: 'Decrypt', initial: 'D', color: '#8F7BE8', title: 'KWeather, Web3 날씨 데이터의 미래 제시', date: '2026-08-05', tone: '긍정' },
    { outlet: 'The Block', initial: 'T', color: '#16181C', title: '#Weather, 온체인 지수(VWI) 정식 공개', date: '2026-08-04', tone: '긍정' },
  ],
}

export const channelBadge: Record<string, { label: string; bg: string }> = {
  x: { label: 'X', bg: '#16181C' },
  tg: { label: 'T', bg: '#2AA9E8' },
  yt: { label: 'Y', bg: '#E0574F' },
  dc: { label: 'D', bg: '#6E7BE8' },
  md: { label: 'M', bg: '#2FA870' },
}
