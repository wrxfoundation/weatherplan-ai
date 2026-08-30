// 데모 기준일: 2026-08-13(목). 주간 리포트는 금 09:00 발송(PRD §8) → 08-14 내일.
export const m9Demo = {
  updatedAgo: '2분 전',
  summary: [
    { icon: 'bell', tone: 'navy' as const, label: '미확인 알림', value: '12', valueTone: 'text-navy', sub: '긴급 3 · 경고 5 · 정보 4', link: '알림 센터로 이동' },
    { icon: 'doc', tone: 'green' as const, label: '주간 리포트', value: '완료', valueTone: 'text-ok', sub: '이번 주 1건 발송', link: '주간 리포트 보기' },
    { icon: 'registry', tone: 'orange' as const, label: '월간 리포트', value: '진행 중', valueTone: 'text-warn', sub: '8월 리포트 작성 중', link: '월간 리포트 보기' },
    { icon: 'chat', tone: 'purple' as const, label: '파트너 리포트', value: '7', valueTone: 'text-[#7059CE]', sub: '요청 대기 2 · 회신 완료 5', link: '파트너 리포트 보기' },
  ],
  alerts: [
    { level: '긴급' as const, title: 'DePIN 보상 지급 실패 감지', sub: 'node-2048 외 32건 지급 실패', ago: '5분 전' },
    { level: '경고' as const, title: 'RLUSD 잔고 부족 임박', sub: '예비 지급 지갑 4,812.45 RLUSD (임계 5,000)', ago: '18분 전' },
    { level: '정보' as const, title: '데이터 상점 매출 목표 초과', sub: '일일 매출 목표 120% 달성', ago: '1시간 전' },
    { level: '경고' as const, title: '측정기 이상 패턴 감지', sub: 'location: 서울 강남구 node-1122', ago: '2시간 전' },
    { level: '정보' as const, title: '주간 리포트 자동 발송 완료', sub: '수신자 8명 (경영진, 파트너)', ago: '4시간 전' },
  ],
  schedule: [
    { icon: 'registry', title: '주간 운영 리포트', sub: '운영 현황 · 지표 · 이슈 요약', date: '2026.08.14 (금)', badge: '내일', badgeTone: 'bad' as const },
    { icon: 'cpu', title: 'DePIN 보상 운영 보고서', sub: '보상 지급 현황 · 이상 탐지 · 적발 건수', date: '2026.08.17 (월)', badge: 'D-4', badgeTone: 'warn' as const },
    { icon: 'doc', title: '월간 종합 리포트', sub: '8월 운영 종합 · 재무 · 파트너 현황', date: '2026.08.31 (월)', badge: 'D-18', badgeTone: 'navy' as const },
    { icon: 'handshake', title: '파트너 성과 리포트', sub: 'Ripple · Chainlink · Flare 등', date: '2026.09.04 (금)', badge: 'D-22', badgeTone: 'ok' as const },
    { icon: 'badge', title: '시연 성과 리포트 (XRP Seoul)', sub: '10/3 시연 결과 · KPI · 피드백', date: '2026.10.06 (화)', badge: 'D-54', badgeTone: 'mute' as const },
  ],
  weekStats: [
    { icon: 'alert', tone: 'bad', label: '긴급 알림', value: 8, delta: '▲ 33%', deltaTone: 'text-bad' },
    { icon: 'bell', tone: 'warn', label: '경고 알림', value: 23, delta: '▲ 12%', deltaTone: 'text-warn' },
    { icon: 'info', tone: 'navy', label: '정보 알림', value: 41, delta: '▼ 5%', deltaTone: 'text-ok' },
    { icon: 'audit', tone: 'ok', label: '해결된 알림', value: 56, delta: '▲ 18%', deltaTone: 'text-ok' },
  ],
  weekChart: {
    days: ['08-07', '08-08', '08-09', '08-10', '08-11', '08-12', '08-13'],
    data: [28, 35, 42, 38, 52, 45, 58],
    yTicks: [0, 20, 40, 60, 80],
  },
}
