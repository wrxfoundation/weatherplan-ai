// 스토어 카탈로그 — kcare팀 실무자 피드백 엑셀 2건 (2026-08-09) 그대로.
//
// 분류는 '쇼핑몰 제안' 시트의 설계를 따른다: 약국(구매대행 표기) · 영양제 ·
// 일상용품, 여기에 '스토어 상품 리스트' 시트의 생활안전용품을 더해 4개 축.
// 약국 안쪽 하위분류(소염·진통·감기 / 파스 / 소화·속쓰림 / 드링크 / 알러지·상처)도
// 시트 그대로다.
//
// 가격은 시트의 판매가만 싣는다. 원가는 내부 정보라 데이터에 넣지 않는다
// (화면에 실수로 노출되는 사고를 원천 차단). 시트에 가격이 없는 항목은
// pending 으로 표기만 하고 담기지 않게 한다 — 없는 숫자를 지어내지 않는다.

// ── 생활안전용품 — 첫 방문 안전진단(lib/safety.js)의 fix 가 이 id 를 가리킨다 ──
export const SAFETY_GOODS = [
  {
    id: "mat",
    name: "논슬립 욕실 미끄럼 방지 매트 (2.3m)",
    price: 80000,
    ship: 3500,
    effect: "욕실 바닥 미끄럼 · 낙상 예방",
  },
  {
    id: "slippers",
    name: "논슬립 실내 안전 슬리퍼",
    price: 25000,
    ship: 3000,
    effect: "실내 이동 시 미끄러짐 예방",
  },
  {
    id: "grabBar",
    name: "다용도 보조 안전바",
    price: 120000,
    ship: 0,
    effect: "샤워 · 목욕 시 균형 유지, 이동 보조",
  },
  {
    id: "sensorLight",
    name: "동작 인식 LED 센서등 (1m)",
    price: 20000,
    ship: 3000,
    effect: "야간 화장실 이동 시 시야 확보",
  },
  {
    id: "magnifier",
    name: "LED 확대경",
    price: 40000,
    ship: 0,
    effect: "작은 글씨 · 약 봉투 확인 시력 보조",
  },
  {
    id: "swivel",
    name: "회전 좌석 쿠션",
    price: 20000,
    ship: 5000,
    effect: "차량 · 의자 회전 시 허리 · 무릎 부담 감소",
  },
];

