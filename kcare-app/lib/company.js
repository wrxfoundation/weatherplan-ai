// 사업자 정보 — 확정된 값만 적는다 (2026-11-10 · 2026-11-17 사업자등록증명 반영).
// null 인 칸은 화면에도 문서에도 나오지 않는다. 값을 채우면 서비스 소개 바닥글 · 이용약관 · 환불규정 · 개인정보 처리방침 · 위치정보이용약관에 같이 들어간다.
// 지어내지 않는다 — 사업자등록증 · 통신판매업 신고증 · 위치기반서비스사업 신고증에 적힌 그대로 옮긴다.
//
// 어디서 온 값인가 (2026-11-17):
//   · name · ceo · bizNo · address   사업자등록증명 (국세청 발급 2026-11-13, 법인사업자) 에 적힌 그대로
//   · tel · email · privacyOfficer · lbsOfficer   회사가 보낸 개인정보 처리방침 · 위치정보이용약관의 '책임자 · 연락처' 칸
//   · mailOrderNo · lbsNo   받은 문서에 없다 — 신고증을 받으면 채운다 (비어 있는 동안 화면에 나오지 않는다)
// 서비스 이름은 K-CARE, 운영 법인은 주식회사 쿨롱이다.
export const COMPANY = {
  name: "주식회사 쿨롱",
  tel: "02-2135-7751",
  site: "www.kcarelife.com",
  ceo: "이재준", // 대표자 (단독대표)
  bizNo: "743-88-02587", // 사업자등록번호
  address: "경기도 고양시 덕양구 삼송로 222, 101동(판매시설)동 2층 249호(삼송동, 삼송역 현대 헤리엇)", // 사업장 소재지 — 증명서 표기 그대로
  mailOrderNo: null, // 통신판매업 신고번호
  email: "kdw@kcaremedi.com", // 고객센터 · 개인정보 문의 전자우편
  privacyOfficer: "이재준 / 대표이사", // 개인정보 보호책임자 — "성명 / 직책"
  lbsOfficer: "이재준 / 대표이사", // 위치정보 관리책임자 — "성명 / 직책"
  lbsNo: null, // 위치기반서비스사업 신고번호
};

// 대표 · 등록번호 · 신고번호 — 확정된 것만
export const companyIds = () =>
  [
    COMPANY.ceo && `대표 ${COMPANY.ceo}`,
    COMPANY.bizNo && `사업자등록번호 ${COMPANY.bizNo}`,
    COMPANY.mailOrderNo && `통신판매업 신고 ${COMPANY.mailOrderNo}`,
  ].filter(Boolean);
// 문서 끝에 붙는 줄 — 확정된 것만
export const companyLines = () => [...companyIds(), COMPANY.address, COMPANY.email].filter(Boolean);

// 약관 4종 — 시행일과 확정 상태. reviewed 를 true 로 바꾸면 문서 위쪽의 '정식 판매 전 안내본' 표시가 사라진다.
// 2026-11-17 본문은 회사가 보낸 문서로 바꿨다. 아직 남은 확인이 있어 안내본 표시는 둔다
// (통신판매업 신고번호 · 결제 대행사 · 서버 운영사 — docs/kcare/decisions/2026-11-17-legal-company.md).
export const LEGAL = {
  effective: "2026년 11월 30일", // 정식 판매 시작일에 맞췄다 — 날짜가 바뀌면 여기만 고친다
  reviewed: false, // 남은 확인이 끝나면 true
  draftNote: "정식 판매 전 안내본입니다. 남은 확인을 거쳐 시행일 전에 확정합니다.",
};
