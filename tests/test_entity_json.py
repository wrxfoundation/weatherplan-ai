"""Per-entity record JSON twins (/artist/<slug>.json) — the static host as a data API. The live
deployment is GitHub Pages (static): REST + /mcp wait on an HTTP host, but the twin makes ONE
verified record addressable TODAY. Doctrine: the twin is the entity's exact /latest.json slice —
same item shape, same content_hash — so /verify.html step 2 applies to it unchanged."""

from __future__ import annotations

import asyncio
import json
import os
import tempfile

from koreaapi import admin, integrity
from koreaapi.pipeline.ingest import ingest_one
from koreaapi.sources.mock import MockSource


def _seed(db: str) -> None:
    for eid, ko, en in [("artist:bts", "방탄소년단", "BTS"),
                        ("place:gyeongbokgung", "경복궁", "Gyeongbokgung")]:
        p = {"name_ko": ko, "name_en_official": en, "name_en_source": "official"}
        asyncio.run(ingest_one("facts", eid, [MockSource("Wikidata", p), MockSource("Wikipedia", p)],
                               db_path=db))


def _build(tmp_path) -> tuple[str, str]:
    db = tempfile.mktemp(suffix=".db")
    _seed(db)
    out = str(tmp_path / "site")
    asyncio.run(admin.entity_pages(db_path=db, out_dir=out))
    return out, db


def test_twin_is_the_entitys_latest_json_slice(tmp_path):
    # The twin must be byte-consistent with /latest.json: identical items, identical content_hash —
    # an agent that verifies one learns to trust the other.
    out, db = _build(tmp_path)
    twin = json.load(open(os.path.join(out, "artist", "bts.json"), encoding="utf-8"))
    assert isinstance(twin, list) and twin[0]["entity_id"] == "artist:bts"
    item = twin[0]
    got_hash = item.pop("content_hash")
    assert got_hash == integrity.record_fingerprint(item)        # self-verifiable, /verify.html step 2
    item["content_hash"] = got_hash
    data_dir = str(tmp_path / "data")
    asyncio.run(admin.export(db_path=db, out_dir=data_dir))
    latest = json.load(open(os.path.join(data_dir, "latest.json"), encoding="utf-8"))
    match = [r for r in latest if r["entity_id"] == "artist:bts"]
    assert match == twin                                          # the exact /latest.json slice


def test_pages_link_the_twin(tmp_path):
    out, _db = _build(tmp_path)
    en = open(os.path.join(out, "artist", "bts.html"), encoding="utf-8").read()
    assert 'rel="alternate" type="application/json" href="./bts.json"' in en   # machine-discoverable
    assert '<a href="./bts.json">record JSON</a>' in en                        # human-visible cite line
    assert '<a href="../verify.html">how to verify</a>' in en                  # the proof walkthrough
    ko = open(os.path.join(out, "ko", "artist", "bts.html"), encoding="utf-8").read()
    assert 'type="application/json" href="../../artist/bts.json"' in ko
    assert '<a href="../verify.html">검증 방법</a>' in ko
    # the JSON-LD graph advertises the twin as a Dataset distribution (DataDownload) on BOTH
    # language layers — an answer engine lifting the node finds the machine record + hash story
    for page, marker in [(en, "verified record (KoreaAPI)"), (ko, "검증 레코드 (KoreaAPI)")]:
        ld = page.split("application/ld+json")[1]
        assert '"@type": "Dataset"' in ld and '"@type": "DataDownload"' in ld
        assert '/artist/bts.json"' in ld and marker in ld


def test_manifest_and_llms_advertise_the_pattern(tmp_path):
    out, db = _build(tmp_path)
    man = json.load(open(os.path.join(out, "agents.json"), encoding="utf-8"))
    assert man["data"]["entity_json"].endswith("/artist/<slug>.json")
    fa = open(os.path.join(out, "for-agents.html"), encoding="utf-8").read()
    assert "/artist/&lt;slug&gt;.json" in fa
    lt = tempfile.mktemp(suffix=".txt")
    asyncio.run(admin.llms_txt(db_path=db, out_path=lt))
    assert "/artist/<slug>.json" in open(lt, encoding="utf-8").read()


def test_verifysite_gates_the_twins(tmp_path):
    # The twins ride along `cp -r site/artist` (no workflow change to forget) — but a generator
    # regression that stops writing them must fail the deploy gate, not silently strip the surface.
    db = tempfile.mktemp(suffix=".db")
    _seed(db)
    site = str(tmp_path / "site")
    asyncio.run(admin.entity_pages(db_path=db, out_dir=site))
    asyncio.run(admin.report_html(db_path=db, out_path=os.path.join(site, "index.html")))
    asyncio.run(admin.sitemap(db_path=db, out_path=os.path.join(site, "sitemap.xml")))
    asyncio.run(admin.llms_txt(db_path=db, out_path=os.path.join(site, "llms.txt")))
    asyncio.run(admin.llms_full_txt(db_path=db, out_path=os.path.join(site, "llms-full.txt")))
    asyncio.run(admin.reconcile_json(db_path=db, out_path=os.path.join(site, "reconcile.json")))
    asyncio.run(admin.status_json(db_path=db, out_path=os.path.join(site, "status.json")))
    res = admin.verify_site(site, min_entities=2)
    assert res["ok"], res["failures"]
    assert res["stats"]["artist_json"] >= 2
    os.remove(os.path.join(site, "artist", "bts.json"))
    res2 = admin.verify_site(site, min_entities=2)
    assert not res2["ok"] and any("record-JSON twins" in f for f in res2["failures"])


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
