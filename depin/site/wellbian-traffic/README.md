# wellbian 유입 — GA4 대시보드 (텔레봇에서 떼어 낸 사이트, 2026-09-26)

서우 9/26 「일자별 세션 소스 별로 보고싶은데 아니면 rawdata 다운로드 가능하게 해줄래」 →
「텔레봇 말고 그냥 스핀오프해서 하위 페이지 만들어서 배포하게끔 해줘」.

텔레봇(`../wellbian-telebot`)의 `/traffic`(9/8)을 떼어 따로 배포하는 Next.js 사이트다. 텔레봇 코드는
건드리지 않는다. 텔레봇의 `/traffic` 은 9/8 판 그대로 남아 있다(닫을지는 서우가 정한다 — 거기서 `TRAFFIC_PUBLIC=off`).

## 화면

| 주소 | 무엇 |
|---|---|
| `/` 개요 | 지난 30분 · 오늘 · 이번 주 · 런치 이후 → 일·주·월 누적 막대(채널 색) → 채널 비중 → utm_content · 캠페인 · 페이지 → 읽는 법. 텔레봇 `/traffic` 과 같은 본문이고 **AI 종합 코멘트만 없다**(Anthropic 키·KV 를 이 사이트에 들이지 않는다). |
| `/sources` 소스별 일자 | **세션 소스 × 날짜 표.** 줄 = 세션 소스(GA 화면과 같은 이름), 칸 = 그날 그 소스에서 시작된 세션. 일별/주별 · 소스 찾기 · 채널 칩 · 날짜 머리를 누르면 그날 많은 순 · 칸을 누르면 그날 전체에서의 몫. 소스·합계 열 고정, 처음엔 최근 날짜로 넘겨 둔다, 오늘 열은 점선(처리 지연). 원자료 내려받기 버튼. |
| `/export?t=…&f=…` | 내려받기(아래). |
| `/enter` | 잠금을 켰을 때만 쓰이는 키 확인. |

색: 채널 일곱 색은 텔레봇과 같다(색약 검증 순서, `lib/traffic.ts`). 표 칸은 남색 한 가지 5단(1–2 · 3–9 · 10–29 · 30–99 · 100+, 구간 고정).
검색엔진 색인은 막는다(`noindex` + `robots.txt`). 보이는 것은 GA 집계 숫자뿐 — 개인정보·예약자 수·매출은 없다.

## 배포 — 새 Vercel 프로젝트 하나

**A. 늘 하던 방식(zip → CLI)**

```
unzip wellbian-traffic-0926.zip && cd wellbian-traffic
npx vercel            # 처음 한 번: "Link to existing project?" → N, 이름 wellbian-traffic, 디렉터리 ./ 그대로
npx vercel env add GA_PROPERTY_ID production          # 아래 네 값 — 텔레봇 프로젝트에 들어 있는 값과 같다
npx vercel env add GA_OAUTH_CLIENT_ID production
npx vercel env add GA_OAUTH_CLIENT_SECRET production
npx vercel env add GA_OAUTH_REFRESH_TOKEN production
npx vercel --prod
```

**B. 저장소에서 가져오기** — Vercel › Add New › Project › 이 저장소 › **Root Directory `depin/site/wellbian-traffic`** ›
Environment Variables 에 아래 네 값 › Deploy. 이후 브랜치에 푸시하면 알아서 다시 배포된다.

어느 쪽이든 환경변수는 **저장만으로 반영되지 않는다** — 넣은 뒤 한 번 더 배포(Redeploy)해야 한다.
여는 주소는 **프로덕션 주소**(`…vercel.app`)다. 미리보기 주소는 팀의 Deployment Protection 에 따라 Vercel 로그인이 걸릴 수 있다.

| 변수 | 값 | |
|---|---|---|
| `GA_PROPERTY_ID` | GA4 속성 ID(숫자) | 필수 |
| `GA_OAUTH_CLIENT_ID` · `GA_OAUTH_CLIENT_SECRET` · `GA_OAUTH_REFRESH_TOKEN` | 텔레봇 프로젝트의 같은 이름 값 그대로(같은 GA 속성, 같은 `wellbian-ga` 클라이언트) | 필수(또는 아래 A) |
| `GA_SA_EMAIL` · `GA_SA_PRIVATE_KEY` | 서비스 계정 방식을 쓸 때만. 둘 다 있으면 OAuth 가 먼저 | 선택 |
| `GA_SINCE` | 개요의 집계 시작일. 기본 `2026-09-07` | 선택 |
| `GA_RAW_SINCE` | 소스별 일자·원자료의 조회 시작일. 기본 `2026-08-01`(9/26 서우가 GA 화면에서 본 기간) | 선택 |
| `TRAFFIC_KEY` | 넣으면 잠긴다 — 키를 한 번 넣으면 30일 쿠키(키가 아니라 해시를 담는다). `?k=키` 가 붙은 링크로 들어와도 열린다. 빼면 다시 열린다 | 선택 |
| `GA_FIXTURE` | 로컬 전용 `1` — GA 를 부르지 않고 가짜 자료로 그린다. **운영에 넣지 않는다** | 로컬 |

