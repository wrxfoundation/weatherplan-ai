"""국가유산청 (Korea Heritage Service, 구 문화재청) source — the OFFICIAL government authority for
HERITAGE. A national designation (국보 · 보물 · 국가무형유산 · 사적 …) is the strongest, least-
contestable badge in the whole roster: the state itself has vouched for the item, independent of
Wikidata/Wikipedia. So this stamps a heritage record with a government source + an "official national
designation" badge — the authority-first priority the case-study appendix calls for (docs/PHASE2.md).

KEYLESS (개방형 Open API, no serviceKey) — ALWAYS-ON like Wikipedia/MusicBrainz, self-scoped to
`heritage:`. Server-side only (the endpoint is CORS-blocked for browsers; our ingest runs on GitHub
runners). The KHS list endpoint searches by the KOREAN designation name and returns XML (CDATA-wrapped,
whitespace-padded), so — like KOSIS regions — each entity carries a curated Korean search term + an
accepted-name guard: a designation counts only if it NAMES itself as the expected item. A drifted/
ambiguous search resolves to a miss, never a wrong badge. Parse + guard are pure/offline-tested (real-
shape XML fixture); the live call needs network egress.
"""

from __future__ import annotations

import asyncio
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from ..roster import NAMES
from .wikidata import _http_get_text, _norm

# KHS 국가유산검색 목록 (국문). Open/keyless; returns XML <result><item>…</item></result>.
KHS_LIST = "http://www.khs.go.kr/cha/SearchKindOpenapiList.do"  # legacy gov host: http (guard defends integrity)
_UA = {"User-Agent": "KoreaAPI/0.1 (https://github.com/kwangdol-star/koreaapi)"}

# heritage entity -> (Korean search term, accepted-name tokens). The tokens are the guard: whatever
# the search returns must NAME itself with one of them (normalized substring), else it is refused.
# Terms are best-effort common/designation names — an imperfect term simply MISSES (never wrong),
# so the government badge attaches only where the state's own name unambiguously matches.
HERITAGE_KO: dict[str, tuple[str, tuple[str, ...]]] = {
    "heritage:hunminjeongeum": ("훈민정음", ("훈민정음",)),
    "heritage:tripitakakoreana": ("대장경판", ("대장경판", "팔만대장경")),
    "heritage:pansori": ("판소리", ("판소리",)),
    "heritage:samulnori": ("사물놀이", ("사물놀이",)),
    "heritage:gayageum": ("가야금산조", ("가야금",)),
    "heritage:taekwondo": ("태권도", ("태권도",)),
    "heritage:hanbok": ("한복", ("한복",)),
    "heritage:talchum": ("탈춤", ("탈춤",)),
    "heritage:minhwa": ("민화", ("민화",)),
    "heritage:koreanceladon": ("청자", ("청자",)),
    "heritage:jongmyojerye": ("종묘제례", ("종묘제례",)),
    "heritage:kimjang": ("김치", ("김치", "김장")),
    "heritage:hanok": ("한옥", ("한옥",)),
    "heritage:ondol": ("온돌", ("온돌",)),
    "heritage:najeonchilgi": ("나전장", ("나전",)),
    "heritage:dancheong": ("단청장", ("단청",)),
    "heritage:buncheong": ("분청사기", ("분청",)),
    # seed expansion — UNESCO / 국가무형유산 (distinctive names; guard = the Korean designation).
    "heritage:arirang": ("아리랑", ("아리랑",)),
    "heritage:ssireum": ("씨름", ("씨름",)),
    "heritage:nongak": ("농악", ("농악",)),
    "heritage:ganggangsullae": ("강강술래", ("강강술래",)),
    "heritage:jultagi": ("줄타기", ("줄타기",)),
    "heritage:haenyeo": ("해녀", ("해녀",)),
    "heritage:taekkyeon": ("택견", ("택견",)),
    "heritage:yeondeunghoe": ("연등회", ("연등회",)),
}


