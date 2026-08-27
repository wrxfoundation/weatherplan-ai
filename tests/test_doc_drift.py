"""Doc-drift guards — every countable claim our docs make, derived from the code that decides it.

We had been writing these one at a time, each after drift bit us in production (the KOPIS/KHERITAGE
secrets documented as wired but not mapped; the workflow `cp` lines; the install doc's tool list).
The pattern held on audit: every claim a test pinned was still true, and the unpinned ones had
drifted — API.md was missing 7 of 15 live /v1 endpoints (including /v1/answer), the CLI help was
missing 7 implemented commands (including the whole ops safety trio), and the hub count was off by
one. So the reflex belongs in one place: derive the truth from code, assert the docs match.

Add a case here whenever a doc starts asserting a number, a list, or a name the code owns.
"""

from __future__ import annotations

import asyncio
import re

from koreaapi import admin, answers
from koreaapi.roster import NAMES

_REPO = __file__.rsplit("/", 2)[0]


def _read(rel: str) -> str:
    return open(f"{_REPO}/{rel}", encoding="utf-8").read()


def test_api_md_documents_every_live_v1_endpoint():
    # API.md is what an operator reads to evaluate the paid API — an endpoint missing from it is
    # an endpoint that does not exist commercially, however well it runs.
    api_py, api_md = _read("src/koreaapi/api.py"), _read("API.md")
    live = {r for r in re.findall(r'Route\("(/v1/[^"]+)"', api_py)}
    missing = sorted(r for r in live if r.split("{")[0].rstrip("/") not in api_md)
    assert not missing, f"API.md does not document live endpoint(s): {missing}"


def test_cli_help_lists_every_implemented_command():
    # The module docstring IS the CLI help. A command missing from it is undiscoverable — and the
    # ones that had gone missing were bootstrap / refresh / verifysite: the ops safety trio.
    src = _read("src/koreaapi/admin.py")
    documented = set(re.findall(r"python -m koreaapi\.admin (\w+)", src[:6000]))
    implemented = set(re.findall(r'cmd == "(\w+)"', src))
    missing = sorted(implemented - documented)
    assert not missing, f"CLI help omits implemented command(s): {missing}"
    phantom = sorted(documented - implemented)
    assert not phantom, f"CLI help advertises command(s) that do not exist: {phantom}"


def test_counted_claims_match_the_code_that_owns_them():
    ops, readme = _read("OPERATIONS.md"), _read("README.md")
    n_products = answers.list_products()["count"]
    n_verticals = len(admin._VERTICALS)
    for label, text in (("OPERATIONS.md", ops), ("README.md", readme)):
        for claim in re.findall(r"(\d+) Answer Products", text):
            assert int(claim) == n_products, f"{label} claims {claim} Answer Products, real {n_products}"
        for claim in re.findall(r"(\d+) vertical hubs", text):
            assert int(claim) == n_verticals, f"{label} claims {claim} vertical hubs, real {n_verticals}"
    # the deploy gate must stay above the roster it is meant to out-rank (a skeleton build can't pass)
    gate = int(re.search(r"verifysite _site (\d+)", _read(".github/workflows/pages.yml")).group(1))
    assert gate > len(NAMES), f"verifysite gate {gate} no longer exceeds the {len(NAMES)}-entity roster"
    claimed = re.search(r"~(\d+)-entity roster", ops)
    assert claimed and int(claimed.group(1)) == len(NAMES), \
        f"OPERATIONS roster size {claimed and claimed.group(1)} != {len(NAMES)}"


def test_changelog_version_matches_the_package():
    ver = re.search(r'version = "([^"]+)"', _read("pyproject.toml")).group(1)
    top = re.search(r"^## ([\d.]+)", _read("CHANGELOG.md"), re.M).group(1)
    assert ver == top, f"pyproject {ver} != CHANGELOG {top}"


def test_every_key_gated_source_is_documented_somewhere():
    # "Activation is adding a secret" is only true if an operator can FIND the key. Every env key
    # the code gates on must appear in an operator-facing doc (which one depends on the rail).
    import glob
    keys: set[str] = set()
    for path in glob.glob(f"{_REPO}/src/koreaapi/**/*.py", recursive=True):
        keys |= set(re.findall(r'environ\.get\("([A-Z][A-Z0-9_]+)"', open(path, encoding="utf-8").read()))
    keys -= {"PORT", "PYTHONPATH", "KOREAAPI_DB", "KOREAAPI_DATA_URL", "MCP_TRANSPORT",
             "HOME", "PATH", "CIRCLECHART_URL", "KOBIS_URL"}   # runtime knobs, not activation keys
    docs = " ".join(_read(p) for p in ("OPERATIONS.md", "docs/API_KEYS.md", "API.md", "docs/PAYMENTS.md"))
    missing = sorted(k for k in keys if k not in docs)
    assert not missing, f"env-gated key(s) documented nowhere an operator reads: {missing}"


def test_admin_commands_all_reachable_from_the_dispatcher():
    # A documented command whose dispatcher branch was renamed away fails silently as "unknown".
    src = _read("src/koreaapi/admin.py")
    for cmd in re.findall(r"python -m koreaapi\.admin (\w+)", src[:6000]):
        assert f'cmd == "{cmd}"' in src, f"help documents `{cmd}` but no dispatcher branch handles it"


def test_surfaces_inventory_names_only_files_the_build_writes(tmp_path):
    # OPERATIONS' surfaces inventory is the operator's map; a surface listed but never written is
    # a phantom. Build a real site and check every top-level page the inventory names exists.
    import tempfile

    from koreaapi.pipeline.ingest import ingest_one
    from koreaapi.sources.mock import MockSource
    db = tempfile.mktemp(suffix=".db")
    for eid, ko, en in [("artist:bts", "방탄소년단", "BTS"), ("place:gg", "경복궁", "Gyeongbokgung")]:
        p = {"name_ko": ko, "name_en_official": en, "name_en_source": "official"}
        asyncio.run(ingest_one("facts", eid, [MockSource("Wikidata", p), MockSource("Wikipedia", p)],
                               db_path=db))
    out = str(tmp_path / "site")
    asyncio.run(admin.entity_pages(db_path=db, out_dir=out))
    import os
    named = set(re.findall(r"`/([a-z0-9-]+\.html)`", _read("OPERATIONS.md")))
    named -= {"index.html"}                      # written by `report`, not entity_pages
    missing = sorted(n for n in named if not os.path.exists(os.path.join(out, n)))
    assert not missing, f"OPERATIONS names surface(s) the build never writes: {missing}"


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
