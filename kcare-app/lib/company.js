// 사업자 정보 — 확정된 값만 적는다 (2026-11-10).
// null 인 칸은 화면에도 문서에도 나오지 않는다. 값을 채우면 서비스 소개 바닥글 · 이용약관 · 환불 정책 · 개인정보 처리방침에 같이 들어간다.
// 지어내지 않는다 — 사업자등록증 · 통신판매업 신고증 · 위치기반서비스사업 신고증에 적힌 그대로 옮긴다.
export const COMPANY = {
  name: "주식회사 케이케어",
  tel: "02-2135-7751",
  site: "www.kcarelife.com",
  ceo: null, // 대표자
  bizNo: null, // 사업자등록번호
  address: null, // 사업장 주소
  mailOrderNo: null, // 통신판매업 신고번호
  email: null, // 고객센터 전자우편
  privacyOfficer: null, // 개인정보 보호책임자 — "이름 (직책)". 비어 있으면 고객센터를 담당 부서로 적는다
  lbsNo: null, // 위치기반서비스사업 신고번호
};

// 바닥글 · 문서 끝에 붙는 줄 — 확정된 것만
export const companyLines = () =>
  [
    COMPANY.ceo && `대표 ${COMPANY.ceo}`,
    COMPANY.bizNo && `사업자등록번호 ${COMPANY.bizNo}`,
    COMPANY.mailOrderNo && `통신판매업 신고 ${COMPANY.mailOrderNo}`,
    COMPANY.address,
    COMPANY.email,
  ].filter(Boolean);

// 약관 3종 — 시행일과 검토 상태. reviewed 를 true 로 바꾸면 문서 위쪽의 '정식 판매 전 안내본' 표시가 사라진다.
export const LEGAL = {
  effective: "2026년 11월 30일", // 정식 판매 시작일에 맞췄다 — 날짜가 바뀌면 여기만 고친다
  reviewed: false, // 법률 검토와 사업자 정보 확인이 끝나면 true
  draftNote: "정식 판매 전 안내본입니다. 법률 검토와 사업자 정보 확인을 거쳐 확정합니다.",
};
