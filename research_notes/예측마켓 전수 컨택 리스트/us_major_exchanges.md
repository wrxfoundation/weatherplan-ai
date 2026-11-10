# US CFTC-regulated prediction-market exchanges as contact targets for a weather-settlement data provider (update, as of 2026-10-11)

Research date: 2026-10-11. Scope: Kalshi, Polymarket US, ForecastEx, OG.com / CDNA, Rothera, Coinbase / The Clearing Company, CME (FanDuel Predicts), Cboe Predicts.

This file is a **delta** on the 2026-09-28 work (`reports/예측마켓 플랫폼과 모회사.md`; `research_notes/예측마켓 플랫폼과 모회사/us_regulated_exchanges.md` and `weather_contracts_settlement.md`). Baseline facts from that work are restated in one line at most, with the earlier source, and tagged **[carried from 09-28 notes]**. Our own outreach status (who was messaged, when) belongs to the parallel file `research_notes/예측마켓 전수 컨택 리스트/internal_status.md` and is only cross-referenced here.

**Method caveat (read first).**
- **Egress.** The egress gateway refused every primary page tried (HTTP 403 on CONNECT; WebFetch reported ENOTFOUND). This covered news.kalshi.com, docs.kalshi.com, www.cftc.gov and gizmodo.com. **No primary document was opened**, and nothing was retried or routed around.
- **Search budget.** The session-wide web-search budget (200 calls shared by all parallel agents) ran out after 25 searches in this thread. As a result, the following were **not refreshed**: CME, Cboe and Coinbase's own venue; ForecastEx news after Feb 2026; Kalshi funding; country-restriction lists; X handles and LinkedIn company pages; most HQ addresses.
- **Labels.**
  - Every web-derived fact is **[search summary, unverified]**: the search engine's summary of the linked page. Wording may not be verbatim. Where one summary drew on several pages, the most likely page is cited.
  - **[internal record]**: from this repo's own logs (`internal_status.md`, `depin/content/cryptocom-call-0911.md`). These are mostly LinkedIn-derived and not externally verified.
  - **[stale >12 mo]**: dated before 2025-10-11.
  - **[conflict]**: sources disagree.
- No personal email, phone number or personal LinkedIn URL is recorded. Company pages and generic official routes only.

---

## 0. Master contact table: all eight entities

### Takeaway
Two changes since 2026-09-20 matter most for a weather-settlement vendor:

1. **Kalshi has built its own multi-station "verification layer" for US metros.** The "Kalshi Weather Index" is a minute-resolution temperature index built from several member stations, each with its own quality-control result. Its filings reference an agreement with **Synoptic Data**, a second weather-data vendor besides The Weather Company (TWC). It was self-certified for about ten US metros between 2026-08-12 and 2026-10-01, and it settles new "hourly directional" temperature markets.
2. **Polymarket US (QCX LLC) self-certified a "Global Temperature Contract" on 2026-10-07**, to list no earlier than 2026-10-09. It settles on NOAA Aviation Weather Center / NCEI data, with Weather Underground as the secondary source. That is the single-station METAR design behind the Paris CDG case.

Other points:
- ForecastEx's announced non-US cities (Madrid, Paris, Vancouver, Montreal) are still unconfirmed.
- OG.com's leadership changed: Nick Lundgren left for Underdog, and Justin Wales became Crypto.com's CLO.
- No public exclusivity language exists for Kalshi–TWC, and Kalshi's use of Synoptic suggests TWC is not exclusive across all weather products.
- Only Kalshi and Polymarket have evidence of a New York base, which makes them the realistic in-person targets for 24–29 October.

### Cited Findings
All web-derived cells are **[search summary, unverified]**. Links and detail are in §1–§8.

