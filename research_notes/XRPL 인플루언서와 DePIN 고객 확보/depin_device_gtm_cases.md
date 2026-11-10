# 기기형 DePIN은 구매자·호스트를 어떻게 모으고 붙잡았나 — 사례별 증거 파일 (2019–2026)

> 기준일 2026-09-26. 외부 증거 수집용 노트이며 팀 의견이 아니다.
>
> **먼저 읽을 조사 한계**
> 1. 이 세션의 웹 검색 한도(200회, 여러 조사자가 함께 씀)가 조사 도중 소진됐다. 그래서 **NATIX·Roam·XNET·Daylight·Silencio와 한국·일본 소비자 DePIN은 거의 확인하지 못했다**(각 절의 Gaps 참조). 더 필요하면 `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION` 상향 후 재조사해야 한다.
> 2. 조직 네트워크 정책 때문에 GitHub를 뺀 거의 모든 도메인에서 원문 열람이 차단(EGRESS_BLOCKED)됐다. 차단을 확인한 도메인은 cseweb.ucsd.edu, patpannuto.com, messari.io, blog.helium.com, docs.helium.com, en.wikipedia.org, medium.com, techcrunch.com, coindesk.com, bytetree.com, therelaymag.com, beemaps.com, docs.hivemapper.com, weatherxm.com, dimo.org, geodnet.com, natix.network다. 우회나 재시도는 하지 않았다.
> 3. **출처 표기**
>    - **[원문]**: GitHub에서 문서 원문을 직접 열어 확인했다(DIMO DIP·DLP, Helium HIP·denylist, WeatherXM docs, balena-ads-b README).
>    - **표기가 없는 웹 출처**: 검색 결과 요약으로만 확인했다. 대외 인용 전에 원문과 대조해야 한다.
> 4. **자료 성격 표기**
>    - [1차]: 프로젝트 공식 블로그·문서·보도자료·X
>    - [보도]: 언론 보도
>    - [학술]: 학술 논문
>    - [분석가 의견]: Messari·ByteTree·VanEck 등 분석가·투자사
>    - [업체 주장]: 업체가 내세운 주장
>    - [일화]: 리뷰·유튜브·포럼 글
>    - [미검증(집계)]: 산출 방법을 밝히지 않은 집계 사이트나 리스티클의 수치. 사실로 쓰면 안 된다.
>    - [내부]: 저장소 안의 기존 분석
> 5. 토큰 시세·가격 전망은 다루지 않는다. 기기 가격만 적는다. 외부 영상이나 글에 나온 수익 문구는 "그 매체의 주장"으로만 인용한다.

---

## 1. 사례별로 어떤 채널이 실제로 기기를 만들었나 — KOL·인플루언서는 주요 동인이었나

### Takeaway
- **KOL 기여 수치는 어디에도 없다.** 확인한 범위에서 "KOL·인플루언서 캠페인 → 기기 N대"라는 수치를 공개한 1차 자료나 보도는 없었다.
- **기기 수를 실제로 움직였다고 문서화된 채널은 다섯 가지다.**
  - 수익 프레이밍과 제3자 제조사 공급 확대(Helium 2021)
  - 출시 전 사전판매(Hivemapper, 출시 시점에 66개국 5,500대)
  - 국가별 커뮤니티와 유통사(GEODNET)
  - 고객을 이미 가진 B2B2C 파트너: 통신사·매장(Helium Mobile), 차량 운영사(Bee Maps), 완성차·보험사(DIMO Japan)
  - 현지 파트너를 통한 일괄 설치(WeatherXM Targeted Rollouts)
- **토큰 보상으로 모은 기기는 스스로 실패로 평가됐다.** DIMO는 토큰 보상·리퍼럴·마케팅 예산으로 차량 20만 대를 모았다. 그러나 2026-06 공식 제안서에서 그 결과를 "보상 파밍용 연결·저가치 데이터"라고 평가하고 기본 보상을 끝냈다.

### Cited Findings

#### Helium IoT (2019–2023)
**KOL 판정:** 유튜브 리뷰와 제휴 링크 콘텐츠는 넘쳤다. 그러나 판매 기여를 보여주는 수치가 없어 '주요 동인'으로 볼 근거는 없다.

