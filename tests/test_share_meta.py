"""The share/discovery surface — og.png (1200×630 committed brand card) as og:image + large
twitter card + favicon on every generated page, and the home's WebSite node declaring its working
?q= search (SearchAction → sitelinks-searchbox eligibility). Without og:image, a link shared into
KakaoTalk/Slack/X renders as a bare text scrap; the card is the first impression of the brand."""

from __future__ import annotations

import asyncio
import os
import struct
import tempfile

from koreaapi import admin
from koreaapi.pipeline.ingest import ingest_one
from koreaapi.sources.mock import MockSource

_REPO = os.path.join(os.path.dirname(__file__), "..")
OG = 'property="og:image" content="https://aiagentlabs.co.kr/og.png"'
TW = 'name="twitter:card" content="summary_large_image"'
FAV = "data:image/svg+xml"


def _build(tmp_path) -> str:
    db = tempfile.mktemp(suffix=".db")
    p = {"name_ko": "방탄소년단", "name_en_official": "BTS", "name_en_source": "official"}
    asyncio.run(ingest_one("facts", "artist:bts",
                           [MockSource("Wikidata", p), MockSource("Wikipedia", p)], db_path=db))
    out = str(tmp_path / "site")
    asyncio.run(admin.entity_pages(db_path=db, out_dir=out))
    asyncio.run(admin.report_html(db_path=db, out_path=os.path.join(out, "index.html")))
    return out


def test_every_page_layer_carries_card_and_favicon(tmp_path):
    out = _build(tmp_path)
    for page in ("index.html", "artists.html", os.path.join("artist", "bts.html"),
                 os.path.join("ko", "index.html"), os.path.join("ko", "artist", "bts.html")):
        t = open(os.path.join(out, page), encoding="utf-8").read()
        assert OG in t and TW in t and FAV in t, f"{page} missing share meta"


def test_home_declares_its_search(tmp_path):
    out = _build(tmp_path)
    home = open(os.path.join(out, "index.html"), encoding="utf-8").read()
    assert '"@type": "SearchAction"' in home
    assert "search.html?q={search_term_string}" in home     # the template must survive f-string escaping
    assert '"logo": "https://aiagentlabs.co.kr/og.png"' in home


def test_og_asset_is_committed_and_shipped():
    # the asset itself: a real 1200x630 PNG at the repo root, cp'd by the deploy, gated by verifysite
    png = os.path.join(_REPO, "og.png")
    d = open(png, "rb").read()
    assert d[:8] == b"\x89PNG\r\n\x1a\n"
    w, h = struct.unpack(">II", d[16:24])
    assert (w, h) == (1200, 630)                             # the OG-standard card size
    wf = open(os.path.join(_REPO, ".github/workflows/pages.yml"), encoding="utf-8").read()
    assert "cp og.png _site/og.png" in wf                    # forget the cp -> every og:image 404s


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
