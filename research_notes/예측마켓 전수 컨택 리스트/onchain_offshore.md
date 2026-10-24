# On-chain and offshore prediction markets (excluding XRPL/Flare-native): contact-target sweep for a weather-settlement data provider — as of 2026-10-11

**How these notes were gathered (read first).** Research date: 2026-10-11. Baseline: `research_notes/예측마켓 플랫폼과 모회사/crypto_onchain_offshore.md` (2026-09-28) and the report `reports/예측마켓 플랫폼과 모회사.md`.

Access problems this session:
- **WebFetch** failed with `ENOTFOUND` for polymarket.com, hyperliquid.gitbook.io and pyth.network.
- **curl through the session proxy** returned `403 CONNECT` for polymarket.com, hyperliquid.gitbook.io, pyth.network and theblock.co. As instructed, I did not retry these or try to get around them.
- **GitHub** reads of third-party repos (e.g., Polymarket) are not enabled for this session, so I did not use them.
- **WebSearch:** I ran 32 searches. After that, the session-wide shared search budget (200 per turn, across all agents) was used up. Four searches did not run: Seer/Gnosis, Truth Predict, Opinion (Sep–Oct) and Predict.fun (Sep–Oct). Everything after them in my plan also did not run: Myriad follow-up, new 2026 entrants, Manifold/Metaculus, NYC events, geoblock lists and people searches.

**So no primary page was opened in this session.** Every new external finding below comes from a search-engine result summary.

Labels:

| Label | Meaning |
|---|---|
| `[SS]` | Search summary from this session, unverified. |
| `[C0928]` | Carried forward from the 2026-09-28 notes. Those were also search summaries; original links are kept. |
| `[INT]` | This repository's own records (LinkedIn profile captures or the team's correspondence). Not independently verified; file path given. |
| `[3rd-party]` | Aggregator, tracker, wiki or guide. |
| `[stale >12m]` | Dated before 2025-10-11. |
| `[conflict]` | Sources disagree. |

Personal contact details are deliberately omitted (no personal emails, phone numbers or personal LinkedIn URLs).

---

## 1. Master table: every in-scope venue at a glance (contact targets, weather, Korea exposure, people, channels)

### Takeaway
Since 2026-09-20 the biggest change for a weather-settlement vendor is **Polymarket's Protocol V2** (announced ~Oct 6–7, 2026). Its new **OracleAggregator** takes pluggable "reporter" modules: UMA, Chainlink and a plain-wallet "EOA" reporter. This is the first architecture in which a named non-UMA resolution source could plug in.

Polymarket also appears to be hiring a **Head of Markets**, reporting to the CEO, to own listing, resolution credibility and market integrity. **It is still listing daily "Highest temperature in Seoul (Incheon)" markets in October 2026**, even after Korea's 2026-08-18 block.

Hyperliquid HIP-4 now has at least two permissionless deployers: Outcome.xyz, and Skew (staked by Nasdaq-listed Hyperion DeFi). Neither lists weather. Weather would first need a validator-approved template.

No weather markets were found on any on-chain venue other than Polymarket, which matches the 09-28 finding.

### Cited Findings
Master table. Sources are inline in short form; the full citations are in §3–§11. "n/f" = not found this session.

