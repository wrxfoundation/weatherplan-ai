"""Wiktionary (ko.wiktionary.org) source — the verification anchor for `proverb:` (속담·관용구).

Individual proverbs deliberately stay OUT of the cross-verified verticals: there is no independent
"ground truth" to adjudicate a saying, so the bar does not bend (SCOPE / PHASE2 boundary note). What
IS verifiable is *lexical existence*: whether a proverb is a LISTED dictionary entry. This adapter
ingests ONLY entries that exist in Korean Wiktionary — the proverb + its dictionary gloss, cited to
Wiktionary — never an unsourced saying. A term with no entry resolves to a miss (등재 항목만).

Keyless (a compliant User-Agent only) — ALWAYS-ON like Wikipedia, self-scoped to `proverb:`.
Identity-guarded: the returned page TITLE must match the expected headword and must not be `missing`.
Parse + guard are pure/offline-tested (fixture); the live call needs network egress.
"""

from __future__ import annotations

import asyncio
import re
import urllib.parse
from datetime import datetime, timezone

from ..roster import NAMES
from .wikidata import _http_get_json, _norm

WIKTIONARY = "https://ko.wiktionary.org/w/api.php"
_UA = {"User-Agent": "KoreaAPI/0.1 (https://github.com/kwangdol-star/koreaapi) python-urllib"}
_WS = re.compile(r"\s+")


def _first_gloss(extract: str) -> str:
    """The first meaningful line of the plaintext extract (the dictionary gloss), whitespace-collapsed."""
    for line in (extract or "").splitlines():
        line = _WS.sub(" ", line).strip()
        if line and not line.startswith("="):  # skip section headers
            return line
    return _WS.sub(" ", extract or "").strip()


def parse_wiktionary(raw: dict, expected: str) -> dict:
    """Pure: a ko.wiktionary query?prop=extracts response -> our payload, guarded by the page title
    (must equal the expected headword and not be `missing`). Raises otherwise (miss = not listed)."""
    pages = ((raw.get("query") or {}).get("pages") or {})
    want = _norm(expected)
    for page in pages.values():
        if not isinstance(page, dict) or "missing" in page:
            continue  # not a listed entry -> refuse (등재 항목만)
        title = (page.get("title") or "").strip()
        if not title or _norm(title) != want:
            continue  # a redirect/other page -> refuse
        gloss = _first_gloss(page.get("extract") or "")
        if not gloss:
            continue  # listed but no readable gloss -> nothing verifiable to ship
        return {
            "name_ko": title,  # the proverb headword (Korean)
            "name_en_official": None,  # a proverb has no official English name; romanized at ingest
            "name_romanized": None,
            "name_en_source": "official",
            "name_en_confidence": "high",
            "wiktionary_title": title,
            "attrs": {"Meaning (뜻)": gloss},
            "summary_en": f"{title} - a listed Korean proverb/idiom (Wiktionary): {gloss}",
            "summary_ko": f"{title} - 등재된 속담/관용구 (위키낱말사전): {gloss}",
        }
    raise ValueError(f"Wiktionary: no listed entry for {expected!r}")


class WiktionarySource:
    name = "Wiktionary"
    is_fallback = False

    def __init__(self, aliases: dict[str, str] | None = None) -> None:
        self._aliases = aliases or {}

    def _term(self, entity_id: str) -> str:
        return NAMES.get(entity_id) or self._aliases.get(entity_id) or entity_id.split(":", 1)[-1]

    def _url(self, term: str) -> str:
        params = urllib.parse.urlencode({
            "action": "query", "format": "json", "prop": "extracts",
            "explaintext": "1", "redirects": "1", "titles": term,
        })
        return f"{WIKTIONARY}?{params}"

    def _http_get(self, url: str) -> dict:
        return _http_get_json(url, _UA)

    async def fetch(self, entity_id: str, kind: str) -> dict:
        if not entity_id.startswith("proverb:"):
            raise ValueError("Wiktionary covers proverbs only")  # graceful drop for other verticals
        term = self._term(entity_id)
        raw = await asyncio.to_thread(self._http_get, self._url(term))
        payload = parse_wiktionary(raw, term)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return {"payload": payload,
                "citation": f"Wiktionary (위키낱말사전) {payload.get('wiktionary_title') or '?'} {ts}"}
