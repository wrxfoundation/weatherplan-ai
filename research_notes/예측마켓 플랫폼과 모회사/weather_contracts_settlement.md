# Weather & Climate Contracts in Prediction Markets and Weather Derivatives: Settlement Data, Stations, Vendors, Disputes (as of 2026-09-28)

_How these notes were gathered (for the report writer): research date 2026-09-28. WebFetch returned EGRESS_BLOCKED for help.kalshi.com, polymarket.com, docs.polymarket.com, cmegroup.com, cftc.gov, cnn.com, npr.org, cnbc.com, artemis.bm, weathercompany.com, interactivebrokers.com, data.forecastex.com, insurancejournal.com, finance.yahoo.com, euronews.com, vaisala.com, weatherxm.network, speedwellsettlementservices.com, reedsmith.com, congress.gov, nextpredict.io, blockhead.co, legalsportsreport.com, turbinefi.com, vweatherstation.com and wethr.net. As instructed, I did not retry these or work around the blocks. Facts taken only from search-engine summaries are tagged **[search summary — primary not opened]**. Facts known only from a result title are tagged **[title only]**. The primary documents I actually opened are four Kalshi contract-term PDFs on kalshi-public-docs.s3.amazonaws.com (GLOBALTEMPERATURE, NHIGH, RAINNYC, NOWDATASNOW; text extracted locally) and three GitHub pages from third-party trader tooling. The session's web-search budget (200 calls) ran out partway through, so several sub-questions are left as Gaps._

## 1. Kalshi weather markets: cities, metrics, rules, exact settlement source, revisions, volume

### Takeaway
Kalshi is the largest venue with a sourced figure: $564M of weather volume from January to July 2026, which is already more than all of 2025. That is about 500% growth year on year, and Kalshi expects about $1.1B for 2026. Temperature ladders used to settle on the NWS Daily Climate Report (CLI) for one named station, such as Central Park, Midway, LAX or Austin-Bergstrom. After a partnership announced on 2026-08-27/28, all ~40 temperature ladders switched their named publisher to The Weather Company (TWC) on 2026-09-04. The rules still name the NWS CLI station, and TWC's values have so far matched the CLI exactly. Rain and snow still settle on NWS products, and hurricanes on NHC advisories. Revisions published after expiration never count. Rule amendments in September 2026 added a mechanism to delay settlement when the official source data is erroneous.

### Cited Findings
**Rule text and settlement source (primary rulebooks)**
- Legacy NYC high-temperature rulebook **NHIGH** (PDF created 2025-01-30):
  - Underlying: "the maximum temperature recorded for the specified <date> published in the National Weather Service's ('NWS') Daily Climate Report for Central Park, New York."
  - Access path: weather.gov/wrh/climate?wfo=okx → "Observed Weather" → "Central Park NY" → the "Maximum" row.
  - Source Agency: NWS. — [Kalshi NHIGH contract terms](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/NHIGH.pdf) [primary opened]
- **NHIGH revisions and timing:**
  - The rulebook quotes NWS that the data "are preliminary" and "are subject to revision". Revisions made after expiration "will not be used". Revisions made between the last trading time and expiration "may be taken into account".
  - Expiration is the sooner of the first 7:00 or 8:00 AM ET after the data release, or one week after the date.
  - Determination is delayed to 11 AM ET if (1) the "High temperature is not consistent with 6-hr or 24-hr highs reported by METAR", or (2) "the Final report high is lower than earlier report(s)".
  - Strikes run from −30°F to 130°F in 1°F steps. The position limit is $25,000 per member. — [Kalshi NHIGH](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/NHIGH.pdf) [primary opened]
- **AUSHIGH** settles on the NWS Daily Climate Report for "Austin Bergstrom". **MIAHIGH** settles on the NWS Daily Climate Report for "Miami, FL". — [Kalshi AUSHIGH](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/AUSHIGH.pdf); [Kalshi MIAHIGH](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/MIAHIGH.pdf) [search summary — primary not opened]
- **GLOBALTEMPERATURE**, Kalshi's generic temperature rulebook (S3 copy, PDF created 2025-12-12):
  - Product: "Will the <maximum/minimum/average> temperature in <area> be <above/below/exactly/at least/between> <count> <measurement units> in <time period>?"
  - Source Agencies, "in hierarchical order": "National Weather Service, the national weather service for <area> (e.g. Australian Bureau of Meteorology, the Met Office, etc.)".
  - Station choice: if several stations exist, the "official" or "primary" station designated by the Source Agencies is used unless Kalshi specifies one.
  - "Only the first official non-preliminary report published by the Source Agencies that includes the relevant data will be used for resolution. Revisions after the Expiration Date are not included."
  - "Contract resolution is based on the full precision reported by the Source Agency. Rounding by media outlets, secondary reporting, or third-party summaries does not affect resolution."
  - If no data is available by expiration, "all strikes shall resolve to the last fair price as determined in the sole discretion of the Exchange".
  - Position Accountability Level (PAL): $25,000 per strike, per member. Expiration is 10:00 AM ET; the latest expiration date is three months after the period ends. — [Kalshi GLOBALTEMPERATURE](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/GLOBALTEMPERATURE.pdf) [primary opened]
- **Kalshi Rule 7.2**, as reproduced in the NYC rain rulebook RAINNYC (PDF created 2021-12-27, an old document): if "any event or any circumstance which may have a material impact on the reliability or transparency of a Contract's Source Agency or the Underlying" arises, Kalshi "retains the authority to designate a new Source Agency and Underlying for that Contract and to change any associated Contract specifications after the first day of trading." — [Kalshi RAINNYC](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/RAINNYC.pdf) [primary opened; 2021 document]
- **RAINNYC** (2021): the underlying is precipitation in the NWS Daily Climate Report for Central Park. Strikes run 0–100 inches in 0.01-inch steps. Expiration is the first 10:00 AM ET after the data release, or one week after the date. Revisions after expiration are not used. — [Kalshi RAINNYC](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/RAINNYC.pdf) [primary opened; older item]
- **NOWDATASNOW**, monthly snowfall (PDF created 2025-12-01):
  - Underlying: total monthly new snowfall "as reported by NWS NOWData via the 'Daily data for a month' product".
  - Only stations "that have manual snow observation capability" are listed. Automated-only stations are excluded.
  - Trace amounts count as 0.0. Missing days are summed as 0 in NOWData. If the whole month is missing, Kalshi tries "NCEI Climate Data Online or the relevant NWS Daily Climate Report (CLI product)".
  - "Subsequent corrections, revisions, or quality control adjustments made by NCEI or any other entity after the Expiration time shall not affect the market's resolution." The rulebook's example: an NCEI correction 45 days later changing 9.5 to 10.2 inches does not apply.
  - "A third-party weather service reports 10.5 inches, but NOWData reports 9.8 inches (NOWData governs)."
  - If a station closes or relocates, the NWS-designated successor station may be used. PAL is $25,000 per strike, per member. — [Kalshi NOWDATASNOW](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/NOWDATASNOW.pdf) [primary opened]

