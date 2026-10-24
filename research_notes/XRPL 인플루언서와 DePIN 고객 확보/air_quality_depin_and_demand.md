# 공기질·환경 센싱 DePIN, 환경·실내공기 데이터 구매자, 소비자 실내공기 측정기 유통 — 외부 증거 노트

작성 2026-09-26 · 범위: (a) 환경 센싱 DePIN 프로필 (b) 데이터 구매자와 거래 방식 (c) 소비자 측정기 유통 채널 (d) 한국 수요 신호. 케이웨더 자체는 조사하지 않았다.

> **조사 방법·한계 (보고서 작성자 필독)**
> - 이번 세션에서 **WebFetch 는 시도한 모든 도메인이 네트워크 정책으로 차단**됐다(EGRESS_BLOCKED). 차단된 도메인: airgradient.com, depinscan.io, ambios.network, benzinga.com, support.getawair.com, getawair.com, medium.com, airthings.com, blog.weatherxm.com, planetwatch.io, kostat.go.kr, live.euronext.com, datarade.ai, easylaw.go.kr, gallup.co.kr, mcee.go.kr, iqair.com, epa.gov, incheon.go.kr, moleg.go.kr, korea.kr, explore-education-statistics.service.gov.uk. 우회하거나 재시도하지 않았다.
> - 웹 검색은 세션 전체 한도(200회)에 걸려 조사 도중 멈췄다.
> - 그래서 **아래 인용은 모두 검색엔진의 결과 요약·스니펫에서 나왔고 원문은 열어 보지 못했다.** 숫자와 날짜는 원문과 맞춰 보기 전에는 대외 인용 금지로 다뤄야 한다. 각 URL 은 그 주장이 나온 검색 결과 페이지다.
> - 표기: **[12개월+]** = 2025-09-26 이전 정보라 오래됐을 수 있음 · **[미검증·집계처]** = 제3자 집계나 유료 요약에 나온 수치 · **[회사 주장]** = 당사자가 스스로 발표한 내용 · **[의견]** = 의견·리뷰·홍보성 글 · **[일방 주장]** = 분쟁 당사자 한쪽의 진술 · **[출처 특정 불가]** = 검색 요약에 나왔지만 여러 결과 중 어느 페이지에서 나왔는지 단정할 수 없음 · **[내부 기록]** = 저장소 내부 문서에 이미 적혀 있던 외부 수치로, 이번 세션에서 다시 확인하지 못함.

## 1. PlanetWatch 와 다른 환경 센싱 DePIN 에는 무슨 일이 있었고, 실내공기질 DePIN 에는 어떤 교훈이 옮겨지는가?

### Takeaway
PlanetWatch(알고랜드, 2020~)는 유료 라이선스를 팔아 커뮤니티 센서를 모았다. 그러나 ① 기기 파트너 Awair 와 데이터 조회 비용으로 분쟁이 붙어 2022-04-01 에 Awair Element 데이터 스트림이 끊겼다. ② 센서 없이 팔린 라이선스는 환불과 로열티 프로그램으로 메워야 했다. ③ 2023-09 에 거래소에서 상장폐지된 뒤 2024-06 에 Ambient(이후 Ambios, 솔라나)로 넘어가 토큰과 체인을 모두 바꿨다. WeatherXM·Nubila·Silencio 도 기기·사용자 수는 크게 주장하지만 감사를 거친 데이터 매출 공개는 찾지 못했다. XRPL 위에서 돌아가는 환경 센싱 DePIN 선행 사례도 이번 검색에서는 나오지 않았다.

### Cited Findings

