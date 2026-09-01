# AGENTS.md — working on KoreaAPI

Standing instructions for any agent or contributor entering this repo cold. Read this first, then
the doc your task needs. This file carries **only what lives nowhere else**; everything it points at
is the single source of truth for that subject, and copying from those files here would create the
drift invariant #8 exists to prevent.

| You need | Read |
|---|---|
| Why the product exists, what it must never become | [`PRINCIPLES.md`](./PRINCIPLES.md) — the 9 design invariants |
| What runs when, every safety system, deploying | [`OPERATIONS.md`](./OPERATIONS.md) |
| What was decided, what was reviewed and declined | [`ROADMAP.md`](./ROADMAP.md) — append-only |
| Locked Phase-1 scope | [`SCOPE.md`](./SCOPE.md) |
| The paid HTTP API + the MCP-over-URL endpoint | [`API.md`](./API.md), [`docs/MCP_INSTALL.md`](./docs/MCP_INSTALL.md) |
| Which env key activates which rail | [`docs/API_KEYS.md`](./docs/API_KEYS.md) |
| The visual system | [`DESIGN_HERITAGE.md`](./DESIGN_HERITAGE.md) |

## The one-paragraph orientation

KoreaAPI is a **verifiable data layer for Korean culture**: an append-only store of cross-verified
records, each carrying provenance, a Skill Score, and a SHA-256 `content_hash`, published three ways
— MCP tools for agents, a static crawlable site for answer engines, and plain JSON for anyone. The
verification is the product; the data is a commodity. Two faces, one store, never a second data path.

## How to work here

```bash
uv sync --extra dev --extra web      # once
uv run ruff check src tests          # lint (CI runs exactly this)
PYTHONPATH=src uv run pytest -q      # the full offline suite (CI runs exactly this)
PYTHONPATH=src uv run python -m koreaapi.admin   # CLI help = the command list
```

Before calling anything done: **ruff + the full suite + a real site build** (`entity_pages` →
`verify_site`). A change that ships a surface must prove the surface builds, not that a unit passed.

## The rules that exist only here

1. **This sandbox has no outbound network.** Every check you run locally is offline or mocked; live
   source behavior is only ever verified on GitHub's runners. Never call something "verified against
   the live API" from here — say what you actually ran. Sources are written key-gated and inert so a
   blocked or dormant rail is a graceful skip, never an error.
2. **Never guess a Wikidata Q-id.** A wrong hardcoded Q-id poisons the store with a confidently
   wrong record (this happened: `Q484203` resolved to "Arborka"). Korean/English *search terms* are
   safe — the identity guard degrades a bad term to a MISS. Resolve Q-ids live on the runner, never
   from memory.
3. **Never let a secret reach a published artifact.** Keys are read from `os.environ` at call time
   and must not appear in a citation, a record, a log line, or a commit. The published citation is
   built from the source name and timestamp only (`tests/test_kobis.py` pins this for one rail —
   hold every new rail to it).
4. **Certifications are reviewed code changes.** `admin certifyclaim` only *gates* a claim and
   prints the `roster.CERTIFIED` line; a human merges it. Never write one programmatically.
5. **Work lands on `koreaapi-standalone`.** The live repo is separate and the owner ports it (see
   OPERATIONS → Deploying). Never force-push `main` — the history is the moat.
6. **Fix drift and the pin together.** Adding a claim to a doc that the code owns means adding its
   guard to `tests/test_doc_drift.py` in the same change (invariant #8).

## What every change is judged against

- **Degrade to a miss, never to a wrong record** (invariant #9). Identity, type, grounding, and
  injection gates all *drop* a value rather than repair it. A missing field is honest.
- **Verification, not translation, is the value.** A new source must add cross-verification, live
  state, or history — never restate what a model already knows.
- **Honest floors.** A single-source record is capped and labeled as such. Never present agreement
  that did not happen, and show source disagreements rather than silently picking a winner.
- **Restraint.** A pass that finds nothing to improve changes nothing. The failure mode of an agent
  on this repo is adding a near-duplicate surface, not missing a feature.

## Layout

```
src/koreaapi/
├── pipeline/        ingest (the only writer), store, scheduler
├── sources/         one adapter per source; key-gated rails ship dormant
├── admin.py         the CLI + the whole static-site generator
├── api.py           the HTTP app; mounts the MCP server at /mcp
├── server.py        the MCP tools
├── answers.py       the Answer Products
├── integrity.py     canonicalization, content_hash, dataset hash, chain head
└── sanitize.py      the prompt-injection gate
skills/koreaapi/     the agent-install lane for CALLERS (not for maintainers)
tests/               ~450 offline tests, incl. the doc-drift and design contracts
```
