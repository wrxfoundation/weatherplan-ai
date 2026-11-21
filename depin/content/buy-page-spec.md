# 제품구매 페이지 상세 기획 (GNB 1차)

**v1.0 (2026-08-25, 디자이너 미팅 후 착수)** — 상위 문서: 웹 개편 기획서 v2.0.
서우 요구 4점: ① 결제 = RLUSD ② X·텔레그램 상시 부착 ③ 제품 스펙·연동 안내·FAQ로 구매 경험이
페이지 안에서 완결 ④ 구매를 오롯이 경험하고 **배송 대기 상태로 안착**.

**v1.2 개정 (2026-08-27 저녁, 서우 확정)** — ① **1 구글 계정당 최대 100대** 구매 한도
② 제네시스 넘버 = **구매 확정 시** #1~5000 풀에서 수량만큼 무작위 배정(배정 시점 논점 해소 —
v1.1의 "확인 잔여 ②" 종결), 주문 내역에서 **오름차순 정렬 + 전체 복사** 지원 ③ **확인 2요소
전면 교체**: (구) 결제 지갑 주소 + 난수 주문번호 → (신) **랜덤 배정 제네시스 넘버 + 내 지갑
주소(구글 계정 가입 시 자동 생성되는 간편 지갑 — 비수탁, 약관 5조 정합)**. 주문번호(WB-…)는
내부 참조·URL 키로 강등 ④ 접수 폼 항목: 제네시스 넘버 · 내 지갑 주소 · 성함 · 연락처 · 배송지
(배송 후 파기 유지) ⑤ 파생: "회원가입 없음" 서술 폐기 — 구글 로그인 도입(개인정보 = 구글
로그인 외 무저장 프레임으로 전환). ⚠️ 잔여 확인 2: ⓐ 결제 흐름과 내부 지갑의 관계(내부 지갑
으로 결제까지 하는지, 외부 지갑 결제 병행인지 — 현 모달은 외부 지갑 연결 유지) ⓑ 구글폼
동의문·법무 문안에 구글 계정 수탁 구조 반영 필요(8/27 법무 안건 개인정보 항목 연동).

