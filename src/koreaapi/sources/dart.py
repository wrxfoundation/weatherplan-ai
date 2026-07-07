"""DART (금융감독원 전자공시 / OpenDART) source — the OFFICIAL government disclosure authority for
COMPANIES. A DART filing is the state-mandated public record for a Korean listed/registered firm, so a
DART match is the government-tier authority for a `company:` record: it corroborates the corporate
identity + stamps the official 설립일 (est_dt), 대표자, and 종목코드 with a regulator source,
independent of Wikidata/Wikipedia.

Key-gated on DART_API_KEY (a free crtfc_key from opendart.fss.or.kr); INERT until set (ships dormant,
self-activates once the key lands in repo secrets — the KOSIS/KTO pattern). Self-filters to `company:`.
OpenDART's company endpoint is keyed by an 8-digit `corp_code` (there is NO name-search endpoint), so —
exactly like KOSIS's administrative codes — each entity carries a curated code and the response is
identity-guarded by the returned English corporate name: a wrong/mistyped code resolves to a different
firm whose name fails the guard -> a miss, never a wrong company's disclosures. The seed map ships the
codes we can verify; the operator extends it from DART's authoritative corpCode.xml (each new entry is
guard-protected). Parse + guard are pure/offline-tested (JSON fixture); the live call needs the key.
"""

from __future__ import annotations

import asyncio
import os
import urllib.parse
from datetime import datetime, timezone

from ..roster import NAMES
from .wikidata import _http_get_json, _name_match, _norm

DART = "https://opendart.fss.or.kr/api/company.json"
_UA = {"User-Agent": "KoreaAPI/0.1 (https://github.com/kwangdol-star/koreaapi)"}

# company entity -> DART corp_code (8 digits). The NAME guard (below) makes every entry safe: a wrong
# code returns some OTHER firm, whose corp_name_eng won't match -> miss. Seeded with verified codes;
# extend from https://opendart.fss.or.kr/api/corpCode.xml (corp_code <-> corp_name for every filer).
CORP_CODES: dict[str, str] = {
    "company:samsung": "00126380",  # 삼성전자 — verified
}


def parse_dart(raw: dict, entity_id: str) -> dict:
    """Pure: an OpenDART company.json response -> our payload, identity-guarded by the returned English
    corporate name against the roster name. Raises when the filing doesn't match (miss, never wrong)."""
    if str(raw.get("status")) != "000":  # 013 = no data, 020/100/800/900 = key/param errors
        raise ValueError(f"DART status {raw.get('status')} for {entity_id}")
    en = NAMES.get(entity_id) or entity_id.split(":", 1)[-1]
    name_eng = str(raw.get("corp_name_eng") or "")
    name_ko = str(raw.get("corp_name") or "")
    want = _norm(en)
    if not _name_match(want, {_norm(name_eng), _norm(name_ko)}):
        # the corp_code resolved to a different firm than the roster expects -> refuse it
        raise ValueError(f"DART: {name_eng or name_ko!r} does not match {en!r}")
    est = str(raw.get("est_dt") or "")  # 설립일 YYYYMMDD
    founded = f"{est[:4]}-{est[4:6]}-{est[6:8]}" if len(est) == 8 and est.isdigit() else est
    stock = str(raw.get("stock_code") or "").strip()
    ceo = str(raw.get("ceo_nm") or "").strip()
    attrs = {k: v for k, v in (("Founded", founded), ("Stock code", stock),
                               ("CEO", ceo), ("Address", str(raw.get("adres") or "").strip())) if v}
    return {
        "name_ko": name_ko or en,  # the official corporate name (삼성전자(주))
        "name_en_official": name_eng or en,
        "name_romanized": None,
        "name_en_source": "official",
        "name_en_confidence": "high",
        "dart_corp_code": str(raw.get("corp_code") or "") or None,
        "summary_en": f"{en} - Korean company (DART / 전자공시 official disclosure).",
        "summary_ko": f"{name_ko or en} - 기업 (금융감독원 전자공시 DART).",
        **({"attrs": attrs} if attrs else {}),
    }


class DARTSource:
    name = "DART"  # 금융감독원 전자공시 — cited verbatim in Provenance.sources
    is_fallback = False

    def __init__(self, aliases: dict[str, str] | None = None) -> None:
        self._aliases = aliases or {}

    def _url(self, corp_code: str, key: str) -> str:
        return f"{DART}?{urllib.parse.urlencode({'crtfc_key': key, 'corp_code': corp_code})}"

    def _http_get(self, url: str) -> dict:
        return _http_get_json(url, _UA)

    async def fetch(self, entity_id: str, kind: str) -> dict:
        if not entity_id.startswith("company:"):
            raise ValueError("DART covers companies only")  # graceful drop for other verticals
        key = os.environ.get("DART_API_KEY")
        if not key:
            raise ValueError("DART_API_KEY not set")  # inert until a free opendart crtfc_key is added
        corp_code = CORP_CODES.get(entity_id)
        if not corp_code:
            raise ValueError(f"no DART corp_code for {entity_id}")  # not yet in the seed map
        raw = await asyncio.to_thread(self._http_get, self._url(corp_code, key))
        payload = parse_dart(raw, entity_id)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return {"payload": payload,
                "citation": f"DART 전자공시 {payload.get('dart_corp_code') or '?'} {ts}"}
