# 개발 반사신경 (DEV REFLEXES)

paperthin 스킬 팩(레포 루트 `.claude/skills/`, MIT — LilMGenius/paperthin)을 이 프로젝트의
개발 습관으로 번역한 문서. 스킬은 Claude Code 세션에서 `/스킬명`으로 직접 부르거나,
모델이 상황을 인식해 스스로 쓴다. 아래는 **우리 워크플로 어디에 어떤 반사신경을 쓰는지**의 매핑이다.

## 우리 파이프라인 × 반사신경 매핑

| 시점 | 반사신경 | 우리 프로젝트에서의 의미 |
|---|---|---|
| 요청을 받았을 때 | `readchk` `aim` | 지시 해석이 갈리면 진행 전에 진짜 분기 1개만 확인. 자료만 던져지면 의도를 역제안 |
| 계획을 세웠을 때 | `hate` `feynman` | "이 계획을 죽일 수 있는 반론 1개 + 최저가 검증"을 스스로 먼저. 결정 직후엔 설명 가능한지 자문 |
| 무언가 만들었을 때 | **`sip`** → `npm run qa` | **만들었으면 맛본다.** 커밋 전 `npm run qa`(빌드+아레나·프레스 스모크), 큰 변경은 `npm run qa -- --full`(모비 패널·퍼널까지) |
| 같은 숫자·정책이 여러 곳일 때 | `ssotize` | 가격·수수료·사은품은 상품 정책 단일 소스(engine.js·store 정책) — 화면마다 다른 숫자 금지. 흩어짐 발견 시 한 집으로 모으고 나머지는 참조 |
| 문서·코드가 누더기가 됐을 때 | `re0` `debloat` | 패치 위 패치 대신 깨끗한 v0로 재작성. 규칙은 못 줄여도 말은 줄인다 |
| 세션이 끊기고 다시 들어올 때 | `catchup` | 요약 신뢰 전에 라이브 상태(git log·docs·QA 리포트)로 컨텍스트 재구축 |
| 사이클이 끝났을 때 | `re0-memo` → 이 문서 하단 | 배운 것·안티패턴을 아래 로그에 적립 — 코드가 아니라 학습이 복리로 쌓이게 |
| 커밋·릴리스 | `re0-git` `re0-release` | git log만 읽어도 인수인계가 되는 커밋 메시지, 체크리스트 릴리스 |

## 이 프로젝트의 상시 규칙 (sip 대상)

> 아래 중 4가지는 이제 `.claude/hooks/guard.cjs`가 강제한다 — 문서가 아니라 차단이다.
> 무엇을 왜 막는지는 `docs/BASH_GUARD.md`. 항상 로드되는 짧은 규칙 팩은 `moduon/CLAUDE.md`.

- 커밋 전: `cd moduon && npm run qa` — 실패면 커밋 금지 **(훅이 강제)**
- zip 전달 전: 시크릿 스캔(배포 토큰·Anthropic API 키 패턴, docx·바이너리 제외) CLEAN 확인 — 패턴 리터럴을 문서에 적으면 스캔이 자기 자신을 오탐하므로 여기 안 적는다
- 금지어: 구 수익모델 "870만원"(현행 747만), 케이웨더 외 기상 출처(루트 앱), 시크릿 echo

## 축적 교훈 로그 (re0-memo)

> 실패가 가르친 것만 적는다. 새 세션은 이 목록을 먼저 읽는다.

- **인텐트 라우터는 greedy 매칭 순서가 전부다** — localBrain에서 '월/얼마' 견적 브랜치가 이사·분양 질문을 선점했다. 구체적 인텐트를 항상 일반 인텐트 앞에 배치하고, 페르소나 QA 하네스로 회귀를 잡는다.
- **모달 하단 붙음 버그** — `.safe-b`(env inset=0)가 p-6를 덮었다. 공통 컴포넌트의 패딩은 `pb-[max(1.5rem,env(safe-area-inset-bottom))]` 패턴으로.
- **Playwright는 글로벌 설치본 우선** — 로컬 node_modules 브라우저 빌드 불일치 → `/opt/node22/lib/node_modules/playwright` 먼저 require.
- **`text=문구` 로케이터는 substring 함정** — "신청 완료!"가 헤더 "30초면 신청 완료!"에 매칭. `:text-is()` 또는 innerText 추출 후 JS 비교.
- **스테일 vite preview는 빈 페이지·무오류** — 스모크 전 pkill 후 재기동.
- **`pkill -f "vite preview"`는 자기 자신을 죽인다** — 패턴이 이 명령줄 자체에 매칭돼
  셸이 먼저 죽는다(exit 144). 이 세션에서 두 번 당했다. 대괄호로 자기매칭을 끊을 것:
  `pkill -f "vite prev[i]ew"`. **(훅이 강제)**
  **변종:** 대괄호는 패턴 자신만 지킨다. 같은 명령 안의 *다른 줄*에 평문 `vite preview`(서버 기동)가 있으면
  그 평문에 매칭돼 역시 셸이 죽는다. pkill 과 서버 기동은 같은 명령에 두지 말거나,
  기동 문자열을 `printf 'npx vite %s' preview` 처럼 조립해 평문이 명령줄에 안 나타나게 할 것.
