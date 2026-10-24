# DePIN hardware reseller/distributor programs and EU reseller requirements (prep for Wellbian Labs EU outreach)

As-of: 2026-10-10. Research environment note: the proxy could not resolve several primary doc sites (docs.wingbits.com, docs.hivemapper.com returned DNS failure on fetch), so many findings below come from **search-engine summaries of those pages (unverified, not opened)**. They are labelled `[search summary, unverified]`. Regulation article references marked `[reg text, not fetched]` are cited from the official EUR-Lex text from background knowledge because the pages were not opened this session. Re-check exact paragraph numbers before quoting them in contracts. Interpretations are labelled **(interpretation)**.

---

## 1. Reseller/distributor program terms of comparable DePIN projects

### Takeaway
Comparable DePIN projects publish very little about reseller *commercial* terms (margin, MOQ, payment terms). What they publish is a **trust layer**: an official "authorized/approved distributor" list by region, a warning to buy only from listed sellers, and a hardware-approval gate (only certified devices earn rewards). Margins, MOQ, exclusivity and RMA splits are negotiated privately. The one published economic figure found is GEODNET's 50/50 revenue share with third-party resellers, and that covers **data** resale, not hardware.

### Cited Findings
**Wingbits (ADS-B; hardware made by HYFIX)**
- Wingbits runs an official "Distributors of approved hardware" page. Its table columns are Logo, Company, Regions Served, Product Links, Support Info and Last updated. It lists distributors "authorized to sell the Wingbits Approved Hardware" and warns buyers to purchase only from listed vendors to avoid scam sellers — [Wingbits docs: approved distributors](https://docs.wingbits.com/project/wingbits-approved-distributors) `[search summary, unverified; page fetch failed DNS]`
- The approved devices are the HYFIX WB200 (solo) and the HYFIX MGW310 (Wingbits+GEODNET dual miner). The page notes that distributors may have different lead times. From 14 Oct 2024 all new devices joining the network must be Wingbits Approved Hardware — [Wingbits docs: approved distributors](https://docs.wingbits.com/project/wingbits-approved-distributors); [Wingbits docs: hardware needed](https://docs.wingbits.com/get-started/hardware-needed) `[search summary, unverified]`
- The "Support Info" column suggests that first-line support sits with each distributor. **(interpretation, based only on the column name)**

**GEODNET / HYFIX**
- No published HYFIX distributor margin, MOQ or application terms were found. A company profile lists HYFIX's category as "OEM; Reseller & Distributors" (Bengaluru, India). HYFIX also makes plug-and-play GEODNET base stations — [Geospatial World company profile: HYFIX India](https://resource.geospatialworld.net/company/hyfix-india) `[search summary, unverified]`
- A July 2026 brand-monitoring profile says HYFIX distributes globally through a partner network and is migrating sales to the GEODNET Store, with pricing and purchasing processes unchanged during the transition — [Parse: HYFIX](https://parse.gl/brands/hyfix-ai) `[search summary, unverified; secondary/aggregator]`
- HYFIX components are listed on Mouser, including the EU storefront, so mainstream electronics distribution is available — [Mouser EU: HYFIX](https://eu.mouser.com/manufacturer/hyfix/) `[search result listing only]`
- GEODNET has a **50/50 revenue share with third-party resellers**. This is a VanEck research blog dated April 2024 and concerns resale of correction data, not hardware — [VanEck: GEODNET: Why We're Bullish](https://www.vaneck.com/us/en/blogs/digital-assets/matthew-sigel-geodnet-why-were-bullish/) `[search summary, unverified]`
- Easynav.xyz presents itself as GEODNET's "official global ALL-IN-One partner and reseller" for RTK correction data and also sells GEODNET satellite miners — [EasyNav.xyz home](https://www.easynav.xyz/); [EasyNav GEODNET Satellite Miners](https://www.easynav.xyz/geodnet/satelliteminers/) `[search summary, unverified]`

**Hivemapper / Bee Maps**
- Hivemapper publishes an "Authorized Resellers" list grouped by region (Global, Asia, Europe, North America, Middle East, Africa). Bee Maps is listed as Global ("Ships to most countries"). Buyers are told to check the list "to ensure you are buying from a legitimate reseller" — [Hivemapper docs: Authorized Resellers](https://docs.hivemapper.com/resources/authorized-resellers); [alt path](https://docs.hivemapper.com/contribute/driving/authorized-resellers) `[search summary, unverified; fetch failed DNS]`
- "Currently, Bee Maps is the only certified manufacturer of devices for the Hivemapper Network." Hivemapper Inc. now markets map data under the Bee Maps brand — [Hivemapper docs](https://docs.hivemapper.com/) `[search summary, unverified]`
- Names of the individual European resellers were not retrieved (see Gaps).

**DIMO (vehicle data)**
- DIMO has the most formalised **hardware-maker** gate found. A licensed manufacturer must stake 100,000 $DIMO, submit test devices, validate them with a group of alpha users, and pass a hardware security audit by an approved vendor. Under DIP-4, the device manufacturer "must routinely support and update their devices as new vulnerabilities are found" — [DIMO docs: hardware](https://docs.dimo.org/docs/hardware); [DIMO Device License](https://docs.dimo.org/docs/hardware/device-license); [DIP-4 Device Integrations](https://docs.dimo.org/governance/~/changes/BVHxKwYX8U5GDtrtGJCU/improvement-proposals/dip4); [DIMO Final Approval](https://docs.dimo.org/developer-platform/dimo-hardware/audits-and-assessments/final-approval) `[search summary, unverified]`
- AutoPi moved from a temporary to a permanent manufacturing license under DLP-2. The proposal cites over 13,000 devices sold on DIMO. AutoPi's listed third-party certifications include CE and FCC. Hashdog (DLP-1) belongs to JDI, which is also the parent company of Bobcat (a Helium hotspot maker) — [DLP-2 AutoPi](https://docs.dimo.org/governance/license-proposals/dlp2); [DLP-1 Hashdog](https://docs.dimo.org/governance/license-proposals/dlp1); [DIMO: Expanding the hardware ecosystem](https://dimo.org/news/expanding-the-dimo-hardware-ecosystem) `[search summary, unverified]`
- DIMO also has a manufacturer Memorandum of Understanding template — [DIMO MoU technical details](https://docs.dimo.org/docs/hardware/manufacturing-license/dimo-memorandum-of-understanding) `[search result listing only; contents not read]`

**WeatherXM**
- No formal published reseller/distributor program was found. An April 2023 update said partnerships with **local distributors** were being set up to give more purchasing options, with no follow-up found — [DePIN Hub news, Apr 2023](https://9o1hbtdj3x.depinhub.io/news/weather-xm-network-updates-and-developments-378) `[search summary, unverified]`
- WeatherXM advertised a **commission-only remote sales agent** role (India) for selling weather *services* — [Protocol Labs jobs: WeatherXM commission-based sales agent](https://jobs.protocol.ai/companies/weatherxm/jobs/53475019-commission-based-sales-agent-india-remote) `[search summary, unverified; posting 6+ months old]`
- The network reports 9,000+ stations in 80+ countries — [DePIN Hub news](https://9o1hbtdj3x.depinhub.io/news/weather-xm-revolutionizing-weather-data-for-communities-23650) `[search summary, unverified]`

**Air-quality DePINs (Ambient/Ambios, PlanetWatch)**
- Device sales were reportedly **paused during the PlanetWatch→Ambient migration** and were to reopen once Solana onboarding was live. This comes from a community forum comment, not an official statement — [Jupiter forum: Introducing Ambient](https://discuss.jup.ag/t/introducing-ambient-the-environmental-depin-on-solana/17841) `[search summary, unverified]`
- Ambios Network (the later name) is profiled at about 8,000 devices (about 3,000 outdoor, the rest indoor) — [Solana Compass: Ambios](https://solanacompass.com/projects/ambios-network); [DePIN Hub: Ambios](https://depinhub.io/projects/ambios) `[search summary, unverified, secondary]`
- No Ambios reseller program terms were found.

### Inferences
- **(interpretation)** The industry-standard minimum is (1) a public, dated, region-tagged authorized-reseller list, (2) an anti-scam "buy only from listed sellers" warning, and (3) an approved-hardware gate tied to rewards eligibility (Wingbits from Oct 2024, Hivemapper with a single certified maker, DIMO's licensed makers). Wellbian should publish all three before or alongside EU outreach. The list doubles as the reseller's main marketing asset.
- **(interpretation)** Because none of these projects publish margins or MOQ, Wellbian does not need to publish them either. A one-page private "Reseller Terms Sheet" is the norm for first contact.
- **(interpretation)** HYFIX's model (one OEM serving several DePINs, sold through GEODNET Store, Mouser and regional partners) is the closest analogue to KWeather as device partner. Resellers will treat the *OEM* as the warranty and compliance counterparty and the *network* as the rewards counterparty, so the contract must state which entity is responsible for what.
- **(interpretation)** DIMO's requirement that makers keep shipping security updates is the same obligation EU law now places on connected radio devices (EN 18031 / CRA). It is a selling point if Wellbian can show it.

### Gaps
- Actual margins, MOQ, dropship vs. stock, payment terms and territory exclusivity: **not published by any of the named projects** in sources found. Likely only obtainable by asking existing resellers or the projects directly.
- Names and countries of Hivemapper's and Wingbits' European distributors: page bodies could not be fetched (DNS failure). Open them manually.
- WeatherXM's current official reseller list (if any), Silencio (phone-app based, no hardware reseller program found), and Helium maker reseller terms: not found.
- "Discord distributor roles" and per-reseller referral codes: no sourced evidence found for any named project.

---

## 2. Lessons from failures (Easynav, PlanetWatch, Helium makers)

### Takeaway
The brief's premise of an **"Easynav 2025 bankruptcy with unfulfilled orders" could NOT be verified**. Searches found no insolvency reports, and Easynav's site was still being indexed as a GEODNET reseller. Do not repeat this claim in outreach until a primary source (court or registry notice) is found. PlanetWatch did not collapse publicly. Its network was **acquired by Ambient (2024), migrated from Algorand to Solana, had its token swapped, and paused device sales during the migration**. Helium's lesson is **pre-order and shipping failure**: makers took prepayment, then missed delivery because of chip shortages and FCC/CE certification delays, which led to refund disputes.

### Cited Findings
**Easynav**
- Two searches (standard and extended) returned no report of an Easynav bankruptcy or unfulfilled orders. Results show Easynav.xyz operating as a GEODNET partner/reseller — [EasyNav.xyz](https://www.easynav.xyz/); [Easynav LinkedIn](https://www.linkedin.com/company/easynav-xyz/) `[search summary, unverified]`. The search summary suggested the company may be French-registered based on French-language posts **(unverified)**.

**PlanetWatch → Ambient → Ambios**
- Ambient acquired PlanetWatch's air-quality network (Algorand-based) and decided to migrate it to Solana. It then raised a $2M seed round led by Borderless Capital with Solana Ventures and others — [The Block: Solana DePIN Ambient raises funds, acquires PlanetWatch's network](https://theblock.co/post/292971/solana-depin-ambient-funding-token-acquires-planetwatch) `[search summary, unverified]`
- The PLANETS token was replaced by the Ambient token, and active participants were included in a snapshot. Scope widened beyond air quality to noise and light — [DePIN Hub: PlanetWatch (marked "no longer active")](https://9o1hbtdj3x.depinhub.io/projects/planetwatch) `[search summary, unverified]`
- CB Insights lists a divestiture "PlanetWatch – DePIN Network Business" dated 7 May 2024. It is unclear whether this is the same transaction — [CB Insights: PlanetWatch](https://www.cbinsights.com/company/planetwatch) `[search summary, unverified]`
- Device sales were paused during migration (forum comment, not official) — [Jupiter forum](https://discuss.jup.ag/t/introducing-ambient-the-environmental-depin-on-solana/17841) `[search summary, unverified]`

**Helium hotspot makers**
- Nebra/Pi Supply: a reviewer describes the manufacturing and distribution as badly handled and reports a refund request ignored until a PayPal dispute. This is a single customer account — [Mighty Gadget: Pi Supply / Nebra refund nightmare](https://mightygadget.com/pi-supply-nebra-helium-hotspot-refund-nightmare/) `[search summary, unverified]`
- 2021 delays were attributed to chip shortages and **FCC and CE certification requirements**. Pre-order customers "have paid their money, and the constant delays have caused us to question if or when they will ever get shipped" — [Mighty Gadget: Helium miner shipping update](https://mightygadget.co.uk/?p=139752); [Nebra starts shipping](https://mightygadget.co.uk/nebra-helium-hnt-miner-starts-shipping/) `[search summary, unverified]`
- Bobcat orders reportedly arrived in about 6 weeks while Nebra's April 2021 orders shipped much later — [Mighty Gadget](https://mightygadget.com/pi-supply-nebra-helium-hotspot-refund-nightmare/) `[search summary, unverified]`

### Inferences
- **(interpretation)** These failures map to the contract protections EU resellers are likely to ask for:
  1. **No unfunded pre-orders.** Resellers sell only in-stock units, or the maker holds pre-order cash in escrow or ships against a letter of credit. This answers the Helium pre-order failure.
  2. **Certification before the sale date.** Delays were caused partly by CE/FCC certification, so resellers will ask for the CE Declaration of Conformity and test reports *before* listing.
  3. **Network-continuity / migration clause.** PlanetWatch shows a device can outlive its token and chain. The contract should say what happens to sold devices and stock if the token, chain or rewards program changes (data-only mode still works, a migration path, and buy-back or credit of unsold stock).
  4. **Upstream-insolvency protection.** Resellers carry a 2-year statutory guarantee to EU consumers (see section 3), so they will want a parts/RMA guarantee that survives the brand partner's failure. Options include an escrow of firmware and server code or a KWeather (OEM) direct warranty undertaking.
  5. **Anti-scam list maintenance.** Keep the authorized list current, as Wingbits and Hivemapper do, so that delisted or failed resellers are visibly removed.
- **(interpretation)** Wellbian's structure (KWeather is an established Korean weather company and device partner) is a credible answer to point 4 *if* KWeather's role in warranty and supply is written down.

### Gaps
- Easynav: no primary source for any 2025 bankruptcy. Check the French company registry (Infogreffe/BODACC) or GEODNET announcements. **Treat the premise as unverified.**
- PlanetWatch: the exact acquisition date and the sensor models it supported (believed from background knowledge to include third-party consumer indoor AQ monitors) are **unverified**. Whether EU buyers were refunded is not found.
- Helium HIP 19 (third-party maker approval process / Manufacturer Compliance Committee) and any maker deposit or bond: searches returned nothing usable. Read the [Helium HIPs GitHub repo](https://github.com/helium/HIP) directly.

---

## 3. EU hardware requirements resellers expect, and who carries them

### Takeaway
For a Wi-Fi/BLE/LoRa indoor air-quality device, the EU baseline is: **CE under the Radio Equipment Directive** (which absorbs the LVD safety and EMC objectives, so these are not separate declarations for radio equipment), **RED delegated cybersecurity (Reg. 2022/30, applicable since 1 Aug 2025; EN 18031-1/-2)**, **RoHS**, **WEEE producer registration in every country of sale**, **battery/packaging EPR** where relevant, an **EU-established economic operator** (importer, authorised representative or fulfilment provider, under Reg. 2019/1020 Art. 4 and GPSR Art. 16), and **instructions and safety information in the local language**. A non-EU manufacturer that dropships without an EU operator cannot lawfully place the device on the market. Whoever imports the stock becomes the **importer**, with legal duties. That is why EU resellers ask who the importer is before anything else.

### Cited Findings
**RED and cybersecurity**
- Delegated Regulation (EU) 2022/30 activates RED Art. 3(3)(d) (network protection), (e) (personal data/privacy) and (f) (fraud) for internet-connected radio equipment. It applies from **1 Aug 2025**, after being postponed from 1 Aug 2024 by Delegated Regulation (EU) 2023/2444 — [EUR-Lex 2022/30](https://eur-lex.europa.eu/eli/reg_del/2022/30/oj) `[reg text, not fetched]`; summarised in [bsg.tech EN 18031 guide](https://bsg.tech/blog/eu-radio-equipment-cybersecurity-red-en-18031-compliance-2025/) and [Inovasense](https://inovasense.com/insights/red-delegated-act-en-18031) `[search summary, secondary]`
- The harmonised standards are EN 18031-1:2024 (Art. 3.3(d)), EN 18031-2:2024 (3.3(e)) and EN 18031-3:2024 (3.3(f), financial transactions). Their listing carries **restrictions** (password, parental-control and update-mechanism options). If a restricted option is used, presumption of conformity is lost and a **notified body** assessment is needed — [VDMA/Commission RED cyber guidance](https://www.vdma.eu/documents/d/group-34568/com-red-hs-cyber-guidance_v1); [dev.to summary](https://dev.to/vladimir_vician/red-delegated-act-en-18031-what-it-actually-requires-in-hardware-58bb) `[search summary; guidance doc not opened]`
- The Cyber Resilience Act (Reg. (EU) 2024/2847) replaces this regime when its main obligations apply on **11 Dec 2027**. One secondary source states that the RED cyber delegated act is repealed at that point — [RapidCircuitry](https://www.rapidcircuitry.com/resources/eu-us-market-access-connected-devices) `[search summary, unverified against EUR-Lex]`. Background knowledge (unverified this session): CRA vulnerability/incident **reporting** duties for manufacturers (Art. 14) apply from **11 Sep 2026**, so they are already in force as of this writing — [EUR-Lex CRA 2024/2847](https://eur-lex.europa.eu/eli/reg/2024/2847/oj) `[reg text, not fetched]`
- RED essential requirements: Art. 3(1)(a) covers health and safety (LVD objectives *without* the voltage floor) and 3(1)(b) covers EMC. This is why radio devices declare CE under RED, not separately under LVD/EMC — [EUR-Lex RED 2014/53/EU](https://eur-lex.europa.eu/eli/dir/2014/53/oj); [Wikipedia: RED](https://en.wikipedia.org/wiki/Radio_Equipment_Directive_(2014)) `[reg text, not fetched]`

**Economic-operator duties under RED (the "who carries it" question)** `[reg text, not fetched: RED 2014/53/EU]`
- **Manufacturer** (Art. 10): technical documentation, conformity assessment, EU Declaration of Conformity, CE marking, instructions and safety information in a language easily understood by end-users as determined by the Member State (Art. 10(8)), and the manufacturer's name and address on the device (Art. 10(7)).
- **Importer** (Art. 12): only places compliant equipment on the market, checks conformity assessment and CE, **adds its own name and address** (Art. 12(3)), ensures language instructions, and keeps the DoC for 10 years.
- **Distributor** (Art. 13): verifies CE marking, documentation, instructions in the local language and manufacturer/importer identification before making the device available, and must not supply equipment it believes non-compliant.
- A distributor or importer that sells under **its own name or brand**, or modifies the device, is treated as the **manufacturer** (Art. 14) **(relevant for white-label resellers)**.

**Market Surveillance Regulation and GPSR**
- Reg. (EU) 2019/1020 Art. 4: products under listed harmonisation acts (including RED and RoHS) need an **EU-established economic operator** (manufacturer in EU, importer, authorised representative or fulfilment service provider). Its name and contact details go on the product, packaging, parcel or accompanying document — [EUR-Lex 2019/1020](https://eur-lex.europa.eu/eli/reg/2019/1020/oj) `[reg text, not fetched]`
- GPSR, Reg. (EU) 2023/988, applies from **13 Dec 2024**. Under Art. 16, a product may not be placed on the market unless an EU-established economic operator is responsible for it (the "EU responsible person"), with tasks covering safety oversight, documentation and cooperation with authorities — [Baker McKenzie summary](https://insightplus.bakermckenzie.com/bm/consumer-goods-retail_1/european-union-substantial-reform-of-european-product-safety-law-to-come-into-force-on-13-december-2024); [Commission GPSR Q&A](https://webgate.ec.europa.eu/safety/consumers/consumers_safety_gate/obligationsForBusinesses/documents/Q&A.pdf); [CMS](https://cms.law/en/bel/legal-updates/the-new-eu-general-product-safety-regulation-what-you-need-to-know) `[search summary]`
- For online and distance sales (GPSR Art. 19), listings must show the manufacturer's name and contact details, the EU responsible person's details when the manufacturer is outside the EU, product identification, and warnings and safety information — [Caspers Mock (Koblenz law firm)](https://www.caspers-mock.de/publikationen/gpsr_produktsicherheitsverordnung.htm?lang=en); [ecommercegermany](https://ecommercegermany.com/blog/gpsr-general-product-safety-regulation/) `[search summary]`
- GPSR obligations reach manufacturers, importers, **distributors**, online marketplaces and fulfilment providers — [CMS](https://cms.law/en/gbr/legal-updates/the-new-eu-general-product-safety-regulation-what-you-need-to-know) `[search summary]`. **(interpretation)** For harmonised products such as radio equipment, GPSR applies to aspects RED does not cover, such as distance-sales information, accident notification and traceability. Distributor duties sit in GPSR Art. 11 `[reg text, not fetched; Art. 11 contents not retrieved this session]`.

**RoHS, WEEE, batteries** `[reg text, not fetched]`
- RoHS 2011/65/EU: the manufacturer ensures compliance and covers it in the CE DoC (Art. 7). Distributors verify CE (Art. 10) — [EUR-Lex RoHS](https://eur-lex.europa.eu/eli/dir/2011/65/oj)
- WEEE 2012/19/EU: **producers must register in each Member State** where they sell (Art. 16). A seller that sells by distance directly to households in another Member State counts as a producer there and must appoint an **authorised representative** in that state (Art. 3(1)(f)(iv), Art. 17). The crossed-out wheelie-bin symbol is required (Art. 14(4)). Distributors carry take-back duties (Art. 5(2)) — [EUR-Lex WEEE](https://eur-lex.europa.eu/eli/dir/2012/19/oj). **(interpretation)** In Germany (ElektroG) marketplaces and distributors are required to check the producer's registration (WEEE-Reg.-Nr.), so EU resellers will ask for the number up front. National detail not verified this session.
- If the device has a battery: Batteries Regulation (EU) 2023/1542 producer registration/EPR (Art. 55). Packaging EPR is national (e.g. Germany's LUCID register) — [EUR-Lex 2023/1542](https://eur-lex.europa.eu/eli/reg/2023/1542/oj) `[reg text, not fetched]`

**Consumer-law exposure that drives RMA terms** `[reg text, not fetched]`
- The Sale of Goods Directive (EU) 2019/771 makes the **seller** liable to the consumer for lack of conformity for at least **2 years** (Art. 10), with a right of redress against earlier parties in the chain (Art. 18) — [EUR-Lex 2019/771](https://eur-lex.europa.eu/eli/dir/2019/771/oj)
- The Consumer Rights Directive 2011/83/EU gives a 14-day withdrawal right for distance sales (Art. 9) — [EUR-Lex 2011/83](https://eur-lex.europa.eu/eli/dir/2011/83/oj)

### Inferences
- **(interpretation)** The **RMA split** is effectively fixed by law. The EU reseller is liable to its consumers for 2 years, so it will demand a back-to-back warranty (≥24 months, advance replacement or credit, DOA policy, and who pays return freight from the EU to Korea). Offer an EU RMA/repair point or a credit-note model, not ship-back-to-Korea.
- **(interpretation)** Decide the **import model first**:
  - (a) *Reseller imports stock*: the reseller becomes importer. It will check documentation hard and wants its name on the label, so expect a request for co-branded or blank label space.
  - (b) *Wellbian/KWeather dropships from Korea*: an EU authorised representative or fulfilment provider (Reg. 2019/1020 Art. 4) plus WEEE authorised representatives in each destination country are needed.
  - (c) *One EU master distributor* imports and then supplies sub-resellers. This is cleanest for a first market.
- **(interpretation)** An indoor AQ device that sends room data to the cloud almost certainly falls under Art. 3(3)(d) and (e), and probably (e) on privacy grounds because it processes data from homes. An **EN 18031-1/-2 assessment report** will therefore be a gating document in 2026. Lacking it is a common reason distributors decline new connected devices.
- **(interpretation)** If a reseller sells the device under its own brand (white label), it becomes the manufacturer under RED Art. 14, so most resellers will refuse white-label until compliance is mature.

### Gaps
- GPSR Art. 11 (distributor duties) exact text and Commission Q&A answers were not retrieved.
- Country-specific WEEE/packaging/battery EPR fees and whether Wellbian's device has a battery: not researched.
- Whether existing KWeather devices already hold CE/RED, EN 18031 reports or KC/FCC test data reusable for CE: not checked here. Check `depin/` canon or KWeather.

---

## 4. EU token side: MiCA for hardware + rewards, and reseller exposure

### Takeaway
No DePIN-specific MiCA guidance was found. The analysis rests on the general MiCA Title II rules. Rewards "automatically created" for network maintenance and "free" offers are exempt from the white-paper duty (Art. 4(3)). However, a token is **not "free"** if the recipient pays fees or gives personal data in exchange **(interpretation risk: hardware purchase → rewards could be read this way)**, and the exemptions **fall away once admission to trading on an EU platform is sought** (Art. 4(4) / ESMA Q&A 2671). Resellers do not need a CASP licence just to sell hardware **(interpretation)**. Their real exposure is **marketing**: ROI or earnings claims risk breaching MiCA Art. 7 (fair, clear, not misleading, consistent with the white paper) and the Unfair Commercial Practices Directive.

### Cited Findings
- **ESMA Q&A 2671**: where a crypto-asset is offered in the Union but **only admitted to trading on a platform outside the Union**, Art. 4(4) does not apply and the offeror can use the Art. 4(2) and 4(3) exemptions if their conditions are met — [ESMA Q&A 2671](https://www.esma.europa.eu/publications-data/questions-answers/2671); commentary [MiCA Crypto Alliance](https://www.micacryptoalliance.com/news/esma-q-a-on-mica-white-paper-exemptions-and-territorial-scope) `[search summary of primary Q&A]`
- ESMA: crypto-asset services provided in a **fully decentralised** manner are out of scope, but whether a platform such as a DEX is fully decentralised is assessed **case by case** by national competent authorities — [ESMA Q&A 2671](https://www.esma.europa.eu/publications-data/questions-answers/2671) `[search summary]`
- ESMA keeps a white-paper register (MiCA Art. 109). An exempt offer that files no white paper will not appear in it. The interim register is published as CSV files and is due to move into ESMA IT systems around mid-2026 — [ESMA Art. 109](https://www.esma.europa.eu/publications-and-data/interactive-single-rulebook/mica/article-109-register-crypto-asset-white); [HELMS register explainer](https://helmsadvisory.com/mica-whitepaper-register) `[search summary; secondary for timing]`
- National competent authorities publish white-paper notification pages (e.g. Netherlands AFM) — [AFM: white papers](https://www.afm.nl/en/sector/cryptopartijen/toezicht/white-papers)
- MiCA text, Reg. (EU) 2023/1114 `[reg text, not fetched]` — [EUR-Lex MiCA](https://eur-lex.europa.eu/eli/reg/2023/1114/oj):
  - Art. 4(1): an offer to the public of "other" crypto-assets needs a white paper drawn up (Art. 6), notified (Art. 8) and published (Art. 9).
  - Art. 4(2): exemptions for offers to fewer than 150 persons per Member State, offers totalling ≤ €1,000,000 over 12 months, and offers solely to qualified investors.
  - Art. 4(3): no white paper needed for crypto-assets that are (a) offered for free, (b) automatically created as a reward for maintaining the DLT or validating transactions, (c) unique and non-fungible with other crypto-assets, or (d) utility tokens for an existing service or limited-network uses. Paragraph 3 (2nd subparagraph) says a crypto-asset is *not* considered offered for free where purchasers must provide personal data, or the offeror receives third-party fees, commissions, monetary or non-monetary benefits, in exchange. **(Check exact letters/wording against EUR-Lex before citing.)**
  - Art. 4(4): exemptions do not apply when the offeror or a person acting on its behalf announces an intention to seek admission to trading.
  - Art. 7: marketing communications must be clearly identifiable, fair, clear and not misleading, consistent with the white paper, and must point to the white paper.
  - Art. 143: transitional rules for tokens admitted to trading before 30 Dec 2024. **(Exact paragraph content not re-verified this session.)**
- Searches found **no example of a DePIN hardware project that has notified a MiCA white paper specifically for its reward token**, and no DePIN-specific regulator guidance. This is a gap, not evidence of absence.

### Inferences
- **(interpretation)** "Automatically created as a reward" (Art. 4(3)(b)) is worded around maintaining a DLT or validating transactions. Data-contribution rewards from sensors are not obviously the same thing, so relying on it for air-quality rewards is a legal stretch. Selling the device for money and then emitting tokens could also be argued to fall outside "offered for free" because of the "non-monetary benefits / personal data" carve-out. Data from a home sensor is arguably personal data. Get Korean and EU counsel to write this up before EU marketing. Wellbian's rewards layer being "in testing" is an advantage: EU materials can describe the device as a **data/air-quality product first** with no reward promises until the MiCA position is fixed.
- **(interpretation)** **Reseller obligations.** Selling hardware alone is not a crypto-asset service under MiCA Art. 3(1)(16). A reseller that actively promotes the token *on the offeror's behalf* could be caught by the "placing of crypto-assets" service definition or by Art. 7 marketing rules. Contracts should therefore (1) ban resellers from making token price, APY, ROI or payback claims, (2) supply approved reward wording, (3) bar resellers from handling tokens (no custody, swaps or token bundles), and (4) give the brand owner the right to delist a reseller for breaching the marketing rules. This mirrors how Hivemapper and Wingbits control their authorized lists.
- **(interpretation)** UCPD 2005/29/EC Art. 6–7 (misleading actions and omissions) independently prohibits implying earnings that are not assured. Hardware sold mainly on reward expectations draws regulator attention whatever MiCA says.

### Gaps
- No primary source showing how WeatherXM (EU-based), GEODNET, Hivemapper or Ambios handle MiCA for EU buyers (white paper filed, exemption claimed, or geo-blocking). Check ESMA's interim register CSV for WXM, GEOD, HONEY/BEE and AMB/Ambios tickers.
- No national regulator statements found on DePIN reward tokens.

---

## 5. Typical first-contact process: what EU resellers ask for

### Takeaway
No published source describing a DePIN reseller's intake checklist was found. The list below is **derived from the legal duties above plus the failure lessons**, so treat it as a reasoned checklist, not an observed industry standard.

### Cited Findings
- Distributors must verify CE marking, the DoC/documentation, local-language instructions and the identity of the manufacturer/importer before selling (RED Art. 13) — [EUR-Lex RED](https://eur-lex.europa.eu/eli/dir/2014/53/oj) `[reg text, not fetched]`
- Online listings must show manufacturer and EU-responsible-person details and safety information (GPSR Art. 19) — [Caspers Mock](https://www.caspers-mock.de/publikationen/gpsr_produktsicherheitsverordnung.htm?lang=en) `[search summary]`
- Resellers on approved lists publish regions served, product links and support information (Wingbits table structure) — [Wingbits approved distributors](https://docs.wingbits.com/project/wingbits-approved-distributors) `[search summary, unverified]`
- DePIN hardware gates include a security audit and an ongoing update commitment (DIMO) — [DIMO hardware docs](https://docs.dimo.org/docs/hardware) `[search summary, unverified]`

### Inferences
- **(interpretation)** Prepare this first-contact pack:
  1. **Product:** spec sheet (sensors, accuracy and calibration method, connectivity bands, power, battery), photos, and a packaging and label mock-up showing CE, WEEE bin, manufacturer, EU operator and languages.
  2. **Compliance:** EU DoC (RED), test reports (EN 62368-1 safety, EN 301 489 EMC, radio standard e.g. EN 300 328), **EN 18031-1/-2 report**, RoHS declaration, WEEE registration numbers or plan, battery/packaging EPR plan, named EU authorised representative or importer, firmware update and vulnerability-handling policy (CRA reporting readiness), and a GDPR/privacy note for in-home data.
  3. **Commercial:** EXW/DDP price ladder by volume, MSRP, MOQ, lead time, payment terms (no unfunded pre-orders), territory (non-exclusive by default, exclusivity only against volume commitments), marketing-development or demo-unit policy, and the authorized-reseller listing.
  4. **After-sales:** warranty ≥24 months back-to-back, DOA/RMA flow, EU spare stock, and support SLA split (L1 reseller, L2 KWeather/Wellbian).
  5. **Network/rewards:** a plain description of what the device does *without* rewards, the rewards-layer status ("in testing"), approved wording, a reseller marketing-rules annex (no ROI, APY or price talk), the MiCA position memo, and a continuity clause covering what happens if the rewards program changes.
  6. **Demand evidence:** current install base, KWeather B2B references, target segments (schools, offices, landlords), and any pilot data.

### Gaps
- No interviews or published intake forms from EU DePIN resellers (e.g. those on the Hivemapper or Wingbits lists) were found. Ask 2–3 listed EU resellers directly what they require.
