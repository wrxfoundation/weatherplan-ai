"""KOFIC/KOBIS box office — the FILM vertical's settlement chart (the Circle Chart analog), shipped
DORMANT (key-gated on KOBIS_API_KEY). Pure parse + the dormant/blocked paths, offline. Doctrine:
box office is OUTCOME data, never a name cross-verifier (Korean release titles would lower name
agreement — the Spotify lesson), and any shape change degrades to a MISS, never a wrong record."""

from __future__ import annotations

import asyncio
import json
import tempfile

from koreaapi.pipeline import store
from koreaapi.pipeline.ingest import ingest_chart
from koreaapi.sources.kobis import KobisSource, parse_boxoffice

_RAW = json.dumps({"boxOfficeResult": {
    "boxofficeType": "일별 박스오피스", "showRange": "20260729~20260729",
    "dailyBoxOfficeList": [
        {"rnum": "1", "rank": "2", "movieCd": "20260002", "movieNm": "야당",
         "openDt": "2026-07-02", "audiCnt": "88,120", "audiAcc": "1,204,555", "scrnCnt": "1,102"},
        {"rnum": "2", "rank": "1", "movieCd": "20260001", "movieNm": "파묘 리덕스",
         "openDt": "2026-07-24", "audiCnt": "213,004", "audiAcc": "2,900,120", "scrnCnt": "1,540"},
        {"rnum": "3", "rank": "", "movieNm": "이름만 있고 순위 없음"},           # unrankable -> dropped
        {"rnum": "4", "rank": "3", "movieNm": ""},                              # unnamed -> dropped
        "not-a-dict",                                                            # junk -> ignored
    ]}}, ensure_ascii=False)


def test_parse_ranks_and_normalizes():
    rows = parse_boxoffice(_RAW)
    assert [r["rank"] for r in rows] == [1, 2]            # sorted by rank, partial rows dropped
    top = rows[0]
    assert top["title"] == "파묘 리덕스" and top["movie_cd"] == "20260001"
    assert top["audience_day"] == 213004 and top["audience_total"] == 2900120  # commas stripped -> int
    assert top["screens"] == 1540 and top["release_date"] == "2026-07-24"


def test_parse_degrades_to_a_miss_never_a_wrong_record():
    for bad in ("", "not json", "{}", '{"boxOfficeResult": {}}',
                '{"boxOfficeResult": {"dailyBoxOfficeList": "nope"}}',
                '{"faultInfo": {"message": "잘못된 키값입니다."}}'):   # KOBIS's own error shape
        assert parse_boxoffice(bad) == []
    assert parse_boxoffice(json.dumps({"boxOfficeResult": {"weeklyBoxOfficeList": [
        {"rank": "1", "movieNm": "주간1위"}]}}))[0]["title"] == "주간1위"  # weekly endpoint too


def test_source_is_dormant_without_a_key(monkeypatch):
    monkeypatch.delenv("KOBIS_API_KEY", raising=False)
    out = asyncio.run(KobisSource().fetch_chart())
    assert out["entries"] == [] and "dormant" in out["note"]      # inert: no key, no call, no error


def test_a_blocked_fetch_is_a_skip_not_a_break(monkeypatch):
    monkeypatch.setenv("KOBIS_API_KEY", "test-key")
    src = KobisSource()
    src._http_get = lambda url: (_ for _ in ()).throw(OSError("egress blocked"))
    out = asyncio.run(src.fetch_chart())
    assert out["entries"] == [] and "fetch failed" in out["note"]


def test_key_never_leaks_into_the_published_citation(monkeypatch):
    monkeypatch.setenv("KOBIS_API_KEY", "SUPER-SECRET-KEY")
    src = KobisSource()
    seen = {}

    def _fake(url: str) -> str:
        seen["url"] = url
        return _RAW

    src._http_get = _fake
    out = asyncio.run(src.fetch_chart())
    assert "SUPER-SECRET-KEY" in seen["url"]                       # the key IS used on the wire...
    assert "SUPER-SECRET-KEY" not in json.dumps(out, ensure_ascii=False)  # ...never in the record
    assert out["citation"].startswith("KOFIC/KOBIS")


def test_ingest_stores_a_film_chart_alongside_the_music_chart():
    db = tempfile.mktemp(suffix=".db")
    box = {"entries": parse_boxoffice(_RAW), "citation": "KOFIC/KOBIS 20260729", "target_date": "20260729"}
    rec = asyncio.run(ingest_chart(box, db_path=db, entity_id="chart:kobis-boxoffice",
                                   name_ko="영화관입장권통합전산망 박스오피스", name_en="KOFIC Box Office",
                                   summary_en="KOFIC/KOBIS box office — 2 films (#1: 파묘 리덕스).",
                                   summary_ko="영화진흥위원회 박스오피스 — 2편 (1위: 파묘 리덕스)."))
    assert rec is not None and rec.entity_id == "chart:kobis-boxoffice" and rec.kind == "chart"
    assert rec.provenance.skill_score <= 0.7      # single official source -> honestly capped
    assert rec.data["entries"][0]["title"] == "파묘 리덕스"
    got = asyncio.run(store.latest("chart:kobis-boxoffice", "chart", db_path=db))
    assert got is not None and got.name.en_official == "KOFIC Box Office"
    # the music chart still lands on its own entity — one code path, two settlement charts
    music = asyncio.run(ingest_chart({"entries": [{"artist": "BTS", "title": "X"}],
                                      "citation": "Circle Chart"}, db_path=db))
    assert music.entity_id == "chart:circle-digital" and "Circle Digital Chart" in music.summary_en


def test_empty_entries_append_nothing():
    db = tempfile.mktemp(suffix=".db")
    assert asyncio.run(ingest_chart({"entries": []}, db_path=db,
                                    entity_id="chart:kobis-boxoffice")) is None


if __name__ == "__main__":
    import pytest

    raise SystemExit(pytest.main([__file__, "-q"]))