- **이 컨테이너의 LibreOffice docx 변환은 전면 고장** — 정상 파일도 실패. 문서 검증은 python-docx 전수 검사로 대체.
- **이미지 붙여넣기는 파일로 도달하지 않는다(vision-only)** — 로고·에셋 파일이 필요하면 docx/zip 첨부 또는 지정 경로 저장을 요청.
- **compound 명령은 classifier가 끊을 수 있다** — add/commit/push/zip/scan은 분리 실행이 안전.
- **커밋 메시지의 괄호가 커밋을 조용히 죽인다** — 셸 파싱이 깨지는데 에러가 안 보인다.
  메시지는 파일에 쓰고 `git commit -F`로 넘긴다. **(훅이 강제)**
- **훅 설정 파일은 에이전트가 못 쓴다** — `.claude/settings.json`은 자동 명령 실행을 켜는
  파일이라 Bash·Write 양쪽 다 분류기가 막는다. 정당한 안전장치이므로 우회하지 말고,
  스니펫을 문서에 두고 사람이 붙이게 한다.
- **외부 스택을 흡수할 땐 인벤토리가 아니라 구조를 본다** — ECC(68 에이전트·286 스킬)에서
  실제로 취한 건 두 칸뿐이다: 자동 로드되는 규칙 팩과 강제 훅. 나머지는 우리에게 없는
  스택(Django·Laravel·Quarkus·Rust·Swift…)의 팩이거나, `npm run qa`로 이미 구현된
  검증 루프의 추상화였다. 저자 본인도 "286개를 한 번에 설치하지 말라"고 적어 뒀다.
- **루트에서 npm run build 금지** — 반드시 `moduon/`에서. (루트는 Next, moduon은 Vite) **(훅이 강제)**
- **아이콘 세트는 낱개로 고치면 절대 안 맞는다** — 정수기·생활/기타를 두 번 개별 재생성했지만 톤이 계속 어긋났다. 세트의 일관성은 "같은 프롬프트로 동시에 뽑았는가"에서 나온다. 손볼 일이 생기면 전량을 한 배치로 다시 뽑고, 프레이밍(오브젝트가 프레임의 몇 %를 차지하는지)까지 프롬프트에 못박을 것. 배경도 제거해 원형 배경색은 CSS 한 곳에서만 정한다.
- **한 컴포넌트를 데스크톱·모바일에 두 번 그리면 셀렉터가 두 개다** — 가격 카드를 sticky aside 와 lg:hidden 섹션에 같이 그렸더니 `data-t="card-total"`이 2개가 돼 Playwright strict mode 가 innerText 를 거부했다. 스모크는 부모(`[data-t="detail-card"] …`)로 스코프하고, 같은 data-t 를 두 곳에 두면 안 된다는 걸 기억할 것.
- **`aria-disabled="true"`는 Playwright 에게 "못 누른다"다** — 스펙이 "누르면 팝업"인 옵션에 시각적 비활성 + aria-disabled 를 같이 붙였더니 클릭이 30초 타임아웃. 눌려야 하는 것은 disabled 로 표시하지 않는다(접근성 의미도 그게 정직하다). 점선·title·팝업으로 충분.
- **`hasText: '문자열'`은 부분일치** — 'KT망'이 'SKT망'에도 걸려 strict mode 위반. 정확 일치는 `hasText: /^KT망$/`. (`text=문구` substring 함정과 같은 과다.)
- **`return (` 과 요소 사이에 `{/* */}` 주석은 문법 오류** — JSX 표현식이 형제 요소로 해석돼 esbuild 가 깨진다. 주석은 `return` 위에 `//` 로. 빌드가 깨지면 스모크는 *이전 dist* 로 돌아 같은 실패를 반복하므로, QA 요약의 "빌드" 줄을 먼저 본다.
- **extensionless import 라이브러리는 esbuild 로 번들해서 단위 검증** — `'./engine'` 은 Vite 규약이라 Node 가 못 푼다. `node_modules/.bin/esbuild test.mjs --bundle --format=esm --platform=node` 한 줄이면 lib 계층을 브라우저 없이 35항목 검증할 수 있다(하위호환 숫자 고정에 특히 유용).
- **옵션 상태는 숨겨도 남는다** — 유심 "보유"로 바꿔 유심종류 섹션을 숨겼는데 이전에 고른 eSIM 값이 남아 계속 차단됐다. 판정 로직이 "보이는 옵션만" 보게 하거나(`simOwn === 'none' &&`), 섹션을 숨길 때 값을 리셋할 것. 스모크가 잡았다.
- **Vercel의 `framework: vite` 프리셋은 `vite build`를 직접 실행한다** — npm 의 `prebuild`(에셋 다운로드)를
  건너뛰고, 프로젝트에 `NODE_ENV=production`이 있으면 devDeps 도 설치하지 않아 `vite: command not found`(127)로
  죽는다. 빌드 도구(vite·plugin-react·tailwind·postcss·autoprefixer·prebuild 의존성)는 **dependencies** 에 두고,
  `vercel.json` 에 `buildCommand: npm run build` 를 명시한다. 실패 조건은 `NODE_ENV=production npm ci --omit=dev`
  로 로컬에서 재현·검증할 수 있다.