| Entity | Segment | Owner / parent | Status & jurisdiction | Weather/climate markets (examples; settlement source) | Korea access / sensitivity | Public channels | People (Name — exact title — relevance — source, date) | HQ / NYC presence | Latest news (date) | Fit & risk notes |
|---|---|---|---|---|---|---|---|---|---|---|
| **Kalshi** | Independent pure-play DCM+DCO; largest weather book | Kalshi (private, VC-backed; $22B Series F 2026) [carried from 09-28 notes] | KalshiEX LLC (DCM) + Kalshi Klear LLC (DCO), CFTC. Sports litigation: 9th Cir. loss 09-16, 6th Cir. loss 09-25/26 [carried] | **Daily** high/low ladders, still live in Oct (e.g., KXHIGHCHI-26OCT04, KXLOWTLAX-26OCT05). TWC named as publisher at the NWS CLI station since 09-04 [carried]. **NEW:** "Kalshi Weather Index" — minute-resolution multi-station metro index with per-station QC; filings reference Synoptic Data. Used for hourly directional markets KXTEMPCHIHS (Chicago Metro) and KXTEMPLAXHS (Coastal LA), whose pages name **Synoptic Data**. Rain/snow on NWS; hurricanes on NHC [carried] | KR reportedly **not** on the restricted list (third-party guides, low confidence); not reviewed by Korea's regulator [carried]. Sensitivity: **medium** | institutional.kalshi.com/data; docs.kalshi.com (incl. "Get Weather Index" endpoint); kalshi.com/regulatory/filings; help.kalshi.com; news.kalshi.com | **Will Brackett** — Head of Partnerships — Kalshi-side voice of the TWC settlement deal — press, 2026-08-28. **Luana Lopes Lara** — Co-founder & COO (product, ops, strategic partnerships) [carried]. **Tarek Mansour** — Co-founder & CEO [carried]. Max Crowley — VP BD (aggregator-only) [carried]. Edward King — Trade Surveillance [internal record]. Weather-category owner and Weather Index filing signatory: **not found** | New York HQ [internal record; not externally re-sourced this session] → **NYC: likely** | 10-01: Weather Index self-certs (Kansas City listed after COB 10-01; Chicago Metro rulebook V2). Mid-Sep→Oct: hourly directional markets trading. 09-22: margin application (KR press) [carried] | Best fit and biggest book, but its in-house Synoptic index now covers the US-metro "consensus + QC" pitch. Wellbian's gap: **non-US metros** plus a **public, tamper-evident audit trail**. TWC exclusivity: none public |
| **Polymarket US** | US-regulated arm of Polymarket; FCM-intermediated | Polymarket (ICE ≈22–23% largest holder; $21B post-money 2026-08-31) [carried] | QCX LLC (DCM) + QC Clearing LLC (DCO), bought 2025-07 for $112M [stale >12 mo]. US exchange launched May 2026 [carried]. USD-funded, walled off from the international platform | **NEW:** Global Temperature Contract (GTC), self-certified 10-07, list ≥10-09. Template: "highest temperature in ⟨place⟩ during ⟨date⟩ ≥ X". Primary source NOAA NWS Aviation Weather Center + NOAA NCEI; secondary Weather Underground. Also GTCD swap-class certification. Earlier: Temperature Rank Contract (TRC), filed 06-22 | US-only design (USD, CFTC) → Korean residents excluded. But polymarket.com was **blocked in KR on 2026-08-18** [carried] → brand sensitivity **high** | docs.polymarket.us (FCM partners) [carried]; Polymarket US "Institutional" official mail route [internal record]; careers (VP Product, New York) | **Nick Rice** — Head of Markets (QCX) — signed TRC self-cert — owns listings and settlement-source choice — CFTC filing, 2026-06-22. **Dan Lee** — head of U.S. operations — AP, 2026-07-08 [conflict: internal record has "Edward Lee — Head of Product, Exchange", NYC]. **Paul Jordan** — CRO; **Megan McGrath** — CCO; **Natalie Oblazny** — regulatory affairs — CNBC 2026-08-11 [carried]. **Lisa Mantil** — Head of Institutional Growth — CNBC 2025-09-29 [stale >12 mo]. **Neal Kumar** — CLO — Bloomberg Law 2025-04 [stale >12 mo] | NYC: **yes** (VP Product role "based in New York"; internal record places Mantil, Kumar, Edward Lee and the Trust & Safety head in NYC) | 10-07: GTC/GTCD self-certs (list ≥10-09). 09-10: first CFO, Warren Jenson [carried] | The GTC is single-station and METAR-based, so a CDG-type exposure; a verification layer fits. **Nick Rice is the owner.** Route only through the US exchange and non-Korean cities. Internal record: outreach already over cap |
| **ForecastEx** | Broker-owned DCM+DCO | Interactive Brokers (100%) [carried] | ForecastEx LLC, DCM+DCO since 2024 [stale >12 mo]. Distributed via IBKR ForecastTrader and also Robinhood (disclosure "through either KalshiEX LLC or ForecastEX, LLC") | Daily high temp, about 20 US cities, settled on airport ASOS METAR; NOAA monthly US and global-anomaly contracts [carried]. Non-US cities announced 2026-02-12 as "soon"; **launch not confirmed** by 10-11 | IBKR non-US eligibility for ForecastEx contracts **not established**. Sensitivity: low–medium | data.forecastex.com/regulatory (rulebook, T&Cs); forecastex.com/about; IBKR Campus weather/climate series; interactivebrokers.com/predictionmarkets [carried] | **Robert Prior** — CEO — named in Rulebook v.2026-09-01 [carried]. **Graham Deese** — Chief Regulatory Officer — LinkedIn headline [carried]. No new names found | Chicago (209 S LaSalle) per filings to Jan 2026; Fort Lauderdale per an Apr 2026 filing [carried, conflict]. NYC: **not established** | Nothing found in window | Clearest **international-expansion** opening. T&C-driven, slow onboarding. Robinhood retail flow magnifies its temperature book |
| **OG.com / CDNA** | Crypto-exchange spin-off DCM+DCO "engine" (B2B for Robinhood, FanDuel, etc.) | OG.com, spun out of Crypto.com ($5B); Robinhood and Citadel Securities equity [carried] | North American Derivatives Exchange, Inc. (ex-Nadex), d/b/a Crypto.com \| Derivatives North America; "OG.com Markets" [internal record]. OG app launched 2026-02-03; not available in NY or AZ | Thin: e.g., "hottest year on record"; settlement source not captured [carried] | US-only product [carried]. Sensitivity: low | og.com/company-news; help.crypto.com (Prediction Trading); crypto.com/us/prediction/learn [carried] | **Kris Marszalek** — founder & CEO of Crypto.com and OG.com — OG.com news 2026-09 [carried]. **Travis McGhee** — Global Head of Predictions, Crypto.com [carried; date not captured]. **Stephen Humenik** — Global Head of Derivatives Legal, Crypto.com (2022) [stale >12 mo]; "OG.com CLO, OG.com Markets board chair" [internal record only]. **Justin Wales** — Crypto.com CLO (succeeded Lundgren). Nick Lundgren — **left** (now Underdog CLO). Maria Allott — VP, Global Head of Sales \| Deputy MD of the Exchange (Dubai) [internal record] | Chicago (Nadex) [carried]. NYC: **not established** | 09-24: OG.com Markets CFTC filing for single-stock perps [internal record; carried]. 09-08: Robinhood deal [carried]. 2026-05/07: Lundgren exit [conflict on date] | **Active MNDA thread through Crypto.com** [internal record]: re-assessment 10-15; no parallel outreach; do not name OG.com externally. Climate category gap = product opening |
| **Rothera** | Broker JV DCM+DCO | Rothera, LLC: Robinhood (managing) + Susquehanna (SIG) [carried] | Rothera Exchange and Clearing LLC (LedgerX LLC renamed after the 2026-01-20 transaction). DCO rulebook certified 2026-05-19. First contracts self-certified 2026-05-13 | **None found.** Robinhood temperature pages disclose Kalshi/ForecastEx, not Rothera | Serves Robinhood's US customers → US-only (inference). Sensitivity: low | rothera.io [carried]; CFTC public comment by Rothera (2026-05-01) | **Tom (Thomas) Chippas** — CEO — FTF News 2026; CFTC comment 2026-05-01. **JB Mackenzie** — VP & GM, Futures and Prediction Markets, Robinhood [carried]. Matt Trudeau — **no public source found**. Adam Hickerson — "COO · Sr. Director, Chicago" [internal record; employer unclear] | **Chicago-based**. NYC: Rothera not; some Robinhood staff in NYC [internal record] | Nothing found in window | Low until Rothera lists weather. Robinhood is gated on the 10-15 Crypto.com re-assessment [internal record] |
| **Coinbase / The Clearing Company (TCC)** | Crypto-exchange distributor; own venue unconfirmed | Coinbase | TCC deal announced 2025-12-22, expected to close Jan 2026; **closing not confirmed**. TCC had applied for a DCO (Nov 2025), not yet operational | No own listings found. Coinbase "Weather" category = Kalshi contracts (KX tickers) [carried] | US customers [carried] | coinbase.com/predictions/weather; help.coinbase.com (prediction markets) [carried] | **Toni Gemayel** — founder, TCC — CoinDesk 2025-12-22 [carried]; current Coinbase title unknown | Not established | Nothing found in window | Low: Coinbase distributes Kalshi weather. Revisit only if its own venue lists weather |
| **CME Group (FanDuel Predicts)** | Incumbent DCM/DCO | CME Group | FanDuel Predicts launched 2025-12-22: indices, energy, gold, crypto, GDP, CPI; sports only in some states [carried] | **No weather event contracts found.** HDD/CDD/CAT weather futures use Speedwell-processed NWS data (rulebook) [carried; stale rulebook] | n/a for event contracts | cmegroup.com media room / weather pages [carried] | Terry Duffy — Chairman & CEO [carried]; event-contract product owner **not found** | Not re-sourced | Nothing found in window (not searched: budget) | Low for event contracts. The weather-futures desk is a possible index or data buyer (inference) |
| **Cboe Predicts** | Incumbent; SEC-regulated (not CFTC) | Cboe Global Markets | Binary options on XSP (XSPBW/XSPBX), SEC-regulated; via IBKR, with Schwab expected [carried] | None | n/a | ir.cboe.com [carried] | None found | Not re-sourced | Nothing found in window (not searched: budget) | Not a target unless Cboe Futures Exchange lists CFTC event contracts (unknown) |

