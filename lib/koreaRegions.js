/**
 * 🇰🇷 한국 행정구역 지리 레퍼런스 (Wikidata 실데이터)
 *
 * 용도 : 지역 좌표·인구 레퍼런스
 *        - 위치명 → 표준 좌표 해석 (weather_at_location)
 *        - 지도 마커 / 반경 매칭(“정식: 좌표 거리 계산”) 기반값
 * 성격 : ⚠️ 지리(위치·인구) 데이터일 뿐, 날씨 데이터가 아님.
 *        날씨 판정·예보의 단일 출처(SSOT)는 케이웨더로 유지한다.
 * 출처 : Wikidata SPARQL (query.wikidata.org) — 항목별 QID 명시
 *        좌표 = WGS84 (P625) · 인구 = 최신 P1082 · 국가 = 대한민국(Q884)
 * 취득 : 2026-07-01 (라이브 쿼리 결과 정제)
 *
 * 재현 쿼리 (광역 시·도):
 *   SELECT ?item ?itemLabel ?population ?coord WHERE {
 *     ?item wdt:P17 wd:Q884 ; wdt:P31/wdt:P279* wd:Q10864048 .
 *     OPTIONAL { ?item wdt:P1082 ?population. }
 *     OPTIONAL { ?item wdt:P625 ?coord. }
 *     SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }
 *   } ORDER BY DESC(?population)
 *
 * 정제 메모:
 *   - 원본 25행 → 17행. 제외: 북한 이북5도(황해·평안남/북·함경남/북, 인구·좌표 결측)
 *     + 통합예정 '전남광주통합특별시'(Q138870299).
 *   - 대구(Q20927)·광주(Q41283)는 인구 다중통계로 2행씩 → 최신(최댓값) 채택.
 *   - 도시 쿼리(Q515)는 인구 다중통계 중복으로 LIMIT 30이 조기 소진 →
 *     아래 KR_METRO_CITIES는 확인된 고유분(광역시 제외 순수 시)만. 전체 상위 N은
 *     dedup 쿼리(GROUP BY ?city ?coord / SAMPLE) 재실행 필요.
 */

// 17개 광역 시·도 — 인구 내림차순
export const KR_SIDO = [
  { name: "경기도", short: "경기", qid: "Q20937", lat: 37.5, lon: 127.25, population: 13103188 },
  { name: "서울특별시", short: "서울", qid: "Q8684", lat: 37.56, lon: 126.99, population: 9668465 },
  { name: "부산광역시", short: "부산", qid: "Q16520", lat: 35.18, lon: 129.075, population: 3453198 },
  { name: "경상남도", short: "경남", qid: "Q41151", lat: 35.237968, lon: 128.691918, population: 3350350 },
  { name: "인천광역시", short: "인천", qid: "Q20934", lat: 37.463888888, lon: 126.648611111, population: 3049315 },
  { name: "경상북도", short: "경북", qid: "Q41154", lat: 36.576144, lon: 128.50556, population: 2546960 },
  { name: "대구광역시", short: "대구", qid: "Q20927", lat: 35.871666666, lon: 128.601666666, population: 2444412 },
  { name: "충청남도", short: "충남", qid: "Q41070", lat: 36.659268, lon: 126.673005, population: 2181416 },
  { name: "전라남도", short: "전남", qid: "Q41161", lat: 34.816252, lon: 126.462975, population: 1790352 },
  { name: "전북특별자치도", short: "전북", qid: "Q41157", lat: 35.82013, lon: 127.10957, population: 1769607 },
  { name: "충청북도", short: "충북", qid: "Q41066", lat: 36.633855, lon: 127.491528, population: 1595058 },
  { name: "강원특별자치도", short: "강원", qid: "Q41071", lat: 37.5, lon: 128.25, population: 1539274 },
  { name: "광주광역시", short: "광주", qid: "Q41283", lat: 35.166666666, lon: 126.916666666, population: 1490092 },
  { name: "대전광역시", short: "대전", qid: "Q20921", lat: 36.35, lon: 127.385, population: 1475221 },
  { name: "울산광역시", short: "울산", qid: "Q41278", lat: 35.55, lon: 129.316666666, population: 1127553 },
  { name: "제주특별자치도", short: "제주", qid: "Q41164", lat: 33.366666666, lon: 126.533333333, population: 670837 },
  { name: "세종특별자치시", short: "세종", qid: "Q20929", lat: 36.487002, lon: 127.282234, population: 391984 },
];

// 인구 100만+ 순수 시(광역시 제외) — 부분 목록(위 정제 메모 참고)
export const KR_METRO_CITIES = [
  { name: "수원시", short: "수원", qid: "Q20714", lat: 37.285833333, lon: 127.01, population: 1234300 },
  { name: "용인시", short: "용인", qid: "Q18459", lat: 37.236111111, lon: 127.201111111, population: 1084817 },
  { name: "고양시", short: "고양", qid: "Q42061", lat: 37.656388888, lon: 126.835, population: 1061929 },
];

// 시·도 + 주요 시 통합 조회 풀
export const KR_REGIONS = [...KR_SIDO, ...KR_METRO_CITIES];

/**
 * 위치명(부분 일치)으로 표준 지역을 해석한다.
 * 예: "서울 강남구" → 서울특별시,  "경기 용인" → 경기도(먼저 매칭),  "제주" → 제주특별자치도
 * @param {string} name
 * @returns {{name,short,qid,lat,lon,population}|null}
 */
export function resolveRegion(name = "") {
  const q = String(name).trim();
  if (!q) return null;
  return KR_REGIONS.find((r) => q.includes(r.name) || q.includes(r.short)) || null;
}
