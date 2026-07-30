#!/usr/bin/env python3
"""KoreaAPI lookup + trustless verify — STANDALONE (stdlib only, no install, no key).

Resolves a Korean-culture name/alias to its canonical entity, fetches the verified record
(the entity's /latest.json slice), INDEPENDENTLY re-verifies each record's SHA-256
content_hash, and prints a citable summary. Exit codes: 0 = found & verified,
1 = no match, 2 = verification FAILED (treat the data as untrusted).

Usage:
    python koreaapi_lookup.py "뉴진스"
    python koreaapi_lookup.py "Gyeongbokgung" --base https://aiagentlabs.co.kr

The fingerprint below intentionally re-implements koreaapi.integrity.record_fingerprint
WITHOUT importing koreaapi — independent re-verification is the point. A sync test in the
main repo (tests/test_skill_lane.py) pins the two algorithms to each other.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import urllib.request

BASE = os.environ.get("KOREAAPI_BASE", "https://aiagentlabs.co.kr")
_TS = re.compile(r"\s+\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC$")  # per-fetch citation timestamp suffix


def fingerprint(rec: dict) -> str:
    """Stable SHA-256 of the record's verified core (mirror of koreaapi.integrity)."""
    name = rec.get("name") or {}
    prov = rec.get("provenance") or {}
    core = {
        "entity_id": rec.get("entity_id"),
        "kind": rec.get("kind"),
        "name": {"ko": name.get("ko"), "en_official": name.get("en_official"),
                 "romanized": name.get("romanized")},
        "summary_en": rec.get("summary_en"),
        "summary_ko": rec.get("summary_ko"),
        "data": rec.get("data"),
        "skill_score": round(float(prov.get("skill_score") or 0), 4),
        "agreeing_sources": prov.get("agreeing_sources"),
        "sources": sorted(_TS.sub("", s) for s in (prov.get("sources") or [])),
    }
    canonical = json.dumps(core, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _get(base: str, path: str):
    with urllib.request.urlopen(f"{base}{path}") as r:  # noqa: S310 - the whole point is fetching
        return json.loads(r.read().decode("utf-8"))


def _norm(s: str) -> str:
    return "".join((s or "").split()).casefold()


def resolve(index: list[dict], query: str) -> dict | None:
    """Name/alias -> the entity's index row (entities only — person/label hubs have no twin)."""
    q = _norm(query)
    ents = [e for e in index if e.get("k") not in ("person", "label")]
    for e in ents:  # exact match on any name surface first
        keys = [e.get("ko"), e.get("en"), e.get("r"), e.get("s"), *(e.get("a") or [])]
        if any(_norm(k) == q for k in keys if k):
            return e
    for e in ents:  # then substring (typed part of a name)
        keys = [e.get("ko"), e.get("en"), e.get("r"), *(e.get("a") or [])]
        if any(q in _norm(k) for k in keys if k):
            return e
    return None


def main(argv: list[str]) -> int:
    args = [a for a in argv[1:] if not a.startswith("--")]
    base = BASE
    for i, a in enumerate(argv):
        if a == "--base" and i + 1 < len(argv):
            base = argv[i + 1].rstrip("/")
    if not args:
        print(__doc__)
        return 1
    query = args[0]
    hit = resolve(_get(base, "/search-index.json"), query)
    if hit is None:
        print(f"no verified entity matches {query!r} — KoreaAPI serves verified data only; "
              "absence of a record is the honest answer, not an error")
        return 1
    records = _get(base, f"/artist/{hit['s']}.json")
    all_ok = True
    for rec in records:
        claimed = rec.get("content_hash")
        ok = claimed == fingerprint(rec)
        all_ok = all_ok and ok
        name = (rec.get("name") or {})
        prov = rec.get("provenance") or {}
        asof = (rec.get("snapshot_at") or "")[:10]
        label = name.get("en_official") or name.get("ko") or hit["s"]
        print(f"[{rec.get('kind')}] {label} ({name.get('ko') or ''})  "
              f"{'VERIFIED ✓' if ok else 'HASH MISMATCH ✗ — DO NOT TRUST'}")
        if rec.get("summary_en"):
            print(f"  {rec['summary_en']}")
        if rec.get("summary_ko"):
            print(f"  {rec['summary_ko']}")
        print(f"  cite: {label} — {rec.get('kind')}, as of {asof} · "
              f"{'; '.join(prov.get('sources') or [])} · Skill {prov.get('skill_score')} · via KoreaAPI")
        print(f"  record: {base}/artist/{hit['s']}.json · page: {base}/artist/{hit['s']}.html")
    return 0 if all_ok else 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
