# WELLBIAN 제품구매 랜딩 — 배포 패키지 (v0.1 내부 시안 빌드)

정적 사이트입니다. 빌드 과정이 없습니다. (사전신청 페이지 promo_package와 동일 방식)

## 1. Vercel 배포

**대시보드**: New Project → 이 폴더 업로드 → Framework Preset **Other** → Output Directory **`public`** → Deploy
**CLI**: `npx vercel --prod`

## 2. 로컬 미리보기
```
npx serve public
```

## 3. 구성
| 파일 | 내용 |
|---|---|
| public/index.html | 구매 페이지 `/` (S0 스티키 바 ~ S9 푸터 + 구매 모달 6스텝) |
| public/wave2.html | **2차 대기 페이지 `/wave2`** — 등록 폼(2필드)·내 현황(응모권/순번/초대 코드)·미션 자진 체크 9종(케이웨더 유튜브·인스타 포함)·S/A·B/일반 우선권 3카드·일정 타임라인·마감 카운트다운 |
| public/app-wave2.js | /wave2 데모 로직 (등록·미션 체크·초대 코드 복사·D-day) |
| public/assets.css | Basic_0825 브랜드 시스템 (Violet #4D4DCE · Navy #1B1B48 · Pretendard) |
| public/app.js | 카운터·리빌·스티키·구매 플로우 (전부 데모 로직) |
| public/img/device.webp | 공식 기기 렌더 (압축본) |

## 4. 배포 전 교체·연동 지점 (⚠ 전부 데모 상태)

| 항목 | 위치 | 현재 |
|---|---|---|
| **잔여 수량 (실데이터)** | `app.js` CONF.earlyLeft / baseLeft | 데모 값 184 / 3,126 — 서버 API 연동 필요 |
| /wave2 등록자 수·응모권·순번 | app-wave2.js CONF + 데모 상태 | 서버 연동 필요 (1차 wb.js 백엔드와 공통) |
| 지갑 연결·결제 서명 | app.js step2/step5 | 목 동작 (1.2초 후 성공) — 실제 지갑 SDK 연동 필요 |
| 이메일 인증 | app.js step3 | 코드 자동 입력 데모 |
| 로고 | index.html `.brand-mark` | 태양 마크 근사 SVG — **가이드 원본 SVG로 교체** |
| 인증 마크 | S3 스펙 표 | 텍스트만 — KC·성능인증 마크 이미지 교체 |
| 약관 4종 링크 | 푸터·모달 | `#` — 법무 확정본 연결 (8/27) |
| 사업자 정보 | 푸터 | 8/27 명문화 결과 반영 |
| X/텔레그램 링크 | 전역 | x.com/wellbianlabs · t.me/wellbianlabs (확인 필요) |
| 상세 가이드·전체 FAQ 링크 | S5/S7 | `#` — 페이지 공개 시 연결 |
| 상태 전환(S1 티저/S3 매진) | body[data-state] | S2 고정 — 상태별 화면은 후속 빌드 |
| 데모 배지 | 푸터 우하단 | 실배포 시 제거 |

## 5. 기획 근거
`depin/content/buy-page-spec.md` v1.0 (S0~S9 · 구매 6스텝 · 4,900대 표기 정책) —
웹 개편 기획서 v2.0의 판매 랜딩 파트 구현.