// ── 전체 카탈로그 ───────────────────────────────────────────────────────────
export const STORE_CATALOG = [
  {
    id: "pharmacy",
    name: "약국",
    icon: "plus",
    badge: "구매대행",
    note: "약은 저희가 팔지 않습니다. 약국에서 구매를 대행하고 영수증을 남깁니다.",
    groups: [
      {
        name: "소염 · 진통제 · 감기약",
        items: [
          { id: "ph1", name: "이지엔6 스트롱 10캡슐", price: 2000 },
          { id: "ph2", name: "탁센 ×10", price: 1800 },
          { id: "ph3", name: "타이레놀 500 10캡슐", price: 2700 },
          { id: "ph4", name: "판콜 30ml ×30", price: 15000 },
          { id: "ph5", name: "판피린 20ml ×5", price: 2500 },
          { id: "ph6", name: "동의갈근탕액 ×10", price: 8000 },
          { id: "ph7", name: "목앤 스프레이 20ml", price: 6000 },
          { id: "ph8", name: "스트렙실 허니앤레몬 12정", price: 4200 },
        ],
      },
      {
        name: "파스",
        items: [
          { id: "pa1", name: "안티푸라민 쿨파워 10매 ×4", price: 9500 },
          { id: "pa2", name: "안티푸라민 더블파워 7매 ×4", price: 8000 },
          { id: "pa3", name: "장수고 카타플라스마 6매", price: 3500 },
          { id: "pa4", name: "신신 에어파스 미니", price: 2000 },
        ],
      },
      {
        name: "소화 · 속쓰림 · 복통",
        items: [
          { id: "di1", name: "베나치오 20ml ×5", price: 4000 },
          { id: "di2", name: "까스활명수 ×10", price: 9700 },
          { id: "di3", name: "애린쏙 10정", price: 2000 },
          { id: "di4", name: "까스앤프리 12정", price: 2500 },
          { id: "di5", name: "카베진 코와알파정 100정", price: 9900 },
          { id: "di6", name: "겔포스 엠 ×6포", price: 5000 },
          { id: "di7", name: "개비스콘 더블액션 10ml ×4", price: 5200 },
          { id: "di8", name: "부스코판 플러스 20정", price: 5900 },
        ],
      },
      {
        name: "드링크제",
        items: [
          { id: "dr1", name: "광동 파워라센 (태반)", price: 180000 },
          { id: "dr2", name: "박카스 디 ×10", price: 5700, ship: 3000 },
          { id: "dr3", name: "비타오백 ×10", price: 4000 },
          { id: "dr4", name: "구론산 에프 ×10", price: 6000 },
          { id: "dr5", name: "쌍화탕 ×10", price: 5000 },
        ],
      },
      {
        name: "알러지 · 가려움 · 상처 · 화상",
        items: [
          { id: "al1", name: "지르텍 10정", price: 4200 },
          { id: "al2", name: "알레그라 10정", price: 4500 },
          { id: "al3", name: "에스로반 10g", price: 2900 },
          { id: "al4", name: "큐어반 화상 스프레이 50g", price: 10000 },
          { id: "al5", name: "하이맘 밴드 (표준 · 혼합)", price: 800 },
          { id: "al6", name: "세레스톤지 15g", price: 3200 },
          { id: "al7", name: "리도맥스 0.15%", price: 3500 },
          { id: "al8", name: "메디폼 리퀴드", price: 6000 },
          { id: "al9", name: "누보클렌 (뿌리는 소독약)", price: 2500 },
          { id: "al10", name: "네오드레싱 거즈밴드", price: 2000 },
          { id: "al11", name: "듀오덤", price: null, pending: "가격 확정 전" },
        ],
      },
    ],
  },
  {
    id: "vitamin",
    name: "영양제",
    icon: "drop",
    badge: null,
    note: "복용 중인 약과의 충돌은 담당 컨시어지가 방문 때 함께 확인합니다.",
    groups: [
      {
        name: "비타민 · 미네랄",
        items: [
          { id: "vt1", name: "영국산 비타민C 3000", price: 26000 },
          { id: "vt2", name: "종근당 비타민씨 골드 1000", price: 11000 },
          { id: "vt3", name: "아임 비타 멀티비타민 이뮨플러스", price: 36800 },
          { id: "vt4", name: "일동 비타민D 5000IU 90캡슐", price: 25000 },
          { id: "vt5", name: "광동 명품비타민K2 프리미엄", price: 40000 },
          { id: "vt6", name: "듀오 K2 알티지오메가3 탑", price: 70000 },
          { id: "vt7", name: "마그비 EX (마그네슘)", price: 50000 },
          { id: "vt8", name: "젠빅 엠지 120정 (근육 이완)", price: 40000 },
          { id: "vt9", name: "임팩타민 원스", price: 45000 },
          { id: "vt10", name: "리포좀 소연골 콘드로이친 1500", price: 50000 },
        ],
      },
    ],
  },
  {
    id: "daily",
    name: "일상용품",
    icon: "bag",
    badge: null,
    note: null,
    groups: [
      {
        name: "생활",
        items: [
          { id: "dl1", name: "소독티슈", price: 3700 },
          { id: "dl2", name: "가벼운 우양산", price: null, pending: "가격 확정 전" },
          { id: "dl3", name: "벌레 퇴치제", price: null, pending: "가격 확정 전" },
          { id: "dl4", name: "시린이 치약", price: null, pending: "가격 확정 전" },
          { id: "dl5", name: "가글", price: null, pending: "가격 확정 전" },
          {
            id: "dl6",
            name: "K-CARE 구급상자 키트",
            price: null,
            pending: "구성 확정 중",
            note: "소독약 · 포비돈/알콜 스왑 · 밴드 · 면봉 · 핀셋 · 거즈밴드 · 에어파스 · 가위 · 소독티슈 · 듀오덤 · 항생연고",
          },
        ],
      },
    ],
  },
  {
    id: "safety",
    name: "생활안전용품",
    icon: "shield",
    badge: "안전진단 연동",
    note: "첫 방문 홈 안전진단에서 '아니오'가 나온 항목의 용품이 자동으로 담깁니다.",
    groups: [
      {
        name: "낙상 예방 · 생활 안전",
        items: SAFETY_GOODS.map((g) => ({
          id: g.id,
          name: g.name,
          price: g.price,
          ship: g.ship,
          note: g.effect,
        })),
      },
    ],
  },
];

// id → 상품 (장바구니 자동 담기 · 합계 계산)
export const STORE_INDEX = Object.fromEntries(
  STORE_CATALOG.flatMap((c) => c.groups.flatMap((g) => g.items.map((i) => [i.id, i])))
);

// 어르신 화면용 축약 목록 — 활자 큰 단일 리스트라 6개까지만.
// 자주 찾는 것 3 + 생활안전용품 3 (실무자: 스토어 3종 공통으로 생활안전용품 노출)
export const ELDER_STORE_PICKS = [
  { id: "pa1", name: "안티푸라민 파스", price: 9500 },
  { id: "dr2", name: "박카스 디 (10병)", price: 5700 },
  { id: "vt2", name: "비타민씨 골드", price: 11000 },
  { id: "slippers", name: "미끄럼 안 나는 슬리퍼", price: 25000 },
  { id: "sensorLight", name: "밤에 켜지는 자동 불", price: 20000 },
  { id: "magnifier", name: "글씨 크게 보는 확대경", price: 40000 },
];
