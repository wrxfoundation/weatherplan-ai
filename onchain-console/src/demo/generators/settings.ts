// 모듈 모드 관리 · 알림 규칙 · 사용자 관리 · 감사 로그 데모 데이터
// 담당자·사용자·감사 액터는 동일 로스터로 정합. 날짜는 2026년(데모 기준일 08-13).

export const rosterColors: Record<string, string> = {
  박서우: '#3E6FE0', 김민수: '#2FA870', 이정훈: '#8F7BE8', 최수진: '#E08A2E',
  한대희: '#3AB6C9', 윤서영: '#E0568F', 김병국: '#8593AB', 홍재민: '#7059CE',
}

export const modesDemo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'sliders', tone: 'navy' as const, label: '데모 모드 모듈', value: '9', sub: '전체의 100%' },
    { icon: 'network', tone: 'green' as const, label: '라이브 모드 모듈', value: '0', sub: '전체의 0%' },
    { icon: 'clock', tone: 'orange' as const, label: '전환 대기', value: '2', sub: '전환 승인 대기 중' },
    { icon: 'refresh', tone: 'purple' as const, label: '최근 변경', value: '14', sub: '최근 7일간 변경' },
  ],
  modules: [
    { name: 'M1 활성 지갑', icon: 'wallet', request: null, status: '정상', changed: '2026-08-13 14:32', owner: '박서우' },
    { name: 'M2 정산 지수 (VWI)', icon: 'thermo', request: null, status: '정상', changed: '2026-08-13 13:58', owner: '이정훈' },
    { name: 'M3 결제/정산', icon: 'exchange', request: null, status: '정상', changed: '2026-08-13 13:45', owner: '김민수' },
    { name: 'M4 DePIN 보상', icon: 'cpu', request: '전환 대기', status: '승인 대기', changed: '2026-08-13 10:21', owner: '최수진' },
    { name: 'M5 재무 현황', icon: 'gauge', request: null, status: '정상', changed: '2026-08-12 17:02', owner: '김민수' },
    { name: 'M6 파트너 정산', icon: 'handshake', request: null, status: '점검 필요', changed: '2026-08-12 16:40', owner: '한대희' },
    { name: 'M7 소셜 & 미디어', icon: 'chat', request: '전환 대기', status: '승인 대기', changed: '2026-08-13 09:15', owner: '윤서영' },
    { name: 'M8 토큰 홀더', icon: 'coins', request: null, status: '정상', changed: '2026-08-13 14:05', owner: '이정훈' },
    { name: 'M9 리포트 & 알림', icon: 'doc', request: null, status: '정상', changed: '2026-08-13 14:48', owner: '박서우' },
  ],
  rules: [
    { title: '데이터 검증 완료', desc: '모든 필수 데이터의 정확성과 무결성 검증' },
    { title: '지갑 권한 승인', desc: '운영 지갑의 권한 및 서명 권한 승인 완료' },
    { title: '알림 설정 확인', desc: '중요 알림 채널 및 수신자 설정 확인' },
    { title: '백업 경로 점검', desc: '데이터 백업 및 복구 경로 정상 작동 확인' },
    { title: '담당자 승인', desc: '모듈 담당자의 LIVE 전환 승인 완료' },
  ],
  history: [
    { at: '2026-08-13 14:32', module: 'M1 활성 지갑', change: 'DEMO 모드 적용', changeTone: 'navy' as const, actor: '박서우', result: '성공', resultTone: 'ok' as const },
    { at: '2026-08-13 10:21', module: 'M4 DePIN 보상', change: 'LIVE 전환 요청', changeTone: 'bad' as const, actor: '최수진', result: '승인 대기', resultTone: 'warn' as const },
    { at: '2026-08-12 16:40', module: 'M6 파트너 정산', change: '상태 변경: 정상 → 점검 필요', changeTone: 'warn' as const, actor: '한대희', result: '성공', resultTone: 'ok' as const },
    { at: '2026-08-12 11:08', module: 'M2 정산 지수 (VWI)', change: 'DEMO 모드 적용', changeTone: 'navy' as const, actor: '이정훈', result: '성공', resultTone: 'ok' as const },
    { at: '2026-08-11 18:22', module: 'M7 소셜 & 미디어', change: 'LIVE 전환 요청', changeTone: 'bad' as const, actor: '윤서영', result: '승인 대기', resultTone: 'warn' as const },
  ],
  sync: { ok: 8, check: 1 },
}

