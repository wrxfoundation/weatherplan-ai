// ─── 사은품 지급 명단 데이터 (아정당식 소셜 프루프 — 흡수) ────────────
// "왕창 돌려드린다"의 증거: 설치·개통 확인 후 지급된 현금 사은품 내역을
// 일자별로 공개. 개인정보 보호를 위해 이름은 마스킹, 금액은 조건별 상이.
//
// 결정적 RNG(mulberry32)로 시드를 고정 — 렌더·새로고침마다 명단이 뒤섞이지
// 않게 한다(신뢰 요소는 흔들리면 안 된다). 데모 표본임을 UI에 명시한다.
import { REGIONS } from './constants'
import { maskName } from './engine'

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SURNAMES = '김이박최정강조윤장임한오서신권황안송전홍고문양손배백허남심노하곽성차주우구'.split('')
const GIVEN = ['도윤', '서준', '하은', '지우', '시우', '예린', '주원', '아윤', '민재', '채영', '서연', '지호', '수아', '건우', '유진', '하준', '지민', '현우', '서현', '예준', '다은', '준서', '소율', '시윤', '지안', '은우', '민준', '지아', '수빈', '예은']

// 카테고리별 현금 사은품 범위(원) — 혜택카드·견적표와 정합(최대치 아님, 조건별 상이)
const GIFT = {
  phone: [250000, 480000, '휴대폰'],
  internet: [200000, 460000, '인터넷/TV'],
  water: [150000, 300000, '정수기'],
  rental: [150000, 300000, '가전렌탈'],
  appliance: [200000, 400000, '가전'],
  move: [100000, 340000, '이사'],
}
const CATS = Object.keys(GIFT)
const VIA = ['현금 계좌입금', '현금 계좌입금', '현금 계좌입금', '상품권', '요금 자동차감']
const round1man = (n) => Math.round(n / 10000) * 10000

export function ymd(ts) {
  const d = new Date(ts)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function buildRoster(dayIndex, todayTs) {
  const r = rng(1000 + dayIndex * 97)
  const date = todayTs - dayIndex * 86400000
  const n = 8 + Math.floor(r() * 12) // 8~19명/일
  const recipients = []
  for (let i = 0; i < n; i++) {
    const full = SURNAMES[Math.floor(r() * SURNAMES.length)] + GIVEN[Math.floor(r() * GIVEN.length)]
    const region = REGIONS[Math.floor(r() * REGIONS.length)]
    const cat = CATS[Math.floor(r() * CATS.length)]
    const [lo, hi, label] = GIFT[cat]
    recipients.push({
      name: maskName(full),
      sigungu: region.sigungu,
      cat,
      catLabel: label,
      amount: round1man(lo + r() * (hi - lo)),
      via: VIA[Math.floor(r() * VIA.length)],
    })
  }
  return {
    id: `PO-${dayIndex}`,
    date,
    count: n,
    views: Math.max(40, 320 - dayIndex * 9 - Math.floor(r() * 40)),
    isNew: dayIndex <= 2,
    recipients,
  }
}

const TODAY0 = (() => { const d = new Date(); d.setHours(9, 0, 0, 0); return d.getTime() })()

export const PAYOUT_ROSTERS = Array.from({ length: 20 }, (_, i) => buildRoster(i, TODAY0))

// 누적 지급 완료 인원(소셜 프루프 헤드라인) — 데모 표본
export const PAYOUT_CUMULATIVE = 12480 + PAYOUT_ROSTERS.reduce((s, r) => s + r.count, 0)

// 전체 수령자 평탄화(검색용)
export const PAYOUT_ALL = PAYOUT_ROSTERS.flatMap((r) => r.recipients.map((x) => ({ ...x, date: r.date })))
