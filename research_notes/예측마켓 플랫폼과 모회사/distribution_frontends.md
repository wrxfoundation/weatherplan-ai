# Prediction-market distribution layer: front-ends, routing, parent companies and data deals (as of 2026-09-28)

Method note for the report writer: the session's shared WebSearch budget ran out partway through (200 of 200 used). Every WebFetch attempt to a primary page returned EGRESS_BLOCKED. The blocked domains were robinhood.com, nexteventhorizon.substack.com, fow.com, artemis.bm, interactivebrokers.com, predictionnews.com, polymarket.com, help.kalshi.com, legalsportsreport.com, ingame.com, sportico.com, docs.polymarket.us and news.kalshi.com. Following the brief, I did not retry, so **every finding below comes from search-engine result summaries and is tagged [search summary — primary not opened]**. Each date comes from the snippet or the URL path. "[older]" marks a pre-2026 item. "[UNVERIFIED #]" marks a number I could not trace to a primary source. "n/c" means not captured.

---

## 1. Brokerages and fintech apps: product, underlying exchange, launch dates

### Takeaway
Kalshi is still the default back-end for US retail brokerages (Webull, Coinbase, moomoo, Public). The largest distributor, Robinhood, has become a multi-venue router and part-owner of an exchange:
- **Venues:** it routes to Kalshi, ForecastEx, its own Rothera exchange (a joint venture with Susquehanna, live since June 2026) and OG.com (added September 2026).
- **Scale:** Q2 2026 prediction-market revenue was $156M on 13.6B contracts.
- **Shift away from Kalshi:** an analyst estimate puts about 23% of Robinhood's flow as moved off Kalshi since June.