export const alertRulesDemo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'bell', tone: 'navy' as const, label: '총 규칙 수', value: '23', sub: '활성 19 · 비활성 4' },
    { icon: 'audit', tone: 'green' as const, label: '지난 24시간 알림', value: '41', sub: '긴급 5 · 경고 12 · 정보 24' },
    { icon: 'trendUp', tone: 'purple' as const, label: '알림 전송 성공률', value: '98.6%', sub: '성공 40 · 실패 1' },
    { icon: 'clock', tone: 'orange' as const, label: '평균 알림 전송 시간', value: '2.4초', sub: '목표 < 5초' },
  ],
  // 사업 교정: 잔고·한도 규칙 모듈 M6→M4(지급지갑, PRD §5.M4), 매출 규칙 M1→M3, 실사 요청 M7→M6
  rules: [
    { pri: 'P1', name: 'DePIN 보상 지급 실패 감지', desc: '지급 트랜잭션 실패 시 즉시 알림', module: 'M4', cond: '지급 실패 > 0건', sev: '긴급' as const, channels: ['slack', 'email', 'sms'], on: true, last: '2026.08.13 14:32' },
    { pri: 'P1', name: 'RLUSD 잔고 부족 경고', desc: '지급 지갑 잔고가 임계값 이하', module: 'M4', cond: '잔고 < 5,000 RLUSD', sev: '경고' as const, channels: ['slack', 'email'], on: true, last: '2026.08.13 14:28' },
    { pri: 'P2', name: '측정기 이상 패턴 감지', desc: '이상 데이터 패턴 탐지', module: 'M4', cond: '이상 점수 > 80점', sev: '경고' as const, channels: ['slack', 'email'], on: true, last: '2026.08.13 14:15' },
    { pri: 'P2', name: '데이터 상점 매출 목표 초과', desc: '일일 매출 목표 120% 초과', module: 'M3', cond: '매출 > 목표 × 1.2', sev: '정보' as const, channels: ['email'], on: true, last: '2026.08.13 13:52' },
    { pri: 'P3', name: '주간 리포트 자동 발송', desc: '매주 금요일 09시 리포트 발송', module: 'M9', cond: '스케줄: 금 09:00', sev: '정보' as const, channels: ['email'], on: true, last: '2026.08.13 11:00' },
    { pri: 'P3', name: '지갑 일일 지출 한도 초과', desc: '24시간 지출이 한도 초과', module: 'M4', cond: '지출 > 한도', sev: '긴급' as const, channels: ['slack', 'email', 'sms'], on: true, last: '2026.08.13 10:43' },
    { pri: 'P4', name: '파트너 실사 요청 수신', desc: '파트너로부터 실사 요청 접수', module: 'M6', cond: '신규 요청 발생', sev: '정보' as const, channels: ['email'], on: true, last: '2026.08.13 09:21' },
    { pri: 'P4', name: '노드 오프라인 감지', desc: '측정기 노드 30분 이상 오프라인', module: 'M4', cond: '오프라인 > 30분', sev: '경고' as const, channels: ['slack', 'email'], on: false, last: '2026.08.12 22:18' },
  ],
  recent: [
    { level: '긴급' as const, title: 'DePIN 보상 지급 실패 감지', sub: 'node-2048 외 32건 지급 실패', at: '14:32' },
    { level: '경고' as const, title: 'RLUSD 잔고 부족 경고', sub: '잔고 4,812.45 RLUSD (임계값 5,000)', at: '14:28' },
    { level: '정보' as const, title: '데이터 상점 매출 목표 초과', sub: '일일 매출 126% 달성', at: '13:52' },
    { level: '경고' as const, title: '측정기 이상 패턴 감지', sub: '이상 점수 82점 (서울 강남구)', at: '13:15' },
    { level: '정보' as const, title: '주간 리포트 자동 발송 완료', sub: '수신자 8명 (경영진, 파트너)', at: '11:00' },
  ],
  channels: [
    { key: 'slack', name: 'Slack', sub: '#kweather-alerts', rules: '8개 규칙', color: '#611F69' },
    { key: 'email', name: 'Email', sub: 'alerts@kweather.co.kr', rules: '15개 규칙', color: '#3E6FE0' },
    { key: 'sms', name: 'SMS', sub: '010-****-1234', rules: '5개 규칙', color: '#2FA870' },
    { key: 'webhook', name: 'Webhook', sub: '2개 엔드포인트', rules: '7개 규칙', color: '#8F7BE8' },
  ],
}

