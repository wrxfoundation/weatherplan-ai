"""The canonicalization contract — what makes `content_hash` re-verifiable by a stranger.

"Canonicalize, hash, compare" is not a verifiable instruction. Two traps are live in our own
published data: a default JSON encoder emits \\uXXXX escapes and ", " separators (different bytes,
different hash, and the re-verifier concludes we tampered), and every record in /latest.json carries
its own content_hash — a field that was never part of the hashed input. So the rules ship as an
executable spec plus a known-good test vector, and this file pins all of it: the vector's hash is a
frozen constant, so any change to the algorithm breaks CI loudly instead of silently invalidating
every hash we have ever published.
"""

from __future__ import annotations

import hashlib
import json

from koreaapi import integrity

# FROZEN. Changing the canonicalization invalidates every content_hash ever published — including
# the ones inside the Bitcoin-anchored chain. If this constant must change, that is a breaking
# data-format change and needs its own migration note, not a test edit.
VECTOR_HASH = "f8beee68b1b0268d86becd27c0e2efa6cb70d161b0191aabe641467aa12b4c86"
VECTOR_CANONICAL = (
    '{"agreeing_sources":2,"data":{"aliases":["A","B"],"geo":{"lat":37.5,"lon":127.0}},'
    '"entity_id":"test:vector","kind":"facts",'
    '"name":{"en_official":"Test","ko":"테스트","romanized":"Teseuteu"},'
    '"skill_score":1.0,"sources":["Wikidata Q1","Wikipedia Test"],'
    '"summary_en":"A canonicalization test vector.","summary_ko":"정규화 테스트 벡터."}'
)


def test_published_vector_is_frozen():
    v = integrity.test_vector()
    assert v["canonical_json"] == VECTOR_CANONICAL
    assert v["content_hash"] == VECTOR_HASH
    assert v["record"] is integrity.TEST_VECTOR_RECORD


def test_a_stranger_following_only_the_published_rules_reproduces_the_hash():
    # Re-implement from the published prose alone — no koreaapi internals beyond the input record.
    # (This caught a real sloppy read on its first run: "strip the trailing ' YYYY-MM-DD HH:MM UTC'"
    # written as a naive split-on-spaces ate part of the citation. The rule is a suffix match.)
    import re
    strip_ts = re.compile(r"\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$")
    rec = integrity.TEST_VECTOR_RECORD
    name, prov = rec["name"], rec["provenance"]
    core = {
        "entity_id": rec["entity_id"],
        "kind": rec["kind"],
        "name": {"ko": name["ko"], "en_official": name["en_official"], "romanized": name["romanized"]},
        "summary_en": rec["summary_en"],
        "summary_ko": rec["summary_ko"],
        "data": rec["data"],
        "skill_score": round(float(prov["skill_score"]), 4),
        "agreeing_sources": prov["agreeing_sources"],
        "sources": sorted(strip_ts.sub("", s) for s in prov["sources"]),
    }
    text = json.dumps(core, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    assert text == VECTOR_CANONICAL
    assert hashlib.sha256(text.encode("utf-8")).hexdigest() == VECTOR_HASH


def test_the_two_documented_traps_really_do_break_the_hash():
    # If these ever stopped differing, the warnings on /verify.html would be noise. They differ.
    core = integrity._core(integrity.TEST_VECTOR_RECORD)
    naive = hashlib.sha256(json.dumps(core, sort_keys=True).encode("utf-8")).hexdigest()
    assert naive != VECTOR_HASH                       # default encoder: escapes + ", " separators
    whole = hashlib.sha256(integrity.canonical_bytes(integrity.TEST_VECTOR_RECORD)).hexdigest()
    assert whole != VECTOR_HASH                       # forgot to reduce to the core / drop content_hash


def test_content_hash_is_never_an_input_to_itself():
    without = dict(integrity.TEST_VECTOR_RECORD)
    without.pop("content_hash")
    assert integrity.record_fingerprint(without) == VECTOR_HASH
    poisoned = {**integrity.TEST_VECTOR_RECORD, "content_hash": "something else entirely"}
    assert integrity.record_fingerprint(poisoned) == VECTOR_HASH


def test_fetch_timestamps_do_not_change_the_hash():
    # Re-collecting the same fact tomorrow must not churn the hash — that is why the trailing
    # ' YYYY-MM-DD HH:MM UTC' is stripped before hashing.
    later = json.loads(json.dumps(integrity.TEST_VECTOR_RECORD))
    later["provenance"]["sources"] = ["Wikidata Q1 2027-11-30 22:15 UTC",
                                      "Wikipedia Test 2027-11-30 22:15 UTC"]
    assert integrity.record_fingerprint(later) == VECTOR_HASH


def test_dataset_hash_is_order_independent():
    a = {**integrity.TEST_VECTOR_RECORD}
    b = {**integrity.TEST_VECTOR_RECORD, "entity_id": "test:vector-2"}
    assert integrity.dataset_hash([a, b]) == integrity.dataset_hash([b, a])


def test_the_site_publishes_the_spec_and_the_vector(tmp_path):
    import asyncio
    import os
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
    for page in ("verify.html", os.path.join("ko", "verify.html")):
        t = open(os.path.join(out, page), encoding="utf-8").read()
        assert VECTOR_HASH in t, f"{page} does not publish the test vector's hash"
        assert "content_hash" in t and "uXXXX" in t          # both traps named on the proof page
    data = str(tmp_path / "data")
    asyncio.run(admin.export(db_path=db, out_dir=data))
    man = json.load(open(os.path.join(data, "integrity.json"), encoding="utf-8"))
    assert man["canonicalization"] == integrity.CANONICALIZATION   # published text == the code's spec
    assert man["test_vector"]["content_hash"] == VECTOR_HASH


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