**PlanetWatch (2020~2024) — 이력 [12개월+]**
- 알고랜드는 PlanetWatch 를 "first major environmental use case"로 발표했다(2020). 검색 요약에 따르면 PlanetWatch 는 알고랜드 위에 "global air quality ledger"를 만드는 프랑스 스타트업이고, 도시별 파트너십과 개인 센서 보유자의 글로벌 커뮤니티를 결합하는 구조다 — [PR Newswire (Algorand 발표)](https://www.prnewswire.com/news-releases/algorand-platform-announces-its-first-major-environmental-use-case-planetwatch-global-air-quality-monitoring-300992602.html)
- 이탈리아 밀라노와 타란토에서 센서 100개 이상을 가동했고, 같은 발표에서 Algorand Foundation 그랜트를 공개했다(2020년경, 정확한 날짜는 원문 미확인). 초기 도시 배치를 뒷받침한 돈은 데이터 매출이 아니라 **재단 그랜트**였다 — [PR Newswire](https://www.prnewswire.com/news-releases/planetwatch-activates-innovative-air-quality-monitoring-in-two-key-italian-cities-and-announces-grant-from-the-algorand-foundation-301159916.html)
- 마이애미를 미국 첫 주요 거점으로 골랐다. 보도 시점에 PlanetWatch 네트워크에서 "more than 21,000 monitors"가 쓰이고 있었고, 마이애미 주민 참여는 2022 년 예정이었다 — [CBS Miami](https://cbsnews.com/amp/miami/news/planetwatch-miami-air-quality-monitoring-network) [회사 주장을 전한 보도. 보도일은 2021~2022 로 추정되며 원문 미확인]
- 참여하려면 센서 종류별로 **유료 라이선스**를 사야 했다. Type 1 라이선스는 전문 옥외 센서 AirQino 용이고, Awair Element 는 Type 4 라이선스가 필요했다 — [planetwatch.us: Type 1 License](https://www.planetwatch.us/product/type-1-license/) · [Awair Support: Awair Element, its License and PlanetWatch](https://support.getawair.com/hc/en-us/articles/4408011848983-Awair-Element-its-License-and-PlanetWatch)
- **기기 파트너 이탈(2022-03~04)**: Awair 공식 성명에 따르면 PlanetWatch 의 일일 쿼리가 **1,600,000건을 넘었고**, PlanetWatch 는 **"no cost" 한도인 하루 7,000건**을 넘긴 분량에 대한 지불을 거부했다. Awair 는 2022-03-01 에 계약 위반 통지와 시정 요구를 보냈고, 3/31 까지 시정되지 않으면 계약을 끝낸다고 했다. PlanetWatch 가 3/30 에 공개 성명을 내자 Awair 는 **2022-04-01 00:01(태평양시)에 관계를 종료**했다 — [Awair: Official Statement – March 31, 2022](https://www.getawair.com/official-statement-march-31-2022) · [Awair's Response to PlanetWatch March 30, 2022 Statement](https://www.getawair.com/pages/awair-response-planetwatch-march-30-statement) [일방 주장. PlanetWatch 의 2022-03-30 성명은 원문 미확인]
- PlanetWatch 는 "Element Community Resilience Plan"으로 대응했다. 회사가 밝힌 규모는 **$10M 이상**이다. 대상 Element 1대마다 서로 배타적인 선택지 두 개를 주었고, 1안은 PlanetWatch 호환 센서 구매용 $100 바우처와 신규 라이선스 구매용 $200 바우처였다. 바우처는 300 PWCREDITS(알고랜드 ASA 유틸리티 토큰) 형태로 지급했고, 선택 마감은 2022-06-30 이었다 — [PlanetWatch: Element Community Resilience Plan](https://www.planetwatch.io/element-community-resilience-plan/) · [PlanetWatch: choose your option](https://www.planetwatch.io/element-community-resilience-plan-choose-your-option/) · [PlanetWatch: Awair Element contingency plan](https://www.planetwatch.io/awair-element-contingency-plan/) [회사 주장]
- **센서 없는 라이선스 문제**: 센서에 연결하지 못한 라이선스의 환불 요청이 있었고, 지연을 거쳐 처리됐다. 2022-11 중순에는 "Loyalty Program and Cohort System"을 도입해 **기기에 연결되지 않은 라이선스에도 쓸모**를 부여했다 — [Medium: New PlanetWatch Loyalty Program and Cohort System](https://medium.com/planet-watch/new-planetwatch-loyalty-program-and-cohort-system-making-licenses-great-again-366f481d13e2) · [PlanetWatch: Questions and Answers about licenses, listing and sensor availability](https://www.planetwatch.io/questions-and-answers-about-licenses-listing-and-sensor-availability/)
- 2023-09-11 에 Bitfinex 에서 PLANETS 거래가 종료됐다(상장폐지) — [Bitfinex Support: Planet Token — Delisted](https://support.bitfinex.com/hc/en-us/articles/900006737366-Planet-Token-Delisted)
- 2024-06-13(게시물 ID 로 역산한 날짜): PlanetWatch 공식 X 계정 — "the PlanetWatch Air Quality Network, including sensors, community, token & key team members, are now part of the Ambient ecosystem … Ambient will be migrating the network to Solana" — [X @PlanetWatchsas](https://x.com/PlanetWatchsas/status/1801198367948611614). 한 집계처는 M&A 일자를 2024-05-07 로 적었다 — [CryptoRank](https://cryptorank.io/ico/planetwatch) [미검증·집계처]
- Ambient 의 시드 $2M(Borderless Capital 주도, Solana Ventures·Parami·Sonic Boom·Primal Capital 참여)과 PlanetWatch 인수가 보도됐다 — [Benzinga](https://benzinga.com/z/38677638) [회사 발표를 옮긴 보도, 2024. 정확한 날짜는 원문 미확인]
- 이전 조건: PLANETS 는 **40개당 Ambient 토큰 1개**로 일괄 전환됐다. 아직 배분되지 않은 PLANETS 잔량(약 19억 개)은 **활동하지 않는 라이선스 환불의 최종 정산**에 배정됐다 — [Ambios: The Migration Plan](https://ambios.network/blog/articles/the-migration-plan-transitioning-the-legacy-network) · [Medium 동일 글](https://medium.com/ambiosnetwork/the-migration-plan-transitioning-the-legacy-network-ff37d79918bd)

**Ambient → Ambios Network (2024~2026)**
- 2024-10-21: Ambient 가 LA Japanese Village Plaza 에 블록체인 기반 공기질 센서를 설치했다고 발표했다. 스스로를 "the largest distributed network for environmental monitoring"라고 소개했다 — [DePIN Scan](https://depinscan.io/news/2024-10-21/ambient-deploys-blockchain-based-air-quality-sensors-in-los-angeles) [회사 주장] [12개월+]
- 2025-03-17 기사: 알고랜드에서 솔라나로의 이전이 2024 년 말에 끝났고, $AMBIOS 는 2025 Q1 에 솔라나에서 총량 10억 개 상한으로 출시됐다. 네트워크 규모는 "over 50,000 users and 8,000 sensors"로 제시됐다 — [DePIN Scan](https://depinscan.io/news/2025-03-17/ambios-network-pioneering-decentralized-environmental-monitoring-with-ambios-token-launch) [회사 주장] [12개월+]
- 집계처 프로필: 2024-01 출범, 20개국 이상에 **센서 25,000개 이상**, 5분 주기 갱신, $AMBIOS 는 2025-04 솔라나 메인넷 출시로 적혀 있다(DePIN Scan 의 "Q1 2025"와 약간 다름). 데이터는 Synoptic·Datarade·Databricks·Google Cloud 마켓플레이스에서 유통되고, **2025-07 에 SAP Datasphere 에 등재**됐다 — [Messari: Ambios Network profile](https://messari.io/project/ambios-network/profile) [미검증·집계처] [12개월+]
- 자사 데이터 상품 페이지: NO₂·기온·PM2.5/PM10·O₃ 의 실시간·과거 데이터를 "3,000+ first-party outdoor sensors across 20+ countries"에서 제공한다고 적혀 있다 — [Ambios Network: Data Products](https://data.ambios.network/) [회사 주장]
- **센서 수가 자료마다 3,000(자사 1차 옥외 센서) / 8,000 / 25,000 으로 다르다.** 내부 검토 문서(2026-09-14)는 Ambios 홈 대시보드에서 **온라인 4,097대, 누적 배포 8,000대 이상**을 기록해 두었다 — [Ambios Network 홈](https://ambios.network/) [내부 기록. ambios.network 차단으로 이번 세션에서 재확인 불가]

**WeatherXM (옥외 기상 DePIN, 환경 센싱 동종)**
- 스스로를 관측소 보유자에게 보상하고 기업에 정확한 기상 서비스를 제공하는 커뮤니티 네트워크로 소개하며, "over 7,000 live weather stations"를 내세운다 — [WeatherXM: What is the network?](https://weatherxm.com/the-network/) [회사 주장]. 다른 자사 페이지 요약에는 "9,500+ weather stations … across 80+ countries"로 나온다 — [WeatherXM Pro](https://weatherxm.com/weatherxm-pro/) [회사 주장. 시점 차이로 보이는 수치 불일치]
- 보도자료 "WeatherXM Raises $7.7M to Become the Largest Weather Network in the World" — [WeatherXM blog](https://blog.weatherxm.com/weatherxm-raises-7-7m-to-become-the-largest-weather-network-in-the-world-press-release-6c75e041708a?gi=0ff752a2fe16). 검색 요약은 이 글의 날짜를 2026-01-29 로, 누적 조달액을 $13M 로 적었다. 원문을 보지 못했으므로 날짜와 누적액은 미검증이다 — [Crunchbase](https://www.crunchbase.com/organization/weatherxm-b41a) · [PitchBook](https://pitchbook.com/profiles/company/102936-52) [미검증·집계처]
- 2026-02~04 에 그리스 펠로폰네소스에 고정밀 관측소 30기를 설치해 실시간 모니터링·위험 평가 서비스를 제공할 계획이다 — [WeatherXM 홈](https://weatherxm.com/) [출처 특정 불가, 회사 주장]
- 2024 년 WeatherXM Pro 출시를 "building the demand side of their tokenomics by selling weather data both on and off-chain"으로 평가한 기사가 있다 — [DePIN Scan, 2025-02-19](https://depinscan.io/news/2025-02-19/weatherxm-s-ambitious-roadmap-for-2025) [12개월+]. WeatherXM Pro 는 쓴 만큼 내는 셀프서브 API 이고, 최소 약정이 없으며 무료 티어가 있다 — [WeatherXM Pro](https://weatherxm.com/weatherxm-pro/)
- 토큰 설계는 burn-and-mint equilibrium 이다. USD 에 고정된 Data Credits 로 데이터를 사고, WXM 을 DC 로 바꿀 때 소각한다 — [Blockspot](https://blockspot.io/coin/weatherxm/) [미검증·집계처]

**Nubila (기상·ESG 데이터 DePIN)**
- 태양광 기상 관측기 "Marco"로 데이터를 모으고 보상을 준다. 온도·습도·공기질 등을 수집해 보험 프로토콜·MachineFi·AI 시스템에 공급한다고 설명한다 — [DePIN Hub: Nubila](https://depinhub.io/projects/nubila) [회사 주장·집계처]
- 검색 시점 활성 기기 20,409대, "20,000+ devices across 120+ countries" — [DePIN Scan explorer](https://depinscan.io/projects/nubila-network) · [DePIN Hub](https://depinhub.io/projects/nubila) [미검증·집계처]
- "18,000+ Marco devices deployed and 15,000 validator nodes sold as of late 2024" — [Validatus (Medium)](https://validatus.medium.com/nubila-the-rise-of-decentralized-weather-intelligence-edd565a0d437) · [PassiveBites](https://passivebites.beehiiv.com/p/hyperlocal-weather-meets-depin-why-i-m-watching-nubila) [출처 특정 불가, 의견] [12개월+]
- BloomSky 를 인수했다. BloomSky 는 10년치 초지역 기상 기록 100TB 와 스카이 카메라를 단 관측기를 갖고 있다 — [Decrypt](https://decrypt.co/250020/nubila-network-acquires-bloomsky-to-advance-real-time-hyperlocal-weather-data-collection) [날짜 원문 미확인, 2024 추정] [12개월+]
- $8M 조달이 보도됐다 — [Ventureburn](https://ventureburn.com/nubila-raises-8-million/) [날짜 미확인]
- 판매 채널: Amazon 에 **"Nubila Marco Weather Station Miner"**라는 이름으로 올라와 있다 — [Amazon](https://www.amazon.com/Nubila-Marco-Weather-Station-Miner/dp/B0F1PRSKFL). DePIN 하드웨어 전문몰에서도 팔리며, 리뷰 제목은 "A Passive Weather Crypto Miner Worth Considering?"이다 — [heliumdeploy](https://heliumdeploy.com/collections/nubila) · [depinhouse 리뷰](https://depinhouse.shop/blogs/behind-the-gear/nubila-marco-review-a-passive-weather-crypto-miner-worth-considering) [의견]

**Silencio (소음 DePIN, 스마트폰 기반)**
- 사용자 100만 명 이상, 데이터 포인트 200억 개. 2025 년에는 185개국 사용자 120만 명으로 늘었다고 한다 — [DePIN Hub: Silencio](https://depinhub.io/projects/silencio) · [Gate Learn](https://www.gate.com/learn/articles/what-is-silencio-network-slc/7313) [미검증·집계처]
- 소음·위치·POI 데이터를 "major partners (Google, Oracle, Airbnb, etc)"에 팔고 앱 안 영상 광고를 붙여 **"5-digit monthly revenue"**를 낸다고 주장한다. 데이터는 Datarade·Google Cloud Analytics Hub 에서 팔고, 매출의 75% 를 네트워크로 돌려 일부를 바이백·소각한다고 한다 — [Silencio: The Road Ahead for Silencio and $SLC](https://silencionetwork.medium.com/the-road-ahead-for-silencio-and-slc-cbb7db3e103e) · [DePIN Space](https://depinspace.co/blog/the-5-trillion-problem-you-didnt-hear-coming-how-silencio-turns-noise-into-value/) [출처 특정 불가, 회사 주장·홍보성. 게시일 원문 미확인]
- Silencio 공식 X 의 "The State of DePIN in 2025" 게시물(2025-04-14, 게시물 ID 로 역산) — [X @silencioNetwork](https://x.com/silencioNetwork/status/1911749415389299153) [12개월+]

**XRPL 위 센싱·데이터 DePIN**
- "XRPL DePIN IoT sensor data" 류로 검색했지만 XRPL 네이티브 환경 센싱 DePIN 은 나오지 않았다. 확인된 것은 XRPL 로 IoT 기기를 제어하는 샘플 코드 저장소와 생태계 목록뿐이다 — [GitHub N3TC4T/xrpl-iot](https://github.com/N3TC4T/xrpl-iot) · [awesome-xrpl](https://github.com/wojake/awesome-xrpl)
- XRPL 과 연결된 환경 데이터 사례로는 탄소 프로젝트 데이터 플랫폼 Centigrade 가 있다. XRPL 기여자인 Ripple 의 지속가능성 페이지에 소개돼 있지만 센싱 DePIN 은 아니다 — [Ripple Impact: Sustainability](https://ripple.com/impact/sustainability/)
- XRPL Commons 지속가능성 대시보드는 XRPL 자체의 에너지·배출을 보여 주는 도구이고, 센싱 DePIN 사례가 아니다 — [XRPL Commons: Sustainability dashboard](https://www.xrpl-commons.org/sustainability/dashboard)

### Inferences
- **교훈 1 — 기기·데이터 공급망은 계약으로 묶어야 한다.** PlanetWatch 의 가장 구체적인 실패는 토큰이 아니었다. 타사 기기 클라우드의 무상 API 에 기댄 것이 문제였다(Awair 측 주장 기준으로 무상 한도 하루 7,000건, 실사용 하루 160만 건). 기기 파트너와 데이터 흐름 비용·권리·해지 조건을 계약으로 정해 두지 않으면 네트워크의 한 축이 하루 만에 끊길 수 있다.
- **교훈 2 — 참여권을 기기보다 먼저 팔지 말 것.** 라이선스(참여권)를 먼저 팔자 "센서 없는 라이선스"가 생겼고, 환불과 로열티 프로그램으로 메우는 일이 반복됐다(2022). 기기 공급이 늦어지면 곧바로 신뢰 문제가 된다.
- **교훈 3 — 토큰·체인 교체는 참여자가 비용을 치른다.** 흐름은 이랬다. 상장폐지(2023-09) → 인수와 솔라나 이전, 40:1 전환(2024) → 새 토큰 출시(2025). 기기 보유자는 두 번 갈아타야 했다. 보상 체계가 체인·토큰 교체에 흔들리면 기기를 떠나는 이유가 된다.
- **교훈 4 — "배포 대수"는 외부 검증을 견디지 못한다.** 같은 계보의 네트워크에 21,000 / 3,000 / 8,000 / 25,000(그리고 내부 기록의 "7만 주장") 같은 서로 다른 수치가 함께 돈다. 내부 기록상 온라인 4,097 대 누적 8,000+ 라는 차이도 있다. 외부는 가동(온라인) 지점과 데이터 매출을 본다.
- **교훈 5 — 수요 측은 늘 네트워크를 다 만든 뒤에 만들었다.** WeatherXM Pro(2024)와 Ambios 의 SAP·Datarade·Databricks 등재(2025)는 모두 네트워크를 먼저 깔고 수요 측을 나중에 만든 순서였다. 수요 측을 세우는 데 몇 년이 걸렸고, 그동안 투자 유치(Ambient 시드, WeatherXM, Nubila)와 토큰 배출이 네트워크를 떠받쳤다.
- **교훈 6 — "Miner" 프레이밍은 수익을 기대하는 구매자를 부른다.** Nubila 기기가 Amazon 과 전문몰에서 "Miner"로 팔린다. 보상이 줄면 기기가 방치될 위험이 크고, PlanetWatch 의 비활성 라이선스와 내부 기록상 배포 대비 온라인이 절반 수준이라는 점이 그 정황과 맞는다. 보상이 테스트 단계이고 보장되지 않는 구조라면 이 프레이밍은 맞지 않는다.
- **XRPL 에는 선례가 없다.** 그래서 "XRPL 위라서 생기는 환경 데이터 수요"는 외부 증거로 입증할 수 없다. 수요 논거는 체인이 아니라 데이터 품질과 구매자 쪽에서 세워야 한다.

### Gaps
- AirGradient 가 쓴 DePIN 경험담 "Navigating the DePIN Frontier"는 오픈소스 공기질 측정기 제조사의 1차 증언일 가능성이 높다. airgradient.com 이 차단돼 읽지 못했다 — [AirGradient blog](https://www.airgradient.com/blog/airgradient-x-depin)
- PlanetWatch 의 최대 센서 수, 라이선스 판매 수, 실제 데이터 매출에 대한 1차 수치를 찾지 못했다. 내부 문서의 "커뮤니티 7만 센서 주장(2021~22, 2차 자료)"과 CBS Miami 의 "21,000+"가 서로 맞지 않는다.
- Awair 분쟁에 대한 PlanetWatch 측 반론(2022-03-30 성명)은 원문을 확인하지 못했다. 현재 기록은 Awair 쪽 주장뿐이다.
- Ambios 의 데이터 매출, 계약 건수, 유료 고객 이름은 공개 자료에서 찾지 못했다. 내부 검토 문서에는 다음 항목이 있지만 원출처 URL 이 없거나 이번 세션에서 확인할 수 없었다: 2025-05 에어드랍 설계 오류 인정, 자사가 공개한 배치·제휴 목록(요식업 프랜차이즈·호텔·Synoptic 등, 유상 계약인지 불명), 2026 Google Cloud 스타트업 프로그램 그랜트.
- WeatherXM 의 데이터 매출(데이터 크레딧 소각량 등) 공개치를 찾지 못했다. "WeatherXM 이 데이터를 팔지 못했다"는 단정에는 원출처가 없고, 내부 기록에서도 인용 금지로 분류돼 있으니 쓰지 말 것.
- WeatherXM $7.7M 보도자료의 실제 게시일(2026-01-29 인지)을 확인하지 못했다. 과거 라운드일 가능성도 배제할 수 없다.
- Nubila 의 기반 체인, 유료 고객, 매출은 확인하지 못했다.
- 한국·아시아권 공기질 DePIN 과 그 밖의 소음 DePIN 은 검색 한도가 소진돼 더 찾아보지 못했다.
- 센서 보정·데이터 품질 문제로 보상이 깎이거나 부정 기기(스푸핑)가 적발된 사례(예: WeatherXM 데이터 품질 점수)의 1차 자료를 찾지 못했다.
- 증권성·소비자 보호 같은 규제 문제로 제재받은 환경 DePIN 사례를 찾지 못했다.

## 2. DePIN 에서 나온 환경 데이터에 누가 돈을 냈나 — 규모와 판매 방식, 토큰 배출이 아닌 실제 데이터 매출의 증거는?

### Takeaway
환경 센싱 DePIN 에서 이름까지 확인되는 돈의 흐름은 그랜트(Algorand Foundation), 시드 투자(Ambient $2M, WeatherXM, Nubila), 기기·라이선스 판매, 토큰 배출이다. 데이터 매출은 자기 발표(Silencio 의 "5-digit monthly revenue")와 마켓플레이스 등재(Ambios: SAP Datasphere·Datarade·Databricks·Google Cloud·Synoptic) 수준에 머문다. 감사받았거나 공시된 데이터 매출은 찾지 못했다. 비크립토 쪽에서 가장 큰 공기질 데이터 거래는 Google 의 BreezoMeter 인수(2022-09, 보도 기준 2억 달러 이상)다. Google 이 산 것은 센서 네트워크가 아니라 **여러 출처를 융합한 모델과 API 유통**이었다.

### Cited Findings

**DePIN 쪽**
- Ambios 데이터는 Synoptic·Datarade·Databricks·Google Cloud 마켓에서 유통되고, 2025-07 SAP Datasphere 에 등재됐다 — [Messari](https://messari.io/project/ambios-network/profile) [미검증·집계처] [12개월+]. Datarade 에 판매자 프로필이 있다. 구매 후기나 계약 증거는 열어 보지 못했다 — [Datarade: Ambios Network](https://datarade.ai/data-providers/ambios-network/profile)
- 전신 PlanetWatch 의 초기 도시 배치는 Algorand Foundation 그랜트와 함께 발표됐다 — [PR Newswire](https://www.prnewswire.com/news-releases/planetwatch-activates-innovative-air-quality-monitoring-in-two-key-italian-cities-and-announces-grant-from-the-algorand-foundation-301159916.html) [12개월+]
- Silencio 는 데이터 판매와 앱 광고로 "5-digit monthly revenue"를 낸다고 스스로 발표했다. 데이터는 Datarade·Google Cloud Analytics Hub 에서 판다 — [Silencio (Medium)](https://silencionetwork.medium.com/the-road-ahead-for-silencio-and-slc-cbb7db3e103e) [회사 주장, 감사 안 됨]
- WeatherXM Pro(2024)는 토크노믹스의 "demand side"를 만들려는 제품으로 소개됐다 — [DePIN Scan](https://depinscan.io/news/2025-02-19/weatherxm-s-ambitious-roadmap-for-2025) [12개월+]. 셀프서브 사용량 과금 API 다 — [WeatherXM Pro](https://weatherxm.com/weatherxm-pro/). 검색 결과 요약도 "specific revenue figures … not available"로 정리했다 — [PitchBook](https://pitchbook.com/profiles/company/102936-52) [미검증·집계처]
- Nubila 는 보험 리스크 모델·농업·재생에너지·물류에 쓰인다고 내세우지만 유료 고객 이름은 없다 — [Nubila: data](https://nubila.ai/data) [회사 주장]. 대신 10년치 데이터를 가진 BloomSky 를 인수했다 — [Decrypt](https://decrypt.co/250020/nubila-network-acquires-bloomsky-to-advance-real-time-hyperlocal-weather-data-collection) [12개월+]

**비교: 비크립토 네트워크의 데이터 수익화와 활용**
- Google 이 BreezoMeter 를 인수했다(2022-09). 보도 기준 "over $200 million"이다 — [Ctech (Calcalist)](https://www.calcalistech.com/ctechnews/article/sycbrdpbi) [12개월+]. $225M 이라는 수치도 검색 요약에 나오지만 출처를 특정할 수 없다 [미검증]. 이후 Air Quality·Pollen API 가 Google Maps Platform 제품이 됐다 — [Globes](https://en.globes.co.il/en/article-google-launches-applications-based-on-breezometer-acquisition-1001456420) · [Entrée Capital](https://entreecap.com/resource/news/breezometer-acquired-by-google-has-introduced-its-new-air-quality-api)
- BreezoMeter 는 전 세계 47,000개 이상의 센서, 위성, 교통 데이터를 모델에 결합한다 — [American Technion Society](https://ats.org/our-impact/google-acquires-israeli-startup-breezometer/) · [SunsetHQ](https://www.sunsethq.com/blog/breezometer-acquisition) [출처 특정 불가]
- PurpleAir 는 공개 데이터를 쓰임새에 따라 개인·비영리용부터 교육·상업용까지 다른 라이선스로 나눈다 — [PurpleAir Data License](https://www.purpleair.com/license). API 는 호출할 때마다 포인트가 빠지는 과금이고, 센서 보유자는 자기 센서 데이터를 무료로 받는다 — [PurpleAir API](https://www.purpleair.com/api) · [PurpleAir Community: API Pricing](https://community.purpleair.com/t/api-pricing/4523) (요율은 이 노트 규칙에 따라 생략)
- EPA 와 US Forest Service 의 AirNow Fire and Smoke Map(2020-08 파일럿)은 PurpleAir PM2.5 데이터를 QC 하고 미국 전역 보정식을 적용한 뒤 보여 준다. 보정식은 저농도의 습도 편향과 고농도의 비선형 반응을 바로잡는 구간 회귀다 — [EPA webinar archive](https://www.epa.gov/research-states/airnow-fire-and-smoke-map-extension-us-wide-correction-purpleair-pm25-sensors) · [EPA: Technical Approaches for the Sensor Data on the AirNow Fire and Smoke Map](https://epa.gov/air-sensor-toolbox/technical-approaches-sensor-data-airnow-fire-and-smoke-map) · [AirNow Fire and Smoke Map Q&A (PDF)](https://document.airnow.gov/airnow-fire-and-smoke-map-questions-and-answers.pdf) [12개월+ (파일럿 시점)]. 이것은 공공의 "활용"이며, 대금을 치렀는지는 확인하지 못했다.
- IQAir 2025 World Air Quality Report(2026 발표, 정확한 날짜 미확인): 규제 측정소와 저가 센서 40,000개 이상을 정부·대학·NGO·민간기업·시민과학자가 운영한다. 143개국·지역의 9,446개 도시를 다뤘다. **비정부 측정기가 56개국의 유일한 실시간 데이터원**이었고, 아프리카와 서아시아는 각각 전 세계 측정소의 약 1% 에 그친다. WHO 권고 기준을 충족한 도시는 14% 뿐이다 — [IQAir 보도자료](https://www.iqair.com/newsroom/waqr-2025-pr) · [PR Newswire](https://www.prnewswire.com/news-releases/iqairs-2025-world-air-quality-report-finds-only-14-of-cities-meet-who-air-pollution-guideline-302720338.html)

### Inferences
- "데이터 매출이냐, 토큰 배출이냐"를 가를 외부 증거는 한쪽으로 치우쳐 있다. 배출, 기기 판매, 투자 유치는 기록이 있다. 데이터 매출은 자기 발표(가장 큰 것이 월 수만 달러대 주장인 Silencio)나 등재 사실뿐이다. 기관과의 대화에서 동종 DePIN 을 "데이터 매출 선례"로 인용할 1차 근거는 현재 없다.
- 공기질 데이터의 큰 거래(Google–BreezoMeter)는 원시 센서 데이터를 판 것이 아니다. 여러 출처를 융합한 모델·API 를 대형 플랫폼 유통망에 올린 형태였다. 원시 센서 데이터는 PurpleAir·IQAir 처럼 공개 데이터는 무료나 저가로 풀고, 상업 라이선스와 API 과금을 따로 받는 이원 구조가 일반적이다. 공공기관은 보정을 거쳐 "활용"하는 쪽이다.
- 마켓플레이스 등재(Datarade·SAP·Google Cloud)는 구매 절차 안에 물건을 진열한 것일 뿐 매출 증거가 아니다. 등재 뒤에 구매 실적이 공개되는지가 판단 기준이다.
- IQAir 자료가 보여 주듯 저가 센서 데이터는 정부 측정망이 비어 있는 곳(56개국)에서 가치가 크다. 반대로 정부망이 촘촘한 한국에서는 옥외 데이터의 한계가치가 낮을 수 있다. 정부망이 없는 **가정 실내**가 차별 여지가 있는 영역이다(추론).

### Gaps
- 어떤 기업이나 기관이 DePIN 발 환경 데이터를 얼마에 샀는지 이름과 규모까지 확인된 사례는 이번 범위에서 0건이다.
- 등재 뒤 Ambios 의 실제 구매 실적, WeatherXM 의 데이터 크레딧 소각 실적, Nubila 의 유료 고객은 확인하지 못했다.
- PurpleAir·IQAir·Airthings 매출에서 데이터 라이선스가 차지하는 비중은 확인하지 못했다.
- EPA 가 PurpleAir 데이터에 대금을 치르는지 확인하지 못했다.

## 3. 실내공기질 데이터의 현실적인 구매자는 누구이고, 어떤 데이터 품질과 인증을 요구하는가?

### Takeaway
실내공기에 돈을 쓰는 쪽은 주로 **건물(인증과 운영)**과 **공공 시설(학교·어린이집·지하역사)**이다. 이들은 원시 데이터 피드보다 **인증이나 규정을 통과하는 측정 체계**를 산다. 예를 들면 RESET Air(인증 모니터 Grade B, 인증 데이터 제공자), WELL v2(정확도, 설치 밀도, 매년 재보정 서류), 한국 실내공기질 관리법(형식승인 측정기)이다. 환기 설비 제조사 Zehnder 가 Airthings 의 기업(Business) 부문 자산 인수를 추진한 일(2025-06, 결렬)은 HVAC 쪽의 전략적 수요 신호다. 보험사가 가정 실내공기 데이터를 샀다는 증거는 찾지 못했다.

### Cited Findings

**건물 인증**
- RESET Air: 인증 모니터 시험은 Grade B 성능을 확인하는 것이 목적이다. 요건은 최소 5분 간격 연속 측정, PM2.5·CO₂·TVOC·온도·상대습도 추적, 온라인 플랫폼이나 데이터 제공자(가급적 RESET 인증 데이터 제공자)로 전송, 재실자에게 표시, 벽 부착형이다. Grade B 는 "commercial-grade monitors"로 정의된다 — [RESET Air Accredited Monitor Process](https://www.reset.build/programs/monitors/process-air) · [RESET Air standard](https://www.reset.build/standard/air) [게시일 미확인]
- WELL v2 A08(공기질 모니터링): 3개 이상 항목을 Performance Verification Guidebook 의 연속 모니터링 정확도로 재야 한다(예: PM2.5/PM10 은 1–100 µg/m³ 구간에서 ±5 µg/m³ + 20%). CO₂ 는 10분 이내, 다른 오염물질은 1시간 이내 간격으로 측정한다. **매년 재보정하거나 교체하고 그 서류를 WELL Online 에 낸다.** 325 m² 당 1대 이상을 바닥에서 1.1–1.7 m 높이에, 문·창·급배기구에서 1 m 이상 떨어뜨려 설치한다 — [Kaiterra 가이드](https://learn.kaiterra.com/en/resources/air-quality-monitoring-for-well-certification) · [Nuvap](https://www.nuvap.com/well-v2-certification-indoor-air-quality-a-key-metric/?lang=en) · [Atmotube](https://atmotube.com/blog/air-quality-monitoring-for-well-certification) [벤더가 정리한 요약. IWBI 원문 미확인, 게시일 미확인]
- LEED v5 의 모니터 요구사항을 정리한 벤더 가이드가 있지만 내용은 열어 보지 못했다 — [Kaiterra: LEED v5 Air Quality Monitor Requirements](https://learn.kaiterra.com/en/resources/leed-v5-air-quality-monitor-requirements-hardware-standards)
- Awair 는 소비자용(Original, 2nd Edition, Element, Glow C)에서 기업용 Omni 로 넓혔고, Omni 는 RESET 인증 기업용 모니터다. Element 와 Omni 를 함께 판매한다 — [seetheair 리뷰(2021-04-29)](https://seetheair.org/2021/04/29/review-awair-omni-b2b-air-quality-monitoring-solution/) [의견] [12개월+] · [Awair](https://www.getawair.com/)

**환기·HVAC 제조사**
- 2025-06-16: Airthings 와 Zehnder Group 이 비구속 독점 LOI 를 맺었다. Zehnder 가 Business 부문의 운영 자산 전부(기술, **고객 계약**, 재고, 인력)를 넘겨받고, 7월 초까지 본계약을 목표로 했다. 매각 목적은 "fast-growing global consumer market for indoor air quality"에 쓸 자금 확보였다. **2025-07-08 에 "differing views on execution complexities and timing"을 이유로 LOI 를 끝냈다.** 그 전에 Firda 와의 LOI 는 매각 뒤 Airthings 의 재무 안정성에 대한 우려로 멈췄다 — [Airthings: LOI with Zehnder Group](https://www.airthings.com/newsroom/airthings-signs-letter-of-intent-zehnder-group) · [Euronext 공시](https://live.euronext.com/en/products/equities/company-news/2025-06-16-airthings-asa-airthings-signs-letter-intent-sell-business) · [Airthings: Update on contemplated sale … and status of the company](https://www.airthings.com/newsroom/airthings-asa-update-on-contemplated-sale-of-business-segment-assets-and-status-of-the-company) [12개월+]

**정부·공공**
- 영국 교육부는 2021 가을학기에 £25M 을 들여 모든 공립 교육기관(유아·학교·FE 칼리지)에 CO₂ 모니터를 보급했다. 2021-12-10 까지 **353,932대**를 배송해 목표(300,000대 이상)를 넘겼다. 특수학교와 대안교육기관에 먼저 배송했고, 이후 공기청정 장치 배송 통계도 따로 냈다 — [GOV.UK: CO2 monitors cumulative delivery statistics](https://explore-education-statistics.service.gov.uk/find-statistics/co2-monitors-cumulative-delivery-statistics) · [GOV.UK: Delivery of air cleaning units, 2022 week 26](https://explore-education-statistics.service.gov.uk/find-statistics/delivery-of-air-cleaning-units/2022-week-26) [12개월+]
- 한국의 학교·어린이집·지하역사는 5번 항목을 볼 것.

**보험**
- 보험사가 가입자에게 실내공기 측정기를 주거나 가정 실내공기 데이터를 산 사례는 검색에 나오지 않았다. 나온 것은 세 가지다: 실내공기질·곰팡이 **환경배상책임 보험 상품**(Great American), 보험사를 상대로 한 IAQ 조사·자문 서비스(Indoor Science), 공기질 데이터 벤더가 언더라이팅 활용을 주장하는 블로그(Ambee) — [Great American: Indoor Air Quality and Mold](https://www.greatamericaninsurancegroup.com/about-us/business-operations/product/environmental/indoor-air-quality-and-mold) · [Indoor Science: Insurers](https://indoorscience.com/who-we-serve/insurers/) · [Ambee blog](https://www.getambee.com/blogs/how-air-quality-data-can-help-with-better-insurance-underwriting) [의견·벤더]

**저가 센서 데이터 품질 기준**
- EPA 는 2021-02 에 PM2.5 와 O₃ 센서의 성능 시험 프로토콜·목표치 보고서를 냈고, 2024-02 에 PM10 과 NO₂·CO·SO₂ 보완 보고서를 냈다. 적용 범위는 **옥외·고정 설치·비규제 보충/정보 제공(NSIM)**이다. 이 기술의 데이터 품질은 "highly variable"하고, 그동안 통일된 시험 기준이 없었다는 것이 보고서를 낸 배경이다 — [EPA: Air Sensor Performance Targets and Testing Protocols](https://epa.gov/air-sensor-toolbox/air-sensor-performance-targets-and-testing-protocols) · [EPA Science Matters: NO2, CO, SO2, PM10](https://www.epa.gov/sciencematters/epa-adds-performance-testing-protocols-and-targets-no2-co-so2-and-pm10-air-sensors) · [EPA Science Inventory: PM2.5 report](https://cfpub.epa.gov/si/si_public_record_Report.cfm?Lab=CEMM&dirEntryId=350785) [12개월+]
- EPA 는 센서 원시값이 "out-of-the-box" 상태로는 규제 측정기와 비교할 수 없다고 보고, 지도에 올리기 전에 QC 와 보정식을 적용한다 — [EPA: Technical Approaches](https://epa.gov/air-sensor-toolbox/technical-approaches-sensor-data-airnow-fire-and-smoke-map)
- 한국 다중이용시설용 측정기는 「환경분야 시험·검사 등에 관한 법률」 제9조제1항에 따른 **형식승인**을 받아야 한다 — [찾기쉬운 생활법령정보: 취약계층 이용시설 등의 실내공기질 관리](https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1394&ccfNo=3&cciNo=2&cnpClsNo=1)

### Inferences
- 실내 데이터의 B2B 구매자는 "데이터 피드"보다 **인증을 통과하는 측정 체계와 보고서**를 산다. 가정에 놓인 DePIN 센서는 어느 상업 건물의 인증이나 규정 대상도 아니므로, 건물 인증 시장에 바로 팔기 어렵다. 가정 데이터를 살 쪽은 인증 시장보다 **집계·코호트 분석 수요**(공중보건 연구, 가전·환기 제조사의 제품 기획, 지자체 정책)일 가능성이 높다. 다만 그런 구매의 1차 사례는 이번에 찾지 못했다.
- 요구 품질에는 공통분모가 있다: 정해진 측정 간격(5~10분), 핵심 항목(PM2.5·CO₂·TVOC·온습도), **매년 재보정과 그 서류**, 인증받은 모니터와 데이터 제공자, 한국에서는 형식승인이다. 원장에 남기는 지문(무결성)은 "데이터가 위조되지 않았다"는 질문에는 답한다. 그러나 "데이터가 정확한가(보정)"에는 답하지 못하고, 구매자는 두 가지를 다 요구한다.
- Zehnder 의 인수 시도는 HVAC 제조사가 IAQ 센서 기업에서 보는 가치가 **고객 계약과 설치 기반**에 있음을 보여 준다(매각 자산 목록에 고객 계약이 들어 있다).
- 현재 증거로 보면 보험은 "데이터 구매자"가 아니라 곰팡이·IAQ 분쟁이 생긴 뒤 조사하는 영역이다.

### Gaps
- LEED v5 와 Fitwel 의 모니터·데이터 요구 원문(USGBC·Fitwel)은 열어 보지 못했다. 검색 요약에 Fitwel 과 Awair 의 제휴(Awair Omni 센서 데이터를 Fitwel 인증 플랫폼에 직접 연동)가 나왔지만 원문 URL 을 확보하지 못해 인용에서 뺐다.
- GRESB 같은 ESG 보고 체계가 IAQ 데이터를 요구하는지 찾지 못했다.
- 프롭테크·부동산(REIT)이 IAQ 데이터에 비용을 낸 사례를 찾지 못했다.
- 공기청정기·가전 제조사가 제3자 IAQ 데이터를 산 사례를 찾지 못했다.
- 공중보건 연구기관이 실내 데이터를 산 사례(코호트 연구 등)를 찾지 못했다.
- 실내용 저가 센서 성능 기준(EPA 목표치는 옥외용뿐)과 AQ-SPEC 의 실내 평가 결과는 열어 보지 못했다.

## 4. 크립토와 무관한 소비자용 실내공기 측정기는 어떻게 구매자에게 닿는가 — 효과가 확인된 채널은(한국 포함)?

### Takeaway
시장 대표 격인 Airthings 의 공시가 가장 강한 증거다. 소비자 판매의 축은 Amazon(2021 년 최대 채널), 자사몰, 대형 유통(Target·The Home Depot)이다. 2025 년에 **판촉과 대형 할인 행사 참여를 줄이자 소비자 매출이 연간 22% 줄었고, 3분기 출하 대수는 59% 줄었다.** 소비자 측정기 수요는 판촉에 크게 기대고 있다는 뜻이다. B2B(Airthings for Business, 2019~, SaaS)도 매각 추진이 무산됐고, 회사는 2026-02 에 상장폐지됐다. 측정기가 실제로 대량 보급된 경로는 **정부·학교 프로그램**이었다: 영국 교육부 CO₂ 모니터 35만 대, 한국 교실 측정기 설치 의무, 한국 지자체의 어린이집 IoT 지원.

### Cited Findings

**Airthings (소비자 실내공기 측정기 대표 사례)**
- 2025 년 매출 NOK 346m 으로, 2024 년 NOK 414m 보다 16% 줄었다. Consumer 부문이 매출의 73% 를 차지하고 22% 줄었다. 보고서 문구: "2025 has been a year with focus on profitability rather than growth as the company decided to pull back on campaign activity and not participate in non-profit making high velocity sales events" — [Airthings ASA 2025 Annual Report (PDF)](https://www.airthings.com/hubfs/01_Website/investors/reports/Airthings_ASA_2025_Annual_Report_vF.pdf)
- 2025 년 3분기 Consumer 매출은 전년 같은 기간보다 44%, 출하 대수는 59% 줄었다 — [Airthings: Q3 2025 report](https://www.airthings.com/newsroom/airthings-asa-third-quarter-2025-report) · [Q3 2025 PDF](https://www.airthings.com/hubfs/01_Website/investors/reports/Airthings_ASA_Q325_Report.pdf) [발표일 원문 미확인]
- 2021 년 보고서: "Amazon currently represents the company's biggest sales channel, mainly directed towards consumers" — [Airthings Annual Report 2021 (PDF)](https://www.airthings.com/hubfs/Website/investors/reports/airthings-asa-annual-report-2021.pdf?hsLang=en-us) [12개월+]
- Amazon 외에 자사몰(airthings.com), e커머스 파트너, 프리미엄 유통(Target, The Home Depot)으로도 판다. 검색 요약은 이를 2025 년 보고서 내용으로 적었지만 원문을 확인하지 못했다 — [Airthings 2025 Annual Report](https://www.airthings.com/hubfs/01_Website/investors/reports/Airthings_ASA_2025_Annual_Report_vF.pdf). Amazon 공식 스토어에는 라돈 카테고리가 따로 있다 — [Amazon: Airthings Radon store](https://www.amazon.com/stores/Airthings/page/49C53B56-523F-442C-9E86-0F8CC9EF6612)
- 2019 년 Airthings for Business 를 내놓으며 SaaS 로 고마진 반복 매출을 노렸다. 부문은 Consumer, Business, Professional 세 개다 — [Airthings Annual Report 2021](https://www.airthings.com/hubfs/Website/investors/reports/airthings-asa-annual-report-2021.pdf?hsLang=en-us) [12개월+]
- 2025 년 2분기 매출이 11% 줄었고, 상장폐지와 증자를 검토했다 — [Investing.com](https://www.investing.com/news/company-news/airthings-q2-2025-slides-revenue-falls-11-as-company-explores-delisting-and-capital-raise-93CH-4211895) [2차 보도] [12개월+]
- 2025-10 에 상장폐지를 신청했다. Euronext Oslo Børs 마지막 거래일은 2026-02-11 이고, 2026-02-12 부로 상장폐지됐다 — [Airthings: Delisting](https://www.airthings.com/newsroom/airthings-asa-delisting) · [MarketScreener](https://www.marketscreener.com/news/airthings-asa-delisting-ce7d50dbdb8ff226). 2026-02-02 에 Q4 2025 trading update 를 공시했으나 내용은 열어 보지 못했다 — [Euronext](https://live.euronext.com/en/products/equities/company-news/2026-02-02-airthings-asa-q4-2025-trading-update)

**Awair**
- 소비자용 제품군에서 기업용 Omni(RESET 인증)로 넓혔다 — [seetheair (2021-04-29)](https://seetheair.org/2021/04/29/review-awair-omni-b2b-air-quality-monitoring-solution/) [의견] [12개월+]. 2022 년 PlanetWatch 와 갈라선 경위는 1번 항목을 볼 것.

**공공 보급·대여 프로그램**
- 영국 교육부 CO₂ 모니터 353,932대(2021) — 3번 항목, [GOV.UK](https://explore-education-statistics.service.gov.uk/find-statistics/co2-monitors-cumulative-delivery-statistics) [12개월+]
- 미국 EPA 는 도서관 등의 "Air Sensor Loan Programs"(대기 센서 대여 프로그램) 안내 페이지를 운영한다. 내용은 열어 보지 못했다 — [EPA: Air Sensor Loan Programs](https://www.epa.gov/air-sensor-toolbox/air-sensor-loan-programs)
- 한국 교실 측정기 설치 의무와 지자체 어린이집 IoT 지원은 5번 항목을 볼 것.

**DePIN 기기의 판매 채널(비교용)**
- Nubila Marco 는 Amazon 에 "Weather Station Miner"로 올라 있고 DePIN 하드웨어 전문몰에서도 팔린다 — [Amazon](https://www.amazon.com/Nubila-Marco-Weather-Station-Miner/dp/B0F1PRSKFL) · [novyx](https://www.novyx.tech/store/depin-blockchain/nubila-marco-solar-powered-weather-station/)

### Inferences
- 소비자 측정기 판매는 대형 유통, Amazon, 판촉 달력에 묶여 있다. Airthings 2025 사례처럼 판촉을 빼면 판매량이 크게 준다. 한 번 들어오는 이벤트성 유입(예: 채널 공지 한 번)만으로 판매를 이어 가기 어렵다는 외부 정황이다. 팀의 측정 결과(22개 채널에서 태그 세션 약 157, 그중 11곳은 0)와 방향이 같다. 팀 수치는 과제 배경으로 받은 것이고, 이 자리에서 검증하지 않았다.
- 측정기가 대량으로 "설치되고 유지된" 사례는 개인 구매가 아니라 **기관이 비용을 대고 시설에 보급한** 경우였다(영국 학교, 한국 교실·어린이집). 가정 중심 DePIN 이라도 지자체 사업이나 시설 보급을 보조 채널로 검토할 근거가 된다.
- 업계 선두 Airthings 마저 소비자 측정기 사업이 줄고 상장폐지에 이르렀다. "센서 판매" 자체가 성장 사업이 되기 어렵다는 신호다. 기기 판매로 원가를 회수하는 구조라면 판매량 가정은 보수적으로 잡는 편이 외부 증거와 맞는다.
- 측정 수요는 **"재야 할 이유"가 규제나 위기로 주어질 때** 생겼다. 영국 학교의 CO₂ 모니터(코로나 환기), Airthings 의 출발점인 라돈이 그 예다. 한국에서는 미세먼지가 그 역할을 한다(5번 항목).

### Gaps
- Netatmo, Xiaomi, IQAir, 한국 브랜드(삼성·LG 연동 제품과 국내 측정기 업체)의 채널과 판매 데이터는 검색 한도가 소진돼 조사하지 못했다.
- 리뷰·인플루언서 채널(Wirecutter, 유튜브, 네이버 블로그 등)이 측정기 판매에 미친 영향을 수치로 보여 주는 증거를 찾지 못했다.
- 전력회사·유틸리티의 측정기 보조금·리베이트 프로그램을 찾지 못했다.
- 노르웨이 임대주택 라돈 규정 같은 규제발 수요의 1차 근거와, 라돈이 Airthings 매출에 기여한 정도는 열어 보지 못했다.
- Airthings 의 최신 채널별 매출 비중(Amazon 비중 등)은 열어 보지 못했다.
- 가정용 측정기를 설치한 뒤 N개월 가동률 같은 장기 유지율 외부 데이터를 찾지 못했다(구매 후 계속 쓰는지에 대한 증거).

## 5. 한국에서 가구와 시설의 실내공기 측정 수요를 만드는 규제와 국민 관심 지표는?

### Takeaway
시설 쪽은 법이 수요를 만든다. 실내공기질 관리법(다중이용시설 유지·권고기준, 지하역사 PM2.5 측정기 부착 의무, 형식승인 측정기를 달고 스스로 잰 경우의 과태료 특례), 학교 교실의 공기정화설비·미세먼지 측정기 설치 의무, 지자체 어린이집 IoT 측정 사업(인천 2024 년 20곳 → 2025 년 150곳, 양천구 누적 34곳, 2026-08 보도)이 그것이다. 가구 쪽은 법적 의무가 확인되지 않는다. 수요는 **미세먼지 불안(2024 사회조사 67.4%, 환경 불안 1위)**과 공기청정기 보유 같은 가전 소비로 나타난다. 공기청정기·측정기 시장 규모의 1차 출처 수치는 찾지 못했다.

### Cited Findings

**국민 관심**
- 2024 사회조사(2024-11-12 발표): 환경 불안 요인 1위는 미세먼지(67.4%)이고, 기후변화(53.2%), 방사능(47.5%), 유해화학물질(41.9%)이 뒤를 잇는다. 환경보호를 위한 세금 부담 찬성은 50.2% 로 2년 전보다 0.1%p 올랐다 — [국가데이터처(구 통계청) 보도자료](https://kostat.go.kr/board.es?mid=a10301010000&bid=219&act=view&list_no=433638) · [정책브리핑 전문자료](https://www.korea.kr/archive/expDocView.do?docId=41129) [12개월+ — 격년 조사라 이것이 최신 차수이고, 다음 차수는 2026 년 하반기 발표로 예상(추론)]
- 「2024 국민환경의식조사」가 있다. 내용은 열어 보지 못했다 — [NKIS](https://www.nkis.re.kr/subject_view1.do?otpId=OTP_0000000000015914&otpSeq=0)

**시설 규제 — 실내공기질 관리법**
- 다중이용시설 측정기 부착은 원칙적으로 **권고**다. 기후에너지환경부장관은 실태 파악을 위해 소유자 등에게 형식승인 측정기를 달고 시행규칙 별표 1의2 기준에 따라 운영·관리하도록 **권고할 수 있다** — [찾기쉬운 생활법령정보: 취약계층 이용시설 등의 실내공기질 관리](https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1394&ccfNo=3&cciNo=2&cnpClsNo=1)
- **측정기 부착에는 과태료 인센티브가 있다.** 유지기준에 맞게 관리하지 않은 소유자 등에게는 1천만원 이하 과태료가 부과된다. 다만 **측정기를 달아 스스로 잰 결과가 유지기준을 넘은 경우는 제외**된다 — 같은 출처. 측정 주기는 유지기준 항목(별표 2)이 연 1회, 권고기준 항목(별표 3)이 2년 1회로 요약됐다. 측정기 부착 여부와 어떻게 연결되는지는 원문 확인이 필요하다 — 같은 출처 · [찾기쉬운 생활법령정보: 실내주차장 등](https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1394&ccfNo=3&cciNo=3&cnpClsNo=1)
- **지하역사 소유자 등에게는 형식승인 초미세먼지(PM-2.5) 측정기 부착이 의무**다. 측정 결과를 실내공기질 관리 종합정보망(inair.or.kr)에 입력하면 기록·보존 의무를 이행한 것으로 본다. 측정 시기는 1월 1일부터 6월 30일까지다 — [찾기쉬운 생활법령정보: 지하역사 등 다중이용시설의 실내공기질 관리](https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=1394&ccfNo=3&cciNo=1&cnpClsNo=1)
- 의료기관, 산후조리원, 노인요양시설, 어린이집, 실내 어린이놀이시설 같은 취약계층 이용시설에는 더 엄격한 유지기준이 적용된다 — [찾기쉬운 생활법령정보: 건물 위생관리 > 실내공기질 유지·관리](https://www.easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=1827&ccfNo=4&cciNo=1&cnpClsNo=2)
- 검색 요약에 따르면 시행규칙 중 2025-10-01 시행분과 2026-01-01 시행분이 있고, 시행령과 시행규칙의 일부개정령(안) 입법예고도 올라와 있다. 개정 내용은 확인하지 못했다 — [국가법령정보센터: 실내공기질 관리법 시행규칙](https://www.law.go.kr/lsInfoP.do?lsId=008375) · [nepla: 시행규칙(현행 2026.01.01.)](https://www.nepla.ai/law/%EC%8B%A4%EB%82%B4%EA%B3%B5%EA%B8%B0%EC%A7%88-%EA%B4%80%EB%A6%AC%EB%B2%95-%EC%8B%9C%ED%96%89%EA%B7%9C%EC%B9%99) · [법제처 입법예고(시행령)](https://www.moleg.go.kr/lawinfo/makingInfo.mo?mid=a10104010000&lawSeq=61359&lawCd=0&lawType=TYPE5&currentPage=1&keyField=&keyWord=&stYdFmt=&edYdFmt=&lsClsCd=&cptOfiOrgCd=) · [법제처 입법예고(시행규칙)](https://www.moleg.go.kr/lawinfo/makingInfo.mo?mid=a10104010000&lawSeq=61360&lawCd=0&lawType=TYPE5&currentPage=1&keyField=&keyWord=&stYdFmt=&edYdFmt=&lsClsCd=&cptOfiOrgCd=)
- 기후에너지환경부(당시 환경부) 보도자료 「지하역사 미세먼지, 엄격하게 관리한다」가 있다. 내용과 날짜는 열어 보지 못했다 — [기후에너지환경부](https://mcee.go.kr/home/web/board/read.do?boardCategoryId=39&boardId=850180&boardMasterId=1&decorator=&maxIndexPages=10&maxPageItems=10&menuId=&orgCd=&pagerOffset=960&searchKey=&searchValue=)

**학교**
- 학교(고등교육법상 학교 제외)는 교실마다 공기정화설비와 미세먼지 측정기기를 설치해야 한다. 측정기기는 실시간 미세먼지 측정기기나 교육부장관이 인정한 기기다 — [찾기쉬운 생활법령정보: 학교 공기질 관리](https://www.easylaw.go.kr/CSP/CnpClsMain.laf?csmSeq=1394&ccfNo=4&cciNo=3&cnpClsNo=2) · [생활법령 Q&A: 학교 공기정화설비 등 설치](https://easylaw.go.kr/CSP/OnhunqueansInfoRetrieve.laf?onhunqnaAstSeq=96&onhunqueSeq=5517) [조문 번호와 시행일은 원문 미확인]
- 교육부는 「학교 공기정화장치 설치 및 유지관리 업무 안내서」를 2019-08 에 마련했고, 5차 개정판이 있다. 경기도교육청은 「학교 공기질 측정·관리 업무 매뉴얼」(2022)을 냈다 — [정책브리핑](https://www.korea.kr/news/policyNewsView.do?newsId=148863562) · [학교보건포털](https://www.schoolhealth.kr/web/bbs/selectNewBBSList.do?lstnum1=3416) · [경기도교육청 매뉴얼(PDF)](https://www.goe.go.kr/resource/old/BBSMSTR_000000030132/BBS_202206220914023430.pdf) [12개월+]

**지자체 어린이집 IoT 사업 (B2G)**
- 인천시 「건강지킴이 실내공기질 스마트관리 사업」: IoT 로 PM10·PM2.5·CO₂·휘발성유기화합물·온습도를 실시간으로 재고, 그에 따라 공기청정기와 환기장치를 작동시킨다. 2024 년 어린이집 20곳에서 처음 시범 운영했고 **참여 기관의 98% 가 만족**했다. 2025 년에는 150곳으로 넓혀, 5월에 50곳을 뽑고 8~9월에 100곳을 더 모집했다 — [인천시 보도자료](https://www.incheon.go.kr/IC010205/view?repSeq=DOM_0000000012837506&curPage=1) · [브릿지경제(2025-08-01)](https://www.viva100.com/article/20250801500270) · [산경e뉴스](https://www.skenews.kr/news/articleView.html?idxno=40465) [12개월+ (2025-08)]
- 서울 양천구(2026-08-17 보도): 2023 년 실내공기질 관리법상 법정 관리대상인 연면적 430㎡ 이상 어린이집 8곳에서 시작해 지금까지 34곳에 IoT 환경센서를 설치했다. 선정된 어린이집에는 개소당 설치비 50만원을 지원한다(공공 지원금) — [아시아경제](https://view.asiae.co.kr/article/2026081707175786216) · [헤럴드경제](https://biz.heraldcorp.com/article/10842881)

**도시 센서 인프라 (옥외, 참고)**
- 서울 S-DoT 는 주거·상업·공업지역과 도로·공원에 1,170대가 설치돼 있다. 미세먼지, 소음, 진동, O₃, 악취(NH₃·H₂S), CO·NO₂·SO₂ 등 17종을 잰다. 2019 년 850곳, 2020 년 250곳을 추가했고 2022 년까지 2,500대를 목표로 했지만 실제로는 약 1,100대다(자료 사이 수치 차이 있음) — [서울 열린데이터광장](https://data.seoul.go.kr/dataList/OA-15969/A/1/datasetView.do) · [공공데이터포털(2024-03-24 파일)](https://www.data.go.kr/data/15061244/fileData.do) · [환경과조경](https://lak.co.kr/m/news/view.php?id=7674) [12개월+]. 2023-11 서울시의회에서 수요자 중심으로 도시데이터를 공개하라는 요구가 나왔다 — [서울Pn(2023-11-13)](https://go.seoul.co.kr/news/newsView.php?id=20231113500169) [12개월+]

**가구 보유와 시장**
- 한국갤럽 「마켓70 2023 (6) 주방·환경·건강 가전제품 18종 보유율」에 공기청정기 보유율이 들어 있다. 검색 요약에 60% 와 66% 가 함께 나와 **수치를 확정할 수 없다** — [한국갤럽](https://www.gallup.co.kr/gallupdb/reportContent.asp?seqNo=1595) [미검증] [12개월+]
- 한국전력거래소 「주택용 가전기기 보급현황 조사 보고서」(2019-12-31)가 공공데이터로 공개돼 있다. 내용은 열어 보지 못했다 — [공공데이터포털](https://www.data.go.kr/data/15065241/fileData.do) [12개월+]
- 한국소비자원의 공기청정기 품질표시 실태조사와 8종 비교 결과(나라경제 2022-01)가 있다 — [한국소비자원](https://www.kca.go.kr/smartconsumer/board/download.do?menukey=7301&fno=10004302&bid=00000146&did=1000689948) · [KDI 나라경제](https://eiec.kdi.re.kr/publish/naraView.do?fcode=00002000040000100012&cidx=13641&sel_year=2022&sel_month=01&pp=20&pg=1) [12개월+]

### Inferences
- **시설은 규제가 수요를 만들고, 가구는 관심이 수요를 만든다.** 시설(지하역사, 학교, 취약계층 시설, 다중이용시설)에서는 법, 과태료, 형식승인이 구매를 강제하거나 유도한다. 측정기를 달면 과태료 특례까지 있다. 가구에는 의무가 없고, 미세먼지 불안(67.4%)은 주로 공기청정기 소비로 흡수돼 있다.
- 가구용 측정기의 설득 포인트는 "공기청정기가 실제로 일하는지 확인한다" 같은 **이미 가진 가전과의 연결**이 자연스럽다(추론). 반대로 보상(테스트 단계, 비보장)을 앞세우면 PlanetWatch 와 Nubila 의 "miner" 프레이밍 문제를 되풀이할 위험이 있다.
- 인천과 양천의 어린이집 IoT 사업은 **B2G 경로가 실제로 돈다는 증거**다. 지자체 예산, 법정 관리대상 기준(연면적 430㎡), 성과 지표(만족도 98%)가 갖춰져 있다. 다만 이 경로는 형식승인 같은 규정 요건과 지자체 조달 절차를 따라야 한다.
- 에어코리아, S-DoT, inair.or.kr 등 공공 공기질 데이터 인프라와 공개 데이터가 이미 있다. 그래서 옥외 데이터로는 차별하기 어렵고, **가정 실내**가 빈 영역일 가능성이 높다(추론). 가정 실내를 재는 공공 측정망이 없다는 점은 이번에 1차로 확인하지 못했다.

### Gaps
- 공기청정기·실내공기 측정기 **시장 규모**의 1차 출처(통계청 광업·제조업조사 출하액, 관세청 수출입 통계, 기업 공시)를 확보하지 못했다. 시장조사 요약 수치는 쓰지 말 것.
- 신축 공동주택 라돈·실내공기질 측정·공고 의무와 라돈 권고기준은 이번 세션에서 확인하지 못했다. 가구 쪽에서 유일하게 규제와 닿는 지점일 수 있다.
- 2025-10-01 과 2026-01-01 시행분 개정 내용, 입법예고 주요 내용을 확인하지 못했다.
- 학교 교실 측정기 설치 의무의 조문과 시행일, 전국 설치 대수를 확인하지 못했다.
- 기후에너지환경부가 직접 하는 어린이집·노인시설 IoT 측정기 지원 사업이 있는지 확인하지 못했다. 검색 결과에는 지자체 사업만 나왔다.
- 2026 사회조사(환경 부문) 결과는 아직 발표 전으로 보인다(2026-11 예상, 추론).
- 에어코리아 측정망 규모(측정소 수)를 확인하지 못했다.
