"""The glassmorphism design contract — one 135° light source across the whole site: every major
glass surface (tables, cards, Q&A, cite, pre) carries the SIGNATURE EDGE — a border that is crisp
gold-white at the TOP-LEFT and fades to nothing at the bottom-right — drawn as a masked gradient
ring (works over backdrop-blur), with row separators inside tables fading the same direction.
Pins the treatment on all four style surfaces so a style refactor can't silently drop it."""

from __future__ import annotations

import asyncio
import os
import tempfile

from koreaapi import admin
from koreaapi.pipeline.ingest import ingest_one
from koreaapi.sources.mock import MockSource

RING = "mask-composite:exclude"                          # the masked gradient-ring technique
EDGE = "linear-gradient(135deg,rgba(233,196,106"         # crisp gold at top-left -> fade
ROW_FADE = "border-image:linear-gradient(90deg"          # in-table separators fade left->right


def _build(tmp_path) -> str:
    db = tempfile.mktemp(suffix=".db")
    p = {"name_ko": "방탄소년단", "name_en_official": "BTS", "name_en_source": "official"}
    asyncio.run(ingest_one("facts", "artist:bts",
                           [MockSource("Wikidata", p), MockSource("Wikipedia", p)], db_path=db))
    out = str(tmp_path / "site")
    asyncio.run(admin.entity_pages(db_path=db, out_dir=out))
    asyncio.run(admin.report_html(db_path=db, out_path=os.path.join(out, "index.html")))
    asyncio.run(admin.monitor_html(db_path=db, out_path=os.path.join(out, "monitor.html")))
    return out


def test_every_style_surface_carries_the_signature_edge(tmp_path):
    out = _build(tmp_path)
    for page, has_table in [("index.html", True),                 # report style
                            ("artists.html", True),               # hub style (tablewrap)
                            (os.path.join("artist", "bts.html"), False),   # entity style
                            ("verify.html", False),               # hub style, pre-heavy
                            ("monitor.html", True)]:              # monitor style
        t = open(os.path.join(out, page), encoding="utf-8").read()
        assert RING in t and EDGE in t, f"{page} lost the signature edge"
        if has_table:
            assert ROW_FADE in t, f"{page} lost the fading row separators"
    # KO layer parity — the /ko/ pages share _ENTITY_STYLE, so the edge must be there too
    ko = open(os.path.join(out, "ko", "artist", "bts.html"), encoding="utf-8").read()
    assert RING in ko and EDGE in ko


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
