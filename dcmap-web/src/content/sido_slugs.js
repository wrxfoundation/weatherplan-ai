// 시도 → URL 슬러그 매핑 (지역 랜딩 /region/[slug], SPEC §7)
// 순수 상수 모듈 — 프론트(src/data/regions.js)와 빌드 스크립트(scripts/postbuild.mjs)가 공유한다.
export const SIDO_SLUGS = {
  서울: 'seoul',
  경기: 'gyeonggi',
  인천: 'incheon',
  부산: 'busan',
  대구: 'daegu',
  대전: 'daejeon',
  울산: 'ulsan',
  광주: 'gwangju',
  세종: 'sejong',
  강원: 'gangwon',
  충북: 'chungbuk',
  충남: 'chungnam',
  경북: 'gyeongbuk',
  경남: 'gyeongnam',
  전북: 'jeonbuk',
  전남: 'jeonnam',
  제주: 'jeju',
}

export const SLUG_TO_SIDO = Object.fromEntries(Object.entries(SIDO_SLUGS).map(([k, v]) => [v, k]))