Interactive Brokers sells only its wholly owned ForecastEx. tastytrade (on Apex's FCM infrastructure, July 2026) and Schwab (Cboe S&P 500 event-based options, announced June 2026) are entering with finance-only menus.

### Cited Findings

**Robinhood (Robinhood Markets, "HOOD")**
- 2025-03-17 [older]: Robinhood newsroom item "Prediction Markets Hub" — [Robinhood newsroom](https://robinhood.com/newsroom/robinhood-prediction-markets-hub) [search summary — primary not opened]
- Robinhood event contracts are offered by Robinhood Derivatives, LLC, "a registered futures commission merchant and swap firm", "through either KalshiEX LLC, ForecastEX, LLC or Rothera Exchange and Clearing LLC". An earlier disclosure said probabilities were "referenced or sourced from" KalshiEx and ForecastEx. Categories are sports, politics, weather, commodities and entertainment. Trading is on mobile only; the web is view-only. — [Robinhood support: Event contracts overview](https://robinhood.com/us/en/support/articles/robinhood-event-contracts/); [PredictionNews](https://predictionnews.com/story/neil-paine-notes-kalshi-and-forecastex-event-contract-sourcing-on-robinhood-c78d80f7) [search summary — primary not opened]
- 2025-11-25 [older]: Robinhood and Susquehanna announced a joint venture that would acquire MIAXdx, a CFTC-licensed DCM, DCO and SEF — [Robinhood newsroom (dated Nov 25, 2025)](https://www.robinhood.com/us/en/newsroom/robinhood-prediction-markets-joint-venture/); [Sportico 2025](https://www.sportico.com/business/sports-betting/2025/robinhood-prediction-market-exchange-clearinghouse-1234877721/) [search summary — primary not opened]
- The acquisition closed in January 2026. Robinhood guided to a Q2 launch, and Rothera's own site listed May 2026. Rothera actually launched in June 2026. — [Yahoo Finance/Zacks "Why Rothera Matters"](https://finance.yahoo.com/markets/options/articles/robinhoods-prediction-market-push-why-130400265.html); [Next Event Horizon](https://nexteventhorizon.substack.com/p/robinhood-and-susquehanna-complete-prediction-markets-acquisition) [search summary — primary not opened]
- June 2026: "The World Cup is Now Trading on Robinhood and Rothera". Rothera had filed soccer contracts before launch. — [Robinhood newsroom](https://robinhood.com/us/en/newsroom/the-world-cup-is-now-trading-on-robinhood-and-rothera/); [DeFi Rate](https://defirate.com/news/rothera-files-soccer-contracts-robinhood-backed-prediction-markets-near-launch/) [search summary — primary not opened]
- 2026-07-29, Q2 2026 results:
  - 13.6B event contracts traded and a record $156M in prediction-market revenue.
  - Rothera is described as "independently managed through Robinhood's joint venture with Susquehanna International Group", with more than 3.5B contracts traded to date.
  - Rothera generated $17M of Q2 event-contract revenue.
  - Sources: [Robinhood Q2 2026 release](https://investors.robinhood.com/news-releases/news-release-details/robinhood-reports-second-quarter-2026-results); [ReadWrite](https://readwrite.com/prediction-markets-robinhood-revenue/) [search summary — primary not opened]
- Q2 earnings-call coverage says Rothera will take "most, but far from all" of the flow. Robinhood was still sending more than $1B a week, about 60% of its prediction-market volume, to Kalshi. — [InGame](https://www.ingame.com/robinhood-rothera-earnings-call/); [CNBC 2026-09-03](https://www.cnbc.com/2026/09/03/piper-sandler-expects-robinhood-to-start-football-season-with-a-win.html) [search summary — primary not opened] [UNVERIFIED #]
- 2026-09-03: Piper Sandler analyst Patrick Moley estimates about 23% of Robinhood's prediction volume has moved from Kalshi to Rothera since June. Robinhood traded more than 12B event contracts in 2025 and more than 16B so far in 2026. This is an analyst estimate, not a company disclosure. — [CNBC](https://www.cnbc.com/2026/09/03/piper-sandler-expects-robinhood-to-start-football-season-with-a-win.html) [search summary — primary not opened]
- 2026-09-08: Robinhood signed a deal with Crypto.com and OG.com. [search summary — primary not opened]
  - Robinhood will route "a portion of its football prediction contracts" to OG.com's CFTC-regulated exchange and clearinghouse.
  - OG.com joins Kalshi, ForecastEx and Rothera as a Robinhood venue.
  - The deal values OG.com at $5B after its planned spin-off.
  - Robinhood receives equity stakes in both Crypto.com and OG.com.
  - Sources: [Axios](https://www.axios.com/2026/09/08/robinhood-crypto-og-kalshi-prediction-markets); [Yogonet 2026-09-09](https://www.yogonet.com/international/news/2026/09/09/126307-robinhood-expands-prediction-markets-through-cryptocom-ogcom-tieup); [Casino.org](https://www.casino.org/news/robinhood-announces-prediction-market-partnership-with-crypto-com-gains-equity-stake/); [Robinhood newsroom](https://robinhood.com/us/en/newsroom/robinhood-cryptocom/)
- Midterm election contracts are currently routed to both Kalshi and Rothera, with possible expansion to Crypto.com and OG.com "in the coming weeks". OG.com is described as an "infrastructure and clearing provider" for Robinhood. — [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/robinhood-strikes-prediction-markets-deal-124748312.html); [Sportico 2026](https://www.sportico.com/business/sports-betting/2026/robinhood-prediction-market-og-exchange-deal-1234944632/); [EGR North America](https://www.egr.global/northamerica/news/robinhood-strikes-prediction-markets-deal-with-crypto-com-spin-off-og-com/) [search summary — primary not opened]

**Interactive Brokers → ForecastEx (wholly owned)**
- ForecastEx LLC is a CFTC-registered DCM and DCO and a wholly owned subsidiary of Interactive Brokers Group. It began operating on 2024-08-01 [older]. — [ForecastEx About](https://forecastex.com/about); [Market Math review 2026](https://marketmath.io/platforms/forecastex); [pm.wiki](https://pm.wiki/learn/forecastex-prediction-market) [search summary — primary not opened]
- Access is through ForecastTrader on web, mobile, Trader Workstation and API. The fee is a flat $0.01 per contract: matched Yes and No bids total $1.01, with no maker/taker fees. — [Market Math](https://marketmath.io/platforms/forecastex) [search summary — primary not opened]
- ForecastTrader offers yes/no contracts on political, economic, financial and climate events, priced $0.02–$0.99. — [IBKR Campus lesson](https://www.interactivebrokers.com/campus/trading-lessons/prediction-markets-at-interactive-brokers/) [search summary — primary not opened]
- ForecastEx is also one of Robinhood's venues (see the Robinhood entries above).

**Webull ("BULL") → Kalshi**
- "Webull Connects to Kalshi": the release says Webull plans to become a Kalshi clearing member. The release date was not captured. — [PR Newswire](https://www.prnewswire.com/news-releases/webull-connects-to-kalshi-to-offer-investors-innovative-prediction-markets-302373541.html) [search summary — primary not opened]
- 2025-06-10 [older]: Webull launched Kalshi's hourly crypto contracts (BTC and ETH). — [Nasdaq PR](https://www.nasdaq.com/press-release/webull-launches-kalshis-hourly-crypto-markets-investing-platform-2025-06-10) [search summary — primary not opened]
- Sports prediction markets rolled out in Q3 2025. In late January 2026, Webull offered $0 commission on Big Game contracts. — [PR Newswire](https://www.prnewswire.com/news-releases/webull-introduces-0-commission-trading-on-pro-football-big-game-prediction-markets-302670228.html); [Yahoo Finance](https://finance.yahoo.com/news/webull-bull-big-game-push-060755476.html) [search summary — primary not opened]
- The product page reads "Hourly Market Predictions & Fed Events Powered by Kalshi". — [Webull](https://www.webull.com/trading-investing/events-trading/kalshi) [search summary — primary not opened]

**Coinbase → Kalshi**
- December 2025 [older]: a report said Coinbase was preparing a prediction-market and tokenized-equities launch for December 17. — [Yahoo Finance](https://finance.yahoo.com/news/coinbase-preps-prediction-market-tokenized-203359643.html) [search summary — primary not opened]
- 2026-01-28: Coinbase rolled out Kalshi-powered prediction markets in all 50 US states, tradable in USD or USDC. Coverage said "all market flow currently comes from Kalshi", with plans to add more platforms "in the coming months". — [Invezz 2026-01-29](https://invezz.com/news/2026/01/29/coinbase-rolls-out-kalshi-powered-prediction-markets-across-all-50-us-states/); [Cointelegraph](https://cointelegraph.com/news/coinbase-prediction-markets-all-50-us-states-kalshi); [SBR](https://www.sportsbookreview.com/news/coinbase-launches-kalshi-prediction-markets-across-all-states-jan-30-2026/) [search summary — primary not opened]

**Charles Schwab → Cboe (event-based options, not a CFTC event-contract venue)**
- 2026-06-19 (WSJ, via CoinDesk): Schwab will partner with Cboe on yes/no options on the S&P 500, its first prediction-market move. [search summary — primary not opened]
  - Cboe's framework, announced in March 2026, is built on a Mini S&P 500 Index contract with a planned Q2 2026 launch and "Plus Zone" partial payouts.
  - Schwab will limit the product to verifiable financial-market outcomes, with no politics, sports or entertainment.
  - Schwab had $13.14T in client assets and 39.5M active brokerage accounts as of 2026-05-31.
  - Sources: [CoinDesk](https://www.coindesk.com/markets/2026/06/19/schwab-to-join-prediction-markets-race-with-s-and-p-500-event-based-options-wsj); [Quartz](https://qz.com/charles-schwab-cboe-prediction-markets-sp500-binary-options-062226); [Finance Magnates](https://www.financemagnates.com/forex/charles-schwab-brings-prediction-market-style-options-to-retail-investors/)

**Public.com → Kalshi**
- 2026-09-24: Public launched "AI Agents for Prediction Markets", available to all members. [search summary — primary not opened]
  - Kalshi provides the event contracts and handles the trades.
  - Categories are crypto, commodities, **climate**, economics, corporate events, markets, indices, tech & science, and politics & elections.
  - Sources: [PR Newswire](https://www.prnewswire.com/news-releases/public-launches-ai-agents-for-prediction-markets-302888505.html); [Fortune](https://fortune.com/2026/09/24/public-ai-trading-agents-prediction-markets-kalshi-tie-up/); [CNBC video, Leif Abraham](https://www.cnbc.com/video/2026/09/24/publicas-leif-abraham-on-launch-of-prediction-markets-integration-of-ai-agents.html)

**moomoo → Kalshi**
- moomoo partnered with Kalshi for contracts on Fed decisions, inflation, elections and cultural events, including the 2026 World Cup. The launch date was not captured. — [moomoo newsroom](https://www.moomoo.com/us/newsroom/prediction-markets); [DeFi Rate](https://defirate.com/news/moomoo-joins-retail-brokerage-push-into-prediction-markets/) [search summary — primary not opened]

**tastytrade → Apex Fintech Solutions FCM infrastructure (underlying exchange not named in snippets)**
- 2026-07-27: tastytrade launched Prediction Markets, the first broker on Apex's turnkey FCM infrastructure. [search summary — primary not opened]
  - The menu covers equity indices, Treasury yields, VIX and USD.
  - It includes Fed, ECB, BoE and BoJ rate decisions and CPI, PCE, NFP, GDP and ISM releases.
  - It includes BTC, ETH, SOL and XRP, plus crude, natural gas, gold, silver and copper.
  - Timeframes run from hourly to yearly.
  - Sources: [Business Wire](https://www.businesswire.com/news/home/20260727699288/en/tastytrade-Launches-Prediction-Markets-Giving-Active-Traders-a-Direct-Way-to-Trade-Real-World-Market-Events); [Apex press release](https://apexfintechsolutions.com/press-releases/tastytrade-launches-prediction-markets-giving-active-traders-a-direct-way-to-trade-real-world-market-events/)
- Finance Magnates (July 2026) said the E*TRADE, Schwab, Fidelity, Merrill Edge and SoFi Invest audiences "remain untapped" for CFTC event contracts. — [Finance Magnates](https://www.financemagnates.com/forex/tastytrade-follows-robinhood-moomoo-into-cftc-regulated-prediction-markets/) [search summary — primary not opened]

**eToro ("ETOR")**
- eToro targets a Q3–Q4 2026 launch. CEO Yoni Assia said prediction markets sit inside eToro's new non-custodial crypto wallet, to keep them separate from users' main investments. — [Finance Magnates](https://www.financemagnates.com/executives/etoro-ceo-were-in-a-strong-position-to-double-down-on-crypto-adds-prediction-markets/); [LinkedIn, US iGaming Hub](https://www.linkedin.com/posts/us-igaming-hub_etoro-targets-late-2026-for-prediction-markets-activity-7394690588526161920-jVfx) [search summary — primary not opened]

**SoFi**: no launch found (see the Finance Magnates item above).

### Inferences
- Pure brokers (Webull, Coinbase, moomoo, Public, tastytrade) pass the listing exchange's contracts through unchanged. They decide which venue to use, not the contract terms or the settlement data source.
- The only brokerage-side contract designers are exchange owners: Robinhood through Rothera (with Susquehanna) and Interactive Brokers through ForecastEx.
- Robinhood's multi-homing has three effects:
  - Robinhood's routing desk is now a gatekeeper for which exchange's contracts reach the largest retail audience.
  - Kalshi's share of Robinhood flow is falling.
  - Rothera, OG.com and ForecastEx each gain a direct path to Robinhood users.
- Schwab and tastytrade offer finance-only menus with no sports or politics. Public lists "climate" but no sports. This suggests "verifiable data" contracts are the acceptable format for traditional brokers, and weather or climate indices fit that format.

### Gaps
- Rothera details were not captured:
  - the exact equity split between Robinhood and Susquehanna, and any stake MIAX kept;
  - which categories Rothera lists, and whether that includes weather.
  - Background, unverified this session: the joint venture was to buy 90% of MIAXdx, with MIAX keeping 10% and Robinhood controlling.
- The size and form of Robinhood's equity stakes in Crypto.com and OG.com were not captured.
- Which exchange lists the Robinhood daily-temperature contracts (Kalshi, ForecastEx or Rothera) is unknown, because robinhood.com was blocked.
- tastytrade's underlying exchange(s) were not named in the snippets.
- Missing dates: the moomoo launch date and the Webull–Kalshi announcement date.
- Whether Coinbase added a second venue after January 2026 is unknown. A reported Coinbase acquisition of "The Clearing Company" in late 2025 is background only and unverified.
- Live status of the Schwab/Cboe product in September 2026 was not captured.
- eToro's underlying venue was not captured. No launches were found for SoFi, E*TRADE or Fidelity.
- Parent companies not verified this session (background knowledge, needs a check):
  - moomoo → Futu Holdings.
  - tastytrade → IG Group.
  - Public.com → privately held.
  - Coinbase → Coinbase Global.

---

## 2. Crypto exchanges and wallets offering prediction products

### Takeaway
Crypto players fall into two groups:
- **Exchange owners distributing their own contracts.** Crypto.com runs Crypto.com | Derivatives North America (CDNA) and in February 2026 spun it into the standalone OG.com, which Citadel Securities backed in July 2026. Gemini has run its own Gemini Titan DCM since December 2025. Kraken bought the Small Exchange DCM, but no launch was found.
- **Wallets that front-end someone else's order book.** MetaMask uses Polymarket; Phantom uses tokenized Kalshi; Trust Wallet uses Myriad, with Kalshi and Polymarket announced; Bitget Wallet uses Polymarket; Binance's wallet uses the BNB Chain venue Predict.fun, backed by YZi Labs.

No OKX or Bybit prediction product was found.

### Cited Findings

**Crypto.com → CDNA → OG.com (spun out)**
- 2026-02-03: Crypto.com launched "OG", a standalone prediction-market platform, days before the Super Bowl. [search summary — primary not opened]
  - OG offers CFTC-regulated sports event contracts plus finance, politics, culture and entertainment markets.
  - It says it is the "first" to offer margin trading on prediction contracts.
  - CEO Nick Lundgren is Crypto.com's Chief Legal Officer and led the 2022 CDNA acquisition.
  - Crypto.com cited "40x weekly growth" over six months [UNVERIFIED #].
  - Sources: [Crypto.com company news](https://crypto.com/en/company-news/cryptocom-launches-og-a-new-prediction-market-experience); [Finance Magnates](https://www.financemagnates.com/cryptocurrency/cryptocom-spins-out-standalone-prediction-markets-platform-after-40x-growth-surge/); [Coinpedia](https://coinpedia.org/news/crypto-com-launches-og-prediction-market-platform-days-before-super-bowl/)
- 2026-07-16: Citadel Securities made a $400M strategic investment in Crypto.com at a $20B valuation, Crypto.com's first institutional round since its 2016 founding. Coverage says Citadel bought stakes in both Crypto.com and OG, valuing them at $15B and $5B respectively. — [CoinDesk](https://www.coindesk.com/business/2026/07/16/citadel-securities-invests-usd400-million-in-crypto-com-valuing-exchange-at-usd20-billion); [PR Newswire](https://www.prnewswire.com/news-releases/cryptocom-announces-400-million-strategic-investment-from-citadel-securities-302827736.html); [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/robinhood-strikes-prediction-markets-deal-124748312.html) [search summary — primary not opened]
- CDNA/OG distribution partners are Underdog (September 2025 to July 2026), Fanatics Markets (December 2025), Truth Social's Truth Predict (announced October 2025) and Robinhood (September 2026). See sections 1 and 3.
- 2026 (headline only): "Crypto.com and PYMNTS Team on AI Predictions Market Contracts" — [PYMNTS](https://www.pymnts.com/economy/markets/2026/crypto-com-and-pymnts-team-on-ai-predictions-market-contracts/) [search summary — primary not opened]

**Gemini ("GEMI", Winklevoss-backed) → Gemini Titan (own DCM)**
- 2025-12-11 [older]: the CFTC granted a DCM license to Gemini Titan, LLC, which first applied on 2020-03-10. Gemini Predictions went live about a week later on web and iOS, with Android to follow, funded in USD. — [CoinDesk 2025-12-11](https://www.coindesk.com/markets/2025/12/11/gemini-becomes-first-crypto-exchange-approved-by-cftc-to-offer-u-s-prediction-markets); [Gemini blog: license](https://www.gemini.com/blog/gemini-receives-us-license-for-prediction-markets); [Gemini blog: live](https://www.gemini.com/blog/gemini-predictions-tm-is-now-live) [search summary — primary not opened]
  - **Conflict:** one search summary dated the license "December 11, 2024". The CoinDesk URL date of 2025-12-11 contradicts this, and I treat 2025 as correct.
- 2026 (headline only): "Gemini Plans Prediction Market Distribution Push After Bringing Clearing In-House" — [DeFi Rate](https://defirate.com/news/gemini-prediction-market-push-clearing-house/) [search summary — primary not opened]
- 2026-08-24 (headline only): "Crypto Prediction Markets Expand via Gemini Titan Apex Partnership" — [The Cryptonomist](https://en.cryptonomist.ch/2026/08/24/crypto-prediction-markets-gemini-titan/) [search summary — primary not opened]

**Kraken → Small Exchange (own DCM; launch not confirmed)**
- October 2025 [older]: Kraken bought Small Exchange, a CFTC-licensed DCM, from IG Group for $100M. On 2025-12-24, Kraken's global head of consumer Mark Greenberg told CNBC the company plans prediction markets in 2026. — [CNBC video](https://www.cnbc.com/video/2025/12/24/crypto-exchange-kraken-plans-to-offer-prediction-markets-in-2026-cnbc-crypto-world.html); [NEXT.io](https://next.io/news/betting/kraken-teases-2026-prediction-markets-launch/); [Casino.org](https://www.casino.org/news/kraken-could-be-next-crypto-broker-to-enter-prediction-markets/) [search summary — primary not opened]

**Binance / YZi Labs (formerly Binance Labs) → BNB Chain venues**
- Binance partnered with Predict.fun to add prediction markets to the Binance crypto wallet. Predict.fun launched on BNB Chain in December 2025 with YZi Labs support, and YZi later increased its stake. — [Incrypted](https://incrypted.com/en/binance-will-launch-prediction-markets-in-partnership-with-predict-fun/); [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/yzi-labs-boosts-stake-predict-164600673.html) [search summary — primary not opened]
- Opinion Labs funding and launch: [search summary — primary not opened]
  - August 2024: seed funding from YZi Labs.
  - 2025-03-18: a $5M seed round led by YZi.
  - October 2025: launch of O.LAB, a central-limit-order-book prediction market.
  - 2026-02-04: a $20M pre-Series A.
  - Headline: "Opinion claims 40% share", with no stated basis [UNVERIFIED #].
  - Sources: [Messari](https://messari.io/project/opinion-labs); [Cointelegraph via TradingView](https://www.tradingview.com/news/cointelegraph:f985c1855094b:0-cz-s-yzi-ramps-up-prediction-market-bet-as-opinion-claims-40-share/)
- PancakeSwap and YZi Labs announced a zero-fee prediction market on BNB Chain. — [Yahoo Finance](https://finance.yahoo.com/news/pancakeswap-yzi-labs-announce-zero-200134379.html) [search summary — primary not opened]

**Bitget, OKX and Bybit**
- Bitget Wallet integrated Polymarket. — [Bitget Wallet blog](https://web3.bitget.com/en/blog/articles/prediction-markets-polymarket) [search summary — primary not opened]
- No OKX or Bybit prediction product was found. OKX has only educational pages about Polymarket. — [OKX Learn](https://www.okx.com/en-us/learn/bitcoin-deposits-polymarket-prediction-markets) [search summary — primary not opened]

**MetaMask → Polymarket**
- MetaMask calls itself the "first self-custodial crypto wallet" to offer prediction-market trading, with Polymarket built into the app. Users can fund with one tap from any EVM chain and earn MetaMask Rewards points toward the planned MASK token. The date was not captured; context suggests late 2025. — [The Block](https://www.theblock.co/post/381592/metamask-moves-into-prediction-markets-with-polymarket-integration); [MetaMask news](https://metamask.io/news/introducing-metamask-prediction-markets) [search summary — primary not opened]

**Phantom → Kalshi (tokenized)**
- 2025-12-12 [older]: Phantom launched Phantom Prediction Markets with Kalshi for about 20M users [UNVERIFIED #]. Users buy tokenized positions referencing Kalshi markets with Solana tokens or Phantom's CASH stablecoin. — [CoinDesk](https://www.coindesk.com/business/2025/12/12/prediction-markets-are-coming-to-phantom-s-20m-user-via-kalshi); [Kalshi news](https://news.kalshi.com/p/kalshi-phantom-crypto-prediction-market-integration); [Business Wire](https://secure.businesswire.com/news/home/20251212601454/en/Phantom-and-Kalshi-Bring-Prediction-Markets-to-the-Worlds-Leading-Crypto-Wallet) [search summary — primary not opened]

**Trust Wallet ("CZ-owned") → Myriad, with Polymarket and Kalshi announced**
- 2025-12-02 [older]: Trust Wallet launched Predictions inside its Swaps page, powered by Myriad on BNB Chain, for more than 220M users [UNVERIFIED #]. Polymarket and Kalshi integrations were "coming soon". — [BeInCrypto](https://beincrypto.com/trust-wallet-predictions-launch/); [Finance Magnates](https://www.financemagnates.com/cryptocurrency/prediction-markets-boom-draws-cz-owned-trust-wallet-joining-metamask-and-polymarket-integrations/); [Cryptopolitan](https://www.cryptopolitan.com/myriad-trust-wallet-prediction-market/) [search summary — primary not opened]

### Inferences
- In crypto, Crypto.com/OG and Gemini Titan are the decision-makers who own their contracts:
  - Crypto.com/OG now carries Citadel Securities and Robinhood as shareholders, which raises its weight.
  - Gemini appears to be reselling Titan contracts through Apex's FCM network, based on headlines only.
- Wallets add reach but not contract ownership:
  - A Polymarket deal reaches MetaMask and Bitget Wallet users.
  - A Kalshi deal reaches Phantom users, and later Trust Wallet users.
- The Binance/YZi ecosystem (Opinion, Predict.fun, PancakeSwap, Myriad on BNB Chain) is an offshore, on-chain channel with no CFTC oversight. It is the most accessible Asian-audience channel, but its settlement integrity and regulatory status differ from US exchanges.

### Gaps
- Kraken launch status as of late September 2026 was not found. The absence of a result is not proof that Kraken has not launched.
- Unverified this session: whether Gemini Titan is the exchange behind tastytrade or other Apex brokers, and what the Gemini–Apex deal contains.
- The date of the MetaMask–Polymarket launch and whether MetaMask uses Polymarket's international or US order book were not captured.
- Whether Trust Wallet's Kalshi and Polymarket integrations went live was not captured.
- Which weather categories appear in each wallet interface is not captured.
- Parent companies not verified this session (background, needs a check): MetaMask → Consensys; Kraken → Payward; Trust Wallet → Binance founder's interests ("CZ-owned" per the Finance Magnates headline).

---

## 3. Sportsbooks, fantasy and gaming apps

### Takeaway
Sportsbooks and fantasy apps have moved from renting an exchange to owning one:
- **DraftKings** bought the Railbird DCM and launched its own DKeX exchange in June 2026. Polymarket was announced as its clearinghouse in October 2025, but later reports describe a path to Bitnomial clearing.
- **Underdog** started on Crypto.com's CDNA in September 2025 and ran all trading through its own Aristotle DCM/DCO from July 2026.
- **FanDuel** remains on CME Group (FanDuel Predicts, December 2025).
- **Fanatics Markets** runs on Crypto.com's CDNA (December 2025).
- **PrizePicks** is a registered futures commission merchant (FCM) sourcing from several exchanges: Kalshi and Polymarket, both from November 2025.
- **Penn Entertainment** has not launched a prediction product.

### Cited Findings

**DraftKings → Railbird / DKeX (own)**
- DraftKings acquired Railbird Technologies, a CFTC-registered DCM. One low-quality outlet reports a price of $250M [UNVERIFIED #]. — [DraftKings](https://www.draftkings.com/draftkings-acquires-railbird-to-advance-future-growth-in-prediction-markets); [Ballislife](https://ballislife.com/betting/play/draftkings-gobbles-up-railbird-to-get-into-predictions-markets/) [search summary — primary not opened]
- 2025-10-22 [older]: Polymarket was set to serve as clearinghouse for DraftKings' prediction product, using the clearing capability from its $112M QCEX purchase. — [Bloomberg](https://www.bloomberg.com/news/articles/2025-10-22/polymarket-set-to-clear-trades-in-draftkings-new-push-ceo-says); [The Block via TradingView](https://www.tradingview.com/news/the_block:d5c4af45c094b:0-polymarket-to-serve-as-clearinghouse-for-draftkings-prediction-market-following-railbird-acquisition/) [search summary — primary not opened]
- DraftKings Predictions launched in December 2025 in 38 states and expanded to 48, excluding Maine and New Hampshire. On 2026-06-26, DraftKings launched its own prediction exchange, DKeX. Later reports say CFTC staff cleared a regulatory path for Railbird to use **Bitnomial** as clearinghouse. This conflicts with, or updates, the Polymarket clearing announcement. — [SBC Americas 2026-06-26](https://sbcamericas.com/2026/06/26/draftkings-predictions-dkex-railbird/); [DeFi Rate](https://defirate.com/news/draftkings-railbird-exchange-files-first-sports-prediction-market-contracts/) [search summary — primary not opened]
- DraftKings Predictions passed $2.3B in annualized volume before the Railbird launch, with parlays coming [UNVERIFIED #]. — [DeFi Rate](https://defirate.com/news/draftkings-predictions-tops-2-3b-annualized-volume-railbird-launch-parlays-soon/) [search summary — primary not opened]

**FanDuel (Flutter Entertainment) → CME Group**
- 2025-12-22 [older]: FanDuel and CME Group launched FanDuel Predicts in Alabama, Alaska, South Carolina, North Dakota and South Dakota, with a phased national rollout through early 2026. [search summary — primary not opened]
  - Contracts cover the S&P 500, Nasdaq-100, oil and gas prices, and economic indicators.
  - Sports contracts (baseball, basketball, football, hockey) are offered only in states without legal online sports betting.
  - Sources: [CME Group press release](https://www.cmegroup.com/media-room/press-releases/2025/12/22/fanduel-and-cme-group-launch-fanduel-predicts.html); [Flutter press release](https://flutter.com/news-media/press-releases/fanduel-and-cme-group-launch-fanduel-predicts/); [DeFi Rate](https://defirate.com/news/fanduel-predicts-launches-in-five-states-in-partnership-with-cme-group/)

**PrizePicks → Kalshi and Polymarket (PrizePicks is a registered FCM)**
- November 2025 [older]: [search summary — primary not opened]
  - The NFA registered PrizePicks as an FCM, the first sports-entertainment operator to receive this registration.
  - Early in the week, PrizePicks announced a multi-year Polymarket partnership.
  - On Friday (2025-11-14 per the URL date), it launched with Kalshi contracts in 38 states plus DC. Sports contracts ("Team") are in 15 states including TX, GA and HI; culture markets are in 38 states.
  - PrizePicks said it will work with multiple DCMs.
  - Sources: [PrizePicks press](https://www.prizepicks.com/press-news/prizepicks-launches-prediction-markets-offering-with-kalshi); [CasinoBeats 2025-11-14](https://casinobeats.com/2025/11/14/prizepicks-launches-prediction-markets-kalshi-despite-polymarket-partnership/); [Kalshi news](https://news.kalshi.com/p/prizepicks-kalshi-prediction-markets-partnership)

**Underdog → Crypto.com CDNA (September 2025) → own exchange (July 2026)**
- September 2025 [older]: Underdog became the first sports-gaming operator to offer prediction markets, through Crypto.com's CDNA. It launched in 16 states with NFL, MLB and college football contracts; trading and settlement happened on CDNA. — [Underdog news](https://www.underdogsports.com/news/underdog-partners-with-crypto-com-to-enter-prediction-markets); [GamingToday](https://www.gamingtoday.com/news/crypto-com-underdog-launch-sports-prediction-markets/) [search summary — primary not opened]
- March 2026: Underdog acquired Aristotle Exchange DCM, Inc. and Aristotle Exchange DCO, Inc. By July 2026 it was self-certifying its own sports contracts and running trades on its own exchange instead of CDNA. — [SBC Americas 2026-07-20](https://sbcamericas.com/2026/07/20/underdog-prediction-market-exchange/); [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/underdog-launches-house-exchange-prediction-141300301.html); [NEXT.io review](https://next.io/prediction-markets/underdog/) [search summary — primary not opened]

**Fanatics Markets (Fanatics Inc.) → Crypto.com CDNA**
- 2025-12-03 [older]: Fanatics launched Fanatics Markets in 24 states including CA, TX, FL and WA. [search summary — primary not opened]
  - Markets and pricing come from CDNA; Fanatics controls the user experience.
  - "Phase Two" (early 2026) was to add crypto, stocks and IPOs, **climate**, pop culture, tech, AI, movies and music.
  - Sources: [Fanatics IR](https://investor.fanatics.com/news/news-details/2025/Fanatics-Launches-Fanatics-Markets-the-First-Prediction-Market-at-the-Intersection-of-Sports-Finance-and-Culture--2025-g7suBK0gon/default.aspx); [Crypto.com release](https://crypto.com/us/company-news/fanatics-launches-fanatics-markets-the-first-fan-led-prediction-market-at-the-intersection-of-sports-finance-and-culture-through-a-strategic-partnership-with-cryptocom); [Sportico](https://www.sportico.com/business/sports-betting/2025/fanatics-prediction-markets-crypto-launch-gambling-1234878084/)

**Penn Entertainment**
- 2026-08-06: Penn expects a prediction-market "arms race" in the 2026 NFL season but will keep disciplined marketing. No Penn prediction product was found. — [Covers](https://www.covers.com/industry/penn-maintains-vision-fall-prediction-market-arms-race-august-6-2026) [search summary — primary not opened]

**Truth Social / Trump Media ("DJT") → Crypto.com CDNA ("Truth Predict")**
- 2025-10-28 [older]: Trump Media announced an exclusive partnership with Crypto.com's US derivatives arm for "Truth Predict". Users would convert Truth gems into CRO. — [CoinDesk](https://www.coindesk.com/markets/2025/10/28/trump-media-taps-crypto-com-to-launch-prediction-markets-on-truth-social); [Crypto.com release](https://crypto.com/en/company-news/truth-social-to-become-worlds-first-social-media-platform-offering-prediction-markets-via-exclusive-partnership-with-cryptocom) [search summary — primary not opened]
- Headline only, date not captured: "Trump Media Abandons Crypto Treasury, Prediction Market Ventures". Current status is uncertain. — [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/trump-media-abandons-crypto-treasury-210559341.html) [search summary — primary not opened]

### Inferences
- Among sports front-ends, the contract decision-makers are now DraftKings (DKeX), Underdog (Aristotle) and CME (for FanDuel). Fanatics, PrizePicks and Truth Social are distributors.
- These operators' menus are sports-first, and none showed weather in the search results. They are low-priority targets for weather-data sales, except CME, whose own weather futures are out of scope here.
- PrizePicks shows that big distributors register as FCMs to multi-home across exchanges. This mirrors Robinhood's approach and weakens any single exchange's hold on distribution.

### Gaps
- The exchange behind DraftKings Predictions from December 2025 until DKeX launched was not captured.
- The final clearing arrangement for DKeX (Polymarket vs Bitnomial) was not confirmed.
- FanDuel Predicts' state count and weather availability in September 2026 were not captured. The structure of the CME–FanDuel partnership (announced in 2025, month n/c) was not captured.
- Fanatics' Phase Two status, and whether climate went live, was not captured.
- Underdog's exchange name after the acquisition and its contract categories were not captured.
- Other operators were not researched after the search budget ran out: Novig, Sporttrade, Sleeper, Betr, bet365, MGM, Caesars.
- Parent companies not verified this session (background, needs a check): PrizePicks → majority stake by Allwyn (announced 2025); Underdog → privately held.

---

## 4. Media and data distribution: who licenses prediction-market data, and who pays whom

### Takeaway
Media and data distribution has formed two mostly exclusive blocs:
- **Kalshi:**
  - CNN (exclusive; CNN pays nothing; December 2025).
  - CNBC (exclusive, multi-year, from 2026).
  - Data available on Bloomberg.
  - BMLL historical data for hedge funds (September 2026).
  - Its own Level 1 and Level 2 institutional feed (August 2026).
  - Cantor Fitzgerald institutional access (August 2026).
- **Polymarket:**
  - X and xAI (June 2025).
  - Dow Jones, publisher of WSJ, Barron's, MarketWatch and IBD (exclusive, January 2026).
  - ICE as exclusive institutional data distributor and investor ("Polymarket Signals and Sentiment", February 2026).

Google Finance shows both (November 2025). Yahoo Finance's Polymarket hub ended in April 2026, though Polymarket still advertises on Yahoo. Most money terms are undisclosed; the one explicit datapoint is that CNN does not pay Kalshi.

### Cited Findings

**Polymarket**
- 2025-06-06 [older]: X and xAI named Polymarket their official prediction-market partner. Grok annotates markets using X posts. — [PR Newswire](https://www.prnewswire.com/news-releases/polymarket-and--announce-official-prediction-market-partnership-302475432.html) [search summary — primary not opened]
- 2025-07-25 [older]: Grok became available on both the Kalshi and Polymarket apps. — [CNBC](https://www.cnbc.com/2025/07/25/musk-grok-kalshi-polymarket.html) [search summary — primary not opened]
- November 2025 [older]: Polymarket became Yahoo Finance's exclusive prediction-market partner, with a hub for economic, government and market outcomes. A Yahoo headline calls it the "exclusive crypto prediction market provider". [search summary — primary not opened]
  - The six-month term expired in spring 2026, and the hub was removed in April 2026.
  - The end was reported on 2026-09-18.
  - Polymarket remains an advertising partner across Yahoo.
  - Sources: [Bloomberg 2026-09-18](https://www.bloomberg.com/news/articles/2026-09-18/yahoo-finance-and-polymarket-end-prediction-market-partnership); [PYMNTS](https://www.pymnts.com/partnerships/2026/yahoo-finance-ends-polymarket-partnership-after-closing-prediction-markets-hub/); [Yogonet 2026-09-22](https://www.yogonet.com/international/news/2026/09/22/126499-yahoo-finance-ends-polymarket-prediction-market-partnership); [Yahoo Finance](https://finance.yahoo.com/news/polymarket-becomes-yahoo-finance-exclusive-174917116.html)
- 2026-01-07: Polymarket and Dow Jones announced an **exclusive** partnership. [search summary — primary not opened]
  - Polymarket data appears in modules on the WSJ, Barron's, MarketWatch and Investor's Business Daily sites, including homepage and market pages, plus select print placements.
  - Dow Jones will build new features such as a market-implied earnings calendar.
  - Sources: [Business Wire](https://www.businesswire.com/news/home/20260107511213/en/Polymarket-and-Dow-Jones-Publisher-of-The-Wall-Street-Journal-Announce-Exclusive-Prediction-Market-Partnership); [The Block](https://www.theblock.co/post/384646/polymarket-to-provide-prediction-data-to-wall-street-journal-barrons-in-dow-jones-deal)
- 2026-02-11: ICE launched "Polymarket Signals and Sentiment" and is the **exclusive provider** of this data to institutional capital markets. [search summary — primary not opened]
  - Near-real-time data is delivered through the ICE Consolidated Feed, and history through ICE Consolidated History.
  - Signals are mapped to securities using ICE reference data.
  - Sources: [ICE IR](https://ir.theice.com/press/news-details/2026/ICE-Launches-Polymarket-Signals-and-Sentiment-Tool-Turning-Crowd-Sourced-Dynamic-Views-into-Market-Opportunities/default.aspx); [Business Wire](https://www.businesswire.com/news/home/20260211340324/en/ICE-Launches-Polymarket-Signals-and-Sentiment-Tool-Turning-Crowd-Sourced-Dynamic-Views-into-Market-Opportunities); [ICE product page](https://www.ice.com/fixed-income-data-services/data-and-analytics/market-signals-and-sentiment)
- Headline, date n/c: Polymarket and Parcl partnered on real-estate markets settled on the Parcl Index. Polymarket launches and operates the markets; Parcl supplies independent index data. — [Bitget News](https://www.bitget.com/news/detail/12560605130779) [search summary — primary not opened]

**Kalshi**
- 2025-12-02 [older]: CNN named Kalshi its official prediction-market partner. [search summary — primary not opened]
  - CNN gets a direct API integration, led by chief data analyst Harry Enten, plus a Kalshi-powered on-air ticker.
  - CNN does **not pay** for the data, but the deal has exclusivity provisions that bar competing prediction markets.
  - Sources: [Axios](https://www.axios.com/2025/12/02/cnn-kalshi-prediction-market-data); [Kalshi news](https://news.kalshi.com/p/kalshi-cnn-prediction-market-partnership); [DesignRush](https://news.designrush.com/cnn-cnbc-integrate-kalshi-data-strengthen-market-coverage)
- December 2025 [older]: CNBC signed an exclusive multi-year deal. [search summary — primary not opened]
  - Kalshi data will appear on CNBC TV, digital and subscription platforms from 2026, including Squawk Box and Fast Money, with a Kalshi ticker.
  - Kalshi will host a CNBC page of CNBC-selected markets.
  - This was the first exclusive deal between a major financial news network and a prediction market.
  - Sources: [Brave New Coin](https://bravenewcoin.com/insights/kalshi-strikes-exclusive-cnbc-deal-after-landing-cnn-partnership-and-1-billion-funding); [Adweek](https://www.adweek.com/tvnewser/ticker-cnn-and-cnbc-strike-partnership-with-kalshi/)
- 2026-06-04: "Kalshi's market data is currently accessible on Bloomberg's platform." Separately, Kalshi was alpha-testing its own "Bloomberg Terminal"-style interface for heavy traders. — [CNBC](https://www.cnbc.com/2026/06/04/kalshi-is-building-a-bloomberg-terminal-for-prediction-markets.html) [search summary — primary not opened]
- Around 2026-08-12: Kalshi launched a real-time Level 1 and Level 2 order-book feed through Kalshi Research, built with DoubleZero Edge, for market makers and systematic firms. [search summary — primary not opened]
  - It covers sports and crypto perpetual futures, which Kalshi says are about 60% of weekly notional volume.
  - Kalshi is **waiving its share of data revenue for the first year**.
  - Sources: [Finance Magnates](https://www.financemagnates.com/fintech/kalshi-launches-real-time-level-2-data-feed-for-institutional-traders/); [CoinSpectator 2026-08-12](https://coinspectator.com/mainstream/2026/08/12/kalshi-launches-real-time-level-2-data-feed-for-institutional-traders/)
- 2026-08-19: Cantor Fitzgerald is opening Kalshi markets to about 3,000 institutional clients, including block trades. — [CoinDesk](https://www.coindesk.com/markets/2026/08/19/cantor-opens-kalshi-prediction-markets-to-thousands-of-institutional-clients); [CNBC](https://www.cnbc.com/2026/08/19/hedge-funds-are-about-to-jump-in-big-to-prediction-markets.html) [search summary — primary not opened]
- 2026-09-17: BMLL and Kalshi partnered to supply Kalshi's normalized event-contract history to quant, macro and systematic hedge funds for backtesting. — [Crowdfund Insider](https://www.crowdfundinsider.com/2026/09/311055-bmll-brings-kalshi-prediction-markets-into-institutional-research-workflows/); [Markets Media](https://www.marketsmedia.com/bmll-kalshi-expand-institutional-access-to-prediction-market-data/) [search summary — primary not opened]

**Both exchanges**
- 2025-11-06 [older]: Google Finance and Google Search integrated Kalshi and Polymarket odds. Users can ask natural-language questions, and Google Labs users got access first. — [CoinDesk](https://www.coindesk.com/markets/2025/11/06/google-brings-prediction-markets-polymarket-and-kalshi-to-its-search-and-finance-platforms); [Bloomberg](https://www.bloomberg.com/news/articles/2025-11-06/google-to-offer-kalshi-and-polymarket-data-on-finance-searches) [search summary — primary not opened]

### Inferences
- Who pays whom, based on the limited disclosures:
  - Consumer media placements (CNN, and likely CNBC, Dow Jones and Google) work as free or brand-for-data swaps with exclusivity. The exchanges treat them as distribution and marketing, not revenue.
  - Institutional data is the monetized channel: ICE for Polymarket; BMLL, Bloomberg and the Level 1/Level 2 feed for Kalshi.
  - Yahoo is the counter-example: after the data hub ended, the relationship reverted to Polymarket buying advertising.
- For a weather-data vendor, a co-branded weather index or settlement-grade dataset could be distributed through the exchange's institutional data channels (ICE for Polymarket; BMLL/Bloomberg for Kalshi), not only through the exchange's own interface.
- The Parcl–Polymarket model (third-party index, exchange-operated markets) is the closest public template for a weather-index settlement partnership.

### Gaps
- Refinitiv/LSEG, FactSet and S&P Global terminal integrations were not researched after the search budget ran out.
- The Bloomberg–Kalshi commercial terms, and whether Polymarket data is on Bloomberg, were not captured.
- The money terms and revenue shares were not found for:
  - the CNBC, Dow Jones, X and Google deals;
  - ICE–Polymarket data revenue.
- Sports-league data and brand deals (NHL, UFC, MLS and others with Kalshi or Polymarket) were not researched.
- Additional media partners (Substack, Stocktwits, AP, etc.) were not researched.

---

## 5. Exchange tie-ups with major financial players, investors and market makers (dated)

### Takeaway
By September 2026, every major prediction-market exchange has a large financial backer:
- **Polymarket:** ICE (up to $2B commitment from October 2025, plus $600M in March 2026, about 22% of equity [UNVERIFIED #]).
- **Kalshi:** Sequoia, a16z, Paradigm, Coatue, Morgan Stanley and others ($22B valuation in 2026, reportedly seeking $40B).
- **Crypto.com/OG:** Citadel Securities ($400M in July 2026) and now Robinhood equity (September 2026).
- **Rothera:** Susquehanna, as Robinhood's joint-venture partner.
- **FanDuel Predicts:** CME Group.
- **Schwab product:** Cboe.

Proprietary trading firms (Susquehanna, Jump, DRW, Wintermute) supply liquidity. Jump is taking equity in exchange for liquidity at both Kalshi and Polymarket.

### Cited Findings
- **Susquehanna ↔ Kalshi**, 2024-04-03 [older]: SIG became Kalshi's first dedicated institutional market maker. — [Business Wire](https://www.businesswire.com/news/home/20240403664852/en/Kalshi-Onboards-Its-First-Dedicated-Institutional-Market-Maker) [search summary — primary not opened]
- **ICE ↔ Polymarket**, October 2025 [older]: ICE committed up to $2B at about $8B pre-money and gained rights to distribute Polymarket data to institutions worldwide. — [ICE IR 2025](https://ir.theice.com/press/news-details/2025/ICE-Announces-Strategic-Investment-in-Polymarket/default.aspx) [search summary — primary not opened]
- **ICE ↔ Polymarket**, 2026-03-27: ICE invested a further $600M in cash under the same commitment. Coverage says: [search summary — primary not opened]
  - ICE holds about 22% of equity, and the stake was valued at $1.64B by March.
  - ICE booked a $389M Q1 2026 fair-value gain, per SEC filings; this needs a 10-Q check [UNVERIFIED #].
  - Sources: [ICE IR 2026](https://ir.theice.com/press/news-details/2026/Intercontinental-Exchange-Announces-New-600-Million-Investment-in-Polymarket/default.aspx); [CoinDesk](https://www.coindesk.com/markets/2026/03/27/nyse-owner-doubles-down-on-polymarket-with-fresh-usd600-million-investment); [FinTech Weekly](https://www.fintechweekly.com/news/intercontinental-exchange-polymarket-financial-data-infrastructure-2026)
- **ICE ↔ Polymarket**, 2026-08-20: ICE CEO Jeff Sprecher said ICE would consider joining Polymarket's new round. On 2026-09-01, Polymarket's proposed valuation was reported at $21B, up about 40% from $15B [UNVERIFIED #]. — [Bloomberg](https://www.bloomberg.com/news/articles/2026-08-20/nyse-owner-says-firm-to-look-at-polymarket-s-new-funding-round); [The Cryptonomist](https://en.cryptonomist.ch/2026/09/01/polymarket-funding-round/) [search summary — primary not opened]
- **Polymarket US infrastructure** [search summary — primary not opened]:
  - Polymarket bought QCEX (DCM and DCO) for $112M. Coverage says June 2025; my background recollection is July 2025, so the month conflicts.
  - The CFTC approved an amended order of designation that enables US access through FCMs (release date n/c).
  - The US app reportedly went live in January 2026 with intermediated access; this comes from lower-quality guide sites.
  - Polymarket's FCM registration was filed on 2026-07-03 through the affiliate "Coming Home GBA" [UNVERIFIED].
  - Sources: [The Block via TradingView](https://www.tradingview.com/news/the_block:d5c4af45c094b:0-polymarket-to-serve-as-clearinghouse-for-draftkings-prediction-market-following-railbird-acquisition/); [PR Newswire](https://www.prnewswire.com/news-releases/polymarket-receives-cftc-approval-of-amended-order-of-designation-enabling-intermediated-us-market-access-302625833.html); [Polymarket US FCM docs](https://docs.polymarket.us/partners/fcms); [99Bitcoins](https://99bitcoins.com/news/altcoins/polymarket-fcm-registration-us-margin-trading/); [StartPolymarket](https://startpolymarket.com/countries/united-states/)
- **Kalshi funding**:
  - 2025-11-20 [older]: $1B at an $11B valuation. — [TechCrunch](https://techcrunch.com/2025/11/20/source-kalshis-valuation-jumps-to-11b-after-raising-massive-1b-round) [search summary — primary not opened]
  - 2026-03-19: $1B at a $22B valuation. One summary instead places a "$1B Series F at $22B led by Coatue" in **May 2026**, with Sequoia, a16z, IVP, Paradigm, **Morgan Stanley** and ARK participating. **The dates conflict** (March vs May). — [Bloomberg 2026-03-19](https://www.bloomberg.com/news/articles/2026-03-19/kalshi-gets-1-billion-in-new-funding-at-22-billion-valuation); [Kalshi news](https://news.kalshi.com/p/kalshi-raises-1-billion-22-billion-valuation-institutional-demand-surges) [search summary — primary not opened]
  - 2026-06-24: Kalshi is seeking funding at a $40B valuation, with a possible Q3 close and an IPO eyed for 2027. — [CoinDesk](https://www.coindesk.com/business/2026/06/24/kalshi-targets-a-massive-usd40-billion-valuation-widening-lead-over-rival-polymarket) [search summary — primary not opened]
- **Jump Trading ↔ Kalshi and Polymarket**, 2026-02-09: Jump is taking equity in exchange for providing liquidity. At Kalshi the stake is a set amount; at Polymarket it grows with the US trading capacity Jump provides. Valuations at the time were Kalshi $11B and Polymarket $9B. — [Bloomberg](https://www.bloomberg.com/news/articles/2026-02-09/jump-trading-poised-to-gain-stakes-in-kalshi-and-polymarket); [CoinDesk](https://www.coindesk.com/business/2026/02/10/jump-trading-to-take-small-stakes-in-polymarket-kalshi-bloomberg) [search summary — primary not opened]
- **Market-maker desks**: DRW, Susquehanna, Jump and Wintermute have built dedicated event-contract desks, and DRW is hiring. Susquehanna is described as Kalshi's "flagship" market maker. One article says combined Kalshi and Polymarket volume hit $44B in June 2026 [UNVERIFIED #]. — [Dow Theory Letters/FinancialContent 2026-01-23](https://markets.financialcontent.com/dowtheoryletters/article/predictstreet-2026-1-23-the-rise-of-information-finance-how-susquehanna-and-drw-are-professionalizing-prediction-markets); [Bayes Group](https://www.bayes-group.com/insights/prediction-markets-desk-hiring-2026) [search summary — primary not opened]
- **Citadel Securities ↔ Crypto.com/OG** (2026-07-16), **Robinhood ↔ Crypto.com/OG** (2026-09-08) and **Robinhood ↔ Susquehanna/Rothera** (announced 2025-11-25, closed January 2026, live June 2026): see sections 1 and 2.
- **CME Group ↔ FanDuel** (FanDuel Predicts, 2025-12-22) and **Cboe ↔ Schwab** (2026-06-19): see sections 1 and 3.
- **Apex Fintech ↔ tastytrade** (2026-07-27) and **Apex ↔ Gemini Titan** (headline, 2026-08-24): see sections 1 and 2.

### Inferences
- The balance sheets behind each exchange shape its product priorities. ICE's investment is explicitly data-driven, so Polymarket's institutional data channel is strategically important. Kalshi's investor base (including Morgan Stanley) and its Cantor and BMLL deals point to an institutional push. Both make settlement-grade data (including weather) more valuable to each exchange.
- Robinhood's stakes in Rothera and OG make it both a distributor and an exchange owner. Its routing choices are no longer neutral.

### Gaps
- The exact equity percentages were not captured for: Susquehanna in Rothera, Robinhood in Crypto.com/OG, Jump in Kalshi and Polymarket, and Citadel's split between Crypto.com and OG.
- Whether Kalshi's $40B round closed by late September 2026 is unknown.
- Whether Polymarket's round at about $21B closed, and who led it, is unknown.
- The terms of the CME–FanDuel commercial arrangement, such as revenue sharing, were not captured.
- DRW's role on specific venues was not confirmed.

---

## 6. Weather and climate: which front-ends surface it, and who sets settlement data

### Takeaway
Weather contracts reach retail users mainly where Kalshi, ForecastEx or Polymarket supply them:
- **Robinhood** shows daily high/low temperatures for US cities, including Boston, Philadelphia, Chicago, NYC and LA on 2026-09-28.
- **Public.com** lists a "climate" category (Kalshi).
- **IBKR** says temperature contracts are ForecastEx's most-traded.
- **OG/Crypto.com** has only a thin climate set (for example, "2026 hottest year").
- **Fanatics** planned climate for Phase Two.

Settlement sources are set by each exchange:
- **Kalshi:** the National Weather Service (NWS) climate report for daily high/low contracts, and The Weather Company for hourly temperature. Kalshi's climate vertical reportedly grew about 500% year on year [UNVERIFIED #].
- **Polymarket:** international daily-temperature markets, **including Seoul**, resolve on Weather Underground "Daily Observations" for Incheon International Airport (RKSI).

No weather surfacing was found at DraftKings, FanDuel, PrizePicks, Underdog, Webull, Coinbase, moomoo, Gemini or tastytrade.

### Cited Findings
- **Kalshi**:
  - It has a climate category and an hourly-temperature sub-category, covering hurricanes, daily temperatures, precipitation and natural disasters. — [Kalshi climate category](https://kalshi.com/category/climate); [Kalshi hourly temperature](https://kalshi.com/category/climate/hourly-temperature) [search summary — primary not opened]
  - Daily high/low markets settle on the NWS final climate report; hourly temperature markets settle on The Weather Company readings. — [Kalshi Help Center: Weather Markets](https://help.kalshi.com/en/articles/13823837-weather-markets); [Turbine blog 2026](https://www.turbinefi.com/blog/how-to-trade-kalshi-weather-markets-2026) [search summary — primary not opened]
  - The climate and weather vertical is up about 500% year on year and pacing toward $1.1B annualized [UNVERIFIED #]. By late August 2026, Kalshi's implied Atlantic season was about 9 named storms, 3 hurricanes and 1 major hurricane, against NOAA's May 21 outlook of 8–14, 3–6 and 1–3. — [PredictionNews](https://predictionnews.com/story/kalshi-and-polymarket-weigh-climate-markets-as-next-growth-area) [search summary — primary not opened]
  - Kalshi Research publishes on hedging climate risk. — [Kalshi Research](https://kalshi.com/research/insights/hedging-climate-risk) [search summary — primary not opened]
  - 2026-01-23: a winter storm drew bets on both Polymarket and Kalshi. — [Axios](https://www.axios.com/2026/01/23/winter-storm-snow-bet-polymarket-kalshi) [search summary — primary not opened]
- **Polymarket**:
  - The Climate & Science category had 752 markets at snapshot, with Weather, Daily Temperature and Earthquakes sub-categories [count fluctuates]. — [Polymarket Weather](https://polymarket.com/climate-science/weather); [Polymarket Daily Temperature](https://polymarket.com/predictions/daily-temperature) [search summary — primary not opened]
  - Seoul markets such as "Highest temperature in Seoul (Incheon) on August 7 [2026]" resolve on Weather Underground data for Incheon Intl Airport. The rule uses the "Daily Observations" table, not the "Day High & Low" summary. Third-party trackers describe RKSI METAR as the basis. — [PolyBet](https://www.polybet.live/en/event/highest-temperature-in-seoul-on-august-7-2026); [Polymarket Analytics (Seoul, Mar 19)](https://polymarketanalytics.com/markets/272241); [vweatherstation Seoul tracker](https://vweatherstation.com/prediction-markets/seoul/) [search summary — primary not opened]
  - A third-party guide says daily high-temperature markets cover 55 cities [UNVERIFIED #]. — [Polymarkets.co.il guide](https://polymarkets.co.il/en/guide/polymarket-weather-by-city/) [search summary — primary not opened]
  - Third-party data tools exist that scrape Polymarket city temperatures from METAR. — [Apify](https://apify.com/gratified_ashram/kalshi-weather-index/examples/polymarket-global-city-temperatures-metar) [search summary — primary not opened]
- **Robinhood**: it has climate, temperature and daily-high-temperature hubs, with 2026-09-28 daily high/low markets for Boston, Philadelphia, Chicago, NYC and LA, and a Robinhood Learn guide to climate and weather contracts. — [Robinhood daily high temperature](https://robinhood.com/us/en/prediction-markets/climate/daily-high-temperature/); [Robinhood NYC low 2026-09-28](https://robinhood.com/us/en/prediction-markets/climate/events/new-york-city-daily-temperature-low-september-28-2026-sep-28-2026/); [Robinhood Learn](https://robinhood.com/us/en/learn/articles/trading-climate-weather-event-contracts/) [search summary — primary not opened]
- **ForecastEx/IBKR**: [search summary — primary not opened]
  - IBKR's founder said temperature contracts are the most frequently traded (article date n/c).
  - IBKR Campus has a page on ForecastEx "Daily High Temperature Markets".
  - ForecastEx's climate contracts include temperature records and hurricane landfalls.
  - Sources: [Artemis.bm](https://www.artemis.bm/news/weather-the-most-frequently-traded-forecast-contracts-at-interactive-brokers-founder/); [IBKR Campus](https://www.interactivebrokers.com/campus/traders-insight/ibkr-climate-energy/daily-high-temperature-markets-at-forecastex/); [IBKR hedging lesson](https://www.interactivebrokers.com/campus/trading-lessons/forecast-contracts-to-hedge/)
- **OG.com / Crypto.com**: weather sits inside OG's climate category, but the offering is thin, for example whether 2026 will rank as the hottest year on record. OG publishes a guide to trading weather and climate markets. — [OG Learn](https://og.com/learn/how-to-trade-weather-and-climate-prediction-markets); [TheLines](https://www.thelines.com/prediction-markets/climate/); [Dimers](https://www.dimers.com/prediction-markets/climate) [search summary — primary not opened]
- **Public.com** (Kalshi) lists "climate" among its launch categories on 2026-09-24. **Fanatics Markets** (CDNA) planned climate for "Phase Two" in early 2026. See sections 1 and 3.
- Integrity risk, headline only: "Weather Forecasts Are Being Sabotaged by Crypto Bettors". — [Brandsynario](https://www.brandsynario.com/world/weather-forecasts-are-being-sabotaged-by-people-betting-on-the-weather/) [search summary — primary not opened]

### Inferences
- The party that chooses the weather settlement source is the listing exchange's product and market-resolution team, not the app that displays the contract. Examples:
  - Kalshi uses NWS and The Weather Company.
  - Polymarket uses Weather Underground/RKSI for Seoul.
  - ForecastEx's source was not captured.
- Kalshi already uses a private vendor (The Weather Company) as a settlement source for hourly contracts. This is a precedent for private weather-data vendors acting as settlement agents.
- For a Korean weather-data company, Polymarket's Seoul daily-temperature markets are the most direct hook. They currently rely on a single consumer-website table (Weather Underground's RKSI "Daily Observations"). Proposals could include a settlement-grade Korean station index, backup or verification data, or dispute-resolution data. The Parcl model in section 4 is the template.
- US exchanges (Kalshi, ForecastEx, Rothera, OG) list US-city contracts. Adding Asian cities would require the exchange's product team to self-certify new contracts with the CFTC. The pitch therefore goes to exchanges, not to Robinhood, Coinbase or Webull, except that Robinhood influences demand through its routing.

### Gaps
- Which exchange lists Robinhood's temperature contracts, and whether Rothera or OG list weather, was not captured.
- Whether Coinbase, Webull, moomoo, Phantom and PrizePicks display Kalshi's climate markets was not verified. They route to Kalshi, so availability is plausible but unconfirmed.
- ForecastEx's settlement source and city list, including any non-US cities, were not captured because the IBKR pages were blocked.
- Whether Polymarket US (the CFTC-regulated venue) lists the same weather markets as Polymarket international was not captured.
- Whether Kalshi lists any non-US cities was not captured.
- The full list of Polymarket cities (Tokyo, Shanghai, Hong Kong, Singapore, and so on) was not captured.
- CME weather futures (HDD/CDD) are not surfaced through FanDuel Predicts according to the sources; this was not researched further.
- The manipulation story behind the "sabotaged forecasts" headline was not verified.

---

## 7. Routing map: who controls the contract (September 2026), parent companies and public partnership pages

### Takeaway
The exchange and clearinghouse that list a contract are the ones who define it, including its settlement data, and so are the buyers of weather indices or settlement data:
- Kalshi.
- Polymarket (international, and US via QCEX).
- ForecastEx (IBKR).
- CDNA/OG (Crypto.com, with Citadel and Robinhood as shareholders).
- Rothera (the Robinhood–Susquehanna joint venture).
- CME (FanDuel).
- Cboe (the Schwab product).
- Gemini Titan.
- DKeX/Railbird (DraftKings).
- Aristotle (Underdog).
- Myriad, Predict.fun and Opinion (on-chain, BNB Chain).

Front-ends control routing and presentation only. The exceptions, where the front-end also owns the exchange, are Robinhood, IBKR, Crypto.com, Gemini, DraftKings, Underdog and Kraken (pending).

### Cited Findings
| Front-end (parent) | Product / launch | Underlying exchange and clearing, September 2026 | Weather/climate surfaced? | Key source |
|---|---|---|---|---|
| Robinhood (HOOD) | Prediction Markets Hub, 2025-03 [older] | Kalshi, ForecastEx, Rothera (own joint venture with Susquehanna, live 2026-06), OG.com (from 2026-09, portion of football) | Yes: US-city daily high/low | [Robinhood support](https://robinhood.com/us/en/support/articles/robinhood-event-contracts/); [Axios](https://www.axios.com/2026/09/08/robinhood-crypto-og-kalshi-prediction-markets) |
| Interactive Brokers | ForecastTrader, 2024-08 [older] | ForecastEx (100% owned DCM and DCO) | Yes: temperature is the most-traded | [ForecastEx About](https://forecastex.com/about); [Artemis.bm](https://www.artemis.bm/news/weather-the-most-frequently-traded-forecast-contracts-at-interactive-brokers-founder/) |
| Webull (BULL) | Kalshi markets, 2025 [older] | Kalshi | Not evidenced | [Webull](https://www.webull.com/trading-investing/events-trading/kalshi) |
| Coinbase | All 50 states, 2026-01-28 | Kalshi (additional venues "planned") | Not evidenced | [Invezz](https://invezz.com/news/2026/01/29/coinbase-rolls-out-kalshi-powered-prediction-markets-across-all-50-us-states/) |
| Public.com | AI Agents for Prediction Markets, 2026-09-24 | Kalshi | Yes: "climate" category | [PR Newswire](https://www.prnewswire.com/news-releases/public-launches-ai-agents-for-prediction-markets-302888505.html) |
| moomoo | Launch date n/c (2026) | Kalshi | Not evidenced | [moomoo newsroom](https://www.moomoo.com/us/newsroom/prediction-markets) |
| tastytrade | 2026-07-27 | Apex FCM infrastructure; exchange n/c | No: finance-only menu | [Business Wire](https://www.businesswire.com/news/home/20260727699288/en/tastytrade-Launches-Prediction-Markets-Giving-Active-Traders-a-Direct-Way-to-Trade-Real-World-Market-Events) |
| Charles Schwab | Announced 2026-06 | Cboe (S&P 500 event-based options) | No: financial only | [CoinDesk](https://www.coindesk.com/markets/2026/06/19/schwab-to-join-prediction-markets-race-with-s-and-p-500-event-based-options-wsj) |
| eToro (ETOR) | Inside non-custodial wallet; target H2 2026 | n/c | n/c | [Finance Magnates](https://www.financemagnates.com/executives/etoro-ceo-were-in-a-strong-position-to-double-down-on-crypto-adds-prediction-markets/) |
| Crypto.com app / OG.com | OG launched 2026-02-03 | CDNA (own DCM and DCO); OG valued at $5B | Yes, thin (e.g., hottest year) | [Crypto.com](https://crypto.com/en/company-news/cryptocom-launches-og-a-new-prediction-market-experience); [OG Learn](https://og.com/learn/how-to-trade-weather-and-climate-prediction-markets) |
| Gemini (GEMI) | Gemini Predictions, 2025-12 [older] | Gemini Titan (own DCM; clearing brought in-house) | n/c | [CoinDesk](https://www.coindesk.com/markets/2025/12/11/gemini-becomes-first-crypto-exchange-approved-by-cftc-to-offer-u-s-prediction-markets) |
| Kraken | Launch not confirmed | Small Exchange (own DCM, bought 2025-10) | n/a | [CNBC](https://www.cnbc.com/video/2025/12/24/crypto-exchange-kraken-plans-to-offer-prediction-markets-in-2026-cnbc-crypto-world.html) |
| MetaMask | Late 2025 (n/c) | Polymarket | Polymarket lists weather; not verified in the wallet | [The Block](https://www.theblock.co/post/381592/metamask-moves-into-prediction-markets-with-polymarket-integration) |
| Phantom | 2025-12-12 [older] | Kalshi (tokenized) | n/c | [CoinDesk](https://www.coindesk.com/business/2025/12/12/prediction-markets-are-coming-to-phantom-s-20m-user-via-kalshi) |
| Trust Wallet | 2025-12-02 [older] | Myriad (BNB Chain); Polymarket and Kalshi "coming soon" | n/c | [BeInCrypto](https://beincrypto.com/trust-wallet-predictions-launch/) |
| Bitget Wallet | n/c | Polymarket | n/c | [Bitget Wallet blog](https://web3.bitget.com/en/blog/articles/prediction-markets-polymarket) |
| Binance Wallet | n/c | Predict.fun (BNB Chain, YZi-backed) | n/c | [Incrypted](https://incrypted.com/en/binance-will-launch-prediction-markets-in-partnership-with-predict-fun/) |
| DraftKings | Predictions 2025-12; DKeX 2026-06 | Railbird/DKeX (own). Clearing: Polymarket announced 2025-10, then a Bitnomial path | Not evidenced | [SBC Americas](https://sbcamericas.com/2026/06/26/draftkings-predictions-dkex-railbird/) |
| FanDuel (Flutter) | FanDuel Predicts, 2025-12-22 [older] | CME Group | Not evidenced | [CME press release](https://www.cmegroup.com/media-room/press-releases/2025/12/22/fanduel-and-cme-group-launch-fanduel-predicts.html) |
| PrizePicks | 2025-11-14 [older] | Kalshi and Polymarket (PrizePicks is an FCM) | Not evidenced | [CasinoBeats](https://casinobeats.com/2025/11/14/prizepicks-launches-prediction-markets-kalshi-despite-polymarket-partnership/) |
| Underdog | 2025-09 on CDNA; own exchange from 2026-07 | Aristotle Exchange DCM and DCO (own) | Not evidenced | [SBC Americas](https://sbcamericas.com/2026/07/20/underdog-prediction-market-exchange/) |
| Fanatics Markets | 2025-12-03 [older] | CDNA (Crypto.com) | Climate planned for Phase Two | [Fanatics IR](https://investor.fanatics.com/news/news-details/2025/Fanatics-Launches-Fanatics-Markets-the-First-Prediction-Market-at-the-Intersection-of-Sports-Finance-and-Culture--2025-g7suBK0gon/default.aspx) |
| Truth Social (DJT) | Announced 2025-10-28 [older] | CDNA (Crypto.com) | n/c; possibly abandoned (headline) | [CoinDesk](https://www.coindesk.com/markets/2025/10/28/trump-media-taps-crypto-com-to-launch-prediction-markets-on-truth-social) |
| Penn Entertainment | None found | none | none | [Covers](https://www.covers.com/industry/penn-maintains-vision-fall-prediction-market-arms-race-august-6-2026) |

All rows are [search summary — primary not opened].

**Public partnership and business-development pages** (URLs only; these are newsroom, press, product and partner-documentation pages that appeared in search results, not verified dedicated partnership forms):
- Kalshi:
  - https://news.kalshi.com/
  - https://kalshi.com/category/climate
  - https://kalshi.com/research/insights/hedging-climate-risk
- Polymarket US: https://docs.polymarket.us/partners/fcms
- ForecastEx: https://forecastex.com/about
- Robinhood:
  - https://robinhood.com/us/en/newsroom/
  - https://investors.robinhood.com/
- Crypto.com and OG:
  - https://crypto.com/en/company-news/
  - https://og.com/learn/how-to-trade-weather-and-climate-prediction-markets
- Gemini: https://www.gemini.com/blog/
- CME Group: https://www.cmegroup.com/media-room/
- ICE:
  - https://ir.theice.com/
  - https://www.ice.com/fixed-income-data-services/data-and-analytics/market-signals-and-sentiment
- Apex Fintech Solutions: https://apexfintechsolutions.com/press-releases/
- Flutter: https://flutter.com/news-media/press-releases/
- Fanatics: https://investor.fanatics.com/
- DraftKings: https://www.draftkings.com/draftkings-acquires-railbird-to-advance-future-growth-in-prediction-markets
- PrizePicks: https://www.prizepicks.com/press-news/
- Underdog: https://www.underdogsports.com/news/
- Webull: https://www.webull.com/trading-investing/events-trading/kalshi
- moomoo: https://www.moomoo.com/us/newsroom/prediction-markets
- tastytrade: https://tastytrade.com/prediction-markets/
- MetaMask: https://metamask.io/news/

### Inferences
- Priority contact list for selling weather indices or settlement data, by control over weather contracts:
  1. Kalshi: largest weather book; already uses a private settlement vendor for hourly contracts; distributed through Robinhood, Coinbase, Webull, moomoo, Public and Phantom.
  2. Polymarket: international Seoul markets; ICE-backed data channel.
  3. ForecastEx/IBKR: temperature is the top-traded category.
  4. Rothera: fast-growing share of Robinhood flow; weather listing unknown.
  5. OG/CDNA: thin climate set; Citadel- and Robinhood-backed.
- Sports-first exchanges (DKeX, Aristotle) and finance-only products (Cboe/Schwab, tastytrade) are lower priority.
- Distributors cannot change settlement terms. They are useful as demand signals: for example, Public listing "climate" and Robinhood's US-city temperature hubs show retail-facing interest.

### Gaps
- None of the listed front-ends shows a verified dedicated partnership or business-development intake page.
- Ownership percentages were not captured for most private entities: Rothera, OG, Underdog, PrizePicks and Public.
- Background parent-company facts not re-verified this session are listed in the Gaps of sections 1–3.
- Coverage was cut short by the exhausted search budget in these areas:
  - sports leagues;
  - Novig, Sporttrade, Sleeper and Betr;
  - Refinitiv/LSEG and FactSet;
  - Kraken's 2026 status;
  - Coinbase venues added after January 2026;
  - live status of Cboe/Schwab.
