# WeatherXM — EU hardware go-to-market profile (research notes, as of 2026-10-10)

> **Source access caveat (applies to every finding below).** From this session, weatherxm.com, docs.weatherxm.com, weatherxm.network, the reseller shops (hexaspot.com, eugeo.io, eurosupplies.com, eu.ampchampment.com) and web.archive.org could **not** be opened: the proxy returned 403 on CONNECT, or DNS failed. Every finding is therefore a **search-result summary, not verified at the source page**, unless it is marked otherwise. Several summaries say the cached weatherxm.com pages are about 500–600 days old, which puts them at roughly mid-2024 to early 2025. The one clearly current snapshot is the homepage network-stats block, dated "August 2026". Treat reseller lists and prices as point-in-time.

## 1. Company basics (entities, founders, HQ, funding, status)

### Takeaway
WeatherXM has two entities. WeatherXM AG is a Swiss company (Zug per data aggregators) that builds the hardware and sells commercial weather services. The WeatherXM Network Association runs the token, rewards, governance and data licensing. The team is Greek, founded in Athens, and still operates from Athens. Reported funding is about $5M seed plus a $7.7M Series A (May 2024, led by Lightspeed Faction). The company is still active in 2026: the homepage shows an Aug-2026 network snapshot, and there is a new D2 Mesh product.

