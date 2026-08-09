# 모두온 (MODUON) — 생활서비스 종합 플랫폼 v1.0

> **소비자몰 + 분양몰(멀티테넌트) + 파트너 마이오피스 + 본사 어드민 관제**, AI가 녹아있는 3면 통합 SaaS.
> 슬로건: *"판매를 시작하게 하는 플랫폼에서, 판매가 지속되게 하는 운영 시스템으로."*

| 화면 | 주소 | 설명 |
|---|---|---|
| 소비자몰 홈 (S-01) | `/` | 히어로 + 8 카테고리 + 혜택 + 신뢰 지표 + AI 상담봇 모비 |
| 카테고리 상세 (S-02) | `/category/internet` 등 | 상품·지원금 비교 (본사 중앙 관리 데이터) |
| 견적 계산기 (S-03) | `/calculator` | 인터넷 실시간 월 납부금 — 기본 상태 32,900원/사은품 35만원 (PRD 인수 기준) |
| 휴대폰 견적 계산기 | `/calculator/phone` | 주다식 단말 할부금(A)+요금(B)=월 납부(A+B) — 공시지원금 vs 선택약정 자동 비교, 연 5.9% 원리금균등 |
| 상담 신청 (S-04) | `/consult` | 30초 리드 폼 → 권역 자동 배정 → 완료 화면 |
| AI 생활비 진단 (C-05) | `/diagnosis` | 1분 문답 → 절감 추정 → 상담 유도 |
| 파트너 분양몰 | `/m/happynet` 등 | 파트너 브랜딩 적용 몰 — 여기서 신청한 리드는 해당 파트너로 직배정 |
| 분양 모집 랜딩 | `/partner` | "온라인 건물주 되기" — 정책값(분양비 100만/월 10만) 실시간 반영 |
| 분양 신청 (P-01) | `/partner/apply` | 소재지 → 권역 자동 판정 → 어드민 승인 큐 |
| 데모 로그인 | `/login` | 소비자 / 파트너(몰 선택) / 본사 관리자 원클릭 전환 |
| 마이오피스 (S-12) | `/office` | 리드 인박스(실시간) + 매일 정산 + 만기 D-day |
| 어드민 관제 (S-21~25) | `/admin` | 통합 대시보드 · 분양/상품/정책 · 리드 관제 · 정산 지급 · AI 운영 · 감사 로그 |

**끊김 없는 단일 파이프라인 데모**: 소비자몰에서 상담 신청 → `/login`에서 해당 권역 파트너로 로그인 → 마이오피스 인박스에 실시간 도착 → 상태 변경(완료) → 정산 대시보드·어드민 정산에 즉시 반영.

---

## 🚀 Vercel 배포 (3가지 방법)

### 방법 A — Vercel CLI (가장 빠름, 5분)
```bash
# 1) 압축 해제한 폴더에서
npm install -g vercel   # 최초 1회
vercel login            # 이메일/깃허브 로그인
vercel                  # 질문에 모두 Enter (기본값) → 미리보기 배포
vercel --prod           # 프로덕션 배포
```

