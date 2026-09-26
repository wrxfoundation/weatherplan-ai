# XRPL 생태계 조직 채널 지도 — 기관·프로그램·행사·매체·네이티브 프로젝트·커뮤니티 (기준일 2026-09-26)

출처 등급 표기 — **[1차]** 공식 문서·조직 GitHub·주최 측 자료를 직접 열람 / **[검색요약]** 웹 검색 결과 요약으로만 확인(원문은 네트워크 프록시 차단으로 미열람 — 문구·수치 재확인 필요) / **[벤더 주장]** 해당 기업의 자기 서술 / **unverified (aggregator)** 집계·재배포 사이트 경유 수치 / **⚠오래됨** 2025-09-26 이전 정보(12개월 초과).
조사 여건 — 이번 세션 WebFetch는 github.com 외 거의 모든 도메인이 EGRESS_BLOCKED(xrpl.org, xrpl-commons.org, ripple.com, xrplgrants.org, xrplkorea.org, xrpl.jp, xrp-seoul.com, token2049.com, medium.com, 국내 언론사 등 — 우회·재시도하지 않음). 웹 검색은 세션 한도(200회) 소진으로 17회만 수행했다. 대신 xrpl.org 사이트 소스 저장소(XRPLF/xrpl-dev-portal, 2026-09-25 커밋)·XRPL-Standards·XRPLF·XRPL Commons·xrplevm·Flare·BIS 공식 GitHub 저장소를 1차 자료로 직접 읽었다. 탐색기(XRPScan·Bithomp) 1차 트랙션 수치는 확인하지 못했다.

## 1. XRPL Foundation·XRPL Commons·그랜트/액셀러레이터·지역 허브는 2026년에 무엇을 제공하며, DePIN·IoT·데이터·환경 프로젝트를 지원한 적이 있는가?

### Takeaway
2026년 XRPL 빌더 지원은 리플 중심 프로그램에서 "분산형"(독립 조직·지역 허브·커뮤니티 DAO)으로 옮겨 가는 중이다. 실제로 열려 있는 문은 XRPL Commons(교육·Aquarium·3트랙 그랜트·해커톤)와 지역 허브(XRPL Korea의 KFIP·XRP SEOUL, XRPL Japan의 XRP Tokyo)다. XRPL Foundation은 자금을 대는 곳이라기보다 인프라·거버넌스 기관(dUNL, xrpld 공동 릴리스, 코어 개발 교육)이다. 환경·데이터 쪽 지원 흔적(Filedgr 그랜트, Commons의 Regeneration·Social Impact 코호트, 해커톤 임팩트 바운티)은 있지만, DePIN·IoT 센서 네트워크를 지원한 공개 사례는 찾지 못했다.

### Cited Findings
**XRPL Foundation (XRPLF)**
- 새 XRPL Foundation은 2024-11-26 프랑스 1901년 법에 따른 비영리 협회 "XRP Ledger Foundation"으로 설립 신고됐다. 창립 멤버는 XRPL Commons·XRPL Labs·Ripple·XAO DAO(커뮤니티 DAO) 4곳이다. 이사회는 창립 멤버와 순환 이사로 구성되고, 준회원(Associate Member) 총회가 자문 역할을 하며, Membership·Audit·Infrastructure·Core Development·UNL 위원회를 둔다. 활동 영역에 "Empowering developers through resources and support", "Supporting sustainable development practices"가 명시돼 있다 ⚠오래됨 — [1차: xrpl.org 블로그 소스 2024-11-26](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2024/a-new-era-for-the-xrp-ledger.md)
- 2025-02-19 구 재단에서 신 재단으로 자산·UNL 이관을 시작했다 — [1차: xrpl.org 블로그 소스](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2025/move-to-the-new-xrpl-foundation-commences.md)
- 2025-09-18부터 기본 UNL(dUNL) 발행 주체가 신 재단으로 바뀌었고, 구 dUNL URL은 2025-09-30 종료됐다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2025/default-unl-migration.md)
- dUNL 원본은 공개 GitHub(XRPLF/unl)에서 PR로 관리된다. XRPLF UNL 팀 3인이 승인하면 서명되고, 매월 첫째 화요일 15:00 UTC에 반영된다. UNL 신청 가이드(초안)가 있다. 2026-08-21 기준 검증인은 35개(예: v2.xrpl-commons.org, ripple.com, validator.xrpl-labs.com, bithomp.com, xrpscan.com, 버클리 Haas·ANU·워털루·UNC·캔자스·니코시아 대학 등)이며, 한국·일본 운영 주체로 식별되는 이름은 없다 — [1차: XRPLF/unl readme](https://github.com/XRPLF/unl) · [unl-raw.yaml](https://github.com/XRPLF/unl/blob/main/data/unl-raw.yaml)
- 2026-02-11 XRPLF가 Brett Mollin을 Executive Director로 선임한다고 발표했다 — [검색요약: XRPLF X 게시물](https://x.com/XRPLF/status/2021644297079013736). 보도에 따르면 Brett Mollin은 직전까지 리플 Technical Director였다(**전 리플 직원**) — [검색요약: U.Today](https://u.today/xrpl-foundation-appoints-new-executive-director) · [MEXC News — unverified (aggregator)](https://www.mexc.com/news/692234). 2026-05-09자 "Appoints New Executive Director, CTO" 기사도 있으나 내용은 열람하지 못했다 — [The Crypto Basic](https://thecryptobasic.com/2026/05/09/xrp-ledger-foundation-appoints-new-executive-director-cto-in-big-life-update-for-xrp-holders/)
- XRPLF CTO Denis Angell이 2026-10-20~22 NYC "XRP Ledger Core Dev Bootcamp"(xrpld 코어 코드 3일 과정)를 진행한다 — [1차: xrpl.org 이벤트 목록 소스](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)
- xrpld 3.4.1(2026-09-25 긴급 릴리스)은 "built through the collaboration of RippleX Engineering and the XRP Ledger Foundation"이며, 패키지는 packages.xrplf.org에서 XRPLF 서명키로 배포된다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/xrpld-3.4.1.md)
- xrpl.org 커뮤니티 페이지가 안내하는 공식 채널: XRPL 개발자 Discord("The heart of XRPL developer conversation"), 월간 뉴스레터("Monthly updates on key projects, proposals, and events"), X @XRPLF, 이벤트 페이지, XRPL Learning Portal, 프로젝트 제출 창구 "XRPL Developer Reflections" — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/index.page.tsx)
- XRPLF 자체 그랜트 프로그램은 이번 조사에서 확인하지 못했다(Gaps 참조).

