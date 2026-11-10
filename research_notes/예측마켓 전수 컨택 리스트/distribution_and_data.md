# Prediction-market distribution layer (brokers, apps, wallets, exchange-integrated products) and data/analytics layer: contact targets for a weather-data company (as of 2026-10-11)

**Method and labels (read first).**
- **Searches:** 36 WebSearch queries ran before the session-wide budget (200 per turn, shared by all agents) ran out. Six more were refused: Oddpool–Kalshi deal details, River Markets, Kalshi–TWC, Polymarket weather tools, AI-agent builders and ICE news after 2026-09-20. Per the budget notice I did not work around this.
- **Primary pages:** every fetch failed, and none was retried.
  - WebFetch DNS failures: financemagnates.com, en.cryptonomist.ch, cnbc.com.
  - Egress-policy 403 through the session proxy: prnewswire.com, tastytrade.com, news.kalshi.com, fortune.com, dealroom.co, globenewswire.com, kucoin.com, docs.dune.com, bybit.com, wtvr.com, koreatimes.co.kr, quicknode.com, pm.wiki.
- **Source labels:**
  - **[SS]** = **[search summary, unverified]**, collected this session (2026-10-11).
  - **[PN]** = carried forward from the 2026-09-28 notes in `research_notes/예측마켓 플랫폼과 모회사/`. Those notes are themselves search summaries; no primary page was opened.
  - **[IR]** = our internal record, [internal_status.md](internal_status.md) in this folder. Names and titles there come from our own contact log and were not publicly verified this session.
  - **[agg]** = aggregator or directory source (pm.wiki, Quicknode builder listings, orrery.me, mirror sites). Low confidence.
  - **[>12mo]** = dated before 2025-10-11, so possibly stale.
- **Personal data:** names and public titles only. No emails, phone numbers or personal profile URLs.
- **Korea sensitivity scale:**
  - **HIGHEST:** routes users to, or analyses, Polymarket markets. Korea blocked Polymarket on 2026-08-18, citing weather and "Seoul August rainfall" markets.
  - **HIGH:** offshore or unregulated venue with no Korea geoblock found.
  - **MEDIUM:** Kalshi-linked or US-regulated venue that a Korean resident might reach.
  - **LOW:** US-resident-only product (inferred) or no weather exposure.
- **Fit codes:**
  - **Settle:** selling settlement data. Always NO for apps and wallets, because the listing exchange names the settlement source.
  - **Data:** trader-facing weather data or analytics.
  - **Co-mkt:** co-marketing.

---

## 1. Master table: which distribution- and data-layer entities fit a weather-data company, and with what offer?

### Takeaway
No app or wallet can buy settlement data, because the listing exchange writes the source into its rules. The realistic offers at this layer are trader-facing weather data or analytics and co-marketing.

The best fits combine a live climate surface with low Korea risk. Most are US-regulated, Kalshi-routed and reachable in New York:
- **Public.com:** AI agents for prediction markets launched 2026-09-24, with a climate category; based in New York.
- **IBKR ForecastTrader:** temperature is its most-traded category.
- **Robinhood:** temperature hubs. Its contact line is gated internally until 10/15.
- **Weather-native trader tools:** wethr.net and similar tools.
- **Verso:** a prediction-market terminal, reportedly in New York.
- **Kalshi's data arm:** it now includes Oddpool's team.

Treat as do-not-pursue until counsel clears the Korea question:
- **Polymarket front-ends:** MetaMask, Bitget Wallet, KuCoin Web3 Wallet, SafePal, Bybit Prediction and Byreal, Gate's consumer product, and eToro's wallet.
- **Polymarket-only analytics:** Hashdive, PolymarketAnalytics.

### Cited Findings
Every external cell below is [SS] unless tagged [PN] or [IR]. Fuller notes and quotes are in §2–§4.