export const usersDemo = {
  kpis: [
    { icon: 'users', tone: 'navy' as const, label: '전체 사용자', value: '28', sub: '+3 이번 주' },
    { icon: 'user', tone: 'green' as const, label: '활성 사용자', value: '21', sub: '+8.2% vs 지난 7일' },
    { icon: 'audit', tone: 'purple' as const, label: '관리자', value: '6', sub: '+1 이번 주' },
    { icon: 'user', tone: 'teal' as const, label: '일반 사용자', value: '18', sub: '+2 이번 주' },
    { icon: 'clock', tone: 'orange' as const, label: '비활성 사용자', value: '7', sub: '−2 이번 주' },
  ],
  // PRD §1.2의 v1 권한은 viewer/operator/admin 3종 — 아래는 확장 운영 비전 데모
  users: [
    { name: '박서우', me: true, email: 'park.seowoo@kweather.co.kr', role: '운영자', roleSub: '전체 권한', group: 'Administrators', groupTone: 'navy' as const, active: true, login: '2026.08.13 14:32', tfa: true },
    { name: '김민수', me: false, email: 'kim.minsu@kweather.co.kr', role: '재무 관리자', roleSub: '재무, 정산', group: 'Finance Team', groupTone: 'ok' as const, active: true, login: '2026.08.13 10:21', tfa: true },
    { name: '이정훈', me: false, email: 'lee.junghoon@kweather.co.kr', role: '데이터 분석가', roleSub: '지표, 리포트', group: 'Analytics Team', groupTone: 'navy' as const, active: true, login: '2026.08.13 09:15', tfa: true },
    { name: '최수진', me: false, email: 'choi.sujin@kweather.co.kr', role: 'DePIN 관리자', roleSub: '보상, 노드', group: 'DePIN Ops', groupTone: 'warn' as const, active: true, login: '2026.08.12 18:44', tfa: false },
    { name: '한대희', me: false, email: 'han.daehee@kweather.co.kr', role: '지원 관리자', roleSub: '사용자 지원', group: 'Support Team', groupTone: 'ok' as const, active: true, login: '2026.08.12 16:02', tfa: true },
    { name: '윤서영', me: false, email: 'yoon.seoyoung@kweather.co.kr', role: '마케팅 담당', roleSub: '소셜, 미디어', group: 'Marketing Team', groupTone: 'mute' as const, active: false, login: '2026.08.10 11:08', tfa: false },
    { name: '김병국', me: false, email: 'kim.byungguk@kweather.co.kr', role: '읽기 전용', roleSub: '조회 전용', group: 'Read Only', groupTone: 'mute' as const, active: true, login: '2026.08.13 08:31', tfa: true },
    { name: '홍재민', me: false, email: 'hong.jaemin@kweather.co.kr', role: '개발자', roleSub: 'API, 통합', group: 'Developers', groupTone: 'demo' as const, active: false, login: '2026.08.09 13:22', tfa: false },
  ],
  detail: {
    name: '박서우', role: '운영자', email: 'park.seowoo@kweather.co.kr',
    rows: [
      { label: '사용자 ID', value: 'user_0001' },
      { label: '소속 그룹', value: 'Administrators' },
      { label: '상태', value: '● 활성', tone: 'text-ok' },
      { label: '가입일', value: '2025.03.12 10:30' },
      { label: '마지막 로그인', value: '2026.08.13 14:32' },
      { label: '2단계 인증', value: '✓ 활성화', tone: 'text-ok' },
    ],
    tabs: ['권한', '활동 내역', '접속 기록', 'API 키'],
    activity: [
      { icon: 'audit', color: '#2FA870', title: '사용자 로그인', sub: '성공적으로 로그인했습니다.', at: '14:32:11' },
      { icon: 'doc', color: '#3E6FE0', title: '리포트 생성', sub: '월간 종합 리포트를 생성했습니다.', at: '14:20:45' },
      { icon: 'bell', color: '#E08A2E', title: '알림 규칙 수정', sub: 'DePIN 보상 지연 알림 규칙을 수정했습니다.', at: '13:15:22' },
      { icon: 'users', color: '#8F7BE8', title: '사용자 추가', sub: "새 사용자 '윤서영'을 추가했습니다.", at: '11:08:33' },
      { icon: 'gear', color: '#3AB6C9', title: '권한 변경', sub: '사용자 권한을 업데이트했습니다.', at: '09:45:12' },
    ],
  },
}

