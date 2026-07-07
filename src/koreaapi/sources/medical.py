"""건강보험심사평가원 (HIRA / 심평원) 병원정보서비스 source — the OFFICIAL government registry for
MEDICAL institutions. Every Korean hospital is HIRA-registered (요양기관), so a HIRA listing is the
government-tier authority for a `medical:` record: it corroborates the institution + stamps its official
종별 (상급종합병원 등), 개설일자, and 소재지 with a state source, independent of Wikidata/Wikipedia.

Key-gated on MEDICAL_API_KEY (a free data.go.kr serviceKey); INERT until set (ships dormant, self-
activates once the key lands in repo secrets — the KOSIS/KTO pattern). Self-filters to `medical:`.
HIRA searches + returns the KOREAN institution name (XML), so — like KOSIS — each entity carries a
curated Korean search name and an EXACT-name guard (not substring: 세브란스병원 must not soak up
강남세브란스병원). A drifted/ambiguous match resolves to a miss, never a wrong hospital's data.
Parse + guard are pure/offline-tested (XML fixture); the live call only runs where the key is set.
"""

from __future__ import annotations

import asyncio
import os
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from ..roster import NAMES
from .heritage import _text
from .wikidata import _http_get_text, _norm

# HIRA 병원정보서비스 getHospBasisList — searches by 요양기관명 (yadmNm), returns XML.
HIRA = "https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList"
_UA = {"User-Agent": "KoreaAPI/0.1 (https://github.com/kwangdol-star/koreaapi)"}

# medical entity -> (Korean search name, accepted EXACT names). EXACT (not substring) is the guard:
# a returned 요양기관 counts only if its name EQUALS one of the accepted forms, so a sibling hospital
# whose name merely contains the term (강남세브란스병원 ⊃ 세브란스병원) can never be mis-attached.
HOSPITALS: dict[str, tuple[str, tuple[str, ...]]] = {
    "medical:snuh": ("서울대학교병원", ("서울대학교병원",)),
    "medical:asanmedical": ("서울아산병원", ("서울아산병원",)),
    "medical:samsungmedical": ("삼성서울병원", ("삼성서울병원",)),
    "medical:severance": ("세브란스병원", ("세브란스병원", "연세대학교의과대학세브란스병원")),
    "medical:seoulstmarys": ("서울성모병원", ("서울성모병원", "가톨릭대학교서울성모병원")),
    "medical:koreauniv": ("고려대학교안암병원", ("고려대학교의과대학부속안암병원", "고려대학교안암병원")),
    "medical:ajou": ("아주대학교병원", ("아주대학교병원",)),
    "medical:gangnamseverance": ("강남세브란스병원", ("강남세브란스병원",)),
}


def parse_medical(xml_text: str, entity_id: str, accept: tuple[str, ...]) -> dict:
    """Pure: a HIRA getHospBasisList XML response -> our payload, guarded by an EXACT institution-name
    match. Raises when nothing safely matches (miss, never a wrong hospital's official data)."""
    root = ET.fromstring(xml_text)  # raises on malformed XML -> graceful drop upstream
    accepted = {_norm(a) for a in accept}
    for item in root.iter("item"):
        ko = _text(item, "yadmNm")  # 요양기관명
        if not ko or _norm(ko) not in accepted:
            continue  # a same-prefix sibling / other hospital -> refuse it
        kind_ko = _text(item, "clCdNm")  # 종별 (상급종합 / 종합병원 …)
        addr = _text(item, "addr")
        estb = _text(item, "estbDd")  # 개설일자 YYYYMMDD
        founded = f"{estb[:4]}-{estb[4:6]}-{estb[6:8]}" if len(estb) == 8 and estb.isdigit() else estb
        en = NAMES.get(entity_id) or entity_id.split(":", 1)[-1]
        attrs = {k: v for k, v in (("Institution type", kind_ko), ("Founded", founded),
                                   ("Address", addr)) if v}
        out = {
            "name_ko": ko,  # official 요양기관명 (folds; adds a gov source + official-registry badge)
            "name_en_official": en,
            "name_romanized": None,
            "name_en_source": "official",
            "name_en_confidence": "high",
            "hira_id": _text(item, "ykiho") or None,  # 암호화 요양기호
            "summary_en": f"{en} - {kind_ko or 'hospital'} (심평원 / HIRA registry).",
            "summary_ko": f"{ko} - {kind_ko or '병원'} (건강보험심사평가원 등록).",
        }
        if attrs:
            out["attrs"] = attrs
        return out
    raise ValueError(f"HIRA: no exactly-matching registered institution for {entity_id}")


class MedicalSource:
    name = "심평원"  # HIRA — cited verbatim in Provenance.sources
    is_fallback = False

    def __init__(self, aliases: dict[str, str] | None = None) -> None:
        self._aliases = aliases or {}

    def _url(self, term: str, key: str) -> str:
        params = urllib.parse.urlencode({"pageNo": 1, "numOfRows": 10, "yadmNm": term})
        # serviceKey appended RAW — data.go.kr keys are already URL-encoded (urlencode would double it).
        return f"{HIRA}?serviceKey={key}&{params}"

    def _http_get(self, url: str) -> str:
        return _http_get_text(url, _UA)

    async def fetch(self, entity_id: str, kind: str) -> dict:
        if not entity_id.startswith("medical:"):
            raise ValueError("HIRA covers medical only")  # graceful drop for other verticals
        key = os.environ.get("MEDICAL_API_KEY")
        if not key:
            raise ValueError("MEDICAL_API_KEY not set")  # inert until a free data.go.kr key is added
        term, accept = HOSPITALS.get(entity_id, (None, ()))
        if not term:
            raise ValueError(f"no HIRA search name for {entity_id}")
        raw = await asyncio.to_thread(self._http_get, self._url(term, key))
        payload = parse_medical(raw, entity_id, accept)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return {"payload": payload,
                "citation": f"심평원 (HIRA) {payload.get('hira_id') or '?'} {ts}"}