def _text(item: ET.Element, tag: str) -> str:
    """An item's child text, CDATA- and whitespace-safe (KHS wraps values as `<![CDATA[ 국보 ]]>`)."""
    el = item.find(tag)
    return (el.text or "").strip() if el is not None and el.text else ""


def parse_heritage(xml_text: str, entity_id: str, accept: tuple[str, ...]) -> dict:
    """Pure: a KHS SearchKindOpenapiList XML response -> our payload, guarded by the designation's
    Korean name. Raises when nothing safely matches (miss, never a wrong government badge)."""
    root = ET.fromstring(xml_text)  # raises on malformed XML -> graceful drop upstream
    for item in root.iter("item"):
        if _text(item, "ccbaCncl") == "Y":
            continue  # designation cancelled (지정해제) -> skip
        ko = _text(item, "ccbaMnm1")  # 국문 지정명칭
        nn = _norm(ko)
        if not ko or not any(_norm(tok) in nn for tok in accept):
            continue  # an ambiguous/other designation -> refuse it
        designation = _text(item, "ccmaName")  # 국보 / 보물 / 국가무형유산 / 사적 …
        location = " ".join(p for p in (_text(item, "ccbaCtcdNm"), _text(item, "ccsiName")) if p)
        # composite designation key (종목·시도·관리번호) = the SearchKindOpenapiDt.do detail pointer
        kdcd, ctcd, asno = _text(item, "ccbaKdcd"), _text(item, "ccbaCtcd"), _text(item, "ccbaAsno")
        hid = "-".join(p for p in (kdcd, ctcd, asno) if p)
        en = NAMES.get(entity_id) or entity_id.split(":", 1)[-1]
        attrs = {k: v for k, v in (("Designation", designation),
                                   ("Designated location", location)) if v}
        lat, lon = _text(item, "latitude"), _text(item, "longitude")
        if lat and lon:
            attrs["Coordinates"] = f"{lat},{lon}"  # KHS WGS84 (lat,lon)
        out = {
            "name_ko": ko,  # the official designation name (folds; adds a gov source + badge)
            "name_en_official": en,
            "name_romanized": None,
            "name_en_source": "official",
            "name_en_confidence": "high",
            "heritage_id": hid or None,
            "official_designation": designation or None,
            "summary_en": f"{en} - {designation or 'designated'} heritage (국가유산청 / KHS).",
            "summary_ko": f"{ko} - {designation or '지정'} (국가유산청).",
        }
        if attrs:
            out["attrs"] = attrs
        return out
    raise ValueError(f"KHS: no matching national designation for {entity_id}")


class HeritageSource:
    name = "국가유산청"  # KHS — cited verbatim in Provenance.sources
    is_fallback = False

    def __init__(self, aliases: dict[str, str] | None = None) -> None:
        self._aliases = aliases or {}

    def _url(self, term: str) -> str:
        params = urllib.parse.urlencode({
            "ccbaCncl": "N",  # exclude cancelled designations
            "pageUnit": 10, "pageIndex": 1, "ccbaMnm1": term,
        })
        return f"{KHS_LIST}?{params}"

    def _http_get(self, url: str) -> str:
        return _http_get_text(url, _UA)

    async def fetch(self, entity_id: str, kind: str) -> dict:
        if not entity_id.startswith("heritage:"):
            raise ValueError("KHS covers heritage only")  # graceful drop for other verticals
        term, accept = HERITAGE_KO.get(entity_id, (None, ()))
        if not term:
            raise ValueError(f"no KHS search term for {entity_id}")  # heritage entity not yet mapped
        raw = await asyncio.to_thread(self._http_get, self._url(term))
        payload = parse_heritage(raw, entity_id, accept)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return {"payload": payload,
                "citation": f"국가유산청 (KHS) {payload.get('heritage_id') or '?'} {ts}"}
