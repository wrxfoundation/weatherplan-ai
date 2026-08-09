// ─── 데모 시드 데이터 (localStorage 초기화용) ────────────────────
// 모든 타임스탬프는 로드 시점 기준 상대값으로 생성 → 데모가 항상 "살아있는" 상태

const now = () => Date.now()
const minAgo = (m) => now() - m * 60000
const dayAgo = (d) => now() - d * 86400000
const dayAfter = (d) => now() + d * 86400000

export const SEED_VERSION = 9

export function buildSeed() {
  const tenants = [
    { id: 'T1', slug: 'happynet', name: '해피넷 통신', owner: '박정우', unit: 'SD2', sigungu: '서울 강남구', status: '활성', brand: 'blue',   greeting: '강남 최다 개통, 해피넷이 다 해드려요!', cats: ['phone', 'internet', 'water', 'rental'], openedAt: dayAgo(142), monthlySales: 12400000, phone: '010-2311-4821' },
    { id: 'T2', slug: 'onlife',   name: '온라이프몰',   owner: '김서연', unit: 'SD1', sigungu: '서울 노원구', status: '활성', brand: 'coral',  greeting: '생활서비스, 온라이프에서 한 번에!', cats: ['internet', 'water', 'rental', 'move'], openedAt: dayAgo(96),  monthlySales: 10000000, phone: '010-8842-1030' },
    { id: 'T3', slug: 'smartin',  name: '스마트인 인천', owner: '이도현', unit: 'SD3', sigungu: '인천 부평구', status: '활성', brand: 'teal',   greeting: '인천·부천 전 지역 당일 상담!', cats: ['phone', 'internet', 'appliance'], openedAt: dayAgo(70),  monthlySales: 8200000,  phone: '010-5567-2214' },
    { id: 'T4', slug: 'busanjeil', name: '부산제일통신', owner: '최민준', unit: 'GN',  sigungu: '부산 해운대구', status: '활성', brand: 'navy', greeting: '부산·경남 1등 생활서비스 파트너', cats: ['phone', 'internet', 'move', 'insurance'], openedAt: dayAgo(55), monthlySales: 6900000, phone: '010-9210-7745' },
    { id: 'T5', slug: 'daejeonon', name: '대전온', owner: '정수빈', unit: 'CC2', sigungu: '대전 서구', status: '활성', brand: 'green', greeting: '충청권 생활비 절감 전문가', cats: ['internet', 'water', 'rental'], openedAt: dayAgo(33), monthlySales: 4100000, phone: '010-3345-8890' },
    { id: 'T6', slug: 'jejuhome',  name: '제주홈케어', owner: '강지은', unit: 'JJ', sigungu: '제주 제주시', status: '정지', brand: 'purple', greeting: '제주 전 지역 홈서비스', cats: ['water', 'rental', 'etc'], openedAt: dayAgo(120), monthlySales: 0, phone: '010-7788-1123' },
  ]

  const applications = [
    { id: 'AP1', name: '윤태호', phone: '010-4521-8874', type: '개인', sigungu: '경기 수원시', wantSlug: 'suwonking', wantName: '수원킹 통신', status: '대기', appliedAt: minAgo(190), memo: '통신 대리점 5년 경력' },
    { id: 'AP2', name: '한소희', phone: '010-2214-9931', type: '사업자', sigungu: '경기 고양시', wantSlug: 'goyanglife', wantName: '고양라이프', status: '대기', appliedAt: minAgo(340), memo: '렌탈 영업 경력, 사업자등록 보유' },
    { id: 'AP3', name: '오세훈', phone: '010-8873-2210', type: '개인', sigungu: '전북 전주시', wantSlug: 'jeonjubest', wantName: '전주베스트', status: '대기', appliedAt: dayAgo(1), memo: '' },
    { id: 'AP4', name: '임가영', phone: '010-5643-7789', type: '개인', sigungu: '서울 마포구', wantSlug: 'mapomall', wantName: '마포몰', status: '승인', appliedAt: dayAgo(4), memo: '' },
  ]

  // 리드: 상태·소스·시간 분산 (T1 중심으로 오피스 데모가 풍성하게)
  const leads = [
    { id: 'L1',  name: '김민수', phone: '010-3421-5567', sigungu: '서울 강남구', cat: 'internet', wish: '지금 바로', status: '접수',     tenantId: 'T1', source: 'happynet', createdAt: minAgo(4),  read: false, memo: '', history: [{ at: minAgo(4), to: '접수', by: 'system', note: '파트너몰 유입' }] },
    { id: 'L2',  name: '이하늘', phone: '010-2214-8890', sigungu: '서울 강남구', cat: 'water',    wish: '오후(12~18시)', status: '접수', tenantId: 'T1', source: 'main', createdAt: minAgo(12), read: false, memo: '', history: [{ at: minAgo(12), to: '접수', by: 'system', note: '권역 배정(SD2)' }] },
    { id: 'L3',  name: '박준혁', phone: '010-9987-1123', sigungu: '서울 송파구', cat: 'phone',    wish: '지금 바로', status: '상담대기', tenantId: 'T1', source: 'main', createdAt: minAgo(47), read: true, memo: '갤럭시 최신기종 희망, 가족결합 문의', history: [{ at: minAgo(47), to: '접수', by: 'system' }, { at: minAgo(31), to: '상담대기', by: 'T1' }] },
    { id: 'L4',  name: '최유진', phone: '010-4432-7789', sigungu: '경기 성남시', cat: 'move',     wish: '저녁(18~21시)', status: '상담완료', tenantId: 'T1', source: 'happynet', createdAt: minAgo(125), read: true, memo: '3월 말 입주, 포장이사 견적 발송', history: [{ at: minAgo(125), to: '접수', by: 'system' }, { at: minAgo(100), to: '상담대기', by: 'T1' }, { at: minAgo(64), to: '상담완료', by: 'T1' }] },
    { id: 'L5',  name: '정다은', phone: '010-6673-2214', sigungu: '서울 강남구', cat: 'internet', wish: '오전(9~12시)', status: '개통대기', tenantId: 'T1', source: 'happynet', createdAt: dayAgo(1), read: true, memo: '500M+정수기 결합 확정, 수요일 설치', history: [{ at: dayAgo(1), to: '접수', by: 'system' }, { at: dayAgo(1) + 600000, to: '상담대기', by: 'T1' }, { at: dayAgo(1) + 3600000, to: '상담완료', by: 'T1' }, { at: minAgo(300), to: '개통대기', by: 'T1' }] },
    { id: 'L6',  name: '강현우', phone: '010-1123-9987', sigungu: '서울 관악구', cat: 'internet', wish: '지금 바로', status: '완료', tenantId: 'T1', source: 'main', createdAt: dayAgo(3), read: true, memo: '1G 단독, 사은품 40만 지급 완료', history: [{ at: dayAgo(3), to: '접수', by: 'system' }, { at: dayAgo(3) + 900000, to: '상담대기', by: 'T1' }, { at: dayAgo(2), to: '상담완료', by: 'T1' }, { at: dayAgo(1), to: '완료', by: 'T1' }] },
    { id: 'L7',  name: '윤서아', phone: '010-8842-4432', sigungu: '경기 용인시', cat: 'rental',   wish: '오후(12~18시)', status: '취소', tenantId: 'T1', source: 'main', createdAt: dayAgo(2), read: true, memo: '', cancelReason: '타사 기존 약정 잔여 8개월', history: [{ at: dayAgo(2), to: '접수', by: 'system' }, { at: dayAgo(2) + 1200000, to: '상담대기', by: 'T1' }, { at: dayAgo(1), to: '취소', by: 'T1', note: '타사 기존 약정 잔여 8개월' }] },
    { id: 'L8',  name: '조은비', phone: '010-5567-6673', sigungu: '서울 노원구', cat: 'water',    wish: '오전(9~12시)', status: '상담대기', tenantId: 'T2', source: 'onlife', createdAt: minAgo(75), read: true, memo: '', history: [{ at: minAgo(75), to: '접수', by: 'system' }, { at: minAgo(60), to: '상담대기', by: 'T2' }] },
    { id: 'L9',  name: '한지민', phone: '010-3345-1123', sigungu: '경기 고양시', cat: 'internet', wish: '지금 바로', status: '접수', tenantId: 'T2', source: 'main', createdAt: minAgo(18), read: false, memo: '', history: [{ at: minAgo(18), to: '접수', by: 'system', note: '권역 배정(SD1)' }] },
    { id: 'L10', name: '서준호', phone: '010-7788-9987', sigungu: '인천 부평구', cat: 'phone',    wish: '저녁(18~21시)', status: '상담완료', tenantId: 'T3', source: 'smartin', createdAt: dayAgo(1), read: true, memo: '', history: [{ at: dayAgo(1), to: '접수', by: 'system' }, { at: dayAgo(1) + 1800000, to: '상담완료', by: 'T3' }] },
    { id: 'L11', name: '문채원', phone: '010-2214-5567', sigungu: '부산 해운대구', cat: 'move',   wish: '오전(9~12시)', status: '접수', tenantId: 'T4', source: 'main', createdAt: minAgo(28), read: false, memo: '', history: [{ at: minAgo(28), to: '접수', by: 'system', note: '권역 배정(GN)' }] },
    { id: 'L12', name: '배성민', phone: '010-9931-3345', sigungu: '대전 서구', cat: 'water',      wish: '오후(12~18시)', status: '개통대기', tenantId: 'T5', source: 'daejeonon', createdAt: dayAgo(2), read: true, memo: '', history: [{ at: dayAgo(2), to: '접수', by: 'system' }, { at: dayAgo(1), to: '개통대기', by: 'T5' }] },
    { id: 'L13', name: '노유나', phone: '010-4432-2214', sigungu: '강원 춘천시', cat: 'internet', wish: '지금 바로', status: '접수', tenantId: null, source: 'main', createdAt: minAgo(9), read: false, memo: '', via: '관리단 폴백(GW)', history: [{ at: minAgo(9), to: '접수', by: 'system', note: '관리단 폴백(GW) — 권역 파트너 공석' }] },
    { id: 'L14', name: '홍석천', phone: '010-6673-8842', sigungu: '서울 강남구', cat: 'appliance', wish: '오후(12~18시)', status: '완료', tenantId: 'T1', source: 'happynet', createdAt: dayAgo(6), read: true, memo: 'TV 75인치 제휴가 구매', history: [{ at: dayAgo(6), to: '접수', by: 'system' }, { at: dayAgo(5), to: '완료', by: 'T1' }] },
    { id: 'L15', name: '임수정', phone: '010-1123-4432', sigungu: '서울 강남구', cat: 'insurance', wish: '오전(9~12시)', status: '상담대기', tenantId: 'T1', source: 'main', createdAt: minAgo(140), read: true, memo: '실손 전환 검토', history: [{ at: minAgo(140), to: '접수', by: 'system' }, { at: minAgo(120), to: '상담대기', by: 'T1' }] },
  ]

  // 계약(만기 D-day 관리용) — T1 중심
  // penalty = 잔여 약정 위약금(지원금 반환금) 추정 — 가망고객 우선순위 판단용(주다 벤치마크)
  const contracts = [
    { id: 'C1', tenantId: 'T1', customer: '강현우', phone: '010-1123-9987', product: '인터넷 1G + TV', amount: 990000, commission: 99000, expiry: dayAfter(14), startedAt: dayAgo(3), penalty: 48000 },
    { id: 'C2', tenantId: 'T1', customer: '홍석천', phone: '010-6673-8842', product: '가전 제휴 구매', amount: 1890000, commission: 132000, expiry: dayAfter(30), startedAt: dayAgo(6), penalty: 0 },
    { id: 'C3', tenantId: 'T1', customer: '민경훈', phone: '010-5544-2211', product: '정수기 렌탈 36개월', amount: 1188000, commission: 118000, expiry: dayAfter(45), startedAt: dayAgo(300), penalty: 132000 },
    { id: 'C4', tenantId: 'T1', customer: '유아름', phone: '010-9988-7766', product: '휴대폰 + 카드결합', amount: 1450000, commission: 145000, expiry: dayAfter(92), startedAt: dayAgo(500), penalty: 214000 },
    { id: 'C5', tenantId: 'T2', customer: '박세리', phone: '010-3311-2299', product: '인터넷 500M', amount: 660000, commission: 66000, expiry: dayAfter(21), startedAt: dayAgo(200), penalty: 39000 },
  ]

  // 상품 카탈로그 — 본사 중앙 관리(A-03). support=지원금, commission=성사 수수료
  const products = [
    { id: 'P1',  cat: 'internet',  name: '인터넷 500M + TV 베이직', brand: 'KT',        monthly: 32900,  support: 350000, commission: 99000,  tag: '가장 인기' },
    { id: 'P2',  cat: 'internet',  name: '인터넷 1G 단독',          brand: 'SK브로드밴드', monthly: 41800, support: 400000, commission: 110000, tag: '속도 최강' },
    { id: 'P3',  cat: 'internet',  name: '인터넷 100M 단독',        brand: 'LG U+',     monthly: 28600,  support: 200000, commission: 70000,  tag: '1인 가구' },
    { id: 'P4',  cat: 'phone',     name: '갤럭시 최신형 + 5G 요금제', brand: 'KT',       monthly: 89000,  support: 450000, commission: 145000, tag: '지원금 최대' },
    { id: 'P5',  cat: 'phone',     name: '아이폰 + 카드결합 세트',   brand: 'SK',        monthly: 95000,  support: 380000, commission: 130000, tag: '카드 이중할인' },
    { id: 'P6',  cat: 'move',      name: '포장이사 (20평대)',        brand: '제휴 1급',   monthly: 0,      support: 400000, commission: 120000, tag: '무료 방문견적' },
    { id: 'P7',  cat: 'move',      name: '원룸 이사 패키지',         brand: '제휴 1급',   monthly: 0,      support: 150000, commission: 60000,  tag: '당일 예약' },
    { id: 'P8',  cat: 'water',     name: '냉온정 직수 정수기',       brand: '제휴 렌탈',  monthly: 25900,  support: 300000, commission: 118000, tag: '설치비 무료' },
    { id: 'P9',  cat: 'water',     name: '언더싱크 정수기',          brand: '제휴 렌탈',  monthly: 15900,  support: 200000, commission: 80000,  tag: '반값 렌탈' },
    { id: 'P10', cat: 'rental',    name: '안마의자 프리미엄',        brand: '제휴 렌탈',  monthly: 59900,  support: 300000, commission: 150000, tag: '3년 약정' },
    { id: 'P11', cat: 'rental',    name: '매트리스 케어 렌탈',       brand: '제휴 렌탈',  monthly: 33900,  support: 150000, commission: 90000,  tag: '케어 포함' },
    { id: 'P12', cat: 'insurance', name: '보험 리모델링 진단',       brand: 'GA 제휴',    monthly: 0,      support: 0,      commission: 60000,  tag: '무료 진단' },
    { id: 'P13', cat: 'appliance', name: 'TV 75인치 제휴가',        brand: '제휴 양판',  monthly: 0,      support: 250000, commission: 132000, tag: '설치 포함' },
    { id: 'P14', cat: 'appliance', name: '세탁기+건조기 세트',       brand: '제휴 양판',  monthly: 0,      support: 300000, commission: 140000, tag: '세트 특가' },
    { id: 'P15', cat: 'etc',       name: '입주 청소 (30평 기준)',    brand: '제휴 업체',  monthly: 0,      support: 50000,  commission: 45000,  tag: '이사 결합 할인' },
    { id: 'P16', cat: 'etc',       name: '중고폰 매입',             brand: '모두온 다이렉트', monthly: 0,  support: 0,      commission: 30000,  tag: '최고가 매입' },
  ]

  return {
    seedVersion: SEED_VERSION,
    products,
    policies: {
      joinFee: 2000000,        // 대리점 분양몰 가입비(초기 세팅비) — 사업기획서 v4 축③(30개=초기 6,000만)
      monthlyFee: 300000,      // 월 이용료 (30개=월 900만)
      feeRate: 0.1,            // 운영 수수료율(몰 매출 기준)
      version: 4,
      appliedAt: dayAgo(7),
      history: [
        { version: 1, joinFee: 1500000, monthlyFee: 150000, feeRate: 0.12, appliedAt: dayAgo(180), by: '본사 관리자', note: '론칭 정책' },
        { version: 2, joinFee: 1200000, monthlyFee: 120000, feeRate: 0.1, appliedAt: dayAgo(90), by: '본사 관리자', note: '오픈 프로모션 1차 조정' },
        { version: 3, joinFee: 1000000, monthlyFee: 100000, feeRate: 0.1, appliedAt: dayAgo(30), by: '본사 관리자', note: '표준 분양 정책' },
        { version: 4, joinFee: 2000000, monthlyFee: 300000, feeRate: 0.1, appliedAt: dayAgo(7), by: '본사 관리자', note: '사업기획서 v4 반영 — 대리점 가입비 200만·월 30만' },
      ],
    },
    tenants,
    applications,
    leads,
    contracts,
    notices: [
      { id: 'N1', title: '3월 정산이 확정되었습니다. 마이오피스 > 정산에서 명세를 확인하세요.', target: 'office', at: dayAgo(1) },
      { id: 'N2', title: '이사 카테고리 봄 프로모션: 성사 수수료 +10% (4/30까지)', target: 'office', at: dayAgo(2) },
      { id: 'N3', title: '신규 파트너 교육 웨비나 — 매주 수요일 오후 2시', target: 'office', at: dayAgo(5) },
    ],
    resources: [
      { id: 'R1', name: '인터넷/TV 상담 스크립트 v3.2', type: 'PDF', size: '1.2MB', at: dayAgo(3), downloads: 214 },
      { id: 'R2', name: '정수기 브랜드 비교표 (2026.08)', type: 'XLSX', size: '380KB', at: dayAgo(5), downloads: 187 },
      { id: 'R3', name: '모두온 SNS 홍보 배너 팩', type: 'ZIP', size: '18MB', at: dayAgo(9), downloads: 156 },
      { id: 'R4', name: '개인정보 처리 교육 자료 (필수)', type: 'PDF', size: '2.4MB', at: dayAgo(14), downloads: 302 },
      { id: 'R5', name: '휴대폰 지원금 정책표 8월 2주차', type: 'PDF', size: '540KB', at: dayAgo(2), downloads: 268 },
    ],
    aiEvents: [],
    auditLog: [
      { id: 'G1', at: minAgo(35), actor: '본사 관리자', action: '분양 승인', target: '마포몰(mapomall)', detail: '신청 AP4 승인 → 테넌트 생성' },
      { id: 'G2', at: dayAgo(1), actor: '본사 관리자', action: '정산 실행', target: '2026-07 정산', detail: '파트너 5곳 · 총 지급 38,420,000원' },
      { id: 'G3', at: dayAgo(2), actor: 'AI 엔진', action: '리드 재배정', target: 'L-0812', detail: 'SLA 60분 초과 → 관리단 에스컬레이션' },
      { id: 'G4', at: dayAgo(30), actor: '본사 관리자', action: '정책 변경', target: '분양 정책 v3', detail: '분양비 100만 / 월 이용료 10만 / 수수료 10%' },
    ],
    chatLog: [],
    demoFeed: true,
    lastSpawn: 0,
  }
}
