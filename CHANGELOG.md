# Changelog

## 0.3.0 — 2026-07

The agent-economy release: grounded AI labor, a free-text front door, the physical-proximity graph,
Korean-surface parity, a self-healing freshness engine, and deploy safety.

### Agent surface
- **`ask`** — free-text question → routed to the right Answer Product and run (LLM router with a pure
  keyword fallback; the routing decision is logged as demand signal).
- New Answer Products: **evidence-pack** (the paste-ready citation bundle), **compare** (X vs Y, side
  by side, strictly from verified records), **trip-plan** is now map-ready (verified coordinates on
  items + walkable ≤3 km clusters), **related** gains `nearby` (great-circle km from verified P625).
- Machine-actionable HTTP errors (404/405/500 carry the next action), cache headers for agent fleets,
  `agents.json → autonomous_use` (terms for autonomous/spawned agents, incl. downstream
  re-verification via content_hash + integrity chain), the manifest also at `/.well-known/agent.json`.
- **MCP over a URL**: the HTTP app mounts the MCP server at `/mcp` (Streamable HTTP) — one
  deployment serves REST + MCP; any MCP client connects with zero install (`agents.json → mcp.http`).
- **Per-entity record JSON** (`/artist/<slug>.json`) — the entity's exact `/latest.json` slice (same
  items, same `content_hash`), so the static host serves one addressable verified record per entity;
  linked from every entity page (`rel=alternate` + the cite line), advertised in `agents.json →
  data.entity_json` + `llms.txt`, and required by the `verifysite` deploy gate.
- ~18x faster serving reads: every store scan collapsed to one window-function query
  (`store.latest_all`).

### Grounded AI labor (never a hallucination path)
- **enrich.py** — structured facts + alternate names extracted from the cited Wikipedia lead; every
  value must appear literally in the abstract; run-once per entity with self-healing on transient
  failures. Aliases widen `resolve`, site search, and JSON-LD `alternateName`, and render as
  "Also known as" (EN/KO).

### Crawlable/citable surfaces (AEO/GEO)
- Region travel guides + dietary food guides (EN + `/ko/`), walkable-cluster sections with honest
  anchor-relative geometry + schema.org **TouristTrip**, `/whats-new.html` (verified change events),
  **site search** over every entity/person/label hub (+ `?q=` deep links), per-vertical corpus chunks
  (`/llms-<vertical>.txt`), grounded "What is X?" FAQ on every entity page, richer JSON-LD
  (dateModified · isPartOf · license · identifier · alternateName), custom 404, source-disagreement
  notes ("shown, not hidden"), Korean label hubs (`/ko/label/`) and full KO-page parity.
- **`/verify.html`** (+ `/ko/`) — the trustless re-verification walkthrough: dataset `sha256sum` vs
  `integrity.json`, per-record `content_hash`, the append-only chain, the Bitcoin anchor
  (`ots verify`). The integrity machinery, human-legible.
- **Multilingual sitemap**: every EN↔KO page pair carries reciprocal `xhtml:link` hreflang
  alternates (both entries, per Google's form) so the full `/ko/` layer indexes as pairs, not
  duplicates; entity pages (EN + KO) advertise their machine twin as a schema.org **Dataset →
  DataDownload** node in the crawled graph.
- **Share/discovery surface**: a committed 1200×630 brand card (`/og.png`, drawn in the site's own
  glass + signature-edge design) as `og:image` + large Twitter card on every page, an inline SVG
  favicon everywhere, and the home's WebSite node now declares its `?q=` search (**SearchAction**,
  sitelinks-searchbox form) with an Organization `logo`.
- **Open-data catalog**: per-vertical corpus slices (`/latest-<vertical>.json` — the fetch unit
  between one entity twin and the full corpus, same `content_hash` per record), `reconcile.json`
  entries now point at each entity's record twin (`record`), and **`/data.html`** (+ `/ko/`)
  catalogs every machine surface with copy-paste fetches.
- **Pre-computed Answer Products** (`/answers/<product>-<key>.json` + `index.json`): the enumerable
  products — trip-plan per region, food-guide per dietary filter, agency-roster per label — as
  static machine answers in the same envelope `/v1/answer` serves, live on the static host today.
- **Claude-Skill lane** (`skills/koreaapi/`, served at `/skill/`): SKILL.md + a stdlib-only
  lookup script that resolves a name, fetches the verified record, **independently re-verifies**
  its `content_hash` (exit 2 on mismatch), and prints the citable line — installable into any
  skill-supporting agent with no server and no key; a sync test pins the standalone fingerprint
  to `integrity.record_fingerprint`.

### Data engine & ops
- **refresh** — re-verifies the stalest discovered entities every collect tick (half-TTL threshold,
  oldest-first, stride-sampled against starvation, a no-downgrade ≥2-source floor, verified-geo
  carry-forward). Fixes the "everything goes stale" failure mode.
- **verifysite** — a pre-deploy gate on the assembled site; a broken/skeleton build fails instead of
  deploying (Pages keeps the last good deployment).
- New dormant official source: **KHS (국가유산청)** for heritage/temples/palaces (key-gated, inert).
- `status.json` freshness + geo-coverage observability; OPERATIONS.md (the operator's map); README
  rewritten to match the shipped system.

## 0.2.0 and earlier

See `ROADMAP.md` for the decision log (Phase 1 → Phase 2 source expansion, verification tiers,
integrity chain, certification rail, x402, the geo verticals, discovery engine).