### Inferences
- **Priority for the 24–29 October New York trip.**
  - Kalshi first: Will Brackett for partnerships; the Weather Index owner still needs identifying.
  - Polymarket US second: Nick Rice for markets; the Edward/Dan Lee thread for product. It is Korea-sensitive.
  - ForecastEx, OG.com/CDNA, Rothera, CME and Cboe are Chicago-centred, or have no confirmed NYC base, so meetings there are calls rather than coffees. The internal record sets the send window for NYC meeting requests at 13–17 October.
- **Pitch shift.** "Multi-source consensus with QC" is no longer novel at Kalshi: it filed exactly that for US metros, with Synoptic. The defensible differences are:
  - (a) **non-US cities** (172 cities in 91 countries vs ~10 US metros);
  - (b) **public ledger fingerprints**, where Kalshi's Source Agency appendix is confidential;
  - (c) an explicit **"withheld"** verdict, which maps onto Kalshi's "unavailable" minute status.
- **Polymarket US's GTC is the opposite design**: one airport METAR per contract, with Weather Underground as fallback. The CDG-style verification argument is strongest there, but the Korea brand risk is highest.

### Gaps
- No X handles or LinkedIn company pages were verified (search budget exhausted). Likely handles from background knowledge, **unverified, check before use**: @Kalshi, @Polymarket, @IBKR, @cryptocom, @CMEGroup, @Cboe, @coinbase. None was found for ForecastEx, OG.com, Rothera or Polymarket US separately.
- HQ street addresses were not re-sourced for Kalshi, Polymarket US, OG.com, Coinbase, CME or Cboe.

---

## 1. Kalshi (KalshiEX LLC / Kalshi Klear LLC)

### Takeaway
By mid-September 2026, Kalshi was running **two weather-data vendors**:
- **The Weather Company** is the named publisher for daily high/low ladders, at the NWS CLI station [carried].
- **Synoptic Data** appears for the new **"Kalshi Weather Index"**: a minute-resolution, multi-station, QC-flagged metro index that settles hourly directional temperature markets.

The 2026-10-01 filings extended the index (Kansas City; Chicago V2; Southeast Michigan; Philadelphia & Delaware Valley; Coastal LA). No exclusivity language for TWC appears in any coverage. Will Brackett (Head of Partnerships) is now confirmed in press as Kalshi's voice on the TWC deal. No weather-category owner was found.

