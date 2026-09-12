// ─── 데모 시드 데이터 (localStorage 초기화용) ────────────────────
// 모든 타임스탬프는 로드 시점 기준 상대값으로 생성 → 데모가 항상 "살아있는" 상태

const now = () => Date.now()
const minAgo = (m) => now() - m * 60000
const dayAgo = (d) => now() - d * 86400000
const dayAfter = (d) => now() + d * 86400000
import { BENEFIT_TOTAL, REVIEWS } from './constants'

export const SEED_VERSION = 13 // 13: 히어로 배너 4장을 브랜드 톤 21:9 장면(GPT Image 2)으로 통일

export function buildSeed() {
  const tenants = [
    { id: 'T1', slug: 'happynet', name: '해피넷 통신', owner: '박정우', unit: 'SD2', sigungu: '서울 강남구', status: '활성', brand: 'blue',   greeting: '강남 최다 개통, 해피넷이 다 해드려요!', cats: ['phone', 'internet', 'water', 'rental'], openedAt: dayAgo(142), monthlySales: 12400000, leadCount: 0, phone: '010-2311-4821' },
    { id: 'T2', slug: 'onlife',   name: '온라이프몰',   owner: '김서연', unit: 'SD1', sigungu: '서울 노원구', status: '활성', brand: 'coral',  greeting: '생활서비스, 온라이프에서 한 번에!', cats: ['internet', 'water', 'rental', 'move'], openedAt: dayAgo(96),  monthlySales: 10000000, leadCount: 0, phone: '010-8842-1030' },
    { id: 'T3', slug: 'smartin',  name: '스마트인 인천', owner: '이도현', unit: 'SD3', sigungu: '인천 부평구', status: '활성', brand: 'teal',   greeting: '인천·부천 전 지역 당일 상담!', cats: ['phone', 'internet', 'appliance'], openedAt: dayAgo(70),  monthlySales: 8200000,  leadCount: 0, phone: '010-5567-2214' },
    { id: 'T4', slug: 'busanjeil', name: '부산제일통신', owner: '최민준', unit: 'GN',  sigungu: '부산 해운대구', status: '활성', brand: 'navy', greeting: '부산·경남 1등 생활서비스 파트너', cats: ['phone', 'internet', 'move', 'insurance'], openedAt: dayAgo(55), monthlySales: 6900000, leadCount: 0, phone: '010-9210-7745' },
    { id: 'T5', slug: 'daejeonon', name: '대전온', owner: '정수빈', unit: 'CC2', sigungu: '대전 서구', status: '활성', brand: 'green', greeting: '충청권 생활비 절감 전문가', cats: ['internet', 'water', 'rental'], openedAt: dayAgo(33), monthlySales: 4100000, leadCount: 0, phone: '010-3345-8890' },
    { id: 'T6', slug: 'jejuhome',  name: '제주홈케어', owner: '강지은', unit: 'JJ', sigungu: '제주 제주시', status: '정지', brand: 'purple', greeting: '제주 전 지역 홈서비스', cats: ['water', 'rental', 'etc'], openedAt: dayAgo(120), monthlySales: 0, leadCount: 0, phone: '010-7788-1123' },
  ]

  // 총판(영업단 사업권) 계약 현황 — 오픈맵·경영전략 화면의 실데이터 소스
  // fee = 사업권 분양가(engine.SAUP_TIERS 기준), sharePct = 권역 매출 배분율
  const distributors = [
    { id: 'D1', unit: 'SD2', name: '수도2단 총판', owner: '김태성', fee: 15000000, sharePct: 0.03, openedAt: dayAgo(120), phone: '010-5551-2001' },
    { id: 'D2', unit: 'CC2', name: '충청2단 총판', owner: '박미란', fee: 15000000, sharePct: 0.03, openedAt: dayAgo(85), phone: '010-5551-2002' },
    { id: 'D3', unit: 'GN', name: '경남단 총판', owner: '조성필', fee: 50000000, sharePct: 0.03, openedAt: dayAgo(60), phone: '010-5551-2003', note: '지방 8개 단 일괄 보유자' },
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
    { id: 'L6',  name: '강현우', phone: '010-1123-9987', sigungu: '서울 관악구', cat: 'internet', wish: '지금 바로', status: '완료', tenantId: 'T1', source: 'main', createdAt: dayAgo(3), completedAt: dayAgo(1), read: true, memo: '1G 단독, 사은품 40만 지급 완료', history: [{ at: dayAgo(3), to: '접수', by: 'system' }, { at: dayAgo(3) + 900000, to: '상담대기', by: 'T1' }, { at: dayAgo(2), to: '상담완료', by: 'T1' }, { at: dayAgo(1), to: '완료', by: 'T1' }] },
    { id: 'L7',  name: '윤서아', phone: '010-8842-4432', sigungu: '경기 용인시', cat: 'rental',   wish: '오후(12~18시)', status: '취소', tenantId: 'T1', source: 'main', createdAt: dayAgo(2), read: true, memo: '', cancelReason: '타사 기존 약정 잔여 8개월', history: [{ at: dayAgo(2), to: '접수', by: 'system' }, { at: dayAgo(2) + 1200000, to: '상담대기', by: 'T1' }, { at: dayAgo(1), to: '취소', by: 'T1', note: '타사 기존 약정 잔여 8개월' }] },
    { id: 'L8',  name: '조은비', phone: '010-5567-6673', sigungu: '서울 노원구', cat: 'water',    wish: '오전(9~12시)', status: '상담대기', tenantId: 'T2', source: 'onlife', createdAt: minAgo(75), read: true, memo: '', history: [{ at: minAgo(75), to: '접수', by: 'system' }, { at: minAgo(60), to: '상담대기', by: 'T2' }] },
    { id: 'L9',  name: '한지민', phone: '010-3345-1123', sigungu: '경기 고양시', cat: 'internet', wish: '지금 바로', status: '접수', tenantId: 'T2', source: 'main', createdAt: minAgo(18), read: false, memo: '', history: [{ at: minAgo(18), to: '접수', by: 'system', note: '권역 배정(SD1)' }] },
    { id: 'L10', name: '서준호', phone: '010-7788-9987', sigungu: '인천 부평구', cat: 'phone',    wish: '저녁(18~21시)', status: '상담완료', tenantId: 'T3', source: 'smartin', createdAt: dayAgo(1), read: true, memo: '', history: [{ at: dayAgo(1), to: '접수', by: 'system' }, { at: dayAgo(1) + 1800000, to: '상담완료', by: 'T3' }] },
    { id: 'L11', name: '문채원', phone: '010-2214-5567', sigungu: '부산 해운대구', cat: 'move',   wish: '오전(9~12시)', status: '접수', tenantId: 'T4', source: 'main', createdAt: minAgo(28), read: false, memo: '', history: [{ at: minAgo(28), to: '접수', by: 'system', note: '권역 배정(GN)' }] },
    { id: 'L12', name: '배성민', phone: '010-9931-3345', sigungu: '대전 서구', cat: 'water',      wish: '오후(12~18시)', status: '개통대기', tenantId: 'T5', source: 'daejeonon', createdAt: dayAgo(2), read: true, memo: '', history: [{ at: dayAgo(2), to: '접수', by: 'system' }, { at: dayAgo(1), to: '개통대기', by: 'T5' }] },
    { id: 'L13', name: '노유나', phone: '010-4432-2214', sigungu: '강원 춘천시', cat: 'internet', wish: '지금 바로', status: '접수', tenantId: null, source: 'main', createdAt: minAgo(9), read: false, memo: '', via: '관리단 폴백(GW)', history: [{ at: minAgo(9), to: '접수', by: 'system', note: '관리단 폴백(GW) — 권역 파트너 공석' }] },
    { id: 'L14', name: '홍석천', phone: '010-6673-8842', sigungu: '서울 강남구', cat: 'appliance', wish: '오후(12~18시)', status: '완료', tenantId: 'T1', source: 'happynet', createdAt: dayAgo(6), completedAt: dayAgo(5), read: true, memo: 'TV 75인치 제휴가 구매', history: [{ at: dayAgo(6), to: '접수', by: 'system' }, { at: dayAgo(5), to: '완료', by: 'T1' }] },
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

  // ── 아정당식 초기화면 — 롤링 배너 (order 순 · active 만 노출) ──
  // kind 'mobi' 는 파란 그라디언트 위에 인물 컷아웃 + DOM 텍스트, 'scene' 은 21:9 장면 이미지 위에 텍스트.
  // 이미지는 fetch-assets.mjs 가 내려받는 자체 호스팅 경로. 문구·순서·노출은 어드민 배너 관리에서 바꾼다.
  const banners = [
    // 히어로 4장 — 목업 덱 랜딩페이지 1~4 를 브랜드 톤(콘플라워 블루·크림·코랄, 소프트 3D)의 21:9 장면으로 통일.
    // 장면의 한쪽 55~60% 는 비어 있고 텍스트는 DOM(어드민에서 수정) — 파랑(흰 글씨) → 크림(잉크) → 연파랑(잉크) → 파랑(흰 글씨) 리듬.
    // bg 는 장면과 같은 그라디언트라 이미지를 못 받아와도 톤이 유지된다.
    { id: 'B1', kind: 'scene', tone: 'light', order: 0, active: true, eyebrow: '모두온 플랫폼의 AI비서 모비를 소개합니다', title: '“상담원 기다리지 말고,\n모비에게 바로 물어보세요.”', desc: '인터넷·휴대폰·정수기… 흩어진 생활 구독서비스를 한곳에서 비교하고\n남들은 몰라서 못 받은 지원금까지 왕창 돌려받으세요.', note: '24시간 언제든, 모비와 상담하세요.', image: '/assets/banner-mobi.png', bg: 'linear-gradient(90deg,#5377D6 0%,#7D9BE8 100%)', cta: { label: '모비와 상담하기', action: 'chat' } },
    { id: 'B2', kind: 'scene', tone: 'dark', order: 1, active: true, eyebrow: '모두온 혜택', title: '“보고, 초대하고,\n쌓고, 쓰세요.”', desc: '- on포인트 : 보고, 초대하고, 적립하고\n- 복지몰 : 적립한 포인트로 쇼핑하고', image: '/assets/banner-benefit.png', bg: 'linear-gradient(90deg,#F7F2EE 0%,#EDF1FB 100%)', cta: { label: '혜택 보러가기', to: '/benefits' } },
    { id: 'B3', kind: 'scene', side: 'left', tone: 'dark', order: 2, active: true, eyebrow: '구독경제 전성시대 · 100조원 시장 개막!', title: '합리적인 구독서비스 소비는\n“모두온”과 함께', desc: '구독경제는 매달 일정한 금액을 내고 필요한 물건이나\n서비스를 주기적으로 받는 경제 활동입니다.', image: '/assets/banner-subscribe.png', bg: 'linear-gradient(90deg,#EDF1FB 0%,#D6E0FA 100%)', cta: { label: '모비에게 물어보기', action: 'chat' } },
    { id: 'B4', kind: 'scene', side: 'left', tone: 'light', order: 3, active: true, eyebrow: '비교는 간편하고 편리하게, 혜택은 통 크게 씁니다.', title: '몰라서 놓친 혜택\n찾아 주는 서비스', image: '/assets/banner-finder.png', bg: 'linear-gradient(90deg,#4467C8 0%,#5377D6 100%)', cta: { label: '내 혜택 찾기', to: '/diagnosis' } },
    // 예비 — 장면형 3종(어드민에서 켜면 롤링에 합류)
    { id: 'B5', kind: 'scene', order: 4, active: false, eyebrow: '남들 받는 그 이상, 모두온이 돌려드려요', title: `몰라서 못 받은 지원금,\n최대 ${BENEFIT_TOTAL}만원+ 왕창 돌려드려요`, desc: '유통 단계를 줄인 직접 판매 구조 — 조건이 맞으면\n다른 곳에선 처음 보는 혜택까지 그대로 돌려드립니다.', image: '/assets/banner-support.png', bg: 'linear-gradient(135deg,#2F6BFF 0%,#4F8BFF 100%)', cta: { label: '내 지원금 확인하기', to: '/consult' } },
    { id: 'B6', kind: 'scene', order: 5, active: false, eyebrow: '렌트/리스 신규 오픈', title: '국내 모든 리스·렌트사 견적 비교,\n캐피탈사보다 3~5% 더 저렴하게', desc: '취등록세·보험료까지 넣은 진짜 월 납입금으로 안내해요.\n국산 6개 · 수입 16개 제조사, 58차종.', image: '/assets/banner-car.png', bg: 'linear-gradient(135deg,#2F6BFF 0%,#4F8BFF 100%)', cta: { label: '차종 보러가기', to: '/cars' } },
    { id: 'B7', kind: 'scene', order: 6, active: false, eyebrow: '가전렌탈 · 인터넷', title: '정수기·공기청정기·인터넷,\n한 번에 비교하고 한 번에 설치', desc: '9개 렌탈 브랜드와 통신 3사를 한 화면에서 골라요.', image: '/assets/banner-home.png', bg: 'linear-gradient(135deg,#2F6BFF 0%,#4F8BFF 100%)', cta: { label: '브랜드로 찾기', to: '/category/rental' } },
  ]

  // ── 게시판 6종 — posts 한 컬렉션, board 로 구분 ──
  // 후기는 constants.REVIEWS 에서 파생(소셜프루프 컴포넌트와 같은 원천). phone 은 마스킹 대상(pii).
  const posts = [
    ...REVIEWS.map((r, i) => ({ id: `PR${i + 1}`, board: 'review', title: `${r.cat} — ${r.tag}`, body: r.text, author: r.name, region: r.region, cat: r.cat, rating: r.rating, tags: [r.tag], createdAt: dayAgo(r.days), views: 120 + i * 37, pinned: i === 0, status: '공개' })),
    { id: 'PQ1', board: 'qna', title: '현금 사은품은 언제 입금되나요?', body: '지난주에 인터넷 설치했는데 사은품이 아직 안 들어왔어요. 보통 얼마나 걸리나요?', author: '박선영', phone: '010-2233-4455', createdAt: dayAgo(1), views: 88, status: '답변완료', answer: { body: '설치·개통 확인 후 영업일 7일 이내에 신청인 명의 계좌로 입금돼요. 지급 명단에서 일자별로 확인하실 수 있고, 7일이 지났다면 대표번호로 연락 주시면 바로 확인해 드릴게요.', at: dayAgo(1) + 3600000 * 2, by: '본사 담당자' }, tags: ['사은품'], pinned: false },
    { id: 'PQ2', board: 'qna', title: '기존 통신사 위약금이 남았는데 옮길 수 있나요?', body: 'SK 약정이 8개월 남았는데 KT로 바꾸면 위약금 때문에 손해일까요?', author: '김재현', phone: '010-9988-1122', createdAt: dayAgo(2), views: 143, status: '답변완료', answer: { body: '잔여 위약금과 지원금을 상계해 실부담을 계산해 드려요. 8개월 잔여면 대부분 지원금으로 위약금을 덮고도 남는 구성이 가능합니다. 상담에서 정확한 금액을 확인해 드릴게요.', at: dayAgo(2) + 3600000 * 5, by: '본사 담당자' }, tags: ['위약금'], pinned: true },
    { id: 'PQ3', board: 'qna', title: '알뜰폰도 여기서 개통되나요?', body: '알뜰폰 요금제로 바꾸고 싶은데 어디서 신청하나요?', author: '이수민', phone: '010-3311-2244', createdAt: dayAgo(3), views: 61, status: '답변완료', answer: { body: '휴대폰 > 알뜰폰 요금제에서 대표 요금제와 브랜드별 혜택을 보시고 바로 셀프가입하실 수 있어요. 유심 보유 여부에 따라 가입 경로가 달라지니 화면 안내를 따라 주세요.', at: dayAgo(3) + 3600000, by: '본사 담당자' }, tags: ['알뜰폰'], pinned: false },
    { id: 'PQ4', board: 'qna', title: '렌트/리스 견적은 실제 금액인가요?', body: '카드에 나오는 월 리스료가 실제 계약 금액인지 궁금해요.', author: '정우성', phone: '010-5566-7788', createdAt: minAgo(190), views: 34, status: '접수', tags: ['렌트/리스'], pinned: false },
    { id: 'PQ5', board: 'qna', title: '정수기 렌탈 의무약정이 몇 년인가요?', body: '브랜드마다 다른 것 같은데 정리된 표가 있을까요?', author: '한지원', phone: '010-1122-3344', createdAt: minAgo(45), views: 12, status: '접수', tags: ['정수기'], pinned: false },
    { id: 'PT1', board: 'tip', title: '인터넷 약정 만기 3개월 전에 꼭 할 일', body: '만기 3개월 전부터 재약정 지원금이 열립니다. 이 시기를 놓치면 자동 연장돼 지원금 없이 같은 요금을 내요. 만기일을 캘린더에 적어두고, 만기 90일 전에 상담을 받으세요.', author: '모두온 에디터', createdAt: dayAgo(2), views: 412, tags: ['인터넷', '약정'], pinned: true, status: '공개' },
    { id: 'PT2', board: 'tip', title: '휴대폰 선택약정 25% vs 공시지원금, 뭐가 유리할까', body: '요금제가 월 7만원 이상이면 대부분 선택약정이 유리하고, 5만원대 이하면 공시지원금이 유리한 경우가 많아요. 견적 계산기에서 두 경우를 나란히 비교해 보세요.', author: '모두온 에디터', createdAt: dayAgo(4), views: 388, tags: ['휴대폰'], pinned: false, status: '공개' },
    { id: 'PT3', board: 'tip', title: '정수기 렌탈료 아끼는 방법 3가지', body: '① 방문형 대신 셀프형 ② 60개월 약정 ③ 카드 자동이체 할인. 세 가지를 다 적용하면 같은 모델도 월 1만원 이상 차이가 납니다.', author: '모두온 에디터', createdAt: dayAgo(6), views: 276, tags: ['정수기', '렌탈'], pinned: false, status: '공개' },
    { id: 'PT4', board: 'tip', title: '장기렌트 초기부담금, 무조건 많이 내는 게 좋을까', body: '초기부담금이 커지면 어느 구간부터는 월 납입금이 더 내려가지 않아요. 상세 견적기에서 상한 안내가 뜨는 지점이 그 경계입니다.', author: '모두온 에디터', createdAt: dayAgo(8), views: 154, tags: ['렌트/리스'], pinned: false, status: '공개' },
    { id: 'PT5', board: 'tip', title: '이사할 때 인터넷 이전 vs 신규 가입', body: '이전 설치비가 3만원 안팎인데, 신규 가입 지원금은 수십만원이에요. 잔여 약정이 짧다면 신규가 유리한 경우가 훨씬 많습니다.', author: '모두온 에디터', createdAt: dayAgo(11), views: 201, tags: ['인터넷', '이사'], pinned: false, status: '공개' },
    { id: 'PE1', board: 'event', title: '9월 가입 이벤트 — 인터넷+TV 신규 가입 시 사은품 +5만원', body: '9월 30일까지 인터넷+TV 결합 신규 가입 고객 전원에게 기본 사은품에 5만원을 더 드려요. 설치 완료 기준이며, 지급 명단에서 확인하실 수 있어요.', author: '모두온', period: { from: dayAgo(8), to: dayAfter(21) }, createdAt: dayAgo(8), views: 1240, tags: ['인터넷'], pinned: true, status: '진행중' },
    { id: 'PE2', board: 'event', title: '친구 초대하면 둘 다 포인트 — 초대 이벤트', body: '내 초대 링크로 친구가 가입하면 나에게 1만 포인트, 친구에게 5천 포인트. 모두온혜택 > 친구초대하기에서 링크를 복사하세요.', author: '모두온', period: { from: dayAgo(20), to: dayAfter(40) }, createdAt: dayAgo(20), views: 860, tags: ['혜택'], pinned: false, status: '진행중' },
    { id: 'PE3', board: 'event', title: '[종료] 8월 렌탈 브랜드 위크 — 정수기 첫 달 무료', body: '8월 한 달간 진행한 렌탈 브랜드 위크가 종료되었습니다. 참여해 주신 분들께 감사드려요.', author: '모두온', period: { from: dayAgo(40), to: dayAgo(10) }, createdAt: dayAgo(40), views: 2210, tags: ['렌탈'], pinned: false, status: '종료' },
    { id: 'PN1', board: 'notice', title: '렌트/리스 카테고리를 열었습니다', body: '국산 6개·수입 16개 제조사, 58차종의 장기렌트·오토리스 견적을 비교하실 수 있어요. 제휴사 실요금이 확인된 차종은 카드 금액이 확정가입니다.', author: '모두온', createdAt: dayAgo(3), views: 530, tags: [], pinned: true, status: '공개' },
    { id: 'PN2', board: 'notice', title: '추석 연휴 상담 안내', body: '연휴 기간에도 모비 AI 상담은 24시간 열려 있어요. 전문 컨설턴트 전화 상담은 연휴 다음 영업일부터 순차 회신드립니다.', author: '모두온', createdAt: dayAgo(5), views: 410, tags: [], pinned: false, status: '공개' },
    { id: 'PN3', board: 'notice', title: '개인정보 처리방침 개정 안내 (9/1 시행)', body: '상담 배정을 위한 지역 정보 수집 범위를 시·군·구까지로 명확히 했습니다. 전문은 고객센터에서 확인하실 수 있어요.', author: '모두온', createdAt: dayAgo(9), views: 305, tags: [], pinned: false, status: '공개' },
    { id: 'PN4', board: 'notice', title: '사은품 지급 명단 공개를 시작합니다', body: '설치 확인 후 영업일 7일 내 입금 원칙을 지키고 있는지 누구나 확인하실 수 있도록, 일자별 지급 내역(마스킹)을 공개합니다.', author: '모두온', createdAt: dayAgo(15), views: 720, tags: [], pinned: false, status: '공개' },
    { id: 'PC1', board: 'complaint', title: '설치 기사님이 약속 시간에 안 오셨어요', body: '수요일 오후 2시 약속이었는데 연락 없이 4시에 오셨습니다. 미리 알려주시면 좋았을 것 같아요.', author: '오민석', phone: '010-7788-9900', createdAt: dayAgo(1), views: 0, status: '처리중', tags: ['설치'], pinned: false },
    { id: 'PC2', board: 'complaint', title: '상담 전화가 너무 늦게 왔어요', body: '10분 내 콜백이라고 했는데 40분 걸렸습니다.', author: '서예진', phone: '010-2211-3300', createdAt: dayAgo(3), views: 0, status: '완료', tags: ['상담'], pinned: false, answer: { body: '불편을 드려 죄송합니다. 해당 시간대 담당 파트너의 SLA 초과 건으로 확인돼 재교육 조치했고, 사은품에 소정의 포인트를 추가해 드렸습니다.', at: dayAgo(2), by: '본사 담당자' } },
    { id: 'PC3', board: 'complaint', title: '견적 금액과 실제 청구가 달라요', body: '계산기에서는 32,900원이었는데 첫 달 청구서가 35,200원이에요.', author: '류하늘', phone: '010-4455-6677', createdAt: minAgo(120), views: 0, status: '접수', tags: ['요금'], pinned: false },
  ]

  return {
    seedVersion: SEED_VERSION,
    banners,
    posts,
    // 혜택·플로팅 패널 설정 — 회원가입·친구초대·광고보기 포인트와 우측 패널 문구. 어드민 혜택 설정이 갱신.
    benefits: {
      signupPoints: 5000,          // 무료회원가입 혜택
      referralPoints: 10000,       // 친구초대 — 초대한 사람
      referralFriendPoints: 5000,  // 초대받은 사람
      adViewPoints: 100, adDailyLimit: 10, // 광고보기 1회 포인트 · 일 한도
      membershipMallOn: false,     // 멤버십몰(쇼핑몰) 오픈 여부 — false 면 "준비 중"
      floating: { title: 'MODUON 알아보기', hours: '모두온은\n365일 24시간\n영업전화 부담 없는\n모비와 무료상담', showSignup: true, showMobi: true, showConsultant: true, showFinder: true },
      version: 1, history: [],
    },
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
    distributors,
    applications,
    leads,
    contracts,
    settleConfirms: {}, // 지급 확정 영속 상태 — { [period|period:tenantId]: { at, detail } }
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
    demoFeed: true,
    lastSpawn: 0,
  }
}
