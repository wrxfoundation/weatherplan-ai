# event-week — KBW2026 · XRP SEOUL 2026 연사 지도 (정적 · 잠금)

9/29 서우 — 「XRP SEOUL · KBW2026 둘 다 방대하고 보기 불편하니 html 로, 섹션 나눠서, vercel 배포형,
결이 같거나 전략상 필요한 회사 · 파트너는 색 표시 옵션 + 근거」.

- **보기(탭)**: 한눈에(날짜 카드 · 먼저 볼 것 시간순 · 선 목록 · 두 행사에 다 나오는 사람 · 읽는 법) · KBW 9/30 · KBW 10/1 ·
  XRP SEOUL 10/3(주최 블록 4개 · 회사 · 인물 설명) · 사람 찾기(두 행사 297명, 표시된 사람이 위로).
- **표시**: 결(우리 레인) · 전략(관계 · 자본 · 정책 · 미디어) · 선(규칙상 조심) · 우리 — 사람과 KBW 세션에 붙고, 근거가 같이 보인다.
- **옵션**: 색 칩(분류별 켜고 끄기) · 표시만 · 색 표시 · 근거 · 회사 · 인물 설명 · 검색. 설정은 주소(`?tab=&only=&color=&why=&desc=&cats=&q=`)에
  붙어 링크로 나눌 수 있고 기기에도 남는다.
- **내 표시**: 사람 옆 네모 = 결 → 전략 → 선 → 없음. 이 기기(localStorage)에만 저장, 「내보내기」로 JSON 복사 → 받으면 `tools/build.py` 에 반영.

## 잠금 — 서버 설정 없이

내용(판정 · 근거 · 소속)은 **비밀번호로 암호화된 채 HTML 에 들어 있다**(PBKDF2-SHA256 25만 회 → AES-256-GCM, 브라우저 WebCrypto 로 연다).
그래서 Vercel 드롭 · zip · 파일로 열기 모두 같은 방식으로 잠긴다 — 환경변수 · 미들웨어 · Deployment Protection 설정이 필요 없고 건드리지도 않는다.

- 비밀번호는 **저장소 · 로그 · 작업 일지에 없다**(서우에게 채팅으로만). 잃어버리면 새 비밀번호로 다시 빌드한다.
- `https://…/#k=비밀번호` 링크로 바로 열린다(해시는 서버로 가지 않고, 열리면 주소에서 지운다). 「이 기기에서 기억」 = localStorage,
  옵션 「이 기기에서 잠그기」로 지운다.
- 잠금 전 화면에 보이는 글자는 제목 · 안내뿐이다(내부 이름 · 판정 0 — 빌드 뒤 `grep` 으로 확인).

## 배포

`www/` 폴더 통째(Vercel 드롭 — 예: 새 프로젝트 `wellbian-event-week`). `vercel.json` = `noindex` · `no-store`.
전달 zip 은 `www/` 안 두 파일(index.html · vercel.json)을 루트에 둔다.

## 갱신

```bash
# 판정 · 소속 · 세션 → tools/build.py (ORG · PMARK · PNOTE · SMARK · XS_*)
# XRP SEOUL 설명 · 결 근거 → 저장소 루트 reports/XRP SEOUL 2026 연사 프로필.md
EVENT_PASS='…' python3 depin/site/event-week/tools/build.py          # → www/index.html (암호화)
python3 depin/site/event-week/tools/build.py --plain /tmp/x.html     # 평문 미리보기 — 배포 · 저장소 금지
```

빌드는 이름이 어긋나면 멈춘다(ORG · SMARK · XS_* 가 아젠다 · md 에 없으면 assert).

## 출처 등급 · 한계

- 소속 칸: 「수첩」 = 우리 판정 기록(`intel/business-directions.md` 「KBW 2026 연사 컨택 우선순위(9/10)」 · 텔레봇 인맥 수첩 9/21) ·
  표시 없음 = 9/29 검색 · 「추정」 = 알려진 정보라 재확인 전. **KBW 아젠다에 소속 · 무대 이름이 없어 빈 칸이 많다** — KBW 연사 페이지에서 확인.
- 설명은 검색 요약 기준 — 대외 인용 전 원출처. 이 페이지와 링크는 밖으로 돌리지 않는다.

## 검증(9/29, Playwright · Chromium)

잠금 화면 → 틀린 비밀번호 거절 → 맞는 비밀번호 열림 → 새로고침 기억 → `#k=` 링크(해시 지움) → 내 표시 저장 · 유지 → 표시만(9/30 18세션) →
색 끄기 → 검색(redstone 1세션) → 390px 가로 넘침 0 · `file://` 로 열림 · 콘솔 오류 0(서체 CDN 은 샌드박스에서만 막힘).
