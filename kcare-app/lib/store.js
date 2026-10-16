// 스토어 카탈로그 — kcare팀 실무자 피드백 엑셀 2건 (2026-08-09) 그대로.
//
// 분류는 '쇼핑몰 제안' 시트의 설계에서 출발했다: 원래 약국(구매대행)·영양제·
// 일상용품 + 생활안전용품 4개 축이었으나, 약국 축은 2026-08-28 자로 뺐다
// (일반의약품 앱 결제 구매대행 불가 확인 — 아래 STORE_CATALOG 주석 참고).
// 2026-10-02 운영 결정으로 지금은 생활안전용품 한 축만 판다. 배송비는 모두 무료다 (같은 날 결정).
//
// 가격은 시트의 판매가만 싣는다. 원가는 내부 정보라 데이터에 넣지 않는다
// (화면에 실수로 노출되는 사고를 원천 차단). 시트에 가격이 없는 항목은
// pending 으로 표기만 하고 담기지 않게 한다 — 없는 숫자를 지어내지 않는다.

// ── 생활안전용품 — 첫 방문 안전진단(lib/safety.js)의 fix 가 이 id 를 가리킨다 ──
// ship 은 0 — 배송비는 모두 무료 (2026-10-02 결정). 칸은 남겨 두어 주문 기록 형식이 바뀌지 않게 한다.
export const SAFETY_GOODS = [
  {
    id: "mat",
    name: "논슬립 욕실 미끄럼 방지 매트 (2.3m)",
    price: 80000,
    ship: 0,
    effect: "욕실 바닥 미끄럼 · 낙상 예방",
  },
  {
    id: "slippers",
    name: "논슬립 실내 안전 슬리퍼",
    price: 25000,
    ship: 0,
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
    ship: 0,
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
    ship: 0,
    effect: "차량 · 의자 회전 시 허리 · 무릎 부담 감소",
  },
];

// ── 전체 카탈로그 ───────────────────────────────────────────────────────────
export const STORE_CATALOG = [
  // 스토어는 생활안전용품만 판다 (2026-10-02 운영 결정 — QA 체크리스트 '운영 결정 미반영').
  // 영양제 · 일상용품 분류는 뺐다. 그 전에 약국 분류(일반의약품 구매대행)도 2026-08-28 에 뺐다 —
  // 앱 결제가 붙는 구매대행은 경계를 넘는다. 건강식품을 다시 사다 드리는 일은 해주세요(심부름)의 영역이다.
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

