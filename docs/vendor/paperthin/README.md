# paperthin — 출처와 관리

`.claude/skills/` 의 28개 스킬(aim·autobahn·catchup·debloat·dedash·detool·
factchk·feynman·hate·macrothink·mandela·modelchk·nba·prism·re0·re0-git·
re0-loop·re0-memo·re0-merge·re0-plan·re0-release·re0-upgrade·re0-work·
readchk·reorder·shower·sip·ssotize)는 이 저장소의 코드가 아니라
**LilMGenius/paperthin** 을 벤더링한 것이다.

- 출처: https://github.com/LilMGenius/paperthin (main 브랜치 zip)
- 반입: 2026-08-27, 사용자 업로드 zip 기준
- 라이선스: MIT — 이 폴더의 `LICENSE` 원문 유지. `NOTICE` 는 paperthin 이
  다시 벤더링한 상류(예: mattpocock/skills)의 저작권 고지라 같이 보존한다.

## 왜 저장소에 넣었나

Claude Code 원격 세션 컨테이너는 휘발성이라 글로벌 설치(`npx skills add`)가
세션마다 사라진다. `.claude/skills/` 에 커밋해 두면 이 저장소에서 여는 모든
세션(로컬·원격·팀원)에 자동 로드된다.

## 관리 규칙

- 이 스킬 파일들은 **수정하지 않는다** — 고칠 것이 있으면 상류에 내거나
  별도 이름의 자체 스킬을 만든다. 수정하는 순간 업그레이드가 병합이 된다.
- 업데이트는 `/re0-upgrade` 를 실행하면 카탈로그와 비교해 확인 후 갈아끼운다
  (이 벤더 사본을 다시 쓰는 작업이므로 결과를 커밋해야 남는다).
- 원본 zip 의 `scripts/`·`assets/`·`docs/` 는 설치 도우미와 README 자산이라
  반입하지 않았다. 스킬 본문(SKILL.md)만 가져왔다.
