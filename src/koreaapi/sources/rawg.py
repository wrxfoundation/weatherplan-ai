"""RAWG source — an independent games database, a 3rd cross-check for `game:` (Wikidata + Wikipedia
+ RAWG). Corroborates the English title and stamps a release date; RAWG titles are English, so it adds
a source + release fact rather than boosting the bilingual agreement count (like TMDB does for actors).

Key-gated on RAWG_API_KEY (a free key from rawg.io/apidocs); INERT until set (ships dormant, self-
activates once the key lands in repo secrets — the TMDB pattern). Self-filters to `game:`. Identity-
guarded by the title: a search result only counts if its name matches the expected title, else miss.
Parse + guard are pure/offline-tested; the live call only runs where the key is set.
"""

from __future__ import annotations

import asyncio
import os
import urllib.parse
from datetime import datetime, timezone

from ..roster import NAMES
from .wikidata import _http_get_json, _name_match, _norm

RAWG = "https://api.rawg.io/api/games"
_UA = {"User-Agent": "KoreaAPI/0.1 (https://github.com/kwangdol-star/koreaapi)"}


def parse_rawg(raw: dict, expected_en: str) -> dict:
    """Pure: a RAWG /games search response -> our payload, identity-guarded against the expected
    English title. Raises if no result matches (miss, never wrong)."""
    want = _norm(expected_en)
    for it in (raw.get("results") or []):
        if not isinstance(it, dict):
            continue
        name = it.get("name")
        if name and _name_match(want, {_norm(name)}):
            released = it.get("released")  # YYYY-MM-DD
            attrs = {k: v for k, v in (("Released", released),) if v}
            return {
                "name_ko": name,  # RAWG is English-only; folds (no Korean to verify)
                "name_en_official": name,
                "name_romanized": None,
                "name_en_source": "official",
                "name_en_confidence": "high",
                "rawg_id": it.get("id"),
                "summary_en": f"{name} - video game (RAWG).",
                "summary_ko": f"{name} - 비디오 게임 (RAWG).",
                **({"attrs": attrs} if attrs else {}),
            }
    raise ValueError(f"RAWG: no game matches {expected_en!r}")


class RAWGSource:
    name = "RAWG"
    is_fallback = False

    def __init__(self, aliases: dict[str, str] | None = None) -> None:
        self._aliases = aliases or {}

    def _term(self, entity_id: str) -> str:
        return NAMES.get(entity_id) or self._aliases.get(entity_id) or entity_id.split(":", 1)[-1]

    def _url(self, term: str, key: str) -> str:
        return f"{RAWG}?{urllib.parse.urlencode({'key': key, 'search': term, 'page_size': 5})}"

    def _http_get(self, url: str) -> dict:
        return _http_get_json(url, _UA)

    async def fetch(self, entity_id: str, kind: str) -> dict:
        if not entity_id.startswith("game:"):
            raise ValueError("RAWG covers games only")  # graceful drop for other verticals
        key = os.environ.get("RAWG_API_KEY")
        if not key:
            raise ValueError("RAWG_API_KEY not set")  # inert until a free rawg.io key is added
        term = self._term(entity_id)
        raw = await asyncio.to_thread(self._http_get, self._url(term, key))
        payload = parse_rawg(raw, term)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return {"payload": payload, "citation": f"RAWG {payload.get('rawg_id') or '?'} {ts}"}
