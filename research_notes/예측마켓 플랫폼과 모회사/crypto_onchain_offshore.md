# Crypto-native, on-chain and offshore prediction markets: entity map for a weather-data / settlement-source vendor (as of 2026-09-28)

**Method and reliability note (applies to the whole file).** Research date: 2026-09-28. Every WebFetch attempt returned `EGRESS_BLOCKED`. I tried 19 domains: polymarket.com, docs.polymarket.com, docs.polymarket.us, blog.uma.xyz, coindesk.com, cnn.com, npr.org, bitcoinmagazine.com, beincrypto.com, wethr.net, ir.theice.com, news.kalshi.com, predict.fun, dflow.net, docs.chainstack.com, augur.net, koreajoongangdaily.com, sccgmanagement.com and yogonet.com. As instructed, I did not retry any of them or work around the block. The session-wide WebSearch cap (200) was then reached, which ended the research.
**So every Cited Finding below is `[search summary — primary not opened]`.** Each one repeats what the search engine's result summary attributed to the linked page(s). I did not read any page in full. Treat every number as a lead, and check it on the primary page before using it externally.
Tags: `[pre-2026 — possibly outdated]`; `[3rd-party]` = unofficial tracker, guide or aggregator; `[untraceable]` = a figure whose origin or date I could not trace; `(date n/a)` = no publication date visible in the result. Dates are publication dates taken from the URL or title where visible.

---

## 1. Polymarket (global platform + Polymarket US): corporate structure, capital, chain, geo-restrictions

### Takeaway
Polymarket is the dominant offshore, on-chain venue. It runs on Polygon, resolves markets with UMA's optimistic oracle and uses Chainlink for fast price markets. It also has a separate CFTC-regulated US arm, QCX/QC Clearing, which it bought for $112M in July 2025.

Its capital position rose quickly:
- **Oct 2025:** ICE committed up to $2B at about $8B pre-money. ICE was later reported to hold about 22%.
- **Apr 2026:** talks at about $15B.
- **Aug 31–Sep 1, 2026:** a reported $1B round led by 1789 Capital at about $21B.

On 2026-04-28 it rebuilt its exchange stack and replaced USDC.e with its own "Polymarket USD" collateral. On **2026-08-18 South Korea's regulator ordered Polymarket blocked, citing a "Seoul rainfall in August" market**. This matters directly for a Korean weather-data vendor.
(요지: 폴리마켓은 UMA+Chainlink 정산, ICE가 최대주주(~22%), 2026-09 기준 ~$21B 평가. 2026-08-18 한국 방미심위가 "서울 8월 강수량" 마켓을 근거로 접속 차단 — 한국 도시 날씨 마켓 정산 데이터 공급은 법률 검토가 선행돼야 함.)

### Cited Findings
All bullets: `[search summary — primary not opened]`.

