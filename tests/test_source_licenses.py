"""Per-source upstream terms — the promise the licence note makes, kept.

Our compilation is CC-BY-4.0, and the note has always said the underlying facts "keep their source
licenses (see each record's `sources`)". But `sources` is a citation string; the terms appeared
nowhere, so a reuser — including an AI company training on this corpus, which is exactly what
Korea's 공공누리 AI유형 was created in 2026-01 to enable — could not act on the difference between
CC0 (asks nothing), CC BY-SA (share-alike), and 공공누리 (per-dataset type can forbid commercial use).

The load-bearing guard here is coverage: every source adapter that can appear in a citation must
have an entry, so adding a source without declaring its terms fails CI instead of shipping silently.
"""

from __future__ import annotations

import glob
import json
import os
import re

from koreaapi.license import LICENSE, SOURCE_LICENSES, license_for

_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def test_every_source_adapter_declares_its_terms():
    declared = set()
    for path in glob.glob(os.path.join(_REPO, "src/koreaapi/sources/*.py")):
        if os.path.basename(path) in ("__init__.py", "base.py", "mock.py"):
            continue
        text = open(path, encoding="utf-8").read()
        declared |= {m for m in re.findall(r'^\s*name = "([^"]+)"', text, re.M)}
    assert declared, "found no source adapters — the scan is broken, not the licensing"
    missing = sorted(declared - set(SOURCE_LICENSES))
    assert not missing, f"source(s) shipping with no declared upstream terms: {missing}"


def test_published_citations_all_resolve_to_terms():
    # Whatever a consumer actually sees in provenance.sources must be resolvable.
    for citation, expected in [
        ("Wikidata Q13580495 2026-07-30 06:24 UTC", "Wikidata"),
        ("Wikipedia BTS 2026-07-30 06:24 UTC", "Wikipedia"),
        ("Open Library OL123M 2026-07-30 06:24 UTC", "Open Library"),   # two-word provider
        ("OpenStreetMap 12345 2026-07-30 06:24 UTC", "OpenStreetMap"),
        ("Circle Chart 2026-W30 2026-07-30 06:24 UTC", "Circle Chart"),  # two words again
        ("KOFIC/KOBIS 영화관입장권통합전산망 20260729", None),                # citation, not the adapter name
    ]:
        got = license_for(citation)
        assert (got or {}).get("source") == expected, f"{citation!r} -> {got}"
    assert license_for(None) is None and license_for("") is None and license_for(7) is None


def test_terms_are_shaped_for_a_machine_to_act_on():
    for name, terms in SOURCE_LICENSES.items():
        assert terms["id"] and terms["url"].startswith("https://"), name
        assert isinstance(terms["attribution_required"], bool), name
        assert isinstance(terms["verified"], bool), name
        assert terms["note"], name
        # share_alike is the obligation a reuser most needs to see; where it applies, say so
        if "SA" in terms["id"] or "ODbL" in terms["id"]:
            assert terms.get("share_alike") is True, f"{name} is share-alike but does not say so"


def test_uncertainty_is_declared_not_hidden():
    # Same doctrine as the dormant rails: say "verify this" rather than assert a type we never read.
    for name in ("KTO", "KOSIS", "KOPIS", "KHS", "KOBIS"):
        terms = SOURCE_LICENSES[name]
        assert terms["verified"] is False, f"{name} claims verified terms we have not confirmed"
        assert "공공누리" in terms["note"] and "AI유형" in terms["note"]
    assert SOURCE_LICENSES["Wikidata"]["verified"] is True    # the ones we DO know are marked known


def test_the_manifest_publishes_the_terms(tmp_path):
    import asyncio
    import tempfile

    from koreaapi import admin
    from koreaapi.pipeline.ingest import ingest_one
    from koreaapi.sources.mock import MockSource
    db = tempfile.mktemp(suffix=".db")
    p = {"name_ko": "방탄소년단", "name_en_official": "BTS", "name_en_source": "official"}
    asyncio.run(ingest_one("facts", "artist:bts",
                           [MockSource("Wikidata", p), MockSource("Wikipedia", p)], db_path=db))
    out = str(tmp_path / "site")
    asyncio.run(admin.entity_pages(db_path=db, out_dir=out))
    man = json.load(open(os.path.join(out, "agents.json"), encoding="utf-8"))
    lic = man["licensing"]
    assert lic["compilation"] == LICENSE["id"]
    assert lic["sources"] == SOURCE_LICENSES                 # published text == the code's table
    assert lic["sources"]["Wikipedia"]["share_alike"] is True
    assert "provenance.sources" in lic["how"]


def test_record_shape_is_untouched_by_licensing(tmp_path):
    # Licensing is DERIVED metadata. Putting it inside a record would change `data`, and `data` is
    # inside the hashed core — every content_hash ever published would move. It must stay out.
    import asyncio
    import tempfile

    from koreaapi import integrity
    from koreaapi.pipeline import store
    from koreaapi.pipeline.ingest import ingest_one
    from koreaapi.sources.mock import MockSource
    db = tempfile.mktemp(suffix=".db")
    p = {"name_ko": "방탄소년단", "name_en_official": "BTS", "name_en_source": "official"}
    asyncio.run(ingest_one("facts", "artist:bts",
                           [MockSource("Wikidata", p), MockSource("Wikipedia", p)], db_path=db))
    rec = json.loads(asyncio.run(store.latest("artist:bts", "facts", db_path=db)).model_dump_json())
    assert "license" not in rec["data"] and "licensing" not in rec["data"]
    assert integrity.record_fingerprint(rec)                  # still hashes by the frozen spec


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