### Cited Findings
- Entity split: the **WeatherXM Network Association** manages participation, rewards, governance and licensing of the Network Dataset. **WeatherXM AG** builds the products and provides commercial weather services. — [weatherxm.network](https://weatherxm.network/) / [weatherxm.com](https://weatherxm.com/) (search summary, not verified at source)
- The privacy policy says the operating company ("WXM") is incorporated in Switzerland. — [WeatherXM Privacy Policy](https://weatherxm.com/privacy-policy/) (search summary)
- Legal name "WeatherXM AG". Crunchbase gives the location as Athens, Greece, while Preqin and Craft.co give HQ as **Zug, Switzerland**, with Athens as a second location. — [Crunchbase](https://www.crunchbase.com/organization/weatherxm-b41a); [Preqin](https://www.preqin.com/data/profile/asset/weatherxm-ag/309623); [Craft.co](https://craft.co/weatherxm) (search summaries; registered seat vs. operating base not confirmed against the Swiss commercial register)
- Founders: **Manolis Nikiforakis** (co-founder & CEO), **Stratos Theodorou** and **Nikos Tsiligaridis**. They started a community weather app in Athens in 2012 and later consulted for enterprises, including Athens airport. Preqin also lists **Vassilis Chryssos** as a co-founder. — [TechCrunch, 2024-05-25](https://techcrunch.com/2024/05/25/deal-dive-can-blockchain-make-weather-forecasts-better-weatherxm-thinks-so); [Preqin](https://www.preqin.com/data/profile/asset/weatherxm-ag/309623)
- **Series A: $7.7M, announced about 22 May 2024**, led by **Lightspeed Faction**, with Protocol Labs, Borderless Capital, Arca, Placeholder, Metaplanet and others. The CEO said the board would not change and the money would go to hardware development, data quality and decentralization. — [The Block](https://www.theblock.co/post/295807/lightspeed-faction-leads-7-7-million-series-a-round-for-depin-weather-startup-weatherxm); [Greek City Times](https://greekcitytimes.com/2024/05/23/greek-founded-weatherxm-secures-7-7m-series-a-funding-to-expand-decentralized-weather-network/); [raising.fi](https://raising.fi/company/weatherxm)
- An earlier **$5M seed round** had investors including Placeholder VC, Metaplanet, Consensys Mesh and SOSV. Aggregator totals conflict: $2.2M (Welcome to the Jungle), $12.7M (AlphaGrowth), $7.7M (VCBacked). — [search summary citing alphagrowth.io](https://alphagrowth.io/weatherxm/company); [Welcome to the Jungle](https://app.welcometothejungle.com/companies/WeatherXM); [VCBacked](https://www.vcbacked.co/company/weatherxm)
- 2025–26 hiring: commission-only "Sales Agent" roles for Europe/UK, India and the US (the US listing is dated July 2025). This points to an outbound B2B **data**-sales push. — [Protocol Labs job board](https://jobs.protocol.ai/companies/weatherxm/jobs/53475039-commission-based-sales-development-representatives-us-remote); [Icebreaker – UK](https://app.icebreaker.xyz/jobs/53475035)

### Inferences
- The structure is a Swiss AG for commercial and hardware activity plus a separate "Network Association" for token and rewards, with an operating team in Greece. This is a common DePIN pattern: it keeps the token and rewards issuer separate from the company that sells hardware.

### Gaps
- Exact legal form and seat of the Network Association (Swiss Verein? which canton?) could not be verified; the source page was unreachable.
- No funding round after May 2024 was found, and no 2026 press coverage of the company itself was found.

## 2. Product line (models, OEM, EUR prices, connectivity)

### Takeaway
The current lineup is **D1 (Wi-Fi)**, **H1/H2 (Helium LoRaWAN)**, **Pulse (4G/LTE cellular)** and the new **D2 Mesh** (off-grid LoRa mesh, Meshtastic/MeshCore compatible, sold via Crowd Supply). The legacy line is the **WS1000/WS1001** outdoor sensor units with an M5 or WG1000 gateway (Wi-Fi) and the **WS2000** (Helium). Official USD prices start "from $199" for the D1, with frequent sales. EU reseller prices for the D1 bundle (WB1200) range from about €269 to €472 incl. VAT. The OEM or manufacturer is not publicly named.

### Cited Findings
- The stations page lists **D1, H2, Pulse and D2 Mesh**, with "D2 Mesh" marked NEW and described as an off-grid, local-first station with multi-hop LoRa mesh and local REST access. — [WeatherXM Stations](https://weatherxm.com/stations/) (search summary)
- D2 Mesh kit: built around the **WS1300** station, compatible with **Meshtastic and MeshCore**, sold through **Crowd Supply**. The page says "final licenses will be announced at launch". The Aug-2026 homepage lists off-grid mesh under "Coming soon & pilots". — [Crowd Supply – WeatherXM D2 Mesh](https://www.crowdsupply.com/weatherxm/weatherxm-d2-mesh); [weatherxm.com](https://weatherxm.com/)
- Bundle and SKU naming:
  - **M5** = Wi-Fi version, bundle **WB1000**: a WS1000 sensor unit plus an M5 gateway.
  - **D1** = Wi-Fi, bundle **WB1200**: a WS1001 plus a D1 gateway.
  - **Pulse** = cellular bundle **WB3000**: a WS1001 plus a "PULSE 4G – LTE gateway".
  - **WS2000** = Helium LoRaWAN version.
  - The About page calls the current Helium product H1/H2.

  — [WeatherXM docs – M5 bundle](https://docs.weatherxm.com/wxm-devices/wifi-m5-bundle/wxm-ws1000-introduction); [D1 – WiFi product page](https://weatherxm.com/product/wb1200-wifi-d1/); [Shop](https://weatherxm.com/shop/); [Company page](https://weatherxm.com/company/) (search summaries)
- The WS1000 is a solar-powered unit that sends data by radio to a WG1000 gateway or an M5 miner. WS1000/WS1001 parts are now sold as "legacy" accessories. — [WS1000 specs](https://docs.weatherxm.com/m5-specs); [WS1000 wind vane](https://weatherxm.com/product/ws1000-wind-vane/)
- Regional radio variants: the D1 is offered as **EU 868 / US 915 / AS 923**. There is a separate "WS1000 Weather Station **EU frequency**" SKU. The Block (May 2024) said stations "start at around $400, with variants for customers in the European Union". — [D1 product page](https://weatherxm.com/product/wb1200-wifi-d1/); [WS1000 EU frequency](https://weatherxm.com/product/ws1000-weather-station/); [The Block](https://www.theblock.co/post/295807/lightspeed-faction-leads-7-7-million-series-a-round-for-depin-weather-startup-weatherxm)
- Official prices (USD): D1 Wi-Fi "**from $199**" on the stations page. Product listings show $400 marked down to $239, and another to $139, so sale pricing is inconsistent. A third-party review put the LTE (Pulse) model at **$386**. — [Stations](https://weatherxm.com/stations/); [D1 product page](https://weatherxm.com/product/wb1200-wifi-d1/); [DePIN Beta Tester substack](https://depinbetatester.substack.com/p/battle-of-the-crypto-weather-stations)
- **EUR reseller prices for the D1 (WB1200)** (search summaries, dates unknown):
  - **AMP Champment** (EU stock): regular price €367.90, sale price €268.66.
  - **EuroSupplies**: €472.44 incl. VAT (€381.00 + 24% VAT), "very limited stock".
  - **EuGeo**: €400.00 incl. VAT, backorder.

  — [AMP Champment](https://eu.ampchampment.com/en-en/products/weatherxm-d1-wifi); [EuroSupplies](https://www.eurosupplies.com/natural-sciences-education/weather-stations/weather-station-weatherxm-d1-wifi-wb1200-106672/); [EuGeo](https://eugeo.io/product/weatherxm-wb1200-d1-wifi-smart-weather-station/)
- Hexaspot sells the **WS2000 Helium LoRaWAN** station, which needs a nearby Helium LoRaWAN gateway. — [Hexaspot WS2000](https://hexaspot.com/products/weatherxm-ws2000-helium-lorawan)
- WeatherXM also sells spare parts and accessories through an accessories shop (wind vane, wind cups, T/H sensors, WS2000 external battery pack, gateways without a station). — [Accessories Shop](https://weatherxm.com/accessories-shop/)

### Inferences
- EuroSupplies' 24% VAT matches Greece's standard VAT rate, which suggests a Greek seller. EuGeo is listed for Greece/Cyprus. So the EU reseller base appears to cluster in Greece and the Netherlands (WeatherXM's home team is in Greece).
- The big gap between official USD sale prices ($139–$239) and EU reseller prices (€269–€472) suggests resellers either hold older stock or price in VAT, import costs and margin. Official-shop discounting may undercut resellers.

### Gaps
- **OEM/manufacturer**: no public source names the factory or ODM for the WS1000/WS1001/WS2000/D1/Pulse (I found no evidence either way). The WS1000 family looks like a generic solar 7-in-1 outdoor array, but this is unconfirmed.
- Current official EUR prices from weatherxm.com could not be read (the shop is USD-denominated in the snippets).

## 3. Distribution (official shop vs. authorized resellers; how to become one)

### Takeaway
WeatherXM sells direct through its official WooCommerce shop and keeps a public **"Resellers" page** of approved stores grouped by region. EU/UK entries in the cached copy are **Hexaspot (NL; EU & UK)**, **EuGeo (Greece, Cyprus, EU)** and **Eurosupplies**. Other entries are TechnoStoreX (Turkey, North Cyprus, Azerbaijan), HeliumDeploy, Hepta Network (South Asia), Cosmic Equip and Dailyminers. A public partner taxonomy lists **Reseller / Affiliate / Deployer / Wholesaler / Retailer**. Pages promise "competitive margins" and "no strict minimums", but no margin figure is public.

### Cited Findings
- The Resellers page lists "approved" weather-station stores by region. Names seen in search snippets: **Hexaspot, EuGeo, Eurosupplies, HeliumDeploy, Hepta Network, TechnoStoreX, Cosmic Equip, Dailyminers**. Snippet age is about 509 days, so roughly mid-2025. — [WeatherXM Resellers](https://weatherxm.com/resellers/) (search summary, not verified at source)
- Region mapping (from the snippet layout):
  - **Hexaspot → EU & UK**
  - **EuGeo → Greece, Cyprus, EU**
  - **TechnoStoreX → Turkey, North Cyprus, Azerbaijan**
  - **Hepta Network → India, Bangladesh, Sri Lanka, Nepal**
  - **HeliumDeploy → US & CA** in one summary, but another summary paired HeliumDeploy with India and **Eurosupplies → US & CA**.

  **Conflicting — not resolved.** — [WeatherXM Resellers](https://weatherxm.com/resellers/) (two separate search summaries)
- **Hexaspot**: business address in **Alkmaar, Netherlands**. It runs a dedicated "WeatherXM – Start mining WXM today" landing page and sells the WS2000. — [Hexaspot](https://hexaspot.com/); [Hexaspot WeatherXM page](https://hexaspot.com/pages/weatherxm) (search summary; page not opened)
- **AMP Champment** (eu.ampchampment.com) runs a WeatherXM brand page and sells the D1 from "EU stock". It was not seen in the Resellers-page snippets, so its authorized status is unconfirmed. — [AMP Champment WeatherXM](https://eu.ampchampment.com/en-en/pages/weatherxm)
- Reseller terms as described publicly:
  - Shop page: resellers "sell WeatherXM stations directly to customers and earn **competitive margins** on every sale."
  - Resellers page: "**no strict minimums**, allowing you to manage inventory and reduce risk."

  — [Shop](https://weatherxm.com/shop/); [Resellers](https://weatherxm.com/resellers/) (search summaries)
- Partner taxonomy:
  - **Affiliates** earn commissions by promoting stations, with an "apply to become an affiliate" area.
  - **Deployers** install stations at strategic locations.
  - **Wholesalers** "distribute to retailers and resellers in your region".
  - **Retailers** "stock WeatherXM products in your shop".
  - **Data resellers** earn commissions reselling WeatherXM data to developers, enterprises and institutions.

  — [Affiliates](https://weatherxm.com/affiliates/); [Affiliate Area](https://weatherxm.com/affiliate-area/); [Weather & Climate Partners](https://weatherxm.com/weather-climate-partners/) (search summaries)
- 2023: DePIN Hub reported WeatherXM was "establishing partnerships with local distributors to provide more purchasing options." — [DePIN Hub, Apr 2023](https://9o1hbtdj3x.depinhub.io/news/weather-xm-network-updates-and-developments-378)
- **Targeted Rollouts** is a separate channel: supporters fund station deployments, "100% of the funds collected are used to deliver stations to our local deployers", and supporters receive a share of rewards. A related **SwissBorg** partnership subsidises stations, targeting 3,000 in Mexico, Colombia, Venezuela, Kenya, Uganda, Liberia, South Africa and Madagascar. A blog post cites "2,270 weather stations for the Global South". — [Targeted Rollouts](https://weatherxm.com/targeted-rollouts/); [SwissBorg partner page](https://swissborg.com/alpha/weatherxm); [WeatherXM blog](https://blog.weatherxm.com/2-270-weather-stations-for-the-global-south-0532a356e9ae); [Targeted Rollouts, Two Years Later](https://blog.weatherxm.com/targeted-rollouts-two-years-later-c9e7cb3b91cd)
- Official shipping and refund terms (T&C, about 515 days old) list EU countries, Canada, the UK and Australia as shipping regions. — [Terms & Conditions](https://weatherxm.com/terms-conditions/) (search summary)
- The commission-only sales-agent roles (Europe listing) pay **15%** for qualified leads and **50%** if the agent closes. These are for **data/services** sales, not hardware reselling. — [Protocol Labs job board](https://jobs.protocol.ai/companies/weatherxm/jobs/37532507-business-development-representative); [Icebreaker UK](https://app.icebreaker.xyz/jobs/53475035) (search summary)

### Inferences
- The EU reseller network is thin and crypto-native: Hexaspot is a DePIN/Helium miner shop, and HeliumDeploy and Dailyminers are miner retailers. There are also a couple of Greek general or lab-equipment suppliers (EuGeo, EuroSupplies). No mainstream consumer-electronics or garden/weather retailer (e.g., a German chain) appears. For Wellbian, the realistic EU first-wave channel is likewise DePIN miner shops, and these shops market "mining" rather than air-quality value.
- "No strict minimums" plus "manage inventory" suggests resellers buy stock (no MOQ) rather than dropship. This is unconfirmed.

### Gaps
- Application form URL, selection criteria, margin %, payment terms, and stock vs. dropship were **not found publicly**. The reseller page likely has a contact/apply form, but it could not be opened.
- Crypship: no search result linked it to WeatherXM. Whether it is a current reseller is unknown.
- The live (Oct 2026) reseller list could not be checked. The cached list is about mid-2025.

## 4. Compliance (CE/RED, EN 18031, WEEE, RoHS, GPSR)

### Takeaway
No public WeatherXM CE Declaration of Conformity, RED statement, EN 18031 (RED cybersecurity) statement, WEEE registration, RoHS statement or GPSR EU responsible person was found in any search result. EU reseller listings show EU868 variants but no conformity documents in the snippets.

### Cited Findings
- A search for a WeatherXM CE/FCC declaration of conformity returned only other manufacturers' DoCs; nothing for WeatherXM. — [search: Eve Weather DoC example](https://www.evehome.com/sites/default/files/inline-files/Eve_Weather_Declaration_of_Conformity_20150730_0.pdf) (illustrates absence; not WeatherXM)
- EU listings (EuroSupplies, EuGeo, AMP Champment) in search snippets show price, VAT and stock, but no CE/GPSR/responsible-person text. — [EuroSupplies](https://www.eurosupplies.com/natural-sciences-education/weather-stations/weather-station-weatherxm-d1-wifi-wb1200-106672/); [EuGeo](https://eugeo.io/product/weatherxm-wb1200-d1-wifi-smart-weather-station/); [AMP Champment](https://eu.ampchampment.com/en-en/products/weatherxm-d1-wifi)

### Inferences
- The D1 (Wi-Fi), Pulse (LTE) and H-series/WS2000 (LoRa 868 MHz) are all radio equipment. They would fall under RED, and internet-connected ones under the RED cybersecurity delegated requirements that the brief notes became mandatory on 1 Aug 2025. This is regulatory context from the assignment, not a WeatherXM statement. Whether WeatherXM self-declares against EN 18031 is unknown.
- Because WeatherXM AG is a Swiss (non-EU) manufacturer, GPSR and market-surveillance rules would require an EU-based economic operator. Plausible candidates are an EU importer (e.g., the Greek or Dutch resellers) or a WeatherXM EU entity. None was identified.

### Gaps
- CE DoC, RED notified-body involvement, EN 18031 statement, WEEE producer registration (per country), RoHS, and the GPSR responsible person are **all unverified**. Next step: open the product pages, the manual PDFs on docs.weatherxm.com and the physical label photos, which were not reachable here.

## 5. Token and regulatory posture in the EU (WXM, MiCA, disclaimers)

### Takeaway
$WXM is an ERC-20 token (100M max supply). It was minted on Ethereum, but rewards are distributed on **Arbitrum One**; the reward "Token Launch Day" was **30 May 2024**. Public messaging ties rewards to **data quality**, not to owning hardware. No MiCA white paper for WXM was found in search results; the live ESMA interim register CSV was not checked. No explicit "rewards not guaranteed" text or country-restriction clause could be retrieved.

### Cited Findings
- $WXM: ERC-20, **100,000,000** total supply, deployed on **Arbitrum One**. Token Launch Day was **30 May 2024**, when station owners started receiving $WXM on Arbitrum mainnet. Bridges: Ethereum↔Arbitrum, Ethereum↔Solana, Arbitrum↔Base. — [WeatherXM docs – Tokenomics](https://docs.weatherxm.com/tokenomics); [weatherxm.network – WXM token](https://weatherxm.network/docs/wxm-token) (search summaries)
- CoinMarketCap says the token was minted on Ethereum and that station rewards are bridged and distributed on Arbitrum One. — [CoinMarketCap](https://coinmarketcap.com/currencies/weatherxm/); [Etherscan token](https://etherscan.io/address/0xde654f497A563dd7A121c176a125dD2F11F13a83)
- Allocation per docs: **52M** to station owners as data rewards (distributed daily), **30M** to initial supporters, **10M** treasury. The remainder is not captured in the snippet. — [docs – Tokenomics](https://docs.weatherxm.com/tokenomics)
- Unlock tracker figures conflict. Tokenomist shows about 25.23M (25.23%) unlocked with a schedule to 2034, but also calls it "fully unlocked". CMC shows a self-reported 60M circulating. — [Tokenomist](https://tokenomist.ai/weatherxm-network/unlock-events); [CoinMarketCap](https://coinmarketcap.com/currencies/weatherxm/)
- Price context: CMC snapshot about $0.0099–$0.0118, with an all-time low recorded **4 May 2026**. These are cached and unreliable for current pricing. — [CoinMarketCap](https://coinmarketcap.com/currencies/weatherxm)
- Reward framing: the site says rewards depend on "contribution data quality — not simply on owning hardware". Docs: owners "are awarded $WXM for providing high-quality weather data". There are also "Reward Boosts" docs. Third-party coverage notes that stations in rare locations with proper installations earn more. — [weatherxm.com](https://weatherxm.com/); [Rewards](https://weatherxm.com/rewards/); [Reward Boosts](https://docs.weatherxm.com/rewards/reward-boosts) (search summaries)
- Pre-mainnet, The Block (sponsored, Feb 2024) reported more than 1.5M "station-days" ahead of mainnet rewards. — [The Block (sponsored), 2024-02-19](https://www.theblock.co/news/sponsored/2024-02-19-weatherxm-surpasses-1-5m-station-days-as-they-prepare-for-mainnet-rewards-277530)
- Reseller messaging: Hexaspot's page is titled "**WeatherXM – Start mining WXM today**". HeliumDeploy runs a blog "WeatherXM Token: Overview, Rewards, and How to Mine". Resellers market mining/rewards. — [Hexaspot](https://hexaspot.com/pages/weatherxm); [HeliumDeploy blog](https://heliumdeploy.com/blogs/mining-news/weatherxm-token)
- MiCA: no search result links WeatherXM/WXM to a MiCA white paper. ESMA's interim MiCA register is published as CSV files, last updated 12 Mar 2026, with formal integration into ESMA IT systems planned for mid-2026. ESMA notes that listed white papers are not reviewed or approved. — [ESMA MiCA page](https://esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica); [ESMA Art. 109 register](https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-109-register-crypto-asset-white)

### Inferences
- The "rewards for data quality" framing and the separation into a Network Association look designed to present WXM as a utility or reward token rather than a return on a hardware purchase. Resellers, however, use "mining" language, which is a messaging mismatch between WeatherXM and its channel. That mismatch is a lesson for Wellbian's reseller guidelines.
- No MiCA white paper was evident. WXM was not "offered to the public" in an EU sale (it was earned via rewards and listed on exchanges), so the issuer may rely on that, or exchanges may have filed the white papers. This is speculation and unverified.

### Gaps
- The exact T&C or rewards-disclaimer wording ("not guaranteed", "not an investment") was not retrieved.
- Country restrictions (e.g., OFAC or sanctioned countries) for rewards or the app: not found.
- The ESMA register CSV was not checked directly; recommended follow-up is to search the CSV for "WeatherXM" or "WXM".

## 6. Data business (buyers, partnerships; do resellers market data value?)

### Takeaway
WeatherXM monetizes through **WeatherXM Pro** (an API/subscription, including an Enterprise plan) and commercial data licences sold in WXM (reportedly 4 commercial licences auctioned per year). It targets insurance, agriculture, energy and transport. The only concrete named commercial engagement found is an **Ensuro parametric-insurance** pilot (banana-farm rain risk, Colombia, 2025). Hardware resellers market **mining/rewards**, not data value.

### Cited Findings
- Target verticals: insurance, agriculture, energy, transportation. There are dedicated Insurance, Agriculture and Commercial Industries pages. The insurance page pitches underwriting with "hyperlocal" data and carries an unnamed testimonial. — [Weather & Climate Partners](https://weatherxm.com/weather-climate-partners/); [Insurance](https://weatherxm.com/industry-insurance/); [Agriculture](https://weatherxm.com/agriculture/); [Commercial Industries](https://weatherxm.com/commercial-industries/)
- The Agriculture page shows logos such as PG&E, but the search summary flagged these entries as placeholder text, so they should **not** be treated as confirmed customers. — [Agriculture](https://weatherxm.com/agriculture/) (search summary)
- **WeatherXM Pro** has an Enterprise plan product page. — [WeatherXM Pro](https://weatherxm.com/weatherxm-pro/); [Pro Enterprise Plan](https://weatherxm.com/product/weatherxm-pro-professional-plan/)
- 2025 roadmap: build the demand side through data, with an **Ensuro** partnership for parametric weather insurance (rain risk for banana farms in Colombia). It also aims to serve as a resolution source for prediction markets. — [DePINscan, 2025-02-19](https://depinscan.io/news/2025-02-19/weatherxm-s-ambitious-roadmap-for-2025); [DePINscan, 2025-01-03](https://depinscan.io/news/2025-01-03/weatherxm-disrupting-the-weather-data-industry-in-2025)
- Commercial data licences are paid in $WXM. One source says "four (4) licenses that permit commercial use of WeatherXM data are auctioned every year." — [search summary citing docs/tokenomics pages](https://docs.weatherxm.com/tokenomics) (not verified at source)
- Public apps and developer pages exist (Developers, Public Apps). — [Developers](https://weatherxm.com/developers/); [Public Apps](https://weatherxm.com/public-apps/)
- Historical B2B: the founders consulted for enterprises including **Athens airport** before WeatherXM. — [TechCrunch 2024](https://techcrunch.com/2024/05/25/deal-dive-can-blockchain-make-weather-forecasts-better-weatherxm-thinks-so)

### Inferences
- Data demand appears early-stage: pilots, auctions, a Pro API and commission-only sales agents. No disclosed revenue or named large customers.
- For resellers, the selling story is the token reward, not B2B data value. Data value appears only in WeatherXM's own enterprise marketing.

### Gaps
- No revenue figures, number of Pro customers or named enterprise contracts (other than the Ensuro pilot) were found.

## 7. Numbers (station count, countries — dated)

### Takeaway
The latest self-reported figure (homepage, **"Network snapshot: August 2026"**) is about **9,500 deployed stations in 85+ countries, 5,900+ active, 4,300+ of "synoptic quality"**. In May 2024 the figure was about 5,000 stations in 80+ countries.

### Cited Findings
- **Aug 2026**: about 9,500 deployed stations, **85+ countries**, **5,900+ active**, **4,300+ synoptic quality**. — [weatherxm.com homepage](https://weatherxm.com/) (search summary, not verified at source)
- The shop page says forecasts draw on "**9,600+ stations** worldwide" (undated). — [Shop](https://weatherxm.com/shop/)
- SwissBorg partner page: "more than **5,200** weather stations deployed in **81** countries in 2 years" (undated, probably 2024). — [SwissBorg](https://swissborg.com/alpha/weatherxm)
- **May 2024**: about **5,000** stations in **80+** countries. — [TechCrunch, 2024-05-25](https://techcrunch.com/2024/05/25/deal-dive-can-blockchain-make-weather-forecasts-better-weatherxm-thinks-so)
- Feb 2024: more than 1.5M cumulative station-days. — [The Block (sponsored)](https://www.theblock.co/news/sponsored/2024-02-19-weatherxm-surpasses-1-5m-station-days-as-they-prepare-for-mainnet-rewards-277530)

### Inferences
- Deployed stations roughly doubled from about 5k (May 2024) to about 9.5k (Aug 2026), but only about 62% are active (5.9k / 9.5k). This churn and inactivity rate is a useful benchmark for Wellbian when promising rewards to buyers.

### Gaps
- No EU-specific station count or country breakdown was found. Independent verification (e.g., an explorer API) was not possible from this session.