### Cited Findings
**New weather product: the Kalshi Weather Index and hourly directional markets**
- KalshiEX self-certified "Will the Kalshi Weather Index for ⟨region⟩ be…" contracts. Filings span August to October 2026; the CFTC filenames indicate 2026-08-12, 09-01, 09-09 and **10-01** (dates read from the filenames, an inference). Each attaches a region-specific "Kalshi Weather Index Methodology" as **Appendix B**: e.g., "Miami Configuration", "Southeast Michigan Configuration".
  - Regions named across the filings: **Miami, Chicago Metro Area, San Francisco, Greater Boston, Dallas–Fort Worth, Puget Sound, Kansas City, Southeast Michigan, Philadelphia & Delaware Valley, Coastal Los Angeles**.
  - The Kansas City filing says the contract "will initially be listed after close-of-business on October 1, 2026".
  - Chicago Metro was filed 09-09 under rulebook **CHIMETROWINDEX**, and the 10-01 filing references **CHIMETROWINDEXV2**.
  - CFTC lists the product as a binary option, status "certified".
  - The Kalshi filings are said to be mirrored at kalshi.com/regulatory/filings.
  - Sources: [CFTC filing 08-12](https://www.cftc.gov/filings/ptc/ptc08122615995.pdf); [09-01](https://www.cftc.gov/filings/ptc/ptc09012622909.pdf); [09-01](https://www.cftc.gov/filings/ptc/ptc09012622895.pdf); [09-01](https://www.cftc.gov/filings/ptc/ptc09012622854.pdf); [09-09 Chicago](https://www.cftc.gov/filings/ptc/ptc09092624315.pdf); [10-01](https://www.cftc.gov/filings/ptc/ptc10012630830.pdf); [10-01](https://www.cftc.gov/filings/ptc/ptc10012630816.pdf); [10-01](https://www.cftc.gov/filings/ptc/ptc10012630774.pdf); [10-01](https://www.cftc.gov/filings/ptc/ptc10012630788.pdf); [10-01](https://www.cftc.gov/filings/ptc/ptc10012630851.pdf); [CFTC DCM product page 63556](https://www.cftc.gov/IndustryOversight/IndustryFilings/TradingOrganizationProducts/63556) [search summary, unverified; which PDF covers which region was not isolated]
- **Index definition (Chicago contract terms):**
  - Index: "the minute-resolution temperature index for the Chicago Metro Area calculated and published by the Source Agency under the Kalshi Weather Index Methodology, Version 1.0".
  - Units: °F, rounded to 0.01°F.
  - Minute status: "normal" or "degraded" minutes produce a usable observation; "unavailable" minutes produce none.
  - Appendices: the Miami and Chicago filings carry a **confidential appendix on the Source Agency** and **another on an agreement with "Synoptic"**.
  - Sources: [CFTC 09-09](https://www.cftc.gov/filings/ptc/ptc09092624315.pdf); [CFTC 08-12](https://www.cftc.gov/filings/ptc/ptc08122615995.pdf) [search summary, unverified]
- **Public API:** the "Get Weather Index" endpoint returns a city-keyed, minute-resolution temperature index. With `detailed=true` it adds **each member station's reading and quality-control result** — [Kalshi API docs](https://docs.kalshi.com/api-reference/live-data/get-weather-index) [search summary, unverified]
- **Hourly directional markets:**
  - Series: "Hourly directional Chicago Metro temperature" (KXTEMPCHIHS) and "Hourly directional Coastal LA temperature" (KXTEMPLAXHS).
  - Each asks whether the temperature at a set hour reaches a threshold.
  - The market pages name **Synoptic Data** as the data source. Pages exist for 2026-09-12 through early October.
  - Sources: [KXTEMPCHIHS 26SEP1203](https://kalshi.com/markets/kxtempchihs/hourly-directional-chicago-metro-temperature/kxtempchihs-26sep1203); [KXTEMPCHIHS 26OCT0612](https://kalshi.com/markets/kxtempchihs/hourly-directional-chicago-metro-temperature/kxtempchihs-26oct0612); [KXTEMPLAXHS 26SEP1217](https://kalshi.com/markets/kxtemplaxhs/hourly-directional-coastal-la-temperature/kxtemplaxhs-26sep1217); [KXTEMPLAXHS 26OCT0717](https://kalshi.com/markets/kxtemplaxhs/hourly-directional-coastal-la-temperature/kxtemplaxhs-26oct0717) [search summary, unverified; dates read from the tickers]
  - [conflict] Kalshi's Help Center (as summarised on 09-28) said hourly temperature markets settle on "The Weather Company" [carried from 09-28 notes]. The new hourly directional pages name Synoptic Data. Older hourly series may differ from the new index series; not resolved.
- **Synoptic Data:** a public benefit corporation running a real-time environmental-data platform. It was awarded a UK Met Office contract to supply surface-observation data across Europe — [Meteorological Technology International](https://www.meteorologicaltechnologyinternational.com/news/data/synoptic-data-awarded-uk-met-office-contract-for-weather-data-services.html) [search summary, unverified; article date not captured]

**Daily markets and catalogue size**
- Daily high/low ladders are still live in October, e.g., [KXHIGHCHI-26OCT04](https://kalshi.com/markets/kxhighchi/highest-temperature-in-chicago/kxhighchi-26oct04), [KXLOWTSATX-26OCT02](https://kalshi.com/markets/kxlowtsatx/lowest-temperature-satx/kxlowtsatx-26oct02), [KXLOWTLAX-26OCT05](https://kalshi.com/markets/kxlowtlax/lowest-temperature-in-la/kxlowtlax-26oct05) [search summary, unverified]. Their publisher has been TWC at the named NWS CLI station since 09-04 [carried from 09-28 notes].
- An aggregator snapshot counts **201 open weather/climate events on Kalshi vs 355 on Polymarket** — [CoinStats](https://coinstats.app/prediction-markets/odds/climate/) [search summary, unverified; aggregator, snapshot]

**TWC partnership: status and exclusivity**
- Coverage of the 2026-08-27/28 deal says:
  - Kalshi will use TWC's "weather data feeds as its trusted source for verifying weather-related market outcomes".
  - One report says TWC will apply **quality-control screening to prevent data tampering**.
  - TWC will show Kalshi probabilities in The Weather Channel app and on weather.com.
  - The two will "explore creating new weather markets that touch climate, sports, culture and more".
  - Kalshi frames the split as: TWC provides authoritative observation data; Kalshi designs the contracts, operates the exchange and resolves markets.
  - **None of the coverage describes the deal as exclusive.**
  - Sources: [Insurance Journal 2026-08-28](https://www.insurancejournal.com/news/international/2026/08/28/883211.htm); [Artemis](https://artemis.bm/news/prediction-market-kalshi-partners-with-the-weather-company-for-weather-hedge-settlements); [Claims Journal / Bloomberg 2026-08-31](https://www.claimsjournal.com/news/national/2026/08/31/339851.htm); [Markets Media](https://marketsmedia.com/kalshi-partners-with-the-weather-company); [Gizmodo (headline: "markets that are nearly impossible to insider trade")](https://gizmodo.com/kalshi-teams-up-with-the-weather-co-on-markets-that-are-nearly-impossible-to-insider-trade-2000803871); [TWC newsroom](https://weathercompany.com/news/kalshi-and-twco-partner) [search summary, unverified]
- No new Kalshi weather-data partner announcement was found after 09-20, apart from Synoptic's appearance in the filings and market pages above [search summary, unverified].

**People**
- **Will Brackett — "head of partnerships"** — quoted on the TWC deal: "Weather is one of the fastest-growing and most crucial categories at Kalshi because it affects everyone" — [Markets Media](https://marketsmedia.com/kalshi-partners-with-the-weather-company); [Insurance Journal](https://www.insurancejournal.com/news/international/2026/08/28/883211.htm) [search summary, unverified; which of the TWC-deal articles carries the quote was not isolated]. This upgrades his title from LinkedIn-only (09-28) to press-confirmed.
- **TWC side:** Dr. James Belanger, **VP of Meteorology, The Weather Company**, is quoted on data accuracy in the same coverage. He is a counterparty or competitor contact, not Kalshi staff — [Markets Media](https://marketsmedia.com/kalshi-partners-with-the-weather-company) [search summary, unverified]
- A targeted search for a Kalshi "Head of Markets", "head of climate" or "weather markets lead" returned **no one** [search summary, unverified].
- Carried, not re-verified:
  - Tarek Mansour (co-founder & CEO) and Luana Lopes Lara (co-founder & COO; "oversees product development, operations, and strategic partnerships") — [Gambling Insider](https://www.gamblinginsider.com/in-depth/104329/who-owns-kalshi) [carried from 09-28 notes]
  - Max Crowley (VP Business Development) — [CB Insights](https://www.cbinsights.com/company/kalshi/people) [carried; aggregator-only]
  - Rick Heaslip (GC / Chief Regulatory Officer) — aggregator-listed [carried; unverified]
- From the internal record: Edward King (Trade Surveillance) and John Wang (Head of Crypto). Kalshi is recorded as "New York HQ" — [internal_status.md] [internal record]

**Korea, and news from 09-20 to 10-11**
- Korea is reportedly not on Kalshi's restricted list (third-party guides; the official where.kalshi.com page was not reachable). Kalshi had not been referred to Korea's online-content regulator as of 2026-08-18 [carried from 09-28 notes].
- 2026-09-22: Korean press reported Kalshi applied to the CFTC for leverage/margin trading [carried from 09-28 notes; headline only].
- 2026-09-25/26: 6th Circuit ruled against Kalshi on Ohio/Tennessee sports contracts [carried from 09-28 notes].
- 2026-10-01: Weather Index self-certifications (above). No funding close was found (budget ran out before the search).

### Inferences
- **Kalshi has productised the core of the Wellbian pitch for US metros**: multi-station, minute-level, per-station QC with degraded/unavailable states, via Synoptic. A US-city pitch would compete head-on with Synoptic. The opening is to offer **non-US "configurations" of the same methodology** (European and Asian metros) plus **public, tamper-evident fingerprints**. Kalshi keeps its Source Agency appendix confidential, so a public audit trail is something Kalshi lacks.
- The **10-01 V2 rulebook and the steady addition of regions** suggest the index programme is being iterated now. That makes this a good moment to ask whoever owns it (not identified) whether non-US configurations are on the roadmap.
- **TWC exclusivity:** the use of Synoptic for the index products is strong circumstantial evidence that TWC is not exclusive across all weather products. Contract terms remain unknown.
- Will Brackett is the natural business door, since he fronted the TWC deal. The technical owner is probably whoever signs the Weather Index self-certifications.

### Gaps
- The Weather Index filings' signatory / contact person, the Source Agency identity (the appendix is confidential) and the methodology text: CFTC PDFs and kalshi.com/regulatory/filings were egress-blocked.
- Whether any non-US Weather Index configuration has been filed (none appeared in the results).
- Kalshi's ~$40B round status; any weather/climate category lead; X/LinkedIn company pages; an external source for the NYC HQ.

---

## 2. Polymarket US (QCX LLC d/b/a Polymarket US / QC Clearing LLC)

### Takeaway
Polymarket US filed its first **global, template-style temperature contract** on 2026-10-07 (GTC; listing ≥10-09). Its primary sources are NOAA's NWS Aviation Weather Center and NCEI, with Weather Underground secondary. The filings confirm **Nick Rice as Head of Markets**: he signed the June 2026 Temperature Rank Contract self-certification. AP names **Dan Lee** as head of U.S. operations; the internal record's "Edward Lee, Head of Product, Exchange" may or may not be the same person. The US exchange is USD-funded and walled off from the international site that Korea blocked on 2026-08-18.

### Cited Findings
- **Global Temperature Contract (GTC):**
  - QCX LLC (d/b/a Polymarket US) self-certified the GTC under §40.2(a) on **2026-10-07**, intending to list "no earlier than October 9, 2026".
  - It is filed as a single, specific event contract (not a Broad Template Certification), and serves as "the referenced contract for a subsequent certification of a class of swaps" under §40.2(d).
  - A separate **Class Certification for Global Temperature Contract (GTCD)** has the same ≥10-09 date.
  - Example question: "Will the highest temperature in Chicago during August 1, 2027 be at least 95°F?". Notional $1.00.
  - Primary sources: "The NOAA National Weather Service Aviation Weather Center and the NOAA National Centers for Environmental Information (NCEI)". Secondary: **Weather Underground**.
  - Sources: [CFTC ptc10072632237](https://www.cftc.gov/filings/ptc/ptc10072632237.pdf); [CFTC ptc10072632238](https://www.cftc.gov/filings/ptc/ptc10072632238.pdf); [CFTC ptc10072632244](https://www.cftc.gov/filings/ptc/ptc10072632244.pdf); [CFTC ptc10072632258](https://www.cftc.gov/filings/ptc/ptc10072632258.pdf) [search summary, unverified]
- **Temperature Rank Contract (TRC):** filing dated 2026-06-22, listing ≥2026-06-24, **signed by Nick Rice, Head of Markets**. Other QCX self-certifications in the same results cover weather, disease and other event contracts — QCX filings returned by search, e.g. [ptc0618266900](https://www.cftc.gov/filings/ptc/ptc0618266900.pdf), [ptc0625267456](https://www.cftc.gov/filings/ptc/ptc0625267456.pdf), [ptc0626268045](https://www.cftc.gov/filings/ptc/ptc0626268045.pdf) [search summary, unverified; the exact TRC PDF was not isolated]
- **International Polymarket (non-CFTC; context only):**
  - City-high markets resolve on a single named station, e.g., Hong Kong Observatory for Hong Kong, the Wunderground history page for Wellington.
  - Monthly global-temperature brackets resolve on NASA's GISTEMP index, falling back to the lowest bracket if NASA has not published by the deadline.
  - Sources: [polyguana (HK)](https://polyguana.com/market/2480292); [polyguana June 2026 temp](https://polyguana.com/events/june-2026-temperature-increase-c) [search summary, unverified; aggregator]
- **People:**
  - **Dan Lee — head of U.S. operations**: joined in February 2026 from Coinbase; "Trust is the product we are building here" — [AP via Las Vegas Sun 2026-07-08](https://lasvegassun.com/news/2026/jul/08/polymarket-is-in-a-high-stakes-race-to-win-back-tr/); [Jamaica Gleaner 2026-07-10](https://jamaica-gleaner.com/article/business/20260710/polymarket-high-stakes-race-win-back-trust-it-recommits-us-market) [search summary, unverified]. Natalie Oblazny was also hired from Coinbase (same AP story).
    - [conflict] The internal record lists "**Edward Lee** — Head of Product, Exchange (NYC)", and the 10-08 InMail went to him [internal record]. Whether "Dan Lee" and "Edward Lee" are one person is **unresolved**.
  - **Lisa Mantil — "head of institutional growth"** (ex-Goldman partner and global head of its ETF Accelerator); her job is to bring banks, funds and trading firms onto the platform — [casino.org](https://www.casino.org/news/polymarket-hires-former-goldman-sachs-partner-to-steer-institutional-growth/); [Crypto Briefing](https://cryptobriefing.com/polymarket-hires-goldman-sachs-lisa-mantil/) (citing CNBC, 2025-09-29) [search summary, unverified] [stale >12 mo]
  - **Neal Kumar — Chief Legal Officer** (ex-CFTC attorney, ex-Willkie Farr partner) — [Bloomberg Law, 2025-04](https://news.bloomberglaw.com/ip-law/polymarket-hires-ex-cftc-official-kumar-as-chief-legal-officer) [search summary, unverified] [stale >12 mo]
  - Travis VanderZanden — chief growth officer, also took over marketing — [Webull (opinion piece)](https://www.webull.com.au/news-detail/15385683618653184) [search summary, unverified]
  - Carried, not re-verified: Paul Jordan (Chief Risk Officer, Polymarket US), Megan McGrath (CCO of the US exchange), Natalie Oblazny (head of regulatory affairs), Shana Bautista (global head of investigations) — [CNBC 2026-08-11](https://www.cnbc.com/2026/08/11/polymarket-revamps-marketing-expands-us-hiring-ahead-of-fall-events.html); Warren Jenson (first CFO, 2026-09-10); Shayne Coplan (founder & CEO) [carried from 09-28 notes]
- **NYC presence:** open postings for a **VP of Product "based in New York"** and a "Head of Product, Legal" — [Built In NYC](https://www.builtinnyc.com/job/vp-product/8879216); [web3.career](https://web3.career/head-of-product-legal-polymarket/151665) [search summary, unverified; posting dates not shown]. The internal record places Lisa Mantil, Neal Kumar, Edward Lee and Malea Otranto (Global Head of Trust and Safety) in New York [internal record].
- **Structure and Korea:**
  - The US exchange is "regulated by the Commodity Futures Trading Commission and funded with traditional U.S. dollars", walled off from the crypto-based international platform, with "a much narrower number of contracts" — [Las Vegas Sun / AP](https://lasvegassun.com/news/2026/jul/08/polymarket-is-in-a-high-stakes-race-to-win-back-tr/) [search summary, unverified].
  - QCX LLC (DCM) and QC Clearing LLC (DCO) were acquired for $112M (2025-07-21) — [Fortune](https://fortune.com/2025/07/22/polymarket-returning-to-us-qcx-qc-clearing/); [Mondo Visione](https://m.mondovisione.com/news/polymarket-acquires-cftc-licensed-exchange-and-clearinghouse-qcex-for-112-milli-2025721) [search summary, unverified] [stale >12 mo].
  - Sacra (a research aggregator) puts the US launch in **May 2026** on iOS, sports first, and ICE at ~23% of outstanding shares after a 2026-03-27 investment — [Sacra](https://sacra.com/research/polymarket-at-375m-year-revenue/) [search summary, unverified; aggregator]
- Public channels: [Polymarket US FCM partners doc](https://docs.polymarket.us/partners/fcms) [carried]; an official "Institutional" mail route was used on 09-28 [internal record; address not recorded].

### Inferences
- **The GTC template uses METAR from NOAA's Aviation Weather Center, which carries airports worldwide.** A "global" template could therefore list non-US airports, possibly including Asian ones. The design is still **one station per contract plus a consumer-website fallback**, the configuration the CDG case discredited. That gives Wellbian its sharpest "verification layer" argument at Polymarket US.
- **Nick Rice signs the contract filings**, so he is the functional owner of settlement-source choice. The internal record already notes him as "closer to the real owner" but not yet contacted, and says Polymarket outreach is over its cap. Any approach should replace an existing thread rather than add one.
- Korea: Korean residents cannot reach Polymarket US, but the **brand** is the one Korea's regulator blocked over weather markets. Supplying settlement data for any Korean-city GTC would be the highest-risk use.

### Gaps
- GTC full text: city list, station-choice rule, how "global" cities are named, and error/dispute procedures. The CFTC PDFs were blocked.
- Whether "Dan Lee" = "Edward Lee"; any current "Head of Product, Exchange" title in public sources.
- Whether Mantil and Kumar are still in role (both items are more than 12 months old).
- Polymarket US's street address; X/LinkedIn company pages for the US entity.

---

## 3. ForecastEx (Interactive Brokers)

### Takeaway
Nothing new was confirmed for ForecastEx since 09-20. The only public word on non-US temperature cities is still IBKR's 2026-02-12 note that "international destinations will begin to turn live soon, including Madrid, Paris, Vancouver, Montreal and more". No launch was found by 10-11. One gap from 09-28 is partly closed: Robinhood's temperature event pages state that its contracts are offered "through either KalshiEX LLC or ForecastEX, LLC", so ForecastEx weather contracts likely reach Robinhood retail too.

### Cited Findings
- IBKR Campus (2026-02-12): the US daily-high list grew from 10 to 20 cities (adding Charlotte, Jacksonville, Oklahoma City), and international destinations "will begin to turn live soon, including Madrid, Paris, Vancouver, Montreal and more". No later launch confirmation appeared in results — [IBKR Campus](https://www.interactivebrokers.com/campus/traders-insight/forecast-trader/new-us-cities-added-to-daily-high-temperature-contract-list/); [IBKR EU mirror](https://www.interactivebrokers.eu/campus/traders-insight/new-us-cities-added-to-daily-high-temperature-contract-list-feb-12-2026/) [search summary, unverified]
- Robinhood's "New York City Daily Temperature High" event pages carry the disclosure that event contracts are offered by Robinhood Derivatives, LLC "through either KalshiEX LLC or ForecastEX, LLC" — [Robinhood 2026-06-05](https://robinhood.com/us/en/prediction-markets/climate/events/new-york-city-daily-temperature-high-june-5-2026-jun-05-2026/); [Robinhood 2026-02-19](https://robinhood.com/us/en/prediction-markets/climate/events/new-york-city-daily-temperature-high-february-19-2026-feb-19-2026) [search summary, unverified; the disclosure is generic and does not name the venue for that specific market]
- Madrid and Paris "highest temperature" markets for 2026-08-24 appear on a Struct explorer page, but **no platform is named**, so they cannot be attributed to ForecastEx — [Struct explorer](https://explorer.struct.to/traders/0x7e445d8d08bc305f55f0ef8de11d75b752b42c35) [search summary, unverified]
- Carried, not re-verified:
  - Settlement uses airport ASOS METAR hourly readings, plus NOAA monthly US temperature and NOAA global-anomaly contracts.
  - Robert Prior is CEO, per Rulebook v.2026-09-01 and CFTC filings.
  - Graham Deese is Chief Regulatory Officer, per his LinkedIn headline.
  - Address: Chicago (209 S LaSalle) on filings up to Jan 2026, but Fort Lauderdale on an Apr 2026 filing [conflict].
  - Channels: data.forecastex.com/regulatory; forecastex.com/about; the IBKR Campus "Fair Value Weather & Climate" series — [ForecastEx Rulebook](https://data.forecastex.com/regulatory/ForecastEx_LLC_Rulebook.pdf); [IBKR Campus](https://www.interactivebrokers.com/campus/traders-insight/ibkr-climate-energy/fair-value-weather-climate-wednesday-july-29-2026/) [carried from 09-28 notes]
- Internal record: Prior and Deese were on the 09-28 "contact now / next" sheet, with **no send recorded** [internal record].

### Inferences
- An international launch announced eight months ago but not confirmed live suggests the station and data question for non-US cities may still be open. That timing favours a pitch built on cross-verified airport readings for exactly those cities (Madrid, Paris, Vancouver, Montreal), extendable to others.
- If ForecastEx also feeds Robinhood's temperature markets, its weather book is larger than IBKR's own flow suggests.

### Gaps
- Whether any non-US ForecastEx city is live, and with which source.
- Whether IBKR offers ForecastEx contracts to Korean residents (the venue's non-US eligibility was not found).
- Any ForecastEx product or market-design lead below the CEO; any NYC staff; news after Feb 2026 (budget ran out before a dedicated search).

---

## 4. OG.com / Crypto.com | Derivatives North America (North American Derivatives Exchange, Inc., ex-Nadex)

### Takeaway
OG.com's top legal and executive layer turned over in 2026:
- **Nick Lundgren**, CEO of OG.com at its February launch and Crypto.com's CLO, left to become **Underdog's CLO**.
- **Justin Wales** succeeded him as Crypto.com's CLO.
- Public sources still show **Stephen Humenik** only as Crypto.com's Global Head of Derivatives Legal (2022). The "OG.com CLO" title exists only in our internal record.

The weather lineup is thin. The relationship is already live through Crypto.com under an MNDA [internal record], so this section only maps names and does not suggest new outreach.

### Cited Findings
- **Launch and structure:** OG launched 2026-02-03, "powered and operated by Crypto.com Derivatives North America (CDNA)". Lundgren was named OG.com CEO while serving as Crypto.com CLO, and had led CDNA's December 2024 launch of the first CFTC-regulated sports event contracts — [Decrypt](https://decrypt.co/356895/crypto-com-unveils-us-prediction-markets-platform-as-legal-pressure-mounts-on-rivals); [Covers 2026-02-03](https://www.covers.com/industry/crypto-com-unveils-prediction-platform-experience-og-feb-3-2026) [search summary, unverified]
- Early partners (PANews, 2026-02-17): DraftKings, Fanatics, Underdog, Truth Social — [KuCoin News](https://www.kucoin.com/news/flash/og-com-a-prediction-market-by-crypto-com-partners-with-draftkings-and-others) [search summary, unverified]. A review says residents of **New York and Arizona cannot trade** on OG — [Football365](https://www.football365.com/reviews-us/og-com) [search summary, unverified; affiliate review]
- **Leadership change:**
  - Underdog appointed Nick Lundgren Chief Legal Officer — [StreetInsider](https://www.streetinsider.com/Press+Releases/Underdog+Appoints+Nick+Lundgren+as+Chief+Legal+Officer/26442047.html); [Business Wire](https://www.businesswire.com/news/home/20260718201640/en/); [MLex](https://www.mlex.com/pulse/in-house/articles/2474431/sports-platform-underdog-hires-legal-chief-from-crypto-com).
  - "Wales replaces Lundgren, who steps down as chief legal officer of Crypto.com and CEO of OG.com after nearly six years" — [Gaming Intelligence](https://www.gamingintelligence.com/?p=229367) [search summary, unverified].
  - [conflict] Timing: the Business Wire URL suggests 2026-07-18, but another article's URL suggests May 2026.
- **Stephen (Steve) Humenik:**
  - Named Crypto.com **Global Head of Derivatives Legal** (July 2022). Ex-K&L Gates partner; earlier special counsel and policy advisor to CFTC Commissioner Scott O'Malia — [Crypto.com](https://crypto.com/au/company-news/crypto-com-names-stephen-humenik-global-head-of-derivatives-legal) [search summary, unverified] [stale >12 mo]
  - Appointed to the CFTC GMAC Digital Asset Markets Subcommittee (2023) — [Crypto.com](https://crypto.com/uk/company-news/crypto-coms-steve-humenik-appointed-to-the-u-s-cftc-global-markets-advisory-committee-digital-assets-market-subcommittee) [search summary, unverified] [stale >12 mo]
  - No public result tied him to OG.com. Our internal record (09-28) describes him, from his own LinkedIn post, as "OG.com CLO and chair of the OG.com Markets board" [internal record].
- **Internal record (not public):**
  - OG.com Markets = North American Derivatives Exchange, Inc. (ex-Nadex/CDNA, Chicago). It filed with the CFTC on 09-24 for US single-stock perpetual futures.
  - Maria Allott is Crypto.com "VP, Global Head of Sales | Deputy MD of the Exchange" (Dubai, since 2026-03), per a headline "Crypto.com hires OKX alum Maria Allott to head Prediction Markets sales".
  - Our live thread runs through a Crypto.com strategic-partnerships contact under MNDA: follow-up 10-07, re-assessment 10-15. The counterpart has raised redistribution and exclusivity questions. Source: [depin/content/cryptocom-call-0911.md; internal_status.md] [internal record]
- Carried, not re-verified:
  - Kris Marszalek is "founder and chief executive of both Crypto.com and OG.com", and Travis McGhee is Global Head of Predictions (ex-CDNA CEO) — [OG.com news](https://og.com/company-news/robinhood-selects-ogcom-as-infrastructure-partner-for-prediction-markets-platform-holding-equity-stake-in-exchange-engine); [Crypto.com](https://crypto.com/en/company-news/cryptocom-promotes-travis-mcghee-to-global-head-of-predictions).
  - Climate list is thin ("hottest year on record"); Nadex is based in Chicago; reported CDNA staff departures [carried from 09-28 notes].

### Inferences
- With Lundgren gone and Wales in, **don't target anyone from legal**. The product/predictions side (McGhee) and the existing partnerships thread are the relevant owners, and the internal rule says no parallel outreach before 10-15.
- OG.com's B2B "engine" role (Robinhood, FanDuel) means a climate-category data deal could reach several consumer brands at once. That is an inference from the 09-28 findings.

### Gaps
- Whether Travis McGhee still holds his role (promotion date not captured); OG.com's current corporate officers after Lundgren; any OG weather/climate settlement source; any NYC staff.

---

## 5. Rothera Exchange and Clearing (Robinhood–Susquehanna JV; ex-LedgerX / MIAXdx)

### Takeaway
Rothera is a **Chicago-based** DCM+DCO with no weather listings. Tom Chippas is publicly confirmed as CEO. **No public source** links a "Matt Trudeau" to Rothera. Robinhood's temperature markets disclose Kalshi or ForecastEx as the venue, not Rothera.

### Cited Findings
- LedgerX LLC (d/b/a MIAXdx) changed its legal name to **Rothera Exchange and Clearing LLC** after a corporate transaction on **2026-01-20**. Rothera is a CFTC-regulated DCM and DCO. Its amended DCO rulebook was received 2026-05-05 and certified 2026-05-19 — [CFTC DCO rule filing 60698](https://www.cftc.gov/IndustryOversight/IndustryFilings/ClearingOrganizationRules/60698); [CFTC DCM page 40473](https://www.cftc.gov/IndustryOversight/IndustryFilings/TradingOrganizations/40473); [CFTC media 13256](https://www.cftc.gov/media/13256) [search summary, unverified; the page carrying the name change was not isolated]
- "Chicago-based neutral marketplace", built on Adaptive's platform, live for the World Cup. **Tom Chippas, CEO**, is quoted, and the report puts about **$3B in contracts in its first two months** — [FTF News](https://www.ftfnews.com/event-contract-market-runs-on-adaptive-technology/) [search summary, unverified]
- A CFTC public comment dated 2026-05-01 on proposed rule 91 FR 12516 is attributed to **Thomas Chippas for Rothera** (content only in an attached PDF) — [CFTC comments](https://comments.cftc.gov/PublicComments/ViewComment.aspx?id=115609) [search summary, unverified]
- First contracts were self-certified 2026-05-13: MLB, Core PCE and weekly jobless claims. The first weekend traded about $2.1M, 85% of it on one White Sox–Tigers contract. Robinhood began World Cup routing on 2026-06-04. Tenev said Rothera will not be exclusive — [Yahoo Finance](https://finance.yahoo.com/markets/options/articles/robinhood-exchange-rothera-self-certifies-143021809.html); [Robinhood newsroom](https://robinhood.com/us/en/newsroom/the-world-cup-is-now-trading-on-robinhood-and-rothera/); [Gambling Insider](https://www.gamblinginsider.com/news/164923/robinhood-rothera-launch-event-contracts); [DeFi Rate](https://defirate.com/news/robinhood-q1-earnings-show-prediction-markets-holding-strong-as-rothera-exchange-nears-launch/) [search summary, unverified]
- A search for "Trudeau" with Rothera returned **no supporting result** [search summary, unverified].
- Carried, not re-verified: JB Mackenzie is VP & GM, Futures and Prediction Markets at Robinhood; the reported ownership split is Robinhood 45% / SIG 45% / MIAX 10% (unverified) [carried from 09-28 notes].
- Internal record: Tom Chippas was sent a connection request and intro on 09-28. Adam Hickerson ("COO · Sr. Director, Chicago") appears, with his employer unclear. Robinhood-side contacts in NYC: Nicola White and Valeria R. The Robinhood line is gated on the 10-15 Crypto.com re-assessment [internal record].

### Inferences
- Rothera has no weather book and Robinhood's temperature flow sits on Kalshi or ForecastEx, so Rothera matters only if it starts listing weather. The Robinhood conversation (product owner: Mackenzie) is the better door, but the internal gate applies.

### Gaps
- Rothera officers other than the CEO; whether "Matt Trudeau" exists in any Rothera role; any Rothera weather filing; NYC staff.

---

## 6. Coinbase's own venue / The Clearing Company

### Takeaway
The only sourced facts are the December 2025 deal announcement and pre-close details. **Closing was not confirmed**, and no Coinbase-listed weather contract was found. Coinbase's weather category distributes Kalshi contracts [carried].

### Cited Findings
- Coinbase agreed to buy The Clearing Company (announced 2025-12-22; expected to close in January 2026). The value was undisclosed ("immaterial"; cash plus stock). TCC had about 10 staff, nearly all joining Coinbase. Bloomberg Law said TCC "is not yet operational but applied in November" for clearing registration — [The Block](https://www.theblock.co/post/383497/coinbase-to-acquire-prediction-markets-startup-the-clearing-company); [Bloomberg Government](https://news.bgov.com/mergers-and-acquisitions/coinbase-acquires-the-clearing-company-in-prediction-market-push); [Cointelegraph](https://cointelegraph.com/news/coinbase-acquires-clearing-company-prediction-markets); [Yahoo Finance](https://finance.yahoo.com/news/coinbase-doubles-down-prediction-markets-162825510.html) [search summary, unverified]
  - [conflict] DeFi Rate says Coinbase "acquired" TCC, while the Bloomberg and Reuters-based items describe a pending deal — [DeFi Rate](https://defirate.com/?p=3034) [search summary, unverified]
- Polymarket's US head (Dan Lee) and regulatory lead (Natalie Oblazny) both came from Coinbase — [Las Vegas Sun / AP](https://lasvegassun.com/news/2026/jul/08/polymarket-is-in-a-high-stakes-race-to-win-back-tr/) [search summary, unverified]
- Carried, not re-verified: Coinbase's "Weather Prediction Markets" category uses Kalshi KX tickers; Coinbase's US prediction markets rolled out with Kalshi in January 2026; Toni Gemayel founded TCC — [Coinbase Weather](https://www.coinbase.com/predictions/weather); [CoinDesk 2026-01-27](https://www.coindesk.com/markets/2026/01/27/coinbase-rolls-out-prediction-market-to-u-s-customers) [carried from 09-28 notes]

### Inferences
- Coinbase is a distributor of Kalshi weather, not a buyer of settlement data, until its own DCM/DCO lists weather. Low priority.

### Gaps
- Deal close; TCC's DCO status; whether Coinbase's own DCM lists any event contract; named Coinbase prediction-market owners; HQ/NYC presence.

---

## 7. CME Group event contracts (FanDuel Predicts)

### Takeaway
Nothing new could be searched (budget exhausted). As of 09-28, CME event contracts via FanDuel Predicts covered financial and economic underlyings and some sports, with **no weather event contracts**. CME's weather futures settle on Speedwell-processed NWS data [carried].

### Cited Findings
- FanDuel Predicts (launched 2025-12-22) offers CME event contracts on indices, energy, gold, crypto, GDP and CPI. Sports are offered only where online sports betting is not legal — [CME press release](https://www.cmegroup.com/media-room/press-releases/2025/12/22/fanduel-and-cme-group-launch-fanduel-predicts.html) [carried from 09-28 notes]
- FanDuel added OG.com contracts in 2026, and Sportico reported strain in the CME–FanDuel partnership — [FX News Group](https://fxnewsgroup.com/forex-news/cryptocurrency/fanduel-expands-event-contract-offering-via-crypto-com-og-prediction-markets-partnership/); [Sportico](https://www.sportico.com/business/sports-betting/2026/fanduel-cme-group-prediction-markets-sports-terry-duffy-1234939913/) [carried from 09-28 notes]
- HDD/CDD/CAT weather futures and options; "All CME Seasonal Strip Index products are utilising settlement data and reporting provided by Speedwell Settlement Services Ltd." — [CME Rulebook Ch. 403](https://www.cmegroup.com/rulebook/CME/IV/400/403/403.pdf) [carried; stale rulebook]

### Inferences
- CME is a low-priority event-contract target. Its weather-derivatives franchise, and Speedwell/Xweather behind it, is a possible buyer of non-US index data. That is a different channel from event-contract settlement.

### Gaps
- Any CME weather event contract; the CME owner of event contracts; CME news in the window; NYC staff.

---

## 8. Cboe Predicts

### Takeaway
Nothing new could be searched. As of 09-28, Cboe Predicts was **SEC-regulated** binary options on the Mini-SPX (XSP), excluding sports and politics, so it is not a CFTC weather venue [carried].

### Cited Findings
- Cboe Predicts: binary options on XSP (XSPBW, XSPBX), "regulated by the Securities and Exchange Commission"; available on Interactive Brokers, with Charles Schwab expected — [Cboe IR](https://ir.cboe.com/news/news-details/2026/Cboe-Introduces-Cboe-Predicts-Launching-First-Products-in-New-Prediction-Markets-Suite/default.aspx); [Bloomberg 2026-02-06](https://www.bloomberg.com/news/articles/2026-02-06/cboe-to-launch-binary-event-wagers-in-prediction-markets-push) [carried from 09-28 notes]

### Inferences
- Not a target for weather settlement unless Cboe moves event contracts onto its CFTC-regulated futures exchange (CFE). That was not established.

### Gaps
- Whether Cboe Futures Exchange lists any CFTC event contracts; any Cboe climate product; named owners; news in the window.
