# docs/kcare — K-CARE 앱 기획·요구사항 문서

K-CARE(고령자 케어 플랫폼) 관련 기획 문서 모음입니다. K-CARE는 Weather Plan AI와 별개 제품이며,
전용 코드베이스가 만들어지기 전까지 요구사항 문서를 이 저장소에서 관리합니다.

## 구성

| 경로 | 내용 |
|---|---|
| `requirements-2026-07-meeting.md` | **메인 문서.** 2026-07 실무자 미팅 결정사항을 PRD v3.2·디자인 핸드오프·프로토타입과 교차 분석해 정리한 요구사항 (REQ-01~16) + 1차·2차·3차 개발 단계 분할 제안 + 미결 안건 |
| `meetings/2026-07-29-working-level-meeting.md` | 실무자 미팅 회의록 (카카오톡 스레드 구조화 정리) |
| `design-handoff/` | 디자인 핸드오프 번들 문서 사본 (README·도메인 규칙·핵심 역할 명세·화면 카탈로그·데이터 모델·디자인 토큰·repo-CLAUDE 시드) |

## 이 저장소에 포함하지 않은 원본

핸드오프 번들의 `reference/` 대용량 파일은 커밋하지 않았습니다 (공유 드라이브 원본 참조):
- `K-CARE 5역할 프로토타입.dc.html` (33화면, 9,486줄) · `K-CARE 투자 브리핑.dc.html` · `K-CARE 증빙 보고서.dc.html`
- `KCARE_PRD_v3.2.docx` (정본 PRD — `prd.txt` v2.0은 폐기 문서이므로 참조 금지)

## 읽는 순서

1. `design-handoff/01-domain-rules.md` — 규제 경계·절대 원칙 (구현 전 필독)
2. `requirements-2026-07-meeting.md` — 최신 결정사항과 단계 분할
3. `design-handoff/02-core-roles.md` — P0 화면 상세 명세
