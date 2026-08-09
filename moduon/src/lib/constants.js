// ─── 모두온 공통 상수 ───────────────────────────────────────────
// 카테고리 순서 고정: 휴대폰 · 인터넷/TV · 이사 · 정수기 · 렌탈 · 보험 · 가전 · 생활/기타 (디자인 핸드오프 기준)

export const CATEGORIES = [
  { slug: 'phone',     name: '휴대폰',     icon: '/assets/cat-phone.webp',     benefit: '최대 45만원 혜택', desc: '통신 3사 요금제 비교와 기기 지원금, 카드 결합 혜택까지 한 번에 설계해 드려요.' },
  { slug: 'internet',  name: '인터넷/TV',  icon: '/assets/cat-internet.webp',  benefit: '최대 47만원 혜택', desc: '설치 가능한 통신사 확인부터 결합 할인 설계, 사은품까지 비교해 드려요.' },
  { slug: 'move',      name: '이사',       icon: '/assets/cat-move.webp',      benefit: '최대 40만원 혜택', desc: '포장이사·반포장·원룸이사 견적을 무료로 비교하고 입주 청소까지 연결해 드려요.' },
  { slug: 'water',     name: '정수기',     icon: '/assets/cat-water.webp',     benefit: '최대 30만원 혜택', desc: '브랜드별 렌탈료·의무약정·제휴 혜택을 비교해 우리 집에 맞는 정수기를 찾아 드려요.' },
  { slug: 'rental',    name: '렌탈',       icon: '/assets/cat-rental.webp',    benefit: '최대 30만원 혜택', desc: '안마의자·매트리스·비데·공기청정기 등 생활가전 렌탈을 최저 조건으로 비교해요.' },
  { slug: 'insurance', name: '보험',       icon: '/assets/cat-insurance.webp', benefit: '무료 보장 분석',   desc: '실손·암·운전자·화재보험까지, 갖고 있는 보험 전체를 무료로 진단해 드려요.' },
  { slug: 'appliance', name: '가전',       icon: '/assets/cat-appliance.webp', benefit: '제휴가 구매 지원', desc: 'TV·세탁기·냉장고 등 대형가전을 제휴 특가로, 설치 일정까지 맞춰 드려요.' },
  { slug: 'etc',       name: '생활/기타',  icon: '/assets/cat-etc.webp',       benefit: '맞춤 상담 지원',   desc: '입주청소·중고폰 매입·상조·인력 서비스 등 생활에 필요한 모든 서비스를 연결해요.' },
]

export const catBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug)

// ─── 리드 상태 6단계 (전 화면 공통 단일 enum — 동의어 금지) ───
export const LEAD_STATUS = ['접수', '상담대기', '상담완료', '개통대기', '완료', '취소']

// 허용 전이 테이블 — 전이는 반드시 이 테이블을 경유(스토어가 불법 전이를 무시)
export const LEAD_TRANSITIONS = {
  접수: ['상담대기', '취소'],
  상담대기: ['상담완료', '취소'],
  상담완료: ['개통대기', '취소'],
  개통대기: ['완료', '취소'],
  완료: [],
  취소: [],
}
export const canTransition = (from, to) => (LEAD_TRANSITIONS[from] ?? []).includes(to)

export const STATUS_COLOR = {
  접수: '#5377D6',
  상담대기: '#8B7BFF',
  상담완료: '#E255A1',
  개통대기: '#F79009',
  완료: '#17B26A',
  취소: '#F04438',
}

// ─── 권역 체계 (사업기획서 v4 — 11개 영업단) ───────────────────
export const UNITS = [
  { code: 'SD1', name: '수도1단', cover: '서울 동북 + 경기 북부' },
  { code: 'SD2', name: '수도2단', cover: '서울 서남 + 경기 남부' },
  { code: 'SD3', name: '수도3단', cover: '인천 + 경기 서부' },
  { code: 'GW',  name: '강원단',  cover: '강원 전체' },
  { code: 'CC1', name: '충청1단', cover: '충남 + 세종' },
  { code: 'CC2', name: '충청2단', cover: '충북 + 대전' },
  { code: 'JB',  name: '전북단',  cover: '전북 전체' },
  { code: 'JN',  name: '전남단',  cover: '전남 + 광주' },
  { code: 'GB',  name: '경북단',  cover: '경북 + 대구' },
  { code: 'GN',  name: '경남단',  cover: '경남 + 부산' },
  { code: 'JJ',  name: '제주단',  cover: '제주 + 울릉' },
]