export const auditDemo = {
  updatedAgo: '2분 전',
  kpis: [
    { icon: 'registry', tone: 'navy' as const, label: '총 감사 로그', value: '128,640', sub: '전체 기간' },
    { icon: 'alert', tone: 'orange' as const, label: '최근 7일 긴급 이벤트', value: '23', sub: '▼ 35.3% vs 이전 7일', subTone: 'text-ok' },
    { icon: 'refresh', tone: 'green' as const, label: '오늘 변경 사항', value: '156', sub: '▲ 18.7% vs 어제', subTone: 'text-ok' },
    { icon: 'audit', tone: 'green' as const, label: '무결성 검증 상태', value: '정상', valueTone: 'text-ok', sub: '100% 무결성 유지' },
  ],
  dateRange: '2026-08-06 ~ 2026-08-13',
  rows: [
    { at: '2026.08.13 14:32:11', actor: '박서우', roleTag: 'operator', module: 'M1', moduleName: '활성 지갑', type: '생성', action: '지갑 등록', target: 'rJ9f...a7K9', targetSub: 'XRPL Mainnet', result: '성공', resultTone: 'ok' as const, sev: '보통', sevTone: 'navy' as const, ip: '203.247.12.45', device: 'Chrome / macOS' },
    { at: '2026.08.13 13:58:27', actor: '김민수', roleTag: 'finance', module: 'M9', moduleName: '리포트 & 알림', type: '수정', action: '알림 규칙 수정', target: 'DePIN 보상 지급 실패 감지', targetSub: 'rule_id: R-2048', result: '성공', resultTone: 'ok' as const, sev: '높음', sevTone: 'warn' as const, ip: '211.33.87.19', device: 'Chrome / Windows' },
    { at: '2026.08.13 13:45:09', actor: '최수진', roleTag: 'depin', module: 'M4', moduleName: 'DePIN 보상', type: '승인', action: '보상 지급 승인', target: 'node-1122', targetSub: '4,812.45 RLUSD', result: '성공', resultTone: 'ok' as const, sev: '높음', sevTone: 'warn' as const, ip: '203.247.12.45', device: 'Safari / macOS' },
    { at: '2026.08.13 12:21:33', actor: '김민수', roleTag: 'finance', module: 'M6', moduleName: '파트너 정산', type: '정산', action: '파트너 정산 실행', target: 'Flare Network', targetSub: '정산 ID: S-3081', result: '성공', resultTone: 'ok' as const, sev: '보통', sevTone: 'navy' as const, ip: '210.99.12.77', device: 'Edge / Windows' },
    { at: '2026.08.13 11:08:14', actor: '박서우', roleTag: 'operator', module: 'M9', moduleName: '리포트 & 알림', type: '발송', action: '리포트 발송', target: '월간 운영 리포트', targetSub: '2026-08', result: '성공', resultTone: 'ok' as const, sev: '정보', sevTone: 'mute' as const, ip: '203.247.12.45', device: 'Chrome / macOS' },
    { at: '2026.08.13 10:43:55', actor: '홍재민', roleTag: 'admin', module: '모드 관리', moduleName: 'LIVE 전환', type: '요청', action: 'LIVE 전환 요청', target: 'LIVE 전환', targetSub: '요청 사유: 운영 안정성 확보', result: '검토 필요', resultTone: 'warn' as const, sev: '긴급', sevTone: 'bad' as const, ip: '211.33.87.19', device: 'Chrome / Windows' },
    { at: '2026.08.13 09:21:06', actor: '한대희', roleTag: 'admin', module: '사용자 관리', moduleName: '권한 변경', type: '권한 변경', action: '역할 권한 변경', target: 'user_0007 (김병국)', targetSub: 'manager → admin', result: '성공', resultTone: 'ok' as const, sev: '높음', sevTone: 'warn' as const, ip: '203.247.12.45', device: 'Safari / macOS' },
    { at: '2026.08.13 08:14:32', actor: '박서우', roleTag: 'operator', module: '인증', moduleName: '로그인', type: '로그인', action: '로그인 성공', target: 'operator 계정', targetSub: '2단계 인증', result: '성공', resultTone: 'ok' as const, sev: '정보', sevTone: 'mute' as const, ip: '203.247.12.45', device: 'Chrome / macOS' },
  ],
  priority: [
    { level: '긴급' as const, title: 'LIVE 전환 요청', sub: '홍재민 · 모드 관리', at: '10:43' },
    { level: '경고' as const, title: '권한 과다 변경', sub: '한대희 · 사용자 관리', at: '09:21' },
    { level: '경고' as const, title: '알림 규칙 비활성화', sub: '이정훈 · 알림 규칙', at: '어제 22:14' },
    { level: '정보' as const, title: '보상 지급 실패', sub: '시스템 · M4 DePIN 보상', at: '어제 18:33' },
  ],
  distribution: {
    total: '12,843',
    segments: [
      { label: '사용자 관리', text: '3,124 (24.3%)', value: 24.3, color: '#3E6FE0' },
      { label: '지갑 관리', text: '2,876 (22.4%)', value: 22.4, color: '#2FA870' },
      { label: '보상 & 정산', text: '2,312 (18.0%)', value: 18.0, color: '#8F7BE8' },
      { label: '모니터링 & 알림', text: '2,198 (17.1%)', value: 17.1, color: '#E08A2E' },
      { label: '기타', text: '2,333 (18.2%)', value: 18.2, color: '#C9D2E2' },
    ],
  },
  integrity: [
    { label: '불변 스토리지', value: '활성화', tone: 'ok' as const },
    { label: '로그 보관 기간', value: '730일 (2년)' },
    { label: '최종 무결성 검증', value: '2026.08.13 14:30' },
    { label: '검증 방식', value: '해시 체인 + XRPL 기록' },
    { label: '다음 검증 예정', value: '2026.08.14 02:00' },
  ],
}
