"""The SKILL distribution lane (absorbed from NomaDamas/k-skill) — skills/koreaapi ships the
verified-data capability into any skill-supporting agent (Claude Code · Codex · OpenCode) with no
server, no key, no install. The bundled stdlib script re-implements the content_hash fingerprint
WITHOUT importing koreaapi (independent re-verification is the point) — so a sync test pins the
two algorithms to each other: drift breaks CI here, not user trust in the field."""

from __future__ import annotations

import importlib.util
import json
import os
import tempfile

from koreaapi import integrity

_REPO = os.path.join(os.path.dirname(__file__), "..")
_SKILL = os.path.join(_REPO, "skills", "koreaapi")


def _script():
    spec = importlib.util.spec_from_file_location(
        "koreaapi_lookup", os.path.join(_SKILL, "scripts", "koreaapi_lookup.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_REC = {  # a rich record: unicode, timestamped citations, nested data, an existing content_hash
    "entity_id": "artist:bts", "kind": "facts",
    "name": {"ko": "방탄소년단", "en_official": "BTS", "romanized": "Bangtan Sonyeondan"},
    "summary_en": "BTS (방탄소년단) — verified Korean artist.",
    "summary_ko": "방탄소년단 — 검증된 아티스트.",
    "data": {"agency_en": "Big Hit Music", "members": ["RM", "Jin"], "geo": {"lat": 37.5, "lon": 127.0}},
    "provenance": {"skill_score": 1.0, "agreeing_sources": 2,
                   "sources": ["Wikidata Q13580495 2026-07-30 06:24 UTC",
                               "Wikipedia BTS 2026-07-30 06:24 UTC"]},
    "snapshot_at": "2026-07-30T06:24:00+00:00",
}


def test_standalone_fingerprint_matches_the_real_one():
    # THE load-bearing pin: the skill script verifies records with its own stdlib fingerprint —
    # it must equal koreaapi.integrity.record_fingerprint byte-for-byte, or field verification lies.
    assert _script().fingerprint(dict(_REC)) == integrity.record_fingerprint(dict(_REC))
    with_hash = {**_REC, "content_hash": "deadbeef"}          # an existing hash never feeds the hash
    assert _script().fingerprint(with_hash) == integrity.record_fingerprint(with_hash)


def _write_site(tmp_path, rec: dict) -> str:
    site = tmp_path / "fake-site"
    (site / "artist").mkdir(parents=True)
    (site / "search-index.json").write_text(json.dumps([
        {"s": "bts", "ko": "방탄소년단", "en": "BTS", "r": "Bangtan Sonyeondan",
         "a": ["Bangtan Boys"], "k": "artist"},
        {"s": "bong-joon-ho", "ko": "봉준호", "en": "Bong Joon-ho", "k": "person"},
    ], ensure_ascii=False), encoding="utf-8")
    (site / "artist" / "bts.json").write_text(json.dumps([rec], ensure_ascii=False), encoding="utf-8")
    return f"file://{site}"


def test_lookup_verifies_and_cites(tmp_path, capsys):
    rec = dict(_REC)
    rec["content_hash"] = integrity.record_fingerprint(rec)
    base = _write_site(tmp_path, rec)
    code = _script().main(["koreaapi_lookup.py", "방탄 소년단", "--base", base])  # spaced + alias-shaped
    out = capsys.readouterr().out
    assert code == 0 and "VERIFIED ✓" in out
    assert "via KoreaAPI" in out and "as of 2026-07-30" in out   # the citable line, ready to paste


def test_lookup_fails_loudly_on_a_tampered_record(tmp_path, capsys):
    rec = dict(_REC)
    rec["content_hash"] = integrity.record_fingerprint(rec)
    rec["summary_en"] = "BTS — TAMPERED claim."                  # bytes changed AFTER hashing
    base = _write_site(tmp_path, rec)
    code = _script().main(["koreaapi_lookup.py", "BTS", "--base", base])
    assert code == 2 and "DO NOT TRUST" in capsys.readouterr().out


def test_lookup_honest_miss(tmp_path, capsys):
    rec = dict(_REC)
    rec["content_hash"] = integrity.record_fingerprint(rec)
    code = _script().main(["koreaapi_lookup.py", "존재하지않는엔티티", "--base", _write_site(tmp_path, rec)])
    assert code == 1 and "verified data only" in capsys.readouterr().out


def test_skill_md_conventions_and_shipping(tmp_path):
    md = open(os.path.join(_SKILL, "SKILL.md"), encoding="utf-8").read()
    head = md.split("---")[1]                                    # the k-skill-compatible frontmatter
    assert "name: koreaapi" in head and "license: MIT" in head and "locale: ko-KR" in head
    assert "description:" in head and "Use when" in head         # trigger text for the agent
    assert "verify" in md.lower() and "content_hash" in md       # the verification story is the pitch
    wf = open(os.path.join(_REPO, ".github/workflows/pages.yml"), encoding="utf-8").read()
    assert "cp -r skills/koreaapi _site/skill" in wf             # served at /skill/ — guard the cp
    # the machine manifest advertises the lane
    db = tempfile.mktemp(suffix=".db")
    import asyncio

    from koreaapi import admin
    from koreaapi.pipeline.ingest import ingest_one
    from koreaapi.sources.mock import MockSource
    p = {"name_ko": "방탄소년단", "name_en_official": "BTS", "name_en_source": "official"}
    asyncio.run(ingest_one("facts", "artist:bts",
                           [MockSource("Wikidata", p), MockSource("Wikipedia", p)], db_path=db))
    out = str(tmp_path / "site")
    asyncio.run(admin.entity_pages(db_path=db, out_dir=out))
    man = json.load(open(os.path.join(out, "agents.json"), encoding="utf-8"))
    assert man["skill"]["skill_md"].endswith("/skill/SKILL.md")
    assert "~/.claude/skills/koreaapi" in man["skill"]["install"]


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
