"""TheSportsDB source — an independent sports database, a 3rd cross-check for `sports:` athletes
(Wikidata + Wikipedia + TheSportsDB). Corroborates the English name and stamps the sport + current
team; TheSportsDB names are English, so it adds a source + sport facts (not a bilingual boost).

Keyless: uses TheSportsDB's free public test key ("3"), overridable via SPORTSDB_API_KEY — so it is
ALWAYS-ON like MusicBrainz/OSM (not dormant), self-scoped to `sports:`. Identity-guarded by the
athlete's name; when the record carries a nationality it must not contradict Korea, so a same-name
foreign athlete is refused (miss, never wrong). Parse + guard are pure/offline-tested (fixture); the
live call needs network egress (runs on GitHub runners).
"""

from __future__ import annotations

import asyncio
import os
import urllib.parse
from datetime import datetime, timezone

from ..roster import NAMES
from .wikidata import _http_get_json, _name_match, _norm

SPORTSDB = "https://www.thesportsdb.com/api/v1/json"
_UA = {"User-Agent": "KoreaAPI/0.1 (https://github.com/kwangdol-star/koreaapi)"}
_KOREA = {"south korea", "korea", "korea republic", "republic of korea", "korea, south"}


def parse_sportsdb(raw: dict, expected_en: str) -> dict:
    """Pure: a TheSportsDB searchplayers response -> our payload, identity-guarded against the
    expected English name (and non-contradicting nationality). Raises on no safe match (miss)."""
    want = _norm(expected_en)
    for it in (raw.get("player") or []):
        if not isinstance(it, dict):
            continue
        name = it.get("strPlayer")
        if not name or not _name_match(want, {_norm(name)}):
            continue
        nat = (it.get("strNationality") or "").strip().lower()
        if nat and nat not in _KOREA:
            continue  # a same-name non-Korean athlete -> refuse it
        sport = it.get("strSport")
        team = it.get("strTeam")
        attrs = {k: v for k, v in (("Sport", sport), ("Team", team),
                                   ("Nationality", it.get("strNationality"))) if v}
        return {
            "name_ko": name,  # English-only source; folds (no Korean to verify)
            "name_en_official": name,
            "name_romanized": None,
            "name_en_source": "official",
            "name_en_confidence": "high",
            "sportsdb_id": it.get("idPlayer"),
            "summary_en": f"{name} - {sport or 'athlete'} (TheSportsDB).",
            "summary_ko": f"{name} - {sport or '운동선수'} (TheSportsDB).",
            **({"attrs": attrs} if attrs else {}),
        }
    raise ValueError(f"TheSportsDB: no matching Korean athlete for {expected_en!r}")


class SportsDBSource:
    name = "TheSportsDB"
    is_fallback = False

    def __init__(self, aliases: dict[str, str] | None = None) -> None:
        self._aliases = aliases or {}

    def _term(self, entity_id: str) -> str:
        return NAMES.get(entity_id) or self._aliases.get(entity_id) or entity_id.split(":", 1)[-1]

    def _url(self, term: str) -> str:
        key = os.environ.get("SPORTSDB_API_KEY") or "3"  # free public test key
        return f"{SPORTSDB}/{key}/searchplayers.php?{urllib.parse.urlencode({'p': term})}"

    def _http_get(self, url: str) -> dict:
        return _http_get_json(url, _UA)

    async def fetch(self, entity_id: str, kind: str) -> dict:
        if not entity_id.startswith("sports:"):
            raise ValueError("TheSportsDB covers sports only")  # graceful drop for other verticals
        term = self._term(entity_id)
        raw = await asyncio.to_thread(self._http_get, self._url(term))
        payload = parse_sportsdb(raw, term)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return {"payload": payload, "citation": f"TheSportsDB {payload.get('sportsdb_id') or '?'} {ts}"}