| Entity | Segment | Chain / owner / investors | Status & scale | Weather/climate markets (examples; resolution source) | Korea access / sensitivity | Public channels | People (Name/handle — exact title — relevance — source, date) | HQ / NYC presence | Latest news (date) | Fit & risk notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **Polymarket (global, polymarket.com)** | Offshore on-chain CLOB; the weather leader | Polygon; Protocol V2 makes pUSD the sole collateral ([Crypto Briefing](https://cryptobriefing.com/polymarket-protocol-v2-mainnet-switchover/) `[SS]`). ICE ~22% (largest holder). 1789 Capital-led $1B at ~$21B (2026-08-31) ([CoinDesk](https://www.coindesk.com/business/2026/09/01/trump-jr-s-firm-leads-usd1-billion-polymarket-raise-at-usd21-billion-value-report) `[C0928]`) | Live. "Volume tops $10B a month" (headline, [CMC Academy](https://coinmarketcap.com/academy/de/article/polymarket-protocol-v2-contracts-10b-volume) `[SS]`). Aug 2026: Polymarket + Polymarket US $8.16B (CryptoRank via 09-28 notes). Definitions differ; do not compare these directly | **Yes, large.** Daily high/low ladders for "more than fifty cities" ([nextpredict](https://nextpredict.io/prediction-markets/weather/) `[SS][3rd-party]`). **Seoul (Incheon)** daily markets Oct 1–9, 2026, ~$12–19K each, on the Incheon airport station ([predscope](https://predscope.com/event/highest-temperature-in-seoul-on-october-8-2026) `[SS][3rd-party]`). Rain markets ("Where will it rain on Oct 5, 2026?") ([CoinStats](https://coinstats.app/prediction-markets/odds/climate/) `[SS]`). Climate: NASA GISTEMP monthly brackets, "hottest year" ([polyguana](https://polyguana.com/market/2480295) `[SS]`). Resolution: UMA OO with managed proposers; V2 adds OracleAggregator (UMA / Chainlink / EOA reporters) | **Blocked in KR since 2026-08-18** (KCSC; weather and "Seoul August rainfall" cited; non-custodial defence rejected). Seoul markets still listed in Oct → **highest sensitivity** | [Builders Program](https://builders.polymarket.com/) and [partners page](https://builders.polymarket.com/partners) `[C0928]`; [docs: resolution](https://docs.polymarket.com/concepts/resolution); V2 migration docs; Data API V1 retires 2026-10-24 → V2 ([Bitcoin.com](https://news.bitcoin.com/technology/polymarket-rebuilding-engine-under-every-bet-november-2/) `[SS]`); [UMA propose/dispute UI](https://oracle.uma.xyz/) | **Shayne Coplan** — founder & CEO — final say — [CoinDesk 2026-09-10](https://www.coindesk.com/markets/2026/09/10/polymarket-names-former-amazon-finance-chief-warren-jenson-as-its-first-cfo) `[C0928]`. **Rajath Alex** — head of protocol — owns V2 and the OracleAggregator — Oct 2026 `[SS]`. **Head of Markets** — open role reporting to the CEO; owns listing, resolution and integrity — [pm.wiki](https://pm.wiki/jobs/polymarket-head-of-markets) ~Sep 2026 `[SS][3rd-party]`. **Shana Bautista** — global head of investigations and intelligence — integrity — [CNBC 2026-08-11](https://www.cnbc.com/2026/08/11/polymarket-revamps-marketing-expands-us-hiring-ahead-of-fall-events.html) `[C0928]`. **Mike Eidlin** — leads Japan expansion — Asia — [CoinDesk 2026-05-22](https://www.coindesk.com/policy/2026/05/22/polymarket-aims-for-prediction-market-approval-in-japan-by-2030) `[C0928]`. `[INT]`: Lisa Mantil (Head of Institutional Growth, 2026-09, NY), Malea Otranto (Global Head of Trust and Safety, 2026-08, NY), Shirley Wong (Growth lead, 2026-09, Dubai) | New York (operator "Blockratize Inc., New York" is unverified background from the 09-28 notes). Several execs are NY-based `[INT]` | Protocol V2: canary Oct 5–30, net-new markets "tentatively" from **Nov 2** (~Oct 6–7). FCA confirmed UK-entry talks (Oct 2026) | **Best technical opening found** (pluggable reporters, integrity hire, CDG precedent). **Worst Korea exposure.** Approach only with non-Korean cities, after counsel |
| **UMA (Polymarket's optimistic oracle; managed proposers)** | Oracle layer | Ethereum/Polygon; UMA token-holder votes | MOOV2 per-market proposer whitelist. 177 whitelisted addresses (Nov 2025). Incorrect proposals −59%, disputes −68% in the first month ([UMA blog](https://blog.uma.xyz/articles/managed-proposers-update) `[SS]`) | Settles Polymarket weather today. Under V2 it becomes one reporter module among several | Indirect; high if a vendor proposes on Korean-city markets | [oracle.uma.xyz](https://oracle.uma.xyz/); [blog.uma.xyz](https://blog.uma.xyz/articles/managed-proposers-update) | n/f | n/f | V2 lists a "UMA Optimistic Oracle module" (Oct 2026) `[SS]` | Whitelist entry needs a proposal track record. Low revenue, but useful for publishing evidence |
| **Limitless (Base)** — *active talks; material changes only* | Offshore on-chain; US DCM applicant via Limitless Markets US | Base; LMTS; $10M seed led by 1confirmation ([Decrypt](https://decrypt.co/344982/limitless-prediction-market-closes-10m-seed-round-ahead-of-lmts-token-launch), Oct 2025 `[stale >12m?]`) | "Close to $2B monthly volume" per Bernstein ([The Block](https://www.theblock.co/post/405086/limitless-ceo-no-prediction-market-platform-will-dominate-perpetual-futures-precedent) `[SS]`, date not shown). The repo's own tally ranges from $30M to $2B per month depending on definition `[INT]` | None found externally | **~60% of users in Asia-Pacific, ~30% in Europe** (The Block `[SS]`). A Korea & Japan growth head exists `[INT]` → high | Telegram group with the Head of BD `[INT]` | CJ Hetherington — co-founder & CEO (The Block `[SS]`). `[INT]`: Henrich Tauber (Head of BD), Clyde Carver (DevRel), Daria Han (Head of Growth Korea & Japan) | Limitless Markets US is led from NY `[INT]` | **No material external change found 09-20 → 10-11** (search coverage limited) | Keep the existing thread. The APAC skew of the user base supports the "no Korean users / no Korean cities" clauses already planned `[INT]` |
| **Opinion (Opinion Labs; opinion.trade)** | Offshore on-chain, macro-focused | BNB Chain. YZi Labs (minority), Amber, Animoca, Manifold Trading, echo. $20M pre-Series A (Hack VC, Jump Crypto, Primitive, Decasonic; 2026-02-04) ([Messari](https://messari.io/project/opinion-labs/profile) `[C0928]`) | Live. Company claims ~1/3 of global volume and >$130M open interest ([Ventureburn](https://ventureburn.com/opinion-labs-raises-20m-for-onchain-prediction-expansion/) `[SS]`, company-reported) | None found. Resolution: Opinion AI (rules + evidence) → bonded answer → challenge → token-holder vote ([Opinion Learn](https://blog.opinion.trade/learn/what-is-a-prediction-market-oracle) `[C0928]`) | No KR block found. **Hong Kong IFEC warning names weather betting** → high | [Opinion Learn blog](https://blog.opinion.trade/learn/what-is-a-prediction-market-oracle); official X (`[INT]`) | **Forrest Liu** — CEO & co-founder — decision-maker — [Bitget Academy](https://www.bitget.com/amp/academy/what-is-opinion-opn-macro-prediction-market-how-it-works-price-prediction) `[C0928]`; prior employer `[conflict]` (KKR vs CMB International `[INT]`). `[INT]`: Asa L. — Head of Marketing & Growth, Advisor to the CEO (part-time) | Hong Kong ([Messari](https://messari.io/project/opinion-labs/profile)); NYC n/f | None found 09-20 → 10-11. Early 2026: 35% of new capital to compliance and licensing; APAC push before the World Cup ([Ventureburn](https://ventureburn.com/opinion-labs-raises-20m-for-onchain-prediction-expansion/) `[SS]`) | The AI-evidence oracle gives a natural "named source" slot. HK warning plus Korea risk |
| **Predict.fun (+ Probable, acquired 2026-03-04)** | Offshore on-chain, yield-bearing positions | BNB Chain. YZi Labs plus Susquehanna Crypto follow-on (2026). Built by ex-Binance staff ([Yahoo Finance](https://finance.yahoo.com/news/cz-teases-bnb-based-prediction-133355253.html) `[SS]`) | Live. $1.8B cumulative and 130k users (company) ([Predict.fun news](https://predict.fun/news/predict-fun-announces-strategic-funding-round-with-yzi-labs-and-susquehanna-crypto) `[C0928]`). In Binance Wallet since 2026-04-09; Binance Wallet API since 2026-06-08 | None found. Probable used UMA OO; Predict.fun's own method n/f | No KR block found. States an Asia focus → high | [predict.fun/news](https://predict.fun/news/predict-fun-announces-strategic-funding-round-with-yzi-labs-and-susquehanna-crypto); official X; **published generic inquiry address exists** (`[INT]`, not copied) | Founder "**Dingaling**" (pseudonymous) ([Crypto Times](https://www.cryptotimes.io/2026/03/04/predict-fun-acquires-probable-to-strengthen-bnb-chain-prediction-markets/) `[C0928]`) | n/f | None found 09-20 → 10-11 | Binance distribution; pseudonymous team; Korea risk |
| **Myriad (DASTAN)** | Media-embedded on-chain markets | Abstract → Linea → BNB Chain; USD1 settlement. Seed Mar 2026 (MoonPay Ventures, Walrus, Tom Lee) ([Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/prediction-market-myriad-closes-milestone-162400075.html) `[C0928]`) | Live as of 09-28. Powers Trust Wallet Predictions (2025-12-02) ([BeInCrypto](https://beincrypto.com/trust-wallet-predictions-launch/) `[C0928]`) | None found | n/f → high (offshore, wallet-distributed) | [Chrome extension](https://chromewebstore.google.com/detail/myriad-markets/iojngbokndmhhjmcjkbokckpcaaoholp?hl=en); [QuickNode listing](https://www.quicknode.com/builders-guide/tools/myriad-markets-by-dastan) | n/f (this session's search returned nothing relevant) | n/f | n/f | Low weather fit. Decrypt is a sister company, so its coverage is not independent |
| **Hyperliquid HIP-4 (protocol and validators)** | Perp-DEX-native outcome markets | Hyperliquid L1. Founders Jeff Yan and pseudonymous "iliensinc" ([pm.wiki](https://pm.wiki/ja/projects/hyperliquid) `[SS][3rd-party]`) | Permissionless deployment live since **2026-08-29**. **7 approved mainnet templates**, mostly price and central-bank-rate markets ([hyperliquidguide](https://hyperliquidguide.com/ecosystem/hip-4-permissionless-deployment) `[SS][3rd-party]`). 30-day notional $45.99M ([Loris](https://loris.tools/hip4) `[C0928]`, date n/a) | **None.** Closest are validator-vote macro markets (CPI, Fed, jobs). A weather market needs a new template approved by validator vote | No geoblock information; permissionless → high | [HIP-4 deployer API docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/hip-4-deployer-actions); official Telegram announcement channel ([The Defiant](https://thedefiant.io/news/defi/hyperliquid-to-open-hip-4-prediction-markets-behind-500-000-hype-stake) `[SS]`) | Jeff Yan — co-founder; iliensinc — pseudonymous co-founder ([pm.wiki](https://pm.wiki/ja/projects/hyperliquid) `[3rd-party]`) | n/f | None found 09-20 → 10-11 | **Deployer = oracle with a 500k-HYPE slashable stake.** That is the strongest economic need for defensible data, but it sits behind template governance |
| **Outcome.xyz (HIP-4 deployer)** | HIP-4 deployer | Bootstrapped, team identity not public, self-staked 500k HYPE ([pm.wiki](https://pm.wiki/uk/projects/outcomexyz) `[SS][3rd-party]`) | First permissionless deployer (2026-08-29) ([KuCoin](https://www.kucoin.com/news/flash/hyperliquid-hip-4-deployment-begins-outcome-becomes-first-builder) `[SS]`). "~75% of HIP-4 builder volume" (pm.wiki, low reliability) | None found | n/f → high | outcome.xyz (not opened) | None public | n/f | n/f | Leading deployer; anonymous team is a diligence risk |
| **Skew (Skew Technologies) + Hyperion DeFi (Nasdaq: HYPD)** | HIP-3/HIP-4 deployer backed by a listed HYPE-treasury company | Hyperion lends its 500k staked HYPE to Skew ("HAUS" agreement effective **2026-07-15**; fixed + scaling revenue share) ([CoinTurk](https://en.coin-turk.com/hyperion-lends-33-6-million-in-hype-to-skew-for-new-hyperliquid-futures-markets/) `[SS]`) | Second live HIP-4 deployer; first market BTC hourly Up/Down ([Bankless](https://www.bankless.com/read/hyperliquid-s-hip-4-era) `[SS]`) `[conflict: other coverage frames the Hyperion stake as HIP-3]` | None found | n/f | Hyperion DeFi investor relations (listed company; [Q1 2026 coverage](https://finance.yahoo.com/markets/crypto/articles/hyperion-defi-hypd-q1-2026-182118824.html)) | n/f | n/f (US-listed parent; HQ not sourced) | n/f | A listed-company counterparty is easier to diligence than anonymous deployers |
| **Kalshi-on-Solana: DFlow (+ Phantom front-end)** | Tokenization layer: Kalshi markets as SPL tokens | Solana. Settlement mirrors Kalshi ([Solana.com](https://solana.com/news/dflow-prediction-markets-api) `[C0928]`) | Early Jan 2026: DFlow >$22.4M cumulative, **>98% routed via Phantom** ([StepData](https://stepdata.substack.com/p/prediction-markets-on-solana-286m) `[SS]`) | Kalshi's weather markets are presumably included ("all Kalshi markets"). Settlement follows Kalshi (NWS CLI / The Weather Company) — inference | Kalshi restricts Korean users ([Hankyung](https://www.hankyung.com/article/2026052121506) `[SS]`); enforcement on the tokenized side n/f | [DFlow Prediction Markets API](https://dflow.net/blog/prediction-markets-api); Kalshi $2M builder grants `[C0928]` | n/f | n/f | n/f | Not a settlement entry point. At most, data for traders |
| **Jupiter (Prediction tab)** | Solana DEX-aggregator front-end | Solana | "Prediction" tab with Polymarket contracts since **2026-02-01** ([The Block](https://www.theblock.co/post/387945/jupiter-polymarket-solana) `[SS]`). Kalshi partner per one directory ([thegrid.id](https://thegrid.id/discovery/productType/prediction-markets) `[SS][3rd-party]`) | Inherits the venues' weather markets (inference) | Inherits Polymarket's sensitivity | n/f | n/f | n/f | n/f | Distribution only |
| **Drift BET → Velocity DEX** | Solana perp DEX (BET launched 2024) | Tether-led relaunch financing | Exploit **2026-04-01** (~$280–295M; attributed to North Korea-linked attackers). Rebranded **Velocity DEX 2026-07-01** as a **perps-only**, USDT-settled venue ([The Defiant](https://thedefiant.io/news/defi/drift-protocol-rebrands-to-velocity-dex-ahead-of-relaunch); [Mitrade](https://www.mitrade.com/insights/news/live-news/article-3-1864182-20260702) `[SS]`). BET status not stated | None | DPRK-linked hack: sanctions and reputational flag | n/f | n/f | n/f | 2026-07-01 rebrand | **Deprioritize.** BET is probably not part of the relaunch (inference) |
| **Azuro** | On-chain betting liquidity protocol (sports-first) | Polygon, Gnosis Chain, Base, Chiliz; USDC; AZUR. $18.5M raised ([Tracxn](https://tracxn.com/d/companies/azuro/__ApKl6xZ3DMxbYBRcSya396VnbVyE6ieqZM7e1R7al4Q) `[C0928]`) | $530M+ cumulative (June 2026 page) ([pm.wiki](https://pm.wiki/uk/compare/azuro-vs-polymarket) `[SS][3rd-party]`) | None. **"Data providers" set odds and supply outcomes**; AzuroDAO (staked AZUR) is the arbiter of last resort ([pm.wiki](https://pm.wiki/uk/projects/azuro) `[SS]`) | Sports betting is exposed under Korea's National Sports Promotion Act; geoblocking n/f | azuro.org (not opened); [QuickNode listing](https://www.quicknode.com/builders-guide/tools/azuro-by-azuro) | n/f | Tracxn "Tucson" (doubtful) | n/f | Has a formal data-provider role, but weather would be a new vertical. Low priority |
| **SX Bet** | P2P sports and prediction exchange | SX Network rollup | `[conflict]` $200M+ cumulative ([pm.wiki](https://pm.wiki/fr/compare/betstack-vs-sx-bet) `[SS]`, Apr 2026) vs $780M lifetime, gasless-chain migration and SX token sunset (snapshot 2026-05-15) `[C0928]` | None | Sports-law exposure | [help.sx.bet](https://help.sx.bet/en/articles/4037276-introduction-and-overview); public API | n/f | n/f | n/f | Low |
| **Augur (Lituus Foundation)** | Oracle / dispute "truth layer" | Ethereum (REP) | "Moon Fork" began **2026-04-08** (Artemis II dispute). REP migration deadline **2026-08-01**; ~3.7M REP (33.6%) migrated by late July ([Crypto Briefing](https://cryptobriefing.com/augur-rep-migration-deadline-coinbase/) `[SS]`). Repositioned as a "cross-chain truth layer" ([LBank](https://www.lbank.com/explore/augur-rep-algorithmic-fork) `[SS]`, promotional) | None | Low direct exposure (no retail venue) | [augur.net blog](https://www.augur.net/blog/the-augur-lituus-whitepaper/); [GitHub](https://github.com/augurproject) `[C0928]` | **Micah Zoltu** — "longtime Augur community member" who started the test dispute ([LBank](https://www.lbank.com/explore/augur-rep-algorithmic-fork)/[edgeX](https://pro.edgex.exchange/zh-TW/news/article/augur-rep-migration-deadline-moon-fork) `[SS]`). Foundation leadership n/f | n/f | Aug 1 migration close | Possible evidence source or dispute backstop. Low revenue |
| **Gnosis / Presagio / Omen / Seer** | CTF markets; Reality.eth + Kleros | Gnosis Chain; GIP-113 (2024) `[stale >12m]` | No 2026 update (search budget ran out) | None found | Low–medium | [SwaprHQ/presagio](https://github.com/SwaprHQ/presagio); [Kleros: Seer](https://blog.kleros.io/seer-crafting-smarter-prediction-markets-for-a-complex-world/) `[C0928]` | n/f | n/f | n/f | Evidence-source fit for AI-agent markets |
| **Truth Predict (TMTG) / OG.com** | US CFTC venue; no on-chain part found | OG.com spun out of Crypto.com (launched 2026-02-03; valued $5B; Robinhood equity 2026-09-08) ([Blockhead](https://www.blockhead.co/2026/09/09/robinhood-picks-og-com-to-run-its-prediction-markets-taking-equity-tied-to-citadels-20-billion-crypto-com-valuation/) `[C0928]`) | Truth Predict cut back to a marketing tie-up pointing to OG.com ([Bitcoin.com](https://news.bitcoin.com/igaming/trump-media-drops-truth-predict-buildout-chooses-crypto-com-instead/) `[C0928]`) | OG's climate category is thin ("hottest year") ([OG Learn](https://og.com/learn/how-to-trade-weather-and-climate-prediction-markets) `[C0928]`) | US-only → low | [og.com/company-news](https://og.com/company-news/robinhood-selects-ogcom-as-infrastructure-partner-for-prediction-markets-platform-holding-equity-stake-in-exchange-engine) | Kris Marszalek — founder & CEO of Crypto.com and OG.com `[C0928]` | n/f | n/f | Out of on-chain scope; belongs to the US-regulated lane |
| **Hedgehog (Solana) / Zeitgeist (Polkadot)** | Small or legacy venues | — | Hedgehog "V1 Jan 2026" claim; Zeitgeist listed as "archive" `[C0928]` | None | n/f | — | n/f | n/f | n/f | Low |
| **Other 2026 entrants** (XO Market, Melee, Kash, Precog, Sapience, Truemarkets, PredX, Noise, Triad, Football.fun, Polkamarkets, Futuur, etc.) | — | — | **Not checked** (search budget used up) | — | — | Third-party directory [pm.wiki](https://pm.wiki/fr/projects/polyseason) lists many projects (e.g., "Polyseason", "Predikt.gg") `[3rd-party]` | — | — | — | See §9 Gaps |
| **Manifold / Metaculus** (non-money) | Forecasting platforms | — | **Not checked** | — | — | — | — | — | — | See §9 Gaps |

### Inferences
- **The priority order for a weather-settlement vendor has shifted toward Polymarket's protocol layer.** Two things point that way: V2's pluggable "EOA reporter" (a designated signing address) and the CEO-level Head of Markets hire. Together they suggest Polymarket can now name a non-UMA resolution source per market type. This is inference from architecture coverage, not a stated policy.
- **The "technical fit vs legal fit" inversion from the 09-28 report still holds and has sharpened.**
  - The venues with the clearest need are Polymarket (V2 reporters), HIP-4 deployers (slashable stake) and Opinion (AI-evidence oracle).
  - The same venues carry the highest Korea exposure. Polymarket kept listing Seoul markets after the block. Limitless reports a ~60% APAC user base. Opinion sits under Hong Kong's weather-naming warning.
- Lowest-risk on-chain touchpoints are oracle and dispute layers: UMA as an evidence publisher, Augur Lituus, and Reality.eth/Kleros. There, the vendor supplies verifiable evidence for non-Korean cities and does not list or market anything itself. Revenue there is small.

### Gaps
- Primary pages were not opened for any row. All volumes, dates and titles need checking on the venue's own pages before external use.
- The table has no "Asia lead" or "partnerships lead" for Opinion, Predict.fun, Myriad, Hyperliquid, Outcome, Skew, DFlow, Jupiter, Azuro, SX Bet or Lituus. People searches did not run because the search budget was used up.

---

## 2. What changed between 2026-09-20 and 2026-10-11, and what the 09-28 report missed

### Takeaway
The new material items are concentrated at Polymarket (Protocol V2, hiring, continuing Seoul and rain markets) and in the HIP-4 deployer set (Skew via Hyperion DeFi). There are also new facts the 09-28 report lacked: Drift's April exploit and July rebrand to a perps-only Velocity DEX, and Augur's April "Moon Fork". I found no material external news for Limitless, Opinion, Predict.fun or Myriad in the window, but those searches were partly cut off by the budget.

### Cited Findings
**In the window (2026-09-20 → 10-11)**
- **Polymarket Protocol V2 (announced about Oct 6–7, 2026).** Polymarket's head of protocol, **Rajath Alex**, announced it on X. `[SS]` Details:
  - Canary markets run in production **Oct 5–30**. Net-new markets "tentatively" move to V2 on **Nov 2**. Existing CTF positions are not migrated automatically.
  - V2 replaces the 2019 Gnosis CTF framework with a single ERC-1155 contract and makes **pUSD** the sole collateral.
  - An **OracleAggregator** sits above pluggable reporter, dispute and arbitration modules. Current reporters are a **UMA Optimistic Oracle module, a Chainlink reporter and an EOA reporter**.
  - Security: formal verification by Certora and a $5M bug bounty.
  - **Data API V2** ships alongside; Data API V1 reportedly retires **Oct 24**.
  - One outlet spells the name "Rajas" `[conflict, minor]`.

  Sources: [Crypto Briefing](https://cryptobriefing.com/polymarket-protocol-v2-mainnet-switchover/); [crypto.news](https://crypto.news/polymarket-v2-could-change-how-users-bet-on-events/); [Bitcoin.com News](https://news.bitcoin.com/technology/polymarket-rebuilding-engine-under-every-bet-november-2/); [parameter.io](https://parameter.io/polymarket-protocol-v2-goes-live-november-2-with-unified-trading-system/); [MPost](https://mpost.io/polymarket-debuts-protocol-v2-in-canary-markets-targeting-full-migration-in-november/); [CMC Academy](https://coinmarketcap.com/academy/de/article/polymarket-protocol-v2-contracts-10b-volume); [Digital Today (KR, English)](https://www.digitaltoday.co.kr/en/view/111402/polymarket-overhauls-smart-contracts-shifts-to-protocol-v2); [BitcoinWorld, 2026-10-07](https://bitcoinworld.co.in/polymarket-rolls-out-protocol-v2-smart-contract-overhaul/); [edgeX](https://pro.edgex.exchange/en-US/news/article/polymarket-protocol-v2-canary-testing); [Hokanews 2026-10](https://www.hokanews.com/2026/10/polymarket-unveils-protocol-v2-ahead-of.html)
- **Polymarket Head of Markets (posting roughly September 2026).** A third-party job mirror lists the role as reporting to the **Founder & CEO**, onsite, USD 300–400K. `[SS][3rd-party]` Scope:
  - Owns listing decisions, market structure, liquidity, operations and resolution.
  - Works with "media, sports, and politics partners" on resolution strategy.
  - "Own[s] resolution credibility and market integrity".

  Source: [pm.wiki job mirror](https://pm.wiki/jobs/polymarket-head-of-markets). I did not find Polymarket's own careers page.
- **Seoul markets are still running.** Daily "Highest temperature in Seoul (Incheon)" markets exist for **Oct 1, 2, 3, 5, 6, 8 and 9, 2026**, at roughly $12K–$19K volume each. The aggregator says they resolve on the highest temperature "recorded by **NOAA** at Incheon International Airport station". **`[conflict]`:** the 09-28 notes recorded Wunderground at Incheon for August–September. `[SS][3rd-party]` — [predscope Oct 1](https://predscope.com/event/highest-temperature-in-seoul-on-october-1-2026); [Oct 3](https://predscope.com/event/highest-temperature-in-seoul-on-october-3-2026); [Oct 8](https://predscope.com/event/highest-temperature-in-seoul-on-october-8-2026); [Oct 9](https://predscope.com/event/highest-temperature-in-seoul-on-october-9-2026)
- **Weather and climate book size.** One aggregator counts 355 open weather/climate events on Polymarket and 201 on Kalshi. It names "Where will it rain on Oct 5, 2026?" as the most prominent contract. **Its totals do not reconcile internally.** `[SS][3rd-party]` — [CoinStats](https://coinstats.app/prediction-markets/odds/climate/). Polymarket's own weather hub showed live markets on **2026-10-10** `[SS]` — [polymarket.com/weather](https://polymarket.com/weather)
- **UK.** The FCA confirmed talks with prediction-market operators about possible UK entry (October 2026) `[SS]` — [Yahoo Finance](https://finance.yahoo.com/markets/options/articles/polymarket-kalshi-coming-uk-fca-112215545.html). The same search summary said Spain opened proceedings against Polymarket in May and France ordered ISPs to block it in July. The source for those two claims was unclear.
- **Polymarket institutional hire** `[INT]`: **Lisa Mantil, Head of Institutional Growth (2026-09, New York, ex-Goldman Sachs).** The team's notes cite CNBC (2026-09-29) as reporting four senior hires in about five weeks; that CNBC piece was not opened — [INT: depin/intel/business-directions.md](../../depin/intel/business-directions.md)
- **No Korean regulator follow-up found.** The searches found no KCSC action in September–October 2026 against Polymarket or any other prediction market `[SS]`. This is absence of evidence only — [Daum](https://v.daum.net/v/qGHcgsqFZo); [Wikitree](https://www.wikitree.co.kr/articles/1153222)

**Missing from or understated in the 09-28 report (dated earlier, newly found)**
- **HIP-4 permissionless rollout.**
  - Testnet from **Jul 31**. Rollout completed on mainnet **Aug 29, 2026**. By Aug 31 the deployer-actions API answered on api.hyperliquid.xyz.
  - The mainnet template catalog has **seven approved templates**, "mostly price and central-bank rate markets".
  - Launch limits: 100 concurrent outcomes and 500 deployments per day per deployer, expected to rise to 1,000 and 5,000.

  `[SS][3rd-party]` — [hyperliquidguide](https://hyperliquidguide.com/ecosystem/hip-4-permissionless-deployment); [Datawallet](https://www.datawallet.com/crypto/hip-4-explained-hyperliquid-upgrade); [Memeburn](https://memeburn.com/hyperliquid-hip-4-goes-permissionless/)
- **Second HIP-4 deployer: Skew.** Its stake comes from **Hyperion DeFi** (Nasdaq: HYPD); its first market was BTC hourly Up/Down. **`[conflict]`:** Bankless calls Skew the second live deployer after Outcome, while hyperliquidguide names Skew as "the live outside deployer" `[SS]` — [Bankless](https://www.bankless.com/read/hyperliquid-s-hip-4-era); [hyperliquidguide](https://hyperliquidguide.com/ecosystem/hip-4-permissionless-deployment)
- **Drift.**
  - Exploited **2026-04-01**. Totals reported: ~$280M, $286M (Elliptic) and $295.4M. Attributed to North Korea-linked attackers.
  - Relaunch backed by a **Tether**-led package: a ~$150M consortium per Bloomberg Law, or a $127.5M credit line.
  - **Rebranded to Velocity DEX on 2026-07-01** as a perps-only, USDT-settled venue, dropping Isolated Markets and Amplify.

  `[SS]` — [Bloomberg Law](https://news.bloomberglaw.com/crypto/hacked-crypto-platform-to-relaunch-after-securing-new-funding); [The Defiant](https://thedefiant.io/news/defi/drift-protocol-rebrands-to-velocity-dex-ahead-of-relaunch); [Mitrade, 2026-07-02](https://www.mitrade.com/insights/news/live-news/article-3-1864182-20260702); [CoinSpot](https://coinspot.io/en/cryptocurrencies/drift-protocol-relaunches-as-velocity-dex-and-receives-credit-line-from-tether/); [ThreatCluster](https://threatcluster.io/cluster/drift-protocol-relaunches-after-285m-exploit-with-tethers-su-260ee901)
- **Augur "Moon Fork".**
  - Began **2026-04-08**: a deliberately escalated dispute over the Artemis II liftoff, started by community member Micah Zoltu to test the full resolution process.
  - REP migration to "REPv2_Yes_1" was one-way and 1:1, with a deadline of **2026-08-01**. About 3.7M REP (33.6% of 11M) had migrated by late July.

  `[SS]` — [Crypto Briefing](https://cryptobriefing.com/augur-rep-migration-deadline-coinbase/); [edgeX](https://pro.edgex.exchange/zh-TW/news/article/augur-rep-migration-deadline-moon-fork); [Binance Square](https://www.binance.com/de/square/post/348085611524497); [LBank (promotional)](https://www.lbank.com/explore/augur-rep-algorithmic-fork)
- **Jupiter "Prediction" tab** (Polymarket contracts on Solana) since **2026-02-01** `[SS]` — [The Block](https://www.theblock.co/post/387945/jupiter-polymarket-solana); [Forklog](https://forklog.com/en/jupiter-integrates-polymarket-joins-prediction-market-race/)
- **Limitless user base** is roughly 60% Asia-Pacific and 30% Europe; it had not launched for US customers pending approval (Bernstein via The Block; date not shown) `[SS]` — [The Block](https://www.theblock.co/post/405086/limitless-ceo-no-prediction-market-platform-will-dominate-perpetual-futures-precedent)

### Inferences
- The Oct 24–29 New York trip falls in the **last week of Polymarket V2's canary period** and the week **Data API V1 retires** (Oct 24). Questions about which reporter modules will be allowed for which market types are timely then. This is a scheduling inference.
- The continuing Seoul markets mean the Korean regulator's concern (Korea-specific weather markets) is still live on the platform. Any Polymarket-facing pitch should explicitly exclude Korean cities.

### Gaps
- I did not see Rajath Alex's own X post or Polymarket's V2 migration guide, so I could not check:
  - which reporter module is meant for which market category;
  - whether weather markets will move off UMA.
- Not checked in the window, because the search budget was used up: Opinion, Predict.fun, Myriad, Gnosis/Seer, Truth Predict and every "new entrant". Their "no news" status is **unverified**, not confirmed.

---

## 3. Polymarket (global): who runs market creation and resolution, the weather/climate category, UMA managed proposers, channels

### Takeaway
Market creation and resolution at Polymarket sit with a markets function headed from the CEO's office (the Head of Markets is being hired) and a protocol team led by Rajath Alex, which owns V2 and the OracleAggregator. Day-to-day settlement still runs through UMA's managed-proposer whitelist. The weather book is large and global: 50+ cities, rain clusters, NASA-based climate brackets. It settles on single airport stations via Wunderground or NOAA pages.

### Cited Findings
**Resolution mechanics**
- The rules in each market define resolution: the source, the end date and edge cases. The title does not `[SS]` — [Polymarket docs](https://docs.polymarket.com/concepts/resolution)
- **UMA managed proposers (MOOV2):**
  - UMIP-189 passed on Aug 6 (2025) `[stale >12m]` — [The Block, 2025-08-12](https://www.theblock.co/post/366507/polymarket-uma-oracle-update)
  - In September 2025 UMA introduced a contract that lets Polymarket manage proposers through a **per-market whitelist**. **Polymarket decides which markets use it**, UMA curates eligibility by historical accuracy, and anyone can still dispute.
  - 177 whitelisted addresses as of Nov 2025. In the first month after enforcement began on Sept 5, incorrect proposals fell 59% and disputes fell 68%.
  - Whitelist snapshots are taken on the **2nd of each month** over a rolling 6-month window.

  `[SS]` — [UMA blog: managed proposers update](https://blog.uma.xyz/articles/managed-proposers-update)
- A third-party guide puts the criteria at ≥5 proposals in a rolling 6 months with ≥95% accuracy, a **$750 bond** and $2–5 rewards. **`[conflict]`** with the $500 bond in the 09-28 notes. `[SS][3rd-party]` — [Start Polymarket](https://startpolymarket.com/learn/how-to-propose-resolutions/)
- **V2 OracleAggregator:** pluggable reporter, dispute and arbitration modules; current reporters are UMA OO, Chainlink and an EOA reporter (sources in §2).

**Weather and climate category (October 2026)**
- City examples cited in guides: New York (LaGuardia), London, Seoul, Tokyo and Sydney. A March 2026 report says Polymarket added Shanghai and Hong Kong weather markets. One guide claims single major-city daily markets "regularly clear $300,000 to $400,000" in 24-hour volume; **this is unverified** and sits oddly next to the ~$12–19K seen on Seoul markets. `[SS][3rd-party]` — [LaikaLabs](https://laikalabs.ai/prediction-markets/trade-polymarket-weather-markets); [Bitget News](https://www.bitget.com/news/detail/12560605258421); [nextpredict](https://nextpredict.io/prediction-markets/weather/)
- **2026 temperature rules seen on mirrors.** Wunderground history pages are named for:
  - Warsaw Chopin (Mar 2026);
  - Chicago O'Hare KORD (Apr 2026);
  - Wellington (May 2026);
  - LA (KLAX) and San Francisco (KSFO).

  Settlement is in whole °C or whole °F. "Revisions … after data is finalized … will not be considered". `[SS][3rd-party]` — [polyguana](https://polyguana.com/market/2219898); [polyguana](https://polyguana.com/market/2074633)
- **Rain markets.** A Dallas market in the "Where will it rain on June 10?" cluster:
  - Resolves "Yes" on any precipitation at the named station per NOAA's finalized daily figure.
  - **Trace ("T") does not count.**
  - Resolves "No" if data is not available by a stated deadline.
  - Uses two decimals and ignores later revisions.

  The exact mirror page could not be pinned. `[SS][3rd-party]` — [polyguana](https://polyguana.com/market/2479427)
- **Climate.**
  - Monthly global-temperature brackets on NASA's Global Land-Ocean Temperature Index.
  - "Will any month of 2026 be the hottest on record?"
  - "Will 2026 be the hottest year on record?"

  `[SS]` — [polyguana](https://polyguana.com/market/2480295); [Action Network](https://www.actionnetwork.com/news/will-2026-be-the-hottest-year-on-record-trade-on-polymarket-now)
- **Precedent `[C0928]`:** after the April 2026 Paris-CDG sensor tampering, Polymarket moved Paris to Le Bourget and left resolved markets final — [CNN](https://www.cnn.com/2026/04/23/europe/france-weather-sensor-polymarket-bet-intl-latam)

**People (public titles)**
- Shayne Coplan — founder and CEO; Warren Jenson — first CFO (named 2026-09-10) `[C0928]` — [CoinDesk](https://www.coindesk.com/markets/2026/09/10/polymarket-names-former-amazon-finance-chief-warren-jenson-as-its-first-cfo)
- Travis VanderZanden — chief growth officer. Megan McGrath — CCO of the US exchange. Paul Jordan — CRO, Polymarket US. Natalie Oblazny — head of regulatory affairs. **Shana Bautista — global head of investigations and intelligence**, the integrity function most relevant to tampering `[C0928]` — [CNBC, 2026-08-11](https://www.cnbc.com/2026/08/11/polymarket-revamps-marketing-expands-us-hiring-ahead-of-fall-events.html)
- **Mike Eidlin** — leads the Japan expansion (Polymarket aims for Japanese authorization by 2030) `[C0928]` — [CoinDesk, 2026-05-22](https://www.coindesk.com/policy/2026/05/22/polymarket-aims-for-prediction-market-approval-in-japan-by-2030)
- **Rajath Alex** — head of protocol (V2 owner) `[SS]` — sources in §2
- `[INT]` records:
  - Lisa Mantil — Head of Institutional Growth (2026-09, New York).
  - **Malea Otranto — Global Head of Trust and Safety (2026-08, New York; first holder of the role).**
  - Shirley Wong — Growth lead (2026-09, Dubai).
  - Nick Rice — Head of Markets (QCX). This comes from a contact line on a Polymarket US CFTC product filing, so it is the US side.

  Source: [INT: depin/intel/business-directions.md](../../depin/intel/business-directions.md)

**Channels**
- Builders Program and partners page: [builders.polymarket.com](https://builders.polymarket.com/); [partners](https://builders.polymarket.com/partners); builder tiers [docs](https://docs.polymarket.com/builders/tiers); [@PolymarketBuild on X](https://x.com/PolymarketBuild/status/1984636606330880192) `[C0928]`
- Geographic restrictions page: [help.polymarket.com](https://help.polymarket.com/en/articles/13364163-geographic-restrictions) `[C0928]`
- Polymarket US: the contact page publishes generic addresses, including an "Institutional" desk. The team's internal record has this; the address is not copied here — [INT: depin/intel/business-directions.md](../../depin/intel/business-directions.md)

### Inferences
- **Who to approach for "resolution source" talks.** In descending relevance:
  1. The incoming Head of Markets, once hired.
  2. Protocol (Rajath Alex), on V2 reporter modules.
  3. Investigations and intelligence or Trust & Safety, on tamper detection.

  ICE and institutional growth are on the data-out side, not the settlement-in side.
- The V2 "EOA reporter" suggests Polymarket can let a designated key report outcomes for some markets. A vendor that signs city-level verdicts (met / not met / withheld) with public fingerprints fits that shape technically. This is inference from coverage, and the Korea constraint still applies.
- The Seoul aggregator now says "NOAA at Incheon". If true, Polymarket is moving Asian cities toward government or official feeds as well. Either way, it still uses **one station** per city, so a multi-feed consensus is a verification layer, not a like-for-like replacement.

### Gaps
- Not found:
  - Polymarket's own careers page;
  - whether the Head of Markets role is filled;
  - the role's location;
  - who runs the weather category day-to-day;
  - any weather-specific X account or team.
- Not found: the current UMA bond and reward on Polymarket, or whether weather markets use the whitelist.
- Not found: Polymarket's current legal entity and HQ address. "Blockratize Inc., New York" is unverified background.
- UMA (Risk Labs) people and location were not found.

---

## 4. Hyperliquid HIP-4 and every known deployer (Outcome.xyz, Skew/Hyperion DeFi)

### Takeaway
HIP-4 went permissionless on mainnet on 2026-08-29. Deployers stake 500k HYPE, slashable for poorly defined markets, wrong settlement or failure to settle within a week, and can only instantiate **validator-approved templates**: seven so far, price and rates. **No weather template exists.** Two deployers are known: Outcome.xyz (anonymous, bootstrapped) and Skew (stake from Nasdaq-listed Hyperion DeFi).

### Cited Findings
- **Stake and slashing.**
  - Stake: **500,000 HYPE** (~$30M at the July 2026 price).
  - Slashable by validator vote for "poorly defined" markets, incorrect settlement, or failure to settle within one week.
  - Locked for six months; all markets must be settled before unstaking.
  - Initial allocation: 100 outcomes (200 tokens).
  - Deployers may set fees of up to 50%.
  - The announcement went out on Hyperliquid's Telegram channel, with details "preliminary".
  - **`[conflict]`:** QuickNode cites 1M HYPE; most sources say 500k.

  `[SS]` — [The Defiant](https://thedefiant.io/news/defi/hyperliquid-to-open-hip-4-prediction-markets-behind-500-000-hype-stake); [The Block, 2026-07-20](https://www.theblock.co/post/408875/hyperliquid-hip-4-permissionless-deployment); [QuickNode](https://www.quicknode.com/blog/hyperliquid-hip-4-permissionless-deployment)
- **Templates.**
  - Approval path: community feedback → validator review → on-chain vote → written to mainnet.
  - Templates must cover outcomes with "sufficient liquidity and public interest" and be "clearly defined and unambiguous".
  - Testnet carried 16 template records across 7 structures: TWAP expiry prices, price-triggered markets and sports outcomes. An undated ChainCatcher report said mainnet templates were still empty; later sources say seven are approved.

  `[SS]` — [QuickNode](https://www.quicknode.com/blog/hyperliquid-hip-4-permissionless-deployment); [ChainCatcher](https://www.chaincatcher.com/en/article/2283699); [hyperliquidguide](https://hyperliquidguide.com/ecosystem/hip-4-permissionless-deployment)
- **Settlement.** "An authorized oracle then posts the result, and oracle outputs can be disputed during an optional challenge window." Prices stay within 0.001–0.999 until resolution `[SS]` — [QuickNode blog](https://blog.quicknode.com/hip4-hyperliquid-outcome-contracts)
- **No weather.** No weather or temperature HIP-4 market was found. The nearest are validator-vote macro markets (CPI, Fed funds, jobs) `[SS][3rd-party]` — [pm.wiki](https://pm.wiki/ja/projects/hyperliquid); [FinFeedAPI](https://www.finfeedapi.com/exchange/hyperliquid)
- **Outcome.xyz.**
  - First permissionless deployer, 2026-08-29 ([KuCoin/Odaily](https://www.kucoin.com/news/flash/hyperliquid-hip-4-deployment-begins-outcome-becomes-first-builder); [Datawallet](https://www.datawallet.com/crypto/hip-4-explained-hyperliquid-upgrade)).
  - pm.wiki: "founder / team identity not public", "bootstrapped — no VC funding", self-staked HYPE, "~75% of all HIP-4 builder volume" ([pm.wiki](https://pm.wiki/uk/projects/outcomexyz)).
  - **`[conflict]`:** one profile dates Outcome's launch to May 2, the HIP-4 launch date.

  `[SS][3rd-party]`
- **Skew / Hyperion DeFi.**
  - Bankless: Skew is the **second live HIP-4 deployer**. Its 500k-HYPE stake came from Hyperion DeFi, with fees split between them; its first market was BTC hourly Up/Down ([Bankless](https://www.bankless.com/read/hyperliquid-s-hip-4-era)).
  - Other coverage describes the Hyperion–Skew "HAUS" agreement (effective 2026-07-15) as **HIP-3 perps first**, with HIP-4 later. The revenue share has "fixed and scaling components" ([CoinTurk](https://en.coin-turk.com/hyperion-lends-33-6-million-in-hype-to-skew-for-new-hyperliquid-futures-markets/); [Crypto Briefing](https://cryptobriefing.com/hyperion-deploys-hype-skew-perps-markets/)).

  `[SS]` `[conflict]`
- **Fee projection.** An analyst base case at a 3.5bp take rate projects $48M in annualized fees. This is a projection, not a reported figure `[SS]` — [Alea Research](https://www.alearesearch.io/reports/theses/hyperliquid-2)
- **Oracle vendors.** Pyth published "HIP-4 and the Permissionless Era of Outcome Markets"; its content was not verified `[SS]` — [Pyth blog](https://www.pyth.network/blog/hip-4-and-the-permissionless-era-of-outcome-markets)
- **Activity.** 30-day notional $45.99M with 4,828 traders (date n/a) `[C0928]` — [Loris Tools](https://loris.tools/hip4). Bankless also has a piece on HIP-4's "midterm opportunity" (US elections; date n/a) `[SS]` — [Bankless](https://www.bankless.com/read/hip-4-midterm-opp-nl)

### Inferences
- A HIP-4 weather market needs two things before any deployer can list it:
  1. **A weather template that passes a validator vote**, specifying station or consensus, cut-off and rounding.
  2. **A deployer willing to put a slashable stake behind the data source.**

  A vendor's realistic role is to co-author the template spec with a deployer, then be the named settlement source. The "withheld" verdict maps onto the "failure to settle" risk the deployer must manage.
- Skew/Hyperion is the more diligence-friendly counterparty: a listed company with investor relations and audited disclosures. Outcome is the volume leader but anonymous.

### Gaps
- Not found:
  - the names and X handles of Outcome and Skew principals;
  - Hyperion DeFi executives and HQ;
  - any third deployer after September;
  - Hyperliquid's own geoblocking, and whether it covers Korea;
  - the official template list and IDs.

---

## 5. BNB Chain cluster: Opinion, Predict.fun (+Probable), Myriad

### Takeaway
No new September–October facts surfaced for this cluster; its searches were among those cut off by the budget. What stands is the 09-28 picture plus internal contact records:
- **Opinion:** Hong Kong; CEO Forrest Liu; Opinion AI evidence oracle.
- **Predict.fun:** pseudonymous founder "Dingaling"; in Binance Wallet; Asia focus.
- **Myriad:** DASTAN; USD1 on BNB; Trust Wallet distribution.

None lists weather markets.

### Cited Findings
- **Opinion.**
  - $20M pre-Series A led by Hack VC and Jump Crypto (with Primitive Ventures and Decasonic). About 35% of new capital is earmarked for "regulatory compliance and licensing across target regions".
  - The company claims about a third of global prediction-market volume and >$130M in open interest; these are company figures.
  - It plans to "strengthen its presence across the Asia-Pacific market ahead of the 2026 FIFA World Cup".
  - **`[conflict]`:** one article dates the round to 2025-03-15 rather than 2026-02-04.

  `[SS]` — [Ventureburn](https://ventureburn.com/opinion-labs-raises-20m-for-onchain-prediction-expansion/); [MEXC News](https://www.mexc.com/news/635061); [f4.fund](https://f4.fund/startups/opinion)
- **Opinion OPN token.** The 09-28 notes give a TGE of 2026-03-05 ([Bitget Academy](https://www.bitget.com/amp/academy/what-is-opinion-opn-macro-prediction-market-how-it-works-price-prediction) `[C0928]`). This session's search could not confirm it happened.
- **Opinion leadership.**
  - Forrest Liu — CEO & co-founder, Hong Kong, Columbia `[INT]`.
  - **`[conflict]`** on prior employer: "KKR private equity" ([Bitget Academy](https://www.bitget.com/amp/academy/what-is-opinion-opn-macro-prediction-market-how-it-works-price-prediction) `[C0928]`) vs "CMB International Investment Banking Associate 2018–2022" (LinkedIn capture `[INT]`).
  - Asa L. — "Head of Marketing & Growth, Advisor to the CEO" (part-time) `[INT]`.

  Source: [INT: depin/intel/business-directions.md](../../depin/intel/business-directions.md)
- **Hong Kong context.** In April 2026 the IFEC (an SFC subsidiary) warned that prediction-market trading "may constitute illegal gambling", describing wagering on "even weather-related changes" `[C0928]` — [The Standard](https://www.thestandard.com.hk/finance/article/329624/Trading-on-prediction-markets-may-be-illegal-in-Hong-Kong-SFC-says); [focusgn](https://focusgn.com/asia-pacific/hong-kong-warns-that-using-prediction-markets-could-count-as-illegal-gambling)
- **Predict.fun.**
  - CZ publicized it on 2025-12-04. It is built by former Binance staff, YZi-backed, and pays yield on collateral in open positions, which it routes to lending markets such as Venus `[SS]` — [Yahoo Finance](https://finance.yahoo.com/news/cz-teases-bnb-based-prediction-133355253.html); [Tangem](https://tangem.com/en/news/investments/16870-predict-fun-acquires-probable-expands-bnb-chain-presence/)
  - Acquired Probable on 2026-03-04 (Probable used UMA OO); YZi Labs and Susquehanna Crypto follow-on; $1.8B cumulative volume and 130k users; "Asian markets" focus `[C0928]` — [Crypto Times](https://www.cryptotimes.io/2026/03/04/predict-fun-acquires-probable-to-strengthen-bnb-chain-prediction-markets/); [Predict.fun news](https://predict.fun/news/predict-fun-announces-strategic-funding-round-with-yzi-labs-and-susquehanna-crypto); [crypto.news](https://crypto.news/yzi-labs-doubles-down-on-predict-fun-after-1-8b-volume-surge/)
  - In Binance Wallet since 2026-04-09; Binance Wallet Prediction Markets API since 2026-06-08 `[C0928]` — [CoinDesk](https://www.coindesk.com/markets/2026/04/09/binance-enters-prediction-markets-arena-via-predict-fun-integration); [Prediction News](https://predictionnews.com/story/binance-app-introduces-prediction-markets-for-eligible-users-224e6251)
  - Channels: an official X account and a published generic inquiry address; the team already sent a company-inbox note (9/28) `[INT]` — [INT: depin/intel/business-directions.md](../../depin/intel/business-directions.md)
- **Myriad.**
  - Built by DASTAN (Decrypt Media + Rug Radio). Chains: Abstract → Linea → BNB Chain. Settles in USD1.
  - Seed in March 2026 (MoonPay Ventures, Walrus, Tom Lee).
  - Powers Trust Wallet "Predictions" (2025-12-02).

  `[C0928]` — [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/prediction-market-myriad-closes-milestone-162400075.html); [BeInCrypto](https://beincrypto.com/trust-wallet-predictions-launch/)

  This session's Myriad search returned only unrelated results.

### Inferences
- Opinion's evidence-driven AI oracle is the most natural "named data source" slot in this cluster. Its stated compliance spending suggests sensitivity to the kind of regulatory profile a Korean-listed partner would bring. Both Hong Kong's weather-naming warning and Korea's KCSC logic apply.
- Predict.fun's Binance Wallet distribution means any weather market listed there would reach Asian retail at scale. That is the core Korea-risk scenario.

### Gaps
- Not found: Opinion, Predict.fun and Myriad news for 09-20 → 10-11; Asia or partnership leads; Myriad leadership; any geoblock lists; whether any of the three lists weather.
- Unverified background lead, **not sourced:** Myriad may run on Polkamarkets' protocol. Check this before using it.

---

## 6. Solana: Kalshi-on-Solana builders (DFlow, Jupiter, Phantom) and Drift BET

### Takeaway
On Solana, prediction access is mostly **distribution of other venues' markets**:
- DFlow tokenizes Kalshi, and Phantom carries >98% of DFlow's early volume.
- Jupiter's Prediction tab front-ends Polymarket and, per one directory, Kalshi.

Settlement stays with Kalshi or Polymarket, so these are not settlement entry points. Drift's BET effectively disappeared from view after the April 2026 exploit and the July rebrand to a perps-only Velocity DEX.

### Cited Findings
- **DFlow.**
  - DFlow launched a Kalshi-powered Prediction Markets API at Breakpoint 2025.
  - Jupiter + DFlow cumulative volume passed $28.6M by early January 2026, of which DFlow >$22.4M, and >98% of DFlow volume came via Phantom.

  `[SS]` — [StepData](https://stepdata.substack.com/p/prediction-markets-on-solana-286m)

  Earlier coverage: DFlow "mirrors" Kalshi pricing and redemption; Kalshi offers $2M builder grants `[C0928]` — [Solana.com](https://solana.com/news/dflow-prediction-markets-api); [CMC Academy](https://coinmarketcap.com/academy/article/kalshi-tokenizes-prediction-markets-using-solana-blockchain); [DFlow blog](https://dflow.net/blog/prediction-markets-api)
- Kalshi tokenized "thousands" of markets on Solana `[SS]` — [The Block](https://www.theblock.co/post/380983/kalshi-tokenizes-thousands-of-its-prediction-markets-using-solana)
- **Jupiter.** Prediction tab trading Polymarket contracts since 2026-02-01 ([The Block](https://www.theblock.co/post/387945/jupiter-polymarket-solana); [Forklog](https://forklog.com/en/jupiter-integrates-polymarket-joins-prediction-market-race/)). One directory (updated June 2026) also lists Jupiter as Kalshi's first Solana partner ([thegrid.id](https://thegrid.id/discovery/productType/prediction-markets)). That is a single source. `[SS]`
- **January 2026 volume figure (Dune):** prediction-market volume "exceeded $12 billion", with Kalshi $9.16B and Polymarket $7.66B. **`[conflict]`: the parts sum to more than the total**, so do not use this `[SS]` — [Forklog](https://forklog.com/en/jupiter-integrates-polymarket-joins-prediction-market-race/)
- **Drift.** Details in §2. The 2024 BET launch was described as "only accessible in countries where the Drift protocol was live" `[stale >12m]` — [The Block](https://www.theblock.co/post/311888/solana-based-drift-protocol-launches-prediction-market)

### Inferences
- For a weather vendor, the Solana layer is a **trader-data channel** (forecast and observation feeds for people trading tokenized weather contracts), not a settlement channel.
- Drift/Velocity should be dropped from the contact list. North Korea-linked attribution is also a reputational reason for a Korean company to keep distance.

### Gaps
- Not found: DFlow, Jupiter and Phantom prediction-product leads, names, HQ and geoblocks; confirmation that Kalshi weather contracts are tokenized; BET's formal status.

---

## 7. Sports, legacy and dispute layers: Azuro, SX Bet, Augur Lituus, Gnosis/Presagio/Omen/Seer, Truth Predict

### Takeaway
None of these lists weather. Azuro has a formal "data provider" role that supplies outcomes, the closest structural match to a settlement vendor, but it is sports-first. Augur, under Lituus, recast itself in 2026 as a "cross-chain truth layer" that other protocols pay to use. That makes it a potential partner or competitor for verdict-as-a-service. Truth Predict has no on-chain component.

### Cited Findings
- **Azuro.**
  - Runs on Polygon, Gnosis Chain, Base and Chiliz, with USDC settlement. Market creation is permissionless.
  - **"Data providers set the odds and supply event outcomes"**; AzuroDAO (staked AZUR) is the arbiter of last resort.
  - $530M+ cumulative volume (June 2026 page). Sports markets, with politics "planned".
  - One profile says its code is "not publicly auditable"; that claim is unverified.

  `[SS][3rd-party]` — [pm.wiki Azuro](https://pm.wiki/uk/projects/azuro); [pm.wiki Azuro vs Polymarket](https://pm.wiki/uk/compare/azuro-vs-polymarket)

  Funding: $18.5M over 4 rounds, including $11M in April 2024 `[C0928][stale >12m]` — [Tracxn](https://tracxn.com/d/companies/azuro/__ApKl6xZ3DMxbYBRcSya396VnbVyE6ieqZM7e1R7al4Q)
- **SX Bet.** Third-party page (April 2026): "$200M+ cumulative volume & Sovereign SX Network rollup" ([pm.wiki](https://pm.wiki/fr/compare/betstack-vs-sx-bet) `[SS]`). **`[conflict]`** with the 09-28 notes ($780M lifetime; migration to a gasless chain; SX token sunset with a 2026-05-15 snapshot) — [SX Help Center](https://help.sx.bet/en/articles/4037276-introduction-and-overview); [CMC SX](https://coinmarketcap.com/currencies/sportx/) `[C0928]`
- **Augur (Lituus).**
  - Moon Fork and REP migration: see §2.
  - "Augur [has been] rebranded into a cross-chain truth layer under Lituus, aimed at other protocols that pay to use its oracle rather than retail bettors." This comes from promotional or exchange content `[SS]` — [LBank](https://www.lbank.com/explore/augur-rep-algorithmic-fork)
  - In development with ChainSafe; Lituus handles the token and the oracle, and Dark Florist builds the prediction-market implementation `[C0928]` — [crypto.news](https://crypto.news/augur-returns-decentralized-layer-prediction-markets/); [Augur whitepaper post](https://www.augur.net/blog/the-augur-lituus-whitepaper/)
- **Gnosis / Presagio / Omen / Seer.** Presagio ("Omen 2.0") was revived under GIP-113 with SwaprHQ code; markets resolve through the Reality.eth oracle with Kleros arbitration; Kleros describes a newer design, "Seer". This is `[C0928]` only, not refreshed — [SwaprHQ/presagio](https://github.com/SwaprHQ/presagio); [Kleros: A Good Omen](https://blog.kleros.io/a-good-omen-kleros-x-gnosis-x-dxdao-align-with-conditional/); [Kleros: Seer](https://blog.kleros.io/seer-crafting-smarter-prediction-markets-for-a-complex-world/)
- **Truth Predict / OG.com** `[C0928]`:
  - Truth Predict (TMTG) became a marketing tie-up pointing users to OG.com; building it directly into Truth Social was dropped (August 2026 coverage) — [Bitcoin.com](https://news.bitcoin.com/igaming/trump-media-drops-truth-predict-buildout-chooses-crypto-com-instead/)
  - OG.com is a CFTC venue (Crypto.com spin-out) valued at $5B, with Robinhood taking equity on 2026-09-08 — [Blockhead](https://www.blockhead.co/2026/09/09/robinhood-picks-og-com-to-run-its-prediction-markets-taking-equity-tied-to-citadels-20-billion-crypto-com-valuation/)
  - No on-chain part was found.

### Inferences
- Azuro's data-provider seat is the only explicit "outcome supplier" role in an on-chain protocol found in this sweep. A weather vertical there would need a new market type and liquidity. It is low priority, but a useful proof that oracle-as-vendor models exist.
- If Lituus really sells "truth" to other protocols, it competes for the same budget line as a verdict vendor. It could also partner, using a weather verdict as an input to its dispute game. That is worth one exploratory touch.

### Gaps
- Not found:
  - 2026 news, people and HQ for Azuro, SX Bet, Lituus and Gnosis/Seer;
  - the Lituus Foundation's leadership;
  - whether Seer or Presagio lists any weather markets.

---

## 8. Limitless (Base): material changes only

### Takeaway
I found **no material external change** for Limitless between 2026-09-20 and 10-11, but coverage was thin. One data point matters for the existing talks: per Bernstein (via The Block), Limitless's users are about **60% Asia-Pacific**. That reinforces the "no Korean users / no Korean cities" conditions already in the team's plan.

### Cited Findings
- CEO **CJ Hetherington** told Bernstein analysts that no platform will take more than 90% of the market.
  - Limitless "clears close to $2 billion in monthly volume" per Bernstein.
  - Users are ~60% Asia-Pacific and ~30% Europe.
  - It "has not yet launched for U.S. customers, pending regulatory approval".
  - The article date is not shown; the summary guessed "early 2026" from the image path. My own inference from The Block's post-ID sequence is roughly mid-2026.

  `[SS]` — [The Block](https://www.theblock.co/post/405086/limitless-ceo-no-prediction-market-platform-will-dominate-perpetual-futures-precedent)
- Earlier funding: a $10M seed led by 1confirmation (Collider, F-Prime, DCG, Coinbase Ventures, Node, Arrington), around October 2025 `[possibly stale >12m]` — [Decrypt](https://decrypt.co/344982/limitless-prediction-market-closes-10m-seed-round-ahead-of-lmts-token-launch); [The Block](https://www.theblock.co/post/375318/limitless-prediction-market-closes-10m-seed-round-ahead-of-lmts-token-launch)
- **Internal status `[INT]`:**
  - Limitless Markets US DCM application, deemed "substantially complete" on 5/1.
  - Contacts: Daria Han (Head of Growth Korea & Japan) → Henrich Tauber (Head of BD) and Clyde Carver (DevRel).
  - Proposed in-person meeting in New York around 10/27–29.

  Source: [INT: depin/intel/business-directions.md](../../depin/intel/business-directions.md); [INT: depin/reports/work-log.md](../../depin/reports/work-log.md)

### Inferences
- The 60% APAC user base means Limitless's offshore venue is, on Korea exposure, closer to Polymarket than to a US DCM. The US-entity lane (Limitless Markets US) remains the cleaner contracting counterparty.

### Gaps
- Not found: CFTC DCM approval status for Limitless Markets US as of October 2026; any Limitless weather listings; any Limitless geoblock list.

---

## 9. New 2026 entrants and non-money forecasting platforms (Manifold, Metaculus)

### Takeaway
**Not researched.** The shared search budget ran out before any of the candidate names could be checked. The only new 2026 on-chain launches surfaced indirectly are Polymarket front-ends (Byreal Predict and several wallets) and the HIP-4 deployers above.

### Cited Findings
- **Byreal Predict.** Launched 2026-06-09 by the Bybit-incubated DEX Byreal, on Polymarket liquidity; sports first, financial and macro events later `[C0928]` — [PR Newswire](https://www.prnewswire.com/news-releases/byreal-launches-byreal-predict-an-onchain-prediction-market-302795232.html)
- **Other Polymarket front-ends in Asia:** KuCoin Web3 Wallet (2026-06-08), Bitget Wallet and Bybit Prediction `[C0928]` — [The Cryptonomist](https://en.cryptonomist.ch/2026/06/08/kucoin-web3-wallet-polymarket-integration/); [The Paypers](https://thepaypers.com/crypto-web3-and-cbdc/news/bitget-wallet-integrates-polymarket-to-bring-prediction-market-trading-to-its-users); [Bybit Help Center](https://www.bybit.com/en/help-center/article/Introduction-to-Bybit-Prediction)
- A multilingual third-party directory, pm.wiki, catalogs prediction-market projects, jobs and comparisons (e.g., "Polyseason", "Predikt.gg", Outcome.xyz, DFlow, Azuro). It can serve as a discovery list `[3rd-party]` — [pm.wiki Polyseason](https://pm.wiki/fr/projects/polyseason); [pm.wiki Azuro vs Predikt.gg](https://pm.wiki/zh/compare/azuro-vs-predikt-gg)

### Inferences
- Each Polymarket front-end inherits Polymarket's weather book, including Seoul markets, and its Korea sensitivity. None is a settlement buyer.

### Gaps
- **Not checked at all:**
  - **Candidate entrants:** XO Market, Melee, Kash, Precog, Sapience, Truemarkets, PredX, Noise, Triad, Football.fun, Polkamarkets, Hedgehog (beyond 09-28), Futuur and Zeitgeist (beyond 09-28).
  - **Non-money forecasting platforms:** Manifold and Metaculus weather questions.
  - **For each entrant:** chain, funding, launch date, people and any weather markets.
- Recommendation for a follow-up session: one search per name, plus "weather"/"temperature" with each name. Also search for "prediction market seed round 2026" and "on-chain weather market 2026".

---

## 10. Korea access and sensitivity, venue by venue

### Takeaway
**Only Polymarket is formally blocked in Korea.** The KCSC blocked it on 2026-08-18 under the Criminal Act gambling provisions and the National Sports Promotion Act. It named weather and Korea-specific markets and rejected the non-custodial defence.

No follow-on action against other venues was found, but **the regulator's logic covers any operator that lists markets, sets rules and settles crypto for fees.** On that reading, Opinion, Predict.fun, Myriad, Limitless's offshore venue and HIP-4 deployers all carry the same theoretical exposure. Polymarket still lists Seoul markets.

### Cited Findings
- **The decision.**
  - Body: the KCSC's Telecommunications Review Subcommittee.
  - Finding: Polymarket is information that "aids gambling under the Criminal Act or is aimed at opening a gambling venue". It criticized the "winner-takes-all" model and markets "specific to South Korea".
  - Defence rejected: the claim to be a non-custodial P2P platform that holds no user funds. The regulator said decentralized features "do not exempt it from South Korean laws".
  - A parallel police probe targets local users who bet on regional elections.
  - **`[conflict]`** on timeline: a formal review opened in May 2026, vs. Polymarket being given a chance to respond in early July.

  `[SS]` — [SBC News, 2026-08-18](https://sbcnews.co.uk/sportsbook/2026/08/18/polymarket-blocked-in-south-korea/); [Forklog](https://forklog.com/en/south-korean-regulator-blocks-access-to-polymarket/); [Sigma](https://sigma.world/news/polymarket-blocked-south-korea-formal-review/); [Crypto Briefing](https://cryptobriefing.com/south-korea-blocks-polymarket-illegal-gambling/); [Dailycoin](https://dailycoin.com/polymarket-is-now-illegal-in-south-korea/); [Nocut News](https://en.nocutnews.co.kr/news/6564227)
- **Korean-language coverage.**
  - The decision text lists event types "politics, economy, international relations, sports, elections, **weather**".
  - It faults the operator for managing market opening and trading rules, directly running crypto deposit, withdrawal and settlement, and taking fees.
  - Before the block, Polymarket was reachable without restriction and **offered Korean-language service** (May 2026).
  - **Kalshi already restricts Korean users.**

  `[SS]` — [Wikitree](https://www.wikitree.co.kr/articles/1153222); [Hankyung, 2026-05-21](https://www.hankyung.com/article/2026052121506); [Daum](https://v.daum.net/v/qGHcgsqFZo); [Blockmedia](https://www.blockmedia.co.kr/archives/1130311); [TokenPost](https://www.tokenpost.kr/news/blockchain/379125); [Segye, 2026-07-18](https://segye.com/newsView/20260718508697)
- The block is at ISP level, with HTTP 451 from 2026-08-20; Korea is not on Polymarket's own geoblock list `[C0928]` — [CoinDesk, 2026-08-18](https://www.coindesk.com/business/2026/08/18/south-korea-joins-more-than-30-jurisdictions-restricting-polymarket-access); [SCCG](https://sccgmanagement.com/sccg-articles/2026/08/20/south-korea-enforces-access-block-on-polymarket-after-review-finds-violations-of-criminal-act-and-sports-promotion-law/)
- Seoul (Incheon) daily markets continued to be listed in October 2026 (§2) `[SS]`
- **Comparator jurisdictions** `[SS]`: Spain suspended Polymarket and Kalshi in May 2026, and Singapore blocked Polymarket (Korean coverage) — [Daum](https://v.daum.net/v/qGHcgsqFZo). Hong Kong's IFEC warning names weather (§5) `[C0928]`.

**Venue-by-venue Korea exposure (synthesis)**

| Venue | Formal KR action | KR-facing signals | Exposure for a Korean vendor supplying settlement data |
|---|---|---|---|
| Polymarket | Blocked 2026-08-18 | Seoul markets ongoing; Korean UI pre-block | **Highest** |
| Limitless (offshore) | None found | ~60% APAC users; Korea & Japan growth head `[INT]` | High |
| Opinion | None found | HK-based; HK warning names weather | High |
| Predict.fun | None found | Asia focus; Binance Wallet | High |
| Myriad | None found | Trust Wallet distribution | High (low weather fit) |
| HIP-4 deployers | None found | Permissionless, no KYC known | High (deployer = oracle) |
| DFlow / Jupiter | None found | Kalshi restricts KR users; tokenized enforcement unknown | Medium |
| Azuro / SX Bet | None found | Sports betting (Sports Promotion Act) | High, but no weather |
| Augur Lituus / Reality.eth / Kleros / UMA | None found | No retail venue (UMA serves Polymarket) | Lower if limited to non-Korean-city evidence |
| Truth Predict / OG.com | n/a (US-only) | — | Low (US-regulated lane) |

### Inferences
- The KCSC's test (operator sets rules, settles crypto and takes fees, on events like weather) does not depend on the chain. **Any offshore on-chain venue that lists Korean-city weather and is reachable from Korea is exposed in the same way.** A Korean data vendor feeding such markets could be argued to be facilitating. This is inference, not legal advice; it is the same gating as the 09-28 report.
- Practical guardrails for any on-chain deal:
  - non-Korean cities only;
  - a contractual exclusion of Korean residents and of Korean-city markets;
  - no Korean-language marketing;
  - counsel sign-off.

### Gaps
- Not found: the official geoblock lists (terms of service) for Opinion, Predict.fun, Myriad, Limitless, Hyperliquid front-ends, DFlow and Jupiter.
- Not found: any KCSC agenda item on prediction markets after August 2026.
- Not found: whether Polymarket added Korea to its own geoblock list after the block.

---

## 11. HQ and New York presence (team in New York Oct 24–29, 2026)

### Takeaway
The only on-chain or offshore counterparts with sourced or recorded New York presence are **Polymarket**, where several executives are NY-based per internal records and the HQ is believed to be New York but not verified, and **Limitless Markets US**, whose group CEO is NY-based per internal records. Most other venues are Hong Kong-based (Opinion), anonymous (Outcome, Predict.fun) or not sourced.

### Cited Findings
- **Polymarket.**
  - New York HQ: unverified background (operator "Blockratize Inc., New York") — [09-28 notes, Gaps](../예측마켓%20플랫폼과%20모회사/international_landscape.md)
  - Head of Institutional Growth Lisa Mantil and Global Head of Trust and Safety Malea Otranto are listed in New York `[INT]` — [INT: depin/intel/business-directions.md](../../depin/intel/business-directions.md)
  - The Head of Markets posting is "onsite" (location not given) `[SS]` — [pm.wiki](https://pm.wiki/jobs/polymarket-head-of-markets)
- **Limitless Markets US.** Group CEO CJ Hetherington is New York-based (2026-02~). The team proposed an in-person meeting around Swell (10/27–29) `[INT]` — [INT: depin/intel/business-directions.md](../../depin/intel/business-directions.md)
- **Opinion Labs:** Hong Kong `[C0928]` — [Messari](https://messari.io/project/opinion-labs/profile)
- **Azuro:** Tracxn says "Tucson, US", which looks doubtful `[C0928]` — [Tracxn](https://tracxn.com/d/companies/azuro/__ApKl6xZ3DMxbYBRcSya396VnbVyE6ieqZM7e1R7al4Q)
- **Hyperion DeFi** (Skew's HYPE staker) is Nasdaq-listed (HYPD); HQ was not sourced `[SS]` — [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/hyperion-defi-hypd-q1-2026-182118824.html)

### Inferences
- New York priority for Oct 24–29, on-chain and offshore lane only:
  1. **Polymarket.** Topics: V2 reporter modules and integrity, non-Korean cities. Contact through the existing Polymarket US and institutional threads (`[INT]` caps on contacts per company apply).
  2. **Limitless Markets US** (already scheduled).
  3. Possibly **Hyperion DeFi**, if it has a New York office, as a route to Skew's HIP-4 roadmap. That is unverified.
- The other targets (Opinion, Predict.fun, HIP-4 deployers, Lituus) are remote or online only.

### Gaps
- Not found:
  - prediction-market or crypto events in New York on Oct 24–29, 2026, other than Swell;
  - HQ for Predict.fun, Myriad/DASTAN, Hyperliquid, DFlow, Jupiter, Augur Lituus, UMA/Risk Labs and SX Bet;
  - whether Polymarket's protocol team (Rajath Alex) is New York-based.
