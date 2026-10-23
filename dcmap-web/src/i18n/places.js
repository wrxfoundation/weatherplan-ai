/* 지명·시설명 EN 표기 — EN 모드에서 데이터 유래 한글(시도·시군구·시설명)이 그대로 새던 문제의 공용 해법.
 *
 * - 시도 17개: 개정 로마자 표기(행정안전부 영문 표기 기준).
 * - 시군구: 시설 데이터에 실제 등장하는 값 + 권역 차트에 나오는 값. 사전에 없으면 원문(KO) 그대로 —
 *   누락은 화면에서 바로 보이므로 그때 여기 한 줄 추가하면 된다(추측 로마자 자동 생성은 하지 않음).
 * - 시설명은 데이터의 name_en(81곳 전부 보유)을 쓴다.
 */
export const SIDO_EN = {
  서울: 'Seoul', 부산: 'Busan', 대구: 'Daegu', 인천: 'Incheon', 광주: 'Gwangju', 대전: 'Daejeon',
  울산: 'Ulsan', 세종: 'Sejong', 경기: 'Gyeonggi', 강원: 'Gangwon', 충북: 'Chungbuk', 충남: 'Chungnam',
  전북: 'Jeonbuk', 전남: 'Jeonnam', 경북: 'Gyeongbuk', 경남: 'Gyeongnam', 제주: 'Jeju',
}

export const SIGUNGU_EN = {
  강남구: 'Gangnam-gu', 강서구: 'Gangseo-gu', 금천구: 'Geumcheon-gu', 마포구: 'Mapo-gu', 서초구: 'Seocho-gu',
  양천구: 'Yangcheon-gu', 영등포구: 'Yeongdeungpo-gu', 용산구: 'Yongsan-gu', 부평구: 'Bupyeong-gu',
  연수구: 'Yeonsu-gu', 유성구: 'Yuseong-gu', 북구: 'Buk-gu', 서구: 'Seo-gu', 사하구: 'Saha-gu',
  고양시: 'Goyang', 과천시: 'Gwacheon', 구미시: 'Gumi', 군산시: 'Gunsan', 김포시: 'Gimpo', 김해시: 'Gimhae',
  부천시: 'Bucheon', 성남시: 'Seongnam', 세종시: 'Sejong', 수원시: 'Suwon', 시흥시: 'Siheung', 안산시: 'Ansan',
  안양시: 'Anyang', 용인시: 'Yongin', 의왕시: 'Uiwang', 춘천시: 'Chuncheon', 파주시: 'Paju', 포항시: 'Pohang',
  하남시: 'Hanam', 해남군: 'Haenam-gun', 화성시: 'Hwaseong',
}

export const sidoT = (s, en) => (en && s ? SIDO_EN[s] ?? s : s)
export const sigunguT = (s, en) => (en && s ? SIGUNGU_EN[s] ?? s : s)
/** 「경기 안양시」 → 「Anyang, Gyeonggi」 (EN은 작은 단위 먼저) */
export function placeT(sido, sigungu, en) {
  if (!en) return `${sido ?? ''}${sigungu ? ` ${sigungu}` : ''}`.trim()
  const a = sigungu ? sigunguT(sigungu, true) : ''
  const b = sidoT(sido, true) ?? ''
  return a && a !== b ? `${a}, ${b}` : b
}
export const facilityName = (f, en) => (en && f?.name_en ? f.name_en : f?.name)

/** 시설 유형 */
export const TYPE_EN = { 코로케이션: 'Colocation', 클라우드: 'Cloud', 'AI 특화': 'AI-specialized', 엔터프라이즈: 'Enterprise', 금융: 'Finance' }
export const typeT = (t, en) => (en && t ? TYPE_EN[t] ?? t : t)

/** 「서울 용산구」처럼 시도+시군구가 한 문자열로 붙은 키 → EN 「Yongsan-gu, Seoul」 */
export function placeKeyT(key, en) {
  if (!en || !key) return key
  const [sido, ...rest] = String(key).trim().split(/\s+/)
  return SIDO_EN[sido] ? placeT(sido, rest.join(' ') || null, true) : key
}

/** 한전 지역본부명(「대전세종충남」「남서울」 등) → EN. '·'·'+'로 이어진 묶음도 처리. 시도는 사전, 그 외 본부명은 별도 표. */
const HQ_EN = {
  남서울: 'South Seoul', 경기북부: 'N. Gyeonggi', 경기남부: 'S. Gyeonggi',
  대전세종충남: 'Daejeon·Sejong·Chungnam', 광주전남: 'Gwangju·Jeonnam', 부산울산: 'Busan·Ulsan',
}
export function regionT(r, en) {
  if (!en || !r) return r
  return String(r).split(/[·+]/).map((x) => HQ_EN[x.trim()] ?? SIDO_EN[x.trim()] ?? x.trim()).join(' + ')
}

/** 기상청 평년값 관측소(climateIndex.js의 24개) */
export const STATION_EN = {
  대관령: 'Daegwallyeong', 홍천: 'Hongcheon', 춘천: 'Chuncheon', 충주: 'Chungju', 원주: 'Wonju', 안동: 'Andong',
  수원: 'Suwon', 서산: 'Seosan', 서울: 'Seoul', 인천: 'Incheon', 청주: 'Cheongju', 대전: 'Daejeon', 강릉: 'Gangneung',
  전주: 'Jeonju', 광주: 'Gwangju', 목포: 'Mokpo', 대구: 'Daegu', 포항: 'Pohang', 울산: 'Ulsan', 여수: 'Yeosu',
  창원: 'Changwon', 부산: 'Busan', 제주: 'Jeju', 서귀포: 'Seogwipo',
}
export const stationT = (s, en) => (en && s ? STATION_EN[s] ?? s : s)