**The 2026 switch to The Weather Company**
- A trader-tool repository records the migration:
  - On **2026-09-04**, "all 40 live temperature ladder series moved from NWS to The Weather Company as publisher", under rulebook amendment "GLOBALTEMPERATURE-bulk-2026-09-02".
  - The rules now read "according to The Weather Company" but still name the NWS CLI station, e.g. "New York City (CLINYC)".
  - The rain series KXRAINNYC stays NWS-named.
  - Its audit found that after the migration 400 of 400 Kalshi settlement values matched the NWS CLI. Before the migration, 2,481 of 2,483 (99.92%) matched. It concludes TWC republishes the same station data rather than a derived value. — [nfliegelman/nimbus PR #17 (GitHub, third-party)](https://github.com/nfliegelman/nimbus/pull/17) [primary opened; third-party analysis]
- Example of the current rule wording: "If the maximum temperature recorded at New York City (CLINYC) for Sep 15, 2026, is greater than 77° fahrenheit according to The Weather Company, then the market resolves to Yes." This full sentence came from a search summary and I could not tell which page it quoted. The opened PR confirms the pattern: "according to The Weather Company" plus the named "New York City (CLINYC)" station. — [nimbus PR #17](https://github.com/nfliegelman/nimbus/pull/17); [Kalshi Help Center](https://help.kalshi.com/en/articles/13823837-weather-markets) [search summary — primary not opened]
- A second trader tool says Kalshi settles "on The Weather Company's reading at the station named in the rules". It reports that Kalshi's settlement matched the NWS CLI on 1,316 of 1,317 city-days. The one exception was Miami on 2026-08-29: Kalshi 90°F vs CLI 85°F. — [myfirstcodeo/kalshi-weather-fair-value (GitHub)](https://github.com/myfirstcodeo/kalshi-weather-fair-value) [primary opened; third-party, not independently verified]
- **Kalshi Help Center:**
  - Daily high and low markets settle "based on the final climate report issued by the National Weather Service (NWS), typically released the following morning."
  - "The only source used for settlement is the one named in the market's rules — the NWS Daily Climate Report for daily temperature markets, or The Weather Company for hourly temperature markets."
  - Other search summaries (it is unclear whether from the Help Center or wethr.net) say that daily high and low series "now settle on The Weather Company, not the NWS (Aug 2026)", while "precipitation and snowfall still settle on NWS". — [Kalshi Help Center: Weather Markets](https://help.kalshi.com/en/articles/13823837-weather-markets); [wethr.net trading guide](https://wethr.net/edu/trading-guide) [search summary — primary not opened]
  - **Conflict:** the Help Center wording may predate the switch, and the S3 GLOBALTEMPERATURE copy (2025-12-12) does not mention TWC.
- **Kalshi–TWC partnership**, announced 2026-08-27/28:
  - Kalshi will use TWC's "enterprise-grade weather data feeds as its trusted source for verifying weather hedging settlements". TWC "provides the authoritative observation data used to settle these markets with a consistent, documented methodology for each market type."
  - TWC will show Kalshi's real-time probabilities in "select experiences" on its app and website.
  - The two firms will explore new markets across climate, sports and culture, such as ski conditions and marathon weather. — [The Weather Company newsroom](https://www.weathercompany.com/news/kalshi-and-twco-partner/); [The Insurer, 2026-08-28](https://www.theinsurer.com/parametric-insurer/news/prediction-market-kalshi-partners-with-the-weather-company-for-settlement-data-2026-08-28/); [Bloomberg, 2026-08-27](https://www.bloomberg.com/news/articles/2026-08-27/kalshi-weather-odds-are-coming-to-a-weather-app-near-you); [Artemis.bm](https://www.artemis.bm/news/prediction-market-kalshi-partners-with-the-weather-company-for-weather-hedge-settlements/); [Kalshi News](https://news.kalshi.com/p/kalshi-weather-company-partnership) [search summary — primary not opened]

**Other weather products**
- **Hurricanes:**
  - Contracts settle on National Hurricane Center (NHC) advisories and post-storm reports.
  - Path contracts use regions drawn from US Census county shapefiles, and the storm must be at or above the wind threshold inside the region. "Post-storm reanalysis coordinates don't count — only advisories."
  - Backup sources, in order: NHC, NWS and NOAA; then The Weather Channel, AccuWeather, CNN Weather, AP, Reuters, NYT, Washington Post and WSJ.
  - Path rulebooks carry a $25,000 PAL per strike, per member. The long-term hurricane rulebook has a flat $25,000 per-member position limit. — [CFTC filing ptc06252524763 (file name suggests 2025-06-25)](https://www.cftc.gov/filings/ptc/ptc06252524763.pdf); [Covers](https://www.covers.com/entertainment/disaster-prediction-markets) [search summary — primary not opened]
- **September 2026 amendments:** Kalshi amended seven weather and climate rulebooks (snow accumulation, NYC rainfall, precipitation, hurricane strength). The new language covers "initially inaccurate or materially erroneous readings from official source agencies". It lets the exchange delay expiration when an initial non-preliminary report contains a material error and wait for revised data, up to the final expiration date. — [NextPredict: "Kalshi reins in weather market rules as manipulation concerns grow"](https://nextpredict.io/market-news/industry/kalshi-reins-weather-market-rules-manipulation-concerns/) [search summary — primary not opened]

**Cities and stations**
- NYC settles on Central Park (CLINYC/KNYC), Chicago on Midway (CLIMDW, not O'Hare), Los Angeles on LAX (CLILAX) and Austin on Bergstrom (CLIAUS, not Camp Mabry). Other index cities: Miami KMIA, Dallas–Fort Worth KDFW, Houston Hobby KHOU, Philadelphia KPHL, Seattle KSEA, San Francisco KSFO, Boston KBOS, Minneapolis–St Paul KMSP. — [Apify: Kalshi Weather Index](https://apify.com/gratified_ashram/kalshi-weather-index); [Better Weather Bettor](https://betterweatherbettor.com/) [search summary — primary not opened]
- Daily-high markets cover 24 US cities, including NYC, Chicago, Miami, Austin, Houston, DC, Denver, Atlanta and LA. — [kalshi-weather-fair-value](https://github.com/myfirstcodeo/kalshi-weather-fair-value) [primary opened; third-party]
- Denver settles on Denver International. Kalshi's day is in local standard time: 1 a.m. to 1 a.m. during daylight saving time. — [GitHub issue #76, dated 2026-09-19](https://github.com/suislanchez/polymarket-kalshi-weather-bot/issues/76) [primary opened; third-party]
- Some settlement stations differ systematically from forecast points. Warm: Miami +3.7°F, Austin +2.5°F, Philadelphia +1.9°F. Cool: LA −4.0°F, San Diego −3.4°F, NYC −1.1°F. — [kalshi-weather-fair-value](https://github.com/myfirstcodeo/kalshi-weather-fair-value) [primary opened; third-party]

**Volume and hedging use**
- Weather volume was $564M through July 2026, more than Kalshi's full-year 2025 total. Weather and climate volume is up about 500% year on year, and Kalshi expects about $1.1B in 2026. — [Yahoo Finance: "Kalshi Teams With The Weather Company, Expects $1.1B Weather Trading Volume in 2026"](https://finance.yahoo.com/markets/options/articles/kalshi-teams-weather-company-expects-161258992.html); [The Insurer](https://www.theinsurer.com/parametric-insurer/news/prediction-market-kalshi-partners-with-the-weather-company-for-settlement-data-2026-08-28/) [search summary — primary not opened]
- First privately negotiated weather block trade on Kalshi: Discrete, a Houston risk-management startup, bought a position that pays $25,000 if Houston reaches 103°F in August 2026. — [Yahoo Finance](https://finance.yahoo.com/markets/options/articles/kalshi-teams-weather-company-expects-161258992.html) [search summary — primary not opened]
- Third-party settlement-data products are sold to traders, for example "Kalshi Weather Markets + NWS Station Data [$0.02/city-day]" and "Kalshi Weather Settlement Audit – Index vs NWS vs Bracket". — [Apify listing](https://apify.com/perchpermits/kalshi-weather-markets-nws/api/python); [Apify audit](https://apify.com/gratified_ashram/kalshi-weather-index/examples/kalshi-temperature-settlement-audit-daily) [title only]

### Inferences
- The TWC switch changed who is named and paid, not what is measured. The station and observation are still the NWS/ASOS reading (400/400 CLI matches). The commercial deal bundles "trusted data" with distribution (Kalshi odds inside the TWC app). A new provider pitching Kalshi probably needs to bring more than raw observations: distribution, independence, cleaner timestamped first publication, or verifiability.
- GLOBALTEMPERATURE's hierarchy ("NWS, then the national weather service for <area>") already allows for non-US met services. For Korea that would mean KMA-designated stations by default. Rule 7.2 gives Kalshi a contractual route to name a new Source Agency if the current one's reliability is in doubt.
- Every Kalshi rulebook freezes the value at expiration and ignores later revisions ("first official non-preliminary report"). A settlement provider therefore has to prove what value was published first, and when. An append-only, hash-anchored publication log (for example on the XRPL) maps directly onto this requirement.
- Third-party audits put mismatches at roughly 0.04–0.08% of city-days (1/1,317 and 2/2,483). Errors are rare but real, and each one can trigger a dispute.

### Gaps
- I could not open the current market-level rules or the Help Center. Whether the amended rulebook itself names TWC as Source Agency, or only the market-level text does, is unverified.
- Not verified: the complete city list, the launch date of hourly-temperature markets, and the source for annual global-temperature markets (NOAA NCEI or NASA GISS).
- The commercial terms of the Kalshi–TWC deal (fees, exclusivity) were not found.
- Weather's share of Kalshi's total volume was not found.

## 2. Polymarket weather/temperature markets: resolution sources, the Paris CDG tampering case, other disputes

### Takeaway
Polymarket lists daily "Highest temperature in <city>" ladders for many cities worldwide, including Seoul (Incheon), Warsaw, Wuhan, Shenzhen and Kuala Lumpur. Each market resolves on a single airport station. International markets use Weather Underground (WU) history pages; some US markets use weather.gov/NOAA with WU as a fallback. Contested outcomes go to UMA's optimistic oracle.

The April 2026 Paris–Charles de Gaulle (CDG) case showed the weakness. One Météo-France sensor spiked twice (April 6 and 15), no nearby station recorded the spikes, and about $34k was paid out on markets that drew about $1.4M in bets. Météo-France filed a criminal complaint. Polymarket moved Paris to Le Bourget but left the resolved markets final.

### Cited Findings
**Resolution sources**
- Trader tool pages say:
  - "Most of Polymarket's daily temperature markets resolve from Weather.gov, but a few still resolve from the Weather Underground History tab."
  - Some markets fall back to WU's Daily Observations table "if NOAA data for the observation date is unavailable by 11:59 PM ET on the day following the observation date".
  - The NWS CLI sometimes reports a high 1°F or more above WU for the same station, because the peak was caught by a 6-hour max, DSM or other product that WU does not display.
  - Polymarket names airport METAR stations, e.g. KLGA, LAX, EGLC. — [wethr.net: Platform Differences](https://wethr.net/market-resolution); [vweatherstation](https://vweatherstation.com/prediction-markets/) [search summary — primary not opened]
- Seoul markets were titled "Highest temperature in Seoul on <date>" in April–May 2026 and "Highest temperature in Seoul (Incheon) on <date>" by August 2026. They resolve on Incheon International Airport (RKSI): the "highest temperature recorded for all times on the given day" as reported by Wunderground. — [Polymarket Seoul (Incheon) Aug 4, 2026](https://polymarket.com/event/highest-temperature-in-seoul-on-august-4-2026); [Polymarket Seoul Apr 23, 2026](https://polymarket.com/event/highest-temperature-in-seoul-on-april-23-2026); [vweatherstation Seoul (RKSI)](https://vweatherstation.com/prediction-markets/seoul/) [search summary — primary not opened]
- Global coverage, from market titles: Warsaw, Wuhan and Shenzhen (2026-09-27) and Kuala Lumpur (2026-05-15). — [Warsaw](https://polymarket.com/event/highest-temperature-in-warsaw-on-september-27-2026); [Wuhan](https://polymarket.com/event/highest-temperature-in-wuhan-on-september-27-2026); [Shenzhen](https://polymarket.com/event/highest-temperature-in-shenzhen-on-september-27-2026); [Kuala Lumpur](https://polymarket.com/event/highest-temperature-in-kuala-lumpur-on-may-15-2026) [title only]
- Kalshi and Polymarket use different stations for the same city (third-party, 2026-09-19): Chicago is Midway (KMDW) on Kalshi and O'Hare (KORD) on Polymarket. NYC is Central Park vs LaGuardia; Denver is Denver International vs Buckley SFB. "Miami and LA also have similar station mismatches." The issue's point: "one venue is always off" when the same forecast feeds both. — [GitHub issue #76](https://github.com/suislanchez/polymarket-kalshi-weather-bot/issues/76) [primary opened; third-party]
- **Dispute process:** resolution runs through the UMA Optimistic Oracle. A proposer posts the outcome with a bond, which opens a two-hour challenge window. A first dispute resets the proposal once; a further dispute escalates to a vote of UMA token holders. — [Turbine: How prediction markets resolve (2026)](https://www.turbinefi.com/blog/how-prediction-markets-resolve-oracles-disputes-2026); [Polymarket docs: Resolution](https://docs.polymarket.com/concepts/resolution); [PolyMart weather guide](https://polymart.app/blog/polymarket-weather-markets) [search summary — primary not opened]
- **Criticism of the oracle:** over 60% of active UMA voters also hold Polymarket accounts, and in more than 300 disputes voters had a direct financial interest in the outcome. Polymarket says only 0.2% of bets require arbitration. — [KuCoin news flash](https://www.kucoin.com/news/flash/polymarket-dispute-resolution-system-under-scrutiny-as-uma-voting-raises-fraud-concerns); [Webopedia](https://www.webopedia.com/crypto/learn/polymarkets-uma-oracle-controversy/) [search summary — primary not opened; low-reliability aggregator]

**Paris–Charles de Gaulle tampering case (April 2026)**
- **Complaint:** Météo-France filed a complaint with the Roissy air-transport gendarmerie brigade for "alteration of the operation of an automated data processing system", after analysing the sensor data. CNN describes the complaint as concerning the "tampering of an automated data processing system" at CDG, "used to measure daily temperatures for Paris". — [Europe 1](https://www.europe1.fr/police-justice/polymarket-meteo-france-porte-plainte-pour-lalteration-dune-sonde-soupcon-de-manipulations-liees-a-des-paris-927656); [CNN, 2026-04-23](https://www.cnn.com/2026/04/23/europe/france-weather-sensor-polymarket-bet-intl-latam) [search summary — primary not opened]
- **Timeline:**
  - April 6, 2026, around 7 p.m. local time: the CDG sensor "rose suddenly to 22 degrees Celsius" and then fell back. A Polymarket user won about $14,000 on 22°C.
  - April 15: the sensor again hit 22°C, four degrees above the previous day. A user won about $20,000.
  - A French weather association first raised the suspicion. — [CNN](https://www.cnn.com/2026/04/23/europe/france-weather-sensor-polymarket-bet-intl-latam); [NPR, 2026-04-23](https://www.npr.org/2026/04/23/nx-s1-5797876/polymarket-paris-weather-bet) [search summary — primary not opened]
- **Bloomberg's account (2026-04-23, syndicated by Insurance Journal):**
  - Readings spiked 4°C and 5°C in the evenings of April 6 and 15, becoming the site's daily highs.
  - Analytics firm Bubblemaps found that no other station in the area recorded the spike.
  - The contracts drew about $1.4M in combined bets. The two bets paid $34,000, and the winning bet was about 20 times the trader's usual size. — [Insurance Journal (Bloomberg)](https://www.insurancejournal.com/news/international/2026/04/23/867026.htm); [Bloomberg](https://www.bloomberg.com/news/articles/2026-04-23/france-probes-weather-data-glitch-after-surge-in-polymarket-bets) [search summary — primary not opened]
- According to Europe 1, a newly created Polymarket account turned a small bet into about $14,000. — [Europe 1](https://www.europe1.fr/police-justice/polymarket-meteo-france-porte-plainte-pour-lalteration-dune-sonde-soupcon-de-manipulations-liees-a-des-paris-927656) [search summary — primary not opened]
- **Payout figures conflict across outlets:**
  - Yahoo Finance headline: "Polymarket just paid out $21,398 on a $119 weather bet — after a Paris airport sensor spiked 6°C in seconds".
  - Euronews: a "€25,000 win".
  - fibo-crypto: "$34K Won, Criminal Charges Filed".
  - The differences probably reflect different accounts, days and currencies (my inference). — [Yahoo Finance](https://finance.yahoo.com/markets/options/articles/polymarket-just-paid-21-398-153000011.html); [Euronews, 2026-04-23](https://www.euronews.com/business/2026/04/23/hair-dryer-trick-behind-25000-win-france-probes-potential-weather-data-scam-linked-to-poly); [fibo-crypto](https://fibo-crypto.fr/en/blog/polymarket-weather-sensor-manipulation-paris-meteo-france-2026/) [title only / search summary — primary not opened]
- A heat source such as a hair dryer is suspected but not confirmed. — [Euronews](https://www.euronews.com/business/2026/04/23/hair-dryer-trick-behind-25000-win-france-probes-potential-weather-data-scam-linked-to-poly); [Insurance Journal (Bloomberg)](https://www.insurancejournal.com/news/international/2026/04/23/867026.htm) [search summary — primary not opened]
- Polymarket's response: it switched Paris resolution from CDG to Paris–Le Bourget. It did not cancel the contracts or refund bets, so the resolved contracts stayed final. — [Les Enjeux, 2026-04-24](https://les-enjeux.com/2026/04/24/polymarket-thermometre-manipulation/); [Carmaux Actu](https://carmaux-actu.fr/polymarket-sous-enquete-apres-la-manipulation-presumee-dun-capteur-meteo-france/); [CNN](https://www.cnn.com/2026/04/23/europe/france-weather-sensor-polymarket-bet-intl-latam) [search summary — primary not opened]
- A search summary also claimed that "regulators blocked Polymarket nationwide by July 2026". No source was attributed and I saw no primary; see Gaps.
- Same week, for context: the US charged a soldier in a separate, non-weather prediction-market insider case. Coverage framed both as a deepening manipulation problem. — [Blockhead, 2026-04-24](https://www.blockhead.co/2026/04/24/prediction-markets-manipulation-problem-deepens-as-france-probes-weather-rigging-us-charges-soldier/); [Yahoo Finance](https://finance.yahoo.com/markets/crypto/articles/polymarket-cheating-alleged-tampered-weather-080201282.html) [title only]

**Size**
- An aggregator figure puts weather at about $1.5M, roughly 0% of Polymarket's volume for September 2026, with "463+ active weather markets with $1.3M+ in volume". **Untraceable:** it was not clear which page this came from. It also looks too low next to about $1.4M on the two Paris contracts alone in April. — [DeFi Rate Polymarket volume](https://defirate.com/prediction-markets/volume/polymarket/); [PolyMart](https://polymart.app/blog/polymarket-weather-markets) [search summary — primary not opened]
- Context:
  - Polymarket's monthly volume peaked at $10.5B in March 2026 and was $8.9B in May 2026. — [Sacra](https://sacra.com/c/polymarket/) [search summary — primary not opened]
  - Combined Kalshi and Polymarket monthly volume rose from under $5B (September 2025) to about $24B (April 2026). — [Pew Research, 2026-05-27](https://www.pewresearch.org/short-reads/2026/05/27/trading-volume-on-prediction-markets-has-soared-in-recent-months/) [search summary — primary not opened]
- Older item (January 2025): more than $1.2M was wagered on Polymarket over two weeks on the Los Angeles wildfire markets. — [GamingToday](https://www.gamingtoday.com/news/climate-prediction-markets-surge-as-kalshi-and-polymarket-expand-weather-betting/) [search summary — primary not opened; older item]

### Inferences
- Polymarket settles on one airport sensor, read through a consumer website (WU), with an optimistic oracle behind it. None of these layers can detect tampering at the sensor. The CDG fix (switching station) moved the single point of failure; it did not remove it.
- Outside analysts caught the CDG spike by checking neighbouring stations (Bubblemaps). An automatic neighbour-consistency check, backed by tamper-evident sensor records, is a concrete feature a data vendor could sell.
- The Seoul (Incheon, RKSI) market is a direct opening for a Korean vendor. Options include a verified second feed for RKSI, an anomaly-flag service, or a proposed multi-station "Seoul" index built from KMA ASOS stations plus the vendor's own sensors, with readings anchored on the XRPL.
- Kalshi and Polymarket use different stations for the same city, which shows there is no shared standard for city temperature. That leaves room for a neutral index provider.

### Gaps
- Not verified, because polymarket.com and docs.polymarket.com were blocked: the current rules text (ICAO station per city, WU vs NOAA per market, rounding, and the cut-off for revisions), the size of UMA bonds, and the list of cities.
- The outcome of the French investigation after April 2026 (suspects, charges) was not found. The claim that France blocked Polymarket "by July 2026" is unverified. France's gaming regulator (ANJ) may have acted against Polymarket earlier, but that was not checked in this session.
- No reliable figure for Polymarket's weather volume.
- I found no other confirmed weather-market manipulation cases in 2025–2026 beyond CDG. The search budget ran out, so this is not a negative finding.

## 3. ForecastEx (IBKR) climate/temperature contracts, and CME weather futures/options

### Takeaway
ForecastEx is IBKR's CFTC-regulated exchange, live since 2024-08-01. It lists long-dated global-temperature contracts (1.15–1.6°C above the 20th-century average, expiring out to January 2036), contracts on NOAA's monthly US temperature release, and, since about November 2025, daily-high-temperature contracts. Those started with 10 US cities, and more were added on 2026-02-12.

CME's HDD/CDD futures and options settle on NWS station data processed by Speedwell Settlement Services. That replaced the historical Earth Satellite Corp. index. Vaisala announced its acquisition of Speedwell in September 2024 and folded it into Xweather. I found no CME event contract on weather.

### Cited Findings
- ForecastEx LLC is a CFTC-regulated IBKR subsidiary that began operations on 2024-08-01. Its contracts pay $1 or $0 and are based on official data releases. — [BusinessWire, 2024-07-31](https://www.businesswire.com/news/home/20240731154670/en/Interactive-Brokers-Launches-Forecast-Contracts-on-Economic-and-Climate-Indicators); [ForecastEx FAQ](https://forecastex.com/faq) [search summary — primary not opened; older item]
- Global-temperature contracts have thresholds from 1.15°C (2.07°F) to 1.6°C (2.88°F) above the 20th-century average, with expiries from January 2025 to January 2036. — [IBKR Campus: Using Prediction Markets to Hedge](https://www.interactivebrokers.com/campus/trading-lessons/prediction-markets-to-hedge/); [FX News Group](https://fxnewsgroup.com/forex-news/retail-forex/interactive-brokers-introduces-forecast-contracts-on-economic-and-climate-indicators/) [search summary — primary not opened]
- A ForecastEx CFTC filing (January 2025) lists one contract per monthly NOAA "US Temperature" release. — [CFTC filing ptc01012512998](https://www.cftc.gov/sites/default/files/filings/ptc/25/01/ptc01012512998.pdf) [search summary — primary not opened]
- **Daily high temperature contracts:**
  - Launched for "an initial offering of 10 US cities". The announcing post's ID decodes to 2025-11-25; that decoding is my inference.
  - IBKR's "New US Cities Added to Daily High Temperature Contract List" is dated 2026-02-12. Cities include NYC, Denver, Las Vegas and LA.
  - IBKR publishes daily "Fair Value Weather & Climate" notes (e.g. 2026-08-03, 08-17, 08-31).
  - A terms-and-conditions PDF exists but could not be opened. — [Patrick T. Brown on X](https://x.com/PatrickTBrown31/status/1993408460944556075); [IBKR Campus, 2026-02-12](https://www.interactivebrokers.com/campus/traders-insight/forecast-trader/new-us-cities-added-to-daily-high-temperature-contract-list/); [IBKR Campus: Daily High Temperature Markets at ForecastEx](https://www.interactivebrokers.com/campus/traders-insight/ibkr-climate-energy/daily-high-temperature-markets-at-forecastex/); [IBKR Fair Value Weather & Climate, 2026-08-03](https://ibkrcampus.com/campus/traders-insight/prediction-market/fair-value-weather-climate-monday-august-3-2026/); [ForecastEx Daily Temperature T&C](https://data.forecastex.com/regulatory/DailyTemperatureTermsandConditions.pdf) [search summary — primary not opened]
- **CME settlement data:** weather futures are "based on temperature data from the National Weather Service and processed by Speedwell Settlement Services Ltd." Earlier contracts settled to the CME HDD/CDD index "as calculated by Earth Satellite Corp.", which was since replaced by Speedwell. — [CME: Overview of Weather Markets](https://www.cmegroup.com/education/lessons/overview-of-weather-markets); [CME Rulebook Chapter 403](https://www.cmegroup.com/rulebook/CME/IV/400/403/403.pdf) [search summary — primary not opened]
- For US cities, the contract unit is $20 × the HDD or CDD index. — [CME: Hedging Weather Risk](https://www.cmegroup.com/education/lessons/hedging-weather-risk.html) [search summary — primary not opened]
- **CME daily settlement:** prices are set from trades before 15:00 CT. With no trades, "the 1D movement for the corresponding month of Speedwell will be applied". — [CME Client Systems Wiki: Weather](https://cmegroupclientsite.atlassian.net/wiki/display/EPICSANDBOX/Weather) [search summary — primary not opened]
- Rulebook chapters: 403 (CME Degree Days Index Futures) and 405 (CME Seasonal Strip Degree Days Index Futures). — [Ch. 403](https://www.cmegroup.com/rulebook/CME/IV/400/403/403.pdf); [Ch. 405](https://www.cmegroup.com/rulebook/CME/IV/400/405/405.pdf) [title only]
- **Speedwell:**
  - Founded in 1999. It provides the "data and software necessary to structure, price, transact and clear index-based environmental risk-transfer contracts" for temperature, rainfall and renewable energy.
  - Speedwell Settlement Services calls itself "the leading provider of meteorological Settlement Data for index-based weather risk contracts worldwide". It has supplied settlement data for OTC and CME-listed contracts "for the past decade".
  - Clients: re/insurers, investment funds including insurance-linked securities (ILS), renewable-energy corporates, and CME Group. — [Speedwell Climate](https://www.speedwellclimate.com/); [Speedwell Settlement Services: About](https://www.speedwellsettlementservices.com/en/About); [Artemis: CME weather contracts to use Speedwell data](https://www.artemis.bm/news/cme-weather-contracts-to-use-speedwell-data-for-settlement-valuation/) [search summary — primary not opened; Artemis item date not captured, likely older]
- **Vaisala's acquisition of Speedwell:**
  - Announced September 2024; 24 staff transferred, and closing was expected in Q4 2024 (completion was later reported).
  - It marked Vaisala's entry into insurance and grows its "subscription-based business". CME Group was named a leading customer.
  - Speedwell joined Xweather, and the settlement site is now titled "Xweather settlement services". — [Vaisala press release (2024-09)](https://www.vaisala.com/en/press-releases/2024-09/vaisala-acquires-speedwell-climate-help-organizations-mitigate-weather-related-financial-risks); [The Insurer: Vaisala completes Speedwell acquisition](https://www.theinsurer.com/parametric-insurer/news/vaisala-completes-speedwell-climate-acquisition/); [Xweather settlement services](https://www.speedwellsettlementservices.com/) [search summary — primary not opened; 2024 item]
- CME Group overall set a record 2025 average daily volume of 28.1M contracts, and a record July 2026 at 27M (+23% year on year). These figures are not weather-specific. — [CME press release, 2026-01-05](https://www.cmegroup.com/media-room/press-releases/2026/1/05/cme_group_reportsrecordannualadvof281millioncontractsin2025up6ye.html); [CME press release, 2026-08-04](https://www.cmegroup.com/media-room/press-releases/2026/8/04/cme_group_july_volumehitsnewrecordof27millioncontractsup23yearov.html) [search summary — primary not opened]

### Inferences
- Listed weather derivatives already buy settlement data through a specialist: NWS data goes to Speedwell/Xweather for cleaning and versioning, and then to CME, which pays by subscription. Kalshi's TWC deal copies that structure for prediction markets. Incumbents are therefore large met-tech vendors (Vaisala/Xweather, TWC), not public agencies directly.
- No listed Korean or Asian weather contract was found at CME or ForecastEx. Whether Speedwell/Xweather already cleans KMA station data for OTC deals is unknown, and would be worth checking before pitching.

### Gaps
- Not verified: the CME weather city list (US and Europe), current weather-specific volume and open interest, the Earth Satellite → Speedwell transition date, and any CME or FanDuel event contracts on weather.
- ForecastEx's daily-temperature settlement source (the stations and whether it is the NWS CLI) and the task brief's "CO2" climate contract were not verified because the T&C PDF and IBKR pages were blocked.

## 4. Other platforms with weather markets (Robinhood, Crypto.com/OG, DraftKings/FanDuel, crypto-native)

### Takeaway
Robinhood, through its futures commission merchant (FCM) Robinhood Derivatives, and Crypto.com's OG, through its own CFTC-registered exchange CDNA, both list weather and climate contracts: daily high/low temperatures, rain, snow, hurricanes and more. I could not verify their settlement sources. I found nothing on weather contracts at DraftKings or FanDuel, or at crypto-native venues other than Polymarket.

### Cited Findings
- Robinhood's climate contracts include "daily high and low temperatures, monthly snowfall and rainfall, hurricane landfall odds, annual heat year rankings, tornado counts, and earthquake frequency". A live example is "Chicago Daily Temperature Low September 28 2026". They are offered by Robinhood Derivatives, LLC, a registered FCM. — [Robinhood Learn: Trading Climate & Weather Event Contracts](https://robinhood.com/us/en/learn/articles/trading-climate-weather-event-contracts/); [Robinhood daily high temperature](https://robinhood.com/us/en/prediction-markets/climate/daily-high-temperature/); [Robinhood Chicago low, 2026-09-28](https://robinhood.com/us/en/prediction-markets/climate/events/chicago-daily-temperature-low-september-28-2026-sep-28-2026/) [search summary — primary not opened]
- Robinhood's own explainer says climate contracts "are resolved by definitions, data sources, location, and timing". — [Robinhood Learn](https://robinhood.com/us/en/learn/articles/trading-climate-weather-event-contracts/) [search summary — primary not opened]
- Crypto.com launched OG, a prediction platform "powered by Crypto.com Derivatives North America (CDNA)", a CFTC-registered exchange and clearinghouse. OG puts weather in its climate category. Contracts "depend on the location, dataset, measurement window and settlement source written into the rules". — [PYMNTS (2026)](https://www.pymnts.com/news/investment-tracker/2026/crypto-com-launches-prediction-market-platform-in-us/); [OG.com: How to trade weather and climate prediction markets](https://og.com/learn/how-to-trade-weather-and-climate-prediction-markets); [Legal Sports Report (Aug 2026)](https://www.legalsportsreport.com/prediction-markets/weather/) [search summary — primary not opened]
- A trader site publishes a page on resolution differences between Kalshi, Polymarket, Robinhood and IBKR. — [wethr.net: Platform Differences](https://wethr.net/market-resolution) [title only]

### Inferences
- Retail front-ends such as Robinhood (and TWC's app, for Kalshi odds) distribute contracts, but the choice of settlement source sits with the exchange that lists them: Kalshi, ForecastEx, CDNA, or Polymarket's own rules. The pitch targets are therefore Kalshi, ForecastEx/IBKR, CDNA (Crypto.com) and Polymarket, plus whichever exchange lists Robinhood's own contracts.

### Gaps
- Not verified: which exchange lists Robinhood's weather contracts and what their source is; OG/CDNA's weather settlement sources; whether DraftKings Predictions or FanDuel Predicts list weather; and weather markets on crypto-native venues other than Polymarket. The search budget ran out before these could be checked.

## 5. Weather-data vendors that supply settlement or index data to exchanges and insurers

### Takeaway
Today's buyers of settlement-grade weather data are:
- **Exchanges:** Kalshi buys from TWC (from August/September 2026); CME uses Speedwell, now Vaisala Xweather.
- **Re/insurers and ILS funds:** Speedwell's customers, and Descartes, which works with 80+ data partners.
- **Parametric insurtechs:** Arbol with its dClimate network, and Chainlink-oracle projects such as Etherisc and Shamba.
- **DePIN licensees:** WeatherXM auctions a small number of annual commercial data licences.

Payment models seen in sources: subscriptions (Speedwell/Vaisala), annual licence auctions (WeatherXM), and data-plus-distribution partnerships (TWC–Kalshi, terms undisclosed).

### Cited Findings
- **The Weather Company** supplies Kalshi's "enterprise-grade weather data feeds" for settlement, and in return shows Kalshi probabilities in the TWC app and website (announced 2026-08-27/28). — [The Insurer](https://www.theinsurer.com/parametric-insurer/news/prediction-market-kalshi-partners-with-the-weather-company-for-settlement-data-2026-08-28/); [Kalshi and TWC partnership (Prediction News)](https://predictionnews.com/story/the-weather-company-partners-with-kalshi); [Markets Media](https://www.marketsmedia.com/kalshi-partners-with-the-weather-company/) [search summary — primary not opened]
- **Speedwell / Vaisala Xweather** supply settlement data for CME and OTC weather contracts; buyers are re/insurers, ILS funds, renewable-energy firms and CME Group; revenue is subscription-based. See §3 for sources. [search summary — primary not opened]
- **Descartes Underwriting:**
  - Uses "80+ trusted sources including NASA, NOAA, and ECMWF", plus high-resolution satellite imagery, IoT sensors, ground radar and public weather stations. It uses site-level wind data from met stations for solar-plant covers.
  - Capacity for 2026 is €80M–€140M per policy.
  - Recent products: up to $140M of parametric cover for data centers, and an extreme-wind product with Nextpower. — [Descartes FAQ](https://descartesunderwriting.com/faq); [Descartes technology](https://descartesunderwriting.com/about/our-technology-action); [Descartes data-center cover](https://descartesunderwriting.com/newsroom/descartes-launches-parametric-insurance-protection-140m-data-centers); [Reinsurance News](https://www.reinsurancene.ws/descartes-and-nextpower-launch-parametric-insurance-solution-for-extreme-wind-conditions/) [search summary — primary not opened]
- **Arbol / dClimate:**
  - Arbol's parametric payouts use "objective, third-party metrics like publicly verifiable climate and weather data sources".
  - dClimate is a decentralized, blockchain-based climate-data network built by Arbol. The summary credits it with satellite data, 50M+ grid points, "120+ weather stations" (the figure looks garbled) and 1,000+ TB of data, used by 1,000+ API clients in construction, finance and insurance.
  - Mark Cuban invested, and the marketplace is described as Chainlink-powered. — [Arbol: Introduction to dClimate](https://www.arbol.io/post/an-introduction-to-dclimate-a-decentralized-network-for-climate-data-2); [Artemis: dClimate gets Mark Cuban investment](https://www.artemis.bm/news/arbols-climate-data-network-dclimate-gets-mark-cuban-investment/); [Chainlink Today](https://chainlinktoday.com/arbol-founders-launching-chainlink-powered-decentralized-weather-and-climate-data-marketplace-dclimate/) [search summary — primary not opened; dates not captured, likely 2021–2022]
- **Chainlink:**
  - Its weather oracles serve Arbol and Etherisc for parametric crop insurance: for example, paying out when an oracle confirms rainfall below a threshold.
  - A Chainlink–AccuWeather partnership brings weather data on-chain; the date was not captured and it is probably older.
  - Shamba Network integrated Chainlink for smallholder parametric cover. Lemonade's blockchain-based crop cover reached 7,000 Kenyan farmers. — [AccuWeather press release](https://www.accuweather.com/en/press/chainlink-and-accuweather-to-bring-world-class-weather-data-on-to-blockchains/994046); [Chainlink blog: parametric insurance](https://blog.chain.link/parametric-insurance-smart-contract/); [Arbol + Chainlink](https://www.arbol.io/post/businesses-and-farmers-can-now-hedge-weather-risk-through-the-arbol-platform-and-chainlink-data); [Shamba](https://medium.com/@shambanetwork/shamba-integrates-chainlink-oracle-technology-to-power-parametric-insurance-for-smallholder-farmers-ae16a84b9be3); [Plisio (2026)](https://plisio.net/blog/blockchain-insurance) [search summary — primary not opened; mostly older items]
- **WeatherXM (a DePIN weather network):**
  - The WeatherXM Network Association auctions four commercial data licences a year. Each runs for one year (January 1 to December 31) and allows value-added services, resale of data by REST API, and use in proprietary models.
  - The 2025 auction ended with WeatherXM AG as the only 2025 licensee; that licence underpins "WeatherXM Pro".
  - Zeus, a Bittensor subnet, gets data access through a commercial licence.
  - 2,270 stations were deployed to underserved areas through a SwissBorg partnership. 30 high-precision stations were planned for the Peloponnese, Greece, in February–April 2026.
  - The company raised $7.7M. — [WeatherXM docs: Data Licensing](https://weatherxm.network/docs/data-licensing); [WeatherXM blog: 2025 commercial data license](https://blog.weatherxm.com/we-acquired-one-of-the-2025-weatherxm-commercial-data-licenses-bb9487bf33f0?gi=3000397d6d33); [DePIN Scan, 2025-01-03](https://depinscan.io/news/2025-01-03/weatherxm-disrupting-the-weather-data-industry-in-2025); [SwissBorg](https://swissborg.com/alpha/weatherxm); [WeatherXM $7.7M raise](https://blog.weatherxm.com/weatherxm-raises-7-7m-to-become-the-largest-weather-network-in-the-world-press-release-6c75e041708a?gi=0ff752a2fe16) [search summary — primary not opened]
- **Trader-facing data vendors** sell station data and settlement audits to prediction-market traders: Apify actors priced "$0.02/city-day", wethr.net, vweatherstation, Polydata and Better Weather Bettor. — [Apify](https://apify.com/perchpermits/kalshi-weather-markets-nws/api/python); [Polydata](https://polydata.pro/weather); [Better Weather Bettor](https://betterweatherbettor.com/) [title only]

### Inferences
- There are two tiers of buyer:
  - Exchange and insurer "settlement-of-record" buyers pay large vendors for certified, versioned data: TWC, Vaisala/Xweather, and Descartes' data partners.
  - Traders and bots buy cheap station-level feeds and audits, down to $0.02 per city-day.
  
  A Korean index and verified-sensor vendor could target the first tier, specifically as a second, independent verification source. It could monetise the second tier through API sales of Seoul and Asia station data and audits.
- The DePIN precedent (WeatherXM) is licence auctions and API resale. I found no case of a DePIN network being named as the settlement source for an exchange-listed contract, so that remains unproven ground.

### Gaps
- Not researched after the search budget ran out: DTN, Tomorrow.io, TWC's current ownership (IBM's successor), Etherisc's current status, and Nephila and other parametric capital providers.
- The price of settlement-data contracts is not public in any source found.
- I found no deal between WeatherXM or any other DePIN network and a prediction-market exchange.

## 6. Regulatory angle: CFTC treatment of weather event contracts, and what an exchange needs from a settlement source

### Takeaway
The CFTC staff advisory of 2026-09-22 (Letter No. 26-27) is about "mention markets", not weather. Its tests, though, are whether the settling fact can be independently generated and externally verified, and whether oversight can detect manipulation. The Paris CDG case exposes exactly those weaknesses in single-sensor weather contracts.

Kalshi's rulebooks show what an exchange needs from a source:
- a named Source Agency, with fallbacks in a fixed order;
- a designated official station;
- the first non-preliminary report, used at full precision;
- a freeze at expiration, after which revisions do not count;
- rules for missing data and station closure;
- a mechanism to delay settlement for erroneous data (added September 2026);
- the power to name a new Source Agency.

### Cited Findings
- **CFTC Letter No. 26-27** (2026-09-22) is a Division of Market Oversight staff advisory on "mention market" contracts, which settle on an individual's speech, attendance or interactions.
  - It says these are more susceptible to manipulation because settlement depends on discrete conduct "which may not be independently generated or externally verifiable".
  - A person who controls the outcome could trigger it, prevent it, or know it before others.
  - Exchanges should weigh four factors: the subject's outside obligations; external pressures on the subject; whether the words or actions "can be independently verified"; and whether oversight is sufficient to detect manipulation. — [CNBC, 2026-09-22](https://www.cnbc.com/2026/09/22/cftc-prediction-markets-mentions-contracts-have-manipulation-risk.html); [Reed Smith](https://www.reedsmith.com/our-insights/blogs/viewpoints/102o2yy/cftc-issues-advisory-on-mention-market-event-contracts/); [Yogonet, 2026-09-23](https://www.yogonet.com/international/news/2026/09/23/126522-cftc-warns-prediction-markets-over-manipulation-risks-in-mention-contracts); [Covers](https://www.covers.com/industry/cftc-warns-of-mention-markets-heightened-risk-of-manipulation-sept-23-2026) [search summary — primary not opened]
- A CFTC enforcement document titled "Advisory on Enforcement Authority over Event Contracts" exists; its file name suggests 2026-02-25. — [CFTC](https://www.cftc.gov/media/13351/Enf_AdvisoryKalshi022526/download) [title only — content not verified]
- A Congressional Research Service legal sidebar (LSB11441) is titled "CFTC Issues Proposed Rule Regarding Prediction Markets". — [Congress.gov](https://www.congress.gov/crs-product/LSB11441) [title only — content not verified]
- A Kalshi certification filing for a generic "<maximum/minimum/average> <area>" temperature contract exists; its file name suggests 2026-03-05, and it matches the GLOBALTEMPERATURE template. — [CFTC filing ptc03052640383](https://www.cftc.gov/sites/default/files/filings/ptc/26/03/ptc03052640383.pdf) [title only]
- Source requirements written into Kalshi's rulebooks:
  - Source Agency hierarchy, official/primary station, "first official non-preliminary report", full precision, and last fair price if no data. — [GLOBALTEMPERATURE](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/GLOBALTEMPERATURE.pdf) [primary opened]
  - Missing data, successor stations, and post-expiration corrections ignored. — [NOWDATASNOW](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/NOWDATASNOW.pdf) [primary opened]
  - METAR consistency check before settling. — [NHIGH](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/NHIGH.pdf) [primary opened]
  - Rule 7.2 re-designation of the Source Agency. — [RAINNYC](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/RAINNYC.pdf) [primary opened]
  - Delay for erroneous data, added September 2026. — [NextPredict](https://nextpredict.io/market-news/industry/kalshi-reins-weather-market-rules-manipulation-concerns/) [search summary — primary not opened]

### Inferences
- **Requirements checklist for a settlement source**, drawn from the rulebooks and the CFTC advisory's factors:
  1. Independence from market participants, and from the station operator's own staff.
  2. External verifiability: a public, archived value per station per day.
  3. A clearly designated station, with successor rules.
  4. First-publication immutability with timestamps.
  5. A written revision and correction policy.
  6. Redundancy and consistency checks (METAR vs CLI; neighbouring stations).
  7. Publication by a fixed time (7–10 AM ET for Kalshi).
  8. Continuity and fallbacks.
  
  Readings with tamper-evident hashes anchored on the XRPL speak to items 2, 4 and 5. Multi-sensor or neighbour checks speak to item 6, the gap the CDG case exposed.
- The advisory's logic ("independently generated or externally verifiable") gives exchanges a regulatory reason to add verification layers even for data-driven contracts. That argument is my inference; I found no CFTC text applying it to weather.

### Gaps
- No CFTC statement specific to weather contracts or the CDG incident was found. Also not verified: the content of the CFTC proposed rule, the February 2026 enforcement advisory, and any public-interest review of weather contracts.
- No non-US regulator has been found overseeing weather prediction contracts, including any Korean view on such contracts.

## 7. Documented pain points in weather settlement, and proposed fixes (multi-source, cryptographic attestation, DePIN)

### Takeaway
The documented pain points are:
- a single sensor can be tampered with (CDG, April 2026);
- NWS data is preliminary and gets revised, so exchanges freeze at expiration and ignore later corrections;
- settlement waits for the next morning's report and can be delayed;
- sources disagree (CLI vs WU, UTC vs local standard time, different stations per venue);
- settlement errors are rare (about 0.04–0.08%) but real;
- stations close or automate, which shrinks manual snow coverage;
- oracle governance is contested (UMA).

The fixes seen so far are mostly procedural: a METAR cross-check, erroneous-data delays, switching stations, and paying a commercial publisher (TWC). I found no sourced proposal for cryptographic attestation of sensor data for prediction-market settlement. DePIN and on-chain oracle precedents exist only in parametric insurance and data licensing.

### Cited Findings
- **Single-station tampering:** CDG readings spiked on April 6 and 15, 2026, and "no other weather station in the area recorded the temperature spike" (Bubblemaps). Polymarket's remedy was to switch to Le Bourget. — [Insurance Journal (Bloomberg)](https://www.insurancejournal.com/news/international/2026/04/23/867026.htm); [Les Enjeux](https://les-enjeux.com/2026/04/24/polymarket-thermometre-manipulation/) [search summary — primary not opened]
- **Preliminary data and revisions:** NWS says its data "are preliminary" and "subject to revision", and Kalshi ignores revisions after expiration. Its snow rulebook's own example: "NCEI issues a correction 45 days later changing the total from 9.5 to 10.2 inches (post-Expiration revisions do not apply)". — [NHIGH](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/NHIGH.pdf); [NOWDATASNOW](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/NOWDATASNOW.pdf) [primary opened]
- **Erroneous official data:** the September 2026 Kalshi amendments add delay-and-wait procedures for "materially erroneous" readings from source agencies. — [NextPredict](https://nextpredict.io/market-news/industry/kalshi-reins-weather-market-rules-manipulation-concerns/) [search summary — primary not opened]
- **Delays and cross-checks:** NHIGH settlement is delayed to 11 AM ET if the CLI high is inconsistent with METAR 6-hour or 24-hour highs, or if the final report's high is lower than an earlier report's. — [NHIGH](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/NHIGH.pdf) [primary opened]
- **Hurricanes:** only NHC advisories count; post-storm reanalysis is ignored. — [CFTC filing ptc06252524763](https://www.cftc.gov/filings/ptc/ptc06252524763.pdf); [Covers](https://www.covers.com/entertainment/disaster-prediction-markets) [search summary — primary not opened]
- **Sources disagree:** the NWS CLI can exceed WU by 1°F or more because of 6-hour max and DSM products. Venues use different stations (Midway vs O'Hare, Central Park vs LaGuardia, Denver International vs Buckley). Free forecast APIs aggregate over the UTC day, while Kalshi uses local standard time. — [wethr.net](https://wethr.net/market-resolution) [search summary — primary not opened]; [GitHub issue #76](https://github.com/suislanchez/polymarket-kalshi-weather-bot/issues/76) [primary opened; third-party]
- **Settlement mismatches:** 2 in 2,483 before the TWC migration and 0 in 400 after. Separately, one in 1,317 (Miami, 2026-08-29: 90°F vs 85°F). — [nimbus PR #17](https://github.com/nfliegelman/nimbus/pull/17); [kalshi-weather-fair-value](https://github.com/myfirstcodeo/kalshi-weather-fair-value) [primary opened; third-party]
- **Station coverage and automation:** Kalshi lists snow markets only at stations with manual snow observation, excluding automated-only precipitation stations. Station closure or relocation triggers successor-station or Rule 7.1 handling. — [NOWDATASNOW](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/NOWDATASNOW.pdf) [primary opened]
- **Coverage outside the US:**
  - Kalshi's generic temperature rulebook falls back to "the national weather service for <area>", e.g. the BoM or Met Office. — [GLOBALTEMPERATURE](https://kalshi-public-docs.s3.amazonaws.com/contract_terms/GLOBALTEMPERATURE.pdf) [primary opened]
  - Polymarket's international markets rely on WU pages for single airport stations such as RKSI. — [vweatherstation Seoul](https://vweatherstation.com/prediction-markets/seoul/) [search summary — primary not opened]
- **Oracle governance:** UMA voter conflicts of interest are alleged (low-reliability source). — [KuCoin](https://www.kucoin.com/news/flash/polymarket-dispute-resolution-system-under-scrutiny-as-uma-voting-raises-fraud-concerns) [search summary — primary not opened]
- **Existing on-chain and DePIN precedents** (insurance and data, not prediction-market settlement):
  - Chainlink oracles trigger parametric payouts from weather APIs and sensors (Arbol, Etherisc). — [Chainlink: What is parametric insurance](https://chain.link/article/what-is-parametric-insurance) [search summary — primary not opened]
  - dClimate is a decentralized climate-data marketplace. — [Arbol](https://www.arbol.io/post/an-introduction-to-dclimate-a-decentralized-network-for-climate-data-2) [search summary — primary not opened]
  - WeatherXM runs licence auctions for its data. — [WeatherXM docs](https://weatherxm.network/docs/data-licensing) [search summary — primary not opened]
- **Incumbent "trust" fix:** TWC offers a "consistent, documented methodology for each market type" as Kalshi's settlement publisher. — [The Insurer](https://www.theinsurer.com/parametric-insurer/news/prediction-market-kalshi-partners-with-the-weather-company-for-settlement-data-2026-08-28/) [search summary — primary not opened]

### Inferences
- **Where a new provider could fit (KWeather-style):**
  - (a) A redundancy and anomaly layer: per-station neighbour consistency checks, plus tamper-evident secondary sensors near settlement stations, with hash-anchored readings giving an audit trail an exchange can cite in a Market Outcome Review (Kalshi Rule 7.1).
  - (b) Immutable "first publication" records, matching the "first official non-preliminary report" rule.
  - (c) Asian coverage, starting with Seoul (RKSI) and other Polymarket Asian cities, where the incumbents rely on WU pages rather than a contracted vendor.
- **Risk to the pitch:** exchanges favour official met-service stations (NWS, or "the national weather service for <area>") and big vendors (TWC, Xweather). Private sensors are more credible as a verification or cross-check feed, or as a multi-station index, than as a replacement settlement source.
- The CDG tampering was physical: someone heated the sensor. Cryptographic signing proves only that the data was not altered after capture, not that the sensor was untouched. The value comes from multiple independent sensors plus anomaly detection plus signatures together. Claims about a single hardware-signed sensor should be framed carefully.

### Gaps
- I found no published proposal from an exchange, regulator or academic for multi-source or cryptographically attested settlement of weather contracts. The search budget was exhausted, so this is unconfirmed rather than proven absent.
- No documented case exists of any exchange using a DePIN weather network (WeatherXM or others) as a settlement source.
- No systematic data on NWS CLI revision frequency or publication-delay statistics was found.
