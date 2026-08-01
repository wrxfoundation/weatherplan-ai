"""KOFIC / KOBIS box-office source — the FILM vertical's settlement chart (the Circle Chart analog).

영화진흥위원회(KOFIC)'s 영화관입장권통합전산망(KOBIS) is the OFFICIAL Korean box-office register: every
ticket sold in a Korean cinema is reported into it. That makes its daily/weekly ranking
**settlement-grade** for film outcomes ("was X the #1 film that week?", "how many admissions?") in
exactly the way Circle Chart is for music — the same role, a different vertical.

Design (identical doctrine to the other rails):
- **Dormant**: key-gated on `KOBIS_API_KEY` (a free kobis.or.kr OpenAPI key). No key -> `[]`, never
  an error, never a partial record. Nothing runs on the live build until the secret is added.
- **Not a name cross-verifier.** KOBIS titles are Korean release titles (marketing forms, sequels
  numbered differently) — feeding them into name agreement would LOWER scores, the Spotify lesson.
  Box office enters as a `chart` live-state snapshot, cited honestly, never as a name source.
- **Pure parse, offline-tested.** `parse_boxoffice` takes the raw JSON text; a shape change or a
  garbled response degrades to `[]` (a MISS), never a wrong record.
- `KOBIS_URL` overrides the endpoint (same escape hatch as `KHERITAGE_URL`/`CIRCLECHART_URL`) —
  verify the live field shape when the key is first set.
"""

from __future__ import annotations

import asyncio
import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

# KOBIS OpenAPI — the daily box-office endpoint. Overridable so an activation can point at the
# weekly endpoint (searchWeeklyBoxOfficeList.json) or a corrected path without a code change.
KOBIS_URL = os.environ.get(
    "KOBIS_URL",
    "https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json",
)
_UA = {"User-Agent": "KoreaAPI/0.1 (https://github.com/kwangdol-star/koreaapi) python-urllib"}


def _int(v) -> int | None:
    try:
        return int(str(v).replace(",", "").strip())
    except (TypeError, ValueError):
        return None


def parse_boxoffice(raw: str) -> list[dict]:
    """Pure: a KOBIS box-office JSON response -> [{rank, title, movie_cd, release_date, audience_day,
    audience_total, screens}]. Rows without a rank or a title are dropped (a partial row is not a
    verified row). Any parse/shape failure -> [] (a miss, never a wrong record)."""
    try:
        doc = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return []
    result = (doc or {}).get("boxOfficeResult") or {}
    rows = result.get("dailyBoxOfficeList") or result.get("weeklyBoxOfficeList") or []
    if not isinstance(rows, list):
        return []
    out: list[dict] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        rank, title = _int(row.get("rank")), (row.get("movieNm") or "").strip()
        if rank is None or not title:
            continue  # a row we cannot rank or name is not a usable outcome datum
        out.append({
            "rank": rank,
            "title": title,                                   # Korean release title (as registered)
            "movie_cd": (row.get("movieCd") or "").strip() or None,   # the KOBIS film ID
            "release_date": (row.get("openDt") or "").strip() or None,
            "audience_day": _int(row.get("audiCnt")),          # admissions in the period
            "audience_total": _int(row.get("audiAcc")),        # cumulative admissions
            "screens": _int(row.get("scrnCnt")),
        })
    out.sort(key=lambda e: e["rank"])
    return out


def _http_get_text(url: str) -> str:
    req = urllib.request.Request(url, headers=_UA)
    with urllib.request.urlopen(req, timeout=20) as resp:  # noqa: S310 (fixed host, no user-controlled scheme)
        return resp.read().decode("utf-8", "replace")


class KobisSource:
    """Dormant box-office rail. `fetch_chart()` mirrors CircleChartSource so `admin boxoffice` and
    `ingest_chart` treat music and film outcomes identically."""

    name = "KOBIS"
    is_fallback = False

    def _target_date(self) -> str:
        # KOBIS publishes the previous day's settled figures; today's are not final.
        return (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y%m%d")

    def _url(self, key: str, target: str) -> str:
        sep = "&" if "?" in KOBIS_URL else "?"
        return f"{KOBIS_URL}{sep}{urllib.parse.urlencode({'key': key, 'targetDt': target})}"

    def _http_get(self, url: str) -> str:
        return _http_get_text(url)

    async def fetch_chart(self) -> dict:
        """{entries, citation, source_url, target_date} — empty entries when dormant or blocked."""
        target = self._target_date()
        key = os.environ.get("KOBIS_API_KEY")
        if not key:
            return {"entries": [], "target_date": target, "note": "KOBIS_API_KEY not set (dormant)"}
        try:
            raw = await asyncio.to_thread(self._http_get, self._url(key, target))
        except Exception as e:  # noqa: BLE001 — a blocked/failed fetch is a skip, never a build break
            return {"entries": [], "target_date": target, "note": f"fetch failed: {type(e).__name__}"}
        entries = parse_boxoffice(raw)
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        return {
            "entries": entries,
            "target_date": target,
            "source_url": KOBIS_URL,
            # the KEY never appears in the citation (it is a secret; the citation is published)
            "citation": f"KOFIC/KOBIS 영화관입장권통합전산망 {target} {ts}",
        }
