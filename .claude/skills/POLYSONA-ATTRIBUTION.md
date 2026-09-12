# 출처 — polysona 선별 흡수 (2026-08-27)

원본: [LilMGenius/polysona](https://github.com/LilMGenius/polysona) v1.3.0 (MIT License,
`POLYSONA-LICENSE`) — 페르소나 추출 인터뷰 + 페르소나 조건부 콘텐츠 파이프라인 시스템
(스킬 8종 · 에이전트 5종 · 훅 · React 대시보드 앱 · 발표 덱 포함, 총 87파일).

## 흡수 형태 — 원문 2종성

1. **원문 그대로**: `persona-interview/references/`의 인터뷰 기법 문서 3종
   (mcadams-life-story · laddering-technique · clean-language) — 순수 방법론 프로즈.
2. **각색(adapted)**: 원본 스킬·에이전트는 자기 저장소 구조(`personas/_active.md`,
   `content/drafts/`, `!` 셸 프리로드)에 결박돼 있어 원문 설치 불가 → 패턴만 가져와
   이 repo 용으로 재작성:
   - `xqa/SKILL.md` ← virtual-follower 에이전트 (사전 QA: 오디언스 시뮬레이션 + 5차원
     채점 + 롤모델 갭). wellbian 적용: 발화 규칙 게이트를 최우선 단계로 추가, 오디언스
     프로필을 우리 실청중(XRPL 빌더·분석가·국내 커뮤니티·생태계 관계자·회의적 관찰자)으로
     교체, "최악 해석 1개" 출력 추가.
   - `persona-interview/SKILL.md` ← interview 스킬 (McAdams 워밍업 → 래더링 → 클린
     랭귀지 → GAP 표기 → append-only 로그). wellbian 적용: 인터뷰이 동의·PII 금지 원칙 추가,
     대상을 개인 페르소나에서 대표·팀·구매자 인터뷰 콘텐츠 준비로 전환.

## 제외 및 사유

- **파이프라인 스킬 6종** (content·trend·publish·status·export·introduce): 자기 폴더
  구조·PLOON 포맷 전제 + 우리 X 운영 체계(playbook 판단표·대기열·게시 프로토콜)와 중복.
- **에이전트** (profiler 386줄 10프레임워크·content-writer·trendsetter·admin): 개인 페르소나
  구축용 — 우리 브랜드 보이스는 playbook에 이미 문서화. 필요 시 references 3종으로 충분.
- **hooks 3종**: 무해(경고 출력뿐)하나 그들 저장소 경로 전제 — 우리 repo에선 오작동.
- **client/server 앱·덱·PLOON 라이브러리**: 그들 제품 구현체.
- **참고로 기록**: `nuance.md`의 플랫폼별 보이스 표(레지스터·훅 패턴·이모지 밀도) 구조는
  추후 멀티플랫폼(스레드·링크드인·블로그) 확장 시 우리 브랜드 보이스 문서의 골격 후보.
