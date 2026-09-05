// 스토어 카탈로그 — kcare팀 실무자 피드백 엑셀 2건 (2026-08-09) 그대로.
//
// 분류는 '쇼핑몰 제안' 시트의 설계에서 출발했다: 원래 약국(구매대행)·영양제·
// 일상용품 + 생활안전용품 4개 축이었으나, 약국 축은 2026-08-28 자로 뺐다
// (일반의약품 앱 결제 구매대행 불가 확인 — 아래 STORE_CATALOG 주석 참고).
// 지금은 영양제 · 일상용품 · 생활안전용품 3개 축이다.
//
// 가격은 시트의 판매가만 싣는다. 원가는 내부 정보라 데이터에 넣지 않는다
// (화면에 실수로 노출되는 사고를 원천 차단). 시트에 가격이 없는 항목은
// pending 으로 표기만 하고 담기지 않게 한다 — 없는 숫자를 지어내지 않는다.
//
// 두 시트 대조 기준: 같은 제품이 용량·가격이 다르게 실린 5건(베나치오 ·
// 판피린 · 겔포스 · 카베진 · 알레그라)은 '쇼핑몰 제안'(나중에 만든 큐레이션
// 시트) 쪽을 실었다. '메가스토어'에만 있는 제품(용각산 · 훼스탈 2종 ·
// 포비돈/알콜 스왑)은 그 시트 가격으로 추가했다. 두 시트 모두 반영 완료.

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
  // 약국 분류(일반의약품 구매대행)는 통째로 뺐다 (2026-08-28 실무진 전달).
  // 일반의약품을 앱에서 결제받아 구매대행하는 것은 안 된다는 확인을 받았다 —
  // 파는 것이 아니라 대행이어도, 앱 결제가 붙는 순간 경계를 넘는다.
  // 비타민 등 의약외품·건강기능식품은 가능해서 영양제 분류는 그대로 둔다.
  // 약국 '심부름'(처방약 수령 동행·현장 결제)은 해주세요의 영역이라 별개다.
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
      {
        // 2026-08-12 보호자화면 시트 — "일상용품 추가 될 예정 (시니어 바디워시/보습제 등)".
        // 품목만 먼저 세우고 가격은 비워 둔다. 시트에 단가가 없어서 지어낼 수 없다.
        name: "시니어 위생 · 보습",
        items: [
          { id: "dl7", name: "시니어 저자극 바디워시", price: null, pending: "가격 확정 전", note: "약산성 · 건조 피부용" },
          { id: "dl8", name: "시니어 전신 보습제", price: null, pending: "가격 확정 전", note: "목욕 직후 도포용" },
          { id: "dl9", name: "저자극 엠보싱 물티슈", price: null, pending: "가격 확정 전", note: "요양병원 거주 기본제공품과 동일 규격" },
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

