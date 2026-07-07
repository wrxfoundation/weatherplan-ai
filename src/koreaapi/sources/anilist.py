"""AniList source — an independent manga/manhwa database (GraphQL), a 3rd cross-check for `webtoon:`
(Wikidata + Wikipedia + AniList). Uniquely for Tier C it carries the NATIVE (Korean) title, so — when
countryOfOrigin is KR — it BOOSTS the bilingual agreement count (ko + en), not just the source count.

Keyless GraphQL (graphql.anilist.co) — ALWAYS-ON like MusicBrainz/OSM, self-scoped to `webtoon:`.
Identity-guarded: a hit counts only if one of its titles (english/romaji/native) matches the expected
name AND, when present, countryOfOrigin is KR (rejects a same-title Japanese manga). Parse + guard are
pure/offline-tested (fixture); the live call POSTs to the GraphQL endpoint (network egress).
"""

from __future__ import annotations

import asyncio
import json
import urllib.request
from datetime import datetime, timezone

from ..roster import NAMES
from .wikidata import _name_match, _norm

ANILIST = "https://graphql.anilist.co"
_UA = {"User-Agent": "KoreaAPI/0.1 (https://github.com/kwangdol-star/koreaapi)",
       "Content-Type": "application/json", "Accept": "application/json"}
_QUERY = """
query ($q: String) {
  Media(search: $q, type: MANGA) {
    id
    title { romaji english native }
    countryOfOrigin
    startDate { year }
    format
  }
}
""".strip()


def parse_anilist(raw: dict, expected_en: str) -> dict:
    """Pure: an AniList Media response -> our payload, identity-guarded by title match + KR origin.
    Raises when nothing safely matches (miss, never wrong)."""
    m = (raw.get("data") or {}).get("Media")
    if not isinstance(m, dict):
        raise ValueError(f"AniList: no manga for {expected_en!r}")
    title = m.get("title") or {}
    en = (title.get("english") or "").strip()
    romaji = (title.get("romaji") or "").strip()
    native = (title.get("native") or "").strip()
    want = _norm(expected_en)
    if not _name_match(want, {_norm(en), _norm(romaji), _norm(native)}):
        raise ValueError(f"AniList: {en or romaji!r} does not match {expected_en!r}")
    origin = (m.get("countryOfOrigin") or "").strip()
    if origin and origin != "KR":
        raise ValueError(f"AniList: {expected_en!r} resolved to a {origin} title, not KR")
    year = (m.get("startDate") or {}).get("year")
    fmt = m.get("format")
    attrs = {k: v for k, v in (("First published", str(year) if year else None),
                               ("Format", fmt)) if v}
    return {
        "name_ko": native or (en or romaji),  # native is Korean for KR manhwa -> real bilingual boost
        "name_en_official": en or romaji,
        "name_romanized": romaji or None,
        "name_en_source": "official",
        "name_en_confidence": "high",
        "anilist_id": m.get("id"),
        "summary_en": f"{en or romaji} - Korean webtoon/manhwa (AniList).",
        "summary_ko": f"{native or en or romaji} - 웹툰/만화 (AniList).",
        **({"attrs": attrs} if attrs else {}),
    }


class AniListSource:
    name = "AniList"
    is_fallback = False

    def __init__(self, aliases: dict[str, str] | None = None) -> None:
        self._aliases = aliases or {}

    def _term(self, entity_id: str) -> str:
        return NAMES.get(entity_id) or self._aliases.get(entity_id) or entity_id.split(":", 1)[-1]

    def _post(self, term: str) -> dict:
        body = json.dumps({"query": _QUERY, "variables": {"q": term}}).encode()
        req = urllib.request.Request(ANILIST, data=body, headers=_UA, method="POST")
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)

    async def fetch(self, entity_id: str, kind: str) -> dict:
        if not entity_id.startswith("webtoon:"):
            raise ValueError("AniList covers webtoons only")  # graceful drop for other verticals
        term = self._term(entity_id)
        raw = await asyncio.to_thread(self._post, term)
        payload = parse_anilist(raw, term)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return {"payload": payload, "citation": f"AniList {payload.get('anilist_id') or '?'} {ts}"}