토큰·시크릿은 채팅·저장소·zip 에 넣지 않는다. 리프레시 토큰을 새로 받아야 하면 텔레봇 README 「GA4 유입 · 연결 절차 B」.
`vercel.json` 은 `icn1`(서울) 고정.

**배포 뒤 확인** — `/` 와 `/sources` 가 숫자로 뜨면 끝이다. 「GA4 가 아직 연결되지 않았습니다」면 변수가 빠진 것(비어 있는
변수 이름이 화면에 나온다). 「지금은 GA4 를 읽을 수 없습니다」면 Vercel › Logs 에 `[ga]` 로 원문이 남는다
(잠가 둔 사이트면 화면에 원문이 바로 보인다). 원문별 처방은 텔레봇 README 와 `lib/ga.ts` 의 403 안내가 같다.

## 데이터

- **개요**: 보고서 6개(실시간 · 합계 · 날짜×소스/매체 · utm_content · 캠페인 · 페이지), `GA_SINCE` 부터, 5분 캐시.
- **소스별 일자·원자료**: 보고서 1개(`gaSourceDaily`) — **날짜 × 소스 × 매체 × 캠페인** 한 줄에 세션 · 참여 세션 · 사용자 · 신규 ·
  이벤트 수 · 참여 시간 · 주요 이벤트 · 총수익(GA 「트래픽 획득」 표의 열 전부). 비율은 합에서 다시 계산한다. 5만 줄씩 넘겨 읽고,
  GA 가 주요 이벤트·수익을 400 으로 거부하면 그 둘을 빼고 다시 읽어 빈칸으로 둔다. 5분 캐시.
- 날짜별 합은 GA 화면 합계보다 조금 클 수 있다 — 자정을 넘긴 세션은 이틀에 한 번씩 센다(9/17 비교에서 +3.5%).
- **방문 한 건 한 건(이벤트 로그)은 API 로 나오지 않는다.** 필요하면 GA 관리 › 제품 링크 › BigQuery 링크 — 켠 날부터 쌓이고 소급되지 않는다.

**채널 판정**(`lib/traffic.ts`, 값은 `tools/traffic-check.mts` 가 고정) — 텔레봇 9/8 규칙에 9/26 수정 셋을 더했다.
KOL 링크 규약(`?promo=…&utm_source=핸들`)이 utm_medium 을 안 붙여 KOL 이 「기타 리퍼럴」로 새고 있었다 → 텔레그램 채널 22곳의 핸들
(`intel/kol-channels.md` §5) · 「이름-16진 네 자리」 프로모 코드 소스(PIXIE-F811) · `kol1`~`kolN` 을 KOL 로. 토스 결제창 복귀
(`payment-gateway.tosspayments.com`) · `accounts.google.*` · `localhost:*` 는 직접, `(data not available)` 은 출처 미확인.

## 내려받기 — `/export?t=…&f=csv|csv16|xlsx`

`t` = `daily` · `weekly` · `monthly`(채널을 열로) · `channels` · `sources` · `srcdaily`(소스×일자, 화면 표 그대로) · `raw`(원자료) ·
`content` · `campaigns` · `pages` · `all`(구역으로 나눈 한 파일). `f=xlsx` 는 표 전부를 시트 11장으로(**기본 추천** — 어디서 열어도 한글이 안 깨진다),
`f=csv16` 은 UTF-16LE + 탭(BOM 을 무시하는 프로그램용). CSV 는 UTF-8 BOM. 파일명은 ASCII(`wellbian-traffic-raw-20260926.csv`).
잠가 둔 사이트면 쿠키나 `?k=` 가 있어야 한다(없으면 404).

## 개발

```
npm install
GA_FIXTURE=1 npm run dev        # GA 없이 화면
npm run check                    # 채널 판정 · 묶기 · 소스×일자 · 원자료 · CSV/XLSX 값 고정
npm run build
```

`postcss.config.mjs` 는 빈 설정이다 — 없으면 Next 가 상위 저장소의 Tailwind 설정을 집어 와 빌드가 깨진다.

**검증(9/26)** — check · tsc · next build 통과. 9/17 원본(소스 × 날짜 120행)을 넣으면 표 합 1,939 = 9/17 기록과 일치.
GA_FIXTURE 로 1280 · 390 두 페이지 캡처(가로 넘침 0, 콘솔 오류 0 — 폰트 CDN 인증서 오류는 샌드박스 프록시 때문),
내보내기(원자료 · 표 · 전체 · xlsx 11시트 · UTF-16) 열어 확인, `TRAFFIC_KEY` 잠금(틀린 키 · 맞는 키 · `?k=` 링크 · 내보내기 404/200 ·
바깥 주소로 튕기기 차단 · 쿠키에 키 대신 해시) 확인. 실제 GA 호출은 배포 뒤 첫 화면에서 확인한다.
