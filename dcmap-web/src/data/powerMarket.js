// 전력 원가 환경 — 한전 전력구입 실적(2024). DC의 최대 OPEX가 전력비이므로 도매 구입단가·계절성·PPA 조달을 맥락으로.
// 정직성: 전국 도매 구입단가(한전 기준)이며, 개별 DC의 실제 계약단가·지역 차등·산업용 요금제와는 다름.
// 출처: 「한국전력통계」 전력구입 실적(KOSIS DT_31002N_A003), 「전력시장통계」 신재생 전력거래량(DT_38804_B03).
export const POWER_MARKET_META = {
  source: '한국전력공사 「한국전력통계」 전력구입 실적(2024) · 한국전력거래소 신재생 전력거래량(2025)',
  note: '전국 도매 구입단가(한전 기준). DC OPEX 맥락이며 개별 계약단가·지역 차등과는 다름.',
}

// 2024년 월별 한전 구입단가(합계, 원/kWh). 출처 DT_31002N_A003.
export const PURCHASE_PRICE_2024 = [
  { m: 1, price: 138.94 }, { m: 2, price: 123.45 }, { m: 3, price: 128.19 },
  { m: 4, price: 129.30 }, { m: 5, price: 127.94 }, { m: 6, price: 131.27 },
  { m: 7, price: 164.32 }, { m: 8, price: 156.41 }, { m: 9, price: 142.21 },
  { m: 10, price: 116.48 }, { m: 11, price: 114.55 }, { m: 12, price: 132.41 },
]

// 연간 요약(원/kWh, 구입량 MWh, PPA 비중). 합계행 기준.
export const PURCHASE_SUMMARY = {
  avgPrice: 134.78, // 합계 평균 구입단가
  marketPrice: 134.68, // 전력시장
  ppaPrice: 137.17, // PPA(전력구입계약)
  totalMwh: 572253257,
  ppaMwh: 23123444,
  ppaSharePct: +((23123444 / 572253257) * 100).toFixed(1), // 4.0%
}

const peak = PURCHASE_PRICE_2024.reduce((a, b) => (b.price > a.price ? b : a))
const low = PURCHASE_PRICE_2024.reduce((a, b) => (b.price < a.price ? b : a))
export const PRICE_PEAK = peak // 7월 164.32
export const PRICE_LOW = low // 11월 114.55

// 신재생 전력거래량 믹스(2025, 전국). RE100/CFE 조달 맥락. 출처 DT_38804_B03.
export const RENEWABLE_MIX_2025 = {
  totalTwh: 39.7, // 신재생 전력거래량 합계 39,696,825 MWh
  bySource: [
    { source: '태양광', pct: 32.0 },
    { source: '바이오', pct: 23.9 }, // 바이오매스+중유+가스+매립+SRF
    { source: '연료전지', pct: 21.0 },
    { source: '풍력', pct: 11.0 },
    { source: '수력', pct: 9.5 },
    { source: 'IGCC', pct: 2.8 },
  ],
}