**v1.1 개정 (2026-08-27, 서우 확정)** — **제네시스 넘버 = NFT 무작위(랜덤) 배정, 총 5,000개
풀 안에서.** 결제 확정 순차 배정·티어별 넘버 구간(얼리버드 #0101~1000 / 기본 #1001~5000) 전제
전면 폐기 — 아래 본문의 구간 표기는 구판 흔적으로 함께 정정. 희소성 프레임 = "어떤 번호든
5,000개 한정 풀의 고유 번호"(수익 암시 금지 유지). ⚠️ 확인 잔여 1: 증정 100대(비공표)가 랜덤
풀에 포함되는지 / 별도 예약 후 4,900 풀 랜덤인지 — 대외 문구는 시점·풀 구성을 특정하지 않아
양쪽 모두와 정합.

## 0. 개요

| 항목 | 내용 |
|---|---|
| 진입 | 메인 GNB 「지금 구매하세요」 필 버튼 · 커뮤니티 직링크(리퍼럴 파라미터) |
| 목표 | 유입 → 결제 완료 3분 · 페이지 이탈 없는 완결 경험 → 배송 대기 안착 |
| **판매 수량** | **총 4,900대** — 얼리버드 900(450 RLUSD) + 기본 4,000(650 RLUSD). **증정 100대는 비공표 원칙 유지.** ~~티어별 넘버 구간(#0101~1000/#1001~5000)~~ → v1.1: 넘버는 티어 무관 **총 5,000개 풀 무작위 배정** |
| 슬로건 | Weather Data Economy / Turn Your Weather into Value (8/25 확정안) |
| 언어 | KO 기본 · EN 전환 |

## 1. 섹션 구성 (스크롤 순서)

**S0. 스티키 구매 바** — 스크롤 시 상단 고정(모바일 = 하단 고정 바): 잔여 수량 · 현재 가격 ·
[구매하기]. 페이지 어디서든 한 탭에 구매 진입.

**S1. 히어로**
- 제품 렌더(공식 투명 PNG) + 슬로건 + 한 줄 소개.
- **잔여 카운터(실데이터)**: 진행 바 + "총 4,900대 한정". 얼리버드/기본 이원 표시(아래 S2).
- 주 CTA: **[지금 구매하기 · RLUSD]** (Violet 채움). 보조: X·텔레그램 아이콘 버튼(부착 위치 1/3).

**S2. 가격·수량 블록**
- 2카드: 얼리버드 450 RLUSD(잔여 n) / 기본 650 RLUSD(잔여 n). (v1.1: 넘버 구간 표기 제거 — 무작위 배정)
- **얼리버드 소진 임박이 보이는 구조** = 마중물 심리의 엔진. 소진 시 카드 자동 딤 + "얼리버드
  마감" 뱃지, 가격 자동 전환.
- 제네시스 넘버 안내: "총 5,000대 한정 수량 안에서 무작위로 배정되며 라이선스 NFT에 영구 기록"
  (v1.1 개정. 수익 암시 금지 — 희소성은 "5,000개 한정 풀의 고유 번호" 사실만).

**S3. 제품 스펙**
- 표: 측정 항목(CO₂·미세먼지·온습도 등 실제 스펙 기준) · 크기/무게 · 전원(12V, 월 전기료 "1,000원
  미만" 사실 서술) · 무선(Wi-Fi 2.4/5GHz) · 설치(벽걸이·탁상).
- 법정 표기 형식 준수: 「제품명: 날씨데이터토큰생성기™ (실내공기측정기) / 모델명: ARC-600DA」
  두 줄 분리 + KC·성능인증 마크.

**S4. 작동 원리 3단계** — 측정 → 검증 → 보상(WLBN). 인포그래픽 1장. 보상 서술은 원칙 언어만
("좋은 데이터를 꾸준히 보내는 노드가 더 받습니다" — FAQ Q13 톤).

**S5. 연동 안내 프리뷰 ("도착 후 3분이면 노드가 됩니다")**
- 목적: **구매 전 불안 제거** — "어려울까 봐"가 최대 이탈 사유. 등록이 쉽다는 걸 구매 전에 미리 보여줌.
- 5스텝 시각화(카드): 리딤카드 QR → 지갑 연결 → 코드 입력 → 라이선스 NFT 발급 → Wi-Fi 연결.
- "지갑이 처음이어도 됩니다 — 등록 지갑 활성화(1 XRP)는 1회 지원" 안심 라인(약관 제5조 근거).
- [상세 연동 가이드 보기] 링크(가이드 문서/메인 온보딩 안내 페이지).

**S6. RLUSD 준비 안내 ("RLUSD가 없다면")**
- 결제 이탈 방지 핵심 섹션. 3단계 요약: 국내 거래소에서 원화로 RLUSD 구매 → XRPL 네트워크로
  내 지갑에 출금 → 이 페이지에서 결제. (거래소 실명 표기 여부는 정책 확인 — FAQ Q3은 "국내/해외
  거래소" 일반화 채택했음. ⚠️ **출금 시 반드시 XRPL판 선택** 경고 포함.)
- RLUSD 소개 1줄: 달러 1:1 연동, NYDFS 규제 하 리플 발행(FAQ Q2 재사용).
- [RLUSD 구매 가이드 전체 보기] 링크.

**S7. FAQ 발췌 (아코디언 8문항)**
- Q1 가격 · Q3 RLUSD 어디서 · Q5 환불(7일+제한 사유 — 법정 사전표시 겸함) · Q7 설치 준비물 ·
  Q10 지갑 활성화 XRP · Q13 보상 원칙 · Q17 전기료 · Q20 보증 1년.
- [전체 FAQ 23문항 보기] 링크. (약관 사전표시 의무의 웹 노출 지점 중 하나)

**S8. 커뮤니티 블록 (부착 위치 2/3)**
- "구매 전 궁금한 건 텔레그램에서 바로 물어보세요" — [텔레그램 입장] 대형 버튼.
- X 최신 게시물 고정 카드 2~3개(임베드 or 수동 큐레이션) + [X 팔로우] 버튼.
- 라이브 소셜 증거 역할 — 계정이 활발히 운영 중임이 구매 신뢰로 직결.

**S9. 신뢰·푸터** — 파트너 표기(8/27 종속) · 인증 마크 · 이용약관 · 환불 약관 · 개인정보처리방침 ·
이용자 보호 센터 · 사업자 정보(통신판매 표시 의무 항목 — 법무 확인분).

## 2. 구매 플로우 (CTA 클릭 → 스텝 UI, 모달 또는 전용 페이지)

```
① 수량 선택 — 지갑당 제한 N(미결정, §5-2) · "제네시스 넘버는 5,000대 안에서 무작위 배정" 안내 (v1.1)
② 지갑 연결 — 간편 웹3 지갑 / D'CENT 인앱 자동 감지.
   지갑 없음 분기: [3분 만에 지갑 만들기] → 간편지갑 생성(시드 백업 안내 필수) → 복귀
③ 배송 정보 — 수령인·주소·연락처 + 이메일 인증(코드).
   최소 수집 고지 문구 노출: "수집은 배송에 필요한 4가지뿐입니다"
④ 약관 동의 — 개별 체크 2개: 환불 제한 사유 고지 확인(리딤코드 사용·노드 연동 시 제한 —
   전자상거래법 제17조 제6항 사전표시) / 이용약관·개인정보 동의
⑤ 결제 (RLUSD)
   A(기본): 연결 지갑에 Payment 서명 요청 — 금액·주소·Destination Tag(주문번호) 자동 구성
   B(폴백): 주소+태그 표시 수동 송금 — "거래소에서 직접 보낼 땐 태그 누락 주의" 경고
   공통: 재고 홀드 타이머 표시(예: 20분 카운트다운) · 트러스트라인 자동 점검 → 없으면 설정 유도 ·
   금액 불일치/타임아웃 처리(부족분 안내·초과분 반환 절차·홀드 해제)
⑥ 완료 = 배송 대기 화면 (아래 §3)
```

## 3. 완료 = "배송 대기" 화면 (서우 요구 ④의 답)

구매 경험의 마침표이자 커뮤니티 합류의 시작점 — 결제 직후 감정(설렘)이 가장 높은 순간에 다음
행동 3개를 배치.

- **헤드**: "제네시스 넘버 #1234가 배정되었습니다" + 주문번호 · 결제 트랜잭션 해시(익스플로러
  링크) · 예상 배송 안내.
- **상태 타임라인**: 결제 확인 ✓ → 배송 준비 → 발송(송장) → 완료 — 재방문(주문 조회) 시 같은
  화면이 진행 상태를 보여줌.
- **"기다리는 동안" 3버튼 (부착 위치 3/3)**: [X 팔로우] · [텔레그램 입장] · [연동 가이드
  미리보기] — 배송 대기 기간(수일)을 커뮤니티 체류 기간으로 전환.
- 확인 이메일 동시 발송: 주문 요약 + 등록 안내 링크 + "리딤코드는 박스 안 카드에 있습니다" 예고.
- 환불 창 안내 1줄: "수령일부터 7일 이내 환불 가능(리딤코드 사용 전)" — 주문 조회에 카운트다운.

## 4. 상태·엣지 케이스

- 얼리버드 소진: S2 카드 전환 + 상단 배너 1회 노출("얼리버드 마감 — 기본가 650 RLUSD").
- 완판: 전 섹션 유지 + 구매 CTA만 「2차 대기 등록」으로 전환(별도 기획 §7 대기페이지 연결).
- 결제 중 이탈/실패: 홀드 만료 시 재고 반환 + 재시도 안내 이메일(선택).
- 주문 조회 재진입: 지갑 연결 or 이메일+주문번호.

## 5. 확인 필요 (이 페이지 한정)

| # | 항목 | 담당 |
|---|---|---|
| 1 | 지갑당 구매 수량 제한 N (기본안: 2~5 사이 — 독점 방지 vs 다구매 수요) | 서우 |
| 2 | 제품 스펙 표 확정값(측정 항목·정확도 표기 범위 — 인증서 기준) | HW·서우 |
| 3 | S6 거래소 실명 표기 여부(FAQ Q3 일반화 채택과 통일 권장) | 서우·법무 |
| 4 | X 피드 임베드 방식(공식 위젯 vs 수동 카드 — 위젯은 로딩·추적 이슈) | 개발 |
| 5 | 재고 홀드 시간(제안 20분) · 초과 송금 반환 절차 | 개발·CS |
| 6 | 예상 배송 문구("결제 후 N일 내 발송") — 물류 일정 확정 후 | 서우 |

## 6-A. 웹 목업 이미지 프롬프트 (8/25 — 레이아웃·무드 시안용)

원칙: 생성 텍스트는 반드시 깨지므로 **전 텍스트 = 회색 플레이스홀더 바 강제**(글자·숫자·로고
생성 금지). 제품은 첨부 레퍼런스 원본 복제. 용도 = 디자이너·내부 공유용 방향 시안(실카피·로고는
실구현/후보정).

**A. 데스크톱 히어로 (기본, 16:9 — 제품 이미지 첨부)**

```
Premium e-commerce landing page UI design mockup, shown inside a
clean desktop browser window, light theme. Background near-white
with a very subtle lavender tint (#ededfa). Top navigation bar:
minimal, small abstract logo placeholder at left, a few grey menu
placeholder bars, and one rounded pill button filled in vivid
blue-violet (#4d4dce) placed at the front of the menu. Hero section:
on the left, bold dark navy headline placeholder bars (#1b1b48) of
varying width, a thin subtitle bar, a large blue-violet CTA pill,
and a slim horizontal progress bar about one-third filled in violet
with tiny placeholder tick bars. On the right, the attached product
photo on a soft pedestal with a gentle violet glow and soft shadow —
reproduce the attached device exactly, do not redesign it. Below the
fold, a hint of the next section: two pricing cards side by side,
one with a violet outline highlight, both with placeholder text bars
and a small badge shape. All text rendered as clean grey placeholder
bars only — no readable words, no letters, no numbers, no real
logos. Generous white space, soft rounded corners, subtle
glassmorphism on cards, modern fintech premium aesthetic, crisp UI
design portfolio quality, 16:9
```

**B. 풀페이지 스크롤 목업 (완전판, 9:16 — 잘리면 3:4로)**

```
Premium e-commerce landing page UI design mockup, a tall full-page
scroll view of one website laid out top to bottom as a single flat
design sheet, light theme. Background near-white with a very subtle
lavender tint (#ededfa); accent used sparingly: vivid blue-violet
(#4d4dce) for buttons and highlights, dark navy (#1b1b48) for
placeholder headline bars. From top to bottom:
(1) minimal navigation bar with a small abstract logo placeholder,
grey menu bars and one violet pill button at the front;
(2) hero — bold navy headline placeholder bars, a violet CTA pill,
a slim violet progress bar about one-third filled, and the attached
product photo on a soft glowing pedestal at the right — reproduce
the attached device exactly, do not redesign it;
(3) two pricing cards side by side, the left one with a violet
outline highlight and a small badge shape;
(4) a specification block: a clean table of thin grey placeholder
rows with a small product thumbnail;
(5) a horizontal 5-step stepper with small rounded icon circles
connected by a thin line;
(6) three stacked accordion rows with chevron marks;
(7) a community block with two small social-post cards and one
violet outline button;
(8) a dark navy footer band with three columns of placeholder bars.
All text rendered as clean grey placeholder bars only — no readable
words, no letters, no numbers, no real logos. Generous white space,
soft rounded corners, subtle glassmorphism on cards, modern fintech
premium aesthetic, crisp UI design portfolio quality, tall vertical
composition, 9:16
```

- B 전용 리롤: ① 섹션 6개 미만 병합·중복 생성 시 리롤(세로 구도 흔한 실패) ② 제품 사진은
  히어로 1회만(스펙 썸네일 허용) — 반복 등장 시 리롤.

**C. 모바일 (9:16)** — 하단 스티키 구매 바 포함:

```
...same style... A single mobile screen mockup, narrow 9:16: compact
top bar with violet pill, hero with the attached product photo and
violet progress bar, one pricing card, and a sticky bottom purchase
bar with a full-width blue-violet CTA pill. All text as grey
placeholder bars, no readable words, no logos, 9:16
```

- 리롤 기준: ① 읽을 수 있는 글자/숫자/로고가 생기면 리롤(플레이스홀더 강제 실패) ② 제품이
  레퍼런스와 다르게 재설계되면 리롤 ③ 바이올렛이 배경까지 번지면 리롤(CTA·포인트에만) ④ 다크
  테마로 뒤집히면 리롤(라이트가 기본).

## 6. 수량 표기 정책 (내부 메모)

- 대외 = "총 4,900대 한정"만. 증정 100대(#0001~0100) 비공표 원칙 유지(8/22 확정).
- 넘버가 #0101부터 시작하는 점은 화면에서 설명하지 않음. 문의 유입 시 CS 응대 기준은 CS 매뉴얼
  작성 시 포함(기존 대기 항목).

## 7. v1.3 개정 노트 (8/27 밤 — 가격·수량 표기 대개정, 서우 확정)

스토어 데모 반영 완료(커밋 기준). 플랫폼개발 실구현·법무 문안에 그대로 적용할 것.

- **얼리버드 폐지**: 450 RLUSD 티어·"얼리버드" 표기 전면 삭제. **대외 가격 = 대당 650 RLUSD
  단일가**(히어로 "대당 650 RLUSD" · 가격 카드 1장 "판매가 650" · 모달 "650 RLUSD / 대" ·
  FAQ "대당 650 RLUSD입니다"). eb_closed 상태·마감 배너·EB 게이지 등 부속 UI 제거.
- **수량 표기**: 잔여·총량·%·게이지 전부 비공개, 카드에 "수량은 오픈 임박 시 공개됩니다" 한 줄.
  §6의 "총 4,900대 한정" 표기는 **폐기**(8/27 "5,000대 한정 두지 말자" + 트랜치 수량 제거로
  대체). 증정 100대 비공표·#0101 시작 비설명 원칙은 유지.
- **판매 현황 표기**: 판매 기간 대외 지표는 "판매 N대"(판매 대수)만. 잔여 대수 표기 금지.
- **히어로 CTA 열**: [사전예약하기] 옆 [링크 복사] → [X] → [텔레그램] 순(판매 화면도 동일).
  링크 복사 = 사이트 루트 URL 클립보드 복사 + 1.6초 체크 피드백.