**리플 운영 프로그램 — 생태계 사실로만 기록(팀 규칙상 협력 경로로 제시하지 않음)**
- xrpl.org "Developer Funding" 페이지(2026-09-25 소스)는 세 축을 안내한다. ① "RippleX Ecosystem Programs"(→ xrplgrants.org): "Non-dilutive milestone- or incentive-based grants funding", "Technical mentorship and integration support to go live on XRPL", "Hackathons and builder competitions", "6-12 weeks global accelerator programs", "Ecosystem partnerships - co-marketing, distribution, and strategic alignment" ② UBRI: UDAX, Student Builder Residency, "60+ universities around the world" ③ XRPL Commons(7번 참조). 같은 페이지의 사례 팀은 LANTERN·SOIL·t54·BlockVault·LOBSTR다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/developer-funding.page.tsx)
- 2026-02-26 리플 발표: "Since 2017, more than $550M has been deployed into XRP Ledger ecosystem initiatives"[회사 주장]. 2026년에는 "more distributed model"로 옮겨 가 독립 조직·지역 허브·벤처·커뮤니티 주도 펀딩의 비중을 키운다. 신규로 XRPL 펀딩 허브, 기관급 금융 앱 대상 FinTech Builder Program, 커뮤니티 그랜트 제안·투표용 XAO DAO, UDAX 확대(UC Berkeley 2025 가을 첫 코호트 → 2026 FGV 상파울루·옥스퍼드·UC Berkeley)를 발표했다 — [검색요약: Ripple X 게시물](https://x.com/Ripple/status/2027032926529929505) · [ripple.com insights](https://ripple.com/insights/supporting-innovation-on-the-xrp-ledger/) · [CoinGape](https://coingape.com/xrp-news-ripple-unveils-funding-hub-to-support-innovation-on-xrpl/) · [BeInCrypto](https://beincrypto.com/ripple-xrpl-funding-expansion-2026-price-impact/)
- 리플은 2021년 이후 해커톤·빌더 바운티·XRPL Grants·XRPL Accelerator로 약 200개 프로젝트를 지원했고, 지원 분야에 "carbon markets"가 포함된다 — [검색요약: ripple.com insights](https://ripple.com/insights/supporting-innovation-on-the-xrp-ledger/)
- Tenity 사이트에 "XRPL Accelerator 2025" 프로그램 페이지가 있다(세부 내용은 미확인) — [검색요약](https://www.tenity.com/program/xrpl-accelerator-2025/)
- 리플의 "XRPL Japan and Korea Fund"(10억 XRP 약정의 일부, 2024-06 발표)는 ⚠오래됨 — [검색요약: ripple.com](https://ripple.com/insights/unveiling-new-ripple-fund-accelerating-innovation-on-the-xrp-ledger-in-japan-and-korea/) · [Mitrade 2024-06-12](https://www.mitrade.com/insights/news/live-news/article-3-208819-20240612). 일본 Web3 Salon과 제휴해 프로젝트당 최대 $200,000 그랜트를 준다는 보도가 있다(발표일 원문 미확인, ⚠오래됐을 가능성) — [검색요약: CryptoSlate](https://cryptoslate.com/ripple-boosts-japanese-startups-with-200000-xrp-ledger-xrpl-grants/). Girin Labs가 이 펀드에서 자금을 받았다(일자 미확인) — [검색요약: Newsfile](https://www.newsfilecorp.com/release/218310/Girin-Labs-Secures-Funding-from-the-XRP-Ledger-Japan-and-Korea-Ecosystem-Fund)

**XRPL Commons (파리)** — 상세는 7번
- xrpl.org는 XRPL Commons를 "The builder hub for XRPL: education, acceleration, and funding to launch and grow"로 소개한다. XRPL Academy(코어 개발 트랙 포함), Aquarium Residency, GLOW 보상 프로그램을 안내한다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/developer-funding.page.tsx)
- 2025-10에 3트랙 그랜트로 개편했다: ① Glow(완료된 오픈소스 기여 보상, 2025-10 이후 11개 프로젝트 지원, 2026-12까지 분기별 접수) ② 초기 팀(Make Waves 90일 경쟁, Aquarium, 테스트넷·메인넷에 라이브한 프로젝트 대상 마일스톤형 Early Stage Grants) ③ XRPL 인프라를 통합하는 기성 제품(예: 스텔라 지갑 LOBSTR) — [검색요약: Dealroom](https://app.dealroom.co/news/note/xrpl-commons-launches-three-track-grants-program-backing-a-550m-ecosystem) · [GNCrypto](https://www.gncrypto.news/news/xrpl-commons-grants-xrp-ledger-builders/) · [Bitcoin.com](https://news.bitcoin.com/xrpl-commons-unveils-new-grants-program-to-accelerate-xrp-ledger-builder-growth/)

**지역 허브 — 한국**
- XRPL Korea(엑스알피엘 코리아)는 "XRP Ledger 생태계의 국내 확장을 지원하는 커뮤니티"로, 개발자·창업자 대상 교육·액셀러레이션·해커톤을 제공한다. 공개 X 계정은 @xrplkorea다 — [검색요약: xrplkorea.org](https://xrplkorea.org/) · [X @xrplkorea](https://x.com/xrplkorea)
- XRP SEOUL 2026은 XRPL Korea가 주최하고 리플이 공식 후원(타이틀 스폰서)한다 — [검색요약: 전자신문 2026-07-13](https://www.etnews.com/20260713000247) · [네이트뉴스 2026-07-14](https://m.news.nate.com/view/20260714n30408). 2025년판도 "[리플 x XRPL Korea] XRP Seoul 2025"로 대학 게시판에 공지됐다 — [검색요약: 동국대 DVIC](https://dvic.dongguk.edu/dvic2_3/495) · [이벤터스 xrplkorea 페이지](https://event-us.kr/xrplkorea/event/109693)
- KFIP 2026(Korea Financial Innovation Program, program.xrplkorea.org): 참가팀 공개 문서에 따르면 1차 서류 마감 2026-05-17 23:59 KST, 본선 2026-06-25 Two IFC Seoul The Forum 3층(12팀 진출)이었다. 평가 rubric에는 "XRPL 고유 기능 9개" 활용 항목과 "현 규제 환경 단계적 접근" 기준이 있고, 상금 패키지에 법률자문이 포함됐다 — [참가팀 저장소 기재(개인 계정이라 URL 생략) · 프로그램 페이지는 미열람](https://program.xrplkorea.org/). 조직 계정의 참가 저장소 예: [TrillionScale/TransitX](https://github.com/TrillionScale/TransitX)("Built for Korea Financial Innovation Program 2026"), [VernaTech Vpay](https://github.com/Developer-Verna/VernaTech-vpay-xrpl-settlement) — [1차]
- 서울핀테크랩과 XRPL Korea가 "디지털자산 스타트업" 육성에 나서고 리플이 메인 스폰서로 참여한다는 보도(일자 미확인), XRPL Korea가 K-FI 2026으로 전통 금융기관·Web2 기업의 디지털자산 사업·투자를 지원한다는 설명이 있다 — [검색요약: KSPost](https://www.kspost.biz/en-us/articles/2417)
- 과거 이력 ⚠오래됨: 2023-09-06 "XRPL South Korea Meetup - XCCESS"(JBK Tower, KBW 기간), 2024-08-31~09-01 "XRP Ledger Hackathon Seoul 2024"(강남, "explore local funding initiatives"), 2024-09-04 "XRPL Zone Seoul"(성수) — [1차: xrpl.org 이벤트 소스](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx). "국내 최초 XRP 레저 밋업 열린다…카탈라이즈 리서치 주최" 기사 — [검색요약: 서울경제](https://m.sedaily.com/article/13753489). 같은 시기 Catalyze Research가 한국어 XRPL 자료 저장소를 만들었다(2023-07) — [1차: GitHub](https://github.com/Catalyze-Research/xrpl-korean)

**지역 허브 — 일본**
- 一般社団法人 XRPL Japan은 일본 내 XRPL 생태계 확대·활성화·채택 촉진을 목적으로 하는 일반사단법인이다 — [검색요약: xrpl.jp](https://xrpl.jp/). 2026-04 도쿄 핫포엔(八芳園)에서 XRP Tokyo 2026을 주최했고, Asia Web3 Alliance Japan이 운영 파트너였다 — [검색요약: iolite](https://iolite.net/en/magazine/vol20/asia-web3-alliance-japan-xrp-tokyo). TEAMZ SUMMIT 2026 참가 기업 목록에도 XRPL Japan이 있다 — [검색요약](https://www.teamz.co.jp/en/participant/xrpl)
- 과거 도쿄 이벤트 ⚠오래됨: 2023-06-25 XRPL BUIDLERS BOOTCAMP, 2023-07-26 XRPL Workshop at WebX Asia, 2024-09-06 XRP Community Day/Night Tokyo(시나가와) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)

**대학·개발자 프로그램**
- UBRI(60+ 대학), UDAX, Student Builder Residency — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/developer-funding.page.tsx)
- XRPL Commons의 2026 대학 워크숍 저장소: 리옹1대(1월), Bayes Business School(2월), 겔프대(3월), IE 마드리드(3월), 사우샘프턴대(5월), Nova SBE(6월). 2025-09-10 TUM XRPL Blockchain Day(뮌헨), 2026-06-16~17 Blockchain Research Summit(파리) — [1차: XRPL-Commons GitHub](https://github.com/XRPL-Commons) · [이벤트 소스](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)

**DePIN·IoT·데이터·환경 지원 흔적**
- Filedgr(데이터 인증, NFT 기반 디지털 인증서, 디지털 트윈 데이터 허브): "Filedgr's integration with XRPL was recognized with a developer grant". 농업·모빌리티 스핀오프를 계획했다 ⚠오래됨(2024-07-24) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2024/filedgr.md)
- xrpl.org "Uses" 페이지의 "Carbon Markets/Sustainability" 분류에는 Carbonland Trust 한 곳만 등재돼 있다(등재 시점 미상) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/about/uses.page.tsx)
- XRPL Commons 레지던시 Cohort 1 주제는 "Regeneration", Cohort 8은 "Social Impact"(2026-01-19~04-09, 파리)였다 — [검색요약: Cohort 1](https://www.xrpl-commons.org/residency-cohorts/regeneration) · [Cohort 8](https://www.xrpl-commons.org/residency-cohorts/social-impact). Demo Day #8 Social Impact는 2026-03-25였다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)
- Hack4Good 2025(ECE 파리, 테마 "Crypto for Good")의 예시 과제에 "Climate Resilience: blockchain-based climate data tracking, carbon credits, or decentralized energy projects"가 있다 — [1차](https://github.com/XRPL-Commons/2025-ECE-Hack4Good). Hack the Block 2026에는 "Impact Finance" 바운티("fight climate change" 등, Outstanding 1,500 EUR·Honors 1,000 EUR)가 있었다 — [1차](https://github.com/XRPL-Commons/2026-PBW-Hackathon)
- 이 기관들이 DePIN·IoT 센서 네트워크를 지원한 공개 사례는 찾지 못했다. GitHub 저장소 검색에서 "xrpl depin"과 "xrpl iot sensor"는 모두 0건이었다(2026-09-26) — [1차: GitHub 검색](https://github.com/search?q=xrpl+depin&type=repositories) · [검색](https://github.com/search?q=xrpl+iot+sensor&type=repositories)

### Inferences
- XRPLF는 "돈을 주는 곳"이 아니라 인프라·거버넌스·코어 개발 교육 기관이다. wellbian이 닿을 수 있는 접점은 기술 신뢰 층(Town Hall 참석, 자체 노드·Clio 운영, 준회원 가입 조건 확인)에 가깝다.
- 실제 자금·노출 창구는 XRPL Commons(글로벌)와 XRPL Korea(국내)다. 둘 다 리플과 얽혀 있다(Commons는 XRPLF 공동 창립 멤버, XRPL Korea 행사·프로그램은 리플 후원). 팀 규칙(리플 협력 암시 금지)을 지키려면 대외 문구를 "XRPL Commons 프로그램", "XRPL Korea 행사"로 한정하는 편이 안전하다.
- 환경·임팩트 트랙(Regeneration·Social Impact·Impact Finance·Hack4Good)이 이미 있으므로, "실내 공기질 측정 데이터" 서사는 기존 테마에 들어간다. 다만 DePIN 선례가 없다는 점은 차별점인 동시에 "심사자에게 평가 틀이 없다"는 리스크다.
- KFIP 2026(본선 6/25 종료)의 rubric은 금융·결제 중심이다. 2027 회차가 열린다면 "측정 데이터 + RLUSD 정산" 형태로 맞출 수 있는지 미리 확인할 필요가 있다.
- dUNL에 한국·일본 운영 주체가 없다는 점은, 장기적으로 아시아 기관이 "인프라 기여자"로 보일 수 있는 빈자리로 해석할 수 있다(추론. 검증인 운영은 별도 비용·요건 검토가 필요하다).

### Gaps
- XRPLF 준회원 가입 조건·비용·혜택: 내규 공개 여부를 확인하지 못했다.
- XRPL Grants(리플) 2026 웨이브 운영 여부와 "XRPL funding hub" 실제 출시 여부: xrplgrants.org·ripple.com 차단.
- XRPL Korea 2026 하반기 프로그램(KFIP 2027 여부)과 XRPL Japan 자체 그랜트 여부: 원문 미열람.
- Commons Aquarium Cohort 9 주제·선정 결과, Early Stage Grant 금액 범위: 미확인.
- 한국 대학 UBRI 파트너 여부: 미확인.

## 2. XRP SEOUL 2026에 대해 공개된 사실(주최·의제·연사·스폰서·예상 청중)과, 그 밖에 중요한 2026 XRP/XRPL 행사 및 인근 서울·싱가포르 행사는 무엇인가?

### Takeaway
XRP SEOUL 2026은 2026-10-03 그랜드 하얏트 서울에서 XRPL Korea 주최·리플 타이틀 스폰서로 열리며, KBW 2026(9/29~10/1, 워커힐) 주간에 붙은 행사다. 9/18 3차 연사 발표에 케이웨더가 포함됐고, 일반 티켓 판매처(YES24 등)를 통해 대중에게 열려 있다. 2026년 예상 인원 공개치는 찾지 못했다(2025년판은 주최 측 주장 3,000+ 명). 인근 일정은 TOKEN2049 싱가포르(10/7~8)가 이어지고, XRPL 빌더 무대는 NYC(Commons 해커톤 10/24~25 → Swell+Apex 10/27~29)로 옮겨 간다.

### Cited Findings
**XRP SEOUL 2026**
- 일시·장소: 2026-10-03, 그랜드 하얏트 서울(용산) — [검색요약: 전자신문 2026-07-13](https://www.etnews.com/20260713000247) · [네이트뉴스 2026-07-14](https://m.news.nate.com/view/20260714n30408) · [블록체인투데이](https://blockchaintoday.co.kr/news/articleView.html?idxno=65372) · [COINOTAG](https://en.coinotag.com/xrp-seoul-2026-grand-hyatt-october-ripple-title-sponsor)
- 주최: XRPL Korea(XRP 레저 코리아). 리플이 공식 후원하며 타이틀 스폰서다 — [검색요약: 위 국내 기사](https://www.etnews.com/20260713000247) · [COINOTAG](https://en.coinotag.com/xrp-seoul-2026-grand-hyatt-october-ripple-title-sponsor)
- KBW 2026 기간 중 개최된다 — [검색요약: COINOTAG](https://en.coinotag.com/xrp-seoul-2026-grand-hyatt-october-ripple-title-sponsor)
- 스폰서: 타이틀은 리플, 플래티넘은 Doppler Finance("XRP-based financial platform") — [검색요약: Crypto Briefing](https://cryptobriefing.com/doppler-finance-joins-xrp-seoul-2026-as-platinum-sponsor/) · [Yellow 보도자료](https://yellow.com/dallas.html/press-releases/doppler-finance-joins-xrp-seoul-2026-as-platinum-sponsor). 케이웨더의 플래티넘 등급은 과제 브리프에 적힌 내용이며, 이번 세션에서 외부 원문으로 확인하지 못했다.
- 1차 연사진: 리플 경영진 3명(현 리플 소속이라 이름을 생략하며 연락 대상이 아니다) — [검색요약: Bitget News](https://www.bitget.com/news/detail/12560605639270) · [Coin-Turk](https://en.coin-turk.com/ripple-unveils-xrp-ledger-3-3-0-upgrade-names-speakers-for-xrp-seoul-2026/)
- 2차 연사진: Evernorth CEO(검색요약 표기 "Ashish Birla", 실제 표기 Asheesh Birla로 보임. 전 리플 임원으로 알려져 있으나 이번 세션에서 원문 확인 필요), Flare 공동창업자 Hugo Philion, Doppler Finance 기관사업 리드 Rocks Park, t54 Labs 창업자 Chandler Pang, 그리고 우리은행·카카오뱅크·케이뱅크·교보증권 실무 임원(스테이블코인·디지털자산 도입 관점) — [검색요약: BigGo Finance — unverified (aggregator)](https://finance.biggo.com/news/013e3adb-1cb1-4ecf-8182-f7ad749b73ca) · [디지털타임스 2차 공개](https://www.dt.co.kr/article/12082578)
- 3차 연사진(2026-09-18): Kweather(케이웨더), Tria, DCENT, Biconomy, Robinhood, Bitstamp — [검색요약: 서울신문 2026-09-18](https://www.seoul.co.kr/news/economy/2026/09/18/20260918500133) · [디지털타임스](https://www.dt.co.kr/article/12084781) · [openPR 보도자료 "From KOSDAQ-Listed Kweather and Tria to Robinhood"](https://www.openpr.com/news/4635224/from-kosdaq-listed-kweather-and-tria-to-robinhood-xrp-seoul) · [KuCoin News — unverified (aggregator)](https://www.kucoin.com/news/flash/xrp-seoul-2026-announces-third-batch-of-global-speakers-including-robinhood-and-bitstamp). Robinhood·Bitstamp는 **exchange-affiliated — greet only**. Biconomy는 동명의 거래소와 인프라 기업 중 어느 쪽인지 원문 미확인이므로 확인 전까지 거래소 쪽으로 취급하는 것을 권장한다.
- 티켓 판매처: 무브티켓·YES24·티켓링크 — [검색요약: 국내 기사 묶음 요약이라 개별 기사 특정 불가 — 예: 네이트뉴스 2026-07-14](https://m.news.nate.com/view/20260714n30408) · [디지털타임스](https://www.dt.co.kr/article/12084781)
- 세션 시간표, 스폰서 티어별 혜택, 2026 예상 인원: 공개 자료를 찾지 못했다(Gaps).
- 2025년판: 2025-09-21 서울(COEX 보도), 3,000+ 명·40+ 개국·100+ 기업(주최 측 발표를 매체가 전함 — unverified (aggregator)) — [KuCoin News](https://www.kucoin.com/news/flash/xrp-seoul-2025-attracts-3-000-attendees-from-40-countries-showcasing-xrpl-ecosystem-growth) · [Bitcoin.com](https://news.bitcoin.com/ripple-ceo-calls-out-xrp-seoul-energy-as-3000-pack-in-from-40-nations/). xrpl.org 이벤트 목록에는 "XRP Seoul Summit 2025 — Asia's largest XRP & Web3 conference"로 등재돼 있다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx). 행사장에서 XRPL 첫 유동 스테이킹 토큰 mXRP가 공개됐다는 보도가 있다(헤드라인 "'Infinite Money Glitch'", 2025-09-22, 12개월 경계) — [검색요약: The Crypto Basic](https://thecryptobasic.com/2025/09/22/xrp-seoul-2025-unveils-infinite-money-glitch-crypto-founder-says-this-is-a-dream-come-true/)
- xrpl.org 공식 이벤트 목록(2026-09-25 소스)에는 XRP SEOUL 2026·XRP Tokyo 2026·XRP Las Vegas 2026이 없다. 2026년 항목은 유럽(XRPL Commons)과 NYC 중심이다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)

**그 밖의 2026 XRP/XRPL 행사**
- XRP Community Day 2026: EMEA·Americas 2026-02-11, APAC 2026-02-12, 모두 X Spaces 가상 행사 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)
- XRP Tokyo 2026: 2026-04, 도쿄 핫포엔, 주최 XRPL Japan — [검색요약: iolite](https://iolite.net/en/magazine/vol20/asia-web3-alliance-japan-xrp-tokyo). 주최 측은 "over 3,000 attendees, more than 20 speakers, and senior Ripple leadership… Asia's largest conference dedicated exclusively to XRP and the XRP Ledger"로 서술했다(주최 측 주장, 매체 경유). TEAMZ Web3/AI Summit(4/6~8) 주간에 별도 층·무대로 운영됐고, 의제는 기관 채택·XRPL RWA 토큰화·DeFi였다 — [검색요약: Disruption Banking 2026-04-08](https://www.disruptionbanking.com/2026/04/08/ripple-sbi-a16z-converge-at-xrp-tokyo-2026/). 커뮤니티 파트너 YTT LINKS는 "国内最大級のXRPLカンファレンス"로 표기했다 — [검색요약](https://www.yttlinks.co.jp/news-and-note/news-004/). 공식 사이트: [xrp-tokyo.io](https://www.xrp-tokyo.io/)
- Hack the Block 2026(Paris Blockchain Week 공식 해커톤): 2026-04-11~12 파리 La Faïencerie, "Powered by XRP Ledger | Supported by XRPL Commons & Kryptosphere", 100+ 개발자, 총상금 12,500 EUR — [1차](https://github.com/XRPL-Commons/2026-PBW-Hackathon). X 공지(2026-04-06)는 "€10K"로 표기했다 — [검색요약](https://x.com/xrpl_commons/status/2041112431444062698)
- XRPL & GDF Stablecoins Round table(2026-04-07, 파리, 초청제), XRPL Zone Paris(2026-04-14) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)
- XRP Las Vegas 2026: 2026-04-30~05-01, Paris Las Vegas — [검색요약: Vegas Means Business](https://www.vegasmeansbusiness.com/event/xrp-las-vegas-2026/conventions_215251/). "officially listed on Ripple's events page… largest dedicated gathering"이라는 서술이 있다 — [검색요약: MEXC News — unverified (aggregator)](https://www.mexc.com/news/1063228). 주최사와 참석 수는 미확인이다. 4/30 애프터파티(Hard Rock Cafe) — [검색요약: Eventbrite](https://www.eventbrite.com/e/xrp-vegas-after-party-2026-tickets-1986755224358)
- KFIP 2026 본선: 2026-06-25 서울(1번 참조)
- Swell 2026 + XRPL Apex: 2026-10-27~29 NYC. "Ripple's annual flagship conference… For the first time, it combines the Swell and Apex conferences into one unified experience across multiple programming tracks" — [1차: xrpl.org 이벤트 페이지 소스](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx). 장소는 The Shed — [검색요약: GNCrypto](https://www.gncrypto.news/news/ripple-combines-swell-apex-nyc-2026-event/) · [Bitcoin.com](https://news.bitcoin.com/ripple-prepares-for-largest-swell-event-yet-with-combined-apex-format/)
- Swell 연계 빌더 행사: XRPL Commons NYC 해커톤(2026-10-24~25, 36시간, "connects builders with the ecosystem's institutions, investors, and decision-makers"), Core Dev Bootcamp(10/20~22), XRP Sidekick NYC(10/26, Barcade, "holders and builders") — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx). 해커톤은 4개 트랙과 코어 개발 부트캠프로 구성된다 — [검색요약: Genfinity 2026-08-24](https://genfinity.io/2026/08/24/xrp-ledger-hackathon-nyc-october-2026-xrpl-commons-swell/)
- Apex 이력: Apex 2024 암스테르담(2024-06-11~13) ⚠오래됨, 2025-06-19 Town Hall "Back from APEX!" — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx). Apex 2025의 장소·규모는 원문으로 확인하지 못했다.
- 2025년 아시아 XRPL 해커톤: "XRPL Hackathon @ Blockchain Kaigi 2025"(온라인, IIT Bombay에서 데모, 2025-11-14~12-06) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)

**인근 서울·싱가포르 행사(2026년 9~10월)**
- KBW 2026: 2026-09-29~10-01, 서울 워커힐, Upbit 메인 스폰서(**exchange-affiliated**). 9/29는 Upbit과 함께하는 비공개 기관 포럼(정책 입안자·금융기관·시니어 리더 대상), 9/30~10/1은 메인 컨퍼런스다. 보도자료 배포일은 2026-01-13이다 — [검색요약: Chainwire](https://chainwire.org/2026/01/13/kbw-2026-returns-to-seoul-september-29-october-1-upbit-joins-as-main-sponsor/) · [The Defiant](https://thedefiant.io/news/press-releases/kbw-2026-returns-to-seoul-september-29-october-1-upbit-joins-as-main-sponsor) · [Eventbrite "KBW2026 with Upbit"](https://www.eventbrite.com/e/kbw2026-with-upbit-tickets-1992031734542). 주최사명은 원문으로 확인하지 못했다(역대 주최는 FactBlock이며, 검색 결과에는 FactBlock 프로필만 나왔다 — [CB Insights](https://www.cbinsights.com/investor/factblock)).
- TOKEN2049 Singapore 2026: 2026-10-07~08, Marina Bay Sands — [검색요약: token2049.com](https://token2049.com/singapore). 25,000+ 참석·7,000+ 기업·160개국·300+ 연사·약 500 전시·1,000+ 사이드 이벤트(주최 측 예상치를 매체가 전함 — unverified (aggregator)) — [Altcoin Buzz](https://www.altcoinbuzz.io/token2049-singapore-25000-attendees-october-2026) · [COINOTAG](https://en.coinotag.com/token2049-singapore-2026-25000-attendees-marina-bay-sands) · [Asia Biz Today 2026-09-21](https://www.asiabiztoday.com/2026/09/21/token2049-singapore-2026-institutional-crypto-digital-assets/). BlackRock·J.P. Morgan·Nasdaq·Franklin Templeton 등 기관 임원이 참가할 예정이다 — [검색요약](https://www.asiabiztoday.com/2026/09/21/token2049-singapore-2026-institutional-crypto-digital-assets/)

| 일자(2026) | 행사 | 도시 | 성격 | 출처 |
|---|---|---|---|---|
| 9/29~10/1 | KBW 2026 (with Upbit) | 서울 워커힐 | 기관 포럼 + 메인 컨퍼런스 | [Chainwire](https://chainwire.org/2026/01/13/kbw-2026-returns-to-seoul-september-29-october-1-upbit-joins-as-main-sponsor/) |
| 10/3 | XRP SEOUL 2026 | 서울 그랜드 하얏트 | XRPL Korea 주최, 유료 공개 티켓 | [전자신문](https://www.etnews.com/20260713000247) |
| 10/7~8 | TOKEN2049 Singapore | 싱가포르 MBS | 범크립토 대형, 사이드 이벤트 1,000+ | [token2049.com](https://token2049.com/singapore) |
| 10/20~22 | XRPL Core Dev Bootcamp | NYC | XRPLF CTO 진행, 코어 개발 | [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx) |
| 10/24~25 | XRP Ledger Hackathon NYC | NYC | XRPL Commons 주최 | [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx) |
| 10/27~29 | Swell 2026 + Apex | NYC | 리플 플래그십(리플 주최) | [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx) |

### Inferences
- XRP SEOUL은 KBW 사이드 성격인 데다 YES24·티켓링크로 리테일에게 티켓을 판다. 따라서 청중 중 개인 보유자 비중이 클 것으로 본다(추론). 동시에 국내 은행·증권 실무진 세션이 있어 기관 청중도 섞인다.
- 아시아의 XRPL 전용 대형 행사는 지역 허브가 여는 연 1회 행사(서울 가을, 도쿄 봄)에 몰려 있다. 해외 빌더 동선은 유럽(Commons)과 NYC(Swell)다. 아시아에서 빌더와 접점을 이어 가려면 서울·도쿄 행사와 KFIP류 프로그램이 핵심이다(추론).
- TOKEN2049의 사이드 이벤트 1,000+ 개는 XRPL 특화도가 낮다. 규모는 크지만 wellbian 메시지가 묻힐 가능성이 높다(추론).
- xrpl.org 공식 이벤트 목록은 공개 GitHub PR로 갱신되는 구조다. 서울 행사가 목록에서 빠진 것은 주최 측이 등재 PR을 내지 않았기 때문일 수 있다(추론).

### Gaps
- XRP SEOUL 2026의 세션 시간표, 스폰서 티어별 공개 혜택 설명, 2026 예상 인원: xrp-seoul.com 차단으로 미확인.
- KBW 2025·TOKEN2049 2025의 실제 참석자 수와 공개 스폰서 패키지 설명: 미확인.
- XRP Las Vegas 2026 주최사·실제 규모, Apex 2025 장소·규모, XRP Tokyo 2027 일정: 미확인.
- 서울·싱가포르에서 이 기간 열리는 XRP 특화 사이드 이벤트(예: TOKEN2049 주간 XRPL 모임): 검색 한도 소진으로 미조사.

## 3. 편집 기준이 있고 빌더에게 닿는 XRPL 중심 매체·뉴스레터·팟캐스트는 어디이며, 집계 계정과는 어떻게 구분되는가?

### Takeaway
빌더에게 닿는다는 증거가 있는 채널은 조직이 직접 운영하는 1차 채널(xrpl.org 블로그·월간 뉴스레터·개발자 Discord·Town Hall/Community Day·XRPL Commons 행사와 블로그)이다. 독립 매체 중 XRPL 빌더 행사를 디테일까지 다루는 곳으로는 Genfinity 정도가 확인된다. 나머지 XRP 기사의 상당수는 보유자·가격 프레이밍을 쓰는 범크립토 매체, 거래소 뉴스피드, 재배포 집계 사이트, 보도자료 배포처로 흘러간다. 팟캐스트·유튜브는 이번 세션에서 검증하지 못했다.

### Cited Findings
**조직 운영 1차 채널(편집 주체가 명확함)**
- xrpl.org 블로그는 공개 저장소 XRPLF/xrpl-dev-portal의 blog/ 폴더에 있다. 기고는 GitHub PR로 제출하며(템플릿 제공, 영어만), 릴리스 노트는 Claude 스킬로 생성한다고 명시돼 있다 — [1차: Contribute a Blog Post](https://github.com/XRPLF/xrpl-dev-portal/blob/master/resources/contribute-blog/index.md). 2025년 프로젝트 사례 연구 게재 예: Frii Pay(2025-07-23), CoinPayments(2025-07-31), FortStock(2025-09-10), DIA 오라클 통합 가이드(2025-05-16) — [1차](https://github.com/XRPLF/xrpl-dev-portal/tree/master/blog/2025). 커뮤니티 페이지의 안내 문구는 "XRPL Developer Reflections — Submit your project or tool and get visibility and feedback from the broader blockchain community!"다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/index.page.tsx)
- XRPL 월간 뉴스레터("Monthly updates on key projects, proposals, and events"), XRPL 개발자 Discord, X @XRPLF — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/index.page.tsx)
- XRPL Town Hall(가상, #3 2025-04-07 · #4 2025-06-19 · #5 2025-10-16), XRP Community Day(X Spaces, 2026-02-11~12, 3개 권역) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)
- XRPL Commons 블로그·뉴스룸 — [검색요약: 블로그](https://www.xrpl-commons.org/about/blog) · [뉴스룸 글](https://www.xrpl-commons.org/newsroom/jumping-into-the-aquarium-residency)
- 리플 회사 채널(Ripple Insights, RippleXDev Medium)은 RLUSD 발행사·XRPL 기여자의 공식 입장을 확인하는 용도다 — [검색요약](https://ripple.com/insights/supporting-innovation-on-the-xrp-ledger/) · [RippleXDev](https://medium.com/ripplexdev/celebrating-wave-6-awardees-of-the-xrpl-grants-program-5499f66b9f5b)

**독립 XRPL 중심 매체**
- Genfinity: 2026-08-24 기사에서 XRPL Commons NYC 해커톤의 트랙 수·코어 개발 부트캠프·Swell 일정까지 구체적으로 보도했다(빌더 행사 커버리지) — [검색요약](https://genfinity.io/2026/08/24/xrp-ledger-hackathon-nyc-october-2026-xrpl-commons-swell/). 편집 방침과 발행인 정보는 사이트 차단으로 확인하지 못했다.

**XRP 비중이 큰 범크립토 매체(헤드라인 프레이밍 관찰)**
- The Crypto Basic: "XRP Ledger Foundation Appoints New Executive Director, CTO in 'Big Life Update' for XRP Holders"(2026-05-09), "XRP Seoul 2025 Unveils 'Infinite Money Glitch'…"(2025-09-22) — 보유자·수익 프레이밍 — [검색요약](https://thecryptobasic.com/2026/05/09/xrp-ledger-foundation-appoints-new-executive-director-cto-in-big-life-update-for-xrp-holders/)
- BeInCrypto: "Ripple Announces Distributed Funding Push for XRP Ledger in 2026: Will XRP Benefit?"(URL에 price-impact가 들어 있음) — [검색요약](https://beincrypto.com/ripple-xrpl-funding-expansion-2026-price-impact/)
- CoinGape("XRP News: …"), U.Today, Bitcoin.com News, CryptoSlate, Crypto Economy, Coin-Turk, COINOTAG, Altcoin Buzz는 행사·프로그램 발표를 빠르게 다시 전한다 — [검색요약: CoinGape](https://coingape.com/xrp-news-ripple-unveils-funding-hub-to-support-innovation-on-xrpl/) · [U.Today](https://u.today/xrpl-foundation-appoints-new-executive-director) · [Crypto Economy](https://crypto-economy.com/xrpl-commons-unveils-new-grants-initiative/)

**집계·재배포·거래소 뉴스피드(편집 기사로 취급하지 않음)**
- KuCoin News(flash), Bitget News, MEXC News(**거래소 운영 — exchange-affiliated**), Longbridge, BigGo Finance, cryptonews.net, bitcoinethereumnews.com, TipRanks는 다른 매체 기사나 보도자료를 재배포한다. 이번 검색에서 XRP SEOUL 연사 발표와 XRPLF 인선 뉴스가 이 경로로 다수 노출됐다 — [검색요약: KuCoin](https://www.kucoin.com/news/flash/xrp-seoul-2026-announces-third-batch-of-global-speakers-including-robinhood-and-bitstamp) · [Longbridge](https://longbridge.com/en/news/275653785) · [cryptonews.net](https://cryptonews.net/news/altcoins/32832219/) · [bitcoinethereumnews.com](https://bitcoinethereumnews.com/tech/xrpl-foundation-appoints-new-executive-director/)
- BankXRP·Trensik은 과제 브리프상 알려진 집계 계정이다(이번 세션에서 별도 검증하지 않음).

**보도자료 배포처(발행 주체의 자기 주장)**
- openPR, Chainwire, PR Newswire, Newsfile, Yellow.com 보도자료 섹션 — [검색요약: openPR](https://www.openpr.com/news/4635224/from-kosdaq-listed-kweather-and-tria-to-robinhood-xrp-seoul) · [Chainwire](https://chainwire.org/2026/01/13/kbw-2026-returns-to-seoul-september-29-october-1-upbit-joins-as-main-sponsor/) · [Newsfile](https://www.newsfilecorp.com/release/218310/Girin-Labs-Secures-Funding-from-the-XRP-Ledger-Japan-and-Korea-Ecosystem-Fund)

**한국어·일본어권**
- XRP SEOUL 2026 연사 공개는 전자신문(07-13), 네이트뉴스(07-14), 디지털타임스(2차·3차), 서울신문(09-18), 블록체인투데이에서 거의 같은 구성으로 보도됐다 — [검색요약: 서울신문](https://www.seoul.co.kr/news/economy/2026/09/18/20260918500133) · [디지털타임스](https://www.dt.co.kr/article/12084781)
- 블루밍비트에 XRPL Korea 인터뷰성 기사("엑스알피엘 코리아 'XRPL, 국내 규제 환경 고려한 설계…'")가 있다 — [검색요약](https://en.bloomingbit.io/feed/news/110019)
- 일본: iolite(Web3 매거진 vol.20의 XRP Tokyo 특집), Disruption Banking(영국 핀테크 매체의 XRP Tokyo 보도) — [검색요약: iolite](https://iolite.net/en/magazine/vol20/asia-web3-alliance-japan-xrp-tokyo) · [Disruption Banking](https://www.disruptionbanking.com/2026/04/08/ripple-sbi-a16z-converge-at-xrp-tokyo-2026/)

### Inferences
- 빌더에게 닿는다는 증거가 있는 채널은 모두 조직 운영 1차 채널이다. 그중 xrpl.org 블로그는 PR 기반 기고라는 구체적 진입 경로가 있고, 선례 포맷은 "사례 연구 + 트랙션 수치"다(Frii Pay 글에는 "Business Traction" 절이 있다).
- XRP 전문·범크립토 매체 생태계는 보도자료를 재전달하는 경향과 보유자 이익 프레이밍이 강하다. 보도자료를 내면 wellbian 규칙(가격 얘기·수익 약속 금지)과 충돌하는 헤드라인이 제3자에 의해 붙을 위험이 있다(추론. 헤드라인은 통제할 수 없다).
- 국내 행사 보도가 여러 매체에서 거의 같은 문구로 나온 것은 보도자료 기반일 가능성을 시사한다. 편집 기사로서의 독립 검증 가치는 낮게 본다(추론).
- 한국어·일본어 XRPL 전문 편집 매체는 이번 조사에서 확인되지 않았다. 국내에서는 일반 IT·경제지와 크립토 매체가 행사 보도의 주된 경로다.

### Gaps
- XRPL 관련 팟캐스트·유튜브 채널 목록과 편집형·개인형 구분, 청취 규모: 검색 한도 소진과 youtube.com 차단으로 검증 불가.
- Genfinity·U.Today·The Crypto Basic의 편집 방침(정정 정책·유료 게재 표기) 원문: 차단으로 미확인.
- XRPL 월간 뉴스레터 구독 규모: 공개 자료를 찾지 못했다.
- 한국·일본 XRP 전문 매체(편집형) 존재 여부: 미조사.

## 4. XRPL 네이티브 DePIN·IoT·RWA·데이터 프로젝트에는 무엇이 있고, 트랙션 증거는 무엇이며, 사용자를 어떻게 찾았는가?

### Takeaway
XRPL 위에서 "기기 → 측정 데이터 → 원장 지문"을 하는 DePIN·IoT 공개 선례는 사실상 없다(GitHub 검색 0건). 가장 가까운 형태는 데이터 지문 앵커링(BIS SDMX PoC — DevNet 연구용), 데이터 인증(Filedgr, 2024), 가격 오라클(DIA, 2025 메인넷), RWA 증서(FortStock — Devnet 샘플), 탄소(해커톤 수준, Carbonland Trust 등재)다. 사용자 확보 경로에 대한 증거는 결제 사례에서만 나오며(Frii Pay는 매입은행·대학 POC, CoinPayments는 기존 가맹점), 모두 벤더 주장이다. 온체인 트랙션 수치는 탐색기 차단으로 확인하지 못했다.

### Cited Findings
**데이터 지문·출처(provenance)**
- BIS "SDMX Blockchain Validator": 정규화한 SDMX XML의 SHA-3-512 해시를 XRPL DevNet 트랜잭션에 앵커링하고, 트랜잭션 참조를 SDMX `<Source>` 헤더에 다시 넣어 검증하게 하는 PoC다. 저장소는 "a research prototype… not intended for production use and is not maintained"라고 명시한다(최종 커밋 2026-07-14) — [1차: GitHub](https://github.com/bis-med-it/sdmx-blockchain). 트랙션: 해당 없음(연구용).
- Filedgr: NFT 기반 디지털 인증서, 디지털 트윈 데이터 허브, 접근 제어가 있는 IPFS 포크를 쓰고 XRPL 개발자 그랜트를 받았다 ⚠오래됨(2024-07-24) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2024/filedgr.md). 사용자 수는 공개되지 않았다.
- VerifyEd: XRPL 기반 교육 자격 증명 검증 ⚠오래됨(2024-03-14) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2024/verifyed.md)
- XDCellar "xrpl-provenance-passport": XLS-20 NFT와 타임스탬프가 찍힌 Memos로 제품 이력(EU Digital Product Passport)을 기록하며 스마트 컨트랙트를 쓰지 않는다. 2026-07 공개된 오픈소스 빌딩블록이고 트랙션은 없다 — [1차: GitHub](https://github.com/XDCellar/xrpl-provenance-passport)
- XRPL Commons XCS: XRPL Credentials용 오픈 스키마·검증 계층으로, "binds canonical off-ledger JSON to a Credential"한다. 스스로 "alpha software for XRPL Testnet"이라고 밝힌다(2025-10 생성, 2026-09 갱신) — [1차: GitHub](https://github.com/XRPL-Commons/XCS)

**오라클**
- DIA: XRPL 메인넷에서 운영 중이다. 제공자 "diadata", Oracle Document ID 42, 발행 계정 공개, 편차 1%·120초 갱신·24h 하트비트, XRP·RLUSD·BTC·ETH·USDC·USDT 피드를 제공하며 맞춤 오라클은 무료다. "20,000+ supported assets"는 벤더 주장이다 — [1차: xrpl.org 블로그 2025-05-16](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2025/integrating-dia-oracles-on-xrpl.md). 이용처 수는 미공개다.

**RWA**
- FortStock: 창고증권을 MPT로 발행하며, Devnet에서 샘플 발행·이전·소각을 시연했다. "attractive 8–12% yield" 문구가 있다(수익률 문구는 벤더 주장이므로 wellbian 대외 문구에 인용하지 않는다) — [벤더 주장, xrpl.org 블로그 2025-09-10](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2025/fortstock-xrpl-case-study-mpt-standard.md). 메인넷 트랙션은 없다.

**탄소·환경**
- Carbonland Trust는 xrpl.org "Uses"의 Carbon Markets/Sustainability 분류에 유일하게 등재된 곳이다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/about/uses.page.tsx). 트랙션은 미확인이다.
- GitHub "xrpl carbon" 저장소 8건은 대부분 해커톤 제출작(예: 2025-12 Blockchain Kaigi XRPL 해커톤의 AeroCarbon)이나 Testnet 수준이며 개인 계정이다 — [1차: GitHub 검색](https://github.com/search?q=xrpl+carbon&type=repositories)

**DePIN·IoT**
- GitHub 저장소 검색 결과 "xrpl depin" 0건, "xrpl iot sensor" 0건(2026-09-26) — [1차](https://github.com/search?q=xrpl+depin&type=repositories)
- XRPL Commons 아이디어 목록(2026-06-24 갱신)에는 "Community Solar Ledger"(`IoT Integration`), "Data Feed Oracle"("Price feeds, weather data, sports scores… Data is posted to XRPL memos for transparency"), "Reforestation Tracker"가 아이디어로만 올라 있다 — [1차](https://github.com/XRPL-Commons/community-ideas/blob/main/hackathon/index.md)

**사용자를 어떻게 찾았나(증거가 있는 사례)**
- Frii Pay: 영국·유럽 매입은행과의 관계, 영국 900+ 가맹점 네트워크("who can accept crypto payments once regulation allows", 즉 규제가 허용되면 가능), 버밍엄대 POC(파일럿 코호트 "100% uptake", 2024-25학년도에 4만 명 대상 개방 계획) — [벤더 주장, xrpl.org 블로그 2025-07-23](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2025/frii-pay-xrpl-case-study-crypto-payment-solution.md)
- CoinPayments: 기존 전자상거래 가맹점용 결제 플러그인·버튼에 XRPL을 통합했다 — [벤더 주장, 2025-07-31](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2025/coinpayments-xrpl-case-study-payment-processing.md)
- FortStock: "real warehouse partners, regulated lending institutions, and payment rails"와 함께 개발을 이어 간다(계획) — [벤더 주장](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2025/fortstock-xrpl-case-study-mpt-standard.md)
- XRPL Commons 해커톤은 "Zero to Users" 바운티("whoever drives the most real on-chain users before time runs out. Just traction.")로 사용자 확보 자체를 평가한다 — [1차](https://github.com/XRPL-Commons/2026-PBW-Hackathon)
- 온체인 트랙션(계정 수·거래 수): XRPScan·Bithomp 등 탐색기가 차단돼 이번 세션에서 1차로 확인하지 못했다.

### Inferences
- XRPL에는 공개된 DePIN 선례가 거의 없다. wellbian에게는 선례가 없는 영역이라는 차별점이 있는 반면, 심사자와 청중을 교육하는 비용이 든다.
- 공개된 사용자 확보 증거는 모두 B2B2C 경로(은행·대학·가맹점·창고)다. XRPL 커뮤니티 채널이 최종 소비자를 직접 데려왔다는 증거는 찾지 못했다. 이는 가정용 기기 판매를 XRPL 채널보다 기존 유통과 B2B 경로에 기대야 한다는 해석과 부합한다(추론, 외부 증거는 간접적). 팀의 자체 측정(22개 KOL 채널에서 태그 세션 약 157건, 11곳은 0건)과도 방향이 어긋나지 않는다.
- BIS PoC·XDCellar·XCS는 모두 "원본은 오프체인, 지문·자격은 온체인" 패턴이다. wellbian 설명의 외부 참조로 쓸 수는 있지만 "BIS가 XRPL을 채택했다" 같은 과장은 금지다(PoC·DevNet·유지 안 됨).
- xrpl.org 사례 연구에 실린 트랙션 수치도 벤더 주장이다(Frii Pay의 900+ 가맹점은 "규제 허용 시"라는 조건부). 외부 인용 시 이 조건을 함께 적어야 한다.

### Gaps
- DIA XRPL 오라클의 실제 이용처 수, Filedgr·Carbonland Trust의 현재 활동, 온체인 계정·거래 수: 탐색기와 사이트 차단으로 미확인.
- 대형 RWA 사례(국채 토큰·MMF 등)의 1차 확인: 검색 한도 소진으로 이번 범위에서 다루지 못했다.
- 팀 내부에서 추적 중인 환경 센서 프로젝트(예: Ambios)가 XRPL 기반인지 여부: 미확인.

## 5. 기기 데이터 앵커링과 보상 발행에 중요한 XRPL 기능은 무엇이며, 각각 언제 활성화됐는가?

### Takeaway
지금 바로 쓸 수 있는 기능은 Memos(1KB 이하), NFT·DynamicNFT(2025-06-11), DID(2024-10-30), Credentials(2025-09-04), MPT(2025-10-01, 메타데이터 1024B 이하), PermissionedDomains(2026-02-04), TokenEscrow(2026-02-12)다. Batch는 원판이 치명적 버그로 폐기된 뒤 BatchV1_1이 9/29 활성 예정이고(9/16 스냅샷 기준), 보정 수정안 fixBatchV1_2가 10/9 활성 예정이다. Sponsor(수수료·준비금 대납)는 미활성이며 버그를 수정 중이다. Price Oracle은 가격 데이터 전용으로 설계됐고, Hooks는 XRPL 메인넷 수정안이 아니다. XRPL EVM 메인넷의 제네시스는 2025-04-24다.

### Cited Findings
활성화 일자의 출처는 xrpl.org 수정안 스냅샷이다(2026-09-16 수집, 활성 트랜잭션 해시 포함) — [1차: amendments-snapshot.json](https://github.com/XRPLF/xrpl-dev-portal/blob/master/@theme/data/amendments-snapshot.json)
- **Memos**: 트랜잭션 공통 필드이며, "limited to no more than 1 KB in size (when serialized in binary format)" — [1차 docs](https://github.com/XRPLF/xrpl-dev-portal/blob/master/docs/references/protocol/transactions/common-fields.md)
- **NFT**: NonFungibleTokensV1_1 2022-10-31 ⚠오래됨(기반 기능). **DynamicNFT** 2025-06-11 — `tfMutable`로 발행하면 NFTokenModify로 URI를 수정할 수 있다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2025/dynamicnft-enabled.md)
- **DID (XLS-40)**: 2024-10-30 활성, W3C DID v1.0 준수 ⚠오래됨 — [1차 docs](https://github.com/XRPLF/xrpl-dev-portal/blob/master/docs/concepts/decentralized-storage/decentralized-identifiers.md)
- **PriceOracle (XLS-47)**: 2024-11-02 활성. PriceDataSeries는 최대 10쌍이고, 문서는 이 기능이 "designed specifically for reporting the prices of assets"라고 명시한다. fixPriceOracleOrder는 2026-01-27 — [1차 docs](https://github.com/XRPLF/xrpl-dev-portal/blob/master/docs/concepts/decentralized-storage/price-oracles.md) · [OracleSet](https://github.com/XRPLF/xrpl-dev-portal/blob/master/docs/references/protocol/transactions/types/oracleset.md)
- **Credentials (XLS-70)**: 2025-09-04 활성. CredentialType은 1–64바이트이고, URI 필드로 Verifiable Credential 문서에 연결한다 — [1차 docs](https://github.com/XRPLF/xrpl-dev-portal/blob/master/docs/references/protocol/transactions/types/credentialcreate.md)
- **PermissionedDomains (XLS-80)** 2026-02-04, **PermissionedDEX (XLS-81)** 2026-02-18 — [1차 스냅샷](https://github.com/XRPLF/xrpl-dev-portal/blob/master/@theme/data/amendments-snapshot.json)
- **MPTokensV1 (XLS-33)**: 2025-10-01 활성. MPTokenMetadata는 1024바이트 이하이며 관례상 JSON이다. XLS-89 메타데이터 스키마는 Final(2025-10-29 갱신), fixMPTDeliveredAmount는 2026-01-27 — [1차 docs](https://github.com/XRPLF/xrpl-dev-portal/blob/master/docs/references/protocol/transactions/types/mptokenissuancecreate.md) · [XLS-89](https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0089-multi-purpose-token-metadata-schema). DynamicMPT(XLS-94)와 ConfidentialTransfer(XLS-96)는 3.3.0에서 도입됐고 지지율 31.43%(9/16)다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/xrpld-3.3.0.md)
- **TokenEscrow (XLS-85)**: 2026-02-12 활성. IOU와 MPT의 에스크로를 지원한다(보상 락업·베스팅 설계에 관련) — [1차 스냅샷](https://github.com/XRPLF/xrpl-dev-portal/blob/master/@theme/data/amendments-snapshot.json)
- **Batch (XLS-56)**: 2026-02-19 원판 Batch에서 치명적 취약점이 발견됐다("execute inner transactions on behalf of arbitrary victim accounts without their private keys"). rippled 3.1.1(2026-02-23)이 이를 비지원 처리해 활성되지 않았다 — [1차 공개 보고(XRPL Labs 작성, 2026-02-26)](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/vulnerabilitydisclosurereport-bug-feb2026.md) · [3.1.1](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/rippled-3.1.1.md). 대체안 BatchV1_1(내부 트랜잭션 최대 8개)은 xrpld 3.3.0(2026-08-06)에서 도입됐고, 2026-09-16 기준 지지 82.86%로 **2026-09-29 활성 예정**이다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/xrpld-3.3.0.md). 2026-09-25 긴급 릴리스 3.4.1이 fixBatchV1_2("Reject Batch inner txs with the wrong wrapper")를 추가했고, 이는 **2026-10-09 활성 예정**이다(보안 사유로 소스는 사후 공개) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/xrpld-3.4.1.md)
- **Sponsor (XLS-68, 수수료·준비금 대납 — "so end users can transact without holding XRP")**: 3.3.0에서 도입됐고 지지율은 17.14%(9/16)다. 2026-08-07 준비금 회계 취약점이 보고돼 "will not be activated on Mainnet until the fix is included" — [1차 (2026-09-21 공개)](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/vulnerabilitydisclosurereport-bug-aug2026.md)
- 미활성 투표 현황(9/16): PermissionDelegationV1_1 62.86%, SingleAssetVault 45.71%, LendingProtocol 37.14%. LendingProtocolV1_1과 fixCleanup3_4_0(3.4.0, 2026-09-16)은 0%다 — [1차 스냅샷](https://github.com/XRPLF/xrpl-dev-portal/blob/master/@theme/data/amendments-snapshot.json) · [3.4.0](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/xrpld-3.4.0.md)
- **XChainBridge (XLS-38)**: 2.0.0에서 도입됐지만 미활성이다(14.29%) — [1차 스냅샷](https://github.com/XRPLF/xrpl-dev-portal/blob/master/@theme/data/amendments-snapshot.json)
- **Hooks**: XRPL 메인넷 수정안 목록(105개)에 없다. XRPL Commons 해커톤 규칙은 Xahau를 "sidechain" 선택지로 언급한다 — [1차](https://github.com/XRPL-Commons/2025-ECE-Hack4Good). XRPL 네이티브 스마트 로직인 XLS-100 Smart Escrows, XLS-101 Smart Contracts, XLS-102 WASM VM은 모두 Draft다(2026 갱신) — [1차](https://github.com/XRPLF/XRPL-Standards/tree/master/XLS-0101-smart-contracts)
- **XRPL EVM 사이드체인**: 메인넷 chain-id는 `xrplevm_1440000-1`, genesis_time은 2025-04-24다. 제네시스 gentx 제출 주체는 Informal Systems·Interchain Labs·Kintsugi·Peersyst·Ripple·XRPL Commons다 — [1차: xrplevm/networks](https://github.com/xrplevm/networks/blob/main/mainnet/genesis.json) · [gentx](https://github.com/xrplevm/networks/tree/main/mainnet/gentx). 브리지는 Axelar 경유로 안내된다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/docs/use-cases/tokenization/index.page.tsx) · [사이드체인 개념](https://github.com/XRPLF/xrpl-dev-portal/blob/master/docs/concepts/xrpl-sidechains/index.md)
- 서버 명칭이 rippled에서 xrpld로 바뀌었다(3.2.0, 2026-06-15, XLS-95) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/xrpld-3.2.0.md)
- 네트워크 가용성 사건: 2026-07-30 manifest flood가 발생했다. 원장은 "never halted or forked"했지만 Explorer, s1/s2 풀히스토리 엔드포인트, Clio 등 하위 서비스가 영향을 받았다. 2026-07-31 3.2.1 핫픽스가 나왔다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/vulnerabilitydisclosurereport-bug-jul2026.md)

**인접 생태계(간략, 공개 정보만)**
- Flare FAssets: "a trustless, over-collateralized bridge connecting non smart contract networks to Flare"로, XRP 등의 래핑 토큰(FXRP)을 발행한다. FDC가 타 체인 트랜잭션을 검증하고 FTSO가 가격 피드를 제공하며, 에이전트와 커뮤니티 담보 풀이 과담보를 유지한다 — [1차: Flare Developer Hub(2026-09-24 커밋)](https://github.com/flare-foundation/developer-hub/blob/main/docs/fassets/01-overview.mdx). XRPL Commons는 2025-09-20 Harvard 해커톤에서 Flare FDC 워크숍 저장소를 운영했다 — [1차](https://github.com/XRPL-Commons/boston_flare_fdc_workshop). (wellbian–Flare 통합으로 서술하지 않는다.)
- XRPfi: Doppler Finance(XRP SEOUL 2026 플래티넘) — [검색요약](https://cryptobriefing.com/doppler-finance-joins-xrp-seoul-2026-as-platinum-sponsor/). 2025-09 XRP Seoul에서 mXRP 유동 스테이킹 토큰이 공개됐다는 보도가 있다 — [검색요약](https://thecryptobasic.com/2025/09/22/xrp-seoul-2025-unveils-infinite-money-glitch-crypto-founder-says-this-is-a-dream-come-true/)
- 2025-06-30 칸 밋업("Bridging the XRPL and EVM Ecosystems", XRPL Commons·Ripple·Peersyst 공동) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)

### Inferences
- 판독값 지문 앵커링에는 Memos(1KB 이하)가 가장 단순하고 오래 검증된 경로다. BIS PoC와 XDCellar도 같은 계열 패턴이다. 기기·설치자 인증은 Credentials(2025-09)와 DID(2024-10)로 표현할 수 있고, XCS(알파) 같은 스키마 계층이 생겨나고 있다.
- 보상 토큰 형식은 IOU와 MPT(2025-10 활성, 메타데이터 1KB) 중에서 고를 수 있고, 락업에는 TokenEscrow(2026-02)를 쓸 수 있다. Price Oracle은 가격 전용이므로 공기질 수치 게시에는 맞지 않는다(문서 취지 기준).
- Batch와 Sponsor는 "곧 된다"가 아니라 "활성화를 확인한 뒤"에만 언급해야 한다. 두 기능 모두 2026년에 보안 사건 이력이 있다. Sponsor가 활성화되면 가정 사용자가 XRP 준비금 없이 참여하는 흐름에 직접 관련되지만, 현재는 활성 시점이 불확실하다.
- 7/30 사건은 공용 엔드포인트와 탐색기에 의존하는 위험을 보여 준다. 앵커링 파이프라인에는 자체 노드나 Clio, 또는 복수 공급자가 필요하다(추론).

### Gaps
- BatchV1_1이 9/29에 실제로 활성됐는지: 기준일 이후라 재확인이 필요하다.
- XRPL EVM 공개 런칭 발표일(제네시스와 별개), FXRP 발행 규모와 메인넷 출시일, Xahau(Hooks) 현황: 이번 세션에서 1차 확인을 하지 못했다.

## 6. 새 프로젝트가 XRPL 대화에 들어갈 때 어떤 커뮤니티 민감점을 존중해야 하는가?

### Takeaway
공개 자료가 보여 주는 민감점은 네 가지다. ① 거래를 되돌릴 수 없는 환경에서 사기에 대응하는 문화, ② 2026년 연쇄 보안 사건 이후 미활성 기능 과장에 대한 민감도, ③ 리플의 영향력과 거버넌스 절차를 둘러싼 긴장(리테일 반발 보도, XRPLF 인선 절차 문제 제기), ④ 매체가 거의 자동으로 붙이는 보유자·가격 프레이밍이다. "XRP Army" 문화 자체를 다룬 1차·학술 자료는 확보하지 못했다.

### Cited Findings
- xrpl.org "Report a Scam": "no one can freeze accounts or revert transactions on the XRP Ledger". 피해 시 경찰, 거래소(거래소 내 계정 동결 가능), 토큰 발행자(트러스트라인 동결 가능) 순으로 안내하고, Xrplorer 포렌식 팀 같은 커뮤니티 도구를 언급한다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/report-a-scam.md)
- 보안 사건 연쇄(2026): Batch 치명 취약점(2월), manifest flood(7/30, 원인에 대해 "either an intentional act or an experiment gone rogue"로 추정), Sponsor 취약점(8월), 3.4.1 긴급 릴리스(9/25, 소스 사후 공개) — [1차 2월](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/vulnerabilitydisclosurereport-bug-feb2026.md) · [7월](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/vulnerabilitydisclosurereport-bug-jul2026.md) · [8월](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/vulnerabilitydisclosurereport-bug-aug2026.md) · [3.4.1](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2026/xrpld-3.4.1.md)
- 리플과 생태계의 구조: 리플은 XRPLF 창립 멤버 4곳 중 하나로 이사회에 참여한다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2024/a-new-era-for-the-xrp-ledger.md). dUNL 35개 중 ripple.com은 1개다 — [1차](https://github.com/XRPLF/unl/blob/main/data/unl-raw.yaml). 리플은 "$550M+ 배치"를 자체 발표했다[회사 주장] — [검색요약](https://x.com/Ripple/status/2027032926529929505)
- Swell·Apex 통합 보도에 "Drawing Both Institutional Hype and Retail Fury"라는 헤드라인이 붙었다(구체적 반발 사유는 미열람) — [검색요약: BigGo Finance — unverified (aggregator)](https://finance.biggo.com/news/30f90c45-13e6-4d9f-b0cb-4da2622b081a)
- 거버넌스 감시: 커뮤니티 논평 계정 @WKahneman이 2026-02-09 "Who elected an XRPLF Executive director?… how was the new Executive Director chosen for this organization?"라고 문제를 제기했고, 이틀 뒤 2026-02-11 XRPLF가 선임을 발표했다 — [검색요약: X](https://x.com/WKahneman/status/2021008147415171369) · [XRPLF](https://x.com/XRPLF/status/2021644297079013736)
- 매체 프레이밍: 인사·프로그램 뉴스에도 "Will XRP Benefit?", "'Big Life Update' for XRP Holders" 같은 보유자 이익 헤드라인이 붙는다 — [검색요약: BeInCrypto](https://beincrypto.com/ripple-xrpl-funding-expansion-2026-price-impact/) · [The Crypto Basic](https://thecryptobasic.com/2026/05/09/xrp-ledger-foundation-appoints-new-executive-director-cto-in-big-life-update-for-xrp-holders/)
- 결집력: XRP Seoul 2025는 3,000+ 명(unverified (aggregator))이 모였고, 리플 CEO(현 리플 소속, 연락 대상 아님)가 행사 후 "the XRP community… show up in force"라고 적었다 — [검색요약: Bitcoin.com](https://news.bitcoin.com/ripple-ceo-calls-out-xrp-seoul-energy-as-3000-pack-in-from-40-nations/). XRP Community Day는 X Spaces로 3개 권역에서 동시에 진행됐고, NYC "XRP Sidekick"은 "holders and builders"를 대상으로 한다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)
- 생태계 요직에 전 리플 인력이 있다: XRPLF Executive Director(전 리플 Technical Director) — [검색요약](https://u.today/xrpl-foundation-appoints-new-executive-director)

### Inferences
- 새 프로젝트가 밟기 쉬운 지뢰는 네 가지다.
  - 리플과의 관계를 과장하거나 암시하는 것: 커뮤니티는 리플의 영향력과 거버넌스 절차에 민감하다.
  - 미활성·실험 기능(Batch·Sponsor 등)을 "사용 중"이라고 말하는 것: 보안 사건 직후라 개발자 층의 신뢰를 잃는다.
  - 보유자 이익(가격) 프레이밍: 매체가 자동으로 붙이므로 먼저 꺼내지 않는다.
  - 사기로 오인될 형태: 거래를 되돌릴 수 없는 문화에서 토큰 보상 안내와 지갑 연결·서명 요청은 사칭 사기와 모양이 같다. 공식 채널을 한 곳으로 고정하고, DM 선제 연락을 하지 않고, 서명 요청을 최소화하는 편이 안전하다.
- 이 민감점들은 팀 규칙(리플 협력 암시 금지, 가격·수익 약속 금지, WLBN을 coin으로 부르지 않음, 외부 수치는 원출처 확인 후 인용)과 방향이 같다. 외부 증거가 규칙을 뒷받침한다.
- 커뮤니티 결집은 오프라인 대형 행사와 X Spaces에서 강하게 나타난다. 다만 이것이 제품 구매로 이어진다는 증거는 없다(4번의 추론과 연결).

### Gaps
- "XRP Army" 문화(규범·적대적 반응 패턴)에 대한 1차 또는 학술 자료: 검색 한도 소진으로 확보하지 못했다.
- 사칭·가짜 에어드롭 사기의 빈도와 규모 통계, 리플 사칭 사례: 미확보.
- XRPL 커뮤니티가 신규 토큰 보상 프로젝트를 대하는 태도(에어드롭 사냥, 밈코인 이력 등)에 대한 외부 증거: 미확보.

## 7. XRPL Commons(@xrpl_commons)와 그 프로그램은 어떤 성격인가? (팀이 이미 접촉 중)

### Takeaway
XRPL Commons는 파리에 본부를 둔 XRPL 빌더 허브로, XRPLF 창립 멤버이자 dUNL 검증인이고 XRPL EVM 제네시스 검증인이다. 교육(XRPL Academy·대학 워크숍·코어 개발 부트캠프), 인큐베이션(Aquarium), 3트랙 자금(Glow·초기 팀·기성 제품), 해커톤, 유럽 "XRPL Hubs" 밋업을 한 조직에서 운영한다. 평가 잣대는 일관되게 "실사용자·반복 온체인 거래(VMT)"다. 임팩트·기후 트랙은 있지만 데이터 마켓플레이스는 Commons 자체 기회 목록에서 LOW 등급이며, Cohort 9 지원은 2026-08-23에 마감됐다.

### Cited Findings
- **정체성·위상**: "The builder hub for XRPL: education, acceleration, and funding to launch and grow" — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/developer-funding.page.tsx). 파리 본부("our Paris HQ") — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx). XRPLF 창립 멤버 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/blog/2024/a-new-era-for-the-xrp-ledger.md). dUNL 검증인(v2.xrpl-commons.org) — [1차](https://github.com/XRPLF/unl/blob/main/data/unl-raw.yaml). XRPL EVM 메인넷 제네시스 gentx 제출 — [1차](https://github.com/xrplevm/networks/tree/main/mainnet/gentx)
- **교육**:
  - XRPL Academy(개발자·창업자 코스, 코어 개발 트랙 포함) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/developer-funding.page.tsx)
  - "Building on the XRP Ledger" 2일 집중 교육(파리, 2025-01/05/09, 2026-01)과 온라인 교육(2026-06-22~23, "open to everyone, whether you are a developer or not") — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)
  - 2026 대학 워크숍 6곳 — [1차](https://github.com/XRPL-Commons)
  - Core Dev Bootcamp(2025-07 파리 2주, C++ 중·고급 대상; 2026-10 NYC 3일) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)
- **인큐베이션(Aquarium)**: xrpl.org는 "12-week onsite entrepreneurial program in Paris"로 설명한다 — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/developer-funding.page.tsx). 반면 그랜트 개편 보도는 "a nine-week incubator now open internationally online"으로 전한다 — [검색요약: GNCrypto](https://www.gncrypto.news/news/xrpl-commons-grants-xrp-ledger-builders/). 형식 변경 여부는 확인이 필요하다. 코호트 이력:
  - Cohort 1 Regeneration, Cohort 5 Gaming(연장 공지 2024-11-18 ⚠오래됨)
  - Cohort 6 AI & Blockchain(데모데이 2025-07-08, 레지던트 11팀)
  - Cohort 7 DeFi II(데모데이 2025-12-10, 11팀)
  - Cohort 8 Social Impact(2026-01-19~04-09, 데모데이 2026-03-25)
  - Cohort 9 Fall 2026(지원 마감 2026-08-23, 주제 미확인)
  - 출처: [1차 이벤트](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx) · [검색요약: Cohort 8](https://www.xrpl-commons.org/residency-cohorts/social-impact) · [The Aquarium](https://www.xrpl-commons.org/the-aquarium) · [X 2024-11-18](https://x.com/xrpl_commons/status/1858517915043033246)
- **자금(2025-10 개편 3트랙)**: ① Glow — 완료된 오픈소스 기여 보상, 11개 프로젝트(노드 관리·트랜잭션 분석·양자내성 암호), 2026-12까지 분기별 접수(glow.xrpl-commons.org) ② 초기 팀 — Make Waves(90일 경쟁), Aquarium, 마일스톤형 Early Stage Grants(테스트넷·메인넷 라이브 조건) ③ 기성 제품의 XRPL 통합(예: LOBSTR) — [검색요약: Dealroom](https://app.dealroom.co/news/note/xrpl-commons-launches-three-track-grants-program-backing-a-550m-ecosystem) · [1차: GLOW 링크](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/developer-funding.page.tsx)
- **해커톤**(플랫폼: hackathons.xrpl-commons.org):
  - HAKS 2025(Telecom SudParis, AI×블록체인, 2025-05)
  - IXH25 로마(2025-11-07~08, €10,000, 학생 지원)
  - Hack4Good ECE 파리(2025-11, Crypto for Good)
  - Hack the Block PBW(2026-04-11~12, 12,500 EUR)
  - NYC(2026-10-24~25)
  - 출처: [1차 이벤트](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx) · [PBW 2026](https://github.com/XRPL-Commons/2026-PBW-Hackathon) · [Hack4Good](https://github.com/XRPL-Commons/2025-ECE-Hack4Good)
  - 공통 심사 기준은 Idea·Implementation·Demo·Potential("the total value transacted on-chain, the business model, and the potential to turn your project into a product")이며 가중치가 같다. L1에 트랜잭션을 반드시 제출해야 하고, 사이드체인(Xahau·XRPL EVM)을 쓰면 감점될 수 있다 — [1차](https://github.com/XRPL-Commons/2025-ECE-Hack4Good) · [IXH25/PBW 2025 온라인](https://github.com/XRPL-Commons/IXH25)
- **커뮤니티 운영**:
  - 유럽 도시 순회 XRPL Meetups("We're establishing local 'XRPL Hubs' across Europe"): 런던(2025-01, 2026-02), 더블린, 브뤼셀, 테살로니키, 바르샤바(2026-03), 리스본(2026-06), 마드리드·바르셀로나(2026-09)
  - Soirée(Deloitte·Pyratz Labs 공동, 2025-02-12, 주제 "Agentic Web: Blockchain, AI & Digital Identity"), PBW 런치파티 "Blockchain For Social Impact"(2025-04-08), GDF 공동 스테이블코인 라운드테이블(2026-04-07)
  - 출처: [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)
- **오픈소스 도구**: xrpl-connect(지갑 연결 툴킷), scaffold-xrp, XCS(Credentials 서비스), bedrock(Go 기반 스마트 컨트랙트 툴킷), firehose-xrpl, xrpl-dev-skills("Claude skill for XRPL dApp development") — [1차: XRPL-Commons GitHub](https://github.com/XRPL-Commons)
- **평가 신호(무엇을 원하나)**:
  - Hack the Block의 Make Waves 테마: "apps that power real users, businesses, and value flows… driving recurring transactions, sustainable TVL, and measurable ecosystem growth". "Zero to Users" 바운티 — [1차](https://github.com/XRPL-Commons/2026-PBW-Hackathon)
  - 플랫폼 아이디어는 "designed to generate sustained on-chain transaction volume (VMT)"를 기준으로 한다 — [1차](https://github.com/XRPL-Commons/community-ideas/blob/main/platform/index.md)
  - Make Waves 시장 공백 74개(XRPL Builder Opportunities 레지스트리 출처) 가운데 "Data Marketplace · Oracle Aggregator"(OPP-051)와 "Vendor-Neutral Oracle/Bridge/Ramp"(OPP-048)는 LOW 등급이다 — [1차](https://github.com/XRPL-Commons/community-ideas/blob/main/make-waves/index.md) · [SCHEMA](https://github.com/XRPL-Commons/community-ideas/blob/main/SCHEMA.md)
  - 기후 아이디어("Community Solar Ledger" — `IoT Integration` 등)는 해커톤·플랫폼 목록에 있다 — [1차](https://github.com/XRPL-Commons/community-ideas/blob/main/hackathon/index.md)
- **타 생태계와의 접점**: 2025-06-30 칸 밋업(Commons·Ripple·Peersyst 공동, XRPL–EVM 브리징), 2025-09-20 Harvard 해커톤 Flare FDC 워크숍 — [1차 이벤트](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx) · [GitHub](https://github.com/XRPL-Commons/boston_flare_fdc_workshop)
- **공개 계정**: X @xrpl_commons(레지던시 모집·해커톤 공지) — [검색요약](https://x.com/xrpl_commons/status/2041112431444062698)
- **아시아 활동**: xrpl.org 이벤트 목록상 Commons가 주최한 아시아 오프라인 행사는 없다(2026 목록은 유럽·NYC 중심) — [1차](https://github.com/XRPLF/xrpl-dev-portal/blob/master/community/events.page.tsx)

### Inferences
- Commons는 상위 거버넌스(XRPLF), 검증인, EVM 제네시스, 교육·인큐베이션·그랜트를 한 몸에 가진 사실상의 XRPL 빌더 허브다. 이미 접촉이 있다면 가장 레버리지가 큰 조직 채널이다.
- Commons의 평가 언어는 "실사용자·반복 트랜잭션·온체인 가치"다. wellbian이 보여 줄 지표는 판독값 지문 앵커 트랜잭션 수, 활성 기기 수, 검증 가능한 링크 쪽이어야 하며, 가격이나 토큰 가치가 아니다.
- 데이터 마켓플레이스 자체는 Commons 기회 목록에서 LOW다. "데이터 판매" 서사보다 "검증 가능한 측정(Memos·Credentials) + 임팩트(실내 공기질)" 서사가 Commons 테마(Social Impact·Impact Finance·Regeneration)와 더 잘 맞는다.
- 가능한 접점 후보(모두 가능성일 뿐, 채택·지원이 확정된 것은 아니다):
  - Early Stage Grants(라이브 조건 충족 시)
  - Glow(앵커링·검증 도구를 오픈소스로 공개할 경우)
  - 차기 Aquarium 코호트
  - 해커톤 임팩트 바운티 멘토·과제 제공
  - XCS 기기 인증 크리덴셜 스키마에 대한 피드백
- Commons에는 아시아 오프라인 거점이 보이지 않는다. 한국 쪽 실무 접점은 XRPL Korea가 보완하는 구조로 보인다(추론).
- 주의: Commons는 XRPLF를 리플과 공동 창립했고 리플과 공동 행사 이력이 있다. 대외 문구에서 Commons 프로그램 참여가 리플 협력으로 비치지 않도록 한다.

### Gaps
- Commons의 재원 구조(리플 출연 비중 등), Early Stage Grant 금액 범위, Make Waves 2026 일정: 공개 원문을 확인하지 못했다(xrpl-commons.org 차단).
- Aquarium 2026 형식(12주 파리 온사이트 vs 9주 온라인)과 Cohort 9 주제·선정 팀: 미확인.
- Commons의 한국·아시아 파트너십 계획 여부: 공개 자료를 찾지 못했다.
