"""Pre-computed Answer Products (/answers/*.json) — the enumerable products (trip-plan per region,
food-guide per dietary filter, agency-roster per label hub) materialized as static machine answers:
the SAME envelope /v1/answer serves, live on the static host while REST + /mcp wait on an HTTP
deployment. Key sets == the page selectors, so an answer never exists without its citable page."""

from __future__ import annotations

import asyncio
import json
import os
import tempfile

from koreaapi import admin
from koreaapi.pipeline.ingest import ingest_one
from koreaapi.sources.mock import MockSource

_REPO = os.path.join(os.path.dirname(__file__), "..")


def _ingest(db: str, eid: str, ko: str, en: str, *, agency: str | None = None) -> None:
    p = {"name_ko": ko, "name_en_official": en, "name_en_source": "official"}
    if agency:
        p["agency_en"] = agency
    asyncio.run(ingest_one("facts", eid, [MockSource("Wikidata", p), MockSource("Wikipedia", p)],
                           db_path=db))


def _build(tmp_path) -> tuple[str, dict]:
    db = tempfile.mktemp(suffix=".db")
    for eid, ko, en in [("place:haeundae", "해운대", "Haeundae"),
                        ("beach:gwangalli", "광안리해수욕장", "Gwangalli Beach"),
                        ("temple:beomeosa", "범어사", "Beomeosa")]:
        _ingest(db, eid, ko, en, agency="Busan")                  # region -> trip-plan key
    _ingest(db, "artist:bts", "방탄소년단", "BTS", agency="Big Hit Music")
    _ingest(db, "artist:txt", "투모로우바이투게더", "Tomorrow X Together", agency="Big Hit Music")
    _ingest(db, "food:japchae", "잡채", "Japchae")                # FOOD_VEG: vegetarian
    _ingest(db, "food:bibimbap", "비빔밥", "Bibimbap")            # FOOD_VEG: vegetarian (ask)
    out = str(tmp_path / "site")
    res = asyncio.run(admin.entity_pages(db_path=db, out_dir=out))
    return out, res


def test_enumerable_products_are_materialized(tmp_path):
    out, res = _build(tmp_path)
    idx = json.load(open(os.path.join(out, "answers", "index.json"), encoding="utf-8"))
    by_product = {}
    for a in idx["answers"]:
        by_product.setdefault(a["product"], []).append(a)
    assert "trip-plan" in by_product and "agency-roster" in by_product and "food-guide" in by_product
    assert res["answers"] == idx["count"] == len(idx["answers"]) >= 3

    trip = json.load(open(os.path.join(out, "answers", "trip-plan-busan.json"), encoding="utf-8"))
    assert trip["product"] == "trip-plan" and trip["answer"] and "evidence" in trip  # the live envelope
    assert "Busan" in json.dumps(trip, ensure_ascii=False)

    roster = json.load(open(os.path.join(out, "answers", "agency-roster-big-hit-music.json"),
                            encoding="utf-8"))
    assert roster["product"] == "agency-roster"
    assert "BTS" in json.dumps(roster, ensure_ascii=False)        # the verified roster, in the answer

    fg = [a for a in by_product["food-guide"]]
    body = json.load(open(os.path.join(out, "answers",
                                       fg[0]["url"].rsplit("/", 1)[1]), encoding="utf-8"))
    assert body["product"] == "food-guide" and body["answer"]


def test_catalog_manifest_and_deploy_ship_the_answers(tmp_path):
    out, _res = _build(tmp_path)
    cat = open(os.path.join(out, "data.html"), encoding="utf-8").read()
    assert "answers/index.json" in cat                            # discoverable by humans
    man = json.load(open(os.path.join(out, "agents.json"), encoding="utf-8"))
    assert man["data"]["answers_precomputed"].endswith("/answers/index.json")  # ... and machines
    wf = open(os.path.join(_REPO, ".github/workflows/pages.yml"), encoding="utf-8").read()
    assert "cp -r site/answers _site/answers" in wf               # forget the cp -> answers 404 live


def test_empty_corpus_still_writes_the_dir(tmp_path):
    # cp -r site/answers must never fail on a thin build: the dir + index always exist
    db = tempfile.mktemp(suffix=".db")
    _ingest(db, "artist:solo", "솔로", "Solo")                    # no agency, no region, no food
    out = str(tmp_path / "site")
    asyncio.run(admin.entity_pages(db_path=db, out_dir=out))
    idx = json.load(open(os.path.join(out, "answers", "index.json"), encoding="utf-8"))
    assert idx["count"] == 0 and idx["answers"] == []


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