// 시·군·구 → 영업단 매핑(대표 지역만 — 실서비스는 전체 행정구역 테이블로 확장)
export const REGIONS = [
  { sigungu: '서울 노원구', unit: 'SD1' }, { sigungu: '서울 강북구', unit: 'SD1' }, { sigungu: '서울 성북구', unit: 'SD1' },
  { sigungu: '서울 은평구', unit: 'SD1' }, { sigungu: '서울 강동구', unit: 'SD1' }, { sigungu: '경기 고양시', unit: 'SD1' },
  { sigungu: '경기 남양주시', unit: 'SD1' }, { sigungu: '경기 의정부시', unit: 'SD1' },
  { sigungu: '서울 마포구', unit: 'SD2' }, { sigungu: '서울 강남구', unit: 'SD2' }, { sigungu: '서울 송파구', unit: 'SD2' },
  { sigungu: '서울 영등포구', unit: 'SD2' }, { sigungu: '서울 관악구', unit: 'SD2' }, { sigungu: '경기 성남시', unit: 'SD2' },
  { sigungu: '경기 수원시', unit: 'SD2' }, { sigungu: '경기 용인시', unit: 'SD2' }, { sigungu: '경기 광명시', unit: 'SD2' },
  { sigungu: '인천 부평구', unit: 'SD3' }, { sigungu: '인천 연수구', unit: 'SD3' }, { sigungu: '인천 서구', unit: 'SD3' },
  { sigungu: '경기 부천시', unit: 'SD3' }, { sigungu: '경기 김포시', unit: 'SD3' }, { sigungu: '경기 시흥시', unit: 'SD3' }, { sigungu: '경기 안산시', unit: 'SD3' },
  { sigungu: '강원 춘천시', unit: 'GW' }, { sigungu: '강원 원주시', unit: 'GW' },
  { sigungu: '충남 천안시', unit: 'CC1' }, { sigungu: '세종시', unit: 'CC1' },
  { sigungu: '대전 서구', unit: 'CC2' }, { sigungu: '충북 청주시', unit: 'CC2' },
  { sigungu: '전북 전주시', unit: 'JB' }, { sigungu: '전북 군산시', unit: 'JB' },
  { sigungu: '광주 서구', unit: 'JN' }, { sigungu: '전남 순천시', unit: 'JN' },
  { sigungu: '대구 수성구', unit: 'GB' }, { sigungu: '경북 포항시', unit: 'GB' },
  { sigungu: '부산 해운대구', unit: 'GN' }, { sigungu: '경남 창원시', unit: 'GN' }, { sigungu: '부산 부산진구', unit: 'GN' },
  { sigungu: '제주 제주시', unit: 'JJ' }, { sigungu: '제주 서귀포시', unit: 'JJ' },
]

export const unitBySigungu = (sigungu) => REGIONS.find((r) => r.sigungu === sigungu)?.unit ?? null
export const unitName = (code) => UNITS.find((u) => u.code === code)?.name ?? '본사 직할'

// ─── 파트너몰 브랜딩 컬러 프리셋 8종 ───────────────────────────
export const BRAND_PRESETS = [
  { key: 'blue',    name: '모두온 블루', color: '#5377D6' },
  { key: 'indigo',  name: '딥 인디고',   color: '#5B6CFF' },
  { key: 'coral',   name: '코랄',        color: '#F7745F' },
  { key: 'orange',  name: '선셋 오렌지', color: '#F2662D' },
  { key: 'green',   name: '포레스트',    color: '#17B26A' },
  { key: 'teal',    name: '딥 틸',       color: '#0E9384' },
  { key: 'purple',  name: '바이올렛',    color: '#8B7BFF' },
  { key: 'navy',    name: '미드나잇',    color: '#243B6B' },
]

// ─── 상담 희망 시간 ───
export const CONSULT_TIMES = ['지금 바로', '오전(9~12시)', '오후(12~18시)', '저녁(18~21시)']

// ─── 실사용 후기 (소셜프루프 — 아정당·다쏜다 흡수) ───────────────
// 데모 예시 데이터. 실서비스에서는 개통 완료 리드에 한해 검증 후기만 노출.
export const REVIEWS = [
  { name: '김도윤', region: '서울 강남구', cat: '인터넷/TV', rating: 5, days: 1, tag: '현금 35만원', text: '현금 사은품 35만원, 설치 확인하고 3일 만에 진짜 입금됐어요. 다른 데는 상품권만 준다던데 여긴 현금이라 좋았습니다.' },
  { name: '이서연', region: '경기 성남시', cat: '휴대폰', rating: 5, days: 2, tag: '월 2.3만원↓', text: '선택약정으로 바꾸니 월 통신비가 2만3천원 줄었어요. 억지로 안 팔고 필요한 것만 짚어줘서 신뢰가 갔습니다.' },
  { name: '박지훈', region: '인천 부평구', cat: '인터넷/TV', rating: 4, days: 3, tag: '결합 할인', text: '인터넷+정수기 결합까지 한 번에 정리했어요. 설치 가능 지역이 바로 조회돼서 편했습니다.' },
  { name: '최유진', region: '부산 해운대구', cat: '이사', rating: 5, days: 5, tag: '20만원 절약', text: '이사 견적 3곳 비교해서 20만원 아꼈어요. 입주청소까지 연결해줘서 손 하나 안 댔네요.' },
  { name: '정민재', region: '대전 서구', cat: '정수기', rating: 5, days: 6, tag: '렌탈료↓', text: '쓰던 것보다 월 렌탈료도 싸고 사은품도 챙겨줬어요. 진행 현황이 문자로 계속 와서 안심됐습니다.' },
  { name: '오세라', region: '광주 서구', cat: '인터넷/TV', rating: 5, days: 8, tag: '현금 40만원', text: '1기가로 바꾸면서 현금 40만원 받았어요. 신청부터 개통까지 일주일 안 걸렸습니다.' },
]

// 법무 고정 문구
export const LEGAL = {
  quote: 'AI 견적은 참고용이며 최종 조건은 상담 시 확정됩니다.',
  policy: '정책·지원 조건은 통신사·요금제·기간·재고·지역 등에 따라 변동될 수 있습니다.',
  profit: '수익 예시는 이해를 돕기 위한 것으로 실제 수익을 보장하지 않습니다.',
  privacy: '고객 주소는 상담 배정을 위해 시·군·구 단위까지만 수집합니다.',
}
