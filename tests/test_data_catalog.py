"""Open-data catalog round — the fetch unit BETWEEN one entity twin and the full corpus:
per-vertical slices (/latest-<vertical>.json, written by export from the same latest map), the
reconcile index pointing at each entity's record twin, and /data.html (+/ko/) cataloging every
machine surface in one legible page."""

from __future__ import annotations

import asyncio
import json
import os
import tempfile

from koreaapi import admin
from koreaapi.pipeline.ingest import ingest_one
from koreaapi.sources.mock import MockSource

_REPO = os.path.join(os.path.dirname(__file__), "..")


def _seed(db: str) -> None:
    for eid, ko, en in [("artist:bts", "방탄소년단", "BTS"),
                        ("artist:newjeans", "뉴진스", "NewJeans"),
                        ("place:gyeongbokgung", "경복궁", "Gyeongbokgung")]:
        p = {"name_ko": ko, "name_en_official": en, "name_en_source": "official"}
        asyncio.run(ingest_one("facts", eid, [MockSource("Wikidata", p), MockSource("Wikipedia", p)],
                               db_path=db))


def test_export_writes_vertical_slices_that_partition_the_corpus(tmp_path):
    db = tempfile.mktemp(suffix=".db")
    _seed(db)
    out = str(tmp_path / "data")
    asyncio.run(admin.export(db_path=db, out_dir=out))
    latest = json.load(open(os.path.join(out, "latest.json"), encoding="utf-8"))
    artists = json.load(open(os.path.join(out, "latest-artist.json"), encoding="utf-8"))
    places = json.load(open(os.path.join(out, "latest-place.json"), encoding="utf-8"))
    assert all(r["entity_id"].startswith("artist:") for r in artists) and len(artists) == 2
    assert all(r["entity_id"].startswith("place:") for r in places) and len(places) == 1
    # the slices PARTITION the corpus — same items, nothing lost, nothing invented
    key = lambda r: r["entity_id"]  # noqa: E731
    assert sorted(artists + places, key=key) == sorted(latest, key=key)
    assert all(r["content_hash"] for r in artists)               # slice rows stay self-verifiable


def test_reconcile_points_at_the_record_twin(tmp_path):
    db = tempfile.mktemp(suffix=".db")
    _seed(db)
    out = str(tmp_path / "reconcile.json")
    asyncio.run(admin.reconcile_json(db_path=db, out_path=out))
    ents = {e["id"]: e for e in json.load(open(out, encoding="utf-8"))["entities"]}
    assert ents["artist:bts"]["record"].endswith("/artist/bts.json")   # resolve → fetch, one hop


def test_data_catalog_page(tmp_path):
    db = tempfile.mktemp(suffix=".db")
    _seed(db)
    out = str(tmp_path / "site")
    asyncio.run(admin.entity_pages(db_path=db, out_dir=out))
    en = open(os.path.join(out, "data.html"), encoding="utf-8").read()
    assert "latest-&lt;vertical&gt;.json" in en                  # the slice pattern, documented
    assert "artist/&lt;slug&gt;.json" in en                      # the twin pattern
    assert "curl -s" in en and "integrity-log.jsonl" in en       # copy-paste fetch + the chain
    ko = open(os.path.join(out, "ko", "data.html"), encoding="utf-8").read()
    assert '<html lang="ko">' in ko and "latest-&lt;vertical&gt;.json" in ko
    sm = tempfile.mktemp(suffix=".xml")
    asyncio.run(admin.sitemap(db_path=db, out_path=sm))
    smt = open(sm, encoding="utf-8").read()
    assert "/data.html" in smt and "/ko/data.html" in smt
    man = json.load(open(os.path.join(out, "agents.json"), encoding="utf-8"))
    assert man["data"]["catalog"].endswith("/data.html")
    assert man["data"]["vertical_json"].endswith("/latest-<vertical>.json")
    wf = open(os.path.join(_REPO, ".github/workflows/pages.yml"), encoding="utf-8").read()
    assert "cp data/latest-*.json _site/" in wf                  # forget the cp -> slices 404 live


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
