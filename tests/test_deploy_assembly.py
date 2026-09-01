"""The deploy assembly — every `cp` in pages.yml must have a source a real build actually writes.

This is the failure class that has bitten twice: `search-index.json` was missed by the `*.html`
glob, and `.well-known/` is caught by no glob at all. Both passed every offline test and 404'd in
production. Unit tests prove a generator ran; only replaying the assembly proves the deploy ships
what the generator made. So: build the site, run every `cp` line from the workflow verbatim, and
put the result through the same `verifysite` gate the deploy uses.
"""

from __future__ import annotations

import asyncio
import glob
import os
import re
import shutil
import subprocess
import tempfile

from koreaapi import admin
from koreaapi.pipeline.ingest import ingest_one
from koreaapi.sources.mock import MockSource

_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_WORKFLOW = os.path.join(_REPO, ".github/workflows/pages.yml")

# Sources the workflow deliberately tolerates as absent (`2>/dev/null || true`) — the OpenTimestamps
# proof only exists once anchoring is enabled on the runner.
_OPTIONAL = ("2>/dev/null",)


def _cp_lines() -> list[str]:
    return [ln.strip().split("#")[0].strip()
            for ln in open(_WORKFLOW, encoding="utf-8").read().splitlines()
            if ln.strip().startswith("cp ")]


def _build(work: str) -> None:
    """Generate every artifact the workflow's build step produces, into `work`."""
    db = tempfile.mktemp(suffix=".db")
    seed = [("artist:bts", "방탄소년단", "BTS", "Big Hit Music"),
            ("artist:txt", "투모로우바이투게더", "TXT", "Big Hit Music"),
            ("place:haeundae", "해운대", "Haeundae", "Busan"),
            ("beach:gwangalli", "광안리", "Gwangalli", "Busan"),
            ("temple:beomeosa", "범어사", "Beomeosa", "Busan"),
            ("food:japchae", "잡채", "Japchae", None),
            ("food:bibimbap", "비빔밥", "Bibimbap", None)]
    for eid, ko, en, agency in seed:
        p = {"name_ko": ko, "name_en_official": en, "name_en_source": "official"}
        if agency:
            p["agency_en"] = agency
        if eid.split(":", 1)[0] in ("place", "beach", "temple"):
            p["geo"] = {"lat": 35.1, "lon": 129.1}
        asyncio.run(ingest_one("facts", eid,
                               [MockSource("Wikidata", p), MockSource("Wikipedia", p)], db_path=db))
    cwd = os.getcwd()
    os.chdir(work)
    try:
        asyncio.run(admin.entity_pages(db_path=db, out_dir="site"))
        asyncio.run(admin.report_html(db_path=db, out_path="report.html"))
        asyncio.run(admin.monitor_html(db_path=db, out_path="monitor.html"))
        asyncio.run(admin.llms_txt(db_path=db, out_path="llms.txt"))
        asyncio.run(admin.llms_full_txt(db_path=db, out_path="llms-full.txt"))
        asyncio.run(admin.reconcile_json(db_path=db, out_path="reconcile.json"))
        asyncio.run(admin.status_json(db_path=db, out_path="status.json"))
        asyncio.run(admin.markdown_digest(db_path=db))
        asyncio.run(admin.feed_xml(db_path=db, out_path="feed.xml"))
        asyncio.run(admin.feed_json(db_path=db, out_path="feed.json"))
        asyncio.run(admin.export(db_path=db, out_dir="data"))
        asyncio.run(admin.sitemap(db_path=db, out_path="sitemap.xml"))
        for committed in ("robots.txt", "CNAME", "googleb476fa8c4c3cccf0.html", "og.png"):
            shutil.copy(os.path.join(_REPO, committed), committed)
        shutil.copytree(os.path.join(_REPO, "skills"), "skills", dirs_exist_ok=True)
    finally:
        os.chdir(cwd)


def test_every_cp_source_exists_after_a_real_build(tmp_path):
    work = str(tmp_path / "build")
    os.makedirs(work)
    _build(work)
    cwd = os.getcwd()
    os.chdir(work)
    try:
        missing = []
        for line in _cp_lines():
            optional = any(tok in line for tok in _OPTIONAL)
            for src in re.match(r"cp (?:-r )?(.+?) _site", line).group(1).split():
                if src.startswith("-") or optional:
                    continue
                if not glob.glob(src):
                    missing.append(f"{src}   (from: {line})")
        assert not missing, "pages.yml copies source(s) the build never writes:\n  " + "\n  ".join(missing)
    finally:
        os.chdir(cwd)


def test_the_assembled_site_passes_its_own_deploy_gate(tmp_path):
    work = str(tmp_path / "build")
    os.makedirs(work)
    _build(work)
    cwd = os.getcwd()
    os.chdir(work)
    try:
        os.makedirs("_site", exist_ok=True)
        for line in _cp_lines():
            subprocess.run(line, shell=True, capture_output=True)  # noqa: S602 - our own workflow text
        res = admin.verify_site("_site", min_entities=2)
        assert res["ok"], res["failures"]
        # the surfaces this delta added must survive the ASSEMBLY, not just the build
        for surface in ("verify.html", "data.html", "og.png", "agents.json",
                        os.path.join(".well-known", "agent.json"), "search-index.json",
                        os.path.join("answers", "index.json"), os.path.join("artist", "bts.json"),
                        "latest-artist.json", os.path.join("skill", "SKILL.md")):
            assert os.path.exists(os.path.join("_site", surface)), f"/{surface} never reached _site"
    finally:
        os.chdir(cwd)


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