### 방법 B — GitHub 연동 (추천, 자동 배포)
1. 이 폴더를 GitHub 새 저장소에 푸시
2. [vercel.com/new](https://vercel.com/new) → 저장소 Import
3. Framework Preset이 **Vite**로 자동 감지됨 → 그대로 **Deploy**

### 방법 C — 로컬 확인만
```bash
npm install
npm run dev   # http://localhost:5173
```

### 환경변수 (선택 — AI 상담봇 실연결)
Vercel 프로젝트 → **Settings → Environment Variables**:

| 이름 | 값 | 비고 |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` | 없으면 챗봇이 **데모 브레인**(규칙 기반)으로 자동 폴백 — 배포는 키 없이도 완전 동작 |
| `MODUON_CLAUDE_MODEL` | `claude-opus-5` (기본) | 비용 절감 시 `claude-haiku-4-5-20251001` |

> ⚠️ API 키는 절대 코드·클라이언트에 넣지 마세요. 서버리스 함수(`api/claude.js`)만 사용합니다.

---

## 🧱 기술 구조

```
moduon/
├── api/claude.js          # Vercel Function — Anthropic Messages API 프록시 (캐시 규약 준수)
├── vercel.json            # region icn1 · SPA rewrite · maxDuration 30s
├── scripts/fetch-assets.mjs # 빌드 전 브랜드 3D 에셋(17종) 자동 다운로드 → public/assets/
├── src/
│   ├── lib/
│   │   ├── constants.js   # 카테고리 8종·리드 상태 6단계·11개 영업단 권역·브랜딩 프리셋
│   │   ├── engine.js      # 견적 계산 · 정산 산식(매출−10%−이용료) · 리드 라우팅 · 마스킹
│   │   ├── seed.js        # 데모 시드 (테넌트 6·리드 15·계약·정책 v3·상품 16)
│   │   ├── store.jsx      # 단일 스토어 (Context+Reducer+localStorage) — Supabase 대체 지점
│   │   └── ai.js          # AI 상담봇 클라이언트 + 로컬 데모 브레인 + 생활비 진단
│   ├── components/        # 디자인 토큰 기반 UI 프리미티브 · 경량 차트 · 챗 위젯 · 리드 드로어
│   └── pages/             # consumer(6) · partner(2) · office(6) · admin(8) · login
└── tailwind.config.js     # 디자인 핸드오프 확정 팔레트 (#5377D6 · #F97B4C · 상태 6색)
```

- **스택**: React 19 · Vite 6 · Tailwind 3.4 · react-router 7 · @anthropic-ai/sdk (서버 전용)
- **디자인**: `design_handoff_moduon` 확정 토큰 — 트랙 A(웜 크림 커머스) / 트랙 B(쿨그레이 SaaS), Pretendard Variable, tabular-nums
- **데이터**: 데모는 localStorage(`moduon_db_v1`). `/login`에서 "데모 데이터 초기화" 가능
- **프로덕션 전환 지점**: `store.jsx`의 액션들을 Supabase(Postgres+RLS+Realtime) 호출로 교체 — 인터페이스 동일하게 설계됨

## 🎨 브랜드 에셋 (Higgsfield C4D 재제작본)

- 카테고리 아이콘 8종 · 신뢰지표 4종 · 혜택 오브제 3종 · CTA 캐릭터 · 히어로 씬(풀블리드) = **총 17종**을 C4D 소프트 3D 스타일로 재제작 (팔레트·배경색은 디자인 토큰과 1:1 일치)
- 에셋 원본은 CDN에 상시 호스팅되며, `npm run dev`/`npm run build` 직전에 `scripts/fetch-assets.mjs`가 **자동으로 `public/assets/`에 내려받아** 최종 배포물에는 자체 호스팅 정적 파일로 포함됩니다 (외부 의존 없음)
- 수동 실행: `npm run fetch-assets` · 이미 받은 파일은 건너뜀 · URL 목록은 `scripts/fetch-assets.mjs`에서 관리
- 다운로드가 막힌 네트워크에서는 경고만 남기고 빌드를 계속합니다 (레이아웃 정상, 이미지 영역만 비어 보임 — Vercel 빌드에서는 정상 포함)

## 📐 구현된 비즈니스 규칙 (PRD 매핑)

- **L-02 라우팅**: ①파트너몰 유입→해당 파트너 ②본진→주소지 권역(11개 영업단) 파트너 ③공석→관리단→본사 폴백
- **L-04 상태 머신**: `접수→상담대기→상담완료→개통대기→완료→취소` 단일 enum, 전환 이력 전수 기록, 취소 사유 필수
- **L-05 SLA**: 접수 10분 초과 경고 표시, 관제 콘솔 에스컬레이션 카운트
- **5.6 정산**: 순수익 = 몰 매출 − 수수료(10%) − 이용료(10만) → 1,000만 매출 시 890만 (파트너·어드민·CSV 3자 일치)
- **정책 단일 소스**: 분양비·이용료·수수료율 변경(v관리) 시 랜딩·신청·정산 즉시 반영
- **개인정보**: 주소 시·군·구까지만, 이름 `김*수`·연락처 `010-****-1234` 마스킹, 동의 분리 체크
- **법무 카피**: "AI 견적은 참고용…" / "수익 예시는 보장하지 않음" 상시 노출

## ⚠️ 데모 범위 메모

- 결제(PG)·알림톡 발송·Supabase 연동은 실서비스 단계 — 현재는 UI/파이프라인 시뮬레이션
- 어드민 대시보드의 규모 지표(총 1,248몰 등)는 목업 기준 데모 수치이며, 승인 큐·리드·정산·정책은 실데이터 연동
- 권역 매핑은 대표 시·군·구 42곳 — 전체 행정구역 테이블로 확장 필요