| Entity | Segment | Owner/parent | Status & jurisdiction | Weather/climate exposure | Korea access / sensitivity | Public channels | People (Name — exact title — relevance — source, date) | HQ / NYC presence | Latest news (date) | Fit & risk notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **Robinhood** (Prediction Markets hub) | Broker app; multi-venue router and exchange co-owner | Robinhood Markets (HOOD). Event contracts come through Robinhood Derivatives, LLC (FCM) ([PN](https://robinhood.com/us/en/support/articles/robinhood-event-contracts/)). Co-owns Rothera with Susquehanna. Took stakes in Crypto.com and OG.com ([The Block 2026-09-08](https://www.theblock.co/news/markets/2026-09-08-robinhood-expands-prediction-markets-crypto-com-og-partnerships-nfl-season-413832)) | Live; hub launched 2025-03 [>12mo]. US only. Routes to Kalshi, ForecastEx, Rothera and OG.com ([The Block](https://www.theblock.co/news/markets/2026-09-08-robinhood-expands-prediction-markets-crypto-com-og-partnerships-nfl-season-413832)) | **YES.** Climate and temperature hubs with US-city daily highs and lows (e.g., 2026-09-28), plus a Learn guide ([PN](https://robinhood.com/us/en/prediction-markets/climate/daily-high-temperature/)) | **LOW** (US FCM product; inference). Internal gate: Robinhood's OG routing overlaps our Crypto.com MNDA; re-judged 10/15 ([IR](internal_status.md)) | [Newsroom](https://robinhood.com/us/en/newsroom/) [PN] | **JB Mackenzie** — "Vice President and General Manager of Futures and Prediction Markets" — runs the business — Finance Magnates, undated ([link](https://financemagnates.com/fintech/robinhood-takes-stakes-in-cryptocom-and-og-to-expand-prediction-markets)). Earlier title "VP & GM of futures and international" — Reuters via [Gazette 2025-10-13](https://gazette.com/2025/10/13/robinhood-open-to-deals-to-grow-prediction-markets-business-exec-says/). **Tom Chippas** — CEO, Rothera ([PN](https://www.gamblinginsider.com/news/179795/robinhood-q2-rothera-top-3-prediction-market-exchange)). Existing outreach: Kerbrat, Miller, White, Chippas ([IR](internal_status.md)) | HQ not verified this session. NYC staff per IR (Nicola White, Valeria R.). Johann Kerbrat speaks at Swell 2026, The Shed, NYC, 10/27–29 ([IR](internal_status.md)) | 2026-09-08: OG.com/Crypto.com deal, election hub with heat maps, custom combos ([The Block](https://www.theblock.co/news/markets/2026-09-08-robinhood-expands-prediction-markets-crypto-com-og-partnerships-nfl-season-413832)). Nothing dated 09-20 to 10-11 found | Settle NO (pitch Rothera, Kalshi and ForecastEx separately). Data MAYBE (weather-hub explainer content). Co-mkt MAYBE. Risks: contact cap already exceeded; wait for the 10/15 gate; do not name other platforms |
| **Interactive Brokers — ForecastTrader** (ForecastEx) | Broker app with its own exchange | Interactive Brokers. ForecastEx LLC is a wholly owned CFTC DCM and DCO ([IBKR PR 2026-01-22](https://www.interactivebrokers.com/en/general/about/mediaRelations/1-22-26.php)) | Live since 2024-08-01 [>12mo] ([IBKR PR](https://www.interactivebrokers.com/en/general/about/mediaRelations/8-1-24.php)). Availability "varies by IB affiliate and client country of residence" ([IBKR PR 2026-01-22](https://www.interactivebrokers.com/en/general/about/mediaRelations/1-22-26.php)) | **YES, the strongest of any broker.** Climate indicators at launch ([Zacks](https://www.zacks.com/stock/news/2294829/interactive-brokers-ibkr-arm-unveils-forecast-contracts) [>12mo]). Temperature is the most-traded category ([PN Artemis](https://www.artemis.bm/news/weather-the-most-frequently-traded-forecast-contracts-at-interactive-brokers-founder/)). Daily High Temperature markets ([PN IBKR Campus](https://www.interactivebrokers.com/campus/traders-insight/ibkr-climate-energy/daily-high-temperature-markets-at-forecastex/)) | **UNKNOWN.** The country list was not captured. If Korean IB clients can trade temperature contracts, the regulator's weather reasoning applies | [IBKR media relations](https://www.interactivebrokers.com/en/general/about/mediaRelations/1-22-26.php); [ForecastEx About](https://forecastex.com/about) [PN] | **Thomas Peterffy** — "founder and chairman" — owner ([IBKR PR 2026-01-22](https://www.interactivebrokers.com/en/general/about/mediaRelations/1-22-26.php)). **Philip Tetlock** — ForecastEx board member — resolution and integrity expertise (same release). **Robert Prior** — ForecastEx CEO ([PN, CFTC filings and rulebook](https://data.forecastex.com/regulatory/ForecastEx_LLC_Rulebook.pdf)). **Graham Deese** — Chief Regulatory Officer (LinkedIn headline, low confidence) [PN]. IR: no send record for Prior or Deese | ForecastEx is listed in Chicago in a Jan 2026 filing and Fort Lauderdale in an Apr 2026 filing (conflict) ([PN](https://www.cftc.gov/sites/default/files/filings/ptc/26/04/ptc040826884.pdf)). No NYC presence found | Jan 2026: Peterffy said IB will integrate betting more closely with its other services ([MarketScreener](https://www.marketscreener.com/news/interactive-brokers-says-betting-on-us-midterm-elections-should-juice-growth-of-its-platform-ce7e58d9d88bf62d)). Nothing in the window | Settle only through ForecastEx, not the app. Data MAYBE (IBKR Campus weather education). Co-mkt MAYBE |
| **Webull** | Broker app | Webull Corp. (BULL) [PN] | Kalshi-powered; rolled out in Q3 2025 [>12mo]. Plans Kalshi clearing membership ([PN](https://www.prnewswire.com/news-releases/webull-connects-to-kalshi-to-offer-investors-innovative-prediction-markets-302373541.html)). $0-commission Big Game contracts on 2026-01-27 ([Barchart](https://www.barchart.com/story/news/37249506/webull-introduces-0-commission-trading-on-pro-football-big-game-prediction-markets)). US | Not evidenced. Product page reads "Hourly Market Predictions & Fed Events" ([PN](https://www.webull.com/trading-investing/events-trading/kalshi)) | **LOW** (US; inference) | [Kalshi page](https://www.webull.com/trading-investing/events-trading/kalshi) | None captured | Not captured | None found for Sept–Oct 2026 ([BrokerChooser](https://brokerchooser.com/news/webulls-2026-prediction-market-what-traders-need-to-know--3896f8aa)) | Settle NO; Data LOW; Co-mkt LOW |
| **Public.com** | Broker app ("agentic brokerage") | Public (ownership not captured) | "AI Agents for Prediction Markets" launched 2026-09-24 to all members. Kalshi supplies the markets and handles execution. US ([Fortune](https://fortune.com/2026/09/24/public-ai-trading-agents-prediction-markets-kalshi-tie-up/); [Kalshi News](https://news.kalshi.com/p/public-kalshi-prediction-markets-ai-agents)) | **YES.** "Climate" is a launch category ([PN PR Newswire](https://www.prnewswire.com/news-releases/public-launches-ai-agents-for-prediction-markets-302888505.html)). Agents run rules the user has approved | **LOW** (US; inference) | [PR Newswire](https://www.prnewswire.com/news-releases/public-launches-ai-agents-for-prediction-markets-302888505.html); [Kalshi News](https://news.kalshi.com/p/public-kalshi-prediction-markets-ai-agents) | **Leif Abraham** — title not captured — launch spokesperson on CNBC, 2026-09-24 ([PN](https://www.cnbc.com/video/2026/09/24/publicas-leif-abraham-on-launch-of-prediction-markets-integration-of-ai-agents.html)). Prediction-markets product lead not captured | **NYC: YES.** Described as "a New York brokerage" ([Fortune](https://fortune.com/2026/09/24/public-ai-trading-agents-prediction-markets-kalshi-tie-up/) summary) | **2026-09-24 launch** ([Finance Magnates](https://www.financemagnates.com/forex/public-links-kalshi-prediction-markets-to-ai-trading-agents/); [TheLines](https://www.thelines.com/prediction-markets/industry-news/brokerage-public-launches-ai-tech-for-kalshi-traders/)) | Settle NO. **Data YES**, the best app fit: weather signals for climate-category agents. **Co-mkt YES** (NYC, fresh launch). Risk: unknown whether third-party data may feed agents (compliance) |
| **moomoo** | Broker app | moomoo Technologies Inc. ([briefglance](https://briefglance.com/companies/moomoo-technologies-inc/pulses/37500)). Futu as parent is background, unverified | Kalshi partnership announced 2026-06-04. Eligible US traders only ([GeneOnline](https://www.geneonline.com/moomoo-integrates-kalshi-prediction-markets-for-event-based-trading/); [Radom](https://www.radom.com/insights/moomoo-enters-prediction-market-through-strategic-partnership-with-kalshi)) | Not evidenced: Fed, inflation, elections, World Cup | **LOW** (US). Availability in moomoo's Asian entities not captured | [moomoo newsroom](https://www.moomoo.com/us/newsroom/prediction-markets) | None captured | Not captured. Launch was covered by an NJ outlet ([ROI-NJ](https://www.roi-nj.com/?p=215726)), a weak hint of an NJ presence | None in the window | Settle NO; Data LOW; Co-mkt LOW |
| **tastytrade** | Broker app, finance-only menu | IG Group's US arm ("tastytrade/IGNA") | Launched 2026-07-27 as the first broker on Apex's turnkey FCM ([Business Wire](https://www.businesswire.com/news/home/20260727699288/en/); [tastytrade](https://tastytrade.com/newsroom/press-releases/tastytrade-launches-prediction-markets-for-active-traders/)). Markets supplied through Apex's Kalshi arrangement ([The Paypers](https://thepaypers.com/fintech/news/apex-fintech-solutions-and-kalshi-launch-prediction-markets-api)) | **NO.** Indices, rates, VIX, USD, macro releases, crypto and commodities; no sports ([TradeInformer](https://www.tradeinformer.com/broker-news/tastytrade-launches-prediction-markets-without-sports-contracts)) | **LOW** | [Newsroom](https://tastytrade.com/newsroom/press-releases/tastytrade-launches-prediction-markets-for-active-traders/) | **Pete Mulmat** — "Head of Brokerage", tastytrade (IGNA) — owns the brokerage product — launch coverage, 2026-07-27 | Not captured | None in the window | Settle NO; Data LOW; Co-mkt LOW. Watch for energy or weather-index additions |
| **Apex Fintech Solutions** | Infrastructure distributor (turnkey FCM for brokers) | Not captured | Kalshi "prediction markets API" platform (date not captured) ([Pulse 2.0](https://pulse2.com/apex-fintech-solutions-and-kalshi-launch-api-platform-for-prediction-market-access/)). Gemini Titan to power crypto prediction markets for Apex brokerages, 2026-08-24 ([PN crypto.news](https://crypto.news/gemini-titan-to-power-crypto-prediction-markets-for-apex-brokerages/)) | Not evidenced; each broker picks from the Kalshi menu | **LOW** | [Press releases](https://apexfintechsolutions.com/press-releases/tastytrade-launches-prediction-markets-giving-active-traders-a-direct-way-to-trade-real-world-market-events/) | **Travis McGhee** — "Global Head of Digital Markets", Apex — in the 2026-07-27 coverage. ⚠ This **conflicts** with "Global Head of Predictions, Crypto.com" ([PN](https://crypto.com/en/company-news/cryptocom-promotes-travis-mcghee-to-global-head-of-predictions); [IR](internal_status.md)) | Not captured | 2026-08-24 Gemini Titan deal [PN] | Settle NO; Data LOW; Co-mkt NO. Useful as a map of which brokers could add Kalshi climate. Verify McGhee's employer before any outreach |
| **Charles Schwab** | Broker, event-based options | Charles Schwab Corp. | S&P 500 yes/no options with Cboe announced in June 2026; finance outcomes only ([The Block](https://www.theblock.co/post/405454/charles-schwab-is-working-with-cboe-to-launch-sp-500-yes-or-no-binary-options-contracts-wsj); [Quartz](https://qz.com/charles-schwab-cboe-prediction-markets-sp500-binary-options-062226)). Live status conflicts: no confirmed launch, but one [KuCoin flash headline](https://www.kucoin.com/news/flash/schwab-and-cboe-launch-s-p-500-all-or-nothing-options-with-partial-payouts) says "launch" (date not captured) | **NO** | **LOW** | n/a | None captured | Not captured | None in the window | No near-term fit |
| **eToro** | Broker app; prediction markets inside a non-custodial wallet | eToro (ETOR) [PN] | Wallet with prediction markets live in early 2026, running on Polymarket; talks with Kalshi ([CoinSpectator 2026-03-10](https://coinspectator.com/mainstream/2026/03/10/etoro-ceo-were-in-a-strong-position-to-double-down-on-crypto-adds-prediction-markets/); [Casino.org](https://www.casino.org/news/etoro-in-talks-with-kalshi-polymarket-as-it-eyes-prediction-markets/)). Buying the Zengo wallet ([Finance Magnates](https://www.financemagnates.com/fintech/etoro-buys-self-custody-wallet-zengo-as-brokers-race-to-own-crypto-stack/)) | Not captured; the Polymarket menu includes weather (inference) | **HIGHEST** if reachable from Korea (Polymarket route). Country availability not captured | n/a | **Yoni Assia** — CEO — owner — CoinSpectator, 2026-03-10 | Not captured | Zengo acquisition (date not captured) | NO on all three while Polymarket-routed. Revisit only if a Kalshi route launches |
| **Coinbase** | Crypto exchange app; Kalshi distributor with its own DCM ([IR](internal_status.md)) | Coinbase Global (background) | Kalshi-powered in all 50 states since 2026-01-28 ([PN Invezz](https://invezz.com/news/2026/01/29/coinbase-rolls-out-kalshi-powered-prediction-markets-across-all-50-us-states/)). **2026-10-06:** 15-minute crypto-price prediction markets paying $1 or $0, Nevada excluded; listing venue not captured ([Cryptonomist](https://en.cryptonomist.ch/2026/10/06/crypto-price-prediction-coinbase/)) | Not evidenced | **LOW** (US) | n/a | Prediction-markets product head not found. IR: Wilson Cheng (institutional sales, APAC) and Chantal Bradford (EMEA market sales), first-degree connections only | Not captured | **2026-10-06** crypto-price markets | Settle NO; Data LOW; Co-mkt LOW. Watch the "everything exchange" plan ([MEXC mirror](https://www.mexc.com/news/393592)) |
| **Crypto.com app / OG.com** | Crypto app with its own DCM/DCO (CDNA), spun out as OG.com | Crypto.com. OG.com valued at $5B; Citadel Securities and Robinhood hold stakes [PN] | OG launched 2026-02-03. Distributes to Robinhood (from 2026-09), Fanatics and Truth Predict ([PN](https://crypto.com/en/company-news/cryptocom-launches-og-a-new-prediction-market-experience)) | **Thin.** Climate markets such as "hottest year", plus an OG Learn weather guide ([PN](https://og.com/learn/how-to-trade-weather-and-climate-prediction-markets)) | **MEDIUM.** US-regulated venue; the Crypto.com app's Korea status was not captured. **We already have an MNDA** ([IR](internal_status.md)) | [Company news](https://crypto.com/en/company-news/) [PN] | **Kris Marszalek** — "founder and chief executive of both Crypto.com and OG.com", 2026-09 ([PN](https://og.com/company-news/robinhood-selects-ogcom-as-infrastructure-partner-for-prediction-markets-platform-holding-equity-stake-in-exchange-engine)). **Nick Lundgren** — OG CEO at launch and Crypto.com CLO, Feb 2026 [PN]; ⚠ conflicts with Marszalek. **Travis McGhee** — Global Head of Predictions [PN]; ⚠ see the Apex row. IR: Vincent (strategic partnerships, owns the MNDA thread), Maria Allott (VP Global Head of Sales), Stephen Humenik (OG.com CLO) | CDNA/Nadex in Chicago [PN, >12mo]. NYC not captured | 2026-09-08 Robinhood deal [PN]. Internal: 10/7 follow-up pending; re-judged 10/15 [IR] | Exchange-level: a settlement deal is possible and already in progress. App co-marketing MAYBE once the MNDA's scope and exclusivity are settled. CDNA has had an "executive exodus" ([PN Sportico](https://www.sportico.com/business/sports-betting/2026/crypto-cdna-nadex-departures-layoffs-prediction-markets-1234943420/)) |
| **Kraken** | Crypto exchange app that owns the Small Exchange DCM | Payward (background) | Bought Small Exchange for about $100M in 2025-10, targeting a 2026 launch ([CDC Gaming](https://cdcgaming.com/brief/kraken-eyes-prediction-market-launch-with-cftc-licensed-acquisition/)). No launch found by 2026-10-11. Confidential IPO filing ([MarketScreener](https://ae.marketscreener.com/news/crypto-exchange-kraken-confidentially-files-for-us-ipo-ce7d5ed9d88af72d)) | n/a | n/a | n/a | **Mark Greenberg** — "global head of consumer" — CNBC, 2025-12-24 [PN] | Not captured | None in the window | Watch list. Once live on its own DCM, Kraken designs its own contracts |
| **Pending entrants** (Blockchain.com, Binance.US) | Future DCM operators | — | **2026-10-09:** Blockchain.com sought CFTC approval for prediction markets and crypto derivatives. It "joins 11 other companies that have filed this year"; the CFTC has approved six new DCMs in 2026 ([CNBC](https://www.cnbc.com/2026/10/09/blockchain-com-cftc-prediction-markets.html)). Binance.US planned a DCM application ([PN Bloomberg 2026-07-29](https://www.bloomberg.com/news/articles/2026-07-29/binance-us-wants-to-join-prediction-markets-race-with-cftc-stamp)) | Not captured | **LOW** (US) | — | **Steven Gregory** — Binance.US CEO [PN] | — | **2026-10-09** filing | Watch list (future contract designers) |
| **MetaMask** | Self-custodial wallet, Polymarket builder | Consensys (launch post on its blog per [The Block](https://theblock.co/post/381592/metamask-moves-into-prediction-markets-with-polymarket-integration)) | Polymarket in the mobile app since Dec 2025. Geo-restricted (US, UK, DE, FR, SG, AU and more); 4% fee ([pm.wiki, updated 2026-06-29](https://pm.wiki/uk/projects/metamask)) [agg] | Polymarket menu includes weather (inference) | **HIGHEST.** Korea is not in the summarized restriction list (unverified) | [MetaMask news](https://metamask.io/news/) [PN] | None captured | Not captured | None in the window | NO on all three |
| **Phantom** | Self-custodial wallet (Solana) | Phantom (not captured) | Since 2025-12-12, tokenized positions referencing Kalshi markets; categories are politics, crypto, sports and culture ([Business Wire](https://www.businesswire.com/news/home/20251212601454/en/Phantom-and-Kalshi-Bring-Prediction-Markets-to-the-Worlds-Leading-Crypto-Wallet); [Cointelegraph](https://cointelegraph.com/news/phantom-kalshi-prediction-markets-wallet-integration)) | Not evidenced | **MEDIUM** (Kalshi-linked; geofencing not captured) | [Business Wire](https://www.businesswire.com/news/home/20251212601454/en/Phantom-and-Kalshi-Bring-Prediction-Markets-to-the-Worlds-Leading-Crypto-Wallet) | None captured | Not captured | None in the window | Settle NO; Data LOW; Co-mkt LOW |
| **Trust Wallet** | Self-custodial wallet | Described as "CZ's" ([Cointelegraph](https://cointelegraph.com/news/cz-trust-wallet-debuts-prediction-markets-myriad)) | Predictions tab live since 2025-12-02 with Myriad (BNB Chain). Polymarket via Swap.xyz and Kalshi via DFlow were announced for "coming weeks"; current status unknown ([Forklog](https://forklog.com/en/trust-wallet-integrates-prediction-markets/)) | Not evidenced | **HIGH**, rising to **HIGHEST** if the Polymarket route is live | — | CEO quoted, name not in the summary | Not captured | None in the window | NO |
| **Bitget Wallet** | Self-custodial wallet | Bitget (background) | Polymarket integration on 2026-04-22, with "AI-powered sports event analysis"; about 90M users ([GlobeNewswire](https://www.globenewswire.com/news-release/2026/04/22/3278876/0/en/bitget-wallet-launches-ai-powered-prediction-market-access-through-polymarket-integration.html); [The Block](https://www.theblock.co/post/398188/polymarket-taps-bitget-wallets-over-90-million-users-with-integration)) | Not evidenced | **HIGHEST** | [Blog](https://web3.bitget.com/en/blog/articles/prediction-markets-polymarket) [PN] | Polymarket's CMO quoted, unnamed in the summary | Not captured | None in the window | NO on all three |
| **KuCoin Web3 Wallet** | Self-custodial wallet | KuCoin | Polymarket integration on 2026-06-08 ([KuCoin blog](https://www.kucoin.com/blog/en-kucoin-web-3-wallet-expands-its-ecosystem-access-through-polymarket-integration); [AAP](https://aap.com.au/aapreleases/cision20260608ae77892/)) | Not evidenced | **HIGHEST** | [KuCoin blog](https://www.kucoin.com/blog/en-kucoin-web-3-wallet-expands-its-ecosystem-access-through-polymarket-integration) | IR: Anna Choi — Seoul institutional BD — judged 10/7 to have no prediction-markets business | Seoul BD contact per IR | None in the window | NO |
| **SafePal** | Wallet | — | Reported to have "already rolled out similar prediction market access", in a Polymarket context ([The Block](https://www.theblock.co/post/398188/polymarket-taps-bitget-wallets-over-90-million-users-with-integration) or [crypto.jobs](https://crypto.jobs/news/polymarket-integrates-bitget-wallet-to-access-90-million-user-base); the summary did not say which) | Not captured | **HIGHEST** if Polymarket (inference) | — | — | — | — | NO |
| **Binance Wallet** (Predict.fun) | Exchange wallet routing to a BNB Chain venue | Binance. Predict.fun is backed by YZi Labs and Susquehanna Crypto [PN] | Rolled out 2026-04-09 with sponsored gas. Binance is not the counterparty and says it is "not under the supervision of the FSRA or any other regulatory authority" ([The Block](https://www.theblock.co/post/396858/binance-wallet-rolls-out-gas-free-prediction-markets-via-predict-fun-integration); [Cointelegraph](https://cointelegraph.com/news/binance-prediction-markets-app)). API launched 2026-06-08 ([PN](https://predictionnews.com/story/binance-app-introduces-prediction-markets-for-eligible-users-224e6251)) | None found on Predict.fun [PN] | **HIGH** (offshore; no Korea geoblock found [PN]) | — | IR: many Binance contacts; cap exceeded; no prediction-markets business. YZi Labs: **Haley Huang**, Investment Director, NY [IR] | YZi contact in NY [IR] | None in the window | Settle only through Predict.fun, which was emailed 9/28 [IR]. Wallet: data NO, co-mkt NO |
| **Bybit Prediction / Byreal Predict / Bybit Odds** | Exchange feature, Bybit-incubated DEX and an analytics product | Bybit | Bybit Prediction sits in Bybit Alpha and is "powered by Polymarket" (USDC). Bybit does not control pricing, matching, resolution or settlement, and may restrict access where law requires ([Help Center](https://www.bybit.com/en/help-center/article/Introduction-to-Bybit-Prediction); [FAQ](https://www.bybit.com/en/help-center/article/FAQ-Bybit-Prediction)). Byreal Predict launched 2026-06-09 on Polymarket liquidity ([PN](https://www.prnewswire.com/news-releases/byreal-launches-byreal-predict-an-onchain-prediction-market-302795232.html)). Bybit Odds analytics ([PN](https://bitcoinist.com/bybit-launches-odds-product-for-prediction-market-data-and-sentiment/)) | Not confirmed | **HIGHEST** | [Announcement](https://announcements.bybit.com/en/article/bybit-prediction-launches-with-global-football-prediction-markets-bltc9ef33b283828c8d/) [PN] | IR: Bybit EU — David Zabransky — no prediction-markets business | Not captured | None in the window | NO |
| **OKX Event Contracts** | Exchange's own event contracts | OKX | Launched 2026-04-20. BTC/ETH up/down contracts settle on the OKX price index; offered in Asia, the CIS and LatAm ([MPost](https://mpost.io/okx-introduces-event-contracts-for-short-term-btc-and-eth-market-predictions/)). Hiring a prediction-markets and sports trader ([startup.jobs](https://startup.jobs/senior-defi-trader-prediction-markets-sports-okx-7744827)) | **NO** (crypto prices only) | **HIGH / UNKNOWN** (the "Asia" countries are unspecified) | — | IR: Kyuyoung, our only door | Not captured | None in the window | Settle only if OKX builds macro or weather contracts. Data LOW; Co-mkt NO |
| **Gate** (Prediction Markets + Event Contracts Builder) | Exchange consumer product plus white-label builder | Gate; the builder sits in Gate Technology Inc.'s DexBuilder division | Gate says it was the "first exchange" to integrate Polymarket Builder ([Fortune 2026-09-03](https://fortune.com/2026/09/03/crypto-exchange-gate-enters-prediction-market-space-with-white-label-builder-for-businesses/)). The white-label Builder launched around 2026-08-07, covering market creation through settlement via API/SDK, for brokers, wallets and media ([TradeInformer](https://tradeinformer.com/tech-news/gate-launches-event-contracts-builder-with-3-million-grant-programme)). $3M grant; the first applicants were under review on 09-03 | Not found (crypto, sports, esports, economics, AI) | **HIGHEST** for the consumer product (Polymarket-linked). The Builder needs legal review | [Fortune](https://fortune.com/2026/09/03/crypto-exchange-gate-enters-prediction-market-space-with-white-label-builder-for-businesses/); [Dealroom](https://dealroom.co/news/146369-gate-io-opens-prediction-market-toolkit-with-3m-developer-grant/) | "Gate's head of business" quoted, unnamed in the summary | Not captured | 2026-09-03 Fortune feature | Settle only in theory, through Builder tenants (legal review; Korea). Data NO; Co-mkt NO |
| **MEXC** | Exchange's own prediction market | MEXC | Launched in Mar 2026 with zero fees, covering geopolitics, macro and crypto milestones ([Crypto Briefing](https://cryptobriefing.com/mexc-launches-prediction-market/)). Cryptorank dates the launch 2025-03-21 (conflict) | Not evidenced | **HIGH** (offshore; Korea access not captured) | — | None | Not captured | None in the window | NO or LOW |
| **HTX** | — | — | No prediction-markets product found, only an HTX Research report dated 2025-12-04 | — | — | — | — | — | — | n/a |
| **ICE** — Polymarket Signals and Sentiment | Institutional data distributor | Intercontinental Exchange, which holds about 22% of Polymarket [PN] | Launched 2026-02-11. ICE is the **exclusive** institutional distributor of Polymarket data ([PN ICE IR](https://ir.theice.com/press/news-details/2026/ICE-Launches-Polymarket-Signals-and-Sentiment-Tool-Turning-Crowd-Sourced-Dynamic-Views-into-Market-Opportunities/default.aspx)) | Indirect; Polymarket weather markets are in the feed (inference) | **HIGH** (Polymarket-linked data) | [Product page](https://www.ice.com/fixed-income-data-services/data-and-analytics/market-signals-and-sentiment) [PN] | **Jeff Sprecher** — ICE CEO — 2026-08-20 [PN]. IR: **Lynn Martin** — "President, NYSE Group; Chair, ICE Fixed Income and Data Services" (DM 9/14). Courtenay Dunn — VP Government Affairs | NYSE Group, NYC, per the IR title | None found (budget) | Settle NO. Data MAYBE, only for datasets outside the Polymarket context. Co-mkt NO |
| **Bloomberg** | Terminal and data distributor | Bloomberg L.P. | "Kalshi's market data is currently accessible on Bloomberg's platform" (2026-06-04) ([PN CNBC](https://www.cnbc.com/2026/06/04/kalshi-is-building-a-bloomberg-terminal-for-prediction-markets.html)) | Not captured | **LOW–MEDIUM** | — | IR: **Ann Chu** — "Global Head of Licensing & Partnerships" (greeted 10/6). Business DMs sent 9/16 | Not verified | None in the window | Data MAYBE: license a verdict dataset alongside the Kalshi data |
| **Cantor Fitzgerald** | Institutional broker for Kalshi | Cantor | Opening Kalshi markets to about 3,000 institutional clients (2026-08-19) ([PN CoinDesk](https://www.coindesk.com/markets/2026/08/19/cantor-opens-kalshi-prediction-markets-to-thousands-of-institutional-clients)) | Not captured | **LOW** | — | None captured | Not verified | None in the window | Data MAYBE; low priority |
| **BMLL** | Historical data vendor | BMLL | Supplies Kalshi's normalized contract history to quant funds (2026-09-17) ([PN](https://www.crowdfundinsider.com/2026/09/311055-bmll-brings-kalshi-prediction-markets-into-institutional-research-workflows/)) | Kalshi climate history likely included (inference) | **LOW** | [Markets Media](https://www.marketsmedia.com/bmll-kalshi-expand-institutional-access-to-prediction-market-data/) [PN] | None captured | Not captured | 2026-09-17, just before the window | Data MAYBE: pair our verdict history with Kalshi's price history |
| **Kalshi Research** (feed built with DoubleZero, plus the Oddpool team) | Exchange-owned data arm | Kalshi | Level 1 and Level 2 order-book feed built with DoubleZero Edge (about 2026-08-12); Kalshi waives its data-revenue share for year one ([PN](https://coinspectator.com/mainstream/2026/08/12/kalshi-launches-real-time-level-2-data-feed-for-institutional-traders/)). Oddpool is joining Kalshi to build institutional data tooling ([Dealroom](https://dealroom.co/news/149005-oddpool-raises-3m-seed-then-joins-kalshi/)) | Climate research ([PN](https://kalshi.com/research/insights/hedging-climate-risk)). Kalshi–TWC deal (08-27/28) [PN] | **MEDIUM** | [Kalshi News](https://news.kalshi.com/) [PN] | **Will Brackett** — "Head of Partnerships @ Kalshi" (LinkedIn headline, low confidence) [PN]. He spoke for Kalshi on the TWC deal [IR] | Kalshi HQ is in NY [IR] | Oddpool deal (Sept) | Settlement and data both run through Kalshi partnerships. Angle: weather inputs for the institutional tooling |
| **Dune** | On-chain and Kalshi analytics | Dune | Curated datasets combine Polymarket on-chain data and Kalshi reporting, with Kalshi's integration managed together with Kalshi. Refresh is about 24h (combined) and 48h (Kalshi) ([Dune docs](https://docs.dune.com/data-catalog/curated/prediction-markets/overview)). Kalshi data was pulled from public view on 05-15 and restored only for the top tier, at about $40k a year ([Sportico](https://www.sportico.com/business/sports-betting/2026/kalshi-parlay-data-research-dune-access-1234901298/)) | Likely includes weather markets (inference) | **MEDIUM–HIGH** (Polymarket's Seoul data is visible; inference) | [Dune PM hub](https://dune.com/data/prediction-markets) | None captured | Not captured | None in the window | Data and co-mkt MAYBE: publish verdict tables for non-Korean cities |
| **Oddpool** (now joining Kalshi) | Prediction-market data aggregator | Oddpool Inc., now going to Kalshi | Aggregates Kalshi and Polymarket, plus CME per one source. API and WebSocket; plans are free, $30 and $100 a month ([Quicknode](https://www.quicknode.com/builders-guide/tools/oddpool-by-oddpool-inc)) [agg]. YC Spring 2026, based in SF ([Dealroom](https://app.dealroom.co/companies/oddpool)). Raised a $3M seed, then joined Kalshi ([Cryptorank M&A 2026-09-03](https://cryptorank.io/insights/deals/oddpool-m-a-2026-09-03)) | **YES**: "politics, sports, and climate events" | **MEDIUM** (now Kalshi) | — | **Avi Arora** and **Ritesh Malpani** — founders (titles not captured) — Dealroom | Was in SF; now inside Kalshi (NY per IR; inference) | **2026-09-03** M&A | The channel changed: pitch through Kalshi, not to Oddpool on its own |
| **Adjacent News** | Prediction-market news plus a normalized API | Adjacent News | 40,000+ markets from Kalshi, Polymarket, Manifold and Metaculus in one API, with history and reference rates; docs at docs.adj.news ([Quicknode](https://www.quicknode.com/builders-guide/tools/adjacent-news-by-adjacent-news)) [agg] | Not evidenced | **MEDIUM–HIGH** (covers Polymarket) | docs.adj.news | **Lucas Kohorst** — founder — Quicknode listing | Not captured | None in the window | Data MAYBE (weather context on weather markets). Co-mkt MAYBE (content) |
| **Verso** (verso.trading) | Prediction-market terminal | Verso | "Bloomberg Terminal for prediction markets", per a comparison site. Live Kalshi data, news engine and alerts over Kalshi and Polymarket; founded 2024 ([orrery.me](https://orrery.me/compare/verso)) [agg] | Not evidenced | **MEDIUM** | verso.trading | None captured | **NYC: reported New York** (orrery.me; unverified) | None in the window | Data YES or MAYBE (a weather panel). NYC meeting candidate |
| **Hashdive** | Polymarket analytics | Hashdive | Wallet and whale tracking, insider detection, freemium model ([Quicknode](https://www.quicknode.com/de/builders-guide/tools/hashdive-by-hashdive); [dev.to](https://dev.to/itsragnar/best-polymarket-trading-tools-in-2026-analytics-copy-trading-execution-arbitrage-bots-e43)) [agg] | Not evidenced | **HIGHEST** (Polymarket only) | — | None | Not captured | None | NO |
| **PolymarketAnalytics.com** | Polymarket analytics | Not found | Hosts Polymarket market pages, including Seoul daily temperature ([PN](https://polymarketanalytics.com/markets/272241)). Founder not found | **YES** (Seoul temperature pages) | **HIGHEST** | — | None | Not captured | None | NO |
| **Other data and AI startups** (Dome, River Markets, Polysights, SimpleFunctions) | APIs, pro trading terminals, AI monitoring | Various | Polymarket acquired Dome, a unified API, in Feb 2026 ([The Block](https://theblock.co/post/390546/polymarket-buys-fresh-prediction-market-api-startup-dome-marking-second-official-acquisition)). River Markets raised an $8.5M seed led by Haun Ventures for one interface across many prediction markets ([Dealroom](https://dealroom.co/news/144413-river-markets-raises-8-5m-seed-to-bring-prediction-markets-to-wall-stree/)). Polysights raised a $1.5M pre-seed for AI monitoring, 2026-06-30 ([wnhub](https://wnhub.io/news/Generative_AI/item-51279); attribution unclear) | Not evidenced | Dome and Polysights **HIGHEST** (Polymarket); River **MEDIUM** | — | None captured | Not captured | — | River: Data MAYBE. Others NO |
| **wethr.net** | Weather-market analytics for Kalshi and Polymarket traders | Not captured | Temperature charts combine airport observations, climate reports and its own estimates, with an NWS/Weather Underground station toggle. 16+ forecast models and backtesting; closed source ([pm.wiki](https://pm.wiki/uk/projects/wethr)) [agg]. Publishes tables of each market's resolution source ([PN](https://wethr.net/market-resolution)) | **CORE** | **HIGH** (serves Polymarket weather traders; Seoul coverage not captured) | wethr.net | None captured | Not captured | None | **Data YES**, the most direct buyer. Start with Kalshi and US cities, exclude Korean cities. Also a partial competitor |
| **Other weather-trader tools** (vweatherstation, Better Weather Bettor, Polydata, TradeTheOutcome, PolyMart, Turbine, Apify actors, GetClawKit skill, TruestEdge) | Trackers, guides, data actors, agent skills | Various | vweatherstation tracks Seoul's RKSI station [PN]. Apify sells "NWS Station Data [$0.02/city-day]" [PN]. A GetClawKit agent skill trades Kalshi weather markets ([GetClawKit](https://getclawkit.com/skills/official-adlai88-kalshi-weather-trader)). TruestEdge ([pm.wiki](https://pm.wiki/ko/compare/truestedge-vs-wethr)) | **CORE** | vweatherstation's Seoul tracker **HIGHEST**; others vary | — | None | Not captured | — | Data YES (small buyers; $0.02 per city-day is a price benchmark) |

### Inferences
- **Tier 1, pursue now (trader data or co-marketing, low Korea risk, reachable in NYC):**
  - **Public.com:** New York based, a climate category, and agents that need machine-readable inputs.
  - **Kalshi's data arm:** reach Oddpool's team through Kalshi partnerships (Will Brackett). This is the data-layer counterpart of the exchange pitch.
  - **Verso:** reported to be in NYC.
  - **wethr.net and similar weather-trader tools:** offer Kalshi and US cities only.
  - **IBKR ForecastTrader:** go through ForecastEx leadership (Prior, Deese), because the app and the exchange are one decision unit.
- **Tier 2, pursue after the internal gates:**
  - Robinhood, after the 10/15 Crypto.com re-judgment. Its weather hub is the largest retail weather surface.
  - Bloomberg licensing, where Ann Chu has already been greeted [IR].
  - BMLL, Dune and Adjacent News.
  - Cantor and River Markets, at lower priority.
- **Watch list (no weather today):** Webull, moomoo, tastytrade/Apex, Schwab, Coinbase, Kraken, Blockchain.com, Binance.US and OKX. Revisit when any of them adds Kalshi's climate menu or launches its own designed contracts.
- **Do not pursue until counsel signs off** (Korea HIGHEST or HIGH, Polymarket-linked):
  - MetaMask, Bitget Wallet, KuCoin Web3 Wallet, SafePal, Bybit Prediction and Byreal, Gate's consumer product, eToro's wallet.
  - Hashdive, PolymarketAnalytics and ICE's Polymarket feed.
  - Selling trader data to these channels would effectively supply Korea-blocked weather markets. It would also reopen Polymarket contact through a side door, while internal records show the Polymarket contact cap already exceeded [IR].
- **Separate legal review:** Gate's Event Contracts Builder (hosting our own weather markets) and Binance Wallet/Predict.fun. Predict.fun was already pitched at exchange level on 9/28 [IR].
- **Timing:** NYC meeting requests must go out in the week of 10/13–10/17 to land meetings for 10/24–10/29 [IR].

### Gaps
- None of the listed entities showed a dedicated partnership or data-intake form. Channels above are newsrooms, help centers, documentation and product pages.
- No prediction-markets product head could be found for Webull, moomoo, Coinbase, Schwab, eToro, Phantom, MetaMask, Bitget Wallet, KuCoin, Bybit, OKX, Gate or MEXC. Public.com's exact titles were not captured either.
- Unresolved conflicts that need checking before outreach:
  - Travis McGhee's current employer: Apex or Crypto.com.
  - OG.com's CEO: Lundgren or Marszalek.
  - Schwab/Cboe live status.
  - MEXC's launch year.
  - River Markets' round date.
- Not researched once the search budget ran out:
  - LSEG/Refinitiv and FactSet prediction-market integrations.
  - People at Cantor, BMLL, DoubleZero, Dune, Verso, wethr and Adjacent.
  - Any NYC prediction-market events during 10/24–10/29.

---

## 2. Brokers and apps: who runs the prediction-markets product, do they show weather or climate, and do they have weather partnerships?

### Takeaway
Only three brokers have both a visible weather surface and a sourced leader:
- **Robinhood:** JB Mackenzie, "VP & GM of Futures and Prediction Markets".
- **IBKR:** ForecastEx CEO Rob Prior and board member Philip Tetlock. Temperature is ForecastTrader's top category.
- **Public.com:** a climate category in its new AI agents. Leif Abraham is the spokesperson; his title was not captured.

Webull, moomoo, tastytrade, Schwab and Coinbase show finance, sports or crypto menus without weather. eToro routes to Polymarket. Kraken has still not launched.

No app-level weather-content or weather-data partnership was found. The only weather-media precedent sits at exchange level: Kalshi and The Weather Company, where TWC also displays Kalshi odds in its app.

### Cited Findings
**Robinhood**
- JB Mackenzie, title over time:
  - Earlier title: "vice president and general manager of futures and international" (Reuters, October 2025). He was quoted then: "We as a firm are going to be looking to see if there is an acquisition that's available." — [Gazette/Reuters 2025-10-13](https://gazette.com/2025/10/13/robinhood-open-to-deals-to-grow-prediction-markets-business-exec-says/); [iTiger mirror](https://www.itiger.com/news/2575289298) [search summary, unverified] [about 12 months old]
  - Later title: "Vice President and General Manager of Futures and Prediction Markets", per a Finance Magnates piece on the Crypto.com/OG stakes. — [Finance Magnates](https://financemagnates.com/fintech/robinhood-takes-stakes-in-cryptocom-and-og-to-expand-prediction-markets) [search summary, unverified]
  - The same later title appears in [PN] via [Gambling Insider](https://www.gamblinginsider.com/news/179795/robinhood-q2-rothera-top-3-prediction-market-exchange).
- 2026-09-08 deal coverage. — [The Block](https://www.theblock.co/news/markets/2026-09-08-robinhood-expands-prediction-markets-crypto-com-og-partnerships-nfl-season-413832) [search summary, unverified]
  - Robinhood routes some contracts to OG.com and still routes to Kalshi, ForecastEx and Rothera.
  - This season it adds game outcomes, player contracts, custom combos and an election hub with interactive heat maps.
  - Q2 volume was 13.6B contracts, including 5B during the World Cup.
- Weather surface: climate, temperature and daily-high-temperature hubs, including US-city highs and lows on 2026-09-28, plus a Learn article on weather contracts. — [PN: Robinhood hub](https://robinhood.com/us/en/prediction-markets/climate/daily-high-temperature/); [PN: Robinhood Learn](https://robinhood.com/us/en/learn/articles/trading-climate-weather-event-contracts/)
- Internal status:
  - Mackenzie is the "actual decision-maker", reachable only through Johann Kerbrat's introduction.
  - The Robinhood line is over its contact cap, and the 10/15 Crypto.com re-judgment gates it.
  - Source: [IR](internal_status.md)

**Interactive Brokers / ForecastTrader (ForecastEx)**
- 2026-01-22 release: [IBKR press release](https://www.interactivebrokers.com/en/general/about/mediaRelations/1-22-26.php) [search summary, unverified]
  - Philip Tetlock joined ForecastEx's board.
  - ForecastEx is described as a CFTC-registered DCM and DCO wholly owned by IB.
  - Eligibility "varies by Interactive Brokers affiliate and client country of residence".
  - Thomas Peterffy is quoted as founder and chairman.
- In a January 2026 Reuters interview, Peterffy said IB would integrate its betting offering more closely with its other services that year. — [MarketScreener](https://www.marketscreener.com/news/interactive-brokers-says-betting-on-us-midterm-elections-should-juice-growth-of-its-platform-ce7e58d9d88bf62d) [search summary, unverified]
- Weather exposure:
  - At launch, contracts covered "climate indicators" such as Global Temperature, US Temperature and Atmospheric CO2. — [IBKR 2024-08-01](https://www.interactivebrokers.com/en/general/about/mediaRelations/8-1-24.php); [Zacks](https://www.zacks.com/stock/news/2294829/interactive-brokers-ibkr-arm-unveils-forecast-contracts) [search summary, unverified] [>12mo]
  - Temperature contracts are the most frequently traded, and IBKR Campus has a "Daily High Temperature Markets at ForecastEx" page. — [PN](https://www.artemis.bm/news/weather-the-most-frequently-traded-forecast-contracts-at-interactive-brokers-founder/)
- No ForecastTrader news was found for September–October 2026. [search summary, unverified]

**Webull**
- Kalshi-powered. Webull plans to become a Kalshi clearing member. — [PN](https://www.prnewswire.com/news-releases/webull-connects-to-kalshi-to-offer-investors-innovative-prediction-markets-302373541.html)
- 2026-01-27: $0 commission on Big Game contracts. The release says the product rolled out in Q3 2025 and has grown "significant[ly]" quarter over quarter. — [Barchart](https://www.barchart.com/story/news/37249506/webull-introduces-0-commission-trading-on-pro-football-big-game-prediction-markets) [search summary, unverified]
- No September 2026 news. An August-2026-era piece compares Webull's growth with Robinhood's. — [Nasdaq](https://www.nasdaq.com/articles/should-you-forget-robinhood-and-buy-webull-instead) [search summary, unverified]
- No product leader was found.

**Public.com**
- 2026-09-24 launch — [Fortune](https://fortune.com/2026/09/24/public-ai-trading-agents-prediction-markets-kalshi-tie-up/); [Kalshi News](https://news.kalshi.com/p/public-kalshi-prediction-markets-ai-agents); [Bonus.com](https://www.bonus.com/news/public-launches-ai-prediction-market-agents-through-kalshi-partnership/); [Gaming.net](https://www.gaming.net/public-brings-kalshi-prediction-markets-to-its-ai-investing-agents/) [search summary, unverified]
  - Public, "a New York brokerage" and self-described "first agentic brokerage", opened AI Agents for Prediction Markets to all members.
  - Members can trade event contracts directly or delegate to agents. Agents monitor probability moves and execute strategies, but only after the investor approves the rules.
  - Public suggests using probabilities as triggers in other holdings. Examples: buy a healthcare stock if FDA-approval odds pass 75%, or buy puts if earnings-miss odds pass 60%, with an example cap of $2,500 per position.
  - Kalshi supplies the markets and handles execution.
  - No fee or geographic detail was found.
- Category scope conflict:
  - TheLines describes a narrower initial set. — [TheLines](https://www.thelines.com/prediction-markets/industry-news/brokerage-public-launches-ai-tech-for-kalshi-traders/) [search summary, unverified]
  - Public's release lists climate among broader categories. — [PN PR Newswire](https://www.prnewswire.com/news-releases/public-launches-ai-agents-for-prediction-markets-302888505.html)
- Leif Abraham spoke on CNBC about the launch; his title was not in the captured text. — [PN CNBC video](https://www.cnbc.com/video/2026/09/24/publicas-leif-abraham-on-launch-of-prediction-markets-integration-of-ai-agents.html)

**moomoo**
- 2026-06-04: Kalshi partnership for eligible US traders. Contracts cover Fed decisions, inflation, elections and the 2026 World Cup, are fully collateralized and price from $0.01 to $1.00. No weather. — [GeneOnline](https://www.geneonline.com/moomoo-integrates-kalshi-prediction-markets-for-event-based-trading/); [Radom](https://www.radom.com/insights/moomoo-enters-prediction-market-through-strategic-partnership-with-kalshi); [moomoo newsroom](https://www.moomoo.com/us/newsroom/prediction-markets) [search summary, unverified]
- A promo page headline reads "$0 commissions on event contracts". — [Legal Sports Report](https://www.legalsportsreport.com/prediction-markets/moomoo-prediction-market/) [headline only]

**tastytrade and Apex Fintech Solutions**
- 2026-07-27 launch — [Business Wire](https://www.businesswire.com/news/home/20260727699288/en/); [tastytrade newsroom](https://tastytrade.com/newsroom/press-releases/tastytrade-launches-prediction-markets-for-active-traders/); [Apex](https://apexfintechsolutions.com/press-releases/tastytrade-launches-prediction-markets-giving-active-traders-a-direct-way-to-trade-real-world-market-events/); [Las Vegas Sun](https://lasvegassun.com/news/2026/jul/27/tastytrade-launches-prediction-markets-giving-acti/) [search summary, unverified]
  - tastytrade is the first broker on Apex's turnkey FCM.
  - Event contracts sit in a segregated CFTC account.
  - Two executives are named: Pete Mulmat, "Head of Brokerage", tastytrade ("tastytrade/IGNA"), and Travis McGhee, "Global Head of Digital Markets", Apex Fintech Solutions.
- Division of labor:
  - In the Apex–Kalshi setup, Apex handles FCM operations, clearing, custody and statements, while Kalshi provides the exchange and contracts. — [The Paypers](https://thepaypers.com/fintech/news/apex-fintech-solutions-and-kalshi-launch-prediction-markets-api); [Pulse 2.0](https://pulse2.com/apex-fintech-solutions-and-kalshi-launch-api-platform-for-prediction-market-access/) [search summary, unverified]
  - Separately, Gemini Titan will power crypto prediction markets for Apex brokerages (2026-08-24). — [PN crypto.news](https://crypto.news/gemini-titan-to-power-crypto-prediction-markets-for-apex-brokerages/)
  - Which exchange lists each tastytrade contract is therefore not fully settled.
- No sports contracts, although sports are about 80% of volume at Kalshi and Polymarket. — [TradeInformer](https://www.tradeinformer.com/broker-news/tastytrade-launches-prediction-markets-without-sports-contracts) [search summary, unverified]
- **Conflict on McGhee:**
  - [PN] and [IR] list him as "Global Head of Predictions" at Crypto.com, citing a [Crypto.com release](https://crypto.com/en/company-news/cryptocom-promotes-travis-mcghee-to-global-head-of-predictions) whose date was not captured.
  - Sportico reported an "executive exodus" at Crypto.com's CDNA/Nadex. — [PN Sportico](https://www.sportico.com/business/sports-betting/2026/crypto-cdna-nadex-departures-layoffs-prediction-markets-1234943420/)
  - If both reports are right, he moved to Apex by July 2026, and the [IR] entry is stale.

**Charles Schwab**
- The Cboe S&P 500 yes/no options, including "plus zone" partial payouts, were described in June 2026 as coming "in the coming months". The product is limited to verifiable financial outcomes. — [The Block](https://www.theblock.co/post/405454/charles-schwab-is-working-with-cboe-to-launch-sp-500-yes-or-no-binary-options-contracts-wsj); [Quartz](https://qz.com/charles-schwab-cboe-prediction-markets-sp500-binary-options-062226); [Pulse 2.0](https://pulse2.com/charles-schwab-reportedly-working-with-cboe-to-enter-prediction-market/) [search summary, unverified]
- Conflict: a KuCoin flash headline reads "Schwab and Cboe launch S&P 500 all-or-nothing options with partial payouts" (undated). — [KuCoin flash](https://www.kucoin.com/news/flash/schwab-and-cboe-launch-s-p-500-all-or-nothing-options-with-partial-payouts) [headline only]

**eToro**
- CEO Yoni Assia, March 2026: "We just launched our non-custodial crypto wallet, which also includes prediction markets." The feature is kept separate from main investments, and he called user interest uncertain. — [CoinSpectator 2026-03-10](https://coinspectator.com/mainstream/2026/03/10/etoro-ceo-were-in-a-strong-position-to-double-down-on-crypto-adds-prediction-markets/) [search summary, unverified]
- The feature runs on Polymarket, with Kalshi in talks. — [Casino.org](https://www.casino.org/news/etoro-in-talks-with-kalshi-polymarket-as-it-eyes-prediction-markets/) [search summary, unverified]
- eToro is buying Israeli self-custody wallet maker Zengo, citing "emerging decentralized trading models such as prediction markets and perpetuals". The deal date was not captured. — [Finance Magnates](https://www.financemagnates.com/fintech/etoro-buys-self-custody-wallet-zengo-as-brokers-race-to-own-crypto-stack/) [search summary, unverified]

**Coinbase**
- January 2026: "all market flow currently comes from Kalshi", with more venues planned. — [PN Invezz](https://invezz.com/news/2026/01/29/coinbase-rolls-out-kalshi-powered-prediction-markets-across-all-50-us-states/)
- 2026-10-06: Coinbase launched 15-minute crypto-price prediction markets on Bitcoin, Ether and other assets. They pay $1 or $0, exclude Nevada and are not available in every state. The listing and clearing venue was not captured. — [Cryptonomist](https://en.cryptonomist.ch/2026/10/06/crypto-price-prediction-coinbase/) [search summary, unverified]
- The CEO framed 2026 as an "everything exchange" year spanning crypto, equities, prediction markets and commodities. — [MEXC mirror](https://www.mexc.com/news/393592) [search summary, unverified; mirror]
- No prediction-markets product head was found. — [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/coinbase-global-coin-why-predictions-204106404.html) [search summary, unverified]

**Crypto.com app / OG.com**
- Ownership, distribution, executives and weather content are carried from [PN] (see the table). A headline also reads "Crypto.com and PYMNTS Team on AI Predictions Market Contracts". — [PN PYMNTS](https://www.pymnts.com/economy/markets/2026/crypto-com-and-pymnts-team-on-ai-predictions-market-contracts/)
- Internal status: MNDA signed, product-team review under way, 10/7 follow-up pending, re-judgment on 10/15. Exclusivity scope is undecided and would block other exchange lanes if total. — [IR](internal_status.md)

**Kraken**
- Kraken bought the Small Exchange DCM. A spokesperson cited interest in the US prediction-market space, and the company targeted a 2026 launch. No go-live, product name or state list was found. — [CDC Gaming](https://cdcgaming.com/brief/kraken-eyes-prediction-market-launch-with-cftc-licensed-acquisition/); [Sigma](https://sigma.world/news/kraken-owns-prediction-market/); [Casino.org](https://www.casino.org/news/kraken-could-be-next-crypto-broker-to-enter-prediction-markets/) [search summary, unverified]
- Kraken has filed confidentially for a US IPO. — [MarketScreener](https://ae.marketscreener.com/news/crypto-exchange-kraken-confidentially-files-for-us-ipo-ce7d5ed9d88af72d) [search summary, unverified]

**Other launches since August 2026**
- **Coinbase:** crypto-price markets on 2026-10-06 (above).
- **Blockchain.com:** DCM application on 2026-10-09 (above).
- **Gate:** Event Contracts Builder around 2026-08-07 (§3).
- **Gemini Titan × Apex:** 2026-08-24 [PN].
- No new broker launch was found for Fidelity, E*TRADE or SoFi. That result came from a single query and is not proof of absence. — [search summary, unverified]

### Inferences
- Brokers that pass Kalshi's menu through unchanged (Webull, moomoo, Coinbase, Phantom, tastytrade via Apex) will show weather only if they choose to surface Kalshi's climate series. Public is the first to name "climate" at launch.
- Public's agent product is the most natural buyer of a machine-readable weather feed. Two examples: a multi-feed consensus that agents use as a trigger, and verdict-status flags (met, not met, withheld) as risk signals. This is "trader data", not settlement.
- IBKR is the only broker whose app and exchange form a single decision unit where weather is the top category. An IBKR pitch is effectively a ForecastEx pitch.
- Robinhood's routing makes it influential, but it does not name settlement sources. Its weather hub is a co-marketing surface only, and the internal gate comes first.

### Gaps
- Exact titles were not captured for: Public's Leif Abraham (and any prediction-markets lead), Webull, moomoo, Coinbase, Schwab and Kraken prediction-markets leaders (beyond Greenberg's 2025 title).
- Not captured:
  - which exchange lists Robinhood's temperature contracts;
  - IBKR's list of eligible countries, including whether Korean residents can use ForecastTrader;
  - the venue behind Coinbase's 2026-10-06 crypto markets.
- Whether any broker has a weather-content partnership (TWC, AccuWeather or similar) was not found. The only one found is exchange-level (Kalshi–TWC).

---

## 3. Wallets and crypto exchanges: which venue they route to, and Korea sensitivity

### Takeaway
Most wallet and exchange prediction products in 2026 resell Polymarket liquidity:
- MetaMask, Bitget Wallet (2026-04-22), KuCoin Web3 Wallet (2026-06-08), Bybit Prediction, Byreal Predict (2026-06-09), Gate's first product and eToro's wallet.
- SafePal is reported to offer similar access.

Korea's regulator blocked Polymarket on 2026-08-18, citing a "Seoul August rainfall" market. All of these Polymarket front-ends are therefore the **highest-sensitivity** group: they can re-expose Korean users to the blocked weather markets.

The rest:
- Binance Wallet routes to Predict.fun on BNB Chain. It is offshore and unregulated, with no Korea geoblock found.
- OKX and MEXC run their own event contracts, with no weather.
- Gate added a white-label builder, so third parties can host their own markets.
- Phantom routes to Kalshi in tokenized form.
- No HTX product was found.

No wallet or exchange in this group can buy settlement data. None shows a weather product of its own.

### Cited Findings
**Korea baseline**
- The 2026-08-18 block — [Korea Times 2026-08-19](https://koreatimes.co.kr/business/companies/20260819/korea-moves-to-block-polymarket-over-illegal-gambling); [Korea JoongAng Daily](https://koreajoongangdaily.com/korea/korea-to-block-access-to-polymarket-over-gambling-concerns/12831016); [SBC News 2026-08-18](https://sbcnews.co.uk/sportsbook/2026/08/18/polymarket-blocked-in-south-korea/); [Gambling.com](https://www.gambling.com/news/south-korea-orders-nationwide-polymarket-block); [CoinGape](https://coingape.com/south-korea-media-regulator-votes-to-block-polymarket-access/) [search summary, unverified]:
  - The regulator's telecom review subcommittee ordered domestic access to Polymarket blocked. It called the platform a de facto illegal gambling environment for Korean users. Some outlets name the body the Korea Media and Communications Standards Commission.
  - The legal basis given: the Criminal Act's gambling provisions, and resemblance to betting sites under the National Sports Promotion Act.
  - The regulator cited the Seoul August rainfall contract as evidence that Polymarket serves Korean bettors.
  - It rejected Polymarket's defense: no Korean-language service, no won, and a non-custodial peer-to-peer design.
  - About 30 countries, including France and Australia, already block Polymarket. Users who route around the block may face enforcement.
- On 2026-08-18 the regulator said it had no deliberation request on Kalshi and had not reviewed blocking it. — [PN Nate](https://m.news.nate.com/view/20260818n33888)
- A June 2026 affiliate guide said Polymarket was accessible in Korea. It predates the block. — [StartPolymarket](https://startpolymarket.com/countries/south-korea/) [search summary, unverified]
- No October 2026 Korean regulatory follow-up was found. One article pairs the block with Upbit and Bithumb's H1 revenue declines of about 49%, which it does not attribute to prediction markets. — [Coin360](https://coin360.com/news/south-korea-polymarket-upbit-bithumb) [search summary, unverified]

**MetaMask (Consensys)**
- Polymarket was integrated into the mobile app per a Consensys blog post, with one-tap funding from any EVM chain and MetaMask Rewards points. — [The Block](https://theblock.co/post/381592/metamask-moves-into-prediction-markets-with-polymarket-integration) [search summary, unverified]
- A profile updated 2026-06-29 says the feature is geo-restricted: unavailable in the US, UK, Germany, France, Singapore, Australia "and more". It charges a 4% trade fee and is "newer and narrower" than Polymarket's own app. — [pm.wiki](https://pm.wiki/uk/projects/metamask) [search summary, unverified] [agg]

**Phantom**
- Since 2025-12-12, Phantom Prediction Markets has offered tokenized positions referencing Kalshi markets, bought with Solana tokens or CASH. It shows live odds and scores, settlement notifications and per-market chat. Categories are politics, crypto, sports and culture. — [Business Wire](https://www.businesswire.com/news/home/20251212601454/en/Phantom-and-Kalshi-Bring-Prediction-Markets-to-the-Worlds-Leading-Crypto-Wallet); [Cointelegraph](https://cointelegraph.com/news/phantom-kalshi-prediction-markets-wallet-integration); [The Block](https://www.theblock.co/post/382340/phantom-integrates-kalshi-prediction-markets-web3-wallet); [Covers](https://www.covers.com/industry/phantom-and-kalshi-partner-to-provide-phantom-prediction-markets-dec-15-2025) [search summary, unverified]
- No 2026 update was found.

**Trust Wallet**
- The Predictions tab went live on 2025-12-02 with Myriad on BNB Chain. Myriad is available outside the US. — [Cointelegraph](https://cointelegraph.com/news/cz-trust-wallet-debuts-prediction-markets-myriad); [Yahoo Finance](https://finance.yahoo.com/news/trust-wallet-enters-prediction-markets-155848218.html); [Forklog](https://forklog.com/en/trust-wallet-integrates-prediction-markets/) [search summary, unverified]
- Planned routes were "Polymarket via Swap.xyz on Polygon" and "Kalshi via DFlow on Solana", expected in "the coming weeks", with automatic geofencing per vendor. Whether they went live is unknown (same sources).

**Bitget Wallet**
- 2026-04-22: Polymarket integration with mobile-first trading, "AI-powered sports event analysis", Apple Pay funding and gas abstraction across EVM chains and Solana. — [GlobeNewswire](https://www.globenewswire.com/news-release/2026/04/22/3278876/0/en/bitget-wallet-launches-ai-powered-prediction-market-access-through-polymarket-integration.html); [The Block](https://www.theblock.co/post/398188/polymarket-taps-bitget-wallets-over-90-million-users-with-integration) [search summary, unverified]
- Polymarket's CMO framed the deal as distribution.
- June 2026 World Cup push: $200,000 in rewards. The cited $1.2B in World Cup market volume is promotional. — [AI Magazine](https://aimagazine.com/globenewswire/3307248) [search summary, unverified]
- The same coverage says MetaMask and SafePal had already rolled out similar prediction-market access. — [crypto.jobs](https://crypto.jobs/news/polymarket-integrates-bitget-wallet-to-access-90-million-user-base) [search summary, unverified]
- A Bitget Wallet report argues that the wallet is the new battleground for prediction markets. — [PN Finance Magnates](https://www.financemagnates.com/cryptocurrency/the-wallet-is-the-new-battleground-for-prediction-markets-bitget-report-argues/)

**KuCoin Web3 Wallet**
- 2026-06-08: Polymarket integration covering crypto, sports and trending topics. It is part of KuCoin's expansion into swaps, perpetuals, tokenized real-world assets and dApp discovery. — [KuCoin blog](https://www.kucoin.com/blog/en-kucoin-web-3-wallet-expands-its-ecosystem-access-through-polymarket-integration); [AAP](https://aap.com.au/aapreleases/cision20260608ae77892/) [search summary, unverified]
- Internal: a Seoul institutional BD contact was judged on 10/7 to have no prediction-markets business. — [IR](internal_status.md)

**Binance Wallet → Predict.fun**
- Beta via a FAQ page in late March 2026, broader rollout on 2026-04-09. — [The Block](https://www.theblock.co/post/396858/binance-wallet-rolls-out-gas-free-prediction-markets-via-predict-fun-integration); [The Block (beta)](https://www.theblock.co/post/395817/binance-tests-prediction-market-feature); [Cointelegraph](https://cointelegraph.com/news/binance-prediction-markets-app); [CMC Academy](https://coinmarketcap.com/academy/es/article/binance-wallet-just-opened-on-chain-prediction-markets-to-200m-users) [search summary, unverified]
  - Binance pays gas on BSC.
  - Users get a separate prediction account backed by an MPC "Keyless Wallet".
  - Binance is not the counterparty; Predict.fun is the provider.
  - The service is "not under the supervision of the Financial Services Regulatory Authority or any other regulatory authority".
  - Regions were not stated at the beta stage.
- A Prediction Markets API for developers followed on 2026-06-08. — [PN PredictionNews](https://predictionnews.com/story/binance-app-introduces-prediction-markets-for-eligible-users-224e6251)
- No weather markets were found on Predict.fun, and no Korea geoblock was found. [PN]

**Bybit (Bybit Prediction, Byreal Predict, Bybit Odds)**
- Bybit Prediction — [Bybit Help Center](https://www.bybit.com/en/help-center/article/Introduction-to-Bybit-Prediction); [Bybit FAQ](https://www.bybit.com/en/help-center/article/FAQ-Bybit-Prediction) [search summary, unverified]:
  - It is "a feature within Bybit Alpha, powered by Polymarket", trading in USDC from the Bybit account.
  - Bybit "is not the counterparty", "does not operate the underlying prediction markets and does not control share pricing, order matching, market resolution, or settlement".
  - Outcomes rely on "external sources of truth and Polymarket's resolution process". Bybit may restrict access where legal requirements apply.
  - The pages were updated in June 2026, and one regional copy in August 2026.
- Byreal Predict launched on 2026-06-09. Byreal is a Bybit-incubated Solana DEX, and Byreal Predict is built on Polymarket liquidity (pUSD). — [pm.wiki](https://pm.wiki/vi/compare/byreal-vs-polymarket) [search summary, unverified] [agg]; [PN PR Newswire](https://www.prnewswire.com/news-releases/byreal-launches-byreal-predict-an-onchain-prediction-market-302795232.html)
- Bybit Odds is an analytics product for prediction-market probabilities and sentiment. — [PN Bitcoinist](https://bitcoinist.com/bybit-launches-odds-product-for-prediction-market-data-and-sentiment/)

**OKX**
- 2026-04-20 launch of Event Contracts — [MPost](https://mpost.io/okx-introduces-event-contracts-for-short-term-btc-and-eth-market-predictions/) [search summary, unverified]; [PN Bitcoin.com](https://news.bitcoin.com/okx-launches-simplified-event-contracts-for-bitcoin-and-ether-price-predictions/):
  - Contracts are on BTC/ETH rise or fall, priced 0.01–0.99 USDT and auto-settled on the OKX price index.
  - Eligible users are in Asia, the CIS and Latin America.
- June 2026 World Cup campaign. — [PN TradersUnion](https://tradersunion.com/news/brokers-news/show/2540250-okx-launches-2026-world-cup/)
- A job post for a "senior DeFi trader – prediction markets & sports event contracts" covers sports, politics and macro instruments on DeFi venues. It is a hiring signal, not a product. — [startup.jobs](https://startup.jobs/senior-defi-trader-prediction-markets-sports-okx-7744827) [search summary, unverified]

**Gate**
- Polymarket Builder:
  - Earlier in 2026, Gate integrated Polymarket Builder, which lets exchanges offer Polymarket's markets inside their own products. Gate's head of business said Gate was the first exchange to do so, and that this experience led Gate to compete with its former partner. — [Fortune 2026-09-03](https://fortune.com/2026/09/03/crypto-exchange-gate-enters-prediction-market-space-with-white-label-builder-for-businesses/) [search summary, unverified]
  - Users trade with USDT from spot balances. One aggregator cites "$257.0M all-time Polymarket builder volume (54 active users)" (unverified). — [pm.wiki](https://pm.wiki/projects/gate) [search summary, unverified] [agg]
- Event Contracts Builder — [TradeInformer](https://tradeinformer.com/tech-news/gate-launches-event-contracts-builder-with-3-million-grant-programme); [Dealroom](https://dealroom.co/news/146369-gate-io-opens-prediction-market-toolkit-with-3m-developer-grant/); [CoinSpectator 2026-08-10](https://coinspectator.com/mainstream/2026/08/10/gate-io-launches-3m-grant-program-for-event-contracts-infrastructure/); [EdgeX](https://pro.edgex.exchange/en-US/news/article/gate-white-label-prediction-market-builder) [search summary, unverified]
  - Announced around 2026-08-07 under the Gate DexBuilder division of Gate Technology Incorporated.
  - Covers market creation, order handling, liquidity, settlement, risk controls and a monitoring dashboard, with API and SDK.
  - Possible markets include crypto prices, sports, esports, economic data and AI.
  - Targets brokers, fintechs, wallets, Web3 apps and media or community platforms.
- Grant: $3M, funded entirely by Gate. The number of recipients, award sizes and timetable are undisclosed, and the first applicants were under review as of 09-03 (Fortune). [PN] noted a conflict with $1.94M.

**MEXC**
- March 2026: MEXC launched a prediction-market platform with zero trading and settlement fees. It covers geopolitics, macro and crypto milestones and runs on existing exchange infrastructure. — [Crypto Briefing](https://cryptobriefing.com/mexc-launches-prediction-market/); [Finance Magnates](https://www.financemagnates.com/cryptocurrency/exchange/mexc-brings-zero-fee-trading-to-prediction-markets/) [search summary, unverified]
- Conflict: Cryptorank gives 2025-03-21 as the launch date. — [Cryptorank](https://cryptorank.io/news/feed/fda3f-mexc-prediction-market-launch-analysis)

**HTX**
- No prediction-market or event-contract product was found. The closest items are an HTX Research report on prediction markets (2025-12-04) and a perpetuals listing. [search summary, unverified]

### Inferences
- In this segment, distribution follows liquidity, and Asian exchanges import Polymarket liquidity even where Polymarket itself is blocked. A weather-data deal with any of these front-ends would effectively supply the very markets Korea blocked. For a KOSDAQ-listed weather company, that adds a reputational risk on top of the legal question (possible aiding of gambling).
- Bybit's help-center wording ("external sources of truth and Polymarket's resolution process") confirms the front-ends have no say over settlement sources. Even the theoretical settlement pitch therefore does not exist at this layer.
- Gate's Builder is the one route where a third party could list weather contracts itself. That would make Wellbian or a partner an operator, which is a legal question, not a sales lead.
- OKX and MEXC design their own contracts. If either adds macro or weather markets later, it becomes a contract designer (exchange-level settlement pitch), not merely a front-end. Today neither shows weather.

### Gaps
- Not captured:
  - Korea availability or geofencing for MetaMask's, Bitget Wallet's, KuCoin's, Bybit's, Trust Wallet's, eToro's and SafePal's prediction tabs.
  - Whether any of these front-ends surfaces Polymarket's weather or Seoul markets in-app.
- Whether Trust Wallet's Polymarket and Kalshi routes went live is unknown.
- SafePal's venue is not confirmed.
- No named prediction-products owners were found at any wallet or exchange, apart from our own [IR] contacts, all of whom were judged to have no prediction-markets business.

---

## 4. Data, analytics and tooling: who ingests weather data, what are their channels, and who are the people?

### Takeaway
The data layer splits three ways.

1. **Institutional distributors locked to one exchange:**
   - ICE is the exclusive Polymarket distributor.
   - Bloomberg, BMLL, Cantor and Kalshi's own L1/L2 feed serve Kalshi.
   - Dune hosts both Kalshi and Polymarket data.
2. **Venture-backed aggregators, being absorbed by the exchanges:**
   - Oddpool, which covers climate events, raised a seed round and then joined Kalshi around 2026-09-03.
   - Polymarket bought Dome in February 2026.
   - Adjacent News, Verso and River Markets remain independent.
3. **A small, weather-native tool scene that is the most natural buyer of a multi-feed consensus/verdict API:**
   - wethr.net, vweatherstation, Better Weather Bettor, Polydata, Apify data actors and agent "skills".

The only sourced weather-data ingestion at institutional scale is exchange-level: Kalshi uses The Weather Company. TWC also shows Kalshi odds in its own app, which is the clearest weather-company co-marketing precedent.

### Cited Findings
**Institutional distribution: one bloc per exchange (mostly [PN])**
- ICE launched "Polymarket Signals and Sentiment" on 2026-02-11 as the exclusive provider to institutional capital markets, delivered through ICE Consolidated Feed and History. — [PN ICE IR](https://ir.theice.com/press/news-details/2026/ICE-Launches-Polymarket-Signals-and-Sentiment-Tool-Turning-Crowd-Sourced-Dynamic-Views-into-Market-Opportunities/default.aspx); [PN product page](https://www.ice.com/fixed-income-data-services/data-and-analytics/market-signals-and-sentiment)
- "Kalshi's market data is currently accessible on Bloomberg's platform" (2026-06-04). — [PN CNBC](https://www.cnbc.com/2026/06/04/kalshi-is-building-a-bloomberg-terminal-for-prediction-markets.html)
- Kalshi Research launched a real-time L1/L2 feed built with DoubleZero Edge around 2026-08-12, covering sports and crypto perpetual futures. Kalshi waives its data-revenue share for the first year. — [PN CoinSpectator](https://coinspectator.com/mainstream/2026/08/12/kalshi-launches-real-time-level-2-data-feed-for-institutional-traders/)
- Cantor Fitzgerald is opening Kalshi to about 3,000 institutional clients, with block trades (2026-08-19). — [PN CoinDesk](https://www.coindesk.com/markets/2026/08/19/cantor-opens-kalshi-prediction-markets-to-thousands-of-institutional-clients)
- BMLL supplies Kalshi's normalized history to quant, macro and systematic funds (2026-09-17). — [PN Crowdfund Insider](https://www.crowdfundinsider.com/2026/09/311055-bmll-brings-kalshi-prediction-markets-into-institutional-research-workflows/); [PN Markets Media](https://www.marketsmedia.com/bmll-kalshi-expand-institutional-access-to-prediction-market-data/)
- Media blocs: Kalshi has CNN and CNBC; Polymarket has Dow Jones and X/xAI. The Yahoo Finance–Polymarket hub ended in April 2026, reported 2026-09-18. — [PN Bloomberg 2026-09-18](https://www.bloomberg.com/news/articles/2026-09-18/yahoo-finance-and-polymarket-end-prediction-market-partnership)
- Internal contacts:
  - ICE: Lynn Martin ("President, NYSE Group; Chair, ICE Fixed Income and Data Services"), DM sent 9/14.
  - Bloomberg: Ann Chu ("Global Head of Licensing & Partnerships"), greeted 10/6.
  - Source: [IR](internal_status.md)

**Dune**
- Dune runs a curated prediction-market collection: Polymarket on-chain activity plus Kalshi's regulated event-contract reporting. "The Kalshi integration is directly managed by the Dune team in collaboration with Kalshi." Refresh is about 24h for the combined collection and about 48h for the Kalshi tables. Coverage includes hourly candles, per-fill trades, positions and four years of resolved markets. — [Dune docs](https://docs.dune.com/data-catalog/curated/prediction-markets/overview); [Dune blog](https://dune.com/blog/kalshi-is-now-live-on-dune); [Blockchain.news](https://blockchain.news/news/kalshi-polymarket-data-dune-macro-signals); [Crowdfund Insider](https://www.crowdfundinsider.com/?p=280950) [search summary, unverified]
- Access controversy — [Sportico](https://www.sportico.com/business/sports-betting/2026/kalshi-parlay-data-research-dune-access-1234901298/) [search summary, unverified]:
  - On 2026-05-15 Dune removed two Kalshi datasets from public view, after Sportico used them to analyze retail parlay losses.
  - Dune later restored them only for its highest tier, Enterprise, at about $40,000 a year.
  - Blockchain.news describes the data as free, a conflict.

**Oddpool (now joining Kalshi)**
- Product: aggregates Kalshi and Polymarket (and CME, per one listing). It offers live dashboards, an arbitrage scanner, whale alerts (trades above $500), historical order books, and an API/WebSocket for normalized events, odds, order books, trades and spreads. Tiers: free, Pro $30 a month, Premium $100 a month. — [Quicknode](https://www.quicknode.com/builders-guide/tools/oddpool-by-oddpool-inc); [Extruct](https://www.extruct.ai/hub/oddpool-com/) [search summary, unverified] [agg]
- Company: founded in 2025 by Avi Arora and Ritesh Malpani; YC Spring 2026; San Francisco. — [Dealroom](https://app.dealroom.co/companies/oddpool) [search summary, unverified]
- Deal — [Dealroom news](https://dealroom.co/news/149005-oddpool-raises-3m-seed-then-joins-kalshi/); [The SaaS News](https://thesaasnews.com/news/oddpool-raises-3m-seed); [Cryptorank M&A 2026-09-03](https://cryptorank.io/insights/deals/oddpool-m-a-2026-09-03) [search summary, unverified]:
  - A $3M seed was announced in September 2026; Cryptorank places the seed in spring, a date conflict.
  - The company "aggregates trading signals and pricing across politics, sports, and climate events".
  - It "is now joining" Kalshi "to build institutional data tooling for prediction markets".

**Adjacent News**
- Founder Lucas Kohorst. A media and data platform aggregating more than 40,000 markets from Kalshi, Polymarket, Manifold and Metaculus into one normalized API. It turns odds moves into news, and offers a unified Markets API, historical price and trade data, and cross-platform reference rates. Docs are at docs.adj.news; market and event endpoints need no auth, while export endpoints need a bearer token. — [Quicknode](https://www.quicknode.com/builders-guide/tools/adjacent-news-by-adjacent-news) [search summary, unverified] [agg; single source]

**Verso (verso.trading)**
- Framed as a "Bloomberg Terminal for prediction markets", with live Kalshi market data, a "Smart News Engine" and real-time alerts. It is an analytics layer over Kalshi and Polymarket, not a venue. Listed as New York-based, founded 2024, "partially regulated". Peers in the same comparison set: Predictu, Predik, Auspex Terminal. — [orrery.me](https://orrery.me/compare/verso); [pm.wiki](https://pm.wiki/ar/compare/auspex-terminal-vs-verso) [search summary, unverified] [agg]

**Hashdive**
- Polymarket analytics: wallet-level intelligence, whale and smart-money tracking, insider-detection scans (Z-score), a "Smart Score", and a freemium model with a Pro tier. A late-2025 partnership with Unusual Whales is unconfirmed. — [Quicknode](https://www.quicknode.com/de/builders-guide/tools/hashdive-by-hashdive); [dev.to](https://dev.to/itsragnar/best-polymarket-trading-tools-in-2026-analytics-copy-trading-execution-arbitrage-bots-e43); [SimpleFunctions](https://simplefunctions.dev/alternatives/simplefunctions-vs-hashdive); [pm.wiki](https://pm.wiki/ar/compare/hashdive-vs-polymarketdash) [search summary, unverified] [agg]

**PolymarketAnalytics.com**
- No founder or company information was found. — [search summary, unverified]
- The site hosts Polymarket market pages, including Seoul daily-temperature markets. — [PN](https://polymarketanalytics.com/markets/272241)

**Other data and AI-tooling startups**
- Dome had a unified prediction-market API and was in YC Fall 2025, with $500k from YC and a $4.7M seed. Polymarket acquired it in February 2026, its second official acquisition. — [The Block](https://theblock.co/post/390546/polymarket-buys-fresh-prediction-market-api-startup-dome-marking-second-official-acquisition); [PrivSource](https://www.privsource.com/acquisitions/deal/LXSYqO) [search summary, unverified]
- River Markets raised an $8.5M seed led by Haun Ventures for "a single interface to trade across multiple prediction markets" for professional traders. The date conflicts: July 2026 vs CB Insights' 2026-08-13. — [Dealroom](https://dealroom.co/news/144413-river-markets-raises-8-5m-seed-to-bring-prediction-markets-to-wall-stree/); [CB Insights](https://www.cbinsights.com/company/river-markets) [search summary, unverified]
- Polysights raised a $1.5M pre-seed for AI-based monitoring of prediction markets, dated 2026-06-30. It is also described as delivering real-time trade insights and insider detection. The summary did not make clear which page carried the figure. — [wnhub](https://wnhub.io/news/Generative_AI/item-51279); [vcbacked](https://www.vcbacked.co/directory/funding/seed/industry/prediction-markets) [search summary, unverified]

**Weather-native trader tools**
- **wethr.net** — [pm.wiki](https://pm.wiki/uk/projects/wethr); [pm.wiki comparison](https://pm.wiki/ko/compare/truestedge-vs-wethr) [search summary, unverified] [agg; about 40% data completeness]:
  - A "specialised analytics platform" for weather markets on Polymarket and Kalshi.
  - Its interactive temperature chart layers airport observations, official climate reports and its own high/low estimates.
  - Traders can toggle between NWS stations and Weather Underground stations to match each market's settlement source.
  - It covers 16+ forecast models, with model-to-model accuracy comparison and backtesting.
  - The code is closed source, with a limited public track record. TruestEdge is a compared peer.
  - It also publishes market-resolution source tables and a trading guide. — [PN](https://wethr.net/market-resolution); [PN](https://wethr.net/edu/trading-guide)
- **Other tools and data actors (all [PN]):**
  - vweatherstation city trackers, including Seoul RKSI ([link](https://vweatherstation.com/prediction-markets/seoul/)).
  - Better Weather Bettor ([link](https://betterweatherbettor.com/)).
  - Polydata weather ([link](https://polydata.pro/weather)).
  - TradeTheOutcome Polymarket weather strategy ([link](https://www.tradetheoutcome.com/polymarket-weather-strategy/)).
  - PolyMart weather guide ([link](https://polymart.app/blog/polymarket-weather-markets)).
  - Turbine Kalshi weather guide ([link](https://www.turbinefi.com/blog/how-to-trade-kalshi-weather-markets-2026)).
  - Apify actors, including "Kalshi Weather Markets + NWS Station Data [$0.02/city-day]" ([link](https://apify.com/perchpermits/kalshi-weather-markets-nws/api/python)) and a Kalshi Weather Index ([link](https://apify.com/gratified_ashram/kalshi-weather-index)).
- **AI-agent tooling:** GetClawKit lists a "Kalshi weather trader" agent skill. — [GetClawKit](https://getclawkit.com/skills/official-adlai88-kalshi-weather-trader) [search summary, unverified; title only]

**AI-agent builders at the distribution layer**
- Public's agents (Kalshi; climate category) — §2.
- Bitget Wallet's "AI-powered prediction market access" — §3.
- Binance Wallet's Prediction Markets API for bots and quant traders — [PN].
- Grok has been available in both the Kalshi and Polymarket apps since 2025-07-25. — [PN CNBC](https://www.cnbc.com/2025/07/25/musk-grok-kalshi-polymarket.html) [>12mo]

**Weather-company precedent (exchange-level)**
- Kalshi partnered with The Weather Company, which "will supply the meteorological data used to verify contract outcomes". — [WTVR (national wire)](https://www.wtvr.com/us-news/prediction-market-kalshi-partners-with-the-weather-company-on-climate-trading) [search summary, unverified]
- Further details (announced 2026-08-27/28) — [PN TWC newsroom](https://www.weathercompany.com/news/kalshi-and-twco-partner/); [PN The Insurer 2026-08-28](https://www.theinsurer.com/parametric-insurer/news/prediction-market-kalshi-partners-with-the-weather-company-for-settlement-data-2026-08-28/):
  - TWC "will show Kalshi's real-time probabilities in select experiences" in its app and site.
  - The two will explore markets such as ski conditions and marathon weather.
  - About 40 temperature ladders switched their named publisher to TWC on 2026-09-04.

### Inferences
- **Most realistic paying customers for a trader-facing weather API:** wethr-type tools, Verso-type terminals and agent builders (Public, GetClawKit-style skills).
  - Benchmarks: Apify's $0.02 per city-day and Oddpool's $30 and $100 monthly tiers suggest small-ticket retail pricing.
  - Larger tickets would come from institutional channels: Bloomberg licensing, BMLL, Dune Enterprise (about $40k a year as a reference point) and Kalshi's data arm.
- **The aggregator channel is consolidating into the exchanges** (Oddpool to Kalshi, Dome to Polymarket). An "independent analytics partner" today can become exchange-owned within weeks, so the data pitch should fit an exchange's data strategy, not only the startup's.
- **Products that can be sold without touching settlement:**
  - consensus-of-eleven-feeds values;
  - station-level verdict flags (met, not met, withheld);
  - the public-ledger fingerprint history, sold as an audit trail for backtests (a counterpart to BMLL's price history).
  - All of these should exclude Korean cities wherever Polymarket data is involved.
- **Co-marketing precedent:** TWC displaying Kalshi odds in its weather app is a consumer-weather-brand cross-promotion. KWeather cannot replicate this in Korea (gambling ruling). Any co-marketing must stay outside Korea and away from KWeather's domestic consumer channels.

### Gaps
- Not captured:
  - people at Dune, Verso, wethr.net, Hashdive, Adjacent News (beyond the founder), Cantor (prediction-market desk), BMLL and DoubleZero;
  - PolymarketAnalytics' operator;
  - whether wethr.net, Verso or Adjacent ingest licensed weather data (beyond public NWS and Weather Underground) or would pay for it;
  - the exact terms of the Oddpool deal (acquisition or acqui-hire);
  - whether ICE, Bloomberg or BMLL carry any weather-specific prediction-market product;
  - LSEG/Refinitiv and FactSet integrations (not researched).
- Six searches on these topics were refused when the budget ran out; see the method note.

---

## 5. Headquarters and New York presence (team in New York 2026-10-24 → 10-29)

### Takeaway
Sourced New York presence in scope:
- **Public.com:** "a New York brokerage".
- **Verso:** reported New York, from an aggregator.
- **Kalshi:** NY HQ [IR]. Kalshi now includes Oddpool's team and runs the Research data feed.
- **Robinhood:** NYC staff [IR]. Johann Kerbrat speaks at Swell 2026 at The Shed, 10/27–29 [IR].
- **ICE/NYSE Group:** Lynn Martin [IR].
- **YZi Labs:** Haley Huang, NY [IR].

ForecastEx files from Chicago or Fort Lauderdale. Crypto.com's CDNA is in Chicago. Oddpool was in San Francisco before joining Kalshi. HQs for most other entities could not be verified this session.

### Cited Findings
- **Public.com:** "a New York brokerage". — [Fortune](https://fortune.com/2026/09/24/public-ai-trading-agents-prediction-markets-kalshi-tie-up/) [search summary, unverified]
- **Verso:** listed as based in New York, founded 2024. — [orrery.me](https://orrery.me/compare/verso) [search summary, unverified] [agg]
- **Oddpool:** San Francisco before the deal. — [Dealroom](https://app.dealroom.co/companies/oddpool) [search summary, unverified]
- **ForecastEx:**
  - 209 South LaSalle Street, Chicago, in 2025 and January 2026 CFTC filings. — [PN CFTC 2026-01](https://www.cftc.gov/sites/default/files/filings/ptc/26/01/ptc01232637912.pdf)
  - 757 SE 17th Street, Fort Lauderdale, in an April 2026 filing. — [PN CFTC 2026-04](https://www.cftc.gov/sites/default/files/filings/ptc/26/04/ptc040826884.pdf)
  - These conflict.
- **Crypto.com CDNA/Nadex:** "based in Chicago". — [PN](https://www.nadex.com/company/) [>12mo]
- **Internal records** ([IR](internal_status.md)):
  - Kalshi HQ in New York.
  - Robinhood: Nicola White (VP of Crypto Institutions, Bitstamp GM, New York) and Valeria R. (CFTC-regulated market operations, New York).
  - Johann Kerbrat (SVP & GM Crypto and International) is a Swell 2026 speaker (10/27–29, The Shed).
  - ICE: Lynn Martin (President, NYSE Group).
  - YZi Labs: Haley Huang (Investment Director, New York).
  - The NYC window runs 10/24 (XRPL hackathon NYC 10/24–25) to 10/29. Meeting requests should go out 10/13–10/17.

### Inferences
NYC meeting shortlist for this layer, ranked by fit and low Korea risk:
1. **Public.com:** agents with a climate category; pitch trader data plus co-marketing.
2. **Kalshi's data and partnerships team:** Oddpool's tooling, the Research feed. Coordinate with the exchange-level Kalshi plan so it is one conversation, not two.
3. **Verso:** terminal weather panel; confirm it is actually in NYC first.
4. **Robinhood (NYC staff or Swell):** only after the 10/15 gate. Swell offers a natural in-person touchpoint with Kerbrat without new cold outreach.
5. **Bloomberg licensing:** Ann Chu, already greeted [IR]. Bloomberg's NYC HQ is background knowledge, not verified this session.

ICE/NYSE is in NYC but sits in the Polymarket-data bloc. Keep it to the existing greeting thread.

### Gaps
Unverified this session; background knowledge only, check before use:
- Robinhood: Menlo Park, CA.
- Interactive Brokers: Greenwich, CT.
- Webull Financial: New York (Wall Street address).
- moomoo US: Jersey City, NJ.
- tastytrade: Chicago.
- Apex Fintech Solutions: Dallas.
- Charles Schwab: Westlake, TX.
- Bloomberg: New York.
- Cantor Fitzgerald: New York.
- ICE: Atlanta HQ, with NYSE in New York.
- BMLL: London.
- Dune: Oslo.
- Crypto.com: Singapore.

Not captured at all: HQs for Coinbase, Kraken, MetaMask/Consensys, Phantom, Bitget, KuCoin, Bybit, OKX, Gate, MEXC, Adjacent News, Hashdive and wethr.net. NYC prediction-market events during 10/24–10/29 were not researched.

---

## 6. Latest news, 2026-09-20 → 2026-10-11, and changes since the 2026-09-28 report

### Takeaway
The window brought three dated distribution-layer events:
- **2026-09-24:** Public.com launched AI agents for prediction markets, routed to Kalshi, with a climate category.
- **2026-10-06:** Coinbase launched 15-minute crypto-price prediction markets.
- **2026-10-09:** Blockchain.com applied for a CFTC DCM license. It is one of 12 filers in 2026; six new DCMs have been approved this year.

No in-window news was found for Robinhood (latest 09-08), IBKR, Webull, moomoo, tastytrade, Schwab, eToro, Kraken, any wallet or exchange in §3, ICE, Bloomberg, Cantor or wethr. With a truncated search budget, absence of results is not proof of absence.

Material changes to the 2026-09-28 picture, several dated just before the window:
- Oddpool joined Kalshi (09-03).
- Gate was the first exchange to integrate Polymarket Builder and then built its own white-label rival.
- eToro's wallet routes to Polymarket.
- tastytrade's exchange is Kalshi via Apex.
- Travis McGhee may have moved from Crypto.com to Apex.

### Cited Findings
**Dated items inside the window**
- **2026-09-22:**
  - Coverage of the Yahoo Finance–Polymarket partnership ending. — [PN Yogonet 2026-09-22](https://www.yogonet.com/international/news/2026/09/22/126499-yahoo-finance-ends-polymarket-prediction-market-partnership)
  - Korean press reported that Kalshi applied to the CFTC for leverage/margin trading. — [PN Nate](https://m.news.nate.com/view/20260922n37940) [headline only]
- **2026-09-24:** Public launched AI Agents for Prediction Markets with Kalshi. — [Fortune](https://fortune.com/2026/09/24/public-ai-trading-agents-prediction-markets-kalshi-tie-up/); [Kalshi News](https://news.kalshi.com/p/public-kalshi-prediction-markets-ai-agents) [search summary, unverified]
- **2026-10-06:** Coinbase launched 15-minute crypto-price prediction markets; Nevada is excluded. — [Cryptonomist](https://en.cryptonomist.ch/2026/10/06/crypto-price-prediction-coinbase/) [search summary, unverified]
- **2026-10-09:** Blockchain.com sought US approval for prediction markets and crypto derivatives, joining 11 other 2026 DCM filers; the CFTC has approved six new DCMs in 2026. — [CNBC](https://www.cnbc.com/2026/10/09/blockchain-com-cftc-prediction-markets.html) [search summary, unverified]
- Searches found no in-window items for Webull, Kraken, IBKR/ForecastTrader, Robinhood (latest found: 09-08), MetaMask, Phantom or Trust Wallet. — [search summary, unverified]

**Changes or gap-fills relative to the 2026-09-28 report (dated before the window unless noted)**
- **Oddpool:** $3M seed, then joining Kalshi for institutional data tooling, with climate events in coverage (Cryptorank M&A dated 2026-09-03). — [Dealroom](https://dealroom.co/news/149005-oddpool-raises-3m-seed-then-joins-kalshi/); [Cryptorank](https://cryptorank.io/insights/deals/oddpool-m-a-2026-09-03) [search summary, unverified]
- **Gate:** first exchange to integrate Polymarket Builder, then launched its own white-label Event Contracts Builder (around 08-07); grant applicants under review on 09-03. — [Fortune 2026-09-03](https://fortune.com/2026/09/03/crypto-exchange-gate-enters-prediction-market-space-with-white-label-builder-for-businesses/) [search summary, unverified]
- **eToro:** prediction markets inside a non-custodial wallet, running on Polymarket; Kalshi in talks; buying Zengo. — [CoinSpectator 2026-03-10](https://coinspectator.com/mainstream/2026/03/10/etoro-ceo-were-in-a-strong-position-to-double-down-on-crypto-adds-prediction-markets/); [Finance Magnates](https://www.financemagnates.com/fintech/etoro-buys-self-custody-wallet-zengo-as-brokers-race-to-own-crypto-stack/) [search summary, unverified]. The 09-28 report had eToro's venue as unknown.
- **tastytrade:** markets supplied through Apex's Kalshi arrangement. Pete Mulmat is Head of Brokerage. Apex's "Global Head of Digital Markets" is named as Travis McGhee, which conflicts with the McGhee entries in [PN] and [IR]. — [The Paypers](https://thepaypers.com/fintech/news/apex-fintech-solutions-and-kalshi-launch-prediction-markets-api); [Business Wire](https://www.businesswire.com/news/home/20260727699288/en/) [search summary, unverified]
- **MetaMask:** geo-restriction list and 4% fee (profile updated 06-29). — [pm.wiki](https://pm.wiki/uk/projects/metamask) [search summary, unverified] [agg]
- **SafePal:** reported Polymarket-style access. — [crypto.jobs](https://crypto.jobs/news/polymarket-integrates-bitget-wallet-to-access-90-million-user-base) [search summary, unverified]
- **Bitget Wallet:** dated 2026-04-22. — [GlobeNewswire](https://www.globenewswire.com/news-release/2026/04/22/3278876/0/en/bitget-wallet-launches-ai-powered-prediction-market-access-through-polymarket-integration.html) [search summary, unverified]
- **MEXC:** own prediction market from March 2026. — [Crypto Briefing](https://cryptobriefing.com/mexc-launches-prediction-market/) [search summary, unverified]
- **moomoo:** launch dated 2026-06-04. — [GeneOnline](https://www.geneonline.com/moomoo-integrates-kalshi-prediction-markets-for-event-based-trading/) [search summary, unverified]
- **Dune:** Kalshi data paywall controversy (May 2026). — [Sportico](https://www.sportico.com/business/sports-betting/2026/kalshi-parlay-data-research-dune-access-1234901298/) [search summary, unverified]
- **River Markets and Polysights:** River's $8.5M seed and Polysights' $1.5M pre-seed; Polymarket's February 2026 acquisition of Dome. — sources in §4 [search summary, unverified]
- **Internal (not news):** the Crypto.com/OG MNDA thread is awaiting a reply to the 10/7 follow-up (re-judgment 10/15). Limitless made an inbound approach (10/7–10/8). — [IR](internal_status.md)

### Inferences
- Agentic trading (Public) and short-dated crypto contracts (Coinbase) are where distribution is moving. For weather data, Public's move matters more because it names climate.
- The wave of DCM filings (12 filers in 2026; six approvals) means more future contract designers. Each new exchange is a fresh settlement-data prospect at exchange level, and each one's broker partners are downstream demand signals.
- Exchanges absorbing data startups (Oddpool, Dome) makes the exchange's data team the decision point for trader-data deals too, not just settlement.

### Gaps
- Six searches were refused when the shared budget ran out, so several things may have been missed:
  - Robinhood, IBKR, Webull and Kraken news in October.
  - Polymarket-front-end changes after 09-20.
  - ICE and Bloomberg prediction-market data news after 09-20.
  - Any new Korean regulatory action after 08-18.
- The Schwab/Cboe launch date and the venue behind Coinbase's October markets remain unconfirmed.
