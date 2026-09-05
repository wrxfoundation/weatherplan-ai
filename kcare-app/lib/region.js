// 서비스 가능지역 및 이용적합성 심사 — REQ-15
// 1차 자동 판정(주소 → 급지) + 방문 상담 시 확인하는 잔여 심사 항목.
// 급지 경계는 목 데이터이며 실제 경계는 경영 확정 사항(§7-2).

export const TIER1_DISTRICTS = ["강남구", "서초구", "송파구", "강동구", "성동구", "용산구", "광진구"];
export const TIER2_DISTRICTS = [
  "종로구", "중구", "동작구", "관악구", "영등포구", "마포구", "서대문구", "성북구",
  "동대문구", "중랑구", "노원구", "강서구", "양천구", "구로구", "금천구", "은평구",
  "도봉구", "강북구", "성남시 분당구", "과천시", "하남시",
];

// 심사 12항목 (회의 확정) — 자동 판정 항목과 방문 확인 항목 구분
export const SCREENING_ITEMS = [
  { name: "주소", auto: true },
  { name: "서비스 거점과 거리", auto: true },
  { name: "산간·도서 여부", auto: true },
  { name: "병원 이동거리", auto: true },
  { name: "차량 진입", auto: false },
  { name: "엘리베이터", auto: false },
  { name: "주차", auto: false },
  { name: "야간 접근성", auto: false },
  { name: "휠체어 이동", auto: false },
  { name: "보호자 유무", auto: false },
  { name: "1인 또는 2인 필요 여부", auto: false },
  { name: "안전위험", auto: false },
];

export function screenRegion(district) {
  if (TIER1_DISTRICTS.includes(district)) {
    return {
      tier: 1,
      label: "1급지",
      summary: "강남 거점 기준 서비스 권역입니다. 대중교통·차량 접근이 원활하고 전담 컨시어지 배정이 가능합니다.",
    };
  }
  if (TIER2_DISTRICTS.includes(district)) {
    return {
      tier: 2,
      label: "2급지",
      summary: "서비스 가능 권역이지만 이동시간·주차 여건에 따라 구독료 또는 출동비가 별도 산정됩니다. 상담 후 확정됩니다.",
    };
  }
  return {
    tier: 0,
    label: "서비스 준비 중 지역",
    summary: "현재 상시 인력 배치와 야간 안전확보가 어려운 지역입니다. 대기 등록을 남겨 주시면 서비스 개시 시 가장 먼저 안내드립니다.",
  };
}
