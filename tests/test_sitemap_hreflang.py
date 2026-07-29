"""Multilingual sitemap — full /ko/ parity exists page-for-page, but engines only treat the layers
as PAIRS (not duplicates / an under-indexed KO shadow) when the sitemap declares them: reciprocal
xhtml:link hreflang alternates on BOTH entries of every EN↔KO mirror, derived from the /ko/ path
convention. Data files without a mirror (latest.json, korea-rising.md) stay plain."""

from __future__ import annotations

import asyncio
import tempfile
from xml.etree import ElementTree as ET

from koreaapi import admin
from koreaapi.pipeline.ingest import ingest_one
from koreaapi.sources.mock import MockSource

XHTML = "{http://www.w3.org/1999/xhtml}link"
SM = "{http://www.sitemaps.org/schemas/sitemap/0.9}"


def _sitemap(tmp_path) -> dict[str, list[dict]]:
    db = tempfile.mktemp(suffix=".db")
    p = {"name_ko": "방탄소년단", "name_en_official": "BTS", "name_en_source": "official"}
    asyncio.run(ingest_one("facts", "artist:bts",
                           [MockSource("Wikidata", p), MockSource("Wikipedia", p)], db_path=db))
    out = str(tmp_path / "sitemap.xml")
    asyncio.run(admin.sitemap(db_path=db, out_path=out))
    root = ET.parse(out).getroot()          # namespaced parse also proves the XML is well-formed
    by_loc: dict[str, list[dict]] = {}
    for url in root.findall(f"{SM}url"):
        loc = url.find(f"{SM}loc").text
        by_loc[loc] = [dict(link.attrib) for link in url.findall(XHTML)]
    return by_loc


def test_pairs_carry_reciprocal_hreflang(tmp_path):
    by_loc = _sitemap(tmp_path)
    en = "https://aiagentlabs.co.kr/artist/bts.html"
    ko = "https://aiagentlabs.co.kr/ko/artist/bts.html"
    for loc in (en, ko):                     # BOTH sides annotated, identically (Google requires it)
        alts = {a["hreflang"]: a["href"] for a in by_loc[loc]}
        assert alts == {"en": en, "ko": ko, "x-default": en}
    # the homes pair up via the same convention
    root_alts = {a["hreflang"]: a["href"] for a in by_loc["https://aiagentlabs.co.kr/"]}
    assert root_alts["ko"] == "https://aiagentlabs.co.kr/ko/"
    assert by_loc["https://aiagentlabs.co.kr/ko/"] != []


def test_unpaired_data_files_stay_plain(tmp_path):
    by_loc = _sitemap(tmp_path)
    assert by_loc["https://aiagentlabs.co.kr/latest.json"] == []
    assert by_loc["https://aiagentlabs.co.kr/korea-rising.md"] == []


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