- **Playwright 의 hover()·click() 은 마우스를 순간이동시킨다** — 호버로 열리는 메뉴가 "커서가 내려가는 동안"
  닫히는 버그(nav 글자와 패널 사이 47px 여백에서 mouseleave)를 절대 못 잡는다. 사용자 리포트로 알았다.
  호버 UI 는 `page.mouse.move(x, y, { steps: 25 })` 로 단계 이동한 뒤 요소가 살아있는지 단언할 것.
  구조적 처방: mouseleave 는 트리거와 패널을 **둘 다 DOM 자식으로 가진 조상**에 걸고, 트리거와 패널 사이
  틈은 투명 래퍼(pt-1)로 메운다.
- **Vercel 로그에서 "Installing dependencies..." 가 없으면 설치가 아예 안 된 것이다** — package.json 이 루트에
  있어도 대시보드 Install Command 오버라이드(빈 값)나 예전 폴더 재배포로 생긴다. 정상 로그는 반드시
  `Installing dependencies...` → `Running "npm run build"` 순서다. `Command "vite build"` 가 보이면 업로드된
  vercel.json 이 옛것이다. vercel.json 에 installCommand·buildCommand 를 둘 다 명시하면 대시보드를 이긴다.
  깨진 node_modules 가 빌드 캐시에 남으면 고쳐도 계속 죽으니 `vercel --prod --force` 로 캐시를 버린다.
- **배포 zip 의 최상위는 moduon/ 하나** — .claude 같은 두 번째 최상위 항목을 넣으면 압축 해제 폴더 구조가
  바뀌어 사용자의 배포 루틴이 어긋난다. 개발 훅은 git 에만 있으면 된다.
- **셸 cwd 는 호출 사이에 남았다가 예고 없이 루트로 리셋된다** — `npm run qa` 가 루트에서 돌면 "Missing script"
  인데 grep 필터에 삼켜져 출력이 그냥 비어 보였다. 이 컨테이너 셸 호출은 항상 `cd /home/user/weatherplan-ai/moduon &&`
  로 시작하고, 빈 출력은 통과가 아니라 의심 신호로 본다.
- **이미지 생성 배치는 일부가 조용히 실패한다** — 8건 중 3건이 에러 메시지 없이 failed. `jobs_wait`의 summary를 확인하고 실패분만 재제출하는 절차를 항상 넣을 것.
- **범위 치환(슬라이스 교체)으로 소스를 고치지 말 것** — `PARTNER_BASE`부터 `carImagePath`까지를 새 문자열로
  바꾸는 파이썬 한 줄이 그 사이에 있던 PARTNER_IMAGES 20건 + 생성기 마커 + MANUAL_IMAGES 를 통째로 지웠다.
  앵커 두 개 사이에 무엇이 들어있는지 눈으로 확인하지 않으면 슬라이스는 항상 이런 식으로 터진다.
  수정은 Edit(정확한 old_string) 이나 마커 사이만 다시 쓰는 생성기로. 복구는
  `git show HEAD:moduon/src/lib/cars.js` 로 했고, 커밋 전이었기에 살았다.
- **로컬에서 존재할 수 없는 것을 단언하지 말 것** — 파트너 CDN 이 이 컨테이너에서 막혀 있어 차량 사진은
  받아지지 않고 `onError` 로 SVG 폴백이 뜬다. `<img src>` 를 단언한 스모크는 배포에선 맞고 로컬에선 항상 실패했다.
  래퍼에 `data-kind`/`data-src` 를 심고 그것을 단언하면 "무엇을 그리려 했는가"를 파일 유무와 무관하게 검증할 수 있다.
- **외부 ID 는 접미사를 떼고 기본형으로 저장한다** — `00000000461_list` 를 그대로 넣으면 메인컷·상세컷 경로를
  만들 때마다 문자열을 되잘라야 한다. 저장은 `00000000461`, 조립은 `carImagePath(id, kind)` 한 곳에서.
