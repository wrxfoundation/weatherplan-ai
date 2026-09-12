// ─── 수당(리베이트) 분배 엔진 — 3계층 정산의 단일 소스 ─────────────────
// 2026-08-29 수당구조 회의 결정사항을 코드로 옮긴 것.
//
// [원칙 1] 퍼센트가 아니라 "정책 단가표(고정값)"로 간다.
//   상위 계층 몫은 건당 정액(히든)이고, 셀러가 나머지를 가져간다.
//   비율(60/20/10/10)은 결과로 나오는 파생값일 뿐 계산의 입력이 아니다.
//   — 이 화면에서는 그 파생 비율을 함께 보여줘 "얼마씩 나뉘는지"를 확인시킨다.
//
// [원칙 2] 리베이트 단가는 총판·대리점·셀러 누가 봐도 동일하게 보인다.
//   계층별 추가 몫("히든")만 각자의 화면에서 가산된다. 상위 계층은 하위의
//   최종 마진을 알 필요가 없고, 하위는 상위 몫을 몰라도 자기 수당을 안다.
//
// [원칙 3] 지원금 재량 — 휴대폰은 셀러가 단가 한도 안에서 고객 지원금을
//   직접 설계하고, 남는 만큼이 자기 수당이 된다("빵원 특가"의 실체).
//   인터넷/TV는 통신사가 고객 지원금 상한을 고정해 재량이 없다.
//
// ※ 금액은 데모 기준값 — 실제 정책 단가표(엑셀) 수령 시 RATE_CARD만 교체하면
//   설계기·정산·어드민이 동시에 갱신된다.

export const TIERS = { seller: '셀러', agency: '대리점', distributor: '총판', hq: '본사' }

// 지원금 방식: 'free'  = 셀러 재량(단가 한도 내)
//              'fixed' = 통신사 고정 상한(재량 없음)
//              'none'  = 고객 지원금 없음(건당 수수료형)
export const RATE_CARD = [
  {
    id: 'mno-fold', group: 'MNO', name: '갤럭시 Z 폴드8 (번호이동)', short: '폴드8 MNP',
    rebate: 600000, supportMode: 'free',
    hidden: { agency: 50000, distributor: 10000, hq: 20000 },
  },
  {
    id: 'mno-air', group: 'MNO', name: '아이폰 에어 (번호이동)', short: '아이폰 에어 MNP',
    rebate: 1100000, supportMode: 'free',
    hidden: { agency: 50000, distributor: 10000, hq: 20000 },
  },
  {
    id: 'mvno', group: 'MVNO', name: '알뜰폰 유심 개통', short: '알뜰폰',
    rebate: 90000, supportMode: 'free',
    hidden: { agency: 20000, distributor: 10000, hq: 10000 },
  },
  {
    id: 'net-lgu', group: '인터넷+TV', name: 'LG U+ 인터넷 500M + TV', short: 'U+ 인터넷',
    rebate: 800000, supportMode: 'fixed', supportCap: 520000,
    hidden: { agency: 50000, distributor: 10000, hq: 20000 },
  },
  {
    id: 'net-kt', group: '인터넷+TV', name: 'KT 인터넷 1G + TV', short: 'KT 인터넷',
    rebate: 760000, supportMode: 'fixed', supportCap: 480000,
    hidden: { agency: 50000, distributor: 10000, hq: 20000 },
  },
  {
    id: 'rental-water', group: '렌탈', name: '정수기 렌탈 (60개월)', short: '정수기 렌탈',
    rebate: 180000, supportMode: 'none',
    hidden: { agency: 20000, distributor: 10000, hq: 10000 },
  },
  {
    id: 'rental-air', group: '렌탈', name: '공기청정기 렌탈 (60개월)', short: '공청기 렌탈',
    rebate: 160000, supportMode: 'none',
    hidden: { agency: 20000, distributor: 10000, hq: 10000 },
  },
]

export const rateItem = (id) => RATE_CARD.find((r) => r.id === id) ?? RATE_CARD[0]
export const RATE_GROUPS = [...new Set(RATE_CARD.map((r) => r.group))]

// 고객 지원금의 허용 범위 — 상위 계층 몫(히든 합)은 건드릴 수 없으므로
// 셀러가 풀 수 있는 최대치는 "단가 − 히든 합"이다.
export function supportRange(item) {
  const hiddenSum = item.hidden.agency + item.hidden.distributor + item.hidden.hq
  const max = Math.max(0, item.rebate - hiddenSum)
  if (item.supportMode === 'fixed') return { min: item.supportCap, max: item.supportCap, hiddenSum }
  if (item.supportMode === 'none') return { min: 0, max: 0, hiddenSum }
  return { min: 0, max, hiddenSum }
}

/**
 * 한 건의 수당 분배.
 * @param itemId 정책 단가표 상품
 * @param support 고객에게 지급할 지원금(휴대폰은 셀러 재량, 인터넷은 고정)
 * @param direct  대리점 직영 판매 여부 — true면 셀러 몫과 대리점 몫을 한 사람이 갖는다
 */
export function calcCommission({ itemId = 'mno-fold', support = 0, direct = false } = {}) {
  const item = rateItem(itemId)
  const range = supportRange(item)
  const customer = Math.min(range.max, Math.max(range.min, Math.round(support)))

  const agency = item.hidden.agency
  const distributor = item.hidden.distributor
  const hq = item.hidden.hq
  const seller = Math.max(0, item.rebate - customer - agency - distributor - hq)

  // 파생 비율 — 계산 입력이 아니라 "이렇게 나뉘었다"는 확인용
  const pool = seller + agency + distributor + hq
  const pct = (v) => (pool > 0 ? Math.round((v / pool) * 1000) / 10 : 0)

  return {
    item, customer, range,
    seller, agency, distributor, hq,
    pool,                                   // 고객 지원금을 뺀 뒤 계층이 나눠 갖는 총액
    take: direct ? seller + agency : seller, // 대리점 직영이면 셀러+대리점 몫을 함께 수령
    direct,
    share: { seller: pct(seller), agency: pct(agency), distributor: pct(distributor), hq: pct(hq) },
  }
}

// 역산 — "고객에게 0원(빵원 특가)으로 맞추려면?" 같은 프리셋
export function supportPresets(item) {
  const { min, max } = supportRange(item)
  if (item.supportMode !== 'free') return []
  return [
    { label: '최대 지원 (셀러 수당 0)', value: max },
    { label: '절반 지원', value: Math.round(max / 2 / 10000) * 10000 },
    { label: '지원 없음 (셀러 수당 최대)', value: min },
  ]
}