**채널**
- 첫 시장 Austin에서 자체 핫스팟을 먼저 팔았다 [1차·보도] — [Light Reading](https://www.lightreading.com/iot/helium-starts-selling-iot-hotspots-in-us); [Helium Blog "First Batch of Helium Hotspots Sold Out"](https://blog.helium.com/first-batch-of-helium-hotspots-sold-out-25fada675dad); [TechCrunch 2019-06-12](https://techcrunch.com/2019/06/12/helium-network/); [Decrypt(Austin 가동)](https://decrypt.co/8179/helium-trial-balloon-a-new-peer-to-peer-wireless-network-goes-live-in-austin)
  - 2019년 Austin 물량의 80%를 사전판매했다.
  - 가격은 $495(보도에 따라 $500)였다.
  - 6월 판매를 시작하자 첫 배치가 매진됐다.
- 제3자 제조사 승인 절차 HIP-19가 2020-11-14 발의되고 2021-02-16 개정됐다 [원문] — [HIP-19](https://github.com/helium/HIP/blob/main/0019-third-party-manufacturers.md)
  - 요건: 보안칩(ECC608), 펌웨어 잠금·키 보호, 독립 감사 결과 공개, 지분 25% 이상 보유자의 KYC/AML, 생산 예산과 자본 증빙.
  - 문서에는 "약 980,000대 가동", "IoT 제조사 60곳 이상", "기기당 $40 스테이킹 비용"이 적혀 있다. 이 수치의 갱신 시점은 명시돼 있지 않다(2021-02 개정 이후에 추가된 것으로 보인다).
- 2021년 초 Nebra·EasyLinkin·Syncrob.it 3개 제조사가 추가됐다 [1차] — [Helium Foundation](https://dewialliance.medium.com/accelerating-network-growth-with-three-new-hotspot-manufacturers-3a14b116faca)
- 제조사 Bobcat은 2022-03 "네트워크의 30%, 40만 대 출하"라고 주장했다 [업체 주장·보도] — [RCR Wireless 2022-03-15](https://www.rcrwireless.com/20220315/featured/bobcat-miner-launches-helium-5g-gateway-to-mine-hnt)
  - 요약만으로는 '40만 대'가 Bobcat 출하량인지 네트워크 전체인지 알 수 없다. 원문 대조가 필요하다.

**구매 프레이밍: "passive income"**
- Medium 글 제목 "$42,000/yr Passive Income with Helium Hotspot" [일화] — [Guava Tech](https://medium.com/@guavatech/3-200-yr-passive-income-with-helium-hotspot-e300bb11832b)
  - URL 슬러그는 "3-200-yr"로, 제목이 나중에 바뀐 흔적이 있다.
- 크립토 유튜버 VoskCoin의 리뷰 제목 "Bobcat Miner 300 - The BEST Helium Miner? $5-100+ PER DAY?!" [일화, 영상 제작자의 주장이며 사실 아님] — [VoskCoinTalk](https://voskcointalk.com/t/bobcat-miner-300-the-best-helium-miner-5-100-per-day/15105)
- 'passive income' 카테고리에 올라간 리뷰 [일화] — [moneydoneright](https://moneydoneright.com/passive-income/other-ideas/helium-hotspot-review/)

**배송 지연**
- 수요와 공급망 문제로 제조사 배송이 수개월 지연됐고, 7개월 넘게 기다린 사용자 사례가 있다 [일화] — [moneydoneright](https://moneydoneright.com/passive-income/other-ideas/helium-hotspot-review/)
  - 검색 요약에서는 출처 페이지를 확정하지 못했다. [CoinDesk 2022-03-09](https://www.coindesk.com/markets/2022/03/09/helium-miners-from-lisbon-to-miami-say-its-location-location-location)일 가능성도 있다.

**실패·비판 ① 수요 부족**
- 2022-07, 네트워크 사용 매출이 월 약 $6,500이라는 Liron Shapira의 비판 스레드가 퍼졌다 [보도] — [Cointelegraph](https://cointelegraph.com/news/critique-on-helium-s-6-5k-monthly-revenue-causes-a-stir)
- 같은 비판자는 이렇게 주장했다 [비판자 의견] — [CryptoSlate](https://cryptoslate.com/angel-investor-says-helium-has-no-demand-returns-are-poor/)
  - 일반인이 핫스팟 구입에 약 $2.5억을 썼다.
  - $400–800짜리 기기로 월 $100를 기대했지만 실제로는 약 $20를 받았다.
- 창업자 Amir Haleem은 낮은 데이터 매출을 인정했다. 셀룰러와 달리 바로 옮겨 올 기존 기기가 없다는 구조를 이유로 들었다 [1차 발언의 보도 인용] — [CryptoSlate](https://cryptoslate.com/angel-investor-says-helium-has-no-demand-returns-are-poor/)

**실패·비판 ② 고객 과장**
- Helium은 Lime·Salesforce를 사용자·파트너로 표기했지만, 두 회사와 공식 관계가 없었다는 보도가 2022-07 나왔다(Mashable 원보도) [보도] — [Web3 is Going Great 정리](https://www.web3isgoinggreat.com/?id=helium-caught-lying-that-lime-and-salesforce-use-their-network)

**실패·비판 ③ 위치 스푸핑**
- denylist 운영 방식 [원문] — [helium/denylist](https://github.com/helium/denylist)
  - 2022-01-14경 온체인 투표로 도입됐다.
  - Nova Labs는 판정 방법론을 공개하지 않는다고 밝혔다.
  - 2022-10-27부터 추가·삭제 신청이 Crowdspot.io로 옮겨갔다.
- denylist 규모 [커뮤니티 분석] — [Tom Tobback](https://medium.com/@tomtobback/the-helium-denylist-going-after-the-scammers-maybe-part1-613b0a8af89c); [3roam](https://3roam.com/helium-hotspot-spoofing-and-the-deny-list/)
  - 2022-02 말: 전체 핫스팟의 최대 7%
  - 이후: 524k 중 25k(약 5%)
  - 2022-08 중순: 다시 7%
- 커뮤니티 신고 예시 [일화] — [#436](https://github.com/helium/denylist/issues/436); [#726](https://github.com/helium/denylist/issues/726)
  - "75 fake hotspots"(#436)
  - "Fake Location- 24 Spoofers only witness each other"(#726)

#### Helium Mobile (2023–2026)
**KOL 판정:** 근거를 찾지 못했다. 문서화된 성장 동력은 요금제, 통신사, 매장(B2B2C)이다.

**가입 계정**
- Messari 집계 [분석가 리포트] — [Messari Q4 2024](https://messari.io/report/state-of-helium-q4-2024); [Messari Q1 2025](https://messari.io/report/state-of-helium-q1-2025); [Messari Q3 2025](https://messari.io/report/state-of-helium-q3-2025)
  - 2024 Q4 말: 12.4만+
  - 2025 Q1 말: 16만+(전 분기 대비 +28.5%)
  - 2025-11: 가입 50만+, 일 사용자 120만+, 핫스팟 약 11.4만
- 2025년 연간 [1차] — [Helium 2025 Year in Review](https://blog.helium.com/helium-2025-year-in-review-a622e55e4f6d)
  - 가입 60만+
  - 일 연결 인원: 연초 25만에서 연말 200만+로 증가. 이 숫자에는 통신사 오프로드 이용자도 포함된 것으로 보인다.
  - 미국·멕시코 활성 핫스팟 12만+
  - "고객 절감액 $7,500만+"는 업체 주장이다.
- 2025-12-31 기준 계정 595,800개, 하루 신규 약 1,815개 [보도, 원문 차단] — [The Relay](https://therelaymag.com/heliums-carrier-grade-turn-att-movistar-and-free-mobile)
  - 기사 제목에 "free mobile"이 들어 있어 무료 요금제가 있었음을 보여준다.

**B2B2C: 통신사**
- AT&T 가입자가 Passpoint로 Helium Wi-Fi 94,000+곳(미국·멕시코)에 자동 접속한다 [보도·1차] — [Fierce Network](https://www.fierce-network.com/newswire/att-partners-helium-better-wi-fi-offload); [Android Police](https://www.androidpolice.com/att-helium-network-decentralized-wifi-hotspots/); [Helium Blog(AT&T)](https://blog.helium.com/helium-network-brings-wi-fi-connectivity-to-att-a8fa5b1da1e9)
  - 2025년 발표로 보이지만, 기사 날짜는 원문으로 확인해야 한다.
- 2025-02, 멕시코 Movistar 가입자를 네트워크에 연결했다. 규모는 블로그 제목 기준 200만, 본문 요약 기준 230만이다 [1차] — [Helium Blog](https://blog.helium.com/movistar-2eac6386f379)
- 2026년 Data Credit 소각의 99.8%가 통신사 오프로드에서 나왔다 [보도, 원문 차단] — [The Relay](https://therelaymag.com/heliums-carrier-grade-turn-att-movistar-and-free-mobile)

**B2B2C: 매장 — Helium Plus**
- 2025 Q2에 소프트런칭하고 2025-07-31 발표했다 [1차·보도] — [Helium Blog(Helium Plus)](https://blog.helium.com/helium-plus-51c23f3eacfb); [Wi-Fi NOW](https://wifinowglobal.com/news-and-blog/helium-becomes-the-uber-of-telecoms-as-helium-plus-invites-you-to-share-your-wi-fi-build-coverage-earn-dollars/); [The Fast Mode](https://www.thefastmode.com/technology-solutions/43710-helium-plus-launches-to-help-businesses-monetize-wi-fi-across-u-s)
  - 카페·헬스장·쇼핑몰·호텔 등이 기존 라우터의 소프트웨어만 업데이트해 참여한다. 추가 하드웨어가 필요 없다.
  - 2025-06 호스트에게 오프로드 보상 $30만을 지급했다(5월 대비 +20%).

**기기 가격과 설계**
- 실내 Helium Hotspot $249(상품 페이지 제목 기준) [1차] — [helium.com](https://www.helium.com/mobile/hotspotindoor)
- HIP-93(2023-07-17): CBRS 무선기보다 장비비와 설치 난도를 낮추려고 Wi-Fi AP를 Mobile 네트워크에 추가했다 [원문] — [HIP-93](https://github.com/helium/HIP/blob/main/0093-addition-of-wifi-aps-to-mobile-subdao.md)
  - 보상 가중치: 실내 Wi-Fi 0.4, 실외 Wi-Fi 1.0, CBRS 실내 1.0, CBRS 실외 2.5
  - 실내 AP는 헥스당 1대만 PoC 보상을 받는다.

**2026-06 전환** [1차] — [Helium Blog "The Next Era"](https://blog.helium.com/the-next-era-dbd0b4dd4939)
- PoC 대신 '실제 통신사 트래픽을 나른 만큼' 보상한다.
- 트래픽이 4배로 늘었는데 발행량은 고정이라 보상 단가가 약 $0.10/GB로 압축됐다.
- 상업 요율 대비 프로토콜이 보조하던 부분을 단계적으로 없앤다.
- Helium Mobile 통신사업은 Noble Mobile이 인수한다.

**비판**
- "T-Mobile 오프로드를 암시했지만 공식 계약은 없다"는 보도(날짜 미확인) [보도] — [Light Reading](https://www.lightreading.com/oss-bss-cx/helium-teases-offload-from-t-mobile-but-there-s-no-formal-deal)

#### Hivemapper → Bee Maps (2022–2026)
**KOL 판정:** 리퍼럴 프로그램과 유튜브 할인코드는 있었다. 판매 기여 수치가 없어 주요 동인으로 볼 근거는 없다.

**채널**
- 사전판매: 2022-11 HONEY 발행을 시작한 시점에 이미 66개국에서 대시캠 5,500대가 팔려 있었다 [보도] — [Forkast](https://forkast.news/dashcam-maker-hivemapper-issues-crypto-honey-for-road-image-contribution/); [TimesLive 2022-11-04](https://www.timeslive.co.za/motoring/news/2022-11-04-hivemapper-starts-issuing-crypto-tokens-for-vehicle-dashcam-footage/)
- 리퍼럴: 추천인과 피추천인이 단계별로 보상을 받고, 최대 $500까지다 [1차] — [Hivemapper(Medium)](https://medium.com/@hivemapper/earn-more-with-hivemapper-through-our-referral-program-5e94f9732d6e)
- 유튜브 할인코드 쇼츠(예: 코드 "Hive10", #passiveincome 태그) [일화] — [YouTube](https://www.youtube.com/watch?v=du_LxtqoDTo)
- 주 고객: 2024-02 Bee를 공개할 때 라이드헤일링·배달 기사에서 기업 차량(fleet)으로 넓히겠다고 했다 [보도] — [TechCrunch 2024-02-21](https://techcrunch.com/2024/02/21/hivemapper-bee-dashcam-price-preorder/)

**가격·프레이밍 전환**
- Bee는 선불 $589였다 [1차] — [PR Newswire 2025-10-06](https://www.prnewswire.com/news-releases/bee-maps-powered-by-hivemapper-raises-32-million-to-scale-the-next-generation-of-ai-powered-mapping-302575386.html); [Bee Membership FAQ](https://docs.beemaps.com/platform/bee-membership/bee-membership-faqs)
- 2025-10-06부터 'Bee Membership' 월 $19로 바뀌었다(같은 출처).
  - 월정액에 기기, LTE, 차량관리 소프트웨어, HONEY 기여 보상이 묶여 있다.
  - 같은 날 $3,200만 투자 유치를 발표했다.
- 이전 모델은 $299였다는 서술이 있다 [미검증(블로그)] — [OneShekel](https://oneshekel.com/how-much-does-a-hivemapper-dashcam-actually-make-per-month-real-data-2026/)

**데이터 고객과 기기 채널은 별개다**
- Lyft 제휴(2025-05)는 지도 데이터 라이선스다. Lyft 기사나 차량이 데이터를 기여하는 구조가 아니다 [보도] — [CoinDesk 2025-05-14](https://www.coindesk.com/tech/2025/05/14/lyft-taps-solanas-bee-maps-for-real-time-crowdsourced-mapping-upgrade)

**차량 운영사 사례**
- fleet 고객 1곳에 300대를 배치했고, 차량관리는 차량당 월 $19다 [1차] — [Bee Maps blog](https://beemaps.com/blog/fleet-management-meets-physical-ai)
- 2026-02 fleet 보상 관리 저장소가 생성됐다 [원문(메타데이터)] — [Hivemapper/bee-fleet-reward-manager](https://github.com/Hivemapper/bee-fleet-reward-manager)

**기기 수와 커버리지**
- 활성 기기 8,037대, 평균 기기가 $318.66 [미검증(집계)] — [DePINscan](https://depinscan.io/projects/hivemapper)
- 커버리지는 전 세계 도로의 약 28–33%, 고유 1,600만 km이며 "Google Street View보다 5배 빠르다"고 한다 [업체 주장] — [Bee Maps blog](https://beemaps.com/blog/say-hello-to-bee-maps-powered-by-hivemapper/); [insights4vc](https://insights4vc.substack.com/p/hivemapper-hits-30-global-coverage)

**실패·비판**
- 2023-12 공지: "지금 주문은 3월 발송, 이전 주문은 1–2월 발송" [1차] — [Hivemapper X](https://twitter.com/Hivemapper/status/1736966599020540082)
- 고객 호소 [일화] — [Trustpilot](https://www.trustpilot.com/review/hivemapper.com)
  - 배송이 6개월 지연됐다.
  - 2023-12 주문을 2025-03까지 받지 못했다.
  - 기기가 과열된다.
  - 앱이 불안정하다.
  - 불량 기기 교환·환불을 거부당했다.

#### GEODNET
**KOL 판정:** 근거가 없다. 외부 수치와 매출은 7절에 따로 정리했다.
- 첫 100대는 이탈리아·루마니아 텔레그램 커뮤니티가 거의 다 가져갔다 [내부] — [GEODNET 커뮤니티 스터디](/home/user/weatherplan-ai/depin/reports/geodnet-community-study-0918.html)
- 2022-05, 유저 출신 커뮤니티 리더 1명에게 공식 앰배서더 리퍼럴 링크를 줬다(같은 출처).
- 2023-10, 외부 인플루언서의 지갑 의혹으로 FUD 사태가 났다. 창업자는 "PR 회사 없다, 실제 일에 집중한다"고 대응했다(같은 출처).
- 유통사 9곳은 모두 재고를 사지 않는 '선결제 후발주' 구조다(같은 출처).
- 인센티브는 전부 조건부였다: 인도 2배 보상, 수퍼헥스, 헬륨 트레이드인(같은 출처).

#### WeatherXM
**KOL 판정:** 근거를 찾지 못했다. 검색 한도 때문에 확인 범위가 제한됐다.

**규모와 투자**
- 2024-05 CEO 발언: 자체 스테이션 5,000대, 80개국 이상 [보도] — [TechCrunch 2024-05-25](https://techcrunch.com/2024/05/25/deal-dive-can-blockchain-make-weather-forecasts-better-weatherxm-thinks-so)
- 개인은 데이터를 무료로 쓰고, 기업은 유료로 쓴다(같은 출처).
- Faction 주도로 $7.7M Series A를 유치했다 [보도] — [The Block](https://www.theblock.co/post/295807/lightspeed-faction-leads-7-7-million-series-a-round-for-depin-weather-startup-weatherxm)

**판매 채널**
- 자체 샵: 25개국 무료배송 [1차] — [WeatherXM Shop](https://weatherxm.com/shop/)
- 멀티브랜드 DePIN 리셀러: HeliumDeploy에 D1 WiFi 번들(WB1200)이 올라와 있다 — [HeliumDeploy](https://heliumdeploy.com/products/weatherxm-d1-wifi-weather-station-wb1200)
- 제3자 제조사 문서가 있다 [1차] — [Manufacturers](https://weatherxm.network/docs/manufacturers)
- 대량구매 신청 양식이 있다 [원문] — [WeatherXM FAQ](https://github.com/WeatherXM/docs/blob/main/docs/faq.mdx)

**Targeted Rollouts** [1차·업체 주장] — [WeatherXM Blog](https://blog.weatherxm.com/how-targeted-rollouts-bring-weatherfi-to-the-communities-that-need-it-most-b25240bc778a); [Metaverse Post](https://mpost.io/weatherxm-brings-hyperlocal-data-and-climate-resilience-to-underserved-regions-with-targeted-rollouts/); [Rollouts](https://rollouts.weatherxm.com/)
- NFT로 자금을 모아 아프리카·인도·중남미에 스테이션을 배치한다. 스테이션 1대가 NFT 4개다.
- 이전 라운드에서 $60만을 모아 12개국에 2,291대를 배치했다.
- 케냐에서는 BLCK IoT가 130대, 남아공에서는 DePIN SA가 320대를 운영한다.
- 2025-11 Base 체인에서 NFT 판매를 재개했다.
- 성과 수치(홍수 모델 +30%, 물 사용 −22%, 수확 +18%)는 업체 주장이다.

**기기 수**
- 수치가 서로 맞지 않는다: 지도상 9,500대+, 활성 약 1만 대, 약 7,000대 [미검증(집계)] — [DePINscan](https://depinscan.io/news/2025-01-03/weatherxm-disrupting-the-weather-data-industry-in-2025)

#### DIMO (2022–2026)
**KOL 판정:** 인플루언서·제휴 예산은 명시돼 있었지만 결과 보고는 없다. 보상으로 모은 연결은 DIMO 스스로 '파밍'이라고 평가했다.

**기본 보상: DIP-2** [원문] — [DIP-2](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip2.md)
- 메인넷 2022-12-12부터 첫해 매주 1,105,000 DIMO를 연결 차량에 나눠 준다.
- 발행량은 52주마다 15%씩 줄어든다.
- 연결 방식별 레벨: R1·AutoPi·Tesla·Smartcar는 6, Macaron은 3이다.
- 3주 연속 연결이 끊기면 스트릭 레벨이 하나 내려간다.

**리퍼럴: DIP-7**(2023-02 발의, 2023-03 확정) [원문] — [DIP-7](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip7.md)
- 추천인과 신규 가입자가 각각 50 DIMO를 받는다.
- 첫 차량을 연결하고 1주 기본보상 자격을 채워야 지급된다.
- 보상 풀은 250만 DIMO로, 약 2.5만 건 분량이다.
- 실제 전환 데이터는 없다.

**마케팅: DIP-9**(2023-05 제안, 2024-07까지 개정) [원문] — [DIP-9](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip9.md)
- 총 4,400만 DIMO를 네 번에 나눠 푼다.
  - 1차 700만
  - 2차 700만: 차량 ID 5만 대가 민팅되면 해제
  - 3차 1,000만: 퀘스트·런 프로그램
  - 4차 2,000만: Coinbase Learning Rewards
- 채널 목록에 '인플루언서·제휴 파트너십', 리퍼럴·앰배서더, 유료광고·SEO, 퀘스트(Coinbase·Layer3), 행사 후원이 들어 있다.
- 채널별 성과나 CPA 보고는 없다.

**방향 전환: DIP-12**(2026-06 승인) [원문] — [DIP-12](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip-12-the-protocol-direction.md)
- 성과: 기본 보상이 "grew the network past 200,000 vehicles on four continents"
- 문제로 꼽은 세 가지:
  - "produced a lot of low-value data"
  - "attracted connections that existed mainly to farm rewards"
  - "diluted holders every week without creating demand to offset the new supply"
- 남은 수요: "The demand that lasted was for the protocol's core: signed, tamper-proof vehicle data that can be trusted without trusting anyone."
- 결정:
  - 기본 보상을 즉시 끝낸다.
  - 1.5억 DIMO를 한 번에 소각한다.
  - 소비자 앱과 데이터 마켓은 독립 빌더에게 맡기고, 재단은 B2B로 간다.

**B2B 흔적** [원문(메타데이터)]
- `b2b-fleet-mgr-app`: 2025-01 생성, 설명은 "Meant for B2B customers" — [GitHub](https://github.com/DIMO-Network/b2b-fleet-mgr-app)
- `fleet-lite-app`: 2026-05 생성 — [GitHub](https://github.com/DIMO-Network/fleet-lite-app)

#### Wingbits
**KOL 판정:** 근거를 찾지 못했다.
- 처음에는 기존 ADS-B 취미 수신기에서 돌아가는 BYOD 방식이었다. 같은 장비로 FlightAware·Flightradar24 등에 동시 송출할 수 있었다 [원문·커뮤니티 오픈소스 README] — [balena-ads-b](https://github.com/ketilmo/balena-ads-b)
- 이후 BYOD를 닫았다(같은 출처).
  - README 원문: "No new BYOD (bring your own device) Wingbits stations can be onboarded as of Oct 14th, 2024"
  - GeoSigner 동글이 없으면 보상을 받을 수 없다.
- 과거 Helium 핫스팟 제조사였던 Nebra가 Wingbits 독립 컨테이너를 공개했다(2024-07-02 생성) [원문(메타데이터)] — [NebraLtd/wingbits](https://github.com/NebraLtd/wingbits)

#### NATIX · Roam · XNET · Daylight · Silencio
- 이번 세션에서 확인한 사실이 없다(→ Gaps).
- GitHub의 NATIX 제3자 프로필은 NATIX가 "world's largest on-street camera network"를 자칭한다고만 적었고, 수치는 없다 [제3자 프로필] — [api-evangelist/natix](https://github.com/api-evangelist/natix)

#### 한국·일본
**DIMO Japan**(DIP-11, 2025-08 승인) [원문] — [DIP-11](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip11.md)
- 구조: Key3(하쿠호도 × Startale Labs Japan)와 합작한다. DIMO 재단은 7,350만 엔과 400만 DIMO를 내고 최대 33% 지분을 받는다.
- 12개월 목표:
  - 기업 계약 3건
  - 상업 매출 $50만+
  - SaaS 1종 출시
  - 일본 완성차 2곳 이상 연동
- 채널: OEM·Tier1·보험사·딜러. 기업 탐색 워크숍은 최대 10곳이다. 앱도 현지화한다.
- Key3는 마케팅 지원 대가로 최대 100만 DIMO를 2년간 월별로 받는다.
- 소비자에게 기기를 직판하는 구조가 아니라 **B2B 우선**이다.

**GEODNET**
- 동아시아 공식 유통사는 일본 Village Island 1곳뿐이고, 한국 유통사는 없다 [내부] — [GEODNET 커뮤니티 스터디](/home/user/weatherplan-ai/depin/reports/geodnet-community-study-0918.html)
- 토큰은 2026-07 빗썸 원화마켓에 상장됐다. 기기 판매 채널과는 별개다 [보도] — [Bloomingbit](https://en.bloomingbit.io/feed/news/117056)

#### KOL 판정 요약 (위 인용을 한 표로 묶음)

| 사례 | 문서화된 주력 기기 채널 | KOL·인플루언서 흔적 | 기여 수치 |
|---|---|---|---|
| Helium IoT | Austin 자체 판매 → 제3자 제조사, 수익 프레이밍 | 유튜브 리뷰·제휴 링크, 'passive income' 글 | 없음 |
| Helium Mobile | 요금제, 통신사(AT&T·Movistar), 매장(Helium Plus) | 못 찾음 | 없음 |
| Hivemapper/Bee | 사전판매 5,500대, 리퍼럴(최대 $500), fleet 월정액 | 유튜브 할인코드 | 없음 |
| GEODNET | 국가별 텔레그램, 유통사 9곳, 측량·농업 제품 | 앰배서더 리퍼럴 1명, 외부 인플루언서발 FUD | 없음 |
| WeatherXM | 자체 샵·리셀러·제조사, Targeted Rollouts | 못 찾음 | 없음 |
| DIMO | 토큰 보상·리퍼럴·퀘스트, 일본은 B2B | DIP-9 예산에 '인플루언서·제휴' 명시 | 없음(성과 보고 없음) |
| Wingbits | 기존 ADS-B 취미 장비 BYOD → 전용 하드웨어 | 못 찾음 | 없음 |

### Inferences
- **KOL은 수익 서사를 증폭했을 뿐, 구매를 만든 채널로는 보이지 않는다.** 공개 자료에서 KOL은 '이미 돌던 수익 서사를 키운 채널'로 나타난다(Helium 2021의 영상 제목). 그 서사는 스푸핑(5–7%)과 보상 하락기의 대량 이탈(4절)을 함께 불렀다.
- **큰 채널은 모두 이미 수요나 고객이 있는 곳을 통했다.** 기기 수가 크게 움직인 채널은 전부 "그 기기를 원래 필요로 하는 사람"이나 "고객을 이미 가진 파트너"를 거쳤다.
  - 통신사 가입자(AT&T·Movistar)
  - 매장 라우터(Helium Plus)
  - 기사·차량 운영사(Bee)
  - 측량·농업(GEODNET)
  - 현지 파트너 기관(WeatherXM)
- **자체 측정과 모순되지 않는다.** wellbian 자체 측정(텔레그램 22개 채널에서 태그 세션 약 157개, 11곳은 0)은 "외부 어느 사례도 KOL→기기 수치를 공개하지 않았다"는 사실과 어긋나지 않는다. 다만 외부 자료가 없다는 것이 곧 '효과가 없다는 증거'는 아니다.
- **DIMO의 결론은 wellbian의 데이터 신뢰 축과 같다.** DIP-12의 결론 문장("signed, tamper-proof … data")은 wellbian이 내세우는 '센서 지문·원장 기록'과 같은 축에서 수요가 남았다는 1차 증언이다. 인과 판단은 DIMO 자체 평가다.

### Gaps
- **미확인 5개 사례:** NATIX(Drive& 앱·VX360), Roam, XNET, Daylight, Silencio. 검색 한도 소진과 도메인 차단으로 기기 수·채널·가격·보상 시점을 확인하지 못했다. 특히 Silencio(폰 기반) 대비 비교는 수행하지 못했다.
  - 간접 대비로 쓸 만한 내부 자료가 있다: GEODNET의 토큰 보상형 앱(TokenRun) 사용자는 기기 커뮤니티에 합류하지 않고 빠졌다 — [내부 스터디](/home/user/weatherplan-ai/depin/reports/geodnet-community-study-0918.html).
- **KOL 기여 수치:** 어느 사례도 KOL별 전환 수치를 공개하지 않았다(찾은 범위). Helium 제조사(Bobcat 등)의 제휴 프로그램 규모와 전환율도 확인하지 못했다.
- **Helium Mobile 가입 채널 분해:** 리퍼럴·광고·무료 요금제별 비중을 확인하지 못했다.
- **한국·일본:** 한국에서 출시된 소비자용 기기 DePIN 사례를 확인하지 못했다. 일본 소비자 기기 DePIN(무선 규제·인증 이슈 포함)도 확인하지 못했다.
- **쓰지 말 문구:** 검색 요약에 Hivemapper 커버리지가 "북미·유럽·한국·일본에서 가장 강하다"는 문구가 있었지만 출처 페이지를 특정하지 못했다.

---

## 2. 첫 ~1,000대와 ~10,000대는 어떻게 깔았고, 왜 초기 기기가 한곳에 몰렸나

### Takeaway
- **첫 1,000대는 대개 '한 도시·한 커뮤니티'에서 나왔다.**
  - Helium: Austin 한 도시 사전판매
  - GEODNET: 이탈리아·루마니아 텔레그램(첫 100대)과 헬륨 출신 유저
  - Hivemapper: 출시 전 66개국 5,500대 사전판매
- **1만 대는 공급망과 보상 설계가 붙은 뒤에 넘었다.** 공급망은 제3자 제조사와 유통사, 보상 설계는 빈 지역 가중치와 밀집 상한을 말한다.

### Cited Findings

**기기 수 타임라인**

| 사례 | 시점 | 수치 | 출처 |
|---|---|---|---|
| Helium IoT | 2019-06 | 첫 배치 매진, Austin 물량 80% 사전판매, $495 | [Light Reading](https://www.lightreading.com/iot/helium-starts-selling-iot-hotspots-in-us); [Helium Blog](https://blog.helium.com/first-batch-of-helium-hotspots-sold-out-25fada675dad) |
| Helium IoT | 2021(IMC '21 논문, 2021-11 발표) | 활성 40,000대+, 하루 약 1,000대 신규 | [학술] [Jagtap et al., IMC '21](https://cseweb.ucsd.edu/~schulman/docs/imc21-helium.pdf) |
| Helium IoT | 2021 여름(재게시 2021-08-01) | 10만 대, 108개국·1만+ 도시, 하루 1,000대+ | [1차] [Helium Blog](https://blog.helium.com/helium-network-reaches-major-milestone-100k-global-hotspots-7da337d769ad); [재게시](https://www.iothotspots.network/2021/08/01/the-helium-network-reaches-major-milestone-100k-global-hotspots/) |
| Helium IoT | 2021-12 | 40만 대 | [2차 블로그] [Innovation Party](https://medium.com/innovation-party/the-number-of-helium-network-miners-hit-400-000-8aef61e73e06) |
| Helium IoT | 2022-02-17 | 50만 대 돌파 | [보도] [CoinDesk](https://www.coindesk.com/markets/2022/02/17/helium-network-passing-half-million-hotspots-could-fire-up-hnt-price) |
| Helium IoT | 2023 Q1 → 2024-03 | 약 100만 대 정점 → 40만 대 미만(약 −60%) | [분석가 의견] [ByteTree](https://www.bytetree.com/research/2024/03/helium-wirelessly-connecting-the-world/) |
| Helium IoT | 2023-04 Solana 이전 → 2025 Q3 | 이전 직전 활성 342,000대+, 이전 후 신규 온보딩 누적 43,033대(전 분기 대비 +0.9%) | [분석가] [Messari Q3 2025](https://messari.io/report/state-of-helium-q3-2025) |
| Helium Mobile | 2025-11 / 2025 말 | 핫스팟 약 11.4만 / 활성 12만+ | [Messari Q3 2025](https://messari.io/report/state-of-helium-q3-2025); [Helium 2025 YIR](https://blog.helium.com/helium-2025-year-in-review-a622e55e4f6d) |
| Hivemapper | 2022-11 | 66개국 5,500대 판매 | [Forkast](https://forkast.news/dashcam-maker-hivemapper-issues-crypto-honey-for-road-image-contribution/) |
| GEODNET | 2022-01 ~ 2022-05 | 디스코드 개설 때 대기자 1,000명 → 2022-02 첫 8대 발송(이탈리아 3·루마니아 5) → 2022-04 주문 4,500대 → 2022-05 200대 온라인 | [내부] [스터디](/home/user/weatherplan-ai/depin/reports/geodnet-community-study-0918.html) |
| GEODNET | 2023-01 | 설치 1,700대+, 배송 약 2,500대 | [학술(창립팀 저술로 추정)] [NAVIGATION(ION)](https://navi.ion.org/content/70/4/navi.605) |
| GEODNET | 2024-10 | 1만 대 | [커뮤니티 뉴스레터] [GEODNET Info](https://geodnetinfo.substack.com/p/geodnet-reaches-10000-base-stations) |
| WeatherXM | 2024-05 | 5,000대, 80개국+ | [보도·CEO 발언] [TechCrunch](https://techcrunch.com/2024/05/25/deal-dive-can-blockchain-make-weather-forecasts-better-weatherxm-thinks-so) |
| DIMO | 2023-05 | 마케팅 2차분이 '차량 ID 5만 대 민팅' 시 해제되도록 설계(당시 5만 대가 다음 목표였음을 시사) | [원문] [DIP-9](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip9.md) |
| DIMO | 2026-06 | 4개 대륙 20만 대+ | [원문] [DIP-12](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip-12-the-protocol-direction.md) |
| Wingbits | ~2024-10-14 | 기존 ADS-B 취미 장비 BYOD로 성장, 이후 신규 BYOD 중단 | [원문 README] [balena-ads-b](https://github.com/ketilmo/balena-ads-b) |

**초기 지역 집중의 원인과 해소 수단**
- **Helium — 도시 단위 출시** [보도] — [Decrypt](https://decrypt.co/8179/helium-trial-balloon-a-new-peer-to-peer-wireless-network-goes-live-in-austin); [Light Reading](https://www.lightreading.com/iot/helium-starts-selling-iot-hotspots-in-us)
  - Austin 한 도시에서 먼저 팔고 가동했다.
- **Helium — 소유는 분산, 인프라는 집중** [학술] — [IMC '21](https://cseweb.ucsd.edu/~schulman/docs/imc21-helium.pdf)
  - 사용자의 84%가 핫스팟을 3대 이하로 가졌다.
  - 반면 일부 도시에서는 모든 핫스팟이 ISP 한 곳에 백홀을 의존했다.
  - 데이터 트래픽의 99% 이상이 클라우드 엔드포인트 한 곳을 거쳤다.
- **GEODNET — 커뮤니티 경로와 조건부 확장** [내부] — [스터디](/home/user/weatherplan-ai/depin/reports/geodnet-community-study-0918.html)
  - 헬륨 출신 유럽 유저와 국가별 텔레그램에서 시작했다.
  - 헬륨 트레이드인은 기존 스테이션과 20km 이상 떨어진 미국 위치만 받았다. 80건이 신청해 30대를 교환했다.
  - 인도에 2배 보상을 걸고, 현지 파트너(Hepta Networks)가 설치를 맡았다.
- **WeatherXM — 밀집 상한과 공백 지역 채우기** [원문·1차] — [Cell Capacity](https://github.com/WeatherXM/docs/blob/main/docs/rewards/cell-capacity.mdx); [WeatherXM Blog](https://blog.weatherxm.com/how-targeted-rollouts-bring-weatherfi-to-the-communities-that-need-it-most-b25240bc778a)
  - 약 5 km² 셀마다 보상받는 스테이션을 10대로 제한한다.
  - Targeted Rollouts로 남반구 12개국의 빈 곳을 채웠다.
- **Helium Mobile — 실내 AP 밀집 억제** [원문] — [HIP-93](https://github.com/helium/HIP/blob/main/0093-addition-of-wifi-aps-to-mobile-subdao.md)
  - 실내 AP는 헥스당 1대만 보상한다.

### Inferences
- **초기 집중이 생긴 두 가지 이유:**
  - 보상 설계가 이웃 밀도를 요구했다. Helium PoC는 서로 증인을 서야 보상이 나왔다.
  - 커뮤니티 경로를 따라 판매가 번졌다(GEODNET).
- **집중을 푼 두 가지 도구:**
  - 빈 지역 가중치: GEODNET 인도 2배·수퍼헥스, WeatherXM 롤아웃
  - 셀·헥스당 상한: WeatherXM 10대, Helium 실내 1대
- **한국 아파트 단지에서는 셀 설계가 핵심이다.** 가구가 조밀하게 모여 있으면 셀 상한과 가중치 설계가 곧 '팔 수 있는 수량'과 '구매자의 보상 기대'를 정한다.

### Gaps
- Helium이 1,000대·1만 대에 도달한 날짜를 1차 자료로 확인하지 못했다.
  - 검색 요약에만 "2021-01 약 1.5만 대"가 나오는데, 출처를 특정하지 못해 쓰지 않았다.
- Hivemapper가 1만 대에 도달한 시점, WeatherXM이 1,000대에 도달한 시점을 확인하지 못했다.
- IMC '21 논문의 정확한 측정 기간을 원문으로 확인하지 못했다(도메인 차단).

---

## 3. 제3자 제조사·리셀러·유통사는 무슨 역할을 했고 어떤 인센티브를 받았나

### Takeaway
- **Helium과 DIMO는 제조사에 부담을 지우며 문을 열었다.**
  - Helium은 HIP-19(2020-11), DIMO는 DIP-4·DLP로 제조사를 받았다.
  - 방식은 '거버넌스 승인 + 보안 요건 + 제조사 부담(스테이킹·본드·민팅 비용)'이었다.
  - 제조사가 얻는 것은 하드웨어 마진이었다.
- **수요가 폭발하자 문제가 제조사 층에서 터졌다.** 배송 지연, 과장 마케팅, 품질 불만이 그랬다.
- **GEODNET 유통사는 재고를 사지 않았다.** 고객이 먼저 결제하면 제조사에 발주하는 구조였고, 커뮤니티 리더가 차린 유통사가 파산했다(내부 스터디).
- **WeatherXM·Wingbits는 기존 DePIN 판로를 이어 썼다.** 멀티브랜드 DePIN 리셀러와 과거 헬륨 제조사(Nebra)가 판로가 됐다.

### Cited Findings

**Helium**
- HIP-19 요건 [원문] — [HIP-19](https://github.com/helium/HIP/blob/main/0019-third-party-manufacturers.md)
  - 보안칩, 펌웨어 잠금, 독립 감사
  - 지분 25% 이상 보유자 KYC/AML
  - 생산 예산과 자본 증빙
  - 기기당 $40 스테이킹 비용
  - 데이터 전송 전용 'Light Hotspot'은 일부 보안 요건이 면제된다.
- 2021년 초 제조사 3곳을 추가했다. 명분은 "네트워크 성장 가속"이었다 [1차] — [Helium Foundation](https://dewialliance.medium.com/accelerating-network-growth-with-three-new-hotspot-manufacturers-3a14b116faca)
- 제조사 Bobcat의 점유율·출하량 주장 [업체 주장] — [RCR Wireless](https://www.rcrwireless.com/20220315/featured/bobcat-miner-launches-helium-5g-gateway-to-mine-hnt)
- 제조사 배송이 수개월 지연됐다 [일화] — [moneydoneright](https://moneydoneright.com/passive-income/other-ideas/helium-hotspot-review/)

**DIMO**
- DIP-4(2022-12 제정, 2024-07-06 갱신) [원문] — [DIP-4](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip4.md)
  - 제조 라이선스 본드: 77,101 DIMO(2024-07-05 재산정, 약 $10,000 상당)
  - 재산정 시점: 매년 1월 1일, 또는 7일 TWAP가 50% 넘게 움직일 때
  - 물리 기기 1대를 민팅할 때마다 4,000 DCX
  - 요건: EVM 지갑을 담은 보안 소자, secure boot·서명 코드, OTA, CE·FCC 인증
  - 의무: 사용자 지원, 허위 데이터 금지
- DLP-5 Ruptela(2024-10, 리투아니아 텔레매틱스 기업) [원문] — [DLP-5](https://github.com/DIMO-Network/DIP/blob/main/license-proposals/dlp5.md)
  - 본드 100,000 DIMO
  - 신청 요건으로 기기 1,000대를 생산했다.
- DLP-4(2024-06): 하드웨어 없이 차량에 내장된 통신으로 연결한다 [원문] — [DLP-4 파일(파일명 dip13.md)](https://github.com/DIMO-Network/DIP/blob/main/license-proposals/dip13.md)
  - Tesla API와 Smartcar 같은 연결 집계사를 쓴다.
  - 근거로 "200,000,000대 이상이 출고 때부터 통신 내장"을 들었다.
  - 목표는 "애프터마켓 하드웨어 어댑터라는 제약 제거"였다.
- 하드웨어와 소프트웨어 연결의 보상이 같다: AutoPi·R1(하드웨어)과 Tesla·Smartcar(소프트웨어)가 모두 레벨 6이다 [원문] — [DIP-2](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip2.md)

**GEODNET** [내부] — [스터디 09절](/home/user/weatherplan-ai/depin/reports/geodnet-community-study-0918.html)
- 유통사는 재고를 사지 않고, 고객이 결제한 뒤 제조사에 발주한다.
- 공식 유통사는 9곳이다.
- 디스코드의 유통사 역할 배지는 CS용이 아니라 '정품 판매자 인증'용이었다.
- 2025-03, 커뮤니티 리더가 차린 유통사 Easynav가 고객 결제금을 가진 채 파산했다. 제조사가 자비로 대신 처리했다.

**WeatherXM**
- 제3자 제조사 문서가 있다 [1차] — [Manufacturers](https://weatherxm.network/docs/manufacturers)
- 멀티브랜드 리셀러에 제품이 올라와 있다 — [HeliumDeploy](https://heliumdeploy.com/products/weatherxm-d1-wifi-weather-station-wb1200)

**Wingbits**
- 과거 헬륨 제조사 Nebra가 Wingbits 컨테이너를 배포한다 [원문(메타데이터)] — [NebraLtd/wingbits](https://github.com/NebraLtd/wingbits)
- 기존 다중 수신 소프트웨어에 Wingbits가 한 서비스로 들어갔다 [원문 README] — [balena-ads-b](https://github.com/ketilmo/balena-ads-b)

### Inferences
- **제조사 개방의 대가는 마케팅 통제력이었다.** 공급 병목은 풀렸지만(Helium 2021 하루 1,000대+), '수익' 마케팅의 주체가 제조사·리셀러·유튜버로 흩어져 프로젝트가 통제하기 어려워졌다. 제조사 마케팅 통제에 관한 1차 자료는 찾지 못했다.
- **DIMO식 본드·민팅 비용의 양면이 있다.**
  - 장점: '팔고 끝'을 막는 장치가 된다.
  - 한계: 보상이 같은 소프트웨어 연결과 경쟁하면 하드웨어의 우위가 사라진다(DIP-2의 레벨 동일).
  - 결말: 기본 보상 자체가 2026-06 종료됐다.
- **유통 구조의 위험은 계약과 역할 분리로 막을 문제다.** GEODNET 사례의 핵심 위험은 '유통사가 고객 돈을 쥐는 구조'와 '모더레이터가 판매자를 겸한 것'이었다.
- **wellbian에는 방향이 반대인 교훈이다.** 기기 파트너가 이미 있으므로 이 절은 '기기를 누가 만드느냐'보다 '누가 팔고 누가 지원하느냐'(리셀러 계약, 결제 보관, 지원 의무)에 적용된다.

### Gaps
- Helium 제조사별 판매량, 마진, 제휴 프로그램 조건을 확인하지 못했다. Helium이 제조사 과장광고를 제재한 1차 기록도 찾지 못했다.
- WeatherXM 제3자 제조사 목록과 판매 비중, 리셀러 계약 구조를 확인하지 못했다.
- DIMO 제조사별 판매량(AutoPi·Macaron·R1)과 소비자 가격은 DIP에 없다.

---

## 4. 보상이나 토큰 가치가 떨어졌을 때 무슨 일이 있었나 — 수요·활성 유지, 비투기 사용자를 붙잡은 것

### Takeaway
- **수익 서사로 모은 기기는 보상이 떨어지자 대량 이탈했다.**
  - Helium IoT: 약 100만 대에서 40만 대 미만으로, 약 −60%
  - Solana 이전 후 2.5년간 신규 온보딩은 4.3만 대에 그쳤다.
- **쓸모가 있는 기기는 보상이 반감돼도 늘었다.**
  - 예: 측량·농업 RTK, 차량관리 대시캠, 통신사가 실제로 돈을 내는 Wi-Fi 오프로드
  - GEODNET은 반감기(2025-07) 이후에도 2.05만 대에서 2.1만 대+로 늘었다.
- **보상 파밍을 이유로 보상을 끊은 사례도 있다.** DIMO는 2026-06 기본 보상을 끝냈다.
- **Helium은 보상을 트래픽 수요에 묶었다.** 2026-06 보상 기준을 '수요(트래픽)'로 바꿨다.

### Cited Findings

**Helium IoT**
- 2023 Q1 약 100만 대 정점에서 40만 대 미만으로 줄었다 [분석가 의견] — [ByteTree 2024-03](https://www.bytetree.com/research/2024/03/helium-wirelessly-connecting-the-world/)
  - 일부는 부정행위로 비활성화됐다.
  - 분석가 해석으로는 다수가 "지나치게 낮은 보상"으로 스스로 꺼졌다.
- 2023-04 Solana 이전 직전 활성은 342,000대+였다 [분석가] — [Messari Q3 2025](https://messari.io/report/state-of-helium-q3-2025)
  - 이전 후 신규 온보딩은 2025 Q3까지 누적 43,033대(전 분기 대비 +0.9%)다.
- 2022년 비판자 주장: 월 $100를 기대했지만 약 $20를 받았다 [비판자 의견] — [CryptoSlate](https://cryptoslate.com/angel-investor-says-helium-has-no-demand-returns-are-poor/)

**Helium Mobile·Wi-Fi**
- 2025-06 호스트에 오프로드 보상 $30만을 지급했다(5월 대비 +20%). 통신사 트래픽이 재원이다 [보도] — [Wi-Fi NOW](https://wifinowglobal.com/news-and-blog/helium-becomes-the-uber-of-telecoms-as-helium-plus-invites-you-to-share-your-wi-fi-build-coverage-earn-dollars/)
- 2026-06 "Utility replaces Proof-of-Coverage" [1차] — [The Next Era](https://blog.helium.com/the-next-era-dbd0b4dd4939)
  - 트래픽이 4배로 늘어 단가가 약 $0.10/GB로 압축됐다.
  - 보조금은 단계적으로 없앤다.

**GEODNET**
- 2025-07-01부터 채굴 보상이 50% 줄었다(반감기) [1차] — [GEODNET X](https://x.com/GEODNET_/status/1939866551068262491)
- 성과 기반 보상(GIP-6) [1차 문서] — [Performance-Based Reward Rules](https://docs.geodnet.com/performance-based-reward-rules); [Hex Reward Rules](https://docs.geodnet.com/geod-mining/hex-reward-rules)
  - 2025-04-07 승인, 2025-07-02 시행
  - 기준 미달 스테이션은 보상을 잃는다.
  - NFT 없는 스테이션이 7일 오프라인이면 헥스 활성 수에서 빠진다.
  - 몰수된 보상은 기준을 충족한 백본 스테이션 풀로 간다.
- 그 뒤에도 스테이션 수는 계속 늘었다 [분석가·단체 회원 소개] — [Messari Q3 2025](https://messari.io/report/state-of-geodnet-q3-2025); [Blockchain Association](https://theblockchainassociation.org/posts/blockchain-association-member-spotlight-geodnet)
  - 2025 Q3: 20,500대+
  - 2026: 21,000대+
- 온체인 매출은 2026-07 기준 주 약 $20만으로, 2025년 중반 대비 3배다 [보도] — [Crypto Briefing](https://cryptobriefing.com/geodnet-geod-coinbase-listing/)
  - 검색 요약 기준이며, 이 기사가 출처인지 확정하지 못했다.

**DIMO** [원문] — [DIP-12](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip-12-the-protocol-direction.md)
- 보상은 매년 15%씩 줄어, 세 번 삭감 뒤 주 약 678,600 DIMO가 됐다.
- DIP-12로 기본 보상을 끝냈다. 이유는 '저가치 데이터·파밍 연결·희석'이었다.
- 종료 뒤 연결 유지 데이터는 아직 없다.

**Hivemapper/Bee**
- 월정액에 차량관리 소프트웨어를 묶었다. 보상과 무관한 효용을 붙인 것이다 [1차] — [PR Newswire](https://www.prnewswire.com/news-releases/bee-maps-powered-by-hivemapper-raises-32-million-to-scale-the-next-generation-of-ai-powered-mapping-302575386.html)
- 활성 기기 8,037대 [미검증(집계)] — [DePINscan](https://depinscan.io/projects/hivemapper)

**GEODNET 앱(TokenRun)** [내부] — [스터디 05·07·08절](/home/user/weatherplan-ai/depin/reports/geodnet-community-study-0918.html)
- 2025-12 출시한 토큰 보상형 앱에 봇이 몰렸다.
- X·Discord 리워드를 8일 만에 중단했다.
- 앱 사용자는 기기 커뮤니티에 합류하지 않았다.

**WeatherXM** [원문] — [Reward Mechanism](https://github.com/WeatherXM/docs/blob/main/docs/rewards/reward-mechanism.mdx); [Troubleshooting](https://github.com/WeatherXM/docs/blob/main/docs/rewards/rewards-troubleshooting.mdx)
- 보상을 깎는 규칙이 여럿 있다:
  - 데이터 품질이 임계값 아래면 보상에서 빠진다.
  - 셀 정원을 넘으면 점수와 가입 순서로 탈락한다.
  - 재배치하면 2일 페널티가 붙는다(7일에서 한시 단축).
- 이탈 데이터는 없다.

### Inferences
- **보상이 줄어도 남은 이유는 두 가지로 보인다.** 기기 자체의 쓸모, 또는 제3자가 돈을 내는 수요(통신사·기업의 데이터 구매)다. GEODNET과 Helium 오프로드가 예다. 인과는 검증되지 않았다.
- **보상이 수요에 연동되면 '고정 수익' 기대와 부딪힌다.** Helium 2026처럼 보상 단가가 트래픽에 따라 오르내리면, 고정 수익을 기대하고 산 구매자는 실망하는 구조가 된다.
- **토큰 보상형 앱이나 퀘스트로 모은 사람은 기기 보유자가 되지 않는다.** GEODNET TokenRun과 DIMO DIP-12의 '파밍 연결'이 공통 증거다.
- **가정용 기기는 보상 외 효용이 먼저 사람을 붙잡아야 한다.** 실내 공기질 알림·리포트처럼 보상과 무관한 효용이 유지의 1차 동인이어야 한다는 외부 근거가 된다. 보상은 테스트 단계이며 보장되지 않는다는 wellbian의 전제와도 맞는다.

### Gaps
- GEODNET 오프라인 비율 시계열과 반감기 전후 순증·이탈 수치를 확인하지 못했다(콘솔·공식 사이트 차단).
- GEODNET ARR 두 수치를 확인하지 못해 쓰지 않았다.
  - "2025-12 ARR $7.3M"은 검색 요약에만 있고 출처를 특정하지 못했다.
  - "ARR $11.38M"은 집계 사이트 수치로 보인다(→ 미검증(집계)).
- Hivemapper 수치 세 가지를 확인하지 못해 쓰지 않았다.
  - 공식 활성·누적 기기 수
  - "2024-12 → 2025-03 매출 −94%"
  - "기여자 +36.2%(2025 Q1)"
  - 앞의 두 수치는 검색 요약에만 있고 출처를 특정하지 못했다.
  - "10만 대+ 배치"라는 문구도 출처를 특정하지 못했고 DePINscan 활성 8,037대와 상충한다.
- WeatherXM 활성률과, DIMO 기본 보상 종료(2026-06) 이후의 연결 유지율을 확인하지 못했다.
- Helium IoT 1대당 보상 추이를 1차 자료로 확인하지 못했다.
  - "하루 $0.20까지 떨어졌다"는 운영자 불만은 검색 요약에만 있고 출처를 특정하지 못했다.

---

## 5. 비크립토 구매자에게 닿은 프로젝트와 그 채널

### Takeaway
- **비크립토 구매자에게 닿은 사례는 모두 '원래 사는 물건이나 서비스'의 모양으로 팔았다.**

  | 대상 | 판 형태 | 사례 |
  |---|---|---|
  | 측량사·농가 | RTK 수신기·기지국과 구독 | GEODNET |
  | 기사·차량 운영사 | 월정액 대시캠 + 차량관리 | Bee |
  | 일반 소비자 | 저가 휴대폰 요금제 | Helium Mobile |
  | 매장 | 기존 라우터 소프트웨어 업데이트 | Helium Plus |
  | 통신사 가입자 | 자동 접속 | AT&T Passpoint |
  | 일본 자동차 업계 | 합작사 | DIMO Japan |

- **토큰은 뒤에 붙었다.**

### Cited Findings

**GEODNET**
- 2024-06-25 발표한 신규 고객 분야: 자동차, 드론, IoT, 농업, 측량 [1차] — [Business Wire](https://www.businesswire.com/news/home/20240625130856/en/GEODNET-Foundation-the-Worlds-Largest-RTK-Network-Announces-New-Customers-in-Automotive-Drones-IoT-Farming-and-Surveying)
- GEO-MEASURE는 $695다 [보도·업체] — [xyHt](https://www.xyht.com/surveying/geo-measure-survey-grade-rtk-precision-at-a-consumer-price/)
  - 구성: 로버 $295 + 첫해 RTK $400
  - 대상: 측량·건설·매핑 실무자
- RTK 서비스는 연 $400 또는 월 $40이다 [업체] — [Geo-matching](https://geo-matching.com/products/geodnet)
- 농가용 기지국으로 트랙터 자동조향 개조비를 최대 $2,500 줄인다고 한다 [업체 주장·스폰서 콘텐츠] — [GPS World(Sponsored)](https://www.gpsworld.com/sponsoredcontent/achieve-precision-with-geodnets-cost-effective-rtk-global-network/)

**Hivemapper/Bee**
- 라이드헤일링·배달 기사에서 기업 차량으로 넓혔다 [보도] — [TechCrunch 2024-02-21](https://techcrunch.com/2024/02/21/hivemapper-bee-dashcam-price-preorder/)
- 월 $19에 기기·LTE·차량관리 소프트웨어가 묶여 있다 [1차] — [PR Newswire](https://www.prnewswire.com/news-releases/bee-maps-powered-by-hivemapper-raises-32-million-to-scale-the-next-generation-of-ai-powered-mapping-302575386.html)
- fleet 1곳에 300대를 배치했다 [1차] — [Bee Maps blog](https://beemaps.com/blog/fleet-management-meets-physical-ai)

**Helium Mobile**
- 소비자 가입 60만+, "절감액 $7,500만+"는 업체 주장이다 [1차] — [Helium 2025 YIR](https://blog.helium.com/helium-2025-year-in-review-a622e55e4f6d)
- AT&T 가입자가 94,000곳+에서 자동 접속한다 [보도] — [Android Police](https://www.androidpolice.com/att-helium-network-decentralized-wifi-hotspots/)
- Helium Plus 매장 사례 [보도] — [Wi-Fi NOW](https://wifinowglobal.com/news-and-blog/helium-becomes-the-uber-of-telecoms-as-helium-plus-invites-you-to-share-your-wi-fi-build-coverage-earn-dollars/)
  - Sausalito에서 하루 2,300명이 쓰는 Wi-Fi 사업자
  - 뉴올리언스 French Quarter 사례

**DIMO**
- 출고 때 통신이 내장된 차량을 하드웨어 없이 연결하는 경로(DLP-4) [원문] — [DLP-4](https://github.com/DIMO-Network/DIP/blob/main/license-proposals/dip13.md)
- 일본은 OEM·보험사·딜러 대상 B2B로 간다(DIP-11) [원문] — [DIP-11](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip11.md)

**WeatherXM**
- 현지 기관을 통해 '커뮤니티 운영' 스테이션을 배치했다: 케냐 BLCK IoT 130대, 남아공 DePIN SA 320대 [업체 주장] — [Metaverse Post](https://mpost.io/weatherxm-brings-hyperlocal-data-and-climate-resilience-to-underserved-regions-with-targeted-rollouts/)
- 데이터는 개인 무료, 기업 유료다 [보도] — [TechCrunch](https://techcrunch.com/2024/05/25/deal-dive-can-blockchain-make-weather-forecasts-better-weatherxm-thinks-so)

**Wingbits**
- FlightAware·Flightradar24에 송출하던 ADS-B 취미 사용자 장비에 얹는 방식으로 시작했다(2024-10까지 BYOD) [원문 README] — [balena-ads-b](https://github.com/ketilmo/balena-ads-b)

### Inferences
- **비크립토 채널에서 토큰은 구매 이유가 아니었다.** 가격 인하나 리베이트에 가까운 역할이었다(Bee 월 $19, GEODNET RTK 구독).
- **wellbian에 옮기면 '측정기 + 알림·리포트'가 먼저다.** 가정·어린이집·학원·병원 같은 실내 공기질의 비크립토 구매자에게는 측정기와 그 효용이 먼저 와야 한다. WLBN 보상은 "테스트 단계·비보장"인 부가 요소로 두는 것이 외부 사례와 맞다.
- **기존 취미·전문 커뮤니티가 가장 빠른 비크립토 경로였다.** Wingbits의 ADS-B 취미 사용자, GEODNET의 측량 업계가 그렇다. 실내 공기질 쪽에서 대응하는 집단은 공기질 측정 취미층이나 알레르기·천식 가정 등으로 보이지만, 외부 근거는 없다.

### Gaps
- 비크립토 구매자 비중(%)을 공개한 사례가 없다(찾은 범위).
- WeatherXM이 기존 개인 기상관측 취미층을 어떤 채널로 공략했는지 확인하지 못했다.
- 가정 설치형 실내 공기질 DePIN의 선행 사례를 확인하지 못했다.

---

## 6. 집 안에 설치하는 소비자 기기에 주는 교훈 (설치·Wi-Fi·배치·프라이버시·지원·배송·품질)

### Takeaway
- **외부 사례에서 반복된 실패는 네 가지였다.**
  - 설치 위치가 나빠 데이터 품질이 떨어진다.
  - 연결이 끊긴다(Wi-Fi·백홀).
  - 위치나 데이터를 조작한다.
  - 배송이 지연된다.
- **성숙한 프로젝트는 이를 규칙과 요건으로 흡수했다.**
  - 보상 규칙: 품질 점수 미달 시 제외, 셀당 정원, 재배치 페널티, 7일 오프라인 규칙
  - 하드웨어 요건: 보안칩, 서명 펌웨어, OTA, 인증

### Cited Findings

**배치 규칙(WeatherXM)** [원문] — [FAQ](https://github.com/WeatherXM/docs/blob/main/docs/faq.mdx); [Installation Best Practices](https://github.com/WeatherXM/docs/blob/main/docs/wxm-devices/installation-best-practices-ws100x.mdx)
- 지붕 설치가 의무다. 발코니는 장애물 때문에 "데이터 품질, 따라서 보상"이 떨어진다.
- 설치 높이는 2–5 m다.
- 장애물과의 거리는 장애물 높이의 2–4배다.
- 굴뚝이나 환기구 같은 열원과는 5 m 넘게 떨어져야 한다.

**자동 판정(WeatherXM)** [원문] — [Data Quality](https://github.com/WeatherXM/docs/blob/main/docs/rewards/data-quality.mdx); [Reward Mechanism](https://github.com/WeatherXM/docs/blob/main/docs/rewards/reward-mechanism.mdx)
- 실내 설치 탐지기(Indoor Station Detector)와 일사 장애물 탐지기가 설치 문제를 잡는다.
- 품질 점수(0~1)가 임계값보다 낮으면 보상에서 빠진다.

**밀도 제한**
- WeatherXM: 약 5 km² 셀마다 10대, 초과분은 점수·가입 순서로 정한다 [원문] — [Cell Capacity](https://github.com/WeatherXM/docs/blob/main/docs/rewards/cell-capacity.mdx)
- Helium: 실내 AP는 헥스당 1대, 보상 가중치 0.4 [원문] — [HIP-93](https://github.com/helium/HIP/blob/main/0093-addition-of-wifi-aps-to-mobile-subdao.md)

**연결과 지원 부담(WeatherXM)** [원문] — [Rewards Troubleshooting](https://github.com/WeatherXM/docs/blob/main/docs/rewards/rewards-troubleshooting.mdx); [FAQ](https://github.com/WeatherXM/docs/blob/main/docs/faq.mdx)
- 보상이 0이 되는 원인을 8가지로 문서화해 두었다.
  - 지갑 미연결
  - 데이터 없음(오프라인·Wi-Fi·배터리)
  - 센서 이상
  - 데이터 공백
  - 잘못된 설치
  - GPS 없음
  - 신고 위치와 GPS 불일치
  - 재배치 페널티
- Wi-Fi 번들은 게이트웨이를 실내에 둔다.

**백홀 집중(Helium)** [학술] — [IMC '21](https://cseweb.ucsd.edu/~schulman/docs/imc21-helium.pdf)
- 일부 도시에서는 모든 핫스팟이 ISP 한 곳에 의존했다.
- 트래픽의 99% 이상이 클라우드 한 곳을 거쳤다.

**위치 조작 대응**
- Helium denylist: 전체의 5–7% 규모, 판정 방법 비공개 [원문·커뮤니티 분석] — [helium/denylist](https://github.com/helium/denylist); [Tom Tobback](https://medium.com/@tomtobback/the-helium-denylist-going-after-the-scammers-maybe-part1-613b0a8af89c)
- WeatherXM Proof of Location: GPS 위치와 신고 위치가 다르면 보상을 멈춘다 [원문] — [Rewards Troubleshooting](https://github.com/WeatherXM/docs/blob/main/docs/rewards/rewards-troubleshooting.mdx)
- Wingbits: GeoSigner를 요구하고 BYOD를 중단했다 [원문 README] — [balena-ads-b](https://github.com/ketilmo/balena-ads-b)

**하드웨어 품질 요건** [원문] — [HIP-19](https://github.com/helium/HIP/blob/main/0019-third-party-manufacturers.md); [DIP-4](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip4.md)
- Helium HIP-19: 보안칩, 감사, OTA
- DIMO DIP-4: 보안 소자, secure boot, OTA, CE·FCC 인증, 사용자 지원 의무

**배송**
- WeatherXM: 중국에서 출고해 미국·캐나다·영국·EU 창고를 거친다. 배송은 "1–2주"라고 안내한다 [원문 FAQ] — [FAQ](https://github.com/WeatherXM/docs/blob/main/docs/faq.mdx)
- Hivemapper: 2023-12 수개월 대기를 공지했다 [1차] — [Hivemapper X](https://twitter.com/Hivemapper/status/1736966599020540082)
  - 장기 미수령 호소가 있다 [일화] — [Trustpilot](https://www.trustpilot.com/review/hivemapper.com)
- GEODNET [내부] — [스터디](/home/user/weatherplan-ai/depin/reports/geodnet-community-study-0918.html)
  - 배송 현황을 숨김없이 공개한 것이 초기 신뢰를 만들었다.
  - PayPal·카드 결제가 막혀 한동안 암호화폐만 받았다.

**데이터 권리와 프라이버시(DIMO)** [원문]
- DLP-3: 오프체인 저장을 암호화하고 접근을 통제한다. 데이터 접근 수익의 총이익 20%를 사용자에게 돌려준다 — [DLP-3 파일(파일명 dip12.md)](https://github.com/DIMO-Network/DIP/blob/main/license-proposals/dip12.md)
- DIP-12: "signed, tamper-proof vehicle data" — [DIP-12](https://github.com/DIMO-Network/DIP/blob/main/improvement-proposals/dip-12-the-protocol-direction.md)

**기기 품질 불만**
- Hivemapper 과열, 앱 불안정 [일화] — [Trustpilot](https://www.trustpilot.com/review/hivemapper.com)

### Inferences
- **판정은 사람이 아니라 공개된 규칙이 해야 한다.** WeatherXM은 '실외 전제'이고 실내 공기질 센서는 '실내 전제'라 방향은 반대지만, 논리는 같다.
  - 판매 전에 설치 위치 규칙을 공개한다. 예: 주방·가습기·공기청정기 토출구·창문·환기구에서 떨어뜨리기.
  - 이상 패턴을 자동 탐지해 품질 점수를 매긴다.
  - 그 점수를 보상 자격과 연결한다.
- **아파트 밀집 구매는 보상 기대 불일치로 돌아올 수 있다.** 동·층 단위 밀집을 고려한 셀 정원이나 가중치가 없으면 한 단지에 구매가 몰리고, 그만큼 불만이 생긴다.
- **지원 문의의 대부분은 연결과 이동에서 나올 가능성이 크다.** Wi-Fi 끊김, 공유기 교체·재설정, 이사(재배치)가 그 예다. WeatherXM처럼 '보상이 안 나오는 이유' 목록을 출시 전에 문서로 만들어 두는 방식이 참고가 된다.
- **신뢰를 깨는 것은 지연 자체보다 침묵이다.** GEODNET은 지연 과정을 공개해 신뢰를 얻었고, Hivemapper는 Trustpilot 불만을 남겼다.
- **기기 파트너의 인증 이력은 판매 논거가 된다.** Helium과 DIMO는 제조사에 보안·인증 요건을 걸었다. 기기 파트너(케이웨더)의 인증 측정기를 쓰는 wellbian 구조에서는 그 인증 이력을 판매 논거로 쓸 수 있다.

### Gaps
- 실내 설치형 DePIN의 프라이버시 민원 선례를 확인하지 못했다. 예: 센서 데이터로 재실 여부나 생활 패턴을 추정하는 문제.
- 기기 반품률이나 불량률을 공개한 사례가 없다(찾은 범위).
- Hivemapper 프라이버시 정책(영상 블러 처리) 원문을 확인하지 못했다(도메인 차단).

---

## 7. GEODNET — 기존 커뮤니티 스터디(2026-09-18)가 다루지 않은 부분

### Takeaway
- **기존 스터디가 다룬 것:** 디스코드 4년치로 본 팀·인센티브·유통·위기 운영.
- **외부 자료로 더할 수 있는 것:**
  - 스테이션 수 시계열(외부 출처)
  - 매출: 기기 보상이 아니라 B2B 매출이 버팀목이 된 정황
  - 비크립토 구매자(측량·농업)용 제품과 가격
  - 반감기와 성능 기반 보상을 같은 달에 시행한 뒤에도 스테이션 수가 늘었다는 점
- **여전히 비어 있는 것:** 오프라인 비율, 지역별 분포, KOL 기여.

### Cited Findings

**스테이션 수 시계열(외부)**
- 2023-01: 설치 1,700대+, 배송 약 2,500대 [학술] — [NAVIGATION(ION), "GEODNET: Global Earth Observation Decentralized Network"](https://navi.ion.org/content/70/4/navi.605)
- 2023-02 공개 서비스 플랫폼 출시 때: 약 2,500대(같은 출처)
- 2024-10: 1만 대 [커뮤니티 뉴스레터] — [GEODNET Info](https://geodnetinfo.substack.com/p/geodnet-reaches-10000-base-stations)
- 2024 말: 활성 12,000대+, 140개국·4,000개 도시, 전년 대비 +219% [분석가] — [Messari Q4 2024](https://messari.io/report/state-of-geodnet-q4-2024); [PANews 재인용](https://www.panewslab.com/en/articledetails/9ggd7vpx.html)
- 2025 Q3: 20,500대+ [분석가] — [Messari Q3 2025](https://messari.io/report/state-of-geodnet-q3-2025)
- 2026: 21,000대+, 170개국+ [단체 회원 소개] — [Blockchain Association](https://theblockchainassociation.org/posts/blockchain-association-member-spotlight-geodnet)
  - 같은 시기 기사에는 "150개국+"로 나와 국가 수가 서로 다르다 — [Crypto Briefing](https://cryptobriefing.com/geodnet-geod-coinbase-listing/)

**매출(검색 요약 기준)**
- 2026-08 기준 상업 고객 ARR $11M+ [단체 회원 소개] — [Blockchain Association](https://theblockchainassociation.org/posts/blockchain-association-member-spotlight-geodnet)
- 2026-07 온체인 매출 주 약 $20만, 2025년 중반 대비 3배 [보도] — [Crypto Briefing](https://cryptobriefing.com/geodnet-geod-coinbase-listing/)
  - 매출원은 농업·로보틱스·자율주행 고객이다.

**고객과 제품**
- 신규 고객 분야: 자동차·드론·IoT·농업·측량(2024-06-25) [1차] — [Business Wire](https://www.businesswire.com/news/home/20240625130856/en/GEODNET-Foundation-the-Worlds-Largest-RTK-Network-Announces-New-Customers-in-Automotive-Drones-IoT-Farming-and-Surveying)
- GEO-MEASURE $695(로버 $295 + 첫해 RTK $400), 측량 실무자 대상 [보도] — [xyHt](https://www.xyht.com/surveying/geo-measure-survey-grade-rtk-precision-at-a-consumer-price/)
- RTK 연 $400 또는 월 $40 [업체] — [Geo-matching](https://geo-matching.com/products/geodnet)
- 무료 RTK 체험 페이지가 있다(로보틱스·자율 시스템 대상) [1차] — [geodnet.com/free](https://geodnet.com/free)
- HYFIX 스토어에서 하드웨어와 구독을 함께 판다 [1차] — [GEODNET Store](https://store.geodnet.com/)

**보상 규칙 변경**
- 2025-07-01 반감기로 보상 −50% [1차] — [GEODNET X](https://x.com/GEODNET_/status/1939866551068262491)
- GIP-6(2025-04-07 승인, 2025-07-02 시행): 기준 미달 스테이션은 보상을 잃고, 7일 오프라인이면 헥스 활성 수에서 빠진다 [1차] — [Docs](https://docs.geodnet.com/performance-based-reward-rules)
- 다음 반감기가 2026-06-30이라는 보도가 있다 [미검증 뉴스] — [Our Crypto Talk](https://ourcryptotalk.com/news/geodnet-halving-set-for-30-june)

**거래소 상장(토큰 측)**
- Coinbase 현물 거래 2026-06-23 시작 [보도] — [Crypto Briefing](https://cryptobriefing.com/geodnet-geod-coinbase-listing/); [KuCoin 뉴스](https://www.kucoin.com/news/flash/geodnet-token-launches-on-coinbase-june-23-2026)
- 빗썸 원화마켓 2026-07 [보도] — [Bloomingbit](https://en.bloomingbit.io/feed/news/117056)
- 둘 다 기기 채널과는 별개다.

**분석가·투자사 의견**(사실 아님)
- VanEck "Why We're Bullish" [의견] — [VanEck](https://www.vaneck.com/us/en/blogs/digital-assets/matthew-sigel-geodnet-why-were-bullish/)
- "$8M ARR Robotics Token…" [의견] — [Robotic Alpha](https://roboticalpha.substack.com/p/geodnet-the-8m-arr-robotics-token)

**KOL**
- 외부 자료에서 KOL 캠페인 흔적을 찾지 못했다.
- 내부 스터디에는 2023-10 외부 인플루언서발 FUD와 창업자의 "PR 회사 없다" 발언이 있다 [내부] — [스터디 07절](/home/user/weatherplan-ai/depin/reports/geodnet-community-study-0918.html)

### Inferences
- **보상이 두 번 깎인 달에도 스테이션이 늘었다.** GEODNET은 반감기와 품질 미달 보상 박탈을 같은 달(2025-07)에 시행했는데도 스테이션 수가 계속 늘었다. 보상 외 수요(RTK 구독 매출)와 사용자가 직접 RTK를 쓰는 효용이 버팀목이었을 가능성이 있다. 인과는 검증되지 않았다.
- **성장 단계마다 채널이 달랐다.** 스터디의 "첫 100대 = 이탈리아·루마니아 텔레그램"과 외부 시계열을 합쳐 보면 이렇게 대응한다.
  - 첫 수백 대: 커뮤니티 경로
  - 1만 대를 넘긴 2024년 이후: 유통사 확대와 측량·농업 수요
- **토큰 상장은 기기 확산의 선행 조건이 아니었다.** 한국 상장(2026-07)은 스테이션 2만 대를 넘긴 뒤였다(스터디 기준 21,000대).

### Gaps
- 콘솔 원자료를 볼 수 없어 다음을 확인하지 못했다(geodnet.com 차단).
  - 활성·오프라인 비율
  - 국가별 분포
  - 반감기 전후 순증과 이탈
- 측량·농업 구매자 비중과 유통사별 판매 비중을 확인하지 못했다.
- ARR 산정 방식(온체인 소각 기준인지 회계 매출인지)을 확인하지 못했다.
- 2025-12 ARR $7.3M 수치는 출처 불명이라 쓰지 않았다.
- NAVIGATION 논문의 저자 구성(창립팀 저술 여부)을 원문으로 확인하지 못했다.