**Capital and valuation**
- 2025-10-07: ICE (NYSE parent) announced a strategic investment of **up to $2B**, valuing Polymarket at **about $8B pre-investment**. ICE is to become a **global distributor of Polymarket's event-driven data** to institutional clients, and the two plan to collaborate on tokenization `[pre-2026 — possibly outdated]` — [ICE IR press release](https://ir.theice.com/press/news-details/2025/ICE-Announces-Strategic-Investment-in-Polymarket/default.aspx); [Yahoo Finance](https://finance.yahoo.com/news/intercontinental-exchange-inc-ice-plans-124155871.html); [Traders Magazine](https://www.tradersmagazine.com/xtra/ice-invests-2bn-in-prediction-market-polymarket/)
- Fortune's headline for the same deal was "$2 billion … at $9 billion valuation". This is consistent with an ~$8B pre-money only if $9B is a post-money figure, which is unverified — [Fortune, 2025-10-07](https://fortune.com/crypto/2025/10/07/polymarket-2-billion-intercontinental-exchange-new-york-stock-exchange-9-billion/)
- ICE later "injected $600 million cash," completing the $2B obligation, which "began with a $1-billion infusion in October" (date of the $600M tranche n/a) — [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/intercontinental-exchange-invests-600m-polymarket-183100802.html). **Conflict:** another summary lists "October 2025: ICE invested $600 million" — [PYMNTS](https://www.pymnts.com/news/investment-tracker/2026/polymarket-aims-to-double-valuation-with-1-billion-funding-round/). FinTech Weekly (2026) describes the $2B as a data-infrastructure play — [FinTech Weekly](https://www.fintechweekly.com/news/intercontinental-exchange-polymarket-financial-data-infrastructure-2026). Orrick published a deal note, but its role is not confirmed — [Orrick](https://www.orrick.com/en/News/2025/10/Intercontinental-Exchange-announced-it-will-make-a-strategic-investment-in-Polymarket)
- 2026-04-20: Polymarket was "in talks" to raise **$400M at about a $15B valuation** — [Bloomberg](https://www.bloomberg.com/news/articles/2026-04-20/polymarket-in-talks-for-new-investment-at-15-billion-valuation); [PYMNTS](https://www.pymnts.com/news/investment-tracker/2026/polymarket-targets-15-billion-valuation-in-new-funding-round/). Whether and when this round closed was not confirmed. Later reports treat about $15B as the prior mark (see the next bullet).
- 2026-08-04: early talks to raise about **$1B at more than $20B** — [Bloomberg](https://www.bloomberg.com/news/articles/2026-08-04/polymarket-seeks-more-than-20-billion-valuation-in-funding-round); [CNBC](https://www.cnbc.com/2026/08/04/polymarket-seeks-fundraising-round-at-more-than-20-billion-valuation.html); [CoinDesk](https://www.coindesk.com/markets/2026/08/04/polymarket-targets-usd20-billion-valuation-as-competition-heats-up-in-prediction-markets)
- 2026-08-31 / 09-01: a **$1B round led by 1789 Capital** (Donald Trump Jr.'s venture firm) at about **$21B**, roughly 40% above the ~$15B mark. 1789 is reported to add about $300M on top of about $200M invested earlier, for about $500M disclosed in total. **ICE remains the largest shareholder at ~22%.** CoinDesk frames this as "Report" (based on Bloomberg). I found no official Polymarket release — [Bloomberg, 2026-08-31](https://www.bloomberg.com/news/articles/2026-08-31/polymarket-funding-round-led-by-1789-values-firm-at-21-billion); [CoinDesk, 2026-09-01](https://www.coindesk.com/business/2026/09/01/trump-jr-s-firm-leads-usd1-billion-polymarket-raise-at-usd21-billion-value-report); [Yogonet, 2026-09-01](https://www.yogonet.com/international/news/2026/09/01/126168-polymarket-valuation-reportedly-reaches-21-billion-on-new-funding-led-by-1789-capital); [Investing.com](https://uk.investing.com/news/stock-market-news/1789-capital-leads-1-billion-polymarket-round-at-21-billion-valuation--report-4853233); [Cryptonomist](https://en.cryptonomist.ch/2026/09/01/polymarket-funding-round/)
- Executive: **Shayne Coplan, CEO**, announced the CFTC go-ahead on 2025-09-03 — [Crypto Briefing](https://cryptobriefing.com/polymarket-secures-cftc-nod-us-market-qcx-llc-acquisition-2/); [CoinDesk](https://www.coindesk.com/policy/2025/09/03/u-s-cftc-gives-go-ahead-for-polymarket-s-new-exchange-qcx)

**US arm: QCEX → Polymarket US**
- July 2025: acquired **QCX LLC** (a CFTC-licensed DCM) and **QC Clearing LLC** (a DCO), together known as "QCEX", for **$112M** `[pre-2026 — possibly outdated]` — [PR Newswire](https://www.prnewswire.com/news-releases/polymarket-acquires-cftc-licensed-exchange-and-clearinghouse-qcex-for-112-million-302509626.html); [CoinDesk on X](https://x.com/CoinDesk/status/1947316049235349711)
- Sept 2025: CFTC go-ahead, including a no-action letter. Later, the CFTC approved an **Amended Order of Designation "enabling intermediated U.S. market access"** (date n/a) — [CoinDesk, 2025-09-03](https://www.coindesk.com/policy/2025/09/03/u-s-cftc-gives-go-ahead-for-polymarket-s-new-exchange-qcx); [PR Newswire](https://www.prnewswire.com/news-releases/polymarket-receives-cftc-approval-of-amended-order-of-designation-enabling-intermediated-us-market-access-302625833.html); [CFTC DCM filings page](https://www.cftc.gov/IndustryOversight/IndustryFilings/TradingOrganizations/49571)
- Dec 2025: the US app rolled out to select users, starting with sports `[pre-2026 — possibly outdated]` — [Bitcoin Magazine](https://bitcoinmagazine.com/markets/polymarket-rolls-out-us-app); [Yahoo Finance](https://finance.yahoo.com/news/polymarket-wins-cftc-approval-launch-200701601.html)
- By Sept 2026, Polymarket US lists daily temperature contracts (for example, "Highest temperature in Miami on September 4") and has a Weather FAQ — [Polymarket US event](https://polymarket.us/event/temp-miahigh-2026-09-04); [Polymarket US Weather FAQs](https://docs.polymarket.us/faqs/weather-faqs)

**Chain and 2026 infrastructure changes**
- Price markets settle via Chainlink, which is "live on Polygon mainnet" (see §3) — [The Block](https://www.theblock.co/post/370444/polymarket-turns-to-chainlink-oracles-for-resolution-of-price-focused-bets)
- 2026-04-06: Polymarket announced a **"full exchange upgrade"**: new smart contracts, an updated CLOB, and **Polymarket USD** (backed 1:1 by USDC) replacing bridged **USDC.e**, "to reduce bridge-related risk" and tighten control of settlement and liquidity. Coverage frames the aim as bringing **trading and dispute resolution "more firmly in-house"** — [CoinDesk, 2026-04-06](https://www.coindesk.com/markets/2026/04/06/polymarket-reveals-a-full-exchange-upgrade-to-take-control-of-its-own-trading-and-truth); [The Paypers](https://thepaypers.com/crypto-web3-and-cbdc/news/polymarket-overhauls-exchange-infrastructure-launches-usdc-backed-polymarket-usd-token); [CoinCentral](https://coincentral.com/polymarket-overhauls-its-exchange-and-launches-new-stablecoin-token/); [Bitcoin Magazine](https://bitcoinmagazine.com/news/polymarket-unveils-exchange-overhaul)
- The upgrade went live **2026-04-28 at about 11:00 UTC** — [Polymarket Help Center](https://help.polymarket.com/en/articles/14762452-polymarket-exchange-upgrade-april-28-2026)
- POLY token: third-party explainers say Polymarket announced POLY "for Q1 2026" with an airdrop to the top 20% of traders. Its utility is "expected" to include governance, fee discounts and staking. Commentary says POLY "could" take over dispute resolution; this is speculation. **I could not verify whether it had launched by Sep 2026** `[3rd-party]` — [99Bitcoins](https://99bitcoins.com/news/bitcoin-btc/polymarket-confirms-poly-token-launch-and-airdrop-plans/); [BingX Learn](https://bingx.com/en/learn/article/what-is-polymarket-poly-token-when-will-it-launch); [Bitcoin Magazine](https://bitcoinmagazine.com/news/polymarket-unveils-exchange-overhaul)

**Geo-restrictions**
- Official list: Polymarket Help Center, "Geographic Restrictions" (not opened) — [help.polymarket.com](https://help.polymarket.com/en/articles/13364163-geographic-restrictions)
- Trackers (mid-2026) say **more than 34 countries** block Polymarket, up from 27 about six months earlier. Restrictions come in tiers: full block, "close-only" (existing positions can be exited but no new ones opened) and a lighter "frontend" tier. Reported changes: Brazil and Slovakia are new close-only entries; Canada widened from Ontario to four provinces; Japan, Ireland and the Netherlands are on the frontend tier. Belgium, France and Singapore are restricted, as are OFAC-sanctioned states (Iran, North Korea, Cuba, Syria, Venezuela, Russia and others) `[3rd-party]` — [Start Polymarket](https://startpolymarket.com/countries/); [Polyscope](https://polyscope.pro/polymarket-geo-blocking-restricted-countries/); [LaikaLabs (July 2026)](https://laikalabs.ai/prediction-markets/polymarket-restricted-countries-list); [CCN](https://www.ccn.com/education/crypto/countries-banned-restricted-polymarket-kalshi/); [Datawallet](https://www.datawallet.com/crypto/polymarket-restricted-countries)
- **South Korea, 2026-08-18:** the **Korea Media and Communications Standards Commission (KMCSC)** ordered domestic access blocked, finding that Polymarket contributed to illegal gambling under the **Criminal Act and the National Sports Promotion Act**. The regulator rejected Polymarket's peer-to-peer defence, and **it cited Korea-specific markets, notably "Seoul rainfall in August."**
  - The block is at ISP level; the site showed **HTTP 451** from 2026-08-20.
  - Korea is **not** on Polymarket's own geoblock list, so the block is government-imposed.

  Sources: [CoinDesk, 2026-08-18](https://www.coindesk.com/business/2026/08/18/south-korea-joins-more-than-30-jurisdictions-restricting-polymarket-access); [Korea JoongAng Daily](https://www.koreajoongangdaily.com/korea/korea-to-block-access-to-polymarket-over-gambling-concerns/12831016); [Bloomingbit](https://en.bloomingbit.io/feed/news/118697); [SCCG, 2026-08-20](https://sccgmanagement.com/sccg-articles/2026/08/20/south-korea-enforces-access-block-on-polymarket-after-review-finds-violations-of-criminal-act-and-sports-promotion-law/); [Start Polymarket – South Korea](https://startpolymarket.com/countries/south-korea/)

### Inferences
- ICE (~22%) already distributes Polymarket's output data (probabilities) to institutions. A weather vendor sits on the input side (settlement truth), which is a different buyer inside Polymarket: market integrity and resolution operations, not ICE's data-sales team.
- The April 2026 upgrade signals that Polymarket wants more control over "truth." That could open the door to curated, official data partnerships. It could also make resolution more in-house and less open to outside proposers. Either way, the relationship would be with Polymarket itself rather than only through UMA.
- **Korea legal gating.** The KMCSC cited a Seoul weather market as grounds for the block. A Korean company that supplies settlement data for Korea-city markets on Polymarket could plausibly be seen as facilitating an activity Korea classifies as illegal gambling. **Get Korean legal advice before any Polymarket-facing deal that touches Korea markets.** Deals involving non-Korean cities, or US-regulated venues (Polymarket US, Kalshi), are separate legal questions. This is an inference, not legal advice.
- The capital race (Polymarket ~$21B vs Kalshi $22B) and CFTC-regulated arms on both sides mean the offshore/on-chain venue and the US venue of the same brand may use different settlement sources for the same kind of contract. Weather is one example; see §4.

### Gaps
- **Legal entities are not verified in this session:** the operator of polymarket.com and its parent. Unverified recollection to check at cftc.gov: the CFTC's January 2022 settlement named "Blockchain Insights Inc." (d/b/a Polymarket). The entity named in the current Terms of Use, and the HQ location, were not sourced.
- I found no executives beyond Shayne Coplan, including Polymarket US leadership.
- Not found: whether the April 2026 ~$15B round closed, and who led it; any official confirmation of the 1789-led round's terms; the date of ICE's $600M final tranche.
- POLY token launch status as of Sep 2026.
- Whether polymarket.com restricts the UK, and the exact official US status of the global site (as opposed to Polymarket US).

---

## 2. Other crypto-native, on-chain and offshore platforms: entity-by-entity

### Takeaway
Outside Polymarket, the field clusters into four groups:
1. **BNB Chain / YZi Labs (Binance-linked)**: Opinion, Predict.fun (which absorbed PancakeSwap-incubated Probable in March 2026), and Myriad (migrated to BNB Chain and USD1).
2. **Solana**: Kalshi markets tokenized via DFlow/Jupiter (Dec 2025), Drift BET and Hedgehog.
3. **New perp-DEX-native primitives**: Hyperliquid HIP-4, live from 2026-05-02, with permissionless deployers staking 500k HYPE since 2026-08-29.
4. **Legacy or dispute-layer projects**: Augur's Lituus revival, Omen/Presagio/Seer (Reality.eth + Kleros) and Zeitgeist (possibly dormant).

Trump Media's "Truth Predict" shrank to a marketing tie-up with Crypto.com's OG.com (launched Feb 2026). XRPL (Axiom) and Flare (FlarePredict) have only small or early-stage prediction markets.
(요지: BNB(YZi) 클러스터·Solana(Kalshi 토큰화)·Hyperliquid HIP-4가 2026 신흥 축. 날씨 마켓 상장은 폴리마켓 외에는 확인되지 않음.)

### Cited Findings
All bullets: `[search summary — primary not opened]`.

**Kalshi: on-chain initiatives**
- 2025-12-02: Kalshi launched **tokenized versions of its markets on Solana through DFlow (the tokenization layer) and Jupiter**. The DFlow Prediction Markets API exposes "all Kalshi markets as SPL tokens," which can be traded, borrowed, lent or used as collateral. DFlow "mirrors" Kalshi's liquidity, pricing and redemption "without compromising the underlying compliance framework." Kalshi supports a **$2M builder grants program** `[pre-2026 — possibly outdated]` — [Blockhead](https://www.blockhead.co/2025/12/02/kalshi-launches-tokenized-prediction-markets-on-solana-through-dflow-integration/); [Solana.com](https://solana.com/news/dflow-prediction-markets-api); [DFlow blog](https://dflow.net/blog/prediction-markets-api); [CoinMarketCap Academy](https://coinmarketcap.com/academy/article/kalshi-tokenizes-prediction-markets-using-solana-blockchain); [Coinpaper](https://coinpaper.com/12810/kalshi-expands-its-crypto-push-as-tokenized-prediction-markets-go-live-on-solana); [QuickNode guide](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/kalshi-prediction-markets-with-dflow)
- Kalshi capital, for context: a **$1B Series F led by Coatue at a $22B valuation**, announced 2026-05-07, with Sequoia, a16z, IVP, Paradigm, Morgan Stanley and ARK Invest. The prior valuation was $11B (December 2025). Company-reported figures: annualized revenue above $1.5B, and "more than 90%" of US prediction-market activity. **Timing conflict:** Bloomberg also carries a 2026-03-19 headline about a $1B raise at $22B — [Business Wire, 2026-05-07](https://www.businesswire.com/news/home/20260507526629/en/Kalshi-Raises-$1-Billion-at-a-$22-Billion-Valuation-as-Institutional-Adoption-Accelerates); [TechCrunch](https://techcrunch.com/2026/05/07/kalshi-doubles-valuation-in-5-months-hitting-22-billion/); [Bloomberg, 2026-05-07](https://www.bloomberg.com/news/articles/2026-05-07/kalshi-secures-22-billion-valuation-in-coatue-led-round); [Bloomberg, 2026-03-19](https://www.bloomberg.com/news/articles/2026-03-19/kalshi-gets-1-billion-in-new-funding-at-22-billion-valuation); [Kalshi News](https://news.kalshi.com/p/kalshi-raises-1-billion-22-billion-valuation-institutional-demand-surges)

**Hyperliquid: HIP-4 outcome markets**
- HIP-4 went live on mainnet on **2026-05-02**, starting with a recurring **BTC daily binary** and rolling out further in stages. The contracts are "fully collateralized binary contracts that settle within a fixed range" and are described as a general primitive for prediction markets and bounded options — [Chainstack docs](https://docs.chainstack.com/docs/hyperliquid-hip4-outcome-markets-trading); [CCN](https://www.ccn.com/education/crypto/hyperliquid-hip-4-outcome-markets-work-explained/)
- There are zero fees to open positions, which coverage frames as aimed at Polymarket and Kalshi — [Bitcoin.com News](https://news.bitcoin.com/hyperliquid-launches-hip-4-and-targets-polymarket-with-zero-fee-outcome-markets/)
- 2026-07-20: Hyperliquid plans to add **decentralized (permissionless) prediction markets** via HIP-4. Its revenue passed $1B — [CoinDesk](https://www.coindesk.com/business/2026/07/20/hyperliquid-plans-to-add-decentralized-prediction-markets-in-upgrade-to-hip-4); [The Coin Republic](https://www.thecoinrepublic.com/2026/07/20/hyperliquid-crypto-to-launch-hip-4-outcome-markets-as-revenue-passes-1b/)
- 2026-08-29: **"Outcome"** deployed on mainnet as the **first permissionless HIP-4 builder** — [KuCoin News](https://www.kucoin.com/news/flash/hyperliquid-hip-4-deployment-begins-outcome-becomes-first-builder)
- Deployers must **stake 500,000 HYPE, which can be slashed if a validator vote finds a market "poorly defined or settled incorrectly"** — [Cryptopolitan](https://www.cryptopolitan.com/hyperliquid-hip-4-permissionless-prediction-markets/)
- Activity: 30-day notional of $45.99M, 749,363 trades and 4,828 traders (snapshot date n/a; the summary did not name the page, most likely the Loris Tools dashboard) `[3rd-party]` — [Loris Tools HIP-4 dashboard](https://loris.tools/hip4); cumulative volume "tops $350M" (date n/a) — [The Merkle](https://themerkle.com/hyperliquids-outcome-markets-are-compounding-fast-hip-4-volume-tops-350-million)

**Limitless (Base)**
- A **$10M seed led by 1confirmation**, with Collider Ventures, F-Prime Capital, DCG, Coinbase Ventures, Node Capital, Arrington Capital, Flyer One Ventures and SID Venture Partners (late 2025, ahead of the LMTS token launch) `[pre-2026 — possibly outdated]` — [Yahoo Finance](https://finance.yahoo.com/news/limitless-prediction-market-closes-10m-182043157.html); [ETF.com](https://www.etf.com/sections/news/limitless-prediction-market-closes-10m-seed-round-ahead-lmts-token-launch); [Ventureburn](https://ventureburn.com/limitless-raises-10-million/)
- As of June 2026: more than **$4B cumulative volume on Base** and more than 61,000 monthly traders. Monthly notional crossed $1B in Q1 2026 (run-rate from about $360M to $1.1B). It claims to be the largest prediction market on Base. The LMTS token is used for staking rewards, fee discounts and governance `[3rd-party]` — [Bitcoin Foundation news](https://bitcoinfoundation.org/news/prediction-markets/prediction-market-limitless-volume-base/); [ProvenCrypto review](https://provencrypto.com/limitless-exchange-review/); [limitless.exchange](https://limitless.exchange/)

**Myriad Markets (DASTAN)**
- Launched in **March 2025 by DASTAN**, the parent formed from **Decrypt Media and Rug Radio**. Chains: Abstract first, then Linea, then **BNB Chain**. Markets are embedded into content (news articles, X, video) via a browser extension. Note that Decrypt is a sister company, so its coverage of Myriad is not independent — [QuickNode Builders Guide](https://www.quicknode.com/builders-guide/tools/myriad-markets-by-dastan); [Chrome Web Store](https://chromewebstore.google.com/detail/myriad-markets/iojngbokndmhhjmcjkbokckpcaaoholp?hl=en); [Decrypt explainer](https://decrypt.co/resources/what-are-decentralized-prediction-markets-myriad-polymarket-kalshi)
- March 2026: closed a seed round with investors including **MoonPay (Ventures), Walrus and Tom Lee (Fundstrat)**. In "Season 3" (2026, date n/a) it migrated its catalogue to BNB Chain and adopted **World Liberty Financial's USD1** as its exclusive settlement asset — [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/prediction-market-myriad-closes-milestone-162400075.html); [KuCoin News](https://www.kucoin.com/news/flash/prediction-market-platform-myriad-completes-seed-round-with-moonpay-ventures-tom-lee-among-investors)
- Reached $10M in USDC trading volume (date n/a) — [Yahoo Finance](https://finance.yahoo.com/news/myriad-hits-10m-usdc-trading-125607071.html)

**Opinion (Opinion Labs, "O.LAB"; product Opinion.Trade)**
- Founder and **CEO Forrest Liu**, previously in private equity at KKR — [Bitget Academy](https://www.bitget.com/amp/academy/what-is-opinion-opn-macro-prediction-market-how-it-works-price-prediction); [BingX Learn](https://bingx.com/en/learn/article/what-is-opinion-opn-token-how-does-it-work)
- Funding:
  - Aug 2024: an undisclosed seed from **YZi Labs** (formerly Binance Labs).
  - 2025-03-18: a **$5M seed led by YZi Labs**, with Amber Group, Animoca Brands, Manifold Trading and echo.
  - **2026-02-04: a $20M pre-Series A led by Hack VC, Jump Crypto, Primitive Ventures and Decasonic.**
  - Total raised: about $25M.

  Sources: [Messari](https://messari.io/project/opinion-labs); [Tracxn](https://tracxn.com/d/companies/opinion-labs/__X2AtIBDDrkUnG5gG-xeVCHLqZv6Y7UeQ-d9sagfsOJE); [Crunchbase](https://www.crunchbase.com/organization/opinion-labs)
- The platform launched in October 2025. The **OPN token launched on 2026-03-05** — [Bitget Academy](https://www.bitget.com/amp/academy/what-is-opinion-opn-macro-prediction-market-how-it-works-price-prediction)
- Architecture has four layers: Opinion.Trade (CLOB), **Opinion AI** (oracle and market-creation assistant), Opinion Metapool (planned liquidity layer) and Opinion Protocol (planned token standard) — [Messari report](https://messari.io/report/opinion-an-emerging-player-in-prediction-markets)
- Share claims are **company claims on an unverified basis**: "Opinion claims 40% share" (Cointelegraph), and it "briefly outpaced" Kalshi and Polymarket volumes in late 2025 — [TradingView/Cointelegraph](https://www.tradingview.com/news/cointelegraph:f985c1855094b:0-cz-s-yzi-ramps-up-prediction-market-bet-as-opinion-claims-40-share/); [Bitget News](https://www.bitget.com/news/detail/12560605120059)

**Predict.fun and Probable (BNB Chain; PancakeSwap / YZi Labs)**
- **Probable** was incubated by **PancakeSwap** and supported by **YZi Labs**. It is zero-fee, runs only on BNB Chain and launched on **2025-12-18**. Any deposited token is auto-converted to USDT. **It relies on UMA's Optimistic Oracle.** Dune data put it at 14.5% share and $24M volume among BNB Chain prediction platforms (date n/a) `[pre-2026 — possibly outdated]` — [PancakeSwap blog](https://blog.pancakeswap.finance/articles/probable-prediction-market); [CoinMarketCap Academy](https://coinmarketcap.com/academy/article/pancakeswap-backed-probable-to-launch-prediction-markets-on-bnb-chain); [CryptoPotato](https://cryptopotato.com/pancakeswap-yzi-labs-launch-zero-fee-prediction-market-on-bnb-chain/); [Coinspeaker](https://www.coinspeaker.com/pancakeswap-yzi-labs-zero-fee-prediction-market-bnb-chain/); [Yahoo/CCN](https://finance.yahoo.com/news/yzi-labs-chases-prediction-market-123715767.html)
- **2026-03-04: Predict.fun acquired Probable**, including its tech stack, user base and core development team.
  - Probable USDT fees paid through 2026-03-03 are refunded at 2x, and Probable Points convert to Predict Points at 1:2.
  - The founder is **"Dingaling"**.
  - At that date Predict.fun reported $1.5B volume since its **December 2025 launch**, 120k+ users and 3.3M transactions.

  Sources: [Crypto Times, 2026-03-04](https://www.cryptotimes.io/2026/03/04/predict-fun-acquires-probable-to-strengthen-bnb-chain-prediction-markets/); [Predict.fun news](https://predict.fun/news/predict-fun-completes-strategic-acquisition-of-probable); [KuCoin News](https://www.kucoin.com/news/flash/predict-fun-acquires-probable-a-prediction-market-incubated-by-pancakeswap-and-yzi-labs); [FinanceFeeds](https://financefeeds.com/predict-fun-acquires-probable-to-consolidate-dominance-in-bnb-chain-prediction-markets/)
- After the acquisition (date n/a, 2026), Predict.fun took a **strategic follow-on from YZi Labs and Susquehanna Crypto** (amount undisclosed).
  - At that point it reported $1.8B cumulative volume, 130k users, 4M matched orders and $20M in assets earning yield.
  - It is an alumnus of YZi Labs' EASY Residency (Season 2) and states a focus on **Asian markets**.

  Sources: [Predict.fun news](https://predict.fun/news/predict-fun-announces-strategic-funding-round-with-yzi-labs-and-susquehanna-crypto); [crypto.news](https://crypto.news/yzi-labs-doubles-down-on-predict-fun-after-1-8b-volume-surge/); [Crypto Briefing](https://cryptobriefing.com/yzilabs-invests-prediction-market-growth/); [Dealroom](https://app.dealroom.co/news/feed/predict-fun-secures-follow-on-investment-from-yzi-labs-and-susquehanna-crypto-to-scale-bnb-prediction-markets)

**Drift BET (Drift Protocol, Solana)**
- Launched in **August 2024** by Solana perp DEX Drift. BET stands for "Bullish on Everything." It is capital-efficient: the same balance backs predictions and earns lending yield. It accepts 30+ collateral types and draws on Drift's ~$500M liquidity `[pre-2026 — possibly outdated]` — [The Block](https://www.theblock.co/post/311888/solana-based-drift-protocol-launches-prediction-market); [CoinMarketCap Academy](https://coinmarketcap.com/academy/article/solana-based-drift-protocol-launches-bet-prediction-market-challenging-polymarket); [RootData](https://www.rootdata.com/news/246872); [CryptoSlate](https://cryptoslate.com/drifts-bet-platform-brings-prediction-markets-to-solana-blockchain/)
- As of June 2026 it is still operating. Fees: taker 0.0350% and maker rebate 0.0025%, in USDC. Its focus is Web3 topics `[3rd-party]` — [Prediction Markets Index](https://predictionmarketsindex.com/platforms/drift-bet/)
- Blockchain Capital published a thesis post on Drift, which implies but does not confirm an investor relationship — [Blockchain Capital](https://www.blockchaincapital.com/blog/drift-the-future-of-onchain-trading-on-solana)

**Azuro**
- An on-chain prediction and sportsbook protocol where third-party apps route bets into AMM liquidity pools — [QuickNode Builders Guide](https://www.quicknode.com/builders-guide/tools/azuro-by-azuro); [Web3Connect](https://web3connect.com/service/azuro-prediction-market-infrastructure-azuro)
- Funding: **$18.5M across 4 rounds from 29 investors**, including Flow Ventures, Gnosis and Polymorphic Capital; **$11M in April 2024** and $4M in June 2022. Tracxn lists the HQ as "Tucson, US," which is `[untraceable]` and looks doubtful. I found no 2026 funding `[pre-2026 — possibly outdated]` — [Tracxn](https://tracxn.com/d/companies/azuro/__ApKl6xZ3DMxbYBRcSya396VnbVyE6ieqZM7e1R7al4Q); [Crunchbase](https://www.crunchbase.com/organization/azuro-c0a2); [Messari](https://messari.io/project/azuro-protocol); [AZUR on CoinMarketCap](https://coinmarketcap.com/currencies/azuro-protocol/)

**SX Bet (SX Network)**
- A peer-to-peer sports and crypto betting exchange on SX Network, with Arbitrum support. It settles in USDC, reports more than $780M lifetime volume, also lists politics and crypto-price markets, and has a public, bot-friendly API — [investingLive directory](https://investinglive.com/directory/prediction-market-platforms/sx-bet); [SX.bet Help Center](https://help.sx.bet/en/articles/4037276-introduction-and-overview); [Claw Arbs](https://clawarbs.com/blog/sx-bet-arbitrage/)
- 2026: SX Network is **migrating to a new gasless chain architecture**. The SX token is being discontinued; holders at the **2026-05-15 snapshot** receive USDC Bet Credits. I could not pin which result page carried this — [CoinMarketCap SX](https://coinmarketcap.com/currencies/sportx/); [SX Digest](https://sxweekly.substack.com/p/the-future-of-prediction-markets); [SX Network Medium](https://medium.com/sportx-bet/sx-network-the-blockchain-for-prediction-markets-603badcdad3b)

**Hedgehog Markets (Solana)**
- Solana-based with Eclipse support. It offers permissionless market creation (as of July 2026), pooled AMM liquidity, a 2% fee and the HHDG token. It "launched V1 in January 2026" with more than $3M early volume. Older materials (Medium, Crunchbase) exist, so "V1 Jan 2026" may be a relaunch; unverified `[3rd-party]` — [Prediction Markets Reviews](https://predictionmarketsreviews.com/reviews/hedgehog-markets); [Solana Compass](https://solanacompass.com/projects/hedgehog-markets); [hedgehog.markets](https://www.hedgehog.markets/); [Crunchbase](https://www.crunchbase.com/organization/hedgehog-markets)

**Zeitgeist (Polkadot)**
- A Substrate-based prediction-market protocol that moved from Kusama to Polkadot, with the ZTG token. The app is still online with markets, for example market #730 on "Polkadot ecosystem repos by Dec 31, 2025" — [Bitskwela](https://www.bitskwela.com/short-guides/introduction-to-zeitgeist); [Polkadot Forum](https://forum.polkadot.network/t/zeitgeist-a-prediction-markets-protocol-helping-steer-humanity-towards-truth-and-progress/1151); [Zeitgeist app market 730](https://app.zeitgeist.pm/markets/730)
- A Polkadot ecosystem directory lists it under **"archive"**. I found no shutdown announcement — [Polkadot Ecosystem](https://polkadotecosystem.com/dapps/archive/zeitgeist/)

**Augur (Lituus revival)**
- The **Lituus Foundation** is reviving Augur. The **Augur Lituus whitepaper** describes a *settlement layer for prediction markets facing disputed outcomes* that resolves contested events "without depending on a company, committee, multisignature wallet, or governance council." Work is split between Lituus (token, operations and oracle) and **Dark Florist** (the prediction-market implementation) — [crypto.news](https://crypto.news/augur-returns-decentralized-layer-prediction-markets/); [Augur blog – whitepaper](https://www.augur.net/blog/the-augur-lituus-whitepaper/)
- 2026: a **"Moon Fork" is live to test the dispute system**, forcing REP holders to migrate by an **August 1** deadline. Augur Lituus is **in development with ChainSafe**. In the first quarter after relaunch, Lituus grew its REP holdings from 250k to 550k and deployed $100k of Uniswap v3 liquidity — [Bitcoin Foundation news](https://bitcoinfoundation.org/news/prediction-markets/augur-fork-begins-dispute/); [Augur — One Year In](https://www.augur.net/blog/augur-one-year-in/); [augur.net](https://www.augur.net/); [GitHub](https://github.com/augurproject)

**Omen / Presagio / Seer (Gnosis ecosystem)**
- Omen runs on the **Gnosis Conditional Token Framework**. **Presagio**, "Omen 2.0", was revived in 2024 with backing from Gnosis DAO proposal **GIP-113** and integrates AI agents. Its code is published by **SwaprHQ** ("Powered by Omen, and Gnosis Conditional Tokens Contracts") `[pre-2026 — possibly outdated]` — [GitHub SwaprHQ/presagio](https://github.com/SwaprHQ/presagio); [Gnosis blog](https://www.gnosis.io/blog/the-rise-of-ai-agents-in-prediction-markets-how-gnosis-infrastructure-is-powering-the-future-of-information-finance); [GitHub gnosis/prediction-market-agent](https://github.com/gnosis/prediction-market-agent); [DXdocs Omen](https://dxdocs.eth.limo/docs/Products/omen/)
- Kleros also describes "Seer," a newer prediction-market design (date n/a) — [Kleros blog](https://blog.kleros.io/seer-crafting-smarter-prediction-markets-for-a-complex-world/)

**Truth Predict (Trump Media & Technology Group × Crypto.com) and OG.com**
- Oct 2025: TMTG announced Truth Predict inside Truth Social, powered by **Crypto.com Derivatives North America** (CFTC-registered), covering elections, inflation, rates, commodities and sports `[pre-2026 — possibly outdated]` — [Crypto.com](https://crypto.com/en/company-news/truth-social-to-become-worlds-first-social-media-platform-offering-prediction-markets-via-exclusive-partnership-with-cryptocom); [Fortune, 2025-10-28](https://fortune.com/crypto/2025/10/28/trump-media-prediction-markets-crypto)
- 2026: a TMTG filing calls Truth Predict "in development." The initial rollout is only a **marketing collaboration pointing users to OG.com**, the Crypto.com-owned prediction-markets app **launched February 2026**. Direct integration into Truth Social was dropped (Aug 2026 coverage) — [Bitcoin.com News](https://news.bitcoin.com/igaming/trump-media-drops-truth-predict-buildout-chooses-crypto-com-instead/); [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/world-first-trump-prediction-market-110930410.html); [FishDuck](https://fishduck.com/2026/08/trump-media-crypto-com-scrap-plan-to-bring-prediction-markets-to-truth-social/)
- TMTG, Crypto.com and Yorkville Acquisition Corp also mutually terminated the "Trump Media Group CRO Strategy" digital-asset treasury vehicle — [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/trump-media-abandons-crypto-treasury-210559341.html)

**XRPL and Flare**
- **Axiom**, billed as the first prediction market in the XRPL ecosystem, runs on the **XRPL EVM Sidechain**. Its beta was scheduled for **2026-01-19**, trading in **XRP and RLUSD** via Axelar and SquidRouter, with no token planned. I found no post-launch status — [BingX News](https://bingx.com/en/news/post/xrp-ledger-to-launch-axiom-prediction-market-platform-using-xrp-and-rlusd-on-january); [CoinGape](https://coingape.com/xrp-news-xrpl-set-to-get-first-prediction-market-challenging-polymarket-and-kalshi/); [Coindoo](https://coindoo.com/xrp-ledger-expands-into-prediction-markets-with-new-platform/)
- **FlarePredict** runs on Flare and lets users create **FTSO, FDC and FAssets markets**, betting in C2FLR or USDT0. C2FLR is Flare's Coston2 testnet token, which suggests at least part of it is on testnet — [FlarePredict](https://www.flarepredict.com/)
- Flare's FTSO is an "enshrined" oracle. It picks data providers by stake-weighted random draw every ~1.8s block, with a 90s commit-reveal anchor round (source attribution uncertain) — [CoinMarketCap Flare updates](https://coinmarketcap.com/cmc-ai/flare/latest-updates/)

**Other 2025–26 entrants and builder apps named in sources**
- Polymarket builder apps by 30-day routed volume (about April 2026): betmoar.fun ($101M), PolyCop, terminalup, insight_predict, polymtrade, kreoapp and Stand.trade `[3rd-party]` — [Top 7 on X](https://x.com/top7ico/status/2043666799137280146); [Chainstory](https://www.chainstory.co/the-invisible-ecosystem-who-actually-builds-on-polymarket/)

### Inferences
**At-a-glance map.** This table synthesizes the bullets above; the sources are in those bullets. "n/f" = not found this session.

| Entity | Chain(s) | Resolution (as sourced) | Weather/climate markets | Latest capital event | Notes for a KR data vendor |
|---|---|---|---|---|---|
| Polymarket (global) | Polygon; Polymarket USD collateral since 2026-04-28 | UMA optimistic oracle (whitelisted proposers) + Chainlink for price markets | **Yes**: daily city highs and lows, climate | ~$21B round led by 1789 (reported 2026-08-31); ICE ~22% | Blocked in KR since 2026-08-18; Seoul markets settle on Incheon via Wunderground |
| Polymarket US (QCX/QC Clearing) | CFTC DCM/DCO | Exchange rules; weather via NWS CLI (per §4) | **Yes** (e.g., Miami) | acquired for $112M (Jul 2025) | US-only venue |
| Kalshi on Solana (DFlow/Jupiter) | Solana SPL | Mirrors Kalshi settlement | Kalshi weather markets are likely included among "all markets" | Kalshi $22B (2026-05-07) | Settlement stays Kalshi/NWS |
| Hyperliquid HIP-4 (+ Outcome) | Hyperliquid | Deployer settles; 500k HYPE slashable by validator vote | n/f (BTC daily binary at launch) | n/a | Permissionless deployers need settlement data |
| Limitless | Base | n/f | n/f | $10M seed (late 2025) | — |
| Myriad (DASTAN) | Abstract → Linea → BNB; USD1 | n/f | n/f | Seed (Mar 2026) | Media-embedded distribution |
| Opinion (Opinion Labs) | BNB Chain (unverified) | Opinion AI + bonded answer/challenge + token-holder vote | n/f | $20M pre-A (2026-02-04) | YZi-backed; macro focus |
| Predict.fun (+ Probable) | BNB Chain | Probable used UMA; Predict.fun n/f | n/f | YZi + Susquehanna follow-on (2026) | States an Asia focus |
| Drift BET | Solana | n/f | n/f | n/a | Crypto-topic focus |
| Azuro | n/f | n/f | Sports | $11M (Apr 2024) | Sports-data model |
| SX Bet | SX Network/Arbitrum → new gasless chain | n/f | n/f | Token sunset (snapshot 2026-05-15) | Sports-first |
| Hedgehog | Solana (+Eclipse) | n/f | n/f | n/a | Permissionless creation |
| Zeitgeist | Polkadot | n/f | n/f | n/a | Possibly dormant |
| Augur (Lituus) | Ethereum (REP) | Dispute/settlement layer in development | — | n/a | Possible dispute-layer partner |
| Omen/Presagio/Seer | Gnosis | Reality.eth + Kleros | n/f | GIP-113 (2024) | AI-agent markets |
| Truth Predict / OG.com | CFTC (CDNA) | — | n/f | Marketing tie-up only (2026) | US |
| Axiom | XRPL EVM Sidechain | n/f | n/f | Beta scheduled 2026-01-19 | XRPL-native |
| FlarePredict | Flare | Markets built on FTSO/FDC | n/f | n/a | Flare data stack |

- **The BNB Chain / YZi cluster (Opinion, Predict.fun, Myriad) is the most Asia-oriented segment.** Predict.fun explicitly targets Asian markets. These platforms are younger and more likely to take on a new resolution-source partner than Polymarket.
- HIP-4's deployer-staking design effectively **makes each deployer the oracle, with a slashable bond.** Deployers therefore have a direct economic need for reliable settlement data, which makes them the most natural on-chain customer for a "verified sensor data" product.
- Myriad's move to USD1 (World Liberty Financial) and the 1789 Capital lead in Polymarket show politically connected US capital entering the sector. That is reputational context for any Korean partner.

### Gaps
- **Founders and executives not found:** Limitless, Myriad/DASTAN, Drift, Azuro, SX Bet, Hedgehog, Zeitgeist, Hyperliquid/Outcome and Kalshi. For Kalshi, the founders are well known but were not sourced this session.
- **HQ, jurisdiction and geo-blocking not found** for Limitless, Myriad, Opinion, Predict.fun, Drift BET, Azuro, SX Bet, Hedgehog and HIP-4. I found no Korea-specific geoblocking for any of them.
- **Resolution method not found** for Limitless, Myriad, Predict.fun (after acquiring Probable), Drift BET, Azuro, SX Bet and Hedgehog.
- Not found: Opinion's chain (BNB Chain is presumed from its YZi/BNB coverage), whether Axiom actually launched, whether FlarePredict is on mainnet, PancakeSwap's legacy up/down "Prediction" product, and other Solana prediction markets (e.g., Jupiter's own product).
- I found no latest valuations for most of the smaller platforms.

---

## 3. Resolution mechanics, disputes and manipulation cases (including Paris-CDG)

### Takeaway
Polymarket settles subjective and event markets through **UMA's optimistic oracle**. Proposals come mostly from whitelisted "managed proposers" (including Polymarket's own bots), carry a ~$500 bond and sit in a ~2-hour challenge window; disputes go to UMA token-holder voting. Crypto-price markets settle through **Chainlink Data Streams** (TWAP streams for 5- and 15-minute markets as of Aug 2026).

Other venues use variants of the same idea:
- Opinion: an AI oracle plus bonded answers with token-holder voting.
- HIP-4: deployer settlement with a slashable HYPE stake.
- Omen: Reality.eth with Kleros as arbitrator.
- Augur Lituus: a dispute layer, still in development.

**The April 2026 Paris-CDG case showed that weather markets settled on one physical sensor can be manipulated.** A suspected heat source pushed the CDG reading to 22°C on April 6 and April 15; a Polymarket trader reportedly won about $20k; Météo-France filed a complaint. Polymarket's fix was to **move Paris settlement to Paris–Le Bourget**, not to add multi-sensor verification.
(요지: CDG 사건 이후 폴리마켓의 대응은 "관측소 교체"였지 "다중센서 교차검증"이 아니었음 — 교차검증·위변조 탐지 데이터의 명분이 공식 사례로 확보됨.)

### Cited Findings
All bullets: `[search summary — primary not opened]`.

**Polymarket × UMA**
- Polymarket's docs describe UMA-based resolution — [Polymarket docs: Resolution (UMA)](https://docs.polymarket.com/developers/resolution/UMA); [Polymarket docs: concepts/resolution](https://docs.polymarket.com/concepts/resolution); [How are markets resolved](https://docs.polymarket.com/polymarket-learn/markets/how-are-markets-resolved)
- UMA's **managed proposers** update adds a **proposer whitelist** that lets integrations such as Polymarket "reduce low-quality or premature proposals while preserving … open, decentralized dispute resolution" (date n/a) — [UMA blog](https://blog.uma.xyz/articles/managed-proposers)
- Third-party guides (2026) describe the process:
  - Whitelist criteria: **5+ proposals in a rolling 6-month window at ≥95% accuracy**.
  - Economics: a **$500 bond** and a **$2 reward**.
  - Polymarket's own proposer bots propose "within minutes of close."
  - The proposal carries a $500 USDC.e bond on Polygon and sits in a **2-hour liveness window**.
  - If nobody disputes, the market resolves and the proposer gets the bond back plus the reward.

  Sources: `[3rd-party]` [Start Polymarket – propose](https://startpolymarket.com/learn/how-to-propose-resolutions/); [Start Polymarket – resolution and disputes](https://startpolymarket.com/learn/how-markets-resolve/); [UMA oracle propose UI (Polymarket project)](https://oracle.uma.xyz/propose?amp=&amp=&eventIndex=6&project=Polymarket&transactionHash=0xeabf50dcaa91465ced1354ace9b966328be2ec1c8779438acd03651bf84393f9)
- Guides describe disputes escalating to UMA token-holder voting. OddsShopper documents a case where a whale vote reportedly "flipped" an outcome; details were not retrieved — [OddsShopper](https://www.oddsshopper.com/articles/prediction-markets/uma-oracle-polymarket-disputes); [Rocknblock](https://rocknblock.io/blog/how-prediction-markets-resolution-works-uma-optimistic-oracle-polymarket); [ChainUp](https://chainup.com/blog/settling-the-wagers-inside-polymarkets-decentralized-oracle-and-resolution-engine/)
- 2026 FIFA World Cup: Polymarket's contracts reportedly exceeded $2B in volume, and "UMA's optimistic oracle was used to settle 78%" `[untraceable]` (CoinMarketCap AI summary) — [CMC AI – UMA](https://coinmarketcap.com/cmc-ai/uma/latest-updates/)

**Polymarket × Chainlink**
- Sept 2025 partnership: **Chainlink Data Streams** (low-latency, timestamped prices) plus **Chainlink Automation** trigger on-chain settlement at preset times. It is live on Polygon mainnet for asset-price markets, including new 15-minute markets. The firms are "testing methods for applying Chainlink data to more subjective questions" `[pre-2026 — possibly outdated]` — [PR Newswire](https://www.prnewswire.com/news-releases/polymarket-partners-with-chainlink-to-enhance-accuracy-of-prediction-market-resolutions-302555123.html); [Chainlink on X](https://x.com/chainlink/status/1966502945173717409); [The Block](https://www.theblock.co/post/370444/polymarket-turns-to-chainlink-oracles-for-resolution-of-price-focused-bets); [CryptoSlate](https://cryptoslate.com/polymarket-just-made-bitcoin-bets-settle-instantly-with-chainlink-upgrade/)
- 2026-08-12: **Chainlink TWAP Data Streams now settle Polymarket's 5- and 15-minute crypto markets** — [Genfinity](https://genfinity.io/2026/08/12/chainlink-twap-data-streams-polymarket-crypto-markets/)
- "Polymarket volume grew 7.5x in the six months after the integration" `[untraceable]` — [Chainlink Ecosystem](https://www.chainlinkecosystem.com/ecosystem/polymarket)

**Other platforms' resolution designs**
- Probable (Dec 2025): UMA Optimistic Oracle — [CoinMarketCap Academy](https://coinmarketcap.com/academy/article/pancakeswap-backed-probable-to-launch-prediction-markets-on-bnb-chain)
- Opinion: **Opinion AI** turns a topic into rules, checks whether it can be resolved and processes evidence when the market ends. Anyone can submit an answer by posting collateral. If there is no dispute within the challenge period, the answer stands; if it is challenged, **token holders vote** — [Bitget Academy](https://www.bitget.com/amp/academy/what-is-opinion-opn-macro-prediction-market-how-it-works-price-prediction); [Opinion Learn: prediction-market oracles](https://blog.opinion.trade/learn/what-is-a-prediction-market-oracle)
- HIP-4: the deployer stakes 500k HYPE, slashable by validator vote for poorly defined or incorrectly settled markets — [Cryptopolitan](https://www.cryptopolitan.com/hyperliquid-hip-4-permissionless-prediction-markets/)
- Omen/Presagio: the **Reality.eth (realit.io)** oracle with **Kleros** as final arbitrator. Kleros selects jurors by sortition and uses game-theoretic incentives `[pre-2026 — possibly outdated]` — [Kleros blog: "A Good Omen"](https://blog.kleros.io/a-good-omen-kleros-x-gnosis-x-dxdao-align-with-conditional/)
- Augur Lituus: a settlement layer for disputed outcomes with no company, committee, multisig or council, in development with ChainSafe — [crypto.news](https://crypto.news/augur-returns-decentralized-layer-prediction-markets/); [Bitcoin Foundation news](https://bitcoinfoundation.org/news/prediction-markets/augur-fork-begins-dispute/)
- Kalshi-on-Solana: DFlow mirrors Kalshi's pricing and **redemption logic**, so settlement follows Kalshi — [Solana.com](https://solana.com/news/dflow-prediction-markets-api)
- A 2026 operator guide on prediction-market oracles `[3rd-party]` — [Track360](https://track360.io/blog/prediction-market-oracles-resolution-settlement-operator-guide-2026)

**Paris-CDG weather-sensor tampering (April 2026)**
- 2026-04-23: **Météo-France filed a formal complaint** over "tampering of an automated data processing system" at Charles de Gaulle Airport, which is used to measure Paris daily temperatures. The complaint went to the airport police and an investigation is under way. A French weather association first suspected a betting scam — [CNN](https://www.cnn.com/2026/04/23/europe/france-weather-sensor-polymarket-bet-intl-latam); [NPR](https://www.npr.org/2026/04/23/nx-s1-5797876/polymarket-paris-weather-bet); [Bloomberg](https://www.bloomberg.com/news/articles/2026-04-23/france-probes-weather-data-glitch-after-surge-in-polymarket-bets)
- On **2026-04-06** the sensor jumped suddenly to **22°C** and then fell back. On **2026-04-15** it again read **22°C**, and a Polymarket user **reportedly won about $20,000** betting on 22°C — [CNN](https://www.cnn.com/2026/04/23/europe/france-weather-sensor-polymarket-bet-intl-latam); [NPR](https://www.npr.org/2026/04/23/nx-s1-5797876/polymarket-paris-weather-bet)
- Forum users suggested **a lighter or a battery-powered hair dryer** as the method — [CNN](https://www.cnn.com/2026/04/23/europe/france-weather-sensor-polymarket-bet-intl-latam); [BeInCrypto](https://beincrypto.com/polymarket-hair-dryer-weather-sensor-oracle-problem/)
- **Polymarket stopped relying on the CDG sensor and now uses a device at Paris–Le Bourget Airport** to settle Paris bets (switch date n/a) — [CNN](https://www.cnn.com/2026/04/23/europe/france-weather-sensor-polymarket-bet-intl-latam)
- Contemporary coverage paired the case with a separate "military insider" concern — [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/polymarket-cheating-alleged-tampered-weather-080201282.html). Separately, Whale Alert's story on the Predict.fun–Probable deal cites "intensifying regulatory scrutiny after Polymarket Iran-bets allegations" (headline only) — [Whale Alert](https://whale-alert.io/stories/c0920122e0699b/Predictfun-acquires-Probable-to-consolidate-prediction-markets-on-BNB-Chain-deal-faces-intensifying-regulatory-scrutiny-after-Polymarket-Iran-bets-allegations)

### Inferences
- **Single-sensor settlement is a single point of failure.** Polymarket's remedy was to swap the station (CDG → Le Bourget), which still leaves one physical sensor as the source of truth. A vendor with cross-validated multi-sensor networks, tamper or anomaly flags and signed, time-stamped records can pitch a **verification layer** that sits beside the named resolution source. It would not need to replace the official source to be useful.
- UMA's security is economic: a ~$500 bond and a 2-hour window. For weather markets, the people who most need fast, trustworthy readings are **whitelisted proposers and would-be disputers**. That suggests a data-subscription product for them, or a free "dispute evidence" feed as a marketing wedge, rather than trying to become the oracle.
- Chainlink is "testing" data for subjective questions and has expanded TWAP streams (Aug 2026). That makes Chainlink a plausible **distribution route** for weather data into Polymarket if weather settlement ever moves from web pages to oracle feeds. This is speculative; there is no evidence yet of weather via Chainlink on Polymarket.
- In HIP-4 and Opinion-style designs, a data vendor can become part of the settlement evidence chain contractually, for example through a deployer's market rules or Opinion AI's evidence sources, without holding tokens itself.

### Gaps
- I found no official Polymarket statement on CDG and no date for the switch to Le Bourget. The station code (presumably LFPB) is unverified.
- Not found: whether any UMA disputes involved weather markets, and similar cases in other cities.
- Not found: UMA's 2026 roadmap (e.g., weather-specific handling) and any official whitelist application procedure.
- The identity of the French weather association and the outcome of the police investigation are unknown.

---

## 4. Weather and climate markets: who lists them and what settles them

### Takeaway
Among crypto-native and offshore venues, **only Polymarket has a large, sourced weather book**: daily highest (and some lowest) temperature by city, plus climate and "hottest year" markets and a Seoul rainfall market that Korea's regulator cited. Settlement sources differ by city:
- **US cities (e.g., Miami):** NOAA/weather.gov airport stations.
- **London:** London City Airport (EGLC) via Weather Underground.
- **Seoul:** Incheon International Airport via Weather Underground.
- **Hong Kong:** the Hong Kong Observatory.
- **Paris:** switched from CDG to Le Bourget after the April 2026 tampering.

The CFTC-regulated venues (Kalshi and Polymarket US) settle on the **NWS next-day Climate Report (CLI)**.
(요지: 서울 마켓은 "인천국제공항 관측소 @ Wunderground" 기준, 정수 °C. 한국 기업이 1차 정산원이 되기는 어렵고, 교차검증·분쟁증거·신규 지수형 마켓 쪽이 현실적 진입점.)

### Cited Findings
All bullets: `[search summary — primary not opened]`.

**Polymarket (global): per-city settlement sources**
- **Seoul**: markets titled "Highest temperature in Seoul (Incheon) on [date]" (Aug–Sep 2026) resolve on **Wunderground's highest temperature "for all times" that day at the Incheon International Airport Station**, in **whole °C**. Revisions count **until the first datapoint for the following date is published**. An earlier market (May 2026) was titled "Highest temperature in Seoul on May 9?" without "(Incheon)" — [Polymarket, Seoul 2026-09-24](https://polymarket.com/event/highest-temperature-in-seoul-on-september-24-2026); [Seoul 2026-09-21](https://polymarket.com/event/highest-temperature-in-seoul-on-september-21-2026); [Seoul 2026-08-03](https://polymarket.com/event/highest-temperature-in-seoul-on-august-3-2026); [Seoul 2026-05-09](https://polymarket.com/event/highest-temperature-in-seoul-on-may-9-2026)
- **London**: London City Airport station on Wunderground. The **"Daily Observations" table governs over the "Day High & Low" summary** if they differ, and a market cannot resolve "Yes" until the date's data is final — [Polymarket, London 2026-08-16](https://polymarket.com/event/highest-temperature-in-london-on-august-16-2026); [London 2026-08-10](https://polymarket.com/event/highest-temperature-in-london-on-august-10-2026); [Wunderground EGLC history](https://www.wunderground.com/history/daily/gb/london/EGLC)
- **Miami**: the highest temperature **recorded by NOAA at Miami International Airport, using weather.gov data**, in whole °F. The market resolves once the first data point for the next date is published, or by 11:59 PM ET the next day, whichever comes first — [Polymarket, Miami 2026-09-23](https://polymarket.com/event/highest-temperature-in-miami-on-september-23-2026); [Miami 2026-09-26](https://polymarket.com/event/highest-temperature-in-miami-on-september-26-2026)
- Other city markets as of Sep 2026 include Beijing (highest) and Houston (**lowest** temperature) — [Polymarket, Beijing 2026-09-26](https://polymarket.com/event/highest-temperature-in-beijing-on-september-26-2026); [Houston 2026-09-26](https://polymarket.com/event/lowest-temperature-in-houston-on-september-26-2026)
- A tracker says **most daily temperature markets now resolve from Weather.gov, a few still from the Weather Underground History tab, and Hong Kong from the Hong Kong Observatory** `[3rd-party]` — [wethr.net](https://wethr.net/market-resolution). A developer's live check on **2026-08-28** found that US markets resolve on the **NWS regional hourly timeseries (weather.gov/wrh/timeseries)**, not the CLI report or raw METAR `[3rd-party, low reliability]` — [GitHub PR](https://github.com/bartosz44git/raport-2.0/pull/1)
- **Paris**: settlement moved from the CDG sensor to Paris–Le Bourget after April 2026 — [CNN](https://www.cnn.com/2026/04/23/europe/france-weather-sensor-polymarket-bet-intl-latam)
- **Korea rainfall**: a "Seoul rainfall in August" market existed; it was cited by the KMCSC. Its resolution source was not found — [CoinDesk, 2026-08-18](https://www.coindesk.com/business/2026/08/18/south-korea-joins-more-than-30-jurisdictions-restricting-polymarket-access)
- **Climate**: "Where will 2026 rank among the hottest years on record?" is described as one of the most actively traded climate markets — [Polymarket global-temp](https://polymarket.com/predictions/global-temp); [Polymarket climate](https://polymarket.com/predictions/climate)

**Coverage and volume: inconsistent snapshots, do not quote without checking**
- Polymarket category pages (snapshot dates n/a):
  - "Weather": about **528 active markets, more than $4.4M volume**.
  - "Climate & Weather": **20 active, more than $16.0M**.
  - Another snapshot: "463+ active weather markets, $1.3M+" — [Polymarket Weather](https://polymarket.com/predictions/weather); [Polymarket Climate & Weather](https://polymarket.com/predictions/climate-weather); [Weather & Science](https://polymarket.com/predictions/weather-science)
- Trackers differ on city coverage: "All 44 cities" versus "55 cities" `[3rd-party]` — [datapolymarket](https://datapolymarket.com/markets); [Polydata](https://polydata.pro/weather)
- "**$9.02B total volume across 55 cities, 28,694 traders**" is `[untraceable]`. It is implausible next to the category figures above; do not use it — [Polydata](https://polydata.pro/weather)
- 176 active temperature markets at 2026-08-28, counted across the 4 stations in one developer's scope (not a platform total) `[3rd-party]` — [GitHub PR](https://github.com/bartosz44git/raport-2.0/pull/1)

**CFTC venues (context)**
- **Kalshi and Polymarket US** settle temperature markets on the **NWS next-day Climate Report (CLI)**. Robinhood and IBKR also list weather contracts `[3rd-party + official FAQ not opened]` — [wethr.net](https://wethr.net/market-resolution); [Polymarket US Weather FAQs](https://docs.polymarket.us/faqs/weather-faqs)

**Weather-trading tool ecosystem: potential data customers and distribution** `[3rd-party]`
- Polyweather ("AI weather prediction for Polymarket") — [polymarketweather.xyz](https://polymarketweather.xyz/)
- Polydata (live temperature brackets) — [polydata.pro](https://polydata.pro/weather)
- datapolymarket — [datapolymarket.com](https://datapolymarket.com/markets)
- vweatherstation (tracks Polymarket and Kalshi temperature markets) — [vweatherstation.com](https://vweatherstation.com/prediction-markets/)
- Guides: [LaikaLabs](https://laikalabs.ai/prediction-markets/trade-polymarket-weather-markets); [TradeTheOutcome strategy](https://www.tradetheoutcome.com/polymarket-weather-strategy/); [TradeTheOutcome bot guide](https://www.tradetheoutcome.com/how-to-build-a-polymarket-weather-bot/)
- An open-source bot that fetches the previous day's Wunderground history per station — [GitHub kshitij406/polymarket-weather-bot](https://github.com/kshitij406/polymarket-weather-bot)

### Inferences
- **Polymarket's revealed settlement-source preference** is an official national met-service page where one is accessible (NOAA/weather.gov in the US, HKO in Hong Kong). Otherwise it uses an airport station displayed on Weather Underground (London, Seoul). What these share: a public, free, stable URL that anyone can check.
- To be named as a resolution source, a private vendor would therefore need an equivalent **public, timestamped, non-revisable observation page**, ideally with the station's metadata and QC flags. A private API alone would not be enough.
- Seoul settles on **Incheon Airport, not central Seoul**, and in whole °C. That opens room for a "Seoul-proper" multi-station index pitch. However, the Korea block (§1) makes any Korea-city market legally sensitive for a Korean company.
- The more realistic near-term roles are:
  - (a) cross-check and anomaly data for existing station-settled markets (the post-CDG integrity use case);
  - (b) data for traders' tools (the ecosystem above);
  - (c) designed indices for new market types where no single official number exists, such as rainfall accumulations, heat-stress indices or air quality. None of these was found listed on crypto-native platforms.
- Kalshi tokenizes "all" its markets on Solana, so on-chain weather exposure already exists through DFlow tokens. Settlement there remains NWS, so this is not an entry point for Korean data unless Asian-city contracts appear.

### Gaps
- Not found: weather or climate markets on Limitless, Opinion, Predict.fun, Myriad, Drift BET, HIP-4, Hedgehog, Azuro or SX Bet.
- I have no complete, dated city list with per-city stations for Polymarket, and no per-city volumes. Seoul market volumes in particular were not retrieved.
- Not found: the resolution sources for Beijing, Hong Kong (the HKO claim is `[3rd-party]`) and the Seoul rainfall market, and when US cities switched from Wunderground to weather.gov.
- Not found: rainfall, hurricane and snowfall market rules, and the resolution source for the global-temperature markets (e.g., NASA or Copernicus).

---

## 5. Data, oracle and BD channels: how an outside weather-data / index vendor can approach each platform

### Takeaway
No platform publishes a "resolution-source partner" intake. The documented public doors are:
- Polymarket's **Builders Program** (grants, tiers, partners page);
- **UMA's proposer role**, which is whitelisted by track record;
- **Chainlink** as the oracle already wired into Polymarket;
- **Kalshi/DFlow's API and $2M grants**;
- **Hyperliquid HIP-4 deployers** (stake 500k HYPE, bear the settlement risk);
- **Opinion AI's** evidence-based oracle;
- dispute layers such as **Augur Lituus** and **Reality.eth/Kleros**.

For a Korean weather vendor, sequence the approach: integrity and verification first (the CDG narrative), then deployer or partner integrations; handle Korea-market legality before anything Polymarket-facing.
(요지: 공개된 "정산원 파트너 접수 창구"는 없음. 빌더 프로그램·UMA 제안자·체인링크·HIP-4 배포자·Opinion AI·분쟁 레이어가 실질 경로.)

### Cited Findings
All bullets: `[search summary — primary not opened]`. Public page URLs only; no personal contacts.

- **Polymarket Builders Program**: [builders.polymarket.com](https://builders.polymarket.com/); [Ecosystem partners page](https://builders.polymarket.com/partners); [Builder tiers doc](https://docs.polymarket.com/builders/tiers)
  - "$1m+ to builders via grants and rewards" and "$2.5M+ in grants."
  - Builder codes attribute orders to a builder and give access to the Relayer API.
  - Tiers: unverified 100 relayer tx/day, verified 10,000/day, partner unlimited.
  - A weekly USDC reward pool is paid by share of volume.

  Mixed sources, including `[3rd-party]`: [PolyMart](https://polymart.app/blog/polymarket-builders-program); [botforkalshi guide](https://www.botforkalshi.com/blog/polymarket-builder-program-guide); [Polymarket Builders on X](https://x.com/PolymarketBuild/status/1984636606330880192)
- Builder Codes launched around early November 2025, with "10+ apps doing millions in daily volume" `[pre-2026 — possibly outdated]` — [Primo Data on X](https://x.com/primo_data/status/1986177962425917456)
- **UMA (Polymarket's oracle)**: the managed-proposer whitelist model — [UMA blog](https://blog.uma.xyz/articles/managed-proposers). Public propose/dispute UI — [oracle.uma.xyz](https://oracle.uma.xyz/propose?amp=&amp=&eventIndex=6&project=Polymarket&transactionHash=0xeabf50dcaa91465ced1354ace9b966328be2ec1c8779438acd03651bf84393f9). Third-party whitelist criteria: 5+ proposals in 6 months at ≥95% accuracy — [Start Polymarket](https://startpolymarket.com/learn/how-to-propose-resolutions/)
- **Chainlink**: its prediction-market oracle page — [chain.link](https://chain.link/article/prediction-market-oracle). The Polymarket integration record — [Chainlink Ecosystem](https://www.chainlinkecosystem.com/ecosystem/polymarket). Polymarket and Chainlink are "testing" Chainlink data for subjective questions — [PR Newswire](https://www.prnewswire.com/news-releases/polymarket-partners-with-chainlink-to-enhance-accuracy-of-prediction-market-resolutions-302555123.html)
- **ICE** is the distributor of Polymarket's event-driven data to institutions `[pre-2026 — possibly outdated]` — [ICE IR](https://ir.theice.com/press/news-details/2025/ICE-Announces-Strategic-Investment-in-Polymarket/default.aspx)
- **Kalshi on Solana**: the DFlow Prediction Markets API — [DFlow](https://dflow.net/blog/prediction-markets-api); [Solana.com](https://solana.com/news/dflow-prediction-markets-api); [QuickNode guide](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/kalshi-prediction-markets-with-dflow). The $2M builder grants — [CoinMarketCap Academy](https://coinmarketcap.com/academy/article/kalshi-tokenizes-prediction-markets-using-solana-blockchain)
- **Hyperliquid HIP-4**: permissionless deployment with a 500k HYPE stake — [Cryptopolitan](https://www.cryptopolitan.com/hyperliquid-hip-4-permissionless-prediction-markets/). Trading and API mechanics — [Chainstack docs](https://docs.chainstack.com/docs/hyperliquid-hip4-outcome-markets-trading). First builder, Outcome — [KuCoin News](https://www.kucoin.com/news/flash/hyperliquid-hip-4-deployment-begins-outcome-becomes-first-builder). Dashboard — [Loris Tools](https://loris.tools/hip4)
- **Opinion**: Opinion AI (oracle and market-creation assistant) — [Opinion Learn](https://blog.opinion.trade/learn/what-is-a-prediction-market-oracle); [Messari report](https://messari.io/report/opinion-an-emerging-player-in-prediction-markets)
- **Predict.fun**: company news hub — [Predict.fun news](https://predict.fun/news/predict-fun-announces-strategic-funding-round-with-yzi-labs-and-susquehanna-crypto). It states an Asia focus — [crypto.news](https://crypto.news/yzi-labs-doubles-down-on-predict-fun-after-1-8b-volume-surge/)
- **Augur Lituus** (dispute and settlement layer): [Mission page](https://www.augur.net/mission/); [Whitepaper post](https://www.augur.net/blog/the-augur-lituus-whitepaper/); [GitHub](https://github.com/augurproject)
- **Gnosis / Kleros / Reality.eth**: [gnosis/prediction-market-agent](https://github.com/gnosis/prediction-market-agent); [SwaprHQ/presagio](https://github.com/SwaprHQ/presagio); [Kleros "Seer"](https://blog.kleros.io/seer-crafting-smarter-prediction-markets-for-a-complex-world/)
- **Flare**: FlarePredict supports **FTSO- and FDC-based markets** — [FlarePredict](https://www.flarepredict.com/)
- **Azuro**: infrastructure listing — [QuickNode Builders Guide](https://www.quicknode.com/builders-guide/tools/azuro-by-azuro); [Web3Connect](https://web3connect.com/service/azuro-prediction-market-infrastructure-azuro)
- **SX Bet**: help center and public API (API per `[3rd-party]`) — [SX.bet Help Center](https://help.sx.bet/en/articles/4037276-introduction-and-overview); [Claw Arbs](https://clawarbs.com/blog/sx-bet-arbitrage/)
- **Myriad**: builder listing and browser extension — [QuickNode Builders Guide](https://www.quicknode.com/builders-guide/tools/myriad-markets-by-dastan); [Chrome Web Store](https://chromewebstore.google.com/detail/myriad-markets/iojngbokndmhhjmcjkbokckpcaaoholp?hl=en)

### Inferences
Suggested approach map (analysis, not sourced fact):
1. **Polymarket, integrity angle first.** Lead with the CDG case and offer a *verification layer*: multi-sensor cross-checks, tamper and anomaly alerts, signed and time-stamped records. Do not ask to replace Wunderground or NOAA. The Builders partners page is the only public door found. Any Korea-city scope needs Korean legal sign-off first because of the 2026-08-18 KMCSC block.
2. **UMA proposers and disputers.** They profit from being fast and right on settlement. A low-latency weather-observation API for the cities Polymarket lists (Asia especially) is a sellable product. Publicly available, well-documented readings also strengthen dispute cases.
3. **Chainlink as a pipe.** If weather settlement ever moves to oracle feeds, Chainlink is the incumbent pipe into Polymarket. Becoming a Chainlink data source is the prerequisite (the onboarding URL was not found this session).
4. **HIP-4 deployers (e.g., Outcome).** This is the cleanest "we are the settlement source" fit: the deployer carries slashing risk and needs defensible data. A joint listing of Asian-city weather outcome markets is technically possible; its legality in Korea is a separate question.
5. **BNB / YZi cluster (Opinion, Predict.fun).** These venues are Asia-focused, newer and building AI or evidence-based oracles. Pitch as a named evidence source inside Opinion AI or Predict.fun market rules.
6. **Dispute layers (Augur Lituus, Kleros/Reality.eth).** Position as a neutral evidence provider for contested weather outcomes. This is a low-revenue but high-credibility channel.
7. **Traders' tools** (Polyweather, Polydata, vweatherstation and similar). This is B2B2C distribution with no platform approval needed. It may still raise the same Korea-legality question if it targets Korean users.

### Gaps
- I found no public "data provider" or "resolution source" partnership page for any platform, including Polymarket, Kalshi-on-chain, Opinion, Predict.fun, Limitless and Myriad. I also found no public market-proposal or submission form for Polymarket.
- Not found: UMA's official whitelist application route, Chainlink's data-provider onboarding page, and any grant program for oracle or data vendors other than Polymarket's builder grants and Kalshi's $2M Solana builder grants.
- It is unresolved whether Korean law exposes a Korean data vendor that supplies settlement data (a) to Polymarket's global markets on non-Korean cities, or (b) to US-regulated venues. This needs legal counsel. None of the sources address it.
